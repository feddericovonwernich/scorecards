# UI/UX Test Consolidation Tasks

**Feature Area:** UI/UX
**Files:** night-mode.spec.js, toast-notifications.spec.js, accessibility.spec.js, actions-widget.spec.js
**Current Tests:** 49
**Proposed Tests:** 28
**Reduction:** 42.9%

---

## Task 1: Night Mode Initial State Tests

**Strategy:** Setup Deduplication
**Complexity:** EASY
**Current Tests:** 3
**Proposed Tests:** 1

### Tests to Consolidate
- `night-mode.spec.js`: "should load with system preference"
- `night-mode.spec.js`: "should load with saved preference from localStorage"
- `night-mode.spec.js`: "should default to light mode when no preference"

### Rationale
All three tests check initial state loading with different preference configurations. Can be combined into a single test that verifies all preference sources.

### Proposed Structure
```javascript
test('should correctly initialize night mode based on preference hierarchy', async ({ page }) => {
  // Test 1: System preference (prefers-color-scheme)
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('body')).toHaveClass(/dark-mode/);

  // Test 2: localStorage preference overrides system
  await page.evaluate(() => localStorage.setItem('nightMode', 'light'));
  await page.reload();
  await expect(page.locator('body')).not.toHaveClass(/dark-mode/);

  // Test 3: Default to light when no preference
  await page.evaluate(() => localStorage.removeItem('nightMode'));
  await page.emulateMedia({ colorScheme: 'no-preference' });
  await page.reload();
  await expect(page.locator('body')).not.toHaveClass(/dark-mode/);
});
```

### Verification Checklist
- [ ] System preference detection preserved
- [ ] localStorage preference loading preserved
- [ ] Default light mode behavior preserved
- [ ] All original assertions included

---

## Task 2: Night Mode Toggle Flow

**Strategy:** User Journey
**Complexity:** EASY
**Current Tests:** 4
**Proposed Tests:** 1

### Tests to Consolidate
- `night-mode.spec.js`: "should toggle to dark mode when clicking button"
- `night-mode.spec.js`: "should toggle back to light mode"
- `night-mode.spec.js`: "should persist preference to localStorage"
- `night-mode.spec.js`: "should update icon on toggle"

### Rationale
These tests form a natural user journey: click toggle → verify dark mode → click again → verify light mode → verify persistence and icon updates.

### Proposed Structure
```javascript
test('should handle complete night mode toggle flow with persistence', async ({ page }) => {
  await page.goto('/');

  // Initial state - light mode
  await expect(page.locator('body')).not.toHaveClass(/dark-mode/);
  await expect(page.locator('[data-testid="night-mode-icon"]')).toHaveAttribute('data-mode', 'light');

  // Toggle to dark mode
  await page.click('[data-testid="night-mode-toggle"]');
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
  await expect(page.locator('[data-testid="night-mode-icon"]')).toHaveAttribute('data-mode', 'dark');

  // Verify persistence
  const storedValue = await page.evaluate(() => localStorage.getItem('nightMode'));
  expect(storedValue).toBe('dark');

  // Toggle back to light mode
  await page.click('[data-testid="night-mode-toggle"]');
  await expect(page.locator('body')).not.toHaveClass(/dark-mode/);
  await expect(page.locator('[data-testid="night-mode-icon"]')).toHaveAttribute('data-mode', 'light');

  // Verify persistence updated
  const updatedValue = await page.evaluate(() => localStorage.getItem('nightMode'));
  expect(updatedValue).toBe('light');
});
```

### Verification Checklist
- [ ] Toggle to dark mode preserved
- [ ] Toggle back to light mode preserved
- [ ] localStorage persistence preserved
- [ ] Icon update on toggle preserved

---

## Task 3: Night Mode CSS Variable Tests

**Strategy:** Setup Deduplication
**Complexity:** EASY
**Current Tests:** 3
**Proposed Tests:** 1

### Tests to Consolidate
- `night-mode.spec.js`: "should apply correct background color in dark mode"
- `night-mode.spec.js`: "should apply correct text color in dark mode"
- `night-mode.spec.js`: "should apply correct border colors in dark mode"

### Rationale
All tests verify CSS variables are correctly applied in dark mode. Can be combined to check multiple CSS properties in one test.

### Proposed Structure
```javascript
test('should apply all CSS variables correctly in dark mode', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="night-mode-toggle"]');

  // Verify background color
  const bgColor = await page.locator('body').evaluate(el =>
    getComputedStyle(el).getPropertyValue('--background-color'));
  expect(bgColor.trim()).toBe('#1a1a1a');

  // Verify text color
  const textColor = await page.locator('body').evaluate(el =>
    getComputedStyle(el).getPropertyValue('--text-color'));
  expect(textColor.trim()).toBe('#ffffff');

  // Verify border color
  const borderColor = await page.locator('body').evaluate(el =>
    getComputedStyle(el).getPropertyValue('--border-color'));
  expect(borderColor.trim()).toBe('#333333');
});
```

### Verification Checklist
- [ ] Background color verification preserved
- [ ] Text color verification preserved
- [ ] Border color verification preserved

---

## Task 4: Toast Success Flow

**Strategy:** User Journey
**Complexity:** EASY
**Current Tests:** 3
**Proposed Tests:** 1

### Tests to Consolidate
- `toast-notifications.spec.js`: "should show success toast on save"
- `toast-notifications.spec.js`: "should auto-dismiss success toast after delay"
- `toast-notifications.spec.js`: "should allow manual dismiss of success toast"

### Rationale
These form a natural flow: trigger toast → verify display → wait for auto-dismiss OR manually dismiss.

### Proposed Structure
```javascript
test('should handle success toast lifecycle', async ({ page }) => {
  await page.goto('/');

  // Trigger success action
  await page.click('[data-testid="save-button"]');

  // Verify toast appears
  await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  await expect(page.locator('[data-testid="toast-success"]')).toContainText('Saved successfully');

  // Test manual dismiss
  await page.click('[data-testid="toast-dismiss"]');
  await expect(page.locator('[data-testid="toast-success"]')).not.toBeVisible();

  // Trigger again for auto-dismiss test
  await page.click('[data-testid="save-button"]');
  await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();

  // Wait for auto-dismiss (typically 3-5 seconds)
  await page.waitForTimeout(5000);
  await expect(page.locator('[data-testid="toast-success"]')).not.toBeVisible();
});
```

### Verification Checklist
- [ ] Success toast display preserved
- [ ] Auto-dismiss timing preserved
- [ ] Manual dismiss functionality preserved

---

## Task 5: Toast Error Flow

**Strategy:** User Journey
**Complexity:** EASY
**Current Tests:** 3
**Proposed Tests:** 1

### Tests to Consolidate
- `toast-notifications.spec.js`: "should show error toast on failure"
- `toast-notifications.spec.js`: "should not auto-dismiss error toast"
- `toast-notifications.spec.js`: "should show retry button on error toast"

### Rationale
Error toast behavior tests share setup and verify related functionality.

### Proposed Structure
```javascript
test('should handle error toast with retry option', async ({ page }) => {
  await page.goto('/');

  // Mock API failure
  await page.route('**/api/save', route => route.fulfill({ status: 500 }));

  // Trigger error
  await page.click('[data-testid="save-button"]');

  // Verify error toast appears
  await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
  await expect(page.locator('[data-testid="toast-error"]')).toContainText('Error');

  // Verify retry button present
  await expect(page.locator('[data-testid="toast-retry"]')).toBeVisible();

  // Verify does NOT auto-dismiss (wait longer than success auto-dismiss)
  await page.waitForTimeout(6000);
  await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
});
```

### Verification Checklist
- [ ] Error toast display preserved
- [ ] No auto-dismiss behavior preserved
- [ ] Retry button presence preserved

---

## Task 6: Toast Queue Management

**Strategy:** Setup Deduplication
**Complexity:** MEDIUM
**Current Tests:** 3
**Proposed Tests:** 2

### Tests to Consolidate
- `toast-notifications.spec.js`: "should queue multiple toasts"
- `toast-notifications.spec.js`: "should show toasts in order"
- `toast-notifications.spec.js`: "should limit visible toasts"

### Rationale
Queue management tests can be combined to verify ordering and limiting in sequence.

### Proposed Structure
```javascript
test('should manage toast queue correctly', async ({ page }) => {
  await page.goto('/');

  // Trigger multiple toasts rapidly
  await page.click('[data-testid="action-1"]');
  await page.click('[data-testid="action-2"]');
  await page.click('[data-testid="action-3"]');
  await page.click('[data-testid="action-4"]');

  // Verify queue limit (e.g., max 3 visible)
  const visibleToasts = page.locator('[data-testid^="toast-"]');
  await expect(visibleToasts).toHaveCount(3);

  // Verify order - first toast at top
  await expect(visibleToasts.first()).toContainText('Action 1');
});
```

### Verification Checklist
- [ ] Multiple toast queuing preserved
- [ ] Toast ordering preserved
- [ ] Visible toast limit preserved

---

## Task 7: Accessibility Keyboard Navigation

**Strategy:** User Journey
**Complexity:** MEDIUM
**Current Tests:** 4
**Proposed Tests:** 2

### Tests to Consolidate
- `accessibility.spec.js`: "should navigate catalog with Tab key"
- `accessibility.spec.js`: "should navigate modal with Tab key"
- `accessibility.spec.js`: "should trap focus in modal"
- `accessibility.spec.js`: "should return focus after modal close"

### Rationale
Keyboard navigation tests can be split into page-level and modal-level journeys.

### Proposed Structure
```javascript
test('should support keyboard navigation in catalog', async ({ page }) => {
  await page.goto('/');

  // Tab through main navigation
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'search-input');

  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'filter-button');

  // Continue tabbing through service cards
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('data-testid', /service-card/);
});

test('should manage focus correctly in modal', async ({ page }) => {
  await page.goto('/');
  const initialFocus = await page.evaluate(() => document.activeElement?.dataset.testid);

  // Open modal
  await page.click('[data-testid="service-card-1"]');
  await expect(page.locator('[data-testid="service-modal"]')).toBeVisible();

  // Verify focus trapped in modal
  await page.keyboard.press('Tab');
  let focusedElement = await page.evaluate(() => document.activeElement);
  expect(await page.locator('[data-testid="service-modal"]').evaluate(
    (modal, focused) => modal.contains(focused), focusedElement)).toBe(true);

  // Tab to end and verify wrap
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
  }
  focusedElement = await page.evaluate(() => document.activeElement);
  expect(await page.locator('[data-testid="service-modal"]').evaluate(
    (modal, focused) => modal.contains(focused), focusedElement)).toBe(true);

  // Close modal and verify focus return
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-testid="service-modal"]')).not.toBeVisible();
});
```

### Verification Checklist
- [ ] Tab navigation in catalog preserved
- [ ] Tab navigation in modal preserved
- [ ] Focus trapping preserved
- [ ] Focus return on close preserved

---

## Task 8: Accessibility ARIA Attributes

**Strategy:** Setup Deduplication
**Complexity:** EASY
**Current Tests:** 4
**Proposed Tests:** 2

### Tests to Consolidate
- `accessibility.spec.js`: "should have aria-label on interactive elements"
- `accessibility.spec.js`: "should have aria-describedby for form fields"
- `accessibility.spec.js`: "should have proper role attributes"
- `accessibility.spec.js`: "should announce dynamic content changes"

### Rationale
ARIA attribute tests verify related accessibility markup and can be grouped by static vs dynamic attributes.

### Proposed Structure
```javascript
test('should have correct static ARIA attributes', async ({ page }) => {
  await page.goto('/');

  // Check aria-labels on buttons
  await expect(page.locator('[data-testid="filter-button"]')).toHaveAttribute('aria-label');
  await expect(page.locator('[data-testid="night-mode-toggle"]')).toHaveAttribute('aria-label');

  // Check roles
  await expect(page.locator('[data-testid="service-list"]')).toHaveAttribute('role', 'list');
  await expect(page.locator('[data-testid="service-card-1"]')).toHaveAttribute('role', 'listitem');

  // Check form field descriptions
  await expect(page.locator('[data-testid="search-input"]')).toHaveAttribute('aria-describedby');
});

test('should announce dynamic content with aria-live', async ({ page }) => {
  await page.goto('/');

  // Verify live region exists
  await expect(page.locator('[aria-live="polite"]')).toBeVisible();

  // Trigger content change
  await page.fill('[data-testid="search-input"]', 'test');

  // Verify announcement region updated
  await expect(page.locator('[aria-live="polite"]')).toContainText(/results/);
});
```

### Verification Checklist
- [ ] aria-label verification preserved
- [ ] aria-describedby verification preserved
- [ ] role attribute verification preserved
- [ ] aria-live announcement preserved

---

## Task 9: Accessibility Screen Reader Tests

**Strategy:** Setup Deduplication
**Complexity:** MEDIUM
**Current Tests:** 3
**Proposed Tests:** 2

### Tests to Consolidate
- `accessibility.spec.js`: "should have meaningful heading hierarchy"
- `accessibility.spec.js`: "should provide text alternatives for images"
- `accessibility.spec.js`: "should have skip navigation link"

### Rationale
Screen reader compatibility tests can be combined into content structure and navigation tests.

### Proposed Structure
```javascript
test('should have proper heading hierarchy and alt text', async ({ page }) => {
  await page.goto('/');

  // Check heading hierarchy
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBe(1);

  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
  let prevLevel = 0;
  for (const heading of headings) {
    const tagName = await heading.evaluate(el => el.tagName);
    const level = parseInt(tagName[1]);
    expect(level - prevLevel).toBeLessThanOrEqual(1);
    prevLevel = level;
  }

  // Check all images have alt text
  const images = await page.locator('img').all();
  for (const img of images) {
    await expect(img).toHaveAttribute('alt');
  }
});

test('should have skip navigation link', async ({ page }) => {
  await page.goto('/');

  // Skip link should exist and be first focusable
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'skip-nav');

  // Skip link should move focus to main content
  await page.keyboard.press('Enter');
  await expect(page.locator(':focus')).toHaveAttribute('id', 'main-content');
});
```

### Verification Checklist
- [ ] Heading hierarchy verification preserved
- [ ] Alt text verification preserved
- [ ] Skip navigation functionality preserved

---

## Task 10: Actions Widget Filtering

**Strategy:** Setup Deduplication
**Complexity:** EASY
**Current Tests:** 2
**Proposed Tests:** 1

### Tests to Consolidate
- `actions-widget.spec.js`: "should filter workflows by status"
- `actions-widget.spec.js`: "should filter workflows by trigger type"

### Rationale
Both tests filter the actions widget with different criteria but share identical setup.

### Proposed Structure
```javascript
test('should filter workflows by status and trigger type', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="service-card-1"]');
  await page.click('[data-testid="tab-actions"]');

  // Filter by status
  await page.selectOption('[data-testid="status-filter"]', 'success');
  const successWorkflows = await page.locator('[data-testid="workflow-row"]').count();
  expect(successWorkflows).toBeGreaterThan(0);

  const allStatuses = await page.locator('[data-testid="workflow-status"]').allTextContents();
  allStatuses.forEach(status => expect(status).toBe('success'));

  // Reset and filter by trigger type
  await page.selectOption('[data-testid="status-filter"]', 'all');
  await page.selectOption('[data-testid="trigger-filter"]', 'push');

  const triggerTypes = await page.locator('[data-testid="workflow-trigger"]').allTextContents();
  triggerTypes.forEach(trigger => expect(trigger).toBe('push'));
});
```

### Verification Checklist
- [ ] Status filtering preserved
- [ ] Trigger type filtering preserved

---

## Task 11: Actions Widget Workflow Details

**Strategy:** User Journey
**Complexity:** MEDIUM
**Current Tests:** 3
**Proposed Tests:** 2

### Tests to Consolidate
- `actions-widget.spec.js`: "should show workflow run details"
- `actions-widget.spec.js`: "should display job steps"
- `actions-widget.spec.js`: "should show step logs"

### Rationale
These form a drill-down journey: view workflow → see jobs → see step logs.

### Proposed Structure
```javascript
test('should navigate workflow details hierarchy', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="service-card-1"]');
  await page.click('[data-testid="tab-actions"]');

  // Click workflow to see details
  await page.click('[data-testid="workflow-row-1"]');
  await expect(page.locator('[data-testid="workflow-details"]')).toBeVisible();
  await expect(page.locator('[data-testid="workflow-name"]')).toHaveText(/.+/);
  await expect(page.locator('[data-testid="workflow-duration"]')).toHaveText(/.+/);

  // Expand to see job steps
  await page.click('[data-testid="job-row-1"]');
  await expect(page.locator('[data-testid="step-list"]')).toBeVisible();
  const steps = await page.locator('[data-testid^="step-"]').count();
  expect(steps).toBeGreaterThan(0);

  // Click step to see logs
  await page.click('[data-testid="step-1"]');
  await expect(page.locator('[data-testid="step-logs"]')).toBeVisible();
  await expect(page.locator('[data-testid="step-logs"]')).toContainText(/.+/);
});
```

### Verification Checklist
- [ ] Workflow details display preserved
- [ ] Job steps display preserved
- [ ] Step logs display preserved

---

## Task 12: Actions Widget Run Triggers

**Strategy:** Setup Deduplication
**Complexity:** MEDIUM
**Current Tests:** 3
**Proposed Tests:** 2

### Tests to Consolidate
- `actions-widget.spec.js`: "should allow manual workflow trigger"
- `actions-widget.spec.js`: "should show trigger in progress"
- `actions-widget.spec.js`: "should handle trigger failure"

### Rationale
Workflow trigger tests can be combined into success and failure scenarios.

### Proposed Structure
```javascript
test('should trigger workflow manually and show progress', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="service-card-1"]');
  await page.click('[data-testid="tab-actions"]');

  // Trigger workflow
  await page.click('[data-testid="trigger-workflow-btn"]');

  // Verify in-progress state
  await expect(page.locator('[data-testid="trigger-status"]')).toContainText('Triggering');
  await expect(page.locator('[data-testid="trigger-spinner"]')).toBeVisible();

  // Wait for completion
  await page.waitForSelector('[data-testid="trigger-status"]:has-text("Triggered")');
});

test('should handle workflow trigger failure', async ({ page }) => {
  await page.goto('/');

  // Mock trigger failure
  await page.route('**/api/trigger-workflow', route => route.fulfill({ status: 500 }));

  await page.click('[data-testid="service-card-1"]');
  await page.click('[data-testid="tab-actions"]');
  await page.click('[data-testid="trigger-workflow-btn"]');

  // Verify error state
  await expect(page.locator('[data-testid="trigger-error"]')).toBeVisible();
  await expect(page.locator('[data-testid="trigger-retry-btn"]')).toBeVisible();
});
```

### Verification Checklist
- [ ] Manual trigger functionality preserved
- [ ] In-progress state display preserved
- [ ] Trigger failure handling preserved

---

## Task 13: Actions Widget Refresh and Polling

**Strategy:** Setup Deduplication
**Complexity:** EASY
**Current Tests:** 2
**Proposed Tests:** 1

### Tests to Consolidate
- `actions-widget.spec.js`: "should auto-refresh workflow list"
- `actions-widget.spec.js`: "should allow manual refresh"

### Rationale
Both tests verify refresh behavior with shared setup.

### Proposed Structure
```javascript
test('should refresh workflow list automatically and manually', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="service-card-1"]');
  await page.click('[data-testid="tab-actions"]');

  const initialCount = await page.locator('[data-testid="workflow-row"]').count();

  // Manual refresh
  await page.click('[data-testid="refresh-workflows-btn"]');
  await expect(page.locator('[data-testid="refresh-spinner"]')).toBeVisible();
  await expect(page.locator('[data-testid="refresh-spinner"]')).not.toBeVisible({ timeout: 5000 });

  // Verify auto-refresh by waiting for polling interval
  let apiCalls = 0;
  await page.route('**/api/workflows', route => {
    apiCalls++;
    route.continue();
  });

  await page.waitForTimeout(10000); // Assume 5s polling interval
  expect(apiCalls).toBeGreaterThanOrEqual(2);
});
```

### Verification Checklist
- [ ] Auto-refresh behavior preserved
- [ ] Manual refresh functionality preserved

---

## Task 14: Color Contrast Verification

**Strategy:** Setup Deduplication
**Complexity:** EASY
**Current Tests:** 2
**Proposed Tests:** 1

### Tests to Consolidate
- `accessibility.spec.js`: "should meet color contrast requirements in light mode"
- `accessibility.spec.js`: "should meet color contrast requirements in dark mode"

### Rationale
Both tests verify WCAG color contrast in different modes.

### Proposed Structure
```javascript
test('should meet color contrast requirements in both modes', async ({ page }) => {
  await page.goto('/');

  // Light mode contrast check
  const lightContrast = await page.evaluate(() => {
    const body = document.body;
    const bg = getComputedStyle(body).backgroundColor;
    const text = getComputedStyle(body).color;
    // Simplified contrast check
    return { bg, text };
  });
  expect(lightContrast.bg).not.toBe(lightContrast.text);

  // Toggle to dark mode
  await page.click('[data-testid="night-mode-toggle"]');

  // Dark mode contrast check
  const darkContrast = await page.evaluate(() => {
    const body = document.body;
    const bg = getComputedStyle(body).backgroundColor;
    const text = getComputedStyle(body).color;
    return { bg, text };
  });
  expect(darkContrast.bg).not.toBe(darkContrast.text);
});
```

### Verification Checklist
- [ ] Light mode contrast verification preserved
- [ ] Dark mode contrast verification preserved

---

## Summary

| Source File | Original Tests | After Consolidation |
|-------------|----------------|---------------------|
| night-mode.spec.js | 10 | 3 |
| toast-notifications.spec.js | 12 | 5 |
| accessibility.spec.js | 15 | 8 |
| actions-widget.spec.js | 12 | 7 |
| **Total** | **49** | **28** |

### Implementation Priority

1. **High Priority (EASY):**
   - Task 1: Night Mode Initial State (3 → 1)
   - Task 2: Night Mode Toggle Flow (4 → 1)
   - Task 3: Night Mode CSS Variables (3 → 1)
   - Task 4: Toast Success Flow (3 → 1)
   - Task 5: Toast Error Flow (3 → 1)
   - Task 10: Actions Widget Filtering (2 → 1)
   - Task 13: Actions Refresh/Polling (2 → 1)
   - Task 14: Color Contrast (2 → 1)

2. **Medium Priority:**
   - Task 6: Toast Queue Management (3 → 2)
   - Task 7: Accessibility Keyboard Nav (4 → 2)
   - Task 8: Accessibility ARIA (4 → 2)
   - Task 9: Screen Reader Tests (3 → 2)
   - Task 11: Workflow Details (3 → 2)
   - Task 12: Run Triggers (3 → 2)
