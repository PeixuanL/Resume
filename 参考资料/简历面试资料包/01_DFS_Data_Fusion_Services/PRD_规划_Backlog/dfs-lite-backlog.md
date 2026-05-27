# DFS Lite — Fake Data / Mock / Stub 审计清单

> 审计日期: 2026-04-03
> 审计范围: backend dfslite/, frontend data-integration/, ai-engine data_pipeline/

## 汇总

| 严重度 | 数量 | 说明 |
|--------|------|------|
| **P0** | 7 | 阻断真实使用，用户看到假数据或功能完全不可用 |
| **P1** | 8 | 功能缺失，影响完整性但不阻断核心流程 |
| **P2** | 6 | 优化项，默认值或代码质量问题 |

---

## 详细清单

### P0 — 阻断真实使用

| # | 文件路径 | 行号 | 类型 | 描述 | 修复建议 |
|---|---------|------|------|------|---------|
| 1 | `ai-engine/core/data_pipeline/dag_executor.py` | 71-86 | mock data | `_execute_dataset()` 不查 TimescaleDB，直接用 `np.random.normal()` 生成假传感器数据 | 实现真实数据源查询（TimescaleDB / 外部 API），保留 mock 仅用于单元测试 |
| 2 | `frontend/src/views/data-integration/ConnectorListView.vue` | 119-138 | fake fallback | API 失败时 fallback 到 `mockConnectors` 硬编码数组（3 条假连接器），用户无法区分真假数据 | 移除 mock fallback，API 失败时显示错误状态 + 重试按钮 |
| 3 | `frontend/src/views/data-integration/QualityDashboardView.vue` | 113-131 | mock data | 整个仪表盘使用 `mockDashboard` 对象（`totalConnectors: 6, avgQualityScore: 82` 等硬编码值） | 改为从 API 拉取真实数据，空状态显示 empty state |
| 4 | `frontend/src/views/data-integration/SyncHistoryView.vue` | 96-138 | fake fallback | API 失败时 fallback 到 `mockLogs` 硬编码同步记录 | 移除 mock fallback，显示错误提示 |
| 5 | `frontend/src/views/data-integration/ConnectorDetailView.vue` | 196-200 | fake fallback | API 失败时加载 `Demo Connector` 假数据填充表单 | 移除假数据，API 失败显示错误并禁用编辑 |
| 6 | `frontend/src/modules/data-integration/views/ConnectorDetailView.vue` | 287, 301 | mock data | 吞吐量/质量图表使用 `Math.random()` 生成随机数据 | 对接真实 metrics API，无数据时显示空状态 |
| 7 | `frontend/src/modules/data-integration/views/DataQualityView.vue` | 144 | mock data | 质量趋势图用 `Math.random()` 生成 7 天假数据 | 对接 quality trend API |

### P1 — 功能缺失

| # | 文件路径 | 行号 | 类型 | 描述 | 修复建议 |
|---|---------|------|------|------|---------|
| 8 | `backend/.../connector/impl/OpcUaConnector.java` | 21-70 | stub function | 整个连接器是 stub，browse/read/subscribe/test 全部返回 "not supported" | Wave 2: 实现 Eclipse Milo OPC UA 客户端 |
| 9 | `backend/.../service/SyncServiceImpl.java` | 35-45 | stub function | `writeToLocalDb()` 是 no-op，接收到的映射数据不持久化 | Wave 2: 实现 sensor_reading staging 表写入 |
| 10 | `backend/.../controller/MappingController.java` | 100-115 | hardcoded value | AI 映射建议返回硬编码 stub 列表，非真实 AI 推理 | Wave 1.4: 对接 AI Engine 映射推理接口 |
| 11 | `backend/.../controller/QualityController.java` | 103-114 | stub function | 质量趋势接口返回空列表 + "not yet available" | Wave 1.4: 实现 quality_snapshot 查询聚合 |
| 12 | `backend/.../controller/ConnectorController.java` | 185-194 | hardcoded value | 连接器模板列表硬编码，不从数据库查询 | Wave 1.4: 查询 DfsConnectorTemplateRepository |
| 13 | `backend/.../connector/impl/FabricConnector.java` | 188-190 | stub function | SQL endpoint 查询未实现，`useSqlEndpoint=true` 时返回空列表 | Wave 3: 实现 JDBC SQL endpoint 查询 |
| 14 | `backend/.../service/HealthCheckScheduler.java` | 86 | TODO | 健康检查告警未集成通知服务 | Wave 1.5: 对接通知服务（邮件/WebSocket） |
| 15 | `ai-engine/core/data_pipeline/connectors.py` | 4 | stub function | MQTT 和 OPC-UA 连接器标记为 stub | 与 backend connector 实现对齐 |

### P2 — 优化项

| # | 文件路径 | 行号 | 类型 | 描述 | 修复建议 |
|---|---------|------|------|------|---------|
| 16 | `backend/.../connector/impl/ModbusConnector.java` | 92-96 | hardcoded value | 默认 `host=127.0.0.1`，生产环境可能误连本地 | 移除默认值或改为必填字段校验 |
| 17 | `backend/.../connector/impl/MqttConnector.java` | 93 | hardcoded value | 默认 `brokerUrl=tcp://localhost:1883` | 同上，broker URL 应为必填 |
| 18 | `backend/.../connector/impl/BacnetConnector.java` | 78-83 | hardcoded value | 默认 `host=127.0.0.1`，多个默认参数 | host 改为必填，其余默认值可保留 |
| 19 | `backend/.../connector/impl/FabricConnector.java` | 42 | hardcoded value | `DEFAULT_ENDPOINT` 硬编码 Microsoft Fabric URL | 可接受（官方固定端点），建议可配置化 |
| 20 | `frontend/.../components/SchemaMapper.vue` | 124 | hardcoded value | 用 `Date.now() + Math.random()` 生成 ID | 改用 crypto.randomUUID() 或自增 ID |
| 21 | `backend/.../service/MappingService.java`, `SyncService.java`, `QuotaService.java` | 各文件头 | stub function | 三个 Service 接口文档标注为 "Stub interface" | 随实现完善后更新文档 |

---

## 按模块统计

| 模块 | P0 | P1 | P2 | 合计 |
|------|----|----|----|----|
| Frontend views (旧版) | 4 | 0 | 0 | 4 |
| Frontend modules (新版) | 2 | 0 | 1 | 3 |
| Backend connectors | 0 | 3 | 4 | 7 |
| Backend controllers | 0 | 3 | 0 | 3 |
| Backend services | 0 | 2 | 1 | 3 |
| AI Engine | 1 | 1 | 0 | 2 |
| **合计** | **7** | **9** | **5** | **21** |

## 建议优先级路线

1. **立即修复 (P0)**: 移除所有前端 mock fallback，API 失败时显示错误状态而非假数据
2. **Wave 1.4**: AI 映射、质量趋势、连接器模板 — 补齐后端真实实现
3. **Wave 1.5**: 通知服务集成
4. **Wave 2**: OPC UA 完整实现、数据持久化、DAG executor 真实数据源
5. **Wave 3**: Fabric SQL endpoint
