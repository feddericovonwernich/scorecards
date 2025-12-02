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

Create `.github/workflows/scorecards.yml` in your repository:

> **Important:** Replace `your-org/scorecards` with your organization's central scorecards repository (set up by your platform team), not the template repository.

```yaml
name: Scorecards

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
  push:
    branches:
      - main  # or your default branch
  workflow_dispatch:

jobs:
  scorecards:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Scorecards
        uses: feddericovonwernich-org/scorecards/action@main
        with:
          github-token: ${{ secrets.SCORECARDS_PAT }}
          scorecards-repo: 'your-org/scorecards'  # Replace with YOUR organization's scorecards repo
```

**What to customize:**
- `scorecards-repo`: Your organization's central scorecards repository (e.g., `acme-corp/scorecards`)

### Step 2: Add SCORECARDS_PAT Secret

> **Note:** Your platform team may have already configured `SCORECARDS_PAT` as an organizational secret. If so, you can skip this step. Check with your platform team or try running the workflow - it will only fail if the secret is missing.

1. Create a Personal Access Token (PAT) with `repo` scope:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Select `repo` scope
   - Generate and copy the token

2. Add it to your repository secrets:
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `SCORECARDS_PAT`
   - Value: Paste your PAT
   - Click "Add secret"

3. This allows pushing results to the central catalog

### Step 3: Push to Default Branch

Once you've added the workflow and secret, push to your default branch. The scorecard will run automatically!

### Step 4: View Your Results

After the first run:
1. Visit the [Scorecards Catalog](https://feddericovonwernich-org.github.io/scorecards/)
2. Find your service in the list
3. See your score, rank, and detailed check results

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
  name: "My Awesome Service"
  team: "Platform Team"
  description: "Handles user authentication and authorization"
  links:
    - name: "Documentation"
      url: "https://docs.example.com/my-service"
    - name: "Runbook"
      url: "https://wiki.example.com/runbooks/my-service"

custom:
  criticality: "high"
  environment: "production"
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

1. Create a PAT with `repo` scope (GitHub Settings → Developer settings → Personal access tokens)
2. Add it as a repository secret named `SCORECARDS_PAT`
3. Use it in your workflow:
   ```yaml
   github-token: ${{ secrets.SCORECARDS_PAT }}
   ```

### Service doesn't appear in catalog

1. Check that the action ran successfully in the Actions tab
2. Verify that `scorecards-repo` is set correctly in your workflow
3. Check that results were committed to the catalog branch in the central repository
4. Wait a few minutes for GitHub Pages to update

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
