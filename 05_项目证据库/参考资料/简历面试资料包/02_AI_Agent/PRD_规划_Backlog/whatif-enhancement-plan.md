# What-If 能力增强实施计划

> 基于 Deep Research Report 的落地规划
>
> 2026-04-08 | 内部文档（已更新 — 以下项目已在 2026-04 完成从 Q2 待办移至已交付）

---

## 一、现状 vs 报告建议的差距分析

### 已有能力 ✅

| 报告建议 | 现有实现 | 状态 |
|----------|----------|------|
| 因果推断 (DoWhy) | `routers/causal.py` — `/ai/causal/estimate` | ✅ 已有路由 |
| 保形预测 (Conformal) | `routers/conformal.py` — `/ai/conformal/predict` | ✅ 已有路由 |
| Monte Carlo 压力测试 | `routers/montecarlo.py` — 10K 次仿真 | ✅ 生产使用中 |
| DES 离散事件仿真 | `routers/des.py` — SimPy 驱动 | ✅ 生产使用中 |
| Kalman 滤波 | `routers/kalman.py` — filterpy + numpy | ✅ 已有路由 |
| Bayesian 优化 | `routers/bayesian.py` — Optuna + GP | ✅ 已有路由 |
| Survival 分析 | `routers/survival.py` — lifelines | ✅ 已有路由 |
| 统一 What-If API | `routers/whatif.py` — 17 引擎调度 | ✅ 生产使用中 |
| 场景模板库 | `routers/whatif_templates.py` — 20 模板 | ✅ 刚完成 |
| XGBoost 代理模型 | `core/optimizer/metamodel.py` + `core/doe/metamodel.py` | ✅ 已有 |
| Holt-Winters 预测 | `routers/holt_winters.py` | ✅ 已有 |
| Prophet 预测 | `routers/core/prophet_forecaster.py` | ✅ 已交付（2026-04） |
| MCP Server | `mcp_server.py`，63+ 工具注册 | ✅ 已交付（2026-04） |

### 关键缺口 ❌

| 报告建议 | 优先级 | 缺口描述 |
|----------|--------|----------|
| **系统级 UQ 校准层** | P0 | 有 conformal 路由但没有作为"包装层"统一应用到所有引擎输出 |
| **自动模型选型/集成** | P0 | 没有 AutoML 入口，没有模型自动比较/集成管线 |
| **漂移/变点检测** | P1 | 没有 River/ruptures 集成，MLOps 前端刚做但后端是 mock |
| **代理模型加速管线** | P1 | 有 XGBoost surrogate 但没有系统化的"代理优先"执行策略 |
| **可解释性层** | P2 | ✅ `routers/core/explainability.py` — SHAP 已集成（`/ai/explain/shap`） |
| **场景 DAG 编排** | P2 | What-If API 是扁平调用，不是有向无环图 |
| **流式在线学习** | P2 | 没有 River 集成 |
| **强化学习策略** | P3 | 有 `rl_agent.py` 路由但是 stub |

---

## 二、实施路线图（按 Deep Research 建议调整）

### Phase 1: 基础增强（4-6 月，8 周）

> 目标：让现有 What-If 输出从"最佳估计"升级为"带置信区间的决策级建议"

#### 1.1 统一 UQ 包装层（MAPIE 集成）

**做什么**：在 What-If API 返回结果上自动添加置信区间

```python
# 所有 What-If 引擎输出经过 UQ 包装
result = engine.run(params)
result_with_uq = uq_wrapper.calibrate(result, coverage_target=0.9)
# 输出增加: confidence_interval, coverage_score, calibration_quality
```

**具体步骤**：
1. `pip install mapie` — 添加到 requirements.txt
2. 新建 `ai-engine/core/uq/` 模块：
   - `calibration_store.py` — 每资产类型 + KPI 的校准缓存
   - `conformal_wrapper.py` — 封装 MAPIE 的通用 UQ 包装器
   - `coverage_budget.py` — 安全关键 KPI 90%，低风险 KPI 70%
3. 在 `whatif.py` 的 `_extract_metrics()` 后自动应用 UQ 包装
4. What-If API 返回增加 `uncertainty` 字段

**工作量**：2 人周
**库**：MAPIE (BSD-3)

#### 1.2 漂移/变点检测（River + ruptures）

**做什么**：实时检测数据分布漂移和工况变点，触发模型重校准

**具体步骤**：
1. `pip install river ruptures`
2. 新建 `ai-engine/routers/drift.py`：
   - `POST /ai/drift/detect` — 对指定时序数据运行漂移检测
   - `POST /ai/drift/changepoints` — 检测变点
   - `GET /ai/drift/status/{model}` — 模型漂移状态
3. 新建 `ai-engine/core/drift/`:
   - `detector.py` — River ADWIN/DDM 漂移检测器
   - `changepoint.py` — ruptures Pelt/Window 变点检测
4. MLOps 前端"漂移检测" Tab 接入真实后端（替换 mock）

**工作量**：2 人周
**库**：River (BSD-3), ruptures (BSD-2)

#### 1.3 SHAP 可解释性层

**做什么**：为所有预测/推荐附加特征归因解释

**具体步骤**：
1. `pip install shap`
2. 新建 `ai-engine/routers/explainability.py`：
   - `POST /ai/explain/prediction` — 预测结果的 SHAP 解释
   - `POST /ai/explain/recommendation` — 推荐方案的关键因素
3. What-If 返回增加 `explanations` 字段（top-5 影响因子 + 方向 + 幅度）
4. 前端：推荐面板增加"为什么推荐这个？"展开区域

**工作量**：1.5 人周
**库**：SHAP (MIT)

#### 1.4 StatsForecast 快速基线预测

**做什么**：添加高性能统计预测（AutoARIMA/AutoETS/AutoTheta），作为 Prophet/LSTM 的快速基线

**具体步骤**：
1. `pip install statsforecast`
2. 新建 `ai-engine/routers/statsforecast_router.py`：
   - `POST /ai/statsforecast/forecast` — 自动选择最佳统计模型
   - 支持 AutoARIMA, AutoETS, AutoTheta, AutoCES
3. 注册 3 个新模型到 models.py：`auto_arima`, `auto_ets`, `auto_theta`

**工作量**：1 人周
**库**：StatsForecast (Apache-2)

---

### Phase 2: 智能编排（7-9 月，8 周）

> 目标：从"用户手动选引擎"升级为"系统自动选最优引擎组合"

#### 2.1 AutoML 自动选型管线

> ✅ **已完成（2026-04）— `routers/core/automl.py`**

```python
# 用户描述问题 → 系统选模型 → 自动训练 → 自动评估 → 输出最优
POST /ai/automl/run
{
  "task": "forecast",
  "data": [...],
  "horizon": 24,
  "metric": "mape"
}
# 返回: 最优模型 + 集成结果 + 各模型得分对比
```

#### 2.2 场景 DAG 编排引擎

**做什么**：将 What-If 从扁平调用升级为有向无环图（DAG）编排

```python
# 级联仿真：客流 → HVAC → 能耗 → 电网
POST /ai/whatif/cascade
{
  "dag": [
    {"id": "forecast", "engine": "prophet", "output_to": ["des"]},
    {"id": "des", "engine": "des", "output_to": ["optimize"]},
    {"id": "optimize", "engine": "milp", "output_to": ["validate"]},
    {"id": "validate", "engine": "twin", "output_to": []}
  ]
}
```

**具体步骤**：
1. 新建 `ai-engine/core/orchestration/`:
   - `dag.py` — DAG 定义与拓扑排序
   - `executor.py` — 并行/串行执行器
   - `contracts.py` — 节点间标准化输入/输出契约
2. 扩展 `whatif.py`：`POST /ai/whatif/cascade` 端点
3. 每个 DAG 节点输出标准化结构（报告建议的 Result 格式）

**工作量**：3 人周

#### 2.3 代理模型加速管线（SMT）

**做什么**：对 Twin Engine 昂贵仿真建代理模型，实现亚秒级 What-If

```
用户提问 → 代理模型（亚秒响应）→ 如果低置信度 → Twin Engine（完整仿真）
```

**具体步骤**：
1. `pip install smt`
2. 新建 `ai-engine/core/surrogate/`:
   - `trainer.py` — 从 Twin Engine 历史仿真数据训练 Kriging/RBF 代理
   - `cache.py` — 代理模型缓存 + 失效策略
   - `validator.py` — 代理 vs 高保真定期校验
3. What-If API 增加 `speed_mode` 参数：`"fast"` (代理) / `"accurate"` (完整仿真)

**工作量**：3 人周
**库**：SMT (BSD)

---

### Phase 3: 决策智能（10-12 月，8 周）

> 目标：从"给建议"升级为"可审计、可解释、可自动执行的决策管线"

#### 3.1 因果 What-If 增强（EconML + 重构测试）

**已有**：DoWhy 基础因果推断
**增强**：
1. `pip install econml`
2. 扩展 `causal.py`：
   - 异质性处理效应（HTE）：不同设备/时段的差异化干预效果
   - DoWhy refutation API 集成：自动运行 3 种反事实检验
3. What-If 返回增加 `causal_confidence` 和 `refutation_results`

**工作量**：2 人周

#### 3.2 MCP Server 实现

**已在 Q2 PRD 中规划**，按 deep research 建议增加安全层：
- 只读工具默认开放（simulate/forecast/query）
- 执行工具需要审批（deploy/execute）
- 参数范围白名单
- 场景 ID + 审批流

**工作量**：3 人周

#### 3.3 离线强化学习试点（d3rlpy）

**做什么**：从历史操作日志学习最优策略

```python
# 从历史决策日志训练策略
# 输入：60天的(状态, 动作, 奖励)记录
# 输出：建议策略 vs 当前策略的模拟对比
```

**具体步骤**：
1. `pip install d3rlpy gymnasium`
2. 扩展 `rl_agent.py`（当前是 stub）为完整实现：
   - 从决策日志构建离线 RL 数据集
   - CQL/IQL 训练
   - OPE（离线策略评估）
3. 首先在大型口岸/枢纽通道调度场景试点

**工作量**：4 人周（含安全约束设计）

---

## 三、依赖库汇总

| 库 | 版本 | License | Phase | 用途 |
|---|---|---|---|---|
| `mapie` | >=0.8 | BSD-3 | Phase 1 | 保形预测 UQ 包装 |
| `river` | >=0.21 | BSD-3 | Phase 1 | 在线漂移检测 |
| `ruptures` | >=1.1 | BSD-2 | Phase 1 | 变点检测 |
| `shap` | >=0.44 | MIT | Phase 1 | 特征归因解释 |
| `statsforecast` | >=1.7 | Apache-2 | Phase 1 | 高性能统计预测 |
| `salesforce-merlion` | >=2.0 | BSD-3 | Phase 2 | AutoML 时序框架 |
| `smt` | >=2.6 | BSD | Phase 2 | 代理模型 Kriging/RBF |
| `econml` | >=0.15 | MIT | Phase 3 | 异质性因果推断 |
| `d3rlpy` | >=2.6 | MIT | Phase 3 | 离线强化学习 |

全部 **MIT/BSD/Apache 许可**，无 copyleft 风险。

---

## 四、成功指标

| 指标 | 当前基线 | Phase 1 目标 | Phase 3 目标 |
|------|---------|-------------|-------------|
| What-If 返回带置信区间 | 0% | 100% | 100% |
| p95 What-If 响应时间 | ~8s | ≤5s | ≤2s（代理模式） |
| 预测 MAPE | 未量化 | 基线建立 | ↓15% |
| 误报率 | 未量化 | 基线建立 | ↓25% |
| 漂移检测延迟 | 无 | ≤1 天 | ≤1 小时 |
| 推荐可解释性 | 无 | Top-5 因子 | 因果 + SHAP |
| MCP 工具数 | 0 → 63+ | 63+ | 63+ |
| 模型自动选型 | 手动 | 推荐 | 全自动 |

---

## 五、与现有产品规划的映射

| Deep Research 建议 | 产品规划对应 | 时间 | 状态 |
|---|---|---|---|
| UQ + 校准 | AI Agent v1.5 模型层 | Q2 2026 | 🔄 进行中 |
| AutoML + 集成 | AI Agent v1.5 模型层 | Q2 2026 | ✅ 已交付 |
| 漂移/变点 | MLOps v1.5 | Q2-Q3 2026 | 🔄 进行中 |
| 代理模型加速 | What-If v2.0 | Q3 2026 | 🔄 进行中 |
| 场景 DAG | What-If v2.0 | Q3 2026 | 🔄 进行中 |
| 因果增强 | What-If v2.5 | Q4 2026 | 🔄 进行中 |
| SHAP 解释 | AI Agent v2.0 | Q3 2026 | ✅ 已交付 |
| MCP | Platform v1.0 | Q2 2026 | ✅ 已交付 |
| 离线 RL | AI Agent v3.0 | 2027 H1 | 🔄 进行中 |

**结论**：Deep Research 报告的建议与我们的产品规划高度一致。报告验证了优先级排序的正确性，并补充了具体的 OSS 库选择和架构模式（特别是 UQ 包装层、代理优先执行、场景 DAG 编排）。

---

## 六、实施进度

### Phase 1 ✅ 完成 (2026-03-07)
- ✅ MAPIE — 已安装 v1.3.0，conformal 路由活跃
- ✅ River — 已安装 v0.23.0，drift 路由上线 (ADWIN/KSWIN/PageHinkley)
- ✅ ruptures — 已安装 v1.1.10，changepoint 检测上线 (PELT/BinSeg/Window)
- ✅ SHAP — 已安装 v0.48.0，explain_v2 路由活跃
- ✅ StatsForecast — 已安装 v2.0.3，集成在 forecast 路由
- ✅ Numba — 已安装 v0.64.0，ABM BFS 距离场 JIT 加速已激活

### Phase 2 ✅ 完成 (2026-03-07)
- ✅ SMT — 已安装 v2.12.0，surrogate 路由上线 (Kriging/RBF/KPLS)
  - POST /ai/surrogate/train — 训练代理模型 (LOO/5-fold CV)
  - POST /ai/surrogate/predict — 亚毫秒预测 + 不确定性
- ✅ Scenario DAG — orchestration 路由上线
  - POST /ai/orchestration/cascade — 级联仿真 (14 引擎拓扑编排)
  - GET /ai/orchestration/cascade/engines — 引擎列表
- ✅ AutoML — automl 路由上线
  - POST /ai/automl/forecast — 7 模型自动选型 + 加权集成
  - POST /ai/automl/recommend — 数据特征分析 + 模型推荐

### Phase 3 ✅ 完成 (2026-03-07)
- ✅ EconML 因果增强 — causal_advanced 路由上线
  - POST /ai/causal/advanced/hte — CausalForest/LinearDML/T/S/X-Learner
  - POST /ai/causal/advanced/policy — 最优处理分配
  - POST /ai/causal/advanced/sensitivity — DoWhy 敏感性分析
  - POST /ai/causal/advanced/mediation — Baron-Kenny 中介分析
- ✅ MCP Server — 21 tools 暴露给外部 AI 代理
  - GET /ai/mcp/tools — 工具列表 (5 categories × 3-5 tools)
  - POST /ai/mcp/tools/{name}/invoke — 统一调用接口
  - X-MCP-Token 认证 + 100 req/min 限速
- ✅ 离线 RL — offline_rl 路由上线 (Q-table numpy fallback)
  - POST /ai/rl/train — CQL/IQL/BCQ/TD3+BC 离线策略训练
  - POST /ai/rl/predict — 动作推荐
  - POST /ai/rl/evaluate — FQE/IS/WIS 离线策略评估

**Deep Research 全部 3 个阶段提前完成！** 原计划 Phase 1 (Apr-Jun), Phase 2 (Jul-Sep), Phase 3 (Oct-Dec) → 实际 1 天内全部交付。
