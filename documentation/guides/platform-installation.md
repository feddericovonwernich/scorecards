# Platform Installation Guide

This guide is for **Platform/DevOps teams** who want to set up the central Scorecards system for their organization.

> **Are you a service team?** See [Service Installation Guide](service-installation.md) instead.

## Overview

The central Scorecards repository contains:
- GitHub Action for running quality checks
- Catalog UI hosted on GitHub Pages
- Check definitions and scoring system
- Results storage in the `catalog` branch

## One-Line Installation

The quickest way to get started:

```bash
export GITHUB_TOKEN=your_github_pat
curl -fsSL https://raw.githubusercontent.com/feddericovonwernich/scorecards/main/scripts/install.sh | bash
```

The installation script will:
1. Validate prerequisites (git, gh CLI, jq)
2. Prompt for your target repository (org/repo)
3. Create the repository if it doesn't exist
4. Set up the main branch with all system code
5. Create the catalog branch for data storage
6. Push both branches to your repository
7. Customize documentation to reference your repository
8. Configure GitHub Pages to host the catalog
9. Provide next steps for service integration

## Prerequisites

Before running the installation script, ensure you have:

- **git**: Version control
- **gh**: [GitHub CLI](https://cli.github.com/)
- **jq**: JSON processor
- **GitHub Personal Access Tokens**:
  - `SCORECARDS_CATALOG_TOKEN` with `repo` scope (required)
  - `SCORECARDS_WORKFLOW_TOKEN` with `repo` and `workflow` scopes (optional, for automated installation)

See [Token Requirements Guide](token-requirements.md) for token creation instructions.

## Manual Installation

If you prefer to set up manually:

### Step 1: Clone or Fork

Clone or fork this repository to your organization.

### Step 2: Create the Catalog Branch

Create an orphan `catalog` branch for storing results:

```bash
git checkout --orphan catalog
git rm -rf .
git checkout main -- docs/
mkdir -p results badges registry
echo '[]' > registry/services.json
git add . && git commit -m "Initialize catalog branch"
git push -u origin catalog
```

### Step 3: Enable GitHub Pages

1. Go to repository Settings → Pages
2. Set Source to `catalog` branch, `/docs`
3. Wait for Pages to deploy (check Settings → Pages for the URL)

### Step 4: Verify Installation

Once GitHub Pages deploys, visit your catalog URL to confirm the UI is accessible.

## Customization

After installation, you can customize your setup:

### Add Custom Checks

Create new checks in the `checks/` directory:

```bash
checks/
  your-check/
    check.sh        # Check implementation
    metadata.json   # Check metadata (name, weight, etc.)
    test.sh         # Tests for your check
```

See the [Check Development Guide](check-development-guide.md) for details on creating checks.

### Customize the Catalog UI

Modify the catalog UI in the `docs/` directory:

- `docs/index.html` - Main catalog page
- `docs/styles.css` - Styling
- `docs/app.js` - JavaScript functionality

### Adjust Check Weights

Modify check weights in `checks/*/metadata.json` to change how checks impact scores:

```json
{
  "id": "readme",
  "name": "README.md Exists",
  "weight": 10,
  "category": "documentation"
}
```

### Configure Branch Protection

Protect your branches from accidental changes while allowing automation to function:

**To configure:**
1. Go to repository **Settings → Branches → Add branch protection rule**

**For `main` branch** (system code):
- Pattern: `main`
- Enable: **Require a pull request before merging** (1 approval)
- Enable: **Require status checks to pass** (if you have tests)
- Enable: **Require conversation resolution before merging**
- Allow bypass: Add `github-actions[bot]` to allow doc syncs
- **Don't enable** "Require linear history" (breaks automation)

**For `catalog` branch** (scorecard data):
- Pattern: `catalog`
- Enable: **Restrict deletions** (prevent accidental removal)
- **Don't require** pull requests (would block service workflows)
- Allow bypass: Add `github-actions[bot]` for automation

**Note:** Your `SCORECARDS_CATALOG_TOKEN` needs `repo` scope, and `SCORECARDS_WORKFLOW_TOKEN` needs `repo` and `workflow` scopes to work with these protections.

## Automated Service Onboarding

If you have a unified CI system or want to proactively onboard services, you can use the **install reusable workflow** to automatically add scorecards to service repositories.

### How It Works

The install workflow runs in service repositories and:
1. Calculates the service's current scorecard score
2. Creates an automated PR with scorecards configuration files
3. Shows results in the PR description (even before merging)
4. Respects the service team's decision if they close the PR

This "try before you buy" approach lets service teams see their scores before committing to installation.

### Example: Add to Unified CI Template

Add scorecards to your organization's unified CI template:

> **Important:** Replace `your-org/scorecards` with your organization's scorecards repository, not the template repository.

```yaml
# .github/workflows/ci.yml (your existing unified CI template)
name: CI

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  # Your existing CI jobs
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint code
        run: npm run lint

  # Add scorecards automated onboarding
  scorecards:
    uses: your-org/scorecards/.github/workflows/install.yml@main  # Replace with YOUR org's scorecards repo
    secrets:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      scorecards-catalog-token: ${{ secrets.SCORECARDS_CATALOG_TOKEN }}
      scorecards-workflow-token: ${{ secrets.SCORECARDS_WORKFLOW_TOKEN }}
```

**What to customize:**
- `uses`: Replace `your-org/scorecards` with your organization's scorecards repository (e.g., `acme-corp/scorecards`)

### Benefits

- Service teams see their scores immediately without installation
- Automated PR creation reduces onboarding friction
- Non-intrusive: respects team decisions, won't create duplicate PRs
- Scores are still calculated daily even if PR is closed
- Platform teams can track adoption and quality across all services

## Next Steps

After setting up the central system:

1. **Share with service teams**: Point them to the [Service Installation Guide](service-installation.md)
2. **Monitor the catalog**: Visit your GitHub Pages URL to see services as they onboard
3. **Customize checks**: Add organization-specific quality checks
4. **Set standards**: Adjust check weights based on your priorities

## Troubleshooting

### Installation Script Fails

- Verify prerequisites are installed: `git --version`, `gh --version`, `jq --version`
- Check GitHub token has `repo` and `workflow` scopes
- Ensure you have permission to create repositories in your organization

### GitHub Pages Not Deploying

- Check Settings → Pages shows the `catalog` branch is selected
- Verify the `catalog` branch has the `/docs` directory with catalog UI files
- Wait 2-3 minutes for initial deployment

### Services Not Appearing in Catalog

- Verify service workflows are running successfully
- Check the `catalog` branch for results in `results/org/repo/`
- Ensure services are using a valid `SCORECARDS_CATALOG_TOKEN` token

## Additional Resources

- [Service Installation Guide](service-installation.md) - For service teams
- [Configuration Guide](configuration.md) - Configure .scorecard/config.yml
- [Check Development Guide](check-development-guide.md) - How to create custom checks
- [Architecture Overview](../architecture/overview.md) - How Scorecards works
