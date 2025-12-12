# Phase 11: ActionsWidget Migration

## Objective

Migrate the ActionsWidget (running workflows panel) from HTML onclick handlers to a React component.

## Current State

In `docs/index.html` lines 103-128, the ActionsWidget has 6 onclick handlers:

```html
<button onclick="refreshActionsWidget()">Refresh</button>
<button onclick="toggleActionsWidget()">×</button>
<button onclick="filterActions('all')">All</button>
<button onclick="filterActions('in_progress')">Running</button>
<button onclick="filterActions('queued')">Queued</button>
<button onclick="filterActions('completed')">Done</button>
```

These functions are defined in vanilla JS files.

## Implementation Steps

### Step 1: Create ActionsWidget Component

Create `docs/src/components/features/ActionsWidget/ActionsWidget.tsx`:

```typescript
/**
 * ActionsWidget Component
 * Shows running/queued/completed GitHub Actions workflows
 */

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../../stores/appStore';

type FilterStatus = 'all' | 'in_progress' | 'queued' | 'completed';

export function ActionsWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get workflow runs from store or fetch them
  const workflowRuns = useAppStore((state) => state.workflowRuns);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Fetch workflow runs via API
      await window.ScorecardModules?.github?.fetchWorkflowRuns?.();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleFilterChange = useCallback((status: FilterStatus) => {
    setFilter(status);
  }, []);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // ... render logic
}
```

### Step 2: Add Workflow Runs to Zustand Store

In `docs/src/stores/appStore.ts`, add workflow runs state if not present:

```typescript
interface AppState {
  // ... existing state
  workflowRuns: WorkflowRun[];
  setWorkflowRuns: (runs: WorkflowRun[]) => void;
}
```

### Step 3: Create Index File

Create `docs/src/components/features/ActionsWidget/index.ts`:

```typescript
export { ActionsWidget } from './ActionsWidget.js';
```

### Step 4: Mount ActionsWidget in React

In `docs/src/components/index.tsx`, add portal for ActionsWidget:

```typescript
// Mount ActionsWidget
const actionsWidgetContainer = document.getElementById('actions-widget');
if (actionsWidgetContainer) {
  const actionsWidgetRoot = ReactDOM.createRoot(actionsWidgetContainer);
  actionsWidgetRoot.render(
    <StrictMode>
      <ActionsWidget />
    </StrictMode>
  );
  window.__REACT_MANAGES_ACTIONS_WIDGET = true;
}
```

### Step 5: Update HTML

In `docs/index.html`, remove onclick handlers and simplify the container:

**Before:**
```html
<div id="actions-widget" class="actions-widget hidden">
  <div class="widget-header">
    <span>Running Workflows</span>
    <button onclick="refreshActionsWidget()">Refresh</button>
    <button onclick="toggleActionsWidget()">×</button>
  </div>
  <!-- ... more onclick handlers -->
</div>
```

**After:**
```html
<div id="actions-widget" class="actions-widget hidden">
  <!-- React will render content here -->
</div>
```

### Step 6: Add Toggle Trigger

The widget is toggled from elsewhere (likely a button in the header). Update that trigger to use React state or a global event.

Option A - Window event:
```typescript
// In ActionsWidget
useEffect(() => {
  const handleToggle = () => setIsOpen(prev => !prev);
  window.addEventListener('toggle-actions-widget', handleToggle);
  return () => window.removeEventListener('toggle-actions-widget', handleToggle);
}, []);

// To trigger from anywhere:
window.dispatchEvent(new CustomEvent('toggle-actions-widget'));
```

Option B - Zustand store:
```typescript
// Add to store
actionsWidgetOpen: boolean;
toggleActionsWidget: () => void;
```

### Step 7: Remove Vanilla JS Functions

Remove the following from wherever they're defined:
- `toggleActionsWidget()`
- `refreshActionsWidget()`
- `filterActions(status)`
- `renderActionsWidget()`
- `updateActionsContent()`

## Verification

1. Run build: `npm run build`
2. Run linting: `npm run lint`
3. Run tests: `npx playwright test`
4. Manual test:
   - Open ActionsWidget
   - Click filter buttons
   - Click refresh
   - Verify workflows display correctly

## Estimated Changes

- **Files created**: 2 (ActionsWidget.tsx, index.ts)
- **Files modified**: 3 (index.html, components/index.tsx, appStore.ts)
- **Lines added**: ~150
- **Lines removed**: ~100 (vanilla JS functions)
