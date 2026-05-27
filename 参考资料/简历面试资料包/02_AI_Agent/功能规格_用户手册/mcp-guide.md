# FactVerse MCP — Physical AI Tools for Any AI Agent

> 通过 Model Context Protocol (MCP) 让任何 AI Agent 调用 FactVerse 的物理世界工具

---

## 什么是 MCP？

[Model Context Protocol](https://modelcontextprotocol.io/) 是一个开放标准，让 AI 应用（如 Claude Desktop、Cursor、自研 Agent）能够安全地调用外部工具和数据源。

FactVerse 通过 MCP 暴露 **63+ 物理 AI 工具**，涵盖：

| 类别 | 工具数 | 示例 |
|------|--------|------|
| 感知 (knowledge/monitoring) | 25+ | 设备状态、传感器读数、文档搜索 |
| 分析 (analysis/prediction) | 8+ | 排放计算、数据质量、负荷预测 |
| 仿真 (simulation) | 8+ | DES、DOE、What-If 对比、SMT 瓶颈 |
| 优化 (optimization) | 4+ | NSGA-II、布局优化、冷机 COP |
| 执行 (action) | 2+ | 创建工单、审批任务 |
| 报告 (reporting) | 1+ | 自动生成报告 |
| 行业专属 | 15+ | TrafficOps、PdM、TelcoOps、Spatial |

---

## 快速接入

### Claude Desktop

在 `claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "factverse": {
      "url": "https://your-factverse-server/mcp",
      "headers": {
        "X-API-Key": "your-api-key"
      }
    }
  }
}
```

### Cursor IDE

在 `.cursor/mcp.json` 中：

```json
{
  "mcpServers": {
    "factverse": {
      "url": "https://your-factverse-server/mcp",
      "headers": {
        "X-API-Key": "your-api-key"
      }
    }
  }
}
```

### Python 客户端

```python
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

async def main():
    async with streamablehttp_client(
        "https://your-factverse-server/mcp",
        headers={"X-API-Key": "your-api-key"}
    ) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # 列出所有工具
            tools = await session.list_tools()
            for tool in tools.tools:
                print(f"{tool.name}: {tool.description[:60]}...")

            # 调用工具：查询设备状态
            result = await session.call_tool(
                "get_equipment_status",
                {"equipment_id": "EQ-001"}
            )
            print(result)

            # 运行仿真
            result = await session.call_tool(
                "run_simulation",
                {
                    "scene_type": "trafficops",
                    "scene_id": "rts-main-hall",
                    "simulation_time": 480
                }
            )
            print(result)
```

---

## 工具分类

### 感知类 — 获取物理世界数据

| 工具名 | 说明 |
|--------|------|
| `get_equipment_status` | 获取设备实时状态和传感器读数 |
| `query_knowledge` | 查询知识图谱（设备/故障/关联） |
| `get_cleanroom_status` | 洁净室环境状态 |
| `get_particle_trend` | 颗粒物趋势 |
| `get_pressure_gradient` | 压差梯度 |
| `get_fab_pue` | 工厂 PUE 值 |
| `get_filter_life` | 过滤器寿命 |
| `get_iso_compliance` | ISO 合规状态 |
| `get_smt_oee` | SMT 产线 OEE |
| `get_utility_status` | 水电气状态 |
| `monitor_particles` | 颗粒物实时监控 |
| `get_equipment_health` | PdM 设备健康评分 |
| `get_pdm_summary` | PdM 总览 |
| `list_pdm_anomalies` | PdM 异常列表 |
| `search_documents` | 文档搜索 |
| `get_equipment_documents` | 设备关联文档 |
| `list_connectors` | 数据连接器列表 |
| `check_data_quality` | 数据质量检查 |

### 仿真类 — 在数字孪生中验证方案

| 工具名 | 说明 |
|--------|------|
| `run_simulation` | 运行 DES 仿真（交通/供热/设备） |
| `run_doe` | 运行实验设计（识别关键因子） |
| `run_dag_simulation` | DAG 检查站仿真 + Sankey 分析 |
| `run_what_if_comparison` | A/B 方案 What-If 对比 |
| `predict_env_trend` | 环境趋势预测 |
| `simulate_smt_bottleneck` | SMT 产线瓶颈仿真 |

### 优化类 — 找到最优方案

| 工具名 | 说明 |
|--------|------|
| `run_optimization` | NSGA-II 多目标优化 |
| `optimize_layout` | 设施空间布局优化 |
| `optimize_chiller_cop` | 冷机 COP 优化 |
| `get_optimization_recommendation` | 预算约束下最优人员配置 |

### 执行类 — 将决策落地

| 工具名 | 说明 |
|--------|------|
| `create_work_order` | 从 AI 建议创建工单 |
| `get_pending_tasks` | 获取待处理审批任务 |

---

## 认证

所有 MCP 请求需要 API Key：

- **Header**: `X-API-Key: your-api-key`
- API Key 在 FactVerse 安装时自动生成，保存在 `.env` 的 `AI_ENGINE_API_KEY` 中
- 也可在管理后台生成新的 API Key

---

## 使用场景

### 1. Claude 直接操控设施

```
用户: "7号冷机最近运行怎么样？如果降频到 42Hz 会怎样？"

Claude 调用:
  → get_equipment_status(equipment_id="CHILLER-007")
  → run_simulation(scene_type="fms", config_overrides={"frequency": 42})
  → 综合分析并回答
```

### 2. 自研 Agent 自动化运维

```python
# 每小时自动检查设备健康
health = await session.call_tool("get_equipment_health", {"tenant_id": "yokogawa"})

for equipment in health.data["equipment"]:
    if equipment["health_score"] < 60:
        # 自动创建工单
        await session.call_tool("create_work_order", {
            "equipment_id": equipment["id"],
            "priority": "HIGH",
            "description": f"AI 检测到健康评分低于 60: {equipment['health_score']}"
        })
```

### 3. Cursor 中查询生产数据

在 Cursor IDE 中直接问："洁净室 CR-001 的颗粒物趋势怎么样？" → Cursor 通过 MCP 调用 `get_particle_trend`。

---

## 部署

MCP Server 集成在 AI Engine 中，默认在 `/mcp` 路径提供服务。

**启用条件**:
- AI Engine 容器运行中
- `mcp` Python 包已安装（Docker 镜像已包含）

**端口**: 与 AI Engine 共享（默认 8000）

**URL**: `http://localhost:8000/mcp`（内网）或 `https://your-domain/ai/mcp`（通过 nginx 代理）

> ⚠️ 生产环境建议通过 nginx 代理并启用 SSL。
