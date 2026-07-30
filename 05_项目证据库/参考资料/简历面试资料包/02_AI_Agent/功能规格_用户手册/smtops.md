# SMTops SMT 优化模块 — User Guide

**版本 Version:** 2026-04-08  
**维护 Maintained by:** AzureBot (DataMesh)  
**适用对象 Audience:** 客户、售前、内部团队

---

## 目录 Table of Contents

1. [模块概述 Module Overview](#1-模块概述-module-overview)
2. [导航结构 Navigation](#2-导航结构-navigation)
3. [OEE 仪表盘 OEE Dashboard](#3-oee-仪表盘-oee-dashboard)
4. [洁净室管理 Cleanroom Management](#4-洁净室管理-cleanroom-management)
5. [配方管理 Recipe Management](#5-配方管理-recipe-management)
6. [AI Advisor 智能顾问](#6-ai-advisor-智能顾问)

---

## 1. 模块概述 Module Overview

### 1.1 什么是 SMTops？

**SMTops（SMT 产线优化模块）** 是 DataMesh FactVerse 平台的 SMT（表面贴装技术）产线优化模块，支持 OEE 追踪、洁净室管理和配方管理。

> 注：完整半导体运营功能见 `semiops.md`（洁净室环境监控、SMT 缺陷分析、良率分析、设备健康管理）

**SMTops 聚焦：**
- OEE（设备综合效率）实时追踪
- SMT 产线可用率分析
- 配方（Recipe）标准化管理

**目标场景：**
- 电子制造（EMS）SMT 产线
- PCBA 组装车间

### 1.2 关键 AI 端点

| 方法 | 端点 | 描述 |
|---|---|---|
| `POST` | `/ai/smtops/oee` | OEE 计算与分析 |
| `POST` | `/ai/smtops/cleanroom` | 洁净室状态分析 |
| `GET` | `/ai/smtops/recipes` | 配方列表 |

---

## 2. 导航结构 Navigation

| 路由 Path | 页面 Page |
|---|---|
| `/smtops/oee` | OEE 仪表盘 |
| `/smtops/cleanroom` | 洁净室管理 |
| `/smtops/recipes` | 配方管理 |

---

## 3. OEE 仪表盘 OEE Dashboard

### 3.1 OEE 公式

```
OEE = Availability × Performance × Quality

- Availability = (Run Time / Planned Production Time) × 100%
- Performance = (Ideal Cycle Time × Total Count / Run Time) × 100%
- Quality = (Good Count / Total Count) × 100%
```

### 3.2 Use Case UC1：提升产线 OEE

**操作步骤：**
1. 进入 `/smtops/oee`
2. 选择目标产线和时间范围
3. 查看 OEE 三大损失分解（可用率/性能/质量）
4. 点击最高损失项，下钻查看详细损失事件
5. 系统给出优化建议（调整换线策略 / 降低故障停机）

---

## 4. 洁净室管理 Cleanroom Management

### 4.1 功能页面

- **Cleanroom** (`/smtops/cleanroom`): 洁净室环境监控（温湿度、压差、粒子计数）

---

## 5. 配方管理 Recipe Management

### 5.1 功能页面

- **Recipes** (`/smtops/recipes`): SMT 配方库，支持配方创建、编辑、版本控制

### 5.2 Use Case UC2：新配方导入

**操作步骤：**
1. 进入 `/smtops/recipes`，点击"新建配方"
2. 上传配方文件（CSV / XML 格式）
3. 系统解析并显示关键参数（回流温度曲线、速度、氮气流量）
4. 校验参数合理性，点击"保存为草稿"
5. 发布前在测试区验证

---

## 6. AI Advisor 智能顾问

| 示例问题 | 调用工具 |
|---|---|
| "今日各线 OEE 是多少？" | `get_smtops_oee` |
| "哪条线性能损失最大？" | `get_smtops_bottleneck` |
| "帮我分析 2 号线 OEE 下降原因" | `POST /ai/smtops/oee` |

---

*最后更新：2026-04-08 | AzureBot (DataMesh)*
