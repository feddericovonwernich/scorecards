---
phase_metadata:
  execution_mode: sequential

  inputs:
    files:
      - name: BASELINE_REPORT
        required: true
        path: "$RUN_DIR/baseline-report.md"
        description: "Baseline mutation testing results"
      - name: ITERATION_HISTORY
        required: true
        path: "$RUN_DIR/iteration-history.md"
        description: "Complete iteration history"
      - name: FINAL_EXCLUSIONS
        required: true
        path: "$RUN_DIR/iteration-$TOTAL_ITERATIONS-exclusions.md"
        description: "Final exclusion analysis from last iteration"
      - name: CONFIG_RECOMMENDATIONS
        required: true
        path: "$RUN_DIR/mutation-config-recommendations.md"
        description: "Mutation testing configuration recommendations"

    parameters:
      - name: BASELINE_SCORE
        required: true
        description: "Initial mutation score"
        type: number
      - name: CURRENT_SCORE
        required: true
        description: "Final mutation score"
        type: number
      - name: CURRENT_ITERATION
        required: true
        description: "Total iterations completed"
        type: integer
      - name: HIGH_VALUE_REMAINING
        required: true
        description: "High-value survivors remaining"
        type: integer
      - name: LOW_VALUE_REMAINING
        required: true
        description: "Low-value survivors (acceptable)"
        type: integer
      - name: WORKFLOW_STATUS
        required: true
        description: "SUCCESS, CONTINUE, or REVIEW"
        type: string
      - name: STOP_REASON
        required: true
        description: "Reason workflow stopped"
        type: string
      - name: EFFECTIVE_MODULE_PATH
        required: true
        description: "Module tested"
        type: string
      - name: EFFECTIVE_TARGET_SCORE
        required: true
        description: "Target score"
        type: number
      - name: RECOMMENDED_EXCLUSIONS
        required: false
        description: "JSON skip_mutators recommendations"
        type: string
      - name: OUTPUT_DIR
        required: true
        description: "Output directory"
        type: directory
      - name: RUN_DIR
        required: true
        description: "Timestamped run directory from Phase 00"
        type: string
      - name: COMPONENTS
        required: false
        description: "Comma-separated list of components tested (e.g., backend,frontend)"
        type: string
        default: ""
      - name: CONFIG_FILE
        required: false
        description: "Path to testing workflows config"
        type: file
        default: ".claude/rules/testing-workflows-config.md"

  outputs:
    files:
      - path: "$RUN_DIR/final-report.md"
        description: "Comprehensive final report with recommendations"

    parameters:
      - name: COMPLETION_STATUS
        description: "Workflow completion status"
        type: string
---

# Phase 06: Final Report

**Purpose**: Consolidate all iteration results into a comprehensive final report with clear next steps and recommendations

**Post-Loop Phase**: This phase runs after the iteration loop (phases 01-05) completes.

## Prerequisites

- Phase 00 completed (prerequisites and baseline)
- Phases 01-05 loop completed (all iterations done)
- Iteration history available
- Exclusion analysis from final iteration

## Tasks for Todo List

When starting this phase, add these tasks:

1. Loading component configuration (if multi-component)
2. Reading iteration history and final exclusion analysis
3. Calculating final metrics and total improvement
4. Aggregating multi-component results (if applicable)
5. Analyzing workflow status (SUCCESS/CONTINUE/REVIEW)
6. Generating executive summary with per-component breakdown
7. Documenting quality assessment
8. Providing actionable next steps (tool-specific)
9. Updating mutation testing history file
10. Creating final comprehensive report

## Parameters Used

### Input Parameters
- **BASELINE_SCORE**: Starting mutation score
- **CURRENT_SCORE**: Final mutation score
- **CURRENT_ITERATION**: Iterations completed
- **HIGH_VALUE_REMAINING**: High-value survivors
- **LOW_VALUE_REMAINING**: Low-value survivors
- **WORKFLOW_STATUS**: SUCCESS | CONTINUE | REVIEW
- **STOP_REASON**: Why workflow stopped
- **EFFECTIVE_MODULE_PATH**: Module tested
- **EFFECTIVE_TARGET_SCORE**: Target score
- **RECOMMENDED_EXCLUSIONS**: Exclusion recommendations
- **OUTPUT_DIR**: Output directory
- **RUN_DIR**: Timestamped run directory from Phase 00
- **COMPONENTS**: Components tested (e.g., "backend,frontend")
- **CONFIG_FILE**: Path to testing workflows config

### Output Parameters
- **COMPLETION_STATUS**: Final completion status

## Process

### Step 1: Calculate Final Metrics

Compute comprehensive improvement metrics:

```python
# Improvement metrics
total_improvement = CURRENT_SCORE - BASELINE_SCORE
improvement_percentage = (total_improvement / BASELINE_SCORE) * 100 if BASELINE_SCORE > 0 else 0
target_gap = EFFECTIVE_TARGET_SCORE - CURRENT_SCORE
target_achievement = (CURRENT_SCORE / EFFECTIVE_TARGET_SCORE) * 100

# Survivor metrics
total_survivors = HIGH_VALUE_REMAINING + LOW_VALUE_REMAINING
```

### Step 2: Load Component Configuration and Aggregate Multi-Component Results

**If COMPONENTS parameter is set** (multi-component project):

```python
def load_component_config(component_name: str, config_file: str) -> dict:
    """Load component-specific mutation testing configuration."""
    with open(config_file, 'r') as f:
        content = f.read()

    # Parse component section from config
    # Extract: language, mutation_tool, config_file_path, mutation_command
    # See .claude/rules/testing-workflows-config.md for structure

    if component_name == "backend":
        return {
            "language": "python",
            "mutation_tool": "poodle",
            "config_file": "poodle.toml",
            "mutation_command": "python -m poodle",
            "package_name": "telegram_claude_bot"
        }
    elif component_name == "frontend":
        return {
            "language": "typescript",
            "mutation_tool": "stryker",
            "config_file": "stryker.config.js",
            "mutation_command": "npx stryker run",
            "package_name": "claude-workspaces-dashboard"
        }
    else:
        raise ValueError(f"Unknown component: {component_name}")

# Parse COMPONENTS parameter
components_list = [c.strip() for c in COMPONENTS.split(',') if c.strip()]

# For single-component projects
if not components_list:
    # Detect from EFFECTIVE_MODULE_PATH
    if "frontend/" in EFFECTIVE_MODULE_PATH:
        components_list = ["frontend"]
    else:
        components_list = ["backend"]

# Load component-specific results
component_results = {}
for component in components_list:
    config = load_component_config(component, CONFIG_FILE)

    # Read component-specific metrics from iteration history
    # (These should have been tracked per-component during iterations)
    component_results[component] = {
        "language": config["language"],
        "mutation_tool": config["mutation_tool"],
        "config_file": config["config_file"],
        "baseline_score": BASELINE_SCORE,  # Component-specific if available
        "final_score": CURRENT_SCORE,      # Component-specific if available
        "improvement": total_improvement,
        "iterations": CURRENT_ITERATION,
        "survivors": total_survivors,
        "high_value_survivors": HIGH_VALUE_REMAINING,
        "status": WORKFLOW_STATUS
    }

# Calculate aggregate metrics (weighted average by test count or equal weight)
if len(component_results) > 1:
    overall_score = sum(r["final_score"] for r in component_results.values()) / len(component_results)
    overall_improvement = sum(r["improvement"] for r in component_results.values()) / len(component_results)
    total_survivors_all = sum(r["survivors"] for r in component_results.values())
else:
    overall_score = CURRENT_SCORE
    overall_improvement = total_improvement
    total_survivors_all = total_survivors
```

### Step 3: Analyze Workflow Status

Interpret the workflow status and prepare status-specific recommendations:

#### If SUCCESS ✅

**Criteria Met**:
- CURRENT_SCORE >= EFFECTIVE_TARGET_SCORE, OR
- CURRENT_SCORE >= 90%

**Interpretation**: Target achieved or excellent quality reached

**Next Steps**:
1. **Apply exclusion recommendations** (if any)
   - Update mutation tool config file (tool-specific)
   - Re-run mutation testing to confirm projected score
   - See component-specific config recommendations below
2. **Document accepted survivors**
   - Create survivor documentation in project docs
   - Explain rationale for each LOW VALUE survivor
3. **Apply to other modules**
   - Use learnings from this module
   - Identify similar modules for improvement
4. **Consider CI/CD integration**
   - Add mutation testing to CI pipeline
   - Set minimum score threshold

#### If REVIEW ⚠️

**Criteria Met**:
- Improvement delta < 2% in last iteration, AND
- No HIGH VALUE survivors remaining

**Interpretation**: Diminishing returns detected, exclusions recommended

**Next Steps**:
1. **Apply recommended exclusions** (critical)
   - Review `mutation-config-recommendations.md`
   - Apply recommended exclusions (tool-specific)
   - Re-run mutation testing with updated config
   - See component-specific recommendations below
2. **Evaluate new score**
   - If >= target: Success!
   - If not: Decide if gap is acceptable
3. **Document decision**
   - If accepting current score, document rationale
   - List all accepted LOW VALUE survivors
4. **Optional: One more iteration**
   - If high-value survivors discovered after exclusions
   - Run workflow again with updated config

#### If CONTINUE 🔄

**Criteria Met**:
- MAX_ITERATIONS reached, BUT
- HIGH VALUE survivors remain, OR
- Target not reached and progress possible

**Interpretation**: More work needed, re-run workflow

**Next Steps**:
1. **Review HIGH VALUE survivors**
   - Check exclusion analysis for targets
   - Understand why these mutants survived
2. **Re-run workflow**
   - Increase MAX_ITERATIONS if needed
   - Target identified high-value survivors
3. **Estimate iterations needed**
   - Based on HIGH_VALUE_REMAINING count
   - Typically 1-2 more iterations
4. **Consider alternative approaches**
   - Review test quality (weak assertions?)
   - Check if coverage gaps remain
   - Verify tests execute mutated code

### Step 4: Generate Executive Summary

Create concise summary of results:

**For single-component projects**:
```markdown
## Executive Summary

**Module**: $EFFECTIVE_MODULE_PATH
**Status**: $WORKFLOW_STATUS

### Results

| Metric | Value |
|--------|-------|
| Baseline Score | $BASELINE_SCORE% |
| Final Score | $CURRENT_SCORE% |
| **Improvement** | **+<improvement> pp** |
| Target Score | $EFFECTIVE_TARGET_SCORE% |
| Gap to Target | <gap> pp |

### Effort

| Metric | Value |
|--------|-------|
| Iterations | $CURRENT_ITERATION |
| Stop Reason | $STOP_REASON |

### Survivors

| Category | Count |
|----------|-------|
| High-Value (needs attention) | $HIGH_VALUE_REMAINING |
| Low-Value (acceptable) | $LOW_VALUE_REMAINING |
```

**For multi-component projects**:
```markdown
## Executive Summary

**Components Tested**: Backend, Frontend
**Overall Status**: $WORKFLOW_STATUS

### Results by Component

| Component | Language | Tool | Baseline | Final | Improvement | Status |
|-----------|----------|------|----------|-------|-------------|--------|
| Backend | Python | Poodle | 70.2% | 89.9% | +19.7 pp | ✅ SUCCESS |
| Frontend | TypeScript | Stryker | 65.1% | 87.3% | +22.2 pp | ✅ SUCCESS |
| **Overall** | - | - | **67.7%** | **88.6%** | **+21.0 pp** | ✅ SUCCESS |

### Component Details

#### Backend (Python)
- **Mutation Tool**: Poodle
- **Config File**: poodle.toml
- **Starting Score**: 70.2%
- **Final Score**: 89.9%
- **Improvement**: +19.7 pp
- **Iterations**: 3
- **High-Value Survivors**: 2
- **Low-Value Survivors**: 12

#### Frontend (TypeScript)
- **Mutation Tool**: Stryker
- **Config File**: stryker.config.js
- **Starting Score**: 65.1%
- **Final Score**: 87.3%
- **Improvement**: +22.2 pp
- **Iterations**: 4
- **High-Value Survivors**: 5
- **Low-Value Survivors**: 18

### Aggregated Metrics

| Metric | Value |
|--------|-------|
| Total Iterations | $CURRENT_ITERATION |
| Stop Reason | $STOP_REASON |
| Total High-Value Survivors | <sum across components> |
| Total Low-Value Survivors | <sum across components> |
```

### Step 5: Assess Test Quality

Evaluate the quality of work done:

**Quality Indicators**:
- ✅ Tests follow project standards (docstrings, parameterization)
- ✅ Strong assertions used (exact values)
- ✅ Tests organized by behavior
- ✅ Consistent improvement across iterations

**Quality Score**:
- **Excellent**: Average improvement > 5 pp per iteration
- **Good**: Average improvement 2-5 pp per iteration
- **Adequate**: Average improvement < 2 pp per iteration

### Step 6: Generate Tool-Specific Configuration Recommendations

Create config recommendations for each component:

**For multi-component projects**, generate per-component recommendations:

```markdown
## Configuration Recommendations by Component

### Backend (Python - Poodle)

**Config File**: `poodle.toml`

**Recommended Exclusions**:
```toml
[poodle]
skip_mutators = ["String", "FuncCall", "Keyword"]

# Or use inline comments in source code:
# def __init__(  # nomut: Number
#     timeout: int = 300,  # nomut: Number
# ):
```

**Rationale**: Exclude low-value mutations:
- String: Logging messages don't affect behavior
- FuncCall: Logger calls are observability, not logic
- Keyword: Type system artifacts (None → "")

**Estimated Score After Exclusions**: 92.5% (projected)

### Frontend (TypeScript - Stryker)

**Config File**: `stryker.config.js`

**Recommended Exclusions**:
```javascript
module.exports = {
  mutator: {
    excludedMutations: [
      'StringLiteral',
      'ObjectLiteral',
      'ArrayDeclaration'
    ]
  }
}
```

**Rationale**: Exclude low-value mutations:
- StringLiteral: UI text doesn't affect logic
- ObjectLiteral: Default configs are constants
- ArrayDeclaration: Empty array defaults

**Estimated Score After Exclusions**: 90.1% (projected)
```

**For single-component projects**:
```markdown
## Configuration Recommendations

**Config File**: `<tool-specific-config-file>`

**Recommended Exclusions**:
<tool-specific exclusion syntax>

**Rationale**: <explain why these exclusions are recommended>

**Estimated Score After Exclusions**: <projected-score>%
```

### Step 7: Update Mutation Score Tracking

Update the centralized mutation score tracking file (`.claude/mutation-scores.json`) with final results.

**IMPORTANT**: This step automatically updates the tracking file with the workflow results. This ensures all mutation testing is tracked centrally for trend analysis.

First, calculate the metrics needed:

```python
# Calculate improvement
total_improvement = CURRENT_SCORE - BASELINE_SCORE

# Calculate survivors and total mutants (read from final iteration results)
# These values should be available from Phase 03 of the last iteration
```

Then call the update script:

```bash
python scripts/update_mutation_scores.py \
    --module "$EFFECTIVE_MODULE_PATH" \
    --score $CURRENT_SCORE \
    --total $TOTAL_MUTATIONS \
    --killed $MUTATIONS_KILLED \
    --survived $TOTAL_SURVIVORS \
    --timeout $TIMEOUT_COUNT \
    --excluded $EXCLUDED_COUNT \
    --triggered-by "workflow-increase-mutation-score" \
    --notes "Improved from ${BASELINE_SCORE}% to ${CURRENT_SCORE}% (${total_improvement} pp gain) over ${CURRENT_ITERATION} iterations. Status: ${WORKFLOW_STATUS}"
```

Verify the update:

```bash
python -c "
import json
with open('.claude/mutation-scores.json') as f:
    module = json.load(f)['modules']['$EFFECTIVE_MODULE_PATH']
    print(f\"✅ Updated: {module['current_score']['mutation_score']}%\")
    print(f\"   Previous runs: {module['metadata']['runs_count']}\")
    print(f\"   Latest run: {module['current_score']['measured_at']}\")
"
```

**What This Updates**:
- `current_score`: Latest mutation score and metrics
- `history`: Adds new entry with full details
- `metadata.runs_count`: Increments run count
- `summary`: Recalculates tier averages and overall score

**Benefits**:
- Centralized tracking across all workflows and scripts
- Historical trend analysis
- Automatic summary statistics
- Single source of truth for mutation scores

### Step 8: Generate Final Report

Create comprehensive final report.

**Report Structure** (`$RUN_DIR/final-report.md`):

```markdown
# Mutation Score Improvement - Final Report

**Date**: <current-date>
**Module**: $EFFECTIVE_MODULE_PATH
**Workflow**: increase-mutation-score (orchestrator-controlled looping)
**Version**: 3.0.0

---

## Executive Summary

**Status**: $WORKFLOW_STATUS

<if SUCCESS>
✅ **Target Achieved!** Mutation score: $CURRENT_SCORE%

The mutation score has reached or exceeded the target of $EFFECTIVE_TARGET_SCORE%.
All high-value mutants have been addressed, and remaining survivors are documented.
</if>

<if REVIEW>
⚠️ **Diminishing Returns Detected**

The workflow achieved $CURRENT_SCORE% (target: $EFFECTIVE_TARGET_SCORE%).
Exclusion recommendations are available to focus on business logic mutations.
</if>

<if CONTINUE>
🔄 **Additional Iterations Recommended**

The workflow completed $CURRENT_ITERATION iterations, improving from $BASELINE_SCORE% to $CURRENT_SCORE%.
$HIGH_VALUE_REMAINING high-value survivors remain. Re-run workflow to continue progress.
</if>

### Results at a Glance

| Metric | Value | Status |
|--------|-------|--------|
| Baseline Score | $BASELINE_SCORE% | Starting point |
| Final Score | $CURRENT_SCORE% | <emoji> |
| Improvement | +<improvement> pp | <percentage>% gain |
| Target | $EFFECTIVE_TARGET_SCORE% | <reached/gap> |
| Iterations | $CURRENT_ITERATION | Completed |

---

## Detailed Results

<if multi-component>
### Results by Component

| Component | Language | Tool | Score | Survivors | Status |
|-----------|----------|------|-------|-----------|--------|
| Backend | Python | Poodle | 89.9% | 14 | ✅ SUCCESS |
| Frontend | TypeScript | Stryker | 87.3% | 23 | ✅ SUCCESS |
| **Overall** | - | - | **88.6%** | **37** | ✅ SUCCESS |

### Component Details

#### Backend (Python)
- **Mutation Tool**: Poodle
- **Config File**: poodle.toml
- **Starting Score**: 70.2%
- **Final Score**: 89.9%
- **Improvement**: +19.7 pp
- **Iterations**: 3
- **Tests Added**: 12
- **Mutants Killed**: 28

#### Frontend (TypeScript)
- **Mutation Tool**: Stryker
- **Config File**: stryker.config.js
- **Starting Score**: 65.1%
- **Final Score**: 87.3%
- **Improvement**: +22.2 pp
- **Iterations**: 4
- **Tests Added**: 18
- **Mutants Killed**: 35
</if>

### Mutation Score Progression

<table from iteration history>

| Iteration | Before | After | Delta | Decision |
|-----------|--------|-------|-------|----------|
| Baseline  | -      | $BASELINE_SCORE% | -     | -        |
| 1         | X%     | Y%    | +Z pp | LOOP     |
| 2         | Y%     | W%    | +V pp | LOOP     |
| ...       | ...    | ...   | ...   | ...      |
| **$CURRENT_ITERATION** | -      | **$CURRENT_SCORE%** | **+<total> pp** | **$WORKFLOW_STATUS** |

### Survivor Analysis

**Total Survivors**: <count>

| Category | Count | Action |
|----------|-------|--------|
| **HIGH VALUE** (needs attention) | $HIGH_VALUE_REMAINING | <action> |
| **LOW VALUE** (acceptable) | $LOW_VALUE_REMAINING | Document rationale |

<if HIGH_VALUE_REMAINING > 0>
**⚠️ Warning**: $HIGH_VALUE_REMAINING high-value survivors remain.
These indicate test quality gaps in critical business logic.
</if>

<if HIGH_VALUE_REMAINING == 0>
**✅ Success**: All high-value mutants addressed!
Remaining survivors are low-value or excludable.
</if>

---

## Quality Assessment

### Iteration Efficiency

| Iteration | Improvement | Rating |
|-----------|-------------|--------|
| 1         | +X pp       | <rating> |
| 2         | +Y pp       | <rating> |
| ...       | ...         | ...    |

### Overall Quality

<based on average improvement per iteration>

---

## Recommendations

### Immediate Actions

<status-specific recommendations from Step 3>

<if multi-component>
### Configuration Recommendations by Component

#### Backend (Python - Poodle)

**Config File**: `poodle.toml`

**Recommended Exclusions**:
```toml
[poodle]
skip_mutators = ["String", "FuncCall", "Keyword"]
```

**Apply with**:
```bash
# Update poodle.toml with exclusions above
vim poodle.toml

# Re-run mutation testing
python -m poodle
```

**Estimated Score After Exclusions**: 92.5%

#### Frontend (TypeScript - Stryker)

**Config File**: `stryker.config.js`

**Recommended Exclusions**:
```javascript
module.exports = {
  mutator: {
    excludedMutations: ['StringLiteral', 'ObjectLiteral', 'ArrayDeclaration']
  }
}
```

**Apply with**:
```bash
# Update stryker.config.js with exclusions above
vim stryker.config.js

# Re-run mutation testing
cd frontend && npx stryker run
```

**Estimated Score After Exclusions**: 90.1%
</if>

<if single-component>
### Configuration Recommendations

**Config File**: `<tool-config-file>`

**Recommended Exclusions**: See mutation-config-recommendations.md

**Apply with**:
```bash
# Update config file
vim <tool-config-file>

# Re-run mutation testing
<mutation-command>
```
</if>

### Long-Term Improvements

1. **Apply Learnings to Other Modules**
   - Use same exclusion patterns across similar code
   - Apply same test patterns (boundary testing, exact assertions)
   - Target similar modules in same tier

2. **Integrate into CI/CD**
   - Add mutation testing to CI pipeline
   - Set minimum score threshold ($CURRENT_SCORE% or target)
   - Fail builds if score drops

3. **Regular Monitoring**
   - Re-run mutation testing quarterly
   - Track score trends over time
   - Update tests as code evolves

### Next Modules to Target

**Critical Tier** (target: 90%):
- auth/manager.py
- web/api/endpoints.py
- claude/executor.py

**High Tier** (target: 85%):
- storage/operations.py
- bot/handlers/commands.py

---

## Files Generated

All outputs available in: `$OUTPUT_DIR/`

### Phase 00 Outputs
- `baseline-report.md` - Initial mutation testing baseline

### Phase 01-05 Outputs (per iteration)
- `iteration-N-analysis.md` - Survivor analysis
- `iteration-N-tests.md` - Tests added documentation
- `iteration-N-results.md` - Verification results
- `iteration-N-exclusions.md` - Exclusion assessment
- `iteration-N-decision.md` - Loop decision

### Accumulated Outputs
- `iteration-history.md` - Complete iteration history
- `poodle-config-recommendations.md` - Config updates

### Phase 06 Outputs
- `final-report.md` - This comprehensive report

---

## Appendix: Commands Used

### Run Full Workflow
```bash
# All components (auto-detect)
/workflow:run-workflow increase-mutation-score-loop --tier=critical

# Specific components
/workflow:run-workflow increase-mutation-score-loop --components=backend,frontend
```

### Apply Exclusion Recommendations

**Backend (Python - Poodle)**:
```bash
# Update poodle.toml
vim poodle.toml  # Add skip_mutators = ["String", "FuncCall", "Keyword"]

# Re-run mutation testing
python -m poodle
```

**Frontend (TypeScript - Stryker)**:
```bash
# Update stryker.config.js
vim stryker.config.js  # Add excludedMutations array

# Re-run mutation testing
cd frontend && npx stryker run
```

### Re-run Workflow (if CONTINUE status)
```bash
/workflow:run-workflow increase-mutation-score-loop \
  --module-path=$EFFECTIVE_MODULE_PATH \
  --target-score=$EFFECTIVE_TARGET_SCORE \
  --max-iterations=5 \
  --components=backend,frontend
```

---

**Workflow Completed**: <timestamp>
**Status**: $WORKFLOW_STATUS
**Stop Reason**: $STOP_REASON
```

## Outputs

### Files Created
1. **$RUN_DIR/final-report.md**: Comprehensive final report with all recommendations

### Files Updated
- `.claude/mutation-testing-history.json`: Historical tracking

### Parameters Exported
- `COMPLETION_STATUS`: Final workflow status

## Success Criteria

- [ ] Final metrics calculated accurately
- [ ] Workflow status interpreted correctly
- [ ] Status-specific recommendations provided
- [ ] Executive summary generated
- [ ] Quality assessment completed
- [ ] Mutation testing history updated
- [ ] Final report created with actionable next steps

## Error Handling

### Missing Input Files
```
Error: iteration-history.md or exclusion analysis not found
Solution:
1. Verify loop completed successfully
2. Check OUTPUT_DIR path
3. Re-run from Phase 00 if necessary
```

### Invalid Workflow Status
```
Error: WORKFLOW_STATUS is not SUCCESS/CONTINUE/REVIEW
Solution:
1. Check Phase 05 output
2. Verify status determination logic
3. Default to CONTINUE if uncertain
```

## Notes

**Purpose of This Phase**:
- Consolidate all results from iterative improvement
- Provide clear, actionable next steps (tool-specific)
- Document achievements and remaining work
- Create audit trail for future reference
- Support multi-component aggregation

**Status Interpretation**:
- **SUCCESS**: Mission accomplished, celebrate! 🎉
- **REVIEW**: Good progress, apply exclusions to finish
- **CONTINUE**: More work needed, re-run workflow

**Historical Tracking**:
- Mutation testing history enables trend analysis
- Helps identify patterns across workflow runs
- Provides data for project-wide mutation testing strategy

**Multi-Component Support**:
- Workflow supports multiple components (backend + frontend)
- Each component uses its own mutation testing tool
- Results are aggregated for overall project score
- Tool-specific recommendations provided per component
- Configuration driven by `.claude/rules/testing-workflows-config.md`

**Workflow Architecture Note**:
This workflow uses orchestrator-controlled looping (v3.0):
- Phases 01-05 repeat automatically based on SHOULD_CONTINUE
- Each phase runs in its own context window
- Fresh context for each iteration improves quality
- Tool-agnostic and project-agnostic design
