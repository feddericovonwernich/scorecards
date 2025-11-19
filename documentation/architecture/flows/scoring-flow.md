# Scoring Flow

This document describes the end-to-end flow of how a service repository gets scored.

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  Service Repository                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  .github/workflows/scorecards.yml                      │ │
│  │  .scorecard/config.yml                                 │ │
│  │  src/, tests/, README.md, etc.                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────┬───────────────────────────────────────────────┘
              │
              │ 1. Trigger (push/PR/workflow_dispatch)
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│              GitHub Actions Runner                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Scorecards Action (action/entrypoint.sh)             │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  2. Clone repo                                   │ │ │
│  │  │  3. Build Docker image (multi-runtime)           │ │ │
│  │  │  4. Run checks (action/scripts/run-checks.sh)    │ │ │
│  │  │     ├─ Check 01: README present?                 │ │ │
│  │  │     ├─ Check 02: Has CI?                         │ │ │
│  │  │     ├─ Check 03: Has tests?                      │ │ │
│  │  │     └─ ... (all checks)                          │ │ │
│  │  │  5. Calculate score (weighted sum)               │ │ │
│  │  │  6. Generate badge JSON                          │ │ │
│  │  │  7. Commit results to catalog branch             │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────┬───────────────────────────────────────────────┘
              │
              │ 8. Push to catalog branch
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│              Catalog Branch (gh-pages)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  registry/{org}/{repo}.json                            │ │
│  │  results/{org}/{repo}/results.json                     │ │
│  │  badges/{org}/{repo}.json                              │ │
│  │  registry/all-services.json (via consolidation)        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────┬───────────────────────────────────────────────┘
              │
              │ 9. Served via GitHub Pages
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Catalog UI                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Display updated score                                 │ │
│  │  Show individual check results                         │ │
│  │  Update rank badge (Platinum/Gold/Silver/Bronze)       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Flow Steps

### 1. Trigger

The scoring workflow can be triggered in three ways:

- **Push Event**: Any push to the service repository's default branch
- **Pull Request**: PRs to provide preview scores (non-blocking)
- **Workflow Dispatch**: Manual trigger via GitHub UI or API

**Implementation**: `.github/workflows/scorecards.yml` in service repository

### 2. Clone Repository

The action clones the service repository to analyze its contents.

**Implementation**: `action/entrypoint.sh` lines 97-121

**Details**:
- Clones to `$GITHUB_WORKSPACE`
- Shallow clone for performance
- Read-only access (security)

### 3. Build Docker Image

Creates multi-runtime Docker image with all check dependencies.

**Implementation**: `action/entrypoint.sh` lines 149-157

**Runtimes Included**:
- Node.js 20
- Python 3 with pip
- Bash 5+ with common utilities (grep, sed, awk, jq, curl)

**Note**: Image built fresh each run (no caching) to ensure latest dependencies

### 4. Run Checks

Executes all quality checks against the repository.

**Implementation**: `action/scripts/run-checks.sh`

**Process**:
- Discover all checks in `checks/` directory
- For each check:
  - Read metadata.json (weight, timeout, category)
  - Execute check script in Docker container
  - Capture exit code (0 = pass, non-zero = fail)
  - Log output to results file
- All checks run sequentially (not parallel)

**Check Types**:
- **Bash scripts**: `check.sh`
- **Python scripts**: `check.py`
- **JavaScript**: `check.js`

### 5. Calculate Score

Computes weighted score from check results.

**Implementation**: `action/utils/score-calculator.sh`

**Formula**:
```
score = (passed_weight / total_weight) * 100
```

**Rank Assignment**:
- **Platinum**: ≥90%
- **Gold**: ≥75%
- **Silver**: ≥50%
- **Bronze**: <50%

### 6. Generate Badge

Creates badge JSON for shields.io endpoint.

**Implementation**: `action/utils/badge-generator.sh`

**Output**:
```json
{
  "schemaVersion": 1,
  "label": "scorecard",
  "message": "85%",
  "color": "blue"
}
```

**Badge Files Created**:
- `badges/{org}/{repo}.json` - Shields.io endpoint JSON
- `badges/{org}/{repo}-rank.json` - Rank badge (Platinum/Gold/etc.)

### 7. Commit Results

Writes results to catalog branch.

**Implementation**: `action/entrypoint.sh` lines 340-364 (update_catalog function)

**Files Created/Updated**:
- `registry/{org}/{repo}.json` - Service metadata and score
- `results/{org}/{repo}/results.json` - Detailed check results
- `badges/{org}/{repo}.json` - Badge endpoint data

**Metadata Stored**:
- Score, rank, timestamp
- Team name, description (from .scorecard/config.yml)
- Check results (pass/fail, points awarded)
- Checks hash (for staleness detection)
- Recent contributors (from git log)
- OpenAPI spec location (if detected)

### 8. Push to Catalog Branch

Commits are pushed to the catalog branch with retry logic.

**Implementation**: `action/utils/git-ops.sh` lines 189-239

**Features**:
- Exponential backoff retry (3 attempts)
- Automatic rebase on concurrent push conflicts
- Skip push if no meaningful changes (excludes timestamp-only updates)

### 9. Display in Catalog UI

The catalog UI automatically reflects the updated score.

**Data Flow**:
1. Catalog UI fetches `registry/all-services.json` (updated by consolidate-registry workflow)
2. Displays score, rank, and timestamp
3. Staleness indicator shown if service's checks_hash doesn't match current-checks-hash.txt
4. User can expand row to see detailed check results

## Triggers

### Automatic Triggers

- **On Push**: Every push to default branch triggers scoring
- **On PR**: Pull requests get preview scores (catalog not updated)
- **Scheduled**: Optional cron trigger for periodic re-scoring

### Manual Triggers

- **Single Service**: Via trigger-service-workflow.yml (workflow_dispatch)
- **Bulk Services**: Trigger multiple services at once
- **UI Button**: Catalog UI can trigger workflows (requires GitHub PAT)

## Performance

**Typical Run Time**: 2-5 minutes depending on number of checks

**Factors**:
- Number of checks (currently ~15)
- Check complexity (e.g., test coverage analysis is slower)
- Docker build time (~1-2 minutes)
- Repository size (clone time)

## Error Handling

- **Check Failures**: Individual check failures don't fail the workflow
- **Timeout**: Checks have per-check timeout (default 30s, configurable)
- **Non-blocking**: Scoring never fails CI - always exits 0
- **Retry**: Git push retries on conflicts (3 attempts with backoff)

## Security

- **Read-only Repository Access**: Checks never modify service repo
- **Docker Isolation**: Checks run in isolated container
- **No Secrets Required**: Works with default GITHUB_TOKEN
- **Branch Protection**: Catalog branch can have protection rules

## Related Documentation

- [Check Execution Flow](check-execution-flow.md) - Deep dive into how checks run
- [Architecture Overview](../overview.md) - System-wide architecture
