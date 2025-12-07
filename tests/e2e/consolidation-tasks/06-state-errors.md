# State & Errors Test Consolidation Tasks

**Feature Area:** State & Errors
**Files:** store-actions.spec.js, loading-error-states.spec.js, staleness-service.spec.js, workflow-triggers.spec.js
**Current Tests:** 49
**Proposed Tests:** 29
**Reduction:** 40.8%

---

## Task 1: Empty States Consolidation

**Strategy:** Setup Deduplication
**Complexity:** EASY
**Current Tests:** 3
**Proposed Tests:** 1

### Tests to Consolidate
- `loading-error-states.spec.js`: "should show empty state when no services"
- `loading-error-states.spec.js`: "should show empty state when filters match nothing"
- `loading-error-states.spec.js`: "should show empty state for team with no services"

### Rationale
All three tests verify empty state rendering in different scenarios but share the same assertion patterns.

### Proposed Structure
```javascript
test('should display appropriate empty states', async ({ page }) => {
  // Empty catalog
  await page.route('**/api/services', route => route.fulfill({ json: [] }));
  await page.goto('/');
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
  await expect(page.locator('[data-testid="empty-state"]')).toContainText('No services found');

  // Reset and load with data
  await page.route('**/api/services', route => route.fulfill({
    json: [{ id: 1, name: 'Service A', team: 'Team A' }]
  }));
  await page.reload();

  // Filter to no results
  await page.fill('[data-testid="search-input"]', 'nonexistent');
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
  await expect(page.locator('[data-testid="empty-state"]')).toContainText('No results');

  // Empty team
  await page.goto('/teams/empty-team');
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
  await expect(page.locator('[data-testid="empty-state"]')).toContainText('No services in this team');
});
```

### Verification Checklist
- [ ] No services empty state preserved
- [ ] Filter empty state preserved
- [ ] Team empty state preserved

---

## Task 2: Loading States Consolidation

**Strategy:** Setup Deduplication
**Complexity:** EASY
**Current Tests:** 4
**Proposed Tests:** 2

### Tests to Consolidate
- `loading-error-states.spec.js`: "should show skeleton loader on initial load"
- `loading-error-states.spec.js`: "should show spinner on filter change"
- `loading-error-states.spec.js`: "should show loading indicator on refresh"
- `loading-error-states.spec.js`: "should show loading in modal tabs"

### Rationale
Loading state tests can be grouped by page-level and component-level loading.

### Proposed Structure
```javascript
test('should show page-level loading states', async ({ page }) => {
  // Delay API response to see loading state
  await page.route('**/api/services', async route => {
    await new Promise(r => setTimeout(r, 500));
    await route.fulfill({ json: [{ id: 1, name: 'Service A' }] });
  });

  // Initial load skeleton
  await page.goto('/');
  await expect(page.locator('[data-testid="skeleton-loader"]')).toBeVisible();
  await expect(page.locator('[data-testid="skeleton-loader"]')).not.toBeVisible({ timeout: 2000 });

  // Filter change spinner
  await page.route('**/api/services?**', async route => {
    await new Promise(r => setTimeout(r, 300));
    await route.continue();
  });
  await page.fill('[data-testid="search-input"]', 'test');
  await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();

  // Refresh indicator
  await page.click('[data-testid="refresh-button"]');
  await expect(page.locator('[data-testid="refresh-indicator"]')).toBeVisible();
});

test('should show component loading states in modal', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="service-card-1"]');

  // Each tab should show loading on switch
  const tabs = ['overview', 'checks', 'actions', 'settings'];
  for (const tab of tabs) {
    await page.route(`**/api/service/**/${tab}`, async route => {
      await new Promise(r => setTimeout(r, 200));
      await route.continue();
    });

    await page.click(`[data-testid="tab-${tab}"]`);
    await expect(page.locator(`[data-testid="${tab}-loading"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${tab}-content"]`)).toBeVisible({ timeout: 1000 });
  }
});
```

### Verification Checklist
- [ ] Skeleton loader on initial load preserved
- [ ] Spinner on filter change preserved
- [ ] Refresh indicator preserved
- [ ] Modal tab loading preserved

---

## Task 3: Rate Limit Error Display

**Strategy:** Setup Deduplication
**Complexity:** EASY
**Current Tests:** 4
**Proposed Tests:** 1

### Tests to Consolidate
- `loading-error-states.spec.js`: "should show rate limit warning"
- `loading-error-states.spec.js`: "should display remaining requests"
- `loading-error-states.spec.js`: "should show reset time for rate limit"
- `loading-error-states.spec.js`: "should disable actions when rate limited"

### Rationale
All rate limit tests verify related UI elements and can test them together.

### Proposed Structure
```javascript
test('should display complete rate limit information', async ({ page }) => {
  // Mock rate-limited response
  await page.route('**/api/**', route => route.fulfill({
    status: 429,
    headers: {
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 3600)
    },
    json: { error: 'Rate limit exceeded' }
  }));

  await page.goto('/');

  // Verify warning banner
  await expect(page.locator('[data-testid="rate-limit-warning"]')).toBeVisible();
  await expect(page.locator('[data-testid="rate-limit-warning"]')).toContainText('Rate limit');

  // Verify remaining requests display
  await expect(page.locator('[data-testid="remaining-requests"]')).toHaveText('0');

  // Verify reset time display
  await expect(page.locator('[data-testid="reset-time"]')).toBeVisible();
  await expect(page.locator('[data-testid="reset-time"]')).toContainText(/\d+:\d+/);

  // Verify actions disabled
  await expect(page.locator('[data-testid="refresh-button"]')).toBeDisabled();
  await expect(page.locator('[data-testid="trigger-button"]')).toBeDisabled();
});
```

### Verification Checklist
- [ ] Rate limit warning preserved
- [ ] Remaining requests display preserved
- [ ] Reset time display preserved
- [ ] Action disabling preserved

---

## Task 4: API Error Handling

**Strategy:** User Journey
**Complexity:** MEDIUM
**Current Tests:** 4
**Proposed Tests:** 2

### Tests to Consolidate
- `loading-error-states.spec.js`: "should show error message on API failure"
- `loading-error-states.spec.js`: "should provide retry option on error"
- `loading-error-states.spec.js`: "should clear error on successful retry"
- `loading-error-states.spec.js`: "should show different errors for different status codes"

### Rationale
Error handling tests form a natural flow: error → retry → success (or different error).

### Proposed Structure
```javascript
test('should handle API errors with retry flow', async ({ page }) => {
  let failCount = 0;
  await page.route('**/api/services', route => {
    if (failCount < 2) {
      failCount++;
      return route.fulfill({ status: 500, json: { error: 'Server error' } });
    }
    return route.fulfill({ json: [{ id: 1, name: 'Service A' }] });
  });

  await page.goto('/');

  // Verify error displayed
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  await expect(page.locator('[data-testid="error-message"]')).toContainText('Server error');

  // Verify retry button
  await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

  // First retry - still fails
  await page.click('[data-testid="retry-button"]');
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();

  // Second retry - succeeds
  await page.click('[data-testid="retry-button"]');
  await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="service-card"]')).toBeVisible();
});

test('should display appropriate error messages for different status codes', async ({ page }) => {
  const statusCodes = [
    { code: 401, message: 'Unauthorized' },
    { code: 403, message: 'Forbidden' },
    { code: 404, message: 'Not found' },
    { code: 500, message: 'Server error' },
    { code: 503, message: 'Service unavailable' }
  ];

  for (const { code, message } of statusCodes) {
    await page.route('**/api/services', route =>
      route.fulfill({ status: code, json: { error: message } }));

    await page.goto('/');
    await expect(page.locator('[data-testid="error-message"]')).toContainText(message);
  }
});
```

### Verification Checklist
- [ ] Error message display preserved
- [ ] Retry option preserved
- [ ] Error clearing on success preserved
- [ ] Status code-specific messages preserved

---

## Task 5: Bulk Trigger Error States

**Strategy:** Setup Deduplication
**Complexity:** EASY
**Current Tests:** 3
**Proposed Tests:** 1

### Tests to Consolidate
- `workflow-triggers.spec.js`: "should show error when bulk trigger fails"
- `workflow-triggers.spec.js`: "should show partial success message"
- `workflow-triggers.spec.js`: "should allow retry of failed triggers"

### Rationale
Bulk trigger error scenarios share the same setup and test related failure modes.

### Proposed Structure
```javascript
test('should handle bulk trigger errors and partial success', async ({ page }) => {
  await page.goto('/');

  // Select multiple services
  await page.click('[data-testid="select-service-1"]');
  await page.click('[data-testid="select-service-2"]');
  await page.click('[data-testid="select-service-3"]');

  // Mock partial failure
  await page.route('**/api/trigger-bulk', route => route.fulfill({
    json: {
      results: [
        { service: 'service-1', status: 'success' },
        { service: 'service-2', status: 'error', error: 'Rate limited' },
        { service: 'service-3', status: 'success' }
      ]
    }
  }));

  await page.click('[data-testid="bulk-trigger-button"]');

  // Verify partial success message
  await expect(page.locator('[data-testid="bulk-result"]')).toContainText('2 succeeded, 1 failed');

  // Verify retry option for failed
  await expect(page.locator('[data-testid="retry-failed-button"]')).toBeVisible();

  // Mock complete failure
  await page.route('**/api/trigger-bulk', route => route.fulfill({
    status: 500,
    json: { error: 'All triggers failed' }
  }));

  await page.click('[data-testid="retry-failed-button"]');
  await expect(page.locator('[data-testid="bulk-error"]')).toBeVisible();
  await expect(page.locator('[data-testid="bulk-error"]')).toContainText('All triggers failed');
});
```

### Verification Checklist
- [ ] Bulk trigger failure preserved
- [ ] Partial success message preserved
- [ ] Retry of failed triggers preserved

---

## Task 6: Store Filter State Actions

**Strategy:** User Journey
**Complexity:** MEDIUM
**Current Tests:** 4
**Proposed Tests:** 2

### Tests to Consolidate
- `store-actions.spec.js`: "should update filter state on search"
- `store-actions.spec.js`: "should update filter state on dropdown change"
- `store-actions.spec.js`: "should clear all filters"
- `store-actions.spec.js`: "should persist filter state in URL"

### Rationale
Filter state tests form a complete user journey of filtering and clearing.

### Proposed Structure
```javascript
test('should manage filter state through user interactions', async ({ page }) => {
  await page.goto('/');

  // Search filter
  await page.fill('[data-testid="search-input"]', 'test-service');
  await expect(page.locator('[data-testid="active-filters"]')).toContainText('test-service');

  // URL updated
  expect(page.url()).toContain('search=test-service');

  // Dropdown filter
  await page.selectOption('[data-testid="team-filter"]', 'engineering');
  await expect(page.locator('[data-testid="active-filters"]')).toContainText('engineering');
  expect(page.url()).toContain('team=engineering');

  // Clear all
  await page.click('[data-testid="clear-filters"]');
  await expect(page.locator('[data-testid="search-input"]')).toHaveValue('');
  await expect(page.locator('[data-testid="team-filter"]')).toHaveValue('all');
  expect(page.url()).not.toContain('search=');
  expect(page.url()).not.toContain('team=');
});

test('should restore filter state from URL', async ({ page }) => {
  await page.goto('/?search=saved-search&team=platform');

  // Verify filters restored
  await expect(page.locator('[data-testid="search-input"]')).toHaveValue('saved-search');
  await expect(page.locator('[data-testid="team-filter"]')).toHaveValue('platform');
  await expect(page.locator('[data-testid="active-filters"]')).toContainText('saved-search');
  await expect(page.locator('[data-testid="active-filters"]')).toContainText('platform');
});
```

### Verification Checklist
- [ ] Search filter state update preserved
- [ ] Dropdown filter state update preserved
- [ ] Clear filters preserved
- [ ] URL persistence preserved

---

## Task 7: Store Selection State

**Strategy:** Setup Deduplication
**Complexity:** EASY
**Current Tests:** 3
**Proposed Tests:** 1

### Tests to Consolidate
- `store-actions.spec.js`: "should track selected services"
- `store-actions.spec.js`: "should update selection count"
- `store-actions.spec.js`: "should allow select all"

### Rationale
Selection state tests share setup and verify related state changes.

### Proposed Structure
```javascript
test('should manage service selection state', async ({ page }) => {
  await page.goto('/');

  // Select individual services
  await page.click('[data-testid="select-service-1"]');
  await expect(page.locator('[data-testid="selection-count"]')).toHaveText('1 selected');

  await page.click('[data-testid="select-service-2"]');
  await expect(page.locator('[data-testid="selection-count"]')).toHaveText('2 selected');

  // Deselect
  await page.click('[data-testid="select-service-1"]');
  await expect(page.locator('[data-testid="selection-count"]')).toHaveText('1 selected');

  // Select all
  await page.click('[data-testid="select-all"]');
  const totalServices = await page.locator('[data-testid^="select-service-"]').count();
  await expect(page.locator('[data-testid="selection-count"]')).toHaveText(`${totalServices} selected`);
});
```

### Verification Checklist
- [ ] Individual selection tracking preserved
- [ ] Selection count update preserved
- [ ] Select all functionality preserved

---

## Task 8: Store Modal State

**Strategy:** Setup Deduplication
**Complexity:** EASY
**Current Tests:** 3
**Proposed Tests:** 1

### Tests to Consolidate
- `store-actions.spec.js`: "should track active modal"
- `store-actions.spec.js`: "should track active tab in modal"
- `store-actions.spec.js`: "should clear modal state on close"

### Rationale
Modal state tests verify related state transitions.

### Proposed Structure
```javascript
test('should manage modal state through lifecycle', async ({ page }) => {
  await page.goto('/');

  // Open modal
  await page.click('[data-testid="service-card-1"]');
  await expect(page.locator('[data-testid="service-modal"]')).toBeVisible();

  // Check store has active modal (via debug or URL)
  expect(page.url()).toContain('modal=service-1');

  // Switch tabs
  await page.click('[data-testid="tab-checks"]');
  expect(page.url()).toContain('tab=checks');

  await page.click('[data-testid="tab-actions"]');
  expect(page.url()).toContain('tab=actions');

  // Close modal
  await page.click('[data-testid="modal-close"]');
  await expect(page.locator('[data-testid="service-modal"]')).not.toBeVisible();
  expect(page.url()).not.toContain('modal=');
  expect(page.url()).not.toContain('tab=');
});
```

### Verification Checklist
- [ ] Active modal tracking preserved
- [ ] Active tab tracking preserved
- [ ] State clearing on close preserved

---

## Task 9: Staleness Detection

**Strategy:** Setup Deduplication
**Complexity:** MEDIUM
**Current Tests:** 4
**Proposed Tests:** 2

### Tests to Consolidate
- `staleness-service.spec.js`: "should mark data as stale after interval"
- `staleness-service.spec.js`: "should refresh stale data automatically"
- `staleness-service.spec.js`: "should show stale indicator"
- `staleness-service.spec.js`: "should reset staleness on manual refresh"

### Rationale
Staleness detection tests share timing-based setup and can be grouped.

### Proposed Structure
```javascript
test('should detect and indicate stale data', async ({ page }) => {
  // Set short staleness interval for testing
  await page.addInitScript(() => {
    window.STALENESS_INTERVAL = 5000; // 5 seconds
  });

  await page.goto('/');

  // Data should be fresh initially
  await expect(page.locator('[data-testid="stale-indicator"]')).not.toBeVisible();

  // Wait for staleness interval
  await page.waitForTimeout(6000);

  // Verify stale indicator appears
  await expect(page.locator('[data-testid="stale-indicator"]')).toBeVisible();
  await expect(page.locator('[data-testid="stale-indicator"]')).toContainText('Data may be outdated');
});

test('should refresh stale data automatically and manually', async ({ page }) => {
  await page.addInitScript(() => {
    window.STALENESS_INTERVAL = 5000;
    window.AUTO_REFRESH_INTERVAL = 10000;
  });

  let refreshCount = 0;
  await page.route('**/api/services', route => {
    refreshCount++;
    route.fulfill({ json: [{ id: 1, name: `Service ${refreshCount}` }] });
  });

  await page.goto('/');
  expect(refreshCount).toBe(1);

  // Wait for auto-refresh
  await page.waitForTimeout(11000);
  expect(refreshCount).toBe(2);
  await expect(page.locator('[data-testid="stale-indicator"]')).not.toBeVisible();

  // Manual refresh resets staleness
  await page.waitForTimeout(6000); // Become stale again
  await expect(page.locator('[data-testid="stale-indicator"]')).toBeVisible();

  await page.click('[data-testid="refresh-button"]');
  await expect(page.locator('[data-testid="stale-indicator"]')).not.toBeVisible();
});
```

### Verification Checklist
- [ ] Staleness detection preserved
- [ ] Auto-refresh preserved
- [ ] Stale indicator preserved
- [ ] Manual refresh reset preserved

---

## Task 10: Workflow Trigger Validation

**Strategy:** Setup Deduplication
**Complexity:** EASY
**Current Tests:** 3
**Proposed Tests:** 2

### Tests to Consolidate
- `workflow-triggers.spec.js`: "should validate workflow inputs"
- `workflow-triggers.spec.js`: "should disable trigger without required inputs"
- `workflow-triggers.spec.js`: "should show input error messages"

### Rationale
Input validation tests share setup and verify related validation behavior.

### Proposed Structure
```javascript
test('should validate workflow trigger inputs', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="service-card-1"]');
  await page.click('[data-testid="tab-actions"]');
  await page.click('[data-testid="trigger-workflow-btn"]');

  // Trigger dialog opens
  await expect(page.locator('[data-testid="trigger-dialog"]')).toBeVisible();

  // Trigger button should be disabled without required inputs
  await expect(page.locator('[data-testid="confirm-trigger"]')).toBeDisabled();

  // Fill invalid input
  await page.fill('[data-testid="branch-input"]', '');
  await page.locator('[data-testid="branch-input"]').blur();
  await expect(page.locator('[data-testid="branch-error"]')).toBeVisible();
  await expect(page.locator('[data-testid="branch-error"]')).toContainText('Branch is required');

  // Fill valid input
  await page.fill('[data-testid="branch-input"]', 'main');
  await expect(page.locator('[data-testid="branch-error"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="confirm-trigger"]')).toBeEnabled();
});
```

### Verification Checklist
- [ ] Input validation preserved
- [ ] Button disabling preserved
- [ ] Error messages preserved

---

## Task 11: Workflow Status Polling

**Strategy:** User Journey
**Complexity:** MEDIUM
**Current Tests:** 3
**Proposed Tests:** 2

### Tests to Consolidate
- `workflow-triggers.spec.js`: "should poll for workflow status"
- `workflow-triggers.spec.js`: "should update status on completion"
- `workflow-triggers.spec.js`: "should stop polling on completion"

### Rationale
Polling tests form a natural flow from trigger to completion.

### Proposed Structure
```javascript
test('should poll workflow status until completion', async ({ page }) => {
  let pollCount = 0;
  await page.route('**/api/workflow/*/status', route => {
    pollCount++;
    const status = pollCount < 3 ? 'running' : 'completed';
    route.fulfill({ json: { status, conclusion: status === 'completed' ? 'success' : null } });
  });

  await page.goto('/');
  await page.click('[data-testid="service-card-1"]');
  await page.click('[data-testid="tab-actions"]');

  // Trigger workflow
  await page.click('[data-testid="trigger-workflow-btn"]');
  await page.fill('[data-testid="branch-input"]', 'main');
  await page.click('[data-testid="confirm-trigger"]');

  // Verify polling occurs
  await expect(page.locator('[data-testid="workflow-status"]')).toHaveText('running');
  await page.waitForTimeout(5000); // Wait for polls

  // Verify completion
  await expect(page.locator('[data-testid="workflow-status"]')).toHaveText('completed');

  // Verify polling stopped (no more API calls)
  const finalPollCount = pollCount;
  await page.waitForTimeout(3000);
  expect(pollCount).toBe(finalPollCount);
});
```

### Verification Checklist
- [ ] Status polling preserved
- [ ] Status update on completion preserved
- [ ] Polling stop on completion preserved

---

## Task 12: Network Error Recovery

**Strategy:** Setup Deduplication
**Complexity:** MEDIUM
**Current Tests:** 3
**Proposed Tests:** 2

### Tests to Consolidate
- `loading-error-states.spec.js`: "should handle network timeout"
- `loading-error-states.spec.js`: "should handle network disconnect"
- `loading-error-states.spec.js`: "should recover on network restore"

### Rationale
Network error tests verify related failure and recovery scenarios.

### Proposed Structure
```javascript
test('should handle network errors gracefully', async ({ page }) => {
  // Simulate network timeout
  await page.route('**/api/services', route => route.abort('timedout'));
  await page.goto('/');

  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  await expect(page.locator('[data-testid="error-message"]')).toContainText('Network error');

  // Simulate network disconnect
  await page.route('**/api/services', route => route.abort('failed'));
  await page.click('[data-testid="retry-button"]');
  await expect(page.locator('[data-testid="error-message"]')).toContainText('Connection failed');
});

test('should recover when network is restored', async ({ page }) => {
  let isOffline = true;
  await page.route('**/api/services', route => {
    if (isOffline) {
      return route.abort('failed');
    }
    return route.fulfill({ json: [{ id: 1, name: 'Service A' }] });
  });

  await page.goto('/');
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();

  // Restore network
  isOffline = false;
  await page.click('[data-testid="retry-button"]');

  await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="service-card"]')).toBeVisible();
});
```

### Verification Checklist
- [ ] Network timeout handling preserved
- [ ] Network disconnect handling preserved
- [ ] Recovery on restore preserved

---

## Task 13: Store Async Action States

**Strategy:** Setup Deduplication
**Complexity:** MEDIUM
**Current Tests:** 4
**Proposed Tests:** 2

### Tests to Consolidate
- `store-actions.spec.js`: "should set loading state on async action"
- `store-actions.spec.js`: "should set success state on completion"
- `store-actions.spec.js`: "should set error state on failure"
- `store-actions.spec.js`: "should reset state for new action"

### Rationale
Async action state tests verify the same state machine transitions.

### Proposed Structure
```javascript
test('should manage async action success state', async ({ page }) => {
  await page.route('**/api/action', async route => {
    await new Promise(r => setTimeout(r, 300));
    route.fulfill({ json: { success: true } });
  });

  await page.goto('/');

  // Trigger action
  await page.click('[data-testid="action-button"]');

  // Verify loading state
  await expect(page.locator('[data-testid="action-loading"]')).toBeVisible();

  // Verify success state
  await expect(page.locator('[data-testid="action-success"]')).toBeVisible();

  // New action resets state
  await page.click('[data-testid="action-button"]');
  await expect(page.locator('[data-testid="action-success"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="action-loading"]')).toBeVisible();
});

test('should manage async action error state', async ({ page }) => {
  await page.route('**/api/action', route =>
    route.fulfill({ status: 500, json: { error: 'Action failed' } }));

  await page.goto('/');
  await page.click('[data-testid="action-button"]');

  // Verify error state
  await expect(page.locator('[data-testid="action-error"]')).toBeVisible();
  await expect(page.locator('[data-testid="action-error"]')).toContainText('Action failed');
});
```

### Verification Checklist
- [ ] Loading state on action preserved
- [ ] Success state on completion preserved
- [ ] Error state on failure preserved
- [ ] State reset for new action preserved

---

## Task 14: Concurrent Action Handling

**Strategy:** Setup Deduplication
**Complexity:** MEDIUM
**Current Tests:** 2
**Proposed Tests:** 1

### Tests to Consolidate
- `store-actions.spec.js`: "should cancel pending action on new action"
- `store-actions.spec.js`: "should only apply latest action result"

### Rationale
Both tests verify race condition handling with overlapping actions.

### Proposed Structure
```javascript
test('should handle concurrent actions correctly', async ({ page }) => {
  let requestId = 0;
  await page.route('**/api/search', async route => {
    const id = ++requestId;
    await new Promise(r => setTimeout(r, id === 1 ? 500 : 100));
    route.fulfill({ json: { results: [`Result from request ${id}`] } });
  });

  await page.goto('/');

  // Trigger first action (slow)
  await page.fill('[data-testid="search-input"]', 'first');

  // Immediately trigger second action (fast)
  await page.fill('[data-testid="search-input"]', 'second');

  // Wait for both to complete
  await page.waitForTimeout(600);

  // Should only show second (latest) result
  await expect(page.locator('[data-testid="search-results"]')).toContainText('Result from request 2');
  await expect(page.locator('[data-testid="search-results"]')).not.toContainText('Result from request 1');
});
```

### Verification Checklist
- [ ] Pending action cancellation preserved
- [ ] Latest result application preserved

---

## Task 15: Workflow History State

**Strategy:** Setup Deduplication
**Complexity:** EASY
**Current Tests:** 2
**Proposed Tests:** 1

### Tests to Consolidate
- `workflow-triggers.spec.js`: "should store recent triggers in history"
- `workflow-triggers.spec.js`: "should allow re-triggering from history"

### Rationale
History-related tests share setup and verify related functionality.

### Proposed Structure
```javascript
test('should manage workflow trigger history', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="service-card-1"]');
  await page.click('[data-testid="tab-actions"]');

  // Trigger workflow
  await page.click('[data-testid="trigger-workflow-btn"]');
  await page.fill('[data-testid="branch-input"]', 'feature-branch');
  await page.click('[data-testid="confirm-trigger"]');

  // Verify history updated
  await expect(page.locator('[data-testid="trigger-history"]')).toContainText('feature-branch');

  // Re-trigger from history
  await page.click('[data-testid="history-item-1"]');
  await expect(page.locator('[data-testid="branch-input"]')).toHaveValue('feature-branch');

  // Confirm re-trigger
  await page.click('[data-testid="confirm-trigger"]');
  await expect(page.locator('[data-testid="trigger-status"]')).toContainText('Triggering');
});
```

### Verification Checklist
- [ ] History storage preserved
- [ ] Re-trigger from history preserved

---

## Task 16: Error Boundary Tests

**Strategy:** Setup Deduplication
**Complexity:** MEDIUM
**Current Tests:** 2
**Proposed Tests:** 1

### Tests to Consolidate
- `loading-error-states.spec.js`: "should catch component errors with boundary"
- `loading-error-states.spec.js`: "should provide recovery option from error boundary"

### Rationale
Error boundary tests can verify catch and recovery in one flow.

### Proposed Structure
```javascript
test('should catch and recover from component errors', async ({ page }) => {
  // Inject error-causing data
  await page.route('**/api/services', route => route.fulfill({
    json: [{ id: 1, name: null }] // null name causes render error
  }));

  await page.goto('/');

  // Verify error boundary catches error
  await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
  await expect(page.locator('[data-testid="error-boundary"]')).toContainText('Something went wrong');

  // Fix the data
  await page.route('**/api/services', route => route.fulfill({
    json: [{ id: 1, name: 'Valid Service' }]
  }));

  // Recover
  await page.click('[data-testid="error-boundary-retry"]');
  await expect(page.locator('[data-testid="error-boundary"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="service-card"]')).toBeVisible();
});
```

### Verification Checklist
- [ ] Error boundary catching preserved
- [ ] Recovery option preserved

---

## Summary

| Source File | Original Tests | After Consolidation |
|-------------|----------------|---------------------|
| store-actions.spec.js | 14 | 8 |
| loading-error-states.spec.js | 18 | 10 |
| staleness-service.spec.js | 6 | 3 |
| workflow-triggers.spec.js | 11 | 8 |
| **Total** | **49** | **29** |

### Implementation Priority

1. **High Priority (EASY):**
   - Task 1: Empty States (3 → 1)
   - Task 3: Rate Limit Display (4 → 1)
   - Task 5: Bulk Trigger Errors (3 → 1)
   - Task 7: Store Selection State (3 → 1)
   - Task 8: Store Modal State (3 → 1)
   - Task 10: Workflow Validation (3 → 2)
   - Task 15: Workflow History (2 → 1)

2. **Medium Priority:**
   - Task 2: Loading States (4 → 2)
   - Task 4: API Error Handling (4 → 2)
   - Task 6: Filter State Actions (4 → 2)
   - Task 9: Staleness Detection (4 → 2)
   - Task 11: Status Polling (3 → 2)
   - Task 12: Network Recovery (3 → 2)
   - Task 13: Async Action States (4 → 2)
   - Task 14: Concurrent Actions (2 → 1)
   - Task 16: Error Boundary (2 → 1)
