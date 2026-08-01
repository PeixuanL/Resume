# PRD Breakdown: DFS Lite 任务拆解

> 基于 `docs/prd/dfs-roadmap.md` 的执行拆解文档
>
> 目标：把 DFS Lite 从“可演示”推进到“可稳定交付”

---

## 一、目标

DFS Lite 的阶段目标不是功能越多越好，而是尽快形成一个**真实、稳定、可运维**的轻量数据接入闭环：

- 真连
- 真测
- 真跑
- 真报错
- 真可见

最终交付标准：

1. 用户能真实创建 connector
2. 用户能真实测试连接、发现 schema、生成 mapping
3. 用户能真实创建并启动同步
4. 历史、质量、运行态来自真实后端，不依赖 mock / fallback
5. 故障时能明确看到错误而不是假成功

---

## 二、范围

### In Scope
- Connector onboarding
- Test connection
- Schema discovery / browse
- Field mapping
- Basic pipeline creation
- Sync start / stop / status
- Quality dashboard
- Sync history
- Connector health summary

### Out of Scope
- 复杂审批流
- 组织级方法资产库
- 高级融合冲突治理
- 大规模人工 review queue
- 完整规则 DSL

这些属于 DFS Pro 范围。

---

## 三、拆解原则

### 原则 1：先去假，再加真
先去掉 mock/fallback/假成功，再做增强。

### 原则 2：后端事实优先
前端状态必须由后端状态驱动，不能由页面自行“猜一个成功态”。

### 原则 3：状态机先于漂亮页面
先把执行状态和历史记录做实，再优化展示层。

### 原则 4：错误可见比“体验顺滑”更重要
错误必须暴露到正确位置，不能被 demo fallback 吞掉。

---

## 四、P0 工作包

## L0-1 去掉假闭环（最高优先级）

### 目标
让 DFS Lite 所有核心页面在失败时表现真实，不再伪造成功结果。

### 要做

#### Frontend
- `ConnectorListView`：去掉 mock connector fallback
- `ConnectorWizardView`：去掉本地 setTimeout 假成功 test connection
- `SyncHistoryView`：去掉 mock logs fallback
- `QualityDashboardView`：去掉伪 dashboard 数据 fallback
- 明确区分：
  - loading
  - empty
  - backend unavailable
  - validation failed
  - source connection failed

#### Backend
- 统一返回错误码/错误结构
- 给 connector / mapping / sync 相关接口补齐错误语义

#### QA
- 为每个页面定义至少 1 个失败态截图/预期

### 验收标准
- 核心流程失败时，不再看到伪数据
- 页面不会因为 fallback 看起来“像成功”
- 失败信息可定位到 connector / auth / schema / network 等类别

---

## L0-2 真实向导闭环

### 目标
打通：test -> schema -> mapping -> create -> start

### 要做

#### Frontend
- 向导 test connection 调用真实后端 API
- schema tree / source fields 使用真实 browse/discovery 结果
- AI mapping suggestion 基于真实 schema
- “创建并启动”真正触发：
  - create connector
  - create pipeline/mapping
  - trigger sync/run
- 成功后跳到真实运行状态页

#### Backend
- 保证以下接口闭环可用：
  - test connection
  - discover schema
  - create connector
  - create pipeline
  - start sync / run
- 返回统一的 task/run identifiers

#### UX
- 每一步必须有明确状态反馈
- 不允许一键触发后 silent failure

### 验收标准
- demo 登录态下可真实完成一次最小链路
- 不是只把 connector 保存到 DB，而是能进入真实执行

---

## L0-3 运行状态机与历史记录

### 目标
让 Lite 成为一个“可运维”的运行面。

### 要做

#### 状态机
- Connector:
  - draft
  - testing
  - ready
  - syncing
  - paused
  - failed
- Pipeline/Run:
  - pending
  - running
  - succeeded
  - failed
  - cancelled

#### 运行记录
- startedAt
- finishedAt
- duration
- rowsRead
- rowsWritten
- rowsRejected
- retryCount
- errorType
- errorMessage（脱敏）

#### 页面落地
- SyncHistoryView 使用真实 run records
- ConnectorList 可显示最新运行状态
- Dashboard 可显示最近失败/成功摘要

### 验收标准
- 任何一次 sync 运行都能在历史中看到
- 历史记录能反映真实状态变化
- 支持基本排序/筛选

---

## L0-4 聚合接口与最小运维面板

### 目标
避免前端自行拼大量请求，统一 Lite 运行口径。

### 要做

#### Backend 聚合接口
- dashboard summary
- connector health summary
- latest run summary
- quality issue summary

#### Frontend
- Dashboard 改为消费聚合接口
- 列表页减少前端拼装逻辑

### 验收标准
- 页面请求数量下降
- 汇总数字有统一口径
- 前端不再自己拼接业务语义

---

## 五、P1 工作包

## L1-1 Connector 能力模型统一

### 要做
- supportsTest
- supportsSchemaDiscovery
- supportsPreview
- supportsIncremental
- supportsPushdownFilter
- 统一 timeout / retry / error taxonomy

### 价值
后续新增 connector 时不会每种都走自己的野路子。

---

## L1-2 基础质量能力做实

### 要做
- quality issue 分类
- dataset / field 维度 drill-down
- quality trend
- basic quality score
- 最近失败规则详情

### 价值
Lite 不只是“导进来”，而是“导进来后可判断质量”。

---

## L1-3 测试补齐

### 要做
- connector integration tests
- mapping round-trip tests
- sync state transition tests
- wizard happy/failure path tests

### 验收标准
- 至少关键链路可以在 CI 中自动回归

---

## 六、P2 工作包

## L2-1 可复用 connector 模板
- 常见数据库 / API 模板
- 默认字段映射建议
- 常见错误提示模板

## L2-2 schema discovery cache
- 缓存 browse/discovery 结果
- 减少重复探测开销

## L2-3 低代码 preset
- 用预设快速生成 pipeline

---

## 七、并行实施建议

### Stream A：前端闭环
- ConnectorWizard
- ConnectorList
- SyncHistory
- QualityDashboard

### Stream B：后端执行与聚合
- test/discover/create/start 链路
- run records
- state machine
- dashboard aggregation

### Stream C：质量与可靠性
- error taxonomy
- connector capability model
- tests
- observability

---

## 八、风险

### 风险 1：继续保留 fake fallback
后果：用户和 bot 会误判系统可用性。

### 风险 2：前端状态与后端状态不一致
后果：看起来在跑，实际没跑；或页面停留在旧状态。

### 风险 3：历史记录结构过弱
后果：出了问题没法运维，也没法支持交付验收。

---

## 九、完成定义（Definition of Done）

满足以下条件，才算 DFS Lite P0 完成：

- mock/fallback 假闭环已移除
- 向导可真实完成 test -> schema -> mapping -> create -> start
- SyncHistory 来自真实 backend run records
- Dashboard 不再依赖伪数据
- 失败态清晰可见
- 至少有一套关键路径自动化测试
