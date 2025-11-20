# Architecture Overview

This document describes the high-level architecture of the Scorecards system.

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Branch                             │
│  checks/, action/, .github/workflows/, docs/                │
└─────────────────────┬──────────────────┬────────────────────┘
                      │                  │
                      │ Defines checks   │ Workflow definitions
                      │ and action       │ and automation
                      ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Repository                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  .github/workflows/scorecards.yml                      │ │
│  │  .scorecard/config.yml                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │ Triggers on schedule/push/PR
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Scorecards Action                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. Clone repository                                   │ │
│  │  2. Run checks in Docker                               │ │
│  │  3. Calculate score                                    │ │
│  │  4. Generate badge                                     │ │
│  │  5. Update catalog                                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │ Writes results
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Catalog Branch                             │
│  registry/, results/, badges/, docs/                        │
└─────────────────────┬───────────────────────────────────────┘
                      │ Served via GitHub Pages
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Catalog UI                                │
│  Web interface to browse and explore results                │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

The following sections describe the core architectural components of the Scorecards system and how they work together to provide automated quality measurement and reporting.

### Main Branch

The `main` branch is the source of truth for the Scorecards system, containing all the code and configuration that powers quality measurement:

- **checks/** - Individual quality check implementations and metadata
- **action/** - GitHub Action entrypoint and orchestration scripts
- **.github/workflows/** - Automation workflows (installation, triggering, hash updates, etc.)
- **documentation/** - System architecture and flow documentation
- **docs/** - Catalog UI static files (synced to catalog branch for GitHub Pages)

This branch is where development happens and can be forked/cloned for organization-specific customization of checks, weights, categories, and workflows.

### Service Repository

Each service repository being scored contains:

- **Workflow file** (`.github/workflows/scorecards.yml`) - Triggers the action
- **Config file** (`.scorecard/config.yml`) - Team name, description, metadata

### Scorecards Action

The GitHub Action that performs scoring:

- **Entrypoint** (`action/entrypoint.sh`) - Orchestrates the scoring process
- **Check Runner** - Executes individual checks in Docker
- **Score Calculator** - Computes overall score from check results
- **Badge Generator** - Creates score badge
- **Registry Updater** - Updates central registry

### Checks

Individual quality checks are:

- **Self-contained** - Each check in its own directory
- **Multi-language** - Bash, Python, or JavaScript
- **Weighted** - Different point values based on importance
- **Categorized** - Documentation, testing, CI, etc.

### Catalog Branch

The `catalog` branch contains:

- **registry/all-services.json** - Consolidated results from all repositories
- **registry/{org}/{repo}.json** - Individual service result files
- **results/{org}/{repo}/results.json** - Detailed check results per service
- **badges/** - Badge JSON files for shields.io
- **current-checks-hash.txt** - SHA256 hash of current check suite
- **current-checks.json** - Current check metadata for staleness detection
- **docs/** - Catalog UI static files (synced from main branch)

### Catalog UI

Static web application that displays scores in a sortable, filterable table with drill-down into individual checks. See [Catalog UI Architecture](catalog-ui.md) for details on features and implementation.

## Workflows

The system uses GitHub Actions workflows for automation across three categories:

### Development & Quality
- **test.yml** - Test suite and linting for PR/push validation
- **update-checks-hash.yml** - Staleness detection hash updates
- **sync-docs.yml** - Catalog UI deployment to GitHub Pages

### Service Onboarding
- **create-installation-pr.yml** - Manual installation PR creation
- **install.yml** - Reusable workflow for automated installation

### Execution & Maintenance
- **scorecards.yml** - Service-side check execution (template)
- **trigger-service-workflow.yml** - Remote workflow triggering
- **consolidate-registry.yml** - Registry aggregation

**See [Workflows](workflows.md) for detailed documentation on each workflow's triggers, inputs, outputs, and implementation.**

## Data Flow

The system processes quality checks through several interconnected flows:

### Scoring Flow

The scorecards action runs on a daily schedule (midnight UTC) or when triggered by push/PR. It clones the repo, runs checks in Docker, calculates a weighted score, generates badges, and commits results to the catalog branch for display in the UI.

**See [Scoring Flow](flows/scoring-flow.md) for detailed diagram and step-by-step explanation.**

### Check Execution Flow

Checks are discovered from the `checks/` directory, their metadata parsed, a multi-runtime Docker image built, each check executed with timeout protection, results parsed from exit codes, and scores aggregated using weighted calculations.

**See [Check Execution Flow](flows/check-execution-flow.md) for detailed diagram and implementation details.**

### Installation Flow

Services are onboarded via automated PRs that add workflow and config files. The installation workflow generates the necessary files, creates a branch, opens a PR, tracks the PR in the registry, and activates scoring once merged.

**See [Installation Flow](flows/installation-flow.md) for detailed diagram and onboarding process.**

### Staleness Detection Flow

When checks are modified, a SHA256 hash is generated and stored in the catalog branch. The UI compares each service's stored hash against the current hash to flag outdated scorecards, enabling targeted or bulk re-runs to update scores with the latest checks.

**See [Staleness Detection Flow](flows/staleness-detection-flow.md) for detailed diagram and staleness mechanics.**

## Security Model

### Code Access and Execution

- **Read-only**: Checks never modify the repository being scored
- **Isolated**: Checks run in Docker containers within GitHub Actions runners
- **Timeouts**: All checks have maximum execution time limits
- **Non-blocking**: Never fails CI, only reports results
- **GitHub-native**: All execution happens within GitHub Actions infrastructure
  - No external systems read your code
  - Runs within your organization's GitHub environment
  - Uses GitHub's security model and access controls

### Data Visibility

**Catalog UI (GitHub Pages):**
- **Public repositories** → Catalog is publicly accessible
- **Private repositories** → Depends on your GitHub plan:
  - With **GitHub Enterprise**: Pages can be restricted to organization members
  - Without Enterprise: Pages are **publicly accessible** even though the repo is private

**Important**: If you're using a private scorecards repository, verify your GitHub Pages settings:
- Go to Repository Settings → Pages → Visibility
- Ensure it matches your security requirements

**Results Storage:**
- Stored in `catalog` branch of the scorecards repository
- Access controlled by repository permissions
- Only users with repository access can view raw results files

### Token Security

- Tokens stored as GitHub Secrets (encrypted at rest)
- Tokens never exposed in logs or workflow outputs
- Scoped to minimum required permissions
- See [Token Requirements Guide](../guides/token-requirements.md) for details

## Related Documentation

### Architecture Docs

- [Catalog UI](catalog-ui.md) - Frontend architecture and features
- [Workflows](workflows.md) - Detailed workflow documentation and patterns

### Flow Diagrams

- [Scoring Flow](flows/scoring-flow.md) - End-to-end scoring process
- [Check Execution Flow](flows/check-execution-flow.md) - How checks are discovered and run
- [Installation Flow](flows/installation-flow.md) - Service onboarding via automated PRs
- [Staleness Detection Flow](flows/staleness-detection-flow.md) - Detecting outdated scorecards
