import { ref, unref } from 'vue'

/**
 * 通用的資料獲取 composable
 * @param {string | Ref<string>} url - API URL
 * @param {object} options - Fetch 選項
 * @returns {object} - { data, error, loading, execute, refetch }
 */
export function useFetch(url, options = {}) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)

  const execute = async (customUrl = null) => {
    loading.value = true
    error.value = null

    try {
      const targetUrl = customUrl || unref(url)
      const response = await fetch(targetUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      data.value = result

      if (options.onSuccess) {
        options.onSuccess(result)
      }

      return result
    } catch (e) {
      error.value = e
      console.error('Fetch error:', e)

      if (options.onError) {
        options.onError(e)
      }

      throw e
    } finally {
      loading.value = false
    }
  }

  const refetch = () => execute()

  // 如果 immediate 為 true,立即執行
  if (options.immediate !== false) {
    execute()
  }

  return {
    data,
    error,
    loading,
    execute,
    refetch
  }
}

/**
 * POST 請求的簡化版本
 */
export function usePost(url, options = {}) {
  return useFetch(url, {
    method: 'POST',
    ...options,
    immediate: false
  })
}

/**
 * PUT 請求的簡化版本
 */
export function usePut(url, options = {}) {
  return useFetch(url, {
    method: 'PUT',
    ...options,
    immediate: false
  })
}

/**
 * DELETE 請求的簡化版本
 */
export function useDelete(url, options = {}) {
  return useFetch(url, {
    method: 'DELETE',
    ...options,
    immediate: false
  })
}