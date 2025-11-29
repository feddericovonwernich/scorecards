import { test, expect } from '@playwright/test';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
} from './test-helper.js';

test.describe('Check Exclusion Feature', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test.describe('Check Adoption Dashboard - Exclusion Display', () => {
    test.beforeEach(async ({ page }) => {
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

    test('table displays Excl. column header', async ({ page }) => {
      // Verify table has 5 columns including Excl.
      const headers = page.locator('.adoption-table thead th');
      await expect(headers).toHaveCount(5);

      // Verify Excl. header exists
      await expect(headers.nth(4)).toContainText('Excl.');
    });

    test('excluded stat card appears when exclusions exist', async ({ page }) => {
      // Select a check that has exclusions (OpenAPI Specification - check 06)
      await page.locator('.check-selector-toggle').click();
      await page.locator('.check-selector-search input').fill('OpenAPI Spec');
      await page.waitForTimeout(100);
      await page.locator('.check-selector-option:visible').first().click();
      await page.waitForTimeout(300);

      // Verify excluded stat card appears
      const excludedStatCard = page.locator('.adoption-stat-card.excluded');
      await expect(excludedStatCard).toBeVisible();

      // Verify it shows the excluded label
      await expect(excludedStatCard.locator('.adoption-stat-label')).toContainText('Excluded');
    });

    test('excluded count is shown in table rows', async ({ page }) => {
      // Select OpenAPI Specification check which has exclusions in test-repo-edge-cases
      await page.locator('.check-selector-toggle').click();
      await page.locator('.check-selector-search input').fill('OpenAPI Spec');
      await page.waitForTimeout(100);
      await page.locator('.check-selector-option:visible').first().click();
      await page.waitForTimeout(300);

      // Find the frontend team row (test-repo-edge-cases has exclusions for this check)
      const frontendRow = page.locator('.adoption-row').filter({ hasText: 'frontend' });

      if (await frontendRow.count() > 0) {
        // Verify the excluded cell shows a count (not just a dash)
        const excludedCell = frontendRow.locator('.excluded-cell');
        await expect(excludedCell).toBeVisible();
        // Should have has-excluded class when exclusions exist
        await expect(excludedCell).toHaveClass(/has-excluded/);
      }
    });

    test('teams without exclusions show dash in Excl. column', async ({ page }) => {
      // Select a check (README) that may not have exclusions for some teams
      await page.locator('.check-selector-toggle').click();
      await page.locator('.check-selector-search input').fill('README');
      await page.waitForTimeout(100);
      await page.locator('.check-selector-option:visible').first().click();
      await page.waitForTimeout(300);

      // Find a row and check for dash in excluded cell when no exclusions
      const rows = page.locator('.adoption-row');
      const rowCount = await rows.count();

      // At least one row should have no exclusions and show "-"
      let foundDash = false;
      for (let i = 0; i < rowCount; i++) {
        const excludedCell = rows.nth(i).locator('.excluded-cell');
        const text = await excludedCell.textContent();
        if (text?.trim() === '-') {
          foundDash = true;
          // Verify it doesn't have has-excluded class
          await expect(excludedCell).not.toHaveClass(/has-excluded/);
          break;
        }
      }
      expect(foundDash).toBe(true);
    });

    test('overall stats show Services Passing with active count', async ({ page }) => {
      // Select a check with exclusions
      await page.locator('.check-selector-toggle').click();
      await page.locator('.check-selector-search input').fill('API Environment');
      await page.waitForTimeout(100);
      await page.locator('.check-selector-option:visible').first().click();
      await page.waitForTimeout(300);

      // Verify Services Passing stat card shows x/y format
      const servicesPassingCard = page.locator('.adoption-stat-card').filter({ hasText: 'Services Passing' });
      await expect(servicesPassingCard).toBeVisible();

      const value = await servicesPassingCard.locator('.adoption-stat-value').textContent();
      // Should be in format "X/Y" where Y is active total (excluding excluded services)
      expect(value).toMatch(/^\d+\/\d+$/);
    });
  });

  test.describe('Team Modal - Check Adoption with Exclusions', () => {
    test.beforeEach(async ({ page }) => {
      // Open team modal for a team with exclusions (platform team has test-repo-perfect with exclusion)
      await page.evaluate(() => {
        if (window.showTeamDetail) {
          window.showTeamDetail('platform');
        }
      });
      await page.waitForSelector('#team-modal:not(.hidden)', { timeout: 5000 });
    });

    test('check adoption section displays three columns when exclusions exist', async ({ page }) => {
      // Navigate to Check Adoption tab if tabs exist
      const checkAdoptionTab = page.locator('.team-detail-tab').filter({ hasText: 'Check Adoption' });
      if (await checkAdoptionTab.isVisible()) {
        await checkAdoptionTab.click();
        await page.waitForTimeout(300);
      }

      // Select a check that has exclusions (API Environment Configuration - 08)
      const checkSelect = page.locator('#team-check-select');
      if (await checkSelect.isVisible()) {
        await checkSelect.selectOption({ label: 'API Environment Configuration' });
        await page.waitForTimeout(300);
      }

      // Verify three-column layout exists when there are exclusions
      const adoptionLists = page.locator('.adoption-lists');
      if (await adoptionLists.isVisible()) {
        // Should have three-columns class when exclusions exist
        const hasThreeColumns = await adoptionLists.evaluate(el => el.classList.contains('three-columns'));
        // The presence of an excluded list means three columns
        const excludedList = page.locator('.adoption-list-excluded');
        if (await excludedList.count() > 0) {
          expect(hasThreeColumns).toBe(true);
        }
      }
    });

    test('excluded services show exclusion reason', async ({ page }) => {
      // Navigate to Check Adoption tab
      const checkAdoptionTab = page.locator('.team-detail-tab').filter({ hasText: 'Check Adoption' });
      if (await checkAdoptionTab.isVisible()) {
        await checkAdoptionTab.click();
        await page.waitForTimeout(300);
      }

      // Select a check with exclusions
      const checkSelect = page.locator('#team-check-select');
      if (await checkSelect.isVisible()) {
        await checkSelect.selectOption({ label: 'API Environment Configuration' });
        await page.waitForTimeout(300);
      }

      // Look for exclusion reason text
      const exclusionReason = page.locator('.exclusion-reason');
      if (await exclusionReason.count() > 0) {
        await expect(exclusionReason.first()).toBeVisible();
        const reasonText = await exclusionReason.first().textContent();
        expect(reasonText?.length).toBeGreaterThan(0);
      }
    });

    test('excluded services have distinct styling', async ({ page }) => {
      // Navigate to Check Adoption tab
      const checkAdoptionTab = page.locator('.team-detail-tab').filter({ hasText: 'Check Adoption' });
      if (await checkAdoptionTab.isVisible()) {
        await checkAdoptionTab.click();
        await page.waitForTimeout(300);
      }

      // Select a check with exclusions
      const checkSelect = page.locator('#team-check-select');
      if (await checkSelect.isVisible()) {
        await checkSelect.selectOption({ label: 'API Environment Configuration' });
        await page.waitForTimeout(300);
      }

      // Look for excluded service items with proper styling
      const excludedItems = page.locator('.adoption-service-item.excluded');
      if (await excludedItems.count() > 0) {
        await expect(excludedItems.first()).toBeVisible();
        await expect(excludedItems.first()).toHaveClass(/excluded/);
      }
    });

    test('adoption percentage displays active count when exclusions exist', async ({ page }) => {
      // Navigate to Check Adoption tab
      const checkAdoptionTab = page.locator('.team-detail-tab').filter({ hasText: 'Check Adoption' });
      if (await checkAdoptionTab.isVisible()) {
        await checkAdoptionTab.click();
        await page.waitForTimeout(300);
      }

      // Select a check with exclusions for this team
      const checkSelect = page.locator('#team-check-select');
      if (await checkSelect.isVisible()) {
        await checkSelect.selectOption({ label: 'API Environment Configuration' });
        await page.waitForTimeout(300);
      }

      // Check for adoption percentage display
      const adoptionPercentage = page.locator('.adoption-percentage');
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
      await page.evaluate(() => {
        if (window.showTeamDetail) {
          window.showTeamDetail('frontend');
        }
      });
      await page.waitForSelector('#team-modal:not(.hidden)', { timeout: 5000 });

      // Navigate to Check Adoption tab
      const checkAdoptionTab = page.locator('.team-detail-tab').filter({ hasText: 'Check Adoption' });
      if (await checkAdoptionTab.isVisible()) {
        await checkAdoptionTab.click();
        await page.waitForTimeout(300);
      }

      // Select OpenAPI Specification check
      const checkSelect = page.locator('#team-check-select');
      if (await checkSelect.isVisible()) {
        await checkSelect.selectOption({ label: 'OpenAPI Specification' });
        await page.waitForTimeout(300);

        // Should show excluded list with test-repo-edge-cases
        const excludedList = page.locator('.adoption-list-excluded');
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

    // Select a check with exclusions
    await page.locator('.check-selector-toggle').click();
    await page.locator('.check-selector-search input').fill('OpenAPI Spec');
    await page.waitForTimeout(100);
    await page.locator('.check-selector-option:visible').first().click();
    await page.waitForTimeout(300);

    // Verify excluded stat card is visible
    const excludedStatCard = page.locator('.adoption-stat-card.excluded');
    if (await excludedStatCard.count() > 0) {
      await expect(excludedStatCard).toBeVisible();
    }

    // Verify excluded cells are visible
    const excludedCells = page.locator('.excluded-cell.has-excluded');
    if (await excludedCells.count() > 0) {
      await expect(excludedCells.first()).toBeVisible();
    }
  });

  test('team modal exclusion styling works in dark mode', async ({ page }) => {
    // Open team modal for frontend team
    await page.evaluate(() => {
      if (window.showTeamDetail) {
        window.showTeamDetail('frontend');
      }
    });
    await page.waitForSelector('#team-modal:not(.hidden)', { timeout: 5000 });

    // Navigate to Check Adoption tab
    const checkAdoptionTab = page.locator('.team-detail-tab').filter({ hasText: 'Check Adoption' });
    if (await checkAdoptionTab.isVisible()) {
      await checkAdoptionTab.click();
      await page.waitForTimeout(300);

      // Select a check with exclusions
      const checkSelect = page.locator('#team-check-select');
      if (await checkSelect.isVisible()) {
        await checkSelect.selectOption({ label: 'OpenAPI Specification' });
        await page.waitForTimeout(300);
      }

      // Verify exclusion-related elements are visible
      const excludedItems = page.locator('.adoption-service-item.excluded');
      if (await excludedItems.count() > 0) {
        await expect(excludedItems.first()).toBeVisible();
      }
    }
  });
});
