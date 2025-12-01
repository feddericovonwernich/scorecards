#!/bin/bash
# Generic file utilities - replaces duplicated patterns
set -euo pipefail

# Find first matching file from list of names
# Usage: find_file "$repo_path" "README.md" "readme.md" "README"
# Returns: filename if found, empty string if not
# Exit code: 0 if found, 1 if not found
find_file() {
    local repo_path="${1:-.}"
    shift
    for name in "$@"; do
        if [ -f "$repo_path/$name" ]; then
            echo "$name"
            return 0
        fi
    done
    return 1
}

# Find first matching directory from list of names
# Usage: find_dir "$repo_path" ".github" ".gitlab"
find_dir() {
    local repo_path="${1:-.}"
    shift
    for name in "$@"; do
        if [ -d "$repo_path/$name" ]; then
            echo "$name"
            return 0
        fi
    done
    return 1
}

# Find first matching path (file or directory) from list of names
# Usage: find_path "$repo_path" ".github/workflows" ".travis.yml"
# Exit code: 0 if found, 1 if not found
find_path() {
    local repo_path="${1:-.}"
    shift
    for name in "$@"; do
        if [ -e "$repo_path/$name" ]; then
            echo "$name"
            return 0
        fi
    done
    return 1
}
