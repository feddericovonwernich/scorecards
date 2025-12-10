---
description: GitHub Actions workflow guidelines
globs: .github/workflows/**/*.yml
---

# GitHub Actions Workflow Guidelines

## Workflow Naming

Workflow files use descriptive kebab-case names:
- `trigger-service-workflow.yml` - Trigger scorecard for a service
- `update-team-registry.yml` - Update team assignments
- `consolidate-registry.yml` - Merge registry data
- `sync-docs.yml` - Sync documentation to GitHub Pages
- `test.yml` - Run test suite
- `install.yml` - Installation workflow
- `create-installation-pr.yml` - Create PR for installation
- `update-checks-hash.yml` - Update checks hash

## Configuration References

Workflow names and parameters are centralized:
- **Frontend**: `docs/src/config/workflows.js` - Contains `WORKFLOWS.files.*`
- **Action**: `action/config/` - Contains workflow-related constants

When renaming or adding workflows, update both locations.

## Secrets and Environment

| Variable | Purpose |
|----------|---------|
| `GITHUB_TOKEN` | Default token for API calls |
| `secrets.GITHUB_TOKEN` | Explicit token reference |
| `secrets.PAT` | Personal access token for cross-repo operations |

## Common Patterns

### Workflow Dispatch with Inputs

```yaml
on:
  workflow_dispatch:
    inputs:
      service_name:
        description: 'Service to process'
        required: true
        type: string
```

### Repository Dispatch

```yaml
on:
  repository_dispatch:
    types: [trigger-scorecard]
```

## Testing Workflows

- Test workflow changes in `org/` repositories first
- Use `gh workflow run` to trigger manually
- Check workflow runs: `gh run list --workflow=<name>`
