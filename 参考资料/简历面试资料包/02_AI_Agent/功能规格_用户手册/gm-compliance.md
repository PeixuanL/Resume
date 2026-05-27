# GM-Compliance 用户指南

## Overview

GM-Compliance 模块用于管理 **BCA Green Mark**（新加坡建筑与建设管理局绿色建筑认证）合规流程。系统支持全部 **11/11 条款** 的完整覆盖，从条款管理、证据采集、差距分析到证据包生成，提供端到端的合规管理能力。

### 核心工作流

```
条款管理 → 证据采集 → 差距分析 → 证据包生成 → 提交审核
```

### BCA Green Mark 条款覆盖

系统完整覆盖 Green Mark 认证体系的全部 11 项条款：

| 条款编号 | 条款领域 | 说明 |
|----------|----------|------|
| GM-1 | 能源效率 | 建筑能效表现与节能措施 |
| GM-2 | 水资源效率 | 用水效率与水资源管理 |
| GM-3 | 环境保护 | 废弃物管理与环境影响控制 |
| GM-4 | 室内环境质量 | 空气质量、照明、热舒适 |
| GM-5 | 其他绿色特征 | 绿色创新与附加措施 |
| GM-6 | 可再生能源 | 可再生能源利用与碳减排 |
| GM-7 | 智能建筑运维 | 智能监控与自动化管理 |
| GM-8 | 维护管理 | 设施维护计划与执行 |
| GM-9 | 管理实践 | 绿色管理制度与人员培训 |
| GM-10 | 租户参与 | 租户绿色行为引导 |
| GM-11 | 创新与研究 | 前沿绿色技术应用 |

---

## Clause Management

### 接口

```
GET /api/v1/gm/clauses
```

### 说明

条款管理页面展示所有 Green Mark 条款的当前状态，支持查看每项条款的详细要求、合规标准及当前完成进度。

### 查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `status` | string | `all` | 过滤状态：`compliant`、`partial`、`non-compliant`、`all` |
| `category` | string | `all` | 条款类别过滤 |

### 响应示例

```json
{
  "total": 11,
  "compliant": 7,
  "partial": 3,
  "nonCompliant": 1,
  "clauses": [
    {
      "id": "GM-1",
      "name": "Energy Efficiency",
      "status": "compliant",
      "evidenceCount": 8,
      "requiredEvidenceCount": 6,
      "lastUpdated": "2026-02-17T14:30:00Z",
      "score": 95
    }
  ]
}
```

### 功能说明

- **状态概览**：顶部统计栏显示合规/部分合规/不合规的条款数量
- **进度追踪**：每项条款以进度条形式展示证据收集完成度
- **详情展开**：点击条款可展开查看子条款要求和对应证据列表
- **责任人分配**：可为每项条款指定负责人和截止日期

---

## Evidence Collection

证据采集是合规管理的核心环节，系统提供三种采集方式：

### 手动提交证据

```
POST /api/v1/gm/evidence
```

请求体示例：

```json
{
  "clauseId": "GM-1",
  "type": "measurement",
  "title": "2026年1月能效报告",
  "description": "月度建筑能耗指数（BEI）测量报告",
  "value": 115.2,
  "unit": "kWh/m²/year",
  "measuredAt": "2026-01-31T23:59:59Z"
}
```

### 文件上传

```
POST /api/v1/gm/evidence/upload
```

支持上传证据文件（PDF、图片、Excel 等）作为条款支撑材料。

| 参数 | 类型 | 说明 |
|------|------|------|
| `clauseId` | string | 关联条款编号 |
| `file` | binary | 证据文件（最大 50MB） |
| `title` | string | 证据标题 |
| `tags` | string[] | 标签，用于分类检索 |

支持格式：PDF、DOCX、XLSX、JPG、PNG、CSV

### 自动采集

```
POST /api/v1/gm/evidence/auto-collect
```

AI 引擎自动从已连接的 IoT 设备、BMS 系统和历史数据中采集符合条款要求的证据。

请求体示例：

```json
{
  "clauseIds": ["GM-1", "GM-2", "GM-4"],
  "dateRange": {
    "start": "2026-01-01T00:00:00Z",
    "end": "2026-01-31T23:59:59Z"
  },
  "sources": ["bms", "iot-sensors", "work-orders"]
}
```

响应示例：

```json
{
  "collected": 23,
  "matched": {
    "GM-1": 12,
    "GM-2": 6,
    "GM-4": 5
  },
  "pending_review": 23,
  "message": "已自动采集 23 条证据，请审核确认"
}
```

### 使用建议

- 优先使用自动采集功能，可大幅减少人工工作量
- 自动采集的证据标记为"待审核"状态，需人工确认后方可正式生效
- 对于无法自动采集的定性证据（如管理制度文件），使用文件上传方式

---

## Gap Analysis

### 接口

```
GET /api/v1/gm/gap-analysis
```

### 说明

差距分析功能由 AI 引擎自动评估当前证据与 Green Mark 各条款合规要求之间的差距，识别薄弱环节并生成改进建议。

### 查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `targetLevel` | string | `platinum` | 目标认证等级：`certified`、`gold`、`goldplus`、`platinum` |

### 响应示例

```json
{
  "targetLevel": "platinum",
  "overallScore": 82,
  "requiredScore": 90,
  "gap": 8,
  "gaps": [
    {
      "clauseId": "GM-6",
      "currentScore": 45,
      "requiredScore": 80,
      "gap": 35,
      "priority": "high",
      "missingEvidence": [
        "可再生能源发电量月度统计",
        "碳减排计算报告"
      ],
      "recommendations": [
        "安装屋顶光伏系统监测仪表，实现自动数据采集",
        "委托第三方出具年度碳排放审计报告"
      ]
    }
  ],
  "projectedTimeline": "按当前改进速度，预计 2026-05-15 可达标"
}
```

### 功能说明

- **差距可视化**：以雷达图或柱状图展示各条款的得分与目标分之间的差距
- **优先级排序**：按差距大小和改进难度综合排序，帮助用户聚焦关键改进项
- **改进建议**：每条差距附带 AI 生成的具体可执行改进建议
- **时间预测**：基于历史改进速度预测达到目标等级的时间节点

---

## Evidence Pack

### 生成证据包

```
POST /api/v1/gm/packs/generate
```

证据包是将所有合规证据打包为可提交审核的标准化文件集合。

请求体示例：

```json
{
  "name": "Green Mark Platinum 申请 - 2026Q1",
  "targetLevel": "platinum",
  "clauseIds": ["GM-1", "GM-2", "GM-3", "GM-4", "GM-5", "GM-6", "GM-7", "GM-8", "GM-9", "GM-10", "GM-11"],
  "format": ["zip", "pdf"],
  "includeGapAnalysis": true,
  "language": "en"
}
```

响应示例：

```json
{
  "packId": "pack-20260218-001",
  "status": "generating",
  "estimatedTime": "3-5 minutes",
  "message": "证据包生成中，完成后将通知您"
}
```

### 下载证据包

生成完成后，可通过以下方式下载：

**ZIP 格式**（包含所有原始证据文件）：
```
GET /api/v1/gm/packs/{packId}/download?format=zip
```

**PDF 格式**（汇总报告，含证据索引和摘要）：
```
GET /api/v1/gm/packs/{packId}/download?format=pdf
```

### 证据包内容结构

```
evidence-pack-20260218/
├── 00-summary.pdf              # 合规总结报告
├── 00-gap-analysis.pdf         # 差距分析报告（可选）
├── GM-01-energy-efficiency/
│   ├── evidence-001.pdf
│   ├── evidence-002.xlsx
│   └── index.json
├── GM-02-water-efficiency/
│   └── ...
├── ...
└── GM-11-innovation/
    └── ...
```

### 使用说明

- 建议在生成前先运行差距分析，确保所有条款证据充足
- ZIP 格式适合提交给审核机构原始文件
- PDF 格式适合内部汇报和快速审阅
- 证据包支持版本管理，可查看历史生成记录
- 生成过程为异步任务，可在通知中心查看进度
