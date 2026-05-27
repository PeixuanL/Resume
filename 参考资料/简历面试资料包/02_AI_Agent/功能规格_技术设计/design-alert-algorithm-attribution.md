# 告警算法归因设计 v2 — 行业模块级

## 问题

告警详情缺少"用了什么算法、怎么得到结果"的透明度。这不是基盘的问题——**每个行业模块的检测算法完全不同**，归因逻辑必须在模块层面实现。

## 架构原则

```
┌─────────────────────────────────────────────────────────┐
│ 基盘 AlertDetailDrawer (通用)                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 严重度 · 设备 · 置信度 · 描述 · 建议操作 · 时间线  │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ <slot name="module-attribution" />                  │ │
│ │  ↑ 各模块注入自己的归因组件                         │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ XGBoost 风险评估 (通用) · AI 诊断 (通用)            │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

- **基盘**只提供 `detection_metadata` JSONB 字段 + 渲染插槽
- **每个行业模块**注册自己的归因组件，解读自己写入的 metadata
- 模块未注册时 → 插槽为空，不显示归因卡（向后兼容）

## 各模块检测算法矩阵

| 模块 | 检测场景 | 算法栈 | 关键参数 |
|------|---------|--------|---------|
| **FMS** | 冷机COP衰减 | AutoEncoder重构误差 + 自适应阈值(EWMA) | AE特征数=6, EWMA λ=0.2 |
| | AHU滤网堵塞 | 运行时间阈值 + 压差趋势线性回归 | 压差斜率>0.5Pa/天 |
| | 电梯振动 | Z-Score + Isolation Forest 集成 | z>3σ, IF contamination=5% |
| **HeatOps** | 管网温差异常 | CUSUM 累积偏差 + 时序预测(Prophet) | CUSUM h=5σ, k=0.5σ |
| | 流量不平衡 | SPC 控制图 + 自适应阈值 | UCL/LCL ±3σ, 24h校准 |
| | 户控阀异常 | 模糊逻辑 + 规则引擎 | 供回温差<2°C 且阀位>80% |
| **SemiOps** | 洁净室粒子突变 | Isolation Forest + 指数加权移动平均 | IF n=200, EWMA span=12 |
| | 良率偏移 | CUSUM + Western Electric 规则 | 连续7点同侧=告警 |
| | 温湿度耦合异常 | 多变量 Mahalanobis 距离 | χ²阈值, df=传感器数 |
| **TrafficOps** | 排队拥堵 | 统计预测(ARIMA) + DES仿真对比 | 实际/预测比>1.5 |
| | 通道异常关闭 | 心跳超时 + 状态机 | 3次失败=告警 |
| **PDM** | 轴承退化 | XGBoost 13维特征 + SHAP | top3贡献因子 |
| | 振动频谱异常 | FFT峰值检测 + 包络分析 | 特征频率±5%匹配 |
| | RUL预测 | Attention-LSTM 时序预测 | 预测窗口=30天 |
| **Energy** | PUE异常 | EWMA + 季节性分解(STL) | 残差>2σ |
| | 负载预测偏差 | 实际vs预测对比 | MAPE>15%=告警 |
| **ESG** | 排放超标 | 阈值规则 + 趋势预测 | 法规限值, 7天趋势 |
| **VisionOps** | 缺陷检测 | YOLOv8 目标检测 + 分类置信度 | conf>0.7, IoU>0.5 |
| **GM-Compliance** | 合规偏离 | 规则引擎 + 文档NLP分析 | 条款匹配度<80% |

## 数据模型

### `alerts` 表扩展

```sql
-- V195__alert_detection_metadata.sql
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS detection_metadata JSONB;
COMMENT ON COLUMN alerts.detection_metadata IS 
  'Module-specific detection metadata: algorithms used, scores, parameters, sensor snapshots';

CREATE INDEX idx_alerts_detection_pipeline 
  ON alerts ((detection_metadata->>'pipeline')) 
  WHERE detection_metadata IS NOT NULL;
```

### metadata 结构 — 模块自定义，公共信封

```json
{
  "_version": 1,
  "module": "heatops",
  "pipeline": "heatops_network_anomaly_v1",
  "generated_at": "2026-03-14T12:00:00Z",

  "algorithms": [
    {
      "name": "cusum",
      "display": { "en": "CUSUM Cumulative Sum", "zh": "CUSUM累积和", "ja": "CUSUM累積和" },
      "score": 0.87,
      "verdict": "ANOMALY",
      "params": { "h": 5.0, "k": 0.5, "unit": "sigma" },
      "detail": { "en": "Cumulative deviation exceeded 5σ threshold after 23 consecutive readings", "zh": "连续23个读数累积偏差超过5σ阈值" }
    },
    {
      "name": "prophet_forecast",
      "display": { "en": "Prophet Time Series Forecast", "zh": "Prophet时序预测", "ja": "Prophet時系列予測" },
      "score": 0.72,
      "verdict": "WARNING",
      "params": { "forecast_horizon": "6h", "confidence_interval": 0.95 },
      "detail": { "en": "Actual supply temp 82°C vs predicted 71°C (15.5% deviation)", "zh": "实际供水温度82°C vs 预测71°C (偏差15.5%)" }
    }
  ],

  "ensemble": {
    "method": "max",
    "final_score": 0.87,
    "threshold": 0.70,
    "threshold_source": "adaptive_spc"
  },

  "sensor_snapshot": [
    { "sensor": "supply_temp", "actual": 82.0, "expected": 71.0, "unit": "°C", "deviation_pct": 15.5 },
    { "sensor": "return_temp", "actual": 55.0, "expected": 52.0, "unit": "°C", "deviation_pct": 5.8 },
    { "sensor": "flow_rate", "actual": 120, "expected": 145, "unit": "m³/h", "deviation_pct": -17.2 }
  ],

  "model_info": {
    "model_id": "prophet_heatops_supply_v2",
    "trained_at": "2026-03-10T02:00:00Z",
    "samples": 12960,
    "valid_until": "2026-03-17T02:00:00Z"
  },

  "context": {
    "operating_mode": "heating_season",
    "outdoor_temp": -5.2,
    "time_period": "morning_ramp"
  }
}
```

## 前端架构

### 模块归因组件注册

```typescript
// modules/registry.ts — 扩展 ModuleDefinition
interface ModuleDefinition {
  // ... 现有字段 ...
  alertAttribution?: () => Promise<{ default: Component }>  // 懒加载归因组件
}

// modules/heatops/index.ts
const heatopsModule: ModuleDefinition = {
  id: 'heatops',
  // ...
  alertAttribution: () => import('./components/HeatOpsAttribution.vue'),
}
```

### AlertDetailDrawer 改造

```vue
<!-- AlertDetailDrawer.vue 新增插槽 -->
<template v-if="attributionComponent && alert.detectionMetadata">
  <component
    :is="attributionComponent"
    :metadata="alert.detectionMetadata"
    :alert="alert"
  />
</template>
<div v-else-if="alert.detectionMetadata" class="generic-attribution">
  <!-- 通用降级渲染：直接展示 JSON 中的 algorithms 数组 -->
  <GenericAttributionCard :metadata="alert.detectionMetadata" />
</div>
```

### 各模块归因组件

#### HeatOps — `HeatOpsAttribution.vue`

```
┌─────────────────────────────────────────────────┐
│ 🔥 供热异常检测归因                              │
├─────────────────────────────────────────────────┤
│ 管线: heatops_network_anomaly_v1                │
│                                                 │
│ ① CUSUM 累积和检测         分数: 87% ⚠️          │
│   连续23个读数累积偏差超过5σ阈值                  │
│   参数: h=5σ, k=0.5σ                            │
│                                                 │
│ ② Prophet 时序预测          分数: 72% ⚠️          │
│   实际供水温度 82°C vs 预测 71°C                  │
│   偏差: +15.5%   预测窗口: 6小时                  │
│                                                 │
│ 📷 传感器偏差                                    │
│ supply_temp  82°C / 71°C  ████████████░ +15.5%  │
│ return_temp  55°C / 52°C  ████░░░░░░░░░  +5.8%  │
│ flow_rate    120  / 145   ████████░░░░░ -17.2%  │
│                                                 │
│ 🌡️ 采暖季 · 室外-5.2°C · 早间升温期              │
└─────────────────────────────────────────────────┘
```

#### PDM — `PdmAttribution.vue`

```
┌─────────────────────────────────────────────────┐
│ ⚙️ 预测性维护检测归因                             │
├─────────────────────────────────────────────────┤
│ 管线: pdm_bearing_degradation_v1                │
│                                                 │
│ ① XGBoost 风险评分          分数: 91% 🔴          │
│   13维特征提取 → 故障概率预测                     │
│   Top 贡献: vibration_std (+0.23)               │
│             speed_range (+0.18)                  │
│             temp_kurtosis (+0.12)                │
│                                                 │
│ ② SHAP 可解释性分析                              │
│   [====== 瀑布图 (复用现有 AnomalyWaterfall) ====]│
│                                                 │
│ ③ Attention-LSTM RUL 预测   剩余寿命: 18天        │
│   预测窗口=30天 | 置信区间: 12-24天               │
│                                                 │
│ 📊 频谱分析                                      │
│   BPFO=87.3Hz (匹配外圈故障特征频率 ±2.1%)       │
│   [====== FFT 频谱图 ======]                     │
└─────────────────────────────────────────────────┘
```

#### SemiOps — `SemiOpsAttribution.vue`

```
┌─────────────────────────────────────────────────┐
│ 🏭 半导体环境异常归因                             │
├─────────────────────────────────────────────────┤
│ 管线: semiops_cleanroom_particle_v1             │
│                                                 │
│ ① Isolation Forest          分数: 88% ⚠️         │
│   n_estimators=200, contamination=3%            │
│   粒子浓度偏离正常分布                            │
│                                                 │
│ ② EWMA 指数加权移动平均     分数: 79% ⚠️         │
│   span=12, 当前值超出控制限                       │
│                                                 │
│ ③ Mahalanobis 多变量距离    D²=18.7 (阈值=12.6)  │
│   温度+湿度+粒子数联合偏离                        │
│                                                 │
│ 📷 洁净室传感器                                   │
│ 0.5μm粒子  3200/m³ / 1800/m³   ████████ +77.8% │
│ 温度       22.8°C / 22.0°C     ██░░░░░░  +3.6% │
│ 湿度       48.2%  / 45.0%      ███░░░░░  +7.1% │
│                                                 │
│ ISO等级: 当前=Class 6 (正常=Class 5) ⚠️ 降级      │
└─────────────────────────────────────────────────┘
```

#### 通用降级 — `GenericAttributionCard.vue`

对没有专属归因组件的模块，直接渲染 `detection_metadata.algorithms` 数组：

```
┌─────────────────────────────────────────────────┐
│ 🧮 检测算法归因                                   │
├─────────────────────────────────────────────────┤
│ 管线: {pipeline}                                │
│ 综合分: {final_score}% | 阈值: {threshold}%     │
│                                                 │
│ {算法1.display} ............ {score}% {verdict}  │
│   {detail}                                      │
│ {算法2.display} ............ {score}% {verdict}  │
│   {detail}                                      │
└─────────────────────────────────────────────────┘
```

## 实施计划

| 阶段 | 内容 | 工作量 |
|------|------|--------|
| **Phase 1: 基础设施** | | |
| 1a | Flyway V195 迁移 + Alert.java `detectionMetadata` JSONB | 0.5天 |
| 1b | AI Engine `DetectionMetadata` 公共信封 schema | 0.5天 |
| 1c | `GenericAttributionCard.vue` 通用降级组件 | 0.5天 |
| 1d | `AlertDetailDrawer` 插槽 + 模块组件动态加载 | 0.5天 |
| **Phase 2: HeatOps 模块** (供热客户急需) | ✅ DONE | |
| 2a | `HeatOpsAttribution.vue` — CUSUM/Prophet/SPC, 传感器网格, 采暖季上下文 | ✅ |
| **Phase 3: PDM 模块** (横河客户) | ✅ DONE | |
| 3a | `PdmAttribution.vue` — XGBoost SHAP, LSTM RUL 倒计时, FFT 故障频率 | ✅ |
| **Phase 4: FMS 模块** | ✅ DONE | |
| 4a | `FmsAttribution.vue` — 子系统徽章(冷机/AHU/电梯), COP/振动/压差 | ✅ |
| **Phase 5: SemiOps 模块** | ✅ DONE | |
| 5a | `SemiOpsAttribution.vue` — ISO 等级降级指示器, IF/EWMA/Mahalanobis, 粒子/温湿度网格 | ✅ |
| **Phase 6: 其余模块** | TODO | |
| 6a | TrafficOps / Energy / ESG / VisionOps 归因 | 2天 |
| **总计已完成** | Phase 1-5 | **~4天** |

### 优先级建议

Phase 1 (基础设施) → Phase 3 (HeatOps，供热客户) → Phase 5 (PDM，横河) → Phase 2 (FMS) → Phase 4 (SemiOps) → Phase 6

## 关键原则

1. **模块自治**: 每个模块定义自己的算法、参数、归因展示方式
2. **公共信封**: `detection_metadata` JSON 结构有统一的 `_version` + `module` + `algorithms[]` + `sensor_snapshot[]` 信封
3. **渐进披露**: 归因卡默认折叠，运维人员日常不需要看算法细节
4. **向后兼容**: `detection_metadata = null` 时完全不显示归因卡
5. **可审计**: metadata 随告警持久化，事后可追溯检测过程
6. **国际化**: 每个算法的 `display` 和 `detail` 字段都是多语言 map
