# Check Development Guide

This guide explains how to create new checks for the scorecard system.

## Check Structure

Each check lives in its own directory under `/checks/` with the following structure:

```
checks/
└── 01-my-check/
    ├── check.sh          # The check script (can be .sh, .py, or .js)
    └── metadata.json     # Check metadata
```

## Canonical check contract

`action/config/check-metadata.json` owns the supported values and limits.
`action/utils/validate-check.sh` is the executable contract for the directory
layout, ID, metadata, and optional remediation descriptor. Do not copy those
rules into a second schema.

Create `metadata.json` plus exactly one regular `check.sh`, `check.py`, or
`check.js`, then validate the directory:

```bash
action/utils/validate-check.sh checks/01-my-check
```

Exit `0` prints the normalized metadata projection. Exit `64` means the command
was called incorrectly. Exit `65` identifies invalid data or layout on stderr.
The runner validates every candidate before executing the first check, so one
invalid directory fails the suite without partial results. A support directory
without metadata or a check script, such as `checks/lib`, is not a candidate.

### Optional remediation recipe

A check may declare remediation metadata and exactly one executable
`remediate.sh`, `remediate.py`, or `remediate.js`. The validator delegates this
contract to `action/lib/remediation.sh`; the canonical security, sandbox, and
exit-code rules remain in the
[remediation flow](../architecture/flows/remediation-flow.md#contrato-del-check).
Declaring a recipe does not enable a destination or authorize publication.

## Check Script Interface

### Input

Your check script receives the service repository path as an environment variable:

```bash
# Bash example
REPO_PATH="${SCORECARD_REPO_PATH}"
cd "$REPO_PATH" || exit 1

# Python example
import os
repo_path = os.environ.get('SCORECARD_REPO_PATH')

# JavaScript example
const repoPath = process.env.SCORECARD_REPO_PATH;
```

### Output

#### Exit Codes

- **0**: Check passed
- **Non-zero**: Check failed

#### stdout/stderr

- **stdout**: Success message or additional details (shown in catalog)
- **stderr**: Failure reason or error details (shown in catalog on failure)

### Example Check Scripts

#### Bash (.sh)

```bash
#!/bin/bash
set -e

REPO_PATH="${SCORECARD_REPO_PATH}"

if [ -f "$REPO_PATH/README.md" ]; then
    # Check if README has content (more than 10 lines)
    line_count=$(wc -l < "$REPO_PATH/README.md")
    if [ "$line_count" -gt 10 ]; then
        echo "README.md exists with $line_count lines"
        exit 0
    else
        echo "README.md exists but has only $line_count lines (needs > 10)" >&2
        exit 1
    fi
else
    echo "README.md not found" >&2
    exit 1
fi
```

#### Python (.py)

```python
#!/usr/bin/env python3
import os
import sys
from pathlib import Path

repo_path = Path(os.environ.get('SCORECARD_REPO_PATH', '.'))
license_file = repo_path / 'LICENSE'

if license_file.exists():
    content = license_file.read_text()
    if len(content.strip()) > 100:
        print(f"LICENSE file found ({len(content)} bytes)")
        sys.exit(0)
    else:
        print("LICENSE file too short (< 100 bytes)", file=sys.stderr)
        sys.exit(1)
else:
    print("LICENSE file not found", file=sys.stderr)
    sys.exit(1)
```

#### JavaScript (.js)

JavaScript checks are ES modules both in this checkout (`package.json` declares
`"type": "module"`) and in the runtime. Use
[`checks/03-ci-config/check.js`](../../checks/03-ci-config/check.js) as the
canonical example; it imports Node built-ins with `import` and is the same file
exercised by the walkthrough below. Do not create `.cjs`: the runner does not
discover it.

## Best Practices

### 1. Be Specific in Output

Good:

```bash
echo "Found 15 test files covering 12 source files (80% coverage)"
```

Bad:

```bash
echo "Tests found"
```

### 2. Handle Errors Gracefully

```bash
if ! command -v python3 &> /dev/null; then
    echo "python3 not found - cannot check" >&2
    exit 1
fi
```

### 3. Make Checks Fast

- Set appropriate timeouts
- Avoid network calls when possible
- Cache results if repeated operations needed

### 4. Make Checks Idempotent

Checks should not modify the repository - they are read-only.

### 5. Keep metadata intentional

Choose values supported by `action/config/check-metadata.json`, explain the
check's observable purpose, and run the canonical validator. Do not maintain a
second weight or category table in contributor documentation.

## Check Naming Convention

Use numeric prefixes to control execution order:

```
01-foundational-check/
02-another-check/
10-less-critical/
```

Checks run in lexicographical order, so lower numbers run first.

## Testing Your Check Locally

### Prerequisites

Check the tools used by the focused commands before starting:

```bash
command -v node npm python3 jq docker bats shellcheck
```

CI installs Bats and shellcheck in `.github/workflows/test.yml`; this repository
does not provide a separate container wrapper for them.

### Validate and exercise the canonical ESM check

```bash
action/utils/validate-check.sh checks/03-ci-config

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/pass/.github/workflows" "$tmp/fail"
printf '%s\n' 'name: ci' > "$tmp/pass/.github/workflows/ci.yml"

SCORECARD_REPO_PATH="$tmp/pass" node checks/03-ci-config/check.js
set +e
SCORECARD_REPO_PATH="$tmp/fail" node checks/03-ci-config/check.js
rc=$?
set -e
test "$rc" -eq 1
```

Every new check needs a positive and negative fixture. A normal scoring failure
may use any non-zero exit code; use exactly `1` when that failure is intended to
be eligible for remediation.

### Exercise the production runner

```bash
docker build --pull --platform linux/amd64 \
  -t scorecards-runtime:local -f action/Dockerfile action

fixture="$(mktemp -d)"
selected="$(mktemp -d)"
output="$(mktemp -d)"
trap 'rm -rf "$fixture" "$selected" "$output"' EXIT
mkdir -p "$fixture/.github/workflows"
printf '%s\n' 'name: ci' > "$fixture/.github/workflows/ci.yml"
cp -a checks/03-ci-config checks/lib "$selected/"

docker run --rm --network=none \
  --mount "type=bind,src=$selected,dst=/host-checks,readonly" \
  --mount "type=bind,src=$fixture,dst=/workspace,readonly" \
  --mount "type=bind,src=$output,dst=/output" \
  scorecards-runtime:local

jq -e '
  length == 1
  and .[0].check_id == "03-ci-config"
  and .[0].status == "pass"
  and .[0].exit_code == 0
  and (.[0].stdout | contains("GitHub Actions"))
  and .[0].stderr == ""
' "$output/results.json"
```

This uses `action/Dockerfile` and the real entrypoint. It verifies the consumer
JSON rather than only checking that the script starts.

### Run a focused test

Match the existing framework for the implementation language:

```bash
npm run test:js -- tests/unit/javascript/<file>.test.js
bats tests/unit/bash/<file>.bats
pytest tests/unit/python/<file>.py
```

## Authoring a remediation

First complete the check walkthrough and confirm the reparable fixture exits
exactly `1`. A recipe receives `SCORECARD_REPO_PATH=/workspace`,
`SCORECARDS_REPO`, `SERVICE_REPOSITORY`, and
`SCORECARDS_BRANCH=catalog`. It returns `0` after applying a repair, `3` when
the fixture is not applicable, and another code on execution failure.

After declaring the descriptor and one executable recipe, run the offline
authoring harness:

```bash
action/utils/validate-check.sh checks/09-scorecard-badge

python3 tests/remediation-authoring-smoke.py \
  --image scorecards-runtime:local \
  --check 09-scorecard-badge \
  --failing tests/fixtures/remediation/09-scorecard-badge/failing \
  --not-applicable tests/fixtures/remediation/09-scorecard-badge/not-applicable
```

The harness resolves the local image to its immutable Docker digest, creates a
temporary bare service remote, stubs only GitHub API reads, and invokes the
production `validate` and `prepare` commands. It requires fail → repair → pass,
a byte- and mode-identical second application, `not_applicable`, allowed paths,
and the production network/user/mount sandbox. It never calls `publish`, pushes
a branch, opens a pull request, dispatches a workflow, or changes the real
eligibility policy.

Review activation, provenance, policy, and PR-only guarantees separately in the
[remediation flow](../architecture/flows/remediation-flow.md). Authoring and
offline preparation do not authorize a target or runtime rollout.

## Common Patterns

### Checking File Existence

```bash
if [ -f "$REPO_PATH/somefile.txt" ]; then
    echo "File exists"
    exit 0
fi
```

### Checking Directory Structure

```bash
if [ -d "$REPO_PATH/src" ] && [ -d "$REPO_PATH/tests" ]; then
    echo "Standard structure found"
    exit 0
fi
```

### Parsing Configuration Files

```bash
if grep -q "python.*3\\.9" "$REPO_PATH/.python-version"; then
    echo "Using Python 3.9+"
    exit 0
fi
```

### Using jq for JSON

```bash
if jq -e '.scripts.test' "$REPO_PATH/package.json" > /dev/null 2>&1; then
    echo "npm test script defined"
    exit 0
fi
```

## Contributing New Checks

1. Create one check implementation and its metadata.
2. Add positive and negative fixtures plus one focused behavioral test.
3. Run the validator, both direct cases, and the production runner walkthrough.
4. Document assumptions that a consumer must know.
5. Submit the implementation, metadata, fixtures, and focused test in one pull
   request. The generated catalog, not the README, owns the check listing.

## Questions?

Open an issue or discussion in this repository.
