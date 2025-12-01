#!/bin/bash
set -euo pipefail

# Scorecards Trigger Script
# Triggers scorecard workflows on all test repositories

WORKSPACE_DIR="/home/fedderico/Repos/scorecards-workspace"

# Test repositories to trigger
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
echo "Scorecards Trigger Script"
echo "=========================================="
echo ""
echo "This will trigger scorecard workflows on ${#TEST_REPOS[@]} test repositories."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Triggering workflows..."
echo ""

TRIGGERED=0
FAILED=0
declare -a WORKFLOW_URLS

for repo in "${TEST_REPOS[@]}"; do
    REPO_PATH="$WORKSPACE_DIR/$repo"

    if [ ! -d "$REPO_PATH" ]; then
        echo "⚠️  $repo - Repository not found"
        ((FAILED++))
        continue
    fi

    cd "$REPO_PATH"

    # Check if ci.yml exists
    if [ ! -f ".github/workflows/ci.yml" ]; then
        echo "⚠️  $repo - No ci.yml workflow found"
        ((FAILED++))
        continue
    fi

    # Get the repository owner/name for constructing URLs
    REPO_FULL_NAME=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)

    # Trigger the workflow
    if gh workflow run ci.yml 2>/dev/null; then
        echo "✓  $repo - Workflow triggered"
        ((TRIGGERED++))

        # Wait a moment for the run to be created
        sleep 2

        # Get the most recent workflow run URL
        RUN_URL=$(gh run list --workflow=ci.yml --limit=1 --json url -q '.[0].url' 2>/dev/null)
        if [ -n "$RUN_URL" ]; then
            WORKFLOW_URLS+=("$repo: $RUN_URL")
        else
            WORKFLOW_URLS+=("$repo: https://github.com/$REPO_FULL_NAME/actions")
        fi
    else
        echo "✗  $repo - Failed to trigger workflow"
        ((FAILED++))
    fi
done

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo "✓ $TRIGGERED workflows triggered successfully"
echo "✗ $FAILED repositories failed or skipped"
echo ""

if [ ${#WORKFLOW_URLS[@]} -gt 0 ]; then
    echo "Workflow run links:"
    for url_entry in "${WORKFLOW_URLS[@]}"; do
        echo "  $url_entry"
    done
    echo ""
fi

echo "View catalog at:"
echo "  https://feddericovonwernich-org.github.io/scorecards/"
echo ""
echo "Wait a few minutes for workflows to complete, then check the catalog."
echo ""
