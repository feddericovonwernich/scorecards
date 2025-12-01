#!/bin/bash
# Results reporting and JSON generation
set -euo pipefail

# Build complete results JSON
build_results_json() {
    # Accept context arrays
    local -n svc_ref=$1
    local -n scr_ref=$2
    local timestamp="$3"
    local contributors_json="$4"
    local checks_json="$5"
    local links_json="${6:-"[]"}"
    local openapi_json="${7:-null}"
    local excluded_checks_json="${8:-"[]"}"

    # Extract values
    local service_org="${svc_ref[org]}"
    local service_repo="${svc_ref[repo]}"
    local service_name="${svc_ref[name]}"
    local team_name="${svc_ref[team]}"
    local team_all="${svc_ref[team_all]:-"[]"}"
    local team_source="${svc_ref[team_source]:-none}"
    local team_discovered_at="${svc_ref[team_discovered_at]:-}"

    local score="${scr_ref[score]}"
    local rank="${scr_ref[rank]}"
    local passed_checks="${scr_ref[passed_checks]}"
    local total_checks="${scr_ref[total_checks]}"
    local excluded_count="${scr_ref[excluded_count]:-0}"
    local checks_hash="${scr_ref[checks_hash]}"
    local checks_count="${scr_ref[checks_count]}"
    local installed="${scr_ref[installed]}"

    log_debug "[build_results_json] Extracted values:" >&2
    log_debug "  score=[$score], rank=[$rank]" >&2
    log_debug "  passed_checks=[$passed_checks], total_checks=[$total_checks]" >&2
    log_debug "  excluded_count=[$excluded_count]" >&2
    log_debug "  checks_hash=[$checks_hash]" >&2
    log_debug "  checks_count=[$checks_count] (length: ${#checks_count})" >&2
    log_debug "  installed=[$installed]" >&2
    log_debug "  contributors_json length: ${#contributors_json}" >&2
    log_debug "  checks_json length: ${#checks_json}" >&2
    log_debug "  links_json length: ${#links_json}" >&2
    log_debug "  openapi_json length: ${#openapi_json}" >&2
    log_debug "  excluded_checks_json length: ${#excluded_checks_json}" >&2

    # Build the complete results JSON
    # Note: team is now an object with primary, all, source, last_discovered
    jq -n \
        --arg service_org "$service_org" \
        --arg service_repo "$service_repo" \
        --arg service_name "$service_name" \
        --arg team_primary "$team_name" \
        --argjson team_all "$team_all" \
        --arg team_source "$team_source" \
        --arg team_discovered_at "$team_discovered_at" \
        --argjson score "$score" \
        --arg rank "$rank" \
        --argjson passed_checks "$passed_checks" \
        --argjson total_checks "$total_checks" \
        --argjson excluded_count "$excluded_count" \
        --argjson excluded_checks "$excluded_checks_json" \
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
                team: (if $team_primary != "" then {
                    primary: $team_primary,
                    all: $team_all,
                    source: $team_source,
                    last_discovered: (if $team_discovered_at != "" then $team_discovered_at else null end)
                } else null end),
                links: $links,
                openapi: (if $openapi != null then $openapi else null end)
            },
            score: $score,
            rank: $rank,
            passed_checks: $passed_checks,
            total_checks: $total_checks,
            excluded_count: $excluded_count,
            excluded_checks: $excluded_checks,
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
