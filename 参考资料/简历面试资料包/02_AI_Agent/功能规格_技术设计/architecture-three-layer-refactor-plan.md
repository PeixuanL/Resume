# Three-Layer Architecture Refactor Plan
## 基盘 · 行业模块 · 客户定制 — 边界隔离与目录规范

**Document Version:** 1.0  
**Date:** 2026-03-10  
**Status:** APPROVED — Execution roadmap  
**Author:** AzureBot (DataMesh DE #3)

---

## 1. 三层架构定义

```
┌──────────────────────────────────────────────────────────────────────┐
│  Layer 3: 客户定制 (Customer Config)                                  │
│  Owner: 客户交付团队 + 客户IT                                          │
│  ICA Config · Changi Config · Tuas Config · …                         │
│  场景定义 · SOP合规规则 · SLA参数 · 因果图参数 · 品牌UI                 │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ 依赖 (单向)
┌───────────────────────────────▼──────────────────────────────────────┐
│  Layer 2: 行业模块 (Industry Module)                                  │
│  Owner: DataMesh 行业解决方案团队                                      │
│  TrafficOps · FMS · HeatOps · SemiOps · HVACOps · Wayfinding · PdM  │
│  通用排队算法 · 人员调度 · 设备健康 · 流量路由 · RL框架                 │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ 依赖 (单向)
┌───────────────────────────────▼──────────────────────────────────────┐
│  Layer 1: 基盘 (Platform Core)                                       │
│  Owner: DataMesh 产品团队                                             │
│  DES · M/M/c · Surrogate · RL · MILP · Causal · Conformal · PdM     │
│  Prophet · Drift · ABM · Network Flow · Anomaly · Bayesian          │
│  Auth · RBAC · Tenant · DFS Lite · DB · Redis · WebSocket            │
└──────────────────────────────────────────────────────────────────────┘
```

**铁律（不可违反）：**
- Layer 1 绝不 import Layer 2 或 Layer 3 的任何文件
- Layer 2 绝不 import Layer 3 的任何文件
- 客户常量（SLA值、场景名、Q规则编号）绝不出现在 Layer 1 或 Layer 2 代码中
- Layer 2 的参数全部通过 API 请求体或 Config 文件注入，不硬编码

---

## 2. 当前状态诊断

### 2.1 AI Engine 当前问题

| 文件 | 当前位置 | 问题 |
|---|---|---|
| `ica_operations.py` | `routers/industry/trafficops/` | ❌ 混合：Layer2 算法 + Layer3 ICA场景/Q规则/常量 |
| `ica_intelligence.py` | `routers/industry/trafficops/` | ❌ 混合：Layer2 通用端点 + Layer3 ICA因果DAG值 |
| `hvacops/bca_compliance.py` | `routers/industry/hvacops/` | ⚠️ 问题：BCA Green Mark是新加坡法规，非行业通用标准 |
| `modules/trafficops/ica/` | `modules/trafficops/ica/` | ✅ 已隔离：正确位置，无需移动 |
| `routers/core/` | `routers/core/` | ✅ 干净：纯算法引擎，无客户引用 |

### 2.2 Frontend 当前问题

| 文件 | 当前位置 | 问题 |
|---|---|---|
| `CommanderPaxView.vue` | `views/trafficops/` | ❌ 客户定制UI混在行业模块目录 |
| `CommanderVehicleView.vue` | `views/trafficops/` | ❌ 同上 |
| `AgenticPipelineAnimation.vue` | `views/trafficops/components/` | ❌ `scene_id: 'ica-wcp-arrival-bus'` 硬编码 |
| `SurgeCausePanel.vue` | `views/trafficops/components/` | ⚠️ JB/SG标签混入 |
| `EquipmentHealthPanel.vue` 等6个 | `views/trafficops/components/` | ✅ 通用组件，正确位置 |

---

## 3. 目标目录结构（完整树）

### 3.1 AI Engine

```
ai-engine/
│
├── routers/
│   ├── core/                              ← Layer 1: 基盘算法引擎 (不动)
│   │   ├── des_generic.py
│   │   ├── montecarlo.py
│   │   ├── survival.py
│   │   ├── causal.py
│   │   ├── causal_advanced.py
│   │   ├── conformal.py
│   │   ├── surrogate.py
│   │   ├── rl_agent.py
│   │   ├── offline_rl.py
│   │   ├── milp.py
│   │   ├── network_flow.py
│   │   ├── anomaly_v2.py
│   │   ├── prophet_forecaster.py
│   │   ├── drift.py
│   │   ├── bayesian_opt.py
│   │   ├── abm.py
│   │   └── … (其余 core 引擎)
│   │
│   └── industry/                          ← Layer 2: 行业模块 (通用)
│       ├── trafficops/
│       │   ├── __init__.py                ← ModuleManifest 注册
│       │   ├── queue_advisor.py           ← 通用: M/M/c + DES + Surrogate (任何检查站)
│       │   ├── resource_scheduler.py      ← 通用: MILP人员排班 (任何设施)
│       │   ├── equipment_health.py        ← 通用: PdM + 异常检测 (任何扫描设备)
│       │   ├── flow_optimizer.py          ← 通用: 跨检查点网络流 (任何多节点)
│       │   ├── rl_dispatcher.py           ← 通用: RL资源调度框架 (任何资源开关)
│       │   ├── model_health.py            ← 通用: 模型漂移+生命周期
│       │   ├── traffic_forecast.py        ← 通用: 流量预测 (已存在,保留)
│       │   ├── whatif.py                  ← 通用: What-If引擎 (已存在,保留)
│       │   └── whatif_templates.py        ← 通用: 模板系统 (已存在,保留)
│       │
│       ├── fms/                           ← 通用FM模块 (已存在)
│       ├── heatops/                       ← 通用热力模块 (已存在)
│       ├── hvacops/
│       │   ├── __init__.py
│       │   └── chiller.py                 ← 通用: 冷机优化 (任何冷机)
│       │   # bca_compliance.py 移至 customers/sg_regulations/
│       ├── pdm/                           ← 通用PdM模块 (已存在)
│       ├── semiops/                       ← 通用半导体模块 (已存在)
│       ├── esg/                           ← 通用ESG模块 (已存在)
│       └── wayfinding/                    ← 通用寻路模块 (已存在)
│
├── customers/                             ← Layer 3: 客户定制 (新建)
│   ├── __init__.py
│   ├── ica/                               ← ICA Woodlands Checkpoint
│   │   ├── __init__.py                    ← 注册客户路由
│   │   ├── routers/
│   │   │   ├── ica_operations.py          ← 从 routers/industry/trafficops/ 移入
│   │   │   └── ica_intelligence.py        ← 从 routers/industry/trafficops/ 移入
│   │   └── config/                        ← 从 modules/trafficops/ica/ 移入
│   │       ├── scene_definitions.py       ← WCP 18个区域物理布局
│   │       ├── whatif_presets.py          ← 31个ICA预设实验
│   │       ├── entity_profiles.py         ← ICA旅客画像
│   │       ├── road_network.py            ← WCP道路拓扑
│   │       ├── checkpoint_scene.py
│   │       ├── helpers.py
│   │       ├── reporting.py
│   │       └── sla_config.yaml            ← 新建: SLA参数+常量
│   │
│   └── sg_regulations/                    ← 新加坡法规合规包 (非特定客户)
│       ├── __init__.py
│       └── bca_compliance.py              ← 从 hvacops/ 移入
│
└── modules/
    ├── trafficops/                        ← Layer 2: 行业模块数据层
    │   ├── scenes.py                      ← 通用场景基类 (保留)
    │   ├── processes.py                   ← 通用流程 (保留)
    │   ├── simulation_planner.py          ← 通用仿真规划器 (保留)
    │   ├── insight_generator.py           ← 通用洞察生成器 (保留)
    │   └── … (其余通用模块)
    │   # ica/ 子目录整体移至 customers/ica/config/
    │
    └── … (其余行业模块,不动)
```

### 3.2 Frontend

```
frontend/src/views/trafficops/
│
├── components/                            ← Layer 2: 通用可复用面板
│   ├── EquipmentHealthPanel.vue           ← ✅ 已是通用 (保留)
│   ├── InstantWhatIfPanel.vue             ← ✅ 已是通用 (保留)
│   ├── RlShadowPanel.vue                  ← ✅ 已是通用 (保留)
│   ├── ModelHealthPanel.vue               ← ✅ 已是通用 (保留)
│   ├── StaffSchedulePanel.vue             ← ✅ 已是通用 (保留)
│   ├── NetworkFlowPanel.vue               ← ✅ 已是通用 (保留)
│   ├── AgenticPipelineBase.vue            ← 新建: scene_id 作为 prop
│   └── SurgeCauseBase.vue                 ← 新建: factors 作为 props (无JB/SG标签)
│
└── customers/                             ← Layer 3: 客户定制UI (新建)
    └── ica/
        ├── CommanderPaxView.vue            ← 从 views/trafficops/ 移入
        ├── CommanderVehicleView.vue        ← 从 views/trafficops/ 移入
        ├── AgenticPipelineAnimation.vue    ← 从 components/ 移入 (含hardcoded scene_id)
        ├── SurgeCausePanel.vue             ← 从 components/ 移入 (含JB/SG标签)
        └── ica_config.ts                   ← 新建: ICA前端常量
            // scene_id, SLA显示值, 通道命名规则, 面板标题
```

### 3.3 Backend Java

```
backend/src/main/java/com/datamesh/agent/
│
├── trafficops/                            ← Layer 2: 行业模块 (保留)
│   ├── ai/
│   │   └── TrafficOpsAiController.java    ← 通用AI代理,参数化 (保留)
│   ├── maintenance/
│   │   └── EquipmentHealthController.java ← 通用设备健康 (保留)
│   └── …
│
└── customers/                             ← Layer 3: 客户定制 (新建,目前暂为空)
    └── ica/
        └── (ICA专属Java控制器,如有)
```

---

## 4. 客户配置文件规范

每个客户必须提供 `sla_config.yaml`，行业模块从此文件读取，不允许inline常量：

```yaml
# customers/ica/config/sla_config.yaml
customer_id: ica
customer_name: "Immigration & Checkpoints Authority of Singapore"
site: "Woodlands Checkpoint (WCP)"
vertical: trafficops

sla:
  max_wait_min: 10.0                    # 合同SLA: 通关等待上限
  recovery_max_min: 30.0                # 最长可接受恢复时间
  sla_confidence: 0.80                  # 推荐置信度目标

physical:
  density_limit_sqm_per_pax: 2.0       # ICA安全法规: 每人占地
  officers_per_lane_ratio: 5.5          # ICA内部标准: 警员:通道比
  total_autolanes: 43
  total_mobile_counters: 4
  autolane_service_time_min: 0.50
  mc_service_time_min: 1.20

compliance_ruleset: ica_q_reference     # 指向合规规则集实现类
whatif_preset_library: ica_31_presets   # 指向预设库

causal_dag:
  - factor: "JB Public Holiday"
    ate_pct: 35
    confidence: 0.91
  - factor: "SG School Holiday"
    ate_pct: 18
    confidence: 0.84
  - factor: "Bus Schedule Gap (>15min)"
    ate_pct: 28
    confidence: 0.87
  - factor: "Hour of Day (peak 7-9am)"
    ate_pct: 65
    confidence: 0.95
  - factor: "Weather (rain)"
    ate_pct: 12
    confidence: 0.78

ui:
  scene_id: "ica-wcp-arrival-bus"
  dashboard_title: "Commander Pax — WCP Arrival Bus Hall"
  checkpoint_prefix_autolane: "AL"
  checkpoint_prefix_mc: "MC"
```

---

## 5. 分三阶段迁移计划

### Phase 1 — 目录建立 + 文件移动（1周，不改逻辑）

**目标：** 正确的文件在正确的目录，不改任何算法

| 动作 | 文件 | 方向 |
|---|---|---|
| 新建目录 | `ai-engine/customers/ica/routers/` | — |
| 新建目录 | `ai-engine/customers/ica/config/` | — |
| 移动 | `ica_operations.py` | `routers/industry/trafficops/` → `customers/ica/routers/` |
| 移动 | `ica_intelligence.py` | `routers/industry/trafficops/` → `customers/ica/routers/` |
| 移动 | `modules/trafficops/ica/*` | → `customers/ica/config/` |
| 移动 | `hvacops/bca_compliance.py` | `routers/industry/hvacops/` → `customers/sg_regulations/` |
| 新建 | `customers/ica/config/sla_config.yaml` | 提取当前硬编码常量 |
| 新建 | `ai-engine/customers/__init__.py` | 客户包自动发现逻辑 |
| 移动 | `CommanderPaxView.vue` | `views/trafficops/` → `views/trafficops/customers/ica/` |
| 移动 | `CommanderVehicleView.vue` | `views/trafficops/` → `views/trafficops/customers/ica/` |
| 移动 | `AgenticPipelineAnimation.vue` | `components/` → `customers/ica/` |
| 移动 | `SurgeCausePanel.vue` | `components/` → `customers/ica/` |
| 新建 | `customers/ica/ica_config.ts` | 前端ICA常量 |

**完成标准：** `grep -r 'ica-wcp\|WCP\|Q4\|Q9\|JB Public\|DENSITY_LIMIT' routers/industry/ routers/core/` 返回空。

---

### Phase 2 — 接口抽象（2周，提取通用接口）

**目标：** Layer 2 提供抽象接口，Layer 3 提供实现

#### 2.1 `ComplianceRuleSet` 接口

```python
# routers/industry/trafficops/compliance.py (新建, Layer 2)
from abc import ABC, abstractmethod

class ComplianceRuleSet(ABC):
    @abstractmethod
    def evaluate(self, config: dict) -> dict:
        """
        Input:  { rec_lanes, total_lanes, surge_pax, area_sqm, ... }
        Output: { "RULE_A": {"status": "pass"|"fail"|"warn", "description": "..."}, ... }
        """
        raise NotImplementedError
```

```python
# customers/ica/compliance/q_reference.py (新建, Layer 3)
class IcaQReferenceRuleSet(ComplianceRuleSet):
    def evaluate(self, config: dict) -> dict:
        return { "Q4": ..., "Q9": ..., "Q18": ..., "Q20": ..., "Q30": ... }
```

**`recommend()` 函数由：**
```python
# 旧 (Layer2 里硬编码ICA规则)
q4 = { "status": "pass" if rec_lanes <= total_lanes else "fail" ...}
```
**改为：**
```python
# 新 (Layer2 调用注入的规则集)
compliance = customer_config.compliance_ruleset.evaluate(config)
```

#### 2.2 `CustomerConfig` 数据类

```python
# core/customer_config.py (新建, Layer 1 基盘)
@dataclass
class CustomerConfig:
    customer_id: str
    sla: SlaConfig
    physical: PhysicalConfig
    compliance_ruleset: ComplianceRuleSet
    causal_dag: List[CausalFactor]

    @classmethod
    def load(cls, customer_id: str) -> "CustomerConfig":
        path = Path(f"customers/{customer_id}/config/sla_config.yaml")
        return cls._from_yaml(path)
```

所有 `recommend()`, `staff_schedule()`, `equipment_health()` 的常量来源：
```python
cfg = CustomerConfig.load(body.customer_id or "ica")
sla = cfg.sla.max_wait_min           # 10.0 (从yaml读)
ratio = cfg.physical.officers_per_lane_ratio  # 5.5 (从yaml读)
```

#### 2.3 `AgenticPipelineBase.vue` 提取

```typescript
// components/AgenticPipelineBase.vue (新建, Layer 2)
const props = defineProps<{
  sceneId: string              // 由父组件注入，不硬编码
  surgeLabel?: string          // "Bukit Chagar arrival bus" 由父注入
  stepLabels?: string[]        // FORECAST/SIMULATE/REASON/RECOMMEND 可自定义
  slaTargetMin?: number
}>()
```

```typescript
// customers/ica/AgenticPipelineAnimation.vue (Layer 3, 只注入配置)
<AgenticPipelineBase
  scene-id="ica-wcp-arrival-bus"
  surge-label="Bukit Chagar arrival bus hall"
  :step-labels="['FORECAST', 'SIMULATE', 'REASON', 'RECOMMEND']"
  :sla-target-min="10"
/>
```

**完成标准：** Layer 2 的所有文件通过 `grep -r 'ica-wcp\|WCP\|ICA_SLA\|OFFICERS_PER\|DENSITY_LIMIT'` 检查返回空。

---

### Phase 3 — CI强制执行（1周）

#### 3.1 Import Boundary Checker（新建 CI 检查）

```python
# ci/check_layer_boundaries.py (新建)
"""
Enforces three-layer import rules:
  - routers/core/     → no imports from industry/ or customers/
  - routers/industry/ → no imports from customers/
  - customers/        → may import from industry/ and core/
"""

RULES = [
    LayerRule(
        layer="core",
        paths=["routers/core/", "modules/core/"],
        forbidden_imports=["routers.industry", "routers.customers", "customers."],
        message="Layer 1 (基盘) must not import from Layer 2 or Layer 3"
    ),
    LayerRule(
        layer="industry",
        paths=["routers/industry/", "modules/trafficops/", "modules/fms/"],
        forbidden_imports=["customers.", "modules.trafficops.ica", "ICA_SCENE"],
        message="Layer 2 (行业模块) must not import from Layer 3 (客户定制)"
    ),
]
```

加入 CI pipeline（`github/workflows/ci.yml`）：
```yaml
- name: Check Layer Boundaries
  run: python ci/check_layer_boundaries.py
```

#### 3.2 Hardcoded Customer Constant Detector

```python
# ci/check_customer_constants.py (新建)
FORBIDDEN_IN_LAYER2 = [
    r'"ica-wcp-',           # hardcoded scene_id
    r'DENSITY_LIMIT\s*=\s*2\.0',  # ICA safety regulation value
    r'OFFICERS_PER_LANE.*=\s*5\.5', # ICA staffing ratio
    r'"Q4"\s*:\s*{',        # ICA SOP rule codes
    r'JB Public Holiday',   # ICA causal factor
    r'Woodlands Checkpoint', # site name
]
# Scan routers/industry/ and routers/core/ for these patterns → fail if found
```

#### 3.3 CONTRIBUTING.md 规则

新增开发规范条目：
```markdown
## Adding a New Customer

1. Create `customers/<customer_id>/config/sla_config.yaml`
2. Create `customers/<customer_id>/routers/` for customer-specific API wrappers
3. Create `frontend/src/views/<module>/customers/<customer_id>/` for branded UI
4. NEVER add customer constants to `routers/industry/` or `routers/core/`
5. Run `python ci/check_layer_boundaries.py` before every PR

## What Goes Where

| Content | Layer | Directory |
|---|---|---|
| M/M/c formula, DES engine | 基盘 | `routers/core/` |
| Generic queue advisory API | 行业模块 | `routers/industry/trafficops/` |
| ICA scene definitions | 客户定制 | `customers/ica/config/` |
| ICA dashboard Vue | 客户定制 | `views/trafficops/customers/ica/` |
```

---

## 6. 迁移前后对比（TrafficOps为例）

### 当前（混合状态）
```
routers/industry/trafficops/
├── ica_operations.py        ← Layer2算法 + Layer3 ICA场景/Q规则
├── ica_intelligence.py      ← Layer2端点 + Layer3 JB/SG因果DAG
├── traffic_forecast.py      ← Layer2 ✅
├── whatif.py                ← Layer2 ✅
└── whatif_templates.py      ← Layer2 ✅

modules/trafficops/
├── ica/                     ← Layer3 (已隔离,但目录位置错误)
│   ├── scene_definitions.py
│   └── …
└── simulation_planner.py    ← Layer2 ✅
```

### 目标（干净分层）
```
routers/
├── core/                    ← Layer1: 算法引擎 (不变)
└── industry/
    └── trafficops/
        ├── queue_advisor.py        ← Layer2: 通用排队顾问
        ├── resource_scheduler.py   ← Layer2: 通用资源调度
        ├── equipment_health.py     ← Layer2: 通用设备健康
        ├── flow_optimizer.py       ← Layer2: 通用流量优化
        ├── rl_dispatcher.py        ← Layer2: 通用RL调度
        ├── model_health.py         ← Layer2: 通用模型监控
        ├── traffic_forecast.py     ← Layer2 (已存在)
        ├── whatif.py               ← Layer2 (已存在)
        └── whatif_templates.py     ← Layer2 (已存在)

customers/
└── ica/
    ├── routers/
    │   ├── ica_operations.py       ← Layer3: ICA路由/场景API
    │   └── ica_intelligence.py     ← Layer3: ICA智能端点
    └── config/
        ├── scene_definitions.py    ← Layer3: WCP18区域
        ├── whatif_presets.py       ← Layer3: 31个ICA预设
        ├── entity_profiles.py      ← Layer3: ICA旅客画像
        ├── road_network.py         ← Layer3: WCP道路
        └── sla_config.yaml         ← Layer3: SLA+常量
```

---

## 7. 工作量估算

| Phase | 工作内容 | 估算工时 | 风险 |
|---|---|---|---|
| Phase 1: 目录+移动 | 文件移动 + import更新 + 路由注册调整 | 3天 | 中: 需验证所有端点不漂移 |
| Phase 2: 接口抽象 | ComplianceRuleSet + CustomerConfig + AgenticPipelineBase | 5天 | 中: 需要前后端联调 |
| Phase 3: CI强制 | Boundary checker + CONTRIBUTING.md + 修复存量违规 | 2天 | 低 |
| **合计** | | **~10天** | |

---

## 8. 新客户接入模板（迁移完成后）

以 **ICA Tuas Checkpoint** 为例，接入步骤：

```bash
# Step 1: 复制ICA config包作为起点
cp -r customers/ica/ customers/tuas/

# Step 2: 替换场景定义
vim customers/tuas/config/scene_definitions.py
# 修改: tuas物理布局, 货车优先场景, 不同通道容量

# Step 3: 更新SLA配置
vim customers/tuas/config/sla_config.yaml
# 修改: max_wait_min (Tuas SLA可能不同), 通道数量

# Step 4: 复制并定制前端
cp -r frontend/src/views/trafficops/customers/ica/ \
       frontend/src/views/trafficops/customers/tuas/
vim customers/tuas/ica_config.ts
# 修改: scene_id, dashboard_title, 面板标题

# Step 5: 注册
echo "from customers.tuas import register; register(app)" >> customers/__init__.py

# Step 6: 验证
python ci/check_layer_boundaries.py   # 必须通过
curl /ai/tuas/recommend ...           # 端点验证
```

**预计耗时：** 2天（不含客户测试）。行业模块代码零改动。

---

*本文档是三层架构的执行规范，所有涉及跨层目录的PR需要架构审核通过。*
