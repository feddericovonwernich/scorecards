#!/bin/bash
# Team discovery utilities
# Discovers team ownership from CODEOWNERS files and GitHub Teams API
set -euo pipefail

# Find CODEOWNERS file in standard locations
# Returns: path to CODEOWNERS file or empty string
find_codeowners_file() {
    local repo_path="${1:-.}"

    # Standard CODEOWNERS locations (in priority order)
    local locations=(
        ".github/CODEOWNERS"
        "CODEOWNERS"
        "docs/CODEOWNERS"
    )

    for location in "${locations[@]}"; do
        if [ -f "$repo_path/$location" ]; then
            echo "$repo_path/$location"
            return 0
        fi
    done

    return 1
}

# Extract team references from an owner string
# Input: "@org/team-a @org/team-b @user"
# Output: JSON object with teams and org: {"teams": ["team-a", "team-b"], "org": "org-name"}
extract_teams_from_owners() {
    local owners="$1"

    # Extract @org/team patterns and get the team part
    local teams=()
    local github_org=""

    # Use grep to find all @org/team patterns
    local team_matches
    team_matches=$(echo "$owners" | grep -oE '@[^/[:space:]]+/[^[:space:]]+' || echo "")

    if [ -n "$team_matches" ]; then
        while IFS= read -r match; do
            # Extract org (part between @ and /)
            if [ -z "$github_org" ]; then
                github_org=$(echo "$match" | sed 's/@\([^/]*\)\/.*/\1/')
            fi
            # Extract team slug (part after /)
            local team_slug
            team_slug=$(echo "$match" | sed 's/@[^/]*\///')
            if [ -n "$team_slug" ]; then
                teams+=("$team_slug")
            fi
        done <<< "$team_matches"
    fi

    # If no teams found, try individual users as fallback (no org in this case)
    if [ ${#teams[@]} -eq 0 ]; then
        local user_matches
        user_matches=$(echo "$owners" | grep -oE '@[^[:space:]]+' | grep -v '/' || echo "")

        if [ -n "$user_matches" ]; then
            while IFS= read -r match; do
                local username
                username=$(echo "$match" | sed 's/@//')
                if [ -n "$username" ]; then
                    teams+=("$username")
                fi
            done <<< "$user_matches"
        fi
    fi

    # Output as JSON object with teams array and org
    if [ ${#teams[@]} -eq 0 ]; then
        jq -n '{teams: [], org: null}'
    else
        local teams_json
        teams_json=$(printf '%s\n' "${teams[@]}" | jq -R . | jq -s .)
        jq -n --argjson teams "$teams_json" --arg org "$github_org" \
            '{teams: $teams, org: (if $org == "" then null else $org end)}'
    fi
}

# Parse CODEOWNERS file for root-level ownership
# Returns: JSON object with primary and all teams
parse_codeowners_for_root() {
    local repo_path="$1"

    local codeowners_file
    codeowners_file=$(find_codeowners_file "$repo_path")

    if [ -z "$codeowners_file" ]; then
        log_info "No CODEOWNERS file found" >&2
        echo '{"primary": null, "all": [], "source": "none"}'
        return 1
    fi

    log_info "Found CODEOWNERS at: $codeowners_file" >&2

    local root_owners=""
    local default_owners=""

    # Parse CODEOWNERS file
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip comments and empty lines
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${line// }" ]] && continue

        # Parse pattern and owners
        local pattern
        pattern=$(echo "$line" | awk '{print $1}')
        local owners
        owners=$(echo "$line" | awk '{$1=""; print $0}' | xargs)

        # Skip if no owners
        [ -z "$owners" ] && continue

        # Check for root-level patterns
        case "$pattern" in
            "/" | "/*" | "/." )
                root_owners="$owners"
                ;;
            "*" | "**" | "**/*" )
                # Default/global pattern - lower priority than explicit root
                if [ -z "$default_owners" ]; then
                    default_owners="$owners"
                fi
                ;;
        esac
    done < "$codeowners_file"

    # Prefer explicit root over default
    local final_owners="${root_owners:-$default_owners}"

    if [ -z "$final_owners" ]; then
        log_info "No root-level owners found in CODEOWNERS" >&2
        echo '{"primary": null, "all": [], "source": "codeowners"}'
        return 1
    fi

    log_info "Found owners: $final_owners" >&2

    # Extract teams from owners string
    local extract_result
    extract_result=$(extract_teams_from_owners "$final_owners")

    local all_teams
    all_teams=$(echo "$extract_result" | jq -c '.teams')

    local github_org
    github_org=$(echo "$extract_result" | jq -r '.org // empty')

    local primary_team
    primary_team=$(echo "$extract_result" | jq -r '.teams[0] // empty')

    if [ -z "$primary_team" ]; then
        echo '{"primary": null, "all": [], "source": "codeowners", "github_org": null, "github_slug": null}'
        return 1
    fi

    # github_slug is the primary team slug when org is available
    jq -n \
        --arg primary "$primary_team" \
        --argjson all "$all_teams" \
        --arg org "$github_org" \
        '{
            primary: $primary,
            all: $all,
            source: "codeowners",
            github_org: (if $org == "" then null else $org end),
            github_slug: (if $org == "" then null else $primary end)
        }'
}

# Get teams from GitHub Teams API
# Returns: JSON object with primary and all teams
get_teams_from_github_api() {
    local org="$1"
    local repo="$2"
    local github_token="$3"

    if [ -z "$github_token" ]; then
        log_warning "No GitHub token available for Teams API" >&2
        echo '{"primary": null, "all": [], "source": "none"}'
        return 1
    fi

    export GH_TOKEN="$github_token"

    log_info "Fetching teams for $org/$repo from GitHub API" >&2

    # Fetch teams with repo access
    local teams_json
    teams_json=$(gh api "/repos/$org/$repo/teams" \
        --jq '[.[] | {name: .name, slug: .slug, permission: .permission}]' \
        2>/dev/null || echo "[]")

    if [ "$teams_json" = "[]" ] || [ -z "$teams_json" ]; then
        log_info "No teams found via GitHub API" >&2
        echo '{"primary": null, "all": [], "source": "github_api"}'
        return 1
    fi

    log_info "Found $(echo "$teams_json" | jq 'length') teams via GitHub API" >&2

    # Select primary team based on permission level
    # Priority: admin > maintain > push > triage > pull
    local sorted_teams
    sorted_teams=$(echo "$teams_json" | jq -c '
        sort_by(
            if .permission == "admin" then 0
            elif .permission == "maintain" then 1
            elif .permission == "push" then 2
            elif .permission == "triage" then 3
            else 4 end
        )
    ')

    local primary_team
    primary_team=$(echo "$sorted_teams" | jq -r '.[0].slug // empty')

    local all_teams
    all_teams=$(echo "$sorted_teams" | jq -c '[.[].slug]')

    if [ -z "$primary_team" ]; then
        echo '{"primary": null, "all": [], "source": "github_api", "github_org": null, "github_slug": null}'
        return 1
    fi

    jq -n \
        --arg primary "$primary_team" \
        --argjson all "$all_teams" \
        --arg org "$org" \
        '{
            primary: $primary,
            all: $all,
            source: "github_api",
            github_org: $org,
            github_slug: $primary
        }'
}

# Main team discovery function
# Priority: manual config > CODEOWNERS > GitHub API
# Returns: JSON object with team discovery result
discover_team() {
    local repo_path="$1"
    local org="$2"
    local repo="$3"
    local github_token="$4"
    local manual_team="${5:-}"

    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Priority 1: Manual configuration override
    if [ -n "$manual_team" ]; then
        log_success "Using manual team from config: $manual_team" >&2
        jq -n \
            --arg primary "$manual_team" \
            --arg timestamp "$timestamp" \
            '{
                primary: $primary,
                all: [$primary],
                source: "manual",
                github_org: null,
                github_slug: null,
                last_discovered: $timestamp
            }'
        return 0
    fi

    # Priority 2: CODEOWNERS file
    local codeowners_result
    codeowners_result=$(parse_codeowners_for_root "$repo_path")

    local codeowners_primary
    codeowners_primary=$(echo "$codeowners_result" | jq -r '.primary // empty')

    if [ -n "$codeowners_primary" ]; then
        log_success "Discovered team from CODEOWNERS: $codeowners_primary" >&2
        echo "$codeowners_result" | jq --arg timestamp "$timestamp" '. + {last_discovered: $timestamp}'
        return 0
    fi

    # Priority 3: GitHub Teams API
    local api_result
    api_result=$(get_teams_from_github_api "$org" "$repo" "$github_token")

    local api_primary
    api_primary=$(echo "$api_result" | jq -r '.primary // empty')

    if [ -n "$api_primary" ]; then
        log_success "Discovered team from GitHub API: $api_primary" >&2
        echo "$api_result" | jq --arg timestamp "$timestamp" '. + {last_discovered: $timestamp}'
        return 0
    fi

    # No team discovered
    log_info "No team discovered for $org/$repo" >&2
    jq -n \
        --arg timestamp "$timestamp" \
        '{
            primary: null,
            all: [],
            source: "none",
            github_org: null,
            github_slug: null,
            last_discovered: $timestamp
        }'
}

# Normalize team name to ID (lowercase, replace spaces with hyphens)
normalize_team_id() {
    local team_name="$1"
    echo "$team_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-'
}
