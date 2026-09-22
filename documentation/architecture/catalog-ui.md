# Catalog UI Architecture

This document describes the architecture and features of the Scorecards catalog UI.

## Overview

The catalog UI is a React single-page application served via GitHub Pages. It provides a comprehensive interface for browsing service scorecards, triggering updates, and exploring service quality metrics.

Eligible failed checks can offer an optional remediation action. `ServiceModal` retains evaluation provenance on load and refresh; `ChecksTab` keeps per-check request state and links the correlated central workflow run without optimistically changing the score. Dispatch uses the shared GitHub API client, handles both 200 and 204 receipts and never attributes an unrelated latest run. See the [remediation contract and diagrams](flows/remediation-flow.md) for authorization, correlation and activation policy.

## Technology Stack

| Technology   | Version | Purpose                       |
| ------------ | ------- | ----------------------------- |
| React        | 19.2.0  | Component-based UI framework  |
| TypeScript   | 5.9.3   | Static typing and IDE support |
| Vite         | 5.4.0   | Build tool with HMR           |
| Zustand      | 5.0.9   | Lightweight state management  |
| React Router | 7.10.1  | Client-side routing           |

## Architecture

### Component Hierarchy

```
App.tsx
├── Header
│   ├── Navigation (Services | Teams)
│   └── ThemeToggle
├── Routes
│   ├── ServicesView
│   │   ├── ServicesControls (search, filters, sort)
│   │   ├── StatsSection (rank distribution)
│   │   └── ServiceGridContainer
│   │       └── ServiceCard[] (clickable → ServiceModal)
│   └── TeamsView
│       ├── TeamsControls (search, filters)
│       ├── StatsSection (team statistics)
│       └── TeamGridContainer
│           └── TeamCard[] (clickable → TeamModal)
├── ModalOrchestrator
│   ├── ServiceModal
│   ├── TeamModal
│   ├── SettingsModal
│   └── CheckFilterModal
├── ActionsWidget (floating, collapsible)
├── FloatingControls
└── Footer
```

### File Structure

```
docs/src/
├── main.tsx                    # Entry point
├── App.tsx                     # Router & layout
├── app-init.ts                 # Data bootstrapping
├── components/
│   ├── features/               # Business components
│   │   ├── ServiceCard.tsx
│   │   ├── TeamCard.tsx
│   │   ├── ServiceModal/       # Multi-file component
│   │   ├── TeamModal/
│   │   ├── ActionsWidget/
│   │   ├── SettingsModal/
│   │   ├── CheckFilterModal/
│   │   └── ModalOrchestrator.tsx
│   ├── layout/                 # Structural components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   ├── ui/                     # Reusable primitives
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── Tabs.tsx
│   ├── views/                  # Page-level components
│   │   ├── ServicesView.tsx
│   │   └── TeamsView.tsx
│   └── containers/             # Data containers
│       ├── ServiceGridContainer.tsx
│       └── TeamGridContainer.tsx
├── stores/                     # Zustand stores
│   ├── appStore.ts
│   └── accessor.ts
├── hooks/                      # Custom React hooks
├── api/                        # API clients
├── config/                     # Constants & configuration
├── services/                   # Business logic
├── types/                      # TypeScript definitions
└── utils/                      # Utility functions
```

### State Management

The single Zustand store groups `services`, `teams`, `filters`, `auth`, `ui`, modal data, and Actions widget state.

Service controls keep their filter state in `filters`: rank filters (`active`), search text, sort order, selected teams (`teamFilter`), and check filters (`checkFilters`). Store-connected controls update these fields with `updateFilters`; `filterAndSortServices` derives the displayed service list. Team search and sorting are separate `teams` state.

`ui.activeModal` is the single authority for the Settings modal: `ModalOrchestrator` selects it, opens it with `openModal('settings')`, and closes it with `closeModal`. The orchestrator keeps the visibility and data of its other modals in local component state.

The shared `Modal` primitive is a portalled native `<dialog>`: it uses `showModal()`, manages body scroll and focus restoration, and handles Escape and intentional backdrop clicks according to its close options.

### Routing

For hash-based route structure, legacy route handling, and static-hosting constraints, see the [Routing guide](../../docs/README.md#routing).

### Static Delivery

For the catalog build, catalog-branch publication, and GitHub Pages configuration, see the [Deployment guide](../../docs/README.md#deployment).

## Core Features

### Service Catalog

**Location**: `components/views/ServicesView.tsx`

**Capabilities:**

- **Grid display** - Responsive card grid; narrow layouts stack controls and use a single service column
- **Search** - Real-time filtering by service name, team, description
- **Rank filtering** - Filter by Platinum, Gold, Silver, Bronze
- **Check filtering** - Include/exclude by specific check results
- **Sorting** - Sort by score, name, team, last updated
- **Staleness indicators** - Visual warning for outdated scorecards

**Data Source:** Fetches `registry/all-services.json` from catalog branch

### Service Modal

**Location**: `components/features/ServiceModal/`

**Tabs:**

- **Checks** - Individual check results with pass/fail status
- **API** - OpenAPI spec viewer (if available)
- **Contributors** - Repository contributors with Gravatar
- **Workflows** - GitHub Actions workflow status
- **Badges** - Embeddable badge code snippets
- **Links** - Quick links to repo, docs, API spec

### Teams View

**Location**: `components/views/TeamsView.tsx`

**Features:**

- **Team cards** - Aggregated statistics per team
- **Check adoption** - Which checks each team has adopted
- **Score distribution** - Team-level rank breakdown

### Staleness Detection

**How it works:**

1. Each service's registry entry includes `checks_hash`
2. UI fetches `current-checks-hash.txt` from catalog branch
3. Compares service hash vs current hash
4. Visual indicator shows services needing re-scoring

**See [Staleness Detection Flow](flows/staleness-detection-flow.md) for details.**

## Advanced Features

### Settings Modal

**Location**: `components/features/SettingsModal/`

**Purpose:** Configure GitHub PAT for enhanced API access

**Features:**

- Token validation before saving
- Rate limit display
- Permission scope checking
- In-memory token storage

**Why Needed:**

- Unauthenticated GitHub API: 60 requests/hour
- Authenticated GitHub API: 5000 requests/hour
- Enables workflow triggering (requires write access)

### Actions Widget

**Location**: `components/features/ActionsWidget/`

**Purpose:** Real-time monitoring of running scorecard workflows

**Features:**

- **Auto-refresh** - Adaptive polling intervals:
  - 15s when workflows running
  - 30s when recently completed
  - 5m when idle
- **Status display** - in_progress, queued, completed, failed
- **Duration tracking** - Runtime for active workflows
- **Direct links** - Click to view workflow on GitHub

### Workflow Triggering

**Location**: `api/workflow-triggers-react.ts`

**Capabilities:**

- Single service trigger
- Bulk trigger for stale services
- Manual dispatch via `workflow_dispatch` API

**Requirements:**

- GitHub PAT with `workflow` scope
- Target service must have scorecards.yml installed

### API Explorer

**Location**: `docs/api-explorer.html`, `pages/ApiExplorer/`

**Features:**

- Swagger UI integration
- Auto-detection of OpenAPI specs
- Support for OpenAPI 2.0, 3.0, 3.1

## Data Flow

### Initial Load

```
main.tsx
  └── App.tsx
        └── app-init.ts
              ├── fetch registry/all-services.json
              ├── fetch current-checks-hash.txt
              ├── populate Zustand store
              └── render views
```

### User Interactions

```
User clicks ServiceCard
  └── window.showServiceDetail(org, repo)
        └── ModalOrchestrator updates local service-modal state
              └── ServiceModal renders and loads its data
```

### Workflow Triggering

```
User clicks "Trigger Update"
  └── Obtain configured PAT
        └── POST workflow_dispatch to GitHub API
              └── ActionsWidget polls for status
                    └── Catalog updates when workflow commits
```

## Custom Hooks

| Hook                        | Purpose                       |
| --------------------------- | ----------------------------- |
| `useTheme()`                | Theme state and toggle        |
| `useDebounce(value, delay)` | Debounced value updates       |
| `useWorkflowPolling()`      | Workflow status polling       |
| `useButtonState()`          | Button loading/success states |

## Configuration

Configuration constants live in `src/config/`:

| File            | Contents                                |
| --------------- | --------------------------------------- |
| `constants.ts`  | Timing values, API params, storage keys |
| `deployment.ts` | Repository owner, API version           |
| `scoring.ts`    | Rank thresholds (90/75/50), colors      |
| `workflows.ts`  | Workflow filenames, polling intervals   |
| `icons.ts`      | SVG icon definitions                    |

## Testing

### Unit Tests

```bash
npm run test:react
```

Uses Jest + React Testing Library for component tests.

### E2E Tests

```bash
npm run test:e2e
```

See the [test suite guide](../../tests/README.md) for Playwright usage and fixtures.

## Security Considerations

- **Client-side only** - No backend server; all processing in browser
- **Token storage** - PAT stays in memory for the current page session
- **No token transmission** - Token sent only to GitHub API
- **HTTPS enforced** - GitHub Pages requires HTTPS
- **Read-only default** - Most features work without authentication

## Performance

- **Code splitting** - Vite handles automatic chunk splitting
- **Lazy loading** - Modal content loaded on demand
- **Client-side filtering** - No server requests for search/filter
- **Memoization** - React.memo and useMemo for expensive computations
- **Adaptive polling** - Actions widget adjusts refresh rate

## Related Documentation

- [Architecture Overview](overview.md) - System-wide architecture
- [Staleness Detection Flow](flows/staleness-detection-flow.md) - How staleness detection works
- [docs/README.md](../../docs/README.md) - Frontend development guide
