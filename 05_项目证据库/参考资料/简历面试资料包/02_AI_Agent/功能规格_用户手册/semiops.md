# SemiOps 用户指南 — User Guide

**版本 Version:** 2026-02-27  
**维护 Maintained by:** AzureBot (DataMesh)  
**适用对象 Audience:** 客户、售前、内部团队

---

## 目录 Table of Contents

1. [模块概述 Module Overview](#1-模块概述-module-overview)
2. [洁净室管理 Cleanroom Management](#2-洁净室管理-cleanroom-management)
3. [环境监测与预测 Environment Monitoring & Prediction](#3-环境监测与预测-environment-monitoring--prediction)
4. [SMT产线管理 SMT Line Management](#4-smt产线管理-smt-line-management)
5. [能源管理 Energy Management](#5-能源管理-energy-management)
6. [设备健康与预测性维护 Equipment Health & Predictive Maintenance](#6-设备健康与预测性维护-equipment-health--predictive-maintenance)
7. [合规管理 Compliance Management](#7-合规管理-compliance-management)
8. [决策中心 Decision Center](#8-决策中心-decision-center)
9. [AI Advisor 智能顾问](#9-ai-advisor-智能顾问)
10. [附录 Appendix](#10-附录-appendix)

---

## 1. 模块概述 Module Overview

### 1.1 什么是 SemiOps？

**SemiOps**（半导体智能运营模块）是 DataMesh Factverse 平台专为半导体制造业设计的 AI 运营管理模块。集成洁净室管理、SMT 产线、能源监控、设备维护、合规管理于一体，通过 AI 引擎实现实时分析、趋势预测与智能决策。

**目标行业：**
- 半导体 Fab（晶圆制造、封测）
- PCB / FPC 柔性电路板工厂
- 电子制造（EMS）服务商

**核心价值主张：**
- 洁净室 ISO 合规实时评估，降低违规风险
- 环境参数 AI 预测，提前 2 小时预警偏移
- SMT 产线 OEE 可视化，缺陷根因快速定位
- 设备健康评分 + 预测性维护，减少非计划停机
- PUE 能效持续优化，降低运营成本

### 1.2 系统架构 System Architecture

```
用户浏览器 (Vue 3 Frontend)
       │
       ▼
Backend API  (port 8080 · Bearer Token)
  └── GET /api/v1/semiops/*
       │
       ├──► Database (PostgreSQL · 历史数据 / 设备台账)
       │
       └──► AI Engine  (port 8000 · X-API-Key)
              └── POST /ai/semiops/*
                  ├── 环境预测 (env-predict)
                  ├── 振动评估 (vibration-assess)
                  ├── 缺陷分类 (defect-classify)
                  ├── PUE分析 (pue / pue/trend)
                  └── ISO合规 (iso-assess)
```

### 1.3 导航结构 Navigation

| 路由 Path | 页面 Page |
|---|---|
| `/semiops/dashboard` | 总览仪表盘 |
| `/semiops/cleanrooms` | 洁净室列表 |
| `/semiops/cleanrooms/:id` | 洁净室详情 |
| `/semiops/environment` | 环境监测 |
| `/semiops/environment/correlation` | 环境关联分析 |
| `/semiops/environment/prediction` | 环境趋势预测 |
| `/semiops/environment/soft-sensor` | 软传感器 |
| `/semiops/smt` | SMT产线总览 |
| `/semiops/smt/defects` | SMT缺陷分析 |
| `/semiops/yield` | 良率 & OEE |
| `/semiops/simulation/cleanroom` | 洁净室仿真 |
| `/semiops/simulation/smt` | SMT仿真 |
| `/semiops/energy` | 能源 PUE |
| `/semiops/energy/breakdown` | 能耗分项 |
| `/semiops/energy/utilities` | 公用设施 |
| `/semiops/maintenance/health` | 设备健康 |
| `/semiops/vibration` | 振动分析 |
| `/semiops/maintenance/filters` | 滤网寿命 |
| `/semiops/maintenance/schedule` | 预防性维护 |
| `/semiops/compliance` | ISO合规 |
| `/semiops/compliance/reports` | 合规报告 |
| `/semiops/decision-center` | 决策中心 |

---

## 2. 洁净室管理 Cleanroom Management

### 2.1 功能页面

- **Dashboard** (`/semiops/dashboard`): 跨洁净室汇总状态、实时告警、SMT状态、当前PUE
- **Cleanroom List** (`/semiops/cleanrooms`): 所有洁净室清单，含ISO等级、在线状态、当前粒子计数
- **Cleanroom Detail** (`/semiops/cleanrooms/:id`): 单个洁净室完整信息——尺寸、设备、粒子趋势、ISO评估历史
- **Cleanroom Simulation** (`/semiops/simulation/cleanroom`): 调整换气次数(ACH)、HEPA配置，仿真粒子浓度变化

### 2.2 Use Case UC1：实时粒子计数监控与ISO 14644合规预警

**描述：** 持续监控洁净室各测量点粒子计数（≥0.5μm、≥1.0μm、≥5.0μm），与ISO 14644-1等级阈值对比，超标时即时告警。

**操作步骤：**
1. 进入 `Cleanroom List`，查看各洁净室 `status` 字段（NORMAL / WARNING / CRITICAL）
2. 点击目标洁净室，进入 `Detail` 页，查看 `particles` 图表（API: `GET /cleanrooms/{id}/particles?hours=24`）
3. 粒子计数接近或超过 ISO 等级上限时，页面顶部显示黄色/红色告警横幅
4. 点击告警查看 AI Engine 分析结果（API: `POST /ai/semiops/particle-monitor`，返回 `threshold_breached`, `iso_class`, `affected_zones`）

**预期结果：** 工程师在粒子超标后 <5 分钟内收到告警，并获得受影响区域列表及建议处置动作。

---

### 2.3 Use Case UC2：环境参数异常关联分析

**描述：** 洁净室温湿度、压差异常时，系统自动关联粒子计数与人员操作记录，辅助定位根因。

**操作步骤：**
1. 进入 `Environment Monitor`，观察温湿度与压差趋势
2. 若发现异常时段，跳转至 `Env Correlation`（API: `POST /ai/semiops/env-correlate`）
3. 选择目标洁净室、时间窗口，点击"分析"，AI 返回各参数的 `pearson_r` 相关系数矩阵
4. 关联度 >0.7 的参数对高亮显示，可下钻查看散点图

**预期结果：** 10 分钟内识别出强相关参数（如湿度升高 ↔ 粒子计数升高），为工艺调整提供数据依据。

---

### 2.4 Use Case UC3：洁净室仿真 — ACH对粒子浓度的影响

**描述：** 在不影响生产的情况下，仿真不同换气次数(Air Changes per Hour, ACH)对粒子浓度的影响，辅助新洁净室设计或节能优化。

**操作步骤：**
1. 进入 `Cleanroom Simulation` (`/semiops/simulation/cleanroom`)
2. 输入参数：`cleanroom_id`、房间体积(m³)、当前粒子发生率、待测 ACH 范围（如 20–60 次/小时）
3. 点击"运行仿真"，系统调用 `POST /ai/semiops/particle-monitor`（仿真模式）
4. 查看粒子浓度 vs. ACH 曲线，找到满足目标 ISO 等级的最低 ACH（节能拐点）

**预期结果：** 输出推荐 ACH 值，附预期粒子浓度（粒/m³），帮助工程团队优化 FFU(Fan Filter Unit) 能耗。

---

### 2.5 场景案例 Scenario A：光刻间ISO 5级粒子超标

| 阶段 | 描述 |
|---|---|
| **触发条件** | CR-LTH(光刻间) ≥0.5μm 粒子计数升至 3,520 粒/m³（ISO 5 上限：3,520，已临界） |
| **系统响应** | Dashboard 显示 WARNING 告警；`particle-monitor` API 返回 `"iso_class": "ISO 5 BORDERLINE"` |
| **用户操作** | 工程师查看 `Cleanroom Detail` → 确认 Zone B 附近粒子最高 → 检查该区域 FFU 状态 |
| **AI建议** | `env-correlate` 分析显示 FFU 风速下降 15% 与粒子升高强相关（r=0.81） |
| **处置动作** | 调高 Zone B FFU 风速至设定值，30 分钟后粒子恢复 <1,000 粒/m³ |
| **业务价值** | 避免光刻工艺中断，预防批次报废（潜在损失 >$50K/批） |

---

### 2.6 场景案例 Scenario B：新洁净室IQ/OQ验证

| 阶段 | 描述 |
|---|---|
| **触发条件** | 新建 ISO 6 洁净室安装完成，需要在正式运行前进行 IQ（安装确认）/OQ（运行确认） |
| **系统响应** | 使用仿真功能预估所需 HEPA 数量和 ACH，无需反复实测 |
| **用户操作** | 在 `Cleanroom Simulation` 输入房间参数，运行 ACH=30/40/50 三组仿真 |
| **仿真结果** | ACH=40 时粒子浓度稳定在 ISO 6 范围，为最优配置 |
| **业务价值** | 缩短验证周期 ~30%，减少 HEPA 过度配置成本 |

---

## 3. 环境监测与预测 Environment Monitoring & Prediction

### 3.1 功能页面

- **Environment Monitor** (`/semiops/environment`): 温度、湿度、压差实时曲线
- **Env Correlation** (`/semiops/environment/correlation`): 多参数相关性热图与散点分析
- **Env Prediction** (`/semiops/environment/prediction`): 未来 1–8 小时环境参数预测
- **Pressure Monitor** (内嵌于 Environment Monitor): 各区域压差梯度监控
- **Soft Sensor** (`/semiops/environment/soft-sensor`): 虚拟传感器融合推算

### 3.2 Use Case UC4：多参数关联分析

**描述：** 通过 AI 关联分析，发现环境参数与工艺结果（良率、焊膏性能）之间的隐性关系。

**操作步骤：**
1. 进入 `Env Correlation`，选择分析参数（温度、湿度、压差、粒子数）和目标指标（如 SMT 良率）
2. 设置时间窗口（建议≥7天，覆盖足够生产批次），点击"计算关联"
3. API `POST /ai/semiops/env-correlate` 返回 `correlation_matrix`（含 `pearson_r` 和 `p_value`）
4. 热图中 |r| > 0.6 且 p < 0.05 的参数对标记为"显著相关"

**预期结果：** 输出参数对列表，如"温度 ↔ 良率 r=−0.73（显著负相关）"，为工艺窗口设定提供依据。

---

### 3.3 Use Case UC5：环境趋势预测 — 提前预警温度偏移

**描述：** 利用时序预测模型，提前 2 小时预警洁净室温度超出工艺窗口，为操作员预留处置时间。

**操作步骤：**
1. 进入 `Env Prediction`，选择洁净室和预测参数（温度/湿度）
2. 设置预测窗口（2h / 4h / 8h），点击"生成预测"
3. API `POST /ai/semiops/env-predict` 返回 `predicted_values`（时序）+ `confidence_interval`（95%置信区间）+ `breach_time`（若预计超限，返回预计违规时刻）
4. 若 `breach_time` 存在，系统发出预警，页面展示红色时间轴标注

**预期结果：** 操作员提前 ≥2 小时收到预警，有充足时间调整空调设定值，避免温度超限导致工艺异常。

---

### 3.4 Use Case UC6：压差梯度监控

**描述：** 洁净室间正压级联是防止外部污染进入的关键屏障，系统持续监控各区域间压差，确保梯度正常。

**操作步骤：**
1. 在 `Environment Monitor` 底部查看 Pressure 面板（API: `GET /environment/pressure`）
2. 系统显示各洁净室与相邻区域的压差值（Pa），标注目标范围（通常 5–15 Pa）
3. 若某区域压差低于阈值，AI Engine `POST /ai/semiops/pressure-check` 评估是否违反级联要求
4. 告警信息包括 `zone_name`、当前压差值、建议处置（如检查门缝密封/调整送排风比）

**预期结果：** 压差异常在 3 分钟内被检测，工程师收到包含位置和建议的结构化告警。

---

### 3.5 Use Case UC7：软传感器推算隐性指标

**描述：** 对于昂贵或难以直接测量的工艺参数（如某气体浓度、洁净室换气均匀度），通过软传感器融合温度、压差、风速等间接参数进行推算。

**操作步骤：**
1. 进入 `Soft Sensor`，选择目标虚拟传感器类型
2. 配置输入特征（间接测量参数列表）及校准参考数据
3. 点击"推算"，API `POST /ai/semiops/soft-sensor` 返回 `inferred_value`、`confidence`、`contributing_features`（各输入参数的重要性权重）
4. 推算值实时显示在监控面板，与直接测量值对比验证

**预期结果：** 软传感器输出精度（MAPE）在良好校准后可达 <5%，大幅降低实物传感器采购成本。

---

### 3.6 场景案例 Scenario C：夏季温度预警

| 阶段 | 描述 |
|---|---|
| **触发条件** | 夏季高温，室外温度 38°C，洁净室空调负荷接近峰值 |
| **系统响应** | `env-predict` 模型预测：洁净室温度将在 1h45min 后升至 23.5°C（工艺上限 23°C） |
| **用户操作** | 操作员收到预警，提前将空调设定值从 22°C 降至 21°C |
| **验证结果** | 实际温度峰值为 22.8°C，未超出工艺窗口 |
| **业务价值** | 避免温敏工艺（如光刻胶涂布）出现工艺偏移，保护批次良率 |

---

## 4. SMT产线管理 SMT Line Management

### 4.1 功能页面

- **SMT Overview** (`/semiops/smt`): 所有产线实时状态、OEE 汇总
- **SMT Defects** (`/semiops/smt/defects`): 缺陷分类 Pareto、趋势、根因分析
- **Yield & OEE** (`/semiops/yield`): OEE 三率（可用率A/性能P/良率Q）深度分析
- **SMT Simulation** (`/semiops/simulation/smt`): 产线瓶颈仿真与产能优化

### 4.2 Use Case UC8：产线OEE实时看板

**描述：** OEE（Overall Equipment Effectiveness）= Availability × Performance × Quality，是衡量产线综合效率的核心指标。系统实时计算并展示每条 SMT 线的 OEE 三率分解。

**操作步骤：**
1. 进入 `Yield & OEE`，从下拉菜单选择目标产线（API: `GET /smt/lines`）
2. 点击具体产线，系统调用 `GET /smt/lines/{id}/oee`，返回 `availability`、`performance`、`quality`、`oee_overall` 及各率的损失分类
3. 查看 OEE 瀑布图，识别主要损失来源（计划停机、换线、速度损失、缺陷返工等）
4. 选择时间范围进行 OEE 趋势对比（班次/日/周/月）

**预期结果：** 直观显示各产线 OEE 及主要损失项，使改善团队能快速锁定优先改善方向。行业基准：优秀 SMT 产线 OEE ≥85%。

---

### 4.3 Use Case UC9：缺陷分类与根因分析

**描述：** 对 AOI、AXI、ICT 检出的 SMT 缺陷自动分类，生成 Pareto 图，并通过 AI 关联贴片机参数偏移、焊膏印刷质量等根因。

**操作步骤：**
1. 进入 `SMT Defects`，选择时间范围和产线
2. API `GET /smt/defects?line_id=&start=&end=` 返回缺陷列表，含 `defect_type`（立碑/桥接/虚焊/少锡/冷焊/移位等）、`count`、`severity`
3. 点击"AI分析"，调用 `POST /ai/semiops/defect-classify`，返回 `pareto_ranking`、`dpmo` 值、`root_cause_candidates`
4. 展开根因分析，查看与缺陷强相关的工艺参数（如贴片压力、焊膏粘度、回焊曲线）

**预期结果：** Top 3 缺陷类型覆盖 ≥80% 缺陷数量（符合 Pareto 原则），每类缺陷附 1–3 个根因假设及验证建议。

---

### 4.4 Use Case UC10：SMT产线瓶颈仿真

**描述：** 通过数字孪生仿真识别 SMT 产线中 Cycle Time 最长的瓶颈工位，量化增加设备的产能提升和 ROI。

**操作步骤：**
1. 进入 `SMT Simulation`，输入产线参数（各工位 CT、设备数量、班制）
2. 运行现状仿真，`POST /ai/semiops/bottleneck-sim` 返回 `bottleneck_station`、`utilization_pct`、`throughput_per_hour`
3. 修改瓶颈工位参数（如新增一台回焊炉），重新仿真，对比产能提升量
4. 系统输出 ROI 估算（输入设备投资成本，返回回收期）

**预期结果：** 在采购决策前通过仿真验证，避免无效投资；典型案例中仿真精度误差 <5%。

---

### 4.5 场景案例 Scenario D：回焊炉瓶颈验证

| 阶段 | 描述 |
|---|---|
| **触发条件** | 产线每小时产量低于目标，OEE Performance 率仅 79% |
| **系统响应** | `bottleneck-sim` 识别回焊炉 utilization=99.6%，是唯一瓶颈工位 |
| **仿真验证** | 模拟增加第二台回焊炉：产能从 1,200 pcs/h → 1,580 pcs/h（+31.7%） |
| **ROI计算** | 设备投资 $180K，按每增量 PCB 利润 $0.12 计算，回收期约 14 个月 |
| **业务价值** | 采购决策有数据支撑，避免错误投资；产能提升有确定性预期 |

---

### 4.6 场景案例 Scenario E：立碑缺陷根因定位

| 阶段 | 描述 |
|---|---|
| **触发条件** | Line-2 AOI 检出立碑(Tombstone/Manhattan effect)缺陷率从 0.8% 升至 2.3% |
| **系统响应** | `defect-classify` 识别立碑为 Top 1 缺陷，DPMO=2,300（超出目标 1,000） |
| **AI根因分析** | 关联分析显示：某贴片机 Nozzle #4 贴片压力偏低 8g，与立碑强相关（r=0.78） |
| **处置动作** | 工程师重新校准 Nozzle #4 压力至标准值，当班缺陷率降回 0.6% |
| **业务价值** | 根因定位时间从 4 小时（人工排查）缩短至 35 分钟，减少缺陷批次报废 |

---

## 5. 能源管理 Energy Management

### 5.1 功能页面

- **Energy PUE** (`/semiops/energy`): PUE 实时值与历史趋势
- **Energy Breakdown** (`/semiops/energy/breakdown`): 能耗分项（COOLING / CDA / EXHAUST / LIGHTING / PRODUCTION）
- **Utilities** (`/semiops/energy/utilities`): 冷却水、压缩空气、排气等公用设施状态

### 5.2 Use Case UC11：PUE实时监控与趋势分析

**描述：** PUE（Power Usage Effectiveness）= 设施总能耗 / IT设备能耗，越接近 1.0 越高效。系统实时计算并记录 PUE，支持趋势分析与基准对比。

**操作步骤：**
1. 进入 `Energy PUE`，查看当前 PUE 值（API: `GET /energy/pue`，返回 `current_pue`、`target_pue`、`delta`）
2. 查看 PUE 历史趋势图（24h / 7d / 30d），识别周期性波动规律
3. 点击"AI趋势分析"，调用 `POST /ai/semiops/pue/trend`，返回 `trend_direction`、`contributing_factors`、`optimization_suggestions`
4. 对比行业基准（数据中心：优秀 <1.2；半导体Fab：典型 1.4–1.8）

**预期结果：** PUE 超出预警阈值时（如 > 1.8），系统发出告警并给出初步根因分析。

---

### 5.3 Use Case UC12：能耗分项计量

**描述：** 将工厂总能耗拆分至各系统（冷却、压缩干燥空气、排气、照明、生产设备），精确识别能耗大户，支持节能精准施策。

**操作步骤：**
1. 进入 `Energy Breakdown`，查看分项饼图/柱状图（API: `GET /energy/pue` 含 breakdown 字段）
2. 点击各分项查看日/月趋势，识别异常增长
3. 调用 `POST /ai/semiops/cop-optimize` 分析冷却系统 COP（制冷量/输入电能），返回 `current_cop`、`design_cop`、`efficiency_gap`、`recommendations`

**预期结果：** 工厂管理者能直观看到哪个系统能耗占比最高、近期是否异常，为节能改善排定优先级。

---

### 5.4 Use Case UC13：公用设施状态监控

**描述：** 冷却水塔、压缩空气站、排气系统等公用设施状态实时监控，支持分页查询维护记录。

**操作步骤：**
1. 进入 `Utilities`，查看设施列表（API: `GET /utilities?page=0&size=20`）
2. 每条记录含 `utility_type`、`status`（NORMAL/WARNING/CRITICAL）、`reading_value`、`unit`、`timestamp`
3. 翻页查看历史读数，过滤特定设施类型
4. 异常设施高亮显示，点击查看详情与历史告警记录

**预期结果：** 设施运维团队能快速定位异常设备，减少因公用设施故障导致的产线停机。

---

### 5.5 场景案例 Scenario F：PUE 异常上升

| 阶段 | 描述 |
|---|---|
| **触发条件** | PUE 从本月均值 1.55 上升至 1.72，触发 WARNING 告警 |
| **系统响应** | `pue/trend` 分析显示冷却系统能耗占比从 38% 升至 47% |
| **AI分析** | `cop-optimize` 返回：`current_cop=3.2`，`design_cop=4.5`，冷却塔效率下降 29% |
| **根因推断** | 冷却塔热交换效率下降，判断为填料堵塞或水垢积累 |
| **处置动作** | 安排冷却塔清洗作业；清洗后 COP 恢复至 4.3，PUE 降回 1.57 |
| **业务价值** | 每降低 0.1 PUE，对于 5MW 用电工厂节省约 ¥1.2M/年电费 |

---

## 6. 设备健康与预测性维护 Equipment Health & Predictive Maintenance

### 6.1 功能页面

- **Equipment Health** (`/semiops/maintenance/health`): 设备健康评分总览
- **Vibration Analysis** (`/semiops/vibration`): 振动频谱与 VC 曲线评级
- **Filter Life** (`/semiops/maintenance/filters`): HEPA/ULPA 滤网寿命预测
- **Predictive Maintenance** (`/semiops/maintenance/schedule`): 维护计划排程与逾期提醒

### 6.2 Use Case UC14：设备健康评分看板

**描述：** 综合运行状态、振动数据、维护历史、历史故障率，为每台关键设备生成 0–100 分的健康评分，提前识别潜在失效风险。

**操作步骤：**
1. 进入 `Equipment Health`（API: `GET /equipment/health`），查看设备健康评分列表
2. AI Engine `POST /ai/semiops/health-score` 计算 `health_score`、`risk_level`（LOW/MEDIUM/HIGH）、`degradation_trend`
3. 评分 <60 的设备显示为红色，60–79 为黄色，≥80 为绿色
4. 点击设备查看评分维度分解（运行时间得分、振动得分、维护合规得分、历史故障扣分）

**预期结果：** 维护团队能优先处理高风险设备，将非计划停机率降低 30–50%。

---

### 6.3 Use Case UC15：振动频谱分析

**描述：** 对泵、风机、压缩机等旋转设备持续采集振动数据，通过频谱分析识别轴承磨损、不平衡、共振等早期故障特征。

**操作步骤：**
1. 进入 `Vibration Analysis`（API: `GET /vibration`），选择目标设备
2. 查看振动速度 RMS（mm/s）趋势图与频谱瀑布图
3. 点击"VC评估"，`POST /ai/semiops/vibration-assess` 返回 `vc_class`（VC-A 至 VC-G）、`dominant_frequency`、`fault_signatures`
4. 若检测到轴承特征频率（BPFI/BPFO/BSF），系统发出"轴承磨损预警"

**预期结果：** 提前 2–6 周识别轴承劣化趋势，在计划停机窗口内完成更换，避免突发停机。VC 等级参考：VC-A ≤50μm/s，VC-D ≤6.25μm/s（适用于精密加工设备）。

---

### 6.4 Use Case UC16：HEPA/ULPA滤网寿命预测

**描述：** 通过监测滤网前后压差趋势，预测滤网剩余寿命和建议更换时间，实现"按需维护"而非"按时维护"。

**操作步骤：**
1. 进入 `Filter Life`（API: `GET /filters`），查看所有已监控滤网的当前压差与趋势
2. 点击"预测寿命"，`POST /ai/semiops/filter-predict` 返回：
   - `current_dp`（当前压差，Pa）
   - `replacement_dp`（更换阈值，Pa）
   - `predicted_replacement_date`（预计达到更换阈值的日期）
   - `remaining_days`（剩余天数）
3. 系统自动在 `remaining_days` ≤21 天时发出采购提醒

**预期结果：** 滤网利用率提升 15–25%（避免过早更换）；同时确保不因滤网失效导致洁净室污染事故。

---

### 6.5 Use Case UC17：预防性维护计划自动排程

**描述：** 基于设备维护手册、历史维护间隔、设备健康评分，自动生成维护工单，并在逾期时升级告警。

**操作步骤：**
1. 进入 `Predictive Maintenance`（API: `GET /maintenance/schedule`），查看维护计划列表
2. 列表含 `equipment_id`、`task_type`（PM/PdM/CM）、`scheduled_date`、`status`（PENDING/IN_PROGRESS/COMPLETED/OVERDUE）
3. 逾期工单（`status=OVERDUE`）高亮显示，系统通过告警通知责任工程师
4. 工程师完成维护后，在系统中标记完成，更新设备维护记录

**预期结果：** 维护合规率（按时完成率）目标 ≥95%；逾期工单自动升级，确保关键设备维护不遗漏。

---

### 6.6 场景案例 Scenario G：FFU振动超标 → 自动创建工单

| 阶段 | 描述 |
|---|---|
| **触发条件** | FFU-CR-A-06 振动速度 RMS 从 2.1mm/s 逐步升至 4.8mm/s（连续 3 天上升趋势） |
| **系统响应** | `vibration-assess` 判定 VC 等级由 VC-C 恶化至 VC-D；系统自动创建维修工单 |
| **工单内容** | 设备 ID、位置（洁净室 A 第 6 台 FFU）、故障特征（RMS=4.8mm/s, 主频 47.3Hz）、建议动作（检查/更换轴承） |
| **用户操作** | 维护工程师接单，计划在当日最低产能窗口（夜班 02:00）进行检修 |
| **结果** | 更换轴承后 RMS 降至 1.4mm/s，健康评分从 51 恢复至 88 |
| **业务价值** | 避免 FFU 突发停机导致洁净室正压失效和生产中断 |

---

### 6.7 场景案例 Scenario H：HEPA滤网提前采购

| 阶段 | 描述 |
|---|---|
| **触发条件** | CR-B HEPA 压差当前 185 Pa，更换阈值 250 Pa，压差每周上升约 10 Pa |
| **系统响应** | `filter-predict` 预测 21 天后将达更换阈值，系统发出采购提醒 |
| **用户操作** | 设施管理员提前下单采购 HEPA 滤网（供应商交期 10 天） |
| **业务价值** | 避免滤网超期使用导致洁净室粒子超标；备料充足，换滤时停机时间 <2 小时 |

---

## 7. 合规管理 Compliance Management

### 7.1 功能页面

- **ISO Compliance** (`/semiops/compliance`): ISO 14644 洁净度等级实时评估状态
- **Compliance Reports** (`/semiops/compliance/reports`): 合规报告生成与历史档案

### 7.2 Use Case UC18：ISO 14644洁净度等级自动评估

**描述：** 按照 ISO 14644-1 标准，根据实测粒子计数数据，自动评估每个洁净室的当前洁净度等级是否符合设计要求。

**操作步骤：**
1. 进入 `ISO Compliance`（API: `GET /compliance/assessments`），查看各洁净室最新评估结果
2. AI Engine `POST /ai/semiops/iso-assess` 输入粒子计数数据，返回：
   - `measured_class`（实测等级）
   - `design_class`（设计等级）
   - `compliant`（true/false）
   - `non_compliant_zones`（违规区域列表）
3. 不合规洁净室在列表中以红色标注，点击查看违规粒径和测量点位置

**预期结果：** 工程团队实时了解洁净室合规状态，ISO 审计时可提供完整的历史评估记录。

---

### 7.3 Use Case UC19：SEMI标准合规检查

**描述：** 除 ISO 14644 外，系统支持 SEMI 标准（如 SEMI S2 - 环境健康安全，SEMI S8 - 人机工程）相关合规检查项的录入与跟踪。

**操作步骤：**
1. 在 `ISO Compliance` 页面切换至 SEMI 标准视图
2. 查看检查项列表，标注 PASS / FAIL / N/A 状态
3. 对 FAIL 项目录入整改计划（负责人、截止日期）
4. 系统追踪整改进度，逾期项自动升级告警

**预期结果：** SEMI 合规检查完整度 100%；整改闭环率 ≥95%。

---

### 7.4 Use Case UC20：合规报告自动生成

**描述：** 系统基于历史数据自动生成符合监管要求的 ISO 洁净度合规报告（PDF），包含趋势图、统计数据、合规结论，支持年度审计和客户审厂。

**操作步骤：**
1. 进入 `Compliance Reports`，选择报告类型（ISO 14644 年度报告/季度报告/单次评估报告）
2. 选择覆盖的洁净室和时间范围，点击"生成报告"
3. 系统自动汇总粒子计数历史数据、ISO 评估结果、违规事件及处置记录
4. 生成 PDF 报告，含统计摘要、趋势图、等级合规热图
5. 报告自动存档，支持按日期/洁净室检索历史报告

**预期结果：** 报告生成时间从人工整理的 2–3 天缩短至 <5 分钟，格式规范，可直接用于外部审计。

---

### 7.5 场景案例 Scenario I：年度ISO审计

| 阶段 | 描述 |
|---|---|
| **触发条件** | 客户/认证机构年度 ISO 14644 审计，要求提供全年洁净室合规记录 |
| **系统响应** | 进入 `Compliance Reports`，一键选择"全部洁净室 × 过去12个月" |
| **用户操作** | 生成 PDF 套装（每个洁净室独立报告 + 汇总总览）；分享给审计员 |
| **报告内容** | 每月粒子计数均值、违规事件（含根因和整改）、ISO 等级达标率（目标 ≥99.5%） |
| **业务价值** | 审计准备从 3 人×3 天 缩短至 0.5 小时；报告数据可追溯，审计通过率显著提升 |

---

## 8. 决策中心 Decision Center

### 8.1 功能页面

- **Decision Center** (`/semiops/decision-center`): AI 辅助决策界面，含近期决策和历史追溯

### 8.2 Use Case UC21：AI辅助决策

**描述：** 当工厂面临多重异常同时发生时，决策中心综合洁净室、设备、能源、产线等多维数据，给出优先级排序和具体行动建议。

**操作步骤：**
1. 进入 `Decision Center`（API: `GET /decision/recent`），查看系统当前推送的决策建议
2. 每条决策建议含 `priority`（HIGH/MEDIUM/LOW）、`category`（Cleanroom/Equipment/Energy/SMT）、`summary`（问题摘要）、`recommended_action`（建议动作）、`data_sources`（分析依据数据源列表）
3. 点击建议查看完整分析报告，包括触发数据、AI 推理链路、预计影响
4. 确认或驳回建议，系统记录决策结果

**预期结果：** 管理层在突发多重异常时，能在 2 分钟内获得优先级清单，避免团队精力分散或遗漏关键问题。

---

### 8.3 Use Case UC22：决策历史追溯

**描述：** 每次 AI 建议和工程师决策都被记录，形成可追溯的决策日志，支持复盘分析和合规审计。

**操作步骤：**
1. 进入决策中心，切换至"历史记录"标签（API: `GET /decision/history?page=0&size=20`）
2. 按时间、类别、处置结果筛选历史决策
3. 查看每条历史决策的完整信息：触发时间、问题描述、AI 建议内容、工程师实际处置、最终结果
4. 导出决策日志用于管理层汇报或 CAPA（纠正预防措施）分析

**预期结果：** 完整的决策链可追溯，支持持续改善（CI）文化建立；AI 建议采纳率可被量化追踪（目标 ≥70%）。

---

### 8.4 场景案例 Scenario J：多重异常并发处置

| 阶段 | 描述 |
|---|---|
| **触发条件** | 同一时段：① 压缩机振动 WARNING ② SMT Line-3 良率下降 6% ③ PUE 升至 1.78 |
| **系统响应** | 决策中心综合三项异常，AI 给出优先级排序 |
| **优先级输出** | 1st: 压缩机振动（影响全厂CDA供应，停机风险 HIGH）；2nd: SMT良率（直接影响出货）；3rd: PUE（可延后处理） |
| **用户操作** | 维护工程师优先处理压缩机；工艺工程师同步排查 SMT 良率问题 |
| **业务价值** | 资源分配有依据，关键问题不遗漏；处置时间比人工协调缩短 ~40% |

---

## 9. AI Advisor 智能顾问

### 9.1 功能概述

AI Advisor 是 SemiOps 的内嵌智能顾问，支持自然语言问答，能跨模块调取数据进行综合分析。已针对半导体和 PCB/FPC 制造场景进行专项优化，理解行业专业术语。

**支持的专业术语（PCB/FPC专项）：**
- 焊接缺陷：立碑(Tombstoning)、桥接(Bridging)、虚焊(Cold Joint)、少锡(Insufficient Solder)、冷焊、移位
- 工艺术语：焊膏(Solder Paste)、回焊(Reflow)、波峰焊(Wave Soldering)、AOI、AXI、ICT
- 洁净室术语：FFU、HEPA、ULPA、ACH、ISO 14644、VC Curve
- 能效术语：PUE、COP、DPMO、OEE

### 9.2 Use Case UC23：自然语言状态查询

**描述：** 工程师用自然语言询问当前设备或洁净室状态，Advisor 实时查询 API 并以易读格式回答。

**示例对话：**
> 工程师："CR-A 洁净室现在状态怎么样？"
>
> Advisor 调用：`GET /cleanrooms/CR-A`、`GET /cleanrooms/CR-A/particles?hours=1`
>
> Advisor 回答："CR-A 洁净室（ISO 6 级）当前状态 NORMAL。≥0.5μm 粒子计数 18,200 粒/m³（ISO 6 上限 35,200），合规。温度 22.3°C、湿度 45% RH，均在工艺窗口内。最近 1 小时无告警。"

---

### 9.3 Use Case UC24：跨模块综合分析

**描述：** Advisor 可跨越洁净室、SMT、能源等模块，将分散数据关联成综合洞察，回答管理层关注的跨域问题。

**示例对话：**
> 管理层："哪条 SMT 线 OEE 最低？原因是什么？"
>
> Advisor 调用：`GET /smt/lines` → 遍历各线 OEE → 识别 Line-4 OEE=72%（最低）
>
> Advisor 再调用：`GET /smt/lines/line-4/oee` → 发现 Quality 率=89%（拉低 OEE 主因）
>
> Advisor 再调用：`GET /smt/defects?line_id=line-4` → 识别桥接缺陷占比 63%
>
> Advisor 回答："Line-4 OEE 最低（72%），主要拖累来自良率（Quality=89%）。Top 缺陷为桥接（占 63%），建议检查钢网开口尺寸和焊膏印刷参数。"

---

### 9.4 Use Case UC25：PCB/FPC专项分析

**描述：** Advisor 理解 PCB/FPC 行业特有的术语和上下文，提供专业深度的分析，而非泛化回答。

**示例问题类型：**
- "本周焊膏坍塌(Slump)缺陷增多，可能原因？" → Advisor 关联温湿度与焊膏供应商批次信息
- "回焊炉 Profile 如何调整才能减少立碑？" → 基于当前 PCB 板厚和元件尺寸给出升温斜率建议
- "FPC 柔板贴片有哪些注意事项？" → 专项知识库回答

---

### 9.5 场景案例 Scenario K：PUE异常问诊

| 阶段 | 描述 |
|---|---|
| **触发条件** | 工程师注意到今天 PUE 偏高，向 Advisor 提问 |
| **提问** | "为什么今天 PUE 这么高？" |
| **Advisor动作** | 调用 `GET /energy/pue` → 确认 PUE=1.74（比昨日高 0.12）；调用 `POST /ai/semiops/pue/trend` → 识别冷却系统能耗异常 |
| **Advisor回答** | "今天 PUE 为 1.74，高于昨日 1.62。主要原因：冷却系统能耗占比从 39% 升至 51%，COP 仅 3.1（低于设计值 4.5）。建议检查冷却塔运行状态，可能需要清洗除垢。" |
| **业务价值** | 工程师 2 分钟内获得诊断结论，无需跨页面手动查询和对比数据 |

---

## 10. 附录 Appendix

### 10.1 API 快速参考表

#### Backend API (`http://<host>:8080/api/v1/semiops`)

| 功能 | Method | Path |
|---|---|---|
| 总览仪表盘 | GET | `/dashboard` |
| 洁净室列表 | GET | `/cleanrooms` |
| 洁净室详情 | GET | `/cleanrooms/{id}` |
| 粒子计数 | GET | `/cleanrooms/{id}/particles?hours=24` |
| ISO评估记录 | GET | `/cleanrooms/{id}/iso-assessments` |
| 压差监测 | GET | `/environment/pressure` |
| SMT产线列表 | GET | `/smt/lines` |
| SMT线OEE | GET | `/smt/lines/{id}/oee` |
| SMT缺陷记录 | GET | `/smt/defects?line_id=&start=&end=` |
| PUE数据 | GET | `/energy/pue` |
| 公用设施 | GET | `/utilities?page=0&size=20` |
| 滤网状态 | GET | `/filters` |
| 设备健康 | GET | `/equipment/health` |
| 振动数据 | GET | `/vibration` |
| 维护计划 | GET | `/maintenance/schedule` |
| 合规评估 | GET | `/compliance/assessments` |
| 近期决策 | GET | `/decision/recent` |
| 决策历史 | GET | `/decision/history?page=0&size=20` |

#### AI Engine API (`http://<host>:8000/ai/semiops`)

| 功能 | Method | Path |
|---|---|---|
| 环境关联分析 | POST | `/env-correlate` |
| 环境预测 | POST | `/env-predict` |
| 软传感器推算 | POST | `/soft-sensor` |
| 滤网寿命预测 | POST | `/filter-predict` |
| 设备健康评分 | POST | `/health-score` |
| 振动VC评级 | POST | `/vibration-assess` |
| PUE计算 | POST | `/pue` |
| PUE趋势分析 | POST | `/pue/trend` |
| 缺陷分类 | POST | `/defect-classify` |
| 产线瓶颈仿真 | POST | `/bottleneck-sim` |
| ISO合规评估 | POST | `/iso-assess` |
| 压差合规检查 | POST | `/pressure-check` |
| 设备群可靠性 | POST | `/fleet-reliability` |
| 缺陷DPMO计算 | POST | `/defect-dpmo` |
| 冷却COP优化 | POST | `/cop-optimize` |
| 负荷预测 | POST | `/load-forecast` |
| 粒子监测分析 | POST | `/particle-monitor` |

### 10.2 支持的传感器类型

| 传感器类别 | 测量参数 | 典型应用位置 |
|---|---|---|
| 粒子计数器 | ≥0.1μm / ≥0.3μm / ≥0.5μm / ≥1.0μm / ≥5.0μm 粒子数 | 洁净室各测量点 |
| 温湿度传感器 | 温度(°C)、相对湿度(%RH)、露点(°C) | 洁净室、SMT产线 |
| 压差传感器 | 微压差(Pa)、绝对压力(Pa) | 洁净室间隔离区域 |
| 振动传感器 | 速度(mm/s)、加速度(g)、位移(μm) | 泵、风机、压缩机轴承座 |
| 电力计量仪 | 有功功率(kW)、用电量(kWh)、功率因数 | 各电气回路配电盘 |
| 流量计 | 冷却水流量(m³/h)、CDA流量(L/min) | 冷却水管路、CDA管路 |
| 滤网压差传感器 | 滤网前后压差(Pa) | HEPA/ULPA 滤网两端 |

### 10.3 告警级别定义

| 级别 | 状态 | 含义 | 建议响应时间 |
|---|---|---|---|
| ✅ NORMAL | 绿色 | 参数在正常范围内，无需处置 | — |
| ⚠️ WARNING | 黄色 | 参数接近阈值（通常为限值的 85–95%），需要关注 | <2 小时 |
| 🔴 CRITICAL | 红色 | 参数已超出阈值或发生故障，需要立即处置 | <30 分钟 |

### 10.4 术语表 Glossary

| 术语 | 全称 | 定义 |
|---|---|---|
| **ACH** | Air Changes per Hour | 换气次数/小时，洁净室关键设计参数 |
| **AOI** | Automated Optical Inspection | 自动光学检测，SMT表面缺陷检测 |
| **BPFI/BPFO** | Ball Pass Frequency Inner/Outer | 轴承球通过内/外圈频率，用于轴承故障诊断 |
| **CDA** | Clean Dry Air | 洁净干燥空气，半导体工艺用气体 |
| **COP** | Coefficient of Performance | 制冷系数 = 制冷量/输入电功率，越高越节能 |
| **DPMO** | Defects Per Million Opportunities | 百万机会缺陷数，六西格玛质量指标 |
| **FFU** | Fan Filter Unit | 风机过滤机组，洁净室空气净化核心设备 |
| **HEPA** | High Efficiency Particulate Air | 高效空气粒子过滤器，过滤效率 ≥99.97% (@0.3μm) |
| **IQ/OQ** | Installation/Operational Qualification | 安装确认/运行确认，设备验证流程 |
| **ISO 14644** | — | 洁净室国际标准，定义 ISO 1–9 等级的粒子浓度限值 |
| **OEE** | Overall Equipment Effectiveness | 综合设备效率 = 可用率 × 性能效率 × 良率 |
| **PUE** | Power Usage Effectiveness | 电源使用效率 = 设施总功耗/IT设备功耗，理想值=1.0 |
| **SEMI** | Semiconductor Equipment and Materials International | 国际半导体设备与材料协会，发布半导体行业标准 |
| **ULPA** | Ultra Low Penetration Air | 超低穿透率空气过滤器，效率 ≥99.9995% (@0.12μm) |
| **VC Curve** | Vibration Criterion Curve | 振动评判标准曲线，VC-A(最严格)至 VC-G，用于精密设备环境评级 |

---

*文档生成：AzureBot · DataMesh SemiOps v2026-02-27*  
*如有疑问，请联系 DataMesh 技术支持团队。*
