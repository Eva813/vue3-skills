---
title: Tree-Shaking Optimization
impact: HIGH
impactDescription: reduces bundle size by eliminating unused code
tags: bundle, tree-shaking, imports, optimization, vite
---

## Tree-Shaking Optimization

Structure imports to maximize tree-shaking effectiveness and eliminate unused code from your final bundle.

**Incorrect (imports that prevent tree-shaking):**

```javascript
// ❌ 全量導入會包含整個函式庫
import * as _ from 'lodash'                    // 整個 lodash (~70KB)
import * as dayjs from 'dayjs'                 // 整個 dayjs (~30KB)
import Vue from 'vue'                          // Vue 2 風格導入

// ❌ 預設導入可能包含不必要的代碼
import utils from '@/utils'                    // 整個 utils 模組
import { components } from '@/components'      // 整個 components 目錄

// ❌ 動態導入但沒有正確結構化
const helper = await import('@/helpers')
const result = helper.default.processData(data)

// ❌ CSS 全量導入
import 'element-plus/dist/index.css'          // 完整 CSS (~200KB)
import 'bootstrap/dist/css/bootstrap.css'     // 完整 Bootstrap
</script>
```

**Correct (tree-shaking friendly imports):**

```javascript
// ✅ 具名導入，只包含使用的函數
import { debounce, throttle, cloneDeep } from 'lodash-es'  // 只有這 3 個函數
import { format, parse, isValid } from 'date-fns'          // 只有需要的日期函數
import { ref, computed, onMounted } from 'vue'             // 只導入使用的 Vue API

// ✅ 直接從子路徑導入
import debounce from 'lodash-es/debounce'                  // 最小化導入
import format from 'date-fns/format'                      // 單一函數導入

// ✅ 結構化的 utils 導入
import { formatCurrency } from '@/utils/format'
import { validateEmail } from '@/utils/validation'
import { storage } from '@/utils/storage'

// ✅ 按需導入組件
import { ElButton, ElInput, ElForm } from 'element-plus'

// ✅ CSS 按需導入（使用 Vite 插件）
// vite.config.js 中配置自動導入 CSS
```

**Vite Configuration for Optimal Tree-Shaking:**

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    // ✅ 自動導入插件
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        '@vueuse/core',
      ],
      dts: true, // 生成類型定義
    }),
    // ✅ 組件自動導入
    Components({
      dts: true,
      resolvers: [
        // Element Plus 按需導入
        ElementPlusResolver({
          importStyle: 'sass', // 按需導入樣式
        }),
      ],
    }),
  ],
  build: {
    rollupOptions: {
      // ✅ 手動 chunk 分割
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],
          'ui-vendor': ['element-plus'],
          'utils-vendor': ['lodash-es', 'date-fns'],
        },
      },
    },
  },
  // ✅ 優化依賴處理
  optimizeDeps: {
    include: ['lodash-es', 'date-fns'],
    exclude: ['@vueuse/core'], // 開發時排除以利於樹搖
  },
})
```

**Utils Module Structure for Tree-Shaking:**

```javascript
// ❌ utils/index.js - 不利於 tree-shaking
export default {
  format: {
    currency: (value) => { /* ... */ },
    date: (value) => { /* ... */ },
    phone: (value) => { /* ... */ },
  },
  validate: {
    email: (email) => { /* ... */ },
    phone: (phone) => { /* ... */ },
    url: (url) => { /* ... */ },
  },
  // 所有函數都會被打包
}

// ✅ 分離的模組 - 利於 tree-shaking
// utils/format.js
export const formatCurrency = (value) => { /* ... */ }
export const formatDate = (value) => { /* ... */ }
export const formatPhone = (value) => { /* ... */ }

// utils/validate.js  
export const validateEmail = (email) => { /* ... */ }
export const validatePhone = (phone) => { /* ... */ }
export const validateUrl = (url) => { /* ... */ }

// utils/index.js - 重新導出
export { formatCurrency, formatDate, formatPhone } from './format'
export { validateEmail, validatePhone, validateUrl } from './validate'
```

**Component Library Tree-Shaking:**

```vue
<!-- ❌ 全量導入組件庫 -->
<template>
  <div>
    <el-button>按鈕</el-button>
    <el-input v-model="input" />
  </div>
</template>

<script setup>
// ❌ 導入整個 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
</script>

<!-- ✅ 按需導入組件 -->
<template>
  <div>
    <el-button>按鈕</el-button>  
    <el-input v-model="input" />
  </div>
</template>

<script setup>
// ✅ 只導入需要的組件
import { ElButton, ElInput } from 'element-plus'
import { ref } from 'vue'

const input = ref('')
</script>

<style>
/* ✅ 只導入需要的 CSS */
@import 'element-plus/es/components/button/style/css';
@import 'element-plus/es/components/input/style/css';
</style>
```

**Advanced Tree-Shaking with Composables:**

```javascript
// ✅ composables/index.js - 結構化導出
export { useCounter } from './useCounter'
export { useLocalStorage } from './useLocalStorage'  
export { useApi } from './useApi'
export { useAuth } from './useAuth'

// ✅ 使用時只導入需要的
import { useCounter, useLocalStorage } from '@/composables'

// ✅ 或者直接從檔案導入
import { useCounter } from '@/composables/useCounter'
import { useAuth } from '@/composables/useAuth'
```

**Bundle Analysis and Monitoring:**

```bash
# ✅ 分析 bundle 大小
npm run build -- --analyze

# ✅ 使用 rollup-plugin-visualizer
npm install rollup-plugin-visualizer -D
```

```javascript
// vite.config.js
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    // ✅ Bundle 分析器
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
    }),
  ],
})
```

**Third-Party Library Optimization:**

```javascript
// ❌ 會打包整個函式庫的方式
import moment from 'moment'
import * as echarts from 'echarts'

// ✅ 優化的導入方式
import dayjs from 'dayjs'                              // 更小的日期庫
import * as echarts from 'echarts/core'                // 核心
import { LineChart, BarChart } from 'echarts/charts'   // 只導入需要的圖表
import { GridComponent, TooltipComponent } from 'echarts/components'

// 注冊組件
echarts.use([LineChart, BarChart, GridComponent, TooltipComponent])
```

**Performance Impact:**

```bash
# Before (無 tree-shaking 優化)
Bundle Size: 2.1MB
Gzipped: 580KB
Loading Time: 4.2s

# After (tree-shaking 優化)  
Bundle Size: 1.2MB (-43%)
Gzipped: 320KB (-45%)
Loading Time: 2.4s (-43%)
```

**Best Practices:**

1. **Named Imports**: Prefer named imports over default imports
2. **Direct Imports**: Import from specific paths when possible
3. **Module Structure**: Structure your own modules for tree-shaking
4. **Bundle Analysis**: Regularly analyze bundle size
5. **Plugin Configuration**: Use Vite plugins for automatic optimization
6. **Library Selection**: Choose tree-shaking friendly libraries

**Note:** Always verify tree-shaking effectiveness by analyzing your final bundle with tools like `rollup-plugin-visualizer`.