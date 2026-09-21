# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Preserve remediation source contents, reuse mixed-case destination PRs, retain accepted requests and verified run links when discovery fails, and align installation template consumers.
- Preserve case-sensitive remediation badge URLs and publish validated README bytes without Git encoding/filter conversions; document fresh scoring and separate service/platform checkouts.

- Keep API Explorer's long source URLs, expanded schemas and responses reachable on narrow screens without horizontal page overflow.
- Preserve the compiled API Explorer during publication; use Pages-compatible hash routes with legacy Services/Teams entry redirects.
- Keep mobile service/team panels and adoption statistics visible, with scrolling confined to wide tables and code.
- Place persistent filters beside search, remove duplicated controls, and make sorting and category disclosures keyboard accessible.
- Use named native dialogs with isolated background interaction, nested focus return, and one Settings opening authority.
- Improve Settings contrast and enlarged-text reflow, enlarge compact touch targets, and clear stale service errors on retry.

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

- Optional failed-check remediation through a central workflow, tokenless Docker recipe sandbox and human-reviewed PR only; ships disabled with explicit actor/target policy and runtime/protection activation prerequisites.
- Conservative, idempotent Scorecards badge recipe for existing READMEs, evaluation provenance, correlated workflow links and maintained remediation architecture diagrams.
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
