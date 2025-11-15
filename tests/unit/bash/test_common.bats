#!/usr/bin/env bats

load helpers

setup() {
    # Create temporary directory for test
    export TEST_TEMP_DIR="$(mktemp -d)"

    source "$ACTION_LIB/common.sh"
}

@test "log_info outputs blue INFO message" {
    run log_info "test message"
    [ "$status" -eq 0 ]
    [[ "$output" == *"[INFO]"* ]]
    [[ "$output" == *"test message"* ]]
}

@test "log_success outputs green SUCCESS message" {
    run log_success "test message"
    [ "$status" -eq 0 ]
    [[ "$output" == *"[SUCCESS]"* ]]
    [[ "$output" == *"test message"* ]]
}

@test "log_error outputs red ERROR message" {
    run log_error "test message"
    [ "$status" -eq 0 ]
    [[ "$output" == *"[ERROR]"* ]]
    [[ "$output" == *"test message"* ]]
}

@test "command_exists returns 0 for existing command" {
    run command_exists "bash"
    [ "$status" -eq 0 ]
}

@test "command_exists returns 1 for non-existing command" {
    run command_exists "nonexistentcommand12345"
    [ "$status" -eq 1 ]
}
