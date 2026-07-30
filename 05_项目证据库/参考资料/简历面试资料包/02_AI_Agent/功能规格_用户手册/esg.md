# ESG 环境社会治理模块 — User Guide

**版本 Version:** 2026-04-08  
**维护 Maintained by:** AzureBot (DataMesh)  
**适用对象 Audience:** 客户、售前、内部团队

---

## 目录 Table of Contents

1. [模块概述 Module Overview](#1-模块概述-module-overview)
2. [导航结构 Navigation](#2-导航结构-navigation)
3. [ESG 仪表盘 ESG Dashboard](#3-esg-仪表盘-esg-dashboard)
4. [碳排放管理 Emissions Management](#4-碳排放管理-emissions-management)
5. [废弃物管理 Waste Management](#5-废弃物管理-waste-management)
6. [ESG 报告 Reports](#6-esg-报告-reports)
7. [AI Advisor 智能顾问](#7-ai-advisor-智能顾问)

---

## 1. 模块概述 Module Overview

### 1.1 什么是 ESG？

**ESG（环境社会治理模块）** 是 DataMesh FactVerse 平台的综合 ESG 报告与分析模块，支持碳排放追踪、废弃物管理、ESG 合规报告生成。

**核心价值主张：**
- 自动计算碳排放（范围 1/2/3）
- 废弃物全流程追踪（产生 → 处置 → 报告）
- ESG 合规报告一键生成（GRI / SASB / CDP）
- 减排目标追踪与预警

**目标场景：**
- 上市公司 ESG 披露
- 制造企业碳合规
- 工业园区碳管理

### 1.2 关键 AI 端点

| 方法 | 端点 | 描述 |
|---|---|---|
| `POST` | `/ai/esg/emissions/calculate` | 碳排放计算 |
| `POST` | `/ai/esg/waste/analysis` | 废弃物分析 |
| `POST` | `/ai/esg/report/generate` | ESG 报告生成 |

---

## 2. 导航结构 Navigation

| 路由 Path | 页面 Page |
|---|---|
| `/esg/dashboard` | ESG 总览仪表盘 |
| `/esg/emissions` | 碳排放管理 |
| `/esg/reports` | ESG 报告中心 |
| `/esg/waste-management` | 废弃物管理 |

---

## 3. ESG 仪表盘 ESG Dashboard

### 3.1 功能页面

- **Dashboard** (`/esg/dashboard`): ESG KPI 总览、E、S、G 三大维度评分

### 3.2 评分维度

| 维度 | 指标示例 | 满分 |
|---|---|---|
| Environmental (E) | 碳排放强度、能源消耗强度、废弃物回收率 | 100 |
| Social (S) | 事故率、培训时长、员工满意度 | 100 |
| Governance (G) | 合规审计通过率、董事会多元化 | 100 |

---

## 4. 碳排放管理 Emissions Management

### 4.1 功能页面

- **Emissions** (`/esg/emissions`): 碳排放数据录入、趋势分析、目标追踪

### 4.2 Use Case UC1：月度碳排放填报与追踪

**操作步骤：**
1. 进入 `/esg/emissions`
2. 选择报告期（月份 / 季度 / 年度）
3. 填报各排放源数据（电力、燃气、蒸汽、燃油）
4. 系统自动计算范围 1/2/3 碳排放
5. 与年度目标对比，查看目标完成率

---

## 5. 废弃物管理 Waste Management

### 5.1 功能页面

- **Waste Management** (`/esg/waste-management`): 废弃物产生量、处置方式（回收/填埋/焚烧）、合规追踪

### 5.2 Use Case UC2：废弃物合规报告

**操作步骤：**
1. 进入 `/esg/waste-management`
2. 选择报告期
3. 录入废弃物类型（一般废弃物/危险废弃物）和数量
4. 选择处置方式，系统自动计算回收率和合规指数
5. 导出合规报告 PDF

---

## 6. ESG 报告 Reports

### 6.1 功能页面

- **Reports** (`/esg/reports`): 一站式 ESG 报告中心

### 6.2 支持的报告框架

| 框架 | 说明 |
|---|---|
| GRI | Global Reporting Initiative |
| SASB | Sustainability Accounting Standards Board |
| CDP | Carbon Disclosure Project |
| TCFD | Task Force on Climate-Related Financial Disclosures |

---

## 7. AI Advisor 智能顾问

| 示例问题 | 调用工具 |
|---|---|
| "本月总碳排放量是多少？" | `get_esg_emissions` |
| "距离年度减排目标还差多少？" | `get_esg_target_progress` |
| "生成季度 ESG 报告" | `POST /ai/esg/report/generate` |

---

*最后更新：2026-04-08 | AzureBot (DataMesh)*
