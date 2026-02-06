# Performance Optimization Guide

Practical guide to measuring and optimizing React performance.

## Rule #1: Measure Before Optimizing

**Always use React DevTools Profiler before optimization:**

1. Open React DevTools → Profiler tab
2. Click Record → Perform action → Stop
3. Check:
   - Which components re-rendered?
   - How long did renders take?
   - What caused the re-renders?

**Only optimize if:**
- User experiences visible lag
- Profiler shows render time >16ms (60fps) or >50ms (noticeable)
- Component re-renders unnecessarily many times

## Optimization Toolkit

### 1. React.memo - Prevent Re-renders

**Use when:** Component is expensive and receives same props frequently

```typescript
// ✅ Memoize expensive component
const ExpensiveChart = memo(({ data }: { data: ChartData }) => {
  // Expensive rendering logic
  return <ComplexVisualization data={data} />;
});

// Component only re-renders when data reference changes
function Dashboard() {
  const [filter, setFilter] = useState('all');
  const data = useMemo(() => processData(rawData, filter), [rawData, filter]);
  
  return (
    <div>
      <FilterBar onFilterChange={setFilter} />
      <ExpensiveChart data={data} /> {/* Won't re-render when filter changes */}
    </div>
  );
}
```

**Don't use when:**
- Component is cheap to render (<1ms)
- Props change frequently anyway
- Adding memo creates more overhead than the render cost

**Custom comparison:**
```typescript
// Use when default shallow comparison isn't sufficient
const MemoizedComponent = memo(
  MyComponent,
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    return prevProps.id === nextProps.id && 
           prevProps.data.length === nextProps.data.length;
  }
);
```

### 2. useMemo - Cache Expensive Calculations

**Use when:** Calculation is expensive (>5ms) and runs on every render

```typescript
// ✅ Expensive calculation
function DataTable({ items }: { items: Item[] }) {
  // useMemo prevents recalculation on unrelated re-renders
  const sortedAndFiltered = useMemo(() => {
    return items
      .filter(item => item.active)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]); // Only recalculate when items change
  
  return <Table data={sortedAndFiltered} />;
}

// ❌ Don't use for simple calculations
function Total({ price, quantity }: Props) {
  // This is overkill - simple multiplication is fast
  const total = useMemo(() => price * quantity, [price, quantity]);
  return <div>{total}</div>;
}
```

**Examples of when to use useMemo:**
- Array operations on large datasets (>1000 items)
- Complex data transformations
- Expensive regex operations
- Creating stable object/array references for dependencies

**Don't use for:**
- Simple math operations
- String concatenation
- Object property access
- Renders that are already fast

### 3. useCallback - Stable Function References

**Use when:** Passing callbacks to memoized children

```typescript
// ✅ Correct usage - prevent child re-render
function Parent() {
  const [count, setCount] = useState(0);
  const [filter, setFilter] = useState('');
  
  // MemoizedList only re-renders when handleItemClick changes
  const handleItemClick = useCallback((id: string) => {
    console.log('Clicked', id);
  }, []); // Empty deps - function never changes
  
  return (
    <div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      <button onClick={() => setCount(count + 1)}>{count}</button>
      <MemoizedList onItemClick={handleItemClick} />
    </div>
  );
}

const MemoizedList = memo(({ onItemClick }: Props) => {
  // Expensive render
  return <ExpensiveItemList onClick={onItemClick} />;
});

// ❌ Wrong - useCallback without memo is useless
function WrongExample() {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);
  
  // UnmemoizedButton will re-render anyway
  return <UnmemoizedButton onClick={handleClick} />;
}
```

**Rule:** Only use `useCallback` if:
1. The child component is memoized
2. AND the function is passed as a prop
3. AND the child is expensive to render

### 4. Key Props - List Performance

**Critical for list rendering performance:**

```typescript
// ✅ Stable, unique ID
{items.map(item => (
  <Item key={item.id} {...item} />
))}

// ⚠️ Index is OK for static lists only
{staticItems.map((item, index) => (
  <StaticItem key={index} {...item} />
))}

// ❌ Never use index for dynamic lists
{dynamicItems.map((item, index) => (
  <DynamicItem key={index} {...item} /> // Causes re-render issues
))}

// ❌ Random keys cause re-creation
{items.map(item => (
  <Item key={Math.random()} {...item} /> // Every render is new component
))}
```

**Why stable keys matter:**
- React uses keys to track component identity
- Changing key = unmount + remount (expensive)
- Stable keys allow React to reuse DOM nodes

### 5. Code Splitting - Reduce Bundle Size

**Use React.lazy for route-based splitting:**

```typescript
import { lazy, Suspense } from 'react';

// ✅ Lazy load heavy components
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
const Analytics = lazy(() => import('./Analytics'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  );
}
```

**Named imports optimization:**
```typescript
// ❌ Imports entire library
import _ from 'lodash';

// ✅ Import only what you need
import debounce from 'lodash/debounce';
```

### 6. Virtualization - Handle Large Lists

**Use virtual scrolling for 100+ items:**

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

// ✅ Only render visible items
function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated row height
    overscan: 5, // Render extra items for smooth scrolling
  });
  
  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <Item data={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**When to virtualize:**
- Lists with 100+ items
- Each item is non-trivial to render
- Users scroll through the list

### 7. useTransition - Non-Urgent Updates (React 18+)

**Use for:** Updates that can be deferred (filtering, search)

```typescript
import { useState, useTransition } from 'react';

// ✅ Keep UI responsive during heavy updates
function SearchableList({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const [isPending, startTransition] = useTransition();
  
  const handleSearch = (value: string) => {
    setQuery(value); // Urgent: update input immediately
    
    // Non-urgent: defer expensive filtering
    startTransition(() => {
      const filtered = items.filter(item => 
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(filtered);
    });
  };
  
  return (
    <div>
      <input 
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
      />
      {isPending && <span>Filtering...</span>}
      <List items={filteredItems} />
    </div>
  );
}
```

## Common Performance Patterns

### Pattern 1: Debounce Expensive Operations

```typescript
import { useCallback, useEffect, useState } from 'react';
import debounce from 'lodash/debounce';

function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  // Debounce API call
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      const data = await api.search(searchQuery);
      setResults(data);
    }, 300),
    []
  );
  
  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    }
  }, [query, debouncedSearch]);
  
  return (
    <div>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ResultList results={results} />
    </div>
  );
}
```

### Pattern 2: Separate Fast and Slow Components

```typescript
// ✅ Isolate fast-changing state
function FastCounter() {
  const [count, setCount] = useState(0);
  // Fast updates don't affect ExpensiveComponent
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <ExpensiveComponent />
    </div>
  );
}

// ❌ Don't mix fast and slow state
function SlowCounter() {
  const [count, setCount] = useState(0);
  const [data, setData] = useState(heavyData);
  
  // Every count update re-renders heavyData
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <ExpensiveChart data={data} />
    </div>
  );
}
```

### Pattern 3: Component Composition Over Props

```typescript
// ✅ Use composition to avoid re-renders
function Layout({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      {children} {/* children don't re-render when count changes */}
    </div>
  );
}

// Usage
<Layout>
  <ExpensiveComponent /> {/* Won't re-render */}
</Layout>

// ❌ Props-based approach causes re-render
function LayoutWithProps({ content }: { content: ReactNode }) {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      {content} {/* Will re-render */}
    </div>
  );
}
```

## Performance Checklist

### Before Optimization
- [ ] Measured with React DevTools Profiler
- [ ] Identified specific slow components
- [ ] Confirmed user-visible performance issue
- [ ] Checked why components re-render (props/state/context)

### Quick Wins
- [ ] Used proper key props (stable, unique)
- [ ] Avoided creating functions/objects in render
- [ ] Extracted expensive operations outside component
- [ ] Split large components into smaller ones

### If Still Slow
- [ ] Applied `memo` to expensive components
- [ ] Used `useMemo` for expensive calculations
- [ ] Used `useCallback` for callbacks to memoized children
- [ ] Considered virtualization for long lists (100+)
- [ ] Implemented code splitting for large bundles

### For Large Lists
- [ ] Using stable, unique keys
- [ ] Considered virtualization (react-virtual)
- [ ] Avoided inline styles/functions
- [ ] Used `memo` for list items

### Advanced
- [ ] Used `useTransition` for non-urgent updates
- [ ] Implemented debouncing for expensive operations
- [ ] Used web workers for CPU-intensive tasks
- [ ] Optimized images (lazy loading, proper sizes)

## Anti-Patterns

❌ **Memoizing everything:**
```typescript
// Overkill - creates more overhead
const MemoButton = memo(({ onClick }: Props) => (
  <button onClick={onClick}>Click</button>
));
```

❌ **useMemo for simple operations:**
```typescript
// Unnecessary - math is fast
const double = useMemo(() => count * 2, [count]);
```

❌ **Creating functions in render:**
```typescript
// ❌ New function every render
<button onClick={() => handleClick(item.id)}>Click</button>

// ✅ Better - use callback
const handleClick = (id: string) => console.log(id);
<button onClick={() => handleClick(item.id)}>Click</button>

// ✅ Best for list items - use data attributes
<button data-id={item.id} onClick={handleClick}>Click</button>
```

❌ **Inline object/array props:**
```typescript
// ❌ New object every render
<Component style={{ margin: 10 }} items={[1, 2, 3]} />

// ✅ Define outside render
const style = { margin: 10 };
const items = [1, 2, 3];
<Component style={style} items={items} />
```

## Debugging Performance Issues

### 1. Use React DevTools Profiler
- Flame graph shows component hierarchy and render times
- Ranked view shows slowest components
- Look for "Committed at" times >16ms

### 2. Check Why Components Render
```typescript
// Add this hook to debug re-renders
function useWhyDidYouUpdate(name: string, props: any) {
  const previousProps = useRef<any>();
  
  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: any = {};
      
      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key]
          };
        }
      });
      
      if (Object.keys(changedProps).length > 0) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }
    
    previousProps.current = props;
  });
}

// Usage
function MyComponent(props: Props) {
  useWhyDidYouUpdate('MyComponent', props);
  // component logic
}
```

### 3. Measure Render Time
```typescript
function MeasuredComponent() {
  useEffect(() => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`Render took ${end - start}ms`);
    };
  });
  
  return <div>Content</div>;
}
```

## Performance Budget

Target metrics for production:
- **Initial load**: <3 seconds
- **Time to Interactive**: <5 seconds
- **Component render**: <16ms (60fps)
- **List scrolling**: Smooth at 60fps
- **User interactions**: Response <100ms

**Remember:** Only optimize what matters. User-perceived performance > micro-optimizations.