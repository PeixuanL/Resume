# License Key 签发运营手册（SOP）

> **适用角色**：DataMesh 运营团队、交付工程师  
> **最后更新**：2026-03-27  
> **版本**：v1.0

---

## 1. 概述

### 1.1 两种部署模式

| 模式 | 说明 | LICENSE_JWT 设置 |
|------|------|-----------------|
| **SaaS 模式** | DataMesh 托管，全模块默认解锁 | **不设置**（留空即全模块开放） |
| **On-premise 模式** | 客户自行部署，按合同授权模块 | **必须设置**，由 DataMesh 签发 |

> SaaS 模式下无需任何 License 操作。本手册主要针对 **on-premise 客户**。

### 1.2 密钥体系

- **算法**：RSA 2048 位非对称加密 + JWT 签名
- **私钥**：由 DataMesh 保管，用于签发 JWT（**绝不对外披露，不提交 git**）
- **公钥**：内嵌在 Docker 镜像中（`backend/src/main/resources/license/license-public.key`），用于客户端验签
- **JWT**：包含授权信息，离线可验证，无需联网回调

### 1.3 License 状态说明

| 状态 | 含义 | 系统行为 |
|------|------|----------|
| `VALID` | 有效 | 正常使用 |
| `EXPIRING_SOON` | 30 天内到期 | 正常使用，显示到期警告 |
| `GRACE_PERIOD` | 已过期，在 7 天宽限期内 | 只读模式，功能受限 |
| `EXPIRED` | 已过期且超过宽限期 | 拒绝访问受授权模块 |
| `UNLICENSED` | 未设置 LICENSE_JWT（SaaS 模式） | 全模块解锁 |

---

## 2. 签发前准备

### 2.1 私钥文件保管原则

- 私钥统一存放在 DataMesh 内部**安全密钥管理系统**（如 1Password 团队库）
- 操作时临时取出到本机，操作完成后立即清除
- **严禁**提交到任何 git 仓库
- **严禁**通过邮件、IM 等明文渠道传输

### 2.2 签发前需从客户获取的信息

| 字段 | 说明 | 示例 |
|------|------|------|
| **客户公司名** (`customer`) | 合同中的正式名称 | `横河川仪有限公司` |
| **租户 ID** (`tenantId`) | 唯一 UUID，由交付工程师生成 | `550e8400-e29b-41d4-a716-446655440000` |
| **授权模块** (`allowedModules`) | 合同约定的模块列表 | `trafficops,fms,pdm` |
| **到期日** (`expiresAt`) | ISO 格式 | `2027-12-31` |
| **最大用户数** (`maxUsers`) | 合同约定 | `100` |
| **最大连接器数** (`maxConnectors`) | 合同约定 | `20` |

### 2.3 可用模块名清单

| 模块名 | 说明 |
|--------|------|
| `trafficops` | 交通运营管理 |
| `fms` | 设施管理系统 |
| `heatops` | 热力运营 |
| `pdm` | 预测性设备维护 |
| `semiops` | 半导体运营 |
| `wayfinding` | 室内导航 |
| `visionops` | 视觉运营（AI 视频分析） |
| `dfslite` | 轻量数据接入 |
| `compliance` | 合规管理 |
| `smtops` | 智慧制造运营 |

---

## 3. 签发步骤

### 3.1 完整签发命令

```bash
# Step 1: 编译签发工具（首次使用或代码更新后）
cd backend
mvn compile -pl . -q

# Step 2: 运行签发工具
mvn exec:java \
  -Dexec.mainClass="com.datamesh.agent.license.LicenseKeyGenerator" \
  -Dexec.args="'客户公司名' 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' 'module1,module2' '2027-12-31' 100 20 'on-premise'"

# Step 3: 保存输出
# - PUBLIC KEY  → 通常无需更新（已内嵌在镜像中）
# - PRIVATE KEY → 保存到安全存储，操作完成后从本机删除
# - LICENSE JWT → 通过安全渠道发给客户（加密邮件 / 交付门户）
```

### 3.2 注意事项

- 每个 `tenantId` 唯一对应一个客户，**不允许复用**
- 同一客户续期时保持 `tenantId` 不变，只更新 `expiresAt`
- 签发记录（不含私钥）应记录到内部系统：签发时间、客户名、tenantId、模块列表、到期日、操作人

---

## 4. 客户部署说明

### 4.1 设置 LICENSE_JWT

**Docker Compose（推荐）** — 在 `.env` 文件中添加：
```env
LICENSE_JWT=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**docker run**：
```bash
docker run -d -e LICENSE_JWT="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." jiel/factverse-backend:latest
```

**Kubernetes**：
```bash
kubectl create secret generic factverse-license \
  --from-literal=LICENSE_JWT="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
# Deployment 中通过 secretKeyRef 引用
```

### 4.2 验证 License 状态

```bash
curl -s https://<客户域名>/api/v1/license/status \
  -H "Authorization: Bearer ADMIN_TOKEN" | python3 -m json.tool
```

期望返回：
```json
{
  "status": "VALID",
  "customer": "横河川仪有限公司",
  "allowedModules": ["trafficops", "fms", "pdm"],
  "expiresAt": "2027-12-31",
  "daysUntilExpiry": 365
}
```

---

## 5. 续期流程

续期 = 重新签发新 JWT，更新 `expiresAt`，**不需要重新构建或发布镜像**。

- 提前 60 天发送续期提醒
- 提前 30 天：状态变为 `EXPIRING_SOON`，客户界面出现警告
- 到期后 7 天内：`GRACE_PERIOD`，系统降级为只读模式

```bash
# 使用相同 tenantId，更新 expiresAt
mvn exec:java \
  -Dexec.mainClass="com.datamesh.agent.license.LicenseKeyGenerator" \
  -Dexec.args="'客户公司名' '原始-tenant-id-uuid' 'module1,module2' '2028-12-31' 100 20 'on-premise'"

# 客户更新 .env 后重启 backend（无需重新拉取镜像）
# docker compose restart backend
```

---

## 6. 吊销流程

> License JWT 为离线验证，**不支持实时在线吊销**。

**正常吊销**（合同到期不续签）：不执行续期，JWT 到期后自动 `EXPIRED`，7 天宽限期后拒绝访问。

**紧急吊销**：联系客户技术负责人，要求删除 `LICENSE_JWT` 环境变量并重启 backend。系统变为 `UNLICENSED`（on-premise 模式下拒绝访问所有模块）。

---

## 7. 常见问题

| 现象 | 原因 | 解决 |
|------|------|------|
| `EXPIRED` | JWT 过期且超过宽限期 | 重新签发新 JWT |
| `GRACE_PERIOD` | JWT 过期但在宽限期内 | 尽快续签 |
| `UNLICENSED` | `LICENSE_JWT` 未设置 | 检查 `.env`，确认变量已配置并重启 |
| 模块 403 | 该模块不在 `allowedModules` | 确认合同，重新签发 |
| JWT 验签失败 | 私钥与公钥不匹配 | 用正确私钥重新签发 |
| 状态异常 | 服务器时间不准 | 检查 NTP 时间同步 |

---

## 8. 完整示例：横河川仪

**合同信息**：工厂运维 + 预测维护 + 合规，3年，150用户，30连接器

```bash
mvn exec:java \
  -Dexec.mainClass="com.datamesh.agent.license.LicenseKeyGenerator" \
  -Dexec.args="'横河川仪有限公司' 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' 'trafficops,pdm,compliance' '2029-03-31' 150 30 'on-premise'"
```

客户 `.env`：
```env
LICENSE_JWT=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...（完整 JWT）
```

验证：
```bash
curl -s https://factverse.yokogawa-chuanyi.internal/api/v1/license/status \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

*本文档由 DataMesh 工程团队维护。如有疑问请联系交付工程师。*
