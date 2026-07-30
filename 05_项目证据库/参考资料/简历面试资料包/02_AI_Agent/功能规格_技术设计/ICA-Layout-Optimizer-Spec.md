# 技术规格：空间布局优化引擎（Phase 2）

> Spec: Spatial Layout Optimizer for ICA Facility Design
> 
> Version: 1.0 | Date: 2026-02-16 | Author: AzureBot
> 
> 对应 PRD Phase 2（W5-W10），满足 ICA 5.1 + 5.3 要求

---

## 1. 概述

ICA 的核心需求是 **在3D数字孪生中设计、验证和优化设施布局**。当前系统仅支持参数优化（如人员数量），不支持 **空间布局优化**（站点位置、通道拓扑、缓冲区大小的物理摆放）。

本规格定义：
1. **BIM/IFC导入引擎** — 将建筑图纸转化为3D场景
2. **2D/3D布局编辑器** — 可视化拖拽放置设施元素
3. **空间布局优化器** — NSGA-II + 空间编码 + DES评估循环
4. **约束管理系统** — 硬约束修复 + 软约束惩罚

---

## 2. BIM/IFC 导入引擎

### 2.1 技术选型

| 方案 | 库 | 优缺点 |
|------|---|--------|
| **方案A: web-ifc** | web-ifc (WASM) | ✅ 纯前端，无服务端依赖；✅ 速度快；❌ 仅IFC格式 |
| **方案B: xeokit** | xeokit-sdk | ✅ 成熟的BIM可视化；✅ 支持IFC/glTF/3DXML；❌ 商业许可 |
| **方案C: IFC.js (v0.0.x)** | web-ifc + three.js | ✅ 基于Three.js（我们已用）；✅ 开源；❌ API不稳定 |
| **方案D: IfcOpenShell** | Python IfcOpenShell | ✅ 服务端解析，前端只渲染；✅ 功能全 |

**推荐：方案D（IfcOpenShell后端解析）+ Three.js前端渲染**

理由：
- 前端已有Three.js基础
- 后端解析可做坐标转换、元素分类、语义提取
- 不依赖前端WASM性能
- IFC文件通常很大（50-200MB），服务端处理更可靠

### 2.2 架构

```
                    ┌───────────────────┐
                    │  Frontend         │
                    │  Three.js Viewer  │
  IFC File ──────▶  │  + glTF Renderer  │
  (upload)          └────────┬──────────┘
                             │ glTF + metadata JSON
                    ┌────────┴──────────┐
                    │  AI Engine        │
                    │  IfcOpenShell     │
                    │  IFC → glTF      │
                    │  + Metadata       │
                    └───────────────────┘
```

### 2.3 IFC处理流水线

```python
# ai-engine/core/bim/ifc_parser.py

import ifcopenshell
import ifcopenshell.geom
import json
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Dict, Optional

@dataclass
class BimElement:
    """解析后的BIM元素"""
    ifc_id: str
    ifc_type: str          # IfcWall, IfcDoor, IfcSpace, etc.
    name: str
    layer: str             # building_shell / utilities / equipment / safety
    geometry_ref: str      # glTF mesh引用
    position: tuple        # (x, y, z) 世界坐标
    rotation: tuple        # (rx, ry, rz) 欧拉角
    dimensions: tuple      # (width, depth, height)
    properties: Dict       # IFC属性集
    zone: Optional[str] = None  # 所属区域

@dataclass
class BimModel:
    """解析后的完整BIM模型"""
    elements: List[BimElement]
    zones: Dict[str, list]       # zone_name → [element_ids]
    floor_plans: Dict[int, str]  # floor_number → svg/png路径
    coordinate_system: Dict      # 坐标系元数据
    bounding_box: tuple          # ((min_x,min_y,min_z), (max_x,max_y,max_z))

class IfcParser:
    """IFC文件解析器"""

    # IFC类型到图层的映射
    LAYER_MAPPING = {
        "IfcWall": "building_shell",
        "IfcSlab": "building_shell",
        "IfcRoof": "building_shell",
        "IfcDoor": "building_shell",
        "IfcWindow": "building_shell",
        "IfcColumn": "building_shell",
        "IfcStair": "building_shell",
        "IfcSpace": "zones",
        "IfcFlowTerminal": "utilities",
        "IfcFlowSegment": "utilities",
        "IfcFurnishingElement": "equipment",
        "IfcBuildingElementProxy": "equipment",
    }

    def parse(self, ifc_path: str) -> BimModel:
        """解析IFC文件"""
        ifc_file = ifcopenshell.open(ifc_path)
        settings = ifcopenshell.geom.settings()
        settings.set(settings.USE_WORLD_COORDS, True)

        elements = []
        zones = {}

        for product in ifc_file.by_type("IfcProduct"):
            if not product.Representation:
                continue

            try:
                shape = ifcopenshell.geom.create_shape(settings, product)
            except Exception:
                continue

            ifc_type = product.is_a()
            layer = self.LAYER_MAPPING.get(ifc_type, "other")

            # 提取位置
            matrix = shape.transformation.matrix.data
            position = (matrix[9], matrix[10], matrix[11])

            # 提取属性
            props = self._extract_properties(product)

            element = BimElement(
                ifc_id=str(product.GlobalId),
                ifc_type=ifc_type,
                name=product.Name or f"{ifc_type}_{product.id()}",
                layer=layer,
                geometry_ref=f"mesh_{product.id()}",
                position=position,
                rotation=(0, 0, 0),  # 从transformation matrix提取
                dimensions=self._get_dimensions(shape),
                properties=props,
            )
            elements.append(element)

            # IfcSpace → 区域
            if ifc_type == "IfcSpace":
                zone_name = product.Name or f"Zone_{product.id()}"
                zones[zone_name] = []

        return BimModel(
            elements=elements,
            zones=zones,
            floor_plans={},
            coordinate_system={"unit": "meter", "up": "z"},
            bounding_box=self._compute_bbox(elements),
        )

    def to_gltf(self, ifc_path: str, output_path: str):
        """将IFC转换为glTF（Three.js可直接加载）"""
        # 使用IfcOpenShell的geom序列化
        ifc_file = ifcopenshell.open(ifc_path)
        settings = ifcopenshell.geom.settings()
        settings.set(settings.USE_WORLD_COORDS, True)
        # ... glTF序列化逻辑
        pass

    def _extract_properties(self, product) -> dict:
        props = {}
        for definition in product.IsDefinedBy:
            if definition.is_a("IfcRelDefinesByProperties"):
                pset = definition.RelatingPropertyDefinition
                if pset.is_a("IfcPropertySet"):
                    for prop in pset.HasProperties:
                        if prop.is_a("IfcPropertySingleValue"):
                            props[prop.Name] = str(prop.NominalValue.wrappedValue) if prop.NominalValue else None
        return props

    def _get_dimensions(self, shape) -> tuple:
        verts = shape.geometry.verts
        if not verts:
            return (0, 0, 0)
        xs = verts[0::3]
        ys = verts[1::3]
        zs = verts[2::3]
        return (max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs))

    def _compute_bbox(self, elements: List[BimElement]) -> tuple:
        if not elements:
            return ((0,0,0), (0,0,0))
        xs = [e.position[0] for e in elements]
        ys = [e.position[1] for e in elements]
        zs = [e.position[2] for e in elements]
        return ((min(xs), min(ys), min(zs)), (max(xs), max(ys), max(zs)))
```

### 2.4 API端点

```yaml
POST /ai/bim/upload:
  description: 上传IFC文件，解析并返回元素列表 + glTF
  body: multipart/form-data (ifc_file)
  response:
    model_id: "bim_001"
    element_count: 1234
    layers: ["building_shell", "utilities", "equipment", "zones"]
    zones: ["Immigration Hall", "Security Area", "Departure Lounge"]
    gltf_url: "/ai/bim/models/bim_001/scene.gltf"
    metadata_url: "/ai/bim/models/bim_001/metadata.json"

GET /ai/bim/models/{model_id}/elements:
  description: 获取模型元素列表（可按layer/zone过滤）
  params: layer, zone, ifc_type
  response:
    elements: [BimElement, ...]

GET /ai/bim/models/{model_id}/scene.gltf:
  description: 下载glTF 3D模型文件
```

---

## 3. 2D/3D 布局编辑器

### 3.1 功能需求

| 功能 | 说明 | 实现方式 |
|------|------|----------|
| 建筑底图加载 | 显示BIM导入的楼层平面 | Three.js平面渲染或SVG overlay |
| 元素库 | 可用设施元素目录（检查站/缓冲区/通道/AGV路径） | 侧边栏拖拽面板 |
| 拖拽放置 | 将元素从库拖到画布 | Three.js raycaster + drag controls |
| 参数配置 | 选中元素后编辑参数（容量/处理时间/...） | 右侧属性面板 |
| 连线编辑 | 定义元素间的路由连接（DAG） | 点击起点→终点连线 |
| 约束可视化 | 显示安全距离圆/步行距离等高线 | Canvas overlay |
| 撤销/重做 | 编辑历史 | Undo/Redo stack |
| 导出 | 保存布局为JSON + 截图 | API保存 + Canvas导出 |

### 3.2 数据模型

```typescript
// frontend/src/types/layout.ts

interface LayoutElement {
  id: string
  type: 'checkpoint' | 'buffer' | 'aisle' | 'agv_path' | 'operator_station' | 'exit' | 'entry'
  position: { x: number; y: number; z: number }
  rotation: number  // Y轴旋转角度
  dimensions: { width: number; depth: number; height: number }
  // DES参数
  capacity: number
  meanServiceTime: number
  serviceTimeDistribution?: string
  dispatchPolicy?: string
  failureConfig?: {
    mtbf: number
    mttr: number
    distribution: string
  }
  // 约束
  minSafetyDistance: number  // 最小安全距离（米）
  maxWalkingDistance?: number
}

interface LayoutRoute {
  fromId: string
  toId: string
  routeType: 'probability' | 'condition' | 'shortest_queue'
  probability?: number
  condition?: string
}

interface FacilityLayout {
  id: string
  name: string
  bimModelId?: string
  floorLevel: number
  elements: LayoutElement[]
  routes: LayoutRoute[]
  constraints: LayoutConstraint[]
  metadata: {
    totalArea: number       // m²
    usableArea: number
    createdAt: string
    updatedAt: string
  }
}

interface LayoutConstraint {
  type: 'min_distance' | 'max_distance' | 'adjacency' | 'budget' | 'footprint'
  params: Record<string, number>
  hardOrSoft: 'hard' | 'soft'
  penaltyWeight?: number  // soft约束的惩罚权重
}
```

### 3.3 组件架构

```
LayoutEditorView.vue
├── LayoutToolbar.vue          # 工具栏（选择/移动/连线/测距/撤销/保存）
├── LayoutCanvas.vue           # Three.js 2D/3D画布
│   ├── BuildingFloor.vue      # BIM底图渲染
│   ├── LayoutElement3D.vue    # 可拖拽的3D设施元素
│   ├── RouteConnection.vue    # 路由连线可视化
│   └── ConstraintOverlay.vue  # 约束可视化（安全距离圆等）
├── ElementLibrary.vue         # 左侧元素库面板
├── PropertyPanel.vue          # 右侧属性编辑面板
└── LayoutSummary.vue          # 底部布局摘要（面积/元素数/路由数）
```

---

## 4. 空间布局优化器

### 4.1 核心思路

**优化循环**：
```
1. 生成候选布局（编码为向量）
   ↓
2. 解码为FacilityLayout
   ↓
3. 约束检查 + 修复
   ↓
4. 转换为DES场景配置
   ↓
5. 运行DES仿真（多replication）
   ↓
6. 计算适应度（throughput, lead_time, OEE, ...）
   ↓
7. NSGA-II选择/交叉/变异
   ↓
8. 重复直到收敛（hypervolume不再改善）
```

### 4.2 空间编码方案

```python
# ai-engine/core/optimizer/layout_encoding.py

import numpy as np
from dataclasses import dataclass
from typing import List, Tuple

@dataclass
class LayoutVariable:
    """布局优化的决策变量"""
    name: str
    var_type: str  # 'position_x', 'position_y', 'rotation', 'capacity', 'count'
    element_id: str
    lower_bound: float
    upper_bound: float
    is_integer: bool = False

class LayoutEncoder:
    """
    将布局编码为NSGA-II可用的决策向量。
    
    编码方式：
    - 每个可移动元素：(x, y, rotation) → 3个连续变量
    - 每个可调整资源：(capacity) → 1个整数变量
    - 通道拓扑：(connected_0_1, connected_0_2, ...) → 布尔变量
    
    示例：5个检查站 + 2个缓冲区 + 通道连接
    = 5×3 + 2×3 + 5×1 + C(7,2)布尔 = 47个变量
    """

    def __init__(self, base_layout: dict, movable_elements: List[str],
                 adjustable_capacities: List[str], floor_bounds: Tuple):
        self.base_layout = base_layout
        self.movable = movable_elements
        self.adjustable = adjustable_capacities
        self.floor_bounds = floor_bounds  # ((min_x, min_y), (max_x, max_y))
        self.variables = self._build_variables()

    def _build_variables(self) -> List[LayoutVariable]:
        variables = []
        (min_x, min_y), (max_x, max_y) = self.floor_bounds

        # 可移动元素的位置和朝向
        for elem_id in self.movable:
            variables.append(LayoutVariable(
                name=f"{elem_id}_x", var_type="position_x",
                element_id=elem_id,
                lower_bound=min_x, upper_bound=max_x,
            ))
            variables.append(LayoutVariable(
                name=f"{elem_id}_y", var_type="position_y",
                element_id=elem_id,
                lower_bound=min_y, upper_bound=max_y,
            ))
            variables.append(LayoutVariable(
                name=f"{elem_id}_rot", var_type="rotation",
                element_id=elem_id,
                lower_bound=0, upper_bound=360,
            ))

        # 可调整容量
        for elem_id in self.adjustable:
            variables.append(LayoutVariable(
                name=f"{elem_id}_capacity", var_type="capacity",
                element_id=elem_id,
                lower_bound=1, upper_bound=15,
                is_integer=True,
            ))

        return variables

    def decode(self, vector: np.ndarray) -> dict:
        """将优化向量解码为布局配置"""
        layout = dict(self.base_layout)  # deep copy in practice
        idx = 0

        for var in self.variables:
            value = vector[idx]
            if var.is_integer:
                value = int(round(value))

            elem = layout["elements"].get(var.element_id, {})
            if var.var_type == "position_x":
                elem.setdefault("position", {})["x"] = value
            elif var.var_type == "position_y":
                elem.setdefault("position", {})["y"] = value
            elif var.var_type == "rotation":
                elem["rotation"] = value
            elif var.var_type == "capacity":
                elem["capacity"] = value

            layout["elements"][var.element_id] = elem
            idx += 1

        return layout

    def get_bounds(self) -> Tuple[np.ndarray, np.ndarray]:
        """返回pymoo所需的上下界"""
        xl = np.array([v.lower_bound for v in self.variables])
        xu = np.array([v.upper_bound for v in self.variables])
        return xl, xu

    @property
    def n_var(self) -> int:
        return len(self.variables)
```

### 4.3 约束管理

```python
# ai-engine/core/optimizer/constraints.py

import numpy as np
from typing import List, Dict
from dataclasses import dataclass

@dataclass
class ConstraintViolation:
    """约束违反"""
    constraint_name: str
    violation_amount: float  # > 0 表示违反
    description: str

class ConstraintManager:
    """
    管理布局优化的硬约束和软约束。
    
    硬约束（必须满足）：
    - 元素不重叠
    - 元素在楼层边界内
    - 安全距离 ≥ 最小值
    - 出口通道可达性
    
    软约束（惩罚函数）：
    - 步行距离 < 目标值
    - 预算 < 上限
    - 相邻性偏好
    """

    def __init__(self):
        self._hard_constraints = []
        self._soft_constraints = []

    def add_hard_constraint(self, name: str, check_fn, repair_fn=None):
        """添加硬约束（带可选修复函数）"""
        self._hard_constraints.append({
            "name": name,
            "check": check_fn,
            "repair": repair_fn,
        })

    def add_soft_constraint(self, name: str, check_fn, weight: float = 1.0):
        """添加软约束（带惩罚权重）"""
        self._soft_constraints.append({
            "name": name,
            "check": check_fn,
            "weight": weight,
        })

    def check_and_repair(self, layout: dict) -> tuple:
        """
        检查所有约束，修复可修复的硬约束。
        
        Returns:
            (repaired_layout, violations, total_penalty)
        """
        violations = []
        total_penalty = 0.0

        # 硬约束检查 + 修复
        for hc in self._hard_constraints:
            violation = hc["check"](layout)
            if violation and violation.violation_amount > 0:
                if hc["repair"]:
                    layout = hc["repair"](layout, violation)
                    # 再次检查
                    new_violation = hc["check"](layout)
                    if new_violation and new_violation.violation_amount > 0:
                        violations.append(new_violation)
                        total_penalty += 1e6  # 无法修复的硬约束，极大惩罚
                else:
                    violations.append(violation)
                    total_penalty += 1e6

        # 软约束检查
        for sc in self._soft_constraints:
            violation = sc["check"](layout)
            if violation and violation.violation_amount > 0:
                violations.append(violation)
                total_penalty += violation.violation_amount * sc["weight"]

        return layout, violations, total_penalty


# ========== 预置约束函数 ==========

def check_no_overlap(layout: dict) -> ConstraintViolation:
    """检查元素不重叠"""
    elements = layout.get("elements", {})
    for id_a, elem_a in elements.items():
        for id_b, elem_b in elements.items():
            if id_a >= id_b:
                continue
            dist = _euclidean_2d(elem_a["position"], elem_b["position"])
            min_dist = (elem_a.get("dimensions", {}).get("width", 1) +
                        elem_b.get("dimensions", {}).get("width", 1)) / 2
            if dist < min_dist:
                return ConstraintViolation(
                    constraint_name="no_overlap",
                    violation_amount=min_dist - dist,
                    description=f"{id_a} overlaps {id_b} by {min_dist - dist:.2f}m",
                )
    return None

def check_within_bounds(layout: dict, bounds: tuple) -> ConstraintViolation:
    """检查元素在楼层边界内"""
    (min_x, min_y), (max_x, max_y) = bounds
    for elem_id, elem in layout.get("elements", {}).items():
        pos = elem.get("position", {})
        x, y = pos.get("x", 0), pos.get("y", 0)
        if x < min_x or x > max_x or y < min_y or y > max_y:
            return ConstraintViolation(
                constraint_name="within_bounds",
                violation_amount=max(min_x - x, x - max_x, min_y - y, y - max_y, 0),
                description=f"{elem_id} out of bounds at ({x:.1f}, {y:.1f})",
            )
    return None

def repair_within_bounds(layout: dict, violation: ConstraintViolation, bounds: tuple) -> dict:
    """将越界元素夹回边界内"""
    (min_x, min_y), (max_x, max_y) = bounds
    for elem_id, elem in layout.get("elements", {}).items():
        pos = elem.get("position", {})
        pos["x"] = max(min_x, min(max_x, pos.get("x", 0)))
        pos["y"] = max(min_y, min(max_y, pos.get("y", 0)))
    return layout

def check_safety_distance(layout: dict, min_safety: float = 1.5) -> ConstraintViolation:
    """检查安全距离"""
    elements = layout.get("elements", {})
    for id_a, elem_a in elements.items():
        for id_b, elem_b in elements.items():
            if id_a >= id_b:
                continue
            dist = _euclidean_2d(elem_a["position"], elem_b["position"])
            if dist < min_safety:
                return ConstraintViolation(
                    constraint_name="safety_distance",
                    violation_amount=min_safety - dist,
                    description=f"{id_a} too close to {id_b}: {dist:.2f}m < {min_safety}m",
                )
    return None

def check_max_walking_distance(layout: dict, max_distance: float = 50.0) -> ConstraintViolation:
    """软约束：最大步行距离"""
    elements = list(layout.get("elements", {}).values())
    if len(elements) < 2:
        return None
    # 计算最远两元素距离
    max_dist = 0
    for i, a in enumerate(elements):
        for b in elements[i+1:]:
            d = _euclidean_2d(a["position"], b["position"])
            max_dist = max(max_dist, d)
    if max_dist > max_distance:
        return ConstraintViolation(
            constraint_name="max_walking_distance",
            violation_amount=max_dist - max_distance,
            description=f"Max walking distance {max_dist:.1f}m exceeds {max_distance}m",
        )
    return None

def _euclidean_2d(pos_a: dict, pos_b: dict) -> float:
    dx = pos_a.get("x", 0) - pos_b.get("x", 0)
    dy = pos_a.get("y", 0) - pos_b.get("y", 0)
    return (dx**2 + dy**2) ** 0.5
```

### 4.4 布局优化问题定义（pymoo）

```python
# ai-engine/core/optimizer/layout_problem.py

import numpy as np
from pymoo.core.problem import Problem
from core.optimizer.layout_encoding import LayoutEncoder
from core.optimizer.constraints import ConstraintManager

class LayoutOptimizationProblem(Problem):
    """
    pymoo问题定义：空间布局优化
    
    目标函数（从DES仿真结果计算）：
    - f1: -throughput（最大化 → 取负）
    - f2: avg_lead_time（最小化）
    - f3: -OEE（最大化 → 取负）
    
    约束：
    - 通过ConstraintManager处理
    """

    def __init__(self, encoder: LayoutEncoder, constraint_mgr: ConstraintManager,
                 des_evaluator, n_obj: int = 2):
        self.encoder = encoder
        self.constraint_mgr = constraint_mgr
        self.des_evaluator = des_evaluator

        xl, xu = encoder.get_bounds()

        super().__init__(
            n_var=encoder.n_var,
            n_obj=n_obj,
            n_constr=0,  # 约束通过惩罚函数处理
            xl=xl,
            xu=xu,
        )

    def _evaluate(self, X, out, *args, **kwargs):
        """评估种群"""
        F = np.zeros((X.shape[0], self.n_obj))

        for i, x in enumerate(X):
            # 1. 解码
            layout = self.encoder.decode(x)

            # 2. 约束检查+修复
            layout, violations, penalty = self.constraint_mgr.check_and_repair(layout)

            # 3. 转换为DES配置并运行仿真
            des_config = self._layout_to_des_config(layout)
            results = self.des_evaluator(des_config)

            # 4. 计算适应度
            throughput = results.get("throughput", 0)
            avg_lead_time = results.get("avg_cycle_time", float('inf'))

            # 加上约束惩罚
            F[i, 0] = -throughput + penalty      # 最大化throughput
            F[i, 1] = avg_lead_time + penalty    # 最小化lead time

        out["F"] = F

    def _layout_to_des_config(self, layout: dict) -> dict:
        """将布局配置转换为DES仿真配置"""
        elements = layout.get("elements", {})
        routes = layout.get("routes", [])

        # 生成process配置
        processes = {}
        for elem_id, elem in elements.items():
            if elem.get("type") in ("checkpoint", "buffer", "operator_station"):
                processes[elem_id] = {
                    "capacity": elem.get("capacity", 3),
                    "meanServiceTime": elem.get("meanServiceTime", 2.0),
                    "dispatching": elem.get("dispatchPolicy", "fifo"),
                }

        # 生成路由配置
        routing = {"nodes": [], "edges": []}
        for elem_id, elem in elements.items():
            is_entry = elem.get("type") == "entry"
            is_exit = elem.get("type") == "exit"
            routing["nodes"].append({
                "id": elem_id,
                "processId": elem_id,
                "isEntry": is_entry,
                "isExit": is_exit,
            })
        for route in routes:
            routing["edges"].append({
                "from": route["fromId"],
                "to": route["toId"],
                "probability": route.get("probability", 1.0),
            })

        # 计算步行距离作为transit_time
        for route in routes:
            from_elem = elements.get(route["fromId"], {})
            to_elem = elements.get(route["toId"], {})
            dist = _euclidean_2d(from_elem.get("position", {}), to_elem.get("position", {}))
            # 假设步行速度1.2m/s → 转换为分钟
            transit_time = dist / 1.2 / 60
            processes.setdefault(route["fromId"], {})["transitTime"] = transit_time

        return {
            "sceneType": "trafficops",
            "sceneId": "layout-optimization",
            "simulationTime": 480,
            "replications": 3,
            "moduleConfig": {
                "processes": processes,
                "routing": routing,
                "arrivalRate": layout.get("arrivalRate", 8.0),
            },
        }

def _euclidean_2d(a, b):
    return ((a.get("x",0)-b.get("x",0))**2 + (a.get("y",0)-b.get("y",0))**2) ** 0.5
```

### 4.5 优化API端点

```yaml
POST /ai/layout/optimize:
  description: 运行空间布局优化
  body:
    baseLayout: FacilityLayout    # 基础布局
    movableElements: ["cp-1", "cp-2", "buffer-1"]  # 可移动元素ID
    adjustableCapacities: ["cp-1", "cp-2"]          # 可调容量元素
    floorBounds: [[0, 0], [100, 60]]                # 楼层边界(m)
    objectives: ["throughput", "lead_time"]          # 优化目标
    constraints:
      - {type: "safety_distance", params: {min: 1.5}, hard: true}
      - {type: "max_walking_distance", params: {max: 50}, hard: false, weight: 10}
      - {type: "budget", params: {max: 500000}, hard: true}
    populationSize: 50
    generations: 100
    arrivalRate: 8.0
    surgeEvents: [...]
  response:
    paretoFront:
      - solution_id: 1
        layout: FacilityLayout
        objectives: {throughput: 450, lead_time: 8.2}
        constraint_violations: []
        is_knee_point: true
      - solution_id: 2
        ...
    hypervolume: 0.87
    convergence_history: [...]
    total_evaluations: 5000
    elapsed_seconds: 120

GET /ai/layout/optimize/{job_id}/status:
  description: 查询优化任务状态（异步）

POST /ai/layout/validate:
  description: 验证布局是否满足约束
  body: FacilityLayout
  response:
    valid: false
    violations:
      - {constraint: "safety_distance", amount: 0.3, description: "..."}
```

---

## 5. OEE 指标计算

ICA要求优化目标包含 **OEE = Availability × Performance × Quality**。

```python
# core/des/kpis/oee.py

def compute_oee(processes: list, completed: list, sim_time: float,
                planned_cycle_time: float = None, quality_rate: float = 0.98) -> dict:
    """
    计算OEE（Overall Equipment Effectiveness）
    
    Availability = 运行时间 / 计划运行时间
    Performance = (理想周期时间 × 产出数) / 运行时间  
    Quality = 合格品数 / 总产出数
    OEE = A × P × Q
    """
    total_downtime = sum(
        p.collect_kpis().get("reliability", {}).get("total_downtime", 0)
        for p in processes
    )
    
    planned_time = sim_time  # 假设全部为计划运行时间
    operating_time = planned_time - total_downtime
    
    # Availability
    availability = operating_time / planned_time if planned_time > 0 else 0
    
    # Performance
    throughput = len(completed)
    if planned_cycle_time is None:
        # 用理论最小周期时间估算
        planned_cycle_time = sum(
            p.mean_service_time for p in processes
        ) if processes else 1.0
    ideal_output = operating_time / planned_cycle_time if planned_cycle_time > 0 else 0
    performance = throughput / ideal_output if ideal_output > 0 else 0
    performance = min(performance, 1.0)  # 不超过100%
    
    # Quality（仿真中默认用配置值，真实场景从数据获取）
    quality = quality_rate
    
    oee = availability * performance * quality
    
    return {
        "oee": round(oee, 4),
        "availability": round(availability, 4),
        "performance": round(performance, 4),
        "quality": round(quality, 4),
        "operating_time": round(operating_time, 1),
        "total_downtime": round(total_downtime, 1),
        "throughput": throughput,
    }
```

---

## 6. 前端集成

### 6.1 新路由

```typescript
// 布局优化模块路由
{
  path: '/layout',
  children: [
    { path: 'editor', name: 'LayoutEditor', component: LayoutEditorView },
    { path: 'optimize', name: 'LayoutOptimize', component: LayoutOptimizeView },
    { path: 'compare', name: 'LayoutCompare', component: LayoutCompareView },
    { path: 'bim-import', name: 'BimImport', component: BimImportView },
  ]
}
```

### 6.2 前端工作量估计

| 组件 | 复杂度 | 预估工时 |
|------|--------|----------|
| BimImportView | 中 | 2天（上传+预览+图层切换） |
| LayoutEditorView | **高** | 5天（Three.js拖拽+连线+属性面板） |
| LayoutOptimizeView | 中 | 2天（复用AiOptimizer+布局预览） |
| LayoutCompareView | 中 | 2天（双栏布局对比+KPI差异） |
| SankeyChart.vue | 低 | 1天（ECharts Sankey） |
| BottleneckHeatmap.vue | 中 | 2天（Canvas overlay） |

---

## 7. 依赖与部署

### 7.1 新增依赖

**AI Engine (Python):**
```
ifcopenshell>=0.7.0    # IFC解析
trimesh>=4.0           # 几何处理
pygltflib>=1.16        # glTF导出
```

**Frontend (npm):**
```
three (已有)
@types/three (已有)
```

### 7.2 存储需求

| 数据 | 估计大小 | 存储位置 |
|------|----------|----------|
| IFC文件 | 50-200MB/文件 | /data/bim/ (volume mount) |
| glTF模型 | 10-50MB/文件 | /data/bim/gltf/ |
| 布局配置 | <1MB/文件 | PostgreSQL JSONB |
| 优化结果 | <10MB/任务 | PostgreSQL + /data/optimization/ |

---

## 8. 实施计划

```
W5 (Day 1-3): IfcOpenShell解析器
  - IFC文件上传API
  - 元素提取 + 图层分类
  - glTF转换（基础）
  
W5 (Day 4-5): BimImportView前端
  - 上传界面
  - Three.js glTF加载
  - 图层切换

W6 (Day 1-5): LayoutEditorView
  - Three.js 2D俯视图
  - 元素库 + 拖拽放置
  - 属性面板
  - 连线编辑（路由）

W7 (Day 1-3): 空间编码 + 约束系统
  - LayoutEncoder
  - ConstraintManager + 预置约束
  - 单元测试

W7 (Day 4-5): pymoo LayoutOptimizationProblem
  - 问题定义
  - DES评估集成
  - 端到端测试

W8 (Day 1-3): LayoutOptimizeView + API
  - 优化任务提交/状态查询
  - 复用AiOptimizer组件 + 布局预览
  - Pareto前沿上点击方案 → 3D预览

W8 (Day 4-5): OEE + 增强报告
  - OEE计算模块
  - LayoutCompareView（双栏对比）

W9-10: 集成测试 + ICA场景验证
  - ICA Immigration Hall布局优化端到端
  - 性能测试（50个元素 × 100代 × 3 replication）
  - 文档 + 部署
```

---

## 9. 与现有系统的关系

```
现有系统                          新增（Phase 2）
──────────                        ──────────────
TrafficOps仿真器 ◄────────────── 布局编辑器生成的DES配置
AiOptimizer组件  ◄────────────── LayoutOptimizeView复用
DigitalTwinView  ◄────────────── BIM导入的glTF模型
NSGA-II优化器    ◄────────────── LayoutOptimizationProblem
DAG路由引擎(Phase 1) ◄────────── 布局编辑器定义的路由
```

**关键原则：Phase 2 建立在 Phase 1 的 DAG路由引擎之上。Phase 1 必须先完成。**
