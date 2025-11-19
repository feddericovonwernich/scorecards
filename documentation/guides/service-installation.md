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

> For details on understanding your score, adding badges, and improving results, see the [Usage Guide](usage.md).

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

## Troubleshooting

If you run into issues during installation:

- **Workflow not running**: Check that the file is in `.github/workflows/` and GitHub Actions is enabled
- **Permission errors**: Ensure `SCORECARDS_PAT` secret has `repo` scope and hasn't expired
- **Results not appearing**: Verify the central scorecards repo URL is correct in your workflow

For comprehensive troubleshooting and usage help, see the [Usage Guide](usage.md).

## Next Steps

After installation:

1. **Monitor your score** - Visit the catalog regularly
2. **Make improvements** - Address failing checks
3. **Share progress** - Use badges to show your quality standards
4. **Provide feedback** - Help improve checks and scoring

## Additional Resources

- [Usage Guide](usage.md) - Action inputs, outputs, and advanced usage
- [Configuration Guide](configuration.md) - Complete configuration options
- [Check Catalog](check-development-guide.md) - All available checks
- [Platform Installation Guide](platform-installation.md) - For platform teams
