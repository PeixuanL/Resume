# Workflow 工作流用户指南

> 面向管理员和业务用户的工作流引擎使用手册。

---

## 1. Overview — 概述

Workflow 是 FactVerse 平台的流程自动化引擎，支持：

- **流程定义** — JSON 格式的流程模板，支持条件分支与并行
- **任务分配** — 自动派发任务到指定角色或人员
- **审批流转** — 多级审批、会签、转办
- **状态追踪** — 实时查看流程实例进度
- **统计分析** — 流程效率、瓶颈识别

**导航路径：** `/workflow`

---

## 2. Task Inbox — 任务收件箱

**导航路径：** `/workflow/tasks`

**API：** `GET /api/v1/workflow/tasks`

**核心功能：**

- **待办任务列表**：显示分配给当前用户的所有待处理任务
- **任务详情**：流程名称、当前步骤、发起人、创建时间、优先级
- **操作按钮**：
  - **完成（Complete）**：执行任务并流转到下一步
  - **转办（Delegate）**：将任务转给其他人处理
  - **退回（Reject）**：退回到上一步骤
- **筛选排序**：按优先级、创建时间、流程类型过滤

---

## 3. Workflow Instances — 流程实例

**导航路径：** `/workflow/instances`

**API：** `GET /api/v1/workflow/instances`

**功能说明：**

- **实例列表**：查看所有已发起的流程实例
- **状态筛选**：运行中 / 已完成 / 已取消 / 失败
- **流程图可视化**：以图形方式显示流程当前进度，已完成步骤标绿，当前步骤标蓝
- **时间线**：每个步骤的开始时间、完成时间、处理人

---

## 4. Instance Detail — 实例详情

**导航路径：** `/workflow/instances/{id}`

**API：** `GET /api/v1/workflow/instances/{id}`

**详情内容：**

- **基本信息**：流程名称、发起人、发起时间、当前状态
- **进度图**：步骤流转图，含各步骤状态和处理人
- **操作历史**：完整的流转日志（谁在什么时间做了什么操作）
- **关联数据**：流程关联的业务对象（工单、文档、设备等）
- **管理操作**：挂起 / 恢复 / 终止流程（需管理员权限）

---

## 5. Statistics — 流程统计

**导航路径：** `/workflow/stats`

**API：** `GET /api/v1/workflow/statistics`

**统计指标：**

| 指标 | 说明 |
|------|------|
| 平均处理时间 | 从发起到完成的平均耗时 |
| 步骤瓶颈 | 平均等待时间最长的步骤 |
| 按时完成率 | 在 SLA 时间内完成的比例 |
| 任务分布 | 各处理人/角色的任务量分配 |
| 流程类型分布 | 各类流程的发起数量趋势 |

**使用场景：** 管理层识别流程效率瓶颈，优化人员配置和审批层级。

---

## 6. 内置流程类型

| 流程 | 步骤 | 适用场景 |
|------|------|----------|
| 文档审批 | 起草 → 审核 → 批准 → 发布 | ECM 文档发布 |
| 工单审批 | 创建 → 主管审批 → 执行 → 验收 | 维修工单 |
| 调度审批 | AI 生成 → 调度员确认 → 主管审批 → 执行 | HeatOps 调度 |
| 变更管理 | 申请 → 影响评估 → 审批 → 实施 → 验证 | 设备参数变更 |
| 采购申请 | 申请 → 部门审批 → 财务审批 → 采购 | 备件采购 |

---

## 7. 管理员配置

**API：** `POST /api/v1/workflow/definitions`

**流程定义格式（JSON）：**

```json
{
  "name": "document-approval",
  "steps": [
    {"id": "draft", "name": "起草", "assignee": "${initiator}"},
    {"id": "review", "name": "审核", "assignee": "role:REVIEWER", "condition": "SpEL expression"},
    {"id": "approve", "name": "批准", "assignee": "role:MANAGER"}
  ],
  "transitions": [
    {"from": "draft", "to": "review", "action": "submit"},
    {"from": "review", "to": "approve", "action": "pass"},
    {"from": "review", "to": "draft", "action": "reject"}
  ]
}
```

支持 **SpEL 条件表达式** 实现条件分支路由。
