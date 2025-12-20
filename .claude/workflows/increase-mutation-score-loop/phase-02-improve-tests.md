---
phase_metadata:
  execution_mode: sequential

  inputs:
    files:
      - name: ITERATION_ANALYSIS
        required: true
        path: "$RUN_DIR/iteration-$CURRENT_ITERATION-analysis.md"
        description: "Survivor analysis from Phase 01"

    parameters:
      - name: CURRENT_ITERATION
        required: true
        description: "Current iteration number"
        type: integer
      - name: HIGH_VALUE_TARGETS
        required: true
        description: "Number of high-value mutants to target"
        type: integer
      - name: TARGET_LINES
        required: true
        description: "JSON array of line numbers to target"
        type: string
      - name: TARGET_STRATEGIES
        required: true
        description: "JSON array of test strategies"
        type: string
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
      - path: "$RUN_DIR/iteration-$CURRENT_ITERATION-tests.md"
        description: "Documentation of tests added this iteration"

    parameters:
      - name: TESTS_ADDED
        description: "Number of tests added this iteration"
        type: integer
      - name: TESTS_FILE
        description: "Path to test file modified"
        type: string
---

# Phase 02: Improve Tests

**Purpose**: Write high-quality tests to kill the HIGH VALUE mutants identified in Phase 01

**Loop Phase**: This phase is part of the iteration loop (phases 01-05). After test improvement, Phase 03 will verify the improvement.

## Prerequisites

- Phase 01 completed (survivor analysis)
- HIGH VALUE targets identified
- Test strategies documented
- Project test standards understood (`.claude/rules/testing.md`)

## Tasks for Todo List

When starting this phase, add these tasks:

1. Reading Phase 01 analysis and target strategies
2. Identifying test file(s) to modify
3. Writing tests for HIGH VALUE target #1
4. Writing tests for HIGH VALUE target #2
5. (Add one task per HIGH VALUE target)
6. Running tests to verify they pass
7. Verifying tests follow project standards
8. Documenting tests added this iteration

## Parameters Used

### Input Parameters
- **CURRENT_ITERATION**: Iteration number
- **HIGH_VALUE_TARGETS**: Number of targets
- **TARGET_LINES**: JSON array of line numbers
- **TARGET_STRATEGIES**: JSON array of strategies
- **EFFECTIVE_MODULE_PATH**: Module under test
- **OUTPUT_DIR**: Output directory
- **RUN_DIR**: Timestamped run directory from Phase 00

### Output Parameters
- **TESTS_ADDED**: Number of tests added
- **TESTS_FILE**: Test file path modified

## Process

### Step 1: Identify Test File

Determine the test file to modify based on the source module (language-specific conventions).

**Mapping Conventions**:

#### Python
```
Source: src/telegram_claude_bot/<module>/<file>.py
Tests:  tests/<module>/test_<file>.py

Example:
- Source: src/telegram_claude_bot/session/manager.py
- Tests:  tests/session/test_manager.py
```

#### JavaScript/TypeScript (co-located)
```
Source: frontend/src/stores/auth.ts
Tests:  frontend/src/stores/__tests__/auth.test.ts

Or (separate test directory):
Tests:  frontend/tests/stores/auth.test.ts
```

#### Go
```
Source: pkg/session/manager.go
Tests:  pkg/session/manager_test.go (same directory)

Example:
- Source: pkg/session/manager.go
- Tests:  pkg/session/manager_test.go
```

#### Rust
```
Source: src/session/manager.rs
Tests:  Inline in manager.rs or tests/session_tests.rs

Example:
- Source: src/session/manager.rs
- Tests:  #[cfg(test)] mod tests { ... } (inline)
```

**If test file doesn't exist**:
1. Create new test file following language convention
2. Add necessary imports and test setup
3. Create appropriate test structure (language-specific)

### Step 2: Review Existing Tests

Before adding new tests:

1. **Read the test file** to understand existing structure
2. **Identify test classes** that could house new tests
3. **Check for existing coverage** of target lines
4. **Note existing fixtures** that can be reused

**Goal**: Integrate new tests naturally, don't duplicate existing coverage.

### Step 3: Write Tests Following Standards

**MANDATORY** (from `.claude/rules/testing.md`):

#### 3.1: Every Test Has a Docstring

```python
def test_prune_at_exact_boundary():
    """
    Given message count exactly at the pruning limit
    When checking if pruning is needed
    Then pruning should be triggered
    """
```

#### 3.2: Parameterize Similar Tests

If writing 3+ tests for related scenarios:

```python
@pytest.mark.parametrize("count,max_count,should_prune", [
    (4, 5, False),   # Below limit
    (5, 5, True),    # Exact boundary ← Kills mutant
    (6, 5, True),    # Above limit
], ids=["below_limit", "at_boundary", "above_limit"])
def test_prune_boundary_conditions(count, max_count, should_prune):
    """
    Given message count at various levels relative to limit
    When checking if pruning is needed
    Then correct pruning decision should be made
    """
    result = should_prune_messages(count, max_count)
    assert result is should_prune
```

#### 3.3: Strong Assertions

```python
# ❌ BAD: Weak assertions
assert result is not None
assert len(results) > 0

# ✅ GOOD: Strong, exact assertions
assert result == 42
assert result.status == "completed"
assert len(results) == 3
```

#### 3.4: Behavioral Organization

Group tests by behavior in appropriately named classes:

```python
class TestMessagePruning:
    """Tests for message pruning behavior."""

    def test_prunes_at_exact_boundary(self): ...
    def test_preserves_recent_messages(self): ...
    def test_handles_empty_history(self): ...


class TestMessageCounting:
    """Tests for message counting behavior."""

    def test_counts_user_messages_only(self): ...
    def test_excludes_system_messages(self): ...
```

**Language-Specific Test Organization**:

#### TypeScript/JavaScript (Vitest/Jest)
```typescript
describe('MessagePruning', () => {
  it('should prune at exact boundary', () => { ... })
  it('should preserve recent messages', () => { ... })
})

describe('MessageCounting', () => {
  it('should count user messages only', () => { ... })
})
```

#### Go
```go
func TestMessagePruning(t *testing.T) {
    tests := []struct {
        name string
        // test fields
    }{
        {"prunes_at_boundary", ...},
        {"preserves_recent", ...},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) { ... })
    }
}
```

#### Rust
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prunes_at_exact_boundary() { ... }

    #[test]
    fn test_preserves_recent_messages() { ... }
}
```

### Step 4: Target Each HIGH VALUE Mutant

For each HIGH VALUE target from Phase 01 analysis, write tests using language-specific patterns:

#### Pattern: Comparison Boundary (`<=` → `<`)

**Python (pytest)**:
```python
@pytest.mark.parametrize("value,threshold,expected", [
    (threshold - 1, threshold, False),
    (threshold, threshold, True),      # ← Boundary kills mutant
    (threshold + 1, threshold, True),
], ids=["below", "at_boundary", "above"])
def test_comparison_boundary(value, threshold, expected):
    """Exact boundary value should trigger expected behavior."""
    result = compare_function(value, threshold)
    assert result == expected
```

**TypeScript (Vitest)**:
```typescript
it.each([
  [threshold - 1, threshold, false],
  [threshold, threshold, true],      // ← Boundary kills mutant
  [threshold + 1, threshold, true],
])('should handle boundary at %i', (value, threshold, expected) => {
  const result = compareFunction(value, threshold)
  expect(result).toBe(expected)
})
```

**Go (table-driven)**:
```go
func TestComparisonBoundary(t *testing.T) {
    threshold := 5
    tests := []struct {
        name     string
        value    int
        expected bool
    }{
        {"below", threshold - 1, false},
        {"at_boundary", threshold, true},  // ← Boundary kills mutant
        {"above", threshold + 1, true},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := CompareFunction(tt.value, threshold)
            if got != tt.expected {
                t.Errorf("got %v, want %v", got, tt.expected)
            }
        })
    }
}
```

**Rust**:
```rust
#[test]
fn test_comparison_at_boundary() {
    let threshold = 5;
    assert!(!compare_function(threshold - 1, threshold));
    assert!(compare_function(threshold, threshold));  // ← Boundary kills mutant
    assert!(compare_function(threshold + 1, threshold));
}
```

#### Pattern: Increment Operator (`+= 1` → `= 1`)

```python
def test_increment_accumulates_correctly():
    """
    Given multiple operations
    When each increments counter
    Then counter should accumulate (not reset)
    """
    obj = Counter()
    obj.increment()  # count = 1
    obj.increment()  # count = 2
    obj.increment()  # count = 3

    assert obj.count == 3  # Would be 1 with mutant
```

#### Pattern: Boolean Logic (`and` → `or`)

```python
@pytest.mark.parametrize("cond_a,cond_b,expected", [
    (True, True, True),
    (True, False, False),   # ← Kills `and` → `or` mutant
    (False, True, False),   # ← Kills `and` → `or` mutant
    (False, False, False),
], ids=["both_true", "a_only", "b_only", "neither"])
def test_boolean_logic(cond_a, cond_b, expected):
    """Both conditions must be true for result to be true."""
    result = requires_both(cond_a, cond_b)
    assert result == expected
```

#### Pattern: Arithmetic (`+` → `-`)

```python
def test_arithmetic_calculation():
    """
    Given known inputs
    When calculating result
    Then exact value should be returned
    """
    result = calculate(10, 5)
    assert result == 15  # Would be 5 with mutant (10 - 5)
```

### Step 5: Run Tests and Verify

After writing tests, run language-specific test commands (from config).

#### Python (pytest)
```bash
# Run new tests to verify they pass
PYTHONPATH=src pytest tests/<module>/test_<file>.py -v

# Run with coverage to verify target lines are hit
PYTHONPATH=src pytest tests/<module>/test_<file>.py --cov=$EFFECTIVE_MODULE_PATH --cov-report=term-missing

# Verify no regressions in full test suite
PYTHONPATH=src pytest tests/ -q
```

**If tests fail**: Debug with `pytest -vv --tb=long`

#### JavaScript/TypeScript (Vitest)
```bash
# Run specific test file
npm test -- auth.test.ts

# Run with coverage
npm run test:coverage

# Run all tests
npm test
```

**If tests fail**: Check browser console with `npm test -- --reporter=verbose`

#### Go
```bash
# Run specific test
go test ./pkg/session -run TestComparisonBoundary -v

# Run with coverage
go test ./pkg/session -coverprofile=coverage.out

# Run all tests
go test ./...
```

**If tests fail**: Use `go test -v` for verbose output

#### Rust
```bash
# Run specific test
cargo test test_comparison_at_boundary

# Run with output
cargo test -- --show-output

# Run all tests
cargo test
```

**If tests fail**: Use `cargo test -- --nocapture` to see println output

**All tests must pass before proceeding.**

### Step 6: Document Tests Added

Create iteration test documentation.

**Report Structure** (`$RUN_DIR/iteration-$CURRENT_ITERATION-tests.md`):

```markdown
# Iteration $CURRENT_ITERATION - Tests Added

**Date**: <timestamp>
**Test File**: <test file path>

## Summary

| Metric | Value |
|--------|-------|
| Tests Added | $TESTS_ADDED |
| HIGH VALUE Targets | $HIGH_VALUE_TARGETS |
| Test File | $TESTS_FILE |

## Tests Added

### Test 1: `test_<name>`

**Target**: Line $LINE - $MUTATION_TYPE
**Class**: `Test<Behavior>`

**Code**:
```python
<test code>
```

**Kills Mutant**: <original> → <mutated>

---

### Test 2: `test_<name>`

...

## Verification

**Tests Pass**: ✅ All $TESTS_ADDED tests pass
**Coverage Impact**: Lines $TARGET_LINES now covered

## Quality Checklist

- [x] All tests have docstrings (Given/When/Then)
- [x] Similar tests are parameterized
- [x] Strong, exact assertions used
- [x] Tests organized by behavior
- [x] All tests pass
```

## Outputs

### Files Created
1. **$RUN_DIR/iteration-$CURRENT_ITERATION-tests.md**: Test documentation

### Files Modified
- Test file(s) with new tests

### Parameters Exported
- `TESTS_ADDED`: Number of tests added
- `TESTS_FILE`: Path to modified test file

## Success Criteria

- [ ] Test file identified/created
- [ ] Existing tests reviewed
- [ ] New tests written for each HIGH VALUE target
- [ ] Tests follow project standards (docstrings, parameterization)
- [ ] All tests pass
- [ ] Target lines are covered by tests
- [ ] Test documentation created
- [ ] TESTS_ADDED count exported

## Error Handling

### Tests Fail
```
Error: New tests are failing
Solution:
1. Review test logic with pytest -vv --tb=long
2. Check assertions match expected behavior
3. Verify fixtures provide correct data
4. Fix and re-run
```

### No HIGH VALUE Targets
```
If HIGH_VALUE_TARGETS == 0:
  Log: "No high-value targets to address"
  Set TESTS_ADDED = 0
  Skip to Phase 03
```

### Coverage Not Increasing
```
Warning: Target lines still not covered after adding tests
Possible causes:
1. Tests don't exercise the target code path
2. Conditional logic prevents execution
3. Wrong function/method being tested

Solution:
1. Add debug logging to verify path execution
2. Adjust test inputs to trigger target paths
3. Review code to understand execution conditions
```

## Notes

**Test Quality > Quantity**:
- Write 3 excellent tests rather than 10 weak ones
- Each test should have a clear purpose
- Avoid testing implementation details

**Parameterization Guidelines**:
- Use when 3+ tests share structure
- Always include descriptive `ids`
- Cover: boundary, typical, edge cases

**Typical Tests Per Iteration**:
- Iteration 1: 8-15 tests (addressing coverage gaps)
- Iteration 2: 5-10 tests (harder edge cases)
- Iteration 3: 3-5 tests (remaining targets)

**Assertion Strength**:
- Use exact values: `assert result == 42`
- Use specific comparisons: `assert result.status == "active"`
- Avoid vague checks: `assert result` (too weak)
