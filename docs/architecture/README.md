# Architecture Documentation

This section contains detailed architecture documentation for the Scorecards system.

## Documents

- **[Overview](overview.md)** - High-level system architecture and data flow
- **[Checks System](checks-system.md)** - How checks are implemented and executed
- **[GitHub Action](github-action.md)** - GitHub Action implementation details
- **[Catalog UI](catalog-ui.md)** - Web interface architecture and features

## Design Principles

1. **Non-Blocking** - Never fail CI, always succeed even if checks fail
2. **Isolated** - Checks run in Docker containers for security
3. **Extensible** - Easy to add new checks without modifying core system
4. **Transparent** - All results visible in centralized catalog

## System Overview

The Scorecards system consists of several key components:

- **Service Repositories**: Individual repositories being scored
- **GitHub Action**: Executes checks and updates results
- **Check Suite**: Collection of quality checks
- **Catalog Branch**: Stores all results and serves GitHub Pages
- **Catalog UI**: Web interface for browsing results

See [Overview](overview.md) for detailed architecture diagrams and explanations.
