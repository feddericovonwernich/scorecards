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

`.github/workflows/sync-docs.yml` builds reviewed `main` with `npm ci` and
`npm run build`, syncs `docs/dist/` to `catalog:/docs`, and uploads that directory
for an explicit GitHub Pages deployment. Repository and build-dependency changes
covered by the workflow's path filter trigger publication; manual dispatch must
select `main`. The public URL and Vite base path do not change.

See [Token Requirements](../documentation/reference/token-requirements.md#token-overview)
for publication credentials and job-scoped permissions. The Pages deployment
uses the `github-pages` environment.
The Pages artifact comes from this run, never a pull request or another run.
Fork and non-main dispatches are excluded; superseded source revisions fail
before synchronization and again before deployment. Whole-workflow concurrency
serializes UI publication without cancelling an in-progress push/deployment.

`catalog:/docs` remains the generated UI directory, with `CNAME` and `.nojekyll`
preserved. Files outside it (results, registry, badges, checks metadata and other
catalog files) are not replaced. Concurrent catalog pushes are rebased before
retry; conflicting UI changes fail rather than overwrite data. The checks-hash
writer uses a normal non-force push: a competing writer can reject it safely;
dispatch a fresh **Update Checks Hash** run on `main` after that writer finishes.
Catalog API/raw-content consumers continue to read the `catalog` branch, not
the Pages artifact.

### Coordinated transition from legacy Pages

Do not switch Pages settings before the workflow PR is integrated with green
checks. Implementation/local checks do not publish the site. No second-person
approval is required for the authorized pilot; PR-only integration and checks
still apply.

1. Before integration, record the current Pages `html_url`, `build_type`,
   `source`, `cname`, HTTPS setting, deployed revision and `catalog` SHA. Retain
   the known-good `catalog:/docs` tree for rollback, including any domain file.
   Existing central settings are legacy `catalog:/docs` at
   `https://feddericovonwernich.github.io/scorecards/`; verify rather than
   assuming they are unchanged.
2. Confirm Actions allows the pinned Pages actions and native token writes to
   `catalog`. Keep `main` PR protections intact. Configure `github-pages` to
   allow only `main` (no tag deployments); do not broaden branch rules or add
   a reviewer requirement for the pilot. If organization policy or catalog
   protection prevents these minimal permissions, report the specific rule;
   do not substitute a broader PAT or bypass.
3. Merge through the approved PR/checks process. The merge-triggered workflow
   may sync/upload but its deployment check intentionally fails while Pages
   is legacy. Wait for any old legacy Pages runs to finish before cutover.
   A successful catalog push is **not** deployment evidence:
   `GITHUB_TOKEN` pushes do not trigger legacy Pages builds.
4. The authorized operator now selects **Settings → Pages → Build and
   deployment → Source → GitHub Actions** (`build_type: workflow`). Preserve
   custom-domain, DNS and HTTPS settings; do not delete/recreate the site.
   `CNAME` is retained for rollback but workflow Pages domain configuration is
   controlled by Settings/API, not the artifact. This setting/environment
   operation is separate from implementing the PR.
5. Dispatch a **fresh Sync Catalog UI** run on current `main`, not an old
   run/revision. Even an unchanged `catalog:/docs` uploads and deploys.
   If `main` advances and a freshness guard rejects the run, dispatch again
   on current `main`; do not bypass the guard or reuse an old artifact.
6. Record the run URL, source SHA, catalog commit, artifact ID, successful
   `deploy-pages` result and `github-pages` environment deployment URL.
   Check Pages reports workflow mode at the original URL. In a fresh browser
   context, load that URL and compare `index.html` and its hashed JS/CSS asset
   URLs/bytes with the run's artifact. Verify Services/Teams routes and API
   Explorer work and real catalog results still load. Check the remediation
   control only against an eligible evaluated service; do not dispatch a
   recipe or infer activation from deployment. An old `status: built`, a
   successful upload or a successful git push alone proves none of this.

### Safe rollback

Stop new sync dispatches and disable the sync workflow temporarily; wait for
in-flight sync/deploy runs to finish so they cannot overwrite recovery. Record
their outcome. An authorized operator can restore only `catalog:/docs` from the
recorded known-good commit in a new, non-force catalog commit, preserving newer
results/registry/checks metadata and domain configuration. Never reset the
entire catalog branch. Switch Pages back to **Deploy from a branch →
catalog → /docs**, retaining URL/domain/HTTPS settings. If a restored build is
needed, use an authorized operator push to that source after switching (not a
`GITHUB_TOKEN` push), or the operator's supported Pages build request.
Wait for the legacy Pages deployment and verify the served files at the same
URL against the known-good tree. Leave the workflow disabled until a corrective
PR passes checks and the coordinated workflow transition is repeated. Do not
restore expired PAT dependencies or change main directly.

GitHub contracts:
[custom workflows and required permissions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
[publishing sources, token-trigger limitation and domains](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

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
