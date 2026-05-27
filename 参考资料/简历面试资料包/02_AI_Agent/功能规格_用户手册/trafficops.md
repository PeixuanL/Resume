# TrafficOps 客流运营模块 — User Guide

**版本 Version:** 2026-04-08  
**维护 Maintained by:** AzureBot (DataMesh)  
**适用对象 Audience:** 客户、售前、内部团队

---

## 目录 Table of Contents

1. [模块概述 Module Overview](#1-模块概述-module-overview)
2. [导航结构 Navigation](#2-导航结构-navigation)
3. [运营总览与仪表盘 Operations Overview](#3-运营总览与仪表盘-operations-overview)
4. [客流分析与预测 Passenger Flow Analysis](#4-客流分析与预测-passenger-flow-analysis)
5. [资源配置优化 Resource Optimization](#5-资源配置优化-resource-optimization)
6. [仿真模块 Simulation](#6-仿真模块-simulation)
7. [Commander AI 智能指挥官](#7-commander-ai-智能指挥官)

9. [工班与人员管理 Shift & Personnel](#9-工班与人员管理-shift--personnel)
10. [事件与故障管理 Incidents & Events](#10-事件与故障管理-incidents--events)
11. [数据分析与报表 Analytics & Reports](#11-数据分析与报表-analytics--reports)
12. [其他功能模块 Other Modules](#12-其他功能模块-other-modules)
13. [AI Advisor 智能顾问](#13-ai-advisor-智能顾问)

---

## 1. 模块概述 Module Overview

### 1.1 什么是 TrafficOps？

**TrafficOps（客流运营模块）** 是 DataMesh FactVerse 平台专为口岸、机场、边境口岸设计的智能运营管理模块。集成实时客流监控、AI 预测、DES 仿真、指挥官 AI 决策服务于一体。

**核心价值主张：**
- 实时运营仪表盘：吞吐量、等待时间、设施利用率一目了然
- AI 客流预测：双峰模型 + 排队论，提前预知拥堵
- AI 自动监控：主动检测异常，生成带证据的行动方案，一键审批
- DES 仿真：M/M/c 排队模拟，多方案对比
- Commander AI：将预测、监控、仿真统一协调，5 分钟决策闭环

**目标场景：**
- 机场航站楼运营（出发/到达/中转）
- 边境口岸
- 港口客货码头

### 1.2 系统架构 System Architecture

```
用户浏览器 (Vue 3 Frontend)
       │
       ▼
Backend API  (port 8080 · Bearer Token)
  └── /api/v1/trafficops/*
       ├── /ops/dashboard          (KPI 总览)
       ├── /ops/events             (实时事件)
       ├── /queues                 (各通道队列状态)
       ├── /flow                   (客流数据)
       ├── /canonical/*            (设施/通道/设备配置)
       ├── /sim/*                  (仿真运行管理)
       ├── /rules/*                (运营规则配置)
       ├── /reports/*              (报告生成)
       ├── /incident/*             (事件管理)
       ├── /wcp/*                  (工作站处理)
       └── /cargo/*                 (货运检查)

AI Engine  (port 8000 · X-API-Key)
  └── /ai/trafficops/*
       ├── /forecast               (客流预测)
       ├── /patterns               (客流模式)
       ├── /monitor                (AI 主动监控)
       ├── /monitor/approve|dismiss (AI 方案审批)
       ├── /what-if                (What-If 仿真)
       ├── /optimize               (资源优化推荐)
       └── /calibrate              (模型校准)
```

---

## 2. 导航结构 Navigation

| 路由 Path | 页面 Page | 说明 |
|---|---|---|
| `/trafficops` | TrafficOps Home | 模块首页 |
| `/trafficops/scenes` | 场景编辑器 | 编辑客流场景配置 |
| `/trafficops/flow` | 客流总览 | 实时客流数据看板 |
| `/trafficops/optimization` | 资源配置 | 通道/人员优化配置 |
| `/trafficops/3d-view` | 3D 视图 | FactVerse 3D 孪生场景 |
| `/trafficops/passenger` | 旅客清关仪表盘 | 旅客清关状态总览 |
| `/trafficops/cp` | 通道处理仪表盘 | 各通道处理效率 |
| `/trafficops/checkpoint-overview` | 通道总览 | 所有通道状态网格视图 |
| `/trafficops/vehicles` | 车辆运营 | 车辆进出管理 |
| `/trafficops/cargo` | 货运运营 | 货物检查流程 |
| `/trafficops/multi-region` | 多区域管理 | 跨区域协调运营 |
| `/trafficops/data-ingestion` | 数据接入 | DFS 数据接入配置 |
| `/trafficops/equipment-config` | 设备配置 | 设备参数与灵敏度配置 |
| `/trafficops/sim` | 仿真列表 | 所有 DES 仿真运行 |
| `/trafficops/sim/new` | 新建仿真 | 创建新仿真场景 |
| `/trafficops/sim/:id` | 仿真详情 | 单次仿真结果详情 |
| `/trafficops/sim/compare` | 仿真对比 | 多场景对比分析 |
| `/trafficops/sim/analysis` | 仿真统计 | 仿真数据统计分析 |
| `/trafficops/commander` | Commander AI | AI 指挥官（跳转至 commander-pax） |
| `/trafficops/commander-pax` | 旅客指挥官 | 旅客通道 AI 决策 |
| `/trafficops/commander-vehicle` | 车辆指挥官 | 车辆通道 AI 决策 |
| `/trafficops/optimize` | AI 优化 | What-If 优化分析 |

| `/trafficops/cad-import` | CAD 导入 | 设施平面图导入 |
| `/trafficops/shift-planning` | 班次规划 | 人员班次安排 |
| `/trafficops/evacuation` | 疏散仿真 | 紧急疏散仿真 |
| `/trafficops/whatif` | What-If 分析 | What-If 场景分析 |
| `/trafficops/decisions` | 决策日志 | 所有 AI 决策记录 |
| `/trafficops/capacity-planning` | 容量规划 | 长期容量预测与规划 |
| `/trafficops/sla-monitor` | SLA 监控 | 服务等级达成监控 |
| `/trafficops/officer-performance` | 官员绩效 | 边检官员工作效率统计 |
| `/trafficops/incidents` | 事件管理 | 运营异常事件列表 |
| `/trafficops/energy-dashboard` | 能源仪表盘 | 设施能源消耗监控 |
| `/trafficops/training` | 培训演练 | 操作培训与演练 |
| `/trafficops/predictive-maintenance` | 预测性维护 | 设备健康与维护计划 |
| `/trafficops/passenger-analytics` | 旅客分析 | 旅客行为与趋势分析 |
| `/trafficops/car-mc-clearance` | 车辆MC清关 | 车辆检查站管理 |
| `/trafficops/departure-bus-hall` | 出发巴士大厅 | 巴士大厅运营监控 |

---

## 3. 运营总览与仪表盘 Operations Overview

### 3.1 核心 Backend API

| 方法 | 端点 | 描述 |
|---|---|---|
| `GET` | `/api/v1/trafficops/ops/dashboard` | 运营仪表盘 KPI |
| `GET` | `/api/v1/trafficops/ops/events` | 实时事件流 |
| `GET` | `/api/v1/trafficops/queues` | 各通道队列状态 |
| `GET` | `/api/v1/trafficops/kpis` | 关键绩效指标 |

### 3.2 主要 KPI

| KPI | 说明 | 示例值 |
|---|---|---|
| throughput | 当前吞吐量 | 8,600 人次/小时 |
| avgWait | 平均等待时间 | 420 秒（约 7 分钟） |
| p95Wait | P95 等待时间（95% 旅客在此时间内通过） | 980 秒（约 16 分钟） |
| utilization | 设施综合利用率 | 82% |

### 3.3 Use Case UC1：实时监控口岸运营状态

**操作步骤：**
1. 进入 `/trafficops/ops/dashboard`（通过 backend `GET /api/v1/trafficops/ops/dashboard`）
2. 查看实时 KPI（吞吐量、等待时间、利用率）
3. 点击 `/trafficops/checkpoint-overview` 查看通道网格视图
4. 识别利用率 > 85% 的通道（红色高亮）
5. 点击通道进入详情，查看历史趋势

---

## 4. 客流分析与预测 Passenger Flow Analysis

### 4.1 核心 AI 端点

| 方法 | 端点 | 描述 |
|---|---|---|
| `GET` | `/ai/trafficops/forecast` | 未来 24h 客流预测 |
| `GET` | `/ai/trafficops/patterns` | 客流日间模式分析 |
| `GET` | `/ai/trafficops/monitor` | AI 主动监控异常 |

### 4.2 预测模型

**日间双峰模型（Diurnal Double-Peak Model）：**
- **上午高峰**：07:00–10:00
- **下午高峰**：17:00–21:00
- **星期系数**：周五/周日系数较高

**排队论：**
- **M/M/c 模型**：泊松到达、指数服务、c 个并行服务台
- **Little's Law**：L = λ × W

### 4.3 Use Case UC2：预测明日高峰时段

**操作步骤：**
1. 进入 `/trafficops/flow`，选择目标日期
2. 调用 `GET /ai/trafficops/forecast`（参数：`date`、`facility_id`）
3. 查看预测曲线——系统标注预测高峰时段（黄色区间）
4. 若预测 P95 等待时间 > 20 分钟，显示预警

---

## 5. 资源配置优化 Resource Optimization

### 5.1 核心 Backend API

| 方法 | 端点 | 描述 |
|---|---|---|
| `GET` | `/api/v1/trafficops/rules` | 运营规则列表 |
| `POST` | `/api/v1/trafficops/rules` | 新建运营规则 |
| `GET` | `/api/v1/trafficops/optimization/recommendations` | 优化建议 |

### 5.2 Use Case UC3：AI 生成通道开放建议

**操作步骤：**
1. 进入 `/trafficops/optimization`
2. 选择日期范围（明日/本周）
3. 点击"生成建议" → 调用 `POST /ai/trafficops/optimize`
4. 系统返回各时段建议开放通道数（`recommended_checkpoints`）
5. 对比当前配置，输出预期等待时间改善

---

## 6. 仿真模块 Simulation

### 6.1 功能页面

- **Sim Run List** (`/trafficops/sim`): 所有 DES 仿真运行列表
- **Sim New Run** (`/trafficops/sim/new`): 创建新仿真场景
- **Sim Run Detail** (`/trafficops/sim/:id`): 单次仿真结果详情
- **Sim Compare** (`/trafficops/sim/compare`): 多场景对比

### 6.2 仿真类型

| 仿真 | 描述 |
|---|---|
| M/M/c 排队仿真 | 标准客流排队模拟 |
| 通道配置仿真 | 不同通道开放数量的效果对比 |
| 疏散仿真 | 紧急疏散情景（`/trafficops/evacuation`） |
| What-If 分析 | 场景参数调整后的效果预测 |

### 6.3 DES Engine 端点

| 方法 | 端点 | 描述 |
|---|---|---|
| `POST` | `/ai/des/run` | 运行 DES 仿真 |
| `GET` | `/ai/des/scene-types` | 可用场景类型 |
| `POST` | `/ai/trafficops/what-if` | TrafficOps What-If 分析 |
| `POST` | `/ai/trafficops/optimize` | 资源优化推荐 |

### 6.4 Use Case UC4：对比不同通道配置方案

**操作步骤：**
1. 进入 `/trafficops/sim/new`，选择"通道配置对比"
2. 配置方案 A：当前配置（20 个通道开放）
3. 配置方案 B：增加 3 个通道（早晚高峰各加开）
4. 运行仿真，对比两个方案的 `avgWait` 和 `utilization`
5. 点击 `/trafficops/sim/compare` 查看并排对比图

---

## 7. Commander AI 智能指挥官

### 7.1 功能页面

- **Commander AI** (`/trafficops/commander`): AI 指挥官总览
- **Commander Pax** (`/trafficops/commander-pax`): 旅客通道 AI 决策
- **Commander Vehicle** (`/trafficops/commander-vehicle`): 车辆通道 AI 决策

### 7.2 AI Monitor 端点

| 方法 | 端点 | 描述 |
|---|---|---|
| `GET` | `/ai/trafficops/monitor` | 获取当前监控状态 |
| `POST` | `/ai/trafficops/monitor/approve` | 审批 AI 生成的行动方案 |
| `POST` | `/ai/trafficops/monitor/dismiss` | 驳回 AI 方案 |
| `GET` | `/ai/trafficops/monitor/scenarios` | 当前待审批场景列表 |
| `POST` | `/ai/trafficops/monitor/inject` | 人工注入事件（如临时加开通道） |
| `POST` | `/ai/trafficops/monitor/trigger-surge` | 触发峰值情景 |
| `POST` | `/ai/trafficops/monitor/stop` | 停止监控 |

### 7.3 Use Case UC5：AI 主动发现拥堵并生成方案

**操作步骤：**
1. `/ai/trafficops/monitor` 持续监控，当预测 P95Wait > 15 分钟时触发
2. 系统自动调用 `/ai/trafficops/monitor/analyze-surge`，生成缓解方案
3. 指挥官收到通知，进入 `/trafficops/commander-pax`
4. 查看 AI 方案：建议临时加开 2 个通道，预计 P95Wait 降至 10 分钟
5. 点击"一键审批" → `/ai/trafficops/monitor/approve` → 通道自动开启

**预期结果：** 5 分钟内完成从检测到执行的决策闭环。

---


---

*最后更新：2026-04-08 | AzureBot (DataMesh)*
