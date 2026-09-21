#!/bin/bash
# Trusted remediation policy and recipe validation.
set -euo pipefail

remediation_error() {
    printf 'remediation: %s\n' "$*" >&2
}

remediation_is_sha() {
    [[ "$1" =~ ^[0-9a-f]{40}$ ]]
}

remediation_is_repository() {
    [[ "$1" =~ ^[a-z0-9][a-z0-9._-]*/[a-z0-9][a-z0-9._-]*$ ]]
}

remediation_is_check_id() {
    [[ "$1" =~ ^[a-z0-9][a-z0-9-]{0,79}$ ]]
}

remediation_is_login() {
    [[ "$1" =~ ^[A-Za-z0-9][A-Za-z0-9-]{0,38}$ ]]
}

validate_remediation_policy() {
    local policy_file="$1"
    [ -f "$policy_file" ] && [ ! -L "$policy_file" ] || {
        remediation_error "policy must be a regular file"
        return 1
    }

    jq -e '
      type == "object"
      and (keys == ["cpu_max", "diff_max_bytes", "enabled", "memory_max_bytes", "output_max_bytes", "pids_max", "runtime_image", "targets", "timeout_max_seconds", "version"])
      and .version == 1
      and (.enabled | type == "boolean")
      and (.timeout_max_seconds | type == "number" and floor == . and . >= 1)
      and (.diff_max_bytes | type == "number" and floor == . and . >= 1)
      and (.output_max_bytes | type == "number" and floor == . and . >= 1)
      and (.memory_max_bytes | type == "number" and floor == . and . >= 1)
      and (.pids_max | type == "number" and floor == . and . >= 1)
      and (.cpu_max | type == "string" and test("^[0-9]+([.][0-9]+)?$") and (tonumber > 0))
      and (.targets | type == "object")
      and (.runtime_image == null or (.runtime_image | type == "string" and test("^.+@sha256:[0-9a-f]{64}$")))
      and (if .enabled then ((.runtime_image | type == "string") and (.targets | length > 0)) else true end)
      and (all(.targets | to_entries[];
          (.key | test("^[a-z0-9][a-z0-9._-]*/[a-z0-9][a-z0-9._-]*$"))
          and (.value | type == "object" and keys == ["actors", "check_ids", "protection_evidence", "publisher_login"])
          and (.value.check_ids | type == "array" and length > 0 and ((unique | length) == length) and all(.[]; type == "string" and test("^[a-z0-9][a-z0-9-]{0,79}$")))
          and (.value.actors | type == "array" and length > 0 and ((unique | length) == length) and all(.[]; type == "string" and test("^[A-Za-z0-9][A-Za-z0-9-]{0,38}$")))
          and (.value.publisher_login | type == "string" and test("^[A-Za-z0-9][A-Za-z0-9-]{0,38}$"))
          and (.value.protection_evidence | type == "string" and length > 0 and length <= 500)
      ))
    ' "$policy_file" >/dev/null || {
        remediation_error "policy schema is invalid"
        return 1
    }
}

remediation_target() {
    local policy_file="$1"
    local repository="$2"
    validate_remediation_policy "$policy_file" || return 1
    jq -ce --arg repository "$repository" '.targets[$repository] // empty' "$policy_file"
}

validate_remediation_recipe() {
    local check_dir="$1"
    local metadata="$check_dir/metadata.json"
    local recipe_count

    [ -d "$check_dir" ] && [ ! -L "$check_dir" ] || {
        remediation_error "check directory is not trusted"
        return 1
    }
    [ -f "$metadata" ] && [ ! -L "$metadata" ] || {
        remediation_error "metadata must be a regular file"
        return 1
    }

    recipe_count=0
    local recipe
    for recipe in remediate.sh remediate.py remediate.js; do
        if [ -e "$check_dir/$recipe" ] || [ -L "$check_dir/$recipe" ]; then
            [ -f "$check_dir/$recipe" ] && [ ! -L "$check_dir/$recipe" ] && [ -x "$check_dir/$recipe" ] || {
                remediation_error "recipe must be an executable regular file"
                return 1
            }
            recipe_count=$((recipe_count + 1))
        fi
    done
    [ "$recipe_count" -eq 1 ] || {
        remediation_error "exactly one remediation recipe is required"
        return 1
    }

    jq -e '
      .remediation | type == "object"
      and (keys == ["allowed_paths", "label", "timeout", "version"])
      and .version == 1
      and (.label | type == "string" and length >= 1 and length <= 80 and (test("[[:cntrl:]]") | not))
      and (.timeout | type == "number" and floor == . and . >= 1 and . <= 300)
      and (.allowed_paths | type == "array" and length > 0 and ((unique | length) == length)
          and all(.[]; type == "string"
              and test("^[A-Za-z0-9][A-Za-z0-9._/-]*$")
              and (split("/") | index("..") | not)
              and (split("/") | index(".git") | not)
              and (startswith(".github/workflows/") | not)
          ))
    ' "$metadata" >/dev/null || {
        remediation_error "remediation metadata schema is invalid"
        return 1
    }
}

load_remediation_descriptor() {
    local check_dir="$1"
    local policy_file="$2"
    local metadata="$check_dir/metadata.json"

    validate_remediation_policy "$policy_file" || return 1
    [ -f "$metadata" ] && [ ! -L "$metadata" ] || {
        remediation_error "metadata must be a regular file"
        return 1
    }
    if ! jq -e 'has("remediation")' "$metadata" >/dev/null; then
        printf 'null\n'
        return 0
    fi
    validate_remediation_recipe "$check_dir" || return 1
    jq -c '{version: .remediation.version, label: .remediation.label}' "$metadata"
}

remediation_allowed_paths() {
    local check_dir="$1"
    local policy_file="$2"

    validate_remediation_policy "$policy_file" || return 1
    validate_remediation_recipe "$check_dir" || return 1
    jq -c '.remediation.allowed_paths' "$check_dir/metadata.json"
}

remediation_recipe_path() {
    local check_dir="$1"
    local recipe
    validate_remediation_recipe "$check_dir" || return 1
    for recipe in remediate.sh remediate.py remediate.js; do
        [ -f "$check_dir/$recipe" ] && {
            printf '%s\n' "$check_dir/$recipe"
            return 0
        }
    done
    return 1
}
