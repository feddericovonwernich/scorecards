---
phase_metadata:
  execution_mode: sequential

  inputs:
    parameters:
      - name: BASELINE_COVERAGE
        required: true
        description: "Starting coverage from prerequisites phase"
        type: number
      - name: NEW_COVERAGE
        required: true
        description: "Final coverage achieved"
        type: number
      - name: STOP_REASON
        required: true
        description: "Reason loop was exited"
        type: string
      - name: LOOP_INDEX
        required: true
        description: "Total iterations completed"
        type: integer
      - name: HISTORY_FILE
        required: false
        default: ".claude/coverage-improvement-history.json"
        description: "Path to history file"
        type: file
      - name: OUTPUT_DIR
        required: false
        default: ".claude/workflows/coverage-improvement-loop"
        description: "Output directory"
        type: directory
      - name: TARGET_COVERAGE
        required: false
        default: 80
        description: "Target overall coverage"
        type: number
      - name: CRITICAL_TIER_TARGET
        required: false
        default: 90
        description: "Critical tier target"
        type: number
      - name: HIGH_RISK_TIER_TARGET
        required: false
        default: 80
        description: "High-risk tier target"
        type: number
      - name: STANDARD_TIER_TARGET
        required: false
        default: 60
        description: "Standard tier target"
        type: number

  outputs:
    files:
      - path: "$OUTPUT_DIR/coverage-improvement-report-$RUN_ID.md"
        description: "Comprehensive final report"
---

# Phase 06: Final Report

**Purpose**: Generate comprehensive coverage improvement report with summary statistics, recommendations, and next steps based on workflow outcomes.

## Prerequisites
- All iterations completed (loop exited via decision phase)
- History file updated with all iterations
- STOP_REASON indicates why loop exited

## Tasks for Todo List
When starting this phase, add these tasks:
1. Loading component configuration
2. Loading complete iteration history from JSON file
3. Calculating total metrics (tests added, coverage gained)
4. Analyzing iteration-by-iteration trends
5. Determining final tier-level coverage status
6. Aggregating multi-component results (if applicable)
7. Generating summary statistics table
8. Writing recommendations based on stop reason
9. Creating comprehensive markdown report
10. Suggesting next steps (mutation testing, manual review, etc.)

## Parameters Used
- **BASELINE_COVERAGE**: Starting coverage (e.g., 31.0)
- **NEW_COVERAGE**: Final coverage (e.g., 78.5)
- **STOP_REASON**: Why loop exited (e.g., "targets_achieved")
- **LOOP_INDEX**: Total iterations (e.g., 12)
- **HISTORY_FILE**: Path to history JSON
- **OUTPUT_DIR**: Where to write report
- **TARGET_COVERAGE**: Overall target (e.g., 80)
- **CRITICAL_TIER_TARGET**: Critical target (e.g., 90)
- **HIGH_RISK_TIER_TARGET**: High-risk target (e.g., 80)
- **STANDARD_TIER_TARGET**: Standard target (e.g., 60)

## Process

### Step 1: Load Complete History

Read full iteration history from JSON file:

```python
import json
import os
from datetime import datetime

history_file = os.environ.get('HISTORY_FILE', '.claude/coverage-improvement-history.json')

with open(history_file, 'r') as f:
    history = json.load(f)

# Find current run
run_id = os.environ.get('RUN_ID')
current_run = next(run for run in history['workflow_runs'] if run['run_id'] == run_id)
iterations = current_run['iterations']
```

### Step 2: Calculate Total Metrics

Aggregate metrics across all iterations:

```python
total_tests_added = sum(it['tests_added'] for it in iterations)
total_coverage_gained = sum(it['coverage_gained'] for it in iterations)
total_files_improved = len(set(file for it in iterations for file in it.get('files_improved', [])))

# Calculate average ROI
avg_roi = sum(it['roi'] for it in iterations) / len(iterations) if iterations else 0

# Calculate duration
start_time = datetime.fromisoformat(current_run['start_time'])
end_time = datetime.fromisoformat(current_run['end_time'])
duration = end_time - start_time
```

### Step 3: Load Component Configuration and Get Final Coverage

Load component config and run final coverage measurement:

```python
def load_component_config(component_name: str = "backend") -> dict:
    """Load component config from testing-workflows-config.md."""
    config_path = ".claude/rules/testing-workflows-config.md"

    with open(config_path, 'r') as f:
        content = f.read()

    if component_name == "backend":
        return {
            "language": "python",
            "package_name": "telegram_claude_bot",
            "coverage_command": "PYTHONPATH=src pytest tests/ --cov=telegram_claude_bot --cov-report=json:coverage_final.json -q",
            "coverage_file": "coverage_final.json"
        }
    elif component_name == "frontend":
        return {
            "language": "typescript",
            "package_name": "claude-workspaces-dashboard",
            "coverage_command": "cd frontend && npm run test:coverage -- --reporter=json",
            "coverage_file": "frontend/coverage/coverage-final.json"
        }
    else:
        raise ValueError(f"Unknown component: {component_name}")

# Detect which components were used in this run
components_used = set()
for iteration in iterations:
    for test_file in iteration.get('test_files_created', '').split(','):
        if test_file.startswith('tests/'):
            components_used.add('backend')
        elif test_file.startswith('frontend/'):
            components_used.add('frontend')

# Run coverage for each component
component_coverage = {}
for component in components_used:
    config = load_component_config(component)
    # Run coverage command
    os.system(config['coverage_command'])
    # Parse coverage file (use tier categorization from phase-01)
    component_coverage[component] = parse_coverage_by_tier(config['coverage_file'], component)
```

### Step 4: Generate Summary Statistics Table

Create overview table for report:

```markdown
## Summary Statistics

| Metric | Value |
|--------|-------|
| **Starting Coverage** | 31.0% |
| **Final Coverage** | 78.5% |
| **Coverage Gained** | +47.5% |
| **Total Iterations** | 12 |
| **Total Tests Added** | 156 |
| **Total Files Improved** | 38 |
| **Average ROI** | 0.305% per test |
| **Duration** | 2h 15m |
| **Stop Reason** | Targets achieved ✓ |
```

### Step 5: Generate Tier Status Table

Show final tier-level coverage vs targets (per component if multi-component):

```markdown
## Coverage by Tier

### Backend (Python)

| Tier | Starting | Final | Target | Status |
|------|----------|-------|--------|--------|
| **Critical** | 45.0% | 92.3% | 90.0% | ✅ Met |
| **High-Risk** | 35.0% | 81.5% | 80.0% | ✅ Met |
| **Standard** | 25.0% | 62.1% | 60.0% | ✅ Met |
| **Overall** | 31.0% | 78.5% | 80.0% | ⚠️ Close |

**Interpretation**: All tier targets met! Overall target nearly achieved.

### Frontend (TypeScript)

| Tier | Starting | Final | Target | Status |
|------|----------|-------|--------|--------|
| **Critical** | 30.0% | 85.0% | 90.0% | ⚠️ Close |
| **High-Risk** | 20.0% | 78.0% | 80.0% | ⚠️ Close |
| **Standard** | 15.0% | 65.0% | 60.0% | ✅ Met |
| **Overall** | 22.0% | 76.0% | 70.0% | ✅ Met |

**Interpretation**: Overall target met! Critical tier needs 5% more.

### Combined

| Metric | Value |
|--------|-------|
| **Backend Overall** | 78.5% |
| **Frontend Overall** | 76.0% |
| **Weighted Average** | 77.5% |
```

### Step 6: Create Iteration Timeline

Show iteration-by-iteration progress:

```markdown
## Iteration Timeline

| Iteration | Coverage | Gained | Tests Added | ROI | Files |
|-----------|----------|--------|-------------|-----|-------|
| 1 | 31.0% → 35.2% | +4.2% | 18 | 0.233 | 5 |
| 2 | 35.2% → 40.1% | +4.9% | 15 | 0.327 | 5 |
| 3 | 40.1% → 45.8% | +5.7% | 12 | 0.475 | 4 |
| ... | ... | ... | ... | ... | ... |
| 12 | 75.3% → 78.5% | +3.2% | 8 | 0.400 | 3 |

**Trend**: ROI remained healthy throughout iterations.
```

### Step 7: List Top Improved Files

Identify files with largest coverage improvements (per component):

```markdown
## Top 10 Most Improved Files

### Backend (Python)

1. **src/${PACKAGE_NAME}/auth/manager.py**: 45% → 92% (+47%)
2. **src/${PACKAGE_NAME}/web/api/auth.py**: 50% → 88% (+38%)
3. **src/${PACKAGE_NAME}/session/models.py**: 40% → 75% (+35%)
4. **src/${PACKAGE_NAME}/claude/executor.py**: 35% → 68% (+33%)
5. **src/${PACKAGE_NAME}/storage/database.py**: 30% → 62% (+32%)

### Frontend (TypeScript)

6. **frontend/src/stores/auth.ts**: 20% → 90% (+70%)
7. **frontend/src/api/client.ts**: 30% → 85% (+55%)
8. **frontend/src/stores/workspaces.ts**: 25% → 75% (+50%)
9. **frontend/src/composables/useAuth.ts**: 0% → 40% (+40%)
10. **frontend/src/router/index.ts**: 40% → 75% (+35%)
```

### Step 8: Generate Recommendations

Provide next steps based on stop reason:

**If STOP_REASON = "targets_achieved"**:
```markdown
## Recommendations

✅ **Success**: All coverage targets have been achieved!

### Next Steps

1. **Mutation Testing**: Run `/increase-mutation-score` to verify test quality
   - Target mutation score: 85%+
   - Focus on critical tier first

2. **Code Review**: Review newly generated tests for quality
   - Verify all tests have docstrings
   - Check for proper parameterization
   - Ensure strong assertions

3. **CI/CD Integration**: Add coverage gates to CI pipeline
   - Require 80%+ coverage on PRs
   - Fail builds below 60% coverage
```

**If STOP_REASON = "diminishing_returns"**:
```markdown
## Recommendations

⚠️ **Diminishing Returns Detected**: Coverage improvement has slowed significantly.

### Current Status
- Achieved: ${NEW_COVERAGE}%
- Remaining gap to target: ${TARGET_COVERAGE - NEW_COVERAGE}%

### Next Steps

1. **Manual Review**: Identify remaining uncovered code
   - Run: `pytest --cov --cov-report=html`
   - Review: `htmlcov/index.html` for missing lines

2. **Evaluate Necessity**: Determine if remaining gaps are worth testing
   - Skip framework internals
   - Skip auto-generated code
   - Focus on business logic

3. **Targeted Improvement**: Manually write tests for specific high-value gaps
   - Review coverage report for critical paths
   - Prioritize error handling and validation
```

**If STOP_REASON = "max_iterations"**:
```markdown
## Recommendations

🛑 **Max Iterations Reached**: Workflow stopped at safety limit.

### Current Status
- Achieved: ${NEW_COVERAGE}%
- Iterations: ${LOOP_INDEX}
- Remaining gap: ${TARGET_COVERAGE - NEW_COVERAGE}%

### Analysis
The workflow reached the maximum iteration limit before achieving all targets. This suggests:
- Remaining coverage gaps are difficult to test
- Generated tests may not be covering new lines effectively
- Manual intervention may be needed

### Next Steps

1. **Review Last Iterations**: Check if ROI is declining
   - If ROI < 0.2, remaining gaps may require manual tests

2. **Identify Blockers**: Find files that consistently appear in priority list but don't improve
   - These may have complex dependencies
   - May require integration tests or mocking

3. **Increase MAX_ITERATIONS** (if justified):
   ```bash
   /run-workflow coverage-improvement-loop --max-iterations=30
   ```

4. **Manual Test Writing**: For remaining high-value gaps
```

**If STOP_REASON = "test_failures" or "regression"**:
```markdown
## Recommendations

❌ **Test Failures Detected**: Workflow stopped due to test errors.

### Action Required

1. **Review Test Failures**: Check test output for details
   - Run: `pytest tests/ -v --tb=long`
   - Identify failing tests

2. **Fix Failing Tests**: Address test errors
   - If newly generated tests are failing, they may have:
     - Incorrect assumptions
     - Missing fixtures/dependencies
     - Syntax errors

3. **Re-run Workflow**: After fixing tests
   ```bash
   /run-workflow coverage-improvement-loop
   ```
```

### Step 9: Write Comprehensive Report

Generate full markdown report at `$OUTPUT_DIR/coverage-improvement-report-$RUN_ID.md`:

```markdown
# Coverage Improvement Report

**Generated**: <timestamp>
**Run ID**: <run_id>
**Duration**: <duration>

## Executive Summary

This workflow iteratively improved test coverage from ${BASELINE_COVERAGE}% to ${NEW_COVERAGE}%, gaining ${total_coverage_gained}% coverage through ${LOOP_INDEX} iterations.

**Key Achievements**:
- ✅ Added ${total_tests_added} new test functions
- ✅ Improved ${total_files_improved} source files
- ✅ Average ROI: ${avg_roi}% per test
- <status_icon> ${STOP_REASON}

... (include all sections from above)

---

**Generated by**: `/run-workflow coverage-improvement-loop`
**History file**: ${HISTORY_FILE}
```

## Outputs

**Files Created**:
- `$OUTPUT_DIR/coverage-improvement-report-$RUN_ID.md`: Comprehensive final report

**Parameters Discovered**: None (this is the final phase)

## Success Criteria
- [ ] History file loaded successfully
- [ ] Total metrics calculated correctly
- [ ] Tier-level final coverage measured
- [ ] Summary statistics generated
- [ ] Recommendations tailored to stop reason
- [ ] Comprehensive report written to file
- [ ] Next steps clearly documented

## Error Handling

**History File Not Found**:
- If history file doesn't exist (shouldn't happen)
- Log error and create minimal report with available parameters
- Include warning in report about incomplete data

**Coverage Measurement Fails**:
- If final coverage measurement fails
- Use NEW_COVERAGE from last iteration
- Add note in report about using cached value

**Report Write Fails**:
- If unable to write report file (permissions, disk full)
- Try alternate location (current directory)
- Log error but don't fail workflow

## Notes

**Report Persistence**: The final report is timestamped and preserved in OUTPUT_DIR for historical reference.

**History File**: Contains complete iteration history and can be used for:
- Tracking improvement over multiple runs
- Analyzing ROI trends
- Identifying problematic files

**Next Workflow Suggestions**:
- If targets met → Suggest `/increase-mutation-score`
- If diminishing returns → Suggest manual review
- If failures → Suggest fixing tests and re-running
- If max iterations → Suggest analysis and adjustment

**Report Format**: The report is markdown for easy reading and can be converted to HTML/PDF if needed.
