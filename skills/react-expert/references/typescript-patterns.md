# TypeScript Patterns for React

Practical TypeScript patterns for React development.

## Component Props Typing

### Basic Props

```typescript
// ✅ Interface for props
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean; // Optional
  variant?: 'primary' | 'secondary'; // Union type
}

function Button({ label, onClick, disabled = false, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} className={variant}>
      {label}
    </button>
  );
}

// ✅ Type for simple props
type IconProps = {
  name: string;
  size: number;
  color?: string;
};
```

### Props with Children

```typescript
// ✅ ReactNode for any valid React content
interface CardProps {
  title: string;
  children: ReactNode;
}

function Card({ title, children }: CardProps) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

// ✅ Specific child type
interface ListProps {
  children: ReactElement<ItemProps> | ReactElement<ItemProps>[];
}

// ✅ Using PropsWithChildren helper
type ContainerProps = PropsWithChildren<{
  className?: string;
}>;
```

### Event Handlers

```typescript
// ✅ Common event types
interface FormProps {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  onFocus: (e: FocusEvent<HTMLInputElement>) => void;
}

// ✅ Async handlers
interface AsyncButtonProps {
  onClick: () => Promise<void>;
}

function AsyncButton({ onClick }: AsyncButtonProps) {
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    try {
      await onClick();
    } finally {
      setLoading(false);
    }
  };
  
  return <button onClick={handleClick} disabled={loading}>Click</button>;
}
```

### Generic Props

```typescript
// ✅ Generic component
interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string;
}

function Select<T>({ options, value, onChange, getLabel, getValue }: SelectProps<T>) {
  return (
    <select 
      value={getValue(value)}
      onChange={(e) => {
        const option = options.find(o => getValue(o) === e.target.value);
        if (option) onChange(option);
      }}
    >
      {options.map(option => (
        <option key={getValue(option)} value={getValue(option)}>
          {getLabel(option)}
        </option>
      ))}
    </select>
  );
}

// Usage
interface User {
  id: string;
  name: string;
}

<Select<User>
  options={users}
  value={selectedUser}
  onChange={setSelectedUser}
  getLabel={(u) => u.name}
  getValue={(u) => u.id}
/>
```

## State Typing

### useState

```typescript
// ✅ Type inference (preferred)
const [count, setCount] = useState(0); // number
const [name, setName] = useState(''); // string
const [isOpen, setIsOpen] = useState(false); // boolean

// ✅ Explicit typing for complex types
interface User {
  id: string;
  name: string;
  email: string;
}

const [user, setUser] = useState<User | null>(null);

// ✅ Union types
type Status = 'idle' | 'loading' | 'success' | 'error';
const [status, setStatus] = useState<Status>('idle');

// ✅ Array state
const [items, setItems] = useState<Item[]>([]);

// ✅ Object state
interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const [form, setForm] = useState<FormData>({
  email: '',
  password: '',
  rememberMe: false,
});
```

### useReducer

```typescript
// ✅ Typed reducer
interface State {
  count: number;
  error: string | null;
}

type Action =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'DECREMENT':
      return { ...state, count: state.count - 1 };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return { count: 0, error: null };
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, error: null });
  
  return (
    <div>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
      <span>{state.count}</span>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
    </div>
  );
}
```

### useContext

```typescript
// ✅ Typed context
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (email: string, password: string) => {
    const user = await api.login(email, password);
    setUser(user);
  };
  
  const logout = () => setUser(null);
  
  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

## Hooks Typing

### useRef

```typescript
// ✅ DOM element ref
function Input() {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    inputRef.current?.focus(); // Use optional chaining
  }, []);
  
  return <input ref={inputRef} />;
}

// ✅ Mutable value ref
function Timer() {
  const intervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      console.log('tick');
    }, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  return <div>Timer</div>;
}
```

### Custom Hooks

```typescript
// ✅ Typed custom hook with return type
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
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

// ✅ Hook with object return
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(url);
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [url]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch: fetchData };
}
```

## Component Patterns

### Discriminated Unions

```typescript
// ✅ Type-safe variants
type ButtonProps = 
  | { variant: 'link'; href: string; onClick?: never }
  | { variant: 'button'; onClick: () => void; href?: never };

function Button(props: ButtonProps) {
  if (props.variant === 'link') {
    return <a href={props.href}>Link</a>;
  }
  return <button onClick={props.onClick}>Button</button>;
}

// Usage - TypeScript enforces correct props
<Button variant="link" href="/home" /> // ✓
<Button variant="button" onClick={handleClick} /> // ✓
<Button variant="link" onClick={handleClick} /> // ✗ Error
```

### Render Props

```typescript
// ✅ Typed render prop
interface DataLoaderProps<T> {
  url: string;
  render: (data: T, loading: boolean, error: Error | null) => ReactNode;
}

function DataLoader<T>({ url, render }: DataLoaderProps<T>) {
  const { data, loading, error } = useFetch<T>(url);
  return <>{render(data, loading, error)}</>;
}

// Usage
<DataLoader<User>
  url="/api/user"
  render={(user, loading, error) => {
    if (loading) return <Spinner />;
    if (error) return <Error error={error} />;
    return <div>{user?.name}</div>;
  }}
/>
```

### Compound Components

```typescript
// ✅ Typed compound components
interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Must be used within Tabs');
  return context;
}

interface TabsProps extends PropsWithChildren {
  defaultTab: string;
}

function Tabs({ children, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

interface TabProps extends PropsWithChildren {
  value: string;
}

Tabs.Tab = function Tab({ value, children }: TabProps) {
  const { activeTab, setActiveTab } = useTabs();
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={activeTab === value ? 'active' : ''}
    >
      {children}
    </button>
  );
};

Tabs.Panel = function Panel({ value, children }: TabProps) {
  const { activeTab } = useTabs();
  return activeTab === value ? <div>{children}</div> : null;
};

// Usage
<Tabs defaultTab="home">
  <Tabs.Tab value="home">Home</Tabs.Tab>
  <Tabs.Tab value="profile">Profile</Tabs.Tab>
  
  <Tabs.Panel value="home">Home content</Tabs.Panel>
  <Tabs.Panel value="profile">Profile content</Tabs.Panel>
</Tabs>
```

## Utility Types

### Useful React Types

```typescript
// Component props
type ButtonElement = ComponentPropsWithoutRef<'button'>;
type DivElement = ComponentPropsWithRef<'div'>;

// Extending HTML element props
interface CustomButtonProps extends ButtonElement {
  variant: 'primary' | 'secondary';
}

// Extract props from component
type InputProps = ComponentProps<typeof Input>;

// Element type
type ElementType = ReactElement<any, any>;
```

### Custom Utility Types

```typescript
// ✅ Make all properties optional except specified ones
type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

// id is required, rest are optional
type UserUpdate = PartialExcept<User, 'id'>;

// ✅ Make specific properties required
type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

type UserWithEmail = RequireFields<Partial<User>, 'email'>;

// ✅ Omit multiple properties
type OmitMultiple<T, K extends keyof T> = Omit<T, K>;

type UserWithoutSensitiveData = OmitMultiple<User, 'email' | 'age'>;
```

## Type Guards

```typescript
// ✅ Type guard function
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}

// Usage
if (isUser(data)) {
  console.log(data.name); // TypeScript knows data is User
}

// ✅ Discriminated union guard
type Response = 
  | { status: 'success'; data: User }
  | { status: 'error'; error: string };

function handleResponse(response: Response) {
  if (response.status === 'success') {
    console.log(response.data); // TypeScript knows this is success case
  } else {
    console.log(response.error); // TypeScript knows this is error case
  }
}
```

## Typing Patterns

### API Response Typing

```typescript
// ✅ Generic API response wrapper
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Usage
async function fetchUsers(): Promise<ApiResponse<PaginatedResponse<User>>> {
  const response = await fetch('/api/users');
  return response.json();
}
```

### Form Typing

```typescript
// ✅ Form data from schema
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean(),
});

// Infer TypeScript type from schema
type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const [form, setForm] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse(form);
    if (result.success) {
      // form is validated
      console.log(result.data);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Best Practices

1. **Use interfaces for public APIs, types for internal use**
   ```typescript
   // Public component props
   interface Props { ... }
   
   // Internal types
   type Status = 'idle' | 'loading';
   ```

2. **Prefer inference over explicit typing**
   ```typescript
   // ✓ Let TypeScript infer
   const [count, setCount] = useState(0);
   
   // ✗ Unnecessary
   const [count, setCount] = useState<number>(0);
   ```

3. **Use strict mode**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitReturns": true
     }
   }
   ```

4. **Avoid `any`, use `unknown` instead**
   ```typescript
   // ✗ Don't use any
   function process(data: any) { ... }
   
   // ✓ Use unknown and type guard
   function process(data: unknown) {
     if (isValidData(data)) {
       // Now TypeScript knows the type
     }
   }
   ```

5. **Use const assertions for literal types**
   ```typescript
   // ✓ Literal type
   const colors = ['red', 'blue', 'green'] as const;
   type Color = typeof colors[number]; // 'red' | 'blue' | 'green'
   ```