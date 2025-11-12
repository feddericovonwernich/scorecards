# Scorecards - AI Context

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

## Tech Stack

Docker (multi-runtime), Bash, jq, shields.io (badges), vanilla HTML/CSS/JS (catalog)
