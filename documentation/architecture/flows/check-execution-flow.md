# Check Execution Flow

This document describes how individual quality checks are discovered, executed, and scored.

## Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│          Scorecards Action Environment                       │
│                                                              │
│  1. DISCOVER CHECKS                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Find all directories in checks/                       │ │
│  │  └─ checks/01-readme-present/                          │ │
│  │  └─ checks/02-ci-present/                              │ │
│  │  └─ checks/03-has-tests/                               │ │
│  │  └─ ... (sorted numerically)                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                     │                                        │
│                     ▼                                        │
│  2. VALIDATE ALL CANDIDATES                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  validate-check.sh owns layout and metadata validation │ │
│  │  Consume its normalized projection                    │ │
│  │  Invalid candidate: stop before execution or output    │ │
│  └────────────────────────────────────────────────────────┘ │
│                     │                                        │
│                     ▼                                        │
│  3. BUILD DOCKER IMAGE                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Create multi-runtime container:                       │ │
│  │  ├─ Node.js 20 + npm packages                          │ │
│  │  ├─ Python 3 + pip packages                            │ │
│  │  └─ Bash utilities (grep, sed, awk, jq, curl)          │ │
│  └────────────────────────────────────────────────────────┘ │
│                     │                                        │
│                     ▼                                        │
│  4. RUN CHECK (sequential loop)                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  For each check:                                        │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Determine executor:                             │  │ │
│  │  │  ├─ check.sh  → bash                             │  │ │
│  │  │  ├─ check.py  → python3                          │  │ │
│  │  │  └─ check.js  → node                             │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Execute in Docker container:                    │  │ │
│  │  │  docker run --rm \                               │  │ │
│  │  │    -v /workspace:/workspace:ro \                 │  │ │
│  │  │    -v /output:/output \                          │  │ │
│  │  │    scorecards-runner:latest \                    │  │ │
│  │  │    timeout <T> <executor> check.{sh|py|js}       │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Capture:                                        │  │ │
│  │  │  ├─ Exit code (0 = pass, non-zero = fail)        │  │ │
│  │  │  ├─ stdout/stderr                                │  │ │
│  │  │  └─ Execution time                               │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                     │                                        │
│                     ▼                                        │
│  5. WRITE RESULTS                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Append one normalized result per validated check      │ │
│  │  0: status="pass"; any non-zero: status="fail"         │ │
│  │  Excluded checks retain metadata with status=excluded  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
              ┌──────────────────────┐
              │ /output/results.json │
              │ JSON result array    │
              └──────────────────────┘
```

## Step Details

### 1. Discover Checks

**Implementation**: `action/utils/run-checks.sh`

Discovery and candidate selection are implemented in the
[runner](../../../action/utils/run-checks.sh); directory names are preserved
losslessly so malformed IDs reach validation.

**Behavior**:

- Scans `checks/` directory for subdirectories
- Sorts alphabetically (numeric prefix ensures order)
- Skips files, only processes directories

**Naming Convention**:

- `01-check-name/` - Numeric prefix for ordering
- `02-another-check/` - Ensures consistent execution order

### 2. Validate Metadata

The [canonical check contract](../../guides/check-development-guide.md#canonical-check-contract)
owns author-facing validation guidance and points to the executable schema.
The runner validates all candidates before execution and consumes the validator's
normalized projection; it does not supply fallback metadata or skip malformed
checks.

### 3. Build Docker Image

**Implementation**: `action/entrypoint.sh`

**Dockerfile**: `action/Dockerfile`

**Build inputs and local smoke command:** See the authoritative [runtime build reference](../../reference/action-reference.md#runtime-build).

**Why Multi-Runtime**:

- Some checks best written in Bash (grep, file checks)
- Some in Python (complex parsing, linting)
- Some in JavaScript (package.json analysis, npm checks)

**Build invocation:** The [Action entrypoint](../../../action/entrypoint.sh) owns the scoring build flags and local image tag.

### 4. Run Check

The Action passes its resolved service workspace to `run-checks.sh`; that directory is mounted at `/workspace` read-only and exposed as `SCORECARD_REPO_PATH`. The maintained [Action entrypoint](../../../action/entrypoint.sh) and [check runner](../../../action/utils/run-checks.sh) own the Docker invocation, limits and mounts, so this flow does not duplicate them.

### 5. Write Results

**Implementation**: `action/utils/run-checks.sh`

Normal scoring treats exit `0` as pass and every non-zero exit as fail. A
timeout is reported as exit `124` with a timeout message. The separate
remediation path is stricter: only a pre-check exit of exactly `1` is eligible
for repair.

The runner writes a JSON array. Every element contains the consumer-facing
fields below; `remediation` is present only when the validated check declares
that capability:

```json
{
  "check_id": "01-readme",
  "name": "README Documentation",
  "description": "Checks that the repository has a README file with meaningful content.",
  "category": "Documentation",
  "weight": 10,
  "status": "pass",
  "exit_code": 0,
  "duration": 1,
  "stdout": "README.md found\n",
  "stderr": ""
}
```

The [canonical validator](../../../action/utils/validate-check.sh) owns metadata
and layout validity. The runner owns this result projection; documentation
must not introduce alternate `points` or `output` fields.

## Score aggregation

[`action/utils/score-calculator.sh`](../../../action/utils/score-calculator.sh)
consumes the result array after execution. See the [Scoring Flow](scoring-flow.md)
for the surrounding lifecycle and the
[Action Reference](../../reference/action-reference.md#score-calculation) for
the user-facing formula and ranks.

## Sequential Execution

**Current Behavior**: Checks run one at a time within a single Docker container.

**Why Sequential**:

- Simpler implementation
- Easier debugging (clear log order)
- Avoids resource contention
- Most checks complete in <5 seconds

**Performance Impact**:

- ~15 checks × ~3 seconds avg = ~45 seconds
- Docker build time dominates (~1-2 minutes)
- Parallelization would save minimal time

## Related Documentation

- [Scoring Flow](scoring-flow.md) - Overall scoring process
- [Architecture Overview](../overview.md) - System architecture
