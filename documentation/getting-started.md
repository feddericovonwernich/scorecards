# Getting Started with Scorecards

This guide will help you install and configure Scorecards in your repository.

## What is Scorecards?

Scorecards is an automated quality scoring system for service repositories. It runs checks against your repository and provides a quality score with actionable insights.

## Installation

### Prerequisites

- A GitHub repository
- Write access to the repository
- GitHub Actions enabled

### Quick Install

1. **Run the installation workflow**

   Visit the Scorecards repository and trigger the installation workflow for your repository.

2. **Review the PR**

   The installation creates a pull request in your repository with:
   - `.github/workflows/scorecards.yml` - The workflow file
   - `.scorecard/config.yml` - Configuration file

3. **Merge the PR**

   Review and merge the pull request. Scorecards will run on the next push.

### Manual Installation

See [Installation Guide](guides/installation.md) for manual installation steps.

## Configuration

Edit `.scorecard/config.yml` in your repository:

```yaml
team: Your Team Name
description: Brief description of your service
```

See [Configuration Guide](guides/configuration.md) for all options.

## Understanding Your Score

After the workflow runs:

1. **Check the workflow output** - See which checks passed/failed
2. **View your score** - Find your repo in the [Catalog](../docs/)
3. **Improve your score** - Follow check recommendations

## Score Tiers

- **Platinum (90-100%)** - Exceptional quality
- **Gold (80-89%)** - High quality
- **Silver (60-79%)** - Good quality
- **Bronze (40-59%)** - Basic quality
- **Needs Improvement (<40%)** - Requires attention

## Available Checks

See [Check Catalog](reference/check-catalog.md) for all available checks.

Common checks include:
- README documentation
- License file
- CI configuration
- Test coverage
- API documentation

## Next Steps

- [Configure your repository](guides/configuration.md)
- [Learn about the architecture](architecture/overview.md)
- [View all checks](reference/check-catalog.md)
- [Add Scorecards to more repositories](guides/installation.md)

## Getting Help

- Check the [documentation](README.md)
- Review [common issues](guides/troubleshooting.md)
- Open an issue in the Scorecards repository
