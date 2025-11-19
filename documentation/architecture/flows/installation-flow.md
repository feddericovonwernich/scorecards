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

**Trigger Method**: Manual workflow_dispatch via GitHub UI or API

**Required Inputs**:
- `target_repository`: Full repository path (e.g., `myorg/myservice`)

**Optional Inputs**:
- `team_name`: Pre-populate team name in config
- `description`: Pre-populate service description

**Permissions Required**:
- Read access to target repository
- Write access to create branch and PR
- Uses `SCORECARDS_PAT` token with appropriate scopes

### 2. Checkout Target Repository

**Implementation**: `.github/workflows/install.yml`

```yaml
- name: Checkout target repository
  uses: actions/checkout@v4
  with:
    repository: ${{ inputs.target_repository }}
    token: ${{ secrets.SCORECARDS_PAT }}
    path: target-repo
```

**Purpose**: Clone target repository to analyze and modify

**Branch**: Checks out default branch (main/master/etc.)

### 3. Generate Workflow File

**Implementation**: `.github/workflows/install.yml`

**Generated File**: `.github/workflows/scorecards.yml`

**Template Content**:
```yaml
name: Scorecards

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
  push:
    branches: [main, master]
  workflow_dispatch:

jobs:
  scorecard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Scorecards
        uses: {scorecards_org}/{scorecards_repo}@main
        with:
          catalog_repo: {scorecards_org}/{scorecards_repo}
          catalog_branch: catalog
```

**Dynamic Values**:
- Branch names detected from target repo
- Scorecards repo reference from environment
- Catalog configuration from settings

### 4. Generate Config Template

**Implementation**: `.github/workflows/install.yml`

**Generated File**: `.scorecard/config.yml`

**Template Content**:
```yaml
service:
  name: "{repository_name}"
  team: ""
  description: ""
  links: []
```

**Auto-populated Fields**:
- `service.name`: Populated from repository name
- `service.team`: Empty string (must be manually filled)
- `service.description`: Empty string (must be manually filled)
- `service.links`: Empty array (can be populated with documentation links)

### 5. Create Branch & Push

**Implementation**: `.github/workflows/install.yml`

**Branch Name**: `scorecards-installation`

**Git Operations**:
```bash
git checkout -b scorecards-installation
git add .github/workflows/scorecards.yml
git add .scorecard/config.yml
git commit -m "Add scorecards quality tracking"
git push origin scorecards-installation
```

**Conflict Handling**:
- Checks if branch already exists
- If exists, updates existing branch
- If PR already exists, updates the PR

### 6. Create Pull Request

**Implementation**: `.github/workflows/install.yml`

**GitHub API Call**:
```bash
gh pr create \
  --repo "$TARGET_REPO" \
  --base "$DEFAULT_BRANCH" \
  --head scorecards-installation \
  --title "Add scorecards quality tracking" \
  --body "$(cat <<'EOF'
# Scorecards Quality Tracking

This PR adds automated quality scoring to this repository.

## What's Being Added

- `.github/workflows/scorecards.yml` - Workflow that runs quality checks
- `.scorecard/config.yml` - Configuration for team and service metadata

## How It Works

Every push to the main branch will:
1. Run quality checks (documentation, tests, CI, etc.)
2. Calculate a weighted score
3. Update the central catalog

## Next Steps

1. Review the config file and update team/description
2. Merge this PR to activate scorecards
3. View your score at [catalog URL]

## Documentation

See [link to docs] for more information.
EOF
)"
```

**PR Features**:
- Descriptive title and body
- Links to documentation
- Instructions for team
- Auto-assignable to team members

### 7. Track PR in Registry

**Implementation**: `.github/workflows/install.yml`

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
1. Scorecards workflow runs for first time
2. Executes all quality checks
3. Calculates initial score and rank
4. Updates registry:
   - `installed: true`
   - `has_workflow: true`
   - Adds score, rank, timestamp
   - Adds check results
5. Generates badge
6. Service appears in catalog UI

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
    -f target_repository="myorg/$repo"
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

## Security

**Token Requirements**:
- `SCORECARDS_PAT` must have:
  - `repo` scope (to create branches and PRs)
  - `workflow` scope (to add workflow files)
- Token should be organization-scoped if possible

**Permissions**:
- Installation workflow runs with elevated permissions
- Target repository sees standard GITHUB_TOKEN permissions
- Catalog updates require write access to catalog branch

**Privacy**:
- No sensitive data collected
- Only public repository metadata
- Scores calculated from publicly visible artifacts

## Related Documentation

- [Scoring Flow](scoring-flow.md) - What happens after installation
- [Architecture Overview](../overview.md) - System architecture
- [Catalog UI](../catalog-ui.md) - Viewing installation status
