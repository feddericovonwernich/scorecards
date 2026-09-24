#!/usr/bin/env bats

load helpers

setup() {
    export TEST_TEMP_DIR="$(mktemp -d)"
    export SOURCE_REPO="$TEST_TEMP_DIR/source"
    export TARGET_REMOTE="$TEST_TEMP_DIR/target.git"
    export GH_STATE_DIR="$TEST_TEMP_DIR/gh-state"
    export GH_LOG="$TEST_TEMP_DIR/gh.log"
    export GIT_LOG="$TEST_TEMP_DIR/git.log"
    export REAL_GIT="$(command -v git)"
    export REAL_JQ="$(command -v jq)"
    export TEST_BIN="$TEST_TEMP_DIR/bin"
    mkdir -p "$SOURCE_REPO/scripts" "$SOURCE_REPO/docs" "$SOURCE_REPO/.github/workflows" "$GH_STATE_DIR" "$TEST_BIN"

    cp "$PROJECT_ROOT/scripts/install.sh" "$SOURCE_REPO/scripts/install.sh"
    cp "$PROJECT_ROOT/scripts/verify-pages.py" "$SOURCE_REPO/scripts/verify-pages.py"
    cp "$PROJECT_ROOT/.github/workflows/sync-docs.yml" "$SOURCE_REPO/.github/workflows/sync-docs.yml"
    cp "$PROJECT_ROOT/.github/workflows/consolidate-registry.yml" "$SOURCE_REPO/.github/workflows/consolidate-registry.yml"
    printf '%s\n' '# Scorecards' 'https://github.com/feddericovonwernich/scorecards' > "$SOURCE_REPO/README.md"
    printf '%s\n' '<!doctype html><title>Scorecards</title>' > "$SOURCE_REPO/docs/index.html"
    printf '%s\n' 'node_modules/' > "$SOURCE_REPO/.gitignore"

    "$REAL_GIT" -C "$SOURCE_REPO" init -b main >/dev/null
    "$REAL_GIT" -C "$SOURCE_REPO" config user.name tester
    "$REAL_GIT" -C "$SOURCE_REPO" config user.email tester@example.invalid
    "$REAL_GIT" -C "$SOURCE_REPO" add .
    "$REAL_GIT" -C "$SOURCE_REPO" commit -m source >/dev/null
    printf '%s\n' pinned > "$SOURCE_REPO/pinned"
    "$REAL_GIT" -C "$SOURCE_REPO" add pinned
    "$REAL_GIT" -C "$SOURCE_REPO" commit -m pinned >/dev/null
    export EXPECTED_SOURCE_SHA
    EXPECTED_SOURCE_SHA="$($REAL_GIT -C "$SOURCE_REPO" rev-parse HEAD)"

    cat > "$TEST_BIN/git" <<'STUB'
#!/bin/bash
printf '%q ' "$@" >> "$GIT_LOG"
printf '\n' >> "$GIT_LOG"
repository=
is_ls_remote=false
is_fetch=false
previous=
for arg in "$@"; do
    [ "$previous" != -C ] || repository="$arg"
    [ "$arg" != ls-remote ] || is_ls_remote=true
    [ "$arg" != fetch ] || is_fetch=true
    [ "$arg" != switch ] || exit 99
    previous="$arg"
done
if [ "$is_fetch" = true ]; then
    printf '%s' "$repository" > "$GH_STATE_DIR/bootstrap-source-dir"
fi
if [ "${FAIL_DOCUMENTED_FETCH:-false}" = true ] && [ "$is_fetch" = true ]; then
    exit 42
fi
if [ "${INJECT_REF_ON_LS_REMOTE:-false}" = true ] && [ "$is_ls_remote" = true ] && [ ! -e "$GH_STATE_DIR/injected-ref" ]; then
    "$REAL_GIT" -C "$SOURCE_REPO" push "$TARGET_REMOTE" "$EXPECTED_SOURCE_SHA:refs/heads/main" >/dev/null
    touch "$GH_STATE_DIR/injected-ref"
fi
exec "$REAL_GIT" "$@"
STUB

    cat > "$TEST_BIN/jq" <<'STUB'
#!/bin/bash
printf '%s\n' 'jq must not be used by the installer' >&2
exit 99
STUB

    cat > "$TEST_BIN/gh" <<'STUB'
#!/bin/bash
printf '%q ' "$@" >> "$GH_LOG"
printf '\n' >> "$GH_LOG"

case "$*" in
    "--version") printf '%s\n' 'gh version fixture'; exit 0 ;;
    "api --help"|"repo view --help"|"repo create --help"|"workflow run --help"|"run list --help") exit 0 ;;
    "auth status"*) exit 0 ;;
    "api user"*) printf '%s\n' 'acme'; exit 0 ;;
    "api users/acme"*) printf '%s\n' 'User'; exit 0 ;;
    "repo view "*)
        if [ -f "$GH_STATE_DIR/repo-exists" ]; then
            printf '%s\n' '{"name":"scorecards"}'
            exit 0
        fi
        exit 1
        ;;
    *"--jq .public"*) printf '%s\n' "${PAGES_PUBLIC:-true}"; exit 0 ;;
    *"--jq .html_url"*) printf '%s\n' "$TEST_PAGES_URL"; exit 0 ;;
    "repo create "*)
        mkdir -p "$TARGET_REMOTE"
        "$REAL_GIT" init --bare "$TARGET_REMOTE" >/dev/null
        touch "$GH_STATE_DIR/repo-exists"
        exit 0
        ;;
    *"git/matching-refs/heads"*)
        "$REAL_GIT" --git-dir="$TARGET_REMOTE" for-each-ref --format='%(refname)' refs/heads 2>/dev/null || true
        exit 0
        ;;
    *"git/matching-refs/tags"*)
        "$REAL_GIT" --git-dir="$TARGET_REMOTE" for-each-ref --format='%(refname)' refs/tags 2>/dev/null || true
        exit 0
        ;;
    *"--jq .permissions"*|*"--jq .permissions."*) printf '%s\n' $'true\ttrue\ttrue'; exit 0 ;;
    *"--jq .default_branch"*) printf '%s\n' 'main'; exit 0 ;;
    *"actions/permissions"*) printf '%s\n' "${ACTIONS_ENABLED:-true}"; exit 0 ;;
    *"--method POST"*"/pages"*|*"-X POST"*"/pages"*) touch "$GH_STATE_DIR/pages"; exit 0 ;;
    *"--method PUT"*"/pages"*|*"-X PUT"*"/pages"*) touch "$GH_STATE_DIR/pages"; exit 0 ;;
    *"/pages"*)
        if [ -f "$GH_STATE_DIR/pages" ] || [ "${PAGES_MODE:-missing}" != missing ]; then
            if [ "${PAGES_MODE:-workflow}" = legacy ] && [ ! -f "$GH_STATE_DIR/pages" ]; then
                printf 'legacy\tbuilt\t%s\n' "$TEST_PAGES_URL"
            else
                printf 'workflow\tbuilt\t%s\n' "$TEST_PAGES_URL"
            fi
            exit 0
        fi
        exit 1
        ;;
    "workflow run "*) touch "$GH_STATE_DIR/dispatched"; exit 0 ;;
    *"actions/workflows/sync-docs.yml/runs"*)
        count=0
        [ ! -f "$GH_STATE_DIR/run-calls" ] || count="$(cat "$GH_STATE_DIR/run-calls")"
        count=$((count + 1))
        printf '%s' "$count" > "$GH_STATE_DIR/run-calls"
        [ "${RUN_MODE:-success}" != delayed ] || [ "$count" -gt 1 ] || exit 0
        [ "${RUN_MODE:-success}" != none ] || exit 0
        sha="$($REAL_GIT --git-dir="$TARGET_REMOTE" rev-parse refs/heads/main)"
        created_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
        if [ "${RUN_MODE:-success}" = ambiguous ]; then
            runs='[{"id":101,"status":"completed","conclusion":"success"},{"id":102,"status":"completed","conclusion":"success"}]'
        elif [ "${RUN_MODE:-success}" = pending ] && [ "$count" -le 2 ]; then
            if [ "$count" -eq 1 ]; then state=queued; else state=in_progress; fi
            runs="[{\"id\":101,\"status\":\"$state\",\"conclusion\":null}]"
        elif [ "${RUN_MODE:-success}" = failure ]; then
            runs='[{"id":101,"status":"completed","conclusion":"failure"}]'
        else
            runs='[{"id":101,"status":"completed","conclusion":"success"}]'
        fi
        printf '%s' "$runs" | "$REAL_JQ" --arg sha "$sha" --arg created "$created_at" \
            '[{workflow_runs: map(. + {html_url: ("https://example.invalid/runs/" + (.id|tostring)), head_sha: $sha, created_at: $created})}]' |
            "$REAL_JQ" -r "${@: -1}"
        exit 0
        ;;
    "api repos/acme/scorecards"*) printf '%s\n' '{}'; exit 0 ;;
    *) printf 'unexpected gh invocation: %s\n' "$*" >&2; exit 2 ;;
esac
STUB
    chmod +x "$TEST_BIN/git" "$TEST_BIN/gh" "$TEST_BIN/jq"
    export PATH="$TEST_BIN:$PATH"
    : > "$GH_LOG"
    : > "$GIT_LOG"
    mkdir -p "$TEST_TEMP_DIR/site/assets"
    printf '%s\n' '<!doctype html><div id="root"></div><script type="module" src="./assets/index-abcdefgh.js"></script><link rel="modulepreload" href="./assets/vendor-abcdefgh.js"><link rel="stylesheet" href="./assets/index-abcdefgh.css"><link rel="stylesheet" href="https://fonts.example.invalid/font.css">' > "$TEST_TEMP_DIR/site/index.html"
    printf '%s\n' 'document.title = "Scorecards";' > "$TEST_TEMP_DIR/site/assets/index-abcdefgh.js"
    printf '%s\n' 'body { margin: 0; }' > "$TEST_TEMP_DIR/site/assets/index-abcdefgh.css"
    printf '%s\n' 'export const vendor = true;' > "$TEST_TEMP_DIR/site/assets/vendor-abcdefgh.js"
    python3 - "$TEST_TEMP_DIR" <<'SERVER' > "$TEST_TEMP_DIR/http.log" 2>&1 &
import http.server
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
handler = lambda *args, **kwargs: http.server.SimpleHTTPRequestHandler(*args, directory=str(root / "site"), **kwargs)
server = http.server.HTTPServer(("127.0.0.1", 0), handler)
(root / "port").write_text(str(server.server_port))
server.serve_forever()
SERVER
    export HTTP_PID=$!
    for _ in {1..100}; do
        [ ! -f "$TEST_TEMP_DIR/port" ] || break
        sleep 0.01
    done
    export TEST_PAGES_URL="http://127.0.0.1:$(cat "$TEST_TEMP_DIR/port")/"
}

teardown() {
    kill "$HTTP_PID" 2>/dev/null || true
    wait "$HTTP_PID" 2>/dev/null || true
    rm -rf "$TEST_TEMP_DIR"
}

create_empty_target() {
    "$REAL_GIT" init --bare "$TARGET_REMOTE" >/dev/null
    touch "$GH_STATE_DIR/repo-exists"
}

seed_target_ref() {
    local ref="$1"
    local marker="$2"
    local seed="$TEST_TEMP_DIR/seed-${marker//\//-}"
    "$REAL_GIT" init -b main "$seed" >/dev/null
    "$REAL_GIT" -C "$seed" config user.name tester
    "$REAL_GIT" -C "$seed" config user.email tester@example.invalid
    printf '%s\n' "$marker" > "$seed/sentinel"
    "$REAL_GIT" -C "$seed" add sentinel
    "$REAL_GIT" -C "$seed" commit -m "$marker" >/dev/null
    "$REAL_GIT" -C "$seed" push "$TARGET_REMOTE" "HEAD:$ref" >/dev/null
}

run_installer() {
    env \
        GITHUB_TOKEN='token-value-that-must-stay-secret' \
        SCORECARDS_TARGET_REPO="${TARGET_REPO:-acme/scorecards}" \
        SCORECARDS_AUTO_CONFIRM=true \
        SCORECARDS_SINGLE_WRITER="${SINGLE_WRITER:-true}" \
        SCORECARDS_REPO_PRIVATE=false \
        SCORECARDS_ADOPT_EMPTY_REPO="${ADOPT_EMPTY:-false}" \
        SCORECARDS_SOURCE_SHA="$EXPECTED_SOURCE_SHA" \
        INSTALL_POLL_INTERVAL_SECONDS=0 \
        INSTALL_DEPLOY_TIMEOUT_SECONDS="${DEPLOY_TIMEOUT:-2}" \
        RUN_MODE="${RUN_MODE:-success}" \
        PAGES_MODE="${PAGES_MODE:-missing}" \
        GIT_CONFIG_COUNT=2 \
        GIT_CONFIG_KEY_0="url.file://$TARGET_REMOTE.insteadOf" \
        GIT_CONFIG_VALUE_0='https://github.com/acme/scorecards.git' \
        GIT_CONFIG_KEY_1=push.followTags \
        GIT_CONFIG_VALUE_1="${FOLLOW_TAGS:-false}" \
        bash "$SOURCE_REPO/scripts/install.sh"
}

run_documented_bootstrap() {
    local bootstrap
    bootstrap="$(awk '
        /^## Quick Start$/ { quick_start=1; next }
        quick_start && /^```bash$/ { capture=1; next }
        capture && /^```$/ { exit }
        capture && /^export / { next }
        capture { print }
    ' "$PROJECT_ROOT/README.md")"
    env \
        GITHUB_TOKEN='token-value-that-must-stay-secret' \
        SCORECARDS_RELEASE_SHA="$EXPECTED_SOURCE_SHA" \
        SCORECARDS_TARGET_REPO="${DOCUMENTED_TARGET_REPO:-acme/scorecards}" \
        SCORECARDS_SINGLE_WRITER=true \
        SCORECARDS_AUTO_CONFIRM=true \
        INSTALL_POLL_INTERVAL_SECONDS=0 \
        INSTALL_DEPLOY_TIMEOUT_SECONDS=2 \
        RUN_MODE=success \
        PAGES_MODE=missing \
        GIT_CONFIG_COUNT=2 \
        GIT_CONFIG_KEY_0="url.file://$SOURCE_REPO.insteadOf" \
        GIT_CONFIG_VALUE_0='https://github.com/feddericovonwernich/scorecards.git' \
        GIT_CONFIG_KEY_1="url.file://$TARGET_REMOTE.insteadOf" \
        GIT_CONFIG_VALUE_1='https://github.com/acme/scorecards.git' \
        bash -c "$bootstrap"
}

@test "documented bootstrap fetches full non-root ancestry and publishes to a default bare remote" {
    run run_documented_bootstrap

    [ "$status" -eq 0 ]
    "$REAL_GIT" --git-dir="$TARGET_REMOTE" cat-file -e "$EXPECTED_SOURCE_SHA^"
    [ -z "$($REAL_GIT --git-dir="$TARGET_REMOTE" config --get receive.shallowUpdate || true)" ]
}

@test "documented bootstrap removes its checkout while preserving a fetch failure" {
    FAIL_DOCUMENTED_FETCH=true run run_documented_bootstrap

    [ "$status" -eq 42 ]
    [ ! -d "$(cat "$GH_STATE_DIR/bootstrap-source-dir")" ]
}

@test "documented bootstrap removes its checkout while preserving an installer failure" {
    DOCUMENTED_TARGET_REPO=acme/quality run run_documented_bootstrap

    [ "$status" -ne 0 ]
    [ ! -d "$(cat "$GH_STATE_DIR/bootstrap-source-dir")" ]
}

@test "requires single-writer acknowledgement before creating a repository" {
    run env \
        GITHUB_TOKEN=token-value-that-must-stay-secret \
        SCORECARDS_TARGET_REPO=acme/scorecards \
        SCORECARDS_AUTO_CONFIRM=true \
        SCORECARDS_SOURCE_SHA="$EXPECTED_SOURCE_SHA" \
        PATH="$PATH" \
        bash "$SOURCE_REPO/scripts/install.sh"

    [ "$status" -ne 0 ]
    [ ! -f "$GH_STATE_DIR/repo-exists" ]
    [[ "$output" == *'SCORECARDS_SINGLE_WRITER'* ]]
}

@test "refuses refs that appear while preparing installation commits" {
    INJECT_REF_ON_LS_REMOTE=true run run_installer

    [ "$status" -ne 0 ]
    [ -f "$GH_STATE_DIR/injected-ref" ]
    [ "$EXPECTED_SOURCE_SHA" = "$($REAL_GIT --git-dir="$TARGET_REMOTE" rev-parse refs/heads/main)" ]
    ! "$REAL_GIT" --git-dir="$TARGET_REMOTE" rev-parse --verify refs/heads/catalog >/dev/null 2>&1
}

@test "rejects unsupported repository name before mutation" {
    TARGET_REPO=acme/quality run run_installer

    [ "$status" -ne 0 ]
    [ ! -f "$GH_STATE_DIR/repo-exists" ]
    ! grep -q 'repo create' "$GH_LOG"
}

@test "preserves every existing head and tag" {
    create_empty_target
    seed_target_ref refs/heads/main existing-main
    seed_target_ref refs/heads/catalog existing-catalog
    seed_target_ref refs/tags/v1 existing-tag
    local main_before catalog_before tag_before
    main_before="$($REAL_GIT --git-dir="$TARGET_REMOTE" rev-parse refs/heads/main)"
    catalog_before="$($REAL_GIT --git-dir="$TARGET_REMOTE" rev-parse refs/heads/catalog)"
    tag_before="$($REAL_GIT --git-dir="$TARGET_REMOTE" rev-parse refs/tags/v1)"

    ADOPT_EMPTY=true run run_installer

    [ "$status" -ne 0 ]
    [ "$main_before" = "$($REAL_GIT --git-dir="$TARGET_REMOTE" rev-parse refs/heads/main)" ]
    [ "$catalog_before" = "$($REAL_GIT --git-dir="$TARGET_REMOTE" rev-parse refs/heads/catalog)" ]
    [ "$tag_before" = "$($REAL_GIT --git-dir="$TARGET_REMOTE" rev-parse refs/tags/v1)" ]
}

@test "requires explicit opt-in for an existing empty repository" {
    create_empty_target

    run run_installer

    [ "$status" -ne 0 ]
    [ -z "$($REAL_GIT --git-dir="$TARGET_REMOTE" for-each-ref)" ]
}

@test "rejects disabled Actions before publishing an adopted repository" {
    create_empty_target

    ACTIONS_ENABLED=false ADOPT_EMPTY=true run run_installer

    [ "$status" -ne 0 ]
    [[ "$output" == *"Actions is disabled"* ]]
    [ -z "$($REAL_GIT --git-dir="$TARGET_REMOTE" for-each-ref)" ]
    [ ! -f "$GH_STATE_DIR/pages" ]
    [ ! -f "$GH_STATE_DIR/dispatched" ]
}

@test "publishes main and catalog together when adopting an empty repository" {
    create_empty_target

    ADOPT_EMPTY=true run run_installer

    [ "$status" -eq 0 ]
    "$REAL_GIT" --git-dir="$TARGET_REMOTE" rev-parse --verify refs/heads/main >/dev/null
    "$REAL_GIT" --git-dir="$TARGET_REMOTE" rev-parse --verify refs/heads/catalog >/dev/null
}

@test "publishes only main and catalog with annotated source tags and followTags enabled" {
    "$REAL_GIT" -C "$SOURCE_REPO" tag -a v1 -m release "$EXPECTED_SOURCE_SHA"

    FOLLOW_TAGS=true run run_installer

    [ "$status" -eq 0 ]
    [ "$("$REAL_GIT" --git-dir="$TARGET_REMOTE" for-each-ref --format='%(refname)')" = $'refs/heads/catalog\nrefs/heads/main' ]
}

@test "atomic rejection leaves both target branches absent" {
    create_empty_target
    mkdir -p "$TARGET_REMOTE/hooks"
    cat > "$TARGET_REMOTE/hooks/pre-receive" <<'HOOK'
#!/bin/bash
while read -r old new ref; do
    [ "$ref" != refs/heads/catalog ] || exit 1
done
HOOK
    chmod +x "$TARGET_REMOTE/hooks/pre-receive"

    ADOPT_EMPTY=true run run_installer

    [ "$status" -ne 0 ]
    ! "$REAL_GIT" --git-dir="$TARGET_REMOTE" rev-parse --verify refs/heads/main >/dev/null 2>&1
    ! "$REAL_GIT" --git-dir="$TARGET_REMOTE" rev-parse --verify refs/heads/catalog >/dev/null 2>&1
}

@test "keeps the installer token out of argv remotes and git config" {
    create_empty_target

    ADOPT_EMPTY=true run run_installer

    [ "$status" -eq 0 ]
    ! grep -R -F 'token-value-that-must-stay-secret' "$GH_LOG" "$GIT_LOG" "$TARGET_REMOTE/config"
    grep -F 'https://github.com/acme/scorecards.git' "$GIT_LOG"
}

@test "records immutable source separately from personalized installed main" {
    create_empty_target

    ADOPT_EMPTY=true run run_installer

    [ "$status" -eq 0 ]
    local receipt installed_sha
    receipt="$($REAL_GIT --git-dir="$TARGET_REMOTE" show refs/heads/main:.scorecards-install.json)"
    installed_sha="$($REAL_GIT --git-dir="$TARGET_REMOTE" rev-parse refs/heads/main)"
    [[ "$receipt" == *"\"source_sha\": \"$EXPECTED_SOURCE_SHA\""* ]]
    [ "$installed_sha" != "$EXPECTED_SOURCE_SHA" ]
    [[ "$output" == *"sourceSha: $EXPECTED_SOURCE_SHA"* ]]
    [[ "$output" == *"installedMainSha: $installed_sha"* ]]
}

@test "waits for one fresh deployment of installed main and workflow Pages" {
    create_empty_target

    ADOPT_EMPTY=true RUN_MODE=delayed run run_installer

    [ "$status" -eq 0 ]
    [ "$(cat "$GH_STATE_DIR/run-calls")" -ge 2 ]
    [ -f "$GH_STATE_DIR/dispatched" ]
    [[ "$output" == *'runUrl: https://example.invalid/runs/101'* ]]
    [[ "$output" == *'buildType: workflow'* ]]
}

@test "rejects ambiguous fresh deployment candidates" {
    create_empty_target

    ADOPT_EMPTY=true RUN_MODE=ambiguous run run_installer

    [ "$status" -ne 0 ]
    [[ "$output" == *'ambiguous'* || "$output" == *'Ambiguous'* ]]
}

@test "fails when the fresh deployment concludes unsuccessfully" {
    create_empty_target

    ADOPT_EMPTY=true RUN_MODE=failure run run_installer

    [ "$status" -ne 0 ]
    [[ "$output" == *'failure'* ]]
}

@test "SCORECARDS_USE_EXISTING is rejected instead of silently supported" {
    create_empty_target

    SCORECARDS_USE_EXISTING=true run env \
        GITHUB_TOKEN=token-value-that-must-stay-secret \
        SCORECARDS_TARGET_REPO=acme/scorecards \
        SCORECARDS_AUTO_CONFIRM=true \
        SCORECARDS_USE_EXISTING=true \
        SCORECARDS_SOURCE_SHA="$EXPECTED_SOURCE_SHA" \
        PATH="$PATH" \
        bash "$SOURCE_REPO/scripts/install.sh"

    [ "$status" -ne 0 ]
    [[ "$output" == *'SCORECARDS_USE_EXISTING'* ]]
}

@test "waits through queued and in-progress deployments with null conclusions" {
    RUN_MODE=pending run run_installer

    [ "$status" -eq 0 ]
    [ "$(cat "$GH_STATE_DIR/run-calls")" -eq 3 ]
    [[ "$output" == *'runUrl: https://example.invalid/runs/101'* ]]
}

@test "uses the executing checkout despite an independent source override" {
    SCORECARDS_SOURCE_DIR="$TEST_TEMP_DIR/unrelated" run run_installer

    [ "$status" -eq 0 ]
    [[ "$output" == *"sourceSha: $EXPECTED_SOURCE_SHA"* ]]
}

@test "rejects deployed source HTML without compiled hashed assets" {
    printf '%s\n' '<script type="module" src="./src/main.tsx"></script>' > "$TEST_TEMP_DIR/site/index.html"

    run run_installer

    [ "$status" -ne 0 ]
    [[ "$output" != *'Installation Complete'* ]]
    [[ "$output" == *'Preserve refs'* ]]
}

@test "rejects missing compiled assets after successful deployment" {
    rm "$TEST_TEMP_DIR/site/assets/index-abcdefgh.js"

    run run_installer

    [ "$status" -ne 0 ]
    [[ "$output" != *'Installation Complete'* ]]
}

@test "rejects HTML fallback responses masquerading as compiled JavaScript" {
    printf '%s\n' '<!doctype html><title>Not an asset</title>' > "$TEST_TEMP_DIR/site/assets/index-abcdefgh.js"

    run run_installer

    [ "$status" -ne 0 ]
    [[ "$output" != *'Installation Complete'* ]]
}

@test "rejects a missing referenced module preload chunk" {
    rm "$TEST_TEMP_DIR/site/assets/vendor-abcdefgh.js"

    run run_installer

    [ "$status" -ne 0 ]
    [[ "$output" != *'Installation Complete'* ]]
}

@test "rejects known restricted Pages without browser-session mode before publication" {
    create_empty_target

    ADOPT_EMPTY=true PAGES_PUBLIC=false run run_installer

    [ "$status" -ne 0 ]
    [ -z "$($REAL_GIT --git-dir="$TARGET_REMOTE" for-each-ref)" ]
    [ ! -f "$GH_STATE_DIR/dispatched" ]
}

@test "rejects unattended browser-session mode without session input before creation" {
    SCORECARDS_PAGES_AUTH=browser-session run run_installer

    [ "$status" -ne 0 ]
    [ ! -f "$GH_STATE_DIR/repo-exists" ]
}
