# Scorecards - System Overview

> **Looking for a quick introduction?** See [README.md](README.md) for project overview, positioning, and quick start.

A flexible, non-blocking scorecard system for measuring service quality and best practices across your organization.

This document contains detailed technical documentation, architecture details, and comprehensive usage instructions.

## Quick Start

- **[Getting Started](documentation/getting-started.md)** - Install and configure Scorecards
- **[Architecture](documentation/architecture/overview.md)** - How it works
- **[Configuration](documentation/guides/configuration.md)** - Configure your repo
- **[Check Catalog](documentation/reference/check-catalog.md)** - Available checks
- **[Contributing](CONTRIBUTING.md)** - How to contribute

## Overview

Scorecards helps teams understand and improve their services by running automated checks against configurable quality standards. It integrates seamlessly into existing CI pipelines and provides a centralized catalog of all services with their scores and rankings.

## Philosophy

- **Non-blocking**: Never fails CI - scorecards are informational, not gatekeeping
- **Zero-config**: Works out-of-the-box with sensible defaults
- **Flexible**: Teams adopt at their own pace
- **Transparent**: All results visible in a central catalog
- **Extensible**: Easy to add new checks

## Architecture

```
┌─────────────────────┐
│  Service Repository │
│  ┌───────────────┐  │
│  │ Existing CI   │  │
│  │ + Scorecard   │  │
│  │   Action      │  │
│  └───────┬───────┘  │
│          │          │
│  Optional:          │
│  .scorecard/        │
│    config.yml       │
└──────────┼──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Central Scorecards Repository      │
│  ┌─────────────────────────────┐   │
│  │ GitHub Action               │   │
│  │  • Runs checks in Docker    │   │
│  │  • Calculates score & rank  │   │
│  │  • Generates badges         │   │
│  │  • Stores results           │   │
│  └─────────────────────────────┘   │
│                                     │
│  /checks/        - Check scripts    │
│  /results/       - Service results  │
│  /badges/        - Badge JSONs      │
│  /registry/      - Service registry │
│  /docs/          - Catalog UI       │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│  GitHub Pages       │
│  Catalog            │
│  • All services     │
│  • Scores & ranks   │
│  • Trends           │
│  • Check details    │
└─────────────────────┘
```

## Installation

### For Platform/DevOps Teams

Set up the central scorecards repository for your organization:

#### One-Line Installation

```bash
export GITHUB_TOKEN=your_github_pat
curl -fsSL https://raw.githubusercontent.com/feddericovonwernich/scorecards/main/scripts/install.sh | bash
```

The installation script will:
1. Validate prerequisites (git, gh CLI, jq)
2. Prompt for your target repository (org/repo)
3. Create the repository if it doesn't exist
4. Set up the main branch with all system code
5. Create the catalog branch for data storage
6. Push both branches to your repository
7. Customize documentation to reference your repository
8. Configure GitHub Pages to host the catalog
9. Provide next steps for service integration

#### Prerequisites

- **git**: Version control
- **gh**: [GitHub CLI](https://cli.github.com/)
- **jq**: JSON processor
- **GitHub Personal Access Token** with `repo` and `workflow` permissions

#### Manual Installation

If you prefer to set up manually:

1. Clone or fork this repository to your organization
2. Create an orphan `catalog` branch:
   ```bash
   git checkout --orphan catalog
   git rm -rf .
   git checkout main -- docs/
   mkdir -p results badges registry
   echo '[]' > registry/services.json
   git add . && git commit -m "Initialize catalog branch"
   git push -u origin catalog
   ```
3. Enable GitHub Pages: Settings → Pages → Source: `catalog` branch, `/` (root)
4. Wait for Pages to deploy (check Settings → Pages for the URL)

#### Customization

After installation, you can:
- Add custom checks in `checks/` directory
- Customize the catalog UI in `docs/`
- Adjust check weights in `checks/*/metadata.json`
- Configure branch protection rules

## Quick Start

### For Service Teams

Add scorecards to your service repository with the automated installation workflow:

```yaml
# .github/workflows/scorecards-check.yml
name: Scorecards Check

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
  workflow_dispatch:

jobs:
  scorecards:
    uses: feddericovonwernich/scorecards/.github/workflows/install.yml@main
    secrets:
      github-token: ${{ secrets.GITHUB_TOKEN }}
```

This creates an automated PR with scorecards configuration. Review, customize, and merge when ready.

See the [Usage Guide](documentation/guides/usage.md) for detailed installation instructions, manual setup options, and configuration details.

### Optional Configuration

Create `.scorecard/config.yml` in your repository:

```yaml
service:
  name: "My Service"
  team: "Platform Team"
  description: "Brief service description"
```

See the [Configuration Guide](documentation/guides/configuration.md) for all available options, including OpenAPI configuration and custom metadata.

## Scoring System

Scores are calculated based on weighted checks. Each check has a weight indicating its importance.

**Tiers:**
- **Platinum** (90-100): Exemplary
- **Gold** (75-89): Excellent
- **Silver** (50-74): Good
- **Bronze** (0-49): Needs improvement

See the [Usage Guide](documentation/guides/usage.md#understanding-your-score) for detailed scoring calculations and examples.

## Badges

Add badges to your service's README (replace `your-org/your-repo` with your service's org and repo name):

```markdown
![Score](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/feddericovonwernich/scorecards/catalog/badges/your-org/your-repo/score.json)
![Rank](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/feddericovonwernich/scorecards/catalog/badges/your-org/your-repo/rank.json)
```

## Available Checks

See [`checks/`](./checks/) directory for all checks. Each check is a simple script that:

- Examines your repository
- Returns exit code 0 (pass) or non-zero (fail)
- Outputs details to stdout/stderr

Current checks:
- README existence and quality
- LICENSE file
- CI configuration
- Test coverage
- Documentation
- OpenAPI specification (detection and validation)
- OpenAPI quality metrics
- API environment configuration

## For Check Authors

Want to add a new check? See the [Check Development Guide](documentation/reference/check-catalog.md) for details on creating new checks.

## Catalog

Visit the [Scorecards Catalog](https://feddericovonwernich.github.io/scorecards/) to see all services, their scores, and detailed check results.

### Staleness Detection

The catalog automatically detects when scorecards are outdated:

- **STALE badges** appear on services that were scored with an older version of the check suite
- A scorecard becomes stale when:
  - New checks are added to the system
  - Existing checks are modified (weights, code, metadata)
  - Checks are removed
- **Warning banners** in detail views explain the issue and recommend re-running workflows
- Staleness is detected instantly at page load without background processes
- Uses SHA256 hash of the entire check suite (IDs + metadata + implementation code)

To update a stale scorecard, simply re-run the scorecard workflow on your service repository. The next run will use the latest check suite and clear the stale indicator.

## License

MIT
