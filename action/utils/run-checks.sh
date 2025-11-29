#!/bin/bash
# Check Runner - Executes all checks and generates results
set -euo pipefail

# Usage: run-checks.sh <checks_dir> <repo_path> <output_file>
HOST_CHECKS_DIR="${1:-/host-checks}"
REPO_PATH="${2:-/workspace}"
OUTPUT_FILE="${3:-/output/results.json}"

# Export repo path for checks to use
export SCORECARD_REPO_PATH="$REPO_PATH"

# Copy checks from mounted volume to /checks (which has node_modules symlink)
# The volume is mounted at /host-checks to avoid destroying the symlink created at build time
# ES modules need to find packages in /checks/node_modules -> /action/node_modules
if [ -d "$HOST_CHECKS_DIR" ]; then
    # Use find to copy all files, preserving the node_modules symlink in /checks
    find "$HOST_CHECKS_DIR" -mindepth 1 -maxdepth 1 -exec cp -r {} /checks/ \;
fi

# Now use /checks for the rest of the script (where the symlink exists)
CHECKS_DIR="/checks"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Running scorecards..."
echo "Checks directory: $CHECKS_DIR"
echo "Repository path: $REPO_PATH"
echo "Output file: $OUTPUT_FILE"

# Parse excluded checks from environment variable (comma-separated list)
EXCLUDED_CHECKS="${EXCLUDED_CHECKS:-}"
declare -A EXCLUDED_MAP

if [ -n "$EXCLUDED_CHECKS" ]; then
    echo "Excluded checks: $EXCLUDED_CHECKS"
    IFS=',' read -ra EXCLUDED_ARRAY <<< "$EXCLUDED_CHECKS"
    for check_id in "${EXCLUDED_ARRAY[@]}"; do
        # Trim whitespace
        check_id=$(echo "$check_id" | xargs)
        if [ -n "$check_id" ]; then
            EXCLUDED_MAP["$check_id"]=1
        fi
    done
fi
echo

# Initialize results array
results='[]'

# Find all check directories (sorted)
check_dirs=$(find "$CHECKS_DIR" -mindepth 1 -maxdepth 1 -type d | sort)

if [ -z "$check_dirs" ]; then
    echo -e "${YELLOW}Warning: No checks found in $CHECKS_DIR${NC}"
    echo "$results" > "$OUTPUT_FILE"
    exit 0
fi

total_checks=0
passed_checks=0

# Iterate through each check
while IFS= read -r check_dir; do
    check_name=$(basename "$check_dir")

    # Read metadata first (needed for excluded checks too)
    metadata_file="$check_dir/metadata.json"
    if [ ! -f "$metadata_file" ]; then
        echo -e "${YELLOW}Warning: No metadata.json found for $check_name, skipping${NC}"
        continue
    fi

    # Parse metadata
    name=$(jq -r '.name // "Unknown"' "$metadata_file")
    description=$(jq -r '.description // ""' "$metadata_file")
    weight=$(jq -r '.weight // 10' "$metadata_file")
    timeout=$(jq -r '.timeout // 30' "$metadata_file")
    category=$(jq -r '.category // "general"' "$metadata_file")

    # Check if this check is excluded
    if [ -n "${EXCLUDED_MAP[$check_name]:-}" ]; then
        echo -e "${YELLOW}SKIP${NC} $name (excluded)"

        # Build excluded result object
        result=$(jq -n \
            --arg check_id "$check_name" \
            --arg name "$name" \
            --arg description "$description" \
            --arg category "$category" \
            --argjson weight "$weight" \
            '{
                check_id: $check_id,
                name: $name,
                description: $description,
                category: $category,
                weight: $weight,
                status: "excluded",
                exit_code: null,
                duration: 0,
                stdout: "",
                stderr: ""
            }')

        # Append to results array
        results=$(echo "$results" | jq --argjson result "$result" '. + [$result]')
        continue
    fi

    # Find check script
    check_script=""
    for ext in sh py js; do
        if [ -f "$check_dir/check.$ext" ]; then
            check_script="$check_dir/check.$ext"
            break
        fi
    done

    if [ -z "$check_script" ]; then
        echo -e "${YELLOW}Warning: No check script found for $check_name, skipping${NC}"
        continue
    fi

    # Determine how to execute the script
    case "${check_script##*.}" in
        sh)
            executor="bash"
            ;;
        py)
            executor="python3"
            ;;
        js)
            executor="node"
            ;;
        *)
            echo -e "${YELLOW}Warning: Unknown script type for $check_name, skipping${NC}"
            continue
            ;;
    esac

    echo -n "Running: $name... "

    # Execute the check with timeout
    start_time=$(date +%s)
    output_stdout=$(mktemp)
    output_stderr=$(mktemp)
    exit_code=0

    # Run with timeout
    if timeout "$timeout" "$executor" "$check_script" > "$output_stdout" 2> "$output_stderr"; then
        exit_code=0
    else
        exit_code=$?
        # timeout command returns 124 on timeout
        if [ $exit_code -eq 124 ]; then
            echo "TIMEOUT (>${timeout}s)" > "$output_stderr"
        fi
    fi

    end_time=$(date +%s)
    duration=$((end_time - start_time))

    # Read outputs
    stdout_content=$(cat "$output_stdout" | jq -Rs .)
    stderr_content=$(cat "$output_stderr" | jq -Rs .)

    # Clean up temp files
    rm -f "$output_stdout" "$output_stderr"

    # Determine pass/fail
    if [ $exit_code -eq 0 ]; then
        status="pass"
        passed_checks=$((passed_checks + 1))
        echo -e "${GREEN}PASS${NC} (${duration}s)"
    else
        status="fail"
        echo -e "${RED}FAIL${NC} (exit: $exit_code, ${duration}s)"
    fi

    total_checks=$((total_checks + 1))

    # Build result object
    result=$(jq -n \
        --arg check_id "$check_name" \
        --arg name "$name" \
        --arg description "$description" \
        --arg category "$category" \
        --argjson weight "$weight" \
        --arg status "$status" \
        --argjson exit_code "$exit_code" \
        --argjson duration "$duration" \
        --argjson stdout "$stdout_content" \
        --argjson stderr "$stderr_content" \
        '{
            check_id: $check_id,
            name: $name,
            description: $description,
            category: $category,
            weight: $weight,
            status: $status,
            exit_code: $exit_code,
            duration: $duration,
            stdout: $stdout,
            stderr: $stderr
        }')

    # Append to results array
    results=$(echo "$results" | jq --argjson result "$result" '. + [$result]')

done <<< "$check_dirs"

echo
echo "Results: $passed_checks / $total_checks passed"

# Write results to output file
echo "$results" | jq '.' > "$OUTPUT_FILE"

echo "Results written to: $OUTPUT_FILE"
