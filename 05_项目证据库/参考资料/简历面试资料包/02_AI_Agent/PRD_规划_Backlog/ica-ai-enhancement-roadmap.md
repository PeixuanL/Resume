# ICA AI 能力提升路线图

> 基于现有 18+ 引擎基盘，规划 TrafficOps 模块的 AI 能力提升方向

## 现状：已接入的 AI 能力

| 能力 | 引擎 | 用在哪 | 效果 |
|------|------|--------|------|
| 到达预测 | Holt-Winters | Passenger AI → Forecast | 4h 预测 + 置信带 |
| 排队优化 | Erlang-C (M/M/c) | Passenger AI → Recommend | 最优 lane 配置 |
| 仿真验证 | SimPy DES | Passenger AI → Simulate | 排队瓶颈分析 |
| 方案鲁棒性 | Monte Carlo 10K | Passenger AI → Stress Test | Robustness Score |
| SLA 风险 | Survival Analysis | KPI Bar | SLA Breach % |
| 网络瓶颈 | NetworkX Max-Flow | Live View | 瓶颈识别 |
| 因果推断 | DoWhy | Commander Pax (Causal) | 政策效果评估 |

**未接入但已部署的引擎:** Kalman Filter、Bayesian Opt、NSGA-II、DOE/SALib、ABM、OR-Tools、System Dynamics、Anomaly Detection、Conformal Prediction、SHAP Explainability

---

## Phase A: 实时智能增强（Demo 直接受益）

### A1. Kalman Filter 实时状态估计
- **现状:** KPI 每 5s 轮询原始值，有噪声波动
- **提升:** Kalman Filter 平滑 + 预测下一状态（5-15s 超前）
- **效果:** KPI 数值稳定，surge 拐点提前 10s 检测到
- **引擎:** `state_estimation.py` (已部署)
- **接入点:** `PassengerFlowService` 返回值加一层 Kalman 滤波
- **Demo 价值:** ⭐⭐⭐ — 数值更"专业"，不再跳动

### A2. 异常检测 → 自动 Surge 预警
- **现状:** Surge 靠手动触发或阈值判断
- **提升:** Isolation Forest / LOF 检测到达率异常 → 自动预警 "Anomaly Detected: arrival rate 2.3σ above normal"
- **效果:** Surge 不再靠人发现，AI 主动告警
- **引擎:** `anomaly_v2.py` (已部署)
- **接入点:** Forecast 阶段增加 anomaly check，异常时 KPI Bar 显示 ⚡ 预警
- **Demo 价值:** ⭐⭐⭐⭐ — "AI 比人先发现问题" 是最强卖点

### A3. SHAP 可解释性 → "为什么推荐这个方案"
- **现状:** Recommendation 只给结论（开 15 lanes + 4 MC）
- **提升:** SHAP 解释每个因素的贡献权重：arrival_rate 贡献 42%，processing_time 贡献 28%，current_queue 贡献 30%
- **效果:** Officer 理解 "为什么"，而不是盲目接受 AI 建议
- **引擎:** `explainability.py` (已部署)
- **接入点:** Recommend 阶段返回 feature_importance，前端展示瀑布图
- **Demo 价值:** ⭐⭐⭐⭐ — 客户关心 AI 透明度和可解释性

---

## Phase B: 运营优化（提升实用性）

### B1. OR-Tools 排班优化 → 与 Surge 联动
- **现状:** Shift Planning 页面独立，和 demo 流程无关
- **提升:** Surge 触发后，自动调用 OR-Tools 计算 "需要额外召回 X 名 officer"，考虑班次约束、技能匹配、最小间隔
- **效果:** 推荐不仅说 "开 15 lanes" 还说 "需要从 B2 区调 4 名 officer，ETA 8 分钟"
- **引擎:** `constraint_solver.py` (OR-Tools CP-SAT)
- **接入点:** Recommend 阶段增加 staffing_recommendation
- **Demo 价值:** ⭐⭐⭐⭐⭐ — 这是 ICA 最关心的：人怎么调度

### B2. NSGA-II 多目标优化 → 平衡 Wait Time / 人力成本 / 能耗
- **现状:** Erlang-C 只优化 "最少 lanes 满足 SLA"（单目标）
- **提升:** NSGA-II 同时优化 3 个目标：
  - 最小化平均等待时间
  - 最小化人力成本（每多开一条 lane = 1 名 officer）
  - 最小化能耗（每条 lane 对应 X-ray + 空调 + 照明）
- **效果:** 输出 Pareto 前沿，展示多个方案供 officer 选择
- **引擎:** `optimization.py` (pymoo NSGA-II/III)
- **接入点:** Recommend 阶段增加 "Multi-objective Analysis" 折叠面板
- **Demo 价值:** ⭐⭐⭐ — 学术感强，适合技术买家

### B3. DOE 敏感性分析 → "什么参数影响最大"
- **现状:** Tunable Parameters 靠 officer 手动调
- **提升:** 一键 Sobol 全局敏感性分析：processing_time 对 wait_time 的影响是 surge_pax 的 2.3 倍 → 优先改进通关速度
- **效果:** 资源投入有数据支撑，不是拍脑袋
- **引擎:** `doe.py` (pyDOE3 + SALib)
- **接入点:** Tunable Parameters 面板增加 "🔬 Sensitivity Analysis" 按钮
- **Demo 价值:** ⭐⭐⭐ — 决策层买家喜欢

---

## Phase C: 数字孪生深度集成

### C1. ABM 人群仿真 → 大厅人流可视化
- **现状:** Crowd Density 只是一个百分比数字
- **提升:** ABM 模拟 400 个 agent 在 4,226 sqm 大厅中的运动：排队、分流、拥堵热点
- **效果:** 2D 热力图 + 动画（基于 Canvas），直观看到拥堵在哪里
- **引擎:** `abm.py` (numpy BFS crowd sim)
- **接入点:** Live View tab 增加 "Crowd Simulation" 模式
- **Demo 价值:** ⭐⭐⭐⭐⭐ — 视觉冲击力最强，"Digital Twin" 的核心体现

### C2. System Dynamics 长期容量规划
- **现状:** Capacity Planning 页面有但和 ICA 场景脱节
- **提升:** 基于 ICA 的 WCPR Phase 1 / Phase 2 数据，模拟 2027-2035 容量演变：
  - 人口增长 → 需求增长
  - WCPR 建成 → 分流效果
  - 自动化比例提升 → processing_time 下降
- **效果:** 回答 "WCPR 建成后 WCP 还够不够用"
- **引擎:** `system_dynamics.py`
- **接入点:** 独立 "Long-term Planning" 页面，输入增长假设，输出容量曲线
- **Demo 价值:** ⭐⭐⭐ — 适合规划部门，不适合运营 demo

### C3. Conformal Prediction → 带保证的预测区间
- **现状:** Forecast 输出 P10/P90 置信带，但没有统计保证
- **提升:** Conformal Prediction 给出 "95% 覆盖率保证" 的预测区间
- **效果:** 从 "大概率在这个范围" 变成 "统计上保证 95% 落在此范围"
- **引擎:** `conformal.py`
- **接入点:** Forecast 结果增加 conformal interval 标注
- **Demo 价值:** ⭐⭐ — 学术加分，但 officer 不关心

---

## Phase D: 闭环自动化

### D1. Bayesian Optimization → 自动调参
- **现状:** Processing Time、SLA Target 靠 officer 手动设
- **提升:** Bayesian Opt 自动搜索最优参数组合（processing_time × sla_target × lane_config），最少实验次数找到全局最优
- **效果:** "AI 不仅告诉你开几条 lane，还告诉你每条 lane 的最优处理流程"
- **引擎:** `bayesian_opt.py` (Optuna)
- **接入点:** Tunable Parameters 面板增加 "🎯 Auto-Optimize" 按钮
- **Demo 价值:** ⭐⭐⭐ — 自动化程度再上一层

### D2. Reinforcement Learning → 自主决策 Agent
- **现状:** AI 推荐，人接受
- **提升:** RL Agent 在 DES 环境中训练，学习 "什么时候开/关 lane" 的策略，Auto-Pilot 模式下自主执行
- **效果:** 从 "AI 辅助决策" 升级到 "AI 自主运营"
- **引擎:** `rl_agent.py` (Gymnasium)，需要从 HVAC 迁移到 TrafficOps 环境
- **接入点:** Auto-Pilot tab 的 "AUTO" 模式替换为 RL 策略
- **Demo 价值:** ⭐⭐⭐⭐⭐ — 终极形态，但风险最高（客户可能不敢用）

### D3. 因果推断闭环 → 决策效果验证
- **现状:** Accept & Deploy 后没有回看 "AI 推荐的效果如何"
- **提升:** Recovery 后自动运行 DoWhy 因果分析：对比 "如果没有干预" 的反事实，量化 "AI 推荐实际减少了 X 分钟等待"
- **效果:** 形成闭环：预测 → 推荐 → 执行 → 验证 → 学习
- **引擎:** `causal.py` (DoWhy)
- **接入点:** Recovery 阶段自动触发，结果写入 Decision Log
- **Demo 价值:** ⭐⭐⭐⭐ — "AI 不仅决策，还自我评估"

---

## 优先级排序（推荐实施顺序）

| 优先级 | 能力 | 工作量 | Demo 价值 | 理由 |
|--------|------|--------|-----------|------|
| 🥇 P0 | A2. 异常检测预警 | 1天 | ⭐⭐⭐⭐ | 引擎已有，接入简单，"AI先于人发现问题" |
| 🥇 P0 | B1. 排班联动 | 2天 | ⭐⭐⭐⭐⭐ | ICA 最关心的人力调度，OR-Tools 已部署 |
| 🥈 P1 | A3. SHAP 可解释性 | 1天 | ⭐⭐⭐⭐ | AI 透明度是政府客户硬需求 |
| 🥈 P1 | D3. 因果推断闭环 | 1天 | ⭐⭐⭐⭐ | 形成完整的决策闭环，差异化竞争力 |
| 🥈 P1 | A1. Kalman 平滑 | 0.5天 | ⭐⭐⭐ | 提升数值质感 |
| 🥉 P2 | C1. ABM 人群可视化 | 3天 | ⭐⭐⭐⭐⭐ | 视觉冲击最强，但工作量大 |
| 🥉 P2 | B3. DOE 敏感性 | 1天 | ⭐⭐⭐ | 锦上添花 |
| 🥉 P2 | B2. NSGA-II 多目标 | 2天 | ⭐⭐⭐ | 学术感强 |
| P3 | D1. Bayesian 自动调参 | 1天 | ⭐⭐⭐ | 好做但 demo 效果不明显 |
| P3 | C2. System Dynamics | 2天 | ⭐⭐⭐ | 规划用，不适合运营 demo |
| P4 | D2. RL 自主 Agent | 5天+ | ⭐⭐⭐⭐⭐ | 终极形态但风险高 |
| P4 | C3. Conformal Prediction | 0.5天 | ⭐⭐ | 学术加分 |

---

## P0 实施后的 Demo 叙事升级

**现在的叙事:** Surge → AI 分析 → 推荐 → 执行 → 恢复
**升级后的叙事:**

> 1. AI 异常检测**主动发现** arrival rate 偏离 2.3σ → 预警
> 2. AI 预测未来 4h 趋势 + **解释哪些因素驱动**（SHAP）
> 3. AI 模拟 + 推荐最优方案 + **排班调度**（OR-Tools：从 B2 区调 4 名 officer）
> 4. 10,000 场景压力测试验证方案鲁棒性
> 5. Officer 接受 → 执行
> 6. 恢复后 AI **自动评估效果**（DoWhy：减少了 12.3 分钟平均等待）

这个叙事的核心转变：从 "AI 响应问题" → **"AI 预见、解释、调度、验证"** 全链路闭环。
