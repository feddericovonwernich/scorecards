# React Migration Plan - Phase 3: 100% React

## Overview

This is the final phase of the React migration, aiming to achieve **100% React** with zero vanilla JavaScript DOM manipulation. The goal is a fully React-managed application with a clean, minimal bootstrap layer.

## Current State Assessment

### What's Done (Phases 1-2, Archived)
- React components render via portals into existing DOM
- Zustand store manages all global state
- All UI components migrated to React
- Button state management via React hooks
- Theme handled by React hook

### What Remains (Vanilla JS to Eliminate)

| Category | Files | Description |
|----------|-------|-------------|
| HTML Shell Architecture | `index.html` | View containers managed by HTML `active` class |
| View Container DOM Manipulation | `Navigation.tsx` | `document.getElementById` + `classList` for view switching |
| Refresh Button DOM Manipulation | `app-init.ts:158-218` | `innerHTML` manipulation for refresh button state |
| Workflow Button DOM Manipulation | `workflow-triggers.ts:29-81` | Button state via `innerHTML`/`classList` |
| Service Modal DOM Manipulation | `workflow-triggers.ts:229-230` | `modal.classList.add('hidden')` |
| Portal Target Selection | `components/index.tsx:83-113` | `document.getElementById` for portal targets |
| Team Filter Event Listener | `main.ts:191-212` | Window event listener for team filter |
| DOMContentLoaded Bootstrap | `main.ts:219-225` | Vanilla bootstrap sequence |
| Window Global Exports | `main.ts:82-216` | 15+ window function exports |
| Clipboard Fallback | `utils/clipboard.ts:13-40` | `createElement` for clipboard compat |
| Duration Tracker | `utils/duration-tracker.ts:22-28` | `querySelector` for timer updates |
| Team Card List Mode | `TeamCard.tsx:171-183` | `classList` manipulation |
| Service Card List Mode | `ServiceCard.tsx:373-375` | `classList` manipulation |

## Phase Structure

### Phase 9: React App Shell
Convert the HTML shell to a single-page React app with React Router.

### Phase 10: View Container Migration
Move `#services-view` and `#teams-view` entirely into React.

### Phase 11: Button State React Migration
Replace all `innerHTML`/`classList` button manipulation with React state.

### Phase 12: Window Globals Elimination
Remove all window function exports; use React context/hooks instead.

### Phase 13: Bootstrap Simplification
Reduce `main.ts` to pure React bootstrap (~10 lines).

### Phase 14: Utility DOM Cleanup
Convert remaining utility DOM operations to React patterns.

### Phase 15: Final Verification
Remove all portal mounting code; single React root.

## Success Criteria

- [ ] Zero `document.getElementById` in application code (except initial mount)
- [ ] Zero `document.querySelector` in application code
- [ ] Zero `.innerHTML` assignments
- [ ] Zero `.classList` manipulation
- [ ] Zero `.addEventListener` (except React's synthetic events)
- [ ] Single `<div id="root">` mount point in HTML
- [ ] `main.ts` under 20 lines (just imports React entry)
- [ ] No `window.ScorecardModules`
- [ ] No `window.*` function exports
- [ ] All 263+ Playwright tests pass

## Testing Strategy

All changes must:
1. Pass all Playwright E2E tests
2. Pass ESLint with zero warnings
3. Build successfully with TypeScript
4. Maintain visual/functional parity
5. Verify no console errors

## Phase Execution Order

Execute phases sequentially:

1. [Phase 9: React App Shell](./09-react-app-shell.md)
2. [Phase 10: View Container Migration](./10-view-container-migration.md)
3. [Phase 11: Button State React Migration](./11-button-state-react.md)
4. [Phase 12: Window Globals Elimination](./12-window-globals-elimination.md)
5. [Phase 13: Bootstrap Simplification](./13-bootstrap-simplification.md)
6. [Phase 14: Utility DOM Cleanup](./14-utility-dom-cleanup.md)
7. [Phase 15: Final Verification](./15-final-verification.md)
