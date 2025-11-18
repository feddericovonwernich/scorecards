# Getting Started with Scorecards

This guide will help you install and configure Scorecards in your repository.

## What is Scorecards?

Scorecards is an automated quality scoring system for service repositories. It runs checks against your repository and provides a quality score with actionable insights.

## Installation

### Quick Install

1. Add the scorecards workflow to your repository
2. Review and merge the automated installation PR
3. Configure your service metadata (optional)

See the [Usage Guide](guides/usage.md) for detailed installation instructions, including automated and manual setup options.

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

- **Platinum (90-100)** - Exceptional quality
- **Gold (75-89)** - High quality
- **Silver (50-74)** - Good quality
- **Bronze (0-49)** - Basic quality

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
- [Add Scorecards to more repositories](guides/usage.md)

## Getting Help

- Check the [documentation](README.md)
- Open an issue in the Scorecards repository
