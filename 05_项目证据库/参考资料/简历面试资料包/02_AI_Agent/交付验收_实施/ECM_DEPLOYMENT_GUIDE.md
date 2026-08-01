# [ARCHIVED] ECM Phase 5/6/7/9 Deployment Guide

> ⚠️ **Archived deployment guide — historical ECM rollout reference only.**
>
> Do not use this file as the current production deployment procedure.
>
> Current deployment source of truth:
> - `docs/DEPLOYMENT_SOP.md`
> - `deploy/ENVIRONMENT_CONTRACT.md`
> - `deploy/preflight-prod.sh`
> - `deploy/prod-backend.sh`
> - `deploy/prod-frontend.sh`
> - `deploy/prod-ai-engine.sh`
> - `deploy/prod-verify.sh`


## Overview

This guide covers deployment of ECM (Enterprise Content Management) Phase 5/6/7/9 features:

- **Phase 5**: Mobile Worker Support (Photo Upload, Offline, AR)
- **Phase 6**: AI Advisor Enhancement (RAG, New Tools)
- **Phase 7**: Compliance Pack (Evidence Generation, Audit)
- **Phase 9**: Agent-First Infrastructure (Knowledge Graph, SOP Execution)

## Prerequisites

- PostgreSQL 12+ with pgvector extension
- Java 17+
- Node.js 18+
- Python 3.9+
- Docker (optional)

## Database Migration

### Step 1: Enable pgvector Extension

```sql
-- Connect to database
psql -U postgres -d factverse

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 2: Run Migrations

```bash
# Backend will auto-run migrations on startup
# Or manually:
cd backend
./gradlew flywayMigrate
```

**Migration Files**:
- `V117__agent_knowledge_graph.sql` - Knowledge graph tables
- `V118__compliance_pack_tables.sql` - Compliance pack tables

### Step 3: Verify Tables

```sql
-- Check agent tables
\dt agent_*

-- Check compliance tables
\dt compliance_*

-- Should see:
-- agent_knowledge_node
-- agent_knowledge_edge
-- agent_executable_sop
-- agent_execution_log
-- agent_experience
-- agent_maintenance_record
-- compliance_pack
-- compliance_pack_document
-- compliance_pack_audit
-- compliance_template
```

## Backend Deployment

### Step 1: Build

```bash
cd backend
./gradlew clean build -x test
```

### Step 2: Configure Environment Variables

```bash
# .env or environment
export DATABASE_URL=jdbc:postgresql://localhost:5432/factverse
export DATABASE_USERNAME=factverse
export DATABASE_PASSWORD=your_password
export JWT_SECRET=your_jwt_secret

# AI Engine URL (for RAG)
export AI_ENGINE_URL=http://localhost:8000
```

### Step 3: Start Backend

```bash
# Local
java -jar build/libs/factverse-backend.jar

# Docker
docker run -d \
  --name fv-backend \
  --network factverse-ai-agent_default \
  -e DATABASE_URL=jdbc:postgresql://fv-postgres:5432/factverse \
  -p 8080:8080 \
  jiel/factverse-backend:latest
```

### Step 4: Verify Endpoints

```bash
# Health check
curl http://localhost:8080/actuator/health

# Test mobile upload endpoint
curl -X POST http://localhost:8080/api/v1/ecm/mobile/upload-photo \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test compliance endpoint
curl http://localhost:8080/api/v1/ecm/compliance/templates

# Test agent API
curl http://localhost:8080/agent/v1/knowledge/equipment/EQ-001
```

## AI Engine Deployment

### Step 1: Install Dependencies

```bash
cd ai-engine
pip install -r requirements.txt
```

### Step 2: Configure

```python
# config.py
BACKEND_URL = "http://localhost:8080"
LLM_URL = "http://localhost:8000"  # Ollama or similar
EMBEDDING_MODEL = "text-embedding-3-small"
```

### Step 3: Start AI Engine

```bash
# Local
python main.py

# Docker
docker run -d \
  --name fv-ai-engine \
  --network factverse-ai-agent_default \
  -p 8000:8000 \
  jiel/factverse-ai-engine:latest
```

### Step 4: Verify RAG

```bash
# Test RAG endpoint
curl -X POST http://localhost:8000/ai/embeddings \
  -H "Content-Type: application/json" \
  -d '{"text": "test query"}'
```

## Frontend Deployment

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Configure Environment

```bash
# .env
VITE_API_BASE_URL=http://localhost:8080
VITE_AI_ENGINE_URL=http://localhost:8000
```

### Step 3: Build

```bash
npm run build
```

### Step 4: Deploy

```bash
# Local preview
npm run preview

# Nginx
cp -r dist/* /usr/share/nginx/html/

# Docker
docker run -d \
  --name fv-frontend \
  -p 3001:80 \
  jiel/factverse-frontend:latest
```

### Step 5: Verify Routes

Access the following routes:
- `/ecm/mobile/upload` - Mobile photo upload
- `/ecm/compliance` - Compliance pack management

## Docker Compose (Full Stack)

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg12
    environment:
      POSTGRES_DB: factverse
      POSTGRES_USER: factverse
      POSTGRES_PASSWORD: factverse123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    image: jiel/factverse-backend:latest
    depends_on:
      - postgres
    environment:
      DATABASE_URL: jdbc:postgresql://postgres:5432/factverse
      DATABASE_USERNAME: factverse
      DATABASE_PASSWORD: factverse123
      JWT_SECRET: your_secret_here
    ports:
      - "8080:8080"

  ai-engine:
    image: jiel/factverse-ai-engine:latest
    depends_on:
      - backend
    ports:
      - "8000:8000"

  frontend:
    image: jiel/factverse-frontend:latest
    depends_on:
      - backend
    ports:
      - "3001:80"

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

## Post-Deployment Verification

### 1. Database

```bash
# Check migrations applied
psql -U factverse -d factverse -c "SELECT version FROM flyway_schema_history ORDER BY version;"

# Should show V117 and V118
```

### 2. Backend APIs

```bash
# Phase 5: Mobile
curl http://localhost:8080/api/v1/ecm/mobile/sync

# Phase 7: Compliance
curl http://localhost:8080/api/v1/ecm/compliance/templates

# Phase 9: Agent
curl http://localhost:8080/agent/v1/knowledge/equipment/test
```

### 3. AI Tools

```python
# Test in Python
from advisor.tool_executor import execute_tool

# Phase 6: RAG search
result = await execute_tool("search_documents", {
    "query": "compressor maintenance",
    "use_rag": True
})
print(result.summary)

# Phase 6: New tools
result = await execute_tool("extract_maintenance_record", {
    "document_id": 1
})
print(result.summary)
```

### 4. Frontend

Navigate to:
- http://localhost:3001/ecm/mobile/upload
- http://localhost:3001/ecm/compliance

## Rollback

### Database Rollback

```bash
# Rollback V118
psql -U factverse -d factverse << EOF
DROP TABLE IF EXISTS compliance_pack_audit CASCADE;
DROP TABLE IF EXISTS compliance_pack_document CASCADE;
DROP TABLE IF EXISTS compliance_pack CASCADE;
DROP TABLE IF EXISTS compliance_template CASCADE;
DELETE FROM flyway_schema_history WHERE version = '118';
EOF

# Rollback V117
psql -U factverse -d factverse << EOF
DROP TABLE IF EXISTS agent_maintenance_record CASCADE;
DROP TABLE IF EXISTS agent_experience CASCADE;
DROP TABLE IF EXISTS agent_execution_log CASCADE;
DROP TABLE IF EXISTS agent_executable_sop CASCADE;
DROP TABLE IF EXISTS agent_knowledge_edge CASCADE;
DROP TABLE IF EXISTS agent_knowledge_node CASCADE;
DELETE FROM flyway_schema_history WHERE version = '117';
EOF
```

### Application Rollback

```bash
# Docker
docker-compose down
docker tag jiel/factverse-backend:latest jiel/factverse-backend:backup
docker tag jiel/factverse-backend:previous jiel/factverse-backend:latest
docker-compose up -d
```

## Monitoring

### Logs

```bash
# Backend
docker logs fv-backend -f

# AI Engine
docker logs fv-ai-engine -f

# Frontend
docker logs fv-frontend -f
```

### Metrics

- Backend: http://localhost:8080/actuator/metrics
- AI Engine: http://localhost:8000/metrics

## Known Issues

1. **pgvector not installed**: Run `CREATE EXTENSION vector;`
2. **RAG fails**: Ensure AI Engine is running and accessible
3. **Frontend 404 on new routes**: Rebuild frontend with `npm run build`

## Support

- Documentation: `/docs/ECM_3.0_Agent_First_PRD.md`
- Memory: `/Users/opal/.openclaw/workspace/memory/2026-02-21.md`
- Commits: 6a9c9ff0, dbe94c38, d0e344c2, d624b0bc
