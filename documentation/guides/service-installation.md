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
        uses: feddericovonwernich/scorecards/action@main
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
1. Visit the [Scorecards Catalog](https://feddericovonwernich.github.io/scorecards/)
2. Find your service in the list
3. See your score, rank, and detailed check results

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

See [Configuration Guide](configuration.md) for all available options.

## Understanding Your Score

Scorecards calculates your service score based on weighted checks:

### Score Tiers

- **Platinum** (90-100): Exemplary - Best practices across all areas
- **Gold** (75-89): Excellent - Strong quality with minor gaps
- **Silver** (50-74): Good - Solid foundation, room for improvement
- **Bronze** (0-49): Needs improvement - Missing key quality practices

### Improving Your Score

1. **View detailed results** in the catalog or Actions output
2. **Identify failing checks** and their requirements
3. **Prioritize high-weight checks** for maximum impact
4. **Make improvements** to your repository
5. **Re-run the workflow** to see updated scores

Remember: Scorecards never fail CI. The goal is to encourage improvement, not block deployments.

## Adding Badges to Your README

Show off your score with badges in your README.md:

```markdown
![Score](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/feddericovonwernich/scorecards/catalog/badges/your-org/your-repo/score.json)
![Rank](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/feddericovonwernich/scorecards/catalog/badges/your-org/your-repo/rank.json)
```

Replace `your-org/your-repo` with your repository's organization and name.

## Troubleshooting

### Workflow Not Running

- Check that the workflow file is in `.github/workflows/`
- Verify GitHub Actions is enabled for your repository
- Try manually triggering via Actions tab → Run workflow

### Results Not Appearing in Catalog

- Verify `SCORECARDS_PAT` secret is set with `repo` scope
- Check workflow run logs for errors
- Ensure the central scorecards repo URL is correct in your workflow

### Permission Errors

- Ensure your PAT has the `repo` scope
- Verify the token hasn't expired
- Check that the central scorecards repository allows pushes from your organization

### Scores Not Updating

- Scorecards runs on a schedule (daily by default)
- Manually trigger the workflow to force an update
- Check that recent commits are on the branch specified in the workflow

## Next Steps

After installation:

1. **Monitor your score** - Visit the catalog regularly
2. **Make improvements** - Address failing checks
3. **Share progress** - Use badges to show your quality standards
4. **Provide feedback** - Help improve checks and scoring

## Additional Resources

- [Usage Guide](usage.md) - Action inputs, outputs, and advanced usage
- [Configuration Guide](configuration.md) - Complete configuration options
- [Check Catalog](../reference/check-catalog.md) - All available checks
- [Platform Installation Guide](platform-installation.md) - For platform teams
