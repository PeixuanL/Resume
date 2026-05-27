# Design: Simulation Worker System

## Overview

The Simulation Worker is a background process that executes simulation jobs
(DES, ABM, MILP, Monte Carlo, etc.) asynchronously via a Redis queue. This
decouples long-running simulations from the FastAPI request/response cycle,
enabling horizontal scaling and better resource utilization.

## Architecture

```
┌─────────────┐     ZADD         ┌─────────────┐     multiprocessing
│  FastAPI     │ ──────────────►  │  Redis       │ ◄────────────────►  SimWorker
│  /submit     │  sim:queue       │  (sorted set)│                     (N procs)
│  /job/{id}   │ ◄────────────── │  sim:job:*   │
└─────────────┘     HGETALL      └─────────────┘
                                        │
                                  PubSub: sim:{job_id}:progress
```

### Components

1. **`worker/engine_runner.py`** — Unified entry point that calls existing
   simulation engine functions directly (no HTTP self-calls).
2. **`worker/sim_worker.py`** — Main worker loop: pops jobs from Redis
   sorted set, forks subprocesses, publishes progress, writes results.
3. **`worker/run.py`** — CLI entry point for launching the worker.
4. **Updated `whatif.py`** — New `/submit`, `/batch/submit`, `/job/{id}`
   endpoints that enqueue jobs instead of running synchronously.

### Redis Data Model

| Key Pattern              | Type       | Description                        |
|--------------------------|------------|------------------------------------|
| `sim:queue`              | Sorted Set | Job queue (score = priority/time)  |
| `sim:job:{job_id}`       | Hash       | Job metadata, status, result       |
| `sim:{job_id}:progress`  | PubSub     | Real-time progress channel         |

### Job Lifecycle

1. `QUEUED` — Job submitted, added to sorted set
2. `RUNNING` — Worker picked up, subprocess started
3. `COMPLETED` — Engine finished, result stored
4. `FAILED` — Engine raised exception
5. `CANCELLED` — Client requested cancellation

### Concurrency

- Worker runs N concurrent subprocesses (default 2)
- Each engine runs in an isolated `multiprocessing.Process`
- Progress reported back via Redis PubSub

### Deployment

Worker runs from the same Docker image as the API server:
```bash
docker run ... factverse-ai-engine:latest python -m worker.run
```
