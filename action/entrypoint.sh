#!/bin/bash
# Scorecard Action Entrypoint
set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source all libraries
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/setup.sh"
source "$SCRIPT_DIR/lib/github-api.sh"
source "$SCRIPT_DIR/lib/config-parser.sh"
source "$SCRIPT_DIR/lib/contributor-analyzer.sh"
source "$SCRIPT_DIR/lib/git-ops.sh"
source "$SCRIPT_DIR/lib/results-builder.sh"

# ============================================================================
# Configuration and Environment
# ============================================================================

GITHUB_TOKEN="${INPUT_GITHUB_TOKEN}"
CREATE_CONFIG_PR="${INPUT_CREATE_CONFIG_PR:-false}"
SCORECARDS_REPO="${INPUT_SCORECARDS_REPO}"
SCORECARDS_BRANCH="${INPUT_SCORECARDS_BRANCH:-catalog}"

# Extract org and repo from GITHUB_REPOSITORY (format: owner/repo)
SERVICE_ORG=$(echo "$GITHUB_REPOSITORY" | cut -d'/' -f1)
SERVICE_REPO=$(echo "$GITHUB_REPOSITORY" | cut -d'/' -f2)

# Directories
ACTION_DIR="$SCRIPT_DIR"
WORK_DIR=$(mktemp -d)
setup_cleanup_trap "$WORK_DIR"

CHECKS_DIR="$ACTION_DIR/../checks"
OUTPUT_DIR="$WORK_DIR/output"

mkdir -p "$OUTPUT_DIR"

# Initialize environment
initialize_environment

log_info "========================================"
log_info "Scorecards - Service Quality Measurement"
log_info "========================================"
log_info "Service: $GITHUB_REPOSITORY"
log_info "Commit: $GITHUB_SHA"

# ============================================================================
# Fetch PR Info (with fallback if not provided via environment)
# ============================================================================

# Fallback: Fetch PR info from GitHub if not provided via environment
if [ -z "${PR_NUMBER:-}" ]; then
    pr_data=$(get_pr_info "$SERVICE_ORG" "$SERVICE_REPO" "$GITHUB_TOKEN")

    if [ "$pr_data" != "[]" ]; then
        export PR_NUMBER=$(extract_pr_number "$pr_data")
        export PR_STATE=$(extract_pr_state "$pr_data")
        export PR_URL=$(extract_pr_url "$pr_data")
        log_success "Found installation PR #$PR_NUMBER (state: $PR_STATE)"
    else
        log_info "No installation PR found"
    fi
else
    log_info "Using PR info from environment: PR #$PR_NUMBER ($PR_STATE)"
fi

# ============================================================================
# Fetch Default Branch
# ============================================================================

DEFAULT_BRANCH=$(get_default_branch "$SERVICE_ORG" "$SERVICE_REPO" "$GITHUB_TOKEN")
log_success "Default branch: $DEFAULT_BRANCH"

# ============================================================================
# Check Configuration File
# ============================================================================

HAS_CONFIG=false
if has_scorecard_config "$GITHUB_WORKSPACE"; then
    log_success "Configuration file found: .scorecard/config.yml"
    HAS_CONFIG=true
else
    log_warning "Configuration file not found: .scorecard/config.yml"

    if [ "$CREATE_CONFIG_PR" = "true" ]; then
        log_info "Creating PR with config template..."
        # TODO: Implement PR creation logic
        log_warning "(PR creation not yet implemented)"
    fi

    log_info "Continuing with default configuration..."
fi

# ============================================================================
# Parse Configuration (or use defaults)
# ============================================================================

if [ "$HAS_CONFIG" = "true" ]; then
    SERVICE_NAME=$(get_service_name "$GITHUB_WORKSPACE" "$SERVICE_REPO")
    TEAM_NAME=$(get_team_name "$GITHUB_WORKSPACE")
    LINKS_JSON=$(parse_links_array "$GITHUB_WORKSPACE")
    OPENAPI_JSON=$(parse_openapi_config "$GITHUB_WORKSPACE")

    HAS_API="false"
    if [ "$OPENAPI_JSON" != "null" ]; then
        HAS_API="true"
    fi
else
    SERVICE_NAME="$SERVICE_REPO"
    TEAM_NAME=""
    LINKS_JSON="[]"
    OPENAPI_JSON="null"
    HAS_API="false"
fi

log_info "Service Name: $SERVICE_NAME"
log_info "Team: ${TEAM_NAME:-<not set>}"
log_info "Links: $(echo "$LINKS_JSON" | jq length) link(s)"
log_info "Has API: $HAS_API"

# Check if scorecards workflow is installed
INSTALLED="false"
if check_workflow_installed "$GITHUB_WORKSPACE"; then
    log_info "Installed: true (workflow detected)"
    INSTALLED="true"
else
    log_info "Installed: false (no workflow detected)"
fi
echo

# ============================================================================
# Build Docker Image
# ============================================================================

log_info "Building check runner Docker image..."

cd "$ACTION_DIR"
if ! docker build --no-cache -t scorecards-runner:latest -f Dockerfile . > "$WORK_DIR/docker-build.log" 2>&1; then
    echo -e "${RED}✗ Docker build failed${NC}"
    cat "$WORK_DIR/docker-build.log"
    exit 1
fi

log_success "Docker image built successfully"
echo

# ============================================================================
# Run Checks in Docker
# ============================================================================

log_info "Running checks..."
echo

RESULTS_FILE="$OUTPUT_DIR/results.json"

# Run Docker container with checks
if ! docker run --rm \
    -v "$CHECKS_DIR:/host-checks:ro" \
    -v "$GITHUB_WORKSPACE:/workspace:ro" \
    -v "$OUTPUT_DIR:/output" \
    scorecards-runner:latest \
    /host-checks /workspace /output/results.json; then
    echo -e "${RED}✗ Check execution failed${NC}"
    exit 1
fi

echo

# ============================================================================
# Calculate Score and Rank
# ============================================================================

log_info "Calculating score..."

SCORE_FILE="$OUTPUT_DIR/score.json"

bash "$ACTION_DIR/utils/score-calculator.sh" "$RESULTS_FILE" "$SCORE_FILE"

# Read score and rank
SCORE=$(jq -r '.score' "$SCORE_FILE")
RANK=$(jq -r '.rank' "$SCORE_FILE")
PASSED_CHECKS=$(jq -r '.passed_checks' "$SCORE_FILE")
TOTAL_CHECKS=$(jq -r '.total_checks' "$SCORE_FILE")

echo

# ============================================================================
# Generate Badges
# ============================================================================

log_info "Generating badges..."

SCORE_BADGE_FILE="$OUTPUT_DIR/score-badge.json"
RANK_BADGE_FILE="$OUTPUT_DIR/rank-badge.json"

bash "$ACTION_DIR/utils/badge-generator.sh" "$SCORE_FILE" "$SCORE_BADGE_FILE" "$RANK_BADGE_FILE"

echo

# ============================================================================
# Generate Check Suite Hash
# ============================================================================

log_info "Generating check suite hash..."

# Use update-checks-hash.sh to generate the hash (single source of truth)
CHECKS_HASH=$(bash "$ACTION_DIR/utils/update-checks-hash.sh" --hash-only)

# Count the number of check directories
CHECKS_COUNT=$(find "$CHECKS_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l)

echo "Checks hash: $CHECKS_HASH"
echo "Checks count: $CHECKS_COUNT"
echo

# ============================================================================
# Analyze Recent Contributors
# ============================================================================

CONTRIBUTORS_JSON=$(analyze_contributors "$GITHUB_WORKSPACE" 20)

# ============================================================================
# Create Final Results JSON
# ============================================================================

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CHECKS_JSON=$(cat "$RESULTS_FILE")

FINAL_RESULTS=$(build_results_json \
    "$SERVICE_ORG" "$SERVICE_REPO" "$SERVICE_NAME" "$TEAM_NAME" \
    "$SCORE" "$RANK" "$PASSED_CHECKS" "$TOTAL_CHECKS" \
    "$TIMESTAMP" "$CHECKS_HASH" "$CHECKS_COUNT" "$INSTALLED" \
    "$CONTRIBUTORS_JSON" "$CHECKS_JSON" "$LINKS_JSON" "$OPENAPI_JSON")

echo "$FINAL_RESULTS" | jq '.' > "$OUTPUT_DIR/final-results.json"

# ============================================================================
# Commit Results to Central Scorecards Repo
# ============================================================================

if [ -n "$SCORECARDS_REPO" ]; then
    update_catalog \
        "$GITHUB_TOKEN" "$SCORECARDS_REPO" "$SCORECARDS_BRANCH" \
        "$SERVICE_ORG" "$SERVICE_REPO" "$SERVICE_NAME" "$TEAM_NAME" \
        "$SCORE" "$RANK" "$PASSED_CHECKS" "$TOTAL_CHECKS" \
        "$HAS_API" "$CHECKS_HASH" "$CHECKS_COUNT" "$INSTALLED" \
        "$DEFAULT_BRANCH" "${PR_NUMBER:-}" "${PR_STATE:-}" "${PR_URL:-}" \
        "$OUTPUT_DIR" "$SCORE_BADGE_FILE" "$RANK_BADGE_FILE" "$WORK_DIR"
fi

# ============================================================================
# Set Action Outputs
# ============================================================================

# Copy results file to workspace for artifact upload
RESULTS_FILE_PATH="$GITHUB_WORKSPACE/scorecard-results.json"
cp "$OUTPUT_DIR/final-results.json" "$RESULTS_FILE_PATH"

# GitHub Actions set output syntax
echo "score=$SCORE" >> "$GITHUB_OUTPUT" 2>/dev/null || true
echo "rank=$RANK" >> "$GITHUB_OUTPUT" 2>/dev/null || true
echo "passed-checks=$PASSED_CHECKS" >> "$GITHUB_OUTPUT" 2>/dev/null || true
echo "total-checks=$TOTAL_CHECKS" >> "$GITHUB_OUTPUT" 2>/dev/null || true
echo "results-file=$RESULTS_FILE_PATH" >> "$GITHUB_OUTPUT" 2>/dev/null || true

# ============================================================================
# Summary
# ============================================================================

log_info "========================================"
log_info "Scorecard Summary"
log_info "========================================"
echo
echo "Score: $SCORE/100"
echo "Rank: $RANK"
echo "Checks: $PASSED_CHECKS/$TOTAL_CHECKS passed"
echo
echo -e "${GREEN}✓ Scorecard completed successfully${NC}"
echo

# Always exit 0 (non-blocking)
exit 0
