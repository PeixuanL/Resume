# Simulator Roadmap (ICA-like Mixed Facility)

This roadmap defines the simulator capabilities by phase. The simulator is a **data generator** (replay-first) and produces FV-compatible telemetry artifacts.

Guiding principles:
- Replay-first artifacts (manifest + NDJSON)
- Deterministic (seed + scenario version)
- Same telemetry contract as VisionOps (provenance differs)

---

## Phase 0 — Foundations (DONE)
- Run artifact bundle layout (manifest/topology/tracks/events/metrics + preview)
- Minimal 2D preview renderer (top-down)
- In-repo simulator package + CLI

## Phase 1 — ICA Core Flow (IN PROGRESS)
### P1.1 Topology + scenario config
- Zones: entry/queue/checkpoint/exit
- Lanes: 2 person lanes (p1/p2), 4 vehicle lanes (v1..v4)
- Checkpoints: gate per lane (capacity=1)

### P1.2 Agents
- Vehicles:
  - Single-lane queue per lane, spacing, checkpoint gating
  - Approach deceleration to checkpoint
  - Post-checkpoint speed recovery
- People:
  - Dedicated person engine
  - Groups (2–3) with cohesion and formation (staggered)
  - Two-lane queue selection (mostly shortest)
  - Checkpoint gating once per group
  - Post-checkpoint speed recovery

### P1.3 Telemetry (contract alignment)
- Upgrade simulator records to FV telemetry contract v0:
  - Envelope: schemaVersion/tenantId/facilityId/streamId/source
  - recordType: track|event|metric
  - tracks.pose{x,y,heading,speed}

Deliverable: FV can replay simulator artifacts directly.

## Phase 2 — Realism knobs (NEXT)
- Arrival curves (time-of-day), burst injection
- Human micro-behaviors: hesitation, lateral drift, occasional stop
- Vehicle micro-behaviors: varied deceleration profiles, stopped vehicle
- Events library: wrong-way, tailgating, lane blocked, crowd congestion
- Metrics: wait time distributions, throughput, density heatmap bins

## Phase 3 — Observation layer (Vision emulation)
- Turn ground truth into observation:
  - missed detections, false positives, ID switches, jitter
  - confidence fields
- Output observation telemetry with source.kind=simulator but channel=observed (or a dedicated field)

## Phase 4 — Interop + Evaluation
- Ground-truth vs observation alignment:
  - matching, precision/recall, trajectory error, ID switch count
- Export evaluation reports (JSON + charts)

## Phase 5 — Operationalization
- Scenario registry (versioned)
- Batch run runner (sweep parameters) producing artifacts
- Optional: stream mode (Redis/Kafka) with same record shapes
