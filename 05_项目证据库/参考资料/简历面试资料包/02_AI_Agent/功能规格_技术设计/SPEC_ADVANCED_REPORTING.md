# 高级报表与可视化 — 基盘能力规格书

> **文档版本**: v2.1
> **日期**: 2026-02-11
> **更新**: 2026-04-08
> **作者**: FactVerse AI Agent Team
> **状态**: ✅ T1-T7 已实现（前端）；🔄 PDF WeasyPrint 后端待集成；⏳ T8 WebSocket 实时推送待实现  
> **状态**: Draft  

---

## 定位：基盘能力（Base Platform Capability）

高级报表与可视化是 FactVerse 平台的**基盘能力**，为所有业务模块提供统一的报表引擎、图表组件库、导出框架和实时仪表盘基础设施。

各业务模块（TrafficOps、HeatOps、FMS、GM Compliance、Energy 等）**不重复造轮子**，而是通过**模板注册机制**向基盘报表引擎注册自己的报表模板和数据源，由基盘统一渲染、导出和管理。

```
┌─────────────────────────────────────────────────────────┐
│                    基盘报表引擎                          │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐  │
│  │ 图表组件库 │ │ 导出框架  │ │实时仪表盘│ │ 模板注册中心  │  │
│  │ (ECharts) │ │(PDF/Excel)│ │ (WS)   │ │(Registry)    │  │
│  └──────────┘ └──────────┘ └────────┘ └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│  TrafficOps  │  HeatOps  │   FMS   │ GM Compliance│Energy│
│  模块报表模板 │ 模块报表模板│模块报表模板│ 模块报表模板 │模块模板│
└─────────────────────────────────────────────────────────┘
```

---

## 目录

- [第一部分：基盘报表引擎](#第一部分基盘报表引擎)
  - [1. 技术栈与架构](#1-技术栈与架构)
  - [2. 模板注册接口](#2-模板注册接口)
  - [3. 基盘图表组件](#3-基盘图表组件)
  - [4. 导出框架](#4-导出框架)
  - [5. 实时仪表盘基础设施](#5-实时仪表盘基础设施)
- [第二部分：模块报表模板](#第二部分模块报表模板)
  - [M1. TrafficOps 报表模板](#m1-trafficops-报表模板)
  - [M2. HeatOps 报表模板](#m2-heatops-报表模板)
  - [M3. FMS 报表模板](#m3-fms-报表模板)
  - [M4. GM Compliance 报表模板](#m4-gm-compliance-报表模板)
  - [M5. Energy 报表模板](#m5-energy-报表模板)
- [第三部分：基盘图表技术规格](#第三部分基盘图表技术规格)
  - [T1. 资源甘特图](#t1-资源甘特图-resource-gantt)
  - [T2. 桑基流图](#t2-桑基流图-sankey-flow)
  - [T3. 瓶颈热力图](#t3-瓶颈热力图-bottleneck-heatmap)
  - [T4. Pareto前沿图](#t4-pareto前沿图)
  - [T5. 场景对比仪表盘](#t5-场景对比仪表盘)
  - [T6. 统计报表](#t6-统计报表)
  - [T7. 导出功能](#t7-导出功能)
  - [T8. 实时仪表盘](#t8-实时仪表盘)
- [附录](#附录)

---

# 第一部分：基盘报表引擎

## 1. 技术栈与架构

### 1.1 技术选型

| 层面 | 技术选型 |
|------|----------|
| 图表库 | ECharts 5.x（通过 `vue-echarts` v7） |
| 前端框架 | Vue 3 + Composition API + TypeScript |
| 状态管理 | Pinia |
| UI 组件库 | Element Plus |
| 前端导出 | html2canvas + jsPDF + SheetJS (xlsx) |
| 后端 PDF 生成 | `ai-engine/core/reporting/` (Puppeteer / WeasyPrint) |
| 实时通信 | WebSocket (Socket.IO) |
| 样式 | TailwindCSS + CSS Variables（深色/浅色主题） |

### 1.2 目录结构

```
# ===== 前端基盘（所有模块共享） =====
frontend/src/components/reporting/
├── charts/                        # 基盘图表组件
│   ├── ResourceGantt.vue
│   ├── SankeyFlow.vue
│   ├── BottleneckHeatmap.vue
│   ├── ParetoFront.vue
│   ├── StatisticsPanel.vue
│   ├── DistributionHistogram.vue
│   ├── BoxPlotChart.vue
│   ├── QQPlot.vue
│   ├── TimeSeriesChart.vue        # 通用时序图
│   ├── ComparisonBar.vue          # 通用对比柱状图
│   └── KpiCard.vue                # 通用 KPI 卡片
├── dashboard/                     # 仪表盘框架
│   ├── ScenarioComparison.vue
│   ├── LiveDashboard.vue
│   └── DashboardLayout.vue
├── export/                        # 导出框架
│   ├── ExportToolbar.vue
│   ├── PdfReportGenerator.ts
│   └── DataExporter.ts
├── templates/                     # 模板注册与渲染
│   ├── ReportTemplateRegistry.ts  # 模板注册中心
│   ├── ReportTemplateRenderer.vue # 模板渲染器
│   └── ReportTemplatePicker.vue   # 模板选择器 UI
└── shared/                        # 共享组件
    ├── ChartContainer.vue
    ├── TimeRangeSelector.vue
    ├── FilterPanel.vue
    └── ChartTheme.ts

# ===== 各模块报表模板（各自模块目录下） =====
frontend/src/modules/traffic-ops/reporting/
├── templates/
│   ├── CheckpointUtilizationReport.vue
│   ├── PassengerFlowAnalysis.vue
│   └── SimulationComparisonReport.vue
└── index.ts                       # 注册入口

frontend/src/modules/heat-ops/reporting/
├── templates/
│   ├── StationEfficiencyReport.vue
│   ├── AnomalyInvestigationReport.vue
│   └── SeasonalAnalysis.vue
└── index.ts

frontend/src/modules/fms/reporting/
├── templates/
│   ├── WeibullReliabilityReport.vue
│   ├── RcfaInvestigationReport.vue
│   └── LccAnalysis.vue
└── index.ts

frontend/src/modules/gm-compliance/reporting/
├── templates/
│   ├── EvidencePack.vue           # 已有
│   ├── GapAnalysisReport.vue
│   └── AuditTrailReport.vue
└── index.ts

frontend/src/modules/energy/reporting/
├── templates/
│   ├── ConsumptionTrendReport.vue
│   ├── BenchmarkComparison.vue
│   └── SavingsVerificationReport.vue
└── index.ts

# ===== 后端报表服务 =====
ai-engine/core/reporting/
├── __init__.py
├── pdf_generator.py               # 服务端 PDF 生成
├── template_registry.py           # 后端模板注册
├── data_source.py                 # 数据源抽象
└── exporters/
    ├── pdf_exporter.py
    └── excel_exporter.py
```

### 1.3 Composable 库

```
frontend/src/composables/reporting/
├── useChartResize.ts              # 响应式 resize
├── useChartExport.ts              # 图表导出逻辑
├── useReportTemplate.ts           # 模板数据加载
├── useLiveUpdates.ts              # WebSocket 实时更新
└── useChartTheme.ts               # 主题切换
```

---

## 2. 模板注册接口

这是基盘报表引擎的核心扩展点。每个业务模块通过此接口注册自己的报表模板，基盘引擎负责统一管理、渲染和导出。

### 2.1 TypeScript 接口定义

```typescript
// frontend/src/components/reporting/templates/ReportTemplateRegistry.ts

/** 报表模板元信息 */
interface ReportTemplateMeta {
  /** 全局唯一 ID，格式: {module}:{templateName} */
  id: string
  /** 显示名称 */
  name: string
  /** 模板描述 */
  description: string
  /** 所属模块 */
  module: 'traffic-ops' | 'heat-ops' | 'fms' | 'gm-compliance' | 'energy' | string
  /** 模板分类（用于 UI 分组） */
  category: 'operational' | 'investigation' | 'analysis' | 'compliance' | 'comparison'
  /** 缩略图 URL（模板选择器中显示） */
  thumbnail?: string
  /** 模板版本 */
  version: string
  /** 所需权限 */
  requiredPermissions?: string[]
}

/** 数据源定义 */
interface ReportDataSource {
  /** 数据源 ID */
  id: string
  /** 显示名称 */
  name: string
  /** 数据获取函数 — 由模块实现 */
  fetcher: (params: ReportParams) => Promise<any>
  /** 参数 schema（用于生成参数表单） */
  paramSchema: ParamField[]
}

/** 参数字段定义 */
interface ParamField {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'dateRange' | 'select' | 'multiSelect'
  required: boolean
  default?: any
  options?: Array<{ label: string; value: any }>
  /** 动态选项加载（如从 API 获取设备列表） */
  optionsFetcher?: () => Promise<Array<{ label: string; value: any }>>
}

/** 报表参数（用户在 UI 中填写） */
interface ReportParams {
  dateRange?: [string, string]
  entityIds?: string[]
  filters?: Record<string, any>
  [key: string]: any
}

/** 完整的模板注册对象 */
interface ReportTemplateRegistration {
  meta: ReportTemplateMeta
  /** 报表所需的数据源列表 */
  dataSources: ReportDataSource[]
  /** Vue 组件（动态 import） */
  component: () => Promise<any>
  /** 可选：PDF 导出时的后端 endpoint（走服务端渲染） */
  serverPdfEndpoint?: string
}

/** 模板注册中心 */
class ReportTemplateRegistry {
  private templates = new Map<string, ReportTemplateRegistration>()

  /** 注册模板 */
  register(registration: ReportTemplateRegistration): void {
    const { id } = registration.meta
    if (this.templates.has(id)) {
      console.warn(`报表模板 ${id} 已存在，将被覆盖`)
    }
    this.templates.set(id, registration)
  }

  /** 批量注册 */
  registerAll(registrations: ReportTemplateRegistration[]): void {
    registrations.forEach(r => this.register(r))
  }

  /** 获取模板 */
  get(id: string): ReportTemplateRegistration | undefined {
    return this.templates.get(id)
  }

  /** 按模块列出模板 */
  listByModule(module: string): ReportTemplateRegistration[] {
    return Array.from(this.templates.values())
      .filter(t => t.meta.module === module)
  }

  /** 列出所有模板（按模块分组） */
  listGrouped(): Record<string, ReportTemplateRegistration[]> {
    const grouped: Record<string, ReportTemplateRegistration[]> = {}
    this.templates.forEach(t => {
      const mod = t.meta.module
      if (!grouped[mod]) grouped[mod] = []
      grouped[mod].push(t)
    })
    return grouped
  }

  /** 按分类列出 */
  listByCategory(category: string): ReportTemplateRegistration[] {
    return Array.from(this.templates.values())
      .filter(t => t.meta.category === category)
  }
}

// 全局单例
export const reportRegistry = new ReportTemplateRegistry()
```

### 2.2 模块注册示例

```typescript
// frontend/src/modules/traffic-ops/reporting/index.ts
import { reportRegistry } from '@/components/reporting/templates/ReportTemplateRegistry'
import { fetchCheckpointData, fetchPassengerFlowData, fetchSimComparisonData } from '../api'

reportRegistry.registerAll([
  {
    meta: {
      id: 'traffic-ops:checkpoint-utilization',
      name: '检查站利用率报表',
      description: '展示各检查站在指定时段的利用率、吞吐量和排队情况',
      module: 'traffic-ops',
      category: 'operational',
      version: '1.0.0',
    },
    dataSources: [
      {
        id: 'checkpoint-timeline',
        name: '检查站时间线数据',
        fetcher: fetchCheckpointData,
        paramSchema: [
          { key: 'dateRange', label: '时间范围', type: 'dateRange', required: true },
          { key: 'checkpointIds', label: '检查站', type: 'multiSelect', required: false,
            optionsFetcher: () => fetch('/api/traffic-ops/checkpoints').then(r => r.json()) },
        ],
      },
    ],
    component: () => import('./templates/CheckpointUtilizationReport.vue'),
  },
  // ... 其他模板
])
```

### 2.3 后端模板注册

```python
# ai-engine/core/reporting/template_registry.py

from dataclasses import dataclass, field
from typing import Callable, Any, Optional

@dataclass
class DataSourceDef:
    id: str
    name: str
    query_fn: Callable[..., Any]  # 数据查询函数
    param_schema: list[dict]

@dataclass
class ReportTemplateDef:
    id: str
    name: str
    module: str
    category: str
    data_sources: list[DataSourceDef]
    html_template: Optional[str] = None       # Jinja2 模板路径（用于服务端 PDF）
    version: str = "1.0.0"

class ReportTemplateRegistry:
    _templates: dict[str, ReportTemplateDef] = {}

    @classmethod
    def register(cls, template: ReportTemplateDef):
        cls._templates[template.id] = template

    @classmethod
    def get(cls, template_id: str) -> Optional[ReportTemplateDef]:
        return cls._templates.get(template_id)

    @classmethod
    def list_by_module(cls, module: str) -> list[ReportTemplateDef]:
        return [t for t in cls._templates.values() if t.module == module]

    @classmethod
    def generate_pdf(cls, template_id: str, params: dict) -> bytes:
        """服务端 PDF 生成：查询数据 → 渲染 HTML → 转 PDF"""
        template = cls.get(template_id)
        if not template:
            raise ValueError(f"模板不存在: {template_id}")

        # 1. 查询所有数据源
        data = {}
        for ds in template.data_sources:
            data[ds.id] = ds.query_fn(**params)

        # 2. 渲染 HTML
        from jinja2 import Environment, FileSystemLoader
        env = Environment(loader=FileSystemLoader('templates/'))
        html = env.get_template(template.html_template).render(data=data, params=params)

        # 3. HTML → PDF (WeasyPrint)
        from weasyprint import HTML
        return HTML(string=html).write_pdf()
```

---

## 3. 基盘图表组件

基盘提供以下可复用图表组件，各模块报表模板可自由组合使用：

| 组件 | 用途 | 详细规格 |
|------|------|----------|
| `ResourceGantt` | 资源/设备状态时间线 | [T1](#t1-资源甘特图-resource-gantt) |
| `SankeyFlow` | 流量流转可视化 | [T2](#t2-桑基流图-sankey-flow) |
| `BottleneckHeatmap` | 空间热力图 | [T3](#t3-瓶颈热力图-bottleneck-heatmap) |
| `ParetoFront` | 多目标优化散点 | [T4](#t4-pareto前沿图) |
| `ScenarioComparison` | 多方案对比仪表盘 | [T5](#t5-场景对比仪表盘) |
| `StatisticsPanel` | 统计汇总/直方图/箱线图/QQ图 | [T6](#t6-统计报表) |
| `TimeSeriesChart` | 通用时序折线图 | 基盘通用 |
| `ComparisonBar` | 通用对比柱状图 | 基盘通用 |
| `KpiCard` | KPI 数字卡片 | 基盘通用 |
| `ChartContainer` | 统一图表容器（loading/error/resize/全屏/导出） | 基盘通用 |

---

## 4. 导出框架

基盘统一提供三种导出能力，模块报表模板无需自行实现：

| 导出类型 | 格式 | 实现 |
|----------|------|------|
| 图表导出 | PNG / SVG | ECharts `getDataURL` |
| 数据导出 | CSV / Excel | SheetJS (xlsx) |
| 完整报告 | PDF | 前端: html2canvas + jsPDF；后端: `ai-engine/core/reporting/pdf_generator.py` |

详细技术规格见 [T7. 导出功能](#t7-导出功能)。

---

## 5. 实时仪表盘基础设施

基盘提供 WebSocket 实时数据推送框架，模块可注册自己的实时指标。详见 [T8. 实时仪表盘](#t8-实时仪表盘)。

---

# 第二部分：模块报表模板

每个模块注册自己的报表模板，复用基盘图表组件和导出框架。

## M1. TrafficOps 报表模板

| 模板 ID | 模板名称 | 分类 | 描述 | 使用的基盘组件 |
|---------|---------|------|------|--------------|
| `traffic-ops:checkpoint-utilization` | 检查站利用率报表 | operational | 各检查站在指定时段的利用率、吞吐量、排队时间分析。支持按时段/通道对比 | `ResourceGantt`, `KpiCard`, `TimeSeriesChart`, `StatisticsPanel` |
| `traffic-ops:passenger-flow` | 旅客流量分析 | analysis | 旅客在设施各区域间的流转路径分析，识别拥堵瓶颈，优化动线 | `SankeyFlow`, `BottleneckHeatmap`, `KpiCard` |
| `traffic-ops:simulation-comparison` | 仿真方案对比报表 | comparison | 2-4 个仿真方案的 KPI 并排对比，含时序曲线和 Pareto 前沿 | `ScenarioComparison`, `ParetoFront`, `ComparisonBar` |

**数据源**：
- `checkpoint-timeline`: 检查站状态时间线（复用 resource-timeline API）
- `passenger-flow`: 旅客流转数据（复用 flow-analysis API）
- `simulation-runs`: 仿真运行结果列表

**模板位置**: `frontend/src/modules/traffic-ops/reporting/templates/`

---

## M2. HeatOps 报表模板

| 模板 ID | 模板名称 | 分类 | 描述 | 使用的基盘组件 |
|---------|---------|------|------|--------------|
| `heat-ops:station-efficiency` | 换热站效率报表 | operational | 各换热站的供热效率、能耗对比、负荷率分析。支持日/周/月粒度 | `ComparisonBar`, `TimeSeriesChart`, `KpiCard`, `StatisticsPanel` |
| `heat-ops:anomaly-investigation` | 异常调查报表 | investigation | 针对温度/压力/流量异常事件的时间线回溯、根因分析和关联设备状态 | `ResourceGantt`, `TimeSeriesChart`, `KpiCard` |
| `heat-ops:seasonal-analysis` | 供暖季分析 | analysis | 整个供暖季的效率趋势、气温关联分析、同比/环比对比 | `TimeSeriesChart`, `ComparisonBar`, `StatisticsPanel` |

**数据源**：
- `station-metrics`: 换热站运行指标（温度、压力、流量、热量）
- `anomaly-events`: 异常事件记录
- `weather-correlation`: 气象关联数据

**模板位置**: `frontend/src/modules/heat-ops/reporting/templates/`

---

## M3. FMS 报表模板

| 模板 ID | 模板名称 | 分类 | 描述 | 使用的基盘组件 |
|---------|---------|------|------|--------------|
| `fms:weibull-reliability` | 设备可靠性报表 (Weibull) | analysis | 基于 Weibull 分布的设备可靠性分析，含故障率曲线、MTBF/MTTR 统计、寿命预测 | `TimeSeriesChart`, `StatisticsPanel`, `KpiCard` |
| `fms:rcfa-investigation` | RCFA 调查报表 | investigation | 根本原因失效分析报表，含故障时间线、鱼骨图数据、纠正措施追踪 | `ResourceGantt`, `TimeSeriesChart`, `KpiCard` |
| `fms:lcc-analysis` | 全寿命周期成本分析 (LCC) | analysis | 设备采购、运维、能耗、残值全寿命周期成本分析和方案对比 | `ComparisonBar`, `TimeSeriesChart`, `KpiCard`, `StatisticsPanel` |

**数据源**：
- `failure-history`: 设备故障历史记录
- `maintenance-log`: 维保记录
- `equipment-cost`: 设备成本数据（采购、备件、人工、能耗）

**模板位置**: `frontend/src/modules/fms/reporting/templates/`

---

## M4. GM Compliance 报表模板

| 模板 ID | 模板名称 | 分类 | 描述 | 使用的基盘组件 |
|---------|---------|------|------|--------------|
| `gm-compliance:evidence-pack` | 证据包 | compliance | 合规审计证据打包导出，含检查清单、照片、签字记录、整改追踪（**已有，迁移至模板体系**） | `KpiCard`, PDF 导出 |
| `gm-compliance:gap-analysis` | 差距分析报表 | analysis | 当前合规状态与目标标准的差距分析，按条款/区域/严重度维度展示 | `ComparisonBar`, `BottleneckHeatmap`, `KpiCard` |
| `gm-compliance:audit-trail` | 审计跟踪报表 | compliance | 完整的审计操作轨迹，含时间线、操作人、变更内容、审批链路 | `ResourceGantt`, `TimeSeriesChart` |

**数据源**：
- `compliance-checklist`: 合规检查清单及状态
- `audit-log`: 审计操作日志
- `evidence-store`: 证据文件存储

**模板位置**: `frontend/src/modules/gm-compliance/reporting/templates/`

---

## M5. Energy 报表模板

| 模板 ID | 模板名称 | 分类 | 描述 | 使用的基盘组件 |
|---------|---------|------|------|--------------|
| `energy:consumption-trend` | 能耗趋势报表 | operational | 各区域/设备的能耗趋势分析，支持日/周/月/年粒度，含同比/环比 | `TimeSeriesChart`, `ComparisonBar`, `KpiCard` |
| `energy:benchmark-comparison` | 能效标杆对比 | comparison | 与行业标杆、历史最优、设计值的能效对比分析 | `ComparisonBar`, `KpiCard`, `StatisticsPanel` |
| `energy:savings-verification` | 节能量核证报表 (M&V) | analysis | 基于 IPMVP 方法学的节能量测量与验证，含基线模型、调整计算、不确定度分析 | `TimeSeriesChart`, `StatisticsPanel`, `KpiCard`, `ComparisonBar` |

**数据源**：
- `energy-meters`: 能耗计量数据（电、气、水、热）
- `baseline-model`: 基线能耗模型
- `benchmark-db`: 行业标杆数据库

**模板位置**: `frontend/src/modules/energy/reporting/templates/`

---

# 第三部分：基盘图表技术规格

以下为基盘报表引擎提供的各图表组件的详细技术实现规格。模块报表模板通过组合这些组件构建自己的报表。

## 通用图表容器: `ChartContainer.vue`

```vue
<!-- src/components/reporting/shared/ChartContainer.vue -->
<template>
  <div
    ref="containerRef"
    class="chart-container"
    :class="{ 'chart-container--fullscreen': isFullscreen }"
  >
    <div class="chart-container__header">
      <h3 class="chart-container__title">{{ title }}</h3>
      <div class="chart-container__actions">
        <slot name="toolbar" />
        <el-button-group size="small">
          <el-button @click="handleExport('png')" :icon="Download">PNG</el-button>
          <el-button @click="handleExport('svg')" :icon="Download">SVG</el-button>
          <el-button @click="toggleFullscreen" :icon="FullScreen" />
        </el-button-group>
      </div>
    </div>
    <div class="chart-container__body" v-loading="loading">
      <slot v-if="!error" />
      <el-empty v-else :description="error" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Download, FullScreen } from '@element-plus/icons-vue'

const props = defineProps<{
  title: string
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  export: [format: 'png' | 'svg']
}>()

const isFullscreen = ref(false)
const containerRef = ref<HTMLElement>()

function handleExport(format: 'png' | 'svg') {
  emit('export', format)
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    containerRef.value?.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}
</script>

<style scoped>
.chart-container {
  @apply border rounded-lg bg-white dark:bg-gray-800 flex flex-col;
  min-height: 400px;
}
.chart-container__header {
  @apply flex items-center justify-between px-4 py-2 border-b;
}
.chart-container__body {
  @apply flex-1 relative min-h-0;
}
.chart-container--fullscreen {
  @apply fixed inset-0 z-50;
}
</style>
```

### 通用 Composable: `useChartResize`

```typescript
// src/composables/reporting/useChartResize.ts
import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import type { EChartsType } from 'echarts'

export function useChartResize(chartRef: Ref<EChartsType | null>) {
  const containerRef = ref<HTMLElement | null>(null)
  let resizeObserver: ResizeObserver | null = null

  onMounted(() => {
    if (containerRef.value) {
      resizeObserver = new ResizeObserver(() => {
        chartRef.value?.resize()
      })
      resizeObserver.observe(containerRef.value)
    }
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
  })

  return { containerRef }
}
```

---

## T1. 资源甘特图 (Resource Gantt)

### 1.1 功能描述

以时间线方式展示资源（设备、工位、通道等）的状态切换过程。这是基盘通用组件，可用于 TrafficOps 的检查站时间线、FMS 的设备状态追踪、HeatOps 的换热站运行状态等。

**状态类型**：
| 状态 | 颜色 | 含义 |
|------|------|------|
| `idle` | `#91CC75` 绿 | 空闲等待 |
| `busy` | `#5470C6` 蓝 | 正在处理 |
| `failed` | `#EE6666` 红 | 故障停机 |
| `maintenance` | `#FAC858` 黄 | 计划维护 |
| `shift_off` | `#999999` 灰 | 班次外 |

**交互功能**：
- X 轴缩放和平移（dataZoom）
- 按资源类型/区域筛选
- 点击某段状态弹出详情面板
- Y 轴资源列表支持折叠分组

### 1.2 数据格式

#### API 端点

```
GET /api/v1/simulations/{simId}/runs/{runId}/resource-timeline
```

**查询参数**：
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `resource_type` | string | 否 | 资源类型过滤 |
| `zone` | string | 否 | 区域过滤 |
| `time_start` | number | 否 | 时间范围起始（仿真秒） |
| `time_end` | number | 否 | 时间范围结束 |
| `page` | number | 否 | 分页页码，默认 1 |
| `page_size` | number | 否 | 每页资源数，默认 50 |

**响应格式**：

```typescript
interface ResourceTimelineResponse {
  total: number
  page: number
  pageSize: number
  simTimeRange: { start: number; end: number }
  resources: ResourceTimeline[]
}

interface ResourceTimeline {
  resourceId: string
  resourceName: string
  resourceType: string
  zone: string
  group: string
  segments: TimeSegment[]
}

interface TimeSegment {
  state: 'idle' | 'busy' | 'failed' | 'maintenance' | 'shift_off'
  start: number
  end: number
  entityId?: string
  entityType?: string
  details?: Record<string, unknown>
}
```

### 1.3 ECharts 配置

采用 **ECharts custom series** 实现，每个 segment 渲染为一个矩形。

```typescript
const STATE_COLORS: Record<string, string> = {
  idle: '#91CC75',
  busy: '#5470C6',
  failed: '#EE6666',
  maintenance: '#FAC858',
  shift_off: '#999999',
}

function buildGanttOption(data: ResourceTimeline[]): EChartsOption {
  const categories = data.map(r => r.resourceName)

  const seriesData: any[] = []
  data.forEach((resource, idx) => {
    resource.segments.forEach(seg => {
      seriesData.push({
        value: [idx, seg.start, seg.end, seg.state],
        itemStyle: { color: STATE_COLORS[seg.state] },
        segment: seg,
      })
    })
  })

  return {
    tooltip: {
      formatter(params: any) {
        const seg = params.data.segment as TimeSegment
        const duration = seg.end - seg.start
        let html = `
          <strong>${categories[params.value[0]]}</strong><br/>
          状态: ${seg.state}<br/>
          时间: ${formatSimTime(seg.start)} - ${formatSimTime(seg.end)}<br/>
          持续: ${formatDuration(duration)}
        `
        if (seg.entityId) html += `<br/>处理实体: ${seg.entityId}`
        return html
      },
    },
    grid: { left: 180, right: 40, top: 40, bottom: 80 },
    xAxis: {
      type: 'value',
      name: '仿真时间',
      axisLabel: { formatter: (val: number) => formatSimTime(val) },
      min: 0,
    },
    yAxis: {
      type: 'category',
      data: categories,
      inverse: true,
      axisLabel: { width: 160, overflow: 'truncate' },
    },
    dataZoom: [
      { type: 'slider', xAxisIndex: 0, filterMode: 'weakFilter', height: 20, bottom: 10 },
      { type: 'inside', xAxisIndex: 0, filterMode: 'weakFilter' },
      { type: 'slider', yAxisIndex: 0, filterMode: 'weakFilter', width: 20, right: 10 },
    ],
    series: [{
      type: 'custom',
      renderItem(params: any, api: any) {
        const categoryIndex = api.value(0)
        const startTime = api.coord([api.value(1), categoryIndex])
        const endTime = api.coord([api.value(2), categoryIndex])
        const barHeight = api.size([0, 1])[1] * 0.7
        return {
          type: 'rect',
          transition: ['shape'],
          shape: {
            x: startTime[0],
            y: startTime[1] - barHeight / 2,
            width: Math.max(endTime[0] - startTime[0], 1),
            height: barHeight,
          },
          style: api.style(),
        }
      },
      encode: { x: [1, 2], y: 0 },
      data: seriesData,
    }],
  }
}

function formatSimTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  return `${Math.floor(seconds / 3600)}时${Math.floor((seconds % 3600) / 60)}分`
}
```

### 1.4 Vue 组件

```vue
<!-- src/components/reporting/charts/ResourceGantt.vue -->
<template>
  <ChartContainer title="资源甘特图" :loading="loading" :error="error" @export="handleExport">
    <template #toolbar>
      <el-select v-model="filters.resourceType" placeholder="资源类型" clearable size="small" class="w-32">
        <el-option label="安检通道" value="checkpoint" />
        <el-option label="传送带" value="conveyor" />
        <el-option label="AGV" value="agv" />
        <el-option label="工位" value="station" />
      </el-select>
      <el-select v-model="filters.zone" placeholder="区域" clearable size="small" class="w-32 ml-2">
        <el-option v-for="z in availableZones" :key="z" :label="z" :value="z" />
      </el-select>
    </template>

    <v-chart ref="chartRef" :option="chartOption" :autoresize="true" class="w-full h-full" @click="handleSegmentClick" />

    <el-drawer v-model="detailVisible" title="资源状态详情" direction="rtl" size="400px">
      <template v-if="selectedSegment">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="资源">{{ selectedResource }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="stateTagType(selectedSegment.state)">{{ stateLabel(selectedSegment.state) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ formatSimTime(selectedSegment.start) }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ formatSimTime(selectedSegment.end) }}</el-descriptions-item>
          <el-descriptions-item label="持续时长">{{ formatDuration(selectedSegment.end - selectedSegment.start) }}</el-descriptions-item>
          <el-descriptions-item v-if="selectedSegment.entityId" label="处理实体">{{ selectedSegment.entityId }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
  </ChartContainer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CustomChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import ChartContainer from '../shared/ChartContainer.vue'
import { fetchResourceTimeline } from '@/api/reporting/simulationApi'
import type { ResourceTimeline, TimeSegment } from '@/api/reporting/types'

use([CustomChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer])

const props = defineProps<{ simId: string; runId: string }>()
const loading = ref(false)
const error = ref<string>()
const chartRef = ref()
const timelineData = ref<ResourceTimeline[]>([])
const filters = reactive({ resourceType: '', zone: '' })

const availableZones = computed(() => {
  const zones = new Set(timelineData.value.map(r => r.zone))
  return Array.from(zones).sort()
})

const filteredData = computed(() => {
  let result = timelineData.value
  if (filters.resourceType) result = result.filter(r => r.resourceType === filters.resourceType)
  if (filters.zone) result = result.filter(r => r.zone === filters.zone)
  return result
})

const chartOption = computed(() => buildGanttOption(filteredData.value))

const detailVisible = ref(false)
const selectedSegment = ref<TimeSegment | null>(null)
const selectedResource = ref('')

function handleSegmentClick(params: any) {
  if (params.data?.segment) {
    selectedSegment.value = params.data.segment
    selectedResource.value = filteredData.value[params.value[0]]?.resourceName ?? ''
    detailVisible.value = true
  }
}

function handleExport(format: 'png' | 'svg') {
  const url = chartRef.value?.chart?.getDataURL({ type: format, pixelRatio: 2, backgroundColor: '#fff' })
  if (url) {
    const a = document.createElement('a')
    a.href = url
    a.download = `resource-gantt.${format}`
    a.click()
  }
}

async function loadData() {
  loading.value = true
  error.value = undefined
  try {
    const resp = await fetchResourceTimeline(props.simId, props.runId)
    timelineData.value = resp.resources
  } catch (e: any) {
    error.value = e.message || '加载数据失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
watch(() => [props.simId, props.runId], loadData)
</script>
```

### 1.5 验收标准

- [x] 能正确渲染 200+ 资源、10000+ 段状态的甘特图，渲染时间 < 2s
- [x] X 轴支持鼠标滚轮缩放和拖拽平移
- [x] Y 轴支持滚动浏览大量资源
- [x] 按资源类型和区域筛选后图表正确更新
- [x] 点击状态段弹出详情抽屉
- [x] 5 种状态颜色正确区分且在深色模式下清晰可辨
- [x] 支持导出为 PNG / SVG

---

## T2. 桑基流图 (Sankey Flow)

### 2.1 功能描述

以桑基图展示实体（旅客/物料/热量等）在各功能区域间的流转情况。

- **连线宽度** = 流转量
- **连线颜色** = 平均等待时间（绿→黄→红渐变）
- 支持按时间段筛选
- 悬浮显示路径详细统计

### 2.2 数据格式

```
GET /api/v1/simulations/{simId}/runs/{runId}/flow-analysis
```

**响应格式**：

```typescript
interface FlowAnalysisResponse {
  nodes: FlowNode[]
  links: FlowLink[]
  totalEntities: number
  timeRange: { start: number; end: number }
}

interface FlowNode {
  id: string
  name: string
  zone: string
  depth?: number
  totalIn: number
  totalOut: number
  avgProcessTime: number
}

interface FlowLink {
  source: string
  target: string
  value: number
  avgWaitTime: number
  maxWaitTime: number
  minWaitTime: number
  p95WaitTime: number
}
```

### 2.3 ECharts 配置

```typescript
function waitTimeToColor(avgWait: number, maxScale: number = 300): string {
  const ratio = Math.min(avgWait / maxScale, 1)
  const r = Math.round(ratio < 0.5 ? ratio * 2 * 255 : 255)
  const g = Math.round(ratio < 0.5 ? 255 : (1 - ratio) * 2 * 255)
  return `rgb(${r}, ${g}, 60)`
}

function buildSankeyOption(data: FlowAnalysisResponse): EChartsOption {
  const maxWait = Math.max(...data.links.map(l => l.avgWaitTime), 1)

  return {
    tooltip: {
      trigger: 'item',
      formatter(params: any) {
        if (params.dataType === 'edge') {
          const link = params.data
          return `<strong>${params.name}</strong><br/>流量: ${link.value}<br/>平均等待: ${link.avgWaitTime.toFixed(1)}秒<br/>P95等待: ${link.p95WaitTime.toFixed(1)}秒`
        }
        if (params.dataType === 'node') {
          const node = data.nodes.find(n => n.name === params.name)
          return `<strong>${params.name}</strong><br/>流入: ${node?.totalIn ?? '-'}<br/>流出: ${node?.totalOut ?? '-'}<br/>平均处理时间: ${node?.avgProcessTime.toFixed(1)}秒`
        }
        return ''
      },
    },
    series: [{
      type: 'sankey',
      layout: 'none',
      emphasis: { focus: 'adjacency' },
      nodeAlign: 'left',
      nodeWidth: 20,
      nodeGap: 12,
      layoutIterations: 32,
      data: data.nodes.map(n => ({ name: n.name, itemStyle: { color: '#5470C6', borderColor: '#5470C6' } })),
      links: data.links.map(l => ({
        source: data.nodes.find(n => n.id === l.source)!.name,
        target: data.nodes.find(n => n.id === l.target)!.name,
        value: l.value,
        avgWaitTime: l.avgWaitTime,
        p95WaitTime: l.p95WaitTime,
        maxWaitTime: l.maxWaitTime,
        lineStyle: { color: waitTimeToColor(l.avgWaitTime, maxWait), opacity: 0.6 },
      })),
      label: { position: 'right', formatter: '{b}' },
    }],
  }
}
```

### 2.4 验收标准

- [x] 正确渲染区域间流转关系
- [x] 连线宽度与流量成正比，颜色反映等待时间
- [x] 按实体类型和时间范围筛选后正确更新
- [x] emphasis: adjacency 高亮相邻路径

---

## T3. 瓶颈热力图 (Bottleneck Heatmap)

### 3.1 功能描述

在 2D 设施布局上叠加热力层，以颜色强度表示各区域的拥堵/负荷程度。

- **指标选择**：利用率 / 队列长度 / 等待时间
- **时间动画**：可播放仿真时间轴
- **底图**：设施的 2D 平面布局图（SVG 或 PNG）

### 3.2 数据格式

```
GET /api/v1/simulations/{simId}/runs/{runId}/heatmap-data
```

```typescript
interface HeatmapDataResponse {
  layout: { width: number; height: number; backgroundUrl: string }
  metric: string
  timeSteps: number[]
  zones: HeatmapZone[]
}

interface HeatmapZone {
  zoneId: string
  zoneName: string
  bounds: { x: number; y: number; width: number; height: number }
  values: number[]
}
```

### 3.3 实现方案

采用 **Canvas 自定义渲染 + ECharts 覆盖层** 的混合方案：底层 Canvas 绘制设施布局底图，中层 Canvas 绘制半透明热力层，上层捕获交互事件。

支持时间轴播放（1x/2x/4x/8x 变速），鼠标悬浮显示区域名称和当前指标值。

### 3.4 验收标准

- [ ] 2D 布局底图正确加载并适配容器尺寸
- [ ] 热力层颜色正确反映所选指标
- [ ] 时间轴播放流畅，帧率 ≥ 10fps
- [ ] 3 种指标切换后正确重新加载渲染
- [ ] 支持导出当前帧为 PNG

---

## T4. Pareto前沿图

### 4.1 功能描述

散点图展示多目标优化结果，非支配前沿用连线标出并高亮。

```typescript
interface ParetoFrontResponse {
  objectives: ObjectiveInfo[]
  solutions: ParetoSolution[]
}

interface ObjectiveInfo {
  id: string; name: string; unit: string; direction: 'minimize' | 'maximize'
}

interface ParetoSolution {
  solutionId: string
  objectiveValues: Record<string, number>
  parameters: Record<string, number>
  isNonDominated: boolean
  simulationRunId?: string
}
```

### 4.2 验收标准

- [ ] 正确区分非支配解（红色大点）和被支配解（灰色小点）
- [ ] Pareto 前沿连线正确
- [ ] 可切换不同目标对作为 X/Y 轴
- [ ] 支持框选缩放

---

## T5. 场景对比仪表盘

### 5.1 功能描述

支持同时对比 2-4 个仿真场景的运行结果：KPI 对比卡片、图表同步对比、差异百分比高亮。

```typescript
interface CompareResponse {
  runs: RunSummary[]
  kpiComparison: KpiComparison[]
  timeSeriesComparison: TimeSeriesComparison[]
}

interface KpiComparison {
  kpiId: string; kpiName: string; unit: string
  direction: 'higher_better' | 'lower_better'
  values: Array<{ runId: string; value: number; ci95?: [number, number] }>
  bestRunId: string; worstRunId: string
}
```

### 5.2 验收标准

- [ ] 可选择 2-4 个方案进行对比
- [ ] KPI 卡片正确显示最优/最差颜色区分
- [ ] 基线切换后差异百分比正确更新
- [ ] 时序图正确叠加多方案曲线

---

## T6. 统计报表

### 6.1 功能描述

提供专业的统计分析视图：汇总统计表、分布直方图、箱线图、QQ图。

```typescript
interface StatisticsResponse {
  replications: number
  kpiStats: KpiStatistics[]
}

interface KpiStatistics {
  kpiId: string; kpiName: string; unit: string
  summary: {
    mean: number; std: number; min: number; max: number
    median: number; q1: number; q3: number
    ci95: [number, number]; ci99: [number, number]; n: number
  }
  replicationValues: number[]
  histogram: { bins: number[]; counts: number[] }
  qqData: { theoretical: number[]; empirical: number[]; distribution: string; ksTestP: number }
}
```

### 6.2 验收标准

- [x] 汇总表正确显示所有统计量
- [x] 直方图正确显示频率分布，均值标线位置准确
- [x] 箱线图正确展示五数概括及异常值
- [x] QQ 图散点沿对角线分布的程度正确反映分布拟合度
- [x] K-S 检验 p 值正确着色（>0.05 绿色，≤0.05 红色）

---

## T7. 导出功能

### 7.1 前端导出

#### 数据导出 (SheetJS)

```typescript
// src/components/reporting/export/DataExporter.ts
import * as XLSX from 'xlsx'

export class DataExporter {
  static exportCsv(data: Record<string, any>[], filename: string) {
    const headers = Object.keys(data[0] ?? {})
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h]
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val ?? '')
        }).join(',')
      ),
    ]
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8' })
    downloadBlob(blob, `${filename}.csv`)
  }

  static exportExcel(sheets: Array<{ name: string; data: Record<string, any>[] }>, filename: string) {
    const wb = XLSX.utils.book_new()
    sheets.forEach(sheet => {
      const ws = XLSX.utils.json_to_sheet(sheet.data)
      const colWidths = Object.keys(sheet.data[0] ?? {}).map(key => ({
        wch: Math.max(key.length, ...sheet.data.map(row => String(row[key] ?? '').length)) + 2,
      }))
      ws['!cols'] = colWidths
      XLSX.utils.book_append_sheet(wb, ws, sheet.name)
    })
    XLSX.writeFile(wb, `${filename}.xlsx`)
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

#### PDF 报告导出 (jsPDF)

```typescript
// src/components/reporting/export/PdfReportGenerator.ts
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ReportSection {
  title: string
  element: HTMLElement
  description?: string
}

export class PdfReportGenerator {
  private pdf: jsPDF
  private yOffset: number = 20
  private pageWidth: number
  private pageHeight: number
  private margin: number = 15

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.pdf.internal.pageSize.getWidth()
    this.pageHeight = this.pdf.internal.pageSize.getHeight()
  }

  addTitlePage(title: string, subtitle: string, metadata: Record<string, string>) {
    this.pdf.setFontSize(24)
    this.pdf.text(title, this.pageWidth / 2, 60, { align: 'center' })
    this.pdf.setFontSize(14)
    this.pdf.setTextColor(100)
    this.pdf.text(subtitle, this.pageWidth / 2, 75, { align: 'center' })
    this.pdf.setFontSize(10)
    let y = 100
    Object.entries(metadata).forEach(([key, value]) => {
      this.pdf.text(`${key}: ${value}`, this.margin, y)
      y += 8
    })
    this.pdf.addPage()
    this.yOffset = 20
  }

  async addChartSection(section: ReportSection) {
    if (this.yOffset > this.pageHeight - 80) {
      this.pdf.addPage()
      this.yOffset = 20
    }
    this.pdf.setFontSize(14)
    this.pdf.setTextColor(0)
    this.pdf.text(section.title, this.margin, this.yOffset)
    this.yOffset += 8
    if (section.description) {
      this.pdf.setFontSize(9)
      this.pdf.setTextColor(80)
      this.pdf.text(section.description, this.margin, this.yOffset, { maxWidth: this.pageWidth - this.margin * 2 })
      this.yOffset += 10
    }
    const canvas = await html2canvas(section.element, { scale: 2, backgroundColor: '#ffffff', logging: false })
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = this.pageWidth - this.margin * 2
    const imgHeight = (canvas.height / canvas.width) * imgWidth
    if (this.yOffset + imgHeight > this.pageHeight - this.margin) {
      this.pdf.addPage()
      this.yOffset = 20
    }
    this.pdf.addImage(imgData, 'PNG', this.margin, this.yOffset, imgWidth, imgHeight)
    this.yOffset += imgHeight + 10
  }

  addTable(title: string, headers: string[], rows: string[][]) {
    if (this.yOffset > this.pageHeight - 60) { this.pdf.addPage(); this.yOffset = 20 }
    this.pdf.setFontSize(14)
    this.pdf.text(title, this.margin, this.yOffset)
    this.yOffset += 8
    const colWidth = (this.pageWidth - this.margin * 2) / headers.length
    const rowHeight = 8
    this.pdf.setFillColor(84, 112, 198)
    this.pdf.setTextColor(255)
    this.pdf.setFontSize(8)
    headers.forEach((h, i) => {
      this.pdf.rect(this.margin + i * colWidth, this.yOffset, colWidth, rowHeight, 'F')
      this.pdf.text(h, this.margin + i * colWidth + 2, this.yOffset + 5.5)
    })
    this.yOffset += rowHeight
    this.pdf.setTextColor(0)
    rows.forEach((row, rIdx) => {
      if (this.yOffset > this.pageHeight - this.margin) { this.pdf.addPage(); this.yOffset = 20 }
      if (rIdx % 2 === 0) {
        this.pdf.setFillColor(245, 245, 245)
        this.pdf.rect(this.margin, this.yOffset, this.pageWidth - this.margin * 2, rowHeight, 'F')
      }
      row.forEach((cell, i) => { this.pdf.text(String(cell), this.margin + i * colWidth + 2, this.yOffset + 5.5) })
      this.yOffset += rowHeight
    })
    this.yOffset += 10
  }

  save(filename: string) {
    const totalPages = this.pdf.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i)
      this.pdf.setFontSize(8)
      this.pdf.setTextColor(150)
      this.pdf.text(`第 ${i} / ${totalPages} 页`, this.pageWidth / 2, this.pageHeight - 8, { align: 'center' })
      this.pdf.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, this.pageWidth - this.margin, this.pageHeight - 8, { align: 'right' })
    }
    this.pdf.save(`${filename}.pdf`)
  }
}
```

### 7.2 后端 PDF 生成

对于复杂报表或需要高保真输出的场景（如 GM Compliance 证据包），支持服务端 PDF 生成：

```python
# ai-engine/core/reporting/pdf_generator.py

from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

class ServerPdfGenerator:
    """服务端 PDF 生成器，用于复杂报表或需要签章的正式文档"""

    def __init__(self, template_dir: str = "templates/reports"):
        self.env = Environment(loader=FileSystemLoader(template_dir))

    def generate(self, template_name: str, data: dict, params: dict) -> bytes:
        """渲染 HTML 模板并转换为 PDF"""
        template = self.env.get_template(template_name)
        html_content = template.render(data=data, params=params)
        return HTML(string=html_content).write_pdf()

    def generate_to_file(self, template_name: str, data: dict, params: dict, output: Path) -> Path:
        pdf_bytes = self.generate(template_name, data, params)
        output.write_bytes(pdf_bytes)
        return output
```

### 7.3 导出工具栏

```vue
<!-- src/components/reporting/export/ExportToolbar.vue -->
<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <el-button type="primary">
      <el-icon><Download /></el-icon> 导出 <el-icon class="ml-1"><ArrowDown /></el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="png">图表导出 (PNG)</el-dropdown-item>
        <el-dropdown-item command="svg">图表导出 (SVG)</el-dropdown-item>
        <el-dropdown-item divided command="csv">数据导出 (CSV)</el-dropdown-item>
        <el-dropdown-item command="excel">数据导出 (Excel)</el-dropdown-item>
        <el-dropdown-item divided command="pdf">
          <el-icon><Document /></el-icon> 完整报告 (PDF)
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { Download, ArrowDown, Document } from '@element-plus/icons-vue'
const emit = defineEmits<{ export: [format: 'png' | 'svg' | 'csv' | 'excel' | 'pdf'] }>()
function handleCommand(command: string) { emit('export', command as any) }
</script>
```

### 7.4 验收标准

- [x] PNG 导出分辨率 ≥ 2x，中文字符不乱码
- [x] CSV 导出 UTF-8 BOM 编码
- [x] Excel 导出支持多 Sheet，列宽自适应
- [ ] PDF 报告包含标题页、图表截图、统计表格、页脚页码（WeasyPrint 后端待集成）
- [ ] 后端 PDF 生成器正常工作（WeasyPrint）
- [x] 大型图表导出不超时（< 30s）

---

## T8. 实时仪表盘

### 8.1 功能描述

基盘级实时数据推送框架，各模块可注册自己的实时指标。

- 进度条 + 预计剩余时间
- KPI 实时曲线
- KPI 数字卡片（带动画过渡）
- 告警（阈值超限提示）

### 8.2 WebSocket 协议

```
ws://{host}/api/v1/simulations/{simId}/runs/{runId}/live
```

```typescript
// 服务端推送
interface ProgressMessage { type: 'progress'; simTime: number; wallTime: number; progress: number; eta: number; speed: number }
interface KpiUpdateMessage { type: 'kpi_update'; simTime: number; kpis: Array<{ kpiId: string; kpiName: string; value: number; unit: string }> }
interface TimeSeriesPointMessage { type: 'timeseries_point'; simTime: number; metrics: Array<{ metricId: string; value: number }> }
interface AlertMessage { type: 'alert'; simTime: number; severity: 'warning' | 'critical'; message: string; metricId: string; value: number; threshold: number }
interface CompletedMessage { type: 'completed'; simTime: number; wallTime: number; summary: Record<string, number> }

type LiveMessage = ProgressMessage | KpiUpdateMessage | TimeSeriesPointMessage | AlertMessage | CompletedMessage

// 客户端发送
interface SubscribeMessage { type: 'subscribe'; kpiIds?: string[]; metricIds?: string[]; interval?: number }
interface PauseMessage { type: 'pause' | 'resume' }
```

### 8.3 Composable: `useLiveUpdates`

```typescript
// src/composables/reporting/useLiveUpdates.ts
import { ref, onUnmounted } from 'vue'
import { io, type Socket } from 'socket.io-client'

interface LiveState {
  connected: boolean; progress: number; eta: number; simTime: number; speed: number
  kpis: Map<string, { name: string; value: number; unit: string }>
  timeSeries: Map<string, Array<{ time: number; value: number }>>
  alerts: Array<{ time: number; severity: string; message: string }>
  completed: boolean
}

export function useLiveUpdates(simId: string, runId: string) {
  const state = ref<LiveState>({
    connected: false, progress: 0, eta: 0, simTime: 0, speed: 0,
    kpis: new Map(), timeSeries: new Map(), alerts: [], completed: false,
  })

  const MAX_POINTS = 500
  let socket: Socket | null = null

  function connect() {
    socket = io(`/api/v1/simulations/${simId}/runs/${runId}/live`, { transports: ['websocket'] })
    socket.on('connect', () => { state.value.connected = true; socket!.emit('message', JSON.stringify({ type: 'subscribe' })) })
    socket.on('disconnect', () => { state.value.connected = false })
    socket.on('message', (raw: string) => {
      const msg = JSON.parse(raw) as LiveMessage
      switch (msg.type) {
        case 'progress': Object.assign(state.value, { progress: msg.progress, eta: msg.eta, simTime: msg.simTime, speed: msg.speed }); break
        case 'kpi_update': msg.kpis.forEach(k => state.value.kpis.set(k.kpiId, { name: k.kpiName, value: k.value, unit: k.unit })); break
        case 'timeseries_point':
          msg.metrics.forEach(m => {
            if (!state.value.timeSeries.has(m.metricId)) state.value.timeSeries.set(m.metricId, [])
            const s = state.value.timeSeries.get(m.metricId)!
            s.push({ time: msg.simTime, value: m.value })
            if (s.length > MAX_POINTS) s.splice(0, s.length - MAX_POINTS)
          }); break
        case 'alert': state.value.alerts.push({ time: msg.simTime, severity: msg.severity, message: msg.message }); break
        case 'completed': state.value.completed = true; state.value.progress = 1; break
      }
    })
  }

  function disconnect() { socket?.disconnect(); socket = null }
  connect()
  onUnmounted(disconnect)
  return { state, disconnect }
}
```

### 8.4 性能优化

- WebSocket 消息使用 `requestAnimationFrame` 批量更新 DOM
- 时序数据限制最大点数（500点），旧数据滑窗淘汰
- ECharts 实时图表关闭动画（`animation: false`）
- KPI 数字使用 CSS `transition` 做值变化动画

### 8.5 验收标准

- [ ] WebSocket 连接状态正确指示
- [ ] 进度条实时更新，ETA 准确
- [ ] KPI 卡片值实时刷新
- [ ] 实时曲线流畅更新
- [ ] 告警及时显示
- [ ] 断线后自动重连
- [ ] 页面关闭时正确断开 WebSocket

---

# 附录

## A. API 端点汇总

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/v1/simulations/{simId}/runs/{runId}/resource-timeline` | GET | 资源甘特图数据 |
| `/api/v1/simulations/{simId}/runs/{runId}/flow-analysis` | GET | 桑基流图数据 |
| `/api/v1/simulations/{simId}/runs/{runId}/heatmap-data` | GET | 热力图数据 |
| `/api/v1/optimizations/{optId}/pareto-front` | GET | Pareto 前沿数据 |
| `/api/v1/simulations/{simId}/compare` | POST | 场景对比 |
| `/api/v1/simulations/{simId}/runs/{runId}/statistics` | GET | 统计报表数据 |
| `/api/v1/simulations/{simId}/runs` | GET | 列出运行记录 |
| `ws://.../simulations/{simId}/runs/{runId}/live` | WS | 实时仪表盘 |
| `/api/v1/reports/templates` | GET | 列出所有已注册报表模板 |
| `/api/v1/reports/generate` | POST | 服务端报表生成（PDF） |

## B. 依赖包

```json
{
  "dependencies": {
    "echarts": "^5.5.0",
    "vue-echarts": "^7.0.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.1",
    "xlsx": "^0.18.5",
    "socket.io-client": "^4.7.0"
  }
}
```

```
# Python (ai-engine/core/reporting/)
weasyprint>=60.0
jinja2>=3.1
```

## C. 里程碑计划

| 阶段 | 内容 | 预计工期 |
|------|------|----------|
| Phase 1 | 基盘报表引擎 + 模板注册中心 + 核心图表组件（Gantt/Heatmap/Stats） + 导出框架 | 3 周 |
| Phase 2 | TrafficOps + FMS 模块报表模板 + 桑基流图 + 场景对比 + 实时仪表盘 | 3 周 |
| Phase 3 | HeatOps + GM Compliance + Energy 模块报表模板 + Pareto + QQ图 + 后端 PDF | 2 周 |
| Phase 4 | 自定义仪表盘布局 + 模板 CRUD 管理 UI + 权限集成 | 1 周 |

## D. 设计规范

- 所有图表遵循 ECharts 默认主题色板，支持深色/浅色模式切换
- 图表容器最小高度 400px，全屏按钮支持 Fullscreen API
- 中文字体：系统默认（`-apple-system, "Microsoft YaHei", sans-serif`）
- 颜色语义一致：绿=好/低，红=差/高，蓝=中性/当前
- 所有数值保留 2 位小数（可配置）
- 空状态使用 Element Plus `el-empty` 组件
- 各模块报表模板位于各自模块目录下，通过 `reportRegistry.register()` 统一注册
