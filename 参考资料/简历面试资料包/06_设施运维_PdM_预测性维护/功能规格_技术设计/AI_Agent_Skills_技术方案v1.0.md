## 一、背景与目标 🎯

本方案旨在将现有服务端 HTTP API 以“Agent Skills（工具）”的方式安全接入 AI Agent，并在用户使用 Agent 时实现端到端的认证、权限控制、多租户隔离、审计与安全防护。

### （一）关键目标

- **权限归属明确**：用户身份与权限不由 Agent/LLM 决定，权限始终归属于用户/租户/角色。
- **链路安全可控**：技能调用全链路可认证、可授权、可审计、可追溯；支持多租户强隔离。
- **对抗安全威胁**：仅暴露允许的工具、强参数校验、使用最小权限 token，以对抗提示注入/越权。
- **平滑对接现有体系**：支持现有 JWT/SSO 登录体系，skills 采用 HTTP，对现有业务 API 改造最小化。

## 二、方案设计 🛠️

### （一）范围界定

- **Agent Orchestrator（编排层）**：接收用户请求，维护会话主体（principal），执行工具调用。
- **Skill Gateway（网关层）**：统一鉴权、限流、审计、Schema 校验、响应裁剪与脱敏，并转发到技能服务。
- **Skills（业务 API）**：实现认证、RBAC 授权与资源级（tenant）授权，返回最小化结果。
- **TIA（Token for Identity & Access）**：由 Gateway 签发，skills 仅信任该签发方。

### （二）TIA JWT Claims 规范（初稿）

```json
{
  "iss": "agent-gateway",
  "aud": "skill-service",
  "sub": "<user_id>",
  "tid": "<tenant_id>",
  "roles": ["scene_reader"],
  "scp": ["scenes:read:detail"],
  "op": "data.scenes.unity.query.details",
  "cnv": "<conversation_id>",
  "rid": "<x-request-id>",
  "jti": "<uuid>",
  "iat": <unix>,
  "exp": <unix>
}
```

- **TTL**：建议 60-300 秒；`aud` 固定为 skills 服务；`iss` 固定为签发方（gateway）。
- **`op` 绑定**：绑定到具体 operationId，防止 token 被挪用于其它接口。
- **最小权限**：`scp` 为最小权限集合（一次调用尽量 1 个 scope）。
- **防重放**：`jti` 用于防重放；skills 可用 Redis setnx 记录短期使用情况。

### （三）HTTP Header 规范（skills 入参）

- `Authorization: Bearer <TIA_JWT>`（唯一可信身份来源）
- `X-Request-Id: <uuid>`（追踪与审计）
- `X-Conversation-Id: <id>`（对话串联与审计）
- **注意**：`X-tenant-Id` / `X-user-id` 保留用于日志，但不得作为鉴权依据（避免伪造）。

## 三、权限模型与工具暴露（Tool Gating）🔐

### （一）scopes 命名规范

- **格式**：`<domain>:<verb>:<action>`
- **示例**：`scenes:read:detail`
- **常见扩展**：`scenes:read:list` / `scenes:write:update` / `scenes:write:delete` / `scenes:export`

### （二）roles 与 scopes 映射

RBAC 以 roles 授权用户；在 Gateway 内维护 `role->scope` 映射。签发 TIA 时按 operation 所需 scope 计算最小 scope 集合写入 `scp`。

### （三）动态裁剪 tools（必须）

- Orchestrator/Gateway 根据用户 roles/scopes，仅向 LLM 暴露允许的 skills/operations。
- 敏感操作默认不暴露或启用二次确认（human-in-the-loop）。

## 四、Skill Registry 与示例接口落地 📝

### （一）Registry 记录建议字段

- `name` / `operationId` / `method` / `path` / `required_scope`
- `input_schema`（JSON Schema）/ `output_profile`（返回裁剪模板）
- `data_access_tags`（PII/更新/管理操作标签，用于策略与审计）

### （二）示例：Scene Details Skill 定义

| 项目 | 内容 |
| :--- | :--- |
| **Skill name** | `get_scene_details` |
| **operationId** | `data.scenes.unity.query.details` |
| **HTTP** | `POST /api/v6/data/scenes/unity/query/details` |
| **required_scope** | `scenes:read:detail` |
| **Input** | `{"id":"<scene_id>"}`（id 必填，string；执行 UUID/雪花格式校验） |
| **Auth** | `Authorization: Bearer <TIA_JWT>`（aud/iss/op/scp/jti/exp 校验） |

### （三）Skill 服务端校验顺序（必须）

#### 1. JWT 验签与 exp/iat 校验，iss/aud 校验。
#### 2. jti 防重放（Redis setnx，TTL=exp-now）。
#### 3. op 绑定校验：必须等于 `data.scenes.unity.query.details`。
#### 4. scope 校验：scp 必须包含 `scenes:read:detail`（或 roles 命中映射）。
#### 5. 资源级授权：查询时强制 `tenant_id = tid`；查不到返回 404。

## 五、响应裁剪、脱敏与安全防护 🛡️

### （一）返回最小化（推荐）

- 对 Agent 只返回对话需要的最小字段（减少 token 成本与信息泄露）。
- **建议返回**：scene 基本信息（id/name/description/tags/cover/updateTime）+ objectCount/taskCount。

### （二）默认不加入模型上下文的字段

- `dataSourceAddress`、`pathMapJson`、`objectNameDictionary` 等可能含内部地址/大字段/敏感信息。
- 任何可能包含密钥、内部网络路径、系统实现细节的字段。

### （三）对抗提示注入与越权的控制点

- **工具最小暴露**：只把用户可用的 skills 提供给 LLM。
- **强参数校验**：JSON Schema + 业务规则（id 格式、长度、存在性）。
- **双层授权**：Gateway 工具级授权 + Skill 资源级授权（tenant filter）。
- **限流与配额**：按 user/tenant/skill 维度配置；异常调用报警。

## 六、审计、日志与错误码规范 📊

### （一）审计日志字段（每次调用必记）

- `rid`（X-Request-Id）、`cnv`（X-Conversation-Id）、`sub`、`tid`、`op`、`scp`、`roles`
- `request_param_hash`（避免记录敏感明文）、`status_code`、`latency_ms`、`result_summary`

### （二）错误码建议（skills 统一）

- **400**：参数不合法（schema/业务校验失败）
- **401**：token 无效/过期/重放
- **403**：scope/role/op 不满足
- **404**：资源不存在或不属于该 tenant（统一 404，避免侧信道泄露）

## 七、执行计划与排期（约 6 周）🗓️

| 阶段 | 日期 | 关键工作 | 产出物 | 责任角色（建议） |
| :--- | :--- | :--- | :--- | :--- |
| **第 1 周** | 2026-03-02 ~ 2026-03-08 | - 确定规范：TIA claims/header/scope 命名/审计字段<br>- 梳理 roles->scopes 映射<br>- 落地 Skill Registry 数据结构/配置格式 | - 技术方案评审通过<br>- Registry 初版<br>- roles->scopes 映射表 v1 | Backend（平台/网关）<br>业务服务（Skills）<br>SecOps<br>QA |
| **第 2 周** | 2026-03-09 ~ 2026-03-15 | - 实现 Gateway/Orchestrator：动态裁剪 tools（按 scope）<br>- 实现 TIA 签发（iss/aud/op/scp/jti/exp）<br>- 接入基础审计日志与 traceId 串联 | - 可生成 TIA 并调用测试接口<br>- 工具裁剪生效<br>- 审计日志可检索 | Backend（平台/网关）<br>业务服务（Skills）<br>SecOps<br>QA |
| **第 3 周** | 2026-03-16 ~ 2026-03-22 | - 改造数字孪生模块 skill：/api/v6/data/*<br>- skills 侧 JWT 验签 + op/scope 校验 + jti 防重放<br>- DAO 侧 tenant filter 强制化 | - Scene Details skill 通过联调<br>- 跨租户访问被拒绝/404<br>- 重放攻击验证通过 | Backend（平台/网关）<br>业务服务（Skills）<br>SecOps<br>QA |
| **第 4 周** | 2026-03-23 ~ 2026-03-29 | - 参数校验（JSON Schema）与业务校验<br>- 响应裁剪/脱敏模板（output_profile）<br>- 限流与配额策略（user/tenant/skill） | - 返回裁剪上线<br>- 敏感字段不入模型<br>- 限流压测通过 | Backend（平台/网关）<br>业务服务（Skills）<br>SecOps<br>QA |
| **第 5 周** | 2026-03-30 ~ 2026-04-05 | - 扩展 多功能模块高频 skills（list/update/export 等）并纳入 registry<br>- 补齐敏感操作二次确认策略（如 delete/export 大范围）<br>- 完善告警与监控面板（成功率/延迟/拒绝率） | - 多技能灰度可用<br>- 敏感操作策略生效<br>- 监控告警上线 | Backend（平台/网关）<br>业务服务（Skills）<br>SecOps<br>QA |
| **第 6 周** | 2026-04-06 ~ 2026-04-12 | - 安全测试与渗透验证（越权/注入/重放/DoS）<br>- 回归测试与文档沉淀（接口规范/接入指南）<br>- 上线准备与发布复盘 | - 安全测试报告<br>- 接入指南 v1<br>- 生产发布/灰度完成 | Backend（平台/网关）<br>业务服务（Skills）<br>SecOps<br>QA |

### （一）里程碑验收摘要 🏁

- **M1**：TIA + tool 裁剪 + registry 初版可用（第 2 周末）。
- **M2**：Skill 完成双层授权与 tenant 强隔离（第 3 周末）。
- **M3**：裁剪/脱敏/限流与扩展技能完成灰度（第 5 周末）。
- **M4**：安全测试通过并具备上线条件（第 6 周末）。