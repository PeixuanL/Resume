# SemiOps Demo Runbook

**版本:** v2.0（更新于 2026-02-27，对应 SemiOps v1.0）

---

## 演示前准备 / Pre-Demo Checklist

```bash
# 1. 确认所有容器 healthy
ssh factverse "cd /data/apps/factverse-ai-agent && docker compose ps"

# 2. 如需恢复 Golden snapshot
echo 'y' | sudo bash deploy/snapshot.sh restore golden-demo-v13

# 3. 确认 AI engine DEMO_MODE
ssh factverse "docker exec factverse-ai-engine env | grep DEMO_MODE"
# 预期: DEMO_MODE=true
```

> ⚠️ **注意事项**
> - 演示前确保所有容器状态为 `healthy`
> - 避免在演示时执行大量 API 调用（AI Advisor 并发限制）
> - AI Advisor 响应可能需要 **3–5 秒**，提前告知观众属正常现象

---

## Demo 数据说明 / Demo Data Reference

| 项目 | 说明 |
|------|------|
| Golden Snapshot | **v13** |
| 恢复命令 | `echo 'y' \| sudo bash deploy/snapshot.sh restore golden-demo-v13` |
| AI Engine 模式 | `DEMO_MODE=true`（只读，仅生成 sensor readings，不改 mutation） |
| 登录账号 | admin / admin123 |
| 演示URL | https://factverse.ai（或本地 http://localhost:3000） |

---

## Demo 流程（15分钟版）/ Demo Script

### Step 1 — 登录（~30s）
- 打开 SemiOps，使用 `admin / admin123` 登录
- 进入 **SemiOps 模块**首页

**话术：** "这是我们面向半导体制造的运营智能模块，今天带你走一遍完整业务链路。"

---

### Step 2 — Dashboard 总览（~1min）
- 展示 KPI 卡片：洁净室状态、PUE、OEE、设备告警数、合规状态
- 重点：一屏掌握全局运营健康度

**话术：** "Dashboard 汇聚5大核心指标，管理层可在30秒内判断今天工厂是否正常运营。"

---

### Step 3 — 洁净室管理（~2min）
- 进入**洁净室列表**，展示 CR-A 到 CR-G（ISO 5–8 级分布）
- 点击 **CR-A** → 查看实时粒子数据（≥0.5μm、≥5μm 粒径）
- 切换到 **ISO合规** 标签 → 展示合规状态与历史趋势

**话术：** "CR-A 是我们 ISO Class 5 洁净室，实时粒子监测数据与 ISO 14644 标准自动比对，超标即告警。"

---

### Step 4 — 环境监测（~1.5min）
- 进入**环境监测**页面
- 展示压差梯度（洁净室间正压维持）
- 点击 **AI关联分析** → 查看温湿度与粒子数异常的相关性

**话术：** "压差梯度是洁净室污染防控的核心。AI 自动识别环境参数异常关联，减少人工排查时间。"

---

### Step 5 — SMT产线 OEE（~1.5min）
- 进入 **SMT产线**页面，展示5条产线 OEE 看板
- 点击某条产线 → 查看**缺陷分析**（缺陷类型分布、趋势）

**话术：** "OEE 实时追踪可用性、性能、质量三率，结合缺陷热力图快速定位良率瓶颈。"

---

### Step 6 — 能源 PUE（~1min）
- 进入**能源监控**页面
- 展示实时 PUE（≈1.60）
- 切换**分项计量** → 展示空调/动力/照明/IT/特气 5类能耗

**话术：** "PUE 1.60 表示每消耗1度 IT 用电，总体能耗为1.60度。分项计量帮助识别节能空间。"

---

### Step 7 — 设备健康（~1.5min）
- 进入**设备健康**页面，展示42台设备健康状态矩阵
- 点击某台设备 → 查看**振动分析**（频谱数据）
- 切换到 **FFU滤网寿命**预测（8组压差数据 → 寿命剩余）

**话术：** "振动频谱异常是设备故障的早期信号。滤网寿命预测让维护从被动响应变为主动规划。"

---

### Step 8 — 维护计划（~1min）
- 进入**维护计划**页面
- 展示20条维护计划状态（含逾期提醒标红）
- 展示5套维护模板（标准化作业）

**话术：** "逾期维护任务自动标红，维护模板保证作业标准化，降低人为失误风险。"

---

### Step 9 — 合规报告（~1min）
- 进入**合规报告**页面
- 点击**一键生成**按钮 → 展示 ISO 合规报告预览（自动填充数据）

**话术：** "合规报告过去需要2–3天人工整理，现在30秒自动生成，数据直接来自系统实测值。"

---

### Step 10 — 决策中心（~1min）
- 进入**决策中心**页面
- 展示近期决策列表（AI推荐 + 人工确认状态）
- 切换**历史查询**，展示按时间筛选功能

**话术：** "决策中心记录每一个运营决策及其 AI 建议依据，形成可追溯的决策链。"

---

### Step 11 — AI Advisor 对话演示（~2min）
- 打开 **AI Advisor** 对话框
- 输入：`CR-A洁净室状态？`
  - 预期：返回 CR-A 粒子数、压差、ISO等级合规情况
- 输入：`PUE为什么高？`
  - 预期：返回能耗分析、空调系统占比建议

**话术：** "AI Advisor 支持自然语言查询，理解 PCB/FPC 专业术语，回答基于实时数据而非预设脚本。"

---

## 兜底策略 / Fallback Strategies

| 情况 | 处理方式 |
|------|----------|
| 某页数据异常 | 回到 Dashboard → 强调价值层，跳过该页继续主流程 |
| API 接口波动 | 切静态截图继续业务叙事，不中断节奏 |
| AI Advisor 无响应 | 说"后台正在实时分析"，展示历史问答截图 |
| 容器异常 | 提前准备录屏备份（screen-recording/semiops-v13-demo.mp4） |

---

## 演示后 / Post-Demo

```bash
# 如需重置演示数据
echo 'y' | sudo bash deploy/snapshot.sh restore golden-demo-v13
```

---

## 版本历史 / Changelog

| 版本 | 日期 | 说明 |
|------|------|------|
| v2.0 | 2026-02-27 | 更新为15分钟完整版，对应 SemiOps v1.0（22页/35端点） |
| v1.0 | 2026-02-26 | 初版10分钟演示流程 |
