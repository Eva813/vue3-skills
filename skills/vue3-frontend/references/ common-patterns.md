# Vue 3 Common Patterns

## Form Handling Patterns

### 1. 基本表單處理

```vue
<script setup>
import { reactive, ref } from 'vue'

// 使用 reactive 處理表單資料
const formData = reactive({
  username: '',
  email: '',
  password: '',
  agreeToTerms: false
})

// 或使用多個 ref
const username = ref('')
const email = ref('')
const password = ref('')

const errors = ref({})
const loading = ref(false)

const validateForm = () => {
  errors.value = {}
  
  if (!formData.username) {
    errors.value.username = '請輸入使用者名稱'
  }
  
  if (!formData.email.includes('@')) {
    errors.value.email = '請輸入有效的 Email'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  try {
    await submitForm(formData)
    // 成功處理
  } catch (error) {
    // 錯誤處理
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <input v-model="formData.username" type="text" />
      <span v-if="errors.username" class="error">{{ errors.username }}</span>
    </div>
    
    <div>
      <input v-model="formData.email" type="email" />
      <span v-if="errors.email" class="error">{{ errors.email }}</span>
    </div>
    
    <button type="submit" :disabled="loading">
      {{ loading ? '送出中...' : '送出' }}
    </button>
  </form>
</template>
```

### 2. 使用 VeeValidate (推薦)

```vue
<script setup>
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'

const schema = yup.object({
  username: yup.string().required('請輸入使用者名稱'),
  email: yup.string().email('請輸入有效的 Email').required('請輸入 Email'),
  password: yup.string().min(8, '密碼至少 8 個字元').required('請輸入密碼')
})

const { handleSubmit, errors } = useForm({
  validationSchema: schema
})

const { value: username } = useField('username')
const { value: email } = useField('email')
const { value: password } = useField('password')

const onSubmit = handleSubmit(async (values) => {
  console.log('Form values:', values)
  await submitForm(values)
})
</script>

<template>
  <form @submit="onSubmit">
    <div>
      <input v-model="username" type="text" />
      <span class="error">{{ errors.username }}</span>
    </div>
    
    <div>
      <input v-model="email" type="email" />
      <span class="error">{{ errors.email }}</span>
    </div>
    
    <button type="submit">送出</button>
  </form>
</template>
```

## Data Fetching Patterns

### 1. 使用 Composable 封裝

```javascript
// composables/useApi.js
import { ref } from 'vue'

export function useApi() {
  const loading = ref(false)
  const error = ref(null)

  const execute = async (apiCall) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await apiCall()
      return result
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    execute
  }
}

// 在元件中使用
<script setup>
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

const { loading, error, execute } = useApi()
const users = ref([])

const fetchUsers = async () => {
  users.value = await execute(() => fetch('/api/users').then(r => r.json()))
}

onMounted(fetchUsers)
</script>
```

### 2. VueUse useFetch (推薦)

```vue
<script setup>
import { useFetch } from '@vueuse/core'

const { data, error, isFetching } = useFetch('/api/users').json()

// 延遲執行
const { data, execute } = useFetch('/api/users', { immediate: false }).json()

// 帶 refetch
const { data, refetch } = useFetch('/api/users').json()
</script>

<template>
  <div v-if="isFetching">載入中...</div>
  <div v-else-if="error">錯誤: {{ error }}</div>
  <div v-else>
    <div v-for="user in data" :key="user.id">
      {{ user.name }}
    </div>
  </div>
</template>
```

### 3. TanStack Query (Vue Query)

```vue
<script setup>
import { useQuery, useMutation } from '@tanstack/vue-query'

// 查詢
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/users').then(r => r.json())
})

// 變更
const mutation = useMutation({
  mutationFn: (newUser) => fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(newUser)
  }),
  onSuccess: () => {
    refetch()
  }
})

const addUser = () => {
  mutation.mutate({ name: 'New User' })
}
</script>
```

## List Rendering Patterns

### 1. 帶分頁的列表

```vue
<script setup>
import { ref, computed } from 'vue'

const items = ref([/* 大量資料 */])
const currentPage = ref(1)
const pageSize = ref(10)

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return items.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(items.value.length / pageSize.value)
})

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}
</script>

<template>
  <div>
    <div v-for="item in paginatedItems" :key="item.id">
      {{ item.name }}
    </div>
    
    <div class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1">上一頁</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">下一頁</button>
    </div>
  </div>
</template>
```

### 2. 無限滾動

```vue
<script setup>
import { ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

const items = ref([])
const page = ref(1)
const loading = ref(false)
const hasMore = ref(true)

const loadMore = async () => {
  if (loading.value || !hasMore.value) return
  
  loading.value = true
  const newItems = await fetchItems(page.value)
  
  if (newItems.length === 0) {
    hasMore.value = false
  } else {
    items.value.push(...newItems)
    page.value++
  }
  
  loading.value = false
}

const target = ref(null)
useIntersectionObserver(
  target,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      loadMore()
    }
  }
)
</script>

<template>
  <div>
    <div v-for="item in items" :key="item.id">
      {{ item.name }}
    </div>
    
    <div ref="target" v-if="hasMore">
      載入更多...
    </div>
  </div>
</template>
```

### 3. 搜尋和過濾

```vue
<script setup>
import { ref, computed } from 'vue'

const items = ref([
  { id: 1, name: 'Apple', category: 'fruit' },
  { id: 2, name: 'Banana', category: 'fruit' },
  { id: 3, name: 'Carrot', category: 'vegetable' }
])

const searchQuery = ref('')
const selectedCategory = ref(null)

const filteredItems = computed(() => {
  return items.value.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = !selectedCategory.value || item.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})
</script>

<template>
  <div>
    <input v-model="searchQuery" placeholder="搜尋..." />
    
    <select v-model="selectedCategory">
      <option :value="null">全部分類</option>
      <option value="fruit">水果</option>
      <option value="vegetable">蔬菜</option>
    </select>
    
    <div v-for="item in filteredItems" :key="item.id">
      {{ item.name }}
    </div>
  </div>
</template>
```

## Modal/Dialog Patterns

### 1. 基本 Modal

```vue
<!-- Modal.vue -->
<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  title: String
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const close = () => {
  emit('update:modelValue', false)
}

const confirm = () => {
  emit('confirm')
  close()
}

// 按 Esc 關閉
const handleKeydown = (e) => {
  if (e.key === 'Escape') close()
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ title }}</h3>
            <button @click="close">×</button>
          </div>
          
          <div class="modal-body">
            <slot />
          </div>
          
          <div class="modal-footer">
            <button @click="close">取消</button>
            <button @click="confirm">確認</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

<!-- 使用 -->
<script setup>
import { ref } from 'vue'
import Modal from './Modal.vue'

const showModal = ref(false)

const handleConfirm = () => {
  console.log('Confirmed!')
}
</script>

<template>
  <button @click="showModal = true">開啟 Modal</button>
  
  <Modal v-model="showModal" title="確認操作" @confirm="handleConfirm">
    <p>你確定要執行此操作嗎?</p>
  </Modal>
</template>
```

### 2. 程式化 Modal (useModal)

```javascript
// composables/useModal.js
import { ref, h, render } from 'vue'
import Modal from '@/components/Modal.vue'

export function useModal() {
  const open = (options) => {
    return new Promise((resolve) => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      const close = (result) => {
        render(null, container)
        document.body.removeChild(container)
        resolve(result)
      }

      const vnode = h(Modal, {
        ...options,
        modelValue: true,
        onConfirm: () => close(true),
        onCancel: () => close(false),
        'onUpdate:modelValue': (val) => {
          if (!val) close(false)
        }
      })

      render(vnode, container)
    })
  }

  return { open }
}

// 使用
<script setup>
import { useModal } from '@/composables/useModal'

const modal = useModal()

const handleDelete = async () => {
  const confirmed = await modal.open({
    title: '確認刪除',
    content: '確定要刪除此項目嗎?'
  })
  
  if (confirmed) {
    // 執行刪除
  }
}
</script>
```

## State Management Patterns (Pinia)

### 1. 基本 Store

```javascript
// stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))

  // Getters
  const isLoggedIn = computed(() => !!user.value)
  const userName = computed(() => user.value?.name || 'Guest')

  // Actions
  const login = async (credentials) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })
    
    const data = await response.json()
    user.value = data.user
    token.value = data.token
    localStorage.setItem('token', data.token)
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  return {
    user,
    token,
    isLoggedIn,
    userName,
    login,
    logout
  }
})

// 在元件中使用
<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const handleLogin = async () => {
  await userStore.login({ email, password })
}
</script>
```

### 2. Store 組合

```javascript
// stores/cart.js
import { defineStore } from 'pinia'
import { useUserStore } from './user'

export const useCartStore = defineStore('cart', () => {
  const userStore = useUserStore()
  
  const items = ref([])
  
  const addItem = (item) => {
    if (!userStore.isLoggedIn) {
      alert('請先登入')
      return
    }
    
    items.value.push(item)
  }
  
  return { items, addItem }
})
```

## Routing Patterns

### 1. 路由守衛

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.meta.requiresGuest && userStore.isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
```

### 2. 巢狀路由和版面配置

```javascript
// router/index.js
const routes = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue')
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/About.vue')
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'users',
        component: () => import('@/views/admin/Users.vue')
      }
    ]
  }
]

// layouts/DefaultLayout.vue
<template>
  <div>
    <Header />
    <router-view />
    <Footer />
  </div>
</template>
```

## i18n Patterns

### 1. Vue I18n 設定

```javascript
// i18n/index.js
import { createI18n } from 'vue-i18n'
import zh from './locales/zh-TW.json'
import en from './locales/en.json'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'zh-TW',
  fallbackLocale: 'en',
  messages: {
    'zh-TW': zh,
    'en': en
  }
})

export default i18n

// locales/zh-TW.json
{
  "welcome": "歡迎",
  "greeting": "你好, {name}",
  "items": "沒有項目 | 1 個項目 | {count} 個項目"
}

// 在元件中使用
<script setup>
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const changeLanguage = (lang) => {
  locale.value = lang
  localStorage.setItem('locale', lang)
}
</script>

<template>
  <div>
    <h1>{{ t('welcome') }}</h1>
    <p>{{ t('greeting', { name: 'EVA' }) }}</p>
    <p>{{ t('items', 5) }}</p>
    
    <button @click="changeLanguage('zh-TW')">中文</button>
    <button @click="changeLanguage('en')">English</button>
  </div>
</template>
```

## Debounce/Throttle Patterns

```vue
<script setup>
import { ref } from 'vue'
import { useDebounceFn, useThrottleFn } from '@vueuse/core'

const searchQuery = ref('')
const results = ref([])

// Debounce - 延遲執行,適合搜尋輸入
const debouncedSearch = useDebounceFn(async (query) => {
  results.value = await searchApi(query)
}, 500)

// Throttle - 限制執行頻率,適合滾動事件
const throttledScroll = useThrottleFn(() => {
  console.log('Scrolling...')
}, 200)
</script>

<template>
  <input 
    v-model="searchQuery" 
    @input="debouncedSearch(searchQuery)"
    placeholder="搜尋..."
  />
  
  <div @scroll="throttledScroll">
    <!-- 滾動內容 -->
  </div>
</template>
```