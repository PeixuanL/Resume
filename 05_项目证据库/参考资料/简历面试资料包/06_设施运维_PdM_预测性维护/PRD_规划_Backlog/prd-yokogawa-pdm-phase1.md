# PRD: 横河川仪 PdM 一期 — 异常识别

> **版本**: 1.0  
> **日期**: 2026-03-11  
> **状态**: Draft  
> **作者**: SeattleBot / Jie  
> **范围**: Phase 1 POC — 异常识别（跑通流程、建立信任）

---

## 1. 背景与目标

### 1.1 项目背景

横河川仪（Chongqing Yokogawa）使用自研 **Sushi Sensor XS770A** 无线振动传感器监测旋转设备。当前依赖 DCS 阈值报警，存在以下痛点：

- **告警轰炸**：简单阈值产生大量误报，运维人员疲劳忽视
- **被动响应**：只能在设备已超限后告警，无法提前预警
- **单维度判断**：DCS 看单一传感器数值，无法做多通道关联分析
- **无退化趋势**：只有瞬时快照，看不到设备健康退化曲线

### 1.2 一期目标

> **核心目标：用多算法异常检测 pipeline 替代 DCS 简单阈值，在 Sushi Sensor 稀疏数据上做出 DCS 做不到的事。**

- ✅ 跑通"数据采集 → 异常检测 → 可视化"全流程
- ✅ 展示 ISO 10816 振动分级（零训练、即插即用）
- ✅ 展示多传感器轴间关联分析（DCS 做不到）
- ✅ 展示趋势预测（"预计 X 天后退化到 C 级"）
- ✅ 降噪：高置信度异常推送，低置信度告警抑制
- ❌ 不含：故障诊断、专家建议、工单联动（二期+）

### 1.3 分期规划

| 阶段 | 范围 | 状态 |
|------|------|------|
| **一期 POC** | 异常识别（本文档） | 🔵 进行中 |
| 二期 | 故障诊断（根因分析） | 待定 |
| 三期 | 专家建议（AI Advisor 定制） | 待定 |
| 四期 | 工单联动（PdM → Work Order 自动创建） | 待定 |

---

## 2. Sushi Sensor 数据特征

### 2.1 XS770A 传感器规格

| 参数 | 规格 |
|------|------|
| **型号** | Yokogawa Sushi Sensor XS770A |
| **测量参数** | 振动（加速度峰值 + 速度RMS）× X/Y/Z 三轴 + 合成值 + 表面温度 |
| **每传感器通道数** | 9（accel_x/y/z, vel_x/y/z, vel_composite, temperature） |
| **振动频率范围** | 10–1,000 Hz (±3 dB) |
| **加速度量程** | 0–130 m/s² (0–13.26 g) |
| **速度量程** | 0–20 mm/s RMS (0–0.79 in/s) |
| **温度范围** | −20 ~ 85°C，分辨率 0.1°C |
| **精度** | 单轴 ±10% FS，合成 ±20% FS |
| **通信协议** | LoRaWAN Class A (AES-128) |
| **采样间隔** | 可配 1 分钟 ~ 3 天，**当前设定 10 分钟** |
| **电池寿命** | 1h 间隔 ~4 年；10min 间隔约 1–2 年 |

### 2.2 数据特征对算法设计的影响

| 特征 | 影响 | 设计决策 |
|------|------|----------|
| 10 分钟间隔 = 144 点/天 | 中频数据，不算稀疏也不是高频流 | Kalman + Prophet 均适用 |
| 只有峰值/RMS，无 FFT 频谱 | 不能做经典频谱特征提取 | **用轴间比值替代频谱分析** |
| 9 通道/传感器 | 多变量关联丰富 | **轴间关联是核心竞争力** |
| ±10% FS 精度 | 传感器噪声不可忽略 | 需要 Kalman 滤波降噪 |
| 速度 RMS (mm/s) | 直接对应 ISO 10816 标准 | **ISO 分级零训练可用** |
| 温度 + 振动同一传感器 | 天然双模态关联 | 温升 + 振动升 = 轴承退化 |

### 2.3 数据接入架构

```
Sushi Sensor (XS770A)
    ↓ LoRaWAN
LoRaWAN Gateway
    ↓ MQTT
DFS Lite MQTT Connector
    ↓
sensor_readings 表
    ↓
PdM Anomaly Pipeline
```

> **POC 阶段**：使用模拟数据（已生成 60,480 条记录），数据格式完全匹配 Sushi Sensor 9 通道输出。  
> **生产部署**：DFS Lite MQTT Connector 直接对接 LoRaWAN 网关的 MQTT broker。

---

## 3. 异常检测 Pipeline

### 3.1 三层检测架构

```
新读数 (每10分钟)
         ↓
┌─── 第一层：ISO 10816 基线分级 ─────────────────────┐
│ 输入: vel_composite (速度RMS, mm/s)                  │
│ 输出: 振动等级 A/B/C/D                                │
│ 特点: 零训练，工业标准，即插即用                       │
│ 引擎: 规则引擎（无需 AI Engine）                      │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─── 第二层：多通道关联分析 ──────────────────────────┐
│ 输入: 9 通道原始值                                    │
│ 分析:                                                  │
│   · 轴间比值 (X:Y:Z) → 不对中/不平衡/松动检测        │
│   · 加速度/速度比 → 高频缺陷指示 (轴承缺陷)          │
│   · 温度-振动相关性 → 热退化信号                      │
│ 输出: 故障模式概率向量                                 │
│ 引擎: Distribution Fitting + 统计分析                  │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─── 第三层：趋势异常检测 ───────────────────────────┐
│ 输入: 最近 7 天历史序列                               │
│ 分析:                                                  │
│   · Kalman Filter → 状态估计 + 残差检测               │
│   · Prophet → 周期模式偏差                            │
│   · ADWIN → 均值漂移检测 (渐变退化)                   │
│ 输出: 趋势异常分数 0–100                              │
│ 引擎: AI Engine 现有路由                               │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─── 综合评分 ───────────────────────────────────────┐
│ ISO 等级权重:   40%  (A=0, B=30, C=70, D=100)       │
│ 轴间异常权重:   30%  (正常=0, 异常=0–100)           │
│ 趋势异常权重:   30%  (0–100)                         │
│                                                       │
│ 综合异常分 = Σ(权重 × 分值)                          │
│ 置信度 > 70 → 创建 anomaly_event                     │
│ 置信度 50–70 → 观察列表（不推送告警）                │
│ 置信度 < 50 → 抑制（降噪统计）                       │
└───────────────────────────────────────────────────┘
```

### 3.2 ISO 10816 振动严重性分级

适用于 Class I-IV 旋转机械（泵/电机/压缩机/风机）：

| 等级 | 速度 RMS (mm/s) | 含义 | 颜色 | 分值 |
|------|-----------------|------|------|------|
| **A** (Good) | < 2.8 | 新装/优秀状态 | 🟢 绿 | 0 |
| **B** (Acceptable) | 2.8 – 7.1 | 正常长期运行 | 🔵 蓝 | 30 |
| **C** (Alert) | 7.1 – 18.0 | 需要关注 | 🟡 黄 | 70 |
| **D** (Danger) | > 18.0 | 立即处理 | 🔴 红 | 100 |

> **注**: 不同机械类型阈值略有不同（ISO 10816-3/7）。一期使用通用阈值，后续可按设备类型细化。

### 3.3 轴间关联分析

基于 Sushi Sensor 三轴数据的旋转机械故障模式识别：

| 故障模式 | X:Y:Z 加速度特征 | 加速度/速度比 | 温度趋势 |
|----------|-------------------|---------------|----------|
| **不平衡** (Unbalance) | 径向轴(X或Y)显著偏高，轴向(Z)正常 | 正常 | 无变化 |
| **不对中** (Misalignment) | 轴向(Z)偏高，径向相对均匀 | 偏高 | 轻微升温 |
| **轴承缺陷** (Bearing) | 三轴加速度升高，速度相对稳定 | **显著偏高**（高频成分） | 持续升温 |
| **松动** (Looseness) | 三轴均高且波动大 | 正常 | 无规律 |
| **共振** (Resonance) | 某一轴极端偏高 | 极高 | 无变化 |

**检测算法**:

```python
# 轴间不对称度 (0=完美对称, 1=极端不对称)
asymmetry = std([accel_x, accel_y, accel_z]) / mean([accel_x, accel_y, accel_z])

# 高频缺陷指标 (加速度vs速度，正常约 0.5-2.0)
hf_index = vel_composite > 0 ? (accel_composite / vel_composite) : 0

# 温度-振动相关系数 (7天滑窗)
tv_corr = pearson_correlation(temperature_7d, vel_composite_7d)
```

### 3.4 趋势异常检测

利用 AI Engine 现有引擎：

**Kalman Filter** (`/ai/kalman/filter`):
- 输入: vel_composite 时间序列
- 输出: 预测值 + 残差。残差 > 2σ 判定为异常点
- 优势: 对 Sushi Sensor 的 ±10% FS 噪声有天然降噪能力

**Prophet** (`/ai/automl/forecast`):
- 输入: 7 天 vel_composite 序列
- 输出: 未来 48h 预测 + 置信区间
- 用途: "预计 X 天后从 B 级退化到 C 级"

**ADWIN** (`/ai/drift/adwin`):
- 输入: vel_composite 流式输入
- 输出: 漂移检测（True/False + 变化点位置）
- 用途: 检测渐变退化（COP 缓慢下降、振动缓慢上升）

### 3.5 降噪策略

| 场景 | DCS 行为 | FactVerse 行为 |
|------|----------|----------------|
| 传感器瞬时抖动 | 阈值告警 | Kalman 滤波后评估，置信度 < 50 → 抑制 |
| 短暂超限后回落 | 告警 → 恢复 → 告警循环 | 趋势分析判定为噪声，不告警 |
| 缓慢退化 | 不告警（未超阈值） | ADWIN 检测均值漂移，提前预警 |
| 三轴同时升高 | 3 条告警 | 关联分析合并为 1 条高置信度异常 |

**KPI**：目标告警量降低 80%+，同时零漏报关键异常。

---

## 4. 数据模型

### 4.1 sensor_readings 扩展

当前 sensor_readings 表已支持 Sushi Sensor 数据，每个传感器对应多个通道：

```
sensor_id: YK-COMP-001-VB    (振动传感器)
  → reading_type: accel_x | accel_y | accel_z | vel_x | vel_y | vel_z | vel_composite | temperature
  → value: float
  → timestamp: 每 10 分钟一个点
```

> 当前实现: 每传感器 5 通道（vibration, temperature, pressure, flow, power）。  
> 需调整: 扩展为 Sushi Sensor 9 通道结构，或映射到现有 5 通道（vel_composite→vibration, temperature→temperature, 其余通道用 metadata 扩展）。

### 4.2 anomaly_events 扩展

现有 `anomaly_events` 表需增加字段：

```sql
-- 新增字段（可通过 Flyway migration 添加）
ALTER TABLE anomaly_events ADD COLUMN IF NOT EXISTS iso_grade VARCHAR(1);        -- A/B/C/D
ALTER TABLE anomaly_events ADD COLUMN IF NOT EXISTS axis_asymmetry DOUBLE;       -- 轴间不对称度
ALTER TABLE anomaly_events ADD COLUMN IF NOT EXISTS hf_index DOUBLE;             -- 高频缺陷指标
ALTER TABLE anomaly_events ADD COLUMN IF NOT EXISTS tv_correlation DOUBLE;       -- 温度-振动相关
ALTER TABLE anomaly_events ADD COLUMN IF NOT EXISTS trend_score DOUBLE;          -- 趋势异常分
ALTER TABLE anomaly_events ADD COLUMN IF NOT EXISTS composite_score DOUBLE;      -- 综合异常分
ALTER TABLE anomaly_events ADD COLUMN IF NOT EXISTS fault_mode VARCHAR(50);      -- 故障模式推断
ALTER TABLE anomaly_events ADD COLUMN IF NOT EXISTS suppressed BOOLEAN DEFAULT FALSE; -- 是否被降噪抑制
```

### 4.3 equipment_health_snapshots 扩展

```sql
ALTER TABLE equipment_health_snapshots ADD COLUMN IF NOT EXISTS iso_grade VARCHAR(1);
ALTER TABLE equipment_health_snapshots ADD COLUMN IF NOT EXISTS predicted_grade_change_days INTEGER; -- 预计几天后等级变化
```

---

## 5. API 设计

### 5.1 AI Engine 新路由

**POST `/ai/pdm/anomaly-pipeline`**

触发完整异常检测 pipeline。可由定时任务（每 10 分钟）或手动调用。

```json
// Request
{
  "equipment_id": 71,
  "tenant_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "lookback_hours": 168,    // 7 天
  "channels": ["accel_x","accel_y","accel_z","vel_x","vel_y","vel_z","vel_composite","temperature"]
}

// Response
{
  "equipment_id": 71,
  "equipment_name": "Atlas Copco GA75",
  "timestamp": "2026-03-11T19:00:00Z",
  "iso_10816": {
    "vel_composite_rms": 4.2,
    "grade": "B",
    "score": 30
  },
  "axis_analysis": {
    "asymmetry": 0.35,
    "hf_index": 3.8,
    "tv_correlation": 0.72,
    "fault_modes": {
      "unbalance": 0.15,
      "misalignment": 0.08,
      "bearing_defect": 0.65,
      "looseness": 0.12
    },
    "score": 62
  },
  "trend_analysis": {
    "kalman_residual_zscore": 1.8,
    "prophet_forecast_deviation": 0.12,
    "adwin_drift_detected": true,
    "predicted_grade_change": {
      "from": "B",
      "to": "C",
      "days": 12
    },
    "score": 55
  },
  "composite": {
    "score": 48.1,
    "confidence": "medium",
    "action": "watchlist",
    "suppressed_count": 3
  }
}
```

**GET `/ai/pdm/iso-grades`**

批量获取所有设备 ISO 等级（Dashboard 用）：

```json
// Response
{
  "grades": [
    {"equipment_id": 71, "name": "Atlas Copco GA75", "grade": "B", "vel_rms": 4.2, "trend": "degrading"},
    {"equipment_id": 74, "name": "Carrier 30XA", "grade": "A", "vel_rms": 1.5, "trend": "stable"},
    ...
  ],
  "summary": {"A": 8, "B": 3, "C": 1, "D": 0, "unknown": 1}
}
```

**GET `/ai/pdm/axis-radar/{equipment_id}`**

设备三轴雷达图数据：

```json
{
  "equipment_id": 71,
  "axes": {
    "accel_x": 12.3, "accel_y": 11.8, "accel_z": 18.5,
    "vel_x": 3.2, "vel_y": 3.0, "vel_z": 5.1,
    "vel_composite": 4.2, "temperature": 62.3
  },
  "baselines": {
    "accel_x": 10.0, "accel_y": 10.2, "accel_z": 10.5,
    "vel_x": 2.5, "vel_y": 2.4, "vel_z": 2.6
  },
  "asymmetry": 0.35,
  "fault_mode": "bearing_defect"
}
```

### 5.2 Backend API

**GET `/api/v1/pdm/anomaly-pipeline/latest?equipmentId={id}`**

代理到 AI Engine，返回最新 pipeline 结果。

**GET `/api/v1/pdm/iso-overview`**

Dashboard 用，返回全设备 ISO 等级概览。

**GET `/api/v1/pdm/suppressed-alerts`**

返回被降噪抑制的告警统计（展示降噪价值）。

---

## 6. 前端页面

### 6.1 PdM Dashboard 升级

在现有 Dashboard 基础上增加：

**ISO 10816 概览卡片**（新增，页面顶部）:
- 4 个色块显示 A/B/C/D 设备数量
- 点击色块过滤设备列表
- 无需任何训练数据，接上 Sushi Sensor 即时显示

**降噪统计卡片**（新增）:
- "今日高置信度异常: X 个"
- "已抑制低置信度告警: Y 个（降噪率 Z%）"
- 体现平台 vs DCS 的核心价值

**设备健康趋势**（升级现有）:
- 现有健康分改为 7/30 天趋势线
- 标注预测等级变化点（"预计 12 天后 B→C"）

### 6.2 异常详情页升级

**多算法打分面板**（新增）:
- ISO 10816: B 级 (30分)
- 轴间分析: 62 分 — 疑似轴承缺陷
- 趋势分析: 55 分 — 检测到均值漂移
- **综合: 48 分 — 观察列表**

**三轴雷达图**（新增）:
- ECharts radar chart 显示 X/Y/Z 加速度 + 速度
- 叠加正常基线（虚线）
- 异常轴高亮标红

**故障模式推断**（新增）:
- 柱状图显示各故障模式概率
- 最高概率模式标签（"轴承缺陷 65%"）
- 附带简短解释（"加速度/速度比偏高，表面温度持续上升"）

### 6.3 设备详情页升级

**传感器通道选择器**（升级）:
- 下拉选择 9 个通道（而非当前的 5 个）
- 支持多通道叠加对比

**Kalman 滤波叠加**（新增）:
- 原始值（浅色）+ Kalman 估计值（深色）叠加
- 残差高亮区域（红色背景 = 异常残差）

---

## 7. 模拟数据调整

### 7.1 当前数据

- 60 传感器 × 1,008 点 = 60,480 条
- 5 通道 (vibration, temperature, pressure, flow, power)
- 10 分钟间隔，7 天
- 4 个异常注入场景

### 7.2 调整为 Sushi Sensor 格式

```
需新增通道: accel_x, accel_y, accel_z, vel_x, vel_y, vel_z
vel_composite 映射到现有 vibration 通道
temperature 保持不变
pressure/flow/power 仅对 DCS 传感器保留，Sushi Sensor 不输出
```

**异常注入升级**（符合旋转机械物理规律）:

| 设备 | 故障模式 | 数据特征 |
|------|----------|----------|
| GA75 压缩机 | 轴承退化 | accel 三轴升高，vel 相对稳定，hf_index 升高，温度持续上升 |
| Carrier 冷机 | 不对中 | accel_z 偏高 (>1.5×径向)，轻微温升 |
| AHU-04 风机 | 不平衡 | accel_x 显著偏高，Y/Z 正常，温度无变化 |
| 真空泵 | 松动 | 三轴均高且波动大 (std > 30%)，温度无规律 |

### 7.3 实施方式

用 PL/pgSQL 脚本更新现有 sensor_readings，补充三轴通道数据。不删除现有数据，追加新通道。

---

## 8. 技术实现计划

### 8.1 后端

| 任务 | 工作量 | 优先级 |
|------|--------|--------|
| Flyway migration: anomaly_events 扩展字段 | 0.5 天 | P0 |
| AI Engine: `/ai/pdm/anomaly-pipeline` 路由 | 1.5 天 | P0 |
| AI Engine: `/ai/pdm/iso-grades` 路由 | 0.5 天 | P0 |
| AI Engine: `/ai/pdm/axis-radar` 路由 | 0.5 天 | P0 |
| Backend: proxy controllers | 0.5 天 | P0 |
| 模拟数据升级（三轴 + 故障模式注入） | 1 天 | P0 |

### 8.2 前端

| 任务 | 工作量 | 优先级 |
|------|--------|--------|
| Dashboard: ISO 10816 概览卡片 | 0.5 天 | P0 |
| Dashboard: 降噪统计卡片 | 0.5 天 | P0 |
| Dashboard: 健康趋势线升级 | 0.5 天 | P1 |
| 异常详情: 多算法打分面板 | 0.5 天 | P0 |
| 异常详情: 三轴雷达图 | 0.5 天 | P0 |
| 异常详情: 故障模式推断柱状图 | 0.5 天 | P1 |
| 设备详情: Kalman 滤波叠加 | 0.5 天 | P1 |

### 8.3 总工作量

| 类别 | 天数 |
|------|------|
| 后端 + AI Engine | 4.5 天 |
| 前端 | 3 天 |
| 测试 + 联调 | 1.5 天 |
| **总计** | **9 天** |

---

## 9. 验收标准

### 9.1 功能验收

- [ ] ISO 10816 分级正确（vel_composite → A/B/C/D）
- [ ] 轴间不对称度计算正确，故障模式推断合理
- [ ] Kalman 滤波降噪效果可见（原始值 vs 滤波值叠加图）
- [ ] ADWIN 能检测到 GA75 振动渐变退化
- [ ] Prophet 能预测 "X 天后等级变化"
- [ ] 综合评分 > 70 自动创建 anomaly_event
- [ ] 评分 50-70 进入观察列表，< 50 被抑制
- [ ] 降噪统计面板显示抑制告警数量

### 9.2 数据验收

- [ ] 13 台设备的 Sushi Sensor 9 通道数据完整
- [ ] 4 个异常场景符合旋转机械物理规律
- [ ] 异常注入能被 pipeline 正确检测

### 9.3 演示场景

**Demo 流程** (5 分钟):

1. 打开 Dashboard → 展示 ISO 概览（8A + 3B + 1C + 0D + 1Unknown）
2. 点击 C 级设备 → 进入异常详情 → 展示三层打分
3. 展示三轴雷达图 → "Z 轴加速度偏高，疑似不对中"
4. 展示趋势线 → "预计 12 天后从 B 退化到 C"
5. 展示降噪面板 → "今日抑制 47 条低置信度告警"

**一句话卖点**:

> "DCS 今天给了你 50 条告警，80% 是噪声。FactVerse 给你 3 条高置信度异常，每条告诉你是什么故障、多大把握、还有几天。"

---

## 10. 可扩展性（二期+预留）

一期 pipeline 的架构设计为二期+ 预留扩展点：

| 扩展方向 | 一期预留 | 二期实现 |
|----------|----------|----------|
| 故障诊断 | `fault_mode` 字段已有概率向量 | 添加诊断知识库 + 根因分析 |
| 专家建议 | pipeline response 预留 `recommendations` 字段 | 接入 AI Advisor + 维修知识库 |
| 工单联动 | `composite_score > 阈值` 触发点已明确 | 自动创建 Work Order |
| FFT 频谱 | 当前用轴间比值替代 | 二期接入 Yokogawa e-RT3 或 DCS 高频数据 |
| 机器学习 | 一期规则+统计为主 | 二期积累数据后训练 isolation forest / autoencoder |

---

## 附录 A: 现有 AI Engine 引擎复用

| 引擎 | 路由 | 一期用途 |
|------|------|----------|
| Kalman Filter | `/ai/kalman/filter` | 状态估计 + 残差异常检测 |
| Prophet/AutoML | `/ai/automl/forecast` | 趋势预测 + 偏差检测 |
| ADWIN Drift | `/ai/drift/adwin` | 均值漂移检测（渐变退化） |
| Distribution Fitting | `/ai/fitting/fit` | 传感器正常分布建模 |
| Monte Carlo | `/ai/simulation/monte-carlo` | 备用: 故障场景模拟 |
| Causal Inference | `/ai/causal/estimate` | 备用: 多传感器因果分析 |

## 附录 B: 参考标准

- **ISO 10816-3**: 工业机械振动评估（速度 RMS 分级）
- **ISO 13373-1**: 状态监测和诊断 — 振动状态监测
- **ISO 17359**: 状态监测和诊断 — 一般指南
