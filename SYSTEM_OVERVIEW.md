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

Scorecards follows a simple philosophy:

1. **Non-blocking** - Never fail CI, always provide information
2. **Transparent** - All check code is visible and auditable
3. **Lightweight** - No infrastructure overhead, leverages GitHub
4. **Voluntary** - Teams adopt at their own pace
5. **Simple** - Easy to understand, modify, and extend

We believe quality measurement should encourage improvement, not gate deployments.

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

### For Platform Teams

Platform teams should set up the central Scorecards repository for their organization. See the [Platform Installation Guide](documentation/guides/platform-installation.md) for:

- One-line installation script
- Manual installation steps
- Prerequisites and setup
- Customization options
- Automated service onboarding setup

### For Service Teams

Service teams should integrate Scorecards into their repositories. See the [Service Installation Guide](documentation/guides/service-installation.md) for:

- Automated installation (recommended)
- Manual integration
- PAT setup and configuration
- Badge setup

## Configuration

While Scorecards works out-of-the-box without configuration, you can add service metadata by creating `.scorecard/config.yml` in your repository:

```yaml
service:
  name: "My Service"
  team: "Platform Team"
  description: "Core API service handling user authentication"
```

**Benefits of adding metadata:**
- Custom service names in the catalog (instead of repo names)
- Team ownership visibility
- Improved searchability and organization
- Better documentation in the central catalog

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
