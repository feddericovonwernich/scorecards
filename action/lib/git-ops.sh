#!/bin/bash
# Git operations with smart retry logic

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Clone repository with retry
git_clone_with_retry() {
    local repo_url="$1"
    local target_dir="$2"
    local branch="$3"
    local log_file="${4:-/tmp/git-clone.log}"

    log_info "Cloning repository: $repo_url (branch: $branch)"

    if git clone -b "$branch" "$repo_url" "$target_dir" > "$log_file" 2>&1; then
        log_success "Repository cloned successfully"
        return 0
    else
        log_error "Failed to clone repository"
        cat "$log_file"
        return 1
    fi
}

# Configure git user in repository
git_configure_user() {
    local repo_path="$1"
    local user_name="${2:-scorecard-bot}"
    local user_email="${3:-scorecard-bot@users.noreply.github.com}"

    cd "$repo_path" || return 1

    git config user.name "$user_name"
    git config user.email "$user_email"
}

# Check if there are meaningful changes (excluding timestamp fields)
check_meaningful_changes() {
    local old_file="$1"
    local new_file="$2"

    if [ ! -f "$old_file" ]; then
        # No old file means this is a new entry
        return 0
    fi

    # Define filter once (extracts meaningful fields excluding timestamp, commit_sha, stdout, stderr, duration)
    local jq_filter='{
        score: .score,
        rank: .rank,
        passed_checks: .passed_checks,
        total_checks: .total_checks,
        checks_hash: .checks_hash,
        checks_count: .checks_count,
        installed: .installed,
        recent_contributors: .recent_contributors,
        service: {
            name: .service.name,
            team: .service.team,
            links: .service.links,
            openapi: .service.openapi
        },
        checks: [.checks[] | {
            check_id: .check_id,
            status: .status,
            exit_code: .exit_code
        }]
    }'

    # Apply filter to both files
    local old_summary=$(jq -S "$jq_filter" "$old_file" 2>/dev/null)
    local new_summary=$(jq -S "$jq_filter" "$new_file" 2>/dev/null)

    if [ "$old_summary" = "$new_summary" ]; then
        return 1  # No meaningful changes
    else
        return 0  # Has meaningful changes
    fi
}

# Build registry entry JSON
build_registry_entry() {
    # Accept context arrays
    local -n svc=$1
    local -n scr=$2
    local -n prs=$3
    local timestamp="$4"

    # Extract values
    local org="${svc[org]}"
    local repo="${svc[repo]}"
    local name="${svc[name]}"
    local team="${svc[team]}"
    local has_api="${svc[has_api]}"
    local default_branch="${svc[default_branch]}"

    local score="${scr[score]}"
    local rank="${scr[rank]}"
    local checks_hash="${scr[checks_hash]}"
    local checks_count="${scr[checks_count]}"
    local installed="${scr[installed]}"

    local pr_number="${prs[number]}"
    local pr_state="${prs[state]}"
    local pr_url="${prs[url]}"

    local jq_args=(
        -n
        --arg org "$org"
        --arg repo "$repo"
        --arg name "$name"
        --arg team "$team"
        --argjson score "$score"
        --arg rank "$rank"
        --arg timestamp "$timestamp"
        --argjson has_api "$has_api"
        --arg checks_hash "$checks_hash"
        --argjson checks_count "$checks_count"
        --argjson installed "$installed"
        --arg default_branch "$default_branch"
    )

    local jq_filter
    if [ -n "$pr_number" ] && [ -n "$pr_state" ] && [ -n "$pr_url" ]; then
        jq_args+=(
            --argjson pr_number "$pr_number"
            --arg pr_state "$pr_state"
            --arg pr_url "$pr_url"
        )
        jq_filter='{
            org: $org,
            repo: $repo,
            name: $name,
            team: $team,
            score: $score,
            rank: $rank,
            last_updated: $timestamp,
            has_api: $has_api,
            checks_hash: $checks_hash,
            checks_count: $checks_count,
            installed: $installed,
            default_branch: $default_branch,
            installation_pr: {
                number: $pr_number,
                state: $pr_state,
                url: $pr_url
            }
        }'
    else
        jq_filter='{
            org: $org,
            repo: $repo,
            name: $name,
            team: $team,
            score: $score,
            rank: $rank,
            last_updated: $timestamp,
            has_api: $has_api,
            checks_hash: $checks_hash,
            checks_count: $checks_count,
            installed: $installed,
            default_branch: $default_branch
        }'
    fi

    jq "${jq_args[@]}" "$jq_filter"
}

# Push with smart retry (handles concurrent pushes)
git_push_with_smart_retry() {
    local repo_path="$1"
    local branch="$2"
    local registry_file="$3"
    local work_dir="$4"
    local -n svc=$5
    local -n scr=$6
    local -n prs=$7
    local timestamp="$8"

    cd "$repo_path" || return 1

    local max_retries=10
    local retry_count=0
    local push_success=false

    while [ $retry_count -lt $max_retries ]; do
        if git push origin "$branch" > "$work_dir/git-push.log" 2>&1; then
            log_success "Results committed to central repository"
            push_success=true
            break
        else
            retry_count=$((retry_count + 1))

            if [ $retry_count -lt $max_retries ]; then
                log_warning "Push failed (attempt $retry_count/$max_retries)"

                # Fetch latest changes and rebase
                log_info "Fetching latest changes and rebasing..."
                git fetch origin "$branch"

                if git rebase "origin/$branch" > "$work_dir/git-rebase.log" 2>&1; then
                    # Rebase successful - regenerate registry file
                    log_info "Rebase successful, regenerating registry entry..."

                    build_registry_entry svc scr prs "$timestamp" > "$registry_file"

                    git add "$registry_file"
                    git commit --amend --no-edit

                    # Progressive exponential backoff with jitter
                    local base_backoff=$((5 + retry_count * 5))
                    local jitter=$((RANDOM % 6))
                    local backoff=$((base_backoff + jitter))
                    log_info "Retrying in ${backoff}s (attempt $((retry_count + 1))/$max_retries)..."
                    sleep $backoff
                else
                    log_warning "Rebase failed"
                    cat "$work_dir/git-rebase.log"
                    break
                fi
            fi
        fi
    done

    if [ "$push_success" = "false" ]; then
        log_warning "Failed to push after $max_retries attempts"
        cat "$work_dir/git-push.log"
        return 1
    fi

    return 0
}

# Simple push (no retry)
git_push_simple() {
    local repo_path="$1"
    local branch="$2"
    local log_file="${3:-/tmp/git-push.log}"

    cd "$repo_path" || return 1

    if git push origin "$branch" > "$log_file" 2>&1; then
        log_success "Pushed successfully"
        return 0
    else
        log_warning "Push failed"
        cat "$log_file"
        return 1
    fi
}

# Complete catalog update workflow
update_catalog() {
    # Accept 5 context arrays instead of 23 individual parameters
    local -n svc=$1
    local -n scr=$2
    local -n rpo=$3
    local -n prs=$4
    local -n pth=$5

    # Extract individual values from context arrays
    local service_org="${svc[org]}"
    local service_repo="${svc[repo]}"
    local service_name="${svc[name]}"
    local team_name="${svc[team]}"
    local has_api="${svc[has_api]}"
    local default_branch="${svc[default_branch]}"

    local score="${scr[score]}"
    local rank="${scr[rank]}"
    local passed_checks="${scr[passed_checks]}"
    local total_checks="${scr[total_checks]}"
    local checks_hash="${scr[checks_hash]}"
    local checks_count="${scr[checks_count]}"
    local installed="${scr[installed]}"

    local github_token="${rpo[github_token]}"
    local scorecards_repo="${rpo[scorecards_repo]}"
    local scorecards_branch="${rpo[scorecards_branch]}"

    local pr_number="${prs[number]}"
    local pr_state="${prs[state]}"
    local pr_url="${prs[url]}"

    local output_dir="${pth[output_dir]}"
    local score_badge_file="${pth[score_badge]}"
    local rank_badge_file="${pth[rank_badge]}"
    local work_dir="${pth[work_dir]}"

    local timestamp=$(get_iso_timestamp)
    local central_repo_dir="$work_dir/central-repo"
    local repo_url="https://x-access-token:${github_token}@github.com/${scorecards_repo}.git"

    log_info "Committing results to central repository..."
    log_info "Central repo: $scorecards_repo"

    # Clone central repo
    if ! git_clone_with_retry "$repo_url" "$central_repo_dir" "$scorecards_branch" "$work_dir/git-clone.log"; then
        log_warning "Failed to clone central repository"
        log_info "Results will not be stored centrally"
        return 1
    fi

    cd "$central_repo_dir" || return 1
    git_configure_user "$central_repo_dir"

    # Create directories
    mkdir -p "results/$service_org/$service_repo"
    mkdir -p "badges/$service_org/$service_repo"
    mkdir -p "registry/$service_org"

    # Check if results have meaningfully changed
    local skip_commit=false
    local old_results_file="results/$service_org/$service_repo/results.json"
    local old_registry_file="registry/$service_org/$service_repo.json"

    # Always commit if registry file doesn't exist (migration case)
    if [ ! -f "$old_registry_file" ]; then
        log_info "Registry file doesn't exist in new format - will create it"
        skip_commit=false
    elif check_meaningful_changes "$old_results_file" "$output_dir/final-results.json"; then
        log_info "Changes detected - will update catalog"
        skip_commit=false
    else
        log_warning "No meaningful changes detected - skipping commit"
        skip_commit=true
    fi

    # Check if PR state changed (override skip if it did)
    if [ -n "$pr_number" ] && [ -n "$pr_state" ]; then
        local old_pr_state=$(jq -r '.installation_pr.state // ""' "$old_registry_file" 2>/dev/null || echo "")
        if [ "$old_pr_state" != "$pr_state" ]; then
            log_info "PR state changed: $old_pr_state → $pr_state - forcing catalog update"
            skip_commit=false
        fi
    fi

    # Only update files if there are meaningful changes
    if [ "$skip_commit" = "false" ]; then
        # Copy results and badges
        cp "$output_dir/final-results.json" "results/$service_org/$service_repo/results.json"
        cp "$score_badge_file" "badges/$service_org/$service_repo/score.json"
        cp "$rank_badge_file" "badges/$service_org/$service_repo/rank.json"

        # Build registry entry
        local registry_file="registry/$service_org/$service_repo.json"
        build_registry_entry svc scr prs "$timestamp" > "$registry_file"

        # Commit and push
        git add results/ badges/ registry/

        if git diff --staged --quiet; then
            log_warning "No meaningful changes to commit"
        else
            git commit -m "Update scorecard for $service_org/$service_repo

Score: $score/100
Rank: $rank
Checks: $passed_checks/$total_checks passed

Commit: $(git rev-parse HEAD | head -c 7)"

            # Push with smart retry
            if ! git_push_with_smart_retry "$central_repo_dir" "$scorecards_branch" "$registry_file" "$work_dir" \
                svc scr prs "$timestamp"; then
                log_error "Failed to push catalog updates"
                return 1
            fi
        fi
    fi

    # Update current-checks metadata
    echo "$checks_hash" > "current-checks-hash.txt"
    build_checks_metadata "$checks_hash" "$checks_count" > "current-checks.json"

    git add current-checks.json current-checks-hash.txt

    if ! git diff --staged --quiet; then
        log_info "Check suite changed - committing metadata..."
        git commit -m "Update check suite metadata

Checks hash: $checks_hash
Checks count: $checks_count"

        if ! git_push_simple "$central_repo_dir" "$scorecards_branch" "$work_dir/git-push-checks.log"; then
            log_warning "Failed to push check suite metadata"
        fi
    fi

    log_success "Catalog update complete"
    return 0
}
