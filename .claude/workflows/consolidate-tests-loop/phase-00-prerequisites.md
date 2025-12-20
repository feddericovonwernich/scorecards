---
phase_metadata:
  inputs:
    parameters:
      - name: BACKEND_ONLY
        required: false
        default: false
        type: boolean
        description: Only consolidate backend tests
      - name: FRONTEND_ONLY
        required: false
        default: false
        type: boolean
        description: Only consolidate frontend tests
      - name: DRY_RUN
        required: false
        default: false
        type: boolean
        description: Analyze only, no changes
      - name: FORCE
        required: false
        default: false
        type: boolean
        description: Skip diminishing returns check
      - name: OUTPUT_DIR
        required: false
        default: ./.claude/workflows/consolidate-tests-loop/runs
        type: directory
        description: Output directory for reports

  outputs:
    files:
      - path: "$OUTPUT_DIR/consolidation-baseline.json"
        description: Initial test suite metrics and baseline
        required: true
      - path: "$OUTPUT_DIR/history.json"
        description: Consolidation history loaded or initialized
        required: true
    parameters:
      - name: TESTS_BASELINE
        type: integer
        description: Initial test count before consolidation
        required: true
      - name: COVERAGE_BASELINE
        type: number
        description: Initial coverage percentage
        required: true
      - name: HISTORY_LOADED
        type: boolean
        description: Whether historical data was loaded
        required: true
---

# Phase 0: Prerequisites and Baseline

**Purpose**: Verify prerequisites, establish baseline metrics, and initialize consolidation history.

## Prerequisites

- Test suite exists (tests/ directory with Python test files)
- pytest is installed and configured
- Git repository is clean (no uncommitted changes)
- .claude/test-consolidation-history.json exists or can be created

## Tasks for Todo List

1. Verify test suite structure and pytest availability
2. Check git repository status and warn about uncommitted changes
3. Create output directory for this workflow run
4. Measure baseline test count using pytest --collect-only
5. Measure baseline coverage using pytest --cov
6. Load or initialize consolidation history file
7. Save baseline metrics to consolidation-baseline.json
8. Export baseline parameters for subsequent phases

## Parameters Used

### Inputs
- BACKEND_ONLY: Whether to focus only on backend tests
- FRONTEND_ONLY: Whether to focus only on frontend tests
- DRY_RUN: Whether this is a dry run (analyze only)
- FORCE: Whether to skip diminishing returns check
- OUTPUT_DIR: Directory for workflow outputs

### Outputs
- TESTS_BASELINE: Initial test count
- COVERAGE_BASELINE: Initial coverage percentage
- HISTORY_LOADED: Whether historical consolidation data exists

## Process

### Step 1: Verify Test Suite Structure

Check that the test suite exists and is properly configured:

```bash
# Verify tests directory exists
if [ ! -d "tests/" ]; then
    echo "ERROR: tests/ directory not found"
    exit 1
fi

# Count Python test files
TEST_FILE_COUNT=$(find tests/ -name "test_*.py" -o -name "*_test.py" | wc -l)
if [ $TEST_FILE_COUNT -eq 0 ]; then
    echo "ERROR: No Python test files found in tests/"
    exit 1
fi

echo "Found $TEST_FILE_COUNT Python test files"

# Verify pytest is available
if ! command -v pytest &> /dev/null; then
    echo "ERROR: pytest not found. Install with: pip install pytest pytest-cov"
    exit 1
fi

echo "pytest is available"
```

### Step 2: Check Git Repository Status

Warn if there are uncommitted changes:

```bash
# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "WARNING: Git repository has uncommitted changes"
    echo "It's recommended to commit or stash changes before consolidation"
    echo ""
    git status --short
    echo ""

    # In non-interactive mode or if DRY_RUN, continue
    if [ "$DRY_RUN" = "true" ]; then
        echo "Continuing in dry-run mode..."
    else
        echo "Consolidation will modify test files. Ensure changes can be reverted if needed."
    fi
fi
```

### Step 3: Create Output Directory

Create the workflow run directory:

```bash
# Create output directory with timestamp
RUN_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RUN_DIR="$OUTPUT_DIR/run-$RUN_TIMESTAMP"
mkdir -p "$RUN_DIR"

echo "Output directory: $RUN_DIR"

# Export for subsequent phases
echo "RUN_DIR=$RUN_DIR" >> runtime-parameters.yaml
```

### Step 4: Measure Baseline Test Count

Use pytest to count tests:

```bash
# Collect test count
echo "Collecting baseline test count..."

if [ "$BACKEND_ONLY" = "true" ]; then
    TEST_PATTERN="tests/**/*.py"
elif [ "$FRONTEND_ONLY" = "true" ]; then
    TEST_PATTERN="frontend/src/**/*.test.ts"
else
    TEST_PATTERN="tests/**/*.py"  # Default to backend
fi

# Count tests using pytest
TESTS_BASELINE=$(pytest tests/ --collect-only -q 2>/dev/null | tail -1 | grep -oE '[0-9]+ test' | awk '{print $1}')

if [ -z "$TESTS_BASELINE" ]; then
    echo "ERROR: Could not determine test count"
    exit 1
fi

echo "Baseline test count: $TESTS_BASELINE"
```

### Step 5: Measure Baseline Coverage

Run coverage analysis:

```bash
echo "Measuring baseline coverage..."

# Run coverage
COVERAGE_OUTPUT=$(pytest tests/ --cov=telegram_claude_bot --cov-report=term-missing -q 2>&1 | grep "TOTAL")

if [ -z "$COVERAGE_OUTPUT" ]; then
    echo "WARNING: Could not measure coverage"
    COVERAGE_BASELINE=0.0
else
    COVERAGE_BASELINE=$(echo "$COVERAGE_OUTPUT" | awk '{print $NF}' | sed 's/%//')
    echo "Baseline coverage: ${COVERAGE_BASELINE}%"
fi
```

### Step 6: Load or Initialize History

Load consolidation history if it exists:

```bash
HISTORY_FILE=".claude/test-consolidation-history.json"

if [ -f "$HISTORY_FILE" ]; then
    echo "Loading consolidation history from $HISTORY_FILE"
    cp "$HISTORY_FILE" "$RUN_DIR/history.json"
    HISTORY_LOADED=true

    # Show summary of previous runs
    PREVIOUS_RUNS=$(jq '.runs | length' "$HISTORY_FILE")
    echo "Found $PREVIOUS_RUNS previous consolidation runs"

    if [ $PREVIOUS_RUNS -gt 0 ]; then
        LAST_RUN_DATE=$(jq -r '.runs[-1].date' "$HISTORY_FILE")
        LAST_RUN_REDUCTION=$(jq -r '.runs[-1].tests_reduced' "$HISTORY_FILE")
        echo "Last run: $LAST_RUN_DATE (reduced $LAST_RUN_REDUCTION tests)"
    fi
else
    echo "No consolidation history found, initializing new history"
    echo '{"runs": []}' > "$RUN_DIR/history.json"
    HISTORY_LOADED=false
fi
```

### Step 7: Save Baseline Metrics

Create consolidation-baseline.json:

```bash
cat > "$RUN_DIR/consolidation-baseline.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "tests_baseline": $TESTS_BASELINE,
  "coverage_baseline": $COVERAGE_BASELINE,
  "backend_only": $BACKEND_ONLY,
  "frontend_only": $FRONTEND_ONLY,
  "dry_run": $DRY_RUN,
  "force": $FORCE,
  "history_loaded": $HISTORY_LOADED,
  "git_status": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF

echo "Baseline metrics saved to $RUN_DIR/consolidation-baseline.json"
```

### Step 8: Export Parameters

Export baseline parameters for subsequent phases:

```bash
# These parameters will be available in Phase 1 and Phase 2
echo "TESTS_BASELINE=$TESTS_BASELINE"
echo "COVERAGE_BASELINE=$COVERAGE_BASELINE"
echo "HISTORY_LOADED=$HISTORY_LOADED"
echo "RUN_DIR=$RUN_DIR"
```

## Outputs

This phase creates:

1. **$OUTPUT_DIR/run-TIMESTAMP/consolidation-baseline.json**: Baseline metrics
2. **$OUTPUT_DIR/run-TIMESTAMP/history.json**: Consolidation history (loaded or initialized)

This phase exports:

- TESTS_BASELINE: Initial test count (integer)
- COVERAGE_BASELINE: Initial coverage percentage (number)
- HISTORY_LOADED: Whether history was loaded (boolean)
- RUN_DIR: Run-specific output directory (string)

## Success Criteria

- [ ] Test suite structure verified
- [ ] Baseline test count measured successfully
- [ ] Baseline coverage measured (or set to 0.0 with warning)
- [ ] Consolidation history loaded or initialized
- [ ] Baseline metrics saved to JSON file
- [ ] All parameters exported for subsequent phases

## Error Handling

### No tests/ directory
**Symptom**: Directory not found
**Solution**: Verify working directory is project root
**Action**: FAIL phase

### pytest not available
**Symptom**: Command not found
**Solution**: Install pytest: `pip install pytest pytest-cov`
**Action**: FAIL phase

### Cannot measure test count
**Symptom**: pytest --collect-only returns no results
**Solution**: Check test discovery configuration in pytest.ini or pyproject.toml
**Action**: FAIL phase

### Cannot measure coverage
**Symptom**: pytest --cov returns no output
**Solution**: Set COVERAGE_BASELINE=0.0 and log warning
**Action**: Continue with warning

### Git uncommitted changes
**Symptom**: git status shows modified files
**Solution**: Commit or stash changes before consolidation
**Action**: Log warning, continue if DRY_RUN=true
