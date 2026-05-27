# Smart FM 用户指南

## Overview / 概述

Smart FM（智慧设施管理）模块为设施管理人员提供**预测性维护**能力，帮助您从"坏了再修"转向"提前预防"。

核心功能包括：

- **RCFA 根因分析** — 告警触发后自动生成故障根因分析报告
- **Weibull 可靠性分析** — 基于历史故障数据预测设备可靠性与最佳更换时机
- **LCC 全寿命周期成本** — 从采购到报废的全生命周期成本核算
- **设备健康评分** — 综合传感器、告警、维保记录的设备健康度评估
- **AI 诊断** — AI 驱动的故障原因推断与处置建议

> **导航路径：** 主菜单 → 智慧设施管理 → 对应子模块

---

## FMS Dashboard / FMS仪表盘

仪表盘是 Smart FM 的入口页面，展示设施运维的关键指标（KPI）。

**导航路径：** 智慧设施管理 → 仪表盘

### 核心指标

| 指标 | 说明 |
|------|------|
| 设备总数 | 纳管设备数量 |
| 活跃告警 | 当前未关闭的告警数 |
| 待处理工单 | 状态为"进行中"的维修工单数 |
| MTBF | 平均故障间隔时间（Mean Time Between Failures） |
| MTTR | 平均修复时间（Mean Time To Repair） |

### API

```
GET /api/v1/fms/dashboard
```

**响应示例：**

```json
{
  "equipmentCount": 128,
  "activeAlerts": 7,
  "openWorkOrders": 12,
  "mtbf": 2160.5,
  "mttr": 4.2
}
```

---

## Root Cause Failure Analysis / RCFA根因分析

当设备告警触发时，系统会**自动生成 RCFA 报告**，引导您通过结构化流程找到故障根本原因。

**导航路径：** 智慧设施管理 → 告警列表 → 点击告警 → RCFA 分析

### 工作流程

1. **告警触发** — 系统检测到异常，生成告警
2. **自动创建 RCFA** — 系统预填设备信息、告警数据
3. **5-Why 分析** — 逐层追问"为什么"，找到根本原因
4. **识别贡献因素** — 记录所有促成故障的因素
5. **制定纠正措施** — 明确整改方案并跟踪执行
6. **验证关闭** — 确认纠正措施有效后关闭 RCFA

### API

**查看/创建 RCFA：**

```
GET  /api/v1/fms/alerts/{alertId}/rcfa
POST /api/v1/fms/alerts/{alertId}/rcfa
```

**POST 请求体示例：**

```json
{
  "fiveWhys": [
    "为什么水泵停机？— 电机过热保护跳闸",
    "为什么电机过热？— 轴承磨损导致摩擦增大",
    "为什么轴承磨损？— 润滑不足",
    "为什么润滑不足？— 未按计划执行润滑保养",
    "为什么未执行？— 保养计划未纳入工单系统"
  ],
  "contributingFactors": ["保养计划缺失", "备件库存不足"],
  "correctiveActions": ["将润滑保养纳入预防性维护计划", "建立备件安全库存"]
}
```

**验证 RCFA：**

```
PUT /api/v1/fms/rcfa/{id}/verify
```

```json
{
  "verified": true,
  "verifiedBy": "张工",
  "remarks": "纠正措施已落实，连续运行30天无复发"
}
```

---

## Weibull Reliability / Weibull可靠性分析

Weibull 分析基于设备历史故障数据，拟合可靠性曲线，帮助您判断**设备处于生命周期的哪个阶段**以及**最佳更换时机**。

**导航路径：** 智慧设施管理 → 设备列表 → 选择设备 → 可靠性分析

### 关键参数

| 参数 | 含义 |
|------|------|
| β（形状参数） | β < 1：早期故障；β ≈ 1：随机故障；β > 1：磨损故障 |
| η（尺度参数） | 特征寿命，约 63.2% 的设备在此时间前失效 |
| 可靠度曲线 | 设备在某时刻仍正常运行的概率 |
| 故障概率 | 设备在某时刻前发生故障的概率 |
| 最佳更换时机 | 综合可靠性和成本的推荐更换时间点 |

### API

**查看设备 Weibull 分析结果：**

```
GET /api/v1/fms/equipment/{id}/weibull
```

**响应示例：**

```json
{
  "beta": 2.3,
  "eta": 8760,
  "reliabilityAtCurrentAge": 0.82,
  "failureProbability": 0.18,
  "optimalReplacementHours": 7500,
  "dataPoints": 24
}
```

**AI 可靠性分析接口：**

```
POST /ai/reliability/weibull/fit        # 拟合 Weibull 参数
POST /ai/reliability/weibull/predict    # 预测未来可靠性
POST /ai/reliability/weibull/from-db    # 从数据库历史记录直接拟合
```

**拟合请求示例：**

```json
POST /ai/reliability/weibull/fit
{
  "failureTimes": [1200, 3400, 5600, 7800, 2300, 4100]
}
```

---

## Life Cycle Cost / LCC全寿命周期成本

LCC 分析将设备从采购到报废的**全部成本**可视化，帮助您做出更经济的设备管理决策。

**导航路径：** 智慧设施管理 → 设备列表 → 选择设备 → 寿命周期成本

### 成本构成

| 阶段 | 包含项目 |
|------|---------|
| 采购成本 | 设备购置、安装调试、培训 |
| 运行成本 | 能耗、人工、耗材 |
| 维护成本 | 预防性维护、故障维修、备件 |
| 处置成本 | 拆除、环保处理、残值回收 |

### API

**查看设备 LCC 详情：**

```
GET /api/v1/fms/equipment/{id}/lcc
```

**响应示例：**

```json
{
  "equipmentId": "EQ-001",
  "acquisitionCost": 150000,
  "operationCost": 320000,
  "maintenanceCost": 180000,
  "disposalCost": 15000,
  "totalLCC": 665000,
  "currentAge": 5,
  "expectedLifespan": 15,
  "annualizedCost": 44333
}
```

**LCC 汇总（多设备对比）：**

```
GET /api/v1/fms/equipment/{id}/lcc/summary
```

---

## Equipment Health / 设备健康评分

健康评分将传感器读数、告警历史和维保记录综合为一个**0–100 的评分**，直观反映设备当前状态。

**导航路径：** 智慧设施管理 → 设备列表 → 选择设备 → 健康概览

### 评分维度

- **传感器数据** — 温度、振动、压力等实时读数是否在正常范围
- **告警历史** — 近期告警频率与严重程度
- **维保记录** — 预防性维护是否按计划执行、故障维修频次

### API

```
GET /api/v1/fms/equipment/{id}/reliability-stats
```

**响应示例：**

```json
{
  "equipmentId": "EQ-001",
  "healthScore": 78,
  "status": "良好",
  "sensorScore": 85,
  "alertScore": 70,
  "maintenanceScore": 80,
  "lastUpdated": "2026-02-18T08:00:00Z",
  "trend": "stable"
}
```

> **提示：** 健康评分低于 60 时系统会自动生成告警，建议优先安排检查。

---

## AI Diagnosis / AI诊断

AI 诊断在告警触发时自动分析故障原因，给出**可能的根因、置信度评分和建议处置措施**。

**导航路径：** 智慧设施管理 → 告警列表 → 点击告警 → AI 诊断

### API

```
GET /api/v1/fms/alerts/{alertId}/diagnosis
```

**响应示例：**

```json
{
  "alertId": "ALT-20260218-003",
  "possibleCauses": [
    {
      "cause": "冷却风扇故障导致电机过热",
      "confidence": 0.85,
      "evidence": ["温度传感器持续升高", "振动频谱异常"]
    },
    {
      "cause": "负载过大",
      "confidence": 0.45,
      "evidence": ["电流读数偏高"]
    }
  ],
  "recommendedActions": [
    "检查冷却风扇运转状态",
    "清洁散热通道",
    "核实当前负载是否超出额定值"
  ]
}
```

> **注意：** AI 诊断为辅助建议，最终判断仍需现场工程师确认。

---

## Integration with Base Platform / 与基盘联动

Smart FM **不维护独立的设备、告警、工单实体**，而是复用基盘（Base Platform）的核心数据模型，确保数据一致性。

### 复用的基盘实体

| FMS 功能 | 基盘实体 | 说明 |
|----------|---------|------|
| 设备管理 | Equipment | 设备台账、属性、位置信息 |
| 告警管理 | Alert | 告警生成、状态流转 |
| 工单管理 | WorkOrder | 维修任务创建、派发、完工 |

### 核心业务流程

```
告警触发 (Alert)
    ↓
自动生成 RCFA 分析
    ↓
AI 诊断提供根因建议
    ↓
确认根因 & 制定纠正措施
    ↓
创建维修工单 (WorkOrder)
    ↓
执行维修 → 验证关闭 RCFA
```

### 优势

- **数据不重复** — 设备信息在基盘维护一次，FMS 直接引用
- **流程贯通** — 从告警到工单无缝衔接，无需手动搬运数据
- **统一权限** — 沿用基盘的角色与权限体系
