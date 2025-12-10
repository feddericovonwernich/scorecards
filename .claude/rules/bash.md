---
description: Bash script guidelines for all shell scripts
globs: "**/*.sh"
---

# Bash Script Guidelines

## Strict Mode (Required)

All bash scripts must start with:

```bash
#!/bin/bash
set -euo pipefail
```

- `set -e` - Exit on error
- `set -u` - Error on undefined variables
- `set -o pipefail` - Catch errors in pipelines

## Variable Quoting

Always quote variables to prevent word splitting:

```bash
# Good
if [ -f "$repo_path/$name" ]; then
if [ "$count" -eq 0 ]; then
cd "$directory"

# Bad
if [ -f $repo_path/$name ]; then
if [ $count -eq 0 ]; then
cd $directory
```

## Shared Libraries

Use utilities from `action/lib/` instead of duplicating:

| Utility | Location | Purpose |
|---------|----------|---------|
| `find_file()` | `action/lib/file-utils.sh` | Find first matching file |
| `find_dir()` | `action/lib/file-utils.sh` | Find first matching directory |
| `find_path()` | `action/lib/file-utils.sh` | Find first matching path (file or dir) |
| `find_readme()` | `action/lib/file-finder.sh` | Find README file |
| `find_license()` | `action/lib/file-finder.sh` | Find LICENSE file |
| `find_ci_config()` | `action/lib/file-finder.sh` | Find CI configuration |
| `log_info()`, etc. | `action/lib/common.sh` | Colored logging |
| `get_rank()` | `action/config/scoring.sh` | Get rank for score |
| `get_rank_color()` | `action/config/scoring.sh` | Get badge color for rank |
| `get_score_color()` | `action/config/scoring.sh` | Get gradient color for score |
| `JQ_REGISTRY_BASE_FILTER` | `action/lib/json-builders.sh` | Base jq filter for registry entries |
| `build_check_result_json()` | `action/lib/json-builders.sh` | Build check result JSON |

### Sourcing Libraries

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common.sh"
source "$SCRIPT_DIR/../lib/file-utils.sh"
```

## Colors

Never redefine color codes. Source `common.sh` for:
- `$RED`, `$GREEN`, `$YELLOW`, `$BLUE`, `$NC`
- `log_info()`, `log_success()`, `log_error()`, `log_warning()`

Exception: Standalone scripts in `scripts/` that run outside the action environment may define their own colors.

## Exit Codes

- `0` - Success
- `1` - Failure
- Use `die "message"` from `common.sh` for fatal errors

## jq Filters

Complex jq filters that are used in multiple places should be extracted to `action/lib/json-builders.sh`:
- Define filters as shell variables (e.g., `JQ_REGISTRY_BASE_FILTER`)
- Use string manipulation to compose filters: `"${BASE_FILTER%\}}${ADDITIONAL_PORTION}}"`
- Prefer helper functions for generating JSON: `build_check_result_json()`
