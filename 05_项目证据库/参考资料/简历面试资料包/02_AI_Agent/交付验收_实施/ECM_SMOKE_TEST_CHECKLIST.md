# ECM Phase 5/6/7/9 - Smoke Test Checklist

## Pre-Test Requirements

- [ ] Backend running on port 8080
- [ ] AI Engine running on port 8000
- [ ] Frontend running on port 3001
- [ ] PostgreSQL running with pgvector extension
- [ ] Demo user credentials available (admin/admin123)

---

## Phase 5: Mobile Worker Support

### Test 1: Mobile Photo Upload

**Endpoint**: `POST /api/v1/ecm/mobile/upload-photo`

```bash
# Test photo upload with GPS
curl -X POST http://localhost:8080/api/v1/ecm/mobile/upload-photo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test_photo.jpg" \
  -F "equipmentId=101" \
  -F "latitude=1.3521" \
  -F "longitude=103.8198" \
  -F "description=Smoke test photo" \
  -F "tags=test,smoke"
```

**Expected Result**:
- [ ] HTTP 201 Created
- [ ] Response contains document ID
- [ ] Document type is "PHOTO"
- [ ] Classification is "INTERNAL"

---

### Test 2: Offline Cache

**Endpoint**: `POST /api/v1/ecm/mobile/offline-cache`

```bash
# Mark documents for offline
curl -X POST http://localhost:8080/api/v1/ecm/mobile/offline-cache \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "[1, 2, 3]"
```

**Expected Result**:
- [ ] HTTP 200 OK
- [ ] Response contains "marked" count
- [ ] Count equals number of documents

---

### Test 3: Sync Offline

**Endpoint**: `GET /api/v1/ecm/mobile/sync`

```bash
# Sync offline documents
curl -X GET http://localhost:8080/api/v1/ecm/mobile/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result**:
- [ ] HTTP 200 OK
- [ ] Response contains "documents" array
- [ ] Response contains "sync_time"

---

### Test 4: AR Overlay

**Endpoint**: `GET /api/v1/ecm/mobile/ar/equipment/1/overlay`

```bash
# Get AR overlay data
curl -X GET http://localhost:8080/api/v1/ecm/mobile/ar/equipment/1/overlay \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result**:
- [ ] HTTP 200 OK
- [ ] Response contains "equipment" object
- [ ] Response contains "documents" array

---

## Phase 7: Compliance Pack

### Test 5: List Templates

**Endpoint**: `GET /api/v1/ecm/compliance/templates`

```bash
# List compliance templates
curl -X GET http://localhost:8080/api/v1/ecm/compliance/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result**:
- [ ] HTTP 200 OK
- [ ] Response contains array of templates
- [ ] Templates include ISO 14644, SEMI S2, FDA

---

### Test 6: Generate Pack

**Endpoint**: `POST /api/v1/ecm/compliance/generate-pack`

```bash
# Generate compliance pack
curl -X POST http://localhost:8080/api/v1/ecm/compliance/generate-pack \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": 1,
    "periodStart": "2026-01-01T00:00:00Z",
    "periodEnd": "2026-01-31T23:59:59Z"
  }'
```

**Expected Result**:
- [ ] HTTP 201 Created
- [ ] Response contains pack ID
- [ ] Status is "GENERATED"
- [ ] Document count > 0

---

### Test 7: Get Pack

**Endpoint**: `GET /api/v1/ecm/compliance/packs/{id}`

```bash
# Get pack details (use ID from Test 6)
curl -X GET http://localhost:8080/api/v1/ecm/compliance/packs/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result**:
- [ ] HTTP 200 OK
- [ ] Response contains pack details
- [ ] Documents array is populated

---

### Test 8: Audit Trail

**Endpoint**: `GET /api/v1/ecm/compliance/packs/{id}/audit-trail`

```bash
# Get audit trail
curl -X GET http://localhost:8080/api/v1/ecm/compliance/packs/1/audit-trail \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result**:
- [ ] HTTP 200 OK
- [ ] Response contains audit entries
- [ ] At least "GENERATED" entry exists

---

## Phase 9: Agent-First API

### Test 9: Get Entity Knowledge

**Endpoint**: `GET /agent/v1/knowledge/equipment/EQ-COMP-001`

```bash
# Get equipment knowledge
curl -X GET http://localhost:8080/agent/v1/knowledge/equipment/EQ-COMP-001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result**:
- [ ] HTTP 200 OK
- [ ] entityType is "equipment"
- [ ] entityId is "EQ-COMP-001"
- [ ] found is true or false (demo data dependent)

---

### Test 10: Semantic Query

**Endpoint**: `POST /agent/v1/knowledge/query`

```bash
# Semantic query
curl -X POST http://localhost:8080/agent/v1/knowledge/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "compressor maintenance",
    "topK": 5
  }'
```

**Expected Result**:
- [ ] HTTP 200 OK
- [ ] Response contains "results" array
- [ ] Results have relevanceScore

---

### Test 11: Graph Query

**Endpoint**: `POST /agent/v1/knowledge/graph/query`

```bash
# Graph traversal query
curl -X POST http://localhost:8080/agent/v1/knowledge/graph/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startNode": "EQUIPMENT:EQ-COMP-001",
    "relationship": "has_sop"
  }'
```

**Expected Result**:
- [ ] HTTP 200 OK
- [ ] Response contains "nodes" array
- [ ] Response contains "edges" array

---

### Test 12: Execute SOP (Dry Run)

**Endpoint**: `POST /agent/v1/sop/SOP-COMP-001/execute`

```bash
# Execute SOP in dry run mode
curl -X POST http://localhost:8080/agent/v1/sop/SOP-COMP-001/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "DRY_RUN",
    "context": {
      "equipment_id": "EQ-COMP-001",
      "alert_type": "HIGH_TEMPERATURE"
    }
  }'
```

**Expected Result**:
- [ ] HTTP 200 OK
- [ ] Response contains executionId
- [ ] Status is "COMPLETED" (dry run)

---

### Test 13: Get Execution Status

**Endpoint**: `GET /agent/v1/execution/{executionId}`

```bash
# Get execution status (use executionId from Test 12)
curl -X GET http://localhost:8080/agent/v1/execution/{executionId} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result**:
- [ ] HTTP 200 OK
- [ ] Response contains execution details
- [ ] Status is one of: IN_PROGRESS, COMPLETED, FAILED

---

### Test 14: Extract Maintenance Record

**Endpoint**: `POST /agent/v1/maintenance/extract`

```bash
# Extract maintenance record
curl -X POST "http://localhost:8080/agent/v1/maintenance/extract?documentId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result**:
- [ ] HTTP 200 OK
- [ ] Response contains structured data
- [ ] Confidence score is present

---

### Test 15: Get Maintenance History

**Endpoint**: `GET /agent/v1/maintenance/equipment/EQ-COMP-001`

```bash
# Get maintenance history
curl -X GET "http://localhost:8080/agent/v1/maintenance/equipment/EQ-COMP-001?months=12" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result**:
- [ ] HTTP 200 OK
- [ ] Response contains array of records
- [ ] Records have maintenanceDate

---

## Phase 6: AI Advisor Enhancement

### Test 16: RAG-Enhanced Search

**Tool**: `search_documents`

```python
# Test RAG-enhanced document search
from tool_executor import execute_tool

result = await execute_tool("search_documents", {
    "query": "compressor high temperature",
    "use_rag": True
})

print(result.summary)
```

**Expected Result**:
- [ ] Returns documents
- [ ] Contains "rag_summary" field
- [ ] Contains "rag_sources" field
- [ ] Summary is contextual and relevant

---

### Test 17: Extract Maintenance Record Tool

**Tool**: `extract_maintenance_record`

```python
# Test maintenance record extraction
result = await execute_tool("extract_maintenance_record", {
    "document_id": 1
})

print(result.summary)
```

**Expected Result**:
- [ ] Returns structured data
- [ ] Contains equipmentId
- [ ] Contains maintenanceDate
- [ ] Confidence score > 0

---

### Test 18: Analyze Spare Parts Tool

**Tool**: `analyze_spare_parts`

```python
# Test spare parts analysis
result = await execute_tool("analyze_spare_parts", {
    "equipment_type": "COMPRESSOR",
    "months": 12
})

print(result.summary)
```

**Expected Result**:
- [ ] Returns top replaced parts
- [ ] Contains stockout risks
- [ ] Contains recommendations

---

### Test 19: Recommend Training Tool

**Tool**: `recommend_training`

```python
# Test training recommendations
result = await execute_tool("recommend_training", {
    "equipment_type": "AHU",
    "user_role": "technician"
})

print(result.summary)
```

**Expected Result**:
- [ ] Returns course list
- [ ] Courses have priority levels
- [ ] Total hours calculated

---

## Database Verification

### Test 20: Check Tables Exist

```sql
-- Connect to database
psql -U factverse -d factverse

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'agent_knowledge_node',
    'agent_knowledge_edge',
    'agent_executable_sop',
    'agent_execution_log',
    'agent_experience',
    'agent_maintenance_record',
    'compliance_pack',
    'compliance_pack_document',
    'compliance_pack_audit',
    'compliance_template'
  );
```

**Expected Result**:
- [ ] All 10 tables exist
- [ ] No errors

---

### Test 21: Check Demo Data

```sql
-- Check demo data exists
SELECT COUNT(*) FROM agent_knowledge_node;  -- Should be > 0
SELECT COUNT(*) FROM agent_executable_sop;  -- Should be > 0
SELECT COUNT(*) FROM compliance_template;   -- Should be 3
SELECT COUNT(*) FROM compliance_pack;       -- Should be > 0
```

**Expected Result**:
- [ ] agent_knowledge_node has records
- [ ] agent_executable_sop has records
- [ ] compliance_template has 3 records
- [ ] compliance_pack has records

---

### Test 22: Check pgvector Indexes

```sql
-- Check vector indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('agent_knowledge_node', 'agent_experience');
```

**Expected Result**:
- [ ] Indexes on embedding columns exist
- [ ] Using ivfflat operator

---

## Frontend Smoke Tests

### Test 23: Mobile Upload Page

**URL**: `http://localhost:3001/ecm/mobile/upload`

**Steps**:
1. Navigate to mobile upload page
2. Select a photo
3. Verify GPS status indicator shows
4. Fill in equipment ID
5. Add tags
6. Submit form

**Expected Result**:
- [ ] Page loads without errors
- [ ] File upload component works
- [ ] GPS indicator shows (success or warning)
- [ ] Form validation works
- [ ] Success message on submit

---

### Test 24: Compliance Pack Page

**URL**: `http://localhost:3001/ecm/compliance`

**Steps**:
1. Navigate to compliance page
2. Verify templates list loads
3. Click "Generate Pack" button
4. Select template
5. Choose date range
6. Submit generation

**Expected Result**:
- [ ] Page loads without errors
- [ ] Templates display correctly
- [ ] Generation modal opens
- [ ] Form validation works
- [ ] Pack appears in table after generation

---

## Performance Tests

### Test 25: API Response Time

```bash
# Test response time for each endpoint
for endpoint in \
  "/api/v1/ecm/mobile/sync" \
  "/api/v1/ecm/compliance/templates" \
  "/agent/v1/knowledge/equipment/EQ-COMP-001"
do
  echo "Testing $endpoint"
  curl -w "Time: %{time_total}s\n" -o /dev/null -s \
    -H "Authorization: Bearer YOUR_TOKEN" \
    http://localhost:8080$endpoint
done
```

**Expected Result**:
- [ ] All responses < 2 seconds
- [ ] No timeouts

---

### Test 26: Concurrent Requests

```bash
# Test with 10 concurrent requests
ab -n 100 -c 10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/ecm/compliance/templates
```

**Expected Result**:
- [ ] All requests successful
- [ ] No errors
- [ ] Average response time < 1 second

---

## Error Handling Tests

### Test 27: Unauthorized Access

```bash
# Test without auth token
curl -X GET http://localhost:8080/api/v1/ecm/mobile/sync
```

**Expected Result**:
- [ ] HTTP 401 Unauthorized
- [ ] Error message present

---

### Test 28: Invalid Parameters

```bash
# Test with invalid parameters
curl -X POST http://localhost:8080/api/v1/ecm/compliance/generate-pack \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Result**:
- [ ] HTTP 400 Bad Request
- [ ] Validation error message present

---

### Test 29: Non-Existent Resource

```bash
# Test with non-existent ID
curl -X GET http://localhost:8080/agent/v1/knowledge/equipment/NONEXISTENT \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result**:
- [ ] HTTP 200 OK (with found=false)
- OR HTTP 404 Not Found
- [ ] Graceful error handling

---

### Test 30: Rate Limiting

```bash
# Test rate limiting (requires 600+ requests)
for i in {1..650}; do
  curl -X GET http://localhost:8080/api/v1/ecm/compliance/templates \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -w "%{http_code}\n" -o /dev/null -s
done | sort | uniq -c
```

**Expected Result**:
- [ ] Initial requests return 200
- [ ] After limit, requests return 429

---

## Test Summary

**Total Tests**: 30

**By Phase**:
- Phase 5: 4 tests
- Phase 7: 4 tests
- Phase 9: 7 tests
- Phase 6: 4 tests
- Database: 3 tests
- Frontend: 2 tests
- Performance: 2 tests
- Error Handling: 4 tests

**Pass Criteria**:
- [ ] All critical tests (1-22) pass
- [ ] Performance tests within acceptable limits
- [ ] Error handling tests pass
- [ ] No blocking issues

---

## Test Execution Log

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Mobile Photo Upload | ⬜ | |
| 2 | Offline Cache | ⬜ | |
| 3 | Sync Offline | ⬜ | |
| 4 | AR Overlay | ⬜ | |
| 5 | List Templates | ⬜ | |
| 6 | Generate Pack | ⬜ | |
| 7 | Get Pack | ⬜ | |
| 8 | Audit Trail | ⬜ | |
| 9 | Get Entity Knowledge | ⬜ | |
| 10 | Semantic Query | ⬜ | |
| 11 | Graph Query | ⬜ | |
| 12 | Execute SOP (Dry Run) | ⬜ | |
| 13 | Get Execution Status | ⬜ | |
| 14 | Extract Maintenance | ⬜ | |
| 15 | Get Maintenance History | ⬜ | |
| 16 | RAG Search | ⬜ | |
| 17 | Extract Tool | ⬜ | |
| 18 | Spare Parts Tool | ⬜ | |
| 19 | Training Tool | ⬜ | |
| 20 | Check Tables | ⬜ | |
| 21 | Check Demo Data | ⬜ | |
| 22 | Check pgvector | ⬜ | |
| 23 | Mobile Upload Page | ⬜ | |
| 24 | Compliance Page | ⬜ | |
| 25 | API Response Time | ⬜ | |
| 26 | Concurrent Requests | ⬜ | |
| 27 | Unauthorized | ⬜ | |
| 28 | Invalid Params | ⬜ | |
| 29 | Non-Existent | ⬜ | |
| 30 | Rate Limiting | ⬜ | |

---

**Status Legend**: ✅ Pass | ❌ Fail | ⬜ Not Run

**Tester**: _______________

**Date**: _______________

**Environment**: _______________
