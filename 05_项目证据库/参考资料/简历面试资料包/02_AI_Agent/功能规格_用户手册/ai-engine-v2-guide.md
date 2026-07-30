# AI Engine v2 — Comprehensive Developer Guide

> **Version:** 2.x | **Updated:** 2026-03-02 | **Maintainer:** DataMesh Engineering

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Forecast API](#2-forecast-api)
3. [Anomaly Detection API](#3-anomaly-detection-api)
4. [Explainability API (SHAP)](#4-explainability-api-shap)
5. [Advisory Modes: SHADOW / ADVISORY / AUTO](#5-advisory-modes)
6. [Frontend Components](#6-frontend-components)
7. [Module Integration Guide](#7-module-integration-guide)
8. [Advisor Tools Reference](#8-advisor-tools-reference)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (Vue 3 + Element Plus)               │
│  ForecastChart  AnomalyWaterfall  AnomalyRadar  AdvisoryBadge       │
│  AiPlatformCard  AiModelRegistryView  AiForecastPanel               │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP / SSE
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Backend API (FastAPI / Node.js)                     │
│  /api/v1/...  →  proxies to AI Engine                               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ Internal HTTP (port 8001 default)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AI Engine v2  (FastAPI on :8001)                  │
│                                                                      │
│  ┌─────────────┐  ┌──────────────────┐  ┌─────────────────────┐    │
│  │  Forecast   │  │ Anomaly Detection │  │   Explainability    │    │
│  │  Router     │  │ Router (v2)       │  │   Router (v2)       │    │
│  │  /ai/fore.. │  │ /ai/anomaly/...   │  │   /ai/explain       │    │
│  └──────┬──────┘  └────────┬──────────┘  └──────────┬──────────┘    │
│         │                  │                         │               │
│  FoundationForecaster  AnomalyAutoEncoder      explain_engine.py     │
│  (Chronos/Prophet/     + IsolationForest        SHAP TreeExplainer   │
│   Statsforecast)         saved at               + NL summary (GPT)   │
│                       /trained_models/                               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Advisor / Chat Router                      │   │
│  │  POST /ai/advisor/chat  — LLM orchestration + tool calls     │   │
│  │  ForecastTool | AnomalyDetectionTool | ExplainabilityTool    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────┐                                           │
│  │  Canary / AB Testing │   SHADOW → ADVISORY → AUTO promotion      │
│  │  ab_testing/canary.py│                                           │
│  └──────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────┘
                           │
                     PostgreSQL / InfluxDB / Redis
```

### Router Prefixes (registered in `main.py`)

| Router | Prefix | Tags |
|---|---|---|
| `forecast.py` | `/ai` | Forecasting |
| `anomaly_v2.py` | `/ai` | Anomaly Detection v2 |
| `explain_v2.py` | `/ai` | Explainability v2 |
| `explainability.py` | `/ai` | Explainability (v1) |
| `advisor.py` | `/optimize` | Advisor Optimizer |
| `advisor_chat.py` | *(root)* | Advisor Chat |
| `models.py` | *(root)* | Model Management |

### Data Flow: End-to-End Forecast Request

```
1. Frontend calls POST /ai/forecast (via axios api/aiEngine.ts)
2. AI Engine receives ForecastRequest (sensorIds, history, forecastSteps, model)
3. FoundationForecaster.predict():
   a. If history not provided → fetch from backend via GET /api/v1/sensors/{id}/history
   b. Select model: Chronos (if GPU/torch available) → Prophet → Statsforecast fallback
   c. Return ForecastResponse with prediction intervals (lower/upper at confidenceLevel)
4. ForecastChart renders sparklines with confidence bands
```

---

## 2. Forecast API

### Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/ai/forecast` | Single forecast request (one or more sensor IDs) |
| `POST` | `/ai/forecast/batch` | Batch: list of forecast requests |
| `GET` | `/ai/forecast/models` | List available forecast model names |

### POST `/ai/forecast`

**Request Body** (`ForecastRequest`):

```json
{
  "sensorIds": ["sensor-001", "sensor-002"],
  "history": [[12.3, 14.1, 13.8, ...], [9.5, 9.1, 10.2, ...]],
  "historyHours": 168,
  "forecastSteps": 24,
  "interval": "1h",
  "model": "auto",
  "confidenceLevel": 0.95
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `sensorIds` | `string[]` | **required** | List of sensor IDs to forecast |
| `history` | `float[][]` | `null` | Pre-provided history (one list per sensor, chronological) |
| `historyHours` | `int` | `168` | Hours of history to auto-fetch when `history` is null |
| `forecastSteps` | `int` | `24` | Steps ahead to predict (1–720) |
| `interval` | `string` | `"1h"` | Sampling interval: `"15min"`, `"1h"`, `"1d"` |
| `model` | `string` | `"auto"` | `"auto"` \| `"chronos"` \| `"prophet"` \| `"statsforecast"` |
| `confidenceLevel` | `float` | `0.95` | Confidence interval width (0.5–0.999) |

**Response Body** (`ForecastResponse`):

```json
{
  "predictions": [
    {
      "sensorId": "sensor-001",
      "forecast": [
        {
          "time": "2026-03-02T10:00:00+00:00",
          "value": 13.5,
          "lower": 12.1,
          "upper": 14.9
        }
      ],
      "model": "chronos",
      "mape": 4.23
    }
  ]
}
```

### Model Selection Logic (`model: "auto"`)

```
1. Try Chronos (Amazon foundation model) — requires torch + GPU
2. Fall back to Prophet (Meta) — CPU-friendly, requires prophet package
3. Final fallback: Statsforecast (AutoARIMA / AutoETS) — always available
```

### POST `/ai/forecast/batch`

Wraps multiple `ForecastRequest` objects:

```json
{
  "requests": [
    { "sensorIds": ["s-001"], "forecastSteps": 12 },
    { "sensorIds": ["s-002"], "forecastSteps": 48 }
  ]
}
```

Returns `BatchForecastResponse.results` — same structure as `ForecastResponse` per element.

### GET `/ai/forecast/models`

Returns available model names, e.g.:
```json
{ "models": ["chronos", "prophet", "statsforecast", "auto"] }
```

---

## 3. Anomaly Detection API

### Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/ai/anomaly/train` | Train a new AutoEncoder + IsolationForest model |
| `POST` | `/ai/anomaly/detect` | Run anomaly detection on live sensor data |
| `GET` | `/ai/anomaly/models` | List all trained models |
| `DELETE` | `/ai/anomaly/models/{model_id}` | Delete a trained model |

### Architecture: AutoEncoder + IsolationForest

```
Training data (normal operation sensor readings)
        │
        ├──► AutoEncoder (PyTorch)
        │    - Encodes to latent_dim (default: 8)
        │    - Trains on reconstruction loss (MSE)
        │    - Saves model + scaler to /trained_models/{model_id}/
        │
        └──► IsolationForest (sklearn)
             - Detects global outliers in sensor space
             - Provides secondary anomaly score

Detection: new sensor reading
        │
        ├──► AE reconstruction error per sensor (contribution)
        ├──► IF outlier score
        └──► Combined score → NORMAL / WARNING / ANOMALY
```

### POST `/ai/anomaly/train`

**Request Body** (`TrainRequest`):

```json
{
  "modelId": "ae-chiller-001",
  "sensorNames": ["temperature", "vibration", "current", "pressure"],
  "trainingData": [
    { "temperature": 25.1, "vibration": 0.3, "current": 12.4, "pressure": 101.2 },
    ...
  ],
  "epochs": 50,
  "latentDim": 8
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `modelId` | `string` | **required** | Unique model identifier (e.g., `"ae-chiller-001"`) |
| `sensorNames` | `string[]` | **required** | Feature names in the training data |
| `trainingData` | `object[]` | **required** | Array of sensor readings (at least ~100 rows recommended) |
| `epochs` | `int` | `50` | Training epochs for AutoEncoder |
| `latentDim` | `int` | `8` | Bottleneck dimension (smaller = more compression) |

**Response Body** (`TrainResponse`):

```json
{
  "modelId": "ae-chiller-001",
  "status": "persisted",
  "metrics": {
    "reconstruction_loss": 0.0023,
    "isolation_contamination": 0.05
  },
  "sensorCount": 4
}
```

### POST `/ai/anomaly/detect`

**Request Body** (`DetectRequest`):

```json
{
  "equipmentId": "chiller-floor-3",
  "sensorData": {
    "temperature": 38.9,
    "vibration": 2.1,
    "current": 18.7,
    "pressure": 85.0
  },
  "sensitivity": "medium",
  "modelId": "ae-chiller-001"
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `equipmentId` | `string` | **required** | Equipment identifier |
| `sensorData` | `object` | **required** | Current sensor readings (key=sensor name, value=float) |
| `sensitivity` | `string` | `"medium"` | `"low"` (0.8) \| `"medium"` (0.7) \| `"high"` (0.6) — threshold multiplier |
| `modelId` | `string` | `null` | Override auto-select; if null, engine searches by equipment ID |

**Response Body** (`DetectResponse`):

```json
{
  "equipmentId": "chiller-floor-3",
  "status": "ANOMALY",
  "anomalyScore": 0.83,
  "anomalySensors": [
    {
      "sensorId": "vibration",
      "contribution": 0.61,
      "actual": 2.1,
      "expected": 0.35,
      "unit": "mm/s"
    }
  ],
  "model": "ae-chiller-001"
}
```

**Status values:**
- `NORMAL` — anomaly score below low threshold
- `WARNING` — score between sensitivity thresholds
- `ANOMALY` — score exceeds high threshold

**Sensitivity thresholds** (`SENSITIVITY_MAP`):
- `low`: 0.8
- `medium`: 0.7
- `high`: 0.6

### Model Persistence

Models are saved to disk at:
```
ai-engine/trained_models/{model_id}/
├── ae_model.pt          # PyTorch AutoEncoder weights
├── ae_scaler.pkl        # StandardScaler
├── if_model.pkl         # IsolationForest
└── meta.json            # Model metadata (sensorNames, trained_at, etc.)
```

---

## 4. Explainability API (SHAP)

### Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/ai/explain` | Explain a single anomaly or prediction result |
| `POST` | `/ai/explain/batch` | Batch explain (up to 50 requests) |

### POST `/ai/explain`

Runs SHAP analysis against a trained model and returns:
- Feature contribution waterfall data
- Natural language summary (supports `"zh"`, `"en"`, `"ja"`)

**Request Body** (`ExplainRequest`):

```json
{
  "taskType": "anomaly",
  "modelId": "ae-chiller-001",
  "sensorData": {
    "temperature": 38.9,
    "vibration": 2.1,
    "current": 18.7,
    "pressure": 85.0
  },
  "backgroundData": [
    { "temperature": 25.1, "vibration": 0.3, "current": 12.4, "pressure": 101.2 },
    ...
  ],
  "topN": 5,
  "language": "en"
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `taskType` | `string` | `"anomaly"` | `"anomaly"` \| `"prediction"` |
| `modelId` | `string` | **required** | Trained model identifier |
| `sensorData` | `object` | **required** | Data point to explain (current readings) |
| `backgroundData` | `object[]` | **required** | 10–50 rows of normal-operation baseline data |
| `topN` | `int` | `5` | Return top N contributing features (1–20) |
| `language` | `string` | `"zh"` | NL summary language: `"zh"` \| `"en"` \| `"ja"` |

**Response Body** (`ExplainResponse`):

```json
{
  "summary": "The anomaly was primarily driven by vibration (SHAP: +0.52, 2.1 mm/s vs baseline 0.35 mm/s). Temperature also contributed significantly (+0.21). The model predicts abnormal operation with high confidence.",
  "features": [
    {
      "name": "vibration",
      "label": "Vibration",
      "shapValue": 0.52,
      "direction": "high",
      "actual": 2.1,
      "baseline": 0.35
    }
  ],
  "visualData": {
    "type": "waterfall",
    "baseValue": 0.12,
    "outputValue": 0.83,
    "features": [
      { "name": "vibration", "value": 0.52, "cumulative": 0.64 },
      ...
    ]
  }
}
```

### SHAP Implementation Details

- **Anomaly models** (AE): Uses `shap.KernelExplainer` with the AutoEncoder reconstruction error as the prediction function
- **Prediction models**: Uses `shap.TreeExplainer` when the model is tree-based (XGBoost, RF); falls back to `KernelExplainer`
- **Background data**: Summarized to 50 samples via K-means (`shap.kmeans`) for performance
- **NL summary**: If `OPENAI_API_KEY` is set, uses GPT-4o for multilingual summaries; otherwise uses template-based fallback

---

## 5. Advisory Modes

The AI Advisory system operates in one of three modes, configured per-module or globally via `ADVISORY_MODE` environment variable.

### Mode Definitions

| Mode | Behavior | `AdvisoryBadge` Color | Use Case |
|---|---|---|---|
| `SHADOW` | AI runs in parallel, never shows recommendations to users. Results logged silently for comparison. | Blue (info) | Initial deployment, validation phase |
| `ADVISORY` | AI recommendations displayed to users as suggestions; humans approve/reject. | Primary (blue-dark) | Normal production; requires human-in-the-loop |
| `AUTO` | AI recommendations automatically applied without human approval. | Green (success) | Mature models with high confidence; requires explicit opt-in |

### Canary Promotion Pipeline

Implemented in `ai-engine/ab_testing/canary.py`:

```
SHADOW → ADVISORY → AUTO
  │           │        │
  │     (metrics OK)   │
  │     e.g. MAPE<5%   │
  │     error_rate<1%  │
  └────────────────────┘
       auto-promote
```

Each stage has configurable traffic weights:
- `SHADOW`: 0% real traffic (parallel shadow run)
- `ADVISORY`: partial rollout (configurable %)
- `AUTO`: 100% automated

### Configuring Advisory Mode

**Environment variable** (global default):
```env
ADVISORY_MODE=ADVISORY
```

**Per-equipment override** (via API or database):
```json
{
  "equipmentId": "chiller-001",
  "advisoryMode": "AUTO"
}
```

**Frontend display** — `AdvisoryBadge` component reads mode from props:
```vue
<AdvisoryBadge mode="ADVISORY" />
```

---

## 6. Frontend Components

All AI components are in `frontend/src/components/ai/`.

### `ForecastChart.vue`

Renders time-series forecast with confidence band.

**Props:**
```typescript
props: {
  sensorId: string           // sensor to forecast
  forecastData?: SensorForecast  // pre-fetched forecast (optional)
  autoLoad?: boolean         // auto-fetch on mount (default: true)
  steps?: number             // forecast steps (default: 24)
  interval?: string          // "1h" | "15min" | "1d"
  model?: string             // "auto" | "chronos" | "prophet"
}
```

**Usage:**
```vue
<ForecastChart
  sensor-id="temperature-001"
  :steps="48"
  interval="1h"
  model="auto"
/>
```

**Emits:** `@forecast-loaded(data: SensorForecast)`, `@error(err: Error)`

---

### `AnomalyWaterfall.vue`

Renders a SHAP waterfall chart showing feature contributions to an anomaly score.

**Props:**
```typescript
props: {
  modelId: string                     // trained model ID
  sensorData: Record<string, number>  // current sensor readings
  backgroundData: Record<string, number>[]  // baseline samples
  topN?: number                       // top features to show (default: 5)
  language?: "zh" | "en" | "ja"       // NL summary language
}
```

**Usage:**
```vue
<AnomalyWaterfall
  model-id="ae-chiller-001"
  :sensor-data="currentReadings"
  :background-data="baselineData"
  :top-n="5"
  language="en"
/>
```

**Emits:** `@explain-loaded(result: ExplainResponse)`, `@error(err: Error)`

---

### `AnomalyRadar.vue`

Radar chart showing normalized sensor deviation from baseline (per-sensor anomaly contribution).

**Props:**
```typescript
props: {
  contributions: SensorContribution[]  // from DetectResponse.anomalySensors
  title?: string
}
```

**Usage:**
```vue
<AnomalyRadar
  :contributions="detectResponse.anomalySensors"
  title="Sensor Deviation"
/>
```

---

### `AdvisoryBadge.vue`

Small tag indicating the current advisory mode.

**Props:**
```typescript
props: {
  mode: 'SHADOW' | 'ADVISORY' | 'AUTO'
}
```

**Usage:**
```vue
<AdvisoryBadge mode="AUTO" />
```

**i18n keys used:**
- `ai.advisory.shadow`
- `ai.advisory.advisory`
- `ai.advisory.auto`

---

### `AiPlatformCard.vue` (Dashboard)

Compact summary card showing AI Engine health stats. Uses `ai.platform.*` i18n keys.

**No props** — loads data independently via `getForecastModels()` + `listAnomalyModels()` on mount.

---

### `AiModelRegistryView.vue` (Full Page)

Full registry table with Forecast/Anomaly tabs. Uses `ai.models.*` i18n keys.

**Route name:** `AiModelRegistry`

---

## 7. Module Integration Guide

### How to add an AI panel to a new module

Follow this template when adding AI capabilities (forecast + anomaly) to any module page.

#### Step 1: Add AI API calls in `api/aiEngine.ts`

```typescript
// Already available — import as needed:
import {
  postForecast,
  detectAnomaly,
  explainAnomaly,
  getForecastModels,
  listAnomalyModels,
} from '@/api/aiEngine'
```

#### Step 2: Create module AI panel component

```
frontend/src/views/{your-module}/components/AiPanel.vue
```

```vue
<template>
  <el-card class="ai-panel">
    <template #header>
      <div class="flex justify-between items-center">
        <span>🧠 AI Analysis</span>
        <AdvisoryBadge :mode="advisoryMode" />
      </div>
    </template>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="Forecast" name="forecast">
        <ForecastChart
          :sensor-id="primarySensorId"
          :steps="24"
          interval="1h"
        />
      </el-tab-pane>
      <el-tab-pane label="Anomaly" name="anomaly">
        <AnomalyRadar
          v-if="anomalyResult"
          :contributions="anomalyResult.anomalySensors"
        />
        <AnomalyWaterfall
          v-if="anomalyResult?.status !== 'NORMAL'"
          :model-id="modelId"
          :sensor-data="currentSensors"
          :background-data="baselineSamples"
          language="en"
        />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { detectAnomaly } from '@/api/aiEngine'
import ForecastChart from '@/components/ai/ForecastChart.vue'
import AnomalyRadar from '@/components/ai/AnomalyRadar.vue'
import AnomalyWaterfall from '@/components/ai/AnomalyWaterfall.vue'
import AdvisoryBadge from '@/components/ai/AdvisoryBadge.vue'

const props = defineProps<{
  equipmentId: string
  primarySensorId: string
  modelId: string
  currentSensors: Record<string, number>
  baselineSamples: Record<string, number>[]
}>()

const activeTab = ref('forecast')
const advisoryMode = ref<'SHADOW' | 'ADVISORY' | 'AUTO'>('ADVISORY')
const anomalyResult = ref<any>(null)

async function runAnomalyCheck() {
  try {
    anomalyResult.value = await detectAnomaly({
      equipmentId: props.equipmentId,
      sensorData: props.currentSensors,
      sensitivity: 'medium',
      modelId: props.modelId,
    })
  } catch (e) {
    console.warn('[AiPanel] anomaly check failed:', e)
  }
}

onMounted(runAnomalyCheck)
</script>
```

#### Step 3: Add i18n keys for the module

Add under `ai.{moduleName}.*` in all 11 locale files (`frontend/src/locales/*.json`):

```json
{
  "ai.yourModule.title": "AI Analysis",
  "ai.yourModule.forecast": "Forecast",
  "ai.yourModule.anomaly": "Anomaly Detection"
}
```

#### Step 4: Register a route (if new page)

```typescript
// frontend/src/router/modules/yourModule.ts
{
  path: 'ai',
  name: 'YourModuleAi',
  component: () => import('@/views/your-module/AiPanel.vue'),
  meta: { title: 'AI Analysis', icon: 'Brain' }
}
```

#### Step 5: Train an anomaly model (one-time setup)

```bash
curl -X POST http://localhost:8001/ai/anomaly/train \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "ae-your-module-001",
    "sensorNames": ["sensor_a", "sensor_b", "sensor_c"],
    "trainingData": [...],
    "epochs": 100,
    "latentDim": 8
  }'
```

---

## 8. Advisor Tools Reference

The AI Advisor (LLM chat) can autonomously call these tools. Implemented in `ai-engine/routers/advisor_chat.py` and `ai-engine/advisor/tool_executor.py`.

### ForecastTool

Triggers a forecast for one or more sensors from within LLM conversation context.

**Tool name:** `get_sensor_forecast` (registered via OpenAI function calling)

**Parameters:**
```json
{
  "sensor_ids": ["sensor-001"],
  "forecast_steps": 24,
  "interval": "1h",
  "model": "auto"
}
```

**Returns:** Natural language summary + `ForecastResponse` data

**Example prompt that triggers this tool:**
> "What will the temperature of chiller-3 look like over the next 24 hours?"

---

### AnomalyDetectionTool

Runs anomaly detection on a specific equipment from within LLM conversation context.

**Tool name:** `detect_equipment_anomaly`

**Parameters:**
```json
{
  "equipment_id": "chiller-floor-3",
  "sensor_data": { "temperature": 38.9, "vibration": 2.1 },
  "sensitivity": "medium"
}
```

**Returns:** `DetectResponse` + advisory text

**Example prompt:**
> "Is chiller-3 operating normally right now?"

---

### ExplainabilityTool

Generates a SHAP explanation for a previous anomaly detection result.

**Tool name:** `explain_anomaly`

**Parameters:**
```json
{
  "model_id": "ae-chiller-001",
  "sensor_data": { "temperature": 38.9, "vibration": 2.1 },
  "background_data": [...],
  "language": "en"
}
```

**Returns:** `ExplainResponse` with natural language summary

**Example prompt:**
> "Why is chiller-3 flagged as anomalous? Which sensor is causing it?"

---

### Full Advisor Tool Registry

See [`docs/06-ai-engine/advisor-tools.en.md`](../06-ai-engine/advisor-tools.en.md) for the complete list of 16+ advisor tools including simulation, optimization, DOE, and more.

---

## 9. Troubleshooting

### numpy / torch import errors

**Symptom:** AI Engine fails to start with `ImportError: numpy`

```bash
# Fix: reinstall numpy in the AI engine container
docker exec -it factverse-ai-engine pip install numpy --upgrade

# Or rebuild base image:
docker build -f Dockerfile.base -t jiel/factverse-ai-engine:base .
docker build -t jiel/factverse-ai-engine .
```

**Symptom:** `RuntimeError: Torch not compiled with CUDA enabled`

This is non-fatal — the engine falls back to Prophet/Statsforecast automatically. To suppress the warning:
```env
TORCH_WARN_ONLY=1
```

---

### DB_HOST not set / database connection errors

**Symptom:** `Connection refused` or `pg.connect: ECONNREFUSED`

```bash
# Check env vars
ssh factverse "docker exec factverse-ai-engine env | grep -E 'DB_|DATABASE'"

# Expected:
DB_HOST=postgres
DB_PORT=5432
DB_NAME=factverse
DB_USER=factverse
DB_PASSWORD=...
```

If `DB_HOST` is missing, update `.env.production`:
```env
DB_HOST=postgres
```

Then restart:
```bash
docker compose restart ai-engine
```

---

### OPENAI_API_KEY missing / NL summary fallback

**Symptom:** SHAP NL summaries are in template format (`"The anomaly was driven by: ..."`) instead of natural GPT-4o language.

This is **expected behavior** — when `OPENAI_API_KEY` is not set, the engine uses template-based fallback for NL summaries. No action needed for self-hosted deployments.

To enable GPT-4o summaries:
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

---

### Model not found (404 on detect)

**Symptom:** `POST /ai/anomaly/detect` returns `404 Model not found for equipment {id}`

**Cause:** No trained model exists with a matching equipment ID.

**Fix:** Train a model first:
```bash
curl -X POST http://ai-engine:8001/ai/anomaly/train \
  -d '{"modelId": "ae-{equipment-id}", "sensorNames": [...], "trainingData": [...]}'
```

Or check trained models:
```bash
curl http://ai-engine:8001/ai/anomaly/models
```

---

### Forecast returns flat line

**Symptom:** All forecast values equal the last known value.

**Cause:** History data too short (< 2× `forecastSteps`) or all-constant series.

**Fix:**
- Increase `historyHours` (try `336` = 2 weeks)
- Check that sensor data is not stuck/constant in the source system
- Try explicit `model: "statsforecast"` to force ARIMA

---

### AiPlatformCard shows "—" for Avg MAPE

**Cause:** Forecast models have not been loaded/trained yet, or all returned models have `mape: null`.

**Normal behavior** — MAPE is populated after the first forecast run that includes validation data. No action required on a fresh deployment.

---

### i18n keys missing (displays raw key string)

**Symptom:** UI shows `ai.platform.modelsActive` instead of translated text.

**Fix:** The `add_ai_i18n.py` script (in `/tmp/`) adds all required keys. Re-run if needed:
```bash
python3 /tmp/add_ai_i18n.py
```

After updating locale files, the frontend hot-reloads automatically in dev, or rebuild for production:
```bash
docker compose exec frontend npm run build
docker compose restart frontend
```

---

## Appendix: Key File Locations

| File | Description |
|---|---|
| `ai-engine/routers/forecast.py` | Forecast API router |
| `ai-engine/routers/anomaly_v2.py` | Anomaly Detection v2 router |
| `ai-engine/routers/explain_v2.py` | SHAP Explainability v2 router |
| `ai-engine/models/foundation_forecaster.py` | FoundationForecaster (Chronos/Prophet/SF) |
| `ai-engine/models/autoencoder.py` | AnomalyAutoEncoder (PyTorch) |
| `ai-engine/explainability/explain_engine.py` | SHAP explain core |
| `ai-engine/ab_testing/canary.py` | SHADOW/ADVISORY/AUTO canary pipeline |
| `ai-engine/trained_models/` | Persisted anomaly models |
| `frontend/src/components/ai/` | All AI Vue components |
| `frontend/src/views/dashboard/components/AiPlatformCard.vue` | Dashboard AI card |
| `frontend/src/views/ai-models/AiModelRegistryView.vue` | Model registry view |
| `frontend/src/locales/*.json` | i18n locale files (11 languages) |

---

*Generated by AzureBot (DE #3) — DataMesh Engineering*
