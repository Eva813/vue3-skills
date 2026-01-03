# Vue 3 Composition API Reference

## Reactivity APIs

### ref()
為基本型別建立響應式引用。

```javascript
import { ref } from 'vue'

const count = ref(0)
const message = ref('Hello')

// 讀取值
console.log(count.value) // 0

// 更新值
count.value++

// 在 template 中會自動解包,不需要 .value
```

**使用時機:** 基本型別 (string, number, boolean) 或需要重新賦值的物件。

### reactive()
為物件建立深層響應式代理。

```javascript
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  user: {
    name: 'EVA',
    role: 'Frontend Engineer'
  }
})

// 直接存取和修改
state.count++
state.user.name = 'Eva Chen'

// ❌ 不能重新賦值,會失去響應性
state = { count: 1 } // 錯誤!

// ✅ 應該修改屬性
Object.assign(state, { count: 1 })
```

**使用時機:** 複雜物件結構,不需要重新賦值的情況。

### computed()
建立計算屬性。

```javascript
import { ref, computed } from 'vue'

const count = ref(0)

// 唯讀 computed
const doubleCount = computed(() => count.value * 2)

// 可寫 computed
const fullName = computed({
  get() {
    return `${firstName.value} ${lastName.value}`
  },
  set(newValue) {
    [firstName.value, lastName.value] = newValue.split(' ')
  }
})
```

### watch()
觀察響應式資料變化。

```javascript
import { ref, watch } from 'vue'

const count = ref(0)

// 觀察單一源
watch(count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`)
})

// 觀察多個源
watch([count, message], ([newCount, newMsg], [oldCount, oldMsg]) => {
  console.log('Multiple sources changed')
})

// 深度觀察
const state = reactive({ nested: { count: 0 } })
watch(
  () => state.nested,
  (newValue) => {
    console.log('Nested changed')
  },
  { deep: true }
)

// 立即執行
watch(
  source,
  callback,
  { immediate: true }
)
```

### watchEffect()
自動追蹤依賴並執行副作用。

```javascript
import { ref, watchEffect } from 'vue'

const count = ref(0)
const message = ref('Hello')

watchEffect(() => {
  // 自動追蹤 count 和 message
  console.log(`Count: ${count.value}, Message: ${message.value}`)
})

// 清理副作用
watchEffect((onCleanup) => {
  const timer = setTimeout(() => {}, 1000)
  
  onCleanup(() => {
    clearTimeout(timer)
  })
})
```

**watch vs watchEffect:**
- `watch`: 需明確指定要觀察的資料,可訪問舊值
- `watchEffect`: 自動追蹤依賴,立即執行,無法訪問舊值

## Lifecycle Hooks

```javascript
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onActivated,
  onDeactivated,
  onErrorCaptured
} from 'vue'

export default {
  setup() {
    // setup() 本身就相當於 beforeCreate 和 created
    
    onBeforeMount(() => {
      console.log('Component is about to mount')
    })
    
    onMounted(() => {
      console.log('Component mounted')
      // DOM 已經可用
    })
    
    onBeforeUpdate(() => {
      console.log('Component is about to update')
    })
    
    onUpdated(() => {
      console.log('Component updated')
    })
    
    onBeforeUnmount(() => {
      console.log('Component is about to unmount')
      // 清理工作
    })
    
    onUnmounted(() => {
      console.log('Component unmounted')
    })
    
    // Keep-alive 元件專用
    onActivated(() => {
      console.log('Component activated')
    })
    
    onDeactivated(() => {
      console.log('Component deactivated')
    })
    
    // 錯誤捕獲
    onErrorCaptured((err, instance, info) => {
      console.error('Error captured:', err)
      return false // 停止錯誤傳播
    })
  }
}
```

## Component APIs

### defineProps()
定義元件 props (僅在 `<script setup>` 中可用)。

```javascript
<script setup>
// 基本用法
const props = defineProps(['title', 'likes'])

// 型別定義 (TypeScript)
const props = defineProps<{
  title: string
  likes: number
}>()

// 帶預設值 (TypeScript)
interface Props {
  title?: string
  likes?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Default Title',
  likes: 0
})

// 執行時驗證
const props = defineProps({
  title: String,
  likes: {
    type: Number,
    required: true,
    default: 0,
    validator: (value) => value >= 0
  },
  status: {
    type: String,
    enum: ['draft', 'published']
  }
})
</script>
```

### defineEmits()
定義元件事件 (僅在 `<script setup>` 中可用)。

```javascript
<script setup>
// 基本用法
const emit = defineEmits(['update', 'delete'])

// 型別定義 (TypeScript)
const emit = defineEmits<{
  update: [id: number, value: string]
  delete: [id: number]
}>()

// 執行時驗證
const emit = defineEmits({
  update: (id, value) => {
    if (typeof id !== 'number') {
      console.warn('Invalid id type')
      return false
    }
    return true
  }
})

// 使用
emit('update', 1, 'new value')
</script>
```

### defineExpose()
暴露元件內部方法給父元件 (僅在 `<script setup>` 中可用)。

```javascript
<script setup>
import { ref } from 'vue'

const count = ref(0)
const increment = () => count.value++

// 只暴露這些給父元件
defineExpose({
  count,
  increment
})
</script>
```

### useSlots() & useAttrs()
訪問 slots 和 attrs。

```javascript
<script setup>
import { useSlots, useAttrs } from 'vue'

const slots = useSlots()
const attrs = useAttrs()

// 檢查 slot 是否存在
const hasDefaultSlot = !!slots.default
const hasHeaderSlot = !!slots.header

// 訪問屬性
console.log(attrs.class)
console.log(attrs.style)
</script>
```

## Dependency Injection

### provide() / inject()
跨層級元件通訊。

```javascript
// 祖先元件
<script setup>
import { provide, ref } from 'vue'

const theme = ref('light')
const updateTheme = (newTheme) => {
  theme.value = newTheme
}

// 提供響應式資料
provide('theme', theme)
provide('updateTheme', updateTheme)

// 使用 Symbol 避免衝突
export const ThemeSymbol = Symbol()
provide(ThemeSymbol, theme)
</script>

// 後代元件
<script setup>
import { inject } from 'vue'

const theme = inject('theme')
const updateTheme = inject('updateTheme')

// 提供預設值
const theme = inject('theme', 'light')

// 使用 Symbol
import { ThemeSymbol } from './parent'
const theme = inject(ThemeSymbol)
</script>
```

## Template Refs

```javascript
<script setup>
import { ref, onMounted } from 'vue'

// 單一元素 ref
const inputRef = ref(null)

onMounted(() => {
  inputRef.value.focus()
})

// 元件 ref (需要 defineExpose)
const childRef = ref(null)

onMounted(() => {
  childRef.value.someMethod()
})

// v-for 中的 ref
const itemRefs = ref([])

onMounted(() => {
  itemRefs.value.forEach(el => {
    console.log(el)
  })
})
</script>

<template>
  <input ref="inputRef" />
  <ChildComponent ref="childRef" />
  
  <div v-for="item in items" :ref="el => itemRefs.push(el)">
    {{ item }}
  </div>
</template>
```

## Composables (可重用邏輯)

```javascript
// composables/useCounter.js
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  
  const doubleCount = computed(() => count.value * 2)
  
  const increment = () => {
    count.value++
  }
  
  const decrement = () => {
    count.value--
  }
  
  return {
    count,
    doubleCount,
    increment,
    decrement
  }
}

// 在元件中使用
<script setup>
import { useCounter } from '@/composables/useCounter'

const { count, doubleCount, increment, decrement } = useCounter(10)
</script>
```

## Advanced Reactivity APIs

### toRef() / toRefs()
```javascript
import { reactive, toRef, toRefs } from 'vue'

const state = reactive({
  name: 'EVA',
  age: 25
})

// 為單一屬性建立 ref
const nameRef = toRef(state, 'name')
nameRef.value = 'Eva Chen' // state.name 也會更新

// 為所有屬性建立 ref
const { name, age } = toRefs(state)
name.value = 'Eva Chen' // state.name 也會更新
```

### unref()
```javascript
import { ref, unref } from 'vue'

const count = ref(10)

unref(count) // 10
unref(5) // 5 (如果不是 ref,返回原值)
```

### isRef() / isReactive() / isReadonly()
```javascript
import { ref, reactive, readonly, isRef, isReactive, isReadonly } from 'vue'

const count = ref(0)
const state = reactive({})
const readonlyState = readonly(state)

isRef(count) // true
isReactive(state) // true
isReadonly(readonlyState) // true
```

### shallowRef() / shallowReactive()
淺層響應式,只有根層級是響應式的。

```javascript
import { shallowRef, shallowReactive } from 'vue'

// 淺層 ref - 只有 .value 的變化會觸發更新
const state = shallowRef({ count: 0 })
state.value.count++ // 不會觸發更新
state.value = { count: 1 } // 會觸發更新

// 淺層 reactive - 只有根層級屬性的變化會觸發更新
const state = shallowReactive({
  nested: { count: 0 }
})
state.nested.count++ // 不會觸發更新
state.nested = { count: 1 } // 會觸發更新
```

**使用時機:** 效能最佳化,大型不可變資料結構。