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
    export TEST_BIN="$TEST_TEMP_DIR/bin"
    mkdir -p "$SOURCE_REPO/scripts" "$SOURCE_REPO/docs" "$SOURCE_REPO/.github/workflows" "$GH_STATE_DIR" "$TEST_BIN"

    cp "$PROJECT_ROOT/scripts/install.sh" "$SOURCE_REPO/scripts/install.sh"
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
    export EXPECTED_SOURCE_SHA
    EXPECTED_SOURCE_SHA="$($REAL_GIT -C "$SOURCE_REPO" rev-parse HEAD)"

    cat > "$TEST_BIN/git" <<'STUB'
#!/bin/bash
printf '%q ' "$@" >> "$GIT_LOG"
printf '\n' >> "$GIT_LOG"
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
    *"actions/permissions"*) printf '%s\n' 'enabled'; exit 0 ;;
    *"--method POST"*"/pages"*|*"-X POST"*"/pages"*) touch "$GH_STATE_DIR/pages"; exit 0 ;;
    *"--method PUT"*"/pages"*|*"-X PUT"*"/pages"*) touch "$GH_STATE_DIR/pages"; exit 0 ;;
    *"/pages"*)
        if [ -f "$GH_STATE_DIR/pages" ] || [ "${PAGES_MODE:-missing}" != missing ]; then
            if [ "${PAGES_MODE:-workflow}" = legacy ] && [ ! -f "$GH_STATE_DIR/pages" ]; then
                printf '%s\n' $'legacy\tbuilt\thttps://acme.github.io/scorecards/'
            else
                printf '%s\n' $'workflow\tbuilt\thttps://acme.github.io/scorecards/'
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
            printf '101\tcompleted\tsuccess\thttps://example.invalid/runs/101\t%s\t%s\n' "$sha" "$created_at"
            printf '102\tcompleted\tsuccess\thttps://example.invalid/runs/102\t%s\t%s\n' "$sha" "$created_at"
        elif [ "${RUN_MODE:-success}" = failure ]; then
            printf '101\tcompleted\tfailure\thttps://example.invalid/runs/101\t%s\t%s\n' "$sha" "$created_at"
        else
            printf '101\tcompleted\tsuccess\thttps://example.invalid/runs/101\t%s\t%s\n' "$sha" "$created_at"
        fi
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
}

teardown() {
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
        SCORECARDS_REPO_PRIVATE=false \
        SCORECARDS_ADOPT_EMPTY_REPO="${ADOPT_EMPTY:-false}" \
        SCORECARDS_SOURCE_DIR="$SOURCE_REPO" \
        SCORECARDS_SOURCE_SHA="$EXPECTED_SOURCE_SHA" \
        SCORECARDS_SOURCE_REPO="$SOURCE_REPO" \
        INSTALL_POLL_INTERVAL_SECONDS=0 \
        INSTALL_DEPLOY_TIMEOUT_SECONDS="${DEPLOY_TIMEOUT:-2}" \
        RUN_MODE="${RUN_MODE:-success}" \
        PAGES_MODE="${PAGES_MODE:-missing}" \
        GIT_CONFIG_COUNT=1 \
        GIT_CONFIG_KEY_0="url.file://$TARGET_REMOTE.insteadOf" \
        GIT_CONFIG_VALUE_0='https://github.com/acme/scorecards.git' \
        bash "$SOURCE_REPO/scripts/install.sh"
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

@test "publishes main and catalog together when adopting an empty repository" {
    create_empty_target

    ADOPT_EMPTY=true run run_installer

    [ "$status" -eq 0 ]
    "$REAL_GIT" --git-dir="$TARGET_REMOTE" rev-parse --verify refs/heads/main >/dev/null
    "$REAL_GIT" --git-dir="$TARGET_REMOTE" rev-parse --verify refs/heads/catalog >/dev/null
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
        SCORECARDS_SOURCE_DIR="$SOURCE_REPO" \
        SCORECARDS_SOURCE_SHA="$EXPECTED_SOURCE_SHA" \
        PATH="$PATH" \
        bash "$SOURCE_REPO/scripts/install.sh"

    [ "$status" -ne 0 ]
    [[ "$output" == *'SCORECARDS_USE_EXISTING'* ]]
}
