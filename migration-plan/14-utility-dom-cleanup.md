# Phase 14: Utility DOM Cleanup

## Objective

Convert remaining utility functions that use DOM APIs (`createElement`, `querySelector`) to React patterns or pure functions.

## Current State

### clipboard.ts (lines 13-40)
```typescript
// Fallback clipboard copy using textarea element
const textArea = document.createElement('textarea');
textArea.value = text;
// ... style manipulation, appendChild, execCommand, removeChild
```

### duration-tracker.ts (lines 22-28)
```typescript
const container = document.querySelector(containerSelector);
// ... querySelectorAll, forEach, textContent manipulation
```

### formatting.ts (line 90)
```typescript
const div = document.createElement('div');
div.textContent = unsafe;
return div.innerHTML; // HTML escape
```

### ServiceCard.tsx (lines 373-375)
```typescript
parent.classList.add('services-grid--list');
// or
parent.classList.remove('services-grid--list');
```

### TeamCard.tsx (lines 171-183)
```typescript
const container = document.getElementById('teams-grid');
container.classList.add('teams-grid--list');
// ...
```

## Target State

All DOM operations replaced with:
1. **React state** for class management
2. **Pure functions** for data transformation
3. **Modern APIs** for clipboard

## Implementation Steps

### Step 1: Modernize Clipboard Utility

**Before:**
```typescript
export function copyToClipboard(text: string): Promise<boolean> {
  // Try modern API first
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }

  // Fallback using DOM manipulation
  const textArea = document.createElement('textarea');
  // ...
}
```

**After:**
```typescript
export async function copyToClipboard(text: string): Promise<boolean> {
  // Modern Clipboard API (works in all modern browsers)
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      console.warn('Clipboard API failed');
      return false;
    }
  }

  // Clipboard API is supported in all modern browsers
  // No fallback needed for 2024+ targets
  console.warn('Clipboard API not available');
  return false;
}
```

If fallback is required for older browsers, extract to a separate function and document:
```typescript
// LEGACY: Only for browsers without Clipboard API
function legacyClipboardCopy(text: string): boolean {
  // Keep the DOM manipulation here, clearly marked as legacy
}
```

### Step 2: Refactor Duration Tracker

**Current usage:**
```typescript
// Updates duration displays in cards
startLiveDurationUpdates('.services-grid');
```

**Option A: React hook**
```typescript
// hooks/useLiveDuration.ts
export function useLiveDuration(startTime: string | null) {
  const [duration, setDuration] = useState('');

  useEffect(() => {
    if (!startTime) return;

    const updateDuration = () => {
      setDuration(formatDuration(new Date(startTime)));
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return duration;
}

// In ServiceCard
function ServiceCard({ service }) {
  const liveDuration = useLiveDuration(service.workflow_started_at);
  return <span className="duration">{liveDuration}</span>;
}
```

**Option B: Centralized timer with Zustand**
```typescript
// In store
interface DurationState {
  tick: number;
  startDurationUpdates: () => () => void;
}

// In store creation
startDurationUpdates: () => {
  const interval = setInterval(() => {
    set(state => ({ tick: state.tick + 1 }));
  }, 1000);
  return () => clearInterval(interval);
},

// Components re-render on tick change and compute duration
const tick = useAppStore(state => state.tick);
const duration = useMemo(() => formatDuration(startTime), [startTime, tick]);
```

### Step 3: Simplify HTML Escape Function

**Before:**
```typescript
export function escapeHtml(unsafe: string): string {
  const div = document.createElement('div');
  div.textContent = unsafe;
  return div.innerHTML;
}
```

**After:**
```typescript
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

Or use a well-tested library:
```typescript
import { escape } from 'lodash-es';
// or
import escapeHtml from 'escape-html';
```

### Step 4: Refactor Grid List Mode

**Current (ServiceCard.tsx):**
```typescript
useLayoutEffect(() => {
  const parent = serviceCardRef.current?.parentElement;
  if (parent) {
    if (viewMode === 'list') {
      parent.classList.add('services-grid--list');
    } else {
      parent.classList.remove('services-grid--list');
    }
  }
}, [viewMode]);
```

**After: Lift to parent component**
```typescript
// ServicesView.tsx or ServiceGridContainer.tsx
function ServiceGridContainer() {
  const viewMode = useAppStore(state => state.viewMode);

  return (
    <div className={cn('services-grid', viewMode === 'list' && 'services-grid--list')}>
      {services.map(service => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}
```

ServiceCard no longer needs to manipulate parent classes.

### Step 5: Refactor TeamCard Grid Mode

Same pattern as Step 4:

```typescript
// TeamGridContainer.tsx
function TeamGridContainer() {
  const viewMode = useAppStore(state => state.teams.viewMode);

  return (
    <div className={cn('teams-grid', viewMode === 'list' && 'teams-grid--list')}>
      {teams.map(team => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}
```

### Step 6: Remove Unnecessary DOM Utilities

After migration, some utility files may be empty or nearly empty. Clean them up:

- `utils/duration-tracker.ts` - Delete if fully migrated to hook
- Keep `utils/clipboard.ts` but simplify
- Keep `utils/formatting.ts` but use pure functions

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useLiveDuration.ts` | Live duration updates hook |

## Files to Modify

| File | Changes |
|------|---------|
| `src/utils/clipboard.ts` | Remove DOM fallback or mark as legacy |
| `src/utils/formatting.ts` | Use pure escapeHtml function |
| `src/components/features/ServiceCard.tsx` | Remove classList manipulation |
| `src/components/features/TeamCard.tsx` | Remove classList manipulation |
| `src/components/containers/ServiceGridContainer.tsx` | Add viewMode class |
| `src/components/containers/TeamGridContainer.tsx` | Add viewMode class |

## Files to Delete

| File | Reason |
|------|--------|
| `src/utils/duration-tracker.ts` | Replaced by useLiveDuration hook |

## Verification

1. Run build: `npm run build`
2. Grep for remaining DOM APIs:
   ```bash
   grep -r "document\.\|\.classList\." docs/src/utils/
   # Should return nothing (or only clearly marked legacy code)
   ```
3. Run tests: `npx playwright test`
4. Manual test:
   - Copy badge code - clipboard works
   - Live duration updates - timer works
   - Switch grid/list view - styling updates

## Estimated Changes

- **Files created**: 1
- **Files deleted**: 1
- **Files modified**: 5-6
- **Lines removed**: ~80
- **Lines added**: ~50

## Success Criteria

- [ ] Zero `document.createElement` in utilities (except legacy clipboard)
- [ ] Zero `document.querySelector` in utilities
- [ ] Zero `.classList` in ServiceCard and TeamCard
- [ ] Live duration works via React hook
- [ ] Grid/list mode toggle works via CSS classes on container
- [ ] All E2E tests pass

## Notes

### Browser Support Consideration

The Clipboard API is supported in:
- Chrome 66+ (2018)
- Firefox 63+ (2018)
- Safari 13.1+ (2020)
- Edge 79+ (2020)

If you need to support older browsers, keep the DOM fallback but isolate it clearly.

### Duration Tracker Performance

The hook-based approach means each card has its own interval. For many cards, consider:
1. A single global interval in Zustand
2. Update a `tick` counter in store
3. Cards compute duration from tick + start time

This reduces the number of intervals from N (cards) to 1.

## Rollback

If issues arise:
1. Restore DOM-based utilities
2. Restore classList manipulation in cards
3. Keep duration-tracker.ts
