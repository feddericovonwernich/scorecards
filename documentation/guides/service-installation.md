# Service Installation Guide

This guide is for **service teams** who want to add Scorecards to their service repository.

> **Are you a platform team?** See [Platform Installation Guide](platform-installation.md) to set up the central system first.

## Prerequisites

Before you begin, ensure:

- Your service is in a GitHub repository
- You have access to GitHub Actions
- You can modify your repository's workflow files
- The central Scorecards system is set up by your platform team

## Installation

### Step 1: Add Scorecard Action to CI

Copy the maintained [scorecard workflow template](../examples/scorecard-workflow-template.yml) to `.github/workflows/scorecards.yml`, replacing its central repository and default-branch placeholders for your organization.

The template checks out the service and Scorecards separately and passes `service-workspace` to the local Action. This records the actual revisions without adding platform files to the service being evaluated. Older workflows continue to score but may not supply the provenance required to offer remediation.

### Step 2: Add SCORECARDS_CATALOG_TOKEN Secret

Provide `SCORECARDS_CATALOG_TOKEN` to the scoring workflow, preferably through an organization secret limited to the intended repositories. It needs write access to the central catalog; the service's default `GITHUB_TOKEN` does not automatically have cross-repository permission. See the [token requirements](../reference/token-requirements.md) rather than creating a second token configuration here.

Remediation is a separate central workflow and is **not** enabled by installing scoring. A platform operator must explicitly allowlist your service/check/actors and verify its activation prerequisites. Any correction arrives as a PR for human review, never as a direct commit to your default branch. See the [remediation flow](../architecture/flows/remediation-flow.md).

### Step 3: Push to the Configured Branch

Push to a branch configured in the copied workflow. The maintained template runs on `main` and `master`; update those triggers if your default branch differs.

### Step 4: Verify the first service end to end

Treat the first service as an operational gate:

1. Confirm the service workflow can access `SCORECARDS_CATALOG_TOKEN` without printing it.
2. Run the maintained workflow on the service's default branch; record its run URL, service SHA and successful conclusion.
3. Confirm `registry/{org}/{repo}.json` and `results/{org}/{repo}/results.json` exist on the central `catalog` branch.
4. Find the `Consolidate Registry` run triggered by that catalog push and require a successful conclusion. It uses the central job-scoped token, not the catalog PAT.
5. Read `registry/all-services.json` and require the service entry and expected count.
6. Open the deployed Pages URL in a fresh browser context and find the service in the Services view.

```bash
gh run list --repo "$FULL_REPO" --workflow consolidate-registry.yml \
  --branch catalog --event push --limit 5 \
  --json databaseId,status,conclusion,url,headSha
gh api "repos/$FULL_REPO/contents/registry/all-services.json?ref=catalog" \
  --jq .content | base64 --decode
```

Reloading the UI does not replace the registry and workflow checks. Before any service exists, the UI legitimately shows its empty state; while consolidation is delayed, it falls back to individual registry entries.

### Step 5: Add Badges to Your README (Optional)

Show your quality score directly in your README:

```markdown
# My Service

![Scorecard Score](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR-ORG/scorecards/catalog/badges/your-org/your-repo/score.json)
![Scorecard Rank](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR-ORG/scorecards/catalog/badges/your-org/your-repo/rank.json)

...rest of your README...
```

**Replace the following:**

- `YOUR-ORG/scorecards` - Your organization's central scorecards repository (e.g., `acme-corp/scorecards`)
- `your-org/your-repo` - Your service's organization and repository name (e.g., `acme-corp/payment-service`)

The badges update automatically when your score changes.

## Optional: Add Service Metadata

For better visibility in the catalog, create a config file with service metadata.

Create `.scorecard/config.yml`:

```yaml
service:
  name: 'My Awesome Service'
  team: 'Platform Team'
  description: 'Handles user authentication and authorization'
  links:
    - name: 'Documentation'
      url: 'https://docs.example.com/my-service'
    - name: 'Runbook'
      url: 'https://wiki.example.com/runbooks/my-service'

custom:
  criticality: 'high'
  environment: 'production'
```

**Benefits of adding metadata:**

- Custom service names in the catalog (instead of repo names)
- Team ownership visibility
- Useful links directly in the catalog
- Improved searchability and organization

See [Configuration Guide](../reference/configuration.md) for all available options.

## Troubleshooting

### Workflow not running

Check that the file is in `.github/workflows/` and GitHub Actions is enabled for your repository.

### Action fails with "Permission denied"

Ensure your token has write access to the central scorecards repository:

Check the `SCORECARDS_CATALOG_TOKEN` secret, its selected repositories/permissions and organization approval using the [token requirements](../reference/token-requirements.md). The maintained workflow uses it both for central checkout and catalog publication; do not substitute a service-scoped `GITHUB_TOKEN` for cross-repository access.

### Service does not appear in the catalog

Repeat the [first-service gate](#step-4-verify-the-first-service-end-to-end) in order:

1. Verify the service evaluation run and recorded service SHA.
2. Verify the individual registry and result files on `catalog`.
3. Verify the matching consolidation run completed successfully.
4. Verify `all-services.json` contains the entry.
5. Use a fresh browser context to distinguish deployed UI state from cached content.

A successful scoring run alone does not prove consolidation or visibility. If consolidation cannot push because of a `catalog` rule, resolve that rule explicitly; do not grant a broader PAT as an automatic fallback.

### Checks failing unexpectedly

View detailed check results in the catalog:

1. Visit the catalog page
2. Click on your service card
3. Review each check's output and error messages

### Want to improve your score?

1. Review failing checks in the catalog
2. Read each check's description to understand what it validates
3. Fix issues in your repository
4. Push changes to trigger a new scorecard run

## Advanced Patterns

### Running scorecards on pull requests

You can run scorecards on PRs without committing results to the catalog:

```yaml
on:
  pull_request:
    branches: [main]

jobs:
  scorecard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Scorecards (PR Check)
        uses: feddericovonwernich-org/scorecards/action@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          # Don't set scorecards-repo to avoid committing on PRs
```

This gives contributors immediate feedback on quality before merging.

### Using action outputs

Access scorecard results in subsequent workflow steps:

```yaml
- name: Run Scorecards
  id: scorecard
  uses: feddericovonwernich-org/scorecards/action@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}

- name: Comment on PR
  run: |
    echo "Score: ${{ steps.scorecard.outputs.score }}"
    echo "Rank: ${{ steps.scorecard.outputs.rank }}"
```

See the [Action Reference](../reference/action-reference.md) for all available outputs.

## Next Steps

After installation:

1. **Monitor your score** - Visit the catalog regularly
2. **Make improvements** - Address failing checks
3. **Share progress** - Use badges to show your quality standards
4. **Provide feedback** - Help improve checks and scoring

## Additional Resources

- [Action Reference](../reference/action-reference.md) - Action inputs, outputs, and advanced usage
- [Configuration Guide](../reference/configuration.md) - Complete configuration options
- [Check Development Guide](check-development-guide.md) - How to create custom checks
- [Platform Installation Guide](platform-installation.md) - For platform teams
