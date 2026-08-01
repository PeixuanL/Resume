# 技术规格：DES引擎增强（Phase 1）

> Spec: DES Engine Enhancement for ICA Requirements
> 
> Version: 1.0 | Date: 2026-02-16 | Author: AzureBot
> 
> 对应 PRD Phase 1（W1-W4），满足 ICA 5.2 全部要求

---

## 1. 概述

当前 DES 引擎基于 SimPy，支持 3 个模块（TrafficOps/HeatOps/FMS）的线性检查站链仿真。ICA 要求更通用的 DES 能力：

- **多实体类型**（Parts, Batches, Carriers, Operators, Machines, Buffers, Transporters）
- **DAG路由**（替代路径、返工回路、批处理/解批）
- **可配置调度策略**（FIFO/LIFO/SPT/EDD/SO）
- **统一故障模型**（MTBF/MTTR，跨模块复用）
- **分布拟合**（从历史数据自动拟合处理时间分布）

---

## 2. 架构设计

### 2.1 基盤层增强（`ai-engine/core/des/`）

```
core/des/
├── engine.py              # SimulationEngine（已有，不变）
├── entities.py            # BaseEntity（已有）→ 增加实体类型注册
├── processes.py           # BaseProcess/ResourceProcess（已有）→ 增加故障+调度
├── scene.py               # BaseScene/SceneConfig（已有，不变）
├── playback.py            # PlaybackCollector（已有，不变）
│
├── routing/               # [新建] DAG路由引擎
│   ├── __init__.py
│   ├── graph.py           # RouteGraph — 有向图定义
│   ├── policies.py        # 路由决策策略（概率/条件/最短队列）
│   └── batch.py           # BatchProcess — 批处理/解批
│
├── dispatching/           # [新建] 调度策略
│   ├── __init__.py
│   └── policies.py        # FIFO/LIFO/SPT/EDD/SO/Custom
│
├── reliability/           # [新建] 统一故障模型
│   ├── __init__.py
│   └── failure_model.py   # MTBF/MTTR随机故障，可挂载到任意Process
│
└── fitting/               # [新建] 分布拟合
    ├── __init__.py
    └── dist_fitter.py     # 从数据自动拟合最佳分布
```

### 2.2 模块层扩展（`ai-engine/modules/trafficops/`）

```
modules/trafficops/
├── processes.py           # CheckpointProcess → 增加故障+调度策略支持
├── scenes.py              # CheckpointScene → 支持DAG路由
├── kpis.py                # → 增加Sankey数据输出
└── entities.py            # [新建] 多实体类型定义
```

---

## 3. 详细设计

### 3.1 多实体类型系统

#### 3.1.1 实体类型注册

当前 `BaseEntity` 只有 `entity_type: str` 字段。扩展为类型化实体系统：

```python
# core/des/entities.py

from dataclasses import dataclass, field
from typing import Dict, Any, Optional
from enum import Enum

class EntityCategory(Enum):
    """ICA要求的核心实体类别"""
    PART = "part"              # 零件/旅客
    BATCH = "batch"            # 批次（一组Part）
    CARRIER = "carrier"        # 载具（AGV/传送带上的托盘）
    OPERATOR = "operator"      # 操作员
    MACHINE = "machine"        # 设备/机器
    BUFFER = "buffer"          # 缓冲区
    TRANSPORTER = "transporter" # 运输工具（AGV/叉车）

@dataclass
class EntityType:
    """实体类型定义"""
    name: str
    category: EntityCategory
    default_attributes: Dict[str, Any] = field(default_factory=dict)
    # 处理时间分布参数
    processing_distribution: Optional[Dict] = None
    # 优先级权重（用于调度）
    priority_weight: float = 1.0
    # 批处理属性
    batch_size: Optional[int] = None  # 仅BATCH类别

class EntityTypeRegistry:
    """实体类型注册表"""
    _types: Dict[str, EntityType] = {}

    @classmethod
    def register(cls, entity_type: EntityType):
        cls._types[entity_type.name] = entity_type

    @classmethod
    def get(cls, name: str) -> EntityType:
        return cls._types.get(name)

    @classmethod
    def list_types(cls) -> list:
        return list(cls._types.keys())

# 预注册ICA场景实体
EntityTypeRegistry.register(EntityType(
    name="passenger",
    category=EntityCategory.PART,
    default_attributes={"source": "background"},
))
EntityTypeRegistry.register(EntityType(
    name="vehicle",
    category=EntityCategory.PART,
    default_attributes={"type": "car", "occupants": 1},
))
EntityTypeRegistry.register(EntityType(
    name="bus_batch",
    category=EntityCategory.BATCH,
    batch_size=45,
    default_attributes={"source": "bus"},
))
```

#### 3.1.2 增强 BaseEntity

```python
@dataclass
class BaseEntity:
    entity_id: int
    entity_type: str
    category: EntityCategory = EntityCategory.PART
    creation_time: float = 0.0
    departure_time: Optional[float] = None
    attributes: Dict[str, Any] = field(default_factory=dict)

    # 调度相关
    priority: float = 0.0          # 用于优先级调度
    due_time: Optional[float] = None  # 用于EDD调度
    processing_time_estimate: float = 0.0  # 用于SPT调度

    # 路由追踪
    route_history: list = field(default_factory=list)  # [(process_id, enter_time, exit_time)]
    current_route_node: Optional[str] = None

    @property
    def cycle_time(self) -> Optional[float]:
        if self.departure_time is None:
            return None
        return self.departure_time - self.creation_time

    def record_visit(self, process_id: str, enter_time: float, exit_time: float):
        """记录实体经过的每个工序，用于Sankey图和瓶颈分析"""
        self.route_history.append({
            "process_id": process_id,
            "enter_time": enter_time,
            "exit_time": exit_time,
            "wait_time": 0.0,  # 由Process填充
            "service_time": exit_time - enter_time,
        })
```

---

### 3.2 DAG路由引擎

#### 3.2.1 设计理念

ICA设施的流程不是简单的线性链。例如：
- 旅客可能走自动通道（快）或人工通道（慢）→ **替代路径**
- 被标记的旅客需要二次检查 → **返工回路**
- 大巴旅客先聚集再分批处理 → **批处理**

用有向无环图（DAG，允许有标注的回边作为返工）表示流程拓扑：

```
                    ┌──────────────┐
                    │ Auto-Gate    │──────┐
  ┌─────────┐ ──▶  │ (biometric)  │      │    ┌──────────┐
  │ Arrival │      └──────────────┘      ├──▶ │ Approval │──▶ Exit
  │         │ ──▶  ┌──────────────┐      │    │ Counter  │
  └─────────┘      │ Manual-Gate  │──────┘    └──────────┘
                   │ (officer)    │                │
                   └──────────────┘                │ (5% flagged)
                                                   ▼
                                            ┌──────────────┐
                                            │ Secondary    │
                                            │ Inspection   │──▶ Exit
                                            └──────────────┘
```

#### 3.2.2 RouteGraph

```python
# core/des/routing/graph.py

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable
from enum import Enum

class RouteDecision(Enum):
    """路由决策类型"""
    PROBABILITY = "probability"      # 按概率分配
    CONDITION = "condition"          # 按条件判断
    SHORTEST_QUEUE = "shortest_queue" # 最短队列
    ROUND_ROBIN = "round_robin"      # 轮流
    CUSTOM = "custom"                # 自定义函数

@dataclass
class RouteEdge:
    """路由图中的边"""
    from_node: str
    to_node: str
    probability: float = 1.0          # 概率路由时的权重
    condition: Optional[str] = None   # 条件表达式（如 "entity.attributes['flagged'] == True"）
    is_rework: bool = False           # 是否为返工回边

@dataclass
class RouteNode:
    """路由图中的节点"""
    node_id: str
    process_id: str                   # 对应的DES Process
    outgoing_edges: List[RouteEdge] = field(default_factory=list)
    decision_type: RouteDecision = RouteDecision.PROBABILITY
    is_entry: bool = False
    is_exit: bool = False

class RouteGraph:
    """有向路由图"""

    def __init__(self):
        self._nodes: Dict[str, RouteNode] = {}
        self._entry_nodes: List[str] = []
        self._exit_nodes: List[str] = []

    def add_node(self, node: RouteNode):
        self._nodes[node.node_id] = node
        if node.is_entry:
            self._entry_nodes.append(node.node_id)
        if node.is_exit:
            self._exit_nodes.append(node.node_id)

    def add_edge(self, edge: RouteEdge):
        node = self._nodes.get(edge.from_node)
        if node:
            node.outgoing_edges.append(edge)

    def get_next_node(self, current_node_id: str, entity, processes: dict, rng) -> Optional[str]:
        """根据决策策略选择下一个节点"""
        node = self._nodes[current_node_id]
        edges = node.outgoing_edges

        if not edges:
            return None  # 终点

        if node.decision_type == RouteDecision.PROBABILITY:
            return self._probability_route(edges, rng)
        elif node.decision_type == RouteDecision.CONDITION:
            return self._condition_route(edges, entity)
        elif node.decision_type == RouteDecision.SHORTEST_QUEUE:
            return self._shortest_queue_route(edges, processes)
        elif node.decision_type == RouteDecision.ROUND_ROBIN:
            return self._round_robin_route(node, edges)
        else:
            # 默认取第一条边
            return edges[0].to_node

    def _probability_route(self, edges: List[RouteEdge], rng) -> str:
        """按概率权重随机选择"""
        probs = [e.probability for e in edges]
        total = sum(probs)
        normalized = [p / total for p in probs]
        idx = rng.choice(len(edges), p=normalized)
        return edges[idx].to_node

    def _condition_route(self, edges: List[RouteEdge], entity) -> str:
        """按条件表达式评估"""
        for edge in edges:
            if edge.condition:
                # 安全评估条件
                try:
                    if eval(edge.condition, {"entity": entity, "__builtins__": {}}):
                        return edge.to_node
                except Exception:
                    continue
        # 无条件匹配时走第一条默认边
        return edges[0].to_node

    def _shortest_queue_route(self, edges: List[RouteEdge], processes: dict) -> str:
        """选择当前队列最短的节点"""
        min_queue = float('inf')
        best = edges[0].to_node
        for edge in edges:
            proc = processes.get(edge.to_node)
            if proc and hasattr(proc, 'queue_length'):
                if proc.queue_length < min_queue:
                    min_queue = proc.queue_length
                    best = edge.to_node
        return best

    def _round_robin_route(self, node: RouteNode, edges: List[RouteEdge]) -> str:
        """轮流分配"""
        if not hasattr(node, '_rr_counter'):
            node._rr_counter = 0
        idx = node._rr_counter % len(edges)
        node._rr_counter += 1
        return edges[idx].to_node

    def to_dict(self) -> dict:
        """序列化为dict（用于前端渲染和API传输）"""
        return {
            "nodes": [
                {
                    "id": n.node_id,
                    "process_id": n.process_id,
                    "decision_type": n.decision_type.value,
                    "is_entry": n.is_entry,
                    "is_exit": n.is_exit,
                }
                for n in self._nodes.values()
            ],
            "edges": [
                {
                    "from": e.from_node,
                    "to": e.to_node,
                    "probability": e.probability,
                    "condition": e.condition,
                    "is_rework": e.is_rework,
                }
                for n in self._nodes.values()
                for e in n.outgoing_edges
            ],
        }

    @classmethod
    def from_dict(cls, data: dict) -> "RouteGraph":
        """从dict反序列化"""
        graph = cls()
        for nd in data["nodes"]:
            graph.add_node(RouteNode(
                node_id=nd["id"],
                process_id=nd["process_id"],
                decision_type=RouteDecision(nd.get("decision_type", "probability")),
                is_entry=nd.get("is_entry", False),
                is_exit=nd.get("is_exit", False),
            ))
        for ed in data["edges"]:
            graph.add_edge(RouteEdge(
                from_node=ed["from"],
                to_node=ed["to"],
                probability=ed.get("probability", 1.0),
                condition=ed.get("condition"),
                is_rework=ed.get("is_rework", False),
            ))
        return graph
```

#### 3.2.3 批处理/解批

```python
# core/des/routing/batch.py

import simpy
from typing import List
from core.des.entities import BaseEntity

class BatchProcess:
    """批处理：收集N个实体后一起释放"""

    def __init__(self, process_id: str, batch_size: int, timeout: float = None):
        self.process_id = process_id
        self.batch_size = batch_size
        self.timeout = timeout  # 最大等待时间（秒），None=无限等待
        self._buffer: List[BaseEntity] = []
        self._batch_count = 0

    def setup(self, env: simpy.Environment):
        self.env = env
        self._batch_ready = simpy.Event(env)

    def add_entity(self, entity: BaseEntity):
        """添加实体到批次缓冲"""
        self._buffer.append(entity)
        if len(self._buffer) >= self.batch_size:
            self._batch_ready.succeed()
            self._batch_ready = simpy.Event(self.env)

    def wait_for_batch(self):
        """等待批次满或超时"""
        if self.timeout:
            result = yield self.env.timeout(self.timeout) | self._batch_ready
        else:
            yield self._batch_ready

        batch = self._buffer[:self.batch_size]
        self._buffer = self._buffer[self.batch_size:]
        self._batch_count += 1
        return batch


class UnbatchProcess:
    """解批：将批次拆分为单个实体"""

    def __init__(self, process_id: str, inter_release_time: float = 0.0):
        self.process_id = process_id
        self.inter_release_time = inter_release_time

    def unbatch(self, env: simpy.Environment, batch_entity: BaseEntity):
        """将batch实体拆分为子实体序列"""
        sub_entities = batch_entity.attributes.get("sub_entities", [])
        for entity in sub_entities:
            if self.inter_release_time > 0:
                yield env.timeout(self.inter_release_time)
            yield entity
```

---

### 3.3 调度策略

```python
# core/des/dispatching/policies.py

from abc import ABC, abstractmethod
from typing import List
from core.des.entities import BaseEntity

class DispatchPolicy(ABC):
    """调度策略基类"""

    @abstractmethod
    def select(self, queue: List[BaseEntity], current_time: float) -> BaseEntity:
        """从队列中选择下一个服务的实体"""
        pass

class FIFOPolicy(DispatchPolicy):
    """先进先出（默认）"""
    def select(self, queue: List[BaseEntity], current_time: float) -> BaseEntity:
        return queue[0]

class LIFOPolicy(DispatchPolicy):
    """后进先出"""
    def select(self, queue: List[BaseEntity], current_time: float) -> BaseEntity:
        return queue[-1]

class SPTPolicy(DispatchPolicy):
    """最短处理时间优先（Shortest Processing Time）"""
    def select(self, queue: List[BaseEntity], current_time: float) -> BaseEntity:
        return min(queue, key=lambda e: e.processing_time_estimate)

class EDDPolicy(DispatchPolicy):
    """最早交期优先（Earliest Due Date）"""
    def select(self, queue: List[BaseEntity], current_time: float) -> BaseEntity:
        return min(queue, key=lambda e: e.due_time or float('inf'))

class SOPolicy(DispatchPolicy):
    """最小松弛优先（Slack per Operation）"""
    def select(self, queue: List[BaseEntity], current_time: float) -> BaseEntity:
        def slack(e: BaseEntity) -> float:
            if e.due_time is None:
                return float('inf')
            remaining = e.due_time - current_time
            return remaining - e.processing_time_estimate
        return min(queue, key=slack)

class PriorityPolicy(DispatchPolicy):
    """优先级调度"""
    def select(self, queue: List[BaseEntity], current_time: float) -> BaseEntity:
        return max(queue, key=lambda e: e.priority)

# 注册表
DISPATCH_POLICIES = {
    "fifo": FIFOPolicy,
    "lifo": LIFOPolicy,
    "spt": SPTPolicy,
    "edd": EDDPolicy,
    "so": SOPolicy,
    "priority": PriorityPolicy,
}

def get_dispatch_policy(name: str) -> DispatchPolicy:
    cls = DISPATCH_POLICIES.get(name.lower(), FIFOPolicy)
    return cls()
```

---

### 3.4 统一故障模型

```python
# core/des/reliability/failure_model.py

import simpy
import numpy as np
from dataclasses import dataclass
from typing import Optional

@dataclass
class FailureConfig:
    """故障配置"""
    mtbf: float                # Mean Time Between Failures（分钟）
    mttr: float                # Mean Time To Repair（分钟）
    distribution: str = "exponential"  # mtbf分布类型
    repair_distribution: str = "lognormal"  # mttr分布类型
    # Weibull参数（当distribution='weibull'时）
    weibull_shape: float = 1.0
    weibull_scale: Optional[float] = None  # None时从mtbf计算

class FailureModel:
    """
    可挂载到任意ResourceProcess的故障模型。
    
    工作方式：
    1. 设备正常运行一段时间（TTF = Time To Failure）
    2. 发生故障 → 设备不可用
    3. 维修一段时间（TTR = Time To Repair）
    4. 恢复正常 → 回到步骤1
    
    挂载方式：
        process.attach_failure_model(FailureModel(config, rng))
    """

    def __init__(self, config: FailureConfig, rng: np.random.RandomState):
        self.config = config
        self.rng = rng
        self.total_downtime = 0.0
        self.failure_count = 0
        self.repair_times: list = []
        self._resource: Optional[simpy.Resource] = None

    def _sample_ttf(self) -> float:
        """采样下次故障时间"""
        if self.config.distribution == "weibull":
            shape = self.config.weibull_shape
            scale = self.config.weibull_scale or self.config.mtbf
            return self.rng.weibull(shape) * scale
        elif self.config.distribution == "exponential":
            return self.rng.exponential(self.config.mtbf)
        else:
            return self.config.mtbf  # 确定性

    def _sample_ttr(self) -> float:
        """采样维修时间"""
        if self.config.repair_distribution == "lognormal":
            # lognormal的均值=mttr，适度变异
            sigma = 0.5
            mu = np.log(self.config.mttr) - sigma**2 / 2
            return self.rng.lognormal(mu, sigma)
        elif self.config.repair_distribution == "exponential":
            return self.rng.exponential(self.config.mttr)
        else:
            return self.config.mttr

    def run(self, env: simpy.Environment, resource: simpy.PreemptiveResource):
        """
        故障生成器进程。
        使用PreemptiveResource以便故障可以抢占正在服务的实体。
        """
        self._resource = resource
        while True:
            # 正常运行
            ttf = self._sample_ttf()
            yield env.timeout(ttf)

            # 故障发生！抢占资源
            self.failure_count += 1
            start = env.now

            # 占用所有资源容量（模拟全站故障）
            reqs = []
            for _ in range(resource.capacity):
                req = resource.request(priority=-1)  # 高优先级抢占
                reqs.append(req)
                yield req

            # 维修
            ttr = self._sample_ttr()
            yield env.timeout(ttr)

            # 修复完成，释放资源
            for req in reqs:
                resource.release(req)

            self.total_downtime += env.now - start
            self.repair_times.append(env.now - start)

    def get_stats(self) -> dict:
        return {
            "failure_count": self.failure_count,
            "total_downtime": self.total_downtime,
            "avg_repair_time": np.mean(self.repair_times) if self.repair_times else 0,
            "availability": 1 - (self.total_downtime / max(1, self.total_downtime + sum(self.repair_times))),
        }
```

---

### 3.5 分布拟合

```python
# core/des/fitting/dist_fitter.py

import numpy as np
from scipy import stats
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass

@dataclass
class FitResult:
    """分布拟合结果"""
    distribution: str        # 分布名称
    params: tuple            # scipy分布参数
    ks_statistic: float      # KS检验统计量
    p_value: float           # KS检验p值
    aic: float               # AIC
    mean: float              # 拟合分布的均值
    std: float               # 拟合分布的标准差

    def to_dict(self) -> dict:
        return {
            "distribution": self.distribution,
            "params": list(self.params),
            "ks_statistic": self.ks_statistic,
            "p_value": self.p_value,
            "aic": self.aic,
            "mean": self.mean,
            "std": self.std,
        }

# 候选分布族
CANDIDATE_DISTRIBUTIONS = [
    "expon",       # 指数分布（无记忆，常用于到达间隔）
    "norm",        # 正态分布（对称，常用于加工时间）
    "lognorm",     # 对数正态分布（右偏，常用于维修时间）
    "weibull_min", # Weibull分布（可靠性分析标配）
    "gamma",       # Gamma分布（灵活的正偏态）
    "uniform",     # 均匀分布（无信息先验）
    "triang",      # 三角分布（PERT估计）
]

class DistributionFitter:
    """
    从历史数据自动拟合最佳概率分布。
    
    使用场景：
    1. 上传历史处理时间数据（CSV/API）
    2. 自动拟合7种候选分布
    3. 按AIC排序，返回最佳拟合
    4. 拟合结果直接用于DES参数配置
    
    用法：
        fitter = DistributionFitter()
        results = fitter.fit(data)
        best = results[0]
        print(f"最佳分布: {best.distribution}, 参数: {best.params}")
    """

    def __init__(self, candidates: List[str] = None):
        self.candidates = candidates or CANDIDATE_DISTRIBUTIONS

    def fit(self, data: np.ndarray, min_samples: int = 30) -> List[FitResult]:
        """
        对数据拟合所有候选分布，按AIC排序返回。
        
        Args:
            data: 观测数据数组
            min_samples: 最少样本数（太少则拟合不可靠）
        
        Returns:
            按AIC升序排列的FitResult列表
        """
        if len(data) < min_samples:
            raise ValueError(f"需要至少{min_samples}个样本，当前{len(data)}个")

        # 过滤非正数据（某些分布要求正值）
        positive_data = data[data > 0]
        if len(positive_data) < min_samples:
            raise ValueError("正值样本不足")

        results = []
        for dist_name in self.candidates:
            try:
                result = self._fit_single(dist_name, positive_data)
                if result:
                    results.append(result)
            except Exception:
                continue

        results.sort(key=lambda r: r.aic)
        return results

    def _fit_single(self, dist_name: str, data: np.ndarray) -> Optional[FitResult]:
        """拟合单个分布"""
        dist = getattr(stats, dist_name)
        params = dist.fit(data)

        # KS检验
        ks_stat, p_value = stats.kstest(data, dist_name, args=params)

        # AIC = 2k - 2ln(L)
        log_likelihood = np.sum(dist.logpdf(data, *params))
        k = len(params)
        aic = 2 * k - 2 * log_likelihood

        # 计算拟合分布的矩
        mean = dist.mean(*params)
        std = dist.std(*params)

        return FitResult(
            distribution=dist_name,
            params=params,
            ks_statistic=ks_stat,
            p_value=p_value,
            aic=aic,
            mean=float(mean),
            std=float(std),
        )

    def recommend(self, data: np.ndarray) -> FitResult:
        """返回最佳拟合分布"""
        results = self.fit(data)
        return results[0]

    def sample(self, fit_result: FitResult, size: int = 1, rng: np.random.RandomState = None) -> np.ndarray:
        """从拟合分布采样"""
        dist = getattr(stats, fit_result.distribution)
        if rng:
            return dist.rvs(*fit_result.params, size=size, random_state=rng)
        return dist.rvs(*fit_result.params, size=size)
```

---

### 3.6 增强 ResourceProcess（调度 + 故障）

```python
# 对 core/des/processes.py 的增强（伪代码，展示关键变更）

class ResourceProcess(BaseProcess):
    def __init__(self, process_id, capacity, mean_service_time, 
                 dispatch_policy="fifo", failure_config=None, ...):
        super().__init__(process_id)
        self.dispatch_policy = get_dispatch_policy(dispatch_policy)
        self.failure_config = failure_config
        self._failure_model = None
        self._waiting_queue: List[BaseEntity] = []

    def setup(self, env, engine):
        super().setup(env, engine)
        # 如果有故障模型，使用PreemptiveResource
        if self.failure_config:
            self.resource = simpy.PreemptiveResource(env, capacity=self.capacity)
            self._failure_model = FailureModel(self.failure_config, engine.get_rng(99))
            env.process(self._failure_model.run(env, self.resource))
        else:
            self.resource = simpy.Resource(env, capacity=self.capacity)

    def run(self, env, entity):
        """处理实体（带调度策略）"""
        enter_time = env.now
        self._waiting_queue.append(entity)

        with self.resource.request() as req:
            yield req
            # 调度：从等待队列中选择（而不是FIFO默认）
            selected = self.dispatch_policy.select(self._waiting_queue, env.now)
            self._waiting_queue.remove(selected)

            wait_time = env.now - enter_time
            service_time = self._sample_service_time()
            yield env.timeout(service_time)

            # 记录访问
            selected.record_visit(self.process_id, enter_time, env.now)
            self.wait_times.append(wait_time)
            self.served_count += 1

    @property
    def queue_length(self) -> int:
        """当前队列长度（用于最短队列路由）"""
        return len(self._waiting_queue)

    def collect_kpis(self) -> dict:
        base = super().collect_kpis()
        if self._failure_model:
            base["reliability"] = self._failure_model.get_stats()
        return base
```

---

### 3.7 Sankey数据输出

```python
# 增加到 kpis.py

def compute_sankey_data(completed: List[BaseEntity]) -> dict:
    """
    从实体的route_history生成Sankey流量图数据。
    
    输出格式（ECharts Sankey兼容）：
    {
        "nodes": [{"name": "document-check"}, ...],
        "links": [{"source": "document-check", "target": "biometric-scan", "value": 350}, ...]
    }
    """
    flow_counts = {}  # (from, to) -> count
    nodes = set()

    for entity in completed:
        history = entity.route_history
        for i in range(len(history) - 1):
            src = history[i]["process_id"]
            dst = history[i + 1]["process_id"]
            nodes.add(src)
            nodes.add(dst)
            key = (src, dst)
            flow_counts[key] = flow_counts.get(key, 0) + 1

    return {
        "nodes": [{"name": n} for n in sorted(nodes)],
        "links": [
            {"source": src, "target": dst, "value": count}
            for (src, dst), count in flow_counts.items()
        ],
    }
```

---

## 4. API设计

### 4.1 新增/增强API端点

```yaml
# Distribution Fitting
POST /ai/des/fit-distribution:
  description: 从数据拟合最佳概率分布
  body:
    data: [1.2, 3.4, 2.1, ...]  # 观测值数组
    candidates: ["expon", "lognorm", "weibull_min"]  # 可选，候选分布
  response:
    results:
      - distribution: "lognorm"
        params: [0.5, 0, 2.1]
        ks_statistic: 0.05
        p_value: 0.87
        aic: 234.5
        mean: 2.3
        std: 1.2

# Route Graph Definition（DES场景配置扩展）
POST /ai/des/run:
  body:
    sceneType: "trafficops"
    sceneId: "cp-immigration-dag"
    simulationTime: 480
    moduleConfig:
      routing:  # 新增：DAG路由定义
        nodes:
          - {id: "entry", processId: "arrival", isEntry: true}
          - {id: "auto-gate", processId: "auto-biometric"}
          - {id: "manual-gate", processId: "manual-check"}
          - {id: "approval", processId: "approval-counter", isExit: true}
          - {id: "secondary", processId: "secondary-inspection", isExit: true}
        edges:
          - {from: "entry", to: "auto-gate", probability: 0.7}
          - {from: "entry", to: "manual-gate", probability: 0.3}
          - {from: "auto-gate", to: "approval"}
          - {from: "manual-gate", to: "approval"}
          - {from: "approval", to: "secondary", probability: 0.05, condition: "entity.attributes.get('flagged')"}
      dispatching: "spt"  # 新增：调度策略
      failures:  # 新增：故障模型
        auto-biometric:
          mtbf: 120
          mttr: 15
          distribution: "exponential"

# Sankey Data（仿真结果增强）
# 在 /ai/des/run 的response中自动包含
response:
  results:
    throughput: 450
    sankey:
      nodes: [{name: "document-check"}, ...]
      links: [{source: "document-check", target: "biometric-scan", value: 350}, ...]
    bottleneck_heatmap:
      processes:
        - {id: "document-check", avg_wait: 2.3, utilization: 0.85, color_intensity: 0.85}
        - {id: "biometric-scan", avg_wait: 5.1, utilization: 0.95, color_intensity: 0.95}
```

---

## 5. 前端组件

### 5.1 新增组件

| 组件 | 路径 | 说明 |
|------|------|------|
| `SankeyChart.vue` | `components/reporting/charts/` | ECharts Sankey流量图 |
| `BottleneckHeatmap.vue` | `components/reporting/charts/` | 瓶颈热力图（2D叠加） |
| `DistFittingPanel.vue` | `views/advisor/` | 分布拟合交互面板 |
| `RouteGraphEditor.vue` | `components/des/` | DAG路由可视化编辑器（Phase 2） |
| `DispatchPolicySelector.vue` | `components/des/` | 调度策略选择器 |

### 5.2 Sankey图集成

在 `SimRunDetailView.vue` 中增加 Sankey tab：
- 显示实体在各检查站间的流转
- 边的粗细代表流量
- 悬停显示 avg_wait_time

### 5.3 瓶颈热力图集成

在 DigitalTwinView 的 3D 场景中：
- 覆盖层按 utilization 着色（绿→黄→红）
- 可切换：密度热力图 / 等待时间热力图 / 利用率热力图

---

## 6. 数据模型变更

### 6.1 数据库迁移

无新表。DES配置（包括路由图、调度策略、故障参数）全部存储在 `module_config` JSON中，通过DES API传入。

### 6.2 场景配置扩展

`module_config` 新增字段：
```json
{
  "routing": { ... },        // DAG路由图定义
  "dispatching": "fifo",     // 调度策略名
  "failures": { ... },       // 各Process的故障配置
  "entity_types": [ ... ]    // 自定义实体类型
}
```

---

## 7. 测试策略

| 层级 | 测试内容 | 目标 |
|------|----------|------|
| 单元测试 | RouteGraph路由决策、DispatchPolicy选择、DistFitter拟合精度 | 100%覆盖 |
| 集成测试 | DAG场景端到端仿真（多路径+返工+故障） | 3个ICA场景 |
| 回归测试 | 现有3个模块（TrafficOps/HeatOps/FMS）不受影响 | 全部现有测试通过 |
| 性能测试 | 2000实体+10个节点DAG+故障，480min仿真 | < 5秒 |
| 统计验证 | 分布拟合：已知分布采样→拟合→参数误差<5% | 7种分布 |

---

## 8. 向后兼容

**关键原则：所有增强都是增量的，不破坏现有功能。**

| 变更 | 兼容策略 |
|------|----------|
| 多实体类型 | `entity_type="passenger"` 仍然工作，新字段均有默认值 |
| DAG路由 | `routing` 不存在时，使用现有线性链逻辑 |
| 调度策略 | 默认 `"fifo"`，与当前行为一致 |
| 故障模型 | `failures` 不存在时，无故障（与当前一致） |
| Sankey输出 | 仅当 `route_history` 非空时生成 |

---

## 9. 实施计划

```
W1 (Day 1-3): 多实体类型 + DAG路由引擎
  - EntityTypeRegistry + 增强BaseEntity
  - RouteGraph + 3种路由策略
  - BatchProcess / UnbatchProcess
  - 单元测试

W1 (Day 4-5): ICA DAG场景
  - cp-immigration-dag（自动/手工通道+二次检查）
  - cp-security-dag（行李/人身检查分流）
  - 集成测试

W2 (Day 1-3): 调度策略 + 故障模型
  - 6种DispatchPolicy
  - FailureModel（MTBF/MTTR/Weibull）
  - 挂载到ResourceProcess
  - 单元测试

W2 (Day 4-5): 分布拟合
  - DistributionFitter（7种候选分布）
  - API端点 POST /ai/des/fit-distribution
  - 统计验证测试

W3 (Day 1-3): 前端组件
  - SankeyChart.vue
  - BottleneckHeatmap.vue  
  - DistFittingPanel.vue
  - SimRunDetailView增加Sankey tab

W3 (Day 4-5): 3D热力图
  - DigitalTwinView利用率/等待时间着色
  - 密度热力图overlay

W4: 集成 + 场景对比增强
  - SimAnalysisView多场景并排对比
  - 端到端测试（ICA全场景）
  - 部署 + 文档
```

---

## 附录A: ICA Immigration DAG场景定义示例

```json
{
  "sceneType": "trafficops",
  "sceneId": "cp-immigration-dag",
  "simulationTime": 480,
  "replications": 10,
  "seed": 42,
  "moduleConfig": {
    "arrivalRate": 8.0,
    "surgeEvents": [
      {"time": 60, "batchSize": 45, "spreadMinutes": 3, "label": "Tour Bus"},
      {"time": 120, "batchSize": 350, "spreadMinutes": 15, "label": "Flight SQ321"}
    ],
    "routing": {
      "nodes": [
        {"id": "arrival", "processId": "arrival-gate", "isEntry": true, "decisionType": "probability"},
        {"id": "auto-lane", "processId": "auto-biometric", "decisionType": "probability"},
        {"id": "manual-lane", "processId": "manual-check", "decisionType": "probability"},
        {"id": "approval", "processId": "approval-counter", "decisionType": "condition"},
        {"id": "secondary", "processId": "secondary-inspection", "isExit": true},
        {"id": "exit", "processId": "exit-gate", "isExit": true}
      ],
      "edges": [
        {"from": "arrival", "to": "auto-lane", "probability": 0.65},
        {"from": "arrival", "to": "manual-lane", "probability": 0.35},
        {"from": "auto-lane", "to": "approval"},
        {"from": "manual-lane", "to": "approval"},
        {"from": "approval", "to": "exit", "probability": 0.95},
        {"from": "approval", "to": "secondary", "probability": 0.05, "condition": "entity.attributes.get('flagged', False)"}
      ]
    },
    "processes": {
      "arrival-gate": {"capacity": 6, "meanServiceTime": 0.5},
      "auto-biometric": {"capacity": 8, "meanServiceTime": 1.2, "dispatching": "fifo"},
      "manual-check": {"capacity": 4, "meanServiceTime": 3.0, "dispatching": "fifo"},
      "approval-counter": {"capacity": 3, "meanServiceTime": 2.0},
      "secondary-inspection": {"capacity": 2, "meanServiceTime": 8.0},
      "exit-gate": {"capacity": 10, "meanServiceTime": 0.3}
    },
    "failures": {
      "auto-biometric": {"mtbf": 240, "mttr": 20, "distribution": "exponential"}
    }
  }
}
```
