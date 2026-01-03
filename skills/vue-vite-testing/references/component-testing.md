# Vue Component Testing Patterns

## Complete Component Testing Examples

### Testing Props and Validation

```typescript
import { mount } from '@vue/test-utils';
import UserProfile from '@/components/UserProfile.vue';

describe('UserProfile - Props', () => {
  it('should render with required props', () => {
    const wrapper = mount(UserProfile, {
      props: {
        username: 'john_doe',
        email: 'john@example.com'
      }
    });
    
    expect(wrapper.find('.username').text()).toBe('john_doe');
    expect(wrapper.find('.email').text()).toBe('john@example.com');
  });

  it('should apply default props when not provided', () => {
    const wrapper = mount(UserProfile, {
      props: {
        username: 'john_doe'
        // email not provided, should use default
      }
    });
    
    expect(wrapper.find('.email').text()).toBe('');
  });

  it('should validate prop types during development', () => {
    // Vitest will show warnings for invalid prop types in development
    const wrapper = mount(UserProfile, {
      props: {
        username: 123, // Should be string
        email: 'john@example.com'
      }
    });
    
    // Component should still render with type coercion
    expect(wrapper.exists()).toBe(true);
  });
});
```

### Testing Emitted Events

```typescript
import { mount } from '@vue/test-utils';
import SearchInput from '@/components/SearchInput.vue';

describe('SearchInput - Events', () => {
  it('should emit search event with query on submit', async () => {
    const wrapper = mount(SearchInput);
    
    await wrapper.find('input').setValue('test query');
    await wrapper.find('form').trigger('submit');
    
    expect(wrapper.emitted('search')).toBeTruthy();
    expect(wrapper.emitted('search')?.[0]).toEqual(['test query']);
  });

  it('should emit update:modelValue for v-model', async () => {
    const wrapper = mount(SearchInput, {
      props: {
        modelValue: 'initial'
      }
    });
    
    await wrapper.find('input').setValue('updated value');
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['updated value']);
  });

  it('should emit multiple events in sequence', async () => {
    const wrapper = mount(SearchInput);
    
    await wrapper.find('input').setValue('a');
    await wrapper.find('input').setValue('ab');
    await wrapper.find('input').setValue('abc');
    
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toHaveLength(3);
    expect(emitted?.[0]).toEqual(['a']);
    expect(emitted?.[1]).toEqual(['ab']);
    expect(emitted?.[2]).toEqual(['abc']);
  });
});
```

### Testing Slots

```typescript
import { mount } from '@vue/test-utils';
import Card from '@/components/Card.vue';

describe('Card - Slots', () => {
  it('should render default slot content', () => {
    const wrapper = mount(Card, {
      slots: {
        default: '<p>Card content</p>'
      }
    });
    
    expect(wrapper.html()).toContain('Card content');
  });

  it('should render named slots', () => {
    const wrapper = mount(Card, {
      slots: {
        header: '<h2>Card Title</h2>',
        default: '<p>Card content</p>',
        footer: '<button>Action</button>'
      }
    });
    
    expect(wrapper.find('.card-header').html()).toContain('Card Title');
    expect(wrapper.find('.card-body').html()).toContain('Card content');
    expect(wrapper.find('.card-footer').html()).toContain('Action');
  });

  it('should render scoped slot with props', () => {
    const wrapper = mount(Card, {
      slots: {
        default: `
          <template #default="{ data }">
            <span class="data-value">{{ data }}</span>
          </template>
        `
      }
    });
    
    expect(wrapper.find('.data-value').exists()).toBe(true);
  });

  it('should handle conditional slot rendering', () => {
    const wrapper = mount(Card, {
      slots: {
        header: '<h2>Title</h2>'
        // no footer slot provided
      }
    });
    
    expect(wrapper.find('.card-header').exists()).toBe(true);
    expect(wrapper.find('.card-footer').exists()).toBe(false);
  });
});
```

### Testing Provide/Inject

```typescript
import { mount } from '@vue/test-utils';
import ParentComponent from '@/components/ParentComponent.vue';
import ChildComponent from '@/components/ChildComponent.vue';

describe('Provide/Inject', () => {
  it('should provide values to child components', () => {
    const wrapper = mount(ParentComponent, {
      global: {
        provide: {
          theme: 'dark',
          language: 'en'
        }
      }
    });
    
    const child = wrapper.findComponent(ChildComponent);
    expect(child.vm.theme).toBe('dark');
    expect(child.vm.language).toBe('en');
  });

  it('should test child component with injected dependencies', () => {
    const wrapper = mount(ChildComponent, {
      global: {
        provide: {
          apiClient: {
            get: vi.fn().mockResolvedValue({ data: [] }),
            post: vi.fn()
          }
        }
      }
    });
    
    expect(wrapper.vm.apiClient).toBeDefined();
  });
});
```

### Testing Async Components

```typescript
import { mount, flushPromises } from '@vue/test-utils';
import AsyncDataList from '@/components/AsyncDataList.vue';

describe('AsyncDataList', () => {
  it('should show loading state initially', () => {
    const wrapper = mount(AsyncDataList);
    
    expect(wrapper.find('.loading').exists()).toBe(true);
    expect(wrapper.find('.data-list').exists()).toBe(false);
  });

  it('should display data after loading', async () => {
    const mockData = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ];
    
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockData)
    });
    
    const wrapper = mount(AsyncDataList);
    
    await flushPromises();
    
    expect(wrapper.find('.loading').exists()).toBe(false);
    expect(wrapper.findAll('.data-item')).toHaveLength(2);
  });

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));
    
    const wrapper = mount(AsyncDataList);
    
    await flushPromises();
    
    expect(wrapper.find('.error').exists()).toBe(true);
    expect(wrapper.find('.error').text()).toContain('API Error');
  });
});
```

### Testing Teleport Components

```typescript
import { mount } from '@vue/test-utils';
import ModalDialog from '@/components/ModalDialog.vue';

describe('ModalDialog with Teleport', () => {
  beforeEach(() => {
    // Create teleport target
    const el = document.createElement('div');
    el.id = 'modal-target';
    document.body.appendChild(el);
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
  });

  it('should teleport content to target element', async () => {
    const wrapper = mount(ModalDialog, {
      props: {
        isOpen: true
      },
      attachTo: document.body
    });
    
    await wrapper.vm.$nextTick();
    
    const target = document.getElementById('modal-target');
    expect(target?.innerHTML).toContain('modal-content');
  });

  it('should not render when isOpen is false', async () => {
    const wrapper = mount(ModalDialog, {
      props: {
        isOpen: false
      }
    });
    
    await wrapper.vm.$nextTick();
    
    const target = document.getElementById('modal-target');
    expect(target?.innerHTML).toBe('');
  });
});
```

### Testing Form Validation

```typescript
import { mount } from '@vue/test-utils';
import LoginForm from '@/components/LoginForm.vue';

describe('LoginForm - Validation', () => {
  it('should show validation errors for empty fields', async () => {
    const wrapper = mount(LoginForm);
    
    await wrapper.find('form').trigger('submit');
    
    expect(wrapper.find('.email-error').text()).toBe('Email is required');
    expect(wrapper.find('.password-error').text()).toBe('Password is required');
  });

  it('should validate email format', async () => {
    const wrapper = mount(LoginForm);
    
    await wrapper.find('input[type="email"]').setValue('invalid-email');
    await wrapper.find('form').trigger('submit');
    
    expect(wrapper.find('.email-error').text()).toContain('valid email');
  });

  it('should clear errors when input is valid', async () => {
    const wrapper = mount(LoginForm);
    
    // Trigger error
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('.email-error').exists()).toBe(true);
    
    // Fix input
    await wrapper.find('input[type="email"]').setValue('user@example.com');
    await wrapper.find('input[type="password"]').setValue('password123');
    
    expect(wrapper.find('.email-error').exists()).toBe(false);
  });

  it('should prevent submission with invalid data', async () => {
    const wrapper = mount(LoginForm);
    const submitHandler = vi.fn();
    
    wrapper.vm.$on('submit', submitHandler);
    
    await wrapper.find('input[type="email"]').setValue('invalid');
    await wrapper.find('form').trigger('submit');
    
    expect(submitHandler).not.toHaveBeenCalled();
  });
});
```

### Testing Computed Properties and Watchers

```typescript
import { mount } from '@vue/test-utils';
import ShoppingCart from '@/components/ShoppingCart.vue';

describe('ShoppingCart - Computed and Watchers', () => {
  it('should calculate total price from items', () => {
    const wrapper = mount(ShoppingCart, {
      props: {
        items: [
          { id: 1, name: 'Item 1', price: 100, quantity: 2 },
          { id: 2, name: 'Item 2', price: 50, quantity: 1 }
        ]
      }
    });
    
    expect(wrapper.vm.totalPrice).toBe(250);
    expect(wrapper.find('.total').text()).toContain('250');
  });

  it('should update computed value when props change', async () => {
    const wrapper = mount(ShoppingCart, {
      props: {
        items: [{ id: 1, price: 100, quantity: 1 }]
      }
    });
    
    expect(wrapper.vm.totalPrice).toBe(100);
    
    await wrapper.setProps({
      items: [
        { id: 1, price: 100, quantity: 1 },
        { id: 2, price: 50, quantity: 2 }
      ]
    });
    
    expect(wrapper.vm.totalPrice).toBe(200);
  });

  it('should trigger watcher when quantity changes', async () => {
    const wrapper = mount(ShoppingCart);
    const notifySpy = vi.spyOn(wrapper.vm, 'notifyChange');
    
    await wrapper.find('.quantity-input').setValue(5);
    
    expect(notifySpy).toHaveBeenCalled();
  });
});
```

## Testing with Global Plugins

```typescript
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { createRouter, createMemoryHistory } from 'vue-router';
import MyComponent from '@/components/MyComponent.vue';

describe('MyComponent with Global Plugins', () => {
  it('should work with vue-i18n', () => {
    const i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {
          hello: 'Hello World'
        }
      }
    });
    
    const wrapper = mount(MyComponent, {
      global: {
        plugins: [i18n]
      }
    });
    
    expect(wrapper.text()).toContain('Hello World');
  });

  it('should work with vue-router', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/about', component: { template: '<div>About</div>' } }
      ]
    });
    
    const wrapper = mount(MyComponent, {
      global: {
        plugins: [router]
      }
    });
    
    await router.push('/about');
    await wrapper.vm.$nextTick();
    
    expect(router.currentRoute.value.path).toBe('/about');
  });
});
```