# Vue 3 Best Practices

## Component Design

### 1. 使用 `<script setup>` 語法
更簡潔、效能更好、更好的 TypeScript 支援。

```vue
<!-- ✅ 推薦 -->
<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<!-- ❌ 避免 (除非必要) -->
<script>
export default {
  setup() {
    const count = ref(0)
    return { count }
  }
}
</script>
```

### 2. Props 定義要明確且嚴格

```vue
<script setup>
// ✅ 推薦 - 明確型別和驗證
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived']
  }
})

// ❌ 避免 - 過於寬鬆
const props = defineProps(['title', 'likes', 'status'])
</script>
```

### 3. 使用 Composables 封裝可重用邏輯

```javascript
// ✅ 推薦 - 建立可重用的 composable
// composables/useFetch.js
import { ref } from 'vue'

export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)

  const fetchData = async () => {
    loading.value = true
    try {
      const response = await fetch(url)
      data.value = await response.json()
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, fetchData }
}

// 在元件中使用
<script setup>
import { useFetch } from '@/composables/useFetch'
const { data, error, loading, fetchData } = useFetch('/api/users')
</script>
```

### 4. 適當的元件拆分

```vue
<!-- ❌ 避免 - 單一元件過於龐大 -->
<template>
  <div>
    <!-- 100+ 行的複雜模板 -->
  </div>
</template>

<!-- ✅ 推薦 - 拆分成更小的元件 -->
<template>
  <div>
    <UserHeader :user="user" />
    <UserProfile :user="user" />
    <UserActions :user="user" @update="handleUpdate" />
  </div>
</template>
```

## Reactivity Best Practices

### 1. 選擇正確的響應式 API

```javascript
// ✅ 基本型別使用 ref
const count = ref(0)
const message = ref('Hello')
const isActive = ref(true)

// ✅ 複雜物件使用 reactive
const user = reactive({
  name: 'EVA',
  role: 'Frontend Engineer',
  settings: {
    theme: 'dark',
    notifications: true
  }
})

// ❌ 避免 - 基本型別使用 reactive
const state = reactive({
  count: 0  // 應該用 ref(0)
})

// ❌ 避免 - 需要重新賦值的物件使用 reactive
let state = reactive({ data: [] })
state = { data: newData }  // 失去響應性!

// ✅ 應該用 ref
const state = ref({ data: [] })
state.value = { data: newData }  // OK
```

### 2. 避免直接解構響應式物件

```javascript
const user = reactive({
  name: 'EVA',
  age: 25
})

// ❌ 避免 - 失去響應性
const { name, age } = user

// ✅ 使用 toRefs
import { toRefs } from 'vue'
const { name, age } = toRefs(user)

// ✅ 或使用 computed
import { computed } from 'vue'
const userName = computed(() => user.name)
```

### 3. 正確使用 watch

```javascript
import { ref, watch, watchEffect } from 'vue'

const count = ref(0)

// ✅ 需要舊值時使用 watch
watch(count, (newVal, oldVal) => {
  console.log(`Changed from ${oldVal} to ${newVal}`)
})

// ✅ 不需要舊值,自動追蹤依賴時使用 watchEffect
watchEffect(() => {
  console.log(`Count is ${count.value}`)
})

// ✅ 觀察物件的特定屬性
const user = reactive({ name: 'EVA', age: 25 })
watch(
  () => user.name,
  (newName) => {
    console.log(`Name changed to ${newName}`)
  }
)

// ❌ 避免 - 在 watch 中執行副作用但沒有清理
watch(source, () => {
  const timer = setInterval(() => {}, 1000)
  // 缺少清理邏輯!
})

// ✅ 正確清理副作用
watch(source, (newVal, oldVal, onCleanup) => {
  const timer = setInterval(() => {}, 1000)
  onCleanup(() => {
    clearInterval(timer)
  })
})
```

## Performance Optimization

### 1. 使用 computed 而非 method

```vue
<script setup>
import { ref, computed } from 'vue'

const items = ref([1, 2, 3, 4, 5])

// ✅ 推薦 - computed 會快取結果
const filteredItems = computed(() => {
  return items.value.filter(item => item > 2)
})

// ❌ 避免 - method 每次都會重新執行
const getFilteredItems = () => {
  return items.value.filter(item => item > 2)
}
</script>

<template>
  <!-- ✅ 使用 computed -->
  <div v-for="item in filteredItems" :key="item">{{ item }}</div>
  
  <!-- ❌ 每次渲染都會執行 -->
  <div v-for="item in getFilteredItems()" :key="item">{{ item }}</div>
</template>
```

### 2. 使用 v-show vs v-if

```vue
<template>
  <!-- ✅ 頻繁切換使用 v-show -->
  <div v-show="isVisible">Content</div>
  
  <!-- ✅ 初始渲染條件使用 v-if -->
  <div v-if="hasPermission">Admin Panel</div>
  
  <!-- ✅ 互斥條件使用 v-if/v-else-if/v-else -->
  <div v-if="type === 'A'">Type A</div>
  <div v-else-if="type === 'B'">Type B</div>
  <div v-else>Other</div>
</template>
```

### 3. 正確使用 key

```vue
<template>
  <!-- ✅ v-for 必須使用唯一的 key -->
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>
  
  <!-- ❌ 避免使用 index 作為 key (除非列表是靜態的) -->
  <div v-for="(item, index) in items" :key="index">
    {{ item.name }}
  </div>
  
  <!-- ✅ 強制重新渲染時使用 key -->
  <UserProfile :key="userId" :user-id="userId" />
</template>
```

### 4. 延遲載入大型元件

```javascript
// ✅ 使用 defineAsyncComponent
import { defineAsyncComponent } from 'vue'

const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)

// ✅ 帶載入和錯誤狀態
const HeavyComponent = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000
})
```

### 5. 使用 KeepAlive 快取元件

```vue
<template>
  <!-- ✅ 快取動態元件 -->
  <KeepAlive :max="10">
    <component :is="currentComponent" />
  </KeepAlive>
  
  <!-- ✅ 快取路由元件 -->
  <router-view v-slot="{ Component }">
    <KeepAlive>
      <component :is="Component" />
    </KeepAlive>
  </router-view>
  
  <!-- ✅ 條件快取 -->
  <KeepAlive :include="['ComponentA', 'ComponentB']">
    <component :is="currentComponent" />
  </KeepAlive>
</template>
```

### 6. 虛擬滾動處理大列表

```vue
<script setup>
// 使用 vue-virtual-scroller 或類似函式庫
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const items = ref([/* 10000+ items */])
</script>

<template>
  <RecycleScroller
    :items="items"
    :item-size="50"
    key-field="id"
  >
    <template #default="{ item }">
      <div>{{ item.name }}</div>
    </template>
  </RecycleScroller>
</template>
```

## Code Organization

### 1. 檔案結構

```
src/
├── assets/          # 靜態資源
├── components/      # 通用元件
│   ├── common/      # 基礎元件 (Button, Input)
│   ├── layout/      # 版面元件 (Header, Footer)
│   └── features/    # 功能元件
├── composables/     # 可重用邏輯
├── stores/          # Pinia stores
├── router/          # 路由設定
├── views/           # 頁面元件
├── utils/           # 工具函數
├── services/        # API 服務
├── types/           # TypeScript 型別定義
└── constants/       # 常數定義
```

### 2. 元件命名規範

```vue
<!-- ✅ 使用 PascalCase -->
<script setup>
import UserProfile from '@/components/UserProfile.vue'
import TheHeader from '@/components/layout/TheHeader.vue'
</script>

<template>
  <TheHeader />
  <UserProfile />
</template>

<!-- 檔案命名 -->
<!-- ✅ 推薦 -->
UserProfile.vue
TheHeader.vue
BaseButton.vue

<!-- ❌ 避免 -->
userprofile.vue
header.vue
button.vue
```

### 3. Composables 命名規範

```javascript
// ✅ 使用 use 前綴
export function useAuth() { }
export function useFetch() { }
export function useLocalStorage() { }

// ❌ 避免
export function auth() { }
export function fetch() { }
```

## Error Handling

### 1. 全域錯誤處理

```javascript
// main.js
const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.error('Component:', instance)
  console.error('Error info:', info)
  
  // 發送到錯誤追蹤服務
  // trackError(err, { component: instance, info })
}
```

### 2. 元件內錯誤處理

```vue
<script setup>
import { ref, onErrorCaptured } from 'vue'

const error = ref(null)

onErrorCaptured((err, instance, info) => {
  error.value = err.message
  console.error('Captured error:', err)
  
  // 返回 false 停止錯誤傳播
  return false
})
</script>

<template>
  <div v-if="error" class="error">
    {{ error }}
  </div>
  <slot v-else />
</template>
```

### 3. Async/Await 錯誤處理

```javascript
<script setup>
import { ref } from 'vue'

const data = ref(null)
const error = ref(null)
const loading = ref(false)

const fetchData = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('/api/data')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    data.value = await response.json()
  } catch (e) {
    error.value = e.message
    console.error('Fetch error:', e)
  } finally {
    loading.value = false
  }
}
</script>
```

## TypeScript Integration

### 1. 為 Props 定義型別

```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
  items: Array<{
    id: number
    name: string
  }>
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})
</script>
```

### 2. 為 Emits 定義型別

```vue
<script setup lang="ts">
interface Emits {
  (e: 'update', id: number, value: string): void
  (e: 'delete', id: number): void
}

const emit = defineEmits<Emits>()

emit('update', 1, 'new value')
</script>
```

### 3. 為 Composables 定義型別

```typescript
// composables/useFetch.ts
import { ref, Ref } from 'vue'

interface UseFetchReturn<T> {
  data: Ref<T | null>
  error: Ref<Error | null>
  loading: Ref<boolean>
  fetchData: () => Promise<void>
}

export function useFetch<T>(url: string): UseFetchReturn<T> {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(false)

  const fetchData = async () => {
    loading.value = true
    try {
      const response = await fetch(url)
      data.value = await response.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, fetchData }
}
```

## Testing Considerations

### 1. 可測試的元件設計

```vue
<script setup>
import { ref, computed } from 'vue'

// ✅ 推薦 - 邏輯抽離到 composable
import { useCounter } from '@/composables/useCounter'
const { count, increment } = useCounter()

// ✅ Props 和 emits 明確定義
const props = defineProps({
  initialValue: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['change'])
</script>

<!-- ✅ 簡單的模板邏輯 -->
<template>
  <div>
    <span>{{ count }}</span>
    <button @click="increment">+</button>
  </div>
</template>
```

### 2. 使用依賴注入方便測試

```javascript
// ✅ 使用 provide/inject
// app.js
app.provide('api', apiService)

// component.vue
const api = inject('api')

// 測試時可以輕鬆 mock
```