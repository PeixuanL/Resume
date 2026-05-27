# WayfindingOps 室内导航模块 — User Guide

**版本 Version:** 2026-04-08  
**维护 Maintained by:** AzureBot (DataMesh)  
**适用对象 Audience:** 客户、售前、内部团队

---

## 目录 Table of Contents

1. [模块概述 Module Overview](#1-模块概述-module-overview)
2. [导航结构 Navigation](#2-导航结构-navigation)
3. [总览仪表盘 Overview Dashboard](#3-总览仪表盘-overview-dashboard)
4. [三维导航 3D Navigator](#4-三维导航-3d-navigator)
5. [楼层平面图画布 Floor Plan Studio](#5-楼层平面图画布-floor-plan-studio)
6. [导航分析 Analytics](#6-导航分析-analytics)
7. [AI Advisor 智能顾问](#7-ai-advisor-智能顾问)

---

## 1. 模块概述 Module Overview

### 1.1 什么是 WayfindingOps？

**WayfindingOps（室内导航模块）** 是 DataMesh FactVerse 平台的室内导航与寻路模块，提供 3D 导航体验、楼层平面图管理和导航数据分析。

**核心价值主张：**
- 基于 Three.js 的 3D 室内导航，支持多楼层跨层路径规划
- A* 算法生成最优路径，支持轮椅无障碍路径
- Floor Plan Studio：导入 DXF/图片底图，绘制导航网格
- POI 兴趣点管理：设备、出口、电梯等关键位置标注
- 导航数据分析：优化标识牌和公共区域布局

**目标场景：**
- 商业楼宇室内导航
- 医院设施导航
- 机场/车站室内导航
- 工厂设备导航

### 1.2 关键 AI 端点

| 方法 | 端点 | 描述 |
|---|---|---|
| `POST` | `/ai/wayfinding/navigate` | A* 路径规划 |
| `GET` | `/ai/wayfinding/analytics` | 导航数据分析 |

---

## 2. 导航结构 Navigation

| 路由 Path | 页面 Page |
|---|---|
| `/wayfinding/overview` | 总览仪表盘 |
| `/wayfinding/navigator` | 三维导航 |
| `/wayfinding/floor-plans` | 楼层管理（含 Floor Plan Studio） |
| `/wayfinding/analytics` | 导航分析 |

---

## 3. 总览仪表盘 Overview Dashboard

### 3.1 功能页面

- **Overview** (`/wayfinding/overview`): 导航系统整体状态

### 3.2 展示内容

- 已发布楼层平面图数量
- POI 总数（按类型统计）
- 今日导航请求次数
- 热门目的地 Top 5

### 3.3 Backend API

| 方法 | 端点 | 描述 |
|---|---|---|
| `GET` | `/api/v1/wayfinding/overview` | 总览数据 |

---

## 4. 三维导航 3D Navigator

### 4.1 功能页面

- **Navigator** (`/wayfinding/navigator`): Three.js 3D 导航视图

### 4.2 核心功能

- **起终点选择**：在 3D 模型中点选起点和终点，或从 POI 列表选择
- **路径显示**：A* 算法生成最优路径，在 3D 场景中高亮显示
- **多楼层导航**：跨楼层路径自动经过电梯/楼梯，显示楼层切换指引
- **步行距离/时间**：估算步行距离（米）和预计时间（分钟）
- **无障碍路径**：支持轮椅可达路径模式

### 4.3 API

| 方法 | 端点 | 描述 |
|---|---|---|
| `POST` | `/api/v1/wayfinding/navigate` | 路径规划请求 |

**请求参数：**

```json
{
  "from": "entrance-main",
  "to": "equipment-chiller-01",
  "accessible": false
}
```

**返回内容：** 路径节点序列、总距离、预计时间、途经楼层列表。

---

## 5. 楼层平面图画布 Floor Plan Studio

### 5.1 功能页面

- **Floor Plans** (`/wayfinding/floor-plans`): 楼层管理列表，点击进入 Floor Plan Studio

### 5.2 Floor Plan Studio 功能

| 功能 | 说明 |
|---|---|
| 导入平面图 | 支持 DXF（AutoCAD）、图片（PNG/JPEG）导入 |
| 墙体绘制 | 在平面图上绘制墙体和障碍物 |
| 通行区域标注 | 标记可行走区域和禁止通行区域 |
| 出入口标注 | 标记门、电梯、楼梯位置 |
| 导航网格生成 | 自动将平面图转化为 A* 导航网格 |
| 发布 | 编辑完成后发布到导航系统 |

### 5.3 Backend API

| 方法 | 端点 | 描述 |
|---|---|---|
| `GET` | `/api/v1/wayfinding/floors` | 楼层列表 |
| `POST` | `/api/v1/wayfinding/floors` | 创建楼层 |
| `PUT` | `/api/v1/wayfinding/floors/:id` | 更新楼层 |

---

## 6. 导航分析 Analytics

### 6.1 功能页面

- **Analytics** (`/wayfinding/analytics`): 导航数据统计分析

### 6.2 分析维度

| 维度 | 说明 |
|---|---|
| 使用频率 | 每日/周/月导航请求次数趋势 |
| 热门路线 | 最常使用的起终点组合 |
| 平均导航距离 | 用户平均步行距离统计 |
| 楼层热力图 | 各楼层使用频率热图 |

### 6.3 Use Case UC1：优化标识牌布置

**操作步骤：**
1. 进入 `/wayfinding/analytics`
2. 查看"热门路线"——发现某区域频繁绕行
3. 结合楼层热力图，判断是否需要增加导向标识
4. 导出分析报告 PDF

---

## 7. AI Advisor 智能顾问

WayfindingOps 已接入 AI Advisor：

| 示例问题 | 调用工具 |
|---|---|
| "今日导航请求量是多少？" | `get_wayfinding_stats` |
| "最热门的起点和终点是什么？" | `POST /ai/wayfinding/analytics` |
| "从主入口到3号电梯的最优路径是什么？" | `POST /ai/wayfinding/navigate` |

---

*最后更新：2026-04-08 | AzureBot (DataMesh)*
