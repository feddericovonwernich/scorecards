# Strategic Coverage Improvement Plan
**Generated**: 2025-12-08
**Current Coverage**: 66.53% lines | **Target**: 80%+ lines
**Strategy**: User journey consolidation with minimal test count

---

## Executive Summary

**Current State**: 66.53% line coverage (2070/3111 lines) across 263 tests

**Critical Gaps Identified**:
- **UI Components**: FilterButton (14%), StatCard (8%), LinksTab (0%)
- **Utilities**: animation, clipboard, crypto, dom, duration-tracker (0-3%)
- **Services**: staleness (31%), checks API (30%), github API (37%)
- **State**: appStore filtering/sorting (46%)

**Key Insight**: Tests validate UI rendering but miss actual user interactions (clicks, keyboard, state transitions). Legacy vanilla JS utilities exist but aren't called by React components.

**Strategy**:
1. Focus on **real user journeys** that naturally exercise multiple code paths
2. Consolidate interactions into **longer flow tests** (not isolated unit-style tests)
3. Prioritize **high-impact areas** that unlock multiple coverage gains
4. **Skip legacy utilities** (0% coverage utils are dead code from vanilla JS era)

**Estimated Impact**: +14-18% coverage gain reaching 80-85% with 8-12 new consolidated tests

---

## Phase 1: Interactive UI Components (High Impact)
**Priority**: CRITICAL
**Estimated Coverage Gain**: +5-6%
**Test Count**: 2-3 consolidated tests
**Complexity**: LOW

### Target Components
- `StatCard.tsx` (7.69% → 85%+)
- `FilterButton.tsx` (14.28% → 85%+)
- `ServiceCard.tsx` (60.81% → 80%+)

### Why This Phase First
- **Highest ROI**: Small effort, large coverage gain
- **Foundation**: These components are used everywhere
- **Natural consolidation**: One user journey hits all three components

### User Journey 1.1: Complete Filter Interaction Flow
**File**: `tests/e2e/interactive-filters.spec.js`

```javascript
test('should interact with stat cards, filter buttons, and service cards using clicks and keyboard', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Phase 1: StatCard click interaction (cycling through include/exclude/null)
  const goldCard = page.locator('.stat-card').filter({ hasText: 'Gold' });

  // First click: include filter (filterState='include')
  await goldCard.click();
  await expect(goldCard).toHaveClass(/active|include/);
  let serviceCount = await getServiceCount(page);
  expect(serviceCount).toBeGreaterThan(0);

  // Second click: exclude filter (filterState='exclude')
  await goldCard.click();
  await expect(goldCard).toHaveClass(/exclude/);
  serviceCount = await getServiceCount(page);

  // Third click: clear filter (filterState=null)
  await goldCard.click();
  await expect(goldCard).not.toHaveClass(/active|include|exclude/);

  // Phase 2: StatCard keyboard interaction (Enter and Space)
  const silverCard = page.locator('.stat-card').filter({ hasText: 'Silver' });
  await silverCard.focus();
  await page.keyboard.press('Enter');
  await expect(silverCard).toHaveClass(/active/);

  await silverCard.focus();
  await page.keyboard.press('Space');
  await expect(silverCard).toHaveClass(/exclude/);

  // Clear filters for next phase
  await silverCard.click();

  // Phase 3: FilterButton interactions in Actions Widget
  await page.getByRole('button', { name: /actions/i }).click();
  const widget = page.locator('.actions-widget, #actions-widget');
  await expect(widget).toBeVisible();

  // FilterButton: Click status filters
  const runningFilter = widget.locator('button').filter({ hasText: /running|in_progress/i });
  if (await runningFilter.isVisible()) {
    const countBefore = await runningFilter.textContent();
    expect(countBefore).toMatch(/\d+/); // Has count badge

    await runningFilter.click();
    await expect(runningFilter).toHaveClass(/active/);
    await expect(runningFilter).toHaveAttribute('data-status');

    // Toggle off
    await runningFilter.click();
    await expect(runningFilter).not.toHaveClass(/active/);
  }

  // Phase 4: ServiceCard interactions (both grid and list views)
  await page.locator('.actions-widget button[aria-label*="close"]').click();

  // ServiceCard in grid view: Team link click
  const serviceCard = page.locator('.service-card').first();
  const teamLink = serviceCard.locator('a[href*="#team="], .team-link');
  if (await teamLink.isVisible()) {
    await teamLink.click();
    // Verify team filter applied
    await expect(page.locator('.active-filter, .filter-badge')).toBeVisible();
  }

  // Clear team filter
  const clearFilters = page.locator('button:has-text("Clear"), .clear-filters');
  if (await clearFilters.isVisible()) {
    await clearFilters.click();
  }

  // Switch to list view
  const listViewButton = page.locator('button[aria-label*="list"], .view-toggle').last();
  if (await listViewButton.isVisible()) {
    await listViewButton.click();
    await page.waitForTimeout(300);

    // ServiceCard list view variant: GitHub link click (stops propagation)
    const listCard = page.locator('.service-card, .service-row').first();
    const githubLink = listCard.locator('a[href*="github.com"]').first();

    // Test event propagation: clicking link shouldn't open modal
    const modalBefore = page.locator('#service-modal, .service-modal');
    await expect(modalBefore).toBeHidden();

    // Click GitHub link (with newContext to prevent navigation)
    await githubLink.click({ modifiers: ['Control'] });
    await page.waitForTimeout(200);

    // Modal should NOT open (link prevents propagation)
    await expect(modalBefore).toBeHidden();

    // But clicking the card itself should open modal
    await listCard.click();
    await expect(page.locator('#service-modal')).toBeVisible();
  }
});
```

**Coverage Impact**:
- `StatCard.tsx`: All click handlers (onClick), keyboard handlers (onKeyDown), filter state cycling, CSS classes, accessibility attributes
- `FilterButton.tsx`: Click handler, count badge rendering, active state, data-status attribute
- `ServiceCard.tsx`: List view variant, team link click, GitHub link propagation prevention, keyboard navigation in list view

---

### User Journey 1.2: Service Card PR and Stale Interactions
**File**: `tests/e2e/service-card-actions.spec.js`

```javascript
test('should interact with PR links, stale badges, and trigger buttons on service cards', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Find service card with PR (installation pull request)
  const cardWithPR = page.locator('.service-card:has(.pr-status, .pr-link)').first();

  if (await cardWithPR.isVisible()) {
    // Test PR link click (should not open modal)
    const prLink = cardWithPR.locator('a[href*="pull"]');
    const prStatus = await prLink.textContent();
    expect(prStatus).toMatch(/OPEN|CLOSED|MERGED/i);

    // Click PR link with Ctrl to open in new tab (prevents navigation)
    await prLink.click({ modifiers: ['Control'] });
    await page.waitForTimeout(200);

    // Modal should NOT have opened
    await expect(page.locator('#service-modal')).toBeHidden();
  }

  // Find stale service card
  const staleCard = page.locator('.service-card:has(.badge-stale, [class*="stale"])').first();

  if (await staleCard.isVisible()) {
    // Verify stale badge rendering
    const staleBadge = staleCard.locator('.badge-stale, [class*="stale"]');
    await expect(staleBadge).toBeVisible();

    // Set up auth for workflow trigger
    await openSettingsModal(page);
    await setGitHubPAT(page, 'ghp_test_token_123456789');
    await closeSettingsModal(page);

    // Mock workflow dispatch
    await mockWorkflowDispatch(page, { status: 204 });

    // Click re-run/trigger button on stale card
    const triggerButton = staleCard.locator('button:has-text("Re-run"), button[title*="trigger"]');
    if (await triggerButton.isVisible()) {
      await triggerButton.click();

      // Verify toast notification
      await expect(page.locator('.toast-success, .toast')).toBeVisible();
    }
  }

  // Test keyboard navigation on service card
  const firstCard = page.locator('.service-card').first();
  await firstCard.focus();
  await page.keyboard.press('Enter');

  // Modal should open
  await expect(page.locator('#service-modal')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#service-modal')).toBeHidden();

  // Test Space key on card (should also open)
  await firstCard.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#service-modal')).toBeVisible();
});
```

**Coverage Impact**:
- `ServiceCard.tsx`: PR link rendering and click handling, stale badge display, trigger button interaction, keyboard handlers (both Enter and Space)
- Workflow trigger integration
- Event propagation prevention on links

---

## Phase 2: Modal Tab Completion (Medium Impact)
**Priority**: HIGH
**Estimated Coverage Gain**: +2-3%
**Test Count**: 1 consolidated test
**Complexity**: LOW

### Target Components
- `LinksTab.tsx` (0% → 90%+)
- `APITab.tsx` (31% → 75%+)
- `ServiceModal.tsx` (70% → 85%+)

### User Journey 2.1: Complete Modal Tab Navigation
**File**: `tests/e2e/service-modal-complete.spec.js`

```javascript
test('should navigate through all service modal tabs including Links and API tabs', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Open service modal for service with comprehensive data
  await openServiceModal(page, 'test-repo-perfect');
  const modal = page.locator('#service-modal, .service-modal');
  await expect(modal).toBeVisible();

  // Tab 1: Overview (default, already tested)
  await expect(modal.locator('.modal-score')).toBeVisible();

  // Tab 2: Checks Tab
  await clickServiceModalTab(page, 'Checks');
  await expect(modal.locator('.check-result-item, .check-item')).toBeVisible();

  // Tab 3: API Tab (31% coverage - needs testing)
  const apiTabButton = modal.locator('button:has-text("API")');
  if (await apiTabButton.isVisible()) {
    await apiTabButton.click();
    await page.waitForTimeout(200);

    const apiTab = modal.locator('#api-tab, [role="tabpanel"]').filter({ hasText: /endpoint|swagger|openapi/i });

    // Check for API endpoint display
    const apiEndpoint = apiTab.locator('.api-endpoint, code');
    if (await apiEndpoint.count() > 0) {
      await expect(apiEndpoint.first()).toBeVisible();
    }

    // Check for Swagger/OpenAPI link
    const swaggerLink = apiTab.locator('a[href*="swagger"], a[href*="openapi"]');
    if (await swaggerLink.count() > 0) {
      await expect(swaggerLink.first()).toHaveAttribute('href');
      await expect(swaggerLink.first()).toHaveAttribute('target', '_blank');
    }

    // Check for "No API" empty state
    const noApiMessage = apiTab.locator(':text("No API"), :text("not available")');
    // Either has API info OR shows empty state
    const hasContent = (await apiEndpoint.count()) > 0 || (await noApiMessage.count()) > 0;
    expect(hasContent).toBeTruthy();
  }

  // Tab 4: Links Tab (0% coverage - critical!)
  const linksTabButton = modal.locator('button:has-text("Links")');
  if (await linksTabButton.isVisible()) {
    await linksTabButton.click();
    await page.waitForTimeout(200);

    const linksTab = modal.locator('#links-tab, [role="tabpanel"]').filter({ has: page.locator('a[href]') });

    // Test links rendering
    const linkItems = linksTab.locator('a[href]');
    const linkCount = await linkItems.count();

    if (linkCount > 0) {
      // Verify link structure
      const firstLink = linkItems.first();
      await expect(firstLink).toBeVisible();
      await expect(firstLink).toHaveAttribute('href');
      await expect(firstLink).toHaveAttribute('target', '_blank');
      await expect(firstLink).toHaveAttribute('rel', 'noopener noreferrer');

      // Check for link name
      const linkText = await firstLink.textContent();
      expect(linkText.length).toBeGreaterThan(0);

      // Check for SVG icon
      const icon = firstLink.locator('svg');
      await expect(icon).toBeVisible();

      // Check for optional description
      const description = linkItems.first().locator('.description, .link-desc');
      // Description is optional, just verify structure exists

      // Test keyboard navigation through links
      await firstLink.focus();
      await page.keyboard.press('Tab');
      if (linkCount > 1) {
        await expect(linkItems.nth(1)).toBeFocused();
      }

      // Test link click (with Ctrl to prevent navigation)
      await firstLink.click({ modifiers: ['Control'] });
      // Modal should remain open
      await expect(modal).toBeVisible();
    } else {
      // Test empty state: LinksTab returns null when no links
      // The tab button might not render if links array is empty
      console.log('Service has no links - LinksTab may return null');
    }
  }

  // Tab 5: Contributors Tab
  await clickServiceModalTab(page, 'Contributors');
  const contributorsTab = modal.locator('#contributors-tab');
  if (await contributorsTab.isVisible()) {
    // Verify Gravatar avatars render
    const avatar = contributorsTab.locator('img[src*="gravatar"]').first();
    if (await avatar.count() > 0) {
      await expect(avatar).toBeVisible();
    }
  }

  // Tab 6: Badges Tab
  await clickServiceModalTab(page, 'Badges');
  const badgesTab = modal.locator('#badges-tab');
  await expect(badgesTab).toBeVisible();

  // Tab 7: Workflows/Actions Tab
  await clickServiceModalTab(page, 'Actions');
  const actionsTab = modal.locator('#actions-tab, #workflows-tab');
  await expect(actionsTab).toBeVisible();

  // Close modal with Escape key
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
});
```

**Coverage Impact**:
- `LinksTab.tsx`: Complete coverage (0% → 90%+) - rendering, empty state, link structure, accessibility
- `APITab.tsx`: Empty state, endpoint display, Swagger links (31% → 75%+)
- `ServiceModal.tsx`: Tab navigation completeness

---

## Phase 3: State Management Deep Dive (High Impact)
**Priority**: HIGH
**Estimated Coverage Gain**: +4-5%
**Test Count**: 2 consolidated tests
**Complexity**: MEDIUM

### Target Files
- `appStore.ts` (46% → 75%+)
- `staleness.ts` (31% → 80%+)

### User Journey 3.1: Complex Filter Combinations
**File**: `tests/e2e/complex-filter-state.spec.js`

```javascript
test('should handle complex multi-filter combinations with team formats and edge cases', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  const initialCount = await getServiceCount(page);

  // Phase 1: Team filter (tests both string and object team formats)
  const teamDropdown = page.locator('select, .team-dropdown').filter({ hasText: /team|all teams/i });
  if (await teamDropdown.isVisible()) {
    await teamDropdown.selectOption({ index: 1 }); // Select first team
    const teamFilteredCount = await getServiceCount(page);
    expect(teamFilteredCount).toBeLessThanOrEqual(initialCount);
  }

  // Phase 2: Add rank filter (StatCard)
  const goldCard = page.locator('.stat-card').filter({ hasText: 'Gold' });
  await goldCard.click();
  const goldCount = await getServiceCount(page);
  expect(goldCount).toBeLessThanOrEqual(initialCount);

  // Phase 3: Add search query
  const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
  await searchInput.fill('test');
  await page.waitForTimeout(400); // Debounce
  const searchCount = await getServiceCount(page);
  expect(searchCount).toBeLessThanOrEqual(goldCount);

  // Phase 4: Add stale filter
  const staleFilter = page.locator('button, .filter-btn').filter({ hasText: /stale/i });
  if (await staleFilter.isVisible()) {
    await staleFilter.click();
    await expect(staleFilter).toHaveClass(/active/);
    const staleCount = await getServiceCount(page);
    expect(staleCount).toBeLessThanOrEqual(searchCount);
  }

  // Phase 5: Add "has API" filter
  const apiFilter = page.locator('button, .filter-btn').filter({ hasText: /api|has api/i });
  if (await apiFilter.isVisible()) {
    await apiFilter.click();
    await expect(apiFilter).toHaveClass(/active/);
  }

  // Phase 6: Test filter count
  const activeFilterCount = page.locator('.filter-count, .active-filter-badge');
  if (await activeFilterCount.isVisible()) {
    const countText = await activeFilterCount.textContent();
    const count = parseInt(countText.match(/\d+/)?.[0] || '0');
    expect(count).toBeGreaterThan(0); // At least gold + search active
  }

  // Phase 7: Switch gold to exclude mode
  await goldCard.click(); // Second click = exclude
  await expect(goldCard).toHaveClass(/exclude/);
  const excludeCount = await getServiceCount(page);
  // Excluding gold should show more services than including it
  expect(excludeCount).toBeGreaterThan(0);

  // Phase 8: Clear all filters systematically
  await goldCard.click(); // Third click = clear
  await searchInput.clear();
  if (await staleFilter.isVisible()) {
    await staleFilter.click();
  }
  if (await apiFilter.isVisible()) {
    await apiFilter.click();
  }

  // Or use clear all button
  const clearAll = page.locator('button:has-text("Clear"), .clear-all-filters');
  if (await clearAll.isVisible()) {
    await clearAll.click();
  }

  // Verify back to initial state
  const finalCount = await getServiceCount(page);
  expect(finalCount).toBe(initialCount);
});
```

**Coverage Impact**:
- `appStore.ts`:
  - `filterServices()` with all filter types (team, rank, search, stale, has-api)
  - Team string vs object handling (lines 239-242)
  - Include vs exclude logic (lines 270-271)
  - Search query across multiple fields
  - `setFilter()` Map operations (add, delete, check)
  - `selectActiveFilterCount()` computation
  - Filter composition logic

---

### User Journey 3.2: Staleness Detection and Sorting
**File**: `tests/e2e/staleness-and-sorting.spec.js`

```javascript
test('should detect stale services and sort with edge cases', async ({ page }) => {
  // Mock with specific hash scenarios
  await page.route('**/all-services.json', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { name: 'service-fresh', checks_hash: 'abc123', score: 100 },
        { name: 'service-stale', checks_hash: 'old-hash', score: 90 },
        { name: 'service-no-hash', score: 80 }, // No checks_hash (backwards compat)
        { name: 'service-installed-stale', checks_hash: 'old-hash', score: 70, installed: true },
      ])
    });
  });

  await page.route('**/current-checks.json', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        checks: [],
        hash: 'abc123' // Current hash
      })
    });
  });

  await page.goto('/');
  await waitForCatalogLoad(page);

  // Phase 1: Verify staleness detection
  const staleCards = page.locator('.service-card:has(.badge-stale)');
  const staleCount = await staleCards.count();
  expect(staleCount).toBe(2); // service-stale and service-installed-stale

  // Phase 2: Check staleness stats
  const staleStatCard = page.locator('.stat-card').filter({ hasText: /stale/i });
  if (await staleStatCard.isVisible()) {
    const statValue = await staleStatCard.locator('.stat-value').textContent();
    expect(statValue).toContain('2'); // 2 stale services
  }

  // Phase 3: Filter by stale
  await staleStatCard.click();
  const filteredCount = await getServiceCount(page);
  expect(filteredCount).toBe(2);

  // Phase 4: Test sorting with stale services
  const sortSelect = page.locator('select').filter({ hasText: /sort|score|name/i });

  // Sort by score (descending)
  await sortSelect.selectOption({ label: /score|highest/i });
  await page.waitForTimeout(200);
  let firstCard = page.locator('.service-card').first();
  let firstName = await firstCard.locator('.service-name').textContent();
  expect(firstName).toContain('service-stale'); // 90 score

  // Sort by name A-Z
  await sortSelect.selectOption({ label: /name.*a.*z/i });
  await page.waitForTimeout(200);
  firstCard = page.locator('.service-card').first();
  firstName = await firstCard.locator('.service-name').textContent();
  expect(firstName).toContain('service-installed-stale'); // Alphabetically first

  // Sort by name Z-A
  await sortSelect.selectOption({ label: /name.*z.*a/i });
  await page.waitForTimeout(200);
  firstCard = page.locator('.service-card').first();
  firstName = await firstCard.locator('.service-name').textContent();
  expect(firstName).toContain('service-stale'); // Alphabetically last of stale services

  // Clear stale filter
  await staleStatCard.click();

  // Phase 5: Test all services sorting
  await sortSelect.selectOption({ label: /score|highest/i });
  await page.waitForTimeout(200);
  firstCard = page.locator('.service-card').first();
  firstName = await firstCard.locator('.service-name').textContent();
  expect(firstName).toContain('service-fresh'); // 100 score, highest
});
```

**Coverage Impact**:
- `staleness.ts`:
  - `isServiceStale()` with hash match/mismatch (lines 25-41)
  - `getStalenessInfo()` detailed info
  - `filterStaleServices()` filtering
  - `getStalenessStats()` percentage calculation
  - `countStaleInstalled()` installed filter
  - Backwards compatibility (no checks_hash)
- `appStore.ts`:
  - `sortServices()` all sort types (lines 299-326)
  - `filterAndSortServices()` orchestration
  - Sort state management

---

## Phase 4: API and Service Layer (Medium Impact)
**Priority**: MEDIUM
**Estimated Coverage Gain**: +3-4%
**Test Count**: 2 consolidated tests
**Complexity**: MEDIUM

### Target Files
- `checks.ts` (30% → 75%+)
- `github.ts` (37% → 70%+)

### User Journey 4.1: Check Loading and Cache Behavior
**File**: `tests/e2e/checks-api-caching.spec.js`

```javascript
test('should load checks with caching behavior and error handling', async ({ page }) => {
  let checksRequestCount = 0;

  // Intercept checks API
  await page.route('**/current-checks.json', async (route) => {
    checksRequestCount++;

    if (checksRequestCount === 1) {
      // First request succeeds
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          checks: [
            { id: 'readme', name: 'README', category: 'Documentation' },
            { id: 'ci', name: 'CI', category: 'Infrastructure' },
            { id: 'tests', name: 'Tests', category: 'Quality' },
          ],
          categories: ['Documentation', 'Infrastructure', 'Quality'],
          hash: 'check-hash-123'
        })
      });
    } else {
      // Subsequent requests should use cache (not reach here if cache works)
      await route.fulfill({ status: 304 }); // Not Modified
    }
  });

  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Phase 1: Initial load triggers check loading
  expect(checksRequestCount).toBe(1);

  // Phase 2: Open check filter modal (uses cached checks)
  await page.locator('button:has-text("Filters"), .filter-toggle').click();
  const checkModal = page.locator('#check-filter-modal');
  await expect(checkModal).toBeVisible();

  // Verify checks loaded from cache (no additional request)
  expect(checksRequestCount).toBe(1);

  // Phase 3: Verify checks grouped by category
  const docCategory = checkModal.locator('.check-category').filter({ hasText: 'Documentation' });
  await expect(docCategory).toBeVisible();

  const infraCategory = checkModal.locator('.check-category').filter({ hasText: 'Infrastructure' });
  await expect(infraCategory).toBeVisible();

  // Phase 4: Expand category to see checks
  await docCategory.click();
  const readmeCheck = checkModal.locator('.check-option').filter({ hasText: 'README' });
  await expect(readmeCheck).toBeVisible();

  await checkModal.locator('button[aria-label*="close"], .modal-close').click();

  // Phase 5: Reload page and verify cache TTL (< 5 minutes = use cache)
  await page.reload();
  await waitForCatalogLoad(page);

  // Should still be 1 request (cache not expired)
  expect(checksRequestCount).toBe(1);

  // Phase 6: Test error handling
  await page.route('**/current-checks.json', route => {
    route.fulfill({ status: 500, body: 'Internal Server Error' });
  });

  // Clear localStorage to force reload
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // App should handle error gracefully (fallback to empty checks)
  await expect(page.locator('.catalog-container')).toBeVisible();
});
```

**Coverage Impact**:
- `checks.ts`:
  - `loadChecks()` with cache hit and miss (lines 17-42)
  - Cache TTL validation (< 5 min vs > 5 min)
  - `getChecksByCategory()` grouping and ordering (lines 62-93)
  - `getCategories()` extraction
  - Error handling and fallback (lines 33-41)
  - All cache null checks

---

### User Journey 4.2: GitHub API Authentication and Errors
**File**: `tests/e2e/github-api-edge-cases.spec.js`

```javascript
test('should handle GitHub API calls with authentication states and errors', async ({ page }) => {
  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Phase 1: Rate limit check without token
  let rateLimitCalled = false;
  await page.route('**/api.github.com/rate_limit', (route) => {
    rateLimitCalled = true;
    if (!route.request().headers()['authorization']) {
      // Unauthenticated rate limit
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          resources: {
            core: { limit: 60, remaining: 45, reset: Date.now() / 1000 + 3600 }
          }
        })
      });
    } else {
      // Authenticated rate limit
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          resources: {
            core: { limit: 5000, remaining: 4950, reset: Date.now() / 1000 + 3600 }
          }
        })
      });
    }
  });

  // Check rate limit displays
  const rateLimitBadge = page.locator('.rate-limit, [class*="rate"]');
  if (await rateLimitBadge.isVisible()) {
    const text = await rateLimitBadge.textContent();
    expect(text).toMatch(/\d+/); // Shows remaining count
  }

  // Phase 2: Set token and verify auth header
  await openSettingsModal(page);
  await setGitHubPAT(page, 'ghp_test_token_123456789');
  await closeSettingsModal(page);

  // Wait for rate limit to be rechecked with auth
  await page.waitForTimeout(500);
  expect(rateLimitCalled).toBe(true);

  // Phase 3: Test workflow runs fetch
  let workflowRequestHeaders = null;
  await page.route('**/api.github.com/repos/**/actions/runs**', (route) => {
    workflowRequestHeaders = route.request().headers();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_count: 2,
        workflow_runs: [
          {
            id: 123,
            name: 'Scorecard',
            status: 'completed',
            conclusion: 'success',
            created_at: new Date().toISOString(),
            html_url: 'https://github.com/org/repo/actions/runs/123'
          },
          {
            id: 124,
            name: 'Scorecard',
            status: 'in_progress',
            conclusion: null,
            created_at: new Date().toISOString(),
            html_url: 'https://github.com/org/repo/actions/runs/124'
          }
        ]
      })
    });
  });

  // Open service modal to trigger workflow runs fetch
  await openServiceModal(page, 'test-repo-perfect');
  await clickServiceModalTab(page, 'Actions');

  // Verify auth header was sent
  await page.waitForTimeout(500);
  expect(workflowRequestHeaders).toBeTruthy();
  expect(workflowRequestHeaders['authorization']).toContain('Bearer');

  // Phase 4: Test workflow dispatch
  let dispatchCalled = false;
  let dispatchStatus = 204;
  await page.route('**/api.github.com/repos/**/actions/workflows/*/dispatches', (route) => {
    dispatchCalled = true;
    route.fulfill({ status: dispatchStatus });
  });

  // Trigger workflow
  const triggerButton = page.locator('button:has-text("Re-run"), button:has-text("Trigger")').first();
  if (await triggerButton.isVisible()) {
    await triggerButton.click();
    await page.waitForTimeout(500);
    expect(dispatchCalled).toBe(true);

    // Success toast
    await expect(page.locator('.toast-success')).toBeVisible();
  }

  // Phase 5: Test error scenarios
  await page.reload();
  await waitForCatalogLoad(page);

  // 401 Unauthorized (invalid token)
  await page.route('**/api.github.com/user', (route) => {
    route.fulfill({ status: 401, body: 'Unauthorized' });
  });

  await openSettingsModal(page);
  // Token validation should fail
  await expect(page.locator('.error, .toast-error')).toBeVisible();

  // Phase 6: Network error
  await page.route('**/api.github.com/rate_limit', (route) => {
    route.abort('failed');
  });

  // Should handle gracefully with fallback
  await page.reload();
  await expect(page.locator('.catalog-container')).toBeVisible();
});
```

**Coverage Impact**:
- `github.ts`:
  - `githubApiRequest()` with/without token (lines 31-52)
  - `checkRateLimit()` auth and unauth (lines 57-76)
  - `fetchWorkflowRuns()` response parsing (lines 81-110)
  - `triggerWorkflowDispatch()` 204 success (lines 115-152)
  - Error handling in all try/catch blocks
  - Header merging with options
  - Bearer token format

---

## Phase 5: Display Mode and Persistence (Low Impact)
**Priority**: LOW
**Estimated Coverage Gain**: +1-2%
**Test Count**: 1 test
**Complexity**: LOW

### User Journey 5.1: Display Mode Switching and LocalStorage
**File**: `tests/e2e/display-mode-persistence.spec.js`

```javascript
test('should switch display modes and persist to localStorage', async ({ page }) => {
  // Clear localStorage
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Phase 1: Default view (should be grid)
  await expect(page.locator('.service-grid, .grid-view')).toBeVisible();

  // Phase 2: Switch to list view
  const listViewButton = page.locator('button[aria-label*="list"], .view-toggle').last();
  await listViewButton.click();
  await page.waitForTimeout(200);

  // Verify list view active
  await expect(page.locator('.service-list, .list-view')).toBeVisible();

  // Phase 3: Check localStorage
  const storedMode = await page.evaluate(() => localStorage.getItem('displayMode'));
  expect(storedMode).toBe('list');

  // Phase 4: Reload and verify persistence
  await page.reload();
  await waitForCatalogLoad(page);

  // Should still be in list view
  await expect(page.locator('.service-list, .list-view')).toBeVisible();

  // Phase 5: Switch back to grid
  const gridViewButton = page.locator('button[aria-label*="grid"], .view-toggle').first();
  await gridViewButton.click();
  await page.waitForTimeout(200);

  await expect(page.locator('.service-grid, .grid-view')).toBeVisible();

  const storedMode2 = await page.evaluate(() => localStorage.getItem('displayMode'));
  expect(storedMode2).toBe('grid');
});
```

**Coverage Impact**:
- `appStore.ts`: `setDisplayMode()` with localStorage persistence (line 410)

---

## Phase 6: Theme and Accessibility (Low Impact)
**Priority**: LOW
**Estimated Coverage Gain**: +1-2%
**Test Count**: 1 test
**Complexity**: LOW

### User Journey 6.1: Theme Switching
**File**: Extend existing `tests/e2e/theme-accessibility.spec.js`

```javascript
test('should toggle theme with localStorage persistence and OS preference detection', async ({ page }) => {
  // Clear localStorage
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await mockCatalogRequests(page);
  await page.goto('/');
  await waitForCatalogLoad(page);

  // Get initial theme (OS preference or light default)
  const html = page.locator('html');
  const initialTheme = await html.getAttribute('data-theme');
  expect(initialTheme).toMatch(/light|dark/);

  // Toggle theme
  const themeToggle = page.locator('button[aria-label*="theme"], .theme-toggle');
  await themeToggle.click();

  const newTheme = await html.getAttribute('data-theme');
  expect(newTheme).not.toBe(initialTheme);

  // Verify localStorage
  const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
  expect(storedTheme).toBe(newTheme);

  // Reload and verify persistence
  await page.reload();
  await waitForCatalogLoad(page);

  const persistedTheme = await html.getAttribute('data-theme');
  expect(persistedTheme).toBe(newTheme);

  // Toggle back
  await themeToggle.click();
  const finalTheme = await html.getAttribute('data-theme');
  expect(finalTheme).toBe(initialTheme);
});
```

**Coverage Impact**:
- `theme.ts`: Toggle, persistence, init (50% → 80%+)

---

## Implementation Priority Matrix

| Phase | Priority | Effort | Coverage Gain | ROI | Tests |
|-------|----------|--------|---------------|-----|-------|
| 1 | CRITICAL | LOW | +5-6% | Very High | 2 |
| 2 | HIGH | LOW | +2-3% | High | 1 |
| 3 | HIGH | MEDIUM | +4-5% | High | 2 |
| 4 | MEDIUM | MEDIUM | +3-4% | Medium | 2 |
| 5 | LOW | LOW | +1-2% | Medium | 1 |
| 6 | LOW | LOW | +1-2% | Medium | 1 |
| **TOTAL** | - | - | **+16-22%** | - | **9** |

**Projected Final Coverage**: 82-88% (from 66.53%)

---

## Excluded: Legacy Utilities (Not Worth Testing)

The following utilities have 0% coverage because they're **dead code** from vanilla JS era:

- `animation.ts` - React components handle state internally
- `clipboard.ts` - BadgesTab reimplements inline
- `crypto.ts` - ContributorsTab uses simple hash instead
- `dom.ts` - React handles all DOM manipulation
- `duration-tracker.ts` - Partially used but interval logic never triggered

**Recommendation**: Don't test these. They're exported as window globals for backwards compatibility but have no active call sites. Consider removing in a future refactor.

---

## Execution Strategy

### Week 1: Quick Wins (Phases 1-2)
- **Day 1-2**: Phase 1 - Interactive UI components (2 tests)
- **Day 3**: Phase 2 - Modal tab completion (1 test)
- **Expected**: +7-9% coverage gain

### Week 2: Core Logic (Phases 3-4)
- **Day 1-2**: Phase 3 - State management (2 tests)
- **Day 3-4**: Phase 4 - API layer (2 tests)
- **Expected**: +7-9% coverage gain

### Week 3: Polish (Phases 5-6)
- **Day 1**: Phase 5-6 - Persistence and themes (2 tests)
- **Day 2**: Coverage validation and documentation
- **Expected**: +2-4% coverage gain

### Total Timeline: 2-3 weeks with 9 new consolidated tests

---

## Success Criteria

- [ ] Overall line coverage ≥ 80%
- [ ] UI components ≥ 80%
- [ ] State management ≥ 70%
- [ ] API layer ≥ 70%
- [ ] No regression in existing 263 tests
- [ ] Total test count ≤ 275 (9 new tests max)
- [ ] All new tests pass consistently
- [ ] Each test is a complete user journey (not isolated unit tests)

---

## Key Principles Applied

1. **User Journey Focus**: Every test simulates real user interactions, not isolated function calls
2. **Consolidation**: One test exercises multiple components and code paths
3. **Natural Flows**: Tests follow logical user workflows (filter → search → sort → modal)
4. **Minimal Count**: Maximize coverage with fewest tests possible
5. **Self-Contained**: Each phase has complete context and can be executed independently
6. **Pragmatic**: Skip dead code (legacy utils), focus on active code paths
7. **Continuous Consolidation**: Each test reviews opportunities to merge related interactions

---

## Notes

- This plan focuses on **real coverage gaps** identified by analyzing actual code and test execution
- Legacy utilities (animation, clipboard, crypto, dom) are intentionally excluded as dead code
- Tests emphasize **user interactions** (clicks, keyboard, state changes) not just rendering
- **No new helper functions needed** - existing test helpers cover all patterns
- Each test is designed to be run independently and doesn't depend on test execution order
