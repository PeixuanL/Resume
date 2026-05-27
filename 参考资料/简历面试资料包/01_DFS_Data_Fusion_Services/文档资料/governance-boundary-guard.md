# Governance Boundary Guard

Because GitHub token may not have `workflow` scope, boundary guard is provided as a script.

## Run locally / in CI step

```bash
bash scripts/boundary-guard.sh
```

## What it checks
1. No industry-specific markers in platform layer (`backend/.../platform/**`)
2. No direct `findAll(` exposure in controller layer
3. `nativeQuery` methods include tenant markers (heuristic), except `SystemConfigRepository`

## Recommended CI integration
- Add a step in existing build workflow before backend compile:

```yaml
- name: Boundary guard
  run: bash scripts/boundary-guard.sh
```
