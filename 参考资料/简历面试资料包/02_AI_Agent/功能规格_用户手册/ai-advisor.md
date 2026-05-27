# AI Advisor 用户指南

> 数字师傅 — 您的智能建筑运维助手

---

## 1. What is AI Advisor（什么是AI顾问）

AI Advisor（数字师傅）是 FactVerse 平台内置的 **RAG 增强对话式 AI 助手**。它结合了大语言模型（GPT-4.1-mini）与您建筑的实时数据库，能够回答设备状态、能耗优化、故障诊断等各类问题。

**核心特点：**

- 🤖 **随处可用** — 每个页面右下角都有浮动按钮，点击即可开始对话
- 📊 **基于真实数据** — 回答来自您的传感器、设备和历史记录，而非通用知识
- 🔧 **60 个内置工具**（见 `docs/06-ai-engine/advisor-tools.md`）— 不仅能回答问题，还能执行仿真、生成报告、创建工单等操作
- 🌐 **多语言支持** — 用中文提问就用中文回答，用英文提问就用英文回答

[Screenshot: AI Advisor floating button]

---

## 2. Getting Started（开始对话）

### 打开 AI Advisor

1. 在任意页面，点击右下角的 🤖 浮动按钮
2. 对话窗口弹出，输入框已准备就绪
3. 输入您的问题，按回车或点击发送

[Screenshot: AI Advisor chat window]

### 第一次对话

试试这些问题：

```
3号冷机什么状态？
```

```
今天的客流预测是多少？
```

AI Advisor 会自动调用合适的工具，从数据库查询实时数据，然后用自然语言回复您。

---

## 3. 60 AI Tools（60个AI工具）

AI Advisor 内置 **60 个专用工具**（见 `docs/06-ai-engine/advisor-tools.md`），根据您的问题自动选择调用：

| 工具名称 | 功能描述 | 示例提问 |
|---|---|---|
| `run_simulation` | 运行系统仿真模拟 | "帮我跑一个仿真" |
| `run_optimization` | 优化设备运行参数 | "优化冷机能耗" |
| `query_knowledge` | 查询知识库（RAG检索） | "AHU常见故障模式有哪些" |
| `get_equipment_status` | 查询设备实时状态 | "3号冷机什么状态" |
| `create_work_order` | 创建维修/保养工单 | "给3号冷机创建维修工单" |
| `run_doe` | 设计并运行DOE实验 | "做一个DOE实验" |
| `generate_report` | 生成各类运维报告 | "生成月度报告" |
| `fit_distribution` | 数据分布拟合分析 | "拟合这组数据的分布" |
| `run_dag_simulation` | 运行DAG有向图仿真 | "运行DAG仿真" |
| `optimize_layout` | 优化设备空间布局 | "优化设备布局" |
| `import_data` | 导入外部数据 | "导入传感器数据" |
| `calculate_emissions` | 计算碳排放量 | "计算碳排放" |
| `find_path` | 室内导航寻路 | "从大厅到机房怎么走" |
| `get_traffic_forecast` | 客流量预测 | "今天客流预测" |
| `get_traffic_patterns` | 客流规律分析 | "客流规律是什么" |
| `get_proactive_alerts` | 查看主动告警信息 | "有什么主动告警" |

> 💡 您不需要记住工具名称，用自然语言提问即可，AI 会自动匹配最合适的工具。

---

## 4. Ghost Chart（What-If 分析）

Ghost Chart 是 AI Advisor 的可视化对比功能，帮助您直观看到 **优化前 vs 优化后** 的效果。

[Screenshot: Ghost Chart comparison view]

### 工作原理

1. **Baseline（基线）** — 当前实际运行数据，显示为实线
2. **AI-Optimized（AI优化）** — AI 建议的优化方案效果，显示为虚线（"幽灵线"）

### 使用场景

- 对比不同冷机组合策略的能耗差异
- 预览调整送风温度设定值后的室内温度变化
- 评估设备替换方案的长期效益

### 如何触发

在对话中提问时，如果涉及优化或仿真，AI Advisor 会自动生成 Ghost Chart：

```
如果把冷冻水温度从7°C调到8°C，能耗会怎样变化？
```

---

## 5. Advisor Lab（深度智能实验室）

Advisor Lab 提供更深层次的 AI 分析能力，适合需要深入理解模型行为的用户。

[Screenshot: Advisor Lab interface]

### SHAP 可解释性分析

- 查看每个输入特征对预测结果的贡献度
- 理解 **为什么** AI 做出某个建议，而不仅仅是建议本身
- 支持特征重要性排序和交互效应分析

### Soft Sensor 训练

- 用历史数据训练虚拟传感器（软测量）
- 当物理传感器故障或缺失时，用 AI 模型替代
- 支持模型性能对比和验证

### 模型对比

- 同时运行多个 AI 模型，对比预测精度
- 选择最适合当前场景的模型配置
- 查看各模型的误差分布和置信区间

---

## 6. Language Support（语言支持）

AI Advisor 会自动检测您输入的语言，并用相同语言回复。

### 检测机制

系统通过 **ASCII 字符比例** 判断语言：

- ASCII 比例 **> 90%** → 判定为英文，用英文回复
- ASCII 比例 **≤ 90%** → 判定为中文（或其他非拉丁语言），用中文回复

### 示例

| 输入 | 回复语言 |
|---|---|
| "What is the status of chiller 3?" | English |
| "3号冷机什么状态？" | 中文 |
| "Chiller 3 的状态" | 中文（混合输入，ASCII < 90%） |

> 💡 如果回复语言不符合预期，尝试用纯中文或纯英文重新提问。

---

## 7. Tips（对话技巧）

### ✅ 提问要具体

| 不推荐 ❌ | 推荐 ✅ |
|---|---|
| "冷机状态" | "**3号冷机**什么状态" |
| "能耗怎么样" | "**B1层**这个月能耗趋势" |
| "跑个仿真" | "用**当前参数**跑一个**24小时**仿真" |

### 🔄 善用追问

AI Advisor 支持多轮对话，您可以基于上一轮回答继续追问：

```
用户：3号冷机什么状态？
AI：3号冷机当前运行中，负载率72%...
用户：跟上个月比呢？
AI：对比上月同期，负载率上升了5%...
```

### 📐 仿真时提供参数

请求仿真或优化时，提供具体参数能获得更精准的结果：

```
帮我跑一个仿真，冷冻水供水温度7°C，冷却水回水温度32°C，运行24小时
```

### 🎯 其他技巧

- 可以要求 AI 生成图表："用图表展示这周能耗"
- 可以要求导出数据："把结果导出为CSV"
- 不确定时直接问："你能帮我做什么？"

---

## 8. API（API接口）

开发者可以通过 REST API 直接调用 AI Advisor 功能。

### 主要接口

#### 对话接口

```http
POST /ai/advisor/chat
Content-Type: application/json

{
  "message": "3号冷机什么状态",
  "session_id": "optional-session-id"
}
```

#### 查询可用工具

```http
GET /ai/advisor/tools
```

返回 60 个工具的名称、描述和参数定义。

#### 分析接口

```http
POST /api/v1/advisor/analyze
Content-Type: application/json

{
  "target": "chiller_3",
  "metric": "energy_consumption",
  "period": "last_30_days"
}
```

#### 可解释性接口

```http
POST /api/v1/advisor/explain
Content-Type: application/json

{
  "prediction_id": "pred_abc123"
}
```

返回 SHAP 值和特征重要性排名。

#### 执行接口

```http
POST /api/v1/advisor/execute
Content-Type: application/json

{
  "tool": "run_simulation",
  "params": {
    "duration_hours": 24,
    "chilled_water_temp": 7.0
  }
}
```

---

## 9. FAQ（常见问题）

### Q: 为什么 AI 回复比较慢？

AI Advisor 使用 GPT-4.1-mini 模型，平均响应时间约 **3.4 秒**。如果涉及仿真或大量数据查询，可能需要更长时间。这是正常现象。

### Q: AI 用了错误的语言回复怎么办？

这通常是因为输入包含混合语言。尝试用 **纯中文** 或 **纯英文** 重新提问。系统通过 ASCII 比例（>90% 判定为英文）检测语言。

### Q: 提示"工具未找到"怎么办？

可能原因：
- 您的请求不在 60 个工具的覆盖范围内
- 表述方式让 AI 无法匹配到合适的工具

**解决方法：** 换一种方式描述需求，或直接问 "你有哪些工具可以用？"

### Q: 对话历史会保存吗？

当前会话期间的对话历史会保留，用于支持多轮对话。关闭浏览器后，历史记录不会保留。

### Q: 可以同时打开多个对话吗？

目前每个用户同时只支持一个对话窗口。

---

*最后更新：2026-02-18*
