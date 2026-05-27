# 空间热力可视化引擎 — 技术规格书

> **文档版本:** v1.1
> **日期:** 2026-03-19
> **更新:** 2026-04-08
> **作者:** AzureBot (DE #3)
> **状态:** 🔄 实现中（32 项验收标准待逐一确认）
> **关联:** SPEC_3D_DIGITAL_TWIN.md / DES Framework / Core Platform

---

## 一、背景与定位

### 1.1 问题陈述

当前各行业模块（HeatOps、SMTOps、FMS、TelcoOps）均有空间感知数据——传感器坐标、设备位置、区域温度——但没有统一的空间热力可视化能力。每个模块要么用表格展示，要么用简单的 ECharts 折线图，无法直观呈现**空间分布规律**（热点、冷点、梯度）。

### 1.2 参考目标

竞品（Autodesk Forma、NVIDIA Omniverse）的核心视觉能力：热力图叠加在设施三维模型上，Zone/Variable 实时切换，颜色梯度编码物理量（温度、湿度、能耗、利用率）。

### 1.3 架构决策

**空间热力可视化引擎放基盘（core platform），不放行业模块层。**

理由与 DES 引擎完全对称：
- DES 引擎（SimPy）放基盘，各模块注册 Scene → 引擎不感知行业
- 空间引擎放基盘，各模块注册 SpatialScene → 引擎不感知行业
- 通用部分（FDM 求解器、GLB 渲染、色阶映射、WebSocket 更新）只写一次
- 行业差异（传感器字段、物理模型、阈值）只在各自的 SpatialScene 适配层

### 1.4 交付分期

| Phase | 内容 | 工期 | 优先级 |
|-------|------|------|--------|
| **Phase 1** | 2.5D 热力图（Leaflet + heatmap.js，平面图叠加） | 2~3 天 | 🔴 高 |
| **Phase 2** | FDM 热传导求解器（AI Engine，Python） | 3~5 天 | 🟠 中 |
| **Phase 3** | Three.js 3D 模型 + 热力纹理（真三维） | 2~3 周 | 🟡 按需 |

Phase 1 优先交付，Phase 2 提升物理精度，Phase 3 等具体客户需求。

---

## 二、整体架构

```
┌─────────────────────────────────────────────────────────┐
│                   前端 (Vue 3 + TS)                      │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │        SpatialHeatmapPanel.vue (基盘组件)        │    │
│  │  ┌──────────────┐  ┌───────────────────────┐   │    │
│  │  │ ControlPanel │  │  HeatmapCanvas        │   │    │
│  │  │ Zone切换      │  │  Phase1: Leaflet 2.5D │   │    │
│  │  │ Variable切换  │  │  Phase3: Three.js 3D  │   │    │
│  │  │ 时间轴        │  │  色阶图例              │   │    │
│  │  └──────────────┘  └───────────────────────┘   │    │
│  └────────────────────────────────────────────────┘    │
│                         ↕ WebSocket / REST              │
│  ┌────────────────────────────────────────────────┐    │
│  │         行业模块 SpatialScene 注册               │    │
│  │  HeatOpsSpatialScene  SMTOpsSpatialScene  ...   │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP
┌─────────────────────────────────────────────────────────┐
│              Java Backend (/api/v1/spatial/*)            │
│  SpatialController → SpatialService → 各行业数据源       │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP
┌─────────────────────────────────────────────────────────┐
│           Python AI Engine (/ai/spatial/*)               │
│  ┌─────────────────────────────────────────────────┐   │
│  │              core/spatial/                       │   │
│  │  fdm_solver.py    插值器        色阶映射器         │   │
│  │  场景注册表        WebSocket推送器                 │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │heatops_scene │  │smtops_scene  │  │fms_scene    │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 三、AI Engine — 计算层

### 3.1 目录结构

```
ai-engine/
└── core/
    └── spatial/
        ├── __init__.py
        ├── fdm_solver.py          # 2D 有限差分热传导求解器
        ├── interpolator.py        # 传感器点 → 网格插值（IDW/RBF）
        ├── colormap.py            # 颜色梯度映射（绿→黄→红）
        ├── scene_registry.py      # 行业场景注册表
        └── router.py             # FastAPI 路由 /ai/spatial/*

└── scenes/
    ├── heatops_spatial.py         # HeatOps 换热站热力场景
    ├── smtops_spatial.py          # SMTOps 洁净室温湿度场景
    ├── fms_spatial.py             # FMS 楼层能耗场景
    └── telcoops_spatial.py        # TelcoOps 链路地理热力场景
```

### 3.2 FDM 求解器（`fdm_solver.py`）

**目的**：给定边界条件和热源，计算稳态二维温度分布，精度远高于简单插值。

**接口定义**：

```python
class FDMSolverRequest(BaseModel):
    grid_width: int          # 网格列数，默认 100
    grid_height: int         # 网格行数，默认 100
    boundary_temp: float     # 边界温度 (°C)，默认 22.0
    heat_sources: List[HeatSource]   # 热源列表
    max_iterations: int = 500        # 最大迭代次数
    tolerance: float = 1e-4          # 收敛阈值

class HeatSource(BaseModel):
    x: float                 # 归一化坐标 [0,1]
    y: float
    value: float             # 热源强度（等效温度贡献）
    radius: float = 0.05     # 影响半径（归一化）

class FDMSolverResult(BaseModel):
    grid: List[List[float]]  # 100×100 温度矩阵
    min_val: float
    max_val: float
    iterations: int
    converged: bool
    elapsed_ms: float
```

**算法**：高斯-赛德尔迭代法（Gauss-Seidel），NumPy 向量化，100×100 网格约 50ms。

```python
# 核心迭代（简化）
def solve(grid, heat_sources, max_iter, tol):
    for iteration in range(max_iter):
        old_grid = grid.copy()
        # 内部节点：四邻居均值
        grid[1:-1, 1:-1] = (
            grid[:-2, 1:-1] + grid[2:, 1:-1] +
            grid[1:-1, :-2] + grid[1:-1, 2:]
        ) / 4.0
        # 施加热源边界条件
        for src in heat_sources:
            apply_heat_source(grid, src)
        # 收敛判断
        if np.max(np.abs(grid - old_grid)) < tol:
            return grid, iteration
    return grid, max_iter
```

### 3.3 插值器（`interpolator.py`）

**用途**：当无法做 FDM（无楼层模型）时，把离散传感器点插值为连续热力网格。

支持两种方法：

| 方法 | 适用场景 | 精度 | 速度 |
|------|----------|------|------|
| **IDW**（反距离加权） | 传感器分布均匀 | 中 | ⚡ 快 |
| **RBF**（径向基函数） | 传感器稀疏/不均匀 | 高 | 慢 |

```python
class InterpolatorRequest(BaseModel):
    points: List[SensorPoint]    # 传感器点（x, y, value）
    grid_resolution: int = 100   # 输出网格分辨率
    method: Literal["idw", "rbf"] = "idw"
    power: float = 2.0           # IDW 幂次
```

### 3.4 行业场景注册表（`scene_registry.py`）

完全对称 DES SceneRegistry：

```python
class SpatialSceneDefinition:
    scene_id: str           # e.g. "heatops-station-heat"
    module: str             # e.g. "heatops"
    display_name: str
    variables: List[SpatialVariable]   # 可切换的物理量
    zones: List[SpatialZone]           # 区域定义
    data_fetcher: Callable             # 从 DB 拉数据
    solver: Literal["fdm", "idw", "rbf", "passthrough"]
    update_interval_sec: int = 30

class SpatialVariable:
    key: str                # e.g. "temperature"
    label: str              # e.g. "供水温度"
    unit: str               # e.g. "°C"
    min_val: float
    max_val: float
    colormap: str = "thermal"   # thermal / cool / plasma
```

### 3.5 API 路由（`router.py`）

```
POST /ai/spatial/solve          # FDM 求解（通用）
POST /ai/spatial/interpolate    # 传感器点插值（通用）
GET  /ai/spatial/scenes         # 已注册场景列表
POST /ai/spatial/{scene_id}/compute   # 指定场景计算热力网格
GET  /ai/spatial/{scene_id}/stream    # SSE 实时推送（30s 间隔）
```

**`/ai/spatial/{scene_id}/compute` 响应格式**：

```json
{
  "scene_id": "heatops-station-heat",
  "variable": "supply_temp",
  "zone": "all",
  "timestamp": "2026-03-19T00:00:00Z",
  "grid": {
    "width": 100,
    "height": 100,
    "values": [[22.1, 22.3, ...], ...],
    "min": 18.0,
    "max": 85.0
  },
  "points": [
    {"x": 0.12, "y": 0.45, "label": "HX-001", "value": 72.3}
  ],
  "solver": "fdm",
  "elapsed_ms": 48
}
```

---

## 四、Java Backend — 数据聚合层

### 4.1 目录结构

```
backend/src/main/java/com/datamesh/agent/
└── spatial/
    ├── controller/
    │   └── SpatialController.java    # /api/v1/spatial/*
    ├── service/
    │   └── SpatialService.java       # 数据聚合 + AI Engine 调用
    └── dto/
        ├── SpatialComputeRequest.java
        └── SpatialGridResponse.java
```

### 4.2 Controller API

```
GET  /api/v1/spatial/scenes                         # 所有可用场景
POST /api/v1/spatial/{scene_id}/compute             # 触发计算，返回热力网格
GET  /api/v1/spatial/{scene_id}/snapshot            # 最新缓存结果（Redis 30s TTL）
```

### 4.3 SpatialService 职责

1. 从对应行业 Repository 拉当前传感器读数
2. 转换为 `SpatialComputeRequest`（归一化坐标 + 物理量值）
3. 调用 AI Engine `/ai/spatial/{scene_id}/compute`
4. 结果缓存到 Redis（key: `spatial:{tenantId}:{sceneId}:{variable}`, TTL 30s）
5. 返回给前端

---

## 五、前端 — 可视化层

### 5.1 目录结构

```
frontend/src/
├── components/
│   └── spatial/
│       ├── SpatialHeatmapPanel.vue      # 主容器（基盘组件）
│       ├── HeatmapCanvas2D.vue          # Phase 1: Leaflet + heatmap.js
│       ├── HeatmapCanvas3D.vue          # Phase 3: Three.js（预留）
│       ├── SpatialControlPanel.vue      # Zone/Variable/时间轴控制
│       ├── ColorScaleLegend.vue         # 色阶图例（含阈值线）
│       └── SensorPointLayer.vue         # 传感器标注点覆盖层
│
└── composables/
    └── useSpatialHeatmap.ts            # 数据获取 + WebSocket 订阅
```

### 5.2 `SpatialHeatmapPanel.vue` — 主组件 Props

```typescript
interface Props {
  sceneId: string                  // e.g. "heatops-station-heat"
  variable?: string                // 默认取 scene 的第一个 variable
  zone?: string                    // 默认 "all"
  floorPlanUrl?: string            // 楼层平面图 URL（Phase 1 背景图）
  modelUrl?: string                // GLB 模型 URL（Phase 3）
  autoRefresh?: boolean            // 默认 true，30s 自动刷新
  showSensorPoints?: boolean       // 默认 true
  height?: string                  // 容器高度，默认 "600px"
}
```

### 5.3 `useSpatialHeatmap.ts` — Composable

```typescript
export function useSpatialHeatmap(sceneId: Ref<string>) {
  const grid = ref<number[][]>([])
  const points = ref<SensorPoint[]>([])
  const meta = ref<SceneMeta | null>(null)
  const loading = ref(false)
  const lastUpdated = ref<Date | null>(null)

  async function fetchSnapshot() { ... }      // REST 拉最新缓存
  async function triggerCompute() { ... }     // 触发重新计算
  function subscribeSSE() { ... }             // 订阅实时推送

  return { grid, points, meta, loading, lastUpdated, fetchSnapshot, triggerCompute }
}
```

### 5.4 Phase 1 渲染方案（`HeatmapCanvas2D.vue`）

技术栈：**Leaflet.js + leaflet-heat 插件**（已在 HeatOps/TrafficOps 使用，无新依赖）

```typescript
// 核心渲染逻辑
function renderHeatmap(grid: number[][], meta: GridMeta) {
  // 将 100×100 矩阵转为 Leaflet heatmap 点集
  const heatPoints: [number, number, number][] = []
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const lat = meta.bounds.south + (row / grid.length) * meta.bounds.height
      const lng = meta.bounds.west  + (col / grid[row].length) * meta.bounds.width
      const intensity = normalize(grid[row][col], meta.min, meta.max)
      heatPoints.push([lat, lng, intensity])
    }
  }
  heatLayer.setLatLngs(heatPoints)
}
```

**色阶配置**（可按 variable 覆盖）：

```typescript
const COLORMAPS = {
  thermal: { gradient: { 0.0: '#313695', 0.3: '#4575b4', 0.5: '#fee090', 0.8: '#f46d43', 1.0: '#a50026' } },
  cool:    { gradient: { 0.0: '#023858', 0.5: '#74add1', 1.0: '#f7f7f7' } },
  plasma:  { gradient: { 0.0: '#0d0887', 0.5: '#cc4778', 1.0: '#f0f921' } },
}
```

### 5.5 Phase 3 渲染方案（`HeatmapCanvas3D.vue`，预留接口）

技术栈：**Three.js + GLTFLoader**（需新增依赖 `three@^0.163`）

关键技术：
- 加载 GLB/GLTF 建筑模型
- 遍历模型 Mesh，将热力值映射为顶点颜色（`VertexColors`）
- 或用投影纹理（`ProjectedMaterial`）避免重建 UV
- 支持楼层切片（`THREE.Plane` clipping）

**预留接口**（Phase 1 时不实现，但 `SpatialHeatmapPanel` 已设计好切换逻辑）：

```typescript
// SpatialHeatmapPanel.vue
const renderMode = ref<'2d' | '3d'>('2d')
// 切换时销毁当前 canvas，挂载另一个
```

---

## 六、行业场景适配层

### 6.1 HeatOps 场景（第一个实现，验证架构）

**场景 ID**: `heatops-station-heat`

```python
# scenes/heatops_spatial.py
HEATOPS_SCENE = SpatialSceneDefinition(
    scene_id="heatops-station-heat",
    module="heatops",
    display_name="换热站热力分布",
    solver="idw",           # 传感器稀疏，用 IDW 插值
    update_interval_sec=60,
    variables=[
        SpatialVariable(key="supply_temp",    label="供水温度",   unit="°C", min_val=40, max_val=90, colormap="thermal"),
        SpatialVariable(key="return_temp",    label="回水温度",   unit="°C", min_val=30, max_val=70, colormap="thermal"),
        SpatialVariable(key="heat_eff",       label="换热效率",   unit="%",  min_val=0,  max_val=100, colormap="cool"),
        SpatialVariable(key="flow_rate",      label="流量",       unit="m³/h", min_val=0, max_val=500, colormap="plasma"),
    ],
    zones=[
        SpatialZone(key="all",        label="全区域"),
        SpatialZone(key="primary",    label="一次侧"),
        SpatialZone(key="secondary",  label="二次侧"),
    ],
    data_fetcher=fetch_heatops_sensor_data,   # 调 DB 拉最新读数
)

def fetch_heatops_sensor_data(tenant_id: str, variable: str, zone: str):
    # 查 heat_station_reading 最新一条，返回:
    # [{"x": 0.12, "y": 0.45, "value": 72.3, "label": "HX-001"}, ...]
    ...
```

**前端入口**（在 HeatOps Dashboard 添加一个 Tab）：

```vue
<!-- HeatOps Dashboard 新增 Tab -->
<SpatialHeatmapPanel
  scene-id="heatops-station-heat"
  variable="supply_temp"
  floor-plan-url="/assets/floorplans/heatops-default.png"
  :show-sensor-points="true"
/>
```

### 6.2 后续行业场景（架构验证后顺序添加）

| 场景 ID | 模块 | 变量 | 求解器 |
|---------|------|------|--------|
| `smtops-cleanroom-env` | SMTOps | 颗粒数/温度/湿度 | FDM（有边界） |
| `fms-floor-energy` | FMS | 能耗/设备密度/温度 | IDW |
| `telcoops-geo-utilization` | TelcoOps | 链路利用率 | IDW（地理坐标） |
| `datacenter-rack-heat` | DataCenterOps（未来） | 机架热密度 | FDM |

---

## 七、数据流 — 完整时序

```
用户打开 HeatOps 空间热力 Tab
    │
    ▼
SpatialHeatmapPanel.vue 挂载
    │  GET /api/v1/spatial/scenes
    ▼
SpatialController → 返回场景元数据（变量列表、Zone列表）
    │
用户选择 Variable = "供水温度"
    │  POST /api/v1/spatial/heatops-station-heat/compute
    ▼
SpatialService
    ├─ 查 Redis: spatial:{tenantId}:heatops-station-heat:supply_temp
    ├─ 命中 → 直接返回缓存（< 5ms）
    └─ 未命中 →
         │  从 heat_station_reading 拉最新读数
         │  POST /ai/spatial/heatops-station-heat/compute
         ▼
    AI Engine SpatialRouter
         │  scene_registry 找到 heatops_spatial
         │  fetch_heatops_sensor_data()
         │  interpolator.idw_interpolate(points, grid=100×100)
         ▼
    返回 100×100 热力网格 JSON
         │
    SpatialService → 写 Redis (TTL 30s) → 返回前端
         │
    HeatmapCanvas2D.vue
         │  renderHeatmap(grid, meta)
         │  Leaflet heatmap 层更新
         ▼
    用户看到颜色分布，传感器标注叠加
         │
    SSE 订阅: GET /ai/spatial/heatops-station-heat/stream
         │  30s 推一次新网格
         ▼
    前端自动更新，无需手动刷新
```

---

## 八、实施计划

### Phase 1（2~3天，立即可做）

**Day 1**
- [ ] AI Engine: `core/spatial/interpolator.py` (IDW，100行)
- [ ] AI Engine: `core/spatial/router.py` (2个端点: /scenes, /compute)
- [ ] AI Engine: `scenes/heatops_spatial.py` 注册第一个场景

**Day 2**
- [ ] Java Backend: `SpatialController` + `SpatialService`（Redis 缓存）
- [ ] 前端: `ColorScaleLegend.vue` + `SensorPointLayer.vue`
- [ ] 前端: `HeatmapCanvas2D.vue`（Leaflet + leaflet-heat）

**Day 3**
- [ ] 前端: `SpatialHeatmapPanel.vue` 组合主组件
- [ ] HeatOps Dashboard: 嵌入第一个 Tab
- [ ] 测试：真实传感器数据 → 热力图渲染，验证端到端

### Phase 2（3~5天，提升物理精度）

- [ ] `fdm_solver.py`：高斯-赛德尔迭代，支持热源边界条件
- [ ] SMTOps 场景：FDM 求解器，温湿度/颗粒数
- [ ] FMS 场景：楼层能耗热力
- [ ] SSE 实时推送

### Phase 3（按需，有具体客户再做）

- [ ] Three.js 渲染层：`HeatmapCanvas3D.vue`
- [ ] GLB 模型加载器 + 热力纹理映射
- [ ] 楼层切片控制
- [ ] BIM Import（参考 docs/archive/specs-wayfinding/BIM-Import-Spec.md）

---

## 九、技术约束与风险

| 风险 | 影响 | 缓解方案 |
|------|------|----------|
| 楼层平面图坐标系不一致 | 热力点位偏移 | 提供坐标校准工具，支持手动标定4个角点 |
| 传感器密度不足导致插值失真 | 热力图不准确 | IDW 降级：传感器 <5个时，显示点图而非热力图 |
| 100×100 网格 JSON 较大（~80KB） | 网络传输慢 | 压缩传输（gzip）；或降低分辨率到 50×50 |
| Three.js 包体积（~570KB gzip） | 首屏加载慢 | 懒加载，仅 Phase 3 场景按需加载 |
| FDM 收敛慢（复杂边界） | 计算超时 | max_iterations=500，超时返回当前最优近似 |

---

## 十、验收标准（Phase 1）

- [ ] HeatOps Dashboard 新增「空间热力」Tab，默认展示供水温度热力图
- [ ] 变量切换（温度/效率/流量）响应时间 < 500ms（Redis 命中）< 3s（重新计算）
- [ ] 传感器标注点正确叠加，hover 显示站点名称和实时值
- [ ] 色阶图例与实际数据范围动态匹配（非 hardcode）
- [ ] 30s 自动刷新，用户无感知
- [ ] 所有 tenant 数据隔离（TenantContext 注入，不会跨租户）

---

## 十一、多渲染器适配层（Multi-Renderer Adapter）

### 11.1 设计原则

**计算层与渲染层完全解耦。** AI Engine 输出标准 JSON 热力网格，不绑定任何渲染器。浏览器、Godot、Unity、Omniverse 均消费同一个数据源，Backend 增加一个 Adapter Layer 做协议转换。

```
AI Engine（计算）
      │
      ▼
Backend API（/api/v1/spatial/*）
      │
      ├──────────────────────────────────────────────┐
      │                                              │
      ▼                                              ▼
[WebRenderer]                              [3D Adapter Layer]
Leaflet 2.5D                         /api/v1/spatial/adapter/*
Three.js 3D                                          │
                                    ┌────────────────┼────────────────┐
                                    ▼                ▼                ▼
                              WebSocket Feed    REST/SSE Feed    USD Adapter
                              Godot Client      Unity Client     Omniverse
```

### 11.2 扩展架构——Backend 新增 Adapter Layer

```
backend/src/main/java/com/datamesh/agent/spatial/
└── adapter/
    ├── SpatialAdapterController.java   # /api/v1/spatial/adapter/*
    ├── WebSocketFeedHandler.java        # Godot / 通用 WS 客户端
    ├── UsdAdapterService.java           # Omniverse USD 输出
    └── dto/
        ├── UsdPrimvarPayload.java
        └── AdapterClientConfig.java
```

**新增 API 端点**：

```
GET  /api/v1/spatial/adapter/feed/{scene_id}     # WebSocket 实时推送（Godot/Unity）
GET  /api/v1/spatial/adapter/usd/{scene_id}      # USD JSON 格式输出（Omniverse）
POST /api/v1/spatial/adapter/register            # 注册外部客户端（推送目标）
```

---

### 11.3 Godot 接入

**接入方式**：WebSocket，消费 `/adapter/feed/{scene_id}`

**Godot 端实现**（GDScript，Godot 4）：

```gdscript
# SpatialHeatmapReceiver.gd
extends Node

@export var scene_id: String = "heatops-station-heat"
@export var api_base: String = "ws://factverse.ai/api/v1"

var ws := WebSocketPeer.new()
var heatmap_texture: ImageTexture
var grid_size := Vector2i(100, 100)

func _ready():
    heatmap_texture = ImageTexture.new()
    connect_feed()

func connect_feed():
    var url = "%s/spatial/adapter/feed/%s" % [api_base, scene_id]
    # 注入 JWT token（从全局 AuthManager 获取）
    ws.connect_to_url(url, ["Authorization: Bearer " + AuthManager.token])

func _process(_delta):
    ws.poll()
    if ws.get_ready_state() == WebSocketPeer.STATE_OPEN:
        while ws.get_available_packet_count() > 0:
            var pkt = ws.get_packet().get_string_from_utf8()
            apply_grid(JSON.parse_string(pkt))

func apply_grid(data: Dictionary):
    var grid: Array = data.get("grid", {}).get("values", [])
    var min_val: float = data.get("grid", {}).get("min", 0.0)
    var max_val: float = data.get("grid", {}).get("max", 100.0)

    var img := Image.create(grid_size.x, grid_size.y, false, Image.FORMAT_RGBF)
    for row in range(grid.size()):
        for col in range(grid[row].size()):
            var t := (grid[row][col] - min_val) / max(max_val - min_val, 0.001)
            img.set_pixel(col, row, thermal_color(t))

    heatmap_texture.set_image(img)
    # 赋给楼层 mesh 的 shader uniform
    $FloorMesh.material_override.set_shader_parameter("heatmap", heatmap_texture)

func thermal_color(t: float) -> Color:
    # 蓝(冷) → 绿 → 黄 → 红(热)
    if t < 0.5:
        return Color(0, t * 2, 1 - t * 2)
    else:
        return Color((t - 0.5) * 2, 1 - (t - 0.5) * 2, 0)
```

**楼层 Shader**（`floor_heatmap.gdshader`）：

```glsl
shader_type spatial;
uniform sampler2D heatmap : hint_default_black;
uniform float opacity : hint_range(0.0, 1.0) = 0.7;

void fragment() {
    vec4 heat = texture(heatmap, UV);
    ALBEDO = mix(vec3(0.2), heat.rgb, opacity);
    EMISSION = heat.rgb * 0.3;  // 发光效果
}
```

**Godot 接入工作量**：3~5天（客户端 + Shader + 坐标系对齐）

---

### 11.4 Unity 接入

**接入方式**：REST + SSE，消费标准 `/api/v1/spatial/{scene_id}/snapshot` 端点（无需新增 Adapter 端点）

**Unity 端实现**（C#）：

```csharp
// SpatialHeatmapReceiver.cs
using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using Newtonsoft.Json.Linq;

public class SpatialHeatmapReceiver : MonoBehaviour
{
    [SerializeField] private string sceneId = "heatops-station-heat";
    [SerializeField] private string apiBase  = "https://factverse.ai/api/v1";
    [SerializeField] private string variable = "supply_temp";
    [SerializeField] private Material floorMaterial;
    [SerializeField] private float refreshInterval = 30f;

    private Texture2D heatmapTex;
    private const int GridSize = 100;

    void Start()
    {
        heatmapTex = new Texture2D(GridSize, GridSize, TextureFormat.RGBA32, false);
        floorMaterial.SetTexture("_HeatmapTex", heatmapTex);
        StartCoroutine(FetchLoop());
    }

    IEnumerator FetchLoop()
    {
        while (true)
        {
            yield return FetchAndApply();
            yield return new WaitForSeconds(refreshInterval);
        }
    }

    IEnumerator FetchAndApply()
    {
        string url = $"{apiBase}/spatial/{sceneId}/snapshot?variable={variable}";
        using var req = UnityWebRequest.Get(url);
        req.SetRequestHeader("Authorization", "Bearer " + AuthManager.Token);
        yield return req.SendWebRequest();

        if (req.result != UnityWebRequest.Result.Success) yield break;

        var json = JObject.Parse(req.downloadHandler.text);
        var data = json["data"];
        float minVal = data["grid"]["min"].Value<float>();
        float maxVal = data["grid"]["max"].Value<float>();
        var values   = data["grid"]["values"] as JArray;

        for (int row = 0; row < GridSize; row++)
        for (int col = 0; col < GridSize; col++)
        {
            float t = (values[row][col].Value<float>() - minVal)
                    / Mathf.Max(maxVal - minVal, 0.001f);
            heatmapTex.SetPixel(col, GridSize - 1 - row, ThermalColor(t));
        }
        heatmapTex.Apply();
    }

    Color ThermalColor(float t)
    {
        if (t < 0.5f) return Color.Lerp(Color.blue, Color.green, t * 2f);
        return Color.Lerp(Color.green, Color.red, (t - 0.5f) * 2f);
    }
}
```

**Unity Shader**（URP Lit 扩展）：

```hlsl
// HeatmapOverlay.shader (URP)
Properties {
    _HeatmapTex ("Heatmap", 2D) = "black" {}
    _Opacity    ("Opacity",  Range(0,1)) = 0.7
    _BaseColor  ("Base Color", Color) = (0.2, 0.2, 0.2, 1)
}

// Fragment:
half4 heat = SAMPLE_TEXTURE2D(_HeatmapTex, sampler_HeatmapTex, input.uv);
half3 final = lerp(_BaseColor.rgb, heat.rgb, _Opacity);
return half4(final, 1.0);
```

**Unity 接入工作量**：3~5天（与 Godot 相近）

---

### 11.5 NVIDIA Omniverse 接入

**接入方式**：USD Primvar + Omniverse Nucleus 同步。这是三者中最复杂的，但也是最强大的——支持双向数据流（Omniverse 场景变化可反向触发我们的仿真）。

#### 11.5.1 数据流

```
Backend API                  USD Adapter              Omniverse Nucleus
    │                             │                         │
    │  GET /spatial/snapshot      │                         │
    │ ──────────────────────────► │                         │
    │                             │  Write USD primvar      │
    │                             │ ──────────────────────► │
    │                             │                         │  Live Sync
    │                             │                         │ ──────────► Omniverse App
```

#### 11.5.2 USD Adapter Service（Backend Java）

```java
// UsdAdapterService.java
@Service
@Slf4j
public class UsdAdapterService {

    // GET /api/v1/spatial/adapter/usd/{sceneId}
    // 返回 USD JSON 格式，供 Omniverse Extension 消费
    public Map<String, Object> toUsdPayload(String sceneId, String variable, UUID tenantId) {
        // 从 Redis 取最新热力网格
        SpatialGridResponse grid = spatialService.getSnapshot(tenantId, sceneId, variable);

        // 转换为 USD primvar 格式
        // primvar: displayColor 数组（每个顶点一个颜色）
        List<float[]> colors = new ArrayList<>();
        for (float[] row : grid.getValues()) {
            for (float val : row) {
                float t = normalize(val, grid.getMin(), grid.getMax());
                colors.add(thermalColor(t));  // [r, g, b]
            }
        }

        return Map.of(
            "prim_path", "/World/Building/Floor_01",
            "primvar_name", "primvars:heatmap_color",
            "interpolation", "varying",  // 顶点级别
            "values", colors,
            "metadata", Map.of(
                "scene_id", sceneId,
                "variable", variable,
                "timestamp", Instant.now().toString(),
                "min", grid.getMin(),
                "max", grid.getMax()
            )
        );
    }
}
```

#### 11.5.3 Omniverse Extension（Python）

在 Omniverse 中运行的 Extension，轮询我们的 API 并写入 USD Stage：

```python
# exts/datamesh.spatial_heatmap/datamesh/spatial_heatmap/extension.py
import omni.ext
import omni.usd
import carb
import asyncio
import aiohttp
from pxr import Usd, UsdGeom, Vt, Gf

class SpatialHeatmapExtension(omni.ext.IExt):

    FACTVERSE_API = "https://factverse.ai/api/v1"
    SCENE_ID      = "heatops-station-heat"
    VARIABLE      = "supply_temp"
    REFRESH_SEC   = 30

    def on_startup(self, ext_id):
        carb.log_info("[DataMesh] SpatialHeatmap Extension started")
        self._task = asyncio.ensure_future(self._poll_loop())

    def on_shutdown(self):
        if self._task:
            self._task.cancel()

    async def _poll_loop(self):
        while True:
            try:
                await self._fetch_and_apply()
            except Exception as e:
                carb.log_warn(f"[DataMesh] Fetch failed: {e}")
            await asyncio.sleep(self.REFRESH_SEC)

    async def _fetch_and_apply(self):
        url = f"{self.FACTVERSE_API}/spatial/adapter/usd/{self.SCENE_ID}"
        params = {"variable": self.VARIABLE}
        headers = {"Authorization": f"Bearer {self._get_token()}"}

        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params, headers=headers) as resp:
                data = await resp.json()

        # USD Stage 写入
        stage = omni.usd.get_context().get_stage()
        prim_path = data["prim_path"]
        primvar_name = data["primvar_name"]
        colors_flat = data["values"]  # [[r,g,b], ...]

        prim = stage.GetPrimAtPath(prim_path)
        if not prim.IsValid():
            carb.log_warn(f"[DataMesh] Prim not found: {prim_path}")
            return

        mesh = UsdGeom.Mesh(prim)
        primvar = mesh.CreatePrimvar(
            primvar_name,
            Sdf.ValueTypeNames.Color3fArray,
            UsdGeom.Tokens.varying
        )
        color_array = Vt.Vec3fArray([Gf.Vec3f(*c) for c in colors_flat])
        primvar.Set(color_array)

        carb.log_info(f"[DataMesh] Heatmap updated: {len(colors_flat)} colors → {prim_path}")

    def _get_token(self):
        # 从 Omniverse 设置或环境变量读取
        return carb.settings.get_settings().get("/datamesh/api_token") or ""
```

#### 11.5.4 双向同步（进阶）

Omniverse → FactVerse 方向：用户在 Omniverse 里调整热源位置 → Extension 监听 USD Stage 变化 → POST 到我们的 `/ai/spatial/{scene_id}/compute`（携带新的热源坐标）→ 重新计算 → 结果写回 USD。

```python
# 监听 USD 变化
from pxr import Tf
listener = Tf.Notice.Register(
    Usd.Notice.ObjectsChanged,
    self._on_stage_changed,
    stage
)

def _on_stage_changed(self, notice, stage):
    changed_paths = [str(p) for p in notice.GetChangedInfoOnlyPaths()]
    if "/World/HeatSources" in str(changed_paths):
        asyncio.ensure_future(self._trigger_recompute())
```

**Omniverse 接入工作量**：2~3周（Extension 开发 + USD 坐标系对齐 + 双向同步）

---

### 11.6 坐标系对齐（三者共同难点）

三个引擎各有自己的坐标系：Godot（Y-up，右手系）、Unity（Y-up，左手系）、Omniverse（Y-up，右手系，厘米单位）。热力网格是归一化 [0,1] 坐标，需要映射到每个引擎的世界坐标。

**解决方案**：在 Backend 的 Adapter 接口中提供坐标变换参数：

```json
// POST /api/v1/spatial/adapter/register
{
  "client_type": "unity",          // godot | unity | omniverse
  "scene_id": "heatops-station-heat",
  "world_bounds": {
    "origin": [0, 0, 0],           // 世界坐标原点对应热力图左下角
    "x_axis": [50, 0, 0],          // 热力图 X 方向对应世界坐标
    "y_axis": [0, 0, -30]          // 热力图 Y 方向对应世界坐标（Unity Z轴）
  },
  "scale": 0.01,                   // 单位换算（米/厘米）
  "flip_y": true                   // Unity/Omniverse UV 翻转
}
```

Backend 存储各客户端的坐标配置，在输出 Adapter 数据时自动做变换。

---

### 11.7 实施计划（多渲染器层）

| Phase | 内容 | 前置条件 | 工期 |
|-------|------|----------|------|
| **R1** | Unity 客户端 + REST 消费 | Phase 1 完成 | 3~5天 |
| **R2** | Godot 客户端 + WebSocket Feed | Phase 1 完成 | 3~5天 |
| **R3** | Omniverse Extension + USD 单向写入 | Phase 2 完成 | 2~3周 |
| **R4** | Omniverse 双向同步 | R3 完成 | 1~2周 |

R1/R2 可并行（两个 DE 各做一个）；R3/R4 需要 Omniverse SDK 环境。

### 11.8 多渲染器验收标准

**Unity（R1）**
- [ ] 楼层 Mesh 实时显示热力颜色，30s 自动刷新
- [ ] 变量切换（温度/效率）在 Unity Inspector 可配置
- [ ] 坐标注册后热力位置与模型对齐（误差 < 0.5m）

**Godot（R2）**
- [ ] WebSocket 断线自动重连
- [ ] 热力 Shader 在 Godot 4 MeshInstance3D 正确渲染
- [ ] FPS 影响 < 2ms/frame

**Omniverse（R3）**
- [ ] Extension 安装后自动轮询，无需手动触发
- [ ] USD primvar 写入后 Live Sync 到其他 Omniverse 客户端
- [ ] 双向同步：移动热源 Prim → 5秒内看到热力图变化

---

## 十二、完整实施路线图

```
2026-03 Week 4   ████ Phase 1: Leaflet 2.5D + HeatOps 场景（基盘验证）
2026-04 Week 1   ████ Phase 2: FDM 求解器 + SMTOps/FMS 场景
2026-04 Week 2   ████ R1: Unity 接入
                 ████ R2: Godot 接入（并行）
2026-04 Week 3+  ████ Phase 3: Three.js 3D（按需）
                 ████ R3: Omniverse Extension（单向）
2026-05+         ████ R4: Omniverse 双向同步
```

每个阶段独立交付，前一阶段的数据管线和 API 是后一阶段的基础，无需重新设计。

---

*本规格书覆盖空间热力引擎全链路：Phase 1~3 浏览器渲染 + 多渲染器适配（Unity / Godot / Omniverse）。建议从 Phase 1 HeatOps 场景开始，逐步扩展。*
