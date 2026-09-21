# Scorecards Catalog UI

This directory contains the catalog web UI for viewing scorecard results across all repositories.

Eligible failed checks may offer a PR-only remediation button when results include validated capability metadata and evaluation provenance. Execution is centrally authorized and disabled by default; it never changes the visible score optimistically. See the [remediation architecture, API correlation and rollout contract](../documentation/architecture/flows/remediation-flow.md).

## Technology Stack

| Technology   | Version | Purpose                 |
| ------------ | ------- | ----------------------- |
| React        | 19.2.0  | UI framework            |
| TypeScript   | 5.9.3   | Type-safe JavaScript    |
| Vite         | 5.4.0   | Build tool & dev server |
| Zustand      | 5.0.9   | State management        |
| React Router | 7.10.1  | Client-side routing     |

## Structure

```
docs/
├── index.html              # Main catalog page (React root)
├── api-explorer.html       # API exploration interface
├── css/                    # Modular CSS
│   ├── main.css            # Entry point with @imports
│   ├── base/               # Reset, variables, typography
│   ├── components/         # Buttons, cards, modals, etc.
│   ├── features/           # Stats, controls, teams, etc.
│   ├── layout/             # Container, header, footer
│   └── utilities/          # Animations, helpers, responsive
└── src/                    # React + TypeScript source
    ├── main.tsx            # Application entry point
    ├── App.tsx             # Router configuration & layout
    ├── app-init.ts         # Data initialization
    ├── components/
    │   ├── features/       # Business components
    │   │   ├── ServiceCard.tsx
    │   │   ├── TeamCard.tsx
    │   │   ├── ServiceModal/
    │   │   ├── TeamModal/
    │   │   ├── ActionsWidget/
    │   │   ├── SettingsModal/
    │   │   └── ModalOrchestrator.tsx
    │   ├── layout/         # Header, Footer, Navigation
    │   ├── ui/             # Reusable UI (Badge, Modal, Toast, Tabs)
    │   ├── views/          # Page views (ServicesView, TeamsView)
    │   └── containers/     # Grid containers
    ├── stores/             # Zustand state management
    │   ├── appStore.ts     # Main application store
    │   └── accessor.ts     # Store access utilities
    ├── hooks/              # Custom React hooks
    │   ├── useTheme.ts
    │   ├── useDebounce.ts
    │   └── useWorkflowPolling.ts
    ├── api/                # API clients
    │   ├── github.ts       # GitHub API interactions
    │   └── registry.ts     # Registry data fetching
    ├── config/             # Configuration constants
    │   ├── constants.ts    # Timing, API params, storage keys
    │   ├── deployment.ts   # Repo owner, API version
    │   ├── scoring.ts      # Rank thresholds, colors
    │   ├── workflows.ts    # Workflow filenames, polling
    │   └── icons.ts        # SVG icon definitions
    ├── services/           # Business logic
    │   ├── auth.ts         # Token management
    │   └── staleness.ts    # Staleness detection
    ├── types/              # TypeScript definitions
    └── utils/              # Utility functions
        ├── formatting.ts   # Date/text formatting
        ├── statistics.ts   # Score calculations
        └── crypto.ts       # MD5 hashing for Gravatar
```

## Architecture

### Component-Based Design

The catalog uses a modern React architecture with clear separation of concerns:

**Views** (`src/components/views/`)

- `ServicesView.tsx` - Services grid with filtering and sorting
- `TeamsView.tsx` - Teams dashboard with aggregated statistics

**Features** (`src/components/features/`)

- Business logic components like modals, cards, widgets
- Each feature is self-contained with its own state handling

**UI Components** (`src/components/ui/`)

- Reusable presentational components (Badge, Modal, Toast, Tabs)
- No business logic, purely visual

**Layout** (`src/components/layout/`)

- Header, Footer, Navigation components
- Consistent page structure

### State Management

See [State Management](../documentation/architecture/catalog-ui.md#state-management)
for the Zustand state contract and filter/modal ownership.

### Routing

`App.tsx` uses React Router's `HashRouter` without a path basename. Canonical URLs
are `/scorecards/#/services` and `/scorecards/#/teams`; the root route redirects
to Services. Reloading or using browser Back/Forward needs no server-side SPA fallback.

At startup, `main.tsx` normalizes the legacy `#services` and `#teams` fragments,
preserving the pathname and query. Static `services/` and `teams/` compatibility
entries redirect old path URLs to the corresponding hash route with
`location.replace`, preserving query parameters when JavaScript is enabled.
They also provide a fallback link. Other missing paths remain 404 responses.

## Development

### Local Development

```bash
# Start Vite dev server with hot reload
npm run dev

# Open http://localhost:5173/scorecards/
```

### Building

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run React component tests
npm run test:react

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Type Checking

```bash
# Check TypeScript types
npm run typecheck

# Lint code
npm run lint
```

## Deployment

The catalog is automatically deployed to GitHub Pages from the `catalog` branch.

In repository **Settings → Pages**, select **Deploy from a branch**, the `catalog`
branch, and `/docs`. That directory must contain the compiled UI published by the
sync workflow. Wait for the Pages deployment to complete, then open the URL shown
in Settings → Pages and confirm the catalog is accessible.

The workflow `.github/workflows/sync-docs.yml` handles synchronization:

1. Changes to `docs/` on main branch trigger sync workflow
2. Vite builds the production bundle
3. Built files are committed to catalog branch
4. GitHub Pages serves from catalog branch

Publish `docs/dist/` intact, including Vite's compiled `api-explorer.html`; copying
the source HTML over it breaks its module and stylesheet URLs. The build also
includes the [routing compatibility entries](#routing).

The [Playwright configuration](../playwright.config.js) builds and serves the artifact
with Python's static file server, without SPA fallback. The
`tests/e2e/static-delivery.spec.js` suite checks compiled Explorer assets,
compatibility entries, and real 404 responses. Vite preview remains useful for
manual previews, but is not the static-delivery test server.

## Key Patterns

### Configuration Constants

Never hardcode values. Use config files:

```typescript
import { TIMING, API_CONFIG } from '../config/constants';
import { SCORING, getRankForScore } from '../config/scoring';

// Use constants
setTimeout(callback, TIMING.BUTTON_FEEDBACK);
const rank = getRankForScore(85);
```

### CSS Variables

Never hardcode colors. Use CSS variables:

```typescript
import { getCssVar } from '../utils/css';

// Access CSS variable
const color = getCssVar('--color-success');
```

### Custom Hooks

Encapsulate reusable logic in hooks:

```typescript
import { useDebounce } from '../hooks/useDebounce';
import { useTheme } from '../hooks/useTheme';

const debouncedSearch = useDebounce(searchTerm, 300);
const { theme, toggleTheme } = useTheme();
```

## Related Documentation

- [Architecture Overview](../documentation/architecture/overview.md) - System-wide architecture
- [Catalog UI Architecture](../documentation/architecture/catalog-ui.md) - Detailed UI documentation
