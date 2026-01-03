<script setup>
import { ref, computed } from 'vue'

// Props
const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  columns: {
    type: Array,
    required: true
    // 格式: [{ key: 'name', label: '姓名', sortable: true }, ...]
  },
  itemsPerPage: {
    type: Number,
    default: 10
  }
})

// Emits
const emit = defineEmits(['row-click', 'edit', 'delete'])

// State
const currentPage = ref(1)
const sortKey = ref('')
const sortOrder = ref('asc') // 'asc' or 'desc'
const searchQuery = ref('')

// Computed
const filteredData = computed(() => {
  if (!searchQuery.value) return props.data

  return props.data.filter(item => {
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  })
})

const sortedData = computed(() => {
  if (!sortKey.value) return filteredData.value

  return [...filteredData.value].sort((a, b) => {
    const aVal = a[sortKey.value]
    const bVal = b[sortKey.value]

    let result = 0
    if (aVal < bVal) result = -1
    if (aVal > bVal) result = 1

    return sortOrder.value === 'asc' ? result : -result
  })
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * props.itemsPerPage
  const end = start + props.itemsPerPage
  return sortedData.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(sortedData.value.length / props.itemsPerPage)
})

const pageNumbers = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Methods
const handleSort = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const handleRowClick = (item) => {
  emit('row-click', item)
}

const handleEdit = (item) => {
  emit('edit', item)
}

const handleDelete = (item) => {
  emit('delete', item)
}
</script>

<template>
  <div class="data-table">
    <!-- 搜尋列 -->
    <div class="table-controls">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜尋..."
        class="search-input"
      />
    </div>

    <!-- 表格 -->
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="{ 'sortable': column.sortable }"
              @click="column.sortable && handleSort(column.key)"
            >
              {{ column.label }}
              <span v-if="column.sortable && sortKey === column.key" class="sort-icon">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th v-if="$slots.actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in paginatedData"
            :key="item.id"
            @click="handleRowClick(item)"
            class="table-row"
          >
            <td v-for="column in columns" :key="column.key">
              <slot :name="`cell-${column.key}`" :item="item">
                {{ item[column.key] }}
              </slot>
            </td>
            <td v-if="$slots.actions" class="actions-cell">
              <slot name="actions" :item="item" :edit="handleEdit" :delete="handleDelete">
                <button @click.stop="handleEdit(item)" class="btn-edit">編輯</button>
                <button @click.stop="handleDelete(item)" class="btn-delete">刪除</button>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分頁 -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        @click="goToPage(1)"
        :disabled="currentPage === 1"
        class="page-btn"
      >
        «
      </button>
      <button
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="page-btn"
      >
        ‹
      </button>

      <button
        v-for="page in pageNumbers"
        :key="page"
        @click="goToPage(page)"
        :class="{ 'active': currentPage === page }"
        class="page-btn"
      >
        {{ page }}
      </button>

      <button
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        ›
      </button>
      <button
        @click="goToPage(totalPages)"
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        »
      </button>

      <span class="page-info">
        第 {{ currentPage }} 頁,共 {{ totalPages }} 頁
      </span>
    </div>
  </div>
</template>

<style scoped>
.data-table {
  width: 100%;
}

.table-controls {
  margin-bottom: 1rem;
}

.search-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 300px;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
  user-select: none;
}

th.sortable {
  cursor: pointer;
  transition: background-color 0.2s;
}

th.sortable:hover {
  background-color: #e9ecef;
}

.sort-icon {
  margin-left: 0.5rem;
  font-size: 0.75rem;
}

.table-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.table-row:hover {
  background-color: #f8f9fa;
}

.actions-cell {
  white-space: nowrap;
}

.btn-edit,
.btn-delete {
  padding: 0.25rem 0.5rem;
  margin-right: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-edit {
  background-color: #3498db;
  color: white;
}

.btn-delete {
  background-color: #e74c3c;
  color: white;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.page-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background-color: #f8f9fa;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn.active {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.page-info {
  margin-left: auto;
  font-size: 0.875rem;
  color: #666;
}
</style>