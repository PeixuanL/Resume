# FactVerse AI Agent — 数据库 & 缓存架构设计

> 设计者: Goku (DataMesh Digital Employee #1)
> 日期: 2026-02-01
> 版本: 1.0

---

## 一、现状分析

### PostgreSQL (factverse 库)
| 已创建 | 状态 | 说明 |
|--------|------|------|
| equipment | ✅ V1 | 设备主表 |
| sensors | ✅ V1 | 传感器定义 |
| sensor_readings | ✅ V1 | 时序数据 |
| alerts | ✅ V1 | 告警表 |
| work_orders | ✅ V1 | 工单表 |
| (seed data) | ✅ V2 | 6台设备+传感器种子 |

### 未部署
| 迁移 | 内容 | 状态 |
|------|------|------|
| V3 | expert_agents + knowledge_rules + bindings | 代码存在，未apply |
| V4 | 5个内置专家种子数据 | 代码存在，未apply |
| V5+ | 用户、诊断追踪、运维、审计... | 需要设计 |

### Redis — 全新，需要设计缓存策略

---

## 二、数据库分层架构

```
┌─────────────────────────────────────────────────────────┐
│                    Layer 5: System                       │
│  system_config | data_sources | tenant (future)         │
├─────────────────────────────────────────────────────────┤
│                 Layer 4: Analytics                       │
│  equipment_metrics_daily | diagnosis_sessions |          │
│  diagnosis_feedback | ai_chat_messages                   │
├─────────────────────────────────────────────────────────┤
│                 Layer 3: Operations                      │
│  maintenance_records | audit_log | notifications |       │
│  notification_preferences                                │
├─────────────────────────────────────────────────────────┤
│              Layer 2: Expert System                      │
│  expert_agents | expert_knowledge_rules |                │
│  expert_equipment_bindings                               │
├─────────────────────────────────────────────────────────┤
│               Layer 1: Core Business                     │
│  users | equipment | sensors | sensor_readings |         │
│  alerts | work_orders                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 三、新增表设计

### 3.1 用户认证 (V5)

```sql
-- users: 用户表（从 JPA auto-DDL 正式化到 Flyway）
users (
  id              BIGSERIAL PK,
  username        VARCHAR(50) UNIQUE NOT NULL,
  password        VARCHAR(255) NOT NULL,     -- BCrypt
  display_name    VARCHAR(100),
  email           VARCHAR(200),
  phone           VARCHAR(50),
  avatar_url      VARCHAR(500),
  role            VARCHAR(20) NOT NULL,       -- ADMIN|OPERATOR|VIEWER
  department      VARCHAR(100),
  is_active       BOOLEAN DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
)

-- user_sessions: 登录会话（可选，Redis 也可）
-- 建议: JWT access token 走 Redis，refresh token 走 DB
refresh_tokens (
  id              BIGSERIAL PK,
  user_id         BIGINT FK→users,
  token           VARCHAR(500) UNIQUE NOT NULL,
  device_info     VARCHAR(200),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
```

### 3.2 AI 诊断追踪 (V6)

```sql
-- diagnosis_sessions: 每次 AI 诊断的完整记录
diagnosis_sessions (
  id              BIGSERIAL PK,
  session_id      UUID UNIQUE DEFAULT gen_random_uuid(),
  equipment_id    BIGINT FK→equipment,
  equipment_type  VARCHAR(50),
  sensor_type     VARCHAR(50),
  expert_id       VARCHAR(50),                -- 使用的专家ID
  
  -- 输入快照
  input_summary   JSONB NOT NULL,
  -- { sensor_values: [...], metadata: {...}, z_threshold: 3.0 }
  
  -- AI 结果
  detection_result JSONB,                     -- 异常检测结果
  diagnosis_result JSONB,                     -- 专家诊断结果
  confidence      DOUBLE PRECISION,
  severity        VARCHAR(20),
  
  -- 关联
  alert_id        BIGINT FK→alerts,           -- 触发的告警（如有）
  work_order_id   BIGINT FK→work_orders,      -- 生成的工单（如有）
  triggered_by    BIGINT FK→users,            -- 触发人（NULL=自动）
  
  -- 性能
  duration_ms     INT,                        -- 诊断耗时
  model_versions  JSONB,                      -- { detector: "1.0", expert: "0.2" }
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

-- diagnosis_feedback: 人工反馈闭环
diagnosis_feedback (
  id              BIGSERIAL PK,
  session_id      BIGINT FK→diagnosis_sessions,
  user_id         BIGINT FK→users,
  
  accuracy_rating INT CHECK(1..5),            -- 1-5 星准确度
  is_correct      BOOLEAN,                    -- 诊断是否正确
  actual_cause    TEXT,                        -- 实际原因
  comments        TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

-- ai_chat_messages: LLM 对话记录（未来智能问答用）
ai_chat_messages (
  id              BIGSERIAL PK,
  conversation_id UUID NOT NULL,
  user_id         BIGINT FK→users,
  role            VARCHAR(20) NOT NULL,       -- user|assistant|system
  content         TEXT NOT NULL,
  
  -- 上下文
  equipment_id    BIGINT FK→equipment,
  diagnosis_id    BIGINT FK→diagnosis_sessions,
  
  -- LLM 元信息
  model           VARCHAR(100),
  tokens_in       INT,
  tokens_out      INT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
```

### 3.3 运维 (V7)

```sql
-- maintenance_records: 维保记录（工单闭环后的实际执行记录）
maintenance_records (
  id              BIGSERIAL PK,
  record_id       VARCHAR(50) UNIQUE NOT NULL,
  work_order_id   BIGINT FK→work_orders,
  equipment_id    BIGINT FK→equipment NOT NULL,
  
  maintenance_type VARCHAR(30) NOT NULL,      -- CORRECTIVE|PREVENTIVE|PREDICTIVE|EMERGENCY
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  
  -- 执行信息
  performed_by    BIGINT FK→users,
  team_members    JSONB,                      -- [{ user_id, role }, ...]
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  downtime_minutes INT,
  
  -- 结果
  findings        TEXT,                        -- 检查发现
  actions_taken   TEXT,                        -- 实际执行措施
  parts_used      JSONB,                      -- [{ name, model, qty, cost }, ...]
  labor_cost      DECIMAL(12,2),
  parts_cost      DECIMAL(12,2),
  
  -- 验证
  verified_by     BIGINT FK→users,
  verified_at     TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
)

-- audit_log: 操作审计（合规要求）
audit_log (
  id              BIGSERIAL PK,
  user_id         BIGINT FK→users,
  action          VARCHAR(50) NOT NULL,       -- CREATE|UPDATE|DELETE|LOGIN|EXPORT|...
  entity_type     VARCHAR(50) NOT NULL,       -- equipment|alert|work_order|...
  entity_id       VARCHAR(100),
  
  old_value       JSONB,                      -- 变更前（UPDATE/DELETE）
  new_value       JSONB,                      -- 变更后（CREATE/UPDATE）
  
  ip_address      VARCHAR(50),
  user_agent      VARCHAR(500),
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
-- 分区: 按月分区，自动清理6个月前的数据

-- notifications: 通知队列
notifications (
  id              BIGSERIAL PK,
  user_id         BIGINT FK→users NOT NULL,
  type            VARCHAR(30) NOT NULL,       -- ALERT|WORK_ORDER|SYSTEM|AI_DIAGNOSIS
  title           VARCHAR(200) NOT NULL,
  content         TEXT,
  severity        VARCHAR(20),
  
  -- 关联
  entity_type     VARCHAR(50),
  entity_id       BIGINT,
  
  -- 状态
  is_read         BOOLEAN DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  is_pushed       BOOLEAN DEFAULT FALSE,      -- 是否已推送（邮件/SMS/WebSocket）
  pushed_at       TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
```

### 3.4 仪表盘 & 聚合 (V8)

```sql
-- equipment_metrics_daily: 预聚合日报（避免扫描 sensor_readings）
equipment_metrics_daily (
  id              BIGSERIAL PK,
  equipment_id    BIGINT FK→equipment NOT NULL,
  metric_date     DATE NOT NULL,
  
  -- 运行统计
  uptime_hours    DECIMAL(5,2),
  alert_count     INT DEFAULT 0,
  critical_count  INT DEFAULT 0,
  
  -- 传感器汇总 { sensor_type: { min, max, avg, std } }
  sensor_summary  JSONB NOT NULL,
  
  -- 健康评分 (0-100)
  health_score    INT,
  
  -- AI 汇总
  diagnosis_count INT DEFAULT 0,
  anomaly_count   INT DEFAULT 0,
  
  UNIQUE(equipment_id, metric_date)
)

-- dashboard_configs: 用户自定义仪表盘
dashboard_configs (
  id              BIGSERIAL PK,
  user_id         BIGINT FK→users,
  name            VARCHAR(100) NOT NULL,
  layout          JSONB NOT NULL,             -- widget 布局配置
  is_default      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
)
```

### 3.5 系统 (V9)

```sql
-- system_config: 系统配置 KV
system_config (
  key             VARCHAR(200) PK,
  value           JSONB NOT NULL,
  description     VARCHAR(500),
  updated_by      BIGINT FK→users,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
)

-- data_sources: 外部数据源（OPC-UA, MQTT, Modbus, REST API...）
data_sources (
  id              BIGSERIAL PK,
  name            VARCHAR(100) NOT NULL,
  type            VARCHAR(30) NOT NULL,       -- OPCUA|MQTT|MODBUS|REST|CSV
  connection_config JSONB NOT NULL,           -- 连接参数（加密存储）
  
  -- 采集配置
  poll_interval_sec INT,
  is_active       BOOLEAN DEFAULT TRUE,
  
  -- 状态
  last_connected  TIMESTAMPTZ,
  last_error      TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
)

-- data_source_mappings: 数据源字段 → 传感器映射
data_source_mappings (
  id              BIGSERIAL PK,
  source_id       BIGINT FK→data_sources,
  sensor_id       BIGINT FK→sensors,
  source_field    VARCHAR(200) NOT NULL,      -- 数据源中的字段名/节点ID
  transform_expr  VARCHAR(500),               -- 可选的转换表达式
  is_active       BOOLEAN DEFAULT TRUE,
  
  UNIQUE(source_id, sensor_id)
)
```

---

## 四、Redis 缓存架构

### 命名规范
```
fv:{domain}:{sub}:{id}
```

### 4.1 实时传感器缓存

| Key | Type | TTL | 说明 |
|-----|------|-----|------|
| `fv:sensor:latest:{sensorId}` | HASH | 5min | 最新读数 {value, ts, status} |
| `fv:sensor:buffer:{sensorId}` | LIST | 30min | 最近60个读数（快速异常检测） |
| `fv:sensor:stats:{sensorId}` | HASH | 1min | 滑动窗口统计 {min, max, avg, std} |

**写入流程:**
```
新读数进来 → 
  1. HSET fv:sensor:latest:{id} value X ts Y
  2. LPUSH + LTRIM fv:sensor:buffer:{id} (保留60条)
  3. 发布 PUBLISH fv:events:sensor {id, value, ts}
  4. 异步写入 PostgreSQL sensor_readings
```

### 4.2 设备状态缓存

| Key | Type | TTL | 说明 |
|-----|------|-----|------|
| `fv:equip:status:{equipId}` | HASH | 60s | {status, activeAlerts, lastUpdate} |
| `fv:equip:summary` | STRING(JSON) | 30s | 全设备概览（仪表盘用） |

### 4.3 告警管理

| Key | Type | TTL | 说明 |
|-----|------|-----|------|
| `fv:alert:active` | ZSET | ∞ | 活跃告警 (score=severity_weight*1e6+timestamp) |
| `fv:alert:dedup:{fingerprint}` | STRING | 5min | 去重窗口（同类告警5分钟内不重复触发） |
| `fv:alert:count:total` | STRING | 30s | 总告警数（仪表盘） |
| `fv:alert:count:{severity}` | STRING | 30s | 按严重度计数 |

**去重指纹:**
```
fingerprint = SHA256(equipmentId + sensorType + alertType + severity)
```

### 4.4 会话 & 认证

| Key | Type | TTL | 说明 |
|-----|------|-----|------|
| `fv:session:{accessToken}` | HASH | 1h | {userId, role, permissions} |
| `fv:session:blacklist:{token}` | STRING | 1h | 已注销的 token |
| `fv:user:online:{userId}` | STRING | 5min | 在线状态（心跳续期） |

### 4.5 仪表盘缓存

| Key | Type | TTL | 说明 |
|-----|------|-----|------|
| `fv:dash:overview` | STRING(JSON) | 15s | 运营总览数据 |
| `fv:dash:alerts:recent` | LIST | 15s | 最近10条告警 |
| `fv:dash:equip:health` | STRING(JSON) | 30s | 设备健康评分列表 |

### 4.6 API 限流

| Key | Type | TTL | 说明 |
|-----|------|-----|------|
| `fv:rate:{ip}:{minute}` | STRING(INCR) | 60s | 每分钟请求数 |
| `fv:rate:ai:{userId}:{hour}` | STRING(INCR) | 1h | AI诊断每小时限额 |

### 4.7 Pub/Sub 频道（WebSocket 推送）

| Channel | 用途 |
|---------|------|
| `fv:events:sensor` | 新传感器数据 → 前端实时图表 |
| `fv:events:alert` | 新告警/状态变更 → 前端通知 |
| `fv:events:diagnosis` | AI诊断完成 → 前端结果展示 |
| `fv:events:workorder` | 工单状态变更 → 相关人员通知 |

---

## 五、数据流架构

```
外部数据源                    ┌──────────┐
(OPC-UA/MQTT/REST)  ────────→│  Redis   │──→ Pub/Sub → WebSocket → 前端
                              │ (缓存层)  │
                              └────┬─────┘
                                   │ 异步批量写入
                    ┌──────────────▼──────────────┐
                    │        PostgreSQL            │
                    │  (持久化 + 事务/配置)         │
                    └──────────────┬──────────────┘
                                   │ 定时聚合
                    ┌──────────────▼──────────────┐
                    │   equipment_metrics_daily    │
                    │   (预聚合 → 仪表盘秒开)       │
                    └─────────────────────────────┘

                                     ┌───────────────┐
Kafka / MQTT → Ingestion →──────────▶│ ClickHouse    │◀── 归档/查询
(高频写入)                           │ (时序主存)     │
                                     └───────────────┘
```

**核心原则:**
1. **写入路径**: 数据源 → Redis(缓存+推送) → PostgreSQL(元数据/事务)
2. **时序主存**: 高频传感器数据 → ClickHouse（批量写入 + 压缩）
3. **读取路径**: 实时数据 → Redis | 历史/趋势 → ClickHouse | 统计 → 预聚合表
4. **AI 路径**: Redis buffer(最近数据) + ClickHouse(历史数据) → AI Engine

---

## 六、ClickHouse 时序库设计（新增）

### 6.1 设计目标
- **承载高频传感器时序数据**（10^8/日级别可扩展）
- **秒级聚合查询**（趋势图、仪表盘、异常回溯）
- 与 PostgreSQL **职责清晰分离**（元数据 vs 时序数据）

### 6.2 数据写入链路
```
OPC-UA/MQTT → Kafka / MQTT Bridge → ClickHouse
             ↘ Redis(实时缓存/推送)
              ↘ PostgreSQL(设备/告警/工单/配置)
```

> 生产建议用 Kafka；小规模可由 Backend 批量写 ClickHouse（HTTP/Native）。

### 6.3 表模型（主表 + 聚合表）

**原始明细表（主存）**
```sql
CREATE TABLE sensor_readings_ch
(
  tenant_id     UInt32,
  equipment_id  UInt32,
  sensor_id     UInt32,
  sensor_type   LowCardinality(String),
  ts            DateTime,
  value         Float64,
  status        UInt8
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (tenant_id, equipment_id, sensor_id, ts)
TTL ts + INTERVAL 365 DAY DELETE;
```

**分钟级聚合（趋势图/仪表盘）**
```sql
CREATE TABLE sensor_readings_1m
(
  tenant_id     UInt32,
  equipment_id  UInt32,
  sensor_id     UInt32,
  ts            DateTime,
  cnt           UInt32,
  avg_value     Float64,
  min_value     Float64,
  max_value     Float64,
  std_value     Float64
)
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (tenant_id, equipment_id, sensor_id, ts)
TTL ts + INTERVAL 365 DAY DELETE;
```

**物化视图（自动聚合）**
```sql
CREATE MATERIALIZED VIEW mv_sensor_1m
TO sensor_readings_1m
AS SELECT
  tenant_id,
  equipment_id,
  sensor_id,
  toStartOfMinute(ts) AS ts,
  count() AS cnt,
  avg(value) AS avg_value,
  min(value) AS min_value,
  max(value) AS max_value,
  stddevPop(value) AS std_value
FROM sensor_readings_ch
GROUP BY tenant_id, equipment_id, sensor_id, ts;
```

### 6.4 多租户策略
- ClickHouse 主表 **必须包含 `tenant_id`**
- 查询层强制 tenant 过滤（API 层校验）

### 6.5 冷热分层与保留策略
- **热数据（7天）**：原始明细表 + Redis 实时缓存
- **温数据（7-365天）**：ClickHouse 原始 + 1m 聚合
- **冷数据（>365天）**：TTL 自动清理或导出对象存储

### 6.6 查询模式
- **实时折线**：Redis buffer + ClickHouse 1m聚合
- **历史回溯**：ClickHouse 明细表（按设备 + 时间范围）
- **统计报表**：ClickHouse 聚合表 + PostgreSQL 元数据

---

## 七、Flyway 迁移计划

| Version | 文件 | 内容 | 状态 |
|---------|------|------|------|
| V1 | init_schema.sql | 核心5表 | ✅ 已执行 |
| V2 | seed_equipment.sql | 6台设备种子 | ✅ 已执行 |
| V3 | expert_agents.sql | 专家系统3表 | ⏳ 待执行 |
| V4 | seed_experts.sql | 5个内置专家 | ⏳ 待执行 |
| V5 | users_and_auth.sql | 用户+refresh_tokens | 🆕 新增 |
| V6 | ai_tracking.sql | 诊断追踪+反馈+对话 | 🆕 新增 |
| V7 | operations.sql | 维保+审计+通知 | 🆕 新增 |
| V8 | analytics.sql | 日报聚合+仪表盘配置 | 🆕 新增 |
| V9 | system_config.sql | 系统配置+数据源 | 🆕 新增 |
| V10 | seed_dev_data.sql | 开发环境完整种子 | 🆕 新增 |

---

## 八、环境配置变更

### application-dev.yml
- ❌ H2 内存库 → ✅ PostgreSQL localhost:5432/factverse
- ❌ Redis 禁用 → ✅ Redis localhost:6379
- ✅ Flyway 启用
- ✅ JPA ddl-auto: validate

### application-prod.yml
- 保持环境变量注入不变
- 添加 Redis 连接池配置
- 添加 Flyway 清理策略

---

## 九、性能考虑

### sensor_readings 分区策略
- 开发阶段: 普通表 + 索引即可
- 生产阶段方案A: PostgreSQL 原生范围分区（按月）
- 生产阶段方案B: TimescaleDB 扩展（自动 chunk + 压缩 + 连续聚合）
- V1 migration 已预留 TimescaleDB 兼容代码

### 索引策略
- 所有外键自动索引
- 时间字段 DESC 索引（最新数据查询优化）
- JSONB 字段 GIN 索引（按需）
- 复合索引: (equipment_id, created_at DESC) 覆盖最常见查询

### 连接池
- 开发: HikariCP max=5, idle=2
- 生产: HikariCP max=20, idle=5
- Redis: Lettuce 默认连接池
