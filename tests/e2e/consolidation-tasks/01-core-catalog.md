# Core Catalog Test Consolidation Tasks

## Overview
- **Files**: catalog.spec.js, check-filter.spec.js, filter-persistence.spec.js
- **Current tests**: 40
- **Target tests**: 25
- **Reduction**: 37.5%

## Tasks

### Task 1: Initial Page Load and Display Verification
**Complexity**: EASY
**Files affected**: catalog.spec.js

**Current tests to replace**:
- [ ] `should load and display correct title` (catalog.spec.js:25)
- [ ] `should display correct dashboard stats` (catalog.spec.js:30)
- [ ] `should render correct number of service cards` (catalog.spec.js:62)
- [ ] `should display service card details correctly` (catalog.spec.js:67)
- [ ] `should have GitHub links on all service cards` (catalog.spec.js:81)
- [ ] `should display footer with documentation link` (catalog.spec.js:93)
- [ ] `should have all action buttons` (catalog.spec.js:101)

**New test to create**:
```javascript
test('should load catalog page with complete UI elements and correct data', async ({ page }) => {
  // Title and header
  await expect(page).toHaveTitle('Scorecards Catalog');
  await expect(page.locator('header')).toContainText('Scorecards');

  // Dashboard stats
  const statsSection = page.locator('.services-stats');
  const totalServices = await statsSection.locator('.stat-card').filter({ hasText: 'Total Services' }).locator('.stat-value').textContent();
  expect(totalServices.trim()).toBe(expectedStats.totalServices.toString());

  const avgScore = await statsSection.locator('.stat-card').filter({ hasText: 'Average Score' }).locator('.stat-value').textContent();
  const avgScoreNum = parseInt(avgScore.trim());
  expect(avgScoreNum).toBeGreaterThan(50);
  expect(avgScoreNum).toBeLessThan(60);

  const goldCount = await statsSection.locator('.stat-card').filter({ hasText: 'Gold' }).locator('.stat-value').textContent();
  expect(goldCount.trim()).toBe(expectedStats.ranks.gold.toString());

  const silverCount = await statsSection.locator('.stat-card').filter({ hasText: 'Silver' }).locator('.stat-value').textContent();
  expect(silverCount.trim()).toBe(expectedStats.ranks.silver.toString());

  const bronzeCount = await statsSection.locator('.stat-card').filter({ hasText: 'Bronze' }).locator('.stat-value').textContent();
  expect(bronzeCount.trim()).toBe(expectedStats.ranks.bronze.toString());

  // Service cards count
  const count = await getServiceCount(page);
  expect(count).toBe(expectedStats.totalServices);

  // Service card details
  const perfectCard = page.locator('.service-card').filter({ hasText: 'test-repo-perfect' }).first();
  await expect(perfectCard).toBeVisible();
  await expect(perfectCard).toContainText('76');
  await expect(perfectCard).toContainText('Gold');

  const emptyCard = page.locator('.service-card').filter({ hasText: 'test-repo-empty' }).first();
  await expect(emptyCard).toBeVisible();
  await expect(emptyCard).toContainText('23');
  await expect(emptyCard).toContainText('Bronze');

  // GitHub links
  const githubLinks = page.locator('.service-card a[href*="github.com"]');
  const linkCount = await githubLinks.count();
  expect(linkCount).toBeGreaterThanOrEqual(expectedStats.totalServices);

  // Footer
  const footer = page.locator('footer');
  await expect(footer).toBeVisible();
  await expect(footer).toContainText('Powered by Scorecards');
  const docLink = footer.locator('a', { hasText: 'Documentation' });
  await expect(docLink).toBeVisible();

  // Action buttons
  const buttons = ['Refresh Data', 'Re-run All Stale', 'Settings', 'Show GitHub Actions'];
  for (const name of buttons) {
    await expect(page.getByRole('button', { name })).toBeVisible();
  }
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged (compare before/after)
- [ ] Delete original 7 tests
- [ ] Update any shared test helpers if needed

---

### Task 2: Sorting Functionality
**Complexity**: EASY
**Files affected**: catalog.spec.js

**Current tests to replace**:
- [ ] `should sort by "Score: High to Low" by default` (catalog.spec.js:120)
- [ ] `should sort by "Score: Low to High"` (catalog.spec.js:126)
- [ ] `should sort by "Name: A to Z"` (catalog.spec.js:139)
- [ ] `should sort by "Name: Z to A"` (catalog.spec.js:152)

**New test to create**:
```javascript
test('should sort services by all available options correctly', async ({ page }) => {
  // Default: Score High to Low
  let names = await getVisibleServiceNames(page);
  expect(names[0]).toBe('test-repo-stale');
  expect(names[names.length - 1]).toBe('test-repo-empty');

  // Score: Low to High
  await selectSort(page, 'Score: Low to High');
  await expect(async () => {
    const names = await getVisibleServiceNames(page);
    expect(names[0]).toBe('test-repo-empty');
  }).toPass({ timeout: 3000 });
  names = await getVisibleServiceNames(page);
  expect(names[0]).toBe('test-repo-empty');
  expect(names[names.length - 1]).toBe('test-repo-stale');

  // Name: A to Z
  await selectSort(page, 'Name: A to Z');
  await expect(async () => {
    const names = await getVisibleServiceNames(page);
    expect(names[0]).toBe('test-repo-edge-cases');
  }).toPass({ timeout: 3000 });
  names = await getVisibleServiceNames(page);
  expect(names[0]).toBe('test-repo-edge-cases');
  expect(names[names.length - 1]).toBe('test-repo-stale');

  // Name: Z to A
  await selectSort(page, 'Name: Z to A');
  await expect(async () => {
    const names = await getVisibleServiceNames(page);
    expect(names[0]).toBe('test-repo-stale');
  }).toPass({ timeout: 3000 });
  names = await getVisibleServiceNames(page);
  expect(names[0]).toBe('test-repo-stale');
  expect(names[names.length - 1]).toBe('test-repo-edge-cases');
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 4 tests

---

### Task 3: Search Functionality
**Complexity**: EASY
**Files affected**: catalog.spec.js

**Current tests to replace**:
- [ ] `should filter by service name search (case-insensitive)` (catalog.spec.js:177)
- [ ] `should clear search and show all services` (catalog.spec.js:192)
- [ ] `should handle search with no results` (catalog.spec.js:208)
- [ ] `should have search input placeholder` (catalog.spec.js:217)

**New test to create**:
```javascript
test('should search services with case-insensitive filtering, clear, and handle no results', async ({ page }) => {
  // Placeholder
  const searchInput = page.getByRole('textbox', { name: 'Search services...' });
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toHaveAttribute('placeholder', /search/i);

  // Lowercase search
  await searchServices(page, 'python');
  let count = await getServiceCount(page);
  expect(count).toBe(1);
  await expect(page.locator('.service-card').first()).toContainText('test-repo-python');

  // Uppercase search (case-insensitive)
  await clearSearch(page);
  await searchServices(page, 'PYTHON');
  count = await getServiceCount(page);
  expect(count).toBe(1);
  await expect(page.locator('.service-card').first()).toContainText('test-repo-python');

  // Clear search
  await clearSearch(page);
  await expect(async () => {
    const count = await getServiceCount(page);
    expect(count).toBe(expectedStats.totalServices);
  }).toPass({ timeout: 3000 });

  // No results
  await searchServices(page, 'nonexistent-service-xyz');
  await expect(async () => {
    const count = await getServiceCount(page);
    expect(count).toBe(0);
  }).toPass({ timeout: 3000 });
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 4 tests

---

### Task 4: StatCard 3-State Filter Behavior
**Complexity**: EASY
**Files affected**: catalog.spec.js

**Current tests to replace**:
- [ ] `should cycle through 3 filter states: include → exclude → clear` (catalog.spec.js:320)
- [ ] `should show active styling on include state` (catalog.spec.js:346)
- [ ] `should show exclude styling on second click` (catalog.spec.js:353)
- [ ] `should remove styling when cleared` (catalog.spec.js:363)

**New test to create**:
```javascript
test('should cycle through 3-state filter with correct styling and behavior', async ({ page }) => {
  const goldStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Gold' });
  const initialCount = await getServiceCount(page);

  // First click → include mode (shows only Gold)
  await goldStat.click();
  await expect(goldStat).toHaveClass(/active/);
  await expect(async () => {
    const count = await getServiceCount(page);
    expect(count).toBe(expectedStats.ranks.gold);
  }).toPass({ timeout: 3000 });

  // Second click → exclude mode (shows all except Gold)
  await goldStat.click();
  await expect(goldStat).toHaveClass(/exclude/);
  await expect(async () => {
    const count = await getServiceCount(page);
    expect(count).toBe(initialCount - expectedStats.ranks.gold);
  }).toPass({ timeout: 3000 });

  // Third click → cleared (shows all)
  await goldStat.click();
  await expect(goldStat).not.toHaveClass(/active/);
  await expect(goldStat).not.toHaveClass(/excluded/);
  await expect(async () => {
    const count = await getServiceCount(page);
    expect(count).toBe(initialCount);
  }).toPass({ timeout: 3000 });
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 4 tests

---

### Task 5: Check Filter Modal - Open/Close Interactions
**Complexity**: EASY
**Files affected**: check-filter.spec.js

**Current tests to replace**:
- [ ] `should have Check Filter button` (check-filter.spec.js:18)
- [ ] `should open check filter modal when clicking Check Filter button` (check-filter.spec.js:24)
- [ ] `should close modal when clicking X button` (check-filter.spec.js:36)
- [ ] `should close modal when clicking outside` (check-filter.spec.js:47)
- [ ] `should close modal when pressing Escape` (check-filter.spec.js:58)

**New test to create**:
```javascript
test('should open and close check filter modal through various interactions', async ({ page }) => {
  // Button visibility
  const checksButton = page.getByRole('button', { name: /Check Filter/i });
  await expect(checksButton).toBeVisible();

  // Open modal
  await openCheckFilterModal(page);
  const modal = page.locator('#check-filter-modal');
  await expect(modal).toBeVisible();
  await expect(modal.locator('h2')).toContainText('Filter by Check');

  // Close with X button
  await closeCheckFilterModal(page);
  await expect(page.locator('#check-filter-modal')).toBeHidden();

  // Close by clicking outside
  await openCheckFilterModal(page);
  await page.locator('#check-filter-modal').click({ position: { x: 10, y: 10 } });
  await expect(page.locator('#check-filter-modal')).toBeHidden();

  // Close with Escape
  await openCheckFilterModal(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('#check-filter-modal')).toBeHidden();
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 5 tests

---

### Task 6: Check Filter Modal - Display Content
**Complexity**: EASY
**Files affected**: check-filter.spec.js

**Current tests to replace**:
- [ ] `should display check categories` (check-filter.spec.js:69)
- [ ] `should display check option cards with descriptions` (check-filter.spec.js:84)
- [ ] `should display adoption stats for each check` (check-filter.spec.js:106)
- [ ] `should have search functionality` (check-filter.spec.js:127)

**New test to create**:
```javascript
test('should display complete check filter modal content structure', async ({ page }) => {
  await openCheckFilterModal(page);
  const modal = page.locator('#check-filter-modal');

  // Categories
  const categories = modal.locator('.check-category-section');
  await expect(categories.first()).toBeVisible();
  const categoryHeader = modal.locator('.check-category-header').first();
  await expect(categoryHeader).toBeVisible();

  // Check option cards
  const checkCards = modal.locator('.check-option-card');
  await expect(checkCards.first()).toBeVisible();
  const checkName = checkCards.first().locator('.check-option-name');
  await expect(checkName).toBeVisible();
  const stateToggle = checkCards.first().locator('.check-state-toggle');
  await expect(stateToggle).toBeVisible();
  await expect(stateToggle.locator('.state-any')).toBeVisible();
  await expect(stateToggle.locator('.state-pass')).toBeVisible();
  await expect(stateToggle.locator('.state-fail')).toBeVisible();

  // Adoption stats
  const checkCard = modal.locator('.check-option-card').first();
  const stats = checkCard.locator('.check-option-stats');
  await expect(stats).toBeVisible();
  await expect(stats.locator('.check-option-stat.passing')).toBeVisible();
  await expect(stats.locator('.check-option-stat.failing')).toBeVisible();
  await expect(stats.locator('.check-option-progress-bar')).toBeVisible();

  // Search functionality
  const searchInput = modal.locator('#check-filter-search');
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toHaveAttribute('placeholder', 'Search checks by name or description...');
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 4 tests

---

### Task 7: Check Filter - Active Filter Management
**Complexity**: MEDIUM
**Files affected**: check-filter.spec.js

**Current tests to replace**:
- [ ] `should toggle check filter state` (check-filter.spec.js:160)
- [ ] `should show active filter count on toggle button` (check-filter.spec.js:178)
- [ ] `should filter services when check filter is applied` (check-filter.spec.js:195)
- [ ] `should show filter summary when filters are active` (check-filter.spec.js:218)
- [ ] `should clear all filters when clicking Clear all` (check-filter.spec.js:236)

**New test to create**:
```javascript
test('should apply, display count, show summary, and clear check filters', async ({ page }) => {
  const initialCount = await getServiceCount(page);
  expect(initialCount).toBe(expectedStats.totalServices);

  await openCheckFilterModal(page);
  const modal = page.locator('#check-filter-modal');
  const checkCard = modal.locator('.check-option-card').first();

  // Initially "Any" should be active
  await expect(checkCard.locator('.state-any')).toHaveClass(/active/);

  // Summary initially hidden
  await expect(modal.locator('.check-filter-summary')).toBeHidden();

  // Click "Pass" filter
  await checkCard.locator('.state-pass').click();
  await expect(checkCard.locator('.state-pass')).toHaveClass(/active/);
  await expect(checkCard.locator('.state-any')).not.toHaveClass(/active/);

  // Summary shows 1 filter
  const summary = modal.locator('.check-filter-summary');
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('1 filter active');

  // Apply second filter
  await modal.locator('.check-option-card').nth(1).locator('.state-fail').click();
  await expect(modal.locator('.check-filter-summary')).toContainText('2 filters active');

  // Close modal
  await page.keyboard.press('Escape');

  // Toggle button shows count
  const toggleButton = page.getByRole('button', { name: /Check Filter/i });
  await expect(toggleButton).toContainText('Check Filter (2)');

  // Services filtered
  await expect(async () => {
    const filteredCount = await getServiceCount(page);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  }).toPass({ timeout: 3000 });

  // Clear all filters
  await openCheckFilterModal(page);
  await modal.locator('.check-filter-summary .check-clear-btn').click();
  await expect(modal.locator('.check-filter-summary')).toBeHidden();
  await expect(modal.locator('.check-option-card').nth(0).locator('.state-any')).toHaveClass(/active/);
  await expect(modal.locator('.check-option-card').nth(1).locator('.state-any')).toHaveClass(/active/);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 5 tests

---

### Task 8: Filter State Persistence - Multiple Filters
**Complexity**: MEDIUM
**Files affected**: filter-persistence.spec.js

**Current tests to replace**:
- [ ] `should persist search filter across view switches` (filter-persistence.spec.js:23)
- [ ] `should persist team filter across view switches` (filter-persistence.spec.js:45)
- [ ] `should combine and clear multiple filters independently` (filter-persistence.spec.js:67)

**New test to create**:
```javascript
test('should persist and combine multiple filters across view switches', async ({ page }) => {
  // Apply search filter
  await searchServices(page, 'perfect');
  let count = await getServiceCount(page);
  expect(count).toBe(1);

  // Switch to Teams view and back
  await switchToTeamsView(page);
  await expect(page.locator('.team-card').first()).toBeVisible();
  await switchToServicesView(page);
  await expect(page.locator('.service-card').first()).toBeVisible();

  // Search filter should persist
  count = await getServiceCount(page);
  expect(count).toBe(1);
  const searchInput = page.getByRole('textbox', { name: /Search services/i });
  let value = await searchInput.inputValue();
  expect(value).toBe('perfect');

  // Clear search, apply team filter
  await searchInput.clear();
  await page.locator('.team-filter-toggle').click();
  await expect(page.locator('.team-dropdown-menu')).toBeVisible();
  await page.locator('.team-option').filter({ hasText: 'platform' }).locator('input').click();
  await expect(async () => {
    const count = await getServiceCount(page);
    expect(count).toBe(2);
  }).toPass({ timeout: 3000 });

  // Team filter should persist across view switches
  await switchToTeamsView(page);
  await switchToServicesView(page);
  count = await getServiceCount(page);
  expect(count).toBe(2);

  // Combine search and team filter
  await searchServices(page, 'test');
  await page.locator('.team-filter-toggle').click();
  await page.locator('.team-option').filter({ hasText: 'backend' }).locator('input').click();
  const combinedCount = await getServiceCount(page);

  // Clear search only - team filter remains
  await searchInput.clear();
  await expect(async () => {
    const count = await getServiceCount(page);
    expect(count).toBeGreaterThanOrEqual(combinedCount);
  }).toPass({ timeout: 3000 });
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 9: Sort State Persistence and Verification
**Complexity**: MEDIUM
**Files affected**: filter-persistence.spec.js

**Current tests to replace**:
- [ ] `should default to Score: High to Low and persist after modal` (filter-persistence.spec.js:106)
- [ ] `should sort correctly in all directions` (filter-persistence.spec.js:128)

**New test to create**:
```javascript
test('should maintain sort selection across interactions and verify all directions', async ({ page }) => {
  const sortSelect = page.locator('#sort-select');

  // Verify default
  let value = await sortSelect.inputValue();
  expect(value).toContain('score');

  // Change sort to Name: A to Z
  await selectSort(page, 'Name: A to Z');
  await expect(page.locator('.service-card').first()).toBeVisible();

  // Open and close modal
  const firstCard = page.locator('.service-card').first();
  await firstCard.click();
  await page.waitForSelector('#service-modal', { state: 'visible' });
  await page.keyboard.press('Escape');
  await expect(page.locator('#service-modal')).not.toBeVisible();

  // Sort should persist
  let selectedValue = await sortSelect.inputValue();
  expect(selectedValue).toContain('name');

  // Score: Low to High
  await selectSort(page, 'Score: Low to High');
  await expect(page.locator('.service-card').first()).toBeVisible();
  let cards = page.locator('.service-card');
  let firstScore = await cards.first().locator('.score, [class*="score"]').textContent();
  let lastScore = await cards.last().locator('.score, [class*="score"]').textContent();
  expect(parseInt(firstScore)).toBeLessThanOrEqual(parseInt(lastScore));

  // Name: A to Z
  await selectSort(page, 'Name: A to Z');
  let firstName = await cards.first().locator('.service-name').textContent();
  let firstChar = firstName.trim().charAt(0).toLowerCase();
  expect(firstChar.charCodeAt(0)).toBeLessThanOrEqual('t'.charCodeAt(0));

  // Name: Z to A
  await selectSort(page, 'Name: Z to A');
  firstName = await cards.first().locator('.service-name').textContent();
  firstChar = firstName.trim().charAt(0).toLowerCase();
  expect(firstChar.charCodeAt(0)).toBeGreaterThanOrEqual('t'.charCodeAt(0));
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 10: Team Filter Dropdown Interaction
**Complexity**: EASY
**Files affected**: filter-persistence.spec.js

**Current tests to replace**:
- [ ] `should close dropdown when clicking outside or pressing Escape` (filter-persistence.spec.js:164)
- [ ] `should persist selection after closing dropdown` (filter-persistence.spec.js:180)

**New test to create**:
```javascript
test('should handle team filter dropdown interactions and persist selections', async ({ page }) => {
  // Open dropdown
  await page.locator('.team-filter-toggle').click();
  await expect(page.locator('.team-dropdown-menu')).toBeVisible();

  // Click outside to close
  await page.locator('body').click({ position: { x: 10, y: 10 } });
  await expect(page.locator('.team-dropdown-menu')).not.toBeVisible();

  // Reopen and close with Escape
  await page.locator('.team-filter-toggle').click();
  await expect(page.locator('.team-dropdown-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.team-dropdown-menu')).not.toBeVisible();

  // Select teams
  await page.locator('.team-filter-toggle').click();
  await page.locator('.team-option').filter({ hasText: 'frontend' }).locator('input').click();
  await page.locator('.team-option').filter({ hasText: 'backend' }).locator('input').click();

  // Verify filter button
  const filterButton = page.locator('.team-filter-toggle');
  await expect(filterButton).toBeVisible();

  // Close dropdown
  await page.keyboard.press('Escape');
  await expect(page.locator('.team-dropdown-menu')).not.toBeVisible();

  // Verify filter is applied
  const count = await getServiceCount(page);
  expect(count).toBe(4); // frontend (2) + backend (2)

  // Reopen and verify selections persist
  await page.locator('.team-filter-toggle').click();
  const frontendCheckbox = page.locator('.team-option').filter({ hasText: 'frontend' }).locator('input');
  expect(await frontendCheckbox.isChecked()).toBe(true);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

## Tests to Keep Unchanged

- `should display installation PR badges when present` (catalog.spec.js:87) - Unique test for optional PR badge feature
- `should filter by rank when clicking stat card` (catalog.spec.js:235) - Complex iteration logic testing all ranks
- `should combine search with rank filter` (catalog.spec.js:267) - Complex multi-step interaction
- `should show filter stat cards` (catalog.spec.js:290) - Unique verification of specific stat card types
- `should update filtered count in dashboard` (catalog.spec.js:298) - Focused on dashboard count updates
- `should filter checks when searching` (check-filter.spec.js:139) - Dynamic search filtering with count comparison
- `should collapse and expand categories` (check-filter.spec.js:260) - Category accordion behavior
- `should default to Services view and remember view after modal close` (filter-persistence.spec.js:217) - Complex view state persistence
