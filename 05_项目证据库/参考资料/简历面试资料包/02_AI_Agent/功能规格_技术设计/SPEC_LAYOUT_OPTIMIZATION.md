# 优化引擎 — 技术规格说明书

> **模块代号**: `optimizer`
> **版本**: v2.1.0
> **创建日期**: 2026-02-11
> **更新**: 2026-04-08
> **作者**: FactVerse AI Team
> **状态**: ✅ 基盘已实现（WebSocket 实时推送待集成）
> **架构**: 基盘 (Platform) + 模块 (Module) 分层

---

## 目录

- [第一部分：基盘 — 优化引擎 (Base Platform)](#第一部分基盘--优化引擎-base-platform)
  - [1. 架构概览](#1-架构概览)
  - [2. 抽象接口](#2-抽象接口)
  - [3. NSGA-II 多目标优化](#3-nsga-ii-多目标优化)
  - [4. 模拟退火 (SA)](#4-模拟退火-sa)
  - [5. 禁忌搜索 (Tabu Search)](#5-禁忌搜索-tabu-search)
  - [6. 混合模式 (Hybrid)](#6-混合模式-hybrid)
  - [7. 决策变量框架](#7-决策变量框架)
  - [8. 约束管理框架](#8-约束管理框架)
  - [9. 优化循环架构](#9-优化循环架构)
  - [10. 元模型预筛选 (Metamodel)](#10-元模型预筛选-metamodel)
  - [11. Pareto 前沿存储与可视化](#11-pareto-前沿存储与可视化)
  - [12. 通用 API](#12-通用-api)
- [第二部分：TrafficOps 模块 — 布局优化](#第二部分trafficops-模块--布局优化)
  - [1. 模块概览](#t1-模块概览)
  - [2. TrafficOps 决策变量](#t2-trafficops-决策变量)
  - [3. TrafficOps 目标函数](#t3-trafficops-目标函数)
  - [4. TrafficOps 约束](#t4-trafficops-约束)
  - [5. DES 适应度评估器](#t5-des-适应度评估器)
  - [6. 结果应用](#t6-结果应用)
- [第三部分：其他模块示例](#第三部分其他模块示例)
- [附录](#附录)

---

# 第一部分：基盘 — 优化引擎 (Base Platform)

**位置**: `ai-engine/core/optimizer/`

基盘提供通用的多目标优化框架，不绑定任何业务场景。任何模块只需实现抽象接口（目标函数、决策变量、约束、评估函数）即可接入优化引擎。

---

## 1. 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                  ai-engine/core/optimizer/                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Abstract Interfaces                      │   │
│  │  BaseObjective  BaseVariable  BaseConstraint              │   │
│  │  EvaluationFunction  BaseEncoder                          │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │               OptimizationLoop (核心循环)                  │   │
│  │                                                           │   │
│  │  candidate → EvaluationFunction(pluggable) → fitness      │   │
│  │          → selection → convergence check                  │   │
│  │                                                           │   │
│  │  ┌─────────┐  ┌─────┐  ┌───────────┐  ┌────────┐       │   │
│  │  │ NSGA-II │  │ SA  │  │Tabu Search│  │ Hybrid │       │   │
│  │  └─────────┘  └─────┘  └───────────┘  └────────┘       │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │           Metamodel Pre-Screener (可选)                    │   │
│  │  XGBoost / GaussianProcess / Ensemble / Adaptive Sampling │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │           Pareto Archive & Decision Support               │   │
│  │  NDSorter / Hypervolume / TOPSIS / Weighted Sum           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Task Manager (任务管理)                          │   │
│  │  创建/启动/暂停/恢复/终止/断点续跑                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
          │
          │  模块通过实现 Abstract Interfaces 接入
          ▼
┌──────────────────────────────────────────────────────────────────┐
│  modules/trafficops/   modules/heatops/   modules/fms/   ...    │
│  (布局优化)             (管网优化)         (维护排程)              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. 抽象接口

所有接口位于 `ai-engine/core/optimizer/interfaces.py`。模块只需实现这些接口即可接入优化引擎。

```python
from abc import ABC, abstractmethod
from enum import Enum
from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field
import numpy as np


# ─── 目标函数接口 ───

class ObjectiveDirection(str, Enum):
    MAXIMIZE = "maximize"
    MINIMIZE = "minimize"

class BaseObjective(ABC):
    """抽象目标函数。每个模块定义自己的目标。"""

    @property
    @abstractmethod
    def name(self) -> str:
        """目标名称，如 'throughput', 'heat_loss'"""

    @property
    @abstractmethod
    def direction(self) -> ObjectiveDirection:
        """优化方向"""

    @property
    def weight(self) -> float:
        """权重（用于加权求和法），默认 1.0"""
        return 1.0

    @abstractmethod
    def extract_value(self, evaluation_result: Dict[str, Any]) -> float:
        """从评估结果中提取该目标的 KPI 值"""

    def normalize(self, value: float, population_values: List[float]) -> float:
        """归一化到 [0,1]，默认 min-max"""
        vmin, vmax = min(population_values), max(population_values)
        if vmax == vmin:
            return 0.5
        return (value - vmin) / (vmax - vmin)


class ObjectiveSet(BaseModel):
    """目标集合配置"""
    mode: str = Field(default="multi", description="single | multi | lexicographic")
    reference_point: Optional[List[float]] = Field(
        default=None, description="Hypervolume 参考点 (多目标模式)"
    )


# ─── 决策变量接口 ───

class VariableType(str, Enum):
    REAL = "real"            # 连续实数
    INTEGER = "integer"      # 整数
    CATEGORICAL = "categorical"  # 类别
    PERMUTATION = "permutation"  # 排列

class BaseVariable(BaseModel):
    """抽象决策变量"""
    name: str = Field(..., description="变量名称")
    var_type: VariableType
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None
    categories: Optional[List[str]] = None
    perm_size: Optional[int] = None
    fixed: bool = False
    fixed_value: Optional[Any] = None
    group: Optional[str] = None
    description: Optional[str] = None


# ─── 约束接口 ───

class ConstraintType(str, Enum):
    HARD = "hard"    # 必须满足，否则不可行
    SOFT = "soft"    # 违反时加惩罚

class BaseConstraint(ABC):
    """抽象约束"""

    @property
    @abstractmethod
    def name(self) -> str:
        """约束名称"""

    @property
    @abstractmethod
    def constraint_type(self) -> ConstraintType:
        """硬约束 or 软约束"""

    @property
    def penalty_coefficient(self) -> float:
        """软约束惩罚系数"""
        return 1.0

    @abstractmethod
    def check(self, decoded_params: Dict[str, Any]) -> bool:
        """检查约束是否满足。True=满足"""

    @abstractmethod
    def compute_violation(self, decoded_params: Dict[str, Any]) -> float:
        """计算违反量（0=满足）。软约束用此值×penalty_coefficient 计算惩罚"""

    def repair(self, decoded_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        约束修复算子（可选）。
        将不可行解修复为可行解。默认不修复。
        """
        return decoded_params


# ─── 评估函数接口 ───

class EvaluationResult(BaseModel):
    """评估结果（由 EvaluationFunction 返回）"""
    kpis: Dict[str, float]         # KPI 字典，如 {"throughput": 120, "wait_time": 3.5}
    metadata: Dict[str, Any] = {}  # 额外信息（仿真日志、快照等）
    success: bool = True
    error_message: Optional[str] = None

class EvaluationFunction(ABC):
    """
    抽象评估函数（适应度评估器）。
    这是模块与优化引擎的核心桥梁。
    模块实现此接口，提供"给定参数 → 评估 KPI"的能力。
    """

    @abstractmethod
    def evaluate(self, params: Dict[str, Any]) -> EvaluationResult:
        """
        评估一组参数，返回 KPI 结果。
        例如 TrafficOps 用 DES 仿真评估，HeatOps 用热力学模型评估。
        """

    @property
    def supports_batch(self) -> bool:
        """是否支持批量评估"""
        return False

    def evaluate_batch(self, params_list: List[Dict[str, Any]]) -> List[EvaluationResult]:
        """批量评估（默认逐个调用）"""
        return [self.evaluate(p) for p in params_list]

    @property
    def n_replications(self) -> int:
        """每组参数的重复评估次数（随机仿真场景）。默认 1（确定性模型）"""
        return 1
```

---

## 3. NSGA-II 多目标优化

NSGA-II (Non-dominated Sorting Genetic Algorithm II) 是核心多目标优化算法，基于 DEAP 库实现。

### 3.1 算法超参数

| 参数 | 默认值 | 范围 | 说明 |
|------|--------|------|------|
| `population_size` | 50 | [20, 200] | 种群大小 |
| `n_generations` | 200 | [50, 1000] | 最大迭代代数 |
| `crossover_prob` | 0.9 | [0.5, 1.0] | 交叉概率 |
| `mutation_prob` | 0.1 | [0.01, 0.5] | 变异概率 |
| `crossover_eta` | 20 | [5, 30] | SBX 分布指数 |
| `mutation_eta` | 20 | [5, 30] | 多项式变异分布指数 |
| `tournament_size` | 2 | [2, 5] | 锦标赛选择大小 |
| `convergence_window` | 20 | [10, 50] | 收敛判断窗口大小 |
| `convergence_threshold` | 0.001 | [1e-5, 0.01] | Hypervolume 变化阈值 |
| `elitism` | True | - | 是否保留精英 |
| `seed` | None | - | 随机种子 |
| `n_parallel_workers` | 4 | [1, 32] | 并行评估 worker 数 |

### 3.2 核心实现

```python
from dataclasses import dataclass, field
from typing import List, Optional, Callable, Dict
import numpy as np
import multiprocessing as mp

@dataclass
class Individual:
    """个体（候选解）"""
    genome: np.ndarray
    fitness_values: Optional[List[float]] = None  # 适应度向量（内部统一最小化）
    decoded_params: Optional[Dict] = None
    rank: int = 0                    # 非支配排序等级
    crowding_distance: float = 0.0   # 拥挤度距离
    feasible: bool = True
    penalty: float = 0.0
    generation: int = 0
    raw_kpis: Optional[Dict] = None

@dataclass
class GAConfig:
    population_size: int = 50
    n_generations: int = 200
    crossover_prob: float = 0.9
    mutation_prob: float = 0.1
    crossover_eta: float = 20.0
    mutation_eta: float = 20.0
    tournament_size: int = 2
    convergence_window: int = 20
    convergence_threshold: float = 0.001
    elitism: bool = True
    seed: Optional[int] = None
    n_parallel_workers: int = 4


class NSGA2Optimizer:
    """
    通用 NSGA-II 多目标优化器。
    通过 EvaluationFunction 接口调用模块提供的评估能力。
    """

    def __init__(
        self,
        config: GAConfig,
        encoder: "MixedIntegerEncoder",         # 基盘提供的通用编码器
        objectives: List[BaseObjective],         # 模块定义的目标
        constraints: List[BaseConstraint],       # 模块定义的约束
        evaluation_fn: EvaluationFunction,       # 模块提供的评估函数
    ):
        self.config = config
        self.encoder = encoder
        self.objectives = objectives
        self.constraints = constraints
        self.evaluation_fn = evaluation_fn
        self.pareto_archive = ParetoArchive()
        self.history = OptimizationHistory()

    def run(self, callback: Optional[Callable] = None) -> "OptimizationResult":
        """NSGA-II 主循环"""
        # 1. 初始化种群
        population = self._initialize_population()

        # 2. 评估初始种群
        population = self._evaluate_population(population)

        # 3. 非支配排序 + 拥挤度
        fronts = self._fast_non_dominated_sort(population)
        self._assign_crowding_distance(fronts)
        self.pareto_archive.update(fronts[0])

        # 4. 迭代进化
        for gen in range(self.config.n_generations):
            # 选择 → 交叉 → 变异 → 约束修复 → 评估
            parents = self._tournament_selection(population)
            offspring = self._crossover(parents)
            offspring = self._mutation(offspring)
            offspring = self._repair(offspring)
            offspring = self._evaluate_population(offspring)

            # 合并 → 非支配排序 → 环境选择
            combined = population + offspring
            fronts = self._fast_non_dominated_sort(combined)
            self._assign_crowding_distance(fronts)
            population = self._environmental_selection(fronts, self.config.population_size)

            # 更新存档 + 收敛检查
            self.pareto_archive.update(fronts[0])
            hv = self.pareto_archive.compute_hypervolume()
            self.history.record_generation(gen, population, hv)

            if callback:
                callback(gen, population, hv)

            if self._check_convergence():
                break

        return OptimizationResult(
            pareto_front=self.pareto_archive.get_solutions(),
            history=self.history,
            converged=self._check_convergence(),
        )

    def _evaluate_population(self, population: List[Individual]) -> List[Individual]:
        """并行评估种群，通过 EvaluationFunction 接口"""
        unevaluated = [ind for ind in population if ind.fitness_values is None]

        for ind in unevaluated:
            ind.decoded_params = self.encoder.decode(ind.genome)

        # 评估（支持并行 & 多副本）
        n_reps = self.evaluation_fn.n_replications
        for ind in unevaluated:
            kpi_results = []
            for _ in range(n_reps):
                result = self.evaluation_fn.evaluate(ind.decoded_params)
                if result.success:
                    kpi_results.append(result.kpis)

            if not kpi_results:
                ind.feasible = False
                ind.fitness_values = [float('inf')] * len(self.objectives)
                continue

            # 聚合多副本 KPI
            aggregated = {}
            for key in kpi_results[0]:
                vals = [r[key] for r in kpi_results]
                aggregated[key] = np.mean(vals)
            ind.raw_kpis = aggregated

            # 提取适应度向量（统一为最小化）
            fitness = []
            for obj in self.objectives:
                val = obj.extract_value(aggregated)
                if obj.direction == ObjectiveDirection.MAXIMIZE:
                    fitness.append(-val)
                else:
                    fitness.append(val)
            ind.fitness_values = fitness

            # 约束检查
            ind.feasible = all(c.check(ind.decoded_params) for c in self.constraints
                              if c.constraint_type == ConstraintType.HARD)
            ind.penalty = sum(
                c.penalty_coefficient * c.compute_violation(ind.decoded_params)
                for c in self.constraints if c.constraint_type == ConstraintType.SOFT
            )

        return population

    def _fast_non_dominated_sort(self, population: List[Individual]) -> List[List[Individual]]:
        """
        快速非支配排序。O(M × N²)，M=目标数，N=种群大小。
        可行性规则：可行解支配不可行解；两者均不可行时惩罚小者优先。
        """
        n = len(population)
        domination_count = [0] * n
        dominated_set = [[] for _ in range(n)]
        fronts = [[]]

        for i in range(n):
            for j in range(i + 1, n):
                if self._dominates(population[i], population[j]):
                    dominated_set[i].append(j)
                    domination_count[j] += 1
                elif self._dominates(population[j], population[i]):
                    dominated_set[j].append(i)
                    domination_count[i] += 1

            if domination_count[i] == 0:
                population[i].rank = 0
                fronts[0].append(population[i])

        current_front = 0
        while fronts[current_front]:
            next_front = []
            for ind_i in fronts[current_front]:
                i = population.index(ind_i)
                for j in dominated_set[i]:
                    domination_count[j] -= 1
                    if domination_count[j] == 0:
                        population[j].rank = current_front + 1
                        next_front.append(population[j])
            current_front += 1
            fronts.append(next_front)

        return [f for f in fronts if f]

    def _dominates(self, a: Individual, b: Individual) -> bool:
        """Pareto 支配判断，含可行性优先规则"""
        if a.feasible and not b.feasible:
            return True
        if not a.feasible and b.feasible:
            return False
        if not a.feasible and not b.feasible:
            return a.penalty < b.penalty
        a_vals = np.array(a.fitness_values)
        b_vals = np.array(b.fitness_values)
        return bool(np.all(a_vals <= b_vals) and np.any(a_vals < b_vals))

    def _assign_crowding_distance(self, fronts: List[List[Individual]]):
        """拥挤度距离计算"""
        for front in fronts:
            n = len(front)
            if n <= 2:
                for ind in front:
                    ind.crowding_distance = float("inf")
                continue
            for ind in front:
                ind.crowding_distance = 0.0
            n_obj = len(front[0].fitness_values)
            for m in range(n_obj):
                front.sort(key=lambda ind: ind.fitness_values[m])
                front[0].crowding_distance = float("inf")
                front[-1].crowding_distance = float("inf")
                f_range = front[-1].fitness_values[m] - front[0].fitness_values[m]
                if f_range == 0:
                    continue
                for i in range(1, n - 1):
                    front[i].crowding_distance += (
                        (front[i + 1].fitness_values[m] - front[i - 1].fitness_values[m]) / f_range
                    )

    def _tournament_selection(self, population: List[Individual]) -> List[Individual]:
        """锦标赛选择 + 拥挤度比较"""
        selected = []
        n = len(population)
        for _ in range(n):
            candidates = np.random.choice(n, self.config.tournament_size, replace=False)
            best = candidates[0]
            for c in candidates[1:]:
                if (population[c].rank < population[best].rank or
                    (population[c].rank == population[best].rank and
                     population[c].crowding_distance > population[best].crowding_distance)):
                    best = c
            selected.append(Individual(genome=population[best].genome.copy()))
        return selected

    def _crossover(self, parents: List[Individual]) -> List[Individual]:
        """
        混合交叉算子：
        - 实数变量: SBX (Simulated Binary Crossover)
        - 整数/类别变量: Uniform Crossover
        """
        offspring = []
        for i in range(0, len(parents) - 1, 2):
            p1, p2 = parents[i], parents[i + 1]
            if np.random.random() < self.config.crossover_prob:
                c1, c2 = self._sbx_crossover(p1.genome, p2.genome, self.config.crossover_eta)
            else:
                c1, c2 = p1.genome.copy(), p2.genome.copy()
            offspring.append(Individual(genome=c1))
            offspring.append(Individual(genome=c2))
        return offspring

    def _sbx_crossover(self, p1, p2, eta):
        """SBX for real + uniform for integer/categorical"""
        c1, c2 = p1.copy(), p2.copy()
        for name, (start, length, vtype) in self.encoder.gene_map.items():
            if vtype == VariableType.REAL:
                u = np.random.random()
                beta = (2*u)**(1/(eta+1)) if u <= 0.5 else (1/(2*(1-u)))**(1/(eta+1))
                c1[start] = np.clip(0.5*((1+beta)*p1[start]+(1-beta)*p2[start]), 0, 1)
                c2[start] = np.clip(0.5*((1-beta)*p1[start]+(1+beta)*p2[start]), 0, 1)
            elif vtype in (VariableType.INTEGER, VariableType.CATEGORICAL):
                if np.random.random() < 0.5:
                    c1[start:start+length], c2[start:start+length] = \
                        c2[start:start+length].copy(), c1[start:start+length].copy()
        return c1, c2

    def _mutation(self, offspring: List[Individual]) -> List[Individual]:
        """
        混合变异算子：
        - 实数: 多项式变异 (Polynomial Mutation)
        - 整数: 随机重采样
        - 类别: 随机类别重选
        """
        for ind in offspring:
            if np.random.random() >= self.config.mutation_prob:
                continue
            for name, (start, length, vtype) in self.encoder.gene_map.items():
                if np.random.random() >= 1.0 / self.encoder.genome_length:
                    continue
                if vtype == VariableType.REAL:
                    eta = self.config.mutation_eta
                    u = np.random.random()
                    delta = (2*u)**(1/(eta+1))-1 if u < 0.5 else 1-(2*(1-u))**(1/(eta+1))
                    ind.genome[start] = np.clip(ind.genome[start] + delta, 0, 1)
                elif vtype == VariableType.INTEGER:
                    ind.genome[start] = np.random.random()
                elif vtype == VariableType.CATEGORICAL:
                    ind.genome[start:start+length] = 0
                    ind.genome[start + np.random.randint(length)] = 1
        return offspring

    def _repair(self, offspring: List[Individual]) -> List[Individual]:
        """通过模块定义的约束修复算子修复不可行解"""
        for ind in offspring:
            ind.decoded_params = self.encoder.decode(ind.genome)
            for c in self.constraints:
                if c.constraint_type == ConstraintType.HARD:
                    ind.decoded_params = c.repair(ind.decoded_params)
            ind.genome = self.encoder.encode(ind.decoded_params)
        return offspring

    def _environmental_selection(self, fronts, target_size):
        """按等级填充，最后一层按拥挤度截取"""
        selected = []
        for front in fronts:
            if len(selected) + len(front) <= target_size:
                selected.extend(front)
            else:
                remaining = target_size - len(selected)
                front.sort(key=lambda ind: ind.crowding_distance, reverse=True)
                selected.extend(front[:remaining])
                break
        return selected

    def _check_convergence(self) -> bool:
        if len(self.history.hypervolumes) < self.config.convergence_window:
            return False
        recent = self.history.hypervolumes[-self.config.convergence_window:]
        change = abs(recent[-1] - recent[0]) / (abs(recent[0]) + 1e-10)
        return change < self.config.convergence_threshold
```

### 3.3 NSGA-II 伪代码

```
算法: NSGA-II (通用)
输入: 目标函数集 objectives[], 变量集 variables[], 约束集 constraints[],
      评估函数 eval_fn, 超参数 config
输出: Pareto 最优解集 P*

1.  P(0) ← INITIALIZE_POPULATION(config.pop_size, variables)
2.  P(0) ← REPAIR(P(0), constraints)
3.  P(0) ← EVALUATE(P(0), eval_fn, objectives)
4.  FRONTS ← FAST_NON_DOMINATED_SORT(P(0))
5.  ASSIGN_CROWDING_DISTANCE(FRONTS)
6.  ARCHIVE ← FRONTS[0]
7.
8.  FOR gen = 1 TO config.n_generations:
9.      Q ← TOURNAMENT_SELECTION(P(gen-1))
10.     Q ← SBX_CROSSOVER(Q)
11.     Q ← POLYNOMIAL_MUTATION(Q)
12.     Q ← REPAIR(Q, constraints)
13.
14.     IF metamodel.is_trained:
15.         Q ← METAMODEL_SCREEN(Q, top_ratio=0.5)
16.
17.     Q ← EVALUATE(Q, eval_fn, objectives)
18.     R ← P(gen-1) ∪ Q
19.     FRONTS ← FAST_NON_DOMINATED_SORT(R)
20.     ASSIGN_CROWDING_DISTANCE(FRONTS)
21.     P(gen) ← ENVIRONMENTAL_SELECT(FRONTS, config.pop_size)
22.     ARCHIVE ← UPDATE(ARCHIVE, FRONTS[0])
23.     IF CONVERGED(ARCHIVE): BREAK
24.
25. RETURN ARCHIVE as P*
```

### 3.4 性能估算

| 场景规模 | 决策变量 | 种群×代数 | 评估副本 | 总评估次数 | 预估时间 (4 workers, 3s/eval) |
|---------|---------|----------|---------|-----------|-------------------------------|
| 小型 | 30 | 30×100 | 3 | 9,000 | ~15 分钟 |
| 中型 | 80 | 50×200 | 5 | 50,000 | ~2 小时 |
| 大型 | 150 | 80×300 | 5 | 120,000 | ~6 小时 |

> 元模型预筛选可减少 40-60% 的评估调用。

---

## 4. 模拟退火 (SA)

单目标精细化搜索。可在 NSGA-II Pareto 前沿基础上，对某个目标进一步局部优化。

### 4.1 配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `initial_temperature` | 100.0 | 初始温度 |
| `cooling_rate` | 0.95 | 几何冷却系数 |
| `min_temperature` | 0.01 | 终止温度 |
| `iterations_per_temp` | 50 | 每温度步迭代数 |
| `neighborhood_radius` | 0.1 | 邻域搜索半径 |
| `objective_index` | 0 | 优化目标索引 |
| `reheating_enabled` | True | 再加热机制 |
| `reheating_threshold` | 50 | 触发再加热的未改善步数 |

### 4.2 核心实现

```python
import math

@dataclass
class SAConfig:
    initial_temperature: float = 100.0
    cooling_rate: float = 0.95
    min_temperature: float = 0.01
    iterations_per_temp: int = 50
    neighborhood_radius: float = 0.1
    objective_index: int = 0
    reheating_enabled: bool = True
    reheating_threshold: int = 50
    seed: Optional[int] = None


class SimulatedAnnealing:
    """
    通用模拟退火优化器。
    通过 EvaluationFunction 接口评估候选解。
    """

    def __init__(
        self,
        config: SAConfig,
        encoder: "MixedIntegerEncoder",
        objectives: List[BaseObjective],
        constraints: List[BaseConstraint],
        evaluation_fn: EvaluationFunction,
    ):
        self.config = config
        self.encoder = encoder
        self.objectives = objectives
        self.constraints = constraints
        self.evaluation_fn = evaluation_fn

    def run(self, initial_solution: Individual, callback=None) -> Individual:
        current = initial_solution
        best = initial_solution
        T = self.config.initial_temperature
        no_improve = 0
        obj_idx = self.config.objective_index

        while T > self.config.min_temperature:
            for _ in range(self.config.iterations_per_temp):
                # 生成邻域解
                neighbor = self._generate_neighbor(current)

                # 修复 + 评估
                neighbor.decoded_params = self.encoder.decode(neighbor.genome)
                for c in self.constraints:
                    if c.constraint_type == ConstraintType.HARD:
                        neighbor.decoded_params = c.repair(neighbor.decoded_params)
                neighbor.genome = self.encoder.encode(neighbor.decoded_params)

                result = self.evaluation_fn.evaluate(neighbor.decoded_params)
                obj = self.objectives[obj_idx]
                val = obj.extract_value(result.kpis)
                neighbor_energy = -val if obj.direction == ObjectiveDirection.MAXIMIZE else val

                current_energy = current.fitness_values[obj_idx]
                delta = neighbor_energy - current_energy

                if delta < 0:
                    current = neighbor
                    current.fitness_values = [neighbor_energy]  # simplified
                    if neighbor_energy < best.fitness_values[obj_idx]:
                        best = neighbor
                        best.fitness_values = [neighbor_energy]
                        no_improve = 0
                elif np.random.random() < math.exp(-delta / T):
                    current = neighbor
                    current.fitness_values = [neighbor_energy]

                no_improve += 1
                if callback:
                    callback(T, current, best)

            T *= self.config.cooling_rate

            # 再加热
            if self.config.reheating_enabled and no_improve >= self.config.reheating_threshold:
                T = min(T * 5, self.config.initial_temperature * 0.5)
                no_improve = 0

        return best

    def _generate_neighbor(self, current: Individual) -> Individual:
        """邻域生成：随机选 1-3 个变量高斯扰动/类别重选"""
        new_genome = current.genome.copy()
        r = self.config.neighborhood_radius
        n_perturb = np.random.randint(1, min(4, self.encoder.genome_length + 1))
        var_names = list(self.encoder.gene_map.keys())
        for name in np.random.choice(var_names, n_perturb, replace=False):
            start, length, vtype = self.encoder.gene_map[name]
            if vtype in (VariableType.REAL, VariableType.INTEGER):
                new_genome[start] = np.clip(new_genome[start] + np.random.normal(0, r), 0, 1)
            elif vtype == VariableType.CATEGORICAL:
                new_genome[start:start+length] = 0
                new_genome[start + np.random.randint(length)] = 1
        return Individual(genome=new_genome)
```

### 4.3 温度调度策略

| 策略 | 公式 | 特点 |
|------|------|------|
| 几何冷却 (默认) | T(k+1) = α × T(k) | 简单稳定 |
| 线性冷却 | T(k+1) = T(k) - δ | 匀速降温 |
| 对数冷却 | T(k) = T₀ / log(k+1) | 理论收敛保证 |
| 自适应冷却 | 根据接受率调整 | 效率最高 |

### 4.4 伪代码

```
算法: SimulatedAnnealing (通用)
输入: 初始解 s0, 评估函数 eval_fn, 目标 objective, 约束 constraints[], 温度参数
输出: 最优解 s*

1. s_current ← s0; s_best ← s0; T ← T0
2. WHILE T > Tmin:
3.     FOR i = 1 TO iterations_per_temp:
4.         s_new ← NEIGHBOR(s_current)
5.         s_new ← REPAIR(s_new, constraints)
6.         kpis ← eval_fn.evaluate(s_new)
7.         Δ ← objective.extract(kpis) - objective.extract(s_current.kpis)
8.         IF Δ < 0: s_current ← s_new
9.         ELSE IF random() < exp(-Δ/T): s_current ← s_new
10.        IF s_current better than s_best: s_best ← s_current
11.    T ← α × T
12.    IF stagnant: REHEAT
13. RETURN s_best
```

---

## 5. 禁忌搜索 (Tabu Search)

通过短期记忆（禁忌表）避免循环搜索，结合长期记忆实现多样化/集中化策略。

### 5.1 配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `tabu_list_size` | 20 | 禁忌表长度 |
| `max_iterations` | 500 | 最大迭代次数 |
| `neighborhood_size` | 20 | 每次生成的邻域解数量 |
| `aspiration_enabled` | True | 渴望准则（优于全局最佳时无视禁忌） |
| `diversification_freq` | 50 | 多样化频率（跳到低频区域） |
| `intensification_freq` | 100 | 集中化频率（回到精英池） |
| `objective_index` | 0 | 优化目标索引 |

### 5.2 核心实现

```python
from collections import deque
import hashlib

@dataclass
class TabuSearchConfig:
    tabu_list_size: int = 20
    max_iterations: int = 500
    neighborhood_size: int = 20
    aspiration_enabled: bool = True
    diversification_freq: int = 50
    intensification_freq: int = 100
    objective_index: int = 0


class TabuSearch:
    """
    通用禁忌搜索优化器。
    短期记忆 (tabu list) + 长期记忆 (frequency memory) + 精英池。
    """

    def __init__(
        self,
        config: TabuSearchConfig,
        encoder: "MixedIntegerEncoder",
        objectives: List[BaseObjective],
        constraints: List[BaseConstraint],
        evaluation_fn: EvaluationFunction,
    ):
        self.config = config
        self.encoder = encoder
        self.objectives = objectives
        self.constraints = constraints
        self.evaluation_fn = evaluation_fn
        self.tabu_list: deque = deque(maxlen=config.tabu_list_size)
        self.frequency_memory: Dict[str, int] = {}
        self.elite_pool: List[Individual] = []

    def run(self, initial_solution: Individual, callback=None) -> Individual:
        current = initial_solution
        best = initial_solution
        obj_idx = self.config.objective_index

        for iteration in range(self.config.max_iterations):
            # 生成并评估邻域
            neighbors = self._generate_neighborhood(current)
            for n in neighbors:
                n.decoded_params = self.encoder.decode(n.genome)
                for c in self.constraints:
                    if c.constraint_type == ConstraintType.HARD:
                        n.decoded_params = c.repair(n.decoded_params)
                n.genome = self.encoder.encode(n.decoded_params)
                result = self.evaluation_fn.evaluate(n.decoded_params)
                obj = self.objectives[obj_idx]
                val = obj.extract_value(result.kpis)
                n.fitness_values = [-val if obj.direction == ObjectiveDirection.MAXIMIZE else val]

            # 选择最佳非禁忌解 / 满足渴望准则的解
            best_neighbor = self._select_best_neighbor(neighbors, best, obj_idx)
            if best_neighbor is None:
                break

            # 更新禁忌表
            move_hash = self._hash_move(current, best_neighbor)
            self.tabu_list.append(move_hash)
            self.frequency_memory[self._hash_solution(best_neighbor)] = \
                self.frequency_memory.get(self._hash_solution(best_neighbor), 0) + 1

            current = best_neighbor
            if best_neighbor.fitness_values[0] < best.fitness_values[0]:
                best = best_neighbor
                self.elite_pool.append(best)

            # 多样化 / 集中化
            if iteration > 0 and iteration % self.config.diversification_freq == 0:
                current = self._diversify(current)
            if iteration > 0 and iteration % self.config.intensification_freq == 0:
                if self.elite_pool:
                    current = self.elite_pool[-1]

            if callback:
                callback(iteration, current, best)

        return best

    def _generate_neighborhood(self, current: Individual) -> List[Individual]:
        """邻域生成：单变量扰动(70%) + 两变量交换(20%) + 块移动(10%)"""
        neighbors = []
        for _ in range(self.config.neighborhood_size):
            new_genome = current.genome.copy()
            r = np.random.random()
            if r < 0.7:
                # 单变量扰动
                var = np.random.choice(list(self.encoder.gene_map.keys()))
                start, length, vtype = self.encoder.gene_map[var]
                if vtype in (VariableType.REAL, VariableType.INTEGER):
                    new_genome[start] = np.clip(new_genome[start] + np.random.normal(0, 0.1), 0, 1)
                elif vtype == VariableType.CATEGORICAL:
                    new_genome[start:start+length] = 0
                    new_genome[start + np.random.randint(length)] = 1
            elif r < 0.9:
                # 两变量值交换
                vars_ = list(self.encoder.gene_map.keys())
                if len(vars_) >= 2:
                    v1, v2 = np.random.choice(vars_, 2, replace=False)
                    s1, l1, _ = self.encoder.gene_map[v1]
                    s2, l2, _ = self.encoder.gene_map[v2]
                    if l1 == l2:
                        new_genome[s1:s1+l1], new_genome[s2:s2+l2] = \
                            new_genome[s2:s2+l2].copy(), new_genome[s1:s1+l1].copy()
            else:
                # 块移动：多个变量同时扰动
                n_perturb = np.random.randint(2, min(5, self.encoder.genome_length+1))
                indices = np.random.choice(self.encoder.genome_length, n_perturb, replace=False)
                for idx in indices:
                    new_genome[idx] = np.random.random()
            neighbors.append(Individual(genome=new_genome))
        return neighbors

    def _select_best_neighbor(self, neighbors, global_best, obj_idx):
        best, best_val = None, float('inf')
        for n in neighbors:
            val = n.fitness_values[0]
            is_tabu = self._hash_move(n, n) in self.tabu_list
            aspiration = self.config.aspiration_enabled and val < global_best.fitness_values[0]
            if (not is_tabu or aspiration) and val < best_val:
                best, best_val = n, val
        return best

    def _diversify(self, current):
        genome = current.genome.copy()
        n = max(1, int(0.3 * self.encoder.genome_length))
        for idx in np.random.choice(self.encoder.genome_length, n, replace=False):
            genome[idx] = np.random.random()
        return Individual(genome=genome)

    def _hash_move(self, from_sol, to_sol):
        diff = np.round(to_sol.genome - from_sol.genome, 4)
        return hashlib.md5(diff.tobytes()).hexdigest()[:16]

    def _hash_solution(self, sol):
        return hashlib.md5(np.round(sol.genome, 3).tobytes()).hexdigest()[:16]
```

### 5.3 伪代码

```
算法: TabuSearch (通用)
输入: 初始解 s0, eval_fn, objective, constraints[], config
输出: 最优解 s*

1. TabuList ← ∅; FreqMemory ← ∅; ElitePool ← ∅
2. s_current ← s0; s_best ← s0
3. FOR iter = 1 TO max_iterations:
4.     N ← GENERATE_NEIGHBORHOOD(s_current)
5.     EVALUATE_ALL(N, eval_fn)
6.     s_next ← BEST_NON_TABU(N) OR ASPIRATION(N, s_best)
7.     TabuList.ADD(HASH(s_current → s_next))
8.     s_current ← s_next
9.     IF better: s_best ← s_next; ElitePool.ADD(s_best)
10.    IF iter % div_freq == 0: DIVERSIFY
11.    IF iter % int_freq == 0: INTENSIFY(ElitePool)
12. RETURN s_best
```

---

## 6. 混合模式 (Hybrid)

NSGA-II → SA 精细化的两阶段混合优化。

### 6.1 工作流

```
阶段 1: NSGA-II 多目标搜索
    → 输出 Pareto 前沿 (N 个解)

用户选择 / TOPSIS 自动选择 感兴趣的解

阶段 2: SA 单目标精细化
    → 从选定解出发，对指定目标进一步优化
    → 输出精细化后的最优解
```

### 6.2 配置

```python
@dataclass
class HybridConfig:
    nsga2_config: GAConfig = field(default_factory=GAConfig)
    sa_config: SAConfig = field(default_factory=SAConfig)
    auto_select_method: str = "topsis"   # topsis | weighted_sum | manual
    n_solutions_to_refine: int = 3       # 从 Pareto 前沿选几个精细化
    sa_objective_index: int = 0          # SA 阶段优化哪个目标
```

---

## 7. 决策变量框架

通用的混合整数编码器，支持连续、整数、类别、排列四种变量类型。

### 7.1 变量类型

| 类型 | 编码 | 适用场景 |
|------|------|---------|
| `REAL` | 浮点数 [0,1] 归一化 | 坐标、宽度、温度等连续量 |
| `INTEGER` | 浮点数 [0,1] → 反归一化取整 | 数量、人数、台数 |
| `CATEGORICAL` | 独热编码 | 策略选择、规则选择 |
| `PERMUTATION` | 排列编码 | 顺序优化 |

### 7.2 混合整数编码器

```python
class MixedIntegerEncoder:
    """
    通用编码器：决策变量 ⟷ numpy 基因组。
    模块定义 List[BaseVariable]，编码器自动构建映射。
    """

    def __init__(self, variables: List[BaseVariable]):
        self.variables = [v for v in variables if not v.fixed]
        self.fixed_vars = {v.name: v.fixed_value for v in variables if v.fixed}
        self._build_encoding_map()

    def _build_encoding_map(self):
        self.gene_map = {}  # name → (start_idx, length, var_type)
        idx = 0
        for var in self.variables:
            if var.var_type in (VariableType.REAL, VariableType.INTEGER):
                self.gene_map[var.name] = (idx, 1, var.var_type)
                idx += 1
            elif var.var_type == VariableType.CATEGORICAL:
                n = len(var.categories)
                self.gene_map[var.name] = (idx, n, var.var_type)
                idx += n
            elif var.var_type == VariableType.PERMUTATION:
                self.gene_map[var.name] = (idx, var.perm_size, var.var_type)
                idx += var.perm_size
        self.genome_length = idx

    def encode(self, params: Dict[str, Any]) -> np.ndarray:
        """语义参数 → 基因组向量"""
        genome = np.zeros(self.genome_length)
        for var in self.variables:
            start, length, vtype = self.gene_map[var.name]
            val = params[var.name]
            if vtype == VariableType.REAL:
                genome[start] = (val - var.lower_bound) / (var.upper_bound - var.lower_bound)
            elif vtype == VariableType.INTEGER:
                genome[start] = (val - var.lower_bound) / (var.upper_bound - var.lower_bound)
            elif vtype == VariableType.CATEGORICAL:
                genome[start:start+length] = 0
                genome[start + var.categories.index(val)] = 1
            elif vtype == VariableType.PERMUTATION:
                genome[start:start+length] = val
        return genome

    def decode(self, genome: np.ndarray) -> Dict[str, Any]:
        """基因组向量 → 语义参数"""
        params = dict(self.fixed_vars)
        for var in self.variables:
            start, length, vtype = self.gene_map[var.name]
            if vtype == VariableType.REAL:
                params[var.name] = float(genome[start] * (var.upper_bound - var.lower_bound) + var.lower_bound)
            elif vtype == VariableType.INTEGER:
                params[var.name] = int(round(genome[start] * (var.upper_bound - var.lower_bound) + var.lower_bound))
            elif vtype == VariableType.CATEGORICAL:
                params[var.name] = var.categories[int(np.argmax(genome[start:start+length]))]
            elif vtype == VariableType.PERMUTATION:
                params[var.name] = list(genome[start:start+length].astype(int))
        return params

    def random_genome(self) -> np.ndarray:
        genome = np.random.random(self.genome_length)
        for var in self.variables:
            if var.var_type != VariableType.CATEGORICAL:
                continue
            start, length, _ = self.gene_map[var.name]
            genome[start:start+length] = 0
            genome[start + np.random.randint(length)] = 1
        return genome
```

---

## 8. 约束管理框架

约束分为**硬约束**（必须满足，违反则修复/淘汰）和**软约束**（违反时加惩罚）。

### 8.1 约束管理器

```python
class ConstraintManager:
    """
    通用约束管理器。
    接受 List[BaseConstraint]，提供可行性检查、惩罚计算、修复。
    支持自适应惩罚系数。
    """

    def __init__(self, constraints: List[BaseConstraint], adaptive_penalty: bool = True):
        self.constraints = constraints
        self.adaptive = adaptive_penalty
        self._penalty_coeffs = {
            c.name: c.penalty_coefficient
            for c in constraints if c.constraint_type == ConstraintType.SOFT
        }

    def check_feasibility(self, params: Dict) -> Tuple[bool, List[str]]:
        violations = [c.name for c in self.constraints
                      if c.constraint_type == ConstraintType.HARD and not c.check(params)]
        return (len(violations) == 0, violations)

    def compute_penalty(self, params: Dict) -> float:
        total = 0.0
        for c in self.constraints:
            if c.constraint_type != ConstraintType.SOFT:
                continue
            total += self._penalty_coeffs.get(c.name, c.penalty_coefficient) * c.compute_violation(params)
        return total

    def repair(self, params: Dict) -> Dict:
        for c in self.constraints:
            if c.constraint_type == ConstraintType.HARD:
                params = c.repair(params)
        return params

    def update_adaptive_penalties(self, feasible_ratio: float, target: float = 0.5):
        if not self.adaptive:
            return
        for name in self._penalty_coeffs:
            if feasible_ratio < target:
                self._penalty_coeffs[name] *= 1.1
            else:
                self._penalty_coeffs[name] *= 0.9
            self._penalty_coeffs[name] = np.clip(self._penalty_coeffs[name], 0.01, 1000.0)
```

---

## 9. 优化循环架构

### 9.1 核心循环

```
候选解 → [元模型预筛选(可选)] → EvaluationFunction(pluggable) → 适应度评分
    → 约束检查 + 惩罚 → 选择/进化 → Pareto 存档 → 收敛判断 → 循环/终止
```

### 9.2 任务管理器

```python
class TaskStatus(str, Enum):
    CREATED = "created"
    RUNNING = "running"
    PAUSED = "paused"
    CONVERGED = "converged"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class OptimizationTask(BaseModel):
    id: str
    name: str
    module: str                      # "trafficops" | "heatops" | "fms" | ...
    algorithm: str = "nsga2"         # nsga2 | sa | tabu | hybrid
    status: TaskStatus = TaskStatus.CREATED
    current_generation: int = 0
    total_evaluations: int = 0
    elapsed_seconds: float = 0
    current_hypervolume: float = 0
    n_pareto_solutions: int = 0

class TaskManager:
    """
    通用任务管理器。
    支持创建/启动/暂停/恢复/终止，断点续跑。
    通过 Redis 发布实时进度，WebSocket 推送前端。
    """

    async def create_task(self, task: OptimizationTask) -> str: ...
    async def start_task(self, task_id: str): ...
    async def pause_task(self, task_id: str): ...
    async def resume_task(self, task_id: str): ...
    async def cancel_task(self, task_id: str): ...
```

### 9.3 收敛判据

| 判据 | 条件 | 适用算法 |
|------|------|---------|
| Hypervolume 稳定 | 最近 N 代 HV 变化 < ε | NSGA-II |
| 最优值稳定 | 最近 N 步最优值不变 | SA / TS |
| 代数/迭代上限 | 达到最大代数 | 全部 |
| 评估次数上限 | 评估调用总数超限 | 全部 |
| 时间上限 | 运行时间超限 | 全部 |
| 用户手动停止 | 用户触发 | 全部 |

### 9.4 数据库 Schema

```sql
CREATE TABLE optimization_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module VARCHAR(50) NOT NULL,            -- trafficops | heatops | fms | ...
    name VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'created',
    algorithm VARCHAR(20) NOT NULL DEFAULT 'nsga2',
    config JSONB NOT NULL DEFAULT '{}',     -- 算法超参数
    current_generation INT DEFAULT 0,
    total_evaluations INT DEFAULT 0,
    elapsed_seconds FLOAT DEFAULT 0,
    current_hypervolume FLOAT DEFAULT 0,
    n_pareto_solutions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE optimization_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES optimization_tasks(id),
    generation INT NOT NULL,
    population_snapshot JSONB,
    pareto_archive JSONB,
    algorithm_state JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE generation_history (
    id BIGSERIAL PRIMARY KEY,
    task_id UUID REFERENCES optimization_tasks(id),
    generation INT NOT NULL,
    hypervolume FLOAT,
    best_fitness JSONB,
    avg_fitness JSONB,
    feasible_ratio FLOAT,
    n_pareto_solutions INT,
    elapsed_seconds FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gen_history_task ON generation_history(task_id, generation);
CREATE INDEX idx_checkpoints_task ON optimization_checkpoints(task_id, generation DESC);
```

---

## 10. 元模型预筛选 (Metamodel)

### 10.1 原理

评估函数（如 DES 仿真、热力学计算）往往耗时。元模型通过学习已评估样本，构建代理模型预测适应度，提前筛掉低质量候选解。

### 10.2 流程

```
候选解集 (N 个)
    ▼
元模型预测 (XGBoost / GP)  ← 训练数据 = 已评估的 (genome, fitness) 对
    ▼
排序 & 筛选 → 保留 top 50%
    ▼
真实评估函数 (只评估有潜力的 N/2 个)
```

### 10.3 核心实现

```python
from xgboost import XGBRegressor
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import Matern

class MetamodelType(str, Enum):
    XGBOOST = "xgboost"
    GAUSSIAN_PROCESS = "gaussian_process"
    ENSEMBLE = "ensemble"

class MetamodelConfig(BaseModel):
    model_type: MetamodelType = MetamodelType.ENSEMBLE
    min_training_samples: int = 30
    retrain_interval: int = 10       # 每 N 代重训练
    screening_ratio: float = 0.5     # 保留前 50%
    adaptive_sampling: bool = True   # 不确定性高的样本优先真实评估

class MetamodelPreScreener:
    """
    通用元模型预筛选器。
    与具体评估函数无关，只看 (genome, fitness) 对。
    """

    def __init__(self, config: MetamodelConfig, n_objectives: int):
        self.config = config
        self.n_objectives = n_objectives
        self.training_X = []
        self.training_Y = []
        self.models = {}
        self.is_trained = False

    def add_training_data(self, genomes: List[np.ndarray], fitnesses: List[List[float]]):
        self.training_X.extend(genomes)
        self.training_Y.extend(fitnesses)

    def train(self):
        if len(self.training_X) < self.config.min_training_samples:
            return
        X = np.array(self.training_X)
        Y = np.array(self.training_Y)

        for obj_idx in range(self.n_objectives):
            y = Y[:, obj_idx]
            if self.config.model_type in (MetamodelType.XGBOOST, MetamodelType.ENSEMBLE):
                xgb = XGBRegressor(n_estimators=100, max_depth=6, learning_rate=0.1)
                xgb.fit(X, y)
                self.models[f"xgb_{obj_idx}"] = xgb
            if self.config.model_type in (MetamodelType.GAUSSIAN_PROCESS, MetamodelType.ENSEMBLE):
                gp = GaussianProcessRegressor(kernel=Matern(nu=2.5), alpha=0.1)
                subset = np.random.choice(len(X), min(500, len(X)), replace=False)
                gp.fit(X[subset], y[subset])
                self.models[f"gp_{obj_idx}"] = gp
        self.is_trained = True

    def screen(self, genomes: List[np.ndarray]) -> List[int]:
        """返回应保留的候选解索引（预测适应度最优的 top ratio）"""
        if not self.is_trained:
            return list(range(len(genomes)))
        X = np.array(genomes)
        scores = np.zeros(len(X))
        for obj_idx in range(self.n_objectives):
            if f"xgb_{obj_idx}" in self.models:
                scores += self.models[f"xgb_{obj_idx}"].predict(X)
            if f"gp_{obj_idx}" in self.models:
                pred, std = self.models[f"gp_{obj_idx}"].predict(X, return_std=True)
                # 自适应采样：不确定性高的也保留
                if self.config.adaptive_sampling:
                    scores += pred - 0.5 * std  # Lower Confidence Bound
                else:
                    scores += pred
        n_keep = max(1, int(len(genomes) * self.config.screening_ratio))
        return list(np.argsort(scores)[:n_keep])
```

---

## 11. Pareto 前沿存储与可视化

### 11.1 Pareto Archive

```python
class ParetoArchive:
    """非支配解存档"""

    def __init__(self, reference_point: Optional[List[float]] = None):
        self.solutions: List[Individual] = []
        self.reference_point = reference_point
        self.hypervolumes: List[float] = []

    def update(self, front: List[Individual]):
        """合并新的非支配前沿"""
        combined = self.solutions + front
        self.solutions = self._non_dominated_filter(combined)

    def compute_hypervolume(self) -> float:
        """计算 Hypervolume 指标"""
        if not self.solutions or not self.reference_point:
            return 0.0
        from pymoo.indicators.hv import HV
        fitnesses = np.array([s.fitness_values for s in self.solutions])
        hv = HV(ref_point=np.array(self.reference_point))
        return float(hv(fitnesses))

    def get_solutions(self) -> List[Individual]:
        return self.solutions
```

### 11.2 决策支持

| 方法 | 用途 |
|------|------|
| **TOPSIS** | 从 Pareto 前沿自动推荐"最均衡"的解 |
| **加权求和** | 用户设定权重，按加权分排序 |
| **散点图 / 平行坐标图** | 可视化 Pareto 前沿分布 |
| **雷达图** | 多目标对比 |
| **Before/After 仪表板** | 优化前后 KPI 对比 |

---

## 12. 通用 API

```
# ─── 优化任务 ───
POST   /api/v1/optimization/tasks                        创建任务
GET    /api/v1/optimization/tasks                        列表
GET    /api/v1/optimization/tasks/{id}                   详情
POST   /api/v1/optimization/tasks/{id}/start             启动
POST   /api/v1/optimization/tasks/{id}/pause             暂停
POST   /api/v1/optimization/tasks/{id}/resume            恢复
POST   /api/v1/optimization/tasks/{id}/cancel            终止
GET    /api/v1/optimization/tasks/{id}/progress           进度 (REST)
WS     /ws/optimization/tasks/{id}/progress               进度 (WebSocket)
GET    /api/v1/optimization/tasks/{id}/checkpoints        检查点列表

# ─── 通用优化入口 (pluggable evaluator) ───
POST   /api/v1/optimization/run
Body: {
    "module": "trafficops",              // 模块名
    "algorithm": "nsga2",                // nsga2 | sa | tabu | hybrid
    "objectives": [...],                 // 模块定义的目标
    "variables": [...],                  // 模块定义的变量
    "constraints": [...],                // 模块定义的约束
    "evaluator_config": {...},           // 传给模块 EvaluationFunction 的配置
    "algorithm_config": {...}            // 算法超参数
}
Response: { "task_id": "xxx", "status": "created" }

# ─── Pareto 结果 ───
GET    /api/v1/optimization/tasks/{id}/pareto              Pareto 前沿
GET    /api/v1/optimization/tasks/{id}/pareto/topsis       TOPSIS 排序
POST   /api/v1/optimization/tasks/{id}/pareto/{sol_id}/refine   SA 精细化
POST   /api/v1/optimization/tasks/{id}/pareto/{sol_id}/apply    应用到模块
```

### 12.1 基盘验收标准

- [x] NSGA-II 在标准测试函数 (ZDT1, ZDT3, DTLZ2) 上 Hypervolume ≥ 已知基准 95%
- [x] SA 在单目标基准上优于 NSGA-II 单目标提取 ≥ 5%
- [x] 禁忌搜索有效避免循环，渴望准则正确
- [x] 编码/解码可逆，精度损失 < 1e-6
- [x] 断点续跑正确
- [ ] WebSocket 实时推送延迟 < 1s（WebSocket 实时推送整体待实现）
- [x] 不同模块可独立接入，互不影响

---

# 第二部分：TrafficOps 模块 — 布局优化

**位置**: `ai-engine/modules/trafficops/`

TrafficOps 模块实现基盘抽象接口，将人流动线场景的布局优化问题接入通用优化引擎。

---

## T1. 模块概览

TrafficOps 布局优化 = **基盘优化引擎** + **DES 仿真评估器** + **TrafficOps 专属的目标/变量/约束**

```
ai-engine/modules/trafficops/
├── objectives.py          # TrafficOps 目标函数 (实现 BaseObjective)
├── variables.py           # TrafficOps 决策变量 (实现 BaseVariable)
├── constraints.py         # TrafficOps 约束 (实现 BaseConstraint)
├── evaluator.py           # DES 适应度评估器 (实现 EvaluationFunction)
├── result_applier.py      # 结果应用到 3D 场景
└── config.py              # TrafficOps 优化默认配置
```

---

## T2. TrafficOps 决策变量

| 变量 | 类型 | 范围示例 | 说明 |
|------|------|---------|------|
| `station_{i}_x` | REAL | [0, floor_width] | 工位 x 坐标 |
| `station_{i}_y` | REAL | [0, floor_height] | 工位 y 坐标 |
| `counter_count` | INTEGER | [2, 20] | 柜台数量 |
| `buffer_{j}_size` | INTEGER | [5, 100] | 缓冲区容量 |
| `staff_shift_{k}` | INTEGER | [1, 20] | 各班次人员数 |
| `routing_rule` | CATEGORICAL | [FIFO, LIFO, SRU, EDD] | 路由策略 |
| `aisle_width` | REAL | [1.2, 3.0] m | 走道宽度 |

```python
# ai-engine/modules/trafficops/variables.py

from core.optimizer.interfaces import BaseVariable, VariableType

def build_trafficops_variables(scene_config: dict) -> List[BaseVariable]:
    """从 TrafficOps 场景配置自动生成决策变量"""
    variables = []
    for station in scene_config["stations"]:
        if not station.get("fixed", False):
            variables.append(BaseVariable(
                name=f"station_{station['id']}_x",
                var_type=VariableType.REAL,
                lower_bound=0, upper_bound=scene_config["floor_width"],
                group=f"station_{station['id']}",
            ))
            variables.append(BaseVariable(
                name=f"station_{station['id']}_y",
                var_type=VariableType.REAL,
                lower_bound=0, upper_bound=scene_config["floor_height"],
                group=f"station_{station['id']}",
            ))
    for buffer in scene_config.get("buffers", []):
        variables.append(BaseVariable(
            name=f"buffer_{buffer['id']}_size",
            var_type=VariableType.INTEGER,
            lower_bound=buffer.get("min_size", 5),
            upper_bound=buffer.get("max_size", 100),
        ))
    variables.append(BaseVariable(
        name="counter_count",
        var_type=VariableType.INTEGER,
        lower_bound=scene_config.get("min_counters", 2),
        upper_bound=scene_config.get("max_counters", 20),
    ))
    variables.append(BaseVariable(
        name="routing_rule",
        var_type=VariableType.CATEGORICAL,
        categories=["FIFO", "LIFO", "SRU", "EDD"],
    ))
    variables.append(BaseVariable(
        name="aisle_width",
        var_type=VariableType.REAL,
        lower_bound=1.2, upper_bound=3.0,
    ))
    return variables
```

---

## T3. TrafficOps 目标函数

| 目标 | 方向 | KPI 来源 |
|------|------|---------|
| 最大化吞吐量 | maximize | `des.total_output / des.sim_time` |
| 最小化平均等待时间 | minimize | `mean(entity.wait_times)` |
| 最小化前置时间 | minimize | `mean(entity.exit_time - entity.enter_time)` |

```python
# ai-engine/modules/trafficops/objectives.py

from core.optimizer.interfaces import BaseObjective, ObjectiveDirection

class ThroughputObjective(BaseObjective):
    @property
    def name(self): return "throughput"
    @property
    def direction(self): return ObjectiveDirection.MAXIMIZE

    def extract_value(self, evaluation_result):
        return evaluation_result["throughput"]

class AvgWaitTimeObjective(BaseObjective):
    @property
    def name(self): return "avg_wait_time"
    @property
    def direction(self): return ObjectiveDirection.MINIMIZE

    def extract_value(self, evaluation_result):
        return evaluation_result["avg_wait_time"]

class LeadTimeObjective(BaseObjective):
    @property
    def name(self): return "lead_time"
    @property
    def direction(self): return ObjectiveDirection.MINIMIZE

    def extract_value(self, evaluation_result):
        return evaluation_result["lead_time"]
```

---

## T4. TrafficOps 约束

### 硬约束

| 约束 | 说明 | 参数 |
|------|------|------|
| 场地边界 | 所有工位在场地范围内 | `width`, `height` |
| 安全距离 | 任意两工位间距 ≥ 阈值 | `min_distance` |
| 不重叠 | 工位占地不重叠 | 自动计算 |
| 人员上下限 | 每班次人数在范围内 | `min_staff`, `max_staff` |
| 预算上限 | 总投资 ≤ 预算 | `budget` |

### 软约束

| 约束 | 说明 | 惩罚 |
|------|------|------|
| 邻接偏好 | 相关工位尽量靠近 | penalty_per_meter |
| 走道宽度偏好 | 走道在理想范围内 | penalty_per_cm |

```python
# ai-engine/modules/trafficops/constraints.py

from core.optimizer.interfaces import BaseConstraint, ConstraintType
import numpy as np

class FootprintBoundsConstraint(BaseConstraint):
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height

    @property
    def name(self): return "footprint_bounds"
    @property
    def constraint_type(self): return ConstraintType.HARD

    def check(self, params):
        for key, val in params.items():
            if key.endswith("_x") and (val < 0 or val > self.width):
                return False
            if key.endswith("_y") and (val < 0 or val > self.height):
                return False
        return True

    def compute_violation(self, params):
        violation = 0.0
        for key, val in params.items():
            if key.endswith("_x"):
                violation += max(0, -val) + max(0, val - self.width)
            if key.endswith("_y"):
                violation += max(0, -val) + max(0, val - self.height)
        return violation

    def repair(self, params):
        repaired = dict(params)
        for key, val in repaired.items():
            if key.endswith("_x"):
                repaired[key] = np.clip(val, 0, self.width)
            if key.endswith("_y"):
                repaired[key] = np.clip(val, 0, self.height)
        return repaired


class SafetyDistanceConstraint(BaseConstraint):
    def __init__(self, min_distance: float):
        self.min_distance = min_distance

    @property
    def name(self): return "safety_distance"
    @property
    def constraint_type(self): return ConstraintType.HARD

    def check(self, params):
        stations = self._extract_stations(params)
        for i in range(len(stations)):
            for j in range(i+1, len(stations)):
                dist = np.sqrt((stations[i][0]-stations[j][0])**2 + (stations[i][1]-stations[j][1])**2)
                if dist < self.min_distance:
                    return False
        return True

    def compute_violation(self, params):
        stations = self._extract_stations(params)
        violation = 0.0
        for i in range(len(stations)):
            for j in range(i+1, len(stations)):
                dist = np.sqrt((stations[i][0]-stations[j][0])**2 + (stations[i][1]-stations[j][1])**2)
                if dist < self.min_distance:
                    violation += self.min_distance - dist
        return violation

    def repair(self, params):
        """力导向法迭代推开违反安全距离的工位"""
        repaired = dict(params)
        stations = self._extract_stations(repaired)
        for _ in range(50):
            moved = False
            for i in range(len(stations)):
                for j in range(i+1, len(stations)):
                    dx = stations[j][0] - stations[i][0]
                    dy = stations[j][1] - stations[i][1]
                    dist = np.sqrt(dx**2 + dy**2)
                    if dist < self.min_distance and dist > 0:
                        push = (self.min_distance - dist) / 2 + 0.01
                        nx, ny = dx/dist, dy/dist
                        stations[i] = (stations[i][0]-nx*push, stations[i][1]-ny*push)
                        stations[j] = (stations[j][0]+nx*push, stations[j][1]+ny*push)
                        moved = True
            if not moved:
                break
        self._write_stations(repaired, stations)
        return repaired

    def _extract_stations(self, params):
        ids = set()
        for k in params:
            if k.startswith("station_") and k.endswith("_x"):
                ids.add(k.replace("_x", ""))
        return [(params[f"{sid}_x"], params[f"{sid}_y"]) for sid in sorted(ids)]

    def _write_stations(self, params, stations):
        ids = sorted(set(k.replace("_x","") for k in params if k.startswith("station_") and k.endswith("_x")))
        for sid, (x, y) in zip(ids, stations):
            params[f"{sid}_x"] = x
            params[f"{sid}_y"] = y


class AdjacencyPreferenceConstraint(BaseConstraint):
    """软约束：某些工位应尽量靠近"""
    def __init__(self, pairs: List[Tuple[str, str]], penalty_per_meter: float = 1.0):
        self.pairs = pairs
        self._penalty = penalty_per_meter

    @property
    def name(self): return "adjacency_pref"
    @property
    def constraint_type(self): return ConstraintType.SOFT
    @property
    def penalty_coefficient(self): return self._penalty

    def check(self, params): return True  # 软约束永远"满足"
    def compute_violation(self, params):
        total = 0.0
        for s1, s2 in self.pairs:
            dx = params.get(f"station_{s1}_x",0) - params.get(f"station_{s2}_x",0)
            dy = params.get(f"station_{s1}_y",0) - params.get(f"station_{s2}_y",0)
            total += np.sqrt(dx**2 + dy**2)
        return total
```

---

## T5. DES 适应度评估器

TrafficOps 的 `EvaluationFunction` 实现：调用 DES 引擎仿真人流动线。

```python
# ai-engine/modules/trafficops/evaluator.py

from core.optimizer.interfaces import EvaluationFunction, EvaluationResult
from des_engine import DESEngine

class TrafficOpsDESEvaluator(EvaluationFunction):
    """
    以 DES 仿真为适应度评估器。
    将布局参数注入仿真场景，运行仿真，收集 KPI。
    """

    def __init__(self, scene_id: str, base_config: dict, n_reps: int = 5):
        self.scene_id = scene_id
        self.base_config = base_config
        self._n_reps = n_reps

    @property
    def n_replications(self) -> int:
        return self._n_reps

    def evaluate(self, params: Dict[str, Any]) -> EvaluationResult:
        """单次 DES 仿真评估"""
        try:
            sim_config = dict(self.base_config)
            sim_config["layout_overrides"] = params
            engine = DESEngine(sim_config)
            engine.run()
            kpis = engine.collect_kpis()
            return EvaluationResult(kpis=kpis, success=True)
        except Exception as e:
            return EvaluationResult(
                kpis={}, success=False, error_message=str(e)
            )

    @property
    def supports_batch(self) -> bool:
        return True

    def evaluate_batch(self, params_list):
        """并行 DES 仿真"""
        from concurrent.futures import ProcessPoolExecutor
        results = []
        with ProcessPoolExecutor(max_workers=4) as pool:
            futures = [pool.submit(self.evaluate, p) for p in params_list]
            results = [f.result() for f in futures]
        return results
```

---

## T6. 结果应用

```python
# ai-engine/modules/trafficops/result_applier.py

class TrafficOpsResultApplier:
    """将优化结果应用到 3D 数字孪生场景"""

    def apply_to_scene(self, scene_id: str, solution: Individual):
        """
        1. 解码优化参数
        2. 更新 3D 场景中的工位坐标、缓冲区参数
        3. 生成变更清单
        """
        params = solution.decoded_params
        changes = []
        for key, val in params.items():
            if key.startswith("station_"):
                # 更新工位坐标
                changes.append({"type": "move", "target": key, "value": val})
            elif key.startswith("buffer_"):
                changes.append({"type": "resize", "target": key, "value": val})
            elif key == "counter_count":
                changes.append({"type": "set_count", "target": "counters", "value": val})
        self._apply_changes(scene_id, changes)
        return changes

    def generate_implementation_plan(self, solution: Individual, baseline: dict) -> dict:
        """
        生成实施方案文档：
        - 变更清单 (before/after)
        - KPI 对比
        - 预估工期和成本
        """
        return {
            "changes": self._diff(baseline, solution.decoded_params),
            "kpi_comparison": self._compare_kpis(baseline, solution.raw_kpis),
            "estimated_duration": "2-3 weeks",
            "estimated_cost": self._estimate_cost(solution.decoded_params),
        }
```

---

# 第三部分：其他模块示例

以下示例展示其他模块如何接入基盘优化引擎。每个模块只需实现 `BaseObjective`、`BaseVariable`、`BaseConstraint`、`EvaluationFunction` 即可。

---

## 示例 1: HeatOps — 管网拓扑优化

**位置**: `ai-engine/modules/heatops/`
**目标**: 优化供热管网拓扑，最小化热损失，最大化系统效率。

```python
# ai-engine/modules/heatops/objectives.py
class HeatLossObjective(BaseObjective):
    @property
    def name(self): return "heat_loss"
    @property
    def direction(self): return ObjectiveDirection.MINIMIZE
    def extract_value(self, result):
        return result["total_heat_loss_kw"]

class SystemEfficiencyObjective(BaseObjective):
    @property
    def name(self): return "system_efficiency"
    @property
    def direction(self): return ObjectiveDirection.MAXIMIZE
    def extract_value(self, result):
        return result["system_efficiency_pct"]

# ai-engine/modules/heatops/variables.py
# 决策变量：管径选择 (categorical), 管段连接拓扑 (permutation),
#            泵站功率 (real), 保温层厚度 (real)

# ai-engine/modules/heatops/evaluator.py
class HeatOpsEvaluator(EvaluationFunction):
    """调用热力学仿真引擎评估管网方案"""
    def evaluate(self, params):
        # 调用 heat_sim_engine 计算热损失和效率
        result = self.heat_sim.run(params)
        return EvaluationResult(kpis={
            "total_heat_loss_kw": result.heat_loss,
            "system_efficiency_pct": result.efficiency,
        })

    @property
    def n_replications(self): return 1  # 确定性模型，无需多副本
```

---

## 示例 2: FMS — 维护排程优化

**位置**: `ai-engine/modules/fms/`
**目标**: 优化设备维护排程，最小化停机时间，最小化维护成本。

```python
# ai-engine/modules/fms/objectives.py
class DowntimeObjective(BaseObjective):
    @property
    def name(self): return "total_downtime"
    @property
    def direction(self): return ObjectiveDirection.MINIMIZE
    def extract_value(self, result):
        return result["total_downtime_hours"]

class MaintenanceCostObjective(BaseObjective):
    @property
    def name(self): return "maintenance_cost"
    @property
    def direction(self): return ObjectiveDirection.MINIMIZE
    def extract_value(self, result):
        return result["total_cost_yuan"]

# ai-engine/modules/fms/variables.py
# 决策变量：维护间隔 (integer, 天), 维护策略 (categorical: preventive/corrective/condition-based),
#            备件库存量 (integer), 维护人员排班 (permutation)

# ai-engine/modules/fms/evaluator.py
class FMSEvaluator(EvaluationFunction):
    """Monte Carlo 仿真评估维护排程"""
    def evaluate(self, params):
        result = self.mc_sim.run(params)
        return EvaluationResult(kpis={
            "total_downtime_hours": result.downtime,
            "total_cost_yuan": result.cost,
        })

    @property
    def n_replications(self): return 10  # Monte Carlo 需多副本
```

---

## 示例 3: Energy — HVAC 优化

**位置**: `ai-engine/modules/energy/`
**目标**: 优化 HVAC 设定点，最小化能耗，维持舒适度。

```python
# ai-engine/modules/energy/objectives.py
class EnergyConsumptionObjective(BaseObjective):
    @property
    def name(self): return "energy_consumption"
    @property
    def direction(self): return ObjectiveDirection.MINIMIZE
    def extract_value(self, result):
        return result["total_kwh"]

class ComfortObjective(BaseObjective):
    @property
    def name(self): return "comfort_index"
    @property
    def direction(self): return ObjectiveDirection.MAXIMIZE
    def extract_value(self, result):
        return result["pmv_score"]  # Predicted Mean Vote

# ai-engine/modules/energy/variables.py
# 决策变量：各区域温度设定 (real, 18-28°C), 风速档位 (categorical: low/mid/high),
#            运行时间表 (integer, hours), 新风比例 (real, 0.1-1.0)

# ai-engine/modules/energy/evaluator.py
class EnergyEvaluator(EvaluationFunction):
    """调用 EnergyPlus 或简化热模型评估"""
    def evaluate(self, params):
        result = self.energy_model.simulate(params)
        return EvaluationResult(kpis={
            "total_kwh": result.energy,
            "pmv_score": result.comfort,
        })

    @property
    def n_replications(self): return 1  # 确定性模型
```

---

# 附录

## A. 模块接入检查清单

新模块接入基盘优化引擎时，需完成以下步骤：

- [ ] 实现 `BaseObjective` 子类（1-5 个目标函数）
- [ ] 定义 `List[BaseVariable]` （决策变量及其范围）
- [ ] 实现 `BaseConstraint` 子类（硬约束含 repair，软约束含 compute_violation）
- [ ] 实现 `EvaluationFunction`（核心评估逻辑）
- [ ] 注册模块到 `/api/v1/optimization/run` 的 module 路由
- [ ] 编写单元测试（编码/解码、约束修复、评估函数）
- [ ] 编写集成测试（完整优化循环，小规模）

## B. 文件结构

```
ai-engine/
├── core/
│   └── optimizer/
│       ├── interfaces.py          # BaseObjective, BaseVariable, BaseConstraint, EvaluationFunction
│       ├── encoder.py             # MixedIntegerEncoder
│       ├── nsga2.py               # NSGA2Optimizer
│       ├── sa.py                  # SimulatedAnnealing
│       ├── tabu.py                # TabuSearch
│       ├── hybrid.py              # HybridOptimizer
│       ├── metamodel.py           # MetamodelPreScreener
│       ├── pareto.py              # ParetoArchive, TOPSIS, WeightedSum
│       ├── constraints.py         # ConstraintManager
│       ├── task_manager.py        # TaskManager
│       └── api.py                 # 通用优化 API 路由
│
├── modules/
│   ├── trafficops/
│   │   ├── objectives.py
│   │   ├── variables.py
│   │   ├── constraints.py
│   │   ├── evaluator.py           # TrafficOpsDESEvaluator
│   │   ├── result_applier.py
│   │   └── config.py
│   ├── heatops/
│   │   ├── objectives.py
│   │   ├── variables.py
│   │   ├── constraints.py
│   │   └── evaluator.py
│   ├── fms/
│   │   └── ...
│   └── energy/
│       └── ...
```

## C. 数据层

| 存储 | 用途 |
|------|------|
| PostgreSQL | 任务配置、结果、历史、检查点 |
| Redis | 实时进度推送、控制信号 |
| MinIO/S3 | 快照、报告、大型 Pareto 存档 |
