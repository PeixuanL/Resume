# ICA Demo Guide — Algorithms & Models Reference

## Demo 1: Passenger AI (Arrival Bus Hall — S/N 5)

**Page:** `/modules/trafficops/commander-pax`
**Scenario:** 43 autolanes + 4 mobile counters, 16,000 pax/hr design capacity, Level 5 Arrival Bus Hall

### Step-by-Step Flow

| Step | Action | State | What Happens | Duration |
|------|--------|-------|-------------|----------|
| 1 | Page Load | `IDLE` | KPIs show normal operations: ~44 pax in hall, 3/43 autolanes active, throughput ~1,292/hr, Avg Clearance ~3.8 min | — |
| 2 | **🚗 Trigger Pax Surge** | `SURGING` | Injects 400 passengers via Bukit Chagar arrival route. KPIs spike: ~380 pax in hall, crowd density jumps to 63%, forecast chart shows exponential surge spike | 15s transition |
| 3 | **🤖 Run AI Analysis** | `SURGING` | 4-stage AI pipeline runs sequentially (see below) | ~30-60s |
| 4 | Review Recommendation | `SURGING` | AI recommendation panel appears with situation assessment, recommended actions, before/after impact analysis, and stress test results | Manual review |
| 5 | **✅ Accept & Deploy** | `LANE_ADJUSTING` | Backend transitions state, lanes expand to recommended config (e.g. 15 autolanes + 4 MC = 19 servers) | ~30s |
| 6 | Auto-Recovery | `RECOVERING` → `IDLE` | Backend auto-transitions: LANE_ADJUSTING →30s→ RECOVERING →20s→ IDLE. Lanes gradually scale back | ~50s total |

### AI Pipeline — 4 Stages

#### Stage 1: FORECAST
- **Algorithm:** Holt-Winters Triple Exponential Smoothing + Parametric Diurnal Model
- **Input:** Historical arrival data, current arrival rate, scene config
- **Output:** 4-hour ahead forecast with confidence bands (P10/P90), detected patterns (e.g. "Monday morning peak +18%"), SLA breach alerts
- **API:** `GET /ai/ica/forecast?sceneId=ica-wcp-arrival-bus&hoursAhead=4`

#### Stage 2: SIMULATE
- **Algorithm:** Discrete Event Simulation (DES) via SimPy engine
- **Input:** Scene checkpoint chain, arrival rate (λ), service rate (μ), lane configuration, simulation time (60 min)
- **Output:** Average wait time, throughput, queue lengths, bottleneck identification
- **Fallback:** M/M/c queueing model analytical approximation (when DES engine unavailable)
- **API:** `POST /ai/ica/simulate` with `sceneId`, `duration_minutes`, `replications`

#### Stage 3: REASON
- **Algorithm:** Rule-based reasoning engine + SOP cross-referencing
- **Input:** Forecast results, simulation KPIs, ICA Standard Operating Procedures, 31 what-if scenario presets (Table 4 from ICA requirements)
- **Output:** Situation assessment text, constraint analysis, Q-reference citations (e.g. "Q30: Optimised recommendation")
- **Processing:** Frontend-side rule matching against pipeline data

#### Stage 4: RECOMMEND
- **Algorithm:** Erlang-C (M/M/c) Queueing Theory
- **Input:** Current arrival rate λ, per-lane service rate μ = 1/processing_time, available lanes, available MCs, SLA target (default 10 min)
- **Output:** Optimal lane configuration (conservative vs moderate vs aggressive), estimated recovery time, expected wait time, throughput gain
- **Method:** Iterates over all possible lane+MC combinations, computes Erlang-C probability P(wait), selects minimum config meeting SLA
- **API:** `POST /ai/ica/recommend` with `scene_id`, `current_active_lanes`, `surge_pax`, `processing_time_sec`, `sla_target_min`

### Post-Pipeline Analysis Panels

#### 📊 Impact Analysis — Before vs After
- **Algorithm:** Erlang-C (M/M/c) steady-state queueing model
- **What it answers:** "What is the expected improvement?"
- **Metrics:** Wait Time, Throughput, Autolanes, Mobile Counters, Hall Occupancy
- **Display:** Side-by-side comparison table with Δ improvement indicators

#### 🎯 Recommendation Stress Test
- **Algorithm:** Monte Carlo Simulation (10,000 randomized scenarios)
- **What it answers:** "How reliable is this plan under uncertainty?"
- **Randomized factors:**
  - Surge demand: 70–150% of expected volume
  - Processing speed: ±25% per counter
  - Equipment failures: 0–3 lanes randomly offline
  - Arrival rate: ±20% variability
- **Output metrics:**
  - **Robustness Score:** % of 10K scenarios that meet SLA target
  - **Avg / P5 / P95 Recovery Time:** Distribution of recovery times
  - **Stress Threshold:** Maximum surge the recommended config can handle
- **API:** `POST /ai/montecarlo/run` with parametric distributions + output expression

### Tunable Parameters (⚙️ Panel)
| Parameter | Default | Range | Used By |
|-----------|---------|-------|---------|
| SLA Target | 10 min | 3–30 min | Erlang-C (optimal config selection), MC (SLA breach calculation) |
| Processing Time per Pax | 30 sec | 5–120 sec | Erlang-C (service rate μ), MC (processing speed distribution) |
| Surge Passengers | 400 | 50–2,000 | Surge injection, Erlang-C (arrival rate λ), MC (demand distribution) |

---

## Demo 2: Vehicle AI (Vehicle Arrival Dashboard — S/N 9 & S/N 10)

**Page:** `/modules/trafficops/cp`
**Scenario:** S/N 9 Arrival Car/MC (32 auto + 40 manual + 2 motorcycle = 74 lanes), S/N 10 Departure (29 auto + 36 manual + 2 motorcycle = 67 lanes), 4 Inspection Pits

### Step-by-Step Flow

| Step | Action | State | What Happens | Duration |
|------|--------|-------|-------------|----------|
| 1 | Page Load | `IDLE` | Dashboard shows normal vehicle flow: Moto queue ~8-18, Car queue ~15-27, ~49 active lanes, throughput ~2,800-3,200/hr, Avg Clearance ~1.5-2.0 min | — |
| 2 | **⚡ Trigger Motorcycle Surge** | `SURGING` | Simulates JB (Johor Bahru) motorcycle convoy arrival. AI Insights bar turns red, surge alert banner appears | Immediate |
| 3 | AI Quick Actions (3 buttons) | `SURGING` | Officer chooses from 3 AI-assisted analyses (see below) | Interactive |
| 4 | Review Lane Reconfig | `SURGING` | AI Chat provides analysis, may trigger lane comparison dialog | Manual review |
| 5 | Clear Surge | → `IDLE` | Return to normal operations | Immediate |

### AI Quick Actions

#### 📊 Analyze Congestion
- **Method:** AI Chat query → Natural language analysis
- **Input:** Current motorcycle/car queue lengths, lane status, throughput data
- **Output:** Situation narrative — which queues are critical, bottleneck locations, historical comparison
- **Prompt:** "Analyze the current motorcycle surge congestion at WCP arrival. What is the current lane status?"

#### 🔄 Recommend Actions
- **Method:** AI Chat query → Officer roster check + lane adjustment proposal
- **Input:** Current lane configuration, officer availability, queue lengths
- **Output:** Lane reallocation recommendation (e.g., convert 1 car lane to motorcycle lane)
- **Prompt:** "Check officer roster availability and recommend lane adjustment to handle the motorcycle surge. Run trade-off analysis."

#### 🔬 Run Trade-off Simulation
- **Method:** AI Chat query → DES comparative simulation
- **Input:** Two configurations (e.g., 5MC+4CAR vs 6MC+3CAR)
- **Output:** Wait time comparison for both vehicle types, throughput impact, lane comparison dialog
- **Algorithm:** Discrete Event Simulation (SimPy DES) with M/M/c fallback
- **Prompt:** "Run a simulation comparing current 5MC+4CAR configuration vs 6MC+3CAR. Show wait time impact for both vehicle types."

### Dashboard Tabs

#### FlexiLane Orchestrator
- **Feature:** Real-time lane direction management (inbound/outbound tidal flow)
- **Visual:** 8-lane grid with queue bars, direction arrows, switchover timestamps
- **Algorithm:** Rule-based tidal flow switching based on queue differential

#### Auto-Pilot Agent
- **Feature:** Threshold-based automated lane opening/closing
- **Config:** Open threshold (default 50 vehicles), Close threshold (default 10 vehicles)
- **Algorithm:** Simple threshold comparator — opens lanes when queue > open threshold, suggests closing when < close threshold
- **Toggle:** Manual / AUTO mode switch

#### ICA Checkpoint Lane Visualization
- **Feature:** SVG map of arrival bus hall checkpoint layout
- **Visual:** Autolane grid with real-time status overlay

### KPI Indicators

| KPI | IDLE | SURGING | RECOVERING |
|-----|------|---------|------------|
| Moto Queue | 8-18 | 85-115 | 30-45 |
| Car Queue | 15-27 | 120-160 | 45-65 |
| Active Lanes | ~49 / 141 | ~118 / 141 | ~83 / 141 |
| Throughput | 2,800-3,200/hr | 4,200-4,700/hr | 3,500-3,800/hr |
| Avg Clearance | 1.5-2.0 min | 4.2-5.7 min | 2.8-3.6 min |
| Inspection Pits | 2 / 4 | 4 / 4 | 4 / 4 |

---

## Demo 3: Vehicle AI Commander (S/N 9 + S/N 10)

**Page:** `/modules/trafficops/commander-vehicle`
**Scenario:** Same infrastructure as Demo 2, with structured demo flow

### Step-by-Step Flow

| Step | Action | State | What Happens | Duration |
|------|--------|-------|-------------|----------|
| 1 | Page Load | `IDLE` | Vehicle KPI bar + queue chart + lane grids | — |
| 2 | **🚗 Trigger Vehicle Surge** | `SURGING` | Injects 300 vehicles. Alert banner with moto/car queue counts | Immediate |
| 3 | **🤖 Run AI Analysis** | `SURGING` | Erlang-C recommendation for optimal lane config | ~5-10s |
| 4 | Review Recommendation | `SURGING` | Panel shows: Arrival Autolanes, Manual, Moto, Departure, Inspection Pits, Est. Recovery | Manual review |
| 5 | **✅ Accept & Deploy** | `LANE_ADJUSTING` | Backend transitions, lanes expand | ~30s |
| 6 | Auto-Recovery | `RECOVERING` → `IDLE` | Auto-transition back to normal | ~50s |

### Additional Features
- **Oracle Chart:** Live queue length time-series — Motorcycle vs Car (ECharts)
- **Projection:** DES simulation to forecast queue drain with +2 lanes (on-demand)
- **S/N 9 Grid:** 32 autolanes + 40 manual counters + 2 motorcycle lanes (color-coded)
- **S/N 10 Grid:** 29 autolanes + 36 manual counters + 2 motorcycle lanes
- **Inspection Pits:** 4 pits with ACTIVE/STANDBY status

---

## Algorithm Inventory Summary

| Algorithm | Engine | Used In | Purpose |
|-----------|--------|---------|---------|
| **Erlang-C (M/M/c)** | AI Engine (Python) | Recommend, Impact Analysis | Optimal lane configuration, steady-state wait time |
| **Holt-Winters** | AI Engine (Python) | Forecast | Time-series prediction with seasonality |
| **DES (SimPy)** | AI Engine (Python) | Simulate, Trade-off, Projection | Discrete event queue simulation |
| **Monte Carlo** | AI Engine (Python) | Stress Test | 10K-scenario robustness validation |
| **Rule-based Reasoning** | Frontend (JS) | Reason stage | SOP matching, constraint analysis |
| **Threshold Agent** | Frontend (JS) | Auto-Pilot | Queue-based lane open/close triggers |
| **Tidal Flow** | Frontend (JS) | FlexiLane | Direction switching based on queue differential |

## Backend State Machine

```
IDLE → (inject-surge) → SURGING → (accept-recommendation) → LANE_ADJUSTING
                                                                    ↓ (30s auto)
                                  IDLE ← (20s auto) ← RECOVERING ←─┘
```

All state transitions managed by `DemoService.java` via `ScheduledExecutorService`.
Both Passenger and Vehicle KPI services (`PassengerFlowService`, `VehicleFlowService`) react to `DemoState`.
