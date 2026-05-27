# HVAC/VAV 智能控制模块 — User Guide

**版本 Version:** 2026-04-08  
**维护 Maintained by:** AzureBot (DataMesh)  
**适用对象 Audience:** 客户、售前、内部团队

---

## 目录 Table of Contents

1. [模块概述 Module Overview](#1-模块概述-module-overview)
2. [导航结构 Navigation](#2-导航结构-navigation)
3. [VAV 区域管理 Zone Management](#3-vav-区域管理-zone-management)
4. [AHU 仪表盘 AHU Dashboard](#4-ahu-仪表盘-ahu-dashboard)
5. [静态压力分析 Static Pressure Analysis](#5-静态压力分析-static-pressure-analysis)
6. [控制精度诊断 Control Accuracy Diagnostics](#6-控制精度诊断-control-accuracy-diagnostics)
7. [AI 告警与事件 Events & Alerts](#7-ai-告警与事件-events--alerts)
8. [AI Advisor 智能顾问](#8-ai-advisor-智能顾问)

---

## 1. 模块概述 Module Overview

### 1.1 什么是 HVAC/VAV？

**HVAC/VAV（变风量空调系统）** 是 DataMesh FactVerse 平台的智能楼宇控制诊断模块，专注于 VAV（Variable Air Volume）终端的控制精度诊断、振荡检测、偏差分析和静压优化。

**核心价值主张：**
- 实时诊断 VAV 终端控制精度（ damper 响应 vs 温度设定点）
- FFT 振荡检测，识别控制回路不稳定
- 理论风量 vs 实际风量偏差分析
- 静压优化，降低风机能耗 10–20%

**目标场景：**
- 商业楼宇 HVAC 系统
- 工厂洁净厂房（MAU + VAV）
- 医院负压隔离病房

### 1.2 系统架构 System Architecture

```
用户浏览器 (Vue 3 Frontend)
       │
       ▼
Backend API  (port 8080 · Bearer Token)
  └── GET /api/v1/hvacvav/*
       │
       ├──► Database (PostgreSQL · VAV配置、传感器读数)
       │
       └──► AI Engine  (port 8000 · X-API-Key)
              └── POST /ai/hvacops/vav/*
                  ├── /responsiveness      (阻尼响应分析)
                  ├── /oscillation         (振荡检测)
                  ├── /deviation          (风量偏差分析)
                  ├── /static-pressure     (静压优化)
                  └── /diagnostics/summary (综合诊断)
```

### 1.3 AI 分析引擎

| 引擎 | 文件 | 描述 |
|---|---|---|
| `ResponsivenessAnalyzer` | `modules/vav/responsiveness.py` | 阀门动作 vs 温度相关性，PID 响应评分 |
| `OscillationDetector` | `modules/vav/oscillation.py` | FFT 高频振荡检测（damper 拍打） |
| `DeviationAnalyzer` | `modules/vav/deviation.py` | 理论风量 vs 实际风量偏差分析 |
| `StaticPressureOptimizer` | `modules/vav/static_pressure.py` | 关键末端 ID + 静压设定点推荐 |

### 1.4 关键 AI 端点

| 方法 | 端点 | 描述 |
|---|---|---|
| `POST` | `/ai/hvacops/vav/responsiveness` | 分析 VAV 终端响应速度 |
| `POST` | `/ai/hvacops/vav/oscillation` | FFT 振荡检测 |
| `POST` | `/ai/hvacops/vav/deviation` | 理论 vs 实际风量偏差 |
| `POST` | `/ai/hvacops/vav/static-pressure` | 静压优化推荐 |
| `POST` | `/ai/hvacops/vav/diagnostics/summary` | 综合诊断报告 |

---

## 2. 导航结构 Navigation

| 路由 Path | 页面 Page |
|---|---|
| `/hvacvav/overview` | VAV 系统总览仪表盘 |
| `/hvacvav/zones` | VAV 区域列表 |
| `/hvacvav/zones/:zoneId` | 区域详情（含诊断） |
| `/hvacvav/ahu` | AHU 仪表盘 |
| `/hvacvav/ahu/:ahuId` | 单台 AHU 静压控制详情 |
| `/hvacvav/events` | HVAC 事件与告警 |

---

## 3. VAV 区域管理 Zone Management

### 3.1 功能页面

- **Zone List** (`/hvacvav/zones`): 所有 VAV 区域清单，含设定点温度、实际温度、风阀开度、控制状态
- **Zone Detail** (`/hvacvav/zones/:zoneId`): 单区域完整信息——温湿度趋势、风量偏差、控制精度评分、当前告警

### 3.2 Use Case UC1：VAV 区域温度控制偏差诊断

**描述：** 某区域温度持续偏离设定值，检查 VAV 末端控制精度是否正常。

**操作步骤：**
1. 进入 `Zone List`，找到目标区域，查看 `temp_deviation` 列
2. 点击进入 `Zone Detail`，观察 `actual_temp` vs `setpoint` 趋势
3. 点击"运行诊断" → 调用 `POST /ai/hvacops/vav/responsiveness`
4. 查看返回的 `responsiveness_score`（0–100）和 `damper_action_rate`

**预期结果：** 响应评分 <60 分时，系统提示 damper 响应迟滞或 PID 参数需调整。

---

## 4. AHU 仪表盘 AHU Dashboard

### 4.1 功能页面

- **AHU List** (`/hvacvav/ahu`): 所有 AHU（空气处理机组）汇总，含冷/热量、送风温度、静压设定点
- **AHU Pressure Detail** (`/hvacvav/ahu/:ahuId`): 单台 AHU 静压控制分析——送风静压趋势、末端压差分布、优化推荐

### 4.2 Use Case UC2：AHU 静压优化

**描述：** 风机能耗过高，评估是否可以降低静压设定点同时保证所有末端风量。

**操作步骤：**
1. 进入 `AHU Dashboard`，选择目标 AHU
2. 点击进入 `AHU Pressure Detail`
3. 点击"静压优化" → 调用 `POST /ai/hvacops/vav/static-pressure`
4. 输入：`cooling_demand_kw`、`ambient_temp_c`
5. 系统返回：
   - `recommended_duct_pressure_pa`: 推荐静压值
   - `estimated_energy_saving_kwh`: 预计节能
   - `critical_terminals`: 关键末端列表（限制进一步降压）

**预期结果：** 输出推荐静压值和节能估算，帮助 HVAC 工程师调整变频器（VFD）设定。

---

## 5. 静态压力分析 Static Pressure Analysis

### 5.1 分析内容

- 各 VAV 末端的风量需求 vs 实际风量
- 关键末端识别（决定最低静压的末端）
- 静压设定点推荐（满足所有末端需求的最低值）
- 风管压降分析

### 5.2 Use Case UC3：关键末端识别

**描述：** 某 VAV 系统静压设定偏高，希望找到可以微调的末端。

**操作步骤：**
1. 在 `AHU Pressure Detail` 页，点击"静态压力分析"
2. 调用 `POST /ai/hvacops/vav/static-pressure`
3. 查看 `critical_terminals` 列表——这些末端的阀门已接近全开，是静压无法继续降低的瓶颈
4. 查看 `non_critical_terminals`——这些有调整空间

**预期结果：** 识别出静压优化空间，避免过度供能。

---

## 6. 控制精度诊断 Control Accuracy Diagnostics

### 6.1 振荡检测 Oscillation Detection

**描述：** VAV damper 控制回路高频振荡（oscillation），导致能耗浪费和设备磨损。

**诊断方法：**
- FFT 变换检测频率成分
- 振荡幅度（oscillation amplitude）vs 正常阈值
- 振荡持续时间

**操作步骤：**
1. 在 `Zone Detail` 页，点击"振荡检测"
2. 调用 `POST /ai/hvacops/vav/oscillation`
3. 系统返回：
   - `oscillation_detected`: boolean
   - `dominant_frequency_hz`: 主要振荡频率
   - `severity`: LOW / MEDIUM / HIGH
   - `damper_action_rate`: 阀门动作频率（次/分钟）

### 6.2 偏差分析 Deviation Analysis

**描述：** 理论风量（根据阀门开度和压差计算）vs 实际测量风量的偏差。

**操作步骤：**
1. 在 `Zone Detail` 页，点击"风量偏差分析"
2. 调用 `POST /ai/hvacops/vav/deviation`
3. 系统返回：
   - `deviation_ratio`: 偏差比例（%）
   - `zones_over_threshold`: 超阈值区域列表
   - `probable_cause`: 可能原因（传感器故障 / 阀门卡滞 / 风管泄漏）

---

## 7. AI 告警与事件 Events & Alerts

### 7.1 事件类型

| 事件类型 | 描述 | 严重程度 |
|---|---|---|
| `HVAC_Oscillation` | VAV 终端高频振荡 | HIGH |
| `HVAC_Deviation` | 风量偏差超阈值 | MEDIUM |
| `HVAC_StaticPressure` | 静压异常 | HIGH |
| `HVAC_Unresponsive` | 终端控制无响应 | HIGH |
| `AHU_Overload` | AHU 冷热量超载 | MEDIUM |

### 7.2 查看事件

- **Events Page** (`/hvacvav/events`): 按时间倒序显示所有 HVAC 告警
- 支持按 `event_type`、`severity`、`date_range` 筛选
- 点击事件可下钻至对应 Zone Detail 或 AHU 详情

---

## 8. AI Advisor 智能顾问

HVAC/VAV 模块已接入 AI Advisor，可通过自然语言查询诊断结果：

| 示例问题 | 调用工具 |
|---|---|
| "Zone A-12 的控制精度评分是多少？" | `get_equipment_status` (HVAC 模式) |
| "最近有哪个 AHU 检测到振荡？" | `get_proactive_alerts` (HVAC) |
| "2号 AHU 的静压优化建议是什么？" | `POST /ai/hvacops/vav/static-pressure` |
| "帮我分析 Zone B-3 的温度偏差原因" | `POST /ai/hvacops/vav/diagnostics/summary` |

---

*最后更新：2026-04-08 | AzureBot (DataMesh)*
