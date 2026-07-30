# NCS Checkpoint Operations — Demo Runbook

## Quick Start

```bash
# Terminal demo (offline, no server needed)
cd ai-engine
python demo/demo_ncs.py --no-pause        # Full auto demo
python demo/demo_ncs.py                    # Interactive (press Enter between sections)
python demo/demo_ncs.py --section scenes   # Scene overview only

# With live API server
python demo/demo_ncs.py --api --host http://localhost:9000
```

## Demo Narrative (15 Minutes)

### Opening (1 min)

> "Today I'll demonstrate the FactVerse AI Agent NCS module — a digital twin
> for the Woodlands Checkpoint border crossing between Singapore and Malaysia.
> We've modeled 18 Areas of Operations across 3 sites, with discrete event
> simulation, AI-driven optimization, and NCS compliance coverage."

### Act 1: Site Overview (2 min)

**CLI:** `python demo/demo_ncs.py --section scenes --no-pause`
**UI:** Navigate to TrafficOps > NCS Dashboard > Site Overview tab

Key talking points:
- 3 sites: RTS Link (train), WCP (bus/car/motorcycle), WCPR1 (forward screening)
- 14 scenes covering all 18 AOs from the NCS spec
- 5 entity types: train_pax, bus_pax, car_driver, motorcycle_rider, cargo_truck
- Entity-type-aware service times (bus 30s vs truck 3min at same checkpoint)
- Total capacity: ~100k+ travelers/hr across all sites

**Demo action:** Click any AO row to jump to Simulation tab.

### Act 2: Live Simulation (3 min)

**CLI:** `python demo/demo_ncs.py --section sim --no-pause`
**UI:** NCS Dashboard > Simulation tab

Key talking points:
- Select "RTS SG Departure CIQ" — 74 ABCS auto-gates + 9 CT scanners
- Click "Run Simulation" → M/M/c queueing model estimates in real-time
- Utilization column: green (<70%), yellow (70-90%), red (>90%)
- Identify bottleneck: security CT scanners at 93% utilization
- Average wait: 0.3 min at auto-gates vs 4.2 min at CT scanners

**Demo action:** Switch to "WCP Arrival Car/Motorcycle" — show different entity type mix.

### Act 3: Road Network (2 min)

**CLI:** `python demo/demo_ncs.py --section roads --no-pause`
**UI:** NCS Dashboard > Road Network tab

Key talking points:
- 14 GPS-coordinate nodes from Table 3 of the NCS spec
- 18 road segments with arrival/departure/bidirectional/staff directions
- Dijkstra shortest path: Bukit Chagar → BKE MC/Car (1.2km, 2.4min)
- Emergency route planning for incident response
- Haversine distance calculation on real WGS84 coordinates

**Demo action:** Change from/to nodes and click "Find Route" live.

### Act 4: What-If Experiments (3 min)

**CLI:** `python demo/demo_ncs.py --section whatif --no-pause`
**UI:** NCS Dashboard > What-If Analysis tab

Key talking points:
- 6 pre-configured experiments addressing Table 4 compliance
- Q1: "Booth impact" — toggle 43→35→50 auto-lanes, see throughput delta
- Q2: "Optimal lanes" — NSGA-II optimization for <10 min wait target
- Q3: "Security +10-50%" — screening time impact on pedestrian flow
- Q4: "Staff routes" — Dijkstra-optimized incident response paths
- Equipment failure resilience — CT scanner/ABCS gate failure scenarios

**Demo action:** Select "Booth Count Impact" preset → click "Run" → show results.

### Act 5: Calibration & AI Loop (2 min)

**CLI:** `python demo/demo_ncs.py --section calibrate --no-pause`

Key talking points:
- Continuous calibration loop: Drift → Recalibrate → Validate → A/B → Promote
- DistributionFitter tests 7 distributions (exponential, gamma, lognormal, etc.)
- PSI + KS test for drift detection (threshold: PSI>0.20, KS p<0.05)
- ModelValidator with MAPE<10% acceptance gate
- Daily scheduled recalibration at 03:00 UTC via APScheduler
- Version-controlled parameters in MLOps ModelRegistry

### Act 6: AI Insights (2 min)

**CLI:** `python demo/demo_ncs.py --section insights --no-pause`

Key talking points:
- SimulationPlanner: autonomous experiment design (what-if, comparison, DOE)
- InsightGenerator: dual-audience recommendations
  - **Manager view**: cost-benefit analysis, Pareto summary, ROI
  - **Operator view**: concrete actions with timing ("Add 2 staff at Gate B at 07:30")
- Proactive orchestration: StatisticalForecaster → ConfidenceScorer → DecisionGate
- 4 autonomy levels: auto-execute, recommend, require-approval, monitor-only

### Closing (1 min)

> "We've demonstrated end-to-end coverage of the NCS requirements:
> - All 18 Areas of Operations modeled with entity-specific simulation
> - GPS road network with shortest-path routing
> - Table 4 what-if experiments pre-configured and runnable
> - 3D heatmap overlay, DWG import adapter, continuous calibration loop
> - 131 tests passing, full API coverage with 23 endpoints"

---

## API Endpoints for Live Demo

```bash
# Scene overview
curl http://localhost:9000/ai/ncs/scenes | python -m json.tool
curl http://localhost:9000/ai/ncs/sites | python -m json.tool

# Road network
curl http://localhost:9000/ai/ncs/roads/summary | python -m json.tool
curl "http://localhost:9000/ai/ncs/roads/route?from_node=wcp-12&to_node=wcp-5" | python -m json.tool

# Simulation
curl -X POST http://localhost:9000/ai/ncs/simulate \
  -H "Content-Type: application/json" \
  -d '{"scene_id": "ncs-rts-sg-departure"}' | python -m json.tool

# What-If
curl -X POST http://localhost:9000/ai/ncs/whatif/run \
  -H "Content-Type: application/json" \
  -d '{"preset_id": "booth-impact"}' | python -m json.tool

# Calibration
curl -X POST http://localhost:9000/ai/trafficops/calibrate | python -m json.tool
curl http://localhost:9000/ai/trafficops/calibration/status | python -m json.tool
```

## Pre-Demo Checklist

- [ ] AI engine running on port 9000 (`cd ai-engine && uvicorn main:app --port 9000`)
- [ ] Frontend running on port 5173 (`cd frontend && npm run dev`)
- [ ] Test suite passes (`cd ai-engine && python -m pytest tests/ -q`)
- [ ] Demo script dry run (`python demo/demo_ncs.py --no-pause`)
- [ ] Browser bookmarks: NCS Dashboard (`/trafficops/ncs`), WCP Dashboard (`/trafficops/cp`)
- [ ] Terminal font size increased for audience visibility

## NCS Compliance Coverage Summary

| Requirement | Status | Evidence |
|-------------|--------|----------|
| 3D Digital Twin | Comply | FactVerseViewport + Heatmap3DOverlay |
| DES Engine | Comply | SimPy + M/M/c + entity-type-aware processes |
| Layout Optimization | Comply | NSGA-II multi-objective + XGBoost metamodel |
| What-If Analysis | Comply | 6 presets (Table 4 Q1-Q4 + extras) |
| Road Network | Comply | 14 GPS nodes, Dijkstra, 3 route types |
| 18 AOs | Comply | All modeled in NCS_SCENE_DEFINITIONS |
| Multi-Entity | Comply | 5 entity types with type-specific clearance |
| 3D Heatmap | Comply w/ Conditions | SVG overlay, needs FactVerse 3D integration |
| DWG/DXF Import | Comply w/ Conditions | ezdxf adapter, needs UI upload flow |
| ERP/MES/SCADA | Gap | Connector interfaces designed, not integrated |
| CRN Variance | Comply w/ Conditions | Needs more replications for CI convergence |

## File Inventory

### Backend (ai-engine/)
| File | Lines | Purpose |
|------|-------|---------|
| `modules/trafficops/ncs_scenes.py` | ~580 | 14 scene definitions, 5 entity profiles, 6 what-if presets |
| `modules/trafficops/ncs_checkpoint_scene.py` | ~250 | NcsCheckpointScene with entity-type service times |
| `modules/trafficops/ncs_road_network.py` | ~300 | GPS road graph, Dijkstra, route queries |
| `modules/trafficops/simulation_planner.py` | ~500 | Autonomous experiment design & execution |
| `modules/trafficops/insight_generator.py` | ~500 | Dual-audience insight generation |
| `routers/ncs_operations.py` | ~420 | 15 NCS API endpoints |
| `routers/traffic_forecast.py` | ~496 | 8 calibration/what-if/optimize endpoints |
| `calibration/scheduler.py` | ~300 | APScheduler daily recalibration |
| `calibration/pipeline.py` | ~350 | DistributionFitter + CalibrationPipeline |
| `calibration/drift_detector.py` | ~200 | PSI + KS drift detection |
| `des_platform/dwg_adapter.py` | ~480 | DXF/DWG import → FacilityLayout |
| `demo/demo_ncs.py` | ~450 | CLI demo script |
| 12 test files | ~700 | 131 tests total |

### Frontend (frontend/)
| File | Purpose |
|------|---------|
| `src/views/trafficops/NcsDashboardView.vue` | NCS operations dashboard (4 tabs) |
| `src/views/trafficops/components/Heatmap3DOverlay.vue` | SVG heatmap overlay with time playback |
| `src/api/ncs.ts` | TypeScript NCS API integration |
| `src/modules/trafficops/routes.ts` | Route registration (+ NcsDashboard) |
| `src/modules/trafficops/index.ts` | Nav registration |
