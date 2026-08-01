# FactVerse AI Agent — Deployment SOP

> Standard Operating Procedure for building, deploying, and verifying the FactVerse platform on the production server.

| Field | Value |
|-------|-------|
| **Server** | `factverse.ai` (Azure VM, Ubuntu 24.04 LTS, 16 GB RAM, 30 GB disk) |
| **SSH** | `ssh opal@factverse.ai` |
| **Architecture** | `linux/amd64` |
| **SSL** | Let's Encrypt via Certbot (auto-renew) |
| **Docker Network** | `factverse-ai-agent_default` |

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Container Inventory](#3-container-inventory)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [SOP A — Full Stack Deployment (First Time)](#5-sop-a--full-stack-deployment-first-time)
6. [SOP B — Backend-Only Deployment](#6-sop-b--backend-only-deployment)
7. [SOP C — Frontend-Only Deployment](#7-sop-c--frontend-only-deployment)
8. [SOP D — AI Engine Deployment](#8-sop-d--ai-engine-deployment)
9. [Post-Deployment Verification](#9-post-deployment-verification)
10. [Rollback Procedure](#10-rollback-procedure)
11. [Troubleshooting Guide](#11-troubleshooting-guide)
12. [Maintenance Tasks](#12-maintenance-tasks)

---

## 1. Architecture Overview

```
                        ┌─────────────────┐
                        │   Cloudflare /   │
                        │   Let's Encrypt  │
                        └────────┬────────┘
                                 │ HTTPS :443
                        ┌────────▼────────┐
                        │  Host Nginx     │
                        │  (reverse proxy)│
                        └──┬──┬──┬──┬─────┘
               ┌───────────┘  │  │  └──────────────┐
               │              │  │                  │
          :3001│         :8080│  │:8000        :3000│
       ┌───────▼──┐   ┌──────▼──▼──┐   ┌──────────▼──┐
       │ Frontend  │   │  Backend   │   │  Grafana     │
       │ (Nginx)   │   │  (Spring)  │   │              │
       └───────────┘   └──┬─────┬──┘   └──────────────┘
                          │     │
                  ┌───────┘     └───────┐
                  │                     │
           ┌──────▼──────┐      ┌──────▼──────┐
           │  PostgreSQL  │      │    Redis     │
           │   :5432      │      │    :6379     │
           └──────────────┘      └─────────────┘

       ┌──────────────┐    ┌──────────────┐
       │  AI Engine    │    │  Prometheus   │
       │  :8000        │    │  :9090        │
       └──────────────┘    └──────────────┘
```

**Traffic flow**: Client -> Cloudflare/Certbot HTTPS -> Host Nginx (:443) -> Container ports.

Host Nginx routing:
- `/` -> `fv-frontend` (:3001)
- `/api/` -> `fv-backend` (:8080)
- `/ws` -> `fv-backend` (:8080, WebSocket upgrade)
- `/ai/` -> `fv-ai-engine` (:8000)
- `/grafana/` -> `factverse-grafana` (:3000)
- `/actuator/` -> `fv-backend` (:8080)

---

## 2. Prerequisites

### Local machine (build machine)

- Docker Desktop with multi-platform support (`docker buildx`)
- SSH key configured for `opal@factverse.ai`
- Git access to the `factverse-ai-agent` repository
- Node.js 20+ (for local frontend builds if needed)
- Java 21+ / Maven 3.9+ (for local backend builds if needed)

### Server

- Docker Engine 24+
- Nginx (host-level reverse proxy)
- Certbot for SSL
- At least 4 GB free RAM, 5 GB free disk

### Verify server access

```bash
ssh opal@factverse.ai "docker --version && sudo docker ps --format '{{.Names}} {{.Status}}'"
```

---

## 3. Container Inventory

| Container | Image | Port Mapping | Network Alias | Restart Policy |
|-----------|-------|-------------|---------------|----------------|
| `fv-postgres` | `postgres:16` | 5432:5432 | `postgres`, `fv-postgres` | unless-stopped |
| `fv-redis` | `redis:7-alpine` | 6379:6379 | `redis`, `fv-redis` | unless-stopped |
| `fv-backend` | `jiel/factverse-backend:latest` | 8080:8080 | `fv-backend` | unless-stopped |
| `fv-frontend` | `jiel/factverse-frontend:latest` | 3001:80 | `fv-frontend` | unless-stopped |
| `fv-ai-engine` | `jiel/factverse-ai-engine:latest` | 8000:8000 | `fv-ai-engine` | unless-stopped |
| `factverse-prometheus` | `prom/prometheus:latest` | 9090:9090 | — | unless-stopped |
| `factverse-grafana` | `grafana/grafana:latest` | 3000:3000 | — | unless-stopped |

---

## 4. Environment Variables Reference

### Backend (`fv-backend`)

| Variable | Value on Server | Notes |
|----------|----------------|-------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://fv-postgres:5432/factverse` | Uses Docker DNS |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | Matches PG container |
| `SPRING_DATASOURCE_PASSWORD` | `postgres` | Matches PG container |
| `SPRING_DATA_REDIS_HOST` | `fv-redis` | **Must** be `SPRING_DATA_REDIS_HOST` (Spring Boot 3.x) |
| `SPRING_FLYWAY_ENABLED` | `true` | Runs DB migrations on startup |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `none` | **Critical** — Flyway handles DDL; `update` causes trigger conflicts |

> **Warning**: Do NOT set `JWT_SECRET` env var. The app uses a default base64-encoded secret from `application.yml`. Setting a non-base64 value (e.g., `factverse-jwt-secret-key-2024-production`) will crash the app with `Illegal base64 character`.

### Frontend (`fv-frontend`)

No runtime env vars needed. Build-time arg `VITE_API_BASE_URL=/api` is baked into the Docker image.

### AI Engine (`fv-ai-engine`)

Managed separately. See [SOP D](#8-sop-d--ai-engine-deployment).

---

## 5. SOP A — Full Stack Deployment (First Time)

Use this for setting up a fresh server or complete redeployment.

### Step 1: Build all Docker images (local machine)

```bash
PROJECT_ROOT=~/path/to/factverse-ai-agent

# Build backend (linux/amd64)
cd "$PROJECT_ROOT/backend"
docker build --platform linux/amd64 -t jiel/factverse-backend:latest .

# Build frontend (linux/amd64)
cd "$PROJECT_ROOT/frontend"
docker build --platform linux/amd64 -t jiel/factverse-frontend:latest .
```

> Build time: Backend ~3-5 min (Maven deps + compile), Frontend ~2-4 min (npm install + Vite build).

### Step 2: Save and transfer images

```bash
# Save images to compressed archives
docker save jiel/factverse-backend:latest | gzip > /tmp/fv-backend.tar.gz
docker save jiel/factverse-frontend:latest | gzip > /tmp/fv-frontend.tar.gz

# Transfer to server
scp /tmp/fv-backend.tar.gz opal@factverse.ai:/tmp/
scp /tmp/fv-frontend.tar.gz opal@factverse.ai:/tmp/
```

### Step 3: Load images on server

```bash
ssh opal@factverse.ai "
  gunzip -c /tmp/fv-backend.tar.gz | sudo docker load
  gunzip -c /tmp/fv-frontend.tar.gz | sudo docker load
  rm /tmp/fv-backend.tar.gz /tmp/fv-frontend.tar.gz
"
```

### Step 4: Create Docker network (if not exists)

```bash
ssh opal@factverse.ai "sudo docker network create factverse-ai-agent_default 2>/dev/null || true"
```

### Step 5: Start infrastructure containers

```bash
# PostgreSQL
ssh opal@factverse.ai "sudo docker run -d \
  --name fv-postgres \
  --restart unless-stopped \
  --network factverse-ai-agent_default \
  --network-alias postgres \
  -p 5432:5432 \
  -e POSTGRES_DB=factverse \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -v pg_data:/var/lib/postgresql/data \
  postgres:16"

# Redis
ssh opal@factverse.ai "sudo docker run -d \
  --name fv-redis \
  --restart unless-stopped \
  --network factverse-ai-agent_default \
  --network-alias redis \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine redis-server --appendonly yes"
```

Wait for healthy:
```bash
ssh opal@factverse.ai "
  until sudo docker exec fv-postgres pg_isready -U postgres; do sleep 2; done
  echo 'PostgreSQL ready'
  until sudo docker exec fv-redis redis-cli ping | grep PONG; do sleep 2; done
  echo 'Redis ready'
"
```

### Step 6: Start backend

```bash
ssh opal@factverse.ai "sudo docker run -d \
  --name fv-backend \
  --restart unless-stopped \
  --network factverse-ai-agent_default \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL='jdbc:postgresql://fv-postgres:5432/factverse' \
  -e SPRING_DATASOURCE_USERNAME='postgres' \
  -e SPRING_DATASOURCE_PASSWORD='postgres' \
  -e SPRING_DATA_REDIS_HOST='fv-redis' \
  -e SPRING_FLYWAY_ENABLED='true' \
  -e SPRING_JPA_HIBERNATE_DDL_AUTO='none' \
  jiel/factverse-backend:latest"
```

Wait for startup (~30-60 seconds):
```bash
ssh opal@factverse.ai "
  for i in \$(seq 1 60); do
    if sudo docker logs fv-backend 2>&1 | grep -q 'Started AgentApplication'; then
      echo 'Backend started successfully'
      break
    fi
    sleep 2
  done
"
```

### Step 7: Start frontend

```bash
ssh opal@factverse.ai "sudo docker run -d \
  --name fv-frontend \
  --restart unless-stopped \
  --network factverse-ai-agent_default \
  -p 3001:80 \
  jiel/factverse-frontend:latest"
```

### Step 8: Verify

```bash
# All containers running
ssh opal@factverse.ai "sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

# Backend API responds
ssh opal@factverse.ai "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/actuator/health"

# Frontend serves HTML
ssh opal@factverse.ai "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/"

# Public HTTPS
curl -s -o /dev/null -w '%{http_code}' https://factverse.ai/
```

---

## 6. SOP B — Backend-Only Deployment

Use this for backend code changes, new Flyway migrations, or API updates.

### Step 1: Build

```bash
cd "$PROJECT_ROOT/backend"
docker build --platform linux/amd64 -t jiel/factverse-backend:latest .
```

### Step 2: Transfer

```bash
docker save jiel/factverse-backend:latest | gzip > /tmp/fv-backend.tar.gz
scp /tmp/fv-backend.tar.gz opal@factverse.ai:/tmp/
```

### Step 3: Load and restart

```bash
ssh opal@factverse.ai "
  gunzip -c /tmp/fv-backend.tar.gz | sudo docker load &&
  sudo docker stop fv-backend &&
  sudo docker rm fv-backend &&
  sudo docker run -d \
    --name fv-backend \
    --restart unless-stopped \
    --network factverse-ai-agent_default \
    -p 8080:8080 \
    -e SPRING_DATASOURCE_URL='jdbc:postgresql://fv-postgres:5432/factverse' \
    -e SPRING_DATASOURCE_USERNAME='postgres' \
    -e SPRING_DATASOURCE_PASSWORD='postgres' \
    -e SPRING_DATA_REDIS_HOST='fv-redis' \
    -e SPRING_FLYWAY_ENABLED='true' \
    -e SPRING_JPA_HIBERNATE_DDL_AUTO='none' \
    jiel/factverse-backend:latest
"
```

### Step 4: Verify startup

```bash
# Watch logs until started (Ctrl+C to exit)
ssh opal@factverse.ai "sudo docker logs -f fv-backend 2>&1 | grep --line-buffered -E 'Started|ERROR|migration|V[0-9]+'"

# Quick health check
ssh opal@factverse.ai "curl -s http://localhost:8080/actuator/health"
```

**Expected startup time**: ~30-60 seconds.

---

## 7. SOP C — Frontend-Only Deployment

Use this for UI changes, styling, locale updates, or new pages.

### Step 1: Build

```bash
cd "$PROJECT_ROOT/frontend"
docker build --platform linux/amd64 -t jiel/factverse-frontend:latest .
```

### Step 2: Transfer

```bash
docker save jiel/factverse-frontend:latest | gzip > /tmp/fv-frontend.tar.gz
scp /tmp/fv-frontend.tar.gz opal@factverse.ai:/tmp/
```

### Step 3: Load and restart

```bash
ssh opal@factverse.ai "
  gunzip -c /tmp/fv-frontend.tar.gz | sudo docker load &&
  sudo docker stop fv-frontend &&
  sudo docker rm fv-frontend &&
  sudo docker run -d \
    --name fv-frontend \
    --restart unless-stopped \
    --network factverse-ai-agent_default \
    -p 3001:80 \
    jiel/factverse-frontend:latest
"
```

### Step 4: Verify

```bash
ssh opal@factverse.ai "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/"
curl -s -o /dev/null -w '%{http_code}' https://factverse.ai/
```

**Downtime**: ~2-5 seconds (stop + start).

---

## 8. SOP D — AI Engine Deployment

### Step 1: Build

```bash
cd "$PROJECT_ROOT/ai-engine"
docker build --platform linux/amd64 -t jiel/factverse-ai-engine:latest .
```

### Step 2: Transfer

```bash
docker save jiel/factverse-ai-engine:latest | gzip > /tmp/fv-ai-engine.tar.gz
scp /tmp/fv-ai-engine.tar.gz opal@factverse.ai:/tmp/
```

### Step 3: Load and restart

```bash
ssh opal@factverse.ai "
  gunzip -c /tmp/fv-ai-engine.tar.gz | sudo docker load &&
  sudo docker stop fv-ai-engine &&
  sudo docker rm fv-ai-engine &&
  sudo docker run -d \
    --name fv-ai-engine \
    --restart unless-stopped \
    --network factverse-ai-agent_default \
    -p 8000:8000 \
    -v ai_models:/app/model_data \
    -e ENVIRONMENT=production \
    -e API_KEY=demo-key \
    jiel/factverse-ai-engine:latest
"
```

> **Note**: Add LLM provider env vars (`OPENAI_API_KEY`, `NVIDIA_API_KEY`, etc.) as needed.

---

## 9. Post-Deployment Verification

Run this checklist after every deployment:

```bash
# 1. All containers running
ssh opal@factverse.ai "sudo docker ps --format 'table {{.Names}}\t{{.Status}}'"

# 2. Backend started (no crash loop)
ssh opal@factverse.ai "sudo docker logs fv-backend 2>&1 | tail -3"

# 3. Flyway migrations applied
ssh opal@factverse.ai "sudo docker logs fv-backend 2>&1 | grep -i 'migration\|flyway' | tail -5"

# 4. API health
ssh opal@factverse.ai "curl -s http://localhost:8080/actuator/health"

# 5. Frontend serves
ssh opal@factverse.ai "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/"

# 6. Public HTTPS access
curl -s -o /dev/null -w '%{http_code}' https://factverse.ai/

# 7. Login test (should return 401, confirming API is reachable)
curl -s -o /dev/null -w '%{http_code}' https://factverse.ai/api/v1/users/me
```

**Expected results**: Steps 1-3 show healthy containers, step 4 returns JSON (status may be DOWN due to PLC connections — this is OK), steps 5-6 return `200`, step 7 returns `401`.

---

## 10. Rollback Procedure

### Quick rollback (if previous image is still available)

```bash
# 1. Check available images
ssh opal@factverse.ai "sudo docker images | grep factverse"

# 2. If old image has <none> tag, find by creation date
ssh opal@factverse.ai "sudo docker images --format '{{.Repository}}:{{.Tag}} {{.CreatedAt}} {{.ID}}' | grep factverse"

# 3. Tag old image and restart
ssh opal@factverse.ai "
  sudo docker tag <OLD_IMAGE_ID> jiel/factverse-backend:latest
  sudo docker stop fv-backend && sudo docker rm fv-backend
  # Re-run the docker run command from SOP B Step 3
"
```

### Full rollback (rebuild from Git)

```bash
# 1. Checkout the last known good commit
git log --oneline -5
git checkout <GOOD_COMMIT_HASH>

# 2. Rebuild and redeploy using SOP B or C
```

### Database rollback

> **Warning**: Flyway migrations are forward-only. If a migration introduced breaking schema changes, you must write a new migration to undo it. Never manually alter the `flyway_schema_history` table.

---

## 11. Troubleshooting Guide

### Backend crash loop

```bash
# Check the actual error
ssh opal@factverse.ai "sudo docker logs fv-backend 2>&1 | grep 'Caused by' | sort -u"
```

| Error | Cause | Fix |
|-------|-------|-----|
| `Illegal base64 character: '-'` | Invalid JWT_SECRET env var | Remove `JWT_SECRET` env var; let app use default from application.yml |
| `password authentication failed` | Wrong DB credentials | Use `SPRING_DATASOURCE_USERNAME=postgres`, `SPRING_DATASOURCE_PASSWORD=postgres` |
| `Unable to connect to Redis` | Wrong Redis env var name | Use `SPRING_DATA_REDIS_HOST` (not `SPRING_REDIS_HOST`) |
| `cannot alter type of a column used in a trigger` | Hibernate DDL update conflicts with PG triggers | Set `SPRING_JPA_HIBERNATE_DDL_AUTO=none` |
| `Unable to start bean 'redisMessageListenerContainer'` | Redis unreachable | Verify `SPRING_DATA_REDIS_HOST=fv-redis` and Redis container is on same network |

### Container not on correct network

```bash
# Check container network
ssh opal@factverse.ai "sudo docker inspect fv-backend --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool"

# List available networks
ssh opal@factverse.ai "sudo docker network ls"

# Verify the network name
ssh opal@factverse.ai "sudo docker inspect fv-postgres --format '{{.HostConfig.NetworkMode}}'"
```

### Health check shows DOWN

The backend health check reports DOWN when Modbus/BACnet PLC connections fail. This is **expected** in cloud environments where industrial devices are not reachable. The API itself functions normally.

To confirm the API works despite DOWN health:
```bash
ssh opal@factverse.ai "curl -s http://localhost:8080/api/v1/tenants/me/nav-config"
# Should return 401 (auth required) — confirms API is working
```

### Frontend returns 502 Bad Gateway

The Nginx reverse proxy on the host can't reach the container.

```bash
# Check if frontend is running
ssh opal@factverse.ai "sudo docker ps | grep frontend"

# Check if port 3001 is listening
ssh opal@factverse.ai "sudo ss -tlnp | grep 3001"

# Check host Nginx config
ssh opal@factverse.ai "sudo nginx -t"
```

### Disk space issues

```bash
# Check disk usage
ssh opal@factverse.ai "df -h /"

# Clean up old Docker images
ssh opal@factverse.ai "sudo docker image prune -f"

# Clean up stopped containers
ssh opal@factverse.ai "sudo docker container prune -f"

# Nuclear option: remove all unused images/volumes (careful!)
ssh opal@factverse.ai "sudo docker system prune -a --volumes"
```

---

## 12. Maintenance Tasks

### SSL certificate renewal

Certbot auto-renews. To manually renew:
```bash
ssh opal@factverse.ai "sudo certbot renew && sudo systemctl reload nginx"
```

### Database backup

```bash
ssh opal@factverse.ai "sudo docker exec fv-postgres pg_dump -U postgres factverse | gzip > /tmp/factverse-backup-\$(date +%Y%m%d).sql.gz"
```

### View Flyway migration history

```bash
ssh opal@factverse.ai "sudo docker exec fv-postgres psql -U postgres -d factverse -c 'SELECT version, description, installed_on, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 10;'"
```

### Monitor container resource usage

```bash
ssh opal@factverse.ai "sudo docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}'"
```

### Restart all application containers

```bash
ssh opal@factverse.ai "
  sudo docker restart fv-backend
  sudo docker restart fv-frontend
  sudo docker restart fv-ai-engine
"
```

---

## Quick Reference Card

```
BUILD BACKEND:   docker build --platform linux/amd64 -t jiel/factverse-backend:latest backend/
BUILD FRONTEND:  docker build --platform linux/amd64 -t jiel/factverse-frontend:latest frontend/
SAVE IMAGE:      docker save <image> | gzip > /tmp/<name>.tar.gz
TRANSFER:        scp /tmp/<name>.tar.gz opal@factverse.ai:/tmp/
LOAD IMAGE:      ssh opal@factverse.ai "gunzip -c /tmp/<name>.tar.gz | sudo docker load"
RESTART:         ssh opal@factverse.ai "sudo docker stop <name> && sudo docker rm <name> && sudo docker run -d ..."
LOGS:            ssh opal@factverse.ai "sudo docker logs -f <name> --tail 50"
STATUS:          ssh opal@factverse.ai "sudo docker ps --format 'table {{.Names}}\t{{.Status}}'"
```
---

## License Key Deployment (2026-03-21)

### On-Premise mode (set LICENSE_JWT)

```bash
# Generate a license JWT (on your local machine with private key)
python3 deploy/gen_license.py \
  --customer "ICA Singapore" \
  --tenant-id "uuid-here" \
  --modules "trafficops,fms,wayfinding" \
  --max-users 100 \
  --expires "2027-03-21"

# Set on server
echo 'LICENSE_JWT=eyJ...' >> /data/apps/factverse-ai-agent/.env

# Or pass directly to docker run
docker run -e LICENSE_JWT=eyJ... ...
```

### SaaS mode (default, no LICENSE_JWT)

No action needed. All modules unlocked. Backward compatible.

### Check license status

```bash
curl -s https://factverse.ai/api/v1/license/status \
  -H "Authorization: Bearer <admin-token>" | python3 -m json.tool
```

---

## GPU Worker Monitoring

```bash
# Check GPU worker heartbeat
ssh factverse "sudo docker exec fv-redis redis-cli -a <REDIS_PASS> get 'gpu:worker:gpu-tokyo-1:heartbeat'"

# Check GPU job queue
ssh factverse "sudo docker exec fv-redis redis-cli -a <REDIS_PASS> zcard 'gpu:queue'"

# Monitor logs (auto-checked every 10min by monitor.sh)
ssh factverse "tail -f /data/apps/monitor-checks.log | grep gpu"
```

### Configure Discord alerts for GPU Worker

```bash
# Add to /data/apps/.env or pass as environment variable
export DISCORD_WEBHOOK="https://discord.com/api/webhooks/..."

# Reload monitor (runs via cron, next run picks it up automatically)
```
