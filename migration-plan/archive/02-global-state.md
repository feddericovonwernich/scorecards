# Phase 2: Global State Migration

## Objective

Remove all `window.*` global state variables and consolidate them into the existing Zustand store. This is foundational work that enables subsequent phases.

## Current State Analysis

### File: `docs/src/main.ts` (lines 54-68)

Currently initializes global state on `window`:

```typescript
window.allServices = [];
window.filteredServices = [];
window.activeFilters = new Map();
window.currentSort = 'score-desc';
window.searchQuery = '';
window.currentChecksHash = null;
window.checksHashTimestamp = 0;
window.currentView = 'services';
window.allTeams = [];
window.filteredTeams = [];
window.teamsSort = 'score-desc';
window.teamsSearchQuery = '';
window.teamsActiveFilters = new Map();
window.githubPAT = null;
```

### Window Function Exports (lines 100-188)

Also exports many functions to `window`:

```typescript
window.formatRelativeTime = ...
window.filterAndRenderServices = ...
window.refreshData = ...
window.switchView = ...
// ... 50+ more functions
```

## Migration Steps

### Step 1: Audit Current Zustand Store

The store at `docs/src/stores/appStore.ts` already has:

```typescript
// Already exists in store:
services: { all: [], filtered: [], loading: false }
teams: { all: [], filtered: [], sort, search, activeFilters }
filters: { active, search, sort, teamFilter, checkFilters }
ui: { currentView, checksHash, checksHashTimestamp }
auth: { pat }
```

### Step 2: Map Window Globals to Store

| Window Global | Zustand Location | Status |
|---------------|------------------|--------|
| `window.allServices` | `services.all` | Already exists |
| `window.filteredServices` | `services.filtered` | Already exists |
| `window.activeFilters` | `filters.active` | Already exists |
| `window.currentSort` | `filters.sort` | Already exists |
| `window.searchQuery` | `filters.search` | Already exists |
| `window.currentChecksHash` | `ui.checksHash` | Already exists |
| `window.checksHashTimestamp` | `ui.checksHashTimestamp` | Already exists |
| `window.currentView` | `ui.currentView` | Already exists |
| `window.allTeams` | `teams.all` | Already exists |
| `window.filteredTeams` | `teams.filtered` | Already exists |
| `window.teamsSort` | `teams.sort` | Already exists |
| `window.teamsSearchQuery` | `teams.search` | Already exists |
| `window.teamsActiveFilters` | `teams.activeFilters` | Already exists |
| `window.githubPAT` | `auth.pat` | Already exists |

**Finding**: All state already exists in Zustand! The issue is dual-sync - both locations are updated.

### Step 3: Remove Window State Initialization

Edit `docs/src/main.ts`:

```typescript
// REMOVE these lines (54-68):
// window.allServices = [];
// window.filteredServices = [];
// ... etc

// KEEP the imports and React initialization
import { useAppStore } from './stores/appStore.js';

// Initialize store with defaults (it already has them)
const store = useAppStore.getState();
```

### Step 4: Update All Window State References

Search and replace across the codebase:

```typescript
// Before:
window.allServices

// After:
useAppStore.getState().services.all

// Or in React components:
const services = useAppStore((state) => state.services.all);
```

#### Files to Update:

1. **`docs/src/main.ts`**
   - Replace `window.allServices` → `useAppStore.getState().services.all`
   - Replace `window.filteredServices` → `useAppStore.getState().services.filtered`
   - Replace `window.currentSort` → `useAppStore.getState().filters.sort`
   - Replace `window.searchQuery` → `useAppStore.getState().filters.search`
   - Replace `window.activeFilters` → `useAppStore.getState().filters.active`
   - Replace `window.currentView` → `useAppStore.getState().ui.currentView`
   - Replace `window.allTeams` → `useAppStore.getState().teams.all`
   - Replace `window.filteredTeams` → `useAppStore.getState().teams.filtered`
   - Replace `window.teamsSort` → `useAppStore.getState().teams.sort`
   - Replace `window.teamsSearchQuery` → `useAppStore.getState().teams.search`
   - Replace `window.teamsActiveFilters` → `useAppStore.getState().teams.activeFilters`

2. **`docs/src/app-init.ts`**
   - Replace `window.allServices` → `useAppStore.getState().services.all`
   - Replace `window.filteredServices` → store.setFilteredServices()
   - Replace `window.currentChecksHash` → `useAppStore.getState().ui.checksHash`
   - Replace `window.checksHashTimestamp` → `useAppStore.getState().ui.checksHashTimestamp`

3. **`docs/src/api/workflow-triggers.ts`**
   - Replace `window.allServices` → `useAppStore.getState().services.all`
   - Replace `window.currentChecksHash` → `useAppStore.getState().ui.checksHash`

### Step 5: Create Store Accessor Utility

To ease migration, create a utility for non-React code:

```typescript
// docs/src/stores/accessor.ts

import { useAppStore } from './appStore';

/**
 * Get store state from non-React code
 * Use sparingly - prefer React hooks in components
 */
export function getStore() {
  return useAppStore.getState();
}

/**
 * Get services from store
 */
export function getAllServices() {
  return useAppStore.getState().services.all;
}

export function getFilteredServices() {
  return useAppStore.getState().services.filtered;
}

export function getChecksHash() {
  return useAppStore.getState().ui.checksHash;
}

// Add more as needed for migration
```

### Step 6: Update TypeScript Declarations

Edit `docs/src/types/globals.d.ts`:

```typescript
// Mark deprecated globals
declare global {
  interface Window {
    // DEPRECATED: Use useAppStore instead
    /** @deprecated Use useAppStore.getState().services.all */
    allServices?: ServiceData[];
    /** @deprecated Use useAppStore.getState().services.filtered */
    filteredServices?: ServiceData[];
    // ... mark all as deprecated

    // Keep these (React management flags):
    __REACT_MANAGES_SERVICES_GRID?: boolean;
    __REACT_MANAGES_TEAMS_GRID?: boolean;
    __REACT_MANAGES_NAVIGATION?: boolean;
  }
}
```

### Step 7: Remove ScorecardModules Export

The `window.ScorecardModules` object (lines 71-98) exports all modules globally. This should be removed and replaced with direct imports:

```typescript
// REMOVE:
window.ScorecardModules = ScorecardModules;

// Files that use window.ScorecardModules should import directly:
// Before:
const { isServiceStale } = window.ScorecardModules.staleness;

// After:
import { isServiceStale } from './services/staleness.js';
```

### Step 8: Remove Window Function Exports

Remove lines 100-188 that export individual functions to window. These are used for:
1. Vanilla JS onclick handlers in HTML (Phase 5 will fix)
2. Legacy compatibility (no longer needed)

For now, keep only the essential bridge functions that React components expose.

## Verification Checklist

- [ ] Application loads without errors
- [ ] Services grid displays correctly
- [ ] Teams grid displays correctly
- [ ] Filtering works (rank filters, search)
- [ ] Sorting works
- [ ] View switching works (services ↔ teams)
- [ ] Refresh data works
- [ ] No `window.allServices` references remain (except in deprecated declarations)
- [ ] No `window.filteredServices` references remain
- [ ] Store updates propagate to UI correctly

## Files Modified

| File | Action |
|------|--------|
| `docs/src/main.ts` | Remove window state init, update references |
| `docs/src/app-init.ts` | Update window references to store |
| `docs/src/api/workflow-triggers.ts` | Update window references to store |
| `docs/src/stores/accessor.ts` | Create (new) |
| `docs/src/types/globals.d.ts` | Mark globals as deprecated |

## Search Patterns for Remaining Issues

After migration, search for these patterns to find any missed references:

```bash
# Find window.allServices
grep -r "window\.allServices" docs/src/

# Find window.filteredServices
grep -r "window\.filteredServices" docs/src/

# Find any window.* state
grep -rE "window\.(allServices|filteredServices|activeFilters|currentSort|searchQuery)" docs/src/
```

## Rollback Instructions

If issues arise:
1. `git checkout HEAD -- docs/src/main.ts`
2. `git checkout HEAD -- docs/src/app-init.ts`
3. `git checkout HEAD -- docs/src/api/workflow-triggers.ts`
4. Delete new files: `rm docs/src/stores/accessor.ts`

## Notes for Executing Model

- This phase has NO dependencies on other phases
- Can be executed in parallel with Phase 1 and Phase 3
- The Zustand store already has all required state slices - this phase just removes the duplicate window state
- After this phase, both window.* AND store will work (for backwards compat) - Phase 8 removes window.* entirely
- Test thoroughly after each file change
