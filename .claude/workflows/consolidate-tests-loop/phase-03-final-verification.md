---
phase_metadata:
  inputs:
    parameters:
      - name: TESTS_BASELINE
        required: true
        type: integer
        description: Initial test count
      - name: COVERAGE_BASELINE
        required: true
        type: number
        description: Initial coverage
      - name: CURRENT_TEST_COUNT
        required: true
        type: integer
        description: Final test count after loop
      - name: CURRENT_COVERAGE
        required: true
        type: number
        description: Final coverage after loop
      - name: TOTAL_REDUCTION
        required: true
        type: integer
        description: Total tests reduced
      - name: LOOP_INDEX
        required: true
        type: integer
        description: Number of iterations completed

  outputs:
    files:
      - path: "$OUTPUT_DIR/run-*/final-verification.json"
        description: Final verification results
        required: true
      - path: "$OUTPUT_DIR/run-*/test-verification.log"
        description: Full test output log
        required: true

    parameters:
      - name: TESTS_PASS
        type: boolean
        description: Whether all tests pass
        required: true
      - name: COVERAGE_MAINTAINED
        type: boolean
        description: Whether coverage was maintained
        required: true
      - name: MUTATION_SCORE_CHECKED
        type: boolean
        description: Whether mutation score was checked
        required: true
      - name: VERIFICATION_SUCCESS
        type: boolean
        description: Overall verification success
        required: true
---

# Phase 3: Final Verification

**Purpose**: Run comprehensive verification to ensure consolidation did not introduce regressions.

## Prerequisites

- Consolidation loop completed (Phase 2)
- Test suite has been modified
- Git repository tracks changes

## Tasks for Todo List

1. Run full test suite with verbose output
2. Verify coverage maintained or improved
3. Check mutation score if mutmut is available
4. Generate test verification log
5. Compare final state to baseline
6. Document any regressions or warnings
7. Save verification results
8. Export verification status

## Parameters Used

### Inputs
- TESTS_BASELINE: Initial test count
- COVERAGE_BASELINE: Initial coverage
- CURRENT_TEST_COUNT: Final test count
- CURRENT_COVERAGE: Final coverage
- TOTAL_REDUCTION: Total tests reduced
- LOOP_INDEX: Number of iterations

### Outputs
- TESTS_PASS: All tests passing (boolean)
- COVERAGE_MAINTAINED: Coverage not regressed (boolean)
- MUTATION_SCORE_CHECKED: Whether mutation testing ran (boolean)
- VERIFICATION_SUCCESS: Overall verification (boolean)

## Process

### Step 1: Run Full Test Suite

Execute all tests with verbose output:

```bash
echo "=== Final Verification ==="
echo ""
echo "Running full test suite..."
echo ""

# Run tests with verbose output, save to log
TEST_LOG="$RUN_DIR/test-verification.log"

if pytest tests/ -v --tb=short --cov=telegram_claude_bot --cov-report=term-missing 2>&1 | tee "$TEST_LOG"; then
    TESTS_PASS=true
    echo ""
    echo "✅ All tests passed"
else
    TESTS_PASS=false
    echo ""
    echo "❌ Some tests failed"
    echo ""
    echo "Review failures in: $TEST_LOG"
fi
```

### Step 2: Verify Coverage

Check that coverage was maintained:

```bash
echo ""
echo "Verifying coverage..."

# Extract coverage from log
FINAL_COVERAGE=$(grep "TOTAL" "$TEST_LOG" | awk '{print $NF}' | sed 's/%//')

if [ -z "$FINAL_COVERAGE" ]; then
    echo "WARNING: Could not extract coverage from test log"
    FINAL_COVERAGE=$CURRENT_COVERAGE
fi

echo "Coverage comparison:"
echo "  Baseline: ${COVERAGE_BASELINE}%"
echo "  Final: ${FINAL_COVERAGE}%"

# Allow 1% tolerance for rounding/flakiness
COVERAGE_DIFF=$(awk "BEGIN {print $FINAL_COVERAGE - $COVERAGE_BASELINE}")

if [ $(echo "$COVERAGE_DIFF >= -1.0" | bc) -eq 1 ]; then
    COVERAGE_MAINTAINED=true
    echo "  Status: ✅ Maintained (diff: ${COVERAGE_DIFF}%)"
else
    COVERAGE_MAINTAINED=false
    echo "  Status: ⚠️  Regressed (diff: ${COVERAGE_DIFF}%)"
    echo ""
    echo "WARNING: Coverage dropped by more than 1%"
    echo "Review consolidation changes for missing test coverage"
fi
```

### Step 3: Check Mutation Score (Optional)

If mutmut is available, check mutation testing score:

```bash
echo ""
echo "Checking mutation testing score..."

MUTATION_SCORE_CHECKED=false
MUTATION_SCORE_BEFORE=""
MUTATION_SCORE_AFTER=""

# Check if mutmut is available
if command -v mutmut &> /dev/null || python -m mutmut --version &> /dev/null 2>&1; then
    echo "mutmut is available, checking if baseline exists"

    # Check if .claude/mutation-scores.json exists
    if [ -f ".claude/mutation-scores.json" ]; then
        echo "Baseline mutation scores found"

        # Extract baseline score for relevant modules
        # This is optional and may be skipped if too time-consuming
        echo "Note: Mutation testing is time-consuming"
        echo "Skipping full mutation test in verification phase"
        echo "Run /increase-mutation-score to verify test quality"

        MUTATION_SCORE_CHECKED=false
    else
        echo "No baseline mutation scores found"
        echo "Run /increase-mutation-score to establish baseline"
        MUTATION_SCORE_CHECKED=false
    fi
else
    echo "mutmut not available (install with: pip install mutmut)"
    echo "Mutation testing skipped"
    MUTATION_SCORE_CHECKED=false
fi
```

### Step 4: Generate Verification Report

```bash
echo ""
echo "Generating verification report..."

# Overall verification status
VERIFICATION_SUCCESS=true

if [ "$TESTS_PASS" != "true" ]; then
    VERIFICATION_SUCCESS=false
fi

if [ "$COVERAGE_MAINTAINED" != "true" ]; then
    echo "WARNING: Coverage regression detected"
    # Not fatal, but should be noted
fi

# Create verification results
cat > "$RUN_DIR/final-verification.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "iterations_completed": $LOOP_INDEX,
  "baseline": {
    "tests": $TESTS_BASELINE,
    "coverage": $COVERAGE_BASELINE
  },
  "final": {
    "tests": $CURRENT_TEST_COUNT,
    "coverage": $FINAL_COVERAGE
  },
  "changes": {
    "tests_reduced": $TOTAL_REDUCTION,
    "reduction_percentage": $(awk "BEGIN {print ($TOTAL_REDUCTION / $TESTS_BASELINE) * 100}"),
    "coverage_diff": $COVERAGE_DIFF
  },
  "verification": {
    "tests_pass": $TESTS_PASS,
    "coverage_maintained": $COVERAGE_MAINTAINED,
    "mutation_score_checked": $MUTATION_SCORE_CHECKED,
    "overall_success": $VERIFICATION_SUCCESS
  },
  "test_log_path": "$TEST_LOG"
}
EOF

echo "Verification report saved to $RUN_DIR/final-verification.json"
```

### Step 5: Display Summary

```bash
echo ""
echo "=== Verification Summary ==="
echo ""
echo "Consolidation Results:"
echo "  Iterations: $LOOP_INDEX"
echo "  Tests reduced: $TOTAL_REDUCTION (${TESTS_BASELINE} → ${CURRENT_TEST_COUNT})"
echo "  Coverage: ${COVERAGE_BASELINE}% → ${FINAL_COVERAGE}%"
echo ""
echo "Verification Status:"
echo "  Tests passing: $([ "$TESTS_PASS" = "true" ] && echo "✅ YES" || echo "❌ NO")"
echo "  Coverage maintained: $([ "$COVERAGE_MAINTAINED" = "true" ] && echo "✅ YES" || echo "⚠️  NO")"
echo "  Mutation score checked: $([ "$MUTATION_SCORE_CHECKED" = "true" ] && echo "✅ YES" || echo "⏭️  SKIPPED")"
echo ""

if [ "$VERIFICATION_SUCCESS" = "true" ]; then
    echo "✅ Verification PASSED"
    echo ""
    echo "Consolidation was successful. Proceed to Phase 4 for final report."
else
    echo "❌ Verification FAILED"
    echo ""
    echo "Some checks did not pass. Review the issues above."
    echo ""
    echo "Recommended actions:"
    echo "  1. Review test failures in: $TEST_LOG"
    echo "  2. Check git diff: git diff HEAD tests/"
    echo "  3. Consider reverting: git checkout HEAD tests/"
fi
```

### Step 6: Export Parameters

```bash
echo ""
echo "Exporting verification parameters..."

echo "TESTS_PASS=$TESTS_PASS"
echo "COVERAGE_MAINTAINED=$COVERAGE_MAINTAINED"
echo "MUTATION_SCORE_CHECKED=$MUTATION_SCORE_CHECKED"
echo "VERIFICATION_SUCCESS=$VERIFICATION_SUCCESS"
echo "FINAL_COVERAGE=$FINAL_COVERAGE"
echo "COVERAGE_DIFF=$COVERAGE_DIFF"
```

## Outputs

This phase creates:

1. **$RUN_DIR/final-verification.json**: Verification results
2. **$RUN_DIR/test-verification.log**: Full test output

This phase exports:

- TESTS_PASS: Whether all tests pass (boolean)
- COVERAGE_MAINTAINED: Whether coverage maintained (boolean)
- MUTATION_SCORE_CHECKED: Whether mutation testing ran (boolean)
- VERIFICATION_SUCCESS: Overall verification status (boolean)
- FINAL_COVERAGE: Final coverage percentage (number)
- COVERAGE_DIFF: Coverage change (number)

## Success Criteria

- [ ] Full test suite executed
- [ ] Test results captured in log file
- [ ] Coverage measured and compared to baseline
- [ ] Mutation score checked (if available)
- [ ] Verification report generated
- [ ] Verification status exported

## Error Handling

### Tests fail
**Symptom**: pytest returns non-zero exit code
**Solution**: Review test-verification.log for failures
**Action**: Set VERIFICATION_SUCCESS=false, continue to Phase 4

### Cannot measure coverage
**Symptom**: Coverage output not found in log
**Solution**: Use CURRENT_COVERAGE from Phase 2
**Action**: Log warning, continue

### Coverage regressed significantly
**Symptom**: COVERAGE_DIFF < -1.0
**Solution**: Review consolidation changes
**Action**: Set COVERAGE_MAINTAINED=false, warn in report

### mutmut not available
**Symptom**: Command not found
**Solution**: Skip mutation testing
**Action**: Set MUTATION_SCORE_CHECKED=false, continue

## Notes

This phase runs comprehensive verification but does not FAIL the workflow if coverage regressed slightly. The goal is to provide complete information in Phase 4 for the user to decide whether to keep or revert changes.

Mutation testing is intentionally skipped in verification because it's time-consuming. Users should run /increase-mutation-score separately to verify test quality after consolidation.
