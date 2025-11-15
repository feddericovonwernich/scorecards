#!/bin/bash
# File finding utilities

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Find README file
find_readme() {
    local repo_path="${1:-.}"
    local readme_file=""

    for name in README.md readme.md README README.txt readme.txt; do
        if [ -f "$repo_path/$name" ]; then
            readme_file="$name"
            break
        fi
    done

    echo "$readme_file"
}

# Find LICENSE file
find_license() {
    local repo_path="${1:-.}"
    local license_file=""

    for name in LICENSE LICENSE.txt LICENSE.md COPYING COPYING.txt; do
        if [ -f "$repo_path/$name" ]; then
            license_file="$name"
            break
        fi
    done

    echo "$license_file"
}

# Find OpenAPI spec file
find_openapi_spec() {
    local repo_path="${1:-.}"
    local spec_file=""

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

    for path in "${paths[@]}"; do
        if [ -f "$repo_path/$path" ]; then
            spec_file="$path"
            break
        fi
    done

    echo "$spec_file"
}

# Find CI config file
find_ci_config() {
    local repo_path="${1:-.}"
    local ci_file=""

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

    for path in "${paths[@]}"; do
        if [ -e "$repo_path/$path" ]; then
            ci_file="$path"
            break
        fi
    done

    echo "$ci_file"
}
