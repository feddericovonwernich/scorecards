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
    if [ "$1" = reusable ]; then
        printf '%s\n' "$PROJECT_ROOT/.github/workflows/install.yml"
    else
        printf '%s\n' "$PROJECT_ROOT/.github/workflows/create-installation-pr.yml"
    fi
}

workflow_job() {
    if [ "$1" = reusable ]; then
        printf '%s\n' 'check-status'
    else
        printf '%s\n' 'create-pr'
    fi
}

mutation_job() {
    if [ "$1" = reusable ]; then
        printf '%s\n' 'create-installation-pr-placeholder'
    else
        printf '%s\n' 'create-pr'
    fi
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

    if [ "$variant" = reusable ]; then
        mkdir -p "$SERVICE_REPO/.scorecards-tmp/documentation/examples"
        cp "$PROJECT_ROOT/documentation/examples/scorecard-workflow-template.yml" \
            "$SERVICE_REPO/.scorecards-tmp/documentation/examples/scorecard-workflow-template.yml"
    else
        mkdir -p "$FIXTURE_ROOT/scorecards-repo/documentation/examples"
        cp "$PROJECT_ROOT/documentation/examples/scorecard-workflow-template.yml" \
            "$FIXTURE_ROOT/scorecards-repo/documentation/examples/scorecard-workflow-template.yml"
    fi

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
    local step_name='Create pull request'
    [ "$variant" != reusable ] || step_name='Create Pull Request'
    local script="$FIXTURE_ROOT/pr.sh"
    PR_OUTPUT="$FIXTURE_ROOT/pr-output"
    : > "$PR_OUTPUT"
    render_step "$(workflow_path "$variant")" "$(mutation_job "$variant")" "$step_name" "$script" true
    run bash -c 'cd "$1" && GH_TOKEN=fake GH_TOKEN_RAW=fake INSTALL_BRANCH=scorecards-install-123-2 GITHUB_REF=refs/heads/main GITHUB_OUTPUT="$2" bash -eo pipefail "$3"' _ "$SERVICE_REPO" "$PR_OUTPUT" "$script"
}

assert_catalog_target() {
    node --input-type=module - "$1" <<'NODE'
import fs from 'node:fs';

import yaml from 'js-yaml';
const workflow = yaml.load(fs.readFileSync(process.argv[2], 'utf8'));
const steps = workflow.jobs.scorecard.steps;
if (steps.find((step) => step.name === 'Checkout Scorecards platform')?.with?.repository !== 'acme/scorecards') throw new Error('wrong checkout target');
if (steps.find((step) => step.name === 'Run Scorecards Action')?.with?.['scorecards-repo'] !== 'acme/scorecards') throw new Error('wrong action target');
NODE
}
run_results_summary() {
    local check_create="$1"
    local check_state="$2"
    local create_result="$3"
    local create_url="$4"
    local script="$FIXTURE_ROOT/results.sh"
    SUMMARY_OUTPUT="$FIXTURE_ROOT/summary.md"
    : > "$SUMMARY_OUTPUT"
    render_step "$(workflow_path reusable)" run-scorecards "Display Results" "$script" false
    node - "$script" "$check_create" "$check_state" "$create_result" "$create_url" <<'NODE'
import fs from 'node:fs';

const [path, createPr, prState, createResult, createUrl] = process.argv.slice(2);
const values = {
  '${{ needs.check-status.outputs.installed }}': 'false',
  '${{ needs.check-status.outputs.create-pr }}': createPr,
  '${{ needs.check-status.outputs.pr-state }}': prState,
  '${{ needs.check-status.outputs.pr-url }}': 'https://github.com/acme/service/pull/17',
  '${{ needs.create-installation-pr-placeholder.result }}': createResult,
  '${{ needs.create-installation-pr-placeholder.outputs.pr-url }}': createUrl,
};
fs.writeFileSync(
  path,
  fs.readFileSync(path, 'utf8').replace(/\$\{\{[^}]+\}\}/g, (expression) => values[expression] ?? ''),
);
NODE
    run bash -c 'GITHUB_STEP_SUMMARY="$1" bash -eo pipefail "$2"' _ "$SUMMARY_OUTPUT" "$script"
}

@test "both onboarding workflows render the selected central repository" {
    for variant in reusable central; do
        prepare_variant "$variant" target
        PR_STATE=NONE run_check_step "$variant" false
        [ "$status" -eq 0 ]
        run_prepare_step "$variant"
        [ "$status" -eq 0 ]
        run assert_catalog_target "$SERVICE_REPO/.github/workflows/scorecards.yml"
        [ "$status" -eq 0 ]
    done
}

@test "each onboarding workflow uses a non-cancelling target concurrency group" {
    run node --input-type=module - \
        "$PROJECT_ROOT/.github/workflows/install.yml" \
        "$PROJECT_ROOT/.github/workflows/create-installation-pr.yml" <<'NODE'
import fs from 'node:fs';
import yaml from 'js-yaml';

const [reusablePath, centralPath] = process.argv.slice(2);
const reusable = yaml.load(fs.readFileSync(reusablePath, 'utf8')).concurrency;
const central = yaml.load(fs.readFileSync(centralPath, 'utf8')).concurrency;
if (reusable?.group !== 'scorecards-install-${{ github.repository }}' || reusable['cancel-in-progress'] !== false) throw new Error('bad reusable concurrency');
if (central?.group !== 'scorecards-install-${{ inputs.org }}/${{ inputs.repo }}' || central['cancel-in-progress'] !== false) throw new Error('bad central concurrency');
NODE
    [ "$status" -eq 0 ]
}

@test "reusable workflow summary reports each installation PR lifecycle outcome" {
    prepare_variant reusable summary

    run_results_summary false OPEN skipped ''
    [ "$status" -eq 0 ]
    grep -q 'Reusing the existing' "$SUMMARY_OUTPUT"

    run_results_summary false MERGED skipped ''
    [ "$status" -eq 0 ]
    grep -q 'Previous installation PR is MERGED; it was respected' "$SUMMARY_OUTPUT"

    run_results_summary true '' success 'https://github.com/acme/service/pull/18'
    [ "$status" -eq 0 ]
    grep -q 'installation PR.*was created' "$SUMMARY_OUTPUT"

    run_results_summary true '' failure ''
    [ "$status" -eq 0 ]
    grep -q 'Installation PR creation did not complete successfully' "$SUMMARY_OUTPUT"
}

@test "an open installation PR is returned without creating a branch or PR" {
    for variant in reusable central; do
        prepare_variant "$variant" open
        PR_STATE=OPEN run_check_step "$variant" false
        [ "$status" -eq 0 ]
        [ "$(output_value "$CHECK_OUTPUT" create-pr)" = false ]
        [ "$(output_value "$CHECK_OUTPUT" pr-url)" = 'https://github.com/acme/service/pull/17' ]
        [ -z "$(git --git-dir="$SERVICE_REMOTE" for-each-ref --format='%(refname)' 'refs/heads/scorecards-install-*')" ]
        ! grep -q 'pr create' "$GH_LOG"
    done
}

@test "a closed installation PR is respected unless retry is explicit" {
    for variant in reusable central; do
        prepare_variant "$variant" closed
        PR_STATE=CLOSED run_check_step "$variant" false
        [ "$status" -eq 0 ]
        [ "$(output_value "$CHECK_OUTPUT" create-pr)" = false ]
        [ -z "$(git --git-dir="$SERVICE_REMOTE" for-each-ref --format='%(refname)' 'refs/heads/scorecards-install-*')" ]
        ! grep -q 'pr create' "$GH_LOG"
    done
}

@test "an open installation PR wins over newer closed or merged PRs" {
    local open_pr='[{"number":17,"state":"OPEN","title":"Install Scorecards","headRefName":"scorecards-install-open","url":"https://github.com/acme/service/pull/17"}]'
    local newer_history='[{"number":19,"state":"MERGED","title":"Install Scorecards","headRefName":"scorecards-install-merged","url":"https://github.com/acme/service/pull/19"}]'

    for variant in reusable central; do
        prepare_variant "$variant" open-wins
        GH_OPEN_PRS="$open_pr" GH_ALL_PRS="$newer_history" run_check_step "$variant" false
        [ "$status" -eq 0 ]
        [ "$(output_value "$CHECK_OUTPUT" create-pr)" = false ]
        [ "$(output_value "$CHECK_OUTPUT" pr-number)" = 17 ]
        [ "$(output_value "$CHECK_OUTPUT" pr-state)" = OPEN ]
        ! grep -q -- '--state all' "$GH_LOG"
    done
}

@test "explicit retry creates one unique matching branch and pull request" {
    for variant in reusable central; do
        prepare_variant "$variant" retry
        PR_STATE=CLOSED run_check_step "$variant" true
        [ "$status" -eq 0 ]
        [ "$(output_value "$CHECK_OUTPUT" create-pr)" = true ]
        run_prepare_step "$variant"
        [ "$status" -eq 0 ]
        [ "$(output_value "$PREPARE_OUTPUT" install-branch)" = scorecards-install-123-2 ]
        git --git-dir="$SERVICE_REMOTE" rev-parse --verify refs/heads/scorecards-install-123-2 >/dev/null
        run_pr_step "$variant"
        [ "$status" -eq 0 ]
        grep -q 'pr create .*--head scorecards-install-123-2' "$GH_LOG"
        [ "$(output_value "$PR_OUTPUT" pr-url)" = 'https://github.com/acme/service/pull/18' ]
    done
}

@test "explicit retry preserves a stale installation branch" {
    for variant in reusable central; do
        prepare_variant "$variant" stale
        git -C "$FIXTURE_ROOT/seed" branch scorecards-install
        git -C "$FIXTURE_ROOT/seed" push origin scorecards-install >/dev/null
        local stale_sha
        stale_sha="$(git --git-dir="$SERVICE_REMOTE" rev-parse refs/heads/scorecards-install)"
        git -C "$SERVICE_REPO" fetch origin >/dev/null

        PR_STATE=CLOSED run_check_step "$variant" true
        [ "$status" -eq 0 ]
        run_prepare_step "$variant"
        [ "$status" -eq 0 ]
        [ "$stale_sha" = "$(git --git-dir="$SERVICE_REMOTE" rev-parse refs/heads/scorecards-install)" ]
        git --git-dir="$SERVICE_REMOTE" rev-parse --verify refs/heads/scorecards-install-123-2 >/dev/null
    done
}

@test "push rejection prevents pull request creation and success outputs" {
    for variant in reusable central; do
        prepare_variant "$variant" rejection
        mkdir -p "$SERVICE_REMOTE/hooks"
        cat > "$SERVICE_REMOTE/hooks/pre-receive" <<'HOOK'
#!/bin/bash
while read -r old new ref; do
    case "$ref" in refs/heads/scorecards-install-*) exit 1 ;; esac
done
HOOK
        chmod +x "$SERVICE_REMOTE/hooks/pre-receive"

        PR_STATE=NONE run_check_step "$variant" false
        [ "$status" -eq 0 ]
        run_prepare_step "$variant"
        [ "$status" -ne 0 ]
        ! grep -q 'pr create' "$GH_LOG"
        ! grep -q '^install-branch=' "$PREPARE_OUTPUT"
    done
}
