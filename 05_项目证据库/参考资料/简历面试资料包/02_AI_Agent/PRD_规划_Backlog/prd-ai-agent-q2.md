# PRD: FactVerse AI Agent Q2 2026 升级

> 产品需求文档 | v2.1 | 2026-04-08
>
> 范围：AI Engine + Backend + Frontend 可交付部分

> **📅 更新说明（v2.1，2026-04-08）：** 以下项目已在本版本前交付，从 Q2 待办移至已完成：
> - ✅ **MCP Server**（`ai-engine/mcp_server.py`，Sprint 6 已完成）
> - ✅ **Prophet 时序预测**（`routers/core/prophet_forecaster.py`）
> - ✅ **DBSCAN 空间聚类**（`gpu-worker/engines/clustering.py`）
> - ✅ **GBR 回归模型**（XGBoost via `automl.py`）
> - ✅ **AutoML 模型自动选型**（`routers/core/automl.py`）

---

## 零、战略背景

### Physical AI Infrastructure 定位

FactVerse 的战略定位是 **Physical AI Infrastructure**——为工厂、设施、基础设施提供 AI 感知、分析、仿真和执行能力。不同于通用 AI 平台，FactVerse 专注物理世界的数字孪生闭环。

Q2 的核心战略转折点是 **MCP（Model Context Protocol）**：

> **MCP 是 Q2 战略关键。**
>
> 实现 MCP Server 后，FactVerse 成为 AI 生态的基础设施层——任何外部 AI Agent（Claude、GPT、Cursor、自研 Agent）均可通过标准协议调用 FactVerse 的 63+ 物理世界工具。这是 FactVerse 从"产品"升级为"平台"的关键一步。

**Q2 战略优先级**：

1. 🏭 **私有化分发**（Sprint 5）— 支撑横河等客户现场部署，P0
2. 🔌 **MCP 开放**（Sprint 6）— Physical AI Infrastructure 核心能力
3. 🤖 **AI 模型增强**（Sprint 7）— 预测精度与自动化提升
4. 💬 **What-If + Advisor 增强**（Sprint 8）— 决策支持深化

---

## 一、概述

### 目标

在 v2.2.0 基础上，Q2 重点交付：私有化分发能力（支撑横河 Phase 0-1）、MCP 开放平台（63+ 物理世界工具）、AI 模型增强（Prophet/DBSCAN/GBR/AutoML）、MLOps 可观测性前端、What-If 模板库与 Advisor 增强。

### 成功标准

| 指标 | 当前（v2.2.0） | Q2 目标 | 状态 |
|------|--------------|---------|------|
| 注册 AI 模型 | 12 | 18+ | ✅ 已达成（v2.3.0，2026-04） |
| MCP 工具数 | 0 | 63+ | ✅ 已交付（MCP Server 2026-04） |
| Advisor 工具 | 48 | 55+ | ✅ 已达成（60 工具） |
| What-If 模板 | 0 | 20+ | 🔄 进行中 |
| 私有化客户 | 0 | 1+（横河） | 🔄 进行中 |
| MLOps 可观测性 | 0 | 完整仪表板 | 🔄 进行中 |

### 非目标（本期不做）

- 联邦学习 / RL Agent 前端（Q3）
- 自然语言建模（Q3）
- 语音交互（Q3）
- 在线学习 / 增量更新（Q4）

---

## 二、已完成项（截至 v2.2.0，2026-03-21）

以下功能已在 v2.1.0 → v2.2.0 阶段完成交付：

### 🤖 AI / Advisor
- ✅ HeatOps 4个 AI Advisor 工具（热效率分析、预测性维护、节能建议、故障诊断）
- ✅ HeatOps dispatch demo loop（演示闭环派单流程）
- ✅ Hydraulic PPO agent（液压系统强化学习智能体）
- ✅ **Prophet 时序预测**（`prophet_forecaster.py`，支持节假日效应、趋势变点）
- ✅ **DBSCAN 空间聚类**（GPU clustering engine，支持空间异常检测）
- ✅ **GBR 回归模型**（XGBoost via AutoML，自动特征选择）
- ✅ **AutoML 模型自动选型**（`automl.py`，`POST /ai/automl/recommend`）
- ✅ **MCP Server**（`mcp_server.py`，端口 3002，JSON-RPC over stdio/SSE）

### ⚡ 运营自动化
- ✅ 碳排 daily auto-calculation + PDF 导出
- ✅ 告警自动派单（HIGH→WorkOrder + assign operator）
- ✅ Energy baseline 前后对比（基准线计算 + 可视化）

### 🏗 基础设施
- ✅ DFS Lite Modbus SIS 模板 + mock server
- ✅ License Key 机制（RSA256 JWT，支持离线验签）
- ✅ PostgreSQL RLS 全覆盖（170/354 表，V213+V214 完成）
- ✅ Blue/Green 零停机部署
- ✅ GPU Worker 架构（Redis 队列分发，支持并发 AI 任务）

### 🔒 安全
- ✅ Pentest Layer 2-3 完成（7/7 PASS）
- ✅ AI Engine 外网暴露修复

### 🛠 工程
- ✅ semver v2.1.0 → v2.2.0 + CHANGELOG 自动化
- ✅ develop 分支 + CI 分流 + Git Workflow 文档
- ✅ Fullscreen mode（?mode=fullscreen URL 参数支持）

---

## 三、Q2 Sprint 计划

### Sprint 5（3月底-4月初）— 私有化分发

**目标**：交付横河现场可用的完整安装包，支撑 Phase 0 现场调研与 4月部署。

| 任务 | 优先级 | 说明 |
|------|--------|------|
| `install.sh` 一键安装脚本 | P0（横河依赖） | 环境检测、依赖安装、服务拉起 |
| `docker-compose.yml` 生产编排 | P0 | 含 DB/Redis/Backend/Frontend/AI Engine |
| 离线镜像导出脚本 | P1 | `docker save` 打包 + 校验 |
| `upgrade.sh` 升级脚本 | P1 | 蓝绿切换 + 回滚保障 |
| 安装指南 4 语言 | P2 | 中文 / 英文 / 日文 / 阿拉伯文 |
| 横河 License JWT 签发 | P1 | 基于已有 RSA256 机制，定制横河 payload |

**横河 Phase 0-1 对齐**：

```
Sprint 5 完成 install.sh
    → Phase 0 现场调研（3月底）
        → 4月横河现场部署
            → Phase 1 验收
```

> ⚠️ **安装包必须在 Sprint 5 结束前交付**，以支撑横河 Phase 0 节点。

---

### Sprint 6（4月）— MCP 开放

**目标**：将 FactVerse 63+ 物理世界工具注册到 MCP，成为 Physical AI Infrastructure 标准接入层。

> ✅ **MCP Server 已交付（2026-04，详见 `ai-engine/mcp_server.py`）**

| 任务 | 说明 | 状态 |
|------|------|------|
| ~~MCP Server 实现~~ | ~~基于 Model Context Protocol，Python `mcp` SDK~~ | ✅ 已交付 |
| ~~63+ 物理世界工具注册到 MCP~~ | ~~覆盖感知 / 分析 / 仿真 / 执行四类~~ | ✅ 已交付 |
| ~~MCP 认证~~ | ~~API Key + OAuth 双模式~~ | ✅ 已交付 |
| ~~MCP 文档 + SDK 示例~~ | ~~Claude Desktop / Cursor / 自定义 Agent 接入示例~~ | ✅ 已交付 |

**工具分类（63+ 工具）**：

| 类别 | 工具示例 | 工具数 |
|------|----------|--------|
| 感知类 | `factverse_query_data`、`factverse_data_quality`、`factverse_list_connectors` | 8+ |
| 分析类 | `factverse_detect_anomaly`、`factverse_forecast`、`factverse_root_cause`、`factverse_recommend_model` | 8+ |
| 仿真类 | `factverse_whatif_run`、`factverse_whatif_cascade`、`factverse_whatif_templates` | 7+ |
| 执行类 | `factverse_create_workorder`、`factverse_retrain_model`、`factverse_generate_report` | 7+ |

**技术架构**：

```
AI 代理（Claude / GPT / Cursor / 自研）
    ↕ MCP 协议（JSON-RPC over stdio/SSE）
FactVerse MCP Server（Python，端口 3002）
    ↕ HTTP
FactVerse Backend API（Java）+ AI Engine（Python）
```

---

### Sprint 7（5月）— AI 模型增强

**目标**：扩展 AI 模型阵容至 18+，引入 AutoML 入口，上线 MLOps 可观测性仪表板。

> ✅ **以下任务已提前完成（2026-04）：**
> - Prophet 时序预测（`prophet_forecaster.py`）
> - DBSCAN 空间聚类（GPU clustering engine）
> - GBR 回归模型（XGBoost）
> - AutoML 模型自动选型（`automl.py`）

| 任务 | 说明 | 状态 |
|------|------|------|
| ~~Prophet 时序预测~~ | ~~自动处理节假日效应、趋势变点、季节性~~ | ✅ 已交付 |
| ~~DBSCAN 空间聚类~~ | ~~告警设备的空间关联分析~~ | ✅ 已交付 |
| ~~GBR 回归模型~~ | ~~轻量回归（能耗/温度预测）~~ | ✅ 已交付 |
| ~~AutoML 模型自动选型入口~~ | ~~`POST /ai/automl/recommend`，用户描述问题→推荐模型~~ | ✅ 已交付 |
| MLOps 前端仪表板 | 漂移监控 / 版本管理 / A/B 测试（4-Tab 页面） | 🔄 进行中 |

**MLOps 仪表板 Tab 结构**：
- Tab 1：模型监控（健康总览 + 模型列表）
- Tab 2：漂移检测（PSI 趋势图 + 特征热力图）
- Tab 3：A/B 测试（创建 / 列表 / 评估 / 部署）
- Tab 4：版本管理（时间线 + 回滚）

---

### Sprint 8（6月）— What-If + Advisor 增强

**目标**：提升决策支持深度，交付场景模板库、跨 session 对话记忆、报告自动生成。

| 任务 | 说明 |
|------|------|
| What-If 场景模板库 | 20+ 预置行业场景（交通 / 半导体 / 航空 / 供热 / 水务 / 能源） |
| 多轮对话记忆 | 跨 session 上下文（`advisor_conversations` 表持久化） |
| 报告自动生成优化 | 对话→PDF 报告，支持行业模板定制 |
| Advisor 工具链自动编排增强 | `POST /ai/advisor/plan`，自然语言→多工具执行计划 |

**What-If 场景模板示例**（20+ 预置）：

| 行业 | 模板 | 引擎组合 |
|------|------|---------|
| 交通 | 客流突增分析 | Erlang-C + DES + MC + Network |
| 半导体 | 洁净室容量规划 | SD + DES |
| 航空 | 发动机 RUL 预测 | Survival + Kalman |
| 供热 | 热负荷预测 | HoltWinters + Prophet |
| 水务 | 水质预测 | LSTM + Kalman |
| 能源 | PUE 优化 | DOE + Bayesian |
| 通用 | 设备故障预测 | Survival + XGBoost |
| 通用 | 人员排班优化 | CP-SAT + MC |

---

## 四、Feature 详细说明

### Feature 1：AI 模型增强（Sprint 7）

> ✅ **已完成（2026-04-08）**

#### 1.1 Prophet 时序预测

**为什么**：Holt-Winters 对不规则数据（节假日、突发事件）表现差。Prophet 是 Meta 开源的时序预测库，专为业务场景设计——自动处理节假日效应、趋势变点、季节性。

**需求**：
1. AI Engine 新增 Prophet 模型注册（`prophet_forecaster`）
2. 训练 API：`POST /ai/models/prophet_forecaster/train`
3. 预测 API：`POST /ai/models/prophet_forecaster/predict`
4. 支持参数：`changepoint_prior_scale`、`seasonality_mode`、`holidays` DataFrame
5. 自动加入 What-If 对比（Prophet vs HoltES vs LSTM）

#### 1.2 DBSCAN 空间聚类

**需求**：
1. AI Engine 新增 `dbscan_cluster` 模型
2. 输入：设备坐标 + 时序特征向量
3. 输出：聚类结果 + 噪声点标记
4. Advisor 新工具：`cluster_anomalies`

#### 1.3 GBR 回归预测

**需求**：
1. `gbr_regressor` 模型（sklearn.ensemble.GradientBoostingRegressor）
2. 自动特征选择（mutual_info_regression）
3. 交叉验证 + RMSE/MAE/R² 指标输出

#### 1.4 模型自动选型（AutoML 入口）

**需求**：
1. API：`POST /ai/automl/recommend`
2. 输入：`task_type`、`data_description`、`sample_data`（可选）
3. 输出：推荐模型列表（排序 + 理由）+ 自动训练建议

#### 1.5 模型注册小结

| 模型 | 类型 | 库 | 用途 |
|------|------|----|------|
| `prophet_forecaster` | 统计 | fbprophet | 不规则时序预测 |
| `dbscan_cluster` | ML | sklearn | 空间异常聚类 |
| `gbr_regressor` | ML | sklearn | 通用回归预测 |
| `sarima_forecaster` | 统计 | statsmodels | 强季节性时序 |
| `random_forest_classifier` | ML | sklearn | 多分类故障诊断 |
| `wavenet_forecaster` | DL | pytorch | 高频时序预测 |

注册后总计：12 现有 + 6 新增 = **18 个注册模型**

---

### Feature 2：MLOps 仪表板（Sprint 7）

**已有后端能力**（`ai-engine/routers/mlops.py`）：
- `GET /ai/mlops/models`、`POST /ai/mlops/drift/detect`
- `POST /ai/mlops/ab/create`、`GET /ai/mlops/ab/{id}`
- `GET /ai/mlops/versions/{model}`、`POST /ai/mlops/deploy`
- `POST /ai/mlops/rollback`、`GET /ai/mlops/metrics/{model}`
- `POST /ai/mlops/retrain`

**路由**：`/ai-models/mlops`（4-Tab 子页面）

---

### Feature 3：What-If 增强（Sprint 8）

#### 3.1 场景模板库

API：`GET /ai/whatif/templates`、`GET /ai/whatif/templates/{id}`

模板结构：
```json
{
  "id": "border-surge-analysis",
  "name": "口岸客流突增分析",
  "industry": "transportation",
  "engines": ["erlang_c", "des", "montecarlo", "network_flow"],
  "parameters": { ... },
  "outputs": ["optimal_lanes", "expected_wait", "sla_breach_probability"]
}
```

#### 3.2 仿真结果持久化

新建 `whatif_runs` 表（Flyway V179），支持历史记录查询与对比。

#### 3.3 多场景级联仿真

API：`POST /ai/whatif/cascade`，支持跨引擎参数传递（`$step1.result`）。

---

### Feature 4：Advisor 增强（Sprint 8）

#### 4.1 多轮对话记忆

新建 `advisor_conversations` 表（Flyway V180），支持跨 session 上下文续接。

#### 4.2 工具链自动编排

API：`POST /ai/advisor/plan`，输入自然语言问题，输出有序工具调用计划。

#### 4.3 新增 Advisor 工具（7个）

| 工具 | 描述 |
|------|------|
| `cluster_anomalies` | 空间聚类分析告警设备 |
| `compare_models` | 对比多模型预测效果 |
| `forecast_with_prophet` | 使用 Prophet 预测 |
| `check_model_drift` | 检查模型是否漂移 |
| `run_ab_test` | 创建/查看 A/B 测试 |
| `cascade_whatif` | 运行级联 What-If |
| `save_analysis` | 保存分析结果 |

新增 7 个，总计 **55+ 工具**。

---

### Feature 5：MCP Server（Sprint 6）

> ✅ **已完成（2026-04-08）** — `ai-engine/mcp_server.py`

MCP Server 完整实现后，FactVerse 成为首个支持 MCP 的 Physical AI Infrastructure 平台。

**开发者文档**提供：
1. 连接配置示例（Claude Desktop / Cursor / 自定义）
2. 工具参数说明 + 返回值示例
3. 使用场景教程（"如何用 Claude 调用 FactVerse 运行仿真"）

---

## 五、风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| install.sh 环境兼容性（横河 RHEL/Ubuntu） | Phase 0 延期 | 提前在 CI 多系统测试 |
| Prophet 依赖 PyStan，安装复杂 | AI Engine 构建失败 | Docker 预装 `prophet` pip 包 |
| MCP 协议变更 | 接口不兼容 | 跟踪 `modelcontextprotocol/specification` repo |
| MLOps 后端只是 mock 数据 | 前端好看但无真实功能 | 先做 UI + mock，逐步接入真实漂移计算 |
| 级联仿真引擎间参数不匹配 | 运行时错误 | 模板预定义参数映射 + 运行时类型检查 |
| 仿真持久化 JSONB 膨胀 | 数据库空间 | 设置 TTL（默认 90 天）+ 结果压缩 |

---

## 附录：数据库迁移汇总

| 编号 | 表 | 用途 |
|------|-----|------|
| V178 | `whatif_templates` | 场景模板注册表 |
| V179 | `whatif_runs` | 仿真运行结果持久化 |
| V180 | `advisor_conversations` | 对话历史持久化 |
| V181 | `model_versions` | 模型版本记录（扩展 MLOps） |
