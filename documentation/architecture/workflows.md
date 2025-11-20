# Workflows

This document provides detailed documentation for all GitHub Actions workflows in the Scorecards system.

## Overview

The Scorecards system uses 8 workflows across three categories:

- **Development & Quality** - Testing and maintenance of the scorecards system itself
- **Service Onboarding** - Installing scorecards in service repositories
- **Execution & Maintenance** - Running checks and maintaining the catalog

## Development & Quality Workflows

### test.yml

**Path:** `.github/workflows/test.yml`

**Triggers:**
- Push to main branch
- Pull requests to main branch

**Purpose:** Runs comprehensive test suite for the scorecards system itself before changes are merged.

**Jobs:**

1. **test-javascript** - Runs Jest tests for JavaScript checks
   - Sets up Node.js 20
   - Installs dependencies via `npm ci`
   - Runs `npm run test:js`
   - Uploads coverage to Codecov (javascript flag)

2. **test-bash** - Runs Bats tests for Bash checks
   - Installs Bats testing framework
   - Runs tests in `tests/unit/bash/`

3. **test-python** - Runs pytest for Python checks
   - Sets up Python 3.11
   - Installs dependencies from requirements.txt and requirements-dev.txt
   - Runs pytest
   - Uploads coverage to Codecov (python flag)

4. **lint** - Code quality checks
   - Runs ESLint on JavaScript files
   - Runs shellcheck on all .sh files

**System Role:** Quality assurance gate that validates all changes before they're merged to main.

---

### update-checks-hash.yml

**Path:** `.github/workflows/update-checks-hash.yml`

**Triggers:**
- Push to main branch with changes to `checks/**`
- Manual workflow dispatch

**Purpose:** Updates the current checks hash on the catalog branch for staleness detection.

**Jobs:**

1. **update-hash** - Updates catalog checks hash
   - Checks out repository with full history
   - Runs `action/utils/update-checks-hash.sh`
   - Generates SHA256 hash of all checks (metadata + implementation)
   - Switches to catalog branch
   - Updates `current-checks-hash.txt` and `current-checks.json`
   - Commits and pushes to catalog branch using SCORECARDS_CATALOG_TOKEN

**How it works:**
- Finds all check directories in `checks/`
- For each check, hashes `metadata.json` and implementation file (`check.sh`, `check.py`, or `check.js`)
- Combines all check hashes into single SHA256 hash
- Stores this as the "current" check suite hash

**System Role:** Maintains staleness detection by tracking when checks are modified. Services with different hashes have outdated scores and are flagged as STALE in the catalog UI.

---

### sync-docs.yml

**Path:** `.github/workflows/sync-docs.yml`

**Triggers:**
- Push to main branch with changes to `docs/**`
- Manual workflow dispatch

**Purpose:** Syncs catalog UI files from main branch to catalog branch for GitHub Pages deployment.

**Jobs:**

1. **sync-catalog** - Syncs UI files
   - Checks out main branch
   - Checks out catalog branch
   - Uses rsync to sync `docs/` directory (with delete for removed files)
   - Commits and pushes to catalog branch if changed

**System Role:** Keeps catalog UI synchronized between main and catalog branches. Since catalog branch serves GitHub Pages, this ensures UI updates are automatically deployed.

---

## Service Onboarding Workflows

### create-installation-pr.yml

**Path:** `.github/workflows/create-installation-pr.yml`

**Triggers:**
- Manual workflow dispatch only

**Inputs:**
- `org` (required) - Organization/user name
- `repo` (required) - Repository name
- `scorecards-repo` (optional) - Central scorecards repository (default: 'feddericovonwernich/scorecards')
- `scorecards-branch` (optional) - Branch for results (default: 'catalog')

**Purpose:** Creates a pull request in a target service repository to install scorecards.

**Jobs:**

1. **create-pr** - Creates the installation PR
   - Checks out target service repository
   - Checks out scorecards repository for templates
   - Checks installation status (already installed or existing PR)
   - Creates new branch `scorecards-install`
   - Copies and customizes workflow template (`.github/workflows/scorecards.yml`)
   - Creates config template (`.scorecard/config.yml`)
   - Commits changes
   - Creates PR with label "scorecards-install"
   - Handles edge cases (already installed, PR exists)

2. **update-registry** - Updates catalog registry
   - Runs only if PR was successfully created
   - Fetches default branch of target repository
   - Updates or creates registry file with PR information
   - Commits registry update to catalog branch

**Outputs:**
- `pr-number` - PR number created
- `pr-state` - PR state (OPEN, CLOSED, MERGED)
- `pr-url` - URL to the PR
- `status` - Operation status (success, already-installed, pr-exists)
- `message` - Status message

**System Role:** Manual installation workflow for onboarding new services. Creates a PR that adds the scorecards workflow and config files.

---

### install.yml

**Path:** `.github/workflows/install.yml`

**Triggers:**
- Workflow call (reusable workflow)

**Inputs:**
- `scorecards-repo` (optional) - Central scorecards repository
- `scorecards-branch` (optional) - Branch for results

**Secrets:**
- `github-token` (required) - GitHub token
- `scorecards-pat` (optional) - PAT for pushing to central repo
- `installation-pat` (optional) - PAT for creating installation PR

**Purpose:** Reusable workflow called by service repositories. Handles installation check, PR creation, scorecard calculation, and PR updates.

**Jobs:**

1. **check-status** - Checks if scorecards is installed
   - Checks for `.github/workflows/scorecards.yml`
   - Looks for existing installation PRs with "scorecards-install" label
   - Outputs: `installed`, `pr-exists`, `pr-number`, `pr-state`

2. **create-installation-pr** - Creates installation PR if needed
   - Runs only if not installed and no existing PR
   - Creates `scorecards-install` branch
   - Copies workflow template and customizes it
   - Creates config template
   - Creates PR with detailed description
   - Outputs: `pr-number`, `pr-state`, `pr-url`

3. **run-scorecards** - Calculates scorecards
   - Runs always if not installed (PR created or not)
   - Checks cache for today's results (daily cache key: `scorecards-results-{repo}-{date}`)
   - Runs scorecards action if not cached
   - Displays results in GitHub Step Summary
   - Saves results to cache
   - Uploads results as artifact
   - Outputs: `score`, `rank`, `passed-checks`, `total-checks`, `results-file`

4. **update-installation-pr** - Updates PR with results
   - Runs only if PR was created and scorecards ran successfully
   - Updates PR description with actual score and rank
   - Makes the installation PR more informative

**System Role:** Primary integration point for service repositories. Provides full installation + scoring functionality in a single reusable workflow. Used by services that want automated installation PR creation (e.g., test-repo-perfect).

---

## Execution & Maintenance Workflows

### scorecards.yml (Service Template)

**Template Path:** `documentation/examples/scorecard-workflow-template.yml`

**Installed Path:** `.github/workflows/scorecards.yml` (in service repositories)

**Triggers:**
- Daily schedule (cron: '0 0 * * *' - midnight UTC)
- Push to main/master branches
- Manual workflow dispatch

**Purpose:** Runs scorecards checks on a service repository and publishes results to the central catalog.

**Jobs:**

1. **scorecard** - Runs scorecards action
   - Checks out service repository
   - Runs scorecards action (`feddericovonwernich/scorecards/action@main`)
   - Displays results in GitHub Step Summary
   - Uploads results as artifact

**Action Inputs:**
- `github-token` - Token with repo and contents permissions
- `scorecards-repo` - Central scorecards repository
- `scorecards-branch` - Branch for results (default: 'catalog')

**Action Outputs:**
- `score` - Calculated score (0-100)
- `rank` - Rank (bronze, silver, gold, platinum)
- `passed-checks` - Number of checks passed
- `total-checks` - Total checks run
- `results-file` - Path to results JSON

**System Role:** Client-side workflow that runs in service repositories. Executes the actual quality checks and reports results back to the central catalog. This is the simpler template approach compared to the reusable workflow approach (install.yml).

**What the action does (action/entrypoint.sh):**
1. Parses configuration from `.scorecard/config.yml`
2. Fetches PR info and default branch
3. Checks if scorecards workflow is installed
4. Builds Docker image for check execution (multi-runtime: Node.js 20, Python 3, bash tools)
5. Runs all checks sequentially in Docker container
6. Calculates score and rank from check results
7. Generates badges (score, rank)
8. Generates check suite hash for staleness detection
9. Analyzes recent contributors
10. Creates final results JSON with all metadata
11. Commits results to catalog branch in central repo:
    - `registry/{org}/{repo}.json` - Service registry entry
    - `results/{org}/{repo}/results.json` - Detailed check results
    - `badges/{org}/{repo}/score.json` - Score badge data
    - `badges/{org}/{repo}/rank.json` - Rank badge data
12. Sets action outputs for workflow consumption

---

### trigger-service-workflow.yml

**Path:** `.github/workflows/trigger-service-workflow.yml`

**Triggers:**
- Manual workflow dispatch only

**Inputs:**
- `org` (optional) - Organization name for single service
- `repo` (optional) - Repository name for single service
- `services` (optional) - JSON array for bulk trigger: `[{"org":"org1","repo":"repo1"},...]`

**Purpose:** Triggers scorecards workflows in service repositories remotely via GitHub API.

**Jobs:**

1. **trigger-single** - Triggers single service workflow
   - Runs only if org and repo provided
   - Validates service exists in registry
   - Validates scorecards is installed
   - Reads default branch from registry
   - Triggers workflow via GitHub API (tries default branch, then main, then master)

2. **trigger-bulk** - Triggers multiple service workflows
   - Runs only if services JSON array provided
   - Parses JSON array of services
   - Validates each service (exists, installed)
   - Triggers workflow for each service
   - Adds 1-second delay between triggers to avoid rate limiting
   - Reports success/failure count

**System Role:** Allows central control/coordination of scorecard runs across multiple services. Useful for:
- Testing check changes across all services
- Forcing score updates after check modifications
- Coordinating synchronized scoring
- Bulk re-runs for stale services

---

### consolidate-registry.yml

**Path:** `.github/workflows/consolidate-registry.yml`

**Triggers:**
- Push to catalog branch affecting `registry/**/*.json` (excluding `all-services.json`)

**Concurrency:** Only one consolidation runs at a time (cancel in-progress runs)

**Purpose:** Consolidates individual service registry files into a single `all-services.json` file for the catalog UI.

**Jobs:**

1. **consolidate** - Consolidates registry
   - Checks out catalog branch
   - Finds all registry files (excludes `all-services.json` and legacy `services.json`)
   - Counts services
   - Creates consolidated JSON with:
     - Array of all service entries
     - `generated_at` timestamp
     - `count` of services
   - Commits if changed (with `[skip ci]` to prevent loops)
   - Pushes to catalog branch

**System Role:** Maintains the consolidated registry file used by the catalog UI. Automatically runs whenever individual service registries are updated by the scorecards action.

---

## Workflow Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Development (main branch)                     │
├─────────────────────────────────────────────────────────────────┤
│ test.yml          - PR/push to main → Run tests                 │
│ update-checks-hash.yml - checks/** changes → Update hash        │
│ sync-docs.yml     - docs/** changes → Sync to catalog           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               Service Onboarding (manual trigger)                │
├─────────────────────────────────────────────────────────────────┤
│ create-installation-pr.yml - Manual → Create PR in service      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Service Repository (daily/push/manual)              │
├─────────────────────────────────────────────────────────────────┤
│ scorecards.yml    - Calls action → Calculate scores             │
│       OR                                                         │
│ (custom).yml      - Calls install.yml → PR + scores             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Scorecards Action (composite)                    │
├─────────────────────────────────────────────────────────────────┤
│ action/action.yml - Runs checks → Commits to catalog            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Catalog Branch (automated)                      │
├─────────────────────────────────────────────────────────────────┤
│ consolidate-registry.yml - registry/** changes → Consolidate    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Catalog UI (GitHub Pages - catalog branch)         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              Manual Operations (workflow dispatch)               │
├─────────────────────────────────────────────────────────────────┤
│ trigger-service-workflow.yml - Manual → Trigger service runs    │
└─────────────────────────────────────────────────────────────────┘
```

## Key Workflow Patterns

### Reusable Workflow Pattern

`install.yml` is a reusable workflow that can be called from service repositories:

```yaml
jobs:
  scorecards:
    uses: feddericovonwernich/scorecards/.github/workflows/install.yml@main
    secrets:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      scorecards-catalog-token: ${{ secrets.SCORECARDS_CATALOG_TOKEN }}
      scorecards-workflow-token: ${{ secrets.SCORECARDS_WORKFLOW_TOKEN }}
```

**Benefits:**
- Full installation + scoring functionality
- Automatic installation PR creation
- Daily caching to avoid duplicate runs
- Example: test-repo-perfect's ci.yml

### Template Pattern

`scorecard-workflow-template.yml` provides a simpler template for direct action usage:

```yaml
jobs:
  scorecard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: feddericovonwernich/scorecards/action@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

**Benefits:**
- Lightweight approach
- Direct action usage
- Copied during installation and customized
- Simpler for basic use cases

### Catalog Branch Protection

Multiple workflows write to catalog branch to prevent conflicts and loops:

- **Concurrency control**: `consolidate-registry.yml` uses concurrency groups
- **Skip CI commits**: Registry updates use `[skip ci]` in commit messages
- **Dedicated tokens**: All catalog updates use SCORECARDS_CATALOG_TOKEN
- **Bot commits**: All automated commits by github-actions[bot]

### Caching Strategy

`install.yml` implements daily result caching:

- **Cache key**: `scorecards-results-{repo}-{date}`
- **Cache duration**: Resets daily at midnight UTC
- **Benefits**: Reduces API usage, speeds up repeated runs on same day
- **Use case**: Multiple pushes/PRs on same day reuse cached results

### Token Requirements

The system uses three types of tokens for different permissions:

1. **GITHUB_TOKEN** (automatic)
   - Basic operations in service repos
   - Read access to repositories
   - Write access to workflow run artifacts

2. **SCORECARDS_CATALOG_TOKEN** (required secret)
   - Write access to catalog branch in central repo
   - Used by scorecards action to commit results
   - Required for all service workflows
   - **Scopes:** `repo`
   - **Rationale:** Results must be written to the catalog branch

3. **SCORECARDS_WORKFLOW_TOKEN** (optional secret)
   - Creates PRs that modify .github/workflows/ files
   - Bypasses GitHub security restriction on workflow file PRs
   - Only needed for automated installation
   - Used by `install.yml` and `create-installation-pr.yml`
   - **Scopes:** `repo`, `workflow`
   - **Rationale:** GitHub requires `workflow` scope to modify workflow files via PR

## Quick Reference

| Workflow | Category | Trigger | Purpose |
|----------|----------|---------|---------|
| test.yml | Development | Push/PR to main | Run test suite |
| update-checks-hash.yml | Development | checks/** changes | Update staleness hash |
| sync-docs.yml | Development | docs/** changes | Deploy UI updates |
| create-installation-pr.yml | Onboarding | Manual | Create installation PR |
| install.yml | Onboarding | Workflow call | Reusable install + score |
| scorecards.yml | Execution | Daily/push/manual | Run checks in service |
| trigger-service-workflow.yml | Execution | Manual | Remote workflow trigger |
| consolidate-registry.yml | Maintenance | Registry updates | Consolidate registry |

## Related Documentation

- [Architecture Overview](overview.md) - High-level system architecture
- [Scoring Flow](flows/scoring-flow.md) - End-to-end scoring process
- [Installation Flow](flows/installation-flow.md) - Service onboarding process
- [Staleness Detection Flow](flows/staleness-detection-flow.md) - Detecting outdated scores
