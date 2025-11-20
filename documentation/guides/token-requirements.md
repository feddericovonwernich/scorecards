# Token Requirements Guide

This guide explains the GitHub tokens required for Scorecards and how to create them.

## Token Overview

Scorecards uses two GitHub Personal Access Tokens (PATs) for different purposes:

| Token | Purpose | Scopes | Required? |
|-------|---------|--------|-----------|
| `SCORECARDS_CATALOG_TOKEN` | Write results to catalog branch | `repo` | **Yes** |
| `SCORECARDS_WORKFLOW_TOKEN` | Create PRs with workflow files | `repo`, `workflow` | Optional* |

*Only required if using `install.yml` or `create-installation-pr.yml` for automated installation

## Why Two Tokens?

**SCORECARDS_CATALOG_TOKEN** - Every scorecard execution writes results to the catalog branch. This token needs `repo` scope to write to the catalog.

**SCORECARDS_WORKFLOW_TOKEN** - GitHub blocks PRs that modify `.github/workflows/` files unless the token has the `workflow` scope. This is a security measure. Since installation PRs add workflow files, this special token is needed only for automated installation workflows.

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

This token allows creating PRs that modify workflow files.

> **Note:** Fine-grained tokens don't support the `workflow` scope yet. Use a classic token.

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

## Token Security Best Practices

### Scope Minimization
- `SCORECARDS_CATALOG_TOKEN`: Only `repo` scope
- `SCORECARDS_WORKFLOW_TOKEN`: Only `repo` + `workflow` scopes
- Never grant additional scopes

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
- [Platform Installation Guide](platform-installation.md)
- [Service Installation Guide](service-installation.md)
