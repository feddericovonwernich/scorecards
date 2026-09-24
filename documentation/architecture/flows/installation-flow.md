# Installation Flow

This document describes how service repositories are onboarded to the scorecards system via automated pull requests.

## Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│          Scorecards Repository (Main)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Manual Trigger: create-installation-pr.yml            │ │
│  │  Input: target_org/target_repo                         │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ 1. Trigger workflow_dispatch
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│          Installation Workflow (install.yml)                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  2. Checkout target repository                         │ │
│  │  3. Generate workflow file                             │ │
│  │     .github/workflows/scorecards.yml                   │ │
│  │  4. Generate config template                           │ │
│  │     .scorecard/config.yml                              │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ 5. Create branch & push
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│          Target Service Repository                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  New Branch: scorecards-installation                   │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  .github/workflows/scorecards.yml                │  │ │
│  │  │  .scorecard/config.yml                           │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ 6. Create PR via GitHub API
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│          GitHub Pull Request                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Title: "Add scorecards quality tracking"             │ │
│  │  Body: Setup instructions and explanation             │ │
│  │  Files: scorecards.yml, config.yml                     │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ 7. Track PR in registry
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│          Catalog Branch Registry                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  registry/{org}/{repo}.json                            │ │
│  │  {                                                      │ │
│  │    "repo": "org/repo",                                 │ │
│  │    "installed": false,                                 │ │
│  │    "installation_pr": {                                │ │
│  │      "number": 123,                                    │ │
│  │      "state": "open",                                  │ │
│  │      "url": "https://github.com/org/repo/pull/123"    │ │
│  │    }                                                    │ │
│  │  }                                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ 8. Team reviews & merges PR
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│          Service Repository (Main Branch)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  .github/workflows/scorecards.yml ✓                    │ │
│  │  .scorecard/config.yml ✓                               │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ 9. Workflow runs on schedule or push
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│          First Scorecard Run                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  - Runs all checks                                     │ │
│  │  - Calculates initial score                            │ │
│  │  - Updates registry: installed=true                    │ │
│  │  - Generates badge                                     │ │
│  │  - Service appears in catalog UI                       │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Step Details

### 1. Trigger Installation

**Workflow**: `.github/workflows/create-installation-pr.yml`

**Trigger Method**: Workflow dispatch in the central repository, either directly via GitHub UI/API or through the service's reusable `install.yml` caller.

**Required Inputs**:

- `org`: Target owner
- `repo`: Target repository

**Optional Inputs**:

- `scorecards-repo`: Central Scorecards repository
- `scorecards-branch`: Central catalog branch
- `retry-closed`: `false` by default; only an explicit `true` retries after a closed or merged installation PR

**Permissions Required**:

- Read access to the target repository
- `SCORECARDS_WORKFLOW_TOKEN` for the central dispatcher to create the installation branch and PR
- Central Actions read/write for the reusable caller to dispatch the owner and retrieve its completed result; see [Token Requirements](../../reference/token-requirements.md#operation-matrix).

### 2. Checkout Target Repository

The central owner checks out `org/repo` into `service-repo` using `SCORECARDS_WORKFLOW_TOKEN`. The reusable workflow runs evaluation in its caller repository but delegates every PR creation to that same central owner. The maintained workflow files are [`.github/workflows/create-installation-pr.yml`](../../../.github/workflows/create-installation-pr.yml) and [`.github/workflows/install.yml`](../../../.github/workflows/install.yml).

### 3. Generate Workflow File

The installer copies the maintained [scorecard workflow template](../../examples/scorecard-workflow-template.yml), substituting the configured Scorecards repository and catalog branch. The template separately checks out the service and the platform, then supplies `service-workspace` to the Action so the captured evaluation provenance names the service revision. It is the authoritative generated-workflow contract; this flow intentionally does not duplicate its YAML.

### 4. Generate Config Template

**Implementation**: `.github/workflows/create-installation-pr.yml`

**Generated File**: `.scorecard/config.yml`

**Template Content**:

```yaml
service:
  name: '{repository_name}'
  team: ''
  description: ''
  links: []
```

**Auto-populated Fields**:

- `service.name`: Populated from repository name
- `service.team`: Empty string (must be manually filled)
- `service.description`: Empty string (must be manually filled)
- `service.links`: Empty array (can be populated with documentation links)

### 5. Resolve PR state, create branch and push

The central owner resolves these states inside its target-keyed native concurrency boundary:

- workflow already present: `installed`;
- newest labeled PR open: return its number and URL, without creating a branch;
- newest labeled PR closed or merged: stop by default;
- no prior PR, or closed/merged plus `retry-closed: true`: create a new attempt.

Each new attempt uses `scorecards-install-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}`. It commits the generated workflow and config, then performs a normal push. A push failure stops before PR creation. Old fixed-name or prior-attempt branches remain untouched; the workflows never delete or force-update them.

### 6. Create or return the pull request

For a new attempt, `gh pr create --head` receives exactly the branch emitted by the preparation step. The workflow returns `pr-number`, `pr-state` and the full `pr-url`.

For an open PR, those outputs identify the existing PR. For a closed or merged PR with `retry-closed: false`, no success output claims a new PR. Closing is therefore durable until a caller or dispatcher explicitly requests another uniquely named attempt.

The reusable path dispatches the central owner and waits for the correlated run to complete successfully before consuming its result. Dispatch acceptance alone is not installation success. Both entrypoints run PR creation in the same central repository; queued attempts recheck PR state and reuse an open PR. Failure, cancellation, missing results or an expired wait is surfaced to the caller. GitHub can replace pending requests; no FIFO guarantee is claimed.

### 7. Track PR in Registry

**Implementation**: `.github/workflows/create-installation-pr.yml`; the reusable caller separately evaluates and publishes service results.

**Creates Registry Entry**:

```json
{
  "repo": "myorg/myservice",
  "org": "myorg",
  "name": "myservice",
  "installed": false,
  "has_workflow": false,
  "default_branch": "main",
  "installation_pr": {
    "number": 123,
    "state": "open",
    "url": "https://github.com/myorg/myservice/pull/123",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "team": "MyTeam",
  "description": "My service description"
}
```

**Registry Location**: `registry/{org}/{repo}.json` in catalog branch

**Purpose**:

- Track installation progress
- Display PR status in catalog UI
- Monitor which services are pending installation

### 8. Team Reviews & Merges

**Manual Step**: Service team reviews the PR

**Review Checklist**:

- [ ] Workflow file looks correct
- [ ] Config has accurate team name
- [ ] Config has accurate description
- [ ] Comfortable with automatic scoring

**Post-Merge**:

- `installed` flag remains false until first run
- `has_workflow` still false until detected

### 9. First Scorecard Run

**Trigger**: Workflow runs automatically based on schedule (daily at midnight UTC), on push to main/master, or manual workflow_dispatch

**Actions**:

1. The service workflow runs on its default branch and records the service SHA.
2. Checks execute and the score, result files and individual `registry/{org}/{repo}.json` entry are published to `catalog`.
3. The catalog push triggers `Consolidate Registry`, which must complete successfully using the central job-scoped token.
4. `registry/all-services.json` must contain the service.
5. A fresh browser context must find the service in the deployed Services view.

An evaluation or individual registry entry can exist before consolidation. Neither alone proves UI visibility.

**Registry Update**:

```json
{
  "repo": "myorg/myservice",
  "installed": true,
  "has_workflow": true,
  "score": 85,
  "rank": "Gold",
  "last_run": "2024-01-15T11:00:00Z",
  "checks_hash": "abc123...",
  "installation_pr": {
    "number": 123,
    "state": "merged",
    "merged_at": "2024-01-15T10:45:00Z"
  }
}
```

## Bulk Installation

**Feature**: Install scorecards in multiple repositories at once

**Implementation**: Loop through repository list

```bash
for repo in repo1 repo2 repo3; do
  gh workflow run create-installation-pr.yml \
    -f org="myorg" -f repo="$repo"
  sleep 5  # Rate limiting
done
```

**Use Cases**:

- Onboarding entire organization
- Rolling out to team's repositories
- Batch installation for new initiative

## Installation Verification

**Check Installation Status**:

1. **Via Catalog UI**: Look for installation_pr badge
2. **Via Registry**: Check `installed` and `has_workflow` flags
3. **Via GitHub**: Check for workflow file in repository

**Troubleshooting**:

**PR Not Created**:

- Check PAT permissions
- Verify repository exists and is accessible
- Check workflow logs for errors

**Workflow Not Running**:

- Verify workflow file in `.github/workflows/`
- Check if workflow is disabled
- Verify trigger conditions (push to correct branch)

**Score Not Updating**:

- Check workflow run logs
- Verify GITHUB_TOKEN has write access to catalog
- Check for conflicts in catalog branch

## Related Documentation

- [Scoring Flow](scoring-flow.md) - What happens after installation
- [Architecture Overview](../overview.md) - System architecture
- [Catalog UI](../catalog-ui.md) - Viewing installation status
