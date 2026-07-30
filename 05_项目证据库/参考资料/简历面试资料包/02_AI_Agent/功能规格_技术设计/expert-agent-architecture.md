# AI 专家智能体架构设计

> 作者: Goku (Architecture Review)  
> 日期: 2026-02-01  
> 状态: RFC (Request for Comments)

---

## 1. 现状评估

### ✅ 已有基础
- ExpertAgent 模型（code/domain/systemPrompt/domainConfig/版本/继承）
- ExpertKnowledgeRule（规则编码/条件表达式/动作规格）
- ExpertEquipmentBinding（专家-设备多对多绑定）
- Python ExpertDiagnosisEngine（规则匹配 + LLM prompt 生成）
- REST API（专家 CRUD + 上下文注入 + 设备专家查询）
- 前端专家卡片列表 + 启停开关

### 🔴 核心缺失
- **无 LLM 接入** — 有 prompt 生成但没连大模型
- **规则引擎太弱** — 只做了 sensor_type 简单匹配，无真正的 CEP
- **无知识库** — 专家知识只有 JSON 规则，缺少文档/向量检索
- **无协作机制** — 多专家无法联合诊断
- **无反馈闭环** — 诊断结果无法回流优化专家模型
- **无自动生成** — 不能从设备手册自动生成专家

---

## 2. 目标架构

```
┌─────────────────────────────────────────────────┐
│                   前端交互层                      │
│  专家对话 │ 诊断面板 │ 知识管理 │ 反馈评价        │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              专家路由器 (Expert Router)            │
│  接收诊断请求 → 选择专家 → 编排执行 → 汇总结果    │
└──┬──────────┬──────────┬──────────┬─────────────┘
   │          │          │          │
┌──▼──┐  ┌───▼──┐  ┌───▼──┐  ┌───▼──┐
│振动  │  │温度  │  │电气  │  │通用  │  ← 领域专家
│专家  │  │专家  │  │专家  │  │专家  │
└──┬──┘  └───┬──┘  └───┬──┘  └───┬──┘
   │         │         │         │
┌──▼─────────▼─────────▼─────────▼────────────────┐
│              知识层 (Knowledge Layer)              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐  │
│  │规则引擎│ │文档RAG │ │案例库  │ │参数阈值  │  │
│  │(CEP)   │ │(向量)  │ │(历史)  │ │(动态)    │  │
│  └────────┘ └────────┘ └────────┘ └──────────┘  │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              推理层 (Inference Layer)              │
│  ┌─────────┐ ┌─────────┐ ┌──────────────────┐   │
│  │ML 检测  │ │趋势预测 │ │LLM 推理          │   │
│  │(现有)   │ │(现有)   │ │(GPT-4/Claude)    │   │
│  └─────────┘ └─────────┘ └──────────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## 3. 分阶段实施计划

### Phase 1: 专家引擎强化（2-3 周）

#### 1.1 LLM 接入层
```
优先级: P0 — 这是让专家"活起来"的关键
```

**后端 (Java):**
- [ ] `LlmGateway` 接口 + 多 provider 实现
  - `AzureOpenAiProvider` — GPT-4o（DataMesh 可能已有 Azure 账号）
  - `AnthropicProvider` — Claude（备选）
  - `OllamaProvider` — 本地部署（开发/演示用，无需 API Key）
  - 统一接口：`chat(messages, model, temperature, maxTokens) → CompletableFuture<String>`
- [ ] `application.yml` 配置
  ```yaml
  llm:
    provider: azure-openai  # azure-openai | anthropic | ollama
    azure-openai:
      endpoint: ${AZURE_OPENAI_ENDPOINT}
      api-key: ${AZURE_OPENAI_KEY}
      deployment: gpt-4o
    ollama:
      url: http://localhost:11434
      model: qwen2.5:14b
  ```
- [ ] 流式输出支持（SSE）— 前端实时显示诊断过程

**Python AI Engine:**
- [ ] `/ai/expert/diagnose-llm` 端点
  - 接收：anomaly_result + expert_context + sensor_data
  - 组装 prompt → 调 LLM → 结构化解析输出
  - 返回：诊断结论 + 原因分析 + 建议步骤 + 置信度

#### 1.2 专家对话系统
```
优先级: P0 — 让用户能"和专家对话"
```

- [ ] **对话 API**
  - `POST /api/v1/experts/{id}/chat` — 发送消息
  - `GET /api/v1/experts/{id}/chat/history?sessionId=` — 获取历史
  - 对话上下文自动注入：设备数据 + 传感器读数 + 历史告警
- [ ] **对话会话管理**
  - `ChatSession` 模型（sessionId, expertId, equipmentId, messages[], createdAt）
  - 自动过期（24h）
  - 上下文窗口管理（保留最近 20 轮 + 摘要）
- [ ] **前端对话 UI**
  - 设备详情页侧边抽屉：与绑定专家对话
  - Markdown 渲染（专家回复含代码/表格/列表）
  - 流式输出（打字机效果）
  - 快捷问题预设（"这个设备最近怎么样？""分析一下振动趋势"）

#### 1.3 规则引擎升级
```
优先级: P1 — 让规则匹配更智能
```

- [ ] **条件表达式增强**
  ```json
  {
    "type": "composite",
    "operator": "AND",
    "conditions": [
      { "sensor": "vibration", "metric": "anomaly_rate", "op": ">", "value": 0.1 },
      { "sensor": "temperature", "metric": "trend", "op": "==", "value": "rising" },
      { "sensor": "vibration", "metric": "max_value", "op": ">", "value": 8.0 }
    ]
  }
  ```
- [ ] **动作规格增强**
  ```json
  {
    "diagnosis": "轴承磨损导致振动异常，伴随温升",
    "severity": "HIGH",
    "confidence": 0.85,
    "root_causes": [
      { "cause": "轴承内圈磨损", "probability": 0.6 },
      { "cause": "润滑不足", "probability": 0.3 },
      { "cause": "安装不当", "probability": 0.1 }
    ],
    "steps": [
      "停机检查轴承游隙",
      "测量振动频谱，确认是否有 BPFI 特征频率",
      "检查润滑油液位和品质",
      "必要时更换轴承"
    ],
    "spare_parts": ["SKF 6208-2Z 轴承", "润滑脂 Shell Gadus S2"],
    "estimated_hours": 4,
    "create_work_order": true,
    "work_order_priority": "HIGH"
  }
  ```
- [ ] **Python 规则执行器重写**
  - 支持 composite conditions（AND/OR/NOT）
  - 支持 metrics 计算（anomaly_rate, trend, max, avg, stddev）
  - 规则优先级排序 + 互斥处理

---

### Phase 2: 知识库系统（3-4 周）

#### 2.1 文档知识库 (RAG)
```
优先级: P1 — 让专家有"记忆"和"参考资料"
```

- [ ] **文档管理**
  - `ExpertDocument` 模型（expertId, title, content, docType, embedding）
  - docType: `MANUAL`（设备手册）、`CASE`（维修案例）、`SOP`（操作规程）、`FAQ`
  - 上传 API：支持 PDF / Word / 纯文本
  - 文本分块（chunk）：按段落 + 重叠窗口（512 tokens, overlap 64）
- [ ] **向量存储**
  - 方案 A（推荐）：PostgreSQL + pgvector 扩展（不加新组件）
  - 方案 B：独立 Milvus/Qdrant（大规模场景）
  - Embedding 模型：`text-embedding-3-small`（OpenAI）或本地 `bge-base-zh-v1.5`
- [ ] **检索增强生成 (RAG)**
  - 诊断时自动检索相关文档片段（Top-5）
  - 注入 LLM prompt 作为参考上下文
  - 引用标注（回复中标明信息来源）

#### 2.2 案例学习库
```
优先级: P2 — 从历史维修中学习
```

- [ ] **案例自动收集**
  - Alert → WorkOrder → 完工反馈 → 自动归档为案例
  - 案例结构：{症状, 诊断, 根因, 维修措施, 耗时, 备件, 效果评价}
- [ ] **相似案例检索**
  - 新异常出现时，检索历史相似案例
  - 相似度 = 向量相似度 × 设备类型权重 × 时间衰减
- [ ] **案例推荐**
  - 诊断结果附带："参考历史案例 #127：同类设备 2025-08 发生类似故障，更换轴承后恢复"

#### 2.3 动态阈值管理
```
优先级: P2 — 让阈值随环境自适应
```

- [ ] **基线学习**
  - 每台设备/传感器自动计算 30 天 baseline（均值、标准差、趋势）
  - 季节性修正（夏季温度 baseline 高于冬季）
  - 负载修正（高负载时振动 baseline 适当放宽）
- [ ] **自适应阈值**
  - `warn_threshold = baseline + 2.5σ`
  - `crit_threshold = baseline + 4σ`
  - 人工可覆盖，覆盖后锁定直到手动解锁

---

### Phase 3: 多专家协作（2-3 周）

#### 3.1 专家路由器
```
优先级: P1 — 复杂问题需要多专家会诊
```

- [ ] **路由策略**
  - `SINGLE` — 匹配最佳单个专家
  - `PARALLEL` — 同时咨询多个专家，汇总结果
  - `CHAIN` — 串行：初筛专家 → 深度专家 → 验证专家
  - `VOTE` — 多专家投票，取共识结论
- [ ] **路由逻辑**
  ```
  1. 根据 equipment.type + sensor.type 查找绑定专家
  2. 如果 1 个专家：SINGLE
  3. 如果多个同 domain：VOTE（同领域专家投票）
  4. 如果多个跨 domain：PARALLEL（跨领域各出诊断）
  5. 高严重度且分歧大：CHAIN（加入通用专家做仲裁）
  ```
- [ ] **结果汇总器**
  - 合并多专家诊断
  - 标注共识 vs 分歧
  - 计算综合置信度

#### 3.2 专家继承与特化
```
优先级: P2 — 专家也有"师徒关系"
```

- [ ] **继承机制**（模型已有 parent_id）
  - 子专家继承父专家的 systemPrompt + rules
  - 可覆盖/扩展特定规则
  - 例：`振动专家 → 泵振动专家 → PUMP-001 专属振动专家`
- [ ] **自动特化**
  - 通用专家绑定到具体设备后，自动学习该设备特征
  - 积累足够案例后，提议创建设备专属专家

---

### Phase 4: 反馈闭环 & 持续优化（持续）

#### 4.1 诊断评价系统
```
优先级: P1 — 没有反馈就没有进步
```

- [ ] **评价采集**
  - 工单完成时，维修人员评价诊断准确度（1-5 星）
  - 可标注："诊断准确" / "部分准确" / "误诊" / "遗漏"
  - 补充实际根因（如果与诊断不同）
- [ ] **反馈数据模型**
  - `DiagnosisFeedback`（diagnosisId, rating, actualRootCause, comments, createdBy）
- [ ] **前端反馈 UI**
  - 工单完成页面嵌入评价组件
  - 告警解决时弹出快速评价

#### 4.2 专家自动调优
```
优先级: P3 — 高级能力，后期实现
```

- [ ] **规则置信度衰减**
  - 每条规则维护 `hit_count` + `accuracy_rate`
  - 准确率低于 60% 的规则自动降低优先级
  - 连续 5 次误判自动停用 + 通知管理员
- [ ] **Prompt 优化**
  - 收集 "好的诊断" 的 prompt/response 对
  - 定期用 few-shot examples 更新 system prompt
- [ ] **新规则建议**
  - 当 LLM 诊断多次匹配相同模式但无对应规则
  - 自动生成规则草稿 → 人工审核 → 上线

#### 4.3 专家性能看板
- [ ] 各专家诊断准确率
- [ ] 规则命中率排行
- [ ] LLM 调用量 & 成本
- [ ] 平均诊断耗时
- [ ] 反馈分布（好评/差评）

---

### Phase 5: 专家自动生成（4-6 周）

#### 5.1 从设备手册生成专家
```
优先级: P2 — 大规模场景的杀手锏
```

- [ ] **文档解析管线**
  - PDF/Word → 文本提取 → 章节分割
  - 识别：故障代码表、维修步骤、零件清单、参数范围
- [ ] **LLM 生成**
  - 输入：设备手册文本
  - 输出：ExpertAgent（systemPrompt + rules + domainConfig）
  - Prompt：
    ```
    你是一个设备维护专家生成器。根据以下设备手册内容，生成：
    1. 专家人设描述（systemPrompt）
    2. 关键故障模式的诊断规则（JSON 格式）
    3. 每条规则的条件表达式和处置方案
    ```
- [ ] **人工审核工作流**
  - AI 生成 → 草稿状态 → 管理员审核 → 上线
  - 支持逐条审核/修改规则

#### 5.2 从历史数据生成专家
- [ ] 分析设备历史告警 + 工单 + 维修记录
- [ ] 提取高频故障模式
- [ ] 自动生成对应规则

---

## 4. 技术选型建议

| 组件 | 推荐方案 | 备选 | 理由 |
|------|---------|------|------|
| LLM | Azure OpenAI GPT-4o | Claude API | DataMesh 大概率有 Azure 资源 |
| 本地 LLM | Ollama + Qwen2.5-14B | - | 开发/演示无需外网 |
| 向量存储 | pgvector (PostgreSQL) | Milvus | 不加新组件，够用 |
| Embedding | text-embedding-3-small | bge-base-zh-v1.5 | 中文+英文混合场景 |
| 流式输出 | SSE (Server-Sent Events) | WebSocket | 单向流更简单 |
| 规则引擎 | 自研 JSON CEP | Drools | 规则不复杂，不值得引入重框架 |

---

## 5. 实施优先级排序

```
┌─────────────────────────────────────────────┐
│  P0 (立即做 — MVP 差异化能力)                 │
│  ├─ 1.1 LLM 接入层 (Ollama 先跑通)           │
│  ├─ 1.2 专家对话系统 (设备页面加对话框)        │
│  └─ 4.1 诊断评价系统 (最简版)                 │
├─────────────────────────────────────────────┤
│  P1 (Sprint 2 — 知识增强)                     │
│  ├─ 1.3 规则引擎升级                          │
│  ├─ 2.1 文档知识库 RAG                        │
│  └─ 3.1 专家路由器                            │
├─────────────────────────────────────────────┤
│  P2 (Sprint 3 — 智能化)                       │
│  ├─ 2.2 案例学习库                            │
│  ├─ 2.3 动态阈值                              │
│  ├─ 3.2 专家继承与特化                        │
│  └─ 5.1 从手册自动生成专家                    │
├─────────────────────────────────────────────┤
│  P3 (持续优化)                                │
│  ├─ 4.2 专家自动调优                          │
│  ├─ 4.3 性能看板                              │
│  └─ 5.2 从历史数据生成专家                    │
└─────────────────────────────────────────────┘
```

---

## 6. 数据模型变更

### 新增表
```sql
-- 对话会话
CREATE TABLE chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL UNIQUE,
    expert_id BIGINT NOT NULL REFERENCES expert_agents(id),
    equipment_id BIGINT REFERENCES equipment(id),
    user_id BIGINT REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- 对话消息
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES chat_sessions(session_id),
    role VARCHAR(20) NOT NULL, -- 'user' | 'assistant' | 'system'
    content TEXT NOT NULL,
    metadata JSONB, -- tokens used, model, latency
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 专家文档
CREATE TABLE expert_documents (
    id BIGSERIAL PRIMARY KEY,
    expert_id BIGINT NOT NULL REFERENCES expert_agents(id),
    title VARCHAR(200) NOT NULL,
    doc_type VARCHAR(30) NOT NULL, -- MANUAL, CASE, SOP, FAQ
    content TEXT NOT NULL,
    chunk_index INT,
    embedding VECTOR(1536), -- pgvector
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 诊断反馈
CREATE TABLE diagnosis_feedbacks (
    id BIGSERIAL PRIMARY KEY,
    alert_id BIGINT REFERENCES alerts(id),
    work_order_id BIGINT REFERENCES work_orders(id),
    expert_id BIGINT REFERENCES expert_agents(id),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    accuracy VARCHAR(20), -- ACCURATE, PARTIAL, WRONG, MISSED
    actual_root_cause TEXT,
    comments TEXT,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. 与 FactVerse 集成展望

专家智能体是连接 AI Agent 和 DataMesh FactVerse 数字孪生的桥梁：

- **3D 可视化诊断**：专家诊断结果叠加到 FactVerse 3D 模型上
  - 红色高亮故障组件
  - AR 引导维修步骤
- **Inspector 集成**：专家自动生成巡检清单 → DataMesh Inspector
- **Robotics 联动**：专家判断需要物理检查 → 触发机器人巡检任务
- **Digital Thread**：设备全生命周期知识图谱（设计 → 制造 → 运维 → 退役）

---

*这个架构的核心哲学：专家不是功能，是产品。每个专家都是一个有知识、有性格、会学习的独立智能体。*
