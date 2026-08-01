# Value Dashboard 用户指南

## Overview

价值仪表盘用于量化展示 FactVerse AI Agent 为设施管理带来的实际价值。通过对比部署前后的关键指标，结合行业基准和 ROI 计算，帮助管理者用数据证明数字化转型的投资回报。

核心目标：**让价值可见、可量化、可汇报**。

---

## KPIs

### 接口

```
GET /api/v1/value/dashboard
```

### 说明

价值仪表盘 KPI 展示系统部署后产生的核心价值指标。

### 响应示例

```json
{
  "summary": {
    "totalSavings": 260000,
    "currency": "CNY",
    "period": "2025-03-01/2026-02-18",
    "roiPercentage": 320
  },
  "kpis": [
    {
      "id": "energy-cost",
      "name": "能源费用节约",
      "before": 520000,
      "after": 385000,
      "savings": 135000,
      "unit": "CNY/year",
      "improvementPct": 26.0
    },
    {
      "id": "maintenance-cost",
      "name": "维护成本降低",
      "before": 280000,
      "after": 205000,
      "savings": 75000,
      "unit": "CNY/year",
      "improvementPct": 26.8
    },
    {
      "id": "labor-hours",
      "name": "人工工时节约",
      "before": 4800,
      "after": 3200,
      "savings": 1600,
      "unit": "hours/year",
      "improvementPct": 33.3
    },
    {
      "id": "response-time",
      "name": "告警响应时间",
      "before": 45,
      "after": 12,
      "savings": 33,
      "unit": "minutes",
      "improvementPct": 73.3
    }
  ]
}
```

### 功能说明

- 各 KPI 卡片同时展示部署前（Before）和部署后（After）的数值
- 改善百分比以醒目颜色标注（绿色=改善，红色=恶化）
- 支持切换查看不同时间粒度（月/季/年）

---

## Baselines

### 接口

**查询基线**：
```
GET /api/v1/value/baselines
```

**设置基线**：
```
POST /api/v1/value/baselines
```

### 说明

基线管理用于设定部署前的指标基准值（Before），系统自动采集部署后的实际值（After）。基线是价值计算的基础。

### 命名规则

部署后的指标字段自动添加 `_after` 后缀以区分：

| 字段 | 说明 |
|------|------|
| `energy_cost` | 部署前能源费用基线 |
| `energy_cost_after` | 部署后能源费用实际值 |
| `mttr` | 部署前平均修复时间 |
| `mttr_after` | 部署后平均修复时间 |

### 设置基线请求示例

```json
{
  "baselines": [
    {
      "metricId": "energy_cost",
      "value": 520000,
      "unit": "CNY/year",
      "source": "2024年财务报表",
      "measuredAt": "2024-12-31T23:59:59Z"
    },
    {
      "metricId": "mttr",
      "value": 4.5,
      "unit": "hours",
      "source": "2024年维保记录统计",
      "measuredAt": "2024-12-31T23:59:59Z"
    }
  ]
}
```

### 使用说明

- 基线应在系统部署初期设定，反映部署前的真实水平
- 支持从历史数据自动推算基线（需提供数据源）
- 基线一旦确认，建议不频繁修改，以保证对比的一致性
- `_after` 值由系统从实际运营数据中自动计算

---

## Benchmarks

基准对标功能将本建筑的运营指标与行业标准进行对比，帮助定位在行业中的水平。

### 支持的基准体系

| 基准 | 全称 | 说明 |
|------|------|------|
| **IFMA** | International Facility Management Association | 国际设施管理协会基准，覆盖运维成本、人员配比等 |
| **BOMA** | Building Owners and Managers Association | 建筑业主与管理者协会基准，侧重运营费用对标 |
| **ASHRAE** | American Society of Heating, Refrigerating and Air-Conditioning Engineers | 美国暖通空调工程师学会标准，侧重能效与环境指标 |

### 对标维度

- **能耗强度（EUI）**：kWh/m²/year，对标 ASHRAE 90.1 标准
- **运维成本**：CNY/m²/year，对标 IFMA 亚太区基准
- **人员配比**：m²/FTE，对标 BOMA 商业办公楼标准
- **设备可用率**：%，对标 IFMA 最佳实践
- **租户满意度**：分值，对标 BOMA 行业均值

### 功能说明

- 以雷达图展示本建筑在各维度上与行业基准的对比
- 支持选择不同基准体系和建筑类型（办公、商业、综合体）
- 标注所处百分位（如"优于 75% 的同类建筑"）

---

## ROI Calculation

### 接口

```
POST /ai/value/calculate
```

### 说明

ROI 计算引擎综合所有价值指标，计算系统部署的投资回报率。当前示范项目的年化节约额为 **¥260K**。

### 请求示例

```json
{
  "investmentCost": 80000,
  "period": "2025-03-01/2026-02-28",
  "includeIndirect": true,
  "discountRate": 0.05
}
```

### 响应示例

```json
{
  "investment": 80000,
  "totalSavings": 260000,
  "directSavings": {
    "energy": 135000,
    "maintenance": 75000,
    "labor": 32000
  },
  "indirectSavings": {
    "downtime_reduction": 12000,
    "compliance_efficiency": 6000
  },
  "roi": 225.0,
  "paybackMonths": 3.7,
  "npv": 168000,
  "irr": 0.42,
  "breakdown_chart": "base64://..."
}
```

### 计算说明

- **直接节约**：能源费用、维护成本、人工成本的可量化减少
- **间接节约**：停机减少带来的损失避免、合规效率提升等
- **NPV**：采用可配置的折现率计算净现值
- **IRR**：内部收益率，反映投资效率
- 投资回收期（Payback Period）以月为单位展示

---

## Executive Report PDF

### 接口

```
GET /ai/value/executive-summary
```

### 说明

生成面向管理层的价值总结报告 PDF，共 **4 页**，适合用于董事会汇报、投资评审或年度总结。

### 查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `period` | string | 最近 12 个月 | 报告覆盖时间范围 |
| `language` | string | `zh-CN` | 报告语言：`zh-CN`、`en` |
| `format` | string | `pdf` | 输出格式：`pdf` |

### 报告结构（4 页）

| 页码 | 内容 | 说明 |
|------|------|------|
| **第 1 页** | 执行摘要 | 核心数字一览：总节约额、ROI、关键亮点 |
| **第 2 页** | KPI 详细对比 | 部署前后各指标的详细对比图表 |
| **第 3 页** | 行业对标分析 | 与 IFMA/BOMA/ASHRAE 基准的对比结果 |
| **第 4 页** | 未来展望与建议 | AI 生成的下阶段优化建议和预期收益 |

### 使用说明

- 报告自动包含数据可视化图表，无需额外排版
- 支持添加企业 Logo 和自定义页眉/页脚
- PDF 生成为异步任务，通常 10-30 秒完成
- 生成后可通过通知中心下载，也可直接通过返回的 URL 获取
