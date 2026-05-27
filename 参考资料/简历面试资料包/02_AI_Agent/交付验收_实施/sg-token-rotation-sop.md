# [ARCHIVED] SG FactVerse Token Rotation SOP

> ⚠️ Historical platform note only. Do not use this file as the current production deployment or operations source of truth.
>
> Current deployment / operations truth:
> - `docs/DEPLOYMENT_SOP.md`
> - `deploy/ENVIRONMENT_CONTRACT.md`


## Overview
The Singapore tenant (`dcs-sg.datamesh.com`) uses Token Auth mode due to encrypted login requirements.

## Configuration
```yaml
# Environment variables on production server
FACTVERSE_ENABLED=true
FACTVERSE_API_URL=https://dcs-sg.datamesh.com/api
FACTVERSE_AUTH_MODE=token
FACTVERSE_TOKEN=<jwt-token>
FACTVERSE_TENANT_ID=<sg-tenant-id>
```

## Token Acquisition
1. **Manual**: Login to `dcs-sg.datamesh.com` via browser
2. Open DevTools → Network → find any API request
3. Copy the `Authorization: Bearer <token>` header value
4. The token is a JWT — check expiry via `jwt.io` or `echo <token> | base64 -d`

## Token Injection (Production)
```bash
ssh factverse
# Edit the docker run command or .env file:
export FACTVERSE_TOKEN="eyJhbGci..."
# Restart the backend container
docker restart fv-backend
```

## Verification
```bash
# On production server:
curl -s http://localhost:8080/api/factverse/status | jq .
# Expected: {"enabled":true,"authMode":"token","connected":true,"sceneCount":N}
```

## Rotation Schedule
- **Frequency**: Check token validity weekly (JWT expiry varies)
- **Who**: Jie or authorized admin with SG tenant credentials
- **Rollback**: Set `FACTVERSE_ENABLED=false` to disable without removing token

## Alerts
- If `/api/factverse/status` returns `"connected":false`, token may be expired
- Backend logs will show `FactVerse GET FALLBACK` messages on token expiry
- Circuit breaker prevents cascading failures — dashboard remains functional

## Future Improvement
- Implement automated token refresh using RSA-encrypted login (requires FactVerse frontend's public key)
- Or request long-lived API key from FactVerse SG admin
