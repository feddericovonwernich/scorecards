#!/bin/bash
# Validate and project one Scorecards check definition.
set -euo pipefail

readonly EX_USAGE=64 EX_DATAERR=65
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTION_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$ACTION_DIR/config/check-metadata.json"
REMEDIATION_POLICY_FILE="$ACTION_DIR/config/remediation.json"
source "$ACTION_DIR/lib/remediation.sh"

usage() {
    printf 'usage: %s CHECK_DIR\n' "$0" >&2
    exit "$EX_USAGE"
}

invalid() {
    printf 'check metadata: %s\n' "$*" >&2
    exit "$EX_DATAERR"
}

[ "$#" -eq 1 ] || usage
check_dir="$1"
[ -d "$check_dir" ] && [ ! -L "$check_dir" ] || invalid "$check_dir: check directory must be a regular directory"
check_id_path="$check_dir"
while [[ "$check_id_path" == */ ]]; do
    check_id_path="${check_id_path%/}"
done
check_id="${check_id_path##*/}"
[[ "$check_id" =~ ^[a-z0-9][a-z0-9-]{0,79}$ ]] || invalid "$check_dir: invalid check ID '$check_id'"

script_count=0
for script in check.sh check.py check.js; do
    if [ -e "$check_dir/$script" ] || [ -L "$check_dir/$script" ]; then
        [ -f "$check_dir/$script" ] && [ ! -L "$check_dir/$script" ] || invalid "$check_dir/$script: check script must be a regular file"
        script_count=$((script_count + 1))
    fi
done
[ "$script_count" -eq 1 ] || invalid "$check_dir: exactly one check.sh, check.py, or check.js is required"

metadata_file="$check_dir/metadata.json"
[ -f "$metadata_file" ] && [ ! -L "$metadata_file" ] || invalid "$metadata_file: metadata must be a regular file"
[ -f "$CONFIG_FILE" ] && [ ! -L "$CONFIG_FILE" ] || invalid "$CONFIG_FILE: configuration must be a regular file"

jq -e '
  . as $config
  | type == "object"
  and (keys == ["categories", "timeout_max_seconds", "timeout_min_seconds", "version", "weight_max", "weight_min"])
  and .version == 1
  and (.weight_min | type == "number" and floor == .)
  and (.weight_max | type == "number" and floor == . and . >= $config.weight_min)
  and (.timeout_min_seconds | type == "number" and floor == .)
  and (.timeout_max_seconds | type == "number" and floor == . and . >= $config.timeout_min_seconds)
  and (.categories | type == "array" and length > 0)
  and ((.categories | unique | length) == (.categories | length))
  and all(.categories[]; type == "string" and length > 0 and (test("[[:cntrl:]]") | not))
' "$CONFIG_FILE" >/dev/null 2>&1 || invalid "$CONFIG_FILE: configuration schema is invalid"

jq -se 'length == 1 and (.[0] | type == "object")' "$metadata_file" >/dev/null 2>&1 || invalid "$metadata_file: metadata schema is invalid"
jq -e --slurpfile config "$CONFIG_FILE" '
  . as $metadata
  | type == "object"
  and ((keys - ["remediation"]) == ["category", "description", "name", "timeout", "weight"])
  and (.name | type == "string" and length > 0 and (test("[[:cntrl:]]") | not))
  and (.description | type == "string" and length > 0 and (test("[[:cntrl:]]") | not))
  and (.weight | type == "number" and floor == . and . >= $config[0].weight_min and . <= $config[0].weight_max)
  and (.timeout | type == "number" and floor == . and . >= $config[0].timeout_min_seconds and . <= $config[0].timeout_max_seconds)
  and (.category | type == "string" and ($config[0].categories | index($metadata.category) != null))
  and ((has("remediation") | not) or (.remediation | type == "object"))
' "$metadata_file" >/dev/null 2>&1 || invalid "$metadata_file: metadata schema is invalid"

remediation="null"
if ! remediation="$(load_remediation_descriptor "$check_dir" "$REMEDIATION_POLICY_FILE")"; then
    invalid "$metadata_file: remediation descriptor is invalid"
fi

jq -ce --argjson remediation "$remediation" '
  {name, description, weight, timeout, category}
  + (if $remediation == null then {} else {remediation: $remediation} end)
' "$metadata_file"
