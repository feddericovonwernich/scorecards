#!/bin/bash
# Badge Generator - Creates shields.io compatible badge JSON files
set -euo pipefail

# Usage: badge-generator.sh <score_file> <score_badge_output> <rank_badge_output>
SCORE_FILE="${1:-score.json}"
SCORE_BADGE_OUTPUT="${2:-score-badge.json}"
RANK_BADGE_OUTPUT="${3:-rank-badge.json}"

if [ ! -f "$SCORE_FILE" ]; then
    echo "Error: Score file not found: $SCORE_FILE" >&2
    exit 1
fi

# Read score data
score=$(jq -r '.score' "$SCORE_FILE")
rank=$(jq -r '.rank' "$SCORE_FILE")
rank_color=$(jq -r '.rank_color' "$SCORE_FILE")
score_color=$(jq -r '.score_color' "$SCORE_FILE")

# Create score badge JSON for shields.io
score_badge=$(jq -n \
    --arg score "$score" \
    --arg color "$score_color" \
    '{
        schemaVersion: 1,
        label: "scorecard",
        message: "\($score)/100",
        color: $color
    }')

echo "$score_badge" | jq '.' > "$SCORE_BADGE_OUTPUT"

# Create rank badge JSON for shields.io
# Capitalize first letter of rank for display
rank_display=$(echo "$rank" | sed 's/./\U&/')

rank_badge=$(jq -n \
    --arg rank "$rank_display" \
    --arg color "$rank_color" \
    '{
        schemaVersion: 1,
        label: "rank",
        message: $rank,
        color: $color
    }')

echo "$rank_badge" | jq '.' > "$RANK_BADGE_OUTPUT"

echo "Badge JSONs created:"
echo "  Score: $SCORE_BADGE_OUTPUT (score: $score/100, color: $score_color)"
echo "  Rank: $RANK_BADGE_OUTPUT (rank: $rank_display, color: $rank_color)"
