#!/bin/bash
# Common Utility Functions for Scorecards Action
#
# This library provides shared utilities for logging, error handling,
# retries, JSON parsing, and common operations used across action scripts.
#
# USAGE:
#   Source this file from other scripts:
#   source "$(dirname "$0")/lib/common.sh"
#
# FUNCTIONS:
#   Logging:     log_info, log_success, log_warning, log_error, log_debug
#   Errors:      set_error_handling, die
#   Validation:  command_exists, validate_params
#   Retries:     retry_with_backoff
#   JSON:        read_json_file, read_json_field
#   Timestamps:  get_iso_timestamp
#
# EXPORTS:
#   Color codes: RED, GREEN, YELLOW, BLUE, NC

# ANSI color codes for output formatting
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export NC='\033[0m' # No Color

# Logs an informational message with [INFO] prefix
#
# ARGUMENTS:
#   $1 - Message to log
#
# OUTPUTS:
#   Formatted message to stdout with blue [INFO] prefix
#
# EXAMPLE:
#   log_info "Starting process..."
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Logs a success message with [SUCCESS] prefix
#
# ARGUMENTS:
#   $1 - Message to log
#
# OUTPUTS:
#   Formatted message to stdout with green [SUCCESS] prefix
#
# EXAMPLE:
#   log_success "Operation completed"
log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Logs a warning message with [WARNING] prefix
#
# ARGUMENTS:
#   $1 - Warning message to log
#
# OUTPUTS:
#   Formatted message to stdout with yellow [WARNING] prefix
#
# EXAMPLE:
#   log_warning "File not found, using default"
log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Logs an error message with [ERROR] prefix
#
# ARGUMENTS:
#   $1 - Error message to log
#
# OUTPUTS:
#   Formatted message to stdout with red [ERROR] prefix
#
# EXAMPLE:
#   log_error "Failed to process file"
log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Logs a debug message with [DEBUG] prefix
#
# ARGUMENTS:
#   $1 - Debug message to log
#
# OUTPUTS:
#   Formatted message to stdout with blue [DEBUG] prefix
#
# EXAMPLE:
#   log_debug "Variable value: $my_var"
log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Enables strict error handling for bash scripts
#
# OUTPUTS:
#   Sets shell options for safer script execution
#
# DETAILS:
#   - set -e: Exit on any command failure
#   - set -o pipefail: Fail on pipe command failures
#
# EXAMPLE:
#   set_error_handling
set_error_handling() {
    set -e
    set -o pipefail
}

# Logs an error message and exits the script
#
# ARGUMENTS:
#   $1 - Error message to log
#   $2 - Exit code (optional, default: 1)
#
# OUTPUTS:
#   Error message to stdout
#
# RETURNS:
#   Exits script with specified exit code
#
# EXAMPLE:
#   die "Configuration file not found" 2
die() {
    log_error "$1"
    exit "${2:-1}"
}

# Checks if a command exists in PATH
#
# ARGUMENTS:
#   $1 - Command name to check
#
# RETURNS:
#   0 if command exists
#   1 if command not found
#
# EXAMPLE:
#   if command_exists jq; then
#       echo "jq is installed"
#   fi
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Retries a command with exponential backoff
#
# ARGUMENTS:
#   $1 - Maximum number of attempts
#   $2+ - Command and arguments to execute
#
# OUTPUTS:
#   Command output to stdout/stderr
#   Retry messages via log_warning
#
# RETURNS:
#   0 if command succeeded within max attempts
#   1 if all attempts exhausted
#
# DETAILS:
#   - Initial delay: 1 second
#   - Delay doubles with each retry (1s, 2s, 4s, 8s, ...)
#   - Logs retry attempts via log_warning
#
# EXAMPLE:
#   retry_with_backoff 3 curl -f https://api.github.com/repos/org/repo
retry_with_backoff() {
    local max_attempts="$1"
    shift
    local attempt=1
    local delay=1

    while [ $attempt -le "$max_attempts" ]; do
        if "$@"; then
            return 0
        fi

        if [ $attempt -lt "$max_attempts" ]; then
            log_warning "Attempt $attempt failed. Retrying in ${delay}s..."
            sleep "$delay"
            delay=$((delay * 2))
            attempt=$((attempt + 1))
        else
            log_error "All $max_attempts attempts failed."
            return 1
        fi
    done
}

# Validates that required function parameters are not empty
#
# ARGUMENTS:
#   $1 - Function name (for error messages)
#   $2+ - Pairs of param_name and param_value
#
# OUTPUTS:
#   Error message via log_error if validation fails
#
# RETURNS:
#   0 if all parameters are non-empty
#   1 if any parameter is empty
#
# EXAMPLE:
#   validate_params "my_function" \
#       "org" "$org" \
#       "repo" "$repo" \
#       "token" "$token"
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

# Reads and validates a JSON file safely with default value
#
# ARGUMENTS:
#   $1 - Path to JSON file
#   $2 - Default value if file not found or invalid (optional, default: "null")
#
# OUTPUTS:
#   JSON content to stdout, or default value if file missing/invalid
#
# RETURNS:
#   0 if file read successfully
#   1 if file not found or invalid JSON
#
# EXAMPLE:
#   config=$(read_json_file "/path/to/config.json" "{}")
read_json_file() {
    local file="$1"
    local default="${2:-null}"

    if [ ! -f "$file" ]; then
        echo "$default"
        return 1
    fi

    jq '.' "$file" 2>/dev/null || echo "$default"
}

# Reads a specific field from a JSON file with default fallback
#
# ARGUMENTS:
#   $1 - Path to JSON file
#   $2 - Field name (dot notation supported, e.g., "user.name")
#   $3 - Default value if field not found (optional, default: "null")
#
# OUTPUTS:
#   Field value to stdout, or default if not found
#
# RETURNS:
#   0 if file and field found
#   1 if file not found
#
# EXAMPLE:
#   score=$(read_json_field "/path/to/results.json" "score" "0")
#   team=$(read_json_field "/path/to/config.json" "metadata.team" "unknown")
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

# Generates ISO 8601 formatted UTC timestamp
#
# OUTPUTS:
#   Current timestamp in ISO 8601 format to stdout
#   Format: YYYY-MM-DDTHH:MM:SSZ (e.g., 2024-01-15T14:30:00Z)
#
# RETURNS:
#   0 always
#
# EXAMPLE:
#   timestamp=$(get_iso_timestamp)
#   echo "Generated at: $timestamp"
get_iso_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}
