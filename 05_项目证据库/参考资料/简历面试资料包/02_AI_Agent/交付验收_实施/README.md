# Tenant Presets

## 使用方式

```bash
# 方式 1: 用预设文件
source /tmp/tenant-presets/yokogawa.env && bash /tmp/create-tenant.sh

# 方式 2: 交互式创建
bash /tmp/create-tenant.sh

# 方式 3: 一行命令
TENANT_NAME="新客户" USERNAME="demo@new.com" PRIMARY_COLOR="#FF6600" NAV_PRESET="building" bash /tmp/create-tenant.sh
```

## 可用预设

| 文件 | 客户 | 行业 | 菜单 |
|------|------|------|------|
| `yokogawa.env` | 横河川仪 | 制造业 | manufacturing |
| `ica.env` | ICA 机场 | 航空交通 | airport |
| `honeywell.env` | Honeywell Demo | 暖通空调 | hvac |

## 菜单预设说明

| Preset | 保留的模块组 | 适用行业 |
|--------|------------|---------|
| `manufacturing` | Cockpit, Operations, ME Systems(冷水机/IAQ/UPS), Env&Safety(水), Maintenance, Analytics, DFS | 制造业、工厂 |
| `airport` | Cockpit, Operations, Industry(TrafficOps), Analytics, Simulation | 机场、交通 |
| `datacenter` | Cockpit, Operations, ME Systems, Env&Safety, Maintenance, Analytics, Compliance, DFS | 数据中心 |
| `building` | 除 Industry/Simulation 外全部 | 商业楼宇、园区 |
| `hvac` | Cockpit, Operations, ME Systems(冷机/IAQ), Env&Safety, Maintenance, Analytics, Compliance, DFS | 暖通空调、Honeywell Forge |
| `full` | 全部模块 | 通用/Demo |
