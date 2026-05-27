# DataMesh业财一体化PMS功能设计说明书（FSD）

| 属性 | 内容 |
|---|---|
| 版本 | V1.0 |
| 日期 | 2026-04-17 |
| 作者 | DataMesh产品技术团队 |
| 状态 | 初稿 |

---

## 变更历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| V1.0 | 2026-04-17 | DataMesh产品技术团队 | 首次发布 |

---

## 第一章 系统概述

### 1.1 项目背景

DataMesh是一家专注于企业级数字孪生平台的高科技公司，其核心业务涵盖数字孪生交付项目（EPMS）和定制化项目实施（PMS）两大类。

随着业务规模扩大，公司面临的核心痛点包括：
- **业务侧**：项目工时靠手工Excel统计，人工成本归集滞后，项目利润率算不清楚
- **财务侧**：业务数据无法自动生成财务凭证，财务与业务数据不同步
- **管理层**：经营看板数据T+1，无法实时看到项目利润和现金流

本系统定位为"业财一体化项目管理平台（PMS）"，实现从商机到回款的业财数据闭环。

### 1.2 设计目标

| 目标 | 说明 |
|------|------|
| **灵活性** | 模块化设计，财务凭证推送规则/提成规则/预警规则均可配置，新增财务系统只需实现适配器 |
| **可用性** | 业务零缝隙，工时填报→成本归集→凭证生成全链路自动化 |
| **可扩展性** | 支撑未来3年200→2000用户的业务增长，支持分库分表 |
| **兼容性强** | 同时支持用友/金蝶/浪潮/SAP等多种财务系统，通过适配器模式实现 |

### 1.3 设计原则

- **高内聚低耦合**：每个微服务职责单一，服务间通过API和消息通信，不直接操作对方数据库
- **开闭原则**：对扩展开放，对修改封闭。新增财务系统只需实现适配器，不改核心代码
- **配置大于编码**：业务规则（日费率公式/提成比例/预警阈值）均可后台配置，不硬编码
- **事件驱动**：业务事件（工时提交/里程碑达成）通过消息队列异步驱动下游流程
- **CQRS读写分离**：复杂查询（经营看板/报表）走ClickHouse分析库，事务操作走MySQL主库

### 1.4 核心术语定义

| 术语 | 英文 | 定义 |
|------|------|------|
| 人天 | Man-Day | 一个人工作一天的计量单位 |
| 工时 | Man-Hour | 实际工作时间的记录 |
| 日费率 | Daily Rate | 员工日均人工成本 = 月薪 ÷ 22天 |
| 收入确认 | Revenue Recognition | 按照合同里程碑达成情况确认营业收入 |
| 合同负债 | Contract Liability | 收到预付款时尚不能确认收入的负债 |
| 里程碑付款 | Milestone Payment | 按项目关键节点分阶段支付的付款方式 |
| 成本归集 | Cost Accumulation | 将各项成本计入对应项目的过程 |
| WBS | Work Breakdown Structure | 工作分解结构，将项目分解为可管理的工作单元 |
| DDD | Domain-Driven Design | 领域驱动设计，通过限界上下文划分系统边界 |
| CQRS | Command Query Responsibility Segregation | 命令查询职责分离，读写分离架构 |
| Saga | Saga Pattern | 跨服务长事务的最终一致性模式 |
| DRY | Don't Repeat Yourself | 不要重复自己，抽象复用公共逻辑 |

### 1.5 参考文档

- 《DataMesh业财一体化PMS产品需求说明书（PRD）》V1.0

---

## 第二章 系统架构设计

### 2.1 总体架构

本系统采用5层架构设计，从上到下依次为：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DataMesh业财一体化PMS                           │
│                        总体架构（5层分层 + 基础设施）                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     接入层（API Gateway）                         │   │
│  │   Web端(Vue3) │ 移动端(Uni-app) │ 开放API │ 第三方集成(钉钉/飞书)   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                       │                                 │
│                                       ▼                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     网关层（Spring Cloud Gateway）                │   │
│  │        统一认证 │ 限流熔断 │ 路由转发 │ 日志审计 │ 链路追踪          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                       │                                 │
│                                       ▼                                 │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │  销售域   │  交付域   │  财务域   │  采购域   │   HR域    │   BI域   │   │
│  │ (CRM)    │  (PMS)   │  (FIN)   │  (PUR)   │  (HR)    │  (BI)   │   │
│  │          │          │          │          │          │          │   │
│  │ 商机管理  │ 项目管理  │ 合同台账  │ 供应商管理 │ 员工管理  │ 经营看板 │   │
│  │ 报价单    │ WBS工时  │ 应收应付  │ 采购订单  │ 日费率   │ 现金流   │   │
│  │ 销售漏斗  │ 成本归集  │ 发票管理  │ 采购入库  │ 考勤工时  │ 预警中心 │   │
│  │ 销售预测  │ 验收交付  │ 收入确认  │ 采购对账  │ 绩效提成  │ 报表中心 │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘   │
│                                       │                                 │
│                                       ▼                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     领域能力层（Domain Layer）                    │   │
│  │   合同引擎 │ 工时引擎 │ 成本引擎 │ 预算引擎 │ 凭证引擎 │ 绩效引擎   │   │
│  │   规则引擎 │ 消息总线 │ 适配器层 │ 分析引擎                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                       │                                 │
│                                       ▼                                 │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │  MySQL   │  Redis   │   ES     │ ClickHouse│  Kafka   │  MinIO   │   │
│  │  (OLTP)  │  (Cache) │ (Search) │  (OLAP)  │  (MQ)    │  (OSS)   │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘   │
│                                       │                                 │
│                                       ▼                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      基础设施层（Infra Layer）                   │   │
│  │        Docker │ K8s │ ELK │ SkyWalking │ Prometheus │ Grafana   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

**架构特点**：
- 接入层与网关层解耦，网关承担横切关注点
- 应用域按业务能力划分，每个域独立演化
- 领域能力层承载核心业务逻辑，对上层提供服务
- 数据层按用途选择合适存储（关系/缓存/搜索/分析）
- 基础设施层提供运维支撑，与业务代码无关

### 2.2 微服务划分

| 服务名 | 职责 | API数量 | 依赖服务 |
|--------|------|---------|----------|
| crm-service | 销售域：客户/商机/报价单 | ~25 | auth-service |
| contract-service | 合同域：合同/里程碑管理 | ~15 | crm-service, fin-service |
| project-service | 交付域：项目/WBS/工时 | ~30 | hr-service, contract-service |
| fin-service | 财务域：收入/成本/凭证 | ~20 | project-service, adapter-service |
| cost-service | 成本域：成本归集/分摊 | ~15 | project-service, hr-service |
| budget-service | 预算域：公司/部门/项目预算 | ~15 | fin-service |
| hr-service | HR域：员工/日费率/考勤 | ~20 | auth-service |
| purchase-service | 采购域：供应商/采购/入库 | ~20 | project-service |
| perf-service | 绩效域：提成/奖金/考核 | ~15 | hr-service, project-service, fin-service |
| bi-service | BI域：经营看板/报表/预警 | ~10 | 所有业务服务 |
| gateway-service | 网关：认证/限流/路由 | - | 所有服务 |
| adapter-service | 适配器：财务系统对接 | - | fin-service |
| system-service | 系统管理：权限/配置/日志 | ~25 | auth-service |

**服务间通信模式**：
- 同步调用：OpenFeign（服务间API调用）
- 异步事件：Kafka（业务事件解耦）
- 配置同步：Nacos（统一配置中心）
- 服务注册：Nacos（服务发现）

### 2.3 扩展性设计策略

**水平扩展**：
- 无状态服务（gateway/contract/project等）：直接加Pod副本
- 有状态服务（MySQL/Redis/Kafka）：通过K8s HPA按CPU/内存自动扩缩

**垂直扩展**：
- 数据库按业务域分库（CRM库/PMS库/FIN库）
- 大表按时间或tenant_id分表（prj_man_hour按月分表，crm_lead按租户分表）
- 分析库ClickHouse单表可承载10亿级数据

**热插拔模块**：
- 每个微服务独立部署单元，新增财务系统只需新增adapter-service实现
- WebHook事件总线支持业务方自定义插件，无需修改核心代码

### 2.4 高可用设计策略

**L0核心链路**（不允许降级）：
- 用户登录/工时填报/审批流

**L1重要链路**（允许延迟降级）：
- 成本计算/收入确认/凭证生成

**L2辅助链路**（可临时关闭）：
- 经营看板/报表中心/销售预测

**降级策略**：
- 财务凭证推送失败 → 存入本地队列 → 稍后重试 → 告警通知财务人员手动处理
- 成本计算超时 → 返回"计算中"状态 → 后台异步重算

**多活架构**：
- 同城双活（主备机房），RPO=0，RTO<30s
- 数据层MySQL半同步复制，确保主备数据一致性

---

## 第三章 技术架构设计

### 3.1 总体技术架构

#### 3.1.1 架构概览

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DataMesh 业财一体化平台 技术架构                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              接入层 (Access Layer)                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │   │
│  │  │ Web端    │  │ 移动端   │  │ 开放API  │  │ 企业微信  │  │   钉钉/飞书      │ │   │
│  │  │ Vue3     │  │ Uni-app  │  │ REST/gRPC│  │ 企业集成  │  │   组织集成       │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                              │
│                                          ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              网关层 (Gateway Layer)                             │   │
│  │              Spring Cloud Gateway / Kong  │  统一认证  │  限流  │  路由         │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              服务层 (Service Layer)                               │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │   │
│  │  │  销售域服务    │  │  交付域服务    │  │  财务域服务    │  │  公共域服务    │  │   │
│  │  │  crm-service   │  │  pm-service    │  │  fi-service    │  │  sys-service   │  │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘  │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │   │
│  │  │  采购域服务    │  │  预算域服务    │  │  消息服务      │  │  文件服务      │  │   │
│  │  │  pm-service    │  │  budget-service │  │  msg-service   │  │  file-service  │  │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              数据层 (Data Layer)                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │   │
│  │  │   MySQL     │  │   Redis     │  │ Elasticsearch│  │   Kafka     │             │   │
│  │  │  主数据库    │  │   缓存      │  │   搜索引擎   │  │  消息队列   │             │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                               │   │
│  │  │  ClickHouse │  │   MinIO     │  │   TiDB      │                               │   │
│  │  │  分析数据库  │  │  对象存储   │  │ 分库分表    │                               │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                               │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              支撑层 (Support Layer)                             │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐ │   │
│  │  │  Nacos       │ │  Sentinel    │ │  SkyWalking  │ │  ELK + Prometheus      │ │   │
│  │  │  注册配置中心 │ │  限流熔断    │ │  链路追踪    │ │  日志与监控           │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.1.2 技术栈总览

| 层级 | 技术选型 | 版本要求 | 用途说明 |
|------|----------|----------|----------|
| **前端框架** | Vue 3 | 3.4+ | 组合式API，TypeScript支持 |
| | TypeScript | 5.0+ | 类型安全，IDE友好 |
| | Vite | 5.0+ | 快速构建，热更新 |
| | Pinia | 2.1+ | 状态管理 |
| | Ant Design Vue | 4.x | 企业级UI组件 |
| **移动端** | Uni-app | 3.x | 跨平台移动端 |
| **后端框架** | Java | 17+ | LTS版本 |
| | Spring Boot | 3.2+ | 核心框架 |
| | Spring Cloud Alibaba | 2023.x | 微服务生态 |
| **持久层** | MyBatis-Plus | 3.5+ | ORM增强，支持分库分表 |
| | ShardingSphere | 5.4+ | 数据库中间件 |
| **缓存** | Redis | 7.0+ | 分布式缓存/锁 |
| **搜索引擎** | Elasticsearch | 8.x | 全文检索，聚合分析 |
| **消息队列** | Apache Kafka | 3.6+ | 高吞吐事件流 |
| **对象存储** | MinIO | RELEASE.2024 | 对象存储服务 |
| **分析数据库** | ClickHouse | 24.x | OLAP分析 |
| **注册配置** | Nacos | 2.2+ | 服务发现，配置管理 |
| **链路追踪** | SkyWalking | 9.x | 分布式追踪 |
| **容器化** | Docker | 24.x | 容器化部署 |
| | Kubernetes | 1.28+ | 容器编排 |

---

### 3.2 前端技术方案

#### 3.2.1 技术选型对比

| 维度 | Vue 3 + Element Plus | Vue 3 + Ant Design Vue | React + Ant Design |
|------|----------------------|------------------------|-------------------|
| 学习曲线 | 中等 | 中等 | 较高 |
| 组件丰富度 | 一般 | 丰富（企业级） | 丰富 |
| TypeScript支持 | 良好 | 良好 | 良好 |
| 移动端适配 | 需额外处理 | 需额外处理 | 需额外处理 |
| 社区生态 | 活跃 | 活跃 | 最活跃 |
| 适用场景 | 后台管理系统 | 企业级SaaS | 大型复杂应用 |
| **最终选择** | | **✓** | |

**选型理由：**
1. Ant Design Vue组件库针对企业级应用场景有更好的开箱即用支持
2. 与现有DataMesh技术栈保持一致
3. 组件设计风格符合国内企业用户习惯
4. 社区活跃，文档完善

#### 3.2.2 前端项目结构

```
pms-web/
├── public/                    # 静态资源
├── src/
│   ├── api/                   # API接口定义
│   │   ├── modules/
│   │   │   ├── crm.ts        # 销售域API
│   │   │   ├── pm.ts         # 交付域API
│   │   │   ├── fi.ts         # 财务域API
│   │   │   └── sys.ts        # 系统API
│   │   └── index.ts
│   ├── assets/                # 静态资源
│   │   ├── images/
│   │   └── styles/
│   ├── components/            # 公共组件
│   │   ├── common/           # 通用组件
│   │   ├── business/          # 业务组件
│   │   └── charts/            # 图表组件
│   ├── composables/           # 组合式函数
│   │   ├── useProject.ts
│   │   ├── useQuotation.ts
│   │   └── useCost.ts
│   ├── directives/            # 自定义指令
│   ├── layouts/               # 布局组件
│   ├── pages/                 # 页面
│   │   ├── crm/              # 销售域页面
│   │   ├── pm/               # 交付域页面
│   │   ├── fi/               # 财务域页面
│   │   └── dashboard/        # 经营看板
│   ├── router/                # 路由配置
│   ├── stores/                # Pinia状态管理
│   │   ├── user.ts
│   │   ├── project.ts
│   │   └── cost.ts
│   ├── types/                 # TypeScript类型定义
│   │   ├── api.d.ts
│   │   ├── project.d.ts
│   │   └── cost.d.ts
│   ├── utils/                 # 工具函数
│   │   ├── request.ts        # Axios封装
│   │   ├── auth.ts           # 认证工具
│   │   └── format.ts         # 格式化工具
│   ├── App.vue
│   └── main.ts
├── .env.production            # 生产环境配置
├── .env.staging               # 预发布配置
├── vite.config.ts
├── tsconfig.json
└── package.json
```

#### 3.2.3 核心代码示例

**1. Axios请求封装**

```typescript
// src/utils/request.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import router from '@/router';

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;
    
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败');
      
      if (res.code === 401) {
        // Token过期，跳转登录
        const userStore = useUserStore();
        userStore.logout();
        router.push('/login');
      }
      
      return Promise.reject(new Error(res.message));
    }
    
    return res;
  },
  (error) => {
    ElMessage.error(error.message || '网络错误');
    return Promise.reject(error);
  }
);

export default service;
```

**2. 状态管理示例**

```typescript
// src/stores/project.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getProjectList, getProjectDetail, createProject } from '@/api/modules/pm';

export interface Project {
  id: number;
  projectNo: string;
  projectName: string;
  projectType: number;
  status: number;
  contractAmount: number;
  budgetTotalCost: number;
  actualTotalCost: number;
  profit: number;
}

export const useProjectStore = defineStore('project', () => {
  // State
  const projects = ref<Project[]>([]);
  const currentProject = ref<Project | null>(null);
  const loading = ref(false);
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
  });

  // Getters
  const projectMap = computed(() => {
    return new Map(projects.value.map(p => [p.id, p]));
  });

  const executingProjects = computed(() => {
    return projects.value.filter(p => p.status === 2);
  });

  // Actions
  async function fetchProjects(params?: any) {
    loading.value = true;
    try {
      const { data, total } = await getProjectList({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...params,
      });
      projects.value = data;
      pagination.value.total = total;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProjectDetail(id: number) {
    loading.value = true;
    try {
      const data = await getProjectDetail(id);
      currentProject.value = data;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function createNewProject(params: Partial<Project>) {
    const result = await createProject(params);
    projects.value.unshift(result);
    return result;
  }

  return {
    // State
    projects,
    currentProject,
    loading,
    pagination,
    // Getters
    projectMap,
    executingProjects,
    // Actions
    fetchProjects,
    fetchProjectDetail,
    createNewProject,
  };
});
```

**3. ECharts图表封装**

```typescript
// src/components/charts/ProfitTrend.vue
<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';

interface Props {
  data: {
    month: string;
    income: number;
    cost: number;
    profit: number;
  }[];
}

const props = defineProps<Props>();
const chartRef = ref<HTMLElement>();
let chartInstance: ECharts | null = null;

function initChart() {
  if (!chartRef.value) return;
  
  chartInstance = echarts.init(chartRef.value);
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: ['收入', '成本', '利润'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: props.data.map(d => d.month),
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `${(value / 10000).toFixed(1)}万`,
      },
    },
    series: [
      {
        name: '收入',
        type: 'bar',
        stack: 'total',
        data: props.data.map(d => d.income),
        itemStyle: { color: '#5470C6' },
      },
      {
        name: '成本',
        type: 'bar',
        stack: 'total',
        data: props.data.map(d => -d.cost),
        itemStyle: { color: '#EE6666' },
      },
      {
        name: '利润',
        type: 'line',
        data: props.data.map(d => d.profit),
        itemStyle: { color: '#91CC75' },
        smooth: true,
      },
    ],
  };
  
  chartInstance.setOption(option);
}

onMounted(() => {
  initChart();
  window.addEventListener('resize', () => chartInstance?.resize());
});

onUnmounted(() => {
  chartInstance?.dispose();
});

watch(() => props.data, initChart, { deep: true });
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 400px;
}
</style>
```

#### 3.2.4 移动端技术方案

采用Uni-app实现跨平台移动端，支持iOS和Android：

**移动端功能范围：**
- 工时填报（日报/周报）
- 项目审批待办
- 消息通知
- 经营数据查看

---

### 3.3 后端技术方案

#### 3.3.1 技术选型对比

| 维度 | Spring Boot 2.7 | Spring Boot 3.2 | Spring Framework 6 |
|------|-----------------|-----------------|-------------------|
| Java版本 | Java 8-17 | Java 17+ | Java 17+ |
| 性能 | 良好 | 优秀 | 优秀 |
| 响应式支持 | 一般 | 优秀 | 优秀 |
| 社区生态 | 成熟 | 成熟 | 成熟 |
| 第三方兼容 | 优秀 | 良好 | 良好 |
| **最终选择** | | **✓** | |

**选型理由：**
1. Java 17 LTS提供更好的性能和新特性支持
2. Spring Boot 3.2对GraalVM原生编译有更好支持
3. 与Spring Cloud 2023版本兼容
4. Jakarta EE 9+带来更现代的API

#### 3.3.2 微服务架构设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           微服务架构设计                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           基础设施层                                 │   │
│  │  Nacos (注册/配置) │ Sentinel (限流熔断) │ SkyWalking (链路追踪)    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           网关层                                     │   │
│  │                    Spring Cloud Gateway                             │   │
│  │              统一入口 │ 认证鉴权 │ 限流 │ 路由 │ 日志                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           服务层                                     │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐   │   │
│  │  │ crm-service │  │ pm-service  │  │ fi-service  │  │sys-service│   │   │
│  │  │ 销售域      │  │ 交付域      │  │ 财务域      │  │ 公共域    │   │   │
│  │  │ 端口:8081   │  │ 端口:8082   │  │ 端口:8083   │  │ 端口:8080 │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘   │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐   │   │
│  │  │budget-svc  │  │ file-service│  │ msg-service │  │report-svc │   │   │
│  │  │ 预算域      │  │ 文件服务    │  │ 消息服务    │  │ 报表服务  │   │   │
│  │  │ 端口:8084   │  │ 端口:8085   │  │ 端口:8086   │  │ 端口:8087 │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.3.3 项目工程结构

```
pms-backend/
├── pom.xml                          # 父POM
├── config/
│   └── application.yml              # 主配置文件
├── pms-common/                      # 公共模块
│   ├── pom.xml
│   └── src/main/java/com/datamesh/pms/common/
│       ├── annotation/              # 自定义注解
│       ├── config/                  # 公共配置
│       ├── constant/                # 常量定义
│       ├── exception/              # 异常定义
│       ├── result/                 # 统一返回
│       └── util/                   # 工具类
├── pms-gateway/                     # 网关服务
├── pms-sys/                         # 系统服务
├── pms-crm/                         # 销售域服务
├── pms-pm/                          # 交付域服务
└── pms-fi/                          # 财务域服务
```

#### 3.3.4 核心代码示例

**1. 统一返回结果封装**

```java
// pms-common/result/Result.java
package com.datamesh.pms.common.result;

import lombok.Data;
import java.io.Serializable;

@Data
public class Result<T> implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private int code;
    private String message;
    private T data;
    private long timestamp;
    
    public static <T> Result<T> success() {
        return success(null);
    }
    
    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMessage("操作成功");
        result.setData(data);
        result.setTimestamp(System.currentTimeMillis());
        return result;
    }
    
    public static <T> Result<T> error(String message) {
        return error(500, message);
    }
    
    public static <T> Result<T> error(int code, String message) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMessage(message);
        result.setTimestamp(System.currentTimeMillis());
        return result;
    }
}
```

**2. MyBatis-Plus配置与使用**

```yaml
# application.yml
mybatis-plus:
  mapper-locations: classpath*:/mapper/**/*.xml
  type-aliases-package: com.datamesh.pms.**.entity
  configuration:
    map-underscore-to-camel-case: true
  global-config:
    db-config:
      id-type: auto
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0
```

```java
// Mapper接口示例
@Mapper
public interface ProjectMapper extends BaseMapper<Project> {
    
    // 分页查询项目中成本超支的记录
    IPage<Project> selectOverBudgetProjects(IPage<Project> page, @Param("threshold") BigDecimal threshold);
}

// Service层使用
@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {
    
    private final ProjectMapper projectMapper;
    
    @Override
    public IPage<ProjectVO> getProjectList(ProjectQueryDTO query) {
        IPage<Project> page = new Page<>(query.getPage(), query.getPageSize());
        IPage<Project> result = projectMapper.selectOverBudgetProjects(page, query.getThreshold());
        
        return result.convert(this::convertToVO);
    }
}
```

**3. 分布式事务处理**

使用Seata AT模式处理跨服务事务：

```java
// 工时提交 -> 成本计算 -> 凭证生成 事务链
@GlobalTransactional(name = "labor-submit-tx", rollbackFor = Exception.class)
public void submitLaborAndGenerateVoucher(LaborSubmitDTO submitDTO) {
    // 1. 提交工时
    laborService.submitLabor(submitDTO);
    
    // 2. 触发成本计算（异步）
    costCalculationProducer.sendCostCalcEvent(submitDTO);
    
    // 3. 触发凭证生成（异步）
    voucherGenerationProducer.sendVoucherEvent(submitDTO);
}
```

#### 3.3.5 Spring Cloud Alibaba组件配置

```yaml
# application.yml - Nacos配置
spring:
  cloud:
    nacos:
      discovery:
        server-addr: ${NACOS_HOST:localhost}:8848
        namespace: ${NACOS_NAMESPACE:pms-prod}
        group: PMS_GROUP
      config:
        server-addr: ${spring.cloud.nacos.discovery.server-addr}
        file-extension: yml
        shared-configs:
          - data-id: common.yml
            group: COMMON_GROUP
            refresh: true

# Sentinel配置
  sentinel:
    eager: true
    transport:
      dashboard: ${SENTINEL_HOST:localhost}:8858

# Seata配置
seata:
  enabled: true
  tx-service-group: pms_tx_group
  config:
    type: nacos
```

---

### 3.4 数据库架构设计

#### 3.4.1 数据库选型对比

| 数据库 | 适用场景 | 优点 | 缺点 | 容量规划 |
|--------|----------|------|------|----------|
| MySQL 8.0 | OLTP主库 | 成熟稳定，事务完整 | 大数据量性能下降 | 10TB以内单表 |
| TiDB | 分库分表扩展 | MySQL兼容，水平扩展 | 运维复杂 | PB级 |
| ShardingSphere | 分库分表中间件 | 兼容性好，改动小 | 跨分片查询弱 | 按需扩展 |
| ClickHouse | OLAP分析 | 高吞吐列式存储 | 不支持事务 | 按需扩展 |
| **最终方案** | MySQL主库 + ClickHouse分析 + 分库分表扩展 | | | |

**容量规划：**
- 单表数据量 < 1000万：MySQL单表
- 单表数据量 1000-5000万：MySQL分区表
- 单表数据量 > 5000万：ShardingSphere分库分表
- 分析报表需求：ClickHouse同步

#### 3.4.2 数据库架构图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              数据库架构设计                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          应用层 (Application)                           │   │
│  │                     MyBatis-Plus / ShardingSphere                       │   │
│  └────────────────────────────────┬────────────────────────────────────────┘   │
│                                   │                                           │
│  ┌────────────────────────────────┼────────────────────────────────────────┐   │
│  │                         数据访问层 (DAL)                                │   │
│  │                          ShardingSphere Proxy                          │   │
│  └────────────────────────────────┬────────────────────────────────────────┘   │
│                                   │                                           │
│  ┌────────────────────────────────┼────────────────────────────────────────┐   │
│  │                          分片规则设计                                    │   │
│  │                                                                           │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │   │
│  │  │  CRM域分片       │    │  PM域分片       │    │  FI域分片       │      │   │
│  │  │  表: crm_*      │    │  表: pm_*       │    │  表: fi_*       │      │   │
│  │  │  键: customer_id│    │  键: project_no │    │  键: org_id    │      │   │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘      │   │
│  │                                                                           │   │
│  └────────────────────────────────┬────────────────────────────────────────┘   │
│                                   │                                           │
│  ┌────────────────────────────────┼────────────────────────────────────────┐   │
│  │                          分片节点集群                                    │   │
│  │                                                                           │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │   │
│  │  │ MySQL Node-1    │  │ MySQL Node-2    │  │ MySQL Node-N    │        │   │
│  │  │ (主库)          │  │ (从库)          │  │ (分片)          │        │   │
│  │  │ 3306            │  │ 3306            │  │ 3306            │        │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘        │   │
│  │                                                                           │   │
│  └────────────────────────────────┬────────────────────────────────────────┘   │
│                                   │                                           │
│  ┌────────────────────────────────┼────────────────────────────────────────┐   │
│  │                          分析层 (ClickHouse)                            │   │
│  │                                                                           │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │ ClickHouse集群 (3节点)                                          │    │   │
│  │  │ - 经营分析宽表                                                   │    │   │
│  │  │ - 项目利润分析                                                   │    │   │
│  │  │ - 销售预测汇总                                                   │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.4.3 分库分表策略

```yaml
# ShardingSphere分片配置
spring:
  shardingsphere:
    rules:
      sharding:
        tables:
          # 工时记录表，按项目分片
          pm_labor_record:
            actual-data-nodes: ds_${0..3}.pm_labor_record_${project_id % 4}
            table-strategy:
              standard:
                sharding-column: project_id
                sharding-algorithm-name: project_inline
            
          # 成本明细表，按组织分片
          fi_cost_detail:
            actual-data-nodes: ds_${0..3}.fi_cost_detail_${org_id % 4}
            table-strategy:
              standard:
                sharding-column: org_id
                sharding-algorithm-name: org_inline
```

#### 3.4.4 ClickHouse分析表设计

```sql
-- 经营分析宽表
CREATE TABLE pms.fi_project_analysis_daily (
    stat_date Date,
    project_id UInt64,
    project_no String,
    project_name String,
    project_type UInt8,
    customer_id UInt64,
    customer_name String,
    
    -- 收入数据
    contract_amount Decimal(18,2),
    confirmed_revenue Decimal(18,2),
    
    -- 成本数据
    labor_cost Decimal(18,2),
    outsource_cost Decimal(18,2),
    other_cost Decimal(18,2),
    total_cost Decimal(18,2),
    
    -- 利润数据
    profit Decimal(18,2),
    profit_rate Decimal(8,4),
    
    -- 时间戳
    created_at DateTime
) ENGINE = ReplacingMergeTree(created_at)
PARTITION BY toYYYYMM(stat_date)
ORDER BY (stat_date, project_id);
```

---

### 3.5 缓存架构设计

#### 3.5.1 Redis架构设计

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Redis缓存架构                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          应用层 (Application)                           │   │
│  │                    RedisTemplate / Spring Cache                         │   │
│  └────────────────────────────────┬────────────────────────────────────────┘   │
│                                   │                                           │
│  ┌────────────────────────────────┼────────────────────────────────────────┐   │
│  │                          缓存服务层                                     │   │
│  │                    Redis Cluster (3主6从)                              │   │
│  │                         端口: 6379                                      │   │
│  └────────────────────────────────┬────────────────────────────────────────┘   │
│                                   │                                           │
│  ┌────────────────────────────────┼────────────────────────────────────────┐   │
│  │                          缓存节点                                       │   │
│  │                                                                           │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                                   │   │
│  │  │ Master1 │ │ Master2 │ │ Master3 │  (分片1/2/3)                       │   │
│  │  │  :6379  │ │  :6379  │ │  :6379  │                                   │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘                                   │   │
│  │       │          │          │                                         │   │
│  │  ┌────┴────┐┌────┴────┐┌────┴────┐                                    │   │
│  │  │ Slave1  ││ Slave2  ││ Slave3  │  (高可用副本)                        │   │
│  │  └─────────┘└─────────┘└─────────┘                                    │   │
│  │                                                                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.5.2 多级缓存策略

```java
// 多级缓存实现
@Service
@RequiredArgsConstructor
public class ProjectCacheService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    
    // 本地缓存（Caffeine）
    private final Cache<String, ProjectVO> localCache = Caffeine.newBuilder()
        .maximumSize(1000)
        .expireAfterWrite(5, TimeUnit.MINUTES)
        .build();
    
    private static final String PROJECT_KEY = "pms:project:";
    
    /**
     * 三级缓存读取
     */
    public ProjectVO getProject(Long projectId) {
        String cacheKey = PROJECT_KEY + projectId;
        
        // 1. 本地缓存
        ProjectVO local = localCache.getIfPresent(cacheKey);
        if (local != null) {
            return local;
        }
        
        // 2. Redis缓存
        ProjectVO redis = (ProjectVO) redisTemplate.opsForValue().get(cacheKey);
        if (redis != null) {
            localCache.put(cacheKey, redis);
            return redis;
        }
        
        // 3. 数据库查询
        ProjectVO db = projectMapper.selectById(projectId);
        if (db != null) {
            redisTemplate.opsForValue().set(cacheKey, db, 30, TimeUnit.MINUTES);
            localCache.put(cacheKey, db);
        }
        
        return db;
    }
    
    /**
     * 缓存失效
     */
    public void invalidateProject(Long projectId) {
        String cacheKey = PROJECT_KEY + projectId;
        localCache.invalidate(cacheKey);
        redisTemplate.delete(cacheKey);
    }
}
```

#### 3.5.3 缓存Key设计规范

| 缓存类型 | Key格式 | 过期时间 | 说明 |
|----------|---------|----------|------|
| 用户Token | `pms:token:{userId}` | 2小时 | Session管理 |
| 用户信息 | `pms:user:{userId}` | 30分钟 | 用户详情缓存 |
| 项目详情 | `pms:project:{projectId}` | 30分钟 | 项目基本信息 |
| 项目列表 | `pms:project:list:{hash}` | 5分钟 | 分页列表缓存 |
| 工时汇总 | `pms:project:{projectId}:labor:summary:{month}` | 1小时 | 月度工时汇总 |
| 成本汇总 | `pms:project:{projectId}:cost:summary:{month}` | 1小时 | 月度成本汇总 |
| 字典数据 | `pms:dict:{type}` | 24小时 | 字典项缓存 |
| 部门信息 | `pms:org:{orgId}` | 1小时 | 组织架构缓存 |

#### 3.5.4 热点数据缓存方案

工时填报是高频操作，需要特别优化：

```java
// 工时填报热点缓存
@Service
@Slf4j
public class LaborHotCacheService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    
    // 热点Key识别：单个项目月工时超过100条记录
    private static final int HOT_THRESHOLD = 100;
    
    public List<LaborRecordVO> getLaborRecords(Long projectId, String month) {
        String key = String.format("pms:labor:%d:%s", projectId, month);
        
        Object cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            return (List<LaborRecordVO>) cached;
        }
        
        List<LaborRecordVO> records = laborMapper.selectByProjectAndMonth(projectId, month);
        
        // 判断是否为热点数据，提前缓存
        if (records.size() > HOT_THRESHOLD) {
            log.info("热点工时数据 detected: projectId={}, month={}, count={}", 
                     projectId, month, records.size());
            long ttl = 6 * 60 + new Random().nextInt(60);
            redisTemplate.opsForValue().set(key, records, ttl, TimeUnit.MINUTES);
        }
        
        return records;
    }
}
```

#### 3.5.5 Redis集群配置

```yaml
# Redis集群配置
spring:
  redis:
    cluster:
      nodes:
        - ${REDIS_HOST:localhost}:6379
        - ${REDIS_HOST:localhost}:63791
        - ${REDIS_HOST:localhost}:63792
        - ${REDIS_HOST:localhost}:63793
        - ${REDIS_HOST:localhost}:63794
        - ${REDIS_HOST:localhost}:63795
    password: ${REDIS_PASSWORD:}
    timeout: 3000ms
    lettuce:
      pool:
        max-active: 200
        max-idle: 50
        min-idle: 10
        max-wait: 3000ms
```

---

### 3.6 消息队列架构设计

#### 3.6.1 消息队列选型对比

| 特性 | Apache Kafka | RocketMQ | RabbitMQ |
|------|--------------|----------|----------|
| 单机QPS | 百万级 | 十万级 | 万级 |
| 吞吐量 | 极高 | 高 | 中 |
| 消息持久化 | 支持 | 支持 | 支持 |
| 事务消息 | 需自实现 | 原生支持 | 不支持 |
| 适用场景 | 日志/大数据 | 交易/财务 | 轻量级任务 |
| **最终选择** | **✓ (主消息队列)** | **✓ (可靠消息)** | |

**选型理由：**
1. Kafka的高吞吐适合工时提交等高并发场景
2. RocketMQ的事务消息适合业财凭证推送
3. 两者结合满足不同业务场景需求

#### 3.6.2 Kafka Topic设计

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Kafka Topic架构设计                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          Topic设计（按业务域划分）                       │   │
│  │                                                                         │   │
│  │  销售域 (CRM)                                                           │   │
│  │  ├── prod.crm.lead.created            商机创建                         │   │
│  │  ├── prod.crm.lead.stage-changed      商机阶段变更                     │   │
│  │  ├── prod.crm.quotation.approved      报价审批通过                     │   │
│  │  └── prod.crm.contract.signed         合同签约                         │   │
│  │                                                                         │   │
│  │  交付域 (PM)                                                            │   │
│  │  ├── prod.pm.project.created          项目创建                         │   │
│  │  ├── prod.pm.project.milestone        里程碑达成                       │   │
│  │  ├── prod.pm.labor.submitted          工时提交                         │   │
│  │  ├── prod.pm.labor.approved           工时审批                         │   │
│  │  └── prod.pm.task.completed           任务完成                         │   │
│  │                                                                         │   │
│  │  财务域 (FI)                                                            │   │
│  │  ├── prod.fi.cost.calculated         成本计算完成                      │   │
│  │  ├── prod.fi.revenue.confirmed        收入确认                         │   │
│  │  ├── prod.fi.voucher.generated        凭证生成                         │   │
│  │  └── prod.fi.invoice.issued           发票开具                         │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.6.3 Kafka核心配置

```yaml
# Kafka配置
spring:
  kafka:
    bootstrap-servers: ${KAFKA_HOSTS:localhost:9092}
    producer:
      acks: all
      retries: 3
      batch-size: 16384
      properties:
        enable.idempotence: true
    consumer:
      group-id: pms-consumer-group
      auto-offset-reset: earliest
      enable-auto-commit: false
      max-poll-records: 500
    listener:
      ack-mode: MANUAL_IMMEDIATE
      concurrency: 3
```

#### 3.6.4 消息生产者实现

```java
// Kafka消息生产者
@Service
@RequiredArgsConstructor
@Slf4j
public class LaborEventProducer {
    
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    public void sendLaborSubmitEvent(LaborSubmitEvent event) {
        String topic = "prod.pm.labor.submitted";
        String key = event.getProjectId() + "_" + event.getSubmitMonth();
        
        kafkaTemplate.send(topic, key, event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("工时提交事件发送失败: eventId={}", event.getEventId(), ex);
                } else {
                    log.info("工时提交事件发送成功: eventId={}", event.getEventId());
                }
            });
    }
}
```

#### 3.6.5 消息消费者实现

```java
// 成本计算消费者
@Service
@Slf4j
public class CostCalculationConsumer {
    
    private final CostCalculationService costService;
    
    @KafkaListener(
        topics = "prod.pm.labor.approved",
        groupId = "pms-cost-calculation-group"
    )
    public void consumeLaborApprovedEvent(ConsumerRecord<String, LaborApproveEvent> record) {
        LaborApproveEvent event = record.value();
        log.info("收到工时审批通过事件: eventId={}, projectId={}", 
                 event.getEventId(), event.getProjectId());
        
        try {
            CostCalculationResult result = costService.calculateProjectCost(
                event.getProjectId(), 
                event.getRecordMonth()
            );
            log.info("成本计算完成: projectId={}, totalCost={}", 
                     event.getProjectId(), result.getTotalCost());
        } catch (Exception e) {
            log.error("成本计算失败: eventId={}", event.getEventId(), e);
            throw e;
        }
    }
}
```

#### 3.6.6 事件驱动架构示例

**工时提交 → 成本计算 → 财务凭证生成 全链路异步化：**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        事件驱动架构示例（业财一体化链路）                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  员工提交工时                                                                   │
│       │                                                                         │
│       ▼                                                                         │
│  ┌─────────────┐                                                               │
│  │ PM服务      │  LaborSubmitEvent                                             │
│  │ 记录工时    │───────────────────┐                                           │
│  └─────────────┘                   │                                           │
│                                    ▼                                           │
│                           ┌─────────────────┐                                  │
│                           │ Kafka Topic     │                                  │
│                           │ prod.pm.labor.  │                                  │
│                           │ submitted       │                                  │
│                           └────────┬────────┘                                  │
│                                    │                                           │
│       ┌───────────────────────────┼───────────────────────────┐               │
│       │                           │                           │                │
│       ▼                           ▼                           ▼                │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐          │
│  │ 通知服务    │           │ 成本计算服务 │           │ 日志服务    │          │
│  │ 发送待审批  │           │ 计算人工成本 │           │ 记录操作日志│          │
│  │ 通知        │           │ 成本归集    │           │             │          │
│  └─────────────┘           └──────┬──────┘           └─────────────┘          │
│                                   │                                           │
│                                   ▼                                           │
│                           ┌─────────────────┐                                  │
│                           │ 财务服务        │                                  │
│                           │                 │                                  │
│                           │ 1.确认成本      │                                  │
│                           │ 2.生成凭证      │◄───── RocketMQ事务消息           │
│                           │ 3.推送财务系统  │                                  │
│                           └─────────────────┘                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.6.7 消息幂等性设计

```java
// 消息幂等处理
@Service
@RequiredArgsConstructor
public class IdempotentService {
    
    private final RedisTemplate<String, String> redisTemplate;
    
    private static final String IDEMPOTENT_KEY_PREFIX = "pms:idempotent:";
    private static final long IDEMPOTENT_EXPIRE_SECONDS = 86400;
    
    public boolean checkAndSet(String messageId) {
        String key = IDEMPOTENT_KEY_PREFIX + messageId;
        Boolean result = redisTemplate.opsForValue()
            .setIfAbsent(key, "1", IDEMPOTENT_EXPIRE_SECONDS, TimeUnit.SECONDS);
        return !Boolean.TRUE.equals(result);
    }
}
```

#### 3.6.8 消息积压监控

```java
// 消息积压监控与处理
@Service
@Slf4j
public class KafkaLagMonitor {
    
    @Scheduled(fixedRate = 60000)
    public void checkConsumerLag() {
        // 获取所有Topic的积压情况
        Map<String, Map<KafkaPartition, OffsetAndMetadata>> consumerOffsets = getConsumerOffsets();
        
        for (Map.Entry<String, Map<KafkaPartition, OffsetAndMetadata>> entry : consumerOffsets.entrySet()) {
            String topic = entry.getKey();
            
            for (Map.Entry<KafkaPartition, OffsetAndMetadata> offsetEntry : entry.getValue().entrySet()) {
                int partition = offsetEntry.getKey().partition();
                long currentOffset = offsetEntry.getValue().offset();
                long latestOffset = getLatestOffset(topic, partition);
                long lag = latestOffset - currentOffset;
                
                if (lag > 10000) {
                    log.warn("消息积压告警: topic={}, partition={}, lag={}", topic, partition, lag);
                    alertService.sendLagAlert(topic, partition, lag);
                }
            }
        }
    }
}
```

---

### 3.7 文件存储架构设计

#### 3.7.1 对象存储选型对比

| 特性 | MinIO | 阿里云OSS | 腾讯云COS | AWS S3 |
|------|-------|-----------|-----------|--------|
| 部署方式 | 私有化部署 | 云服务 | 云服务 | 云服务 |
| 成本 | 开源免费 | 按量付费 | 按量付费 | 按量付费 |
| 数据主权 | 完全可控 | 需信任云厂商 | 需信任云厂商 | 需信任云厂商 |
| S3兼容 | 原生支持 | 支持 | 支持 | 原生支持 |
| **最终选择** | **✓** | | | |

**选型理由：**
1. 数据完全私有化，符合DataMesh数据安全要求
2. S3协议兼容，方便后续迁移
3. 支持多租户和桶级别隔离

#### 3.7.2 MinIO存储架构

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MinIO对象存储架构                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    桶策略设计 (Bucket Policy)                            │   │
│  │                                                                   │   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │   │
│  │  │ pms-contract │  │  pms-invoice │  │  pms-project │          │   │   │
│  │  │ 合同附件     │  │ 发票扫描件   │  │ 项目文档     │          │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │   │
│  │                                                                   │   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │   │
│  │  │  pms-logs    │  │  pms-backup  │  │  pms-temp    │          │   │   │
│  │  │ 操作日志     │  │ 数据备份     │  │ 临时文件     │          │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │   │
│  │                                                                   │   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.7.3 桶策略设计

| 桶名称 | 用途 | 存储内容 | 访问权限 | 生命周期 |
|--------|------|----------|----------|----------|
| pms-contract | 合同附件 | 合同扫描件、补充协议 | 内部访问 | 永久保留 |
| pms-invoice | 发票管理 | 发票扫描件、收据 | 财务+管理员 | 7年（合规） |
| pms-project | 项目文档 | 需求文档、设计文档、交付物 | 项目成员 | 项目结束+2年 |
| pms-logs | 日志归档 | 操作日志、系统日志 | 仅系统 | 90天 |
| pms-backup | 数据备份 | 数据库备份、配置备份 | 仅管理员 | 30天 |
| pms-temp | 临时存储 | 上传临时文件、分片文件 | 上传用户 | 24小时自动清理 |

#### 3.7.4 文件服务实现

```java
// 文件上传服务
@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {
    
    private final MinioClient minioClient;
    
    private static final Map<String, String> BUCKET_MAP = Map.of(
        "contract", "pms-contract",
        "invoice", "pms-invoice",
        "project", "pms-project",
        "temp", "pms-temp"
    );
    
    /**
     * 普通文件上传
     */
    public FileUploadVO uploadFile(MultipartFile file, String category, Long projectId) {
        try {
            String bucket = BUCKET_MAP.getOrDefault(category, "pms-project");
            String objectName = generateObjectName(category, file.getOriginalFilename());
            
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build()
            );
            
            // 生成访问URL（预签名URL，有效期1小时）
            String url = minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .expiry(3600)
                    .build()
            );
            
            return FileUploadVO.builder()
                .fileName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .url(url)
                .build();
                
        } catch (Exception e) {
            log.error("文件上传失败: category={}", category, e);
            throw new BusinessException("文件上传失败");
        }
    }
    
    private String generateObjectName(String category, String fileName) {
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String uuid = UUID.randomUUID().toString().replace("-", "");
        String ext = getFileExtension(fileName);
        return String.format("%s/%s/%s%s", category, datePath, uuid, ext);
    }
}
```

---

### 3.8 日志与监控架构设计

#### 3.8.1 日志收集架构

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ELK日志收集架构                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  应用服务日志                                                                   │
│       │                                                                         │
│       ▼                                                                         │
│  ┌─────────────┐                                                               │
│  │ Filebeat    │  轻量级日志收集器                                             │
│  │ (每台主机)  │  读取日志文件 → 转发至Logstash                                │
│  └──────┬──────┘                                                               │
│         │                                                                       │
│         ▼                                                                       │
│  ┌─────────────┐                                                               │
│  │ Logstash    │  日志解析过滤                                                 │
│  │ (3节点集群) │  格式化JSON → 结构化处理                                      │
│  └──────┬──────┘                                                               │
│         │                                                                       │
│         ▼                                                                       │
│  ┌─────────────┐                                                               │
│  │ Elasticsearch│  日志存储索引                                                │
│  │ (3节点集群) │  分布式存储检索                                               │
│  └──────┬──────┘                                                               │
│         │                                                                       │
│         ▼                                                                       │
│  ┌─────────────┐                                                               │
│  │ Kibana      │  日志可视化分析                                               │
│  └─────────────┘                                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.8.2 日志规范

```yaml
# 日志配置
logging:
  level:
    root: INFO
    com.datamesh.pms: DEBUG
  pattern:
    file: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] [%X{traceId}] %-5level %logger{36} - %msg%n"
  file:
    name: /var/log/pms/application.log
    max-size: 100MB
    max-history: 30
```

#### 3.8.3 链路追踪设计

使用SkyWalking实现分布式链路追踪：

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SkyWalking链路追踪架构                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    分布式调用链                                          │   │
│  │                                                                         │   │
│  │  Web ───► Gateway ───► CRM ───► MySQL                                   │   │
│  │    │                    │                                               │   │
│  │    │                    └──► PM ───► Redis ───► Kafka                   │   │
│  │    │                               │                                    │   │
│  │    │                               └──► FI ───► 外部财务系统             │   │
│  │                                                                         │   │
│  │  全链路TraceId自动传播                                                  │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.8.4 监控告警设计

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Prometheus + Grafana监控架构                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          指标采集层                                      │   │
│  │                                                                         │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │   │
│  │  │ 应用JVM指标    │  │ Spring Boot    │  │ 业务自定义     │            │   │
│  │  │ (micrometer)  │  │ Actuator       │  │ 指标埋点       │            │   │
│  │  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘            │   │
│  │          └───────────────────┼───────────────────┘                      │   │
│  │                              ▼                                          │   │
│  │                    ┌─────────────────┐                                   │   │
│  │                    │ Prometheus      │                                   │   │
│  │                    │ (指标收集器)    │                                   │   │
│  │                    └────────┬────────┘                                   │   │
│  │                             │                                            │   │
│  │          ┌─────────────────┼─────────────────┐                        │   │
│  │          ▼                 ▼                 ▼                        │   │
│  │   ┌────────────┐    ┌────────────┐    ┌────────────┐                   │   │
│  │   │ 企业微信    │    │  邮件      │    │  短信      │                   │   │
│  │   │ 告警通知   │    │  告警通知  │    │  告警通知  │                   │   │
│  │   └────────────┘    └────────────┘    └────────────┘                   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.8.5 核心监控指标

| 指标类型 | 指标名称 | 告警阈值 | 说明 |
|----------|----------|----------|------|
| **基础设施** | | | |
| | CPU使用率 | > 80% 持续5分钟 | 资源告警 |
| | 内存使用率 | > 85% 持续5分钟 | 资源告警 |
| | 磁盘使用率 | > 90% | 资源告警 |
| **应用健康** | | | |
| | 服务可用率 | < 99.9% | SLA告警 |
| | 平均响应时间 | > 500ms | 性能告警 |
| | P99响应时间 | > 2000ms | 性能告警 |
| | 错误率 | > 1% | 错误告警 |
| **中间件** | | | |
| | MySQL连接数 | > 80%最大连接 | 连接告警 |
| | Redis内存使用 | > 75% | 内存告警 |
| | Kafka消费积压 | > 10000条 | 积压告警 |
| **业务指标** | | | |
| | 工时提交成功率 | < 99% | 业务告警 |
| | 成本计算延迟 | > 5分钟 | 业务告警 |
| | 凭证生成失败率 | > 0.1% | 业务告警 |

---

### 3.9 安全技术方案

#### 3.9.1 认证授权架构

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OAuth2 + JWT认证授权架构                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  用户登录请求                                                                   │
│       │                                                                         │
│       ▼                                                                         │
│  ┌─────────────┐                                                               │
│  │  认证服务   │  OAuth2 + JWT                                                │
│  │  Auth Server │  颁发AccessToken + RefreshToken                              │
│  └──────┬──────┘                                                               │
│         │                                                                       │
│         ▼                                                                       │
│  ┌─────────────┐                                                               │
│  │  Token存储   │  Redis集群存储Token                                          │
│  │             │  支持主动失效                                                 │
│  └──────┬──────┘                                                               │
│         │                                                                       │
│         ▼                                                                       │
│  ┌─────────────┐                                                               │
│  │  网关鉴权   │  验证JWT签名                                                  │
│  │  Gateway    │  检查Token有效性                                             │
│  │             │  提取用户信息注入请求                                         │
│  └──────┬──────┘                                                               │
│         │                                                                       │
│         ▼                                                                       │
│  ┌─────────────┐                                                               │
│  │  权限校验   │  RBAC权限模型                                                │
│  │  各微服务   │  接口级别权限控制                                             │
│  │             │  数据级别权限过滤                                             │
│  └─────────────┘                                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.9.2 JWT Token配置

```java
// JWT配置
@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    private String secret;
    private long accessTokenExpire = 120;  // 分钟
    private long refreshTokenExpire = 7;    // 天
}

@Service
@RequiredArgsConstructor
public class TokenService {
    
    private final JwtProperties jwtProperties;
    private final RedisTemplate<String, Object> redisTemplate;
    
    public String createAccessToken(SysUser user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("userName", user.getUserName());
        claims.put("orgId", user.getOrgId());
        claims.put("roles", user.getRoles());
        
        return Jwts.builder()
            .setClaims(claims)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + 
                jwtProperties.getAccessTokenExpire() * 60 * 1000))
            .signWith(Keys.hmacShaKeyFor(
                Base64.getDecoder().decode(jwtProperties.getSecret())))
            .compact();
    }
    
    public Claims parseToken(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(Keys.hmacShaKeyFor(
                Base64.getDecoder().decode(jwtProperties.getSecret())))
            .build()
            .parseClaimsJws(token)
            .getBody();
    }
}
```

#### 3.9.3 接口幂等性设计

```java
// 全局幂等性拦截器
@Component
@RequiredArgsConstructor
public class IdempotentInterceptor implements HandlerInterceptor {
    
    private final RedisTemplate<String, String> redisTemplate;
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                          HttpServletResponse response, 
                          Object handler) throws Exception {
        
        String idempotentKey = request.getHeader("X-Idempotent-Key");
        if (StringUtils.isEmpty(idempotentKey)) {
            return true;
        }
        
        String fullKey = "pms:idempotent:" + idempotentKey;
        
        Boolean acquired = redisTemplate.opsForValue()
            .setIfAbsent(fullKey, "processing", 10, TimeUnit.SECONDS);
        
        if (!Boolean.TRUE.equals(acquired)) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"code\":429,\"message\":\"请求正在处理中\"}");
            return false;
        }
        
        request.setAttribute("idempotentKey", fullKey);
        return true;
    }
}
```

#### 3.9.4 SQL注入防护

```java
// SQL注入检测器
@Component
public class SqlInjectionDetector {
    
    private static final List<Pattern> DANGEROUS_PATTERNS = Arrays.asList(
        Pattern.compile(".*(union|select|insert|update|delete|drop|create|alter|truncate).*", 
                       Pattern.CASE_INSENSITIVE),
        Pattern.compile(".*(--|#|\\/\\*|\\*\\/).*")
    );
    
    public void checkForSqlInjection(String input) {
        if (StringUtils.isEmpty(input)) {
            return;
        }
        
        for (Pattern pattern : DANGEROUS_PATTERNS) {
            if (pattern.matcher(input).matches()) {
                throw new BusinessException("检测到非法输入");
            }
        }
    }
}
```

#### 3.9.5 XSS防护

```java
// XSS过滤器
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class XssFilter implements Filter {
    
    private static final List<Pattern> XSS_PATTERNS = Arrays.asList(
        Pattern.compile("<script>(.*?)</script>", Pattern.FLAGS_CASE_INSENSITIVE),
        Pattern.compile("</script>", Pattern.FLAGS_CASE_INSENSITIVE),
        Pattern.compile("<script(.*?)>", Pattern.FLAGS_CASE_INSENSITIVE),
        Pattern.compile("eval\\((.*?)\\)", Pattern.FLAGS_CASE_INSENSITIVE)
    );
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                        FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        chain.doFilter(new XssHttpServletRequestWrapper(httpRequest), response);
    }
}

// XSS过滤包装器
public class XssHttpServletRequestWrapper extends HttpServletRequestWrapper {
    
    public XssHttpServletRequestWrapper(HttpServletRequest request) {
        super(request);
    }
    
    @Override
    public String getParameter(String name) {
        return filterXss(super.getParameter(name));
    }
    
    private String filterXss(String value) {
        if (StringUtils.isEmpty(value)) {
            return value;
        }
        
        String filtered = value;
        for (Pattern pattern : XSS_PATTERNS) {
            filtered = pattern.matcher(filtered).replaceAll("");
        }
        
        return HtmlUtils.htmlEscape(filtered);
    }
}
```

#### 3.9.6 数据脱敏方案

```java
// 数据脱敏注解
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface Desensitize {
    DesensitizeType type();
}

public enum DesensitizeType {
    CHINESE_NAME,     // 张三丰 → 张*
    ID_CARD,          // 110101199001011234 → 110101********1234
    PHONE,            // 13812345678 → 138****5678
    EMAIL,            // test@example.com → t***@example.com
}

// 脱敏工具类
@Component
public class DesensitizeUtil {
    
    public static String chineseName(String fullName) {
        if (StringUtils.isEmpty(fullName)) return fullName;
        if (fullName.length() == 1) return fullName;
        return fullName.charAt(0) + "*";
    }
    
    public static String idCard(String idCard) {
        if (StringUtils.isEmpty(idCard) || idCard.length() < 10) return idCard;
        return idCard.substring(0, 6) + "********" + idCard.substring(idCard.length() - 4);
    }
    
    public static String phone(String phone) {
        if (StringUtils.isEmpty(phone) || phone.length() < 7) return phone;
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }
}
```

---

### 3.10 关键技术决策记录

#### 3.10.1 技术选型决策

| 决策ID | 决策标题 | 决策内容 | 决策理由 | 影响范围 |
|--------|----------|----------|----------|----------|
| TCD-001 | 前端框架选型 | Vue3 + Ant Design Vue | 企业级组件丰富，与现有技术栈一致 | 前端团队 |
| TCD-002 | 后端框架选型 | Spring Boot 3.2 + Java 17 | LTS版本，性能优秀，生态完善 | 后端团队 |
| TCD-003 | 数据库选型 | MySQL主库 + ClickHouse分析 | OLTP+OLAP分离，各司其职 | 全栈 |
| TCD-004 | 消息队列选型 | Kafka + RocketMQ双选 | Kafka高吞吐，RocketMQ事务消息 | 后端团队 |
| TCD-005 | 文件存储选型 | MinIO私有化部署 | 数据主权可控，S3兼容性好 | 运维团队 |
| TCD-006 | 缓存选型 | Redis Cluster | 高可用，分布式锁，Session共享 | 后端团队 |

#### 3.10.2 架构决策记录

| 决策ID | 决策标题 | 决策内容 | 替代方案 | 决策理由 |
|--------|----------|----------|----------|----------|
| ACD-001 | 分库分表时机 | 数据量超过5000万启动分库分表 | 提前分片 | 避免过早复杂度 |
| ACD-002 | 缓存策略 | 本地缓存 + Redis二级缓存 | 纯Redis | 减少网络开销 |
| ACD-003 | 消息重试策略 | 最大重试3次，指数退避 | 立即重试 | 避免雪崩 |
| ACD-004 | 链路追踪采样率 | 生产环境30%采样 | 100%采样 | 减少存储开销 |

---

### 3.11 本章小结

本章详细描述了DataMesh业财一体化PMS系统的技术架构设计，包括：

1. **前端技术方案**：Vue3 + TypeScript + Ant Design Vue + Vite，支持Web端和Uni-app移动端
2. **后端技术方案**：Spring Boot 3.2 + Java 17 + Spring Cloud Alibaba微服务架构
3. **数据库架构**：MySQL主库 + ShardingSphere分库分表 + ClickHouse分析库
4. **缓存架构**：Redis Cluster集群 + 多级缓存策略
5. **消息队列架构**：Kafka事件流 + RocketMQ事务消息的混合架构
6. **文件存储**：MinIO对象存储
7. **日志监控**：ELK日志收集 + SkyWalking链路追踪 + Prometheus/Grafana监控
8. **安全方案**：OAuth2 + JWT认证 + 幂等性设计 + SQL/XSS防护 + 数据脱敏

该技术架构充分考虑了DataMesh的业务特点（项目交付+产品研发双轨）和业财一体化的核心诉求（业务财务实时联动），为后续开发提供了完整的技术指导。

---

### 3.12 环境配置参考

#### 3.12.1 开发环境配置

```yaml
# application-dev.yml
spring:
  profiles:
    active: dev
    
  datasource:
    url: jdbc:mysql://localhost:3306/pms_dev?useUnicode=true&characterEncoding=utf8
    username: pms_dev
    password: pms_dev123
    
  redis:
    host: localhost
    port: 6379
    
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
        
  kafka:
    bootstrap-servers: localhost:9092
    
  minio:
    endpoint: http://localhost:9000
    access-key: minioadmin
    secret-key: minioadmin

logging:
  level:
    com.datamesh.pms: DEBUG
```

#### 3.12.2 生产环境配置

```yaml
# application-prod.yml
spring:
  profiles:
    active: prod
    
  datasource:
    url: jdbc:mysql://${DB_HOST}:3306/pms?useUnicode=true&characterEncoding=utf8&useSSL=true
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 50
      minimum-idle: 10
      
  redis:
    cluster:
      nodes:
        - ${REDIS_HOST1}:6379
        - ${REDIS_HOST2}:6379
        - ${REDIS_HOST3}:6379
    password: ${REDIS_PASSWORD}
    
  kafka:
    bootstrap-servers: ${KAFKA_HOSTS}
    producer:
      acks: all
    consumer:
      group-id: pms-consumer-group-prod
      
  minio:
    endpoint: http://${MINIO_HOST}:9000

jwt:
  secret: ${JWT_SECRET}
  access-token-expire: 120
  refresh-token-expire: 10080

logging:
  level:
    root: INFO
    com.datamesh.pms: INFO
```

---

## 第四章 数据库设计

### 4.1 设计原则

#### 4.1.1 范式与反范式平衡

- **OLTP表**：遵循第三范式(3NF)，消除冗余依赖，保证数据一致性
- **分析表/报表表**：允许适度冗余，以空间换时间，提升查询性能
- **反范式场景**：
  - 订单报表表冗余客户名称，避免频繁JOIN
  - 项目汇总表预计算总收入/总成本/毛利率

#### 4.1.2 命名规范

```
【表命名规则】
{target}_{entity}

target: crm|fin|prj|cost|hr|pur|perf|sys
entity: 单数形式，如 customer, contract, project

示例：
crm_customer     -- 客户表
fin_contract     -- 合同表
prj_project      -- 项目表

【字段命名规则】
全部小写，下划线分隔
采用自然语义命名，避免缩写

示例：
customer_name    -- 客户名称
contract_amount  -- 合同金额
project_start_date -- 项目开始日期

【索引命名规则】
idx_{table}_{column}           -- 普通索引
uk_{table}_{column}            -- 唯一索引
pk_{table}                     -- 主键索引
fk_{table}_{ref_table}         -- 外键索引
```

#### 4.1.3 通用字段设计

所有业务表统一包含以下审计字段：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| tenant_id | BIGINT | NOT NULL, INDEX | 租户ID，多租户隔离 |
| create_time | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| create_by | BIGINT | | 创建人ID |
| update_by | BIGINT | | 更新人ID |
| is_deleted | TINYINT | NOT NULL, DEFAULT 0 | 软删除标记 |

#### 4.1.4 软删除 vs 硬删除策略

- **默认策略**：软删除（is_deleted = 1）
- **例外场景**：以下数据采用硬删除
  - 临时数据/草稿数据
  - 可通过业务规则重新生成的数据
  - 明确标记为"可清除"的历史日志
- **数据保留**：软删除数据保留6个月后归档或清除

#### 4.1.5 多租户设计

- **隔离策略**：所有表包含 tenant_id 字段
- **查询强制**：所有SQL必须携带 tenant_id 条件
- **数据权限**：行级权限基于 tenant_id + 业务归属字段
- **索引策略**：tenant_id 作为联合索引的首列

---

### 4.2 核心实体关系图(ER图)

```
                                    销售域
    ┌──────────┐     1:N      ┌──────────┐     1:N      ┌──────────┐     1:1      ┌──────────┐
    │ Customer │─────────────>│   Lead   │─────────────>│  Quote   │─────────────>│ Contract │
    │ (客户)   │              │ (商机)   │              │ (报价单) │              │ (合同)   │
    └──────────┘              └──────────┘              └──────────┘              └────┬─────┘
          │                                                                    1:N    │
          │ N:1                                                               ┌───────┴───────┐
          ▼                                                                  ▼               ▼
    ┌──────────┐                                                       ┌──────────┐     ┌──────────┐
    │ Contact  │                                                       │  Project │     │Milestone │
    │(联系人)  │                                                       │  (项目)  │     │(里程碑)  │
    └──────────┘                                                       └────┬─────┘     └──────────┘
                                                                           
                           项目域                            │
                    ┌───────────────────────────────────────┘
                    ▼
    ┌──────────┐     1:N      ┌──────────┐     1:N      ┌──────────┐
    │Resource  │─────────────>│  Task    │─────────────>│ ManHour  │
    │(资源分配)│              │(WBS任务) │              │(工时记录)│
    └──────────┘              └──────────┘              └────┬─────┘
                                                               │
                    ┌───────────────────────────────────────────┘
                    ▼
    ┌──────────┐     1:N      ┌──────────┐     1:N      ┌──────────┐     1:1      ┌──────────┐
    │Employee  │─────────────>│   Cost   │─────────────>│Revenue   │─────────────>│  Voucher │
    │ (员工)   │              │ (成本)   │              │(收入确认)│              │ (凭证)   │
    └──────────┘              └──────────┘              └──────────┘              └──────────┘
           │                         ▲
           │ N:1                     │
           ▼                         │
    ┌──────────┐              ┌──────┴──────┐
    │CostCenter│              │  Budget     │
    │(成本中心)│              │  (预算)     │
    └──────────┘              └─────────────┘

                                    财务域
    ┌──────────┐     1:N      ┌──────────┐     1:N      ┌──────────┐     1:N      ┌──────────┐
    │ Contract │─────────────>│ Invoice  │─────────────>│ Payment  │              │  Bank    │
    │  (合同)  │              │ (发票)   │              │(收款记录)│              │(银行日记)│
    └──────────┘              └──────────┘              └──────────┘              └──────────┘

                                    采购域
    ┌──────────┐     1:N      ┌──────────┐     1:N      ┌──────────┐     1:N      ┌──────────┐
    │ Supplier │─────────────>│   PO     │─────────────>│ StockIn  │─────────────>│  Stock   │
    │ (供应商) │              │(采购订单)│              │ (入库单) │              │  (库存)  │
    └──────────┘              └──────────┘              └──────────┘              └──────────┘

                                    绩效域
    ┌──────────┐     1:N      ┌──────────┐     1:N      ┌──────────┐     1:N      ┌──────────┐
    │Employee  │─────────────>│SalesComm │─────────────>│CommTran  │              │CommAudit │
    │  (员工)  │              │(销售提成)│              │(提成发放)│              │(提成审核)│
    └──────────┘              └──────────┘              └──────────┘              └──────────┘
```

**实体关系说明：**

| 关系 | 说明 |
|------|------|
| Customer 1:N Lead | 一个客户可拥有多个商机 |
| Lead 1:N Quote | 一个商机可生成多个报价单版本 |
| Quote 1:1 Contract | 报价单审批通过后生成合同 |
| Contract 1:N Project | 一个合同可启动多个项目(分期/分包) |
| Project 1:N Task | 一个项目包含多个WBS任务 |
| Project 1:N Cost | 项目产生各类成本记录 |
| Cost N:1 Employee | 成本归属到具体执行人员 |
| Project 1:N Revenue | 项目按阶段确认收入 |
| Contract 1:N Invoice | 合同可开具多张发票 |
| Invoice 1:N Payment | 发票可分多次收款 |

---

### 4.3 核心表结构设计

#### 4.3.1 销售域(crm_)

**crm_customer 客户主表**

```sql
CREATE TABLE crm_customer (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '客户ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 客户基本信息
    customer_code   VARCHAR(32)     NOT NULL                    COMMENT '客户编码',
    customer_name   VARCHAR(128)    NOT NULL                    COMMENT '客户名称',
    customer_type   ENUM('CORP','GOVT','INDIV') NOT NULL        COMMENT '客户类型',
    industry        VARCHAR(64)                         COMMENT '所属行业',
    scale           ENUM('LARGE','MEDIUM','SMALL')      COMMENT '企业规模',
    
    -- 工商信息
    unified_social_credit_code  VARCHAR(18)               COMMENT '统一社会信用代码',
    legal_person      VARCHAR(64)                         COMMENT '法人代表',
    registered_capital DECIMAL(15,2)                      COMMENT '注册资本(万元)',
    established_date  DATE                                COMMENT '成立日期',
    
    -- 地址信息
    province          VARCHAR(32)                         COMMENT '省份',
    city              VARCHAR(32)                         COMMENT '城市',
    address           VARCHAR(256)                        COMMENT '详细地址',
    
    -- 业务信息
    customer_level    ENUM('A','B','C','D')   DEFAULT 'C'  COMMENT '客户等级',
    credit_limit      DECIMAL(15,2)           DEFAULT 0    COMMENT '信用额度',
    owner_id          BIGINT                                 COMMENT '客户负责人(销售)',
    source_channel    VARCHAR(64)                            COMMENT '客户来源渠道',
    
    -- 状态
    status            ENUM('ACTIVE','INACTIVE','BLACKLIST') DEFAULT 'ACTIVE'  COMMENT '状态',
    
    -- 审计字段
    create_time       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    create_by         BIGINT                                  COMMENT '创建人',
    update_by         BIGINT                                  COMMENT '更新人',
    is_deleted        TININT          NOT NULL    DEFAULT 0  COMMENT '软删除标记',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_code (tenant_id, customer_code),
    INDEX idx_tenant_owner (tenant_id, owner_id),
    INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户主表';
```

**crm_lead 商机表**

```sql
CREATE TABLE crm_lead (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '商机ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    customer_id     BIGINT          NOT NULL                    COMMENT '客户ID',
    contact_id      BIGINT                                  COMMENT '联系人ID',
    owner_id        BIGINT          NOT NULL                    COMMENT '商机负责人',
    
    -- 商机信息
    lead_code       VARCHAR(32)     NOT NULL                    COMMENT '商机编号',
    lead_name       VARCHAR(128)    NOT NULL                    COMMENT '商机名称',
    lead_source     VARCHAR(64)                             COMMENT '商机来源',
    business_type   ENUM('PRODUCT','SERVICE','PROJECT')        COMMENT '业务类型',
    
    -- 金额估算
    estimated_amount    DECIMAL(15,2)                       COMMENT '预估金额',
    estimated_margin    DECIMAL(5,2)                        COMMENT '预估毛利率%',
    currency        VARCHAR(3)         DEFAULT 'CNY'         COMMENT '币种',
    
    -- 时间计划
    expected_sign_date  DATE                                COMMENT '预计签约日期',
    expected_delivery_date DATE                             COMMENT '预计交付日期',
    
    -- 阶段进度
    stage           ENUM('NEW','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST') DEFAULT 'NEW' COMMENT '商机阶段',
    stage_order     INT              DEFAULT 1               COMMENT '阶段序号(1-5)',
    progress_percent INT             DEFAULT 0               COMMENT '进度百分比',
    loss_reason     VARCHAR(256)                             COMMENT '丢单原因',
    
    -- 竞争信息
    competitors     JSON                                    COMMENT '竞争对手列表',
    our_strengths   TEXT                                    COMMENT '我方优势',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    update_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_code (tenant_id, lead_code),
    INDEX idx_tenant_customer (tenant_id, customer_id),
    INDEX idx_tenant_owner (tenant_id, owner_id),
    INDEX idx_tenant_stage (tenant_id, stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商机表';
```

**crm_quote 报价单表**

```sql
CREATE TABLE crm_quote (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '报价单ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    lead_id         BIGINT          NOT NULL                    COMMENT '商机ID',
    contract_id     BIGINT                                  COMMENT '关联合同ID(签单后回填)',
    customer_id     BIGINT          NOT NULL                    COMMENT '客户ID',
    owner_id        BIGINT          NOT NULL                    COMMENT '报价负责人',
    
    -- 报价单信息
    quote_code      VARCHAR(32)     NOT NULL                    COMMENT '报价单编号',
    quote_version   INT             DEFAULT 1                   COMMENT '版本号',
    quote_type      ENUM('STANDARD','CUSTOM','BIDDING')         COMMENT '报价类型',
    
    -- 金额汇总(冗余设计)
    subtotal_amount DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '明细小计',
    discount_amount DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '折扣金额',
    tax_amount      DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '税额',
    total_amount    DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '报价总金额(含税)',
    margin_amount   DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '毛利金额',
    margin_rate     DECIMAL(5,2)    NOT NULL    DEFAULT 0       COMMENT '毛利率%',
    currency        VARCHAR(3)      DEFAULT 'CNY'               COMMENT '币种',
    
    -- 有效期
    valid_from      DATE            NOT NULL                    COMMENT '有效期起',
    valid_to        DATE            NOT NULL                    COMMENT '有效期止',
    
    -- 审批状态
    status          ENUM('DRAFT','PENDING','APPROVED','REJECTED','EXPIRED') DEFAULT 'DRAFT' COMMENT '状态',
    approval_time   DATETIME                                    COMMENT '审批时间',
    
    -- 备注
    payment_terms   VARCHAR(256)                               COMMENT '付款条款',
    delivery_terms  VARCHAR(256)                               COMMENT '交付条款',
    remarks         TEXT                                        COMMENT '备注',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    update_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_code_ver (tenant_id, quote_code, quote_version),
    INDEX idx_tenant_lead (tenant_id, lead_id),
    INDEX idx_tenant_customer (tenant_id, customer_id),
    INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价单主表';
```

**crm_quote_item 报价明细表**

```sql
CREATE TABLE crm_quote_item (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '明细ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    quote_id        BIGINT          NOT NULL                    COMMENT '报价单ID',
    
    -- 产品/服务信息
    item_type       ENUM('PRODUCT','SERVICE')                   COMMENT '类型',
    product_id      BIGINT                                  COMMENT '产品/服务ID',
    product_code    VARCHAR(32)                             COMMENT '产品编码',
    product_name    VARCHAR(128)    NOT NULL                    COMMENT '产品/服务名称',
    specification   VARCHAR(256)                             COMMENT '规格型号',
    unit            VARCHAR(16)      DEFAULT 'PCS'             COMMENT '单位',
    
    -- 数量价格
    quantity        DECIMAL(15,3)   NOT NULL    DEFAULT 1       COMMENT '数量',
    list_price      DECIMAL(15,4)   NOT NULL                    COMMENT '标价',
    unit_price      DECIMAL(15,4)   NOT NULL                    COMMENT '报价单价',
    discount_rate   DECIMAL(5,4)    NOT NULL    DEFAULT 1       COMMENT '折扣率',
    line_amount     DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '行小计(含税)',
    line_base_amount DECIMAL(15,2)  NOT NULL    DEFAULT 0       COMMENT '行小计(不含税)',
    
    -- 成本信息
    cost_price      DECIMAL(15,4)   NOT NULL    DEFAULT 0       COMMENT '成本单价',
    cost_amount     DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '成本小计',
    
    -- 交付信息
    delivery_date   DATE                                    COMMENT '预计交付日期',
    delivery_location VARCHAR(128)                          COMMENT '交付地点',
    
    -- 排序
    sort_order      INT             DEFAULT 0                   COMMENT '排序号',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    INDEX idx_tenant_quote (tenant_id, quote_id),
    INDEX idx_tenant_product (tenant_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价明细表';
```

**crm_contact 联系人表**

```sql
CREATE TABLE crm_contact (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '联系人ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    customer_id     BIGINT          NOT NULL                    COMMENT '客户ID',
    
    -- 基本信息
    contact_name    VARCHAR(64)     NOT NULL                    COMMENT '姓名',
    gender          ENUM('MALE','FEMALE')                      COMMENT '性别',
    department      VARCHAR(64)                             COMMENT '部门',
    position        VARCHAR(64)                             COMMENT '职位',
    
    -- 联系方式
    phone           VARCHAR(32)                             COMMENT '手机',
    phone_country   VARCHAR(8)       DEFAULT '+86'             COMMENT '手机国家码',
    email           VARCHAR(128)                            COMMENT '邮箱',
    wechat          VARCHAR(64)                             COMMENT '微信',
    
    -- 地址
    province        VARCHAR(32)                             COMMENT '省份',
    city            VARCHAR(32)                             COMMENT '城市',
    address         VARCHAR(256)                            COMMENT '详细地址',
    
    -- 角色标记
    is_primary      TINYINT         DEFAULT 0                   COMMENT '是否主联系人',
    is_decision_maker TINYINT       DEFAULT 0                   COMMENT '是否决策人',
    is_technical_contact TINYINT    DEFAULT 0                   COMMENT '是否技术人员',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    INDEX idx_tenant_customer (tenant_id, customer_id),
    INDEX idx_tenant_primary (tenant_id, customer_id, is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='联系人表';
```

---

#### 4.3.2 合同与财务域(fin_)

**fin_contract 合同主表**

```sql
CREATE TABLE fin_contract (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '合同ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    quote_id        BIGINT          NOT NULL                    COMMENT '报价单ID',
    lead_id         BIGINT          NOT NULL                    COMMENT '商机ID',
    customer_id     BIGINT          NOT NULL                    COMMENT '客户ID',
    owner_id        BIGINT          NOT NULL                    COMMENT '合同负责人',
    
    -- 合同基本信息
    contract_code   VARCHAR(32)     NOT NULL                    COMMENT '合同编号',
    contract_name   VARCHAR(256)    NOT NULL                    COMMENT '合同名称',
    contract_type   ENUM('SALE','PURCHASE','OUTSOURCE')         COMMENT '合同类型',
    sign_date       DATE                                    COMMENT '签订日期',
    
    -- 金额信息
    total_amount    DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '合同总金额(含税)',
    tax_amount      DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '税额',
    net_amount      DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '不含税金额',
    received_amount DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '已收款金额',
    currency        VARCHAR(3)      DEFAULT 'CNY'               COMMENT '币种',
    
    -- 毛利率(冗余)
    margin_amount   DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '毛利金额',
    margin_rate     DECIMAL(5,2)    NOT NULL    DEFAULT 0       COMMENT '毛利率%',
    
    -- 执行信息
    start_date      DATE                                    COMMENT '合同开始日期',
    end_date        DATE                                    COMMENT '合同结束日期',
    actual_end_date DATE                                    COMMENT '实际结束日期',
    
    -- 履约状态
    status          ENUM('DRAFT','EFFECTIVE','EXECUTING','COMPLETED','TERMINATED') DEFAULT 'DRAFT' COMMENT '状态',
    completion_rate DECIMAL(5,2)    DEFAULT 0                  COMMENT '完成进度%',
    
    -- 法务信息
    is_renewable    TINYINT         DEFAULT 0                   COMMENT '是否可续约',
    renew_notice_days INT           DEFAULT 30                  COMMENT '续约提前通知天数',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    update_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_code (tenant_id, contract_code),
    INDEX idx_tenant_customer (tenant_id, customer_id),
    INDEX idx_tenant_owner (tenant_id, owner_id),
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_tenant_sign_date (tenant_id, sign_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同主表';
```

**fin_contract_milestone 合同里程碑表**

```sql
CREATE TABLE fin_contract_milestone (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '里程碑ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    contract_id     BIGINT          NOT NULL                    COMMENT '合同ID',
    
    -- 里程碑信息
    milestone_code  VARCHAR(32)     NOT NULL                    COMMENT '里程碑编号',
    milestone_name  VARCHAR(128)    NOT NULL                    COMMENT '里程碑名称',
    milestone_type  ENUM('DELIVERY','PAYMENT','ACCEPTANCE','OTHER') COMMENT '类型',
    
    -- 计划信息
    plan_date       DATE                                    COMMENT '计划日期',
    plan_amount     DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '计划金额',
    plan_ratio      DECIMAL(5,2)    NOT NULL    DEFAULT 0       COMMENT '计划比例%',
    
    -- 实际信息
    actual_date     DATE                                    COMMENT '实际完成日期',
    actual_amount   DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '实际金额',
    actual_ratio    DECIMAL(5,2)    NOT NULL    DEFAULT 0       COMMENT '实际比例%',
    
    -- 状态
    status          ENUM('PENDING','IN_PROGRESS','COMPLETED','DELAYED') DEFAULT 'PENDING' COMMENT '状态',
    delay_days      INT             DEFAULT 0                   COMMENT '延迟天数',
    
    -- 关联业务
    invoice_id      BIGINT                                  COMMENT '关联发票ID',
    payment_id      BIGINT                                  COMMENT '关联收款ID',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    INDEX idx_tenant_contract (tenant_id, contract_id),
    INDEX idx_tenant_plan_date (tenant_id, plan_date),
    INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同里程碑表';
```

**fin_revenue_confirm 收入确认表**

```sql
CREATE TABLE fin_revenue_confirm (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '确认ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    contract_id     BIGINT          NOT NULL                    COMMENT '合同ID',
    project_id      BIGINT                                  COMMENT '项目ID',
    milestone_id    BIGINT                                  COMMENT '里程碑ID',
    invoice_id      BIGINT                                  COMMENT '发票ID',
    
    -- 确认期间
    fiscal_year     INT             NOT NULL                    COMMENT '财年',
    fiscal_quarter  INT             NOT NULL                    COMMENT '季度(1-4)',
    fiscal_month    INT             NOT NULL                    COMMENT '月份(1-12)',
    confirm_date    DATE            NOT NULL                    COMMENT '确认日期',
    
    -- 收入金额
    total_amount    DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '收入总额(含税)',
    net_amount      DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '净收入(不含税)',
    tax_amount      DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '税额',
    
    -- 成本匹配
    matched_cost    DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '匹配成本',
    gross_profit    DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '毛利',
    gross_margin    DECIMAL(5,2)    NOT NULL    DEFAULT 0       COMMENT '毛利率%',
    
    -- 确认方式
    confirm_method  ENUM('TIME_PERIOD','MILESTONE','OUTPUT')  COMMENT '确认方法',
    completion_rate DECIMAL(5,2)    NOT NULL    DEFAULT 0       COMMENT '完成百分比',
    
    -- 凭证信息
    voucher_id      BIGINT                                  COMMENT '财务凭证ID',
    voucher_no      VARCHAR(32)                             COMMENT '凭证号',
    
    -- 状态
    status          ENUM('PENDING','CONFIRMED','REVERSED') DEFAULT 'PENDING' COMMENT '状态',
    reverse_id      BIGINT                                  COMMENT '冲销ID(红字凭证)',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    INDEX idx_tenant_contract (tenant_id, contract_id),
    INDEX idx_tenant_project (tenant_id, project_id),
    INDEX idx_tenant_period (tenant_id, fiscal_year, fiscal_quarter, fiscal_month),
    INDEX idx_tenant_voucher (tenant_id, voucher_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收入确认表';
```

**fin_invoice 发票表**

```sql
CREATE TABLE fin_invoice (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '发票ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    contract_id     BIGINT          NOT NULL                    COMMENT '合同ID',
    customer_id     BIGINT          NOT NULL                    COMMENT '客户ID',
    milestone_id    BIGINT                                  COMMENT '里程碑ID',
    revenue_confirm_id BIGINT                               COMMENT '收入确认ID',
    
    -- 发票信息
    invoice_code    VARCHAR(32)     NOT NULL                    COMMENT '发票号码',
    invoice_type    ENUM('VAT_SPECIAL','VAT_NORMAL','ELECTRONIC','RECEIPT') COMMENT '发票类型',
    invoice_kind    ENUM('NORMAL','RED','VOID') DEFAULT 'NORMAL' COMMENT '发票种类',
    
    -- 开票信息
    issue_date      DATE            NOT NULL                    COMMENT '开票日期',
    billing_title   VARCHAR(256)    NOT NULL                    COMMENT '发票抬头',
    tax_no          VARCHAR(32)                             COMMENT '税号',
    bank_name       VARCHAR(128)                            COMMENT '开户行',
    bank_account    VARCHAR(32)                             COMMENT '银行账号',
    address_phone   VARCHAR(128)                            COMMENT '地址电话',
    
    -- 金额信息
    total_amount    DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '价税合计',
    net_amount      DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '金额(不含税)',
    tax_amount      DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '税额',
    tax_rate        DECIMAL(5,4)    NOT NULL    DEFAULT 0.13   COMMENT '税率',
    
    -- 收票人信息
    receiver_name   VARCHAR(64)                             COMMENT '收票人',
    receiver_phone  VARCHAR(32)                             COMMENT '收票电话',
    receiver_email  VARCHAR(128)                            COMMENT '收票邮箱',
    
    -- 状态
    status          ENUM('PENDING','ISSUED','SENT','RECEIVED','CANCELLED') DEFAULT 'PENDING' COMMENT '状态',
    
    -- 关联收款
    payment_id      BIGINT                                  COMMENT '收款记录ID',
    received_date   DATE                                    COMMENT '客户签收日期',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_code (tenant_id, invoice_code),
    INDEX idx_tenant_contract (tenant_id, contract_id),
    INDEX idx_tenant_customer (tenant_id, customer_id),
    INDEX idx_tenant_issue_date (tenant_id, issue_date),
    INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='发票表';
```

**fin_payment 收款记录表**

```sql
CREATE TABLE fin_payment (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '收款ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    contract_id     BIGINT          NOT NULL                    COMMENT '合同ID',
    invoice_id      BIGINT                                  COMMENT '发票ID',
    customer_id     BIGINT          NOT NULL                    COMMENT '客户ID',
    
    -- 收款信息
    payment_code    VARCHAR(32)     NOT NULL                    COMMENT '收款单号',
    payment_method  ENUM('TRANSFER','CASH','BILL','ONLINE','OTHER') COMMENT '收款方式',
    
    -- 金额信息
    amount          DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '收款金额',
    currency        VARCHAR(3)      DEFAULT 'CNY'               COMMENT '币种',
    exchange_rate   DECIMAL(10,6)   DEFAULT 1                  COMMENT '汇率',
    amount_cny      DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '人民币金额',
    
    -- 收款时间
    expect_date     DATE                                    COMMENT '预计收款日期',
    actual_date     DATE                                    COMMENT '实际收款日期',
    
    -- 银行信息
    bank_account_id BIGINT                                  COMMENT '收款账户ID',
    bank_serial_no  VARCHAR(64)                             COMMENT '银行流水号',
    
    -- 状态
    status          ENUM('PENDING','RECEIVED','CONFIRMED') DEFAULT 'PENDING' COMMENT '状态',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_code (tenant_id, payment_code),
    INDEX idx_tenant_contract (tenant_id, contract_id),
    INDEX idx_tenant_customer (tenant_id, customer_id),
    INDEX idx_tenant_actual_date (tenant_id, actual_date),
    INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收款记录表';
```

**fin_voucher 凭证记录表**

```sql
CREATE TABLE fin_voucher (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '凭证ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 凭证信息
    voucher_no      VARCHAR(32)     NOT NULL                    COMMENT '凭证号',
    voucher_date    DATE            NOT NULL                    COMMENT '凭证日期',
    fiscal_year     INT             NOT NULL                    COMMENT '会计年度',
    fiscal_period   INT             NOT NULL                    COMMENT '会计期间',
    
    -- 凭证类型
    voucher_type    ENUM('MANUAL','AUTO','IMPORT')              COMMENT '凭证类型',
    source_type     VARCHAR(32)                             COMMENT '来源单据类型',
    source_id       BIGINT                                  COMMENT '来源单据ID',
    source_no       VARCHAR(64)                             COMMENT '来源单据号',
    
    -- 金额
    total_debit     DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '借方合计',
    total_credit    DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '贷方合计',
    
    -- 附件
    attachment_count INT            DEFAULT 0                   COMMENT '附件数量',
    attachments     JSON                                    COMMENT '附件列表',
    
    -- 审核
    status          ENUM('DRAFT','APPROVED','POSTED') DEFAULT 'DRAFT' COMMENT '状态',
    poster_id       BIGINT                                  COMMENT '记账人',
    approver_id     BIGINT                                  COMMENT '审核人',
    post_time       DATETIME                                COMMENT '记账时间',
    
    -- 冲销
    is_reversed     TINYINT         DEFAULT 0                   COMMENT '是否已冲销',
    reverse_voucher_id BIGINT                               COMMENT '冲销凭证ID',
    reverse_reason  VARCHAR(256)                             COMMENT '冲销原因',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_no (tenant_id, voucher_no),
    INDEX idx_tenant_date (tenant_id, voucher_date),
    INDEX idx_tenant_source (tenant_id, source_type, source_id),
    INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='凭证记录表';
```

---

#### 4.3.3 项目域(prj_)

**prj_project 项目主表**

```sql
CREATE TABLE prj_project (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '项目ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    contract_id     BIGINT          NOT NULL                    COMMENT '合同ID',
    customer_id     BIGINT          NOT NULL                    COMMENT '客户ID',
    project_manager_id BIGINT       NOT NULL                    COMMENT '项目经理ID',
    cost_center_id  BIGINT                                  COMMENT '成本中心ID',
    
    -- 项目信息
    project_code    VARCHAR(32)     NOT NULL                    COMMENT '项目编号',
    project_name    VARCHAR(256)    NOT NULL                    COMMENT '项目名称',
    project_type    ENUM('IMPLEMENT','R&D','MAINTENANCE','CONSULTING') COMMENT '项目类型',
    
    -- 时间计划
    plan_start_date DATE                                    COMMENT '计划开始日期',
    plan_end_date   DATE                                    COMMENT '计划结束日期',
    actual_start_date DATE                                  COMMENT '实际开始日期',
    actual_end_date DATE                                    COMMENT '实际结束日期',
    
    -- 预算信息(冗余)
    budget_amount   DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '预算总额',
    budget_labor    DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '人工预算',
    budget_outsource DECIMAL(15,2) NOT NULL    DEFAULT 0       COMMENT '外包预算',
    budget_travel   DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '差旅预算',
    budget_other    DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '其他预算',
    
    -- 实际成本(实时汇总)
    actual_cost     DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '实际总成本',
    actual_labor    DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '实际人工成本',
    actual_outsource DECIMAL(15,2) NOT NULL    DEFAULT 0       COMMENT '实际外包成本',
    actual_travel   DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '实际差旅成本',
    actual_other    DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '实际其他成本',
    
    -- 收入信息(冗余)
    contract_amount DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '合同金额',
    confirmed_revenue DECIMAL(15,2) NOT NULL    DEFAULT 0       COMMENT '已确认收入',
    
    -- 进度
    progress_rate   DECIMAL(5,2)    DEFAULT 0                  COMMENT '进度百分比',
    
    -- 状态
    status          ENUM('DRAFT','APPROVED','IN_PROGRESS','SUSPENDED','COMPLETED','CLOSED') DEFAULT 'DRAFT' COMMENT '状态',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    update_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_code (tenant_id, project_code),
    INDEX idx_tenant_contract (tenant_id, contract_id),
    INDEX idx_tenant_customer (tenant_id, customer_id),
    INDEX idx_tenant_pm (tenant_id, project_manager_id),
    INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目主表';
```

**prj_wbs_task WBS任务表**

```sql
CREATE TABLE prj_wbs_task (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '任务ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    project_id      BIGINT          NOT NULL                    COMMENT '项目ID',
    parent_id       BIGINT                                  COMMENT '父任务ID',
    milestone_id    BIGINT                                  COMMENT '里程碑ID',
    
    -- 任务信息
    task_code       VARCHAR(64)     NOT NULL                    COMMENT '任务编码',
    task_name       VARCHAR(256)    NOT NULL                    COMMENT '任务名称',
    task_type       ENUM('PHASE','TASK','DELIVERABLE')          COMMENT '任务类型',
    wbs_level       INT             NOT NULL    DEFAULT 1       COMMENT 'WBS层级',
    wbs_path        VARCHAR(256)                            COMMENT 'WBS路径(如1.2.3)',
    
    -- 计划信息
    plan_start_date DATE                                    COMMENT '计划开始',
    plan_end_date   DATE                                    COMMENT '计划结束',
    plan_days       DECIMAL(5,1)                            COMMENT '计划工期(天)',
    plan_effort     DECIMAL(10,2)                           COMMENT '计划工时(人天)',
    
    -- 实际信息
    actual_start_date DATE                                  COMMENT '实际开始',
    actual_end_date   DATE                                  COMMENT '实际结束',
    actual_days       DECIMAL(5,1)                          COMMENT '实际工期',
    actual_effort     DECIMAL(10,2)                         COMMENT '实际工时',
    
    -- 进度
    progress_rate   DECIMAL(5,2)    DEFAULT 0                  COMMENT '完成百分比',
    
    -- 责任人
    assignee_id     BIGINT                                  COMMENT '负责人',
    reviewer_id     BIGINT                                  COMMENT '审核人',
    
    -- 依赖关系(JSON存储)
    predecessors    JSON                                    COMMENT '前置任务[{id,type}]',
    successors      JSON                                    COMMENT '后置任务',
    
    -- 状态
    status          ENUM('PENDING','IN_PROGRESS','COMPLETED','DELAYED') DEFAULT 'PENDING' COMMENT '状态',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    INDEX idx_tenant_project (tenant_id, project_id),
    INDEX idx_tenant_parent (tenant_id, parent_id),
    INDEX idx_tenant_assignee (tenant_id, assignee_id),
    INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='WBS任务表';
```

**prj_resource 项目资源表**

```sql
CREATE TABLE prj_resource (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '资源ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    project_id      BIGINT          NOT NULL                    COMMENT '项目ID',
    employee_id     BIGINT          NOT NULL                    COMMENT '员工ID',
    
    -- 资源分配
    role_type       VARCHAR(32)     NOT NULL                    COMMENT '角色类型(PM/DEV/QA)',
    allocation_type ENUM('FULL','PARTIAL') DEFAULT 'FULL'       COMMENT '投入类型',
    allocated_effort DECIMAL(10,2) NOT NULL                    COMMENT '分配工时(人天)',
    allocated_rate  DECIMAL(5,4)    NOT NULL    DEFAULT 1       COMMENT '分配比例(0-1)',
    
    -- 时间段
    start_date      DATE            NOT NULL                    COMMENT '开始日期',
    end_date        DATE            NOT NULL                    COMMENT '结束日期',
    
    -- 成本信息
    daily_rate      DECIMAL(10,2)   NOT NULL                    COMMENT '日费率',
    total_cost      DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '总成本(分配*费率)',
    
    -- 实际使用
    actual_effort   DECIMAL(10,2)   NOT NULL    DEFAULT 0       COMMENT '实际工时',
    actual_cost     DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '实际成本',
    
    -- 状态
    status          ENUM('ALLOCATED','ACTIVE','COMPLETED','RELEASED') DEFAULT 'ALLOCATED' COMMENT '状态',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_proj_emp (tenant_id, project_id, employee_id),
    INDEX idx_tenant_project (tenant_id, project_id),
    INDEX idx_tenant_employee (tenant_id, employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目资源表';
```

**prj_man_hour 工时记录表**

```sql
CREATE TABLE prj_man_hour (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '记录ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    project_id      BIGINT          NOT NULL                    COMMENT '项目ID',
    task_id         BIGINT          NOT NULL                    COMMENT '任务ID',
    employee_id     BIGINT          NOT NULL                    COMMENT '员工ID',
    
    -- 记录信息
    record_date     DATE            NOT NULL                    COMMENT '工作日期',
    hours           DECIMAL(5,2)   NOT NULL                    COMMENT '工时数',
    work_type       ENUM('DEVELOP','DESIGN','TEST','MEETING','ADMIN','OTHER') COMMENT '工作类型',
    description     VARCHAR(512)                            COMMENT '工作描述',
    
    -- 成本计算
    daily_rate      DECIMAL(10,2)   NOT NULL                    COMMENT '日费率',
    cost            DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '成本金额',
    
    -- 审批状态
    status          ENUM('DRAFT','SUBMITTED','APPROVED','REJECTED') DEFAULT 'DRAFT' COMMENT '状态',
    approver_id     BIGINT                                  COMMENT '审批人',
    approve_time    DATETIME                                COMMENT '审批时间',
    approve_remark  VARCHAR(256)                            COMMENT '审批备注',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_emp_date_task (tenant_id, employee_id, record_date, task_id),
    INDEX idx_tenant_project (tenant_id, project_id),
    INDEX idx_tenant_task (tenant_id, task_id),
    INDEX idx_tenant_employee (tenant_id, employee_id),
    INDEX idx_tenant_record_date (tenant_id, record_date),
    INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工时记录表';
```

**prj_budget 项目预算表**

```sql
CREATE TABLE prj_budget (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '预算ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    project_id      BIGINT          NOT NULL                    COMMENT '项目ID',
    version         INT             NOT NULL    DEFAULT 1       COMMENT '预算版本',
    
    -- 预算类型
    budget_type     ENUM('INITIAL','REVISED','FINAL')          COMMENT '预算类型',
    
    -- 预算明细
    labor_budget    DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '人工预算',
    outsource_budget DECIMAL(15,2) NOT NULL    DEFAULT 0       COMMENT '外包预算',
    travel_budget   DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '差旅预算',
    other_budget    DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '其他预算',
    total_budget    DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '预算总额',
    
    -- 审批信息
    status          ENUM('DRAFT','PENDING','APPROVED') DEFAULT 'DRAFT' COMMENT '状态',
    approval_time   DATETIME                                COMMENT '审批时间',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    INDEX idx_tenant_project (tenant_id, project_id),
    INDEX idx_tenant_version (tenant_id, project_id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目预算表';
```

---

#### 4.3.4 成本域(cost_)

**cost_record 成本记录表**

```sql
CREATE TABLE cost_record (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '成本ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    project_id      BIGINT          NOT NULL                    COMMENT '项目ID',
    cost_center_id  BIGINT                                  COMMENT '成本中心ID',
    employee_id     BIGINT                                  COMMENT '归属员工ID',
    
    -- 成本信息
    cost_code       VARCHAR(32)     NOT NULL                    COMMENT '成本编号',
    cost_type       ENUM('LABOR','OUTSOURCE','TRAVEL','MATERIAL','OTHER') NOT NULL COMMENT '成本类型',
    cost_category   VARCHAR(64)     NOT NULL                    COMMENT '成本类别',
    
    -- 金额信息
    amount          DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '成本金额',
    currency        VARCHAR(3)      DEFAULT 'CNY'               COMMENT '币种',
    exchange_rate   DECIMAL(10,6)   DEFAULT 1                  COMMENT '汇率',
    amount_cny      DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '人民币金额',
    
    -- 时间信息
    occur_date      DATE            NOT NULL                    COMMENT '发生日期',
    fiscal_year     INT             NOT NULL                    COMMENT '会计年度',
    fiscal_month    INT             NOT NULL                    COMMENT '会计月份',
    
    -- 关联单据
    source_type     VARCHAR(32)                             COMMENT '来源类型(prj_man_hour/pur_stock_in)',
    source_id       BIGINT                                  COMMENT '来源ID',
    
    -- 凭证信息
    voucher_id      BIGINT                                  COMMENT '凭证ID',
    is_posted       TINYINT         DEFAULT 0                   COMMENT '是否记账',
    
    -- 状态
    status          ENUM('PENDING','APPROVED','POSTED','CANCELLED') DEFAULT 'PENDING' COMMENT '状态',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_code (tenant_id, cost_code),
    INDEX idx_tenant_project (tenant_id, project_id),
    INDEX idx_tenant_employee (tenant_id, employee_id),
    INDEX idx_tenant_type (tenant_id, cost_type),
    INDEX idx_tenant_period (tenant_id, fiscal_year, fiscal_month),
    INDEX idx_tenant_source (tenant_id, source_type, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成本记录表';
```

**cost_labor 人工成本表**

```sql
CREATE TABLE cost_labor (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '人工成本ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    employee_id     BIGINT          NOT NULL                    COMMENT '员工ID',
    project_id      BIGINT          NOT NULL                    COMMENT '项目ID',
    task_id         BIGINT                                  COMMENT '任务ID',
    man_hour_id     BIGINT                                  COMMENT '工时记录ID',
    
    -- 成本明细
    work_date       DATE            NOT NULL                    COMMENT '工作日期',
    hours           DECIMAL(5,2)   NOT NULL                    COMMENT '工时',
    daily_rate      DECIMAL(10,2)  NOT NULL                    COMMENT '日费率',
    cost_amount     DECIMAL(15,2)  NOT NULL                    COMMENT '成本金额',
    
    -- 归属期间
    fiscal_year     INT             NOT NULL                    COMMENT '会计年度',
    fiscal_month    INT             NOT NULL                    COMMENT '会计月份',
    
    -- 凭证信息
    voucher_id      BIGINT                                  COMMENT '凭证ID',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    INDEX idx_tenant_employee (tenant_id, employee_id),
    INDEX idx_tenant_project (tenant_id, project_id),
    INDEX idx_tenant_period (tenant_id, fiscal_year, fiscal_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='人工成本表';
```

**cost_outsource 外包成本表**

```sql
CREATE TABLE cost_outsource (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '外包成本ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    project_id      BIGINT          NOT NULL                    COMMENT '项目ID',
    supplier_id    BIGINT          NOT NULL                    COMMENT '供应商ID',
    purchase_order_id BIGINT                               COMMENT '采购订单ID',
    stock_in_id    BIGINT                                  COMMENT '入库单ID',
    
    -- 外包信息
    outsource_type  ENUM('PERSONNEL','PROJECT','SERVICE')        COMMENT '外包类型',
    work_description VARCHAR(512)                           COMMENT '工作描述',
    
    -- 金额
    contract_amount DECIMAL(15,2)  NOT NULL                    COMMENT '合同金额',
    invoice_amount  DECIMAL(15,2)  NOT NULL    DEFAULT 0       COMMENT '发票金额',
    paid_amount     DECIMAL(15,2)  NOT NULL    DEFAULT 0       COMMENT '已付款',
    
    -- 归属期间
    fiscal_year     INT             NOT NULL                    COMMENT '会计年度',
    fiscal_month    INT             NOT NULL                    COMMENT '会计月份',
    
    -- 状态
    status          ENUM('PENDING','IN_PROGRESS','COMPLETED') DEFAULT 'PENDING' COMMENT '状态',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    INDEX idx_tenant_project (tenant_id, project_id),
    INDEX idx_tenant_supplier (tenant_id, supplier_id),
    INDEX idx_tenant_period (tenant_id, fiscal_year, fiscal_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='外包成本表';
```

**cost_travel 差旅成本表**

```sql
CREATE TABLE cost_travel (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '差旅成本ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    employee_id     BIGINT          NOT NULL                    COMMENT '出差人ID',
    project_id      BIGINT          NOT NULL                    COMMENT '项目ID',
    travel_expense_id BIGINT                                COMMENT '差旅报销单ID',
    
    -- 差旅信息
    travel_date     DATE            NOT NULL                    COMMENT '出差日期',
    destination     VARCHAR(128)   NOT NULL                    COMMENT '目的地',
    travel_purpose  VARCHAR(256)                            COMMENT '出差目的',
    
    -- 费用明细
    transport_fee   DECIMAL(10,2)   NOT NULL    DEFAULT 0       COMMENT '交通费',
    accommodation_fee DECIMAL(10,2) NOT NULL    DEFAULT 0       COMMENT '住宿费',
    meals_fee       DECIMAL(10,2)   NOT NULL    DEFAULT 0       COMMENT '餐费',
    other_fee       DECIMAL(10,2)   NOT NULL    DEFAULT 0       COMMENT '其他费用',
    total_amount    DECIMAL(10,2)   NOT NULL    DEFAULT 0       COMMENT '合计金额',
    
    -- 归属期间
    fiscal_year     INT             NOT NULL                    COMMENT '会计年度',
    fiscal_month    INT             NOT NULL                    COMMENT '会计月份',
    
    -- 审批状态
    status          ENUM('PENDING','APPROVED','REIMBURSED') DEFAULT 'PENDING' COMMENT '状态',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    INDEX idx_tenant_employee (tenant_id, employee_id),
    INDEX idx_tenant_project (tenant_id, project_id),
    INDEX idx_tenant_date (tenant_id, travel_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='差旅成本表';
```

---

#### 4.3.5 HR域(hr_)

**hr_employee 员工表**

```sql
CREATE TABLE hr_employee (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '员工ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 基本信息
    employee_code   VARCHAR(32)     NOT NULL                    COMMENT '员工工号',
    employee_name   VARCHAR(64)     NOT NULL                    COMMENT '姓名',
    gender          ENUM('MALE','FEMALE')                      COMMENT '性别',
    birth_date      DATE                                    COMMENT '出生日期',
    
    -- 职位信息
    department_id   BIGINT          NOT NULL                    COMMENT '部门ID',
    department_name VARCHAR(64)                             COMMENT '部门名称(冗余)',
    position_id     BIGINT          NOT NULL                    COMMENT '岗位ID',
    position_name   VARCHAR(64)                             COMMENT '岗位名称',
    job_level       VARCHAR(32)                             COMMENT '职级',
    
    -- 成本信息
    cost_center_id  BIGINT                                  COMMENT '成本中心ID',
    default_daily_rate DECIMAL(10,2)                        COMMENT '默认日费率',
    is_billable     TINYINT         DEFAULT 1                   COMMENT '是否可计费',
    
    -- 联系方式
    phone           VARCHAR(32)                             COMMENT '手机',
    email           VARCHAR(128)                            COMMENT '邮箱',
    
    -- 入离职
    hire_date       DATE                                    COMMENT '入职日期',
    leave_date      DATE                                    COMMENT '离职日期',
    employee_status ENUM('PROBATION','REGULAR','LEAVE','RESIGNED') DEFAULT 'REGULAR' COMMENT '员工状态',
    
    -- 归属
    manager_id      BIGINT                                  COMMENT '上级ID',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_code (tenant_id, employee_code),
    INDEX idx_tenant_department (tenant_id, department_id),
    INDEX idx_tenant_cost_center (tenant_id, cost_center_id),
    INDEX idx_tenant_status (tenant_id, employee_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='员工表';
```

**hr_daily_rate 日费率配置表**

```sql
CREATE TABLE hr_daily_rate (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '费率ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    employee_id     BIGINT          NOT NULL                    COMMENT '员工ID',
    project_id      BIGINT                                  COMMENT '项目ID(为空表示默认)',
    
    -- 费率信息
    rate_type       ENUM('DEFAULT','PROJECT','SPECIAL')         COMMENT '费率类型',
    daily_rate      DECIMAL(10,2)   NOT NULL                    COMMENT '日费率',
    currency        VARCHAR(3)      DEFAULT 'CNY'               COMMENT '币种',
    
    -- 时间范围
    effective_date  DATE            NOT NULL                    COMMENT '生效日期',
    expire_date     DATE                                    COMMENT '失效日期',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    INDEX idx_tenant_employee (tenant_id, employee_id),
    INDEX idx_tenant_project (tenant_id, project_id),
    INDEX idx_tenant_effective (tenant_id, effective_date, expire_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='日费率配置表';
```

**hr_cost_center 成本中心表**

```sql
CREATE TABLE hr_cost_center (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '成本中心ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 成本中心信息
    cost_center_code VARCHAR(32)   NOT NULL                    COMMENT '成本中心编码',
    cost_center_name VARCHAR(128)  NOT NULL                    COMMENT '成本中心名称',
    parent_id       BIGINT                                  COMMENT '父级ID',
    
    -- 组织信息
    department_id   BIGINT                                  COMMENT '关联部门ID',
    manager_id      BIGINT                                  COMMENT '负责人ID',
    
    -- 核算信息
    cost_center_type ENUM('REVENUE','EXPENSE','OVERHEAD')      COMMENT '类型',
    allocation_method ENUM('DIRECT','PROPORTIONAL')            COMMENT '分摊方式',
    
    -- 预算信息
    annual_budget   DECIMAL(15,2)                           COMMENT '年度预算',
    ytd_cost        DECIMAL(15,2)   DEFAULT 0                  COMMENT '当年累计成本',
    
    -- 状态
    status          ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE' COMMENT '状态',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_code (tenant_id, cost_center_code),
    INDEX idx_tenant_parent (tenant_id, parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成本中心表';
```

---

#### 4.3.6 采购域(pur_)

**pur_supplier 供应商表**

```sql
CREATE TABLE pur_supplier (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '供应商ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 供应商信息
    supplier_code   VARCHAR(32)     NOT NULL                    COMMENT '供应商编码',
    supplier_name   VARCHAR(256)    NOT NULL                    COMMENT '供应商名称',
    supplier_type   ENUM('MANUFACTURER','DISTRIBUTOR','SERVICE','OTHER') COMMENT '类型',
    
    -- 工商信息
    unified_social_credit_code VARCHAR(18)                    COMMENT '统一社会信用代码',
    legal_person    VARCHAR(64)                             COMMENT '法人代表',
    
    -- 联系信息
    contact_name    VARCHAR(64)                             COMMENT '联系人',
    phone           VARCHAR(32)                             COMMENT '电话',
    email           VARCHAR(128)                            COMMENT '邮箱',
    address         VARCHAR(256)                            COMMENT '地址',
    
    -- 合作信息
    payment_terms   VARCHAR(64)                             COMMENT '付款条款',
    credit_days     INT             DEFAULT 0                   COMMENT '账期(天)',
    
    -- 评级
    supplier_level  ENUM('A','B','C','D') DEFAULT 'C'         COMMENT '供应商等级',
    is_approved     TINYINT         DEFAULT 0                   COMMENT '是否认证',
    
    -- 状态
    status          ENUM('ACTIVE','INACTIVE','BLACKLIST') DEFAULT 'ACTIVE' COMMENT '状态',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_code (tenant_id, supplier_code),
    INDEX idx_tenant_type (tenant_id, supplier_type),
    INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='供应商表';
```

**pur_purchase_order 采购订单表**

```sql
CREATE TABLE pur_purchase_order (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '采购订单ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    supplier_id     BIGINT          NOT NULL                    COMMENT '供应商ID',
    project_id      BIGINT                                  COMMENT '项目ID(项目采购时)',
    requester_id    BIGINT          NOT NULL                    COMMENT '申请人ID',
    approver_id     BIGINT                                  COMMENT '审批人ID',
    
    -- 订单信息
    po_code         VARCHAR(32)     NOT NULL                    COMMENT '采购单号',
    po_type         ENUM('PROJECT','STANDARD','EMERGENCY')     COMMENT '订单类型',
    
    -- 金额信息
    total_amount    DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '订单总额',
    tax_amount      DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '税额',
    net_amount      DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '不含税金额',
    paid_amount     DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '已付款',
    
    -- 订单信息
    order_date      DATE            NOT NULL                    COMMENT '下单日期',
    expected_date   DATE                                    COMMENT '期望交付日期',
    actual_date     DATE                                    COMMENT '实际交付日期',
    
    -- 状态
    status          ENUM('DRAFT','PENDING','APPROVED','ORDERED','PARTIAL_IN','ALL_IN','RECEIVED','CANCELLED') DEFAULT 'DRAFT' COMMENT '状态',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_code (tenant_id, po_code),
    INDEX idx_tenant_supplier (tenant_id, supplier_id),
    INDEX idx_tenant_project (tenant_id, project_id),
    INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='采购订单表';
```

**pur_stock_in 入库单表**

```sql
CREATE TABLE pur_stock_in (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '入库单ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    purchase_order_id BIGINT       NOT NULL                    COMMENT '采购订单ID',
    supplier_id     BIGINT          NOT NULL                    COMMENT '供应商ID',
    project_id      BIGINT                                  COMMENT '项目ID',
    warehouse_id    BIGINT                                  COMMENT '仓库ID',
    operator_id     BIGINT          NOT NULL                    COMMENT '操作人ID',
    
    -- 入库信息
    stock_in_code   VARCHAR(32)     NOT NULL                    COMMENT '入库单号',
    stock_in_type   ENUM('PO_IN','RETURN_IN','ADJUST_IN')      COMMENT '入库类型',
    
    -- 金额
    total_amount    DECIMAL(15,2)   NOT NULL    DEFAULT 0       COMMENT '入库总额',
    
    -- 时间
    stock_in_date   DATE            NOT NULL                    COMMENT '入库日期',
    
    -- 状态
    status          ENUM('PENDING','CONFIRMED','CANCELLED') DEFAULT 'PENDING' COMMENT '状态',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_code (tenant_id, stock_in_code),
    INDEX idx_tenant_po (tenant_id, purchase_order_id),
    INDEX idx_tenant_supplier (tenant_id, supplier_id),
    INDEX idx_tenant_date (tenant_id, stock_in_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='入库单表';
```

---

#### 4.3.7 绩效域(perf_)

**perf_commission_config 提成配置表**

```sql
CREATE TABLE perf_commission_config (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '配置ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 配置信息
    config_code     VARCHAR(32)     NOT NULL                    COMMENT '配置编码',
    config_name     VARCHAR(128)    NOT NULL                    COMMENT '配置名称',
    config_type     ENUM('SALES','PROJECT')                    COMMENT '配置类型',
    
    -- 提成规则
    condition_type  ENUM('FIXED','TIERED')                     COMMENT '计算方式',
    condition_expr  JSON                                    COMMENT '条件表达式',
    
    -- 比例配置
    rate_type       ENUM('PERCENT','FIXED')                    COMMENT '费率类型',
    rate_value      DECIMAL(10,4)                            COMMENT '费率值',
    tiered_rates    JSON                                    COMMENT '阶梯费率[{threshold,rate}]',
    
    -- 适用范围
    business_scope  ENUM('ALL','INDUSTRY','PRODUCT','CUSTOMER_LEVEL') COMMENT '适用范围',
    scope_values    JSON                                    COMMENT '范围值',
    
    -- 有效期
    effective_date  DATE            NOT NULL                    COMMENT '生效日期',
    expire_date     DATE                                    COMMENT '失效日期',
    
    -- 状态
    status          ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE' COMMENT '状态',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_code (tenant_id, config_code),
    INDEX idx_tenant_type (tenant_id, config_type),
    INDEX idx_tenant_effective (tenant_id, effective_date, expire_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提成配置表';
```

**perf_sales_commission 销售提成表**

```sql
CREATE TABLE perf_sales_commission (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '提成ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    employee_id     BIGINT          NOT NULL                    COMMENT '员工ID',
    contract_id     BIGINT          NOT NULL                    COMMENT '合同ID',
    config_id       BIGINT          NOT NULL                    COMMENT '配置ID',
    
    -- 提成依据
    base_amount     DECIMAL(15,2)   NOT NULL                    COMMENT '计提基数',
    margin_amount   DECIMAL(15,2)                           COMMENT '毛利基数',
    
    -- 提成计算
    commission_type ENUM('SIGN','RECEIVE','CONFIRM')          COMMENT '提成类型',
    commission_rate DECIMAL(10,4)                            COMMENT '提成比例',
    commission_amount DECIMAL(15,2) NOT NULL                  COMMENT '提成金额',
    
    -- 归属期间
    fiscal_year     INT             NOT NULL                    COMMENT '归属年份',
    fiscal_quarter  INT             NOT NULL                    COMMENT '归属季度',
    fiscal_month    INT             NOT NULL                    COMMENT '归属月份',
    
    -- 收款信息
    received_amount DECIMAL(15,2)   DEFAULT 0                  COMMENT '已收款金额',
    receivable_commission DECIMAL(15,2)                      COMMENT '应收提成',
    paid_commission  DECIMAL(15,2) DEFAULT 0                  COMMENT '已发提成',
    
    -- 状态
    status          ENUM('PENDING','APPROVED','PAID') DEFAULT 'PENDING' COMMENT '状态',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    INDEX idx_tenant_employee (tenant_id, employee_id),
    INDEX idx_tenant_contract (tenant_id, contract_id),
    INDEX idx_tenant_period (tenant_id, fiscal_year, fiscal_quarter, fiscal_month),
    INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='销售提成表';
```

**perf_project_bonus 项目奖金表**

```sql
CREATE TABLE perf_project_bonus (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '奖金ID',
    tenant_id       BIGINT          NOT NULL                    COMMENT '租户ID',
    
    -- 关联信息
    project_id      BIGINT          NOT NULL                    COMMENT '项目ID',
    employee_id     BIGINT          NOT NULL                    COMMENT '员工ID',
    role_type       VARCHAR(32)     NOT NULL                    COMMENT '角色(PM/DEV)',
    
    -- 奖金依据
    profit_amount   DECIMAL(15,2)   NOT NULL                    COMMENT '项目利润',
    profit_margin   DECIMAL(5,2)    NOT NULL                    COMMENT '利润率%',
    
    -- 奖金计算
    bonus_type      ENUM('PERFORMANCE','MILESTONE','COMPLETION') COMMENT '奖金类型',
    bonus_rate      DECIMAL(10,4)                            COMMENT '奖金比例',
    bonus_amount    DECIMAL(15,2)   NOT NULL                    COMMENT '奖金金额',
    
    -- 归属期间
    fiscal_year     INT             NOT NULL                    COMMENT '归属年份',
    fiscal_quarter  INT             NOT NULL                    COMMENT '归属季度',
    
    -- 状态
    status          ENUM('PENDING','APPROVED','PAID') DEFAULT 'PENDING' COMMENT '状态',
    
    -- 审计字段
    create_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       BIGINT,
    is_deleted      TINYINT         NOT NULL    DEFAULT 0,
    
    PRIMARY KEY (id),
    INDEX idx_tenant_project (tenant_id, project_id),
    INDEX idx_tenant_employee (tenant_id, employee_id),
    INDEX idx_tenant_period (tenant_id, fiscal_year, fiscal_quarter)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目奖金表';
```

---

### 4.4 索引设计策略

#### 4.4.1 索引类型规划

| 索引类型 | 命名规则 | 使用场景 | 示例 |
|----------|----------|----------|------|
| 主键索引 | pk_{table} | 唯一且非空 | pk_fin_contract |
| 唯一索引 | uk_{table}_{columns} | 唯一性约束 | uk_tenant_code |
| 普通索引 | idx_{table}_{columns} | 查询加速 | idx_tenant_status |
| 联合索引 | idx_{table}_{col1_col2} | 组合查询 | idx_tenant_customer_status |

#### 4.4.2 联合索引设计原则

```
【最左前缀原则】
联合索引: (tenant_id, customer_id, status)
可命中: 
  - tenant_id
  - tenant_id + customer_id  
  - tenant_id + customer_id + status
不可命中:
  - customer_id
  - status

【覆盖索引设计】
查询: SELECT id, name, status FROM crm_customer WHERE tenant_id=? AND status=?
索引: idx_tenant_status (tenant_id, status) 覆盖所有字段，无需回表
```

#### 4.4.3 覆盖索引示例

```sql
-- 商机列表查询(销售可见范围)
SELECT l.id, l.lead_name, l.estimated_amount, l.stage, c.customer_name
FROM crm_lead l
JOIN crm_customer c ON l.customer_id = c.id
WHERE l.tenant_id = ? AND l.owner_id = ? AND l.is_deleted = 0

-- 覆盖索引
INDEX idx_owner_deleted (owner_id, is_deleted) -- 覆盖owner_id + is_deleted
INDEX idx_tenant_owner_deleted (tenant_id, owner_id, is_deleted) -- 覆盖更多场景
```

#### 4.4.4 分库分表策略

```
【分片策略】
- 按 tenant_id 水平分库/分表（多租户隔离）
- 单租户数据量大时，按业务域二次分片

【分表场景】
prj_man_hour -- 工时记录量大，按月份分表或归档

【归档策略】
历史数据(>24个月)迁移至归档库:
- prj_man_hour
- fin_voucher
- fin_payment
```

#### 4.4.5 索引汇总表

| 表名 | 主键索引 | 唯一索引 | 联合索引 | 说明 |
|------|----------|----------|----------|------|
| crm_customer | pk_crm_customer | uk_tenant_code | idx_tenant_owner, idx_tenant_status | 客户主表 |
| crm_lead | pk_crm_lead | uk_tenant_code | idx_tenant_customer, idx_tenant_owner, idx_tenant_stage | 商机表 |
| crm_quote | pk_crm_quote | uk_tenant_code_ver | idx_tenant_lead, idx_tenant_customer, idx_tenant_status | 报价单 |
| fin_contract | pk_fin_contract | uk_tenant_code | idx_tenant_customer, idx_tenant_owner, idx_tenant_status, idx_tenant_sign_date | 合同 |
| fin_invoice | pk_fin_invoice | uk_tenant_code | idx_tenant_contract, idx_tenant_customer, idx_tenant_issue_date, idx_tenant_status | 发票 |
| prj_project | pk_prj_project | uk_tenant_code | idx_tenant_contract, idx_tenant_customer, idx_tenant_pm, idx_tenant_status | 项目 |
| prj_man_hour | pk_prj_man_hour | uk_tenant_emp_date_task | idx_tenant_project, idx_tenant_task, idx_tenant_employee, idx_tenant_record_date, idx_tenant_status | 工时 |
| cost_record | pk_cost_record | uk_tenant_code | idx_tenant_project, idx_tenant_employee, idx_tenant_type, idx_tenant_period, idx_tenant_source | 成本 |

---

### 4.5 数据权限设计

#### 4.5.1 行级权限控制

```
【销售数据权限】
- 普通销售: 只看自己(owner_id)的客户/商机/报价单
- 销售主管: 看本部门所有数据
- 管理员: 看全公司数据

实现方式: SQL自动拼接 WHERE owner_id = ? 或 WHERE department_id IN (?)

【项目数据权限】
- PM: 只看自己(project_manager_id)的项目
- 项目成员: 看分配给自己的项目
- PMO: 看所有项目

实现方式: 
- 主表: WHERE project_manager_id = ?
- 工时: WHERE employee_id = ? OR project_id IN (SELECT project_id FROM prj_resource WHERE employee_id = ?)
```

#### 4.5.2 列级权限控制

```
【敏感字段权限】
| 字段 | 权限级别 | 可见角色 |
|------|----------|----------|
| hr_employee.default_daily_rate | 日费率 | HR, 财务, 管理员 |
| perf_sales_commission.commission_amount | 提成金额 | 本人, 上级, 管理员 |
| hr_cost_center.annual_budget | 部门预算 | 部门负责人, 财务, 管理员 |
| crm_customer.credit_limit | 信用额度 | 销售, 财务, 管理员 |
```

#### 4.5.3 组织级权限

```
【部门数据隔离】
- 数据归属: department_id
- 权限继承: 子部门继承父部门权限
- 跨部门协作: 通过项目成员机制授权

【数据归属字段】
- CRM域: owner_id, department_id
- 项目域: project_manager_id, cost_center_id
- 财务域: create_by, department_id
```

---

### 4.6 事务设计规范

#### 4.6.1 本地事务场景

```
【强一致性场景】
- 报价单创建 + 报价明细创建 (同一服务)
- 合同审批通过 + 项目自动创建 (同一服务)
- 工时记录 + 成本自动计算 (同一服务)

实现方式: @Transactional 注解
```

#### 4.6.2 分布式事务场景

```
【Saga模式 - 长流程事务】
场景: 报价单审批 -> 合同创建 -> 项目创建 -> 资源分配 -> 预算创建

补偿流程:
1. 报价单审批通过
2. 创建合同 (补偿: 合同作废)
3. 创建项目 (补偿: 项目关闭)
4. 分配资源 (补偿: 释放资源)
5. 创建预算 (补偿: 预算作废)

任意步骤失败 -> 逆向执行补偿操作
```

#### 4.6.3 最终一致性场景

```
【异步消息驱动】
场景: 项目成本变化 -> 更新项目汇总数据

实现方式:
1. 成本记录保存成功后，发送MQ消息
2. 项目服务消费消息，更新 prj_project.actual_cost
3. 允许短暂数据不一致，最终一致

适用场景:
- 项目成本汇总更新
- 合同收款金额更新
- 工时实时统计
```

#### 4.6.4 事务隔离级别

```
【默认隔离级别】READ_COMMITTED

【特殊场景】
- 财务对账: REPEATABLE_READ (防止幻读)
- 库存扣减: SERIALIZABLE (悲观锁 SELECT FOR UPDATE)
```

---

### 4.7 表结构速查表

| 序号 | 表名 | 说明 | 主键 | 核心外键 |
|------|------|------|------|----------|
| 1 | crm_customer | 客户主表 | id | - |
| 2 | crm_lead | 商机表 | id | customer_id, owner_id |
| 3 | crm_quote | 报价单表 | id | lead_id, customer_id |
| 4 | crm_quote_item | 报价明细表 | id | quote_id |
| 5 | crm_contact | 联系人表 | id | customer_id |
| 6 | fin_contract | 合同主表 | id | quote_id, customer_id |
| 7 | fin_contract_milestone | 合同里程碑 | id | contract_id |
| 8 | fin_revenue_confirm | 收入确认表 | id | contract_id, project_id |
| 9 | fin_invoice | 发票表 | id | contract_id, customer_id |
| 10 | fin_payment | 收款记录表 | id | contract_id, customer_id |
| 11 | fin_voucher | 凭证记录表 | id | - |
| 12 | prj_project | 项目主表 | id | contract_id, customer_id |
| 13 | prj_wbs_task | WBS任务表 | id | project_id, parent_id |
| 14 | prj_resource | 项目资源表 | id | project_id, employee_id |
| 15 | prj_man_hour | 工时记录表 | id | project_id, task_id, employee_id |
| 16 | prj_budget | 项目预算表 | id | project_id |
| 17 | cost_record | 成本记录表 | id | project_id, employee_id |
| 18 | cost_labor | 人工成本表 | id | employee_id, project_id |
| 19 | cost_outsource | 外包成本表 | id | project_id, supplier_id |
| 20 | cost_travel | 差旅成本表 | id | employee_id, project_id |
| 21 | hr_employee | 员工表 | id | department_id, cost_center_id |
| 22 | hr_daily_rate | 日费率配置表 | id | employee_id |
| 23 | hr_cost_center | 成本中心表 | id | parent_id |
| 24 | pur_supplier | 供应商表 | id | - |
| 25 | pur_purchase_order | 采购订单表 | id | supplier_id, project_id |
| 26 | pur_stock_in | 入库单表 | id | purchase_order_id, supplier_id |
| 27 | perf_commission_config | 提成配置表 | id | - |
| 28 | perf_sales_commission | 销售提成表 | id | employee_id, contract_id |
| 29 | perf_project_bonus | 项目奖金表 | id | project_id, employee_id |

---

**文档版本**: V1.0  
**编写日期**: 2024-01-15  

---

## 第五章 接口设计

### 5.1 接口设计原则

#### 5.1.1 RESTful API规范

| 规范 | 说明 | 示例 |
|------|------|------|
| URL命名 | 小写+中划线，资源复数名词 | /api/v1/leads, /api/v1/contracts |
| HTTP方法 | GET查/POST增/PUT改/DELETE删 | GET /api/v1/projects/{id} |
| 状态码 | 200成功/201创建/400参数错误/401未认证/403无权限/404不存在/500服务端错误 | |
| 分页 | page+size参数，返回total/totalPages/items | ?page=1&size=20 |
| 排序 | sort参数，字段名+逗号+asc/desc | ?sort=createTime,desc |

#### 5.1.2 统一错误码定义

```
错误码 = 8位数字 = [模块(2位)][业务(3位)][序号(3位)]

CRM域: 01
PMS域: 02
FIN域: 03
HR域: 04
PUR域: 05
SYS域: 99

示例:
01001001 - CRM域-商机-不存在
02002001 - PMS域-工时-重复提交
03003001 - FIN域-收入-金额不匹配
```

#### 5.1.3 接口幂等性设计

幂等Token机制：
```
1. 客户端请求前向幂等服务获取token
   POST /api/v1/idempotency/token
   返回: { token: "uuid-xxx", expiresIn: 86400 }

2. 业务请求携带token
   POST /api/v1/man-hours
   Header: X-Idempotency-Token: uuid-xxx
   Body: { ... }

3. 服务端拦截：
   - token存在+未处理 → 返回缓存结果
   - token存在+已处理 → 返回处理结果
   - token不存在 → 新增处理
   - token过期 → 拒绝请求
```

#### 5.1.4 接口限流策略

| 限流维度 | 限制值 | 说明 |
|---------|--------|------|
| 用户维度 | 100次/分钟 | 普通用户 |
| 管理员维度 | 500次/分钟 | 系统管理员 |
| IP维度 | 200次/分钟 | 防止爬虫 |
| 全局维度 | 5000次/秒 | 系统总QPS |

限流算法：令牌桶（Redis + Lua脚本）

---

### 5.2 内部服务接口

#### 5.2.1 服务间通信模式

```
同步调用（OpenFeign）:
  gateway → contract-service → fin-service
                        ↓
                   adapter-service（财务凭证推送）

异步事件（Kafka）:
  project-service 发布: man-hour.submitted
  cost-service    订阅: → 自动计算人工成本
  fin-service     订阅: → 自动生成凭证（需人工确认）
```

#### 5.2.2 核心调用链示例

**工时填报 → 成本归集 → 凭证生成完整链路**:

```
1. 用户提交工时
   POST /api/v1/man-hours
   → project-service

2. 保存工时记录
   → MySQL: prj_man_hour
   → 发布Kafka事件: man-hour.submitted

3. cost-service消费事件
   → 查询工时明细
   → 查询员工日费率（hr-service）
   → 计算: 人工成本 = Σ(工时 × 日费率)
   → 保存: cost_labor表

4. fin-service消费事件
   → 根据成本记录生成凭证草稿
   → 存入: fin_voucher（状态=待确认）
   → 推送钉钉消息给财务

5. 财务确认凭证
   POST /api/v1/vouchers/{id}/confirm
   → 状态改为已确认
   → 调用adapter-service推送到用友/金蝶

6. 推送成功回调
   → adapter-service回调
   → 更新凭证状态为已推送
   → 记录推送日志
```

---

### 5.3 外部系统接口

#### 5.3.1 财务系统凭证推送适配器（重点）

**设计目标**：同一套代码，支持用友/金蝶/浪潮/SAP等多种财务系统。

**适配器接口定义**:

```java
/**
 * 财务系统适配器接口
 * 新增财务系统只需实现此接口
 */
public interface IFinancialSystemAdapter {
    
    /** 适配器标识（唯一） */
    String getAdapterCode();
    
    /** 适配器名称（显示用） */
    String getAdapterName();
    
    /**
     * 推送凭证到目标财务系统
     * @param voucher 凭证数据（PMS标准格式）
     * @return 推送结果
     */
    PushResult pushVoucher(Voucher voucher);
    
    /**
     * 查询凭证推送状态
     */
    VoucherStatus queryStatus(String externalVoucherId);
    
    /**
     * 获取科目列表（用于映射配置）
     */
    List<Account> getAccounts();
    
    /**
     * 获取辅助核算项列表
     */
    List<AuxiliaryItem> getAuxiliaryItems();
}

/** 统一凭证格式（PMS内部标准） */
@Data
public class Voucher {
    private String voucherId;        // PMS凭证ID
    private String businessType;     // MILESTONE_CONFIRM/COST_COLLECT/PAYMENT
    private String projectCode;      // 项目编码
    private String accountingDate;   // 会计日期
    private String description;      // 凭证摘要
    private List<VoucherEntry> entries; // 分录
}

/** 凭证分录 */
@Data
public class VoucherEntry {
    private Integer sequence;        // 序号
    private String accountCode;       // 科目编码（PMS标准）
    private String accountName;       // 科目名称
    private String direction;         // 借贷方向 DEBIT/CREDIT
    private BigDecimal amount;        // 金额
    private List<AuxiliaryItem> auxiliaryItems; // 辅助核算
}

/** 推送结果 */
@Data
public class PushResult {
    private boolean success;          // 是否成功
    private String externalId;        // 外部系统凭证ID
    private String errorCode;         // 错误码
    private String errorMessage;      // 错误信息
    private LocalDateTime pushTime;   // 推送时间
}
```

**适配器实现示例**:

```java
/** 用友U8适配器 */
@Component("yonyouAdapter")
public class YonyouU8Adapter implements IFinancialSystemAdapter {
    
    @Override
    public String getAdapterCode() { return "YONYOU_U8"; }
    
    @Override
    public String getAdapterName() { return "用友U8"; }
    
    @Override
    public PushResult pushVoucher(Voucher voucher) {
        // 1. 转换PMS凭证格式 → 用友凭证格式
        YonyouVoucher yonyouVoucher = convertToYonyouFormat(voucher);
        
        // 2. 调用用友API
        String url = config.getYonyouApiUrl() + "/api/voucher/push";
        HttpResponse response = HttpUtil.post(url)
            .header("Authorization", "Bearer " + getToken())
            .body(JSON.toJSONString(yonyouVoucher))
            .execute();
        
        // 3. 解析响应
        if (response.getStatus() == 200) {
            return PushResult.success(response.getJson().getString("voucherId"));
        } else {
            return PushResult.fail(response.getJson().getString("errorCode"), 
                                  response.getJson().getString("message"));
        }
    }
}

/** 金蝶K3适配器 */
@Component("kingdeeAdapter")
public class KingdeeK3Adapter implements IFinancialSystemAdapter {
    // 金蝶API调用实现...
}
```

**科目映射配置表**:

| PMS科目编码 | PMS科目名称 | 用友U8科目 | 金蝶K3科目 | 浪潮PS科目 |
|-------------|-------------|------------|------------|------------|
| 6001 | 主营业务收入 | 6001 | 6001.01 | 6001 |
| 5001-01 | 项目成本-人工 | 5001-01 | 5001.01 | 5001-01 |
| 1122 | 应收账款 | 1122 | 1122 | 1122 |
| 2241 | 应付职工薪酬 | 2241 | 2241 | 2241 |

---

#### 5.3.2 钉钉/飞书集成

**单点登录（SSO）**:
```
用户 → PMS登录页 → 选择"钉钉扫码" →
  → 钉钉OAuth2授权 → 回调PMS → 创建/更新用户 → 签发JWT → 登录成功
```

**消息推送Webhook**:
```json
{
  "msgtype": "markdown",
  "markdown": {
    "title": "业财凭证待确认",
    "text": "### 业财凭证待确认\n> 项目: 亿纬锂能数字孪生项目\n> 金额: ¥250,000\n> 来源: 里程碑达成（方案冻结）\n> [立即确认](https://pms.datamesh.com.cn/voucher/123)"
  }
}
```

**组织架构同步**:
- 定时任务（每天凌晨）：钉钉/飞书 → PMS同步部门/员工数据
- 增量同步：监听组织变更事件，实时同步

#### 5.3.3 ERP采购系统集成

| 接口 | 方向 | 内容 |
|------|------|------|
| 采购订单同步 | PMS → ERP | 采购申请审批通过后，推送订单信息 |
| 入库单查询 | ERP → PMS | PMS定时拉取ERP入库单，更新采购状态 |
| 库存查询 | PMS → ERP | 领用时查询实时库存 |

---

### 5.4 开放API设计

#### 5.4.1 API网关设计

```
请求流程:
  客户端 → API网关 → 鉴权 → 限流 → 路由 → 目标服务
                      ↓
                 记录访问日志
```

**Kong网关插件配置**:
- jwt插件：JWT Token验证
- rate-limit插件：按API Key限流
- cors插件：跨域配置
- request-transformer：统一参数处理

#### 5.4.2 统一认证

```
API Key + JWT双模式:

模式1（用户级）: Header: Authorization: Bearer <JWT>
  - 适用场景：第三方系统模拟用户操作
  - JWT Payload: { userId, roles, tenantId, exp }

模式2（系统级）: Header: X-API-Key: <api_key>
  - 适用场景：第三方系统后台任务
  - API Key对应权限：按申请时授权的接口范围
```

#### 5.4.3 核心开放API清单

| 接口 | 方法 | 说明 | 权限 |
|------|------|------|------|
| /open/v1/customers | GET | 查询客户列表 | 读客户 |
| /open/v1/leads | POST | 创建商机 | 写商机 |
| /open/v1/leads/{id} | GET | 查询商机详情 | 读商机 |
| /open/v1/contracts | POST | 创建合同 | 写合同 |
| /open/v1/projects | GET | 查询项目列表 | 读项目 |
| /open/v1/man-hours | POST | 批量提交工时 | 写工时 |
| /open/v1/man-hours | GET | 查询工时记录 | 读工时 |
| /open/v1/reports/project-profit | GET | 项目利润报表 | 读报表 |
| /open/v1/webhooks/subscribe | POST | 订阅事件 | 管理员 |

---

### 5.5 Webhook事件推送

#### 5.5.1 事件类型定义

| 事件编码 | 事件名称 | 触发条件 |
|---------|---------|----------|
| lead.created | 商机创建 | 新增商机记录 |
| lead.stage_changed | 商机阶段变更 | 商机跟进状态变化 |
| contract.signed | 合同签署 | 合同状态变为已签署 |
| project.started | 项目立项 | 项目状态变为进行中 |
| milestone.achieved | 里程碑达成 | 项目里程碑确认完成 |
| man_hour.submitted | 工时提交 | 员工提交日报/周报 |
| cost.calculated | 成本计算完成 | 人工成本日结完成 |
| voucher.created | 凭证生成 | 业财凭证草稿创建 |
| voucher.confirmed | 凭证确认 | 业财凭证财务确认 |
| voucher.pushed | 凭证推送 | 业财凭证推送至财务系统 |
| invoice.issued | 发票开具 | 销项发票开具完成 |
| payment.received | 回款到账 | 收款记录确认 |
| budget.alert | 预算预警 | 预算执行超阈值 |
| performance.calculated | 绩效计算 | 月末绩效/提成计算完成 |

#### 5.5.2 订阅管理

```json
{
  "webhookUrl": "https://partner-system.com/callback",
  "events": ["contract.signed", "milestone.achieved", "payment.received"],
  "secret": "hmac-secret-key",
  "enabled": true
}
```

**签名验签**:
```
签名算法: HMAC-SHA256
签名内容: timestamp + "." + body
Header: X-DM-Signature: sha256=<signature>
Header: X-DM-Timestamp: <unix timestamp>
```

---

## 第六章 核心模块详细设计

### 6.1 销售管理模块

#### 6.1.1 类/接口设计

```
核心类:
├── CrmLeadController        # 商机API入口
│   └── CrmLeadService       # 商机业务逻辑
│       ├── LeadStateMachine  # 商机状态机
│       ├── LeadScoreCalculator # 商机赢单率计算
│       └── LeadConverter     # DTO转换
├── CrmQuoteController       # 报价单API入口
│   └── CrmQuoteService      # 报价单业务逻辑
│       ├── QuoteGenerator    # 报价单自动生成（从SE工时预估）
│       └── QuoteCalculator  # 报价金额计算
├── CrmContractController    # 合同API入口
│   └── CrmContractService  # 合同业务逻辑
│       ├── ContractGenerator # 报价转合同
│       └── MilestoneManager  # 里程碑管理
```

#### 6.1.2 商机状态机

```
商机状态流转:

NEW(新线索)
    ↓ (销售负责人认领)
QUALIFIED(已确认)
    ↓ (需求调研完成)
PROPOSAL(方案报价)
    ↓ (客户确认方案)
NEGOTIATION(商务谈判)
    ↓ (合同签署)
WON(赢单)
    │
    ├─→ 自动触发项目立项
    └─→ 自动触发签约奖金计算
    
NEGOTIATION(商务谈判)
    ↓ (丢单)
LOST(输单) → 记录流失原因

LOST / WON 均为终态，不可逆转
```

#### 6.1.3 报价单生成逻辑

```
报价单来源:
1. 手动创建（销售填写）
2. 一键生成（从商机SE工时预估生成）

一键生成算法:
  输入: 商机ID
  1. 查询商机关联的SE人天预估
     SELECT SUM(estimated_days) FROM se_resource_plan WHERE lead_id = ?
  2. 查询各角色的日费率
     SELECT role, daily_rate FROM hr_daily_rate WHERE effective_date <= NOW()
  3. 计算人工成本
     人工成本 = Σ(预估人天 × 角色日费率)
  4. 加上管理费/利润/税费
     报价金额 = 人工成本 × (1 + 管理费比例 + 利润比例) ÷ (1 - 税率)
  5. 生成报价明细
     报价项 = 人工成本明细 + 软硬件采购 + 实施差旅 + 管理费 + 利润 + 税金
```

#### 6.1.4 销售漏斗数据聚合

```sql
-- 按阶段统计商机数量和金额
SELECT 
    stage,
    COUNT(*) as lead_count,
    SUM(estimated_amount) as total_amount,
    SUM(estimated_amount * win_probability) as weighted_amount
FROM crm_lead
WHERE tenant_id = ? AND is_deleted = 0
GROUP BY stage
ORDER BY FIELD(stage, 'NEW','QUALIFIED','PROPOSAL','NEGOTIATION');

-- 实时计算: 阶段转化率
转化率 = 本阶段赢单数 / 上阶段赢单数 × 100%
加权金额 = 预估金额 × 赢单概率
加权总金额 = Σ各阶段加权金额（赢单概率>0的商机）
```

---

### 6.2 项目管理与工时模块

#### 6.2.1 核心类设计

```
├── ProjectController        # 项目API入口
│   └── ProjectService       # 项目业务逻辑
│       ├── ProjectLifecycleManager # 项目生命周期
│       ├── WbsManager       # WBS任务管理
│       └── ResourceAllocator # 资源分配
├── ManHourController       # 工时API入口
│   └── ManHourService      # 工时业务逻辑
│       ├── HourSubmitter   # 工时填报
│       ├── HourAggregator  # 工时汇总
│       └── HourCalculator  # 工时计算（触发成本）
```

#### 6.2.2 项目全生命周期状态机

```
DRAFT(草稿) ──→ APPROVED(审批中) ──→ APPROVED(已立项)
                                     │
    ┌───────────────────────────────┼───────────────────────────────┐
    ↓                               ↓                               ↓
IN_PROGRESS                   SUSPENDED                        CANCELLED
(进行中)                      (已暂停)                          (已取消)
    │                               │
    ↓                               ↓
IN_PROGRESS ←── (重新启动) ──── SUSPENDED
    │
    ↓
UAT(验收测试)
    │
    ↓
COMPLETED(已完成)
    │
    ↓
CLOSED(已关闭) ←── 终态
```

#### 6.2.3 WBS任务拆解规则

```
WBS层级结构（最多5级）:
Level 1: 项目（Project）
  └─ Level 2: 阶段（Phase）
        └─ Level 3: 模块（Module）
              └─ Level 4: 任务（Task）
                    └─ Level 5: 子任务（SubTask）

示例:
├── PRJ-2026-001 亿纬锂能数字孪生项目
│   ├── Phase 1 需求分析
│   │   ├── Module 1.1 业务调研
│   │   │   ├── Task 1.1.1 高层访谈 [8h, 张三]
│   │   │   └── Task 1.1.2 流程梳理 [16h, 李四]
│   │   └── Module 1.2 方案设计
│   │       └── Task 1.2.1 概念方案 [24h, 张三]
│   └── Phase 2 开发实施
│       └── ...

规则:
- 每个任务必须指定负责人
- 每个任务必须指定预估工时
- 叶子节点任务才能填报工时
- 父级工时 = Σ子级实际工时（系统自动汇总）
```

#### 6.2.4 工时填报 → 成本归集完整链路

```
时序图:

用户        PMS前端       project-service    cost-service     hr-service
 │              │                │                 │                │
 │  1.填报工时   │                │                 │                │
 │─────────────>│                │                 │                │
 │              │  2.保存工时     │                 │                │
 │              │───────────────>│                 │                │
 │              │                │  3.写入MySQL     │                │
 │              │                │  prj_man_hour   │                │
 │              │                │                 │                │
 │              │                │  4.发布Kafka事件  │                │
 │              │                │  man-hour.submitted                │
 │              │                │────────────────>│                │
 │              │                │                 │                │
 │              │  5.返回成功     │                 │                │
 │<─────────────│                │                 │                │
 │              │                │                 │  6.消费事件    │
 │              │                │                 │───────────────>│
 │              │                │                 │                │
 │              │                │                 │  7.查询日费率  │
 │              │                │                 │<───────────────│
 │              │                │                 │                │
 │              │                │                 │  8.返回日费率  │
 │              │                │                 │───────────────>│
 │              │                │                 │                │
 │              │                │                 │  9.计算人工成本 │
 │              │                │                 │                │
 │              │                │                 │ 10.写入MySQL   │
 │              │                │                 │  cost_labor    │
 │              │                │                 │                │
 │              │                │                 │ 11.发布事件    │
 │              │                │                 │  cost.calculated               │
 │              │                │                 │───────────────>│  fin-service
 │              │                │                 │                │
 │              │                │                 │                │
 日结批量任务   │                │                 │                │
 │              │                │ 12.日结（每日凌晨执行）             │
 │              │                │  汇总当天所有工时 │                │
 │              │                │  按项目聚合成本  │                │
```

#### 6.2.5 日费率计算规则

```
日费率 = 月薪 ÷ 月工作天数（默认22天，可配置）

员工日费率配置表: hr_daily_rate
字段: employee_id, base_salary, working_days, daily_rate, effective_date, expire_date

计算:
  1. 日费率 = 月薪 ÷ 工作天数（向上取整到元）
     示例: 月薪15000元, 工作天数22天
           日费率 = 15000 ÷ 22 = 681.82 ≈ 682元/天
  
  2. 工作天数可配置（法定节假日除外，每年调整）
     2026年工作天数 = 365 - 104(周末) - 11(法定节假日) = 250天
     月均工作天数 = 250 ÷ 12 ≈ 20.83 ≈ 22天
  
  3. 人工成本 = Σ(每日工时 × 日费率 / 8)
     示例: 员工日费率682元, 当日填报8h参与项目A
           当日人工成本 = 8/8 × 682 = 682元
```

#### 6.2.6 WBS进度自动计算

```
进度计算规则:
  任务进度 = 已完成工时 ÷ 预估总工时 × 100%
  
  父节点进度 = Σ(子节点进度 × 子节点权重) / Σ子节点权重
  权重默认 = 预估工时
  
  项目整体进度 = Σ(各阶段进度 × 阶段权重) / Σ阶段权重
  权重默认 = 阶段预算
  
  示例:
  Task 1.1.1 高层访谈 [预估8h]
    ├─ 填报4h → 进度50%
    └─ 确认完成 → 进度100%
  
  Task 1.1.2 流程梳理 [预估16h]
    ├─ 填报16h → 进度100%
    └─ 确认完成 → 进度100%
  
  Module 1.1 业务调研 [2个任务, 权重=8+16=24]
    进度 = (50%×8 + 100%×16) / 24 = 75%
  
  Phase 1 需求分析 [1个模块, 权重=24]
    进度 = 75% × 24 / 24 = 75%
```

---

### 6.3 业财一体核心引擎

#### 6.3.1 核心类设计

```
├── FinanceCoreEngine        # 业财核心引擎
│   ├── EventListener       # 业务事件监听（监听Kafka）
│   ├── VoucherGenerator    # 凭证生成器
│   ├── VoucherTemplateEngine # 凭证模板引擎
│   ├── VoucherPusher       # 凭证推送器
│   └── ReconciliationService # 业财对账服务
├── RevenueRecognitionEngine # 收入确认引擎
│   ├── MilestoneChecker    # 里程碑达成检查
│   └── RevenueCalculator   # 收入金额计算
├── CostAccumulationEngine  # 成本归集引擎
│   ├── LaborCostAccumulator # 人工成本归集
│   ├── OutsourceCostAccumulator # 外包成本归集
│   ├── TravelCostAccumulator   # 差旅成本归集
│   └── PurchaseCostAccumulator  # 采购成本归集
└── AdapterService         # 财务系统适配器服务
    ├── AdapterRegistry     # 适配器注册中心
    └── AdapterInvoker      # 适配器调度器
```

#### 6.3.2 业务事件 → 财务凭证自动映射

```
事件类型               触发条件              生成凭证类型
────────────────────────────────────────────────────────
milestone.achieved   里程碑客户确认       收入确认凭证
man_hour.submitted   员工提交工时(日结)    人工成本凭证
outsource.settled    外包结算单审批通过    外包成本凭证
travel.approved      差旅报销审批通过      差旅成本凭证
purchase.received    采购入库确认         采购成本凭证
payment.received     收款到账确认         收款凭证
```

#### 6.3.3 收入确认引擎

```
收入确认流程:

1. 事件触发: milestone.achieved
2. 检查里程碑类型:
   - 预付款里程碑 → 不确认收入，计入合同负债
   - 收入确认里程碑 → 确认收入
   - 质保金里程碑 → 质保期满才确认

3. 计算确认金额:
   确认金额 = 里程碑产值 × (1 - 税率)
   税额 = 里程碑产值 × 税率

4. 生成凭证分录:
   借: 应收账款 / 合同资产    金额=里程碑产值
   贷: 主营业务收入           金额=不含税金额
   贷: 应交税费-销项税额      金额=税额

5. 更新里程碑状态: 已确认
6. 更新合同台账: 累计确认收入
```

#### 6.3.4 凭证生成器设计

```java
/**
 * 凭证模板引擎
 * 支持多财务系统凭证格式配置
 */
public class VoucherTemplateEngine {
    
    /**
     * 根据业务事件生成凭证
     * @param event 业务事件
     * @param targetSystem 目标财务系统编码
     * @return 适配目标系统的凭证格式
     */
    public Object generateVoucher(BusinessEvent event, String targetSystem) {
        // 1. 获取凭证模板
        VoucherTemplate template = getTemplate(event.getEventType());
        
        // 2. 填充变量
        Map<String, Object> variables = buildVariables(event);
        
        // 3. 渲染模板
        String renderedContent = templateEngine.render(template, variables);
        
        // 4. 转换为目标系统格式
        return adapterFactory.getAdapter(targetSystem)
                             .convertToTargetFormat(renderedContent);
    }
    
    /** 凭证模板（可配置） */
    /*
    模板ID: TPL_REVENUE_MILESTONE
    模板名称: 里程碑收入确认凭证
    适用事件: milestone.achieved
    
    模板内容:
    {
      "voucher": {
        "source": "PMS",
        "businessType": "${businessType}",
        "projectCode": "${projectCode}",
        "description": "${projectName} - ${milestoneName}"
      },
      "entries": [
        {
          "accountCode": "${receivableAccount}",
          "direction": "DEBIT",
          "amount": ${milestoneAmount},
          "description": "里程碑收款"
        },
        {
          "accountCode": "${revenueAccount}",
          "direction": "CREDIT",
          "amount": ${netAmount},
          "description": "收入确认"
        },
        {
          "accountCode": "${taxAccount}",
          "direction": "CREDIT",
          "amount": ${taxAmount},
          "description": "销项税额"
        }
      ]
    }
    */
}
```

#### 6.3.5 业财对账机制

```
每日对账流程:

1. 定时任务（每日凌晨2点）
2. 从PMS导出当日业务数据:
   - 新增凭证: SELECT * FROM fin_voucher WHERE DATE(create_time) = yesterday
   - 收入确认: SELECT * FROM fin_revenue_confirm WHERE DATE(confirm_time) = yesterday
   - 成本记录: SELECT * FROM cost_record WHERE DATE(cost_date) = yesterday

3. 从财务系统拉取凭证:
   - 调用接口: GET /api/vouchers?date=yesterday

4. 比对差异:
   对比维度:
   - 凭证数量（两边条数是否一致）
   - 凭证金额（借贷是否平衡）
   - 科目编码（映射是否正确）
   - 项目辅助（项目归属是否正确）

5. 生成对账报告:
   - 一致: 标记为已核对
   - 不一致: 记录差异详情，发送告警给财务主管
   - 缺失: 记录缺失凭证，手动补录

6. 对账结果持久化:
   fin_reconciliation_log
   字段: reconciliation_date, pms_count, erp_count, match_count, diff_count, status
```

---

### 6.4 预算管理模块

#### 6.4.1 核心类设计

```
├── BudgetController        # 预算API入口
│   └── BudgetService       # 预算业务逻辑
│       ├── BudgetHierarchyManager # 预算层级管理
│       ├── BudgetAllocator # 预算分配
│       ├── BudgetExecutor  # 预算执行监控
│       └── BudgetAlertManager # 预算预警
```

#### 6.4.2 三级预算体系

```
预算层级结构:
Level 1: 公司级预算
  └─ 年度总收入目标、年度总成本预算
      └─ Level 2: 部门级预算
            └─ 部门人工成本、部门运营费用、部门项目预算
                └─ Level 3: 项目级预算
                      └─ 项目人工预算、外包预算、差旅预算、设备预算

分配规则:
- 上级预算 ≥ Σ下级预算（儿子不能超过老子）
- 预算调整需要审批流
- 预算不可超支（除非申请追加）
```

#### 6.4.3 预算执行监控

```sql
-- 预算执行率计算
SELECT 
    b.budget_id,
    b.budget_amount,
    COALESCE(SUM(c.actual_cost), 0) as actual_cost,
    COALESCE(SUM(c.actual_cost), 0) / b.budget_amount * 100 as execution_rate
FROM prj_budget b
LEFT JOIN cost_record c ON c.project_id = b.project_id 
    AND c.cost_type = b.cost_type
    AND c.cost_date BETWEEN b.start_date AND b.end_date
WHERE b.project_id = ?
GROUP BY b.budget_id;

-- 预警规则（可配置）
WHEN execution_rate >= 50% → 黄灯预警（部门PM知晓）
WHEN execution_rate >= 80% → 橙灯预警（部门总监+财务知晓）
WHEN execution_rate >= 100% → 红灯预警（总经理+财务知晓，需审批追加预算）
```

---

### 6.5 经营分析模块（管理驾驶舱）

#### 6.5.1 核心类设计

```
├── BiController           # BI API入口
│   └── BiService         # BI业务逻辑
│       ├── IndicatorCalculator # 指标计算
│       ├── DashboardDataProvider # 看板数据提供
│       ├── ForecastEngine  # 预测引擎
│       └── AlertEngine    # 预警引擎
└── IndicatorConfigService # 指标配置服务
```

#### 6.5.2 核心指标计算公式

```
1. 项目利润率 = (项目总收入 - 项目总成本) / 项目总收入 × 100%

2. 人天效率 = 产出价值 / 投入人天
   产出价值 = 合同金额 × (已完成里程碑产值 / 合同总产值)
   
3. 回款率 = 已收金额 / 合同金额 × 100%

4. 成本偏差率 = (实际成本 - 预算成本) / 预算成本 × 100%
   偏差率 > 0 表示超支
   偏差率 < 0 表示节约

5. 现金流覆盖率 = 未来3个月预计收款 / 未来3个月预计付款 × 100%
   覆盖率 < 100% → 触发资金缺口预警

6. 项目健康度 = (进度得分×0.3 + 成本得分×0.3 + 回款得分×0.2 + 质量得分×0.2) × 100
   - 进度得分: 100 - 超期天数 × 5（最低0）
   - 成本得分: 100 - 超支比例 × 50（最低0）
   - 回款得分: 实际回款率 × 100
   - 质量得分: 100 - 缺陷密度 × 10（最低0）
```

#### 6.5.3 ClickHouse宽表设计

```sql
-- 项目利润汇总宽表
CREATE TABLE fact_project_profit (
    project_id     String,
    project_code    String,
    project_name    String,
    customer_id     String,
    customer_name   String,
    contract_amount Decimal(15,2),    -- 合同金额
    recognized_revenue Decimal(15,2), -- 已确认收入
    pending_revenue   Decimal(15,2),  -- 待确认收入
    labor_cost       Decimal(15,2),   -- 人工成本
    outsource_cost   Decimal(15,2),   -- 外包成本
    travel_cost      Decimal(15,2),   -- 差旅成本
    purchase_cost    Decimal(15,2),   -- 采购成本
    total_cost       Decimal(15,2),   -- 总成本
    profit           Decimal(15,2),   -- 利润
    profit_margin    Decimal(5,2),   -- 利润率
    received_amount  Decimal(15,2),   -- 已收款
    payment_rate     Decimal(5,2),   -- 回款率
    plan_man_days    Decimal(10,2),   -- 计划人天
    actual_man_days  Decimal(10,2),   -- 实际人天
    efficiency       Decimal(5,2),   -- 人天效率
    report_date      Date,
    update_time      DateTime
) ENGINE = ReplacingMergeTree(update_time)
ORDER BY (project_code, report_date);

-- 数据刷新策略:
-- T+0（实时）: 当天新增的工时/成本通过Kafka实时写入
-- T+1（每日）: 凌晨2点跑批任务，全量刷新宽表
```

#### 6.5.4 预警规则引擎

```java
/**
 * 预警规则引擎
 * 支持配置化规则定义
 */
public class AlertEngine {
    
    /** 预警规则定义（存储在数据库） */
    /*
    alert_rule表:
    rule_id: 规则ID
    rule_name: 规则名称
    indicator: 监控指标
    condition: 条件 (>, <, =, >=, <=)
    threshold: 阈值
    level: 预警级别 (YELLOW/ORANGE/RED)
    recipients: 通知人
    channel: 通知渠道 (DINGTALK/EMAIL/SMS)
    enabled: 是否启用
    */
    
    /**
     * 检查预警规则
     * 定时任务每5分钟执行一次
     */
    public void checkRules() {
        List<AlertRule> rules = alertRuleRepository.findByEnabled(true);
        for (AlertRule rule : rules) {
            BigDecimal currentValue = indicatorService.getValue(
                rule.getIndicator(), 
                rule.getScope()
            );
            
            if (evaluateCondition(currentValue, rule.getCondition(), rule.getThreshold())) {
                // 触发预警
                Alert alert = createAlert(rule, currentValue);
                alertService.send(alert);
            }
        }
    }
}
```  
**审核状态**: 待审核

---

## 第七章 扩展性与兼容性设计

### 7.1 模块化插拔设计

#### 7.1.1 模块边界定义

每个微服务作为独立部署单元，模块边界清晰：

| 服务名 | 独立部署 | 可禁用 | 依赖服务 |
|--------|---------|--------|----------|
| crm-service | ✓ | ✗ | auth |
| contract-service | ✓ | ✗ | crm |
| project-service | ✓ | ✗ | hr, contract |
| fin-service | ✓ | ✗ | project, adapter |
| cost-service | ✓ | ✓ | project, hr |
| budget-service | ✓ | ✓ | fin |
| hr-service | ✓ | ✗ | auth |
| purchase-service | ✓ | ✓ | project |
| perf-service | ✓ | ✓ | hr, project, fin |
| bi-service | ✓ | ✓ | 所有 |
| adapter-service | ✓ | ✓ | fin |
| system-service | ✓ | ✗ | auth |
| gateway-service | ✓ | ✗ | 所有 |

#### 7.1.2 新增模块流程

新增一个"发票管理"模块流程:

Step 1: 定义模块接口 - 创建: invoice-api 模块（定义接口和DTO）
Step 2: 实现服务 - 创建: invoice-service 模块，实现 invoice-api 中定义的接口
Step 3: 注册服务 - 在 Nacos 注册: invoice-service，配置路由: /api/v1/invoices → invoice-service
Step 4: 配置依赖 - 在 gateway-service 添加路由规则，在 project-service 添加 Kafka Topic 订阅
Step 5: 灰度上线 - 先10%流量 → 观察无异常 → 全量

预计工作量: 2-3人周

#### 7.1.3 模块开关配置

```yaml
modules:
  cost-service: enabled   # 成本服务（不可禁用）
  budget-service: enabled # 预算服务
  perf-service: enabled    # 绩效服务
  invoice-service: disabled # 发票服务（新上线中）
```

---

### 7.2 多财务系统兼容架构（核心亮点）

#### 7.2.1 架构设计

业财一体核心引擎(VoucherGenerator / TemplateEngine) → 统一凭证格式(PMS标准) → 财务适配器层(IFinancialSystemAdapter)

财务适配器包括: YonyouAdapter(用友U8/K3)、KingdeeAdapter(金蝶K3/云星空)、LangchaoAdapter(浪潮PS)

每个适配器实现统一接口: pushVoucher()、queryStatus()、getAccounts()

#### 7.2.2 科目映射配置

```sql
-- 科目映射配置表 fin_account_mapping
字段:
  - id: 主键
  - pms_account_code: PMS标准科目编码
  - pms_account_name: PMS标准科目名称
  - yonyou_account_code: 用友科目编码
  - kingdee_account_code: 金蝶科目编码
  - langchao_account_code: 浪潮科目编码
  - enabled: 是否启用

-- 预置映射数据:
INSERT INTO fin_account_mapping (pms_account_code, pms_account_name, 
  yonyou_account_code, kingdee_account_code) VALUES
('6001', '主营业务收入', '6001', '6001.01'),
('5001-01', '项目成本-人工', '5001-01', '5001.01'),
('5001-02', '项目成本-外包', '5001-02', '5001.02'),
('5001-03', '项目成本-差旅', '5001-03', '5001.03'),
('5001-04', '项目成本-采购', '5001-04', '5001.04'),
('1122', '应收账款', '1122', '1122'),
('2202', '应付账款', '2202', '2202'),
('2241', '应付职工薪酬', '2241', '2241');
```

#### 7.2.3 新增财务系统对接流程

新增一个"SAP"财务系统对接步骤:

Step 1: 创建适配器模块 - 创建: sap-adapter 模块，引入依赖: sap-adapter-api
Step 2: 实现适配器接口 - public class SapAdapter implements IFinancialSystemAdapter
Step 3: 配置科目映射 - 在 fin_account_mapping 表新增 SAP 科目映射
Step 4: 配置凭证模板 - 在 fin_voucher_template 表新增 SAP 模板
Step 5: 测试验证 - 单元测试、集成测试、回归测试
Step 6: 灰度上线 - 选择1-2个客户先使用SAP适配器

预计工作量: 3-4人周

#### 7.2.4 兼容性矩阵

| 财务系统 | 凭证推送 | 科目映射 | 辅助核算 | 状态 |
|---------|---------|---------|---------|------|
| 用友U8 | ✓ 已支持 | ✓ 已支持 | ✓ 已支持 | 生产 |
| 用友NC | ✓ 已支持 | ✓ 已支持 | ✓ 已支持 | 生产 |
| 金蝶K3 | ✓ 已支持 | ✓ 已支持 | ✓ 已支持 | 生产 |
| 金蝶云星空 | ✓ 已支持 | ✓ 已支持 | ✓ 已支持 | 生产 |
| 浪潮PS | ✓ 已支持 | ✓ 已支持 | ✓ 部分支持 | 生产 |
| SAP S4 | ⏳ 规划中 | ⏳ 规划中 | ⏳ 规划中 | 开发中 |
| Oracle EBS | ⏳ 规划中 | ⏳ 规划中 | ⏳ 规划中 | 待启动 |
| 用友BIP | ⏳ 规划中 | ⏳ 规划中 | ⏳ 规划中 | 待启动 |

---

### 7.3 多租户架构设计

#### 7.3.1 租户隔离策略

Level 1（入门版，推荐<50用户）:
  共享数据库 + tenant_id行级隔离
  - 所有租户共用一个MySQL实例
  - 每张表增加 tenant_id 字段
  - 查询时自动注入 tenant_id 条件
  - 优点: 成本低，维护简单
  - 缺点: 性能隔离差

Level 2（标准版，50-500用户）:
  独立Schema + Schema名加密
  - 每个租户独立Schema
  - Schema名 = tenant_code + hash
  - 优点: 数据隔离较好

Level 3（企业版，500+用户）:
  独立数据库
  - 每个租户独立MySQL实例
  - 优点: 完全隔离，性能最好
  - 缺点: 成本高

默认使用Level 1，支持平滑升级到Level 2/3

#### 7.3.2 租户配置管理

```sql
-- 租户配置表 sys_tenant
字段:
  - id, tenant_code, tenant_name
  - contact_name, contact_phone, contact_email
  - package_type: FREE/BASIC/PROFESSIONAL/ENTERPRISE
  - user_limit: 用户数上限
  - storage_limit_gb: 存储空间上限(GB)
  - enabled: 是否启用
  - expired_date: 过期日期
  - isolation_level: 行级/Schema/数据库
```

---

### 7.4 业务规则引擎

#### 7.4.1 规则表达式语法

支持规则类型:

1. 简单条件: field > value
   示例: contract_amount > 100000
   
2. 组合条件: field > value AND field2 < value2
   示例: contract_amount > 100000 AND customer_type = "KEY"
   
3. 百分比规则: field * ratio
   示例: commission = contract_amount * commission_ratio
   
4. 查表规则: LOOKUP(table, key, value)
   示例: daily_rate = LOOKUP(hr_daily_rate, employee_id, :employeeId).daily_rate

5. 脚本规则（Groovy）:
   if (contract.profitMargin > 0.3) {
     return contract.profitMargin * contract_amount * 0.1;
   } else {
     return contract.profitMargin * contract_amount * 0.05;
   }

#### 7.4.2 规则配置表

```sql
-- 提成规则配置表 perf_commission_config
字段:
  - id, rule_name, rule_type
  - expression: 规则表达式
  - priority: 优先级（数字越小优先级越高）
  - effective_date, expire_date
  - enabled

-- 预置提成规则:
INSERT INTO perf_commission_config (rule_name, rule_type, expression, priority) VALUES
('签约奖金-普通客户', 'SIGNING_BONUS', 'contract_amount * 0.005', 1),
('签约奖金-战略客户', 'SIGNING_BONUS', 'contract_amount * 0.008', 1),
('回款奖金-预付款', 'COLLECTION_BONUS', 'payment_amount * 0.01', 1),
('回款奖金-首款', 'COLLECTION_BONUS', 'payment_amount * 0.015', 1),
('回款奖金-尾款', 'COLLECTION_BONUS', 'payment_amount * 0.02', 1),
('毛利奖金-高利润', 'PROFIT_BONUS', 'project_profit * 0.1', 1),
('毛利奖金-普通利润', 'PROFIT_BONUS', 'project_profit * 0.05', 1);
```

---

### 7.5 插件化扩展机制

#### 7.5.1 WebHook事件清单

| 事件编码 | 事件名称 | 触发时机 | 事件数据 |
|---------|---------|---------|----------|
| system.startup | 系统启动 | 服务启动时 | 服务名/IP |
| system.shutdown | 系统关闭 | 服务关闭时 | 服务名/原因 |
| lead.created | 商机创建 | 新增商机 | 商机ID/客户/金额 |
| lead.stage_changed | 商机阶段变更 | 阶段流转 | 商机ID/旧阶段/新阶段 |
| lead.won | 商机赢单 | 签约完成 | 商机ID/合同ID |
| contract.signed | 合同签署 | 合同生效 | 合同ID/金额/客户 |
| project.started | 项目立项 | 项目启动 | 项目ID/合同ID/PM |
| project.completed | 项目完成 | 项目验收 | 项目ID/利润/评价 |
| milestone.achieved | 里程碑达成 | 客户确认 | 项目ID/里程碑ID/金额 |
| man_hour.submitted | 工时提交 | 工时保存 | 项目ID/人员/工时数 |
| cost.calculated | 成本计算 | 日结完成 | 项目ID/成本金额 |
| voucher.created | 凭证生成 | 凭证草稿 | 凭证ID/类型/金额 |
| voucher.confirmed | 凭证确认 | 财务确认 | 凭证ID/确认人 |
| voucher.pushed | 凭证推送 | 推送成功 | 凭证ID/外部ID |
| payment.received | 回款到账 | 收款确认 | 合同ID/金额/方式 |
| budget.exceeded | 预算超支 | 执行超100% | 项目ID/预算/实际 |
| alert.triggered | 预警触发 | 规则命中 | 预警ID/级别/内容 |
| performance.ready | 绩效就绪 | 月度计算 | 员工ID/金额 |

---

### 7.6 数据迁移与版本演进

#### 7.6.1 数据库版本管理

工具: Flyway

目录结构:
db/migrations/V1.0__init_schema.sql
db/migrations/V1.1__add_tenant_module.sql
db/migrations/V2.0__add_cost_module.sql
db/migrations/V2.1__add_budget_module.sql

迁移规则:
- 每个版本一个SQL文件
- 版本号严格递增
- 上线前在测试环境验证
- 支持回滚（Downgrade）

---

## 第八章 安全与运维设计

### 8.1 安全架构

#### 8.1.1 身份认证

认证方案: OAuth2 + JWT + SSO

用户登录流程:
1. 用户名密码 → 验证 → 签发JWT
2. JWT存储在HttpOnly Cookie（防XSS）
3. 访问API时携带JWT
4. 网关验证JWT有效性
5. 验证通过后转发到目标服务

SSO集成（钉钉/飞书）:
1. 用户点击"钉钉登录"
2. 跳转到钉钉授权页
3. 用户授权后回调PMS
4. PMS用钉钉code换token
5. 获取钉钉用户信息，创建/更新本地用户
6. 签发JWT

Token有效期:
- Access Token: 2小时
- Refresh Token: 7天
- 钉钉Access Token: 2小时

#### 8.1.2 权限模型

RBAC + ABAC混合模型:

RBAC（角色权限控制）:
- 预置角色: 系统管理员/财务主管/销售总监/项目经理/普通员工
- 每个角色绑定菜单权限 + API权限
- 用户可属于多个角色

ABAC（属性权限控制）:
- 数据属性: owner_id, dept_id, project_id
- 环境属性: 当前时间, IP地址
- 示例: 销售只能看自己的商机, PM只能看自己负责的项目

权限表达式:
- 格式: resource:action:condition
- 示例: lead:read:owner_id={currentUserId}
        project:write:project_manager={currentUserId}

#### 8.1.3 敏感数据保护

敏感字段清单:

| 字段 | 场景 | 保护措施 |
|------|------|----------|
| 日费率 | 查看员工成本 | 列级权限，仅HR和管理层可见 |
| 提成金额 | 查看绩效 | 列级权限，仅本人和HR可见 |
| 合同金额 | 查看商机 | 行级权限，按销售归属 |
| 成本明细 | 查看成本 | 列级权限，仅财务和PM可见 |
| 客户联系方式 | CRM导出 | 数据脱敏，仅姓名可见 |

加密方案:
- 字段加密: AES-256
- 密钥管理: HashiCorp Vault / AWS KMS
- 传输加密: TLS 1.3

#### 8.1.4 审计日志

```sql
-- 审计日志表 sys_audit_log
字段:
  - id
  - user_id
  - username
  - operation_module: CRM/PMS/FIN/HR/SYS
  - operation_type: CREATE/UPDATE/DELETE/LOGIN/EXPORT
  - operation_desc: 操作描述
  - request_url
  - request_method
  - request_params: 请求参数(JSON)
  - response_code
  - ip_address
  - user_agent
  - create_time

-- 审计规则（可配置）:
必须审计: 登录/登出、删除操作、数据导出、权限变更、敏感字段修改
```

---

### 8.2 运维架构

#### 8.2.1 发布策略

1. 蓝绿部署（Blue-Green）:
   - 两套环境：蓝（当前）、绿（待发布）
   - 流量切到绿环境
   - 观察无异常后销毁蓝环境
   - 适用: 大版本发布
   - 优点: 回滚快（秒级）
   
2. 金丝雀发布（Canary）:
   - 先放10%流量到新版本
   - 观察指标稳定后逐步扩大
   - 适用: 常规迭代
   - 优点: 风险可控
   
3. 滚动发布（Rolling）:
   - 逐个Pod替换
   - 适用: 无状态服务
   - 优点: 资源利用率高

#### 8.2.2 监控体系

监控层次:

1. 基础设施监控（Prometheus Node Exporter）:
   - CPU/内存/磁盘/网络
   - 告警阈值: CPU>80%, 内存>85%, 磁盘>90%
   
2. 中间件监控（Prometheus JMX Exporter）:
   - MySQL: QPS/连接数/慢查询
   - Redis: 内存使用/命令统计/客户端数
   - Kafka: Lag/消息速率/消费延迟
   
3. 应用监控（Prometheus Java Client）:
   - JVM: GC次数/堆内存/线程数
   - HTTP: QPS/延迟/错误率
   - 自定义: 业务埋点
   
4. 链路追踪（SkyWalking/Jaeger）:
   - 请求全链路追踪
   - 服务依赖拓扑图
   - 慢请求分析

#### 8.2.3 告警体系

告警分级:

P1-紧急（电话+短信+钉钉）:
  - 服务不可用
  - 数据库连接失败
  - 财务凭证推送失败>10分钟
  
P2-重要（短信+钉钉）:
  - 服务响应慢>5秒
  - 磁盘使用>85%
  - Kafka消费Lag>10000
  
P3-一般（钉钉）:
  - CPU>80%持续10分钟
  - 内存>80%持续30分钟
  
P4-提醒（邮件）:
  - 定时任务执行完成
  - 备份任务完成

告警收敛:
  同类告警5分钟内合并为1条
  防止告警风暴

---

### 8.3 容量规划

#### 8.3.1 规模估算

用户规模:
- 初期（1年）: 200用户, 50并发
- 中期（2年）: 800用户, 200并发
- 远期（3年）: 2000用户, 500并发

数据量估算:
- 工时记录: 200人 × 22天/月 × 12月 = 5.28万条/月 ≈ 600万条/年
- 成本记录: 同上数量级
- 合同: 100个/年
- 项目: 50个/年

存储估算:
- MySQL数据: 10GB/年（含索引）
- ClickHouse数据: 50GB/年（经营分析）
- 文件存储: 合同附件/发票扫描件 5GB/年

#### 8.3.2 扩容阈值

扩容触发条件:
- CPU平均使用率 > 70% 持续 15分钟 → 扩容1个Pod
- 内存平均使用率 > 80% 持续 15分钟 → 扩容1个Pod
- MySQL连接数 > 80% 最大连接数 → 扩容或优化SQL
- Kafka Lag > 10000 持续 5分钟 → 增加消费者

缩容条件:
- CPU平均使用率 < 30% 持续 60分钟 → 缩容1个Pod
- 确保最小副本数

---

### 8.4 SLA承诺

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 系统可用性 | 99.5% | 年停机时间 < 1.83天 |
| 页面响应时间 | ≤2秒 | P95 < 2秒 |
| 工时填报响应 | ≤1秒 | P95 < 1秒 |
| 审批流响应 | ≤1秒 | P95 < 1秒 |
| 成本计算准确率 | ≥99.5% | 财务数据精度要求 |
| 数据备份 | 每日全量 | 保留30天 |
| 灾备RPO | ≤1小时 | 数据丢失容忍 |
| 灾备RTO | ≤4小时 | 恢复时间目标 |

---

### 8.5 故障应急处理

#### 8.5.1 故障分级

P1-严重:
  - 全系统不可用
  - 核心功能完全失效
  - 影响所有用户
  - 响应时间: 5分钟内
  - 恢复时间: 1小时内
  
P2-重大:
  - 核心功能部分失效
  - 影响部分用户
  - 响应时间: 15分钟内
  - 恢复时间: 4小时内
  
P3-一般:
  - 非核心功能异常
  - 响应时间: 1小时内
  - 恢复时间: 8小时内
  
P4-轻微:
  - UI/体验问题
  - 响应时间: 4小时内
  - 恢复时间: 24小时内

#### 8.5.2 服务降级策略

降级场景与策略:

1. 财务凭证推送延迟:
   - 降级: 存入本地队列 → 稍后重试
   - 不影响: 工时填报、成本计算
   - 通知: 钉钉告警给财务主管
   
2. 成本计算超时:
   - 降级: 返回"计算中"状态
   - 实际: 后台异步重算
   - 不影响: 工时填报、项目管理
   
3. 经营看板加载慢:
   - 降级: 显示缓存数据（可能不是最新）
   - 标记: 显示"数据更新时间"
   - 不影响: 任何业务操作
   
4. 钉钉消息推送失败:
   - 降级: 发送邮件代替
   - 不影响: 业务逻辑
