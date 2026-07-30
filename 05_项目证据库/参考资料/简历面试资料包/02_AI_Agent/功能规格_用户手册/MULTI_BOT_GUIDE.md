# 多 Bot 协调开发指南

> 当多个 AI agent 同时在同一代码库工作时，如何避免冲突

## 问题场景

2026-02-05 遇到的典型冲突：

| 冲突类型 | 示例 | 影响 |
|----------|------|------|
| 重复实体 | `AuditLog.java` 在两个包 | Hibernate 启动失败 |
| 重复注解 | 多处 `@FilterDef` | Hibernate 启动失败 |
| 列名不一致 | `config_key` vs `key` | Flyway 迁移失败 |
| YAML 重复 key | 两个 `management:` | Spring Boot 启动失败 |

**根本原因**：两个 bot 同时修改同一代码库，缺乏协调机制。

---

## 解决方案

### 方案 1: 分支隔离 ⭐ 推荐

```
main                          ← 稳定分支，只合并 review 后的代码
├── goku/feature-xxx          ← Bot A 的工作分支
└── cursor/feature-yyy        ← Bot B 的工作分支
```

**流程**：
1. 每个 bot 在自己的分支工作
2. 完成功能后提 PR
3. 合并前必须 rebase main
4. PR review 时发现并解决冲突

**优点**：Git 原生支持，冲突可见，可回滚

---

### 方案 2: 模块划分

```yaml
Bot A (Goku):
  - backend/
  - ai-engine/
  - 数据库迁移

Bot B (Cursor):
  - frontend/
  - docs/
  - 测试脚本
```

**规则**：
- 按模块分工，避免同时修改同一文件
- 接口定义 (DTO, API) 是唯一交叉点
- 修改接口前需要通知对方

---

### 方案 3: 锁文件机制

```json
// .bot-locks.json (放在项目根目录)
{
  "locks": [
    {
      "path": "backend/src/main/java/com/datamesh/agent/model",
      "owner": "goku",
      "since": "2026-02-05T22:00:00Z",
      "reason": "多租户改造",
      "expires": "2026-02-05T23:00:00Z"
    }
  ]
}
```

**规则**：
1. Bot 修改目录前检查锁文件
2. 如果被锁，等待或选择其他任务
3. 完成后释放锁 (删除条目)
4. 锁有过期时间，防止死锁

---

### 方案 4: 实时协调协议

**开始任务前**：
```bash
git fetch origin
git log origin/main --oneline -5  # 检查最近提交
# 如果发现其他 bot 正在改同一模块，等待或沟通
```

**工作中**：
- 小步提交，频繁 push
- 每 30 分钟 pull 一次
- 大改动前先 commit 现有工作

**完成后**：
```bash
git pull --rebase origin main
# 解决冲突
git push
```

---

## 推荐实践

### 立即可行 ✅

1. **分支工作**：每个 bot 用 `{bot-name}/{feature}` 分支
2. **频繁同步**：每次任务前 `git pull`
3. **避免热点**：不要同时改 `model/` 和 `migration/`
4. **小步提交**：一个功能一个 commit，及时 push

### 高风险目录 ⚠️

这些目录容易冲突，修改前需要额外小心：

```
backend/src/main/java/com/datamesh/agent/model/     # 实体类
backend/src/main/java/com/datamesh/agent/config/    # 配置类
backend/src/main/resources/db/migration/            # 数据库迁移
backend/src/main/resources/application-*.yml        # Spring 配置
frontend/src/router/                                # 路由配置
frontend/src/stores/                                # 状态管理
```

### 安全目录 ✅

这些目录相对独立，冲突风险低：

```
docs/                           # 文档
tests/                          # 测试
frontend/src/views/             # 独立页面
frontend/src/components/        # 独立组件
ai-engine/routers/              # 独立路由
```

---

## 冲突修复清单

当遇到冲突时，按以下顺序排查：

### 1. Hibernate 启动失败

```bash
# 检查重复实体
find . -name "*.java" | xargs grep -l "@Entity" | xargs grep -h "class.*{" | sort | uniq -d

# 检查重复 FilterDef
grep -r "@FilterDef" --include="*.java" | grep -v "package-info"
```

### 2. Flyway 迁移失败

```bash
# 检查版本冲突
ls backend/src/main/resources/db/migration/*.sql | sed 's/.*V\([0-9]*\).*/\1/' | sort -n | uniq -d

# 检查列名一致性
grep -r "system_config" backend/src/main/resources/db/migration/
```

### 3. Spring Boot 启动失败

```bash
# 检查 YAML 重复 key
grep -n "^[a-z]*:" backend/src/main/resources/application*.yml | sort -t: -k3 | uniq -d -f2
```

---

## 工具建议

### Git Hooks

```bash
# .git/hooks/pre-push
#!/bin/bash
# 推送前检查是否有其他 bot 的最新提交
git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
if [ $LOCAL != $REMOTE ]; then
  echo "⚠️ 远程有新提交，请先 pull --rebase"
  exit 1
fi
```

### CI 检查

```yaml
# .github/workflows/conflict-check.yml
name: Conflict Check
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check duplicate entities
        run: |
          find . -name "*.java" -exec grep -l "@Entity" {} \; | \
            xargs grep -h "public class" | sort | uniq -d && exit 1 || exit 0
```

---

## 总结

| 方案 | 复杂度 | 效果 | 适用场景 |
|------|--------|------|----------|
| 分支隔离 | 低 | 高 | 所有场景 ⭐ |
| 模块划分 | 低 | 中 | 功能明确分工 |
| 锁文件 | 中 | 高 | 频繁交叉修改 |
| 实时协调 | 高 | 最高 | 紧密协作 |

**核心原则**：小步提交、频繁同步、避免热点、及时沟通。

---

*文档版本: 2026-02-05*
*作者: Goku (DataMesh 数字员工)*
