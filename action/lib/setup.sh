#!/bin/bash
# Setup and environment initialization

# Setup cleanup trap for temporary directories
setup_cleanup_trap() {
    # Use global variable to ensure it's available when trap fires
    CLEANUP_WORK_DIR="$1"

    # shellcheck disable=SC2317  # Function is invoked indirectly via trap
    cleanup() {
        if [ -n "${CLEANUP_WORK_DIR:-}" ] && [ -d "${CLEANUP_WORK_DIR:-}" ]; then
            log_info "Cleaning up temporary directory: $CLEANUP_WORK_DIR"
            rm -rf "$CLEANUP_WORK_DIR"
        fi
    }

    trap cleanup EXIT INT TERM
}

# Configure git user
setup_git_user() {
    local name="${1:-Scorecards Bot}"
    local email="${2:-noreply@scorecards.local}"

    log_info "Configuring git user: $name <$email>"
    git config --global user.name "$name" || die "Failed to set git user name"
    git config --global user.email "$email" || die "Failed to set git user email"
}

# Setup git credentials for HTTPS
setup_git_credentials() {
    local token="$1"
    local server="${2:-github.com}"

    if [ -z "$token" ]; then
        log_error "Token required for git credentials"
        return 1
    fi

    log_info "Setting up git credentials"
    git config --global credential.helper store
    echo "https://x-access-token:${token}@${server}" > ~/.git-credentials
    chmod 600 ~/.git-credentials
}

# Validate required environment variables
validate_env_vars() {
    local missing=()

    for var in "$@"; do
        if [ -z "${!var}" ]; then
            missing+=("$var")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required environment variables: ${missing[*]}"
        return 1
    fi

    return 0
}

# Initialize environment for scorecard action
initialize_environment() {
    log_info "Initializing scorecard environment"

    # Setup git
    setup_git_user "Scorecards Bot" "noreply@scorecards.local"

    log_success "Environment initialized"
}
