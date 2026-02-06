---
title: Async Components for Code Splitting
impact: CRITICAL
impactDescription: directly affects initial bundle size and loading performance
tags: component, async, code-splitting, lazy-loading, performance
---

## Async Components for Code Splitting

Use `defineAsyncComponent` to lazy-load heavy components and reduce initial bundle size for better loading performance.

**Incorrect (synchronous import of heavy components):**

```vue
<template>
  <div>
    <header-component />
    
    <!-- ❌ 大型組件同步載入，增加初始束包大小 -->
    <chart-dashboard :data="chartData" />
    <rich-text-editor v-model="content" />
    <data-table :items="tableData" />
    
    <modal v-if="showModal">
      <complex-form @submit="handleSubmit" />
    </modal>
  </div>
</template>

<script setup>
// ❌ 所有組件同步導入
import HeaderComponent from '@/components/HeaderComponent.vue'
import ChartDashboard from '@/components/ChartDashboard.vue'    // ~200KB
import RichTextEditor from '@/components/RichTextEditor.vue'    // ~150KB  
import DataTable from '@/components/DataTable.vue'              // ~100KB
import ComplexForm from '@/components/ComplexForm.vue'          // ~80KB

// 總計：~530KB 額外的初始束包大小
</script>
```

**Correct (async components with proper loading states):**

```vue
<template>
  <div>
    <header-component />
    
    <!-- ✅ 非同步組件載入 -->
    <Suspense>
      <template #default>
        <chart-dashboard :data="chartData" />
      </template>
      <template #fallback>
        <div class="loading-skeleton">載入圖表中...</div>
      </template>
    </Suspense>
    
    <rich-text-editor v-model="content" />
    
    <data-table :items="tableData" />
    
    <!-- ✅ Modal 內容延遲載入 -->
    <modal v-if="showModal">
      <Suspense>
        <template #default>
          <complex-form @submit="handleSubmit" />
        </template>
        <template #fallback>
          <div class="form-loading">準備表單中...</div>
        </template>
      </Suspense>
    </modal>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import HeaderComponent from '@/components/HeaderComponent.vue'

// ✅ 定義非同步組件
const ChartDashboard = defineAsyncComponent({
  loader: () => import('@/components/ChartDashboard.vue'),
  loadingComponent: () => <div class="chart-loading">載入圖表...</div>,
  errorComponent: () => <div class="chart-error">圖表載入失敗</div>,
  delay: 200,
  timeout: 5000
})

const RichTextEditor = defineAsyncComponent({
  loader: () => import('@/components/RichTextEditor.vue'),
  loadingComponent: () => <div class="editor-loading">載入編輯器...</div>,
  delay: 100
})

const DataTable = defineAsyncComponent(() => import('@/components/DataTable.vue'))

const ComplexForm = defineAsyncComponent(() => import('@/components/ComplexForm.vue'))
</script>
```

**Advanced Pattern with Conditional Loading:**

```vue
<template>
  <div>
    <nav-tabs v-model="activeTab" :tabs="tabs" />
    
    <!-- ✅ 根據 tab 條件載入 -->
    <keep-alive>
      <component :is="currentTabComponent" />
    </keep-alive>
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent } from 'vue'

const activeTab = ref('dashboard')

// ✅ 按需載入不同的 tab 組件
const tabComponents = {
  dashboard: defineAsyncComponent(() => import('@/views/DashboardTab.vue')),
  analytics: defineAsyncComponent(() => import('@/views/AnalyticsTab.vue')),
  settings: defineAsyncComponent(() => import('@/views/SettingsTab.vue')),
  reports: defineAsyncComponent({
    loader: () => import('@/views/ReportsTab.vue'),
    loadingComponent: () => <div>載入報表模組...</div>,
    delay: 300
  })
}

const currentTabComponent = computed(() => tabComponents[activeTab.value])
</script>
```

**Performance Optimization with Preloading:**

```vue
<script setup>
import { defineAsyncComponent, onMounted } from 'vue'

// ✅ 基本非同步載入
const HeavyComponent = defineAsyncComponent(() => import('@/components/HeavyComponent.vue'))

// ✅ 預載入策略
onMounted(() => {
  // 延遲預載入可能需要的組件
  setTimeout(() => {
    import('@/components/UpcomingFeature.vue')
    import('@/components/SearchModal.vue')
  }, 2000)
})

// ✅ 滑鼠懸停時預載入
const preloadComponent = () => {
  import('@/components/TooltipContent.vue')
}
</script>

<template>
  <div>
    <heavy-component />
    <button @mouseenter="preloadComponent">顯示提示</button>
  </div>
</template>
```

**With Error Handling and Retry:**

```vue
<script setup>
import { defineAsyncComponent, ref } from 'vue'

const retryCount = ref(0)
const maxRetries = 3

const ResilientComponent = defineAsyncComponent({
  loader: async () => {
    try {
      return await import('@/components/ImportantFeature.vue')
    } catch (error) {
      if (retryCount.value < maxRetries) {
        retryCount.value++
        console.log(`重試載入組件，第 ${retryCount.value} 次`)
        // 延遲重試
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount.value))
        return import('@/components/ImportantFeature.vue')
      }
      throw error
    }
  },
  loadingComponent: () => <div>載入重要功能中...</div>,
  errorComponent: () => (
    <div class="error-state">
      <p>載入失敗 ({retryCount.value}/{maxRetries})</p>
      <button onClick={() => location.reload()}>重新載入頁面</button>
    </div>
  ),
  delay: 200,
  timeout: 10000
})
</script>
```

**Bundle Analysis Impact:**

```bash
# Before (同步載入)
Initial Bundle: 1.2MB
Time to Interactive: 3.2s

# After (非同步載入)  
Initial Bundle: 650KB (-46%)
Time to Interactive: 1.8s (-44%)
Lazy Chunks: dashboard.js (200KB), editor.js (150KB)
```

**Best Practices:**

1. **Critical Path**: Keep critical components synchronous
2. **Loading States**: Always provide loading components
3. **Error Handling**: Implement fallback error components  
4. **Preloading**: Preload on user interaction hints
5. **Cache Strategy**: Use keep-alive for expensive components
6. **Bundle Analysis**: Monitor chunk sizes regularly

**Note:** Use async components for any component larger than 50KB or components not immediately visible to users.