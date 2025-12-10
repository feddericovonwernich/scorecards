---
description: Playwright E2E test guidelines for tests/e2e/**
globs: tests/e2e/**/*.js, tests/e2e/**/*.spec.js
---

# Playwright E2E Test Guidelines

## Running Tests

```bash
# Standard run (prevents HTML report blocking)
PLAYWRIGHT_HTML_OPEN=never npx playwright test

# With coverage
npm run test:e2e:coverage
```

## Anti-Patterns

**NEVER use `waitForTimeout()`** - use state-based assertions instead:

```javascript
// Bad
await page.waitForTimeout(300);

// Good - wait for actual state
await expect(element).toBeVisible();
```

**Exception:** 100ms delay after `page.route()` registration is required for stability:

```javascript
await page.route('**/*', handler);
await page.waitForTimeout(100); // Required - route registration race condition
```

## State-Based Assertions

| Pattern | Use Case |
|---------|----------|
| `.toPass({ timeout: 3000 })` | Polling for async state changes |
| `toBeVisible()` / `toBeHidden()` | Element visibility |
| `toHaveCount(n)` | Element count after filtering |
| `toHaveAttribute(name, value)` | Data attributes (e.g., `data-theme`) |
| `toHaveClass(/pattern/)` | Active states, CSS classes |

### Examples

```javascript
// Polling assertion for async operations
await expect(async () => {
  const count = await getServiceCount(page);
  expect(count).toBe(5);
}).toPass({ timeout: 3000 });

// Element visibility
await expect(modal).toBeVisible();
await expect(modal).toBeHidden();

// Attributes and classes
await expect(tab).toHaveClass(/active/);
await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
```

## Helper Functions

Use `tests/e2e/test-helper.js` - don't duplicate common operations:

| Function | Purpose |
|----------|---------|
| `mockCatalogRequests(page)` | Set up API mocks for catalog |
| `waitForCatalogLoad(page)` | Wait for initial data load |
| `openServiceModal(page, name)` | Open service modal |
| `openTeamModal(page, name)` | Open team modal |
| `switchToTeamsView(page)` | Switch to teams view |
| `searchServices(page, query)` | Search with state assertion |
| `clickServiceModalTab(page, tab)` | Click tab with state wait |
| `mockWorkflowDispatch(page, opts)` | Mock GitHub Actions API |

## Fixtures

Mock data lives in `tests/e2e/fixtures/`:
- `docs/registry/registry.json` - Service catalog data
- `docs/data/*.json` - Individual service check results

### Fixture Guidelines

- **Mirror production structure**: Fixture paths match `docs/` directory layout
- **Use realistic data**: Include variety (different ranks, teams, timestamps)
- **Keep fixtures minimal**: Only include data needed for specific tests
- **Update fixtures carefully**: Changes affect multiple tests

### Creating Test Data

```javascript
// In test-helper.js, fixtures are served from tests/e2e/fixtures/
// Add new services to fixtures/docs/registry/registry.json
// Add check results to fixtures/docs/data/<service-name>.json
```

## Test Structure

```javascript
import { test, expect } from './coverage.js';
import { mockCatalogRequests, waitForCatalogLoad } from './test-helper.js';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should do something', async ({ page }) => {
    // Use state assertions, not timeouts
    await expect(page.locator('.element')).toBeVisible();
  });
});
```
