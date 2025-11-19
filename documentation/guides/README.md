# User Guides

This section contains step-by-step guides for using Scorecards.

## Available Guides

- **[Usage](usage.md)** - Installation and day-to-day usage patterns
- **[Configuration](configuration.md)** - Configure .scorecard/config.yml

## Quick Start

New to Scorecards? Start here:

1. **Platform teams**: Follow the [Platform Installation Guide](platform-installation.md) to set up Scorecards for your organization
2. **Service teams**: Follow the [Service Installation Guide](service-installation.md) to add Scorecards to your repository
3. Configure your repository using the [Configuration Guide](configuration.md)

## Common Tasks

### Setting Up a New Repository

1. Trigger installation workflow from Scorecards repository
2. Review and merge the installation PR
3. Configure `.scorecard/config.yml` with team and description
4. Push to main branch to trigger first scorecard run

### Improving Your Score

1. Check workflow output to see which checks failed
2. Review [Check Catalog](../reference/check-catalog.md) for requirements
3. Make improvements to your repository
4. Push changes and see updated score

### Adding Custom Checks

See the [Check Development Guide](../reference/check-catalog.md) for detailed instructions on creating custom quality checks for your organization.

## Getting Help

If you encounter issues:

1. Review the [Usage Guide troubleshooting section](usage.md#troubleshooting)
2. Review workflow logs in GitHub Actions
3. Open an issue in the Scorecards repository
