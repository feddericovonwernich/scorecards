---
phase_metadata:
  execution_mode: sequential

  inputs:
    files:
      - name: BASELINE_REPORT
        required: true
        path: "$RUN_DIR/baseline-report.md"
        description: "Baseline mutation testing results"
      - name: PREVIOUS_ITERATION
        required: false
        path: "$RUN_DIR/iteration-$PREVIOUS_ITERATION_NUM-results.md"
        description: "Previous iteration results (if looping)"

    parameters:
      - name: CURRENT_ITERATION
        required: true
        description: "Current iteration number (auto-managed by orchestrator)"
        type: integer
        default: 1
      - name: CURRENT_SCORE
        required: true
        description: "Current mutation score (from baseline or previous iteration)"
        type: number
      - name: SURVIVED_COUNT
        required: true
        description: "Current number of surviving mutants"
        type: integer
      - name: EFFECTIVE_MODULE_PATH
        required: true
        description: "Module being tested"
        type: string
      - name: EFFECTIVE_TARGET_SCORE
        required: true
        description: "Target mutation score"
        type: number
      - name: OUTPUT_DIR
        required: true
        description: "Output directory"
        type: directory
      - name: RUN_DIR
        required: true
        description: "Timestamped run directory from Phase 00"
        type: string
      - name: CONFIG_FILE
        required: false
        default: ".claude/rules/testing-workflows-config.md"
        description: "Testing workflows configuration file"
        type: file
      - name: COMPONENT_NAME
        required: true
        description: "Component being tested"
        type: string
      - name: DETECTED_LANGUAGE
        required: true
        description: "Auto-detected programming language"
        type: string
      - name: DETECTED_MUTATION_TOOL
        required: true
        description: "Auto-detected mutation testing tool"
        type: string

  outputs:
    files:
      - path: "$RUN_DIR/iteration-$CURRENT_ITERATION-analysis.md"
        description: "Survivor analysis for this iteration"

    parameters:
      - name: HIGH_VALUE_TARGETS
        description: "Count of high-value mutants to target"
        type: integer
      - name: MEDIUM_VALUE_COUNT
        description: "Count of medium-value mutants"
        type: integer
      - name: LOW_VALUE_COUNT
        description: "Count of low-value mutants (acceptable)"
        type: integer
      - name: EXCLUDE_COUNT
        description: "Count of mutants recommended for exclusion"
        type: integer
      - name: TARGET_LINES
        description: "JSON array of line numbers to target with tests"
        type: string
      - name: TARGET_STRATEGIES
        description: "JSON array of test strategies for each target"
        type: string
---

# Phase 01: Analyze Survivors

**Purpose**: Analyze surviving mutants and categorize them by value to prioritize test improvements

**Loop Phase**: This phase is part of the iteration loop (phases 01-05). The orchestrator will loop back to this phase if SHOULD_CONTINUE=true after Phase 05.

## Prerequisites

- Phase 00 completed (baseline established)
- Current mutation score and survivor count available
- Poodle configuration is valid

## Tasks for Todo List

When starting this phase, add these tasks:

1. Reading current mutation testing state
2. Running coverage analysis for missing lines
3. Extracting surviving mutant details from Poodle
4. Categorizing survivors by value (EXCLUDE/LOW/MEDIUM/HIGH)
5. Prioritizing HIGH VALUE targets for test improvement
6. Documenting target strategies for Phase 02
7. Generating iteration analysis report

## Parameters Used

### Input Parameters
- **CURRENT_ITERATION**: Iteration number (1, 2, 3, ...)
- **CURRENT_SCORE**: Current mutation score percentage
- **SURVIVED_COUNT**: Number of surviving mutants
- **EFFECTIVE_MODULE_PATH**: Module under test
- **EFFECTIVE_TARGET_SCORE**: Target score to achieve
- **OUTPUT_DIR**: Output directory
- **RUN_DIR**: Timestamped run directory from Phase 00
- **CONFIG_FILE**: Testing workflows configuration file
- **COMPONENT_NAME**: Component being tested
- **DETECTED_LANGUAGE**: Auto-detected programming language
- **DETECTED_MUTATION_TOOL**: Auto-detected mutation testing tool

### Output Parameters
- **HIGH_VALUE_TARGETS**: Count of high-value mutants
- **MEDIUM_VALUE_COUNT**: Count of medium-value mutants
- **LOW_VALUE_COUNT**: Count of low-value mutants
- **EXCLUDE_COUNT**: Count of mutants to exclude
- **TARGET_LINES**: JSON array of lines to target
- **TARGET_STRATEGIES**: JSON array of test strategies

## Process

### Step 1: Log Iteration Start

**Output**:
```
════════════════════════════════════════════════════════════════
ITERATION $CURRENT_ITERATION - ANALYZE SURVIVORS
════════════════════════════════════════════════════════════════

Current Status:
- Mutation Score: $CURRENT_SCORE%
- Survivors: $SURVIVED_COUNT
- Target: $EFFECTIVE_TARGET_SCORE%
- Gap: <gap> percentage points
```

### Step 2: Run Coverage Analysis

Identify lines not covered by tests to understand coverage gaps.

Use coverage commands from config file (component-specific).

#### Python (pytest-cov)
```bash
# Run detailed coverage analysis
PYTHONPATH=src pytest tests/ \
  --cov=$EFFECTIVE_MODULE_PATH \
  --cov-report=term-missing \
  --cov-report=json

# Extract missing lines for target module
python -c "
import json
with open('coverage.json') as f:
    data = json.load(f)
    for file_path, info in data['files'].items():
        if '$EFFECTIVE_MODULE_PATH' in file_path or file_path.endswith('$EFFECTIVE_MODULE_PATH'):
            missing = info.get('missing_lines', [])
            print(f'Missing lines: {missing}')
            print(f'Coverage: {info.get(\"summary\", {}).get(\"percent_covered\", 0):.1f}%')
"
```

#### JavaScript/TypeScript (Vitest/Jest)
```bash
# Run coverage analysis
cd frontend && npm run test:coverage

# Extract missing lines from coverage-final.json
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('frontend/coverage/coverage-final.json'));
// Parse uncovered lines for target file
"
```

#### Go (go test)
```bash
# Run coverage for specific package
go test ./$MODULE_PATH -coverprofile=coverage.out

# View uncovered lines
go tool cover -func=coverage.out | grep -v "100.0%"
```

#### Rust (cargo-tarpaulin / llvm-cov)
```bash
# Run coverage analysis
cargo tarpaulin --out Json --packages $PACKAGE_NAME

# Or with llvm-cov
cargo llvm-cov --json --package $PACKAGE_NAME
```

### Step 3: Extract Surviving Mutant Details

Get details of all surviving mutants from mutation testing tool (tool-specific parsing).

For each survivor, extract:
- Mutant ID
- Line number
- Original code → Mutated code
- Mutation type (tool-specific categories)
- Function/method name where mutation occurs

#### Python (Poodle)
**From Poodle output or JSON report**:

Mutation types: String, Keyword, Compare, BinOp, UnaryOp, FuncCall, Number

#### Python (mutmut)
**From mutmut results**:

Parse with `mutmut show <id>` for each survivor

#### JavaScript/TypeScript (Stryker)
**From `reports/mutation/mutation.json`**:

```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('reports/mutation/mutation.json'));
data.files.forEach(file => {
  file.mutants.filter(m => m.status === 'Survived').forEach(mutant => {
    console.log(`Line ${mutant.location.start.line}: ${mutant.mutatorName}`);
    console.log(`Original: ${mutant.originalCode}`);
    console.log(`Mutated: ${mutant.mutatedCode}`);
  });
});
```

Mutation types: ArithmeticOperator, ConditionalExpression, LogicalOperator, etc.

#### Go (gremlins)
**From gremlins output**:

Parse stdout or `.gremlins.json` for survivors

#### Rust (cargo-mutants)
**From `mutants.out/` directory**:

Parse individual mutant directories and test results

**Example survivors** (language-agnostic format):
```
ID  | Line | Type      | Original          | Mutated
----|------|-----------|-------------------|------------------
1   | 45   | Compare   | count <= max      | count < max
2   | 72   | BinOp     | total + 1         | total - 1
3   | 89   | String    | "Processing..."   | ""
4   | 103  | Keyword   | return None       | return ""
```

### Step 4: Categorize Survivors by Value

Apply proven categorization rules from the session/manager.py success (89.9% achievement):

#### Category: EXCLUDE (add to skip_mutators)

**Mutations that should be excluded project-wide**:

1. **String Mutations**
   - Log messages, error strings, docstrings
   - No functional impact
   - Example: `"Processing item"` → `""`

2. **FuncCall Mutations** (in logging contexts)
   - `logger.info()` → `logger.debug()`
   - Logging function calls
   - No business logic impact

3. **Keyword Mutations** (type system artifacts)
   - `return None` → `return ""`
   - Type coercion edge cases
   - Minimal ROI

#### Category: LOW VALUE (accept as survivors)

**Mutations with legitimate reasons to survive**:

1. **Defensive Code Fallbacks**
   - `result.scalar() or 0` → `result.scalar() or 1`
   - Database never returns None, but defensive
   - Document as defensive programming

2. **Error Recovery Paths**
   - Exception handling mutations
   - Rollback mechanisms
   - Rarely executed paths

3. **Constraint Violation Detection**
   - Integrity error handling
   - Already tested by other means

#### Category: MEDIUM VALUE (test if time permits)

1. **Edge Case Arithmetic**
   - `.limit(1)` → `.limit(2)`
   - Pagination edge cases
   - Low probability bugs

2. **Array Indexing**
   - `row[0]` → `row[-1]`
   - Minor data access variations

#### Category: HIGH VALUE (must fix) ⭐

**These indicate real test quality gaps**:

1. **Comparison Boundaries**
   - `<=` → `<` (off-by-one bugs)
   - `>=` → `>` (boundary conditions)
   - **Test strategy**: Boundary value testing

2. **Increment/Decrement Operators**
   - `+= 1` → `= 1` (state mutations)
   - `count += 1` → `count -= 1`
   - **Test strategy**: State verification tests

3. **Business Logic**
   - Core calculations
   - Validation rules
   - **Test strategy**: Exact value assertions

4. **Boolean Logic**
   - `and` → `or`
   - `not x` → `x`
   - **Test strategy**: Truth table testing

### Step 5: Generate Target Strategies

For each HIGH VALUE survivor, create a test strategy:

**Strategy Template**:
```markdown
### Target: Line $LINE - $MUTATION_TYPE

**Original**: `$ORIGINAL_CODE`
**Mutant**: `$MUTATED_CODE`

**Why High Value**: <explanation>

**Test Strategy**:
1. Test case that would fail with mutant but pass with original
2. Input values that expose the difference
3. Expected assertions

**Example Test**:
```python
def test_<behavior>_boundary_condition():
    """
    Given <precondition>
    When <action>
    Then <expected with original> (would fail with mutant)
    """
    result = function_under_test(boundary_input)
    assert result == exact_expected_value
```
```

### Step 6: Generate Iteration Analysis Report

Create analysis report for this iteration.

**Report Structure** (`$RUN_DIR/iteration-$CURRENT_ITERATION-analysis.md`):

```markdown
# Iteration $CURRENT_ITERATION - Survivor Analysis

**Date**: <timestamp>
**Module**: $EFFECTIVE_MODULE_PATH
**Current Score**: $CURRENT_SCORE%

## Summary

| Category | Count | Action |
|----------|-------|--------|
| **HIGH VALUE** | $HIGH_VALUE_TARGETS | Target in Phase 02 |
| MEDIUM VALUE | $MEDIUM_VALUE_COUNT | Optional |
| LOW VALUE | $LOW_VALUE_COUNT | Accept |
| EXCLUDE | $EXCLUDE_COUNT | Skip in tool config |
| **Total Survivors** | $SURVIVED_COUNT | |

## Coverage Analysis

**Missing Lines**: <list>
**Coverage on Target Module**: <percentage>%

## HIGH VALUE Targets (Must Fix)

<for each high-value target>
### Target $N: Line $LINE

**Type**: $MUTATION_TYPE
**Original**: `$ORIGINAL_CODE`
**Mutant**: `$MUTATED_CODE`
**Function**: `$FUNCTION_NAME`

**Test Strategy**:
$STRATEGY

</for each>

## LOW VALUE Survivors (Accept)

<list with brief rationale>

## EXCLUDE Recommendations

<list mutation types to add to skip_mutators>

## Targets for Phase 02

The following lines should be targeted with new tests:
$TARGET_LINES

Test strategies:
$TARGET_STRATEGIES
```

## Outputs

### Files Created
1. **$RUN_DIR/iteration-$CURRENT_ITERATION-analysis.md**: Detailed survivor analysis

### Parameters Exported
- `HIGH_VALUE_TARGETS`: Number of high-value mutants to fix
- `MEDIUM_VALUE_COUNT`: Medium-value mutant count
- `LOW_VALUE_COUNT`: Low-value mutant count
- `EXCLUDE_COUNT`: Mutants to exclude
- `TARGET_LINES`: JSON array of line numbers
- `TARGET_STRATEGIES`: JSON array of strategies

## Success Criteria

- [ ] Coverage analysis completed
- [ ] All survivors extracted from Poodle results
- [ ] Survivors categorized by value
- [ ] HIGH VALUE targets identified
- [ ] Test strategies documented
- [ ] Analysis report generated
- [ ] Target parameters exported for Phase 02

## Error Handling

### No Survivors
```
If SURVIVED_COUNT == 0:
  Log: "No survivors to analyze - workflow complete!"
  Set HIGH_VALUE_TARGETS = 0
  Proceed to Phase 05 for decision
```

### Coverage Data Missing
```
Error: Coverage data file not found
Solution:
1. Run coverage command from config (tool-specific)
2. Verify coverage output format and location
3. Retry analysis
```

### Mutation Testing Results Unavailable
```
Error: Cannot extract survivor details
Solution:
1. Re-run mutation testing (tool-specific command)
2. Check tool configuration for output format
3. Verify output file locations
4. Retry analysis
```

## Notes

**Categorization Rationale**:
- HIGH VALUE: Exposes real bugs that could affect users
- MEDIUM VALUE: Edge cases with lower probability impact
- LOW VALUE: Defensive code or rarely-executed paths
- EXCLUDE: No business value (logging, type artifacts)

**Iteration Expectations**:
- Iteration 1: Typically 5-10 HIGH VALUE targets
- Iteration 2+: Typically 2-5 HIGH VALUE targets
- Diminishing returns are normal

**Quality Focus**:
- Better to kill 3 high-value mutants than 10 low-value ones
- Focus on business logic, not logging/error messages
- Document why low-value survivors are acceptable
