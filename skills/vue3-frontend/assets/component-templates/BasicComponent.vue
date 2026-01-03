<script setup>
import { ref, computed, onMounted } from 'vue'

// Props
const props = defineProps({
  // 定義你的 props
  title: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['update', 'change'])

// State
const isActive = ref(false)

// Computed
const displayText = computed(() => {
  return props.title.toUpperCase()
})

// Methods
const handleClick = () => {
  isActive.value = !isActive.value
  emit('change', isActive.value)
}

// Lifecycle
onMounted(() => {
  console.log('Component mounted')
})
</script>

<template>
  <div class="component">
    <h2>{{ displayText }}</h2>
    <button @click="handleClick">
      {{ isActive ? '啟用' : '停用' }}
    </button>
  </div>
</template>

<style scoped>
.component {
  /* 你的樣式 */
}
</style>