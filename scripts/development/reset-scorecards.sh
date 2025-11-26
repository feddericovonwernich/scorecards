#!/bin/bash

# Scorecards Reset Script
# Clears catalog branch and removes installed scorecard files from test repos
# Preserves the installation-invoking CI workflows

WORKSPACE_DIR="/home/fedderico/Repos/scorecards-workspace"
SCORECARDS_REPO="$WORKSPACE_DIR/scorecards"

# Test repositories to clean
TEST_REPOS=(
    "test-repo-perfect"
    "test-repo-minimal"
    "test-repo-no-docs"
    "test-repo-python"
    "test-repo-javascript"
    "test-repo-edge-cases"
    "test-repo-empty"
    "test-repo-install-test"
)

echo "=========================================="
echo "Scorecards System Reset Script"
echo "=========================================="
echo ""
echo "This script will:"
echo "  1. Clear the scorecards catalog branch (registry, results, badges)"
echo "  2. Close installation PRs in test repositories"
echo "  3. Delete installation branches in test repositories"
echo "  4. Remove scorecards.yml from test repositories"
echo "  5. Remove .scorecard/ directories from test repositories"
echo "  6. Keep ci.yml workflows (installation invokers)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# ============================================================================
# 1. RESET SCORECARDS CATALOG BRANCH
# ============================================================================

echo ""
echo "=========================================="
echo "Step 1: Resetting Scorecards Catalog"
echo "=========================================="

cd "$SCORECARDS_REPO"

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "Warning: Not on main branch (current: $CURRENT_BRANCH)"
    echo "Switching to main..."
    git checkout main
fi

# Fetch latest
echo "Fetching latest from origin..."
git fetch origin

# Switch to catalog branch
echo "Switching to catalog branch..."
git checkout catalog
git pull origin catalog

# Count files before deletion
REGISTRY_COUNT=$(find registry -type f 2>/dev/null | wc -l)
RESULTS_COUNT=$(find results -type f 2>/dev/null | wc -l)
BADGES_COUNT=$(find badges -type f 2>/dev/null | wc -l)

echo ""
echo "Found:"
echo "  - $REGISTRY_COUNT registry files"
echo "  - $RESULTS_COUNT result files"
echo "  - $BADGES_COUNT badge files"

# Delete catalog content
echo ""
echo "Deleting catalog content..."

if [ -d "registry" ]; then
    echo "  - Removing registry/"
    rm -rf registry/*
    echo "  - Creating empty all-services.json"
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    cat > registry/all-services.json <<EOF
{
  "services": [],
  "generated_at": "$TIMESTAMP",
  "count": 0
}
EOF
fi

if [ -d "results" ]; then
    echo "  - Removing results/"
    rm -rf results/*
fi

if [ -d "badges" ]; then
    echo "  - Removing badges/"
    rm -rf badges/*
fi

if [ -f "current-checks.json" ]; then
    echo "  - Removing current-checks.json"
    rm -f current-checks.json
fi

# Commit changes to catalog branch
echo ""
echo "Committing changes to catalog branch..."
git add -A
if git diff --staged --quiet; then
    echo "No changes to commit (catalog already clean)"
else
    git commit -m "chore: Reset catalog for fresh test run

Removed all registry, results, and badges to enable clean installation testing."

    echo "Pushing to origin/catalog..."
    git push origin catalog
    echo "✓ Catalog branch reset complete"
fi

# Switch back to main
echo ""
echo "Switching back to main branch..."
git checkout main

# ============================================================================
# 2. CLEAN TEST REPOSITORIES
# ============================================================================

echo ""
echo "=========================================="
echo "Step 2: Cleaning Test Repositories"
echo "=========================================="

CLEANED_REPOS=0
SKIPPED_REPOS=0

for repo in "${TEST_REPOS[@]}"; do
    echo ""
    echo "Processing $repo..."

    REPO_PATH="$WORKSPACE_DIR/$repo"

    if [ ! -d "$REPO_PATH" ]; then
        echo "  ⚠️  Repository not found: $REPO_PATH"
        ((SKIPPED_REPOS++))
        continue
    fi

    cd "$REPO_PATH"

    # Check if it's a git repo
    if [ ! -d ".git" ]; then
        echo "  ⚠️  Not a git repository"
        ((SKIPPED_REPOS++))
        continue
    fi

    # Fetch and hard reset to latest remote state
    echo "  - Syncing with remote..."
    git fetch origin >/dev/null 2>&1 || true

    # Get current branch
    CURRENT_BRANCH=$(git branch --show-current)

    # Hard reset to ensure we have exact remote state (including deleted files)
    git reset --hard origin/"$CURRENT_BRANCH" >/dev/null 2>&1 || true

    CHANGES_MADE=false

    # Close installation PRs
    echo "  - Checking for installation PRs..."
    PR_NUMBERS=$(gh pr list --state open --search "head:scorecards-install" --json number --jq '.[].number' 2>/dev/null || true)
    if [ -n "$PR_NUMBERS" ]; then
        while IFS= read -r pr_num; do
            echo "    • Closing PR #$pr_num"
            gh pr close "$pr_num" --comment "Closing for scorecards reset" 2>/dev/null || echo "      ⚠️  Failed to close PR #$pr_num"
        done <<< "$PR_NUMBERS"
    else
        echo "    ✓ No open installation PRs found"
    fi

    # Delete local installation branches
    echo "  - Checking for local installation branches..."
    LOCAL_BRANCHES=$(git branch --list "scorecards-install*" | sed 's/^[* ]*//' || true)
    if [ -n "$LOCAL_BRANCHES" ]; then
        # Switch to main/master first to avoid deleting current branch
        CURRENT_BRANCH=$(git branch --show-current)
        if [[ "$CURRENT_BRANCH" == scorecards-install* ]]; then
            DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")
            echo "    • Switching to $DEFAULT_BRANCH (currently on installation branch)"
            git checkout "$DEFAULT_BRANCH" 2>/dev/null || git checkout main 2>/dev/null || git checkout master 2>/dev/null || true
        fi

        while IFS= read -r branch; do
            [ -z "$branch" ] && continue
            echo "    • Deleting local branch: $branch"
            git branch -D "$branch" 2>/dev/null || echo "      ⚠️  Failed to delete local branch: $branch"
        done <<< "$LOCAL_BRANCHES"
    else
        echo "    ✓ No local installation branches found"
    fi

    # Delete remote installation branches
    echo "  - Checking for remote installation branches..."
    REMOTE_BRANCHES=$(git branch -r --list "origin/scorecards-install*" | sed 's|origin/||' | sed 's/^[* ]*//' || true)
    if [ -n "$REMOTE_BRANCHES" ]; then
        while IFS= read -r branch; do
            [ -z "$branch" ] && continue
            echo "    • Deleting remote branch: origin/$branch"
            git push origin --delete "$branch" 2>/dev/null || echo "      ⚠️  Failed to delete remote branch: $branch"
        done <<< "$REMOTE_BRANCHES"
    else
        echo "    ✓ No remote installation branches found"
    fi

    # Remove scorecards.yml if it exists
    if [ -f ".github/workflows/scorecards.yml" ]; then
        echo "  - Removing .github/workflows/scorecards.yml"
        rm -f .github/workflows/scorecards.yml
        CHANGES_MADE=true
    fi

    # Remove .scorecard directory if it exists
    if [ -d ".scorecard" ]; then
        echo "  - Removing .scorecard/ directory"
        rm -rf .scorecard
        CHANGES_MADE=true
    fi

    # Commit and push if changes were made
    if [ "$CHANGES_MADE" = true ]; then
        git add -A

        if git diff --staged --quiet; then
            echo "  ℹ️  No changes to commit"
        else
            git commit -m "chore: Remove installed scorecard files for reset

Removed scorecards.yml and .scorecard/ directory to enable fresh installation."

            # Get current branch
            BRANCH=$(git branch --show-current)
            echo "  - Pushing to origin/$BRANCH..."
            git push origin "$BRANCH"

            echo "  ✓ Cleaned and pushed"
            ((CLEANED_REPOS++))
        fi
    else
        echo "  ✓ Already clean (no scorecards files found)"
        ((SKIPPED_REPOS++))
    fi
done

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo "=========================================="
echo "Reset Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✓ Catalog branch cleared"
echo "  ✓ Installation PRs closed"
echo "  ✓ Installation branches deleted (local and remote)"
echo "  ✓ $CLEANED_REPOS repositories cleaned and pushed"
echo "  - $SKIPPED_REPOS repositories skipped (already clean or missing)"
echo ""
echo "Test repositories still have their ci.yml workflows intact."
echo "Run 'gh workflow run ci.yml' in each test repo to trigger fresh installations."
echo ""
echo "Or use this command to trigger all at once:"
echo ""
echo "  for repo in test-repo-*; do"
echo "    cd $WORKSPACE_DIR/\$repo && gh workflow run ci.yml"
echo "  done"
echo ""
