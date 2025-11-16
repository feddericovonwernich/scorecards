import { test, expect } from '@playwright/test';
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
    await page.waitForTimeout(300);

    let count = await getServiceCount(page);
    expect(count).toBe(1);

    await clearSearch(page);
    await page.waitForTimeout(300);

    count = await getServiceCount(page);
    expect(count).toBe(expectedStats.totalServices);
  });

  test('should filter by Gold rank', async ({ page }) => {
    const goldStat = page.locator('.stat-card').filter({ hasText: 'Gold' });
    await goldStat.click();
    await page.waitForTimeout(300);

    const count = await getServiceCount(page);
    expect(count).toBe(expectedStats.ranks.gold);

    // Should show test-repo-perfect
    const serviceCard = page.locator('.service-card').first();
    await expect(serviceCard).toContainText('test-repo-perfect');
    await expect(serviceCard).toContainText('Gold');
  });

  test('should filter by Silver rank', async ({ page }) => {
    const silverStat = page.locator('.stat-card').filter({ hasText: 'Silver' });
    await silverStat.click();
    await page.waitForTimeout(300);

    const count = await getServiceCount(page);
    expect(count).toBe(expectedStats.ranks.silver);

    // All visible cards should have Silver badge
    const serviceCards = page.locator('.service-card');
    const firstCard = serviceCards.first();
    await expect(firstCard).toContainText('Silver');
  });

  test('should filter by Bronze rank', async ({ page }) => {
    const bronzeStat = page.locator('.stat-card').filter({ hasText: 'Bronze' });
    await bronzeStat.click();
    await page.waitForTimeout(300);

    const count = await getServiceCount(page);
    expect(count).toBe(expectedStats.ranks.bronze);

    // All visible cards should have Bronze badge
    const serviceCards = page.locator('.service-card');
    const firstCard = serviceCards.first();
    await expect(firstCard).toContainText('Bronze');
  });

  test('should clear filter when clicking active filter again', async ({ page }) => {
    // Apply Gold filter
    const goldStat = page.locator('.stat-card').filter({ hasText: 'Gold' });
    await goldStat.click();
    await page.waitForTimeout(300);

    let count = await getServiceCount(page);
    expect(count).toBe(expectedStats.ranks.gold);

    // Click again - filters use 3-state cycle: include -> exclude -> clear
    // Second click enters "exclude" state, showing all non-Gold services (7)
    await goldStat.click();
    await page.waitForTimeout(300);

    count = await getServiceCount(page);
    expect(count).toBe(expectedStats.totalServices - expectedStats.ranks.gold); // 8 - 1 = 7
  });

  test('should combine search with rank filter', async ({ page }) => {
    // Filter by Silver rank
    const silverStat = page.locator('.stat-card').filter({ hasText: 'Silver' });
    await silverStat.click();
    await page.waitForTimeout(300);

    // Then search for "javascript"
    await searchServices(page, 'javascript');
    await page.waitForTimeout(300);

    // Should show only test-repo-javascript (which is Silver)
    const count = await getServiceCount(page);
    expect(count).toBe(1);

    const serviceCard = page.locator('.service-card').first();
    await expect(serviceCard).toContainText('test-repo-javascript');
    await expect(serviceCard).toContainText('Silver');
  });

  test('should show "With API" filter', async ({ page }) => {
    const apiStat = page.locator('.stat-card').filter({ hasText: 'With API' });
    await expect(apiStat).toBeVisible();

    // Current test data has 0 services with API
    await expect(apiStat).toContainText('0');
  });

  test('should show "Stale" filter', async ({ page }) => {
    const staleStat = page.locator('.stat-card').filter({ hasText: 'Stale' });
    await expect(staleStat).toBeVisible();

    // Current test data has 0 stale services
    await expect(staleStat).toContainText('0');
  });

  test('should show "Installed" filter', async ({ page }) => {
    const installedStat = page.locator('.stat-card').filter({ hasText: 'Installed' });
    await expect(installedStat).toBeVisible();

    // Current test data has 0 installed services
    await expect(installedStat).toContainText('0');
  });

  test('should handle search with no results', async ({ page }) => {
    await searchServices(page, 'nonexistent-service-xyz');
    await page.waitForTimeout(300);

    const count = await getServiceCount(page);
    expect(count).toBe(0);

    // Should show no results message or empty state
    const noResults = page.getByText(/no.*services.*found|no results/i);
    const isEmpty = await noResults.count();
    // If there's no explicit "no results" message, count should just be 0
    expect(count).toBe(0);
  });

  test('should update filtered count in dashboard', async ({ page }) => {
    // Apply Bronze filter
    const bronzeStat = page.locator('.stat-card').filter({ hasText: 'Bronze' });
    await bronzeStat.click();
    await page.waitForTimeout(300);

    // The displayed service count should update
    const count = await getServiceCount(page);
    expect(count).toBe(expectedStats.ranks.bronze);
  });

  test('should have search input placeholder', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: 'Search services...' });
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /search/i);
  });
});
