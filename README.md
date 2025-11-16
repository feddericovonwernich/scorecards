# Scorecards

A flexible, non-blocking scorecard system for measuring service quality and best practices across your organization.

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

Once your platform team has installed the central scorecards repository, you can add scorecards to your service in two ways:

#### Automated Installation (Recommended)

The easiest way to get started! This "try before you buy" approach lets you see your scorecard results before committing to installation:

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

What happens:
1. 🔍 Calculates your scorecard score daily
2. 📝 Creates an automated PR with scorecards workflow and config
3. 📊 Shows results in Actions tab (even before merging)
4. ✅ Respects your decision if you close the PR (won't spam you)

See [Usage Guide](documentation/guides/usage.md) for more information.

#### Manual Installation

If you prefer direct control, add this workflow to your service:

```yaml
# .github/workflows/scorecards.yml
name: Scorecards

on:
  push:
    branches: [main]

jobs:
  scorecards:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Scorecards
        uses: feddericovonwernich/scorecards/action@main
        with:
          github-token: ${{ secrets.SCORECARDS_TOKEN }}
          scorecards-repo: 'feddericovonwernich/scorecards'
          scorecards-branch: 'catalog'  # optional, this is the default
```

**Setting up the Token:**

Create a GitHub Personal Access Token with `repo` permissions and add it as a secret:

1. Create token: [GitHub Settings → Tokens](https://github.com/settings/tokens/new)
2. Select `repo` (full control of private repositories)
3. Add as `SCORECARDS_TOKEN` secret in your service repository

That's it! The next push to main will calculate your score and you'll appear in the catalog.

### Optional Configuration

Create `.scorecard/config.yml` in your repo for customization:

```yaml
service:
  name: "My Amazing Service"
  team: "Platform Team"
  description: "Core API service handling user authentication"
  links:
    - name: "Documentation"
      url: "https://docs.example.com/my-service"
    - name: "Runbook"
      url: "https://wiki.example.com/runbook"

# For services with OpenAPI/Swagger specifications
openapi:
  spec_file: "openapi.yaml"  # Path to your OpenAPI spec file
  branch: "main"  # Branch where the spec is located (optional, defaults to trying main/master)
  environments:
    production:
      base_url: "https://api.example.com/v1"
      description: "Production environment"
    staging:
      base_url: "https://staging-api.example.com/v1"
      description: "Staging environment"
    development:
      base_url: "http://localhost:8000"
      description: "Local development"

custom:
  criticality: "high"
  environment: "production"
```

## Scoring System

### How Scores Are Calculated

Each check has a weight (defined in its `metadata.json`). Your score is:

```
score = (sum of passed check weights / sum of all check weights) × 100
```

### Ranking

- **Platinum** (90-100): Exemplary
- **Gold** (75-89): Excellent
- **Silver** (50-74): Good
- **Bronze** (0-49): Needs improvement

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

Want to add a new check? See [Adding Checks Guide](documentation/guides/adding-checks.md) for the development guide.

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

## Action Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `github-token` | Yes | - | GitHub token for API access and committing results |
| `create-config-pr` | No | `false` | Create PR with config template if missing |

## License

MIT
