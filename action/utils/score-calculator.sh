#!/bin/bash
# Score Calculator - Calculates weighted score and rank from check results
#
# This script processes check results JSON and calculates a quality score using
# weighted scoring, determines the rank based on score thresholds, and assigns
# colors for badge generation.
#
# USAGE:
#   score-calculator.sh <results_file> <output_file>
#
# ARGUMENTS:
#   $1 - Path to check results JSON file (default: results.json)
#   $2 - Path to output score JSON file (default: score.json)
#
# INPUT FORMAT (results_file):
#   Array of check objects:
#   [
#     {
#       "name": "Check name",
#       "status": "pass" | "fail",
#       "weight": <points>,
#       "category": "...",
#       "description": "..."
#     },
#     ...
#   ]
#
# OUTPUT FORMAT (output_file):
#   {
#     "score": <0-100>,
#     "rank": "bronze" | "silver" | "gold" | "platinum",
#     "rank_color": "<color>",
#     "score_color": "<color>",
#     "total_checks": <count>,
#     "passed_checks": <count>,
#     "total_weight": <sum>,
#     "passed_weight": <sum>
#   }
#
# SCORING ALGORITHM:
#   score = (passed_weight / total_weight) * 100 (rounded to integer)
#
# RANK THRESHOLDS:
#   Platinum: >= 90
#   Gold:     >= 75
#   Silver:   >= 50
#   Bronze:   <  50
#
# SCORE COLOR THRESHOLDS (for badges):
#   Bright Green: >= 80
#   Green:        >= 60
#   Yellow:       >= 40
#   Orange:       >= 20
#   Red:          <  20
#
# EXIT CODES:
#   0 - Success (score calculated)
#   1 - Error (results file not found)
#
# EXAMPLE:
#   bash score-calculator.sh ./results.json ./score.json
#
set -euo pipefail

# Parse command-line arguments
RESULTS_FILE="${1:-results.json}"
OUTPUT_FILE="${2:-score.json}"

if [ ! -f "$RESULTS_FILE" ]; then
    echo "Error: Results file not found: $RESULTS_FILE" >&2
    exit 1
fi

# Calculate weighted score
calculation=$(jq '{
    total_weight: ([map(.weight) | add] | if . == [null] then [0] else . end)[0],
    passed_weight: ([map(select(.status == "pass") | .weight) | add] | if . == [null] then [0] else . end)[0],
    total_checks: length,
    passed_checks: [map(select(.status == "pass"))] | .[0] | length
  } |
  if .total_weight > 0 then
    .score = ((.passed_weight / .total_weight) * 100 | round)
  else
    .score = 0
  end' "$RESULTS_FILE")

score=$(echo "$calculation" | jq -r '.score')
total_checks=$(echo "$calculation" | jq -r '.total_checks')
passed_checks=$(echo "$calculation" | jq -r '.passed_checks')
total_weight=$(echo "$calculation" | jq -r '.total_weight')
passed_weight=$(echo "$calculation" | jq -r '.passed_weight')

# Determine rank based on score
if [ "$score" -ge 90 ]; then
    rank="platinum"
    rank_color="blue"
elif [ "$score" -ge 75 ]; then
    rank="gold"
    rank_color="yellow"
elif [ "$score" -ge 50 ]; then
    rank="silver"
    rank_color="lightgrey"
else
    rank="bronze"
    rank_color="orange"
fi

# Determine score color (gradient from red to green)
if [ "$score" -ge 80 ]; then
    score_color="brightgreen"
elif [ "$score" -ge 60 ]; then
    score_color="green"
elif [ "$score" -ge 40 ]; then
    score_color="yellow"
elif [ "$score" -ge 20 ]; then
    score_color="orange"
else
    score_color="red"
fi

# Create output JSON
output=$(jq -n \
    --argjson score "$score" \
    --arg rank "$rank" \
    --arg rank_color "$rank_color" \
    --arg score_color "$score_color" \
    --argjson total_checks "$total_checks" \
    --argjson passed_checks "$passed_checks" \
    --argjson total_weight "$total_weight" \
    --argjson passed_weight "$passed_weight" \
    '{
        score: $score,
        rank: $rank,
        rank_color: $rank_color,
        score_color: $score_color,
        total_checks: $total_checks,
        passed_checks: $passed_checks,
        total_weight: $total_weight,
        passed_weight: $passed_weight
    }')

echo "$output" | jq '.' > "$OUTPUT_FILE"

echo "Score: $score/100"
echo "Rank: $rank"
echo "Checks: $passed_checks/$total_checks passed"
echo "Score calculation written to: $OUTPUT_FILE"
