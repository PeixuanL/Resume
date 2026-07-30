# PdM 预测性维护模块 — User Guide

**版本 Version:** 2026-04-08  
**维护 Maintained by:** AzureBot (DataMesh)  
**适用对象 Audience:** 客户、售前、内部团队

---

## 目录 Table of Contents

1. [模块概述 Module Overview](#1-模块概述-module-overview)
2. [导航结构 Navigation](#2-导航结构-navigation)
3. [设备台账管理 Equipment Management](#3-设备台账管理-equipment-management)
4. [设备健康评分 Equipment Health Score](#4-设备健康评分-equipment-health-score)
5. [振动分析 Vibration Analysis](#5-振动分析-vibration-analysis)
6. [效率分析 Efficiency Analysis](#6-效率分析-efficiency-analysis)
7. [预测性维护计划 Predictive Maintenance Scheduling](#7-预测性维护计划-predictive-maintenance-scheduling)
8. [异常事件管理 Anomaly Events](#8-异常事件管理-anomaly-events)
9. [能源分析 Energy Analysis](#9-能源分析-energy-analysis)
10. [报告 Reports](#10-报告-reports)
11. [设置与配置 Settings](#11-设置与配置-settings)
12. [ onboarding 向导 Onboarding Wizard](#12-onboarding-向导-onboarding-wizard)
13. [AI 自动分析 AI Auto-Analysis](#13-ai-自动分析-ai-auto-analysis)
14. [AI Advisor 智能顾问](#14-ai-advisor-智能顾问)

---

## 1. 模块概述 Module Overview

### 1.1 什么是 PdM？

**PdM（预测性维护模块）** 是 DataMesh FactVerse 平台的智能设备健康管理与预测性维护模块，通过 AI 引擎对旋转设备（泵、压缩机、电机、风机）进行实时健康评估、振动频谱分析、异常检测和故障预测。

**核心价值主张：**
- 设备健康实时评分（0–100），提前 10–14 天识别设备风险
- 振动频谱分析，识别轴承磨损、不平衡、轴不对中
- 自动生成维护工单，减少非计划停机 30–50%
- 支持 Yokogawa、横河等工业设备集成

**目标场景：**
- 工厂旋转设备（泵/压缩机/电机/风机）
- HVAC 设备健康监控
- 生产线关键设备预测性维护

### 1.2 系统架构 System Architecture

```
用户浏览器 (Vue 3 Frontend)
       │
       ▼
Backend API  (port 8080 · Bearer Token)
  └── GET /api/v1/pdm/*
       │
       ├──► Database (PostgreSQL · equipment台账、health_snapshot、maintenance_record)
       │
       └──► AI Engine  (port 8000 · X-API-Key)
              └── POST /ai/pdm/*
                  ├── /health-score        (设备健康评分)
                  ├── /vibration/analyze   (振动频谱分析)
                  ├── /anomaly/detect      (异常检测)
                  ├── /fault/predict       (故障预测)
                  ├── /energy/consume      (能耗分析)
                  └── /maintenance/schedule (维护计划)
```

### 1.3 数据模型

| 表名 | 描述 |
|---|---|
| `pdm_equipment_profile` | 设备台账（类型、型号、额定参数、位置） |
| `pdm_health_snapshot` | 健康快照（定时写入，保留 30 天） |
| `pdm_maintenance_record` | 维护记录（保养、维修、更换） |
| `pdm_anomaly_event` | 异常事件（检测时间、等级、类型、置信度） |
| `pdm_energy_baseline` | 能耗基线（峰/谷/均值） |

### 1.4 关键 AI 端点

| 方法 | 端点 | 描述 |
|---|---|---|
| `POST` | `/ai/pdm/health-score` | 计算设备健康评分 |
| `POST` | `/ai/pdm/vibration/analyze` | 振动频谱分析与故障诊断 |
| `POST` | `/ai/pdm/anomaly/detect` | 异常事件检测 |
| `POST` | `/ai/pdm/fault/predict` | 剩余使用寿命（RUL）预测 |
| `POST` | `/ai/pdm/energy/consume` | 能耗基线对比分析 |
| `POST` | `/ai/pdm/maintenance/schedule` | 优化维护计划生成 |
| `GET` | `/ai/pdm/current-analysis` | 当前分析状态（长期任务） |

---

## 2. 导航结构 Navigation

| 路由 Path | 页面 Page |
|---|---|
| `/pdm/dashboard` | PdM 总览仪表盘 |
| `/pdm/equipment` | 设备列表 |
| `/pdm/equipment/:id` | 设备详情 |
| `/pdm/equipment/:id/components` | 设备子组件管理 |
| `/pdm/equipment/:id/traceability` | 设备追溯链 |
| `/pdm/equipment/:id/circular` | 设备循环分析 |
| `/pdm/equipment/:id/parts-auth` | 配件认证 |
| `/pdm/vibration` | 振动分析总览 |
| `/pdm/vibration-source` | 振动源分析 |
| `/pdm/efficiency` | 设备效率分析 |
| `/pdm/maintenance` | 维护管理 |
| `/pdm/anomalies` | 异常事件列表 |
| `/pdm/energy` | 能源分析 |
| `/pdm/reports` | 报告中心 |
| `/pdm/settings` | 模块设置 |
| `/pdm/onboarding` | 设备 onboarding 向导 |
| `/pdm/auto-analysis` | AI 自动分析 |
| `/pdm/templates` | 设备模板管理 |
| `/pdm/fleet` | 设备群组管理 |

---

## 3. 设备台账管理 Equipment Management

### 3.1 功能页面

- **Equipment List** (`/pdm/equipment`): 所有设备清单，含健康评分、状态、位置、类型
- **Equipment Detail** (`/pdm/equipment/:id`): 单设备完整信息——台账、健康趋势、维护历史、当前告警

### 3.2 设备类型

| 类型 | EquipmentClass | 示例 |
|---|---|---|
| 泵 | PUMP | 离心泵、螺杆泵、隔膜泵 |
| 压缩机 | COMPRESSOR | 螺杆压缩机、离心压缩机 |
| 电机 | MOTOR | 异步电机、同步电机 |
| 风机 | FAN | 离心风机、轴流风机 |
| 通用 | GENERAL | 减速机、传动设备 |

### 3.3 Use Case UC1：新建设备台账

**操作步骤：**
1. 进入 `/pdm/equipment`，点击"添加设备"或"onboarding 向导"
2. 选择设备类型（泵/压缩机/电机/风机/通用）
3. 填写设备参数：额定功率(kW)、额定转速(rpm)、制造厂商、型号、序列号
4. 上传设备铭牌照片（可选）
5. 关联传感器（选择已接入的传感器 ID）
6. 点击"保存"，系统初始化健康基线

**预期结果：** 设备出现在列表中，初始健康评分 100 分，90 天后开始有有效健康数据。

---

## 4. 设备健康评分 Equipment Health Score

### 4.1 评分模型

健康评分（0–100）基于多维度综合计算：

| 维度 | 权重 | 数据来源 |
|---|---|---|
| 振动特征 | 30% | 振动传感器频谱数据 |
| 温度趋势 | 25% | 温度传感器（轴承温度、腔体温度） |
| 运行工况 | 20% | 电流、功率、效率 |
| 维护历史 | 15% | maintenance_record |
| 异常事件 | 10% | anomaly_event |

### 4.2 评分等级

| 评分 | 等级 | 颜色 | 建议动作 |
|---|---|---|---|
| 80–100 | NORMAL | 绿 | 正常运行 |
| 60–79 | WARNING | 黄 | 关注，制定检查计划 |
| 40–59 | CRITICAL | 橙 | 尽快安排维护 |
| 0–39 | FAILURE | 红 | 立即检查，避免非计划停机 |

### 4.3 Use Case UC2：批量查看设备健康状态

**操作步骤：**
1. 进入 `/pdm/dashboard`，查看全厂设备健康分布饼图
2. 筛选"WARNING"和"CRITICAL"设备
3. 按健康评分升序排列，快速定位最需要关注的设备
4. 点击设备卡片，直接跳转至设备详情

**预期结果：** <2 分钟定位最需要维护的设备。

---

## 5. 振动分析 Vibration Analysis

### 5.1 功能页面

- **Vibration Overview** (`/pdm/vibration`): 全厂振动异常设备列表
- **Vibration Source** (`/pdm/vibration-source`): 振动源定位与频谱分析

### 5.2 振动故障类型识别

| 故障类型 | 特征频率 | 可能原因 |
|---|---|---|
| 不平衡 | 1× RPM | 叶轮积垢、轴弯曲 |
| 轴不对中 | 2× RPM | 联轴器安装误差 |
| 轴承磨损 | BPFO / BPFI / FTF | 润滑不足、寿命到期 |
| 共振 | 固有频率 | 结构设计问题 |
| 齿轮啮合 | GMF (齿轮啮合频率) | 齿面磨损、啮合间隙大 |

### 5.3 Use Case UC3：轴承故障诊断

**描述：** 某泵振动异常，怀疑轴承磨损。

**操作步骤：**
1. 进入 `/pdm/vibration`，找到目标设备，查看 `vibration_severity` 列
2. 点击进入 `/pdm/equipment/:id`，查看振动趋势图
3. 点击"振动分析" → 调用 `POST /ai/pdm/vibration/analyze`
4. 输入：`sensor_id`、`analysis_type: "bearing_fault"`、`time_range: "7d"`
5. 系统返回：
   - `fault_probability`: 轴承故障概率（%）
   - `dominant_frequency_hz`: 主要振动频率
   - `recommended_action`: 建议（更换轴承 / 加油 / 继续观察）

**预期结果：** <5 分钟获得轴承故障概率，避免计划外停机。

---

## 6. 效率分析 Efficiency Analysis

### 6.1 功能页面

- **Efficiency** (`/pdm/efficiency`): 设备效率趋势、效率损失分析

### 6.2 效率指标

| 设备类型 | 效率指标 | 计算方式 |
|---|---|---|
| 泵 | Pump Efficiency (%) | 液压功率 / 输入功率 |
| 压缩机 | Volumetric Efficiency (%) | 实际排气量 / 理论排气量 |
| 电机 | Motor Efficiency (%) | 输出功率 / 输入功率 |
| 风机 | Fan Efficiency (%) | 空气功率 / 输入功率 |

### 6.3 Use Case UC4：泵效率低于基线

**操作步骤：**
1. 进入 `/pdm/efficiency`，找到目标泵，查看 `efficiency_current` vs `efficiency_baseline`
2. 若当前效率低于基线 10% 以上，点击"分析原因"
3. 系统调用 `/ai/pdm/health-score` + 关联传感器数据
4. 返回可能的效率损失原因（叶轮磨损 / 阀门开度不足 / 流体黏度变化）

---

## 7. 预测性维护计划 Predictive Maintenance Scheduling

### 7.1 功能页面

- **Maintenance** (`/pdm/maintenance`): 维护计划日历、待执行任务列表

### 7.2 维护类型

| 类型 | MaintenanceType | 触发方式 |
|---|---|---|
| 日常巡检 | INSPECTION | 定期计划 |
| 预防性保养 | PREVENTIVE | 基于运行时长或周期 |
| 预测性维护 | PREDICTIVE | AI 健康评分触发 |
| 紧急维修 | CORRECTIVE | 异常事件触发 |

### 7.3 Use Case UC5：AI 自动生成维护计划

**操作步骤：**
1. 进入 `/pdm/maintenance`，点击"AI 生成维护计划"
2. 调用 `POST /ai/pdm/maintenance/schedule`
3. 输入：`budget_limit`、`max_downtime_hours`、`priority_level`
4. 系统返回：
   - `schedule`: 每日维护任务列表
   - `estimated_cost`: 总成本估算
   - `downtime_risk`: 停机风险评估
   - `priority_equipment`: 最优先维护设备

**预期结果：** 输出 30 天维护计划，直接导出至工单系统。

---

## 8. 异常事件管理 Anomaly Events

### 8.1 功能页面

- **Anomaly List** (`/pdm/anomalies`): 全厂异常事件时序列表

### 8.2 异常等级

| 等级 | AnomalyLevel | 描述 |
|---|---|---|
| INFO | INFO | 轻微偏移，关注即可 |
| WARNING | WARNING | 中等异常，需关注 |
| CRITICAL | CRITICAL | 严重异常，需立即处理 |
| EMERGENCY | EMERGENCY | 紧急停机风险 |

### 8.3 异常类型

| 类型 | AnomalyType | 典型原因 |
|---|---|---|
| 振动异常 | VIBRATION_ANOMALY | 轴承磨损、不平衡 |
| 温度异常 | TEMPERATURE_ANOMALY | 冷却不足、负载过高 |
| 效率下降 | EFFICIENCY_DROP | 叶轮磨损、阀门卡滞 |
| 能耗异常 | ENERGY_ANOMALY | 设备老化、控制策略失效 |
| 运行参数异常 | OPERATING_PARAM_ANOMALY | 入口压力/流量异常 |

### 8.4 Use Case UC6：处理紧急异常事件

**操作步骤：**
1. 进入 `/pdm/anomalies`，看到红色 EMERGENCY 事件横幅
2. 点击事件，查看详情：
   - `equipment_name`: 异常设备
   - `anomaly_type`: 异常类型
   - `confidence`: 置信度（%）
   - `triggered_sensors`: 触发传感器列表
3. 点击"生成维护工单" → 自动创建 WorkOrder，跳转至 `/workorders`
4. 工单自动填充异常描述、建议动作、关联设备

---

## 9. 能源分析 Energy Analysis

### 9.1 功能页面

- **Energy** (`/pdm/energy`): 设备能耗趋势、基线对比、异常检测

### 9.2 能耗基线

系统为每台设备建立能耗基线：
- **正常工况基线**: 额定制冷量/功率下的标准能耗
- **季节性基线**: 考虑环境温度影响的动态基线
- **渐进式退化基线**: 考虑设备老化因素的年衰减曲线

### 9.3 Use Case UC7：能耗异常告警

**操作步骤：**
1. 进入 `/pdm/energy`，设备能耗看板显示日均能耗 vs 基线
2. 若某设备今日能耗高于基线 20% 以上，显示红色标识
3. 点击设备 → 调用 `/ai/pdm/energy/consume` 进行根因分析
4. 系统返回：
   - `energy_deviation_ratio`: 能耗偏离比例
   - `probable_causes`: 可能原因
   - `estimated_extra_cost_usd`: 超额运行成本估算

---

## 10. 报告 Reports

### 10.1 功能页面

- **Reports** (`/pdm/reports`): 设备健康月报、维护报告、OEE 报告

### 10.2 报告类型

| 报告 | 内容 | 周期 |
|---|---|---|
| 设备健康月报 | 健康评分汇总、异常事件、维护完成率 | 月 |
| 维护报告 | 计划 vs 实际工时、故障间隔分析(MTBF) | 月/季度 |
| 能耗报告 | 能耗基线对比、退化趋势、节能空间 | 月 |
| 振动分析报告 | 频谱数据、故障诊断、趋势预测 | 按需 |

---

## 11. 设置与配置 Settings

### 11.1 功能页面

- **Settings** (`/pdm/settings`): 告警阈值、通知规则、基线配置

### 11.2 可配置参数

| 参数 | 说明 | 默认值 |
|---|---|---|
| 健康评分告警阈值 | WARNING 触发阈值 | 60 分 |
| 振动告警阈值 | mm/s RMS 上限 | 4.5 mm/s |
| 温度告警阈值 | 轴承温度上限 | 80°C |
| 分析采样间隔 | AI 分析数据采样频率 | 5 分钟 |
| 预测时间范围 | RUL 预测时长 | 14 天 |

---

## 12. Onboarding 向导 Onboarding Wizard

### 12.1 功能页面

- **Onboarding** (`/pdm/onboarding`): 引导式新建设备流程

### 12.2 向导步骤

1. **Step 1 — 基本信息**: 设备类型、名称、位置、关联站点
2. **Step 2 — 技术参数**: 额定功率、转速、压力、温度等铭牌参数
3. **Step 3 — 传感器配置**: 选择或创建关联传感器（振动、温度、电流）
4. **Step 4 — 基线训练**: 系统自动采集 7 天数据建立健康基线
5. **Step 5 — 确认**: 保存台账，激活健康监控

---

## 13. AI 自动分析 AI Auto-Analysis

### 13.1 功能页面

- **Auto-Analysis** (`/pdm/auto-analysis`): 多设备批量 AI 分析任务

### 13.2 分析任务类型

| 任务 | 描述 | 输出 |
|---|---|---|
| 批量健康评分 | 对所有设备批量计算健康评分 | 健康分布图 |
| 振动频谱批量分析 | 批量检测振动异常设备 | 异常设备列表 |
| 退化趋势分析 | 识别效率/能耗退化设备 | 退化排名 |
| RUL 批量预测 | 批量预测设备剩余使用寿命 | RUL 分布 |

### 13.3 Use Case UC8：批量识别高风险设备

**操作步骤：**
1. 进入 `/pdm/auto-analysis`，选择"批量健康评分"
2. 选择目标设备群组（可多选 / 全选）
3. 点击"开始分析" → 系统后台调用 `/ai/pdm/current-analysis`
4. 任务完成后，查看结果页面：
   - 健康评分分布直方图
   - 评分最低的 5 台设备
   - 与上次分析相比评分下降的设备

---

## 14. AI Advisor 智能顾问

PdM 模块已接入 AI Advisor，可通过自然语言查询：

| 示例问题 | 调用工具 |
|---|---|
| "厂里有多少设备健康评分低于 60 分？" | `get_equipment_status` (PdM 模式) |
| "最近有哪些新的振动异常？" | `get_proactive_alerts` (PdM) |
| "帮我分析 3号压缩机的健康趋势" | `POST /ai/pdm/health-score` |
| "2号泵的剩余使用寿命是多少？" | `POST /ai/pdm/fault/predict` |
| "生成这个月的PdM健康报告" | `POST /ai/pdm/reports/generate` |

---

## 附录：Yokogawa 设备接入说明

PdM 模块支持横河（Yokogawa）设备接入：

1. **CENTUM VP 集成**: 通过 OPC UA 读取设备运行数据
2. **ProCyclone 压缩机**: 支持 Modbus TCP 协议
3. **振动传感器协议**: 支持 4-20mA 模拟量 + HART 数字量

> 更多详情请参考：`docs/prd/prd-yokogawa-pdm-phase1.md`

---

*最后更新：2026-04-08 | AzureBot (DataMesh)*
