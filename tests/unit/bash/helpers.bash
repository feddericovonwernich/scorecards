#!/bin/bash
# Test helpers for Bats tests

# Get the root directory of the project
export PROJECT_ROOT="$(cd "$(dirname "$BATS_TEST_DIRNAME")/../.." && pwd)"
export FIXTURES="$PROJECT_ROOT/tests/fixtures"

# Source the libraries we're testing
export ACTION_LIB="$PROJECT_ROOT/action/lib"

# Setup function run before each test
setup() {
    # Create temporary directory for test
    export TEST_TEMP_DIR="$(mktemp -d)"
}

# Teardown function run after each test
teardown() {
    # Clean up temporary directory
    [ -n "$TEST_TEMP_DIR" ] && rm -rf "$TEST_TEMP_DIR"
}

# Helper to create a test file
create_test_file() {
    local filepath="$1"
    local content="${2:-test content}"
    mkdir -p "$(dirname "$filepath")"
    echo "$content" > "$filepath"
}
