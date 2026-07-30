# PdM Architecture: LLM vs Deterministic Pipeline

## Core Principle

PdM system has TWO processing tiers:

1. **Deterministic Pipeline (24x7, no LLM, zero marginal cost)**
   - Runs on fixed schedule (every 10 min / hourly / daily)
   - Pure math: numpy, scipy, statistics
   - Config-driven thresholds and rules
   - Produces: Health Index, ISO grades, alerts, trend scores

2. **LLM-Augmented Layer (on-demand, per-query cost)**
   - Triggered by user interaction (Advisor chat, report generation)
   - Natural language: explanation, recommendation, report writing
   - Produces: human-readable insights, maintenance plans, reports

## Architecture Diagram

```
                    24x7 Deterministic                    On-Demand LLM
                    (No LLM, Zero Cost)                  (Per-Query Cost)
                    
Sensor Data ──────> [Ingestion Pipeline] ──> sensor_readings table
                           |
                    [Scheduled Analyzer]
                           |
                    ┌──────┴──────────────────────────────┐
                    │                                      │
              ┌─────┴─────┐                         ┌─────┴─────┐
              │ Algorithm  │                         │ Algorithm  │
              │  Engine    │                         │  Engine    │
              │ (Python)   │                         │ (Python)   │
              └─────┬─────┘                         └─────┬─────┘
                    │                                      │
         ┌─────────┼─────────┐                    ┌───────┼───────┐
         │         │         │                    │       │       │
    ISO 10816  Health    Statistical          Trend   Correlation Fault
    Grading    Index     Features             Analysis  Analysis  Matching
         │         │         │                    │       │       │
         └─────────┼─────────┘                    └───────┼───────┘
                   │                                      │
                   ▼                                      ▼
            equipment_health_index                    alerts table
            (daily snapshots)                     (dedup + escalation)
                   │                                      │
                   └──────────┬───────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Frontend Views  │◄──── User sees dashboard
                    │  (Vue 3 + ECharts)│     (no LLM needed)
                    └────────┬────────┘
                             │
                    User clicks "Ask AI" / "Generate Report"
                             │
                             ▼
                    ┌─────────────────┐
                    │   LLM Layer     │◄──── Only here does LLM activate
                    │  (Advisor Chat) │
                    └─────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
              Explanation        Recommendation
              "Why is HI=41?"    "Replace bearing
               in natural         within 72 hours,
               language"          here's the plan..."
```

## Detailed Component Breakdown

### TIER 1: Deterministic (24x7, No LLM)

| Component | Schedule | Input | Output | Algorithm | Cost |
|-----------|----------|-------|--------|-----------|------|
| **Sensor Ingestion** | Every 10 min | Sushi Sensor LoRaWAN | sensor_readings row | Direct write | ~0 |
| **ISO 10816 Grading** | Per reading | vel_composite RMS | Grade A/B/C/D + score 0-100 | Table lookup from config | ~0 |
| **Statistical Features** | Per reading batch | All sensor channels | CF, Kurtosis, Skewness, dRMS/dt | numpy moments | ~0 |
| **Operating State Detection** | Per reading batch | vel values | RUNNING/OFFLINE/PARTIAL | Threshold (vel < 0.5 = offline) | ~0 |
| **Planned Shutdown Filter** | Daily | Operating state history | is_planned_shutdown boolean | Pattern learning (N weeks) | ~0 |
| **Multi-Signal Correlation** | Per reading batch | Signal pairs from config | Pearson r, coupling/divergence | numpy.corrcoef | ~0 |
| **Health Index Calculation** | Daily | ISO + Trend + Corr + Uptime | HI 0-100, monotonic decay | Weighted sum from config | ~0 |
| **Trend Analysis** | Daily | 7-day vel window | Slope, R-squared, days to failure | numpy polyfit | ~0 |
| **Fault Signature Matching** | Per alert | Current stats vs signature DB | Matched fault type + confidence | Rule-based condition check | ~0 |
| **Alert Deduplication** | Per alert | New alert vs existing | Suppress or escalate | 7-day window merge | ~0 |
| **Alert Escalation** | Daily | Sustained alert duration | LOW -> MEDIUM -> HIGH -> CRITICAL | Config-driven day thresholds | ~0 |

**Total cost for 24x7 monitoring of 1000 equipment: ~$0/month** (CPU only, no API calls)

### TIER 2: LLM-Augmented (On-Demand)

| Component | Trigger | Input | Output | Model | Cost |
|-----------|---------|-------|--------|-------|------|
| **Advisor Chat** | User asks question | HI, alerts, readings context | Natural language answer | GPT-4o / Qwen | ~$0.01/query |
| **Root Cause Explanation** | User clicks "Why?" | Alert + historical data | "The bearing degradation is caused by..." | GPT-4o | ~$0.02/query |
| **Maintenance Plan** | User requests plan | Equipment state + WO history | Structured maintenance schedule | GPT-4o | ~$0.03/query |
| **Report Generation** | Weekly/monthly schedule | All equipment HI + alerts | PDF/Excel maintenance report | GPT-4o + reportlab | ~$0.05/report |
| **Anomaly Narrative** | New CRITICAL alert | Alert context + history | Push notification text | GPT-4o-mini | ~$0.001/alert |
| **Config Recommendation** | After 3 months data | False positive rate, HI accuracy | "Suggest adjusting CF threshold to 5.5" | GPT-4o | ~$0.02/query |

**Cost for 1000 equipment, moderate usage: ~$50-100/month**

## Implementation: Scheduled Analyzer (Spring Boot)

The 24x7 pipeline runs as a Spring `@Scheduled` task, NOT as an HTTP endpoint:

```java
@Component
public class PdmScheduledAnalyzer {

    @Scheduled(cron = "0 */10 * * * *")  // Every 10 minutes
    public void analyzeNewReadings() {
        // 1. Find equipment with new readings since last run
        // 2. For each: resolve config -> fetch readings -> run algorithms -> store results
        // 3. No LLM call, no external API, pure computation
    }

    @Scheduled(cron = "0 0 2 * * *")  // Daily at 2 AM
    public void computeDailyHealthIndex() {
        // 1. For ALL active equipment
        // 2. Aggregate day's readings -> ISO grade, CF, Kurtosis, trend
        // 3. Compute HI = weighted(iso, trend, corr, uptime) from config
        // 4. Store in equipment_health_index
        // 5. Run alert escalation check
    }

    @Scheduled(cron = "0 0 3 * * MON")  // Weekly Monday 3 AM
    public void weeklyPatternLearning() {
        // 1. Analyze past 4 weeks of operating states
        // 2. Update equipment_operating_schedule (planned shutdown days)
        // 3. Recalculate baseline statistics
        // 4. Update fault signature confidence from confirmed/false_positive counts
    }
}
```

## Data Flow: What Happens When Sensor Sends a Reading

```
10:00:00  Sushi Sensor transmits via LoRaWAN
10:00:01  Gateway receives, writes to sensor_readings table
            (This is external - DFS Lite connector or direct API)

10:00:10  @Scheduled(every 10 min) picks up new readings
          ├─ Resolve config for equipment 73 (PUMP defaults)
          ├─ Read last 144 readings (24h window)
          ├─ Calculate: vel_rms=5.2, CF=1.4, K=3.1, dRMS=-0.02
          ├─ ISO grade: B (5.2 < 7.1)
          ├─ Operating state: RUNNING (vel > 0.5)
          ├─ No alerts (all within thresholds)
          └─ Done. No LLM. No API call. ~50ms.

02:00:00  @Scheduled(daily) computes Health Index
          ├─ Aggregate day: avg_vel=5.4, max_vel=6.1, grade=B
          ├─ CF_avg=1.5, Kurtosis_avg=3.2 (both normal)
          ├─ Trend: slope=-0.01 mm/s/day (stable)
          ├─ HI = 0.4*82 + 0.25*85 + 0.2*90 + 0.15*95 = 85.8
          ├─ INSERT INTO equipment_health_index
          ├─ No alerts to escalate
          └─ Done. No LLM. ~200ms per equipment.

-- User opens dashboard at 09:00 --
09:00:01  Frontend fetches /api/v1/pdm/orchestrator/status
          ├─ Returns: HI=85.8, Grade=B, state=RUNNING
          └─ Pure DB read. No LLM.

09:00:15  User clicks "Ask AI about this equipment"
          ├─ Frontend calls /api/advisor with context
          ├─ Advisor reads: HI=85.8, trend stable, no alerts
          ├─ LLM generates: "Equipment #73 is in good condition.
          │    Health Index 85.8 (Grade B). Vibration levels stable
          │    over the past week. No maintenance action needed.
          │    Next recommended inspection: 2026-06-15."
          └─ THIS is the only LLM call. ~$0.01.
```

## What This Means for Product

### Customer Value Proposition

> "Our PdM system monitors your equipment 24/7 with zero ongoing AI costs.
> The LLM is only used when your engineers need explanations or reports.
> 1000 machines monitored = same cost as 1 machine."

### Competitive Advantage

| Feature | Competitors (LLM-heavy) | FactVerse (Deterministic + LLM) |
|---------|------------------------|---------------------------------|
| Monitoring cost | $0.10/reading/equipment | $0 (pure math) |
| 1000 equipment/month | $30,000+ | ~$50 (LLM for reports only) |
| Offline capability | No (needs API) | Yes (deterministic runs locally) |
| Latency | 2-5s per analysis | <100ms (no API round-trip) |
| Explainability | LLM-generated | Math-based + LLM explanation |
| Consistency | LLM may vary | Deterministic = same input = same output |

### Edge Deployment Scenario

```
Factory Edge Server (no internet):
  ├─ Sensor ingestion (LoRaWAN gateway)
  ├─ Deterministic pipeline (Python/Java)
  ├─ Dashboard (Vue frontend)
  ├─ Alerts (email/SMS from local server)
  └─ ALL of the above works 24x7 offline

Cloud (when connected):
  ├─ LLM advisor queries (GPT-4o / Qwen)
  ├─ Report generation
  ├─ Cross-factory benchmarking
  └─ Model updates and config sync
```

## API Categorization

### No-LLM APIs (24x7, deterministic)
- `POST /api/v1/pdm/orchestrator/run` - Run analysis for one equipment
- `POST /api/v1/pdm/orchestrator/run-all` - Run for all equipment
- `GET /api/v1/pdm/orchestrator/status` - Latest HI per equipment
- `GET /api/v1/pdm/config/resolve` - Get analysis config
- `GET /api/v1/pdm/config/list` - List configs
- `PUT /api/v1/pdm/config/{id}` - Update config
- `POST /ai/pdm/analyze` - AI Engine deterministic analysis
- `POST /ai/pdm/analyze-batch` - Batch analysis
- `GET /api/v1/sensors/readings` - Raw sensor data
- `GET /api/v1/pdm/health-index/equipment/{id}` - Health history
- `GET /api/v1/pdm/health-index/latest` - Latest HI for all
- `GET /api/v1/alerts` - Alert list (pre-computed)

### LLM APIs (on-demand, per-query cost)
- `POST /api/advisor` - Natural language Q&A about equipment
- `POST /api/v1/pdm/explain` - Root cause explanation (FUTURE)
- `POST /api/v1/pdm/maintenance-plan` - Generate maintenance plan (FUTURE)
- `POST /api/v1/reports/generate` - Generate PDF/Excel report (FUTURE)
- `POST /api/v1/pdm/config/recommend` - Suggest config changes (FUTURE)

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Sensor Ingestion | DONE | DFS Lite + direct SQL import |
| ISO 10816 Grading | DONE | Config-driven thresholds |
| Statistical Features | DONE | CF, Kurtosis, dRMS/dt |
| Operating State | DONE | vel threshold detection |
| Planned Shutdown Filter | DONE | Auto-learned from data |
| Multi-Signal Correlation | DONE | Config-driven pairs |
| Health Index | DONE | 4-component weighted, monotonic |
| Trend Analysis | DONE | polyfit slope |
| Fault Signature Matching | DONE | 6 signatures seeded |
| Alert Dedup + Escalation | DONE | 7-day window, escalation chain |
| Config Resolution | DONE | 4-level hierarchy |
| Generic Pipeline (AI Engine) | DONE | /ai/pdm/analyze |
| Orchestrator (Backend) | DONE | /orchestrator/run, run-all |
| Config Admin UI | DONE | PdmConfigView.vue |
| **Scheduled Analyzer** | **TODO** | Spring @Scheduled cron jobs |
| **LLM Explanation** | **TODO** | Advisor tool for PdM context |
| **Report Generation** | **TODO** | Weekly PDF/Excel |
| **Edge Deployment** | **FUTURE** | Offline-capable package |
