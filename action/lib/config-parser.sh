#!/bin/bash
# Configuration file parsing

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Check if config file exists
has_scorecard_config() {
    local repo_path="$1"
    local config_file="$repo_path/.scorecard/config.yml"

    if [ -f "$config_file" ]; then
        return 0
    fi

    return 1
}

# Parse service name from config
get_service_name() {
    local repo_path="$1"
    local config_file="$repo_path/.scorecard/config.yml"
    local default_name="$2"

    if [ ! -f "$config_file" ]; then
        echo "$default_name"
        return 0
    fi

    # Parse service name
    local name=$(grep -A 1 "service:" "$config_file" | grep "name:" | sed 's/.*name: *"\?\([^"]*\)"\?.*/\1/' || echo "")
    if [ -n "$name" ]; then
        echo "$name"
    else
        echo "$default_name"
    fi
}

# Parse team name from config
get_team_name() {
    local repo_path="$1"
    local config_file="$repo_path/.scorecard/config.yml"

    if [ ! -f "$config_file" ]; then
        echo ""
        return 0
    fi

    # Parse team name
    grep "team:" "$config_file" | sed 's/.*team: *"\?\([^"]*\)"\?.*/\1/' || echo ""
}

# Parse links array from config (requires Python for YAML array parsing)
parse_links_array() {
    local repo_path="$1"
    local config_file="$repo_path/.scorecard/config.yml"

    if [ ! -f "$config_file" ]; then
        echo "[]"
        return 0
    fi

    # Check if links section exists
    if ! grep -q "links:" "$config_file"; then
        echo "[]"
        return 0
    fi

    # Use Python for robust YAML array parsing
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
}

# Parse OpenAPI configuration from config
parse_openapi_config() {
    local repo_path="$1"
    local config_file="$repo_path/.scorecard/config.yml"

    if [ ! -f "$config_file" ]; then
        echo "null"
        return 0
    fi

    # Check if openapi section exists
    if ! grep -q "openapi:" "$config_file"; then
        echo "null"
        return 0
    fi

    # Use Python for robust YAML parsing
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
}

# Check if workflow is installed
check_workflow_installed() {
    local repo_path="$1"
    local workflow_file="$repo_path/.github/workflows/scorecards.yml"

    if [ -f "$workflow_file" ]; then
        return 0
    fi

    return 1
}
