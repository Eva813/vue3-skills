---
title: Lazy Loading and Code Splitting
impact: HIGH  
impactDescription: reduces initial bundle size and improves page load performance
tags: lazy-loading, code-splitting, dynamic-imports, routing, performance
---

## Lazy Loading and Code Splitting

Implement proper lazy loading and code splitting to reduce initial bundle size and improve application startup performance.

**Incorrect (all code loaded upfront):**

```javascript
// ❌ 同步導入所有路由組件
import Home from '@/views/Home.vue'
import About from '@/views/About.vue'
import Dashboard from '@/views/Dashboard.vue'
import UserProfile from '@/views/UserProfile.vue'
import AdminPanel from '@/views/AdminPanel.vue'
import Settings from '@/views/Settings.vue'

// ❌ 同步導入所有組件
import HeavyChart from '@/components/HeavyChart.vue'
import DataTable from '@/components/DataTable.vue'
import VideoPlayer from '@/components/VideoPlayer.vue'

// ❌ 同步導入大型函式庫
import * as echarts from 'echarts'
import * as marked from 'marked'
import * as XLSX from 'xlsx'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/dashboard', component: Dashboard },
  { path: '/profile', component: UserProfile },
  { path: '/admin', component: AdminPanel },
  { path: '/settings', component: Settings },
]
</script>
```

**Correct (lazy loading with code splitting):**

```javascript
// ✅ 路由級別的代碼分割
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard', 
    component: () => import('@/views/Dashboard.vue')
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: () => import('@/views/UserProfile.vue')
  },
  {
    path: '/admin',
    name: 'AdminPanel',
    // ✅ 具名 chunk，便於調試
    component: () => import(/* webpackChunkName: "admin" */ '@/views/AdminPanel.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import(/* webpackChunkName: "user-settings" */ '@/views/Settings.vue')
  },
]

// ✅ 嵌套路由的懶加載
const adminRoutes = {
  path: '/admin',
  component: () => import('@/layouts/AdminLayout.vue'),
  children: [
    {
      path: 'users',
      component: () => import(/* webpackChunkName: "admin-users" */ '@/views/admin/Users.vue')
    },
    {
      path: 'reports',
      component: () => import(/* webpackChunkName: "admin-reports" */ '@/views/admin/Reports.vue')
    },
  ]
}
</script>
```

**Component-Level Lazy Loading:**

```vue
<!-- ❌ 同步導入大型組件 -->
<template>
  <div>
    <heavy-chart v-if="showChart" :data="chartData" />
    <data-table :items="tableData" />
    <video-player v-if="showVideo" :src="videoSrc" />
  </div>
</template>

<script setup>
import HeavyChart from '@/components/HeavyChart.vue'
import DataTable from '@/components/DataTable.vue'
import VideoPlayer from '@/components/VideoPlayer.vue'

const showChart = ref(false)
const showVideo = ref(false)
</script>

<!-- ✅ 組件級別的懶加載 -->
<template>
  <div>
    <!-- 只在需要時才載入 -->
    <Suspense v-if="showChart">
      <template #default>
        <LazyHeavyChart :data="chartData" />
      </template>
      <template #fallback>
        <div class="chart-loading">載入圖表中...</div>
      </template>
    </Suspense>
    
    <!-- 條件懶加載 -->
    <LazyDataTable v-if="tableData.length > 0" :items="tableData" />
    
    <!-- 視窗內才載入 -->
    <LazyVideoPlayer 
      v-if="showVideo && isInViewport"
      :src="videoSrc" 
    />
  </div>
</template>

<script setup>
import { defineAsyncComponent, Suspense } from 'vue'

// ✅ 定義異步組件
const LazyHeavyChart = defineAsyncComponent({
  loader: () => import('@/components/HeavyChart.vue'),
  loadingComponent: () => import('@/components/ChartSkeleton.vue'),
  errorComponent: () => import('@/components/ErrorDisplay.vue'),
  delay: 200,        // 延遲顯示 loading
  timeout: 3000,     // 超時處理
})

const LazyDataTable = defineAsyncComponent(() => 
  import(/* webpackChunkName: "data-table" */ '@/components/DataTable.vue')
)

const LazyVideoPlayer = defineAsyncComponent(() => 
  import(/* webpackChunkName: "video-player" */ '@/components/VideoPlayer.vue')
)

const showChart = ref(false)
const showVideo = ref(false)
const isInViewport = ref(false)
</script>
```

**Library Lazy Loading:**

```javascript
// ✅ 函式庫的懶加載
// composables/useChart.js
export function useChart() {
  const loadEcharts = async () => {
    // ✅ 動態導入圖表庫
    const echarts = await import('echarts/core')
    const { LineChart, BarChart } = await import('echarts/charts')
    const { GridComponent, TooltipComponent } = await import('echarts/components')
    
    echarts.use([LineChart, BarChart, GridComponent, TooltipComponent])
    return echarts
  }

  const createChart = async (element, options) => {
    const echarts = await loadEcharts()
    return echarts.init(element).setOption(options)
  }

  return { createChart }
}

// composables/useExcel.js
export function useExcel() {
  const exportToExcel = async (data, filename) => {
    // ✅ 只在導出時才載入 XLSX
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, filename)
  }

  return { exportToExcel }
}

// composables/useMarkdown.js
export function useMarkdown() {
  const parseMarkdown = async (content) => {
    // ✅ 只在需要解析時才載入 marked
    const { marked } = await import('marked')
    return marked(content)
  }

  return { parseMarkdown }
}
</script>
```

**Intersection Observer Lazy Loading:**

```vue
<!-- ✅ 視窗內懒加載組件 -->
<template>
  <div>
    <!-- 其他內容 -->
    <div class="content-above"></div>
    
    <!-- 懶加載觸發點 -->
    <div ref="lazyTarget" class="lazy-trigger">
      <LazyExpensiveComponent v-if="isVisible" />
      <div v-else class="placeholder">
        即將載入内容...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue'

const LazyExpensiveComponent = defineAsyncComponent(() =>
  import('@/components/ExpensiveComponent.vue')
)

const lazyTarget = ref(null)
const isVisible = ref(false)
let observer = null

onMounted(() => {
  // ✅ 使用 Intersection Observer
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        isVisible.value = true
        observer.unobserve(entry.target) // 載入後停止觀察
      }
    })
  }, {
    rootMargin: '50px', // 提前 50px 載入
    threshold: 0.1,     // 10% 可見時觸發
  })

  if (lazyTarget.value) {
    observer.observe(lazyTarget.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>
```

**Vite Configuration for Code Splitting:**

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        // ✅ 手動配置 chunk 分割
        manualChunks: {
          // 核心 Vue 框架
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          
          // UI 組件庫
          'ui-vendor': ['element-plus', '@element-plus/icons-vue'],
          
          // 工具函式庫
          'utils-vendor': ['lodash-es', 'dayjs', '@vueuse/core'],
          
          // 圖表庫（較大的庫）
          'chart-vendor': ['echarts'],
          
          // 第三方工具（按需加載的庫）
          'tools-vendor': ['xlsx', 'marked', 'html2canvas'],
        },
        
        // ✅ 動態 chunk 命名
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          
          if (facadeModuleId) {
            // 路由組件
            if (facadeModuleId.includes('/views/')) {
              return 'views/[name]-[hash].js'
            }
            // 組件
            if (facadeModuleId.includes('/components/')) {
              return 'components/[name]-[hash].js'
            }
          }
          
          return 'chunks/[name]-[hash].js'
        },
      },
    },
    
    // ✅ Chunk 大小警告閾值
    chunkSizeWarningLimit: 1000, // 1MB
  },
})
```

**Progressive Loading Strategy:**

```javascript
// utils/progressiveLoader.js
export class ProgressiveLoader {
  constructor() {
    this.loadedModules = new Map()
    this.loadingPromises = new Map()
  }

  // ✅ 批次預載入
  async preloadRoutes(routeNames) {
    const promises = routeNames.map(name => this.preloadRoute(name))
    await Promise.allSettled(promises)
  }

  // ✅ 智能預載入（基於用戶行為）
  async preloadRoute(routeName) {
    if (this.loadedModules.has(routeName)) {
      return this.loadedModules.get(routeName)
    }

    if (this.loadingPromises.has(routeName)) {
      return this.loadingPromises.get(routeName)
    }

    const loadPromise = this.loadRouteModule(routeName)
    this.loadingPromises.set(routeName, loadPromise)

    try {
      const module = await loadPromise
      this.loadedModules.set(routeName, module)
      return module
    } finally {
      this.loadingPromises.delete(routeName)
    }
  }

  private async loadRouteModule(routeName) {
    const routeMap = {
      'Dashboard': () => import('@/views/Dashboard.vue'),
      'UserProfile': () => import('@/views/UserProfile.vue'),
      'Settings': () => import('@/views/Settings.vue'),
    }

    const loader = routeMap[routeName]
    if (!loader) throw new Error(`Route ${routeName} not found`)
    
    return loader()
  }
}

// ✅ 使用漸進式載入
const progressiveLoader = new ProgressiveLoader()

// 在應用啟動時預載入關鍵路由
onMounted(() => {
  // 延遲預載入，避免影響初始載入
  setTimeout(() => {
    progressiveLoader.preloadRoutes(['Dashboard', 'UserProfile'])
  }, 2000)
})
```

**Error Handling for Lazy Loading:**

```vue
<!-- ✅ 完善的錯誤處理 -->
<template>
  <div>
    <Suspense>
      <template #default>
        <AsyncComponent @error="handleError" />
      </template>
      <template #fallback>
        <ComponentSkeleton />
      </template>
    </Suspense>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'

const AsyncComponent = defineAsyncComponent({
  loader: () => import('@/components/HeavyComponent.vue'),
  
  // ✅ 載入中顯示的組件
  loadingComponent: () => import('@/components/ComponentSkeleton.vue'),
  
  // ✅ 載入失敗時顯示的組件
  errorComponent: () => import('@/components/LoadErrorDisplay.vue'),
  
  // ✅ 延遲顯示載入組件的時間
  delay: 200,
  
  // ✅ 載入超時時間
  timeout: 5000,
  
  // ✅ 自訂錯誤處理
  onError(error, retry, fail, attempts) {
    console.error('Component loading failed:', error)
    
    // 重試 3 次
    if (attempts < 3) {
      retry()
    } else {
      fail()
    }
  }
})

const handleError = (error) => {
  console.error('Component error:', error)
  // 錯誤上報或其他處理
}
</script>
```

**Performance Monitoring:**

```javascript
// utils/performanceMonitor.js
export function monitorLazyLoading() {
  // ✅ 監控 chunk 載入時間
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('.js') && entry.initiatorType === 'script') {
        console.log(`Chunk loaded: ${entry.name}`)
        console.log(`Loading time: ${entry.duration}ms`)
        
        // 上報性能數據
        analytics.track('chunk_loaded', {
          chunkName: entry.name,
          loadTime: entry.duration,
        })
      }
    })
  })

  observer.observe({ entryTypes: ['navigation', 'resource'] })
}
```

**Best Practices:**

1. **Route-Level Splitting**: Split at route level first
2. **Component Conditions**: Lazy load components based on conditions
3. **Library Splitting**: Dynamically import large libraries
4. **Chunk Naming**: Use meaningful chunk names for debugging
5. **Error Handling**: Always handle loading failures gracefully
6. **Performance Monitoring**: Track chunk loading performance
7. **Progressive Enhancement**: Implement progressive loading strategies

**Performance Impact:**

```bash
# Before (no code splitting)
Initial Bundle: 1.8MB
Time to Interactive: 5.2s
First Contentful Paint: 2.1s

# After (optimized lazy loading)
Initial Bundle: 420KB (-77%)
Time to Interactive: 2.8s (-46%)
First Contentful Paint: 1.2s (-43%)
Additional Chunks: Load on demand
```