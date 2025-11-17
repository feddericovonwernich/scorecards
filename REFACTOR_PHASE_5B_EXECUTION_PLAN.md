# Phase 5B: Backend Normalization & De-duplication

## Executive Summary

This document provides a comprehensive execution plan for further normalizing and de-duplicating the scorecard action backend after the initial Phase 5 refactoring.

**Context:** Phase 5 reduced entrypoint.sh from 722 to 284 lines (60% reduction) by extracting 6 modules. This phase identifies and eliminates remaining duplicate patterns, improves parameter handling, and ensures consistency.

**Current State:**
- `action/entrypoint.sh`: 284 lines
- 6 library modules: ~893 lines total
- Total: ~1,177 lines

**Target State:**
- Estimated 20-25% additional reduction (~600-650 lines in modules)
- Significantly improved maintainability
- Consistent patterns throughout
- Zero duplicate code patterns

---

## Detailed Analysis: Duplicate Patterns & Opportunities

### 1. PARAMETER VALIDATION PATTERN (High Priority - SIGNIFICANT)

#### Current Problem
**Location:** `action/lib/github-api.sh`

Nearly identical validation code in multiple functions:

```bash
# Lines 13-16 in get_pr_info()
if [ -z "$org" ] || [ -z "$repo" ] || [ -z "$github_token" ]; then
    log_error "get_pr_info requires org, repo, and token"
    return 1
fi

# Lines 38-41 in get_default_branch()
if [ -z "$org" ] || [ -z "$repo" ] || [ -z "$github_token" ]; then
    log_error "get_default_branch requires org, repo, and token"
    return 1
fi
```

**Impact:** 6+ lines of duplicate code per function

#### Solution
Add unified validation function to `action/lib/common.sh`:

```bash
# Validate function parameters
# Usage: validate_params "function_name" "param1" "$value1" "param2" "$value2" ...
validate_params() {
    local func_name="$1"
    shift
    local missing=()

    while [ $# -gt 0 ]; do
        local param_name="$1"
        local param_value="$2"
        if [ -z "$param_value" ]; then
            missing+=("$param_name")
        fi
        shift 2
    done

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "$func_name requires: ${missing[*]}"
        return 1
    fi
    return 0
}
```

**Usage Example:**
```bash
get_pr_info() {
    local org="$1"
    local repo="$2"
    local github_token="$3"

    validate_params "get_pr_info" "org" "$org" "repo" "$repo" "token" "$github_token" || return 1

    # ... rest of function
}
```

**Estimated Savings:** 10-15 lines across github-api.sh

---

### 2. YAML PARSING DUPLICATION (High Priority - SIGNIFICANT)

#### Current Problem
**Location:** `action/lib/config-parser.sh`

Nearly identical Python YAML parsing code in two functions:

```bash
# Lines 70-84 in parse_links_array()
if command -v python3 &> /dev/null; then
    python3 -c "
import yaml, json, sys
try:
    with open('$config_file', 'r') as f:
        config = yaml.safe_load(f)
        links = config.get('service', {}).get('links', [])
        print(json.dumps(links))
except:
    print('[]')
" 2>/dev/null || echo "[]"
else
    log_warning "Python not available, cannot parse links array"
    echo "[]"
fi

# Lines 104-121 in parse_openapi_config() - NEARLY IDENTICAL
if command -v python3 &> /dev/null; then
    python3 -c "
import yaml, json, sys
try:
    with open('$config_file', 'r') as f:
        config = yaml.safe_load(f)
        openapi = config.get('openapi', None)
        if openapi:
            print(json.dumps(openapi))
        else:
            print('null')
except:
    print('null')
" 2>/dev/null || echo "null"
else
    log_warning "Python not available, cannot parse OpenAPI config"
    echo "null"
fi
```

**Impact:** ~30 lines of duplicate Python code

#### Solution
Create unified YAML parser in `action/lib/config-parser.sh`:

```bash
# Parse YAML field from config file
# Usage: parse_yaml_field "config.yml" "service.links" "[]"
#        parse_yaml_field "config.yml" "openapi" "null"
parse_yaml_field() {
    local config_file="$1"
    local field_path="$2"
    local default_value="$3"

    if ! command -v python3 &> /dev/null; then
        log_warning "Python not available, cannot parse YAML field: $field_path"
        echo "$default_value"
        return 1
    fi

    python3 -c "
import yaml, json, sys

try:
    with open('$config_file', 'r') as f:
        config = yaml.safe_load(f) or {}

    # Navigate nested path (e.g., 'service.links' -> config['service']['links'])
    path_parts = '$field_path'.split('.')
    value = config
    for key in path_parts:
        if isinstance(value, dict):
            value = value.get(key, None)
        else:
            value = None
            break

    # Output JSON or default
    if value is not None:
        print(json.dumps(value))
    else:
        print('$default_value')
except Exception as e:
    print('$default_value', file=sys.stderr)
    print('$default_value')
" 2>/dev/null || echo "$default_value"
}
```

**Updated Functions:**
```bash
parse_links_array() {
    local repo_path="$1"
    local config_file="$repo_path/.scorecard/config.yml"

    if [ ! -f "$config_file" ]; then
        echo "[]"
        return 0
    fi

    parse_yaml_field "$config_file" "service.links" "[]"
}

parse_openapi_config() {
    local repo_path="$1"
    local config_file="$repo_path/.scorecard/config.yml"

    if [ ! -f "$config_file" ]; then
        echo "null"
        return 0
    fi

    parse_yaml_field "$config_file" "openapi" "null"
}
```

**Estimated Savings:** ~30 lines in config-parser.sh

---

### 3. CONFIG FILE EXISTENCE CHECKING (Medium Priority - MODERATE)

#### Current Problem
**Location:** `action/lib/config-parser.sh`

Repeated config file checking in 5 functions:

```bash
# Pattern repeated in:
# - has_scorecard_config() lines 12-16
# - get_service_name() lines 25-28
# - get_team_name() lines 44-47
# - parse_links_array() lines 58-61
# - parse_openapi_config() lines 92-95

local config_file="$repo_path/.scorecard/config.yml"
if [ ! -f "$config_file" ]; then
    echo "<default_value>"
    return 0
fi
```

**Impact:** 20+ lines of repeated logic

#### Solution
Create helper function at the top of `config-parser.sh`:

```bash
# Get config file path if it exists, otherwise return default and set exit code
# Usage: config_file=$(get_config_file_or_return "$repo_path" "default_value") || return 0
get_config_file_or_return() {
    local repo_path="$1"
    local default_value="$2"
    local config_file="$repo_path/.scorecard/config.yml"

    if [ ! -f "$config_file" ]; then
        echo "$default_value"
        return 1
    fi

    echo "$config_file"
    return 0
}
```

**Usage Example:**
```bash
get_team_name() {
    local repo_path="$1"

    local config_file
    config_file=$(get_config_file_or_return "$repo_path" "") || return 0

    # Parse team name from config
    grep "team:" "$config_file" | sed 's/.*team: *"\?\([^"]*\)"\?.*/\1/' || echo ""
}
```

**Estimated Savings:** 15-20 lines

---

### 4. PR FIELD EXTRACTION DUPLICATION (Medium Priority - MODERATE)

#### Current Problem
**Location:** `action/lib/github-api.sh`

Three nearly identical functions (lines 54-84):

```bash
extract_pr_number() {
    local pr_data="$1"
    if [ -z "$pr_data" ] || [ "$pr_data" = "[]" ]; then
        return 1
    fi
    echo "$pr_data" | jq -r '.[0].number // empty'
}

extract_pr_state() {
    local pr_data="$1"
    if [ -z "$pr_data" ] || [ "$pr_data" = "[]" ]; then
        return 1
    fi
    echo "$pr_data" | jq -r '.[0].state // empty'
}

extract_pr_url() {
    local pr_data="$1"
    if [ -z "$pr_data" ] || [ "$pr_data" = "[]" ]; then
        return 1
    fi
    echo "$pr_data" | jq -r '.[0].url // empty'
}
```

**Impact:** 27 lines that could be 8-10 lines

#### Solution
Create unified extractor:

```bash
# Extract field from PR data JSON
# Usage: extract_pr_field "$pr_data" "number"
#        extract_pr_field "$pr_data" "state"
extract_pr_field() {
    local pr_data="$1"
    local field="$2"

    if [ -z "$pr_data" ] || [ "$pr_data" = "[]" ]; then
        return 1
    fi

    echo "$pr_data" | jq -r ".[0].$field // empty"
}
```

**Update callers in entrypoint.sh:**
```bash
# OLD (lines 58-60):
export PR_NUMBER=$(extract_pr_number "$pr_data")
export PR_STATE=$(extract_pr_state "$pr_data")
export PR_URL=$(extract_pr_url "$pr_data")

# NEW:
export PR_NUMBER=$(extract_pr_field "$pr_data" "number")
export PR_STATE=$(extract_pr_field "$pr_data" "state")
export PR_URL=$(extract_pr_field "$pr_data" "url")
```

**Estimated Savings:** 17-20 lines in github-api.sh

---

### 5. DUPLICATE JQ FILTER IN check_meaningful_changes (High Priority - SIGNIFICANT)

#### Current Problem
**Location:** `action/lib/git-ops.sh:49-91`

Identical 20-line jq filter repeated twice:

```bash
local old_summary=$(jq -S '{
    score: .score,
    rank: .rank,
    passed_checks: .passed_checks,
    total_checks: .total_checks,
    checks_hash: .checks_hash,
    checks_count: .checks_count,
    installed: .installed,
    recent_contributors: .recent_contributors,
    service: {
        name: .service.name,
        team: .service.team,
        links: .service.links,
        openapi: .service.openapi
    },
    checks: [.checks[] | {
        check_id: .check_id,
        status: .status,
        exit_code: .exit_code
    }]
}' "$old_file" 2>/dev/null)

local new_summary=$(jq -S '{
    # EXACT SAME 20 LINES
}' "$new_file" 2>/dev/null)
```

**Impact:** 40 lines of duplicate code

#### Solution
Extract filter to a variable:

```bash
check_meaningful_changes() {
    local old_file="$1"
    local new_file="$2"

    if [ ! -f "$old_file" ]; then
        return 0  # No old file means this is new entry
    fi

    # Define filter once
    local jq_filter='{
        score: .score,
        rank: .rank,
        passed_checks: .passed_checks,
        total_checks: .total_checks,
        checks_hash: .checks_hash,
        checks_count: .checks_count,
        installed: .installed,
        recent_contributors: .recent_contributors,
        service: {
            name: .service.name,
            team: .service.team,
            links: .service.links,
            openapi: .service.openapi
        },
        checks: [.checks[] | {
            check_id: .check_id,
            status: .status,
            exit_code: .exit_code
        }]
    }'

    # Apply filter to both files
    local old_summary=$(jq -S "$jq_filter" "$old_file" 2>/dev/null)
    local new_summary=$(jq -S "$jq_filter" "$new_file" 2>/dev/null)

    if [ "$old_summary" = "$new_summary" ]; then
        return 1  # No meaningful changes
    else
        return 0  # Has meaningful changes
    fi
}
```

**Estimated Savings:** ~20 lines (eliminates duplicate)

---

### 6. EXCESSIVE FUNCTION PARAMETERS (High Priority - SIGNIFICANT)

#### Current Problem
**Location:** Multiple files

Functions with excessive positional parameters:

1. **`update_catalog()`** in `git-ops.sh:276-409` - **23 parameters**
2. **`git_push_with_smart_retry()`** in `git-ops.sh:181-255` - **16 parameters**
3. **`build_registry_entry()`** in `git-ops.sh:101-178` - **17 parameters**
4. **`build_results_json()`** in `results-builder.sh:8-66` - **16 parameters**

**Impact:** Extremely difficult to maintain, error-prone, hard to read

#### Example of Current Problem
```bash
# From entrypoint.sh:244-250
update_catalog \
    "$GITHUB_TOKEN" "$SCORECARDS_REPO" "$SCORECARDS_BRANCH" \
    "$SERVICE_ORG" "$SERVICE_REPO" "$SERVICE_NAME" "$TEAM_NAME" \
    "$SCORE" "$RANK" "$PASSED_CHECKS" "$TOTAL_CHECKS" \
    "$HAS_API" "$CHECKS_HASH" "$CHECKS_COUNT" "$INSTALLED" \
    "$DEFAULT_BRANCH" "${PR_NUMBER:-}" "${PR_STATE:-}" "${PR_URL:-}" \
    "$OUTPUT_DIR" "$SCORE_BADGE_FILE" "$RANK_BADGE_FILE" "$WORK_DIR"
```

**23 parameters is unmaintainable!**

#### Solution
Use associative arrays (bash 4+ feature):

**In entrypoint.sh**, create context structures:

```bash
# Group related data into associative arrays
declare -A service_context=(
    [org]="$SERVICE_ORG"
    [repo]="$SERVICE_REPO"
    [name]="$SERVICE_NAME"
    [team]="$TEAM_NAME"
    [has_api]="$HAS_API"
    [default_branch]="$DEFAULT_BRANCH"
)

declare -A score_context=(
    [score]="$SCORE"
    [rank]="$RANK"
    [passed_checks]="$PASSED_CHECKS"
    [total_checks]="$TOTAL_CHECKS"
    [checks_hash]="$CHECKS_HASH"
    [checks_count]="$CHECKS_COUNT"
    [installed]="$INSTALLED"
)

declare -A repo_context=(
    [github_token]="$GITHUB_TOKEN"
    [scorecards_repo]="$SCORECARDS_REPO"
    [scorecards_branch]="$SCORECARDS_BRANCH"
)

declare -A pr_context=(
    [number]="${PR_NUMBER:-}"
    [state]="${PR_STATE:-}"
    [url]="${PR_URL:-}"
)

declare -A paths=(
    [output_dir]="$OUTPUT_DIR"
    [score_badge]="$SCORE_BADGE_FILE"
    [rank_badge]="$RANK_BADGE_FILE"
    [work_dir]="$WORK_DIR"
)

# Clean function call
update_catalog service_context score_context repo_context pr_context paths
```

**Update function signature** in `git-ops.sh`:

```bash
update_catalog() {
    local -n service=$1
    local -n score=$2
    local -n repo=$3
    local -n pr=$4
    local -n paths=$5

    # Access with ${service[org]}, ${score[rank]}, etc.
    local service_org="${service[org]}"
    local service_repo="${service[repo]}"
    local service_name="${service[name]}"
    local team_name="${service[team]}"
    local has_api="${service[has_api]}"
    local default_branch="${service[default_branch]}"

    local score_value="${score[score]}"
    local rank="${score[rank]}"
    local passed_checks="${score[passed_checks]}"
    local total_checks="${score[total_checks]}"
    local checks_hash="${score[checks_hash]}"
    local checks_count="${score[checks_count]}"
    local installed="${score[installed]}"

    local github_token="${repo[github_token]}"
    local scorecards_repo="${repo[scorecards_repo]}"
    local scorecards_branch="${repo[scorecards_branch]}"

    local pr_number="${pr[number]}"
    local pr_state="${pr[state]}"
    local pr_url="${pr[url]}"

    local output_dir="${paths[output_dir]}"
    local score_badge_file="${paths[score_badge]}"
    local rank_badge_file="${paths[rank_badge]}"
    local work_dir="${paths[work_dir]}"

    # ... rest of function unchanged
}
```

**Benefits:**
- Clear grouping of related parameters
- Easy to add new fields to a context
- Self-documenting (can see what data is in each group)
- Reduces from 23 parameters to 5 structured parameters

**Apply same pattern to:**
- `git_push_with_smart_retry()` (16 params → ~4-5 contexts)
- `build_registry_entry()` (17 params → ~4 contexts)
- `build_results_json()` (16 params → ~4 contexts)

**Estimated Impact:** Much more maintainable, though line count similar

---

### 7. FILE READING UTILITIES (Medium Priority - MODERATE)

#### Current Problem
**Location:** Various files

Repeated patterns for reading JSON files safely:

```bash
# Pattern 1: Check existence, then read
if [ ! -f "$file" ]; then
    # handle missing file
fi
local data=$(jq '.' "$file")

# Pattern 2: Read field with default
local value=$(jq -r '.field // "default"' "$file" 2>/dev/null || echo "default")
```

#### Solution
Add to `action/lib/common.sh`:

```bash
# Read JSON file safely with default value
# Usage: read_json_file "/path/to/file.json" "null"
read_json_file() {
    local file="$1"
    local default="${2:-null}"

    if [ ! -f "$file" ]; then
        echo "$default"
        return 1
    fi

    jq '.' "$file" 2>/dev/null || echo "$default"
}

# Read specific field from JSON file
# Usage: read_json_field "/path/to/file.json" "score" "0"
read_json_field() {
    local file="$1"
    local field="$2"
    local default="${3:-null}"

    if [ ! -f "$file" ]; then
        echo "$default"
        return 1
    fi

    jq -r ".$field // \"$default\"" "$file" 2>/dev/null || echo "$default"
}
```

**Usage Examples:**
```bash
# Instead of:
SCORE=$(jq -r '.score' "$SCORE_FILE")

# Use:
SCORE=$(read_json_field "$SCORE_FILE" "score" "0")

# Instead of:
if [ -f "$old_file" ]; then
    old_data=$(jq '.' "$old_file")
fi

# Use:
old_data=$(read_json_file "$old_file" "{}")
```

**Estimated Savings:** 10-15 lines across various files

---

### 8. LOGGING INCONSISTENCIES (High Priority - SIGNIFICANT)

#### Current Problem
**Location:** `action/entrypoint.sh`

Mixed use of raw echo with color codes vs log functions:

```bash
# Line 141-142: Direct color codes
echo -e "${RED}✗ Docker build failed${NC}"

# Line 165: Direct color codes
echo -e "${RED}✗ Check execution failed${NC}"

# Lines 214-215: Raw echo
echo "Checks hash: $CHECKS_HASH"
echo "Checks count: $CHECKS_COUNT"

# Lines 276-278: Raw echo
echo "Score: $SCORE/100"
echo "Rank: $RANK"
echo "Checks: $PASSED_CHECKS/$TOTAL_CHECKS passed"

# Line 280: Direct color codes
echo -e "${GREEN}✓ Scorecard completed successfully${NC}"
```

**Impact:** Inconsistent logging makes it harder to:
- Add log levels (DEBUG, INFO, WARNING, ERROR)
- Redirect logs to files
- Parse structured logs
- Maintain consistent formatting

#### Solution
Replace all raw echo statements with log functions:

```bash
# Line 141 - BEFORE:
echo -e "${RED}✗ Docker build failed${NC}"

# AFTER:
log_error "Docker build failed"

# Line 165 - BEFORE:
echo -e "${RED}✗ Check execution failed${NC}"

# AFTER:
log_error "Check execution failed"

# Lines 214-215 - BEFORE:
echo "Checks hash: $CHECKS_HASH"
echo "Checks count: $CHECKS_COUNT"

# AFTER:
log_info "Checks hash: $CHECKS_HASH"
log_info "Checks count: $CHECKS_COUNT"

# Lines 276-278 - BEFORE:
echo "Score: $SCORE/100"
echo "Rank: $RANK"
echo "Checks: $PASSED_CHECKS/$TOTAL_CHECKS passed"

# AFTER:
log_info "Score: $SCORE/100"
log_info "Rank: $RANK"
log_info "Checks: $PASSED_CHECKS/$TOTAL_CHECKS passed"

# Line 280 - BEFORE:
echo -e "${GREEN}✓ Scorecard completed successfully${NC}"

# AFTER:
log_success "Scorecard completed successfully"
```

**Also remove direct color code usage:**
```bash
# Lines 141-142 currently access $RED and $NC directly
# After fix, only log functions should use color codes
```

**Estimated Impact:** 8+ replacements, more consistent codebase

---

### 9. ERROR HANDLING INCONSISTENCIES (Medium Priority - MODERATE)

#### Current Problem
**Location:** Multiple files

Three different error handling patterns:

```bash
# Pattern 1: Direct exit (in entrypoint.sh)
if ! docker build ...; then
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
fi

# Pattern 2: Return with error (in lib files)
if [ -z "$token" ]; then
    log_error "Token required"
    return 1
fi

# Pattern 3: die() function defined but unused (common.sh:35)
die() {
    log_error "$1"
    exit "${2:-1}"
}
```

**Impact:** Inconsistent patterns make code harder to maintain

#### Solution
Establish clear conventions:

**Option A: Use die() consistently in entrypoint.sh**
```bash
# In entrypoint.sh, replace direct exits with die():

# BEFORE:
if ! docker build ...; then
    echo -e "${RED}✗ Docker build failed${NC}"
    cat "$WORK_DIR/docker-build.log"
    exit 1
fi

# AFTER:
if ! docker build ... > "$WORK_DIR/docker-build.log" 2>&1; then
    cat "$WORK_DIR/docker-build.log"
    die "Docker build failed" 1
fi
```

**Option B: Remove die() if not using it**
- If we prefer explicit exits, remove unused die() from common.sh
- Keep return 1 in library functions (current practice is good)

**Recommendation:** Use Option A - die() provides cleaner error handling

**Estimated Impact:** More consistent, easier to add error hooks later

---

### 10. TIMESTAMP GENERATION DUPLICATION (Low Priority - MINOR)

#### Current Problem
**Location:** Multiple files

Repeated timestamp format:

```bash
# entrypoint.sh:228
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# git-ops.sh:301
local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
```

#### Solution
Add to `action/lib/common.sh`:

```bash
# Generate ISO 8601 timestamp
get_iso_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}
```

**Usage:**
```bash
TIMESTAMP=$(get_iso_timestamp)
```

**Estimated Savings:** Minimal lines, but ensures consistent format

---

### 11. GH_TOKEN EXPORT DUPLICATION (Low Priority - MINOR)

#### Current Problem
**Location:** `action/lib/github-api.sh`

Token exported in each function:

```bash
# Line 20 in get_pr_info()
export GH_TOKEN="$github_token"

# Line 45 in get_default_branch()
export GH_TOKEN="$github_token"
```

#### Solution
Export once during initialization in `setup.sh`:

```bash
# Add to initialize_environment() in setup.sh
initialize_environment() {
    log_info "Initializing scorecard environment"

    # Setup git
    setup_git_user "Scorecards Bot" "noreply@scorecards.local"

    # Setup GitHub token if available
    if [ -n "${INPUT_GITHUB_TOKEN:-}" ]; then
        export GH_TOKEN="$INPUT_GITHUB_TOKEN"
    fi

    log_success "Environment initialized"
}
```

**Then update github-api.sh functions:**
```bash
get_pr_info() {
    local org="$1"
    local repo="$2"
    # Token is already set globally, no need to pass or export

    validate_params "get_pr_info" "org" "$org" "repo" "$repo" || return 1

    # GH_TOKEN already available
    local pr_data=$(gh pr list ...)
}
```

**Estimated Savings:** Minor, but cleaner

---

### 12. DIRECTORY CREATION PATTERN (Low Priority - MINOR)

#### Current Problem
**Location:** `action/lib/git-ops.sh:318-321`

Repeated mkdir pattern:

```bash
mkdir -p "results/$service_org/$service_repo"
mkdir -p "badges/$service_org/$service_repo"
mkdir -p "registry/$service_org"
```

#### Solution
Create utility function:

```bash
# Create catalog directory structure
create_catalog_dirs() {
    local org="$1"
    local repo="$2"

    mkdir -p "results/$org/$repo" "badges/$org/$repo" "registry/$org"
}
```

**Usage:**
```bash
create_catalog_dirs "$service_org" "$service_repo"
```

**Estimated Savings:** Minimal

---

## Implementation Plan

### Stage 1: Foundation Utilities (High Impact)
**Goal:** Add reusable utilities to common.sh

**Changes:**
1. Add `validate_params()` to `action/lib/common.sh`
2. Add `read_json_file()` and `read_json_field()` to `action/lib/common.sh`
3. Add `get_iso_timestamp()` to `action/lib/common.sh`

**Testing:**
- Validate bash syntax: `bash -n action/lib/common.sh`
- No functional changes yet, just adding utilities

**Commit:** "Add common utilities for validation, file reading, and timestamps"

---

### Stage 2: Config Parser Consolidation (Significant Impact)
**Goal:** Eliminate duplicate patterns in config-parser.sh

**Changes:**
1. Add `get_config_file_or_return()` helper function
2. Create unified `parse_yaml_field()` function
3. Update `parse_links_array()` to use `parse_yaml_field()`
4. Update `parse_openapi_config()` to use `parse_yaml_field()`
5. Update other functions to use `get_config_file_or_return()`

**Testing:**
- Validate syntax: `bash -n action/lib/config-parser.sh`
- Test with test-repo-perfect: Verify links and openapi parsing works
- Test with test-repo-minimal: Verify defaults work when config missing

**Commit:** "Consolidate YAML parsing and config file checking patterns"

---

### Stage 3: GitHub API Simplification (Moderate Impact)
**Goal:** Reduce duplication in github-api.sh

**Changes:**
1. Update `get_pr_info()` to use `validate_params()`
2. Update `get_default_branch()` to use `validate_params()`
3. Create `extract_pr_field()` function
4. Remove `extract_pr_number()`, `extract_pr_state()`, `extract_pr_url()`
5. Update `action/entrypoint.sh:58-60` to use `extract_pr_field()`

**Testing:**
- Validate syntax: `bash -n action/lib/github-api.sh && bash -n action/entrypoint.sh`
- Verify PR info extraction still works

**Commit:** "Simplify GitHub API functions with unified patterns"

---

### Stage 4A: Git Operations - Fix Duplicate Filter (High Impact)
**Goal:** Eliminate 40-line duplicate in check_meaningful_changes

**Changes:**
1. Extract jq filter to a variable in `check_meaningful_changes()` function
2. Apply filter to both old and new files

**Testing:**
- Validate syntax: `bash -n action/lib/git-ops.sh`
- Test change detection logic still works correctly

**Commit:** "Extract duplicate jq filter in check_meaningful_changes"

---

### Stage 4B: Git Operations - Refactor Parameters (High Impact)
**Goal:** Convert parameter-heavy functions to use associative arrays

**Changes:**
1. Update `action/entrypoint.sh` to create context arrays:
   - `service_context` (org, repo, name, team, has_api, default_branch)
   - `score_context` (score, rank, passed_checks, total_checks, checks_hash, checks_count, installed)
   - `repo_context` (github_token, scorecards_repo, scorecards_branch)
   - `pr_context` (number, state, url)
   - `paths` (output_dir, score_badge, rank_badge, work_dir)

2. Update `update_catalog()` in `git-ops.sh:276` to accept 5 context parameters
   - Use `local -n` nameref to access associative arrays
   - Extract individual values at top of function

3. Update `build_registry_entry()` in `git-ops.sh:101` similarly

4. Update `git_push_with_smart_retry()` in `git-ops.sh:181` similarly

**Testing:**
- Validate syntax: `bash -n action/lib/git-ops.sh && bash -n action/entrypoint.sh`
- Run full test with test-repo-perfect
- Verify catalog update still works

**Commit:** "Refactor git operations to use associative arrays for parameters"

---

### Stage 5: Results Builder Optimization (Moderate Impact)
**Goal:** Improve parameter handling in results-builder.sh

**Changes:**
1. Update `build_results_json()` to accept context arrays
2. Update caller in `action/entrypoint.sh:231-235`

**Testing:**
- Validate syntax: `bash -n action/lib/results-builder.sh && bash -n action/entrypoint.sh`
- Verify results JSON format unchanged

**Commit:** "Refactor results builder to use associative arrays"

---

### Stage 6: Consistency Pass (High Impact)
**Goal:** Ensure consistent patterns throughout

**Changes:**
1. Replace all raw `echo` with log functions in `action/entrypoint.sh`:
   - Line 141: `log_error "Docker build failed"`
   - Line 165: `log_error "Check execution failed"`
   - Lines 214-215: `log_info` for checks hash/count
   - Lines 276-278: `log_info` for score summary
   - Line 280: `log_success "Scorecard completed successfully"`

2. Standardize error handling in `action/entrypoint.sh`:
   - Update docker build failure (line 140) to use `die()`
   - Update docker run failure (line 159) to use `die()`

3. Minor cleanups:
   - Add `get_iso_timestamp()` usage
   - Add `create_catalog_dirs()` utility if beneficial
   - Update GH_TOKEN handling in setup

**Testing:**
- Validate syntax: `bash -n action/entrypoint.sh`
- Run full integration test
- Compare output format with previous version

**Commit:** "Ensure consistent logging and error handling patterns"

---

## Testing Strategy

### Per-Stage Testing
After each stage:
1. **Syntax validation:** `bash -n` on all modified files
2. **Spot testing:** Test specific functionality affected by changes
3. **Git commit:** Create clean commit with descriptive message

### Integration Testing
After stages 2, 4, and 6:
1. Run scorecard action on test repositories
2. Verify results identical to baseline
3. Check catalog updates work correctly
4. Verify PR detection works
5. Check error cases handled properly

### Baseline Comparison
- Use existing test results as baseline
- Compare final results after all changes
- **Zero functional regressions**

---

## Success Criteria

### Quantitative Goals
- ✅ Eliminate all duplicate validation patterns (4+ instances)
- ✅ Eliminate duplicate YAML parsing (~30 lines)
- ✅ Eliminate duplicate jq filter (~40 lines)
- ✅ Reduce functions with >15 params to structured arrays
- ✅ Consistent logging throughout (0 raw echo statements)
- ✅ All bash syntax valid (`bash -n` passes)
- ✅ Estimated 20-25% line reduction in modules

### Qualitative Goals
- ✅ Much easier to understand parameter passing
- ✅ Consistent patterns across all modules
- ✅ Single source of truth for common operations
- ✅ Easier to add features (e.g., new PR fields, new config fields)
- ✅ Better error messages
- ✅ Cleaner, more maintainable codebase

### Validation
- ✅ All tests pass
- ✅ Results identical to pre-refactor baseline
- ✅ No new shellcheck warnings
- ✅ Documentation updated

---

## Rollback Plan

If any stage causes issues:

1. **Identify problematic stage:** Check which commit introduced regression
2. **Git revert:** Revert the specific commit
3. **Fix and retry:** Address issue and re-apply changes
4. **Continue:** Proceed with remaining stages

Each stage is a separate commit for easy rollback.

---

## File Modification Summary

### Files to Modify

1. **action/lib/common.sh**
   - Add: `validate_params()`, `read_json_file()`, `read_json_field()`, `get_iso_timestamp()`
   - Estimated: +40 lines

2. **action/lib/config-parser.sh**
   - Add: `get_config_file_or_return()`, unified `parse_yaml_field()`
   - Modify: `parse_links_array()`, `parse_openapi_config()`, other functions
   - Estimated: -30 lines (consolidation)

3. **action/lib/github-api.sh**
   - Add: `extract_pr_field()`
   - Remove: `extract_pr_number()`, `extract_pr_state()`, `extract_pr_url()`
   - Modify: `get_pr_info()`, `get_default_branch()` to use `validate_params()`
   - Estimated: -20 lines

4. **action/lib/git-ops.sh**
   - Modify: `check_meaningful_changes()` (extract duplicate filter)
   - Modify: `update_catalog()`, `build_registry_entry()`, `git_push_with_smart_retry()` (use arrays)
   - Add: `create_catalog_dirs()` utility
   - Estimated: -30 lines (mostly from duplicate filter)

5. **action/lib/results-builder.sh**
   - Modify: `build_results_json()` (use associative arrays)
   - Estimated: Similar lines, cleaner interface

6. **action/entrypoint.sh**
   - Add: Associative array creation (5 contexts)
   - Modify: Function calls to pass contexts
   - Modify: Replace echo with log functions
   - Modify: Use die() for errors
   - Estimated: +20 lines for contexts, -10 from consistency = +10 net

7. **action/lib/setup.sh**
   - Modify: `initialize_environment()` to export GH_TOKEN
   - Estimated: +3 lines

### Total Estimated Impact
- **Current:** ~1,177 lines (284 + ~893)
- **After:** ~1,070 lines (estimated 20-25% reduction in modules)
- **Net:** ~100-120 lines removed, significantly improved maintainability

---

## Notes and Considerations

### Bash Version Compatibility
- Associative arrays require bash 4.0+
- GitHub Actions runners use bash 5.x (✓ compatible)
- Docker image uses recent bash (✓ compatible)

### Backwards Compatibility
- All external interfaces unchanged (entrypoint.sh inputs/outputs)
- Results JSON format unchanged
- Catalog structure unchanged
- Workflow YAML unchanged

### Performance Impact
- Minimal (mostly internal refactoring)
- Slightly fewer function calls (consolidated functions)
- No impact on check execution time

### Maintenance Impact
- **Significantly** easier to maintain
- Clearer parameter passing
- Easier to add new features
- Better code organization

---

## Appendix: Quick Reference

### Priority Classification
- **High Priority (SIGNIFICANT):** Major impact on code quality/maintainability
- **Medium Priority (MODERATE):** Noticeable improvement
- **Low Priority (MINOR):** Nice to have, minimal impact

### High Priority Items (Do First)
1. Parameter validation utility
2. YAML parsing consolidation
3. Duplicate jq filter extraction
4. Associative arrays for parameter-heavy functions
5. Logging consistency

### Medium Priority Items (Do Next)
6. PR field extraction unification
7. Config file helper
8. Error handling standardization
9. File reading utilities

### Low Priority Items (Optional)
10. Timestamp utility
11. GH_TOKEN centralization
12. Directory creation utility

---

## Questions for Review

Before implementation, consider:

1. **Associative arrays:** Confirm bash 4+ is available in all environments ✓
2. **Breaking changes:** Any external callers of these functions? (No - internal only)
3. **Testing coverage:** Sufficient test cases for validation? (Yes - existing tests)
4. **Rollback strategy:** Each stage is a commit, easy to revert ✓
5. **Documentation:** Update any docs mentioning these functions? (Check CLAUDE.md)

---

## End of Document

This plan provides a comprehensive roadmap for Phase 5B backend normalization and de-duplication. Each section includes specific code locations, examples, and estimated impact. Follow the staged implementation approach for safe, incremental improvements.
