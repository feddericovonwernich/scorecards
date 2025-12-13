# Scorecards Test Suite

## Structure

- `unit/` - Unit tests for individual functions and modules
  - `bash/` - Bats tests for shell scripts
  - `javascript/` - Jest tests for Node.js code
  - `python/` - pytest tests for Python code
- `e2e/` - End-to-end tests (Playwright)
- `integration/` - Integration tests for workflows and actions
- `fixtures/` - Test data and sample repositories

## Running Tests

```bash
# Run all unit tests
npm test

# Run specific test suites
npm run test:js        # Node.js tests only
npm run test:react     # React component tests only
npm run test:bash      # Bash tests only
npm run test:python    # Python tests only

# Run E2E tests
npm run test:e2e       # Run all E2E tests
npm run test:e2e:ui    # Run with Playwright UI
npm run test:e2e:headed # Run in headed browser

# Run with coverage
npm run test:coverage
npm run test:e2e:coverage  # E2E with Istanbul coverage

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

### React Components (Jest + React Testing Library)

```typescript
// docs/src/components/features/ServiceCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceCard } from './ServiceCard';

const mockService = {
  org: 'my-org',
  repo: 'my-service',
  score: 85,
  rank: 'Gold',
};

describe('ServiceCard', () => {
  it('displays service name', () => {
    render(<ServiceCard service={mockService} />);
    expect(screen.getByText('my-service')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    render(<ServiceCard service={mockService} onClick={handleClick} />);
    await userEvent.click(screen.getByRole('article'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

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

### E2E Tests (Playwright)

```typescript
// tests/e2e/service-modal.spec.ts
import { test, expect } from '@playwright/test';

test('opens service modal when card clicked', async ({ page }) => {
  await page.goto('/scorecards/services');
  await page.click('[data-testid="service-card-my-org-my-repo"]');
  await expect(page.locator('.service-modal')).toBeVisible();
  await expect(page.locator('.modal-header')).toContainText('my-repo');
});
```

## Test Fixtures

Test fixtures are located in `tests/fixtures/`. See individual fixture directories for documentation.

## CI/CD

Tests run automatically on:
- Pull requests
- Pushes to main branch

See `.github/workflows/test.yml` for configuration.

## Test Coverage

The frontend uses Istanbul for coverage instrumentation:

```bash
# Run E2E tests with coverage
npm run test:e2e:coverage

# View coverage report
npx nyc report
```

Coverage is collected via `vite-plugin-istanbul` during E2E test runs.
