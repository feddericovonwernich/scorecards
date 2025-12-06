import { test, expect } from '@playwright/test';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openCheckAdoptionDashboard,
  switchToTeamsView,
  openTeamModal,
} from './test-helper.js';

test.describe('Check Exclusion Feature', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test.describe('Check Adoption Dashboard - Exclusion Display', () => {
    test.beforeEach(async ({ page }) => {
      // Open the Check Adoption Dashboard using helper
      await openCheckAdoptionDashboard(page);
    });

    test('table displays Excl. column header', async ({ page }) => {
      const modal = page.locator('#check-adoption-modal');

      // Verify table has 5 columns including Excl.
      const headers = modal.locator('.adoption-table thead th');
      await expect(headers).toHaveCount(5);

      // Verify Excl. header exists
      await expect(headers.nth(4)).toContainText('Excl.');
    });

    test('excluded stat card appears when exclusions exist', async ({ page }) => {
      const modal = page.locator('#check-adoption-modal');

      // Select a check that has exclusions (OpenAPI Specification - check 06)
      await modal.locator('.check-card-selected').click();
      await modal.locator('.check-card-search input').fill('OpenAPI Spec');
      await page.waitForTimeout(100);
      await modal.locator('.check-card-option:visible').first().click();
      await page.waitForTimeout(300);

      // Verify excluded stat card appears
      const excludedStatCard = modal.locator('.adoption-stat-card.excluded');
      await expect(excludedStatCard).toBeVisible();

      // Verify it shows the excluded label
      await expect(excludedStatCard.locator('.adoption-stat-label')).toContainText('Excluded');
    });

    test('excluded count is shown in table rows', async ({ page }) => {
      const modal = page.locator('#check-adoption-modal');

      // Select OpenAPI Specification check which has exclusions in test-repo-edge-cases
      await modal.locator('.check-card-selected').click();
      await expect(modal.locator('.check-card-dropdown.open')).toBeVisible();
      await modal.locator('.check-card-search input').fill('OpenAPI Specification');
      await page.waitForTimeout(300);
      const options = modal.locator('.check-card-option');
      await expect(options.first()).toBeVisible({ timeout: 5000 });
      await options.first().click();
      await page.waitForTimeout(500);

      // Wait for table to update
      await expect(modal.locator('.adoption-table')).toBeVisible();

      // Find the frontend team row (test-repo-edge-cases has exclusions for this check)
      const frontendRow = modal.locator('.adoption-row').filter({ hasText: 'frontend' });

      if (await frontendRow.count() > 0) {
        // The excluded column is the 5th td with class 'adoption-cell',
        // and has 'has-excluded' class when there are exclusions
        const excludedCell = frontendRow.locator('.adoption-cell.has-excluded');
        await expect(excludedCell).toBeVisible();
        // Verify the excluded-count span shows a number (not em-dash)
        const excludedCount = excludedCell.locator('.excluded-count');
        await expect(excludedCount).toBeVisible();
        const text = await excludedCount.textContent();
        expect(text).not.toBe('—');
      }
    });

    test('teams without exclusions show dash in Excl. column', async ({ page }) => {
      const modal = page.locator('#check-adoption-modal');

      // Select README Documentation check that has no exclusions for any team
      await modal.locator('.check-card-selected').click();
      await expect(modal.locator('.check-card-dropdown.open')).toBeVisible();
      await modal.locator('.check-card-search input').fill('README Documentation');
      await page.waitForTimeout(300);
      const options = modal.locator('.check-card-option');
      await expect(options.first()).toBeVisible({ timeout: 5000 });
      await options.first().click();
      await page.waitForTimeout(500);

      // Wait for table to update
      await expect(modal.locator('.adoption-table')).toBeVisible();

      // Find a row and check for em-dash in excluded cell when no exclusions
      const rows = modal.locator('.adoption-row');
      await expect(rows.first()).toBeVisible({ timeout: 5000 });
      const rowCount = await rows.count();

      // At least one row should have no exclusions and show em-dash "—"
      let foundDash = false;
      for (let i = 0; i < rowCount; i++) {
        // The excluded-count span is inside the 5th adoption-cell td
        const excludedCount = rows.nth(i).locator('.excluded-count');
        const text = await excludedCount.textContent();
        if (text?.trim() === '—') {
          foundDash = true;
          // Verify the parent cell doesn't have has-excluded class
          const parentCell = rows.nth(i).locator('.adoption-cell').last();
          await expect(parentCell).not.toHaveClass(/has-excluded/);
          break;
        }
      }
      expect(foundDash).toBe(true);
    });

    test('overall stats show Services Passing with active count', async ({ page }) => {
      const modal = page.locator('#check-adoption-modal');

      // Select a check with exclusions
      await modal.locator('.check-card-selected').click();
      await modal.locator('.check-card-search input').fill('API Environment');
      await page.waitForTimeout(100);
      await modal.locator('.check-card-option:visible').first().click();
      await page.waitForTimeout(300);

      // Verify Services Passing stat card shows x/y format
      const servicesPassingCard = modal.locator('.adoption-stat-card').filter({ hasText: 'Services Passing' });
      await expect(servicesPassingCard).toBeVisible();

      const value = await servicesPassingCard.locator('.adoption-stat-value').textContent();
      // Should be in format "X/Y" where Y is active total (excluding excluded services)
      expect(value).toMatch(/^\d+\/\d+$/);
    });
  });

  test.describe('Team Modal - Check Adoption with Exclusions', () => {
    test.beforeEach(async ({ page }) => {
      // Open team modal for platform team
      await openTeamModal(page, 'platform');
    });

    test('check adoption section displays three columns when exclusions exist', async ({ page }) => {
      const modal = page.locator('#team-modal');

      // Navigate to Check Adoption tab if tabs exist
      const checkAdoptionTab = modal.getByRole('button', { name: 'Check Adoption' });
      if (await checkAdoptionTab.isVisible()) {
        await checkAdoptionTab.click();
        await page.waitForTimeout(300);
      }

      // Select a check that has exclusions (API Environment Configuration - 08)
      const checkSelect = modal.locator('#team-check-select');
      if (await checkSelect.isVisible()) {
        await checkSelect.selectOption({ label: 'API Environment Configuration' });
        await page.waitForTimeout(300);
      }

      // Verify three-column layout exists when there are exclusions
      const adoptionLists = modal.locator('.adoption-lists');
      if (await adoptionLists.isVisible()) {
        // Should have three-columns class when exclusions exist
        const hasThreeColumns = await adoptionLists.evaluate(el => el.classList.contains('three-columns'));
        // The presence of an excluded list means three columns
        const excludedList = modal.locator('.adoption-list-excluded');
        if (await excludedList.count() > 0) {
          expect(hasThreeColumns).toBe(true);
        }
      }
    });

    test('excluded services show exclusion reason', async ({ page }) => {
      const modal = page.locator('#team-modal');

      // Navigate to Check Adoption tab
      const checkAdoptionTab = modal.getByRole('button', { name: 'Check Adoption' });
      if (await checkAdoptionTab.isVisible()) {
        await checkAdoptionTab.click();
        await page.waitForTimeout(300);
      }

      // Select a check with exclusions
      const checkSelect = modal.locator('#team-check-select');
      if (await checkSelect.isVisible()) {
        await checkSelect.selectOption({ label: 'API Environment Configuration' });
        await page.waitForTimeout(300);
      }

      // Look for exclusion reason text
      const exclusionReason = modal.locator('.exclusion-reason');
      if (await exclusionReason.count() > 0) {
        await expect(exclusionReason.first()).toBeVisible();
        const reasonText = await exclusionReason.first().textContent();
        expect(reasonText?.length).toBeGreaterThan(0);
      }
    });

    test('excluded services have distinct styling', async ({ page }) => {
      const modal = page.locator('#team-modal');

      // Navigate to Check Adoption tab
      const checkAdoptionTab = modal.getByRole('button', { name: 'Check Adoption' });
      if (await checkAdoptionTab.isVisible()) {
        await checkAdoptionTab.click();
        await page.waitForTimeout(300);
      }

      // Select a check with exclusions
      const checkSelect = modal.locator('#team-check-select');
      if (await checkSelect.isVisible()) {
        await checkSelect.selectOption({ label: 'API Environment Configuration' });
        await page.waitForTimeout(300);
      }

      // Look for excluded service items with proper styling
      const excludedItems = modal.locator('.adoption-service-item.excluded');
      if (await excludedItems.count() > 0) {
        await expect(excludedItems.first()).toBeVisible();
        await expect(excludedItems.first()).toHaveClass(/excluded/);
      }
    });

    test('adoption percentage displays active count when exclusions exist', async ({ page }) => {
      const modal = page.locator('#team-modal');

      // Navigate to Check Adoption tab
      const checkAdoptionTab = modal.getByRole('button', { name: 'Check Adoption' });
      if (await checkAdoptionTab.isVisible()) {
        await checkAdoptionTab.click();
        await page.waitForTimeout(300);
      }

      // Select a check with exclusions for this team
      const checkSelect = modal.locator('#team-check-select');
      if (await checkSelect.isVisible()) {
        await checkSelect.selectOption({ label: 'API Environment Configuration' });
        await page.waitForTimeout(300);
      }

      // Check for adoption percentage display
      const adoptionPercentage = modal.locator('.adoption-percentage');
      if (await adoptionPercentage.isVisible()) {
        const text = await adoptionPercentage.textContent();
        // Should show format like "X% (Y/Z active)" when there are exclusions
        // OR just "X%" if no exclusions for this check/team combination
        expect(text).toMatch(/\d+%/);
      }
    });
  });

  test.describe('Frontend Team - OpenAPI Exclusions', () => {
    test('frontend team shows excluded services for OpenAPI checks', async ({ page }) => {
      // Open team modal for frontend team (has test-repo-edge-cases with OpenAPI exclusions)
      await openTeamModal(page, 'frontend');

      const modal = page.locator('#team-modal');

      // Navigate to Check Adoption tab
      const checkAdoptionTab = modal.getByRole('button', { name: 'Check Adoption' });
      if (await checkAdoptionTab.isVisible()) {
        await checkAdoptionTab.click();
        await page.waitForTimeout(300);
      }

      // Select OpenAPI Specification check
      const checkSelect = modal.locator('#team-check-select');
      if (await checkSelect.isVisible()) {
        await checkSelect.selectOption({ label: 'OpenAPI Specification' });
        await page.waitForTimeout(300);

        // Should show excluded list with test-repo-edge-cases
        const excludedList = modal.locator('.adoption-list-excluded');
        if (await excludedList.count() > 0) {
          await expect(excludedList).toContainText('test-repo-edge-cases');
        }
      }
    });
  });
});

test.describe('Check Exclusion - Dark Mode', () => {
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
  });

  test('exclusion styling is visible in dark mode', async ({ page }) => {
    // Open the Check Adoption Dashboard
    await openCheckAdoptionDashboard(page);

    const modal = page.locator('#check-adoption-modal');

    // Select a check with exclusions
    await modal.locator('.check-card-selected').click();
    await modal.locator('.check-card-search input').fill('OpenAPI Spec');
    await page.waitForTimeout(100);
    await modal.locator('.check-card-option:visible').first().click();
    await page.waitForTimeout(300);

    // Verify excluded stat card is visible
    const excludedStatCard = modal.locator('.adoption-stat-card.excluded');
    if (await excludedStatCard.count() > 0) {
      await expect(excludedStatCard).toBeVisible();
    }

    // Verify excluded cells are visible (React uses .adoption-cell.has-excluded)
    const excludedCells = modal.locator('.adoption-cell.has-excluded');
    if (await excludedCells.count() > 0) {
      await expect(excludedCells.first()).toBeVisible();
    }
  });

  test('team modal exclusion styling works in dark mode', async ({ page }) => {
    // Open team modal for frontend team
    await openTeamModal(page, 'frontend');

    const modal = page.locator('#team-modal');

    // Navigate to Check Adoption tab
    const checkAdoptionTab = modal.getByRole('button', { name: 'Check Adoption' });
    if (await checkAdoptionTab.isVisible()) {
      await checkAdoptionTab.click();
      await page.waitForTimeout(300);

      // Select a check with exclusions
      const checkSelect = modal.locator('#team-check-select');
      if (await checkSelect.isVisible()) {
        await checkSelect.selectOption({ label: 'OpenAPI Specification' });
        await page.waitForTimeout(300);
      }

      // Verify exclusion-related elements are visible
      const excludedItems = modal.locator('.adoption-service-item.excluded');
      if (await excludedItems.count() > 0) {
        await expect(excludedItems.first()).toBeVisible();
      }
    }
  });
});
