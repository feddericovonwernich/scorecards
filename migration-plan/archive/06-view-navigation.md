# Phase 6: View Navigation Migration

## Objective

Migrate the view switching logic (Services ↔ Teams) from vanilla JavaScript DOM manipulation to React-managed state, including hash-based navigation.

## Current State Analysis

### View Switching in main.ts

**File: `docs/src/main.ts`** - `switchView()` function (lines 197-225):

```typescript
function switchView(view: ViewType): void {
  window.currentView = view;

  // Update tab active states
  document.querySelectorAll('.view-tab').forEach((tab) => {
    const tabEl = tab as HTMLElement;
    tabEl.classList.toggle('active', tabEl.dataset.view === view);
  });

  // Show/hide view containers
  document.querySelectorAll('.view-content').forEach((content) => {
    content.classList.toggle('active', content.id === `${view}-view`);
  });

  // Update URL hash
  history.replaceState(null, '', `#${view}`);

  // Trigger teams initialization
  if (view === 'teams') {
    initTeamsView();
  }
}
```

### Hash Change Handler

```typescript
function handleHashChange(): void {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'teams' || hash === 'services') {
    switchView(hash);
  }
}

window.addEventListener('hashchange', handleHashChange);
```

### View Tab Navigation in setupEventListeners

```typescript
if (!window.__REACT_MANAGES_NAVIGATION) {
  document.querySelectorAll('.view-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const view = tabEl.dataset.view as ViewType;
      if (view) switchView(view);
    });
  });
}
```

### Already Existing React Navigation

**File: `docs/src/components/layout/Navigation.tsx`**:
This component already exists and handles view tabs, but it still syncs with vanilla JS.

**File: `docs/src/components/index.tsx`** - `handleViewChange()` (lines 210-247):
This function syncs React state with vanilla DOM manipulation.

## Migration Steps

### Step 1: Update Navigation Component

The Navigation component already exists. Update it to be the single source of truth:

```typescript
// docs/src/components/layout/Navigation.tsx

import { useCallback, useEffect } from 'react';
import { useAppStore, selectCurrentView } from '../../stores/appStore';

export type ViewType = 'services' | 'teams';

export function Navigation() {
  const currentView = useAppStore(selectCurrentView);
  const setCurrentView = useAppStore(state => state.setCurrentView);

  // Handle view change with URL update
  const handleViewChange = useCallback((view: ViewType) => {
    setCurrentView(view);

    // Update URL hash without triggering hashchange
    history.replaceState(null, '', `#${view}`);

    // Initialize teams view when switching to it
    if (view === 'teams') {
      // Teams data loading is handled by the store/component
      // No need to call initTeamsView() - React components handle it
    }
  }, [setCurrentView]);

  // Sync with URL hash on mount and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'teams' || hash === 'services') {
        setCurrentView(hash);
      }
    };

    // Check initial hash
    handleHashChange();

    // Listen for hash changes (back/forward navigation)
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setCurrentView]);

  return (
    <nav className="view-tabs" role="tablist">
      <button
        className={`view-tab ${currentView === 'services' ? 'active' : ''}`}
        onClick={() => handleViewChange('services')}
        role="tab"
        aria-selected={currentView === 'services'}
        aria-controls="services-view"
      >
        <ServicesIcon />
        Services
      </button>
      <button
        className={`view-tab ${currentView === 'teams' ? 'active' : ''}`}
        onClick={() => handleViewChange('teams')}
        role="tab"
        aria-selected={currentView === 'teams'}
        aria-controls="teams-view"
      >
        <TeamsIcon />
        Teams
      </button>
    </nav>
  );
}

function ServicesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z" />
    </svg>
  );
}

function TeamsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5Z" />
    </svg>
  );
}
```

### Step 2: Create View Container Component

Create a component to handle view visibility:

```typescript
// docs/src/components/layout/ViewContainer.tsx

import { type ReactNode } from 'react';
import { useAppStore, selectCurrentView } from '../../stores/appStore';

interface ViewContainerProps {
  viewId: 'services' | 'teams';
  children: ReactNode;
}

export function ViewContainer({ viewId, children }: ViewContainerProps) {
  const currentView = useAppStore(selectCurrentView);
  const isActive = currentView === viewId;

  return (
    <div
      id={`${viewId}-view`}
      className={`view-content ${isActive ? 'active' : ''}`}
      role="tabpanel"
      aria-labelledby={`${viewId}-tab`}
      hidden={!isActive}
    >
      {children}
    </div>
  );
}
```

### Step 3: Remove Vanilla View Switching

Update `docs/src/main.ts`:

```typescript
// REMOVE the switchView function entirely:
// function switchView(view: ViewType): void { ... }

// REMOVE the handleHashChange function:
// function handleHashChange(): void { ... }

// REMOVE the window exports:
// window.switchView = switchView;
// window.handleHashChange = handleHashChange;

// REMOVE the event listener setup in setupEventListeners:
// handleHashChange();
// window.addEventListener('hashchange', handleHashChange);
// document.querySelectorAll('.view-tab').forEach(...)
```

### Step 4: Update App Component

Remove the duplicate view handling from `docs/src/components/index.tsx`:

```typescript
// REMOVE this entire function (lines 210-247):
// const handleViewChange = useCallback((view: ViewType) => {
//   setCurrentView(view);
//   // Sync with vanilla JS view switching
//   const servicesView = document.getElementById('services-view');
//   const teamsView = document.getElementById('teams-view');
//   ...
// }, [setCurrentView]);

// REMOVE this effect that syncs with vanilla:
// useEffect(() => {
//   const handleVanillaViewChange = (e: Event) => { ... };
//   window.addEventListener('vanilla-view-changed', handleVanillaViewChange);
//   ...
// }, [setCurrentView]);

// Update Navigation portal to not pass props (it manages itself):
{navigation && createPortal(<Navigation />, navigation)}
```

### Step 5: Update HTML Structure (Optional - Full React)

For a complete migration, the view containers can be rendered entirely by React:

```html
<!-- Option A: Keep HTML structure, React controls visibility -->
<div id="services-view" class="view-content active">
    <!-- Content managed by React portals -->
</div>
<div id="teams-view" class="view-content">
    <!-- Content managed by React portals -->
</div>

<!-- Option B: React renders everything -->
<main class="container">
    <div id="react-navigation"></div>
    <div id="react-views"></div>
</main>
```

For now, use Option A to maintain backwards compatibility.

### Step 6: Handle Teams View Initialization

The teams view currently requires initialization when shown. Move this to React:

```typescript
// docs/src/components/containers/TeamGridContainer.tsx

import { useEffect } from 'react';
import { useAppStore, selectCurrentView, selectTeamsAll } from '../../stores/appStore';
import { loadTeams } from '../../api/registry';

export function TeamGridContainer() {
  const currentView = useAppStore(selectCurrentView);
  const teams = useAppStore(selectTeamsAll);
  const setTeams = useAppStore(state => state.setTeams);
  const setFilteredTeams = useAppStore(state => state.setFilteredTeams);

  // Load teams when view becomes active and teams aren't loaded
  useEffect(() => {
    if (currentView === 'teams' && teams.length === 0) {
      loadTeamsData();
    }
  }, [currentView, teams.length]);

  const loadTeamsData = async () => {
    try {
      const { teams: teamsData } = await loadTeams();
      // Process and set teams...
      setTeams(processedTeams);
      setFilteredTeams(processedTeams);
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  };

  // ... rest of component
}
```

### Step 7: Update Store for View State

The store already has `currentView` in the `ui` slice. Ensure it's properly typed:

```typescript
// In docs/src/stores/appStore.ts

export type ViewType = 'services' | 'teams';

export interface UIState {
  currentView: ViewType;
  // ... other fields
}
```

## Verification Checklist

- [ ] Clicking "Services" tab shows services view
- [ ] Clicking "Teams" tab shows teams view
- [ ] URL updates to `#services` or `#teams` when changing views
- [ ] Direct URL `#teams` loads teams view on page load
- [ ] Browser back/forward buttons work correctly
- [ ] Teams data loads when teams view is first shown
- [ ] No duplicate view switching logic (vanilla + React)
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] ARIA attributes correct for accessibility

## Files Modified

| File | Action |
|------|--------|
| `docs/src/components/layout/Navigation.tsx` | Update to be single source of truth |
| `docs/src/components/layout/ViewContainer.tsx` | Create (optional - for full React views) |
| `docs/src/components/index.tsx` | Remove duplicate view handling |
| `docs/src/main.ts` | Remove switchView, handleHashChange |
| `docs/src/containers/TeamGridContainer.tsx` | Add lazy teams loading |

## Rollback Instructions

If issues arise:
1. `git checkout HEAD -- docs/src/main.ts`
2. `git checkout HEAD -- docs/src/components/index.tsx`
3. `git checkout HEAD -- docs/src/components/layout/Navigation.tsx`

## Notes for Executing Model

- **Requires Phase 2** (global state) and **Phase 5** (controls) to be complete
- The Navigation component already exists and works - this phase just removes the vanilla JS duplicate
- Be careful with the teams initialization - it may need data from services
- Test URL-based navigation thoroughly (direct links, back/forward)
- Consider keeping vanilla event listeners during testing, then remove once React works
- The `initTeamsView()` function does complex work - ensure all its functionality is covered
