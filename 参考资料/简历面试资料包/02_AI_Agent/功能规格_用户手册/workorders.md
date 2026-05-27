# 工单管理用户指南

> 面向运维人员和主管的全生命周期工单管理模块使用手册。

---

## 1. Overview — 概述

工单管理是 FactVerse 平台的核心基盘模块，提供：

- **全流程管理** — 创建 → 分配 → 执行 → 完成
- **子工单拆分** — 复杂任务拆分为多个子工单
- **退回重做** — 支持工单退回并记录原因和次数
- **重新分配** — 支持工单改派
- **SLA 追踪** — 响应时限和完成时限的 SLA 监控
- **工单评价** — 完成后可评分和评论
- **统计分析** — 工单效率和分布分析

**导航路径：** `/workorders`

---

## 2. Work Order List — 工单列表

**导航路径：** `/workorders`

**API：** `GET /api/v1/workorders`（分页，返回 Spring Page）

### 工单字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `workOrderId` | String (unique) | 工单编号 |
| `title` | String | 工单标题 |
| `description` | String | 问题描述 |
| `priority` | Enum | 优先级 |
| `status` | Enum | 状态 |
| `equipment` | FK | 关联设备 |
| `alert` | FK | 关联告警（可选） |
| `assignee` | String | 负责人 |
| `dueDate` | LocalDate | 截止日期 |
| `completedAt` | Instant | 完成时间 |
| `parentWorkOrder` | FK | 父工单（子工单用） |
| `returnReason` | String | 退回原因 |
| `returnCount` | int | 退回次数 |
| `rating` | Integer | 评分（1-5） |
| `ratingComment` | String | 评价内容 |
| `reassignedFrom` | String | 改派前负责人 |
| `reassignedCount` | int | 改派次数 |
| `respondedAt` | Instant | 响应时间 |
| `responseDeadline` | Instant | 响应 SLA 时限 |
| `completionDeadline` | Instant | 完成 SLA 时限 |
| `slaResponseBreached` | boolean | 响应 SLA 是否超时 |
| `slaCompletionBreached` | boolean | 完成 SLA 是否超时 |
| `escalatedAt` | Instant | 升级时间 |
| `escalationCount` | int | 升级次数 |
| `sortOrder` | Integer | 排序权重 |

### WorkOrderPriority 枚举

`LOW` → `MEDIUM` → `HIGH` → `URGENT`

### WorkOrderStatus 枚举

| 值 | 说明 |
|----|------|
| `CREATED` | 已创建（待分配） |
| `ASSIGNED` | 已分配 |
| `IN_PROGRESS` | 执行中 |
| `COMPLETED` | 已完成 |
| `CANCELLED` | 已取消 |

---

## 3. Work Order Lifecycle — 工单流转

```
创建(CREATED) → 分配(ASSIGNED) → 执行(IN_PROGRESS) → 完成(COMPLETED)
                                     ↑ 退回 ←─────────┘
                                     → 取消(CANCELLED)
```

**支持操作：**

- **退回（Return）**：完成后发现问题可退回重做，记录退回原因
- **改派（Reassign）**：将工单转给其他人，记录改派来源
- **评价（Rate）**：完成后评分（1-5）和评论

---

## 4. Work Order Operations — 工单操作

**API：**

| 操作 | 方法与路径 |
|------|-----------|
| 工单列表 | `GET /api/v1/workorders` |
| 工单详情 | `GET /api/v1/workorders/{id}` |
| 创建工单 | `POST /api/v1/workorders` |
| 更新状态 | `PUT /api/v1/workorders/{id}/status` |
| 分配工单 | `PUT /api/v1/workorders/{id}/assign` |
| 开始执行 | `PUT /api/v1/workorders/{id}/start` |
| 提交完成 | `PUT /api/v1/workorders/{id}/complete` |
| 退回工单 | `POST /api/v1/workorders/{id}/return` |
| 改派工单 | `POST /api/v1/workorders/{id}/reassign` |
| 评价工单 | `POST /api/v1/workorders/{id}/rate` |
| 调整排序 | `PUT /api/v1/workorders/reorder` |
| 创建子工单 | `POST /api/v1/workorders/{id}/sub` |
| 查看子工单 | `GET /api/v1/workorders/{id}/sub` |

---

## 5. Statistics — 工单统计

**API：** `GET /api/v1/workorders/stats`

| 指标 | 说明 |
|------|------|
| 平均完成时间 | 从创建到完成的平均耗时 |
| SLA 达标率 | 响应和完成均未超时的比例 |
| 积压量 | 当前未完成工单数量 |
| 退回率 | 被退回重做的工单比例 |
| 评分均值 | 已完成工单的平均评分 |
