# 技术规格：数据集成与高级优化（Phase 3）

> Spec: Data Integration & Advanced Optimization for ICA
> 
> Version: 1.0 | Date: 2026-02-16 | Author: AzureBot
> 
> 对应 PRD Phase 3（W11-W14），满足 ICA 7. Process Flow + 8. Optimization Design

---

## 1. 概述

ICA要求系统能够：
1. **接入真实数据源**（ERP/MES/SCADA/RTLS）→ 为DES模型提供实际参数
2. **代理模型预筛选**（Metamodel）→ 加速大规模布局优化
3. **并行DES评估** → 提升优化效率
4. **SSO集成** → 满足政府安全要求

---

## 2. 数据管线架构

### 2.1 数据源类型

| 数据源 | 协议 | 数据类型 | 用途 |
|--------|------|----------|------|
| SCADA | OPC-UA | 设备状态/传感器实时值 | 实时状态overlay、校准DES参数 |
| MES | REST API | 生产订单/工艺路线/良率 | OEE计算、质量参数 |
| ERP | REST/ODBC | 排程/需求/BOM | 仿真场景输入 |
| RTLS | MQTT | 人员/AGV实时位置 | 密度热力图、流量统计 |
| 门禁系统 | REST | 进出记录/到达时间戳 | 到达过程分布拟合 |
| CCTV Analytics | REST | 客流计数/区域密度 | 校准模型、实时监控 |

### 2.2 数据流水线

```
数据源                    采集层                  处理层                 消费层
───────                   ─────                   ─────                  ─────
OPC-UA Server ──────▶  ┌───────────┐           ┌──────────┐         ┌────────────┐
                       │ Connector │──────────▶│ ETL      │────────▶│ DES Engine │
MQTT Broker   ──────▶  │ Manager   │           │ Pipeline │         │ (参数输入)  │
                       │           │           │          │         ├────────────┤
REST API      ──────▶  │ (Schedule/│           │ (Clean/  │────────▶│ 3D Overlay │
                       │  Stream)  │           │  Transform│        │ (实时状态)  │
Database      ──────▶  └───────────┘           │  /Validate│        ├────────────┤
                                               │  /Store)  │────────▶│ Dist Fitter│
                                               └──────────┘         │ (分布拟合)  │
                                                    │                └────────────┘
                                                    ▼
                                               ┌──────────┐
                                               │ Data     │
                                               │ Catalog  │
                                               │ (血缘追踪)│
                                               └──────────┘
```

### 2.3 Connector Manager

```python
# ai-engine/core/data_pipeline/connector_manager.py

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
import asyncio

class ConnectorType(Enum):
    OPCUA = "opcua"
    MQTT = "mqtt"
    REST = "rest"
    ODBC = "odbc"
    CSV = "csv"

class ConnectorStatus(Enum):
    IDLE = "idle"
    CONNECTED = "connected"
    ERROR = "error"
    SYNCING = "syncing"

@dataclass
class ConnectorConfig:
    """连接器配置"""
    connector_id: str
    connector_type: ConnectorType
    name: str
    endpoint: str                    # URL/地址
    auth: Dict[str, str] = None     # 认证信息
    schedule: Optional[str] = None   # cron表达式（定时拉取）
    stream: bool = False             # 是否流式（MQTT/OPC-UA订阅）
    mapping: Dict[str, str] = None   # 字段映射
    enabled: bool = True

class BaseConnector(ABC):
    """连接器基类"""

    def __init__(self, config: ConnectorConfig):
        self.config = config
        self.status = ConnectorStatus.IDLE
        self._last_sync = None
        self._error_count = 0

    @abstractmethod
    async def connect(self):
        pass

    @abstractmethod
    async def disconnect(self):
        pass

    @abstractmethod
    async def fetch(self, query: Dict = None) -> List[Dict]:
        """拉取数据"""
        pass

    async def test_connection(self) -> bool:
        """测试连接"""
        try:
            await self.connect()
            await self.disconnect()
            return True
        except Exception:
            return False

class OpcUaConnector(BaseConnector):
    """OPC-UA连接器"""

    async def connect(self):
        from asyncua import Client
        self._client = Client(self.config.endpoint)
        await self._client.connect()
        self.status = ConnectorStatus.CONNECTED

    async def disconnect(self):
        if hasattr(self, '_client'):
            await self._client.disconnect()
        self.status = ConnectorStatus.IDLE

    async def fetch(self, query: Dict = None) -> List[Dict]:
        """读取OPC-UA节点"""
        node_ids = query.get("node_ids", []) if query else []
        results = []
        for node_id in node_ids:
            node = self._client.get_node(node_id)
            value = await node.read_value()
            results.append({
                "node_id": node_id,
                "value": value,
                "timestamp": str(await node.read_data_value()),
            })
        return results

    async def subscribe(self, node_ids: List[str], callback):
        """订阅OPC-UA节点变更"""
        from asyncua import ua
        handler = _OpcUaHandler(callback)
        sub = await self._client.create_subscription(500, handler)
        for nid in node_ids:
            node = self._client.get_node(nid)
            await sub.subscribe_data_change(node)

class MqttConnector(BaseConnector):
    """MQTT连接器"""

    async def connect(self):
        import aiomqtt
        self._client = aiomqtt.Client(self.config.endpoint)
        await self._client.__aenter__()
        self.status = ConnectorStatus.CONNECTED

    async def disconnect(self):
        if hasattr(self, '_client'):
            await self._client.__aexit__(None, None, None)
        self.status = ConnectorStatus.IDLE

    async def fetch(self, query: Dict = None) -> List[Dict]:
        """订阅MQTT topic并收集消息"""
        topics = query.get("topics", []) if query else []
        messages = []
        for topic in topics:
            await self._client.subscribe(topic)
        # 收集一批消息
        async for msg in self._client.messages:
            messages.append({
                "topic": str(msg.topic),
                "payload": msg.payload.decode(),
                "timestamp": str(msg.timestamp) if hasattr(msg, 'timestamp') else None,
            })
            if len(messages) >= query.get("limit", 100):
                break
        return messages

class RestConnector(BaseConnector):
    """REST API连接器"""

    async def connect(self):
        import aiohttp
        self._session = aiohttp.ClientSession()
        self.status = ConnectorStatus.CONNECTED

    async def disconnect(self):
        if hasattr(self, '_session'):
            await self._session.close()
        self.status = ConnectorStatus.IDLE

    async def fetch(self, query: Dict = None) -> List[Dict]:
        headers = {}
        if self.config.auth:
            if "token" in self.config.auth:
                headers["Authorization"] = f"Bearer {self.config.auth['token']}"
        
        url = self.config.endpoint
        if query and "path" in query:
            url = f"{url}/{query['path']}"
        
        async with self._session.get(url, headers=headers) as resp:
            data = await resp.json()
            if isinstance(data, list):
                return data
            return [data]

# 连接器工厂
CONNECTOR_CLASSES = {
    ConnectorType.OPCUA: OpcUaConnector,
    ConnectorType.MQTT: MqttConnector,
    ConnectorType.REST: RestConnector,
}

class ConnectorManager:
    """管理所有数据连接器"""

    def __init__(self):
        self._connectors: Dict[str, BaseConnector] = {}

    def register(self, config: ConnectorConfig) -> BaseConnector:
        cls = CONNECTOR_CLASSES.get(config.connector_type)
        if not cls:
            raise ValueError(f"Unsupported connector type: {config.connector_type}")
        connector = cls(config)
        self._connectors[config.connector_id] = connector
        return connector

    def get(self, connector_id: str) -> Optional[BaseConnector]:
        return self._connectors.get(connector_id)

    def list_connectors(self) -> List[Dict]:
        return [
            {
                "id": c.config.connector_id,
                "name": c.config.name,
                "type": c.config.connector_type.value,
                "status": c.status.value,
                "enabled": c.config.enabled,
            }
            for c in self._connectors.values()
        ]
```

### 2.4 ETL Pipeline

```python
# ai-engine/core/data_pipeline/etl.py

from dataclasses import dataclass, field
from typing import List, Dict, Callable, Optional
from datetime import datetime
import numpy as np

@dataclass
class DataRecord:
    """标准化数据记录"""
    source: str
    timestamp: datetime
    metric: str
    value: float
    unit: str
    equipment_id: Optional[str] = None
    zone: Optional[str] = None
    metadata: Dict = field(default_factory=dict)

@dataclass
class TransformRule:
    """数据转换规则"""
    name: str
    input_field: str
    output_field: str
    transform_fn: Callable
    description: str = ""

class ETLPipeline:
    """
    ETL管道：从连接器获取原始数据 → 清洗 → 转换 → 存储
    
    用途：
    1. 定时从OPC-UA/MQTT/REST拉取数据
    2. 清洗（去重、填补空值、过滤异常）
    3. 转换（单位换算、字段映射、聚合）
    4. 写入DES参数表或实时overlay
    """

    def __init__(self):
        self._transform_rules: List[TransformRule] = []
        self._validators: List[Callable] = []

    def add_transform(self, rule: TransformRule):
        self._transform_rules.append(rule)

    def add_validator(self, validator: Callable):
        self._validators.append(validator)

    def process(self, raw_data: List[Dict], field_mapping: Dict[str, str]) -> List[DataRecord]:
        """处理原始数据"""
        records = []
        for raw in raw_data:
            # 1. 字段映射
            mapped = self._apply_mapping(raw, field_mapping)
            
            # 2. 验证
            if not self._validate(mapped):
                continue
            
            # 3. 转换
            transformed = self._apply_transforms(mapped)
            
            # 4. 创建标准记录
            record = DataRecord(
                source=transformed.get("source", "unknown"),
                timestamp=self._parse_timestamp(transformed.get("timestamp")),
                metric=transformed.get("metric", "unknown"),
                value=float(transformed.get("value", 0)),
                unit=transformed.get("unit", ""),
                equipment_id=transformed.get("equipment_id"),
                zone=transformed.get("zone"),
                metadata={k: v for k, v in transformed.items() 
                          if k not in ("source", "timestamp", "metric", "value", "unit")},
            )
            records.append(record)

        return records

    def aggregate_for_des(self, records: List[DataRecord]) -> Dict:
        """
        将数据记录聚合为DES参数。
        
        例如：
        - 处理时间记录 → 拟合分布参数
        - 到达时间戳 → 计算到达率
        - 故障记录 → 计算MTBF/MTTR
        """
        by_metric = {}
        for r in records:
            by_metric.setdefault(r.metric, []).append(r.value)

        des_params = {}
        for metric, values in by_metric.items():
            arr = np.array(values)
            des_params[metric] = {
                "mean": float(np.mean(arr)),
                "std": float(np.std(arr)),
                "min": float(np.min(arr)),
                "max": float(np.max(arr)),
                "count": len(arr),
                "values": values,  # 用于分布拟合
            }

        return des_params

    def _apply_mapping(self, raw: Dict, mapping: Dict) -> Dict:
        result = {}
        for target, source in mapping.items():
            if source in raw:
                result[target] = raw[source]
        return result

    def _validate(self, record: Dict) -> bool:
        for validator in self._validators:
            if not validator(record):
                return False
        return True

    def _apply_transforms(self, record: Dict) -> Dict:
        for rule in self._transform_rules:
            if rule.input_field in record:
                record[rule.output_field] = rule.transform_fn(record[rule.input_field])
        return record

    def _parse_timestamp(self, ts) -> datetime:
        if isinstance(ts, datetime):
            return ts
        if isinstance(ts, str):
            from dateutil.parser import parse
            return parse(ts)
        return datetime.now()
```

### 2.5 数据血缘追踪

```python
# ai-engine/core/data_pipeline/lineage.py

from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime

@dataclass
class LineageNode:
    """数据血缘节点"""
    node_id: str
    node_type: str  # 'source', 'transform', 'model_param', 'simulation'
    name: str
    timestamp: datetime
    metadata: dict = field(default_factory=dict)

@dataclass
class LineageEdge:
    """数据血缘边"""
    from_id: str
    to_id: str
    transform_description: str = ""

class DataLineageTracker:
    """
    追踪数据从源头到DES模型参数的完整血缘。
    
    ICA需求：Data Engineer需要管理数据管线、集成、血缘。
    
    血缘示例：
    OPC-UA[Node123] → ETL[clean+aggregate] → DistFit[lognorm(2.1, 0.5)] 
    → DES[auto-biometric.service_time] → SimResult[throughput=450]
    """

    def __init__(self):
        self._nodes: dict = {}
        self._edges: list = []

    def record_source(self, source_id: str, source_type: str, details: dict):
        self._nodes[source_id] = LineageNode(
            node_id=source_id,
            node_type="source",
            name=f"{source_type}:{source_id}",
            timestamp=datetime.now(),
            metadata=details,
        )

    def record_transform(self, transform_id: str, from_ids: List[str], description: str):
        self._nodes[transform_id] = LineageNode(
            node_id=transform_id,
            node_type="transform",
            name=description,
            timestamp=datetime.now(),
        )
        for fid in from_ids:
            self._edges.append(LineageEdge(from_id=fid, to_id=transform_id))

    def record_model_param(self, param_id: str, from_id: str, param_name: str, value: any):
        self._nodes[param_id] = LineageNode(
            node_id=param_id,
            node_type="model_param",
            name=param_name,
            timestamp=datetime.now(),
            metadata={"value": str(value)},
        )
        self._edges.append(LineageEdge(from_id=from_id, to_id=param_id))

    def get_lineage(self, node_id: str) -> dict:
        """获取某节点的完整上游血缘"""
        visited = set()
        result = {"nodes": [], "edges": []}
        self._trace_upstream(node_id, visited, result)
        return result

    def _trace_upstream(self, node_id, visited, result):
        if node_id in visited:
            return
        visited.add(node_id)
        if node_id in self._nodes:
            node = self._nodes[node_id]
            result["nodes"].append({
                "id": node.node_id,
                "type": node.node_type,
                "name": node.name,
            })
        for edge in self._edges:
            if edge.to_id == node_id:
                result["edges"].append({
                    "from": edge.from_id,
                    "to": edge.to_id,
                })
                self._trace_upstream(edge.from_id, visited, result)

    def to_dict(self) -> dict:
        return {
            "nodes": [
                {"id": n.node_id, "type": n.node_type, "name": n.name}
                for n in self._nodes.values()
            ],
            "edges": [
                {"from": e.from_id, "to": e.to_id}
                for e in self._edges
            ],
        }
```

---

## 3. 代理模型预筛选（Metamodel）

### 3.1 动机

空间布局优化的DES评估很慢（每个候选方案 ~1-5秒 × 多replication）。对于50×100代 = 5000次评估，总时间可能超过1小时。

**代理模型（Metamodel）**用 ML 模型近似 DES 的输入→输出映射，预筛选明显差的候选方案，只对有希望的方案运行真实DES。

### 3.2 实现

```python
# ai-engine/core/optimizer/metamodel.py

import numpy as np
from typing import Tuple, Optional
from dataclasses import dataclass

@dataclass
class MetamodelConfig:
    """代理模型配置"""
    model_type: str = "gp"          # 'gp' (Gaussian Process) 或 'xgboost'
    initial_samples: int = 50       # 初始DES评估次数（训练集）
    screening_ratio: float = 0.3    # 筛选比例（只有top 30%进入真实DES评估）
    retrain_interval: int = 20      # 每多少代重新训练一次
    min_confidence: float = 0.8     # 最小置信度（低于此值走真实DES）

class GaussianProcessMetamodel:
    """
    高斯过程代理模型。
    
    优点：
    - 提供预测的不确定性估计（置信区间）
    - 不确定性高的区域自动走真实DES（exploration）
    - 适合小样本（几十到几百个训练点）
    
    工作流：
    1. 用初始DES结果训练GP
    2. 对新候选方案：GP预测 + 置信区间
    3. 如果GP置信度高且预测差 → 直接淘汰
    4. 如果GP置信度低或预测好 → 走真实DES
    5. DES结果加入训练集，定期重训练
    """

    def __init__(self, config: MetamodelConfig):
        self.config = config
        self._model = None
        self._X_train = []
        self._y_train = []
        self._trained = False

    def train(self, X: np.ndarray, y: np.ndarray):
        """训练GP模型"""
        from sklearn.gaussian_process import GaussianProcessRegressor
        from sklearn.gaussian_process.kernels import RBF, ConstantKernel

        kernel = ConstantKernel(1.0) * RBF(length_scale=1.0)
        self._model = GaussianProcessRegressor(
            kernel=kernel,
            n_restarts_optimizer=5,
            alpha=1e-6,
        )
        self._model.fit(X, y)
        self._X_train = X.tolist()
        self._y_train = y.tolist()
        self._trained = True

    def predict(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """预测 + 不确定性"""
        if not self._trained:
            raise ValueError("Model not trained")
        mean, std = self._model.predict(X, return_std=True)
        return mean, std

    def should_evaluate(self, x: np.ndarray, threshold_mean: float) -> bool:
        """
        决定是否需要真实DES评估。
        
        Returns True if:
        - 预测值好于阈值（有希望的方案）
        - 或不确定性高（需要探索的区域）
        """
        mean, std = self.predict(x.reshape(1, -1))
        confidence = 1 - (std[0] / (abs(mean[0]) + 1e-6))

        if confidence < self.config.min_confidence:
            return True  # 不确定性高，需要真实评估
        if mean[0] < threshold_mean:  # 对于最小化问题
            return True  # 预测好，值得真实评估
        return False  # GP预测差且置信度高，跳过

    def add_observation(self, x: np.ndarray, y: float):
        """添加新的DES评估结果"""
        self._X_train.append(x.tolist())
        self._y_train.append(y)

    def retrain(self):
        """用全部数据重训练"""
        X = np.array(self._X_train)
        y = np.array(self._y_train)
        self.train(X, y)

class XGBoostMetamodel:
    """
    XGBoost代理模型。
    
    优点：
    - 大样本时更快更稳定
    - 支持特征重要性分析
    - 不需要核函数选择
    
    缺点：
    - 不直接提供不确定性估计（需要额外方法如分位数回归）
    """

    def __init__(self, config: MetamodelConfig):
        self.config = config
        self._model = None
        self._trained = False

    def train(self, X: np.ndarray, y: np.ndarray):
        from xgboost import XGBRegressor
        self._model = XGBRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
        )
        self._model.fit(X, y)
        self._trained = True

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self._model.predict(X)

    def feature_importance(self) -> dict:
        """特征重要性（可告知哪些布局变量最影响结果）"""
        if self._model:
            return dict(zip(
                [f"var_{i}" for i in range(len(self._model.feature_importances_))],
                self._model.feature_importances_.tolist(),
            ))
        return {}
```

---

## 4. 并行DES评估

```python
# ai-engine/core/des/parallel.py

import numpy as np
from concurrent.futures import ProcessPoolExecutor, as_completed
from typing import List, Dict, Callable
from dataclasses import dataclass

@dataclass
class ParallelConfig:
    max_workers: int = 4       # 并行进程数
    timeout: float = 300.0     # 单次评估超时（秒）

class ParallelDESEvaluator:
    """
    并行DES评估器。
    
    用于优化循环中同时评估多个候选方案。
    每个方案独立运行在单独的进程中。
    """

    def __init__(self, config: ParallelConfig = None):
        self.config = config or ParallelConfig()

    def evaluate_batch(self, configs: List[Dict], run_fn: Callable) -> List[Dict]:
        """
        并行评估一批DES配置。
        
        Args:
            configs: DES场景配置列表
            run_fn: 单次DES运行函数（必须可pickle）
        
        Returns:
            结果列表（与configs顺序对应）
        """
        results = [None] * len(configs)

        with ProcessPoolExecutor(max_workers=self.config.max_workers) as executor:
            future_to_idx = {
                executor.submit(run_fn, cfg): i
                for i, cfg in enumerate(configs)
            }

            for future in as_completed(future_to_idx, timeout=self.config.timeout):
                idx = future_to_idx[future]
                try:
                    results[idx] = future.result()
                except Exception as e:
                    results[idx] = {"error": str(e)}

        return results
```

---

## 5. SSO集成

### 5.1 方案

ICA 作为政府机构，需要 **SAML 2.0 或 OIDC** 单点登录。

```yaml
# backend application-prod.yml 增加

spring:
  security:
    oauth2:
      client:
        registration:
          ica-oidc:
            client-id: ${OIDC_CLIENT_ID}
            client-secret: ${OIDC_CLIENT_SECRET}
            scope: openid,profile,email
            authorization-grant-type: authorization_code
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
        provider:
          ica-oidc:
            issuer-uri: ${OIDC_ISSUER_URI}
            # 例如: https://login.gov.sg/oidc
```

### 5.2 角色映射

```java
// SSO用户自动映射到RBAC角色
// 基于OIDC claim中的group/role信息

@Component
public class SsoRoleMapper {
    
    private static final Map<String, String> ROLE_MAP = Map.of(
        "ica-engineer", "ROLE_ENGINEER",
        "ica-planner", "ROLE_PLANNER",
        "ica-manager", "ROLE_MANAGER",
        "ica-data-engineer", "ROLE_DATA_ENGINEER",
        "ica-cad-engineer", "ROLE_CAD_ENGINEER",
        "ica-admin", "ROLE_ADMIN"
    );
    
    public List<String> mapRoles(List<String> ssoGroups) {
        return ssoGroups.stream()
            .map(ROLE_MAP::get)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }
}
```

---

## 6. API 端点汇总

```yaml
# 数据管线
POST /ai/data/connectors:           创建连接器
GET /ai/data/connectors:            列出连接器
PUT /ai/data/connectors/{id}:       更新连接器
DELETE /ai/data/connectors/{id}:    删除连接器
POST /ai/data/connectors/{id}/test: 测试连接
POST /ai/data/connectors/{id}/sync: 手动同步

# ETL
POST /ai/data/etl/run:              运行ETL管道
GET /ai/data/etl/history:           ETL运行历史

# 数据血缘
GET /ai/data/lineage/{node_id}:     获取数据血缘
GET /ai/data/lineage/graph:         完整血缘图

# 代理模型
POST /ai/metamodel/train:           训练代理模型
POST /ai/metamodel/predict:         代理模型预测
GET /ai/metamodel/importance:       特征重要性
```

---

## 7. 新增依赖

**AI Engine:**
```
asyncua>=1.0          # OPC-UA客户端
aiomqtt>=2.0          # MQTT异步客户端
aiohttp>=3.9          # REST异步客户端
xgboost>=2.0          # XGBoost代理模型
scikit-learn>=1.4      # GP + 通用ML（已有scipy）
python-dateutil>=2.8   # 时间解析
```

**Backend:**
```
spring-boot-starter-oauth2-client   # OIDC/SAML
```

---

## 8. 实施计划

```
W11 (Day 1-3): Connector Manager
  - OPC-UA / MQTT / REST 连接器实现
  - API端点（CRUD + test + sync）
  - 前端DataConnectorsView增强（真实后端API）

W11 (Day 4-5): ETL Pipeline
  - 清洗/转换/验证规则
  - 聚合为DES参数
  - 与DistFitter集成

W12 (Day 1-3): 数据血缘追踪
  - LineageTracker实现
  - 血缘可视化（前端DAG图）
  - API端点

W12 (Day 4-5): 前端数据管理页面
  - 连接器管理增强
  - 数据预览
  - 血缘图可视化

W13 (Day 1-3): 代理模型
  - GP + XGBoost Metamodel
  - 与布局优化器集成
  - 自适应采样策略

W13 (Day 4-5): 并行DES
  - ProcessPoolExecutor并行评估
  - 性能基准测试
  - 与优化循环集成

W14 (Day 1-3): SSO集成
  - Spring Security OIDC配置
  - 角色映射
  - 登录页面增强（SSO按钮）

W14 (Day 4-5): 集成测试
  - 端到端：数据源→ETL→DES→优化→报告
  - 安全测试（SSO + RBAC）
  - 文档
```

---

## 9. 与现有系统的关系

| Phase 3 模块 | 依赖 | 增强点 |
|--------------|------|--------|
| Connector Manager | DataConnector后端（V60） | 从mock CRUD升级为真实连接 |
| ETL Pipeline | DistFitter(Phase 1) | ETL输出→自动分布拟合 |
| Metamodel | 布局优化器(Phase 2) | 加速优化评估循环 |
| 并行DES | DES Engine | ProcessPoolExecutor包装 |
| SSO | RBAC系统 | SSO组→RBAC角色映射 |
| 数据血缘 | 新功能 | 独立模块，前端血缘图 |
