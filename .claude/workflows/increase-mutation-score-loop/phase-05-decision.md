---
phase_metadata:
  execution_mode: sequential

  inputs:
    files:
      - name: EXCLUSION_ASSESSMENT
        required: true
        path: "$RUN_DIR/iteration-$CURRENT_ITERATION-exclusions.md"
        description: "Exclusion assessment from Phase 04"
      - name: ITERATION_RESULTS
        required: true
        path: "$RUN_DIR/iteration-$CURRENT_ITERATION-results.md"
        description: "Verification results from Phase 03"

    parameters:
      - name: CURRENT_ITERATION
        required: true
        description: "Current iteration number"
        type: integer
      - name: NEW_SCORE
        required: true
        description: "Current mutation score"
        type: number
      - name: NEW_SURVIVORS
        required: true
        description: "Current survivor count"
        type: integer
      - name: IMPROVEMENT_DELTA
        required: true
        description: "Improvement this iteration"
        type: number
      - name: HIGH_VALUE_REMAINING
        required: true
        description: "High-value survivors remaining"
        type: integer
      - name: EFFECTIVE_TARGET_SCORE
        required: true
        description: "Target mutation score"
        type: number
      - name: MAX_ITERATIONS
        required: true
        description: "Maximum iterations allowed"
        type: integer
      - name: OUTPUT_DIR
        required: true
        description: "Output directory"
        type: directory
      - name: RUN_DIR
        required: true
        description: "Timestamped run directory from Phase 00"
        type: string

  outputs:
    files:
      - path: "$RUN_DIR/iteration-$CURRENT_ITERATION-decision.md"
        description: "Decision documentation for this iteration"
      - path: "$RUN_DIR/iteration-history.md"
        description: "Accumulated iteration history (appended)"

    parameters:
      # CRITICAL: This controls the orchestrator loop
      - name: SHOULD_CONTINUE
        description: "Whether to loop back to Phase 01 (true = continue, false = stop)"
        type: boolean
      - name: WORKFLOW_STATUS
        description: "Current status: SUCCESS, CONTINUE, REVIEW, or LOOPING"
        type: string
      - name: STOP_REASON
        description: "Reason for stopping (if SHOULD_CONTINUE=false)"
        type: string
      # Pass-through for next iteration
      - name: CURRENT_SCORE
        description: "Current score (for next iteration's PREVIOUS_SCORE)"
        type: number
      - name: SURVIVED_COUNT
        description: "Current survivors (for next iteration)"
        type: integer
---

# Phase 05: Decision

**Purpose**: Evaluate stop conditions and decide whether to continue iterating or proceed to final report

**CRITICAL**: This phase outputs `SHOULD_CONTINUE` which controls the orchestrator's loop behavior.

## Loop Control

This phase is the **loop end phase** (defined in workflow.yaml `loop.end_phase: "05"`).

After this phase completes, the orchestrator checks:
```
If SHOULD_CONTINUE == true AND CURRENT_ITERATION < MAX_ITERATIONS:
  → Loop back to Phase 01 (Analyze Survivors)
Else:
  → Continue to Phase 06 (Final Report)
```

## Prerequisites

- Phases 01-04 completed for current iteration
- Current score and survivor state known
- Exclusion assessment completed

## Tasks for Todo List

When starting this phase, add these tasks:

1. Reading iteration results and exclusion assessment
2. Evaluating stop conditions
3. Making loop decision (SHOULD_CONTINUE)
4. Documenting decision rationale
5. Updating iteration history
6. Exporting decision parameters

## Parameters Used

### Input Parameters
- **CURRENT_ITERATION**: Iteration number
- **NEW_SCORE**: Current mutation score
- **NEW_SURVIVORS**: Current survivor count
- **IMPROVEMENT_DELTA**: This iteration's improvement
- **HIGH_VALUE_REMAINING**: High-value survivors left
- **EFFECTIVE_TARGET_SCORE**: Target score
- **MAX_ITERATIONS**: Max iterations allowed
- **OUTPUT_DIR**: Output directory
- **RUN_DIR**: Timestamped run directory from Phase 00

### Output Parameters (CRITICAL)
- **SHOULD_CONTINUE**: `true` to loop, `false` to stop (CONTROLS LOOP)
- **WORKFLOW_STATUS**: SUCCESS | CONTINUE | REVIEW | LOOPING
- **STOP_REASON**: Reason for decision
- **CURRENT_SCORE**: Pass-through for next iteration
- **SURVIVED_COUNT**: Pass-through for next iteration

## Process

### Step 1: Evaluate Stop Conditions

Check conditions in priority order:

#### Condition 1: Target Achieved ✅
```python
if NEW_SCORE >= EFFECTIVE_TARGET_SCORE:
    SHOULD_CONTINUE = false
    WORKFLOW_STATUS = "SUCCESS"
    STOP_REASON = f"Target {EFFECTIVE_TARGET_SCORE}% achieved (current: {NEW_SCORE}%)"
```

#### Condition 2: Excellent Score ✅
```python
if NEW_SCORE >= 90:
    SHOULD_CONTINUE = false
    WORKFLOW_STATUS = "SUCCESS"
    STOP_REASON = f"Excellent score 90%+ achieved ({NEW_SCORE}%)"
```

#### Condition 3: Diminishing Returns ⚠️
```python
if IMPROVEMENT_DELTA < 2.0 and HIGH_VALUE_REMAINING == 0:
    SHOULD_CONTINUE = false
    WORKFLOW_STATUS = "REVIEW"
    STOP_REASON = "Diminishing returns (delta < 2 pp, no high-value targets)"
```

#### Condition 4: Max Iterations Reached 🔄
```python
if CURRENT_ITERATION >= MAX_ITERATIONS:
    SHOULD_CONTINUE = false
    if HIGH_VALUE_REMAINING > 0:
        WORKFLOW_STATUS = "CONTINUE"
        STOP_REASON = f"Max iterations ({MAX_ITERATIONS}) reached, {HIGH_VALUE_REMAINING} high-value survivors remain"
    else:
        WORKFLOW_STATUS = "REVIEW"
        STOP_REASON = f"Max iterations ({MAX_ITERATIONS}) reached"
```

#### Condition 5: Continue Looping 🔁
```python
# Default: Continue if none of the above conditions met
SHOULD_CONTINUE = true
WORKFLOW_STATUS = "LOOPING"
STOP_REASON = "Continuing to next iteration"
```

### Step 2: Decision Matrix

| NEW_SCORE | IMPROVEMENT_DELTA | HIGH_VALUE | ITERATION | Decision | Status |
|-----------|------------------|------------|-----------|----------|--------|
| >= target | any | any | any | STOP | SUCCESS |
| >= 90% | any | any | any | STOP | SUCCESS |
| any | < 2 pp | 0 | any | STOP | REVIEW |
| any | any | any | >= MAX | STOP | CONTINUE/REVIEW |
| < target | >= 2 pp | any | < MAX | LOOP | LOOPING |
| < target | any | > 0 | < MAX | LOOP | LOOPING |

### Step 3: Log Decision

**Output decision clearly**:

```
════════════════════════════════════════════════════════════════
ITERATION $CURRENT_ITERATION - DECISION
════════════════════════════════════════════════════════════════

Current State:
- Score: $NEW_SCORE%
- Target: $EFFECTIVE_TARGET_SCORE%
- Improvement This Iteration: +$IMPROVEMENT_DELTA pp
- High-Value Survivors: $HIGH_VALUE_REMAINING
- Iteration: $CURRENT_ITERATION of $MAX_ITERATIONS

DECISION: <CONTINUE LOOPING / STOP>
STATUS: $WORKFLOW_STATUS
REASON: $STOP_REASON

<if SHOULD_CONTINUE>
→ Looping back to Phase 01 (Analyze Survivors)
  Next iteration: $CURRENT_ITERATION + 1
</if>

<if not SHOULD_CONTINUE>
→ Proceeding to Phase 06 (Final Report)
</if>
════════════════════════════════════════════════════════════════
```

### Step 4: Generate Decision Documentation

**Report Structure** (`$RUN_DIR/iteration-$CURRENT_ITERATION-decision.md`):

```markdown
# Iteration $CURRENT_ITERATION - Decision

**Timestamp**: <timestamp>

## Current State

| Metric | Value |
|--------|-------|
| Mutation Score | $NEW_SCORE% |
| Target Score | $EFFECTIVE_TARGET_SCORE% |
| Gap to Target | <gap> pp |
| Improvement This Iteration | +$IMPROVEMENT_DELTA pp |
| High-Value Survivors | $HIGH_VALUE_REMAINING |
| Total Survivors | $NEW_SURVIVORS |
| Iteration | $CURRENT_ITERATION of $MAX_ITERATIONS |

## Stop Conditions Evaluated

| Condition | Threshold | Actual | Met? |
|-----------|-----------|--------|------|
| Target Achieved | >= $EFFECTIVE_TARGET_SCORE% | $NEW_SCORE% | <Yes/No> |
| Excellent Score | >= 90% | $NEW_SCORE% | <Yes/No> |
| Diminishing Returns | delta < 2 pp AND high-value = 0 | $IMPROVEMENT_DELTA pp, $HIGH_VALUE_REMAINING | <Yes/No> |
| Max Iterations | >= $MAX_ITERATIONS | $CURRENT_ITERATION | <Yes/No> |

## Decision

**SHOULD_CONTINUE**: $SHOULD_CONTINUE
**WORKFLOW_STATUS**: $WORKFLOW_STATUS
**STOP_REASON**: $STOP_REASON

## Rationale

<detailed explanation of decision>

## Next Action

<if SHOULD_CONTINUE>
🔁 **Continue to Iteration $NEXT_ITERATION**

Focus areas for next iteration:
- HIGH VALUE survivors: $HIGH_VALUE_REMAINING
- Potential improvement: ~2-5 pp (typical)
- Expected tests to add: 3-5
</if>

<if WORKFLOW_STATUS == "SUCCESS">
✅ **Proceed to Final Report**

Target achieved! The mutation score of $NEW_SCORE% meets or exceeds the target of $EFFECTIVE_TARGET_SCORE%.
</if>

<if WORKFLOW_STATUS == "REVIEW">
⚠️ **Proceed to Final Report with Recommendations**

Diminishing returns detected. Apply recommended exclusions to potentially reach target.
</if>

<if WORKFLOW_STATUS == "CONTINUE">
🔄 **Proceed to Final Report - Re-run Recommended**

Max iterations reached with HIGH VALUE survivors remaining. Consider re-running workflow with increased MAX_ITERATIONS.
</if>
```

### Step 5: Update Iteration History

Append to cumulative iteration history.

**Update** (`$RUN_DIR/iteration-history.md`):

```markdown
# Mutation Score Improvement - Iteration History

**Module**: $EFFECTIVE_MODULE_PATH
**Started**: <first iteration timestamp>
**Last Updated**: <current timestamp>

## Summary

| Metric | Value |
|--------|-------|
| Starting Score | $BASELINE_SCORE% |
| Current Score | $NEW_SCORE% |
| Total Improvement | +<total> pp |
| Iterations Completed | $CURRENT_ITERATION |
| Status | $WORKFLOW_STATUS |

## Iteration Log

### Iteration 1
- **Before**: $BASELINE_SCORE%
- **After**: <score>%
- **Improvement**: +<delta> pp
- **Tests Added**: <count>
- **Mutants Killed**: <count>
- **Decision**: <LOOP/STOP>

### Iteration 2
...

### Iteration $CURRENT_ITERATION (Latest)
- **Before**: $PREVIOUS_SCORE%
- **After**: $NEW_SCORE%
- **Improvement**: +$IMPROVEMENT_DELTA pp
- **Tests Added**: <count>
- **Mutants Killed**: <count>
- **High-Value Remaining**: $HIGH_VALUE_REMAINING
- **Decision**: $SHOULD_CONTINUE ? "LOOP" : "STOP ($WORKFLOW_STATUS)"

## Progress Chart

```
Baseline: ████████████████████░░░░░░░░░░ 70%
Iter 1:   ██████████████████████████░░░░ 82%
Iter 2:   ████████████████████████████░░ 91%
Target:   ████████████████████████████░░ 90%
                                         ↑ Target achieved!
```
```

### Step 6: Export Decision Parameters

**CRITICAL**: Export parameters for orchestrator loop control:

```yaml
# runtime-parameters.yaml (updated by orchestrator)
SHOULD_CONTINUE: <true|false>
WORKFLOW_STATUS: <SUCCESS|CONTINUE|REVIEW|LOOPING>
STOP_REASON: "<reason>"
CURRENT_SCORE: $NEW_SCORE
SURVIVED_COUNT: $NEW_SURVIVORS
CURRENT_ITERATION: $CURRENT_ITERATION  # Orchestrator increments if looping
```

## Outputs

### Files Created/Updated
1. **$RUN_DIR/iteration-$CURRENT_ITERATION-decision.md**: Decision documentation
2. **$RUN_DIR/iteration-history.md**: Cumulative history (appended)

### Parameters Exported (CRITICAL)
- `SHOULD_CONTINUE`: **Controls loop** (true = loop to Phase 01)
- `WORKFLOW_STATUS`: SUCCESS | CONTINUE | REVIEW | LOOPING
- `STOP_REASON`: Decision rationale
- `CURRENT_SCORE`: Pass-through for next iteration
- `SURVIVED_COUNT`: Pass-through for next iteration

## Success Criteria

- [ ] Stop conditions evaluated correctly
- [ ] Decision made and documented
- [ ] SHOULD_CONTINUE parameter set correctly
- [ ] WORKFLOW_STATUS reflects accurate state
- [ ] Iteration history updated
- [ ] Pass-through parameters exported

## Error Handling

### Conflicting Conditions
```
If multiple stop conditions are met:
  Use priority order (Condition 1 > 2 > 3 > 4)
  Log which condition was used
```

### Missing Input Parameters
```
Error: Required parameter missing
Solution:
1. Check Phase 04 completed successfully
2. Verify runtime-parameters.yaml has all values
3. Re-run Phase 04 if needed
```

### Iteration Count Mismatch
```
Warning: CURRENT_ITERATION doesn't match expected
Solution:
1. Check orchestrator iteration tracking
2. Verify iteration-history.md is consistent
3. May indicate workflow restart needed
```

## Notes

**Loop Control Mechanism**:
- Orchestrator reads SHOULD_CONTINUE from runtime-parameters.yaml
- If true: Increments CURRENT_ITERATION, loops to Phase 01
- If false: Continues to Phase 06 (Final Report)

**Status Meanings**:
- **SUCCESS**: Target achieved, excellent quality
- **REVIEW**: Diminishing returns, apply exclusions
- **CONTINUE**: More work possible, re-run workflow
- **LOOPING**: Active iteration (internal status)

**Typical Patterns**:
- Most workflows complete in 2-3 iterations
- SUCCESS usually achieved by iteration 2 if starting from 60%+ coverage
- REVIEW common when target is aggressive (95%+)

**Safety Limits**:
- MAX_ITERATIONS prevents infinite loops
- Diminishing returns detection stops futile effort
- Orchestrator enforces max_iterations from workflow.yaml

**Multi-Component Support**:
- Decision logic is tool-agnostic and component-agnostic
- Works with any mutation testing tool (Poodle, Stryker, mutmut, etc.)
- Supports multi-component projects (backend + frontend)
- See `.claude/rules/testing-workflows-config.md` for component configuration
