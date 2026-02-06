<script setup>
import { ref, computed } from 'vue';

defineProps({
  msg: String,
});

const count = ref(0);
const products = [
  { id: 1, name: 'Apple', price: 100, stock: 10 },
  { id: 2, name: 'Banana', price: 60, stock: 0 },
  { id: 3, name: 'Orange', price: 80, stock: 5 },
];

const searchKeyword = ref('');
const sortOrder = ref('asc'); //asc,desc
const showSock = ref(false);
const filterProduct = computed(() => {
  let result = [...products];
  //關鍵字
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter((product) => {
      console.log(product);
      return product.name.toLowerCase().includes(keyword);
    });
  }

  if (showSock.value) {
    result = result.filter((product) => product.stock > 0);
  }
  if (sortOrder.value === 'asc') {
    result.sort((a, b) => a.price - b.price);
  } else if (sortOrder.value === 'desc') {
    console.log('desc');
    result.sort((a, b) => b.price - a.price);
  }

  return result;
});
</script>

<template>
  <div class="card">
    <div>搜尋</div>
    <input
      v-model="searchKeyword"
      type="text"
      placeholder="輸入商品名稱..."
      class="search-input"
    />

    <div>
      <input v-model="showSock" type="checkbox" />
    </div>
    <select v-model="sortOrder">
      <option value="asc">ASC</option>
      <option value="desc">DESC</option>
    </select>
    <ul>
      <li v-for="product in filterProduct" :key="product.id">
        <h2>{{ product.name }}</h2>
        <span>{{ product.stock }}</span>
      </li>
    </ul>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Learn more about IDE Support for Vue in the
    <a
      href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
      target="_blank"
      >Vue Docs Scaling up Guide</a
    >.
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template >

  <style scoped>
    .read-the-docs {
      color: #888;
}
  </style>
