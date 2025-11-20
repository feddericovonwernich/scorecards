#!/bin/bash
# Check 01: README Existence and Quality
#
# Validates that a README file exists in the repository root and contains
# meaningful content. This ensures projects have basic documentation.
#
# PASS CRITERIA:
#   - README file exists in repository root (case-insensitive: README.md,
#     readme.md, README.txt, etc.)
#   - README contains at least 100 characters of content
#
# ENVIRONMENT VARIABLES:
#   SCORECARD_REPO_PATH - Path to repository being checked (default: current dir)
#
# EXIT CODES:
#   0 - Check passed (README exists with sufficient content)
#   1 - Check failed (README missing or too short)
#
# OUTPUTS:
#   Success message to stdout
#   Error messages to stderr
#
# EXAMPLE:
#   SCORECARD_REPO_PATH=/path/to/repo ./check.sh
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../action/lib/file-finder.sh"

REPO_PATH="${SCORECARD_REPO_PATH:-.}"

# Check if README exists (case-insensitive)
readme_file=$(find_readme "$REPO_PATH")

if [ -z "$readme_file" ]; then
    echo "No README file found" >&2
    exit 1
fi

# Check if README has meaningful content (at least 100 characters)
char_count=$(wc -c < "$REPO_PATH/$readme_file")
if [ "$char_count" -lt 100 ]; then
    echo "README found but too short ($char_count chars, need at least 100)" >&2
    exit 1
fi

# All checks passed
echo "README found: $readme_file ($char_count characters)"
exit 0
