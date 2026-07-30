# FactVerse AI Agent — Developer Architecture Guide

> 本文档面向开发者，全面介绍 FactVerse AI Agent 平台的系统架构、技术栈、模块设计与部署方案。

---

## 1. System Overview

FactVerse AI Agent 采用经典的**三层架构**，通过 Docker 容器化部署在单台 Azure VM 上：

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Vue 3 前端  │────▶│ Spring Boot  │────▶│ FastAPI AI   │
│  :3001       │     │ 后端 :8080   │     │ Engine :8000 │
└─────────────┘     └──────┬───────┘     └──────┬───────┘
                           │                     │
                    ┌──────▼───────┐      ┌──────▼───────┐
                    │ PostgreSQL   │      │    Redis     │
                    │  :5432       │      │    :6379     │
                    └──────────────┘      └──────────────┘
```

| 层级 | 技术 | 端口 | 职责 |
|------|------|------|------|
| 前端 | Vue 3 + TypeScript | 3001 | SPA 用户界面、数据可视化、多语言 |
| 后端 | Spring Boot 3.4 (Java 21) | 8080 | REST API、业务逻辑、RBAC、数据持久化 |
| AI 引擎 | FastAPI (Python 3.12) | 8000 | 仿真模拟、优化算法、AI Advisor |
| 数据库 | PostgreSQL | 5432 | 主数据存储，~165 张表 |
| 缓存 | Redis | 6379 | 会话管理、速率限制、临时数据 |

Nginx 作为反向代理统一入口，将请求路由到对应服务。所有服务运行在 Docker `deploy_default` 网络中。

---

## 2. Technology Stack

### Frontend

| 技术 | 版本/说明 |
|------|-----------|
| Vue 3 | Composition API + `<script setup>` |
| TypeScript | 严格模式 |
| Element Plus | UI 组件库 |
| ECharts | 图表与数据可视化 |
| Pinia | 状态管理 |
| vue-i18n | flatJson 模式，支持 11 种语言 |
| Vite | 构建工具 |

### Backend

| 技术 | 版本/说明 |
|------|-----------|
| Java | 21 (LTS) |
| Spring Boot | 3.4 |
| Hibernate / JPA | ORM |
| Flyway | 数据库迁移，V1–V95（95 个迁移脚本，~165 张表） |
| Spring Security | JWT 认证 + RBAC |
| Bucket4j | 速率限制 |

### AI Engine

| 技术 | 用途 |
|------|------|
| Python 3.12 | 运行时 |
| FastAPI | 异步 Web 框架 |
| SimPy | 离散事件仿真 (DES) |
| pymoo | 多目标优化 (NSGA-II) |
| pyDOE3 / SALib | 实验设计 (DOE) / 敏感性分析 (Sobol, Morris) |
| scikit-learn | 软传感器、回归模型 |
| SHAP | 模型可解释性 |
| scipy (Weibull) | 可靠性分析 |

### Infrastructure

| 组件 | 说明 |
|------|------|
| Nginx | 反向代理，SSL 终止 |
| Docker / Containerd | 容器运行时（数据盘） |
| GitHub Actions | CI/CD 流水线 |
| Docker Hub | 镜像仓库 (`jiel/factverse-*`) |

---

## 3. Project Structure

### Frontend (`frontend/src/`)

```
frontend/src/
├── views/              # 页面组件（按路由组织）
├── api/                # API 调用封装（axios 实例）
├── stores/             # Pinia 状态管理
├── modules/            # 行业模块注册与组件
│   ├── registry.ts     # 模块注册表
│   ├── register-all.ts # 统一注册入口
│   └── store.ts        # 模块启用状态管理
├── i18n/               # 多语言文件（11 种语言，flatJson 格式）
├── components/         # 通用组件
└── composables/        # 组合式函数（可复用逻辑）
```

### Backend (`backend/src/main/java/com/datamesh/agent/`)

```
com/datamesh/agent/
├── controller/         # REST 控制器
├── model/              # JPA 实体 + DTO
├── repository/         # Spring Data JPA 仓储
├── service/            # 业务逻辑层
├── advisor/            # AI Advisor 集成
├── gm/                 # GM-Compliance 模块
├── integration/        # 外部系统集成
├── security/           # JWT、RBAC、过滤器链
├── worker/             # 后台任务 / 调度任务
└── event/              # 事件发布与监听
```

### AI Engine (`ai-engine/`)

```
ai-engine/
├── routers/            # FastAPI 路由定义
├── core/               # 核心算法
│   ├── des/            # 离散事件仿真引擎
│   ├── doe/            # 实验设计
│   └── optimizer/      # 多目标优化
├── modules/            # 行业模块
│   ├── fms/            # Smart FM（报表、DOE、场景）
│   ├── trafficops/     # TrafficOps（队列仿真、预测）
│   └── heatops/        # HeatOps（MPC、DOE）
├── advisor/            # AI Advisor（工具注册与调度）
├── simulator/          # 传感器模拟器
└── reliability/        # Weibull 可靠性分析
```

---

## 4. Module Architecture

### 基础平台

所有行业模块共享的基础能力：

| 基础模块 | 说明 |
|----------|------|
| Equipment | 设备台账、层级结构、生命周期管理 |
| Alert | 告警检测、自动解除、通知分发 |
| WorkOrder | 工单创建、分配、状态流转 |
| Sensor | 传感器注册、读数采集、阈值配置 |
| Notification | 站内通知、邮件通知 |

### 行业模块

| 模块 | 说明 | 状态 |
|------|------|------|
| Smart FM | 智慧设施管理（能耗、空间、维保） | ✅ 生产 |
| TrafficOps | 交通运营（排队仿真、流量预测） | ✅ 生产 |
| HeatOps | 供热运营（MPC 控制、能耗优化） | ✅ 生产 |
| GM-Compliance | GM 合规管理 | ✅ 生产 |
| VisionOps | 视觉检测运营 | 🔧 开发中 |
| SMTOps | SMT 产线运营 | 🔧 开发中 |

### 模块启用机制

模块的启用/禁用通过 `system_config` 表的 **Module Center** 管理：

```sql
-- system_config 中的模块配置示例
key: 'module.fms.enabled'     value: 'true'
key: 'module.traffic.enabled' value: 'false'
```

### 前端模块注册模式

```typescript
// modules/registry.ts — 定义模块元数据
export interface ModuleDefinition {
  id: string;
  name: string;
  routes: RouteRecordRaw[];
  navItems: NavItem[];
}

// modules/register-all.ts — 注册所有模块
import { registerModule } from './registry';
import fmsModule from './fms';
import trafficModule from './trafficops';
registerModule(fmsModule);
registerModule(trafficModule);

// modules/store.ts — Pinia store 管理模块启用状态
// 从后端 /api/v1/system-config 获取启用列表
// 动态注入路由和导航项
```

前端根据后端返回的模块启用状态，动态加载路由和导航菜单，未启用的模块不会出现在 UI 中。

---

## 5. Data Flow

### 传感器数据流

```
传感器读数生成（AI Engine 模拟器，5 分钟周期）
        │
        ▼
   POST /ai/simulator/readings
        │
        ▼
   Spring Boot 后端接收并写入 PostgreSQL (sensor_readings)
        │
        ▼
   阈值检测 → 触发 Alert（如超阈值）
        │
        ▼
   SSE / WebSocket 推送至前端
        │
        ▼
   前端 Dashboard 实时更新图表
```

### 告警管线 (Alert Pipeline)

1. **阈值检测**：传感器读数写入时，与 `sensors.threshold_min/max` 比较
2. **告警生成**：超阈值则创建 `alerts` 记录，状态为 `ACTIVE`
3. **自动解除**：30 分钟窗口内读数恢复正常，自动将告警状态设为 `RESOLVED`
4. **通知分发**：通过 `notifications` 表 + SSE 推送至相关用户

### AI Advisor 对话流

```
用户发送消息
    │
    ▼
后端 /api/v1/advisor/chat → 转发至 AI Engine /ai/advisor/chat
    │
    ▼
AI Engine: 分析意图 → 从 60 个注册工具中选择（见 `docs/06-ai-engine/advisor-tools.md`）
    │
    ▼
执行工具（查询数据库 / 运行仿真 / 优化计算）
    │
    ▼
将工具结果 + 上下文发送至 GPT-4.1-mini
    │
    ▼
生成自然语言回复 → SSE 流式返回前端
```

---

## 6. API Design

### 路由约定

| 前缀 | 服务 | 说明 |
|------|------|------|
| `/api/v1/` | Spring Boot 后端 | 主业务 API |
| `/ai/` | FastAPI AI 引擎 | 仿真、优化、Advisor |

### 标准响应格式

后端统一使用 `ApiResponse<T>` 包装：

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

> **例外**：`FmsLiteController` 直接返回原始实体（无包装），用于轻量级嵌入场景。

### 认证与授权

- **JWT 认证**：所有 API 请求需携带 `Authorization: Bearer <token>`
- **RBAC 注解**：控制器方法使用 `@rbac.has("permission.name")` 进行权限检查
- **速率限制**：全局 2000 请求/分钟（基于 IP + 用户），通过 Bucket4j + Redis 实现

### 典型 API 示例

```
GET    /api/v1/equipment                 # 设备列表（分页）
POST   /api/v1/equipment                 # 创建设备
GET    /api/v1/sensors/{id}/readings     # 传感器读数
POST   /api/v1/alerts/{id}/acknowledge   # 确认告警
POST   /ai/advisor/chat                  # AI 对话
POST   /ai/simulator/run                 # 运行仿真
GET    /ai/optimizer/status/{taskId}     # 优化任务状态
```

---

## 7. Database Design

### 核心设计原则

- **多租户**：所有业务表包含 `tenant_id` (UUID)，查询自动过滤
- **迁移管理**：Flyway V1–V95，共 95 个迁移脚本
- **灵活配置**：`system_config` 等表使用 JSONB 存储动态字段
- **性能优化**：V94 迁移添加热查询路径索引

### 核心表结构

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `equipment` | 设备台账 | id, tenant_id, name, type, status, parent_id, metadata(JSONB) |
| `sensors` | 传感器 | id, equipment_id, type, unit, threshold_min, threshold_max |
| `sensor_readings` | 传感器读数 | id, sensor_id, value, timestamp |
| `alerts` | 告警 | id, sensor_id, severity, status, triggered_at, resolved_at |
| `work_orders` | 工单 | id, equipment_id, type, status, priority, assigned_to |
| `notifications` | 通知 | id, user_id, type, title, read, created_at |
| `system_config` | 系统配置 | id, tenant_id, key, value(JSONB) |
| `value_baseline` | 基准值 | id, sensor_id, baseline_value, period_type |

### 索引策略

```sql
-- V94 迁移：热查询路径索引
CREATE INDEX idx_sensor_readings_sensor_ts ON sensor_readings(sensor_id, timestamp DESC);
CREATE INDEX idx_alerts_tenant_status ON alerts(tenant_id, status);
CREATE INDEX idx_equipment_tenant_type ON equipment(tenant_id, type);
CREATE INDEX idx_work_orders_tenant_status ON work_orders(tenant_id, status, priority);
```

---

## 8. Security Architecture

### 认证流程

```
登录 POST /api/v1/auth/login
    │
    ▼
验证凭据 → 生成 Access Token (短期) + Refresh Token (长期)
    │
    ▼
前端存储 Token → 每次请求携带 Authorization Header
    │
    ▼
Spring Security Filter Chain:
  JwtAuthFilter → 解析 Token → 设置 SecurityContext
    │
    ▼
@rbac.has("xxx") → 检查用户角色权限
```

### RBAC 模型

```
users ──▶ user_roles ──▶ roles ──▶ role_permissions ──▶ permissions
```

| 组件 | 说明 |
|------|------|
| `roles` | 角色定义（ADMIN, MANAGER, OPERATOR, DEMO 等） |
| `permissions` | 权限点（如 `equipment.read`, `alert.acknowledge`） |
| `role_permissions` | 角色-权限映射 |
| `user_roles` | 用户-角色映射 |
| DEMO 角色 | 预置 147 个权限，用于演示环境的只读+部分写入访问 |

### 安全配置

| 项目 | 配置 |
|------|------|
| Access Token 有效期 | 短期（如 15 分钟） |
| Refresh Token 有效期 | 长期（如 7 天） |
| 速率限制 | 2000 请求/分钟/用户 |
| CORS | 配置允许的域名列表 |
| 密码存储 | BCrypt 哈希 |

---

## 9. AI Engine Architecture

### AI Advisor — 工具注册机制

Advisor 基于 **Tool-based** 架构，共注册 **60 个工具**（见 `docs/06-ai-engine/advisor-tools.md`）：

| 工具类别 | 工具示例 | 说明 |
|----------|----------|------|
| 数据查询 | query_equipment, query_sensors, query_alerts | 查询业务数据 |
| 仿真 | run_des_simulation, run_queue_simulation | 运行 DES / 排队仿真 |
| 优化 | run_optimization, run_doe | 多目标优化、实验设计 |
| 分析 | run_sensitivity, run_shap, run_reliability | 敏感性、可解释性、可靠性 |
| 预测 | forecast_traffic, predict_sensor | 流量预测、软传感器 |
| 报表 | generate_fms_report | 生成模块报表 |

调用流程：用户消息 → LLM 选择工具 → 执行工具函数 → 将结果注入上下文 → GPT-4.1-mini 生成最终回复。

### 核心算法引擎

**DES 离散事件仿真 (SimPy)**
- 建模设备运行、故障、维修等离散事件
- 支持多场景对比仿真
- 输出：利用率、等待时间、吞吐量等 KPI

**多目标优化 (pymoo NSGA-II)**
- 支持多个优化目标（如最小化成本 + 最大化效率）
- 约束处理、Pareto 前沿输出
- 支持自定义决策变量与目标函数

**实验设计 DOE (pyDOE3 / SALib)**
- Latin Hypercube Sampling、Full Factorial 等采样方法
- Sobol / Morris 全局敏感性分析
- 识别关键影响因子

**SHAP 可解释性**
- 基于 scikit-learn 模型的 SHAP 值计算
- 特征重要性排序与可视化数据输出

**Weibull 可靠性分析**
- 基于历史故障数据拟合 Weibull 分布
- 预测设备剩余寿命 (RUL)、故障概率

### 模块专用能力

| 模块 | AI 能力 |
|------|---------|
| Smart FM | 综合报表生成、能耗 DOE 分析、What-if 场景仿真 |
| TrafficOps | M/M/c 排队仿真、流量预测（时间序列）、服务台优化 |
| HeatOps | MPC 模型预测控制、供热参数 DOE、能耗优化 |

---

## 10. Deployment Architecture

### 部署拓扑

```
                    Internet
                       │
                       ▼
                ┌─────────────┐
                │    Nginx    │  (反向代理 + SSL)
                └──────┬──────┘
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ Frontend │  │ Backend  │  │AI Engine │
   │ :3001    │  │ :8080    │  │ :8000    │
   └──────────┘  └──────────┘  └──────────┘
         │             │             │
         └─────────────┴─────────────┘
              deploy_default 网络
                       │
              ┌────────┴────────┐
              ▼                 ▼
        ┌──────────┐     ┌──────────┐
        │PostgreSQL│     │  Redis   │
        └──────────┘     └──────────┘
```

### 基础设施

| 项目 | 配置 |
|------|------|
| 云平台 | Azure 单台 VM |
| 容器运行时 | Containerd（数据盘挂载） |
| Docker 网络 | `deploy_default` bridge 网络 |
| 镜像仓库 | Docker Hub (`jiel/factverse-*`) |
| CI/CD | GitHub Actions → 构建镜像 → 推送 Docker Hub |

### 部署脚本

> 部署说明：本节保留历史开发者上下文。当前生产部署以 `docs/DEPLOYMENT_SOP.md` 与 `deploy/prod-*.sh` 固定入口为准。

| 脚本 | 用途 |
|------|------|
| `deploy-fe.sh` | 底层前端部署辅助脚本，供稳定入口调用 |
| `deploy-all-3.sh` | 部署全部三个服务（前端 + 后端 + AI 引擎） |

典型部署流程：
```bash
# 推荐生产入口
ssh factverse 'cd /data/apps/factverse-ai-agent && bash deploy/prod-frontend.sh'
ssh factverse 'cd /data/apps/factverse-ai-agent && bash deploy/prod-backend.sh'

# 发布后验收
ssh factverse 'cd /data/apps/factverse-ai-agent && bash deploy/prod-verify.sh'
```

### 运维机制

| 机制 | 说明 |
|------|------|
| 健康检查 | 每 5 分钟检测各服务 `/health` 端点 |
| 数据保留 | Cron 任务定期清理过期 `sensor_readings`（保留策略可配置） |
| Golden Dataset | 快照系统，可将当前数据库状态保存为"黄金数据集"，用于演示环境重置 |
| 日志 | Docker 容器日志 + Nginx access/error log |

### Nginx 路由规则

```nginx
location / {
    proxy_pass http://frontend:3001;    # 前端 SPA
}
location /api/ {
    proxy_pass http://backend:8080;     # 后端 API
}
location /ai/ {
    proxy_pass http://ai-engine:8000;   # AI 引擎
}
```

---

## 附录：快速参考

### 本地开发端口

| 服务 | 端口 | 启动命令 |
|------|------|----------|
| Frontend | 3001 | `cd frontend && npm run dev` |
| Backend | 8080 | `cd backend && ./gradlew bootRun` |
| AI Engine | 8000 | `cd ai-engine && uvicorn main:app --port 8000` |
| PostgreSQL | 5432 | Docker / 本地安装 |
| Redis | 6379 | Docker / 本地安装 |

### 关键配置文件

| 文件 | 说明 |
|------|------|
| `frontend/.env` | 前端环境变量（API 地址等） |
| `backend/src/main/resources/application.yml` | 后端配置（数据库、JWT、Redis） |
| `ai-engine/.env` | AI 引擎配置（OpenAI key、数据库连接） |
| `nginx/nginx.conf` | Nginx 反向代理配置 |
| `docker-compose.yml` | 容器编排定义 |
