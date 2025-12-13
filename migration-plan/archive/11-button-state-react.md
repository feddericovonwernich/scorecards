# Phase 11: Button State React Migration

## Objective

Replace all vanilla JavaScript button state management (`innerHTML`, `classList`, `disabled`) with React state and components.

## Current State

### workflow-triggers.ts (lines 29-81)
```typescript
function setButtonLoading(button: HTMLButtonElement, title = 'Triggering...'): void {
  button.disabled = true;
  button.dataset.originalHtml = button.innerHTML;
  button.innerHTML = SPINNING_REFRESH_ICON;
  button.title = title;
}

async function setButtonSuccess(button: HTMLButtonElement, ...): Promise<void> {
  button.innerHTML = CHECKMARK_ICON;
  button.style.backgroundColor = '#10b981';
  button.classList.add('success');
  // ... timeout and reset
}

async function setButtonError(button: HTMLButtonElement, ...): Promise<void> {
  button.innerHTML = X_ICON;
  button.classList.add('error');
  // ...
}
```

### app-init.ts (lines 158-218)
```typescript
const refreshBtn = document.getElementById('refresh-btn');
const originalText = refreshBtn.innerHTML;
refreshBtn.disabled = true;
refreshBtn.innerHTML = '<span class="spinner"></span> Refreshing...';
// ... on completion
refreshBtn.innerHTML = originalText;
```

### workflow-triggers.ts (lines 220-231)
```typescript
buttonElement.innerHTML = '⏳ PR Creating...';
const modal = document.getElementById('service-modal');
modal?.classList.add('hidden');
```

## Target State

All button states managed by React hooks and components.

### ActionButton Component (Enhanced)

```typescript
// src/components/ui/ActionButton.tsx
interface ActionButtonProps {
  onClick: () => Promise<void>;
  children: React.ReactNode;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  className?: string;
}

type ButtonState = 'idle' | 'loading' | 'success' | 'error';

export function ActionButton({
  onClick,
  children,
  loadingText = 'Loading...',
  successText = 'Success',
  errorText = 'Error',
  className,
}: ActionButtonProps) {
  const [state, setState] = useState<ButtonState>('idle');

  const handleClick = async () => {
    setState('loading');
    try {
      await onClick();
      setState('success');
      setTimeout(() => setState('idle'), 3000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };

  const content = {
    idle: children,
    loading: <><SpinnerIcon className="spinning" /> {loadingText}</>,
    success: <><CheckIcon /> {successText}</>,
    error: <><XIcon /> {errorText}</>,
  }[state];

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className={cn(className, state)}
    >
      {content}
    </button>
  );
}
```

### useButtonState Hook

```typescript
// src/hooks/useButtonState.ts
export function useButtonState() {
  const [state, setState] = useState<ButtonState>('idle');
  const [message, setMessage] = useState('');

  const setLoading = (msg?: string) => {
    setState('loading');
    setMessage(msg || '');
  };

  const setSuccess = (msg?: string) => {
    setState('success');
    setMessage(msg || '');
    setTimeout(() => setState('idle'), 3000);
  };

  const setError = (msg?: string) => {
    setState('error');
    setMessage(msg || '');
    setTimeout(() => setState('idle'), 3000);
  };

  const reset = () => setState('idle');

  return { state, message, setLoading, setSuccess, setError, reset };
}
```

## Implementation Steps

### Step 1: Create/Update ActionButton Component

If it exists, update it. If not, create `docs/src/components/ui/ActionButton.tsx`.

### Step 2: Create useButtonState Hook

Create `docs/src/hooks/useButtonState.ts` for components that need more control.

### Step 3: Refactor triggerServiceWorkflow

**Before:**
```typescript
export async function triggerServiceWorkflow(
  org: string,
  repo: string,
  buttonElement: HTMLButtonElement
): Promise<boolean> {
  setButtonLoading(buttonElement);
  // ... API call
  await setButtonSuccess(buttonElement);
}
```

**After (React version):**
```typescript
// src/api/workflow-triggers-react.ts
export async function triggerServiceWorkflow(
  org: string,
  repo: string
): Promise<boolean> {
  const token = getToken();
  if (!token) {
    showToastGlobal('Please configure a GitHub PAT...', 'warning');
    return false;
  }

  // No button manipulation - just the API call
  const response = await fetch(...);

  if (response.status === 204) {
    showToastGlobal(`Workflow triggered for ${org}/${repo}`, 'success');
    return true;
  }
  // ... error handling
  return false;
}
```

**In ServiceCard component:**
```typescript
function ServiceCard({ service }) {
  const { state, setLoading, setSuccess, setError } = useButtonState();

  const handleTrigger = async () => {
    setLoading('Triggering...');
    try {
      const success = await triggerServiceWorkflow(service.org, service.repo);
      if (success) {
        setSuccess('Triggered!');
      } else {
        setError('Failed');
      }
    } catch {
      setError('Error');
    }
  };

  return (
    <button
      onClick={handleTrigger}
      disabled={state === 'loading'}
      className={cn('trigger-btn', state)}
    >
      {state === 'loading' && <SpinnerIcon className="spinning" />}
      {state === 'success' && <CheckIcon />}
      {state === 'error' && <XIcon />}
      {state === 'idle' && <RefreshIcon />}
    </button>
  );
}
```

### Step 4: Refactor refreshData

**Before (app-init.ts):**
```typescript
export async function refreshData(): Promise<void> {
  const refreshBtn = document.getElementById('refresh-btn');
  refreshBtn.innerHTML = '<span class="spinner"></span> Refreshing...';
  // ...
  refreshBtn.innerHTML = originalText;
}
```

**After:**

Create a RefreshButton component or use the ActionButton:

```typescript
// In Header or wherever refresh button lives
function RefreshButton() {
  const { state, setLoading, setSuccess, setError, reset } = useButtonState();

  const handleRefresh = async () => {
    setLoading();
    try {
      await refreshData();
      setSuccess();
    } catch {
      setError();
    }
  };

  return (
    <ActionButton
      onClick={handleRefresh}
      loadingText="Refreshing..."
      successText="Refreshed"
      errorText="Failed"
    >
      <RefreshIcon /> Refresh
    </ActionButton>
  );
}
```

Update `refreshData` to NOT manipulate DOM:

```typescript
export async function refreshData(): Promise<void> {
  // Remove all getElementById and innerHTML code
  // Just do the data refresh
  showToastGlobal('Refreshing...', 'info');
  const { services } = await loadServices();
  // ... update store
  showToastGlobal('Refreshed!', 'success');
}
```

### Step 5: Refactor installService

Same pattern - remove button manipulation, let React handle state:

**Before:**
```typescript
buttonElement.innerHTML = '⏳ PR Creating...';
const modal = document.getElementById('service-modal');
modal?.classList.add('hidden');
```

**After:**
```typescript
// Let the calling component handle button state
// Use React modal state for visibility
```

### Step 6: Remove Button State Utilities

Delete the inline button state functions from workflow-triggers.ts:
- `setButtonLoading`
- `setButtonSuccess`
- `setButtonError`
- `resetButton`

And the SVG icon constants (move to React components or icons config).

### Step 7: Update ServiceGridContainer

Update to use React button state instead of passing `buttonElement`:

```typescript
// Before
window.triggerServiceWorkflow(org, repo, buttonElement);

// After
const handleTrigger = async () => {
  setLoading();
  const success = await triggerServiceWorkflow(org, repo);
  success ? setSuccess() : setError();
};
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/ui/ActionButton.tsx` | Reusable button with state |
| `src/hooks/useButtonState.ts` | Hook for button state management |
| `src/api/workflow-triggers-react.ts` | React-friendly workflow triggers (no DOM) |

## Files to Modify

| File | Changes |
|------|---------|
| `src/api/workflow-triggers.ts` | Remove button DOM manipulation |
| `src/app-init.ts` | Remove refresh button DOM manipulation |
| `src/components/features/ServiceCard.tsx` | Use ActionButton/useButtonState |
| `src/components/layout/Header.tsx` | Use RefreshButton component |
| `src/components/features/ServiceModal/*` | Use React button state |

## Files to Delete

None - inline functions are removed, not files.

## Verification

1. Run build: `npm run build`
2. Grep for remaining button DOM manipulation:
   ```bash
   grep -r "\.innerHTML\|\.classList" docs/src/api/workflow-triggers.ts docs/src/app-init.ts
   # Should return nothing
   ```
3. Run tests: `npx playwright test`
4. Manual test:
   - Click refresh button - shows spinner, then success
   - Trigger service workflow - button shows loading state
   - Create installation PR - button shows progress
   - Error states display correctly

## Estimated Changes

- **Files created**: 2-3
- **Files modified**: 5-6
- **Lines removed**: ~80 (button manipulation code)
- **Lines added**: ~150 (React components/hooks)

## Success Criteria

- [ ] Zero `.innerHTML` in workflow-triggers.ts
- [ ] Zero `.classList` in workflow-triggers.ts
- [ ] Zero `document.getElementById` for buttons
- [ ] All button states via React hooks/components
- [ ] All E2E tests pass
- [ ] Button animations work (spinner, success, error)

## Rollback

If issues arise:
1. Restore button manipulation functions
2. Keep passing HTMLButtonElement to trigger functions
3. Revert ServiceCard to pass button element
