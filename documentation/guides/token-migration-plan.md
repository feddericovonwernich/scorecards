# Token Renaming Migration Plan

**Status:** Draft
**Date Created:** 2025-01-19
**Migration Type:** Non-Breaking (Gradual with Fallback)
**Estimated Duration:** 90 days (with 60-day deprecation period)

## Executive Summary

This document provides a complete, self-contained plan for renaming GitHub tokens used in the Scorecards system to improve clarity and make the security model more obvious.

### Why We're Renaming

**Current Issues:**
- Token names don't clearly indicate their purpose
- "PAT" suffix is generic and doesn't convey functionality
- "INSTALLATION" doesn't clearly indicate it has workflow file permissions
- Confusion about which token to use when

**Benefits of New Names:**
- Purpose-based naming makes usage obvious
- Self-documenting code
- Clearer error messages
- Better security model visibility
- Easier troubleshooting

### Token Name Changes

| Old Name | New Name | Purpose |
|----------|----------|---------|
| `SCORECARDS_PAT` | `SCORECARDS_CATALOG_TOKEN` | Write scorecard results to catalog branch |
| `SCORECARDS_INSTALLATION_PAT` | `SCORECARDS_WORKFLOW_TOKEN` | Create installation PRs with workflow files |
| `GITHUB_TOKEN` | `GITHUB_TOKEN` | No change (GitHub built-in) |

### Migration Strategy

**Approach:** Gradual migration with fallback support (non-breaking)

**Timeline:**
- **Phase 1 (Week 1):** Add fallback support to all code
- **Phase 2 (Week 2):** Update all documentation
- **Phase 3 (Week 2-4):** Service repos migrate at their own pace
- **Phase 4 (Week 12):** Remove fallback support after 60-day deprecation period

**Key Principle:** Both old and new names will work during migration period.

---

## Complete File Inventory

### Files Requiring Code Changes (8 files)

1. `.github/workflows/create-installation-pr.yml`
2. `.github/workflows/install.yml`
3. `.github/workflows/trigger-service-workflow.yml`
4. `.github/workflows/update-checks-hash.yml`
5. `.github/workflows/consolidate-registry.yml`
6. `.github/workflows/sync-docs.yml`
7. `action/action.yml`
8. `documentation/examples/scorecard-workflow-template.yml`

### Files Requiring Documentation Updates (5+ files)

1. `README.md`
2. `documentation/architecture/workflows.md`
3. `documentation/guides/platform-installation.md` (if exists)
4. Any quickstart guides
5. Any troubleshooting docs

### Service Repository Files (Updated by service owners)

- `.github/workflows/scorecards.yml` (or equivalent)

---

## Phase 1: Add Fallback Support

### Objective

Update all workflows and actions to accept both old and new token names, with new names taking priority.

### Fallback Pattern

```yaml
# Pattern for all token references:
token: ${{ secrets.NEW_NAME || secrets.OLD_NAME }}

# Specific examples:
token: ${{ secrets.SCORECARDS_CATALOG_TOKEN || secrets.SCORECARDS_PAT }}
token: ${{ secrets.SCORECARDS_WORKFLOW_TOKEN || secrets.SCORECARDS_INSTALLATION_PAT }}
```

### File-by-File Changes

#### 1. `.github/workflows/create-installation-pr.yml`

**Current locations:**
- Line 43: `scorecards-pat: ${{ secrets.SCORECARDS_PAT || secrets.GITHUB_TOKEN }}`
- Line 172: `GH_TOKEN: ${{ secrets.SCORECARDS_PAT || secrets.GITHUB_TOKEN }}`
- Line 288: `token: ${{ secrets.SCORECARDS_PAT }}`
- Line 293: `GH_TOKEN: ${{ secrets.SCORECARDS_PAT || secrets.GITHUB_TOKEN }}`

**Changes:**

```yaml
# Before (line 43):
scorecards-pat: ${{ secrets.SCORECARDS_PAT || secrets.GITHUB_TOKEN }}

# After:
scorecards-pat: ${{ secrets.SCORECARDS_CATALOG_TOKEN || secrets.SCORECARDS_PAT || secrets.GITHUB_TOKEN }}

# Before (line 172):
GH_TOKEN: ${{ secrets.SCORECARDS_PAT || secrets.GITHUB_TOKEN }}

# After:
GH_TOKEN: ${{ secrets.SCORECARDS_WORKFLOW_TOKEN || secrets.SCORECARDS_INSTALLATION_PAT || secrets.SCORECARDS_CATALOG_TOKEN || secrets.SCORECARDS_PAT || secrets.GITHUB_TOKEN }}

# Before (line 288):
token: ${{ secrets.SCORECARDS_PAT }}

# After:
token: ${{ secrets.SCORECARDS_CATALOG_TOKEN || secrets.SCORECARDS_PAT }}

# Before (line 293):
GH_TOKEN: ${{ secrets.SCORECARDS_PAT || secrets.GITHUB_TOKEN }}

# After:
GH_TOKEN: ${{ secrets.SCORECARDS_WORKFLOW_TOKEN || secrets.SCORECARDS_INSTALLATION_PAT || secrets.SCORECARDS_CATALOG_TOKEN || secrets.SCORECARDS_PAT || secrets.GITHUB_TOKEN }}
```

**Rationale:**
- Line 172 & 293: PR creation needs workflow scope, so try WORKFLOW_TOKEN first
- Fallback chain ensures backward compatibility
- Line 288 & 43: Catalog updates only need CATALOG_TOKEN

---

#### 2. `.github/workflows/install.yml`

**Current locations:**
- Line 19-20: Input secrets `scorecards-pat` and `installation-pat`
- Line 54: `GH_TOKEN: ${{ secrets.github-token }}`
- Line 89: `token: ${{ secrets.installation-pat || secrets.github-token }}`
- Line 151: `GH_TOKEN: ${{ secrets.installation-pat || secrets.github-token }}`
- Line 360: `GH_TOKEN: ${{ secrets.installation-pat || secrets.github-token }}`

**Changes:**

```yaml
# Before (inputs section, lines 19-20):
secrets:
  github-token:
    required: true
  scorecards-pat:
    required: false
  installation-pat:
    required: false

# After (add documentation):
secrets:
  github-token:
    required: true
    description: 'GitHub token for basic operations'
  scorecards-pat:
    required: false
    description: 'DEPRECATED: Use scorecards-catalog-token instead. Token for catalog writes.'
  scorecards-catalog-token:
    required: false
    description: 'Token for writing results to catalog branch (repo scope)'
  installation-pat:
    required: false
    description: 'DEPRECATED: Use scorecards-workflow-token instead. Token for workflow PRs.'
  scorecards-workflow-token:
    required: false
    description: 'Token for creating PRs with workflow files (repo + workflow scopes)'

# Before (line 89):
token: ${{ secrets.installation-pat || secrets.github-token }}

# After:
token: ${{ secrets.scorecards-workflow-token || secrets.installation-pat || secrets.github-token }}

# Before (line 151):
GH_TOKEN: ${{ secrets.installation-pat || secrets.github-token }}

# After:
GH_TOKEN: ${{ secrets.scorecards-workflow-token || secrets.installation-pat || secrets.github-token }}

# Before (line 360):
GH_TOKEN: ${{ secrets.installation-pat || secrets.github-token }}

# After:
GH_TOKEN: ${{ secrets.scorecards-workflow-token || secrets.installation-pat || secrets.github-token }}
```

**Note:** This workflow uses snake_case for secret names (passed as inputs). Keep consistent with existing naming.

---

#### 3. `.github/workflows/trigger-service-workflow.yml`

**Current locations:**
- Line 53: `GH_TOKEN: ${{ secrets.SCORECARDS_PAT || secrets.GITHUB_TOKEN }}`
- Line 107: `GH_TOKEN: ${{ secrets.SCORECARDS_PAT || secrets.GITHUB_TOKEN }}`

**Changes:**

```yaml
# Before (line 53 & 107):
GH_TOKEN: ${{ secrets.SCORECARDS_PAT || secrets.GITHUB_TOKEN }}

# After:
GH_TOKEN: ${{ secrets.SCORECARDS_CATALOG_TOKEN || secrets.SCORECARDS_PAT || secrets.GITHUB_TOKEN }}
```

---

#### 4. `.github/workflows/update-checks-hash.yml`

**Current locations:**
- Line 24: `token: ${{ secrets.SCORECARDS_PAT }}`
- Line 39: `GITHUB_TOKEN: ${{ secrets.SCORECARDS_PAT }}`

**Changes:**

```yaml
# Before (line 24):
token: ${{ secrets.SCORECARDS_PAT }}

# After:
token: ${{ secrets.SCORECARDS_CATALOG_TOKEN || secrets.SCORECARDS_PAT }}

# Before (line 39):
GITHUB_TOKEN: ${{ secrets.SCORECARDS_PAT }}

# After:
GITHUB_TOKEN: ${{ secrets.SCORECARDS_CATALOG_TOKEN || secrets.SCORECARDS_PAT }}
```

---

#### 5. `.github/workflows/consolidate-registry.yml`

**Current locations:**
- Line 26: `token: ${{ secrets.SCORECARDS_PAT }}`

**Changes:**

```yaml
# Before (line 26):
token: ${{ secrets.SCORECARDS_PAT }}

# After:
token: ${{ secrets.SCORECARDS_CATALOG_TOKEN || secrets.SCORECARDS_PAT }}
```

---

#### 6. `.github/workflows/sync-docs.yml`

**Current locations:**
- Line 30: `token: ${{ secrets.SCORECARDS_PAT }}`

**Changes:**

```yaml
# Before (line 30):
token: ${{ secrets.SCORECARDS_PAT }}

# After:
token: ${{ secrets.SCORECARDS_CATALOG_TOKEN || secrets.SCORECARDS_PAT }}
```

---

#### 7. `action/action.yml`

**Current locations:**
- Line 5: Input `github-token` description
- Line 21: `GITHUB_TOKEN: ${{ inputs.github-token }}`

**Changes:**

```yaml
# Before (line 5):
inputs:
  github-token:
    description: 'GitHub token with repo and contents permissions'
    required: true

# After:
inputs:
  github-token:
    description: 'GitHub token for catalog writes (use SCORECARDS_CATALOG_TOKEN). Legacy name: SCORECARDS_PAT'
    required: true

# No code changes needed (accepts token via input, name stays same for compatibility)
```

---

#### 8. `documentation/examples/scorecard-workflow-template.yml`

**Current locations:**
- Line 25: `github-token: ${{ secrets.SCORECARDS_PAT }}`

**Changes:**

```yaml
# Before (line 25):
github-token: ${{ secrets.SCORECARDS_PAT }}

# After:
github-token: ${{ secrets.SCORECARDS_CATALOG_TOKEN || secrets.SCORECARDS_PAT }}
```

---

### Testing Phase 1 Changes

**Test Cases:**

1. **Backward Compatibility - Old Names Only**
   ```bash
   # Set only old secrets:
   SCORECARDS_PAT=<token>
   SCORECARDS_INSTALLATION_PAT=<token>

   # Run workflows - should work
   ```

2. **Forward Compatibility - New Names Only**
   ```bash
   # Set only new secrets:
   SCORECARDS_CATALOG_TOKEN=<token>
   SCORECARDS_WORKFLOW_TOKEN=<token>

   # Run workflows - should work
   ```

3. **Priority Check - Both Names Set**
   ```bash
   # Set both (with different values to verify):
   SCORECARDS_CATALOG_TOKEN=<new-token>
   SCORECARDS_PAT=<old-token>

   # Verify new token is used (check in logs/behavior)
   ```

**Validation Commands:**

```bash
# Check all workflow files for correct fallback pattern
grep -r "SCORECARDS_CATALOG_TOKEN || secrets.SCORECARDS_PAT" .github/workflows/
grep -r "SCORECARDS_WORKFLOW_TOKEN || secrets.SCORECARDS_INSTALLATION_PAT" .github/workflows/

# Verify no direct references to old names without fallback
grep -r "secrets.SCORECARDS_PAT" .github/workflows/ | grep -v "||"
grep -r "secrets.SCORECARDS_INSTALLATION_PAT" .github/workflows/ | grep -v "||"
```

---

## Phase 2: Update Documentation

### Objective

Update all documentation to reference new token names while noting old names are deprecated.

### Documentation Changes

#### 1. `README.md`

Add token reference section:

```markdown
## Token Requirements

Scorecards uses GitHub tokens for authentication:

| Token | Purpose | Required Scopes | Required? |
|-------|---------|-----------------|-----------|
| `SCORECARDS_CATALOG_TOKEN` | Write results to catalog branch | `repo` | Yes |
| `SCORECARDS_WORKFLOW_TOKEN` | Create installation PRs | `repo`, `workflow` | Optional* |

*Only required for automated installation via `install.yml`

**Legacy Token Names (Deprecated):**
- `SCORECARDS_PAT` → Use `SCORECARDS_CATALOG_TOKEN`
- `SCORECARDS_INSTALLATION_PAT` → Use `SCORECARDS_WORKFLOW_TOKEN`

Both old and new names work during migration period (until YYYY-MM-DD).

See [Token Requirements Guide](documentation/guides/token-requirements.md) for setup instructions.
```

#### 2. `documentation/architecture/workflows.md`

Update Token Requirements section (around line 438):

```markdown
### Token Requirements

The system uses three types of tokens for different permissions:

1. **GITHUB_TOKEN** (automatic)
   - Basic operations in service repos
   - Read access to repositories
   - Write access to workflow run artifacts

2. **SCORECARDS_CATALOG_TOKEN** (secret) - *formerly SCORECARDS_PAT*
   - Write access to catalog branch in central repo
   - Used by scorecards action to commit results
   - Required for all service workflows
   - **Scopes needed:** `repo`

3. **SCORECARDS_WORKFLOW_TOKEN** (secret, optional) - *formerly SCORECARDS_INSTALLATION_PAT*
   - Special token for creating PRs with workflow files
   - Bypasses GitHub security restriction on workflow file PRs
   - Only needed for automated installation PR creation
   - Required by `install.yml` and `create-installation-pr.yml`
   - **Scopes needed:** `repo`, `workflow`

**Migration Note:** Old token names (`SCORECARDS_PAT`, `SCORECARDS_INSTALLATION_PAT`)
are deprecated but still supported during migration period. Update to new names by YYYY-MM-DD.
```

#### 3. Create `documentation/guides/token-requirements.md`

See separate section below for full content.

#### 4. Update `documentation/guides/platform-installation.md`

Replace all references:
- `SCORECARDS_PAT` → `SCORECARDS_CATALOG_TOKEN`
- `SCORECARDS_INSTALLATION_PAT` → `SCORECARDS_WORKFLOW_TOKEN`

Add migration notice at top:

```markdown
> **Token Name Update (2025-01-19):** Token names have been updated for clarity.
> This guide uses new names (`SCORECARDS_CATALOG_TOKEN`, `SCORECARDS_WORKFLOW_TOKEN`).
> Old names (`SCORECARDS_PAT`, `SCORECARDS_INSTALLATION_PAT`) still work but are deprecated.
```

---

## Phase 3: Create New Secrets & Migrate

### Objective

Service repositories and the central scorecards repository create new secrets alongside old ones.

### Central Repository (Scorecards Repo)

**Actions Required:**

1. **Create New Organization Secrets:**
   - Navigate to: `https://github.com/organizations/{ORG}/settings/secrets/actions`
   - Create `SCORECARDS_CATALOG_TOKEN` with same value as `SCORECARDS_PAT`
   - Create `SCORECARDS_WORKFLOW_TOKEN` with same value as `SCORECARDS_INSTALLATION_PAT`

2. **Verify New Secrets Work:**
   ```bash
   # Trigger a workflow that uses the new names
   gh workflow run update-checks-hash.yml

   # Check that it succeeded
   gh run list --workflow=update-checks-hash.yml --limit 1
   ```

3. **Keep Old Secrets (Don't Delete Yet):**
   - `SCORECARDS_PAT` - keep for 60 days
   - `SCORECARDS_INSTALLATION_PAT` - keep for 60 days

### Service Repositories

**Communication Template:**

```markdown
Subject: Action Required: Update Scorecards Token Names

Hello,

We've renamed the GitHub tokens used by Scorecards for better clarity:

**Token Name Changes:**
- `SCORECARDS_PAT` → `SCORECARDS_CATALOG_TOKEN`
- `SCORECARDS_INSTALLATION_PAT` → `SCORECARDS_WORKFLOW_TOKEN`

**What You Need to Do:**

1. Go to your repository Settings → Secrets and variables → Actions
2. Create new secret `SCORECARDS_CATALOG_TOKEN` with the same value as `SCORECARDS_PAT`
3. (Optional) If you use `SCORECARDS_INSTALLATION_PAT`, create `SCORECARDS_WORKFLOW_TOKEN` with same value
4. Update your `.github/workflows/scorecards.yml` file:

   ```yaml
   # Before:
   github-token: ${{ secrets.SCORECARDS_PAT }}

   # After:
   github-token: ${{ secrets.SCORECARDS_CATALOG_TOKEN || secrets.SCORECARDS_PAT }}
   ```

**Timeline:**
- Now - Week 12: Both old and new names work
- After Week 12: Old names will stop working

**Questions?** See the migration guide: [link]

Thanks!
```

**Self-Service Migration for Service Repos:**

Service owners should:

1. Create new secrets (copy values from old ones)
2. Update their workflow files to use new names with fallback
3. Test that workflows still work
4. (Optional) Delete old secrets after Week 12

---

## Phase 4: Testing & Validation

### Test Matrix

| Scenario | CATALOG_TOKEN | PAT | WORKFLOW_TOKEN | INSTALLATION_PAT | Expected Result |
|----------|---------------|-----|----------------|------------------|-----------------|
| Old names only | ❌ | ✅ | ❌ | ✅ | ✅ Works |
| New names only | ✅ | ❌ | ✅ | ❌ | ✅ Works |
| Both set (new priority) | ✅ | ✅ | ✅ | ✅ | ✅ Uses new |
| Neither set | ❌ | ❌ | ❌ | ❌ | ❌ Fails (expected) |
| Mixed (catalog new, workflow old) | ✅ | ❌ | ❌ | ✅ | ✅ Works |

### Testing Procedures

**1. Test Central Workflows:**

```bash
# Test update-checks-hash.yml
gh workflow run update-checks-hash.yml
gh run watch

# Test consolidate-registry.yml (automatic, check recent runs)
gh run list --workflow=consolidate-registry.yml --limit 1

# Test sync-docs.yml
gh workflow run sync-docs.yml
gh run watch
```

**2. Test Service Workflow:**

```bash
# In a test service repository
gh workflow run scorecards.yml
gh run watch

# Verify results appear in catalog
```

**3. Test Installation Workflow:**

```bash
# Test create-installation-pr.yml
gh workflow run create-installation-pr.yml \
  -f org=test-org \
  -f repo=test-repo

# Verify PR created successfully
```

**4. Test Reusable Workflow:**

```bash
# In a service that uses install.yml
# Trigger the workflow and verify it works
```

### Success Criteria

- ✅ All workflows run successfully with new token names
- ✅ All workflows still work with old token names (fallback)
- ✅ New tokens take priority when both are set
- ✅ No breaking changes for existing users
- ✅ Documentation is clear and accurate

---

## Phase 5: Deprecation Period (60 Days)

### Objective

Allow all service repositories time to migrate before removing old token support.

### Activities During Deprecation

**Week 1-2:**
- Announce token rename to all users
- Update all central repository documentation
- Send migration guide to service owners

**Week 3-8:**
- Monitor adoption metrics
- Answer questions from service owners
- Help troubleshoot migration issues

**Week 9-12:**
- Send reminder emails to repos still using old names
- Prepare for cleanup phase
- Final testing with new names only

### Monitoring Adoption

**Check which repos have migrated:**

```bash
# Look for old token usage in service repo workflows
gh api graphql -f query='
{
  search(query: "org:your-org SCORECARDS_PAT in:file path:.github/workflows", type: CODE, first: 100) {
    edges {
      node {
        ... on Code {
          repository {
            name
          }
          path
        }
      }
    }
  }
}'
```

**Track migration progress:**

```markdown
## Migration Dashboard

Total Service Repos: 50
- ✅ Migrated to new names: 35 (70%)
- 🔄 Still using old names: 12 (24%)
- ❓ Unknown status: 3 (6%)
```

---

## Phase 6: Cleanup (After 60 Days)

### Objective

Remove fallback support and finalize migration.

### Cleanup Activities

**1. Remove Fallback from Code:**

Update all files to use ONLY new names:

```yaml
# Before (with fallback):
token: ${{ secrets.SCORECARDS_CATALOG_TOKEN || secrets.SCORECARDS_PAT }}

# After (new name only):
token: ${{ secrets.SCORECARDS_CATALOG_TOKEN }}
```

**Files to update:**
- All 8 workflow files
- Template files
- Examples

**2. Remove Old Secrets:**

```bash
# In organization settings, delete:
# - SCORECARDS_PAT
# - SCORECARDS_INSTALLATION_PAT

# Service repos should delete their old secrets too
```

**3. Update Documentation:**

Remove all mentions of old token names:
- Remove "formerly SCORECARDS_PAT" notes
- Remove deprecation warnings
- Update examples to use only new names

**4. Final Testing:**

```bash
# Run full test suite with new names only
# Verify all workflows work
# Verify service repos work
```

---

## Rollback Plan

### If Issues Arise During Migration

**Scenario 1: Critical Bug in Fallback Logic**

```bash
# Immediate rollback:
git revert <commit-hash>
git push

# Or manual revert:
# 1. Restore old workflow files from git history
# 2. Push to main
# 3. Investigate and fix issue
# 4. Retry migration
```

**Scenario 2: Service Repos Reporting Issues**

1. Keep old token names working (don't proceed to Phase 6)
2. Debug specific issues
3. Update documentation/code as needed
4. Extend deprecation period if necessary

**Scenario 3: Need to Abort Migration**

```bash
# 1. Revert all code changes
git revert <start-commit>..<end-commit>

# 2. Update documentation to indicate migration paused
# 3. Communicate to users
# 4. Keep old token names as primary
```

### Communication During Rollback

```markdown
Subject: Scorecards Token Migration Paused

We've temporarily paused the token migration due to [reason].

**Status:**
- Old token names (SCORECARDS_PAT, SCORECARDS_INSTALLATION_PAT) continue to work
- No action required from service owners
- We'll communicate next steps once issues are resolved

**If you've already migrated:**
- Your new tokens will continue to work
- No need to revert your changes

Thanks for your patience!
```

---

## Timeline Summary

```
Week 1-2: Phase 1 & 2 - Code + Docs
├─ Day 1-3: Add fallback support to all files
├─ Day 4-5: Update all documentation
├─ Day 6-7: Create new secrets in central repo
└─ Day 8-10: Test all workflows

Week 3-4: Phase 3 - Service Migration Begins
├─ Day 11: Send migration announcement
├─ Day 12-14: Service owners create new secrets
└─ Day 15-28: Ongoing migration & support

Week 5-12: Phase 5 - Deprecation Period
├─ Week 5-8: Monitor adoption, support users
├─ Week 9-11: Send reminders to stragglers
└─ Week 12: Prepare for cleanup

Week 13: Phase 6 - Cleanup
├─ Day 85-86: Remove fallback code
├─ Day 87-88: Delete old secrets
├─ Day 89-90: Final testing & documentation
└─ Migration Complete ✅
```

---

## Checklist

Use this checklist to track migration progress:

### Phase 1: Add Fallback Support
- [ ] Update `.github/workflows/create-installation-pr.yml`
- [ ] Update `.github/workflows/install.yml`
- [ ] Update `.github/workflows/trigger-service-workflow.yml`
- [ ] Update `.github/workflows/update-checks-hash.yml`
- [ ] Update `.github/workflows/consolidate-registry.yml`
- [ ] Update `.github/workflows/sync-docs.yml`
- [ ] Update `action/action.yml`
- [ ] Update `documentation/examples/scorecard-workflow-template.yml`
- [ ] Test backward compatibility (old names only)
- [ ] Test forward compatibility (new names only)
- [ ] Test priority (new names take precedence)
- [ ] Commit and push changes

### Phase 2: Update Documentation
- [ ] Update `README.md` with token reference
- [ ] Update `documentation/architecture/workflows.md`
- [ ] Create `documentation/guides/token-requirements.md`
- [ ] Update `documentation/guides/platform-installation.md`
- [ ] Update any other guides/docs
- [ ] Review all documentation for accuracy
- [ ] Commit and push changes

### Phase 3: Create New Secrets
- [ ] Create `SCORECARDS_CATALOG_TOKEN` in org secrets
- [ ] Create `SCORECARDS_WORKFLOW_TOKEN` in org secrets
- [ ] Test central workflows with new secrets
- [ ] Send migration announcement to service owners
- [ ] Create migration tracking dashboard

### Phase 4: Testing
- [ ] Run all test scenarios from test matrix
- [ ] Verify all central workflows work
- [ ] Test in at least 3 service repositories
- [ ] Monitor for errors in GitHub Actions logs
- [ ] Address any issues found

### Phase 5: Deprecation Period (60 days)
- [ ] Week 1: Send initial announcement
- [ ] Week 4: Check adoption metrics
- [ ] Week 8: Send reminder to non-migrated repos
- [ ] Week 11: Final reminder before cleanup
- [ ] Week 12: Confirm all/most repos migrated

### Phase 6: Cleanup
- [ ] Remove fallback support from all 8 workflow files
- [ ] Delete old organization secrets
- [ ] Update documentation to remove deprecation notes
- [ ] Final testing with new names only
- [ ] Send completion announcement
- [ ] Mark migration as complete ✅

---

## Communication Templates

### Initial Announcement

```markdown
Subject: Scorecards Token Names Updated for Clarity

Team,

We're improving the Scorecards system by renaming GitHub tokens to make their
purpose clearer.

**Changes:**
- `SCORECARDS_PAT` → `SCORECARDS_CATALOG_TOKEN` (for catalog writes)
- `SCORECARDS_INSTALLATION_PAT` → `SCORECARDS_WORKFLOW_TOKEN` (for workflow PRs)

**Impact:** Non-breaking. Both old and new names work until [DATE].

**Action Required:**
1. Create new secrets with new names (copy values from old ones)
2. Update your scorecards workflow file (see migration guide)
3. Test that workflows still run

**Migration Guide:** [link to this document]

**Timeline:**
- Today - [DATE+60d]: Both names work
- After [DATE+60d]: Only new names work

Questions? Reply to this email or see the guide.
```

### Reminder (Week 8)

```markdown
Subject: Reminder: Scorecards Token Migration - 4 Weeks Remaining

Team,

This is a reminder that Scorecards token migration ends in 4 weeks ([DATE]).

**Status Check:**
We've detected that your repository may still be using old token names.

**Action Needed:**
Please update to new token names before [DATE]. After that date, old names
will stop working.

**Quick Update Steps:**
1. Settings → Secrets → Create `SCORECARDS_CATALOG_TOKEN`
2. Update workflow file to use new name
3. Test it works

**Migration Guide:** [link]

Need help? Let us know!
```

### Completion Announcement

```markdown
Subject: Scorecards Token Migration Complete

Team,

The Scorecards token migration is now complete!

**What Changed:**
- Tokens renamed for clarity
- Old names (`SCORECARDS_PAT`, `SCORECARDS_INSTALLATION_PAT`) no longer work
- New names (`SCORECARDS_CATALOG_TOKEN`, `SCORECARDS_WORKFLOW_TOKEN`) are now standard

**Migration Results:**
- 95% of repositories successfully migrated
- No reported issues
- Improved clarity and security

**If You Haven't Migrated:**
Your scorecards workflows may be failing. Follow the guide to update: [link]

Thanks for your cooperation during this migration!
```

---

## Appendix: Search & Replace Patterns

### For Bulk Updates (Use with Caution)

```bash
# Find all old token references
rg "SCORECARDS_PAT" --type yaml .github/workflows/
rg "SCORECARDS_INSTALLATION_PAT" --type yaml .github/workflows/

# Example sed commands (verify before running):
# Update PAT to CATALOG_TOKEN
sed -i 's/secrets\.SCORECARDS_PAT/secrets.SCORECARDS_CATALOG_TOKEN || secrets.SCORECARDS_PAT/g' .github/workflows/*.yml

# Update INSTALLATION_PAT to WORKFLOW_TOKEN
sed -i 's/secrets\.SCORECARDS_INSTALLATION_PAT/secrets.SCORECARDS_WORKFLOW_TOKEN || secrets.SCORECARDS_INSTALLATION_PAT/g' .github/workflows/*.yml
```

**WARNING:** Always review changes before committing. Automated replacements may
create incorrect fallback chains or break YAML syntax.

---

## Appendix: Token Creation Instructions

### Creating SCORECARDS_CATALOG_TOKEN

1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Click "Generate new token"
3. Configure:
   - **Name:** Scorecards Catalog Access
   - **Expiration:** 90 days (recommended)
   - **Repository access:** Only select repositories → Select `{org}/scorecards`
   - **Permissions:**
     - Contents: Read and write
     - Metadata: Read-only (automatic)
4. Click "Generate token"
5. Copy token immediately (won't be shown again)
6. Add to organization secrets:
   - Go to Organization settings → Secrets and variables → Actions
   - New organization secret
   - Name: `SCORECARDS_CATALOG_TOKEN`
   - Value: [paste token]
   - Repository access: All repositories (or select specific repos)

### Creating SCORECARDS_WORKFLOW_TOKEN

1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → **Tokens (classic)**
   - Note: Fine-grained tokens don't support `workflow` scope yet
2. Click "Generate new token (classic)"
3. Configure:
   - **Note:** Scorecards Workflow Access
   - **Expiration:** 90 days
   - **Select scopes:**
     - ✅ repo (all sub-scopes)
     - ✅ workflow
4. Click "Generate token"
5. Copy token immediately
6. Add to organization secrets:
   - Name: `SCORECARDS_WORKFLOW_TOKEN`
   - Value: [paste token]
   - Repository access: All repositories (or select specific repos)

---

## Questions & Answers

**Q: Why not just update the names everywhere at once?**
A: Breaking changes affect all service repositories. Gradual migration with fallback
support ensures zero downtime and gives teams time to migrate.

**Q: Can we speed up the migration?**
A: Yes, if you have control over all service repos. For open-source or multi-team
environments, the 60-day period is recommended to avoid disruption.

**Q: What if a service repo never migrates?**
A: After cleanup, their workflows will fail. They'll need to update their secrets
and workflow files. The migration guide will remain available for late adopters.

**Q: Can we use fine-grained tokens instead of classic PATs?**
A: Yes for CATALOG_TOKEN (fine-grained supports `contents` permission). No for
WORKFLOW_TOKEN (fine-grained doesn't support `workflow` scope as of 2025-01).

**Q: Should we rotate tokens during migration?**
A: Optional. If rotating, create new tokens with new names. Don't need to rotate
just for the rename.

---

**End of Migration Plan**
