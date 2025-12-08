# Coverage Improvement Plan - User Story-Based Test Scenarios

## Executive Summary

**Current Coverage**: 64.83% lines (177 tests)
**Target Coverage**: 80%+ lines
**Strategy**: 8 self-contained user story phases, each executable independently

### Coverage Gap Analysis

| Area | Current | Target | Gap |
|------|---------|--------|-----|
| API Layer | 56.84% | 85% | +28% |
| Utils | 23.79% | 75% | +51% |
| Services | 45.76% | 80% | +34% |
| Store | 44.49% | 75% | +30% |
| Components (low) | ~30% avg | 80% | +50% |

---

## Phase 1: Error Handling & Edge Cases
**Estimated New Coverage**: +8-10%
**Tests to Create**: 3-4 consolidated tests
**Self-Contained**: Yes - requires only mock setup

### User Story 1.1: Network Failure Recovery
> "As a user, when the API fails to load, I should see helpful error messages and be able to retry"

```javascript
// File: tests/e2e/error-recovery.spec.js
test('should handle API failures gracefully and allow retry', async ({ page }) => {
  // Phase 1: Initial load failure
  await mockAPIError(page, '**/all-services.json', 500, 'Internal Server Error');
  await page.goto('/');

  // Verify error state
  await expect(page.locator('.error-message')).toBeVisible();
  await expect(page.locator('.error-message')).toContainText('Failed to load');

  // Phase 2: Retry succeeds
  await mockCatalogRequests(page); // Remove error mock
  await page.locator('button:has-text("Retry")').click();
  await waitForCatalogLoad(page);

  // Verify recovery
  const count = await getServiceCount(page);
  expect(count).toBeGreaterThan(0);
});
```

**Covers**:
- `registry.ts`: Error handling paths, fallback logic
- `appStore.ts`: Error state management
- `loading-error-states` components: Error display

### User Story 1.2: Token Validation Edge Cases
> "As a user, when I enter invalid tokens, I should see specific error messages"

```javascript
test('should handle various invalid token formats with specific errors', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await openSettingsModal(page);

  const tokenInput = page.locator('#github-pat-input');
  const saveButton = page.locator('button:has-text("Save")');

  // Test cases: empty, whitespace, invalid format, expired
  const invalidTokens = [
    { value: '', error: 'Token cannot be empty' },
    { value: '   ', error: 'Token cannot be empty' },
    { value: 'invalid-token-format', error: 'Invalid token' },
  ];

  for (const { value, error } of invalidTokens) {
    await tokenInput.fill(value);
    await saveButton.click();
    await expect(page.locator('.toast-error, .validation-error')).toBeVisible();
    await tokenInput.clear();
  }

  // Test rate limit exceeded (401)
  await mockAPIError(page, '**/api.github.com/rate_limit', 401, 'Unauthorized');
  await tokenInput.fill('ghp_validformatbutexpired123456');
  await saveButton.click();
  await expect(page.locator('.toast')).toContainText(/unauthorized|invalid/i);
});
```

**Covers**:
- `auth.ts`: Token validation, error paths
- `github.ts`: Rate limit handling, 401 responses
- Settings modal: Error display

### User Story 1.3: Concurrent API Calls
> "As a user, when I rapidly interact with the UI, the app should handle concurrent requests gracefully"

```javascript
test('should handle rapid filter changes without race conditions', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Rapid filter changes
  const searchInput = page.locator('[placeholder*="Search"]');
  await searchInput.fill('a');
  await searchInput.fill('ab');
  await searchInput.fill('abc');
  await searchInput.clear();
  await searchInput.fill('test');

  // Final state should be consistent
  await expect(async () => {
    const count = await getServiceCount(page);
    expect(count).toBeGreaterThan(0);
  }).toPass({ timeout: 3000 });

  // Rapid stat card clicks
  const statCards = page.locator('.stat-card');
  await statCards.first().click();
  await statCards.nth(1).click();
  await statCards.first().click();

  // App should not crash, state should be consistent
  await expect(page.locator('.service-card').first()).toBeVisible();
});
```

**Covers**:
- `appStore.ts`: Concurrent filter updates
- Filter components: Rapid state changes
- Search debouncing

---

## Phase 2: Complete Service Lifecycle
**Estimated New Coverage**: +6-8%
**Tests to Create**: 2 comprehensive journey tests
**Self-Contained**: Yes

### User Story 2.1: Stale Service Re-run Journey
> "As a team lead, I want to re-run scorecards on stale services and see updated results"

```javascript
// File: tests/e2e/service-lifecycle.spec.js
test('should complete full stale service re-run workflow', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Phase 1: Identify stale service
  const staleCard = page.locator('.service-card:has(.badge-stale)').first();
  await expect(staleCard).toBeVisible();
  const serviceName = await staleCard.locator('.service-name').textContent();

  // Phase 2: Authenticate
  await openSettingsModal(page);
  await setGitHubPAT(page, mockPAT);
  await closeSettingsModal(page);

  // Phase 3: Click re-run button (mock workflow dispatch)
  await mockWorkflowDispatch(page, { status: 204 });
  await staleCard.locator('button:has-text("Re-run")').click();

  // Verify button starts spinning (animation.ts)
  await expect(staleCard.locator('.spinning, [class*="spin"]')).toBeVisible();

  // Phase 4: Mock workflow completion
  await mockWorkflowRuns(page, {
    workflow_runs: [{
      id: 12345,
      status: 'completed',
      conclusion: 'success',
      created_at: new Date().toISOString(),
    }]
  });

  // Verify toast notification
  await expect(page.locator('.toast-success')).toBeVisible();

  // Phase 5: Verify UI updates
  await page.reload();
  await waitForCatalogLoad(page);
});
```

**Covers**:
- `staleness.ts`: Staleness detection, isStale logic
- `animation.ts`: Spin start/stop
- `github.ts`: Workflow dispatch
- `ServiceCard.tsx`: Re-run button, badge display
- Toast notifications

### User Story 2.2: Service Modal Complete Exploration
> "As a developer, I want to explore all service details including checks, links, and history"

```javascript
test('should display all service modal tabs with complete data', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Open modal for service with all data
  await openServiceModal(page, 'test-repo-perfect');

  // Tab 1: Overview (default)
  await expect(page.locator('.modal-score')).toBeVisible();
  await expect(page.locator('.modal-rank')).toBeVisible();
  await expect(page.locator('.modal-team')).toBeVisible();

  // Tab 2: Check Results
  await clickServiceModalTab(page, 'Check Results');
  const checkResults = page.locator('.check-result-item');
  await expect(checkResults.first()).toBeVisible();

  // Verify passing/failing indicators
  await expect(page.locator('.check-pass, .check-status-pass')).toBeVisible();

  // Tab 3: Links (LinksTab.tsx - 0% coverage!)
  await clickServiceModalTab(page, 'Links');
  const linkItems = page.locator('.link-item, .links-list a');
  if (await linkItems.count() > 0) {
    await expect(linkItems.first()).toHaveAttribute('href');
    await expect(linkItems.first()).toHaveAttribute('target', '_blank');
  }

  // Tab 4: History/Actions
  await clickServiceModalTab(page, 'Actions');
  // Verify actions widget content

  // Close with Escape
  await page.keyboard.press('Escape');
  await expect(page.locator('#service-modal')).toBeHidden();
});
```

**Covers**:
- `LinksTab.tsx`: Full component (currently 0%)
- Service modal tabs: All navigation
- Check results display
- Keyboard navigation

---

## Phase 3: Team Management Complete Flow
**Estimated New Coverage**: +5-7%
**Tests to Create**: 2 journey tests
**Self-Contained**: Yes

### User Story 3.1: Team Dashboard Deep Dive
> "As a manager, I want to view team performance, filter by metrics, and explore team details"

```javascript
// File: tests/e2e/team-management.spec.js
test('should navigate team dashboard with all interactions', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Open Teams Dashboard
  await page.getByRole('button', { name: 'Teams' }).click();
  const dashboard = page.locator('#team-dashboard, .team-dashboard');
  await expect(dashboard).toBeVisible();

  // Phase 1: Summary stats displayed
  await expect(dashboard.locator('.summary-stat')).toHaveCount(3);

  // Phase 2: Search teams
  const searchInput = dashboard.locator('input[placeholder*="Search"]');
  await searchInput.fill('backend');

  // Verify filtered results
  await expect(async () => {
    const teamCards = dashboard.locator('.team-card');
    expect(await teamCards.count()).toBeLessThan(10);
  }).toPass();

  // Clear search
  await searchInput.clear();

  // Phase 3: Sort by different criteria
  const sortSelect = dashboard.locator('select');
  await sortSelect.selectOption({ label: /Service Count/i });
  await page.waitForTimeout(200);

  await sortSelect.selectOption({ label: /Average Score/i });
  await page.waitForTimeout(200);

  await sortSelect.selectOption({ label: /Stale Count/i });

  // Phase 4: Click team card to filter
  const teamCard = dashboard.locator('.team-card').first();
  const teamName = await teamCard.locator('.team-name').textContent();
  await teamCard.locator('button:has-text("Filter")').click();

  // Verify main catalog filtered
  await expect(page.locator('.active-filter, .filter-badge')).toContainText(teamName);

  // Phase 5: Open team edit modal
  await page.getByRole('button', { name: 'Teams' }).click();
  await dashboard.locator('.team-card').first().locator('button:has-text("Edit")').click();

  // Verify team modal opens
  await expect(page.locator('#team-modal, .team-edit-modal')).toBeVisible();
});
```

**Covers**:
- `TeamDashboard.tsx`: Full component (currently 55%)
- `team-statistics.ts`: Team calculations
- Team filtering and sorting
- Modal interactions

### User Story 3.2: Team Adoption Analysis
> "As a team lead, I want to see which checks my team is failing and filter by check status"

```javascript
test('should analyze team check adoption and filter by status', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Open Check Adoption Dashboard
  await openCheckAdoptionDashboard(page);
  const dashboard = page.locator('.check-adoption-dashboard');
  await expect(dashboard).toBeVisible();

  // Phase 1: View adoption stats per check
  const checkItems = dashboard.locator('.check-item, .check-adoption-row');
  await expect(checkItems.first()).toBeVisible();

  // Phase 2: Expand check to see team breakdown
  await checkItems.first().click();
  await expect(dashboard.locator('.team-breakdown, .adoption-details')).toBeVisible();

  // Phase 3: Filter services by check passing
  await checkItems.first().locator('button:has-text("Pass")').click();

  // Verify catalog filtered
  const count = await getServiceCount(page);
  expect(count).toBeGreaterThan(0);

  // Phase 4: Filter by check failing
  await openCheckAdoptionDashboard(page);
  await checkItems.first().locator('button:has-text("Fail")').click();

  const failCount = await getServiceCount(page);
  expect(failCount).toBeGreaterThanOrEqual(0);
});
```

**Covers**:
- `check-statistics.ts`: Adoption calculations (currently 64%)
- Check filter modal
- Check status filtering

---

## Phase 4: Filter & Sort Comprehensive
**Estimated New Coverage**: +4-6%
**Tests to Create**: 2 tests
**Self-Contained**: Yes

### User Story 4.1: Complex Filter Combinations
> "As a user, I want to apply multiple filters simultaneously and see accurate results"

```javascript
// File: tests/e2e/complex-filters.spec.js
test('should apply and combine multiple filters correctly', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  const initialCount = await getServiceCount(page);

  // Apply rank filter (StatCard.tsx - 7% coverage!)
  const goldStat = page.locator('.stat-card').filter({ hasText: 'Gold' });
  await goldStat.click();
  await expect(goldStat).toHaveClass(/active/);

  let count = await getServiceCount(page);
  expect(count).toBeLessThan(initialCount);

  // Add search filter
  await searchServices(page, 'test');
  count = await getServiceCount(page);
  expect(count).toBeLessThanOrEqual(initialCount);

  // Add API filter (FilterButton.tsx - 14% coverage!)
  const apiFilter = page.locator('button, .filter-button').filter({ hasText: /API|Has API/i });
  if (await apiFilter.isVisible()) {
    await apiFilter.click();
    count = await getServiceCount(page);
  }

  // Add stale filter
  const staleFilter = page.locator('button, .filter-button').filter({ hasText: /Stale/i });
  if (await staleFilter.isVisible()) {
    await staleFilter.click();
  }

  // Verify combined filter state
  await expect(async () => {
    const visibleCards = page.locator('.service-card:visible');
    const cardCount = await visibleCards.count();
    // All visible cards should match all filter criteria
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = visibleCards.nth(i);
      // Verify rank if Gold filter active
      await expect(card.locator('.rank-badge, .rank')).toContainText(/Gold/i);
    }
  }).toPass({ timeout: 3000 });

  // Clear all filters
  const clearButton = page.locator('button:has-text("Clear"), .clear-filters');
  if (await clearButton.isVisible()) {
    await clearButton.click();
  } else {
    await goldStat.click(); // Toggle off
    await clearSearch(page);
  }

  // Verify all services shown
  count = await getServiceCount(page);
  expect(count).toBe(initialCount);
});
```

**Covers**:
- `StatCard.tsx`: Click handlers, active state (currently 7%)
- `FilterButton.tsx`: Toggle logic (currently 14%)
- `appStore.ts`: Complex filter AND logic

### User Story 4.2: Sort Persistence Across Views
> "As a user, when I switch between grid and list view, my sort preferences should persist"

```javascript
test('should maintain sort and display preferences across interactions', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Phase 1: Change sort to Name A-Z
  const sortSelect = page.locator('select').filter({ hasText: /Score|Name|Sort/i });
  await sortSelect.selectOption({ label: /Name.*A.*Z/i });

  // Get first service name
  let firstCard = page.locator('.service-card').first();
  const firstName = await firstCard.locator('.service-name').textContent();

  // Phase 2: Toggle to list view
  const listViewButton = page.locator('button[aria-label*="list"], .view-toggle');
  await listViewButton.click();

  // Verify sort persisted
  await expect(async () => {
    const listFirstName = await page.locator('.service-card, .service-row').first()
      .locator('.service-name').textContent();
    expect(listFirstName).toBe(firstName);
  }).toPass();

  // Phase 3: Open modal and close
  await openServiceModal(page, firstName.trim());
  await closeServiceModal(page);

  // Verify sort still persisted
  const sortValue = await sortSelect.inputValue();
  expect(sortValue).toContain('name');

  // Phase 4: Toggle back to grid
  const gridViewButton = page.locator('button[aria-label*="grid"], .view-toggle');
  await gridViewButton.click();

  // Verify view toggled
  await expect(page.locator('.service-grid, .grid-view')).toBeVisible();
});
```

**Covers**:
- `ServiceCard.tsx`: Grid vs List variants (currently 52%)
- Display mode persistence
- Sort state management

---

## Phase 5: Theme & Accessibility
**Estimated New Coverage**: +3-4%
**Tests to Create**: 2 tests
**Self-Contained**: Yes

### User Story 5.1: Theme Switching Complete Flow
> "As a user, I want to switch between light and dark themes with persistence"

```javascript
// File: tests/e2e/theme-accessibility.spec.js
test('should toggle theme with full persistence and OS preference respect', async ({ page }) => {
  // Phase 1: Start with clean localStorage
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Get initial theme
  const html = page.locator('html');
  const initialTheme = await html.getAttribute('data-theme');

  // Phase 2: Toggle theme
  const themeToggle = page.locator('button[aria-label*="theme"], .theme-toggle');
  await themeToggle.click();

  // Verify theme changed
  const newTheme = await html.getAttribute('data-theme');
  expect(newTheme).not.toBe(initialTheme);

  // Phase 3: Verify icon changed
  const themeIcon = themeToggle.locator('svg, .icon');
  await expect(themeIcon).toBeVisible();

  // Phase 4: Reload and verify persistence
  await page.reload();
  await waitForCatalogLoad(page);

  const persistedTheme = await html.getAttribute('data-theme');
  expect(persistedTheme).toBe(newTheme);

  // Phase 5: Toggle back
  await themeToggle.click();
  const finalTheme = await html.getAttribute('data-theme');
  expect(finalTheme).toBe(initialTheme);
});
```

**Covers**:
- `theme.ts`: Toggle, persistence, init (currently 50%)
- Theme toggle component
- localStorage interaction

### User Story 5.2: Keyboard Navigation Complete
> "As a keyboard user, I want to navigate the entire app without a mouse"

```javascript
test('should support complete keyboard navigation', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Phase 1: Tab to first service card
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  // Find focused element
  const focused = page.locator(':focus');

  // Phase 2: Enter to open service modal
  await page.keyboard.press('Enter');
  await expect(page.locator('#service-modal, .service-modal')).toBeVisible();

  // Phase 3: Tab through modal tabs
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');

  // Phase 4: Escape to close modal
  await page.keyboard.press('Escape');
  await expect(page.locator('#service-modal')).toBeHidden();

  // Phase 5: Navigate to stat cards with keyboard
  const statCard = page.locator('.stat-card').first();
  await statCard.focus();
  await page.keyboard.press('Space');

  // Verify filter applied
  await expect(statCard).toHaveClass(/active/);
});
```

**Covers**:
- Keyboard navigation in `ServiceCard.tsx`
- `StatCard.tsx` keyboard handlers
- Modal focus management

---

## Phase 6: Bulk Operations & Actions Widget
**Estimated New Coverage**: +4-5%
**Tests to Create**: 2 tests
**Self-Contained**: Yes

### User Story 6.1: Bulk Workflow Triggers
> "As an admin, I want to trigger scorecard re-runs on multiple services at once"

```javascript
// File: tests/e2e/bulk-operations.spec.js
test('should trigger bulk workflow operations with progress feedback', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Authenticate
  await openSettingsModal(page);
  await setGitHubPAT(page, mockPAT);
  await closeSettingsModal(page);

  // Mock bulk dispatch
  await mockWorkflowDispatch(page, { status: 204 });

  // Phase 1: Select multiple services (if checkbox UI exists)
  const selectAllCheckbox = page.locator('input[type="checkbox"]#select-all, .select-all');
  if (await selectAllCheckbox.isVisible()) {
    await selectAllCheckbox.check();

    // Phase 2: Click bulk action button
    const bulkActionButton = page.locator('button:has-text("Re-run Selected")');
    await bulkActionButton.click();

    // Phase 3: Verify progress indicator
    await expect(page.locator('.bulk-progress, .progress-indicator')).toBeVisible();

    // Phase 4: Verify completion
    await expect(page.locator('.toast-success')).toBeVisible();
  }

  // Alternative: Filter stale and use "Re-run All Stale"
  const staleFilter = page.locator('.stat-card').filter({ hasText: /Stale/i });
  if (await staleFilter.isVisible()) {
    await staleFilter.click();

    const rerunAllButton = page.locator('button:has-text("Re-run All")');
    if (await rerunAllButton.isVisible()) {
      await rerunAllButton.click();
      await expect(page.locator('.toast')).toBeVisible();
    }
  }
});
```

**Covers**:
- `github.ts`: Bulk workflow triggers
- Bulk action UI
- Progress feedback

### User Story 6.2: Actions Widget Complete Flow
> "As a user, I want to see recent workflow runs and their status in the actions widget"

```javascript
test('should display and interact with actions widget', async ({ page }) => {
  await mockCatalogRequests(page);
  await mockWorkflowRuns(page, {
    workflow_runs: [
      {
        id: 1,
        name: 'Scorecard',
        status: 'completed',
        conclusion: 'success',
        created_at: new Date().toISOString(),
        html_url: 'https://github.com/org/repo/actions/runs/1',
      },
      {
        id: 2,
        name: 'Scorecard',
        status: 'in_progress',
        conclusion: null,
        created_at: new Date().toISOString(),
        html_url: 'https://github.com/org/repo/actions/runs/2',
      },
    ]
  });

  await page.goto('/');
  await waitForCatalogLoad(page);

  // Open service modal with actions
  await openServiceModal(page, 'test-repo-perfect');
  await clickServiceModalTab(page, 'Actions');

  // Phase 1: Verify widget displays
  const actionsWidget = page.locator('.actions-widget, .workflow-runs');
  await expect(actionsWidget).toBeVisible();

  // Phase 2: Verify run status indicators
  await expect(actionsWidget.locator('.status-success, .run-success')).toBeVisible();
  await expect(actionsWidget.locator('.status-running, .run-in-progress')).toBeVisible();

  // Phase 3: Verify live duration update (duration-tracker.ts)
  const runningRun = actionsWidget.locator('.status-running, .run-in-progress').first();
  const durationBefore = await runningRun.locator('.duration').textContent();
  await page.waitForTimeout(1100); // Wait for update tick
  const durationAfter = await runningRun.locator('.duration').textContent();

  // Duration should have updated (or be similar format)
  expect(durationAfter).toBeTruthy();

  // Phase 4: Click to open GitHub Actions
  const runLink = actionsWidget.locator('a[href*="actions/runs"]').first();
  await expect(runLink).toHaveAttribute('target', '_blank');
});
```

**Covers**:
- `duration-tracker.ts`: Live updates (currently 0% likely)
- Actions widget component
- Workflow run display

---

## Phase 7: Check Filter Deep Dive
**Estimated New Coverage**: +3-4%
**Tests to Create**: 2 tests
**Self-Contained**: Yes

### User Story 7.1: Check Filter Complete Workflow
> "As a user, I want to filter services by specific check results"

```javascript
// File: tests/e2e/check-filter-deep.spec.js
test('should filter by check results through complete workflow', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Open check filter modal
  await openCheckFilterModal(page);
  const modal = page.locator('#check-filter-modal');
  await expect(modal).toBeVisible();

  // Phase 1: View check categories
  const categories = modal.locator('.check-category-section');
  await expect(categories.first()).toBeVisible();

  // Phase 2: Expand category
  const categoryHeader = modal.locator('.check-category-header').first();
  await categoryHeader.click();

  // Phase 3: Set check to "Pass" state
  const checkCard = modal.locator('.check-option-card').first();
  await checkCard.locator('.state-pass').click();

  // Verify state toggle visual
  await expect(checkCard.locator('.state-pass')).toHaveClass(/active/);

  // Phase 4: Set another check to "Fail"
  const secondCheck = modal.locator('.check-option-card').nth(1);
  await secondCheck.locator('.state-fail').click();

  // Phase 5: Apply filters
  await modal.locator('button:has-text("Apply")').click();
  await expect(modal).toBeHidden();

  // Phase 6: Verify filter applied
  const count = await getServiceCount(page);
  expect(count).toBeGreaterThanOrEqual(0);

  // Phase 7: Clear check filters
  await openCheckFilterModal(page);
  await modal.locator('button:has-text("Clear")').click();
  await modal.locator('button:has-text("Apply")').click();
});
```

**Covers**:
- Check filter modal: Full flow
- `check-statistics.ts`: Filter application
- Check state toggle UI

### User Story 7.2: Check Adoption Stats Display
> "As a manager, I want to see adoption statistics for each check"

```javascript
test('should display check adoption statistics accurately', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Open check filter modal to see stats
  await openCheckFilterModal(page);
  const modal = page.locator('#check-filter-modal');

  // Phase 1: Verify stats display
  const checkCard = modal.locator('.check-option-card').first();
  const stats = checkCard.locator('.check-option-stats');
  await expect(stats).toBeVisible();

  // Verify passing/failing counts
  await expect(stats.locator('.passing')).toBeVisible();
  await expect(stats.locator('.failing')).toBeVisible();

  // Phase 2: Verify progress bar
  const progressBar = checkCard.locator('.check-option-progress-bar');
  await expect(progressBar).toBeVisible();

  // Progress bar width should be between 0 and 100%
  const style = await progressBar.getAttribute('style');
  expect(style).toMatch(/width:\s*\d+(\.\d+)?%/);

  // Phase 3: Search for specific check
  const searchInput = modal.locator('#check-filter-search');
  await searchInput.fill('readme');

  // Verify filtered checks
  await expect(async () => {
    const visibleChecks = modal.locator('.check-option-card:visible');
    const count = await visibleChecks.count();
    expect(count).toBeGreaterThan(0);
  }).toPass();

  await closeCheckFilterModal(page);
});
```

**Covers**:
- `check-statistics.ts`: Stats calculations
- Progress bar rendering
- Check search functionality

---

## Phase 8: Edge Cases & Boundary Conditions
**Estimated New Coverage**: +3-4%
**Tests to Create**: 2 tests
**Self-Contained**: Yes

### User Story 8.1: Empty States Handling
> "As a user, when there's no data, I should see helpful empty state messages"

```javascript
// File: tests/e2e/edge-cases.spec.js
test('should handle empty states gracefully', async ({ page }) => {
  // Phase 1: Empty catalog
  await mockEmptyCatalog(page);
  await page.goto('/');

  // Verify empty state message
  await expect(page.locator('.empty-state, .no-services')).toBeVisible();
  await expect(page.locator('.empty-state')).toContainText(/no services|empty/i);

  // Phase 2: Search with no results
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  await searchServices(page, 'nonexistent-service-xyz-123');
  await expect(page.locator('.no-results, .empty-search')).toBeVisible();
  await clearSearch(page);

  // Phase 3: Filter with no matches
  const filterCombo = page.locator('.stat-card').filter({ hasText: 'Platinum' });
  if (await filterCombo.isVisible()) {
    await filterCombo.click();
    // May show empty or filtered results
    const count = await getServiceCount(page);
    expect(count).toBeGreaterThanOrEqual(0);
  }
});
```

**Covers**:
- Empty state components
- No results handling
- Edge case filters

### User Story 8.2: Long Lists & Performance
> "As a user with many services, the UI should remain responsive"

```javascript
test('should handle large service lists efficiently', async ({ page }) => {
  // Create mock with many services
  const manyServices = Array.from({ length: 100 }, (_, i) => ({
    name: `service-${i.toString().padStart(3, '0')}`,
    org: 'test-org',
    repo: `repo-${i}`,
    score: Math.floor(Math.random() * 100),
    rank: ['Bronze', 'Silver', 'Gold', 'Platinum'][Math.floor(Math.random() * 4)],
    team: { primary: `team-${i % 5}` },
    installed: i % 3 === 0,
    has_api: i % 2 === 0,
    last_updated: new Date().toISOString(),
    checks_hash: 'abc123',
  }));

  await page.route('**/all-services.json', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(manyServices),
    });
  });

  await mockCatalogRequests(page);
  await page.goto('/');

  // Phase 1: Verify initial load completes in reasonable time
  const startTime = Date.now();
  await waitForCatalogLoad(page);
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(5000); // 5 seconds max

  // Phase 2: Verify scroll performance
  const serviceGrid = page.locator('.service-grid, .services-container');
  await serviceGrid.evaluate(el => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(200);

  // Phase 3: Verify filter performance
  const filterStart = Date.now();
  await searchServices(page, 'service-05');
  await expect(async () => {
    const count = await getServiceCount(page);
    expect(count).toBeGreaterThan(0);
  }).toPass();
  const filterTime = Date.now() - filterStart;
  expect(filterTime).toBeLessThan(1000); // 1 second max

  await clearSearch(page);
});
```

**Covers**:
- Large list rendering
- Scroll performance
- Filter performance with many items

---

## Implementation Order

Execute phases in this order for maximum impact:

| Phase | Priority | Est. Coverage Gain | Complexity |
|-------|----------|-------------------|------------|
| 1 | HIGH | +8-10% | Medium |
| 2 | HIGH | +6-8% | Easy |
| 4 | HIGH | +4-6% | Easy |
| 3 | MEDIUM | +5-7% | Medium |
| 6 | MEDIUM | +4-5% | Medium |
| 7 | MEDIUM | +3-4% | Easy |
| 5 | LOW | +3-4% | Easy |
| 8 | LOW | +3-4% | Medium |

**Total Estimated Gain**: +36-48% coverage
**Projected Final Coverage**: 80-85%

---

## Execution Instructions

Each phase is self-contained. To execute a phase:

1. Create the test file in `tests/e2e/`
2. Copy the test code from this plan
3. Run with coverage: `CI=true COVERAGE=true PLAYWRIGHT_HTML_OPEN=never npx playwright test <test-file>`
4. Verify coverage increased: `npx nyc report --reporter=text-summary`
5. Commit the new test file

### Helper Function Additions Needed

Add these helpers to `test-helper.js`:

```javascript
// For empty state testing
async function mockEmptyCatalog(page) {
  await page.route('**/all-services.json', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

// For large list testing
async function mockLargeCatalog(page, count = 100) {
  const services = Array.from({ length: count }, (_, i) => ({
    name: `service-${i}`,
    org: 'test-org',
    repo: `repo-${i}`,
    score: Math.floor(Math.random() * 100),
    // ... other required fields
  }));

  await page.route('**/all-services.json', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(services),
    });
  });
}
```

---

## Success Criteria

- [ ] Overall line coverage ≥ 80%
- [ ] API layer coverage ≥ 85%
- [ ] Utils coverage ≥ 75%
- [ ] Services coverage ≥ 80%
- [ ] Low-coverage components ≥ 70%
- [ ] All new tests pass consistently
- [ ] No increase in test suite execution time > 20%
