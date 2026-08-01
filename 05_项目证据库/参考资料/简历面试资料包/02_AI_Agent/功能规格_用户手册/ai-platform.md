# AI 平台用户指南

> 面向运维人员和管理员的 AI 模型查看与 AI 指南模块使用手册。

---

## 1. AI Guide — AI 指南

**导航路径：** `/ai-guide`

AI 指南页面展示平台内置的所有 AI 模型，帮助用户了解平台 AI 能力。

### 模型展示

当前注册了 **22 个 AI 模型**，分为 6 个类别：

| 类别 | 模型数 | 示例 |
|------|--------|------|
| ML（机器学习） | 6 | Isolation Forest、AutoEncoder、XGBoost、Anomaly Detection Suite、PDM 健康/RUL/FFT |
| Simulation（仿真） | 5 | DES、ABM、Monte Carlo、System Dynamics、Scenario DAG |
| Optimization（优化） | 4 | MILP、Bayesian、NSGA-II、Constraint Programming |
| Analysis（分析） | 3 | SHAP、Drift Detection、Conformal Prediction |
| Knowledge（知识） | 2 | RAG Pipeline、Knowledge Graph |
| Data（数据） | 2 | ESG Carbon Analytics、DFS Data Quality & Auto-Mapping |

### 功能

- **租户感知**：自动根据当前租户启用的模块过滤显示相关模型
- **类别筛选**：6 个类别标签切换
- **搜索**：按模型名称搜索
- **模型卡片**：展示模型名称、描述、类别、使用的算法

> **注意：** AI Guide 是展示页面，不提供模型训练/部署操作。模型由 AI Engine 自动管理。

---

## 2. AI Advisor — AI 助手

**导航路径：** 全局浮动按钮 "Ask AI"（所有页面可用）

**API：** `POST /ai/advisor/chat`（注意：走 AI Engine 路径，非 `/api/v1`）

### 功能

- **上下文对话**：基于当前页面上下文的 AI 对话
- **工具调用**：AI 可调用 12 个 Advisor Tools 进行分析
- **RAG 增强**：结合知识库内容回答问题

详细使用说明参见 [AI Advisor 用户指南](ai-advisor.md)。

---

## 3. MLOps — 模型运维

**导航路径：** `/ai-models`

### 模型监控

- **模型健康**：查看各模型运行状态
- **漂移检测**：数据分布漂移警告
- **A/B 实验**：模型版本对比

> **注意：** MLOps 功能目前主要通过 AI Engine 后台自动运行，前端提供查看界面。模型训练和部署由 AI Engine 自动管理。
