# Mock Data Elimination Plan

> **Goal**: Replace 110+ inline mock pages with backend data generators, so every page runs on real API data.
>
> **Principle**: Backend generates → DB stores → API serves → Frontend displays. No more `const mockData = [...]` in Vue files.
>
> **Status (2026-04-08)**: ✅ Phase 0-3 完成（所有 ModuleGenerator 已实现），🔄 Phase 4-5 待执行

---

## Current State

### Mock 数据分布

| 模块 | 总页面 | 有API | 纯Mock | 优先级 |
|------|--------|-------|--------|--------|
| manager（移动端） | 53 | 8 | 45 | P1 — 依赖其他模块数据 |
| heatops | 32 | 9 | 23 | P0 — 正东电子客户 |
| parking | 5 | 1 | 4 | P2 |
| feedback | 4 | 0 | 4 | P3 |
| pm | 4 | 0 | 4 | P2 |
| inventory | 4 | 0 | 4 | P2 |
| iaq | 4 | 1 | 3 | P2 |
| lighting | 4 | 1 | 3 | P3 |
| fire | 4 | 1 | 3 | P2 |
| water | 4 | 1 | 3 | P2 |
| visitor | 4 | 1 | 3 | P3 |
| cleaning | 4 | 1 | 3 | P3 |
| space | 4 | 1 | 3 | P2 |
| contractor | 4 | 1 | 3 | P3 |
| visionops | 6 | 3 | 3 | P2 |
| chiller | 6 | 3 | 3 | P2 |
| ups | 3 | 1 | 2 | P3 |
| esg | 4 | 2 | 2 | P3 |
| **Total** | **~153** | **~39** | **~114** | |

### 现有 Mock 机制（3 层）

1. **`mock/factory.ts`** (182 行) — 基盘通用 mock（Equipment/Alert/Station/WorkOrder）
2. **`views/heatops/mockData.ts`** (567 行) — HeatOps 751 园区专用
3. **各 Vue 文件 inline `const mock*`** — 散装，最多最乱

### 已有可复用基础设施

| 组件 | 位置 | 做什么 |
|------|------|--------|
| PdM Simulator | `backend/.../simulator/` | 5 分钟周期写传感器数据，已产生 270K+ readings |
| PLC Simulator | `backend/.../heatops/simulator/` | 模拟 PLC 设备读写，物理模型（温度/压力/流量） |
| demoDataGenerator.ts | `frontend/src/utils/` | LCG 确定性伪随机，设备物理模型（振动/温度/效率） |
| Golden Snapshots | `deploy/snapshot.sh` | DB 快照 save/restore，v10 为最新 |
| Flyway Seeds | `V2/V4/V49/V54/...` | 一次性种子数据（设备/专家/合规条款/工单） |

---

## Architecture Design

### 方案：Backend Module Data Generator

```
┌─────────────────────────────────────────────────────┐
│                  ModuleDataGenerator                 │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ HeatOps  │  │  IAQ     │  │ Parking  │  ...     │
│  │Generator │  │Generator │  │Generator │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │              │              │                │
│       ▼              ▼              ▼                │
│  ┌─────────────────────────────────────────┐        │
│  │         PhysicsModelRegistry            │        │
│  │  (温度/压力/流量/电力/占用率/...)        │        │
│  └────────────────┬────────────────────────┘        │
│                   │                                  │
│                   ▼                                  │
│  ┌─────────────────────────────────────────┐        │
│  │      TimeSeriesWriter                   │        │
│  │  sensors → readings → alerts → WO       │        │
│  └────────────────┬────────────────────────┘        │
│                   │                                  │
│                   ▼                                  │
│            PostgreSQL / Redis                        │
└─────────────────────────────────────────────────────┘
```

### 核心组件

#### 1. `ModuleDataGeneratorService`（调度器）

```java
@Service
@ConditionalOnProperty("simulator.modules.enabled", havingValue = "true")
public class ModuleDataGeneratorService {
    
    private final List<ModuleGenerator> generators;  // 自动注入所有实现
    
    @Scheduled(fixedDelay = 300_000)  // 5 分钟
    public void generate() {
        generators.stream()
            .filter(ModuleGenerator::isEnabled)
            .forEach(ModuleGenerator::tick);
    }
}
```

#### 2. `ModuleGenerator`（接口）

```java
public interface ModuleGenerator {
    String moduleName();
    boolean isEnabled();          // 读 SystemConfig
    void tick();                  // 一个周期的数据生成
    void seedIfEmpty();           // 首次启动种子数据
}
```

#### 3. `PhysicsModel`（物理模型库）

从 `demoDataGenerator.ts` 移植到 Java，提供：
- 温度模型（室内/室外/供水/回水，含日变化曲线）
- 振动模型（ISO 10816 参考值，按设备类型）
- 电力模型（PUE、负荷曲线、峰谷）
- 流量/压力模型（管网水力学简化）
- 占用率模型（车位、空间、访客，含工作日/周末模式）
- 空气质量模型（PM2.5/CO2/VOC，含通风关联）

#### 4. 数据生成链路

```
tick() →
  1. 读当前设备列表（from DB）
  2. 对每个设备生成物理量读数（PhysicsModel）
  3. 写入 sensor_readings 表
  4. 运行异常检测（阈值 or Z-Score）
  5. 异常 → 自动创建 Alert（去重）
  6. Alert 升级 → 自动创建 WorkOrder
  7. 发布 WebSocket 事件
```

这个链路 PdM 模块已经跑通，复制到其他模块即可。

---

## Implementation Plan

### Phase 0: 基础框架（1 天）

**产出**: `ModuleDataGeneratorService` + `ModuleGenerator` 接口 + `PhysicsModel` 工具类

- [x] 抽取 PdM Simulator 的公共逻辑为框架
- [x] `PhysicsModel` 工具类（从 demoDataGenerator.ts 移植核心算法）
- [x] SystemConfig 开关：`simulator.modules.enabled`，每模块独立开关
- [x] Flyway migration: 各模块所需的 sensor 类型 + 设备种子数据

### Phase 1: HeatOps（P0，2 天）— 正东电子

**目标**: 消除 23 个纯 mock 页面

现有基础好（PlcSimulatorService 已有物理模型），已实现：

- [x] `HeatOpsGenerator implements ModuleGenerator`
  - 换热站运行数据（供/回水温度、压差、流量、效率）
  - 管网数据（节点温度、压力、泄漏指标）
  - 建筑热负荷（室温、热需求、阀门开度）
  - 天气关联（室外温度影响热需求计算）
- [ ] 前端：23 个 view 从 `mockData.ts` / inline mock → API 调用
- [ ] 删除 `views/heatops/mockData.ts`
- [ ] 验证：每个页面有数据、图表正常渲染

**物理模型参数**（已有 PLC_INTEGRATION.md 文档）:
- 供水温度: 60-95°C（随室外温度反相关）
- 回水温度: 供水 - ΔT（ΔT = f(流量, 建筑面积)）
- 效率: 85-96%（含日衰减+维护恢复）
- 热负荷: Q = K·A·ΔT（K=0.8, A=建筑面积）

### Phase 2: 设施管理群（P2，3 天）

一次覆盖多个相关模块，共享物理模型：

**Day 1: IAQ + Fire + Water**
- [x] `IaqGenerator` — PM2.5/CO2/VOC/温湿度，含通风联动
- [x] `FireGenerator` — 烟感/温感/喷淋状态，消防水池水位
- [x] `WaterGenerator` — 供水流量/水质（pH/浊度/余氯）
- [ ] 前端：9 个 view 接 API

**Day 2: Parking + Elevator + Space + Lighting**
- [x] `ParkingGenerator` — 车位占用率（工作日曲线），EV 充电状态
- [x] `ElevatorGenerator` — 运行次数/等待时间/能耗/故障率
- [x] `SpaceGenerator` — 工位/会议室占用率（日/周模式）
- [x] `LightingGenerator` — 照度/能耗/日光联动
- [ ] 前端：13 个 view 接 API

**Day 3: UPS + Chiller + VisionOps**
- [x] `UpsGenerator` — 电池电压/温度/负载率/放电曲线
- [x] `ChillerGenerator` — COP/冷冻水温/冷却水温/功率
- [x] `VisionOpsGenerator` — 人流计数/热力图数据点
- [ ] 前端：8 个 view 接 API

### Phase 3: 运营管理群（P2-P3，2 天）

**Day 1: PM + Inventory + Contractor + ESG**
- [x] `PmGenerator` — 预防性维护计划执行率/逾期率
- [x] `InventoryGenerator` — 库存水位/消耗速率/采购建议
- [x] `ContractorGenerator` — 合同到期/评分/工单完成率
- [x] `EsgGenerator` — 碳排放/能耗/废物量（月度聚合）
- [ ] 前端：14 个 view 接 API

**Day 2: Feedback + Visitor + Cleaning + SSO**
- [x] `FeedbackGenerator` — 工单评价/满意度/响应时间
- [x] `VisitorGenerator` — 访客预约/签到/统计
- [x] `CleaningGenerator` — 清洁计划/执行/检查评分
- [ ] 前端：11 个 view 接 API
- [ ] SSO 1 个 mock 页面修复

### Phase 4: Manager 移动端（P1，1 天）

Manager 的 45 个纯 mock 页面 **大部分是其他模块数据的移动端视图**。
Phase 1-3 完成后，manager 页面只需要：

- [ ] 把 `import { ... } from '@/mock/factory'` 替换为对应模块的 API 调用
- [ ] 移动端特有的聚合 API（如果需要）
- [ ] 逐页验证

### Phase 5: 清理（0.5 天）

- [ ] 删除 `frontend/src/mock/factory.ts`
- [ ] 删除 `frontend/src/views/heatops/mockData.ts`
- [ ] 删除 `frontend/src/utils/demoDataGenerator.ts`（如果完全被后端替代）
- [ ] grep 确认零 inline mock 残留
- [ ] 更新 Golden Snapshot（v11）
- [ ] 更新 SSOT.md / TODO.md

---

## 数据模型设计

### 通用 Sensor 类型扩展

现有 `sensors` 表已支持多设备类型。需要为新模块注册 sensor types：

```sql
-- Phase 1: HeatOps
INSERT INTO sensor_types (code, name, unit, module) VALUES
('SUPPLY_TEMP', 'Supply Temperature', '°C', 'heatops'),
('RETURN_TEMP', 'Return Temperature', '°C', 'heatops'),
('FLOW_RATE', 'Flow Rate', 'm³/h', 'heatops'),
('HEAT_LOAD', 'Heat Load', 'kW', 'heatops'),
('PIPE_PRESSURE', 'Pipe Pressure', 'MPa', 'heatops');

-- Phase 2: Facility modules
INSERT INTO sensor_types (code, name, unit, module) VALUES
('PM25', 'PM2.5', 'μg/m³', 'iaq'),
('CO2', 'CO2 Level', 'ppm', 'iaq'),
('VOC', 'VOC', 'ppb', 'iaq'),
('SMOKE_DENSITY', 'Smoke Density', '%', 'fire'),
('WATER_PH', 'Water pH', 'pH', 'water'),
('PARKING_OCCUPANCY', 'Parking Occupancy', '%', 'parking'),
('ELEVATOR_TRIPS', 'Elevator Trips', 'count', 'elevator'),
('ILLUMINANCE', 'Illuminance', 'lux', 'lighting'),
('BATTERY_VOLTAGE', 'Battery Voltage', 'V', 'ups'),
('CHILLER_COP', 'Chiller COP', 'ratio', 'chiller'),
('PERSON_COUNT', 'Person Count', 'count', 'visionops');
```

### 物理模型参考值

| 模块 | 关键指标 | 正常范围 | 告警阈值 | 数据频率 |
|------|----------|----------|----------|----------|
| HeatOps | 供水温度 | 60-95°C | >98°C / <55°C | 5min |
| IAQ | PM2.5 | 10-35 μg/m³ | >75 μg/m³ | 5min |
| IAQ | CO2 | 400-800 ppm | >1000 ppm | 5min |
| Fire | 烟感 | 0-2% | >5% | 1min |
| Water | pH | 6.5-8.5 | <6.0 / >9.0 | 15min |
| Parking | 占用率 | 20-85% | >95% | 5min |
| Elevator | 等待时间 | 15-60s | >120s | per-trip |
| Lighting | 照度 | 300-500 lux | <200 lux | 5min |
| UPS | 电池电压 | 216-240V | <210V | 1min |
| Chiller | COP | 4.5-6.5 | <3.5 | 5min |
| Space | 占用率 | 30-70% | >90% | 15min |

---

## 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| DB 数据膨胀 | 磁盘占用 | 数据保留策略（已有 cron: sensor 30d, alerts 90d） |
| 生成器 CPU 开销 | 服务器负载 | 5min 间隔 + batch insert，实测 PdM simulator <1% CPU |
| 前端改动引入白屏 | 用户体验 | API 调用失败时 fallback 到空状态（不是 mock） |
| 物理模型不真实 | Demo 可信度 | 参考工业标准（ISO 10816、ASHRAE、GB50736） |
| 模块间数据不一致 | Demo 逻辑矛盾 | 共享时间线 + 天气数据源 → 全模块联动 |

---

## Success Criteria

1. **零 inline mock**: `grep -r "const mock\|const MOCK\|from.*mock/" frontend/src/views/` 返回 0
2. **全页面有数据**: 每个 view 加载后显示非空内容
3. **Demo 连贯性**: Dashboard → 任意模块 → 详情页，数据逻辑一致
4. **Golden Snapshot v11**: 包含所有模块的生成数据
5. **性能无退化**: 页面加载 <2s，API 响应 <200ms

---

## Timeline

| Phase | 内容 | 工期 | 累计 |
|-------|------|------|------|
| 0 | 基础框架 | 1d | 1d |
| 1 | HeatOps（P0） | 2d | 3d |
| 2 | 设施管理群（IAQ/Fire/Water/Parking/Elevator/Space/Lighting/UPS/Chiller/VisionOps） | 3d | 6d |
| 3 | 运营管理群（PM/Inventory/Contractor/ESG/Feedback/Visitor/Cleaning） | 2d | 8d |
| 4 | Manager 移动端 | 1d | 9d |
| 5 | 清理 + Snapshot | 0.5d | 9.5d |

**总计: ~10 天**，消灭 114 个纯 mock 页面，新增 ~15 个 ModuleGenerator。

---

## Appendix: Data Volume Estimation

### 假设

- **数据保留**: 90 天（与 alerts retention 一致，需更新 sensor cron 从 30d → 90d）
- **生成频率**: 5 分钟/周期（288 次/天）
- **TimescaleDB**: 已启用（hypertable 压缩可省 90%+，下面按原始大小算上限）

### 每模块设备/传感器数量

| 模块 | 实体数 | 传感器/实体 | 总传感器 | 表类型 |
|------|--------|------------|----------|--------|
| **HeatOps** | 5 站 + 8 管 + 5 楼 | 15/10/12 | 171 | 宽表(heat_station/pipeline/building_reading) |
| **IAQ** | 10 区域 | 5 (PM2.5/CO2/VOC/温/湿) | 50 | sensor_readings |
| **Fire** | 15 设备 | 3 (烟/温/喷淋) | 45 | sensor_readings |
| **Water** | 5 节点 | 4 (流量/pH/浊度/余氯) | 20 | sensor_readings |
| **Parking** | 3 区域 | 3 (占用/周转/EV) | 9 | sensor_readings |
| **Elevator** | 4 台 | 4 (行程/等待/能耗/负荷) | 16 | sensor_readings |
| **Space** | 8 区域 | 2 (工位占用/会议室占用) | 16 | sensor_readings |
| **Lighting** | 6 区域 | 3 (照度/功耗/日光) | 18 | sensor_readings |
| **UPS** | 3 台 | 5 (电压/电流/温度/负载/电池) | 15 | sensor_readings |
| **Chiller** | 3 台 | 6 (COP/冷冻水/冷却水/功率/负荷/振动) | 18 | sensor_readings |
| **VisionOps** | 6 摄像头 | 2 (人流/密度) | 12 | sensor_readings |
| **ESG** | 1 租户 | 4 (碳排/能耗/水耗/废物) | 4 | sensor_readings (15min) |
| **PM** | — | 聚合指标 | 5 | sensor_readings (1h) |
| **Inventory** | 20 SKU | 2 (库存/消耗) | 40 | sensor_readings (15min) |
| **Contractor** | 5 承包商 | 2 (评分/工单率) | 10 | sensor_readings (1h) |
| **Feedback** | 1 租户 | 3 (满意度/响应时间/解决率) | 3 | sensor_readings (1h) |
| **Visitor** | 2 大堂 | 2 (预约/签到) | 4 | sensor_readings (15min) |
| **Cleaning** | 10 区域 | 2 (执行/评分) | 20 | sensor_readings (1h) |
| **合计** | — | — | **~476** | |

### 每日数据量

#### 高频表（5 分钟间隔，288 行/天/传感器）

**sensor_readings（窄表, ~95 bytes/row with index）**

| 类别 | 传感器数 | 行数/天 | 大小/天 |
|------|---------|---------|--------|
| IAQ | 50 | 14,400 | 1.3 MB |
| Fire | 45 | 12,960 | 1.2 MB |
| Water | 20 | 5,760 | 0.5 MB |
| Parking | 9 | 2,592 | 0.2 MB |
| Elevator | 16 | 4,608 | 0.4 MB |
| Space | 16 | 4,608 | 0.4 MB |
| Lighting | 18 | 5,184 | 0.5 MB |
| UPS | 15 | 4,320 | 0.4 MB |
| Chiller | 18 | 5,184 | 0.5 MB |
| VisionOps | 12 | 3,456 | 0.3 MB |
| **小计** | **219** | **63,072** | **5.7 MB** |

**低频 sensor_readings（15min/1h 间隔）**

| 类别 | 传感器数 | 频率 | 行数/天 | 大小/天 |
|------|---------|------|---------|--------|
| ESG | 4 | 15min | 384 | 36 KB |
| Inventory | 40 | 15min | 3,840 | 356 KB |
| Visitor | 4 | 15min | 384 | 36 KB |
| PM | 5 | 1h | 120 | 11 KB |
| Contractor | 10 | 1h | 240 | 22 KB |
| Feedback | 3 | 1h | 72 | 7 KB |
| Cleaning | 20 | 1h | 480 | 45 KB |
| **小计** | **86** | — | **5,520** | **0.5 MB** |

**HeatOps 宽表（5 分钟间隔）**

| 表 | 实体数 | bytes/row | 行数/天 | 大小/天 |
|---|--------|-----------|---------|--------|
| heat_station_reading | 5 | ~210 | 1,440 | 0.3 MB |
| heat_pipeline_readings | 8 | ~230 | 2,304 | 0.5 MB |
| heat_building_readings | 5 | ~210 | 1,440 | 0.3 MB |
| **小计** | **18** | — | **5,184** | **1.1 MB** |

### 汇总

| 周期 | 行数 | 原始大小 | 含索引 |
|------|------|---------|--------|
| **每天** | ~73,776 | ~5.5 MB | **~7.3 MB** |
| **每周** | ~516,432 | ~38 MB | **~51 MB** |
| **30 天** | ~2,213,280 | ~165 MB | **~219 MB** |
| **90 天（保留期）** | ~6,639,840 | ~495 MB | **~657 MB** |

### 附加数据（事件型，非时序）

| 数据类型 | 估计量/天 | 大小/天 | 30天 |
|----------|----------|---------|------|
| 数据类型 | 估计量/天 | 大小/天 | 90天 |
|----------|----------|---------|------|
| Alerts（自动生成） | ~50-100 条 | ~50 KB | 4.5 MB |
| WorkOrders（自动关联） | ~10-20 条 | ~30 KB | 2.7 MB |
| WebSocket Events | 不持久化 | 0 | 0 |
| **小计** | — | ~80 KB | **~7.2 MB** |

### 总结

```
┌─────────────────────────────────────────────────┐
│          90 天数据保留期 总量估算               │
│                                                  │
│  时序数据:    ~657 MB  (6.6M 行)                │
│  事件数据:    ~7.2 MB  (10.8K 行)               │
│  ──────────────────────────────────────          │
│  原始合计:    ~664 MB                           │
│                                                  │
│  TimescaleDB 压缩后: ~66-100 MB (90% 压缩率)    │
│  无 TimescaleDB:     ~664 MB (纯 PostgreSQL)    │
│                                                  │
│  对比现有 PdM simulator:                        │
│  270K readings ≈ 25 MB → 新增约 26x             │
│                                                  │
│  Demo 服务器 /data 磁盘:                        │
│  当前使用 17% → 加 664 MB 约 +1% → 无压力       │
└─────────────────────────────────────────────────┘
```

### 性能影响

| 指标 | 影响 |
|------|------|
| 写入 QPS | ~0.25/s（73K 行/天 ÷ 86400s），可忽略 |
| 每次 tick 写入 | ~256 行/次（5min 批量 INSERT），<50ms |
| 查询性能 | sensor_readings 已有 (sensor_id, timestamp) 索引，无退化 |
| 内存 | 生成器 stateless，每次 tick 分配 ~100KB 临时对象 |
| CPU | <1%（参考 PdM simulator 实测） |

### 优化手段（按需启用）

1. **TimescaleDB 压缩**: `compress_after => INTERVAL '7 days'`，90%+ 压缩
2. **Batch INSERT**: 每模块一次 `INSERT INTO ... VALUES (...), (...), ...`
3. **降频模块**: ESG/PM/Contractor 等低变化模块用 15min-1h 间隔
4. **冷热分层**: >7 天数据可降采样（1h 聚合）保留趋势
5. **数据保留 cron**: 需更新 sensor retention 从 30d → 90d（与 alerts 对齐）

---

*Created: 2026-04-04 | Author: Goku (DE #1)*
