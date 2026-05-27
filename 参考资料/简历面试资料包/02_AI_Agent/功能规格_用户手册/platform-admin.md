# 平台管理用户指南

> 面向系统管理员的模块中心、用户管理、审计日志使用手册。

---

# 模块中心

## 1. Overview — 概述

模块中心管理租户的功能模块启停：

- **基盘模块** — 所有租户默认启用（设备、告警、工单、传感器、通知等）
- **行业模块** — 按租户按需启用，由 `tenant_module_config` 控制
- **管理员租户** — 拥有所有模块，不可禁用

**导航路径：** `/module-center`

---

## 2. Module Architecture — 模块架构

### 模块分层

| 类别 | 说明 | 示例 |
|------|------|------|
| 基盘（不可禁用） | 所有租户共享的核心功能 | equipment, alerts, workorders, sensors, notifications, auth, rbac, users, advisor, workflow, dashboard, reports, dfslite, ecm |
| 行业模块（按需启用） | 按客户行业启用 | fms, energy, trafficops, heatops, semiops, dcops, visionops, wayfinding, gm-compliance, pdm, esg |
| FMS 子模块 | Smart FM 下的子功能 | chiller, iaq, elevator, parking, fire, lighting, contractor, visitor 等 |

### 模块控制机制

- **全局开关**：`system_config` 表（平台级 kill-switch）
- **租户开关**：`tenant_module_config` 表（每租户实际启停控制）
- **前端隐藏**：侧栏根据租户模块配置过滤显示
- **后端拦截**：`TenantModuleGuard` 对非授权模块 API 返回 `403 Forbidden`

---

## 3. Module Center API

**API：** `GET /api/v1/modules/available`

返回当前租户可用的模块列表（`ModuleCenterController` 返回原始 Map，非 ApiResponse 包装）。

> **注意：** 模块启停通过租户管理 API 操作，不是通过 Module Center 直接 toggle。管理员在 `/admin/tenants/{id}` 页面配置租户的模块权限。

---

# 用户管理

## 1. Overview — 概述

用户管理提供账户的创建、编辑和权限分配。

**导航路径：** `/admin` → 用户管理

---

## 2. User Management API

**基础路径：** `/api/v1/users`

| 操作 | 方法与路径 |
|------|-----------|
| 用户列表 | `GET /api/v1/users` |
| 用户详情 | `GET /api/v1/users/{id}` |
| 创建用户 | `POST /api/v1/users` |
| 删除用户 | `DELETE /api/v1/users/{id}` |
| 修改密码 | `PUT /api/v1/users/me/password` |

> **注意：** 路径是 `/api/v1/users`，不是 `/api/v1/admin/users`。

---

## 3. RBAC — 角色与权限

### 角色

| 角色 | 说明 |
|------|------|
| `ADMIN` | 系统管理员，拥有全部权限。当无 RBAC 分配时自动获得通配符 `*` |
| `OPERATOR` | 运维操作员，读写操作 |
| `VIEWER` | 只读查看者 |

### 权限模型

- 权限以 `模块:操作` 格式定义
- 使用 `@rbac.has("permission")` 检查权限（不是 `hasAuthority()`）
- ADMIN 角色在无具体权限分配时自动获得 wildcard `["*"]`

---

# 审计日志

## 1. Overview — 概述

审计日志记录所有关键操作，不可修改（append-only）。

**导航路径：** `/admin` → 审计日志

---

## 2. Audit API

**基础路径：** `/api/v1/audit`

| 操作 | 方法与路径 |
|------|-----------|
| 日志列表 | `GET /api/v1/audit/logs` |
| 按用户查询 | `GET /api/v1/audit/logs/user/{userId}` |
| 按实体查询 | `GET /api/v1/audit/logs/entity/{entityType}/{entityId}` |
| 统计概览 | `GET /api/v1/audit/stats` |
| 操作类型列表 | `GET /api/v1/audit/actions` |
| 导出 | `GET /api/v1/audit/export` |

> **注意：** 路径是 `/api/v1/audit`，不是 `/api/v1/admin/audit`。

---

# 租户管理

## 1. Overview — 概述

多租户管理功能仅限管理员租户访问。

**导航路径：** `/admin/tenants`

---

## 2. Tenant Admin API

**基础路径：** `/api/v1/admin/tenants`

| 操作 | 方法与路径 |
|------|-----------|
| 租户列表 | `GET /api/v1/admin/tenants` |
| 租户详情 | `GET /api/v1/admin/tenants/{id}` |
| 创建租户 | `POST /api/v1/admin/tenants` |
| 更新租户 | `PUT /api/v1/admin/tenants/{id}` |
| 更新品牌 | `PUT /api/v1/admin/tenants/{id}/branding` |

### 租户模块配置

每个租户通过 `tenant_module_config` 配置启用的行业模块。创建租户时自动生成 demo 用户（`demo@{slug}.com` / `admin123`）。

### 租户品牌化

每个租户可独立配置：

| 配置项 | 说明 |
|--------|------|
| `primaryColor` | 主色 |
| `accentColor` | 强调色 |
| `darkMode` | 是否启用暗色主题 |
| `appTitle` | 应用标题 |
| `logoUrl` | Logo URL |
| `faviconUrl` | Favicon URL |
