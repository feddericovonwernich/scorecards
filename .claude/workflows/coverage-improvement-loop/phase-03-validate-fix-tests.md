---
phase_metadata:
  execution_mode: sequential

  inputs:
    parameters:
      - name: TEST_FILES_CREATED
        required: true
        description: "Comma-separated list of test files from Phase 02"
        type: string
      - name: TESTS_ADDED
        required: true
        description: "Number of tests added by Phase 02"
        type: integer
      - name: LOOP_INDEX
        required: true
        description: "Current iteration number"
        type: integer
      - name: MAX_FIX_ATTEMPTS
        required: false
        default: 3
        description: "Maximum fix attempts per iteration"
        type: integer

  outputs:
    files:
      - path: "$OUTPUT_DIR/run-$RUN_ID/iteration-$LOOP_INDEX-validation.md"
        description: "Test validation and fixing report"
    parameters:
      - name: VALIDATED_TESTS_COUNT
        description: "Number of tests that pass after fixing"
        type: integer
      - name: DELETED_TESTS_COUNT
        description: "Number of unfixable tests deleted"
        type: integer
      - name: FIXED_TESTS_COUNT
        description: "Number of tests successfully fixed"
        type: integer
      - name: FIX_SUCCESS_RATE
        description: "Percentage of broken tests successfully fixed"
        type: number
      - name: VALIDATION_PASSED
        description: "Whether all remaining tests pass"
        type: boolean
---

# Phase 03: Validate and Fix Generated Tests

**Purpose**: Run full test execution on newly generated tests, categorize failures, apply targeted fixes, and remove unfixable tests to ensure clean tests reach Phase 04.

## Prerequisites
- Phase 02 completed with TEST_FILES_CREATED and TESTS_ADDED
- Test runner available (pytest, npm test, go test, etc.)
- Source code accessible for signature inspection
- Component config loaded from `.claude/rules/testing-workflows-config.md`

## Tasks for Todo List
When starting this phase, add these tasks:
1. Loading component configuration
2. Running full test execution on generated test files
3. Parsing and categorizing test failures
4. Applying fixes for import errors
5. Applying fixes for API signature mismatches
6. Applying fixes for async mock issues
7. Applying fixes for missing fixtures
8. Deleting unfixable tests (assertion errors, other)
9. Re-running tests to verify fixes
10. Generating validation report
11. Exporting validation parameters

## Parameters Used
- **TEST_FILES_CREATED**: Comma-separated test file paths (e.g., "tests/web/test_server.py,tests/container/test_manager.py")
- **TESTS_ADDED**: Number of tests added by Phase 02 (e.g., 43)
- **LOOP_INDEX**: Current iteration number (e.g., 1)
- **MAX_FIX_ATTEMPTS**: Maximum retry attempts (default: 3)

## Process

### Step 0: Load Component Configuration

Load component-specific test commands from config file:

```python
import re

def load_component_config(test_file: str) -> dict:
    """
    Extract component config from testing-workflows-config.md.
    Returns dict with: language, package_name, test_command, collect_command, fixtures
    """
    config_path = ".claude/rules/testing-workflows-config.md"

    with open(config_path, 'r') as f:
        content = f.read()

    # Detect component based on test file path
    if test_file.startswith("tests/"):
        # Backend (Python)
        component_section = re.search(
            r'## Component: Backend \(Python\).*?(?=## Component:|---|\Z)',
            content, re.DOTALL
        ).group(0)

        return {
            "language": "python",
            "package_name": "telegram_claude_bot",
            "test_command": "PYTHONPATH=src pytest {test_files} -v --tb=short",
            "collect_command": "PYTHONPATH=src pytest {test_files} --collect-only -q",
            "fixtures": ["db_session", "test_app", "authenticated_user", "auth_headers",
                        "tmp_path", "mocker", "settings_override"]
        }

    elif test_file.startswith("frontend/"):
        # Frontend (TypeScript/Vue)
        component_section = re.search(
            r'## Component: Frontend.*?(?=## Component:|---|\Z)',
            content, re.DOTALL
        ).group(0)

        return {
            "language": "typescript",
            "package_name": "claude-workspaces-dashboard",
            "test_command": "cd frontend && npm test -- {test_files}",
            "collect_command": "cd frontend && npm test -- {test_files} --reporter=tap | grep '^ok\\|^not ok'",
            "fixtures": ["createPinia()", "setActivePinia()", "vi.mock()", "vi.mocked()"]
        }

    else:
        raise ValueError(f"Cannot detect component for test file: {test_file}")

# Load config for first test file (assume all files are same component)
first_file = os.environ['TEST_FILES_CREATED'].split(',')[0]
component_config = load_component_config(first_file)
```

### Step 1: Run Full Test Execution

Run test command on the newly generated test files with full execution (NOT `--collect-only`):

```bash
# Parse test files list
IFS=',' read -ra TEST_FILES <<< "$TEST_FILES_CREATED"

echo "Running full test execution on ${#TEST_FILES[@]} test files..."
echo "Test files: $TEST_FILES_CREATED"
echo "Language: ${component_config[language]}"
echo "Package: ${component_config[package_name]}"

# Get test command from component config
TEST_COMMAND="${component_config[test_command]}"
# Replace {test_files} placeholder with actual files
TEST_COMMAND="${TEST_COMMAND/\{test_files\}/${TEST_FILES[@]}}"

# Run tests and capture output
eval "$TEST_COMMAND" 2>&1 | tee test_output.txt
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "All tests passed on first run!"
    VALIDATION_PASSED=true
    INITIALLY_FAILING=0
else
    echo "Some tests failed - analyzing failures..."
    VALIDATION_PASSED=false
    # Count failures from output (language-specific patterns)
    case "${component_config[language]}" in
        python)
            INITIALLY_FAILING=$(grep -c "FAILED" test_output.txt || echo "0")
            ;;
        typescript|javascript)
            INITIALLY_FAILING=$(grep -c "✗" test_output.txt || echo "0")
            ;;
        go)
            INITIALLY_FAILING=$(grep -c "FAIL:" test_output.txt || echo "0")
            ;;
        *)
            INITIALLY_FAILING=$(grep -c -i "fail" test_output.txt || echo "0")
            ;;
    esac
fi
```

### Step 2: Parse and Categorize Failures

Analyze test output to categorize failures by type:

**Error Categories**:

| Category | Pattern | Fixable | Strategy |
|----------|---------|---------|----------|
| `import_error` | `ImportError`, `ModuleNotFoundError`, `cannot import name` | Yes | Read source module, fix import path |
| `api_mismatch` | `TypeError: __init__() got unexpected keyword`, `missing required argument` | Yes | Read actual signature, update test |
| `async_mock` | `'async for' requires __aiter__`, `coroutine was never awaited` | Yes | Apply async mock patterns |
| `fixture_missing` | `fixture 'X' not found` | Yes | Use available fixture from conftest.py |
| `assertion_error` | `AssertionError`, `assert X == Y` | No | Delete (requires human judgment) |
| `other` | Any other error | No | Delete (cannot categorize) |

**Categorization Process**:

```python
def categorize_failure(test_name: str, error_output: str) -> str:
    """Categorize a test failure by error type."""
    error_lower = error_output.lower()

    # Import errors (highest priority - most common)
    if any(x in error_lower for x in ["importerror", "modulenotfounderror", "cannot import name"]):
        return "import_error"

    # API signature mismatches
    if "typeerror" in error_lower and any(x in error_lower for x in [
        "__init__", "got unexpected keyword", "missing required argument",
        "takes", "positional argument"
    ]):
        return "api_mismatch"

    # Async mocking issues
    if any(x in error_lower for x in [
        "__aiter__", "__anext__", "coroutine was never awaited",
        "async for", "asyncmock"
    ]):
        return "async_mock"

    # Fixture issues
    if "fixture" in error_lower and "not found" in error_lower:
        return "fixture_missing"

    # Assertion errors (cannot auto-fix)
    if "assertionerror" in error_lower:
        return "assertion_error"

    # Unknown errors
    return "other"
```

### Step 3: Apply Category-Specific Fixes

For each category, apply targeted fixes:

#### 3a: Fix Import Errors

```python
def fix_import_error(test_file: str, error_msg: str, component_config: dict) -> bool:
    """
    Given: ImportError like 'cannot import name X from <package_name>.Y'
    When: We read the source module to find actual exports
    Then: We fix the import or delete the test if function doesn't exist
    """
    package_name = component_config['package_name']
    language = component_config['language']

    # Language-specific patterns:

    if language == "python":
        # Pattern 1: Wrong module path (src/ prefix)
        # Error: "from src.telegram_claude_bot.auth import X"
        # Fix: "from telegram_claude_bot.auth import X"

        # Pattern 2: Importing private function
        # Error: "cannot import name '_cleanup_expired_states'"
        # Fix: Delete test (private functions shouldn't be tested directly)

        # Pattern 3: Function doesn't exist
        # Error: "cannot import name 'nonexistent_function'"
        # Fix: Delete test

        # Pattern 4: Typo in function name
        # Error: "cannot import name 'autheticate'" (missing 'n')
        # Fix: Correct to 'authenticate'

    elif language in ("typescript", "javascript"):
        # Pattern 1: Wrong import path
        # Error: "Module not found: Can't resolve '@/stores/auth'"
        # Fix: Check actual path (e.g., '@/stores/authStore')

        # Pattern 2: Named import doesn't exist
        # Error: "export 'useAuth' was not found in '@/composables'"
        # Fix: Check actual exports, correct name

        # Pattern 3: Default vs named import
        # Error: Trying to use named import on default export
        # Fix: Change to default import

    elif language == "go":
        # Pattern 1: Wrong package path
        # Error: "package github.com/user/repo/auth not found"
        # Fix: Check go.mod, correct path

        # Pattern 2: Unexported identifier
        # Error: "cannot refer to unexported name auth.cleanup"
        # Fix: Delete test (unexported = private)

    # Implementation:
    # 1. Parse the import statement from error
    # 2. Read the source module
    # 3. Get actual exports (public names)
    # 4. If name exists: fix import path
    # 5. If name is private (_prefix, lowercase in Go): delete test
    # 6. If name doesn't exist: try fuzzy match, else delete

    return True  # Return True if fixed, False if should delete
```

#### 3b: Fix API Signature Mismatches

```python
def fix_api_mismatch(test_file: str, test_name: str, error_msg: str) -> bool:
    """
    Given: TypeError like '__init__() got unexpected keyword argument X'
    When: We read the actual class/function signature
    Then: We update the test to use correct parameters
    """
    # Common patterns:

    # Pattern 1: Extra keyword argument
    # Error: "got unexpected keyword argument 'mode'"
    # Fix: Remove 'mode' from test invocation

    # Pattern 2: Missing required argument
    # Error: "missing required positional argument: 'session'"
    # Fix: Add 'session' parameter with mock value

    # Pattern 3: Wrong argument type
    # Error: "expected str, got int"
    # Fix: Convert argument to correct type

    # Implementation:
    # 1. Parse class/function name from error
    # 2. Read source file to get actual signature
    # 3. Compare test invocation with actual signature
    # 4. Remove invalid args, add required args with sensible defaults

    return True
```

#### 3c: Fix Async Mock Issues

```python
def fix_async_mock(test_file: str, test_name: str, error_msg: str) -> bool:
    """
    Given: Async error like "'async for' requires __aiter__"
    When: We identify the mock that needs async support
    Then: We apply correct async mock pattern
    """
    # Common patterns from this project's test suite:

    # Pattern 1: Async iterator mock
    # Error: "'async for' requires object with __aiter__ method"
    # Fix: Create async generator function, assign to mock
    #
    # async def mock_aiter():
    #     for item in items:
    #         yield item
    # mock_obj.__aiter__ = lambda: mock_aiter()

    # Pattern 2: Async context manager
    # Error: "async with requires __aenter__"
    # Fix: Use AsyncMock with proper __aenter__/__aexit__
    #
    # mock_obj.__aenter__ = AsyncMock(return_value=mock_result)
    # mock_obj.__aexit__ = AsyncMock(return_value=None)

    # Pattern 3: Coroutine not awaited
    # Error: "coroutine was never awaited"
    # Fix: Ensure AsyncMock is used, not regular Mock
    #
    # mock_func = AsyncMock(return_value=result)

    # Pattern 4: Wrong AsyncMock usage with generators
    # Error: AsyncMock wrapping generator doesn't iterate
    # Fix: Assign generator function directly, not wrapped
    #
    # # Wrong: mock.return_value = AsyncMock(return_value=gen())
    # # Right: mock.return_value = gen

    return True
```

#### 3d: Fix Missing Fixtures

```python
def fix_fixture_missing(test_file: str, test_name: str, error_msg: str, component_config: dict) -> bool:
    """
    Given: "fixture 'X' not found" (or equivalent error)
    When: We read available fixtures from component config
    Then: We replace with available fixture or create inline mock
    """
    available_fixtures = component_config['fixtures']
    language = component_config['language']

    if language == "python":
        # Available fixtures (from component config):
        # - db_session, test_app, authenticated_user, auth_headers
        # - tmp_path, mocker, settings_override

        # Common fixture replacements:
        # - "authenticated_user_with_session" -> "authenticated_user" + "db_session"
        # - "test_client" -> "test_app" + AsyncClient
        # - "mock_executor" -> inline Mock() in test

    elif language in ("typescript", "javascript"):
        # Available fixtures (from component config):
        # - createPinia(), setActivePinia()
        # - vi.mock(), vi.mocked()

        # Common patterns:
        # - Missing Pinia setup -> Add beforeEach with setActivePinia(createPinia())
        # - Missing mock setup -> Add vi.mock() before test
        # - Missing spy -> Add vi.spyOn() in test

    elif language == "go":
        # Go doesn't have fixtures, but has setup functions
        # - t.TempDir() for temporary directories
        # - httptest.NewServer() for test servers
        # - Custom setup functions in testing package

    # Implementation:
    # 1. Parse missing fixture name from error
    # 2. Check component_config['fixtures'] for available fixtures
    # 3. Find similar fixture (fuzzy match)
    # 4. If found: replace fixture reference
    # 5. If not found but common pattern: create inline mock/setup
    # 6. Else: delete test

    return True
```

### Step 4: Fix-and-Retry Loop

```bash
MAX_FIX_ATTEMPTS=${MAX_FIX_ATTEMPTS:-3}
attempt=0
FIXED_TESTS_COUNT=0
DELETED_TESTS_COUNT=0

while [ "$VALIDATION_PASSED" = "false" ] && [ $attempt -lt $MAX_FIX_ATTEMPTS ]; do
    attempt=$((attempt + 1))
    echo ""
    echo "=== Fix Attempt $attempt of $MAX_FIX_ATTEMPTS ==="

    # Parse failures from last test run
    failures=$(parse_test_failures test_output.txt)

    for failure in $failures; do
        test_file=$(echo $failure | cut -d: -f1)
        test_name=$(echo $failure | cut -d: -f2)
        error_type=$(categorize_failure "$test_name" "$error_output")

        echo "Processing: $test_name (category: $error_type)"

        case $error_type in
            import_error)
                if fix_import_error "$test_file" "$error_output"; then
                    FIXED_TESTS_COUNT=$((FIXED_TESTS_COUNT + 1))
                else
                    delete_test "$test_file" "$test_name"
                    DELETED_TESTS_COUNT=$((DELETED_TESTS_COUNT + 1))
                fi
                ;;
            api_mismatch)
                if fix_api_mismatch "$test_file" "$test_name" "$error_output"; then
                    FIXED_TESTS_COUNT=$((FIXED_TESTS_COUNT + 1))
                else
                    delete_test "$test_file" "$test_name"
                    DELETED_TESTS_COUNT=$((DELETED_TESTS_COUNT + 1))
                fi
                ;;
            async_mock)
                if fix_async_mock "$test_file" "$test_name" "$error_output"; then
                    FIXED_TESTS_COUNT=$((FIXED_TESTS_COUNT + 1))
                else
                    delete_test "$test_file" "$test_name"
                    DELETED_TESTS_COUNT=$((DELETED_TESTS_COUNT + 1))
                fi
                ;;
            fixture_missing)
                if fix_fixture_missing "$test_file" "$test_name" "$error_output"; then
                    FIXED_TESTS_COUNT=$((FIXED_TESTS_COUNT + 1))
                else
                    delete_test "$test_file" "$test_name"
                    DELETED_TESTS_COUNT=$((DELETED_TESTS_COUNT + 1))
                fi
                ;;
            assertion_error|other)
                # Cannot auto-fix, delete
                echo "Cannot auto-fix $error_type - deleting test"
                delete_test "$test_file" "$test_name"
                DELETED_TESTS_COUNT=$((DELETED_TESTS_COUNT + 1))
                ;;
        esac
    done

    # Re-run tests after fixes
    echo ""
    echo "Re-running tests after fixes..."
    pytest ${TEST_FILES[@]} -v --tb=short 2>&1 | tee test_output.txt
    TEST_EXIT_CODE=$?

    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo "All tests pass after fix attempt $attempt!"
        VALIDATION_PASSED=true
    else
        remaining_failures=$(grep -c "FAILED" test_output.txt || echo "0")
        echo "Still $remaining_failures failing tests"
    fi
done
```

### Step 5: Delete Unfixable Tests

For tests that cannot be fixed after MAX_FIX_ATTEMPTS:

```python
def delete_test(test_file: str, test_name: str) -> None:
    """
    Remove a test function from the test file.
    Also clean up empty test classes.
    """
    # Read test file
    with open(test_file, 'r') as f:
        content = f.read()

    # Parse AST to find and remove test function
    import ast
    tree = ast.parse(content)

    # Find and mark the test function for removal
    # ... (implementation details)

    # Write back without the test
    with open(test_file, 'w') as f:
        f.write(modified_content)

    # Check if test class is now empty
    cleanup_empty_classes(test_file)

    print(f"Deleted test: {test_name} from {test_file}")


def cleanup_empty_classes(test_file: str) -> None:
    """Remove test classes that have no test methods remaining."""
    # If a class only had one test and we deleted it,
    # remove the entire class to keep file clean
    pass
```

### Step 6: Final Validation

```bash
# After all fix attempts, count results
echo ""
echo "=== Final Validation ==="

# Run final test count
pytest ${TEST_FILES[@]} --collect-only -q 2>&1 | tee collect_output.txt
VALIDATED_TESTS_COUNT=$(grep -c "test_" collect_output.txt || echo "0")

# Calculate metrics
if [ $INITIALLY_FAILING -gt 0 ]; then
    FIX_SUCCESS_RATE=$(echo "scale=1; $FIXED_TESTS_COUNT * 100 / $INITIALLY_FAILING" | bc)
else
    FIX_SUCCESS_RATE=100
fi

# Final pass/fail status
pytest ${TEST_FILES[@]} -v --tb=short 2>&1 | tee final_output.txt
FINAL_EXIT_CODE=$?

if [ $FINAL_EXIT_CODE -eq 0 ]; then
    VALIDATION_PASSED=true
    echo "VALIDATION PASSED: All $VALIDATED_TESTS_COUNT tests pass"
else
    VALIDATION_PASSED=false
    remaining=$(grep -c "FAILED" final_output.txt || echo "0")
    echo "VALIDATION WARNING: $remaining tests still failing (will be skipped in Phase 03)"
fi

echo ""
echo "Summary:"
echo "  Tests generated: $TESTS_ADDED"
echo "  Initially failing: $INITIALLY_FAILING"
echo "  Tests fixed: $FIXED_TESTS_COUNT"
echo "  Tests deleted: $DELETED_TESTS_COUNT"
echo "  Tests validated: $VALIDATED_TESTS_COUNT"
echo "  Fix success rate: ${FIX_SUCCESS_RATE}%"
```

### Step 7: Generate Validation Report

Write detailed report to `$OUTPUT_DIR/run-$RUN_ID/iteration-$LOOP_INDEX-validation.md`:

```markdown
# Test Validation & Fixing Report - Iteration $LOOP_INDEX

**Generated**: $(date -Iseconds)
**Run ID**: $RUN_ID

## Summary

| Metric | Value |
|--------|-------|
| Tests Generated (Phase 02) | $TESTS_ADDED |
| Initially Failing | $INITIALLY_FAILING |
| Tests Fixed | $FIXED_TESTS_COUNT |
| Tests Deleted | $DELETED_TESTS_COUNT |
| Tests Validated | $VALIDATED_TESTS_COUNT |
| Fix Attempts Used | $attempt / $MAX_FIX_ATTEMPTS |
| Fix Success Rate | ${FIX_SUCCESS_RATE}% |
| **Validation Status** | $VALIDATION_PASSED |

## Failures by Category

| Category | Count | Fixed | Deleted |
|----------|-------|-------|---------|
| Import errors | X | Y | Z |
| API mismatch | X | Y | Z |
| Async mock issues | X | Y | Z |
| Fixture missing | X | Y | Z |
| Assertion errors | X | 0 | X |
| Other | X | 0 | X |

## Fix Details

### Fixed Tests

1. **test_example_function** (import_error)
   - Error: `cannot import name 'old_name' from 'module'`
   - Fix: Changed import to `new_name`

2. **test_another_function** (api_mismatch)
   - Error: `got unexpected keyword argument 'mode'`
   - Fix: Removed 'mode' parameter from test

### Deleted Tests

1. **test_assertion_example** (assertion_error)
   - Error: `assert 200 == 404`
   - Reason: Cannot auto-fix assertion logic

2. **test_unknown_error** (other)
   - Error: `SomeUnknownException: ...`
   - Reason: Cannot categorize error

## Validation Status

$VALIDATION_PASSED

**Note**: If VALIDATION_PASSED is false, remaining failing tests will be skipped
during Phase 03 coverage measurement. The workflow will continue.
```

## Outputs

**Files Created**:
- `$OUTPUT_DIR/run-$RUN_ID/iteration-$LOOP_INDEX-validation.md`: Validation report

**Parameters Discovered**:
- `VALIDATED_TESTS_COUNT`: Number of tests that pass (e.g., 39)
- `DELETED_TESTS_COUNT`: Number of tests deleted (e.g., 4)
- `FIXED_TESTS_COUNT`: Number of tests successfully fixed (e.g., 6)
- `FIX_SUCCESS_RATE`: Percentage of broken tests fixed (e.g., 60.0)
- `VALIDATION_PASSED`: Whether all remaining tests pass (e.g., true)

## Success Criteria
- [ ] Full pytest execution completed (not just collect-only)
- [ ] All failures categorized by type
- [ ] Fix strategies applied for fixable categories
- [ ] Unfixable tests deleted cleanly
- [ ] No empty test classes remain
- [ ] Retry loop completed (up to MAX_FIX_ATTEMPTS)
- [ ] Final validation status determined
- [ ] All metrics calculated and exported
- [ ] Validation report written

## Error Handling

**Test File Becomes Empty**:
- If all tests in a file were deleted, remove the file
- Update TEST_FILES_CREATED to exclude removed files
- Log warning but continue

**Fix Makes Things Worse**:
- If post-fix failure count > pre-fix failure count
- Revert the fix
- Mark test as unfixable and delete

**Fix Timeout**:
- Individual fixes have 30-second timeout
- If timeout, delete test instead of blocking

**All Tests Deleted**:
- If VALIDATED_TESTS_COUNT = 0 and TESTS_ADDED > 0
- Set VALIDATION_PASSED = true (no tests to fail)
- Log warning: "All generated tests were unfixable and deleted"
- Workflow continues; Phase 04 will detect no coverage improvement
