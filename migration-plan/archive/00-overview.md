# React Migration Plan: Overview

## Executive Summary

The scorecards dashboard is in a **partial migration state** - React components render as "islands" into the vanilla JS DOM, while significant vanilla TypeScript handles data loading, event coordination, and legacy UI updates. This plan breaks the remaining migration into 8 self-contained phases.

## Current State Assessment

### Already Migrated to React
- Layout: Header, Footer, Navigation, FloatingControls
- Grids: ServiceGridContainer, TeamGridContainer
- Modals: ServiceModal, TeamModal, SettingsModal, CheckFilterModal
- Widgets: ActionsWidget, TeamDashboard, CheckAdoptionDashboard
- UI: Toast system, Badge, Tabs, Modal, StatCard
- State: Zustand store with comprehensive slices

### Remaining Vanilla JS (to be migrated)

| File | Vanilla Patterns | Priority |
|------|------------------|----------|
| `api-explorer.html` | 100% inline vanilla JS | Phase 1 |
| `main.ts` | Event listeners, DOM queries, global state | Phase 2-6 |
| `app-init.ts` | Stat card updates, button states | Phase 4-5 |
| `index.html` | Inline onclick handlers | Phase 5 |
| `workflow-triggers.ts` | Button DOM manipulation | Phase 7 |
| `utils/dom.ts` | DOM utility library | Phase 8 |
| `utils/clipboard.ts` | createElement, appendChild | Phase 8 |
| `services/theme.ts` | document.documentElement | Phase 3 |

### Window Global State (to be removed)
```typescript
// All of these in main.ts need migration to Zustand:
window.allServices
window.filteredServices
window.activeFilters
window.currentSort
window.searchQuery
window.currentChecksHash
window.checksHashTimestamp
window.currentView
window.allTeams
window.filteredTeams
window.teamsSort
window.teamsSearchQuery
window.teamsActiveFilters
window.githubPAT
```

## Migration Phases

| Phase | Name | Description | Complexity | Dependencies |
|-------|------|-------------|------------|--------------|
| 1 | API Explorer | Migrate standalone page to React | Medium | None |
| 2 | Global State | Move window.* to Zustand | Low | None |
| 3 | Theme System | React Context for theming | Low | None |
| 4 | Stats Dashboard | Migrate stat cards to React | Medium | Phase 2 |
| 5 | Controls & Events | React-managed form controls | Medium | Phase 2, 4 |
| 6 | View Navigation | React-based routing/views | Medium | Phase 2, 5 |
| 7 | Button States | React components for triggers | Low | Phase 2 |
| 8 | Final Cleanup | Remove utilities, bridges | Low | All phases |

## Execution Order

```
Phase 1 (API Explorer) ─────────────────────────┐
Phase 2 (Global State) ─────────┬───────────────┤
Phase 3 (Theme System) ─────────┤               │
                                ↓               │
                          Phase 4 (Stats)       │
                                ↓               │
                          Phase 5 (Controls)    │
                                ↓               │
                          Phase 6 (Navigation)  │
                                ↓               │
                          Phase 7 (Buttons)     │
                                ↓               ↓
                          Phase 8 (Cleanup) ────┘
```

Phases 1, 2, and 3 can be executed in parallel. Phases 4-7 are sequential. Phase 8 depends on all others.

## Success Criteria

After full migration:
1. No `document.getElementById()` or `document.querySelector()` in application code
2. No `addEventListener()` in TypeScript files
3. No `innerHTML` assignments outside React components
4. No `window.*` global state variables
5. `utils/dom.ts` deleted entirely
6. `app.js` deleted entirely
7. All onclick handlers in HTML replaced with React event handlers
8. Build produces single React application

## Testing Strategy

Each phase includes:
1. Unit tests for new React components
2. Integration tests for store interactions
3. Manual verification checklist
4. Rollback instructions if needed

## File Organization

```
migration-plan/
├── 00-overview.md          # This file
├── 01-api-explorer.md      # Phase 1 details
├── 02-global-state.md      # Phase 2 details
├── 03-theme-system.md      # Phase 3 details
├── 04-stats-dashboard.md   # Phase 4 details
├── 05-controls-events.md   # Phase 5 details
├── 06-view-navigation.md   # Phase 6 details
├── 07-button-states.md     # Phase 7 details
└── 08-final-cleanup.md     # Phase 8 details
```
