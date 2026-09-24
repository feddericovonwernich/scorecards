# Token Requirements Guide

This guide explains the GitHub tokens required for Scorecards and how to create them.

## Token overview

Scorecards has three user-managed credential roles and one repository-scoped ephemeral role:

| Credential | Purpose | Required where |
| --- | --- | --- |
| Installer `GITHUB_TOKEN` | Create `owner/scorecards`, publish workflows, configure Pages and dispatch/read Actions | Operator environment only |
| `SCORECARDS_CATALOG_TOKEN` | Service-to-central checkout and normal result writes to `catalog` | Each participating service workflow |
| `SCORECARDS_WORKFLOW_TOKEN` | Dispatch/read central onboarding runs; read/write the central catalog registry and create installation branches and PRs containing workflow files in target services; separately authorized remediation | Central onboarding host and reusable onboarding callers |
| Job `github.token` | Same-repository consolidation, docs sync and checks-hash writes | Issued per central workflow run |

The central repository does not receive `SCORECARDS_CATALOG_TOKEN` merely to consolidate its own registry. `.github/workflows/consolidate-registry.yml` requests `contents: write` and uses the job-scoped token. If a `catalog` ruleset blocks that bot, the run fails; resolve the minimum rule explicitly instead of falling back to a broader PAT.

Restricted Enterprise Pages delivery uses the operator's authenticated **Pages browser session**, not any repository PAT or job token. Keep that site-specific session separate from Git/API credentials and follow [restricted Pages verification](../guides/platform-installation.md#restricted-pages-verification) for hidden interactive input or a private cookie export. Never copy GitHub login cookies to Pages, expose session values in shell arguments/logs, or change visibility as an authentication workaround.

## Operation matrix

| Credential | Operation | Fine-grained permission | Classic scope | Observable preflight |
| --- | --- | --- | --- | --- |
| Installer `GITHUB_TOKEN` | Identity and metadata | Metadata read | identity implied | `GET /user` |
| Same | Create `{owner}/scorecards` | Owner/org repository creation policy | `public_repo` or `repo` by visibility | membership/policy only; creation is the capability test |
| Same | Atomic code and workflow publication | Contents read/write and Workflows read/write | `repo` + `workflow` | visible repository permissions; atomic push is the capability test |
| Same | Configure workflow Pages | Pages administration/manage | repository admin/maintain | visible role; Pages API is the capability test |
| Same | Dispatch and inspect Actions | Actions read/write | repository/workflow access | CLI/endpoints, then the fresh dispatch |
| `SCORECARDS_CATALOG_TOKEN` | Service writes to central `catalog` | Contents read/write on central only | `repo` | service checkout and first publication |
| `SCORECARDS_WORKFLOW_TOKEN` | Central onboarding registry update | Contents read/write on central Scorecards `catalog` | `repo` | catalog checkout and normal registry push |
| Same | Installation workflow and PR | Target-service Contents and Pull requests read/write; Workflows read/write when the PR adds a workflow | `repo` + `workflow` | target checkout, branch push and PR creation |
| Same, passed as `scorecards-workflow-token` | Reusable onboarding dispatch and result retrieval | Actions read/write on central Scorecards; target Pull requests read/write for score updates | `repo` + `workflow` | central dispatch, correlated run completion and result download |
| Central `github.token` | Consolidate same-repository registry | Job `contents: write` | not applicable | normal bot push |

GitHub exposes no read-only endpoint that proves every organization creation policy, fine-grained workflow write or Pages mutation in advance. A preflight result must not be described as proof of those later operations.

## Why two persistent tokens?

`SCORECARDS_CATALOG_TOKEN` crosses from a service into the central repository only to publish results. `SCORECARDS_WORKFLOW_TOKEN` authorizes the central owner to write its catalog registry and target-service Contents/Pull requests plus Workflows when installing `.github/workflows/scorecards.yml`. The reusable caller also needs central Actions read/write to dispatch that owner and read its completed result; its repository-scoped `GITHUB_TOKEN` cannot replace this cross-repository credential. Restrict repository selection and secret distribution to the participating repositories. Same-repository consolidation uses the ephemeral job token, not either PAT.

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

This token allows installation PRs, central onboarding dispatch/result retrieval and, only after explicit activation, remediation branches and PRs.

Classic scopes and fine-grained repository permissions are different models. A fine-grained token must select the central Scorecards repository with Contents read/write for onboarding registry updates and Actions read/write for reusable onboarding dispatch and results, plus each target service with Contents/Pull requests read/write and Workflows read/write when installing workflow files. Verify organization approval and current endpoint support; do not grant Workflows write solely for the badge pilot. The existing classic-token setup is shown below.

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
   - **Repository access:** Only the central onboarding host and service repositories that intentionally invoke the reusable workflow
4. Click **Add secret**

## Service Repository Setup

Each service repository's workflow must receive `SCORECARDS_CATALOG_TOKEN` without printing it. The PAT itself selects the central `{org}/scorecards` repository; organization-secret visibility separately selects which service repositories may consume it.

**Using organization secrets** (recommended):

- Select only participating service repositories, or all repositories when that broader distribution is intentional.
- The central repository does not need this secret for registry consolidation.

**Using repository secrets** (alternative):

- Add `SCORECARDS_CATALOG_TOKEN` to each participating service's Settings → Secrets and variables → Actions.
- Keep the token's repository access limited to the central Scorecards repository.

## Remediation Authorization

The browser uses the user's own PAT to dispatch/read the **central** workflow (fine-grained Actions write/read, or appropriate classic repository access). It never receives the central publication secret. Dispatch permission alone is not remediation authorization: both GitHub actor identities must match the destination's explicit `actors` policy.

The central executor's `SCORECARDS_WORKFLOW_TOKEN` must read the trusted central revision, read/write contents in the allowlisted destination and read/create its PRs. `/user` must identify the configured `publisher_login`. Only the host publisher sees this token; the recipe container receives no token, credential helper, Git metadata, network or Docker socket.

**Contents write is not PR-only or branch-scoped.** Before activation, verify effective default-branch restrictions requiring human review and excluding the publisher from bypass/direct writes and auto-merge. Protect the central policy/workflow and secret access as well. Record evidence in the target's `protection_evidence`; a nonempty string is not proof that controls are effective. If the holder or rules cannot be verified, keep remediation disabled.

See the [bounded pilot exception, credential evidence and integration hold](../architecture/flows/remediation-flow.md#piloto-acotado-test-repo-minimal) for the authorized pilot's review requirements.

See [activation, threat boundaries and rollback](../architecture/flows/remediation-flow.md). The executor does not create/rotate secrets or broaden permissions; target activation is controlled separately by the reviewed central policy.

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
