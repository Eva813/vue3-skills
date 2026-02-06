---
title: Computed Property Caching Optimization
impact: CRITICAL  
impactDescription: leverages Vue's built-in caching for expensive calculations
tags: reactivity, computed, caching, performance, optimization
---

## Computed Property Caching Optimization

Leverage Vue's computed property caching to avoid expensive recalculations and optimize rendering performance.

**Incorrect (method calls in template, recalculates on every render):**

```vue
<template>
  <div>
    <!-- ❌ 每次渲染都重新計算 -->
    <div class="total">總計: {{ calculateTotal() }}</div>
    <div class="tax">稅額: {{ calculateTax() }}</div>
    <div class="shipping">運費: {{ calculateShipping() }}</div>
    
    <!-- ❌ 複雜過濾在每次渲染時執行 -->
    <ul>
      <li v-for="item in filterExpensiveItems()" :key="item.id">
        {{ item.name }}: ${{ formatPrice(item.price) }}
      </li>
    </ul>
    
    <!-- ❌ 排序在每次鍵盤輸入時重新執行 -->
    <input v-model="searchQuery" placeholder="搜索..." />
    <div v-for="result in sortSearchResults()" :key="result.id">
      {{ result.title }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const items = ref([/* 大量商品資料 */])
const searchQuery = ref('')

// ❌ 方法每次都重新計算
const calculateTotal = () => {
  console.log('計算總計...') // 每次渲染都會執行
  return items.value.reduce((sum, item) => sum + item.price, 0)
}

const calculateTax = () => {
  console.log('計算稅額...') // 每次渲染都會執行
  return calculateTotal() * 0.08
}

const filterExpensiveItems = () => {
  console.log('過濾昂貴商品...') // 每次渲染都會執行
  return items.value.filter(item => item.price > 100)
}

const sortSearchResults = () => {
  console.log('排序搜尻結果...') // 每次輸入都會執行
  return items.value
    .filter(item => item.name.includes(searchQuery.value))
    .sort((a, b) => a.name.localeCompare(b.name))
}
</script>
```

**Correct (computed properties with automatic caching):**

```vue
<template>
  <div>
    <!-- ✅ 快取計算結果，只在依賴改變時重算 -->
    <div class="total">總計: {{ totalAmount }}</div>
    <div class="tax">稅額: {{ taxAmount }}</div>
    <div class="shipping">運費: {{ shippingCost }}</div>
    
    <!-- ✅ 快取的過濾結果 -->
    <ul>
      <li v-for="item in expensiveItems" :key="item.id">
        {{ item.name }}: ${{ formatPrice(item.price) }}
      </li>
    </ul>
    
    <!-- ✅ 快取的搜索和排序結果 -->
    <input v-model="searchQuery" placeholder="搜索..." />
    <div v-for="result in sortedSearchResults" :key="result.id">
      {{ result.title }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const items = ref([/* 大量商品資料 */])
const searchQuery = ref('')

// ✅ Computed 屬性自動快取
const totalAmount = computed(() => {
  console.log('計算總計...') // 只在 items 改變時執行
  return items.value.reduce((sum, item) => sum + item.price, 0)
})

const taxAmount = computed(() => {
  console.log('計算稅額...') // 只在 totalAmount 改變時執行
  return totalAmount.value * 0.08
})

const shippingCost = computed(() => {
  // 基於總額的運費計算
  const total = totalAmount.value
  if (total > 1000) return 0
  if (total > 500) return 50
  return 100
})

const expensiveItems = computed(() => {
  console.log('過濾昂貴商品...') // 只在 items 改變時執行
  return items.value.filter(item => item.price > 100)
})

const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value
  
  console.log('過濾搜索結果...') // 只在 items 或 searchQuery 改變時執行
  return items.value.filter(item => 
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const sortedSearchResults = computed(() => {
  console.log('排序搜索結果...') // 只在 filteredItems 改變時執行
  return filteredItems.value
    .slice() // 避免修改原陣列
    .sort((a, b) => a.name.localeCompare(b.name))
})
</script>
```

**Advanced Computed Patterns:**

```vue
<script setup>
import { ref, computed, watchEffect } from 'vue'

const products = ref([])
const category = ref('all')
const sortBy = ref('name')
const sortOrder = ref('asc')

// ✅ 多層 computed 依賴鏈
const filteredProducts = computed(() => {
  if (category.value === 'all') return products.value
  return products.value.filter(p => p.category === category.value)
})

const sortedProducts = computed(() => {
  return filteredProducts.value
    .slice()
    .sort((a, b) => {
      const factor = sortOrder.value === 'asc' ? 1 : -1
      return a[sortBy.value].localeCompare(b[sortBy.value]) * factor
    })
})

// ✅ 複雜的統計計算
const productStatistics = computed(() => {
  const products = filteredProducts.value
  
  return {
    total: products.length,
    averagePrice: products.reduce((sum, p) => sum + p.price, 0) / products.length || 0,
    priceRange: {
      min: Math.min(...products.map(p => p.price)) || 0,
      max: Math.max(...products.map(p => p.price)) || 0
    },
    categoryCounts: products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1
      return acc
    }, {})
  }
})

// ✅ Getter 和 Setter 的 computed
const selectedProductIds = ref(new Set())

const selectedProducts = computed({
  get: () => {
    return products.value.filter(p => selectedProductIds.value.has(p.id))
  },
  set: (newProducts) => {
    selectedProductIds.value = new Set(newProducts.map(p => p.id))
  }
})

// ✅ 條件性 computed（避免不必要的計算）
const expensiveAnalytics = computed(() => {
  // 只在有足夠資料時才進行複雜計算
  if (products.value.length < 100) return null
  
  console.log('執行昂貴的分析計算...')
  return performExpensiveAnalytics(products.value)
})
</script>
```

**Performance Monitoring:**

```vue
<script setup>
import { ref, computed, watchEffect } from 'vue'

const items = ref([])

// ✅ 使用 watchEffect 監控計算性能
const expensiveComputed = computed(() => {
  const start = performance.now()
  
  const result = items.value
    .filter(item => item.active)
    .map(item => ({ ...item, processed: true }))
    .sort((a, b) => b.priority - a.priority)
  
  const end = performance.now()
  console.log(`計算耗時: ${end - start}ms`)
  
  return result
})

// ✅ 監控 computed 的重新計算頻率
let computeCount = 0
watchEffect(() => {
  expensiveComputed.value // 觸發計算
  console.log(`Computed 已重新計算 ${++computeCount} 次`)
})
</script>
```

**Performance Benefits:**

1. **Automatic Caching**: Results cached until dependencies change
2. **Dependency Tracking**: Only recalculates when relevant data changes  
3. **Memory Efficiency**: Old cached values are garbage collected
4. **Performance Monitoring**: Easy to profile expensive calculations
5. **Composability**: Computed properties can depend on other computed properties

**Best Practices:**

```vue
<script setup>
// ✅ 保持 computed 純函數
const pureComputed = computed(() => {
  return items.value.map(item => item.name.toUpperCase())
})

// ❌ 避免副作用
const impureComputed = computed(() => {
  localStorage.setItem('lastComputed', Date.now()) // 不要這樣做
  return items.value.length
})

// ✅ 分解複雜計算為多個 computed
const step1 = computed(() => items.value.filter(item => item.active))
const step2 = computed(() => step1.value.map(item => transformItem(item)))
const finalResult = computed(() => step2.value.sort(compareItems))
</script>
```

**Note:** Computed properties should be pure functions without side effects for optimal caching behavior.