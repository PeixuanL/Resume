# FactVerse AI for ICA — User Manual / 用户说明书

> **Version**: 2.0
> **Date**: 2025-02-24
> **Platform URL**: `https://factverse.ai`
> **Applicable Modules**: Traffic Operations (TrafficOps), ICA Checkpoint Operations

---

## Table of Contents / 目录

1. [System Overview / 系统概述](#1-system-overview)
2. [Login & Navigation / 登录与导航](#2-login--navigation)
3. [Main Dashboard / 主控仪表板](#3-main-dashboard)
4. [ICA Dashboard / ICA仪表板](#4-ica-dashboard)
   - 4.1 Site Overview / 站点概览
   - 4.2 Simulation / 仿真
   - 4.3 Road Network / 路网拓扑
   - 4.4 What-If Analysis / 假设分析
5. [AI Monitor & Proactive Alerts / AI监控与主动预警](#5-ai-monitor--proactive-alerts)
6. [WCP Dashboard / WCP仪表板](#6-wcp-dashboard)
   - 6.1 Flexi-Lane / 弹性通道
   - 6.2 Congestion Control / 拥堵管控
   - 6.3 Peak Simulation / 尖峰仿真
   - 6.4 AutoPilot / 自动驾驶
7. [Commander AI / 指挥官AI](#7-commander-ai)
8. [Resource Optimization (NSGA-II) / 资源优化](#8-resource-optimization)
9. [Simulation Management / 仿真管理](#9-simulation-management)
10. [AI Advisor / AI顾问](#10-ai-advisor)
11. [Demo Guide / 演示指南](#11-demo-guide)
12. [FAQ / 常见问题](#12-faq)

---

## 1. System Overview

### EN

FactVerse AI is an intelligent operations platform for ICA (Immigration & Checkpoints Authority) checkpoint management. It integrates:

- **Digital Twin** — Real-time representation of 3 checkpoint sites, 14 operational areas, and 18 road segments
- **AI Forecasting** — 8-hour rolling predictions using Holt-Winters exponential smoothing (R² ≈ 0.91)
- **Discrete Event Simulation (DES)** — M/M/c queuing models for capacity planning
- **Multi-Objective Optimization** — NSGA-II evolutionary algorithm for staff scheduling
- **Autonomous Agent** — Commander AI for real-time lane control
- **LLM Advisor** — Natural language diagnostics with tool calling and SHAP explainability

**Autonomy Level**: L2 (Advisory) — AI generates recommendations; humans approve and execute.

### CN

FactVerse AI 是ICA（移民与关卡局）关卡管理的智能运营平台。集成以下功能：

- **数字孪生** — 实时表示3个关卡站点、14个运营区域和18个道路段
- **AI预测** — 使用Holt-Winters指数平滑的8小时滚动预测（R² ≈ 0.91）
- **离散事件仿真（DES）** — M/M/c排队模型用于容量规划
- **多目标优化** — NSGA-II进化算法用于人员编排
- **自主智能体** — 指挥官AI用于实时通道管控
- **LLM顾问** — 自然语言诊断，配合工具调用和SHAP可解释性

**自主级别**: L2（顾问模式） — AI生成建议，人工审批执行。

---

## 2. Login & Navigation

### Login / 登录

1. Open `https://factverse.ai`
2. Enter username and password
3. Click **Login**

### Sidebar Navigation / 侧边栏导航

The sidebar is organized into groups:

| Group | Contents |
|-------|----------|
| **Cockpit** | Dashboard, Alerts, Work Orders |
| **Industry** | Traffic Operations (ICA module) |
| **Operations** | PM, Contractors, Inventory, etc. |

Under **Traffic Operations**, you will find:

| Menu Item | Description |
|-----------|-------------|
| Home | TrafficOps overview with navigation cards |
| ICA Dashboard | Multi-site checkpoint operations center |
| WCP Dashboard | Woodlands Checkpoint detailed dashboard |
| Commander AI | Autonomous lane control agent |
| Passenger Flow | AI forecast and proactive alerts |
| Optimize | NSGA-II resource optimization |
| Simulations | DES simulation run list |
| Scene Editor | Visual checkpoint scene designer |

### Language / 语言

Click the language selector in the top-right corner. Supported: English, 简体中文, 繁體中文, 日本語.

---

## 3. Main Dashboard

**Route**: `/dashboard`

The main dashboard provides a bird's-eye view of all operations:

| Section | Description |
|---------|-------------|
| **KPI Cards** | Open alerts, active work orders, system uptime |
| **Alert Summary** | Critical/Warning/Info alert counts |
| **Quick Actions** | Jump buttons to ICA Dashboard, WCP Dashboard, Commander AI |
| **Recent Activity** | Latest system events and AI actions |

---

## 4. ICA Dashboard

**Route**: `/modules/trafficops/ica-dashboard`

The ICA Dashboard is the primary operations command center with 4 tabs.

### 4.1 Site Overview Tab (Default)

**What you see:**

- **KPI Summary Row** — 4 cards with health-status coloring:

  | Color | Meaning | Threshold |
  |-------|---------|-----------|
  | 🟢 Green | Healthy | Arrival < 85% of capacity |
  | 🟡 Yellow | Warning | Arrival 85-120% of capacity |
  | 🔴 Red | Overloaded | Arrival > 120% of capacity |

- **Site Cards** — One per checkpoint site (RTS Link, WCP, WCPR1), showing:
  - Total arrival rate per hour
  - Total capacity
  - List of Operational Areas (AOs)

**Actions:**
- Click any AO → Jumps to Simulation tab with that scene pre-selected
- Use the Site dropdown (top right) to filter by site

### 4.2 Simulation Tab

**Route**: `/modules/trafficops/ica-dashboard?tab=sim`

Run quick DES simulations for any checkpoint scene.

**Steps:**
1. Select a scene from the dropdown (e.g., "[5] WCP Arrival Bus Hall")
2. Click **Run Simulation**
3. View results in the table:

| Column | Description |
|--------|-------------|
| Checkpoint | Name of the processing stage |
| Cap | Number of service counters |
| Util% | Utilization percentage (🔴 >90%, 🟡 >70%, 🟢 ≤70%) |
| Avg Wait | Average passenger wait time in minutes (red if >10 min) |
| Through/hr | Estimated throughput per hour |

### 4.3 Road Network Tab

**Route**: `/modules/trafficops/ica-dashboard?tab=roads`

View the road topology connecting all checkpoint nodes.

**Network Stats**: Total nodes, segments, arrival/departure/bidirectional segments, total distance.

**Route Finder (Dijkstra)**:
1. Select "From" node
2. Select "To" node
3. Click **Find Route**
4. View: path visualization (node tags with arrows), distance, travel time, hop count

### 4.4 What-If Analysis Tab

**Route**: `/modules/trafficops/ica-dashboard?tab=whatif`

Run pre-configured experiments to answer operational questions.

**Available Presets (ICA Table 4):**

| Preset | Question | Type |
|--------|----------|------|
| Booth Count Impact | How would booth changes affect throughput? | Comparison |
| Optimal Lanes <10 min | What's the optimal number of lanes for SLA? | Optimization |
| Security Increase 10-50% | Impact of security check increases? | Comparison |
| Staff Route Optimization | Optimal staff access routes? | Pathfinding |
| Equipment Failure | CT scanner/auto-gate failure scenarios? | Comparison |
| Morning Peak Rush | Bus + car + motorcycle surge at WCP? | Comparison |

**Steps:**
1. Click a preset card (blue border when selected)
2. Click **Run Selected Experiment**
3. View structured results:

**Result Sections:**

| Section | Description |
|---------|-------------|
| **Executive Summary** | One-paragraph AI-generated summary with run count and elapsed time |
| **Scenario Comparison Table** | Side-by-side KPIs per scenario; best scenario highlighted 🏆 |
| **KPI Delta Chips** | Percentage changes vs baseline with ✅ improved / ⚠️ worsened indicators |
| **Cost-Benefit Table** | Cost, wait reduction, $/min saved, ROI score per scenario |
| **Recommended Actions** | Operator-level instructions with priority, action type, timing, expected impact |
| **AI Recommendation** | Natural language strategy recommendation |
| **Pathfinding Routes** | (For route presets) Arrival/departure/emergency routes with node sequences |

**Reading the ROI Score:**

| ROI | Meaning |
|-----|---------|
| > 1.5 | 🟢 High value — strong recommendation |
| 1.0 - 1.5 | 🟡 Moderate — acceptable |
| < 1.0 | 🔴 Low — cost may not justify benefit |

---

## 5. AI Monitor & Proactive Alerts

**Route**: `/modules/trafficops/home` (AI Monitor Panel embedded in TrafficOps Home)

The AI Auto-Monitor scans all checkpoints every 60 seconds and generates action plans when it predicts SLA breaches.

### Status Bar

| Status | Icon | Meaning |
|--------|------|---------|
| OPTIMAL | 🟢 | All checkpoints within SLA |
| WARNING | 🟡 | Predicted SLA breach in 1+ checkpoint |
| CRITICAL | 🔴 | Imminent SLA breach or active incident |

### Action Plans (Collapsible)

Each plan is displayed as a **one-line summary** by default:

```
▶ [CRITICAL] Queue buildup at Bus Hall → Open 2 additional lanes | 18→5 min | 87%
```

| Element | Description |
|---------|-------------|
| ▶ Arrow | Click to expand full details |
| Severity tag | CRITICAL (red) or WARNING (yellow) |
| Problem title | What was detected |
| → Solution | AI's proposed action |
| Wait time delta | Expected improvement (before→after) |
| Confidence % | AI's confidence in the prediction |
| Approve button | One-click approval (always visible) |

**Click to expand** reveals:

1. **Problem → Root Cause → AI Solution** flow cards
2. **Execution Timeline** — step-by-step implementation plan
3. **Before/After Comparison** — simulated wait times with and without intervention
4. **Evidence Footer** — confidence score, algorithms used

### Approving a Plan

1. Click **✅ Approve & Execute** on the summary line (no need to expand)
2. Plan status changes to APPROVED
3. AI begins executing the timeline steps

### Dismissing a Plan

Click **Dismiss** to remove a plan you don't want to act on.

### Triggering Demo Scenarios

In demo mode, a scenario bar appears at the top:
- Click a scenario button (e.g., "Peak Hour", "Equipment Failure") to inject an event
- Click **Clear Scenario** to reset to normal monitoring

---

## 6. WCP Dashboard

**Route**: `/modules/trafficops/wcp-dashboard`

Detailed dashboard for Woodlands Checkpoint operations with 6 tabs.

### 6.1 Flexi-Lane Tab

**Route**: `?tab=flexilane`

Visual lane grid showing 8 lanes:
- 🟢 Green = Active
- ⚫ Grey = Standby
- Click a lane to toggle its state

### 6.2 Congestion Control Tab

**Route**: `?tab=congestion`

Real-time queue lengths and congestion levels per checkpoint area. Coordinate upstream diversion when queues exceed thresholds.

### 6.3 Peak Simulation Tab

**Route**: `?tab=peaksim`

Quick peak-hour simulation:
1. Set arrival rate and duration
2. Click **Run Simulation**
3. View bottleneck ranking and recommendations

### 6.4 AutoPilot Tab

**Route**: `?tab=autopilot`

View the AI agent's real-time lane management:
- Which lanes were opened/closed
- When and why each decision was made
- Current lane allocation status

---

## 7. Commander AI

**Route**: `/modules/trafficops/commander`

The autonomous lane control agent.

### Live Metrics

| Metric | Description |
|--------|-------------|
| MC Queue | Motorcycle queue length |
| Car Queue | Car queue length |
| Throughput | Current processing rate |
| Avg Wait | Current average wait time |

### Oracle Chart

Shows **actual traffic** (solid line) vs **AI-projected traffic** (dashed line) for the next 30 minutes.

### Auto/Manual Mode

| Mode | Behavior |
|------|----------|
| **MANUAL** | All lane decisions require human action |
| **AUTO** | AI opens/closes lanes based on thresholds |

**Setting Thresholds (AUTO mode):**
- **Lane-Open Threshold**: Queue length that triggers opening a new lane
- **Lane-Close Threshold**: Queue length below which AI closes a lane

### Agent Event Log

Scrollable log of all AI decisions with timestamps and reasoning.

---

## 8. Resource Optimization

**Route**: `/modules/trafficops/optimize`

NSGA-II multi-objective optimization for staff scheduling.

### Steps

1. **Select Scene** — Choose the checkpoint to optimize
2. **Configure Parameters**:
   - Population size (default: 50)
   - Generations (default: 100)
   - Objectives: Minimize Cost, Maximize Throughput
3. **Run** — Algorithm searches thousands of configurations
4. **Review Pareto Front** — Each point is an optimal cost/performance trade-off
5. **Select & Apply** — Choose the preferred solution (AI recommends the knee-point)

### Reading the Pareto Chart

- X-axis: Cost (lower is better)
- Y-axis: Throughput (higher is better)
- **Knee point** (⭐): Best balance between objectives
- Click any point to see its detailed staff configuration

---

## 9. Simulation Management

### Simulation Run List

**Route**: `/modules/trafficops/sim`

Browse, create, and compare DES simulation runs.

| Column | Description |
|--------|-------------|
| Run ID | Unique identifier |
| Scene | Checkpoint scene name |
| Status | Queued / Running / Completed / Failed |
| Created | Timestamp |
| Duration | Simulated time period |

### Creating a New Run

1. Click **+ New Simulation**
2. Select scene, set arrival rate, service time, duration
3. Set number of replications (default: 5)
4. Click **Create & Run**

### Run Detail View

Click any run to view:
- KPI summary cards (throughput, avg wait, P95 wait, utilization)
- Time-series charts (queue length, wait time, throughput over simulated time)
- Checkpoint-level breakdown table
- Bottleneck analysis

---

## 10. AI Advisor

### AI Chat

**Route**: `/chat`

Natural language interface to ask operational questions:

**Example Queries:**
- "Why did document-check have 45-minute waits yesterday?"
- "What is the optimal staff count for WCP Bus Hall during peak hours?"
- "Compare throughput between morning and evening shifts"

The AI will:
1. Call specialized tools to fetch data
2. Run analysis (statistical, simulation, or ML-based)
3. Return a structured diagnosis with evidence

### Advisor Dashboard

**Route**: `/advisor`

- Generated insights history
- Tool call audit trail
- Usage statistics

### Advisor Lab (SHAP)

**Route**: `/advisor/lab`

- SHAP explainability charts
- Feature importance rankings
- Interaction effect analysis

---

## 11. Demo Guide

**Route**: `/demo-guide`

Interactive demo walkthrough with 6 ICA scenarios:

| # | Scenario | Duration |
|---|----------|----------|
| 1 | Checkpoint Operations Overview | 4 min |
| 2 | AI Peak Hour Alert & Response | 5 min |
| 3 | Commander AI — Autonomous Lane Control | 4 min |
| 4 | Staff Optimization with NSGA-II | 4 min |
| 5 | Simulation & What-If Analysis | 5 min |
| 6 | AI-Powered Diagnostics | 4 min |

**How to use:**
1. Click a scenario card to open the walkthrough drawer
2. Follow the steps — each step has a "Go to Page" button
3. Read the description for context at each step
4. Use "Quick Start" buttons at the top to jump directly to key modules

---

## 12. FAQ

### General

**Q: What browsers are supported?**
A: Chrome 90+, Edge 90+, Firefox 90+, Safari 15+. Chrome is recommended.

**Q: Can I use it on a tablet?**
A: The platform is responsive but optimized for desktop (1280px+). Tablets work for monitoring but not for detailed analysis.

**Q: What is the data refresh rate?**
A: Real-time via SSE (Server-Sent Events). Dashboard data refreshes every 30 seconds. AI Monitor scans every 60 seconds.

### ICA Dashboard

**Q: Why are my KPI cards yellow/red?**
A: KPI cards show health status based on the ratio of arrival rate to capacity. Yellow means 85-120% utilization (approaching limits). Red means >120% (demand exceeds capacity).

**Q: What does the trophy icon (🏆) mean in What-If results?**
A: It marks the best-performing scenario based on overall KPI comparison.

**Q: What is ROI Score?**
A: Return on Investment score. It measures the value of wait-time reduction relative to cost. ROI > 1.5 means high value; ROI < 1.0 means the cost may not justify the benefit.

### AI Monitor

**Q: Do I need to expand action plans to approve them?**
A: No. The Approve button is visible on the summary line. You can approve without expanding.

**Q: What happens after I approve a plan?**
A: The plan status changes to APPROVED and the system begins executing the timeline steps. You can monitor progress in the event log.

**Q: Can I undo an approved plan?**
A: Currently, approved plans cannot be automatically reversed. You would need to manually adjust lane/staff configurations.

### Commander AI

**Q: What's the difference between AUTO and MANUAL?**
A: In MANUAL mode, all lane decisions require human action. In AUTO mode, the AI agent autonomously opens/closes lanes based on queue thresholds you set.

**Q: Is AUTO mode safe?**
A: The AI operates within the thresholds you define. It cannot exceed the configured lane limits. All actions are logged for audit.

### Simulation

**Q: How long does a simulation take?**
A: A single-scene DES simulation typically completes in 1-5 seconds. What-If experiments with 3 scenarios and 5 replications each take 3-10 seconds.

**Q: What does "replications" mean?**
A: Each replication is an independent simulation run with different random seeds. More replications give more statistically reliable results. Default is 5.

---

## ECM & Workflow Integration / ECM与工作流集成 (v3)

### Overview / 概述

The ICA module integrates with the platform's **Enterprise Content Management (ECM)** and **Workflow Engine** to provide:

1. **Approval Workflows** for AI action plans (审批工作流)
2. **Auto-generated Incident Reports** stored in ECM (自动事件报告)
3. **What-If Result Persistence** as capacity planning documents (仿真结果持久化)
4. **SOP Retrieval** via AI Advisor RAG search (SOP智能检索)

### Action Plan Approval Flow / 行动方案审批流程

| Urgency | Flow | SLA |
|---------|------|-----|
| CRITICAL | Auto-approve → Execute → Generate Report → Notify | Instant |
| WARNING | Supervisor Review → Approve/Reject → Execute → Generate Report | 2 hours |
| TIMEOUT | Auto-escalate to Manager → Execute | On supervisor timeout |

- **Approve & Execute** button routes through the Workflow Engine
- CRITICAL plans bypass manual review for immediate execution
- WARNING plans create a supervisor approval task
- On timeout, plans auto-escalate to prevent operational delays
- All decisions are recorded in the workflow audit trail

### ECM Document Types / ECM文档类型

| Type | Auto-Generated? | Description |
|------|----------------|-------------|
| INCIDENT_REPORT | Yes (on approval) | AI-generated incident report with problem, root cause, action taken, outcome |
| CAPACITY_PLANNING | Manual (Save to ECM) | What-If experiment results saved for future reference |
| SOP | Manual upload | Standard Operating Procedures for checkpoint operations |

### Tenant Isolation / 租户隔离

All ECM documents and workflow instances are scoped to the current tenant:
- Documents inherit `tenant_id` from the user's JWT token
- Workflow tasks are visible only to users in the same tenant
- ECM searches return only tenant-scoped documents
- Cross-tenant data access is prevented at the database level (Hibernate @Filter)

### API Endpoints / API端点

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/trafficops/workflow/action-plan/submit` | POST | Submit plan for workflow approval |
| `/api/v1/trafficops/workflow/action-plan/dismiss` | POST | Dismiss plan and cancel workflow |
| `/api/v1/trafficops/workflow/action-plan/{planId}/status` | GET | Get workflow status |
| `/api/v1/trafficops/workflow/task/{taskId}/approve` | POST | Approve a pending task |
| `/api/v1/trafficops/workflow/task/{taskId}/reject` | POST | Reject a pending task |
| `/api/v1/trafficops/workflow/ecm/incident-report` | POST | Generate incident report |
| `/api/v1/trafficops/workflow/ecm/what-if` | POST | Persist What-If results |

---

## Glossary / 术语表

| Term | CN | Definition |
|------|----|------------|
| AO | 运营区域 | Area of Operations — a functional zone within a checkpoint |
| DES | 离散事件仿真 | Discrete Event Simulation — simulates entities flowing through queues |
| DOE | 实验设计 | Design of Experiments — systematic method to test multiple factors |
| ECM | 企业内容管理 | Enterprise Content Management — document lifecycle, versioning, compliance |
| KPI | 关键绩效指标 | Key Performance Indicator |
| M/M/c | M/M/c排队 | Queuing model: Markov arrivals, Markov service, c servers |
| NSGA-II | NSGA-II算法 | Non-dominated Sorting Genetic Algorithm II — multi-objective optimizer |
| P95 | 第95百分位 | 95th percentile — 95% of values are below this |
| Pareto Front | 帕累托前沿 | Set of optimal trade-off solutions |
| RAG | 检索增强生成 | Retrieval-Augmented Generation — AI retrieves documents to enhance answers |
| ROI | 投资回报率 | Return on Investment |
| SHAP | SHAP值 | SHapley Additive exPlanations — ML explainability method |
| SLA | 服务等级协议 | Service Level Agreement (e.g., max 10 min wait) |
| SOP | 标准操作规程 | Standard Operating Procedure — documented step-by-step process |
| SSE | 服务端推送 | Server-Sent Events — real-time data push |
| Workflow | 工作流 | Formal approval chain with state machine, tasks, escalation, audit trail |
