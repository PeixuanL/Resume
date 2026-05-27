# MANN+HUMMEL 产品改进规划

> 版本：v1.0 | 创建：2026-04-04 | 负责人：Goku (DE #1)
> 背景：MANN+HUMMEL 三份提案分析，基于现有平台能力 gap 分析制定

---

## 一、需求摘要

MANN+HUMMEL 三份提案核心诉求收敛为 5 个域：

| # | 需求域 | 关键诉求 | 截止/优先级 |
|---|--------|---------|------------|
| 1 | **预测性维护 + TCO 优化** | 每次停机 8h，靠 sensor/ECU 数据预测失效、优化维护窗口 | P0 |
| 2 | **决策编排** | 把多告警转成"可排序/可解释/可执行"的维护优先级 | P0 |
| 3 | **端到端可追溯** | 事故→维护行动→结果完整证据链，支撑可持续报告 | P0 |
| 4 | **滤清系统全生命周期** | 滤芯组件级追踪：安装/使用/更换/回收 | P1 |
| 5 | **后市场订阅化 + 多租户** | 多客户/多矿区隔离，服务化商业模式 | P1 |

---

## 二、现有平台覆盖能力

### ✅ 强覆盖（已有，可直接用于演示）

| 能力 | 现有实现 | 评级 |
|------|---------|------|
| 预测性维护算法 | ISO 20816 振动分析、Z-Score + IF 异常检测、Weibull RUL、Root Cause Analyzer | ✅ 完整 |
| 告警 → 工单 → 闭环 | Alert dedup + escalation + WorkOrder lifecycle (OPEN→IN_PROGRESS→COMPLETED) | ✅ 完整 |
| 多设备 Dashboard | PdmDashboardView + PdmHealthMapView 多设备聚合健康视图 | ✅ 可用 |
| AI Advisor | 页面上下文感知对话，可解释异常和维护建议 | ✅ 已上线 |
| 多租户 | TenantContext 全链路隔离，RBAC 完整 | ✅ 完整 |
| Worker App | 工单领取/执行/照片上传，移动端完整 | ✅ 完整 |
| 多语言 | 11 语言，英文/中文/日文覆盖好 | ✅ 完整 |
| 数据接入基础 | DFS Lite MQTT/REST/Modbus/BACnet | ✅ 框架完整 |

---

## 三、Gap 分析与改进规划

### Gap 1 — 滤清系统组件级追踪（最核心 gap）

**问题**：现有 PDM 是设备级（Equipment），没有**组件/耗材级**数据模型。MANN+HUMMEL 的核心产品是滤芯，这是最重要的业务对象。

**改进内容**：

```
新增实体（后端）：
- FilterComponent（滤芯组件）
  字段：equipment_id, filter_type, oem_part_no, install_date,
        install_hours, expected_life_hours, actual_life_hours,
        replacement_reason, recovery_status

- ComponentServiceEvent（组件服务事件）
  字段：component_id, event_type(INSTALL/REPLACE/INSPECT/RECOVER),
        performed_by, hours_at_event, condition_score, notes

新增 API：
- GET  /api/v1/pdm/equipment/{id}/components
- POST /api/v1/pdm/equipment/{id}/components
- POST /api/v1/pdm/components/{id}/service-event
- GET  /api/v1/pdm/components/{id}/lifecycle-history

新增前端（PDM 模块）：
- PdmComponentsView.vue（设备组件列表 + 服务历史）
- ComponentLifecycleTab.vue（时间线展示安装→使用→更换→回收）
```

**优先级**：P1 — MVP 阶段  
**工作量**：后端 2d + 前端 2d

---

### Gap 2 — 可追溯证据链（Traceability Chain）

**问题**：现有 Alert 和 WorkOrder 是两张分离的表，没有统一的"事故→干预→结果"数据模型，无法生成可持续报告。

**改进内容**：

```
新增实体：
- MaintenanceTrace（维护追溯记录）
  字段：incident_id（关联 alert.id）,
        intervention_type, intervention_at,
        performed_by, outcome_status,
        downtime_minutes, cost_estimate,
        sustainability_notes, evidence_urls[]

新增 API：
- GET  /api/v1/pdm/traces?equipmentId=&from=&to=
- POST /api/v1/pdm/traces
- GET  /api/v1/pdm/reports/lifecycle-summary（可持续报告导出）

新增前端：
- PdmTraceabilityView.vue（事件流时间线 Incident→Action→Outcome）
- PDF/Excel 导出按钮（可持续报告包）
```

**优先级**：P1 — MVP 阶段  
**工作量**：后端 1.5d + 前端 1.5d

---

### Gap 3 — 车队协同视图（Fleet-level Dashboard）

**问题**：现有 Equipment 模块是单机视角，没有跨设备的车队健康聚合、风险排序、多站点对比。

**改进内容**：

```
新增前端（复用现有 PdmDashboardView 扩展）：
- PdmFleetView.vue
  - 车队健康地图（设备分布 + 颜色状态，复用 PdmHealthMapView 扩展）
  - 维护优先级列表（Risk Score 排序，综合振动/温度/RUL/停机时间）
  - 多站点健康对比表格
  - 批量告警处理（勾选多台设备统一创建工单）

新增 API：
- GET /api/v1/pdm/fleet/summary（聚合健康指标）
- GET /api/v1/pdm/fleet/priority-queue（按 risk score 排序）
- GET /api/v1/pdm/fleet/site-comparison
```

**优先级**：P1 — MVP 阶段  
**工作量**：后端 1d + 前端 2d

---

### Gap 4 — 决策编排引擎（Maintenance Decision Orchestration）

**问题**：现在是 告警 → 工单 的 1:1 线性流。MANN+HUMMEL 需要：300 台设备同时有告警时，综合考虑**停机影响、零件库存、班组负荷、安全约束**给出优先级排序和批量维护方案。

**改进内容**：

```
AI Engine 新增模块：
- maintenance_optimizer.py
  - 输入：多设备告警列表 + 库存快照 + 班组负荷 + 生产约束
  - 算法：多目标优化（停机损失最小化 + 资源利用率最大化）
  - 输出：优先级排序 + 推荐批次计划 + 影响评估

新增 API：
- POST /api/v1/advisor/fleet/optimize-schedule
  body: { alerts, inventory, crew, constraints, horizon_days }
  response: { priority_queue, batch_plan, impact_estimate, what_if_variants }

前端集成：
- PdmFleetView.vue 里的"优化排程"按钮
- What-if 对比面板（方案 A vs B vs C）
```

**优先级**：P2 — Phase 2 阶段  
**工作量**：AI Engine 3d + 后端 1d + 前端 1.5d

---

### Gap 5 — 循环经济模块（Circular Economy）

**问题**：滤芯退役后的回收性评估、再生率统计、生命周期 CO₂ 当量，是 MANN+HUMMEL 差异化的可持续业务。现有 ESG 模块是 fake data 骨架。

**改进内容**：

```
新增组件（依赖 Gap 1 FilterComponent）：
- ComponentRecoveryService.java（回收资格评估）
  - 基于：使用时长/使用条件/磨损评分/材质
  - 输出：RECYCLABLE / REMANUFACTURABLE / DISPOSE

新增 AI 分析：
- circular_economy.py
  - 滤芯寿命分布（Weibull）
  - 最优更换策略（避免过早换/过晚换）
  - 每台设备年度 CO₂ 节省估算

新增前端：
- ESG 模块接入真实滤芯数据
- 回收证明导出（PDF）
```

**优先级**：P2 — Phase 3 阶段  
**工作量**：4-5d

---

### Gap 6 — ISO/TS 15143-3 AEMP 适配（多 OEM 接入标准）

**问题**：混编车队（CAT/Komatsu/Volvo/Hitachi）每家 telematics API 格式不同，行业标准是 ISO 15143-3。现有 DFS Lite 是通用 REST connector，没有针对 AEMP schema 的标准化适配。

**改进内容**：

```
DFS Lite 新增 Connector：
- AempConnector.java（ISO 15143-3 schema 解析）
  - 支持：Equipment Status / Fault Code / Location / Cumulative Hours
  - OEM 适配表：字段映射 + 单位归一
  - 自动填充 FactVerse Equipment 实体
```

**优先级**：P3 — Phase 3 阶段  
**工作量**：3d

---

### Gap 7 — 离线采集 + 自动同步

**问题**：Worker App 有表单，但无明确 offline-first 存储 + 冲突合并机制，弱网矿区场景不可靠。

**改进内容**：

```
前端：
- 使用 IndexedDB 缓存待提交工单
- 网络恢复时自动重试（retry queue）
- 冲突检测（server timestamp > local timestamp → 提示用户）

后端：
- WorkOrder API 支持幂等提交（client_idempotency_key）
```

**优先级**：P2  
**工作量**：前端 2d + 后端 0.5d

---

## 四、路线图总览

### Phase 0 — PoC（2 周内，见独立文档）

目标：基于现有 PDM + demo 数据，在 factverse.ai 跑通矿山车队演示场景  
**详见：** `docs/prd/MANN-HUMMEL-POC-PLAN.md`

---

### Phase 1 — MVP 核心（4 周）

| 优先级 | 功能 | 工作量 |
|--------|------|--------|
| P0 | Gap 1: FilterComponent 组件实体 + API | 4d |
| P0 | Gap 2: Traceability Chain + 报告导出 | 3d |
| P0 | Gap 3: Fleet Dashboard（聚合视图 + 优先级排序） | 3d |
| P1 | Mining 设备类型正式加入 onboarding wizard | 1d |
| P1 | 离线采集基础（IndexedDB + 重试队列） | 2.5d |
| — | 合计 | **≈ 13.5d** |

---

### Phase 2 — 差异化功能（6 周）

| 功能 | 工作量 |
|------|--------|
| Gap 4: 决策编排优化引擎 | 5.5d |
| Gap 7: 离线同步完整实现（冲突检测） | 2.5d |
| FilterComponent 前端完整页面 | 2d |
| 组件级告警（滤芯压差超标→工单） | 1.5d |
| **合计** | **≈ 11.5d** |

---

### Phase 3 — 生态扩展（8 周）

| 功能 | 工作量 |
|------|--------|
| Gap 5: 循环经济模块 | 5d |
| Gap 6: AEMP ISO 15143-3 Connector | 3d |
| 多站点对比 + 跨矿区报告 | 2d |
| 可持续报告 PDF 模板 | 1.5d |
| **合计** | **≈ 11.5d** |

---

## 五、关键技术决策

1. **FilterComponent 选择新表而非扩展 Equipment**：component 和 equipment 的生命周期不同（一台泵可能换过 10 个滤芯），独立建模更干净

2. **TraceabilityChain 不创建新表，扩展 WorkOrder**：在 WorkOrder 增加 `incident_ref`、`outcome_status`、`downtime_minutes`、`evidence_urls` 字段，避免数据碎片化

3. **Fleet Dashboard 复用 PdmDashboardView**：不新建页面，在 PDM 模块的现有 dashboard 增加 fleet 视图 tab

4. **决策编排走 AI Engine 而非 Backend**：优化计算太重，放 Python AI Engine，Backend 只做参数收集和结果持久化

---

## 六、演示场景设计（MANN+HUMMEL PoC）

| 场景 | 描述 | 平台能力 |
|------|------|---------|
| 1. 车队健康总览 | 矿山 15 台设备（挖掘机/推土机/钻机/发电机）健康状态地图 | PdmDashboardView + HealthMapView |
| 2. 滤芯压差告警 | #7 挖掘机液压滤芯压差超标，AI 给出更换建议 | AlertSystem + AI Advisor |
| 3. 预测性维护 | #3 钻机振动趋势，AI 预测 2 周后达警戒值，建议预防性维护 | RUL + Trend + WorkOrder |
| 4. 维护证据链 | 上月故障维护全记录（告警→派工→完成→结果验证） | WorkOrder lifecycle trace |
| 5. AI 对话 | "这台挖掘机的滤芯还有多久需要换？" | AI Advisor page context |

---

*关联文档：*
- `docs/prd/MANN-HUMMEL-POC-PLAN.md` — PoC 上线计划（明天）
- `docs/archive/plans/FAKE-IMPLEMENTATION-ELIMINATION-PLAN.md` — 假实现消除规划
