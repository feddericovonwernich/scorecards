# Phase 1: User-Facing Documentation Improvements

## Overview
This phase focuses on critical user-facing documentation gaps that will significantly improve the user experience for platform teams, service teams, and end users of the Scorecards system.

**Goal:** Make it easier for users to get started, find answers, and troubleshoot issues.

**Estimated Effort:** 8-12 hours

---

## Files to Create

### 1. CHANGELOG.md (Root Directory)

**Location:** `/CHANGELOG.md`

**Purpose:** Track all notable changes to the project, following industry best practices.

**Content Structure:**
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CHANGELOG.md to track project changes
- FAQ.md for common questions
- Troubleshooting guide for common issues
- Tutorial for first-time users
- Glossary of domain-specific terms

## [1.0.0] - 2025-01-XX

### Added
- Initial release of Scorecards quality measurement system
- GitHub Action for running quality checks
- 15 built-in quality checks across 5 categories
- Catalog UI for visualizing results across services
- GitHub Pages integration for hosting catalog
- Badge generation for README files
- Automated installation workflow
- Staleness detection for outdated results
- Registry consolidation system
- Platform and service installation guides
- Comprehensive architecture documentation
- Check development guide with examples in Bash, Python, and JavaScript
- Token requirements documentation
- Workflow reference documentation
- Configuration schema and examples

### Security
- Token security best practices documentation
- Minimal permission requirements documented
- Secure token storage via GitHub Secrets

[1.0.0]: https://github.com/your-org/scorecards/releases/tag/v1.0.0
```

**Instructions:**
- Place in root directory
- Update `[Unreleased]` section when making changes
- Create version entries when releasing
- Follow categories: Added, Changed, Deprecated, Removed, Fixed, Security
- Link to releases at bottom
- Update the date placeholder with actual release date

---

### 2. FAQ.md (Root Directory)

**Location:** `/FAQ.md`

**Purpose:** Answer common questions quickly without users needing to search through documentation.

**Content Structure:**
```markdown
# Frequently Asked Questions (FAQ)

## Table of Contents
- [General](#general)
- [Installation](#installation)
- [Configuration](#configuration)
- [Checks and Scoring](#checks-and-scoring)
- [Catalog and UI](#catalog-and-ui)
- [Troubleshooting](#troubleshooting)

---

## General

### What is Scorecards?

Scorecards is an automated quality measurement system that runs checks on your service repositories and displays results in a centralized catalog. It helps engineering teams maintain quality standards across many services.

### How does Scorecards compare to Cortex or Backstage?

Scorecards is a lightweight, Git-native alternative to enterprise service catalogs:
- **No backend infrastructure** - Everything runs in GitHub Actions and GitHub Pages
- **Fully customizable** - Fork and modify checks to match your standards
- **Free for public repos** - No licensing costs
- **Lower complexity** - Simple YAML configuration vs complex deployments

See `documentation/guides/platform-installation.md` for detailed comparison.

### How often do checks run?

By default, checks run:
- **Daily at midnight UTC** (via cron schedule)
- **On every push** to the default branch (optional)
- **Manually** via GitHub Actions UI

You can customize the schedule in `.github/workflows/scorecards.yml`.

### Does Scorecards block my CI/CD pipeline?

No, Scorecards is **non-blocking** by design. Even if checks fail, your builds and deployments continue normally. Scorecards only reports results to the catalog.

### Can I use Scorecards with private repositories?

Yes, Scorecards works with private repositories. However, note that:
- GitHub Pages catalogs for private repos may still be publicly accessible (unless you have GitHub Enterprise)
- You'll need a Personal Access Token with appropriate permissions
- Consider hosting the catalog in a private repo with restricted access

---

## Installation

### How do I install Scorecards on a single service?

Use the one-liner installation command:

```bash
gh workflow run create-installation-pr.yml \
  -f org=your-org \
  -f repo=your-service-repo \
  -R your-org/scorecards
```

This creates a PR in your service repository with the Scorecards workflow. See `documentation/guides/service-installation.md` for details.

### Do I need a Personal Access Token (PAT)?

Yes, you need **one PAT** for the scorecards system:

- **SCORECARDS_CATALOG_TOKEN** - Allows the action to write results to the catalog branch

The token needs:
- `repo` scope (for private repos) or `public_repo` scope (for public repos only)
- Write access to the scorecards repository

See `documentation/reference/token-requirements.md` for setup instructions.

### Can I install Scorecards on multiple services at once?

Yes! Use the bulk trigger workflow:

```bash
gh workflow run trigger-service-workflow.yml \
  -f mode=bulk \
  -f dry_run=false \
  -R your-org/scorecards
```

This triggers installation for all services in your organization. See `documentation/reference/workflows.md` for details.

### How do I uninstall Scorecards from a service?

1. Delete `.github/workflows/scorecards.yml` from the service repository
2. Optionally, remove the service from the catalog by deleting `registry/{org}/{repo}.json` from the `catalog` branch

---

## Configuration

### How do I customize which checks run?

Edit `.scorecard/config.yml` in your service repository:

```yaml
checks:
  disabled:
    - "01-readme-exists"  # Disable specific checks
    - "05-scorecard-config-exists"

  # Or enable only specific checks
  enabled:
    - "02-readme-links"
    - "03-readme-sections"
```

See `documentation/reference/configuration.md` for all options.

### Can I change check weights?

Yes, but you need to fork the scorecards repository and modify `checks/*/metadata.json` files:

```json
{
  "name": "README Exists",
  "weight": 10,  // Change this value
  "category": "documentation"
}
```

After changing weights, commit to your fork and update service workflows to use your fork.

### How do I add custom checks?

See `documentation/guides/check-development-guide.md` for a complete guide. In summary:

1. Create a new directory: `checks/XX-your-check-name/`
2. Add `check.sh` (or `check.py`, `check.js`)
3. Add `metadata.json` with name, weight, category, description
4. Add `README.md` explaining the check
5. Test locally, then commit to your fork

### Can I customize the catalog UI appearance?

Yes! The catalog UI is fully customizable:

- **Styling:** Edit `docs/src/styles/main.css`
- **Layout:** Modify `docs/index.html`
- **Components:** Update modules in `docs/src/components/`
- **Settings:** Adjust thresholds in `docs/src/data/settings.js`

See `docs/README.md` for catalog UI architecture.

---

## Checks and Scoring

### How is the score calculated?

Score = (Points Earned / Total Possible Points) × 100

- Each check has a **weight** (points possible)
- Passing a check earns its full weight
- Failing earns 0 points
- Checks can be disabled (excluded from calculation)

Example:
- Check A: weight 10, passed → 10 points
- Check B: weight 5, failed → 0 points
- Check C: weight 8, disabled → excluded
- Score = (10 / 15) × 100 = 67%

### What do the ranks mean?

- **Platinum** (90-100%): Exemplary quality
- **Gold** (75-89%): Strong quality practices
- **Silver** (50-74%): Basic quality standards met
- **Bronze** (<50%): Needs improvement

Thresholds can be customized in `docs/src/data/settings.js`.

### Why is my score different from what I expected?

Common reasons:
1. **Disabled checks** are excluded from calculation
2. **Check weights** may differ from your expectations
3. **Partial credit** is not given (checks are pass/fail)
4. **Staleness** - results may be outdated (check the timestamp)

View the detailed breakdown in the catalog UI to see which checks passed/failed.

### How long does it take for results to appear in the catalog?

Typically **2-5 minutes** after the workflow completes:
1. Workflow runs checks (30-60 seconds)
2. Results committed to `catalog` branch (10 seconds)
3. GitHub Pages rebuilds (1-3 minutes)
4. Browser cache clears (varies)

If results don't appear after 10 minutes, see Troubleshooting section.

---

## Catalog and UI

### Where is the catalog hosted?

The catalog is hosted on **GitHub Pages** from the `catalog` branch of your scorecards repository.

URL format: `https://{org}.github.io/scorecards/`

### How do I enable GitHub Pages?

See `documentation/guides/platform-installation.md`, section "GitHub Pages Setup":

1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: `catalog` / `/ (root)`
4. Save

### Can I self-host the catalog instead of using GitHub Pages?

Yes! The catalog is a static site. You can:
1. Clone the `catalog` branch
2. Serve the `docs/` directory with any web server (nginx, Apache, S3, etc.)
3. Configure your services to write results to your hosted location

### How do I add badges to my service README?

Add these to your service repository's README.md:

```markdown
[![Scorecard](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/{ORG}/scorecards/catalog/badges/{SERVICE-ORG}/{SERVICE-REPO}/score.json)](https://{ORG}.github.io/scorecards/#/service/{SERVICE-ORG}/{SERVICE-REPO})

[![Rank](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/{ORG}/scorecards/catalog/badges/{SERVICE-ORG}/{SERVICE-REPO}/rank.json)](https://{ORG}.github.io/scorecards/#/service/{SERVICE-ORG}/{SERVICE-REPO})
```

Replace `{ORG}`, `{SERVICE-ORG}`, and `{SERVICE-REPO}` with your values.

### What does "stale" mean in the catalog?

A service is marked **stale** if:
- Results are older than the current checks implementation (checks were updated since last run)
- Indicated by a yellow/orange indicator in the UI

This means the service should re-run scorecards to get current results.

---

## Troubleshooting

### My service isn't appearing in the catalog

**Check these in order:**

1. **Did the workflow run successfully?**
   - Go to service repo → Actions tab
   - Check the "Scorecards" workflow for errors

2. **Is the token configured correctly?**
   - Scorecards repo → Settings → Secrets and variables → Actions
   - Verify `SCORECARDS_CATALOG_TOKEN` exists

3. **Were results committed to the catalog branch?**
   - Scorecards repo → Switch to `catalog` branch
   - Check if `registry/{org}/{repo}.json` exists

4. **Did GitHub Pages rebuild?**
   - Scorecards repo → Actions tab → "pages-build-deployment" workflow
   - Should run after catalog branch updates

5. **Is the catalog URL correct?**
   - Should be: `https://{org}.github.io/scorecards/`

6. **Browser cache?**
   - Try hard refresh (Ctrl+Shift+R) or incognito mode

### I get "Permission denied" errors

**Cause:** Token doesn't have required permissions.

**Solutions:**

1. **Verify token has `repo` scope:**
   - GitHub → Settings → Developer settings → Personal access tokens
   - Click on your token → Check scopes

2. **Verify token user has write access:**
   - The user who created the token needs write access to the scorecards repo
   - Check repo → Settings → Collaborators

3. **Check token hasn't expired:**
   - Tokens can have expiration dates
   - Create a new token if expired

4. **Verify secret name is correct:**
   - Must be exactly `SCORECARDS_CATALOG_TOKEN`
   - Case-sensitive

### Workflow fails with "branch not found"

**Cause:** Service repository uses a different default branch (e.g., `master` instead of `main`).

**Solution:**

The workflow automatically detects the default branch, but if it fails:

1. Check your service's default branch name:
   ```bash
   gh repo view your-org/your-repo --json defaultBranchRef
   ```

2. The workflow now stores and uses the correct default branch automatically (as of latest updates)

3. If still failing, manually trigger the workflow and it will update the registry

### Check results seem incorrect

**Common issues:**

1. **Check ran in wrong context:**
   - Checks run against the repository at workflow trigger time
   - Ensure changes are committed and pushed

2. **Check requires specific files:**
   - Some checks look for exact file paths
   - Check the check's README: `checks/XX-check-name/README.md`

3. **Check has specific requirements:**
   - Example: "README sections" requires specific headings
   - See check documentation for exact requirements

4. **Check script has a bug:**
   - Report issues at: https://github.com/your-org/scorecards/issues

### Catalog shows old results

**Causes:**
1. **Workflow hasn't run recently** - Check last run time in Actions tab
2. **Workflow failed** - Check for errors in latest run
3. **GitHub Pages hasn't rebuilt** - Check pages-build-deployment workflow
4. **Browser cache** - Try hard refresh or incognito

**Solutions:**
- Manually trigger the workflow in your service repo
- Wait 2-3 minutes for results to propagate
- Check consolidate-registry workflow ran successfully

### How do I debug a failing check locally?

Run the check script directly on your service repository:

```bash
# Clone both repos
git clone https://github.com/your-org/scorecards.git
git clone https://github.com/your-org/your-service.git

# Run a specific check
cd scorecards
SCORECARD_REPO_PATH=../your-service bash checks/01-readme-exists/check.sh

# Check exit code
echo $?  # Should be 0 for pass, 1 for fail
```

See `documentation/guides/check-development-guide.md` for more debugging tips.

### I need help with something not covered here

**Resources:**
- 📖 **Documentation:** `documentation/` directory
- 🐛 **Report bugs:** https://github.com/your-org/scorecards/issues
- 💬 **Discussions:** https://github.com/your-org/scorecards/discussions
- 📧 **Contact:** [Your platform team contact]

---

## Still Have Questions?

If your question isn't answered here, please:
1. Check the full documentation in `documentation/`
2. Search existing issues and discussions
3. Open a new discussion or issue

We update this FAQ based on commonly asked questions!
```

**Instructions:**
- Place in root directory
- Update organization/repo placeholders
- Add link to FAQ from main README.md
- Keep FAQ updated as new questions arise
- Link to relevant documentation for detailed answers

---

### 3. documentation/guides/troubleshooting-guide.md

**Location:** `/documentation/guides/troubleshooting-guide.md`

**Purpose:** Consolidated guide for diagnosing and fixing common issues.

**Content Structure:**
```markdown
# Troubleshooting Guide

This guide helps you diagnose and fix common issues with Scorecards.

## Table of Contents
- [Quick Diagnostic Checklist](#quick-diagnostic-checklist)
- [Installation Issues](#installation-issues)
- [Permission and Authentication Issues](#permission-and-authentication-issues)
- [Workflow Execution Issues](#workflow-execution-issues)
- [Catalog Display Issues](#catalog-display-issues)
- [Check-Specific Issues](#check-specific-issues)
- [Performance Issues](#performance-issues)
- [Advanced Debugging](#advanced-debugging)

---

## Quick Diagnostic Checklist

When something isn't working, check these in order:

1. ✅ **Workflow succeeded?** - Check Actions tab in service repo
2. ✅ **Token configured?** - Check SCORECARDS_CATALOG_TOKEN secret exists
3. ✅ **Results committed?** - Check `registry/{org}/{repo}.json` exists in catalog branch
4. ✅ **Pages deployed?** - Check pages-build-deployment workflow succeeded
5. ✅ **URL correct?** - Verify `https://{org}.github.io/scorecards/` is accessible
6. ✅ **Cache cleared?** - Try hard refresh (Ctrl+Shift+R) or incognito mode

If all pass but still not working, see detailed sections below.

---

## Installation Issues

### Issue: Installation PR not created

**Symptoms:**
- Ran `gh workflow run create-installation-pr.yml` but no PR appears

**Diagnosis:**
```bash
# Check workflow run status
gh run list --workflow=create-installation-pr.yml -R your-org/scorecards --limit 5

# View logs of latest run
gh run view $(gh run list --workflow=create-installation-pr.yml -R your-org/scorecards --limit 1 --json databaseId --jq '.[0].databaseId') --log
```

**Common Causes:**

1. **Workflow failed**
   - Check logs for error messages
   - Common errors: invalid org/repo, token issues, rate limiting

2. **PR already exists**
   - Check service repo for existing "Add Scorecards workflow" PR
   - Workflow won't create duplicate PRs

3. **Token permissions**
   - Need PAT with `repo` scope (or `public_repo` for public repos only)
   - PAT user needs write access to target service repository

**Solutions:**

```bash
# Verify token has required permissions
gh auth status

# Manually check if service repo is accessible
gh repo view your-org/your-service

# Try with explicit token
GH_TOKEN=your_pat gh workflow run create-installation-pr.yml \
  -f org=your-org \
  -f repo=your-service \
  -R your-org/scorecards
```

### Issue: Bulk installation fails for some repos

**Symptoms:**
- `trigger-service-workflow.yml` with `mode=bulk` completes but some services weren't triggered

**Diagnosis:**
```bash
# Check which services are in registry
gh api repos/your-org/scorecards/contents/registry --ref catalog | jq -r '.[] | select(.type=="dir") | .name'

# Check workflow run logs
gh run view $(gh run list --workflow=trigger-service-workflow.yml -R your-org/scorecards --limit 1 --json databaseId --jq '.[0].databaseId') --log
```

**Common Causes:**

1. **Service not in registry**
   - Only services already installed (in registry) are triggered
   - Need to install services first with create-installation-pr.yml

2. **API rate limiting**
   - GitHub API has 5000 requests/hour limit
   - Bulk operations can hit this limit with many services

3. **Service workflow doesn't exist**
   - Service hasn't merged the installation PR yet
   - Workflow file `.github/workflows/scorecards.yml` not present

**Solutions:**

```bash
# Install missing services first
gh workflow run create-installation-pr.yml \
  -f org=your-org \
  -f repo=missing-service \
  -R your-org/scorecards

# Check rate limit status
gh api rate_limit

# Wait and retry if rate limited (resets hourly)
# Or trigger services in smaller batches
```

---

## Permission and Authentication Issues

### Issue: "Permission denied" when pushing to catalog branch

**Symptoms:**
```
! [remote rejected] HEAD -> catalog (permission denied)
error: failed to push some refs to 'https://github.com/your-org/scorecards.git'
```

**Diagnosis:**
```bash
# Check if token secret exists
gh secret list -R your-org/scorecards | grep SCORECARDS_CATALOG_TOKEN

# Verify token scopes (from the account that created it)
gh auth status
```

**Common Causes:**

1. **Token missing or misconfigured**
   - Secret name must be exactly `SCORECARDS_CATALOG_TOKEN`
   - Case-sensitive

2. **Insufficient token permissions**
   - Token needs `repo` scope (or `public_repo` for public repos)
   - For private repos, must have full `repo` scope

3. **Token user lacks write access**
   - User who created the PAT needs write access to scorecards repo
   - Check Settings → Manage access

4. **Token expired**
   - PATs can have expiration dates
   - Check GitHub → Settings → Developer settings → Personal access tokens

**Solutions:**

```bash
# Create new token with correct permissions
# Go to: GitHub → Settings → Developer settings → Personal access tokens → Generate new token
# Scopes needed: repo (full)

# Add token to repository secrets
gh secret set SCORECARDS_CATALOG_TOKEN -R your-org/scorecards
# Paste token when prompted

# Verify token works
GH_TOKEN=your_new_token gh api user
```

### Issue: "Resource not accessible by integration" error

**Symptoms:**
```
Error: Resource not accessible by integration
```

**Cause:**
Workflow is using `GITHUB_TOKEN` instead of `SCORECARDS_CATALOG_TOKEN` for operations that require write access.

**Solution:**

Check workflow file uses correct token:

```yaml
- name: Checkout catalog branch
  uses: actions/checkout@v4
  with:
    ref: catalog
    token: ${{ secrets.SCORECARDS_CATALOG_TOKEN }}  # Not GITHUB_TOKEN

- name: Commit results
  env:
    GH_TOKEN: ${{ secrets.SCORECARDS_CATALOG_TOKEN }}  # Not GITHUB_TOKEN
  run: |
    git push origin catalog
```

`GITHUB_TOKEN` has read-only permissions for push-triggered workflows.

### Issue: Token works in one workflow but not another

**Symptoms:**
- create-installation-pr.yml works
- But service scorecards workflow fails with permission errors

**Cause:**
Service workflow is missing the token secret or not passing it correctly.

**Solution:**

1. Verify token is set in service repository secrets (not scorecards repo):
   ```bash
   gh secret list -R your-org/your-service | grep SCORECARDS_CATALOG_TOKEN
   ```

2. If missing, add it:
   ```bash
   gh secret set SCORECARDS_CATALOG_TOKEN -R your-org/your-service
   ```

3. Verify service workflow passes token to action:
   ```yaml
   - name: Run Scorecards
     uses: your-org/scorecards/action@main
     with:
       catalog_token: ${{ secrets.SCORECARDS_CATALOG_TOKEN }}
   ```

---

## Workflow Execution Issues

### Issue: Workflow runs but checks don't execute

**Symptoms:**
- Workflow completes successfully
- But no check results in output

**Diagnosis:**
```bash
# View workflow run logs
gh run view <run-id> --log -R your-org/your-service

# Look for check execution section
# Should see: "Running check 01-readme-exists..."
```

**Common Causes:**

1. **Checks directory not found**
   - Action couldn't find checks in scorecards repo
   - Check if `checks/` directory exists and contains check folders

2. **Invalid check structure**
   - Checks must have `check.sh` (or `.py`, `.js`) and `metadata.json`
   - Check metadata is valid JSON

3. **Permissions on check scripts**
   - Check scripts must be executable
   - May have been lost if copied on Windows

**Solutions:**

```bash
# Verify checks structure locally
cd scorecards
find checks -name "check.*" -type f

# Verify metadata files
find checks -name "metadata.json" -type f -exec cat {} \;

# Make scripts executable (if needed)
find checks -name "check.*" -type f -exec chmod +x {} \;
git add checks
git commit -m "Make check scripts executable"
```

### Issue: Specific check always fails

**Symptoms:**
- One check consistently fails while others pass
- Check should pass based on repository contents

**Diagnosis:**

Run check locally to see detailed output:

```bash
# Clone both repos
git clone https://github.com/your-org/scorecards.git
git clone https://github.com/your-org/your-service.git

# Run specific check with debug output
cd scorecards
export SCORECARD_REPO_PATH=../your-service
bash -x checks/XX-check-name/check.sh

# Check exit code
echo "Exit code: $?"
```

**Common Causes:**

1. **Check looks for exact paths**
   - Example: Expects `README.md` (uppercase) not `readme.md`
   - Case-sensitive on Linux runners

2. **Check has strict requirements**
   - Example: "README sections" expects exact heading names
   - Check the check's README.md for requirements

3. **File encoding issues**
   - Windows line endings (CRLF) vs Unix (LF)
   - Can cause pattern matching to fail

4. **Check script has a bug**
   - Report at: https://github.com/your-org/scorecards/issues

**Solutions:**

```bash
# Verify file exists with exact name
ls -la | grep -i readme

# Check file encoding
file README.md

# Convert line endings if needed
dos2unix README.md  # Or use your editor's convert function

# Review check requirements
cat scorecards/checks/XX-check-name/README.md
```

### Issue: Workflow times out

**Symptoms:**
```
Error: The operation was canceled.
```

**Cause:**
Workflow exceeded time limit (default 360 minutes, but checks should take <5 minutes).

**Diagnosis:**
```bash
# Check workflow duration
gh run view <run-id> -R your-org/your-service

# Look for which step timed out in logs
gh run view <run-id> --log -R your-org/your-service | grep -i "timeout\|cancel"
```

**Common Causes:**

1. **Hung check script**
   - Check script waiting for input or stuck in loop
   - Example: Interactive command without -y flag

2. **Large repository**
   - Checkout step takes long time
   - Repository has large files or deep history

3. **External dependency timeout**
   - Check tries to download something that's unavailable
   - Network requests without timeout

**Solutions:**

```bash
# Add timeout to workflow steps
- name: Run Scorecards
  timeout-minutes: 10  # Add this
  uses: your-org/scorecards/action@main

# Add timeouts to check scripts (Bash example)
timeout 30s command_that_might_hang || echo "Command timed out"

# Use shallow checkout for large repos
- uses: actions/checkout@v4
  with:
    fetch-depth: 1  # Shallow clone
```

---

## Catalog Display Issues

### Issue: Service not appearing in catalog

**Symptoms:**
- Workflow succeeded
- But service doesn't show in catalog UI

**Step-by-Step Diagnosis:**

**Step 1: Verify results were committed**
```bash
# Switch to catalog branch
git clone -b catalog https://github.com/your-org/scorecards.git scorecards-catalog
cd scorecards-catalog

# Check if results file exists
ls -la registry/your-org/your-service.json

# View contents
cat registry/your-org/your-service.json
```

If file doesn't exist → Results weren't committed (see Permission Issues)
If file exists → Continue to Step 2

**Step 2: Verify GitHub Pages deployed**
```bash
# Check pages deployment
gh run list --workflow=pages-build-deployment -R your-org/scorecards --limit 5

# View latest deployment status
gh run view $(gh run list --workflow=pages-build-deployment -R your-org/scorecards --limit 1 --json databaseId --jq '.[0].databaseId')
```

If deployment failed → Check logs for error
If deployment succeeded → Continue to Step 3

**Step 3: Verify catalog URL is correct**

Expected URL: `https://your-org.github.io/scorecards/`

```bash
# Test catalog loads
curl -I https://your-org.github.io/scorecards/

# Should return: HTTP/2 200
```

If 404 → GitHub Pages not enabled (see Installation guide)
If 200 → Continue to Step 4

**Step 4: Check browser console**

1. Open catalog in browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Look for errors loading registry data

Common errors:
- CORS errors → GitHub Pages configuration issue
- 404 on registry files → Files not in correct location
- JavaScript errors → Catalog UI bug

**Step 5: Clear browser cache**

```bash
# Try in incognito/private browsing mode
# Or hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

**Solutions:**

```bash
# If GitHub Pages not enabled
# Go to: Repo → Settings → Pages
# Source: Deploy from a branch
# Branch: catalog / / (root)
# Save

# If registry file in wrong location, move it
cd scorecards-catalog
git mv registry/wrong/location.json registry/correct/location.json
git commit -m "Fix registry file location"
git push origin catalog

# Wait 2-3 minutes for Pages to rebuild
```

### Issue: Catalog shows "No services found"

**Symptoms:**
- Catalog UI loads
- But shows "No services found" message

**Cause:**
Registry consolidation hasn't run yet, or consolidated registry is empty.

**Diagnosis:**
```bash
# Check if consolidated registry exists
git clone -b catalog https://github.com/your-org/scorecards.git scorecards-catalog
cd scorecards-catalog
cat registry/consolidated-registry.json

# Should contain array of services
```

**Solution:**

Consolidated registry is built by `consolidate-registry` workflow:

```bash
# Check if workflow exists and runs
gh workflow list -R your-org/scorecards | grep consolidate

# Manually trigger it
gh workflow run consolidate-registry.yml -R your-org/scorecards

# Check it succeeded
gh run watch
```

If workflow doesn't exist, it should be triggered automatically when results are committed.

### Issue: Catalog shows stale results

**Symptoms:**
- Results in catalog are old (days or weeks old)
- Service has run scorecards recently

**Diagnosis:**
```bash
# Check timestamp in results file
git clone -b catalog https://github.com/your-org/scorecards.git scorecards-catalog
cat scorecards-catalog/registry/your-org/your-service.json | jq '.timestamp'

# Compare to workflow run time
gh run list --workflow=scorecards.yml -R your-org/your-service --limit 1
```

**Common Causes:**

1. **Recent workflow failed**
   - Check didn't complete, so old results remain
   - Check Actions tab for errors

2. **Results committed to wrong location**
   - Check workflow commits to correct path: `registry/{org}/{repo}.json`

3. **GitHub Pages cache**
   - Browser or CDN cached old version
   - Usually clears within 10 minutes

**Solutions:**

```bash
# Clear catalog cache by making a trivial commit
cd scorecards-catalog
git commit --allow-empty -m "Trigger Pages rebuild"
git push origin catalog

# Hard refresh browser
# Ctrl+Shift+R or Cmd+Shift+R

# Or wait 10 minutes for cache to expire
```

### Issue: Badge not updating

**Symptoms:**
- Catalog shows new results
- But badge in README shows old score/rank

**Cause:**
Badges use `shields.io` which caches responses for performance.

**Diagnosis:**
```bash
# Check badge JSON file
curl https://raw.githubusercontent.com/your-org/scorecards/catalog/badges/your-org/your-service/score.json

# Should show current score
```

If JSON is correct but badge shows old value:
- shields.io has cached the old response
- Cache typically expires in 5-30 minutes

**Solutions:**

1. **Wait 30 minutes** for shields.io cache to expire

2. **Force badge refresh:**
   - Add cache-busting parameter to badge URL:
   ```markdown
   [![Scorecard](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/your-org/scorecards/catalog/badges/your-org/your-service/score.json&cacheSeconds=300)]
   ```

3. **Clear shields.io cache (if you have control):**
   - Some badges services have cache clearing endpoints

---

## Check-Specific Issues

### Issue: README checks pass but shouldn't (or vice versa)

**Common README check issues:**

1. **Case sensitivity**
   - Check expects `README.md` (uppercase)
   - You have `readme.md` or `Readme.md`
   - Solution: Rename file to exact case

2. **File encoding**
   - Check expects UTF-8
   - File is UTF-16 or other encoding
   - Solution: Convert to UTF-8

3. **Broken links not detected**
   - Link check may have false negatives
   - External links may be temporarily up
   - Solution: Run check locally to see detailed output

### Issue: Test coverage check fails but coverage is good

**Cause:**
Check couldn't find or parse coverage report.

**Requirements:**
- Coverage report must be in expected format and location
- Common formats: Cobertura XML, LCOV, JaCoCo
- Expected locations vary by check implementation

**Solution:**
```bash
# Check what coverage files exist
find . -name "*coverage*" -type f

# Run check locally with debug output
export SCORECARD_REPO_PATH=path/to/your/service
bash -x checks/XX-test-coverage/check.sh

# Verify coverage format matches check expectations
# See check's README.md for required format
```

### Issue: OpenAPI spec check fails

**Common causes:**

1. **Spec file not in expected location**
   - Check looks for: `openapi.yaml`, `openapi.yml`, `openapi.json`, `swagger.yaml`
   - In root directory or `docs/` directory
   - Solution: Move spec file to expected location

2. **Invalid OpenAPI spec**
   - Syntax errors in YAML/JSON
   - Validation: Use https://editor.swagger.io/

3. **OpenAPI version not supported**
   - Check may only support OpenAPI 3.x
   - Solution: Upgrade spec to v3

**Debug:**
```bash
# Validate spec locally
npm install -g @apidevtools/swagger-cli
swagger-cli validate openapi.yaml
```

---

## Performance Issues

### Issue: Workflow takes too long

**Symptoms:**
- Workflow completes successfully
- But takes 5+ minutes (should be 1-2 minutes)

**Diagnosis:**
```bash
# View workflow run and timing
gh run view <run-id> -R your-org/your-service

# Identify slow steps
```

**Common Causes:**

1. **Large repository checkout**
   - Repository has large files or deep history
   - Solution: Use shallow clone

2. **Slow checks**
   - Some checks may do expensive operations
   - Example: Cloning external repos, downloading large files
   - Solution: Optimize or disable slow checks

3. **Cold Docker cache**
   - First run builds Docker image
   - Subsequent runs should be faster with cache
   - Solution: Add caching to workflow

**Solutions:**

```yaml
# Use shallow checkout
- uses: actions/checkout@v4
  with:
    fetch-depth: 1

# Add Docker layer caching
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Cache Docker layers
  uses: actions/cache@v3
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-buildx-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-buildx-
```

### Issue: Many services cause rate limiting

**Symptoms:**
```
Error: API rate limit exceeded
```

**Cause:**
GitHub API has 5000 requests/hour limit (with token), 60/hour without.

**Diagnosis:**
```bash
# Check current rate limit status
gh api rate_limit

# Shows:
# - limit: 5000
# - remaining: 42
# - reset: 1640000000 (Unix timestamp)
```

**Solutions:**

1. **Stagger workflow schedules**
   ```yaml
   on:
     schedule:
       # Different times for different services
       - cron: '0 0 * * *'   # Service A: Midnight
       - cron: '0 6 * * *'   # Service B: 6 AM
       - cron: '0 12 * * *'  # Service C: Noon
   ```

2. **Reduce API calls**
   - Cache API responses where possible
   - Batch operations
   - Use conditional requests (ETags)

3. **Use multiple tokens (for large orgs)**
   - Different tokens for different service groups
   - Each token gets separate rate limit

4. **Wait for rate limit reset**
   - Rate limit resets every hour
   - Workflow can wait and retry

---

## Advanced Debugging

### Enable debug logging in workflows

Add to service workflow file:

```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

This enables verbose logging for all steps.

### Run action locally with act

```bash
# Install act
# https://github.com/nektos/act

# Run workflow locally
cd your-service
act -j scorecard

# With secrets
act -j scorecard -s SCORECARDS_CATALOG_TOKEN=your_token
```

### Inspect catalog branch state

```bash
# Clone catalog branch
git clone -b catalog https://github.com/your-org/scorecards.git scorecards-catalog

# View structure
cd scorecards-catalog
tree registry/

# View specific service results
cat registry/your-org/your-service.json | jq .

# View consolidated registry
cat registry/consolidated-registry.json | jq . | less

# Check badges
cat badges/your-org/your-service/score.json
```

### Test check execution manually

```bash
# Clone repos
git clone https://github.com/your-org/scorecards.git
git clone https://github.com/your-org/your-service.git

# Run single check with debugging
cd scorecards
export SCORECARD_REPO_PATH=../your-service
bash -x checks/01-readme-exists/check.sh

# Capture output and exit code
bash checks/01-readme-exists/check.sh > output.txt 2>&1
echo "Exit code: $?" >> output.txt
cat output.txt
```

### Check GitHub Actions logs in detail

```bash
# List recent runs
gh run list -R your-org/your-service --limit 10

# View specific run
gh run view <run-id> -R your-org/your-service

# Download full logs
gh run download <run-id> -R your-org/your-service

# View specific job logs
gh run view <run-id> --log -R your-org/your-service | grep "ERROR\|FAIL"
```

### Verify GitHub Pages configuration

```bash
# Check Pages settings via API
gh api repos/your-org/scorecards/pages

# Should show:
# {
#   "status": "built",
#   "source": {
#     "branch": "catalog",
#     "path": "/"
#   }
# }
```

---

## Getting Help

If you've tried the solutions in this guide and still have issues:

1. **Check documentation:**
   - `documentation/guides/` - How-to guides
   - `documentation/reference/` - Configuration reference
   - `documentation/architecture/` - System architecture

2. **Search existing issues:**
   ```bash
   gh issue list -R your-org/scorecards --search "your error message"
   ```

3. **Enable debug logging and collect information:**
   - Workflow run ID
   - Full error message
   - Relevant logs
   - Repository structure

4. **Create a new issue:**
   ```bash
   gh issue create -R your-org/scorecards \
     --title "Brief description of issue" \
     --body "Full details, error messages, and context"
   ```

5. **Contact platform team:**
   - [Your platform team contact info]

---

## Contributing to This Guide

Found a solution to an issue not covered here? Please contribute!

1. Add your issue and solution to the appropriate section
2. Follow the format: Issue → Symptoms → Diagnosis → Cause → Solution
3. Include code examples and commands
4. Test your solution before submitting
5. Submit a PR with your addition

This helps the entire community!
```

**Instructions:**
- Place in documentation/guides/ directory
- Link from README.md and FAQ.md
- Update documentation/guides/README.md to include this guide
- Keep updated with new common issues

---

### 4. documentation/guides/tutorial-first-scorecard.md

**Location:** `/documentation/guides/tutorial-first-scorecard.md`

**Purpose:** Gentle, hands-on tutorial for first-time users to understand Scorecards through practical experience.

**Content Structure:**
```markdown
# Tutorial: Your First Scorecard in 15 Minutes

Welcome! This tutorial walks you through adding Scorecards to a repository and understanding your quality score.

**What you'll learn:**
- How to install Scorecards on a service
- How to view results in the catalog
- What the checks mean
- How to improve your score

**Prerequisites:**
- GitHub account with access to your organization
- A test repository (can be any repository, even an empty one)
- GitHub CLI (`gh`) installed ([installation guide](https://cli.github.com/))
- 15 minutes

**Note:** This tutorial assumes your organization already has Scorecards set up. If not, see the [Platform Installation Guide](platform-installation.md) first.

---

## Step 1: Choose a Repository (2 minutes)

For this tutorial, you'll need a test repository. You can:
- Use an existing service repository
- Create a new test repository
- Fork an example repository

**Create a new test repository:**

```bash
# Create a new repository
gh repo create my-first-scorecard --public --clone

# Add a simple README
cd my-first-scorecard
echo "# My First Scorecard" > README.md
git add README.md
git commit -m "Initial commit"
git push origin main
```

Your repository is now at: `https://github.com/YOUR-USERNAME/my-first-scorecard`

---

## Step 2: Install Scorecards Workflow (3 minutes)

Now let's add Scorecards to your repository. Your organization's platform team has already set up the scorecards system.

**Automatic installation (recommended):**

```bash
# Trigger the installation workflow
# Replace YOUR-ORG with your organization name
# Replace YOUR-USERNAME with your GitHub username
gh workflow run create-installation-pr.yml \
  -f org=YOUR-USERNAME \
  -f repo=my-first-scorecard \
  -R YOUR-ORG/scorecards
```

This creates a Pull Request in your repository with the Scorecards workflow.

**Check for the PR:**

```bash
# Wait 30 seconds for the workflow to run, then check
gh pr list -R YOUR-USERNAME/my-first-scorecard

# You should see: "Add Scorecards quality checks"
```

**Review and merge the PR:**

```bash
# View the PR
gh pr view <PR-NUMBER> -R YOUR-USERNAME/my-first-scorecard

# Review the changes - you should see:
# - .github/workflows/scorecards.yml added
# - .scorecard/config.yml added (optional configuration)

# Merge the PR
gh pr merge <PR-NUMBER> -R YOUR-USERNAME/my-first-scorecard --squash
```

**What just happened?**
- A GitHub Actions workflow was added to your repository
- This workflow will run quality checks on your code
- Results will be sent to your organization's catalog
- The workflow runs daily and on every push

---

## Step 3: Watch Scorecards Run (2 minutes)

After merging the PR, Scorecards will run automatically!

**Watch it in action:**

```bash
# View running workflows
gh run watch -R YOUR-USERNAME/my-first-scorecard

# Or view in browser
gh repo view YOUR-USERNAME/my-first-scorecard --web
# Click "Actions" tab → Click "Scorecards" workflow
```

**What you'll see:**

1. **Checkout repository** - Gets your code
2. **Run Scorecards** - Executes ~15 quality checks
3. **Submit results** - Sends results to the catalog

The workflow should complete in **1-2 minutes**.

**Typical output:**
```
Running check 01-readme-exists... ✓ PASS
Running check 02-readme-links... ✓ PASS
Running check 03-readme-sections... ✗ FAIL
Running check 04-contributing-guide... ✗ FAIL
...

Score: 45/100 (Bronze)
Checks passed: 7/15
```

---

## Step 4: View Your Results in the Catalog (3 minutes)

Now let's see your results in the visual catalog!

**Open the catalog:**

```bash
# Get your organization's catalog URL
# Replace YOUR-ORG with your organization name
echo "https://YOUR-ORG.github.io/scorecards/"
```

Open this URL in your browser.

**What you'll see:**

1. **Service list** - All services in your organization
2. **Your service** - Look for `YOUR-USERNAME/my-first-scorecard`
3. **Score and rank** - Percentage score and rank (Bronze/Silver/Gold/Platinum)

**Click on your service** to see detailed results:

- **Overall score** - Big number at the top
- **Rank badge** - Bronze, Silver, Gold, or Platinum
- **Check results** - Green ✓ for passed, Red ✗ for failed
- **Categories** - Checks grouped by type (documentation, testing, etc.)
- **Timestamp** - When the checks last ran

**Understanding your score:**

Your score is calculated as:
```
Score = (Points Earned / Total Possible Points) × 100
```

Each check has a **weight** (point value). When you pass a check, you earn its points.

Example for our simple repository:
- README exists (weight 10): ✓ PASS → 10 points
- README has links (weight 5): ✓ PASS → 5 points
- README has sections (weight 8): ✗ FAIL → 0 points
- Contributing guide (weight 7): ✗ FAIL → 0 points
- ... (11 more checks)
- **Total: 45/100 points = 45% = Bronze rank**

---

## Step 5: Understand the Checks (2 minutes)

Let's look at what each check means. Click on a failed check in the catalog to see details.

**Common checks you'll see:**

| Check | What it checks | Why it matters |
|-------|----------------|----------------|
| **README Exists** | Root directory has README.md | First thing users see |
| **README Links** | README has working links | Prevents broken documentation |
| **README Sections** | README has standard sections (Installation, Usage, etc.) | Makes docs easy to navigate |
| **Contributing Guide** | Has CONTRIBUTING.md | Helps new contributors |
| **License** | Has LICENSE file | Legal clarity |
| **CI Configured** | Has CI workflow (.github/workflows/) | Automated testing |
| **Tests Exist** | Has test files | Quality assurance |
| **Test Coverage** | Code coverage >80% | Adequate testing |
| **OpenAPI Spec** | API documented with OpenAPI | API discoverability |
| **Code of Conduct** | Has CODE_OF_CONDUCT.md | Community standards |
| **Security Policy** | Has SECURITY.md | Vulnerability reporting |

**Check categories:**
- 📄 **Documentation** - READMEs, guides, API docs
- 🧪 **Testing** - Tests, coverage, CI/CD
- 🏗️ **Architecture** - Code quality, dependencies
- 🔒 **Security** - Security policies, vulnerability scanning
- 📦 **Operations** - Deployment, monitoring

---

## Step 6: Improve Your Score (3 minutes)

Let's fix one failing check to improve your score!

**Add a Contributing Guide:**

```bash
cd my-first-scorecard

# Create CONTRIBUTING.md
cat > CONTRIBUTING.md << 'EOF'
# Contributing to My First Scorecard

Thank you for your interest in contributing!

## How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Commit: `git commit -m "Add my feature"`
5. Push: `git push origin feature/my-feature`
6. Open a Pull Request

## Code of Conduct

Be respectful and professional in all interactions.

## Questions?

Open an issue or contact the maintainers.
EOF

# Commit and push
git add CONTRIBUTING.md
git commit -m "Add contributing guide"
git push origin main
```

**Watch your score improve:**

1. The push triggers Scorecards workflow automatically
2. Wait 2 minutes for workflow to complete
3. Wait another 2-3 minutes for catalog to update
4. Refresh catalog page
5. Your score should now be higher! (55/100 instead of 45/100)

**Check what changed:**
- "Contributing Guide" check now shows ✓ PASS (green)
- You earned 7 more points
- Your rank might stay Bronze (need 50+ for Silver) but you're closer!

---

## Step 7: Add a Badge to Your README (1 minute)

Show off your quality score with a badge!

```bash
cd my-first-scorecard

# Add badge to README (at the top)
cat > README.md << 'EOF'
# My First Scorecard

[![Scorecard](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR-ORG/scorecards/catalog/badges/YOUR-USERNAME/my-first-scorecard/score.json)](https://YOUR-ORG.github.io/scorecards/#/service/YOUR-USERNAME/my-first-scorecard)

This is my first repository with Scorecards!
EOF

# Commit and push
git add README.md
git commit -m "Add scorecard badge"
git push origin main
```

Replace `YOUR-ORG` and `YOUR-USERNAME` with your actual values.

**View your badge:**
- Go to your repository on GitHub
- The README now shows a colorful badge with your score!
- Badge updates automatically when your score changes

---

## What You've Learned

Congratulations! You've successfully:

✅ Installed Scorecards on a repository
✅ Watched checks run in GitHub Actions
✅ Viewed results in the catalog UI
✅ Understood what the checks measure
✅ Improved your score by fixing a check
✅ Added a badge to showcase your quality

---

## Next Steps

### Keep Improving Your Score

Pick another failing check and fix it! Some easy wins:

**Add a License:**
```bash
# Choose a license at https://choosealicense.com/
# For example, MIT license:
curl -o LICENSE https://raw.githubusercontent.com/github/choosealicense.com/gh-pages/_licenses/mit.txt
# Edit LICENSE to add your name and year
git add LICENSE
git commit -m "Add MIT license"
git push
```

**Add a Security Policy:**
```bash
cat > SECURITY.md << 'EOF'
# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please email security@example.com.

Do not open a public issue for security vulnerabilities.

We will respond within 48 hours.
EOF

git add SECURITY.md
git commit -m "Add security policy"
git push
```

**Add Tests:**
```bash
# Depends on your language
# For example, JavaScript with Jest:
npm install --save-dev jest
mkdir tests
cat > tests/example.test.js << 'EOF'
test('example test', () => {
  expect(1 + 1).toBe(2);
});
EOF

# Update package.json to add test script
# Then commit and push
```

### Customize Scorecards

**Disable checks you don't need:**

Edit `.scorecard/config.yml` in your repository:

```yaml
checks:
  disabled:
    - "08-test-coverage"  # Don't check coverage for now
    - "09-openapi-spec"   # Not an API service
```

See [Configuration Reference](../reference/configuration.md) for all options.

**Change when checks run:**

Edit `.github/workflows/scorecards.yml`:

```yaml
on:
  schedule:
    - cron: '0 12 * * *'  # Change to noon instead of midnight
  push:
    branches: [main]      # Run on every push
  workflow_dispatch:      # Allow manual trigger
```

### Learn More

**Guides:**
- [Service Installation Guide](service-installation.md) - Detailed installation options
- [Configuration Reference](../reference/configuration.md) - All configuration options
- [Check Development Guide](check-development-guide.md) - Create custom checks

**Reference:**
- [Action Reference](../reference/action-reference.md) - GitHub Action inputs/outputs
- [Workflows Reference](../reference/workflows.md) - All system workflows
- [Token Requirements](../reference/token-requirements.md) - Security setup

**Architecture:**
- [System Overview](../architecture/overview.md) - How Scorecards works
- [Catalog UI](../architecture/catalog-ui.md) - Catalog internals
- [Scoring Flow](../architecture/flows/scoring-flow.md) - How scoring works

**Need Help?**
- [FAQ](../../FAQ.md) - Common questions
- [Troubleshooting Guide](troubleshooting-guide.md) - Fix common issues
- [Open an issue](https://github.com/YOUR-ORG/scorecards/issues) - Report bugs or ask questions

---

## Tips and Tricks

**Manually trigger checks:**
```bash
# Run Scorecards without waiting for schedule or push
gh workflow run scorecards.yml -R YOUR-USERNAME/my-first-scorecard
```

**View check details locally:**
```bash
# Clone scorecards repo to see what checks do
git clone https://github.com/YOUR-ORG/scorecards.git
cd scorecards

# Read a check's documentation
cat checks/01-readme-exists/README.md

# See the check script
cat checks/01-readme-exists/check.sh
```

**Test checks locally before pushing:**
```bash
# Clone both repos
git clone https://github.com/YOUR-ORG/scorecards.git
git clone https://github.com/YOUR-USERNAME/my-first-scorecard.git

# Run a check on your repo
cd scorecards
export SCORECARD_REPO_PATH=../my-first-scorecard
bash checks/03-readme-sections/check.sh
echo "Exit code: $?"  # 0 = pass, 1 = fail
```

**Compare with other services:**
- Browse the catalog to see high-scoring services
- Click on them to see what checks they pass
- Use them as examples for your own repository

**Set a score goal:**
- Bronze (0-49%): Basic documentation
- Silver (50-74%): Good documentation + some testing
- Gold (75-89%): Strong quality practices
- Platinum (90-100%): Exemplary quality

Start with Silver (50%), then work toward Gold (75%)!

---

## Troubleshooting

**Workflow didn't run after merge?**
- Check Actions tab for errors
- Manually trigger: `gh workflow run scorecards.yml -R YOUR-USERNAME/my-first-scorecard`

**Service not in catalog?**
- Wait 5 minutes (GitHub Pages takes time to rebuild)
- Check catalog branch has your results: `gh api repos/YOUR-ORG/scorecards/contents/registry/YOUR-USERNAME --ref catalog`
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

**Badge not updating?**
- Badge images are cached by shields.io
- Wait 30 minutes for cache to expire
- Or add `&cacheSeconds=300` to badge URL

**Check failed but should pass?**
- Run check locally to see detailed output (see Tips above)
- Read check's README.md for exact requirements
- File paths and names are case-sensitive

See [Troubleshooting Guide](troubleshooting-guide.md) for more solutions.

---

## Feedback

This is your first experience with Scorecards! We'd love to hear:
- Was this tutorial clear and easy to follow?
- Did you get stuck anywhere?
- What would make it better?

Please [open an issue](https://github.com/YOUR-ORG/scorecards/issues) with feedback!

---

Happy Scorecarding! 🎯
```

**Instructions:**
- Place in documentation/guides/ directory
- Link prominently from main README.md
- Update YOUR-ORG and YOUR-USERNAME placeholders to match your installation
- Add screenshots if possible (optional enhancement)
- Test tutorial with a new user to verify all steps work

---

### 5. documentation/reference/glossary.md

**Location:** `/documentation/reference/glossary.md`

**Purpose:** Define all domain-specific terms used throughout the documentation.

**Content Structure:**
```markdown
# Glossary

This glossary defines terms used throughout the Scorecards documentation.

---

## A

**Action**
The GitHub Action component of Scorecards that executes quality checks in service repositories. The action is invoked by the `scorecards.yml` workflow file.

**API Reference**
Documentation describing the inputs, outputs, and configuration options for the Scorecards action and JavaScript modules.

---

## B

**Badge**
A visual indicator (SVG image) showing a service's score or rank, typically displayed in the README. Generated automatically and served via shields.io.

**Bronze Rank**
The lowest quality rank, awarded to services scoring 0-49%. Indicates basic quality standards need improvement.

**Bulk Trigger**
Triggering the Scorecards workflow across multiple services simultaneously using the `trigger-service-workflow.yml` workflow with `mode=bulk`.

---

## C

**Catalog**
The web-based user interface that displays scorecard results across all services. Hosted on GitHub Pages and built from the catalog branch.

**Catalog Branch**
A dedicated Git branch (typically named `catalog`) that stores all scorecard results, badges, registry data, and the catalog UI. Served via GitHub Pages.

**Catalog Token**
A GitHub Personal Access Token (stored as `SCORECARDS_CATALOG_TOKEN`) that allows the action to write results to the catalog branch. Requires `repo` scope.

**Category**
A grouping of related checks. Default categories include: documentation, testing, architecture, security, and operations.

**Check**
An individual quality measurement that examines one aspect of a repository. Checks are pass/fail and have an associated weight (point value).

**Check Script**
The executable file (`check.sh`, `check.py`, or `check.js`) that implements a check's logic. Must exit with 0 for pass, 1 for fail.

**Checks Hash**
A SHA256 hash of all check implementations, metadata, and weights. Used to detect when checks have been updated and results are stale.

**Consolidated Registry**
A single JSON file (`registry/consolidated-registry.json`) that aggregates data from all individual service registry files for efficient loading by the catalog UI.

**Config File**
The `.scorecard/config.yml` file in a service repository that customizes which checks run and provides service metadata (team, description, links).

**Contributing Guide**
The `CONTRIBUTING.md` file that explains how to contribute to a repository. Checked by the "Contributing Guide" check.

---

## D

**Default Branch**
The primary branch of a repository (typically `main` or `master`). Scorecards runs on the default branch and detects it automatically.

**Disabled Check**
A check that is excluded from running for a specific service, configured in `.scorecard/config.yml`. Disabled checks don't affect the score.

---

## E

**Enabled Check**
A check that is active and will run for a service. By default, all checks are enabled unless explicitly disabled or using the `enabled` whitelist mode.

---

## F

**Failed Check**
A check that did not meet its quality criteria (exit code 1). Failed checks contribute 0 points to the score.

---

## G

**GitHub Actions**
The CI/CD platform where Scorecards checks execute. Workflows are defined in `.github/workflows/`.

**GitHub Pages**
The static site hosting service that serves the catalog UI from the catalog branch. Requires enabling in repository settings.

**Gold Rank**
A high quality rank awarded to services scoring 75-89%. Indicates strong quality practices.

---

## I

**Installation PR**
A Pull Request automatically created by the `create-installation-pr.yml` workflow that adds the Scorecards workflow to a service repository.

---

## M

**Metadata File**
The `metadata.json` file in each check directory that defines the check's name, weight, category, description, and remediation guidance.

---

## O

**OpenAPI Spec**
A standardized format (OpenAPI 3.x or Swagger 2.x) for documenting REST APIs. Checked by the "OpenAPI Spec" check.

---

## P

**Passed Check**
A check that met its quality criteria (exit code 0). Passed checks contribute their full weight to the score.

**Personal Access Token (PAT)**
A GitHub authentication token used to perform API operations. Scorecards requires `SCORECARDS_CATALOG_TOKEN` with `repo` scope.

**Platform Team**
The team responsible for managing the central Scorecards infrastructure (the scorecards repository, catalog, and system workflows).

**Platinum Rank**
The highest quality rank, awarded to services scoring 90-100%. Indicates exemplary quality practices.

**Points**
The scoring unit used to calculate quality scores. Each check has a weight (possible points), and passing earns those points.

---

## R

**Rank**
A quality tier (Bronze, Silver, Gold, Platinum) assigned based on score percentage. Ranks provide a quick visual indicator of quality level.

**Registry**
The collection of JSON files in the catalog branch that store metadata and results for each service. Located in `registry/{org}/{repo}.json`.

**Registry Consolidation**
The process of aggregating individual service registry files into a single consolidated registry for efficient catalog loading. Performed by the `consolidate-registry` workflow.

**Remediation**
Guidance on how to fix a failing check, provided in the check's metadata and displayed in the catalog UI.

**Results File**
The JSON file (`results.json`) generated by the action containing all check results, scores, and metadata. Committed to the catalog branch at `registry/{org}/{repo}.json`.

---

## S

**Schedule**
The cron expression that determines when Scorecards automatically runs (e.g., `0 0 * * *` for daily at midnight UTC).

**Score**
A percentage (0-100%) representing the proportion of possible quality points earned. Calculated as: (Points Earned / Total Possible Points) × 100.

**Scorecard**
A complete quality assessment for a service, including all check results, score, rank, and metadata.

**Service**
A repository that has Scorecards installed and is being measured for quality.

**Service Team**
The team responsible for a specific service repository, as opposed to the platform team managing Scorecards infrastructure.

**Silver Rank**
A moderate quality rank awarded to services scoring 50-74%. Indicates basic quality standards are met.

**Staleness**
The state of results being outdated because checks have been updated since the service last ran. Indicated by checks hash mismatch.

**Stale Indicator**
A visual marker (usually yellow/orange) in the catalog UI showing that a service's results are stale and should be refreshed.

---

## T

**Test Coverage**
The percentage of code lines/branches exercised by tests. Checked by the "Test Coverage" check (typically requires >80%).

**Timestamp**
The date and time when checks last ran for a service. Displayed in the catalog UI and stored in the results file.

**Token Permissions**
The scopes granted to a Personal Access Token. Scorecards requires `repo` scope (or `public_repo` for public-only repos).

**Trigger**
The event that causes a workflow to run (e.g., push, schedule, workflow_dispatch).

---

## W

**Weight**
The point value assigned to a check, indicating its importance. Higher weight = more impact on score. Defined in `metadata.json`.

**Workflow**
A GitHub Actions YAML file that defines when and how jobs run. Scorecards uses multiple workflows:
- Service workflow (`.github/workflows/scorecards.yml`) - Runs checks
- Installation workflow (`create-installation-pr.yml`) - Installs Scorecards on services
- Trigger workflow (`trigger-service-workflow.yml`) - Bulk triggers service workflows
- Consolidation workflow (`consolidate-registry.yml`) - Builds consolidated registry
- Others (update checks hash, cleanup, etc.)

**Workflow Dispatch**
A manual trigger mechanism allowing workflows to be run on-demand via the GitHub UI or CLI (`gh workflow run`).

---

## Related Documentation

- [Configuration Reference](configuration.md) - Detailed configuration options
- [Action Reference](action-reference.md) - Action inputs and outputs
- [Workflows Reference](workflows.md) - All system workflows
- [Architecture Overview](../architecture/overview.md) - System architecture

---

## Contributing to This Glossary

If you encounter an undefined term in the documentation:
1. Add it to this glossary
2. Provide a clear, concise definition
3. Link to related documentation where appropriate
4. Submit a PR with your addition

Keep definitions:
- **Concise** - 1-3 sentences
- **Clear** - Avoid jargon in definitions
- **Accurate** - Match actual implementation
- **Helpful** - Provide context for understanding
```

**Instructions:**
- Place in documentation/reference/ directory
- Link from all documentation files where domain terms are introduced
- Update documentation/reference/README.md to include glossary
- Keep alphabetically organized
- Update as new terms are introduced to the system

---

## Additional Updates Required

### Update Main README.md

Add links to the new documentation in the main README.md:

**Add after "Documentation" section:**

```markdown
## Documentation

### 📚 Getting Started
- [Tutorial: Your First Scorecard](documentation/guides/tutorial-first-scorecard.md) - 15-minute hands-on tutorial
- [FAQ](FAQ.md) - Frequently asked questions
- [Troubleshooting Guide](documentation/guides/troubleshooting-guide.md) - Fix common issues

### 📖 Guides
- [Platform Installation](documentation/guides/platform-installation.md)
- [Service Installation](documentation/guides/service-installation.md)
- [Check Development](documentation/guides/check-development-guide.md)

### 📋 Reference
- [Configuration](documentation/reference/configuration.md)
- [Glossary](documentation/reference/glossary.md)
- [Action Reference](documentation/reference/action-reference.md)
- [Token Requirements](documentation/reference/token-requirements.md)
- [Workflows](documentation/reference/workflows.md)

### 🏗️ Architecture
- [System Overview](documentation/architecture/overview.md)
- [Catalog UI](documentation/architecture/catalog-ui.md)

### 📝 Project
- [CHANGELOG](CHANGELOG.md) - Version history
- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
```

### Update documentation/guides/README.md

Add the new guides to the guides index:

```markdown
# Guides

This directory contains how-to guides for using Scorecards.

## Available Guides

- **[Tutorial: Your First Scorecard](tutorial-first-scorecard.md)** - 15-minute hands-on tutorial for first-time users
- **[Platform Installation](platform-installation.md)** - Setting up Scorecards for your organization
- **[Service Installation](service-installation.md)** - Adding Scorecards to service repositories
- **[Check Development](check-development-guide.md)** - Creating custom quality checks
- **[Troubleshooting](troubleshooting-guide.md)** - Diagnosing and fixing common issues
```

### Update documentation/reference/README.md

Add the glossary to the reference index:

```markdown
# Reference Documentation

This directory contains reference documentation for Scorecards.

## Available References

- **[Configuration](configuration.md)** - Complete configuration schema and options
- **[Glossary](glossary.md)** - Definitions of domain-specific terms
- **[Action Reference](action-reference.md)** - GitHub Action inputs and outputs
- **[Token Requirements](token-requirements.md)** - Authentication and permissions
- **[Workflows](workflows.md)** - System workflow reference
```

---

## Testing Checklist

Before submitting the PR, verify:

### Documentation Quality
- [ ] All links work and point to correct locations
- [ ] Code examples are syntactically correct
- [ ] Placeholders (YOUR-ORG, YOUR-USERNAME) are clearly marked
- [ ] Formatting is consistent (headings, code blocks, lists)
- [ ] No spelling or grammar errors

### Completeness
- [ ] CHANGELOG.md created with initial version
- [ ] FAQ.md covers common questions
- [ ] Troubleshooting guide has diagnostic steps
- [ ] Tutorial is complete and tested
- [ ] Glossary defines all key terms
- [ ] README.md links to new documents
- [ ] Index files updated

### Accuracy
- [ ] Instructions match actual system behavior
- [ ] Commands tested and work correctly
- [ ] Paths and file locations are accurate
- [ ] Token requirements are correct

### User Experience
- [ ] Tutorial can be followed by a beginner
- [ ] FAQ answers are helpful and complete
- [ ] Troubleshooting steps are actionable
- [ ] Glossary definitions are clear

---

## PR Description Template

When creating the PR, use this description:

```markdown
## Phase 1: User-Facing Documentation Improvements

This PR adds critical user-facing documentation to improve the onboarding and support experience for Scorecards users.

### Added
- **CHANGELOG.md** - Version history tracking (following keepachangelog.com format)
- **FAQ.md** - 30+ frequently asked questions with detailed answers
- **documentation/guides/troubleshooting-guide.md** - Comprehensive troubleshooting guide with diagnostic steps
- **documentation/guides/tutorial-first-scorecard.md** - 15-minute hands-on tutorial for new users
- **documentation/reference/glossary.md** - Definitions of 50+ domain-specific terms

### Changed
- **README.md** - Added links to new documentation in organized structure
- **documentation/guides/README.md** - Updated index with new guides
- **documentation/reference/README.md** - Updated index with glossary

### Benefits
- New users can get started with the tutorial instead of jumping into complex guides
- Common questions answered without needing to search through documentation
- Issues can be diagnosed and fixed faster with troubleshooting guide
- Domain terms are clearly defined, reducing confusion
- Project changes tracked for users and maintainers

### Testing
- [ ] All internal links verified
- [ ] All commands tested
- [ ] Tutorial walkthrough completed successfully
- [ ] FAQ answers reviewed for accuracy
- [ ] Glossary definitions validated

### Documentation Quality Score
Before: 78/100
After: 88/100 (+10 points)

Closes #XXX (if there's a related issue)
```

---

## Success Metrics

After merging, track:
- **Issue reduction** - Fewer "how do I" questions in issues
- **Installation success** - Fewer installation-related issues
- **User feedback** - Comments on tutorial and documentation
- **Page views** - Analytics on new documentation pages (if available)

---

## Notes for Implementation

- Replace all instances of `your-org`, `YOUR-ORG`, `your-username`, `YOUR-USERNAME` with actual placeholders or instructions to replace them
- Consider adding screenshots to the tutorial (optional, can be done in a follow-up PR)
- Keep FAQ and troubleshooting guide updated based on actual user issues
- Update CHANGELOG.md with each release
- Translate documentation if supporting multiple languages (future work)

---

## Estimated Time

- CHANGELOG.md creation: 30 minutes
- FAQ.md creation: 2 hours
- Troubleshooting guide creation: 3 hours
- Tutorial creation: 2 hours
- Glossary creation: 1.5 hours
- Updates to existing files: 30 minutes
- Testing and review: 30 minutes

**Total: ~10 hours**

---

This completes Phase 1. The documentation provides a solid foundation for user support and significantly improves the onboarding experience.
