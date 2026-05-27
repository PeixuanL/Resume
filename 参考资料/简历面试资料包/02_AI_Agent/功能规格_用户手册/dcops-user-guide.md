# DataCenterOps (DCOps) — 用户手册

> 数据中心智能运维模块：从告警到闭环的全链路 AI 驱动运维  
> 版本: v2.6 | 更新: 2026-03-28

---

## 模块概述

DCOps 是 FactVerse AI Agent 的数据中心运维模块，覆盖 **监控 → AI 诊断 → 智能派单 → 工单执行 → 反馈闭环** 的完整运维链路。

**核心价值**:
- 🔍 AI 自动诊断告警根因，减少人工排查时间
- 🚀 智能派单 + 批量审批，提升运维效率
- 📊 SLA 监控 + 闭环追溯，确保服务质量可量化
- 🔮 设备健康预测 + RUL 评估，从被动维修转向预测性维护

---

## 页面导航

| 页面 | 路径 | 功能 |
|---|---|---|
| 运营总览 | `/dcops/dashboard` | 主看板，一站式查看资产、告警、工单、KPI |
| 运营中心 | `/dcops/operations` | 运营 KPI 趋势、SLA 违约、队列老化、派单漏斗 |
| 资产列表 | `/dcops/assets` | 所有设备清单，按风险/RUL 排序 |
| 资产详情 | `/dcops/assets/:id` | 单设备健康快照、预测、告警、工单、诊断 |
| 预测队列 | `/dcops/predictive-queue` | 高风险故障预测排序 |
| 诊断控制台 | `/dcops/diagnosis` | 待派单队列，触发 AI 诊断，批量审批 |
| 闭环管理 | `/dcops/closed-loop` | 转化漏斗，按 Alert ID 追溯全链路 |
| 集成管理 | `/dcops/integrations` | BMS 点位映射、Model Ops 引擎状态 |

---

## 1. 运营总览 (Dashboard)

### 功能清单
- **顶部操作栏**: 刷新 / 导出 CSV / 批量诊断重试 / 批量闭环对账 / 批量审批
- **筛选器**: 按站点、数据中心过滤，支持保存/加载预设
- **KPI 面板**: MTBF / MTTR / 预测命中率 / 维护准时率 / 平均健康分 / 告警量 / 工单指标
- **Command Center**: 实时运维状态卡片，一键修复动作
- **Quick Actions**: 高频操作入口（诊断、派单、闭环检查等）
- **Guided Playbooks**: 基于实时信号推荐的下一步操作
- **Operator Workbench**: 优先级行动队列 + SLA 升级建议 + 一键分配包
- **SLA 违约面板**: 超时工单列表，含违约类型和逾期时长
- **面板开关**: 可切换显示/隐藏各面板，支持紧凑/舒适模式

### 操作流程
1. 打开 Dashboard → 查看 KPI 概览
2. 关注 Command Center 的红色/黄色卡片 → 点击 CTA 按钮执行操作
3. 在 Operator Workbench 处理优先级最高的行动项
4. 如有 SLA 违约 → 点击 "Open WO" 查看工单详情

---

## 2. 运营中心 (Operations)

### 功能清单
- **KPI Delta 卡片**: 4 项核心指标对比（当前 vs 上周期），带箭头方向
- **KPI 趋势图**: 24h KPI Delta 变化曲线 (ECharts)
- **队列趋势图**: Open 队列数量变化曲线
- **SLA 违约表**: 需要立即处理的 SLA 超时工单
- **队列老化分析**: ≤4h / 4-24h / 24-72h / >72h 分桶统计
- **转化漏斗**: 告警→诊断→派单→闭环的数量和转化率
- **诊断复用率**: 30 天内复用 vs 新建诊断的比例
- **SLA 达成率**: 响应 SLA / 完成 SLA 各自的达成百分比
- **CSV 导出**: 一键导出运营快照

### 关键指标解读
| 指标 | 含义 | 健康标准 |
|---|---|---|
| MTBF | 平均故障间隔 | >720h (30天) 为良好 |
| MTTR | 平均修复时间 | <4h 为优秀 |
| SLA 响应率 | 工单在响应时限内被接手的比例 | >95% |
| SLA 完成率 | 工单在完成时限内关闭的比例 | >90% |
| 闭环率 | 派单后有反馈闭环的比例 | >70% |
| 队列老化 | >72h 桶里的工单数 | 应趋近于 0 |

---

## 3. 资产管理

### 资产列表 (`/dcops/assets`)
- 显示所有数据中心设备
- 按 RUL 区间分组（<30天 / 30-90天 / >90天）
- 支持搜索和状态过滤

### 资产详情 (`/dcops/assets/:id`)
- **基本信息**: 名称、类型、位置、状态
- **健康面板** (DcopsHealthDetailPanel): 
  - 当前健康分
  - 历史健康趋势图
  - 可手动触发健康快照
- **预测面板** (DcopsPredictionPanel):
  - AI 故障预测结果
  - 预测历史记录
- **关联数据**: 最近7天告警、进行中工单、最新诊断、反馈状态

### 操作流程
1. 资产列表 → 点击高风险设备 → 进入详情
2. 查看健康分和趋势 → 如果下降趋势明显 → 触发预测
3. 查看关联告警和工单 → 决定是否需要紧急维护

---

## 4. AI 诊断控制台 (`/dcops/diagnosis`)

### 功能
- **待派单队列**: 所有未处理的告警，显示是否已有诊断
- **一键诊断**: 对单个告警触发 AI 诊断，生成根因分析和置信度
- **重新诊断**: 对已有诊断的告警重新运行 AI 分析
- **批量审批**: 勾选多个告警 → 一键批量审批派单（上限 20 条）

### 操作流程
1. 查看 Pending Dispatch Queue
2. 对没有诊断的告警 → 点击 "Diagnose" → AI 生成诊断结果
3. 确认诊断结果合理 → 勾选 → "Batch Approve" → 自动创建工单

### 诊断→派单→工单链路
```
告警(Alert) → AI 诊断(Diagnosis) → 审批(Approve) → 创建工单(WorkOrder)
                                                          ↓
                                              执行维修 → 反馈(Feedback) → 闭环
```

---

## 5. 闭环管理 (`/dcops/closed-loop`)

### 功能
- **转化漏斗**: 可视化展示 告警→诊断→派单→闭环 各阶段数量
- **闭环率**: 大数字展示当前闭环百分比
- **证据追溯**: 输入 Alert ID → 查看完整闭环链路
  - 4 步 Steps 指示器（告警→诊断→派单→反馈）
  - 显示诊断 ID、置信度、工单数量、反馈状态

### 操作流程
1. 查看整体闭环率 → 如果 <70% 需要关注
2. 输入特定 Alert ID → 查看是否完成全链路闭环
3. 如果卡在 "Diagnosis" 步骤 → 去诊断控制台补诊断
4. 如果卡在 "Feedback" 步骤 → 催促维修人员提交反馈

---

## 6. 集成管理 (`/dcops/integrations`)

### BMS 点位映射
- 查看当前 BMS 系统与平台设备的映射关系
- 验证映射正确性 (Validate)
- 发布映射到生产 (Publish)

### Model Ops
- 查看 AI 引擎状态：标准/高性能模式
- GPU 可用性、P95 延迟、一致性偏差
- 切换引擎模式（标准 ↔ 高性能）

---

## 7. 预测队列 (`/dcops/predictive-queue`)

- 按风险等级排序的设备故障预测列表
- 高风险设备优先展示
- 关联到资产详情页查看完整预测历史

---

## API 端点汇总

### 总览
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/v1/dcops` | 总览数据 |
| GET | `/api/v1/dcops/dashboard/overview` | Dashboard 概览 |
| GET | `/api/v1/dcops/dashboard/overview/trends` | 趋势数据 |
| GET | `/api/v1/dcops/dashboard/kpis` | KPI 面板 |

### 资产
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/v1/dcops/assets` | 资产列表 (分页) |
| GET | `/api/v1/dcops/assets/rul-intervals` | RUL 区间分布 |
| GET | `/api/v1/dcops/assets/{id}/detail` | 资产详情 |
| POST | `/api/v1/dcops/assets/{id}/health` | 写入健康快照 |
| GET | `/api/v1/dcops/assets/{id}/health/trend` | 健康趋势 |
| GET | `/api/v1/dcops/health/summary` | 健康摘要 |
| POST | `/api/v1/dcops/assets/{id}/predictions` | 触发故障预测 |
| GET | `/api/v1/dcops/assets/{id}/predictions/history` | 预测历史 |
| GET | `/api/v1/dcops/predictions/high-risk` | 高风险预测 |

### 运营
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/v1/dcops/dashboard/operations` | 运营数据 |
| GET | `/api/v1/dcops/dashboard/operations/kpi-delta` | KPI 对比 |
| GET | `/api/v1/dcops/dashboard/operations/queue-aging` | 队列老化 |
| GET | `/api/v1/dcops/dashboard/operations/predictive-queue` | 预测队列 |
| GET | `/api/v1/dcops/dashboard/operations/trends` | 趋势 |
| GET | `/api/v1/dcops/dashboard/operations/sla-rates` | SLA 达成率 |
| GET | `/api/v1/dcops/dashboard/operations/sla-breaches` | SLA 违约 |
| GET | `/api/v1/dcops/dashboard/operations/diagnosis-reuse` | 诊断复用率 |
| GET | `/api/v1/dcops/dashboard/operations/dispatch-funnel` | 派单漏斗 |
| GET | `/api/v1/dcops/dashboard/operations/snapshot` | 运营快照 |
| GET | `/api/v1/dcops/dashboard/operations/snapshot.csv` | CSV 导出 |
| GET | `/api/v1/dcops/dashboard/operations/events` | SSE 实时事件 |

### 诊断 & 派单
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/v1/dcops/diagnosis/from-alert/{alertId}` | 触发 AI 诊断 |
| GET | `/api/v1/dcops/alerts/{alertId}/diagnosis` | 查询诊断 |
| GET | `/api/v1/dcops/alerts/{alertId}/closed-loop` | 闭环追溯 |
| GET | `/api/v1/dcops/dispatch/pending` | 待派单队列 |
| POST | `/api/v1/dcops/dispatch/alerts/{alertId}/approve` | 审批单条 |
| POST | `/api/v1/dcops/dispatch/batch-approve` | 批量审批 |
| POST | `/api/v1/dcops/recommendations/{id}/create-work-order` | 诊断→工单 |
| POST | `/api/v1/dcops/work-orders/{id}/feedback` | 提交反馈 |
| GET | `/api/v1/dcops/work-orders/{id}/closed-loop` | 工单闭环 |
| GET | `/api/v1/dcops/work-orders/{id}/feedback` | 查询反馈 |

### 维护 & 规划
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/v1/dcops/maintenance/recommendations/generate` | 生成维护建议 |
| GET | `/api/v1/dcops/maintenance/recommendations` | 查询建议 |
| POST | `/api/v1/dcops/maintenance/recommendations/{id}/status` | 更新状态 |
| GET | `/api/v1/dcops/planning/recommendations` | 规划建议 |
| POST | `/api/v1/dcops/planning/generate` | 生成规划 |
| GET | `/api/v1/dcops/planning/{id}/conflicts` | 冲突检测 |
| POST | `/api/v1/dcops/planning/{id}/resolve` | 解决冲突 |

### 集成 & 自动化
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/v1/dcops/integrations/bms/mappings` | BMS 映射 |
| POST | `/api/v1/dcops/integrations/bms/mappings/validate` | 验证映射 |
| POST | `/api/v1/dcops/integrations/bms/mappings/publish` | 发布映射 |
| GET | `/api/v1/dcops/model-ops/status` | AI 引擎状态 |
| POST | `/api/v1/dcops/model-ops/engine-mode` | 切换引擎模式 |
| POST | `/api/v1/dcops/automation/diagnosis/bulk-retry` | 批量重试诊断 |
| POST | `/api/v1/dcops/automation/close-loop/reconcile` | 闭环对账 |

### 批量操作
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `.../risk-chips/bulk-assign-assignee` | 批量分配 |
| POST | `.../risk-chips/bulk-normalize-priority` | 批量优先级归一化 |
| POST | `.../risk-chips/bulk-sla-escalation-note` | 批量 SLA 升级备注 |

---

## 数据库表

| 表名 | 说明 |
|---|---|
| `dc_diagnosis_record` | AI 诊断记录（告警 ID、诊断文本、置信度、模型版本） |
| `dc_workorder_feedback` | 工单反馈（是否解决、反馈文本、解决时间） |
| `dc_asset_health_snapshot` | 设备健康快照（健康分、风险等级、时间戳） |
| `dc_failure_prediction` | 故障预测（预测类型、概率、预测窗口、RUL） |
| `dc_maintenance_recommendation` | AI 维护建议（建议内容、优先级、状态） |
| `dc_bms_mapping` | BMS 点位映射（BMS 点位→平台设备/传感器） |
| `dc_planning_draft` | 维护规划草案（计划内容、冲突列表、解决方案） |

---

## RBAC 权限

| 权限 | 说明 |
|---|---|
| `dcops.view` | 查看 DCOps 所有页面 |
| `dcops.analytics.view` | 查看分析数据 |
| `dcops.predict.view` | 查看预测数据 |
| `dcops.asset.manage` | 管理资产（写入健康快照等） |
| `dcops.config.manage` | 管理配置（BMS 映射等） |
| `dcops.diagnosis.run` | 执行 AI 诊断 |
| `dcops.automation.run` | 执行自动化操作 |
| `dcops.dispatch.approve` | 审批派单 |
| `dcops.feedback.write` | 提交工单反馈 |
| `dcops.workorder.link` | 关联工单 |

---

## 当前数据状态 (PROD)

| 指标 | 数值 | 备注 |
|---|---|---|
| 设备总数 | 58 | 54 正常, 4 警告 |
| 开放告警 | 0 | — |
| 开放工单 | 25 | 19 CREATED, 4 ASSIGNED, 2 IN_PROGRESS |
| 健康快照设备 | 6 | 健康分 45~90，平均 73.7 |
| MTBF | 1,740 天 | 无故障记录 |
| SLA 违约 | 39 响应 + 51 完成 | 需关注 |
| 队列老化 | 25 件全部 >72h | 需清理 |
| AI 引擎 | 标准模式, GPU 可用 | P95 延迟 1,200ms |

---

## 演示脚本 (5 分钟)

### 开场 (1 min)
> "DCOps 是数据中心智能运维模块。它不是一个告警面板——它是一个从告警到闭环的完整 AI 运维链路。"

### 看板演示 (2 min)
1. 打开 Dashboard → 展示 KPI 面板（MTBF、MTTR、健康分）
2. 滚动到 Command Center → 展示实时运维状态卡片
3. 展示 Operator Workbench → "运维人员每天打开这个页面就知道先做什么"

### 闭环演示 (2 min)
1. 进入诊断控制台 → 选一个告警 → 点击 "Diagnose" → AI 生成诊断
2. 勾选 → "Batch Approve" → 自动创建工单
3. 进入闭环管理 → 输入 Alert ID → 展示 4 步闭环追溯
4. "从告警到闭环，每一步都有记录，每一步都可追溯。"

### 收尾
> "DCOps 的核心理念：让 AI 做诊断，让系统做追踪，让人做决策。"
