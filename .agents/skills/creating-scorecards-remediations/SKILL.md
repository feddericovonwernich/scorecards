---
name: creating-scorecards-remediations
description: Use when adding or changing a Scorecards remediation descriptor, recipe, fixtures, allowed paths, or authoring tests.
---

# Creating Scorecards Remediations

## Overview

A remediation is a constrained extension of a completed check, not a release or
publication workflow. Use the production validator, prepare path, sandbox, and
o-publication authoring harness.

**Required sub-skill:** complete `creating-scorecards-checks` first. The failing
fixture must make the check exit exactly `1`; arbitrary non-zero scoring failures
are not remediation eligibility.

## Required workflow

1. Read the remediation section of
   `documentation/guides/check-development-guide.md`, the nearest remediation,
   `documentation/architecture/flows/remediation-flow.md`,
   `action/config/remediation.json`, `action/lib/remediation.sh`, and
   `action/utils/run-remediation.sh`.
2. Add one executable recipe and the smallest accurate `metadata.json`
   `remediation` descriptor. Declare only product paths the recipe may change.
   The recipe returns `0` after repair, `3` when not applicable, and another code
   for execution failure.
3. Validate the complete check:

   ```bash
   action/utils/validate-check.sh checks/<id>
   ```

4. Build the production image, then run the offline harness. It must prove
   pre-check `1` → repair `0` → post-check `0`, a byte- and mode-identical second
   application, exit `3` for the not-applicable fixture, and no disallowed paths.
5. Review the harness's immutable digest, non-root user, no-network execution,
   read-only mounts, absence of secrets and `.git`, and only `/workspace`
   writable.
6. Stop after `validate` and `prepare`. Do not publish, dispatch, push, merge,
   enable a target, use secrets, or alter eligibility policy.

## Complete example

```bash
docker build --pull --platform linux/amd64 \
  -t scorecards-runtime:local -f action/Dockerfile action

action/utils/validate-check.sh checks/09-scorecard-badge

python3 tests/remediation-authoring-smoke.py \
  --image scorecards-runtime:local \
  --check 09-scorecard-badge \
  --failing tests/fixtures/remediation/09-scorecard-badge/failing \
  --not-applicable tests/fixtures/remediation/09-scorecard-badge/not-applicable
```

## Quick reference

| Contract | Required evidence |
| --- | --- |
| Eligibility | Failing fixture exits exactly `1` |
| Descriptor | Canonical validator succeeds |
| Lifecycle | `1 → repair → 0`, idempotent, not-applicable `3` |
| Scope | Every changed path is allowed; bytes and modes stabilize |
| Sandbox | Immutable image, non-root, no network, read-only except workspace |
| Boundary | No publication, activation, secrets, dispatch, push, or merge |

## Common mistakes

| Mistake | Correction |
| --- | --- |
| Accept any non-zero pre-check | Require exactly `1`. |
| Test the recipe directly | Run the production `validate` and `prepare` harness. |
| Add a broad path because the recipe currently touches it | Remove the edit; narrow the descriptor. |
| Use publish dry-run as safety evidence | Authoring performs zero publication. |
| Enable after generic local checks | Activation is a separate policy review. |

## Red flags

Stop if the exact harness command is replaced with “use the documented harness,”
if a direct recipe test substitutes for production prepare, or if deadline,
authority, or sunk cost is used to retain publication or activation.

Before finishing, report every Quick reference row explicitly. Naming the
harness without stating pre-check `1`, post-check `0`, second-run byte/mode
identity, and not-applicable exit `3` is incomplete.

Canonical sources: `action/utils/validate-check.sh`,
`tests/remediation-authoring-smoke.py`, `action/config/remediation.json`,
`action/lib/remediation.sh`, `action/utils/run-remediation.sh`, the Check
Development Guide, and the remediation flow.
