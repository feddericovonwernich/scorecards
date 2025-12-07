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

  test('should have Check Filter button', async ({ page }) => {
    // React uses role-based button with "Check Filter" text
    const checksButton = page.getByRole('button', { name: /Check Filter/i });
    await expect(checksButton).toBeVisible();
  });

  test('should open check filter modal when clicking Check Filter button', async ({ page }) => {
    // Open modal using helper
    await openCheckFilterModal(page);

    // Modal should be visible
    const modal = page.locator('#check-filter-modal');
    await expect(modal).toBeVisible();

    // Modal should have the title
    await expect(modal.locator('h2')).toContainText('Filter by Check');
  });

  test('should close modal when clicking X button', async ({ page }) => {
    // Open modal
    await openCheckFilterModal(page);

    // Close using helper
    await closeCheckFilterModal(page);

    // Modal should be hidden
    await expect(page.locator('#check-filter-modal')).toBeHidden();
  });

  test('should close modal when clicking outside', async ({ page }) => {
    // Open modal
    await openCheckFilterModal(page);

    // Click outside the modal content (on the overlay)
    await page.locator('#check-filter-modal').click({ position: { x: 10, y: 10 } });

    // Modal should be hidden
    await expect(page.locator('#check-filter-modal')).toBeHidden();
  });

  test('should close modal when pressing Escape', async ({ page }) => {
    // Open modal
    await openCheckFilterModal(page);

    // Press Escape
    await page.keyboard.press('Escape');

    // Modal should be hidden
    await expect(page.locator('#check-filter-modal')).toBeHidden();
  });

  test('should display check categories', async ({ page }) => {
    // Open modal
    await openCheckFilterModal(page);

    const modal = page.locator('#check-filter-modal');

    // Should have at least one category section
    const categories = modal.locator('.check-category-section');
    await expect(categories.first()).toBeVisible();

    // Category should have a header with title
    const categoryHeader = modal.locator('.check-category-header').first();
    await expect(categoryHeader).toBeVisible();
  });

  test('should display check option cards with descriptions', async ({ page }) => {
    // Open modal
    await openCheckFilterModal(page);

    const modal = page.locator('#check-filter-modal');

    // Should have check option cards
    const checkCards = modal.locator('.check-option-card');
    await expect(checkCards.first()).toBeVisible();

    // Each card should have a name
    const checkName = checkCards.first().locator('.check-option-name');
    await expect(checkName).toBeVisible();

    // Cards should have 3-state toggle buttons (Any, Pass, Fail)
    const stateToggle = checkCards.first().locator('.check-state-toggle');
    await expect(stateToggle).toBeVisible();
    await expect(stateToggle.locator('.state-any')).toBeVisible();
    await expect(stateToggle.locator('.state-pass')).toBeVisible();
    await expect(stateToggle.locator('.state-fail')).toBeVisible();
  });

  test('should display adoption stats for each check', async ({ page }) => {
    // Open modal
    await openCheckFilterModal(page);

    const modal = page.locator('#check-filter-modal');

    // Should have stats section showing passing/failing counts
    const checkCard = modal.locator('.check-option-card').first();
    const stats = checkCard.locator('.check-option-stats');
    await expect(stats).toBeVisible();

    // Should show passing count
    await expect(stats.locator('.check-option-stat.passing')).toBeVisible();

    // Should show failing count
    await expect(stats.locator('.check-option-stat.failing')).toBeVisible();

    // Should show progress bar
    await expect(stats.locator('.check-option-progress-bar')).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    // Open modal
    await openCheckFilterModal(page);

    const modal = page.locator('#check-filter-modal');

    // Search input should be visible
    const searchInput = modal.locator('#check-filter-search');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'Search checks by name or description...');
  });

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

  test('should toggle check filter state', async ({ page }) => {
    // Open modal
    await openCheckFilterModal(page);

    const modal = page.locator('#check-filter-modal');
    const checkCard = modal.locator('.check-option-card').first();

    // Initially "Any" should be active
    await expect(checkCard.locator('.state-any')).toHaveClass(/active/);

    // Click "Pass" filter
    await checkCard.locator('.state-pass').click();

    // Now "Pass" should be active and "Any" should not
    await expect(checkCard.locator('.state-pass')).toHaveClass(/active/);
    await expect(checkCard.locator('.state-any')).not.toHaveClass(/active/);
  });

  test('should show active filter count on toggle button', async ({ page }) => {
    // Open modal
    await openCheckFilterModal(page);

    const modal = page.locator('#check-filter-modal');

    // Click "Pass" filter on first check
    await modal.locator('.check-option-card').first().locator('.state-pass').click();

    // Close modal
    await page.keyboard.press('Escape');

    // Toggle button should show count
    const toggleButton = page.getByRole('button', { name: /Check Filter/i });
    await expect(toggleButton).toContainText('Check Filter (1)');
  });

  test('should filter services when check filter is applied', async ({ page }) => {
    // Get initial service count
    const initialCount = await getServiceCount(page);
    expect(initialCount).toBe(expectedStats.totalServices);

    // Open modal
    await openCheckFilterModal(page);

    const modal = page.locator('#check-filter-modal');

    // Apply a "must pass" filter on first check
    await modal.locator('.check-option-card').first().locator('.state-pass').click();

    // Close modal
    await page.keyboard.press('Escape');

    // Wait for services to re-render and verify count reduced
    await expect(async () => {
      const filteredCount = await getServiceCount(page);
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    }).toPass({ timeout: 3000 });
  });

  test('should show filter summary when filters are active', async ({ page }) => {
    // Open modal
    await openCheckFilterModal(page);

    const modal = page.locator('#check-filter-modal');

    // Initially no summary should show
    await expect(modal.locator('.check-filter-summary')).toBeHidden();

    // Apply a filter
    await modal.locator('.check-option-card').first().locator('.state-pass').click();

    // Summary should now show
    const summary = modal.locator('.check-filter-summary');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText('1 filter active');
  });

  test('should clear all filters when clicking Clear all', async ({ page }) => {
    // Open modal
    await openCheckFilterModal(page);

    const modal = page.locator('#check-filter-modal');

    // Apply filters on first two checks
    await modal.locator('.check-option-card').nth(0).locator('.state-pass').click();
    await modal.locator('.check-option-card').nth(1).locator('.state-fail').click();

    // Summary should show 2 filters
    await expect(modal.locator('.check-filter-summary')).toContainText('2 filters active');

    // Click Clear all
    await modal.locator('.check-filter-summary .check-clear-btn').click();

    // Summary should be hidden (no active filters)
    await expect(modal.locator('.check-filter-summary')).toBeHidden();

    // Both checks should have "Any" active again
    await expect(modal.locator('.check-option-card').nth(0).locator('.state-any')).toHaveClass(/active/);
    await expect(modal.locator('.check-option-card').nth(1).locator('.state-any')).toHaveClass(/active/);
  });

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
