# Workflows

This document provides detailed documentation for all GitHub Actions workflows in the Scorecards system.

## Overview

The Scorecards system groups workflows into four categories:

- **Development & Quality** - Testing and maintenance of the scorecards system itself
- **Service Onboarding** - Installing scorecards in service repositories
- **Execution & Maintenance** - Running checks and maintaining the catalog
- **Optional Remediation** - Disabled-by-default, PR-only correction proposals

### Optional remediation

**Path:** `.github/workflows/remediate-check.yml`

**Trigger:** Central `workflow_dispatch` with `org`, `repo`, `check_id`, `service_sha`, `suite_sha` and `request_id`. Run title: `remediation:<request_id>`.

**Jobs:** A read-only validator checks the trusted active revision and explicit actor/target policy before the writer credential is used. A per-repository/check concurrency group then invokes `action/remediate/` to prepare a tokenless sandbox correction and publish only a fresh branch and PR. Pending runs can replace older pending runs; this is not a durable FIFO queue.

**Security and results:** Ships disabled, checks out `github.sha` without persisted credentials and pins third-party actions. `SCORECARDS_WORKFLOW_TOKEN` is host-only, with no catalog-token fallback. A generated outcome is retained as `remediation-result.json` and a run summary; cancellation may prevent output. Workflow success is not evidence of a PR or a passing score. See the authoritative [flow, diagrams and activation prerequisites](../architecture/flows/remediation-flow.md).

For `.github/workflows/publish-remediation-runtime.yml`, see the authoritative [runtime publication procedure](../architecture/flows/remediation-flow.md#publicación-del-runtime).

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

**Purpose:** Builds and publishes the catalog UI. See the [Deployment guide](../../docs/README.md#deployment) for the delivery procedure and GitHub Pages configuration.

---

## Service Onboarding Workflows

### create-installation-pr.yml

**Path:** `.github/workflows/create-installation-pr.yml`

**Triggers:**

- Manual workflow dispatch only

**Inputs:**

- `org` (required) - Organization/user name
- `repo` (required) - Repository name
- `scorecards-repo` (optional) - Central scorecards repository (default: 'feddericovonwernich-org/scorecards')
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
   - Checks out the service and central platform separately
   - Runs the local platform action against `service-workspace`, producing fresh results with service and suite Git provenance
   - Displays results in GitHub Step Summary
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

- Daily schedule (cron: '0 0 \* \* \*' - midnight UTC)
- Push to main/master branches
- Manual workflow dispatch

**Purpose:** Runs scorecards checks on a service repository and publishes results to the central catalog.

**Jobs:**

1. **scorecard** - Runs scorecards action
   - Checks out the service into `service` and the central platform's default branch into `.scorecards-platform`
   - Runs `./.scorecards-platform/action` with `service-workspace` pointing to the service checkout
   - Displays results in GitHub Step Summary
   - Uploads results as artifact

**Action Inputs:**

- `github-token` - Token with repo and contents permissions
- `scorecards-repo` - Central scorecards repository
- `scorecards-branch` - Branch for results (default: 'catalog')
- `service-workspace` - Absolute path to the separate service checkout

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

## Visual Flow Diagrams

For detailed workflow interactions and data flows, see:

- **[Scoring Flow](../architecture/flows/scoring-flow.md)** - Complete daily scorecard run process (service → action → catalog → UI)
- **[Installation Flow](../architecture/flows/installation-flow.md)** - Service onboarding via automated PRs
- **[Staleness Detection Flow](../architecture/flows/staleness-detection-flow.md)** - Hash updates, detection, and re-triggering
- **[Check Execution Flow](../architecture/flows/check-execution-flow.md)** - How individual checks are discovered and executed

## Key Workflow Patterns

### Reusable Workflow Pattern

`install.yml` is a reusable workflow that can be called from service repositories:

```yaml
jobs:
  scorecards:
    uses: feddericovonwernich-org/scorecards/.github/workflows/install.yml@main
    secrets:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      scorecards-catalog-token: ${{ secrets.SCORECARDS_CATALOG_TOKEN }}
      scorecards-workflow-token: ${{ secrets.SCORECARDS_WORKFLOW_TOKEN }}
```

**Benefits:**

- Full installation + scoring functionality
- Automatic installation PR creation
- Fresh scoring with service and suite Git provenance
- Example: test-repo-perfect's ci.yml

### Template Pattern

Use the maintained [service workflow template](../examples/scorecard-workflow-template.yml), customized with your central repository. It checks out the service and platform separately, invokes the local platform action, and passes the service checkout through `service-workspace`. This preserves the Git revisions of both inputs for evaluation provenance.

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

### Fresh Scoring

`install.yml` evaluates the checked-out service with the checked-out platform on every scoring run. It neither restores nor saves daily result caches: results must describe the service and suite revisions actually evaluated, including repeated runs on the same day. Results remain available in the step summary and uploaded artifact.

### Token Requirements

See the [Token Requirements Guide](token-requirements.md) for scoring, installation and remediation credentials, permissions and activation safeguards.

## Quick Reference

| Workflow                     | Category    | Trigger             | Purpose                  |
| ---------------------------- | ----------- | ------------------- | ------------------------ |
| test.yml                     | Development | Push/PR to main     | Run test suite           |
| update-checks-hash.yml       | Development | checks/\*\* changes | Update staleness hash    |
| sync-docs.yml                | Development | docs/\*\* changes   | Deploy UI updates        |
| create-installation-pr.yml   | Onboarding  | Manual              | Create installation PR   |
| install.yml                  | Onboarding  | Workflow call       | Reusable install + score |
| scorecards.yml               | Execution   | Daily/push/manual   | Run checks in service    |
| trigger-service-workflow.yml | Execution   | Manual              | Remote workflow trigger  |
| remediate-check.yml          | Remediation | Manual              | Validate and propose PR  |
| consolidate-registry.yml     | Maintenance | Registry updates    | Consolidate registry     |

## Related Documentation

- [Architecture Overview](overview.md) - High-level system architecture
- [Scoring Flow](flows/scoring-flow.md) - End-to-end scoring process
- [Installation Flow](flows/installation-flow.md) - Service onboarding process
- [Staleness Detection Flow](flows/staleness-detection-flow.md) - Detecting outdated scores
