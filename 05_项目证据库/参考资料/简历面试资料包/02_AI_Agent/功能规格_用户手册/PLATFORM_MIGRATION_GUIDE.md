# Platform Migration Guide - Phase 1

**版本**: 1.0
**日期**: 2026-02-22
**作者**: MacProBot (DE #5)

---

## 概述

本文档描述如何从现有的模块级实现迁移到统一的 Platform 基盘服务。

---

## Platform 服务映射

### 1. Agent Context 迁移

#### 现有实现（ECM）
```java
// ECM 自己管理 Agent 上下文
String agentId = "ecm-agent-" + UUID.randomUUID();
Map<String, Object> context = new HashMap<>();
context.put("userId", userId);
// 存储在 ECM 自己的表中
```

#### Platform 实现
```java
@Autowired
AgentContextService agentContextService;

// 注册 Agent
AgentContext context = agentContextService.registerAgent(
    "ECM_AGENT",
    userId,
    List.of("document.read", "document.write", "workflow.approve")
);

// 获取上下文
AgentContext ctx = agentContextService.getAgentContext(agentId);

// 更新上下文
agentContextService.updateAgentContext(agentId, Map.of(
    "currentDocument", documentId
));
```

**迁移步骤**:
1. ✅ 添加 `AgentContextService` 依赖注入
2. ✅ 替换自定义 Agent ID 生成为 `registerAgent()`
3. ✅ 使用 Platform 的会话管理
4. ✅ 迁移现有的 Agent 上下文数据到 Platform 表

---

### 2. Knowledge Graph 迁移

#### 现有实现（ECM）
```java
// ECM 自己的知识图谱实现
@Autowired
AgentKnowledgeNodeRepository knowledgeNodeRepository;

AgentKnowledgeNode node = new AgentKnowledgeNode();
node.setNodeType("EQUIPMENT");
node.setProperties(properties);
knowledgeNodeRepository.save(node);
```

#### Platform 实现
```java
@Autowired
KnowledgeGraphService kgService;

// 创建实体
KnowledgeEntity entity = kgService.createEntity(
    "Equipment",
    equipment.getName(),
    Map.of(
        "equipmentId", equipment.getId(),
        "type", equipment.getType(),
        "location", equipment.getLocation()
    )
);

// 创建关系
kgService.createRelationship(
    documentEntity.getId(),
    equipmentEntity.getId(),
    "EQUIPMENT_HAS_DOCUMENT",
    Map.of("relationType", "MANUAL")
);

// 语义搜索
List<KnowledgeEntity> results = kgService.semanticSearch(
    "maintenance manual for chiller",
    "Document",
    10
);
```

**迁移步骤**:
1. ✅ 替换 `AgentKnowledgeNodeRepository` 为 `KnowledgeGraphService`
2. ✅ 将现有节点数据迁移到 `platform_knowledge_entity` 表
3. ✅ 将现有边数据迁移到 `platform_knowledge_relationship` 表
4. ✅ 更新 pgvector 索引

---

### 3. Tool Framework 迁移

#### 现有实现（ECM）
```java
// ECM 自己的工具注册
@AgentTool(name = "search_documents")
public class SearchDocumentsTool {
    public ToolResult execute(ToolRequest request) {
        // 实现
    }
}

// 自己的注册表
ToolRegistry registry = new ToolRegistry();
registry.register("search_documents", new SearchDocumentsTool());
```

#### Platform 实现
```java
@AgentTool(name = "search_documents", module = "ECM")
public class SearchDocumentsTool extends BaseAgentTool {
    
    @Override
    protected ToolResult doExecute(ToolRequest request) {
        String query = request.getParameter("query");
        
        // 使用 Platform 提供的服务
        List<KnowledgeEntity> results = knowledgeGraphService
            .semanticSearch(query, "Document", 10);
        
        return ToolResult.success(Map.of("documents", results));
    }
    
    @Override
    public ToolSchema getSchema() {
        return ToolSchema.builder()
            .name("search_documents")
            .description("Search documents by query")
            .module("ECM")
            .inputParameters(List.of(
                ToolSchema.ParameterDefinition.builder()
                    .name("query")
                    .type("string")
                    .required(true)
                    .build()
            ))
            .build();
    }
}

// 自动注册（Spring Boot 自动扫描）
// 或手动注册
@Autowired
ToolRegistryService toolRegistry;

toolRegistry.registerTool(new SearchDocumentsTool());
```

**迁移步骤**:
1. ✅ 继承 `BaseAgentTool` 而非自定义基类
2. ✅ 实现 `getSchema()` 方法定义工具接口
3. ✅ 使用 Platform 提供的 `AgentContextService` 和 `KnowledgeGraphService`
4. ✅ 注册到 Platform 工具注册表

---

### 4. Embedding Service 迁移

#### 现有实现（ECM）
```java
// ECM 自己调用 OpenAI API
String embeddingJson = openAiClient.embed(text);
float[] embedding = parseEmbedding(embeddingJson);
// 存储到 ECM 自己的表
```

#### Platform 实现
```java
@Autowired
EmbeddingService embeddingService;

// 生成嵌入向量
float[] embedding = embeddingService.generateEmbedding(text);

// 批量生成
List<float[]> embeddings = embeddingService.batchGenerate(texts);

// 相似度搜索
List<SimilarityResult> similar = embeddingService.findSimilar(embedding, 10);
```

**迁移步骤**:
1. ✅ 移除 OpenAI API 直接调用
2. ✅ 使用 Platform 的 `EmbeddingService`
3. ✅ 利用 Platform 的缓存机制

---

### 5. LLM Service 迁移

#### 现有实现（ECM/Advisor）
```java
// Advisor 自己调用 LLM
String prompt = "Summarize: " + document.getContent();
String response = llmClient.complete(prompt);
```

#### Platform 实现
```java
@Autowired
LLMService llmService;

// 使用 Prompt 模板
String prompt = llmService.renderPrompt("document-summary", Map.of(
    "title", document.getTitle(),
    "content", document.getContent()
));

// 调用 LLM
CompletionResponse response = llmService.complete(
    CompletionRequest.builder()
        .prompt(prompt)
        .model("gpt-4-turbo")
        .maxTokens(500)
        .build()
);

String summary = response.text();
```

**迁移步骤**:
1. ✅ 移除直接的 LLM API 调用
2. ✅ 使用 Platform 的 Prompt 模板
3. ✅ 利用 Platform 的缓存和限流
4. ✅ 使用 Platform 的 Token 计费追踪

---

### 6. Push Service 迁移

#### 现有实现（ECM）
```java
// ECM 自己的推送
webSocketService.sendToUser(userId, notification);
```

#### Platform 实现
```java
@Autowired
PushService pushService;

// 推送给用户
pushService.pushToUser(userId, PushMessage.builder()
    .type("DOCUMENT_APPROVED")
    .title("Document Approved")
    .content("Your document has been approved")
    .payload(Map.of("documentId", documentId))
    .build());

// 推送给 Agent
pushService.pushToAgent(agentId, message);

// 广播到频道
pushService.broadcast("document-updates", payload);
```

**迁移步骤**:
1. ✅ 替换 WebSocket 直接调用
2. ✅ 使用 Platform 的推送服务
3. ✅ 利用订阅机制

---

## 数据迁移脚本

### ECM → Platform 知识图谱迁移

```sql
-- 迁移知识节点
INSERT INTO platform_knowledge_entity (id, type, name, properties, source_module, tenant_id, created_at)
SELECT 
    'ecm-' || id::text,
    node_type,
    properties->>'name',
    properties,
    'ECM',
    tenant_id,
    created_at
FROM agent_knowledge_node;

-- 迁移知识关系
INSERT INTO platform_knowledge_relationship (id, from_entity_id, to_entity_id, type, properties, source_module, tenant_id, created_at)
SELECT 
    'ecm-rel-' || id::text,
    'ecm-' || source_id::text,
    'ecm-' || target_id::text,
    relation_type,
    properties,
    'ECM',
    tenant_id,
    created_at
FROM agent_knowledge_edge;
```

---

## 依赖更新

### pom.xml 更新

```xml
<!-- 添加 Platform 依赖 -->
<dependency>
    <groupId>com.datamesh.agent</groupId>
    <artifactId>platform-core</artifactId>
    <version>1.0.0</version>
</dependency>
```

---

## 迁移检查清单

### Phase 1: 准备
- [ ] 审计现有模块的重复代码
- [ ] 识别可以迁移到 Platform 的功能
- [ ] 创建迁移计划和时间表

### Phase 2: 实施
- [ ] 更新模块依赖
- [ ] 替换服务调用
- [ ] 迁移数据
- [ ] 更新测试

### Phase 3: 验证
- [ ] 运行集成测试
- [ ] 验证功能完整性
- [ ] 性能测试
- [ ] 安全审计

### Phase 4: 清理
- [ ] 删除重复代码
- [ ] 更新文档
- [ ] 归档旧实现

---

## 风险和缓解

| 风险 | 缓解措施 |
|------|---------|
| 迁移过程中服务中断 | 渐进式迁移，保持向后兼容 |
| 数据丢失 | 完整备份，迁移验证 |
| 性能下降 | 性能测试，优化 Platform 服务 |
| 功能回归 | 完整测试覆盖 |

---

## 时间表

### Week 1
- ✅ Platform 基盘接口定义
- ✅ Platform 基础实现
- ✅ 数据库 Schema 设计

### Week 2
- [ ] ECM 迁移到 Platform
- [ ] TrafficOps 迁移评估
- [ ] HeatOps 迁移评估

### Week 3
- [ ] 跨模块功能验证
- [ ] 性能优化
- [ ] 文档完善

---

**状态**: 🟢 IN PROGRESS
**下一里程碑**: ECM 完成迁移到 Platform
