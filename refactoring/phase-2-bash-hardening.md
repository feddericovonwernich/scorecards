# Phase 2: Bash Script Hardening

**Scope**: Add strict mode, quote variables, extract utilities
**Risk**: Low-Medium
**Files**: ~15 bash scripts

## Context

Bash scripts lack consistent error handling:
- Not all scripts use `set -e` or `set -o pipefail`
- Variables are sometimes unquoted (word splitting risk)
- Duplicated file-finding patterns in `action/lib/file-finder.sh`
- Color codes redefined in multiple files

---

## Tasks

### 2.1 Create file-utils.sh

**File**: `action/lib/file-utils.sh` (NEW)

```bash
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
```

---

### 2.2 Refactor file-finder.sh

**File**: `action/lib/file-finder.sh`

Replace duplicated patterns:

```bash
#!/bin/bash
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

# Find CI configuration
find_ci_config() {
    local repo_path="${1:-.}"

    # Check GitHub Actions
    if [ -d "$repo_path/.github/workflows" ]; then
        echo ".github/workflows"
        return 0
    fi

    # Check other CI systems
    for file in .travis.yml .gitlab-ci.yml Jenkinsfile .circleci/config.yml azure-pipelines.yml; do
        if [ -f "$repo_path/$file" ]; then
            echo "$file"
            return 0
        fi
    done

    return 1
}
```

---

### 2.3 Add Strict Mode to All Scripts

Add to the top of each script (after shebang):
```bash
set -euo pipefail
```

**Scripts to update**:
- `action/entrypoint.sh`
- `action/lib/common.sh`
- `action/lib/git-ops.sh`
- `action/lib/results-builder.sh`
- `action/lib/setup.sh`
- `action/utils/run-checks.sh`
- `action/utils/score-calculator.sh`
- `checks/01-readme/check.sh`
- `checks/03-ci-config/check.sh`
- `checks/04-tests/check.sh`
- `scripts/install.sh`
- `scripts/reset-catalog.sh`

---

### 2.4 Quote All Variables

Search and fix unquoted variables. Common patterns:

```bash
# Before (dangerous)
if [ -f $repo_path/$name ]; then
cd $directory
echo $variable

# After (safe)
if [ -f "$repo_path/$name" ]; then
cd "$directory"
echo "$variable"
```

Use this command to find potential issues:
```bash
grep -rn '\$[a-zA-Z_][a-zA-Z0-9_]*[^"]' action/ checks/ scripts/ --include="*.sh" | grep -v '"\$'
```

---

### 2.5 Source common.sh Consistently

Ensure all scripts that use logging/colors source common.sh:

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common.sh"
```

Remove duplicate color definitions from:
- `action/utils/run-checks.sh` (lines 24-28)

The colors should only be defined in `action/lib/common.sh`:
```bash
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export NC='\033[0m'
```

---

## Verification

```bash
# Run shellcheck on all scripts
find action checks scripts -name "*.sh" -exec shellcheck {} \;

# Run the full test suite
npm test

# Test specific checks work
SCORECARD_REPO_PATH=/path/to/test-repo-perfect ./checks/01-readme/check.sh
```

---

## Files Changed Summary

### New Files
- `action/lib/file-utils.sh`

### Modified Files
- `action/lib/file-finder.sh`
- `action/entrypoint.sh`
- `action/lib/common.sh`
- `action/lib/git-ops.sh`
- `action/lib/results-builder.sh`
- `action/lib/setup.sh`
- `action/utils/run-checks.sh`
- `action/utils/score-calculator.sh`
- `checks/01-readme/check.sh`
- `checks/03-ci-config/check.sh`
- `checks/04-tests/check.sh`
- `scripts/install.sh`
- `scripts/reset-catalog.sh`
