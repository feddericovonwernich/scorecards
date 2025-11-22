# Contributing to Scorecards

Thank you for your interest in contributing to Scorecards!

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your changes
4. Make your changes
5. Run tests (see Testing section)
6. Submit a pull request

## Development Setup

See the [Development Guide](documentation/development/README.md) for development guidelines and setup instructions.

## Adding a New Check

See the [Check Development Guide](documentation/guides/check-development-guide.md) for a guide on creating new checks.

## Using Shared Libraries

Checks should use shared utilities from `/checks/lib/` and `/action/lib/` to avoid code duplication.

See `/checks/lib/README.md` for documentation on available shared utilities.

## Code Style

- **Shell scripts:** Follow Google Shell Style Guide, use shellcheck
- **JavaScript:** Follow Airbnb style guide, use ESLint
- **Python:** Follow PEP 8, use flake8

## Documentation Standards

All code contributions must include appropriate inline documentation. Well-documented code helps maintainers and contributors understand the codebase and reduces onboarding time.

### JavaScript (JSDoc)

All exported functions must have JSDoc comments with:
- Module description (@module)
- Function description
- Parameter types and descriptions (@param)
- Return type and description (@returns)
- Examples (@example) for complex functions
- Error conditions (@throws) if applicable

**Example:**
```javascript
/**
 * Calculates quality score from check results
 * @param {Array<Check>} checks - Array of check result objects
 * @returns {Object} Score calculation result
 * @returns {number} return.score - Percentage score (0-100)
 * @returns {number} return.pointsEarned - Total points earned
 * @example
 * const result = calculateScore(checks);
 * console.log(`Score: ${result.score}%`);
 */
export function calculateScore(checks) {
    // implementation
}
```

### Shell Scripts

All shell scripts must include:
- File header with purpose, usage, environment variables, and exit codes
- Function documentation with arguments, outputs, returns, and examples

**Template:**
```bash
#!/bin/bash
# Script Name - Brief Description
#
# Detailed description of what this script does.
#
# USAGE:
#   script-name.sh [options] arguments
#
# ARGUMENTS:
#   $1 - First argument description
#
# ENVIRONMENT VARIABLES:
#   VAR_NAME - Description (required/optional)
#
# EXIT CODES:
#   0 - Success
#   1 - Failure
#
# EXAMPLE:
#   bash script-name.sh arg1 arg2
#

# Function description
#
# ARGUMENTS:
#   $1 - Parameter description
#
# OUTPUTS:
#   Description of output to stdout/stderr
#
# RETURNS:
#   0 if successful, 1 if failed
#
# EXAMPLE:
#   result=$(my_function "value")
my_function() {
    # implementation
}
```

**See examples:**
- `action/entrypoint.sh` - Main entry point documentation
- `action/lib/common.sh` - Library function documentation
- `checks/01-readme/check.sh` - Check script documentation

### Python (Docstrings)

All Python modules and functions must have docstrings following Google style:
- Module-level docstring with purpose, pass criteria, environment variables
- Function docstrings with Args, Returns, Raises, and Examples

**Example:**
```python
"""
Check Name

Module description and purpose.

Pass criteria:
    - Criterion 1
    - Criterion 2

Environment Variables:
    SCORECARD_REPO_PATH: Path to repository (default: current dir)

Exit Codes:
    0: Check passed
    1: Check failed

Example:
    $ SCORECARD_REPO_PATH=/path/to/repo python3 check.py
"""

def validate_file(file_path: str) -> bool:
    """
    Validates that a file exists and is readable.

    Args:
        file_path: Path to file to validate

    Returns:
        True if file is valid, False otherwise

    Raises:
        IOError: If file cannot be accessed

    Example:
        >>> validate_file("/path/to/file")
        True
    """
    # implementation
```

**See example:**
- `checks/02-license/check.py` - Python check documentation

### Documentation Checklist

Before submitting a PR, ensure:

- [ ] All new JavaScript functions have JSDoc comments
- [ ] All new shell functions have function documentation
- [ ] All new Python functions have docstrings
- [ ] Complex logic has inline comments explaining the "why"
- [ ] Module/file headers are updated if behavior changes
- [ ] Examples are provided for non-trivial functions
- [ ] API reference updated if adding/modifying public APIs (see `documentation/reference/api-reference.md`)

### Good vs Bad Documentation

**Good:**
```javascript
/**
 * Retries a failed operation with exponential backoff
 * @param {Function} operation - Async function to retry
 * @param {number} maxAttempts - Maximum retry attempts (default: 3)
 * @returns {Promise<any>} Result of successful operation
 * @throws {Error} If all retry attempts fail
 * @example
 * const data = await retryWithBackoff(() => fetchData(), 5);
 */
async function retryWithBackoff(operation, maxAttempts = 3) {
```

**Bad:**
```javascript
// Retry function
async function retry(op, max) {
```

**Good (Shell):**
```bash
# Validates required parameters are non-empty
#
# ARGUMENTS:
#   $1 - Function name (for error messages)
#   $2+ - Pairs of param_name and param_value
#
# RETURNS:
#   0 if all parameters valid, 1 if any missing
validate_params() {
```

**Bad (Shell):**
```bash
# Check params
validate_params() {
```

### Documentation Resources

- [JSDoc Documentation](https://jsdoc.app/)
- [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html)
- [PEP 257 - Docstring Conventions](https://www.python.org/dev/peps/pep-0257/)
- [API Reference](documentation/reference/api-reference.md) - Complete API documentation for catalog UI

## Testing

```bash
# Run all tests
npm test           # JavaScript tests (Jest)
bats tests/        # Bash tests
pytest             # Python tests
```

## Pull Request Process

1. Update documentation for any new features
2. Add tests for new functionality
3. Ensure all tests pass
4. Verify documentation standards are met (see [Documentation Standards](#documentation-standards))
5. Update CHANGELOG.md with your changes
6. Request review from maintainers

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Questions?

Open an issue for questions or discussion.
