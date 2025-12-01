#!/bin/bash
# Reusable jq transformations for building JSON objects
set -euo pipefail

# Base jq filter for registry entries (without installation_pr)
# Used by build_registry_entry() in git-ops.sh
# shellcheck disable=SC2034
JQ_REGISTRY_BASE_FILTER='{
    org: $org,
    repo: $repo,
    name: $name,
    team: (if $team_primary != "" then {
        primary: $team_primary,
        all: $team_all,
        source: $team_source,
        last_discovered: (if $team_discovered_at != "" then $team_discovered_at else null end),
        github_org: (if $team_github_org != "" then $team_github_org else null end),
        github_slug: (if $team_github_slug != "" then $team_github_slug else null end)
    } else null end),
    score: $score,
    rank: $rank,
    last_updated: $timestamp,
    has_api: $has_api,
    checks_hash: $checks_hash,
    checks_count: $checks_count,
    check_results: $check_results,
    excluded_checks: $excluded_checks,
    installed: $installed,
    default_branch: $default_branch
}'

# PR portion to add to base filter when PR info is available
# shellcheck disable=SC2034
JQ_REGISTRY_PR_PORTION=',
    installation_pr: {
        number: $pr_number,
        state: $pr_state,
        url: $pr_url
    }'

# Build check result JSON
# Usage: build_check_result_json "$id" "$name" "$passed" "$status" "$message" "$weight" "$details"
build_check_result_json() {
    local id="$1"
    local name="$2"
    local passed="$3"
    local status="$4"
    local message="$5"
    local weight="$6"
    local details="${7:-}"

    jq -n \
        --arg id "$id" \
        --arg name "$name" \
        --argjson passed "$passed" \
        --arg status "$status" \
        --arg message "$message" \
        --argjson weight "$weight" \
        --arg details "$details" \
        '{
            id: $id,
            name: $name,
            passed: $passed,
            status: $status,
            message: $message,
            weight: $weight,
            details: (if $details != "" then $details else null end)
        }'
}

# Build checks metadata JSON
# Usage: build_checks_metadata_json "$checks_hash" "$checks_count"
build_checks_metadata_json() {
    local checks_hash="$1"
    local checks_count="$2"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    jq -n \
        --arg checks_hash "$checks_hash" \
        --argjson checks_count "$checks_count" \
        --arg timestamp "$timestamp" \
        '{
            checks_hash: $checks_hash,
            checks_count: $checks_count,
            last_updated: $timestamp
        }'
}
