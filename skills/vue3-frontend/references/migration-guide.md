# Vue 2 to Vue 3 Migration Guide

## Critical Breaking Changes

### 1. Global API Changes

**Vue 2:**
```javascript
import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false
Vue.use(VueRouter)
Vue.component('MyComponent', MyComponent)

new Vue({
  render: h => h(App)
}).$mount('#app')
```

**Vue 3:**
```javascript
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.use(router)
app.component('MyComponent', MyComponent)
app.mount('#app')
```

### 2. Reactivity System

**Vue 2:**
```javascript
export default {
  data() {
    return {
      count: 0,
      user: { name: 'EVA' }
    }
  },
  methods: {
    addProperty() {
      // ❌ 需要 Vue.set
      this.$set(this.user, 'age', 25)
    }
  }
}
```

**Vue 3:**
```javascript
import { reactive, ref } from 'vue'

export default {
  setup() {
    const count = ref(0)
    const user = reactive({ name: 'EVA' })
    
    const addProperty = () => {
      // ✅ 直接新增屬性
      user.age = 25
    }
    
    return { count, user, addProperty }
  }
}
```

### 3. v-model Changes

**Vue 2:**
```vue
<!-- 父元件 -->
<MyInput v-model="text" />

<!-- 子元件 -->
<template>
  <input :value="value" @input="$emit('input', $event.target.value)" />
</template>

<script>
export default {
  props: ['value']
}
</script>
```

**Vue 3:**
```vue
<!-- 父元件 -->
<MyInput v-model="text" />

<!-- 子元件 -->
<template>
  <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />
</template>

<script>
export default {
  props: ['modelValue'],
  emits: ['update:modelValue']
}
</script>
```

### 4. Multiple v-model Support

**Vue 3 新功能:**
```vue
<!-- 父元件 -->
<UserForm v-model:name="userName" v-model:email="userEmail" />

<!-- 子元件 -->
<script setup>
defineProps(['name', 'email'])
const emit = defineEmits(['update:name', 'update:email'])
</script>

<template>
  <input :value="name" @input="emit('update:name', $event.target.value)" />
  <input :value="email" @input="emit('update:email', $event.target.value)" />
</template>
```

### 5. Filters Removed

**Vue 2:**
```vue
<template>
  <div>{{ price | currency }}</div>
</template>

<script>
export default {
  filters: {
    currency(value) {
      return '$' + value.toFixed(2)
    }
  }
}
</script>
```

**Vue 3 (使用 computed 或 methods):**
```vue
<template>
  <div>{{ formatCurrency(price) }}</div>
</template>

<script setup>
const formatCurrency = (value) => {
  return '$' + value.toFixed(2)
}
</script>
```

### 6. Event Bus Removed

**Vue 2:**
```javascript
// event-bus.js
export const EventBus = new Vue()

// ComponentA.vue
EventBus.$emit('event-name', data)

// ComponentB.vue
EventBus.$on('event-name', (data) => {})
```

**Vue 3 (使用 mitt 或 Pinia):**
```javascript
// Using mitt
import mitt from 'mitt'
export const emitter = mitt()

// ComponentA.vue
emitter.emit('event-name', data)

// ComponentB.vue
emitter.on('event-name', (data) => {})

// Or use Pinia for state management
```

### 7. Async Component Syntax

**Vue 2:**
```javascript
const AsyncComponent = () => import('./AsyncComponent.vue')
```

**Vue 3:**
```javascript
import { defineAsyncComponent } from 'vue'

const AsyncComponent = defineAsyncComponent(() =>
  import('./AsyncComponent.vue')
)
```

### 8. Functional Components

**Vue 2:**
```vue
<template functional>
  <div>{{ props.msg }}</div>
</template>

<script>
export default {
  functional: true,
  props: ['msg']
}
</script>
```

**Vue 3:**
```vue
<script setup>
defineProps(['msg'])
</script>

<template>
  <div>{{ msg }}</div>
</template>
```

### 9. Lifecycle Hooks in Composition API

**Vue 2 Options API → Vue 3 Composition API:**
```javascript
// Vue 2
export default {
  beforeCreate() {},
  created() {},
  beforeMount() {},
  mounted() {},
  beforeUpdate() {},
  updated() {},
  beforeDestroy() {},
  destroyed() {}
}

// Vue 3 Composition API
import { onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted } from 'vue'

setup() {
  // beforeCreate & created 的邏輯直接放在 setup() 中
  
  onBeforeMount(() => {})
  onMounted(() => {})
  onBeforeUpdate(() => {})
  onUpdated(() => {})
  onBeforeUnmount(() => {})
  onUnmounted(() => {})
}
```

### 10. $attrs Behavior Change

**Vue 2:**
```javascript
// class 和 style 不包含在 $attrs 中
this.$attrs // { id: 'foo' }
```

**Vue 3:**
```javascript
// class 和 style 也包含在 $attrs 中
this.$attrs // { class: 'bar', style: {...}, id: 'foo' }
```

### 11. Key Usage Change

**Vue 2:**
```vue
<template v-for="item in items">
  <div :key="item.id">{{ item.name }}</div>
  <span :key="item.id">{{ item.desc }}</span>
</template>
```

**Vue 3:**
```vue
<!-- key 應該放在 template 上 -->
<template v-for="item in items" :key="item.id">
  <div>{{ item.name }}</div>
  <span>{{ item.desc }}</span>
</template>
```

## Migration Checklist

- [ ] 更新 Vue 版本到 3.x
- [ ] 將 `new Vue()` 改為 `createApp()`
- [ ] 更新全域 API 呼叫 (Vue.use → app.use)
- [ ] 移除 filters,改用 computed 或 methods
- [ ] 移除 Event Bus,改用 mitt 或 Pinia
- [ ] 更新 v-model 用法 (value → modelValue, input → update:modelValue)
- [ ] 檢查並更新生命週期 hook 名稱
- [ ] 更新 functional components
- [ ] 檢查 $attrs 的使用
- [ ] 檢查 template 上的 key 使用
- [ ] 更新 async components
- [ ] 測試響應式系統的行為變化

## Common Migration Patterns

### Pattern 1: Options API to Composition API

**Before:**
```vue
<script>
export default {
  data() {
    return {
      count: 0,
      loading: false
    }
  },
  computed: {
    doubleCount() {
      return this.count * 2
    }
  },
  methods: {
    increment() {
      this.count++
    }
  },
  mounted() {
    this.fetchData()
  }
}
</script>
```

**After:**
```vue
<script setup>
import { ref, computed, onMounted } from 'vue'

const count = ref(0)
const loading = ref(false)

const doubleCount = computed(() => count.value * 2)

const increment = () => {
  count.value++
}

onMounted(() => {
  fetchData()
})
</script>
```

### Pattern 2: Vuex to Pinia

**Vuex (Vue 2):**
```javascript
// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: null
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user
    }
  },
  actions: {
    async login({ commit }, credentials) {
      const user = await api.login(credentials)
      commit('SET_USER', user)
    }
  },
  getters: {
    isLoggedIn: state => !!state.user
  }
})
```

**Pinia (Vue 3):**
```javascript
// stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null
  }),
  getters: {
    isLoggedIn: (state) => !!state.user
  },
  actions: {
    async login(credentials) {
      this.user = await api.login(credentials)
    }
  }
})
```