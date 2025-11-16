#!/bin/bash
# Scorecard Action Entrypoint
set -euo pipefail

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
# Fetch PR Info (with fallback if not provided via environment)
# ============================================================================

# Fallback: Fetch PR info from GitHub if not provided via environment
if [ -z "${PR_NUMBER:-}" ]; then
    echo "PR info not provided, checking for existing installation PR..."
    export GH_TOKEN="$GITHUB_TOKEN"

    pr_data=$(gh pr list --repo "$SERVICE_ORG/$SERVICE_REPO" --label "scorecards-install" --state all --json number,state,url --limit 1 2>/dev/null || echo "[]")

    if [ "$pr_data" != "[]" ]; then
        PR_NUMBER=$(echo "$pr_data" | jq -r '.[0].number')
        PR_STATE=$(echo "$pr_data" | jq -r '.[0].state')
        PR_URL=$(echo "$pr_data" | jq -r '.[0].url')
        echo -e "${GREEN}✓${NC} Found installation PR #$PR_NUMBER (state: $PR_STATE)"
    else
        echo "  No installation PR found"
    fi
else
    echo -e "${GREEN}✓${NC} Using PR info from environment: PR #$PR_NUMBER ($PR_STATE)"
fi

echo

# ============================================================================
# Fetch Default Branch
# ============================================================================

echo "Fetching default branch..."
export GH_TOKEN="$GITHUB_TOKEN"

DEFAULT_BRANCH=$(gh api "repos/$SERVICE_ORG/$SERVICE_REPO" --jq '.default_branch' 2>/dev/null || echo "main")
echo -e "${GREEN}✓${NC} Default branch: $DEFAULT_BRANCH"

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

    # Parse links array from config (if exists)
    # Extract links section and convert to JSON array
    LINKS_JSON="[]"
    if grep -q "links:" "$CONFIG_FILE"; then
        # Use python to parse YAML links section properly
        if command -v python3 &> /dev/null; then
            LINKS_JSON=$(python3 -c "
import yaml, json, sys
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = yaml.safe_load(f)
        links = config.get('service', {}).get('links', [])
        print(json.dumps(links))
except:
    print('[]')
" 2>/dev/null || echo "[]")
        fi
    fi

    # Parse OpenAPI configuration (if exists)
    OPENAPI_JSON="null"
    HAS_API="false"
    if grep -q "openapi:" "$CONFIG_FILE"; then
        if command -v python3 &> /dev/null; then
            OPENAPI_JSON=$(python3 -c "
import yaml, json, sys
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = yaml.safe_load(f)
        openapi = config.get('openapi', None)
        if openapi:
            print(json.dumps(openapi))
        else:
            print('null')
except:
    print('null')
" 2>/dev/null || echo "null")
            if [ "$OPENAPI_JSON" != "null" ]; then
                HAS_API="true"
            fi
        fi
    fi
else
    SERVICE_NAME="$SERVICE_REPO"
    TEAM_NAME=""
    LINKS_JSON="[]"
    OPENAPI_JSON="null"
    HAS_API="false"
fi

echo "Service Name: $SERVICE_NAME"
echo "Team: ${TEAM_NAME:-<not set>}"
echo "Links: $(echo "$LINKS_JSON" | jq length) link(s)"
echo "Has API: $HAS_API"

# Check if scorecards workflow is installed
INSTALLED="false"
WORKFLOW_FILE="$GITHUB_WORKSPACE/.github/workflows/scorecards.yml"
if [ -f "$WORKFLOW_FILE" ]; then
    echo "Installed: true (workflow detected)"
    INSTALLED="true"
else
    echo "Installed: false (no workflow detected)"
fi
echo

# ============================================================================
# Build Docker Image
# ============================================================================

echo -e "${BLUE}Building check runner Docker image...${NC}"

cd "$ACTION_DIR"
if ! docker build --no-cache -t scorecards-runner:latest -f Dockerfile . > "$WORK_DIR/docker-build.log" 2>&1; then
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
# Generate Check Suite Hash
# ============================================================================

echo -e "${BLUE}Generating check suite hash...${NC}"

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

echo -e "${BLUE}Analyzing recent contributors...${NC}"

CONTRIBUTORS_JSON="[]"

# Only analyze if we're in a git repository
if [ -d "$GITHUB_WORKSPACE/.git" ]; then
    cd "$GITHUB_WORKSPACE"

    # Get last 20 commits with author info
    # Format: AuthorName|author@email.com|2025-11-14 16:01:42 -0300|abc1234
    COMMITS_DATA=$(git log -20 --pretty=format:'%an|%ae|%ad|%h' --date=iso 2>/dev/null || echo "")

    if [ -n "$COMMITS_DATA" ]; then
        # Create temporary file for processing
        CONTRIBUTORS_FILE=$(mktemp)

        # Process commits and aggregate by author email
        echo "$COMMITS_DATA" | while IFS='|' read -r author_name author_email commit_date commit_hash; do
            echo "$author_email|$author_name|$commit_date|$commit_hash"
        done | awk -F'|' '
        {
            email = $1
            name = $2
            date = $3
            hash = $4

            # Count commits per author
            count[email]++

            # Store name (last occurrence)
            names[email] = name

            # Store most recent date and hash (first occurrence is most recent due to git log order)
            if (!(email in dates)) {
                dates[email] = date
                hashes[email] = hash
            }
        }
        END {
            for (email in count) {
                # Convert ISO 8601 date to UTC timestamp for JSON
                # Remove timezone for simplicity, keep ISO format
                gsub(/ [-+][0-9]+$/, "", dates[email])
                gsub(/ /, "T", dates[email])
                print names[email] "|" email "|" count[email] "|" dates[email] "Z|" hashes[email]
            }
        }
        ' | sort -t'|' -k3 -rn > "$CONTRIBUTORS_FILE"

        # Convert to JSON array
        CONTRIBUTORS_JSON=$(jq -R -n '
            [inputs |
             split("|") |
             {
                 name: .[0],
                 email: .[1],
                 commit_count: (.[2] | tonumber),
                 last_commit_date: .[3],
                 last_commit_hash: .[4]
             }]
        ' < "$CONTRIBUTORS_FILE")

        rm -f "$CONTRIBUTORS_FILE"

        CONTRIBUTORS_COUNT=$(echo "$CONTRIBUTORS_JSON" | jq 'length')
        echo "Found $CONTRIBUTORS_COUNT contributor(s) in last 20 commits"
    else
        echo "No git history available"
    fi
else
    echo "Not a git repository - skipping contributor analysis"
fi

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
    --argjson links "$LINKS_JSON" \
    --argjson openapi "$OPENAPI_JSON" \
    --arg commit_sha "$GITHUB_SHA" \
    --arg timestamp "$TIMESTAMP" \
    --argjson score "$SCORE" \
    --arg rank "$RANK" \
    --argjson passed_checks "$PASSED_CHECKS" \
    --argjson total_checks "$TOTAL_CHECKS" \
    --arg checks_hash "$CHECKS_HASH" \
    --argjson checks_count "$CHECKS_COUNT" \
    --argjson installed "$INSTALLED" \
    --argjson recent_contributors "$CONTRIBUTORS_JSON" \
    --argjson checks "$(cat "$RESULTS_FILE")" \
    '{
        service: {
            org: $service_org,
            repo: $service_repo,
            name: $service_name,
            team: $team,
            links: $links,
            openapi: (if $openapi != null then $openapi else null end)
        },
        score: $score,
        rank: $rank,
        passed_checks: $passed_checks,
        total_checks: $total_checks,
        commit_sha: $commit_sha,
        timestamp: $timestamp,
        checks_hash: $checks_hash,
        checks_count: $checks_count,
        installed: $installed,
        recent_contributors: $recent_contributors,
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

    if ! git clone -b "$SCORECARDS_BRANCH" "https://x-access-token:${GITHUB_TOKEN}@github.com/${SCORECARDS_REPO}.git" "$CENTRAL_REPO_DIR" > "$WORK_DIR/git-clone.log" 2>&1; then
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

        # Check if results have meaningfully changed
        SKIP_COMMIT=false
        OLD_RESULTS_FILE="results/$SERVICE_ORG/$SERVICE_REPO/results.json"
        OLD_REGISTRY_FILE="registry/$SERVICE_ORG/$SERVICE_REPO.json"

        # Always commit if registry file doesn't exist in new format (migration case)
        if [ ! -f "$OLD_REGISTRY_FILE" ]; then
            echo "Registry file doesn't exist in new format - will create it"
            SKIP_COMMIT=false
        elif [ -f "$OLD_RESULTS_FILE" ]; then
            echo "Comparing with previous results..."

            # Extract meaningful fields (excluding timestamp, commit_sha, stdout, stderr, duration)
            OLD_SUMMARY=$(jq -S '{
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
            }' "$OLD_RESULTS_FILE")

            NEW_SUMMARY=$(jq -S '{
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
            }' "$OUTPUT_DIR/final-results.json")

            if [ "$OLD_SUMMARY" = "$NEW_SUMMARY" ]; then
                echo -e "${YELLOW}No meaningful changes detected - skipping commit${NC}"
                SKIP_COMMIT=true
            else
                echo "Changes detected - will update catalog"
            fi
        else
            echo "First run for this service - will create initial entry"
        fi

        # Check if PR state changed (override skip if it did)
        if [ -n "$PR_NUMBER" ] && [ -n "$PR_STATE" ]; then
            OLD_PR_STATE=$(jq -r '.installation_pr.state // ""' "registry/$SERVICE_ORG/$SERVICE_REPO.json" 2>/dev/null || echo "")
            if [ "$OLD_PR_STATE" != "$PR_STATE" ]; then
                echo "PR state changed: $OLD_PR_STATE → $PR_STATE - forcing catalog update"
                SKIP_COMMIT=false
            fi
        fi

        # Only update files if there are meaningful changes
        if [ "$SKIP_COMMIT" = "false" ]; then
            # Copy results
            cp "$OUTPUT_DIR/final-results.json" "results/$SERVICE_ORG/$SERVICE_REPO/results.json"

            # Copy badges
            cp "$SCORE_BADGE_FILE" "badges/$SERVICE_ORG/$SERVICE_REPO/score.json"
            cp "$RANK_BADGE_FILE" "badges/$SERVICE_ORG/$SERVICE_REPO/rank.json"

            # Create per-service registry entry (eliminates shared file conflicts)
            mkdir -p "registry/$SERVICE_ORG"
            REGISTRY_FILE="registry/$SERVICE_ORG/$SERVICE_REPO.json"

            # Write this service's registry entry
            # Build jq command with optional PR info
            JQ_ARGS=(
                -n
                --arg org "$SERVICE_ORG"
                --arg repo "$SERVICE_REPO"
                --arg name "$SERVICE_NAME"
                --arg team "$TEAM_NAME"
                --argjson score "$SCORE"
                --arg rank "$RANK"
                --arg timestamp "$TIMESTAMP"
                --argjson has_api "$HAS_API"
                --arg checks_hash "$CHECKS_HASH"
                --argjson checks_count "$CHECKS_COUNT"
                --argjson installed "$INSTALLED"
                --arg default_branch "$DEFAULT_BRANCH"
            )

            # Add PR info if available
            if [ -n "$PR_NUMBER" ] && [ -n "$PR_STATE" ] && [ -n "$PR_URL" ]; then
                JQ_ARGS+=(
                    --argjson pr_number "$PR_NUMBER"
                    --arg pr_state "$PR_STATE"
                    --arg pr_url "$PR_URL"
                )
                JQ_FILTER='{
                    org: $org,
                    repo: $repo,
                    name: $name,
                    team: $team,
                    score: $score,
                    rank: $rank,
                    last_updated: $timestamp,
                    has_api: $has_api,
                    checks_hash: $checks_hash,
                    checks_count: $checks_count,
                    installed: $installed,
                    default_branch: $default_branch,
                    installation_pr: {
                        number: $pr_number,
                        state: $pr_state,
                        url: $pr_url
                    }
                }'
            else
                JQ_FILTER='{
                    org: $org,
                    repo: $repo,
                    name: $name,
                    team: $team,
                    score: $score,
                    rank: $rank,
                    last_updated: $timestamp,
                    has_api: $has_api,
                    checks_hash: $checks_hash,
                    checks_count: $checks_count,
                    installed: $installed,
                    default_branch: $default_branch
                }'
            fi

            jq "${JQ_ARGS[@]}" "$JQ_FILTER" > "$REGISTRY_FILE"

            # Commit and push service results
            git add results/ badges/ registry/

            if git diff --staged --quiet; then
                echo -e "${YELLOW}No meaningful changes to commit${NC}"
            else
                git commit -m "Update scorecard for $SERVICE_ORG/$SERVICE_REPO

Score: $SCORE/100
Rank: $RANK
Checks: $PASSED_CHECKS/$TOTAL_CHECKS passed

Commit: $GITHUB_SHA"

                # Retry loop with exponential backoff to handle concurrent pushes
                MAX_RETRIES=5
                RETRY_COUNT=0
                PUSH_SUCCESS=false

                while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
                    if git push origin "$SCORECARDS_BRANCH" > "$WORK_DIR/git-push.log" 2>&1; then
                        echo -e "${GREEN}✓${NC} Results committed to central repository"
                        PUSH_SUCCESS=true
                        break
                    else
                        RETRY_COUNT=$((RETRY_COUNT + 1))

                        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                            echo -e "${YELLOW}Push failed (attempt $RETRY_COUNT/$MAX_RETRIES)${NC}"

                            # Fetch latest changes and rebase
                            echo "Fetching latest changes and rebasing..."
                            git fetch origin "$SCORECARDS_BRANCH"

                            if git rebase "origin/$SCORECARDS_BRANCH" > "$WORK_DIR/git-rebase.log" 2>&1; then
                                # Rebase successful - regenerate registry file to ensure we have latest data
                                echo "Rebase successful, regenerating registry entry..."
                                jq -n \
                                    --arg org "$SERVICE_ORG" \
                                    --arg repo "$SERVICE_REPO" \
                                    --arg name "$SERVICE_NAME" \
                                    --arg team "$TEAM_NAME" \
                                    --argjson score "$SCORE" \
                                    --arg rank "$RANK" \
                                    --arg timestamp "$TIMESTAMP" \
                                    --argjson has_api "$HAS_API" \
                                    --arg checks_hash "$CHECKS_HASH" \
                                    --argjson checks_count "$CHECKS_COUNT" \
                                    --argjson installed "$INSTALLED" \
                                    '{
                                        org: $org,
                                        repo: $repo,
                                        name: $name,
                                        team: $team,
                                        score: $score,
                                        rank: $rank,
                                        last_updated: $timestamp,
                                        has_api: $has_api,
                                        checks_hash: $checks_hash,
                                        checks_count: $checks_count,
                                        installed: $installed
                                    }' > "$REGISTRY_FILE"

                                git add "$REGISTRY_FILE"
                                git commit --amend --no-edit

                                # Exponential backoff with jitter (5-15 seconds)
                                BACKOFF=$((5 + RETRY_COUNT * 2 + RANDOM % 5))
                                echo "Retrying in ${BACKOFF}s..."
                                sleep $BACKOFF
                            else
                                echo -e "${YELLOW}⚠ Rebase failed${NC}"
                                cat "$WORK_DIR/git-rebase.log"
                                break
                            fi
                        fi
                    fi
                done

                if [ "$PUSH_SUCCESS" = "false" ]; then
                    echo -e "${YELLOW}⚠ Failed to push after $MAX_RETRIES attempts${NC}"
                    cat "$WORK_DIR/git-push.log"
                fi
            fi
        fi

        # Write current checks hash to a well-known location for UI
        # This is done on every run (outside SKIP_COMMIT check) since it represents
        # the current state of checks, not service-specific results
        echo "$CHECKS_HASH" > "current-checks-hash.txt"
        jq -n --arg hash "$CHECKS_HASH" --argjson count "$CHECKS_COUNT" '{
            checks_hash: $hash,
            checks_count: $count,
            generated_at: (now | todate)
        }' > "current-checks.json"

        # Commit current-checks files only if they changed
        # This happens when checks are added, modified, or removed
        git add current-checks.json current-checks-hash.txt

        if ! git diff --staged --quiet; then
            echo -e "${BLUE}Check suite changed - committing metadata...${NC}"
            git commit -m "Update check suite metadata

Checks hash: $CHECKS_HASH
Checks count: $CHECKS_COUNT"

            if git push origin "$SCORECARDS_BRANCH" > "$WORK_DIR/git-push-checks.log" 2>&1; then
                echo -e "${GREEN}✓${NC} Check suite metadata committed"
            else
                echo -e "${YELLOW}⚠ Failed to push check suite metadata${NC}"
                cat "$WORK_DIR/git-push-checks.log"
            fi
        else
            echo "Check suite unchanged - no metadata commit needed"
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
