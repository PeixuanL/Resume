你好！作为一个产品经理，你构建的这个“人机协同（Human-in-the-loop）”的预测性维护场景非常清晰，逻辑闭环也很完整。

为了协助你将这个业务场景落地给开发团队（后端研发和算法工程师），我将你描述的 **第二阶段** 到 **第五阶段**（即 AI 核心介入的环节）进行了详细的**执行步骤拆解**，并定义了每个步骤中 Agent 需要调用的 **API 接口定义**。

---

### 核心设计原则
*   **API 风格**：RESTful 风格（示例），便于前后端理解。
*   **上下文保持**：`task_id` 或 `session_id` 贯穿全流程，确保三个 Agent 知道是在处理同一个故障。
*   **数据流转**：Agent 1 的输出通常作为 Agent 2 的输入。

---

### 第二阶段：AI 分析诊断
**执行角色**：设备诊断 Agent (The Analyst)
**触发条件**：李经理点击详情页，前端向 Agent 发送 `start_diagnosis` 请求。

#### 步骤拆解与 API 定义

| 步骤序号    | 执行动作 (Action)                                       | API 接口定义 (建议)                          | 入参 (Request)                                                                             | 出参 (Response)                                                                                       |
| ------- | --------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **2.1** | **获取实时遥测数据**<br>拉取 AHU-02 近期的振动频谱、电机电流、皮带轮转速数据。     | `GET /api/device/telemetry/timeseries` | `device_id`: "AHU-02"<br>`metric_type`: ["vibration", "current"]<br>`window`: "last_24h" | `{ "vibration_spectrum": [...], "current_trend": [...] }`                                           |
| **2.2** | **获取维修履历**<br>查询该设备的历史工单，确认上次更换皮带的时间。               | `GET /api/maintenance/history`         | `device_id`: "AHU-02"<br>`category`: "maintenance"                                       | `{ "last_maintenance_date": "2023-03-01", "action": "belt_replacement", "part_id": "B-52" }`        |
| **2.3** | **检索知识库/手册**<br>通过 RAG (检索增强生成) 查找厂家手册中关于皮带张力的标准参数。 | `POST /api/knowledge/rag_search`       | `query`: "AHU-02 皮带张力标准 故障频谱特征"<br>`document_scope`: "manuals"                           | `{ "tension_standard": "450N", "life_expectancy": "12-18 months", "ref_doc": "AHU_Manual_v2.pdf" }` |
| **2.4** | **生成诊断结论**<br>将上述数据输入 LLM 进行推理，生成自然语言建议。            | *(Agent 内部逻辑，无需外部 API，但需将结果存入上下文)*     | *N/A*                                                                                    | *N/A*                                                                                               |

---

### 第三阶段：资源与排程筹备
**执行角色**：工单调度 Agent (The Coordinator)
**触发条件**：李经理点击“制定方案”按钮。

#### 步骤拆解与 API 定义

| 步骤序号    | 执行动作 (Action)                               | API 接口定义 (建议)                       | 入参 (Request)                                           | 出参 (Response)                                                                                        |
| :------ | :------------------------------------------ | :---------------------------------- | :----------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| **3.1** | **查询备件库存**<br>根据诊断结果中的配件型号（B-52），查询库存数量及位置。 | `GET /api/inventory/stock`          | `part_sku`: "B-52"<br>`warehouse_id`: "DC_02_Store"    | `{ "available_qty": 4, "location": "Shelf-A03", "reserved_qty": 0 }`                                 |
| **3.2** | **预占备件 (可选)**<br>为了防止并发抢占，临时锁定库存（软锁定）。      | `POST /api/inventory/reserve`       | `part_sku`: "B-52"<br>`qty`: 2<br>`expire_time`: "30m" | `{ "reservation_id": "RES-8892", "status": "success" }`                                              |
| **3.3** | **查询技师排班**<br>筛选具备“HVAC高级资质”且状态为“空闲”的技师。    | `GET /api/staff/schedule`           | `skill_tag`: "HVAC_Level2"<br>`date`: "tomorrow"       | `{ "staff_list": [{ "name": "Wang", "id": "W001", "free_slots": ["10:00-11:00", "14:00-15:00"] }] }` |
| **3.4** | **查询机房负载预测**<br>预测未来24小时机房热负荷，寻找低负载窗口。      | `GET /api/datacenter/load_forecast` | `room_id`: "Room-02"<br>`target_date`: "tomorrow"      | `{ "lowest_load_window": "10:00-11:30", "load_percentage": "35%" }`                                  |
| **3.5** | **生成调度建议**<br>综合人、机、料、法、环信息，输出最佳时间窗口。       | *(Agent 内部逻辑)*                      | *N/A*                                                  | *N/A*                                                                                                |

---

### 第四阶段：文书自动生成
**执行角色**：工单生成 Agent (The Scribe)
**触发条件**：李经理点击“草拟工单”按钮。

#### 步骤拆解与 API 定义

| 步骤序号 | 执行动作 (Action) | API 接口定义 (建议) | 入参 (Request) | 出参 (Response) |
| :--- | :--- | :--- | :--- | :--- |
| **4.1** | **获取工单模板**<br>获取“预防性维护-机械类”标准工单模板结构。 | `GET /api/workorder/templates` | `template_type`: "preventive_maintenance_mechanical" | `{ "fields": ["fault_desc", "plan_time", "sop_list", "safety_warning", ...] }` |
| **4.2** | **提取 SOP 和 安全规范**<br>从知识库中精确提取针对“皮带更换”的标准作业程序。 | `POST /api/knowledge/extract_sop` | `task_type`: "belt_replacement"<br>`device_model`: "AHU-Series-X" | `{ "sop_steps": ["1.停机...", "2.松张紧轮...", ...], "safety_rules": ["挂牌上锁", "佩戴护目镜"] }` |
| **4.3** | **创建工单草稿**<br>将诊断信息、调度信息、SOP 组装成一个 JSON 对象并在系统中生成草稿记录。 | `POST /api/workorder/draft` | `device_id`: "AHU-02"<br>`technician_id`: "W001"<br>`parts`: ["B-52"]<br>`planned_time`: "..."<br>`diagnosis_summary`: "..." | `{ "draft_id": "WO-DRAFT-20240520-01", "preview_url": "/wo/preview/..." }` |

---

### 第五阶段：运维经理决策 & 系统执行
**执行角色**：系统后端 (System)
**触发条件**：李经理点击“批准并派发”。

#### 步骤拆解与 API 定义

| 步骤序号 | 执行动作 (Action) | API 接口定义 (建议) | 入参 (Request) | 出参 (Response) |
| :--- | :--- | :--- | :--- | :--- |
| **5.1** | **工单转正与派发**<br>将草稿状态改为“待执行”，并推送给指定技师。 | `POST /api/workorder/publish` | `draft_id`: "WO-DRAFT-20240520-01"<br>`approver_id`: "Manager_Li" | `{ "workorder_id": "WO-20240520-01", "status": "dispatched" }` |
| **5.2** | **扣减库存**<br>将之前的“预占”转为正式的“出库冻结”。 | `POST /api/inventory/commit` | `reservation_id`: "RES-8892"<br>`workorder_id`: "WO-20240520-01" | `{ "status": "success", "remaining_stock": 2 }` |
| **5.3** | **更新设备状态**<br>在 Dashboard 上将设备标记为“计划维修中”。 | `PUT /api/device/status` | `device_id`: "AHU-02"<br>`status`: "maintenance_scheduled" | `{ "status": "success" }` |

---

### 给产品经理的建议 (PM Tips)

1.  **关于 Agent 的数据来源**：请与研发确认，目前的数据中心监控系统（DCIM）是否有现成的 API 可以提供振动数据和负载预测？如果没有，这部分需要作为“前置依赖”先开发。
2.  **关于 SOP 的准确性**：工单生成 Agent 的核心风险在于 SOP 匹配错误。建议在产品设计时，在“工单预览卡片”中允许李经理**手动编辑** SOP 步骤，以防 AI 提取有误。
3.  **异常流程**：如果库存不足怎么办？如果推荐的技师请假了怎么办？需要在流程图中考虑 Agent 的 **Fallback（兜底）机制**，例如提示“库存不足，是否触发紧急采购流程？”

这套拆解可以直接作为 **PRD (产品需求文档)** 的技术实现部分，供开发人员进行详细设计。
