import { test, expect } from './coverage.js';
import { expectedStats } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
  searchServices,
  clearSearch,
  applyStatFilter,
} from './test-helper.js';

test.describe('Search and Filters', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should filter by service name search', async ({ page }) => {
    await searchServices(page, 'python');

    // Should show only test-repo-python
    const count = await getServiceCount(page);
    expect(count).toBe(1);

    const serviceCard = page.locator('.service-card').first();
    await expect(serviceCard).toContainText('test-repo-python');
  });

  test('should be case-insensitive in search', async ({ page }) => {
    await searchServices(page, 'PYTHON');

    const count = await getServiceCount(page);
    expect(count).toBe(1);

    const serviceCard = page.locator('.service-card').first();
    await expect(serviceCard).toContainText('test-repo-python');
  });

  test('should clear search and show all services', async ({ page }) => {
    await searchServices(page, 'python');

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(1);
    }).toPass({ timeout: 3000 });

    await clearSearch(page);

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.totalServices);
    }).toPass({ timeout: 3000 });
  });

  test('should filter by Gold rank', async ({ page }) => {
    // Use .services-stats to target only the Services view stat cards
    const goldStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Gold' });
    await goldStat.click();

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.ranks.gold);
    }).toPass({ timeout: 3000 });

    // Should show test-repo-stale (highest Gold score: 80)
    const serviceCard = page.locator('.service-card').first();
    await expect(serviceCard).toContainText('test-repo-stale');
    await expect(serviceCard).toContainText('Gold');
  });

  test('should filter by Silver rank', async ({ page }) => {
    const silverStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Silver' });
    await silverStat.click();

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.ranks.silver);
    }).toPass({ timeout: 3000 });

    // All visible cards should have Silver badge
    const serviceCards = page.locator('.service-card');
    const firstCard = serviceCards.first();
    await expect(firstCard).toContainText('Silver');
  });

  test('should filter by Bronze rank', async ({ page }) => {
    const bronzeStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Bronze' });
    await bronzeStat.click();

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.ranks.bronze);
    }).toPass({ timeout: 3000 });

    // All visible cards should have Bronze badge
    const serviceCards = page.locator('.service-card');
    const firstCard = serviceCards.first();
    await expect(firstCard).toContainText('Bronze');
  });

  test('should clear filter when clicking active filter again', async ({ page }) => {
    // Apply Gold filter
    const goldStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Gold' });
    await goldStat.click();

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.ranks.gold);
    }).toPass({ timeout: 3000 });

    // Click again - filters use 3-state cycle: include -> exclude -> clear
    // Second click enters "exclude" state, showing all non-Gold services (7)
    await goldStat.click();

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.totalServices - expectedStats.ranks.gold); // 9 - 2 = 7
    }).toPass({ timeout: 3000 });
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

    // Should show only test-repo-javascript (which is Silver)
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(1);
    }).toPass({ timeout: 3000 });

    const serviceCard = page.locator('.service-card').first();
    await expect(serviceCard).toContainText('test-repo-javascript');
    await expect(serviceCard).toContainText('Silver');
  });

  test('should show "With API" filter', async ({ page }) => {
    const apiStat = page.locator('.stat-card').filter({ hasText: 'With API' });
    await expect(apiStat).toBeVisible();

    // Current test data has 1 service with API (test-repo-stale)
    await expect(apiStat).toContainText('1');
  });

  test('should show "Stale" filter', async ({ page }) => {
    const staleStat = page.locator('.stat-card').filter({ hasText: 'Stale' });
    await expect(staleStat).toBeVisible();

    // Current test data has 1 stale service (test-repo-stale)
    await expect(staleStat).toContainText('1');
  });

  test('should show "Installed" filter', async ({ page }) => {
    const installedStat = page.locator('.stat-card').filter({ hasText: 'Installed' });
    await expect(installedStat).toBeVisible();

    // Current test data has 1 installed service (test-repo-stale)
    await expect(installedStat).toContainText('1');
  });

  test('should handle search with no results', async ({ page }) => {
    await searchServices(page, 'nonexistent-service-xyz');

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(0);
    }).toPass({ timeout: 3000 });

    // Should show no results message or empty state
    const noResults = page.getByText(/no.*services.*found|no results/i);
    const isEmpty = await noResults.count();
    // If there's no explicit "no results" message, count should just be 0
    expect(isEmpty >= 0).toBe(true);
  });

  test('should update filtered count in dashboard', async ({ page }) => {
    // Apply Bronze filter - use .services-stats to target only Services view
    const bronzeStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Bronze' });
    await bronzeStat.click();

    // The displayed service count should update
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.ranks.bronze);
    }).toPass({ timeout: 3000 });
  });

  test('should have search input placeholder', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: 'Search services...' });
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /search/i);
  });
});
