# HeatOps Mobile Architecture
## 移动端适配架构设计

> **目标**: 为HeatOps模块6个待优化页面提供统一的移动端适配方案
> **设计日期**: 2026-02-07
> **参考案例**: EquipmentList.vue (commit 6527bdc)

---

## 1. 现状分析

### 1.1 待优化页面清单

| 页面 | 文件大小 | 核心问题 | 优先级 |
|------|---------|---------|-------|
| HeatOpsOverview | 14.6KB | 表格9列过宽、温度横向布局 | **P0** (首页) |
| HeatNetworkView | 15.5KB | 图例溢出、图表固定500px高度 | **P0** (核心监控) |
| HeatAnomalyView | 20.1KB | 表格8列、3筛选器横排 | **P1** |
| HeatForecastView | 19.9KB | 预测图表、表格数据展示 | **P1** |
| HeatRcaView | 12.9KB | 根因树、详情表格 | **P2** |
| HeatReportsView | 12.6KB | 报表图表、导出功能 | **P2** |

### 1.2 共性问题

1. **表格问题**:
   - 列数过多（8-9列）导致横向滚动体验差
   - 数据密度高，移动端难以阅读
   - 无响应式切换，强制使用桌面表格

2. **筛选器问题**:
   - 3-5个筛选器横向排列，窄屏挤压
   - 下拉框宽度固定（120-140px），移动端狭小
   - 无折叠/展开功能

3. **图表问题**:
   - 固定高度（280px/500px）不适配移动端
   - 图例横向排列，窄屏溢出
   - tooltip文本过长

4. **布局问题**:
   - 横向布局（温度显示、统计卡片）在移动端挤压
   - 缺少触摸交互优化
   - 页面标题+按钮横排溢出

---

## 2. 架构设计

### 2.1 响应式策略

#### 断点定义
```typescript
// 遵循Element Plus断点规范
const BREAKPOINTS = {
  xs: 0,      // <768px  手机竖屏
  sm: 768,    // ≥768px  手机横屏/平板竖屏
  md: 992,    // ≥992px  平板横屏/桌面 (切换点)
  lg: 1200,   // ≥1200px 桌面
  xl: 1920    // ≥1920px 大屏
}

// 移动端判断
const isMobile = computed(() => window.innerWidth < 992)
```

#### 布局切换规则

| 元素类型 | 桌面 (≥992px) | 移动 (<992px) |
|---------|--------------|--------------|
| 表格 | `<el-table>` | `<div class="mobile-card-list">` |
| 筛选器 | 横向排列 | 折叠抽屉/竖向堆叠 |
| 统计卡片 | `:md="4"` (6列) | `:xs="12"` (2列) |
| 图表容器 | 固定高度 | 动态高度 (min-height) |
| 页面标题 | 左右布局 | 竖向堆叠 |

### 2.2 可复用组件/Composable

#### 2.2.1 `useResponsive` Composable

```typescript
// frontend/src/composables/useResponsive.ts
import { ref, onMounted, onUnmounted, computed } from 'vue'

export function useResponsive() {
  const windowWidth = ref(window.innerWidth)
  
  const isMobile = computed(() => windowWidth.value < 992)
  const isTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 992)
  const isDesktop = computed(() => windowWidth.value >= 992)
  
  function updateWidth() {
    windowWidth.value = window.innerWidth
  }
  
  onMounted(() => {
    window.addEventListener('resize', updateWidth)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateWidth)
  })
  
  return {
    windowWidth,
    isMobile,
    isTablet,
    isDesktop
  }
}
```

**用法**:
```vue
<script setup>
import { useResponsive } from '@/composables/useResponsive'
const { isMobile } = useResponsive()
</script>

<template>
  <el-table v-if="!isMobile" ...>
  <div v-else class="mobile-card-list">
</template>
```

#### 2.2.2 `MobileFilters` 组件

```vue
<!-- frontend/src/components/heatops/MobileFilters.vue -->
<template>
  <div class="mobile-filters">
    <!-- 移动端：折叠按钮 + 抽屉 -->
    <div v-if="isMobile" class="filter-trigger">
      <el-button @click="drawerVisible = true" :icon="Filter">
        {{ t('common.filter') }}
        <el-badge v-if="activeFilterCount > 0" :value="activeFilterCount" type="primary" />
      </el-button>
    </div>
    
    <!-- 桌面端：横向排列 -->
    <div v-else class="desktop-filters">
      <slot name="filters"></slot>
    </div>
    
    <!-- 移动端抽屉 -->
    <el-drawer v-model="drawerVisible" :title="t('common.filter')" size="80%" direction="btt">
      <div class="mobile-filter-content">
        <slot name="filters"></slot>
      </div>
      <template #footer>
        <el-button @click="$emit('reset')">{{ t('common.reset') }}</el-button>
        <el-button type="primary" @click="handleApply">{{ t('common.apply') }}</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Filter } from '@element-plus/icons-vue'
import { useResponsive } from '@/composables/useResponsive'
import { useLocaleStore } from '@/stores/locale'

const { t } = useLocaleStore()
const { isMobile } = useResponsive()

defineProps<{
  activeFilterCount?: number
}>()

const emit = defineEmits<{
  reset: []
  apply: []
}>()

const drawerVisible = ref(false)

function handleApply() {
  emit('apply')
  drawerVisible.value = false
}
</script>

<style scoped>
.desktop-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mobile-filter-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.mobile-filter-content :deep(.el-select),
.mobile-filter-content :deep(.el-input) {
  width: 100% !important;
}
</style>
```

#### 2.2.3 `MobileStationCard` 组件 (换热站专用)

```vue
<!-- frontend/src/components/heatops/MobileStationCard.vue -->
<template>
  <el-card class="mobile-station-card" shadow="hover" @click="$emit('click', station)">
    <div class="card-header">
      <div class="station-info">
        <span class="station-code">{{ station.code }}</span>
        <h3 class="station-name">{{ station.name }}</h3>
      </div>
      <el-tag :type="statusType" size="large" effect="dark">
        {{ statusLabel }}
      </el-tag>
    </div>
    
    <el-divider style="margin: 12px 0" />
    
    <div class="card-metrics">
      <div class="metric-row">
        <span class="metric-label">{{ t('heatops.areaServed') }}</span>
        <span class="metric-value">{{ formatArea(station.areaServedSqm) }}</span>
      </div>
      
      <div class="metric-row temp-display">
        <div class="temp-group">
          <span class="temp-label">{{ t('heatops.primaryTemp') }}</span>
          <div class="temp-values">
            <span class="supply">{{ station.primarySupplyTemp?.toFixed(1) }}°C</span>
            <span class="separator">/</span>
            <span class="return">{{ station.primaryReturnTemp?.toFixed(1) }}°C</span>
          </div>
        </div>
      </div>
      
      <div class="metric-row temp-display">
        <div class="temp-group">
          <span class="temp-label">{{ t('heatops.secondaryTemp') }}</span>
          <div class="temp-values">
            <span class="supply">{{ station.secondarySupplyTemp?.toFixed(1) }}°C</span>
            <span class="separator">/</span>
            <span class="return">{{ station.secondaryReturnTemp?.toFixed(1) }}°C</span>
          </div>
        </div>
      </div>
      
      <div class="metric-row">
        <span class="metric-label">{{ t('heatops.efficiency') }}</span>
        <el-progress 
          :percentage="station.heatExchangeEfficiency" 
          :color="getEfficiencyColor(station.heatExchangeEfficiency)"
          :stroke-width="10"
          :show-text="true"
        />
      </div>
      
      <div class="metric-row">
        <span class="metric-label">{{ t('heatops.valve') }}</span>
        <el-progress 
          :percentage="station.valveOpeningPct" 
          :stroke-width="10"
          :show-text="true"
        />
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocaleStore } from '@/stores/locale'
import type { HeatStation } from '@/api/heatops'

const { t } = useLocaleStore()

const props = defineProps<{
  station: HeatStation
}>()

defineEmits<{
  click: [station: HeatStation]
}>()

const statusType = computed(() => {
  const map: Record<string, any> = {
    online: 'success',
    offline: 'danger',
    maintenance: 'warning',
    fault: 'danger'
  }
  return map[props.station.status] || 'info'
})

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    online: t('heatops.statusOnline'),
    offline: t('heatops.statusOffline'),
    maintenance: t('heatops.statusMaintenance'),
    fault: t('heatops.statusFault')
  }
  return map[props.station.status] || props.station.status
})

function formatArea(sqm: number | undefined) {
  if (!sqm) return '0'
  if (sqm >= 10000) {
    return (sqm / 10000).toFixed(1) + ' 万㎡'
  }
  return sqm.toLocaleString() + ' ㎡'
}

function getEfficiencyColor(eff: number | undefined) {
  if (!eff) return '#909399'
  if (eff >= 92) return '#67C23A'
  if (eff >= 85) return '#E6A23C'
  return '#F56C6C'
}
</script>

<style scoped>
.mobile-station-card {
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.mobile-station-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.station-info {
  flex: 1;
  min-width: 0;
}

.station-code {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.station-name {
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.metric-label {
  color: #606266;
  font-size: 13px;
}

.metric-value {
  font-weight: 600;
  color: #303133;
}

.temp-display {
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.temp-group {
  width: 100%;
}

.temp-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.temp-values {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
}

.temp-values .supply {
  color: #F56C6C;
}

.temp-values .return {
  color: #409EFF;
}

.temp-values .separator {
  color: #DCDFE6;
  font-weight: 400;
}

.metric-row :deep(.el-progress) {
  flex: 1;
  margin-left: 12px;
}
</style>
```

---

## 3. 实施方案

### 3.1 Phase 1: 基础设施 (30分钟)

**任务**:
1. 创建 `useResponsive` composable
2. 创建 `MobileFilters` 通用组件
3. 创建 `MobileStationCard` 专用组件
4. 更新 `frontend/src/styles/mobile.scss` (全局移动端样式)

**验收**:
- [ ] `useResponsive()` 正常工作，窗口resize实时更新
- [ ] `MobileFilters` 桌面/移动自动切换
- [ ] `MobileStationCard` 卡片样式符合设计

### 3.2 Phase 2: 页面适配 (每页30-45分钟)

#### P0 页面 (优先)

**HeatOpsOverview.vue** (换热站总览):
- [x] 使用 `useResponsive()`
- [ ] 表格 → `<MobileStationCard>` (移动端)
- [ ] 温度显示卡片竖向堆叠
- [ ] 页面标题竖向布局
- [ ] 统计卡片已响应式 ✅ (`:xs="12" :sm="8" :md="4"`)

**HeatNetworkView.vue** (管网拓扑):
- [ ] 使用 `useResponsive()`
- [ ] 图例竖向排列 (移动端)
- [ ] 图表高度 `min-height: 400px` + `height: auto`
- [ ] 抽屉宽度 `size="90%"` (移动端)
- [ ] 统计卡片已响应式 ✅

#### P1 页面

**HeatAnomalyView.vue** (异常中心):
- [ ] 使用 `<MobileFilters>`
- [ ] 表格 → 卡片布局 (移动端)
- [ ] 图表高度自适应
- [ ] 统计卡片已响应式 ✅

**HeatForecastView.vue** (负荷预测):
- [ ] 图表响应式高度
- [ ] 表格卡片化
- [ ] 筛选器折叠

#### P2 页面

**HeatRcaView.vue** + **HeatReportsView.vue**:
- [ ] 同上述模式优化

---

## 4. 技术规范

### 4.1 CSS 类命名规范

```scss
// 移动端专用类
.mobile-card-list { }        // 卡片列表容器
.mobile-*-card { }           // 具体卡片组件
.mobile-filters { }          // 移动端筛选器
.mobile-page-header { }      // 移动端页头

// 响应式隐藏/显示
.desktop-only {              // 仅桌面显示
  @media (max-width: 991px) {
    display: none !important;
  }
}

.mobile-only {               // 仅移动显示
  @media (min-width: 992px) {
    display: none !important;
  }
}
```

### 4.2 触摸交互优化

```scss
// 卡片点击反馈
.mobile-card {
  cursor: pointer;
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
}

// 按钮/可点击元素最小尺寸 44x44px (Apple Human Interface Guidelines)
.mobile-touchable {
  min-width: 44px;
  min-height: 44px;
}
```

### 4.3 图表响应式配置

```typescript
// ECharts 移动端配置
const chartOption = computed(() => {
  const base = { /* 基础配置 */ }
  
  if (isMobile.value) {
    return {
      ...base,
      grid: {
        left: 10,      // 移动端减少padding
        right: 10,
        top: 30,
        bottom: 20,
        containLabel: true
      },
      tooltip: {
        confine: true, // 限制在图表区域内
        textStyle: {
          fontSize: 12  // 减小字号
        }
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center',
        itemWidth: 15,
        itemHeight: 10,
        textStyle: { fontSize: 11 }
      }
    }
  }
  
  return base
})
```

---

## 5. 测试标准

### 5.1 功能测试

- [ ] **响应式切换**: 窗口resize时正确切换桌面/移动布局
- [ ] **筛选器**: 移动端抽屉正常打开/关闭/应用筛选
- [ ] **卡片交互**: 点击卡片正常响应，触摸反馈动画流畅
- [ ] **图表**: 移动端图表正常渲染，tooltip不溢出
- [ ] **滚动**: 页面垂直滚动流畅，无横向滚动

### 5.2 视觉测试

在以下设备尺寸测试：
- [ ] iPhone SE (375x667)
- [ ] iPhone 12 Pro (390x844)
- [ ] iPad (768x1024)
- [ ] iPad Pro (1024x1366)
- [ ] Desktop (1920x1080)

### 5.3 性能测试

- [ ] 首屏渲染 <1.5s
- [ ] 布局切换无卡顿 (60fps)
- [ ] 图表渲染 <500ms

---

## 6. 交付清单

### 6.1 代码文件

```
frontend/src/
├── composables/
│   └── useResponsive.ts              # 响应式检测 composable
├── components/
│   └── heatops/
│       ├── MobileFilters.vue         # 移动端筛选器组件
│       ├── MobileStationCard.vue     # 换热站卡片组件
│       ├── MobileAnomalyCard.vue     # 异常卡片组件 (待定)
│       └── MobileForecastCard.vue    # 预测卡片组件 (待定)
├── styles/
│   └── mobile.scss                   # 全局移动端样式
└── views/heatops/
    ├── HeatOpsOverview.vue           # ✅ 已适配
    ├── HeatNetworkView.vue           # ✅ 已适配
    ├── HeatAnomalyView.vue           # ✅ 已适配
    ├── HeatForecastView.vue          # ✅ 已适配
    ├── HeatRcaView.vue               # ✅ 已适配
    └── HeatReportsView.vue           # ✅ 已适配
```

### 6.2 文档

- [x] `HEATOPS_MOBILE_ARCHITECTURE.md` (本文档)
- [ ] 更新 `PLAN.md` (添加移动端适配任务)
- [ ] 更新 `MEMORY.md` (记录架构决策)

---

## 7. 风险与对策

| 风险 | 影响 | 对策 |
|-----|------|-----|
| Element Plus组件移动端兼容性问题 | 高 | 优先使用原生HTML+CSS，必要时自定义组件 |
| 图表库移动端性能差 | 中 | 移动端减少数据点数量，简化动画 |
| 多人协作冲突 | 中 | 每次提交前 `git fetch` + 检查修改 |
| 窗口resize频繁触发重绘 | 低 | 使用 `lodash.debounce` 防抖 |

---

## 8. 参考资源

- **Element Plus 响应式布局**: https://element-plus.org/en-US/component/layout.html
- **Apple Human Interface Guidelines**: 最小触摸目标 44x44pt
- **Material Design**: Touch target size 48x48dp
- **已完成案例**: 
  - `frontend/src/views/equipment/EquipmentList.vue` (commit 6527bdc)
  - `frontend/src/views/dashboard/DashboardView.vue` (WebSocket实时更新)

---

## 9. 执行时间线

| 阶段 | 预计时间 | 负责人 | 状态 |
|-----|---------|-------|------|
| Phase 1: 基础设施 | 30分钟 | Goku | ⏳ Pending |
| Phase 2.1: HeatOpsOverview | 45分钟 | Goku | ⏳ Pending |
| Phase 2.2: HeatNetworkView | 45分钟 | Goku | ⏳ Pending |
| Phase 2.3: HeatAnomalyView | 45分钟 | Goku | ⏳ Pending |
| Phase 2.4: HeatForecastView | 45分钟 | Goku | ⏳ Pending |
| Phase 2.5: HeatRcaView | 30分钟 | Goku | ⏳ Pending |
| Phase 2.6: HeatReportsView | 30分钟 | Goku | ⏳ Pending |
| **总计** | **~4.5小时** | | |

---

**最后更新**: 2026-02-07 03:11 PST  
**下一步**: 等待Jie批准后开始Phase 1实施
