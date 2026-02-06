# React Hooks Guide

Practical patterns for built-in and custom React hooks.

## Built-in Hooks

### useState - Local State

```typescript
// ✅ Simple value
const [count, setCount] = useState(0);

// ✅ Functional update (when new state depends on old)
setCount(prevCount => prevCount + 1);

// ✅ Lazy initialization (expensive computation)
const [state, setState] = useState(() => {
  const initialState = expensiveComputation();
  return initialState;
});

// ✅ Object state
const [form, setForm] = useState({ email: '', password: '' });

// Update single field
setForm(prev => ({ ...prev, email: newEmail }));
```

**When to use:**
- Component-local state
- Simple toggles, counters, form inputs
- UI state (expanded/collapsed, selected item)

### useEffect - Side Effects

```typescript
// ✅ Run once on mount
useEffect(() => {
  console.log('Component mounted');
}, []); // Empty dependency array

// ✅ Run on dependency change
useEffect(() => {
  console.log('Count changed:', count);
}, [count]);

// ✅ Cleanup function
useEffect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);
  
  return () => clearInterval(timer); // Cleanup
}, []);

// ✅ Async effect
useEffect(() => {
  let cancelled = false;
  
  async function fetchData() {
    const data = await api.fetch();
    if (!cancelled) {
      setData(data);
    }
  }
  
  fetchData();
  
  return () => {
    cancelled = true; // Prevent state update after unmount
  };
}, []);
```

**Common patterns:**

```typescript
// Subscribe to events
useEffect(() => {
  function handleResize() {
    setWidth(window.innerWidth);
  }
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

// Set document title
useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);

// Fetch data
useEffect(() => {
  const controller = new AbortController();
  
  fetch(url, { signal: controller.signal })
    .then(res => res.json())
    .then(setData)
    .catch(err => {
      if (err.name !== 'AbortError') {
        setError(err);
      }
    });
  
  return () => controller.abort();
}, [url]);
```

**Anti-patterns:**

```typescript
// ❌ Missing dependencies
useEffect(() => {
  console.log(count); // Should be in deps
}, []);

// ❌ Unnecessary effect (use derived state)
useEffect(() => {
  setTotal(price * quantity);
}, [price, quantity]);
// Should be: const total = price * quantity;

// ❌ Fetching in effect without cleanup
useEffect(() => {
  fetch(url).then(res => res.json()).then(setData);
}, [url]); // Race condition - use TanStack Query instead
```

### useMemo - Memoize Values

```typescript
// ✅ Expensive calculation
const expensiveValue = useMemo(() => {
  return items
    .filter(item => item.active)
    .map(item => item.value)
    .reduce((sum, val) => sum + val, 0);
}, [items]);

// ✅ Stable reference for dependencies
const filters = useMemo(() => ({
  category: selectedCategory,
  priceRange: [minPrice, maxPrice]
}), [selectedCategory, minPrice, maxPrice]);

useEffect(() => {
  applyFilters(filters);
}, [filters]); // Won't re-run unless filters change
```

**When to use:**
- Expensive calculations (>5ms)
- Creating stable object/array references for dependencies
- Filtering/sorting large datasets

### useCallback - Memoize Functions

```typescript
// ✅ Callback for memoized child
const handleClick = useCallback((id: string) => {
  console.log('Clicked', id);
}, []);

return <MemoizedList onItemClick={handleClick} />;

// ✅ With dependencies
const handleSubmit = useCallback(async (data: FormData) => {
  await api.submit(data, userId); // userId in deps
}, [userId]);

// ✅ For effect dependencies
const fetchData = useCallback(async () => {
  const data = await api.fetch(url);
  setData(data);
}, [url]);

useEffect(() => {
  fetchData();
}, [fetchData]); // Stable reference
```

**When to use:**
- Passing callbacks to memoized children
- Creating stable function references for dependencies
- Debounced/throttled functions

### useRef - Mutable References

```typescript
// ✅ DOM reference
function Input() {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const focus = () => {
    inputRef.current?.focus();
  };
  
  return (
    <div>
      <input ref={inputRef} />
      <button onClick={focus}>Focus</button>
    </div>
  );
}

// ✅ Mutable value (doesn't trigger re-render)
function Timer() {
  const intervalRef = useRef<number | null>(null);
  const [count, setCount] = useState(0);
  
  const start = () => {
    if (!intervalRef.current) {
      intervalRef.current = window.setInterval(() => {
        setCount(c => c + 1);
      }, 1000);
    }
  };
  
  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  return (
    <div>
      <div>{count}</div>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}

// ✅ Store previous value
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}
```

**When to use:**
- DOM element references
- Storing values that don't trigger re-renders
- Persisting values across renders (timers, subscriptions)
- Storing previous state/props

### useReducer - Complex State Logic

```typescript
// ✅ Complex state with multiple actions
interface State {
  items: Item[];
  filter: string;
  sort: 'asc' | 'desc';
  loading: boolean;
}

type Action =
  | { type: 'ADD_ITEM'; payload: Item }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'SET_FILTER'; payload: string }
  | { type: 'SET_SORT'; payload: 'asc' | 'desc' }
  | { type: 'SET_LOADING'; payload: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_SORT':
      return { ...state, sort: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

function List() {
  const [state, dispatch] = useReducer(reducer, {
    items: [],
    filter: '',
    sort: 'asc',
    loading: false,
  });
  
  const addItem = (item: Item) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };
  
  return (
    <div>
      <input 
        value={state.filter}
        onChange={(e) => dispatch({ type: 'SET_FILTER', payload: e.target.value })}
      />
      <ItemList items={state.items} sort={state.sort} />
    </div>
  );
}
```

**When to use:**
- Multiple related state values
- Complex state transitions
- State logic depends on previous state
- Multiple ways to update the same piece of state

## Custom Hooks

### Pattern: useLocalStorage

```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };
  
  return [storedValue, setValue];
}

// Usage
const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
```

### Pattern: useDebounce

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

// Usage
function SearchBox() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  
  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery);
    }
  }, [debouncedQuery]);
  
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

### Pattern: useWindowSize

```typescript
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  
  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return size;
}

// Usage
function Component() {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  
  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;
}
```

### Pattern: useToggle

```typescript
function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle];
}

// Usage
function Modal() {
  const [isOpen, toggleOpen] = useToggle(false);
  
  return (
    <div>
      <button onClick={toggleOpen}>Toggle</button>
      {isOpen && <ModalContent onClose={toggleOpen} />}
    </div>
  );
}
```

### Pattern: useAsync

```typescript
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
): AsyncState<T> & { execute: () => Promise<void> } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });
  
  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, [asyncFunction]);
  
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);
  
  return { ...state, execute };
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { data, loading, error, execute } = useAsync(
    () => api.fetchUser(userId),
    true
  );
  
  if (loading) return <Spinner />;
  if (error) return <Error error={error} retry={execute} />;
  if (!data) return null;
  
  return <div>{data.name}</div>;
}
```

### Pattern: useIntersectionObserver

```typescript
function useIntersectionObserver(
  ref: RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);
    
    observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, [ref, options]);
  
  return isIntersecting;
}

// Usage - Lazy load images
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.1 });
  
  return (
    <div ref={ref}>
      {isVisible ? <img src={src} alt={alt} /> : <div>Loading...</div>}
    </div>
  );
}
```

### Pattern: useMediaQuery

```typescript
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    return window.matchMedia(query).matches;
  });
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);
  
  return matches;
}

// Usage
function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  
  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {!isMobile && !isTablet && <DesktopLayout />}
    </div>
  );
}
```

## Hook Best Practices

### 1. Rules of Hooks

```typescript
// ✓ Call hooks at top level
function Component() {
  const [state, setState] = useState(0);
  const value = useMemo(() => compute(state), [state]);
  // ...
}

// ✗ Don't call conditionally
function Component() {
  if (condition) {
    const [state, setState] = useState(0); // Wrong!
  }
}

// ✗ Don't call in loops
function Component() {
  items.forEach(item => {
    const [state, setState] = useState(0); // Wrong!
  });
}
```

### 2. Extract Complex Logic to Custom Hooks

```typescript
// ✓ Clean component
function SearchableList({ items }: Props) {
  const { query, setQuery, filteredItems } = useSearch(items);
  
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <List items={filteredItems} />
    </div>
  );
}

// Logic in custom hook
function useSearch<T>(items: T[], searchKey: keyof T) {
  const [query, setQuery] = useState('');
  
  const filteredItems = useMemo(() => {
    if (!query) return items;
    return items.filter(item => 
      String(item[searchKey]).toLowerCase().includes(query.toLowerCase())
    );
  }, [items, query, searchKey]);
  
  return { query, setQuery, filteredItems };
}
```

### 3. Use ESLint Rules

```json
// .eslintrc
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 4. Name Custom Hooks with "use" Prefix

```typescript
// ✓ Correct
function useAuth() { ... }
function useLocalStorage() { ... }
function useFetch() { ... }

// ✗ Wrong
function getAuth() { ... }
function localStorage() { ... }
function fetchData() { ... }
```

### 5. Return Object for Multiple Values

```typescript
// ✓ Better - named return values
function useForm() {
  return {
    values,
    errors,
    handleChange,
    handleSubmit,
    isValid,
  };
}

// Usage - clear what each value is
const { values, errors, handleSubmit } = useForm();

// ✗ Array return gets confusing with many values
function useForm() {
  return [values, errors, handleChange, handleSubmit, isValid];
}
const [values, errors, change, submit, valid] = useForm(); // What's what?
```

## Common Mistakes

### 1. Unnecessary useEffect

```typescript
// ❌ Don't use effect for derived state
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [fullName, setFullName] = useState('');

useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// ✅ Calculate directly
const fullName = `${firstName} ${lastName}`;
```

### 2. Stale Closures

```typescript
// ❌ Captures old count value
const [count, setCount] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1); // Always uses count from initial render
  }, 1000);
  return () => clearInterval(timer);
}, []);

// ✅ Use functional update
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1); // Always uses latest count
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

### 3. Missing Cleanup

```typescript
// ❌ Memory leak
useEffect(() => {
  const subscription = subscribe();
  // Missing cleanup
}, []);

// ✅ Proper cleanup
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);
```

### 4. Infinite Loops

```typescript
// ❌ Infinite loop - object created every render
const [count, setCount] = useState(0);

useEffect(() => {
  setCount(count + 1);
}, [{ value: count }]); // New object every time

// ✅ Use primitive value
useEffect(() => {
  setCount(count + 1);
}, [count]);
```