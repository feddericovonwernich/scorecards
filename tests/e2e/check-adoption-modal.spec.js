import { test, expect } from '@playwright/test';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
} from './test-helper.js';

test.describe('Check Adoption Dashboard Modal', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Switch to Teams view and open the Check Adoption Dashboard
    await page.locator('.view-tab[data-view="teams"]').click();
    await page.waitForTimeout(500);

    // Open the Check Adoption Dashboard via the button in teams view
    const adoptionButton = page.locator('button:has-text("Check Adoption")');
    if (await adoptionButton.isVisible()) {
      await adoptionButton.click();
    } else {
      // Fallback: open via JavaScript
      await page.evaluate(() => {
        window.openCheckAdoptionDashboard(window.allServices || []);
      });
    }
    await page.waitForSelector('#check-adoption-modal:not(.hidden)', { timeout: 5000 });
  });

  test('modal opens with correct structure', async ({ page }) => {
    // Verify modal header exists with proper structure
    const modalHeader = page.locator('.check-adoption-modal-content .modal-header');
    await expect(modalHeader).toBeVisible();

    // Verify title
    await expect(modalHeader.locator('h2')).toHaveText('Check Adoption Dashboard');

    // Verify close button has SVG icon (not plain text)
    const closeButton = modalHeader.locator('.modal-close');
    await expect(closeButton).toBeVisible();
    await expect(closeButton.locator('svg')).toBeVisible();
  });

  test('displays overall stats with correct styling', async ({ page }) => {
    // Verify stats section exists
    const statsRow = page.locator('.adoption-stats-row');
    await expect(statsRow).toBeVisible();

    // Verify stat cards are present
    const statCards = page.locator('.adoption-stat-card');
    await expect(statCards).toHaveCount(2);

    // Verify stat values are visible
    await expect(page.locator('.adoption-stat-value').first()).toBeVisible();

    // Verify stat labels are visible
    await expect(page.locator('.adoption-stat-label').first()).toBeVisible();

    // Check for expected labels
    await expect(page.locator('.adoption-stat-label').filter({ hasText: 'Overall Adoption' })).toBeVisible();
    await expect(page.locator('.adoption-stat-label').filter({ hasText: 'Services Passing' })).toBeVisible();
  });

  test('check selector dropdown is visible and functional', async ({ page }) => {
    // Verify dropdown toggle button exists
    const toggle = page.locator('.check-selector-toggle');
    await expect(toggle).toBeVisible();

    // Verify label exists
    await expect(page.locator('.check-selector-large label')).toBeVisible();

    // Click toggle to open dropdown
    await toggle.click();

    // Verify menu is visible
    await expect(page.locator('.check-selector-menu.open')).toBeVisible();

    // Verify search input is visible
    await expect(page.locator('.check-selector-search input')).toBeVisible();

    // Verify options are visible
    const options = page.locator('.check-selector-option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
  });

  test('check selector search filters options', async ({ page }) => {
    // Open dropdown
    await page.locator('.check-selector-toggle').click();
    await expect(page.locator('.check-selector-menu.open')).toBeVisible();

    // Type in search to filter
    await page.locator('.check-selector-search input').fill('License');
    await page.waitForTimeout(100);

    // Verify only matching options are visible
    const visibleOptions = page.locator('.check-selector-option:visible');
    const count = await visibleOptions.count();
    expect(count).toBeLessThan(13); // Should filter down from all options
  });

  test('check selector changes update the dashboard', async ({ page }) => {
    // Get initial check name from toggle button
    const initialCheckName = await page.locator('.check-selector-text').textContent();

    // Open dropdown and select second option
    await page.locator('.check-selector-toggle').click();
    await page.locator('.check-selector-option').nth(1).click();
    await page.waitForTimeout(300);

    // Verify dropdown closed
    await expect(page.locator('.check-selector-menu.open')).not.toBeVisible();

    // Verify the selection changed
    const newCheckName = await page.locator('.check-selector-text').textContent();
    expect(newCheckName).not.toBe(initialCheckName);

    // Verify the description box updated
    const descriptionTitle = await page.locator('.check-description-box strong').textContent();
    expect(descriptionTitle).toBe(newCheckName);
  });

  test('clicking outside closes dropdown', async ({ page }) => {
    // Open dropdown
    await page.locator('.check-selector-toggle').click();
    await expect(page.locator('.check-selector-menu.open')).toBeVisible();

    // Click outside (on the table)
    await page.locator('.adoption-table').click();

    // Verify dropdown closed
    await expect(page.locator('.check-selector-menu.open')).not.toBeVisible();
  });

  test('description box displays check information', async ({ page }) => {
    // Verify description box exists
    const descBox = page.locator('.check-description-box');
    await expect(descBox).toBeVisible();

    // Verify it has a title
    await expect(descBox.locator('strong')).toBeVisible();

    // Verify it has a description paragraph
    await expect(descBox.locator('p')).toBeVisible();
  });

  test('table displays teams with progress bars', async ({ page }) => {
    // Verify table exists
    const table = page.locator('.adoption-table');
    await expect(table).toBeVisible();

    // Verify header row has correct columns
    const headers = table.locator('thead th');
    await expect(headers).toHaveCount(4);

    // Verify headers text
    await expect(headers.nth(0)).toContainText('Team');
    await expect(headers.nth(1)).toContainText('Adoption');
    await expect(headers.nth(2)).toContainText('Progress');
    await expect(headers.nth(3)).toContainText('Passing');

    // Verify at least one data row exists
    const rows = page.locator('.adoption-row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Verify progress bar exists in first row
    await expect(rows.first().locator('.progress-bar-inline')).toBeVisible();
  });

  test('table sorting works for Team column', async ({ page }) => {
    // Click on Team header to sort
    await page.locator('.adoption-table th:has-text("Team")').click();
    await page.waitForTimeout(300);

    // Verify sort indicator appears
    const teamHeader = page.locator('.adoption-table th:has-text("Team")');
    const sortIndicator = await teamHeader.locator('.sort-indicator').textContent();
    expect(sortIndicator).toMatch(/[↑↓]/);
  });

  test('table sorting works for Adoption column', async ({ page }) => {
    // Click on Adoption header to sort (should be default sorted)
    await page.locator('.adoption-table th:has-text("Adoption")').click();
    await page.waitForTimeout(300);

    // Verify sort indicator changes
    const adoptionHeader = page.locator('.adoption-table th:has-text("Adoption")');
    const sortIndicator = await adoptionHeader.locator('.sort-indicator').textContent();
    expect(sortIndicator).toMatch(/[↑↓]/);

    // Click again to reverse sort
    await page.locator('.adoption-table th:has-text("Adoption")').click();
    await page.waitForTimeout(300);

    // Verify sort indicator changed direction
    const newSortIndicator = await adoptionHeader.locator('.sort-indicator').textContent();
    expect(newSortIndicator).toMatch(/[↑↓]/);
    expect(newSortIndicator).not.toBe(sortIndicator);
  });

  test('clicking team row opens team detail modal', async ({ page }) => {
    // Find a team row that is not "No Team"
    const teamRow = page.locator('.adoption-row:not(.no-team)').first();

    // Check if such a row exists
    if (await teamRow.count() > 0) {
      await teamRow.click();
      await page.waitForTimeout(300);

      // Verify team modal opens (check adoption modal should close or team modal shows on top)
      await expect(page.locator('#team-modal:not(.hidden)')).toBeVisible();
    }
  });

  test('close button closes modal', async ({ page }) => {
    // Click close button
    await page.locator('.check-adoption-modal-content .modal-close').click();

    // Verify modal is hidden
    await expect(page.locator('#check-adoption-modal')).toHaveClass(/hidden/);
  });

  test('Escape key closes modal', async ({ page }) => {
    // Press Escape
    await page.keyboard.press('Escape');

    // Verify modal is hidden
    await expect(page.locator('#check-adoption-modal')).toHaveClass(/hidden/);
  });

  test('No Team row has distinct styling', async ({ page }) => {
    // Find No Team row
    const noTeamRow = page.locator('.adoption-row:has-text("No Team")');

    // Check if it exists in the test data
    if (await noTeamRow.count() > 0) {
      // Verify it has the no-team class
      await expect(noTeamRow).toHaveClass(/no-team/);
    }
  });

  test('progress bar shows correctly for 0% adoption', async ({ page }) => {
    // Look for a row with 0% adoption
    const zeroPercentRow = page.locator('.adoption-row').filter({ hasText: '0%' });

    // If such a row exists, verify the progress fill has the 'none' class
    if (await zeroPercentRow.count() > 0) {
      const progressFill = zeroPercentRow.first().locator('.progress-fill');
      await expect(progressFill).toHaveClass(/none/);
    }
  });

  test('modal header has proper styling', async ({ page }) => {
    const modalHeader = page.locator('.check-adoption-modal-content .modal-header');

    // Verify header is visible with proper structure
    await expect(modalHeader).toBeVisible();

    // Verify h2 is inside header
    await expect(modalHeader.locator('h2')).toBeVisible();

    // Verify close button is inside header
    await expect(modalHeader.locator('.modal-close')).toBeVisible();
  });

  test('modal body contains dashboard content', async ({ page }) => {
    const modalBody = page.locator('.check-adoption-modal-content .modal-body');
    await expect(modalBody).toBeVisible();

    // Verify dashboard content is inside modal body
    await expect(modalBody.locator('#check-adoption-dashboard-content')).toBeVisible();
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

    // Switch to Teams view and open the Check Adoption Dashboard
    await page.locator('.view-tab[data-view="teams"]').click();
    await page.waitForTimeout(500);

    // Open the Check Adoption Dashboard
    const adoptionButton = page.locator('button:has-text("Check Adoption")');
    if (await adoptionButton.isVisible()) {
      await adoptionButton.click();
    } else {
      await page.evaluate(() => {
        window.openCheckAdoptionDashboard(window.allServices || []);
      });
    }
    await page.waitForSelector('#check-adoption-modal:not(.hidden)', { timeout: 5000 });
  });

  test('modal is visible and functional in dark mode', async ({ page }) => {
    // Verify modal is visible
    await expect(page.locator('.check-adoption-modal-content')).toBeVisible();

    // Verify key elements are still visible
    await expect(page.locator('.modal-header h2')).toBeVisible();
    await expect(page.locator('.adoption-stats-row')).toBeVisible();
    await expect(page.locator('.adoption-table')).toBeVisible();

    // Verify close button works
    await page.locator('.check-adoption-modal-content .modal-close').click();
    await expect(page.locator('#check-adoption-modal')).toHaveClass(/hidden/);
  });
});
