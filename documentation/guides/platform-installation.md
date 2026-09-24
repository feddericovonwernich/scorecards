# Platform Installation Guide

This guide is for **Platform/DevOps teams** who want to set up the central Scorecards system for their organization.

> **Are you a service team?** See [Service Installation Guide](service-installation.md) instead.

## Overview

The central Scorecards repository contains:

- GitHub Action for running quality checks
- Catalog UI hosted on GitHub Pages
- Check definitions and scoring system
- Results storage in the `catalog` branch

## Version-pinned installation

Use the full commit SHA shown by a reviewed Scorecards release. `main`, a moving tag, and `curl | bash` are not installation contracts.

```bash
export GITHUB_TOKEN=your_github_pat
export SCORECARDS_RELEASE_SHA='<40-character release SHA>'
export SCORECARDS_TARGET_REPO='your-org/scorecards'

: "${SCORECARDS_RELEASE_SHA:?copy the full SHA from the release}"
[[ "$SCORECARDS_RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]] || exit 1
SOURCE_DIR="$(mktemp -d)"
git -C "$SOURCE_DIR" init
git -C "$SOURCE_DIR" fetch --depth=1 \
  https://github.com/feddericovonwernich/scorecards.git "$SCORECARDS_RELEASE_SHA"
git -C "$SOURCE_DIR" checkout --detach FETCH_HEAD
SCORECARDS_SOURCE_SHA="$SCORECARDS_RELEASE_SHA" bash "$SOURCE_DIR/scripts/install.sh"
rm -rf "$SOURCE_DIR"
```

The release SHA remains intentionally unset in source documentation until the safe installer commit is integrated, tagged and released. Never substitute an older known-broken SHA.

The installer:

1. accepts only `owner/scorecards`;
2. rejects any existing head or tag without changing it;
3. requires `SCORECARDS_ADOPT_EMPTY_REPO=true` to recover an existing repository with zero refs;
4. prepares personalized `main` and `catalog` commits locally;
5. publishes both branches in one normal atomic push;
6. configures Pages with `build_type=workflow`;
7. dispatches a fresh `sync-docs.yml` run for the personalized `INSTALLED_MAIN_SHA`; and
8. reports success only after that unique run succeeds and Pages remains in workflow mode.

## Prerequisites

- Bash 3.2 or newer.
- Git with `git push --atomic` support.
- GitHub CLI commands `api`, `repo view`, `repo create`, `workflow run` and `run list`.
- A `GITHUB_TOKEN` matching the installer operations in the [credential matrix](../reference/token-requirements.md#operation-matrix).
- GitHub Actions and workflow-based Pages available for the target repository visibility.

`jq` is not an installer prerequisite. GitHub does not provide non-mutating checks for every repository-creation, workflow-write or Pages policy. The installer checks observable identity, membership and existing-repository permissions; repository creation, atomic push, Pages configuration and dispatch remain the authoritative capability checks.

### Optional PR-only remediation

Remediation needs no additional service workflow and must not be enabled as an installation side effect. The central policy prepares only the [explicitly authorized badge pilot](../architecture/flows/remediation-flow.md#piloto-acotado-test-repo-minimal); it does not authorize new installations. Configure the reviewed runtime digest and explicit target/check/actor allowlists only after verifying the existing workflow-token holder and effective default-branch rules without bypass. See the [activation checklist and rollback](../architecture/flows/remediation-flow.md#activación-prerrequisitos-externos-obligatorios); inability to verify those controls means keeping remediation disabled.

## Installation checkpoints and recovery

The installer has three remote checkpoints:

1. **No repository, or an existing empty repository:** retry normally if no repository was created. If a failed attempt created an empty repository, inspect that it still has zero heads and tags, then retry with `SCORECARDS_ADOPT_EMPTY_REPO=true`.
2. **Both `main` and `catalog` published:** never rerun the installer. The two refs were created together; continue only with Pages recovery.
3. **Pages configured or dispatched:** preserve refs, workflow logs, artifact and deployment records. Fix forward through a reviewed Scorecards release, or dispatch a fresh `sync-docs.yml` run for the installed `main` commit.

A populated repository is not an installation target or an upgrade target. Preserve its refs, settings, results and registry. Do not force push, reset, delete refs or recreate `catalog`. Existing legacy Pages installations use the [coordinated transition and rollback](../../docs/README.md#coordinated-transition-from-legacy-pages), not this new-install path.

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
- Do not grant automation a bypass that can write directly to `main`; use pull requests and the required human review for system-code changes.
- **Don't enable** "Require linear history" (breaks automation)

**For `catalog` branch** (scorecard data):

- Pattern: `catalog`
- Enable: **Restrict deletions** (prevent accidental removal)
- **Don't require** pull requests (would block service workflows)
- Allow bypass: Add `github-actions[bot]` for automation

See the [Token Requirements Guide](../reference/token-requirements.md) for credential permissions; token scopes alone do not enforce branch protections.

## Automated Service Onboarding

Two maintained paths share the same PR state contract:

- service repositories can call `.github/workflows/install.yml`;
- the central repository can dispatch `.github/workflows/create-installation-pr.yml`.

Both use the label `scorecards-install`. An open installation PR is returned without creating another branch or PR. A closed or merged PR is respected by default. Only an explicit `retry-closed: true` creates a new branch named `scorecards-install-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}` and a new PR. Neither path deletes or force-updates an earlier branch.

```yaml
jobs:
  scorecards:
    uses: your-org/scorecards/.github/workflows/install.yml@main
    with:
      scorecards-repo: your-org/scorecards
      scorecards-branch: catalog
      retry-closed: false
    secrets:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      scorecards-catalog-token: ${{ secrets.SCORECARDS_CATALOG_TOKEN }}
      scorecards-workflow-token: ${{ secrets.SCORECARDS_WORKFLOW_TOKEN }}
```

Set `retry-closed: true` only for a deliberate human retry. A score can be published before the installation PR merges or after it closes; that proves neither registry consolidation nor UI visibility. Complete the [first-service gate](service-installation.md#step-4-verify-the-first-service-end-to-end) separately.

## Next Steps

1. Share the [Service Installation Guide](service-installation.md).
2. Complete one first-service gate before broad onboarding.
3. Confirm `github-actions[bot]` can make normal writes to `catalog`; do not broaden a PAT to bypass a branch rule.
4. Record the release SHA, installed main SHA, Pages run URL and first-service run URLs.

## Troubleshooting

### Installer rejects the target

- `owner/scorecards` is the only supported name.
- Any head or tag means the repository is populated and must be preserved.
- For a zero-ref repository created by a failed attempt, verify it is empty and set `SCORECARDS_ADOPT_EMPTY_REPO=true`.
- `SCORECARDS_USE_EXISTING` is retired; it never enables an upgrade.

### Atomic push fails

Both refs remain absent when the server honors atomic push. Inspect repository rules and token permissions, keep the repository, verify it still has zero refs, and retry with the empty-repository opt-in. Do not push either branch separately.

### Pages does not deploy

Keep `main` and `catalog`. Record the failed run URL and Pages state. Confirm Pages uses GitHub Actions, then fix forward and dispatch a fresh `sync-docs.yml` run for `INSTALLED_MAIN_SHA`; never rerun the installer or switch a new installation to legacy branch publication.

### Service does not appear

Follow every assertion in the [first-service gate](service-installation.md#step-4-verify-the-first-service-end-to-end). An individual registry entry, consolidation run, consolidated entry and fresh-browser UI result are distinct checks.
## Additional Resources

- [Service Installation Guide](service-installation.md) - For service teams
- [Configuration Guide](../reference/configuration.md) - Configure .scorecard/config.yml
- [Check Development Guide](check-development-guide.md) - How to create custom checks
- [Architecture Overview](../architecture/overview.md) - How Scorecards works
