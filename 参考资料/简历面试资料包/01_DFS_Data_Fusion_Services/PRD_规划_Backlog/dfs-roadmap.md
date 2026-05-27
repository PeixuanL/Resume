# PRD: DFS / Data Integration 路线图（Lite + Pro）

> 内部规划文档 | 2026-04-04
>
> 范围：Data Integration / DFS Lite / DFS Pro

---

## 一、目的

把当前 DFS 能力从“页面和配置存在”推进到“可交付、可运行、可治理”。

本规划同时覆盖两条产品线：

- **DFS Lite**：轻量接入、快速配置、基础质量、基础同步
- **DFS Pro**：治理、融合、方法资产、审批、审计、运营化

本文件的目标不是增加更多页面，而是明确：

1. Lite 和 Pro 的产品边界
2. 哪些是必须先补的 P0 闭环
3. 哪些能力决定 DFS 是否能面向真实客户落地

---

## 二、产品边界

## 2.1 DFS Lite 定位

DFS Lite 面向：

- 快速接入异构数据源
- 快速创建 connector / mapping / pipeline
- 基础质量检查
- 基础同步与运维可见性

Lite 的成功标准不是“能力全面”，而是：

- 快速接入
- 快速试通
- 快速跑通一条最小闭环
- 可稳定交付

## 2.2 DFS Pro 定位

DFS Pro 面向：

- 数据资产治理
- 数据融合与匹配
- 方法/规则资产化
- 任务执行与人工复核
- 审计、权限、责任归属
- 面向组织级长期运营

Pro 的成功标准不是“界面更复杂”，而是：

- 能管理数据资产生命周期
- 能执行融合任务
- 能跟踪质量与冲突
- 能形成组织级知识沉淀

## 2.3 边界原则

### DFS Lite 负责
- connector onboarding
- test connection
- schema discovery
- field mapping
- basic pipeline run
- basic quality dashboard
- sync history

### DFS Pro 负责
- dataset center
- method library
- fusion task orchestration
- governance canvas / pipeline governance
- human review / approval
- audit trail / lineage / ownership
- richer operations metrics

---

## 三、当前判断

## 3.1 DFS Lite 当前状态

优点：

- 后端 connector / mapping / quality / pipeline / sync 骨架已具备
- 已经有真实 testConnection / discoverSchema 等能力

问题：

- 前端仍存在 mock / fallback / 假成功路径
- 向导流程没有完全接到真实执行链路
- 运行态、状态机、聚合视图不够强
- 更像“可演示”，还不是“可稳定交付”

## 3.2 DFS Pro 当前状态

优点：

- 产品结构已经形成：Dataset Center / Method Library / Fusion Task / Governance
- 比 Lite 更接近平台级能力

问题：

- 更偏“高级 CRUD + 页面骨架”，还不是执行闭环
- 任务运行、方法资产、人工复核、审计指标还不完整
- 如果不尽快拉正，会出现 Lite / Pro 能力重叠、边界模糊

---

## 四、DFS Lite 路线图

## 4.1 Lite P0（必须先做）

### P0-1 去掉假闭环

目标：

- 去掉前端的 mock/fallback 假数据
- 去掉“表面成功、实际没跑”的路径

要做：

- 连接器列表失败时不再 fallback 到 mock connectors
- SyncHistory 不再 fallback 到 mock logs
- QualityDashboard 失败时显示明确错误态而不是伪数据
- 向导里的 test connection 改成真实 API 调用
- “创建并启动”必须真正触发后端执行链路

价值：

- 防止用户和 bot 误判系统状态
- 提高运维可见性
- 让错误暴露在正确位置

### P0-2 真实向导闭环

目标：

- 打通：test → schema → mapping → create → start

要做：

- 真实 test connection
- 真实 schema discovery / browse
- 真实 AI mapping suggestion
- 真实 create pipeline
- 真实 trigger sync / start run
- 成功后跳转到真实运行状态页

### P0-3 运行状态机与运行记录

目标：

- 让 Lite 不只是配置入口，而是有“运行事实”

要做：

- connector status：draft / testing / ready / syncing / paused / failed
- pipeline run 记录
- sync history 真实化
- 错误分类、重试、耗时、数据量统计

## 4.2 Lite P1（可交付增强）

### P1-1 后端聚合接口

要做：

- dashboard summary
- sync history aggregation
- connector health summary
- quality issue aggregation

目标：

- 降低前端拼装逻辑
- 避免 N+1 请求
- 统一分页 / 筛选 / 汇总口径

### P1-2 连接器能力模型统一

要做：

- supportsTest
- supportsSchemaDiscovery
- supportsPreview
- supportsIncremental
- supportsPushdownFilter

并统一：

- timeout
- retry
- error taxonomy
- preview response schema

### P1-3 基础测试补齐

要做：

- connector integration tests
- mapping round-trip tests
- sync state transition tests
- 向导关键 happy path / failure path 测试

## 4.3 Lite P2（产品化）

- schema discovery 结果缓存
- connector template marketplace
- connector health alerts
- 低代码 pipeline preset

---

## 五、DFS Pro 路线图

## 5.1 Pro P0（核心价值闭环）

### P0-1 Fusion Task 运行系统化

目标：

- 从“任务配置”升级为“任务执行系统”

要做：

- run history
- execution status machine
- retry / schedule
- success / rejected / review-required 统计
- 冲突与失败原因记录

### P0-2 Method Library 资产化

目标：

- 从“方法说明页”升级为“可复用方法资产”

要做：

- method versioning
- sample input / expected output
- basic method test harness
- method usage tracking
- method performance metrics

### P0-3 Governance 执行化

目标：

- 从“画布”升级为“治理编排器”

要做：

- node execution semantics
- pipeline run records
- step debug / step result
- published vs draft pipeline
- node-level failure visibility

### P0-4 去掉 Pro 前端假数据/伪流程

目标：

- Pro 页面不能只是高级展示层

要做：

- Dataset Center / Fusion Task / Governance 等页面失败时使用真实错误态
- 去掉关键流程中的演示 fallback
- 明确空状态与运行状态

## 5.2 Pro P1（治理能力增强）

### P1-1 Dataset Center 升级为资产运营中心

要做：

- schema version
- sample preview
- data profile
- quality status
- ownership / steward
- lineage / downstream impact

### P1-2 人工复核与审批

要做：

- low-confidence review queue
- conflict review queue
- approval workflow
- manually resolved state
- reviewer attribution

### P1-3 审计与权限

要做：

- dataset-level RBAC
- method edit permission
- fusion publish / run permission
- audit trail
- sensitive-field masking in preview

### P1-4 指标化运营

要做：

- datasets onboarded
- methods reused
- fusion success rate
- review rate
- duplicate reduction
- time saved / quality improved

## 5.3 Pro P2（差异化能力）

- method DSL / executable rule layer
- intelligent method recommendation
- auto policy tuning
- cross-project reusable method templates
- review workload optimization

---

## 六、跨产品线共同要求

## 6.1 安全要求

必须遵守：

- connector credentials 不明文回显
- 日志不打印 secret / token / password
- preview/sample 接口脱敏
- 审计关键操作
- 外部连接做白名单/边界控制

## 6.2 可观测性要求

必须具备：

- clear error taxonomy
- status transitions
- run duration
- row counts / issue counts
- user-action audit trail

## 6.3 测试要求

至少覆盖：

- 关键后端状态转换
- 关键向导闭环
- 关键页面失败态
- 至少一个真实数据源集成测试

---

## 七、建议实施顺序

## Phase 1（2-3 周）

优先把 Lite 从 demo 态拉到可交付态：

1. 去掉 Lite 假数据/假成功
2. 打通真实向导闭环
3. 补状态机与 sync history
4. 补基础测试

## Phase 2（3-4 周）

把 Pro 从高级 CRUD 拉到执行闭环：

1. Fusion Task 运行系统
2. Method Library 版本化/测试化
3. Governance pipeline run / debug
4. Dataset Center profile / lineage

## Phase 3（后续迭代）

做治理差异化：

1. 人工复核与审批
2. 审计与 RBAC
3. 运营指标体系
4. 规则/方法执行引擎升级

---

## 八、并行分工建议

适合并行的工作流：

### Stream A — Lite 闭环
- ConnectorWizard
- ConnectorList
- SyncHistory
- QualityDashboard
- Lite 聚合接口

### Stream B — Pro 执行与治理
- FusionTask
- MethodLibrary
- Governance canvas
- DatasetCenter

### Stream C — 底层与平台
- connector capability model
- status machine
- error taxonomy
- audit / RBAC
- testing harness

---

## 九、成功标准

### Lite 成功标准
- connector 向导不再使用 fake success
- demo 登录态下可真实创建并启动一条同步链路
- sync history / quality 数据来自真实后端
- 关键路径失败时给出清晰错误态

### Pro 成功标准
- fusion task 有真实运行记录与状态流转
- method library 支持版本和测试
- governance pipeline 可运行、可调试、可发布
- dataset center 有 profile / lineage / ownership / quality context
- review / audit / permission 框架具备雏形

---

## 十、非目标

本阶段不追求：

- 一次性做完所有 connector 类型
- 一次性做完整规则 DSL
- 一次性做全自动智能融合
- 把 Lite 和 Pro 完全合并成单一产品

当前目标是：

- 先把 Lite 做稳
- 再把 Pro 做成真正的治理/融合平台雏形
