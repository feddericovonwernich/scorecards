# Installation Flow

This document describes how service repositories are onboarded to the scorecards system via automated pull requests.

## Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ Service repository                                            │
│ install.yml (reusable caller)                                │
│ - evaluates the service                                      │
│ - dispatches and awaits the central owner                    │
└────────────────┬─────────────────────────────────────────────┘
                 │ correlated workflow_dispatch
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ Central Scorecards repository                                 │
│ create-installation-pr.yml (sole PR owner)                   │
│ - serializes work by target repository                        │
│ - creates or returns a labeled installation PR                │
└────────────────┬─────────────────────────────────────────────┘
                 │ new attempt only
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ Target service repository                                     │
│ scorecards-install-${run_id}-${attempt} branch               │
│ - .github/workflows/scorecards.yml                            │
│ - .scorecard/config.yml                                      │
│                    │                                         │
│                    └──► labeled pull request for review      │
└──────────────────────────────────────────────────────────────┘
                 │ after merge: service workflow runs
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ Catalog branch                                                │
│ service action publishes results and a registry entry         │
│ Consolidate Registry writes registry/all-services.json        │
└────────────────┬─────────────────────────────────────────────┘
                 │ non-empty consolidated registry, or tree fallback
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ Catalog UI                                                    │
│ Services view reads current catalog data                      │
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

**Credentials:** The central owner uses `SCORECARDS_WORKFLOW_TOKEN`; reusable callers also use it to dispatch and read the correlated owner run. The exact permission matrix is authoritative in [Token Requirements](../../reference/token-requirements.md#operation-matrix).

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
- a labeled PR is open: return its number and URL, without creating a branch;
- a labeled PR is closed or merged: stop by default;
- no prior PR, or a closed/merged PR plus `retry-closed: true`: create a new attempt.

Each new attempt uses `scorecards-install-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}`. It commits the generated workflow and config, then performs a normal push. A push failure stops before PR creation. Old fixed-name or prior-attempt branches remain untouched; the workflows never delete or force-update them.

### 6. Create or return the pull request

For a new attempt, `gh pr create --head` receives exactly the branch emitted by the preparation step. The workflow returns `pr-number`, `pr-state` and the full `pr-url`.

For an open PR, those outputs identify the existing PR. For a closed or merged PR with `retry-closed: false`, no success output claims a new PR. Closing is therefore durable until a caller or dispatcher explicitly requests another uniquely named attempt.

The reusable path dispatches the central owner and waits for the correlated run to complete successfully before consuming its result. Dispatch acceptance alone is not installation success. Both entrypoints run PR creation in the same central repository; queued attempts recheck PR state and reuse an open PR. Failure, cancellation, missing results or an expired wait is surfaced to the caller. GitHub can replace pending requests; no FIFO guarantee is claimed.

### 7. Track a newly created PR in the registry

Only a newly created installation PR triggers the central registry update. Reused open PRs and closed/merged PRs do not write a replacement entry. The owner writes `registry/{org}/{repo}.json` on `catalog`; the service evaluation later updates that individual entry with score results. See [the workflow reference](../../reference/workflows.md#create-installation-pryml) for the owner outputs and publication conditions.

### 8. Team Reviews & Merges

**Manual Step**: Service team reviews the PR

**Review Checklist**:

- [ ] Workflow file looks correct
- [ ] Config has accurate team name
- [ ] Config has accurate description
- [ ] Comfortable with automatic scoring

After merge, the installed service workflow is the regular scoring entrypoint. Its first completed catalog publication establishes the service's current registry data.

### 9. First Scorecard Run

**Trigger**: Workflow runs automatically based on schedule (daily at midnight UTC), on push to main/master, or manual workflow_dispatch

The service action publishes individual results, then central consolidation
updates the aggregate registry consumed by the UI. Follow the
[first-service verification](../../guides/service-installation.md#step-4-verify-the-first-service-end-to-end)
for the authoritative catalog-to-UI gate; evaluation alone does not prove visibility.

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

- Check `SCORECARDS_WORKFLOW_TOKEN` access and the central owner run; see [Token Requirements](../../reference/token-requirements.md#operation-matrix).
- Verify the repository exists and is accessible.
- Check the owner workflow logs for the returned status.

**Workflow Not Running**:

- Verify the workflow file in `.github/workflows/`.
- Check whether the workflow is disabled.
- Verify trigger conditions on the service default branch.

**Score Not Updating**:

- Check the service workflow run and catalog publication.
- Verify `SCORECARDS_CATALOG_TOKEN` can write to the central catalog; it is not the central consolidation credential.
- Follow the [first-service visibility checks](../../guides/service-installation.md#step-4-verify-the-first-service-end-to-end).

## Related Documentation

- [Scoring Flow](scoring-flow.md) - What happens after installation
- [Architecture Overview](../overview.md) - System architecture
- [Catalog UI](../catalog-ui.md) - Viewing installation status
