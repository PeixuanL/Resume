# 数字孪生用户指南

> 面向运维人员的 3D 场景与数字孪生使用手册。

---

## 1. Overview — 概述

FactVerse 平台的数字孪生功能分为两部分：

- **平台内 3D 场景**：FactVerse AI Agent 内置的设备 3D 可视化和场景管理
- **Twin Engine 验证**：由 [FactVerse Twin Engine](https://www.datamesh.com/) 提供的物理引擎级数字孪生验证

### 平台内功能

- **场景管理**：创建和管理 3D 设备场景
- **实时数据绑定**：3D 模型关联传感器实时数据
- **BIM 导入**：支持 IFC/Revit 格式建筑模型导入

**导航路径：** `/scenes`

---

## 2. Scene Management — 场景管理

**前端路径：** `/scenes`

### 功能说明

- **场景列表**：查看所有已创建的 3D 场景
- **场景创建**：设置场景名称、关联建筑/楼层
- **设备放置**：在 3D 场景中放置设备模型
- **数据绑定**：将设备模型关联到传感器数据点

---

## 3. Twin Engine Integration — 数字孪生验证

> **注意：** 物理级数字孪生验证由 FactVerse Twin Engine 产品提供，不在本平台内。

Twin Engine 提供的能力：

- **物理引擎验证**：验证 AI 推荐方案在真实物理环境中的可行性
- **行为树**：设备行为逻辑模拟
- **3D 渲染**：NVIDIA Omniverse 级别的高保真渲染
- **空间约束检查**：检查设备容量、管路连接、空间冲突

### 与 AI Agent 的协同

```
AI Agent 计算最优方案 → Twin Engine 物理验证 → 验证通过 → 推送到运维执行
                                              → 验证失败 → 反馈约束，重新优化
```

详见 [Architecture 文档](../07-developer/architecture.md) 了解两者的集成方式。
