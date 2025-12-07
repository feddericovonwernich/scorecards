import { test, expect } from './coverage.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
  switchToTeamsView,
  switchToServicesView,
  searchServices,
  selectSort,
} from './test-helper.js';

// ============================================================================
// FILTER STATE PERSISTENCE ACROSS VIEW SWITCHES
// ============================================================================

test.describe('Filter State Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Consolidated test: Task 8 - Filter State Persistence - Multiple Filters
  // Combines: search filter persistence, team filter persistence, combine and clear filters
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
});

// ============================================================================
// SORT STATE PERSISTENCE
// ============================================================================

test.describe('Sort State Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Consolidated test: Task 9 - Sort State Persistence and Verification
  // Combines: default sort and persist after modal, sort correctly in all directions
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
});

// ============================================================================
// TEAM FILTER DROPDOWN STATE
// ============================================================================

test.describe('Team Filter Dropdown State', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Consolidated test: Task 10 - Team Filter Dropdown Interaction
  // Combines: close dropdown when clicking outside or pressing Escape, persist selection after closing
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
});

// ============================================================================
// VIEW STATE PERSISTENCE
// ============================================================================

test.describe('View State Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Keep this test unchanged - complex view state persistence
  test('should default to Services view and remember view after modal close', async ({ page }) => {
    // Verify default Services view is active
    const servicesTab = page.locator('[data-view="services"]');
    let hasActiveClass = await servicesTab.evaluate(el => el.classList.contains('active'));
    expect(hasActiveClass).toBe(true);

    // Switch to Teams view and open/close modal
    await switchToTeamsView(page);
    await page.locator('.team-card').first().click();
    await page.waitForSelector('#team-modal', { state: 'visible' });
    await page.keyboard.press('Escape');
    await expect(page.locator('#team-modal')).not.toBeVisible();

    // Should still be in Teams view
    const teamsTab = page.locator('[data-view="teams"]');
    hasActiveClass = await teamsTab.evaluate(el => el.classList.contains('active'));
    expect(hasActiveClass).toBe(true);

    // Switch back and verify Services view persists after settings modal
    await switchToServicesView(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.waitForSelector('#settings-modal', { state: 'visible' });
    await page.keyboard.press('Escape');
    await expect(page.locator('#settings-modal')).not.toBeVisible();

    hasActiveClass = await servicesTab.evaluate(el => el.classList.contains('active'));
    expect(hasActiveClass).toBe(true);
  });
});
