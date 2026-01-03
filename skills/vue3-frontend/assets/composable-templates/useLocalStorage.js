import { ref, watch } from 'vue'

/**
 * 與 localStorage 同步的響應式狀態
 * @param {string} key - localStorage key
 * @param {any} defaultValue - 預設值
 * @returns {Ref} - 響應式引用
 */
export function useLocalStorage(key, defaultValue = null) {
  // 讀取初始值
  const readValue = () => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return defaultValue
    }
  }

  const storedValue = ref(readValue())

  // 寫入 localStorage
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue.value) : value
      storedValue.value = valueToStore

      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  // 移除項目
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key)
      storedValue.value = defaultValue
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }

  // 監聽其他頁籤的變化
  const handleStorageChange = (e) => {
    if (e.key === key && e.newValue !== null) {
      storedValue.value = JSON.parse(e.newValue)
    }
  }

  window.addEventListener('storage', handleStorageChange)

  // 清理
  const stop = () => {
    window.removeEventListener('storage', handleStorageChange)
  }

  return {
    value: storedValue,
    setValue,
    removeValue,
    stop
  }
}

/**
 * 簡化版本 - 直接返回 ref
 */
export function useStorage(key, defaultValue = null) {
  const { value, setValue } = useLocalStorage(key, defaultValue)

  // 監聽 ref 變化並自動儲存
  watch(value, (newValue) => {
    setValue(newValue)
  }, { deep: true })

  return value
}