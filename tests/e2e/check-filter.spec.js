import { test, expect } from './coverage.js';
import { expectedStats } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
  openCheckFilterModal,
  closeCheckFilterModal,
} from './test-helper.js';

test.describe('Check Filter Modal', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Consolidated test: Task 5 - Check Filter Modal Open/Close Interactions
  // Combines: button visibility, open modal, close with X, close outside, close with Escape
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

  // Consolidated test: Task 6 - Check Filter Modal Display Content
  // Combines: display categories, check option cards with descriptions, adoption stats, search functionality
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

  // Keep this test unchanged - dynamic search filtering with count comparison
  test('should filter checks when searching', async ({ page }) => {
    // Open modal
    await openCheckFilterModal(page);

    const modal = page.locator('#check-filter-modal');

    // Get initial count of visible check cards
    const initialCount = await modal.locator('.check-option-card:visible').count();
    expect(initialCount).toBeGreaterThan(0);

    // Type a search query that should match only some checks
    await modal.locator('#check-filter-search').fill('README');

    // Should have fewer visible cards
    await expect(async () => {
      const filteredCount = await modal.locator('.check-option-card:visible').count();
      expect(filteredCount).toBeLessThan(initialCount);
      expect(filteredCount).toBeGreaterThan(0);
    }).toPass({ timeout: 3000 });
  });

  // Consolidated test: Task 7 - Check Filter Active Management
  // Combines: toggle state, show active count, filter services, show summary, clear all
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

  // Keep this test unchanged - category accordion behavior
  test('should collapse and expand categories', async ({ page }) => {
    // Open modal
    await openCheckFilterModal(page);

    const modal = page.locator('#check-filter-modal');
    const categorySection = modal.locator('.check-category-section').first();
    const categoryHeader = categorySection.locator('.check-category-header');
    const categoryContent = categorySection.locator('.check-category-content');

    // Initially expanded
    await expect(categorySection).not.toHaveClass(/collapsed/);
    await expect(categoryContent).toBeVisible();

    // Click header to collapse
    await categoryHeader.click();

    // Should be collapsed
    await expect(categorySection).toHaveClass(/collapsed/);

    // Click again to expand
    await categoryHeader.click();

    // Should be expanded again
    await expect(categorySection).not.toHaveClass(/collapsed/);
  });
});
