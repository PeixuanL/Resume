# Simulation 用户指南

> **定位说明：** 本文档是 Simulation 模块的 **AI Engine API 参考手册**，而非独立的前端用户指南。
> 
> **前端入口：** 仿真功能分布在各业务模块中：
> - `/trafficops/sim` → TrafficOps DES 仿真列表
> - `/semiops/simulation/cleanroom` → 洁净室仿真
> - `/semiops/simulation/smt` → SMT 产线仿真
> - `/trafficops/evacuation` → 疏散仿真
> - `/trafficops/whatif` → What-If 分析

---

## Overview

仿真模块提供基于数字孪生的设施运营仿真与优化能力。通过离散事件仿真（DES）、实验设计（DOE）、敏感性分析和多目标优化，帮助管理者在不影响实际运营的前提下探索最优方案。

核心能力链路：

```
DES 仿真 → DOE 实验 → 敏感性分析 → 多目标优化 → 结果对比
```

---

## Navigation — 前端导航

| 路由 Path | 页面 Page | 模块归属 |
|---|---|---|
| `/trafficops/sim` | DES 仿真列表 | TrafficOps |
| `/trafficops/sim/new` | 新建仿真 | TrafficOps |
| `/trafficops/sim/:id` | 仿真详情 | TrafficOps |
| `/trafficops/sim/compare` | 仿真对比 | TrafficOps |
| `/trafficops/sim/analysis` | 仿真统计分析 | TrafficOps |
| `/trafficops/evacuation` | 疏散仿真 | TrafficOps |
| `/trafficops/whatif` | What-If 分析 | TrafficOps |
| `/semiops/simulation/cleanroom` | 洁净室仿真 | SemiOps |
| `/semiops/simulation/smt` | SMT 产线仿真 | SemiOps |
| `/trafficops/3d-view` | 3D 场景视图 | TrafficOps |

---

## DES (Discrete Event Simulation)

### 接口

```
POST /ai/des/run
```

### 说明

离散事件仿真引擎将设施运营建模为事件驱动的流程网络，支持多种场景类型的仿真。

### 场景类型（Scene Types）

| 场景 | 说明 | 典型用途 |
|------|------|----------|
| `elevator-dispatch` | 电梯调度仿真 | 优化电梯分组和调度策略 |
| `hvac-scheduling` | 暖通排程仿真 | 冷机启停时序和负荷分配优化 |
| `maintenance-routing` | 维保路线仿真 | 维保人员排班与路线优化 |
| `emergency-evacuation` | 应急疏散仿真 | 疏散路径和时间评估 |
| `energy-demand` | 能源需求仿真 | 用电峰谷预测与削峰填谷策略 |
| `crowd-flow` | 人流仿真 | 大堂/通道客流瓶颈分析 |

### DAG（有向无环图）

仿真流程以 DAG 结构定义事件之间的依赖关系：

```json
{
  "nodes": [
    { "id": "arrival", "type": "source", "distribution": "poisson", "rate": 120 },
    { "id": "lobby-queue", "type": "queue", "capacity": 50 },
    { "id": "elevator-service", "type": "server", "count": 6, "serviceTime": { "distribution": "uniform", "min": 30, "max": 90 } },
    { "id": "floor-exit", "type": "sink" }
  ],
  "edges": [
    { "from": "arrival", "to": "lobby-queue" },
    { "from": "lobby-queue", "to": "elevator-service" },
    { "from": "elevator-service", "to": "floor-exit" }
  ]
}
```

### 6 种调度策略（Dispatch Strategies）

| 策略 | 说明 |
|------|------|
| `fcfs` | 先到先服务（First Come First Served） |
| `shortest-queue` | 最短队列优先 |
| `nearest-car` | 最近轿厢响应 |
| `zone-based` | 分区调度（高/低区分组） |
| `ai-predictive` | AI 预测性调度（基于历史客流预测） |
| `energy-optimal` | 能耗最优调度（最小化总能耗） |

### 请求示例

```json
{
  "sceneType": "elevator-dispatch",
  "dispatchStrategy": "ai-predictive",
  "duration": 86400,
  "warmup": 3600,
  "replications": 30,
  "seed": 42,
  "dag": { "...": "见上述 DAG 结构" },
  "parameters": {
    "elevatorCount": 6,
    "floorCount": 25,
    "peakHourRate": 200
  }
}
```

### 响应示例

```json
{
  "jobId": "des-20260218-001",
  "status": "completed",
  "metrics": {
    "avgWaitTime": 32.5,
    "maxWaitTime": 145.0,
    "throughput": 2850,
    "utilization": 0.72,
    "energyConsumption": 485.3
  },
  "confidence95": {
    "avgWaitTime": [30.1, 34.9]
  },
  "replications": 30
}
```

---

## DOE (Design of Experiments)

### 接口

```
POST /ai/doe/run
```

### 说明

实验设计模块自动构建参数空间的实验矩阵，系统化地探索不同参数组合对仿真结果的影响。

### 支持的实验设计方法

| 方法 | 说明 | 适用场景 |
|------|------|----------|
| `full-factorial` | 全因子设计 | 参数少（≤4），需完整交互效应 |
| `fractional-factorial` | 部分因子设计 | 参数较多，筛选主效应 |
| `latin-hypercube` | 拉丁超方抽样 | 连续参数空间的高效采样 |
| `central-composite` | 中心复合设计 | 二阶响应面建模 |

### 请求示例

```json
{
  "baseSceneType": "hvac-scheduling",
  "method": "latin-hypercube",
  "sampleSize": 100,
  "factors": [
    { "name": "chiller_count", "type": "discrete", "levels": [2, 3, 4] },
    { "name": "setpoint_temp", "type": "continuous", "min": 22.0, "max": 26.0 },
    { "name": "start_hour", "type": "continuous", "min": 6.0, "max": 9.0 },
    { "name": "ramp_rate", "type": "continuous", "min": 0.5, "max": 2.0 }
  ],
  "responses": ["energy_cost", "comfort_score", "peak_demand"]
}
```

### 响应示例

```json
{
  "jobId": "doe-20260218-001",
  "status": "completed",
  "experiments": 100,
  "completedExperiments": 100,
  "bestResult": {
    "factors": { "chiller_count": 3, "setpoint_temp": 24.5, "start_hour": 7.5, "ramp_rate": 1.2 },
    "responses": { "energy_cost": 1250, "comfort_score": 92.3, "peak_demand": 380 }
  },
  "effectSummary": {
    "energy_cost": { "most_influential": "setpoint_temp", "r_squared": 0.87 }
  }
}
```

---

## Sensitivity Analysis

### 接口

```
POST /ai/sensitivity/analyze
```

### 说明

敏感性分析量化各输入参数对输出结果的影响程度，支持两种主流方法：

### 分析方法

| 方法 | 说明 | 特点 |
|------|------|------|
| **Sobol** | 基于方差分解的全局敏感性分析 | 可计算一阶、二阶及全阶敏感性指数，精度高但计算量大 |
| **Morris** | 基于 Elementary Effects 的筛选方法 | 计算效率高，适合初步筛选重要参数，结果为定性排序 |

### 请求示例

```json
{
  "method": "sobol",
  "baseSceneType": "elevator-dispatch",
  "sampleSize": 1024,
  "factors": [
    { "name": "elevatorCount", "min": 4, "max": 8 },
    { "name": "peakHourRate", "min": 100, "max": 300 },
    { "name": "floorCount", "min": 15, "max": 40 },
    { "name": "dispatchDelay", "min": 0, "max": 5 }
  ],
  "response": "avgWaitTime",
  "confidenceLevel": 0.95
}
```

### 响应示例

```json
{
  "jobId": "sa-20260218-001",
  "method": "sobol",
  "response": "avgWaitTime",
  "indices": [
    { "factor": "peakHourRate", "S1": 0.45, "ST": 0.52, "rank": 1 },
    { "factor": "elevatorCount", "S1": 0.32, "ST": 0.38, "rank": 2 },
    { "factor": "floorCount", "S1": 0.12, "ST": 0.18, "rank": 3 },
    { "factor": "dispatchDelay", "S1": 0.05, "ST": 0.09, "rank": 4 }
  ],
  "interactions": [
    { "factors": ["peakHourRate", "elevatorCount"], "S2": 0.08 }
  ]
}
```

### 指标说明

- **S1（一阶指数）**：单个参数独立对输出方差的贡献
- **ST（全阶指数）**：包含与其他参数交互作用的总贡献
- **S2（二阶指数）**：两参数交互对输出方差的贡献
- ST - S1 差值越大，说明该参数与其他参数的交互效应越显著

---

## Optimization

### 接口

```
POST /ai/optimize/{module}
```

其中 `{module}` 可为：`elevator-dispatch`、`hvac-scheduling`、`maintenance-routing` 等。

### 说明

优化模块采用 **NSGA-II**（Non-dominated Sorting Genetic Algorithm II）多目标进化优化算法，在多个互相冲突的目标之间寻找 Pareto 最优解集。

### NSGA-II 参数配置

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `populationSize` | 种群大小 | 100 |
| `generations` | 进化代数 | 200 |
| `crossoverRate` | 交叉概率 | 0.9 |
| `mutationRate` | 变异概率 | 0.1 |
| `seed` | 随机种子 | 随机 |

### 请求示例

```json
{
  "objectives": [
    { "name": "avgWaitTime", "direction": "minimize" },
    { "name": "energyConsumption", "direction": "minimize" },
    { "name": "throughput", "direction": "maximize" }
  ],
  "constraints": [
    { "name": "maxWaitTime", "operator": "<=", "value": 120 },
    { "name": "utilization", "operator": "<=", "value": 0.90 }
  ],
  "variables": [
    { "name": "elevatorCount", "type": "integer", "min": 4, "max": 8 },
    { "name": "dispatchStrategy", "type": "categorical", "values": ["fcfs", "shortest-queue", "nearest-car", "zone-based", "ai-predictive", "energy-optimal"] },
    { "name": "grouping", "type": "categorical", "values": ["single", "dual-zone", "triple-zone"] }
  ],
  "nsgaII": {
    "populationSize": 100,
    "generations": 200,
    "crossoverRate": 0.9,
    "mutationRate": 0.1
  }
}
```

### 响应示例

```json
{
  "jobId": "opt-20260218-001",
  "status": "completed",
  "paretoFront": [
    {
      "rank": 1,
      "variables": { "elevatorCount": 6, "dispatchStrategy": "ai-predictive", "grouping": "dual-zone" },
      "objectives": { "avgWaitTime": 28.3, "energyConsumption": 420, "throughput": 3100 }
    },
    {
      "rank": 2,
      "variables": { "elevatorCount": 5, "dispatchStrategy": "energy-optimal", "grouping": "dual-zone" },
      "objectives": { "avgWaitTime": 35.1, "energyConsumption": 365, "throughput": 2850 }
    }
  ],
  "totalEvaluations": 20000,
  "convergenceGeneration": 145
}
```

### 使用说明

- Pareto 前沿上的每个解都是"不被支配"的最优解，不存在所有目标都更好的其他解
- 用户可根据实际偏好从 Pareto 解集中选择最适合的方案
- 支持设置约束条件排除不可行方案

---

## Results Visualization

仿真结果可视化提供多种图表类型，帮助直观理解仿真输出：

| 图表类型 | 适用场景 | 说明 |
|----------|----------|------|
| 时序图 | DES 结果 | 展示指标随仿真时间的变化 |
| 热力图 | DOE 结果 | 展示双因子交互对响应的影响 |
| 龙卷风图 | 敏感性分析 | 按影响大小排序展示各参数敏感性 |
| Pareto 散点图 | 优化结果 | 展示 Pareto 前沿上的解分布 |
| 箱线图 | DES 多次复制 | 展示多次仿真运行的分布特征 |
| 平行坐标图 | 优化结果 | 多维度同时对比多个 Pareto 解 |

所有图表支持：
- 交互式缩放和平移
- 数据点悬停提示
- 导出为 PNG/SVG 格式
- 嵌入到报告 PDF 中

---

## Comparison

方案对比功能支持将多次仿真或优化结果放在一起对比分析。

### 功能说明

- **并排对比**：选择 2-4 个仿真结果进行并排图表对比
- **差异高亮**：自动标注各方案之间差异显著的指标
- **综合评分**：基于用户定义的权重对各方案进行综合打分排序
- **方案推荐**：AI 根据对比结果和用户偏好推荐最佳方案

### 对比维度

| 维度 | 说明 |
|------|------|
| 性能指标 | 等待时间、吞吐量、响应速度等 |
| 能耗指标 | 总能耗、峰值功率、能效比 |
| 成本指标 | 运营成本、设备投资、人力成本 |
| 可靠性指标 | 设备利用率、故障率、可用率 |

### 使用建议

- 先通过 DES 建立基准仿真，再通过 DOE 和优化探索改进方案
- 使用敏感性分析缩小关键参数范围，减少优化搜索空间
- 最终方案对比时，邀请相关干系人共同评审，结合业务判断选择
