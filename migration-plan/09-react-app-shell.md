# Phase 9: React App Shell

## Objective

Convert the multi-portal React Islands architecture to a single-page React application with proper React Router for view navigation.

## Current State

### HTML Shell (`index.html`)
- Multiple mount points: `#react-root`, `#react-header`, `#react-footer`, `#react-navigation`, `#react-floating-controls`
- View containers managed by HTML: `#services-view`, `#teams-view` with `.active` CSS class
- Portal targets: `#services-grid`, `#teams-grid`, `.services-stats`, `.teams-stats`, `.controls`

### React Entry (`components/index.tsx`)
- Uses `createPortal` to mount React components into various DOM locations
- 10+ portal targets initialized in `initPortalTargets()`
- App component orchestrates all portals

## Target State

### Single React Root
```html
<body>
  <div id="root"></div>
  <script type="module" src="src/main.tsx"></script>
</body>
```

### React Router Navigation
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Navigation />
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/services" replace />} />
          <Route path="/services" element={<ServicesView />} />
          <Route path="/teams" element={<TeamsView />} />
        </Routes>
      </main>
      <Footer />
      <FloatingControls />
      <Modals />
    </BrowserRouter>
  );
}
```

## Implementation Steps

### Step 1: Install React Router

```bash
npm install react-router-dom
```

### Step 2: Create View Components

Create `docs/src/components/views/ServicesView.tsx`:
```typescript
export function ServicesView() {
  return (
    <div className="view-content">
      <ServicesStatsSection />
      <ServicesControls />
      <ServiceGridContainer />
    </div>
  );
}
```

Create `docs/src/components/views/TeamsView.tsx`:
```typescript
export function TeamsView() {
  return (
    <div className="view-content">
      <TeamsStatsSection />
      <TeamsControls />
      <TeamGridContainer />
    </div>
  );
}
```

### Step 3: Update Navigation Component

Replace DOM manipulation with React Router:

```typescript
import { useNavigate, useLocation } from 'react-router-dom';

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname === '/teams' ? 'teams' : 'services';

  const handleViewChange = (view: ViewType) => {
    navigate(`/${view}`);
  };

  // ... rest of component using currentView and handleViewChange
}
```

### Step 4: Create New App Component

Create `docs/src/App.tsx`:
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header, Footer, Navigation, FloatingControls } from './components/layout';
import { ServicesView, TeamsView } from './components/views';
import { ToastContainer } from './components/ui';
import { ModalOrchestrator } from './components/features/ModalOrchestrator';

export function App() {
  return (
    <BrowserRouter basename="/scorecards">
      <Header />
      <main className="container">
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/services" replace />} />
          <Route path="/services" element={<ServicesView />} />
          <Route path="/teams" element={<TeamsView />} />
        </Routes>
      </main>
      <Footer />
      <FloatingControls />
      <ModalOrchestrator />
      <ToastContainer />
    </BrowserRouter>
  );
}
```

### Step 5: Create Modal Orchestrator

Extract modal state management from current App to dedicated component:

```typescript
// docs/src/components/features/ModalOrchestrator.tsx
export function ModalOrchestrator() {
  // All modal state and handlers currently in App component
  // ServiceModal, TeamModal, CheckFilterModal, SettingsModal, etc.
}
```

### Step 6: Update main.tsx

Simplify to pure React bootstrap:

```typescript
// docs/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/main.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
```

### Step 7: Update index.html

Simplify to single mount point:

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
    // Theme flash prevention (keep this - runs before React)
    (function() {
      const savedTheme = localStorage.getItem('theme');
      const osPrefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', savedTheme || (osPrefersDark ? 'dark' : 'light'));
    })();
  </script>
  <link rel="stylesheet" href="css/main.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="src/main.tsx"></script>
</body>
</html>
```

### Step 8: Handle Hash-Based URLs (Migration Path)

For backwards compatibility during migration, support both hash and path routing:

```typescript
// Redirect hash URLs to path URLs
useEffect(() => {
  if (window.location.hash === '#teams') {
    navigate('/teams', { replace: true });
  } else if (window.location.hash === '#services') {
    navigate('/services', { replace: true });
  }
}, []);
```

### Step 9: Update Vite Config

Configure React Router for GitHub Pages:

```typescript
// vite.config.ts
export default defineConfig({
  base: '/scorecards/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'api-explorer': resolve(__dirname, 'api-explorer.html'),
      },
    },
  },
});
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main App component with Router |
| `src/components/views/ServicesView.tsx` | Services view container |
| `src/components/views/TeamsView.tsx` | Teams view container |
| `src/components/views/index.ts` | View exports |
| `src/components/features/ModalOrchestrator.tsx` | Modal state management |

## Files to Modify

| File | Changes |
|------|---------|
| `index.html` | Remove all mount points except `#root` |
| `src/main.ts` → `src/main.tsx` | Simplify to React bootstrap |
| `src/components/layout/Navigation.tsx` | Use React Router |
| `src/components/index.tsx` | Remove portal logic, re-export from App |
| `vite.config.ts` | Update entry points |
| `package.json` | Add react-router-dom |

## Files to Delete

None in this phase (portal code removed in Phase 15).

## Verification

1. Run build: `npm run build`
2. Run linting: `npm run lint`
3. Run tests: `npx playwright test`
4. Manual test:
   - Navigate to `/services` - services view renders
   - Navigate to `/teams` - teams view renders
   - Click navigation tabs - URL updates, view changes
   - Browser back/forward works
   - Direct URL access works (`/scorecards/teams`)
   - Legacy hash URLs redirect (`#teams` → `/teams`)

## Estimated Changes

- **Files created**: 5
- **Files modified**: 6
- **Lines added**: ~200
- **Lines removed**: ~100 (portal setup code)

## Dependencies

- `react-router-dom@6.x`

## Rollback

If issues arise:
1. Restore `index.html` with multiple mount points
2. Restore portal mounting in `components/index.tsx`
3. Remove React Router usage from Navigation
