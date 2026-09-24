#!/usr/bin/env bats

load helpers

setup() {
    export TEST_TEMP_DIR="$(mktemp -d)"
    export SYSTEM_PATH="$PATH"
}

teardown() {
    rm -rf "$TEST_TEMP_DIR"
}

workflow_path() {
    printf '%s\n' "$PROJECT_ROOT/.github/workflows/create-installation-pr.yml"
}

workflow_job() {
    printf '%s\n' 'create-pr'
}

mutation_job() {
    printf '%s\n' 'create-pr'
}

render_step() {
    node --input-type=module - "$1" "$2" "$3" "$4" "$5" <<'NODE'
import fs from 'node:fs';
import yaml from 'js-yaml';

const [workflowPath, jobName, stepName, outputPath, retryClosed] = process.argv.slice(2);
const workflow = yaml.load(fs.readFileSync(workflowPath, 'utf8'));
const step = workflow.jobs[jobName].steps.find((candidate) => candidate.name === stepName);
if (!step?.run) throw new Error(`Missing runnable ${stepName} step`);

fs.writeFileSync(
  outputPath,
  step.run
    .replaceAll('${{ inputs.scorecards-repo }}', 'acme/scorecards')
    .replaceAll('${{ inputs.scorecards-branch }}', 'catalog')
    .replaceAll('${{ inputs.org }}', 'acme')
    .replaceAll('${{ inputs.repo }}', 'service')
    .replaceAll('${{ inputs.retry-closed }}', retryClosed),
);
NODE
}

output_value() {
    local file="$1"
    local name="$2"
    local key value
    while IFS='=' read -r key value; do
        if [ "$key" = "$name" ]; then
            printf '%s\n' "$value"
            return 0
        fi
    done < "$file"
    return 1
}

prepare_variant() {
    local variant="$1"
    local suffix="$2"
    FIXTURE_ROOT="$TEST_TEMP_DIR/$variant-$suffix"
    SERVICE_REMOTE="$FIXTURE_ROOT/service.git"
    SERVICE_REPO="$FIXTURE_ROOT/service-repo"
    GH_LOG="$FIXTURE_ROOT/gh.log"
    mkdir -p "$FIXTURE_ROOT/bin"

    git init --bare "$SERVICE_REMOTE" >/dev/null
    git init -b main "$FIXTURE_ROOT/seed" >/dev/null
    git -C "$FIXTURE_ROOT/seed" config user.name tester
    git -C "$FIXTURE_ROOT/seed" config user.email tester@example.invalid
    touch "$FIXTURE_ROOT/seed/.keep"
    git -C "$FIXTURE_ROOT/seed" add .keep
    git -C "$FIXTURE_ROOT/seed" commit -m seed >/dev/null
    git -C "$FIXTURE_ROOT/seed" remote add origin "$SERVICE_REMOTE"
    git -C "$FIXTURE_ROOT/seed" push origin main >/dev/null
    git --git-dir="$SERVICE_REMOTE" symbolic-ref HEAD refs/heads/main
    git clone "$SERVICE_REMOTE" "$SERVICE_REPO" >/dev/null

    mkdir -p "$FIXTURE_ROOT/scorecards-repo/documentation/examples"
    cp "$PROJECT_ROOT/documentation/examples/scorecard-workflow-template.yml" \
        "$FIXTURE_ROOT/scorecards-repo/documentation/examples/scorecard-workflow-template.yml"

    cat > "$FIXTURE_ROOT/bin/gh" <<'STUB'
#!/bin/bash
printf '%q ' "$@" >> "$GH_LOG"
printf '\n' >> "$GH_LOG"
case "$1 $2" in
    "pr list")
        case "$*" in
            *"--state open"*)
                if [ -n "${GH_OPEN_PRS+x}" ]; then printf '%s\n' "$GH_OPEN_PRS"
                elif [ "${PR_STATE:-NONE}" = OPEN ]; then printf '%s\n' '[{"number":17,"state":"OPEN","title":"Install Scorecards","headRefName":"scorecards-install-old","url":"https://github.com/acme/service/pull/17"}]'
                else printf '%s\n' '[]'; fi
                ;;
            *"--state all"*)
                if [ -n "${GH_ALL_PRS+x}" ]; then printf '%s\n' "$GH_ALL_PRS"
                elif [ "${PR_STATE:-NONE}" = NONE ]; then printf '%s\n' '[]'
                else printf '[{"number":17,"state":"%s","title":"Install Scorecards","headRefName":"scorecards-install-old","url":"https://github.com/acme/service/pull/17"}]\n' "$PR_STATE"; fi
                ;;
            *) printf '%s\n' '[]' ;;
        esac
        ;;
    "label create") ;;
    "pr create") printf '%s\n' 'https://github.com/acme/service/pull/18' ;;
    *) printf 'unexpected gh invocation: %s\n' "$*" >&2; exit 2 ;;
esac
STUB
    chmod +x "$FIXTURE_ROOT/bin/gh"
    export PATH="$FIXTURE_ROOT/bin:$SYSTEM_PATH"
    export GH_LOG
    : > "$GH_LOG"
}

run_check_step() {
    local variant="$1"
    local retry_closed="$2"
    local script="$FIXTURE_ROOT/check.sh"
    CHECK_OUTPUT="$FIXTURE_ROOT/check-output"
    : > "$CHECK_OUTPUT"
    render_step "$(workflow_path "$variant")" "$(workflow_job "$variant")" "Check installation status" "$script" "$retry_closed"
    run bash -c 'cd "$1" && GITHUB_OUTPUT="$2" bash -eo pipefail "$3"' _ "$SERVICE_REPO" "$CHECK_OUTPUT" "$script"
}

run_prepare_step() {
    local variant="$1"
    local script="$FIXTURE_ROOT/prepare.sh"
    PREPARE_OUTPUT="$FIXTURE_ROOT/prepare-output"
    : > "$PREPARE_OUTPUT"
    render_step "$(workflow_path "$variant")" "$(mutation_job "$variant")" "Create installation branch and files" "$script" true
    run bash -c 'cd "$1" && GITHUB_RUN_ID=123 GITHUB_RUN_ATTEMPT=2 GITHUB_REPOSITORY=acme/service GITHUB_OUTPUT="$2" bash -eo pipefail "$3"' _ "$SERVICE_REPO" "$PREPARE_OUTPUT" "$script"
}

run_pr_step() {
    local variant="$1"
    local script="$FIXTURE_ROOT/pr.sh"
    PR_OUTPUT="$FIXTURE_ROOT/pr-output"
    : > "$PR_OUTPUT"
    render_step "$(workflow_path "$variant")" "$(mutation_job "$variant")" "Create pull request" "$script" true
    run bash -c 'cd "$1" && GH_TOKEN=fake GH_TOKEN_RAW=fake INSTALL_BRANCH=scorecards-install-123-2 GITHUB_REF=refs/heads/main GITHUB_OUTPUT="$2" bash -eo pipefail "$3"' _ "$SERVICE_REPO" "$PR_OUTPUT" "$script"
}

@test "simultaneous central and service requests create one PR and reuse its result" {
    run node "$PROJECT_ROOT/tests/fixtures/installation-owner.mjs" concurrent
    [ "$status" -eq 0 ]
}

@test "service requests reject failed cancelled timed out and artifactless owners" {
    for mode in failure cancelled timeout missing-artifact; do
        mkdir -p "$TEST_TEMP_DIR/$mode"
        run env TEST_TEMP_DIR="$TEST_TEMP_DIR/$mode" node "$PROJECT_ROOT/tests/fixtures/installation-owner.mjs" "$mode"
        [ "$status" -eq 0 ]
    done
}

@test "the owner respects closed PRs and retries on distinct branches" {
    prepare_variant central retry
    git -C "$FIXTURE_ROOT/seed" push origin main:scorecards-install >/dev/null
    local previous_sha
    previous_sha="$(git --git-dir="$SERVICE_REMOTE" rev-parse refs/heads/scorecards-install)"
    for previous_state in CLOSED MERGED; do
        PR_STATE="$previous_state" run_check_step central false
        [ "$status" -eq 0 ]
        [ "$(output_value "$CHECK_OUTPUT" create-pr)" = false ]
    done
    PR_STATE=CLOSED run_check_step central true
    [ "$status" -eq 0 ]
    [ "$(output_value "$CHECK_OUTPUT" create-pr)" = true ]
    run_prepare_step central
    [ "$status" -eq 0 ]
    [ "$(output_value "$PREPARE_OUTPUT" install-branch)" = scorecards-install-123-2 ]
    git --git-dir="$SERVICE_REMOTE" rev-parse --verify refs/heads/scorecards-install-123-2 >/dev/null
    [ "$previous_sha" = "$(git --git-dir="$SERVICE_REMOTE" rev-parse refs/heads/scorecards-install)" ]
    run_pr_step central
    [ "$status" -eq 0 ]
    [ "$(output_value "$PR_OUTPUT" pr-url)" = 'https://github.com/acme/service/pull/18' ]
}

@test "an open installation PR wins over closed history" {
    prepare_variant central open
    GH_OPEN_PRS='[{"number":17,"state":"OPEN","url":"https://github.com/acme/service/pull/17"}]' \
        GH_ALL_PRS='[{"number":19,"state":"CLOSED","url":"https://github.com/acme/service/pull/19"}]' \
        run_check_step central true
    [ "$status" -eq 0 ]
    [ "$(output_value "$CHECK_OUTPUT" create-pr)" = false ]
    [ "$(output_value "$CHECK_OUTPUT" pr-number)" = 17 ]
    [ -z "$(git --git-dir="$SERVICE_REMOTE" for-each-ref --format='%(refname)' 'refs/heads/scorecards-install-*')" ]
}

@test "owner branch push failure does not create a PR" {
    prepare_variant central rejection
    mkdir -p "$SERVICE_REMOTE/hooks"
    cat > "$SERVICE_REMOTE/hooks/pre-receive" <<'HOOK'
#!/bin/bash
while read -r old new ref; do
    case "$ref" in refs/heads/scorecards-install-*) exit 1 ;; esac
done
HOOK
    chmod +x "$SERVICE_REMOTE/hooks/pre-receive"
    PR_STATE=NONE run_check_step central false
    [ "$status" -eq 0 ]
    run_prepare_step central
    [ "$status" -ne 0 ]
    ! grep -q 'pr create' "$GH_LOG"
}
