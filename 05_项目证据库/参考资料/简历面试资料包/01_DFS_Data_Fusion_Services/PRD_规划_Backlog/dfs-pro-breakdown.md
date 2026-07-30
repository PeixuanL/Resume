# PRD Breakdown: DFS Pro 任务拆解

> 基于 `docs/prd/dfs-roadmap.md` 的执行拆解文档
>
> 目标：把 DFS Pro 从“高级 CRUD 平台”推进到“真正可执行的数据治理与融合工作台”

---

## 一、目标

DFS Pro 的目标不是比 Lite 多几个页面，而是成为：

- 可执行的融合任务平台
- 可沉淀的方法资产平台
- 可运营的数据治理平台
- 可审计、可授权、可人工复核的平台

完成标准：

1. Fusion Task 不只是配置，而是有真实执行闭环
2. Method Library 不只是文档，而是可复用资产
3. Governance Canvas 不只是画图，而是可运行编排
4. Dataset Center 不只是列表，而是资产运营中心
5. Review / Audit / Ownership 有最小可用闭环

---

## 二、范围

### In Scope
- Dataset Center
- Method Library
- Fusion Task
- Governance / pipeline governance
- Human review / approval
- Audit trail / ownership / lineage
- Governance metrics

### Out of Scope
- 一次性做完完整规则 DSL
- 完整的跨项目模板市场
- 完全自动化智能融合
- 把 Lite 与 Pro 立即合并成单一产品

---

## 三、拆解原则

### 原则 1：Pro 先做执行，不先做展示
页面和状态 badge 不是目标，执行闭环才是目标。

### 原则 2：方法必须资产化
Method Library 不能只是“规则说明页”。

### 原则 3：治理必须可追责
没有 review / audit / ownership 的治理不是真治理。

### 原则 4：人工参与不是补丁，而是产品能力
低置信度融合必须可以进入 review flow。

---

## 四、P0 工作包

## P0-1 Fusion Task 运行系统化

### 目标
把 Fusion Task 从“任务配置页”做成“任务执行系统”。

### 要做

#### Backend
- run history
- execution status machine
- retry / reschedule support
- run result stats
- 冲突与失败原因记录

#### Frontend
- task detail 显示真实 run history
- 显示运行中 / 失败 / 成功 / 待复核状态
- 支持手动触发 run / retry

#### 状态建议
- draft
- ready
- running
- paused
- failed
- completed
- review-required

### 验收标准
- 任意 Fusion Task 都有真实运行记录
- 失败可以看到原因与阶段
- 不是只看到“ACTIVE / INACTIVE”这类弱状态

---

## P0-2 Method Library 资产化

### 目标
把 Method Library 从“方法说明库”提升为“可复用方法资产库”。

### 要做

#### 核心能力
- method versioning
- method status（draft / published / deprecated）
- sample input / expected output
- basic method test harness
- method usage tracking
- method performance metrics

#### 前端
- 版本列表
- 变更说明
- 方法测试结果展示
- 被哪些 Fusion Task 使用

### 验收标准
- 方法可版本化
- 方法可测试
- 方法可追踪使用关系

---

## P0-3 Governance Canvas 执行化

### 目标
把 Governance Canvas 从“流程画布”变成“治理编排器”。

### 要做

#### Backend
- pipeline run records
- step execution records
- node-level result storage
- validate + publish + run lifecycle

#### Frontend
- node execution state
- step debug / step result
- draft vs published pipeline
- failure node visibility

### 节点类型建议
- source
- profile
- quality
- transform
- match
- merge
- review
- publish

### 验收标准
- pipeline 可运行
- 可看到每一步执行结果
- 可区分草稿与已发布版本

---

## P0-4 去掉 Pro 前端假流程

### 目标
去掉 Dataset Center / Fusion Task / Governance 中的演示逻辑，让 Pro 页面对真实后端状态负责。

### 要做
- 去掉关键路径 mock / pseudo fallback
- 明确 empty / loading / failed / running / review-required 状态
- 关键页面失败时不再伪装成正常空数据

### 验收标准
- 关键页面失败时用户知道是失败而不是“暂时空”
- 运营人员可以基于页面做真实判断

---

## 五、P1 工作包

## P1-1 Dataset Center 升级为资产运营中心

### 要做
- schema version
- sample preview
- data profile
- quality context
- ownership / steward
- lineage / downstream impact
- change impact summary

### 验收标准
- Dataset 页面不只是资产列表，而是资产运营中心

---

## P1-2 Human Review / Approval

### 要做
- low-confidence review queue
- conflict review queue
- review action log
- approval workflow
- manual resolution states

### 验收标准
- 低置信度融合结果不再只能自动决定
- 人工可介入并留下审计记录

---

## P1-3 Audit / RBAC

### 要做
- dataset-level RBAC
- method edit permission
- fusion publish/run permission
- governance publish permission
- audit trail
- sensitive field masking

### 验收标准
- 谁改了什么、谁跑了什么、谁批准了什么，都可追溯

---

## P1-4 指标化运营

### 要做
- datasets onboarded
- methods reused
- fusion success rate
- manual review rate
- conflict rate
- duplicate reduction
- time saved / quality improved

### 验收标准
- Pro 不只是能跑，还能被运营、被讲价值

---

## 六、P2 工作包

## P2-1 Method DSL / Executable Rule Layer
- 让方法从“说明”走向“可执行”

## P2-2 智能推荐
- 推荐最佳融合方法
- 推荐 review 优先级

## P2-3 可复用模板库
- method templates
- governance templates
- fusion strategy templates

---

## 七、并行实施建议

### Stream A：Fusion / Governance 执行
- FusionTask
- Governance Canvas
- pipeline run / step records

### Stream B：Method / Asset
- MethodLibrary
- DatasetCenter
- lineage / profile / ownership

### Stream C：Trust / Control
- review queue
- audit trail
- RBAC
- masking
- metrics

---

## 八、风险

### 风险 1：Pro 停留在高级 CRUD
后果：看起来像平台，实际上没有执行价值。

### 风险 2：没有人工 review 闭环
后果：融合结果不可控，客户不敢信。

### 风险 3：没有 audit 与 ownership
后果：治理责任不清，无法进入企业级使用场景。

---

## 九、完成定义（Definition of Done）

满足以下条件，才算 DFS Pro P0 完成：

- Fusion Task 有真实 run history 和状态流转
- Method Library 支持版本与测试
- Governance pipeline 可 validate / publish / run / debug
- Pro 页面关键路径不再依赖演示 fallback
- 关键失败可见，运行过程可追踪
