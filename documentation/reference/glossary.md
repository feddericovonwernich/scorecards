# Glossary

This glossary defines terms used throughout the Scorecards documentation.

---

## A

**Action**
The GitHub Action component of Scorecards that executes quality checks in service repositories. The action is invoked by the `scorecards.yml` workflow file.

---

## B

**Badge**
A visual indicator (SVG image) showing a service's score or rank, typically displayed in the README. Generated automatically and served via shields.io.

**Bronze Rank**
The lowest quality rank, awarded to services scoring 0-49%. Indicates basic quality standards need improvement.

**Bulk Trigger**
Triggering the Scorecards workflow across multiple services simultaneously using the `trigger-service-workflow.yml` workflow with `mode=bulk`.

---

## C

**Catalog**
The web-based user interface that displays scorecard results across all services. Hosted on GitHub Pages and built from the catalog branch.

**Catalog Branch**
A dedicated Git branch (typically named `catalog`) that stores all scorecard results, badges, registry data, and the catalog UI. Served via GitHub Pages.

**Catalog Token**
A GitHub Personal Access Token (stored as `SCORECARDS_CATALOG_TOKEN`) that allows the action to write results to the catalog branch. Requires `repo` scope.

**Category**
A grouping of related checks. Default categories include: documentation, testing, architecture, security, and operations.

**Check**
An individual quality measurement that examines one aspect of a repository. Checks are pass/fail and have an associated weight (point value).

**Check Script**
The executable file (`check.sh`, `check.py`, or `check.js`) that implements a check's logic. Must exit with 0 for pass, 1 for fail.

**Checks Hash**
A SHA256 hash of all check implementations, metadata, and weights. Used to detect when checks have been updated and results are stale.

**Consolidated Registry**
A single JSON file (`registry/consolidated-registry.json`) that aggregates data from all individual service registry files for efficient loading by the catalog UI.

**Config File**
The `.scorecard/config.yml` file in a service repository that customizes which checks run and provides service metadata (team, description, links).

---

## D

**Default Branch**
The primary branch of a repository (typically `main` or `master`). Scorecards runs on the default branch and detects it automatically.

**Disabled Check**
A check that is excluded from running for a specific service, configured in `.scorecard/config.yml`. Disabled checks don't affect the score.

---

## E

**Enabled Check**
A check that is active and will run for a service. By default, all checks are enabled unless explicitly disabled or using the `enabled` whitelist mode.

---

## F

**Failed Check**
A check that did not meet its quality criteria (exit code 1). Failed checks contribute 0 points to the score.

---

## G

**GitHub Actions**
The CI/CD platform where Scorecards checks execute. Workflows are defined in `.github/workflows/`.

**GitHub Pages**
The static site hosting service that serves the catalog UI from the catalog branch. Requires enabling in repository settings.

**Gold Rank**
A high quality rank awarded to services scoring 75-89%. Indicates strong quality practices.

---

## I

**Installation PR**
A Pull Request automatically created by the `create-installation-pr.yml` workflow that adds the Scorecards workflow to a service repository.

---

## M

**Metadata File**
The `metadata.json` file in each check directory that defines the check's name, weight, category, description, and remediation guidance.

---

## O

**OpenAPI Spec**
A standardized format (OpenAPI 3.x or Swagger 2.x) for documenting REST APIs. Checked by the "OpenAPI Spec" check.

---

## P

**Passed Check**
A check that met its quality criteria (exit code 0). Passed checks contribute their full weight to the score.

**Personal Access Token (PAT)**
A GitHub authentication token used to perform API operations. Scorecards requires `SCORECARDS_CATALOG_TOKEN` with `repo` scope.

**Platform Team**
The team responsible for managing the central Scorecards infrastructure (the scorecards repository, catalog, and system workflows).

**Platinum Rank**
The highest quality rank, awarded to services scoring 90-100%. Indicates exemplary quality practices.

**Points**
The scoring unit used to calculate quality scores. Each check has a weight (possible points), and passing earns those points.

---

## R

**Rank**
A quality tier (Bronze, Silver, Gold, Platinum) assigned based on score percentage. Ranks provide a quick visual indicator of quality level.

**Registry**
The collection of JSON files in the catalog branch that store metadata and results for each service. Located in `registry/{org}/{repo}.json`.

**Registry Consolidation**
The process of aggregating individual service registry files into a single consolidated registry for efficient catalog loading. Performed by the `consolidate-registry` workflow.

**Remediation**
Guidance on how to fix a failing check, provided in the check's metadata and displayed in the catalog UI.

**Results File**
The JSON file (`results.json`) generated by the action containing all check results, scores, and metadata. Committed to the catalog branch at `registry/{org}/{repo}.json`.

---

## S

**Schedule**
The cron expression that determines when Scorecards automatically runs (e.g., `0 0 * * *` for daily at midnight UTC).

**Score**
A percentage (0-100%) representing the proportion of possible quality points earned. Calculated as: (Points Earned / Total Possible Points) × 100.

**Scorecard**
A complete quality assessment for a service, including all check results, score, rank, and metadata.

**Service**
A repository that has Scorecards installed and is being measured for quality.

**Service Team**
The team responsible for a specific service repository, as opposed to the platform team managing Scorecards infrastructure.

**Silver Rank**
A moderate quality rank awarded to services scoring 50-74%. Indicates basic quality standards are met.

**Staleness**
The state of results being outdated because checks have been updated since the service last ran. Indicated by checks hash mismatch.

**Stale Indicator**
A visual marker (usually yellow/orange) in the catalog UI showing that a service's results are stale and should be refreshed.

---

## T

**Test Coverage**
The percentage of code lines/branches exercised by tests. Checked by the "Test Coverage" check (typically requires >80%).

**Timestamp**
The date and time when checks last ran for a service. Displayed in the catalog UI and stored in the results file.

**Token Permissions**
The scopes granted to a Personal Access Token. Scorecards requires `repo` scope (or `public_repo` for public-only repos).

**Trigger**
The event that causes a workflow to run (e.g., push, schedule, workflow_dispatch).

---

## W

**Weight**
The point value assigned to a check, indicating its importance. Higher weight = more impact on score. Defined in `metadata.json`.

**Workflow**
A GitHub Actions YAML file that defines when and how jobs run. Scorecards uses multiple workflows for installation, check execution, registry consolidation, and maintenance.

**Workflow Dispatch**
A manual trigger mechanism allowing workflows to be run on-demand via the GitHub UI or CLI (`gh workflow run`).

---

## Related Documentation

- [Configuration Reference](configuration.md) - Detailed configuration options
- [Action Reference](action-reference.md) - Action inputs and outputs
- [Workflows Reference](workflows.md) - All system workflows
- [Architecture Overview](../architecture/overview.md) - System architecture

---

## Contributing to This Glossary

If you encounter an undefined term in the documentation:
1. Add it to this glossary
2. Provide a clear, concise definition
3. Link to related documentation where appropriate
4. Submit a PR with your addition

Keep definitions:
- **Concise** - 1-3 sentences
- **Clear** - Avoid jargon in definitions
- **Accurate** - Match actual implementation
- **Helpful** - Provide context for understanding
