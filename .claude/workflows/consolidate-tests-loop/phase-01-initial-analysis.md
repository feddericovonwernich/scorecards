---
phase_metadata:
  inputs:
    files:
      - name: BASELINE_FILE
        path: "$OUTPUT_DIR/run-*/consolidation-baseline.json"
        required: true
        description: Baseline metrics from Phase 0
      - name: HISTORY_FILE
        path: "$OUTPUT_DIR/run-*/history.json"
        required: true
        description: Consolidation history

    parameters:
      - name: TESTS_BASELINE
        required: true
        type: integer
        description: Initial test count
      - name: COVERAGE_BASELINE
        required: true
        type: number
        description: Initial coverage percentage
      - name: FORCE
        required: false
        type: boolean
        description: Skip diminishing returns check
      - name: MIN_OPPORTUNITIES
        required: false
        default: 5
        type: integer
        description: Minimum opportunities to proceed
      - name: MIN_REDUCTION_PCT
        required: false
        default: 3.0
        type: number
        description: Minimum reduction percentage

  outputs:
    files:
      - path: "$OUTPUT_DIR/run-*/initial-analysis.json"
        description: Comprehensive quality analysis results
        required: true
      - path: "$OUTPUT_DIR/run-*/opportunities-report.md"
        description: Human-readable opportunities report
        required: true

    parameters:
      - name: TOTAL_OPPORTUNITIES
        type: integer
        description: Total consolidation opportunities found
        required: true
      - name: SHOULD_PROCEED
        type: boolean
        description: Whether to proceed with consolidation
        required: true
      - name: PROCEED_REASON
        type: string
        description: Reason for proceed/stop decision
        required: true
---

# Phase 1: Initial Analysis

**Purpose**: Run comprehensive quality analysis to identify consolidation opportunities and determine if proceeding is worthwhile.

## Prerequisites

- Baseline metrics established in Phase 0
- Test suite is accessible
- Consolidation history loaded

## Tasks for Todo List

1. Run comprehensive codebase quality analysis
2. Count exact duplicate tests
3. Identify parameterization opportunities (3 heuristics)
4. Detect fragmented test classes
5. Find undocumented tests
6. Identify weak assertions
7. Calculate total opportunities and estimated reduction
8. Apply diminishing returns decision matrix
9. Generate initial analysis report
10. Export decision parameters for loop control

## Parameters Used

### Inputs
- TESTS_BASELINE: Initial test count from Phase 0
- COVERAGE_BASELINE: Initial coverage percentage
- FORCE: Whether to skip diminishing returns check
- MIN_OPPORTUNITIES: Minimum opportunities threshold
- MIN_REDUCTION_PCT: Minimum reduction percentage threshold

### Outputs
- TOTAL_OPPORTUNITIES: Total consolidation opportunities
- SHOULD_PROCEED: Whether to proceed based on analysis
- PROCEED_REASON: Rationale for the decision

## Process

### Step 1: Exact Duplicate Detection

Count tests with identical names (high-confidence consolidation):

```bash
echo "Analyzing for exact duplicates..."

EXACT_DUPES=$(grep -rh "def test_" tests/ --include="*.py" | sort | uniq -d | wc -l)

echo "Exact duplicates found: $EXACT_DUPES"
```

### Step 2: Parameterization Opportunities (3 Heuristics)

Use multiple heuristics to find parameterization candidates:

**Heuristic 1: Numeric Suffixes**
```bash
# Pattern: test_foo_1, test_foo_2, test_foo_3 -> parameterize
NUMERIC_PATTERN=$(grep -rh "def test_" tests/ --include="*.py" | \
    sed 's/def test_//' | \
    sed 's/_[0-9]\+$//' | \
    sort | uniq -c | \
    awk '$1 >= 3 {print}' | \
    wc -l)

echo "Numeric pattern candidates: $NUMERIC_PATTERN"
```

**Heuristic 2: Variation Suffixes**
```bash
# Pattern: test_foo_empty, test_foo_none, test_foo_invalid -> parameterize
VARIATION_PATTERN=$(grep -rh "def test_" tests/ --include="*.py" | \
    sed 's/def test_//' | \
    sed -E 's/_(empty|none|null|invalid|valid|true|false|with_.*|without_.*|when_.*|success|failure|error)$//' | \
    sort | uniq -c | \
    awk '$1 >= 3 {print}' | \
    wc -l)

echo "Variation pattern candidates: $VARIATION_PATTERN"
```

**Heuristic 3: Similar Names in Same File**
```bash
# Find files with 3+ tests sharing a common prefix
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

echo "Similar-in-file candidates: $SIMILAR_IN_FILE"
```

**Total Parameterization Candidates**:
```bash
PARAM_CANDIDATES=$((NUMERIC_PATTERN + VARIATION_PATTERN + SIMILAR_IN_FILE))
echo "Total parameterization candidates: $PARAM_CANDIDATES"
```

### Step 3: Test Structure Quality

Analyze test organization issues:

**Fragmented Test Classes**:
```bash
# Files with more than 2 Test* classes (over-fragmented)
FRAGMENTED_CLASSES=$(find tests/ -name "*.py" -exec sh -c '
  count=$(grep -c "^class Test" "$1" 2>/dev/null)
  [ "$count" -gt 2 ] && echo "$1"
' _ {} \; | wc -l)

echo "Fragmented test files: $FRAGMENTED_CLASSES"
```

**Undocumented Tests**:
```bash
# Tests without docstrings
UNDOCUMENTED_TESTS=$(find tests/ -name "*.py" -exec sh -c '
  awk "/def test_/ {
    getline;
    if (\$0 !~ /\"\"\"/) print FILENAME \":\" NR-1;
  }" "$1"
' _ {} \; | wc -l)

echo "Undocumented tests: $UNDOCUMENTED_TESTS"
```

**Weak Assertions**:
```bash
# Tests with weak assertions (assert True, assert None, etc.)
WEAK_ASSERTIONS=$(grep -rh "assert True\|assert False\|assert None\|assert \[\]" tests/ --include="*.py" | wc -l)

echo "Weak assertions: $WEAK_ASSERTIONS"
```

### Step 4: Calculate Totals

```bash
# Total high-confidence opportunities
TOTAL_OPPORTUNITIES=$((EXACT_DUPES + PARAM_CANDIDATES + FRAGMENTED_CLASSES))

# Quality issues (lower priority)
QUALITY_ISSUES=$((UNDOCUMENTED_TESTS + WEAK_ASSERTIONS))

# Estimated reduction
ESTIMATED_REDUCTION=$(awk "BEGIN {print int($TOTAL_OPPORTUNITIES * 2.5)}")
REDUCTION_PERCENTAGE=$(awk "BEGIN {print ($ESTIMATED_REDUCTION / $TESTS_BASELINE) * 100}")

echo ""
echo "=== Analysis Summary ==="
echo "Total opportunities: $TOTAL_OPPORTUNITIES"
echo "Quality issues: $QUALITY_ISSUES"
echo "Estimated reduction: $ESTIMATED_REDUCTION tests (${REDUCTION_PERCENTAGE}%)"
```

### Step 5: Apply Diminishing Returns Decision Matrix

Use data-driven rules to decide whether to proceed:

```bash
SHOULD_PROCEED=false
PROCEED_REASON=""

# Skip diminishing returns check if FORCE=true
if [ "$FORCE" = "true" ]; then
    SHOULD_PROCEED=true
    PROCEED_REASON="FORCE flag set, skipping diminishing returns check"
    echo "Decision: PROCEED (forced)"

# Rule 1: High-value opportunities
elif [ $TOTAL_OPPORTUNITIES -ge 20 ]; then
    SHOULD_PROCEED=true
    PROCEED_REASON="High opportunity count ($TOTAL_OPPORTUNITIES >= 20)"
    echo "Decision: PROCEED - Significant consolidation potential"

elif [ $EXACT_DUPES -ge 10 ]; then
    SHOULD_PROCEED=true
    PROCEED_REASON="Many exact duplicates ($EXACT_DUPES >= 10)"
    echo "Decision: PROCEED - Quick wins available"

elif [ $(echo "$REDUCTION_PERCENTAGE >= 10" | bc) -eq 1 ]; then
    SHOULD_PROCEED=true
    PROCEED_REASON="High estimated reduction (${REDUCTION_PERCENTAGE}% >= 10%)"
    echo "Decision: PROCEED - High-impact consolidation"

# Rule 2: Medium-value opportunities
elif [ $TOTAL_OPPORTUNITIES -ge 10 ] && [ $(echo "$REDUCTION_PERCENTAGE >= 5" | bc) -eq 1 ]; then
    SHOULD_PROCEED=true
    PROCEED_REASON="Moderate opportunities ($TOTAL_OPPORTUNITIES) with good reduction (${REDUCTION_PERCENTAGE}%)"
    echo "Decision: PROCEED - Moderate value"

elif [ $PARAM_CANDIDATES -ge 15 ]; then
    SHOULD_PROCEED=true
    PROCEED_REASON="Strong parameterization opportunities ($PARAM_CANDIDATES >= 15)"
    echo "Decision: PROCEED - Good parameterization potential"

# Rule 3: Quality-driven opportunities
elif [ $UNDOCUMENTED_TESTS -ge 50 ] && [ $PARAM_CANDIDATES -ge 5 ]; then
    SHOULD_PROCEED=true
    PROCEED_REASON="Quality improvements needed (${UNDOCUMENTED_TESTS} undocumented) plus consolidation"
    echo "Decision: PROCEED - Quality + consolidation"

# Rule 4: Diminishing returns
elif [ $TOTAL_OPPORTUNITIES -lt $MIN_OPPORTUNITIES ]; then
    SHOULD_PROCEED=false
    PROCEED_REASON="Too few opportunities ($TOTAL_OPPORTUNITIES < $MIN_OPPORTUNITIES)"
    echo "Decision: STOP - Diminishing returns detected"

elif [ $(echo "$REDUCTION_PERCENTAGE < $MIN_REDUCTION_PCT" | bc) -eq 1 ]; then
    SHOULD_PROCEED=false
    PROCEED_REASON="Minimal impact (${REDUCTION_PERCENTAGE}% < ${MIN_REDUCTION_PCT}%)"
    echo "Decision: STOP - Minimal reduction potential"

elif [ $EXACT_DUPES -eq 0 ] && [ $PARAM_CANDIDATES -lt 5 ]; then
    SHOULD_PROCEED=false
    PROCEED_REASON="No clear consolidation patterns"
    echo "Decision: STOP - No obvious opportunities"

# Default: Proceed if analysis completed
else
    SHOULD_PROCEED=true
    PROCEED_REASON="Analysis completed, opportunities found ($TOTAL_OPPORTUNITIES)"
    echo "Decision: PROCEED - Worth investigating"
fi

echo ""
echo "Proceed: $SHOULD_PROCEED"
echo "Reason: $PROCEED_REASON"
```

### Step 6: Save Analysis Results

Create initial-analysis.json:

```bash
cat > "$RUN_DIR/initial-analysis.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "baseline": {
    "tests": $TESTS_BASELINE,
    "coverage": $COVERAGE_BASELINE
  },
  "opportunities": {
    "exact_duplicates": $EXACT_DUPES,
    "parameterization": {
      "total": $PARAM_CANDIDATES,
      "numeric_pattern": $NUMERIC_PATTERN,
      "variation_pattern": $VARIATION_PATTERN,
      "similar_in_file": $SIMILAR_IN_FILE
    },
    "fragmented_classes": $FRAGMENTED_CLASSES,
    "total": $TOTAL_OPPORTUNITIES
  },
  "quality_issues": {
    "undocumented_tests": $UNDOCUMENTED_TESTS,
    "weak_assertions": $WEAK_ASSERTIONS,
    "total": $QUALITY_ISSUES
  },
  "estimates": {
    "reduction_tests": $ESTIMATED_REDUCTION,
    "reduction_percentage": $REDUCTION_PERCENTAGE
  },
  "decision": {
    "should_proceed": $SHOULD_PROCEED,
    "reason": "$PROCEED_REASON"
  }
}
EOF

echo "Analysis saved to $RUN_DIR/initial-analysis.json"
```

### Step 7: Generate Human-Readable Report

```bash
cat > "$RUN_DIR/opportunities-report.md" <<EOF
# Test Consolidation Analysis Report

**Date**: $(date)
**Baseline**: $TESTS_BASELINE tests, ${COVERAGE_BASELINE}% coverage

## Opportunities Identified

### High-Confidence Consolidations
- **Exact Duplicates**: $EXACT_DUPES tests
- **Parameterization Candidates**: $PARAM_CANDIDATES tests
  - Numeric patterns: $NUMERIC_PATTERN
  - Variation patterns: $VARIATION_PATTERN
  - Similar names in files: $SIMILAR_IN_FILE
- **Fragmented Classes**: $FRAGMENTED_CLASSES files

**Total High-Confidence**: $TOTAL_OPPORTUNITIES opportunities

### Quality Issues
- **Undocumented Tests**: $UNDOCUMENTED_TESTS tests
- **Weak Assertions**: $WEAK_ASSERTIONS instances

**Total Quality Issues**: $QUALITY_ISSUES items

## Estimated Impact

- **Estimated Reduction**: ~$ESTIMATED_REDUCTION tests
- **Reduction Percentage**: ~${REDUCTION_PERCENTAGE}%

## Decision

**Proceed with consolidation?** $([ "$SHOULD_PROCEED" = "true" ] && echo "YES" || echo "NO")

**Reason**: $PROCEED_REASON

## Next Steps

EOF

if [ "$SHOULD_PROCEED" = "true" ]; then
    cat >> "$RUN_DIR/opportunities-report.md" <<EOF
The analysis indicates sufficient consolidation opportunities. Proceeding with Phase 2 (Consolidation Loop).

### What Phase 2 Will Do:
1. Run /consolidate-tests command
2. Verify tests still pass
3. Check coverage maintained
4. Analyze remaining opportunities
5. Decide whether to continue iterating
EOF
else
    cat >> "$RUN_DIR/opportunities-report.md" <<EOF
The analysis indicates diminishing returns. Test suite appears well-optimized.

### Recommended Alternatives:
1. Focus on improving test coverage (currently ${COVERAGE_BASELINE}%)
2. Address $UNDOCUMENTED_TESTS undocumented tests
3. Strengthen $WEAK_ASSERTIONS weak assertions
4. Consider mutation testing to verify test quality
EOF
fi

echo "Report saved to $RUN_DIR/opportunities-report.md"
```

### Step 8: Export Decision Parameters

```bash
# These parameters control whether Phase 2 runs
echo "TOTAL_OPPORTUNITIES=$TOTAL_OPPORTUNITIES"
echo "SHOULD_PROCEED=$SHOULD_PROCEED"
echo "PROCEED_REASON=$PROCEED_REASON"
echo "EXACT_DUPES=$EXACT_DUPES"
echo "PARAM_CANDIDATES=$PARAM_CANDIDATES"
echo "ESTIMATED_REDUCTION=$ESTIMATED_REDUCTION"
echo "REDUCTION_PERCENTAGE=$REDUCTION_PERCENTAGE"
```

## Outputs

This phase creates:

1. **$RUN_DIR/initial-analysis.json**: Complete analysis results
2. **$RUN_DIR/opportunities-report.md**: Human-readable report

This phase exports:

- TOTAL_OPPORTUNITIES: Total consolidation opportunities (integer)
- SHOULD_PROCEED: Whether to proceed (boolean)
- PROCEED_REASON: Rationale for decision (string)
- ESTIMATED_REDUCTION: Estimated test reduction (integer)
- REDUCTION_PERCENTAGE: Estimated reduction percentage (number)

## Success Criteria

- [ ] All analysis heuristics completed successfully
- [ ] Opportunities counted and categorized
- [ ] Diminishing returns decision matrix applied
- [ ] Analysis results saved to JSON
- [ ] Human-readable report generated
- [ ] Decision parameters exported

## Error Handling

### Cannot count tests
**Symptom**: grep/awk commands fail
**Solution**: Check tests/ directory structure
**Action**: Set opportunities to 0, mark SHOULD_PROCEED=false

### bc command not available
**Symptom**: Arithmetic comparisons fail
**Solution**: Install bc or use awk for comparisons
**Action**: Fall back to awk-based calculations

### Cannot write output files
**Symptom**: Permission denied on $RUN_DIR
**Solution**: Check directory permissions
**Action**: FAIL phase
