#!/bin/bash
# Check: README existence and quality
set -euo pipefail

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
