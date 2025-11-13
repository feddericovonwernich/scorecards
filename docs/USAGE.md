# Usage Guide

This guide explains how to integrate scorecards into your service repository.

## Prerequisites

- Your service is in a GitHub repository
- You have access to GitHub Actions
- You can modify your repository's workflow files

## Quick Start

### Step 1: Add Scorecard Action to CI

Add the scorecard action as a step in your existing GitHub Actions workflow:

```yaml
# .github/workflows/ci.yml (or your existing workflow file)
name: CI

on:
  push:
    branches:
      - main  # or your default branch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # ... your existing CI steps ...

      - name: Run Scorecards
        uses: your-org/scorecards/action@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          scorecards-repo: 'your-org/scorecards'  # Central scorecards repo
```

### Step 2: Push to Default Branch

Once you've added the action, push to your default branch. The scorecard will run automatically!

### Step 3: View Your Results

After the first run:
1. Visit the [Scorecards Catalog](https://your-org.github.io/scorecards/)
2. Find your service in the list
3. See your score, rank, and detailed check results

## Optional: Add Configuration

For better metadata and customization, create a config file:

```bash
mkdir -p .scorecard
```

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

See [CONFIG.md](./CONFIG.md) for full configuration options.

## Action Inputs

### `github-token` (required)

GitHub token for authentication. Use the built-in `GITHUB_TOKEN`:

```yaml
github-token: ${{ secrets.GITHUB_TOKEN }}
```

For committing to the central repository, you may need a Personal Access Token (PAT) with `repo` scope:

```yaml
github-token: ${{ secrets.SCORECARD_PAT }}
```

### `scorecards-repo` (optional)

The central scorecards repository where results are stored (format: `owner/repo`).

```yaml
scorecards-repo: 'your-org/scorecards'
```

If not provided, the action will detect it from the action source.

### `scorecards-branch` (optional, default: `catalog`)

The branch to commit results to in the central repository.

```yaml
scorecards-branch: 'catalog'
```

### `create-config-pr` (optional, default: `false`)

Whether to create a PR with a config template if `.scorecard/config.yml` is missing.

```yaml
create-config-pr: 'true'
```

## Action Outputs

The action provides outputs you can use in subsequent steps:

```yaml
- name: Run Scorecards
  id: scorecard
  uses: your-org/scorecards/action@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}

- name: Use Scorecard Results
  run: |
    echo "Score: ${{ steps.scorecard.outputs.score }}"
    echo "Rank: ${{ steps.scorecard.outputs.rank }}"
    echo "Passed: ${{ steps.scorecard.outputs.passed-checks }}/${{ steps.scorecard.outputs.total-checks }}"
```

Available outputs:
- `score`: The calculated score (0-100)
- `rank`: The rank (bronze, silver, gold, platinum)
- `passed-checks`: Number of checks that passed
- `total-checks`: Total number of checks run
- `results-file`: Path to the results JSON file

## Adding Badges to Your README

Add scorecard badges to your README to show your score and rank:

```markdown
# My Service

![Scorecard Score](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/your-org/scorecards/catalog/badges/your-org/your-repo/score.json)
![Scorecard Rank](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/your-org/scorecards/catalog/badges/your-org/your-repo/rank.json)

...rest of your README...
```

Replace `your-org` and `your-repo` with your organization and repository names.

## Understanding Your Score

### How Scores Are Calculated

Each check has a weight (1-20) indicating its importance. Your score is calculated as:

```
score = (sum of passed check weights / sum of all check weights) × 100
```

Example:
- Check A (weight: 10): Pass ✓
- Check B (weight: 15): Fail ✗
- Check C (weight: 5): Pass ✓

Score = (10 + 5) / (10 + 15 + 5) × 100 = 50

### Ranks

| Rank | Score Range | Meaning |
|------|-------------|---------|
| 🏆 Platinum | 90-100 | Exemplary - exceeds all standards |
| 🥇 Gold | 75-89 | Excellent - meets all important standards |
| 🥈 Silver | 50-74 | Good - meets most standards |
| 🥉 Bronze | 0-49 | Needs improvement |

## Troubleshooting

### Action Fails with "Permission denied"

Ensure your `GITHUB_TOKEN` has write access to the central scorecards repository. You may need to use a PAT instead:

1. Create a PAT with `repo` scope
2. Add it as a repository secret (e.g., `SCORECARD_PAT`)
3. Use it in your workflow:
   ```yaml
   github-token: ${{ secrets.SCORECARD_PAT }}
   ```

### Service Doesn't Appear in Catalog

1. Check that the action ran successfully
2. Verify that `scorecards-repo` is set correctly
3. Check that results were committed to the central repository
4. Wait a few minutes for GitHub Pages to update

### Checks Failing Unexpectedly

View detailed check results in the catalog:
1. Visit the catalog page
2. Click on your service card
3. Review each check's output and error messages

### Want to Improve Your Score?

1. Review failing checks in the catalog
2. Read each check's description to understand what it validates
3. Fix issues in your repository
4. Push changes to trigger a new scorecard run

## Advanced Usage

### Running Scorecards on Pull Requests

You can run scorecards on PRs (without committing results):

```yaml
on:
  pull_request:
    branches: [main]

jobs:
  scorecard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Scorecards (PR Check)
        uses: your-org/scorecards/action@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          # Don't set scorecards-repo to avoid committing on PRs
```

### Custom Check Selection

Currently, all checks run automatically. Future versions may support check selection via config.

## Getting Help

- 📖 [Check Development Guide](./CHECKS.md)
- 📖 [Configuration Reference](./CONFIG.md)
- 🐛 [Report Issues](https://github.com/your-org/scorecards/issues)
- 💬 [Discussions](https://github.com/your-org/scorecards/discussions)
