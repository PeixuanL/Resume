# XGBoost Feature Schema (Fault Risk / Alert Scoring)

**Purpose**: supervised scoring for alert priority / fault risk. Not replacing anomaly detection.

## 1) Model I/O
- **Input**: feature vector per sample window
- **Output**: `fault_prob` (0–1), `risk_score` (0–100), optional `root_cause_hint`

## 2) Sample window
- Default window: **last 30–60 min** (configurable)
- Sampling: aggregate statistics from time-series in the window
- One sample = one alert (or one equipment snapshot)

## 3) Feature groups

### A) Basic statistics (per sensor)
- `mean`, `std`, `min`, `max`, `p25`, `p50`, `p75`
- `skew`, `kurtosis`
- `range` (= max-min)

### B) Dynamics / trend
- `trend_slope` (linear fit)
- `diff_mean`, `diff_std` (first difference)
- `spike_count` (|z| > 3)
- `zero_crossings` (for vibration/current)

### C) Context / operation
- `load_pct`
- `ambient_temp`
- `operating_mode` (startup/steady/shutdown/idle) → one-hot
- `time_of_day` (hour bucket) → one-hot
- `is_weekend`

### D) Equipment meta
- `equipment_type` → one-hot
- `equipment_id_hash` (optional, for equipment-specific behavior)
- `rated_power_kw` (if available)
- `age_years` (if available; **not** “expert years”)

### E) Cross-system / correlated
- `upstream_pressure_mean`
- `downstream_flow_mean`
- `related_alert_count`

## 4) Default sensor list
- **compressor**: vibration, temperature, pressure, current
- **ahu**: supply_temp, return_temp, fan_vibration, pressure, current
- **pump**: vibration, pressure, flow, current
- **chiller**: supply_temp, return_temp, pressure, current
- **elevator**: vibration, temperature, current
- **transformer**: oil_temp, load_ratio, current

## 5) Label definition (supervised)
- `1` = confirmed fault / high-priority alert
- `0` = false positive / low-priority / auto-cleared

## 6) Notes
- Missing features: fill with `NaN`, XGBoost handles missing
- Use **standardized** features if mixing units
- Keep feature order consistent; store `feature_names` in metadata
