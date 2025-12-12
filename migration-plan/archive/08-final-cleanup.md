# Phase 8: Final Cleanup

## Objective

Remove all remaining vanilla JavaScript utilities, deprecated files, window globals, and bridge code. This phase consolidates the migration and removes technical debt.

## Prerequisites

**All previous phases (1-7) must be complete before starting Phase 8.**

## Items to Remove

### 1. Window Global State

Remove from `docs/src/main.ts`:

```typescript
// REMOVE all window.* state initialization (lines 54-68):
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

### 2. Window Function Exports

Remove from `docs/src/main.ts`:

```typescript
// REMOVE all window.* function exports (lines 100-188):
window.ScorecardModules = ScorecardModules;
window.formatRelativeTime = ...
window.filterAndRenderServices = ...
window.refreshData = ...
window.switchView = ...
// ... all ~50 function exports

// REMOVE window function exports (lines 590-595):
window.switchView = switchView;
window.initTeamsView = initTeamsView;
window.refreshTeamsView = refreshTeamsView;
window.renderTeamsGrid = renderTeamsGrid;
window.filterAndRenderTeams = filterAndRenderTeams;
window.handleHashChange = handleHashChange;
```

### 3. Vanilla DOM Utility Module

Delete the entire file:

```bash
rm docs/src/utils/dom.ts
```

This file contains:
- `createElement()` - Use React instead
- `show()`, `hide()`, `toggle()` - Use React state
- `delegateEvent()` - Use React event handlers
- `toggleClass()` - Use React className
- `setHTML()` - Use React JSX

### 4. Legacy app.js File

Delete if it still exists:

```bash
rm docs/app.js
```

### 5. Deprecated Theme Service

Delete or refactor `docs/src/services/theme.ts`:

```bash
# Option A: Delete entirely
rm docs/src/services/theme.ts

# Option B: Keep as thin wrapper around React context
# Only if needed for edge cases
```

### 6. Window Globals Type Declarations

Update `docs/src/types/globals.d.ts`:

```typescript
// REMOVE deprecated declarations:
declare global {
  interface Window {
    // REMOVE all these - no longer needed:
    // allServices?: ServiceData[];
    // filteredServices?: ServiceData[];
    // activeFilters?: Map<string, FilterMode>;
    // ... etc

    // KEEP only essential React bridge functions:
    showToast?: (message: string, type?: string) => void;
    showServiceDetail?: (org: string, repo: string) => Promise<void>;
    showTeamDetail?: (teamName: string) => Promise<void>;
    openSettings?: () => void;
    // ... other modal openers

    // KEEP React management flags:
    __REACT_MANAGES_SERVICES_GRID?: boolean;
    __REACT_MANAGES_TEAMS_GRID?: boolean;
    __REACT_MANAGES_NAVIGATION?: boolean;
    __REACT_MANAGES_SERVICES_STATS?: boolean;
    __REACT_MANAGES_TEAMS_STATS?: boolean;
    __REACT_MANAGES_SERVICES_CONTROLS?: boolean;
    __REACT_MANAGES_TEAMS_CONTROLS?: boolean;
  }
}
```

### 7. Vanilla View Functions

Remove from `docs/src/main.ts`:

```typescript
// REMOVE these functions (lines 197-595):
function switchView(view: ViewType): void { ... }
async function initTeamsView(): Promise<void> { ... }
function updateTeamsStats(teams, services): void { ... }
function renderTeamsGrid(teams, services): void { ... }
function filterAndSortTeams(): void { ... }
function sortTeams(teams, sortBy): TeamWithStats[] { ... }
function renderTeamCard(team, services): string { ... }
async function refreshTeamsView(): Promise<void> { ... }
function filterAndRenderTeams(): void { ... }
function handleHashChange(): void { ... }
function setupEventListeners(): void { ... }
```

### 8. Inline onclick Handlers in HTML

Update `docs/index.html` to remove all inline handlers:

```html
<!-- REMOVE onclick attributes: -->
<button onclick="refreshData()">  <!-- Remove -->
<button onclick="handleBulkTrigger(event)">  <!-- Remove -->
<button onclick="handleBulkTriggerAll(event)">  <!-- Remove -->
<button onclick="window.openTeamEditModal?.('create')">  <!-- Remove -->
<button onclick="openCheckAdoptionDashboard(...)">  <!-- Remove -->
<select onchange="changePollingInterval()">  <!-- Remove -->
<button onclick="refreshActionsWidget()">  <!-- Remove -->
<button onclick="toggleActionsWidget()">  <!-- Remove -->
<button onclick="filterActions('all')">  <!-- Remove -->

<!-- These elements are now rendered by React portals -->
```

### 9. Clipboard Utility

Refactor `docs/src/utils/clipboard.ts` to use modern API:

```typescript
// docs/src/utils/clipboard.ts

/**
 * Copy text to clipboard using modern Clipboard API
 * Falls back to execCommand for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers or non-secure contexts
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }
}

// React hook version
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    return success;
  }, []);

  return { copied, copy };
}
```

### 10. Remove Unused Imports

Clean up imports in `docs/src/main.ts`:

```typescript
// REMOVE unused imports:
// import * as dom from './utils/dom.js';  // Module deleted
// import * as formatting from './utils/formatting.js';  // If unused
// ... any other unused imports
```

## Cleanup Steps

### Step 1: Verify All Previous Phases Complete

Run checklist:
- [ ] Phase 1: API Explorer migrated
- [ ] Phase 2: Global state using Zustand only
- [ ] Phase 3: Theme using React context
- [ ] Phase 4: Stats using React components
- [ ] Phase 5: Controls using React components
- [ ] Phase 6: Navigation using React
- [ ] Phase 7: Button states using React hooks

### Step 2: Run Full Test Suite

```bash
npm test
npm run build
```

### Step 3: Search for Remaining Vanilla Patterns

```bash
# Find document.getElementById
grep -r "document\.getElementById" docs/src/ --include="*.ts" --include="*.tsx"

# Find document.querySelector
grep -r "document\.querySelector" docs/src/ --include="*.ts" --include="*.tsx"

# Find addEventListener
grep -r "addEventListener" docs/src/ --include="*.ts" --include="*.tsx"

# Find innerHTML assignments
grep -r "\.innerHTML\s*=" docs/src/ --include="*.ts" --include="*.tsx"

# Find window.* state
grep -rE "window\.(allServices|filteredServices|activeFilters|currentSort)" docs/src/

# Find onclick in HTML
grep -r "onclick=" docs/*.html
```

### Step 4: Delete Deprecated Files

```bash
# Delete dom utilities
rm docs/src/utils/dom.ts

# Delete legacy app.js if exists
rm -f docs/app.js

# Delete theme service if fully migrated
rm docs/src/services/theme.ts
```

### Step 5: Clean Up main.ts

The file `docs/src/main.ts` should be reduced to:

```typescript
/**
 * Main Application Entry Point
 * Imports React components entry point
 */

// React components entry point - all UI rendering happens here
import './components/index.js';

// Re-export for ES6 module imports (if still needed)
export * from './stores/index.js';
export * from './api/index.js';
export * from './services/index.js';
```

### Step 6: Clean Up index.html

The file should have minimal structure with React mount points:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scorecards Catalog</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <script>
        // Theme flash prevention (KEEP)
        (function() {
            const THEME_KEY = 'theme';
            const savedTheme = localStorage.getItem(THEME_KEY);
            const osPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = savedTheme || (osPrefersDark ? 'dark' : 'light');
            document.documentElement.setAttribute('data-theme', theme);
        })();
    </script>
    <link rel="stylesheet" href="css/main.css">
</head>
<body>
    <div id="react-root"></div>
    <script type="module" src="src/main.ts"></script>
</body>
</html>
```

### Step 7: Update Build Configuration

Ensure Vite/build config reflects the simpler structure:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        'api-explorer': 'api-explorer.html',
      },
    },
  },
});
```

### Step 8: Final Verification

```bash
# Build
npm run build

# Run tests
npm test

# Start dev server and manually verify:
# - Services view loads
# - Teams view loads
# - Filtering works
# - Sorting works
# - Search works
# - Modals open/close
# - Theme toggle works
# - Workflow triggers work
# - URL navigation works
```

## Files to Delete

| File | Reason |
|------|--------|
| `docs/src/utils/dom.ts` | Vanilla DOM utilities no longer needed |
| `docs/app.js` | Legacy global state file |
| `docs/src/services/theme.ts` | Replaced by React ThemeContext |

## Files to Simplify

| File | Action |
|------|--------|
| `docs/src/main.ts` | Remove ~600 lines of vanilla code |
| `docs/index.html` | Remove onclick handlers, simplify structure |
| `docs/src/types/globals.d.ts` | Remove deprecated window type declarations |

## Success Criteria

After Phase 8:

1. **No vanilla DOM queries**: Zero `document.getElementById()` or `document.querySelector()` in TypeScript
2. **No event listeners**: Zero `addEventListener()` in TypeScript
3. **No innerHTML**: Zero `innerHTML` assignments outside React (except theme flash prevention)
4. **No window state**: Zero `window.allServices`, `window.filteredServices`, etc.
5. **Clean HTML**: Zero inline `onclick` handlers
6. **Deleted files**: `dom.ts`, `app.js`, `theme.ts` (service)
7. **Single entry**: Main app is single React application
8. **Build succeeds**: `npm run build` completes without errors
9. **Tests pass**: All tests pass
10. **Functionality intact**: All features work as before

## Rollback Instructions

This phase involves many deletions. Before starting:

```bash
# Create a backup branch
git checkout -b backup/pre-cleanup
git push origin backup/pre-cleanup

# Return to main and start cleanup
git checkout main
```

If issues arise:
```bash
git checkout backup/pre-cleanup -- docs/
```

## Notes for Executing Model

- **This phase depends on ALL previous phases**
- Take incremental steps - delete one file, verify build, commit
- Keep the theme flash prevention script in HTML - it's necessary
- Run tests frequently during cleanup
- The goal is simplification - if something seems needed, verify it isn't duplicate functionality
- After cleanup, the codebase should be a standard React SPA with Zustand state management
