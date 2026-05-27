# MANN+HUMMEL PoC 上线计划

> 目标：2026-04-05（明天）部署到 factverse.ai
> 提案截止：2026-04-17 16:00 SGT
> 策略：**零新功能开发**，基于现有 PDM 模块 + demo 数据覆盖矿山车队场景

---

## 核心策略

PDM 模块已有：振动分析、温度监控、异常检测、RUL、告警→工单闭环、AI Advisor。
只需要：
1. **新增矿山设备类型**（映射到现有算法）
2. **新增滤芯压差传感器**（现有 sensor_type 机制支持）
3. **注入 MANN+HUMMEL 矿山场景 demo 数据**
4. **部署到 factverse.ai**

不开发任何新功能页面。

---

## 演示场景

| 场景 # | 标题 | 使用页面 | 核心价值点 |
|--------|------|---------|-----------|
| 1 | 矿山车队健康总览 | `/pdm` Dashboard | 15 台设备实时健康状态，3 台告警 |
| 2 | 液压滤芯压差超标 | `/pdm/equipment/{id}` | 传感器趋势 + AI 自动识别 + 工单生成 |
| 3 | 压缩机轴承 RUL 预测 | `/pdm/vibration` | 预测 14 天后达警戒 → 预防性维护 |
| 4 | 维护历史证据链 | `/pdm/maintenance` | 上月 3 次维护记录 + 结果验证 |
| 5 | AI 对话（矿山上下文）| Advisor 侧边栏 | "MH-EX-003 的液压滤芯还能用多久？" |

---

## 设备清单设计（15 台）

| 设备ID | 类型 | 映射到 | 状态 | 演示重点 |
|--------|------|--------|------|---------|
| MH-EX-001 | 挖掘机 | COMPRESSOR | 🟢 Normal | 基线对照 |
| MH-EX-002 | 挖掘机 | COMPRESSOR | 🟡 Warning | 振动略高 |
| MH-EX-003 | 挖掘机 | COMPRESSOR | 🔴 Critical | **滤芯压差超标**（核心场景） |
| MH-BL-001 | 推土机 | PUMP | 🟢 Normal | — |
| MH-BL-002 | 推土机 | PUMP | 🟡 Warning | 油温上升趋势 |
| MH-DR-001 | 钻机 | MOTOR | 🔴 Critical | **轴承振动超标**（RUL场景） |
| MH-DR-002 | 钻机 | MOTOR | 🟢 Normal | — |
| MH-DR-003 | 钻机 | MOTOR | 🟡 Warning | 电流异常 |
| MH-GN-001 | 发电机 | FAN | 🟢 Normal | — |
| MH-GN-002 | 发电机 | FAN | 🟡 Warning | 空滤差压 |
| MH-LR-001 | 装载机 | PUMP | 🟢 Normal | — |
| MH-LR-002 | 装载机 | PUMP | 🟢 Normal | — |
| MH-CR-001 | 起重机 | COMPRESSOR | 🟢 Normal | — |
| MH-HK-001 | 液压破碎锤 | COMPRESSOR | 🟡 Warning | 液压压差 |
| MH-MP-001 | 泥浆泵 | PUMP | 🔴 Critical | **连续泄漏告警** |

健康分布：5 × Normal / 5 × Warning / 3 × Critical（演示价值最大）

---

## 传感器类型映射

现有 sensor_type 字段完全支持自定义，新增以下矿山专用类型：

| sensor_type | 单位 | 含义 | 告警阈值 |
|-------------|------|------|---------|
| `hydraulic_filter_dp` | kPa | 液压滤芯差压 | warn:350 / crit:500 |
| `engine_oil_filter_dp` | kPa | 机油滤芯差压 | warn:150 / crit:250 |
| `air_filter_dp` | kPa | 空气滤芯差压 | warn:3.5 / crit:6.0 |
| `fuel_filter_dp` | kPa | 燃油滤芯差压 | warn:200 / crit:350 |
| `engine_hours` | h | 发动机累计工时 | 告警：超过保养间隔 |
| `oil_contamination` | NAS级 | 油液污染度 | warn:9 / crit:11 |

---

## 实现任务列表（今天完成）

### Task 1 — 矿山设备类型注册（30 min）

**文件**：`frontend/src/views/pdm/PdmOnboardingWizard.vue`

```typescript
// 在 EQUIPMENT_TYPES 数组中追加
{ value: 'EXCAVATOR',   label: 'EXCAVATOR',   prefix: 'EXC', description: 'ISO 20816-1 Class II, thresholds A=1.12/B=2.8/C=7.1 mm/s | Mining hydraulic system monitoring' },
{ value: 'BULLDOZER',   label: 'BULLDOZER',   prefix: 'BLD', description: 'ISO 20816-1 Class II, thresholds A=1.12/B=2.8/C=7.1 mm/s | Drivetrain & track system' },
{ value: 'DRILL_RIG',   label: 'DRILL_RIG',   prefix: 'DRL', description: 'ISO 20816-1 Class III, thresholds A=1.8/B=4.5/C=11.2 mm/s | High vibration equipment' },
{ value: 'GENERATOR',   label: 'GENERATOR',   prefix: 'GEN', description: 'ISO 20816-1 Class I, thresholds A=0.71/B=1.8/C=4.5 mm/s | Stationary power unit' },
{ value: 'LOADER',      label: 'LOADER',      prefix: 'LDR', description: 'ISO 20816-1 Class II, thresholds A=1.12/B=2.8/C=7.1 mm/s | Wheel loader' },
{ value: 'MUD_PUMP',    label: 'MUD_PUMP',    prefix: 'MDP', description: 'ISO 20816-1 Class II, thresholds A=1.12/B=2.8/C=7.1 mm/s | High-pressure slurry pump' },
```

**文件**：`backend/.../EquipmentOnboardingController.java`

在 `getDefaultTemplate()` 方法中为新类型映射到现有模板：
```java
case "EXCAVATOR":
case "BULLDOZER":
case "LOADER":
    return "compressor";  // 复用压缩机模板（振动+液压系统类似）
case "DRILL_RIG":
    return "motor";       // 高振动设备
case "GENERATOR":
    return "fan";         // 旋转机械
case "MUD_PUMP":
    return "pump";
```

---

### Task 2 — MANN+HUMMEL Demo Seed SQL（2 hours）

**文件**：`deploy/seeds/mann-hummel-mining-demo.sql`

包含：
- 1 个新 tenant（`mann-hummel-demo`）
- 15 台矿山设备（Equipment 记录）
- 每台设备 4-6 个传感器（包含滤芯差压传感器）
- 72 小时时序数据（sensor_readings）
  - MH-EX-003：hydraulic_filter_dp 持续上升，最新值 480kPa（接近 critical）
  - MH-DR-001：vibration_velocity 3 周趋势上升，当前 5.8 mm/s（Zone B-C 间）
  - MH-MP-001：vibration + pressure_diff 双超标
- 8 条告警（3 CRITICAL + 3 WARNING + 2 RESOLVED）
- 3 条已完成工单（维护历史证据链）
- 2 条进行中工单

**关键 SQL 结构**（示意）：
```sql
-- Tenant
INSERT INTO tenants (id, name, code, contact_email) VALUES
  ('11111111-1111-1111-1111-000000000001', 'MANN+HUMMEL Mining Demo', 'mh-mining', 'demo@mann-hummel.com');

-- Equipment: MH-EX-003 (Critical - hydraulic filter)
INSERT INTO equipment (equipment_id, name, type, location, status, tenant_id, site_id) VALUES
  ('MH-EX-003', 'Excavator #3 - Pit B', 'EXCAVATOR', 'Mining Site Alpha / Pit B', 'ACTIVE',
   '11111111-1111-1111-1111-000000000001', 'SITE-ALPHA');

-- Sensors for MH-EX-003
INSERT INTO sensors (equipment_id, sensor_type, unit, warn_threshold, critical_threshold, tenant_id) VALUES
  ('MH-EX-003', 'hydraulic_filter_dp', 'kPa', 350, 500, '...'),  -- 滤芯差压
  ('MH-EX-003', 'vibration_velocity', 'mm/s', 2.8, 7.1, '...'),
  ('MH-EX-003', 'hydraulic_pressure', 'MPa', null, 28.0, '...'),
  ('MH-EX-003', 'oil_temp', '°C', 85, 100, '...'),
  ('MH-EX-003', 'engine_hours', 'h', null, null, '...');

-- Time series: hydraulic_filter_dp 逐步上升到 480
-- [72h 前: 220 kPa → 告警边界: 350 → 当前: 480 kPa CRITICAL]
```

---

### Task 3 — AI Advisor 矿山上下文补丁（30 min）

**文件**：`ai-engine/rag/chat_engine.py`

在 `_build_context()` 的 page_context 处理里，补充矿山设备识别：
```python
# 已有 module 识别，补充 mining equipment types
mining_types = {'EXCAVATOR', 'BULLDOZER', 'DRILL_RIG', 'GENERATOR', 'LOADER', 'MUD_PUMP'}
if asset_type and asset_type.upper() in mining_types:
    ctx_parts.append(
        f"Equipment type: {asset_type} (mining/off-highway equipment). "
        f"Key concerns: hydraulic filter differential pressure, oil contamination, "
        f"structural vibration (ISO 20816 Class II/III), cumulative operating hours. "
        f"Maintenance is critical — downtime costs are high in mining operations."
    )
```

---

### Task 4 — i18n 补充（15 min）

在 `en.json` 追加：
```json
"pdm.equipment.type.excavator": "Excavator",
"pdm.equipment.type.bulldozer": "Bulldozer",
"pdm.equipment.type.drillRig": "Drill Rig",
"pdm.equipment.type.generator": "Generator",
"pdm.equipment.type.loader": "Loader",
"pdm.equipment.type.mudPump": "Mud Pump",
"pdm.sensor.hydraulicFilterDp": "Hydraulic Filter ΔP",
"pdm.sensor.engineOilFilterDp": "Engine Oil Filter ΔP",
"pdm.sensor.airFilterDp": "Air Filter ΔP",
"pdm.sensor.fuelFilterDp": "Fuel Filter ΔP",
"pdm.sensor.engineHours": "Engine Hours",
"pdm.sensor.oilContamination": "Oil Contamination"
```

---

### Task 5 — 部署到 factverse.ai（30 min）

```bash
# 1. Build & push
cd ~/clawd/factverse-ai-agent
git add -A && git commit -m "feat(poc): MANN+HUMMEL mining fleet demo data and equipment types"
git push

# 2. Demo server deploy（SSH: opal@20.6.130.59）
ssh opal@20.6.130.59 '
  cd /opt/factverse &&
  git pull &&
  docker-compose build backend frontend &&
  docker-compose up -d &&
  sleep 10 &&
  psql $DATABASE_URL < deploy/seeds/mann-hummel-mining-demo.sql
'

# 3. 验证
curl https://factverse.ai/api/v1/health
```

---

## 今日执行时间表

| 时间 | 任务 | 工具 |
|------|------|------|
| 现在 | Task 1: 矿山设备类型注册（frontend + backend） | Claude Code |
| +1h | Task 2: Demo seed SQL 生成 | Claude Code |
| +2h | Task 3+4: AI context + i18n | Claude Code |
| +3h | Task 5: 部署 + 验证 | exec + ssh |
| +4h | 端到端走一遍 5 个演示场景 | browser |
| 完成 | ✅ factverse.ai/pdm 矿山车队场景上线 | — |

---

## 验收标准（明天可以演示的条件）

- [ ] `/pdm` Dashboard 显示 15 台矿山设备，健康状态分布 5/5/3
- [ ] MH-EX-003 设备详情页显示液压滤芯差压告警（480 kPa，CRITICAL）
- [ ] MH-DR-001 振动趋势图显示 3 周上升趋势，有 RUL 预测
- [ ] 告警列表有 3 条 CRITICAL + 3 条 WARNING
- [ ] 工单列表有 3 条已完成维护记录
- [ ] AI Advisor 能回答"MH-EX-003 液压滤芯状态如何？"
- [ ] 演示账号：`demo@mann-hummel.com` / `Demo2026!` 可登录

---

## 演示账号设计

| 角色 | 用户名 | 密码 | 权限范围 |
|------|--------|------|---------|
| 矿山运营经理 | `manager@mh-demo.com` | `Demo2026!` | 全模块只读 + 告警确认 |
| 维护工程师 | `engineer@mh-demo.com` | `Demo2026!` | PDM 全权 + 工单管理 |
| MANN+HUMMEL 客户经理 | `account@mh-demo.com` | `Demo2026!` | Dashboard + 报告只读 |

---

*关联文档：*
- `docs/prd/MANN-HUMMEL-PRODUCT-ROADMAP.md` — 完整产品改进规划
