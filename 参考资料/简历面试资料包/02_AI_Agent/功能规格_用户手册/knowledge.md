# 知识图谱用户指南

> 面向工程师和运维人员的知识管理与智能推理模块使用手册。

---

## 1. Overview — 概述

知识图谱是 FactVerse 平台的 AI 基盘模块，提供：

- **多维关联** — 设备-空间-人员-告警-工单的全链路关联
- **11 个专家 Agent** — 各领域自动推理与建议
- **根因溯源** — 告警事件自动追溯根因设备和关联影响
- **自然语言查询** — 通过 AI Advisor 查询知识图谱

**导航路径：** `/knowledge`

---

## 2. Knowledge Graph Browser — 图谱浏览器

**导航路径：** `/knowledge/graph`

**API：** `GET /api/v1/knowledge/graph`

### 功能说明

- **可视化图谱**：以节点-边图形展示实体间关系
- **节点类型**：设备（Equipment）、空间（Space）、人员（Person）、告警（Alert）、规则（Rule）
- **关系类型**：位于（located_in）、维护人（maintained_by）、关联告警（triggered_alert）、影响（affects）
- **交互操作**：
  - 点击节点查看详情
  - 双击展开关联节点
  - 拖拽移动布局
  - 搜索定位特定节点

---

## 3. Knowledge Query — 知识查询

**API：** `POST /api/v1/knowledge/query`

支持多种查询方式：

| 查询方式 | 说明 | 示例 |
|---------|------|------|
| 实体查询 | 查看特定实体及其关联 | "AHU-01 的所有关联设备" |
| 路径查询 | 查找两个实体间的关联路径 | "Pump-03 到 Zone-A 的关系" |
| 影响分析 | 某设备故障的影响范围 | "Chiller-01 故障影响哪些区域" |
| 根因查询 | 从告警反向查找根因 | "Zone-B 温度告警的可能根因" |

---

## 4. Expert Agents — 专家 Agent

系统内置 11 个领域专家 Agent，自动基于知识图谱提供专业建议：

| Agent | 领域 | 能力 |
|-------|------|------|
| 暖通专家 | HVAC | 空调系统故障诊断、能效优化 |
| 电气专家 | Electrical | 电力系统分析、UPS 评估 |
| 消防专家 | Fire Safety | 消防设备检查、疏散方案 |
| 电梯专家 | Elevator | 电梯故障分析、维保建议 |
| 水务专家 | Water | 漏水检测、水质分析 |
| 能源专家 | Energy | 能耗分析、节能策略 |
| 安全专家 | Safety | 安全合规、风险评估 |
| 结构专家 | Structure | 建筑结构评估 |
| 环境专家 | Environment | 室内环境质量分析 |
| 运维专家 | Operations | 运维流程优化 |
| 通用专家 | General | 跨领域综合分析 |

---

## 5. Knowledge Statistics — 图谱统计

**API：** `GET /api/v1/knowledge/stats`

- **节点数量**：264 个实体节点
- **关系数量**：各类关系边总数
- **覆盖率**：已入图的设备占总设备比例
- **查询热度**：最常被查询的实体和关系
