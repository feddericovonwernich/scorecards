#!/bin/bash
# Trusted, PR-only executor for deterministic check remediation.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTION_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$ACTION_DIR/lib/common.sh"
source "$ACTION_DIR/lib/config-parser.sh"
source "$ACTION_DIR/lib/remediation.sh"

# Standard sysexits categories preserve rejection reasons across command substitution.
readonly EX_DATAERR=65 EX_TEMPFAIL=75 EX_NOPERM=77

usage() {
    printf 'usage: %s validate REQUEST_JSON POLICY_FILE TRUSTED_SUITE_DIR\n' "$0" >&2
    printf '       %s prepare REQUEST_JSON POLICY_FILE TRUSTED_SUITE_DIR WORK_DIR\n' "$0" >&2
    printf '       %s publish PREPARED_JSON POLICY_FILE WORK_DIR\n' "$0" >&2
    return 2
}

require_regular_file() {
    [ -f "$1" ] && [ ! -L "$1" ]
}

api_default_branch() {
    local repository="$1"
    gh api "/repos/$repository" --jq '.default_branch' | {
        IFS= read -r branch
        [[ "$branch" =~ ^[A-Za-z0-9._/-]+$ ]] || return 1
        printf '%s\n' "$branch"
    }
}

api_branch_sha() {
    local repository="$1"
    local branch="$2"
    gh api "/repos/$repository/git/ref/heads/$branch" --jq '.object.sha' | {
        IFS= read -r sha
        remediation_is_sha "$sha" || return 1
        printf '%s\n' "$sha"
    }
}

request_context() {
    local request_file="$1"
    require_regular_file "$request_file" || return 1
    jq -ce 'select(
        type == "object"
        and (keys == ["check_id", "org", "repo", "request_id", "service_sha", "suite_sha"])
        and (.org | type == "string" and test("^[A-Za-z0-9][A-Za-z0-9._-]*$"))
        and (.repo | type == "string" and test("^[A-Za-z0-9][A-Za-z0-9._-]*$"))
        and (.check_id | type == "string" and test("^[a-z0-9][a-z0-9-]{0,79}$"))
        and (.service_sha | type == "string" and test("^[0-9a-f]{40}$"))
        and (.suite_sha | type == "string" and test("^[0-9a-f]{40}$"))
        and (.request_id | type == "string" and test("^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"))
    )' "$request_file"
}

validate_central_revision() {
    local central_repository="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
    local canonical_repository="${central_repository,,}"
    local expected_ref="${GITHUB_REF:?GITHUB_REF is required}"
    local expected_sha="${GITHUB_SHA:?GITHUB_SHA is required}"
    local default_branch current_sha

    remediation_is_repository "$canonical_repository" || return 1
    remediation_is_sha "$expected_sha" || return 1
    default_branch="$(api_default_branch "$central_repository")" || return 1
    [ "$expected_ref" = "refs/heads/$default_branch" ] || return 1
    current_sha="$(api_branch_sha "$central_repository" "$default_branch")" || return 1
    [ "$current_sha" = "$expected_sha" ]
}

validate_context() {
    local request_file="$1"
    local policy_file="$2"
    local trusted_suite_dir="$3"
    local request suite_dir suite_sha repository check_id target actor triggering_actor descriptor

    validate_remediation_policy "$policy_file" || return 1
    request="$(request_context "$request_file")" || return 1
    suite_dir="$(realpath -e "$trusted_suite_dir")" || return 1
    [ "$(git -C "$suite_dir" rev-parse --show-toplevel)" = "$suite_dir" ] || return 1
    suite_sha="$(git -C "$suite_dir" rev-parse HEAD)" || return 1
    remediation_is_sha "$suite_sha" || return 1
    [ "$suite_sha" = "$(jq -r '.suite_sha' <<< "$request")" ] || return "$EX_TEMPFAIL"
    [ "$suite_sha" = "${GITHUB_SHA:?GITHUB_SHA is required}" ] || return "$EX_TEMPFAIL"

    repository="$(jq -r '(.org + "/" + .repo) | ascii_downcase' <<< "$request")"
    check_id="$(jq -r '.check_id' <<< "$request")"
    remediation_is_repository "$repository" && remediation_is_check_id "$check_id" || return 1
    [ -d "$suite_dir/checks/$check_id" ] && [ ! -L "$suite_dir/checks/$check_id" ] || return 1
    descriptor="$(load_remediation_descriptor "$suite_dir/checks/$check_id" "$policy_file")" || return 1
    [ "$descriptor" != "null" ] || return 1

    [ "$(jq -r '.enabled' "$policy_file")" = "true" ] || return "$EX_NOPERM"
    target="$(remediation_target "$policy_file" "$repository")" || return "$EX_NOPERM"
    jq -e --arg check_id "$check_id" '.check_ids | index($check_id) != null' <<< "$target" >/dev/null || return "$EX_NOPERM"
    actor="${GITHUB_ACTOR:?GITHUB_ACTOR is required}"
    triggering_actor="${GITHUB_TRIGGERING_ACTOR:?GITHUB_TRIGGERING_ACTOR is required}"
    remediation_is_login "$actor" && remediation_is_login "$triggering_actor" || return "$EX_NOPERM"
    jq -e --arg actor "$actor" --arg triggering_actor "$triggering_actor" '
        (.actors | index($actor) != null) and (.actors | index($triggering_actor) != null)
    ' <<< "$target" >/dev/null || return "$EX_NOPERM"
    validate_central_revision || return "$EX_TEMPFAIL"

    jq -cn \
        --arg repository "$repository" \
        --arg repository_key "$(printf '%s' "$repository" | sha256sum | cut -d' ' -f1)" \
        --arg check_id "$check_id" \
        --arg service_sha "$(jq -r '.service_sha' <<< "$request")" \
        --arg suite_sha "$suite_sha" \
        --arg request_id "$(jq -r '.request_id' <<< "$request")" \
        --arg actor "$actor" \
        --arg triggering_actor "$triggering_actor" \
        '{repository:$repository, repository_key:$repository_key, check_id:$check_id, service_sha:$service_sha, suite_sha:$suite_sha, request_id:$request_id, actor:$actor, triggering_actor:$triggering_actor}'
}

write_result() {
    local work_dir="$1"
    local status="$2"
    local context_json="$3"
    local policy_file="$4"
    local branch="${5:-}"
    local pr_url="${6:-}"
    local phase="${7:-publication}"
    local result_file runtime_digest run_id run_attempt run_url

    mkdir -p "$work_dir"
    result_file="$work_dir/remediation-result.json"
    runtime_digest="$(jq -r '.runtime_image // ""' "$policy_file" 2>/dev/null || printf '')"
    run_id="${GITHUB_RUN_ID:-}"
    run_attempt="${GITHUB_RUN_ATTEMPT:-0}"
    [[ "$run_attempt" =~ ^[0-9]+$ ]] || run_attempt=0
    run_url=""
    if [ -n "$run_id" ] && [ -n "${GITHUB_SERVER_URL:-}" ] && [ -n "${GITHUB_REPOSITORY:-}" ]; then
        run_url="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${run_id}"
    fi

    jq -n \
        --arg status "$status" \
        --arg branch "$branch" \
        --arg pr_url "$pr_url" \
        --arg runtime_digest "$runtime_digest" \
        --arg run_id "$run_id" \
        --argjson run_attempt "$run_attempt" \
        --arg run_url "$run_url" \
        --argjson context "$context_json" '
        {
          version: 1,
          request_id: ($context.request_id // ""),
          repository: ($context.repository // ""),
          check_id: ($context.check_id // ""),
          service_sha: ($context.service_sha // ""),
          suite_sha: ($context.suite_sha // ""),
          runtime_digest: $runtime_digest,
          run_id: $run_id,
          run_attempt: $run_attempt,
          run_url: $run_url,
          status: $status
        }
        + (if $branch == "" then {} else {branch: $branch} end)
        + (if $pr_url == "" then {} else {pr_url: $pr_url} end)
    ' > "$result_file"

    if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
        {
            printf '## Scorecards remediation\n\n'
            printf -- '- Status: `%s`\n' "$status"
            if [ "$status" = pr_failed ]; then
                printf -- '- Failed phase: `%s`\n' "$phase"
            fi
            [ -n "$pr_url" ] && printf -- '- Pull request: %s\n' "$pr_url"
            [ -n "$branch" ] && printf -- '- Branch: `%s`\n' "$branch"
            true
        } >> "$GITHUB_STEP_SUMMARY"
    fi
}

write_fallback_result() {
    local work_dir="$1"
    local policy_file="$2"
    local request_file="$3"
    local status="${4:-execution_failed}"
    local context='{}'
    if require_regular_file "$request_file"; then
        context="$(jq -c '{repository:(.org + "/" + .repo), check_id:(.check_id // ""), service_sha:(.service_sha // ""), suite_sha:(.suite_sha // ""), request_id:(.request_id // "")}' "$request_file" 2>/dev/null || printf '{}')"
    fi
    write_result "$work_dir" "$status" "$context" "$policy_file"
}

check_is_excluded() {
    local tree="$1"
    local check_id="$2"
    local exclusions
    exclusions="$(parse_excluded_checks "$tree")" || return 1
    jq -e --arg check_id "$check_id" 'any(.[]; .check == $check_id)' <<< "$exclusions" >/dev/null
}

run_check() {
    local check_dir="$1"
    local trusted_suite_dir="$2"
    local tree="$3"
    local max_seconds="$4"
    local output_max_bytes="$5"
    local log_file="$6"
    local runtime_image="$7"
    local policy_file="$8"
    local sandbox_user="$9"
    local rc size check_id entry script cidfile

    check_id="$(basename "$check_dir")"
    if [ -f "$check_dir/check.sh" ]; then
        entry=/bin/bash
        script="/checks/$check_id/check.sh"
    elif [ -f "$check_dir/check.py" ]; then
        entry=python3
        script="/checks/$check_id/check.py"
    elif [ -f "$check_dir/check.js" ]; then
        entry=node
        script="/checks/$check_id/check.js"
    else
        return 125
    fi
    cidfile="$log_file.cid"
    rm -f "$cidfile"
    if (
        ulimit -f "$(((output_max_bytes + 511) / 512))"
        timeout --signal=KILL --kill-after=1 "$max_seconds" docker run --rm --cidfile "$cidfile" --network=none --read-only --cap-drop=ALL --security-opt=no-new-privileges --user="$sandbox_user" --pids-limit "$(jq -r '.pids_max' "$policy_file")" --memory "$(jq -r '.memory_max_bytes' "$policy_file")" --cpus "$(jq -r '.cpu_max' "$policy_file")" --tmpfs "/tmp:rw,nosuid,nodev,noexec,size=$(jq -r '.memory_max_bytes' "$policy_file")" --mount "type=bind,src=$(realpath -e "$trusted_suite_dir/checks"),dst=/checks,readonly" --mount "type=bind,src=$(realpath -e "$trusted_suite_dir/action/lib"),dst=/action/lib,readonly" --mount "type=bind,src=$(realpath -e "$tree"),dst=/workspace,readonly" --env SCORECARD_REPO_PATH=/workspace --entrypoint "$entry" "$runtime_image" "$script"
    ) > "$log_file" 2>&1; then
        rc=0
    else
        rc=$?
    fi
    if [ -s "$cidfile" ]; then
        docker rm -f "$(cat "$cidfile")" >/dev/null 2>&1 || true
    fi
    rm -f "$cidfile"
    size="$(stat -c '%s' "$log_file")"
    if [ "$size" -gt "$output_max_bytes" ]; then
        truncate -s "$output_max_bytes" "$log_file"
        return 125
    fi
    return "$rc"
}

existing_prs() {
    local repository="$1"
    local default_branch="$2"
    local check_id="$3"
    local publisher_login="$4"
    local marker="<!-- scorecards-remediation:v1 check_id=$check_id -->"
    local prefix="scorecards-remediation/$check_id/"
    local pulls

    pulls="$(gh api --paginate --slurp "/repos/$repository/pulls?state=open&base=$default_branch&per_page=100")" || return 1
    jq -ce --arg repository "$repository" --arg default_branch "$default_branch" --arg prefix "$prefix" --arg publisher_login "$publisher_login" --arg marker "$marker" '
        [ .[] | if type == "array" then .[] else . end
          | select(.base.ref == $default_branch)
          | select(((.head.repo.full_name // "") | ascii_downcase) == $repository)
          | select(.head.ref | startswith($prefix))
          | select(.user.login == $publisher_login)
          | select((.body // "") | contains($marker))
          | {url: .html_url, head: .head.ref}
        ]
    ' <<< "$pulls"
}

validate_publisher() {
    local target_json="$1"
    local publisher_login
    publisher_login="$(jq -r '.publisher_login' <<< "$target_json")"
    [ "$(gh api /user --jq '.login')" = "$publisher_login" ]
}

copy_service_tree() {
    local repository="$1"
    local service_sha="$2"
    local work_dir="$3"
    local clone_dir="$work_dir/service-clone"
    local tree_dir="$work_dir/tree"
    local baseline_dir="$work_dir/baseline"
    local remote_url="${REMEDIATION_SERVICE_REMOTE_URL:-https://github.com/$repository.git}"
    local askpass="$work_dir/git-askpass"
    local previous_umask entry mode type object path actual_service_sha

    [ -n "${GH_TOKEN:-}" ] || return 1
    previous_umask="$(umask)"
    umask 077
    cat > "$askpass" <<'SH'
#!/bin/sh
printf '%s' "$GH_TOKEN"
SH
    chmod 700 "$askpass"
    umask "$previous_umask"
    mkdir -p "$work_dir/git-home"
    GIT_CONFIG_NOSYSTEM=1 HOME="$work_dir/git-home" GIT_TERMINAL_PROMPT=0 GIT_ASKPASS="$askpass" git -c core.hooksPath=/dev/null clone --no-checkout "$remote_url" "$clone_dir" >/dev/null 2>&1 || return 1
    actual_service_sha="$(GIT_CONFIG_NOSYSTEM=1 HOME="$work_dir/git-home" git -C "$clone_dir" rev-parse "$service_sha^{commit}")" || return 1
    [ "$actual_service_sha" = "$service_sha" ] || return 1
    mkdir -p "$tree_dir" "$baseline_dir" || return 1
    git -C "$clone_dir" ls-tree -rz --full-tree "$service_sha" > "$work_dir/service-tree" || return 1
    while IFS= read -r -d '' entry; do
        mode="${entry%% *}"
        entry="${entry#* }"
        type="${entry%% *}"
        entry="${entry#* }"
        object="${entry%%$'\t'*}"
        path="${entry#*$'\t'}"
        case "$mode:$type" in
            100644:blob|100755:blob) ;;
            *) return "$EX_DATAERR" ;;
        esac
        case "$path" in
            ""|/*|.|..|.git|*/../*|*/.git|.git/*|*/.git/*) return "$EX_DATAERR" ;;
        esac
        mkdir -p "$tree_dir/$(dirname "$path")" || return 1
        git -C "$clone_dir" cat-file blob "$object" > "$tree_dir/$path" || return 1
        chmod "${mode#100}" "$tree_dir/$path" || return 1
    done < "$work_dir/service-tree"
    cp -a "$tree_dir/." "$baseline_dir/" || return 1
    rm -f "$askpass"

    git -C "$clone_dir" remote set-url origin "$remote_url"
}
tree_is_regular() {
    local tree_dir="$1"

    [ -z "$(find "$tree_dir" -type l -print -quit)" ] &&
        [ -z "$(find "$tree_dir" ! -type d ! -type f -print -quit)" ]
}

validate_sandbox_tree() {
    local baseline_dir="$1"
    local tree_dir="$2"
    local allowed_paths="$3"
    local diff_max_bytes="$4"
    local changed_json='[]'
    local baseline_files tree_files path mode baseline_mode diff_file diff_size total_diff_size=0

    tree_is_regular "$tree_dir" || return 1
    baseline_files="$(cd "$baseline_dir" && find . -type f -printf '%P\n' | LC_ALL=C sort)"
    tree_files="$(cd "$tree_dir" && find . -type f -printf '%P\n' | LC_ALL=C sort)"
    [ "$baseline_files" = "$tree_files" ] || return 1
    while IFS= read -r path; do
        [ -n "$path" ] || continue
        baseline_mode="$(stat -c '%a' "$baseline_dir/$path")"
        mode="$(stat -c '%a' "$tree_dir/$path")"
        [ "$baseline_mode" = "$mode" ] || return 1
        if ! cmp -s "$baseline_dir/$path" "$tree_dir/$path"; then
            jq -e --arg path "$path" 'index($path) != null' <<< "$allowed_paths" >/dev/null || return 1
            [[ "$path" =~ ^[A-Za-z0-9][A-Za-z0-9._/-]*$ ]] || return 1
            [ ! -s "$tree_dir/$path" ] || LC_ALL=C grep -Iq . "$tree_dir/$path" || return 1
            diff_file="$(mktemp)"
            diff -u -- "$baseline_dir/$path" "$tree_dir/$path" > "$diff_file" || true
            diff_size="$(stat -c '%s' "$diff_file")"
            rm -f "$diff_file"
            total_diff_size=$((total_diff_size + diff_size))
            [ "$total_diff_size" -le "$diff_max_bytes" ] || return 1
            changed_json="$(jq -c --arg path "$path" '. + [$path]' <<< "$changed_json")"
        fi
    done <<< "$tree_files"
    printf '%s\n' "$changed_json"
}

prepare() {
    local request_file="$1"
    local policy_file="$2"
    local trusted_suite_dir="$3"
    local work_dir="$4"

    local context target default_branch current_service_sha publisher_login existing check_dir timeout_max recipe_timeout output_max runtime_image pre_rc recipe_rc changed_paths allowed_paths sandbox_user recipe_path recipe_entry recipe_cidfile
    local validation_rc validation_status
    mkdir -p "$work_dir"
    rm -f "$work_dir/prepared.json"
    context="$(validate_context "$request_file" "$policy_file" "$trusted_suite_dir")" || {
        validation_rc=$?
        case "$validation_rc" in
            "$EX_TEMPFAIL") validation_status=stale_suite ;;
            "$EX_NOPERM") validation_status=unauthorized ;;
            *) validation_status=execution_failed ;;
        esac
        write_fallback_result "$work_dir" "$policy_file" "$request_file" "$validation_status"
        return 0
    }
    target="$(remediation_target "$policy_file" "$(jq -r '.repository' <<< "$context")")" || {
        write_result "$work_dir" unauthorized "$context" "$policy_file"
        return 0
    }
    export GH_TOKEN="${SCORECARDS_WORKFLOW_TOKEN:-${GH_TOKEN:-}}"
    [ -n "$GH_TOKEN" ] || {
        write_result "$work_dir" unauthorized "$context" "$policy_file"
        return 0
    }
    validate_publisher "$target" || {
        write_result "$work_dir" unauthorized "$context" "$policy_file"
        return 0
    }
    default_branch="$(api_default_branch "$(jq -r '.repository' <<< "$context")")" || {
        write_result "$work_dir" check_failed_to_run "$context" "$policy_file"
        return 0
    }
    current_service_sha="$(api_branch_sha "$(jq -r '.repository' <<< "$context")" "$default_branch")" || {
        write_result "$work_dir" check_failed_to_run "$context" "$policy_file"
        return 0
    }
    [ "$current_service_sha" = "$(jq -r '.service_sha' <<< "$context")" ] || {
        write_result "$work_dir" stale_service "$context" "$policy_file"
        return 0
    }
    publisher_login="$(jq -r '.publisher_login' <<< "$target")"
    existing="$(existing_prs "$(jq -r '.repository' <<< "$context")" "$default_branch" "$(jq -r '.check_id' <<< "$context")" "$publisher_login")" || {
        write_result "$work_dir" check_failed_to_run "$context" "$policy_file"
        return 0
    }
    case "$(jq 'length' <<< "$existing")" in
        0) ;;
        1) write_result "$work_dir" existing_pr "$context" "$policy_file" "$(jq -r '.[0].head' <<< "$existing")" "$(jq -r '.[0].url' <<< "$existing")"; return 0 ;;
        *) write_result "$work_dir" ambiguous_existing_pr "$context" "$policy_file"; return 0 ;;
    esac

    copy_service_tree "$(jq -r '.repository' <<< "$context")" "$(jq -r '.service_sha' <<< "$context")" "$work_dir" || {
        validation_rc=$?
        validation_status=check_failed_to_run
        [ "$validation_rc" -ne "$EX_DATAERR" ] || validation_status=invalid_diff
        write_result "$work_dir" "$validation_status" "$context" "$policy_file"
        return 0
    }
    tree_is_regular "$work_dir/tree" || {
        write_result "$work_dir" invalid_diff "$context" "$policy_file"
        return 0
    }
    check_is_excluded "$work_dir/tree" "$(jq -r '.check_id' <<< "$context")" && {
        write_result "$work_dir" not_eligible "$context" "$policy_file"
        return 0
    }
    check_dir="$(realpath -e "$trusted_suite_dir/checks/$(jq -r '.check_id' <<< "$context")")"
    timeout_max="$(jq -r '.timeout_max_seconds' "$policy_file")"
    output_max="$(jq -r '.output_max_bytes' "$policy_file")"
    runtime_image="$(jq -r '.runtime_image' "$policy_file")"
    sandbox_user="$(id -u):$(id -g)"
    [ "$(id -u)" -ne 0 ] || {
        write_result "$work_dir" execution_failed "$context" "$policy_file"
        return 0
    }
    if run_check "$check_dir" "$trusted_suite_dir" "$work_dir/tree" "$timeout_max" "$output_max" "$work_dir/precheck.log" "$runtime_image" "$policy_file" "$sandbox_user"; then
        write_result "$work_dir" already_satisfied "$context" "$policy_file"
        return 0
    else
        pre_rc=$?
    fi
    [ "$pre_rc" -eq 1 ] || {
        write_result "$work_dir" check_failed_to_run "$context" "$policy_file"
        return 0
    }
    recipe_path="$(remediation_recipe_path "$check_dir")"
    case "$(basename "$recipe_path")" in
        remediate.sh) recipe_entry=/bin/bash ;;
        remediate.py) recipe_entry=python3 ;;
        remediate.js) recipe_entry=node ;;
        *) write_result "$work_dir" execution_failed "$context" "$policy_file"; return 0 ;;
    esac

    recipe_timeout="$(jq -r '.remediation.timeout' "$check_dir/metadata.json")"
    recipe_cidfile="$work_dir/recipe.cid"
    rm -f "$recipe_cidfile"
    [ "$recipe_timeout" -le "$timeout_max" ] || recipe_timeout="$timeout_max"
    if (
        ulimit -f "$(((output_max + 511) / 512))"
        timeout --signal=KILL --kill-after=1 "$recipe_timeout" docker run --rm --cidfile "$recipe_cidfile" --network=none --read-only --cap-drop=ALL --security-opt=no-new-privileges --user="$sandbox_user" --pids-limit "$(jq -r '.pids_max' "$policy_file")" --memory "$(jq -r '.memory_max_bytes' "$policy_file")" --cpus "$(jq -r '.cpu_max' "$policy_file")" --tmpfs "/tmp:rw,nosuid,nodev,noexec,size=$(jq -r '.memory_max_bytes' "$policy_file")" --mount "type=bind,src=$(realpath -e "$trusted_suite_dir/checks"),dst=/checks,readonly" --mount "type=bind,src=$(realpath -e "$trusted_suite_dir/action/lib"),dst=/action/lib,readonly" --mount "type=bind,src=$(realpath -e "$work_dir/tree"),dst=/workspace" --env SCORECARD_REPO_PATH=/workspace --env SCORECARDS_REPO="${GITHUB_REPOSITORY}" --env SERVICE_REPOSITORY="$(jq -r '.org + "/" + .repo' "$request_file")" --env SCORECARDS_BRANCH=catalog --entrypoint "$recipe_entry" "$runtime_image" "/checks/$(jq -r '.check_id' <<< "$context")/$(basename "$recipe_path")"
    ) > "$work_dir/recipe.log" 2>&1; then
        recipe_rc=0
    else
        recipe_rc=$?
    fi
    if [ -s "$recipe_cidfile" ]; then
        docker rm -f "$(cat "$recipe_cidfile")" >/dev/null 2>&1 || true
    fi
    rm -f "$recipe_cidfile"
    if [ "$(stat -c '%s' "$work_dir/recipe.log")" -gt "$output_max" ]; then
        truncate -s "$output_max" "$work_dir/recipe.log"
        write_result "$work_dir" execution_failed "$context" "$policy_file"
        return 0
    fi
    case "$recipe_rc" in
        0) ;;
        3) write_result "$work_dir" not_applicable "$context" "$policy_file"; return 0 ;;
        *) write_result "$work_dir" execution_failed "$context" "$policy_file"; return 0 ;;
    esac

    allowed_paths="$(remediation_allowed_paths "$check_dir" "$policy_file")"
    changed_paths="$(validate_sandbox_tree "$work_dir/baseline" "$work_dir/tree" "$allowed_paths" "$(jq -r '.diff_max_bytes' "$policy_file")")" || {
        write_result "$work_dir" invalid_diff "$context" "$policy_file"
        return 0
    }
    [ "$(jq 'length' <<< "$changed_paths")" -gt 0 ] || {
        write_result "$work_dir" no_diff "$context" "$policy_file"
        return 0
    }
    if ! run_check "$check_dir" "$trusted_suite_dir" "$work_dir/tree" "$timeout_max" "$output_max" "$work_dir/postcheck.log" "$runtime_image" "$policy_file" "$sandbox_user"; then
        write_result "$work_dir" execution_failed "$context" "$policy_file"
        return 0
    fi

    [[ "${GITHUB_RUN_ID:-}" =~ ^[1-9][0-9]*$ ]] && [[ "${GITHUB_RUN_ATTEMPT:-}" =~ ^[1-9][0-9]*$ ]] || {
        write_result "$work_dir" execution_failed "$context" "$policy_file"
        return 0
    }
    jq -n \
        --argjson context "$context" \
        --arg default_branch "$default_branch" \
        --arg branch "scorecards-remediation/$(jq -r '.check_id' <<< "$context")/${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}-${GITHUB_RUN_ATTEMPT:?GITHUB_RUN_ATTEMPT is required}" \
        --arg baseline "$work_dir/baseline" \
        --arg tree "$work_dir/tree" \
        --argjson allowed_paths "$allowed_paths" \
        --argjson changed_paths "$changed_paths" \
        '{context:$context, default_branch:$default_branch, branch:$branch, baseline:$baseline, tree:$tree, allowed_paths:$allowed_paths, changed_paths:$changed_paths}' > "$work_dir/prepared.json"
}

publish() {
    local prepared_file="$1"
    local policy_file="$2"
    local work_dir="$3"

    local prepared context repository check_id default_branch branch baseline tree allowed_paths changed_paths verified_paths target current_service_sha remote_base remote_url askpass writer_dir path pr_body pr_url
    local existing mode blob
    require_regular_file "$prepared_file" && validate_remediation_policy "$policy_file" || return 1
    prepared="$(jq -ce 'select(
        type == "object" and keys == ["allowed_paths", "baseline", "branch", "changed_paths", "context", "default_branch", "tree"]
        and (.context | type == "object") and (.allowed_paths | type == "array") and (.changed_paths | type == "array" and length > 0)
        and (.baseline | type == "string") and (.tree | type == "string") and (.default_branch | type == "string") and (.branch | type == "string")
    )' "$prepared_file")" || return 1
    context="$(jq -c '.context' <<< "$prepared")"
    repository="$(jq -r '.repository' <<< "$context")"
    check_id="$(jq -r '.check_id' <<< "$context")"
    default_branch="$(jq -r '.default_branch' <<< "$prepared")"
    branch="$(jq -r '.branch' <<< "$prepared")"
    baseline="$(jq -r '.baseline' <<< "$prepared")"
    tree="$(jq -r '.tree' <<< "$prepared")"
    allowed_paths="$(jq -c '.allowed_paths' <<< "$prepared")"
    changed_paths="$(jq -c '.changed_paths' <<< "$prepared")"
    remediation_is_repository "$repository" && remediation_is_check_id "$check_id" && [ -d "$baseline" ] && [ -d "$tree" ] || return 1
    case "$branch" in scorecards-remediation/"$check_id"/*) ;; *) return 1 ;; esac
    [ "$branch" != "$default_branch" ] && git check-ref-format "refs/heads/$branch" || return 1
    verified_paths="$(validate_sandbox_tree "$baseline" "$tree" "$allowed_paths" "$(jq -r '.diff_max_bytes' "$policy_file")")" || { write_result "$work_dir" invalid_diff "$context" "$policy_file"; return 0; }
    [ "$(jq -cS . <<< "$verified_paths")" = "$(jq -cS . <<< "$changed_paths")" ] || { write_result "$work_dir" invalid_diff "$context" "$policy_file"; return 0; }

    export GH_TOKEN="${SCORECARDS_WORKFLOW_TOKEN:-${GH_TOKEN:-}}"
    [ -n "$GH_TOKEN" ] || { write_result "$work_dir" unauthorized "$context" "$policy_file"; return 0; }
    target="$(remediation_target "$policy_file" "$repository")" || { write_result "$work_dir" unauthorized "$context" "$policy_file"; return 0; }
    [ "$(jq -r '.enabled' "$policy_file")" = true ] || { write_result "$work_dir" unauthorized "$context" "$policy_file"; return 0; }
    jq -e --arg check_id "$check_id" --arg actor "$(jq -r '.actor' <<< "$context")" --arg triggering_actor "$(jq -r '.triggering_actor' <<< "$context")" '(.check_ids | index($check_id) != null) and (.actors | index($actor) != null) and (.actors | index($triggering_actor) != null)' <<< "$target" >/dev/null || { write_result "$work_dir" unauthorized "$context" "$policy_file"; return 0; }
    [ "$(jq -r '.suite_sha' <<< "$context")" = "${GITHUB_SHA:-}" ] && validate_central_revision || { write_result "$work_dir" stale_suite "$context" "$policy_file"; return 0; }
    validate_publisher "$target" || { write_result "$work_dir" unauthorized "$context" "$policy_file"; return 0; }
    current_service_sha="$(api_branch_sha "$repository" "$default_branch")" || { write_result "$work_dir" check_failed_to_run "$context" "$policy_file"; return 0; }
    [ "$current_service_sha" = "$(jq -r '.service_sha' <<< "$context")" ] || { write_result "$work_dir" stale_service "$context" "$policy_file"; return 0; }

    mkdir -p "$work_dir/git-home"
    writer_dir="$work_dir/writer"
    rm -rf "$writer_dir"
    remote_url="$(git -C "$work_dir/service-clone" remote get-url origin)"
    askpass="$work_dir/publish-askpass"
    cat > "$askpass" <<'SH'
#!/bin/sh
printf '%s' "$GH_TOKEN"
SH
    chmod 700 "$askpass"
    GIT_CONFIG_NOSYSTEM=1 HOME="$work_dir/git-home" git -c core.hooksPath=/dev/null clone --no-checkout "$work_dir/service-clone" "$writer_dir" >/dev/null 2>&1 || { write_result "$work_dir" pr_failed "$context" "$policy_file"; return 0; }
    GIT_CONFIG_NOSYSTEM=1 HOME="$work_dir/git-home" git -C "$writer_dir" remote set-url origin "$remote_url"
    GIT_CONFIG_NOSYSTEM=1 HOME="$work_dir/git-home" git -C "$writer_dir" update-ref --no-deref HEAD "$(jq -r '.service_sha' <<< "$context")" || { write_result "$work_dir" pr_failed "$context" "$policy_file"; return 0; }
    GIT_CONFIG_NOSYSTEM=1 HOME="$work_dir/git-home" git -C "$writer_dir" read-tree HEAD || { write_result "$work_dir" pr_failed "$context" "$policy_file"; return 0; }
    for path in $(jq -r '.[]' <<< "$changed_paths"); do
        [[ "$path" =~ ^[A-Za-z0-9][A-Za-z0-9._/-]*$ ]] || { write_result "$work_dir" invalid_diff "$context" "$policy_file"; return 0; }
        mode="$(GIT_CONFIG_NOSYSTEM=1 HOME="$work_dir/git-home" git -C "$writer_dir" ls-tree HEAD -- "$path" | cut -d' ' -f1)"
        blob="$(GIT_CONFIG_NOSYSTEM=1 HOME="$work_dir/git-home" git -C "$writer_dir" hash-object -w --no-filters -- "$tree/$path")"
        GIT_CONFIG_NOSYSTEM=1 HOME="$work_dir/git-home" git -C "$writer_dir" update-index --cacheinfo "$mode,$blob,$path"
    done
    GIT_CONFIG_NOSYSTEM=1 HOME="$work_dir/git-home" git -C "$writer_dir" diff --cached --quiet && { write_result "$work_dir" no_diff "$context" "$policy_file"; return 0; }
    GIT_CONFIG_NOSYSTEM=1 HOME="$work_dir/git-home" git -C "$writer_dir" config user.name "scorecards-remediation[bot]"
    GIT_CONFIG_NOSYSTEM=1 HOME="$work_dir/git-home" git -C "$writer_dir" config user.email "scorecards-remediation[bot]@users.noreply.github.com"
    GIT_CONFIG_NOSYSTEM=1 HOME="$work_dir/git-home" git -C "$writer_dir" -c core.hooksPath=/dev/null commit -m "fix($check_id): propose scorecards remediation" >/dev/null

    existing="$(existing_prs "$repository" "$default_branch" "$check_id" "$(jq -r '.publisher_login' <<< "$target")")" || { write_result "$work_dir" check_failed_to_run "$context" "$policy_file"; return 0; }
    case "$(jq 'length' <<< "$existing")" in
        0) ;;
        1) write_result "$work_dir" existing_pr "$context" "$policy_file" "$(jq -r '.[0].head' <<< "$existing")" "$(jq -r '.[0].url' <<< "$existing")"; return 0 ;;
        *) write_result "$work_dir" ambiguous_existing_pr "$context" "$policy_file"; return 0 ;;
    esac
    remote_base="$(GIT_CONFIG_NOSYSTEM=1 HOME="$work_dir/git-home" GIT_TERMINAL_PROMPT=0 GIT_ASKPASS="$askpass" git -C "$writer_dir" ls-remote origin "refs/heads/$default_branch" | cut -f1)" || { write_result "$work_dir" check_failed_to_run "$context" "$policy_file"; return 0; }
    [ "$remote_base" = "$(jq -r '.service_sha' <<< "$context")" ] || { write_result "$work_dir" stale_service "$context" "$policy_file"; return 0; }
    [ "$(api_branch_sha "$repository" "$default_branch")" = "$(jq -r '.service_sha' <<< "$context")" ] || { write_result "$work_dir" stale_service "$context" "$policy_file"; return 0; }
    [ "$(api_default_branch "$repository")" = "$default_branch" ] || { write_result "$work_dir" stale_service "$context" "$policy_file"; return 0; }
    [ -z "$(GIT_CONFIG_NOSYSTEM=1 HOME="$work_dir/git-home" GIT_TERMINAL_PROMPT=0 GIT_ASKPASS="$askpass" git -C "$writer_dir" ls-remote --heads origin "refs/heads/$branch")" ] || { write_result "$work_dir" pr_failed "$context" "$policy_file"; return 0; }
    if ! GIT_CONFIG_NOSYSTEM=1 HOME="$work_dir/git-home" GIT_TERMINAL_PROMPT=0 GIT_ASKPASS="$askpass" git -C "$writer_dir" -c core.hooksPath=/dev/null push origin "HEAD:refs/heads/$branch" >/dev/null 2>&1; then
        write_result "$work_dir" pr_failed "$context" "$policy_file" "$branch" "" push
        return 0
    fi

    pr_body="<!-- scorecards-remediation:v1 check_id=$check_id -->

Proposed deterministic remediation for $check_id.

- Service SHA: $(jq -r '.service_sha' <<< "$context")
- Suite SHA: $(jq -r '.suite_sha' <<< "$context")
- Runtime: $(jq -r '.runtime_image' "$policy_file")
- Run: ${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
    if pr_url="$(gh api --method POST "/repos/$repository/pulls" -f "title=fix($check_id): scorecards remediation" -f "head=$branch" -f "base=$default_branch" -f "body=$pr_body" --jq '.html_url' 2>/dev/null)"; then
        [ -n "$pr_url" ] && { write_result "$work_dir" pr_created "$context" "$policy_file" "$branch" "$pr_url"; return 0; }
    fi
    pr_url="$(existing_prs "$repository" "$default_branch" "$check_id" "$(jq -r '.publisher_login' <<< "$target")" | jq -r --arg branch "$branch" '.[] | select(.head == $branch) | .url' | head -n 1)" || true
    if [ -n "$pr_url" ]; then
        write_result "$work_dir" existing_pr "$context" "$policy_file" "$branch" "$pr_url"
    else
        write_result "$work_dir" pr_failed "$context" "$policy_file" "$branch" "" pull_request
    fi
}

case "${1:-}" in
    validate)
        [ "$#" -eq 4 ] || usage
        validate_context "$2" "$3" "$4"
        ;;
    prepare)
        [ "$#" -eq 5 ] || usage
        prepare "$2" "$3" "$4" "$5"
        ;;
    publish)
        [ "$#" -eq 4 ] || usage
        publish "$2" "$3" "$4"
        ;;
    *) usage ;;
esac
