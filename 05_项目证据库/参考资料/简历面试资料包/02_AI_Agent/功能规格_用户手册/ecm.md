# ECM 企业内容管理用户指南

> 面向文档管理员和业务用户的企业内容管理模块使用手册。

---

## 1. Overview — 概述

ECM（Enterprise Content Management）是 FactVerse 平台的基盘模块，提供：

- **文档管理** — 上传、版本控制、分类组织
- **全文搜索** — 关键字搜索文档内容
- **审批工作流** — 文档审批流程（通过 Workflow 引擎）
- **合规导出** — 合规文档打包导出

**导航路径：** `/ecm`

---

## 2. Document Management — 文档管理

### 文档列表

**API：** `GET /api/v1/ecm/documents`（支持分页和搜索）

### 文档搜索

**API：** `GET /api/v1/ecm/search?q={keyword}`

### 文档详情

**API：** `GET /api/v1/ecm/documents/{id}`

### 功能说明

- **上传文档**：支持 PDF、Word、Excel、图片等格式
- **版本控制**：每次修改自动创建新版本，可查看历史版本
- **分类管理**：按目录结构组织文档
- **元数据**：文档标签、描述、关联设备/工单

---

## 3. Workflow Integration — 工作流集成

**API：** `GET /api/v1/ecm/workflow`（ECM 工作流，由 WorkflowController 统一管理）

ECM 的文档审批通过平台统一的 Workflow 引擎实现：

- 提交文档审批
- 多级审批流转
- 审批历史记录

> **注意：** 工作流 API 的主路径是 `/api/v1/workflow`，ECM 特定的工作流路径是 `/api/v1/ecm/workflow`。

---

## 4. Compliance Export — 合规导出

**API：** `GET /api/v1/ecm/compliance/export`

将合规相关文档打包导出，用于审计和监管报告。

---

## 5. Workspace — 工作空间

**API：** `GET /api/v1/ecm/workspace`

个人文档工作空间，查看最近编辑、待审批、收藏的文档。
