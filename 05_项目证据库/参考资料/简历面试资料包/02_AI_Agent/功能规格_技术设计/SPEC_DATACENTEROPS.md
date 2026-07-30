# DataCenterOps Spec v1.0 (Draft)

## 0. 文档信息
- Module: `datacenterops`
- Product: FactVerse AI Agent Platform
- Status: Draft for implementation
- Scope: MVP + 可扩展架构
- Principle: 设施设备管理与预测性维护优先，NVIDIA 加速可选

---

## 1. 目标与定位

### 1.1 模块定位
DataCenterOps 是面向数据中心设施设备的运营模块，核心能力：
1) 设备资产健康管理
2) 预测性维护
3) 告警-诊断-工单闭环
4) 运维决策可解释与可审计

### 1.2 核心价值
- 从被动告警响应转向主动风险预防
- 将 Honeywell 现场数据与 FV AI 诊断闭环打通
- 将 NVIDIA 推理能力作为可选性能增强，不改变业务接口

### 1.3 非目标（MVP）
- 不做全量 ITSM 替代
- 不做全量 CMDB 重构
- 不做必须依赖 GPU 的功能设计

---

## 2. 用户角色与场景

### 2.1 角色
- Facility Operator（运维工程师）
- Maintenance Planner（维保计划）
- Duty Manager（值班主管）
- Admin（平台管理员）

### 2.2 关键场景
1) 发现高风险设备并提前安排维护
2) 告警触发后快速诊断并自动生成工单
3) 工单完成后回写结果并优化后续预测
4) 查看机房/系统级健康与维护 KPI

---

## 3. 现有能力复用（必须）

### 3.1 AI复用（ai-engine）
可复用：
- Advisor Chat with tool calling
- prediction / reliability / explainability
- simulation / optimization / doe / des
- knowledge / graph / reports

### 3.2 Backend复用
可复用：
- `api/v1/advisor/*`
- 告警、工单、RBAC、审计能力
- 配置中心（system config）

### 3.3 Frontend复用
可复用：
- 现有列表/详情/图表框架
- 多语言体系
- 告警与工单界面模式

---

## 4. 功能规格

### 4.1 资产健康（Asset Health）
#### 功能
- 资产列表（按站点/机房/系统/设备类型）
- 资产详情：状态、关键参数、健康分、最近告警、最近工单
- 健康趋势：24h / 7d / 30d

#### 输入
- 传感器时序数据
- 告警事件
- 历史工单与维修记录

#### 输出
- `health_score` (0~100)
- `risk_level` (LOW/MEDIUM/HIGH/CRITICAL)

### 4.2 预测性维护（Predictive Maintenance）
#### 功能
- 故障概率预测（7/30/90 天）
- 剩余寿命预测（RUL）
- 维护建议（建议窗口、检查项、优先级）

#### 输出字段（示例）
- `failure_probability_7d`
- `failure_probability_30d`
- `failure_probability_90d`
- `rul_days_lower`, `rul_days_upper`
- `recommendation_type`
- `recommended_window_start/end`

### 4.3 告警-诊断-工单闭环（Core Loop）
#### 流程
1) 告警进入
2) 调用 Advisor tool-chat 进行诊断
3) 生成诊断证据（模型输出 + 工具结果）
4) 一键转工单
5) 工单完成回写根因与处理结果
6) 反馈用于模型评估/迭代

#### 关键要求
- 每次诊断必须带 `traceId`
- 每次工单联动必须记录 `diagnosis_id`
- 闭环数据不可丢失（审计）

### 4.4 维保计划优化
- 周期维保 + 风险动态维保融合
- 计划冲突检测（资源/窗口）
- 备件需求建议（可先只做提示）

### 4.5 运营看板
#### 核心指标
- 高风险设备数
- 预测命中率
- MTBF / MTTR
- 维护准时率
- 告警闭环时长（P1/P2）

---

## 5. Honeywell / NVIDIA 集成规格

### 5.1 Honeywell（必做接入层）
#### 范围
- BMS/EMS 关键点位数据接入
- 告警事件映射
- 设备实体映射（asset mapping）

#### 接口要求
- 支持批量上报与增量同步
- 映射表可配置（点位→FV字段）
- 数据质量校验（时间戳、缺测、异常值）

### 5.2 NVIDIA（可选加速层）
#### 设计原则
- 默认 `standard` 模式（CPU）
- `nvidia` 模式为可选增强，不改变业务 API

#### 配置
- `AI_INFERENCE_MODE=standard|nvidia`
- `AI_NVIDIA_ENABLED=true|false`
- `AI_NVIDIA_PROVIDER=triton|nim|cuda-local`（可扩）

#### 行为
- 启动探测失败自动降级 standard
- 推理记录标注执行引擎 `engine=standard|nvidia`
- GPU 不可用时系统仍可完整运行

---

## 6. 架构与组件

### 6.1 逻辑分层
1) Ingestion（Honeywell/设备/告警）
2) Domain（资产、健康、预测、维保）
3) AI Service（advisor/predict/explain）
4) Orchestration（闭环与工单联动）
5) Presentation（看板与工作台）

### 6.2 AI执行策略（可选加速）
- `InferenceStrategy` 接口
  - `StandardInferenceStrategy`
  - `NvidiaInferenceStrategy`
- 由配置+探测动态选择

---

## 7. 数据模型（MVP）

1) `dc_asset_profile`
- id, site_id, room_id, asset_code, asset_type, vendor, model, install_date, criticality, status

2) `dc_asset_health_snapshot`
- id, asset_id, ts, health_score, risk_level, feature_json, anomaly_score

3) `dc_failure_prediction`
- id, asset_id, model_version, predicted_at, p7, p30, p90, rul_lower, rul_upper, engine_mode

4) `dc_maintenance_recommendation`
- id, asset_id, source_prediction_id, priority, recommendation_type, window_start, window_end, checklist_json, status

5) `dc_diagnosis_record`
- id, alert_id, asset_id, diagnosis_text, evidence_json, confidence, trace_id, created_at

6) `dc_workorder_feedback`
- id, workorder_id, diagnosis_id, actual_root_cause, action_taken, resolved, feedback_score, closed_at

---

## 8. API 规格（MVP）

- `GET /api/v1/dcops/assets`
- `GET /api/v1/dcops/assets/{assetId}`
- `GET /api/v1/dcops/assets/{assetId}/health`
- `GET /api/v1/dcops/assets/{assetId}/predictions`
- `POST /api/v1/dcops/diagnosis/from-alert/{alertId}`
- `POST /api/v1/dcops/recommendations/{id}/create-work-order`
- `POST /api/v1/dcops/work-orders/{id}/feedback`
- `GET /api/v1/dcops/dashboard/overview`

### API 约束
- 全部走 RBAC
- 返回统一 traceId
- 关键写操作记审计日志

---

## 9. 前端信息架构（MVP）

1) Dashboard（运营总览）
2) Asset Health（资产健康）
3) Predictive Queue（预测维护队列）
4) Diagnosis Console（诊断台）
5) Work Order Loop（闭环追踪）

---

## 10. 权限模型（RBAC）

建议新增权限：
- `dcops.view`
- `dcops.asset.manage`
- `dcops.predict.view`
- `dcops.diagnosis.run`
- `dcops.workorder.link`
- `dcops.config.manage`

---

## 11. 可观测性与审计

必须记录：
- 推理请求耗时、模型版本、engine_mode（standard/nvidia）
- 诊断调用链 traceId
- 生成工单与闭环反馈关联关系
- 错误码与失败原因分布

---

## 12. 安全要求

- 禁止未授权调用诊断/工单联动接口
- 输入参数校验（防注入/超大payload）
- 外部连接器 URL 白名单策略
- 敏感字段脱敏日志
- 所有 AI 关键动作可追溯

---

## 13. 性能与SLO（MVP建议）

- Dashboard 首屏 < 2s（P95）
- 资产详情 < 1.5s（P95）
- 诊断触发接口 < 5s（P95，异步可接受）
- 工单联动成功率 > 99%

---

## 14. 里程碑

### Phase 1（MVP）
- 资产健康 + 预测维护 + 闭环联动 + 基础看板
- Honeywell 数据映射最小可用
- NVIDIA 可选模式框架（可不开启）

### Phase 2
- 维护计划自动优化
- 预测回测与在线评估
- 多站点对比与区域级优化

### Phase 3
- 更强自适应策略与自动化运维动作（带审批）

---

## 15. 验收标准（Go/No-Go）

上线前必须满足：
1) 无 GPU 环境功能完整可用
2) `standard/nvidia` 两模式结果一致性在可接受阈值内
3) 告警-诊断-工单闭环全链路可追踪
4) 核心 KPI 可在看板查看
5) 安全审计项通过（鉴权/审计/输入校验）
