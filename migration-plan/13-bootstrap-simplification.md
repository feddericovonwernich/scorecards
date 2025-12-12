# Phase 13: Bootstrap Simplification

## Objective

Reduce `main.ts` to a minimal React bootstrap (~10-20 lines). All application logic should be in React components or Zustand store.

## Current State

### main.ts (~250 lines)
```typescript
// Imports (~45 lines)
import * as constants from './config/constants.js';
import * as formatting from './utils/formatting.js';
// ... 20+ imports

// ScorecardModules object (~25 lines)
const ScorecardModules = { ... };
window.ScorecardModules = ScorecardModules;

// Window exports (~10 lines)
window.filterAndRenderServices = ...;
window.refreshData = ...;

// initTeamsView function (~60 lines)
async function initTeamsView(): Promise<void> { ... }

// refreshTeamsView function (~6 lines)
async function refreshTeamsView(): Promise<void> { ... }

// setupEventListeners function (~30 lines)
function setupEventListeners(): void { ... }

// DOMContentLoaded handler (~8 lines)
document.addEventListener('DOMContentLoaded', () => { ... });

// ES6 exports (~25 lines)
export { constants, icons, formatting, ... };
```

## Target State

### main.tsx (~15 lines)
```typescript
/**
 * Application Entry Point
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/main.css';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
```

## Implementation Steps

### Step 1: Verify Prerequisites

Ensure these phases are complete:
- Phase 9: React App Shell (React Router in place)
- Phase 10: View Container Migration (no DOM class toggling)
- Phase 11: Button State React Migration (no DOM button manipulation)
- Phase 12: Window Globals Elimination (no window exports)

### Step 2: Move initTeamsView to Store

**Before (main.ts):**
```typescript
async function initTeamsView(): Promise<void> {
  const services = storeAccessor.getAllServices() || [];
  const teamsData = await registry.loadTeams();
  // ... calculate stats, merge data
  storeAccessor.setAllTeams(allTeams);
  storeAccessor.setFilteredTeams(allTeams);
}
```

**After (stores/appStore.ts):**
```typescript
interface AppState {
  // ...existing state
  initTeamsView: () => Promise<void>;
  refreshTeamsView: () => Promise<void>;
}

// In store creation
initTeamsView: async () => {
  const { services, teams } = get();
  const teamsData = await loadTeams();
  const calculatedStats = calculateTeamStats(services.all);
  const mergedTeams = mergeTeamDataWithStats(teamsData, calculatedStats);

  set((state) => ({
    ...state,
    teams: {
      ...state.teams,
      all: mergedTeams,
      filtered: mergedTeams,
    },
  }));
},
```

### Step 3: Move setupEventListeners Logic to React

The team filter event listener should be in a React hook or component:

```typescript
// hooks/useTeamFilterSync.ts
export function useTeamFilterSync() {
  const updateFilters = useAppStore(state => state.updateFilters);

  useEffect(() => {
    const handleTeamFilterChange = (e: CustomEvent<{ teams: string[] }>) => {
      const { teams } = e.detail;
      const teamFilter = teams.length === 1 ? teams[0] :
                         teams.length > 1 ? teams.join(',') : null;
      updateFilters({ teamFilter });
    };

    window.addEventListener('team-filter-changed', handleTeamFilterChange as EventListener);
    return () => window.removeEventListener('team-filter-changed', handleTeamFilterChange as EventListener);
  }, [updateFilters]);
}

// Use in App.tsx
function App() {
  useTeamFilterSync();
  // ...
}
```

Better yet, remove the custom event entirely (Phase 12) and have TeamFilterDropdown update store directly.

### Step 4: Move App Initialization to React

**Before (main.ts):**
```typescript
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  appInit.initializeApp();
});
```

**After (App.tsx):**
```typescript
function App() {
  const initializeApp = useAppStore(state => state.initializeApp);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  return (
    // ...app structure
  );
}
```

Or use React Router loader:
```typescript
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    loader: async () => {
      await initializeApp();
      return null;
    },
    children: [
      { path: 'services', element: <ServicesView /> },
      { path: 'teams', element: <TeamsView />, loader: initTeamsLoader },
    ],
  },
]);
```

### Step 5: Move initializeApp to Store

**Before (app-init.ts):**
```typescript
export async function initializeApp(): Promise<void> {
  const { services } = await loadServices();
  storeAccessor.setAllServices(services);
  // ...
}
```

**After (stores/appStore.ts):**
```typescript
initializeApp: async () => {
  try {
    set({ isLoading: true });

    const { services } = await loadServices();
    const checksHash = await fetchCurrentChecksHash();

    set({
      services: { all: services, filtered: services },
      checksHash,
      isLoading: false,
    });

    // Navigate to teams if hash indicates
    if (window.location.hash === '#teams') {
      get().initTeamsView();
    }
  } catch (error) {
    console.error('Error initializing app:', error);
    set({ isLoading: false, error: String(error) });
  }
},
```

### Step 6: Remove ES6 Module Re-exports

The ES6 exports at the bottom of main.ts are for external consumption. Options:

**Option A: Remove entirely**
If no external code uses these, delete them.

**Option B: Create separate entry point**
```typescript
// src/exports.ts - for any external consumers
export * from './config/constants.js';
export * from './utils/formatting.js';
// ...
```

### Step 7: Rename and Simplify main.ts

Rename `main.ts` to `main.tsx` and simplify:

```typescript
/**
 * Application Entry Point
 * Bootstraps React application
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Import global styles
import '../css/main.css';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  console.error('Root element not found');
}
```

### Step 8: Update Vite Config

Update entry point:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'api-explorer': resolve(__dirname, 'api-explorer.html'),
      },
    },
  },
});
```

### Step 9: Update index.html Script Tag

```html
<!-- Before -->
<script type="module" src="src/main.ts"></script>

<!-- After -->
<script type="module" src="src/main.tsx"></script>
```

### Step 10: Delete or Archive Old Files

Files that become empty or redundant:
- `src/app-init.ts` - Move logic to store, delete file
- Most of `src/main.ts` content - Already moved to store/components

## Files to Create

| File | Purpose |
|------|---------|
| `src/main.tsx` | New simplified entry point |
| `src/hooks/useTeamFilterSync.ts` | Team filter event hook (if keeping events) |

## Files to Modify

| File | Changes |
|------|---------|
| `src/stores/appStore.ts` | Add initializeApp, initTeamsView actions |
| `src/App.tsx` | Add initialization effect |
| `vite.config.ts` | Update entry point |
| `index.html` | Update script src |

## Files to Delete

| File | Reason |
|------|--------|
| `src/main.ts` | Replaced by main.tsx |
| `src/app-init.ts` | Logic moved to store |

## Verification

1. Run build: `npm run build`
2. Verify main.tsx is under 20 lines:
   ```bash
   wc -l docs/src/main.tsx
   # Should be < 20
   ```
3. Run tests: `npx playwright test`
4. Manual test:
   - App loads and initializes
   - Services view renders
   - Teams view loads data
   - All functionality works

## Estimated Changes

- **Files created**: 1-2
- **Files deleted**: 2
- **Files modified**: 3-4
- **Lines removed**: ~250 (main.ts content)
- **Lines added**: ~100 (store actions) + 15 (main.tsx)
- **Net reduction**: ~135 lines

## Success Criteria

- [ ] `main.tsx` is under 20 lines
- [ ] No `document.addEventListener` in main.tsx
- [ ] No function definitions in main.tsx
- [ ] `app-init.ts` is deleted
- [ ] All initialization logic in Zustand store
- [ ] App initializes correctly
- [ ] All E2E tests pass

## Rollback

If issues arise:
1. Restore main.ts
2. Restore app-init.ts
3. Keep DOMContentLoaded initialization pattern
