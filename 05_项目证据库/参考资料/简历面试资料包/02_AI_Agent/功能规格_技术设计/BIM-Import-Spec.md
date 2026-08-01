# BIM/IFC 导入引擎 — 详细技术规格

> Version: 1.0 | Date: 2026-02-14 | Author: AzureBot
> Status: Draft — 待 CEO 审核

---

## 1. 目标与范围

### 1.1 目标
为 FactVerse AI Agent 平台增加 **BIM/IFC 文件导入能力**，使用户能够：
1. 上传建筑信息模型 (IFC) 文件
2. 在浏览器中实时 3D 渲染
3. 从 IFC 模型中自动提取设施布局元素（站点、通道、缓冲区等）
4. 将提取的元素直接导入布局编辑器进行 DES 仿真和优化

### 1.2 范围界定

| 在范围内 | 不在范围内（未来） |
|----------|-------------------|
| IFC 2x3 / IFC4 文件解析 | DWG/RVT 原生支持 |
| 浏览器端 3D 渲染 (web-ifc + Three.js) | 服务端渲染/预处理 |
| 空间元素自动识别 | 完整 BIM 属性编辑 |
| 图层分类与开关 | MEP 管线碰撞检测 |
| 坐标系对齐 | GIS 地理坐标集成 |
| 导出到布局编辑器 | 回写 IFC 文件 |
| 楼层切片 | 多文件联合加载 |

### 1.3 ICA 需求映射

| ICA 需求项 | PRD 编号 | 本 Spec 覆盖 |
|-----------|---------|-------------|
| CAD/BIM导入(DWG/IFC)，对齐建筑坐标 | 5.1-2 | ✅ IFC 导入 + 坐标对齐 |
| 3D场景分层（建筑壳/管线/产线/设备/存储/安全区）| 5.1-1 | ✅ 图层系统 |
| 参数化资源（周期时间分布/容量/可靠性/能耗）| 5.1-3 | 部分（元素识别后手动配参数）|
| 虚拟设计验证 | UC1 | ✅ IFC → 布局编辑器 → DES |

---

## 2. 技术架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│                                                             │
│  ┌──────────────┐    ┌────────────────┐    ┌─────────────┐  │
│  │ BIM Upload   │───▶│ IFC Viewer     │───▶│ Layout      │  │
│  │ Component    │    │ (web-ifc +     │    │ Editor      │  │
│  │ (.ifc file)  │    │  Three.js)     │    │ (existing)  │  │
│  └──────────────┘    │                │    └─────────────┘  │
│                      │ • 图层开关     │                      │
│                      │ • 楼层切片     │                      │
│                      │ • 元素选择     │                      │
│                      │ • 属性面板     │                      │
│                      └────────────────┘                      │
│                             │                                │
│                     元素提取 & 配置                           │
│                             │                                │
│                      ┌──────▼──────┐                         │
│                      │ Element     │                         │
│                      │ Mapper      │                         │
│                      │ IFC→Layout  │                         │
│                      └──────┬──────┘                         │
│                             │                                │
└─────────────────────────────┼────────────────────────────────┘
                              │ POST /api/v1/layouts
                       ┌──────▼──────┐
                       │  Backend    │
                       │ (保存布局)   │
                       └─────────────┘
```

### 2.2 关键决策：前端优先 vs 后端优先

| 方案 | 优点 | 缺点 |
|------|------|------|
| **A: 纯前端 (web-ifc)** | 零服务端负载；实时渲染；用户体验好 | 大文件(>100MB)可能卡顿；WASM加载时间 |
| B: 后端处理 (IfcOpenShell) | 支持超大文件；服务端预处理 | 需要上传等待；Docker镜像膨胀；Python C++扩展难装 |
| C: 混合方案 | 两者优点 | 复杂度高 |

**选择方案 A（纯前端）** — 理由：
1. ICA 建筑模型通常 50-200MB，web-ifc 的 WASM 引擎可处理
2. 无需增加服务端依赖（IfcOpenShell 安装复杂，需要编译C++）
3. Three.js 已集成，web-ifc 有成熟的 Three.js 适配器
4. 用户体验更好：拖拽上传→即时渲染，无需等待服务端处理
5. 未来如需服务端预处理，可增量添加

> **架构原则（CEO 指示）**：高级 3D 渲染交给 FactVerse 平台处理。本模块定位是**轻量级数据提取工具**——重点是从 IFC 中提取空间元素、坐标、属性，转换为 DES 仿真可用的布局配置。3D 预览只需要够用即可（基础几何 + 线框），不追求渲染质量。未来需要照片级渲染、光影、材质时，调用 FactVerse 的 3D 引擎。

### 2.3 技术栈

| 组件 | 库 | 版本 | 用途 |
|------|----|----|------|
| IFC 解析 | `web-ifc` | ^0.0.57 | WASM IFC 解析器 |
| 3D 渲染 | `three` | 已有 | WebGL 3D 场景 |
| IFC→Three.js | `web-ifc-three` | ^0.0.131 | IFC 几何→Three.js Mesh |
| 前端框架 | Vue 3 + TypeScript | 已有 | — |

---

## 3. 数据模型

### 3.1 IFC 元素分类

IFC 模型包含数百种实体类型。我们关注以下与设施布局相关的类型：

```typescript
// IFC 元素到布局元素的映射规则
interface IfcElementMapping {
  // IFC 实体类型 → 布局元素类型
  mappingRules: {
    // 建筑结构
    'IFCWALL': 'wall',
    'IFCWALLSTANDARDCASE': 'wall',
    'IFCSLAB': 'slab',          // 楼板/天花板
    'IFCCOLUMN': 'column',
    'IFCSTAIR': 'stair',
    'IFCRAMP': 'ramp',
    'IFCDOOR': 'door',          // 门 → 可能是出入口
    'IFCWINDOW': 'window',
    
    // 空间
    'IFCSPACE': 'space',         // 房间/区域 → 潜在的缓冲区或工作站
    'IFCZONE': 'zone',           // 区域分组
    
    // 设备/家具
    'IFCFURNISHINGELEMENT': 'furniture',  // 家具 → 检查台/柜台
    'IFCFLOWSEGMENT': 'pipe',            // 管道
    'IFCFLOWTERMINAL': 'terminal',        // 末端设备
    'IFCTRANSPORTELEMENT': 'conveyor',    // 传送设备
    
    // 通用
    'IFCBUILDINGELEMENTPROXY': 'generic', // 通用代理 → 需人工识别
  }
}
```

### 3.2 图层分类系统

```typescript
// 图层定义 — 用于 3D 场景显示开关
interface BimLayer {
  id: string
  name: string                    // 显示名称（i18n）
  ifcTypes: string[]              // 该图层包含的 IFC 实体类型
  color: string                   // 默认颜色
  opacity: number                 // 默认透明度
  visible: boolean                // 默认是否显示
  selectable: boolean             // 是否可点击选中
}

const DEFAULT_LAYERS: BimLayer[] = [
  {
    id: 'structure',
    name: '建筑结构',
    ifcTypes: ['IFCWALL', 'IFCWALLSTANDARDCASE', 'IFCSLAB', 'IFCCOLUMN', 'IFCSTAIR', 'IFCRAMP'],
    color: '#E0E0E0',
    opacity: 0.3,
    visible: true,
    selectable: false,
  },
  {
    id: 'openings',
    name: '门窗/出入口',
    ifcTypes: ['IFCDOOR', 'IFCWINDOW'],
    color: '#42A5F5',
    opacity: 0.7,
    visible: true,
    selectable: true,
  },
  {
    id: 'spaces',
    name: '空间/区域',
    ifcTypes: ['IFCSPACE', 'IFCZONE'],
    color: '#66BB6A',
    opacity: 0.2,
    visible: true,
    selectable: true,
  },
  {
    id: 'equipment',
    name: '设备/家具',
    ifcTypes: ['IFCFURNISHINGELEMENT', 'IFCBUILDINGELEMENTPROXY', 'IFCTRANSPORTELEMENT'],
    color: '#FFA726',
    opacity: 0.8,
    visible: true,
    selectable: true,
  },
  {
    id: 'mep',
    name: 'MEP管线',
    ifcTypes: ['IFCFLOWSEGMENT', 'IFCFLOWTERMINAL', 'IFCDUCTFITTING', 'IFCPIPEFITTING'],
    color: '#AB47BC',
    opacity: 0.5,
    visible: false,      // 默认隐藏
    selectable: false,
  },
]
```

### 3.3 提取后的布局元素结构

```typescript
// 从 IFC 元素提取后，映射到布局编辑器的元素格式
interface ExtractedLayoutElement {
  id: string                      // 生成的唯一ID
  ifcId: number                   // 原始 IFC expressID
  ifcType: string                 // 原始 IFC 类型 (e.g., 'IFCDOOR')
  name: string                    // IFC 元素名称
  
  // 映射后的布局属性
  layoutType: 'entry' | 'exit' | 'checkpoint' | 'buffer' | 'aisle' | 'operator_station'
  position: { x: number, y: number }    // 2D 平面坐标 (米)
  dimensions: { width: number, depth: number }
  rotation: number                       // 弧度
  
  // 用户可配置（提取后手动设置）
  capacity: number
  meanServiceTime: number
  movable: boolean
  adjustable: boolean
  
  // 元数据
  properties: Record<string, any>       // IFC 属性集
  layer: string                         // 所属图层ID
  floor: number                         // 楼层号
}
```

### 3.4 BIM 项目存储

```typescript
// 数据库模型（扩展 facility_layouts）
interface BimProject {
  id: number
  name: string
  description: string
  
  // IFC 元数据（不存原始文件，存解析后的数据）
  ifcMetadata: {
    fileName: string
    fileSize: number               // bytes
    schema: string                 // 'IFC2X3' | 'IFC4' | 'IFC4X3'
    buildingName: string
    siteName: string
    floors: { id: number, name: string, elevation: number }[]
    elementCount: number
    uploadedAt: string
  }
  
  // 图层配置（用户可能修改了可见性等）
  layerConfig: BimLayer[]
  
  // 提取的布局元素
  extractedElements: ExtractedLayoutElement[]
  
  // 关联的布局 ID（导入到布局编辑器后）
  linkedLayoutId: number | null
}
```

---

## 4. 功能设计

### 4.1 BIM 上传与加载

#### 流程

```
用户拖拽 .ifc 文件
    │
    ▼
前端 FileReader 读取为 ArrayBuffer
    │
    ▼
web-ifc WASM 初始化
    │ (首次加载 ~2-3s，WASM 文件 ~5MB)
    ▼
IfcAPI.OpenModel(buffer)
    │
    ▼
获取所有几何体 → 转换为 Three.js BufferGeometry
    │
    ▼
按 IFC 类型分类到图层
    │
    ▼
渲染到 Three.js 场景
    │
    ▼
提取元素列表 → 显示属性面板
```

#### 性能预期

| 文件大小 | 元素数量 | 加载时间 | 内存占用 |
|----------|---------|---------|---------|
| 10MB | ~5,000 | 2-5s | ~100MB |
| 50MB | ~25,000 | 10-20s | ~300MB |
| 100MB | ~50,000 | 20-40s | ~600MB |
| 200MB+ | ~100,000+ | 60s+ | ~1GB+ |

> ⚠️ 对于 200MB+ 的文件，建议提供进度条和分批加载选项

#### 文件格式支持

| 格式 | 支持等级 | 方案 |
|------|---------|------|
| IFC 2x3 (.ifc) | ✅ 完全支持 | web-ifc 原生 |
| IFC4 (.ifc) | ✅ 完全支持 | web-ifc 原生 |
| IFC4x3 (.ifc) | ✅ 完全支持 | web-ifc 原生 |
| IFC-ZIP (.ifczip) | ✅ 支持 | 前端解压后加载 |
| DWG (.dwg) | ❌ 不支持 | 建议用户用 ODA File Converter 转 IFC |
| Revit (.rvt) | ❌ 不支持 | 建议用户从 Revit 导出 IFC |

### 4.2 3D 渲染与交互

#### 场景设置

```typescript
// IFC 模型使用独立的 Three.js 场景
// 与现有 DigitalTwinView 的 3D 场景分离

interface BimViewerConfig {
  // 相机
  cameraType: 'perspective' | 'orthographic'  // 默认 perspective
  
  // 控制
  controls: 'orbit'   // OrbitControls
  
  // 渲染
  enableShadows: boolean      // 默认 false（性能考虑）
  enableSSAO: boolean         // 默认 false
  backgroundColor: string     // '#1a1a2e'（暗色主题）
  
  // 裁剪
  enableClipping: boolean     // 楼层切片
  clippingPlane: 'xy' | 'xz' | 'yz'
  clippingHeight: number      // 裁剪高度 (米)
}
```

#### 交互功能

| 功能 | 实现方式 | 优先级 |
|------|---------|--------|
| 旋转/缩放/平移 | OrbitControls | P0 |
| 点击选中元素 | Raycasting + highlight | P0 |
| 图层开关 | Checkbox → mesh.visible | P0 |
| 楼层切片 | ClippingPlane 滑块 | P1 |
| 元素搜索 | 按名称/类型过滤 | P1 |
| 测量工具 | 两点距离测量 | P2 |
| 剖面视图 | 正交相机 + 裁剪 | P2 |
| 透明度调节 | 滑块 → material.opacity | P1 |

### 4.3 元素识别与分类

#### 自动识别规则

```typescript
// 智能元素识别：从 IFC 属性推断布局类型
function classifyElement(ifcType: string, properties: Record<string, any>): string {
  // 1. 基于 IFC 类型的直接映射
  if (ifcType === 'IFCDOOR') {
    // 检查属性判断是入口还是出口
    const name = (properties.Name || '').toLowerCase()
    if (name.includes('entry') || name.includes('entrance') || name.includes('入口')) return 'entry'
    if (name.includes('exit') || name.includes('出口')) return 'exit'
    return 'entry'  // 默认为入口
  }
  
  if (ifcType === 'IFCSPACE') {
    const area = properties.GrossFloorArea || properties.NetFloorArea || 0
    if (area > 50) return 'buffer'          // 大空间 → 缓冲区/等候区
    if (area > 10) return 'checkpoint'      // 中等空间 → 检查站
    return 'operator_station'               // 小空间 → 操作台
  }
  
  if (ifcType === 'IFCFURNISHINGELEMENT') {
    const name = (properties.Name || '').toLowerCase()
    if (name.includes('desk') || name.includes('counter') || name.includes('booth'))
      return 'checkpoint'
    return 'operator_station'
  }
  
  if (ifcType === 'IFCTRANSPORTELEMENT') return 'aisle'
  
  return 'generic'  // 需要用户手动分类
}
```

#### 坐标系转换

```typescript
// IFC 使用右手坐标系 (Y-up 或 Z-up，取决于文件)
// Three.js 使用右手坐标系 (Y-up)
// 布局编辑器使用 2D 平面 (X-right, Y-down)

function ifcToLayoutCoordinates(
  ifcPosition: { x: number, y: number, z: number },
  ifcUp: 'y' | 'z',            // IFC 文件的 up 轴
  buildingOrigin: { x: number, y: number, z: number },  // 建筑原点
  scaleFactor: number = 1       // 单位换算 (mm → m 等)
): { x: number, y: number } {
  // 1. 平移到建筑原点
  const local = {
    x: (ifcPosition.x - buildingOrigin.x) * scaleFactor,
    y: (ifcPosition.y - buildingOrigin.y) * scaleFactor,
    z: (ifcPosition.z - buildingOrigin.z) * scaleFactor,
  }
  
  // 2. 投影到 2D 平面 (取 XY 平面，忽略高度)
  if (ifcUp === 'z') {
    return { x: local.x, y: local.y }        // Z-up: XY 是地面
  } else {
    return { x: local.x, y: local.z }        // Y-up: XZ 是地面
  }
}

// 自动检测 up 轴
function detectUpAxis(ifcApi: any, modelId: number): 'y' | 'z' {
  // 从 IfcGeometricRepresentationContext 获取
  // 或者通过分析元素的 Z 值分布
  const elements = getAllElements(ifcApi, modelId)
  const zRange = Math.max(...elements.map(e => e.z)) - Math.min(...elements.map(e => e.z))
  const yRange = Math.max(...elements.map(e => e.y)) - Math.min(...elements.map(e => e.y))
  return zRange > yRange ? 'z' : 'y'
}
```

### 4.4 楼层切片

```typescript
interface FloorSlice {
  floorId: number
  floorName: string
  elevation: number        // 楼层标高 (米)
  height: number           // 层高 (米)
  elementCount: number     // 该层元素数量
}

// 从 IFC 中提取楼层信息
function extractFloors(ifcApi: any, modelId: number): FloorSlice[] {
  // IfcBuildingStorey 包含楼层定义
  const storeys = ifcApi.GetLineIDsWithType(modelId, IFCBUILDINGSTOREY)
  return storeys.map(id => {
    const storey = ifcApi.GetLine(modelId, id)
    return {
      floorId: id,
      floorName: storey.Name?.value || `Floor ${id}`,
      elevation: storey.Elevation?.value || 0,
      height: 3.5,  // 默认层高
      elementCount: 0,  // 后续统计
    }
  }).sort((a, b) => a.elevation - b.elevation)
}

// 楼层切片 → Three.js ClippingPlane
function applyFloorSlice(scene: THREE.Scene, floor: FloorSlice) {
  const clipPlane = new THREE.Plane(
    new THREE.Vector3(0, -1, 0),  // 法线向下
    floor.elevation + floor.height // 裁剪高度
  )
  scene.traverse(obj => {
    if (obj instanceof THREE.Mesh) {
      obj.material.clippingPlanes = [clipPlane]
      obj.material.clipShadows = true
    }
  })
}
```

### 4.5 导出到布局编辑器

#### 导出流程

```
用户在 BIM Viewer 中选择元素
    │
    ▼
点击 "导出到布局编辑器"
    │
    ▼
弹出配置对话框：
  • 选择要导出的图层
  • 设置楼层（只导出一个楼层）
  • 确认自动分类结果（可修改）
  • 设置默认参数（容量/服务时间）
    │
    ▼
生成 FacilityLayout JSON
    │
    ▼
保存到 DB (POST /api/v1/layouts)
    │
    ▼
跳转到布局编辑器
```

#### 导出数据转换

```typescript
function exportToLayout(
  selectedElements: ExtractedLayoutElement[],
  floorBounds: [[number, number], [number, number]],
  config: ExportConfig,
): FacilityLayout {
  const elements: Record<string, LayoutElement> = {}
  const routes: LayoutRoute[] = []
  
  for (const elem of selectedElements) {
    elements[elem.id] = {
      type: elem.layoutType,
      position: elem.position,
      dimensions: elem.dimensions,
      rotation: elem.rotation,
      capacity: elem.capacity || config.defaultCapacity,
      mean_service_time: elem.meanServiceTime || config.defaultServiceTime,
      dispatch_policy: 'fifo',
    }
  }
  
  // 自动生成路由：基于空间邻近性
  if (config.autoGenerateRoutes) {
    const entries = selectedElements.filter(e => e.layoutType === 'entry')
    const exits = selectedElements.filter(e => e.layoutType === 'exit')
    const checkpoints = selectedElements.filter(e => 
      e.layoutType === 'checkpoint' || e.layoutType === 'operator_station'
    )
    
    // 简单规则：entry → 最近的 checkpoint → exit
    for (const entry of entries) {
      for (const cp of checkpoints) {
        routes.push({
          from_id: entry.id,
          to_id: cp.id,
          route_type: 'shortest_queue',
          probability: 1 / checkpoints.length,
        })
      }
    }
    for (const cp of checkpoints) {
      for (const exit of exits) {
        routes.push({
          from_id: cp.id,
          to_id: exit.id,
          route_type: 'probability',
          probability: 1 / exits.length,
        })
      }
    }
  }
  
  return { elements, routes, constraints: [], floor_bounds: floorBounds }
}
```

---

## 5. 前端页面设计

### 5.1 路由

```typescript
{
  path: '/bim',
  name: 'BimImport',
  component: BimImportView,
  meta: { title: 'BIM Import', icon: 'Building', permission: 'layout.edit' }
}
```

### 5.2 页面布局

```
┌────────────────────────────────────────────────────────────┐
│ BIM Import                                    [Upload .ifc]│
├──────────┬─────────────────────────────┬───────────────────┤
│ 图层控制  │                             │ 属性面板           │
│          │                             │                   │
│ ☑ 建筑结构│     3D 渲染区域              │ 选中元素: Door #12 │
│ ☑ 门窗   │     (Three.js + web-ifc)     │ 类型: IFCDOOR     │
│ ☑ 空间   │                             │ 名称: Main Entry  │
│ ☑ 设备   │                             │ 尺寸: 2.0×0.3m    │
│ ☐ MEP管线│                             │ 楼层: Ground Floor │
│          │                             │                   │
│──────────│                             │ 映射类型:          │
│ 楼层切片  │                             │ [入口 ▼]          │
│          │                             │ 容量: [1]          │
│ GF ━━●━━ │                             │ 服务时间: [30]s    │
│ 1F ───── │                             │ ☑ 可移动           │
│ 2F ───── │                             │ ☑ 可调容量         │
│          │                             │                   │
│──────────│                             │──────────────────  │
│ 元素列表  │                             │ [导出到布局编辑器]  │
│          │                             │ [保存 BIM 项目]     │
│ 🚪 Door#1│                             │                   │
│ 🚪 Door#2│                             │                   │
│ 📦 Sp#1  │                             │                   │
│ 📦 Sp#2  │                             │                   │
│ 🖥 Desk#1│                             │                   │
└──────────┴─────────────────────────────┴───────────────────┘
```

### 5.3 组件结构

```
BimImportView.vue          — 主页面
├── BimUploader.vue         — 文件上传组件（拖拽/选择）
├── BimViewer.vue           — 3D 渲染组件 (web-ifc + Three.js)
│   ├── BimLayerPanel.vue   — 图层开关面板
│   ├── BimFloorSlider.vue  — 楼层切片滑块
│   └── BimElementList.vue  — 元素列表（可搜索/过滤）
├── BimPropertyPanel.vue    — 右侧属性面板（选中元素信息+映射配置）
└── BimExportDialog.vue     — 导出配置对话框
```

---

## 6. API 设计

本功能 **主要是前端处理**，后端只负责保存/加载 BIM 项目元数据。

### 6.1 后端 API（扩展现有 FacilityLayoutController）

```
POST   /api/v1/layouts                    — 保存布局（已有）
GET    /api/v1/layouts                    — 列表（已有）
GET    /api/v1/layouts/{id}               — 获取（已有）
PUT    /api/v1/layouts/{id}               — 更新（已有）
DELETE /api/v1/layouts/{id}               — 删除（已有）
```

**无需新 API** — 从 BIM 导出的布局直接通过现有 `POST /api/v1/layouts` 保存。

BIM 元数据（文件名、schema、楼层信息）存储在 `layout_data` JSONB 字段的 `bimMetadata` 子对象中。

### 6.2 前端 API 客户端

```typescript
// 复用现有 layout.ts API 客户端
// 新增类型定义
interface BimLayoutData extends FacilityLayout {
  bimMetadata?: {
    fileName: string
    schema: string
    buildingName: string
    floors: { id: number, name: string, elevation: number }[]
    elementCount: number
    importedAt: string
  }
}
```

---

## 7. i18n

```json
{
  "bim": {
    "title": "BIM Import",
    "upload": "Upload IFC File",
    "uploadHint": "Drag and drop .ifc file here, or click to select",
    "loading": "Loading IFC model...",
    "loaded": "Model loaded successfully",
    "elements": "elements",
    "layers": "Layers",
    "floors": "Floors",
    "floorSlice": "Floor Slice",
    "properties": "Properties",
    "elementList": "Element List",
    "mappingType": "Mapping Type",
    "exportToEditor": "Export to Layout Editor",
    "saveBimProject": "Save BIM Project",
    "selectElements": "Select elements to export",
    "autoClassify": "Auto-classify elements",
    "exportConfig": "Export Configuration",
    "defaultCapacity": "Default Capacity",
    "defaultServiceTime": "Default Service Time (s)",
    "autoRoutes": "Auto-generate routes",
    "exportFloor": "Export Floor",
    "noModel": "No IFC model loaded",
    "fileTooBig": "File exceeds {size}MB limit",
    "unsupportedFormat": "Unsupported file format. Please use .ifc or .ifczip",
    "parsingError": "Failed to parse IFC file"
  }
}
```

---

## 8. 非功能需求

### 8.1 性能

| 指标 | 目标 |
|------|------|
| WASM 初始化 | < 3s |
| 50MB IFC 加载 | < 20s |
| 100MB IFC 加载 | < 45s |
| 帧率（渲染中） | ≥ 30 FPS |
| 内存峰值 | < 1GB (100MB文件) |

### 8.2 兼容性

| 浏览器 | 支持 |
|--------|------|
| Chrome 90+ | ✅ |
| Edge 90+ | ✅ |
| Firefox 100+ | ✅ |
| Safari 15+ | ⚠️ WebAssembly 支持有限 |

### 8.3 文件大小限制

| 部署环境 | 最大文件 | 理由 |
|----------|---------|------|
| 标准部署 | 200MB | 浏览器内存限制 |
| 大型项目 | 500MB | 需要 8GB+ RAM 的机器 |

---

## 9. 实施计划

### Phase A: 基础框架（2天）

| 任务 | 预估 | 交付物 |
|------|------|--------|
| 安装 web-ifc + web-ifc-three 依赖 | 2h | package.json |
| BimImportView 页面骨架 | 4h | 三栏布局 + 路由 |
| BimUploader 组件 | 2h | 拖拽上传 + 文件验证 |
| BimViewer 组件（基础渲染） | 8h | web-ifc → Three.js 几何加载 |

### Phase B: 图层与交互（2天）

| 任务 | 预估 | 交付物 |
|------|------|--------|
| 图层分类系统 | 4h | IFC 类型 → 图层映射 |
| BimLayerPanel | 3h | Checkbox 开关 |
| 楼层提取 + BimFloorSlider | 4h | ClippingPlane 切片 |
| 点击选中 + BimPropertyPanel | 4h | Raycasting + 属性显示 |

### Phase C: 元素映射与导出（2天）

| 任务 | 预估 | 交付物 |
|------|------|--------|
| 元素自动分类 | 4h | classifyElement 逻辑 |
| BimElementList（搜索/过滤） | 3h | |
| BimExportDialog | 3h | 配置对话框 |
| exportToLayout 转换逻辑 | 4h | IFC → FacilityLayout JSON |
| 跳转到布局编辑器 | 2h | router.push + 加载布局 |

### Phase D: 打磨与测试（1天）

| 任务 | 预估 | 交付物 |
|------|------|--------|
| i18n (4语言) | 2h | |
| 错误处理 + Loading 状态 | 2h | |
| 大文件性能优化 | 2h | 分批渲染 |
| 端到端测试 | 2h | 示例 IFC 文件验证 |

**总预估：7 个工作日**

---

## 10. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| web-ifc WASM 在某些环境加载失败 | 低 | 高 | 提供降级方案（显示错误+手动输入） |
| 大型 IFC 文件导致浏览器 OOM | 中 | 中 | 设置文件大小上限；分层加载 |
| IFC 文件格式变种导致解析失败 | 中 | 中 | 捕获异常；显示部分加载的元素 |
| web-ifc-three 与现有 Three.js 版本冲突 | 低 | 高 | 使用 web-ifc 原生 API 手动构建几何体 |
| IFC 元素自动分类准确率不够 | 高 | 低 | 提供手动修改分类的 UI |
| 坐标系不一致（mm vs m, Y-up vs Z-up） | 高 | 中 | 自动检测 + 手动选择单位/轴向 |

---

## 11. 测试策略

### 11.1 测试 IFC 文件

| 文件 | 来源 | 大小 | 用途 |
|------|------|------|------|
| `Duplex_A_20110907.ifc` | buildingSMART 示例 | 3.5MB | 基础功能验证 |
| `OfficeBuilding.ifc` | IfcOpenShell 示例 | 12MB | 多楼层测试 |
| `SchependomlaneBuilding.ifc` | 开源 | 50MB | 性能测试 |
| 自建关卡 IFC | 内部创建 | — | ICA 场景验证 |

> 可从 https://github.com/buildingSMART/Sample-Test-Files 获取测试文件

### 11.2 测试用例

| # | 用例 | 预期 |
|---|------|------|
| 1 | 上传 < 10MB IFC 文件 | 5s 内渲染完成 |
| 2 | 上传 50MB IFC 文件 | 20s 内渲染，有进度条 |
| 3 | 上传非 IFC 文件 (.dwg) | 显示格式不支持提示 |
| 4 | 图层开关 | 实时显示/隐藏对应元素 |
| 5 | 楼层切片 | 切面正确，上方元素被裁剪 |
| 6 | 点击元素 | 高亮 + 属性面板显示 |
| 7 | 修改元素映射类型 | 类型更新，颜色变化 |
| 8 | 导出到布局编辑器 | 布局编辑器正确加载所有元素 |
| 9 | 自动路由生成 | entry → checkpoint → exit 连接正确 |
| 10 | 保存 BIM 项目 | DB 保存成功，reload 能恢复 |

---

## 12. 与现有系统的集成关系

```
BIM Import (新)              现有系统
─────────────                ─────────
                             
.ifc 文件 ──▶ BimImportView
                    │
           元素提取 + 分类
                    │
                    ▼
           FacilityLayout JSON ──▶ LayoutEditorView (现有)
                                        │
                                 DES 仿真 + 优化
                                        │
                                        ▼
                                 SimRunDetailView (现有)
                                 LayoutCompareView (现有)
                                 AI Recommendations (现有)

存储关系：
  BIM 项目元数据 ──▶ facility_layouts.layout_data (JSONB)
  导出的布局     ──▶ facility_layouts (新记录)
  优化结果       ──▶ layout_optimization_runs (现有)
```

---

## 附录

### A. web-ifc API 关键方法

```typescript
import { IfcAPI, IFCWALL, IFCDOOR, IFCSPACE, ... } from 'web-ifc'

const ifcApi = new IfcAPI()
await ifcApi.Init()                                    // 加载 WASM
const modelId = ifcApi.OpenModel(buffer)               // 打开 IFC
const ids = ifcApi.GetLineIDsWithType(modelId, type)   // 按类型获取
const line = ifcApi.GetLine(modelId, expressId)         // 获取属性
const geom = ifcApi.GetGeometry(modelId, expressId)    // 获取几何体
ifcApi.CloseModel(modelId)                             // 关闭释放
```

### B. 相关依赖版本

```json
{
  "web-ifc": "^0.0.57",
  "three": "已有 (^0.160+)"
}
```

> 注意：**不使用** `web-ifc-three`（已停止维护）。直接用 `web-ifc` 原生 API + 手动构建 Three.js BufferGeometry。这样更轻量，且避免版本冲突。

### C. 参考资料

- [web-ifc GitHub](https://github.com/ThatOpen/engine_web-ifc) — WASM IFC 解析器
- [That Open Platform](https://thatopen.com/) — IFC.js 项目生态
- [buildingSMART IFC 标准](https://technical.buildingsmart.org/standards/ifc/)
- [IFC 测试文件](https://github.com/buildingSMART/Sample-Test-Files)
