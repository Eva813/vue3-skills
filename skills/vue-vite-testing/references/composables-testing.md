# Vue Composables Testing Patterns

## Testing Composable Functions

### Basic Composable Testing

```typescript
import { ref, computed } from 'vue';
import { useCounter } from '@/composables/useCounter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { count, increment, decrement } = useCounter();
    
    expect(count.value).toBe(0);
  });

  it('should initialize with custom value', () => {
    const { count } = useCounter(10);
    
    expect(count.value).toBe(10);
  });

  it('should increment count', () => {
    const { count, increment } = useCounter();
    
    increment();
    
    expect(count.value).toBe(1);
  });

  it('should decrement count', () => {
    const { count, decrement } = useCounter(5);
    
    decrement();
    
    expect(count.value).toBe(4);
  });

  it('should not go below zero', () => {
    const { count, decrement } = useCounter(0);
    
    decrement();
    
    expect(count.value).toBe(0);
  });
});
```

### Testing Composables with Async Operations

```typescript
import { useFetch } from '@/composables/useFetch';
import { flushPromises } from '@vue/test-utils';

describe('useFetch', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should handle successful fetch', async () => {
    const mockData = { id: 1, name: 'Test User' };
    
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });
    
    const { data, error, loading, execute } = useFetch('/api/user');
    
    expect(loading.value).toBe(false);
    
    execute();
    expect(loading.value).toBe(true);
    
    await flushPromises();
    
    expect(loading.value).toBe(false);
    expect(data.value).toEqual(mockData);
    expect(error.value).toBeNull();
  });

  it('should handle fetch errors', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));
    
    const { data, error, loading, execute } = useFetch('/api/user');
    
    execute();
    
    await flushPromises();
    
    expect(loading.value).toBe(false);
    expect(data.value).toBeNull();
    expect(error.value).toBe('Network error');
  });

  it('should handle HTTP errors', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });
    
    const { error, execute } = useFetch('/api/user');
    
    execute();
    
    await flushPromises();
    
    expect(error.value).toContain('404');
  });

  it('should support abort controller', async () => {
    const { loading, execute, abort } = useFetch('/api/user');
    
    execute();
    expect(loading.value).toBe(true);
    
    abort();
    
    await flushPromises();
    
    expect(loading.value).toBe(false);
  });
});
```

### Testing Composables with Side Effects

```typescript
import { useLocalStorage } from '@/composables/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with default value when key not exists', () => {
    const { value } = useLocalStorage('test-key', 'default');
    
    expect(value.value).toBe('default');
  });

  it('should load existing value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));
    
    const { value } = useLocalStorage('test-key', 'default');
    
    expect(value.value).toBe('stored-value');
  });

  it('should sync changes to localStorage', () => {
    const { value } = useLocalStorage('test-key', 'initial');
    
    value.value = 'updated';
    
    const stored = localStorage.getItem('test-key');
    expect(JSON.parse(stored!)).toBe('updated');
  });

  it('should handle complex objects', () => {
    const defaultObj = { name: 'test', count: 0 };
    const { value } = useLocalStorage('test-obj', defaultObj);
    
    value.value = { name: 'updated', count: 5 };
    
    const stored = localStorage.getItem('test-obj');
    expect(JSON.parse(stored!)).toEqual({ name: 'updated', count: 5 });
  });

  it('should handle localStorage quota exceeded', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    setItemSpy.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    
    const { value, error } = useLocalStorage('test-key', 'value');
    
    value.value = 'new value';
    
    expect(error.value).toBeTruthy();
    
    setItemSpy.mockRestore();
  });
});
```

### Testing Composables with Timers

```typescript
import { useDebounce } from '@/composables/useDebounce';
import { ref } from 'vue';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce value updates', () => {
    const input = ref('');
    const { debouncedValue } = useDebounce(input, 300);
    
    expect(debouncedValue.value).toBe('');
    
    input.value = 'a';
    expect(debouncedValue.value).toBe('');
    
    vi.advanceTimersByTime(150);
    expect(debouncedValue.value).toBe('');
    
    vi.advanceTimersByTime(150);
    expect(debouncedValue.value).toBe('a');
  });

  it('should reset timer on rapid changes', () => {
    const input = ref('');
    const { debouncedValue } = useDebounce(input, 300);
    
    input.value = 'a';
    vi.advanceTimersByTime(200);
    
    input.value = 'ab';
    vi.advanceTimersByTime(200);
    
    expect(debouncedValue.value).toBe('');
    
    vi.advanceTimersByTime(100);
    expect(debouncedValue.value).toBe('ab');
  });

  it('should handle immediate option', () => {
    const input = ref('initial');
    const { debouncedValue } = useDebounce(input, 300, { immediate: true });
    
    expect(debouncedValue.value).toBe('initial');
    
    input.value = 'updated';
    expect(debouncedValue.value).toBe('updated');
    
    vi.advanceTimersByTime(300);
    expect(debouncedValue.value).toBe('updated');
  });
});
```

### Testing Composables with Event Listeners

```typescript
import { useEventListener } from '@/composables/useEventListener';
import { onUnmounted } from 'vue';

describe('useEventListener', () => {
  it('should add event listener to target', () => {
    const handler = vi.fn();
    const button = document.createElement('button');
    
    useEventListener(button, 'click', handler);
    
    button.click();
    
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should remove event listener on cleanup', () => {
    const handler = vi.fn();
    const button = document.createElement('button');
    const removeListenerSpy = vi.spyOn(button, 'removeEventListener');
    
    const { cleanup } = useEventListener(button, 'click', handler);
    
    cleanup();
    
    expect(removeListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('should support window events', () => {
    const handler = vi.fn();
    
    useEventListener(window, 'resize', handler);
    
    window.dispatchEvent(new Event('resize'));
    
    expect(handler).toHaveBeenCalled();
  });

  it('should support event options', () => {
    const handler = vi.fn();
    const button = document.createElement('button');
    const addListenerSpy = vi.spyOn(button, 'addEventListener');
    
    useEventListener(button, 'click', handler, { once: true, capture: true });
    
    expect(addListenerSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      { once: true, capture: true }
    );
  });
});
```

### Testing Composables with Watchers

```typescript
import { useForm } from '@/composables/useForm';
import { nextTick } from 'vue';

describe('useForm', () => {
  it('should validate on value change', async () => {
    const rules = {
      email: (value: string) => value.includes('@') || 'Invalid email'
    };
    
    const { values, errors, setFieldValue } = useForm({ email: '' }, rules);
    
    setFieldValue('email', 'invalid');
    await nextTick();
    
    expect(errors.value.email).toBe('Invalid email');
    
    setFieldValue('email', 'valid@example.com');
    await nextTick();
    
    expect(errors.value.email).toBeUndefined();
  });

  it('should track dirty state', async () => {
    const { values, isDirty, setFieldValue } = useForm({ name: 'initial' });
    
    expect(isDirty.value).toBe(false);
    
    setFieldValue('name', 'changed');
    await nextTick();
    
    expect(isDirty.value).toBe(true);
  });

  it('should reset form to initial values', async () => {
    const { values, setFieldValue, reset } = useForm({ name: 'initial' });
    
    setFieldValue('name', 'changed');
    expect(values.value.name).toBe('changed');
    
    reset();
    
    expect(values.value.name).toBe('initial');
  });
});
```

### Testing Composables with Multiple Reactive Dependencies

```typescript
import { useCalculator } from '@/composables/useCalculator';
import { ref } from 'vue';

describe('useCalculator', () => {
  it('should calculate sum of reactive values', () => {
    const a = ref(5);
    const b = ref(10);
    
    const { sum } = useCalculator(a, b);
    
    expect(sum.value).toBe(15);
  });

  it('should update result when dependencies change', () => {
    const a = ref(5);
    const b = ref(10);
    
    const { sum, product } = useCalculator(a, b);
    
    expect(sum.value).toBe(15);
    expect(product.value).toBe(50);
    
    a.value = 3;
    
    expect(sum.value).toBe(13);
    expect(product.value).toBe(30);
    
    b.value = 7;
    
    expect(sum.value).toBe(10);
    expect(product.value).toBe(21);
  });
});
```

### Testing Composable Cleanup and Lifecycle

```typescript
import { useInterval } from '@/composables/useInterval';
import { effectScope } from 'vue';

describe('useInterval - Cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should cleanup interval on scope dispose', () => {
    const callback = vi.fn();
    const scope = effectScope();
    
    scope.run(() => {
      useInterval(callback, 1000);
    });
    
    vi.advanceTimersByTime(3000);
    expect(callback).toHaveBeenCalledTimes(3);
    
    scope.stop();
    
    vi.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(3); // No more calls after cleanup
  });

  it('should support manual pause and resume', () => {
    const callback = vi.fn();
    const { pause, resume } = useInterval(callback, 1000);
    
    vi.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(2);
    
    pause();
    
    vi.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(2); // Paused, no new calls
    
    resume();
    
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(3); // Resumed
  });
});
```

## Testing Composables in Component Context

```typescript
import { mount } from '@vue/test-utils';
import ComponentUsingComposable from '@/components/ComponentUsingComposable.vue';

describe('Component with Composable', () => {
  it('should use composable within component', async () => {
    const wrapper = mount(ComponentUsingComposable);
    
    expect(wrapper.find('.count').text()).toBe('0');
    
    await wrapper.find('.increment-btn').trigger('click');
    
    expect(wrapper.find('.count').text()).toBe('1');
  });

  it('should cleanup composable on unmount', () => {
    const cleanupSpy = vi.fn();
    vi.mock('@/composables/useFeature', () => ({
      useFeature: () => {
        onUnmounted(cleanupSpy);
        return { value: ref(0) };
      }
    }));
    
    const wrapper = mount(ComponentUsingComposable);
    
    wrapper.unmount();
    
    expect(cleanupSpy).toHaveBeenCalled();
  });
});
```