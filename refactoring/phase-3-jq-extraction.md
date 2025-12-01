# Phase 3: Bash jq Filter Extraction

**Scope**: Extract duplicated jq filters into reusable library
**Risk**: Medium
**Files**: ~5

## Context

`action/lib/git-ops.sh` has duplicated jq filters in `build_registry_entry()` function:
- Lines 152-179: jq filter with PR info
- Lines 181-203: jq filter without PR info (nearly identical)

This duplication makes maintenance difficult and increases risk of bugs.

---

## Tasks

### 3.1 Create json-builders.sh

**File**: `action/lib/json-builders.sh` (NEW)

```bash
#!/bin/bash
# Reusable jq transformations for building JSON objects
set -euo pipefail

# Build base registry entry (without installation_pr)
# Usage: build_base_registry_entry "$org" "$repo" "$name" ...
# All parameters passed as named jq args
build_registry_entry_json() {
    local org="$1"
    local repo="$2"
    local name="$3"
    local score="$4"
    local rank="$5"
    local rank_color="$6"
    local score_color="$7"
    local team_primary="${8:-}"
    local team_all="${9:-}"
    local team_source="${10:-}"
    local timestamp="${11:-}"
    local default_branch="${12:-main}"
    local pr_number="${13:-}"
    local pr_url="${14:-}"
    local pr_status="${15:-}"

    local jq_args=(
        -n
        --arg org "$org"
        --arg repo "$repo"
        --arg name "$name"
        --argjson score "$score"
        --arg rank "$rank"
        --arg rank_color "$rank_color"
        --arg score_color "$score_color"
        --arg team_primary "$team_primary"
        --arg team_all "$team_all"
        --arg team_source "$team_source"
        --arg timestamp "$timestamp"
        --arg default_branch "$default_branch"
    )

    local base_filter='{
        org: $org,
        repo: $repo,
        name: $name,
        team: (if $team_primary != "" then {
            primary: $team_primary,
            all: ($team_all | split(",") | map(select(. != ""))),
            source: $team_source
        } else null end),
        score: $score,
        rank: $rank,
        rank_color: $rank_color,
        score_color: $score_color,
        last_updated: $timestamp,
        default_branch: $default_branch
    }'

    if [ -n "$pr_number" ]; then
        jq_args+=(
            --arg pr_number "$pr_number"
            --arg pr_url "$pr_url"
            --arg pr_status "$pr_status"
        )
        jq "${jq_args[@]}" "$base_filter + {
            installation_pr: {
                number: (\$pr_number | tonumber),
                url: \$pr_url,
                status: \$pr_status
            }
        }"
    else
        jq "${jq_args[@]}" "$base_filter"
    fi
}

# Build check result JSON
build_check_result_json() {
    local id="$1"
    local name="$2"
    local passed="$3"
    local status="$4"
    local message="$5"
    local weight="$6"
    local details="${7:-}"

    jq -n \
        --arg id "$id" \
        --arg name "$name" \
        --argjson passed "$passed" \
        --arg status "$status" \
        --arg message "$message" \
        --argjson weight "$weight" \
        --arg details "$details" \
        '{
            id: $id,
            name: $name,
            passed: $passed,
            status: $status,
            message: $message,
            weight: $weight,
            details: (if $details != "" then $details else null end)
        }'
}
```

---

### 3.2 Refactor git-ops.sh

**File**: `action/lib/git-ops.sh`

Replace `build_registry_entry()` function to use `json-builders.sh`:

```bash
source "$(dirname "${BASH_SOURCE[0]}")/json-builders.sh"

build_registry_entry() {
    local org="$1"
    local repo="$2"
    local name="$3"
    local score="$4"
    local rank="$5"
    local rank_color="$6"
    local score_color="$7"
    local team_primary="${8:-}"
    local team_all="${9:-}"
    local team_source="${10:-}"
    local timestamp="${11:-}"
    local default_branch="${12:-main}"
    local pr_number="${13:-}"
    local pr_url="${14:-}"
    local pr_status="${15:-}"

    build_registry_entry_json \
        "$org" "$repo" "$name" "$score" "$rank" \
        "$rank_color" "$score_color" "$team_primary" \
        "$team_all" "$team_source" "$timestamp" \
        "$default_branch" "$pr_number" "$pr_url" "$pr_status"
}
```

---

### 3.3 Create Scoring Config for Bash

**File**: `action/config/scoring.sh` (NEW)

```bash
#!/bin/bash
# Scoring configuration for bash scripts
# Mirrors docs/src/config/scoring.js

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

# Get color for rank
get_rank_color() {
    local rank="$1"
    case "$rank" in
        platinum) echo "brightgreen" ;;
        gold)     echo "green" ;;
        silver)   echo "yellow" ;;
        bronze)   echo "orange" ;;
        *)        echo "lightgrey" ;;
    esac
}

# Get color for score
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
```

---

### 3.4 Update score-calculator.sh

**File**: `action/utils/score-calculator.sh`

Replace hardcoded thresholds:

```bash
source "$(dirname "${BASH_SOURCE[0]}")/../config/scoring.sh"

# Replace lines 40-52 (rank determination) with:
rank=$(get_rank "$score")

# Replace lines 54-65 (color determination) with:
score_color=$(get_score_color "$score")
rank_color=$(get_rank_color "$rank")
```

---

### 3.5 Create config directory

```bash
mkdir -p action/config
```

---

## Verification

```bash
# Test json builders
source action/lib/json-builders.sh
build_registry_entry_json "myorg" "myrepo" "My Service" 85 "gold" "green" "brightgreen" "" "" "" "2024-01-01" "main"

# Run full check on test repo
./action/entrypoint.sh  # with appropriate env vars

# Verify scoring config
source action/config/scoring.sh
get_rank 85  # should output "gold"
get_rank 95  # should output "platinum"
get_rank 60  # should output "silver"
get_rank 30  # should output "bronze"
```

---

## Files Changed Summary

### New Files
- `action/lib/json-builders.sh`
- `action/config/scoring.sh`

### Modified Files
- `action/lib/git-ops.sh`
- `action/utils/score-calculator.sh`
