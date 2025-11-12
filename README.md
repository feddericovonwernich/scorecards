# Scorecards

A flexible, non-blocking scorecard system for measuring service quality and best practices across your organization.

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
│  /docs/          - GitHub Pages     │
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

## Quick Start

### For Service Teams

Add this step to your existing CI workflow:

```yaml
# .github/workflows/ci.yml
- name: Run Scorecards
  uses: your-org/scorecards/action@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

That's it! The first run will calculate your score and you'll appear in the catalog.

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

Add badges to your README:

```markdown
![Score](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/your-org/scorecards/main/badges/your-org/your-repo/score.json)
![Rank](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/your-org/scorecards/main/badges/your-org/your-repo/rank.json)
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

## For Check Authors

Want to add a new check? See [docs/CHECKS.md](./docs/CHECKS.md) for the development guide.

## Catalog

Visit the [Scorecards Catalog](https://your-org.github.io/scorecards/) to see all services, their scores, and detailed check results.

## Action Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `github-token` | Yes | - | GitHub token for API access and committing results |
| `create-config-pr` | No | `false` | Create PR with config template if missing |

## License

MIT
