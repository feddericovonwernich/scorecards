import { test, expect } from './coverage.js';
import { expectedStats, expectedServices, sortOptions } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
  getVisibleServiceNames,
  selectSort,
  searchServices,
  clearSearch,
  applyStatFilter,
} from './test-helper.js';

// ============================================================================
// CATALOG PAGE - Basic Display
// ============================================================================

test.describe('Catalog Page - Display', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Consolidated test: Task 1 - Initial Page Load and Display Verification
  // Combines: title, dashboard stats, service cards count, service card details,
  // GitHub links, footer, and action buttons tests
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

  // Keep this test unchanged - unique PR badge feature
  test('should display installation PR badges when present', async ({ page }) => {
    const edgeCasesCard = page.locator('.service-card').filter({ hasText: 'test-repo-edge-cases' }).first();
    const prBadge = edgeCasesCard.locator('a[href*="/pull/"]');
    await expect(prBadge).toBeVisible();
  });
});

// ============================================================================
// CATALOG PAGE - Sorting
// ============================================================================

test.describe('Catalog Page - Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Consolidated test: Task 2 - Sorting Functionality
  // Combines: default sort, low to high, A to Z, Z to A tests
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
});

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Consolidated test: Task 3 - Search Functionality
  // Combines: case-insensitive search, clear search, no results, placeholder tests
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
});

// ============================================================================
// RANK FILTERING
// ============================================================================

test.describe('Rank Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should filter by rank when clicking stat card', async ({ page }) => {
    const ranks = [
      { name: 'Gold', count: expectedStats.ranks.gold },
      { name: 'Silver', count: expectedStats.ranks.silver },
      { name: 'Bronze', count: expectedStats.ranks.bronze },
    ];

    for (const rank of ranks) {
      // Click rank filter
      const rankStat = page.locator('.services-stats .stat-card').filter({ hasText: rank.name });
      await rankStat.click();

      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(rank.count);
      }).toPass({ timeout: 3000 });

      // Verify cards have correct rank
      const firstCard = page.locator('.service-card').first();
      await expect(firstCard).toContainText(rank.name);

      // Clear filter for next iteration (click twice to cycle through exclude, then clear)
      await rankStat.click();
      await rankStat.click();

      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(expectedStats.totalServices);
      }).toPass({ timeout: 3000 });
    }
  });

  test('should combine search with rank filter', async ({ page }) => {
    // Filter by Silver rank
    const silverStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Silver' });
    await silverStat.click();

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.ranks.silver);
    }).toPass({ timeout: 3000 });

    // Then search for "javascript"
    await searchServices(page, 'javascript');

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(1);
    }).toPass({ timeout: 3000 });

    const serviceCard = page.locator('.service-card').first();
    await expect(serviceCard).toContainText('test-repo-javascript');
    await expect(serviceCard).toContainText('Silver');
  });

  test('should show filter stat cards', async ({ page }) => {
    const filters = ['With API', 'Stale', 'Installed'];
    for (const filter of filters) {
      const stat = page.locator('.stat-card').filter({ hasText: filter });
      await expect(stat).toBeVisible();
    }
  });

  test('should update filtered count in dashboard', async ({ page }) => {
    const bronzeStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Bronze' });
    await bronzeStat.click();

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.ranks.bronze);
    }).toPass({ timeout: 3000 });
  });
});

// ============================================================================
// 3-STATE FILTERING
// ============================================================================

test.describe('StatCard 3-State Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Consolidated test: Task 4 - StatCard 3-State Filter Behavior
  // Combines: 3-state cycling, active styling, exclude styling, and cleared styling tests
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
});
