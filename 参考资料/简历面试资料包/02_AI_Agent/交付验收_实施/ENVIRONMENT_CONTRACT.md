# FactVerse Production Environment Contract

> This file records the current production assumptions that deploy scripts depend on.
>
> It intentionally avoids storing secret values.

## 1. Host and paths

- Production host: `factverse.ai`
- Primary application path on host: `/data/apps/factverse-ai-agent`
- GitHub Actions runner: self-hosted on the production host

## 2. Public entrypoints

- `https://factverse.ai/` -> frontend
- `https://factverse.ai/api/` -> backend
- `https://factverse.ai/ws` -> backend websocket endpoint
- `https://factverse.ai/ai/` -> AI engine

## 3. Host nginx contracts

Expected files:

- `/etc/nginx/conf.d/factverse.conf`
- `/etc/nginx/conf.d/backend-upstream.conf`

Host nginx responsibilities:

- `/` -> `http://localhost:3001`
- `/api/` -> `http://backend`
- `/ws` -> `http://backend`
- `/ai/` -> `http://localhost:8000`

`backend-upstream.conf` is managed by blue/green deploy and should point to either:

- `localhost:8080` (blue)
- `localhost:8081` (green)

## 4. Docker networks

Required networks:

- `factverse-ai-agent_default`
- `deploy_default`

Expected network intent:

- data plane containers (`fv-postgres`, `fv-redis`, backend slots) on `factverse-ai-agent_default`
- edge plane containers (`fv-frontend`, `fv-ai-engine`, backend active slot alias) on `deploy_default`

## 5. Container naming contract

Frontend:

- `fv-frontend`

Backend:

- `fv-backend-blue`
- `fv-backend-green`

AI engine:

- `fv-ai-engine`

Infra:

- `fv-postgres`
- `fv-redis`

## 6. Frontend proxy contract

The frontend container must not assume a stable backend container name.

Current required frontend nginx behavior:

- `/api/` -> `http://host.docker.internal/api/`
- `/ws` -> `http://host.docker.internal/ws`

Current required compose behavior:

- `extra_hosts: host.docker.internal:host-gateway`

## 7. Backend deployment contract

Backend production deploy is blue/green only.

Required behavior:

- active slot recorded in `/tmp/factverse-active-slot`
- inactive slot starts on the alternate port
- new slot is connected to `deploy_default` with alias `fv-backend`
- nginx upstream is switched only after health passes
- old slot remains briefly available for rollback

## 8. Secret contract

This file must never contain the actual values.

Current runtime expectations:

- `DB_PASSWORD` may be injected by workflow secrets or fall back to local default
- `REDIS_PASSWORD` may be injected by workflow secrets or omitted if Redis is not password-protected in current production
- JWT config currently reads `JWT_SECRET`
- Current application keeps a base64 fallback in `application.yml` for production compatibility

Target long-term state:

- explicitly inject `JWT_SECRET`
- avoid relying on fallback defaults in production
- keep documentation and deploy scripts aligned before removing compatibility paths

## 9. Minimum post-deploy truth checks

A deployment is not considered successful until these pass:

```bash
curl -I https://factverse.ai/
curl -I https://factverse.ai/api/v1/alerts?size=1
curl -i https://factverse.ai/ws/info?t=$(date +%s)
bash deploy/prod-verify.sh
```

Expected:

- `/` -> `200`
- `/api` -> `401` or `200`, never `502`
- `/ws/info` -> `200`
- authenticated alerts endpoint -> `200`
