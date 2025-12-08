/**
 * Complex Filters & Sort E2E Tests (Consolidated)
 *
 * Phase 4 Coverage Improvement - User story-based comprehensive tests
 * Designed for ~6 consolidated tests covering filter/sort functionality
 *
 * Coverage targets:
 * - StatCard.tsx: Click handlers, active state
 * - FilterButton.tsx: Toggle logic
 * - appStore.ts: Complex filter AND logic
 * - ServiceCard.tsx: Grid vs List variants
 * - Sort state management
 */

import { test, expect } from './coverage.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
  searchServices,
  clearSearch,
  openServiceModal,
  closeServiceModal,
} from './test-helper.js';

// ============================================================================
// USER STORY 4.1: COMPLEX FILTER COMBINATIONS (Consolidated: 4 → 2 tests)
// ============================================================================

test.describe('Complex Filter Combinations', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should apply rank filters, combine with search, and verify filter states', async ({ page }) => {
    const initialCount = await getServiceCount(page);
    expect(initialCount).toBeGreaterThan(0);

    // Phase 1: Apply Gold rank filter via stat card
    const statCards = page.locator('.services-stats .stat-card');
    const goldStat = statCards.filter({ hasText: /Gold/i });
    await expect(goldStat).toBeVisible();
    await goldStat.click();
    await page.waitForTimeout(300);

    // Verify filter is active (should have active class)
    await expect(goldStat).toHaveClass(/active/);

    // Verify count reduced or same
    let filteredCount = await getServiceCount(page);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Phase 2: Add search filter on top of rank filter
    await searchServices(page, 'test');
    await page.waitForTimeout(300);

    const combinedCount = await getServiceCount(page);
    expect(combinedCount).toBeLessThanOrEqual(filteredCount);

    // Phase 3: Verify visible services match search filter
    if (combinedCount > 0) {
      const visibleCards = page.locator('.service-card');
      const firstCard = visibleCards.first();
      // Should contain search term
      await expect(firstCard).toContainText(/test/i);
    }

    // Phase 4: Clear search filter
    await clearSearch(page);
    await page.waitForTimeout(300);

    // Should show more services (only rank filter active)
    const afterClearSearch = await getServiceCount(page);
    expect(afterClearSearch).toBeGreaterThanOrEqual(combinedCount);

    // Phase 5: Verify rank filter is still active
    await expect(goldStat).toHaveClass(/active/);
  });

  test('should handle stale and installed stat card filters', async ({ page }) => {
    // Phase 1: Click Stale filter
    const statCards = page.locator('.services-stats .stat-card');
    const staleStat = statCards.filter({ hasText: /Stale/i });

    if (await staleStat.isVisible()) {
      await staleStat.click();
      await page.waitForTimeout(300);

      // Verify filter is active
      await expect(staleStat).toHaveClass(/active/);

      // Get stale count
      const staleCount = await getServiceCount(page);

      // If stale services exist, verify they have stale badge
      if (staleCount > 0) {
        const firstCard = page.locator('.service-card').first();
        await expect(firstCard.locator('.badge-stale')).toBeVisible();
      }

      // Toggle off
      await staleStat.click();
      await page.waitForTimeout(300);

      // Verify filter is no longer active
      await expect(staleStat).not.toHaveClass(/active/);
    }

    // Phase 2: Click Installed filter
    const installedStat = statCards.filter({ hasText: /Installed/i });

    if (await installedStat.isVisible()) {
      await installedStat.click();
      await page.waitForTimeout(300);

      // Verify filter is active
      await expect(installedStat).toHaveClass(/active/);

      // Toggle off
      await installedStat.click();
      await page.waitForTimeout(300);

      // Verify filter is no longer active
      await expect(installedStat).not.toHaveClass(/active/);
    }
  });
});

// ============================================================================
// USER STORY 4.2: SORT PERSISTENCE (Consolidated: 3 → 2 tests)
// ============================================================================

test.describe('Sort Persistence Across Views', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should maintain sort order when toggling between grid and list views', async ({ page }) => {
    // Phase 1: Change sort to Name A-Z
    const sortSelect = page.locator('#sort-select');
    await expect(sortSelect).toBeVisible();
    await sortSelect.selectOption('name-asc');
    await page.waitForTimeout(300);

    // Get first service name in grid view
    const firstCard = page.locator('.service-card').first();
    const firstName = await firstCard.locator('.service-name').textContent();
    expect(firstName).toBeTruthy();

    // Phase 2: Toggle to list view
    const displayToggle = page.locator('.floating-btn--display');
    await displayToggle.click();
    await page.waitForTimeout(300);

    // Verify list view is active (service cards should still exist)
    await expect(page.locator('.service-card').first()).toBeVisible();

    // Verify first service name is the same (sort persisted)
    const listFirstName = await page.locator('.service-card').first().locator('.service-name').textContent();
    expect(listFirstName).toBe(firstName);

    // Phase 3: Toggle back to grid view
    await displayToggle.click();
    await page.waitForTimeout(300);

    // Verify sort still persisted
    const gridFirstName = await page.locator('.service-card').first().locator('.service-name').textContent();
    expect(gridFirstName).toBe(firstName);

    // Verify sort select still has correct value
    const sortValue = await sortSelect.inputValue();
    expect(sortValue).toBe('name-asc');
  });

  test('should maintain sort after opening and closing service modal', async ({ page }) => {
    // Phase 1: Set sort to Score High to Low
    const sortSelect = page.locator('#sort-select');
    await sortSelect.selectOption('score-desc');
    await page.waitForTimeout(300);

    // Get first service name
    const firstCard = page.locator('.service-card').first();
    const firstName = await firstCard.locator('.service-name').textContent();

    // Phase 2: Open service modal
    await firstCard.click();
    await expect(page.locator('#service-modal')).toBeVisible();

    // Phase 3: Close modal
    await closeServiceModal(page);
    await expect(page.locator('#service-modal')).toBeHidden();

    // Phase 4: Verify sort is still the same
    const afterModalFirstName = await page.locator('.service-card').first().locator('.service-name').textContent();
    expect(afterModalFirstName).toBe(firstName);

    // Verify sort select value
    const sortValue = await sortSelect.inputValue();
    expect(sortValue).toBe('score-desc');
  });
});

// ============================================================================
// USER STORY 4.3: DISPLAY MODE (Consolidated: 2 → 1 test)
// ============================================================================

test.describe('Display Mode Toggle', () => {
  test('should toggle between grid and list views with visual changes', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Phase 1: Verify initial grid view
    const servicesGrid = page.locator('.services-grid');
    await expect(servicesGrid).toBeVisible();

    // Get initial card count
    const initialCount = await getServiceCount(page);

    // Phase 2: Toggle to list view
    const displayToggle = page.locator('.floating-btn--display');
    await expect(displayToggle).toBeVisible();

    // Verify button shows list icon (since we're in grid mode)
    await expect(displayToggle.locator('svg')).toBeVisible();

    await displayToggle.click();
    await page.waitForTimeout(300);

    // Verify services grid has list modifier
    await expect(servicesGrid).toHaveClass(/list/);

    // Verify same number of services
    const listCount = await getServiceCount(page);
    expect(listCount).toBe(initialCount);

    // Phase 3: Toggle back to grid
    await displayToggle.click();
    await page.waitForTimeout(300);

    // Verify grid mode restored
    await expect(servicesGrid).not.toHaveClass(/list/);

    // Verify count unchanged
    const finalCount = await getServiceCount(page);
    expect(finalCount).toBe(initialCount);
  });
});

// ============================================================================
// USER STORY 4.4: SORT OPTIONS (Consolidated: 2 → 1 test)
// ============================================================================

test.describe('Sort Options', () => {
  test('should sort services by different criteria correctly', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    const sortSelect = page.locator('#sort-select');
    await expect(sortSelect).toBeVisible();

    // Phase 1: Sort by Score High to Low (default or set it)
    await sortSelect.selectOption('score-desc');
    await page.waitForTimeout(300);

    // Get first service score
    const firstCard = page.locator('.service-card').first();
    const scoreText = await firstCard.locator('.score-badge-inline').textContent();
    const highScore = parseInt(scoreText || '0');

    // Phase 2: Sort by Score Low to High
    await sortSelect.selectOption('score-asc');
    await page.waitForTimeout(300);

    // First card should now have lower or equal score
    const lowFirstScore = await page.locator('.service-card').first().locator('.score-badge-inline').textContent();
    const lowScore = parseInt(lowFirstScore || '0');
    expect(lowScore).toBeLessThanOrEqual(highScore);

    // Phase 3: Sort by Name A-Z
    await sortSelect.selectOption('name-asc');
    await page.waitForTimeout(300);

    // Get first service name
    const firstNameAsc = await page.locator('.service-card').first().locator('.service-name').textContent();

    // Phase 4: Sort by Name Z-A
    await sortSelect.selectOption('name-desc');
    await page.waitForTimeout(300);

    const firstNameDesc = await page.locator('.service-card').first().locator('.service-name').textContent();

    // Names should be different (unless only one service)
    const serviceCount = await getServiceCount(page);
    if (serviceCount > 1) {
      expect(firstNameAsc).not.toBe(firstNameDesc);
    }
  });
});
