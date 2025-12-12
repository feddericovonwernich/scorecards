# React Migration Plan - Phase 2

## Overview

This is the continuation of the React migration, building on the work completed in Phase 1 (archived). The goal is to fully migrate to a React application and eliminate all vanilla JavaScript code.

## Current State Assessment

### What's Done (Phase 1)
- React components render via portals into existing DOM
- Zustand store manages all global state
- Components migrated: Navigation, Stats (both views), Controls (both views), Grids (both views)
- Integration flags prevent vanilla code from executing when React manages areas
- Button state management via `useButtonState` hook and `ActionButton` component

### What Remains

| Category | Items | Effort |
|----------|-------|--------|
| Theme service | Remove deprecated theme.ts | Small |
| Vanilla view functions | 7 functions in main.ts (~200 lines) | Medium |
| ActionsWidget | 6 onclick handlers in HTML | Medium |
| Window globals | 50+ exports to main.ts | Large |
| innerHTML usage | 5 files with DOM manipulation | Medium |
| ScorecardModules references | 2 internal usages | Small |

## Phase Structure

1. **Phase 9: Theme Service Removal** - Remove deprecated theme.ts
2. **Phase 10: Teams View Cleanup** - Remove vanilla teams rendering code
3. **Phase 11: ActionsWidget Migration** - Create React component for workflow actions widget
4. **Phase 12: Window Globals Reduction** - Reduce/eliminate window global exports
5. **Phase 13: Final Integration** - Remove all integration flags and fallback code

## Success Criteria

- No vanilla JavaScript DOM manipulation
- No `window.ScorecardModules` usage in application code
- No `__REACT_MANAGES_*` integration flags
- All UI rendered by React components
- All onclick handlers in React (not HTML)
- Clean main.ts that only bootstraps React

## Testing Strategy

All changes must:
1. Pass all 263 Playwright E2E tests
2. Pass ESLint with no warnings
3. Build successfully with TypeScript
4. Maintain visual/functional parity

## Phase Execution Order

Execute phases sequentially. Each phase has its own document with detailed steps:

1. [Phase 9: Theme Service Removal](./09-theme-removal.md)
2. [Phase 10: Teams View Cleanup](./10-teams-cleanup.md)
3. [Phase 11: ActionsWidget Migration](./11-actions-widget.md)
4. [Phase 12: Window Globals Reduction](./12-window-globals.md)
5. [Phase 13: Final Integration](./13-final-integration.md)
