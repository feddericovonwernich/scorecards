# Scorecards - AI Context

> **Note**: This file provides context for AI assistants working on the Scorecards project.
> For human-readable documentation, see `/documentation/`

## What This Is

A distributed scorecard system that measures service quality across an organization. Services run checks via CI, results aggregate in a central catalog.

## Architecture

**Central Repo (this):**
- Defines checks (bash/python/js scripts)
- Provides GitHub Action
- Stores results, badges, registry
- Hosts GitHub Pages catalog

**Service Repos:**
- Run action in CI (on push to main)
- Optional `.scorecard/config.yml` for metadata
- Never blocked - action always succeeds

**Flow:** Service CI → Run checks in Docker → Calculate score → Commit to central repo → Update catalog

## Branch Strategy

**main** - All code/docs changes go here. **catalog** - Auto-generated (GitHub Pages). Never push to catalog manually.

## Key Files

- `action/entrypoint.sh` - Main action logic
- `action/utils/run-checks.sh` - Check execution in Docker
- `checks/*/check.{sh,py,js}` - Individual checks (weighted)
- `docs/index.html` - Catalog UI (client-side JS)
- `registry/services.json` - Auto-maintained service list

## Adding Checks

1. Create `checks/NN-name/` directory
2. Add `check.{sh,py,js}` script (exit 0 = pass)
3. Add `metadata.json` (name, weight, description)
4. Script receives `SCORECARD_REPO_PATH` env var

## Scoring

```
score = (sum of passed weights / total weights) × 100
rank = platinum (90+), gold (75+), silver (50+), bronze (0+)
```

## Staleness Detection

**Purpose:** Detect when scorecards are outdated due to check suite changes

**Implementation:**
- Action generates SHA256 hash of all checks (IDs + metadata.json + implementation files)
- Hash stored in:
  - `docs/current-checks.json` - Latest check suite hash (single source of truth)
  - Each scorecard's `results.json` - Hash at time of generation
  - Registry entries - Fast access without loading full results
- Browser fetches `current-checks.json` (10s cache) and compares
- Mismatches show STALE badges and warning banners

**Key Files:**
- `action/entrypoint.sh:200-244` - Hash generation logic
- `docs/app.js:28-69` - Hash fetch and staleness detection
- `docs/app.js:320-328` - STALE badge rendering
- `docs/app.js:363-378` - Warning banner in detail view

**Triggers Staleness:**
- New checks added
- Check code modified
- Check metadata changed (weights, descriptions)
- Checks removed

**Backwards Compatibility:** Scorecards without `checks_hash` field are automatically marked stale

## Workflow Trigger Feature

**Purpose:** Allow manual re-triggering of scorecard workflows for stale services directly from the catalog UI

**Architecture:**
- **Backend:** GitHub Action proxy workflow (`.github/workflows/trigger-service-workflow.yml`)
- **Frontend:** Trigger buttons throughout catalog UI
- **Authentication:** GitHub Personal Access Token (PAT) with `workflow` scope stored in browser localStorage

**Trigger Locations:**
1. **Service Cards** - Small refresh icon button on each stale service card in grid view
2. **Detail Modal** - "Re-run Scorecard" button in staleness warning banner
3. **Bulk Action** - "Re-run All Stale" button in controls section

**How It Works:**
1. User clicks trigger button
2. Browser requests GitHub PAT (if not stored)
3. Frontend calls GitHub API to dispatch proxy workflow
4. Proxy workflow validates service in registry and checks if installed
5. Proxy workflow triggers `workflow_dispatch` event on service repository
6. Service's scorecard workflow runs automatically
7. Results update in catalog after completion

**Security:**
- PAT never exposed in client-side code (stored in localStorage)
- Proxy workflow validates all inputs
- Only installed services can be triggered
- Uses GitHub's native workflow dispatch API

**Key Files:**
- `.github/workflows/trigger-service-workflow.yml` - Proxy workflow for triggering services
- `docs/app.js:908-1202` - Trigger functions and token management
- `docs/app.js:300-360` - Service card trigger button
- `docs/app.js:380-443` - Detail modal trigger button
- `docs/index.html:73-78` - Bulk trigger button
- `docs/styles.css:813-978` - Trigger button and toast notification styles

**User Setup:**
1. Create GitHub PAT with `workflow` scope
2. Click any trigger button in catalog
3. Enter PAT when prompted (stored for future use)
4. Trigger workflows as needed

**Token Management:**
- Token stored in browser localStorage (key: `github_token`)
- Clear token: Use browser console `localStorage.removeItem('github_token')`
- Invalid tokens automatically cleared on 401 response

## Tech Stack

Docker (multi-runtime), Bash, jq, shields.io (badges), vanilla HTML/CSS/JS (catalog), Web Crypto API (SHA256), GitHub Actions API (workflow dispatch)
