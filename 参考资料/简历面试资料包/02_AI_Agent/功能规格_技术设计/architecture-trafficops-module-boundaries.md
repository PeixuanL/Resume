# TrafficOps Module Boundaries — Industry vs Customer Customization

**Document Version:** 1.0  
**Date:** 2026-03-10  
**Author:** AzureBot (DataMesh DE #3)  
**Scope:** `factverse-ai-agent` — TrafficOps AI Engine & Frontend

---

## 1. Design Principle

TrafficOps follows DataMesh's **基盘复用** principle:

> **Industry Module** = Generic engines, algorithms, and API contracts — reusable across any customer in the same vertical  
> **Customer Config Pack** = Scene definitions, compliance rules, SLA targets, UI layout — owned by one customer

The boundary between the two is maintained by **dependency inversion**: all generic engines take `scene_id` + runtime parameters, never hardcoded customer values. Customer config is loaded from isolated config modules at runtime.

```
┌──────────────────────────────────────────────────────────────┐
│  Customer Config Pack  (ICA / Changi / Tuas / …)             │
│  scene_definitions.py  ·  sla_config.yaml  ·  Vue dashboard  │
└────────────────────────┬─────────────────────────────────────┘
                         │  scene_id + params
┌────────────────────────▼─────────────────────────────────────┐
│  TrafficOps Industry Module                                    │
│  QueueAdvisor · ResourceScheduler · EquipmentHealth           │
│  FlowOptimizer · RLShadow · ModelHealth · …                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Industry Module (通用行业模块)

### 2.1 Definition

These components contain **no customer-specific values**. They accept scene parameters at runtime. Any border checkpoint, airport immigration hall, customs facility, or high-throughput clearance point can use them without modification.

### 2.2 AI Engine — Generic Endpoints

| Endpoint | File | Generic? | Why |
|---|---|---|---|
| `POST /ai/ica/simulate` | `ica_operations.py` | ✅ Parameterized | `scene_id` drives all config; algorithm is vanilla SimPy DES |
| `POST /ai/ica/recommend` | `ica_operations.py` | ✅ Parameterized | M/M/c sweep is pure math; all thresholds passed as body params |
| `POST /ai/ica/whatif/instant` | `ica_intelligence.py` | ✅ Pure math | Erlang-C formula, no scene references |
| `POST /ai/ica/whatif/run` | `ica_operations.py` | ✅ Parameterized | Preset library is customer-defined; engine is generic |
| `GET /ai/ica/equipment-health` | `ica_intelligence.py` | ✅ Generic | Weibull failure model, device count passed as params; no ICA naming |
| `POST /ai/ica/staff-schedule` | `ica_intelligence.py` | ✅ Generic | Officers-per-lane ratio is a request parameter, not hardcoded |
| `POST /ai/ica/network-flow` | `ica_intelligence.py` | ✅ Generic | Min-cost greedy on any checkpoint graph |
| `POST /ai/ica/rl/suggest` | `ica_intelligence.py` | ✅ Generic | Rule-based policy parameterized by state; no scene-specific rules |
| `POST /ai/ica/surge-causes` | `ica_intelligence.py` | ⚠️ Partially | Engine is generic; ICA causal DAG values are customer config |
| `GET /ai/ica/model-health` | `ica_intelligence.py` | ✅ Generic | PSI + drift logic is model-agnostic |
| `POST /ai/ica/forecast` | `ica_operations.py` | ✅ Generic | Statistical forecaster is generic; scene scales throughput |
| `POST /ai/ica/recommend-log` | `ica_intelligence.py` | ✅ Generic | DB table is schema-generic |
| `POST /ai/ica/rl-log` | `ica_intelligence.py` | ✅ Generic | DB table is schema-generic |

### 2.3 AI Engine — Core Engine Routers (100% Generic)

All of the following are used by the industry module but contain zero customer knowledge:

| Router | Prefix | Role |
|---|---|---|
| `des_generic.py` | `/ai/des` | SimPy DES simulation engine |
| `montecarlo.py` | `/ai/montecarlo` | Monte Carlo stochastic analysis |
| `survival.py` | `/ai/survival` | SLA breach probability |
| `causal.py` / `causal_advanced.py` | `/ai/causal` | Causal ATE estimation |
| `conformal.py` | `/ai/conformal` | Prediction uncertainty bounds |
| `surrogate.py` | `/ai/surrogate` | RBF/Kriging surrogate models |
| `rl_agent.py` / `offline_rl.py` | `/ai/rl` | RL policy inference |
| `milp.py` | `/ai/milp` | MILP integer programming |
| `network_flow.py` | `/ai/network-flow` | Min-cost flow optimization |
| `anomaly_v2.py` | `/ai/anomaly-v2` | Multivariate anomaly detection |
| `prophet_forecaster.py` | `/ai/prophet` | Time-series forecasting |
| `drift.py` | `/ai/drift` | Model distribution drift |
| `bayesian_opt.py` | `/ai/bayesian-opt` | Bayesian parameter fitting |
| `abm.py` | `/ai/abm` | Agent-based crowd simulation |

### 2.4 Backend — Generic Java Endpoints

| Endpoint | Controller | Generic? |
|---|---|---|
| `GET /api/v1/trafficops/equipment-health` | `EquipmentHealthController` | ✅ |
| `POST /api/v1/trafficops/simulate` | `TrafficOpsAiController` | ✅ (proxies scene-parameterized AI) |
| `POST /api/v1/trafficops/recommend` | `TrafficOpsAiController` | ✅ |
| `POST /api/v1/trafficops/whatif/instant` | `TrafficOpsAiController` | ✅ |
| `POST /api/v1/trafficops/rl/suggest` | `TrafficOpsAiController` | ✅ |
| `POST /api/v1/trafficops/staff-schedule` | `TrafficOpsAiController` | ✅ |

### 2.5 Frontend — Generic Components

| Component | Generic? | Notes |
|---|---|---|
| `EquipmentHealthPanel.vue` | ✅ | Device grid parameterized via API response |
| `InstantWhatIfPanel.vue` | ✅ | Sliders + M/M/c output, no ICA naming |
| `RlShadowPanel.vue` | ✅ | Generic resource suggestion + apply |
| `ModelHealthPanel.vue` | ✅ | Model monitoring, fully data-driven |
| `StaffSchedulePanel.vue` | ✅ | Schedule table, API-driven |
| `NetworkFlowPanel.vue` | ✅ | Checkpoint names come from API response |
| `AgenticPipelineAnimation.vue` | ⚠️ Partially | Pipeline step labels are generic; `scene_id` is hardcoded |

### 2.6 Database Schema (Generic)

The following tables are industry-generic and reused across all customers:

```sql
trafficops_rl_decision_log          -- V183
trafficops_recommendation_outcomes  -- V184
trafficops_forecast_models          -- V185
trafficops_surrogate_models         -- V185
```

---

## 3. Customer Config Pack (客户定制包)

### 3.1 Definition

These components encode **customer-specific knowledge** — physical layout, regulatory standards, contractual SLAs, naming conventions, and business rules that belong to one customer and cannot be reused without modification.

### 3.2 ICA Woodlands Checkpoint — Config Pack

#### 3.2.1 Scene Definitions (Physical Layout)

**File:** `ai-engine/modules/trafficops/ica/scene_definitions.py`

Contains 18 areas of operations specific to ICA Woodlands Checkpoint (WCP), including:
- WCP physical dimensions (area_sqm per zone)
- Checkpoint chain topology (X-ray → autolane → mobile counter)
- Hardware capacity per zone (e.g., 43 autolanes, 4 mobile counters, capacity per unit)
- Mean service times per checkpoint type (0.5 min autolane, 1.2 min mobile counter)
- Arrival rates per zone (266.7 pax/min for Bus Hall)
- Staff headcount ranges (min/max ICA officers, APO officers)
- RTS Link Woodlands North, WCP, WCPR1 zone mapping

**Not reusable for:** Changi (different hardware), Tuas (vehicle-dominant), Veolia (irrelevant).

#### 3.2.2 Q-Reference Compliance Rules

**File:** `ai-engine/routers/industry/trafficops/ica_operations.py` (lines 786–853)

ICA-specific SOP compliance checks invoked on every `recommend` call:

| Rule | ICA Meaning | Generic Equivalent |
|---|---|---|
| **Q4** | Control booth capacity sufficient | Generic: `lanes ≤ total_lanes` |
| **Q9** | Sequential layout expansion, no cross-flow | Generic: `expansion ≤ N lanes` |
| **Q18** | Queue holding area can absorb surge | Generic: `surge_pax ≤ holding_capacity` |
| **Q20** | Crowd density ≤ ICA safety limit | Generic: `density < threshold_sqm_per_pax` |
| **Q30** | Staff coverage sufficient for lanes | Generic: `officers ≥ lanes / ratio` |

**Action required:** Extract Q-reference logic into a `ComplianceRuleSet` interface. ICA provides its own implementation; other customers provide theirs. The engine calls `compliance_ruleset.evaluate(config)` generically.

#### 3.2.3 Causal DAG Values

**File:** `ai-engine/routers/industry/trafficops/ica_intelligence.py` (`surge_causes` endpoint)

ICA-specific causal factors with literature-based ATEs:

```python
# ICA / JB-SG crossing specific
{ "factor": "JB Public Holiday",         "ate_pct": +35, "confidence": 0.91 }
{ "factor": "SG School Holiday",         "ate_pct": +18, "confidence": 0.84 }
{ "factor": "Bus Schedule Gap (>15min)", "ate_pct": +28, "confidence": 0.87 }
{ "factor": "Hour of Day (peak 7-9am)",  "ate_pct": +65, "confidence": 0.95 }
{ "factor": "Weather (rain)",            "ate_pct": +12, "confidence": 0.78 }
```

**Not reusable for:** Changi (different peak hours, no JB holiday effect), Tuas (different causal factors).

#### 3.2.4 Hardcoded Constants (Must Externalize)

Currently embedded in `ica_operations.py` — need to move to customer config file:

| Constant | Current Value | Source |
|---|---|---|
| `ICA_SLA_WAIT_MIN` default | `10.0 min` | ICA contractual SLA |
| `DENSITY_LIMIT_SQM_PER_PAX` | `2.0 sqm/pax` | ICA safety regulation |
| `OFFICERS_PER_LANE_RATIO` | `5.5` | ICA internal staffing standard |
| `MAX_RECOVERY_MIN` | `30.0 min` | ICA operational guideline |

#### 3.2.5 What-If Preset Library

**File:** `ai-engine/modules/trafficops/ica/whatif_presets.py`

31 scenario presets (Q4, Q9, Q18, Q20, etc.) derived from ICA's own operational research. Not applicable to other customers.

#### 3.2.6 Road Network & Entity Profiles

**Files:** `road_network.py`, `entity_profiles.py`

WCP-specific road topology (Bukit Chagar bus terminal → causeway → WCP entry zones) and traveler nationality/document-type profiles. ICA-specific.

#### 3.2.7 Frontend — ICA-Specific Components

| Component | Why Customer-Specific |
|---|---|
| `CommanderPaxView.vue` | Dashboard layout designed for ICA pax hall operations |
| `CommanderVehicleView.vue` | Vehicle-mode specific to WCP vehicle checkpoint |
| `SurgeCausePanel.vue` | Panel labels reference JB/SG context |
| `AgenticPipelineAnimation.vue` | `scene_id: 'ica-wcp-arrival-bus'` hardcoded |

---

## 4. Refactoring Plan — Cleanly Separating Boundaries

### 4.1 Target File Structure

```
ai-engine/
├── routers/
│   └── industry/
│       └── trafficops/
│           ├── queue_advisor.py          ← GENERIC: M/M/c, DES, Surrogate
│           ├── resource_scheduler.py     ← GENERIC: MILP staff schedule
│           ├── equipment_health.py       ← GENERIC: PdM + anomaly
│           ├── flow_optimizer.py         ← GENERIC: network flow
│           ├── rl_shadow.py              ← GENERIC: RL policy framework
│           ├── model_health.py           ← GENERIC: drift + lifecycle
│           └── customer/
│               └── ica/
│                   ├── ica_operations.py       ← ICA scene routing
│                   ├── ica_intelligence.py     ← ICA causal DAG, WCP specifics
│                   └── ica_compliance.py       ← Q4/Q9/Q18/Q20/Q30 rules
│
├── modules/
│   └── trafficops/
│       ├── core/                         ← GENERIC: simulation, optimization engines
│       └── customer/
│           └── ica/
│               ├── scene_definitions.py  ← WCP 18 zones
│               ├── whatif_presets.py     ← 31 ICA presets
│               ├── entity_profiles.py    ← ICA traveler profiles
│               ├── road_network.py       ← WCP road topology
│               └── sla_config.yaml       ← 10min SLA, 2.0 sqm, 5.5 ratio
│
frontend/src/views/trafficops/
├── components/                           ← GENERIC panels (reusable)
│   ├── EquipmentHealthPanel.vue
│   ├── InstantWhatIfPanel.vue
│   ├── RlShadowPanel.vue
│   ├── ModelHealthPanel.vue
│   ├── StaffSchedulePanel.vue
│   └── NetworkFlowPanel.vue
└── customer/
    └── ica/
        ├── CommanderPaxView.vue          ← ICA dashboard
        ├── CommanderVehicleView.vue      ← ICA vehicle ops
        ├── SurgeCausePanel.vue           ← ICA causal labels
        └── AgenticPipelineAnimation.vue  ← ICA pipeline (scene_id hardcoded)
```

### 4.2 Customer Config File (per customer)

```yaml
# customer/ica/sla_config.yaml
customer_id: ica
customer_name: Immigration & Checkpoints Authority of Singapore
site: Woodlands Checkpoint (WCP)

sla:
  max_wait_min: 10.0
  density_limit_sqm_per_pax: 2.0
  officers_per_lane_ratio: 5.5
  max_recovery_min: 30.0

equipment:
  total_autolanes: 43
  total_mobile_counters: 4
  autolane_service_time_min: 0.5
  mc_service_time_min: 1.2

compliance_ruleset: ica_q_reference
whatif_preset_library: ica_31_presets

causal_factors_file: ica_causal_dag.yaml
```

All generic engines read from this config at startup. **No hardcoded constants in engine code.**

### 4.3 Adding a New Customer (Target: Zero Engine Changes)

To onboard **Changi Airport T1 immigration** as a new customer:

```
1. Create: customer/changi/sla_config.yaml          ← changi SLAs, equipment counts
2. Create: customer/changi/scene_definitions.py     ← T1 gate layout, e-gate capacity
3. Create: customer/changi/changi_causal_dag.yaml   ← flight delays, school holidays
4. Create: customer/changi/compliance_rules.py      ← CAAS regulations (not Q-reference)
5. Create: frontend/trafficops/customer/changi/     ← Changi-branded dashboard
```

No changes to `queue_advisor.py`, `resource_scheduler.py`, `equipment_health.py`, or any core engine.

---

## 5. Current State vs Target State

| Item | Current State | Target State | Priority |
|---|---|---|---|
| `DENSITY_LIMIT_SQM_PER_PAX` | Hardcoded `2.0` in `ica_operations.py` | `sla_config.yaml` per customer | P1 |
| `OFFICERS_PER_LANE_RATIO` | Hardcoded `5.5` in `ica_operations.py` | `sla_config.yaml` per customer | P1 |
| Q4/Q9/Q18/Q20/Q30 checks | Embedded in `recommend()` function | `ComplianceRuleSet` interface | P1 |
| ICA causal DAG ATEs | Hardcoded in `ica_intelligence.py` | `ica_causal_dag.yaml` | P2 |
| `scene_id` in frontend | Hardcoded `'ica-wcp-arrival-bus'` in Vue | Injected via route param or config | P2 |
| Scene definitions | In `modules/trafficops/ica/` ✅ | Already isolated — no change needed | Done |
| What-If presets | In `modules/trafficops/ica/` ✅ | Already isolated — no change needed | Done |
| Generic panels | In `components/` ✅ | Already isolated — no change needed | Done |

---

## 6. Next Customer Expansion Map

| Customer | Vertical | Reuse from TrafficOps | New Config Required |
|---|---|---|---|
| ICA Tuas Checkpoint | Border control | 100% engine reuse | New scene_definitions (vehicle-dominant), different SLA |
| ICA Changi T4 | Airport immigration | 100% engine reuse | New scene (e-gates, auto-lanes), CAAS compliance |
| MAHB KLIA | Airport immigration | 100% engine reuse | Malaysian scene + MAVCOM regulations |
| Incheon Airport | Airport immigration | 100% engine reuse | Korean scene + KoreaCustoms compliance |
| Generic seaport | Port customs | 100% engine reuse | Vessel manifest scene, Customs SLA |

---

*This document is authoritative for module boundary decisions. Any PR that adds customer-specific constants to generic engine files should be rejected.*
