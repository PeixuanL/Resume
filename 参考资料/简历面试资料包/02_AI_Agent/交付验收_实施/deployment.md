# FactVerse AI Agent 部署指南

> 面向运维/管理员的正式部署文档（简体中文）。
>
> 详细运维 Runbook 请同时参考：`docs/DEPLOYMENT_SOP.md`。

## 1. 适用范围

本文档覆盖：

- `factverse.ai` 生产环境部署
- `sg.factverse.ai` 预发布环境部署
- backend / frontend / ai-engine 分组件发布
- 发布后验证
- 回滚与故障排查

如果本文档与以下文件冲突，以脚本为准，并应同步修正文档：

- `.github/workflows/deploy.yml`
- `deploy/blue-green-be.sh`
- `deploy/deploy-fe.sh`
- `deploy/docker-compose-frontend.yml`
- `frontend/nginx.conf`

---

## 2. 当前生产架构

### 2.1 入口链路

```text
用户请求
  -> 宿主机 nginx :443
  -> localhost:3001         前端 /
  -> backend upstream       /api 和 /ws
  -> localhost:8000         /ai
```

### 2.2 容器与网络

- `fv-frontend`
  - 端口：`3001:80`
  - 网络：`deploy_default`
- `fv-backend-blue`
  - 端口：`8080:8080`
  - 网络：`factverse-ai-agent_default`
  - 另外连接到 `deploy_default`
- `fv-backend-green`
  - 端口：`8081:8080`
  - 网络：`factverse-ai-agent_default`
  - 另外连接到 `deploy_default`
- `fv-ai-engine`
  - 端口：`8000:8000`
- `fv-postgres`
- `fv-redis`

### 2.3 关键设计说明

backend 使用 **blue/green**：

- blue -> `8080`
- green -> `8081`
- 宿主机 nginx 通过 `/etc/nginx/conf.d/backend-upstream.conf` 指向当前活动槽位

frontend 容器内 nginx **不能再直接代理到 `fv-backend:8080`**，而是必须走：

- `/api` -> `http://host.docker.internal/api/`
- `/ws` -> `http://host.docker.internal/ws`

原因：backend 是蓝绿双槽，不存在一个稳定、永久有效的单容器名可供 frontend 依赖。

---

## 3. 标准发布方式（推荐）

推荐使用 GitHub Actions：

```bash
gh workflow run deploy.yml --ref main -f components=backend -f environment=production
gh workflow run deploy.yml --ref main -f components=frontend -f environment=production
gh workflow run deploy.yml --ref main -f components=ai-engine -f environment=production
```

查看状态：

```bash
gh run list --workflow deploy.yml --branch main --limit 5
gh run watch <run-id> --exit-status
```

环境规则：

- `main` -> production
- `develop` -> staging
- `workflow_dispatch` 可手动指定环境和组件

---

## 4. 手工应急发布

仅在 workflow 不可用或需要排障时使用。

推荐优先使用稳定入口脚本：

```bash
cd /data/apps/factverse-ai-agent
bash deploy/preflight-prod.sh backend
bash deploy/prod-backend.sh

bash deploy/preflight-prod.sh frontend
bash deploy/prod-frontend.sh

bash deploy/preflight-prod.sh ai-engine
bash deploy/prod-ai-engine.sh

bash deploy/prod-verify.sh
```

底层脚本仍然保留，但日常运维优先用上面的 `prod-*` 固定入口。

### 4.1 Backend

```bash
cd /data/apps/factverse-ai-agent
bash deploy/blue-green-be.sh
```

回滚：

```bash
bash deploy/blue-green-be.sh --rollback
```

### 4.2 Frontend

```bash
cd /data/apps/factverse-ai-agent
bash deploy/deploy-fe.sh
```

### 4.3 AI Engine

```bash
sudo docker rm -f fv-ai-engine || true
sudo docker run -d --name fv-ai-engine \
  --network deploy_default -p 8000:8000 \
  --env-file /data/apps/factverse-ai-agent/ai-engine/.env \
  -e DB_HOST=fv-postgres -e DEMO_MODE=true \
  --restart unless-stopped \
  factverse-ai-engine:latest
sudo docker network connect factverse-ai-agent_default fv-ai-engine || true
```

---

## 5. 环境变量与密钥约定

### 5.1 Backend

当前生产发布会注入：

- `DB_HOST=fv-postgres`
- `DB_USER=postgres`
- `DB_PASSWORD=${DB_PASSWORD:-postgres}`
- `REDIS_HOST=fv-redis`
- 可选 `REDIS_PASSWORD`
- `AI_ENGINE_URL=http://fv-ai-engine:8000`
- `AI_ENGINE_API_KEY=demo-key`
- `SPRING_PROFILES_ACTIVE=prod`
- `CORS_ALLOWED_ORIGINS=https://factverse.ai,http://localhost:3001`
- `SERVICE_PASSWORD=admin123`

### 5.2 JWT 说明（很重要）

当前代码真实读取的是：

- `JWT_SECRET`

不是：

- `SECURITY_JWT_SECRET`

注意：历史日志/旧脚本里可能还出现 `SECURITY_JWT_SECRET` 字样，那是旧命名，不应再作为当前配置真相。

当前系统为了兼容生产，`application.yml` 中保留了 base64 默认 secret 作为 fallback。

**推荐长期方案：**

- 生产明确配置 `JWT_SECRET`
- 使用强随机、base64 编码值
- 等所有环境切换完成后，再考虑移除默认 fallback

---

## 6. 发布后验收清单

### 6.1 公网健康检查

```bash
curl -I https://factverse.ai/
curl -I https://factverse.ai/api/v1/alerts?size=1
curl -i https://factverse.ai/ws/info?t=$(date +%s)
```

期望：

- `/` -> `200`
- `/api/...` -> `401` 或 `200`，但不能是 `502`
- `/ws/info` -> `200`

### 6.2 登录态接口验证

```bash
curl -s -X POST https://factverse.ai/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"admin123"}'
```

拿到 `accessToken` 后验证：

```bash
curl -i https://factverse.ai/api/v1/alerts?size=200 \
  -H "Authorization: Bearer <TOKEN>"
```

期望：

- login -> `200`
- alerts -> `200`

### 6.3 页面验收

至少打开并强刷这些页面：

- `https://factverse.ai/pdm/equipment/84`
- `https://factverse.ai/modules/hvacvav/overview?scenario=weak_response`

检查：

- 不再出现 `/api/v1/api/v1/...` 双前缀
- `alerts?size=200` 不再 `500`
- `/ws` 不再 `502`
- 控制台不再持续刷 STOMP/WebSocket failed

---

## 7. 回滚策略

### Backend

使用蓝绿回滚：

```bash
bash deploy/blue-green-be.sh --rollback
```

### Frontend / AI Engine

目前没有蓝绿脚本。推荐：

1. 重新部署上一个稳定 commit
2. 或将旧镜像重新标记为 `latest` 后再次执行部署脚本

---

## 8. 常见故障与解释

### 8.1 首页 200，但 `/api` 和 `/ws` 是 502

说明：

- frontend 正常
- backend 公网链路异常

优先排查：

- backend deploy run
- `/etc/nginx/conf.d/backend-upstream.conf`
- 当前 blue/green 槽位容器状态

### 8.2 首页 502，`fv-frontend` 一直重启

说明：通常是 frontend 容器内 nginx upstream 配错，或者部署脚本构建了旧代码。

### 8.3 登录页/业务页控制台持续刷 WebSocket failed

说明：通常不是 tenant 数据问题，而是 `/ws` 公网链路断了。因为登录后的 layout 会全局初始化 realtime。

### 8.4 Actions 日志里出现 Node 20 / Node 24 提示

这是 **提示信息**，不要默认把它当成根因。要看真正失败的步骤输出。

---

## 9. 本次事故沉淀出的硬规则

1. 不要只看 deploy 绿灯，要验证**用户报错的具体页面**。
2. `deploy/**` 变更必须能触发 workflow。
3. frontend 必须从 workflow checkout 构建，不能偷偷用宿主机旧 repo。
4. frontend nginx 不要依赖不稳定的 backend 容器名。
5. 删除默认 secret 之前，必须确认生产已经完全迁移到显式 env。
