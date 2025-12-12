# Phase 10: View Container Migration

## Objective

Eliminate all DOM `classList` manipulation for view container visibility. Views should be rendered conditionally by React based on route, not toggled via CSS classes.

## Current State

### Navigation.tsx (lines 56-66, 85-96)
```typescript
// DOM manipulation to show/hide views
const servicesView = document.getElementById('services-view');
const teamsView = document.getElementById('teams-view');

if (view === 'services') {
  servicesView.classList.add('active');
  teamsView.classList.remove('active');
} else {
  servicesView.classList.remove('active');
  teamsView.classList.add('active');
}
```

### index.html
```html
<div id="services-view" class="view-content active">...</div>
<div id="teams-view" class="view-content">...</div>
```

### CSS (tabs.css or main.css)
```css
.view-content { display: none; }
.view-content.active { display: block; }
```

## Target State

Views rendered conditionally by React Router (from Phase 9):

```typescript
<Routes>
  <Route path="/services" element={<ServicesView />} />
  <Route path="/teams" element={<TeamsView />} />
</Routes>
```

No `classList` manipulation anywhere.

## Implementation Steps

### Step 1: Verify Phase 9 Complete

Ensure React Router is handling view routing before proceeding.

### Step 2: Remove DOM Manipulation from Navigation.tsx

**Before:**
```typescript
const handleViewChange = useCallback((view: ViewType) => {
  setCurrentView(view);
  history.replaceState(null, '', `#${view}`);

  // Remove this entire block
  const servicesView = document.getElementById('services-view');
  const teamsView = document.getElementById('teams-view');
  if (servicesView && teamsView) {
    if (view === 'services') {
      servicesView.classList.add('active');
      teamsView.classList.remove('active');
    } else {
      servicesView.classList.remove('active');
      teamsView.classList.add('active');
    }
  }

  window.dispatchEvent(new CustomEvent('view-changed', { detail: { view } }));
}, [setCurrentView]);
```

**After:**
```typescript
const handleViewChange = useCallback((view: ViewType) => {
  navigate(`/${view}`);
}, [navigate]);
```

### Step 3: Remove hashchange Handler DOM Manipulation

**Before (lines 78-106):**
```typescript
useEffect(() => {
  const handleHashChange = () => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'teams' || hash === 'services') {
      setCurrentView(hash);

      // Remove this DOM manipulation
      const servicesView = document.getElementById('services-view');
      const teamsView = document.getElementById('teams-view');
      // ... classList manipulation
    }
  };

  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);
  return () => window.removeEventListener('hashchange', handleHashChange);
}, [setCurrentView]);
```

**After:**
```typescript
// No useEffect needed - React Router handles URL sync
// Navigation state comes from useLocation()
```

### Step 4: Remove Zustand View State (Optional)

If using React Router, Zustand's `currentView` state becomes redundant:

```typescript
// Before: Zustand + DOM sync
const currentView = useAppStore(selectCurrentView);
const setCurrentView = useAppStore((state) => state.setCurrentView);

// After: React Router is source of truth
const location = useLocation();
const currentView = location.pathname.includes('teams') ? 'teams' : 'services';
```

Consider keeping Zustand for non-URL state that components need.

### Step 5: Remove view-changed Custom Event

Since React Router handles navigation, the custom event is unnecessary:

```typescript
// Remove this line
window.dispatchEvent(new CustomEvent('view-changed', { detail: { view } }));
```

Search codebase for listeners:
```bash
grep -r "view-changed" docs/src/
```

Update any listeners to use React Router hooks instead.

### Step 6: Clean Up CSS

Remove the `.view-content` visibility toggle rules if they're no longer needed:

```css
/* Can remove these rules */
.view-content { display: none; }
.view-content.active { display: block; }
```

Or keep them but ensure React never adds the class - React simply doesn't render the inactive view.

### Step 7: Update Teams View Data Loading

Currently, `initTeamsView()` is called when switching to teams. With React Router, use route-based data loading:

```typescript
// TeamsView.tsx
export function TeamsView() {
  useEffect(() => {
    // Load teams data when view mounts
    initTeamsView();
  }, []);

  return (
    <div className="view-content">
      <TeamsStatsSection />
      <TeamsControls />
      <TeamGridContainer />
    </div>
  );
}
```

Or use React Router loaders (v6.4+):

```typescript
// With data router
<Route
  path="/teams"
  element={<TeamsView />}
  loader={teamsLoader}
/>

async function teamsLoader() {
  await initTeamsView();
  return null;
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/Navigation.tsx` | Remove all `document.getElementById` and `classList` usage |
| `src/components/views/TeamsView.tsx` | Add data loading on mount |
| `src/main.ts` | Remove `window.initTeamsView` export |
| `src/stores/appStore.ts` | Optionally remove `currentView` state |
| CSS files | Optionally remove `.view-content` toggle rules |

## Verification

1. Run build: `npm run build`
2. Run linting: `npm run lint`
3. Grep for remaining DOM manipulation:
   ```bash
   grep -r "document.getElementById\|classList" docs/src/components/layout/Navigation.tsx
   # Should return nothing
   ```
4. Run tests: `npx playwright test`
5. Manual test:
   - Click Services tab - services view renders
   - Click Teams tab - teams view renders, data loads
   - URL updates correctly
   - Browser back/forward works
   - No console errors

## Estimated Changes

- **Files modified**: 3-5
- **Lines removed**: ~50 (DOM manipulation code)
- **Lines added**: ~10 (useEffect for data loading)

## Success Criteria

- [ ] `Navigation.tsx` has zero `document.getElementById` calls
- [ ] `Navigation.tsx` has zero `classList` manipulation
- [ ] `Navigation.tsx` has zero `window.addEventListener` for hashchange
- [ ] Views render based on React Router route
- [ ] Teams data loads when navigating to `/teams`
- [ ] All E2E tests pass

## Rollback

If issues arise:
1. Restore DOM manipulation in Navigation.tsx
2. Restore hashchange listener
3. Keep view containers in HTML
