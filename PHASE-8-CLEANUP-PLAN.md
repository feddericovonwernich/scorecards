# Phase 8: Final Cleanup Plan

## Status: READY FOR EXECUTION AFTER ALL PREVIOUS PHASES MERGED

This document outlines the cleanup tasks for Phase 8. **These cleanups should only be performed after Phases 1-7 PRs are merged to main.**

## Prerequisites

All of the following PRs must be merged:
- [ ] Phase 1: API Explorer
- [ ] Phase 2: Global State (Zustand)
- [ ] Phase 3: Theme System
- [ ] Phase 4: Stats Dashboard
- [ ] Phase 5: Controls & Events
- [ ] Phase 6: View Navigation
- [ ] Phase 7: Button States

## Files to Remove

### 1. `docs/src/utils/dom.ts`
**Status:** Currently imported but unused in main.ts
**Action:** Remove import from main.ts, then delete file
**Reason:** All DOM manipulation moved to React

### 2. `docs/src/services/theme.ts`
**Status:** Imported and exported in ScorecardModules but functionality replaced by React ThemeContext
**Action:** Carefully remove after verifying no vanilla JS code depends on it
**Reason:** Theme management now in React

### 3. `docs/app.js` (if exists)
**Status:** Check if file exists
**Action:** Delete if found
**Reason:** Legacy global state file

## Code to Clean Up

### In `docs/src/main.ts`

1. Remove window global state initialization (lines ~54-68):
```typescript
// REMOVE:
window.allServices = [];
window.filteredServices = [];
window.activeFilters = new Map();
window.currentSort = 'score-desc';
// ... etc
```

2. Remove window function exports (~50 functions):
```typescript
// REMOVE:
window.switchView = switchView;
window.initTeamsView = initTeamsView;
// ... etc
```

3. Remove vanilla view functions:
- `switchView()`
- `initTeamsView()`
- `updateTeamsStats()`
- `renderTeamsGrid()`
- `filterAndSortTeams()`
- `sortTeams()`
- `renderTeamCard()`
- `refreshTeamsView()`
- `filterAndRenderTeams()`
- `handleHashChange()`
- `setupEventListeners()`

### In `docs/src/types/globals.d.ts`

Remove deprecated window declarations while keeping essential React bridge functions:

```typescript
// KEEP only:
interface Window {
  showToast?: (message: string, type?: string) => void;
  showServiceDetail?: (org: string, repo: string) => Promise<void>;
  showTeamDetail?: (teamName: string) => Promise<void>;
  openSettings?: () => void;

  // React management flags
  __REACT_MANAGES_SERVICES_GRID?: boolean;
  __REACT_MANAGES_TEAMS_GRID?: boolean;
  __REACT_MANAGES_NAVIGATION?: boolean;
  // ... etc
}
```

### In `docs/index.html`

Remove all inline onclick handlers:
```html
<!-- REMOVE all onclick attributes -->
<button onclick="refreshData()">
<button onclick="handleBulkTrigger(event)">
<!-- etc -->
```

## Verification Steps

After cleanup:

1. **Run tests:** `npm run test:e2e` - All tests should pass
2. **Run build:** `npm run build` - Should complete without errors
3. **Run linter:** `npm run lint` - Should pass
4. **Search for patterns:**
   ```bash
   # Should return minimal results:
   grep -r "document\.getElementById" docs/src/
   grep -r "document\.querySelector" docs/src/
   grep -r "addEventListener" docs/src/
   grep -r "\.innerHTML\s*=" docs/src/
   grep -r "onclick=" docs/*.html
   ```

## Notes

- The theme flash prevention script in `index.html` should be KEPT
- Some window globals may still be needed for modal openers and toast notifications
- The cleanup is incremental - delete one file, test, commit
- This phase significantly reduces the codebase to a standard React SPA

## Estimated Impact

- **Files deleted:** 2-3
- **Lines removed:** ~600-800 from main.ts alone
- **Result:** Clean React SPA with minimal vanilla JS bridge code
