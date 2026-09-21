#!/usr/bin/env bats

load helpers

setup() {
    export TEST_TEMP_DIR="$(mktemp -d)"
    source "$ACTION_LIB/common.sh"
    source "$ACTION_LIB/results-builder.sh"
    source "$ACTION_LIB/git-ops.sh"
    log_debug() { :; }
}

@test "a changed service SHA is meaningful even when status is unchanged" {
    old="$BATS_TEST_TMPDIR/old.json"
    new="$BATS_TEST_TMPDIR/new.json"
    cat > "$old" <<'JSON'
{"score":0,"checks":[{"check_id":"09-scorecard-badge","status":"fail","exit_code":1}],"evaluation":{"service_repository":"acme/payments","service_sha":"1111111111111111111111111111111111111111","suite_repository":"acme/scorecards","suite_sha":"2222222222222222222222222222222222222222","run_id":"10","run_attempt":1}}
JSON
    jq '.evaluation.service_sha="3333333333333333333333333333333333333333"' "$old" > "$new"

    run check_meaningful_changes "$old" "$new"

    [ "$status" -eq 0 ]
}

@test "run-only provenance churn is not meaningful" {
    old="$BATS_TEST_TMPDIR/old.json"
    new="$BATS_TEST_TMPDIR/new.json"
    cat > "$old" <<'JSON'
{"score":0,"checks":[{"check_id":"09-scorecard-badge","status":"fail","exit_code":1}],"evaluation":{"service_repository":"acme/payments","service_sha":"1111111111111111111111111111111111111111","suite_repository":"acme/scorecards","suite_sha":"2222222222222222222222222222222222222222","run_id":"10","run_attempt":1}}
JSON
    jq '.evaluation.run_id="11" | .evaluation.run_attempt=2' "$old" > "$new"

    run check_meaningful_changes "$old" "$new"

    [ "$status" -eq 1 ]
}

@test "a remediation capability change is meaningful" {
    old="$BATS_TEST_TMPDIR/old.json"
    new="$BATS_TEST_TMPDIR/new.json"
    cat > "$old" <<'JSON'
{"score":0,"checks":[{"check_id":"09-scorecard-badge","status":"fail","exit_code":1}]}
JSON
    jq '.checks[0].remediation={"version":1,"label":"Propose badge"}' "$old" > "$new"

    run check_meaningful_changes "$old" "$new"

    [ "$status" -eq 0 ]
}

@test "complete valid provenance is emitted without changing score status" {
    declare -A service_context=(
        [org]="acme" [repo]="payments" [name]="payments" [team]=""
        [service_sha]="1111111111111111111111111111111111111111"
    )
    declare -A score_context=(
        [score]=0 [rank]="bronze" [passed_checks]=0 [total_checks]=1
        [checks_hash]="hash" [checks_count]=1 [installed]=false
        [suite_repository]="acme/scorecards"
        [suite_sha]="2222222222222222222222222222222222222222"
        [run_id]="10" [run_attempt]=1
    )
    result=$(build_results_json service_context score_context "2026-01-01T00:00:00Z" "[]" '[{"check_id":"09-scorecard-badge","status":"fail"}]')

    [ "$(jq -r '.checks[0].status' <<< "$result")" = "fail" ]
    [ "$(jq -r '.evaluation.service_sha' <<< "$result")" = "1111111111111111111111111111111111111111" ]
    [ "$(jq -r '.evaluation.run_id' <<< "$result")" = "10" ]
}

@test "legacy inputs omit evaluation provenance" {
    declare -A service_context=(
        [org]="acme" [repo]="payments" [name]="payments" [team]=""
    )
    declare -A score_context=(
        [score]=0 [rank]="bronze" [passed_checks]=0 [total_checks]=1
        [checks_hash]="hash" [checks_count]=1 [installed]=false
    )
    result=$(build_results_json service_context score_context "2026-01-01T00:00:00Z" "[]" '[{"check_id":"09-scorecard-badge","status":"fail"}]')

    [ "$(jq -r 'has("evaluation")' <<< "$result")" = "false" ]
    [ "$(jq -r '.checks[0].status' <<< "$result")" = "fail" ]
}
