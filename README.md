# Scorecards - Catalog Branch

This is the **catalog branch** of the scorecards system. It serves as the data storage and GitHub Pages hosting branch.

## Purpose

- **Data Storage**: Stores scorecard results, badges, and service registry
- **GitHub Pages**: Hosts the web-based catalog interface
- **No System Code**: Does not contain action code or check definitions (those are on the main branch)

## Structure

- `/docs/` - Catalog web interface (synced from main branch)
- `/results/` - Service scorecard results
- `/badges/` - Badge JSON files for shields.io
- `/registry/` - Service registry and metadata

## Automated Updates

This branch is automatically updated by:
1. Service repositories running the scorecard action
2. The docs sync workflow (keeps documentation current)

**Do not manually edit files in this branch** - they are maintained by automation.

## Main Branch

For system code, check definitions, and development, see the `main` branch.
