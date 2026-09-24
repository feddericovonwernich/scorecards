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

    export HASH_SUITE="$TEST_TEMP_DIR/hash-suite"
    mkdir -p "$HASH_SUITE/action/utils" "$HASH_SUITE/action/lib" "$HASH_SUITE/action/config" \
        "$HASH_SUITE/checks/01-valid" "$HASH_SUITE/checks/lib"
    cp "$PROJECT_ROOT/action/utils/validate-check.sh" "$PROJECT_ROOT/action/utils/update-checks-hash.sh" \
        "$HASH_SUITE/action/utils/"
    cp "$PROJECT_ROOT/action/lib/remediation.sh" "$HASH_SUITE/action/lib/"
    cp "$PROJECT_ROOT/action/config/check-metadata.json" "$PROJECT_ROOT/action/config/remediation.json" \
        "$HASH_SUITE/action/config/"
    cp "$VALID_CHECK/check.sh" "$VALID_CHECK/metadata.json" "$HASH_SUITE/checks/01-valid/"
    export SUITE_HASHER="$HASH_SUITE/action/utils/update-checks-hash.sh"
}


teardown() {
    rm -rf "$TEST_TEMP_DIR"
}

@test "validator projects canonical metadata" {
    run "$VALIDATOR" "$VALID_CHECK"

    [ "$status" -eq 0 ]
    [ "$(jq -cS . <<< "$output")" = '{"category":"Documentation","description":"Validates the canonical metadata contract.","name":"Valid check","timeout":30,"weight":10}' ]
}

@test "validator accepts a valid directory with trailing separators" {
    run "$VALIDATOR" "$VALID_CHECK///"

    [ "$status" -eq 0 ]
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

@test "validator rejects a metadata object stream without projection" {
    cat > "$VALID_CHECK/metadata.json" <<'JSON'
{}
{"name":"Valid check","description":"Validates the canonical metadata contract.","weight":10,"timeout":30,"category":"Documentation"}
JSON

    local stdout="$TEST_TEMP_DIR/stream.stdout"
    local stderr="$TEST_TEMP_DIR/stream.stderr"
    if "$VALIDATOR" "$VALID_CHECK" > "$stdout" 2> "$stderr"; then
        false
    else
        [ "$?" -eq 65 ]
    fi
    [ ! -s "$stdout" ]
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

@test "hasher keeps support directories in valid hash layouts" {
    local metadata_hash implementation_hash expected_hash
    metadata_hash="$(sha256sum "$HASH_SUITE/checks/01-valid/metadata.json" | awk '{print $1}')"
    implementation_hash="$(sha256sum "$HASH_SUITE/checks/01-valid/check.sh" | awk '{print $1}')"
    expected_hash="$(printf '01-valid:%s:%s\nlib::\n' "$metadata_hash" "$implementation_hash" | sha256sum | awk '{print $1}')"

    run "$SUITE_HASHER" --hash-only

    [ "$status" -eq 0 ]
    [ "$output" = "$expected_hash" ]
}

@test "hash bytes and directory count remain compatible" {
    run "$HASHER" --hash-only

    [ "$status" -eq 0 ]
    [ "$output" = "119f9cf9e608314410ba5cd46b95dc0d670354dbd9d079707b4bd9f09da21cba" ]
    [ "$(find "$PROJECT_ROOT/checks" -mindepth 1 -maxdepth 1 -type d | wc -l)" -eq 13 ]
}

@test "hasher rejects whitespace and newline candidate directories" {
    local invalid_name invalid_check
    for invalid_name in "99 invalid" $'99-\ninvalid' $'99-invalid\n'; do
        invalid_check="$HASH_SUITE/checks/$invalid_name"
        cp -a "$HASH_SUITE/checks/01-valid" "$invalid_check"

        run "$SUITE_HASHER" --hash-only

        rm -rf "$invalid_check"
        [ "$status" -eq 65 ]
    done
}
