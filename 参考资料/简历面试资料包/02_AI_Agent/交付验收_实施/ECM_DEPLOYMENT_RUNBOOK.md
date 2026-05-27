# [ARCHIVED] ECM Phase 5/6/7/9 - Production Deployment Runbook

> ⚠️ **Archived runbook — historical ECM release record only.**
>
> Do not use this file for current production deployment.
>
> Current deployment source of truth:
> - `docs/DEPLOYMENT_SOP.md`
> - `deploy/ENVIRONMENT_CONTRACT.md`
> - `deploy/preflight-prod.sh`
> - `deploy/prod-backend.sh`
> - `deploy/prod-frontend.sh`
> - `deploy/prod-ai-engine.sh`
> - `deploy/prod-verify.sh`


## Document Control

| Item | Details |
|------|---------|
| **Version** | 1.0 |
| **Date** | 2026-02-21 |
| **Author** | MacProBot (DE #5) |
| **Status** | Ready for Production |
| **Phases** | 5, 6, 7, 9 |

---

## Pre-Deployment Checklist

### 1. Code Review

- [ ] All commits reviewed and approved
- [ ] No critical security vulnerabilities
- [ ] Code merged to main branch
- [ ] Latest commit: `31d50eb7` (or later)

### 2. Environment Verification

- [ ] Production server accessible (`ssh factverse`)
- [ ] Database backup completed
- [ ] Sufficient disk space (min 5GB)
- [ ] Docker images built and available
- [ ] Environment variables documented

### 3. Backup Procedures

```bash
# SSH to production server
ssh factverse

# Create database backup
docker exec fv-postgres pg_dump -U factverse factverse > /data/backups/pre_ecm_deployment_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh /data/backups/pre_ecm_deployment_*.sql

# Backup current docker-compose.yml
cp /data/apps/factverse-ai-agent/docker-compose.yml /data/apps/factverse-ai-agent/docker-compose.yml.backup
```

- [ ] Database backup completed
- [ ] Configuration files backed up

---

## Deployment Steps

### Step 1: Pull Latest Code

**Time Estimate**: 2 minutes

```bash
# SSH to production server
ssh factverse

# Navigate to app directory
cd /data/apps/factverse-ai-agent

# Pull latest code
git fetch origin
git checkout main
git pull origin main

# Verify latest commit
git log --oneline -1
# Should show: 31d50eb7 docs: add ECM project summary + update memory files
```

- [ ] Code pulled successfully
- [ ] Correct commit verified

---

### Step 2: Database Migration

**Time Estimate**: 5 minutes

**Critical**: This step will modify the database schema

```bash
# Check current migration status
docker exec fv-backend ./flyway info

# Expected: V116 should be the latest applied migration

# Restart backend to trigger migrations
docker restart fv-backend

# Wait for backend to start (check logs)
docker logs -f fv-backend --tail 100

# Look for:
# "Successfully applied 3 migrations to schema"
# "Migrations: V117, V118, V119"
```

**Verify Migrations**:

```bash
# Connect to database
docker exec -it fv-postgres psql -U factverse -d factverse

# Check migration history
SELECT version, description, installed_on 
FROM flyway_schema_history 
WHERE version IN ('117', '118', '119')
ORDER BY version;

# Expected: 3 rows

# Check tables exist
\dt agent_*
\dt compliance_*

# Expected: 6 agent_* tables and 4 compliance_* tables

# Check demo data
SELECT COUNT(*) FROM agent_knowledge_node;  -- Should be 11
SELECT COUNT(*) FROM compliance_template;    -- Should be 3

\q
```

- [ ] Backend restarted successfully
- [ ] V117, V118, V119 migrations applied
- [ ] All 10 tables created
- [ ] Demo data present

---

### Step 3: Rebuild Backend Container

**Time Estimate**: 3 minutes

```bash
cd /data/apps/factverse-ai-agent

# Build new backend image
docker build -t jiel/factverse-backend:latest -f backend/Dockerfile backend/

# Stop current backend
docker stop fv-backend

# Remove old container
docker rm fv-backend

# Start new backend
docker run -d \
  --name fv-backend \
  --network factverse-ai-agent_default \
  -e DATABASE_URL=jdbc:postgresql://fv-postgres:5432/factverse \
  -e DATABASE_USERNAME=factverse \
  -e DATABASE_PASSWORD=factverse123 \
  -e JWT_SECRET=${JWT_SECRET} \
  -e AI_ENGINE_URL=http://fv-ai-engine:8000 \
  -p 8080:8080 \
  --restart unless-stopped \
  jiel/factverse-backend:latest

# Connect to second network (CRITICAL!)
docker network connect deploy_default fv-backend

# Verify backend is running
docker ps | grep fv-backend

# Check logs
docker logs -f fv-backend --tail 50
```

- [ ] Backend image built
- [ ] Container started
- [ ] Connected to both networks
- [ ] No errors in logs

---

### Step 4: Rebuild AI Engine Container

**Time Estimate**: 3 minutes

```bash
cd /data/apps/factverse-ai-agent

# Build new AI engine image
docker build -t jiel/factverse-ai-engine:latest -f ai-engine/Dockerfile ai-engine/

# Stop current AI engine
docker stop fv-ai-engine

# Remove old container
docker rm fv-ai-engine

# Start new AI engine
docker run -d \
  --name fv-ai-engine \
  --network factverse-ai-agent_default \
  -e BACKEND_URL=http://fv-backend:8080 \
  -e LLM_URL=http://localhost:11434 \
  -p 8000:8000 \
  --restart unless-stopped \
  jiel/factverse-ai-engine:latest

# Verify AI engine is running
docker ps | grep fv-ai-engine

# Check logs
docker logs -f fv-ai-engine --tail 50
```

- [ ] AI engine image built
- [ ] Container started
- [ ] No errors in logs

---

### Step 5: Rebuild Frontend Container

**Time Estimate**: 2 minutes

```bash
cd /data/apps/factverse-ai-agent

# Build new frontend image
docker build -t jiel/factverse-frontend:latest -f frontend/Dockerfile frontend/

# Stop current frontend
docker stop fv-frontend

# Remove old container
docker rm fv-frontend

# Start new frontend
docker run -d \
  --name fv-frontend \
  --network factverse-ai-agent_default \
  -p 3001:80 \
  --restart unless-stopped \
  jiel/factverse-frontend:latest

# Verify frontend is running
docker ps | grep fv-frontend
```

- [ ] Frontend image built
- [ ] Container started
- [ ] No errors

---

### Step 6: Verify Deployment

**Time Estimate**: 5 minutes

#### Backend Health Check

```bash
# Check backend health
curl http://localhost:8080/actuator/health

# Expected: {"status":"UP"}
```

- [ ] Backend health check passes

#### API Endpoint Tests

```bash
# Test Phase 5 endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/ecm/mobile/sync

# Expected: HTTP 200 with documents array

# Test Phase 7 endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/ecm/compliance/templates

# Expected: HTTP 200 with 3 templates

# Test Phase 9 endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/agent/v1/knowledge/equipment/EQ-COMP-001

# Expected: HTTP 200 with knowledge data
```

- [ ] Phase 5 endpoint works
- [ ] Phase 7 endpoint works
- [ ] Phase 9 endpoint works

#### AI Engine Health Check

```bash
# Check AI engine health
curl http://localhost:8000/health

# Expected: {"status":"healthy"}
```

- [ ] AI engine health check passes

#### Frontend Access

```bash
# Check frontend loads
curl -I http://localhost:3001

# Expected: HTTP 200 OK

# Check new routes
curl -I http://localhost:3001/ecm/mobile/upload
curl -I http://localhost:3001/ecm/compliance

# Expected: HTTP 200 OK
```

- [ ] Frontend loads successfully
- [ ] Mobile upload route accessible
- [ ] Compliance route accessible

---

## Post-Deployment Tasks

### Step 7: Run Smoke Tests

**Time Estimate**: 10 minutes

Execute the smoke test checklist:

```bash
# On local machine, run automated smoke tests
./scripts/run_ecm_smoke_tests.sh production

# Or manually test critical endpoints (see ECM_SMOKE_TEST_CHECKLIST.md)
```

**Critical Tests**:
- [ ] Test 1: Mobile Photo Upload
- [ ] Test 6: Generate Compliance Pack
- [ ] Test 12: Execute SOP (Dry Run)
- [ ] Test 16: RAG-Enhanced Search

- [ ] All smoke tests pass

---

### Step 8: Monitor Logs

**Time Estimate**: 5 minutes

```bash
# Monitor backend logs
docker logs -f fv-backend --tail 100

# Look for:
# - No ERROR level logs
# - Successful API requests
# - Database queries completing

# Monitor AI engine logs
docker logs -f fv-ai-engine --tail 100

# Look for:
# - No ERROR level logs
# - Successful tool executions
# - No timeout errors
```

- [ ] No critical errors in backend logs
- [ ] No critical errors in AI engine logs

---

### Step 9: Update Documentation

- [ ] Update system documentation with new endpoints
- [ ] Update API documentation
- [ ] Notify team of new features
- [ ] Update changelog

---

### Step 10: Notify Stakeholders

**Email Template**:

```
Subject: ECM Phase 5/6/7/9 Deployed to Production

Hi Team,

ECM (Enterprise Content Management) Phase 5/6/7/9 has been successfully deployed to production.

New Features:
- Mobile Worker Support (Photo Upload, Offline, AR)
- AI-Enhanced Document Search with RAG
- Compliance Pack Generation (ISO 14644, SEMI S2, FDA)
- Agent-First API for Automation

Deployment Details:
- Version: 1.0.0
- Commit: 31d50eb7
- Date: 2026-02-21

Documentation:
- API Docs: http://docs.factverse.ai/ecm-api
- Deployment Guide: http://docs.factverse.ai/ecm-deployment

Please report any issues to the dev team.

Thanks,
MacProBot (DE #5)
```

- [ ] Stakeholders notified

---

## Rollback Procedure

**Use this if deployment fails or critical issues found**

### Quick Rollback

**Time Estimate**: 5 minutes

```bash
# Stop new containers
docker stop fv-backend fv-ai-engine fv-frontend

# Remove new containers
docker rm fv-backend fv-ai-engine fv-frontend

# Restore database backup
docker exec -i fv-postgres psql -U factverse factverse < /data/backups/pre_ecm_deployment_*.sql

# Start old containers (using previous image tags)
# You should have previous image tags saved
docker run -d --name fv-backend ... jiel/factverse-backend:previous
docker network connect deploy_default fv-backend

docker run -d --name fv-ai-engine ... jiel/factverse-ai-engine:previous
docker run -d --name fv-frontend ... jiel/factverse-frontend:previous

# Verify rollback
curl http://localhost:8080/actuator/health
```

- [ ] Rollback completed
- [ ] System restored to previous state

---

## Troubleshooting

### Issue 1: Migration Fails

**Symptoms**: Backend fails to start, migration errors in logs

**Solution**:
```bash
# Check migration status
docker exec fv-backend ./flyway info

# If migrations failed, check error details
docker logs fv-backend | grep -i migration

# Manual migration repair (if needed)
docker exec fv-backend ./flyway repair

# Restart backend
docker restart fv-backend
```

---

### Issue 2: pgvector Extension Missing

**Symptoms**: Database errors about vector type

**Solution**:
```bash
# Connect to database
docker exec -it fv-postgres psql -U factverse -d factverse

# Install pgvector
CREATE EXTENSION IF NOT EXISTS vector;

# Verify
\dx vector

\q
```

---

### Issue 3: Network Connectivity Issues

**Symptoms**: Backend can't reach database or AI engine

**Solution**:
```bash
# Check networks
docker network ls

# Verify backend is on both networks
docker inspect fv-backend | grep -A 10 Networks

# If missing, connect
docker network connect factverse-ai-agent_default fv-backend
docker network connect deploy_default fv-backend

# Restart backend
docker restart fv-backend
```

---

### Issue 4: RAG Not Working

**Symptoms**: AI search returns empty results or errors

**Solution**:
```bash
# Check AI engine logs
docker logs fv-ai-engine | grep -i error

# Verify AI engine can reach backend
docker exec fv-ai-engine curl http://fv-backend:8080/actuator/health

# Check LLM availability
docker exec fv-ai-engine curl http://localhost:11434/api/tags

# Restart AI engine
docker restart fv-ai-engine
```

---

## Success Criteria

- [ ] All containers running without errors
- [ ] Database migrations applied successfully
- [ ] All 22 new API endpoints accessible
- [ ] Frontend pages load correctly
- [ ] Smoke tests pass
- [ ] No critical errors in logs
- [ ] Performance within acceptable limits

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Developer | MacProBot (DE #5) | ____________ | ____________ |
| DevOps | ____________ | ____________ | ____________ |
| QA | ____________ | ____________ | ____________ |
| Manager | ____________ | ____________ | ____________ |

---

## Appendix A: Environment Variables

### Backend

```bash
DATABASE_URL=jdbc:postgresql://fv-postgres:5432/factverse
DATABASE_USERNAME=factverse
DATABASE_PASSWORD=factverse123
JWT_SECRET=your_jwt_secret_here
AI_ENGINE_URL=http://fv-ai-engine:8000
```

### AI Engine

```bash
BACKEND_URL=http://fv-backend:8080
LLM_URL=http://localhost:11434
```

---

## Appendix B: Useful Commands

```bash
# View all containers
docker ps -a

# View container logs
docker logs -f fv-backend --tail 100

# Execute command in container
docker exec -it fv-backend bash

# Check container resource usage
docker stats fv-backend fv-ai-engine fv-frontend

# Restart all containers
docker restart fv-backend fv-ai-engine fv-frontend

# Check disk usage
docker system df
```

---

## Appendix C: Contact Information

- **Lead Developer**: MacProBot (DE #5) - Discord
- **DevOps**: AzureBot (DE #3) - Discord
- **On-call**: Jie - jie@datamesh.com

---

**Document Version**: 1.0

**Last Updated**: 2026-02-21

**Next Review**: 2026-03-21
