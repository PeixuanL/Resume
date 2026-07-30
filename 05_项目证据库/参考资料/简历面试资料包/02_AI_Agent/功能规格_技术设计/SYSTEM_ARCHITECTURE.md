# Factverse AI Agent — Architecture Reference

> ⚠️ Deployment note: for current production deployment truth, use docs/DEPLOYMENT_SOP.md and deploy/ENVIRONMENT_CONTRACT.md. This file contains architecture context and some historical examples.

## Network Topology

```
Internet (HTTPS :443)
    │
    ▼
Host Nginx (pid on host, /etc/nginx/sites-enabled/factverse)
    │  SSL termination (Let's Encrypt)
    │
    ├─ /api/*    → backend upstream (active blue/green backend slot)
    ├─ /ai/*     → localhost:8000  (fv-ai-engine, FastAPI)
    ├─ /ws       → backend upstream (WebSocket/STOMP via backend)
    ├─ /grafana/ → localhost:3000  (Grafana)
    └─ /*        → localhost:3001  (fv-frontend, Vue SPA)

Docker Networks:
  factverse-ai-agent_default        deploy_default
    ├─ fv-postgres :5432              ├─ fv-frontend   :3001
    ├─ fv-redis    :6379              ├─ fv-ai-engine  :8000
    ├─ fv-ai-engine :8000             ├─ prometheus     :9090
    ├─ fv-backend-blue  :8080 ◄──────┤─ grafana        :3000
    └─ fv-backend-green :8081 ◄──────┘
         (backend is blue/green; active slot joins BOTH networks)
```

### Key Points
- **Host nginx** handles SSL + routing. Current production files: /etc/nginx/conf.d/factverse.conf and /etc/nginx/conf.d/backend-upstream.conf
- **Docker frontend nginx** (rontend/nginx.conf) serves SPA and proxies /api/ + /ws through host.docker.internal, not a fixed backend container name
- AI engine MUST have -p 8000:8000 port mapping for host nginx to reach it
- WebSocket path is /ws (no trailing slash) with SockJS fallback

## Authentication Flow

1. `POST /api/v1/auth/login` → returns `{ data: { accessToken: "..." } }`
2. Token stored in `localStorage` as `access_token`
3. `request.ts` Axios interceptor attaches `Authorization: Bearer <token>` to all `/api/` requests
4. STOMP WebSocket: token sent in `connectHeaders` (not HTTP auth) — `/ws/**` is `.permitAll()` in SecurityConfig
5. AI engine endpoints (`/ai/*`) use `SERVICE_PASSWORD` for backend→engine calls; frontend calls go unauthenticated through nginx

## API Response Format

### Backend (`/api/*`)
All controllers return `ApiResponse<T>`:
```json
{ "code": 200, "message": "ok", "data": <payload> }
```

**Critical**: `request.ts` response interceptor auto-unwraps `.data`, so API calls return `<payload>` directly.

```typescript
// CORRECT — request.ts already unwrapped
const list = await getCleanrooms()  // list IS the array

// WRONG — double unwrap → undefined
const { data } = await getCleanrooms()  // data is undefined!
```

**Safe pattern**: `res?.data ?? res ?? []` (handles both wrapped and unwrapped)

### Spring Page responses
Paginated endpoints return `{ content: [...], totalElements, totalPages, ... }`.
Use `result?.content ?? result ?? []` for arrays.

### Exceptions
- `FmsLiteController` returns raw entities (NOT wrapped in ApiResponse)
- AI engine returns raw JSON (no ApiResponse wrapper)

### AI Engine (`/ai/*`)
Frontend MUST use `fetch('/ai/...')` — NOT `request.post('/ai/...')` which prepends `/api/v1`.

```typescript
// CORRECT
const res = await fetch('/ai/semiops/env-predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
const data = await res.json()

// WRONG — routes to backend, gets 404
const data = await request.post('/ai/semiops/env-predict', payload)
```

## Deploy Scripts

| Script | What it does |
|--------|-------------|
| `deploy-ai.sh` | AI engine only (repo root) |
| `deploy/snapshot.sh` | Save/restore/list DB snapshots |
| `deploy/healthcheck.sh` | Container health check (cron every 5 min) |
| `deploy/monitor.sh` | Full system monitor (cron every 10 min) |

### Manual deploy commands
Preferred production entrypoints:
`ash
cd /data/apps/factverse-ai-agent
bash deploy/preflight-prod.sh backend
bash deploy/prod-backend.sh

bash deploy/preflight-prod.sh frontend
bash deploy/prod-frontend.sh

bash deploy/preflight-prod.sh ai-engine
bash deploy/prod-ai-engine.sh

bash deploy/prod-verify.sh
`

The older one-off docker commands are historical/debug context only and should not be treated as the current production procedure.

## RBAC
- Use `@rbac.has("permission")` not `hasAuthority()`
- Permissions-based, not role-based
- Admin account: `admin` / `admin123` (production)

## Project Structure
```
factverse-ai-agent/
├── frontend/          # Vue 3 + TypeScript, 188K LOC
│   ├── nginx.conf     # Docker nginx config (baked into image)
│   ├── CONVENTIONS.md # Coding standards for sub-agents
│   └── src/
│       ├── views/     # 648 Vue components
│       ├── modules/   # 30 business modules (14 top + 16 FMS sub)
│       ├── locales/   # 11 languages, flatJson mode
│       └── router/    # 358 routes
├── backend/           # Java 21 + Spring Boot 3.4, 113K LOC
│   └── src/main/java/com/datamesh/agent/
├── ai-engine/         # Python 3.12 + FastAPI, 102K LOC
├── deploy/            # Deploy scripts + snapshots
└── docs/              # Architecture + specs
```

## Golden Demo Snapshots
- Location: `/data/snapshots/` on production server
- Latest: `golden-demo-v10.sql.gz` (420K)
- Restore: `echo 'y' | sudo bash deploy/snapshot.sh restore golden-demo-v10`
- AI engine runs in `DEMO_MODE=true` — generates sensor readings only, no alert/WO mutations

## Monitoring
- Grafana: `https://factverse.ai/grafana/`
- Prometheus: internal only (:9090)
- `deploy/healthcheck.sh` — every 5 min via cron
- `/data/apps/monitor.sh` — every 10 min
- OpenClaw cron job `production-monitor-check` — every 6h, alerts on Discord

## License Key System (2026-03-21)

```
On-Premise mode:
  LICENSE_JWT env var (RSA RS256 JWT)
      └─ LicenseService (@PostConstruct)
          └─ RSA public key (classpath: license/license-public.key)
          └─ Validates: customer, allowedModules, expiresAt, offlineGraceDays

SaaS mode (no LICENSE_JWT):
  LicenseService → UNLICENSED → all modules allowed (backward compatible)

Module access flow:
  Request → TenantModuleGuard
      ├─ licenseService.isModuleAllowed(moduleKey)   ← License check first
      └─ tenantService.isModuleEnabled(tenantId, moduleKey)  ← Tenant config

Status endpoint: GET /api/v1/license/status (ADMIN only)
```

**Key management**:
- Private key: `factverse:/home/opal/license-keys/private.pem` (DataMesh only)
- Public key: embedded in Docker image at `classpath:license/license-public.key`
- License generator: `LicenseKeyGenerator.java` CLI tool

## GPU Worker Architecture (gpu-tokyo-1)

```
AI Engine (CPU VM, factverse.ai)
    └─ gpu_dispatch.py (GpuDispatcher)
        └─ Redis sorted set: gpu:queue (priority 0/1/2)
            └─ Tailscale mesh → gpu-tokyo-1 (RTX 4090, 24GB)
                └─ 13 compute engines (RAPIDS 25.02 / CUDA 12.8)
                    └─ Results → Redis → FastAPI response

Heartbeat:  gpu:worker:{worker_id}:heartbeat (TTL ~90s)
Dispatch:   gpu_dispatch.run(engine, params, timeout, priority) → polls gpu:job:{id}
GPU engines: gpu-worker/engines/ (11 production + 1 placeholder + 1 test)
Fallback:   returns None when GPU unavailable → caller uses local CPU path
Monitor:    /data/apps/monitor.sh → check_gpu_worker() every 10min
Alert:      DISCORD_WEBHOOK (pending config)
```

**GPU engines** (`gpu-worker/engines/`):
- ✅ anomaly_detection, forecast, montecarlo, metamodel, graph, inference, signal_processing, physics, data_pipeline, optimization, clustering
- 🔧 feature_eng (stub)
- ✅ echo (test)

**Currently active**: TelcoOps anomaly/forecast, PdM signal processing
