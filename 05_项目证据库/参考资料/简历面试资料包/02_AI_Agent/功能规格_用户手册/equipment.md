# 设备管理用户指南

> 面向设备管理员和维护工程师的全生命周期设备管理模块使用手册。

---

## 1. Overview — 概述

设备管理是 FactVerse 平台的核心基盘模块，提供：

- **设备台账** — 全量设备信息集中管理
- **传感器绑定** — 设备关联传感器与时序数据
- **状态监控** — 6 种运行状态实时追踪
- **时序查询** — 设备关联传感器的历史数据趋势

**导航路径：** `/equipment`

---

## 2. Equipment List — 设备列表

**导航路径：** `/equipment`

**API：** `GET /api/v1/equipment`（分页，返回 Spring Page）

### 列表功能

- **搜索过滤**：按名称、类型、状态搜索
- **状态统计**：各状态设备数量
- **设备代码查询**：`GET /api/v1/equipment/code/{equipmentId}`

### 设备字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `equipmentId` | String (unique) | 设备编号（如 HT-HX-001） |
| `name` | String | 设备名称 |
| `type` | String | 设备类型（AHU / Chiller / Pump 等） |
| `location` | String | 位置 |
| `status` | Enum | 运行状态（见下方枚举） |
| `equipmentModel` | String | 设备型号 |
| `vendor` | String | 供应商 |
| `supplier` | String | 供货商 |
| `installDate` | LocalDate | 安装日期 |
| `lastMaintenanceAt` | Instant | 上次维护时间 |
| `warrantyExpiry` | LocalDate | 保修到期日 |
| `technicalLifeYears` | Integer | 技术寿命（年） |
| `economicLifeYears` | Integer | 经济寿命（年） |
| `maintenanceTeam` | String | 维护团队 |
| `criticality` | String | 关键性等级 |
| `roomId` | String | 房间 ID |
| `siteId` | String | 站点 ID |
| `imageUrl` | String | 设备图片 URL |

### EquipmentStatus 枚举（6 种）

| 值 | 说明 |
|----|------|
| `NORMAL` | 正常运行 |
| `WARNING` | 警告状态 |
| `CRITICAL` | 危险状态 |
| `OFFLINE` | 离线 |
| `MAINTENANCE` | 维护中 |
| `ACTIVE` | 活跃 |

---

## 3. Equipment Detail — 设备详情

**导航路径：** `/equipment/{id}`

**API：** `GET /api/v1/equipment/{id}`

### 详情内容

- **基本信息**：型号、供应商、安装位置、安装日期
- **运行状态**：当前状态
- **传感器数据**：关联传感器的实时读数（`GET /api/v1/equipment/{id}/sensors`）
- **时序数据**：传感器历史趋势图（`GET /api/v1/equipment/{id}/timeseries`）
- **维护历史**：关联的历史维修工单

---

## 4. Equipment Operations — 设备操作

**API：**

| 操作 | 方法与路径 |
|------|-----------|
| 设备列表 | `GET /api/v1/equipment` |
| 设备详情 | `GET /api/v1/equipment/{id}` |
| 按编号查询 | `GET /api/v1/equipment/code/{equipmentId}` |
| 创建设备 | `POST /api/v1/equipment` |
| 更新设备 | `PUT /api/v1/equipment/{id}` |
| 查看传感器 | `GET /api/v1/equipment/{id}/sensors` |
| 时序数据 | `GET /api/v1/equipment/{id}/timeseries` |
