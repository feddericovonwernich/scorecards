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
