# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **BREAKING**: Migrated catalog UI from vanilla JavaScript to React 19 + TypeScript
  - Replaced ES6 modules with React functional components
  - Replaced manual DOM manipulation with React declarative rendering
  - Replaced scattered state with Zustand stores
  - Replaced Python dev server with Vite (HMR support)
  - Added React Router for client-side navigation
  - Removed 1,183 lines of obsolete vanilla JS code
  - 263 E2E tests passing post-migration

### Added
- CHANGELOG.md to track project changes
- Glossary of domain-specific terms

## [1.0.0] - 2025-01-20

### Added
- Initial release of Scorecards quality measurement system
- GitHub Action for running quality checks
- 15 built-in quality checks across 5 categories
- Catalog UI for visualizing results across services
- GitHub Pages integration for hosting catalog
- Badge generation for README files
- Automated installation workflow
- Staleness detection for outdated results
- Registry consolidation system
- Platform and service installation guides
- Comprehensive architecture documentation
- Check development guide with examples in Bash, Python, and JavaScript
- Token requirements documentation
- Workflow reference documentation
- Configuration schema and examples

### Security
- Token security best practices documentation
- Minimal permission requirements documented
- Secure token storage via GitHub Secrets

[unreleased]: https://github.com/feddericovonwernich-org/scorecards/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/feddericovonwernich-org/scorecards/releases/tag/v1.0.0
