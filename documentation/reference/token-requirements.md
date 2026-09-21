# Token Requirements Guide

This guide explains the GitHub tokens required for Scorecards and how to create them.

## Token Overview

Scorecards uses two GitHub Personal Access Tokens (PATs) for different purposes:

| Token | Purpose | Scopes | Required? |
|-------|---------|--------|-----------|
| `SCORECARDS_CATALOG_TOKEN` | Write results to catalog branch | `repo` | **Yes** |
| `SCORECARDS_WORKFLOW_TOKEN` | Installation PRs and explicitly enabled remediation | Classic: `repo`; `workflow` additionally for installation files | Optional* |

*Required for automated installation or enabled remediation; remediation is disabled by default.

## Why Two Tokens?

**SCORECARDS_CATALOG_TOKEN** - Every scorecard execution writes results to the catalog branch. This token needs `repo` scope to write to the catalog.

**SCORECARDS_WORKFLOW_TOKEN** - Installation writes `.github/workflows/` and therefore requires the classic `workflow` scope in addition to repository access. The optional remediation executor reuses this configured secret without enlarging its scope or falling back to the catalog token. The badge recipe cannot modify workflows.

## Creating SCORECARDS_CATALOG_TOKEN

This token allows Scorecards to write results to the catalog branch.

### Step 1: Generate Fine-Grained Token

1. **[Create a new fine-grained token →](https://github.com/settings/tokens?type=beta)**
2. Click **Generate new token**
3. Configure:
   - **Token name:** Scorecards Catalog Access
   - **Expiration:** 90 days (or per your policy)
   - **Repository access:** Only select repositories → Select `{org}/scorecards`
   - **Permissions:**
     - **Contents:** Read and write
     - **Metadata:** Read-only (automatic)
4. Click **Generate token**
5. **Copy the token immediately**

### Step 2: Add to Organization Secrets

1. Go to your organization → Settings → Secrets and variables → Actions
2. Click **New organization secret**
3. Configure:
   - **Name:** `SCORECARDS_CATALOG_TOKEN`
   - **Value:** [paste token]
   - **Repository access:** All repositories (or specific repos that need it)
4. Click **Add secret**

## Creating SCORECARDS_WORKFLOW_TOKEN

This token allows installation PRs and, only after explicit activation, remediation branches and PRs.

Classic scopes and fine-grained repository permissions are different models. A fine-grained token should select only the required repositories and grant Contents/Pull requests write, plus Workflows write when installing workflow files. Verify organization approval and current endpoint support; do not grant Workflows write solely for the badge pilot. The existing classic-token setup is shown below.

### Step 1: Generate Classic Token

1. **[Create a new classic token →](https://github.com/settings/tokens/new?scopes=repo,workflow&description=Scorecards%20Workflow%20Access)** (opens with scopes pre-selected)
2. Verify the pre-filled values:
   - **Note:** Scorecards Workflow Access ✅ (pre-filled)
   - **Select scopes:**
     - ✅ **repo** (all sub-scopes) - pre-selected
     - ✅ **workflow** - pre-selected
3. Set expiration:
   - **Expiration:** 90 days (recommended)
4. Click **Generate token**
5. **Copy the token immediately**

### Step 2: Add to Organization Secrets

1. Go to your organization → Settings → Secrets and variables → Actions
2. Click **New organization secret**
3. Configure:
   - **Name:** `SCORECARDS_WORKFLOW_TOKEN`
   - **Value:** [paste token]
   - **Repository access:** All repositories
4. Click **Add secret**

## Service Repository Setup

Each service repository needs access to `SCORECARDS_CATALOG_TOKEN` to write results.

**Using organization secrets** (recommended):
- If the token is an organization secret with "All repositories" access, services automatically have access
- No per-service configuration needed

**Using repository secrets** (alternative):
- Add `SCORECARDS_CATALOG_TOKEN` to each service's Settings → Secrets and variables → Actions
- Required if not using organization-wide secrets

## Remediation Authorization

The browser uses the user's own PAT to dispatch/read the **central** workflow (fine-grained Actions write/read, or appropriate classic repository access). It never receives the central publication secret. Dispatch permission alone is not remediation authorization: both GitHub actor identities must match the destination's explicit `actors` policy.

The central executor's `SCORECARDS_WORKFLOW_TOKEN` must read the trusted central revision, read/write contents in the allowlisted destination and read/create its PRs. `/user` must identify the configured `publisher_login`. Only the host publisher sees this token; the recipe container receives no token, credential helper, Git metadata, network or Docker socket.

**Contents write is not PR-only or branch-scoped.** Before activation, verify effective default-branch restrictions requiring human review and excluding the publisher from bypass/direct writes and auto-merge. Protect the central policy/workflow and secret access as well. Record evidence in the target's `protection_evidence`; a nonempty string is not proof that controls are effective. If the holder or rules cannot be verified, keep remediation disabled.

See [activation, threat boundaries and rollback](../architecture/flows/remediation-flow.md). This implementation does not create/rotate secrets, broaden permissions or activate targets.

## Token Security Best Practices

### Scope Minimization
- Prefer fine-grained tokens selecting only required repositories and permissions.
- For classic tokens, catalog writes require repository access; installation additionally requires `workflow`.
- Grant no new scope merely to enable remediation; verify the existing holder and branch protections first.

### Expiration
- Set 30-90 day expiration
- Create calendar reminders to rotate before expiry
- Monitor workflow runs for authentication errors

### Access Control
- Use organization secrets for centralized management
- Limit repository access when possible
- Regularly audit access in organization settings

### Token Rotation

When rotating:
1. Create new token with same name and scopes
2. Update organization secret with new value
3. Verify workflows work
4. Revoke old token
5. No code changes needed (tokens referenced by secret name)


## Additional Resources

- [GitHub PAT Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Organization Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-an-organization)
- [Platform Installation Guide](../guides/platform-installation.md)
- [Service Installation Guide](../guides/service-installation.md)
