# Pinia Store Testing Patterns

## Basic Store Testing

### Testing State and Getters

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@/stores/user';

describe('useUserStore - State and Getters', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with default state', () => {
    const store = useUserStore();
    
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.token).toBe('');
  });

  it('should compute isAuthenticated getter', () => {
    const store = useUserStore();
    
    expect(store.isAuthenticated).toBe(false);
    
    store.user = { id: 1, name: 'John Doe' };
    store.token = 'abc123';
    
    expect(store.isAuthenticated).toBe(true);
  });

  it('should compute fullName getter from user data', () => {
    const store = useUserStore();
    
    store.user = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe'
    };
    
    expect(store.fullName).toBe('John Doe');
  });
});
```

### Testing Actions

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@/stores/user';

describe('useUserStore - Actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    global.fetch = vi.fn();
  });

  it('should login successfully', async () => {
    const mockUser = { id: 1, name: 'John Doe' };
    const mockToken = 'token123';
    
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: mockUser, token: mockToken })
    });
    
    const store = useUserStore();
    
    await store.login('john@example.com', 'password');
    
    expect(store.user).toEqual(mockUser);
    expect(store.token).toBe(mockToken);
    expect(store.isAuthenticated).toBe(true);
  });

  it('should handle login failure', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Invalid credentials' })
    });
    
    const store = useUserStore();
    
    await expect(store.login('wrong@example.com', 'wrong')).rejects.toThrow(
      'Invalid credentials'
    );
    
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('should logout and clear state', () => {
    const store = useUserStore();
    
    // Set initial state
    store.user = { id: 1, name: 'John Doe' };
    store.token = 'token123';
    
    store.logout();
    
    expect(store.user).toBeNull();
    expect(store.token).toBe('');
    expect(store.isAuthenticated).toBe(false);
  });

  it('should update user profile', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, name: 'Jane Doe', email: 'jane@example.com' })
    });
    
    const store = useUserStore();
    store.user = { id: 1, name: 'John Doe' };
    
    await store.updateProfile({ name: 'Jane Doe', email: 'jane@example.com' });
    
    expect(store.user.name).toBe('Jane Doe');
    expect(store.user.email).toBe('jane@example.com');
  });
});
```

### Testing Store with Multiple Dependencies

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { useCartStore } from '@/stores/cart';
import { useProductStore } from '@/stores/product';

describe('useCartStore with Dependencies', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should add product to cart', () => {
    const productStore = useProductStore();
    const cartStore = useCartStore();
    
    const product = { id: 1, name: 'Product 1', price: 100 };
    productStore.products = [product];
    
    cartStore.addItem(product.id, 2);
    
    expect(cartStore.items).toHaveLength(1);
    expect(cartStore.items[0]).toEqual({
      productId: 1,
      quantity: 2,
      price: 100
    });
  });

  it('should calculate total from cart items', () => {
    const cartStore = useCartStore();
    
    cartStore.items = [
      { productId: 1, quantity: 2, price: 100 },
      { productId: 2, quantity: 1, price: 50 }
    ];
    
    expect(cartStore.total).toBe(250);
  });

  it('should remove item from cart', () => {
    const cartStore = useCartStore();
    
    cartStore.items = [
      { productId: 1, quantity: 2, price: 100 },
      { productId: 2, quantity: 1, price: 50 }
    ];
    
    cartStore.removeItem(1);
    
    expect(cartStore.items).toHaveLength(1);
    expect(cartStore.items[0].productId).toBe(2);
  });

  it('should clear cart', () => {
    const cartStore = useCartStore();
    
    cartStore.items = [
      { productId: 1, quantity: 2, price: 100 }
    ];
    
    cartStore.clear();
    
    expect(cartStore.items).toEqual([]);
    expect(cartStore.total).toBe(0);
  });
});
```

### Testing Store Persistence

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { useSettingsStore } from '@/stores/settings';

describe('useSettingsStore - Persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('should load settings from localStorage', () => {
    localStorage.setItem('settings', JSON.stringify({
      theme: 'dark',
      language: 'zh-TW'
    }));
    
    const store = useSettingsStore();
    
    expect(store.theme).toBe('dark');
    expect(store.language).toBe('zh-TW');
  });

  it('should save settings to localStorage on change', () => {
    const store = useSettingsStore();
    
    store.updateTheme('dark');
    
    const saved = localStorage.getItem('settings');
    expect(JSON.parse(saved!).theme).toBe('dark');
  });

  it('should handle corrupted localStorage data', () => {
    localStorage.setItem('settings', 'invalid-json');
    
    const store = useSettingsStore();
    
    // Should fallback to default values
    expect(store.theme).toBe('light');
    expect(store.language).toBe('en');
  });
});
```

### Testing Async Store Actions

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { usePostStore } from '@/stores/post';
import { flushPromises } from '@vue/test-utils';

describe('usePostStore - Async Actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    global.fetch = vi.fn();
  });

  it('should fetch posts successfully', async () => {
    const mockPosts = [
      { id: 1, title: 'Post 1' },
      { id: 2, title: 'Post 2' }
    ];
    
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPosts)
    });
    
    const store = usePostStore();
    
    expect(store.loading).toBe(false);
    
    const promise = store.fetchPosts();
    
    expect(store.loading).toBe(true);
    
    await promise;
    
    expect(store.loading).toBe(false);
    expect(store.posts).toEqual(mockPosts);
    expect(store.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));
    
    const store = usePostStore();
    
    await store.fetchPosts();
    
    expect(store.loading).toBe(false);
    expect(store.posts).toEqual([]);
    expect(store.error).toBe('Network error');
  });

  it('should create new post', async () => {
    const newPost = { title: 'New Post', content: 'Content' };
    const createdPost = { id: 1, ...newPost };
    
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createdPost)
    });
    
    const store = usePostStore();
    
    await store.createPost(newPost);
    
    expect(store.posts).toContainEqual(createdPost);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(newPost)
      })
    );
  });

  it('should update existing post', async () => {
    const store = usePostStore();
    store.posts = [
      { id: 1, title: 'Old Title', content: 'Old Content' }
    ];
    
    const updatedPost = { id: 1, title: 'New Title', content: 'New Content' };
    
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(updatedPost)
    });
    
    await store.updatePost(1, { title: 'New Title', content: 'New Content' });
    
    expect(store.posts[0]).toEqual(updatedPost);
  });

  it('should delete post', async () => {
    const store = usePostStore();
    store.posts = [
      { id: 1, title: 'Post 1' },
      { id: 2, title: 'Post 2' }
    ];
    
    (global.fetch as any).mockResolvedValue({ ok: true });
    
    await store.deletePost(1);
    
    expect(store.posts).toHaveLength(1);
    expect(store.posts[0].id).toBe(2);
  });
});
```

### Testing Store State Hydration

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { useHydratedStore } from '@/stores/hydrated';

describe('useHydratedStore - Hydration', () => {
  it('should hydrate store from server state', () => {
    const serverState = {
      user: { id: 1, name: 'John' },
      settings: { theme: 'dark' }
    };
    
    const pinia = createPinia();
    pinia.state.value = serverState;
    setActivePinia(pinia);
    
    const store = useHydratedStore();
    
    expect(store.user).toEqual(serverState.user);
    expect(store.settings).toEqual(serverState.settings);
  });
});
```

### Testing Store Subscriptions

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { useNotificationStore } from '@/stores/notification';

describe('useNotificationStore - Subscriptions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should trigger subscription on state change', () => {
    const store = useNotificationStore();
    const subscriber = vi.fn();
    
    store.$subscribe(subscriber);
    
    store.addNotification({ id: 1, message: 'Test' });
    
    expect(subscriber).toHaveBeenCalled();
  });

  it('should pass mutation details to subscriber', () => {
    const store = useNotificationStore();
    const subscriber = vi.fn();
    
    store.$subscribe((mutation, state) => {
      subscriber(mutation, state);
    });
    
    store.addNotification({ id: 1, message: 'Test' });
    
    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.any(String),
        storeId: 'notification'
      }),
      expect.objectContaining({
        notifications: expect.any(Array)
      })
    );
  });

  it('should support detached subscription', () => {
    const store = useNotificationStore();
    const subscriber = vi.fn();
    
    const unsubscribe = store.$subscribe(subscriber, { detached: true });
    
    store.addNotification({ id: 1, message: 'Test' });
    
    expect(subscriber).toHaveBeenCalled();
    
    unsubscribe();
    
    store.addNotification({ id: 2, message: 'Test 2' });
    
    expect(subscriber).toHaveBeenCalledTimes(1); // Not called after unsubscribe
  });
});
```

### Testing Store with Options API

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { defineStore } from 'pinia';

const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  getters: {
    doubleCount: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++;
    }
  }
});

describe('Options API Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should work with options API', () => {
    const store = useCounterStore();
    
    expect(store.count).toBe(0);
    expect(store.doubleCount).toBe(0);
    
    store.increment();
    
    expect(store.count).toBe(1);
    expect(store.doubleCount).toBe(2);
  });
});
```

### Testing Store Reset

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@/stores/user';

describe('useUserStore - Reset', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should reset store to initial state', () => {
    const store = useUserStore();
    
    // Modify state
    store.user = { id: 1, name: 'John' };
    store.token = 'token123';
    
    expect(store.user).not.toBeNull();
    
    // Reset
    store.$reset();
    
    expect(store.user).toBeNull();
    expect(store.token).toBe('');
  });
});
```

## Testing Stores in Components

```typescript
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@/stores/user';
import UserProfile from '@/components/UserProfile.vue';

describe('UserProfile with Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should display user data from store', () => {
    const store = useUserStore();
    store.user = { id: 1, name: 'John Doe', email: 'john@example.com' };
    
    const wrapper = mount(UserProfile);
    
    expect(wrapper.text()).toContain('John Doe');
    expect(wrapper.text()).toContain('john@example.com');
  });

  it('should call store action on button click', async () => {
    const store = useUserStore();
    const logoutSpy = vi.spyOn(store, 'logout');
    
    const wrapper = mount(UserProfile);
    
    await wrapper.find('.logout-btn').trigger('click');
    
    expect(logoutSpy).toHaveBeenCalled();
  });

  it('should react to store state changes', async () => {
    const store = useUserStore();
    
    const wrapper = mount(UserProfile);
    
    expect(wrapper.find('.username').exists()).toBe(false);
    
    store.user = { id: 1, name: 'John Doe' };
    
    await wrapper.vm.$nextTick();
    
    expect(wrapper.find('.username').text()).toBe('John Doe');
  });
});
```