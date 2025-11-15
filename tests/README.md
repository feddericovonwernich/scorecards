# Scorecards Test Suite

## Structure

- `unit/` - Unit tests for individual functions and modules
  - `bash/` - Bats tests for shell scripts
  - `javascript/` - Jest tests for JS code
  - `python/` - pytest tests for Python code
- `integration/` - Integration tests for workflows and actions
- `fixtures/` - Test data and sample repositories

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:js        # JavaScript tests only
npm run test:bash      # Bash tests only
npm run test:python    # Python tests only

# Run with coverage
npm run test:coverage

# Watch mode (JS only)
npm run test:watch
```

## Running Individual Tests

```bash
# Jest - specific file
npm run test:js -- tests/unit/javascript/common-paths.test.js

# Bats - specific file
bats tests/unit/bash/test_common.bats

# pytest - specific file
pytest tests/unit/python/test_license_check.py
```

## Writing Tests

### JavaScript (Jest)

```javascript
import { describe, it, expect } from '@jest/globals';
import commonPaths from '../../checks/lib/common-paths.js';

describe('commonPaths', () => {
  it('should have OpenAPI paths', () => {
    expect(commonPaths.openapi).toBeDefined();
    expect(commonPaths.openapi.length).toBeGreaterThan(0);
  });
});
```

### Bash (Bats)

```bash
#!/usr/bin/env bats

load helpers

@test "find_readme finds README.md" {
  run find_readme "$FIXTURES/sample-repos/minimal"
  [ "$status" -eq 0 ]
  [ "$output" = "README.md" ]
}
```

### Python (pytest)

```python
import pytest
from pathlib import Path

def test_license_check():
    # Test implementation
    assert True
```

## Test Fixtures

Test fixtures are located in `tests/fixtures/`. See individual fixture directories for documentation.

## CI/CD

Tests run automatically on:
- Pull requests
- Pushes to main branch

See `.github/workflows/test.yml` for configuration.
