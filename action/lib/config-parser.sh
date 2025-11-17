#!/bin/bash
# Configuration file parsing

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

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

    parse_yaml_field "$config_file" "service.links" "[]"
}

# Parse OpenAPI configuration from config
parse_openapi_config() {
    local repo_path="$1"
    local config_file="$repo_path/.scorecard/config.yml"

    if [ ! -f "$config_file" ]; then
        echo "null"
        return 0
    fi

    parse_yaml_field "$config_file" "openapi" "null"
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
