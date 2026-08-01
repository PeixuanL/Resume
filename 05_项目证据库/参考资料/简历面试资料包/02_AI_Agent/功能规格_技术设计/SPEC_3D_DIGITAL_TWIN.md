# 3D 数字孪生规格书

> **文档版本:** v2.0  
> **创建日期:** 2026-02-11  
> **重构日期:** 2026-02-11  
> **作者:** FactVerse AI Agent Team  
> **状态:** Draft  

---

## 架构概述

本规格书将 3D 数字孪生分为两层：

| 层级 | 说明 | 位置 |
|------|------|------|
| **基盘 (Base Platform)** | 通用 3D 场景引擎，所有模块共享 | `frontend/src/components/3d/` |
| **模块叠加层 (Module Overlays)** | 各业务模块注册的专属可视化插件 | `frontend/src/modules/{module}/3d/` |

模块通过 `3DOverlayPlugin` 接口注册到基盘，基盘负责统一渲染、图层管理和生命周期。

---

# 第一部分：基盘 — 3D 场景引擎 (Base Platform)

> 位置: `frontend/src/components/3d/`
> 
> 基盘提供完整的 3D 场景能力，不依赖任何业务模块。所有模块共享同一个场景引擎。

---

## 1. Three.js 场景管理器

### 1.1 概述

统一管理 Camera、Lighting、Renderer、Controls 的核心 Scene Manager，作为所有 3D 可视化的基础。

### 1.2 技术方案

```typescript
// frontend/src/components/3d/SceneManager.ts
class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  
  private clock: THREE.Clock;
  private animationId: number | null = null;
  private updateCallbacks: Array<(delta: number) => void> = [];
  
  // 插件注册表
  private overlayPlugins: Map<string, ThreeDOverlayPlugin> = new Map();

  constructor(container: HTMLElement) {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      10000
    );
    this.camera.position.set(100, 80, 100);

    // Lighting
    this.setupLighting();

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 5000;

    this.clock = new THREE.Clock();
    
    // Responsive
    window.addEventListener('resize', () => this.onResize(container));
  }

  private setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(50, 100, 50);
    directional.castShadow = true;
    directional.shadow.mapSize.set(2048, 2048);
    this.scene.add(directional);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
    this.scene.add(hemi);
  }

  /**
   * 注册模块叠加层插件
   */
  registerOverlay(plugin: ThreeDOverlayPlugin) {
    this.overlayPlugins.set(plugin.layerName, plugin);
    plugin.onMount(this.scene, this.camera);
    this.updateCallbacks.push((delta) => plugin.onUpdate(delta));
  }

  /**
   * 卸载模块叠加层插件
   */
  unregisterOverlay(layerName: string) {
    const plugin = this.overlayPlugins.get(layerName);
    if (plugin) {
      plugin.onUnmount();
      this.overlayPlugins.delete(layerName);
    }
  }

  /**
   * 注册每帧更新回调
   */
  onUpdate(callback: (delta: number) => void) {
    this.updateCallbacks.push(callback);
  }

  /**
   * 启动渲染循环
   */
  start() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const delta = this.clock.getDelta();
      this.controls.update();
      for (const cb of this.updateCallbacks) cb(delta);
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  stop() {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
  }

  private onResize(container: HTMLElement) {
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose() {
    this.stop();
    for (const plugin of this.overlayPlugins.values()) plugin.onUnmount();
    this.renderer.dispose();
  }
}
```

---

## 2. IFC/BIM 模型加载器 (web-ifc)

### 2.1 概述

前端使用 web-ifc (WASM) 直接解析 IFC 文件，渲染建筑结构。支持 IFC2X3 和 IFC4 格式，最大 200MB。

### 2.2 数据模型

```typescript
// MongoDB Collection: imported_models
interface ImportedModel {
  _id: ObjectId;
  projectId: string;
  fileName: string;
  fileType: 'IFC' | 'DWG' | 'STEP' | 'DXF';
  fileSize: number;              // bytes
  uploadedAt: Date;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  errorMessage?: string;

  geometry: {
    glbUrl: string;
    boundingBox: {
      min: [number, number, number];
      max: [number, number, number];
    };
    objectCount: number;
    triangleCount: number;
  };

  transform: {
    position: [number, number, number];
    rotation: [number, number, number];   // 欧拉角（度）
    scale: number;
    sourceUnit: 'mm' | 'cm' | 'm' | 'inch' | 'foot';
    targetUnit: 'm';
  };

  ifcMetadata?: {
    schema: 'IFC2X3' | 'IFC4';
    buildingStoreys: Array<{
      name: string;
      elevation: number;
      elements: string[];
    }>;
    spatialStructure: object;
  };

  lodVariants: Array<{
    level: 0 | 1 | 2;
    glbUrl: string;
    triangleCount: number;
  }>;

  createdBy: string;
  updatedAt: Date;
}
```

### 2.3 API

```
POST   /api/v1/projects/{projectId}/models/upload          # 上传（multipart, max 200MB）→ 202
GET    /api/v1/projects/{projectId}/models/{modelId}/status # 处理状态
PATCH  /api/v1/projects/{projectId}/models/{modelId}/transform  # 坐标变换
DELETE /api/v1/projects/{projectId}/models/{modelId}
```

### 2.4 前端 IFC 加载器

```typescript
import * as WebIFC from 'web-ifc';

class IFCLoader {
  private ifcApi: WebIFC.IfcAPI;

  async init() {
    this.ifcApi = new WebIFC.IfcAPI();
    await this.ifcApi.Init();
  }

  async loadIFC(buffer: ArrayBuffer): Promise<THREE.Group> {
    const modelID = this.ifcApi.OpenModel(new Uint8Array(buffer));
    const group = new THREE.Group();
    group.name = 'ifc-model';

    const flatMeshes = this.ifcApi.LoadAllGeometry(modelID);
    for (let i = 0; i < flatMeshes.size(); i++) {
      const flatMesh = flatMeshes.get(i);
      const mesh = this.createThreeMesh(flatMesh);
      mesh.userData.ifcExpressId = flatMesh.expressID;
      group.add(mesh);
    }

    const spatialTree = this.buildSpatialTree(modelID);
    group.userData.spatialTree = spatialTree;

    this.ifcApi.CloseModel(modelID);
    return group;
  }

  private createThreeMesh(flatMesh: WebIFC.FlatMesh): THREE.Mesh {
    const placedGeometries = flatMesh.geometries;
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    for (let j = 0; j < placedGeometries.size(); j++) {
      const pg = placedGeometries.get(j);
      const geomData = this.ifcApi.GetGeometry(0, pg.geometryExpressID);
      const verts = this.ifcApi.GetVertexArray(
        geomData.GetVertexData(), geomData.GetVertexDataSize()
      );
      const idx = this.ifcApi.GetIndexArray(
        geomData.GetIndexData(), geomData.GetIndexDataSize()
      );

      const offset = positions.length / 3;
      for (let k = 0; k < verts.length; k += 6) {
        positions.push(verts[k], verts[k+1], verts[k+2]);
        normals.push(verts[k+3], verts[k+4], verts[k+5]);
      }
      for (const id of idx) indices.push(id + offset);
      geomData.delete();
    }

    const mergedGeometry = new THREE.BufferGeometry();
    mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    mergedGeometry.setIndex(indices);

    return new THREE.Mesh(mergedGeometry, new THREE.MeshStandardMaterial({
      color: 0xcccccc, metalness: 0.1, roughness: 0.8, side: THREE.DoubleSide,
    }));
  }

  private buildSpatialTree(modelID: number): object {
    const lines = this.ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCBUILDINGSTOREY);
    const storeys = [];
    for (let i = 0; i < lines.size(); i++) {
      const props = this.ifcApi.GetLine(modelID, lines.get(i));
      storeys.push({
        expressId: lines.get(i),
        name: props.Name?.value || `Storey_${i}`,
        elevation: props.Elevation?.value || 0,
      });
    }
    return { storeys };
  }
}
```

### 2.5 坐标对齐与单位检测

```typescript
class ModelAligner {
  private static UNIT_TO_METERS: Record<string, number> = {
    'mm': 0.001, 'cm': 0.01, 'm': 1.0, 'inch': 0.0254, 'foot': 0.3048,
  };

  static applyTransform(model: THREE.Group, transform: ImportedModel['transform']) {
    const scaleFactor = this.UNIT_TO_METERS[transform.sourceUnit] * transform.scale;
    model.scale.setScalar(scaleFactor);
    model.position.set(...transform.position);
    model.rotation.set(
      THREE.MathUtils.degToRad(transform.rotation[0]),
      THREE.MathUtils.degToRad(transform.rotation[1]),
      THREE.MathUtils.degToRad(transform.rotation[2]),
    );
    model.updateMatrixWorld(true);
  }

  static detectUnit(boundingBox: THREE.Box3): string {
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 10000) return 'mm';
    if (maxDim > 1000) return 'cm';
    if (maxDim > 100) return 'foot';
    return 'm';
  }
}
```

### 2.6 验收标准

| AC ID | 描述 |
|-------|------|
| AC-IFC-1 | ≤200MB IFC 文件 10秒内完成解析渲染 |
| AC-IFC-2 | IFC 楼层结构正确解析到 spatial tree |
| AC-IFC-3 | 单位自动检测准确率 > 90% |
| AC-IFC-4 | 坐标变换修改后实时预览 |
| AC-IFC-5 | 超 200MB 文件给出错误提示 |

---

## 3. STEP/DXF 转换器 (FreeCAD 后端)

### 3.1 概述

服务端使用 FreeCAD headless 将 DWG/DXF/STEP 文件转换为 glTF/GLB，并通过 gltfpack 生成 LOD 变体。

### 3.2 转换流水线

```
DWG → (ODA File Converter) → DXF → (FreeCAD) → OBJ → (gltf-pipeline + Draco) → GLB
STEP → (FreeCAD) → OBJ → (gltf-pipeline + Draco) → GLB
```

### 3.3 后端实现

```python
# backend/services/cad_converter.py
import subprocess, os, shutil
from pathlib import Path

class CADConverter:
    """DWG/DXF/STEP → glTF 转换"""
    ODA_PATH = "/opt/ODAFileConverter/ODAFileConverter"

    async def convert_dwg(self, input_path: str, output_dir: str) -> str:
        dxf_path = os.path.join(output_dir, "converted.dxf")
        obj_path = os.path.join(output_dir, "converted.obj")
        glb_path = os.path.join(output_dir, "model.glb")

        # DWG → DXF
        subprocess.run([
            self.ODA_PATH,
            os.path.dirname(input_path), output_dir,
            "ACAD2018", "DXF", "0", "1", os.path.basename(input_path)
        ], check=True, timeout=120)

        # DXF → OBJ (FreeCAD headless)
        freecad_script = f'''
import FreeCAD, importDXF, Mesh
importDXF.open("{dxf_path}")
doc = FreeCAD.ActiveDocument
Mesh.export(doc.Objects, "{obj_path}")
'''
        subprocess.run(["freecadcmd", "-c", freecad_script], check=True, timeout=300)

        # OBJ → GLB (Draco)
        subprocess.run([
            "npx", "gltf-pipeline", "-i", obj_path, "-o", glb_path,
            "--draco.compressionLevel", "7"
        ], check=True, timeout=120)

        return glb_path

    async def convert_step(self, input_path: str, output_dir: str) -> str:
        obj_path = os.path.join(output_dir, "converted.obj")
        glb_path = os.path.join(output_dir, "model.glb")

        freecad_script = f'''
import FreeCAD, Import, Mesh
Import.open("{input_path}")
doc = FreeCAD.ActiveDocument
Mesh.export(doc.Objects, "{obj_path}")
'''
        subprocess.run(["freecadcmd", "-c", freecad_script], check=True, timeout=300)
        subprocess.run([
            "npx", "gltf-pipeline", "-i", obj_path, "-o", glb_path,
            "--draco.compressionLevel", "7"
        ], check=True, timeout=120)
        return glb_path

    async def generate_lod_variants(self, glb_path: str, output_dir: str) -> list:
        variants = []
        for level, ratio in [(0, 1.0), (1, 0.5), (2, 0.1)]:
            out_path = os.path.join(output_dir, f"model_lod{level}.glb")
            if level == 0:
                shutil.copy(glb_path, out_path)
            else:
                subprocess.run([
                    "npx", "gltfpack", "-i", glb_path, "-o", out_path,
                    "-si", str(ratio), "-cc",
                ], check=True, timeout=120)
            variants.append({"level": level, "glbUrl": out_path})
        return variants
```

### 3.4 验收标准

| AC ID | 描述 |
|-------|------|
| AC-CAD-1 | DWG 文件 60秒内完成转换并渲染 |
| AC-CAD-2 | STEP 文件 60秒内完成转换并渲染 |
| AC-CAD-3 | LOD 0/1/2 变体均可正确渲染 |

---

## 4. 设备标记系统 (Equipment Marker System)

### 4.1 概述

在 3D 模型上放置标记点（markers），每个标记绑定到设备表（equipment table）中的一条记录。标记显示设备名称、类型，作为所有数据叠加的锚点。

### 4.2 数据模型

```typescript
interface EquipmentMarker {
  equipmentId: string;           // 关联设备表 ID
  name: string;
  type: string;                  // 设备类型
  position: [number, number, number];  // 3D 场景坐标
  rotation: [number, number, number];
  modelUrl?: string;             // 自定义 3D 模型（可选）
  
  // 参数化建模
  parameters: Record<string, ParameterValue>;
  savedConfigs: Array<{
    name: string;
    parameters: Record<string, ParameterValue>;
    createdAt: Date;
    note?: string;
  }>;
}

interface ParameterDef {
  key: string;
  label: string;
  labelZh: string;
  type: 'number' | 'distribution' | 'enum' | 'boolean';
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  distribution?: {
    type: 'normal' | 'exponential' | 'uniform' | 'triangular' | 'constant';
    params: Record<string, number>;
  };
  options?: Array<{ value: string; label: string }>;
  category: 'timing' | 'capacity' | 'reliability' | 'energy' | 'custom';
}

type ParameterValue =
  | { type: 'number'; value: number }
  | { type: 'distribution'; distribution: string; params: Record<string, number> }
  | { type: 'enum'; value: string }
  | { type: 'boolean'; value: boolean };
```

### 4.3 API

```
GET    /api/v1/projects/{projectId}/equipment                    # 设备列表
GET    /api/v1/projects/{projectId}/equipment/{equipmentId}      # 设备详情（聚合）
PUT    /api/v1/projects/{projectId}/equipment/{equipmentId}/parameters  # 参数更新
POST   /api/v1/projects/{projectId}/equipment/{equipmentId}/configs     # 保存配置
POST   /api/v1/projects/{projectId}/equipment/batch-update       # 批量更新
```

### 4.4 Three.js 实现

```typescript
class ParametricEquipment extends THREE.Group {
  public equipmentId: string;
  public equipmentType: string;
  public parameters: Record<string, ParameterValue>;

  private baseMesh: THREE.Mesh;
  private label: CSS2DObject;
  private highlightMesh: THREE.Mesh;
  private isSelected: boolean = false;

  constructor(marker: EquipmentMarker) {
    super();
    this.equipmentId = marker.equipmentId;
    this.equipmentType = marker.type;
    this.parameters = marker.parameters;
    this.name = `equipment_${marker.equipmentId}`;
    this.position.set(...marker.position);
    this.rotation.set(
      THREE.MathUtils.degToRad(marker.rotation[0]),
      THREE.MathUtils.degToRad(marker.rotation[1]),
      THREE.MathUtils.degToRad(marker.rotation[2]),
    );
    this.userData = {
      type: 'equipment',
      equipmentId: marker.equipmentId,
      equipmentType: marker.type,
      interactive: true,
    };
  }

  updateVisualFromParams() {
    const capacity = this.parameters['capacity'];
    if (capacity?.type === 'number') {
      const scale = 0.5 + (capacity.value / 100) * 0.5;
      this.baseMesh.scale.setScalar(scale);
    }
    const reliability = this.parameters['reliability'];
    if (reliability?.type === 'number') {
      const mat = this.baseMesh.material as THREE.MeshStandardMaterial;
      const hue = reliability.value / 100;
      mat.color.setHSL(hue * 0.33, 0.7, 0.5);
    }
  }

  setSelected(selected: boolean) {
    this.isSelected = selected;
    if (this.highlightMesh) this.highlightMesh.visible = selected;
  }
}
```

### 4.5 参数编辑面板

```
┌─────────────────────────────────────┐
│ ⚙ CNC-001 参数编辑           [✕]   │
│ 类型: CNC_Machine                   │
│─────────────────────────────────────│
│ 配置: [默认配置 ▼] [💾保存] [📂加载] │
│─────────────────────────────────────│
│ ⏱ 时间参数                          │
│   加工周期  [正态分布 ▼]             │
│     均值: [60] sec  标准差: [5] sec  │
│     📊 [预览分布图]                  │
│   换型时间  [固定值 ▼]  值: [300] sec│
│                                     │
│ 📦 产能参数                          │
│   批次大小: [10] pcs  缓冲区: [5] pcs│
│                                     │
│ 🔧 可靠性                           │
│   MTBF: [480] min  MTTR: [30] min   │
│   可用率: 94.1% (自动计算)           │
│                                     │
│ ⚡ 能耗                              │
│   运行功率: [15.0] kW               │
│   待机功率: [2.0] kW                │
│                                     │
│ [重置默认] [应用到同类设备] [确定]    │
└─────────────────────────────────────┘
```

---

## 5. 实时数据叠加 (Real-time Data Overlay)

### 5.1 概述

将传感器读数绑定到 3D 标记上，按设备状态着色（idle=绿, busy=黄, failed=红, maintenance=橙, offline=灰）。通过 WebSocket 接收状态更新，支持平滑颜色过渡动画。

### 5.2 状态颜色映射

```typescript
enum EquipmentState {
  IDLE = 'idle',
  BUSY = 'busy',
  SETUP = 'setup',
  FAILED = 'failed',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline',
}

const STATE_COLORS: Record<EquipmentState, {
  color: string;
  emissive: string;
  emissiveIntensity: number;
  animation?: 'pulse' | 'blink';
}> = {
  idle:        { color: '#4CAF50', emissive: '#4CAF50', emissiveIntensity: 0.2 },
  busy:        { color: '#FFC107', emissive: '#FFC107', emissiveIntensity: 0.3 },
  setup:       { color: '#2196F3', emissive: '#2196F3', emissiveIntensity: 0.2 },
  failed:      { color: '#F44336', emissive: '#F44336', emissiveIntensity: 0.5, animation: 'blink' },
  maintenance: { color: '#FF9800', emissive: '#FF9800', emissiveIntensity: 0.3, animation: 'pulse' },
  offline:     { color: '#9E9E9E', emissive: '#000000', emissiveIntensity: 0.0 },
};
```

### 5.3 WebSocket 协议

```
WS /ws/v1/projects/{projectId}/status

→ 客户端: { "type": "subscribe", "equipmentIds": ["*"] }
← 服务端: StatusSnapshotMessage (首次)
← 服务端: StatusUpdateMessage (变更时)

interface StatusUpdateMessage {
  type: 'equipment_status_update';
  payload: {
    equipmentId: string;
    previousState: EquipmentState;
    currentState: EquipmentState;
    timestamp: number;
    metrics?: { utilization: number; cyclesCompleted: number; currentBatchProgress: number };
    alert?: { level: 'info' | 'warning' | 'critical'; message: string; code: string };
  };
}
```

### 5.4 实现方案

```typescript
class LiveStatusOverlay {
  private equipmentMap: Map<string, ParametricEquipment> = new Map();
  private ws: WebSocket | null = null;
  private transitions: Map<string, ColorTransition> = new Map();
  private animationMixers: Map<string, StatusAnimation> = new Map();

  connectWebSocket(url: string) {
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      this.ws!.send(JSON.stringify({ type: 'subscribe', equipmentIds: ['*'] }));
    };
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'equipment_status_snapshot') {
        for (const { equipmentId, state } of msg.payload.states) {
          this.setEquipmentState(equipmentId, state, false);
        }
      } else if (msg.type === 'equipment_status_update') {
        this.setEquipmentState(msg.payload.equipmentId, msg.payload.currentState, true);
        if (msg.payload.alert?.level === 'critical') {
          this.triggerAlertAnimation(msg.payload.equipmentId);
        }
      }
    };
    this.ws.onclose = () => setTimeout(() => this.connectWebSocket(url), 3000);
  }

  private setEquipmentState(equipmentId: string, state: EquipmentState, animate: boolean) {
    const equipment = this.equipmentMap.get(equipmentId);
    if (!equipment) return;
    const stateConfig = STATE_COLORS[state];
    const targetColor = new THREE.Color(stateConfig.color);
    const targetEmissive = new THREE.Color(stateConfig.emissive);

    equipment.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mat = child.material as THREE.MeshStandardMaterial;
      if (animate) {
        this.transitions.set(equipmentId, {
          startColor: mat.color.clone(),
          endColor: targetColor,
          startEmissive: mat.emissive.clone(),
          endEmissive: targetEmissive,
          startIntensity: mat.emissiveIntensity,
          endIntensity: stateConfig.emissiveIntensity,
          progress: 0,
          duration: 500,
          mesh: child,
        });
      } else {
        mat.color.copy(targetColor);
        mat.emissive.copy(targetEmissive);
        mat.emissiveIntensity = stateConfig.emissiveIntensity;
      }
    });
    this.updateAnimation(equipmentId, stateConfig.animation);
  }

  update(deltaMs: number) {
    // 颜色过渡
    for (const [id, t] of this.transitions) {
      t.progress += deltaMs / t.duration;
      const mat = t.mesh.material as THREE.MeshStandardMaterial;
      if (t.progress >= 1) {
        mat.color.copy(t.endColor);
        mat.emissive.copy(t.endEmissive);
        mat.emissiveIntensity = t.endIntensity;
        this.transitions.delete(id);
      } else {
        mat.color.lerpColors(t.startColor, t.endColor, t.progress);
        mat.emissive.lerpColors(t.startEmissive, t.endEmissive, t.progress);
        mat.emissiveIntensity = THREE.MathUtils.lerp(t.startIntensity, t.endIntensity, t.progress);
      }
    }
    // 闪烁/脉冲动画
    for (const anim of this.animationMixers.values()) anim.update(deltaMs);
  }

  private updateAnimation(equipmentId: string, type?: 'pulse' | 'blink') {
    this.animationMixers.delete(equipmentId);
    if (!type) return;
    const equipment = this.equipmentMap.get(equipmentId);
    if (equipment) this.animationMixers.set(equipmentId, new StatusAnimation(equipment, type));
  }

  private triggerAlertAnimation(equipmentId: string) {
    const equipment = this.equipmentMap.get(equipmentId);
    if (equipment) {
      this.animationMixers.set(`alert_${equipmentId}`,
        new StatusAnimation(equipment, 'blink', { frequency: 4, duration: 2000 }));
    }
  }
}
```

### 5.5 状态图例 UI

```
┌────────────────────────────┐
│ 设备状态                    │
│ ● 空闲 (12)   ● 运行 (45) │
│ ● 换型 (3)    ● 故障 (2)  │
│ ● 维护 (1)    ● 离线 (5)  │
│ 总利用率: 72.3%            │
│ 活跃告警: 3 ⚠              │
└────────────────────────────┘
```

### 5.6 验收标准

| AC ID | 描述 |
|-------|------|
| AC-STATUS-1 | WebSocket 连接后 < 1秒着色完成 |
| AC-STATUS-2 | 状态变更后 < 200ms 更新 |
| AC-STATUS-3 | 颜色过渡平滑 500ms |
| AC-STATUS-4 | 故障红色闪烁 / 维护橙色脉冲正确触发 |
| AC-STATUS-5 | 断线 3秒自动重连 |
| AC-STATUS-6 | 100台同时状态变更，帧率 ≥ 55fps |

---

## 6. 告警可视化 (Alert Visualization)

### 6.1 概述

设备有活跃告警时，在 3D 标记上显示脉冲光环（pulse ring），颜色按告警级别区分：
- `critical` → 红色脉冲环 + 闪烁
- `warning` → 黄色脉冲环
- `info` → 蓝色呼吸光效

### 6.2 实现

```typescript
class AlertPulseRing extends THREE.Mesh {
  private elapsed: number = 0;

  constructor(level: 'info' | 'warning' | 'critical') {
    const colors = { info: 0x2196F3, warning: 0xFFC107, critical: 0xF44336 };
    const geometry = new THREE.RingGeometry(1.5, 2.0, 32);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      color: colors[level],
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    super(geometry, material);
    this.renderOrder = 998;
  }

  update(deltaMs: number) {
    this.elapsed += deltaMs;
    const t = this.elapsed / 1000;
    // 脉冲扩散 + 淡出，循环
    const phase = (t % 1.5) / 1.5;  // 0→1 每 1.5 秒
    const scale = 1.0 + phase * 2.0;
    this.scale.setScalar(scale);
    (this.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - phase);
  }
}
```

---

## 7. Raycaster 交互系统

### 7.1 概述

统一的射线交互层：hover 时显示 tooltip，click 选中设备并弹出详情面板，支持 camera fly-to。

### 7.2 实现

```typescript
class EquipmentInteraction {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hoveredObject: THREE.Object3D | null = null;
  private selectedObject: THREE.Object3D | null = null;

  public onSelect: ((equipmentId: string) => void) | null = null;
  public onContextMenu: ((equipmentId: string, screenPos: {x:number,y:number}) => void) | null = null;

  constructor(
    private camera: THREE.Camera,
    private scene: THREE.Scene,
    private domElement: HTMLElement
  ) {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    domElement.addEventListener('click', this.onClick.bind(this));
    domElement.addEventListener('contextmenu', this.onRightClick.bind(this));
  }

  private getIntersectedEquipment(event: MouseEvent): THREE.Object3D | null {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    for (const hit of intersects) {
      let obj = hit.object;
      while (obj) {
        if (obj.userData?.type === 'equipment' && obj.userData?.interactive) return obj;
        obj = obj.parent!;
      }
    }
    return null;
  }

  private onMouseMove(event: MouseEvent) {
    const equipment = this.getIntersectedEquipment(event);
    if (equipment !== this.hoveredObject) {
      if (this.hoveredObject) this.setHoverEffect(this.hoveredObject, false);
      if (equipment) {
        this.setHoverEffect(equipment, true);
        (event.target as HTMLElement).style.cursor = 'pointer';
      } else {
        (event.target as HTMLElement).style.cursor = 'default';
      }
      this.hoveredObject = equipment;
    }
  }

  private onClick(event: MouseEvent) {
    const equipment = this.getIntersectedEquipment(event);
    if (this.selectedObject) this.setSelectEffect(this.selectedObject, false);
    if (equipment) {
      this.setSelectEffect(equipment, true);
      this.selectedObject = equipment;
      this.onSelect?.(equipment.userData.equipmentId);
    } else {
      this.selectedObject = null;
      this.onSelect?.('');
    }
  }

  private onRightClick(event: MouseEvent) {
    event.preventDefault();
    const equipment = this.getIntersectedEquipment(event);
    if (equipment) {
      this.onContextMenu?.(equipment.userData.equipmentId, { x: event.clientX, y: event.clientY });
    }
  }

  private setHoverEffect(obj: THREE.Object3D, hover: boolean) {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (hover) {
          child.userData._originalEmissiveIntensity = mat.emissiveIntensity;
          mat.emissiveIntensity = Math.min(mat.emissiveIntensity + 0.3, 1.0);
        } else {
          mat.emissiveIntensity = child.userData._originalEmissiveIntensity ?? 0;
        }
      }
    });
  }

  private setSelectEffect(obj: THREE.Object3D, selected: boolean) {
    if (obj instanceof ParametricEquipment) obj.setSelected(selected);
  }
}
```

### 7.3 设备详情面板

```
┌────────────────────────────────────────┐
│ CNC-003  数控铣床              [✕] [📌]│
│ 区域: A-2 加工区 | 楼层: 1F           │
│────────────────────────────────────────│
│ [概览] [传感器] [告警] [工单] [参数]   │
│────────────────────────────────────────│
│ 当前状态: 🔴 故障  (12分钟)           │
│ ── 传感器读数 ──                       │
│ 主轴温度: 85.2°C ⚠  主轴转速: 0 rpm  │
│ 振动: 2.3 mm/s ✓    功率: 0.5 kW     │
│ ── 活跃告警 ──                         │
│ 🔴 E-1023 主轴过温  12:35  [确认]     │
│ 🟡 W-0451 润滑液低  11:20  [确认]     │
│ ── 今日统计 ──                         │
│ 利用率: 62.3%  完成: 128件            │
│ 停机: 45min  能耗: 18.5 kWh           │
│ [创建工单] [运行诊断] [查看历史]        │
└────────────────────────────────────────┘
```

### 7.4 右键上下文菜单

```
┌──────────────────────┐
│ 📋 查看详情          │
│ 📊 查看历史数据      │
│ 🔧 创建维修工单      │
│ 🩺 运行诊断          │
│ ⚙ 编辑参数          │
│ ───────────────────  │
│ 📍 聚焦此设备        │
│ 👁 隐藏此设备        │
│ 📎 复制设备ID        │
└──────────────────────┘
```

### 7.5 验收标准

| AC ID | 描述 |
|-------|------|
| AC-RAY-1 | hover 高亮反馈 < 16ms |
| AC-RAY-2 | 点击后 < 500ms 弹出详情面板 |
| AC-RAY-3 | 传感器读数每 5秒刷新 |
| AC-RAY-4 | 面板可固定（📌），固定后点击空白不关闭 |

---

## 8. OrbitControls 与预设视角

### 8.1 概述

支持保存/加载摄像机位置预设，平滑 fly-to 过渡动画，聚焦设备时自动计算最佳观察距离。

### 8.2 数据模型

```typescript
interface CameraPreset {
  id: string;
  name: string;
  nameZh: string;
  type: 'overview' | 'zone' | 'equipment' | 'custom';
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
    near: number;
    far: number;
  };
  layerPresetId?: string;
  focusTarget?: { type: 'equipment' | 'zone'; id: string };
  thumbnail?: string;
  isDefault: boolean;
  order: number;
}

interface SplitScreenConfig {
  enabled: boolean;
  layout: '1x2' | '2x1' | '2x2';
  viewports: Array<{
    presetId: string;
    layerPresetId?: string;
    syncCamera: boolean;
  }>;
}
```

### 8.3 Camera Manager

```typescript
class CameraManager {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private presets: CameraPreset[] = [];
  private transition: CameraTransition | null = null;

  transitionToPreset(presetId: string, duration: number = 1000) {
    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) return;
    this.transition = {
      startPosition: this.camera.position.clone(),
      endPosition: new THREE.Vector3(...preset.camera.position),
      startTarget: this.controls.target.clone(),
      endTarget: new THREE.Vector3(...preset.camera.target),
      startFov: this.camera.fov,
      endFov: preset.camera.fov,
      progress: 0,
      duration,
    };
  }

  focusOnEquipment(equipment: THREE.Object3D, padding: number = 2) {
    const box = new THREE.Box3().setFromObject(equipment);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = (maxDim / 2) / Math.tan(fov / 2) * padding;
    const direction = this.camera.position.clone().sub(this.controls.target).normalize();
    this.transition = {
      startPosition: this.camera.position.clone(),
      endPosition: center.clone().add(direction.multiplyScalar(distance)),
      startTarget: this.controls.target.clone(),
      endTarget: center,
      startFov: this.camera.fov,
      endFov: this.camera.fov,
      progress: 0,
      duration: 800,
    };
  }

  saveCurrentAsPreset(name: string): CameraPreset {
    return {
      id: `preset_${Date.now()}`,
      name, nameZh: name, type: 'custom',
      camera: {
        position: this.camera.position.toArray() as [number, number, number],
        target: this.controls.target.toArray() as [number, number, number],
        fov: this.camera.fov, near: this.camera.near, far: this.camera.far,
      },
      isDefault: false, order: this.presets.length,
    };
  }

  update(deltaMs: number) {
    if (!this.transition) return;
    const t = this.transition;
    t.progress += deltaMs / t.duration;
    if (t.progress >= 1) {
      this.camera.position.copy(t.endPosition);
      this.controls.target.copy(t.endTarget);
      this.camera.fov = t.endFov;
      this.camera.updateProjectionMatrix();
      this.transition = null;
    } else {
      const ease = t.progress < 0.5
        ? 4 * t.progress ** 3
        : 1 - (-2 * t.progress + 2) ** 3 / 2;
      this.camera.position.lerpVectors(t.startPosition, t.endPosition, ease);
      this.controls.target.lerpVectors(t.startTarget, t.endTarget, ease);
      this.camera.fov = THREE.MathUtils.lerp(t.startFov, t.endFov, ease);
      this.camera.updateProjectionMatrix();
    }
    this.controls.update();
  }
}
```

### 8.4 视角选择栏 UI

```
┌──────────────────────────────────────────────────────────────┐
│ 📷 [全景] [A区加工] [B区装配] [C区仓储] [+保存当前] | [分屏]│
└──────────────────────────────────────────────────────────────┘
```

### 8.5 验收标准

| AC ID | 描述 |
|-------|------|
| AC-CAM-1 | 视角切换平滑过渡 800~1200ms |
| AC-CAM-2 | 聚焦设备自动计算最佳距离 |
| AC-CAM-3 | 预设含缩略图，持久化到后端 |
| AC-CAM-4 | 分屏 1x2 下两视口独立渲染 |
| AC-CAM-5 | 同步模式下旋转联动 |
| AC-CAM-6 | 分屏帧率 ≥ 45fps |

---

## 9. 场景序列化 (Scene Serialization)

### 9.1 概述

保存/加载完整场景状态：camera 位置、图层可见性与透明度、激活的叠加层配置。

### 9.2 数据模型

```typescript
interface SceneState {
  projectId: string;
  name: string;
  camera: CameraPreset['camera'];
  layers: Array<{ id: string; visible: boolean; opacity: number }>;
  activeOverlays: string[];   // 激活的 overlay plugin layerName 列表
  savedAt: Date;
}
```

### 9.3 API

```
GET    /api/v1/projects/{projectId}/scene-states
POST   /api/v1/projects/{projectId}/scene-states
PUT    /api/v1/projects/{projectId}/scene-states/{stateId}
DELETE /api/v1/projects/{projectId}/scene-states/{stateId}
```

---

## 10. 图层管理系统

### 10.1 概述

类似 GIS 的图层管理：基盘提供基础图层（建筑外壳、管线、设备、分区），模块叠加层作为动态图层注册进来。

### 10.2 数据模型

```typescript
interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  locked: boolean;
  order: number;
  renderSettings: {
    wireframe: boolean;
    transparent: boolean;
    color?: string;
    emissiveIntensity: number;
    castShadow: boolean;
    receiveShadow: boolean;
  };
  filter: {
    objectTypes?: string[];
    tags?: string[];
    zoneIds?: string[];
    equipmentIds?: string[];
  };
}

enum LayerType {
  BUILDING_SHELL = 'building_shell',
  UTILITIES = 'utilities',
  EQUIPMENT = 'equipment',
  ZONES = 'zones',
  SAFETY = 'safety',
  OVERLAY_PLUGIN = 'overlay_plugin',  // 模块叠加层
  CUSTOM = 'custom',
}
```

### 10.3 图层面板 UI

```
┌────────────────────────────┐
│ 📑 图层管理        [≡] [✕] │
│────────────────────────────│
│ 预设: [默认 ▼] [💾] [+]    │
│────────────────────────────│
│ ── 基盘图层 ──             │
│ ☑ 👁 🔒  建筑外壳  ■━━━━━  │
│ ☐ 👁 🔒  管线设施  ━━━━━━  │
│ ☑ 👁 🔓  设备      ■━━━━━━ │
│ ☑ 👁 🔓  功能分区  ■━━━━━  │
│ ☐ 👁 🔓  安全设施  ━━━━━━  │
│ ── 模块叠加层 ──           │
│ ☐ 👁 🔓  人流粒子  ━━━━━━  │ ← TrafficOps
│ ☐ 👁 🔓  热力图    ━━━━━━  │ ← TrafficOps
│ ☐ 👁 🔓  管网流向  ━━━━━━  │ ← HeatOps
│ ☐ 👁 🔓  摄像头视锥 ━━━━━  │ ← VisionOps
│────────────────────────────│
│ [+ 自定义图层]              │
└────────────────────────────┘
```

### 10.4 验收标准

| AC ID | 描述 |
|-------|------|
| AC-LAYER-1 | 图层切换延迟 < 50ms |
| AC-LAYER-2 | 透明度滑块拖拽实时预览 |
| AC-LAYER-3 | Solo 模式隐藏其他图层 |
| AC-LAYER-4 | IFC 导入后按类型自动分层，准确率 > 85% |
| AC-LAYER-5 | 预设保存/加载 < 100ms |

---

## 11. 响应式布局

### 11.1 概述

- **Desktop**: 3D 场景占主区域，右侧 side panel 显示详情/参数
- **Mobile**: 3D 场景在上，面板在下（stacked layout），手势操作替代鼠标

### 11.2 断点

| 断点 | 布局 |
|------|------|
| ≥ 1024px | Side panel（右侧 400px） |
| < 1024px | Stacked（底部 sheet） |

---

## 12. 性能优化

### 12.1 策略

#### LOD (Level of Detail)

```typescript
class LODManager {
  private static LOD_DISTANCES = [0, 50, 150]; // meters

  createLOD(highDetail: THREE.Object3D, mediumDetail: THREE.Object3D, lowDetail: THREE.Object3D): THREE.LOD {
    const lod = new THREE.LOD();
    lod.addLevel(highDetail, 0);
    lod.addLevel(mediumDetail, 50);
    lod.addLevel(lowDetail, 150);
    return lod;
  }

  static generateLOD2Proxy(original: THREE.Object3D): THREE.Mesh {
    const box = new THREE.Box3().setFromObject(original);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const proxy = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    proxy.position.copy(center);
    return proxy;
  }
}
```

#### Instanced Rendering（同类设备批量渲染）

```typescript
class InstancedEquipmentRenderer {
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();

  createInstancedGroup(
    equipmentType: string,
    templateGeometry: THREE.BufferGeometry,
    templateMaterial: THREE.Material,
    instances: Array<{ equipmentId: string; position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }>
  ): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(templateGeometry, templateMaterial, instances.length);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    mesh.userData.instanceMap = {};

    for (let i = 0; i < instances.length; i++) {
      quaternion.setFromEuler(instances[i].rotation);
      matrix.compose(instances[i].position, quaternion, instances[i].scale);
      mesh.setMatrixAt(i, matrix);
      mesh.userData.instanceMap[i] = instances[i].equipmentId;
    }
    mesh.instanceMatrix.needsUpdate = true;
    this.instancedMeshes.set(equipmentType, mesh);
    return mesh;
  }

  setInstanceColor(equipmentType: string, instanceIndex: number, color: THREE.Color) {
    const mesh = this.instancedMeshes.get(equipmentType);
    if (!mesh) return;
    mesh.setColorAt(instanceIndex, color);
    mesh.instanceColor!.needsUpdate = true;
  }
}
```

#### Frustum Culling (Octree 空间索引)

```typescript
class FrustumCullingManager {
  private frustum: THREE.Frustum = new THREE.Frustum();
  private projScreenMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private octree: Octree;

  buildSpatialIndex(objects: THREE.Object3D[]) {
    this.octree = new Octree();
    for (const obj of objects) {
      this.octree.insert(obj, new THREE.Box3().setFromObject(obj));
    }
  }

  update(camera: THREE.Camera) {
    this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    const visible = this.octree.queryFrustum(this.frustum);
    this.octree.forEach((obj) => { obj.visible = visible.has(obj); });
  }
}
```

#### 自适应质量

```typescript
adaptiveQuality(renderer: THREE.WebGLRenderer, currentFps: number) {
  if (currentFps < 30) {
    renderer.setPixelRatio(Math.max(0.5, window.devicePixelRatio * 0.5));
    renderer.shadowMap.enabled = false;
  } else if (currentFps < 50) {
    renderer.setPixelRatio(Math.max(0.75, window.devicePixelRatio * 0.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
  } else {
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
}
```

### 12.2 性能预算

| 指标 | 目标 |
|------|------|
| FPS (1000 objects) | ≥ 60fps |
| FPS (分屏) | ≥ 45fps |
| Draw calls | ≤ 100 |
| 三角面（可见） | ≤ 500K |
| GPU 内存 | ≤ 512MB |
| 首屏加载 | ≤ 3秒 |
| IFC 解析 (200MB) | ≤ 10秒 |
| 内存占用 | ≤ 1GB |

---

## 13. 通用 API 汇总

基盘暴露以下 API，模块叠加层可直接调用：

| 端点 | 说明 |
|------|------|
| `GET /api/v1/projects/{pid}/equipment` | 设备列表（含坐标、状态） |
| `GET /api/v1/projects/{pid}/equipment/{eid}/detail` | 设备聚合详情 |
| `GET /api/v1/projects/{pid}/equipment/status` | 全设备状态快照 |
| `WS /ws/v1/projects/{pid}/status` | 实时状态推送 |
| `GET /api/v1/projects/{pid}/alerts` | 告警列表 |
| `GET /api/v1/projects/{pid}/equipment/{eid}/sensors/{sid}/history` | 传感器历史 |
| `POST /api/v1/projects/{pid}/models/upload` | 模型上传 |
| `GET/PUT /api/v1/projects/{pid}/layers` | 图层配置 |
| `GET/POST /api/v1/projects/{pid}/camera-presets` | 视角预设 |
| `GET/POST /api/v1/projects/{pid}/scene-states` | 场景序列化 |
| `POST /api/v1/projects/{pid}/work-orders` | 创建工单 |
| `POST /api/v1/projects/{pid}/equipment/{eid}/diagnose` | 运行诊断 |

---

# 第二部分：模块叠加层 (Module-Specific 3D Overlays)

> 每个业务模块通过 `3DOverlayPlugin` 接口向基盘注册自己的可视化图层。
> 基盘负责统一的渲染循环、图层面板集成和生命周期管理。

---

## 插件接口定义

```typescript
// frontend/src/components/3d/types/OverlayPlugin.ts

/**
 * 3D 叠加层插件接口
 * 每个业务模块实现此接口，注册到 SceneManager
 */
interface ThreeDOverlayPlugin {
  /** 图层唯一标识，显示在图层面板中 */
  layerName: string;

  /** 图层中文显示名 */
  layerLabel: string;

  /** 所属模块 */
  module: 'TrafficOps' | 'HeatOps' | 'VisionOps' | 'FMS';

  /** 图层默认是否可见 */
  defaultVisible: boolean;

  /** 图层默认透明度 */
  defaultOpacity: number;

  /**
   * 挂载：将 3D 对象加入场景
   * 在此创建 mesh / particles / overlays 并 add 到 scene
   */
  onMount(scene: THREE.Scene, camera: THREE.Camera): void;

  /**
   * 每帧更新：动画、数据刷新
   * @param delta 距上一帧秒数
   */
  onUpdate(delta: number): void;

  /**
   * 卸载：清理 3D 对象、dispose geometry/material/texture
   */
  onUnmount(): void;

  /**
   * 可选：接收来自基盘的事件
   */
  onEvent?(event: OverlayEvent): void;
}

type OverlayEvent =
  | { type: 'equipment_selected'; equipmentId: string }
  | { type: 'camera_changed'; position: THREE.Vector3; target: THREE.Vector3 }
  | { type: 'visibility_changed'; visible: boolean }
  | { type: 'opacity_changed'; opacity: number };
```

### 插件注册示例

```typescript
// frontend/src/modules/TrafficOps/3d/index.ts
import { SceneManager } from '@/components/3d/SceneManager';
import { PeopleFlowPlugin } from './PeopleFlowPlugin';
import { QueueBarPlugin } from './QueueBarPlugin';
import { HeatmapPlugin } from './HeatmapPlugin';

export function registerTrafficOpsOverlays(sceneManager: SceneManager) {
  sceneManager.registerOverlay(new PeopleFlowPlugin());
  sceneManager.registerOverlay(new QueueBarPlugin());
  sceneManager.registerOverlay(new HeatmapPlugin());
}
```

---

## 模块 1: TrafficOps — 客流运营

> 位置: `frontend/src/modules/TrafficOps/3d/`

### 1.1 人流粒子模拟 (PeopleFlowPlugin)

**layerName:** `trafficops_people_flow`

通过 checkpoint 之间的粒子流模拟旅客移动。支持两种渲染模式：
- **3D 粒子模式**: THREE.Points + BufferGeometry，粒子沿路径移动
- **SVG 叠加模式**: 在 2D 平面图上用 SVG 动画显示流向

```typescript
class PeopleFlowPlugin implements ThreeDOverlayPlugin {
  layerName = 'trafficops_people_flow';
  layerLabel = '人流粒子';
  module = 'TrafficOps' as const;
  defaultVisible = false;
  defaultOpacity = 0.8;

  private particles: THREE.Points;
  private paths: FlowPath[];          // checkpoint 间路径
  private particleCount = 5000;
  private scene: THREE.Scene;

  onMount(scene: THREE.Scene) {
    this.scene = scene;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: this.defaultOpacity,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geometry, material);
    this.particles.name = 'trafficops_people_flow';
    scene.add(this.particles);
  }

  onUpdate(delta: number) {
    // 每帧沿 path 移动粒子，到达终点后重置到起点
    const positions = this.particles.geometry.attributes.position.array as Float32Array;
    // ... 粒子物理更新逻辑
    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  onUnmount() {
    this.scene.remove(this.particles);
    this.particles.geometry.dispose();
    (this.particles.material as THREE.Material).dispose();
  }
}
```

### 1.2 队列可视化 (QueueBarPlugin)

**layerName:** `trafficops_queue_bars`

在每个 checkpoint 位置显示竖向柱状图，高度 = 队列长度，颜色按拥挤程度分级。

```typescript
class QueueBarPlugin implements ThreeDOverlayPlugin {
  layerName = 'trafficops_queue_bars';
  layerLabel = '排队柱状图';
  module = 'TrafficOps' as const;
  defaultVisible = false;
  defaultOpacity = 0.9;

  private bars: Map<string, THREE.Mesh> = new Map();

  onMount(scene: THREE.Scene) {
    // 为每个 checkpoint 创建一个 BoxGeometry bar
    // 高度初始 = 0，通过 onUpdate 动态更新
  }

  onUpdate(delta: number) {
    // 从 WebSocket 获取最新队列长度数据
    // 更新每个 bar 的 scaleY 和颜色
  }

  onUnmount() { /* dispose all bars */ }
}
```

### 1.3 热力图叠加 (HeatmapPlugin)

**layerName:** `trafficops_heatmap`

在地面楼板上渲染人流密度热力图，使用 DataTexture + ShaderMaterial。

```typescript
class HeatmapPlugin implements ThreeDOverlayPlugin {
  layerName = 'trafficops_heatmap';
  layerLabel = '人流热力图';
  module = 'TrafficOps' as const;
  defaultVisible = false;
  defaultOpacity = 0.7;

  private mesh: THREE.Mesh;
  private dataTexture: THREE.DataTexture;
  private material: THREE.ShaderMaterial;

  onMount(scene: THREE.Scene) {
    // 创建 PlaneGeometry（水平放置）
    // DataTexture: R 通道存归一化密度值
    // ShaderMaterial: color ramp 映射（蓝→青→绿→黄→红）
    const width = 100, height = 100;
    const data = new Float32Array(width * height);
    this.dataTexture = new THREE.DataTexture(data, width, height, THREE.RedFormat, THREE.FloatType);
    this.dataTexture.minFilter = THREE.LinearFilter;
    this.dataTexture.magFilter = THREE.LinearFilter;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uDataTexture: { value: this.dataTexture },
        uOpacity: { value: this.defaultOpacity },
        // color stops uniforms...
      },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        uniform sampler2D uDataTexture;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          float v = texture2D(uDataTexture, vUv).r;
          if (v < 0.001) discard;
          // color ramp mapping...
          vec3 color = mix(vec3(0,0,1), vec3(1,0,0), v);
          gl_FragColor = vec4(color, uOpacity * smoothstep(0.0, 0.05, v));
        }
      `,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });

    const geometry = new THREE.PlaneGeometry(100, 100);
    geometry.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.y = 0.05;
    this.mesh.renderOrder = 999;
    scene.add(this.mesh);
  }

  onUpdate(delta: number) {
    // WebSocket 推送新数据帧时更新 dataTexture
  }

  onEvent(event: OverlayEvent) {
    if (event.type === 'opacity_changed') {
      this.material.uniforms.uOpacity.value = event.opacity;
    }
  }

  onUnmount() {
    this.dataTexture.dispose();
    this.material.dispose();
    this.mesh.geometry.dispose();
  }
}
```

### 1.4 公交到站动画事件

当公交到站事件触发时，在对应站点显示动画效果（光柱 + 扩散环）。

### 1.5 验收标准

| AC ID | 描述 |
|-------|------|
| AC-TRAFFIC-1 | 5000 粒子场景 ≥ 60fps |
| AC-TRAFFIC-2 | 热力图 100x100 网格渲染 ≥ 60fps |
| AC-TRAFFIC-3 | WebSocket 推送后 500ms 内热力图更新 |
| AC-TRAFFIC-4 | 队列柱状图高度实时响应数据变化 |
| AC-TRAFFIC-5 | 各图层可独立开关，不影响其他模块 |

---

## 模块 2: HeatOps — 供热运营

> 位置: `frontend/src/modules/HeatOps/3d/`

### 2.1 管网可视化 (PipeNetworkPlugin)

**layerName:** `heatops_pipe_network`

显示供热管网的 3D 管道：
- 管道颜色 = 温度梯度（蓝色冷端 → 红色热端）
- 流向箭头沿管道方向移动（animated UV offset 或粒子）
- 管径按实际比例

```typescript
class PipeNetworkPlugin implements ThreeDOverlayPlugin {
  layerName = 'heatops_pipe_network';
  layerLabel = '管网流向';
  module = 'HeatOps' as const;
  defaultVisible = false;
  defaultOpacity = 1.0;

  private pipes: THREE.Group = new THREE.Group();

  onMount(scene: THREE.Scene) {
    // 从 API 获取管网拓扑
    // 每段管道 = TubeGeometry + ShaderMaterial（温度颜色 + 流向箭头动画）
    scene.add(this.pipes);
  }

  onUpdate(delta: number) {
    // 更新流向箭头 UV offset（产生流动效果）
    // 更新温度颜色
    this.pipes.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
        child.material.uniforms.uTime.value += delta;
      }
    });
  }

  onUnmount() { /* dispose pipes group */ }
}
```

### 2.2 换热站 3D 标记 (HeatStationPlugin)

**layerName:** `heatops_stations`

在换热站位置显示 3D 标记，附带实时效率仪表盘（3D gauge 或 CSS2DObject）。

```typescript
class HeatStationPlugin implements ThreeDOverlayPlugin {
  layerName = 'heatops_stations';
  layerLabel = '换热站效率';
  module = 'HeatOps' as const;
  defaultVisible = false;
  defaultOpacity = 1.0;

  onMount(scene: THREE.Scene) {
    // 每个换热站 = 3D marker + CSS2DObject gauge
    // gauge 显示：供水温度、回水温度、效率百分比
  }

  onUpdate(delta: number) {
    // 从 WebSocket 获取实时数据，更新 gauge 值和颜色
  }

  onUnmount() { /* cleanup */ }
}
```

### 2.3 验收标准

| AC ID | 描述 |
|-------|------|
| AC-HEAT-1 | 管网颜色正确反映温度梯度 |
| AC-HEAT-2 | 流向箭头动画方向与实际一致 |
| AC-HEAT-3 | 换热站 gauge 数据 < 500ms 更新 |

---

## 模块 3: VisionOps — 智能视觉

> 位置: `frontend/src/modules/VisionOps/3d/`

### 3.1 摄像头视锥可视化 (CameraFOVPlugin)

**layerName:** `visionops_camera_fov`

在 3D 场景中显示每个摄像头的视场角（FOV）锥体：
- 半透明锥体 mesh
- 颜色按摄像头状态（在线=绿, 离线=灰, 检测到事件=红）
- hover 显示摄像头信息 tooltip

```typescript
class CameraFOVPlugin implements ThreeDOverlayPlugin {
  layerName = 'visionops_camera_fov';
  layerLabel = '摄像头视锥';
  module = 'VisionOps' as const;
  defaultVisible = false;
  defaultOpacity = 0.3;

  private cones: Map<string, THREE.Mesh> = new Map();

  onMount(scene: THREE.Scene) {
    // 从 API 获取摄像头列表（位置、朝向、FOV角度、最大距离）
    // 每个摄像头 = ConeGeometry（朝向视野方向）
    // material: MeshBasicMaterial, transparent, low opacity
  }

  onUpdate(delta: number) {
    // 更新摄像头状态颜色
  }

  onEvent(event: OverlayEvent) {
    if (event.type === 'equipment_selected') {
      // 高亮选中摄像头的视锥
    }
  }

  onUnmount() { /* dispose all cones */ }
}
```

### 3.2 检测框投影 (DetectionBoxPlugin)

**layerName:** `visionops_detections`

将 AI 检测结果（bounding box）投影到 3D 场景中的对应位置。

```typescript
class DetectionBoxPlugin implements ThreeDOverlayPlugin {
  layerName = 'visionops_detections';
  layerLabel = 'AI检测框';
  module = 'VisionOps' as const;
  defaultVisible = false;
  defaultOpacity = 0.6;

  onMount(scene: THREE.Scene) {
    // 通过 WebSocket 接收实时检测事件
    // 每个检测 = wireframe BoxHelper，颜色按类别
    // 自动淡出（2秒后消失）
  }

  onUpdate(delta: number) {
    // 更新检测框淡出动画
    // 移除过期检测框
  }

  onUnmount() { /* cleanup */ }
}
```

### 3.3 验收标准

| AC ID | 描述 |
|-------|------|
| AC-VISION-1 | 视锥方向与摄像头实际朝向一致 |
| AC-VISION-2 | 检测框 < 200ms 内投影到 3D 场景 |
| AC-VISION-3 | 检测框 2秒后自动淡出 |

---

## 模块 4: FMS — 设施管理

> 位置: `frontend/src/modules/FMS/3d/`

### 4.1 设备生命周期可视化 (LifecyclePlugin)

**layerName:** `fms_lifecycle`

按设备剩余寿命和 LCC（Life Cycle Cost）状态着色：
- 剩余寿命 > 50% → 绿色
- 剩余寿命 20~50% → 黄色
- 剩余寿命 < 20% → 红色
- LCC 超预算 → 紫色描边

```typescript
class LifecyclePlugin implements ThreeDOverlayPlugin {
  layerName = 'fms_lifecycle';
  layerLabel = '设备寿命';
  module = 'FMS' as const;
  defaultVisible = false;
  defaultOpacity = 1.0;

  onMount(scene: THREE.Scene) {
    // 从 API 获取设备生命周期数据
    // 遍历场景中的设备 marker，覆盖材质颜色
  }

  onUpdate(delta: number) {
    // 定期刷新生命周期数据（每 30秒）
    // 更新颜色
  }

  onEvent(event: OverlayEvent) {
    if (event.type === 'equipment_selected') {
      // 在详情面板中显示 LCC 明细
    }
  }

  onUnmount() {
    // 恢复原始材质颜色
  }
}
```

### 4.2 验收标准

| AC ID | 描述 |
|-------|------|
| AC-FMS-1 | 设备颜色正确反映剩余寿命百分比 |
| AC-FMS-2 | LCC 超预算设备有明显视觉区分 |
| AC-FMS-3 | 图层开关后正确恢复原始设备颜色 |

---

# 附录

## A. 技术栈

| 层级 | 技术 |
|------|------|
| 3D 渲染 | Three.js r160+ |
| IFC 解析 | web-ifc (WASM) |
| CAD 转换 | ODA File Converter / FreeCAD (server-side) |
| 模型压缩 | Draco / gltfpack (meshoptimizer) |
| UI 框架 | React 18 + TypeScript |
| 状态管理 | Zustand |
| WebSocket | ws (server) / native WebSocket (client) |
| 后端 | FastAPI (Python) |
| 数据库 | MongoDB |
| 文件存储 | MinIO / S3 |

## B. 依赖包

```json
{
  "three": "^0.160.0",
  "web-ifc": "^0.0.50",
  "@types/three": "^0.160.0",
  "three-stdlib": "^2.28.0",
  "lil-gui": "^0.19.0",
  "stats.js": "^0.17.0"
}
```

## C. 开发里程碑

| 阶段 | 内容 | 预估工时 |
|------|------|----------|
| Phase 1 (4周) | 基盘核心：Scene Manager + IFC loader + 设备标记 + 状态叠加 + 交互 + 性能优化 | 160h |
| Phase 2 (2周) | 基盘增强：CAD converter + 图层系统 + 视角预设 + 场景序列化 | 80h |
| Phase 3 (2周) | TrafficOps 叠加层：粒子 + 队列 + 热力图 | 80h |
| Phase 4 (1周) | HeatOps 叠加层：管网 + 换热站 | 40h |
| Phase 5 (1周) | VisionOps 叠加层：视锥 + 检测框 | 40h |
| Phase 6 (1周) | FMS 叠加层：生命周期可视化 | 40h |
| Phase 7 (1周) | 集成测试 + 性能调优 + 文档 | 40h |
| **总计** | | **480h (~12周)** |

---

> **文档结束** — 如有疑问请联系 FactVerse AI Agent Team
