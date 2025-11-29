#!/bin/bash
# Configuration file parsing

# Parse YAML field from config file
# Usage: parse_yaml_field "config.yml" "service.links" "[]"
#        parse_yaml_field "config.yml" "openapi" "null"
parse_yaml_field() {
    local config_file="$1"
    local field_path="$2"
    local default_value="$3"

    if ! command -v python3 &> /dev/null; then
        log_warning "Python not available, cannot parse YAML field: $field_path" >&2
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
    local name
    name=$(grep -A 1 "service:" "$config_file" | grep "name:" | sed 's/.*name: *"\?\([^"]*\)"\?.*/\1/' || echo "")
    if [ -n "$name" ]; then
        echo "$name"
    else
        echo "$default_name"
    fi
}

# Parse team configuration from config
# Returns JSON: { name: "...", override_discovery: bool, additional_teams: [...] }
# Supports both string format: team: "My Team"
# And object format: team: { name: "...", override_discovery: true, additional_teams: [...] }
parse_team_config() {
    local repo_path="$1"
    local config_file="$repo_path/.scorecard/config.yml"

    if [ ! -f "$config_file" ]; then
        echo '{"name": null, "override_discovery": false, "additional_teams": []}'
        return 0
    fi

    if ! command -v python3 &> /dev/null; then
        log_warning "Python not available, cannot parse team config" >&2
        echo '{"name": null, "override_discovery": false, "additional_teams": []}'
        return 1
    fi

    python3 -c "
import yaml, json, sys

try:
    with open('$config_file', 'r') as f:
        config = yaml.safe_load(f) or {}

    # Get service.team or top-level team
    service = config.get('service', {})
    team_config = service.get('team') if isinstance(service, dict) else None

    # Fallback to top-level team
    if team_config is None:
        team_config = config.get('team')

    result = {
        'name': None,
        'override_discovery': False,
        'additional_teams': []
    }

    if team_config is None:
        pass
    elif isinstance(team_config, str):
        # Simple string format: team: \"My Team\"
        result['name'] = team_config if team_config else None
    elif isinstance(team_config, dict):
        # Object format: team: { name: \"...\", override_discovery: true, ... }
        result['name'] = team_config.get('name')
        result['override_discovery'] = bool(team_config.get('override_discovery', False))
        additional = team_config.get('additional_teams', [])
        if isinstance(additional, list):
            result['additional_teams'] = [t for t in additional if isinstance(t, str)]

    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'name': None, 'override_discovery': False, 'additional_teams': []}))
" 2>/dev/null || echo '{"name": null, "override_discovery": false, "additional_teams": []}'
}

# Parse team name from config (backward compatible wrapper)
get_team_name() {
    local repo_path="$1"
    local config_file="$repo_path/.scorecard/config.yml"

    if [ ! -f "$config_file" ]; then
        echo ""
        return 0
    fi

    local team_config
    team_config=$(parse_team_config "$repo_path")

    echo "$team_config" | jq -r '.name // ""'
}

# Check if team discovery should be overridden by manual config
should_override_discovery() {
    local repo_path="$1"
    local config_file="$repo_path/.scorecard/config.yml"

    if [ ! -f "$config_file" ]; then
        return 1  # false - don't override
    fi

    local team_config
    team_config=$(parse_team_config "$repo_path")

    local override
    override=$(echo "$team_config" | jq -r '.override_discovery')

    if [ "$override" = "true" ]; then
        return 0  # true - override discovery
    fi

    return 1  # false - allow discovery
}

# Get additional teams from config
get_additional_teams() {
    local repo_path="$1"
    local config_file="$repo_path/.scorecard/config.yml"

    if [ ! -f "$config_file" ]; then
        echo "[]"
        return 0
    fi

    local team_config
    team_config=$(parse_team_config "$repo_path")

    echo "$team_config" | jq -c '.additional_teams // []'
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

# Parse excluded_checks from config
# Returns JSON: [{ "check": "01-readme", "reason": "N/A for internal libraries" }, ...]
parse_excluded_checks() {
    local repo_path="$1"
    local config_file="$repo_path/.scorecard/config.yml"

    if [ ! -f "$config_file" ]; then
        echo "[]"
        return 0
    fi

    if ! command -v python3 &> /dev/null; then
        log_warning "Python not available, cannot parse excluded_checks" >&2
        echo "[]"
        return 1
    fi

    python3 -c "
import yaml, json, sys

try:
    with open('$config_file', 'r') as f:
        config = yaml.safe_load(f) or {}

    excluded = config.get('excluded_checks', [])

    # Validate structure and require reason
    valid_exclusions = []
    for item in excluded:
        if isinstance(item, dict) and 'check' in item and 'reason' in item:
            if item['reason'] and str(item['reason']).strip():
                valid_exclusions.append({
                    'check': str(item['check']),
                    'reason': str(item['reason']).strip()
                })
            else:
                print(f\"Warning: Excluded check '{item.get('check')}' missing required reason, ignoring\", file=sys.stderr)
        else:
            print(f\"Warning: Invalid exclusion format, ignoring: {item}\", file=sys.stderr)

    print(json.dumps(valid_exclusions))
except Exception as e:
    print('[]')
" 2>/dev/null || echo "[]"
}

# Get comma-separated list of excluded check IDs (for passing to check runner)
get_excluded_check_ids() {
    local repo_path="$1"
    local exclusions
    exclusions=$(parse_excluded_checks "$repo_path")

    echo "$exclusions" | jq -r '[.[].check] | join(",")'
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
