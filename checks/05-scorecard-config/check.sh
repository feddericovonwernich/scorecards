#!/bin/bash
# Check: Scorecard configuration file existence and validity
set -euo pipefail

REPO_PATH="${SCORECARD_REPO_PATH:-.}"
CONFIG_FILE="$REPO_PATH/.scorecard/config.yml"

# Check if .scorecard/config.yml exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo ".scorecard/config.yml not found - consider adding service metadata for better catalog discoverability" >&2
    exit 1
fi

# Check if config has content (at least 20 characters to ensure it's not empty)
char_count=$(wc -c < "$CONFIG_FILE")
if [ "$char_count" -lt 20 ]; then
    echo ".scorecard/config.yml exists but appears empty ($char_count chars)" >&2
    exit 1
fi

# All checks passed
echo "Scorecard config found: .scorecard/config.yml ($char_count bytes)"
exit 0
