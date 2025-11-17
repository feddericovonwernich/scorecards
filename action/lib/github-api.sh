#!/bin/bash
# GitHub API operations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Get PR information from GitHub
get_pr_info() {
    local org="$1"
    local repo="$2"
    local github_token="$3"

    if [ -z "$org" ] || [ -z "$repo" ] || [ -z "$github_token" ]; then
        log_error "get_pr_info requires org, repo, and token"
        return 1
    fi

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

    if [ -z "$org" ] || [ -z "$repo" ] || [ -z "$github_token" ]; then
        log_error "get_default_branch requires org, repo, and token"
        return 1
    fi

    log_info "Fetching default branch for $org/$repo"

    export GH_TOKEN="$github_token"

    local default_branch=$(gh api "/repos/$org/$repo" \
        --jq '.default_branch' 2>/dev/null || echo "main")

    echo "$default_branch"
}

# Extract PR number from PR data JSON
extract_pr_number() {
    local pr_data="$1"

    if [ -z "$pr_data" ] || [ "$pr_data" = "[]" ]; then
        return 1
    fi

    echo "$pr_data" | jq -r '.[0].number // empty'
}

# Extract PR state from PR data JSON
extract_pr_state() {
    local pr_data="$1"

    if [ -z "$pr_data" ] || [ "$pr_data" = "[]" ]; then
        return 1
    fi

    echo "$pr_data" | jq -r '.[0].state // empty'
}

# Extract PR URL from PR data JSON
extract_pr_url() {
    local pr_data="$1"

    if [ -z "$pr_data" ] || [ "$pr_data" = "[]" ]; then
        return 1
    fi

    echo "$pr_data" | jq -r '.[0].url // empty'
}
