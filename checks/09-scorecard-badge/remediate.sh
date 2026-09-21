#!/bin/bash
# Add the deterministic Scorecards badge to one existing supported README.
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$script_dir/../../action/lib/file-finder.sh"

repo_path="${SCORECARD_REPO_PATH:-/workspace}"
scorecards_repository="${SCORECARDS_REPO:?SCORECARDS_REPO is required}"
service_repository="${SERVICE_REPOSITORY:?SERVICE_REPOSITORY is required}"
scorecards_branch="${SCORECARDS_BRANCH:-catalog}"

readme_file="$(find_readme "$repo_path")"
readme_count=0
for candidate in README.md readme.md README.rst README.txt readme.txt README; do
    if [ -e "$repo_path/$candidate" ] || [ -L "$repo_path/$candidate" ]; then
        [ -f "$repo_path/$candidate" ] && [ ! -L "$repo_path/$candidate" ] || exit 3
        readme_count=$((readme_count + 1))
    fi
done

[ "$readme_count" -eq 1 ] || exit 3
case "$readme_file" in
    README.md|README.rst|README.txt|README) ;;
    *) exit 3 ;;
esac
[ -f "$repo_path/$readme_file" ] && [ ! -L "$repo_path/$readme_file" ] || exit 3

if grep -q 'img\.shields\.io/endpoint.*catalog/badges.*score\.json' "$repo_path/$readme_file"; then
    exit 0
fi

cat >> "$repo_path/$readme_file" <<EOF

[![Scorecards](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/${scorecards_repository}/${scorecards_branch}/badges/${service_repository}/score.json)](https://github.com/${scorecards_repository})
EOF
