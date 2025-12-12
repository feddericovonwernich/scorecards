# Phase 12: Window Globals Reduction

## Objective

Systematically reduce and eliminate window global exports. Currently there are 50+ functions exported to `window.*` for backwards compatibility with vanilla JS code.

## Current State

### Window Global Exports in main.ts

**Formatting (6 functions):**
- `window.formatRelativeTime`
- `window.formatDate`
- `window.formatDuration`
- `window.formatInterval`
- `window.escapeHtml`
- `window.capitalize`

**Crypto (1 function):**
- `window.md5`

**CSS (1 function):**
- `window.getCssVar`

**Animation (2 functions):**
- `window.startButtonSpin`
- `window.stopButtonSpin`

**Statistics (2 functions):**
- `window.countByRank`
- `window.calculateAverageScore`

**Duration Tracker (2 functions):**
- `window.startLiveDurationUpdates`
- `window.stopLiveDurationUpdates`

**Icons (1 function):**
- `window.getIcon`

**Clipboard (1 function):**
- `window.copyBadgeCode`

**API Explorer (1 function):**
- `window.openApiExplorer`

**Auth (5 functions):**
- `window.getGitHubToken`
- `window.hasGitHubToken`
- `window.setGitHubToken`
- `window.clearGitHubToken`
- `window.validateGitHubToken`

**Staleness (1 function):**
- `window.isServiceStale`

**Registry (5 functions):**
- `window.loadServicesData`
- `window.fetchCurrentChecksHash`
- `window.fetchWithHybridAuth`
- `window.getRawBaseUrl`
- `window.loadTeams`

**GitHub API (5 functions):**
- `window.fetchWorkflowRuns`
- `window.triggerScorecardWorkflow`
- `window.triggerBulkScorecardWorkflows`
- `window.createInstallationPR`
- `window.checkGitHubRateLimit`

**Team Statistics (4 functions):**
- `window.getTeamName`
- `window.getTeamCount`
- `window.getUniqueTeams`
- `window.calculateTeamStats`

**Workflow Triggers (3 functions):**
- `window.triggerServiceWorkflow`
- `window.installService`
- `window.triggerBulkWorkflows`

**App Init (2 functions):**
- `window.filterAndRenderServices`
- `window.refreshData`

**Event Setup (1 function):**
- `window.setupEventListeners`

**View Navigation (4 functions):**
- `window.initTeamsView`
- `window.refreshTeamsView`
- `window.renderTeamsGrid`
- `window.filterAndRenderTeams`

**Total: 47 window globals + ScorecardModules object**

## Strategy

### Phase 12a: Remove Unused Globals

First, identify which globals are actually used:

```bash
# Check HTML for window.* calls
grep -r "window\." docs/index.html docs/api-explorer.html

# Check for onclick handlers that use globals
grep -r "onclick=" docs/*.html
```

Many globals are only exported "just in case" but never used. Remove these first.

### Phase 12b: Migrate Internal ScorecardModules Usage

Two files use `window.ScorecardModules` internally:

1. `workflow-triggers.ts:87`:
   ```typescript
   const { getRepoOwner, getRepoName } = window.ScorecardModules.registry;
   ```
   **Fix:** Import directly from registry module

2. `workflow-triggers.ts:361`:
   ```typescript
   const { isServiceStale } = window.ScorecardModules.staleness;
   ```
   **Fix:** Import directly from staleness module

### Phase 12c: Consolidate to Modules Only

After removing direct window exports, keep only `window.ScorecardModules` for any external usage, then document that it should be accessed via ES6 imports.

## Implementation Steps

### Step 1: Fix Internal ScorecardModules Usage

In `docs/src/api/workflow-triggers.ts`:

```typescript
// Add imports at top
import { getRepoOwner, getRepoName } from './registry.js';
import { isServiceStale } from '../services/staleness.js';

// Replace line 87
// FROM: const { getRepoOwner, getRepoName } = window.ScorecardModules.registry;
// TO: (use imported functions directly)

// Replace line 361
// FROM: const { isServiceStale } = window.ScorecardModules.staleness;
// TO: (use imported function directly)
```

### Step 2: Audit Actual Usage

Create usage report:

```bash
# Find all window.functionName usage
grep -roh "window\.[a-zA-Z]*" docs/src docs/*.html | sort | uniq -c | sort -rn
```

### Step 3: Remove Unused Exports

For each unused function, remove the `window.X = X` line from main.ts.

### Step 4: Update globals.d.ts

Remove corresponding type declarations from the Window interface.

### Step 5: Keep Essential Globals

Some functions may need to stay on window for legitimate reasons:
- API Explorer page uses some functions
- Any external scripts that depend on them

Document these in comments.

## Verification

1. Run build: `npm run build`
2. Run linting: `npm run lint`
3. Run tests: `npx playwright test`
4. Test API Explorer page manually
5. Verify no console errors for undefined functions

## Estimated Changes

- **Files modified**: 3 (main.ts, workflow-triggers.ts, globals.d.ts)
- **Lines removed**: ~50-100 (window exports)

## Notes

This phase may need to be done incrementally, removing a few globals at a time and testing. Some globals may need to stay for the API Explorer page or other legitimate uses.
