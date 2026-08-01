# 设施管理子模块用户指南

> Smart FM (FMS) 模块下的各子功能使用手册。

---

## 概述

Smart FM 是 FactVerse 的智慧设施管理模块，包含 16 个子模块。启用 `fms` 行业模块后即可使用。

> **注意：** Energy 和 ESG 是独立的行业模块，不属于 FMS。它们需要单独启用。

---

## 1. Energy Management — 能源管理

> **独立行业模块**，模块 key: `energy`。跨行业通用，非 FMS 专属。

**导航路径：** `/modules/energy`

**API 基础路径：** `/api/v1/energy`

| API | 说明 |
|-----|------|
| `GET /api/v1/energy/dashboard` | 能源总览仪表盘 |
| `GET /api/v1/energy/breakdown` | 分项能耗 |
| `GET /api/v1/energy/trend?period=daily` | 能耗趋势 |
| `GET /api/v1/energy/baseline` | 能耗基线 |

---

## 2. Chiller — 冷机管理

**导航路径：** `/modules/chiller`

**API 基础路径：** `/api/v1/chiller`

| API | 说明 |
|-----|------|
| `GET /api/v1/chiller/dashboard` | 冷机系统总览 |
| `GET /api/v1/chiller/units` | 冷机列表 |
| `GET /api/v1/chiller/cop` | COP 能效分析 |
| `GET /api/v1/chiller/predictive` | 预测性维护 |

---

## 3. IAQ — 室内空气质量

**导航路径：** `/modules/iaq`

**API 基础路径：** `/api/v1/iaq`

| API | 说明 |
|-----|------|
| `GET /api/v1/iaq/dashboard` | IAQ 总览（区域评分、建筑评分） |
| `GET /api/v1/iaq/zones` | 区域列表 |
| `GET /api/v1/iaq/history?param=co2` | 参数历史趋势 |

监测指标：CO2、PM2.5、TVOC、温度、湿度。

---

## 4. Lighting — 照明管理

**导航路径：** `/modules/lighting`

**API：** `GET /api/v1/lighting/dashboard`

照明系统监控和能耗优化。

---

## 5. Water — 水务管理

**导航路径：** `/modules/water`

**API：** `GET /api/v1/water/dashboard`

供水系统监控、用水量分析、泄漏检测。

---

## 6. UPS — 不间断电源

**导航路径：** `/modules/ups`

**API：** `GET /api/v1/ups/dashboard`

UPS 状态监控、电池健康、负载分析。

---

## 7. Elevator — 电梯管理

**导航路径：** `/modules/elevator`

**API：** `GET /api/v1/elevator/dashboard`

电梯运行状态、故障检测、维护计划。

---

## 8. Fire — 消防系统

**导航路径：** `/modules/fire`

**API：** `GET /api/v1/fire/dashboard`

消防设备状态、检测器监控、消防合规。

---

## 9. Parking — 停车管理

**导航路径：** `/modules/parking`

**API：** `GET /api/v1/parking/dashboard`

停车位状态、车辆进出、占用率分析。

---

## 10. Cleaning — 保洁管理

**导航路径：** `/modules/cleaning`

**API：** `GET /api/v1/cleaning/dashboard`

保洁任务管理、区域排班、质量检查。

---

## 11. Space — 空间管理

**导航路径：** `/modules/space`

**API：** `GET /api/v1/space/dashboard`

空间使用率、工位管理、会议室预约。

---

## 12. Visitor — 访客管理

**导航路径：** `/modules/visitor`

**API 基础路径：** `/api/v1/visitor`

| API | 说明 |
|-----|------|
| `GET /api/v1/visitor/visitors` | 访客列表 |
| `GET /api/v1/visitor/visits` | 来访记录 |

访客预约、签到签出、访客通行证管理。

---

## 13. Contractor — 外包商管理

**导航路径：** `/modules/contractor`

**API：** `GET /api/v1/contractors`

外包商台账、合同管理、绩效评估。详见 platform-admin.md 外包商管理章节。

---

## 14. Inventory — 库存管理

**导航路径：** `/modules/inventory`

**API：** `GET /api/v1/inventory/dashboard`

备件库存管理、库存预警、出入库记录。

---

## 15. Billing — 账单管理

**导航路径：** `/modules/billing`

**API：** `GET /api/v1/billing/dashboard`

能耗账单、费用分摊、发票管理。

---

## 16. PM — 预防性维护

**导航路径：** `/modules/pm`

**API：** `GET /api/v1/maintenance`

预防性维护计划模板、周期性任务自动生成工单。

| API | 说明 |
|-----|------|
| `GET /api/v1/maintenance/schedule` | 维护计划 |
| `GET /api/v1/maintenance/templates` | 维护模板列表 |
| `GET /api/v1/maintenance/templates/{id}` | 模板详情 |
| `GET /api/v1/maintenance/stats` | 维护统计 |

---

## ESG — 环境、社会与治理

> **独立行业模块**，模块 key: `esg`。需单独启用。

**导航路径：** `/modules/esg`

**API 基础路径：** `/api/v1/esg`（部分接口走 `/api/v1/sustainability`）

| API | 说明 |
|-----|------|
| `GET /api/v1/esg/dashboard` | ESG 总览仪表盘 |
| `GET /api/v1/esg/carbon` | 碳排放数据 |
| `GET /api/v1/esg/compliance` | 合规评估 |
| `POST /api/v1/esg/report/generate` | 生成 ESG 报告 |

ESG 仪表盘读取 `emission_record` 和 `sustainability_target` 表的真实数据。
