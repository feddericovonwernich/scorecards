#!/usr/bin/env bats

load helpers

setup() {
    # Create temporary directory for test
    export TEST_TEMP_DIR="$(mktemp -d)"

    source "$ACTION_LIB/common.sh"
    source "$ACTION_LIB/config-parser.sh"
}

teardown() {
    [ -n "$TEST_TEMP_DIR" ] && rm -rf "$TEST_TEMP_DIR"
}

# Test parse_excluded_checks function
@test "parse_excluded_checks returns empty array for repo without config" {
    mkdir -p "$TEST_TEMP_DIR/no-config-repo"

    run parse_excluded_checks "$TEST_TEMP_DIR/no-config-repo"
    [ "$status" -eq 0 ]
    [[ "$output" == "[]" ]]
}

@test "parse_excluded_checks returns empty array for config without exclusions" {
    mkdir -p "$TEST_TEMP_DIR/basic-repo/.scorecard"
    cat > "$TEST_TEMP_DIR/basic-repo/.scorecard/config.yml" << 'EOF'
name: test-service
team: backend
EOF

    run parse_excluded_checks "$TEST_TEMP_DIR/basic-repo"
    [ "$status" -eq 0 ]
    [[ "$output" == "[]" ]]
}

@test "parse_excluded_checks parses single exclusion" {
    mkdir -p "$TEST_TEMP_DIR/single-exclusion/.scorecard"
    cat > "$TEST_TEMP_DIR/single-exclusion/.scorecard/config.yml" << 'EOF'
name: test-service
excluded_checks:
  - check: 01-readme
    reason: Not applicable for internal library
EOF

    run parse_excluded_checks "$TEST_TEMP_DIR/single-exclusion"
    [ "$status" -eq 0 ]
    # Should return JSON array with one item
    echo "Output: $output"
    [[ "$output" == *'"check"'* ]]
    [[ "$output" == *'"01-readme"'* ]]
    [[ "$output" == *'"reason"'* ]]
    [[ "$output" == *'"Not applicable for internal library"'* ]]
}

@test "parse_excluded_checks parses multiple exclusions" {
    mkdir -p "$TEST_TEMP_DIR/multi-exclusion/.scorecard"
    cat > "$TEST_TEMP_DIR/multi-exclusion/.scorecard/config.yml" << 'EOF'
name: test-service
excluded_checks:
  - check: 06-openapi-spec
    reason: Internal library - no API
  - check: 07-openapi-quality
    reason: Internal library - no API
EOF

    run parse_excluded_checks "$TEST_TEMP_DIR/multi-exclusion"
    [ "$status" -eq 0 ]
    # Should return JSON array with two items
    echo "Output: $output"
    [[ "$output" == *'"06-openapi-spec"'* ]]
    [[ "$output" == *'"07-openapi-quality"'* ]]
}

@test "parse_excluded_checks ignores exclusion without reason (reason is required)" {
    mkdir -p "$TEST_TEMP_DIR/no-reason/.scorecard"
    cat > "$TEST_TEMP_DIR/no-reason/.scorecard/config.yml" << 'EOF'
name: test-service
excluded_checks:
  - check: 01-readme
EOF

    run parse_excluded_checks "$TEST_TEMP_DIR/no-reason"
    [ "$status" -eq 0 ]
    # Exclusions without reason are ignored (reason is required)
    echo "Output: $output"
    [[ "$output" == "[]" ]]
}

# Test get_excluded_check_ids function
@test "get_excluded_check_ids returns comma-separated list" {
    mkdir -p "$TEST_TEMP_DIR/ids-test/.scorecard"
    cat > "$TEST_TEMP_DIR/ids-test/.scorecard/config.yml" << 'EOF'
name: test-service
excluded_checks:
  - check: 06-openapi-spec
    reason: No API
  - check: 07-openapi-quality
    reason: No API
EOF

    # get_excluded_check_ids takes a repo path, not JSON
    run get_excluded_check_ids "$TEST_TEMP_DIR/ids-test"
    [ "$status" -eq 0 ]
    # Should return comma-separated list
    echo "Output: $output"
    [[ "$output" == "06-openapi-spec,07-openapi-quality" ]]
}

@test "get_excluded_check_ids returns empty string for repo without exclusions" {
    mkdir -p "$TEST_TEMP_DIR/no-exclusions-repo"

    run get_excluded_check_ids "$TEST_TEMP_DIR/no-exclusions-repo"
    [ "$status" -eq 0 ]
    [[ "$output" == "" ]]
}
