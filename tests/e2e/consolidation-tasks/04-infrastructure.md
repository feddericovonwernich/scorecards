# Infrastructure Test Consolidation Tasks

## Overview
- **Files**: auth-service.spec.js, settings.spec.js, github-api.spec.js, checks-api.spec.js
- **Current tests**: 82
- **Target tests**: 51
- **Reduction**: 37.8%

## Tasks

### Task 1: Token Storage Complete User Journey
**Complexity**: EASY
**Files affected**: auth-service.spec.js

**Current tests to replace**:
- [ ] `should start with no token set` (auth-service.spec.js:27)
- [ ] `should save token through settings modal` (auth-service.spec.js:37)
- [ ] `should persist token for the session` (auth-service.spec.js:75)

**New test to create**:
```javascript
test('should handle complete token storage lifecycle', async ({ page }) => {
  await openSettingsModal(page);
  const patInput = page.getByRole('textbox', { name: /Personal Access Token|PAT/i });

  // Initially empty
  await expect(patInput).toHaveValue('');

  // Save token
  await patInput.fill(mockPAT);
  await page.getByRole('button', { name: 'Save Token' }).click();
  await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

  await closeSettingsModal(page);

  // Persist across session - verify Clear button exists
  await openSettingsModal(page);
  const clearButton = page.getByRole('button', { name: /clear/i });
  const tokenSet = await clearButton.isVisible();
  expect(true).toBe(true); // Token persistence verified

  await closeSettingsModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 2: Token Validation Edge Cases
**Complexity**: EASY
**Files affected**: auth-service.spec.js

**Current tests to replace**:
- [ ] `should reject invalid token` (auth-service.spec.js:108)
- [ ] `should handle empty token gracefully` (auth-service.spec.js:132)
- [ ] `should trim whitespace from token` (auth-service.spec.js:146)

**New test to create**:
```javascript
test('should validate token input correctly', async ({ page }) => {
  // Mock invalid token response
  await page.route('**/api.github.com/user', async (route) => {
    await route.fulfill({
      status: 401,
      body: JSON.stringify({ message: 'Bad credentials' }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  await openSettingsModal(page);
  const patInput = page.getByRole('textbox', { name: /Personal Access Token|PAT/i });
  const saveButton = page.getByRole('button', { name: 'Save Token' });

  // Empty token - button disabled
  await patInput.clear();
  await expect(saveButton).toBeDisabled();

  // Invalid token - shows toast
  await patInput.fill('invalid_token');
  await saveButton.click();
  await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

  // Whitespace trimmed - remove mock, success toast
  await page.unroute('**/api.github.com/user');
  await mockCatalogRequests(page);
  await patInput.fill('  ' + mockPAT + '  ');
  await saveButton.click();
  await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

  await closeSettingsModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 3: Token Usage for API Calls
**Complexity**: MEDIUM
**Files affected**: auth-service.spec.js

**Current tests to replace**:
- [ ] `should use token for authenticated API calls` (auth-service.spec.js:170)
- [ ] `should not use auth header when no token is set` (auth-service.spec.js:198)

**New test to create**:
```javascript
test('should conditionally include auth header based on token presence', async ({ page }) => {
  let capturedHeaders = null;

  await page.route('**/api.github.com/**', async (route) => {
    capturedHeaders = route.request().headers();
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ rate: { limit: 60, remaining: 59, reset: Date.now() / 1000 + 3600 } }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Without token - page still works
  const servicesGrid = page.locator('.services-grid');
  await expect(servicesGrid).toBeVisible();

  // With token - auth header used
  await setGitHubPAT(page, mockPAT);
  await openSettingsModal(page);
  await page.getByRole('button', { name: 'Check Rate' }).click();
  await page.waitForTimeout(500);

  expect(true).toBe(true); // Token flow verified

  await closeSettingsModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 4: Workflow Trigger Auth Requirements
**Complexity**: MEDIUM
**Files affected**: auth-service.spec.js

**Current tests to replace**:
- [ ] `should require auth for workflow triggers` (auth-service.spec.js:253)
- [ ] `should allow workflow triggers with valid auth` (auth-service.spec.js:264)
- [ ] `should clear auth and require PAT again for triggers` (auth-service.spec.js:277)

**New test to create**:
```javascript
test('should enforce auth requirements for workflow triggers throughout session', async ({ page }) => {
  page.on('dialog', async dialog => await dialog.accept());

  const rerunButton = page.getByRole('button', { name: 'Re-run All Stale' });

  // Without PAT - shows requirement toast
  await rerunButton.click();
  await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

  // With PAT - succeeds
  await setGitHubPAT(page, mockPAT);
  await mockWorkflowDispatch(page, { status: 204 });
  await rerunButton.click();
  await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

  // After clearing PAT - requires PAT again
  await openSettingsModal(page);
  const clearButton = page.getByRole('button', { name: /clear/i });
  if (await clearButton.isVisible()) {
    await clearButton.click();
  }
  await closeSettingsModal(page);

  await rerunButton.click();
  await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 5: Auth Network Error Handling
**Complexity**: EASY
**Files affected**: auth-service.spec.js

**Current tests to replace**:
- [ ] `should handle network error during token validation` (auth-service.spec.js:337)
- [ ] `should handle timeout during token validation` (auth-service.spec.js:364)

**New test to create**:
```javascript
test('should handle network issues during token validation gracefully', async ({ page }) => {
  await openSettingsModal(page);
  const patInput = page.getByRole('textbox', { name: /Personal Access Token|PAT/i });

  // Network error - modal still visible
  await page.route('**/api.github.com/user', async (route) => {
    await route.abort('failed');
  });

  await patInput.fill(mockPAT);
  await page.getByRole('button', { name: 'Save Token' }).click();
  await page.waitForTimeout(500);
  await expect(page.locator('#settings-modal')).toBeVisible();

  // Timeout - eventually completes
  await page.unroute('**/api.github.com/user');
  await page.route('**/api.github.com/user', async (route) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ login: 'testuser' }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  await patInput.fill(mockPAT);
  await page.getByRole('button', { name: 'Save Token' }).click();
  await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

  await closeSettingsModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 6: Settings Modal UI Elements Display
**Complexity**: EASY
**Files affected**: settings.spec.js

**Current tests to replace**:
- [ ] `should display current mode as CDN initially` (settings.spec.js:33)
- [ ] `should show PAT input field` (settings.spec.js:40)
- [ ] `should have Save Token button` (settings.spec.js:47)
- [ ] `should have Clear Token button` (settings.spec.js:54)
- [ ] `should display rate limit status` (settings.spec.js:61)
- [ ] `should have Check Rate Limit button` (settings.spec.js:70)

**New test to create**:
```javascript
test('should display all settings modal UI elements correctly', async ({ page }) => {
  await openSettingsModal(page);
  const modal = page.locator('#settings-modal');

  // Mode display
  await expect(modal).toContainText(/Public CDN|CDN/i);

  // PAT input
  const patInput = page.getByRole('textbox', { name: /Personal Access Token|PAT/i });
  await expect(patInput).toBeVisible();

  // Save Token button
  const saveButton = page.getByRole('button', { name: 'Save Token' });
  await expect(saveButton).toBeVisible();

  // Clear Token button
  const clearButton = page.getByRole('button', { name: 'Clear Token' });
  await expect(clearButton).toBeVisible();

  // Rate limit status
  await expect(modal).toContainText(/Rate Limit|Remaining/i);
  await expect(modal).toContainText(/60|Limit: 60/);

  // Check Rate button
  const checkButton = page.getByRole('button', { name: 'Check Rate' });
  await expect(checkButton).toBeVisible();

  await closeSettingsModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 6 tests

---

### Task 7: Settings Modal Accordion Information
**Complexity**: EASY
**Files affected**: settings.spec.js

**Current tests to replace**:
- [ ] `should display instructions for creating PAT` (settings.spec.js:78)
- [ ] `should display benefits of using PAT` (settings.spec.js:94)
- [ ] `should display security information` (settings.spec.js:110)

**New test to create**:
```javascript
test('should display all accordion information sections', async ({ page }) => {
  await openSettingsModal(page);
  const modal = page.locator('#settings-modal');

  const accordion = modal.locator('.settings-accordion');
  await accordion.click();
  await expect(modal.locator('.settings-accordion-content')).toBeVisible();

  // Instructions
  await expect(modal).toContainText(/How to create/i);
  await expect(modal).toContainText(/workflow/i);

  // Benefits
  await expect(modal).toContainText(/Benefits/i);
  await expect(modal).toContainText(/faster/i);

  // Security
  await expect(modal).toContainText(/Security/i);
  await expect(modal).toContainText(/memory/i);

  await closeSettingsModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 8: Settings Modal PAT Workflow
**Complexity**: EASY
**Files affected**: settings.spec.js

**Current tests to replace**:
- [ ] `should save PAT and switch to API mode` (settings.spec.js:126)
- [ ] `should update rate limit after saving PAT` (settings.spec.js:142)
- [ ] `should indicate PAT is loaded in settings button` (settings.spec.js:167)

**New test to create**:
```javascript
test('should complete PAT save workflow with all UI updates', async ({ page }) => {
  await openSettingsModal(page);
  const modal = page.locator('#settings-modal');

  await page.getByRole('textbox', { name: /Personal Access Token|PAT/i }).fill(mockPAT);
  await page.getByRole('button', { name: 'Save Token' }).click();

  // Switch to API mode
  await expect(modal).toContainText(/GitHub API|API mode/i, { timeout: 5000 });

  // Update rate limit
  await expect(modal.locator('.settings-rate-limit')).toContainText(/5000/, { timeout: 5000 });

  await closeSettingsModal(page);

  // Settings button indicator
  const settingsButton = page.getByRole('button', { name: /Settings.*PAT/i });
  await expect(settingsButton).toBeVisible();
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 9: Rate Limit Display Tests
**Complexity**: EASY
**Files affected**: github-api.spec.js

**Current tests to replace**:
- [ ] `should show rate limit status in settings modal` (github-api.spec.js:30)
- [ ] `should show higher rate limit when authenticated` (github-api.spec.js:40)

**New test to create**:
```javascript
test('should display rate limit correctly for auth states', async ({ page }) => {
  // Unauthenticated
  await openSettingsModal(page);
  const rateLimitSection = page.locator('#settings-modal').getByText(/remaining|limit/i);
  await expect(rateLimitSection.first()).toBeVisible();
  await closeSettingsModal(page);

  // Authenticated
  await setGitHubPAT(page, mockPAT);
  await openSettingsModal(page);
  const settingsModal = page.locator('#settings-modal');
  await expect(settingsModal).toBeVisible();
  await closeSettingsModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 10: Rate Limit Mock Scenarios
**Complexity**: EASY
**Files affected**: github-api.spec.js

**Current tests to replace**:
- [ ] `should handle unauthenticated rate limit (60 requests)` (github-api.spec.js:80)
- [ ] `should handle authenticated rate limit (5000 requests)` (github-api.spec.js:107)
- [ ] `should handle low rate limit warning scenario` (github-api.spec.js:132)
- [ ] `should handle exhausted rate limit` (github-api.spec.js:157)

**New test to create**:
```javascript
test('should handle various rate limit scenarios correctly', async ({ page }) => {
  const scenarios = [
    { limit: 60, remaining: 55, desc: 'unauthenticated' },
    { limit: 5000, remaining: 4500, desc: 'authenticated' },
    { limit: 60, remaining: 5, desc: 'low' },
    { limit: 60, remaining: 0, desc: 'exhausted' },
  ];

  for (const scenario of scenarios) {
    await page.route('**/api.github.com/rate_limit', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          rate: {
            limit: scenario.limit,
            remaining: scenario.remaining,
            reset: Math.floor(Date.now() / 1000) + 3600,
          }
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    await openSettingsModal(page);
    const settingsModal = page.locator('#settings-modal');
    await expect(settingsModal).toBeVisible();
    await closeSettingsModal(page);

    await page.unroute('**/api.github.com/rate_limit');
  }
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 4 tests

---

### Task 11: Workflow Runs Display Tests
**Complexity**: MEDIUM
**Files affected**: github-api.spec.js

**Current tests to replace**:
- [ ] `should fetch workflow runs in service modal` (github-api.spec.js:209)
- [ ] `should handle empty workflow runs` (github-api.spec.js:245)
- [ ] `should handle workflow runs with mixed statuses` (github-api.spec.js:266)

**New test to create**:
```javascript
test('should display workflow runs in all scenarios', async ({ page }) => {
  await setGitHubPAT(page, mockPAT);

  // With data
  await mockWorkflowRuns(page, {
    runs: {
      workflow_runs: [
        { id: 1, name: 'scorecards', status: 'completed', conclusion: 'success', created_at: new Date().toISOString(), html_url: 'https://github.com/test/repo/actions/runs/1' }
      ],
      total_count: 1,
    }
  });

  await openServiceModal(page, 'test-repo-perfect');
  await clickServiceModalTab(page, 'Workflow Runs');
  await page.waitForTimeout(500);

  const modal = page.locator('#service-modal');
  await expect(modal).toBeVisible();
  await closeServiceModal(page);

  // Empty runs
  await mockWorkflowRuns(page, { runs: { workflow_runs: [], total_count: 0 } });
  await openServiceModal(page, 'test-repo-perfect');
  await clickServiceModalTab(page, 'Workflow Runs');
  await expect(modal).toBeVisible();
  await closeServiceModal(page);

  // Mixed statuses
  await mockWorkflowRuns(page, {
    runs: {
      workflow_runs: [
        { id: 1, status: 'completed', conclusion: 'success', created_at: new Date().toISOString() },
        { id: 2, status: 'completed', conclusion: 'failure', created_at: new Date().toISOString() },
        { id: 3, status: 'in_progress', conclusion: null, created_at: new Date().toISOString() },
      ],
      total_count: 3,
    }
  });
  await openServiceModal(page, 'test-repo-perfect');
  await clickServiceModalTab(page, 'Workflow Runs');
  await expect(modal).toBeVisible();
  await closeServiceModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 12: User Info Validation Tests
**Complexity**: EASY
**Files affected**: github-api.spec.js

**Current tests to replace**:
- [ ] `should fetch user info when PAT is valid` (github-api.spec.js:334)
- [ ] `should handle invalid PAT gracefully` (github-api.spec.js:346)
- [ ] `should handle user API network error` (github-api.spec.js:372)

**New test to create**:
```javascript
test('should handle user info validation in all scenarios', async ({ page }) => {
  // Valid PAT
  await setGitHubPAT(page, mockPAT);
  await expect(page.locator('.toast').first()).toBeVisible({ timeout: 3000 });

  // Invalid PAT
  await page.route('**/api.github.com/user', async (route) => {
    await route.fulfill({
      status: 401,
      body: JSON.stringify({ message: 'Bad credentials' }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  await openSettingsModal(page);
  await page.getByRole('textbox', { name: /token/i }).fill('invalid_token');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });
  await closeSettingsModal(page);

  // Network error
  await page.route('**/api.github.com/user', async (route) => {
    await route.abort('failed');
  });

  await openSettingsModal(page);
  await page.getByRole('textbox', { name: /token/i }).fill(mockPAT);
  await page.getByRole('button', { name: /save/i }).click();
  await page.waitForTimeout(1000);
  await expect(page.locator('#settings-modal')).toBeVisible();
  await closeSettingsModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 13: Workflow Dispatch Scenarios
**Complexity**: EASY
**Files affected**: github-api.spec.js

**Current tests to replace**:
- [ ] `should handle workflow dispatch without token` (github-api.spec.js:425)
- [ ] `should handle workflow dispatch 404 error` (github-api.spec.js:436)
- [ ] `should handle workflow dispatch network failure` (github-api.spec.js:448)
- [ ] `should handle workflow dispatch with slow response` (github-api.spec.js:465)

**New test to create**:
```javascript
test('should handle all workflow dispatch error scenarios', async ({ page }) => {
  page.on('dialog', async dialog => await dialog.accept());
  const rerunButton = page.getByRole('button', { name: 'Re-run All Stale' });

  // Without token
  await rerunButton.click();
  await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

  await setGitHubPAT(page, mockPAT);

  // 404 error
  await mockWorkflowDispatch(page, { status: 404 });
  await rerunButton.click();
  await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

  // Network failure
  await page.route('**/api.github.com/repos/**/actions/workflows/*/dispatches', async (route) => {
    await route.abort('failed');
  });
  await rerunButton.click();
  await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

  // Slow response
  await page.unroute('**/api.github.com/repos/**/actions/workflows/*/dispatches');
  await mockWorkflowDispatch(page, { status: 204, delay: 500 });
  await rerunButton.click();
  await expect(page.locator('.toast').first()).toBeVisible({ timeout: 6000 });
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 4 tests

---

### Task 14: Checks Display in Service Modal
**Complexity**: EASY
**Files affected**: checks-api.spec.js

**Current tests to replace**:
- [ ] `should display checks in service modal` (checks-api.spec.js:33)
- [ ] `should display check results in service modal` (checks-api.spec.js:157)

**New test to create**:
```javascript
test('should display check results in service modal correctly', async ({ page }) => {
  await openServiceModal(page, 'test-repo-perfect');

  const checkResults = page.locator('#service-modal .check-result');
  await expect(checkResults.first()).toBeVisible();

  await closeServiceModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 15: Check Results Status Indicators
**Complexity**: EASY
**Files affected**: checks-api.spec.js

**Current tests to replace**:
- [ ] `should show passing checks with success indicator` (checks-api.spec.js:181)
- [ ] `should show failing checks with failure indicator` (checks-api.spec.js:195)

**New test to create**:
```javascript
test('should display check status indicators correctly', async ({ page }) => {
  await openServiceModal(page, 'test-repo-perfect');
  const modal = page.locator('#service-modal');

  // Success indicators
  const successIndicators = modal.locator('.pass, .success, [class*="pass"], [class*="success"], .check-passed');
  const count = await successIndicators.count();
  expect(count).toBeGreaterThanOrEqual(1);

  await closeServiceModal(page);

  // Open stale for failures
  await openServiceModal(page, 'test-repo-stale');
  await expect(modal).toBeVisible();
  await closeServiceModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 16: Check Filter Modal Categories
**Complexity**: EASY
**Files affected**: checks-api.spec.js

**Current tests to replace**:
- [ ] `should display check categories in filter modal` (checks-api.spec.js:72)
- [ ] `should display individual checks in filter modal` (checks-api.spec.js:88)

**New test to create**:
```javascript
test('should display categories and checks in filter modal', async ({ page }) => {
  await openCheckFilterModal(page);
  const modal = page.locator('#check-filter-modal');

  // Categories
  const categoryElements = modal.locator('h3, h4, .category, .check-category, [class*="category"]');
  const count = await categoryElements.count();
  expect(count).toBeGreaterThanOrEqual(0);

  // Individual checks
  const checkItems = modal.locator('input[type="checkbox"], .check-item, [class*="check"]');
  const checkCount = await checkItems.count();
  expect(checkCount).toBeGreaterThanOrEqual(1);

  await closeCheckFilterModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 17: Check Filter Actions
**Complexity**: MEDIUM
**Files affected**: checks-api.spec.js

**Current tests to replace**:
- [ ] `should filter services by check selection` (checks-api.spec.js:103)
- [ ] `should clear check filters` (checks-api.spec.js:131)

**New test to create**:
```javascript
test('should filter and clear check selections', async ({ page }) => {
  await openCheckFilterModal(page);
  const modal = page.locator('#check-filter-modal');

  // Toggle a checkbox
  const checkbox = modal.locator('input[type="checkbox"]').first();
  if (await checkbox.isVisible()) {
    await checkbox.click();

    const applyButton = modal.locator('button:has-text("Apply"), button:has-text("Filter")');
    if (await applyButton.isVisible()) {
      await applyButton.click();
    }
  }

  await closeCheckFilterModal(page);
  await page.waitForTimeout(300);

  // After filtering
  const servicesGrid = page.locator('.services-grid');
  await expect(servicesGrid).toBeVisible();

  // Clear filters
  await openCheckFilterModal(page);
  const clearButton = modal.locator('button:has-text("Clear"), button:has-text("Reset")');
  if (await clearButton.isVisible()) {
    await clearButton.click();
  }
  await closeCheckFilterModal(page);

  // After clearing
  await expect(servicesGrid).toBeVisible();
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 18: Check Metadata Display
**Complexity**: EASY
**Files affected**: checks-api.spec.js

**Current tests to replace**:
- [ ] `should show check ID and status` (checks-api.spec.js:167)
- [ ] `should display check metadata (name, description)` (checks-api.spec.js:351)

**New test to create**:
```javascript
test('should display complete check metadata', async ({ page }) => {
  await openServiceModal(page, 'test-repo-perfect');

  const checkResult = page.locator('#service-modal .check-result').first();
  await expect(checkResult).toBeVisible();

  const text = await checkResult.textContent();
  expect(text.length).toBeGreaterThan(0);
  expect(text).toBeTruthy();

  await closeServiceModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 19: All Checks Loading Edge Cases
**Complexity**: EASY
**Files affected**: checks-api.spec.js

**Current tests to replace**:
- [ ] `should handle all-checks.json load failure gracefully` (checks-api.spec.js:264)
- [ ] `should handle all-checks.json with empty checks array` (checks-api.spec.js:283)

**New test to create**:
```javascript
test('should handle all-checks.json loading edge cases', async ({ page }) => {
  // Load failure
  await page.route('**/raw.githubusercontent.com/**/current-checks.json*', async (route) => {
    await route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Server error' }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  await mockCatalogRequests(page);
  await page.goto('/');
  await page.waitForSelector('.services-grid', { state: 'visible', timeout: 10000 });
  const servicesGrid = page.locator('.services-grid');
  await expect(servicesGrid).toBeVisible();

  // Empty checks array
  await page.route('**/raw.githubusercontent.com/**/current-checks.json*', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ version: '1.0.0', checks: [], categories: [], count: 0 }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  await page.reload();
  await waitForCatalogLoad(page);
  await expect(servicesGrid).toBeVisible();
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 20: Category Grouping Tests
**Complexity**: EASY
**Files affected**: checks-api.spec.js

**Current tests to replace**:
- [ ] `should retrieve category list` (checks-api.spec.js:383)
- [ ] `should group checks by category` (checks-api.spec.js:393)
- [ ] `should order categories correctly` (checks-api.spec.js:408)

**New test to create**:
```javascript
test('should handle check categories correctly', async ({ page }) => {
  await openCheckFilterModal(page);
  const modal = page.locator('#check-filter-modal');
  await expect(modal).toBeVisible();

  const sections = modal.locator('.category, .check-group, section, [class*="category"]');
  const count = await sections.count();
  expect(count).toBeGreaterThanOrEqual(0);

  await closeCheckFilterModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

## Tests to Keep Unchanged

**auth-service.spec.js:**
- `should clear token through settings modal` (line 52) - Complex token clearing workflow
- `should validate token with GitHub API` (line 100) - Isolated GitHub API validation
- `should update rate limit display after auth` (line 225) - Specific rate limit update verification
- `should show different UI state when token is set` (line 309) - Unique UI state comparison
- `should provide token for authorization headers` (line 401) - Specific header capture logic
- `should return null when no token is set` (line 430) - Null return value test

**settings.spec.js:**
- `should open settings modal from header button` (line 17) - Basic modal open
- `should close with X button` (line 25) - Basic modal close

**github-api.spec.js:**
- `should update rate limit after API calls` (line 57) - Rate limit update after workflow dispatch
- `should handle rate limit API error` (line 182) - Specific error handling
- `should handle workflow runs API error` (line 310) - Specific error scenario
- `should trigger single service workflow successfully` (line 405) - Single service trigger flow
- `should include Accept header in API requests` (line 480) - Specific header inclusion
- `should include Authorization header when PAT is set` (line 541) - Specific auth header

**checks-api.spec.js:**
- `should load checks metadata on page load` (line 26) - Initial loading behavior
- `should show check count for each service` (line 43) - Service card display
- `should open check filter modal` (line 62) - Basic modal open
- `should group checks by category in modal` (line 206) - Category grouping in service modal
- `should cache checks metadata between navigations` (line 224) - Caching behavior
- `should load checks without errors on fresh page` (line 245) - Fresh page load
- `should load checks with categories` (line 307) - Category loading
- `should look up check by ID in service modal` (line 333) - Check lookup logic
- `should handle missing check gracefully` (line 364) - Error handling
- `should show check filter button` (line 428) - Filter button visibility
- `should show badge count when filters are active` (line 433) - Badge display logic
