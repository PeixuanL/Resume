# TelcoOps 电信运维模块 — User Guide

**版本 Version:** 2026-04-08  
**维护 Maintained by:** AzureBot (DataMesh)  
**适用对象 Audience:** 客户、售前、内部团队

---

## 目录 Table of Contents

1. [模块概述 Module Overview](#1-模块概述-module-overview)
2. [导航结构 Navigation](#2-导航结构-navigation)
3. [网络总览 Network Dashboard](#3-网络总览-network-dashboard)
4. [拓扑管理 Network Topology](#4-拓扑管理-network-topology)
5. [节点与链路管理 Nodes & Links](#5-节点与链路管理-nodes--links)
6. [故障管理 Incident Management](#6-故障管理-incident-management)
7. [容量规划 Capacity Planning](#7-容量规划-capacity-planning)
8. [预测性分析 Predictive Analysis](#8-预测性分析-predictive-analysis)
9. [路由优化 Route Optimizer](#9-路由优化-route-optimizer)
10. [VNF 放置 VNF Placement](#10-vnf-放置-vnf-placement)
11. [可靠性分析 Reliability Analysis](#11-可靠性分析-reliability-analysis)
12. [AI Advisor 智能顾问](#12-ai-advisor-智能顾问)

---

## 1. 模块概述 Module Overview

### 1.1 什么是 TelcoOps？

**TelcoOps（电信运维模块）** 是 DataMesh FactVerse 平台专为电信运营商设计的网络运维管理模块，覆盖 4G/5G 基站、传输网、核心网的全生命周期管理。

**核心价值主张：**
- 网络拓扑可视化与实时监控
- 故障快速定位（MTTR < 15 分钟）
- 基站容量预测与扩容规划
- 网络可靠性分析与 SLA 追踪
- VNF（虚拟网络功能）自动放置优化
- 路由优化：降低时延、提升带宽利用率

**目标场景：**
- 电信运营商网络运维中心（NOC）
- 铁塔公司基础设施管理
- 企业专网运维

### 1.2 关键 AI 端点

| 方法 | 端点 | 描述 |
|---|---|---|
| `POST` | `/ai/telcoops/network-health` | 网络健康评分 |
| `POST` | `/ai/telcoops/fault-diagnosis` | 故障根因诊断 |
| `POST` | `/ai/telcoops/capacity-forecast` | 容量预测 |
| `POST` | `/ai/telcoops/route-optimize` | 路由优化 |
| `POST` | `/ai/telcoops/vnf-place` | VNF 放置优化 |
| `POST` | `/ai/telcoops/reliability` | 可靠性分析 |

---

## 2. 导航结构 Navigation

| 路由 Path | 页面 Page |
|---|---|
| `/telcoops/dashboard` | 网络总览仪表盘 |
| `/telcoops/topology` | 网络拓扑图 |
| `/telcoops/nodes` | 节点列表 |
| `/telcoops/links` | 链路列表 |
| `/telcoops/incidents` | 故障事件列表 |
| `/telcoops/forecast` | 流量预测 |
| `/telcoops/route-optimizer` | 路由优化 |
| `/telcoops/capacity` | 容量规划 |
| `/telcoops/reliability` | 可靠性分析 |
| `/telcoops/vnf-placement` | VNF 放置 |

---

## 3. 网络总览 Network Dashboard

### 3.1 功能页面

- **Dashboard** (`/telcoops/dashboard`): 网络运行状态总览，关键 KPI 看板

### 3.2 关键 KPI

| KPI | 描述 | 目标值 |
|---|---|---|
| Network Availability | 网络可用率 | > 99.999% |
| MTTR | 平均故障恢复时间 | < 15 min |
| Network Health Score | 网络健康评分 | > 90/100 |
| Incident Count | 活跃故障数 | 越少越好 |
| CPU Utilization | 基站平均 CPU 利用率 | < 70% |
| Link Utilization | 链路平均利用率 | < 60% |

---

## 4. 拓扑管理 Network Topology

### 4.1 功能页面

- **Topology** (`/telcoops/topology`): 网络拓扑可视化（层级视图：核心网 → 传输网 → 接入网）

### 4.2 Use Case UC1：拓扑可视化监控

**操作步骤：**
1. 进入 `/telcoops/topology`
2. 查看网络层级拓扑（核心 / 汇聚 / 接入三层）
3. 节点颜色表示状态：绿（正常）、黄（警告）、红（故障）
4. 点击节点，查看详细信息（设备型号、端口状态、流量统计）
5. 点击链路，查看带宽利用率和时延

---

## 5. 节点与链路管理 Nodes & Links

### 5.1 功能页面

- **Nodes** (`/telcoops/nodes`): 基站、路由器、交换机列表
- **Links** (`/telcoops/links`): 光纤链路、微波链路列表

### 5.2 节点类型

| 类型 | 示例 |
|---|---|
| eNB (4G) | LTE 基站 |
| gNB (5G) | 5G NR 基站 |
| Router | 核心/汇聚路由器 |
| Switch | 接入交换机 |
| OTN | 光传输网设备 |

### 5.3 Use Case UC2：批量查看基站状态

**操作步骤：**
1. 进入 `/telcoops/nodes`
2. 筛选条件：`type = gNB`、`status = WARNING`
3. 查看告警基站列表
4. 点击进入详情，查看故障原因和影响范围
5. 点击"创建工单"，指派给 field engineer

---

## 6. 故障管理 Incident Management

### 6.1 功能页面

- **Incidents** (`/telcoops/incidents`): 故障事件列表，支持按状态、优先级、类型筛选

### 6.2 故障优先级

| 优先级 | P1 | P2 | P3 | P4 |
|---|---|---|---|---|
| 说明 | 全面故障 | 部分故障 | 性能下降 | 轻微告警 |
| SLA 响应 | 15 min | 1 h | 4 h | 24 h |
| SLA 恢复 | 1 h | 4 h | 24 h | 72 h |

### 6.3 Use Case UC3：故障快速响应

**操作步骤：**
1. 进入 `/telcoops/incidents`，看到 P1 告警（红色）
2. 点击告警，查看：
   - 告警类型（链路中断 / 节点离线 / 基站脱管）
   - 影响范围（多少用户/区域）
   - 告警时间线（从首次检测到现在）
3. 点击"AI 诊断" → 调用 `/ai/telcoops/fault-diagnosis`
4. 系统返回根因分析和恢复建议
5. 根据建议执行操作（切换路由 / 重启服务 / 派单）

---

## 7. 容量规划 Capacity Planning

### 7.1 功能页面

- **Capacity** (`/telcoops/capacity`): 容量规划视图，支持未来 3/6/12 个月扩容预测

### 7.2 Use Case UC4：基站扩容预测

**操作步骤：**
1. 进入 `/telcoops/capacity`
2. 选择目标区域和站点
3. 查看当前容量利用率（CPU/内存/带宽）
4. 点击"容量预测" → 调用 `/ai/telcoops/capacity-forecast`
5. 输入：`forecast_months: 6`
6. 系统返回：
   - 每月预测峰值利用率
   - 扩容时间节点建议
   - 扩容方案（小区分裂 / 载波聚合 / 新增基站）

---

## 8. 预测性分析 Predictive Analysis

### 8.1 功能页面

- **Forecast** (`/telcoops/forecast`): 流量预测与异常检测

### 8.2 Use Case UC5：流量异常预警

**操作步骤：**
1. 进入 `/telcoops/forecast`
2. 选择目标节点和流量类型（下行/上行）
3. 查看 24h 预测 vs 实际曲线
4. 若实际流量偏离预测 > 20%，系统自动告警
5. 点击"分析根因" → AI 返回可能原因（事件/故障/正常峰值）

---

## 9. 路由优化 Route Optimizer

### 9.1 功能页面

- **Route Optimizer** (`/telcoops/route-optimizer`): 传输路由优化工具

### 9.2 Use Case UC6：优化传输路由

**操作步骤：**
1. 进入 `/telcoops/route-optimizer`
2. 选择起点和终点
3. 点击"优化路由" → 调用 `/ai/telcoops/route-optimize`
4. 输入：`max_hops`、`priority: latency`（或 `bandwidth`）
5. 系统返回最优路径（最低时延 / 最高可用带宽）
6. 对比当前路由，给出预期改善指标

---

## 10. VNF 放置 VNF Placement

### 10.1 功能页面

- **VNF Placement** (`/telcoops/vnf-placement`): VNF（虚拟网络功能）自动放置优化

### 10.2 Use Case UC7：VNF 迁移优化

**操作步骤：**
1. 进入 `/telcoops/vnf-placement`
2. 查看当前 VNF 分布拓扑
3. 选择需优化的 VNF 类型（如 vEPC / vIMS）
4. 点击"优化放置" → AI 分析各节点资源利用率
5. 系统输出新放置方案（最小化时延 / 最大化可靠性 / 成本最优）

---

## 11. 可靠性分析 Reliability Analysis

### 11.1 功能页面

- **Reliability** (`/telcoops/reliability`): 网络可靠性 KPI（SLA 达成率、MTBF、MTTR）

### 11.2 Use Case UC8：SLA 达成分析

**操作步骤：**
1. 进入 `/telcoops/reliability`
2. 选择报告期（本月 / 本季度）
3. 查看各服务等级 SLA 达成率（语音 / 数据 / 短信）
4. 对比目标 SLA，找出差距
5. 点击"SLA 差距分析" → AI 识别主要影响因素

---

## 12. AI Advisor 智能顾问

TelcoOps 已接入 AI Advisor：

| 示例问题 | 调用工具 |
|---|---|
| "全网有多少节点处于 WARNING 状态？" | `get_equipment_status` (TelcoOps 模式) |
| "帮我分析 A 区域故障的根本原因" | `POST /ai/telcoops/fault-diagnosis` |
| "预测 B 站点未来 3 个月的容量需求" | `POST /ai/telcoops/capacity-forecast` |
| "优化 C 到 D 的传输路由" | `POST /ai/telcoops/route-optimize` |
| "本月 SLA 达成率是多少？" | `get_telcoops_sla` |

---

*最后更新：2026-04-08 | AzureBot (DataMesh)*
