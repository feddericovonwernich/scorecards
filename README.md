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

#### Central System Installation

Set up the central scorecards system for your organization:

```bash
# One-line installation
export GITHUB_TOKEN=your_github_pat
curl -fsSL https://raw.githubusercontent.com/feddericovonwernich/scorecards/main/scripts/install.sh | bash
```

The script creates a repository with:
- GitHub Action for running quality checks
- Catalog UI hosted on GitHub Pages
- Check definitions and scoring system
- Results storage in the `catalog` branch

See [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md#installation) for manual installation and customization.

#### Automated Service Onboarding (Optional)

If you have a unified CI system or want to proactively onboard services, you can use the **install reusable workflow** to automatically add scorecards to service repositories.

**How it works:**

The install workflow runs in service repositories and:
1. Calculates the service's current scorecard score
2. Creates an automated PR with scorecards configuration files
3. Shows results in the PR description (even before merging)
4. Respects the service team's decision if they close the PR

This "try before you buy" approach lets service teams see their scores before committing to installation.

**Example - Add to your existing unified CI template:**

```yaml
# .github/workflows/ci.yml (your existing unified CI template)
name: CI

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 0 * * *'  # Daily for scorecards

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
    if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'
    uses: feddericovonwernich/scorecards/.github/workflows/install.yml@main
    secrets:
      github-token: ${{ secrets.GITHUB_TOKEN }}
```

**Benefits:**
- Service teams see their scores immediately without installation
- Automated PR creation reduces onboarding friction
- Non-intrusive: respects team decisions, won't create duplicate PRs
- Scores are still calculated daily even if PR is closed
- Platform teams can track adoption and quality across all services

See the [Usage Guide](documentation/guides/usage.md) for detailed instructions on automated onboarding.

### For Service Teams

Add scorecards to your service repository:

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
          github-token: ${{ secrets.GITHUB_TOKEN }}
          scorecards-repo: 'feddericovonwernich/scorecards'
```

That's it! The workflow runs daily, calculates your score, and reports results to the catalog.

**Optional:** Add service metadata in `.scorecard/config.yml`:

```yaml
service:
  name: "My Service"
  team: "Platform Team"
  description: "Core API service"
```

See the [Usage Guide](documentation/guides/usage.md) for detailed instructions.

## What's Inside

- **[Getting Started](documentation/getting-started.md)** - Quick start guide
- **[SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)** - Complete technical documentation
- **[Usage Guide](documentation/guides/usage.md)** - Installation and daily usage
- **[Configuration Guide](documentation/guides/configuration.md)** - Customize your setup
- **[Check Catalog](documentation/reference/check-catalog.md)** - Available checks and how to add new ones
- **[Architecture](documentation/architecture/overview.md)** - How the system works

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

To add a new check:
1. Create a script in `checks/your-check/check.sh`
2. Add metadata in `checks/your-check/metadata.json`
3. Add tests
4. Submit a PR

See the [Check Development Guide](documentation/reference/check-catalog.md) for details.

## Philosophy

Scorecards follows a simple philosophy:

1. **Non-blocking** - Never fail CI, always provide information
2. **Transparent** - All check code is visible and auditable
3. **Lightweight** - No infrastructure overhead, leverages GitHub
4. **Voluntary** - Teams adopt at their own pace
5. **Simple** - Easy to understand, modify, and extend

We believe quality measurement should encourage improvement, not gate deployments.

## License

MIT

---

**Not sure if Scorecards is right for you?** Check out [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) for detailed technical documentation, or compare with [Cortex](https://www.cortex.io/) and [Backstage](https://backstage.io/) to see which solution fits your needs.
