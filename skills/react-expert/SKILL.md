---
name: react-agent
description: Pragmatic React development focused on avoiding over-engineering, effective state management, and render optimization. Use when building React components or features where you need clear guidance on (1) choosing appropriate state management solutions, (2) optimizing component rendering and performance, (3) avoiding common over-engineering patterns, (4) implementing TypeScript with React, or (5) making architectural decisions that balance simplicity with scalability.
---

# React Agent

Pragmatic React development that prioritizes simplicity, maintainable state management, and optimal rendering performance.

## Core Principles

### 1. Start Simple, Add Complexity Only When Needed

**Default approach:**
- Use local state (`useState`) first
- Lift state up when components need to share
- Add Context only when prop drilling becomes painful (>3 levels)
- Consider external state management (Zustand/Redux) only for truly global state

**Red flags of over-engineering:**
- Creating abstractions before they're needed
- Adding state management libraries for 2-3 shared values
- Implementing complex patterns for simple forms
- Premature optimization without measuring

### 2. State Management Decision Tree

Follow this decision tree when choosing state solutions:

```
Is this state used in only one component?
├─ YES → useState
└─ NO → Is it shared by 2-3 closely related components?
    ├─ YES → Lift state to nearest common parent
    └─ NO → Does it need to be accessed across distant components?
        ├─ YES → Is it truly global (auth, theme, i18n)?
        │   ├─ YES → Context API or Zustand
        │   └─ NO → Still use props/composition when possible
        └─ NO → Re-evaluate component structure
```

**Quick reference:**
- **1 component** → `useState`
- **2-3 related** → Lift state + props
- **Many components (same branch)** → Context API
- **App-wide global** → Zustand (recommended) or Redux Toolkit
- **Server data** → TanStack Query or SWR

### 3. Rendering Optimization Rules

**Only optimize when:**
1. Profiler shows actual performance issue
2. Component re-renders are visibly slow
3. Working with large lists (>100 items)
4. Expensive computations are occurring

**Optimization toolkit:**
- `React.memo` - for expensive components that receive same props
- `useMemo` - for expensive calculations
- `useCallback` - when passing callbacks to memoized children
- `useTransition` - for non-urgent updates (React 18+)

**Don't optimize prematurely:**
- Avoid wrapping everything in `memo` by default
- Don't use `useMemo` for simple calculations
- Don't optimize before measuring

## Quick Start Workflow

### 1. Analyze Requirements
```typescript
// Ask yourself:
// - What data do I need? (local vs shared)
// - How many components need this data?
// - Is this data from server or client?
// - Are there performance concerns?
```

### 2. Choose State Pattern

See `references/state-patterns.md` for detailed patterns and examples.

**Local State Example:**
```typescript
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**Lifted State Example:**
```typescript
function Parent() {
  const [items, setItems] = useState([]);
  return (
    <>
      <ItemList items={items} />
      <ItemForm onAdd={(item) => setItems([...items, item])} />
    </>
  );
}
```

### 3. Implement with TypeScript

```typescript
// Always type props and state
interface Props {
  userId: string;
  onUpdate: (data: UserData) => void;
}

function UserProfile({ userId, onUpdate }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  // implementation
}
```

### 4. Add Optimization (Only If Needed)

```typescript
// Measure first with React DevTools Profiler
// Then optimize specific bottlenecks

const MemoizedList = memo(ExpensiveList);

const handleClick = useCallback(() => {
  // Only when passing to memoized children
}, [dependencies]);

const expensiveValue = useMemo(() => {
  // Only for truly expensive calculations
  return heavyComputation(data);
}, [data]);
```

## Common Patterns

### Pattern 1: Form Handling

**Simple form (controlled):**
```typescript
function SimpleForm() {
  const [email, setEmail] = useState('');
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // handle submission
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </form>
  );
}
```

**Complex form:** Use React Hook Form or Formik (only for 5+ fields)

### Pattern 2: Data Fetching

```typescript
// Prefer TanStack Query for server state
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });
  
  if (isLoading) return <Spinner />;
  if (error) return <Error error={error} />;
  return <div>{data.name}</div>;
}
```

### Pattern 3: Conditional Rendering

```typescript
// Simple ternary
{isLoading ? <Spinner /> : <Content />}

// Multiple conditions - extract to variable
const content = (() => {
  if (isLoading) return <Spinner />;
  if (error) return <Error />;
  if (!data) return <Empty />;
  return <Content data={data} />;
})();
```

## Performance Checklist

Before optimizing, verify with React DevTools Profiler:
1. Identify which components re-render
2. Measure render time
3. Check why re-renders happen (props/state/context)

**Quick wins:**
- Extract expensive operations outside component
- Use proper key props for lists (not index unless static)
- Split large components into smaller ones
- Use Code Splitting for large bundles (`React.lazy`)

**For lists:**
```typescript
// Virtualization for 100+ items
import { useVirtualizer } from '@tanstack/react-virtual';

// Key requirement: stable, unique IDs
{items.map(item => (
  <Item key={item.id} {...item} />
))}
```

## Anti-Patterns to Avoid

❌ **Over-abstraction:**
```typescript
// Don't create generic wrappers unnecessarily
<GenericForm config={complexConfig} />
```

❌ **Premature memoization:**
```typescript
// Don't wrap everything by default
export default memo(SimpleButton); // unnecessary
```

❌ **Prop drilling Context:**
```typescript
// Don't use Context just to avoid 2 levels of props
<Context.Provider value={simpleValue}>
```

❌ **Mutations:**
```typescript
// Never mutate state
items.push(newItem); // Wrong
setItems([...items, newItem]); // Correct
```

## References

Load these references for deeper guidance:

- **State Management** → `references/state-patterns.md` - Detailed patterns with examples
- **Performance** → `references/performance-guide.md` - Optimization techniques and profiling
- **TypeScript** → `references/typescript-patterns.md` - Type patterns and utilities
- **Hooks** → `references/hooks-guide.md` - Custom hooks and patterns
- **Testing** → `references/testing-guide.md` - Testing with React Testing Library

## Key Constraints

**MUST DO:**
- Type all props and state with TypeScript
- Use stable keys for lists (not array index for dynamic lists)
- Clean up effects (return cleanup function)
- Handle loading and error states
- Validate before optimizing (use Profiler)

**MUST NOT:**
- Mutate state or props
- Use index as key for dynamic lists
- Create functions inside JSX
- Forget useEffect cleanup (memory leaks)
- Over-engineer simple solutions
- Optimize without measuring