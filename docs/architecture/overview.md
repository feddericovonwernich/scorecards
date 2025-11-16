# Architecture Overview

This document describes the high-level architecture of the Scorecards system.

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Service Repository                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  .github/workflows/scorecards.yml                      │ │
│  │  .scorecard/config.yml                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │ Triggers on push/PR
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
│  registry.json - All repository scores and metadata         │
└─────────────────────┬───────────────────────────────────────┘
                      │ Served via GitHub Pages
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Catalog UI                                │
│  Web interface to browse and explore results                │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

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

See [GitHub Action Architecture](github-action.md) for details.

### Checks

Individual quality checks are:

- **Self-contained** - Each check in its own directory
- **Multi-language** - Bash, Python, or JavaScript
- **Weighted** - Different point values based on importance
- **Categorized** - Documentation, testing, CI, etc.

See [Checks System Architecture](checks-system.md) for details.

### Catalog Branch

The `catalog` branch contains:

- **registry.json** - Consolidated results from all repositories
- **Service subdirectories** - Individual service results
- **Static assets** - Served via GitHub Pages

### Catalog UI

Static web application that:

- **Displays scores** - Sortable, filterable table
- **Shows details** - Drill down into individual checks
- **Detects staleness** - Highlights out-of-date scores
- **Triggers updates** - Can dispatch workflows remotely

See [Catalog UI Architecture](catalog-ui.md) for details.

## Data Flow

### Scoring Flow

1. **Trigger**: Push to service repository triggers workflow
2. **Clone**: Action clones the repository
3. **Execute**: Runs all checks against the repository
4. **Score**: Calculates total score from check results
5. **Badge**: Generates SVG badge with score and tier
6. **Commit**: Creates commit in catalog branch with results
7. **Display**: Catalog UI shows updated score

### Check Execution Flow

1. **Discovery**: Find all checks in `checks/` directory
2. **Parse Metadata**: Read weight, timeout, category from metadata.json
3. **Build Docker**: Create container with all runtimes
4. **Run Check**: Execute check script with timeout
5. **Parse Result**: Extract pass/fail/points from output
6. **Aggregate**: Sum points for total score

## Security Model

- **Read-only**: Checks never modify the repository being scored
- **Isolated**: Checks run in Docker containers
- **Timeouts**: All checks have maximum execution time
- **Non-blocking**: Never fails CI, only reports

## Scalability

- **Parallel Checks**: Checks run concurrently (future)
- **Caching**: Docker images cached
- **Incremental Updates**: Only re-run on changes (future)

## Extension Points

- **New Checks**: Add directory in `checks/`
- **Custom Weights**: Configure via metadata.json
- **Custom Categories**: Add new category values
- **Custom UI**: Fork catalog UI

## Related Documentation

- [Checks System](checks-system.md) - Deep dive into checks
- [GitHub Action](github-action.md) - Action implementation
- [Catalog UI](catalog-ui.md) - Frontend architecture
