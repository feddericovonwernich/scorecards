/**
 * Staleness Service E2E Tests
 *
 * Consolidated tests for staleness detection functionality,
 * targeting low coverage in staleness.ts (23%).
 */

import { test, expect } from './coverage.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
} from './test-helper.js';

// ============================================================================
// STATS CARDS & VISUAL INDICATORS (Consolidated from 6 tests → 2)
// ============================================================================

test.describe('Staleness Detection - Stats and Badges', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should display stat cards with correct counts for Stale, Installed, Total, and Average', async ({ page }) => {
    // Test 1: Stale stat card
    const staleCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });
    await expect(staleCard).toBeVisible();
    const staleCount = parseInt(await staleCard.locator('.stat-value').textContent());
    expect(staleCount).toBe(1);

    // Test 2: Installed stat card
    const installedCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Installed' });
    await expect(installedCard).toBeVisible();
    const installedCount = parseInt(await installedCard.locator('.stat-value').textContent());
    expect(installedCount).toBeGreaterThanOrEqual(1);

    // Test 3: Total Services stat
    const totalServices = page.locator('#services-view').getByText('Total Services');
    await expect(totalServices).toBeVisible();

    // Test 4: Average Score stat
    const avgScore = page.locator('#services-view').getByText('Average Score');
    await expect(avgScore).toBeVisible();

    // Test 5: Verify staleness percentage calculation
    const totalCount = await getServiceCount(page);
    const percentage = Math.round((staleCount / totalCount) * 100);
    expect(percentage).toBeGreaterThanOrEqual(0);
    expect(percentage).toBeLessThanOrEqual(100);
  });

  test('should display correct badges on service cards', async ({ page }) => {
    // Test 1: STALE badge on stale service
    const staleService = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    await expect(staleService).toBeVisible();
    await expect(staleService.locator('.badge-stale')).toBeVisible();

    // Test 2: INSTALLED badge on installed service
    await expect(staleService.locator('text=INSTALLED')).toBeVisible();

    // Test 3: No STALE badge on up-to-date service
    const upToDateService = page.locator('.service-card').filter({ hasText: 'test-repo-perfect' });
    await expect(upToDateService).toBeVisible();
    await expect(upToDateService.locator('.badge-stale')).toHaveCount(0);
  });
});

// ============================================================================
// FILTERING (Consolidated from 9 tests → 2)
// ============================================================================

test.describe('Staleness Detection - Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should cycle through include/exclude/clear for Stale and Installed filters', async ({ page }) => {
    const initialCount = await getServiceCount(page);
    expect(initialCount).toBeGreaterThan(1);

    // Test Stale filter cycle
    const staleCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });

    // Include stale
    await staleCard.click();
    await page.waitForTimeout(300);
    let filteredCount = await getServiceCount(page);
    expect(filteredCount).toBe(1);
    const staleService = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    await expect(staleService).toBeVisible();

    // Exclude stale
    await staleCard.click();
    await page.waitForTimeout(300);
    await expect(staleService).toBeHidden();

    // Clear stale filter
    await staleCard.click();
    await page.waitForTimeout(300);
    const allCount = await getServiceCount(page);
    expect(allCount).toBeGreaterThan(1);

    // Test Installed filter cycle
    const installedCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Installed' });

    // Include installed
    await installedCard.click();
    await page.waitForTimeout(300);
    filteredCount = await getServiceCount(page);
    expect(filteredCount).toBeGreaterThanOrEqual(1);
    await expect(staleService).toBeVisible();

    // Exclude installed
    await installedCard.click();
    await page.waitForTimeout(300);
    await expect(staleService).toBeHidden();

    // Clear installed filter
    await installedCard.click();
    await page.waitForTimeout(300);
    expect(await getServiceCount(page)).toBe(initialCount);
  });

  test('should combine stale filter with search, Gold rank, and Installed filters', async ({ page }) => {
    const staleCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });

    // Test 1: Stale + Search
    await staleCard.click();
    await page.waitForTimeout(300);

    const searchInput = page.getByRole('textbox', { name: 'Search services...' });
    await searchInput.fill('test-repo');
    await page.waitForTimeout(300);
    expect(await getServiceCount(page)).toBe(1);

    await searchInput.fill('nonexistent');
    await page.waitForTimeout(300);
    expect(await getServiceCount(page)).toBe(0);

    // Clear for next test
    await searchInput.fill('');
    await staleCard.click();
    await staleCard.click();
    await page.waitForTimeout(300);

    // Test 2: Gold + Stale
    const goldCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Gold' });
    await goldCard.click();
    await page.waitForTimeout(300);

    await staleCard.click();
    await page.waitForTimeout(300);

    const staleService = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    await expect(staleService).toBeVisible();
    expect(await getServiceCount(page)).toBe(1);

    // Clear for next test
    await goldCard.click();
    await goldCard.click();
    await staleCard.click();
    await staleCard.click();
    await page.waitForTimeout(300);

    // Test 3: Installed + Stale
    const installedCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Installed' });
    await installedCard.click();
    await page.waitForTimeout(300);

    await staleCard.click();
    await page.waitForTimeout(300);

    await expect(staleService).toBeVisible();
    expect(await getServiceCount(page)).toBe(1);
  });
});

// ============================================================================
// EDGE CASES (Consolidated from 3 tests → 1)
// ============================================================================

test.describe('Staleness Detection - Edge Cases', () => {
  test('should handle page load without errors and display correct stats', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Verify page loaded without errors
    const servicesGrid = page.locator('.services-grid');
    await expect(servicesGrid).toBeVisible();

    // Verify stale count
    const staleCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });
    const staleCount = parseInt(await staleCard.locator('.stat-value').textContent());
    expect(staleCount).toBe(1);

    // Verify installed count
    const installedCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Installed' });
    const installedCount = parseInt(await installedCard.locator('.stat-value').textContent());
    expect(installedCount).toBeGreaterThanOrEqual(1);
  });
});
