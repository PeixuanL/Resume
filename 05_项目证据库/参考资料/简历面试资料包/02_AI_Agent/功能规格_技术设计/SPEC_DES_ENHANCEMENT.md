# DES (Discrete Event Simulation) 增强模块 — PRD & 技术规格书

> **文档版本**: v3.0  
> **创建日期**: 2026-02-11  
> **修订日期**: 2026-02-11  
> **作者**: AI Engineering Team  
> **状态**: Draft  
> **架构原则**: 基盘（Base Platform）能力跨所有模块复用（HeatOps, TrafficOps, VisionOps, FMS, Energy），模块专属逻辑封装在各模块包中  
> **核心依赖**: [SimPy](https://simpy.readthedocs.io/) (≥4.0), NumPy, SciPy

---

## 目录

- [第一部分：基盘 — DES 仿真引擎 (Base Platform)](#第一部分基盘--des-仿真引擎-base-platform)
  - [1. 产品背景与目标](#1-产品背景与目标)
  - [2. 架构概览](#2-架构概览)
  - [3. 抽象接口定义](#3-抽象接口定义)
  - [4. 通用 API 设计](#4-通用-api-设计)
  - [B1. SimPy Environment Wrapper](#b1-simpy-environment-wrapper)
  - [B2. CRN 随机数框架](#b2-crn-随机数框架)
  - [B3. Replication Runner 与置信区间](#b3-replication-runner-与置信区间)
  - [B4. 预热期检测 (Warm-up)](#b4-预热期检测-warm-up)
  - [B5. Blocking/Starvation 通用框架](#b5-blockingstarvation-通用框架)
  - [B6. 故障注入框架 (Failure Injection)](#b6-故障注入框架-failure-injection)
  - [B7. 班次建模框架 (Shift Modeling)](#b7-班次建模框架-shift-modeling)
  - [B8. 仿真回放事件日志 (Playback)](#b8-仿真回放事件日志-playback)
  - [B9. 历史数据热启动框架 (Warm-start)](#b9-历史数据热启动框架-warm-start)
  - [B10. 通用数据库 Schema](#b10-通用数据库-schema)
- [第二部分：TrafficOps 模块 — 检查站仿真](#第二部分trafficops-模块--检查站仿真)
  - [T1. 模块概述](#t1-模块概述)
  - [T2. Passenger 实体](#t2-passenger-实体)
  - [T3. Checkpoint 流程](#t3-checkpoint-流程)
  - [T4. Scene 配置](#t4-scene-配置)
  - [T5. Phase 定义与到达率](#t5-phase-定义与到达率)
  - [T6. TrafficOps 专属 KPI](#t6-trafficops-专属-kpi)
  - [T7. TrafficOps API 示例](#t7-trafficops-api-示例)
  - [T8. TrafficOps 数据库 Schema](#t8-trafficops-数据库-schema)
  - [T9. 验收标准](#t9-验收标准)
- [第三部分：其他模块示例](#第三部分其他模块示例)
  - [HeatOps — 供热网络仿真](#heatops--供热网络仿真)
  - [FMS — 设备维保仿真](#fms--设备维保仿真)
- [附录](#附录)

---

# 第一部分：基盘 — DES 仿真引擎 (Base Platform)

> **代码位置**: `ai-engine/core/des/`  
> **职责**: 提供通用离散事件仿真能力，与业务场景无关。所有模块（TrafficOps、HeatOps、VisionOps、FMS、Energy）均复用此引擎。

---

## 1. 产品背景与目标

### 1.1 背景

Factverse 平台需要一个**通用 DES 仿真引擎**，为各业务模块提供统一的仿真基础设施。不同模块有不同的业务实体和流程，但共享以下核心需求：

1. **可重复性与公平对比**：CRN（Common Random Numbers）机制
2. **统计可信度**：多次重复运行 + 置信区间
3. **稳态分析**：预热期自动检测与剔除
4. **资源约束建模**：有限缓冲区、阻塞与饥饿
5. **设备可靠性**：通用故障注入与维修建模
6. **容量调度**：班次/排班建模
7. **结果可视化**：仿真回放日志
8. **数据驱动**：历史/实时数据热启动

### 1.2 目标

| 目标维度 | 描述 |
|---------|------|
| **通用性** | 引擎与业务无关，通过抽象接口适配任意业务模块 |
| **分析可信度** | 所有 KPI 输出附带 95% 置信区间，支持多次重复运行 |
| **方案对比公平性** | CRN 机制确保不同方案在相同随机事件序列下运行 |
| **建模真实性** | 覆盖阻塞/饥饿、设备故障、排班切换等通用约束 |
| **数据驱动** | 历史数据热启动，从真实状态出发预测未来 |

### 1.3 成功指标

- 仿真结果 95% CI 半宽 ≤ 均值 5%（在 ≥10 次重复下）
- CRN 方差缩减率 ≥ 50%（相比独立随机数）
- 回放数据单次仿真存储 ≤ 50MB
- 至少 2 个业务模块成功接入引擎

### 1.4 功能需求清单

| 编号 | 功能 | 优先级 | 说明 |
|------|------|--------|------|
| B1 | SimPy Environment Wrapper | **P0** | 标准接口封装 SimPy 环境 |
| B2 | CRN 随机数框架 | **P0** | 独立 RNG stream，可重复、可对比 |
| B3 | Replication Runner + CI | **P0** | 并行重复运行，自动聚合置信区间 |
| B4 | 预热期检测 | **P0** | MSER-5 / Welch 方法 |
| B5 | Blocking/Starvation 框架 | **P1** | SimPy Resource/Store 通用有限缓冲 |
| B6 | 故障注入框架 | **P1** | MTBF/MTTR 建模，通用设备故障 |
| B7 | 班次建模框架 | **P1** | 通用容量调度 |
| B8 | 仿真回放日志 | **P2** | 事件记录 + 快照 |
| B9 | 历史数据热启动 | **P2** | 从外部状态初始化仿真 |

### 实施路线

```
Phase 1 (P0): B1 → B2 → B3 → B4    预计 3 周
Phase 2 (P1): B5 + B6 + B7          预计 4 周
Phase 3 (P2): B8 + B9               预计 3 周
```

---

## 2. 架构概览

### 2.1 为什么选择 SimPy

| 对比维度 | 自定义引擎 | SimPy |
|---------|-----------|-------|
| 事件调度 | 手写 heapq 事件队列 | `simpy.Environment` 内置优先级事件调度 |
| 资源竞争 | 手写锁/队列管理 | `simpy.Resource`, `simpy.PreemptiveResource` |
| 有限缓冲 | 手写容量检查 + 阻塞逻辑 | `simpy.Store(capacity=N)`, `simpy.Container` |
| 进程中断 | 手写状态机 | `process.interrupt()` + try/except |
| 社区验证 | 无 | 10+ 年工业/学术验证 |

### 2.2 目录结构

```
ai-engine/
├── core/
│   └── des/                          # 基盘 — 通用 DES 引擎
│       ├── __init__.py
│       ├── interfaces.py             # BaseEntity, BaseProcess, BaseScene, SceneConfig
│       ├── engine.py                 # SimPy Environment Wrapper, SimulationEngine
│       ├── crn.py                    # CRN 随机数流管理
│       ├── replication.py            # ReplicationRunner + 置信区间
│       ├── warmup.py                 # 预热期检测 (MSER-5, Welch)
│       ├── blocking.py               # 通用 Blocking/Starvation Resource
│       ├── failure.py                # 通用故障注入框架
│       ├── shift.py                  # 通用班次/容量调度
│       ├── playback.py               # 事件日志 + 快照
│       ├── warmstart.py              # 热启动框架
│       ├── statistics.py             # 置信区间计算
│       ├── router.py                 # scene_type → 模块路由
│       └── schemas.py                # 通用数据库 Schema
│
├── modules/
│   ├── trafficops/                   # TrafficOps 模块 — 检查站仿真
│   │   ├── __init__.py
│   │   ├── entities.py               # Passenger(BaseEntity)
│   │   ├── processes.py              # CheckpointProcess(BaseProcess)
│   │   ├── scenes.py                 # rts-main-hall, cp-immigration, cp-security
│   │   ├── kpis.py                   # TrafficOps 专属 KPI
│   │   └── config.py                 # Phase 定义, 到达率乘数
│   │
│   ├── heatops/                      # HeatOps 模块 — 供热仿真（示例）
│   │   ├── entities.py               # Boiler, HeatExchanger, Pipe
│   │   ├── processes.py              # HeatFlowProcess
│   │   └── scenes.py                 # heating-network, boiler-room
│   │
│   └── fms/                          # FMS 模块 — 维保仿真（示例）
│       ├── entities.py               # Equipment, SparePart
│       ├── processes.py              # MaintenanceProcess
│       └── scenes.py                 # predictive-maintenance, spare-inventory
```

### 2.3 核心概念映射

```
通用概念              →  SimPy 概念              →  基盘接口
──────────────────────────────────────────────────────────────
仿真时钟              →  simpy.Environment        →  SimulationEngine
实体（工件/旅客/热量） →  SimPy Process            →  BaseEntity
处理过程（工序/检查站）→  generator function        →  BaseProcess
服务资源              →  simpy.Resource            →  ResourcePool
有限缓冲区            →  simpy.Store(capacity=N)   →  BufferedQueue
设备故障              →  process.interrupt()       →  FailureInjector
班次切换              →  动态调整 Resource.capacity →  ShiftController
场景配置              →  config dict               →  SceneConfig
```

---

## 3. 抽象接口定义

> **代码位置**: `ai-engine/core/des/interfaces.py`

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, Any
import simpy
import numpy as np


@dataclass
class BaseEntity:
    """
    仿真实体基类。所有模块的实体（旅客、工件、热流单元、备件等）继承此类。
    """
    id: int
    creation_time: float
    entity_type: str = "generic"              # 子类覆盖
    timestamps: dict = field(default_factory=dict)  # process_id → {arrive, start, end}
    departure_time: Optional[float] = None
    metadata: dict = field(default_factory=dict)    # 模块专属字段


@dataclass
class SceneConfig:
    """
    场景配置基类。定义仿真场景的通用参数。
    """
    scene_type: str                           # 路由键: "trafficops", "heatops", "fms" 等
    scene_id: str                             # 场景实例: "rts-main-hall", "boiler-room-1"
    simulation_time: float
    seed: Optional[int] = None
    replications: int = 1
    parallel_workers: int = 4
    confidence_level: float = 0.95
    warmup: dict = field(default_factory=dict)
    playback: dict = field(default_factory=dict)
    warm_start: dict = field(default_factory=dict)


class BaseProcess(ABC):
    """
    仿真处理流程基类。各模块实现具体流程逻辑。
    """
    
    @abstractmethod
    def setup(self, env: simpy.Environment, engine: 'SimulationEngine') -> None:
        """初始化 SimPy 资源（Resource, Store 等）"""
        ...
    
    @abstractmethod
    def run(self, env: simpy.Environment, entity: BaseEntity) -> Any:
        """SimPy generator: 实体经过此处理流程"""
        ...
    
    @abstractmethod
    def collect_kpis(self) -> dict:
        """收集此流程的 KPI"""
        ...


class BaseScene(ABC):
    """
    仿真场景基类。各模块定义具体场景（工位链、检查站链、管网拓扑等）。
    """
    
    @abstractmethod
    def get_config(self) -> SceneConfig:
        """返回场景配置"""
        ...
    
    @abstractmethod
    def build_processes(self, env: simpy.Environment,
                        engine: 'SimulationEngine') -> list[BaseProcess]:
        """构建并返回处理流程链/图"""
        ...
    
    @abstractmethod
    def create_arrival_generator(self, env: simpy.Environment,
                                  engine: 'SimulationEngine') -> Any:
        """创建实体到达 SimPy generator"""
        ...
    
    @abstractmethod
    def collect_results(self) -> dict:
        """聚合所有流程 KPI，返回场景级结果"""
        ...
```

---

## 4. 通用 API 设计

### 4.1 统一入口

`POST /ai/simulation/run`

所有模块共用同一 API 入口，通过 `scene_type` 路由到对应模块：

```json
{
  "scene_type": "trafficops",
  "scene_id": "rts-main-hall",
  "simulation_time": 480.0,
  "seed": 42,
  "replications": 30,
  "parallel_workers": 4,
  "confidence_level": 0.95,
  "warmup": { "method": "mser5" },
  "playback": { "enabled": false },
  "warm_start": { "enabled": false },
  "module_config": {
    // 模块专属配置，由各模块自行解析
  }
}
```

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `scene_type` | `string` | **是** | - | 模块路由键: `"trafficops"`, `"heatops"`, `"fms"` 等 |
| `scene_id` | `string` | **是** | - | 场景实例标识 |
| `simulation_time` | `float` | **是** | - | 仿真时长 |
| `seed` | `integer \| null` | 否 | `null` | 随机种子 |
| `replications` | `integer` | 否 | `1` | 重复运行次数 `[1, 1000]` |
| `parallel_workers` | `integer` | 否 | `4` | 并行 worker 数 `[1, 16]` |
| `confidence_level` | `float` | 否 | `0.95` | 置信水平 `(0.5, 0.999)` |
| `warmup` | `object` | 否 | `{}` | 预热期配置（见 B4） |
| `playback` | `object` | 否 | `{}` | 回放配置（见 B8） |
| `warm_start` | `object` | 否 | `{}` | 热启动配置（见 B9） |
| `module_config` | `object` | 否 | `{}` | 模块专属配置，基盘不解析 |

### 4.2 路由器

> **代码位置**: `ai-engine/core/des/router.py`

```python
from typing import Dict, Type
from .interfaces import BaseScene

# 模块注册表
_SCENE_REGISTRY: Dict[str, Type[BaseScene]] = {}


def register_scene_type(scene_type: str, scene_class: Type[BaseScene]):
    """模块启动时注册 scene_type → Scene 类映射"""
    _SCENE_REGISTRY[scene_type] = scene_class


def resolve_scene(scene_type: str, config: dict) -> BaseScene:
    """根据 scene_type 路由到对应模块的 Scene 实现"""
    if scene_type not in _SCENE_REGISTRY:
        raise ValueError(f"Unknown scene_type: {scene_type}. "
                         f"Registered: {list(_SCENE_REGISTRY.keys())}")
    scene_class = _SCENE_REGISTRY[scene_type]
    return scene_class(config)
```

模块注册示例（各模块 `__init__.py`）：

```python
# ai-engine/modules/trafficops/__init__.py
from ai_engine.core.des.router import register_scene_type
from .scenes import CheckpointScene

register_scene_type("trafficops", CheckpointScene)
```

### 4.3 通用响应结构

```json
{
  "metadata": {
    "scene_type": "trafficops",
    "scene_id": "rts-main-hall",
    "seed_used": 42,
    "replications": 30,
    "wall_time_seconds": 12.5,
    "warmup_detected_time": 45.0,
    "warmup_method": "mser5",
    "engine_version": "3.0.0"
  },
  "summary": {
    // 通用 KPI（基盘计算）
    "throughput": { "mean": 145.2, "std": 8.3, "ci_lower": 142.1, "ci_upper": 148.3, "ci_level": 0.95, "n": 30 },
    "avg_cycle_time": { ... },
    // 模块专属 KPI（模块计算）
    "module_kpis": { ... }
  },
  "per_replication": [ ... ]
}
```

---

## B1. SimPy Environment Wrapper

> **代码位置**: `ai-engine/core/des/engine.py`

### 概述

对 `simpy.Environment` 的标准封装，提供统一的仿真生命周期管理。

```python
import simpy
import numpy as np
from typing import Optional
from .interfaces import BaseEntity, BaseScene, BaseProcess, SceneConfig
from .crn import create_rng_streams
from .playback import PlaybackRecorder


class SimulationEngine:
    """
    基盘 DES 引擎。封装 simpy.Environment，管理仿真生命周期。
    业务无关——具体实体、流程、KPI 由模块通过 BaseScene 接口提供。
    """
    
    def __init__(self, scene: BaseScene, config: dict):
        self.scene = scene
        self.config = config
        self.scene_config: SceneConfig = scene.get_config()
        
        # 状态
        self.env: Optional[simpy.Environment] = None
        self.rng_streams: list[np.random.Generator] = []
        self.recorder: Optional[PlaybackRecorder] = None
        
        # 通用计数器
        self.entities_completed: list[BaseEntity] = []
        self.total_arrivals: int = 0
        self.total_departures: int = 0
        self.next_entity_id: int = 1
    
    def run_single(self, seed: int) -> dict:
        """运行单次仿真——创建独立的 simpy.Environment"""
        # 1. 创建 SimPy Environment
        warm_start = self.config.get("warm_start", {})
        initial_time = 0.0
        if warm_start.get("enabled"):
            initial_time = warm_start.get("initial_state", {}).get("sim_time_offset", 0.0)
        
        self.env = simpy.Environment(initial_time=initial_time)
        
        # 2. 创建 RNG streams (CRN)
        num_streams = self._estimate_stream_count()
        self.rng_streams = create_rng_streams(seed, num_streams)
        
        # 3. 回放记录器
        playback_config = self.config.get("playback", {})
        if playback_config.get("enabled"):
            self.recorder = PlaybackRecorder(playback_config)
            self.env.process(self.recorder.snapshot_process(self.env, self))
        
        # 4. 让模块构建流程
        processes = self.scene.build_processes(self.env, self)
        
        # 5. 让模块创建到达生成器
        self.env.process(self.scene.create_arrival_generator(self.env, self))
        
        # 6. 运行仿真
        sim_end = initial_time + self.scene_config.simulation_time
        self.env.run(until=sim_end)
        
        # 7. 收集结果（模块实现）
        return self.scene.collect_results()
    
    def get_rng(self, stream_index: int) -> np.random.Generator:
        """获取指定索引的 RNG stream（模块调用）"""
        return self.rng_streams[stream_index]
    
    def register_entity_departure(self, entity: BaseEntity):
        """通用实体离开系统记录"""
        entity.departure_time = self.env.now
        self.entities_completed.append(entity)
        self.total_departures += 1
    
    def create_entity(self, entity_type: str = "generic", **kwargs) -> BaseEntity:
        """创建实体并分配 ID"""
        entity = BaseEntity(
            id=self.next_entity_id,
            creation_time=self.env.now,
            entity_type=entity_type,
            **kwargs
        )
        self.next_entity_id += 1
        self.total_arrivals += 1
        return entity
    
    def _estimate_stream_count(self) -> int:
        """估算需要的 RNG stream 数量（模块可覆盖）"""
        return 20  # 默认预留足够多的 stream
```

---

## B2. CRN 随机数框架

> **代码位置**: `ai-engine/core/des/crn.py`

### 概述

Common Random Numbers (CRN) 是一种方差缩减技术。为每个随机过程分配独立的 RNG stream，与 SimPy 引擎正交——SimPy 不管理随机数，随机采样由 NumPy Generator 完成。

### 实现

```python
import numpy as np


def create_rng_streams(seed: int, num_streams: int) -> list[np.random.Generator]:
    """
    为每个随机过程创建独立的随机数流。
    使用 SeedSequence spawn 保证流之间统计独立且可重复。
    
    模块自行分配 stream 索引，例如:
      TrafficOps: stream 0=到达, 1=immigration服务, 2=security服务, ...
      HeatOps:    stream 0=故障间隔, 1=负荷波动, ...
    """
    ss = np.random.SeedSequence(seed)
    child_seeds = ss.spawn(num_streams)
    return [np.random.default_rng(s) for s in child_seeds]
```

### 与 SimPy 的集成

```
SimPy Environment（事件调度）
    ↕
SimPy Process（yield env.timeout(sampled_value)）
    ↕
NumPy Generator（独立 RNG stream 采样）
```

SimPy 负责事件调度和时间推进，NumPy Generator 负责随机采样。两者职责分离。模块在 SimPy process 中使用 `engine.get_rng(stream_index)` 获取对应流进行采样。

### API 设计

**请求字段**：

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `seed` | `integer \| null` | 否 | `null` | 随机种子。`null` = 系统随机。范围 `[0, 2^63-1]` |

**响应**：

```json
{
  "metadata": {
    "seed_used": 42
  }
}
```

`seed_used` 始终返回实际使用的种子值。

### 关键设计决策

- 使用 `numpy.random.SeedSequence.spawn()` 而非 `seed + offset`，保证统计质量
- 每个随机过程使用独立流，避免同步问题
- SimPy `env.timeout()` 接收从 RNG stream 采样的值，不依赖 SimPy 内部随机状态
- 添加新随机过程时不影响已有流序列

### 验收标准

| 编号 | 标准 |
|------|------|
| AC-B2.1 | 相同 `seed` + 相同 `config` → 完全相同的输出（bit-exact） |
| AC-B2.2 | 不同 `seed` → 统计上不同的输出 |
| AC-B2.3 | `seed=null` 时，响应中 `seed_used` 返回实际使用的种子值 |
| AC-B2.4 | CRN 对比（两个方案同一 seed 各跑 30 次）的 paired-t 检验 p < 0.05 时，独立种子方式 p > 0.05 |

---

## B3. Replication Runner 与置信区间

> **代码位置**: `ai-engine/core/des/replication.py`, `ai-engine/core/des/statistics.py`

### 概述

通过运行 N 次独立重复（replications），计算 KPI 的均值、标准差和置信区间。每个 replication 创建独立的 `simpy.Environment`，互不干扰。

### 实现

```python
from concurrent.futures import ProcessPoolExecutor
import numpy as np
from .crn import create_rng_streams
from .router import resolve_scene


def run_replications(config: dict) -> dict:
    """运行多次独立重复并聚合结果"""
    base_seed = config.get("seed") or int(np.random.SeedSequence().entropy)
    n_reps = config.get("replications", 1)
    n_workers = config.get("parallel_workers", 4)
    
    # 为每个 replication 生成独立种子
    ss = np.random.SeedSequence(base_seed)
    rep_seeds = ss.spawn(n_reps)
    
    # 并行执行（每个 worker 创建独立的 simpy.Environment）
    results = []
    with ProcessPoolExecutor(max_workers=n_workers) as pool:
        futures = []
        for i, child_ss in enumerate(rep_seeds):
            rep_config = {**config, "seed": int(child_ss.entropy), "_replication_idx": i}
            futures.append(pool.submit(_run_single_replication, rep_config))
        for f in futures:
            results.append(f.result())
    
    # 聚合
    summary = aggregate_results(results, config.get("confidence_level", 0.95))
    return {
        "metadata": {"seed_used": base_seed, "replications": n_reps},
        "summary": summary,
        "per_replication": results
    }


def _run_single_replication(config: dict) -> dict:
    """单次 replication——创建独立 SimPy Environment"""
    from .engine import SimulationEngine
    scene = resolve_scene(config["scene_type"], config)
    engine = SimulationEngine(scene, config)
    return engine.run_single(config["seed"])


def aggregate_results(results: list[dict], confidence_level: float = 0.95) -> dict:
    """对每个 KPI 计算 mean, std, CI"""
    if not results:
        return {}
    # 自动发现所有数值型 KPI key
    kpi_keys = [k for k, v in results[0].items() if isinstance(v, (int, float))]
    summary = {}
    for kpi in kpi_keys:
        values = [r[kpi] for r in results if kpi in r]
        summary[kpi] = compute_statistics(values, confidence_level)
    return summary
```

### 置信区间计算

```python
from scipy import stats
import numpy as np


def compute_statistics(values: list[float], confidence_level: float = 0.95) -> dict:
    """
    使用 Student's t-分布计算置信区间。适用于小样本，大样本时自动趋近正态。
    """
    n = len(values)
    arr = np.array(values)
    mean = float(np.mean(arr))
    std = float(np.std(arr, ddof=1))  # Bessel's correction
    
    if n < 2:
        return {
            "mean": mean, "std": 0.0,
            "ci_lower": mean, "ci_upper": mean,
            "ci_level": confidence_level,
            "ci_half_width": 0.0,
            "ci_relative_half_width": 0.0,
            "n": n, "values": values
        }
    
    alpha = 1.0 - confidence_level
    t_crit = stats.t.ppf(1.0 - alpha / 2.0, df=n - 1)
    se = std / np.sqrt(n)
    half_width = t_crit * se
    
    return {
        "mean": mean,
        "std": std,
        "ci_lower": mean - half_width,
        "ci_upper": mean + half_width,
        "ci_level": confidence_level,
        "ci_half_width": half_width,
        "ci_relative_half_width": half_width / abs(mean) if mean != 0 else float('inf'),
        "n": n,
        "values": values
    }
```

### API 设计

**请求字段**：

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `replications` | `integer` | 否 | `1` | 重复运行次数 `[1, 1000]` |
| `parallel_workers` | `integer` | 否 | `4` | 并行 worker 数 `[1, 16]` |
| `confidence_level` | `float` | 否 | `0.95` | 置信水平 `(0.5, 0.999)` |

**响应**（`replications > 1` 时每个 KPI）：

```json
{
  "mean": 145.2,
  "std": 8.3,
  "ci_lower": 142.1,
  "ci_upper": 148.3,
  "ci_level": 0.95,
  "ci_half_width": 3.1,
  "ci_relative_half_width": 0.021,
  "n": 30,
  "values": [143, 148, 140, ...]
}
```

### 验收标准

| 编号 | 标准 |
|------|------|
| AC-B3.1 | `replications=30` 返回 30 个独立结果 + 聚合统计 |
| AC-B3.2 | 每个 replication 使用不同种子，结果统计独立 |
| AC-B3.3 | `parallel_workers=4` 时 30 次重复 wall time < 单次 × 10 |
| AC-B3.4 | `replications=1` 时响应格式与现有接口兼容 |
| AC-B3.5 | n=5 时 CI 使用 t(df=4) 临界值（≈2.776 for 95%） |
| AC-B3.6 | n=100 时 CI 与 z=1.96 正态近似差异 < 1% |
| AC-B3.7 | 对已知分布 N(100, 10²) 采样 30 次，95% CI 在 1000 次实验中覆盖真值比例 ∈ [93%, 97%] |

---

## B4. 预热期检测 (Warm-up)

> **代码位置**: `ai-engine/core/des/warmup.py`

### 概述

仿真开始时系统处于空闲状态（瞬态），与稳态行为有偏差。预热期检测自动判断稳态起始时刻，剔除瞬态数据。

支持两种方法：
- **MSER-5**：最小化截断后样本均值的置信区间宽度（推荐默认，单次 replication 可用）
- **Welch's method**：跨 replication 均值的移动平均平滑（需 `replications >= 5`）

### 观测数据收集（SimPy 进程）

```python
import simpy


def observation_collector(env: simpy.Environment, engine: 'SimulationEngine',
                          interval: float, metric_fn) -> None:
    """
    通用 SimPy 进程：按固定间隔采集观测值。
    metric_fn: callable(engine) -> float，由模块定义要采集的指标。
    """
    observations = []
    while True:
        yield env.timeout(interval)
        observations.append(metric_fn(engine))
    # observations 存储在 engine.warmup_observations
```

### MSER-5 方法

```python
import numpy as np


def mser5_warmup_detection(observations: list[float], max_fraction: float = 0.5) -> int:
    """
    MSER-5: batch size=5 批均值处理，找截断点 d 使 MSE(mean) 最小。
    返回: 应丢弃的观测数。
    """
    n = len(observations)
    arr = np.array(observations)
    
    batch_size = 5
    n_batches = n // batch_size
    batches = arr[:n_batches * batch_size].reshape(n_batches, batch_size).mean(axis=1)
    
    max_d = int(n_batches * max_fraction)
    best_d, best_mser = 0, float('inf')
    
    for d in range(max_d):
        remaining = batches[d:]
        m = len(remaining)
        if m < 2:
            break
        mser = np.var(remaining, ddof=1) / m
        if mser < best_mser:
            best_mser = mser
            best_d = d
    
    return best_d * batch_size
```

### Welch's method

```python
def welch_warmup_detection(replicated_observations: list[list[float]],
                            window_size: int = 25) -> int:
    """
    Welch's method:
    1. 每个时间点取跨 replication 均值 → Y_bar(t)
    2. 移动平均平滑
    3. 找平滑曲线趋于平稳的点
    """
    mat = np.array(replicated_observations)
    y_bar = mat.mean(axis=0)
    n_obs = len(y_bar)
    
    w = min(window_size, n_obs // 4)
    smoothed = np.convolve(y_bar, np.ones(2*w+1)/(2*w+1), mode='valid')
    
    steady_estimate = np.mean(smoothed[len(smoothed)//2:])
    threshold = 0.05 * np.std(smoothed[len(smoothed)//2:])
    
    for i in range(len(smoothed)):
        if abs(smoothed[i] - steady_estimate) < threshold:
            return i + w
    
    return len(smoothed) // 2  # fallback
```

### API 设计

**请求字段**：

```json
{
  "warmup": {
    "method": "mser5",
    "min_warmup_time": 0.0,
    "max_warmup_fraction": 0.5,
    "observation_interval": 1.0
  }
}
```

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `warmup.method` | `string` | 否 | `"none"` | `"none"` / `"welch"` / `"mser5"` / `"fixed"` |
| `warmup.fixed_time` | `float` | 否 | - | `method="fixed"` 时的固定预热时长 |
| `warmup.min_warmup_time` | `float` | 否 | `0.0` | 最小预热时长 |
| `warmup.max_warmup_fraction` | `float` | 否 | `0.5` | 预热期最多占总仿真时间的比例 |
| `warmup.observation_interval` | `float` | 否 | `1.0` | 观测间隔 |

**响应**：

```json
{
  "metadata": {
    "warmup_detected_time": 45.0,
    "warmup_method": "mser5",
    "effective_observation_period": 435.0
  }
}
```

### 验收标准

| 编号 | 标准 |
|------|------|
| AC-B4.1 | 已知预热期 T_w 的 M/M/1 系统，MSER-5 检测预热期 ∈ [0.5*T_w, 2*T_w] |
| AC-B4.2 | `method="none"` 时行为与当前版本一致 |
| AC-B4.3 | 预热期不超过 `max_warmup_fraction * simulation_time` |
| AC-B4.4 | 剔除预热期后稳态均值偏差更小（用理论值验证） |

---

## B5. Blocking/Starvation 通用框架

> **代码位置**: `ai-engine/core/des/blocking.py`

### 概述

通用有限缓冲区框架，利用 SimPy `Store(capacity=N)` 实现阻塞/饥饿语义。**与具体业务无关**——适用于检查站队列、产线工位、管网缓冲、备件仓库等任何需要容量限制的场景。

### 核心实现

```python
import simpy
import numpy as np
from typing import Optional
from .interfaces import BaseEntity


class BufferedQueue:
    """
    通用有限缓冲队列。封装 simpy.Store，自动记录阻塞/饥饿统计。
    """
    
    def __init__(self, env: simpy.Environment, capacity: Optional[int] = None,
                 queue_id: str = ""):
        self.env = env
        self.queue_id = queue_id
        self.store = simpy.Store(
            env, capacity=capacity if capacity is not None else float('inf')
        )
        self.stats = QueueStats(env)
    
    def put(self, entity: BaseEntity):
        """放入实体（满时自动阻塞 = blocking）。返回 SimPy event。"""
        self.stats.update_queue_length(len(self.store.items), self.env.now)
        return self.store.put(entity)
    
    def get(self):
        """取出实体（空时自动等待 = starvation）。返回 SimPy event。"""
        return self.store.get()
    
    @property
    def current_length(self) -> int:
        return len(self.store.items)


class ResourcePool:
    """
    通用资源池。封装 simpy.Resource / PreemptiveResource。
    """
    
    def __init__(self, env: simpy.Environment, capacity: int,
                 preemptive: bool = False, pool_id: str = ""):
        self.env = env
        self.pool_id = pool_id
        if preemptive:
            self.resource = simpy.PreemptiveResource(env, capacity=capacity)
        else:
            self.resource = simpy.Resource(env, capacity=capacity)
        self.stats = ResourceStats(env, capacity)
    
    def request(self):
        return self.resource.request()
    
    def release(self, req):
        return self.resource.release(req)
    
    @property
    def capacity(self):
        return self.resource.capacity
    
    @capacity.setter
    def capacity(self, value):
        self.resource._capacity = value


class QueueStats:
    """队列统计收集器"""
    def __init__(self, env: simpy.Environment):
        self.env = env
        self.blocking_events: list[dict] = []
        self.starvation_events: list[dict] = []
        self.blocking_time_total = 0.0
        self.starvation_time_total = 0.0
        self.queue_length_area = 0.0
        self.last_queue_time = 0.0
        self.last_queue_len = 0
        self.max_queue_length = 0
    
    def record_blocking(self, start: float, end: float, context: dict = None):
        self.blocking_events.append({"start": start, "end": end, **(context or {})})
        self.blocking_time_total += (end - start)
    
    def record_starvation(self, start: float, end: float, context: dict = None):
        self.starvation_events.append({"start": start, "end": end, **(context or {})})
        self.starvation_time_total += (end - start)
    
    def update_queue_length(self, current_len: int, now: float):
        self.queue_length_area += self.last_queue_len * (now - self.last_queue_time)
        self.last_queue_time = now
        self.last_queue_len = current_len
        self.max_queue_length = max(self.max_queue_length, current_len)


class ResourceStats:
    """资源统计收集器"""
    def __init__(self, env: simpy.Environment, capacity: int):
        self.env = env
        self.capacity = capacity
        self.busy_intervals: dict[int, list] = {}
        self.total_busy_time = 0.0
```

### SimPy 如何天然实现 Blocking/Starvation

| 场景 | SimPy 机制 | 说明 |
|------|-----------|------|
| **Starvation** | `yield store.get()` 当 store 为空时自动阻塞 | Worker 空闲等待上游 |
| **Blocking (BAS)** | `yield downstream.store.put(entity)` 当下游满时自动阻塞 | 服务完成后等待下游空间 |
| **无限缓冲** | `simpy.Store(capacity=float('inf'))` | put 永不阻塞，退化为原始行为 |

### 验收标准

| 编号 | 标准 |
|------|------|
| AC-B5.1 | `capacity=None` 时 put 永不阻塞，行为与无限缓冲一致 |
| AC-B5.2 | 2 阶段 M/M/1/K 系统 throughput 与理论值差异 < 5% |
| AC-B5.3 | 阻塞/饥饿事件正确记录（start_time, end_time） |
| AC-B5.4 | 下游缓冲区容量 = 0 时（纯阻塞）throughput 与理论值匹配 |

---

## B6. 故障注入框架 (Failure Injection)

> **代码位置**: `ai-engine/core/des/failure.py`

### 概述

通用设备/资源故障注入。**与具体业务无关**——适用于检查站柜台故障、产线设备故障、锅炉故障、泵站故障等。

故障模型：
- 运行时间: 指数分布 (1/MTBF) 或 Weibull 分布
- 维修时间: 指数分布 (1/MTTR) 或对数正态分布
- 故障策略: `preempt_resume`（暂停继续）或 `preempt_restart`（重新开始）

### 实现

```python
import simpy
import numpy as np
from .blocking import ResourcePool


class FailureInjector:
    """
    通用故障注入器。为 ResourcePool 中的每个资源单元启动独立故障进程。
    """
    
    def __init__(self, env: simpy.Environment, resource_pool: ResourcePool,
                 config: dict, rng_failure: np.random.Generator,
                 rng_repair: np.random.Generator):
        self.env = env
        self.pool = resource_pool
        self.config = config
        self.rng_failure = rng_failure
        self.rng_repair = rng_repair
        
        # 维修队列
        repair_cap = config.get("repair_capacity", 1)
        self.repair_resource = simpy.Resource(env, capacity=repair_cap)
        
        # 统计
        self.failure_count = 0
        self.total_downtime = 0.0
        self.failure_events: list[dict] = []
    
    def start(self, worker_processes: dict):
        """为每个资源单元启动故障进程"""
        self.worker_processes = worker_processes
        for unit_id in range(self.pool.capacity):
            self.env.process(self._failure_cycle(unit_id))
    
    def _failure_cycle(self, unit_id: int):
        """运行 → 故障 → 排队维修 → 维修 → 恢复"""
        mtbf = self.config["mtbf"]
        mttr = self.config["mttr"]
        
        while True:
            # 正常运行
            ttf = self._sample_ttf(mtbf)
            yield self.env.timeout(ttf)
            
            # 故障！中断 worker
            self.failure_count += 1
            failure_time = self.env.now
            worker = self.worker_processes.get(unit_id)
            if worker and worker.is_alive:
                worker.interrupt(cause="failure")
            
            # 请求维修
            with self.repair_resource.request() as req:
                yield req
                repair_start = self.env.now
                repair_time = self._sample_repair(mttr)
                yield self.env.timeout(repair_time)
            
            # 恢复
            downtime = self.env.now - failure_time
            self.total_downtime += downtime
            self.failure_events.append({
                "unit_id": unit_id, "failure_time": failure_time,
                "repair_start": repair_start, "repair_end": self.env.now
            })
    
    def _sample_ttf(self, mtbf: float) -> float:
        dist = self.config.get("mtbf_distribution", "exponential")
        if dist == "exponential":
            return self.rng_failure.exponential(mtbf)
        elif dist == "weibull":
            shape = self.config.get("mtbf_params", {}).get("shape", 1.0)
            return self.rng_failure.weibull(shape) * mtbf
        raise ValueError(f"Unknown MTBF distribution: {dist}")
    
    def _sample_repair(self, mttr: float) -> float:
        dist = self.config.get("mttr_distribution", "exponential")
        if dist == "exponential":
            return self.rng_repair.exponential(mttr)
        elif dist == "lognormal":
            sigma = self.config.get("mttr_params", {}).get("sigma", 0.5)
            mu = np.log(mttr) - sigma**2 / 2
            return self.rng_repair.lognormal(mu, sigma)
        raise ValueError(f"Unknown MTTR distribution: {dist}")
    
    def get_stats(self) -> dict:
        return {
            "failure_count": self.failure_count,
            "total_downtime": self.total_downtime,
            "avg_repair_time": self.total_downtime / self.failure_count if self.failure_count else 0,
            "availability": 1.0 - self.total_downtime / self.env.now if self.env.now > 0 else 1.0
        }
```

### API 设计（通用故障配置，嵌入 module_config）

```json
{
  "failure": {
    "enabled": true,
    "mtbf": 200.0,
    "mtbf_distribution": "exponential",
    "mttr": 10.0,
    "mttr_distribution": "exponential",
    "mttr_params": {},
    "failure_policy": "preempt_resume",
    "repair_capacity": 1
  }
}
```

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `failure.enabled` | `boolean` | 否 | `false` | 是否启用故障注入 |
| `failure.mtbf` | `float` | 条件 | - | 平均故障间隔 |
| `failure.mtbf_distribution` | `string` | 否 | `"exponential"` | `"exponential"` / `"weibull"` |
| `failure.mttr` | `float` | 条件 | - | 平均维修时间 |
| `failure.mttr_distribution` | `string` | 否 | `"exponential"` | `"exponential"` / `"lognormal"` |
| `failure.failure_policy` | `string` | 否 | `"preempt_resume"` | `"preempt_resume"` / `"preempt_restart"` |
| `failure.repair_capacity` | `integer` | 否 | `1` | 同时可维修数 |

### SimPy 故障机制对照

| 功能 | SimPy 实现 |
|------|-----------|
| 设备故障 | `worker_process.interrupt(cause="failure")` |
| 处理中断 | `try: yield env.timeout(service) except simpy.Interrupt:` |
| 维修队列 | `simpy.Resource(capacity=repair_capacity)` + `with resource.request()` |
| preempt_resume | interrupt 时保存 remaining_service，维修后继续 |
| preempt_restart | interrupt 时放回队列，维修后重启 |

### 验收标准

| 编号 | 标准 |
|------|------|
| AC-B6.1 | 设备可用度 ≈ MTBF / (MTBF + MTTR)，误差 < 3% |
| AC-B6.2 | `preempt_resume` 下被中断实体从断点继续 |
| AC-B6.3 | `preempt_restart` 下被中断实体重新入队 |
| AC-B6.4 | `repair_capacity=1` 且多设备同时故障时形成维修队列 |
| AC-B6.5 | 故障注入后 throughput 合理下降（与理论可用度成比例） |

---

## B7. 班次建模框架 (Shift Modeling)

> **代码位置**: `ai-engine/core/des/shift.py`

### 概述

通用容量调度框架。**与具体业务无关**——适用于检查站人员排班、产线班次、供热锅炉轮值等任何需要时间段内动态调整资源数量的场景。

### 实现

```python
import simpy
from .blocking import ResourcePool


class ShiftController:
    """
    通用班次控制器。独立 SimPy 进程，在切换时间点动态调整 ResourcePool.capacity。
    """
    
    def __init__(self, env: simpy.Environment, resource_pool: ResourcePool,
                 schedule: list[dict], handover_policy: str = "finish_current"):
        self.env = env
        self.pool = resource_pool
        self.schedule = sorted(schedule, key=lambda s: s["start_hour"])
        self.policy = handover_policy
        
        # 统计
        self.shift_events: list[dict] = []
        self.total_handover_downtime = 0.0
    
    def start(self, worker_manager=None):
        """启动班次控制器 SimPy 进程"""
        self.worker_manager = worker_manager
        self.env.process(self._control_loop())
    
    def _control_loop(self):
        while True:
            for shift in self.schedule:
                target_hour = shift["start_hour"]
                current_hour = self.env.now % 24.0
                
                if target_hour > current_hour:
                    wait = target_hour - current_hour
                elif target_hour < current_hour:
                    wait = (24.0 - current_hour) + target_hour
                else:
                    wait = 0.0 if self.env.now == 0 else 24.0
                
                if wait > 0:
                    yield self.env.timeout(wait)
                
                old_cap = self.pool.capacity
                new_cap = shift["num_servers"]
                handover_delay = shift.get("handover_delay", 0.0)
                
                self.shift_events.append({
                    "shift_id": shift["shift_id"],
                    "time": self.env.now,
                    "old_capacity": old_cap,
                    "new_capacity": new_cap
                })
                
                # 交接延迟
                if handover_delay > 0:
                    self.pool.capacity = min(old_cap, new_cap)
                    self.total_handover_downtime += handover_delay
                    yield self.env.timeout(handover_delay)
                
                # 设置新容量
                self.pool.capacity = new_cap
                
                # 容量增加时通知 worker_manager 启动新 worker
                if self.worker_manager and new_cap > old_cap:
                    self.worker_manager.scale_up(old_cap, new_cap)
    
    def get_stats(self) -> dict:
        return {
            "shift_transitions": len(self.shift_events),
            "total_handover_downtime": self.total_handover_downtime,
            "events": self.shift_events
        }
```

### API 设计（通用班次配置）

```json
{
  "shifts": {
    "enabled": true,
    "schedule": [
      { "shift_id": "morning", "start_hour": 8.0, "end_hour": 16.0, "num_servers": 3, "handover_delay": 0.25 },
      { "shift_id": "evening", "start_hour": 16.0, "end_hour": 24.0, "num_servers": 2, "handover_delay": 0.25 },
      { "shift_id": "night", "start_hour": 0.0, "end_hour": 8.0, "num_servers": 1, "handover_delay": 0.5 }
    ],
    "handover_policy": "finish_current"
  }
}
```

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `shifts.enabled` | `boolean` | 否 | `false` | 是否启用 |
| `shifts.schedule[]` | `array` | 条件 | - | 班次列表，须覆盖 24 小时 |
| `shifts.schedule[].shift_id` | `string` | 是 | - | 班次标识 |
| `shifts.schedule[].start_hour` | `float` | 是 | - | 起始小时 `[0, 24)` |
| `shifts.schedule[].end_hour` | `float` | 是 | - | 结束小时 `(0, 24]` |
| `shifts.schedule[].num_servers` | `integer` | 是 | - | 该班次可用资源数 |
| `shifts.schedule[].service_rate_modifier` | `float` | 否 | `1.0` | 服务速率乘数 |
| `shifts.schedule[].handover_delay` | `float` | 否 | `0.0` | 交接延迟 |
| `shifts.handover_policy` | `string` | 否 | `"finish_current"` | `"finish_current"` / `"immediate"` |

### 验收标准

| 编号 | 标准 |
|------|------|
| AC-B7.1 | 两班制 (各3台和1台) throughput 与理论值差异 < 5% |
| AC-B7.2 | 交接延迟期间无实体被服务 |
| AC-B7.3 | `finish_current` 下关闭的资源完成当前任务后才停机 |
| AC-B7.4 | 班次时间表须覆盖 24 小时，否则 API 返回 400 |

---

## B8. 仿真回放事件日志 (Playback)

> **代码位置**: `ai-engine/core/des/playback.py`

### 概述

通用仿真回放框架。独立 SimPy 进程按固定间隔采集快照，模块在关键节点调用 `record_event()` 记录离散事件。

### 实现

```python
import simpy
from typing import Optional


class PlaybackRecorder:
    """通用回放数据记录器"""
    
    def __init__(self, config: dict):
        self.enabled = config.get("enabled", False)
        self.interval = config.get("snapshot_interval", 1.0)
        self.record_events = config.get("record_events", True)
        self.max_snapshots = config.get("max_snapshots", 10000)
        
        self.snapshots: list[dict] = []
        self.events: list[dict] = []
    
    def snapshot_process(self, env: simpy.Environment, engine: 'SimulationEngine'):
        """SimPy 进程：按固定间隔采集快照"""
        count = 0
        while count < self.max_snapshots:
            yield env.timeout(self.interval)
            count += 1
            
            snapshot = {
                "time": env.now,
                "global": {
                    "entities_in_system": engine.total_arrivals - engine.total_departures,
                    "total_departures": engine.total_departures,
                    "total_arrivals": engine.total_arrivals
                },
                "module_state": {}  # 模块通过 callback 填充
            }
            
            # 模块可注册 snapshot callback
            if hasattr(engine, '_snapshot_callbacks'):
                for cb in engine._snapshot_callbacks:
                    snapshot["module_state"].update(cb(engine))
            
            self.snapshots.append(snapshot)
    
    def record_event(self, event_type: str, time: float, **kwargs):
        """记录离散事件（由模块在 SimPy 进程关键节点调用）"""
        if not self.enabled or not self.record_events:
            return
        self.events.append({
            "time": time,
            "type": event_type,
            **{k: v for k, v in kwargs.items() if v is not None}
        })
```

### API 设计

**请求配置**：

```json
{
  "playback": {
    "enabled": true,
    "snapshot_interval": 1.0,
    "record_events": true,
    "max_snapshots": 10000
  }
}
```

**回放查询 API**：

`GET /ai/simulation/{run_id}/playback`

```json
{
  "query": {
    "replication_idx": 0,
    "time_from": 0.0,
    "time_to": 100.0,
    "resolution": 1.0
  }
}
```

**单帧快照查询**：

`GET /ai/simulation/{run_id}/playback/snapshot?time=45.5&replication_idx=0`

### 存储优化

- 快照使用增量编码（delta compression）
- 事件日志批量插入
- 超过 `max_snapshots` 时自动停止
- 可选 gzip 压缩

### 验收标准

| 编号 | 标准 |
|------|------|
| AC-B8.1 | `enabled=true` 时仿真完成后可查询回放数据 |
| AC-B8.2 | 快照数量 ≤ `max_snapshots` |
| AC-B8.3 | 时间查询返回最接近的快照，误差 ≤ `snapshot_interval` |
| AC-B8.4 | 480 时间单位仿真、间隔 1.0 → ~480 快照，存储 < 5MB |
| AC-B8.5 | `enabled=false` 时无存储开销 |

---

## B9. 历史数据热启动框架 (Warm-start)

> **代码位置**: `ai-engine/core/des/warmstart.py`

### 概述

通用热启动框架。允许从外部状态（手动、回放快照、传感器 API）初始化 SimPy 环境，跳过空系统瞬态。

### 实现

```python
import simpy
from typing import Optional
from .interfaces import BaseEntity


class WarmStartInitializer:
    """通用热启动初始化器。在 env.run() 之前注入状态。"""
    
    def __init__(self, config: dict):
        self.warm_start = config.get("warm_start", {})
    
    def initialize(self, env: simpy.Environment, engine: 'SimulationEngine',
                   state_applier=None) -> None:
        """
        在 env.run() 之前调用。
        state_applier: 模块提供的回调，将 initial_state 注入模块专属结构。
        """
        if not self.warm_start.get("enabled", False):
            return
        
        source = self.warm_start.get("source", "manual")
        
        if source == "manual":
            state = self.warm_start["initial_state"]
        elif source == "snapshot":
            state = self._load_from_snapshot(self.warm_start["snapshot_id"])
        elif source == "sensor_api":
            state = self._fetch_from_sensors(self.warm_start)
        else:
            raise ValueError(f"Unknown warm_start source: {source}")
        
        # 通用状态
        global_state = state.get("global", {})
        engine.next_entity_id = global_state.get("next_entity_id", 1)
        engine.total_arrivals = global_state.get("total_arrivals", 0)
        engine.total_departures = global_state.get("total_departures", 0)
        
        # 模块专属状态由 state_applier 处理
        if state_applier:
            state_applier(env, engine, state)
    
    def _fetch_from_sensors(self, config: dict) -> dict:
        """从传感器 API 获取当前状态（通用框架）"""
        import requests
        endpoint = config["sensor_endpoint"]
        response = requests.get(endpoint, timeout=10)
        return response.json()
    
    def _load_from_snapshot(self, snapshot_id: str) -> dict:
        """从回放快照加载状态"""
        raise NotImplementedError("需要数据库访问层实现")
```

### API 设计

```json
{
  "warm_start": {
    "enabled": true,
    "source": "manual",
    "initial_state": {
      "sim_time_offset": 120.0,
      "global": {
        "next_entity_id": 104,
        "total_arrivals": 103,
        "total_departures": 95
      },
      "module_state": {
        // 模块专属初始状态，由模块解析
      }
    }
  }
}
```

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `warm_start.enabled` | `boolean` | 否 | `false` | 是否启用 |
| `warm_start.source` | `string` | 否 | `"manual"` | `"manual"` / `"snapshot"` / `"sensor_api"` |
| `warm_start.initial_state` | `object` | 条件 | - | 初始状态 |
| `warm_start.sensor_endpoint` | `string` | 否 | - | 传感器 API 地址 |

**传感器数据转换 API**（通用入口，模块提供 mapping）：

`POST /ai/simulation/warm-start/from-sensors`

### 验收标准

| 编号 | 标准 |
|------|------|
| AC-B9.1 | 手动提供初始状态时仿真从该状态正确开始 |
| AC-B9.2 | 从回放快照加载 → 仿真继续，结果与不中断运行一致 |
| AC-B9.3 | 传感器 API 不可达时返回 HTTP 502 + 描述 |
| AC-B9.4 | 热启动 + `replications=10` 正确执行（每个 replication 从相同初始状态开始） |
| AC-B9.5 | 热启动时自动跳过预热期处理 |

---

## B10. 通用数据库 Schema

> 使用 PostgreSQL，表名前缀 `sim_`，时间戳 `TIMESTAMPTZ`，主键 `BIGSERIAL`

```sql
-- 仿真运行主表
CREATE TABLE sim_run (
    id              BIGSERIAL PRIMARY KEY,
    scene_type      VARCHAR(64) NOT NULL,       -- 路由键: trafficops, heatops, fms
    scene_id        VARCHAR(64) NOT NULL,
    seed_used       BIGINT NOT NULL,
    simulation_time DOUBLE PRECISION NOT NULL,
    config_json     JSONB NOT NULL,
    status          VARCHAR(16) NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    result_json     JSONB
);

CREATE INDEX idx_sim_run_scene ON sim_run(scene_type, scene_id);
CREATE INDEX idx_sim_run_seed ON sim_run(seed_used);

-- Replication 表
CREATE TABLE sim_replication (
    id              BIGSERIAL PRIMARY KEY,
    run_id          BIGINT NOT NULL REFERENCES sim_run(id) ON DELETE CASCADE,
    replication_idx INTEGER NOT NULL,
    seed_used       BIGINT NOT NULL,
    status          VARCHAR(16) NOT NULL DEFAULT 'pending',
    result_json     JSONB,
    wall_time_ms    INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    UNIQUE(run_id, replication_idx)
);

CREATE INDEX idx_sim_repl_run ON sim_replication(run_id);

-- 预热期分析
CREATE TABLE sim_warmup_analysis (
    id              BIGSERIAL PRIMARY KEY,
    run_id          BIGINT NOT NULL REFERENCES sim_run(id) ON DELETE CASCADE,
    replication_idx INTEGER NOT NULL,
    method          VARCHAR(16) NOT NULL,
    detected_time   DOUBLE PRECISION NOT NULL,
    observation_series JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 回放快照
CREATE TABLE sim_playback_snapshot (
    id              BIGSERIAL PRIMARY KEY,
    run_id          BIGINT NOT NULL REFERENCES sim_run(id) ON DELETE CASCADE,
    replication_idx INTEGER NOT NULL,
    sim_time        DOUBLE PRECISION NOT NULL,
    state_json      JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sim_playback_time ON sim_playback_snapshot(run_id, replication_idx, sim_time);

-- 回放事件
CREATE TABLE sim_playback_event (
    id              BIGSERIAL PRIMARY KEY,
    run_id          BIGINT NOT NULL REFERENCES sim_run(id) ON DELETE CASCADE,
    replication_idx INTEGER NOT NULL,
    sim_time        DOUBLE PRECISION NOT NULL,
    event_type      VARCHAR(32) NOT NULL,
    detail_json     JSONB
);

CREATE INDEX idx_sim_event_time ON sim_playback_event(run_id, replication_idx, sim_time);

-- 热启动状态
CREATE TABLE sim_warm_start_state (
    id              BIGSERIAL PRIMARY KEY,
    run_id          BIGINT REFERENCES sim_run(id) ON DELETE CASCADE,
    source          VARCHAR(32) NOT NULL,
    state_json      JSONB NOT NULL,
    source_meta     JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 传感器映射（通用，按 scene_type + scene_id 关联）
CREATE TABLE sim_sensor_mapping (
    id              BIGSERIAL PRIMARY KEY,
    scene_type      VARCHAR(64) NOT NULL,
    scene_id        VARCHAR(64) NOT NULL,
    resource_id     VARCHAR(64) NOT NULL,       -- 通用资源标识
    sensor_type     VARCHAR(32) NOT NULL,
    sensor_id       VARCHAR(128) NOT NULL,
    transform_expr  VARCHAR(256),
    UNIQUE(scene_type, scene_id, resource_id, sensor_type, sensor_id)
);
```

### ER 关系

```
sim_run (1) ──── (N) sim_replication
    │
    ├──── (N) sim_warmup_analysis
    ├──── (N) sim_playback_snapshot
    ├──── (N) sim_playback_event
    └──── (1) sim_warm_start_state

sim_sensor_mapping (独立表，按 scene_type + scene_id 关联)
```

---

# 第二部分：TrafficOps 模块 — 检查站仿真

> **代码位置**: `ai-engine/modules/trafficops/`  
> **职责**: 基于基盘 DES 引擎实现检查站（边检、安检）仿真。复用基盘所有能力（CRN、Replication、CI、Warmup、Blocking、Failure、Shift、Playback、Warm-start）。

---

## T1. 模块概述

### 1.1 业务背景

TrafficOps 模块用于模拟口岸/机场检查站的旅客通行流程：

- 旅客到达大厅 → 排队 → 入境检查（immigration）→ 走通道（transit）→ 安全检查（security）→ 离开
- 不同时段到达率不同（PHASE1-PHASE4 乘数）
- 需评估：各环节等待时间、柜台利用率、throughput、瓶颈位置

### 1.2 用户角色

| 角色 | 主要诉求 |
|------|---------|
| **通关工程师** | 对比不同柜台数量方案的 throughput 和 utilization |
| **运营经理** | 评估故障频率和排班对通关效率的影响 |
| **数据分析师** | 统计置信区间，用历史数据校准仿真 |

---

## T2. Passenger 实体

> **代码位置**: `ai-engine/modules/trafficops/entities.py`

```python
from dataclasses import dataclass, field
from typing import Optional
from ai_engine.core.des.interfaces import BaseEntity


@dataclass
class Passenger(BaseEntity):
    """旅客实体，扩展 BaseEntity"""
    entity_type: str = "passenger"
    
    # TrafficOps 专属字段
    passenger_type: str = "regular"           # regular, priority, crew
    nationality: str = ""
    flight_id: str = ""
    
    # 各环节时间戳
    immigration_arrive: Optional[float] = None
    immigration_start: Optional[float] = None
    immigration_end: Optional[float] = None
    transit_start: Optional[float] = None
    transit_end: Optional[float] = None
    security_arrive: Optional[float] = None
    security_start: Optional[float] = None
    security_end: Optional[float] = None
    
    @property
    def immigration_wait(self) -> Optional[float]:
        if self.immigration_arrive and self.immigration_start:
            return self.immigration_start - self.immigration_arrive
        return None
    
    @property
    def security_wait(self) -> Optional[float]:
        if self.security_arrive and self.security_start:
            return self.security_start - self.security_arrive
        return None
    
    @property
    def total_time(self) -> Optional[float]:
        if self.departure_time and self.creation_time:
            return self.departure_time - self.creation_time
        return None
```

---

## T3. Checkpoint 流程

> **代码位置**: `ai-engine/modules/trafficops/processes.py`

```python
import simpy
import numpy as np
from ai_engine.core.des.interfaces import BaseProcess
from ai_engine.core.des.blocking import BufferedQueue, ResourcePool
from ai_engine.core.des.failure import FailureInjector
from ai_engine.core.des.shift import ShiftController
from .entities import Passenger


class CheckpointProcess(BaseProcess):
    """
    检查站流程（extends BaseProcess）。
    流程链: queue → immigration → transit → security → exit
    每个环节使用基盘的 BufferedQueue + ResourcePool。
    """
    
    def __init__(self, process_id: str, config: dict):
        self.process_id = process_id
        self.config = config
        
        # 基盘组件（在 setup 中初始化）
        self.queue: BufferedQueue = None
        self.resource: ResourcePool = None
        self.failure_injector: FailureInjector = None
        self.shift_controller: ShiftController = None
        
        # 统计
        self.served_count = 0
        self.total_service_time = 0.0
    
    def setup(self, env: simpy.Environment, engine: 'SimulationEngine') -> None:
        """使用基盘组件初始化"""
        buf_cap = self.config.get("buffer_capacity")
        self.queue = BufferedQueue(env, capacity=buf_cap, queue_id=self.process_id)
        
        preemptive = self.config.get("failure", {}).get("enabled", False)
        self.resource = ResourcePool(
            env, capacity=self.config["num_servers"],
            preemptive=preemptive, pool_id=self.process_id
        )
        
        # 故障注入（使用基盘 FailureInjector）
        failure_config = self.config.get("failure", {})
        if failure_config.get("enabled"):
            rng_f = engine.get_rng(self._rng_offset + 2)
            rng_r = engine.get_rng(self._rng_offset + 3)
            self.failure_injector = FailureInjector(
                env, self.resource, failure_config, rng_f, rng_r
            )
        
        # 班次建模（使用基盘 ShiftController）
        shift_config = self.config.get("shifts", {})
        if shift_config.get("enabled"):
            self.shift_controller = ShiftController(
                env, self.resource, shift_config["schedule"],
                shift_config.get("handover_policy", "finish_current")
            )
            self.shift_controller.start()
        
        # 启动 worker
        self.worker_processes = {}
        for sid in range(self.config["num_servers"]):
            self.worker_processes[sid] = env.process(self._worker(env, engine, sid))
        
        # 启动故障注入
        if self.failure_injector:
            self.failure_injector.start(self.worker_processes)
    
    def _worker(self, env: simpy.Environment, engine: 'SimulationEngine', server_id: int):
        """服务台 worker: 从队列取旅客 → 服务 → 放入下游"""
        rng_service = engine.get_rng(self._rng_offset + 1)
        service_rate = self.config["service_rate"]
        
        while True:
            # 取旅客（空时等待 = starvation）
            starvation_start = env.now
            passenger = yield self.queue.get()
            starvation_dur = env.now - starvation_start
            if starvation_dur > 1e-9:
                self.queue.stats.record_starvation(starvation_start, env.now,
                                                    {"server_id": server_id})
            
            # 服务
            try:
                service_time = rng_service.exponential(1.0 / service_rate)
                yield env.timeout(service_time)
                self.served_count += 1
                self.total_service_time += service_time
                
                # 回放事件
                if engine.recorder:
                    engine.recorder.record_event("SERVICE_COMPLETE", env.now,
                                                  process_id=self.process_id,
                                                  server_id=server_id,
                                                  entity_id=passenger.id)
                
                # 放入下游（由 scene 的流程链处理）
                if hasattr(self, 'next_process') and self.next_process:
                    blocking_start = env.now
                    yield self.next_process.queue.put(passenger)
                    if env.now > blocking_start + 1e-9:
                        self.queue.stats.record_blocking(blocking_start, env.now,
                                                          {"server_id": server_id})
                else:
                    engine.register_entity_departure(passenger)
            
            except simpy.Interrupt:
                # 被故障中断，FailureInjector 会处理恢复
                return
    
    def run(self, env: simpy.Environment, entity: Passenger) -> None:
        """将旅客放入此环节队列"""
        yield self.queue.put(entity)
    
    def collect_kpis(self) -> dict:
        sim_time = self.queue.env.now
        return {
            f"{self.process_id}_throughput": self.served_count,
            f"{self.process_id}_utilization": (
                self.total_service_time / (sim_time * self.config["num_servers"])
                if sim_time > 0 else 0
            ),
            f"{self.process_id}_avg_queue_length": (
                self.queue.stats.queue_length_area / sim_time if sim_time > 0 else 0
            ),
            f"{self.process_id}_max_queue_length": self.queue.stats.max_queue_length,
            f"{self.process_id}_blocking_rate": (
                self.queue.stats.blocking_time_total / sim_time if sim_time > 0 else 0
            ),
            f"{self.process_id}_starvation_rate": (
                self.queue.stats.starvation_time_total / sim_time if sim_time > 0 else 0
            ),
        }
```

---

## T4. Scene 配置

> **代码位置**: `ai-engine/modules/trafficops/scenes.py`

### 预定义场景

| scene_id | 描述 | 流程链 |
|----------|------|--------|
| `rts-main-hall` | 出发大厅全流程 | immigration → transit → security |
| `cp-immigration` | 仅入境检查 | immigration |
| `cp-security` | 仅安全检查 | security |

### Scene 实现

```python
import simpy
import numpy as np
from ai_engine.core.des.interfaces import BaseScene, SceneConfig
from ai_engine.core.des.router import register_scene_type
from .entities import Passenger
from .processes import CheckpointProcess
from .config import PHASE_MULTIPLIERS


class CheckpointScene(BaseScene):
    """TrafficOps 检查站场景"""
    
    def __init__(self, config: dict):
        self.config = config
        self.module_config = config.get("module_config", {})
        self.processes: list[CheckpointProcess] = []
    
    def get_config(self) -> SceneConfig:
        return SceneConfig(
            scene_type="trafficops",
            scene_id=self.config["scene_id"],
            simulation_time=self.config["simulation_time"],
            seed=self.config.get("seed"),
            replications=self.config.get("replications", 1),
            confidence_level=self.config.get("confidence_level", 0.95),
            warmup=self.config.get("warmup", {}),
            playback=self.config.get("playback", {}),
            warm_start=self.config.get("warm_start", {}),
        )
    
    def build_processes(self, env: simpy.Environment,
                        engine: 'SimulationEngine') -> list[CheckpointProcess]:
        """根据 scene_id 构建流程链"""
        checkpoints = self.module_config.get("checkpoints", [])
        
        self.processes = []
        prev = None
        for i, cp_config in enumerate(checkpoints):
            proc = CheckpointProcess(cp_config["checkpoint_id"], cp_config)
            proc._rng_offset = i * 4  # 每个 checkpoint 占 4 个 RNG stream
            proc.setup(env, engine)
            if prev:
                prev.next_process = proc
            self.processes.append(proc)
            prev = proc
        
        return self.processes
    
    def create_arrival_generator(self, env: simpy.Environment,
                                  engine: 'SimulationEngine'):
        """Poisson 到达，支持 PHASE 到达率乘数"""
        base_rate = self.module_config.get("arrival_rate", 10.0)
        phases = self.module_config.get("phases", [])
        rng_arrival = engine.get_rng(0)
        first_process = self.processes[0] if self.processes else None
        
        if not first_process:
            return
        
        while True:
            # 确定当前 phase 的到达率乘数
            multiplier = self._get_current_multiplier(env.now, phases)
            rate = base_rate * multiplier
            
            inter_arrival = rng_arrival.exponential(1.0 / rate)
            yield env.timeout(inter_arrival)
            
            # 创建旅客
            passenger = Passenger(
                id=engine.next_entity_id,
                creation_time=env.now,
            )
            engine.next_entity_id += 1
            engine.total_arrivals += 1
            passenger.immigration_arrive = env.now
            
            # 回放事件
            if engine.recorder:
                engine.recorder.record_event("ARRIVAL", env.now,
                                              entity_id=passenger.id)
            
            # 放入第一个环节
            yield first_process.queue.put(passenger)
    
    def _get_current_multiplier(self, sim_time: float, phases: list[dict]) -> float:
        """根据仿真时间确定当前 phase 的到达率乘数"""
        for phase in phases:
            if phase["start_time"] <= sim_time < phase["end_time"]:
                return phase.get("multiplier", 1.0)
        return 1.0
    
    def collect_results(self) -> dict:
        """聚合所有 checkpoint 的 KPI"""
        results = {}
        total_throughput = 0
        for proc in self.processes:
            kpis = proc.collect_kpis()
            results.update(kpis)
            total_throughput += kpis.get(f"{proc.process_id}_throughput", 0)
        
        # 全局 KPI
        results["throughput"] = total_throughput
        
        # 从已完成旅客计算平均等待时间
        # （通过 engine.entities_completed 获取）
        return results


# 模块注册
register_scene_type("trafficops", CheckpointScene)
```

---

## T5. Phase 定义与到达率

> **代码位置**: `ai-engine/modules/trafficops/config.py`

```python
"""TrafficOps Phase 定义 — 到达率乘数"""

# 预定义 PHASE 模板
PHASE_MULTIPLIERS = {
    "PHASE1": {
        "name": "低峰期",
        "description": "清晨/深夜低客流时段",
        "multiplier": 0.3
    },
    "PHASE2": {
        "name": "平峰期",
        "description": "日间正常客流时段",
        "multiplier": 1.0
    },
    "PHASE3": {
        "name": "高峰期",
        "description": "航班密集时段",
        "multiplier": 2.0
    },
    "PHASE4": {
        "name": "超高峰",
        "description": "假日/特殊事件超高客流",
        "multiplier": 3.5
    }
}

# 默认场景配置模板
DEFAULT_SCENES = {
    "rts-main-hall": {
        "checkpoints": [
            {"checkpoint_id": "immigration", "service_rate": 12.0, "num_servers": 6},
            {"checkpoint_id": "transit", "service_rate": 30.0, "num_servers": 2},
            {"checkpoint_id": "security", "service_rate": 10.0, "num_servers": 4},
        ],
        "arrival_rate": 15.0,
        "phases": [
            {"phase_id": "PHASE1", "start_time": 0, "end_time": 60, "multiplier": 0.3},
            {"phase_id": "PHASE2", "start_time": 60, "end_time": 240, "multiplier": 1.0},
            {"phase_id": "PHASE3", "start_time": 240, "end_time": 420, "multiplier": 2.0},
            {"phase_id": "PHASE4", "start_time": 420, "end_time": 480, "multiplier": 3.5},
        ]
    },
    "cp-immigration": {
        "checkpoints": [
            {"checkpoint_id": "immigration", "service_rate": 12.0, "num_servers": 6},
        ],
        "arrival_rate": 15.0,
        "phases": [
            {"phase_id": "PHASE2", "start_time": 0, "end_time": 480, "multiplier": 1.0},
        ]
    },
    "cp-security": {
        "checkpoints": [
            {"checkpoint_id": "security", "service_rate": 10.0, "num_servers": 4},
        ],
        "arrival_rate": 12.0,
        "phases": [
            {"phase_id": "PHASE2", "start_time": 0, "end_time": 480, "multiplier": 1.0},
        ]
    }
}
```

---

## T6. TrafficOps 专属 KPI

> **代码位置**: `ai-engine/modules/trafficops/kpis.py`

| KPI | 含义 | 单位 | 计算方式 |
|-----|------|------|---------|
| `throughput` | 通关总人数 | 人/时间单位 | 离开系统的旅客总数 / 有效仿真时间 |
| `avg_wait_immigration` | 入境检查平均等待 | 时间单位 | Σ(immigration_start - immigration_arrive) / N |
| `avg_wait_security` | 安检平均等待 | 时间单位 | Σ(security_start - security_arrive) / N |
| `avg_total_time` | 平均总通关时间 | 时间单位 | Σ(departure - creation) / N |
| `utilization_immigration` | 入境柜台利用率 | [0,1] | 忙碌时间 / (总时间 × 柜台数) |
| `utilization_security` | 安检通道利用率 | [0,1] | 忙碌时间 / (总时间 × 通道数) |
| `max_queue_immigration` | 入境最大排队长度 | 人 | 观测最大值 |
| `max_queue_security` | 安检最大排队长度 | 人 | 观测最大值 |
| `blocking_rate_*` | 各环节阻塞率 | [0,1] | 阻塞时间 / 总时间（基盘计算） |
| `availability_*` | 各环节设备可用率 | [0,1] | MTBF / (MTBF + MTTR)（基盘计算） |

---

## T7. TrafficOps API 示例

### 完整请求

```json
{
  "scene_type": "trafficops",
  "scene_id": "rts-main-hall",
  "simulation_time": 480.0,
  "seed": 42,
  "replications": 30,
  "parallel_workers": 4,
  "confidence_level": 0.95,
  "warmup": {
    "method": "mser5",
    "max_warmup_fraction": 0.3
  },
  "playback": {
    "enabled": true,
    "snapshot_interval": 1.0,
    "max_snapshots": 5000
  },
  "module_config": {
    "arrival_rate": 15.0,
    "phases": [
      { "phase_id": "PHASE1", "start_time": 0, "end_time": 60, "multiplier": 0.3 },
      { "phase_id": "PHASE2", "start_time": 60, "end_time": 240, "multiplier": 1.0 },
      { "phase_id": "PHASE3", "start_time": 240, "end_time": 420, "multiplier": 2.0 },
      { "phase_id": "PHASE4", "start_time": 420, "end_time": 480, "multiplier": 3.5 }
    ],
    "checkpoints": [
      {
        "checkpoint_id": "immigration",
        "service_rate": 12.0,
        "num_servers": 6,
        "buffer_capacity": 50,
        "failure": {
          "enabled": true,
          "mtbf": 200.0,
          "mttr": 10.0,
          "failure_policy": "preempt_resume",
          "repair_capacity": 1
        },
        "shifts": {
          "enabled": true,
          "schedule": [
            { "shift_id": "day", "start_hour": 8.0, "end_hour": 20.0, "num_servers": 6, "handover_delay": 0.25 },
            { "shift_id": "night", "start_hour": 20.0, "end_hour": 8.0, "num_servers": 3, "handover_delay": 0.5 }
          ],
          "handover_policy": "finish_current"
        }
      },
      {
        "checkpoint_id": "transit",
        "service_rate": 30.0,
        "num_servers": 2,
        "buffer_capacity": null
      },
      {
        "checkpoint_id": "security",
        "service_rate": 10.0,
        "num_servers": 4,
        "buffer_capacity": 30,
        "failure": { "enabled": false }
      }
    ]
  }
}
```

### 响应示例

```json
{
  "metadata": {
    "scene_type": "trafficops",
    "scene_id": "rts-main-hall",
    "seed_used": 42,
    "replications": 30,
    "wall_time_seconds": 12.5,
    "warmup_detected_time": 45.0,
    "warmup_method": "mser5",
    "engine_version": "3.0.0"
  },
  "summary": {
    "throughput": { "mean": 145.2, "std": 8.3, "ci_lower": 142.1, "ci_upper": 148.3, "ci_level": 0.95, "n": 30 },
    "avg_wait_immigration": { "mean": 3.2, "std": 0.8, "ci_lower": 2.9, "ci_upper": 3.5, "ci_level": 0.95, "n": 30 },
    "avg_wait_security": { "mean": 4.1, "std": 1.2, "ci_lower": 3.6, "ci_upper": 4.6, "ci_level": 0.95, "n": 30 },
    "utilization_immigration": { "mean": 0.82, "std": 0.03, "ci_lower": 0.81, "ci_upper": 0.83, "ci_level": 0.95, "n": 30 },
    "utilization_security": { "mean": 0.91, "std": 0.02, "ci_lower": 0.90, "ci_upper": 0.92, "ci_level": 0.95, "n": 30 },
    "max_queue_immigration": { "mean": 35, "std": 5, "ci_lower": 33, "ci_upper": 37, "ci_level": 0.95, "n": 30 },
    "availability_immigration": { "mean": 0.95, "std": 0.01, "ci_lower": 0.94, "ci_upper": 0.96, "ci_level": 0.95, "n": 30 }
  },
  "per_replication": [ "..." ]
}
```

---

## T8. TrafficOps 数据库 Schema

TrafficOps 模块专属表（补充基盘通用表）：

```sql
-- 检查站配置
CREATE TABLE sim_trafficops_checkpoint (
    id              BIGSERIAL PRIMARY KEY,
    run_id          BIGINT NOT NULL REFERENCES sim_run(id) ON DELETE CASCADE,
    checkpoint_id   VARCHAR(64) NOT NULL,
    service_rate    DOUBLE PRECISION NOT NULL,
    num_servers     INTEGER NOT NULL,
    buffer_capacity INTEGER,
    UNIQUE(run_id, checkpoint_id)
);

-- Phase 定义
CREATE TABLE sim_trafficops_phase (
    id              BIGSERIAL PRIMARY KEY,
    run_id          BIGINT NOT NULL REFERENCES sim_run(id) ON DELETE CASCADE,
    phase_id        VARCHAR(32) NOT NULL,
    start_time      DOUBLE PRECISION NOT NULL,
    end_time        DOUBLE PRECISION NOT NULL,
    multiplier      DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    UNIQUE(run_id, phase_id)
);

-- 旅客级明细（可选，大数据量时按需开启）
CREATE TABLE sim_trafficops_passenger_log (
    id                  BIGSERIAL PRIMARY KEY,
    run_id              BIGINT NOT NULL REFERENCES sim_run(id) ON DELETE CASCADE,
    replication_idx     INTEGER NOT NULL,
    passenger_id        BIGINT NOT NULL,
    creation_time       DOUBLE PRECISION NOT NULL,
    immigration_wait    DOUBLE PRECISION,
    security_wait       DOUBLE PRECISION,
    total_time          DOUBLE PRECISION,
    departure_time      DOUBLE PRECISION
);

CREATE INDEX idx_trafficops_passenger ON sim_trafficops_passenger_log(run_id, replication_idx);
```

---

## T9. 验收标准

| 编号 | 标准 |
|------|------|
| AC-T1 | `scene_type="trafficops"` 正确路由到 CheckpointScene |
| AC-T2 | rts-main-hall 场景完整运行 immigration → transit → security 流程链 |
| AC-T3 | PHASE1-PHASE4 到达率乘数正确应用（PHASE3 到达率 = base × 2.0） |
| AC-T4 | Passenger 实体记录各环节时间戳，KPI 计算正确 |
| AC-T5 | 柜台故障注入使用基盘 FailureInjector，availability 与理论值匹配 |
| AC-T6 | 排班使用基盘 ShiftController，交接期间无服务 |
| AC-T7 | 有限缓冲使用基盘 BufferedQueue，阻塞率正确 |
| AC-T8 | `replications=30` + CRN 正确运行，CI 结果合理 |
| AC-T9 | cp-immigration 和 cp-security 单环节场景正确运行 |

---

# 第三部分：其他模块示例

> 以下示例展示其他模块如何复用基盘 DES 引擎，证明架构通用性。

---

## HeatOps — 供热网络仿真

> **代码位置**: `ai-engine/modules/heatops/`（未来实现）

### 场景描述

供热系统仿真：锅炉产热 → 管网输送 → 换热站消耗。评估锅炉故障对供热质量的影响。

### 复用基盘能力

| 基盘组件 | HeatOps 用法 |
|---------|-------------|
| `BaseEntity` | → `HeatUnit`（热量单元），携带温度、流量等属性 |
| `BaseProcess` | → `BoilerProcess`（锅炉产热）、`PipeProcess`（管网输送）、`ExchangerProcess`（换热） |
| `BufferedQueue` | → 管网缓冲容量（管道中可容纳的热量单元数） |
| `FailureInjector` | → 锅炉故障（MTBF=500h, MTTR=24h），泵站故障 |
| `ShiftController` | → 锅炉轮值（白天 3 台，夜间 2 台） |
| `CRN + Replication` | → 对比不同锅炉配置方案 |
| `PlaybackRecorder` | → 回放管网温度变化 |

### 实体示例

```python
@dataclass
class HeatUnit(BaseEntity):
    entity_type: str = "heat_unit"
    temperature: float = 90.0       # ℃
    flow_rate: float = 10.0         # m³/h
    source_boiler: str = ""

@dataclass
class BoilerProcess(BaseProcess):
    """锅炉产热过程——使用基盘 ResourcePool + FailureInjector"""
    # setup() 中创建 ResourcePool(capacity=num_boilers)
    # FailureInjector 注入锅炉故障
    # run() 中生成 HeatUnit 实体
```

### 场景注册

```python
register_scene_type("heatops", HeatNetworkScene)
```

### API 调用示例

```json
{
  "scene_type": "heatops",
  "scene_id": "heating-network",
  "simulation_time": 720.0,
  "seed": 42,
  "replications": 20,
  "module_config": {
    "boilers": [
      { "boiler_id": "B1", "capacity": 50.0, "failure": { "enabled": true, "mtbf": 500.0, "mttr": 24.0 } },
      { "boiler_id": "B2", "capacity": 50.0, "failure": { "enabled": true, "mtbf": 600.0, "mttr": 20.0 } }
    ],
    "pipes": [
      { "pipe_id": "P1", "buffer_capacity": 100, "heat_loss_rate": 0.02 }
    ],
    "demand_profile": [
      { "start_hour": 0, "end_hour": 6, "demand_rate": 30.0 },
      { "start_hour": 6, "end_hour": 22, "demand_rate": 80.0 },
      { "start_hour": 22, "end_hour": 24, "demand_rate": 40.0 }
    ]
  }
}
```

---

## FMS — 设备维保仿真

> **代码位置**: `ai-engine/modules/fms/`（未来实现）

### 场景描述

设备维保调度仿真：设备运行 → 故障/计划维保 → 调度维修工 → 调配备件 → 维修 → 恢复。评估不同维保策略和备件库存对设备可用率的影响。

### 复用基盘能力

| 基盘组件 | FMS 用法 |
|---------|---------|
| `BaseEntity` | → `Equipment`（设备）、`SparePart`（备件）、`WorkOrder`（工单） |
| `BaseProcess` | → `MaintenanceProcess`（维修流程）、`InventoryProcess`（备件出入库） |
| `BufferedQueue` | → 备件仓库（Store capacity = 库存上限） |
| `FailureInjector` | → 设备故障建模（Weibull 分布，shape>1 代表磨损型故障） |
| `ResourcePool` | → 维修工资源池（capacity = 维修工人数） |
| `ShiftController` | → 维修团队排班 |
| `WarmStartInitializer` | → 从 CMMS 系统加载当前设备状态和库存 |

### 实体示例

```python
@dataclass
class Equipment(BaseEntity):
    entity_type: str = "equipment"
    equipment_type: str = ""
    location: str = ""
    operating_hours: float = 0.0

@dataclass
class SparePart(BaseEntity):
    entity_type: str = "spare_part"
    part_number: str = ""
    lead_time: float = 0.0          # 采购交期
    unit_cost: float = 0.0
```

### 场景注册

```python
register_scene_type("fms", MaintenanceScene)
```

### API 调用示例

```json
{
  "scene_type": "fms",
  "scene_id": "predictive-maintenance",
  "simulation_time": 8760.0,
  "seed": 42,
  "replications": 50,
  "module_config": {
    "equipment": [
      { "equipment_id": "E1", "type": "pump", "failure": { "enabled": true, "mtbf": 2000.0, "mtbf_distribution": "weibull", "mtbf_params": { "shape": 2.5 }, "mttr": 8.0 } },
      { "equipment_id": "E2", "type": "compressor", "failure": { "enabled": true, "mtbf": 3000.0, "mttr": 12.0 } }
    ],
    "maintenance_crew": { "num_workers": 3, "shifts": { "enabled": true, "schedule": [
      { "shift_id": "day", "start_hour": 8.0, "end_hour": 20.0, "num_servers": 3 },
      { "shift_id": "night", "start_hour": 20.0, "end_hour": 8.0, "num_servers": 1 }
    ] } },
    "spare_parts": [
      { "part_number": "SP-001", "initial_stock": 5, "reorder_point": 2, "order_quantity": 10, "lead_time": 72.0, "unit_cost": 500.0 },
      { "part_number": "SP-002", "initial_stock": 3, "reorder_point": 1, "order_quantity": 5, "lead_time": 168.0, "unit_cost": 2000.0 }
    ],
    "maintenance_policy": "condition_based"
  }
}
```

---

# 附录

## A. SimPy 概念速查

| SimPy 概念 | 基盘用途 | 说明 |
|-----------|---------|------|
| `simpy.Environment` | SimulationEngine 核心 | 每个 replication 一个独立 env |
| `simpy.Environment(initial_time=T)` | 热启动时间偏移 | B9 warm-start |
| `env.process(generator)` | 注册进程 | 到达、worker、故障、班次、快照 |
| `env.timeout(duration)` | 时间推进 | 到达间隔、服务时间、维修时间 |
| `env.run(until=T)` | 运行仿真 | 主循环 |
| `simpy.Resource(capacity=N)` | ResourcePool | 自动 FIFO 排队 |
| `simpy.PreemptiveResource` | 可抢占 ResourcePool | 故障场景 |
| `simpy.Store(capacity=N)` | BufferedQueue | put 满时阻塞 = blocking |
| `simpy.Store(capacity=inf)` | 无限缓冲 | 向后兼容 |
| `process.interrupt()` | FailureInjector | 中断 worker |
| `simpy.Interrupt` | 中断异常 | try/except 处理 |
| `resource._capacity = N` | ShiftController | 运行时调整容量 |

## B. 通用 KPI 汇总

| KPI | 含义 | 单位 | 层级 |
|-----|------|------|------|
| `throughput` | 系统产出量 | 件/时间单位 | 基盘 |
| `avg_cycle_time` | 平均周期时间 | 时间单位 | 基盘 |
| `utilization` | 资源利用率 | [0,1] | 基盘 |
| `availability` | 资源可用率 | [0,1] | 基盘（故障注入） |
| `blocking_rate` | 阻塞率 | [0,1] | 基盘（Blocking） |
| `starvation_rate` | 饥饿率 | [0,1] | 基盘（Blocking） |
| `avg_queue_length` | 平均队列长度 | 件 | 基盘 |
| `max_queue_length` | 最大队列长度 | 件 | 基盘 |

模块专属 KPI 在各模块 `kpis.py` 中定义（如 TrafficOps 的 `avg_wait_immigration`）。

## C. 错误码

| HTTP 状态码 | 错误码 | 说明 |
|------------|--------|------|
| 400 | `UNKNOWN_SCENE_TYPE` | scene_type 未注册 |
| 400 | `INVALID_SEED` | seed 值超出范围 |
| 400 | `INVALID_REPLICATIONS` | replications 超出 [1, 1000] |
| 400 | `INVALID_SHIFT_SCHEDULE` | 班次时间表未覆盖 24 小时 |
| 400 | `INVALID_BUFFER_CAPACITY` | buffer_capacity < 0 |
| 400 | `MISSING_MTBF` | failure.enabled=true 但未提供 mtbf |
| 400 | `INVALID_WARM_START` | 初始状态结构不合法 |
| 400 | `INVALID_MODULE_CONFIG` | 模块专属配置校验失败 |
| 502 | `SENSOR_UNREACHABLE` | 传感器 API 不可达 |
| 504 | `SIMULATION_TIMEOUT` | 仿真运行超时 |

## D. 依赖清单

```
simpy>=4.0.0
numpy>=1.24.0
scipy>=1.10.0
```

---

> **文档结束** — 如有疑问请联系 AI Engineering Team
