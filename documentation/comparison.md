# Choosing the Right Tool

This guide helps you decide between Scorecards, Backstage, and Cortex. Each tool serves different needs, and the right choice depends on your organization's size, resources, and goals.

## Backstage

[Backstage](https://backstage.io/) is Spotify's open-source developer portal, now a CNCF project with wide industry adoption.

### Strengths

- **Mature plugin ecosystem** - Hundreds of community plugins for integrations
- **Service catalog with auto-discovery** - Automatically finds and catalogs services
- **Software templates (scaffolding)** - Create new services from standardized templates
- **TechDocs** - Documentation-as-code with Markdown support
- **Search across all resources** - Unified search for services, docs, APIs, and more
- **Active community** - Large contributor base, regular releases, extensive documentation
- **Kubernetes integration** - Native support for K8s resource visualization

### Best For

- Large organizations with dedicated platform teams (2-4+ engineers)
- Companies wanting a full Internal Developer Platform (IDP)
- Teams needing extensive plugin customization
- Organizations with complex multi-cloud infrastructure

### Considerations

- Requires infrastructure: Kubernetes, PostgreSQL, and ongoing maintenance
- Setup takes weeks to months for production readiness
- Per-service catalog-info.yaml files required
- Learning curve for plugin development

---

## Cortex

[Cortex](https://www.cortex.io/) is a commercial developer portal focused on service catalog and scorecards.

### Strengths

- **Enterprise support** - Dedicated support, SLAs, professional services
- **Resource mapping** - Tracks cloud resources, dependencies, infrastructure
- **Automatic discovery** - Finds services across your infrastructure
- **Rich integrations** - PagerDuty, Datadog, AWS, GCP, and 50+ tools
- **Compliance and audit** - RBAC, audit logs, SOC2 compliance
- **Incident management** - On-call integration and incident tracking
- **Polished UI** - Production-ready interface out of the box

### Best For

- Enterprise organizations needing turnkey solutions
- Companies with compliance requirements (SOC2, HIPAA, etc.)
- Teams wanting minimal setup with maximum features
- Organizations needing vendor support and SLAs

### Considerations

- Significant cost ($50K-$250K+ annually depending on org size)
- Vendor lock-in with proprietary platform
- May include features you don't need
- Per-service configuration still required

---

## Scorecards

Scorecards is a lightweight, GitHub-native quality measurement tool.

### Strengths

- **Zero infrastructure** - Runs entirely on GitHub Actions and Pages
- **5-minute setup** - One installation script, immediate results
- **Free for internal use** - No licensing costs for using it within your organization
- **Non-blocking** - Encourages improvement without failing CI
- **Works out-of-the-box** - No per-service configuration required
- **Focused scope** - Does one thing well: quality measurement

### Best For

- Small to medium teams (1-50 services)
- Organizations without dedicated platform engineers
- Teams wanting quick wins before larger investments
- Proof-of-concept before evaluating enterprise tools
- Supplementing existing tools with focused quality checks

### Limitations

We're honest about what Scorecards doesn't do:

- **No service discovery** - Services must opt-in by adding the workflow
- **No resource mapping** - Doesn't track cloud infrastructure or dependencies
- **No scaffolding** - Doesn't create services from templates
- **No incident management** - No PagerDuty or on-call integration
- **No real-time metrics** - Point-in-time checks, not live monitoring
- **GitHub-only** - Requires GitHub (Actions and Pages)

---

## Feature Comparison

| Feature | Backstage | Cortex | Scorecards |
|---------|-----------|--------|------------|
| **Setup time** | 1-3 months | 2-4 weeks | 5 minutes |
| **Infrastructure** | Kubernetes + DB | SaaS | GitHub Pages |
| **Maintenance team** | 2-4 engineers | None (SaaS) | None |
| **Service discovery** | Auto + manual | Automatic | Manual opt-in |
| **Quality scorecards** | Via plugins | Built-in | Built-in |
| **Resource mapping** | Via plugins | Built-in | No |
| **Scaffolding** | Built-in | Built-in | No |
| **Documentation** | TechDocs | Built-in | No |
| **Integrations** | 100+ plugins | 50+ built-in | GitHub only |
| **RBAC/Compliance** | Configurable | Enterprise-grade | GitHub permissions |
| **Annual cost** | $300K-$600K* | $50K-$250K+ | Free* |

*Backstage cost estimate includes engineering time for setup and maintenance. Scorecards is free for internal use under the [PolyForm Shield License](https://polyformproject.org/licenses/shield/1.0.0/) which prohibits using it to build competing products.

---

## Decision Guide

### Choose Backstage if you...

- Have a platform team that can own the deployment
- Need extensive customization through plugins
- Want to build a comprehensive Internal Developer Platform
- Prefer open-source with no vendor lock-in
- Can invest months in setup and ongoing maintenance

### Choose Cortex if you...

- Need a production-ready solution immediately
- Have budget for enterprise tooling
- Require compliance features (SOC2, RBAC, audit logs)
- Want vendor support and SLAs
- Need resource mapping and incident management

### Choose Scorecards if you...

- Want to start measuring quality today
- Don't have dedicated platform engineers
- Are evaluating whether you need an enterprise tool
- Use GitHub and want to leverage existing infrastructure
- Need a focused tool that does one thing well
- Want a free solution for internal quality measurement

---

## Can They Work Together?

Yes. Scorecards can complement enterprise tools:

- **Backstage + Scorecards**: Use Scorecards for quality checks while Backstage handles catalog and scaffolding
- **Cortex + Scorecards**: Supplement Cortex scorecards with custom checks specific to your standards
- **Migration path**: Start with Scorecards, migrate to Backstage/Cortex as your organization grows

---

## Questions?

If you're unsure which tool fits your needs, consider:

1. How many services do you manage?
2. Do you have platform engineers who can maintain infrastructure?
3. What's your budget for developer tooling?
4. Do you need compliance and audit features?
5. How quickly do you need to see results?

For most small to medium teams, Scorecards provides immediate value with minimal investment. As your organization grows, you can evaluate whether enterprise tools make sense.
