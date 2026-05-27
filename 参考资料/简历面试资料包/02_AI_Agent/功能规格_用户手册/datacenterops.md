# DataCenterOps 数据中心运维模块 — User Guide

**版本 Version:** 2026-04-08  
**维护 Maintained by:** AzureBot (DataMesh)  
**适用对象 Audience:** 客户、售前、内部团队

---

## 目录 Table of Contents

1. [模块概述 Module Overview](#1-模块概述-module-overview)
2. [导航结构 Navigation](#2-导航结构-navigation)
3. [资产清单 Asset Management](#3-资产清单-asset-management)
4. [健康监控与预测 Health & Prediction](#4-健康监控与预测-health--prediction)
5. [诊断控制台 Diagnosis Console](#5-诊断控制台-diagnosis-console)
6. [预测性维护队列 Predictive Queue](#6-预测性维护队列-predictive-queue)
7. [闭环自动化 Closed-Loop Automation](#7-闭环自动化-closed-loop-automation)
8. [运维运营视图 Operations View](#8-运维运营视图-operations-view)
9. [系统集成 Integrations](#9-系统集成-integrations)
10. [AI Advisor 智能顾问](#10-ai-advisor-智能顾问)

---

## 1. 模块概述 Module Overview

### 1.1 什么是 DataCenterOps？

**DataCenterOps（数据中心运维模块）** 是 DataMesh FactVerse 平台专为数据中心设计的智能运维管理模块，覆盖资产台账、容量管理、预测性维护、故障诊断和闭环自动化。

**核心价值主张：**
- 资产全生命周期管理（入库 → 运行 → 维护 → 退役）
- AI 驱动的故障预测，减少计划外停机
- 容量规划与预测（电力、冷却、空间）
- 诊断控制台：快速定位根因，缩短 MTTR
- 闭环自动化：告警 → 诊断 → 自动工单

**目标场景：**
- 数据中心（Tier 2–4）
- 托管数据中心（colocation）运维
- 企业自建机房

### 1.2 关键 AI 端点

| 方法 | 端点 | 描述 |
|---|---|---|
| `POST` | `/ai/datacenterops/health` | 资产健康评分 |
| `POST` | `/ai/datacenterops/predict` | 故障预测 |
| `POST` | `/ai/datacenterops/diagnose` | 根因诊断 |
| `POST` | `/ai/datacenterops/capacity` | 容量预测 |

---

## 2. 导航结构 Navigation

| 路由 Path | 页面 Page |
|---|---|
| `/datacenterops/dashboard` | 数据中心总览仪表盘 |
| `/datacenterops/assets` | 资产清单列表 |
| `/datacenterops/assets/:assetId` | 资产详情 |
| `/datacenterops/predictive-queue` | 预测性维护队列 |
| `/datacenterops/diagnosis` | 诊断控制台 |
| `/datacenterops/closed-loop` | 闭环自动化配置 |
| `/datacenterops/operations` | 运维运营视图 |
| `/datacenterops/integrations` | 系统集成管理 |

---

## 3. 资产清单 Asset Management

### 3.1 功能页面

- **Asset List** (`/datacenterops/assets`): 所有 IT 资产清单
- **Asset Detail** (`/datacenterops/assets/:assetId`): 单资产完整信息

### 3.2 资产类型

| 类型 | 示例设备 |
|---|---|
| Server | 机架式服务器、刀片服务器 |
| Storage | SAN/NAS 存储阵列 |
| Network | 交换机、路由器、防火墙 |
| Power | UPS、PDU、发电机 |
| Cooling | CRAC、CRAH、冷却器 |
| Cabling | 光纤、铜缆布线 |

### 3.3 资产状态

| 状态 | 描述 |
|---|---|
| OPERATING | 正常运行 |
| WARNING | 健康预警 |
| FAILURE | 故障 |
| MAINTENANCE | 维护中 |
| OFFLINE | 下线 |
| DECOMMISSIONED | 已退役 |

### 3.4 Use Case UC1：批量导入资产台账

**操作步骤：**
1. 进入 `/datacenterops/assets`，点击"导入"
2. 上传 CSV 文件（含：设备序列号、型号、机柜位置、额定功率）
3. 系统解析并校验数据
4. 预览匹配结果，点击"确认导入"
5. 资产自动出现在列表中

---

## 4. 健康监控与预测 Health & Prediction

### 4.1 功能页面

- **Dashboard** (`/datacenterops/dashboard`): 全数据中心健康状态汇总、关键 KPI
- **Predictive Queue** (`/datacenterops/predictive-queue`): AI 预测的未来 7–30 天内可能故障的设备列表

### 4.2 主要 KPI

| KPI | 描述 | 目标值 |
|---|---|---|
| 可用率 | Uptime / Total Time | > 99.99% |
| MTBF | Mean Time Between Failures | > 43,800 h |
| MTTR | Mean Time To Repair | < 2 h |
| 容量利用率 | IT Load / Design Load | 60–80% |

### 4.3 Use Case UC2：识别高风险资产

**操作步骤：**
1. 进入 `/datacenterops/predictive-queue`
2. 查看 AI 预测的故障列表（按故障概率降序）
3. 点击资产卡片，查看：
   - 预测故障类型（电源 / 存储 / 网络）
   - 预测故障时间窗口
   - 当前健康评分
   - 建议的预防性维护动作
4. 点击"生成工单"，直接创建预防性维护 WorkOrder

---

## 5. 诊断控制台 Diagnosis Console

### 5.1 功能页面

- **Diagnosis Console** (`/datacenterops/diagnosis`): 交互式故障诊断，支持多维度筛选和 AI 根因分析

### 5.2 诊断能力

| 能力 | 描述 |
|---|---|
| 日志分析 | 解析 syslog、SNMP trap、Windows Event |
| 阈值告警 | 灵活配置监控阈值（CPU / 内存 / 温度 / 电力） |
| 拓扑关联 | 自动关联告警设备的上游/下游依赖 |
| AI 根因 | AI 引擎分析告警链，定位根因设备 |

### 5.3 Use Case UC3：快速定位网络故障根因

**操作步骤：**
1. 进入 `/datacenterops/diagnosis`，看到告警列表
2. 筛选 `severity: CRITICAL`、`type: NETWORK`
3. 勾选多个相关告警，点击"AI 诊断"
4. 系统分析告警时序和拓扑依赖，返回：
   - 根因设备（红色高亮）
   - 受影响的下游服务列表
   - 建议的恢复步骤
5. 点击"执行恢复" → 自动触发预设脚本或创建工单

---

## 6. 预测性维护队列 Predictive Queue

### 6.1 功能页面

- **Predictive Queue** (`/datacenterops/predictive-queue`): AI 预测的未来故障设备队列，支持按日期、设备类型、故障概率排序

### 6.2 Use Case UC4：安排预测性维护窗口

**操作步骤：**
1. 查看队列，按 `failure_date` 升序排列
2. 选择预计 7 天内故障的设备（高风险）
3. 点击"批量安排维护" → 选择维护窗口（周末）
4. 系统生成维护工单，指派给运维工程师
5. 工单包含：更换备件列表、恢复步骤、预计时长

---

## 7. 闭环自动化 Closed-Loop Automation

### 7.1 功能页面

- **Closed-Loop** (`/datacenterops/closed-loop`): 配置告警 → 诊断 → 动作的自动化规则

### 7.2 支持的自动化动作

| 动作类型 | 说明 |
|---|---|
| 创建工单 | 自动创建 WorkOrder |
| 发送通知 | Email / SMS / Slack / Discord |
| 执行脚本 | 在目标设备上执行预设脚本 |
| 重启服务 | 远程重启应用服务 |
| 切换冗余 | 切换到备用设备 |

### 7.3 Use Case UC5：配置 UPS 电池告警自动化

**操作步骤：**
1. 进入 `/datacenterops/closed-loop`
2. 点击"新建规则"
3. 配置触发条件：
   - `trigger: asset_type = UPS AND battery_level < 20%`
   - `condition: severity = CRITICAL`
4. 配置响应动作：
   - 动作 1：发送 Slack 通知到 #datacenter-alerts
   - 动作 2：创建 WorkOrder（priority: URGENT，assignee: 电气组）
   - 动作 3：触发应急发电机启动脚本
5. 保存规则，激活自动化

---

## 8. 运维运营视图 Operations View

### 8.1 功能页面

- **Operations** (`/datacenterops/operations`): 运维日常工作台，包含今日任务、待处理工单、巡检清单

### 8.2 日常运维功能

| 功能 | 描述 |
|---|---|
| 今日任务 | 系统自动生成的每日巡检和维护任务 |
| 工单看板 | Kanban 视图（待处理 / 处理中 / 已完成） |
| 变更日历 | 展示计划内变更（维护窗口） |
| SLO 追踪 | 服务等级目标达成情况 |

---

## 9. 系统集成 Integrations

### 9.1 功能页面

- **Integrations** (`/datacenterops/integrations`): 第三方系统集成配置

### 9.2 支持的集成

| 系统 | 集成方式 | 数据流向 |
|---|---|---|
| DCIM 软件 | REST API | FactVerse ← DCIM（资产数据） |
| BMS 系统 | BACnet / Modbus | FactVerse ← BMS（环境数据） |
| ITOM 工具 | Webhook | FactVerse → ITOM（工单） |
| 监控系统 | Prometheus | FactVerse → Prometheus（指标） |

---

## 10. AI Advisor 智能顾问

DataCenterOps 已接入 AI Advisor：

| 示例问题 | 调用工具 |
|---|---|
| "当前有多少台服务器处于 WARNING 状态？" | `get_equipment_status` (DC Ops 模式) |
| "下周有哪些设备需要预防性维护？" | `get_proactive_alerts` (DC Ops) |
| "帮我分析 3 号机柜的容量使用情况" | `POST /ai/datacenterops/capacity` |
| "最近的网络故障根本原因是什么？" | `POST /ai/datacenterops/diagnose` |

---

*最后更新：2026-04-08 | AzureBot (DataMesh)*
