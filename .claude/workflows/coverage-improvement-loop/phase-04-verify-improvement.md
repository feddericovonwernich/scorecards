---
phase_metadata:
  execution_mode: sequential

  inputs:
    parameters:
      - name: TESTS_ADDED
        required: true
        description: "Number of tests added this iteration (from Phase 02)"
        type: integer
      - name: VALIDATED_TESTS_COUNT
        required: false
        description: "Number of tests that passed validation after fixing (from Phase 03)"
        type: integer
      - name: DELETED_TESTS_COUNT
        required: false
        description: "Number of tests deleted during validation (from Phase 03)"
        type: integer
      - name: VALIDATION_PASSED
        required: false
        description: "Whether Phase 03 validated all tests successfully"
        type: boolean
        default: true
      - name: FILES_IMPROVED
        required: true
        description: "Number of files improved"
        type: integer
      - name: TEST_FILES_CREATED
        required: true
        description: "Test files created or modified"
        type: string
      - name: CURRENT_COVERAGE
        required: true
        description: "Coverage before this iteration"
        type: number
      - name: LOOP_INDEX
        required: true
        description: "Current iteration number"
        type: integer

  outputs:
    files:
      - path: "$OUTPUT_DIR/run-$RUN_ID/iteration-$LOOP_INDEX-verification.md"
        description: "Verification report for this iteration"
    parameters:
      - name: NEW_COVERAGE
        description: "Coverage after running new tests"
        type: number
      - name: COVERAGE_GAINED
        description: "Coverage percentage gained this iteration"
        type: number
      - name: TESTS_PASSED
        description: "Whether all new tests pass"
        type: boolean
      - name: ROI
        description: "Return on investment (coverage gained / tests added)"
        type: number
      - name: NO_REGRESSION
        description: "Whether existing tests still pass"
        type: boolean
---

# Phase 04: Verify Improvement

**Purpose**: Run all tests including newly generated ones, verify they pass, measure coverage improvement, and calculate ROI metrics for this iteration.

## Prerequisites
- Test generation phase completed (TESTS_ADDED > 0)
- Test validation phase completed (Phase 03 - VALIDATION_PASSED)
- New test files written and validated
- Test runner and coverage tool available (pytest-cov, vitest --coverage, etc.)
- Component config loaded from `.claude/rules/testing-workflows-config.md`

**Note**: Phase 03 (Validate & Fix Tests) should have already validated and fixed the tests.
If VALIDATION_PASSED=false, some tests may still be failing but they should not block coverage measurement.

## Tasks for Todo List
When starting this phase, add these tasks:
1. Loading component configuration
2. Running all tests to verify new tests pass
3. Checking for test failures or errors
4. Running coverage measurement with new tests
5. Calculating coverage improvement (new - current)
6. Calculating ROI (coverage gained / tests added)
7. Verifying no regression in existing tests
8. Writing verification report to markdown file
9. Exporting metrics as parameters

## Parameters Used
- **TESTS_ADDED**: Number of tests added this iteration (e.g., 43)
- **VALIDATED_TESTS_COUNT**: Tests that passed validation after Phase 03 fixing (e.g., 39)
- **DELETED_TESTS_COUNT**: Tests deleted as unfixable by Phase 03 (e.g., 4)
- **VALIDATION_PASSED**: Whether Phase 03 validated successfully (e.g., true)
- **FILES_IMPROVED**: Number of files improved (e.g., 2)
- **TEST_FILES_CREATED**: Test files modified (for targeted re-run if needed)
- **CURRENT_COVERAGE**: Coverage before this iteration (e.g., 79.2)
- **LOOP_INDEX**: Current iteration number (for reporting)

**Note**: Use VALIDATED_TESTS_COUNT (not TESTS_ADDED) for ROI calculation if available, as this reflects the actual number of working tests.

## Process

### Step 0: Load Component Configuration

Load component-specific test commands from config file:

```python
import re

def load_component_config(test_file: str) -> dict:
    """Extract component config from testing-workflows-config.md."""
    config_path = ".claude/rules/testing-workflows-config.md"

    with open(config_path, 'r') as f:
        content = f.read()

    # Detect component based on test file path
    if test_file.startswith("tests/"):
        # Backend (Python)
        return {
            "language": "python",
            "package_name": "telegram_claude_bot",
            "test_command": "PYTHONPATH=src pytest tests/ -v --tb=short",
            "coverage_command": "PYTHONPATH=src pytest tests/ --cov=telegram_claude_bot --cov-report=term --cov-report=json:coverage_new.json -q",
            "coverage_file": "coverage_new.json",
            "coverage_key": "totals.percent_covered"
        }
    elif test_file.startswith("frontend/"):
        # Frontend (TypeScript/Vue)
        return {
            "language": "typescript",
            "package_name": "claude-workspaces-dashboard",
            "test_command": "cd frontend && npm test",
            "coverage_command": "cd frontend && npm run test:coverage -- --reporter=json",
            "coverage_file": "frontend/coverage/coverage-final.json",
            "coverage_key": "total.lines.pct"
        }
    else:
        raise ValueError(f"Cannot detect component for test file: {test_file}")

# Load config
first_file = os.environ.get('TEST_FILES_CREATED', 'tests/').split(',')[0]
component_config = load_component_config(first_file)
```

### Step 1: Run All Tests

Execute test command to verify new tests pass:

```bash
echo "Running all tests including new tests from iteration $LOOP_INDEX..."
echo "Language: ${component_config[language]}"
echo "Package: ${component_config[package_name]}"

# Get test command from component config
TEST_COMMAND="${component_config[test_command]}"

# Run all tests with verbose output
eval "$TEST_COMMAND" > test_results.txt 2>&1
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    TESTS_PASSED=true
    echo "✓ All tests passed"
else
    TESTS_PASSED=false
    echo "✗ Some tests failed (exit code: $TEST_EXIT_CODE)"
fi
```

### Step 2: Analyze Test Failures (if any)

If tests failed, identify which tests and why:

```bash
if [ "$TESTS_PASSED" = "false" ]; then
    # Extract failed test names
    failed_tests=$(grep "FAILED" test_results.txt | awk '{print $1}')

    # Check if failures are in newly added tests
    new_test_failures=$(echo "$failed_tests" | grep -f <(echo "$TEST_FILES_CREATED" | tr ',' '\n'))

    if [ -n "$new_test_failures" ]; then
        echo "ERROR: Newly generated tests are failing:"
        echo "$new_test_failures"
        # This is a critical error - generated tests must pass
    else
        echo "WARNING: Existing tests failed (not related to new tests)"
        # Regression detected
        NO_REGRESSION=false
    fi
fi
```

### Step 3: Run Coverage Measurement

Measure coverage with new tests included:

```bash
# Get coverage command from component config
COVERAGE_COMMAND="${component_config[coverage_command]}"
COVERAGE_FILE="${component_config[coverage_file]}"
COVERAGE_KEY="${component_config[coverage_key]}"

# Run coverage
eval "$COVERAGE_COMMAND"

# Extract new coverage percentage (language-specific parsing)
case "${component_config[language]}" in
    python)
        # Parse coverage.json for Python
        NEW_COVERAGE=$(python -c "import json; data=json.load(open('$COVERAGE_FILE')); print(f\"{data['totals']['percent_covered']:.1f}\")")
        ;;
    typescript|javascript)
        # Parse coverage-final.json for JS/TS (Istanbul format)
        NEW_COVERAGE=$(python -c "import json; data=json.load(open('$COVERAGE_FILE')); print(f\"{data['total']['lines']['pct']:.1f}\")")
        ;;
    go)
        # Parse go test -cover output
        NEW_COVERAGE=$(grep -oP 'coverage: \K[\d.]+' coverage.txt)
        ;;
    *)
        echo "ERROR: Unsupported language for coverage parsing"
        exit 1
        ;;
esac

echo "New coverage: ${NEW_COVERAGE}%"
```

### Step 4: Calculate Coverage Improvement

Determine how much coverage was gained:

```bash
# Calculate coverage gain
COVERAGE_GAINED=$(python -c "print(f\"{float('$NEW_COVERAGE') - float('$CURRENT_COVERAGE'):.1f}\")")

echo "Coverage improved from ${CURRENT_COVERAGE}% to ${NEW_COVERAGE}%"
echo "Gained: ${COVERAGE_GAINED}% with ${TESTS_ADDED} tests"
```

### Step 5: Calculate ROI

Measure return on investment (coverage gained per test):

```bash
# Use VALIDATED_TESTS_COUNT if available (from Phase 03), otherwise use TESTS_ADDED
EFFECTIVE_TESTS=${VALIDATED_TESTS_COUNT:-$TESTS_ADDED}

if [ "$EFFECTIVE_TESTS" -gt 0 ]; then
    ROI=$(python -c "print(f\"{float('$COVERAGE_GAINED') / float('$EFFECTIVE_TESTS'):.3f}\")")
    echo "ROI: ${ROI}% coverage gained per test"
    echo "Based on $EFFECTIVE_TESTS validated tests (${DELETED_TESTS_COUNT:-0} tests were deleted as unfixable)"
else
    ROI=0.0
    echo "WARNING: No working tests available this iteration"
fi
```

**Important**: ROI should be calculated based on VALIDATED_TESTS_COUNT (tests that actually work) rather than TESTS_ADDED (tests originally generated), since deleted/unfixable tests don't contribute to coverage.

### Step 6: Verify No Regression

Check that existing tests still pass:

```bash
# Compare test pass rate before and after
# If all tests passed initially but some fail now, that's a regression

if [ "$TESTS_PASSED" = "true" ]; then
    NO_REGRESSION=true
    echo "✓ No regression detected - all tests pass"
else
    # Check if failures are only in new tests vs existing tests
    # Set NO_REGRESSION based on whether existing tests still pass
    NO_REGRESSION=true  # or false if existing tests broke
fi
```

### Step 7: Generate Verification Report

Write detailed verification report to `$OUTPUT_DIR/run-$RUN_ID/iteration-$LOOP_INDEX-verification.md`:

```markdown
# Verification Report - Iteration $LOOP_INDEX

## Test Execution Summary

| Metric | Value |
|--------|-------|
| Tests Added | 18 |
| Files Improved | 5 |
| All Tests Passed | ✓ Yes |
| No Regression | ✓ Yes |

## Coverage Improvement

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Overall Coverage | 31.0% | 35.2% | +4.2% |
| Critical Tier | 45.0% | 52.3% | +7.3% |
| High-Risk Tier | 35.0% | 38.1% | +3.1% |
| Standard Tier | 25.0% | 27.5% | +2.5% |

## ROI Analysis

- **Tests Added**: 18
- **Coverage Gained**: 4.2%
- **ROI**: 0.233% per test

**Interpretation**: Good ROI - each test added approximately 0.23% coverage.

## Files Improved

**Backend (Python):**
1. src/${PACKAGE_NAME}/auth/manager.py: 45% → 58% (+13%)
2. src/${PACKAGE_NAME}/web/api/auth.py: 50% → 62% (+12%)
3. src/${PACKAGE_NAME}/session/models.py: 40% → 45% (+5%)

**Frontend (TypeScript):**
4. frontend/src/stores/auth.ts: 35% → 62% (+27%)
5. frontend/src/api/client.ts: 50% → 68% (+18%)

## Test Quality Check

✓ All tests have docstrings
✓ Parameterization used where appropriate
✓ Strong assertions verified
✓ No test failures
✓ No regressions detected

## Recommendation

Continue to next iteration - targets not yet met and ROI is healthy.
```

### Step 8: Export Metrics

Write all metrics as discovered parameters:

```yaml
NEW_COVERAGE: <new_coverage_percentage>
COVERAGE_GAINED: <coverage_improvement>
TESTS_PASSED: <true_or_false>
ROI: <coverage_per_test>
NO_REGRESSION: <true_or_false>
```

## Outputs

**Files Created**:
- `$OUTPUT_DIR/run-$RUN_ID/iteration-$LOOP_INDEX-verification.md`: Verification report

**Parameters Discovered**:
- `NEW_COVERAGE`: Coverage after new tests (e.g., 35.2)
- `COVERAGE_GAINED`: Coverage percentage gained (e.g., 4.2)
- `TESTS_PASSED`: Whether all tests pass (e.g., true)
- `ROI`: Coverage gained per test (e.g., 0.233)
- `NO_REGRESSION`: Whether existing tests still pass (e.g., true)

## Success Criteria
- [ ] All tests executed successfully
- [ ] New tests pass (TESTS_PASSED = true)
- [ ] No regression in existing tests (NO_REGRESSION = true)
- [ ] Coverage measurement completed
- [ ] Coverage improvement calculated
- [ ] ROI calculated and positive
- [ ] Verification report written
- [ ] All metrics exported as parameters

## Error Handling

**New Tests Fail**:
- Identify failing tests from test_results.txt
- Log specific test names and error messages
- If failures are in newly generated tests:
  - This is a critical error (generated tests should pass)
  - Set TESTS_PASSED=false
  - Include failure details in verification report
  - Consider: Fix tests immediately OR skip failed tests and continue
- Exit with FAILURE status

**Existing Tests Fail (Regression)**:
- Identify which existing tests broke
- Compare with test results from previous iteration
- Set NO_REGRESSION=false
- Log regression details
- This is a WARNING, not necessarily a blocker
- Continue to decision phase (may need manual intervention)

**Coverage Measurement Fails**:
- Check for pytest errors
- Verify tests/ directory is intact
- Re-run coverage measurement once
- If still fails, exit with FAILURE

**Coverage Decreased** (rare):
- If NEW_COVERAGE < CURRENT_COVERAGE
- This is highly unusual (adding tests shouldn't decrease coverage)
- Log warning with details
- Set COVERAGE_GAINED to negative value
- Continue to decision phase for analysis

**ROI is Zero or Negative**:
- If COVERAGE_GAINED <= 0
- Log warning: "Tests added but coverage didn't improve"
- This could indicate:
  - Tests are redundant (already covered)
  - Tests are weak (don't exercise new code paths)
  - Coverage tool issue
- Continue to decision phase (diminishing returns detected)

## Notes

**Test Quality Validation**: After tests pass, optionally run quick quality checks:
- Count tests without docstrings: `grep -r "def test_" tests/ | grep -v '"""' | wc -l`
- Check for weak assertions: Look for standalone `assert x is not None`
- Verify parameterization: Count `@pytest.mark.parametrize` usage

**Coverage by File**: Optionally parse coverage_new.json to get per-file coverage improvements and include in verification report.

**Historical Comparison**: Compare this iteration's ROI with previous iterations to detect diminishing returns trend.
