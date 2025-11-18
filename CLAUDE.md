# Scorecards - AI Context

## Documentation Guidelines

- Write concise, clear documentation
- Avoid repetition - apply DRY principle
- Reference existing docs rather than duplicating
- Assume mature technical audience

## Testing Guidelines

### Playwright E2E Tests

**IMPORTANT: Always run Playwright tests synchronously, never in background.**

When running Playwright tests:
- ✅ DO: Run tests synchronously without background flag
  ```bash
  npx playwright test --project=chromium
  npx playwright test tests/e2e/catalog.spec.js --project=chromium
  ```
- ❌ DON'T: Run tests in background or with `run_in_background: true`
- ❌ DON'T: Use commands like `npx playwright test 2>&1 &`

**Reason**: Playwright tests involve browser automation and timing-sensitive operations. Running them in background makes it difficult to track test progress, see failures in real-time, and properly handle test output.
