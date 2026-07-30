# BMS Onboarding Guide / BMS 对接指南

> 最后更新: 2026-02-18

---

## 1. Overview / 概述

BMS（楼宇管理系统）对接是 FactVerse 平台的核心功能之一。通过标准化的对接流程，实施工程师可以在 **5 分钟内**将客户的 BMS 点位 CSV 文件转化为实时监控数据。

**核心价值：**

- **快速上线** — 从 CSV 上传到实时监控，最快 5 分钟完成
- **自动映射** — 内置 11 种 BMS 厂商模板，自动识别点位类型和设备归属
- **数据质量保障** — 导入前自动检测数据完整性、异常值和数据缺口
- **智能推荐** — 根据导入的设备类型自动推荐适用的分析模块

**典型场景：** 客户提供一份包含数千个 BMS 点位的 CSV 导出文件，实施工程师通过对接向导完成模板选择、自动映射、设备/传感器导入、数据质量检查，最终上线监控。

---

## 2. Supported Vendors / 支持的BMS厂商

平台内置以下 11 种 BMS 模板，覆盖主流楼宇自控厂商：

| 模板名称 | 厂商 | 点位匹配模式数 | 说明 |
|---|---|---|---|
| Honeywell | 霍尼韦尔 | 20+ | 支持 EBI、WEBs-AX 等多系列命名规范 |
| Siemens | 西门子 | 18 | 支持 Desigo CC、Insight 等系列 |
| JCI | 江森自控 | 3 | 支持 Metasys 系列 |
| Schneider | 施耐德 | 8 | 支持 EcoStruxure、TAC 系列 |
| ABB | ABB | 7 | 支持 ABB Ability 系列 |
| Tridium | Tridium | 5 | 支持 Niagara Framework |
| Azbil | 阿自倍尔 | 5 | 支持 savic-net 系列 |
| Delta | 台达 | 6 | 支持 LOYTEC / Delta Controls |
| BACnet | BACnet 通用 | 3 | 适用于标准 BACnet 点位命名 |
| Modbus | Modbus 通用 | 1 | 适用于 Modbus 寄存器映射 |
| Generic CSV | 通用 CSV | — | 无预定义模式，需手动映射 |

> **提示：** 如果客户的 BMS 不在上述列表中，请使用 **Generic CSV** 模板并手动映射。

---

## 3. Onboarding Flow / 对接流程

对接流程共 8 步，通过向导界面逐步完成：

```
① Select Template  →  ② Upload CSV  →  ③ Auto-Map  →  ④ Review
       ↓                                                    ↓
⑧ Recommend Modules ← ⑦ Data Quality Check ← ⑥ Import Sensors ← ⑤ Import Equipment
```

### Step ① 选择模板 (Select Template)

根据客户 BMS 厂商选择对应模板。如不确定，先查看 CSV 中点位名称的命名风格。

### Step ② 上传 CSV (Upload CSV)

上传客户提供的 BMS 点位导出文件。要求：
- 编码：**UTF-8**（必须）
- 格式：标准 CSV，含表头行
- 必需列：点位名称（point name）

### Step ③ 自动映射 (Auto-Map)

系统根据所选模板的正则表达式自动匹配点位，识别传感器类型、单位和所属设备。

### Step ④ 审核映射结果 (Review)

工程师检查自动映射结果，修正错误映射，补充未匹配的点位。

### Step ⑤ 导入设备 (Import Equipment)

确认设备列表后批量导入设备信息。

### Step ⑥ 导入传感器 (Import Sensors)

将映射完成的传感器批量导入，系统自动设置告警阈值（warn: 80, crit: 95）。

### Step ⑦ 数据质量检查 (Data Quality Check)

对导入的传感器数据进行完整性评分、异常值检测和数据缺口分析。

### Step ⑧ 模块推荐 (Recommend Modules)

根据已导入的设备类型，系统自动推荐适用的分析模块（如能耗分析、故障预测等）。

---

## 4. Auto-Mapping / 自动映射原理

### 工作机制

每个 BMS 模板在数据库中包含两个关键字段：

- **`sensor_patterns`** (JSONB 数组) — 传感器匹配规则，每条规则包含正则表达式、传感器类型和单位
- **`equipment_type_map`** (JSONB 对象) — 设备类型映射，将点位名称前缀映射到设备类型

### 匹配示例

以 Honeywell 模板为例：

```json
// sensor_patterns 示例
[
  {
    "regex": "AHU.*SAT",
    "type": "supply_air_temp",
    "unit": "°C",
    "description": "送风温度"
  },
  {
    "regex": "AHU.*RAT",
    "type": "return_air_temp",
    "unit": "°C",
    "description": "回风温度"
  },
  {
    "regex": "AHU.*SF.*STS",
    "type": "fan_status",
    "unit": "boolean",
    "description": "送风机状态"
  },
  {
    "regex": "CHW.*VLVPOS",
    "type": "valve_position",
    "unit": "%",
    "description": "冷冻水阀位"
  }
]
```

```json
// equipment_type_map 示例
{
  "AHU": "air_handling_unit",
  "FCU": "fan_coil_unit",
  "CHW": "chilled_water_system",
  "CT": "cooling_tower",
  "CH": "chiller"
}
```

当输入点位名 `AHU-01-SAT` 时：
1. 匹配 `equipment_type_map` 中的 `AHU` → 设备类型：`air_handling_unit`
2. 匹配 `sensor_patterns` 中的 `AHU.*SAT` → 传感器类型：`supply_air_temp`，单位：`°C`

### API 调用

```bash
curl -X POST https://factverse.ai/api/v1/onboarding/auto-map \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": 1,
    "pointNames": [
      "AHU-01-SAT",
      "AHU-01-RAT",
      "AHU-01-SF-STS",
      "FCU-3F-01-RAT",
      "CHW-VLVPOS-01"
    ]
  }'
```

> ⚠️ **注意：** 请求体为 JSON 格式（`Content-Type: application/json`），**不是** multipart/form-data。

**响应示例：**

```json
{
  "matched": 5,
  "total": 5,
  "matchRate": 100,
  "results": [
    {
      "pointName": "AHU-01-SAT",
      "equipmentType": "air_handling_unit",
      "equipmentName": "AHU-01",
      "sensorType": "supply_air_temp",
      "unit": "°C",
      "confidence": 0.95
    }
  ]
}
```

---

## 5. Data Import / 数据导入

### 5.1 导入设备

```bash
curl -X POST https://factverse.ai/api/v1/onboarding/import/equipment \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_abc123",
    "equipment": [
      {
        "name": "AHU-01",
        "type": "air_handling_unit",
        "location": "B1-机房",
        "description": "1号空调箱"
      },
      {
        "name": "FCU-3F-01",
        "type": "fan_coil_unit",
        "location": "3F-办公区",
        "description": "3楼风机盘管01"
      }
    ]
  }'
```

### 5.2 导入传感器

```bash
curl -X POST https://factverse.ai/api/v1/onboarding/import/sensors \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_abc123",
    "sensors": [
      {
        "pointName": "AHU-01-SAT",
        "equipmentName": "AHU-01",
        "sensorType": "supply_air_temp",
        "unit": "°C",
        "warn_threshold": 80,
        "crit_threshold": 95
      }
    ]
  }'
```

> ⚠️ **重要：** `warn_threshold` 和 `crit_threshold` 字段为 **NOT NULL**，必须提供值。默认值分别为 **80** 和 **95**。如果不传，导入将失败并报错。

### 5.3 示例 CSV 文件

平台提供示例文件供参考：`/samples/sample-bms-data.csv`

```csv
point_name,equipment_name,sensor_type,unit,description
AHU-01-SAT,AHU-01,supply_air_temp,°C,1号空调箱送风温度
AHU-01-RAT,AHU-01,return_air_temp,°C,1号空调箱回风温度
AHU-01-SF-STS,AHU-01,fan_status,boolean,1号空调箱送风机状态
FCU-3F-01-RAT,FCU-3F-01,return_air_temp,°C,3楼风机盘管01回风温度
CHW-VLVPOS-01,CHW-01,valve_position,%,冷冻水阀位01
```

---

## 6. Data Quality Check / 数据质量检查

导入传感器数据后，执行数据质量检查以确保数据可用于生产环境。

```bash
curl -X POST https://factverse.ai/api/v1/onboarding/data-quality/check \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_abc123"
  }'
```

> ⚠️ **注意：** 此接口为 **POST** 方法，不是 GET。

**检查项目：**

| 检查项 | 说明 | 评分标准 |
|---|---|---|
| 完整性 (Completeness) | 每个传感器在时间范围内的数据覆盖率 | 数据点数 / 预期数据点数 × 100 |
| 异常值 (Outlier Detection) | 基于统计方法检测异常数据 | 超出 3σ 范围的数据点比例 |
| 数据缺口 (Gap Analysis) | 检测连续缺失数据的时间段 | 最大缺口时长、缺口数量 |

**响应示例：**

```json
{
  "sessionId": "sess_abc123",
  "overallScore": 87.5,
  "sensorResults": [
    {
      "pointName": "AHU-01-SAT",
      "completeness": 95.2,
      "outlierRate": 0.3,
      "maxGapMinutes": 15,
      "gapCount": 2,
      "score": 92.0,
      "status": "good"
    },
    {
      "pointName": "FCU-3F-01-RAT",
      "completeness": 72.1,
      "outlierRate": 1.2,
      "maxGapMinutes": 120,
      "gapCount": 5,
      "score": 68.0,
      "status": "warning"
    }
  ]
}
```

---

## 7. Module Recommendation / 模块推荐

根据导入的设备类型自动推荐适用的分析模块：

```bash
curl -X GET "https://factverse.ai/api/v1/onboarding/recommend-modules?sessionId=sess_abc123" \
  -H "Authorization: Bearer <token>"
```

**响应示例：**

```json
{
  "recommendations": [
    {
      "module": "energy_analysis",
      "name": "能耗分析",
      "reason": "检测到 air_handling_unit 和 chiller 设备",
      "priority": "high"
    },
    {
      "module": "fault_detection",
      "name": "故障检测与诊断 (FDD)",
      "reason": "检测到 air_handling_unit 设备且传感器覆盖率 > 80%",
      "priority": "high"
    },
    {
      "module": "comfort_monitoring",
      "name": "舒适度监测",
      "reason": "检测到 fan_coil_unit 设备含温度传感器",
      "priority": "medium"
    }
  ]
}
```

---

## 8. API Reference / API参考

所有对接相关 API 端点汇总。Base URL: `https://factverse.ai/api/v1/onboarding`

### 认证

所有接口需要 Bearer Token 认证：

```bash
# 获取 token（示例使用 demo 账号）
curl -X POST https://factverse.ai/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@factverse.ai", "password": "demo2026"}'
```

### 端点列表

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/templates` | 获取所有 BMS 模板列表 |
| GET | `/templates/{id}` | 获取指定模板详情（含匹配规则） |
| POST | `/auto-map` | 自动映射点位 |
| POST | `/import/equipment` | 批量导入设备 |
| POST | `/import/sensors` | 批量导入传感器 |
| POST | `/data-quality/check` | 执行数据质量检查 |
| GET | `/recommend-modules` | 获取模块推荐 |
| GET | `/sessions` | 获取对接会话列表 |

### curl 示例

**获取模板列表：**

```bash
curl -X GET https://factverse.ai/api/v1/onboarding/templates \
  -H "Authorization: Bearer <token>"
```

**获取模板详情：**

```bash
curl -X GET https://factverse.ai/api/v1/onboarding/templates/1 \
  -H "Authorization: Bearer <token>"
```

**自动映射：**

```bash
curl -X POST https://factverse.ai/api/v1/onboarding/auto-map \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": 1,
    "pointNames": ["AHU-01-SAT", "AHU-01-RAT"]
  }'
```

**导入设备：**

```bash
curl -X POST https://factverse.ai/api/v1/onboarding/import/equipment \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_abc123",
    "equipment": [{"name": "AHU-01", "type": "air_handling_unit"}]
  }'
```

**导入传感器：**

```bash
curl -X POST https://factverse.ai/api/v1/onboarding/import/sensors \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_abc123",
    "sensors": [{
      "pointName": "AHU-01-SAT",
      "equipmentName": "AHU-01",
      "sensorType": "supply_air_temp",
      "unit": "°C",
      "warn_threshold": 80,
      "crit_threshold": 95
    }]
  }'
```

**数据质量检查：**

```bash
curl -X POST https://factverse.ai/api/v1/onboarding/data-quality/check \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "sess_abc123"}'
```

**模块推荐：**

```bash
curl -X GET "https://factverse.ai/api/v1/onboarding/recommend-modules?sessionId=sess_abc123" \
  -H "Authorization: Bearer <token>"
```

**获取会话列表：**

```bash
curl -X GET https://factverse.ai/api/v1/onboarding/sessions \
  -H "Authorization: Bearer <token>"
```

---

## 9. Troubleshooting / 常见问题

### ❌ `warn_threshold` NOT NULL 约束错误

**现象：** 导入传感器时报错 `null value in column "warn_threshold" violates not-null constraint`

**原因：** `warn_threshold` 和 `crit_threshold` 字段在数据库中为 NOT NULL，未传值时导入失败。

**解决：** 确保每个传感器都包含这两个字段。如无特殊需求，使用默认值：

```json
{
  "warn_threshold": 80,
  "crit_threshold": 95
}
```

### ❌ 自动映射匹配率 0%

**现象：** 调用 auto-map 后返回 `matchRate: 0`，所有点位均未匹配。

**原因：** 选择了错误的 BMS 模板。例如使用 Honeywell 模板匹配 Siemens 点位。

**解决：**
1. 检查 CSV 中点位的命名风格
2. 尝试切换其他厂商模板
3. 如仍无法匹配，使用 **Generic CSV** 模板手动映射

### ❌ CSV 编码错误

**现象：** 导入后数据中出现乱码（如 `Â°C`、`鎺掗寮忔帶`）。

**原因：** CSV 文件编码不是 UTF-8。常见于从 Windows 中文系统导出的 GBK/GB2312 编码文件。

**解决：**
1. 用文本编辑器（如 VS Code）打开 CSV，另存为 UTF-8 编码
2. 或使用命令行转换：
   ```bash
   iconv -f GBK -t UTF-8 input.csv > output.csv
   ```

### ❌ 设备名称重复

**现象：** 导入设备时报错 `duplicate key value violates unique constraint`。

**原因：** 同一项目下已存在同名设备。

**解决：**
1. 检查是否重复导入
2. 如需更新已有设备，先删除旧记录或使用更新接口
3. 确保 CSV 中无重复的设备名称行

---

## 10. Best Practices / 最佳实践

### ✅ 模板选择

- 如果客户 BMS 厂商不在支持列表中，**优先使用 Generic CSV 模板**
- 选择模板前先浏览 CSV 文件，确认点位命名风格与模板匹配
- 可通过 `GET /templates/{id}` 查看模板的匹配规则，人工确认适用性

### ✅ 自动映射验证

- 自动映射完成后，**务必逐一审核映射结果**
- 特别关注置信度（confidence）较低的映射项
- 对于未匹配的点位，手动补充传感器类型和设备归属
- 匹配率低于 50% 时建议切换模板或改用手动映射

### ✅ 数据导入

- 分批导入：设备数量较多时，建议分楼层或分系统导入
- 先导入设备，再导入传感器（传感器依赖设备存在）
- 始终设置 `warn_threshold` 和 `crit_threshold`，避免 NOT NULL 报错

### ✅ 上线前检查

- **必须执行数据质量检查**，确保数据完整性评分 > 80%
- 对评分低于 70% 的传感器，排查数据源是否正常
- 检查数据缺口是否在可接受范围内（建议最大缺口 < 30 分钟）

### ✅ 推荐工作流

```
1. 获取客户 CSV → 确认编码为 UTF-8
2. 识别 BMS 厂商 → 选择模板（不确定就用 Generic CSV）
3. 上传 CSV → 执行自动映射
4. 审核映射结果 → 修正 / 补充
5. 导入设备 → 导入传感器（注意 threshold 字段）
6. 执行数据质量检查 → 处理低分传感器
7. 查看模块推荐 → 启用适合的分析模块
8. 上线监控
```

---

*如有问题，请联系 FactVerse 技术支持团队。*
