# User Guides

This section contains step-by-step guides for using Scorecards.

## Available Guides

- **[Installation](installation.md)** - Install Scorecards in your repository
- **[Configuration](configuration.md)** - Configure .scorecard/config.yml
- **[Usage](usage.md)** - Day-to-day usage patterns and workflows
- **[Adding Checks](adding-checks.md)** - Create new quality checks
- **[Using Shared Libraries](using-shared-libraries.md)** - Use common utility functions
- **[Troubleshooting](troubleshooting.md)** - Common issues and solutions

## Quick Start

New to Scorecards? Start here:

1. Read [Getting Started](../getting-started.md) for a quick overview
2. Follow [Installation](installation.md) to install in your repo
3. Configure your repository using [Configuration](configuration.md)
4. Learn about daily use in [Usage](usage.md)

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

See [Adding Checks](adding-checks.md) for detailed instructions on creating custom quality checks for your organization.

## Getting Help

If you encounter issues:

1. Check [Troubleshooting](troubleshooting.md)
2. Review workflow logs in GitHub Actions
3. Open an issue in the Scorecards repository
