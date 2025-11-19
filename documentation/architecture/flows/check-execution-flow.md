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

**Implementation**: `action/scripts/run-checks.sh` line 40

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

**Implementation**: `action/scripts/run-checks.sh` lines 56-67

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

**Implementation**: `action/entrypoint.sh` lines 149-157

**Dockerfile**: `action/Dockerfile`

**Multi-Runtime Support**:
```dockerfile
FROM ubuntu:22.04
RUN apt-get install -y python3 python3-pip
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs bash grep sed awk jq curl git
```

**Why Multi-Runtime**:
- Some checks best written in Bash (grep, file checks)
- Some in Python (complex parsing, linting)
- Some in JavaScript (package.json analysis, npm checks)

**Build Flags**:
- `--no-cache`: Ensures fresh build with latest dependencies
- `-t scorecards-runner:latest`: Tagged for reference

### 4. Run Check

**Implementation**: `action/scripts/run-checks.sh` lines 109-117

**Executor Selection**:
```bash
if [[ -f "$check_dir/check.sh" ]]; then
  executor="bash"
  check_script="$check_dir/check.sh"
elif [[ -f "$check_dir/check.py" ]]; then
  executor="python3"
  check_script="$check_dir/check.py"
elif [[ -f "$check_dir/check.js" ]]; then
  executor="node"
  check_script="$check_dir/check.js"
fi
```

**Docker Execution**:
```bash
docker run --rm \
  -v "$GITHUB_WORKSPACE:/workspace:ro" \
  -v "$OUTPUT_DIR:/output" \
  scorecards-runner:latest \
  timeout "$timeout" "$executor" "$check_script"
```

**Volume Mounts**:
- `/workspace` - Service repository (read-only for security)
- `/output` - Write location for check output

**Environment Variables**:
- `SCORECARD_REPO_PATH=/workspace` - Where service repo is mounted
- All checks use this to access files

**Timeout Handling**:
- `timeout` command kills check after specified seconds
- Exit code 124 indicates timeout
- Prevents hung checks from blocking workflow

### 5. Parse Results

**Implementation**: `action/scripts/run-checks.sh` lines 130-138

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

## Check Development

### Creating a New Check

1. **Create directory**: `checks/16-my-new-check/`
2. **Add metadata.json**:
   ```json
   {
     "weight": 10,
     "timeout": 30,
     "category": "testing",
     "description": "Checks something important"
   }
   ```
3. **Add check script**: `check.sh`, `check.py`, or `check.js`
4. **Return exit code**: 0 for pass, non-zero for fail

### Check Script Best Practices

**Bash Example** (`check.sh`):
```bash
#!/bin/bash
set -e

if [ -f "$SCORECARD_REPO_PATH/README.md" ]; then
  echo "README.md found"
  exit 0
else
  echo "README.md missing"
  exit 1
fi
```

**Python Example** (`check.py`):
```python
#!/usr/bin/env python3
import os
import sys

repo_path = os.environ.get('SCORECARD_REPO_PATH', '/workspace')
if os.path.exists(f"{repo_path}/README.md"):
    print("README.md found")
    sys.exit(0)
else:
    print("README.md missing")
    sys.exit(1)
```

**Key Points**:
- Always use `SCORECARD_REPO_PATH` environment variable
- Print helpful output (visible in logs)
- Exit 0 for success, non-zero for failure
- Keep checks fast (<5 seconds ideal)
- Handle missing files gracefully

## Error Handling

**Check Errors Don't Fail Workflow**:
- Individual check failures result in 0 points
- Workflow continues to completion
- Always exits 0 (non-blocking)

**Timeout Protection**:
- Prevents infinite loops
- Configurable per-check
- Logged separately from failures

**Docker Isolation**:
- Check crashes don't affect other checks
- Resource limits prevent runaway processes
- Clean state for each check

## Related Documentation

- [Scoring Flow](scoring-flow.md) - Overall scoring process
- [Architecture Overview](../overview.md) - System architecture
