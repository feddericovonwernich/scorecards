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

### Release, protection and pin contract

Before publication, configure a release-tag protection rule: only designated release maintainers may create matching tags, and no actor may update, delete or bypass that protection. If GitHub Immutable Releases is chosen, enable it before publication; it is a prerequisite to verify, not an assumed setting.

After the source change merges through protected `main` with its required review, a release maintainer creates the protected tag and release from that commit. A reviewer approves the exact release URL, tag and full resolved commit SHA as the installation pin. Before installation, independently confirm that the release/tag resolves to that advertised 40-character commit; then fetch that SHA and detach at `FETCH_HEAD` as shown below. The installer resolves its own checked-out source root and rejects a checkout whose resolved `SOURCE_SHA` differs from the supplied pin; do not set `SCORECARDS_SOURCE_DIR`.

Record the release URL, protected tag, published source SHA, installer output and the deployment run URL. This is provenance evidence, not a claim that a particular release currently exists or that its protection has been checked live.

```bash
export GITHUB_TOKEN=your_github_pat
export SCORECARDS_RELEASE_SHA='<40-character release SHA>'
export SCORECARDS_TARGET_REPO='your-org/scorecards'
export SCORECARDS_SINGLE_WRITER=true

: "${SCORECARDS_RELEASE_SHA:?copy the full SHA from the release}"
[[ "$SCORECARDS_RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]] || exit 1
(
  set -euo pipefail
  SOURCE_DIR="$(mktemp -d)"
  trap 'status=$?; rm -rf "$SOURCE_DIR"; exit "$status"' EXIT
  git -C "$SOURCE_DIR" init
  git -C "$SOURCE_DIR" fetch \
    https://github.com/feddericovonwernich/scorecards.git "$SCORECARDS_RELEASE_SHA"
  git -C "$SOURCE_DIR" checkout --detach FETCH_HEAD
  SCORECARDS_SOURCE_SHA="$SCORECARDS_RELEASE_SHA" bash "$SOURCE_DIR/scripts/install.sh"
)
```

The release SHA remains intentionally unset in source documentation until the safe installer commit is integrated, tagged and released. Never substitute an older known-broken SHA.

`SOURCE_SHA` is the upstream reviewed commit fetched by the bootstrap. `INSTALLED_MAIN_SHA` is the different, personalized `main` commit created locally from that source for the target repository; use the latter—not the upstream SHA—to correlate the deployment.

The installer:

1. accepts only `owner/scorecards`;
2. rejects any existing head or tag without changing it;
3. requires `SCORECARDS_ADOPT_EMPTY_REPO=true` to recover an existing repository with zero refs;
4. prepares personalized `main` and `catalog` commits locally;
5. publishes both branches in one normal atomic push;
6. configures Pages with `build_type=workflow`;
7. dispatches a fresh `sync-docs.yml` run for the personalized `INSTALLED_MAIN_SHA`; and
8. verifies that deployed Pages `index.html` references nonempty hashed compiled module and stylesheet assets with their expected content types before reporting success.

## Prerequisites

- One operator must exclude every other installation writer for the complete run. Set `SCORECARDS_SINGLE_WRITER=true` for unattended installation; the interactive confirmation acknowledges the same full-installation responsibility. This operational exclusion is not a race-proofing guarantee.
- Bash 3.2 or newer.
- Git 2.15 or newer with `git push --atomic` support.
- GitHub CLI commands `api`, `repo view`, `repo create`, `workflow run` and `run list`.
- A `GITHUB_TOKEN` matching the installer operations in the [credential matrix](../reference/token-requirements.md#operation-matrix).
- GitHub Actions and workflow-based Pages available for the target repository visibility.
- Python 3 for the bounded deployed Pages verification.

`jq` is not an installer prerequisite. GitHub does not provide non-mutating checks for every repository-creation, workflow-write or Pages policy. The installer checks observable identity, membership and existing-repository permissions; repository creation, atomic push, Pages configuration and dispatch remain the authoritative capability checks.

`INSTALL_DEPLOY_TIMEOUT_SECONDS` bounds both the fresh deployment wait and the subsequent deployed HTML/asset verification; it is not a promise that a site has already propagated.

### Restricted Pages verification

GitHub Enterprise Cloud [private Pages access control](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site) authorizes signed-in users with read access to the publishing repository. Private sites use a unique HTTPS origin, isolated from `github.com` to protect cookies. This is browser authentication, not the repository REST API: do not send `GITHUB_TOKEN` or a PAT to Pages. GitHub's [cookie inventory](https://docs.github.com/en/site-policy/privacy-policies/github-cookies) also warns that cookie names can change; the verifier treats site session cookies as opaque rather than depending on an internal cookie name.

Before starting an installation that requires restricted Pages, set `SCORECARDS_PAGES_AUTH=browser-session`. Keep the existing access restrictions. The installer never changes visibility to make verification pass.

- **Interactive first installation:** leave `SCORECARDS_PAGES_COOKIE_FILE` unset. Preflight requires a controlling terminal. After deployment, sign in through the exact Pages URL printed by the installer, including your organization's SSO if required. In browser developer tools, inspect a successful document request to that Pages origin and paste only its `Cookie` request-header value into the hidden prompt. Never paste a GitHub login cookie, an entire request, or a token. Input remains in verifier memory; it is not written to receipts, configuration, argv, or logs. Complete this within the remaining deployment deadline.
- **Unattended verification:** supply `SCORECARDS_PAGES_COOKIE_FILE` pointing to a Netscape-format cookie export from an already authenticated session for that exact Pages host. The file must be owned by the operator with no group/other permissions (`0600`), outside the checkout; protect it as a credential and remove it after use. Only unexpired secure cookies for the exact host and matching request path are sent. Parent-domain cookies and cookies for `github.com` are not forwarded. Set `SCORECARDS_AUTO_CONFIRM=true` only when this session is available; a new site's origin/session may not exist until after publication, so use interactive installation for that case.

Preflight checks the authentication mode, terminal or private cookie-file availability, expiration, and host compatibility when an existing Pages URL is known. It cannot prove authorization for a site that has not been published yet. Delivery verification rejects redirects instead of following login/SSO links with credentials, rejects authentication failures and login HTML, and fetches compiled assets only from the verified document origin. Expired or insufficient sessions fail closed; sign in again through the browser.

If delivery authentication fails after publication, preserve both refs. From the pinned source checkout, retry only delivery proof with a renewed session and the exact Pages URL:

```bash
export SCORECARDS_PAGES_AUTH=browser-session
python3 scripts/verify-pages.py verify "$PAGES_URL" "$INSTALL_DEPLOY_TIMEOUT_SECONDS" "$INSTALL_POLL_INTERVAL_SECONDS"
```

Set `PAGES_URL` from the repository's Pages API/settings and choose the timeout/interval as for installation. This command does not publish refs, dispatch workflows, or change visibility. Local HTTPS fixtures cover public/restricted HTML and compiled assets, invalid sessions, and credential isolation. Live Enterprise proof still requires an authorized operator login and an actual restricted Pages target; local fixtures are not cloud end-to-end evidence.

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

Two entrypoints share one PR owner:

- service repositories call `.github/workflows/install.yml`, which dispatches the central owner and waits for its result;
- operators dispatch `.github/workflows/create-installation-pr.yml` directly in the same central repository.

Both use the label `scorecards-install`. An open installation PR is returned without creating another branch or PR. A closed or merged PR is respected by default. Each permitted creation uses `scorecards-install-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}`; `retry-closed: true` gates recreation after a closed or merged PR. Neither path deletes or force-updates an earlier branch.

All PR creation executes in the central `create-installation-pr.yml` workflow under one target-keyed native concurrency group, with a fresh installation/PR lookup after a queued attempt starts. Concurrent requests from both entrypoints therefore reuse the same open PR. The owner must run in the configured central repository. GitHub may cancel superseded pending requests; this is not a durable FIFO queue. The reusable caller treats dispatch acceptance only as acceptance: owner failure, cancellation, missing results or a bounded wait expiring fails the request instead of claiming installation completed. Inspect the linked central run and existing PR before retrying; never delete or force-update an earlier branch.

Local regression coverage in `tests/unit/bash/test_installation_workflow.bats` executes the rendered workflow steps with Git/gh fixtures. Simultaneous direct and service requests share a scheduler modeled from the parsed native concurrency configuration and resolve to one PR; failure, cancellation, timeout and missing artifacts fail the caller. This is local behavioral evidence, not proof of GitHub-hosted scheduling or cloud end-to-end installation.

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
4. Record the protected release tag and source SHA, `INSTALLED_MAIN_SHA`, Pages run URL and first-service run URLs.

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
