# 规划：TrafficOps PdM 基盘对接重构

**状态**: 草案  
**日期**: 2026-03-09  
**优先级**: P2（非阻塞，不影响当前 Demo，但影响数据真实性）

---

## 问题背景

### 现象
ICA 租户侧边栏出现"预测性维护"菜单，排查后发现它不是 PdM 模块菜单，而是 `trafficops` 内置的 `Operations → PredictiveMaintenance` 导航项。

### 根因
`trafficops` 自建了一套设备健康监控体系，完全绕开了基盘能力：

| 对比项 | trafficops 现状 | 基盘能力（正确做法）|
|--------|----------------|-------------------|
| 数据来源 | `EquipmentHealthService` 硬编码 15 条假数据 | `equipment` 表（真实 DB） |
| 健康评分 | 写死 int，随 DemoState 切换 | `pdm_health_snapshot`（时序快照）|
| 维护记录 | 硬编码 mock task 列表 | `maintenance_records` 表 |
| 工单联动 | 无 | `work_orders` 表 |
| 枚举不一致 | `HEALTHY/DEGRADED/CRITICAL/MAINTENANCE` | `NORMAL/WARNING/CRITICAL/OFFLINE/MAINTENANCE` |
| 租户隔离 | 无（所有租户看同一份假数据）| `TenantContext` 自动过滤 |

### 违反原则
> "基盘复用：Equipment/Alert/WorkOrder/Sensor reused，modules add only new capabilities"

---

## 目标架构

```
trafficops PredictiveMaintenance 页面
         │
         ▼
/api/v1/trafficops/equipment-health  (重构后)
         │
         ├─ 基础数据层 ──────────────────────────────────────────────────
         │   EquipmentRepository        (equipment 表，按 tenant 过滤)
         │   MaintenanceRecordRepository (maintenance_records)
         │   WorkOrderRepository         (work_orders)
         │
         └─ 增强数据层（仅当 module.pdm.enabled = true 时）────────────
             PdmHealthSnapshotRepository (pdm_health_snapshot)
             PdmEquipmentProfileRepository (pdm_equipment_profile)
             PdmAnomalyEventRepository   (pdm_anomaly_event)
```

前端也同步调整：有 PdM 模块权限时，跳转到 PdM 模块页面而非 trafficops 内置页面。

---

## 分阶段实施

---

### Phase 0：应急隐藏（2026-03-09，✅ 已完成）

**改动**：`frontend/src/modules/trafficops/index.ts`  
`PredictiveMaintenance` navItem 加 `hidden: true`，从 ICA 侧边栏移除入口。路由保留，等 Phase 1 完成后再决定是否彻底移除。

---

### Phase 1：后端对接基盘数据层（约 3 人天）

**目标**：`/api/v1/trafficops/equipment-health` 读取真实数据库，不再返回假数据。

#### 1.1 重构 `EquipmentHealthService`

```java
@Service
@RequiredArgsConstructor
public class EquipmentHealthService {
    private final EquipmentRepository equipmentRepo;
    private final MaintenanceRecordRepository maintenanceRepo;
    private final WorkOrderRepository workOrderRepo;

    public List<EquipmentHealthDTO> getEquipmentHealth() {
        String tenantId = TenantContext.getCurrentTenant().toString();
        List<Equipment> equipment = equipmentRepo.findByTenantId(tenantId);
        // 从 equipment.status 映射健康状态
        // 从 maintenance_records 取上次/下次维护时间
        // 从 work_orders 取 URGENT/CRITICAL 工单数
    }
}
```

#### 1.2 统一枚举映射

| trafficops 旧枚举 | 基盘 Equipment.EquipmentStatus | 映射逻辑 |
|-----------------|-------------------------------|---------|
| `HEALTHY` | `NORMAL` | healthScore ≥ 80 |
| `DEGRADED` | `WARNING` | 60 ≤ healthScore < 80 |
| `CRITICAL` | `CRITICAL` | healthScore < 60 |
| `MAINTENANCE` | `MAINTENANCE` | status = MAINTENANCE |

#### 1.3 补充 ICA 设备数据

ICA 租户（`a1b2c3d4-e5f6-7890-abcd-ef1234567890`）需在 `equipment` 表中有真实设备记录。  
→ Flyway migration `V177__ica_equipment_seed.sql`，参考现有 hardcoded 的 15 条设备（Autolane Scanner × 5、Biometric Reader × 3、X-Ray × 3、eGate × 2、Network Switch × 2）。

#### 1.4 接口响应格式保持兼容

前端期望 `healthScore: int`、`status: string`、`category: string`，字段不变，数据来源换成 DB。

**交付物**：
- [ ] `EquipmentHealthService.java` 重构
- [ ] `EquipmentHealthDTO.java`（统一 DTO）
- [ ] `V177__ica_equipment_seed.sql`
- [ ] 单元测试覆盖枚举映射

---

### Phase 2：对接 PdM 模块增强层（约 2 人天）

**前提**：Phase 1 完成，且目标租户已开启 `module.pdm.enabled = true`。

#### 2.1 后端：条件注入 PdM 服务

```java
@GetMapping
public ApiResponse<List<EquipmentHealthDTO>> getEquipmentHealth() {
    boolean pdmEnabled = configService.isEnabled("module.pdm.enabled");
    if (pdmEnabled) {
        return ApiResponse.ok(service.getHealthWithPdmEnhancement());
        // 从 pdm_health_snapshot 取最新快照，覆盖 healthScore
        // 补充 failureProbability（anomalyScore）、recommendation
    }
    return ApiResponse.ok(service.getHealthBaseline());
}
```

#### 2.2 前端：PdM 已启用时自动跳转

在 `PredictiveMaintenanceView.vue` 顶部加重定向：

```ts
const moduleStore = useModuleStore()
onMounted(() => {
  if (moduleStore.isEnabled('pdm')) {
    router.replace({ name: 'pdm-dashboard' })
  }
})
```

**交付物**：
- [ ] `EquipmentHealthService.getHealthWithPdmEnhancement()` 实现
- [ ] 前端 PdM 跳转逻辑
- [ ] Yokogawa 租户验证（pdm=true，数据完整）

---

### Phase 3：清理（约 1 人天）

Phase 1 + Phase 2 稳定后：

- [ ] 删除 `EquipmentHealthService` hardcoded mock 代码
- [ ] 评估是否彻底用 PdM 模块页面替换 `PredictiveMaintenanceView.vue`
- [ ] 更新基盘复用规则：trafficops 设备数据 = base `equipment` 表

---

## 风险与约束

| 风险 | 处置 |
|------|------|
| ICA `equipment` 表可能现有数据量为 0 | Phase 1 前先查，再决定 seed 策略 |
| `maintenance_records` 无 ICA 数据 | 先返回空列表（前端已处理空状态），再补 seed |
| Phase 2 `isEnabled` 需要 request scope | 使用 `TenantContext` + `SystemConfigService`，已有实现 |
| trafficops PdM 与 PdM 模块数据模型差异 | Phase 2 需要 DTO 适配层 |

---

## 工作量估算

| Phase | 工作量 | 状态 |
|-------|--------|------|
| Phase 0（隐藏）| 0.5h | ✅ 完成 |
| Phase 1（基盘对接）| 3 人天 | 待排期 |
| Phase 2（PdM 增强）| 2 人天 | 待排期 |
| Phase 3（清理）| 1 人天 | 待排期 |

**建议**：Phase 1 + Phase 2 合并到下个 sprint。
