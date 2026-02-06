# React Testing Guide

Practical patterns for testing React components with React Testing Library and Vitest/Jest.

## Testing Philosophy

**Test from the user's perspective:**
- Test what the user sees and does
- Avoid testing implementation details
- Focus on behavior, not internals

**Priority:**
1. User interactions and flows
2. Rendering with different props/state
3. Edge cases and error states
4. Integration tests over unit tests

## Setup

### Vitest + React Testing Library

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

## Basic Component Testing

### Simple Component

```typescript
// Button.tsx
interface ButtonProps {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}

function Button({ onClick, children, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Click me</Button>);
    
    const button = screen.getByText('Click me');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });
});
```

### Component with State

```typescript
// Counter.tsx
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// Counter.test.tsx
describe('Counter', () => {
  it('starts at zero', () => {
    render(<Counter />);
    
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
  
  it('increments count', () => {
    render(<Counter />);
    
    fireEvent.click(screen.getByText('Increment'));
    
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
  
  it('resets count', () => {
    render(<Counter />);
    
    fireEvent.click(screen.getByText('Increment'));
    fireEvent.click(screen.getByText('Increment'));
    fireEvent.click(screen.getByText('Reset'));
    
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});
```

## Querying Elements

### Query Priority

1. **Accessible queries (preferred):**
   - `getByRole` - Most robust
   - `getByLabelText` - For form fields
   - `getByPlaceholderText` - For inputs
   - `getByText` - For non-interactive content
   - `getByDisplayValue` - For form elements

2. **Semantic queries:**
   - `getByAltText` - For images
   - `getByTitle` - For title attribute

3. **Test IDs (last resort):**
   - `getByTestId` - When nothing else works

```typescript
// ✅ Best - use accessible queries
screen.getByRole('button', { name: 'Submit' });
screen.getByLabelText('Email');
screen.getByPlaceholderText('Enter your name');

// ⚠️ OK - semantic
screen.getByAltText('Profile picture');

// ❌ Avoid - test IDs
screen.getByTestId('submit-button');
```

### Query Variants

```typescript
// getBy* - Throws if not found
const button = screen.getByRole('button');

// queryBy* - Returns null if not found
const button = screen.queryByRole('button');
if (button) { ... }

// findBy* - Async, waits for element
const button = await screen.findByRole('button');

// *AllBy* - Returns array
const buttons = screen.getAllByRole('button');
```

## User Interactions

### userEvent vs fireEvent

```typescript
import userEvent from '@testing-library/user-event';

// ✅ Prefer userEvent (simulates real user behavior)
describe('Form', () => {
  it('handles user input', async () => {
    const user = userEvent.setup();
    render(<Form />);
    
    const input = screen.getByLabelText('Email');
    await user.type(input, 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});

// ⚠️ fireEvent is simpler but less realistic
describe('Form', () => {
  it('handles input', () => {
    render(<Form />);
    
    const input = screen.getByLabelText('Email');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### Common Interactions

```typescript
// Typing
await user.type(input, 'Hello');

// Clicking
await user.click(button);

// Double click
await user.dblClick(button);

// Select from dropdown
await user.selectOptions(select, 'option1');

// Upload file
const file = new File(['hello'], 'hello.png', { type: 'image/png' });
await user.upload(input, file);

// Keyboard
await user.keyboard('{Enter}');
await user.keyboard('{Escape}');
```

## Async Testing

### Waiting for Elements

```typescript
// ✅ Wait for element to appear
it('shows success message', async () => {
  render(<AsyncComponent />);
  
  const message = await screen.findByText('Success', {}, { timeout: 3000 });
  expect(message).toBeInTheDocument();
});

// ✅ Wait for element to disappear
it('removes loading spinner', async () => {
  render(<AsyncComponent />);
  
  await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
  
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
});

// ✅ waitFor for complex conditions
it('displays data', async () => {
  render(<DataComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  }, { timeout: 3000 });
});
```

### Mocking API Calls

```typescript
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('fetches and displays user', async () => {
    const mockUser = { id: '1', name: 'John' };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });
    
    render(<UserProfile userId="1" />);
    
    expect(await screen.findByText('John')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/users/1');
  });
  
  it('handles fetch error', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Failed'));
    
    render(<UserProfile userId="1" />);
    
    expect(await screen.findByText('Error loading user')).toBeInTheDocument();
  });
});
```

## Testing with Context

```typescript
// TestWrapper.tsx
function TestWrapper({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}

// Custom render function
function renderWithContext(ui: ReactElement) {
  return render(ui, { wrapper: TestWrapper });
}

// Usage
describe('ProtectedComponent', () => {
  it('shows content when authenticated', () => {
    renderWithContext(<ProtectedComponent />);
    
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
```

## Testing Custom Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';

// useCounter.ts
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset = () => setCount(initialValue);
  
  return { count, increment, decrement, reset };
}

// useCounter.test.ts
describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    
    expect(result.current.count).toBe(0);
  });
  
  it('increments count', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
  
  it('accepts initial value', () => {
    const { result } = renderHook(() => useCounter(10));
    
    expect(result.current.count).toBe(10);
  });
  
  it('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(5));
    
    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });
    
    expect(result.current.count).toBe(5);
  });
});

// Testing async hook
describe('useFetch', () => {
  it('fetches data successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
    });
    
    const { result } = renderHook(() => useFetch('/api/data'));
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toEqual({ data: 'test' });
    expect(result.current.error).toBeNull();
  });
});
```

## Testing Forms

```typescript
// LoginForm.tsx
function LoginForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit({ email, password });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <span role="alert">{errors.email}</span>}
      </div>
      
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <span role="alert">{errors.password}</span>}
      </div>
      
      <button type="submit">Login</button>
    </form>
  );
}

// LoginForm.test.tsx
describe('LoginForm', () => {
  it('submits valid form', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    
    render(<LoginForm onSubmit={handleSubmit} />);
    
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
  
  it('shows validation errors', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    
    render(<LoginForm onSubmit={handleSubmit} />);
    
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
  
  it('clears errors on input', async () => {
    const user = userEvent.setup();
    
    render(<LoginForm onSubmit={() => {}} />);
    
    // Trigger errors
    await user.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    
    // Type in email - error should clear
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    
    // Submit again to clear password error
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });
});
```

## Mocking Patterns

### Mock Components

```typescript
// Mock child components to test parent in isolation
vi.mock('./ExpensiveComponent', () => ({
  default: () => <div>Mocked Component</div>,
}));

describe('ParentComponent', () => {
  it('renders children', () => {
    render(<ParentComponent />);
    expect(screen.getByText('Mocked Component')).toBeInTheDocument();
  });
});
```

### Mock Modules

```typescript
// Mock external API
vi.mock('../api', () => ({
  fetchUser: vi.fn(),
  updateUser: vi.fn(),
}));

import { fetchUser } from '../api';

describe('UserProfile', () => {
  it('fetches user data', async () => {
    (fetchUser as any).mockResolvedValue({ id: '1', name: 'John' });
    
    render(<UserProfile userId="1" />);
    
    expect(await screen.findByText('John')).toBeInTheDocument();
  });
});
```

### Mock Timers

```typescript
import { vi } from 'vitest';

describe('Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  it('updates after delay', () => {
    render(<Timer />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
    
    vi.advanceTimersByTime(1000);
    
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
```

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ Testing implementation details
it('sets state correctly', () => {
  const { result } = renderHook(() => useState(0));
  act(() => result.current[1](1));
  expect(result.current[0]).toBe(1);
});

// ✅ Testing behavior
it('increments counter', () => {
  render(<Counter />);
  fireEvent.click(screen.getByText('Increment'));
  expect(screen.getByTestId('count')).toHaveTextContent('1');
});
```

### 2. Use Accessible Queries

```typescript
// ❌ Brittle - relies on class/structure
screen.getByClassName('submit-button');

// ✅ Robust - uses semantic role
screen.getByRole('button', { name: 'Submit' });
```

### 3. Avoid Snapshot Testing for Components

```typescript
// ❌ Brittle, hard to review
expect(component).toMatchSnapshot();

// ✅ Test specific behavior
expect(screen.getByText('Welcome')).toBeInTheDocument();
expect(screen.getByRole('button')).toBeEnabled();
```

### 4. Clean Up After Each Test

```typescript
// Automatically handled by cleanup()
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

### 5. Group Related Tests

```typescript
describe('LoginForm', () => {
  describe('validation', () => {
    it('validates email format', () => { ... });
    it('validates password length', () => { ... });
  });
  
  describe('submission', () => {
    it('submits valid form', () => { ... });
    it('prevents double submission', () => { ... });
  });
});
```

## Common Testing Patterns

### Loading States

```typescript
it('shows loading state', () => {
  render(<AsyncComponent />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

it('hides loading after data loads', async () => {
  render(<AsyncComponent />);
  await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});
```

### Error States

```typescript
it('displays error message', async () => {
  global.fetch = vi.fn().mockRejectedValue(new Error('Failed'));
  
  render(<Component />);
  
  expect(await screen.findByText('Error: Failed')).toBeInTheDocument();
});
```

### Empty States

```typescript
it('shows empty state when no data', () => {
  render(<List items={[]} />);
  expect(screen.getByText('No items found')).toBeInTheDocument();
});
```

### Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Test Coverage Goals

- **Statements**: 80%+
- **Branches**: 70%+
- **Functions**: 80%+
- **Lines**: 80%+

**Focus on:**
- User-facing features
- Critical business logic
- Error handling
- Edge cases

**Skip:**
- Third-party libraries
- Configuration files
- Types/interfaces
- Trivial getters/setters