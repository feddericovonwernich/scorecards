# Scorecards

**Lightweight, GitHub-native quality measurement for service repositories.**

Scorecards measures service quality against configurable standards and makes results visible in a centralized catalog—without the overhead of an enterprise developer portal.

---

## The Problem

You want to improve service quality across your organization, but:

- **Enterprise tools like Cortex cost $50K-$250K annually** and take weeks to set up
- **Backstage requires 2-4 engineers** to build and maintain a custom platform
- **Both require extensive per-service configuration** (YAML schemas, metadata migration)
- **Time to value is measured in months**, not days

Meanwhile, your services have inconsistent documentation, missing tests, and unclear ownership—but you don't have the budget or team for a full developer portal.

## The Scorecards Solution

Scorecards does one thing well: **measures service quality and makes it visible**.

- ✅ **5-minute setup** - One installation script, runs on GitHub Actions + Pages
- ✅ **Zero infrastructure** - No servers, databases, or maintenance overhead
- ✅ **Works out-of-the-box** - No per-service configuration required
- ✅ **Free** for GitHub users
- ✅ **Non-blocking** - Never fails CI, encourages improvement

**One-liner install for your organization:**

```bash
export GITHUB_TOKEN=your_github_pat && curl -fsSL https://raw.githubusercontent.com/feddericovonwernich/scorecards/main/scripts/install.sh | bash
```

Services get scored on:
- Documentation quality (README, API docs)
- Testing coverage and CI configuration
- License, code of conduct, security policies
- API standards (OpenAPI specs, environment configs)
- Custom checks you define

Results appear in a GitHub Pages catalog showing scores, trends, and improvement opportunities.

## Scorecards vs. Enterprise Tools

### What Makes Scorecards Different

|  | Cortex | Backstage | **Scorecards** |
|---|---|---|---|
| **Setup time** | 2-4 weeks | 1-3 months | **5 minutes** |
| **Infrastructure** | Enterprise hosting | Kubernetes + DB | **GitHub Pages** |
| **Per-service config** | Required YAML | Required YAML | **Optional** |
| **Maintenance team** | 1-2 engineers | 2-4 engineers | **None needed** |
| **First results** | 4-6 weeks | 2-3 months | **Immediate** |
| **Annual cost** | $50K-$250K+ | $300K-$600K | **Free** |

### What Scorecards Doesn't Do (And That's OK)

We're honest about our limitations. Scorecards is **not** a full developer portal:

- ❌ **No service discovery** - Services must opt-in by adding the workflow
- ❌ **No resource mapping** - Doesn't track cloud resources, dependencies, or infrastructure
- ❌ **No scaffolding** - Doesn't create services from templates
- ❌ **No incident management** - No PagerDuty/Opsgenie integration
- ❌ **No real-time metrics** - Point-in-time checks, not live monitoring
- ❌ **No RBAC/compliance** - Public catalog, relies on GitHub permissions

If you need these features, use Cortex or Backstage. They're excellent tools for organizations that can invest in them.

## When to Use Scorecards

**Choose Scorecards if you:**
- Want to start measuring quality **today** without a big project
- Are a small/medium team (1-50 services) without dedicated platform engineers
- Use GitHub and want to leverage existing Actions infrastructure
- Need a lightweight solution or proof-of-concept before enterprise investment
- Want to supplement existing tools with focused quality checks

**Choose enterprise tools if you:**
- Need comprehensive service catalog with automatic discovery
- Require resource mapping, dependency tracking, and infrastructure visibility
- Need RBAC, audit logs, and compliance features
- Have the team and budget for a full internal developer platform
- Manage 100+ services across multiple organizations

## Quick Start

### For Platform Teams

Set up the central scorecards system for your organization with a single command:

```bash
export GITHUB_TOKEN=your_github_pat
curl -fsSL https://raw.githubusercontent.com/feddericovonwernich/scorecards/main/scripts/install.sh | bash
```

This creates a repository with GitHub Actions, catalog UI on GitHub Pages, and results storage.

**Optional:** Add scorecards to your unified CI template to automatically onboard services:

```yaml
# Add to your existing .github/workflows/ci.yml
scorecards:
  uses: feddericovonwernich/scorecards/.github/workflows/install.yml@main
  secrets:
    github-token: ${{ secrets.SCORECARDS_PAT }}
```

**→ [Platform Installation Guide](documentation/guides/platform-installation.md)** for manual setup, prerequisites, customization, and automated onboarding details.

## Token Requirements

Scorecards uses GitHub Personal Access Tokens for authentication:

| Token | Purpose | Required Scopes | Required? |
|-------|---------|-----------------|-----------|
| `SCORECARDS_CATALOG_TOKEN` | Write results to catalog branch | `repo` | Yes |
| `SCORECARDS_WORKFLOW_TOKEN` | Create PRs with workflow files | `repo`, `workflow` | Optional* |

*Only required for automated installation via `install.yml`

See [Token Requirements Guide](documentation/guides/token-requirements.md) for setup instructions.

### For Service Teams

Add this workflow to your service repository:

```yaml
# .github/workflows/scorecards.yml
name: Scorecards

on:
  schedule:
    - cron: '0 0 * * *'  # Daily
  workflow_dispatch:

jobs:
  scorecards:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Scorecards
        uses: feddericovonwernich/scorecards/action@main
        with:
          github-token: ${{ secrets.SCORECARDS_CATALOG_TOKEN }}
          scorecards-repo: 'feddericovonwernich/scorecards'
```

The workflow runs daily and reports results to the catalog.

**→ [Service Installation Guide](documentation/guides/service-installation.md)** for automated installation, PAT setup, configuration, and badges.

## Documentation

### Setup Guides
- **[Platform Installation](documentation/guides/platform-installation.md)** - Set up Scorecards for your organization
- **[Service Installation](documentation/guides/service-installation.md)** - Add Scorecards to your service
- **[Configuration Guide](documentation/guides/configuration.md)** - Customize your setup

### Reference
- **[Action Reference](documentation/reference/action-reference.md)** - Action inputs, outputs, badges, and troubleshooting
- **[Check Development Guide](documentation/guides/check-development-guide.md)** - How to create custom checks
- **[Glossary](documentation/reference/glossary.md)** - Definitions of domain-specific terms
- **[Architecture](documentation/architecture/overview.md)** - System design and flows
- **[Token Requirements](documentation/reference/token-requirements.md)** - PAT setup and scopes

### Project
- **[CHANGELOG](CHANGELOG.md)** - Version history and notable changes

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

To add a new check:
1. Create a script in `checks/your-check/check.sh`
2. Add metadata in `checks/your-check/metadata.json`
3. Add tests
4. Submit a PR

See the [Check Development Guide](documentation/guides/check-development-guide.md) for details.

## License

MIT

---

**Next steps:**
- **Technical details:** See [Documentation](documentation/) for architecture, installation, scoring, and configuration
- **Compare solutions:** Review [Cortex](https://www.cortex.io/) and [Backstage](https://backstage.io/) to see which tool fits your needs
