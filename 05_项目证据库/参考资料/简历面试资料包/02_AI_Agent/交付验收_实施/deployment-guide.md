# [ARCHIVED] Deployment Guide

> ⚠️ **Archived document — do not use for current production deployment.**
>
> This guide reflects an older deployment model and may contain outdated assumptions.
>
> Current source of truth:
> - `docs/DEPLOYMENT_SOP.md`
> - `deploy/ENVIRONMENT_CONTRACT.md`
> - `deploy/preflight-prod.sh`
> - `deploy/prod-backend.sh`
> - `deploy/prod-frontend.sh`
> - `deploy/prod-ai-engine.sh`
> - `deploy/prod-verify.sh`


## Prerequisites

- Ubuntu 22.04+ (or similar Linux)
- Docker Engine 24+ with Compose plugin
- 4 GB RAM minimum (8 GB recommended for AI Engine ML models)
- 50 GB disk (SSD recommended)
- Domain with SSL certificate (nginx handles TLS termination)

## Quick Start (Docker Compose)

```bash
cd deploy/
docker compose up -d
```

This starts: PostgreSQL, Redis, Backend, AI Engine, Frontend, Grafana, Prometheus.

## Production Deployment

### 1. Server Setup

```bash
# Clone repo
cd /data/apps
git clone https://github.com/jieseattle/factverse-ai-agent.git
cd factverse-ai-agent
```

### 2. Build Images

```bash
# Build all 3 images (parallel)
cd backend && docker build -t jiel/factverse-backend:latest . &
cd frontend && docker build -t jiel/factverse-frontend:latest . &
cd ai-engine && docker build -t jiel/factverse-ai-engine:latest . &
wait
```

### 3. Start Infrastructure

```bash
cd deploy/
docker compose up -d factverse-db factverse-redis factverse-grafana factverse-prometheus
```

### 4. Start Application

```bash
# Backend
docker run -d --name fv-backend --network deploy_default \
  -p 8080:8080 -v /data/evidence:/data/evidence \
  --restart unless-stopped \
  -e DB_HOST=factverse-db \
  -e DB_USER=postgres \
  -e DB_PASSWORD=<YOUR_DB_PASSWORD> \
  -e REDIS_HOST=factverse-redis \
  -e REDIS_PASSWORD=<YOUR_REDIS_PASSWORD> \
  -e AI_ENGINE_URL=http://fv-ai-engine:8000 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e JWT_SECRET=<YOUR_JWT_SECRET_64_CHARS> \
  -e CORS_ALLOWED_ORIGINS=https://yourdomain.com \
  jiel/factverse-backend:latest

# AI Engine
docker run -d --name fv-ai-engine --network deploy_default \
  -p 8000:8000 --restart unless-stopped \
  -e DB_HOST=factverse-db \
  -e DB_USER=postgres \
  -e DB_PASSWORD=<YOUR_DB_PASSWORD> \
  -e SIMULATOR_ENABLED=true \
  jiel/factverse-ai-engine:latest

# Frontend (start AFTER ai-engine is up — nginx upstream dependency)
docker run -d --name fv-frontend --network deploy_default \
  -p 3001:80 --restart unless-stopped \
  jiel/factverse-frontend:latest
```

### 5. Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;  # For AI optimization endpoints
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Actuator (health only, block others)
    location /actuator/health {
        proxy_pass http://localhost:8080;
    }
    location /actuator/ {
        return 403;
    }
}
```

## Environment Variables

### Backend (Required)
| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `factverse-db` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | (set securely) |
| `REDIS_HOST` | Redis host | `factverse-redis` |
| `REDIS_PASSWORD` | Redis password | (set securely) |
| `AI_ENGINE_URL` | AI Engine base URL | `http://fv-ai-engine:8000` |
| `SPRING_PROFILES_ACTIVE` | Spring profile | `prod` |
| `JWT_SECRET` | JWT signing key (64+ chars) | (generate with `openssl rand -base64 48`) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins | `https://yourdomain.com` |

### Backend (Optional)
| Variable | Default | Description |
|----------|---------|-------------|
| `PROTOCOL_ENABLED` | `false` | Enable Modbus/BACnet protocol gateway |
| `DEMO_MODE` | `false` | Freeze simulator, disable auto-cleanup |

### AI Engine
| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host (for simulator direct writes) |
| `SIMULATOR_ENABLED` | `false` | Enable continuous data simulator |
| `API_KEY` | (empty) | API key for endpoint protection |

## Monitoring

### Health Checks
```bash
# All services
curl http://localhost:8080/actuator/health  # Backend
curl http://localhost:8000/ai/health        # AI Engine
curl http://localhost:3001/                  # Frontend
```

### Grafana
Access at `http://localhost:3000` (admin/admin).
Pre-configured dashboards for system metrics.

### Automated Monitoring
```bash
# Add to crontab
*/5 * * * * /data/apps/factverse-ai-agent/deploy/healthcheck.sh >> /var/log/factverse-health.log 2>&1
```

## Backup & Recovery

### Daily Backup (automated)
```bash
# Setup
sudo cp deploy/db-backup.sh /data/apps/
sudo chmod +x /data/apps/db-backup.sh
echo "0 3 * * * /data/apps/db-backup.sh >> /data/backups/backup.log 2>&1" | sudo crontab -
```

### Manual Backup
```bash
docker exec factverse-db pg_dump -U postgres -d factverse | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore
```bash
gunzip -c backup_20260216.sql.gz | docker exec -i factverse-db psql -U postgres -d factverse
```

## Updating

```bash
cd /data/apps/factverse-ai-agent
git pull

# Rebuild changed services
cd backend && docker build -t jiel/factverse-backend:latest .
docker stop fv-backend && docker rm fv-backend
# Re-run docker run command from step 4

# For frontend-only changes
cd frontend && docker build -t jiel/factverse-frontend:latest .
docker stop fv-frontend && docker rm fv-frontend
docker run -d --name fv-frontend --network deploy_default -p 3001:80 --restart unless-stopped jiel/factverse-frontend:latest
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check `docker logs fv-backend` — usually migration or bean conflict |
| Frontend shows stale content | `docker build --no-cache` to bypass Docker cache |
| AI Engine slow startup | Normal — ML dependencies load ~30s |
| 429 Too Many Requests | Rate limit is 600/min global. Dashboard fires ~50 parallel calls on load. |
| CORS errors | Verify `CORS_ALLOWED_ORIGINS` includes your domain |
| WebSocket disconnect | Check nginx `proxy_read_timeout` and `Connection "upgrade"` header |
