#!/usr/bin/env bats

load helpers

setup() {
    export TEST_TEMP_DIR="$(mktemp -d)"
}

teardown() {
    rm -rf "$TEST_TEMP_DIR"
}

render_template_step() {
    node --input-type=module - "$1" "$2" "$3" "$4" "$5" "$6" "$7" <<'NODE'
import fs from 'node:fs';
import yaml from 'js-yaml';

const [workflowPath, jobName, stepName, outputPath, repository, branch, prBranch] = process.argv.slice(2);
const workflow = yaml.load(fs.readFileSync(workflowPath, 'utf8'));
const step = workflow.jobs[jobName].steps.find((candidate) => candidate.name === stepName);

if (!step?.run) throw new Error(`Missing runnable ${stepName} step`);

fs.writeFileSync(
  outputPath,
  step.run
    .replaceAll('${{ inputs.scorecards-repo }}', repository)
    .replaceAll('${{ inputs.scorecards-branch }}', branch)
    .replaceAll('${{ inputs.org }}', 'acme')
    .replaceAll('${{ inputs.repo }}', 'service')
    .replaceAll('${{ steps.check.outputs.pr-branch }}', prBranch),
);
NODE
}

assert_catalog_target() {
    node --input-type=module - "$1" <<'NODE'
import fs from 'node:fs';
import yaml from 'js-yaml';

const workflow = yaml.load(fs.readFileSync(process.argv[2], 'utf8'));
const steps = workflow.jobs.scorecard.steps;
const checkout = steps.find((step) => step.name === 'Checkout Scorecards platform');
const action = steps.find((step) => step.name === 'Run Scorecards Action');

if (checkout?.with?.repository !== 'acme/scorecards') throw new Error('Central checkout did not use the selected repository');
if (action?.with?.['scorecards-repo'] !== 'acme/scorecards') throw new Error('Action catalog target did not use the selected repository');
NODE
}

create_service_clone() {
    local remote="$1"
    local seed="$TEST_TEMP_DIR/seed"
    local service="$2"

    git init --bare "$remote" >/dev/null
    git init "$seed" >/dev/null
    git -C "$seed" config user.name tester
    git -C "$seed" config user.email tester@example.invalid
    touch "$seed/.keep"
    git -C "$seed" add .keep
    git -C "$seed" commit -m seed >/dev/null
    git -C "$seed" branch -M main
    git -C "$seed" remote add origin "$remote"
    git -C "$seed" push origin main >/dev/null
    git --git-dir="$remote" symbolic-ref HEAD refs/heads/main
    git clone "$remote" "$service" >/dev/null
}

@test "catalog and reusable installers generate workflows for the selected repository" {
    local template="$PROJECT_ROOT/documentation/examples/scorecard-workflow-template.yml"
    local repository="acme/scorecards"
    local catalog_root="$TEST_TEMP_DIR/catalog"
    local catalog_service="$catalog_root/service-repo"
    local catalog_template_root="$catalog_root/scorecards-repo"
    local catalog_script="$catalog_root/template-step.sh"
    local reusable_service="$TEST_TEMP_DIR/reusable/service-repo"
    local reusable_script="$TEST_TEMP_DIR/reusable/template-step.sh"

    mkdir -p "$catalog_root"
    create_service_clone "$catalog_root/service.git" "$catalog_service"
    mkdir -p "$catalog_template_root/documentation/examples"
    cp "$template" "$catalog_template_root/documentation/examples/scorecard-workflow-template.yml"
    render_template_step "$PROJECT_ROOT/.github/workflows/create-installation-pr.yml" create-pr "Create installation branch and files" "$catalog_script" "$repository" catalog ""

    run bash -c 'cd "$1" && GITHUB_OUTPUT="$2" bash "$3"' _ "$catalog_service" "$catalog_root/github-output" "$catalog_script"
    [ "$status" -eq 0 ]
    run assert_catalog_target "$catalog_service/.github/workflows/scorecards.yml"
    [ "$status" -eq 0 ]

    mkdir -p "$reusable_service/.scorecards-tmp/documentation/examples"
    cp "$template" "$reusable_service/.scorecards-tmp/documentation/examples/scorecard-workflow-template.yml"
    render_template_step "$PROJECT_ROOT/.github/workflows/install.yml" create-installation-pr-placeholder "Copy workflow template" "$reusable_script" "$repository" catalog ""

    run bash -c 'cd "$1" && bash "$2"' _ "$reusable_service" "$reusable_script"
    [ "$status" -eq 0 ]
    run assert_catalog_target "$reusable_service/.github/workflows/scorecards.yml"
    [ "$status" -eq 0 ]
}
