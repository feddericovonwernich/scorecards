---
phase_metadata:
  execution_mode: sequential

  inputs:
    files:
      - name: TESTS_DOCUMENTATION
        required: true
        path: "$RUN_DIR/iteration-$CURRENT_ITERATION-tests.md"
        description: "Tests added in Phase 02"

    parameters:
      - name: CURRENT_ITERATION
        required: true
        description: "Current iteration number"
        type: integer
      - name: PREVIOUS_SCORE
        required: true
        description: "Score before this iteration"
        type: number
      - name: PREVIOUS_SURVIVORS
        required: true
        description: "Survivor count before this iteration"
        type: integer
      - name: TESTS_ADDED
        required: true
        description: "Tests added in Phase 02"
        type: integer
      - name: EFFECTIVE_MODULE_PATH
        required: true
        description: "Module being tested"
        type: string
      - name: OUTPUT_DIR
        required: true
        description: "Output directory"
        type: directory
      - name: RUN_DIR
        required: true
        description: "Timestamped run directory from Phase 00"
        type: string
      - name: MUTATION_TOOL
        required: false
        default: "poodle"
        description: "Mutation testing tool being used"
        type: string
      - name: CONFIG_FILE
        required: false
        default: ".claude/rules/testing-workflows-config.md"
        description: "Project testing workflows config file"
        type: file

  outputs:
    files:
      - path: "$RUN_DIR/iteration-$CURRENT_ITERATION-results.md"
        description: "Verification results for this iteration"

    parameters:
      - name: NEW_SCORE
        description: "Mutation score after this iteration"
        type: number
      - name: NEW_SURVIVORS
        description: "Survivor count after this iteration"
        type: integer
      - name: IMPROVEMENT_DELTA
        description: "Score improvement (percentage points)"
        type: number
      - name: MUTANTS_KILLED
        description: "Number of mutants killed this iteration"
        type: integer
---

# Phase 03: Verify Improvement

**Purpose**: Re-run mutation testing to measure the improvement from tests added in Phase 02

**Loop Phase**: This phase is part of the iteration loop (phases 01-05). After verification, Phase 04 will reassess exclusions.

## Prerequisites

- Phase 02 completed (tests added)
- All tests pass
- Mutation testing tool is functional

## Tasks for Todo List

When starting this phase, add these tasks:

1. Verifying all tests pass before mutation testing
2. Loading mutation tool configuration
3. Running mutation testing
4. Parsing mutation testing results
5. Calculating improvement metrics
6. Comparing to previous iteration
7. Generating iteration results report

## Parameters Used

### Input Parameters
- **CURRENT_ITERATION**: Iteration number
- **PREVIOUS_SCORE**: Score before this iteration
- **PREVIOUS_SURVIVORS**: Survivors before this iteration
- **TESTS_ADDED**: Tests added in Phase 02
- **EFFECTIVE_MODULE_PATH**: Module under test
- **OUTPUT_DIR**: Output directory
- **RUN_DIR**: Timestamped run directory from Phase 00
- **MUTATION_TOOL**: Mutation testing tool being used
- **CONFIG_FILE**: Project testing workflows config file

### Output Parameters
- **NEW_SCORE**: New mutation score
- **NEW_SURVIVORS**: New survivor count
- **IMPROVEMENT_DELTA**: Score improvement in percentage points
- **MUTANTS_KILLED**: Mutants killed this iteration

## Process

### Step 1: Verify Tests Pass

Before running mutation testing, ensure all tests pass.

**Load test command from config**:
```bash
# Read CONFIG_FILE and extract test run command for the component
# Example from testing-workflows-config.md:
#   Backend: PYTHONPATH=src pytest tests/ -v
#   Frontend: cd frontend && npm test
```

**Run tests**:
```bash
# Execute the test command from config
<test_command_from_config>

# Expected output: All tests pass
# If tests fail, STOP and fix before proceeding
```

**If tests fail**:
```
Error: Tests are failing - cannot run mutation testing
Solution:
1. Run tests with verbose output to identify failures
2. Fix failing tests
3. Re-run Phase 02 if tests were incorrectly written
```

### Step 2: Run Mutation Testing

Execute mutation testing using the configured tool.

**Determine mutation command from CONFIG_FILE and MUTATION_TOOL**:

```bash
# Python (Poodle)
python -m poodle

# Python (mutmut)
mutmut run

# JavaScript/TypeScript (Stryker)
npx stryker run

# Go (gremlins)
gremlins unleash

# Rust (cargo-mutants)
cargo mutants
```

**Example outputs by tool**:

**Poodle**:
```
Poodle Results:
  Total mutations: 138
  Killed: 130
  Survived: 8
  Mutation score: 94.2%
```

**mutmut**:
```
Mutation testing complete:
- Killed: 130
- Survived: 8
- Total: 138
Score: 94.2%
```

**Stryker**:
```json
{
  "mutationScore": 94.2,
  "killed": 130,
  "survived": 8,
  "totalMutants": 138
}
```

**gremlins**:
```
Mutation coverage: 94.2%
Mutants killed: 130/138
```

**cargo-mutants**:
```
Mutation score: 94.2% (130/138 killed)
```

**Capture metrics** (tool-agnostic):
- Total mutations (should be same as baseline)
- Killed count
- Survived count
- Mutation score percentage

### Step 3: Parse Results

Extract metrics from mutation testing tool output.

**Tool-specific parsing**:

**Poodle** (text output):
```python
# Parse terminal output or poodle-results.json (if available)
total_mutations = extract_from_output("Total mutations: (\\d+)")
killed_count = extract_from_output("Killed: (\\d+)")
new_survivors = extract_from_output("Survived: (\\d+)")
new_score = extract_from_output("Mutation score: ([\\d.]+)%")
```

**mutmut** (text output):
```python
# Parse mutmut output
killed_count = extract_from_output("Killed: (\\d+)")
new_survivors = extract_from_output("Survived: (\\d+)")
total_mutations = killed_count + new_survivors
new_score = (killed_count / total_mutations) * 100
```

**Stryker** (JSON report):
```python
# Parse reports/mutation/mutation.json
import json
with open("reports/mutation/mutation.json") as f:
    data = json.load(f)
    new_score = data["mutationScore"]
    killed_count = data["killed"]
    new_survivors = data["survived"]
    total_mutations = data["totalMutants"]
```

**gremlins** (text output):
```python
# Parse gremlins output
new_score = extract_from_output("Mutation coverage: ([\\d.]+)%")
killed_count = extract_from_output("Mutants killed: (\\d+)/(\\d+)")[0]
total_mutations = extract_from_output("Mutants killed: (\\d+)/(\\d+)")[1]
new_survivors = total_mutations - killed_count
```

**cargo-mutants** (text output):
```python
# Parse cargo-mutants output
match = extract_from_output("Mutation score: ([\\d.]+)% \\((\\d+)/(\\d+) killed\\)")
new_score = match[0]
killed_count = match[1]
total_mutations = match[2]
new_survivors = total_mutations - killed_count
```

**Unified metrics** (tool-agnostic):
```python
# These values should be extracted regardless of tool
total_mutations = <from tool output>
killed_count = <from tool output>
new_survivors = <from tool output>
new_score = (killed_count / total_mutations) * 100 if total_mutations > 0 else 0
```

### Step 4: Calculate Improvement Metrics

Compute improvement from this iteration:

```python
# Improvement calculations
improvement_delta = new_score - PREVIOUS_SCORE
mutants_killed_this_iteration = PREVIOUS_SURVIVORS - new_survivors
kill_rate = (mutants_killed_this_iteration / PREVIOUS_SURVIVORS) * 100 if PREVIOUS_SURVIVORS > 0 else 0

# Efficiency metrics
tests_per_kill = TESTS_ADDED / mutants_killed_this_iteration if mutants_killed_this_iteration > 0 else float('inf')
improvement_per_test = improvement_delta / TESTS_ADDED if TESTS_ADDED > 0 else 0
```

### Step 5: Evaluate Results

**Excellent Progress** (improvement_delta >= 5):
```
✅ Excellent progress! Killed $MUTANTS_KILLED mutants
   Score: $PREVIOUS_SCORE% → $NEW_SCORE% (+$IMPROVEMENT_DELTA pp)
```

**Good Progress** (improvement_delta >= 2):
```
✅ Good progress! Killed $MUTANTS_KILLED mutants
   Score: $PREVIOUS_SCORE% → $NEW_SCORE% (+$IMPROVEMENT_DELTA pp)
```

**Minimal Progress** (improvement_delta < 2):
```
⚠ Minimal progress: +$IMPROVEMENT_DELTA pp
   Possible causes:
   - Tests don't execute mutated paths
   - Assertions too weak
   - Remaining mutants are hard to kill
```

**No Improvement** (improvement_delta == 0):
```
❌ No improvement detected
   Possible causes:
   - Tests don't actually test the mutated code
   - All remaining mutants are equivalent
   - Test assertions pass with both original and mutant

   Recommendation: Review test quality and targeting
```

### Step 6: Generate Iteration Results Report

Create detailed results report.

**Report Structure** (`$RUN_DIR/iteration-$CURRENT_ITERATION-results.md`):

```markdown
# Iteration $CURRENT_ITERATION - Results

**Date**: <timestamp>
**Module**: $EFFECTIVE_MODULE_PATH

## Summary

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Mutation Score | $PREVIOUS_SCORE% | $NEW_SCORE% | +$IMPROVEMENT_DELTA pp |
| Survivors | $PREVIOUS_SURVIVORS | $NEW_SURVIVORS | -$MUTANTS_KILLED |
| Tests Added | - | $TESTS_ADDED | +$TESTS_ADDED |

## Progress Assessment

**Status**: <Excellent/Good/Minimal/None>

$ASSESSMENT_MESSAGE

## Efficiency Metrics

| Metric | Value |
|--------|-------|
| Mutants Killed | $MUTANTS_KILLED |
| Kill Rate | <kill_rate>% of previous survivors |
| Tests per Kill | <tests_per_kill> |
| Improvement per Test | <improvement_per_test> pp |

## Iteration History

| Iteration | Score Before | Score After | Delta | Tests | Killed |
|-----------|--------------|-------------|-------|-------|--------|
| 1         | $BASELINE    | <score>     | +X pp | N     | M      |
| ...       | ...          | ...         | ...   | ...   | ...    |
| **$CURRENT_ITERATION** | **$PREVIOUS_SCORE%** | **$NEW_SCORE%** | **+$IMPROVEMENT_DELTA pp** | **$TESTS_ADDED** | **$MUTANTS_KILLED** |

## Next Steps

<if NEW_SCORE >= TARGET_SCORE>
✅ **Target Achieved!** Proceed to Phase 05 for final decision.
</if>

<if NEW_SCORE >= 90>
✅ **Excellent Quality!** Score exceeds 90%. Consider completion.
</if>

<if improvement_delta < 2 and NEW_SCORE < TARGET_SCORE>
⚠ **Diminishing Returns**: Consider exclusion assessment in Phase 04.
</if>

<else>
🔄 Continue to Phase 04 for exclusion reassessment.
</else>
```

## Outputs

### Files Created
1. **$RUN_DIR/iteration-$CURRENT_ITERATION-results.md**: Iteration verification results

### Parameters Exported
- `NEW_SCORE`: New mutation score percentage
- `NEW_SURVIVORS`: New survivor count
- `IMPROVEMENT_DELTA`: Score improvement (pp)
- `MUTANTS_KILLED`: Mutants killed this iteration

## Success Criteria

- [ ] All tests pass before mutation testing
- [ ] Mutation testing completed successfully
- [ ] Results parsed correctly (tool-specific format)
- [ ] Improvement metrics calculated
- [ ] Results report generated
- [ ] Output parameters exported

## Error Handling

### Mutation Testing Fails
```
Error: Mutation testing execution failed
Possible causes:
1. Tests failing (check test suite first)
2. Tool configuration file misconfigured
3. Module path incorrect
4. Tool not installed or wrong version

Solution:
1. Run tests manually using command from CONFIG_FILE
2. Validate tool config file (tool-specific validation)
3. Check tool installation: <tool-specific check>
   - Poodle: python -c "import poodle"
   - mutmut: mutmut --version
   - Stryker: npx stryker --version
   - gremlins: gremlins version
   - cargo-mutants: cargo mutants --version
4. Retry
```

### Score Decreased
```
Warning: Score decreased from $PREVIOUS_SCORE% to $NEW_SCORE%
Possible causes:
1. New tests broke existing coverage
2. Tool configuration changed
3. Tool version difference
4. Source code modified (mutations changed)

Solution:
1. Compare total mutations (should be same as baseline)
2. Review new tests for side effects
3. Investigate if existing tests were modified
4. Check if tool configuration was changed
```

### Total Mutations Changed
```
Warning: Total mutations changed ($BASELINE_TOTAL → $NEW_TOTAL)
Possible causes:
1. Source code modified
2. Tool configuration changed (exclusions added/removed)
3. Different tool version
4. Module scope changed

Note: This may indicate workflow should restart from Phase 00 to reestablish baseline
```

## Notes

**Typical Improvement Patterns**:
- **Iteration 1**: 10-20 pp improvement (coverage gaps filled)
- **Iteration 2**: 5-10 pp improvement (harder cases)
- **Iteration 3**: 2-5 pp improvement (diminishing returns)
- **Iteration 4+**: <2 pp improvement (near optimal)

**Diminishing Returns Detection**:
- If improvement_delta < 2 pp for 2 consecutive iterations
- This suggests remaining mutants are hard to kill
- Phase 04 will recommend exclusions

**Quality Indicators**:
- Good: 2+ mutants killed per test added
- Average: 1-2 mutants killed per test added
- Low: <1 mutant killed per test added

**Mutation Score Targets**:
- 90%+: Excellent quality
- 85-90%: Good quality
- 80-85%: Acceptable
- <80%: Needs improvement
