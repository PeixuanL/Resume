# WayfindingOps Module Refactor — Floor Plan Studio + 2D→3D

## 目标
将WayfindingOps从"各页面独立"重构为"以3D Navigator为核心、Floor Plan Studio为数据入口"的完整模块。客户导入2D CAD平面图 → 自动提取墙体/房间 → 生成3D建筑 → 在3D中导航。

## 页面结构（6页→4页）

| 页面 | 路由 | 说明 |
|------|------|------|
| Dashboard | `/overview` | 3D缩略预览 + 楼层/POI/路线统计 + 快捷入口 |
| Floor Plan Studio | `/studio` | 导入CAD → 提取 → 编辑 → 生成3D |
| 3D Navigator | `/navigator` | 核心导航（从Studio数据或内置demo） |
| Analytics | `/analytics` | 人流/疏散/路径效率分析 |

删除页面：
- `WayfindingFloorPlans.vue` → 合并到 Studio
- `WayfindingPoiView.vue` → POI管理合并到 3D Navigator 交互层
- `WayfindingNavigator.vue`（旧2D）→ 废弃，3D版已替代
- `RouteGraphEditor.vue` → 废弃

## Floor Plan Studio 架构

### 输入格式
1. **DXF** (最常见CAD交换格式) — 前端JS解析 `dxf-parser` npm包
2. **图片** (JPG/PNG) — 手动标注模式（用户在图上画墙/门）
3. **JSON** — 直接导入结构化数据（程序化对接）

### 数据模型 — FloorPlanData

```typescript
interface FloorPlanData {
  buildingId: string
  buildingName: string
  floors: FloorData[]
}

interface FloorData {
  floorId: string
  label: string        // "B1", "L1", "L2"
  elevation: number    // y坐标（米）
  height: number       // 层高（米），默认4
  walls: WallSegment[]
  rooms: RoomData[]
  doors: DoorData[]
  pois: PoiData[]
  transportNodes: TransportNode[]  // 电梯/扶梯/楼梯位置
}

interface WallSegment {
  id: string
  x1: number; z1: number
  x2: number; z2: number
  thickness: number  // 默认0.2
  type: 'exterior' | 'interior' | 'partition'
}

interface RoomData {
  id: string
  name: string
  category: string  // 'shop' | 'office' | 'restroom' | 'mechanical' | 'lobby' | 'corridor'
  polygon: { x: number; z: number }[]  // 轮廓点
  doors: string[]  // 关联的door IDs
}

interface DoorData {
  id: string
  x: number; z: number
  width: number     // 默认1.0
  wallId: string    // 所在墙段
  type: 'single' | 'double' | 'sliding' | 'emergency'
}

interface PoiData {
  id: string
  name: string
  category: string  // 'shop' | 'restaurant' | 'restroom' | 'elevator' | 'escalator' | 'exit' | 'info' | 'parking'
  x: number; z: number
  floorId: string
}

interface TransportNode {
  id: string
  type: 'elevator' | 'escalator' | 'stairs'
  x: number; z: number
  connectsTo: string[]  // 连接的其他楼层 transportNode IDs
}
```

### DXF解析流水线

```
DXF File → dxf-parser → 原始图元
  → 图层分类 (A-WALL, A-DOOR, A-ROOM, A-TEXT)
  → 几何提取 (LINE→墙段, INSERT→门, TEXT→房间名)
  → 坐标变换 (CAD坐标系→场景坐标系, 自动居中)
  → 结构化 FloorData
```

智能识别策略：
- 图层名包含 `WALL` → 墙体
- 图层名包含 `DOOR` → 门
- 图层名包含 `TEXT`/`ANNO` → 标注（房间名）
- 未知图层 → 用户手动分类

### Studio UI 工作流

```
Step 1: Upload        上传DXF/图片，选择楼层
Step 2: Extract       自动提取墙体/门，显示2D预览
Step 3: Edit          Canvas编辑器：调整墙体、标记门/房间、添加POI
Step 4: Generate 3D   一键生成Three.js 3D场景预览
Step 5: Publish       保存到后端，3D Navigator自动使用新数据
```

### 2D Canvas编辑器
- 显示提取的墙体线段（蓝色）、门（绿色）、POI（图标）
- 工具栏：画墙、画门、标记房间、添加POI、添加电梯/扶梯
- 橡皮擦删除误识别的元素
- 缩放/平移
- 图层切换：显示/隐藏原始DXF底图

### 2D → 3D生成算法

输入：`FloorData[]`
输出：Three.js Scene

```
1. 遍历每层 floor:
   a. 生成地板slab (BoxGeometry, 透明)
   b. 遍历 walls → addWall(x1,z1,x2,z2, height=floor.height)
   c. 遍历 doors → 在对应墙段上开口（gap）
   d. 遍历 rooms → 根据polygon生成房间标签
   e. 遍历 pois → 生成POI球体+标签
   f. 遍历 transportNodes → 生成电梯井/扶梯视觉

2. 跨层连接:
   a. 匹配同位置的 transportNodes
   b. 生成电梯竖井
   c. 生成扶梯斜管

3. 导航网格:
   a. 从墙体数据生成 occupancy grid
   b. 从门位置生成可通行节点
   c. 从POI生成导航目标点
```

## 3D Navigator 重构

当前：硬编码nodes/edges/walls（Mall V2）
重构后：
1. 优先从后端加载 FloorPlanData（用户导入的）
2. 如果没有导入数据 → 使用内置demo数据（当前Mall V2）
3. 3D场景从 FloorPlanData 动态生成（复用 `buildFloorFromData()` 函数）

```typescript
// 数据源优先级
async function loadBuildingData(): Promise<FloorPlanData> {
  try {
    const imported = await wayfindingApi.getBuilding()
    if (imported?.floors?.length) return imported
  } catch {}
  return DEMO_BUILDING_DATA  // 内置Mall V2
}
```

### POI交互层（原WayfindingPoiView功能合并）
- 在3D场景中点击 → 显示POI详情面板
- 右键菜单 → 添加/编辑/删除POI
- POI分类筛选器（overlay上）
- POI搜索集成到导航起终点选择

## 后端API（复用+新增）

### 复用基盘
- `POST /api/v1/wayfinding/buildings` — CRUD (已有)
- `GET /api/v1/wayfinding/floors/{id}/nodes` — 节点 (已有)
- `GET /api/v1/wayfinding/floors/{id}/pois` — POI (已有)

### 新增
- `POST /api/v1/wayfinding/buildings/{id}/floor-plans` — 上传解析后的FloorData
- `GET /api/v1/wayfinding/buildings/{id}/floor-plan-data` — 获取完整建筑数据
- `PUT /api/v1/wayfinding/buildings/{id}/floors/{floorId}` — 更新单层数据

## 实施计划

### Phase 1: Studio框架 + DXF解析（本次）
- [ ] 创建 `FloorPlanStudioView.vue`
- [ ] 集成 `dxf-parser` npm包
- [ ] DXF → 墙体/门提取
- [ ] 2D Canvas预览（只读）
- [ ] 路由更新（删除旧页面，添加Studio）

### Phase 2: 2D编辑 + 3D生成
- [ ] Canvas编辑工具（画墙/门/标记房间）
- [ ] `buildFloorFromData()` 函数：FloorData → Three.js
- [ ] 3D预览面板
- [ ] 3D Navigator重构：从FloorPlanData动态生成

### Phase 3: 数据持久化 + 完善
- [ ] 后端FloorPlanData存储API
- [ ] POI交互层合并到3D Navigator
- [ ] Dashboard重构
- [ ] Analytics接入真实导航数据
- [ ] 图片导入手动标注模式

## 技术选型

| 需求 | 方案 | 理由 |
|------|------|------|
| DXF解析 | `dxf-parser` npm | 纯前端JS，无需后端，~50KB |
| 2D编辑 | Canvas 2D API | 已有经验（旧2D导航器），轻量 |
| 3D生成 | Three.js（已有） | 复用现有3D Navigator代码 |
| 坐标系 | CAD Y-up → Scene Y-up | DXF通常XY平面，映射到XZ平面 |
| 文件存储 | 后端PostgreSQL JSONB | FloorPlanData作为JSON存储 |

## 关键复用

1. **BIM Import** — 文件上传UI组件、"Try Sample"按钮模式
2. **Layout Editor** — Canvas 2D编辑器模式（画/选/拖/删）
3. **3D Navigator** — Three.js场景构建函数
4. **Data Pipeline** — ETL转换模式（DXF → 结构化数据）
