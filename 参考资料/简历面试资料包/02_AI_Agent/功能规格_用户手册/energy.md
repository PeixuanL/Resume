# Energy 能源管理模块 — User Guide

**版本 Version:** 2026-04-08  
**维护 Maintained by:** AzureBot (DataMesh)  
**适用对象 Audience:** 客户、售前、内部团队

---

## 目录 Table of Contents

1. [模块概述 Module Overview](#1-模块概述-module-overview)
2. [导航结构 Navigation](#2-导航结构-navigation)
3. [能源仪表盘 Energy Dashboard](#3-能源仪表盘-energy-dashboard)
4. [碳排放管理 Carbon Management](#4-碳排放管理-carbon-management)
5. [能源计量设备 Energy Meters](#5-能源计量设备-energy-meters)
6. [对标分析 Benchmarking](#6-对标分析-benchmarking)
7. [AI Advisor 智能顾问](#7-ai-advisor-智能顾问)

---

## 1. 模块概述 Module Overview

### 1.1 什么是 Energy？

**Energy（能源管理模块）** 是 DataMesh FactVerse 平台的智能能源管理模块，支持碳排放追踪、能源计量、对标分析和节能机会识别。

**核心价值主张：**
- 实时碳排放追踪（范围 1/2/3）
- 多能源类型计量（水、电、燃气、蒸汽）
- 同类设施对标分析（PUE / kWh/m²）
- 碳减排路径规划与追踪

**目标场景：**
- 商业楼宇能源管理
- 工厂能源监控
- 数据中心能效管理（PUE）
- 碳合规报告

### 1.2 导航结构 Navigation

| 路由 Path | 页面 Page |
|---|---|
| `/energy/dashboard` | 能源总览仪表盘 |
| `/energy/carbon` | 碳排放管理 |
| `/energy/meters` | 能源计量设备 |
| `/energy/benchmark` | 对标分析 |

### 1.3 关键 AI 端点

| 方法 | 端点 | 描述 |
|---|---|---|
| `POST` | `/ai/energy/pue` | 数据中心 PUE 分析 |
| `POST` | `/ai/energy/carbon/calculate` | 碳排放计算 |
| `POST` | `/ai/energy/benchmark` | 对标分析 |
| `GET` | `/ai/energy/meters` | 计量设备列表 |

---

## 2. 导航结构 Navigation

（见上节 1.2）

---

## 3. 能源仪表盘 Energy Dashboard

### 3.1 功能页面

- **Dashboard** (`/energy/dashboard`): 全厂能源消耗总览，包含实时和历史趋势

### 3.2 主要指标

| 指标 | 描述 | 数据来源 |
|---|---|---|
| Total Energy | 总能耗（kWh） | 计量表汇总 |
| Peak Demand | 最大需量（kW） | 需量表 |
| Energy Cost | 能源成本（$） | 电费账单 |
| Carbon Intensity | 碳排放强度（kgCO₂/kWh） | 电网因子 |

### 3.3 Use Case UC1：查看当日能源消耗趋势

**操作步骤：**
1. 进入 `/energy/dashboard`
2. 选择日期范围（今日 / 本周 / 本月）
3. 查看分时能耗柱状图（每 15 分钟）
4. 识别高峰时段（9:00–11:00、14:00–16:00）
5. 点击高峰柱体，下钻查看该时段主要耗能设备

---

## 4. 碳排放管理 Carbon Management

### 4.1 功能页面

- **Carbon** (`/energy/carbon`): 碳排放趋势、排放源分析、减排追踪

### 4.2 碳排放范围

| 范围 | 描述 | 来源 |
|---|---|---|
| 范围 1 | 直接排放 | 燃气锅炉、厂内车辆 |
| 范围 2 | 间接排放（外购电力） | 外购电力 |
| 范围 3 | 价值链排放 | 外购蒸汽、员工通勤 |

### 4.3 Use Case UC2：月度碳排放报告

**操作步骤：**
1. 进入 `/energy/carbon`
2. 选择报表月份（2026-03）
3. 查看各范围碳排放占比（饼图）
4. 与上月对比（柱状图）
5. 点击"导出报告" → 生成 PDF / Excel

**预期结果：** 月度碳排放报告生成时间 <30 秒，包含范围 1/2/3 详细拆解。

---

## 5. 能源计量设备 Energy Meters

### 5.1 功能页面

- **Meters** (`/energy/meters`): 计量设备清单、实时读数、历史数据

### 5.2 支持能源类型

| 类型 | 单位 | 常见设备 |
|---|---|---|
| 电力 | kWh | 电表、智能断路器 |
| 天然气 | m³ | 燃气表 |
| 蒸汽 | kg | 蒸汽流量计 |
| 冷水 | m³ | 冷量表 |
| 热水 | GJ | 热表 |

### 5.3 Use Case UC3：计量设备数据校准

**操作步骤：**
1. 进入 `/energy/meters`
2. 选择目标计量设备，查看最近读数
3. 点击"校准" → 输入现场抄表读数
4. 系统计算修正系数，更新历史数据
5. 重新生成受影响时间段的数据

---

## 6. 对标分析 Benchmarking

### 6.1 功能页面

- **Benchmark** (`/energy/benchmark`): 同类建筑/设施能效对标

### 6.2 对标指标

| 指标 | 公式 | 说明 |
|---|---|---|
| EUI | kWh/m²/年 | 能源使用强度 |
| PUE | IT Equipment Power / Total Facility Power | 数据中心能效 |
| Carbon Intensity | kgCO₂/kWh | 电网碳排放因子 |
| Renewable % | 可再生能源占比 | 绿电证书 |

### 6.3 Use Case UC4：数据中心 PUE 分析

**操作步骤：**
1. 进入 `/energy/benchmark`
2. 选择"PUE 对标"
3. 输入设施参数：IT 负载(kW)、冷却系统类型、气候区
4. 调用 `POST /ai/energy/pue`
5. 查看：
   - 当前 PUE vs 最优 PUE
   - 分项能耗分解（IT / 冷却 / 照明 / 其他）
   - PUE 优化建议（提高冷却温度设定、变频优化）

---

## 7. AI Advisor 智能顾问

| 示例问题 | 调用工具 |
|---|---|
| "本月总碳排放是多少？" | `get_energy_carbon_summary` |
| "哪个设施能效最差？" | `get_energy_benchmark` |
| "帮我分析PUE异常的原因" | `POST /ai/energy/pue` |
| "生成能源月报" | `POST /ai/energy/report` |

---

*最后更新：2026-04-08 | AzureBot (DataMesh)*
