# State Management Patterns

Complete guide to choosing and implementing state management in React.

## Pattern Selection Matrix

| Scenario | Solution | When to Use |
|----------|----------|-------------|
| Single component state | `useState` | Default choice, isolated state |
| Derived state | No state, calculate in render | Value computed from props/state |
| 2-3 related components | Lift state + props | Parent manages, children consume |
| Deep component tree | Context API | Theme, auth, i18n, settings |
| Complex app state | Zustand | Multiple features sharing state |
| Enterprise scale | Redux Toolkit | Need devtools, strict patterns |
| Server data | TanStack Query | API calls, caching, mutations |
| Form state | React Hook Form | 5+ fields, validation |
| URL state | React Router | Shareable/bookmarkable state |

## Pattern 1: Local State (useState)

**Use for:** Component-specific state, toggles, form inputs, UI state

```typescript
// ✅ Simple counter
function Counter() {
  const [count, setCount] = useState(0);
  const increment = () => setCount(c => c + 1); // Use functional update
  return <button onClick={increment}>{count}</button>;
}

// ✅ Toggle state
function Accordion() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && <Content />}
    </div>
  );
}

// ✅ Input state
function SearchBox() {
  const [query, setQuery] = useState('');
  return (
    <input 
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

**Rules:**
- Always use functional updates when new state depends on old: `setCount(c => c + 1)`
- Initialize with proper type: `useState<string | null>(null)`
- Don't store derived values - calculate in render

## Pattern 2: Lifted State

**Use for:** 2-3 closely related components sharing state

```typescript
// ✅ Parent manages shared state
function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  
  const addTodo = (text: string) => {
    setTodos([...todos, { id: crypto.randomUUID(), text, done: false }]);
  };
  
  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  };
  
  return (
    <div>
      <TodoInput onAdd={addTodo} />
      <TodoList todos={todos} onToggle={toggleTodo} />
      <TodoStats count={todos.length} />
    </div>
  );
}

// Children are stateless
function TodoInput({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState('');
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text);
      setText('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button type="submit">Add</button>
    </form>
  );
}
```

**When to stop lifting:**
- More than 3 levels of prop drilling → Use Context
- Props becoming complex → Consider component composition
- Multiple unrelated features → Split into separate state

## Pattern 3: Context API

**Use for:** App-wide or feature-wide state (theme, auth, settings)

```typescript
// ✅ Theme context
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook for consuming context
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Usage
function Button() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button 
      className={theme === 'dark' ? 'btn-dark' : 'btn-light'}
      onClick={toggleTheme}
    >
      Toggle Theme
    </button>
  );
}
```

**Context optimization - split by update frequency:**

```typescript
// ❌ Don't put everything in one context
interface AppContextType {
  user: User;           // Changes rarely
  theme: Theme;         // Changes occasionally  
  notifications: Msg[]; // Changes frequently
}

// ✅ Split by update frequency
const UserContext = createContext<User>(null);
const ThemeContext = createContext<Theme>('light');
const NotificationsContext = createContext<Msg[]>([]);
```

**Avoid context for:**
- Frequently updating values (causes all consumers to re-render)
- Simple prop passing (2 levels deep is fine)
- Component-specific state

## Pattern 4: Zustand (Recommended for Global State)

**Use for:** Multi-feature apps, complex state, need for middleware

```typescript
// ✅ Simple store
import { create } from 'zustand';

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  total: number;
}

const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),
  
  get total() {
    return get().items.reduce((sum, item) => sum + item.price, 0);
  }
}));

// Usage - component only re-renders when selected values change
function Cart() {
  const items = useCartStore(state => state.items);
  const addItem = useCartStore(state => state.addItem);
  const total = useCartStore(state => state.total);
  
  return (
    <div>
      <h2>Total: ${total}</h2>
      <CartItemList items={items} />
      <button onClick={() => addItem(newItem)}>Add Item</button>
    </div>
  );
}
```

**Zustand with slices (for large apps):**

```typescript
// Split store into feature slices
const createAuthSlice = (set) => ({
  user: null,
  login: async (credentials) => {
    const user = await api.login(credentials);
    set({ user });
  },
  logout: () => set({ user: null })
});

const createCartSlice = (set) => ({
  items: [],
  addItem: (item) => set((state) => ({ 
    items: [...state.items, item] 
  }))
});

const useStore = create((set, get) => ({
  ...createAuthSlice(set, get),
  ...createCartSlice(set, get)
}));
```

## Pattern 5: TanStack Query (Server State)

**Use for:** API data, caching, background updates, mutations

```typescript
// ✅ Data fetching
function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 min
  });
  
  if (isLoading) return <Spinner />;
  if (error) return <Error error={error} retry={refetch} />;
  
  return <div>{data.name}</div>;
}

// ✅ Mutations
function UpdateProfile() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (data: UserData) => updateUser(data),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutation.mutate(formData);
    }}>
      {/* form fields */}
      <button disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

**Don't use TanStack Query for:**
- Local UI state
- Form state (use local state or React Hook Form)
- Non-server data

## Pattern 6: React Hook Form

**Use for:** Forms with 5+ fields, complex validation, performance-critical forms

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ✅ Form with validation
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().min(18),
});

type FormData = z.infer<typeof schema>;

function SignupForm() {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  
  const onSubmit = async (data: FormData) => {
    await api.signup(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      
      <input type="number" {...register('age', { valueAsNumber: true })} />
      {errors.age && <span>{errors.age.message}</span>}
      
      <button disabled={isSubmitting}>Submit</button>
    </form>
  );
}
```

## Pattern 7: URL State (React Router)

**Use for:** Filters, search, pagination, tabs - anything shareable via URL

```typescript
import { useSearchParams } from 'react-router-dom';

// ✅ URL-based filters
function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  
  const updateFilter = (key: string, value: string) => {
    setSearchParams(params => {
      params.set(key, value);
      return params;
    });
  };
  
  return (
    <div>
      <select 
        value={category}
        onChange={(e) => updateFilter('category', e.target.value)}
      >
        <option value="all">All</option>
        <option value="electronics">Electronics</option>
      </select>
      
      <ProductGrid category={category} sort={sort} />
    </div>
  );
}
```

## Anti-Patterns

❌ **Storing derived values in state:**
```typescript
// Wrong
const [total, setTotal] = useState(0);
useEffect(() => {
  setTotal(items.reduce((sum, item) => sum + item.price, 0));
}, [items]);

// Correct - calculate in render
const total = items.reduce((sum, item) => sum + item.price, 0);
```

❌ **Using Context for frequently changing values:**
```typescript
// Wrong - causes all consumers to re-render on every change
const NotificationContext = createContext(notifications);

// Better - use Zustand or component state + props
const useNotifications = create(set => ({
  notifications: [],
  add: (n) => set(state => ({ notifications: [...state.notifications, n] }))
}));
```

❌ **Multiple useState for related values:**
```typescript
// Wrong
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [age, setAge] = useState(0);

// Better - use single state object
const [form, setForm] = useState({ name: '', email: '', age: 0 });
```

## Decision Checklist

Before adding state management, ask:

1. **Can I derive this value?** → Don't store it, calculate it
2. **Is this only used here?** → `useState`
3. **Shared by 2-3 components?** → Lift state
4. **App-wide, changes rarely?** → Context
5. **Complex features, need middleware?** → Zustand
6. **Server data?** → TanStack Query
7. **Complex form?** → React Hook Form
8. **Need to share via URL?** → `useSearchParams`

**Start simple, add complexity only when needed.**