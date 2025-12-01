#!/bin/bash
# File finding utilities
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/file-utils.sh"

# Find README file
find_readme() {
    find_file "${1:-.}" README.md readme.md README README.txt readme.txt || echo ""
}

# Find LICENSE file
find_license() {
    find_file "${1:-.}" LICENSE LICENSE.txt LICENSE.md COPYING COPYING.txt || echo ""
}

# Find OpenAPI spec file
find_openapi_spec() {
    local repo_path="${1:-.}"

    local paths=(
        "openapi.yaml"
        "openapi.yml"
        "openapi.json"
        "swagger.yaml"
        "swagger.yml"
        "swagger.json"
        "api/openapi.yaml"
        "api/openapi.yml"
        "api/openapi.json"
        "api/swagger.yaml"
        "api/swagger.yml"
        "api/swagger.json"
        "docs/openapi.yaml"
        "docs/openapi.yml"
        "docs/openapi.json"
        "docs/swagger.yaml"
        "docs/swagger.yml"
        "docs/swagger.json"
        "spec/openapi.yaml"
        "spec/openapi.yml"
        "spec/openapi.json"
        ".openapi/openapi.yaml"
        ".openapi/openapi.yml"
        ".openapi/openapi.json"
    )

    find_file "$repo_path" "${paths[@]}" || echo ""
}

# Find CI config file
find_ci_config() {
    local repo_path="${1:-.}"

    local paths=(
        ".github/workflows"
        ".travis.yml"
        ".gitlab-ci.yml"
        "circle.yml"
        ".circleci/config.yml"
        "Jenkinsfile"
        ".drone.yml"
        "azure-pipelines.yml"
        "bitbucket-pipelines.yml"
    )

    find_path "$repo_path" "${paths[@]}" || echo ""
}
