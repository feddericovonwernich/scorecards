#!/bin/bash
# Results reporting and JSON generation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Build complete results JSON
build_results_json() {
    # Accept context arrays
    local -n svc=$1
    local -n scr=$2
    local timestamp="$3"
    local contributors_json="$4"
    local checks_json="$5"
    local links_json="${6:-[]}"
    local openapi_json="${7:-null}"

    # Extract values
    local service_org="${svc[org]}"
    local service_repo="${svc[repo]}"
    local service_name="${svc[name]}"
    local team_name="${svc[team]}"

    local score="${scr[score]}"
    local rank="${scr[rank]}"
    local passed_checks="${scr[passed_checks]}"
    local total_checks="${scr[total_checks]}"
    local checks_hash="${scr[checks_hash]}"
    local checks_count="${scr[checks_count]}"
    local installed="${scr[installed]}"

    log_info "Building final results JSON"

    # Build the complete results JSON
    jq -n \
        --arg service_org "$service_org" \
        --arg service_repo "$service_repo" \
        --arg service_name "$service_name" \
        --arg team "$team_name" \
        --argjson score "$score" \
        --arg rank "$rank" \
        --argjson passed_checks "$passed_checks" \
        --argjson total_checks "$total_checks" \
        --arg timestamp "$timestamp" \
        --arg checks_hash "$checks_hash" \
        --argjson checks_count "$checks_count" \
        --argjson installed "$installed" \
        --argjson recent_contributors "$contributors_json" \
        --argjson checks "$checks_json" \
        --argjson links "$links_json" \
        --argjson openapi "$openapi_json" \
        '{
            service: {
                org: $service_org,
                repo: $service_repo,
                name: $service_name,
                team: $team,
                links: $links,
                openapi: (if $openapi != null then $openapi else null end)
            },
            score: $score,
            rank: $rank,
            passed_checks: $passed_checks,
            total_checks: $total_checks,
            timestamp: $timestamp,
            checks_hash: $checks_hash,
            checks_count: $checks_count,
            installed: $installed,
            recent_contributors: $recent_contributors,
            checks: $checks
        }'
}

# Build checks metadata JSON
build_checks_metadata() {
    local checks_hash="$1"
    local checks_count="$2"

    jq -n \
        --arg hash "$checks_hash" \
        --argjson count "$checks_count" \
        '{
            checks_hash: $hash,
            checks_count: $count,
            generated_at: (now | todate)
        }'
}
