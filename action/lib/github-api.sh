#!/bin/bash
# GitHub API operations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Get PR information from GitHub
get_pr_info() {
    local org="$1"
    local repo="$2"
    local github_token="$3"

    validate_params "get_pr_info" "org" "$org" "repo" "$repo" "token" "$github_token" || return 1

    log_info "Fetching PR info for $org/$repo"

    export GH_TOKEN="$github_token"

    local pr_data=$(gh pr list \
        --repo "$org/$repo" \
        --label "scorecards-install" \
        --state all \
        --json number,state,url \
        --limit 1 2>/dev/null || echo "[]")

    echo "$pr_data"
}

# Get default branch for repository
get_default_branch() {
    local org="$1"
    local repo="$2"
    local github_token="$3"

    validate_params "get_default_branch" "org" "$org" "repo" "$repo" "token" "$github_token" || return 1

    log_info "Fetching default branch for $org/$repo"

    export GH_TOKEN="$github_token"

    local default_branch=$(gh api "/repos/$org/$repo" \
        --jq '.default_branch' 2>/dev/null || echo "main")

    echo "$default_branch"
}

# Extract field from PR data JSON
# Usage: extract_pr_field "$pr_data" "number"
#        extract_pr_field "$pr_data" "state"
#        extract_pr_field "$pr_data" "url"
extract_pr_field() {
    local pr_data="$1"
    local field="$2"

    if [ -z "$pr_data" ] || [ "$pr_data" = "[]" ]; then
        return 1
    fi

    echo "$pr_data" | jq -r ".[0].$field // empty"
}
