---
phase_metadata:
  inputs:
    files:
      - name: ANALYSIS_FILE
        path: "$OUTPUT_DIR/run-*/initial-analysis.json"
        required: true
        description: Initial analysis from Phase 1

    parameters:
      - name: LOOP_INDEX
        required: true
        type: integer
        description: Current loop iteration (auto-injected)
      - name: LOOP_NAME
        required: true
        type: string
        description: Loop identifier (auto-injected)
      - name: SHOULD_PROCEED
        required: true
        type: boolean
        description: Whether Phase 1 approved proceeding
      - name: TOTAL_OPPORTUNITIES
        required: true
        type: integer
        description: Opportunities from Phase 1
      - name: TESTS_BASELINE
        required: true
        type: integer
        description: Initial test count
      - name: COVERAGE_BASELINE
        required: true
        type: number
        description: Initial coverage
      - name: MIN_OPPORTUNITIES
        required: false
        default: 5
        type: integer
        description: Minimum opportunities to continue
      - name: MIN_REDUCTION_PCT
        required: false
        default: 3.0
        type: number
        description: Minimum reduction percentage
      - name: DRY_RUN
        required: false
        default: false
        type: boolean
        description: Analyze only mode
      - name: BACKEND_ONLY
        required: false
        default: false
        type: boolean
        description: Backend only flag
      - name: FRONTEND_ONLY
        required: false
        default: false
        type: boolean
        description: Frontend only flag

  outputs:
    files:
      - path: "$OUTPUT_DIR/run-*/iteration-$LOOP_INDEX-report.json"
        description: Consolidation results for this iteration
        required: true
      - path: "$OUTPUT_DIR/run-*/iteration-$LOOP_INDEX-summary.md"
        description: Human-readable iteration summary
        required: true

    parameters:
      - name: LOOP_CONTINUE
        type: boolean
        description: Whether to continue looping (controls loop)
        required: true
      - name: LOOP_REASON
        type: string
        description: Reason for continue/stop decision
        required: true
      - name: ITERATION_TESTS_REDUCED
        type: integer
        description: Tests reduced in this iteration
        required: true
      - name: CURRENT_TEST_COUNT
        type: integer
        description: Test count after this iteration
        required: true
      - name: CURRENT_COVERAGE
        type: number
        description: Coverage after this iteration
        required: true
      - name: REMAINING_OPPORTUNITIES
        type: integer
        description: Opportunities remaining after iteration
        required: true
---

# Phase 2: Consolidation Loop

**Purpose**: Execute one iteration of test consolidation, verify results, and decide whether to continue.

## Prerequisites

- Phase 1 approved proceeding (SHOULD_PROCEED=true)
- Test suite is in good state
- Git repository allows changes

## Tasks for Todo List

1. Log iteration start
2. Run /consolidate-tests command (or --analyze-only if DRY_RUN)
3. Capture consolidation results
4. Verify tests still pass
5. Measure new test count
6. Measure new coverage
7. Analyze remaining opportunities
8. Calculate reduction metrics
9. Apply loop continuation decision matrix
10. Save iteration results
11. Export LOOP_CONTINUE parameter

## Parameters Used

### Inputs (Auto-injected)
- LOOP_INDEX: Current iteration number (1, 2, 3, ...)
- LOOP_NAME: Loop identifier ("consolidation-loop")

### Inputs (From Phase 1)
- SHOULD_PROCEED: Whether to proceed
- TOTAL_OPPORTUNITIES: Initial opportunities
- TESTS_BASELINE: Initial test count
- COVERAGE_BASELINE: Initial coverage

### Inputs (Configuration)
- MIN_OPPORTUNITIES: Threshold for continuing
- MIN_REDUCTION_PCT: Minimum reduction to continue
- DRY_RUN: Whether to make actual changes
- BACKEND_ONLY, FRONTEND_ONLY: Scope flags

### Outputs (Loop Control)
- LOOP_CONTINUE: Boolean controlling whether loop continues
- LOOP_REASON: Explanation for the decision
- ITERATION_TESTS_REDUCED: Tests reduced in this iteration
- CURRENT_TEST_COUNT: Current test count
- CURRENT_COVERAGE: Current coverage
- REMAINING_OPPORTUNITIES: Opportunities left

## Process

### Step 1: Check Phase 1 Approval

Verify Phase 1 approved proceeding:

```bash
echo "=== Consolidation Loop Iteration $LOOP_INDEX ==="
echo ""

if [ "$SHOULD_PROCEED" != "true" ]; then
    echo "ERROR: Phase 1 did not approve proceeding"
    echo "Reason: Initial analysis indicated diminishing returns"
    echo ""
    echo "LOOP_CONTINUE: false"
    echo "LOOP_REASON: Phase 1 blocked consolidation"
    exit 1
fi

echo "Phase 1 approved proceeding with consolidation"
echo "Initial opportunities: $TOTAL_OPPORTUNITIES"
echo ""
```

### Step 2: Run /consolidate-tests Command

Execute the consolidation command via SlashCommand tool:

```markdown
The phase-executor agent should invoke the /consolidate-tests command using the SlashCommand tool:

```yaml
# If DRY_RUN=true
command: "/consolidate-tests --analyze-only"

# If BACKEND_ONLY=true
command: "/consolidate-tests --backend-only"

# If FRONTEND_ONLY=true
command: "/consolidate-tests --frontend-only"

# Default
command: "/consolidate-tests"
```

The command will:
1. Analyze test suite for consolidation opportunities
2. Apply consolidations (unless --analyze-only)
3. Generate a report
4. Update .claude/test-consolidation-history.json

Capture the command output and parse the results.
```

### Step 3: Capture Results

Parse the consolidation command output:

```bash
# After command completes, read the updated history
HISTORY_FILE=".claude/test-consolidation-history.json"

if [ ! -f "$HISTORY_FILE" ]; then
    echo "WARNING: History file not found, consolidation may have failed"
    ITERATION_TESTS_REDUCED=0
    CONSOLIDATIONS_APPLIED=0
else
    # Get latest run from history
    LATEST_RUN=$(jq '.runs[-1]' "$HISTORY_FILE")

    # Extract metrics
    TESTS_BEFORE=$(echo "$LATEST_RUN" | jq -r '.tests_before')
    TESTS_AFTER=$(echo "$LATEST_RUN" | jq -r '.tests_after')
    ITERATION_TESTS_REDUCED=$(echo "$LATEST_RUN" | jq -r '.tests_reduced')
    CONSOLIDATIONS_APPLIED=$(echo "$LATEST_RUN" | jq -r '.consolidations_applied // 0')

    echo "Consolidation completed:"
    echo "  Tests before: $TESTS_BEFORE"
    echo "  Tests after: $TESTS_AFTER"
    echo "  Tests reduced: $ITERATION_TESTS_REDUCED"
    echo "  Consolidations applied: $CONSOLIDATIONS_APPLIED"
fi
```

### Step 4: Verify Tests Pass

Run pytest to ensure no regressions:

```bash
echo ""
echo "Verifying tests still pass..."

if ! pytest tests/ -v --tb=short; then
    echo ""
    echo "ERROR: Tests failed after consolidation"
    echo "This iteration introduced regressions"
    echo ""
    echo "LOOP_CONTINUE: false"
    echo "LOOP_REASON: Tests failed after consolidation (iteration $LOOP_INDEX)"

    # Suggest rollback
    echo ""
    echo "RECOMMENDED ACTION: Revert changes with git"
    echo "  git diff HEAD tests/"
    echo "  git checkout HEAD tests/"

    exit 1
fi

echo "All tests passed"
```

### Step 5: Measure Current State

Measure test count and coverage after consolidation:

```bash
echo ""
echo "Measuring current state..."

# Current test count
CURRENT_TEST_COUNT=$(pytest tests/ --collect-only -q 2>/dev/null | tail -1 | grep -oE '[0-9]+ test' | awk '{print $1}')

if [ -z "$CURRENT_TEST_COUNT" ]; then
    echo "ERROR: Could not measure test count"
    CURRENT_TEST_COUNT=$TESTS_BEFORE  # Use pre-consolidation count
fi

# Current coverage
COVERAGE_OUTPUT=$(pytest tests/ --cov=telegram_claude_bot --cov-report=term-missing -q 2>&1 | grep "TOTAL")
CURRENT_COVERAGE=$(echo "$COVERAGE_OUTPUT" | awk '{print $NF}' | sed 's/%//')

if [ -z "$CURRENT_COVERAGE" ]; then
    echo "WARNING: Could not measure coverage"
    CURRENT_COVERAGE=$COVERAGE_BASELINE
fi

echo "Current state:"
echo "  Test count: $CURRENT_TEST_COUNT"
echo "  Coverage: ${CURRENT_COVERAGE}%"

# Calculate total reduction from baseline
TOTAL_REDUCTION=$((TESTS_BASELINE - CURRENT_TEST_COUNT))
TOTAL_REDUCTION_PCT=$(awk "BEGIN {print ($TOTAL_REDUCTION / $TESTS_BASELINE) * 100}")

echo "Cumulative:"
echo "  Total reduced: $TOTAL_REDUCTION tests (${TOTAL_REDUCTION_PCT}%)"
```

### Step 6: Analyze Remaining Opportunities

Re-run the analysis heuristics to find remaining opportunities:

```bash
echo ""
echo "Analyzing remaining opportunities..."

# Re-run analysis (simplified version of Phase 1)
EXACT_DUPES=$(grep -rh "def test_" tests/ --include="*.py" | sort | uniq -d | wc -l)

NUMERIC_PATTERN=$(grep -rh "def test_" tests/ --include="*.py" | \
    sed 's/def test_//' | sed 's/_[0-9]\+$//' | \
    sort | uniq -c | awk '$1 >= 3 {print}' | wc -l)

VARIATION_PATTERN=$(grep -rh "def test_" tests/ --include="*.py" | \
    sed 's/def test_//' | \
    sed -E 's/_(empty|none|null|invalid|valid|true|false|with_.*|without_.*|when_.*|success|failure|error)$//' | \
    sort | uniq -c | awk '$1 >= 3 {print}' | wc -l)

SIMILAR_IN_FILE=$(find tests/ -name "*.py" -exec sh -c '
  grep "def test_" "$1" | sed "s/def test_//" | sed "s/(.*$//" | \
  awk "{
    prefix = \$0;
    gsub(/_[^_]*$/, \"\", prefix);
    count[prefix]++;
  }
  END {
    for (p in count) if (count[p] >= 3) total++;
    print total;
  }"
' _ {} \; | awk '{sum+=$1} END {print sum}')

PARAM_CANDIDATES=$((NUMERIC_PATTERN + VARIATION_PATTERN + SIMILAR_IN_FILE))

FRAGMENTED_CLASSES=$(find tests/ -name "*.py" -exec sh -c '
  count=$(grep -c "^class Test" "$1" 2>/dev/null)
  [ "$count" -gt 2 ] && echo "$1"
' _ {} \; | wc -l)

REMAINING_OPPORTUNITIES=$((EXACT_DUPES + PARAM_CANDIDATES + FRAGMENTED_CLASSES))

echo "Remaining opportunities: $REMAINING_OPPORTUNITIES"
echo "  Exact duplicates: $EXACT_DUPES"
echo "  Parameterization candidates: $PARAM_CANDIDATES"
echo "  Fragmented classes: $FRAGMENTED_CLASSES"
```

### Step 7: Loop Continuation Decision

Decide whether to continue or stop:

```bash
echo ""
echo "=== Loop Continuation Decision ==="

LOOP_CONTINUE=false
LOOP_REASON=""

# Rule 1: No changes made (iteration was ineffective)
if [ $ITERATION_TESTS_REDUCED -eq 0 ]; then
    LOOP_CONTINUE=false
    LOOP_REASON="No tests reduced in iteration $LOOP_INDEX (ineffective)"
    echo "Decision: STOP - No progress made"

# Rule 2: Remaining opportunities below threshold
elif [ $REMAINING_OPPORTUNITIES -lt $MIN_OPPORTUNITIES ]; then
    LOOP_CONTINUE=false
    LOOP_REASON="Remaining opportunities ($REMAINING_OPPORTUNITIES) below threshold ($MIN_OPPORTUNITIES)"
    echo "Decision: STOP - Diminishing returns reached"

# Rule 3: Iteration reduction below threshold
else
    ITERATION_REDUCTION_PCT=$(awk "BEGIN {print ($ITERATION_TESTS_REDUCED / $TESTS_BASELINE) * 100}")

    if [ $(echo "$ITERATION_REDUCTION_PCT < $MIN_REDUCTION_PCT" | bc) -eq 1 ]; then
        LOOP_CONTINUE=false
        LOOP_REASON="Iteration reduction (${ITERATION_REDUCTION_PCT}%) below threshold (${MIN_REDUCTION_PCT}%)"
        echo "Decision: STOP - Marginal improvements"

    # Good progress, continue
    else
        LOOP_CONTINUE=true
        LOOP_REASON="Good progress: reduced $ITERATION_TESTS_REDUCED tests, $REMAINING_OPPORTUNITIES opportunities remain"
        echo "Decision: CONTINUE - More consolidation possible"
    fi
fi

echo "Reason: $LOOP_REASON"
echo ""

# Export loop control parameters
echo "LOOP_CONTINUE=$LOOP_CONTINUE"
echo "LOOP_REASON=$LOOP_REASON"
```

### Step 8: Save Iteration Results

```bash
cat > "$RUN_DIR/iteration-${LOOP_INDEX}-report.json" <<EOF
{
  "iteration": $LOOP_INDEX,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "before": {
    "tests": $TESTS_BEFORE,
    "coverage": $([ -n "$TESTS_BEFORE" ] && echo "$COVERAGE_BASELINE" || echo "0.0")
  },
  "after": {
    "tests": $CURRENT_TEST_COUNT,
    "coverage": $CURRENT_COVERAGE
  },
  "changes": {
    "tests_reduced": $ITERATION_TESTS_REDUCED,
    "consolidations_applied": $CONSOLIDATIONS_APPLIED,
    "reduction_percentage": $ITERATION_REDUCTION_PCT
  },
  "cumulative": {
    "total_reduced": $TOTAL_REDUCTION,
    "total_reduction_pct": $TOTAL_REDUCTION_PCT,
    "baseline_tests": $TESTS_BASELINE,
    "baseline_coverage": $COVERAGE_BASELINE
  },
  "remaining": {
    "opportunities": $REMAINING_OPPORTUNITIES,
    "exact_duplicates": $EXACT_DUPES,
    "parameterization_candidates": $PARAM_CANDIDATES,
    "fragmented_classes": $FRAGMENTED_CLASSES
  },
  "decision": {
    "continue_loop": $LOOP_CONTINUE,
    "reason": "$LOOP_REASON"
  }
}
EOF

echo "Iteration report saved to $RUN_DIR/iteration-${LOOP_INDEX}-report.json"
```

### Step 9: Generate Human-Readable Summary

```bash
cat > "$RUN_DIR/iteration-${LOOP_INDEX}-summary.md" <<EOF
# Consolidation Iteration $LOOP_INDEX Summary

**Date**: $(date)
**Loop**: $LOOP_NAME

## Iteration Results

### Before
- Tests: $TESTS_BEFORE
- Coverage: ${COVERAGE_BASELINE}%

### After
- Tests: $CURRENT_TEST_COUNT
- Coverage: ${CURRENT_COVERAGE}%

### Changes
- **Tests Reduced**: $ITERATION_TESTS_REDUCED
- **Consolidations Applied**: $CONSOLIDATIONS_APPLIED
- **Reduction**: ${ITERATION_REDUCTION_PCT}%

## Cumulative Progress

- **Total Iterations**: $LOOP_INDEX
- **Total Tests Reduced**: $TOTAL_REDUCTION (from $TESTS_BASELINE to $CURRENT_TEST_COUNT)
- **Total Reduction**: ${TOTAL_REDUCTION_PCT}%
- **Coverage Change**: ${COVERAGE_BASELINE}% → ${CURRENT_COVERAGE}%

## Remaining Opportunities

- **Total**: $REMAINING_OPPORTUNITIES
- Exact duplicates: $EXACT_DUPES
- Parameterization candidates: $PARAM_CANDIDATES
- Fragmented classes: $FRAGMENTED_CLASSES

## Decision

**Continue Looping?** $([ "$LOOP_CONTINUE" = "true" ] && echo "YES" || echo "NO")

**Reason**: $LOOP_REASON

EOF

if [ "$LOOP_CONTINUE" = "true" ]; then
    cat >> "$RUN_DIR/iteration-${LOOP_INDEX}-summary.md" <<EOF
## Next Steps

Proceeding with iteration $((LOOP_INDEX + 1)). The loop will continue until:
- Remaining opportunities < $MIN_OPPORTUNITIES
- Iteration reduction < ${MIN_REDUCTION_PCT}%
- No progress made in an iteration
- Maximum iterations reached

EOF
else
    cat >> "$RUN_DIR/iteration-${LOOP_INDEX}-summary.md" <<EOF
## Next Steps

Loop complete. Proceeding to Phase 3 (Final Verification) and Phase 4 (Final Report).

EOF
fi

echo "Summary saved to $RUN_DIR/iteration-${LOOP_INDEX}-summary.md"
```

### Step 10: Export Parameters

```bash
# Export all parameters for next iteration or final report
echo "ITERATION_TESTS_REDUCED=$ITERATION_TESTS_REDUCED"
echo "CURRENT_TEST_COUNT=$CURRENT_TEST_COUNT"
echo "CURRENT_COVERAGE=$CURRENT_COVERAGE"
echo "REMAINING_OPPORTUNITIES=$REMAINING_OPPORTUNITIES"
echo "LOOP_CONTINUE=$LOOP_CONTINUE"
echo "LOOP_REASON=$LOOP_REASON"
echo "TOTAL_REDUCTION=$TOTAL_REDUCTION"
echo "TOTAL_REDUCTION_PCT=$TOTAL_REDUCTION_PCT"
```

## Outputs

This phase creates:

1. **$RUN_DIR/iteration-N-report.json**: Detailed iteration results
2. **$RUN_DIR/iteration-N-summary.md**: Human-readable summary

This phase exports:

- LOOP_CONTINUE: Whether to continue looping (boolean) - **CONTROLS LOOP**
- LOOP_REASON: Reason for decision (string)
- ITERATION_TESTS_REDUCED: Tests reduced in this iteration (integer)
- CURRENT_TEST_COUNT: Current test count (integer)
- CURRENT_COVERAGE: Current coverage (number)
- REMAINING_OPPORTUNITIES: Opportunities remaining (integer)
- TOTAL_REDUCTION: Cumulative reduction (integer)
- TOTAL_REDUCTION_PCT: Cumulative reduction percentage (number)

## Success Criteria

- [ ] /consolidate-tests command executed successfully
- [ ] Tests still pass after consolidation
- [ ] Test count and coverage measured
- [ ] Remaining opportunities analyzed
- [ ] Loop continuation decision made and exported
- [ ] Iteration results saved

## Error Handling

### Tests fail after consolidation
**Symptom**: pytest returns non-zero exit code
**Solution**: Suggest git rollback
**Action**: Set LOOP_CONTINUE=false, FAIL phase

### Cannot measure test count
**Symptom**: pytest --collect-only fails
**Solution**: Use pre-consolidation count
**Action**: Log warning, continue

### Consolidation command fails
**Symptom**: /consolidate-tests returns error
**Solution**: Check command output for details
**Action**: Set LOOP_CONTINUE=false, FAIL phase

### Coverage regression
**Symptom**: Coverage dropped by >1%
**Solution**: Review consolidation changes
**Action**: Log warning, continue (not fatal)

## Rollback Plan

If this iteration introduces problems:

1. Review changes: `git diff HEAD tests/`
2. Revert changes: `git checkout HEAD tests/`
3. Re-run tests: `pytest tests/ -v`
4. Set LOOP_CONTINUE=false to exit loop
