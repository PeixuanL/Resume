# VisionOps — Architecture Draft (PoC)

This module implements video analytics based on NVIDIA DeepStream / Metropolis reference workflow.

## Goals

- Support **RTSP real-time** and **offline video batch** analysis.
- Produce both:
  1) annotated video/preview (OSD)
  2) structured events + KPI metrics for UI / reports
- Remain **vendor-neutral at platform boundary** (VisionOps APIs/events do not depend on DeepStream-specific formats).

## Components

- `deepstream-worker` (GPU): GStreamer/DeepStream pipeline
  - decode → primary infer (PeopleNet) → tracker (NvDCF/IOU) → analytics (ROI/Tripwire) → optional secondary infer (age/gender)
  - emits events/metrics + optional OSD stream/files

- `backend` (Spring Boot):
  - tenants/RBAC
  - VisionOps config (sources, ROI polygons, tripwires, thresholds)
  - job orchestration (start/stop, offline jobs)
  - stores events/metrics, exposes REST APIs

- `frontend` (Vue):
  - module toggle + pages for overview/live/config/offline/heatmap/reports

## Runtime Modes

### Real-time

- RTSP → deepstream-worker
- worker emits per-frame object metadata + per-second metrics
- backend aggregates by configurable window (1s/5s)
- UI refresh via polling or websocket

### Offline

- user uploads file / references file path
- backend creates job
- worker runs "as-fast-as-possible" (clock sync off) until EOS
- on completion: summary report + annotated video + heatmap assets

## Event Contract (initial)

All events carry:

- `traceId`
- `tenantId`
- `sourceId`
- `ts` (epoch ms)
- `type`

### Types

- `occupancy.snapshot`
  - `{ roiId, count }[]`
- `flow.crossing`
  - `{ lineId, direction, delta, trackId? }`
- `dwell.alert`
  - `{ roiId, trackId, dwellSeconds }`
- `attributes`
  - `{ trackId, gender, ageBucket, confidence }`
- `heatmap.point`
  - `{ x, y, weight?, trackId? }`

Transport (PoC): Redis Streams.

## Backend API (scaffold)

- `GET /api/v1/visionops/sources`
- `GET /api/v1/visionops/jobs`

Next: `/rules`, `/rois`, `/tripwires`, `/metrics`, `/events`, `/jobs/{id}`
