#!/usr/bin/env bats

load helpers

setup() {
    export TEST_TEMP_DIR="$(mktemp -d)"
    export RUNNER="$PROJECT_ROOT/action/utils/run-remediation.sh"
    export SUITE="$PROJECT_ROOT"
    export SUITE_SHA="$(git -C "$SUITE" rev-parse HEAD)"
    export PATH="$TEST_TEMP_DIR/bin:$PATH"
    mkdir -p "$TEST_TEMP_DIR/bin" "$TEST_TEMP_DIR/work"
    export GITHUB_REPOSITORY="acme/scorecards"
    export GITHUB_REF="refs/heads/main"
    export GITHUB_SHA="$(git -C "$SUITE" rev-parse HEAD)"
    export GITHUB_ACTOR="allowed"
    export GITHUB_TRIGGERING_ACTOR="allowed"
    export GITHUB_RUN_ID="42"
    export GITHUB_RUN_ATTEMPT="1"
    export SCORECARDS_WORKFLOW_TOKEN="test-token"
    export GH_TOKEN="$SCORECARDS_WORKFLOW_TOKEN"

    create_remote
    write_policy
    write_request
    write_gh
    write_docker
}

teardown() {
    rm -rf "$TEST_TEMP_DIR"
}

create_remote() {
    export REMOTE="$TEST_TEMP_DIR/service.git"
    local seed="$TEST_TEMP_DIR/seed"
    git init --bare "$REMOTE" >/dev/null
    git init "$seed" >/dev/null
    git -C "$seed" config user.name tester
    git -C "$seed" config user.email tester@example.invalid
    printf '# Service\n$Format:%%H$\n' > "$seed/README.md"
    printf 'README.md export-subst\ntracked-export-ignore export-ignore\n' > "$seed/.gitattributes"
    printf 'retained\n' > "$seed/tracked-export-ignore"
    git -C "$seed" add README.md .gitattributes tracked-export-ignore
    git -C "$seed" commit -m initial >/dev/null
    git -C "$seed" branch -M trunk
    git -C "$seed" remote add origin "$REMOTE"
    git -C "$seed" push origin trunk >/dev/null
    git --git-dir="$REMOTE" symbolic-ref HEAD refs/heads/trunk
    export BASE_SHA="$(git --git-dir="$REMOTE" rev-parse refs/heads/trunk)"
    export REMEDIATION_SERVICE_REMOTE_URL="$REMOTE"
}

write_policy() {
    export POLICY="$TEST_TEMP_DIR/policy.json"
    cat > "$POLICY" <<'JSON'
{
  "version": 1,
  "enabled": true,
  "timeout_max_seconds": 30,
  "diff_max_bytes": 1048576,
  "output_max_bytes": 65536,
  "memory_max_bytes": 134217728,
  "pids_max": 64,
  "cpu_max": "1",
  "runtime_image": "example.invalid/remediation@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "targets": {
    "acme/service": {
      "check_ids": ["09-scorecard-badge"],
      "actors": ["allowed"],
      "publisher_login": "publisher",
      "protection_evidence": "reviewed"
    }
  }
}
JSON
}

write_request() {
    export REQUEST="$TEST_TEMP_DIR/request.json"
    jq -n --arg suite "$SUITE_SHA" --arg service "$BASE_SHA" '{org:"acme",repo:"service",check_id:"09-scorecard-badge",service_sha:$service,suite_sha:$suite,request_id:"d2719c3d-50b4-4e03-a2b1-0b9258760e2d"}' > "$REQUEST"
}

write_gh() {
    cat > "$TEST_TEMP_DIR/bin/gh" <<'SH'
#!/bin/bash
set -euo pipefail
case " $* " in
  *" /user "*"--jq .login "*) printf '%s\n' publisher ;;
  *" /repos/acme/service/git/ref/heads/trunk "*"--jq .object.sha "*) printf '%s\n' "$BASE_SHA" ;;
  *" /repos/acme/service "*"--jq .default_branch "*) printf '%s\n' "${DEFAULT_BRANCH:-trunk}" ;;
  *" /repos/acme/scorecards/git/ref/heads/main "*"--jq .object.sha "*) printf '%s\n' "$GITHUB_SHA" ;;
  *" /repos/acme/scorecards "*"--jq .default_branch "*) printf '%s\n' main ;;
  *" /repos/acme/service/pulls?state=open"*)
    case "${GH_MODE:-}" in
      existing|mixedcase|ambiguous) ;;
      reconciledmixed) [ -f "$TEST_TEMP_DIR/gh-posted" ] || { printf '%s\n' '[]'; exit 0; } ;;
      *) printf '%s\n' '[]'; exit 0 ;;
    esac
    printf '%s\n' '[{"html_url":"https://github.com/acme/service/pull/1","body":"<!-- scorecards-remediation:v1 check_id=09-scorecard-badge -->","base":{"ref":"trunk"},"head":{"ref":"scorecards-remediation/09-scorecard-badge/old","repo":{"full_name":"acme/service"}},"user":{"login":"publisher"}}]' |
      jq 'if env.GH_MODE == "ambiguous" then . + [.[0] | .html_url = "https://github.com/acme/service/pull/2" | .head.ref = "scorecards-remediation/09-scorecard-badge/other"] elif env.GH_MODE == "mixedcase" then .[0].head.repo.full_name = "AcMe/SeRvIcE" elif env.GH_MODE == "reconciledmixed" then .[0].head.repo.full_name = "AcMe/SeRvIcE" | .[0].head.ref = "scorecards-remediation/09-scorecard-badge/42-1" else . end' ;;
  *" --method POST "*)
    if [ "${GH_MODE:-}" = created ]; then
      printf '%s\n' https://github.com/acme/service/pull/1
      exit 0
    fi
    [ "${GH_MODE:-}" = reconciledmixed ] && touch "$TEST_TEMP_DIR/gh-posted"
    exit 1 ;;
  *) printf '%s\n' '[]' ;;
esac
SH
    chmod +x "$TEST_TEMP_DIR/bin/gh"
}

write_docker() {
    cat > "$TEST_TEMP_DIR/bin/docker" <<'SH'
#!/bin/bash
set -euo pipefail
printf '%s\n' "$*" > "$DOCKER_ARGS"
for arg in "$@"; do
    case "$arg" in
        *dst=/workspace*) workspace="${arg#*src=}"; workspace="${workspace%%,dst=*}" ;;
        SERVICE_REPOSITORY=*|SCORECARDS_REPO=*|SCORECARDS_BRANCH=*) export "$arg" ;;
    esac
done
last="${!#}"
if [[ "$last" == */check.sh ]]; then
    SCORECARD_REPO_PATH="$workspace" bash "$PROJECT_ROOT/checks/09-scorecard-badge/check.sh"
    exit $?
fi
case "${DOCKER_MODE:-badge}" in
  badge) SCORECARD_REPO_PATH="$workspace" bash "$PROJECT_ROOT/checks/09-scorecard-badge/remediate.sh" ;;
  symlink) rm "$workspace/README.md"; ln -s /etc/passwd "$workspace/README.md" ;;
  modechange) chmod +x "$workspace/README.md" ;;
  noop) : ;;
  failure) exit 2 ;;
  wrongbadge) printf '\nnot a scorecard badge\n' >> "$workspace/README.md" ;;
  pathescape) mkdir -p "$workspace/.github/workflows"; printf 'name: unsafe\n' > "$workspace/.github/workflows/unsafe.yml" ;;
esac
SH
    chmod +x "$TEST_TEMP_DIR/bin/docker"
    export DOCKER_ARGS="$TEST_TEMP_DIR/docker.args"
}

@test "descriptor rejects an executable recipe without strict remediation metadata" {
    local check="$TEST_TEMP_DIR/check"
    mkdir -p "$check"
    printf '#!/bin/bash\n' > "$check/remediate.sh"
    chmod +x "$check/remediate.sh"
    printf '{"remediation":{}}\n' > "$check/metadata.json"

    run bash -c 'source "$1"; load_remediation_descriptor "$2" "$3"' _ "$PROJECT_ROOT/action/lib/remediation.sh" "$check" "$POLICY"
    [ "$status" -ne 0 ]
}

@test "descriptor rejects a dangling recipe sibling" {
    local check="$TEST_TEMP_DIR/check"
    mkdir -p "$check"
    cp "$PROJECT_ROOT/checks/09-scorecard-badge/metadata.json" "$check/metadata.json"
    printf '#!/bin/bash\n' > "$check/remediate.sh"
    chmod +x "$check/remediate.sh"
    ln -s missing "$check/remediate.py"

    run bash -c 'source "$1"; load_remediation_descriptor "$2" "$3"' _ "$PROJECT_ROOT/action/lib/remediation.sh" "$check" "$POLICY"
    [ "$status" -ne 0 ]
}

@test "descriptor returns null for legacy metadata without a recipe" {
    local check="$TEST_TEMP_DIR/check"
    mkdir -p "$check"
    printf '{"name":"legacy"}\n' > "$check/metadata.json"

    run bash -c 'source "$1"; load_remediation_descriptor "$2" "$3"' _ "$PROJECT_ROOT/action/lib/remediation.sh" "$check" "$POLICY"
    [ "$status" -eq 0 ]
    [ "$output" = "null" ]
}

@test "validate requires both the original and triggering actors to be allowlisted" {
    export GITHUB_TRIGGERING_ACTOR="other"

    run "$RUNNER" validate "$REQUEST" "$POLICY" "$SUITE"
    [ "$status" -ne 0 ]

    run env GITHUB_ACTOR=other GITHUB_TRIGGERING_ACTOR=allowed "$RUNNER" validate "$REQUEST" "$POLICY" "$SUITE"
    [ "$status" -ne 0 ]
}

@test "invalid sandbox diff is terminal and never creates a remote ref" {
    export DOCKER_MODE="symlink"
    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = "invalid_diff" ]
    [ "$(git --git-dir="$REMOTE" rev-parse refs/heads/trunk)" = "$BASE_SHA" ]
    ! git --git-dir="$REMOTE" show-ref --verify refs/heads/scorecards-remediation/09-scorecard-badge/42-1
}

@test "a path escape is invalid and leaves the default ref unchanged" {
    export DOCKER_MODE="pathescape"

    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = "invalid_diff" ]
    [ "$(git --git-dir="$REMOTE" rev-parse refs/heads/trunk)" = "$BASE_SHA" ]
}

@test "stale service SHA writes no ref" {
    jq '.service_sha = "0000000000000000000000000000000000000000"' "$REQUEST" > "$TEST_TEMP_DIR/stale.json"

    run "$RUNNER" prepare "$TEST_TEMP_DIR/stale.json" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = "stale_service" ]
    [ "$(git --git-dir="$REMOTE" rev-parse refs/heads/trunk)" = "$BASE_SHA" ]
}
@test "a tracked symlink is rejected before sandbox execution" {
    ln -s README.md "$TEST_TEMP_DIR/seed/readme-link"
    git -C "$TEST_TEMP_DIR/seed" add readme-link
    git -C "$TEST_TEMP_DIR/seed" commit -m symlink >/dev/null
    git -C "$TEST_TEMP_DIR/seed" push origin trunk >/dev/null
    export BASE_SHA="$(git --git-dir="$REMOTE" rev-parse refs/heads/trunk)"
    write_request

    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = invalid_diff ]
    [ ! -f "$DOCKER_ARGS" ]
    [ "$(git --git-dir="$REMOTE" for-each-ref refs/heads --format='%(refname)')" = refs/heads/trunk ]
}


@test "a mixed-case attributable PR prevents recipe execution and push" {
    export GH_MODE="mixedcase"

    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = "existing_pr" ]
    [ ! -f "$DOCKER_ARGS" ]
    [ "$(git --git-dir="$REMOTE" rev-parse refs/heads/trunk)" = "$BASE_SHA" ]
    [ "$(git --git-dir="$REMOTE" for-each-ref refs/heads --format='%(refname)')" = refs/heads/trunk ]
}

@test "a successful recipe with no diff has no prepared candidate" {
    export DOCKER_MODE="noop"

    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = "no_diff" ]
    [ ! -f "$TEST_TEMP_DIR/work/prepared.json" ]
}

@test "a recipe error writes execution_failed without a ref" {
    export DOCKER_MODE="failure"

    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = "execution_failed" ]
    [ "$(git --git-dir="$REMOTE" rev-parse refs/heads/trunk)" = "$BASE_SHA" ]
}

@test "a changed README that still fails the trusted post-check has no candidate" {
    export DOCKER_MODE="wrongbadge"

    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = "execution_failed" ]
    [ ! -f "$TEST_TEMP_DIR/work/prepared.json" ]
}

@test "PR API failure preserves the default branch and keeps only the remediation branch" {
    run bash -c 'umask 002; exec "$@"' _ "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ -f "$TEST_TEMP_DIR/work/prepared.json" ]


    run "$RUNNER" publish "$TEST_TEMP_DIR/work/prepared.json" "$POLICY" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = "pr_failed" ]
    [ "$(git --git-dir="$REMOTE" rev-parse refs/heads/trunk)" = "$BASE_SHA" ]
    git --git-dir="$REMOTE" show-ref --verify refs/heads/scorecards-remediation/09-scorecard-badge/42-1
    [ "$(git --git-dir="$REMOTE" for-each-ref refs/heads --format='%(refname)' | wc -l)" -eq 2 ]
}

@test "publication preserves literal exported source files" {
    export GH_MODE=created

    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    grep -Fqx '$Format:%H$' "$TEST_TEMP_DIR/work/baseline/README.md"
    [ -f "$TEST_TEMP_DIR/work/baseline/tracked-export-ignore" ]
    [ ! -e "$TEST_TEMP_DIR/work/tree/.git" ]

    run "$RUNNER" publish "$TEST_TEMP_DIR/work/prepared.json" "$POLICY" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = pr_created ]
    git --git-dir="$REMOTE" show refs/heads/scorecards-remediation/09-scorecard-badge/42-1:README.md | grep -Fqx '$Format:%H$'
    git --git-dir="$REMOTE" cat-file -e refs/heads/scorecards-remediation/09-scorecard-badge/42-1:tracked-export-ignore
    [ "$(git --git-dir="$REMOTE" rev-parse refs/heads/trunk)" = "$BASE_SHA" ]
}

@test "mixed-case catalog identity is preserved in the published badge URL" {
    export GH_MODE=created
    jq '.org = "Acme" | .repo = "Service"' "$REQUEST" > "$TEST_TEMP_DIR/mixed.json"

    run "$RUNNER" prepare "$TEST_TEMP_DIR/mixed.json" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .context.repository "$TEST_TEMP_DIR/work/prepared.json")" = acme/service ]

    run "$RUNNER" publish "$TEST_TEMP_DIR/work/prepared.json" "$POLICY" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = pr_created ]
    git --git-dir="$REMOTE" show refs/heads/scorecards-remediation/09-scorecard-badge/42-1:README.md |
        grep -Fq 'https://raw.githubusercontent.com/acme/scorecards/catalog/badges/Acme/Service/score.json'
    [ "$(git --git-dir="$REMOTE" rev-parse refs/heads/trunk)" = "$BASE_SHA" ]
}

@test "publication preserves validated README bytes with working-tree encoding" {
    export GH_MODE=created
    printf '# Service caf\351\n' > "$TEST_TEMP_DIR/seed/README.md"
    printf 'README.md working-tree-encoding=ISO-8859-1\n' > "$TEST_TEMP_DIR/seed/.gitattributes"
    chmod +x "$TEST_TEMP_DIR/seed/README.md"
    git -C "$TEST_TEMP_DIR/seed" add README.md .gitattributes
    git -C "$TEST_TEMP_DIR/seed" commit -m encoded >/dev/null
    git -C "$TEST_TEMP_DIR/seed" push origin trunk >/dev/null
    export BASE_SHA="$(git --git-dir="$REMOTE" rev-parse refs/heads/trunk)"
    write_request

    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    printf '# Service café\n' > "$TEST_TEMP_DIR/expected-baseline"
    cmp "$TEST_TEMP_DIR/expected-baseline" "$TEST_TEMP_DIR/work/baseline/README.md"

    run "$RUNNER" publish "$TEST_TEMP_DIR/work/prepared.json" "$POLICY" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = pr_created ]
    local proposal=refs/heads/scorecards-remediation/09-scorecard-badge/42-1
    git --git-dir="$REMOTE" show "$proposal:README.md" > "$TEST_TEMP_DIR/published-readme"
    cmp "$TEST_TEMP_DIR/work/tree/README.md" "$TEST_TEMP_DIR/published-readme"
    [ "$(git --git-dir="$REMOTE" ls-tree "$proposal" README.md | cut -d' ' -f1)" = 100755 ]
    [ "$(git --git-dir="$REMOTE" diff --name-only "$BASE_SHA" "$proposal")" = README.md ]
    [ "$(git --git-dir="$REMOTE" rev-parse refs/heads/trunk)" = "$BASE_SHA" ]
}

@test "a missing README is not applicable and creates no proposal" {
    git --git-dir="$REMOTE" update-ref -d refs/heads/trunk
    local empty="$TEST_TEMP_DIR/empty"
    git init "$empty" >/dev/null
    git -C "$empty" config user.name tester
    git -C "$empty" config user.email tester@example.invalid
    touch "$empty/.keep"
    git -C "$empty" add .keep
    git -C "$empty" commit -m empty >/dev/null
    git -C "$empty" branch -M trunk
    git -C "$empty" remote add origin "$REMOTE"
    git -C "$empty" push origin trunk >/dev/null
    export BASE_SHA="$(git --git-dir="$REMOTE" rev-parse refs/heads/trunk)"
    write_request

    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = "not_applicable" ]
    [ ! -f "$TEST_TEMP_DIR/work/prepared.json" ]
    [ "$(git --git-dir="$REMOTE" rev-parse refs/heads/trunk)" = "$BASE_SHA" ]
}

@test "badge recipe uses the catalog URL once and is idempotent" {
    export SCORECARD_REPO_PATH="$TEST_TEMP_DIR/seed"
    export SCORECARDS_REPO=acme/scorecards SERVICE_REPOSITORY=acme/service SCORECARDS_BRANCH=catalog
    run bash "$PROJECT_ROOT/checks/09-scorecard-badge/remediate.sh"
    [ "$status" -eq 0 ]
    grep -Fq 'https://raw.githubusercontent.com/acme/scorecards/catalog/badges/acme/service/score.json' "$SCORECARD_REPO_PATH/README.md"
    cp "$SCORECARD_REPO_PATH/README.md" "$TEST_TEMP_DIR/first-readme"
    run bash "$PROJECT_ROOT/checks/09-scorecard-badge/remediate.sh"
    [ "$status" -eq 0 ]
    cmp "$TEST_TEMP_DIR/first-readme" "$SCORECARD_REPO_PATH/README.md"
}

@test "case-ambiguous README files are not changed by the recipe" {
    export SCORECARD_REPO_PATH="$TEST_TEMP_DIR/seed"
    export SCORECARDS_REPO=acme/scorecards SERVICE_REPOSITORY=acme/service SCORECARDS_BRANCH=catalog
    cp "$SCORECARD_REPO_PATH/README.md" "$SCORECARD_REPO_PATH/readme.md"
    run bash "$PROJECT_ROOT/checks/09-scorecard-badge/remediate.sh"
    [ "$status" -eq 3 ]
    cmp "$SCORECARD_REPO_PATH/README.md" "$SCORECARD_REPO_PATH/readme.md"
}

@test "mode-only changes are rejected without a remote ref" {
    export DOCKER_MODE=modechange
    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = "invalid_diff" ]
    [ "$(git --git-dir="$REMOTE" for-each-ref refs/heads --format='%(refname)')" = "refs/heads/trunk" ]
}

@test "an obsolete suite reports stale_suite before any destination write" {
    jq '.suite_sha = "1111111111111111111111111111111111111111"' "$REQUEST" > "$REQUEST.new"
    mv "$REQUEST.new" "$REQUEST"
    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = stale_suite ]
    [ "$(git --git-dir="$REMOTE" for-each-ref refs/heads --format='%(refname)')" = refs/heads/trunk ]
}

@test "disabled policy reports unauthorized and cannot publish" {
    jq '.enabled = false' "$POLICY" > "$POLICY.new"
    mv "$POLICY.new" "$POLICY"
    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = unauthorized ]
    [ "$(git --git-dir="$REMOTE" for-each-ref refs/heads --format='%(refname)')" = refs/heads/trunk ]
}

@test "a proposal appearing after preparation prevents a duplicate push" {
    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    export GH_MODE=mixedcase
    run "$RUNNER" publish "$TEST_TEMP_DIR/work/prepared.json" "$POLICY" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = existing_pr ]
    [ "$(git --git-dir="$REMOTE" for-each-ref refs/heads --format='%(refname)')" = refs/heads/trunk ]
}

@test "mixed-case PR reconciliation reuses the attributable proposal" {
    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    export GH_MODE=reconciledmixed
    run "$RUNNER" publish "$TEST_TEMP_DIR/work/prepared.json" "$POLICY" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = existing_pr ]
    [ "$(git --git-dir="$REMOTE" rev-parse refs/heads/trunk)" = "$BASE_SHA" ]
}

@test "ambiguous attributable proposals never create another branch" {
    export GH_MODE=ambiguous
    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = ambiguous_existing_pr ]
    [ "$(git --git-dir="$REMOTE" for-each-ref refs/heads --format='%(refname)')" = refs/heads/trunk ]
}

@test "a default-branch rename after preparation aborts publication" {
    run "$RUNNER" prepare "$REQUEST" "$POLICY" "$SUITE" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    git --git-dir="$REMOTE" update-ref refs/heads/release "$BASE_SHA"
    git --git-dir="$REMOTE" symbolic-ref HEAD refs/heads/release
    export DEFAULT_BRANCH=release
    run "$RUNNER" publish "$TEST_TEMP_DIR/work/prepared.json" "$POLICY" "$TEST_TEMP_DIR/work"
    [ "$status" -eq 0 ]
    [ "$(jq -r .status "$TEST_TEMP_DIR/work/remediation-result.json")" = stale_service ]
    [ "$(git --git-dir="$REMOTE" rev-parse refs/heads/trunk)" = "$BASE_SHA" ]
    [ "$(git --git-dir="$REMOTE" rev-parse refs/heads/release)" = "$BASE_SHA" ]
    [ -z "$(git --git-dir="$REMOTE" for-each-ref refs/heads/scorecards-remediation --format='%(refname)')" ]
}

@test "repository casing shares a lock while executable inputs are rejected" {
    run "$RUNNER" validate "$REQUEST" "$POLICY" "$SUITE"
    [ "$status" -eq 0 ]
    local canonical_key="$(jq -r .repository_key <<< "$output")"
    jq '.org="ACME" | .repo="SERVICE"' "$REQUEST" > "$TEST_TEMP_DIR/mixed.json"
    run "$RUNNER" validate "$TEST_TEMP_DIR/mixed.json" "$POLICY" "$SUITE"
    [ "$status" -eq 0 ]
    [ "$(jq -r .repository <<< "$output")" = acme/service ]
    [ "$(jq -r .repository_key <<< "$output")" = "$canonical_key" ]

    jq '.check_id="../09-scorecard-badge"' "$REQUEST" > "$TEST_TEMP_DIR/traversal.json"
    run "$RUNNER" validate "$TEST_TEMP_DIR/traversal.json" "$POLICY" "$SUITE"
    [ "$status" -ne 0 ]
    jq '. + {script:"exit 0"}' "$REQUEST" > "$TEST_TEMP_DIR/code.json"
    run "$RUNNER" validate "$TEST_TEMP_DIR/code.json" "$POLICY" "$SUITE"
    [ "$status" -ne 0 ]
    [ "$(git --git-dir="$REMOTE" for-each-ref refs/heads --format='%(refname)')" = refs/heads/trunk ]
}
