---
phase_metadata:
  inputs:
    files:
      - name: BASELINE_FILE
        path: "$OUTPUT_DIR/run-*/consolidation-baseline.json"
        required: true
        description: Baseline from Phase 0
      - name: INITIAL_ANALYSIS
        path: "$OUTPUT_DIR/run-*/initial-analysis.json"
        required: true
        description: Initial analysis from Phase 1
      - name: VERIFICATION_FILE
        path: "$OUTPUT_DIR/run-*/final-verification.json"
        required: true
        description: Verification results from Phase 3

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
        description: Final test count
      - name: FINAL_COVERAGE
        required: true
        type: number
        description: Final coverage
      - name: TOTAL_REDUCTION
        required: true
        type: integer
        description: Total tests reduced
      - name: LOOP_INDEX
        required: true
        type: integer
        description: Iterations completed
      - name: VERIFICATION_SUCCESS
        required: true
        type: boolean
        description: Whether verification passed
      - name: TESTS_PASS
        required: true
        type: boolean
        description: Whether tests pass
      - name: COVERAGE_MAINTAINED
        required: true
        type: boolean
        description: Whether coverage maintained

  outputs:
    files:
      - path: "$OUTPUT_DIR/run-*/FINAL-REPORT.md"
        description: Comprehensive final report
        required: true
      - path: "$OUTPUT_DIR/run-*/iteration-summary.json"
        description: Aggregated iteration data
        required: true
      - path: "$OUTPUT_DIR/run-*/recommendations.md"
        description: Next steps and recommendations
        required: true

    parameters:
      - name: WORKFLOW_SUCCESS
        type: boolean
        description: Overall workflow success
        required: true
      - name: REPORT_PATH
        type: string
        description: Path to final report
        required: true
---

# Phase 4: Final Report

**Purpose**: Generate comprehensive final report aggregating all iteration results and providing recommendations.

## Prerequisites

- All iterations completed
- Verification completed (Phase 3)
- All iteration reports available

## Tasks for Todo List

1. Load all iteration reports
2. Aggregate metrics across iterations
3. Calculate ROI and efficiency metrics
4. Generate iteration comparison table
5. Document changes made
6. Provide recommendations for next steps
7. Create human-readable final report
8. Update consolidation history
9. Display summary to user

## Parameters Used

### Inputs
- TESTS_BASELINE, COVERAGE_BASELINE: Initial state
- CURRENT_TEST_COUNT, FINAL_COVERAGE: Final state
- TOTAL_REDUCTION: Cumulative reduction
- LOOP_INDEX: Number of iterations
- VERIFICATION_SUCCESS, TESTS_PASS, COVERAGE_MAINTAINED: Verification status

### Outputs
- WORKFLOW_SUCCESS: Overall workflow success (boolean)
- REPORT_PATH: Path to final report (string)

## Process

### Step 1: Load All Iteration Reports

Collect data from all iteration reports:

```bash
echo "=== Generating Final Report ==="
echo ""
echo "Loading iteration reports..."

# Array to store iteration data
ITERATION_DATA="[]"

for i in $(seq 1 $LOOP_INDEX); do
    ITER_FILE="$RUN_DIR/iteration-${i}-report.json"

    if [ -f "$ITER_FILE" ]; then
        # Append iteration data to array
        ITER_JSON=$(cat "$ITER_FILE")
        ITERATION_DATA=$(echo "$ITERATION_DATA" | jq ". += [$ITER_JSON]")
        echo "  Loaded iteration $i"
    else
        echo "  WARNING: Missing iteration $i report"
    fi
done

echo "Loaded $LOOP_INDEX iteration reports"
```

### Step 2: Calculate Aggregate Metrics

```bash
echo ""
echo "Calculating aggregate metrics..."

# Total consolidations applied
TOTAL_CONSOLIDATIONS=$(echo "$ITERATION_DATA" | jq '[.[].changes.consolidations_applied] | add')

# Total files modified (estimate)
TOTAL_FILES_MODIFIED=$(echo "$ITERATION_DATA" | jq 'length * 8')  # Rough estimate

# Average tests reduced per iteration
AVG_TESTS_PER_ITER=$(awk "BEGIN {print $TOTAL_REDUCTION / $LOOP_INDEX}")

# ROI calculation (value / effort)
# Value = tests reduced * 10 (saved maintenance cost)
# Effort = files modified + (consolidations * 0.5)
VALUE_SCORE=$((TOTAL_REDUCTION * 10))
EFFORT_SCORE=$(echo "$TOTAL_FILES_MODIFIED + ($TOTAL_CONSOLIDATIONS * 0.5)" | bc)
ROI_SCORE=$(awk "BEGIN {print $VALUE_SCORE / $EFFORT_SCORE}")

echo "Aggregate metrics:"
echo "  Total consolidations: $TOTAL_CONSOLIDATIONS"
echo "  Estimated files modified: $TOTAL_FILES_MODIFIED"
echo "  Average reduction per iteration: $AVG_TESTS_PER_ITER"
echo "  ROI score: $ROI_SCORE"

# Determine workflow success
WORKFLOW_SUCCESS=true

if [ "$VERIFICATION_SUCCESS" != "true" ]; then
    WORKFLOW_SUCCESS=false
fi

if [ $LOOP_INDEX -eq 0 ]; then
    WORKFLOW_SUCCESS=false
fi

echo ""
echo "Workflow success: $WORKFLOW_SUCCESS"
```

### Step 3: Generate Iteration Comparison Table

Create iteration-summary.json:

```bash
cat > "$RUN_DIR/iteration-summary.json" <<EOF
{
  "workflow_run": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "iterations_completed": $LOOP_INDEX,
    "workflow_success": $WORKFLOW_SUCCESS
  },
  "baseline": {
    "tests": $TESTS_BASELINE,
    "coverage": $COVERAGE_BASELINE
  },
  "final": {
    "tests": $CURRENT_TEST_COUNT,
    "coverage": $FINAL_COVERAGE
  },
  "cumulative": {
    "tests_reduced": $TOTAL_REDUCTION,
    "reduction_percentage": $(awk "BEGIN {print ($TOTAL_REDUCTION / $TESTS_BASELINE) * 100}"),
    "coverage_diff": $(awk "BEGIN {print $FINAL_COVERAGE - $COVERAGE_BASELINE}"),
    "consolidations_applied": $TOTAL_CONSOLIDATIONS,
    "estimated_files_modified": $TOTAL_FILES_MODIFIED,
    "roi_score": $ROI_SCORE
  },
  "iterations": $ITERATION_DATA,
  "verification": {
    "tests_pass": $TESTS_PASS,
    "coverage_maintained": $COVERAGE_MAINTAINED,
    "overall_success": $VERIFICATION_SUCCESS
  }
}
EOF

echo "Iteration summary saved to $RUN_DIR/iteration-summary.json"
```

### Step 4: Generate Final Report

Create comprehensive FINAL-REPORT.md:

```bash
REPORT_PATH="$RUN_DIR/FINAL-REPORT.md"

cat > "$REPORT_PATH" <<'REPORT_EOF'
# Test Consolidation Loop - Final Report

**Date**: $(date)
**Workflow**: consolidate-tests-loop
**Iterations**: $LOOP_INDEX

---

## Executive Summary

This workflow iteratively consolidated the test suite until diminishing returns were detected.

### Results at a Glance

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Test Count** | $TESTS_BASELINE | $CURRENT_TEST_COUNT | -$TOTAL_REDUCTION ($(awk "BEGIN {printf \"%.1f\", ($TOTAL_REDUCTION / $TESTS_BASELINE) * 100}")%) |
| **Coverage** | ${COVERAGE_BASELINE}% | ${FINAL_COVERAGE}% | $(awk "BEGIN {printf \"%+.1f\", $FINAL_COVERAGE - $COVERAGE_BASELINE}")% |
| **Iterations** | N/A | $LOOP_INDEX | N/A |

### Outcome

$(if [ "$WORKFLOW_SUCCESS" = "true" ]; then
    echo "✅ **SUCCESS** - Consolidation completed successfully"
else
    echo "⚠️ **PARTIAL SUCCESS** - Some issues detected (see details below)"
fi)

---

## Detailed Results

### Iteration Breakdown

REPORT_EOF

# Add iteration table
cat >> "$REPORT_PATH" <<'TABLE_EOF'
| Iteration | Tests Before | Tests After | Reduced | Reduction % | Opportunities Remaining |
|-----------|--------------|-------------|---------|-------------|-------------------------|
TABLE_EOF

# Populate iteration rows
for i in $(seq 1 $LOOP_INDEX); do
    ITER_FILE="$RUN_DIR/iteration-${i}-report.json"
    if [ -f "$ITER_FILE" ]; then
        BEFORE=$(jq -r '.before.tests' "$ITER_FILE")
        AFTER=$(jq -r '.after.tests' "$ITER_FILE")
        REDUCED=$(jq -r '.changes.tests_reduced' "$ITER_FILE")
        REDUCTION_PCT=$(jq -r '.changes.reduction_percentage' "$ITER_FILE")
        REMAINING=$(jq -r '.remaining.opportunities' "$ITER_FILE")

        echo "| $i | $BEFORE | $AFTER | $REDUCED | ${REDUCTION_PCT}% | $REMAINING |" >> "$REPORT_PATH"
    fi
done

cat >> "$REPORT_PATH" <<'REPORT_EOF'

### Consolidation Metrics

- **Total Consolidations Applied**: $TOTAL_CONSOLIDATIONS
- **Estimated Files Modified**: $TOTAL_FILES_MODIFIED
- **Average Reduction per Iteration**: $(printf "%.1f" $AVG_TESTS_PER_ITER) tests
- **ROI Score**: $(printf "%.2f" $ROI_SCORE)

### Loop Exit Reason

The loop stopped after iteration $LOOP_INDEX because:

$(cat "$RUN_DIR/iteration-${LOOP_INDEX}-report.json" | jq -r '.decision.reason')

---

## Verification Results

### Test Suite Health

| Check | Status | Details |
|-------|--------|---------|
| **Tests Passing** | $([ "$TESTS_PASS" = "true" ] && echo "✅ PASS" || echo "❌ FAIL") | All tests executed successfully |
| **Coverage Maintained** | $([ "$COVERAGE_MAINTAINED" = "true" ] && echo "✅ PASS" || echo "⚠️ WARNING") | Coverage: ${COVERAGE_BASELINE}% → ${FINAL_COVERAGE}% |
| **Overall Verification** | $([ "$VERIFICATION_SUCCESS" = "true" ] && echo "✅ PASS" || echo "⚠️ WARNING") | $([ "$VERIFICATION_SUCCESS" = "true" ] && echo "No regressions detected" || echo "Review verification log") |

### Files Changed

Review changes with:
\`\`\`bash
git diff HEAD tests/
\`\`\`

View full test log:
\`\`\`bash
cat $RUN_DIR/test-verification.log
\`\`\`

---

## Recommendations

### Immediate Next Steps

REPORT_EOF

if [ "$WORKFLOW_SUCCESS" = "true" ]; then
    cat >> "$REPORT_PATH" <<'REC_EOF'
1. **Review Changes**
   \`\`\`bash
   git diff HEAD tests/
   \`\`\`

2. **Commit Changes** (if satisfied)
   \`\`\`bash
   git add tests/
   git commit -m "Consolidate tests: reduced $TOTAL_REDUCTION tests across $LOOP_INDEX iterations

   - Test count: $TESTS_BASELINE → $CURRENT_TEST_COUNT (-$(awk "BEGIN {printf \"%.1f\", ($TOTAL_REDUCTION / $TESTS_BASELINE) * 100}")%)
   - Coverage: ${COVERAGE_BASELINE}% → ${FINAL_COVERAGE}%
   - Consolidations applied: $TOTAL_CONSOLIDATIONS
   - ROI score: $(printf "%.2f" $ROI_SCORE)

   Generated by /consolidate-tests-loop workflow
   "
   \`\`\`

3. **Push to Remote** (if working on feature branch)
   \`\`\`bash
   git push origin $(git branch --show-current)
   \`\`\`
REC_EOF
else
    cat >> "$REPORT_PATH" <<'REC_EOF'
1. **Review Issues**
   - Check verification log: \`cat $RUN_DIR/test-verification.log\`
   - Review failed tests or coverage regressions

2. **Decide: Keep or Revert**

   **Option A: Keep Changes** (if issues are minor)
   \`\`\`bash
   # Fix issues manually
   pytest tests/ -v
   # Then commit
   git add tests/
   git commit -m "Consolidate tests (with fixes)"
   \`\`\`

   **Option B: Revert Changes** (if issues are significant)
   \`\`\`bash
   git checkout HEAD tests/
   \`\`\`

3. **Address Root Causes**
   - If tests failed: Investigate why consolidation broke them
   - If coverage dropped: Identify missing test coverage
REC_EOF
fi

cat >> "$REPORT_PATH" <<'REPORT_EOF'

### Future Maintenance

1. **Run Periodically** - Re-run this workflow after adding 50+ new tests
2. **Monitor Quality** - Use \`/increase-coverage\` to maintain coverage
3. **Verify Effectiveness** - Use \`/increase-mutation-score\` to check test quality
4. **Update Guidelines** - Ensure new tests follow parameterization guidelines

### Test Quality Best Practices

Going forward, maintain test quality by:

- ✅ **Parameterize similar tests** (3+ variations → use @pytest.mark.parametrize)
- ✅ **Document all tests** (docstrings with Given/When/Then)
- ✅ **Strong assertions** (avoid `assert x is not None` alone)
- ✅ **Organize by behavior** (not CRUD operations)
- ✅ **Review before merging** (check for consolidation opportunities)

---

## Artifacts Generated

All workflow artifacts are in: \`$RUN_DIR/\`

### Key Files

1. **consolidation-baseline.json** - Initial state
2. **initial-analysis.json** - Phase 1 analysis
3. **iteration-N-report.json** - Per-iteration results (N = 1..$LOOP_INDEX)
4. **final-verification.json** - Verification results
5. **iteration-summary.json** - Aggregated data
6. **FINAL-REPORT.md** - This report
7. **test-verification.log** - Full test output

### Consolidation History

The consolidation history has been updated at:
\`.claude/test-consolidation-history.json\`

This history is used for diminishing returns detection in future runs.

---

## Appendix: Workflow Configuration

**Parameters Used:**
- MAX_ITERATIONS: $(echo "$MAX_ITERATIONS" || echo "10")
- MIN_OPPORTUNITIES: $(echo "$MIN_OPPORTUNITIES" || echo "5")
- MIN_REDUCTION_PCT: $(echo "$MIN_REDUCTION_PCT" || echo "3.0")%
- BACKEND_ONLY: $(echo "$BACKEND_ONLY" || echo "false")
- FRONTEND_ONLY: $(echo "$FRONTEND_ONLY" || echo "false")
- DRY_RUN: $(echo "$DRY_RUN" || echo "false")

**Git Information:**
- Branch: $(git branch --show-current 2>/dev/null || echo "unknown")
- Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

---

**Report Generated**: $(date -u +%Y-%m-%dT%H:%M:%SZ)

REPORT_EOF

echo "Final report generated: $REPORT_PATH"
```

### Step 5: Generate Recommendations

Create standalone recommendations file:

```bash
cat > "$RUN_DIR/recommendations.md" <<'REC_EOF'
# Next Steps & Recommendations

Based on the consolidation results, here are recommended next steps:

## Quality Improvements

$(if [ $LOOP_INDEX -gt 0 ]; then
    echo "✅ Test consolidation completed successfully"
    echo ""
    echo "### Maintain Quality"
    echo "1. Run \`/increase-coverage\` to improve coverage to 60%+"
    echo "2. Run \`/increase-mutation-score\` to verify test effectiveness"
    echo "3. Add pre-commit hook to enforce test quality standards"
else
    echo "⚠️ No iterations completed"
    echo ""
    echo "### Possible Reasons"
    echo "1. Test suite already well-optimized"
    echo "2. Insufficient consolidation opportunities"
    echo "3. Diminishing returns threshold too strict"
fi)

## Workflow Re-runs

Run this workflow again when:
- You've added 50+ new tests
- Test count increases by 10%+
- Test suite structure changes significantly

## Alternative Improvements

If consolidation has reached diminishing returns:

1. **Focus on Coverage**
   \`\`\`bash
   /increase-coverage --tier=critical
   \`\`\`

2. **Verify Test Quality**
   \`\`\`bash
   /increase-mutation-score --tier=critical
   \`\`\`

3. **Address Documentation**
   - Add docstrings to undocumented tests
   - Improve test organization
   - Extract common fixtures

## Long-term Maintenance

- **Monthly**: Review test suite health metrics
- **Quarterly**: Run consolidation workflow
- **Per PR**: Enforce test quality in code reviews

REC_EOF

echo "Recommendations saved to $RUN_DIR/recommendations.md"
```

### Step 6: Update Consolidation History

Update the project-wide history file:

```bash
echo ""
echo "Updating consolidation history..."

HISTORY_FILE=".claude/test-consolidation-history.json"

# Create new run entry
NEW_RUN=$(cat <<EOF
{
  "date": "$(date -u +%Y-%m-%d)",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "workflow": "consolidate-tests-loop",
  "iterations": $LOOP_INDEX,
  "tests_before": $TESTS_BASELINE,
  "tests_after": $CURRENT_TEST_COUNT,
  "tests_reduced": $TOTAL_REDUCTION,
  "coverage_before": $COVERAGE_BASELINE,
  "coverage_after": $FINAL_COVERAGE,
  "files_modified": $TOTAL_FILES_MODIFIED,
  "consolidations_applied": $TOTAL_CONSOLIDATIONS,
  "reduction_rate": $(awk "BEGIN {print $TOTAL_REDUCTION / $TESTS_BASELINE}"),
  "roi_score": $ROI_SCORE,
  "success": $WORKFLOW_SUCCESS,
  "report_path": "$REPORT_PATH"
}
EOF
)

# Append to history
if [ -f "$HISTORY_FILE" ]; then
    jq ".runs += [$NEW_RUN]" "$HISTORY_FILE" > "${HISTORY_FILE}.tmp"
    mv "${HISTORY_FILE}.tmp" "$HISTORY_FILE"
else
    echo "{\"runs\": [$NEW_RUN]}" > "$HISTORY_FILE"
fi

echo "History updated: $HISTORY_FILE"
```

### Step 7: Display Summary

```bash
echo ""
echo "================================================================"
echo "           TEST CONSOLIDATION LOOP - FINAL SUMMARY"
echo "================================================================"
echo ""
echo "Iterations Completed: $LOOP_INDEX"
echo ""
echo "Results:"
echo "  Tests: $TESTS_BASELINE → $CURRENT_TEST_COUNT (-$TOTAL_REDUCTION)"
echo "  Coverage: ${COVERAGE_BASELINE}% → ${FINAL_COVERAGE}%"
echo "  ROI Score: $(printf "%.2f" $ROI_SCORE)"
echo ""
echo "Verification:"
echo "  Tests Pass: $([ "$TESTS_PASS" = "true" ] && echo "✅" || echo "❌")"
echo "  Coverage Maintained: $([ "$COVERAGE_MAINTAINED" = "true" ] && echo "✅" || echo "⚠️")"
echo "  Overall: $([ "$VERIFICATION_SUCCESS" = "true" ] && echo "✅ SUCCESS" || echo "⚠️ WARNING")"
echo ""
echo "Report: $REPORT_PATH"
echo ""
echo "================================================================"
echo ""

if [ "$WORKFLOW_SUCCESS" = "true" ]; then
    echo "✅ Workflow completed successfully"
    echo ""
    echo "Next steps:"
    echo "  1. Review report: cat $REPORT_PATH"
    echo "  2. Review changes: git diff HEAD tests/"
    echo "  3. Commit changes: git add tests/ && git commit"
else
    echo "⚠️ Workflow completed with warnings"
    echo ""
    echo "Next steps:"
    echo "  1. Review report: cat $REPORT_PATH"
    echo "  2. Check verification: cat $RUN_DIR/test-verification.log"
    echo "  3. Decide: keep or revert changes"
fi

echo ""
```

### Step 8: Export Final Parameters

```bash
echo "WORKFLOW_SUCCESS=$WORKFLOW_SUCCESS"
echo "REPORT_PATH=$REPORT_PATH"
```

## Outputs

This phase creates:

1. **$RUN_DIR/FINAL-REPORT.md**: Comprehensive final report
2. **$RUN_DIR/iteration-summary.json**: Aggregated iteration data
3. **$RUN_DIR/recommendations.md**: Next steps and recommendations

This phase updates:

- **.claude/test-consolidation-history.json**: Project-wide consolidation history

This phase exports:

- WORKFLOW_SUCCESS: Overall workflow success (boolean)
- REPORT_PATH: Path to final report (string)

## Success Criteria

- [ ] All iteration reports loaded successfully
- [ ] Aggregate metrics calculated
- [ ] Final report generated with complete data
- [ ] Recommendations provided
- [ ] Consolidation history updated
- [ ] Summary displayed to user

## Error Handling

### Missing iteration reports
**Symptom**: Iteration report files not found
**Solution**: Generate report with available data
**Action**: Log warning, continue with partial data

### Cannot update history
**Symptom**: Permission denied on .claude/test-consolidation-history.json
**Solution**: Save history to run directory instead
**Action**: Log warning, continue

### Report generation fails
**Symptom**: Cannot write FINAL-REPORT.md
**Solution**: Check RUN_DIR permissions
**Action**: FAIL phase (report is critical output)

## Notes

This is the final phase of the workflow. The report should provide:
- Complete data on all iterations
- Clear recommendations for next steps
- Easy access to all artifacts
- Actionable insights for maintaining test quality

The report is designed to be human-readable and suitable for including in PR descriptions or documentation.
