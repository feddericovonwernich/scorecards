---
phase_metadata:
  execution_mode: sequential

  inputs:
    parameters:
      - name: TARGETS_MET
        required: true
        description: "Whether all coverage targets are met"
        type: boolean
      - name: NEW_COVERAGE
        required: true
        description: "Current coverage after this iteration"
        type: number
      - name: COVERAGE_GAINED
        required: true
        description: "Coverage gained this iteration"
        type: number
      - name: ROI
        required: true
        description: "Coverage gained per test this iteration"
        type: number
      - name: PRIORITY_COUNT
        required: true
        description: "Number of priority files identified"
        type: integer
      - name: TESTS_PASSED
        required: true
        description: "Whether all tests passed"
        type: boolean
      - name: VALIDATION_PASSED
        required: false
        description: "Whether Phase 02.5 validated all tests (from test fixing phase)"
        type: boolean
        default: true
      - name: VALIDATED_TESTS_COUNT
        required: false
        description: "Number of tests that passed validation after fixing"
        type: integer
      - name: NO_REGRESSION
        required: true
        description: "Whether there's no regression"
        type: boolean
      - name: LOOP_INDEX
        required: true
        description: "Current iteration number"
        type: integer
      - name: MAX_ITERATIONS
        required: false
        default: 20
        description: "Maximum iterations allowed"
        type: integer
      - name: MIN_ROI
        required: false
        default: 0.5
        description: "Minimum ROI threshold"
        type: number
      - name: MIN_ITERATION_GAIN
        required: false
        default: 1.0
        description: "Minimum coverage gain per iteration"
        type: number
      - name: HISTORY_FILE
        required: false
        default: ".claude/coverage-improvement-history.json"
        description: "Path to history tracking file"
        type: file

  outputs:
    files:
      - path: "$HISTORY_FILE"
        description: "Updated coverage improvement history"
    parameters:
      - name: LOOP_CONTINUE
        description: "Whether to continue iterating (true) or exit loop (false)"
        type: boolean
      - name: LOOP_REASON
        description: "Reason for continue/exit decision"
        type: string
      - name: STOP_REASON
        description: "Stopping condition that was triggered (if exiting)"
        type: string
---

# Phase 05: Decision

**Purpose**: Evaluate stopping conditions, detect diminishing returns, update iteration history, and decide whether to continue iterating or exit the loop.

## Prerequisites
- Verification phase completed with all metrics calculated
- LOOP_INDEX available (current iteration number)
- History file accessible (will be created if doesn't exist)

## Tasks for Todo List
When starting this phase, add these tasks:
1. Loading iteration history from JSON file
2. Recording this iteration's metrics in history
3. Checking stopping condition: Targets met
4. Checking stopping condition: Diminishing returns
5. Checking stopping condition: No high-value gaps remaining
6. Checking stopping condition: Max iterations reached
7. Calculating ROI trend across recent iterations
8. Making continue/exit decision
9. Writing updated history to JSON file
10. Exporting LOOP_CONTINUE and LOOP_REASON parameters

## Parameters Used
- **TARGETS_MET**: Whether all coverage targets achieved (e.g., false)
- **NEW_COVERAGE**: Current coverage (e.g., 35.2)
- **COVERAGE_GAINED**: Coverage gained this iteration (e.g., 4.2)
- **ROI**: Coverage per test (e.g., 0.233)
- **PRIORITY_COUNT**: Files identified for improvement (e.g., 5)
- **TESTS_PASSED**: Whether tests passed (e.g., true)
- **NO_REGRESSION**: Whether no regression occurred (e.g., true)
- **LOOP_INDEX**: Current iteration (e.g., 3)
- **MAX_ITERATIONS**: Safety limit (e.g., 20)
- **MIN_ROI**: Minimum acceptable ROI (e.g., 0.5)
- **MIN_ITERATION_GAIN**: Minimum acceptable coverage gain (e.g., 1.0)
- **HISTORY_FILE**: Path to history JSON (e.g., .claude/coverage-improvement-history.json)

## Process

### Step 1: Load Iteration History

Read existing history from JSON file (create if doesn't exist):

```python
import json
import os
from datetime import datetime

history_file = os.environ.get('HISTORY_FILE', '.claude/coverage-improvement-history.json')

if os.path.exists(history_file):
    with open(history_file, 'r') as f:
        history = json.load(f)
else:
    # Initialize new history structure
    history = {
        'workflow_runs': []
    }

# Find or create current run entry
run_id = os.environ.get('RUN_ID', datetime.now().strftime('%Y%m%d-%H%M%S'))
current_run = None
for run in history['workflow_runs']:
    if run['run_id'] == run_id:
        current_run = run
        break

if current_run is None:
    current_run = {
        'run_id': run_id,
        'start_time': datetime.now().isoformat(),
        'iterations': []
    }
    history['workflow_runs'].append(current_run)
```

### Step 2: Record This Iteration's Metrics

Add this iteration's data to history:

```python
iteration_data = {
    'iteration': int(os.environ['LOOP_INDEX']),
    'timestamp': datetime.now().isoformat(),
    'coverage_before': float(os.environ.get('CURRENT_COVERAGE', os.environ.get('BASELINE_COVERAGE', 0))),
    'coverage_after': float(os.environ['NEW_COVERAGE']),
    'coverage_gained': float(os.environ['COVERAGE_GAINED']),
    'tests_added': int(os.environ['TESTS_ADDED']),
    'files_improved': int(os.environ['FILES_IMPROVED']),
    'roi': float(os.environ['ROI']),
    'tests_passed': os.environ['TESTS_PASSED'] == 'true',
    'no_regression': os.environ['NO_REGRESSION'] == 'true'
}

current_run['iterations'].append(iteration_data)
```

### Step 3: Check Stopping Conditions

Evaluate each stopping condition in priority order:

#### Condition 1: All Targets Met ✅

```python
if os.environ['TARGETS_MET'] == 'true':
    LOOP_CONTINUE = False
    LOOP_REASON = "All coverage targets achieved"
    STOP_REASON = "targets_achieved"
    exit_loop = True
```

#### Condition 2: Diminishing Returns Detected ⚠️

Check if ROI is declining and below threshold:

```python
# Calculate average ROI of last 3 iterations
recent_iterations = current_run['iterations'][-3:]
if len(recent_iterations) >= 3:
    recent_rois = [it['roi'] for it in recent_iterations]
    avg_recent_roi = sum(recent_rois) / len(recent_rois)

    # Check if ROI is decreasing AND below threshold
    roi_decreasing = all(recent_rois[i] >= recent_rois[i+1] for i in range(len(recent_rois)-1))
    roi_below_threshold = avg_recent_roi < float(os.environ.get('MIN_ROI', 0.5))

    if roi_decreasing and roi_below_threshold:
        LOOP_CONTINUE = False
        LOOP_REASON = f"Diminishing returns detected (avg ROI: {avg_recent_roi:.3f} < threshold: {MIN_ROI})"
        STOP_REASON = "diminishing_returns"
        exit_loop = True
```

#### Condition 3: Coverage Gain Too Small ⚠️

Check if last 3 iterations had minimal gains:

```python
if len(recent_iterations) >= 3:
    recent_gains = [it['coverage_gained'] for it in recent_iterations]
    avg_recent_gain = sum(recent_gains) / len(recent_gains)

    min_gain = float(os.environ.get('MIN_ITERATION_GAIN', 1.0))
    if avg_recent_gain < min_gain:
        LOOP_CONTINUE = False
        LOOP_REASON = f"Coverage gains too small (avg: {avg_recent_gain:.1f}% < threshold: {min_gain}%)"
        STOP_REASON = "minimal_gains"
        exit_loop = True
```

#### Condition 4: No High-Value Gaps Remaining 📊

```python
if int(os.environ['PRIORITY_COUNT']) == 0:
    LOOP_CONTINUE = False
    LOOP_REASON = "No more high-value coverage gaps identified"
    STOP_REASON = "no_gaps_remaining"
    exit_loop = True
```

#### Condition 5: Test Failures in New Tests ⚠️ (Non-Blocking Warning)

**Note**: Since Phase 02.5 validates and fixes tests, this condition is now a WARNING, not a blocking exit.
Test failures in newly generated tests are expected to be handled by Phase 02.5. If some tests still
fail after Phase 02.5's fix attempts, the workflow continues but logs a warning.

```python
# This is a WARNING, not a blocking condition
if os.environ.get('VALIDATION_PASSED', 'true') != 'true':
    # Phase 02.5 couldn't fully validate all tests - log warning but continue
    print(f"WARNING: Some generated tests still failing after Phase 02.5 fixes")
    print(f"Validated tests: {os.environ.get('VALIDATED_TESTS_COUNT', 'unknown')}")
    # Do NOT set exit_loop = True - workflow should continue
    # Coverage measurement in Phase 03 will reflect the working tests

# TESTS_PASSED from Phase 03 reflects the full test suite
# If new tests still fail but existing tests pass (NO_REGRESSION=true),
# the workflow should continue to avoid blocking on unfixable generated tests
```

#### Condition 6: Regression Detected ❌ (BLOCKING)

```python
if os.environ['NO_REGRESSION'] != 'true':
    LOOP_CONTINUE = False
    LOOP_REASON = "Regression detected in existing tests - manual review needed"
    STOP_REASON = "regression"
    exit_loop = True
```

#### Condition 7: Max Iterations Reached 🛑

```python
max_iterations = int(os.environ.get('MAX_ITERATIONS', 20))
if int(os.environ['LOOP_INDEX']) >= max_iterations:
    LOOP_CONTINUE = False
    LOOP_REASON = f"Maximum iterations reached ({max_iterations})"
    STOP_REASON = "max_iterations"
    exit_loop = True
```

### Step 4: Default Decision (Continue)

If no stopping conditions met, continue:

```python
if not exit_loop:
    LOOP_CONTINUE = True
    LOOP_REASON = f"Targets not met and ROI healthy ({ROI:.3f}%) - continuing"
    STOP_REASON = ""
```

### Step 5: Update History with Decision

Record the decision in current run:

```python
if not LOOP_CONTINUE:
    current_run['end_time'] = datetime.now().isoformat()
    current_run['status'] = 'completed'
    current_run['stopped_reason'] = STOP_REASON
    current_run['final_coverage'] = float(os.environ['NEW_COVERAGE'])
    current_run['total_iterations'] = int(os.environ['LOOP_INDEX'])
    current_run['total_tests_added'] = sum(it['tests_added'] for it in current_run['iterations'])
    current_run['total_coverage_gained'] = sum(it['coverage_gained'] for it in current_run['iterations'])
```

### Step 6: Write Updated History to File

Save history back to JSON file:

```python
with open(history_file, 'w') as f:
    json.dump(history, f, indent=2)

print(f"History updated: {history_file}")
```

### Step 7: Log Decision

Print clear decision with rationale:

```bash
echo "=========================================="
echo "ITERATION $LOOP_INDEX DECISION"
echo "=========================================="
echo "Coverage: ${NEW_COVERAGE}% (gained: ${COVERAGE_GAINED}%)"
echo "ROI: ${ROI}% per test"
echo "Tests passed: ${TESTS_PASSED}"
echo "No regression: ${NO_REGRESSION}"
echo ""
echo "Decision: $([ "$LOOP_CONTINUE" = "true" ] && echo "CONTINUE" || echo "EXIT LOOP")"
echo "Reason: $LOOP_REASON"
echo "=========================================="
```

### Step 8: Export Decision Parameters

Write decision parameters for orchestrator:

```yaml
LOOP_CONTINUE: <true_or_false>
LOOP_REASON: "<reason_for_decision>"
STOP_REASON: "<stopping_condition_if_exiting>"
```

## Outputs

**Files Created/Updated**:
- `$HISTORY_FILE`: Updated with this iteration's metrics and decision

**Parameters Discovered**:
- `LOOP_CONTINUE`: true (continue) or false (exit loop)
- `LOOP_REASON`: Human-readable explanation (e.g., "Targets not met and ROI healthy - continuing")
- `STOP_REASON`: Stopping condition name if exiting (e.g., "targets_achieved", "diminishing_returns", "")

## Success Criteria
- [ ] Iteration history loaded from file (or initialized)
- [ ] This iteration's metrics recorded in history
- [ ] All stopping conditions evaluated
- [ ] Continue/exit decision made with clear rationale
- [ ] History file updated with decision
- [ ] LOOP_CONTINUE and LOOP_REASON exported

## Error Handling

**History File Read Error**:
- If file exists but is malformed JSON
- Log warning and create new history structure
- Don't fail - continue with fresh history

**History File Write Error**:
- If unable to write to history file (permissions, disk full)
- Log error but don't fail the workflow
- Decision parameters are still exported

**Missing Previous Iteration Data**:
- If CURRENT_COVERAGE or BASELINE_COVERAGE not available
- Use NEW_COVERAGE from previous iteration in history
- If no history, use baseline from prerequisites phase

**Invalid Parameter Values**:
- If ROI, COVERAGE_GAINED, or other metrics are invalid (negative, NaN)
- Log warning with details
- Use safe defaults (ROI=0, COVERAGE_GAINED=0)
- Continue with decision logic

## Notes

**Stopping Conditions Priority**:
1. Regression detected (BLOCKING - existing tests broke, must stop for manual review)
2. Max iterations reached (BLOCKING - safety limit)
3. All targets met (BLOCKING - success condition)
4. Diminishing returns (BLOCKING - efficiency check)
5. Minimal gains (BLOCKING - efficiency check)
6. No gaps remaining (BLOCKING - no work left to do)
7. Test failures in new tests (WARNING ONLY - Phase 02.5 handles most; unfixable tests don't block workflow)

**Important Change (v1.1)**: Test failures in newly generated tests are NO LONGER a blocking condition.
Phase 02.5 (Validate & Fix Tests) now handles test failures automatically:
- Categorizes failures (import errors, API mismatches, async mock issues, fixture problems)
- Applies targeted fixes
- Deletes unfixable tests
- Only regression in EXISTING tests (NO_REGRESSION=false) will stop the workflow

**Diminishing Returns Detection**: Requires at least 3 iterations of history to evaluate trend. Early iterations (1-2) will always continue unless targets met.

**History Persistence**: History file persists across workflow runs, allowing tracking of multiple improvement sessions over time.

**ROI Thresholds**: Default MIN_ROI of 0.5 means each test should add at least 0.5% coverage. Adjust based on project needs.
