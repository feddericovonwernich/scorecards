# Service Modal Test Consolidation Tasks

## Overview
- **Files**: service-modal.spec.js, clipboard-copy.spec.js, reload-button.spec.js
- **Current tests**: 40
- **Target tests**: 24
- **Reduction**: 40%

## Tasks

### Task 1: Modal Open/Close Journey
**Complexity**: EASY
**Files affected**: service-modal.spec.js

**Current tests to replace**:
- [ ] `should open, display service info, and close correctly` (service-modal.spec.js:13)
- [ ] `should close with Escape key` (service-modal.spec.js:27)

**New test to create**:
```javascript
test('should open modal, display service info, and close via X button or Escape key', async ({ page }) => {
  await openServiceModal(page, 'test-repo-perfect');
  const modal = page.locator('#service-modal');

  // Verify modal content
  await expect(modal).toBeVisible();
  await expect(modal.locator('h2')).toContainText('test-repo-perfect');
  await expect(modal).toContainText('76');
  await expect(modal).toContainText('Gold');

  // Close with X button
  await closeServiceModal(page);
  await expect(modal).not.toBeVisible();

  // Reopen and close with Escape
  await openServiceModal(page, 'test-repo-perfect');
  await expect(modal).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 2: Clipboard Copy Complete Journey
**Complexity**: EASY
**Files affected**: clipboard-copy.spec.js

**Current tests to replace**:
- [ ] `should copy score badge markdown when clicking Copy` (clipboard-copy.spec.js:40)
- [ ] `should show Copied! feedback state` (clipboard-copy.spec.js:69)
- [ ] `should reset to Copy after timeout` (clipboard-copy.spec.js:81)

**New test to create**:
```javascript
test('should copy badge markdown, show feedback, and reset after timeout', async ({ page }) => {
  await openServiceModal(page, 'test-repo-perfect');
  await clickServiceModalTab(page, 'Badges');

  const modal = page.locator('#service-modal');
  const copyButton = modal.locator('button').filter({ hasText: /Copy/i }).first();

  // Copy badge
  await copyButton.click();
  const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
  await expect(clipboardContent).toContain('![Score]');
  await expect(clipboardContent).toContain('img.shields.io');

  // Feedback shown
  await expect(modal).toContainText(/Copied/i);

  // Wait for reset (typically 2-3 seconds)
  await page.waitForTimeout(3500);
  const resetButton = modal.locator('button').filter({ hasText: /Copy/i }).first();
  await expect(resetButton).toBeVisible();

  await closeServiceModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 3: Badge URL Content Validation
**Complexity**: EASY
**Files affected**: clipboard-copy.spec.js

**Current tests to replace**:
- [ ] `should include correct repo in badge URL` (clipboard-copy.spec.js:102)
- [ ] `should include correct org in badge URL` (clipboard-copy.spec.js:114)

**New test to create**:
```javascript
test('should include correct org and repo in badge URL', async ({ page }) => {
  await openServiceModal(page, 'test-repo-perfect');
  await clickServiceModalTab(page, 'Badges');

  const modal = page.locator('#service-modal');
  const copyButton = modal.locator('button').filter({ hasText: /Copy/i }).first();
  await copyButton.click();

  const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
  await expect(clipboardContent).toContain('test-repo-perfect');
  await expect(clipboardContent).toContain('feddericovonwernich');

  await closeServiceModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 4: Badge Markdown Format Validation
**Complexity**: EASY
**Files affected**: clipboard-copy.spec.js

**Current tests to replace**:
- [ ] `should have valid markdown image syntax` (clipboard-copy.spec.js:196)
- [ ] `should use shields.io endpoint URL` (clipboard-copy.spec.js:210)
- [ ] `should reference catalog badges path` (clipboard-copy.spec.js:222)

**New test to create**:
```javascript
test('should generate valid markdown with shields.io URL and catalog badges path', async ({ page }) => {
  await openServiceModal(page, 'test-repo-perfect');
  await clickServiceModalTab(page, 'Badges');

  const modal = page.locator('#service-modal');
  const copyButton = modal.locator('button').filter({ hasText: /Copy/i }).first();
  await copyButton.click();

  const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());

  // Valid markdown syntax
  await expect(clipboardContent).toMatch(/!\[.+\]\(.+\)/);

  // Shields.io endpoint
  await expect(clipboardContent).toContain('https://img.shields.io/endpoint');

  // Catalog badges path
  await expect(clipboardContent).toContain('catalog/badges');

  await closeServiceModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 5: Badge Type Specific Markdown
**Complexity**: EASY
**Files affected**: clipboard-copy.spec.js

**Current tests to replace**:
- [ ] `should reference score.json for score badge` (clipboard-copy.spec.js:234)
- [ ] `should reference rank.json for rank badge` (clipboard-copy.spec.js:246)

**New test to create**:
```javascript
test('should reference correct JSON files for score and rank badges', async ({ page }) => {
  await openServiceModal(page, 'test-repo-perfect');
  await clickServiceModalTab(page, 'Badges');

  const modal = page.locator('#service-modal');
  const copyButtons = modal.locator('button').filter({ hasText: /Copy/i });

  // First copy button (score)
  await copyButtons.first().click();
  let clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
  await expect(clipboardContent).toContain('score.json');

  // Second copy button (rank)
  await copyButtons.nth(1).click();
  clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
  await expect(clipboardContent).toContain('rank.json');

  await closeServiceModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 6: Tab Navigation Complete Journey
**Complexity**: MEDIUM
**Files affected**: service-modal.spec.js

**Current tests to replace**:
- [ ] `should default to Check Results tab and switch correctly` (service-modal.spec.js:292)
- [ ] `should have keyboard accessible tabs` (service-modal.spec.js:317)

**New test to create**:
```javascript
test('should navigate tabs via click and keyboard, preserving active state', async ({ page }) => {
  await openServiceModal(page, 'test-repo-perfect');
  const modal = page.locator('#service-modal');

  // Check Results default active
  const checkResultsTab = modal.getByRole('button', { name: 'Check Results' });
  await expect(checkResultsTab.evaluate(el => el.classList.contains('active'))).toBe(true);
  await expect(modal).toContainText(/passed|failed|Weight/i);

  // Switch to API tab
  const apiTab = modal.getByRole('button', { name: 'API' });
  await apiTab.click();
  await expect(apiTab.evaluate(el => el.classList.contains('active'))).toBe(true);
  await expect(modal).toContainText(/OpenAPI|API|paths/i);

  // Switch to Contributors tab
  await clickServiceModalTab(page, 'Contributors');
  await expect(modal).toContainText(/Recent Contributors/i);

  // Switch to Badges tab
  await clickServiceModalTab(page, 'Badges');
  await expect(modal).toContainText(/Badge Preview/i);

  // Back to Contributors (state preservation)
  await clickServiceModalTab(page, 'Contributors');
  await expect(modal).toContainText(/Recent Contributors/i);

  // Keyboard navigation - verify only one tab active at a time
  await expect(modal.locator('.tab-btn.active').count()).toBe(1);

  await closeServiceModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 7: API Specification Tab Complete View
**Complexity**: EASY
**Files affected**: service-modal.spec.js

**Current tests to replace**:
- [ ] `should display complete API specification information` (service-modal.spec.js:114)
- [ ] `should have expandable raw specification section` (service-modal.spec.js:136)
- [ ] `should show environment configuration message` (service-modal.spec.js:150)

**New test to create**:
```javascript
test('should display API specification info, expandable raw spec, and environment config', async ({ page }) => {
  await openServiceModal(page, 'test-repo-perfect');
  await clickServiceModalTab(page, 'API');

  const modal = page.locator('#service-modal');

  // API metadata
  await expect(modal).toContainText('Perfect Example API');
  await expect(modal).toContainText('1.0.0');
  await expect(modal).toContainText('openapi.yaml');
  await expect(modal).toContainText('3.0');
  await expect(modal).toContainText(/\d+ paths/i);
  await expect(modal).toContainText(/\d+ operations/i);

  const githubLink = modal.locator('a[href*="github.com"][href*="openapi.yaml"]');
  await expect(githubLink).toBeVisible();
  await expect(githubLink).toHaveAttribute('href', /github\.com.*openapi\.yaml/);

  // Raw spec expansion
  const rawSpecToggle = modal.locator('button, summary').filter({ hasText: /Raw|Specification/i });
  await expect(rawSpecToggle).toBeVisible();
  await rawSpecToggle.click();
  const hasCodeBlock = await modal.locator('pre, code').count() > 0;
  await expect(hasCodeBlock).toBe(true);

  // Environment config
  await expect(modal).toContainText(/Configure environments|\.scorecard\/config\.yml|API Explorer/i);

  await closeServiceModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 8: Reload Button State Transitions Complete Flow
**Complexity**: MEDIUM
**Files affected**: reload-button.spec.js

**Current tests to replace**:
- [ ] `should transition through correct icon states` (reload-button.spec.js:100)
- [ ] `should transition background colors correctly` (reload-button.spec.js:166)
- [ ] `should reset button after 3 seconds in success state` (reload-button.spec.js:250)

**New test to create**:
```javascript
test('should transition icons and colors through idle→loading→success→reset states', async ({ page }) => {
  await setGitHubPAT(page, mockPAT);
  await mockWorkflowDispatch(page, { status: 204 });

  const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
  const reloadBtn = staleCard.locator('button[title*="Re-run"]');

  // Initial state - reload icon, orange background
  await expect(reloadBtn).toBeVisible();
  let svgPath = await reloadBtn.locator('svg path').getAttribute('d');
  expect(svgPath).toContain('1.705'); // reload icon
  await expect(reloadBtn).toHaveCSS('background', /rgb\(245, 158, 11\)/); // orange

  // Click - should disable and start loading
  await reloadBtn.click();
  await expect(reloadBtn).toBeDisabled();

  // Success state - checkmark icon, green background
  await page.waitForTimeout(500);
  svgPath = await reloadBtn.locator('svg path').getAttribute('d');
  expect(svgPath).toContain('13.78'); // checkmark icon
  expect(svgPath).not.toContain('1.705');
  await expect(reloadBtn).toHaveCSS('background-color', 'rgb(16, 185, 129)'); // green

  // After 3s reset - back to reload icon, orange background
  await page.waitForTimeout(3500);
  svgPath = await reloadBtn.locator('svg path').getAttribute('d');
  expect(svgPath).toContain('1.705'); // back to reload icon
  await expect(reloadBtn).toHaveCSS('background', /rgb\(245, 158, 11\)/); // back to orange
  await expect(reloadBtn).not.toBeDisabled();
  await expect(reloadBtn).toHaveAttribute('title', 'Re-run scorecard workflow');
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 9: Reload Button Icon-Only Display
**Complexity**: EASY
**Files affected**: reload-button.spec.js

**Current tests to replace**:
- [ ] `should never display text in button, only icons` (reload-button.spec.js:40)
- [ ] `should apply spinning animation during loading` (reload-button.spec.js:131)

**New test to create**:
```javascript
test('should display only SVG icons (no text) and apply spinning animation during loading', async ({ page }) => {
  await setGitHubPAT(page, mockPAT);
  await mockWorkflowDispatch(page, { status: 204, delay: 500 });

  const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
  const reloadBtn = staleCard.locator('button[title*="Re-run"]');
  const svg = reloadBtn.locator('svg');

  // Before click: icon only, no text, no spinning
  let content = await reloadBtn.innerHTML();
  expect(content).toContain('<svg');
  expect(content).not.toMatch(/Trigger/i);
  expect(content).not.toMatch(/Loading/i);
  await expect(svg).not.toHaveClass(/spinning/);

  // During loading: still no text, spinning
  await reloadBtn.click();
  content = await reloadBtn.innerHTML();
  expect(content).toContain('<svg');
  expect(content).not.toMatch(/Trigger/i);
  await expect(svg).toHaveClass(/spinning/);

  // Wait for success
  await page.waitForTimeout(600);

  // Success: icon only, no spinning
  content = await reloadBtn.innerHTML();
  expect(content).toContain('<svg');
  expect(content).not.toMatch(/Success/i);
  await expect(svg).not.toHaveClass(/spinning/);

  // After reset: no spinning
  await page.waitForTimeout(3500);
  await expect(svg).not.toHaveClass(/spinning/);
  await expect(reloadBtn).toHaveCSS('background-color', 'rgb(245, 158, 11)');
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 10: Mobile Tab Scroll Complete Behavior
**Complexity**: EASY
**Files affected**: service-modal.spec.js

**Current tests to replace**:
- [ ] `should have tabs container and handle scroll correctly on mobile` (service-modal.spec.js:337)
- [ ] `should not show scroll arrows on desktop when content fits` (service-modal.spec.js:367)

**New test to create**:
```javascript
test('should show scroll arrows on mobile and hide on desktop when content fits', async ({ page }) => {
  // Mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await openServiceModal(page, 'test-repo-perfect');

  const modal = page.locator('#service-modal');
  const tabsContainer = modal.locator('.tabs-container');
  const tabs = modal.locator('.tabs');

  await expect(tabsContainer).toBeVisible();
  await expect(tabs).toBeVisible();
  await expect(page.locator('.tab-btn').first()).toBeVisible();

  // At start, no left scroll arrow
  await expect(page.locator('.tab-scroll-left')).toHaveCount(0);
  const initialScrollLeft = await tabs.evaluate(el => el.scrollLeft);
  expect(initialScrollLeft).toBe(0);

  // Scroll right
  await tabs.evaluate(el => el.scrollBy({ left: 100 }));
  expect(await tabs.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  await expect(page.locator('.tab-scroll-left')).toBeVisible();

  await closeServiceModal(page);

  // Desktop viewport
  await page.setViewportSize({ width: 1280, height: 800 });
  await openServiceModal(page, 'test-repo-perfect');

  const leftCount = await page.locator('.tab-scroll-left').count();
  const rightCount = await page.locator('.tab-scroll-right').count();
  expect(leftCount + rightCount).toBeLessThanOrEqual(1);

  await closeServiceModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 11: Workflow Runs Tab PAT States
**Complexity**: EASY
**Files affected**: service-modal.spec.js

**Current tests to replace**:
- [ ] `should show PAT required message and Configure Token button when no token` (service-modal.spec.js:227)
- [ ] `should show workflow filter and refresh controls with PAT` (service-modal.spec.js:238)
- [ ] `should display workflow runs when API returns data` (service-modal.spec.js:259)

**New test to create**:
```javascript
test('should show PAT prompt without token, then controls and data with valid token', async ({ page }) => {
  await openServiceModal(page, 'test-repo-perfect');
  await clickServiceModalTab(page, 'Workflow Runs');

  const modal = page.locator('#service-modal');

  // No token state
  const hasPrompt = await modal.getByText(/GitHub PAT|Configure Token/i).count() > 0;
  expect(hasPrompt).toBe(true);
  const configButton = modal.getByRole('button', { name: /Configure Token/i });
  await expect(configButton).toBeVisible();

  await closeServiceModal(page);

  // Set PAT and mock workflow runs
  await setGitHubPAT(page, mockPAT);
  await mockWorkflowRuns(page, { runs: mockWorkflowRunsData });

  await openServiceModal(page, 'test-repo-perfect');
  await clickServiceModalTab(page, 'Workflow Runs');

  // With token - controls visible
  await expect(modal.getByRole('button', { name: /All/i })).toBeVisible();
  const refreshDropdown = modal.locator('select[aria-label*="Refresh"], .refresh-dropdown');
  expect(await refreshDropdown.count()).toBeGreaterThan(0);

  // With data - workflow visible
  await expect(modal).toContainText(/CI|workflow/i);

  await closeServiceModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 12: Check Results Display and Categories
**Complexity**: EASY
**Files affected**: service-modal.spec.js

**Current tests to replace**:
- [ ] `should display all check information correctly` (service-modal.spec.js:45)
- [ ] `should display check categories with correct functionality` (service-modal.spec.js:69)
- [ ] `should show specific check pass/fail status` (service-modal.spec.js:100)

**New test to create**:
```javascript
test('should display check results with categories, pass/fail indicators, and collapse/expand', async ({ page }) => {
  await openServiceModal(page, 'test-repo-perfect');
  const modal = page.locator('#service-modal');

  // Check count and indicators
  const checkResults = modal.locator('.check-result');
  const count = await checkResults.count();
  expect(count).toBeGreaterThanOrEqual(10);

  const passedChecks = modal.locator('.check-result.passed, .check-passed');
  expect(await passedChecks.count()).toBeGreaterThan(0);

  const failedChecks = modal.locator('.check-result.failed, .check-failed');
  expect(await failedChecks.count()).toBeGreaterThan(0);

  const outputSection = modal.locator('.check-output, [class*="output"]').first();
  await expect(outputSection).toBeVisible();

  const weightText = modal.locator('.check-weight, [class*="weight"]');
  await expect(weightText.first()).toBeVisible();

  const statValue = modal.locator('.stat-value, [class*="stat"]').first();
  await expect(statValue).toBeVisible();

  // Categories
  await expect(modal.locator('.category-name').filter({ hasText: 'Scorecards Setup' })).toBeVisible();
  await expect(modal.locator('.category-name').filter({ hasText: 'Documentation' })).toBeVisible();

  const categories = modal.locator('details.category, .check-category');
  expect(await categories.count()).toBeGreaterThan(0);

  const firstCategory = categories.first();
  expect(await firstCategory.getAttribute('open')).not.toBeNull();

  const categoryStats = modal.locator('.category-stats');
  await expect(categoryStats.first()).toContainText(/\d+\/\d+ passed/);

  // Collapse/expand
  await firstCategory.locator('summary').click();
  expect(await firstCategory.getAttribute('open')).toBeNull();

  await firstCategory.locator('summary').click();
  expect(await firstCategory.getAttribute('open')).not.toBeNull();

  // Specific checks
  const readmeCheck = modal.locator('.check-result').filter({ hasText: 'README' });
  await expect(readmeCheck).toContainText('✓');

  const configCheck = modal.locator('.check-result').filter({ hasText: 'Config' });
  await expect(configCheck).toContainText('✗');

  await closeServiceModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 13: Badge Copy Button Variations
**Complexity**: EASY
**Files affected**: clipboard-copy.spec.js

**Current tests to replace**:
- [ ] `should have copy buttons in Badges tab` (clipboard-copy.spec.js:30)
- [ ] `should copy rank badge markdown when clicking second Copy` (clipboard-copy.spec.js:54)
- [ ] `should handle multiple consecutive copies` (clipboard-copy.spec.js:126)

**New test to create**:
```javascript
test('should have multiple copy buttons and handle consecutive copies of score and rank badges', async ({ page }) => {
  await openServiceModal(page, 'test-repo-perfect');
  await clickServiceModalTab(page, 'Badges');

  const modal = page.locator('#service-modal');
  const copyButtons = modal.locator('button').filter({ hasText: /Copy/i });

  // Multiple copy buttons exist
  const count = await copyButtons.count();
  expect(count).toBeGreaterThanOrEqual(2);

  // Second button (rank)
  await copyButtons.nth(1).click();
  let clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardContent).toContain('![Rank]');
  expect(clipboardContent).toContain('img.shields.io');

  // Feedback shown
  await expect(modal).toContainText(/Copied/i);

  // Multiple consecutive copies
  await page.waitForTimeout(100);
  await copyButtons.first().click();
  clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardContent).toBeTruthy();

  await closeServiceModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

## Tests to Keep Unchanged

- `should have GitHub link and Refresh Data button` (service-modal.spec.js:33) - Unique assertion for specific UI elements
- `should not show Links tab when service has no links` (service-modal.spec.js:285) - Edge case testing conditional rendering
- `should group checks by category with case-insensitive matching` (service-modal.spec.js:378) - Specific edge case behavior
- `should handle clipboard API unavailable` (clipboard-copy.spec.js:156) - Error handling with unique mock setup
- `should display markdown snippets even without clipboard` (clipboard-copy.spec.js:175) - Fallback behavior test
- `should show reload button only on stale+installed services` (reload-button.spec.js:22) - Conditional rendering logic
- `should show error state on API failure` (reload-button.spec.js:197) - Error path with unique mock
- `should show warning when clicking without GitHub PAT` (reload-button.spec.js:234) - Auth validation test
- `should be keyboard accessible` (reload-button.spec.js:279) - Accessibility-specific test
- `should display complete contributor information` (service-modal.spec.js:158) - Complete Contributors tab test
- `should display badge previews and markdown correctly` (service-modal.spec.js:186) - UI preview test
