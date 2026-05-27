# DOE（实验设计）框架 — 基盘能力技术规格说明书

> **版本**: v2.1
> **日期**: 2026-02-11
> **更新**: 2026-04-08
> **作者**: FactVerse AI Team
> **状态**: ✅ 已实现（WebSocket 实时推送待集成）
> **定位**: 🏗️ **基盘能力 (Base Platform Capability)** — 可被所有业务模块复用

---

## 目录

- [第一部分：基盘定位与模块集成](#第一部分基盘定位与模块集成)
  - [1. 基盘能力定义](#1-基盘能力定义)
  - [2. 各模块 DOE 应用场景](#2-各模块-doe-应用场景)
  - [3. 模块集成接口](#3-模块集成接口)
  - [4. 统一 API 入口](#4-统一-api-入口)
- [第二部分：产品需求文档 (PRD)](#第二部分产品需求文档-prd)
  - [1. 产品背景与目标](#1-产品背景与目标)
  - [2. 用户角色与场景](#2-用户角色与场景)
  - [3. 功能需求清单](#3-功能需求清单)
- [第三部分：技术规格说明 (Technical Spec)](#第三部分技术规格说明-technical-spec)
  - [1. 系统架构总览](#1-系统架构总览)
  - [2. 代码结构](#2-代码结构)
  - [3. 数据库设计](#3-数据库设计)
  - [4. 因子定义 (Factor Definition)](#4-因子定义-factor-definition)
  - [5. 实验设计方法 (DOE Methods)](#5-实验设计方法-doe-methods)
  - [6. 批量运行编排 (Batch Orchestration)](#6-批量运行编排-batch-orchestration)
  - [7. 统计分析引擎 (Statistical Analysis)](#7-统计分析引擎-statistical-analysis)
  - [8. 结果可视化 (Visualization)](#8-结果可视化-visualization)
  - [9. 实验模板 (Experiment Templates)](#9-实验模板-experiment-templates)
  - [10. 灵敏度分析 (Sensitivity Analysis)](#10-灵敏度分析-sensitivity-analysis)
  - [11. 非功能需求](#11-非功能需求)

---

# 第一部分：基盘定位与模块集成

## 1. 基盘能力定义

### 1.1 什么是基盘能力

DOE 框架是 FactVerse AI Engine 的**核心基盘能力**之一，与具体业务模块无关。它提供：

- **通用的实验设计能力**：全因子、分式因子、LHS、CCD 等设计方法
- **通用的统计分析能力**：ANOVA、响应面、灵敏度分析、元模型
- **通用的批量运行编排**：Celery 并行执行、进度追踪、失败恢复
- **通用的可视化能力**：主效应图、交互效应图、龙卷风图、响应面图

任何业务模块只需**注册自己的因子、响应变量和仿真/评估函数**，即可复用 DOE 框架的全部能力。

### 1.2 基盘架构位置

```
┌─────────────────────────────────────────────────────────────┐
│                      业务模块层 (Modules)                     │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────┐ │
│  │ TrafficOps │ │  HeatOps  │ │    FMS    │ │   Energy    │ │
│  │  客流优化   │ │  供热优化  │ │  设施维护  │ │  能源管理    │ │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └──────┬──────┘ │
│        │             │             │               │         │
│        └─────────────┼─────────────┼───────────────┘         │
│                      ▼                                       │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              基盘能力层 (Base Platform)                 │   │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐  │   │
│  │  │   DOE   │ │Anomaly  │ │Forecaster│ │ Optimizer │  │   │
│  │  │Framework│ │Detector │ │          │ │           │  │   │
│  │  └─────────┘ └─────────┘ └──────────┘ └───────────┘  │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              基础设施层 (Infrastructure)                │   │
│  │  PostgreSQL  │  Redis  │  Celery Workers  │  DES Engine│   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 1.3 代码位置

```
ai-engine/core/doe/           ← 基盘代码，不依赖任何业务模块
├── __init__.py
├── registry.py               ← 模块注册中心
├── design/                   ← 实验设计方法
│   ├── full_factorial.py
│   ├── fractional_factorial.py
│   ├── lhs.py
│   └── ccd.py
├── analysis/                 ← 统计分析引擎
│   ├── anova.py
│   ├── main_effects.py
│   ├── interactions.py
│   ├── rsm.py
│   ├── sensitivity.py
│   └── metamodel.py
├── orchestration/            ← 批量运行编排
│   ├── scheduler.py
│   ├── progress.py
│   └── recovery.py
├── visualization/            ← 图表生成
│   ├── charts.py
│   └── tornado.py
├── models.py                 ← Pydantic 数据模型
├── schemas.py                ← 数据库 ORM 模型
└── router.py                 ← 统一 API 路由
```

### 1.4 设计原则

| 原则 | 说明 |
|------|------|
| **模块无关** | DOE 核心代码不 import 任何业务模块 |
| **注册机制** | 业务模块通过 Registry 注册因子、响应变量、仿真函数 |
| **统一 API** | 所有模块通过同一个 `/ai/doe/experiments` 端点访问 |
| **零侵入** | 新增模块无需修改 DOE 框架代码 |

---

## 2. 各模块 DOE 应用场景

### 2.1 TrafficOps — 客流运营优化

**业务目标**：优化大厅/网点的客流处理能力，减少等待时间

| 项目 | 内容 |
|------|------|
| **因子 (Factors)** | `arrival_rate` 到达率 (人/小时)、`counter_count` 柜台数量、`routing_rule` 路由规则 (FIFO/优先级/分流) |
| **响应变量 (Responses)** | `throughput` 吞吐量 (人/天)、`avg_wait_time` 平均等待时间 (分钟) |
| **仿真函数** | 调用 DES 引擎的客流仿真模型 |
| **典型实验** | 3 因子 × 3 水平，L9 正交表，找出等待时间 < 5 分钟的最优配置 |

```python
# modules/traffic_ops/doe_integration.py
from ai_engine.core.doe.registry import DOERegistry

DOERegistry.register(
    module_type="traffic_ops",
    display_name="客流运营优化",
    factors=[
        {"name": "arrival_rate", "label": "到达率", "type": "continuous",
         "default_range": [50, 300], "unit": "人/小时"},
        {"name": "counter_count", "label": "柜台数量", "type": "discrete",
         "default_values": [3, 4, 5, 6, 7, 8]},
        {"name": "routing_rule", "label": "路由规则", "type": "categorical",
         "default_values": ["FIFO", "优先级", "智能分流"]},
    ],
    responses=[
        {"name": "throughput", "label": "吞吐量", "unit": "人/天", "direction": "maximize"},
        {"name": "avg_wait_time", "label": "平均等待时间", "unit": "分钟", "direction": "minimize"},
    ],
    simulation_fn="traffic_ops.simulation.run_traffic_sim",
)
```

### 2.2 HeatOps — 供热运营优化

**业务目标**：优化供热系统运行参数，提升能效，降低回水温度

| 项目 | 内容 |
|------|------|
| **因子 (Factors)** | `supply_temperature` 供水温度 (°C)、`pump_speed` 循环泵转速 (RPM)、`valve_opening` 阀门开度 (%) |
| **响应变量 (Responses)** | `efficiency` 换热效率 (%)、`return_temperature` 回水温度 (°C) |
| **仿真函数** | 调用供热系统热力学仿真模型 |
| **典型实验** | CCD 设计，构建响应面模型，找到效率 > 90% 且回水温度 < 40°C 的最优区域 |

```python
DOERegistry.register(
    module_type="heat_ops",
    display_name="供热运营优化",
    factors=[
        {"name": "supply_temperature", "label": "供水温度", "type": "continuous",
         "default_range": [55, 85], "unit": "°C"},
        {"name": "pump_speed", "label": "循环泵转速", "type": "continuous",
         "default_range": [800, 2000], "unit": "RPM"},
        {"name": "valve_opening", "label": "阀门开度", "type": "continuous",
         "default_range": [20, 100], "unit": "%"},
    ],
    responses=[
        {"name": "efficiency", "label": "换热效率", "unit": "%", "direction": "maximize"},
        {"name": "return_temperature", "label": "回水温度", "unit": "°C", "direction": "minimize"},
    ],
    simulation_fn="heat_ops.simulation.run_heat_sim",
)
```

### 2.3 FMS — 设施维护管理

**业务目标**：优化预防性维护策略，最大化设备可靠性，最小化维护成本

| 项目 | 内容 |
|------|------|
| **因子 (Factors)** | `pm_interval` 预防性维护间隔 (天)、`inspection_frequency` 巡检频率 (次/周)、`spare_stock_level` 备件库存水平 (件) |
| **响应变量 (Responses)** | `mtbf` 平均故障间隔时间 (小时)、`maintenance_cost` 维护成本 (元/月) |
| **仿真函数** | 调用设备退化 + 维护策略仿真模型 |
| **典型实验** | LHS 采样 50 组，Morris 灵敏度筛选关键因子，再全因子精细实验 |

```python
DOERegistry.register(
    module_type="fms",
    display_name="设施维护管理",
    factors=[
        {"name": "pm_interval", "label": "PM间隔", "type": "continuous",
         "default_range": [7, 90], "unit": "天"},
        {"name": "inspection_frequency", "label": "巡检频率", "type": "discrete",
         "default_values": [1, 2, 3, 5, 7], "unit": "次/周"},
        {"name": "spare_stock_level", "label": "备件库存水平", "type": "discrete",
         "default_values": [5, 10, 20, 50], "unit": "件"},
    ],
    responses=[
        {"name": "mtbf", "label": "平均故障间隔", "unit": "小时", "direction": "maximize"},
        {"name": "maintenance_cost", "label": "维护成本", "unit": "元/月", "direction": "minimize"},
    ],
    simulation_fn="fms.simulation.run_maintenance_sim",
)
```

### 2.4 Energy — 能源管理

**业务目标**：优化建筑能耗策略，在节能与舒适度之间取得最佳平衡

| 项目 | 内容 |
|------|------|
| **因子 (Factors)** | `hvac_setpoint` HVAC 温度设定值 (°C)、`lighting_schedule` 照明时间策略 (模式)、`occupancy_threshold` 人员感应阈值 (人) |
| **响应变量 (Responses)** | `kwh` 能耗 (kWh/天)、`comfort_score` 舒适度评分 (0-100) |
| **仿真函数** | 调用建筑能耗仿真模型 (EnergyPlus wrapper 或自研模型) |
| **典型实验** | 全因子 + 响应面，Sobol 灵敏度量化各因子能耗贡献，Pareto 前沿找到能耗-舒适度最优折中 |

```python
DOERegistry.register(
    module_type="energy",
    display_name="能源管理",
    factors=[
        {"name": "hvac_setpoint", "label": "HVAC设定温度", "type": "continuous",
         "default_range": [20, 28], "unit": "°C"},
        {"name": "lighting_schedule", "label": "照明策略", "type": "categorical",
         "default_values": ["全天常亮", "定时开关", "人感联动", "自然光优先"]},
        {"name": "occupancy_threshold", "label": "人员感应阈值", "type": "discrete",
         "default_values": [1, 3, 5, 10], "unit": "人"},
    ],
    responses=[
        {"name": "kwh", "label": "日能耗", "unit": "kWh", "direction": "minimize"},
        {"name": "comfort_score", "label": "舒适度评分", "unit": "分", "direction": "maximize"},
    ],
    simulation_fn="energy.simulation.run_energy_sim",
)
```

### 2.5 模块对比一览

| 模块 | 因子示例 | 响应示例 | 推荐设计方法 | 典型实验规模 |
|------|---------|---------|-------------|-------------|
| TrafficOps | 到达率、柜台数、路由规则 | 吞吐量、等待时间 | Taguchi L9 / 全因子 | 9~27 组 |
| HeatOps | 供水温度、泵速、阀门开度 | 换热效率、回水温度 | CCD | 15~20 组 |
| FMS | PM间隔、巡检频率、备件库存 | MTBF、维护成本 | LHS + Morris | 50~100 组 |
| Energy | HVAC设定、照明策略、人感阈值 | 能耗kWh、舒适度 | 全因子 + Sobol | 27~64 组 |

---

## 3. 模块集成接口

### 3.1 注册中心 (DOERegistry)

```python
# ai-engine/core/doe/registry.py

from typing import Callable, Optional
from dataclasses import dataclass, field

@dataclass
class ModuleRegistration:
    """业务模块的 DOE 注册信息"""
    module_type: str                          # 唯一标识: "traffic_ops", "heat_ops", "fms", "energy"
    display_name: str                         # 显示名称: "客流运营优化"
    factors: list[dict]                       # 预定义因子模板
    responses: list[dict]                     # 预定义响应变量模板
    simulation_fn: str                        # 仿真函数的 dotted path
    default_design: Optional[str] = None      # 推荐的设计方法
    default_replications: int = 5             # 默认重复次数
    constraints: list[dict] = field(default_factory=list)  # 因子约束

class DOERegistry:
    """DOE 模块注册中心 — 单例"""
    
    _modules: dict[str, ModuleRegistration] = {}
    
    @classmethod
    def register(cls, module_type: str, display_name: str,
                 factors: list[dict], responses: list[dict],
                 simulation_fn: str, **kwargs):
        """注册一个业务模块的 DOE 配置"""
        cls._modules[module_type] = ModuleRegistration(
            module_type=module_type,
            display_name=display_name,
            factors=factors,
            responses=responses,
            simulation_fn=simulation_fn,
            **kwargs,
        )
    
    @classmethod
    def get(cls, module_type: str) -> ModuleRegistration:
        """获取模块注册信息"""
        if module_type not in cls._modules:
            raise ValueError(f"未注册的模块类型: {module_type}，"
                           f"可用模块: {list(cls._modules.keys())}")
        return cls._modules[module_type]
    
    @classmethod
    def list_modules(cls) -> list[dict]:
        """列出所有已注册模块"""
        return [
            {
                "module_type": m.module_type,
                "display_name": m.display_name,
                "factor_count": len(m.factors),
                "response_count": len(m.responses),
            }
            for m in cls._modules.values()
        ]
    
    @classmethod
    def resolve_simulation_fn(cls, module_type: str) -> Callable:
        """动态解析仿真函数"""
        reg = cls.get(module_type)
        module_path, fn_name = reg.simulation_fn.rsplit(".", 1)
        import importlib
        mod = importlib.import_module(module_path)
        return getattr(mod, fn_name)
```

### 3.2 仿真函数接口约定

每个模块必须实现以下签名的仿真函数：

```python
def run_xxx_sim(factor_values: dict, config: dict) -> dict:
    """
    DOE 仿真函数标准接口
    
    Args:
        factor_values: 因子值字典
            例: {"arrival_rate": 100, "counter_count": 5, "routing_rule": "FIFO"}
        config: 运行配置
            例: {"random_seed": 42, "duration": 480, "warm_up": 60, ...}
    
    Returns:
        响应变量字典
            例: {"throughput": 156.3, "avg_wait_time": 4.2}
    
    Raises:
        SimulationError: 仿真运行失败时抛出
    """
    ...
```

### 3.3 新模块接入步骤

新业务模块接入 DOE 只需 3 步：

```
1. 实现仿真函数 → 符合标准签名 (factor_values, config) -> dict
2. 调用 DOERegistry.register() → 注册因子、响应变量、仿真函数
3. 前端调用 POST /ai/doe/experiments → 传入 module_type 参数

无需修改 DOE 框架任何代码。
```

---

## 4. 统一 API 入口

### 4.1 核心端点

```
POST /ai/doe/experiments
```

**请求体**：

```json
{
    "module_type": "traffic_ops",
    "project_id": "uuid-...",
    "name": "柜台数量优化实验",
    "description": "探索不同柜台配置对客流吞吐量的影响",
    
    "factors": [
        {"name": "arrival_rate", "min_value": 50, "max_value": 200, "num_levels": 3},
        {"name": "counter_count", "discrete_values": [3, 4, 5, 6]},
        {"name": "routing_rule", "category_values": ["FIFO", "优先级", "智能分流"]}
    ],
    "response_variables": [
        {"name": "throughput", "direction": "maximize"},
        {"name": "avg_wait_time", "direction": "minimize"}
    ],
    
    "design_method": "fractional_factorial",
    "design_config": {"method": "taguchi", "taguchi_table": "L9"},
    "num_replications": 5,
    
    "auto_run": true
}
```

**关键字段**：`module_type` 决定使用哪个模块的仿真函数。因子和响应变量可以使用模块预定义的默认值，也可以自行覆盖。

### 4.2 获取模块列表

```
GET /ai/doe/modules
```

**响应**：

```json
{
    "modules": [
        {"module_type": "traffic_ops", "display_name": "客流运营优化", "factor_count": 3, "response_count": 2},
        {"module_type": "heat_ops", "display_name": "供热运营优化", "factor_count": 3, "response_count": 2},
        {"module_type": "fms", "display_name": "设施维护管理", "factor_count": 3, "response_count": 2},
        {"module_type": "energy", "display_name": "能源管理", "factor_count": 3, "response_count": 2}
    ]
}
```

### 4.3 获取模块预定义因子

```
GET /ai/doe/modules/{module_type}/schema
```

**响应**：

```json
{
    "module_type": "traffic_ops",
    "display_name": "客流运营优化",
    "factors": [
        {"name": "arrival_rate", "label": "到达率", "type": "continuous", "default_range": [50, 300], "unit": "人/小时"},
        {"name": "counter_count", "label": "柜台数量", "type": "discrete", "default_values": [3,4,5,6,7,8]},
        {"name": "routing_rule", "label": "路由规则", "type": "categorical", "default_values": ["FIFO","优先级","智能分流"]}
    ],
    "responses": [
        {"name": "throughput", "label": "吞吐量", "unit": "人/天", "direction": "maximize"},
        {"name": "avg_wait_time", "label": "平均等待时间", "unit": "分钟", "direction": "minimize"}
    ],
    "recommended_design": "fractional_factorial"
}
```

### 4.4 完整 API 端点汇总

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 注册 | `GET` | `/ai/doe/modules` | 已注册模块列表 |
| 注册 | `GET` | `/ai/doe/modules/{type}/schema` | 模块因子/响应变量 schema |
| 实验 | `POST` | `/ai/doe/experiments` | 创建实验（含 `module_type`） |
| 实验 | `GET` | `/ai/doe/experiments` | 实验列表（可按 `module_type` 过滤） |
| 实验 | `GET` | `/ai/doe/experiments/{eid}` | 实验详情 |
| 实验 | `PUT` | `/ai/doe/experiments/{eid}` | 更新实验 |
| 实验 | `DELETE` | `/ai/doe/experiments/{eid}` | 删除实验 |
| 因子 | `POST` | `/ai/doe/experiments/{eid}/factors` | 创建因子 |
| 因子 | `GET` | `/ai/doe/experiments/{eid}/factors` | 因子列表 |
| 因子 | `PUT` | `/ai/doe/experiments/{eid}/factors/{fid}` | 更新因子 |
| 因子 | `DELETE` | `/ai/doe/experiments/{eid}/factors/{fid}` | 删除因子 |
| 设计 | `POST` | `/ai/doe/experiments/{eid}/design/generate` | 生成设计矩阵 |
| 设计 | `POST` | `/ai/doe/experiments/{eid}/design/recommend` | 获取设计推荐 |
| 设计 | `GET` | `/ai/doe/experiments/{eid}/design/matrix` | 获取设计矩阵 |
| 运行 | `POST` | `/ai/doe/experiments/{eid}/submit` | 提交运行 |
| 运行 | `POST` | `/ai/doe/experiments/{eid}/pause` | 暂停 |
| 运行 | `POST` | `/ai/doe/experiments/{eid}/resume` | 恢复 |
| 运行 | `POST` | `/ai/doe/experiments/{eid}/cancel` | 取消 |
| 运行 | `GET` | `/ai/doe/experiments/{eid}/progress` | 进度查询 |
| 运行 | `WS` | `/ws/doe/experiments/{eid}/progress` | 进度 WebSocket |
| 运行 | `GET` | `/ai/doe/experiments/{eid}/runs` | 运行列表 |
| 分析 | `POST` | `/ai/doe/experiments/{eid}/analysis/anova` | ANOVA |
| 分析 | `POST` | `/ai/doe/experiments/{eid}/analysis/main-effects` | 主效应 |
| 分析 | `POST` | `/ai/doe/experiments/{eid}/analysis/interactions` | 交互效应 |
| 分析 | `POST` | `/ai/doe/experiments/{eid}/analysis/rsm` | 响应面 |
| 分析 | `POST` | `/ai/doe/experiments/{eid}/analysis/metamodel` | 元模型训练 |
| 分析 | `POST` | `/ai/doe/experiments/{eid}/analysis/metamodel/predict` | 元模型预测 |
| 分析 | `POST` | `/ai/doe/experiments/{eid}/analysis/sensitivity/morris` | Morris |
| 分析 | `POST` | `/ai/doe/experiments/{eid}/analysis/sensitivity/sobol` | Sobol |
| 图表 | `GET` | `/ai/doe/experiments/{eid}/charts/{type}` | 图表数据 |
| 导出 | `GET` | `/ai/doe/experiments/{eid}/results/export` | 导出数据 |
| 模板 | `GET` | `/ai/doe/templates` | 模板列表 |
| 模板 | `POST` | `/ai/doe/templates` | 创建模板 |
| 模板 | `POST` | `/ai/doe/experiments/from-template/{tid}` | 从模板创建 |

---

# 第二部分：产品需求文档 (PRD)

## 1. 产品背景与目标

### 1.1 背景

FactVerse 平台各业务模块（TrafficOps、HeatOps、FMS、Energy 等）都存在**参数优化**需求：

- **TrafficOps**：需要找到最优的柜台配置和路由规则
- **HeatOps**：需要找到最优的供水温度和泵速组合
- **FMS**：需要找到最优的维护间隔和备件库存策略
- **Energy**：需要找到节能与舒适度的最佳平衡点

这些需求本质相同：**给定一组可调因子，通过系统性实验找到最优响应**。因此，DOE 框架作为基盘能力统一提供。

当前痛点：

- **手动调参低效**：用户需逐个修改参数、运行仿真、记录结果，寻找最优配置耗时数小时甚至数天
- **缺乏系统性实验方法**：用户凭经验调参，无法确定哪些因子真正影响系统性能
- **统计严谨性不足**：单次运行结果受随机性影响，缺少重复实验与统计推断
- **无法量化因子交互效应**：两个因子的组合效应无法通过单因子实验发现
- **各模块重复造轮子**：每个模块各自实现参数搜索逻辑，质量参差不齐

### 1.2 产品目标

构建 **DOE（实验设计）框架**作为平台基盘能力，所有业务模块共享：

| 目标 | 衡量指标 | 目标值 |
|------|---------|--------|
| 降低实验设计门槛 | 用户从"想做实验"到"提交运行"的时间 | < 5 分钟 |
| 提升实验效率 | 相比手动调参，减少所需仿真运行次数 | 减少 60%+ |
| 保证统计严谨性 | 所有结论附带置信区间和 p 值 | 默认 95% CI |
| 加速决策 | 从提交实验到获得可行动洞察的时间 | < 30 分钟（中等规模） |
| 模块零开发接入 | 新模块接入 DOE 所需代码量 | < 50 行 |

### 1.3 成功标准

- 用户能在不了解 DOE 理论的情况下，通过模板完成一次完整实验
- 支持 1000+ 实验组合的批量运行，无需人工干预
- 统计分析结果与 Minitab / JMP 等专业工具一致性 > 95%
- 系统可在 10 个以上 Celery Worker 上线性扩展
- 4 个业务模块（TrafficOps / HeatOps / FMS / Energy）均可通过统一接口使用 DOE

---

## 2. 用户角色与场景

### 2.1 用户角色

| 角色 | 描述 | 核心需求 |
|------|------|---------|
| **仿真工程师** | 构建和维护仿真模型的技术人员 | 定义因子、设计实验、解读统计结果 |
| **运营经理** | 关注产线/流程优化的业务人员 | 快速获得优化建议，无需理解统计原理 |
| **数据科学家** | 深度分析实验数据的高级用户 | 导出原始数据、自定义分析、构建元模型 |
| **系统管理员** | 管理计算资源和任务调度 | 监控运行状态、资源分配、异常处理 |

### 2.2 核心用户场景

**场景 1：TrafficOps — 网点客流吞吐量优化**

> 张工负责一家银行网点的运营优化。他想知道：柜台数量(3-6)、到达率(50-200/h)、路由规则(FIFO/优先级/智能分流) 这三个因子如何影响日吞吐量。他在 DOE 界面选择 `module_type=traffic_ops`，系统自动预填因子模板，他只需调整取值范围。系统推荐 L9 正交表，生成 27 次实验（每组 3 次重复），30 分钟后获得 ANOVA 表和主效应图，发现柜台数量是最显著因子（p < 0.001），且柜台数量与路由规则存在交互效应。

**场景 2：HeatOps — 供热效率优化**

> 李工负责一个供热站的运行参数优化。他选择 `module_type=heat_ops`，使用 CCD 设计，探索供水温度(55-85°C)、泵速(800-2000 RPM)、阀门开度(20-100%) 三个连续因子。获得响应面模型后，通过等高线图找到效率 > 92% 且回水温度 < 38°C 的可行域，将运行参数设定在最优区域。

**场景 3：FMS — 维护策略灵敏度排查**

> 王博士负责设施维护策略优化，面对 PM间隔、巡检频率、备件库存、人员排班等 8 个因子。他选择 `module_type=fms`，先用 Morris 方法筛选出 3 个关键因子，再对这 3 个因子做详细的全因子实验。

**场景 4：Energy — 能耗-舒适度 Pareto 优化**

> 赵工负责建筑能源管理，需要在节能和舒适度之间取得平衡。他选择 `module_type=energy`，进行多目标实验，得到 Pareto 前沿，为决策层提供可视化的折中方案。

---

## 3. 功能需求清单

### P0 — 必须交付（MVP）

| ID | 功能 | 描述 |
|----|------|------|
| F-001 | 模块注册机制 | 支持业务模块注册因子、响应变量、仿真函数 |
| F-002 | 因子定义 | 支持连续型、离散型、分类型因子的定义，含范围、水平、约束 |
| F-003 | 全因子设计 | 自动生成全因子实验矩阵 |
| F-004 | 分式因子设计 | 支持 Taguchi 正交表 (L4, L8, L9, L16, L18, L27) |
| F-005 | 批量运行提交 | 一键提交 N 个实验 × M 次重复 |
| F-006 | 并行执行 | 通过 Celery Worker 并行执行仿真任务 |
| F-007 | 进度追踪 | 实时显示实验进度、预计剩余时间 |
| F-008 | ANOVA 分析 | 单因子/多因子方差分析，输出 F 值、p 值 |
| F-009 | 主效应图 | ECharts 绘制各因子主效应折线图 |
| F-010 | 交互效应图 | ECharts 绘制两因子交互效应图 |
| F-011 | 结果导出 | 导出实验矩阵和结果为 CSV/Excel |

### P1 — 重要增强

| ID | 功能 | 描述 |
|----|------|------|
| F-012 | 拉丁超立方采样 | LHS 实验设计，适用于高维因子空间 |
| F-013 | 中心组合设计 | CCD 实验设计，用于响应面建模 |
| F-014 | 响应面方法 (RSM) | 二次多项式拟合 + 等高线图 + 3D 曲面图 |
| F-015 | 实验模板 | 预置模板 + 用户自定义模板 |
| F-016 | 失败恢复 | 自动重试失败的仿真运行，支持断点续跑 |
| F-017 | 灵敏度分析 | Morris / Sobol 全局灵敏度分析 |
| F-018 | 龙卷风图 | 单因子灵敏度的龙卷风排序图 |
| F-019 | 因子约束 | 支持因子间线性/非线性约束条件 |

### P2 — 未来增强

| ID | 功能 | 描述 |
|----|------|------|
| F-020 | 元模型训练 | XGBoost / 高斯过程回归元模型 |
| F-021 | 快速预测 API | 基于元模型的毫秒级预测接口 |
| F-022 | 自适应实验 | 贝叶斯优化 (BO) 驱动的自适应实验设计 |
| F-023 | 多目标优化 | Pareto 前沿可视化，支持多响应同时优化 |
| F-024 | 实验对比 | 多次实验结果的横向对比视图 |
| F-025 | 协作标注 | 团队成员可对实验结果添加批注和标签 |

---

# 第三部分：技术规格说明 (Technical Spec)

## 1. 系统架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Vue 3)                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │ 模块选择    │ │ 因子定义    │ │ 运行监控    │ │ 结果分析  │ │
│  │ +因子面板   │ │   面板      │ │   面板      │ │   面板    │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘ │
│                      ECharts 可视化                          │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API / WebSocket
┌───────────────────────┴─────────────────────────────────────┐
│                   Backend (FastAPI)                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         DOE Core — ai-engine/core/doe/                │   │
│  │  ┌──────────┐ ┌────────┐ ┌────────┐ ┌────────────┐  │   │
│  │  │ Registry │ │Design  │ │Analysis│ │Orchestrator│  │   │
│  │  │ (注册中心)│ │Engine  │ │Engine  │ │ (批量编排)  │  │   │
│  │  └──────────┘ └────────┘ └────────┘ └────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ▲                                   │
│            module_type   │  simulation_fn                    │
│  ┌───────────────────────┴──────────────────────────────┐   │
│  │              业务模块仿真函数                           │   │
│  │  traffic_ops.sim │ heat_ops.sim │ fms.sim │ energy.sim│   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────┴──┐    ┌───────┴──┐    ┌───────┴──┐
│ Celery   │    │ Celery   │    │ Celery   │
│ Worker 1 │    │ Worker 2 │    │ Worker N │
└──────────┘    └──────────┘    └──────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
                ┌───────┴───────┐
                │  Redis Broker │
                │  + Result     │
                │    Backend    │
                └───────────────┘
```

### 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端 | Vue 3 + TypeScript + ECharts 5 | 现有前端框架 |
| API | FastAPI + Pydantic v2 | 现有后端框架 |
| 实验设计 | pyDOE2 + SALib | DOE 矩阵生成 + 灵敏度分析 |
| 统计分析 | scipy.stats + statsmodels + scikit-learn | ANOVA / 回归 / 元模型 |
| 元模型 | XGBoost + scikit-learn (GaussianProcessRegressor) | P2 阶段 |
| 任务队列 | Celery 5 + Redis | 批量运行编排 |
| 数据库 | PostgreSQL 15 | 现有数据库 |
| 缓存 | Redis 7 | 进度追踪、实时状态 |

---

## 2. 代码结构

```
ai-engine/
├── core/                          ← 基盘能力（模块无关）
│   ├── doe/                       ← DOE 框架
│   │   ├── __init__.py
│   │   ├── registry.py            ← 模块注册中心
│   │   ├── models.py              ← Pydantic 模型（含 module_type 字段）
│   │   ├── schemas.py             ← SQLAlchemy ORM
│   │   ├── router.py              ← /ai/doe/* 路由
│   │   ├── design/
│   │   │   ├── full_factorial.py
│   │   │   ├── fractional_factorial.py
│   │   │   ├── lhs.py
│   │   │   └── ccd.py
│   │   ├── analysis/
│   │   │   ├── anova.py
│   │   │   ├── main_effects.py
│   │   │   ├── interactions.py
│   │   │   ├── rsm.py
│   │   │   ├── sensitivity.py
│   │   │   └── metamodel.py
│   │   ├── orchestration/
│   │   │   ├── scheduler.py
│   │   │   ├── progress.py
│   │   │   └── recovery.py
│   │   └── visualization/
│   │       ├── charts.py
│   │       └── tornado.py
│   ├── anomaly/                   ← 异常检测（另一个基盘能力）
│   ├── forecaster/                ← 预测引擎（另一个基盘能力）
│   └── optimizer/                 ← 优化器（另一个基盘能力）
│
├── modules/                       ← 业务模块（依赖基盘）
│   ├── traffic_ops/
│   │   ├── doe_integration.py     ← DOERegistry.register(...)
│   │   └── simulation.py          ← run_traffic_sim()
│   ├── heat_ops/
│   │   ├── doe_integration.py
│   │   └── simulation.py
│   ├── fms/
│   │   ├── doe_integration.py
│   │   └── simulation.py
│   └── energy/
│       ├── doe_integration.py
│       └── simulation.py
```

---

## 3. 数据库设计

### 3.1 ER 图

```
doe_experiments (含 module_type)
    ─┬─< doe_factors ─── factor_levels
     │
     ├─< doe_design_matrix
     │
     ├─< doe_runs ─< doe_run_results
     │
     ├─< doe_analysis_results
     │
     └── doe_templates
```

### 3.2 表结构定义

#### `doe_experiments` — 实验主表

```sql
CREATE TABLE doe_experiments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id),
    module_type     VARCHAR(50) NOT NULL,   -- 'traffic_ops', 'heat_ops', 'fms', 'energy', ...
    simulation_id   UUID REFERENCES simulations(id),  -- 可选，某些模块不需要 DES 引擎
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    
    -- 实验设计配置
    design_method   VARCHAR(50) NOT NULL,  -- 'full_factorial', 'fractional_factorial', 'lhs', 'ccd', 'custom'
    design_config   JSONB NOT NULL DEFAULT '{}',
    
    -- 运行配置
    num_replications    INT NOT NULL DEFAULT 5,
    random_seed_base    BIGINT DEFAULT 42,
    seed_strategy       VARCHAR(20) DEFAULT 'sequential',
    simulation_duration FLOAT,
    warm_up_period      FLOAT DEFAULT 0,
    
    -- 响应变量
    response_variables  JSONB NOT NULL,
    
    -- 状态
    status          VARCHAR(20) NOT NULL DEFAULT 'draft',
    total_runs      INT DEFAULT 0,
    completed_runs  INT DEFAULT 0,
    failed_runs     INT DEFAULT 0,
    
    -- 模板来源
    template_id     UUID REFERENCES doe_templates(id),
    
    -- 审计
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_doe_experiments_project ON doe_experiments(project_id);
CREATE INDEX idx_doe_experiments_module ON doe_experiments(module_type);
CREATE INDEX idx_doe_experiments_status ON doe_experiments(status);
```

#### `doe_factors` — 因子定义表

```sql
CREATE TABLE doe_factors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id   UUID NOT NULL REFERENCES doe_experiments(id) ON DELETE CASCADE,
    
    name            VARCHAR(100) NOT NULL,
    label           VARCHAR(255),
    description     TEXT,
    
    factor_type     VARCHAR(20) NOT NULL,   -- 'continuous', 'discrete', 'categorical'
    
    -- 连续型因子
    min_value       FLOAT,
    max_value       FLOAT,
    num_levels      INT,
    
    -- 离散型因子
    discrete_values JSONB,
    
    -- 分类型因子
    category_values JSONB,
    
    -- 约束
    constraints     JSONB DEFAULT '[]',
    
    -- 显示
    unit            VARCHAR(50),
    sort_order      INT DEFAULT 0,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(experiment_id, name)
);

CREATE INDEX idx_doe_factors_experiment ON doe_factors(experiment_id);
```

#### `doe_design_matrix` — 实验设计矩阵

```sql
CREATE TABLE doe_design_matrix (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id   UUID NOT NULL REFERENCES doe_experiments(id) ON DELETE CASCADE,
    
    run_number      INT NOT NULL,
    factor_values   JSONB NOT NULL,
    coded_values    JSONB,
    is_center_point BOOLEAN DEFAULT FALSE,
    
    UNIQUE(experiment_id, run_number)
);

CREATE INDEX idx_doe_design_matrix_experiment ON doe_design_matrix(experiment_id);
```

#### `doe_runs` — 运行实例表

```sql
CREATE TABLE doe_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id   UUID NOT NULL REFERENCES doe_experiments(id) ON DELETE CASCADE,
    matrix_id       UUID NOT NULL REFERENCES doe_design_matrix(id),
    
    replication     INT NOT NULL,
    random_seed     BIGINT NOT NULL,
    
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    
    celery_task_id  VARCHAR(255),
    worker_id       VARCHAR(255),
    
    queued_at       TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    
    results         JSONB,
    execution_time_ms   INT,
    error_message       TEXT,
    retry_count         INT DEFAULT 0,
    max_retries         INT DEFAULT 3,
    raw_output_path     VARCHAR(500),
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(matrix_id, replication)
);

CREATE INDEX idx_doe_runs_experiment ON doe_runs(experiment_id);
CREATE INDEX idx_doe_runs_status ON doe_runs(status);
CREATE INDEX idx_doe_runs_celery ON doe_runs(celery_task_id);
```

#### `doe_analysis_results` — 分析结果缓存表

```sql
CREATE TABLE doe_analysis_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id   UUID NOT NULL REFERENCES doe_experiments(id) ON DELETE CASCADE,
    
    analysis_type   VARCHAR(50) NOT NULL,
    response_var    VARCHAR(100) NOT NULL,
    
    config          JSONB DEFAULT '{}',
    results         JSONB NOT NULL,
    
    model_blob      BYTEA,
    model_metrics   JSONB,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(experiment_id, analysis_type, response_var)
);

CREATE INDEX idx_doe_analysis_experiment ON doe_analysis_results(experiment_id);
```

#### `doe_templates` — 实验模板表

```sql
CREATE TABLE doe_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    module_type     VARCHAR(50),            -- 关联模块类型，NULL 表示通用模板
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    category        VARCHAR(100),
    icon            VARCHAR(50),
    
    is_builtin      BOOLEAN DEFAULT FALSE,
    is_public       BOOLEAN DEFAULT FALSE,
    
    template_config JSONB NOT NULL,
    
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usage_count     INT DEFAULT 0
);

CREATE INDEX idx_doe_templates_module ON doe_templates(module_type);
CREATE INDEX idx_doe_templates_category ON doe_templates(category);
```

---

## 4. 因子定义 (Factor Definition)

### 4.1 因子类型

#### 连续型因子 (Continuous)

- **定义**：在给定范围 [min, max] 内取任意实数值
- **示例**：`supply_temperature: 55.0 ~ 85.0 °C`（HeatOps）
- **水平生成**：等间距划分（全因子），或根据设计方法自动计算
- **编码**：线性映射到 [-1, +1]，编码公式：`coded = 2 * (x - center) / range`

#### 离散型因子 (Discrete)

- **定义**：在给定的整数/浮点数集合中取值
- **示例**：`counter_count: [3, 4, 5, 6]`（TrafficOps）
- **水平**：用户显式指定的值列表
- **编码**：按排序顺序等间距编码到 [-1, +1]

#### 分类型因子 (Categorical)

- **定义**：取值为有限的非数值类别
- **示例**：`lighting_schedule: ["全天常亮", "定时开关", "人感联动"]`（Energy）
- **编码**：独热编码 (One-Hot) 或效应编码 (Effect Coding)

### 4.2 因子约束

```python
class ConstraintType(str, Enum):
    RANGE = "range"
    LINKED = "linked"
    EXCLUSION = "exclusion"
    EXPRESSION = "expression"

# 约束示例（TrafficOps）
constraints = [
    {
        "type": "linked",
        "expression": "counter_count >= arrival_rate / 50",
        "description": "柜台数不能少于到达率的1/50"
    }
]

# 约束示例（HeatOps）
constraints = [
    {
        "type": "expression",
        "expression": "supply_temperature > return_temperature_target + 10",
        "description": "供水温度至少比回水目标高10°C"
    }
]
```

### 4.3 Pydantic 模型

```python
from pydantic import BaseModel, Field, model_validator
from typing import Optional, Literal
from uuid import UUID

class FactorCreate(BaseModel):
    name: str = Field(..., pattern=r'^[a-z][a-z0-9_]*$', max_length=100)
    label: str = Field(..., max_length=255)
    description: Optional[str] = None
    factor_type: Literal["continuous", "discrete", "categorical"]
    
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    num_levels: Optional[int] = Field(None, ge=2, le=20)
    discrete_values: Optional[list[float]] = None
    category_values: Optional[list[str]] = None
    
    unit: Optional[str] = None
    constraints: list[dict] = Field(default_factory=list)
    sort_order: int = 0
    
    @model_validator(mode='after')
    def validate_factor_fields(self):
        if self.factor_type == 'continuous':
            if self.min_value is None or self.max_value is None:
                raise ValueError("连续型因子必须指定 min_value 和 max_value")
            if self.min_value >= self.max_value:
                raise ValueError("min_value 必须小于 max_value")
            if self.num_levels is None:
                self.num_levels = 3
        elif self.factor_type == 'discrete':
            if not self.discrete_values or len(self.discrete_values) < 2:
                raise ValueError("离散型因子至少需要2个值")
        elif self.factor_type == 'categorical':
            if not self.category_values or len(self.category_values) < 2:
                raise ValueError("分类型因子至少需要2个类别")
        return self


class ExperimentCreate(BaseModel):
    """创建实验 — 含 module_type"""
    module_type: str = Field(..., description="业务模块类型: traffic_ops, heat_ops, fms, energy")
    project_id: UUID
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    
    factors: list[FactorCreate]
    response_variables: list[dict]
    
    design_method: str = "full_factorial"
    design_config: dict = Field(default_factory=dict)
    num_replications: int = Field(default=5, ge=1, le=100)
    
    auto_run: bool = False
```

### 4.4 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/ai/doe/experiments/{eid}/factors` | 创建因子 |
| `GET` | `/ai/doe/experiments/{eid}/factors` | 获取实验所有因子 |
| `PUT` | `/ai/doe/experiments/{eid}/factors/{fid}` | 更新因子定义 |
| `DELETE` | `/ai/doe/experiments/{eid}/factors/{fid}` | 删除因子 |
| `POST` | `/ai/doe/experiments/{eid}/factors/validate` | 校验因子组合与约束 |

### 4.5 验收标准

- [x] 可创建 3 种类型因子，UI 表单根据类型动态切换输入字段
- [x] 连续型因子自动计算等间距水平并显示
- [x] 因子名唯一性校验（同一实验内不重复）
- [x] 约束表达式语法校验（使用 Python ast.parse 安全解析）
- [x] 选择 module_type 后，因子模板自动预填

---

## 5. 实验设计方法 (DOE Methods)

### 5.1 全因子设计 (Full Factorial)

**适用场景**：因子数 ≤ 4，每因子水平数 ≤ 5，总组合数可控

```python
import itertools
import numpy as np

def full_factorial(factors: list[dict]) -> np.ndarray:
    level_lists = [f["levels"] for f in factors]
    matrix = np.array(list(itertools.product(*level_lists)))
    return matrix
```

**运行次数**：$N = \prod_{i=1}^{k} L_i$

### 5.2 分式因子设计 (Fractional Factorial / Taguchi)

**适用场景**：因子数 > 4，需要减少实验次数

**Taguchi 正交表映射**：

| 正交表 | 因子数 | 水平数 | 实验次数 | 适用 |
|--------|--------|--------|---------|------|
| L4     | 3      | 2      | 4       | 快速筛选 |
| L8     | 7      | 2      | 8       | 2 水平筛选 |
| L9     | 4      | 3      | 9       | 3 水平标准 |
| L16    | 15     | 2      | 16      | 大规模 2 水平 |
| L18    | 8      | 2-3    | 18      | 混合水平 |
| L27    | 13     | 3      | 27      | 3 水平大规模 |

```python
from pyDOE2 import fracfact, gsd

def fractional_factorial(factors: list[dict], config: dict) -> np.ndarray:
    if config["method"] == "taguchi":
        table = TAGUCHI_TABLES[config["taguchi_table"]]
        return map_levels(table, factors)
    elif config["method"] == "resolution":
        n_factors = len(factors)
        gen_string = compute_generators(n_factors, config["resolution"])
        coded_matrix = fracfact(gen_string)
        return decode_matrix(coded_matrix, factors)

def auto_recommend_design(factors: list[dict]) -> dict:
    """根据因子数量和水平数自动推荐设计方法"""
    n = len(factors)
    max_levels = max(len(f["levels"]) for f in factors)
    total_full = np.prod([len(f["levels"]) for f in factors])
    
    if total_full <= 64:
        return {"method": "full_factorial", "reason": f"全因子共{total_full}次，可接受"}
    if max_levels == 2:
        return {"method": "taguchi", "taguchi_table": "L8" if n <= 7 else "L16"}
    if max_levels == 3:
        return {"method": "taguchi", "taguchi_table": "L9" if n <= 4 else "L27"}
    return {"method": "lhs", "samples": max(2 * n, 20)}
```

### 5.3 拉丁超立方采样 (Latin Hypercube Sampling)

**适用场景**：高维因子空间（> 5 个因子），连续型因子为主

```python
from pyDOE2 import lhs

def latin_hypercube_design(factors: list[dict], config: dict) -> np.ndarray:
    n_factors = len(factors)
    n_samples = config.get("num_samples", 10 * n_factors)
    criterion = config.get("criterion", "maximin")
    
    unit_matrix = lhs(n_factors, samples=n_samples, criterion=criterion,
                      iterations=config.get("iterations", 1000))
    
    design = np.zeros_like(unit_matrix)
    for i, factor in enumerate(factors):
        if factor["factor_type"] == "continuous":
            design[:, i] = factor["min_value"] + unit_matrix[:, i] * (
                factor["max_value"] - factor["min_value"])
        elif factor["factor_type"] == "discrete":
            values = np.array(factor["discrete_values"])
            indices = np.round(unit_matrix[:, i] * (len(values) - 1)).astype(int)
            design[:, i] = values[indices]
        elif factor["factor_type"] == "categorical":
            n_cats = len(factor["category_values"])
            design[:, i] = np.floor(unit_matrix[:, i] * n_cats).astype(int)
    
    return design
```

### 5.4 中心组合设计 (Central Composite Design)

**适用场景**：构建二阶响应面模型，连续型因子为主，因子数 2-5

```python
from pyDOE2 import ccdesign

def central_composite_design(factors: list[dict], config: dict) -> np.ndarray:
    n_factors = len([f for f in factors if f["factor_type"] == "continuous"])
    
    coded_matrix = ccdesign(
        n_factors,
        alpha=config.get("alpha", "orthogonal"),
        center=config.get("center_points", (4, 4)),
        face=config.get("face", "circumscribed")
    )
    
    return decode_matrix(coded_matrix, factors)
```

**运行次数**：$N = 2^k + 2k + n_c$

### 5.5 验收标准

- [x] 4 种设计方法均可生成正确的实验矩阵
- [x] 自动推荐结果合理
- [x] Taguchi 正交表与标准正交表一致
- [x] LHS 采样的最小点间距 > 理论最优的 80%
- [x] CCD 设计的 alpha 值计算正确
- [x] 设计矩阵生成时间 < 2 秒（1000 组以内）

---

## 6. 批量运行编排 (Batch Orchestration)

### 6.1 架构设计

```
用户点击"提交运行"
       │
       ▼
┌──────────────────┐
│  ExperimentRunner │ ─── 创建所有 doe_runs 记录
│  (FastAPI)        │     通过 Registry 解析 simulation_fn
└────────┬─────────┘
         │ 按批次提交 Celery 任务
         ▼
┌──────────────────┐
│  Celery Broker   │ ─── Redis Queue: doe.simulation
│  (Redis)         │
└────────┬─────────┘
    ┌────┼────┐
    ▼    ▼    ▼
┌──────┐┌──────┐┌──────┐
│ W1   ││ W2   ││ W3   │ ─── 每个 Worker 调用 module 的 simulation_fn
└──┬───┘└──┬───┘└──┬───┘
   └───────┼───────┘
           ▼
┌──────────────────┐
│  Result Backend  │
└──────────────────┘
```

### 6.2 Celery 任务定义

```python
# ai-engine/core/doe/orchestration/tasks.py

from celery import shared_task, chord
from ai_engine.core.doe.registry import DOERegistry

@shared_task(
    bind=True,
    name="doe.run_simulation",
    queue="doe.simulation",
    max_retries=3,
    default_retry_delay=10,
    acks_late=True,
    reject_on_worker_lost=True
)
def run_simulation(self, run_id: str, experiment_id: str,
                   module_type: str, factor_values: dict,
                   random_seed: int, simulation_config: dict) -> dict:
    """
    执行单次仿真运行 — 通过 Registry 动态解析仿真函数
    """
    try:
        update_run_status(run_id, "running", worker_id=self.request.hostname)
        
        # 通过 Registry 获取模块仿真函数
        sim_fn = DOERegistry.resolve_simulation_fn(module_type)
        
        config = {
            "random_seed": random_seed,
            "duration": simulation_config.get("duration"),
            "warm_up": simulation_config.get("warm_up", 0),
            **simulation_config,
        }
        
        # 调用模块仿真函数（统一接口）
        results = sim_fn(factor_values=factor_values, config=config)
        
        update_run_results(run_id, results)
        return {"run_id": run_id, "results": results}
    
    except Exception as exc:
        if self.request.retries < self.max_retries:
            update_run_status(run_id, "retrying", error_message=str(exc))
            raise self.retry(exc=exc)
        update_run_status(run_id, "failed", error_message=str(exc))
        raise


@shared_task(name="doe.on_experiment_complete")
def on_experiment_complete(results: list, experiment_id: str):
    """所有运行完成后的回调 — 更新状态、触发自动分析"""
    successful = [r for r in results if r is not None]
    update_experiment_status(experiment_id, "completed",
                           completed_runs=len(successful),
                           failed_runs=len(results) - len(successful))
    
    experiment = get_experiment(experiment_id)
    if experiment.template and experiment.template.recommended_analysis:
        for analysis_type in experiment.template.recommended_analysis:
            trigger_analysis.delay(experiment_id, analysis_type)
```

### 6.3 批量提交逻辑

```python
class DOEOrchestrator:
    
    BATCH_SIZE = 50
    
    async def submit_experiment(self, experiment_id: str) -> dict:
        experiment = await self.get_experiment(experiment_id)
        matrix = await self.get_design_matrix(experiment_id)
        
        # 1. 创建所有 run 记录
        runs = []
        for row in matrix:
            for rep in range(1, experiment.num_replications + 1):
                seed = self._compute_seed(experiment.random_seed_base,
                                         row.run_number, rep, experiment.seed_strategy)
                run = await self.create_run(experiment_id=experiment_id,
                                           matrix_id=row.id, replication=rep, random_seed=seed)
                runs.append(run)
        
        # 2. 更新实验状态
        await self.update_experiment(experiment_id, status="running", total_runs=len(runs))
        
        # 3. 构建 Celery chord
        tasks = []
        for run in runs:
            matrix_row = next(r for r in matrix if r.id == run.matrix_id)
            tasks.append(
                run_simulation.s(
                    run_id=str(run.id),
                    experiment_id=str(experiment_id),
                    module_type=experiment.module_type,  # ← 传入 module_type
                    factor_values=matrix_row.factor_values,
                    random_seed=run.random_seed,
                    simulation_config={
                        "duration": experiment.simulation_duration,
                        "warm_up": experiment.warm_up_period,
                        "response_variables": experiment.response_variables,
                    }
                )
            )
        
        callback = on_experiment_complete.si(experiment_id=str(experiment_id))
        job = chord(tasks)(callback)
        
        return {"experiment_id": experiment_id, "total_runs": len(runs)}
```

### 6.4 进度追踪 WebSocket

```python
@router.websocket("/ws/doe/experiments/{experiment_id}/progress")
async def experiment_progress(websocket: WebSocket, experiment_id: str):
    await websocket.accept()
    progress_key = f"doe:progress:{experiment_id}"
    last_data = None
    
    try:
        while True:
            data = await redis.hgetall(progress_key)
            if data != last_data:
                total = int(data.get("total", 0))
                completed = int(data.get("completed", 0))
                await websocket.send_json({
                    "total": total,
                    "completed": completed,
                    "failed": int(data.get("failed", 0)),
                    "running": int(data.get("running", 0)),
                    "progress_pct": round(completed / max(total, 1) * 100, 1),
                })
                last_data = data
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
```

### 6.5 失败恢复

```python
async def resume_experiment(self, experiment_id: str) -> dict:
    failed_runs = await self.get_runs_by_status(experiment_id, ["failed", "pending", "cancelled"])
    if not failed_runs:
        return {"message": "没有需要恢复的运行"}
    for run in failed_runs:
        await self.update_run(run.id, status="pending", error_message=None, retry_count=0)
    # 重新提交到 Celery ...
    return {"resumed_runs": len(failed_runs)}
```

### 6.6 验收标准

- [x] 提交 100 次运行，所有任务正确分发到 Celery Worker
- [x] 不同 `module_type` 的实验正确调用对应模块的仿真函数
- [ ] WebSocket 进度推送延迟 < 2 秒（WebSocket 实时推送整体待实现）
- [x] Worker 崩溃后任务重新排队
- [x] 失败任务自动重试 3 次
- [x] 10 个 Worker 并行，吞吐量接近线性扩展

---

## 7. 统计分析引擎 (Statistical Analysis)

### 7.1 ANOVA 方差分析

#### 单因子 ANOVA

```python
from scipy import stats
import pandas as pd

def one_way_anova(data: pd.DataFrame, factor: str, response: str) -> dict:
    groups = [group[response].values for name, group in data.groupby(factor)]
    f_stat, p_value = stats.f_oneway(*groups)
    
    grand_mean = data[response].mean()
    ss_between = sum(len(g) * (g.mean() - grand_mean)**2 for g in groups)
    ss_within = sum(((g - g.mean())**2).sum() for g in groups)
    ss_total = ss_between + ss_within
    eta_sq = ss_between / ss_total
    
    # Tukey HSD 事后检验
    from statsmodels.stats.multicomp import pairwise_tukeyhsd
    tukey = pairwise_tukeyhsd(data[response], data[factor])
    
    return {
        "factor": factor, "response": response,
        "f_statistic": round(f_stat, 4),
        "p_value": round(p_value, 6),
        "is_significant": p_value < 0.05,
        "eta_squared": round(eta_sq, 4),
        # ...
    }
```

#### 多因子 ANOVA

```python
import statsmodels.api as sm
from statsmodels.formula.api import ols

def n_way_anova(data: pd.DataFrame, factors: list[str],
                response: str, max_interaction: int = 2) -> dict:
    from itertools import combinations
    terms = list(factors)
    for order in range(2, max_interaction + 1):
        for combo in combinations(factors, order):
            terms.append(":".join(combo))
    
    formula = f"{response} ~ " + " + ".join(
        [f"C({t})" if data[t].dtype == 'object' else t for t in terms])
    
    model = ols(formula, data=data).fit()
    anova_table = sm.stats.anova_lm(model, typ=2)
    return format_anova_results(anova_table, model)
```

### 7.2 主效应与交互效应

```python
def compute_main_effects(data: pd.DataFrame, factors: list[str], response: str) -> dict:
    grand_mean = data[response].mean()
    results = {}
    for factor in factors:
        grouped = data.groupby(factor)[response]
        means = grouped.mean()
        stds = grouped.std()
        counts = grouped.count()
        ci_margin = 1.96 * stds / np.sqrt(counts)
        results[factor] = {
            "levels": means.index.tolist(),
            "means": means.values.tolist(),
            "ci_lower": (means - ci_margin).values.tolist(),
            "ci_upper": (means + ci_margin).values.tolist(),
            "effect_range": float(means.max() - means.min()),
            "grand_mean": float(grand_mean),
        }
    return results

def compute_interactions(data: pd.DataFrame, factor_a: str,
                        factor_b: str, response: str) -> dict:
    pivot = data.pivot_table(values=response, index=factor_a,
                            columns=factor_b, aggfunc='mean')
    return format_interaction(pivot, factor_a, factor_b)
```

### 7.3 响应面方法 (RSM)

```python
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression

def fit_response_surface(data: pd.DataFrame, factors: list[str],
                         response: str, degree: int = 2) -> dict:
    X = data[factors].values
    y = data[response].values
    
    X_coded = code_factors(X, factors)
    poly = PolynomialFeatures(degree=degree, include_bias=False)
    X_poly = poly.fit_transform(X_coded)
    
    model = LinearRegression()
    model.fit(X_poly, y)
    y_pred = model.predict(X_poly)
    r2 = 1 - np.sum((y - y_pred)**2) / np.sum((y - y.mean())**2)
    
    stationary = compute_stationary_point(model, poly, factors)
    contour = generate_contour_data(model, poly, factors, resolution=50)
    surface = generate_surface_data(model, poly, factors, resolution=30)
    
    return {
        "model_type": "quadratic_polynomial",
        "coefficients": dict(zip(poly.get_feature_names_out(), model.coef_)),
        "r_squared": r2,
        "stationary_point": stationary,
        "contour_data": contour,
        "surface_data": surface,
    }
```

### 7.4 元模型 (Metamodel) — P2

```python
from xgboost import XGBRegressor
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import Matern, WhiteKernel
from sklearn.model_selection import cross_val_score
import pickle

class MetamodelTrainer:
    
    def train(self, data: pd.DataFrame, factors: list[str],
              response: str, model_type: str = "xgboost") -> dict:
        X = data[factors].values
        y = data[response].values
        
        if model_type == "xgboost":
            model = XGBRegressor(n_estimators=100, max_depth=6, learning_rate=0.1)
        elif model_type == "gaussian_process":
            kernel = Matern(nu=2.5) + WhiteKernel()
            model = GaussianProcessRegressor(kernel=kernel, n_restarts_optimizer=10)
        
        cv_scores = cross_val_score(model, X, y, cv=5, scoring='r2')
        model.fit(X, y)
        y_pred = model.predict(X)
        model_blob = pickle.dumps(model)
        
        return {
            "model_type": model_type,
            "metrics": {
                "r2": float(1 - np.sum((y - y_pred)**2) / np.sum((y - y.mean())**2)),
                "rmse": float(np.sqrt(np.mean((y - y_pred)**2))),
                "cv_r2_mean": float(cv_scores.mean()),
            },
            "model_blob": model_blob,
        }
    
    def predict(self, model_blob: bytes, factor_values: dict, factors: list[str]) -> dict:
        model = pickle.loads(model_blob)
        X = np.array([[factor_values[f] for f in factors]])
        prediction = model.predict(X)[0]
        return {"prediction": float(prediction)}
```

### 7.5 验收标准

- [x] ANOVA 结果与 scipy.stats.f_oneway 一致
- [ ] 多因子 ANOVA 与 Minitab/JMP 的 Type II SS 一致（差异 < 0.1%，高端统计对齐待实现）
- [x] 主效应图数据点包含 95% 置信区间
- [x] RSM 二阶模型 R² > 0.85 时标记为"拟合良好"
- [x] 元模型预测延迟 < 10ms
- [x] 所有分析结果缓存到 doe_analysis_results 表

---

## 8. 结果可视化 (Visualization)

所有图表通过后端 API 返回 ECharts option JSON，前端直接渲染。

### 8.1 图表类型

| 图表 | 用途 | ECharts 类型 |
|------|------|-------------|
| 主效应图 | 各因子对响应变量的单独影响 | `line` (多 grid) |
| 交互效应图 | 两因子组合效应 | `line` (多系列) |
| 贡献百分比图 | ANOVA 各因子贡献占比 | `bar` (水平) |
| 等高线图 | RSM 响应面等高线 | `heatmap` |
| 3D 曲面图 | RSM 响应面 3D | `surface` (GL) |
| 龙卷风图 | 单因子灵敏度排序 | `bar` (水平) |
| Morris 散点图 | μ*-σ 灵敏度分类 | `scatter` |
| Sobol 柱状图 | S1/ST 指数对比 | `bar` |
| 残差诊断图 | 模型拟合质量检查 | `scatter` + `line` |

### 8.2 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/ai/doe/experiments/{eid}/charts/main-effects` | 主效应图 |
| `GET` | `/ai/doe/experiments/{eid}/charts/interactions?a={f1}&b={f2}` | 交互效应图 |
| `GET` | `/ai/doe/experiments/{eid}/charts/contour?x={f1}&y={f2}` | 等高线图 |
| `GET` | `/ai/doe/experiments/{eid}/charts/surface3d?x={f1}&y={f2}` | 3D 曲面图 |
| `GET` | `/ai/doe/experiments/{eid}/charts/contribution` | 贡献百分比图 |
| `GET` | `/ai/doe/experiments/{eid}/charts/tornado` | 龙卷风图 |
| `GET` | `/ai/doe/experiments/{eid}/charts/residuals` | 残差诊断图 |

统一返回格式：

```json
{
    "chart_type": "string",
    "echarts_option": { /* 完整的 ECharts option */ },
    "raw_data": { /* 原始数据 */ }
}
```

### 8.3 验收标准

- [x] 所有图表响应式布局，移动端可查看
- [x] 图表加载时间 < 1 秒（100 组数据以内）
- [x] 支持图表导出为 PNG/SVG
- [x] 3D 曲面图支持鼠标旋转、缩放

---

## 9. 实验模板 (Experiment Templates)

### 9.1 各模块预置模板

每个模块预置 1-2 个模板，模板中含 `module_type` 字段：

#### TrafficOps 模板

```json
{
    "module_type": "traffic_ops",
    "name": "网点客流吞吐量优化",
    "category": "客流优化",
    "template_config": {
        "design_method": "fractional_factorial",
        "design_config": {"method": "taguchi", "taguchi_table": "auto"},
        "num_replications": 5,
        "factors": [
            {"name": "arrival_rate", "label": "到达率", "factor_type": "continuous",
             "min_value": null, "max_value": null, "num_levels": 3, "unit": "人/小时"},
            {"name": "counter_count", "label": "柜台数量", "factor_type": "discrete"},
            {"name": "routing_rule", "label": "路由规则", "factor_type": "categorical",
             "category_values": ["FIFO", "优先级", "智能分流"]}
        ],
        "response_variables": [
            {"name": "throughput", "label": "吞吐量", "direction": "maximize"},
            {"name": "avg_wait_time", "label": "平均等待时间", "direction": "minimize"}
        ],
        "recommended_analysis": ["anova", "main_effects", "interactions"]
    }
}
```

#### HeatOps 模板

```json
{
    "module_type": "heat_ops",
    "name": "供热效率响应面优化",
    "category": "供热优化",
    "template_config": {
        "design_method": "ccd",
        "design_config": {"alpha": "face", "center_points": [4, 4]},
        "num_replications": 3,
        "factors": [
            {"name": "supply_temperature", "label": "供水温度", "factor_type": "continuous",
             "min_value": 55, "max_value": 85, "num_levels": 5, "unit": "°C"},
            {"name": "pump_speed", "label": "循环泵转速", "factor_type": "continuous",
             "min_value": 800, "max_value": 2000, "unit": "RPM"},
            {"name": "valve_opening", "label": "阀门开度", "factor_type": "continuous",
             "min_value": 20, "max_value": 100, "unit": "%"}
        ],
        "response_variables": [
            {"name": "efficiency", "label": "换热效率", "direction": "maximize"},
            {"name": "return_temperature", "label": "回水温度", "direction": "minimize"}
        ],
        "recommended_analysis": ["rsm", "contour", "main_effects"]
    }
}
```

#### FMS 模板

```json
{
    "module_type": "fms",
    "name": "维护策略优化",
    "category": "设施维护",
    "template_config": {
        "design_method": "lhs",
        "design_config": {"criterion": "maximin", "num_samples": 50},
        "num_replications": 5,
        "factors": [
            {"name": "pm_interval", "label": "PM间隔", "factor_type": "continuous",
             "min_value": 7, "max_value": 90, "unit": "天"},
            {"name": "inspection_frequency", "label": "巡检频率", "factor_type": "discrete",
             "discrete_values": [1, 2, 3, 5, 7], "unit": "次/周"},
            {"name": "spare_stock_level", "label": "备件库存", "factor_type": "discrete",
             "discrete_values": [5, 10, 20, 50], "unit": "件"}
        ],
        "response_variables": [
            {"name": "mtbf", "label": "平均故障间隔", "direction": "maximize"},
            {"name": "maintenance_cost", "label": "维护成本", "direction": "minimize"}
        ],
        "recommended_analysis": ["sensitivity_morris", "anova", "main_effects"]
    }
}
```

#### Energy 模板

```json
{
    "module_type": "energy",
    "name": "能耗-舒适度平衡优化",
    "category": "能源管理",
    "template_config": {
        "design_method": "full_factorial",
        "num_replications": 5,
        "factors": [
            {"name": "hvac_setpoint", "label": "HVAC设定温度", "factor_type": "continuous",
             "min_value": 20, "max_value": 28, "num_levels": 3, "unit": "°C"},
            {"name": "lighting_schedule", "label": "照明策略", "factor_type": "categorical",
             "category_values": ["全天常亮", "定时开关", "人感联动", "自然光优先"]},
            {"name": "occupancy_threshold", "label": "人员感应阈值", "factor_type": "discrete",
             "discrete_values": [1, 3, 5, 10], "unit": "人"}
        ],
        "response_variables": [
            {"name": "kwh", "label": "日能耗", "direction": "minimize"},
            {"name": "comfort_score", "label": "舒适度评分", "direction": "maximize"}
        ],
        "recommended_analysis": ["anova", "main_effects", "sensitivity_sobol"]
    }
}
```

### 9.2 模板 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/ai/doe/templates?module_type=traffic_ops` | 按模块筛选模板 |
| `GET` | `/ai/doe/templates/{tid}` | 模板详情 |
| `POST` | `/ai/doe/templates` | 创建自定义模板 |
| `POST` | `/ai/doe/experiments/from-template/{tid}` | 从模板创建实验 |
| `POST` | `/ai/doe/templates/from-experiment/{eid}` | 从实验保存为模板 |

### 9.3 验收标准

- [x] 4 个模块各有至少 1 个预置模板
- [x] 从模板创建实验后，因子定义自动填充
- [x] 模板中 `null` 值的字段在 UI 上标注为"需用户填写"
- [x] 模板支持按 `module_type` 筛选

---

## 10. 灵敏度分析 (Sensitivity Analysis)

### 10.1 Morris 方法 (Elementary Effects)

**适用场景**：因子筛选（> 10 个因子），快速识别重要因子

```python
from SALib.sample import morris as morris_sample
from SALib.analyze import morris as morris_analyze

class MorrisSensitivity:
    
    def analyze(self, experiment_id: str, response: str,
                num_trajectories: int = 20, num_levels: int = 4) -> dict:
        """
        Morris 方法灵敏度分析
        
        原理：
        - μ* (绝对均值) = 因子重要性
        - σ (标准差) = 非线性/交互效应强度
        
        总仿真次数: (k+1) * r
        """
        factors = self.get_factors(experiment_id)
        
        problem = {
            'num_vars': len(factors),
            'names': [f['name'] for f in factors],
            'bounds': [[f['min_value'], f['max_value']] for f in factors],
        }
        
        param_values = morris_sample.sample(problem, N=num_trajectories,
                                            num_levels=num_levels)
        Y = self.run_simulations(param_values, experiment_id, response)
        Si = morris_analyze.analyze(problem, param_values, Y, conf_level=0.95)
        
        return self.format_morris_results(Si, factors)
```

### 10.2 Sobol 指数 (Variance-Based)

**适用场景**：精确量化因子贡献

```python
from SALib.sample import saltelli
from SALib.analyze import sobol as sobol_analyze

class SobolSensitivity:
    
    def analyze(self, experiment_id: str, response: str,
                num_samples: int = 1024) -> dict:
        """
        Sobol 灵敏度分析
        
        - S1 (一阶指数) = 单个因子直接贡献
        - ST (全阶指数) = 因子的直接 + 所有交互贡献
        - S2 (二阶指数) = 两两交互贡献
        
        总仿真次数: N * (2k + 2)
        """
        factors = self.get_factors(experiment_id)
        
        problem = {
            'num_vars': len(factors),
            'names': [f['name'] for f in factors],
            'bounds': [[f['min_value'], f['max_value']] for f in factors],
        }
        
        param_values = saltelli.sample(problem, num_samples, calc_second_order=True)
        Y = self.run_simulations(param_values, experiment_id, response)
        Si = sobol_analyze.analyze(problem, Y, calc_second_order=True, conf_level=0.95)
        
        return self.format_sobol_results(Si, factors)
```

### 10.3 龙卷风图 (Tornado Diagram)

```python
def generate_tornado_data(main_effects: dict, response: str) -> dict:
    """基于主效应范围生成龙卷风图数据，按影响大小降序排列"""
    bars = []
    for factor_name, effect in main_effects.items():
        bars.append({
            "factor": effect.get("label", factor_name),
            "low_value": effect["means"][0],
            "high_value": effect["means"][-1],
            "swing": abs(effect["means"][-1] - effect["means"][0]),
        })
    bars.sort(key=lambda x: x["swing"], reverse=True)
    return format_tornado_echarts(bars, response)
```

### 10.4 验收标准

- [x] Morris 方法结果与 SALib 直接调用一致
- [x] Sobol 指数 S1 之和 ≈ 1（误差 < 0.1），ST ≥ S1
- [x] 龙卷风图因子按影响大小降序排列
- [x] 当因子数 > 10 时，系统自动推荐 Morris 方法

---

## 11. 非功能需求

### 11.1 性能要求

| 指标 | 要求 |
|------|------|
| 实验矩阵生成 | < 2 秒（≤ 1000 组） |
| 单次仿真运行 | 取决于模型复杂度，框架开销 < 1 秒 |
| ANOVA 分析 | < 5 秒（≤ 500 组数据） |
| RSM 拟合 | < 10 秒 |
| 元模型训练 | < 60 秒（≤ 1000 组数据） |
| 元模型预测 | < 10 毫秒 |
| 图表渲染 | < 1 秒（前端） |
| WebSocket 推送延迟 | < 2 秒 |
| API 响应时间 (P95) | < 500 毫秒（不含仿真） |

### 11.2 扩展性

- Celery Worker 支持水平扩展，10 Worker 时吞吐量 > 8x 单 Worker
- 单实验支持最多 10,000 次运行
- 单项目支持最多 100 个实验
- 设计矩阵支持最多 20 个因子
- 新业务模块接入无需修改 DOE 框架代码

### 11.3 可靠性

- Worker 崩溃后任务自动重新排队
- 失败任务支持自动重试（默认 3 次，指数退避）
- 实验支持暂停和恢复
- 所有分析结果持久化
- 数据库事务保证一致性

### 11.4 安全性

- 因子约束表达式使用 `ast.literal_eval` 安全解析
- 实验数据按项目隔离，RBAC 权限控制
- 元模型 pickle 反序列化限制为受信来源
- API 速率限制：实验提交 10 次/分钟，分析请求 30 次/分钟

### 11.5 可观测性

- Celery 任务状态通过 Flower 监控
- Prometheus 指标：
  - `doe_experiment_total{module_type}` — 各模块实验总数
  - `doe_run_duration_seconds{module_type}` — 各模块运行耗时
  - `doe_run_status{module_type}` — 各状态运行数
  - `doe_worker_utilization` — Worker 利用率

---

## 附录 A：依赖库版本

```
pyDOE2>=1.3.0
SALib>=1.4.7
scipy>=1.11.0
statsmodels>=0.14.0
scikit-learn>=1.3.0
xgboost>=2.0.0
numpy>=1.24.0
pandas>=2.0.0
celery[redis]>=5.3.0
```

## 附录 B：里程碑计划

| 里程碑 | 范围 | 预估工期 |
|--------|------|---------|
| M1 — MVP | F-001 ~ F-011 (注册机制 + 因子定义 + 全因子/分式 + 批量运行 + ANOVA + 图表) | 4 周 |
| M2 — 增强 | F-012 ~ F-019 (LHS/CCD + RSM + 模板 + 失败恢复 + 灵敏度) | 3 周 |
| M3 — 高级 | F-020 ~ F-025 (元模型 + 自适应 + 多目标 + 协作) | 4 周 |

---

*文档结束*
