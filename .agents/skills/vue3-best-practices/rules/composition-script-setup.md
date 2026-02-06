---
title: Script Setup Performance
impact: CRITICAL
impactDescription: reduces bundle size and improves compilation performance
tags: composition-api, script-setup, performance, compilation
---

## Script Setup Performance

Prefer `<script setup>` over regular `<script>` for better performance, smaller bundle size, and improved developer experience.

**Incorrect (regular script with setup function):**

```vue
<template>
  <div>
    <h1>{{ title }}</h1>
    <p>Count: {{ count }}</p>
    <button @click="increment">+</button>
    <child-component :data="computedData" @update="handleUpdate" />
  </div>
</template>

<script>
import { ref, computed, defineComponent } from 'vue'
import ChildComponent from './ChildComponent.vue'

export default defineComponent({
  components: {
    ChildComponent
  },
  setup() {
    const title = ref('My App')
    const count = ref(0)
    
    const computedData = computed(() => {
      return { count: count.value * 2 }
    })
    
    const increment = () => {
      count.value++
    }
    
    const handleUpdate = (newValue) => {
      count.value = newValue
    }
    
    return {
      title,
      count,
      computedData,
      increment,
      handleUpdate
    }
  }
})
</script>
```

**Correct (script setup):**

```vue
<template>
  <div>
    <h1>{{ title }}</h1>
    <p>Count: {{ count }}</p>
    <button @click="increment">+</button>
    <ChildComponent :data="computedData" @update="handleUpdate" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ChildComponent from './ChildComponent.vue'

// ✅ 直接定義，無需 return
const title = ref('My App')
const count = ref(0)

// ✅ 自動推斷類型
const computedData = computed(() => ({ count: count.value * 2 }))

// ✅ 函數自動暴露
const increment = () => {
  count.value++
}

const handleUpdate = (newValue) => {
  count.value = newValue
}
</script>
```

**Advanced Script Setup with TypeScript:**

```vue
<template>
  <div>
    <user-card :user="user" @edit="editUser" />
    <form @submit.prevent="saveUser">
      <input v-model="form.name" placeholder="Name" />
      <input v-model="form.email" type="email" placeholder="Email" />
      <button type="submit" :disabled="!isFormValid">Save</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import type { User } from '@/types'
import UserCard from '@/components/UserCard.vue'

// ✅ Interface 定義
interface UserForm {
  name: string
  email: string
}

// ✅ Props 定義（自動推斷類型）
const props = defineProps<{
  userId: number
  initialData?: User
}>()

// ✅ Emits 定義
const emit = defineEmits<{
  save: [user: User]
  cancel: []
}>()

// ✅ 響應式資料
const user = ref<User | null>(null)
const form = reactive<UserForm>({
  name: '',
  email: ''
})

// ✅ Computed 屬性
const isFormValid = computed(() => 
  form.name.length > 0 && /\S+@\S+\.\S+/.test(form.email)
)

// ✅ 方法定義
const editUser = (userData: User) => {
  user.value = userData
  Object.assign(form, {
    name: userData.name,
    email: userData.email
  })
}

const saveUser = () => {
  if (!isFormValid.value) return
  
  const updatedUser: User = {
    ...user.value!,
    name: form.name,
    email: form.email
  }
  
  emit('save', updatedUser)
}

// ✅ 生命周期 hooks
import { onMounted } from 'vue'
onMounted(async () => {
  if (props.initialData) {
    editUser(props.initialData)
  }
})
</script>
```

**Performance Benefits:**

1. **Smaller Bundle**: Less boilerplate code
2. **Faster Compilation**: Compile-time optimizations
3. **Better Tree Shaking**: Unused imports are removed
4. **Improved DX**: Auto-imports and better IDE support
5. **Type Safety**: Better TypeScript integration

**Migration Tips:**

```vue
<!-- Before (Options API) -->
<script>
export default {
  data() {
    return { count: 0 }
  },
  computed: {
    doubled() { return this.count * 2 }
  },
  methods: {
    increment() { this.count++ }
  }
}
</script>

<!-- After (Script Setup) -->
<script setup>
const count = ref(0)
const doubled = computed(() => count.value * 2)
const increment = () => count.value++
</script>
```

**Note:** `<script setup>` provides compile-time optimizations and should be the default choice for new Vue 3 projects.