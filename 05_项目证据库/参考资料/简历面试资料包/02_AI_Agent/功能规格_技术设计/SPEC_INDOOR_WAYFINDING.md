# 室内寻路导航系统 — 技术规格说明书

> 版本: 1.0 | 日期: 2026-02-14 | 状态: 草案  
> 模块归属: 基盘能力 + WayfindingOps 模組

---

## 目录

1. [概述](#1-概述)
2. [基盤能力](#2-基盤能力)
3. [模組能力 — WayfindingOps](#3-模組能力--wayfindingops)
4. [数据模型](#4-数据模型)
5. [API 设计](#5-api-设计)
6. [前端架构](#6-前端架构)
7. [集成方案](#7-集成方案)
8. [部署方案](#8-部署方案)

---

## 1. 概述

### 1.1 背景

大型室内场所（商业综合体、展馆、交通枢纽、旅游景区）的寻路需求日益增长。传统静态标识牌难以满足多楼层、多语言、动态路线的导航需求。FactVerse 平台已具备完整的数字孪生能力链（BIM 导入 → 3D 渲染 → 布局编辑 → 仿真分析），在此基础上构建室内寻路系统具有天然优势。

### 1.2 系统目标

- 提供完整的室内导航图构建、路径规划、实时引导能力
- 支持 2D 平面图与 3D 数字孪生两种渲染模式
- 支持多种定位方式（QR 码、BLE、WiFi、手动选择）
- 支持无障碍路由、多语言、跨楼层导航
- 作为基盘通用能力，支撑旅游、商业、交通等垂直场景模块

### 1.3 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    前端 (Vue 3 + TS)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │ 2D 地图   │  │ 3D 场景   │  │ POI 搜索  │  │ 导航 UI  │  │
│  │ Canvas    │  │ Three.js  │  │ Component │  │ Panel   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘  │
│       └──────────────┴─────────────┴─────────────┘       │
│                          │ REST / WebSocket               │
├──────────────────────────┼───────────────────────────────┤
│              后端 (Spring Boot)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │ 导航图    │  │ POI      │  │ 定位      │  │ 疏散    │  │
│  │ Service   │  │ Service  │  │ Service   │  │ Service │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘  │
│       └──────────────┴─────────────┴─────────────┘       │
│                          │ gRPC / HTTP                    │
├──────────────────────────┼───────────────────────────────┤
│              AI 引擎 (FastAPI)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ 路径规划  │  │ 热力分析  │  │ AI 推荐   │               │
│  │ Engine    │  │ Engine   │  │ Engine    │               │
│  └──────────┘  └──────────┘  └──────────┘               │
├─────────────────────────────────────────────────────────┤
│              数据层 (PostgreSQL + Redis + S3)             │
└─────────────────────────────────────────────────────────┘
```

### 1.4 术语定义

| 术语 | 定义 |
|------|------|
| 导航图 (NavGraph) | 由节点 (NavNode) 和边 (NavEdge) 构成的加权有向图 |
| POI | Point of Interest，兴趣点（商铺、展厅、洗手间等） |
| 楼层连接点 | 电梯、扶梯、楼梯在导航图中的特殊节点 |
| 路径段 (Segment) | 两个相邻节点之间的路径片段 |
| 导航会话 | 从用户发起导航到到达目的地的完整生命周期 |

---

## 2. 基盤能力

基盘能力是平台通用的、可被任何场景模块调用的底层能力。

### 2.1 导航图引擎 (Navigation Graph Engine)

#### 2.1.1 图结构

导航图为加权有向图 `G = (V, E)`：

- **节点 V**：走廊交叉口、门口、电梯口、POI 入口等关键位置
- **边 E**：两个节点间的可通行路径
- **权重 W**：基于距离、通行时间、拥挤度等因素的综合代价

```typescript
interface NavNode {
  id: string;
  sceneId: string;          // 所属场景
  floorId: string;          // 所属楼层
  x: number;                // 平面坐标 X（米）
  y: number;                // 平面坐标 Y（米）
  z: number;                // 高度坐标（米）
  type: 'waypoint' | 'poi_entry' | 'elevator' | 'escalator' | 'stairway' | 'exit';
  accessible: boolean;      // 是否轮椅可达
  metadata: Record<string, any>;
}

interface NavEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  distance: number;         // 米
  weight: number;           // 综合代价
  bidirectional: boolean;   // 是否双向
  accessible: boolean;      // 是否无障碍
  edgeType: 'corridor' | 'elevator' | 'escalator' | 'stairway' | 'ramp' | 'outdoor';
  metadata: Record<string, any>;
}
```

#### 2.1.2 路径规划算法

**主算法：A***

选择 A* 作为主要路径规划算法，原因：
- 相比 Dijkstra 具有更好的平均性能（启发式引导）
- 在室内场景中，欧几里得距离作为启发函数效果良好
- 保证最优路径（启发函数可容许 admissible）

```python
# AI 引擎中的核心路径规划
class PathfindingEngine:
    def find_path(
        self,
        graph: NavGraph,
        start_node: str,
        end_node: str,
        options: PathfindingOptions
    ) -> PathResult:
        """
        A* 路径规划
        
        options:
          - accessible_only: bool  仅无障碍路径
          - avoid_nodes: list[str]  避开节点（封锁区域）
          - prefer_elevator: bool  优先电梯（vs 扶梯/楼梯）
          - crowd_aware: bool      考虑拥挤度权重
        """
        
    def find_multi_floor_path(
        self,
        graph: NavGraph,
        start: FloorPosition,
        end: FloorPosition,
        options: PathfindingOptions
    ) -> MultiFloorPathResult:
        """多楼层路径规划 — 自动选择最优楼层连接点"""
```

**启发函数设计：**

```python
def heuristic(node_a: NavNode, node_b: NavNode) -> float:
    """
    多楼层启发函数：
    - 同层：欧几里得距离
    - 跨层：欧几里得距离 + 楼层切换惩罚
    """
    horizontal = math.sqrt(
        (node_a.x - node_b.x)**2 + (node_a.y - node_b.y)**2
    )
    floor_penalty = abs(node_a.floor_index - node_b.floor_index) * FLOOR_SWITCH_COST
    return horizontal + floor_penalty
```

**性能要求：**
- 1,000 节点图：< 50ms
- 10,000 节点图：< 200ms
- 100,000 节点图：< 500ms

**优化策略：**
- 热门路径预计算与缓存（Redis）
- 分层图（Hierarchical Graph）：楼层内部 + 楼层间连接分别计算
- 节点剪枝：根据起终点位置裁剪不相关区域

#### 2.1.3 导航图编辑器

提供可视化编辑工具，支持：
- 在 2D 楼层平面图上拖拽添加节点
- 连线创建边，自动计算距离权重
- 批量操作：区域选择、对齐、等距分布
- 从 BIM/IFC 模型自动提取初始导航图（门、走廊、电梯检测）
- 导入/导出 JSON 格式导航图数据
- 验证工具：连通性检查、孤立节点检测、路径可达性测试

### 2.2 多层路由 (Multi-floor Routing)

#### 2.2.1 楼层连接模型

楼层间通过**连接点对 (Connection Pair)** 建立关系：

```typescript
interface FloorConnection {
  id: string;
  type: 'elevator' | 'escalator' | 'stairway';
  name: string;                    // 如 "A 区电梯"
  nodes: FloorConnectionNode[];    // 每层的对应节点
  accessible: boolean;
  capacity: number;                // 同时通行人数
  avgTransitTimeSec: number;       // 平均通行时间（秒）
  operatingHours?: TimeRange;      // 运营时间（扶梯可能有）
  status: 'active' | 'maintenance' | 'closed';
}

interface FloorConnectionNode {
  floorId: string;
  nodeId: string;                  // 该楼层对应的导航节点
}
```

#### 2.2.2 跨层路径规划策略

1. **构建虚拟超级图**：将所有楼层的导航图通过连接点合并为一个统一图
2. **连接边权重**：`距离权重 + 等待时间 + 楼层切换惩罚`
3. **电梯优先策略**：无障碍模式下，电梯权重降低；普通模式下根据层数差异动态选择
4. **扶梯方向感知**：上行/下行扶梯建模为单向边

```python
def build_connection_edge_weight(connection: FloorConnection, floors_diff: int) -> float:
    base_time = connection.avgTransitTimeSec
    wait_time = ELEVATOR_WAIT_AVG if connection.type == 'elevator' else 0
    floor_time = abs(floors_diff) * PER_FLOOR_TIME[connection.type]
    return base_time + wait_time + floor_time
```

#### 2.2.3 路径结果结构

```typescript
interface MultiFloorPathResult {
  totalDistance: number;        // 总距离（米）
  totalTime: number;           // 预估总时间（秒）
  segments: PathSegment[];     // 分段路径
}

interface PathSegment {
  floorId: string;
  floorName: string;
  nodes: NavNode[];            // 该楼层的路径节点序列
  instructions: NavInstruction[];
  transition?: {
    type: 'elevator' | 'escalator' | 'stairway';
    name: string;
    targetFloor: string;
    action: string;            // "乘电梯到3层" / "Take elevator to 3F"
  };
}

interface NavInstruction {
  type: 'straight' | 'turn_left' | 'turn_right' | 'slight_left' | 'slight_right' | 'u_turn' | 'arrive' | 'floor_change';
  distance: number;
  description: string;         // 多语言描述
  nodeId: string;
}
```

### 2.3 实时定位接口 (Positioning Interface)

采用**策略模式**，支持多种定位方式的灵活切换与融合。

#### 2.3.1 定位策略抽象

```typescript
interface PositioningProvider {
  type: 'qr_code' | 'ble_beacon' | 'wifi_fingerprint' | 'manual';
  accuracy: number;            // 预期精度（米）
  isAvailable(): Promise<boolean>;
  getPosition(): Promise<IndoorPosition>;
  startTracking?(callback: (pos: IndoorPosition) => void): void;
  stopTracking?(): void;
}

interface IndoorPosition {
  floorId: string;
  x: number;
  y: number;
  accuracy: number;            // 本次定位精度（米）
  timestamp: number;
  provider: string;
  confidence: number;          // 置信度 0-1
}
```

#### 2.3.2 QR 码定位（Phase 1）

- 场馆内关键位置张贴含位置信息的二维码
- 用户扫码后获得精确位置 + 楼层信息
- QR 码内容格式：`factverse://nav?scene={sceneId}&floor={floorId}&node={nodeId}`
- 精度：点位精确（0 误差）
- 缺点：非连续定位，需用户主动扫码

#### 2.3.3 BLE 信标定位（Phase 2）

- 基于 RSSI 的三角定位 / 指纹匹配
- 信标部署密度：每 8-10 米一个
- 预期精度：2-5 米
- 支持连续追踪，自动更新位置
- 需与客户配合部署硬件

```python
class BLEPositioningEngine:
    def estimate_position(
        self,
        beacon_readings: list[BeaconReading],
        floor_id: str,
        fingerprint_db: FingerprintDB
    ) -> IndoorPosition:
        """
        融合算法：
        1. RSSI → 距离估算（路径衰减模型）
        2. 三角定位初步估计
        3. 指纹库 KNN 匹配修正
        4. 卡尔曼滤波平滑
        """
```

#### 2.3.4 WiFi 指纹定位（备选）

- 利用现有 WiFi AP 信号强度指纹
- 无需额外硬件部署
- 预期精度：5-10 米
- 需事先采集指纹数据库

#### 2.3.5 手动选择（兜底方案）

- 用户在 2D 地图上点击当前位置
- 或从 POI 列表选择 "我在 XX 附近"
- 始终可用，作为其他方式的降级方案

#### 2.3.6 定位融合

当多种定位源同时可用时，采用加权融合：

```python
def fuse_positions(positions: list[IndoorPosition]) -> IndoorPosition:
    """
    基于精度和置信度的加权平均
    weight_i = confidence_i / accuracy_i
    """
    total_weight = sum(p.confidence / p.accuracy for p in positions)
    fused_x = sum(p.x * p.confidence / p.accuracy for p in positions) / total_weight
    fused_y = sum(p.y * p.confidence / p.accuracy for p in positions) / total_weight
    return IndoorPosition(x=fused_x, y=fused_y, ...)
```

### 2.4 路径渲染 (Path Rendering)

#### 2.4.1 2D 楼层平面图渲染

基于 Canvas 2D / SVG 的轻量渲染方案：

```typescript
class FloorPlanRenderer {
  private canvas: HTMLCanvasElement;
  private floorImage: HTMLImageElement;    // 楼层底图（PNG/SVG）
  
  // 坐标系：世界坐标（米）↔ 屏幕像素
  private transform: AffineTransform;
  
  renderPath(path: PathSegment): void {
    // 1. 绘制楼层底图
    // 2. 绘制 POI 图标
    // 3. 绘制路径线（带动画箭头）
    // 4. 绘制起点/终点标记
    // 5. 绘制当前位置标记（蓝点 + 精度圈）
  }
  
  animatePathProgress(progress: number): void {
    // 蚂蚁线动画，指示行进方向
  }
}
```

**渲染要素：**
- 楼层底图：支持 PNG、SVG、从 BIM 自动生成
- 路径线：蓝色渐变线 + 动画箭头（方向指示）
- POI 标注：分类图标 + 名称标签
- 当前位置：蓝色圆点 + 精度范围圈 + 方向指示
- 楼层切换指示：电梯/扶梯图标 + 目标楼层提示

#### 2.4.2 3D 数字孪生路径渲染（Phase 2）

集成到现有 Three.js 引擎：

```typescript
class WayfindingPath3D {
  private scene: THREE.Scene;
  private pathMesh: THREE.Mesh;
  private arrowAnimation: THREE.AnimationMixer;
  
  createPathGeometry(nodes: NavNode[]): THREE.BufferGeometry {
    // 1. 节点坐标转为 3D 世界坐标
    // 2. 生成 TubeGeometry（管状路径）或自定义 ShaderMaterial
    // 3. 路径悬浮于地面 0.1m，避免 Z-fighting
  }
  
  animatePath(): void {
    // 流光动画：shader 中 uniform time 驱动 UV 偏移
    // 发光效果：Bloom 后处理
  }
  
  showFloorTransition(connection: FloorConnection): void {
    // 电梯：半透明竖直光柱
    // 扶梯：沿扶梯模型的流动路径
    // 楼梯：阶梯状动画路径
  }
}
```

**3D 渲染要素：**
- 路径管道：半透明发光管状体，流光动画
- 转弯提示：3D 箭头模型
- 楼层切换：竖直光柱 / 扶梯流动动画
- POI 标注：3D Billboard（始终面向相机）
- 当前位置：3D 定位锥 + 脉冲动画

### 2.5 无障碍路由 (Accessible Routing)

#### 2.5.1 设计原则

- 所有节点和边标记 `accessible` 属性
- 无障碍模式下，仅在 `accessible = true` 的子图上进行路径规划
- 自动排除楼梯、旋转门等障碍
- 优先选择电梯而非扶梯
- 坡度超过 1:12 的斜面标记为不可达

#### 2.5.2 无障碍 POI

系统内置以下无障碍 POI 分类：
- 无障碍洗手间
- 无障碍电梯
- 轮椅租借点
- 无障碍停车位
- 母婴室
- 休息座椅

导航过程中，沿途无障碍设施会自动标注在路径上。

#### 2.5.3 路径代价调整

```python
def adjust_weight_for_accessibility(edge: NavEdge, options: PathfindingOptions) -> float:
    if not options.accessible_only:
        return edge.weight
    if not edge.accessible:
        return float('inf')  # 不可通行
    weight = edge.weight
    if edge.edgeType == 'ramp':
        weight *= 1.2        # 坡道稍增代价（考虑轮椅推行负担）
    if edge.edgeType == 'elevator':
        weight *= 0.8        # 电梯降低代价（优先选择）
    return weight
```

### 2.6 POI 管理 (Point of Interest)

#### 2.6.1 POI 数据结构

```typescript
interface POI {
  id: string;
  sceneId: string;
  floorId: string;
  navNodeId: string;          // 关联的导航节点（入口位置）
  category: POICategory;
  names: LocalizedText[];     // 多语言名称
  descriptions: LocalizedText[];
  icon: string;               // 图标标识
  images: string[];           // 图片 URL
  tags: string[];             // 搜索标签
  openingHours?: TimeRange[];
  contact?: ContactInfo;
  accessible: boolean;
  sortOrder: number;
  status: 'active' | 'inactive' | 'temporary';
}

interface LocalizedText {
  locale: string;   // 'zh-CN', 'en-US', 'ja-JP' ...
  text: string;
}

type POICategory = 
  | 'attraction'    // 景点/展厅
  | 'food'          // 餐饮
  | 'shop'          // 商铺
  | 'restroom'      // 洗手间
  | 'service'       // 服务台
  | 'transport'     // 交通（出租车/公交）
  | 'parking'       // 停车场
  | 'medical'       // 医疗
  | 'exit'          // 出口
  | 'custom';       // 自定义
```

#### 2.6.2 POI 搜索

- **全文搜索**：基于 Elasticsearch / PostgreSQL FTS，支持多语言分词
- **分类浏览**：按类别 + 楼层筛选
- **附近搜索**：基于当前定位，按距离排序
- **智能补全**：输入联想 + 拼音/罗马字支持

---

## 3. 模組能力 — WayfindingOps

WayfindingOps 是面向垂直场景的增值模块，基于基盘能力构建。

### 3.1 旅游场景 (Tourism Scenarios)

#### 3.1.1 访客信息亭模式 (Kiosk Mode)

```typescript
interface KioskConfig {
  sceneId: string;
  defaultFloorId: string;
  kioskNodeId: string;        // 信息亭所在节点（固定起点）
  languages: string[];        // 支持的语言列表
  idleTimeoutSec: number;     // 无操作回到首页
  displayMode: '2d' | '3d';
  featuredPOIs: string[];     // 首页推荐 POI
  branding: BrandingConfig;   // 客户品牌定制
}
```

功能特性：
- 固定起点（信息亭位置）
- 全屏触控优化 UI
- 无操作自动回到首页（可配置超时）
- 首页展示推荐 POI 和热门目的地
- 支持客户品牌定制（Logo、主题色）

#### 3.1.2 QR 码入口

访客扫描入口二维码后：
1. 自动打开 H5 导航页面
2. 检测手机语言偏好，自动切换语言
3. 定位当前位置（二维码包含位置信息）
4. 显示推荐导览路线或搜索目的地

#### 3.1.3 推荐导览路线

预设经典路线，如 "2 小时精华路线"、"亲子路线"：

```typescript
interface GuidedRoute {
  id: string;
  names: LocalizedText[];
  descriptions: LocalizedText[];
  estimatedMinutes: number;
  stops: GuidedRouteStop[];   // 有序的停留点
  tags: string[];             // "亲子", "无障碍", "经典" ...
}

interface GuidedRouteStop {
  poiId: string;
  suggestedMinutes: number;   // 建议停留时间
  audioGuideUrl?: string;     // 语音讲解
  descriptions: LocalizedText[];
}
```

### 3.2 群组导航 (Group Navigation)

#### 3.2.1 导游模式

```typescript
interface GroupSession {
  id: string;
  guideUserId: string;
  routeId?: string;           // 使用的导览路线
  members: GroupMember[];
  status: 'active' | 'paused' | 'ended';
  shareCode: string;          // 6 位加入码
  qrCode: string;             // 加入二维码
}

interface GroupMember {
  sessionUserId: string;
  nickname: string;
  lastPosition?: IndoorPosition;
  isOnRoute: boolean;         // 是否在路线上
  distanceToGuide: number;    // 与导游的距离
}
```

功能特性：
- 导游创建群组会话，生成加入二维码
- 团员扫码加入，实时看到导游位置
- 导游可推送 "下一站" 通知
- 掉队检测：团员偏离路线超过阈值时提醒
- 掉队团员可一键导航回导游当前位置

#### 3.2.2 实时同步

基于 WebSocket 的位置同步：

```typescript
// WebSocket 消息协议
type WSMessage = 
  | { type: 'position_update', data: { userId: string, position: IndoorPosition } }
  | { type: 'route_update', data: { routeSegments: PathSegment[] } }
  | { type: 'next_stop', data: { poiId: string, message: string } }
  | { type: 'stray_alert', data: { userId: string, distance: number } }
  | { type: 'member_join', data: GroupMember }
  | { type: 'member_leave', data: { userId: string } };
```

### 3.3 热力分析 (Crowd Heatmap Integration)

#### 3.3.1 数据采集

通过以下方式采集人流数据：
- BLE 定位数据聚合（匿名化）
- WiFi 探针数据（设备计数，不采集 MAC）
- 摄像头客流统计（接入第三方系统）
- 导航会话统计

#### 3.3.2 热力图生成

```python
class CrowdHeatmapEngine:
    def generate_heatmap(
        self,
        floor_id: str,
        time_window: TimeRange,
        grid_size: float = 2.0    # 2 米网格
    ) -> HeatmapData:
        """
        将楼层划分为 grid_size × grid_size 的网格
        统计每个网格的人流密度
        返回密度矩阵 + 颜色映射
        """
    
    def get_congestion_weights(
        self,
        floor_id: str
    ) -> dict[str, float]:
        """
        返回每条边的拥堵权重系数（1.0 = 正常，>1 = 拥堵）
        用于拥堵感知路径规划
        """
```

#### 3.3.3 拥堵感知路径规划

在 A* 算法中动态调整边权重：

```python
def crowd_aware_weight(edge: NavEdge, congestion: dict) -> float:
    congestion_factor = congestion.get(edge.id, 1.0)
    return edge.weight * congestion_factor
```

用户可选择 "避开拥挤区域" 选项，系统自动规划拥堵较低的替代路线。

### 3.4 紧急疏散 (Emergency Evacuation)

#### 3.4.1 疏散模式触发

```typescript
interface EvacuationEvent {
  id: string;
  sceneId: string;
  triggeredBy: string;        // 触发人
  triggeredAt: Date;
  blockedAreas: BlockedArea[];
  status: 'active' | 'resolved';
}

interface BlockedArea {
  floorId: string;
  nodeIds: string[];          // 被封锁的节点
  edgeIds: string[];          // 被封锁的边
  reason: string;
}
```

#### 3.4.2 疏散路径计算

- 从每个用户当前位置计算到最近出口的最短路径
- 排除被封锁的节点和边
- 考虑出口容量，避免所有人涌向同一出口
- 动态重路由：封锁区域变更时自动更新路径

```python
class EvacuationEngine:
    def calculate_evacuation_paths(
        self,
        scene_id: str,
        active_users: list[IndoorPosition],
        blocked: BlockedArea,
        exit_capacities: dict[str, int]
    ) -> dict[str, PathResult]:
        """
        多出口负载均衡疏散算法：
        1. 找出所有可用出口
        2. 对每个用户计算到各出口的最短路径
        3. 基于出口容量进行流量分配（最小代价流）
        4. 返回每个用户的分配路径
        """
```

#### 3.4.3 与 SimPy 仿真引擎集成

利用平台已有的 SimPy DES 引擎进行疏散模拟：
- 预演不同紧急场景的疏散效果
- 评估出口容量是否充足
- 优化疏散路径策略
- 生成疏散时间评估报告

---

## 4. 数据模型

### 4.1 ER 概览

```
scenes ─┬── floors ─┬── nav_nodes ──── nav_edges
        │           ├── pois
        │           └── beacons
        └── floor_connections
```

### 4.2 数据库表定义

#### scenes（场景）

```sql
CREATE TABLE scenes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    address         TEXT,
    timezone        VARCHAR(50) DEFAULT 'Asia/Shanghai',
    coordinate_system JSONB,           -- 坐标系元数据
    settings        JSONB,             -- 场景配置
    status          VARCHAR(20) DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### floors（楼层）

```sql
CREATE TABLE floors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id        UUID NOT NULL REFERENCES scenes(id),
    name            VARCHAR(100) NOT NULL,    -- "1F", "B1" 等
    display_name    JSONB NOT NULL,           -- 多语言 {"zh":"一层","en":"1F"}
    floor_index     INTEGER NOT NULL,         -- 排序序号（B1=-1, 1F=0, 2F=1...）
    elevation       FLOAT DEFAULT 0,          -- 高度（米）
    floor_plan_url  VARCHAR(500),             -- 2D 底图 URL
    bim_model_id    VARCHAR(100),             -- 关联 BIM 模型
    bounds          JSONB,                    -- 楼层边界 {minX, minY, maxX, maxY}
    settings        JSONB,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(scene_id, floor_index)
);
CREATE INDEX idx_floors_scene ON floors(scene_id);
```

#### nav_nodes（导航节点）

```sql
CREATE TABLE nav_nodes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id        UUID NOT NULL REFERENCES scenes(id),
    floor_id        UUID NOT NULL REFERENCES floors(id),
    x               FLOAT NOT NULL,
    y               FLOAT NOT NULL,
    z               FLOAT DEFAULT 0,
    node_type       VARCHAR(20) NOT NULL,     -- waypoint|poi_entry|elevator|escalator|stairway|exit
    accessible      BOOLEAN DEFAULT TRUE,
    name            VARCHAR(100),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_nav_nodes_floor ON nav_nodes(floor_id);
CREATE INDEX idx_nav_nodes_scene ON nav_nodes(scene_id);
CREATE INDEX idx_nav_nodes_type ON nav_nodes(node_type);
```

#### nav_edges（导航边）

```sql
CREATE TABLE nav_edges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id        UUID NOT NULL REFERENCES scenes(id),
    source_node_id  UUID NOT NULL REFERENCES nav_nodes(id),
    target_node_id  UUID NOT NULL REFERENCES nav_nodes(id),
    distance        FLOAT NOT NULL,           -- 米
    weight          FLOAT NOT NULL,           -- 综合代价
    bidirectional   BOOLEAN DEFAULT TRUE,
    accessible      BOOLEAN DEFAULT TRUE,
    edge_type       VARCHAR(20) DEFAULT 'corridor',  -- corridor|elevator|escalator|stairway|ramp|outdoor
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_nav_edges_source ON nav_edges(source_node_id);
CREATE INDEX idx_nav_edges_target ON nav_edges(target_node_id);
CREATE INDEX idx_nav_edges_scene ON nav_edges(scene_id);
```

#### floor_connections（楼层连接）

```sql
CREATE TABLE floor_connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id        UUID NOT NULL REFERENCES scenes(id),
    name            VARCHAR(100),
    connection_type VARCHAR(20) NOT NULL,      -- elevator|escalator|stairway
    accessible      BOOLEAN DEFAULT TRUE,
    capacity        INTEGER DEFAULT 10,
    avg_transit_sec FLOAT DEFAULT 30,
    operating_hours JSONB,
    status          VARCHAR(20) DEFAULT 'active',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE floor_connection_nodes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id   UUID NOT NULL REFERENCES floor_connections(id),
    floor_id        UUID NOT NULL REFERENCES floors(id),
    node_id         UUID NOT NULL REFERENCES nav_nodes(id),
    UNIQUE(connection_id, floor_id)
);
```

#### pois（兴趣点）

```sql
CREATE TABLE pois (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id        UUID NOT NULL REFERENCES scenes(id),
    floor_id        UUID NOT NULL REFERENCES floors(id),
    nav_node_id     UUID REFERENCES nav_nodes(id),
    category        VARCHAR(50) NOT NULL,
    names           JSONB NOT NULL,            -- {"zh":"星巴克","en":"Starbucks"}
    descriptions    JSONB DEFAULT '{}',
    icon            VARCHAR(100),
    images          JSONB DEFAULT '[]',
    tags            JSONB DEFAULT '[]',
    opening_hours   JSONB,
    contact         JSONB,
    accessible      BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pois_scene ON pois(scene_id);
CREATE INDEX idx_pois_floor ON pois(floor_id);
CREATE INDEX idx_pois_category ON pois(category);
CREATE INDEX idx_pois_names ON pois USING GIN(names jsonb_path_ops);
```

#### beacons（信标）

```sql
CREATE TABLE beacons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id        UUID NOT NULL REFERENCES scenes(id),
    floor_id        UUID NOT NULL REFERENCES floors(id),
    beacon_type     VARCHAR(20) NOT NULL,      -- ble|wifi
    hardware_id     VARCHAR(100) NOT NULL UNIQUE,  -- UUID / MAC
    x               FLOAT NOT NULL,
    y               FLOAT NOT NULL,
    tx_power        INTEGER,                   -- 发射功率 dBm
    status          VARCHAR(20) DEFAULT 'active',
    battery_level   INTEGER,
    last_seen_at    TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_beacons_floor ON beacons(floor_id);
CREATE INDEX idx_beacons_hardware ON beacons(hardware_id);
```

#### nav_sessions（导航会话 — 用于统计分析）

```sql
CREATE TABLE nav_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id        UUID NOT NULL REFERENCES scenes(id),
    start_node_id   UUID REFERENCES nav_nodes(id),
    end_node_id     UUID REFERENCES nav_nodes(id),
    end_poi_id      UUID REFERENCES pois(id),
    language        VARCHAR(10),
    accessible_mode BOOLEAN DEFAULT FALSE,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    status          VARCHAR(20) DEFAULT 'active',  -- active|completed|abandoned
    path_distance   FLOAT,
    reroute_count   INTEGER DEFAULT 0,
    user_rating     INTEGER,                   -- 1-5
    metadata        JSONB DEFAULT '{}'
);
```

---

## 5. API 设计

### 5.1 后端 API (Spring Boot)

基础路径: `/api/v1/wayfinding`

#### 场景与楼层

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/scenes` | 获取场景列表 |
| GET | `/scenes/{sceneId}` | 获取场景详情 |
| GET | `/scenes/{sceneId}/floors` | 获取楼层列表 |
| GET | `/scenes/{sceneId}/floors/{floorId}` | 获取楼层详情（含底图URL） |

#### 导航图管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/scenes/{sceneId}/nav-graph` | 获取完整导航图 |
| GET | `/scenes/{sceneId}/floors/{floorId}/nav-graph` | 获取单层导航图 |
| PUT | `/scenes/{sceneId}/nav-graph` | 更新导航图（编辑器保存） |
| POST | `/scenes/{sceneId}/nav-graph/validate` | 验证导航图连通性 |
| POST | `/scenes/{sceneId}/nav-graph/import` | 从 BIM 导入初始导航图 |

#### POI 管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/scenes/{sceneId}/pois` | POI 列表（分页、筛选） |
| GET | `/scenes/{sceneId}/pois/search?q={keyword}&lang={locale}` | POI 搜索 |
| POST | `/scenes/{sceneId}/pois` | 创建 POI |
| PUT | `/scenes/{sceneId}/pois/{poiId}` | 更新 POI |
| DELETE | `/scenes/{sceneId}/pois/{poiId}` | 删除 POI |
| POST | `/scenes/{sceneId}/pois/import` | 批量导入 POI |

#### 定位

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/scenes/{sceneId}/position/qr` | QR 码定位解析 |
| POST | `/scenes/{sceneId}/position/ble` | BLE 信标定位 |
| GET | `/scenes/{sceneId}/beacons` | 获取信标列表 |

#### 导航会话

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/scenes/{sceneId}/nav-sessions` | 创建导航会话 |
| PUT | `/scenes/{sceneId}/nav-sessions/{sessionId}` | 更新会话状态 |
| POST | `/scenes/{sceneId}/nav-sessions/{sessionId}/rating` | 提交评分 |

### 5.2 AI 引擎 API (FastAPI)

基础路径: `/ai/v1/wayfinding`

#### 路径规划

```
POST /ai/v1/wayfinding/route
```

请求体：
```json
{
  "scene_id": "uuid",
  "start": {
    "floor_id": "uuid",
    "node_id": "uuid"
  },
  "end": {
    "poi_id": "uuid"
  },
  "options": {
    "accessible_only": false,
    "avoid_nodes": [],
    "prefer_elevator": false,
    "crowd_aware": false,
    "language": "zh-CN"
  }
}
```

响应体：
```json
{
  "total_distance": 256.5,
  "total_time_sec": 312,
  "segments": [
    {
      "floor_id": "uuid",
      "floor_name": "1F",
      "nodes": [...],
      "instructions": [
        { "type": "straight", "distance": 50, "description": "直行50米" },
        { "type": "turn_left", "distance": 0, "description": "左转" },
        { "type": "floor_change", "distance": 0, "description": "乘电梯到3层" }
      ],
      "transition": {
        "type": "elevator",
        "name": "A区电梯",
        "target_floor": "3F"
      }
    }
  ]
}
```

#### 热力图

```
GET /ai/v1/wayfinding/heatmap/{scene_id}/{floor_id}?from={timestamp}&to={timestamp}
```

#### 疏散路径

```
POST /ai/v1/wayfinding/evacuate
```

请求体：
```json
{
  "scene_id": "uuid",
  "blocked_areas": [
    { "floor_id": "uuid", "node_ids": [...], "edge_ids": [...] }
  ],
  "active_positions": [
    { "user_id": "anon-1", "floor_id": "uuid", "x": 10.5, "y": 20.3 }
  ]
}
```

#### AI 推荐

```
POST /ai/v1/wayfinding/recommend
```

请求体：
```json
{
  "scene_id": "uuid",
  "current_position": { "floor_id": "uuid", "node_id": "uuid" },
  "preferences": ["food", "attraction"],
  "time_budget_min": 120,
  "language": "en-US"
}
```

### 5.3 WebSocket 端点

```
WS /ws/v1/wayfinding/group/{sessionId}
```

用于群组导航的实时位置同步与消息推送。

```
WS /ws/v1/wayfinding/track/{navSessionId}
```

用于单人导航的实时位置追踪与路径偏离检测。

---

## 6. 前端架构

### 6.1 组件结构

```
src/modules/wayfinding/
├── components/
│   ├── WayfindingApp.vue           # 主容器
│   ├── FloorPlanView.vue           # 2D 楼层平面图
│   ├── ThreeDView.vue              # 3D 数字孪生视图
│   ├── POISearchPanel.vue          # POI 搜索面板
│   ├── NavigationPanel.vue         # 导航指引面板
│   ├── FloorSwitcher.vue           # 楼层切换器
│   ├── InstructionList.vue         # 逐步指引列表
│   ├── PositionIndicator.vue       # 当前位置指示器
│   ├── KioskHome.vue               # 信息亭首页
│   ├── GroupPanel.vue              # 群组导航面板
│   └── EvacuationOverlay.vue       # 疏散模式覆盖层
├── composables/
│   ├── useNavigation.ts            # 导航逻辑
│   ├── usePositioning.ts           # 定位管理
│   ├── useFloorPlan.ts             # 2D 渲染
│   ├── usePathRenderer3D.ts        # 3D 路径渲染
│   ├── useGroupSession.ts          # 群组会话
│   └── useWebSocket.ts             # WS 连接
├── stores/
│   ├── wayfindingStore.ts          # Pinia 状态管理
│   └── positionStore.ts            # 定位状态
├── services/
│   ├── wayfindingApi.ts            # API 调用
│   └── positioningService.ts       # 定位服务
├── types/
│   └── wayfinding.ts               # TypeScript 类型
├── i18n/
│   ├── zh-CN.json
│   ├── en-US.json
│   └── ja-JP.json
└── editor/
    ├── NavGraphEditor.vue          # 导航图编辑器
    ├── POIManager.vue              # POI 管理
    └── BeaconManager.vue           # 信标管理
```

### 6.2 状态管理

```typescript
// wayfindingStore.ts
export const useWayfindingStore = defineStore('wayfinding', () => {
  // 场景数据
  const scene = ref<Scene | null>(null);
  const floors = ref<Floor[]>([]);
  const currentFloor = ref<Floor | null>(null);
  
  // 导航状态
  const navSession = ref<NavSession | null>(null);
  const currentPath = ref<MultiFloorPathResult | null>(null);
  const currentSegmentIndex = ref(0);
  const isNavigating = ref(false);
  
  // 定位
  const currentPosition = ref<IndoorPosition | null>(null);
  const positioningMode = ref<'qr' | 'ble' | 'wifi' | 'manual'>('manual');
  
  // POI
  const selectedPOI = ref<POI | null>(null);
  const searchResults = ref<POI[]>([]);
  
  // 设置
  const accessibleMode = ref(false);
  const language = ref('zh-CN');
  const displayMode = ref<'2d' | '3d'>('2d');
});
```

### 6.3 离线支持

Phase 1 MVP 即支持基础离线导航：

- **Service Worker** 缓存楼层底图与导航图数据
- **本地路径规划** ：将 A* 算法用 TypeScript 实现一套前端版本
- **预缓存策略**：首次加载时下载当前场景全部楼层数据
- **增量同步**：恢复网络后同步导航会话日志

```typescript
// 前端 A* 算法（离线回退）
class ClientSidePathfinder {
  private graph: NavGraph;
  
  findPath(startId: string, endId: string, options: PathOptions): PathResult {
    // 前端简化版 A*，在网络不可用时回退使用
  }
}
```

---

## 7. 集成方案

### 7.1 与 BIM/IFC 导入集成

```
BIM/IFC 文件 → web-ifc WASM 解析 → 提取空间信息 → 自动生成初始导航图
```

从 BIM 模型中提取：
- **IfcSpace** → 房间/区域 → POI 候选
- **IfcDoor** → 门 → 导航节点
- **IfcStair / IfcRamp / IfcTransportElement** → 楼层连接点
- **IfcWall / IfcSlab** → 障碍物 → 可通行区域计算

```python
class BIMNavGraphExtractor:
    def extract_nav_graph(self, ifc_model) -> NavGraph:
        """
        1. 解析 IfcSpace 获取房间轮廓
        2. 提取 IfcDoor 作为连接节点
        3. 在走廊区域自动生成路径节点（Voronoi / 中轴线算法）
        4. 连接相邻节点，计算距离权重
        5. 识别电梯/楼梯/扶梯作为楼层连接
        6. 返回初始导航图（供人工微调）
        """
```

### 7.2 与布局优化器集成

布局优化器已有 2D/3D 编辑能力，导航图编辑器复用其：
- 2D Canvas 底层渲染引擎
- 拖拽交互框架
- 坐标系统与变换逻辑
- 撤销/重做（Undo/Redo）机制

在布局编辑器中新增 "导航图" 图层，与现有的设备图层、区域图层并列。

### 7.3 与数字孪生引擎集成

Three.js 场景中新增导航路径渲染层：

```typescript
class WayfindingLayer extends DigitalTwinLayer {
  name = 'wayfinding';
  
  onAttach(scene: THREE.Scene): void {
    // 注册路径渲染器
    // 注册 POI 标注渲染器
    // 注册位置指示器
  }
  
  onUpdate(deltaTime: number): void {
    // 更新路径动画
    // 更新位置标记
  }
}
```

### 7.4 与 SimPy 仿真引擎集成

利用 SimPy 进行疏散仿真与动线优化：

```python
class EvacuationSimulation:
    def __init__(self, nav_graph: NavGraph, num_agents: int):
        self.env = simpy.Environment()
        self.nav_graph = nav_graph
        # 将走廊建模为有容量限制的 SimPy Resource
        self.corridors = {
            edge.id: simpy.Resource(self.env, capacity=edge.capacity)
            for edge in nav_graph.edges
        }
    
    def run(self, blocked_areas: list, max_time: int = 600):
        """
        模拟疏散过程：
        - 每个 agent 在随机位置开始
        - 使用疏散算法规划路径
        - 走廊拥堵时排队等待
        - 记录每个 agent 的疏散时间
        返回统计结果：平均疏散时间、瓶颈点、最后撤离时间
        """
```

---

## 8. 部署方案

### 8.1 服务组件

| 组件 | 镜像 | 端口 | 资源 |
|------|------|------|------|
| 前端 (Nginx) | factverse-frontend | 80/443 | 512MB / 0.5 CPU |
| 后端 (Spring Boot) | factverse-backend | 8080 | 2GB / 2 CPU |
| AI 引擎 (FastAPI) | factverse-ai-engine | 8000 | 2GB / 2 CPU |
| PostgreSQL | postgres:15 | 5432 | 4GB / 2 CPU |
| Redis | redis:7 | 6379 | 1GB / 1 CPU |
| Elasticsearch | elasticsearch:8 | 9200 | 2GB / 2 CPU |

### 8.2 Docker Compose 部署（开发/单机）

导航功能作为现有服务的功能模块部署，无需独立服务。新增依赖：
- Elasticsearch（POI 全文搜索，可选，可降级为 PostgreSQL FTS）

### 8.3 Kubernetes 部署（生产）

```yaml
# 导航相关配置示例
apiVersion: v1
kind: ConfigMap
metadata:
  name: wayfinding-config
data:
  WAYFINDING_ENABLED: "true"
  WAYFINDING_MAX_GRAPH_NODES: "100000"
  WAYFINDING_CACHE_TTL_SEC: "300"
  WAYFINDING_POSITION_UPDATE_INTERVAL_MS: "1000"
  WAYFINDING_OFFLINE_CACHE_ENABLED: "true"
```

### 8.4 性能与扩展

- **路径计算缓存**：热门起终点对的路径结果缓存到 Redis（TTL 5 分钟）
- **导航图缓存**：整场景导航图加载到内存（单场景 < 10MB）
- **WebSocket 扩展**：使用 Redis Pub/Sub 实现多实例间的 WS 消息广播
- **CDN**：楼层底图、3D 模型通过 CDN 分发

### 8.5 监控与告警

| 指标 | 告警阈值 |
|------|----------|
| 路径规划 P99 延迟 | > 1000ms |
| 路径规划失败率 | > 1% |
| WebSocket 连接数 | > 5000 |
| 导航图加载时间 | > 3s |

---

> 📌 本文档随技术迭代持续更新，以最新版本为准。
