#!/bin/bash
# Results reporting and JSON generation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Build complete results JSON
build_results_json() {
    local service_org="$1"
    local service_repo="$2"
    local service_name="$3"
    local team_name="$4"
    local score="$5"
    local rank="$6"
    local passed_checks="$7"
    local total_checks="$8"
    local timestamp="$9"
    local checks_hash="${10}"
    local checks_count="${11}"
    local installed="${12}"
    local contributors_json="${13}"
    local checks_json="${14}"
    local links_json="${15:-[]}"
    local openapi_json="${16:-null}"

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
