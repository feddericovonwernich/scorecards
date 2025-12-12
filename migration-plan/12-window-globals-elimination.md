# Phase 12: Window Globals Elimination

## Objective

Remove all `window.*` function exports. Replace with React context, hooks, or direct imports.

## Current State

### main.ts Window Exports

```typescript
// Line 82
window.ScorecardModules = ScorecardModules;

// Lines 91-95
window.filterAndRenderServices = appInit.filterAndRenderServices;
window.refreshData = appInit.refreshData;
window.triggerServiceWorkflow = workflowTriggers.triggerServiceWorkflow;

// Lines 174-175
window.initTeamsView = initTeamsView;
window.refreshTeamsView = refreshTeamsView;

// Line 216
window.setupEventListeners = setupEventListeners;
```

### components/index.tsx Window Exports (lines 306-394)

```typescript
window.showToast = (message, type) => showToast(message, type);
window.showServiceDetail = async (org, repo) => openServiceModal(org, repo);
window.showTeamDetail = async (teamName) => openTeamModal(teamName);
window.showTeamModal = async (teamName) => openTeamModal(teamName);
window.openCheckFilterModal = () => openCheckFilterModal();
window.closeModal = () => closeServiceModal();
window.closeTeamModal = () => closeTeamModal();
window.openSettings = () => openSettingsModal();
window.toggleActionsWidget = () => toggleActionsWidget();
window.openTeamDashboard = () => openTeamDashboard();
window.openTeamEditModal = (mode, teamId) => openTeamEditModal(mode, teamId);
window.openCheckAdoptionDashboard = () => openCheckAdoptionDashboard();
```

### Usage Locations

These window functions are called from:
1. **HTML onclick handlers** - Should be migrated to React
2. **Vanilla JS event listeners** - Should be migrated to React
3. **Inter-component communication** - Should use Zustand/Context

## Target State

Zero window exports. All functionality accessed via:
1. **React hooks** for component-local state
2. **Zustand store** for global state
3. **React context** for deeply nested components
4. **Direct imports** for utility functions

## Implementation Steps

### Step 1: Audit Usage

Find all usages of window globals:

```bash
# Find all window.functionName calls
grep -roh "window\.[a-zA-Z]*(" docs/src docs/*.html | sort | uniq -c | sort -rn
```

### Step 2: Create Modal Context (if not using Zustand)

Option A - Zustand (recommended, already in use):
```typescript
// stores/appStore.ts - add modal state
interface ModalState {
  serviceModal: { isOpen: boolean; org: string | null; repo: string | null };
  teamModal: { isOpen: boolean; teamName: string | null };
  settingsModalOpen: boolean;
  checkFilterModalOpen: boolean;
  // ...
}

interface ModalActions {
  openServiceModal: (org: string, repo: string) => void;
  closeServiceModal: () => void;
  openTeamModal: (teamName: string) => void;
  closeTeamModal: () => void;
  // ...
}
```

Option B - React Context:
```typescript
// contexts/ModalContext.tsx
const ModalContext = createContext<ModalContextValue | null>(null);

export function useModals() {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModals must be used within ModalProvider');
  return context;
}
```

### Step 3: Migrate Modal Openers to Zustand

**Before (components/index.tsx):**
```typescript
window.showServiceDetail = async (org: string, repo: string) => {
  openServiceModal(org, repo);
};
```

**After (stores/appStore.ts):**
```typescript
// In store
openServiceModal: (org, repo) => set({
  modals: {
    ...get().modals,
    serviceModal: { isOpen: true, org, repo }
  }
}),

// In components
const openServiceModal = useAppStore(state => state.openServiceModal);
```

### Step 4: Remove window.ScorecardModules

This is used for:
1. API Explorer page - needs separate handling
2. Internal module access - use direct imports

**For API Explorer:**
```typescript
// api-explorer.html can import modules directly via ES6
import { registry, github, auth } from './api/index.js';
```

**For internal code:**
```typescript
// Before
const { getRepoOwner } = window.ScorecardModules.registry;

// After
import { getRepoOwner } from './api/registry.js';
```

### Step 5: Remove filterAndRenderServices Export

This is called from:
1. Team filter event listener
2. Filter changes

**Solution:** Use Zustand subscription or React effect:

```typescript
// In store - add filtered services computation
const filteredServices = useAppStore(state => {
  // Compute filtered services based on filters
  return computeFilteredServices(state.services.all, state.filters);
});

// Filters automatically trigger re-render
// No manual filterAndRenderServices call needed
```

Or use a `useFilteredServices` hook:
```typescript
export function useFilteredServices() {
  const allServices = useAppStore(state => state.services.all);
  const filters = useAppStore(state => state.filters);

  return useMemo(() => {
    return computeFilteredServices(allServices, filters);
  }, [allServices, filters]);
}
```

### Step 6: Remove refreshData Export

**Before:**
```typescript
window.refreshData = appInit.refreshData;
```

**After:**
```typescript
// In Zustand store
refreshData: async () => {
  set({ isRefreshing: true });
  try {
    const { services } = await loadServices();
    set({ services: { all: services, filtered: services } });
    showToastGlobal('Data refreshed!', 'success');
  } catch (error) {
    showToastGlobal('Refresh failed', 'error');
  } finally {
    set({ isRefreshing: false });
  }
}

// In components
const refreshData = useAppStore(state => state.refreshData);
```

### Step 7: Remove initTeamsView/refreshTeamsView Exports

Move to Zustand:
```typescript
// In store
initTeamsView: async () => {
  const services = get().services.all;
  const teamsData = await loadTeams();
  const teams = calculateTeamStats(services, teamsData);
  set({ teams: { all: teams, filtered: teams } });
}
```

### Step 8: Remove showToast Export

Already using Zustand - ensure components use the hook:

```typescript
// Before
window.showToast('Message', 'success');

// After
const { showToast } = useToast();
showToast('Message', 'success');
```

For non-React code that needs toast (should be minimal):
```typescript
import { showToastGlobal } from './components/ui/Toast.js';
showToastGlobal('Message', 'success');
```

### Step 9: Remove setupEventListeners

This sets up the team filter event listener. Move to React:

```typescript
// In ServicesControls or a dedicated hook
useEffect(() => {
  const handleTeamFilterChange = (e: CustomEvent) => {
    const { teams } = e.detail;
    // Update filters in store
    updateFilters({ teamFilter: teams.join(',') });
  };

  window.addEventListener('team-filter-changed', handleTeamFilterChange);
  return () => window.removeEventListener('team-filter-changed', handleTeamFilterChange);
}, []);
```

Better: Remove the custom event entirely and use Zustand:
```typescript
// TeamFilterDropdown sets filter directly
const setTeamFilter = useAppStore(state => state.setTeamFilter);
// ...
onChange={(teams) => setTeamFilter(teams)}
```

### Step 10: Clean Up globals.d.ts

Remove all window function declarations:

```typescript
// REMOVE all of these
declare global {
  interface Window {
    ScorecardModules?: typeof ScorecardModules;
    filterAndRenderServices?: () => void;
    refreshData?: () => Promise<void>;
    // ... etc
  }
}
```

## Migration Table

| Window Global | Replacement |
|---------------|-------------|
| `window.ScorecardModules` | Direct ES6 imports |
| `window.filterAndRenderServices` | Zustand computed state |
| `window.refreshData` | Zustand action |
| `window.triggerServiceWorkflow` | Direct import + React state |
| `window.initTeamsView` | Zustand action |
| `window.refreshTeamsView` | Zustand action |
| `window.setupEventListeners` | React useEffect |
| `window.showToast` | useToast hook |
| `window.showServiceDetail` | Zustand action |
| `window.showTeamDetail` | Zustand action |
| `window.openSettings` | Zustand action |
| `window.toggleActionsWidget` | Zustand action |
| `window.openTeamDashboard` | Zustand action |
| `window.closeModal` | Zustand action |

## Files to Modify

| File | Changes |
|------|---------|
| `src/main.ts` | Remove all window exports |
| `src/components/index.tsx` | Remove window function assignments |
| `src/stores/appStore.ts` | Add modal state and actions |
| `src/types/globals.d.ts` | Remove window declarations |
| `src/app-init.ts` | Remove functions that become store actions |
| Various components | Use store actions instead of window calls |

## Verification

1. Run build: `npm run build`
2. Grep for remaining window exports:
   ```bash
   grep -r "window\.[a-zA-Z]* =" docs/src/main.ts docs/src/components/index.tsx
   # Should return nothing
   ```
3. Run tests: `npx playwright test`
4. Open console, verify no window.ScorecardModules
5. Test all functionality still works

## Estimated Changes

- **Files modified**: 8-10
- **Lines removed**: ~100 (window exports)
- **Lines added**: ~50 (store actions)

## Success Criteria

- [ ] Zero `window.* =` assignments in main.ts
- [ ] Zero `window.* =` assignments in components/index.tsx
- [ ] `globals.d.ts` has no Window interface extensions (for app code)
- [ ] All functionality works via imports/hooks/store
- [ ] All E2E tests pass

## Notes

The API Explorer page may need some window globals. If so:
1. Keep minimal exports only for API Explorer
2. Document them clearly
3. Or refactor API Explorer to use ES6 imports

## Rollback

If issues arise:
1. Restore window exports one by one
2. Test which are actually needed
3. Keep only essential ones, document why
