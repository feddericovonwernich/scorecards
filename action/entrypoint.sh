#!/bin/bash
# Scorecard Action Entrypoint
set -euo pipefail

# ============================================================================
# Configuration and Environment
# ============================================================================

GITHUB_TOKEN="${INPUT_GITHUB_TOKEN}"
CREATE_CONFIG_PR="${INPUT_CREATE_CONFIG_PR:-false}"
SCORECARDS_REPO="${INPUT_SCORECARDS_REPO}"
SCORECARDS_BRANCH="${INPUT_SCORECARDS_BRANCH:-main}"

# Extract org and repo from GITHUB_REPOSITORY (format: owner/repo)
SERVICE_ORG=$(echo "$GITHUB_REPOSITORY" | cut -d'/' -f1)
SERVICE_REPO=$(echo "$GITHUB_REPOSITORY" | cut -d'/' -f2)

# Directories
ACTION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR=$(mktemp -d)
CHECKS_DIR="$ACTION_DIR/../checks"
OUTPUT_DIR="$WORK_DIR/output"

mkdir -p "$OUTPUT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Scorecards - Service Quality Measurement${NC}"
echo -e "${BLUE}========================================${NC}"
echo
echo "Service: $GITHUB_REPOSITORY"
echo "Commit: $GITHUB_SHA"
echo

# ============================================================================
# Check Configuration File
# ============================================================================

CONFIG_FILE="$GITHUB_WORKSPACE/.scorecard/config.yml"
HAS_CONFIG=false

if [ -f "$CONFIG_FILE" ]; then
    echo -e "${GREEN}✓${NC} Configuration file found: .scorecard/config.yml"
    HAS_CONFIG=true
else
    echo -e "${YELLOW}!${NC} Configuration file not found: .scorecard/config.yml"

    if [ "$CREATE_CONFIG_PR" = "true" ]; then
        echo "  Creating PR with config template..."
        # TODO: Implement PR creation logic
        # For now, we'll just continue without config
        echo -e "${YELLOW}  (PR creation not yet implemented)${NC}"
    fi

    echo "  Continuing with default configuration..."
fi

echo

# ============================================================================
# Parse Configuration (or use defaults)
# ============================================================================

if [ "$HAS_CONFIG" = "true" ]; then
    # Parse config file (requires yq or similar - for now use simple defaults)
    SERVICE_NAME=$(grep -A 1 "service:" "$CONFIG_FILE" | grep "name:" | sed 's/.*name: *"\?\([^"]*\)"\?.*/\1/' || echo "$SERVICE_REPO")
    TEAM_NAME=$(grep "team:" "$CONFIG_FILE" | sed 's/.*team: *"\?\([^"]*\)"\?.*/\1/' || echo "")
else
    SERVICE_NAME="$SERVICE_REPO"
    TEAM_NAME=""
fi

echo "Service Name: $SERVICE_NAME"
echo "Team: ${TEAM_NAME:-<not set>}"
echo

# ============================================================================
# Build Docker Image
# ============================================================================

echo -e "${BLUE}Building check runner Docker image...${NC}"

cd "$ACTION_DIR"
if ! docker build -t scorecards-runner:latest -f Dockerfile . > "$WORK_DIR/docker-build.log" 2>&1; then
    echo -e "${RED}✗ Docker build failed${NC}"
    cat "$WORK_DIR/docker-build.log"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker image built successfully"
echo

# ============================================================================
# Run Checks in Docker
# ============================================================================

echo -e "${BLUE}Running checks...${NC}"
echo

RESULTS_FILE="$OUTPUT_DIR/results.json"

# Run Docker container with checks
if ! docker run --rm \
    -v "$CHECKS_DIR:/checks:ro" \
    -v "$GITHUB_WORKSPACE:/workspace:ro" \
    -v "$OUTPUT_DIR:/output" \
    scorecards-runner:latest \
    /checks /workspace /output/results.json; then
    echo -e "${RED}✗ Check execution failed${NC}"
    exit 1
fi

echo

# ============================================================================
# Calculate Score and Rank
# ============================================================================

echo -e "${BLUE}Calculating score...${NC}"

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

echo -e "${BLUE}Generating badges...${NC}"

SCORE_BADGE_FILE="$OUTPUT_DIR/score-badge.json"
RANK_BADGE_FILE="$OUTPUT_DIR/rank-badge.json"

bash "$ACTION_DIR/utils/badge-generator.sh" "$SCORE_FILE" "$SCORE_BADGE_FILE" "$RANK_BADGE_FILE"

echo

# ============================================================================
# Create Final Results JSON
# ============================================================================

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

FINAL_RESULTS=$(jq -n \
    --arg service_org "$SERVICE_ORG" \
    --arg service_repo "$SERVICE_REPO" \
    --arg service_name "$SERVICE_NAME" \
    --arg team "$TEAM_NAME" \
    --arg commit_sha "$GITHUB_SHA" \
    --arg timestamp "$TIMESTAMP" \
    --argjson score "$SCORE" \
    --arg rank "$RANK" \
    --argjson passed_checks "$PASSED_CHECKS" \
    --argjson total_checks "$TOTAL_CHECKS" \
    --argjson checks "$(cat "$RESULTS_FILE")" \
    '{
        service: {
            org: $service_org,
            repo: $service_repo,
            name: $service_name,
            team: $team
        },
        score: $score,
        rank: $rank,
        passed_checks: $passed_checks,
        total_checks: $total_checks,
        commit_sha: $commit_sha,
        timestamp: $timestamp,
        checks: $checks
    }')

echo "$FINAL_RESULTS" | jq '.' > "$OUTPUT_DIR/final-results.json"

# ============================================================================
# Commit Results to Central Scorecards Repo
# ============================================================================

if [ -n "$SCORECARDS_REPO" ]; then
    echo -e "${BLUE}Committing results to central repository...${NC}"
    echo "Central repo: $SCORECARDS_REPO"

    # Clone central repo
    CENTRAL_REPO_DIR="$WORK_DIR/central-repo"

    if ! git clone "https://x-access-token:${GITHUB_TOKEN}@github.com/${SCORECARDS_REPO}.git" "$CENTRAL_REPO_DIR" > "$WORK_DIR/git-clone.log" 2>&1; then
        echo -e "${YELLOW}⚠ Failed to clone central repository${NC}"
        echo "  Results will not be stored centrally"
        cat "$WORK_DIR/git-clone.log"
    else
        cd "$CENTRAL_REPO_DIR"
        git config user.name "scorecard-bot"
        git config user.email "scorecard-bot@users.noreply.github.com"

        # Create directories for this service
        mkdir -p "results/$SERVICE_ORG/$SERVICE_REPO"
        mkdir -p "badges/$SERVICE_ORG/$SERVICE_REPO"
        mkdir -p "registry"

        # Copy results
        cp "$OUTPUT_DIR/final-results.json" "results/$SERVICE_ORG/$SERVICE_REPO/results.json"

        # Copy badges
        cp "$SCORE_BADGE_FILE" "badges/$SERVICE_ORG/$SERVICE_REPO/score.json"
        cp "$RANK_BADGE_FILE" "badges/$SERVICE_ORG/$SERVICE_REPO/rank.json"

        # Update or create registry entry
        REGISTRY_FILE="registry/services.json"

        if [ ! -f "$REGISTRY_FILE" ]; then
            echo "[]" > "$REGISTRY_FILE"
        fi

        # Add or update service in registry
        REGISTRY_ENTRY=$(jq -n \
            --arg org "$SERVICE_ORG" \
            --arg repo "$SERVICE_REPO" \
            --arg name "$SERVICE_NAME" \
            --arg team "$TEAM_NAME" \
            --argjson score "$SCORE" \
            --arg rank "$RANK" \
            --arg timestamp "$TIMESTAMP" \
            '{
                org: $org,
                repo: $repo,
                name: $name,
                team: $team,
                score: $score,
                rank: $rank,
                last_updated: $timestamp
            }')

        # Update registry (remove old entry if exists, add new entry)
        jq --argjson entry "$REGISTRY_ENTRY" \
            --arg org "$SERVICE_ORG" \
            --arg repo "$SERVICE_REPO" \
            'map(select(.org != $org or .repo != $repo)) + [$entry]' \
            "$REGISTRY_FILE" > "$REGISTRY_FILE.tmp"

        mv "$REGISTRY_FILE.tmp" "$REGISTRY_FILE"

        # Commit and push
        git add results/ badges/ registry/

        if git diff --staged --quiet; then
            echo -e "${YELLOW}No changes to commit${NC}"
        else
            git commit -m "Update scorecard for $SERVICE_ORG/$SERVICE_REPO

Score: $SCORE/100
Rank: $RANK
Checks: $PASSED_CHECKS/$TOTAL_CHECKS passed

Commit: $GITHUB_SHA"

            if git push origin "$SCORECARDS_BRANCH" > "$WORK_DIR/git-push.log" 2>&1; then
                echo -e "${GREEN}✓${NC} Results committed to central repository"
            else
                echo -e "${YELLOW}⚠ Failed to push to central repository${NC}"
                cat "$WORK_DIR/git-push.log"
            fi
        fi
    fi

    echo
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

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Scorecard Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo
echo "Score: $SCORE/100"
echo "Rank: $RANK"
echo "Checks: $PASSED_CHECKS/$TOTAL_CHECKS passed"
echo
echo -e "${GREEN}✓ Scorecard completed successfully${NC}"
echo

# Always exit 0 (non-blocking)
exit 0
