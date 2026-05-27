# PRD: ICA 3D Digital Twin & DES 优化平台

> Product Requirements Document — 基于 ICA 需求文档的差距分析与产品规划
> 
> Version: 1.0 | Date: 2026-02-16 | Author: AzureBot

---

## 1. 背景与目标

### 1.1 客户背景
ICA（Immigration & Checkpoints Authority，新加坡移民与关卡局）需要一套 **3D Digital Twin + 离散事件仿真（DES）+ 布局优化** 平台，用于：
- 虚拟设计、验证和优化关卡设施布局
- 评估队列性能（等待时间、吞吐量、瓶颈）
- 在物理改造前降低成本、时间和风险

### 1.2 项目规模
- **实施周期**：15个月（Location 1: 12个月，Location 2: 15个月）
- **核心用户**：工程师/分析师、规划师、运营经理、数据工程师、CAD/设施工程师、IT/OT管理员

### 1.3 产品目标
将 FactVerse AI Agent 从当前的 **运维监控+仿真分析平台** 升级为 **完整的设施数字孪生+布局优化平台**，满足 ICA 全部功能需求。

### 1.4 战略意义
- ICA 是 DataMesh 头号客户目标
- 成功交付将验证 "AI执行器（Executable Digital Twin）" 定位
- 可复制到其他关卡/机场/港口场景

---

## 2. 现状评估

### 2.1 已具备能力（✅ Comply）

| 领域 | 能力 | 实现状态 |
|------|------|----------|
| DES引擎 | SimPy离散事件仿真 | 3个模块（TrafficOps/HeatOps/FMS），场景注册机制 |
| DES实体 | Passenger流经检查站链 | CheckpointProcess，队列+服务+中转时间 |
| 随机模型 | Poisson到达、指数服务、Weibull故障 | 已实现+验证 |
| DOE | 实验设计+ANOVA+灵敏度分析 | pyDOE3 + SALib，批量异步执行 |
| 优化 | NSGA-II多目标优化 | pymoo，Pareto前沿+Knee-point推荐 |
| 统计控制 | Seed/Replications/Warm-up/CRN/CI | 全部支持 |
| 回放 | 仿真结果时间轴回放 | PlaybackView |
| 报告 | PDF/Excel报告生成 | reportlab + openpyxl |
| 3D场景 | Three.js 3D设施概览 | 设备标记+实时数据面板 |
| RBAC | 角色权限控制 | 6角色，按钮级权限 |
| 突发事件 | 大巴/航班/邮轮surge场景 | 批量到达+时变到达率 |
| AI顾问 | 7个工具调用（仿真/优化/DOE/报告等） | 已验证生产环境 |

### 2.2 差距总结

| 差距等级 | 数量 | 关键项 |
|----------|------|--------|
| 🔴 缺失 | 6 | 空间布局优化、BIM导入、多实体路由、数据管线、分布拟合、代理模型 |
| 🟡 需增强 | 8 | 调度策略、设备故障统一、3D状态着色、Sankey图、约束系统、OEE指标、路径规划、并行DES |

---

## 3. 需求映射矩阵

### 3.1 ICA 需求 → 功能模块映射

```
ICA需求文档结构：
├── 5.1 3D Digital Twin
│   ├── 3D场景+分层                    → [增强] 3D Scene Layer System
│   ├── CAD/BIM导入(DWG/IFC)           → [新建] BIM Import Engine
│   ├── 参数化资源                      → [增强] Resource Parameter Model
│   └── 实时状态覆盖/热力图             → [新建] Live Overlay System
│
├── 5.2 Discrete Event Simulation
│   ├── 核心实体(Part/Batch/AGV/...)    → [新建] Multi-Entity DES
│   ├── 路由(替代路径/返工/批处理)       → [新建] DAG Routing Engine
│   ├── 随机元素(分布拟合)              → [新建] Distribution Fitting
│   ├── 调度规则(FIFO/LIFO/EDD/...)     → [新建] Dispatching Rules
│   ├── DOE/Warm-up/CRN                → [已有] ✅
│   ├── Seed可重现                      → [已有] ✅
│   ├── 回放+异常高亮                   → [已有] ✅
│   └── KPI+CI+资源图+瓶颈             → [已有] ✅ (需增强Sankey)
│
├── 5.3 Layout Optimization
│   ├── 多目标(throughput/lead time/OEE) → [增强] OEE Metric
│   ├── 决策变量(位置/通道/缓冲/人员)   → [新建] Spatial Layout Encoding
│   ├── 约束(面积/安全距离/预算)         → [新建] Constraint System
│   ├── 求解器(GA/SA/Tabu/MILP)         → [增强] Solver Portfolio
│   └── 优化循环(候选→DES→Pareto)       → [已有] ✅
│
├── 6. What-if Scenarios                → [已有] ✅ (含surge)
├── 7. Process Flow                     → [部分] 需数据管线
├── 8. Optimization Design              → [新建] Metamodel Pre-screening
└── 9. Reporting                        → [增强] Sankey/Gantt/Heatmap
```

### 3.2 逐项详细映射

#### 5.1 3D Digital Twin

| ICA要求 | 现状 | 目标 | 优先级 |
|---------|------|------|--------|
| 3D场景分层（建筑壳/管线/产线/设备/存储/安全区） | Three.js单层场景 | 多图层系统，独立开关 | P1 |
| CAD/BIM导入（DWG/IFC），对齐建筑坐标 | CadImportView mock | IFC.js解析器，坐标系对齐 | P0 |
| 参数化资源（周期时间分布/容量/可靠性/能耗） | 检查站有capacity+service_time | 统一ResourceModel，含分布+可靠性+能耗 | P1 |
| 实时状态覆盖：按状态着色（idle/busy/failed），密度热力图 | 设备marker有颜色 | 动态状态着色+Canvas密度热力图 | P1 |

#### 5.2 Discrete Event Simulation

| ICA要求 | 现状 | 目标 | 优先级 |
|---------|------|------|--------|
| 核心实体：Parts/Batches/Carriers/Operators/Machines/Buffers/Transporters | 仅Passenger | 多实体类型注册系统 | P0 |
| 路由：替代路径/返工/批处理/解批 | 线性检查站链 | DAG路由引擎 + BatchProcess | P0 |
| 随机元素：拟合分布（从历史数据） | 手动输入参数 | scipy.stats自动拟合 | P1 |
| 调度规则：FIFO/LIFO/SPT/EDD/SO | 仅FIFO（隐式） | DispatchPolicy可插拔 | P1 |
| 故障：MTBF/MTTR | FMS有，TrafficOps无 | 统一ReliabilityModel挂载到任意Process | P1 |

#### 5.3 Layout Optimization

| ICA要求 | 现状 | 目标 | 优先级 |
|---------|------|------|--------|
| 目标函数：throughput/lead time/OEE | throughput vs cost | 增加OEE(A×P×Q)、lead time | P1 |
| 决策变量：站点位置/通道拓扑/缓冲大小/AGV路径/人员 | 仅staff_count等标量 | 空间编码（坐标+朝向+连接矩阵） | P0 |
| 约束：面积/安全距离/管线接口/最大步行距离/预算 | 仅变量范围 | ConstraintManager（硬修复+软惩罚） | P1 |
| 求解器：GA/NSGA-II/SA/Tabu/GRASP/MILP | 仅NSGA-II | 增加SA/Tabu，MILP子问题 | P2 |
| 代理模型：RSM/GP/XGBoost预筛选 | 无 | 训练代理模型加速评估 | P2 |

#### 9. Reporting

| ICA要求 | 现状 | 目标 | 优先级 |
|---------|------|------|--------|
| 场景对比Dashboard | SimAnalysisView | 增强：多场景并排 | P1 |
| Resource Gantt | ResourceGantt组件 | ✅ 已有 | — |
| Sankey流量图 | 无 | ECharts Sankey | P1 |
| 瓶颈热力图 | 文字标识bottleneck | 2D/3D热力图覆盖 | P1 |
| Pareto图+hover+约束覆盖 | AiOptimizer散点图 | 增加约束区域显示 | P2 |

---

## 4. 用户角色与权限

ICA定义了6个角色，映射到我们的RBAC系统：

| ICA角色 | 映射RBAC角色 | 关键权限 |
|---------|-------------|----------|
| Engineer/Analyst | `ROLE_ENGINEER` | 建模、运行仿真、解读结果、DOE |
| Planner | `ROLE_PLANNER`（新增） | 排程评估、需求组合、班次模式 |
| Operations Manager | `ROLE_MANAGER` | 审批决策、KPI追踪、输入MTBF/MTTR |
| Data Engineer | `ROLE_DATA_ENGINEER`（新增） | 数据管线、集成、数据血缘 |
| CAD/Facilities Engineer | `ROLE_CAD_ENGINEER`（新增） | 2D/3D几何维护、竣工更新 |
| IT/OT Admin | `ROLE_ADMIN` | SSO、RBAC、部署、安全 |

---

## 5. 业务用例详解

### UC1: Greenfield Layout Design（绿地布局设计）
```
前置条件：BOM、工艺路线、节拍目标
流程：
1. 导入建筑BIM → 3D场景
2. 从模板库拖拽放置站点/缓冲区/通道
3. 定义工艺路线（DAG）
4. 配置资源参数（处理时间分布、容量）
5. 运行DES仿真（多replication）
6. 运行NSGA-II布局优化
7. 对比Pareto前沿上的候选方案
8. 选择方案 → 生成实施计划报告
```

### UC2: Brownfield Line Improvement（棕地产线改善）
```
前置条件：现有布局CAD、历史运行数据
流程：
1. 导入现有布局 → 3D场景
2. 从历史数据拟合分布参数
3. 仿真验证：仿真KPI vs 实际KPI（校准）
4. What-if实验：调整缓冲大小/站点排序/人员分配
5. 对比场景 → 识别最优改善方案
```

### UC3: Bottleneck & Variability Analysis（瓶颈与变异分析）
```
前置条件：校准后的DES模型
流程：
1. 运行基线仿真
2. 查看Resource Gantt → 识别blocking/starvation
3. 查看Sankey流量图 → 识别流转瓶颈
4. 查看热力图 → 识别拥堵区域
5. DOE灵敏度分析 → 量化各因素影响
6. 针对瓶颈实施改善方案 → 对比仿真验证
```

### UC4-8: 排班优化 / 资源优化 / 换线策略 / 需求压测 / 通道规划
```
共同模式：
1. 定义优化目标和约束
2. NSGA-II / DOE 搜索最优方案
3. DES仿真验证
4. Pareto前沿选择 → 实施
```

---

## 6. What-if 场景清单

ICA文档明确的What-if问题 + 扩展场景：

| # | What-if问题 | 当前支持 | 需要 |
|---|------------|----------|------|
| 1 | 改变开放booth数量对吞吐和流量的影响？ | ✅ 仿真+优化 | — |
| 2 | 维持平均等待<10min的最优lane和设备数？ | ✅ NSGA-II寻优 | — |
| 3 | 检查量增加10-50%对行人流量的影响？ | ✅ surge场景 | — |
| 4 | 优化员工通行路线和应急响应路线？ | ❌ | A*路径规划 |
| 5 | 大巴突然到达，需要开放多少额外通道？ | ✅ bus-surge场景 | — |
| 6 | 设备故障时的降级策略？ | 部分（FMS有） | TrafficOps故障模型 |
| 7 | 不同班次模式对服务水平的影响？ | ❌ | 班次模型 |
| 8 | 高峰期开放所有通道 vs 保留备用的权衡？ | ✅ 优化可做 | — |

---

## 7. 非功能需求

| 需求 | ICA期望 | 当前状态 | 行动 |
|------|---------|----------|------|
| 性能 | 并行DES replications | 单线程 | ThreadPoolExecutor并行 |
| 扩展性 | 多Location支持 | 单租户 | tenant_id已预留 |
| 安全 | SSO/RBAC | RBAC已有，无SSO | 需增加SAML/OIDC |
| 数据集成 | ERP/MES/SCADA/RTLS | Data Connector mock | 需真实连接器 |
| 部署 | On-premise或Cloud | Docker Compose | Kubernetes ready |
| API暴露 | 虚拟孪生模型对外暴露 | 内部API | 需RESTful公开API+文档 |

---

## 8. 技术架构演进

### 8.1 当前架构
```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│  Frontend   │────▶│   Backend    │────▶│   AI Engine    │
│  Vue 3 + TS │     │ Spring Boot  │     │ FastAPI+SimPy  │
│  Three.js   │     │  PostgreSQL  │     │ pymoo/pyDOE3   │
└─────────────┘     └──────────────┘     └────────────────┘
```

### 8.2 目标架构（增量）
```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ 3D Scene │ │ Layout   │ │ DES Viz  │ │ Reporting │  │
│  │ Viewer   │ │ Editor   │ │ Playback │ │ Dashboard │  │
│  │ (Three+  │ │ (Drag&   │ │ (Gantt/  │ │ (Pareto/  │  │
│  │  IFC.js) │ │  Drop)   │ │  Sankey) │ │  Compare) │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                    Backend (Spring Boot)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Layout   │ │ Project  │ │ Data     │ │ RBAC +    │  │
│  │ Service  │ │ Manager  │ │ Pipeline │ │ SSO       │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                AI Engine (FastAPI)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ DES Core │ │ Layout   │ │ DOE +    │ │ Dist.     │  │
│  │ (SimPy,  │ │ Optimizer│ │ Sensitiv.│ │ Fitting   │  │
│  │  DAG     │ │ (NSGA-II │ │          │ │ (scipy)   │  │
│  │  Router) │ │  +Spatial)│ │          │ │           │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ Metamodel│ │ Report   │ │ Advisor  │                │
│  │ (GP/     │ │ Generator│ │ (Tool    │                │
│  │  XGBoost)│ │          │ │  Calling)│                │
│  └──────────┘ └──────────┘ └──────────┘                │
└─────────────────────────────────────────────────────────┘
```

---

## 9. 交付里程碑

### Phase 1: DES能力补齐（4周）
> 目标：满足 ICA 5.2 全部要求

| 周次 | 交付物 |
|------|--------|
| W1 | DAG路由引擎 + 多实体类型系统 |
| W2 | 调度策略（FIFO/LIFO/SPT/EDD）+ 设备故障统一模型 |
| W3 | 分布拟合（从历史数据自动fit）+ 批处理/解批 |
| W4 | Sankey流量图 + 瓶颈热力图 + 场景对比增强 |

### Phase 2: 3D + 布局优化（6周）
> 目标：满足 ICA 5.1 + 5.3 核心要求

| 周次 | 交付物 |
|------|--------|
| W5-6 | BIM/IFC导入引擎（web-ifc + Three.js集成）|
| W7-8 | 2D/3D布局编辑器（站点/通道/缓冲区拖拽放置）|
| W9 | 空间布局优化编码 + NSGA-II集成 |
| W10 | 约束系统（硬约束修复+软约束惩罚）+ OEE指标 |

### Phase 3: 数据集成 + 高级优化（4周）
> 目标：满足 ICA 7. Process Flow + 8. Optimization Design

| 周次 | 交付物 |
|------|--------|
| W11 | MQTT/OPC-UA真实连接器 |
| W12 | 数据管线（ETL）+ 数据血缘追踪 |
| W13 | 代理模型预筛选（GP/XGBoost）|
| W14 | 并行DES + SSO集成 |

### Phase 4: 集成测试 + 交付（2周）
| 周次 | 交付物 |
|------|--------|
| W15 | 端到端集成测试（ICA场景全覆盖）|
| W16 | 部署文档 + 用户培训材料 + UAT支持 |

---

## 10. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| BIM文件格式多样（DWG vs IFC vs Revit） | 3D导入兼容性 | 优先支持IFC（开放标准），DWG通过ODA转换 |
| 空间布局优化搜索空间巨大 | 优化不收敛 | 代理模型预筛选 + 分层优化（先粗后细）|
| 客户数据敏感（政府安全要求） | 部署限制 | 支持On-premise部署，无外部依赖 |
| 实时数据集成复杂（OT网络隔离） | 数据延迟 | 支持离线批量导入 + 实时API双模式 |
| 15个月2个Location | 交付压力 | Location 1完成后复用，Location 2仅配置差异 |

---

## 11. 成功指标

| 指标 | 目标值 |
|------|--------|
| ICA需求覆盖率 | 100%（全部Comply） |
| 仿真精度 | KPI误差 < 10%（vs 实际运行数据）|
| 优化效果 | 吞吐提升 ≥ 15% 或等待时间降低 ≥ 20% |
| 用户采纳 | 6个角色全部使用系统 |
| 系统可用性 | 99.5% uptime |

---

## 附录

### A. ICA原始需求文档
参见 `ace766b1-5c25-4354-a0fa-ba33b35bc635.xlsx`

### B. 相关技术规格
- [DES Engine Spec](../specs/DES-Engine-Spec.md)（待更新）
- [Layout Optimizer Spec](../specs/Layout-Optimizer-Spec.md)（新建）
- [BIM Import Spec](../specs/BIM-Import-Spec.md)（新建）
