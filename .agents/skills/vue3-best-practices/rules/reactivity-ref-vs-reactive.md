---
title: Ref vs Reactive Selection
impact: CRITICAL
impactDescription: affects reactivity performance and memory usage
tags: reactivity, ref, reactive, composition-api, performance
---

## Ref vs Reactive Selection

Use `ref()` for primitives and `reactive()` for objects to optimize reactivity performance and avoid unnecessary overhead.

**Incorrect (reactive for primitives, ref for objects):**

```vue
<script setup>
import { reactive, ref } from 'vue'

// 不佳：對基本型別使用 reactive
const count = reactive({ value: 0 })
const message = reactive({ text: 'hello' })

// 不佳：對複雜物件使用 ref
const user = ref({
  id: 1,
  name: 'John',
  preferences: {
    theme: 'dark',
    language: 'en'
  }
})

function updateUser() {
  // 需要 .value 且不直觀
  user.value.name = 'Jane'
}
</script>
```

**Correct (ref for primitives, reactive for objects):**

```vue
<script setup>
import { reactive, ref } from 'vue'

// ✅ 對基本型別使用 ref
const count = ref(0)
const message = ref('hello')

// ✅ 對複雜物件使用 reactive
const user = reactive({
  id: 1,
  name: 'John',
  preferences: {
    theme: 'dark',
    language: 'en'
  }
})

function updateUser() {
  // 直接訪問，更直觀
  user.name = 'Jane'
}

function increment() {
  // 對基本型別使用 .value
  count.value++
}
</script>
```

**Performance Benefits:**

1. **Memory Efficiency**: `ref` has less overhead for primitives
2. **Reactivity Tracking**: More efficient proxy creation
3. **Developer Experience**: More intuitive API usage
4. **TypeScript Support**: Better type inference

**Additional Guidelines:**

```vue
<script setup>
// ✅ 混合使用 - 根據資料類型選擇
const loading = ref(false)           // 基本型別用 ref
const error = ref(null)              // 可能是 null 的值用 ref
const items = reactive([])           // 陣列用 reactive
const form = reactive({              // 物件用 reactive
  email: '',
  password: ''
})

// ✅ 解構 reactive 時使用 toRefs
const { email, password } = toRefs(form)
</script>
```

**Note:** When destructuring reactive objects, always use `toRefs()` to maintain reactivity.