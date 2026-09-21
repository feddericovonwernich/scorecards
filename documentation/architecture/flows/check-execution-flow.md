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
│  2. PARSE METADATA                                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  For each check, read metadata.json:                   │ │
│  │  {                                                      │ │
│  │    "weight": 10,                                        │ │
│  │    "timeout": 30,                                       │ │
│  │    "category": "documentation"                          │ │
│  │  }                                                      │ │
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
│  5. PARSE RESULTS                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Determine pass/fail from exit code                    │ │
│  │  If exit 0: status="pass", points=weight              │ │
│  │  If non-zero: status="fail", points=0                 │ │
│  │  If timeout: status="fail", points=0                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                     │                                        │
│                     ▼                                        │
│  6. AGGREGATE SCORE                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  total_weight = sum(all check weights)                 │ │
│  │  passed_weight = sum(passed check weights)             │ │
│  │  score = (passed_weight / total_weight) * 100          │ │
│  │  rank = assign_rank(score)                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                     │                                        │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │  results.json │
              │  {            │
              │    "checks": [│
              │      {         │
              │        ...     │
              │      }         │
              │    ],          │
              │    "score": 85 │
              │  }             │
              └───────────────┘
```

## Step Details

### 1. Discover Checks

**Implementation**: `action/utils/run-checks.sh`

```bash
check_dirs=$(find "$CHECKS_DIR" -mindepth 1 -maxdepth 1 -type d | sort)
```

**Behavior**:

- Scans `checks/` directory for subdirectories
- Sorts alphabetically (numeric prefix ensures order)
- Skips files, only processes directories

**Naming Convention**:

- `01-check-name/` - Numeric prefix for ordering
- `02-another-check/` - Ensures consistent execution order

### 2. Parse Metadata

**Implementation**: `action/utils/run-checks.sh`

**metadata.json Structure**:

```json
{
  "weight": 10,
  "timeout": 30,
  "category": "documentation",
  "description": "Check description for UI"
}
```

**Fields**:

- **weight**: Points awarded for passing (determines importance)
- **timeout**: Max execution time in seconds (default: 30)
- **category**: Classification (documentation, testing, ci, etc.)
- **description**: Human-readable explanation

**Validation**:

- Missing metadata.json: Check skipped with warning
- Invalid JSON: Check skipped with error
- Missing required fields: Uses defaults

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

### 5. Parse Results

**Implementation**: `action/utils/run-checks.sh`

**Exit Code Interpretation**:

- **0**: Check passed → award full weight
- **1-123**: Check failed → award 0 points
- **124**: Timeout → award 0 points, log warning
- **125+**: System error → award 0 points, log error

**Result Structure**:

```json
{
  "check_id": "01-readme-present",
  "name": "README Present",
  "status": "pass",
  "weight": 10,
  "points": 10,
  "category": "documentation",
  "output": "README.md found",
  "duration": 0.5
}
```

### 6. Aggregate Score

**Implementation**: `action/utils/score-calculator.sh`

**Calculation**:

```bash
total_weight=$(jq '[.[] | .weight] | add' results.json)
passed_weight=$(jq '[.[] | select(.status == "pass") | .weight] | add' results.json)
score=$(echo "scale=0; ($passed_weight * 100) / $total_weight" | bc)
```

**Rank Assignment**:

```bash
if [ "$score" -ge 90 ]; then
  rank="Platinum"
elif [ "$score" -ge 75 ]; then
  rank="Gold"
elif [ "$score" -ge 50 ]; then
  rank="Silver"
else
  rank="Bronze"
fi
```

**Weighted Example**:

```
Check 01: 10 points, passed → 10
Check 02: 5 points, failed → 0
Check 03: 15 points, passed → 15
---
Total: 30 points
Passed: 25 points
Score: (25/30) * 100 = 83% (Gold)
```

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
