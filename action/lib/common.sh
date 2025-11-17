#!/bin/bash
# Common utilities for action scripts

# Color codes
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Error handling
set_error_handling() {
    set -e
    set -o pipefail
}

# Exit with error message
die() {
    log_error "$1"
    exit "${2:-1}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Retry a command with exponential backoff
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

# Generate ISO 8601 timestamp
get_iso_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}
