# Phase 10: Teams View Cleanup

## Objective

Remove vanilla JavaScript teams rendering code from main.ts. React's TeamsGridContainer component now manages all teams rendering.

## Current State

The following functions in `main.ts` are only used when `__REACT_MANAGES_TEAMS_GRID` is false:

| Function | Lines | Status |
|----------|-------|--------|
| `updateTeamsStats()` | 272-340 | Can remove (React manages) |
| `renderTeamsGrid()` | 348-380 | Can remove (React manages) |
| `sortTeams()` | 385-414 | Can remove (React manages) |
| `renderTeamCard()` | 419-479 | Can remove (React manages) |
| `filterAndRenderTeams()` | 494-509 | Can remove (React manages) |
| `switchView()` | 182-185 | Already deprecated no-op |
| `handleHashChange()` | 516-519 | Already deprecated no-op |

**Keep these functions** (still used):
- `initTeamsView()` - Loads team data into Zustand store
- `refreshTeamsView()` - Triggers data refresh

## Implementation Steps

### Step 1: Remove Deprecated No-Op Functions

Remove `switchView()` and `handleHashChange()` functions and their window exports:

```typescript
// REMOVE: switchView function (lines 177-185)
// REMOVE: window.switchView = switchView; (line 522)
// REMOVE: window.handleHashChange = handleHashChange; (line 527)
// REMOVE: handleHashChange function (lines 512-519)
```

### Step 2: Remove Teams Rendering Functions

Remove these functions in order (they reference each other):

1. Remove `filterAndRenderTeams()` (line 494-509)
2. Remove `renderTeamsGrid()` (line 348-380)
3. Remove `renderTeamCard()` (line 419-479)
4. Remove `sortTeams()` (line 385-414)
5. Remove `updateTeamsStats()` (line 272-340)

### Step 3: Remove Window Exports

```typescript
// REMOVE these lines:
window.switchView = switchView;
window.renderTeamsGrid = renderTeamsGrid;
window.filterAndRenderTeams = filterAndRenderTeams;
window.handleHashChange = handleHashChange;
```

**Keep these exports** (still needed):
```typescript
window.initTeamsView = initTeamsView;
window.refreshTeamsView = refreshTeamsView;
```

### Step 4: Simplify initTeamsView()

Remove the fallback rendering code since React always manages:

```typescript
async function initTeamsView(): Promise<void> {
  // ... loading code stays the same ...

  try {
    // ... data loading code stays the same ...

    // REMOVE: if (!window.__REACT_MANAGES_TEAMS_GRID) checks
    // REMOVE: grid.innerHTML assignments
    // REMOVE: renderTeamsGrid calls

    // Keep only the Zustand store updates
    storeAccessor.setAllTeams(allTeams);
    storeAccessor.setFilteredTeams(allTeams);
  } catch (error) {
    console.error('Failed to initialize teams view:', error);
    // REMOVE: fallback innerHTML error rendering
  }
}
```

### Step 5: Update globals.d.ts

Remove window function declarations for deleted functions:
- `switchView`
- `renderTeamsGrid`
- `filterAndRenderTeams`
- `handleHashChange`

## Verification

1. Run build: `npm run build`
2. Run linting: `npm run lint`
3. Run tests: `npx playwright test`
4. Manual test: Navigate to Teams view, verify grid renders, search/sort works

## Estimated Changes

- **Files modified**: 2 (main.ts, globals.d.ts)
- **Lines removed**: ~250
