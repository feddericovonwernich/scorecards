---
name: creating-scorecards-checks
description: Use when adding or changing a Scorecards check under checks/, its metadata.json, fixtures, or focused tests.
---

# Creating Scorecards Checks

## Overview

Use the repository's executable contract and production runner. A check is not
ready until metadata, direct pass/fail behavior, focused tests, and consumer JSON
all pass.

## Required workflow

1. Read `documentation/guides/check-development-guide.md`, the nearest check,
   `checks/lib/README.md`, and `action/utils/run-checks.sh`.
2. Keep exactly one `check.sh`, `check.py`, or ESM `check.js`. Checks are
   read-only. Add positive and negative fixtures.
3. Validate before scoring:

   ```bash
   action/utils/validate-check.sh checks/<id>
   ```

4. Run the implementation directly against both fixtures with
   `SCORECARD_REPO_PATH`; assert pass output/exit `0` and fail output/non-zero.
5. Run the focused test for its language:

   ```bash
   npm run test:js -- tests/unit/javascript/<file>.test.js
   bats tests/unit/bash/<file>.bats
   pytest tests/unit/python/<file>.py
   ```

6. Execute the real Docker walkthrough in
   `documentation/guides/check-development-guide.md#exercise-the-production-runner`,
   selecting the new check plus `checks/lib`. Inspect `results.json` for its
   `check_id`, `status`, `exit_code`, `stdout`, and `stderr`.
7. Run `action/utils/update-checks-hash.sh --hash-only` to prove the suite still
   hashes. The generated catalog owns the check listing.

## Complete example

For `13-changelog`, replace `<id>` above with `13-changelog`; use Node for both
fixtures, then select it in the documented runner:

```bash
SCORECARD_REPO_PATH=tests/fixtures/changelog/pass node checks/13-changelog/check.js
set +e
SCORECARD_REPO_PATH=tests/fixtures/changelog/fail node checks/13-changelog/check.js
rc=$?
set -e
test "$rc" -ne 0
```

The implementation uses `import`, not `require`; the focused test belongs under
`tests/unit/javascript/`.

## Quick reference

| Gate | Evidence |
| --- | --- |
| Layout and metadata | Validator exits `0` and prints normalized JSON |
| Behavior | Direct positive and negative fixture results |
| Regression | One focused existing-framework test |
| Runtime | Real Docker entrypoint plus inspected result JSON |
| Integration | Hash command succeeds; no manual README listing |

## Common mistakes

| Mistake | Correction |
| --- | --- |
| Trust copied metadata or inspect a schema manually | Run the canonical validator. |
| Preserve CommonJS because it already exists | Convert `.js` to ESM. |
| Add `checks/<id>/test.sh` | Use the existing language test directory. |
| Update a README check list | The catalog projection is generated. |
| Substitute a direct run for Docker | Run both; they verify different contracts. |

## Red flags

Stop before finishing if any gate lacks command output, if only the passing
fixture ran, or if Docker was skipped as “slow.” Time pressure and sunk work do
not replace the five evidence slots above.

Canonical sources: `action/utils/validate-check.sh`,
`action/config/check-metadata.json`, `action/utils/run-checks.sh`,
`action/utils/update-checks-hash.sh`, and the Check Development Guide.
