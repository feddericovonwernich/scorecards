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
set -euo pipefail

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
command -v git node npm python3 jq docker bats shellcheck pytest
```

CI installs Bats and shellcheck in `.github/workflows/test.yml`; this repository
does not provide a separate container wrapper for them.

Install the checkout's JavaScript dependencies with `npm ci`. For Python checks
and their focused tests, install `requirements.txt` and `requirements-dev.txt`
in a local virtual environment.

### Validate and exercise the canonical ESM check

```bash
(
set -eu
action/utils/validate-check.sh checks/03-ci-config

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/pass/.github/workflows" "$tmp/fail"
printf '%s\n' 'name: ci' > "$tmp/pass/.github/workflows/ci.yml"

pass_rc=0
pass_output=$(SCORECARD_REPO_PATH="$tmp/pass" node checks/03-ci-config/check.js 2>&1) || pass_rc=$?
printf 'positive exit=%s\n%s\n' "$pass_rc" "$pass_output"
test "$pass_rc" -eq 0
case "$pass_output" in *"GitHub Actions:"*) ;; *) exit 1 ;; esac

fail_rc=0
fail_output=$(SCORECARD_REPO_PATH="$tmp/fail" node checks/03-ci-config/check.js 2>&1) || fail_rc=$?
printf 'negative exit=%s\n%s\n' "$fail_rc" "$fail_output"
test "$fail_rc" -eq 1
case "$fail_output" in *"No CI configuration found"*) ;; *) exit 1 ;; esac
)
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

The harness pins the local image to its immutable image ID, including on Docker's
classic image store without `RepoDigests`. Its offline Docker adapter maps only
that pinned identity; production registry-digest validation remains unchanged,
and no image publication is required. It creates a temporary bare service remote,
stubs GitHub API reads, and invokes production `validate` and `prepare`.
Execution limits come from `action/config/remediation.json`; the temporary policy
overrides only the pinned image, activation, and synthetic target identity.

The harness observes the containers launched by production `prepare` to require
pre-check `1`, repair `0`, post-check `0`, a byte- and mode-identical second
application, recipe exit `3` for `not_applicable`, allowed paths, and the actual
network/user/mount sandbox. It checks both the default branch name and unchanged
commit ID. It never calls `publish`, pushes a remediation branch, opens a pull
request, dispatches a workflow, or changes the real eligibility policy.
For idempotence, the observer retains the actual successful recipe container,
snapshots the repaired workspace, and restarts that same container with its
unchanged production sandbox before comparing bytes and modes and removing it.

Review activation, provenance, policy, and PR-only guarantees separately in the
[remediation flow](../architecture/flows/remediation-flow.md). Authoring and
offline preparation do not authorize a target or runtime rollout.

## Agent skill discovery

The repository keeps one canonical copy of each authoring skill:

- `.agents/skills/creating-scorecards-checks/SKILL.md`
- `.agents/skills/creating-scorecards-remediations/SKILL.md`

Codex and Gemini discover the canonical `.agents/skills` paths. Claude uses the
matching `.claude/skills` symlinks, which resolve to those same files. Pi and
other harnesses that load `AGENTS.md` follow its explicit triggers. Load the
checks skill for any check, metadata, fixture, or focused-test change; load the
remediation skill as well for a descriptor, recipe, allowed path, or remediation
authoring test.

The checkout version is the skill version. Do not copy skills into a home
directory or maintain a second command wrapper. The skills invoke this guide and
the executable validator; they do not define a parallel schema or authorize
publication, activation, pushes, or merges.

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
