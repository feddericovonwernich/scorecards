#!/bin/bash
# Check: Test files existence
set -euo pipefail

REPO_PATH="${SCORECARD_REPO_PATH:-.}"

# Common test directory names
test_dirs=(
    "tests"
    "test"
    "__tests__"
    "spec"
    "specs"
)

# Common test file patterns
test_patterns=(
    "*test*.py"
    "*test*.js"
    "*test*.ts"
    "*spec*.js"
    "*spec*.ts"
    "test_*.py"
    "*Test.java"
    "*_test.go"
)

found_test_dirs=()
found_test_files=0

# Check for test directories
for dir in "${test_dirs[@]}"; do
    if [ -d "$REPO_PATH/$dir" ]; then
        found_test_dirs+=("$dir")
        # Count files in test directory
        file_count=$(find "$REPO_PATH/$dir" -type f 2>/dev/null | wc -l)
        found_test_files=$((found_test_files + file_count))
    fi
done

# Check for test files in root or src directories
for pattern in "${test_patterns[@]}"; do
    while IFS= read -r -d '' file; do
        found_test_files=$((found_test_files + 1))
    done < <(find "$REPO_PATH" -maxdepth 3 -type f -name "$pattern" -print0 2>/dev/null || true)
done

if [ "$found_test_files" -eq 0 ]; then
    echo "No test files or directories found" >&2
    exit 1
fi

# Build success message
message="Found tests: $found_test_files file(s)"
if [ ${#found_test_dirs[@]} -gt 0 ]; then
    message="$message in directories: ${found_test_dirs[*]}"
fi

echo "$message"
exit 0
