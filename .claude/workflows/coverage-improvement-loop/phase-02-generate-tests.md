---
phase_metadata:
  execution_mode: sequential

  inputs:
    parameters:
      - name: PRIORITY_FILES
        required: true
        description: "Comma-separated list of files to improve"
        type: string
      - name: PRIORITY_COUNT
        required: true
        description: "Number of priority files"
        type: integer
      - name: LOOP_INDEX
        required: true
        description: "Current iteration number"
        type: integer

  outputs:
    parameters:
      - name: TESTS_ADDED
        description: "Number of new test functions added this iteration"
        type: integer
      - name: FILES_IMPROVED
        description: "Number of files that received new tests"
        type: integer
      - name: TEST_FILES_CREATED
        description: "Comma-separated list of test files created or modified"
        type: string
---

# Phase 02: Generate Tests

**Purpose**: For each priority file, analyze uncovered code, design test scenarios following project standards, and generate high-quality tests to improve coverage.

## Prerequisites
- Analysis phase completed with PRIORITY_FILES identified
- PRIORITY_COUNT > 0 (at least one file to improve)
- Access to source code and existing tests
- Component configuration file exists at `.claude/rules/testing-workflows-config.md`
  - If missing, run `/init-coverage-config` first
  - Contains language, package names, test patterns, and fixtures for each component

## Tasks for Todo List
When starting this phase, add these tasks:
1. Reading each priority file to understand functionality
2. Identifying uncovered lines and branches from coverage report
3. Finding existing test files for each source file
4. Analyzing existing tests to avoid duplication
5. Designing test scenarios (happy path, errors, edge cases)
6. Generating tests following project quality standards
7. Writing tests to appropriate test files
8. Tracking tests added count and files improved

## Parameters Used
- **PRIORITY_FILES**: Comma-separated file paths (e.g., "src/auth/manager.py,src/web/api/auth.py")
- **PRIORITY_COUNT**: Number of files to improve (e.g., 5)
- **LOOP_INDEX**: Current iteration number (for logging)

## Process

### Step 1: Load Component Configuration

**Load component config** to understand language, package names, and test patterns:

```bash
# Read component config to get language, package name, and test utilities
COMPONENT_CONFIG=".claude/rules/testing-workflows-config.md"

if [ ! -f "$COMPONENT_CONFIG" ]; then
    echo "⚠️  No component config found at $COMPONENT_CONFIG"
    echo "   Run /init-coverage-config first to generate configuration"
    exit 1
fi

# Extract component metadata (language, package name, test patterns, fixtures)
# This will be used for language-aware test generation
```

Parse priority files list:

```bash
IFS=',' read -ra FILES_ARRAY <<< "$PRIORITY_FILES"
echo "Processing ${PRIORITY_COUNT} priority files in iteration ${LOOP_INDEX}"
```

### Step 2: For Each Priority File

Iterate through each file and generate targeted tests:

```bash
TESTS_ADDED=0
FILES_IMPROVED=0
TEST_FILES_MODIFIED=()

for source_file in "${FILES_ARRAY[@]}"; do
    echo "Analyzing $source_file..."

    # Step 2a: Read source code
    # Step 2b: Identify uncovered lines
    # Step 2c: Find corresponding test file
    # Step 2d: Design test scenarios
    # Step 2e: Generate tests
    # Step 2f: Write tests to file
done
```

### Step 2a: Read Source Code and Understand Functionality

For each source file, read the code to understand:
- What classes and functions are defined
- What the public API is (methods users call)
- What business logic exists (validation, calculations, transformations)
- What error conditions might occur
- What dependencies exist (database, external services)

### Step 2b: Identify Uncovered Lines from Coverage Report

Parse coverage.json to find missing lines for this specific file:

```python
import json

with open('coverage.json') as f:
    coverage_data = json.load(f)

file_data = coverage_data['files'][source_file]
missing_lines = file_data['missing_lines']  # e.g., [45, 46, 47, 78-85, 120-135]
```

Group missing lines by function/method to understand which behaviors need testing.

### Step 2c: Find Corresponding Test File (Language-Aware)

Determine where tests should be added based on language conventions:

```python
# Load component config to get language and test patterns
component = detect_component_for_file(source_file)
language = component['language']
package_name = component['package_name']

# Determine test file path based on language conventions
if language == "Python":
    # Convention: src/module/file.py → tests/module/test_file.py
    test_file_path = source_file.replace('src/', 'tests/').replace('.py', '_test.py')

elif language in ["JavaScript", "TypeScript"]:
    # Convention: src/module/file.ts → src/module/file.test.ts (co-located)
    # Or: src/module/file.ts → src/module/__tests__/file.test.ts
    test_file_path = source_file.replace('.ts', '.test.ts').replace('.js', '.test.js')

elif language == "Go":
    # Convention: pkg/module/file.go → pkg/module/file_test.go (same directory)
    test_file_path = source_file.replace('.go', '_test.go')

elif language == "Rust":
    # Convention: src/module.rs → tests/module.rs
    # Or: src/module/mod.rs → tests/module.rs
    test_file_path = source_file.replace('src/', 'tests/')

# Check if test file exists
if os.path.exists(test_file_path):
    # Read existing tests to avoid duplication
    existing_tests = parse_existing_tests(test_file_path)
else:
    # Will create new test file
    existing_tests = []
```

### Step 2d: Design Test Scenarios Following Project Standards

For each uncovered behavior, design tests that follow `.claude/rules/testing.md` standards:

**Test Quality Checklist**:
- ✅ Given/When/Then docstring
- ✅ Parameterization for similar tests (3+ cases)
- ✅ Strong, specific assertions (no weak patterns)
- ✅ Behavioral organization (not CRUD-based)
- ✅ Async patterns for async code
- ✅ Fixtures for common setup
- ✅ Error cases AND happy paths

**Test Scenario Categories**:
1. **Happy Path**: Normal successful execution
2. **Error Handling**: What happens when things go wrong
3. **Edge Cases**: Empty inputs, null values, boundaries
4. **Validation**: Input validation and business rules
5. **Integration**: Database/API interactions

**Example Scenario Design**:
```
Source function: authenticate_user(token: str) -> User

Scenarios to test:
1. Valid token returns authenticated user (happy path)
2. Invalid token raises AuthenticationError (error)
3. Expired token raises TokenExpiredError (error)
4. Empty token raises ValueError (validation)
5. Null token raises ValueError (validation)
6. Malformed token raises ValidationError (edge case)
7. Token with SQL injection attempt is rejected (security)
```

### Step 2e: Generate Tests Following Language-Specific Patterns

Write tests using patterns from `.claude/rules/test-patterns.md`, adapted for the target language.

**Load imports and fixtures from component config**:
```python
# Get language-specific imports and fixtures from component config
imports = get_imports_for_language(language, package_name, source_file)
fixtures = component['fixtures']  # From component config
```

#### Python Test Pattern

**Imports (component-aware)**:
```python
import pytest
# Component-aware import: from {package_name}.{module} import {symbol}
from telegram_claude_bot.auth.manager import authenticate_user, AuthenticationError
```

**Parameterized Test Example**:
```python
class TestUserAuthentication:
    """Tests for user authentication - CRITICAL PATH."""

    @pytest.mark.asyncio
    async def test_valid_token_authenticates_user(self, test_app):
        """
        Given a valid OAuth token
        When authenticating user
        Then user should be authenticated and returned
        """
        token = "valid_oauth_token_abc123"
        user = await authenticate_user(token)

        assert user is not None
        assert user.is_authenticated is True
        assert user.oauth_token == token

    @pytest.mark.parametrize("invalid_token,expected_error", [
        ("", "Token cannot be empty"),
        ("malformed_token", "Invalid token format"),
        ("expired_token_xyz", "Token has expired"),
        ("a" * 10000, "Token too long"),
    ], ids=["empty", "malformed", "expired", "too_long"])
    @pytest.mark.asyncio
    async def test_rejects_invalid_tokens(self, invalid_token, expected_error):
        """
        Given an invalid token
        When attempting authentication
        Then should raise AuthenticationError with appropriate message
        """
        with pytest.raises(AuthenticationError, match=expected_error):
            await authenticate_user(invalid_token)
```

#### JavaScript/TypeScript Test Pattern

**Imports (component-aware)**:
```typescript
// Component-aware import: import { {symbol} } from '@/{module}'
import { describe, it, expect, vi } from 'vitest'
import { authenticateUser } from '@/auth/manager'
import type { AuthenticationError } from '@/types'
```

**Parameterized Test Example (Vitest)**:
```typescript
describe('UserAuthentication', () => {
  describe('authenticateUser', () => {
    it('should authenticate user with valid token', async () => {
      // Given a valid OAuth token
      const token = 'valid_oauth_token_abc123'

      // When authenticating user
      const user = await authenticateUser(token)

      // Then user should be authenticated and returned
      expect(user).toBeDefined()
      expect(user.isAuthenticated).toBe(true)
      expect(user.oauthToken).toBe(token)
    })

    it.each([
      ['', 'Token cannot be empty'],
      ['malformed_token', 'Invalid token format'],
      ['expired_token_xyz', 'Token has expired'],
      ['a'.repeat(10000), 'Token too long'],
    ])('should reject invalid token: %s', async (invalidToken, expectedError) => {
      // Given an invalid token
      // When attempting authentication
      // Then should throw AuthenticationError with appropriate message
      await expect(authenticateUser(invalidToken)).rejects.toThrow(expectedError)
    })
  })
})
```

#### Go Test Pattern

**Imports (component-aware)**:
```go
package auth

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/yourorg/yourproject/pkg/auth"
)
```

**Table-Driven Test Example**:
```go
func TestAuthenticateUser(t *testing.T) {
    t.Run("valid token authenticates user", func(t *testing.T) {
        // Given a valid OAuth token
        token := "valid_oauth_token_abc123"

        // When authenticating user
        user, err := auth.AuthenticateUser(token)

        // Then user should be authenticated
        assert.NoError(t, err)
        assert.NotNil(t, user)
        assert.True(t, user.IsAuthenticated)
        assert.Equal(t, token, user.OAuthToken)
    })

    t.Run("rejects invalid tokens", func(t *testing.T) {
        tests := []struct {
            name          string
            token         string
            expectedError string
        }{
            {"empty", "", "Token cannot be empty"},
            {"malformed", "malformed_token", "Invalid token format"},
            {"expired", "expired_token_xyz", "Token has expired"},
            {"too long", string(make([]byte, 10000)), "Token too long"},
        }

        for _, tt := range tests {
            t.Run(tt.name, func(t *testing.T) {
                // When attempting authentication with invalid token
                _, err := auth.AuthenticateUser(tt.token)

                // Then should return error with appropriate message
                assert.Error(t, err)
                assert.Contains(t, err.Error(), tt.expectedError)
            })
        }
    })
}
```

#### Rust Test Pattern

**Imports (component-aware)**:
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::auth::{authenticate_user, AuthenticationError};
}
```

**Parameterized Test Example**:
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_valid_token_authenticates_user() {
        // Given a valid OAuth token
        let token = "valid_oauth_token_abc123";

        // When authenticating user
        let user = authenticate_user(token).await.unwrap();

        // Then user should be authenticated
        assert!(user.is_authenticated);
        assert_eq!(user.oauth_token, token);
    }

    #[tokio::test]
    async fn test_rejects_invalid_tokens() {
        let test_cases = vec![
            ("", "Token cannot be empty"),
            ("malformed_token", "Invalid token format"),
            ("expired_token_xyz", "Token has expired"),
            (&"a".repeat(10000), "Token too long"),
        ];

        for (invalid_token, expected_error) in test_cases {
            // When attempting authentication with invalid token
            let result = authenticate_user(invalid_token).await;

            // Then should return error with appropriate message
            assert!(result.is_err());
            assert!(result.unwrap_err().to_string().contains(expected_error));
        }
    }
}
```

**Pattern: Database Operations with Fixtures**
```python
@pytest.mark.asyncio
async def test_creates_user_in_database(self, db_session):
    """
    Given valid user data
    When creating new user
    Then user should be persisted in database
    """
    user = User(telegram_user_id=12345, oauth_provider="github")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    assert user.id is not None
    assert user.created_at is not None
    assert user.oauth_provider == "github"
```

**Pattern: API Endpoint Testing**
```python
@pytest.mark.asyncio
async def test_api_endpoint_returns_user_data(self, test_app, auth_headers):
    """
    Given authenticated user
    When requesting user data via API
    Then should return user information
    """
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/user", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
```

### Step 2f: Write Tests to Test File (Language-Aware)

Append generated tests to the test file (or create new file if needed), using language-specific conventions:

```python
# Generate imports based on language
if language == "Python":
    imports = f"""import pytest
from {package_name}.{module_path} import {symbols}
"""

elif language in ["JavaScript", "TypeScript"]:
    imports = f"""import {{ describe, it, expect, vi }} from 'vitest'
import {{ {symbols} }} from '@/{module_path}'
"""

elif language == "Go":
    imports = f"""package {package_name}

import (
    "testing"
    "github.com/stretchr/testify/assert"
)
"""

elif language == "Rust":
    imports = f"""#[cfg(test)]
mod tests {{
    use super::*;
    use crate::{module_path}::{{{symbols}}};
}}
"""

# Write to test file
with open(test_file_path, 'a' if exists else 'w') as f:
    if not exists:
        # Write language-specific imports
        f.write(imports)
        f.write("\n\n")

    # Write test class and functions
    f.write(generated_test_code)

TESTS_ADDED += num_tests_in_file
FILES_IMPROVED += 1
TEST_FILES_MODIFIED.append(test_file_path)
```

### Step 3: Validate Generated Tests (CRITICAL - Language-Aware)

**⚠️ MANDATORY VALIDATION STEP** - This step prevents broken tests from being committed.

After generating all tests, validate they can be collected and run using language-specific validators:

```bash
echo "Validating generated tests..."

# Validate based on language
VALIDATION_FAILED=false
for test_file in "${TEST_FILES_MODIFIED[@]}"; do
    echo "Validating $test_file..."

    # Detect language from file extension
    if [[ "$test_file" == *.py ]]; then
        # Python: pytest --collect-only
        if ! python -m pytest "$test_file" --collect-only -q 2>&1 | tee validation_output.txt; then
            echo "ERROR: Python test validation failed for $test_file"
            cat validation_output.txt
            VALIDATION_FAILED=true
        fi

    elif [[ "$test_file" == *.test.ts || "$test_file" == *.test.js ]]; then
        # JavaScript/TypeScript: Try to compile/collect tests
        if command -v npm &> /dev/null; then
            if ! npm test -- "$test_file" --run --reporter=verbose 2>&1 | tee validation_output.txt; then
                echo "ERROR: JS/TS test validation failed for $test_file"
                cat validation_output.txt
                VALIDATION_FAILED=true
            fi
        else
            echo "⚠️  Skipping JS/TS validation (npm not found)"
        fi

    elif [[ "$test_file" == *_test.go ]]; then
        # Go: go test -c (compile without running)
        if ! go test -c -o /dev/null "$(dirname "$test_file")" 2>&1 | tee validation_output.txt; then
            echo "ERROR: Go test validation failed for $test_file"
            cat validation_output.txt
            VALIDATION_FAILED=true
        fi

    elif [[ "$test_file" == *.rs && "$test_file" == *tests/* ]]; then
        # Rust: cargo test --no-run
        if ! cargo test --no-run 2>&1 | tee validation_output.txt; then
            echo "ERROR: Rust test validation failed for $test_file"
            cat validation_output.txt
            VALIDATION_FAILED=true
        fi
    fi
done

if [ "$VALIDATION_FAILED" = "true" ]; then
    echo "❌ Test generation FAILED: Generated tests have import/syntax errors"
    echo "Phase 02 must fix tests before continuing"
    exit 1
fi

echo "✅ All generated tests validated successfully"
```

**What This Catches** (Language-Specific):

**Python**:
- Import errors (importing non-existent functions)
- Syntax errors (malformed Python code)
- API signature mismatches (wrong constructor arguments)
- Fixture reference errors (using undefined fixtures)
- Module path errors (incorrect imports)

**JavaScript/TypeScript**:
- Import/export errors
- Type errors (TypeScript)
- Missing dependencies
- Syntax errors

**Go**:
- Import errors
- Compilation errors
- Type mismatches
- Undefined symbols

**Rust**:
- Import errors (use statements)
- Compilation errors
- Type errors
- Missing trait implementations

**If Validation Fails**:
1. Review the validation errors
2. Fix the generated tests (correct imports, signatures, types)
3. Re-run validation until all tests pass
4. Only then proceed to Step 4

### Step 4: Track Metrics

After validation passes, calculate summary metrics:

```bash
echo "Iteration $LOOP_INDEX: Added $TESTS_ADDED tests across $FILES_IMPROVED files"

# Export parameters
TESTS_ADDED=$TESTS_ADDED
FILES_IMPROVED=$FILES_IMPROVED
TEST_FILES_CREATED=$(IFS=,; echo "${TEST_FILES_MODIFIED[*]}")
```

## Outputs

**Files Modified**:
- Test files in `tests/` directory (created or appended)

**Parameters Discovered**:
- `TESTS_ADDED`: Total number of test functions added (e.g., 18)
- `FILES_IMPROVED`: Number of source files that received tests (e.g., 5)
- `TEST_FILES_CREATED`: Comma-separated list of test files (e.g., "tests/auth/test_manager.py,tests/api/test_auth.py")

## Success Criteria
- [ ] All priority files analyzed for uncovered lines
- [ ] Test scenarios designed for each uncovered behavior
- [ ] Tests generated following project quality standards
- [ ] All tests have Given/When/Then docstrings
- [ ] Similar tests use parameterization (3+ cases)
- [ ] Strong, specific assertions used (no weak patterns)
- [ ] Tests written to appropriate test files
- [ ] **CRITICAL: All generated tests validated with pytest --collect-only (no import/syntax errors)**
- [ ] Metrics tracked and exported

## Error Handling

**Source File Not Found**:
- Log warning with file path
- Skip to next file
- Continue processing remaining files

**Test File Creation Fails**:
- Check for permissions issues
- Verify directory exists (create if needed)
- If still fails, log error and skip file

**Generated Tests Have Syntax Errors**:
- Validate generated code before writing
- If syntax errors detected, log and skip
- Continue with next file

**No Uncovered Lines Found**:
- If file already has 100% coverage
- Log informational message
- Skip to next file (don't count as error)

**Import Resolution Fails**:
- If unable to determine correct imports for test
- Generate test with placeholder imports
- Add comment: "# TODO: Verify imports are correct"
- Continue processing

## Notes

**Multi-Language Support**: This phase adapts to the target language automatically:
- Loads component configuration from `.claude/rules/testing-workflows-config.md`
- Uses language-specific import patterns (Python, JS/TS, Go, Rust)
- Applies language-specific test patterns (pytest, Vitest, Go table tests, Rust)
- Uses language-appropriate fixtures and test utilities
- Validates tests with language-specific tools (pytest, npm test, go test, cargo test)

**Test Quality Standards**: All generated tests MUST follow `.claude/rules/testing.md`:
- Every test has a docstring/comment (Given/When/Then format)
- Similar tests use parameterization (pytest.mark.parametrize, it.each, table-driven, etc.)
- Organize by behavior, not CRUD operations
- Use strong, specific assertions (no weak patterns)
- Extract common setup into fixtures/helpers
- Include both happy paths and error cases

**Avoid Over-Generation**: Don't generate tests for:
- Simple getters/setters without logic
- Framework internals (FastAPI, SQLAlchemy)
- Auto-generated code (migrations)
- Debug-only code
- Code already covered by other tests

**Fixture Reuse (Language-Aware)**: Check component config for available fixtures/utilities:

**Python** (from `tests/conftest.py`):
- `db_session`: Database session for testing
- `test_app`: FastAPI app instance
- `authenticated_user`: Pre-created user
- `auth_headers`: Authorization headers
- `settings_override`: Override settings for tests
- Use existing fixtures instead of creating duplicates

**JavaScript/TypeScript** (from test utilities):
- `beforeEach`: Setup before each test
- `vi.mock()`: Mock functions/modules (Vitest)
- `createTestPinia()`: Create test Pinia store (if using Pinia)
- `mockApiResponse()`: Mock API responses
- `mountWithPlugins()`: Mount components with plugins

**Go** (test helpers):
- `t.Helper()`: Mark function as test helper
- Setup/teardown functions in test files
- Table-driven test patterns

**Rust** (common test utilities):
- `tests/common/mod.rs`: Common test setup
- `#[tokio::test]`: Async test attribute
- Mock traits and test fixtures

**Load from component config**:
```python
# Get fixtures from component configuration
fixtures = component['fixtures']
# Reference fixtures in generated tests to avoid duplication
```
