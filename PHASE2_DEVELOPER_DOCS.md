# Phase 2: Developer Documentation Improvements

## Overview
This phase focuses on code-level documentation to help contributors understand and work with the Scorecards codebase effectively.

**Goal:** Make the codebase self-documenting with comprehensive inline documentation, API references, and enhanced contribution guidelines.

**Estimated Effort:** 12-16 hours

---

## Tasks

### 1. Add JSDoc Comments to JavaScript Modules (4-5 hours)

**Location:** `docs/src/` directory (all `.js` files)

**Purpose:** Document all JavaScript functions, classes, and modules with JSDoc comments for better IDE support and maintainability.

**Modules to Document:**

#### docs/src/api/github.js
```javascript
/**
 * GitHub API client for Scorecards catalog operations
 * @module api/github
 */

/**
 * Triggers a workflow in a service repository
 * @param {string} org - GitHub organization name
 * @param {string} repo - Repository name
 * @param {string} token - GitHub Personal Access Token with repo scope
 * @param {string} workflowId - Workflow file name (e.g., 'scorecards.yml') or workflow ID
 * @returns {Promise<Object>} GitHub API response
 * @throws {Error} If API request fails, token is invalid, or rate limit is exceeded
 * @example
 * const response = await triggerWorkflow('my-org', 'my-service', token, 'scorecards.yml');
 * console.log(response.status); // 204
 */
export async function triggerWorkflow(org, repo, token, workflowId) {
  // implementation
}

/**
 * Fetches the registry for a specific service
 * @param {string} org - GitHub organization name
 * @param {string} repo - Repository name
 * @returns {Promise<Object>} Service registry data including score, rank, and check results
 * @throws {Error} If service not found or registry is inaccessible
 * @example
 * const registry = await fetchServiceRegistry('my-org', 'my-service');
 * console.log(registry.score); // 85
 */
export async function fetchServiceRegistry(org, repo) {
  // implementation
}

/**
 * Fetches the consolidated registry containing all services
 * @returns {Promise<Array<Object>>} Array of service registry objects
 * @throws {Error} If consolidated registry is not found or invalid
 * @example
 * const services = await fetchConsolidatedRegistry();
 * console.log(services.length); // 42
 */
export async function fetchConsolidatedRegistry() {
  // implementation
}
```

#### docs/src/components/service-card.js
```javascript
/**
 * Service card component for catalog UI
 * Displays a summary card for a single service with score, rank, and metadata
 * @module components/service-card
 */

/**
 * Creates and returns a service card DOM element
 * @param {Object} service - Service data object
 * @param {string} service.org - Organization name
 * @param {string} service.repo - Repository name
 * @param {number} service.score - Quality score (0-100)
 * @param {string} service.rank - Quality rank (Bronze, Silver, Gold, Platinum)
 * @param {string} [service.team] - Team name (optional)
 * @param {string} [service.description] - Service description (optional)
 * @param {Array<Object>} service.checks - Array of check results
 * @param {boolean} [service.is_stale] - Whether results are stale
 * @returns {HTMLElement} Service card DOM element
 * @example
 * const card = createServiceCard({
 *   org: 'my-org',
 *   repo: 'my-service',
 *   score: 85,
 *   rank: 'Gold',
 *   team: 'Platform Team',
 *   checks: [...]
 * });
 * document.querySelector('#services').appendChild(card);
 */
export function createServiceCard(service) {
  // implementation
}

/**
 * Gets the CSS class for a rank badge
 * @param {string} rank - Rank name (Bronze, Silver, Gold, Platinum)
 * @returns {string} CSS class name
 * @private
 */
function getRankClass(rank) {
  // implementation
}
```

#### docs/src/components/filters.js
```javascript
/**
 * Filter and search component for catalog UI
 * Handles filtering services by rank, team, stale status, and search query
 * @module components/filters
 */

/**
 * Initializes filter controls and event listeners
 * @param {Array<Object>} services - Array of all service objects
 * @param {Function} onFilterChange - Callback function called when filters change
 * @returns {void}
 * @example
 * initializeFilters(allServices, (filtered) => {
 *   renderServices(filtered);
 * });
 */
export function initializeFilters(services, onFilterChange) {
  // implementation
}

/**
 * Applies all active filters to the services array
 * @param {Array<Object>} services - Array of service objects to filter
 * @param {Object} filters - Active filter criteria
 * @param {string} [filters.rank] - Filter by rank
 * @param {string} [filters.team] - Filter by team
 * @param {boolean} [filters.stale] - Filter by staleness
 * @param {string} [filters.search] - Search query
 * @returns {Array<Object>} Filtered services array
 * @example
 * const filtered = applyFilters(allServices, {
 *   rank: 'Gold',
 *   search: 'api'
 * });
 */
export function applyFilters(services, filters) {
  // implementation
}

/**
 * Matches a service against a search query
 * Searches in: org, repo, team, description
 * @param {Object} service - Service object
 * @param {string} query - Search query (case-insensitive)
 * @returns {boolean} True if service matches query
 * @private
 */
function matchesSearch(service, query) {
  // implementation
}
```

#### docs/src/components/statistics.js
```javascript
/**
 * Statistics dashboard component
 * Displays aggregate statistics across all services
 * @module components/statistics
 */

/**
 * Calculates and displays statistics for all services
 * @param {Array<Object>} services - Array of service objects
 * @returns {Object} Statistics object
 * @returns {number} return.totalServices - Total number of services
 * @returns {number} return.averageScore - Average score across all services
 * @returns {Object} return.rankDistribution - Count of services by rank
 * @returns {number} return.staleCount - Number of services with stale results
 * @example
 * const stats = calculateStatistics(allServices);
 * console.log(`Average score: ${stats.averageScore}%`);
 */
export function calculateStatistics(services) {
  // implementation
}

/**
 * Renders statistics to the statistics section of the UI
 * @param {Object} stats - Statistics object from calculateStatistics
 * @returns {void}
 */
export function renderStatistics(stats) {
  // implementation
}

/**
 * Gets rank distribution as percentages
 * @param {Object} rankCounts - Object with counts by rank
 * @param {number} total - Total number of services
 * @returns {Object} Percentages by rank
 * @private
 */
function getRankPercentages(rankCounts, total) {
  // implementation
}
```

#### docs/src/data/settings.js
```javascript
/**
 * Configuration settings for the Scorecards catalog UI
 * @module data/settings
 */

/**
 * Rank thresholds for score ranges
 * @constant {Object}
 * @property {number} platinum - Minimum score for Platinum rank (90)
 * @property {number} gold - Minimum score for Gold rank (75)
 * @property {number} silver - Minimum score for Silver rank (50)
 * @property {number} bronze - Minimum score for Bronze rank (0)
 */
export const RANK_THRESHOLDS = {
  platinum: 90,
  gold: 75,
  silver: 50,
  bronze: 0
};

/**
 * Maps score to rank based on thresholds
 * @param {number} score - Score percentage (0-100)
 * @returns {string} Rank name (Bronze, Silver, Gold, or Platinum)
 * @example
 * getRank(85); // 'Gold'
 * getRank(92); // 'Platinum'
 */
export function getRank(score) {
  // implementation
}

/**
 * Category display names and icons
 * @constant {Object}
 */
export const CATEGORIES = {
  documentation: { name: 'Documentation', icon: '📄' },
  testing: { name: 'Testing', icon: '🧪' },
  architecture: { name: 'Architecture', icon: '🏗️' },
  security: { name: 'Security', icon: '🔒' },
  operations: { name: 'Operations', icon: '📦' }
};
```

#### docs/src/utils/scoring.js
```javascript
/**
 * Scoring utility functions
 * @module utils/scoring
 */

/**
 * Calculates the quality score for a service
 * @param {Array<Object>} checks - Array of check result objects
 * @param {string} checks[].status - Check status ('pass' or 'fail')
 * @param {number} checks[].weight - Check weight (points)
 * @param {boolean} [checks[].disabled] - Whether check is disabled
 * @returns {Object} Score calculation result
 * @returns {number} return.score - Percentage score (0-100)
 * @returns {number} return.pointsEarned - Total points earned
 * @returns {number} return.totalPoints - Total possible points
 * @returns {number} return.passedCount - Number of checks passed
 * @returns {number} return.totalChecks - Total number of active checks
 * @example
 * const result = calculateScore([
 *   { status: 'pass', weight: 10 },
 *   { status: 'fail', weight: 5 },
 *   { status: 'pass', weight: 8, disabled: true } // excluded
 * ]);
 * console.log(result.score); // 67 (10/15 * 100)
 */
export function calculateScore(checks) {
  // implementation
}

/**
 * Determines if results are stale based on checks hash
 * @param {string} serviceChecksHash - Checks hash from service results
 * @param {string} currentChecksHash - Current checks hash from system
 * @returns {boolean} True if results are stale
 * @example
 * const stale = isStale('abc123', 'def456'); // true
 */
export function isStale(serviceChecksHash, currentChecksHash) {
  // implementation
}

/**
 * Groups checks by category
 * @param {Array<Object>} checks - Array of check objects
 * @returns {Object} Checks grouped by category key
 * @example
 * const grouped = groupChecksByCategory(checks);
 * // { documentation: [...], testing: [...], ... }
 */
export function groupChecksByCategory(checks) {
  // implementation
}
```

#### docs/src/utils/formatting.js
```javascript
/**
 * Formatting utility functions
 * @module utils/formatting
 */

/**
 * Formats a timestamp as a human-readable date
 * @param {string|number} timestamp - ISO 8601 timestamp or Unix timestamp
 * @returns {string} Formatted date string (e.g., "Jan 15, 2024")
 * @example
 * formatDate('2024-01-15T12:00:00Z'); // 'Jan 15, 2024'
 */
export function formatDate(timestamp) {
  // implementation
}

/**
 * Formats a timestamp as a relative time (e.g., "2 days ago")
 * @param {string|number} timestamp - ISO 8601 timestamp or Unix timestamp
 * @returns {string} Relative time string
 * @example
 * formatRelativeTime('2024-01-13T12:00:00Z'); // '2 days ago'
 */
export function formatRelativeTime(timestamp) {
  // implementation
}

/**
 * Truncates text to a maximum length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 * @example
 * truncate('Very long description here', 20); // 'Very long descripti...'
 */
export function truncate(text, maxLength) {
  // implementation
}

/**
 * Formats a percentage with specified decimal places
 * @param {number} value - Percentage value (0-100)
 * @param {number} [decimals=0] - Number of decimal places
 * @returns {string} Formatted percentage string
 * @example
 * formatPercentage(85.666, 1); // '85.7%'
 */
export function formatPercentage(value, decimals = 0) {
  // implementation
}
```

#### docs/src/main.js
```javascript
/**
 * Main entry point for Scorecards catalog UI
 * Initializes the application and coordinates module loading
 * @module main
 */

/**
 * Application state
 * @typedef {Object} AppState
 * @property {Array<Object>} services - All services from registry
 * @property {Array<Object>} filteredServices - Currently filtered services
 * @property {Object} filters - Active filter criteria
 * @property {string} currentView - Current view name ('list', 'detail')
 * @property {Object|null} selectedService - Currently selected service
 */

/**
 * Initializes the Scorecards catalog application
 * @async
 * @returns {Promise<void>}
 * @throws {Error} If registry cannot be loaded
 */
async function initializeApp() {
  // implementation
}

/**
 * Loads the consolidated registry from GitHub
 * @async
 * @returns {Promise<Array<Object>>} Array of service objects
 * @throws {Error} If registry fetch fails or is invalid JSON
 */
async function loadRegistry() {
  // implementation
}

/**
 * Renders the service list view
 * @param {Array<Object>} services - Services to render
 * @returns {void}
 */
function renderServiceList(services) {
  // implementation
}

/**
 * Renders the service detail view
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 * @returns {void}
 */
function renderServiceDetail(org, repo) {
  // implementation
}

/**
 * Handles browser navigation (back/forward)
 * @param {PopStateEvent} event - Browser popstate event
 * @returns {void}
 */
function handleNavigation(event) {
  // implementation
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
```

**Implementation Notes:**
- Use JSDoc 3 syntax for compatibility
- Include `@example` tags for complex functions
- Use `@private` for internal functions
- Add `@throws` for error conditions
- Use `@typedef` for complex object types
- Include parameter validation descriptions

---

### 2. Add Function Documentation to Shell Scripts (3-4 hours)

**Location:** `action/`, `scripts/`, and `checks/*/check.sh` files

**Purpose:** Document all shell functions with structured comments.

**Template for Shell Function Documentation:**

```bash
#!/bin/bash
# Script description and purpose
#
# Usage: script_name.sh [options] arguments
#
# Environment variables:
#   VAR_NAME - Description of variable
#
# Exit codes:
#   0 - Success
#   1 - Failure/Error

# Function description
#
# Arguments:
#   $1 - First argument description
#   $2 - Second argument description (optional)
#
# Outputs:
#   Writes result to stdout
#   Writes errors to stderr
#
# Returns:
#   0 if successful
#   1 if failed
#
# Example:
#   function_name "argument1" "argument2"
function_name() {
    local arg1="$1"
    local arg2="${2:-default}"

    # Implementation
}
```

**Scripts to Document:**

#### action/entrypoint.sh
```bash
#!/bin/bash
# Main entrypoint for Scorecards GitHub Action
#
# This script coordinates the execution of all quality checks, collects results,
# calculates scores, and submits results to the catalog branch.
#
# Usage: entrypoint.sh
#
# Environment variables:
#   INPUT_CATALOG_TOKEN - GitHub PAT for writing to catalog branch
#   GITHUB_REPOSITORY - Current repository (org/repo)
#   GITHUB_WORKSPACE - Path to checked out repository
#   GITHUB_SHA - Current commit SHA
#
# Exit codes:
#   0 - All checks completed successfully (pass or fail)
#   1 - Fatal error during execution

set -euo pipefail

# Source common utilities
# shellcheck source=action/lib/common.sh
source "$(dirname "$0")/lib/common.sh"

# Validates required environment variables are set
#
# Globals:
#   INPUT_CATALOG_TOKEN - Must be set
#   GITHUB_REPOSITORY - Must be set
#
# Outputs:
#   Error messages to stderr if validation fails
#
# Returns:
#   0 if all required variables are set
#   1 if any required variable is missing
validate_environment() {
    log_info "Validating environment..."

    if [[ -z "${INPUT_CATALOG_TOKEN:-}" ]]; then
        log_error "CATALOG_TOKEN is required"
        return 1
    fi

    if [[ -z "${GITHUB_REPOSITORY:-}" ]]; then
        log_error "GITHUB_REPOSITORY is not set"
        return 1
    fi

    log_info "Environment validation passed"
    return 0
}

# Runs all quality checks and collects results
#
# Globals:
#   GITHUB_WORKSPACE - Path to repository being checked
#
# Outputs:
#   Check results to stdout in JSON format
#   Progress messages to stderr
#
# Returns:
#   0 always (individual check failures are captured)
#
# Example:
#   results=$(run_checks)
run_checks() {
    log_info "Running quality checks..."

    local checks_dir="$(dirname "$0")/../checks"
    local results=()

    for check_dir in "$checks_dir"/*/; do
        run_single_check "$check_dir"
    done

    # Aggregate results
    # ...
}

# ... (continue documenting all major functions)
```

#### action/lib/common.sh
```bash
#!/bin/bash
# Common utility functions for Scorecards action
#
# This library provides shared utilities for logging, error handling,
# retries, and common operations used across action scripts.
#
# Usage: Source this file from other scripts
#   source "$(dirname "$0")/lib/common.sh"

# ANSI color codes for output formatting
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Logs an informational message with timestamp
#
# Arguments:
#   $1 - Message to log
#
# Outputs:
#   Formatted message to stdout with blue [INFO] prefix
#
# Example:
#   log_info "Starting process..."
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Logs an error message with timestamp
#
# Arguments:
#   $1 - Error message to log
#
# Outputs:
#   Formatted message to stderr with red [ERROR] prefix
#
# Example:
#   log_error "Failed to process file"
log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

# Logs a warning message with timestamp
#
# Arguments:
#   $1 - Warning message to log
#
# Outputs:
#   Formatted message to stdout with yellow [WARN] prefix
#
# Example:
#   log_warn "File not found, using default"
log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Logs a success message with timestamp
#
# Arguments:
#   $1 - Success message to log
#
# Outputs:
#   Formatted message to stdout with green [SUCCESS] prefix
#
# Example:
#   log_success "Operation completed"
log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Retries a command with exponential backoff
#
# Arguments:
#   $1 - Maximum number of attempts
#   $2+ - Command and arguments to execute
#
# Outputs:
#   Command output to stdout/stderr
#   Retry messages to stderr
#
# Returns:
#   0 if command succeeded within max attempts
#   1 if all attempts exhausted
#
# Example:
#   retry_with_backoff 3 curl -f https://api.github.com/repos/org/repo
retry_with_backoff() {
    local max_attempts=$1
    shift
    local attempt=1
    local delay=1

    while (( attempt <= max_attempts )); do
        if "$@"; then
            return 0
        fi

        if (( attempt < max_attempts )); then
            log_warn "Attempt $attempt failed, retrying in ${delay}s..."
            sleep "$delay"
            delay=$((delay * 2))
        fi

        ((attempt++))
    done

    log_error "All $max_attempts attempts failed"
    return 1
}

# Checks if a command exists in PATH
#
# Arguments:
#   $1 - Command name to check
#
# Returns:
#   0 if command exists
#   1 if command not found
#
# Example:
#   if command_exists jq; then
#       echo "jq is installed"
#   fi
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validates a file exists and is readable
#
# Arguments:
#   $1 - File path to validate
#
# Returns:
#   0 if file exists and is readable
#   1 if file not found or not readable
#
# Example:
#   if validate_file_exists "/path/to/file"; then
#       cat "/path/to/file"
#   fi
validate_file_exists() {
    local file_path="$1"

    if [[ ! -f "$file_path" ]]; then
        log_error "File not found: $file_path"
        return 1
    fi

    if [[ ! -r "$file_path" ]]; then
        log_error "File not readable: $file_path"
        return 1
    fi

    return 0
}

# Parses JSON value from input using jq
#
# Arguments:
#   $1 - JSON string or file path (if starts with @)
#   $2 - jq filter expression
#
# Outputs:
#   Parsed JSON value to stdout
#
# Returns:
#   0 if parsing successful
#   1 if jq fails or JSON invalid
#
# Example:
#   value=$(parse_json "$json_string" '.field.subfield')
parse_json() {
    local input="$1"
    local filter="$2"

    if ! command_exists jq; then
        log_error "jq is required but not installed"
        return 1
    fi

    echo "$input" | jq -r "$filter"
}

# Export functions for use in other scripts
export -f log_info log_error log_warn log_success
export -f retry_with_backoff command_exists validate_file_exists parse_json
```

#### scripts/update-checks-hash.sh
```bash
#!/bin/bash
# Updates the checks hash in current-checks.json
#
# This script calculates a SHA256 hash of all check implementations,
# metadata files, and weights to enable staleness detection. The hash
# is stored in docs/current-checks.json.
#
# Usage: update-checks-hash.sh
#
# Environment variables:
#   GITHUB_TOKEN or GH_TOKEN - GitHub token for committing changes
#
# Exit codes:
#   0 - Success (hash updated and committed)
#   1 - Error during hash calculation or commit

set -euo pipefail

# Source common utilities
source "$(dirname "$0")/../action/lib/common.sh"

# Calculates SHA256 hash of all check files
#
# Globals:
#   None
#
# Outputs:
#   SHA256 hash string to stdout
#
# Returns:
#   0 if hash calculated successfully
#   1 if error during calculation
#
# Example:
#   current_hash=$(calculate_checks_hash)
calculate_checks_hash() {
    log_info "Calculating checks hash..."

    local checks_dir="$(dirname "$0")/../checks"
    local temp_file
    temp_file=$(mktemp)

    # Concatenate all check files in deterministic order
    find "$checks_dir" -type f \
        \( -name "check.*" -o -name "metadata.json" \) \
        -print0 | sort -z | while IFS= read -r -d '' file; do
        cat "$file" >> "$temp_file"
    done

    # Calculate hash
    local hash
    hash=$(sha256sum "$temp_file" | awk '{print $1}')

    rm "$temp_file"

    echo "$hash"
}

# Updates current-checks.json with new hash
#
# Arguments:
#   $1 - New checks hash
#
# Outputs:
#   Status messages to stdout
#
# Returns:
#   0 if file updated successfully
#   1 if error writing file
#
# Example:
#   update_checks_file "abc123def456..."
update_checks_file() {
    local new_hash="$1"
    local checks_file="docs/current-checks.json"

    log_info "Updating $checks_file..."

    # Create JSON with hash and timestamp
    cat > "$checks_file" <<EOF
{
  "checks_hash": "$new_hash",
  "updated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

    log_success "Updated checks file with hash: $new_hash"
}

# ... (continue with main logic)
```

#### Example Check Script Documentation (checks/01-readme-exists/check.sh)
```bash
#!/bin/bash
# Check: README Exists
#
# Validates that a README.md file exists in the repository root.
#
# Pass criteria:
#   - File named README.md exists in repository root (case-sensitive)
#
# Environment variables:
#   SCORECARD_REPO_PATH - Path to repository being checked (required)
#
# Exit codes:
#   0 - Check passed (README.md exists)
#   1 - Check failed (README.md not found)
#
# Example:
#   SCORECARD_REPO_PATH=/path/to/repo ./check.sh

set -euo pipefail

# Validates environment and prerequisites
#
# Globals:
#   SCORECARD_REPO_PATH - Must be set and exist
#
# Returns:
#   0 if validation passed
#   1 if validation failed
validate_environment() {
    if [[ -z "${SCORECARD_REPO_PATH:-}" ]]; then
        echo "ERROR: SCORECARD_REPO_PATH is not set" >&2
        return 1
    fi

    if [[ ! -d "$SCORECARD_REPO_PATH" ]]; then
        echo "ERROR: SCORECARD_REPO_PATH does not exist: $SCORECARD_REPO_PATH" >&2
        return 1
    fi

    return 0
}

# Checks if README.md file exists
#
# Globals:
#   SCORECARD_REPO_PATH - Repository path
#
# Outputs:
#   Status message to stdout
#
# Returns:
#   0 if README.md exists
#   1 if README.md not found
check_readme_exists() {
    local readme_path="$SCORECARD_REPO_PATH/README.md"

    if [[ -f "$readme_path" ]]; then
        echo "✓ README.md exists"
        return 0
    else
        echo "✗ README.md not found in repository root"
        return 1
    fi
}

# Main execution
main() {
    validate_environment || exit 1
    check_readme_exists
}

main
```

**Implementation Notes:**
- Document all functions, not just public ones
- Include error conditions and edge cases
- Provide realistic examples
- Document expected environment variables
- Specify exit codes clearly

---

### 3. Add Python Docstrings to Check Scripts (2 hours)

**Location:** `checks/*/check.py` files

**Purpose:** Document Python check scripts with docstrings following PEP 257 and Google style.

**Template for Python Check Scripts:**

```python
#!/usr/bin/env python3
"""
Check: [Check Name]

This module implements the [check name] quality check for Scorecards.

Pass criteria:
    - [Criterion 1]
    - [Criterion 2]

Environment Variables:
    SCORECARD_REPO_PATH: Path to repository being checked (required)

Exit Codes:
    0: Check passed
    1: Check failed
    2: Error during check execution

Example:
    $ SCORECARD_REPO_PATH=/path/to/repo python3 check.py
"""

import os
import sys
from pathlib import Path
from typing import Optional, List


def validate_environment() -> Path:
    """
    Validates required environment variables are set.

    Returns:
        Path: Path object pointing to the repository being checked

    Raises:
        ValueError: If SCORECARD_REPO_PATH is not set or doesn't exist

    Example:
        >>> repo_path = validate_environment()
        >>> print(repo_path)
        /path/to/repo
    """
    repo_path = os.environ.get('SCORECARD_REPO_PATH')

    if not repo_path:
        raise ValueError("SCORECARD_REPO_PATH environment variable is not set")

    path = Path(repo_path)
    if not path.exists() or not path.is_dir():
        raise ValueError(f"SCORECARD_REPO_PATH does not exist: {repo_path}")

    return path


def check_condition(repo_path: Path) -> bool:
    """
    Performs the actual check logic.

    Args:
        repo_path: Path to repository being checked

    Returns:
        bool: True if check passed, False if failed

    Raises:
        IOError: If file cannot be read

    Example:
        >>> check_condition(Path('/path/to/repo'))
        True
    """
    # Implementation
    pass


def main() -> int:
    """
    Main entry point for the check script.

    Returns:
        int: Exit code (0 for pass, 1 for fail, 2 for error)
    """
    try:
        repo_path = validate_environment()

        if check_condition(repo_path):
            print("✓ Check passed")
            return 0
        else:
            print("✗ Check failed")
            return 1

    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
```

**Checks to Document:**
- All Python-based checks in `checks/*/check.py`
- Test framework utilities
- Shared Python libraries

---

### 4. Create API Reference Documentation (2 hours)

**Location:** `documentation/reference/api-reference.md`

**Purpose:** Comprehensive API reference for the Scorecards JavaScript modules (`window.ScorecardModules`).

**Content Structure:**

```markdown
# API Reference

This document describes the JavaScript API for the Scorecards catalog UI.

## Table of Contents
- [Module System](#module-system)
- [API Modules](#api-modules)
- [Component Modules](#component-modules)
- [Utility Modules](#utility-modules)
- [Data Modules](#data-modules)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Module System

The Scorecards catalog uses ES6 modules loaded dynamically. All modules are available under the `window.ScorecardModules` namespace.

### Module Loading

```javascript
// Modules are loaded in main.js
import * as github from './api/github.js';
import * as serviceCard from './components/service-card.js';

// Available as:
window.ScorecardModules = {
  github,
  serviceCard,
  // ... other modules
};
```

### Usage

```javascript
// Access modules from window
const { github, serviceCard } = window.ScorecardModules;

// Use module functions
const services = await github.fetchConsolidatedRegistry();
```

---

## API Modules

### `api/github`

GitHub API client for fetching registry data and triggering workflows.

#### `fetchConsolidatedRegistry()`

Fetches the consolidated registry containing all services.

**Signature:**
```javascript
async function fetchConsolidatedRegistry(): Promise<Array<Service>>
```

**Returns:**
- `Promise<Array<Service>>` - Array of service objects

**Throws:**
- `Error` - If registry cannot be fetched or is invalid JSON

**Example:**
```javascript
const services = await github.fetchConsolidatedRegistry();
console.log(`Found ${services.length} services`);
```

#### `fetchServiceRegistry(org, repo)`

Fetches registry data for a specific service.

**Signature:**
```javascript
async function fetchServiceRegistry(org: string, repo: string): Promise<Service>
```

**Parameters:**
- `org` (string) - GitHub organization name
- `repo` (string) - Repository name

**Returns:**
- `Promise<Service>` - Service object with full details

**Throws:**
- `Error` - If service not found or registry is inaccessible

**Example:**
```javascript
const service = await github.fetchServiceRegistry('my-org', 'my-service');
console.log(`Score: ${service.score}%`);
```

#### `triggerWorkflow(org, repo, token, workflowId)`

Triggers a workflow in a service repository.

**Signature:**
```javascript
async function triggerWorkflow(
  org: string,
  repo: string,
  token: string,
  workflowId: string
): Promise<Response>
```

**Parameters:**
- `org` (string) - GitHub organization name
- `repo` (string) - Repository name
- `token` (string) - GitHub Personal Access Token with `repo` or `public_repo` scope
- `workflowId` (string) - Workflow filename (e.g., 'scorecards.yml') or workflow ID

**Returns:**
- `Promise<Response>` - GitHub API response (204 No Content on success)

**Throws:**
- `Error` - If API request fails, token is invalid, or rate limit exceeded

**Example:**
```javascript
try {
  await github.triggerWorkflow('my-org', 'my-service', token, 'scorecards.yml');
  console.log('Workflow triggered successfully');
} catch (error) {
  console.error('Failed to trigger workflow:', error.message);
}
```

---

## Component Modules

### `components/service-card`

Creates service card DOM elements for the catalog list view.

#### `createServiceCard(service)`

Creates a service card element.

**Signature:**
```javascript
function createServiceCard(service: Service): HTMLElement
```

**Parameters:**
- `service` (Service) - Service object

**Service Object:**
```typescript
interface Service {
  org: string;
  repo: string;
  score: number;           // 0-100
  rank: string;            // 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  team?: string;
  description?: string;
  checks: Array<Check>;
  is_stale?: boolean;
  timestamp: string;       // ISO 8601
}
```

**Returns:**
- `HTMLElement` - Service card DOM element

**Example:**
```javascript
const card = serviceCard.createServiceCard({
  org: 'my-org',
  repo: 'my-service',
  score: 85,
  rank: 'Gold',
  team: 'Platform Team',
  description: 'Core API service',
  checks: [...],
  is_stale: false,
  timestamp: '2024-01-15T12:00:00Z'
});

document.querySelector('#services').appendChild(card);
```

---

## Utility Modules

### `utils/scoring`

Scoring calculation utilities.

#### `calculateScore(checks)`

Calculates quality score from check results.

**Signature:**
```javascript
function calculateScore(checks: Array<Check>): ScoreResult
```

**Parameters:**
- `checks` (Array<Check>) - Array of check result objects

**Check Object:**
```typescript
interface Check {
  name: string;
  status: 'pass' | 'fail';
  weight: number;
  disabled?: boolean;
  category: string;
  description?: string;
}
```

**Returns:**
```typescript
interface ScoreResult {
  score: number;         // Percentage (0-100)
  pointsEarned: number;
  totalPoints: number;
  passedCount: number;
  totalChecks: number;
}
```

**Example:**
```javascript
const result = scoring.calculateScore([
  { name: 'README Exists', status: 'pass', weight: 10, category: 'documentation' },
  { name: 'Has Tests', status: 'fail', weight: 5, category: 'testing' },
  { name: 'Coverage', status: 'pass', weight: 8, disabled: true, category: 'testing' }
]);

console.log(`Score: ${result.score}%`); // 67%
console.log(`Checks: ${result.passedCount}/${result.totalChecks}`); // 1/2
```

---

## Data Modules

### `data/settings`

Configuration and constants.

#### `RANK_THRESHOLDS`

Rank threshold configuration.

**Type:**
```typescript
const RANK_THRESHOLDS: {
  platinum: number;  // 90
  gold: number;      // 75
  silver: number;    // 50
  bronze: number;    // 0
}
```

#### `getRank(score)`

Maps score to rank.

**Signature:**
```javascript
function getRank(score: number): string
```

**Parameters:**
- `score` (number) - Score percentage (0-100)

**Returns:**
- `string` - Rank name ('Bronze', 'Silver', 'Gold', or 'Platinum')

**Example:**
```javascript
getRank(92);  // 'Platinum'
getRank(85);  // 'Gold'
getRank(60);  // 'Silver'
getRank(40);  // 'Bronze'
```

---

## Error Handling

All async functions may throw errors. Always use try-catch or .catch():

```javascript
// Async/await with try-catch
try {
  const services = await github.fetchConsolidatedRegistry();
  renderServices(services);
} catch (error) {
  console.error('Failed to load services:', error);
  showErrorMessage('Unable to load catalog. Please try again later.');
}

// Promise with .catch()
github.fetchServiceRegistry('my-org', 'my-service')
  .then(service => renderServiceDetail(service))
  .catch(error => showErrorMessage(error.message));
```

**Common Error Types:**

- `TypeError` - Invalid parameter types
- `Error` - API failures, network errors, invalid data
- `SyntaxError` - Invalid JSON responses

---

## Examples

### Example 1: Load and Display All Services

```javascript
async function loadCatalog() {
  try {
    // Fetch all services
    const services = await window.ScorecardModules.github.fetchConsolidatedRegistry();

    // Calculate statistics
    const stats = window.ScorecardModules.statistics.calculateStatistics(services);

    // Render statistics
    window.ScorecardModules.statistics.renderStatistics(stats);

    // Render service cards
    const container = document.querySelector('#services');
    services.forEach(service => {
      const card = window.ScorecardModules.serviceCard.createServiceCard(service);
      container.appendChild(card);
    });

    console.log(`Loaded ${services.length} services`);
  } catch (error) {
    console.error('Failed to load catalog:', error);
  }
}
```

### Example 2: Filter Services

```javascript
// Initialize filters
window.ScorecardModules.filters.initializeFilters(allServices, (filtered) => {
  // Clear existing cards
  const container = document.querySelector('#services');
  container.innerHTML = '';

  // Render filtered services
  filtered.forEach(service => {
    const card = window.ScorecardModules.serviceCard.createServiceCard(service);
    container.appendChild(card);
  });

  // Update count
  document.querySelector('#count').textContent = `${filtered.length} services`;
});
```

### Example 3: Calculate Custom Score

```javascript
const customChecks = [
  { name: 'Check 1', status: 'pass', weight: 10, category: 'documentation' },
  { name: 'Check 2', status: 'fail', weight: 15, category: 'testing' },
  { name: 'Check 3', status: 'pass', weight: 5, disabled: true, category: 'security' }
];

const result = window.ScorecardModules.scoring.calculateScore(customChecks);

console.log(`Score: ${result.score}%`);
console.log(`Points: ${result.pointsEarned}/${result.totalPoints}`);
console.log(`Passed: ${result.passedCount}/${result.totalChecks}`);

// Get rank
const rank = window.ScorecardModules.settings.getRank(result.score);
console.log(`Rank: ${rank}`);
```

### Example 4: Format Timestamps

```javascript
const service = await window.ScorecardModules.github.fetchServiceRegistry('my-org', 'my-service');

const formattedDate = window.ScorecardModules.formatting.formatDate(service.timestamp);
const relativeTime = window.ScorecardModules.formatting.formatRelativeTime(service.timestamp);

console.log(`Last updated: ${formattedDate} (${relativeTime})`);
// Output: "Last updated: Jan 15, 2024 (2 days ago)"
```

---

## Type Definitions

### Service

```typescript
interface Service {
  org: string;
  repo: string;
  score: number;
  rank: string;
  team?: string;
  description?: string;
  links?: {
    [key: string]: string;
  };
  checks: Array<Check>;
  checks_hash: string;
  is_stale?: boolean;
  timestamp: string;
}
```

### Check

```typescript
interface Check {
  name: string;
  status: 'pass' | 'fail';
  weight: number;
  category: string;
  description?: string;
  remediation?: string;
  disabled?: boolean;
}
```

### ScoreResult

```typescript
interface ScoreResult {
  score: number;
  pointsEarned: number;
  totalPoints: number;
  passedCount: number;
  totalChecks: number;
}
```

---

## Browser Compatibility

The catalog UI uses ES6 modules and modern JavaScript features:

- **ES6 Modules** (import/export)
- **Async/Await**
- **Fetch API**
- **Template Literals**
- **Destructuring**

**Minimum browser versions:**
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 79+

For older browsers, consider transpiling with Babel.

---

## See Also

- [Catalog UI Architecture](../architecture/catalog-ui.md)
- [Configuration Reference](configuration.md)
- [Glossary](glossary.md)
```

---

### 5. Enhance CONTRIBUTING.md (1-2 hours)

**Location:** `/CONTRIBUTING.md`

**Purpose:** Provide comprehensive contribution guidelines with detailed workflow, code standards, and testing requirements.

**Enhanced Content:**

```markdown
# Contributing to Scorecards

Thank you for your interest in contributing to Scorecards! This guide will help you get started.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

---

## Code of Conduct

This project adheres to the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## Getting Started

### Prerequisites

- **Git** - Version control
- **GitHub CLI** (`gh`) - GitHub operations
- **Node.js** (18+) - JavaScript tests and linting
- **Python** (3.9+) - Python check scripts
- **Bash** (4.0+) - Shell scripts
- **jq** - JSON processing

### Setting Up Your Environment

1. **Fork the repository**

   Click "Fork" in GitHub UI or use:
   ```bash
   gh repo fork your-org/scorecards --clone
   ```

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR-USERNAME/scorecards.git
   cd scorecards
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/your-org/scorecards.git
   ```

4. **Install dependencies**

   ```bash
   # JavaScript dependencies
   npm install

   # Python dependencies (if developing Python checks)
   pip install -r requirements-dev.txt

   # Install shellcheck (for shell script linting)
   # macOS:
   brew install shellcheck
   # Ubuntu/Debian:
   sudo apt-get install shellcheck
   ```

5. **Verify setup**

   ```bash
   # Run tests
   npm test

   # Run linting
   npm run lint
   ```

---

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/improvements
- `chore/` - Maintenance tasks

**Examples:**
```bash
git checkout -b feature/add-dependency-check
git checkout -b fix/readme-link-validation
git checkout -b docs/improve-installation-guide
```

### Making Changes

1. **Create a branch from `main`**

   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature
   ```

2. **Make your changes**

   - Write clear, concise code
   - Follow code standards (see below)
   - Add tests for new functionality
   - Update documentation as needed

3. **Commit your changes**

   ```bash
   git add .
   git commit -m "Add feature: your feature description"
   ```

   **Commit message format:**
   ```
   <type>: <description>

   [optional body]

   [optional footer]
   ```

   **Types:** feat, fix, docs, refactor, test, chore

   **Example:**
   ```
   feat: Add dependency vulnerability check

   Introduces check 16 that scans package.json and requirements.txt
   for known vulnerabilities using npm audit and pip check.

   Weight: 8 points, Category: security
   ```

4. **Push to your fork**

   ```bash
   git push origin feature/your-feature
   ```

5. **Create a Pull Request**

   ```bash
   gh pr create --title "Add feature: your feature" --body "Description of changes"
   ```

---

## Code Standards

### General Principles

- **DRY** (Don't Repeat Yourself) - Extract common code into functions/modules
- **KISS** (Keep It Simple, Stupid) - Prefer simplicity over cleverness
- **YAGNI** (You Aren't Gonna Need It) - Don't add functionality until it's needed
- **Clear over clever** - Readability counts

### Shell Scripts (Bash)

- Use `#!/bin/bash` shebang
- Enable strict mode: `set -euo pipefail`
- Use `local` for function variables
- Quote variables: `"$var"` not `$var`
- Use `[[ ]]` instead of `[ ]` for tests
- Add shellcheck directives for exceptions
- Document all functions (see template above)

**Example:**
```bash
#!/bin/bash
set -euo pipefail

# Good
local file_path="$1"
if [[ -f "$file_path" ]]; then
    cat "$file_path"
fi

# Bad
file_path=$1  # No local, no quotes
if [ -f $file_path ]; then  # Old test syntax, no quotes
    cat $file_path
fi
```

### JavaScript

- Use ES6+ features (const/let, arrow functions, async/await)
- Use JSDoc comments for all exported functions
- Prefer `async/await` over `.then()`
- Use destructuring where appropriate
- Follow Airbnb style guide

**Example:**
```javascript
// Good
const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

// Bad
function fetchData(url) {
  return fetch(url)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      return data;
    });
}
```

### Python

- Follow PEP 8 style guide
- Use type hints for function signatures
- Write docstrings for all functions (Google style)
- Use f-strings for formatting
- Prefer pathlib over os.path

**Example:**
```python
# Good
from pathlib import Path
from typing import List

def find_files(directory: Path, pattern: str) -> List[Path]:
    """
    Finds files matching a pattern in a directory.

    Args:
        directory: Directory to search
        pattern: Glob pattern to match

    Returns:
        List of matching file paths
    """
    return list(directory.glob(pattern))

# Bad
import os

def find_files(directory, pattern):
    files = []
    for file in os.listdir(directory):
        if file.endswith(pattern):
            files.append(file)
    return files
```

### Linting

Run linters before committing:

```bash
# Shell scripts
shellcheck action/entrypoint.sh
shellcheck scripts/*.sh

# JavaScript
npm run lint

# Python
pylint checks/**/check.py
```

---

## Testing Guidelines

### Test Philosophy

- **Test what matters** - Focus on behavior, not implementation
- **Fast tests** - Unit tests should run in milliseconds
- **Isolated tests** - Tests shouldn't depend on each other
- **Readable tests** - Tests are documentation

### Test Structure

```bash
tests/
├── unit/          # Fast, isolated unit tests
├── integration/   # Tests that involve multiple components
└── e2e/           # End-to-end tests (catalog UI)
```

### Writing Tests

#### JavaScript Tests (Jest)

```javascript
describe('scoring utilities', () => {
  describe('calculateScore', () => {
    it('calculates score correctly with all checks passing', () => {
      const checks = [
        { status: 'pass', weight: 10 },
        { status: 'pass', weight: 5 }
      ];

      const result = calculateScore(checks);

      expect(result.score).toBe(100);
      expect(result.pointsEarned).toBe(15);
      expect(result.totalPoints).toBe(15);
    });

    it('excludes disabled checks from calculation', () => {
      const checks = [
        { status: 'pass', weight: 10 },
        { status: 'pass', weight: 5, disabled: true }
      ];

      const result = calculateScore(checks);

      expect(result.score).toBe(100);
      expect(result.totalPoints).toBe(10); // Disabled check excluded
    });
  });
});
```

#### Shell Script Tests (Bats)

```bash
#!/usr/bin/env bats

@test "check passes when README.md exists" {
  mkdir -p "$TEST_REPO"
  touch "$TEST_REPO/README.md"

  export SCORECARD_REPO_PATH="$TEST_REPO"
  run bash checks/01-readme-exists/check.sh

  [ "$status" -eq 0 ]
  [[ "$output" == *"README.md exists"* ]]
}

@test "check fails when README.md is missing" {
  mkdir -p "$TEST_REPO"

  export SCORECARD_REPO_PATH="$TEST_REPO"
  run bash checks/01-readme-exists/check.sh

  [ "$status" -eq 1 ]
  [[ "$output" == *"not found"* ]]
}
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage

- **Minimum coverage:** 80% for new code
- **Check coverage:** `npm test -- --coverage`
- Coverage reports in `coverage/` directory

---

## Documentation

### When to Update Documentation

Update documentation when you:
- Add new features
- Change existing functionality
- Add configuration options
- Fix bugs that affect usage
- Add or modify checks

### Documentation Files to Update

- **README.md** - If feature affects main usage
- **documentation/guides/** - For how-to changes
- **documentation/reference/** - For configuration/API changes
- **Check README.md** - When adding/modifying checks
- **CHANGELOG.md** - All notable changes

### Documentation Standards

- Use clear, concise language
- Include code examples
- Update table of contents
- Check all links work
- Follow existing structure

---

## Pull Request Process

### Before Submitting

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (for notable changes)
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to not work as expected)
- [ ] Documentation update

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Linting passes
- [ ] CHANGELOG.md updated

## Testing
Describe how to test your changes

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks run** - All tests and linting must pass
2. **Maintainer review** - At least one maintainer must approve
3. **Changes requested** - Address feedback and update PR
4. **Approval** - PR can be merged once approved

### Merge Strategy

- **Squash and merge** - For feature branches
- **Rebase and merge** - For small fixes
- **Merge commit** - For release branches

---

## Release Process

*(For maintainers)*

### Versioning

Scorecards follows [Semantic Versioning](https://semver.org/):
- **MAJOR** - Breaking changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes

### Release Steps

1. **Update version** in relevant files
2. **Update CHANGELOG.md** with release date
3. **Create release tag**
   ```bash
   git tag -a v1.2.0 -m "Release v1.2.0"
   git push origin v1.2.0
   ```
4. **Create GitHub release** with changelog
5. **Announce release** in discussions

---

## Getting Help

### Questions?

- **Discussions:** https://github.com/your-org/scorecards/discussions
- **Issues:** https://github.com/your-org/scorecards/issues
- **Slack:** [Your org's Slack channel]

### Resources

- [Documentation](documentation/)
- [Architecture Overview](documentation/architecture/overview.md)
- [Check Development Guide](documentation/guides/check-development-guide.md)

---

## Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes
- Annual contributor acknowledgments

Thank you for contributing to Scorecards! 🎯
```

---

## Testing Checklist

Before submitting Phase 2 PR:

### Documentation Quality
- [ ] All JSDoc comments follow JSDoc 3 syntax
- [ ] All shell functions documented with consistent format
- [ ] Python docstrings follow Google style guide
- [ ] API reference is complete and accurate
- [ ] CONTRIBUTING.md is comprehensive and clear

### Code Coverage
- [ ] All public JavaScript functions have JSDoc comments
- [ ] All shell functions in action/ and scripts/ documented
- [ ] All Python check scripts have docstrings
- [ ] No undocumented functions in public APIs

### Accuracy
- [ ] Function signatures match implementation
- [ ] Examples are tested and work
- [ ] Parameter types are correct
- [ ] Return types are accurate

### Usability
- [ ] Examples are helpful and realistic
- [ ] Error conditions documented
- [ ] Edge cases mentioned
- [ ] Links to related documentation included

---

## PR Description Template

```markdown
## Phase 2: Developer Documentation Improvements

This PR adds comprehensive code-level documentation to improve contributor experience and code maintainability.

### Added
- **JSDoc comments** to all JavaScript modules in `docs/src/`
- **Function documentation** to shell scripts in `action/` and `scripts/`
- **Python docstrings** to all check scripts
- **documentation/reference/api-reference.md** - Complete API reference for catalog UI modules
- **Enhanced CONTRIBUTING.md** with detailed workflow, code standards, and testing guidelines

### Benefits
- Contributors can understand code without reading implementation
- IDE autocomplete and inline documentation support
- Consistent documentation style across codebase
- Lower barrier to entry for new contributors
- Better code maintainability

### Documentation Coverage
- JavaScript: 100% of exported functions
- Shell: 100% of public functions
- Python: 100% of check scripts
- API Reference: Complete coverage of public APIs

### Testing
- [ ] All JSDoc examples tested
- [ ] Shell script documentation reviewed
- [ ] Python docstrings validated
- [ ] API reference examples work
- [ ] CONTRIBUTING workflow tested

### Documentation Quality Score
Before: 88/100
After: 94/100 (+6 points)

Closes #XXX (if there's a related issue)
```

---

## Success Metrics

After merging, track:
- **Contribution rate** - More contributors able to submit PRs
- **Code review time** - Less time explaining code in reviews
- **Issue quality** - Fewer "how does X work" questions
- **IDE usage** - Developers report better autocomplete support

---

## Estimated Time

- JSDoc comments: 4-5 hours
- Shell documentation: 3-4 hours
- Python docstrings: 2 hours
- API reference: 2 hours
- CONTRIBUTING.md enhancement: 1-2 hours
- Review and testing: 1 hour

**Total: ~14 hours**

---

This completes Phase 2. The codebase is now well-documented at the code level, making it much easier for contributors to understand and work with the system.
