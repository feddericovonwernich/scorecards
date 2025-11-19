# Catalog UI Architecture

This document describes the architecture and features of the Scorecards catalog UI.

## Overview

The catalog UI is a static web application served via GitHub Pages from the catalog branch. It provides a comprehensive interface for browsing service scorecards, triggering updates, and exploring service quality metrics.

## Architecture

### Technology Stack

- **Vanilla JavaScript** - ES6 modules, no framework dependencies
- **Modular Design** - Components split into separate modules
- **Static Hosting** - GitHub Pages serves from catalog branch docs/ directory
- **Client-side Rendering** - Fetches data from JSON files in catalog branch

### File Structure

```
docs/
├── index.html          # Main catalog page
├── api-explorer.html   # OpenAPI spec explorer
├── app.js              # Main application entry point
├── modules/
│   ├── api.js         # GitHub API client
│   ├── filters.js     # Table filtering logic
│   ├── renderer.js    # DOM rendering
│   ├── settings.js    # Settings management
│   ├── actions.js     # Actions widget
│   └── ...
└── styles/
    └── *.css
```

### Sync Workflow

The UI is kept in sync via the `sync-docs.yml` workflow:

1. Changes to `docs/` on main branch trigger sync workflow
2. Workflow uses rsync to copy files to catalog branch
3. GitHub Pages automatically updates from catalog branch
4. No manual deployment needed

## Core Features

### Service Catalog Table

**Location**: docs/index.html (main table)

**Capabilities**:
- **Sortable columns** - Click headers to sort by score, rank, team, etc.
- **Search filter** - Real-time filtering by service name, team, description
- **Rank badges** - Visual indicators (Platinum, Gold, Silver, Bronze)
- **Score display** - Percentage score with color coding
- **Details expansion** - Click row to see individual check results

**Data Source**: Fetches `registry/all-services.json` from catalog branch

### Check Details View

**Location**: Expanded row in main table

**Shows**:
- Individual check results (pass/fail)
- Points awarded vs possible
- Check categories
- Timestamp of last run
- Links to relevant files (README, OpenAPI spec, etc.)

### Staleness Detection

**How it Works**:
1. Each service's registry entry includes `checks_hash` (hash when it was scored)
2. UI fetches `current-checks-hash.txt` from catalog branch
3. Compares service hash vs current hash
4. Visual indicator shows services needing re-scoring

**Visual Indicators**:
- ⚠️ Warning icon for stale scorecards
- Highlighted rows
- Tooltip explaining staleness

**See [Staleness Detection Flow](flows/staleness-detection-flow.md) for detailed diagram and mechanics.**

## Advanced Features

### Settings Management

**Location**: docs/modules/settings.js, Settings modal in UI

**Purpose**: Store GitHub Personal Access Token for enhanced API access

**Features**:
- **Secure Storage** - Token stored in browser localStorage only
- **Validation** - Tests token before saving
- **Rate Limiting** - Shows API quota usage
- **Permissions Check** - Validates token has required scopes
- **Faster API Access** - Authenticated requests have higher rate limits
- **Workflow Triggering** - Required for dispatching scorecards workflows

**Why Needed**:
- Unauthenticated GitHub API: 60 requests/hour
- Authenticated GitHub API: 5000 requests/hour
- Enables workflow triggering (requires write access)

### Actions Widget

**Location**: docs/modules/actions.js, Actions panel in UI

**Purpose**: Real-time monitoring of running scorecard workflows

**Features**:
- **Auto-refresh** - Polls GitHub API at adaptive intervals:
  - 15s when workflows running
  - 30s when recently completed
  - 5m when idle
- **Status Display** - Shows in_progress, queued, completed, failed
- **Duration Tracking** - Shows runtime for active workflows
- **Conclusion Icons** - ✅ success, ❌ failure, ⏭️ skipped
- **Direct Links** - Click to view workflow run on GitHub
- **Manual Refresh** - Button to force immediate update

**API Usage**: `GET /repos/{owner}/{repo}/actions/runs` filtered by workflow_id

### Workflow Triggering

**Location**: docs/modules/api.js triggerWorkflow function

**Capabilities**:
- **Single Service** - Trigger scorecard for one service
- **Bulk Trigger** - Re-run all stale services at once
- **Manual Dispatch** - `workflow_dispatch` API event

**Requirements**:
- GitHub PAT with `workflow` scope (stored in Settings)
- Target service must have scorecards.yml installed
- Uses `trigger-service-workflow.yml` in scorecards repo

**Flow**:
1. User clicks "Trigger Update" button
2. UI validates PAT is configured
3. Dispatches workflow_dispatch event via API
4. Actions widget shows queued/running status
5. On completion, catalog automatically updates

### API Explorer

**Location**: docs/api-explorer.html

**Purpose**: Browse OpenAPI specifications for services with documented APIs

**Features**:
- **Swagger UI Integration** - Full-featured API documentation viewer
- **Auto-detection** - Shows services with openapi.json/yaml
- **Direct Links** - From catalog table to API explorer
- **Version Support** - OpenAPI 2.0, 3.0, 3.1

**Data Source**: Reads openapi_spec field from service registry entries

### Bulk Operations

**Location**: Bulk action buttons in main UI

**Operations**:
- **Re-run Stale Services** - Triggers workflows for all services with outdated checks_hash
- **Batch Processing** - Handles rate limiting and retries
- **Progress Indication** - Shows how many services triggered/remaining

**Implementation**: Uses trigger-service-workflow.yml with array of service names

## Data Flow

### Page Load

1. Fetch `registry/all-services.json`
2. Fetch `current-checks-hash.txt`
3. Render table with all services
4. Compare hashes to detect staleness
5. Load Actions widget (if PAT configured)

### Workflow Trigger

1. User clicks trigger button
2. Validate PAT from localStorage
3. Call GitHub API to dispatch workflow_dispatch
4. Poll Actions widget for status updates
5. Wait for workflow completion
6. Catalog auto-updates when workflow commits results

### Settings Update

1. User enters PAT in Settings modal
2. Validate token via GitHub API `/user` endpoint
3. Check rate limit via `/rate_limit` endpoint
4. Store in localStorage if valid
5. Enable workflow triggering features

## Security Considerations

- **Client-side Only** - No backend server; all processing in browser
- **Token Storage** - PAT stored in localStorage (user's browser only)
- **No Token Transmission** - Token sent only to GitHub API, never to other servers
- **HTTPS** - GitHub Pages enforces HTTPS for all requests
- **Read-only Default** - Most features work without authentication
- **Explicit Opt-in** - User must manually configure PAT for write operations

## Performance

- **Lazy Loading** - Details fetched only when row expanded
- **Client-side Filtering** - No server requests for search/filter
- **Caching** - Browser caches static assets
- **Minimal Dependencies** - No large frameworks; faster page load
- **Adaptive Polling** - Actions widget adjusts refresh rate to minimize API calls

## Extension Points

- **Custom Renderers** - Add new renderers in modules/renderer.js
- **Additional Filters** - Extend modules/filters.js
- **New Widgets** - Add modules following existing patterns
- **Styling** - Modify CSS without touching logic
- **Data Sources** - Add new JSON endpoints in catalog branch

## Related Documentation

- [Architecture Overview](overview.md) - System-wide architecture
- [Staleness Detection Flow](flows/staleness-detection-flow.md) - How staleness detection works
