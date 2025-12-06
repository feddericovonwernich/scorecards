import { test, expect } from '@playwright/test';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openCheckAdoptionDashboard,
  closeCheckAdoptionModal,
  switchToTeamsView,
} from './test-helper.js';

test.describe('Check Adoption Dashboard Modal', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Open the Check Adoption Dashboard using helper
    await openCheckAdoptionDashboard(page);
  });

  test('modal opens with correct structure', async ({ page }) => {
    // Verify modal is visible
    const modal = page.locator('#check-adoption-modal');
    await expect(modal).toBeVisible();

    // Verify title
    await expect(modal.locator('h2')).toContainText('Check Adoption Dashboard');

    // Verify close button is visible
    const closeButton = modal.getByRole('button', { name: 'Close modal' });
    await expect(closeButton).toBeVisible();
  });

  test('displays overall stats with correct styling', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Verify stats section exists - React uses adoption-stats-row
    const statsRow = modal.locator('.adoption-stats-row');
    await expect(statsRow).toBeVisible();

    // Verify stat cards are present
    const statCards = modal.locator('.adoption-stat-card');
    const cardCount = await statCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    // Verify stat values are visible
    await expect(modal.locator('.adoption-stat-value').first()).toBeVisible();

    // Verify stat labels are visible
    await expect(modal.locator('.adoption-stat-label').first()).toBeVisible();
  });

  test('check selector dropdown is visible and functional', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Verify dropdown toggle button exists
    const toggle = modal.locator('.check-selector-toggle');
    await expect(toggle).toBeVisible();

    // Click toggle to open dropdown
    await toggle.click();

    // Verify menu is visible
    await expect(modal.locator('.check-selector-menu.open')).toBeVisible();

    // Verify search input is visible
    await expect(modal.locator('.check-selector-search input')).toBeVisible();

    // Verify options are visible
    const options = modal.locator('.check-selector-option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
  });

  test('check selector search filters options', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Open dropdown
    await modal.locator('.check-selector-toggle').click();
    await expect(modal.locator('.check-selector-menu.open')).toBeVisible();

    // Type in search to filter
    await modal.locator('.check-selector-search input').fill('License');
    await page.waitForTimeout(100);

    // Verify only matching options are visible
    const visibleOptions = modal.locator('.check-selector-option:visible');
    const count = await visibleOptions.count();
    expect(count).toBeLessThan(13); // Should filter down from all options
  });

  test('check selector changes update the dashboard', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Get initial check name from toggle button
    const initialCheckName = await modal.locator('.check-selector-text').textContent();

    // Open dropdown and select second option
    await modal.locator('.check-selector-toggle').click();
    await modal.locator('.check-selector-option').nth(1).click();
    await page.waitForTimeout(300);

    // Verify dropdown closed
    await expect(modal.locator('.check-selector-menu.open')).not.toBeVisible();

    // Verify the selection changed
    const newCheckName = await modal.locator('.check-selector-text').textContent();
    expect(newCheckName).not.toBe(initialCheckName);

    // Verify the description box updated
    const descriptionTitle = await modal.locator('.check-description-box strong').textContent();
    expect(descriptionTitle).toBe(newCheckName);
  });

  test('clicking outside closes dropdown', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Open dropdown
    await modal.locator('.check-selector-toggle').click();
    await expect(modal.locator('.check-selector-menu.open')).toBeVisible();

    // Click outside (on the table)
    await modal.locator('.adoption-table').click();

    // Verify dropdown closed
    await expect(modal.locator('.check-selector-menu.open')).not.toBeVisible();
  });

  test('description box displays check information', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Verify description box exists
    const descBox = modal.locator('.check-description-box');
    await expect(descBox).toBeVisible();

    // Verify it has a title
    await expect(descBox.locator('strong')).toBeVisible();

    // Verify it has a description paragraph
    await expect(descBox.locator('p')).toBeVisible();
  });

  test('table displays teams with progress bars', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Verify table exists
    const table = modal.locator('.adoption-table');
    await expect(table).toBeVisible();

    // Verify header row has correct columns (5 including Excl. column)
    const headers = table.locator('thead th');
    await expect(headers).toHaveCount(5);

    // Verify headers text
    await expect(headers.nth(0)).toContainText('Team');
    await expect(headers.nth(1)).toContainText('Adoption');
    await expect(headers.nth(2)).toContainText('Progress');
    await expect(headers.nth(3)).toContainText('Passing');
    await expect(headers.nth(4)).toContainText('Excl.');

    // Verify at least one data row exists
    const rows = modal.locator('.adoption-row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Verify progress bar exists in first row
    await expect(rows.first().locator('.progress-bar-inline')).toBeVisible();
  });

  test('table sorting works for Team column', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Click on Team header to sort
    await modal.locator('.adoption-table th:has-text("Team")').click();
    await page.waitForTimeout(300);

    // Verify sort indicator appears
    const teamHeader = modal.locator('.adoption-table th:has-text("Team")');
    const sortIndicator = await teamHeader.locator('.sort-indicator').textContent();
    expect(sortIndicator).toMatch(/[↑↓]/);
  });

  test('table sorting works for Adoption column', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Click on Adoption header to sort (should be default sorted)
    await modal.locator('.adoption-table th:has-text("Adoption")').click();
    await page.waitForTimeout(300);

    // Verify sort indicator changes
    const adoptionHeader = modal.locator('.adoption-table th:has-text("Adoption")');
    const sortIndicator = await adoptionHeader.locator('.sort-indicator').textContent();
    expect(sortIndicator).toMatch(/[↑↓]/);

    // Click again to reverse sort
    await modal.locator('.adoption-table th:has-text("Adoption")').click();
    await page.waitForTimeout(300);

    // Verify sort indicator changed direction
    const newSortIndicator = await adoptionHeader.locator('.sort-indicator').textContent();
    expect(newSortIndicator).toMatch(/[↑↓]/);
    expect(newSortIndicator).not.toBe(sortIndicator);
  });

  test('clicking team row opens team detail modal', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Find a team row that is not "No Team"
    const teamRow = modal.locator('.adoption-row:not(.no-team)').first();

    // Check if such a row exists
    if (await teamRow.count() > 0) {
      await teamRow.click();
      await page.waitForTimeout(300);

      // Verify team modal opens
      await expect(page.locator('#team-modal')).toBeVisible();
    }
  });

  test('close button closes modal', async ({ page }) => {
    // Use helper function
    await closeCheckAdoptionModal(page);

    // Verify modal is hidden
    await expect(page.locator('#check-adoption-modal')).toBeHidden();
  });

  test('Escape key closes modal', async ({ page }) => {
    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify modal is hidden
    await expect(page.locator('#check-adoption-modal')).toBeHidden();
  });

  test('No Team row has distinct styling', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Find No Team row
    const noTeamRow = modal.locator('.adoption-row:has-text("No Team")');

    // Check if it exists in the test data
    if (await noTeamRow.count() > 0) {
      // Verify it has the no-team class
      await expect(noTeamRow).toHaveClass(/no-team/);
    }
  });

  test('progress bar shows correctly for 0% adoption', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Look for a row with 0% in the adoption cell specifically (not Excl. column)
    const zeroPercentRow = modal.locator('.adoption-row').filter({
      has: page.locator('.adoption-cell', { hasText: /^0%$/ })
    });

    // If such a row exists, verify the progress fill has the 'none' class
    if (await zeroPercentRow.count() > 0) {
      const progressFill = zeroPercentRow.first().locator('.progress-fill');
      await expect(progressFill).toHaveClass(/none/);
    }
  });

  test('modal header has proper styling', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Verify header is visible with proper structure
    await expect(modal.locator('h2')).toBeVisible();

    // Verify close button is visible
    await expect(modal.getByRole('button', { name: 'Close modal' })).toBeVisible();
  });

  test('modal body contains dashboard content', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Verify modal has content
    await expect(modal.locator('.adoption-stats-row')).toBeVisible();
    await expect(modal.locator('.adoption-table')).toBeVisible();
  });
});

test.describe('Check Adoption Dashboard - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Enable dark mode
    const darkModeToggle = page.locator('button[aria-label="Toggle night mode"]');
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(300);
    }

    // Open the Check Adoption Dashboard
    await openCheckAdoptionDashboard(page);
  });

  test('modal is visible and functional in dark mode', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Verify modal is visible
    await expect(modal).toBeVisible();

    // Verify key elements are still visible
    await expect(modal.locator('h2')).toBeVisible();
    await expect(modal.locator('.adoption-stats-row')).toBeVisible();
    await expect(modal.locator('.adoption-table')).toBeVisible();

    // Verify close button works
    await closeCheckAdoptionModal(page);
    await expect(page.locator('#check-adoption-modal')).toBeHidden();
  });
});
