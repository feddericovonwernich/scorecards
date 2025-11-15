#!/usr/bin/env bats

load helpers

setup() {
    # Create temporary directory for test
    export TEST_TEMP_DIR="$(mktemp -d)"

    source "$ACTION_LIB/common.sh"
    source "$ACTION_LIB/file-finder.sh"
    export TEST_REPO="$TEST_TEMP_DIR/test-repo"
    mkdir -p "$TEST_REPO"
}

@test "find_readme finds README.md" {
    touch "$TEST_REPO/README.md"
    run find_readme "$TEST_REPO"
    [ "$status" -eq 0 ]
    [ "$output" = "README.md" ]
}

@test "find_readme finds readme.md" {
    touch "$TEST_REPO/readme.md"
    run find_readme "$TEST_REPO"
    [ "$status" -eq 0 ]
    [ "$output" = "readme.md" ]
}

@test "find_readme returns empty when no README exists" {
    run find_readme "$TEST_REPO"
    [ "$status" -eq 0 ]
    [ -z "$output" ]
}

@test "find_license finds LICENSE" {
    touch "$TEST_REPO/LICENSE"
    run find_license "$TEST_REPO"
    [ "$status" -eq 0 ]
    [ "$output" = "LICENSE" ]
}

@test "find_license finds LICENSE.md" {
    touch "$TEST_REPO/LICENSE.md"
    run find_license "$TEST_REPO"
    [ "$status" -eq 0 ]
    [ "$output" = "LICENSE.md" ]
}

@test "find_openapi_spec finds openapi.yaml" {
    touch "$TEST_REPO/openapi.yaml"
    run find_openapi_spec "$TEST_REPO"
    [ "$status" -eq 0 ]
    [ "$output" = "openapi.yaml" ]
}

@test "find_openapi_spec finds spec in subdirectory" {
    mkdir -p "$TEST_REPO/api"
    touch "$TEST_REPO/api/openapi.yml"
    run find_openapi_spec "$TEST_REPO"
    [ "$status" -eq 0 ]
    [ "$output" = "api/openapi.yml" ]
}
