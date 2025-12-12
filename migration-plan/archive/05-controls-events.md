# Phase 5: Controls & Event Handlers Migration

## Objective

Migrate all form controls (search, sort, buttons) and their event handlers from vanilla `addEventListener` patterns to React-controlled components.

## Current State Analysis

### Event Listeners in main.ts

**File: `docs/src/main.ts`** - `setupEventListeners()` function (lines 602-751):

```typescript
function setupEventListeners(): void {
  // Search
  const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      window.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
      window.filterAndRenderServices();
    });
  }

  // Filterable stat cards
  document.querySelectorAll('.stat-card.filterable').forEach((card) => {
    card.addEventListener('click', () => { /* filter logic */ });
  });

  // Sort
  const sortSelect = document.getElementById('sort-select') as HTMLSelectElement | null;
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => { /* sort logic */ });
  }

  // Teams view search
  const teamsSearchInput = document.getElementById('teams-search-input');
  // ... more event listeners
}
```

### Inline onclick Handlers in HTML

**File: `docs/index.html`**:

```html
<button onclick="refreshData()">Refresh Data</button>
<button onclick="handleBulkTrigger(event)">Re-run All Stale</button>
<button onclick="handleBulkTriggerAll(event)">Re-run All Installed</button>
<button onclick="window.openTeamEditModal?.('create')">+ Create Team</button>
<button onclick="openCheckAdoptionDashboard(window.allServices)">Check Adoption</button>
<select onchange="changePollingInterval()">...</select>
<button onclick="refreshActionsWidget()">...</button>
<button onclick="toggleActionsWidget()">...</button>
<button onclick="filterActions('all')">...</button>
```

## Migration Steps

### Step 1: Create Services Controls Component

```typescript
// docs/src/components/features/ServicesControls/ServicesControls.tsx

import { useState, useCallback, type ChangeEvent } from 'react';
import { useAppStore } from '../../../stores/appStore';
import { useDebounce } from '../../../hooks/useDebounce';
import { triggerBulkWorkflows, handleBulkTrigger } from '../../../api/workflow-triggers';
import { refreshData } from '../../../app-init';
import styles from './ServicesControls.module.css';

export function ServicesControls() {
  const updateFilters = useAppStore(state => state.updateFilters);
  const filters = useAppStore(state => state.filters);
  const services = useAppStore(state => state.services.all);
  const checksHash = useAppStore(state => state.ui.checksHash);

  const [searchValue, setSearchValue] = useState(filters.search);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debounce search to avoid excessive re-renders
  useDebounce(() => {
    updateFilters({ search: searchValue });
  }, 300, [searchValue]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ sort: e.target.value });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBulkTriggerStale = async () => {
    const { isServiceStale } = await import('../../../services/staleness');
    const staleServices = services.filter(
      s => isServiceStale(s, checksHash) && s.installed
    );

    if (staleServices.length === 0) {
      window.showToast?.('No stale services to trigger', 'info');
      return;
    }

    if (confirm(`Trigger workflows for ${staleServices.length} stale service(s)?`)) {
      // Get button ref for visual feedback - or use state
      await triggerBulkWorkflows(staleServices, /* buttonElement */ null as any);
    }
  };

  const handleBulkTriggerAll = async () => {
    const installedServices = services.filter(s => s.installed);

    if (installedServices.length === 0) {
      window.showToast?.('No installed services to trigger', 'info');
      return;
    }

    if (confirm(`Trigger workflows for ALL ${installedServices.length} installed service(s)?`)) {
      await triggerBulkWorkflows(installedServices, null as any);
    }
  };

  return (
    <section className="controls">
      <input
        type="text"
        placeholder="Search services..."
        className="search-box"
        value={searchValue}
        onChange={handleSearchChange}
      />

      <select
        className="sort-select"
        aria-label="Sort by"
        value={filters.sort}
        onChange={handleSortChange}
      >
        <option value="score-desc">Score: High to Low</option>
        <option value="score-asc">Score: Low to High</option>
        <option value="name-asc">Name: A to Z</option>
        <option value="name-desc">Name: Z to A</option>
        <option value="updated-desc">Recently Updated</option>
      </select>

      <button
        className="refresh-btn"
        onClick={handleRefresh}
        disabled={isRefreshing}
        title="Re-fetch service data from catalog"
      >
        <RefreshIcon spinning={isRefreshing} />
        {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
      </button>

      <button
        className="trigger-btn trigger-btn-bulk"
        onClick={handleBulkTriggerStale}
      >
        <RefreshIcon />
        Re-run All Stale
      </button>

      <button
        className="trigger-btn trigger-btn-neutral"
        onClick={handleBulkTriggerAll}
        title="Trigger scorecard workflow for all installed services"
      >
        <RefreshIcon />
        Re-run All Installed
      </button>

      {/* Team filter dropdown - already a React component via portal */}
      <div id="team-filter-container" className="team-filter-container" />

      {/* Check filter toggle - already a React component via portal */}
      <div id="check-filter-container" className="check-filter-container" />
    </section>
  );
}

function RefreshIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      style={{ marginRight: 6 }}
      className={spinning ? 'spinning' : ''}
    >
      <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
    </svg>
  );
}
```

### Step 2: Create Teams Controls Component

```typescript
// docs/src/components/features/TeamsControls/TeamsControls.tsx

import { useState, useCallback, type ChangeEvent } from 'react';
import { useAppStore } from '../../../stores/appStore';
import { useDebounce } from '../../../hooks/useDebounce';

export function TeamsControls() {
  const teams = useAppStore(state => state.teams);
  const updateTeamsState = useAppStore(state => state.updateTeamsState);
  const openTeamEditModal = useAppStore(state => state.openModal);
  const openCheckAdoptionDashboard = useAppStore(state => state.openModal);

  const [searchValue, setSearchValue] = useState(teams.search);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useDebounce(() => {
    updateTeamsState({ search: searchValue });
  }, 300, [searchValue]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateTeamsState({ sort: e.target.value });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Call refresh teams function
      if (window.refreshTeamsView) {
        await window.refreshTeamsView();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateTeam = () => {
    openTeamEditModal('teamEdit', { mode: 'create' });
  };

  const handleCheckAdoption = () => {
    openCheckAdoptionDashboard('checkAdoption');
  };

  return (
    <section className="controls teams-controls">
      <input
        type="text"
        placeholder="Search teams..."
        className="search-box"
        value={searchValue}
        onChange={handleSearchChange}
      />

      <select
        className="sort-select"
        value={teams.sort}
        onChange={handleSortChange}
      >
        <option value="score-desc">Score: High to Low</option>
        <option value="score-asc">Score: Low to High</option>
        <option value="services-desc">Services: High to Low</option>
        <option value="services-asc">Services: Low to High</option>
        <option value="name-asc">Name: A to Z</option>
        <option value="name-desc">Name: Z to A</option>
      </select>

      <button
        className="refresh-btn"
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        <RefreshIcon spinning={isRefreshing} />
        Refresh Data
      </button>

      <button className="create-btn" onClick={handleCreateTeam}>
        + Create Team
      </button>

      <button
        className="trigger-btn trigger-btn-accent"
        onClick={handleCheckAdoption}
        title="View check adoption rates across all teams"
      >
        <CheckIcon />
        Check Adoption
      </button>
    </section>
  );
}
```

### Step 3: Create useDebounce Hook

```typescript
// docs/src/hooks/useDebounce.ts

import { useEffect, useRef } from 'react';

export function useDebounce(
  callback: () => void,
  delay: number,
  dependencies: unknown[]
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timeoutRef.current = setTimeout(callback, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [...dependencies, delay]);
}

// Alternative: debounced value hook
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### Step 4: Create Controls Portals in Main App

Update `docs/src/components/index.tsx`:

```typescript
// Add imports
import { ServicesControls } from './features/ServicesControls';
import { TeamsControls } from './features/TeamsControls';

// Add portal targets
let servicesControlsEl: HTMLElement | null = null;
let teamsControlsEl: HTMLElement | null = null;

// In initPortalTargets():
servicesControlsEl = document.querySelector('#services-view .controls');
teamsControlsEl = document.querySelector('#teams-view .controls');

if (servicesControlsEl) {
  window.__REACT_MANAGES_SERVICES_CONTROLS = true;
  servicesControlsEl.innerHTML = '';
}
if (teamsControlsEl) {
  window.__REACT_MANAGES_TEAMS_CONTROLS = true;
  teamsControlsEl.innerHTML = '';
}

// In App return, add portals
{servicesControlsEl && createPortal(<ServicesControls />, servicesControlsEl)}
{teamsControlsEl && createPortal(<TeamsControls />, teamsControlsEl)}
```

### Step 5: Update HTML Structure

Simplify `docs/index.html` controls sections:

```html
<!-- Services Controls - React will populate -->
<section class="controls">
    <!-- React portal renders ServicesControls here -->
</section>

<!-- Teams Controls - React will populate -->
<section class="controls teams-controls">
    <!-- React portal renders TeamsControls here -->
</section>
```

### Step 6: Remove Vanilla Event Listeners

Update `docs/src/main.ts`:

```typescript
// REMOVE or mark deprecated:
function setupEventListeners(): void {
  // All these event listeners are now handled by React components:
  // - search-input → ServicesControls
  // - sort-select → ServicesControls
  // - teams-search-input → TeamsControls
  // - teams-sort-select → TeamsControls
  // - stat-card.filterable → ServicesStatsSection (Phase 4)

  // KEEP these for now (handled in Phase 6):
  // - view tab navigation
  // - hashchange listener
  // - team-filter-changed event
}

// Remove the DOMContentLoaded listener that calls setupEventListeners
// or conditionally skip if React manages controls
document.addEventListener('DOMContentLoaded', () => {
  // Only setup event listeners if React is NOT managing controls
  if (!window.__REACT_MANAGES_SERVICES_CONTROLS) {
    setupEventListeners();
  }

  appInit.initializeApp();
});
```

### Step 7: Remove Window Function Exports for Controls

Update `docs/src/main.ts`:

```typescript
// REMOVE these window exports (React components handle directly):
// window.handleBulkTrigger = workflowTriggers.handleBulkTrigger;
// window.handleBulkTriggerAll = workflowTriggers.handleBulkTriggerAll;

// KEEP these (still needed by React as bridge functions):
window.refreshData = appInit.refreshData;
window.showServiceDetail = ...; // etc
```

## Verification Checklist

- [ ] Search input filters services in real-time (debounced)
- [ ] Sort dropdown changes service order
- [ ] Refresh Data button loads new data and shows loading state
- [ ] Re-run All Stale button shows confirmation and triggers workflows
- [ ] Re-run All Installed button shows confirmation and triggers workflows
- [ ] Teams search input filters teams
- [ ] Teams sort dropdown works
- [ ] Create Team button opens modal
- [ ] Check Adoption button opens dashboard
- [ ] No duplicate event handlers (vanilla + React)
- [ ] Keyboard navigation works for all controls
- [ ] Tab order is logical

## Files Modified

| File | Action |
|------|--------|
| `docs/src/components/features/ServicesControls/ServicesControls.tsx` | Create (new) |
| `docs/src/components/features/ServicesControls/index.ts` | Create (new) |
| `docs/src/components/features/TeamsControls/TeamsControls.tsx` | Create (new) |
| `docs/src/components/features/TeamsControls/index.ts` | Create (new) |
| `docs/src/hooks/useDebounce.ts` | Create (new) |
| `docs/src/components/index.tsx` | Add controls portals |
| `docs/index.html` | Simplify controls sections |
| `docs/src/main.ts` | Remove/deprecate setupEventListeners |

## Rollback Instructions

If issues arise:
1. Restore HTML: `git checkout HEAD -- docs/index.html`
2. Restore main.ts: `git checkout HEAD -- docs/src/main.ts`
3. Remove portal code from index.tsx
4. Delete new component files

## Notes for Executing Model

- **Requires Phase 2** (global state) to be complete
- **Requires Phase 4** (stat cards) to be complete (for filter state)
- The debounce hook prevents excessive filtering on every keystroke
- Bulk trigger functions need access to button elements for visual feedback - may need to refactor to use React state instead
- Keep team-filter-container and check-filter-container divs - those are already React portals
- Test that confirmations work correctly (browser confirm dialog)
