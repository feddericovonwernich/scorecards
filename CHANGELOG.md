# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Use ephemeral same-repository credentials for catalog UI/checks-hash publication and explicit pinned Pages artifact deployment; preserve domain files and document the coordinated legacy-source transition and rollback.
- Restrict installation targets to new or explicitly adopted empty `scorecards` repositories; see the [installation contract](documentation/guides/platform-installation.md) for publication and deployment safeguards.
- Preserve pending deployment polling, bind the installer payload to its executing checkout, and document protected release pins and source-versus-installed commit provenance.
- Fetch full pinned ancestry and preserve bootstrap failures; require single-writer acknowledgement and recheck target refs before atomic publication.
- Verify restricted Pages through isolated browser sessions without changing visibility, and compile relative assets for both private-origin and project-path hosting.
- Report registry freshness from returned service data rather than discarded consolidated responses or discovery requests.
- Treat an empty consolidated registry as provisional when individual service entries exist, exclude the legacy placeholder, and authenticate tree discovery while preserving the real empty state.
- Route both onboarding entrypoints through one central PR owner, reuse open PRs, respect closed PRs by default, and preserve earlier branches during explicit retries.
- Preserve remediation source contents, reuse mixed-case destination PRs, retain accepted requests and verified run links when discovery fails, and align installation template consumers.
- Preserve case-sensitive remediation badge URLs and publish validated README bytes without Git encoding/filter conversions; document fresh scoring and separate service/platform checkouts.
- Accept canonical GitHub repository casing in remediation links, retain the run-summary fallback for incomplete PR searches, and derive clone/push destinations only from the authorized repository.
- Consolidate installation, check/remediation authoring, and agent skill discovery into one documented route with an I01–I10/D01–D06 local evidence record and explicit outstanding cloud proof.

- Keep API Explorer's long source URLs, expanded schemas and responses reachable on narrow screens without horizontal page overflow.
- Preserve the compiled API Explorer during publication; use Pages-compatible hash routes with legacy Services/Teams entry redirects.
- Keep mobile service/team panels and adoption statistics visible, with scrolling confined to wide tables and code.
- Place persistent filters beside search, remove duplicated controls, and make sorting and category disclosures keyboard accessible.
- Use named native dialogs with isolated background interaction, nested focus return, and one Settings opening authority.
- Improve Settings contrast and enlarged-text reflow, enlarge compact touch targets, and clear stale service errors on retry.

### Changed

- Prepare the single-repository badge pilot policy with the published runtime digest and verified publisher identity; document zero-independent-approval protection, integration prerequisites and still-unexercised consumer writes.
- **BREAKING**: Retire `SCORECARDS_USE_EXISTING`, arbitrary central repository names, moving-source `curl | bash` installation, and legacy Pages setup for new installations. Existing installations require a documented manual migration rather than rerunning the installer.
- Pin runtime base/Node digests, signed Ubuntu snapshot and npm lockfile; retain scoring/sandbox compatibility without claiming bit-for-bit rebuilds.
- **BREAKING**: Migrated catalog UI from vanilla JavaScript to React 19 + TypeScript
  - Replaced ES6 modules with React functional components
  - Replaced manual DOM manipulation with React declarative rendering
  - Replaced scattered state with Zustand stores
  - Replaced Python dev server with Vite (HMR support)
  - Added React Router for client-side navigation
  - Removed 1,183 lines of obsolete vanilla JS code
  - 263 E2E tests passing post-migration

### Added

- Manual main-only GHCR runtime publication using ephemeral package credentials, real Docker smoke checks and registry digest receipts; publication and activation still require reviewed integration.
- Optional failed-check remediation through a central workflow, tokenless Docker recipe sandbox and human-reviewed PR only; see the [activation prerequisites](documentation/architecture/flows/remediation-flow.md#activación-prerrequisitos-externos-obligatorios).
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
