#!/usr/bin/env bats

load helpers

setup() {
    export TEST_TEMP_DIR="$(mktemp -d)"
    export VALIDATOR="$PROJECT_ROOT/action/utils/validate-check.sh"
    export HASHER="$PROJECT_ROOT/action/utils/update-checks-hash.sh"
    export VALID_CHECK="$TEST_TEMP_DIR/01-valid"
    mkdir -p "$VALID_CHECK"
    printf '#!/bin/bash\nexit 0\n' > "$VALID_CHECK/check.sh"
    chmod +x "$VALID_CHECK/check.sh"
    cat > "$VALID_CHECK/metadata.json" <<'JSON'
{
  "name": "Valid check",
  "description": "Validates the canonical metadata contract.",
  "weight": 10,
  "timeout": 30,
  "category": "Documentation"
}
JSON
}

teardown() {
    rm -rf "$TEST_TEMP_DIR"
}

@test "validator projects canonical metadata" {
    run "$VALIDATOR" "$VALID_CHECK"

    [ "$status" -eq 0 ]
    [ "$(jq -cS . <<< "$output")" = '{"category":"Documentation","description":"Validates the canonical metadata contract.","name":"Valid check","timeout":30,"weight":10}' ]
}

@test "validator returns usage for a missing directory argument" {
    run "$VALIDATOR"

    [ "$status" -eq 64 ]
}

@test "validator rejects invalid JSON and incomplete metadata" {
    printf '{"name":' > "$VALID_CHECK/metadata.json"
    run "$VALIDATOR" "$VALID_CHECK"
    [ "$status" -eq 65 ]
    [[ "$output" == *"metadata.json"* ]]

    cat > "$VALID_CHECK/metadata.json" <<'JSON'
{"name":"Incomplete","description":"Missing category","weight":10,"timeout":30}
JSON
    run "$VALIDATOR" "$VALID_CHECK"
    [ "$status" -eq 65 ]
}

@test "validator rejects invalid metadata types ranges categories and keys" {
    local mutation
    for mutation in \
        '.weight = 1.5' \
        '.weight = 21' \
        '.timeout = 0' \
        '.category = "general"' \
        '.extra = true' \
        '.name = ""' \
        '.description = "bad\u0000value"'; do
        jq "$mutation" "$PROJECT_ROOT/checks/01-readme/metadata.json" > "$VALID_CHECK/metadata.json"
        run "$VALIDATOR" "$VALID_CHECK"
        [ "$status" -eq 65 ]
    done
}

@test "validator rejects invalid IDs and ambiguous check layouts" {
    local bad_id="$TEST_TEMP_DIR/Bad_ID"
    cp -a "$VALID_CHECK" "$bad_id"
    run "$VALIDATOR" "$bad_id"
    [ "$status" -eq 65 ]

    rm "$VALID_CHECK/check.sh"
    run "$VALIDATOR" "$VALID_CHECK"
    [ "$status" -eq 65 ]

    printf '#!/usr/bin/env python3\n' > "$VALID_CHECK/check.py"
    printf '#!/usr/bin/env node\n' > "$VALID_CHECK/check.js"
    run "$VALIDATOR" "$VALID_CHECK"
    [ "$status" -eq 65 ]
}

@test "validator rejects an invalid remediation descriptor" {
    cp "$PROJECT_ROOT/checks/09-scorecard-badge/check.sh" "$VALID_CHECK/check.sh"
    cp "$PROJECT_ROOT/checks/09-scorecard-badge/remediate.sh" "$VALID_CHECK/remediate.sh"
    chmod +x "$VALID_CHECK/remediate.sh"
    jq '.remediation = {version:1,label:"Unsafe",timeout:30,allowed_paths:[".github/workflows/ci.yml"]}' \
        "$PROJECT_ROOT/checks/09-scorecard-badge/metadata.json" > "$VALID_CHECK/metadata.json"

    run "$VALIDATOR" "$VALID_CHECK"
    [ "$status" -eq 65 ]
    [[ "$output" == *"remediation"* ]]
}

@test "all current check candidates satisfy the canonical contract" {
    local metadata check_dir count=0
    for metadata in "$PROJECT_ROOT"/checks/*/metadata.json; do
        check_dir="${metadata%/metadata.json}"
        run "$VALIDATOR" "$check_dir"
        [ "$status" -eq 0 ]
        count=$((count + 1))
    done
    [ "$count" -eq 12 ]
}

@test "support directories remain outside validation candidates" {
    [ ! -e "$PROJECT_ROOT/checks/lib/metadata.json" ]
    [ ! -e "$PROJECT_ROOT/checks/lib/check.sh" ]
    [ ! -e "$PROJECT_ROOT/checks/lib/check.py" ]
    [ ! -e "$PROJECT_ROOT/checks/lib/check.js" ]
}

@test "hash bytes and directory count remain compatible" {
    run "$HASHER" --hash-only

    [ "$status" -eq 0 ]
    [ "$output" = "119f9cf9e608314410ba5cd46b95dc0d670354dbd9d079707b4bd9f09da21cba" ]
    [ "$(find "$PROJECT_ROOT/checks" -mindepth 1 -maxdepth 1 -type d | wc -l)" -eq 13 ]
}
