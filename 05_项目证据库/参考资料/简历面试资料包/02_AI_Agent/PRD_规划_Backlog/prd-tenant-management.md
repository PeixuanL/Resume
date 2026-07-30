# PRD: Tenant Management System

> Version: 1.0 | Author: SeattleBot | Date: 2026-03-13
> Status: Draft

## 1. Overview

FactVerse 平台的租户管理系统，负责租户的全生命周期管理（创建、配置、禁用、删除），以及租户级别的模块权限、品牌定制、导航配置、用户管理和配额控制。

**核心原则：** 租户管理仅对 Admin 租户（`00000000-0000-0000-0000-000000000001`）可见，其他租户完全无感知。

## 2. Architecture

### 2.1 System Layers

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Admin Tenant Only)                       │
│  /admin/tenants/*                                   │
│  ├─ TenantListView        租户列表 + 创建           │
│  ├─ TenantDetailView      租户详情 + 编辑           │
│  │   ├─ BasicInfoTab      名称/slug/状态/品牌       │
│  │   ├─ ModulesTab        模块白名单管理            │
│  │   ├─ NavConfigTab      侧边栏配置（复用现有）    │
│  │   ├─ UsersTab          租户内用户管理            │
│  │   ├─ QuotaTab          配额管理（默认不开启）    │
│  │   └─ AuditTab          数据隔离审计日志          │
│  └─ TenantCreateWizard    创建向导                  │
├─────────────────────────────────────────────────────┤
│  Backend API                                        │
│  /api/v1/admin/tenants/*                            │
│  ├─ TenantAdminController  CRUD + 模块 + 配额       │
│  ├─ TenantAdminService     业务逻辑                 │
│  ├─ TenantAuditService     审计日志                 │
│  └─ AdminTenantGuard       中间件：验证 admin 租户   │
├─────────────────────────────────────────────────────┤
│  Database                                           │
│  ├─ tenants                现有，增加字段           │
│  ├─ tenant_module_config   现有，白名单模式         │
│  ├─ tenant_customer_packages 现有                   │
│  ├─ tenant_quotas          新建，配额配置           │
│  ├─ tenant_audit_log       新建，审计日志           │
│  └─ users                  现有，租户级用户管理     │
└─────────────────────────────────────────────────────┘
```

### 2.2 Access Control

```
请求进入 → TenantFilter 解析 JWT 中的 tenant_id
         → AdminTenantGuard 检查:
           1. 请求路径是否 /api/v1/admin/**
           2. 如果是，tenant_id 必须 == ADMIN_TENANT_ID
           3. 否则返回 403 Forbidden
         → 正常 RBAC 权限检查 (@rbac.has('tenant.admin'))
```

**权限定义：**
| Permission | Description |
|---|---|
| `tenant.admin` | 租户 CRUD（创建/编辑/禁用） |
| `tenant.admin.delete` | 删除租户（危险操作，单独权限） |
| `tenant.admin.audit` | 查看审计日志 |
| `tenant.admin.quota` | 配额管理 |

## 3. Data Model

### 3.1 tenants 表（扩展）

新增字段：

| Column | Type | Default | Description |
|---|---|---|---|
| `contact_name` | varchar(100) | NULL | 租户联系人 |
| `contact_email` | varchar(200) | NULL | 联系邮箱 |
| `industry` | varchar(50) | NULL | 行业分类（manufacturing/logistics/building/...） |
| `timezone` | varchar(50) | 'UTC' | 租户时区 |
| `max_users` | int | 0 | 最大用户数（0=无限制） |
| `notes` | text | NULL | 内部备注 |
| `deleted_at` | timestamptz | NULL | 软删除时间 |

### 3.2 tenant_quotas 表（新建）

```sql
CREATE TABLE tenant_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    quota_key VARCHAR(64) NOT NULL,      -- 'max_equipment', 'max_sensors', 'max_api_calls_day', ...
    quota_value BIGINT NOT NULL DEFAULT 0,
    current_usage BIGINT NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,  -- 默认不开启
    alert_threshold NUMERIC(3,2) DEFAULT 0.80,  -- 80% 时告警
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, quota_key)
);
```

**预设 Quota Keys：**
| Key | Description | Default |
|---|---|---|
| `max_users` | 最大用户数 | 0 (unlimited) |
| `max_equipment` | 最大设备数 | 0 |
| `max_sensors` | 最大传感器数 | 0 |
| `max_api_calls_day` | 日 API 调用量 | 0 |
| `max_storage_mb` | 存储空间 MB | 0 |
| `max_ai_queries_day` | 日 AI 查询量 | 0 |

### 3.3 tenant_audit_log 表（新建）

```sql
CREATE TABLE tenant_audit_log (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    actor_id BIGINT REFERENCES users(id),
    actor_tenant_id UUID NOT NULL REFERENCES tenants(id),
    action VARCHAR(50) NOT NULL,          -- 'CREATE', 'UPDATE', 'DELETE', 'MODULE_CHANGE', 'USER_CREATE', ...
    resource_type VARCHAR(50) NOT NULL,   -- 'tenant', 'user', 'module_config', 'nav_config', 'quota', ...
    resource_id VARCHAR(100),             -- 被操作资源的 ID
    details JSONB,                        -- 变更详情 {"field": "name", "old": "...", "new": "..."}
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tenant_audit_tenant ON tenant_audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_tenant_audit_actor ON tenant_audit_log(actor_tenant_id, created_at DESC);
```

## 4. API Design

### 4.1 Tenant CRUD

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin/tenants` | 列表（支持分页、搜索、状态筛选） |
| GET | `/api/v1/admin/tenants/{id}` | 详情（含模块配置、用户数、配额） |
| POST | `/api/v1/admin/tenants` | 创建租户（含自动创建 demo 用户） |
| PUT | `/api/v1/admin/tenants/{id}` | 更新基本信息 |
| PUT | `/api/v1/admin/tenants/{id}/branding` | 更新品牌配置 |
| PUT | `/api/v1/admin/tenants/{id}/nav-config` | 更新导航配置 |
| DELETE | `/api/v1/admin/tenants/{id}` | 软删除（`deleted_at`） |
| POST | `/api/v1/admin/tenants/{id}/restore` | 恢复已删除租户 |

### 4.2 Module Config

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin/tenants/{id}/modules` | 获取租户模块配置 |
| PUT | `/api/v1/admin/tenants/{id}/modules` | 批量设置模块白名单 |
| POST | `/api/v1/admin/tenants/{id}/modules/{moduleKey}` | 启用单个模块 |
| DELETE | `/api/v1/admin/tenants/{id}/modules/{moduleKey}` | 禁用单个模块 |

### 4.3 User Management (Tenant-scoped)

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin/tenants/{id}/users` | 列出租户用户 |
| POST | `/api/v1/admin/tenants/{id}/users` | 创建用户 |
| PUT | `/api/v1/admin/tenants/{id}/users/{userId}` | 编辑用户 |
| DELETE | `/api/v1/admin/tenants/{id}/users/{userId}` | 删除用户 |
| POST | `/api/v1/admin/tenants/{id}/users/{userId}/reset-password` | 重置密码 |

### 4.4 Quota

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin/tenants/{id}/quotas` | 获取配额配置 |
| PUT | `/api/v1/admin/tenants/{id}/quotas` | 更新配额 |
| GET | `/api/v1/admin/tenants/{id}/quotas/usage` | 获取当前用量 |

### 4.5 Audit

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin/tenants/{id}/audit` | 租户审计日志 |
| GET | `/api/v1/admin/audit` | 全局审计日志（Admin 租户的所有操作） |

## 5. Create Tenant Flow

```
Admin 点击 "创建租户"
    ↓
填写表单:
  - 租户名称（必填）
  - Slug（必填，自动生成建议）
  - 行业分类（下拉选择）
  - 联系人/邮箱（可选）
  - 时区（下拉选择）
    ↓
选择模块（白名单勾选）:
  □ Smart FM (fms)
  □ Traffic Operations (trafficops)
  □ Heat Operations (heatops)
  □ Predictive Maintenance (pdm)
  □ SemiOps (semiops)
  □ VisionOps (visionops)
  □ Data Center Ops (dcops)
  □ Wayfinding (wayfinding)
  □ ... (from module registry)
    ↓
自动创建:
  1. INSERT tenants → new tenant_id
  2. INSERT tenant_module_config → 勾选的模块
  3. 生成 nav_config_json（基于模块自动隐藏未启用的组）
  4. INSERT users → demo 用户
     username: demo@{slug}.com
     password: admin123 (BCrypt)
     role: ADMIN
  5. INSERT tenant_audit_log → 'CREATE' 记录
    ↓
返回创建结果:
  - 租户 ID
  - Demo 用户凭证
  - 登录 URL
```

## 6. Module Whitelist Enforcement

**白名单逻辑（Backend）：**

```java
// TenantModuleGuard.java - Servlet Filter
@Override
protected void doFilterInternal(HttpServletRequest request, ...) {
    String path = request.getRequestURI();
    String moduleKey = extractModuleKey(path); // /api/v1/trafficops/* → "trafficops"
    
    if (moduleKey != null) {
        UUID tenantId = TenantContext.getCurrentTenant();
        if (!tenantModuleService.isModuleEnabled(tenantId, moduleKey)) {
            response.sendError(403, "Module not enabled for this tenant");
            return;
        }
    }
    filterChain.doFilter(request, response);
}
```

**白名单逻辑（Frontend）：**

```typescript
// composables/useTenantModules.ts
const enabledModules = ref<string[]>([])

// 路由守卫
router.beforeEach((to) => {
  const moduleKey = to.meta?.moduleKey
  if (moduleKey && !enabledModules.value.includes(moduleKey)) {
    return { name: 'dashboard' } // 静默重定向
  }
})

// 侧边栏过滤
const filteredSidebar = computed(() => {
  return sidebarGroups.filter(group => {
    if (group.moduleKey) return enabledModules.value.includes(group.moduleKey)
    return true // platform groups always visible
  })
})
```

## 7. Data Isolation Audit

### 7.1 Audit Points

| 触发点 | Action | 说明 |
|---|---|---|
| 创建租户 | `TENANT_CREATE` | 记录创建者、租户信息 |
| 编辑租户 | `TENANT_UPDATE` | 记录字段变更 diff |
| 禁用/启用租户 | `TENANT_STATUS_CHANGE` | 影响范围大，单独审计 |
| 删除租户 | `TENANT_DELETE` | 软删除，记录原因 |
| 模块变更 | `MODULE_ENABLE` / `MODULE_DISABLE` | 模块 key + 操作人 |
| 用户创建/删除 | `USER_CREATE` / `USER_DELETE` | 跨租户操作需审计 |
| 密码重置 | `PASSWORD_RESET` | 安全敏感操作 |
| 配额变更 | `QUOTA_UPDATE` | 记录新旧值 |
| 导航配置变更 | `NAV_CONFIG_UPDATE` | 记录 JSON diff |
| 品牌配置变更 | `BRANDING_UPDATE` | 记录变更 |

### 7.2 Cross-Tenant Access Detection

```java
// TenantFilter.java 增强
// 检测是否有请求试图访问其他租户数据
if (requestTenantId != null && !requestTenantId.equals(currentTenantId)) {
    auditService.logViolation(currentTenantId, requestTenantId, path);
    response.sendError(403, "Cross-tenant access denied");
}
```

## 8. Frontend Pages

### 8.1 TenantListView

```
┌─────────────────────────────────────────────────┐
│ 🏢 Tenant Management                    [+ New] │
├─────────────────────────────────────────────────┤
│ 🔍 Search...          Status: [All ▼]           │
├────┬──────────┬────────┬─────┬──────┬───────────┤
│ #  │ Name     │ Slug   │Users│Mods  │ Status    │
├────┼──────────┼────────┼─────┼──────┼───────────┤
│ 1  │ Default  │default │ 4   │ 4    │ 🟢 Active │
│ 2  │ ICA      │ica-demo│ 1   │ 1    │ 🟢 Active │
│ 3  │ 横河川仪  │yokogawa│ 1   │ 0    │ 🟢 Active │
└────┴──────────┴────────┴─────┴──────┴───────────┘
```

### 8.2 TenantDetailView (Tabs)

**Tab 1: Basic Info**
- 名称、Slug（创建后不可改）、行业、时区
- 联系人信息
- 状态切换（Active/Inactive）
- 内部备注

**Tab 2: Modules**
- 可用模块列表（来自模块注册中心）
- 每个模块一个开关（toggle）
- 显示模块描述和图标
- License 过期时间（可选）

**Tab 3: Navigation**
- 复用现有 NavConfigEditor 组件
- 预览侧边栏效果

**Tab 4: Branding**
- Logo 上传
- 主题色选择器
- 客户名称
- 登录页定制

**Tab 5: Users**
- 租户内用户列表
- 创建/编辑/删除用户
- 角色分配
- 密码重置

**Tab 6: Quotas**
- 配额开关（全局启用/禁用）
- 各项配额设置 + 当前用量进度条
- 告警阈值

**Tab 7: Audit Log**
- 时间线视图
- 操作类型筛选
- 操作人、IP、详情

## 9. Sidebar Visibility

**Admin 租户侧边栏增加 "System" 组下的 "Tenant Management" 条目：**

```typescript
// sidebarDefaults.ts
{
  key: 'system',
  items: [
    // ... existing items
    {
      index: '/admin/tenants',
      title: 'Tenant Management',
      icon: Building,
      permission: 'tenant.admin',
      adminTenantOnly: true,  // 新字段：只在 admin 租户显示
    }
  ]
}
```

**在 MainLayout 的侧边栏渲染中过滤：**

```typescript
const isAdminTenant = computed(() => 
  tenantId === '00000000-0000-0000-0000-000000000001'
)

// 过滤 adminTenantOnly 项
const visibleItems = items.filter(item => {
  if (item.adminTenantOnly && !isAdminTenant.value) return false
  return true
})
```

## 10. Migration Plan

### V194: tenant_quotas + tenant_audit_log + tenants 扩展

```sql
-- Extend tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contact_email VARCHAR(200);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS industry VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INT DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Tenant quotas
CREATE TABLE IF NOT EXISTS tenant_quotas ( ... );

-- Audit log
CREATE TABLE IF NOT EXISTS tenant_audit_log ( ... );

-- Seed Yokogawa module config (currently missing)
INSERT INTO tenant_module_config (tenant_id, module_key, enabled) VALUES
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'fms', true),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'pdm', true)
ON CONFLICT (tenant_id, module_key) DO NOTHING;
```

## 11. Implementation Phases

### Phase 1: Core CRUD + Guard (~3h)
- [ ] V194 Migration
- [ ] `AdminTenantGuard` filter
- [ ] `TenantAdminController` (CRUD + module config)
- [ ] `TenantAdminService` (create with demo user)
- [ ] `TenantAuditService` (basic logging)

### Phase 2: Frontend (~3h)
- [ ] `TenantListView.vue`
- [ ] `TenantDetailView.vue` (Basic Info + Modules + Users tabs)
- [ ] Sidebar entry (admin tenant only)
- [ ] Route guards

### Phase 3: Advanced Features (~2h)
- [ ] NavConfig tab (reuse NavConfigEditor)
- [ ] Branding tab
- [ ] Quota management (disabled by default)
- [ ] Audit log viewer

### Phase 4: Module Enforcement (~1h)
- [ ] `TenantModuleGuard` backend filter
- [ ] Frontend route guard by module
- [ ] Sidebar filtering by enabled modules

## 12. Available Modules Registry

| Key | Name | Description | Industry |
|---|---|---|---|
| `fms` | Smart FM | Facility Management | Building |
| `trafficops` | Traffic Operations | Immigration/Border | Government |
| `heatops` | Heat Operations | District Heating | Energy |
| `pdm` | Predictive Maintenance | Vibration/PdM | Manufacturing |
| `semiops` | SemiOps | Semiconductor Fab | Manufacturing |
| `visionops` | VisionOps | Computer Vision | Cross-industry |
| `dcops` | Data Center Ops | DC Infrastructure | IT |
| `wayfinding` | Wayfinding | Indoor Navigation | Building |
| `gm-compliance` | GM Compliance | Regulatory | Cross-industry |
| `dfslite` | DFS Lite | Data Integration | Cross-industry |

## 13. Security Considerations

1. **Admin 租户不可删除** — 硬编码保护 `00000000-...-0001`
2. **软删除优先** — `deleted_at` 而非 `DELETE FROM`
3. **密码不返回** — 创建时一次性显示，之后只能重置
4. **审计不可篡改** — `tenant_audit_log` 只有 INSERT，没有 UPDATE/DELETE 权限
5. **Cross-tenant 访问** — 所有 `/admin/tenants/{id}` 操作记录审计日志
6. **Rate limit** — 创建租户限流（防滥用）

---

**Estimated total: ~9 hours across 4 phases**
