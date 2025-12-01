#!/bin/bash
# Scoring configuration for bash scripts
# Mirrors docs/src/config/scoring.js
set -euo pipefail

# Rank thresholds
RANK_PLATINUM_THRESHOLD=90
RANK_GOLD_THRESHOLD=75
RANK_SILVER_THRESHOLD=50
# Bronze is implicit (< SILVER)

# Default values
DEFAULT_CHECK_WEIGHT=10
DEFAULT_QUALITY_THRESHOLD=60

# Get rank for score
# Usage: get_rank 85 → outputs "gold"
get_rank() {
    local score="$1"
    if [ "$score" -ge "$RANK_PLATINUM_THRESHOLD" ]; then
        echo "platinum"
    elif [ "$score" -ge "$RANK_GOLD_THRESHOLD" ]; then
        echo "gold"
    elif [ "$score" -ge "$RANK_SILVER_THRESHOLD" ]; then
        echo "silver"
    else
        echo "bronze"
    fi
}

# Get color for rank (shields.io badge colors)
get_rank_color() {
    local rank="$1"
    case "$rank" in
        platinum) echo "blue" ;;
        gold)     echo "yellow" ;;
        silver)   echo "lightgrey" ;;
        bronze)   echo "orange" ;;
        *)        echo "lightgrey" ;;
    esac
}

# Get color for score (gradient from red to green)
get_score_color() {
    local score="$1"
    if [ "$score" -ge 80 ]; then
        echo "brightgreen"
    elif [ "$score" -ge 60 ]; then
        echo "green"
    elif [ "$score" -ge 40 ]; then
        echo "yellow"
    elif [ "$score" -ge 20 ]; then
        echo "orange"
    else
        echo "red"
    fi
}
