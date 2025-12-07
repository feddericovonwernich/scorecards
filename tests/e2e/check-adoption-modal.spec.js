import { test, expect } from './coverage.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openCheckAdoptionDashboard,
  closeCheckAdoptionModal,
  switchToTeamsView,
  openTeamModal,
} from './test-helper.js';

// ============================================================================
// CHECK ADOPTION DASHBOARD - Modal Structure
// ============================================================================

test.describe('Check Adoption Dashboard - Modal Structure', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should open modal with correct structure and close via X button and Escape key', async ({ page }) => {
    await openCheckAdoptionDashboard(page);

    const modal = page.locator('#check-adoption-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Check Adoption|Adoption/i);
    await expect(modal.locator('h2')).toContainText('Check Adoption Dashboard');
    await expect(modal.getByRole('button', { name: 'Close modal' })).toBeVisible();

    // Check selector
    const hasSelector = await modal.locator('button, select').filter({ hasText: /README|Documentation|License|Select/i }).count() > 0;
    expect(hasSelector).toBe(true);

    // Adoption rate
    await expect(modal).toContainText(/\d+%|Adoption/i);
    await expect(modal).toContainText(/Passing|pass/i);
    await expect(modal).toContainText(/Failing|fail/i);

    // Close with X button
    await closeCheckAdoptionModal(page);
    await expect(modal).not.toBeVisible();

    // Reopen and close with Escape
    await openCheckAdoptionDashboard(page);
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('displays overall stats with correct styling', async ({ page }) => {
    await openCheckAdoptionDashboard(page);
    const modal = page.locator('#check-adoption-modal');
    const statsRow = modal.locator('.adoption-stats-row');
    await expect(statsRow).toBeVisible();

    const statCards = modal.locator('.adoption-stat-card');
    expect(await statCards.count()).toBeGreaterThanOrEqual(2);

    await expect(modal.locator('.adoption-stat-value').first()).toBeVisible();
    await expect(modal.locator('.adoption-stat-label').first()).toBeVisible();
  });
});

// ============================================================================
// CHECK ADOPTION DASHBOARD - Check Selector
// ============================================================================

test.describe('Check Adoption Dashboard - Check Selector', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await openCheckAdoptionDashboard(page);
  });

  test('should interact with check selector through complete workflow - open, search, select, and dismiss', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');
    const toggle = modal.locator('.check-card-selected');

    // Dropdown is visible and functional
    await toggle.click();
    await expect(toggle).toBeVisible();
    await expect(modal.locator('.check-card-dropdown.open')).toBeVisible();
    await expect(modal.locator('.check-card-search input')).toBeVisible();

    const options = modal.locator('.check-card-option');
    expect(await options.count()).toBeGreaterThan(0);

    // Search filters options
    const searchInput = modal.locator('.check-card-search input');
    await searchInput.fill('README');
    await expect(async () => {
      const visibleOptions = modal.locator('.check-card-option:visible');
      expect(await visibleOptions.count()).toBeLessThan(13);
    }).toPass({ timeout: 3000 });

    // Clear search
    await searchInput.clear();

    // Changes update the dashboard
    const initialCheckName = await modal.locator('.check-card-selected .check-card-name').textContent();
    await modal.locator('.check-card-option').nth(1).click();
    await expect(modal.locator('.check-card-dropdown.open')).not.toBeVisible();

    const newCheckName = await modal.locator('.check-card-selected .check-card-name').textContent();
    expect(newCheckName).not.toBe(initialCheckName);
    await expect(modal.locator('.check-card-selected .check-card-description')).toBeVisible();

    // Clicking outside closes dropdown
    await toggle.click();
    await expect(modal.locator('.check-card-dropdown.open')).toBeVisible();
    await modal.locator('.adoption-stats-row').click({ force: true });
    await expect(modal.locator('.check-card-dropdown.open')).not.toBeVisible();

    await closeCheckAdoptionModal(page);
  });
});

// ============================================================================
// CHECK ADOPTION DASHBOARD - Table
// ============================================================================

test.describe('Check Adoption Dashboard - Table', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await openCheckAdoptionDashboard(page);
  });

  test('should display table with correct structure and support column sorting', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');
    const table = modal.locator('.adoption-table');
    await expect(table).toBeVisible();

    // Verify header row has correct columns
    const headers = table.locator('thead th');
    await expect(headers).toHaveCount(5);
    await expect(headers.nth(0)).toContainText('Team');
    await expect(headers.nth(1)).toContainText('Adoption');
    await expect(headers.nth(2)).toContainText('Progress');
    await expect(headers.nth(3)).toContainText('Passing');
    await expect(headers.nth(4)).toContainText('Excl.');

    // Verify at least one data row exists with progress bar
    const rows = modal.locator('.adoption-row');
    expect(await rows.count()).toBeGreaterThan(0);
    await expect(rows.first().locator('.progress-bar-inline')).toBeVisible();

    // Test Team column sorting
    const teamHeader = modal.locator('.adoption-table th:has-text("Team")');
    await teamHeader.click();
    await expect(teamHeader.locator('.sort-indicator')).toBeVisible();

    // Test Adoption column sorting
    const adoptionHeader = modal.locator('.adoption-table th:has-text("Adoption")');
    await adoptionHeader.click();
    const sortIndicator = await adoptionHeader.locator('.sort-indicator').textContent();
    expect(sortIndicator).toMatch(/[↑↓]/);

    // Click again to reverse
    await adoptionHeader.click();
    await expect(async () => {
      const newSortIndicator = await adoptionHeader.locator('.sort-indicator').textContent();
      expect(newSortIndicator).not.toBe(sortIndicator);
    }).toPass({ timeout: 3000 });

    await closeCheckAdoptionModal(page);
  });

  test('clicking team row opens team detail modal', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    const teamRow = modal.locator('.adoption-row:not(.no-team)').first();
    if (await teamRow.count() > 0) {
      await teamRow.click();
      await expect(page.locator('#team-modal')).toBeVisible();
    }
  });

  test('No Team row has distinct styling', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');
    const noTeamRow = modal.locator('.adoption-row:has-text("No Team")');

    if (await noTeamRow.count() > 0) {
      await expect(noTeamRow).toHaveClass(/no-team/);
    }
  });

  test('progress bar shows correctly for 0% adoption', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    const zeroPercentRow = modal.locator('.adoption-row').filter({
      has: page.locator('.adoption-cell', { hasText: /^0%$/ })
    });

    if (await zeroPercentRow.count() > 0) {
      const progressFill = zeroPercentRow.first().locator('.progress-fill');
      await expect(progressFill).toHaveClass(/none/);
    }
  });
});

// ============================================================================
// CHECK ADOPTION - Exclusion Feature
// ============================================================================

test.describe('Check Adoption - Exclusion Feature', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await openCheckAdoptionDashboard(page);
  });

  test('should display exclusion data correctly in stats, table rows, and handle teams without exclusions', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Select OpenAPI Specification check which has exclusions
    await modal.locator('.check-card-selected').click();
    await modal.locator('.check-card-search input').fill('OpenAPI Spec');
    await expect(modal.locator('.check-card-option:visible').first()).toBeVisible();
    await modal.locator('.check-card-option:visible').first().click();

    // Excluded stat card appears
    const excludedStatCard = modal.locator('.adoption-stat-card.excluded');
    await expect(excludedStatCard).toBeVisible();
    await expect(excludedStatCard.locator('.adoption-stat-label')).toContainText('Excluded');

    // Excluded count in table rows
    const frontendRow = modal.locator('.adoption-row').filter({ hasText: 'frontend' });
    if (await frontendRow.count() > 0) {
      const excludedCell = frontendRow.locator('.adoption-cell.has-excluded');
      await expect(excludedCell).toBeVisible();

      const excludedCount = excludedCell.locator('.excluded-count');
      await expect(excludedCount).toBeVisible();
      expect(await excludedCount.textContent()).not.toBe('—');
    }

    // Teams without exclusions show dash
    await expect(modal.locator('.adoption-table')).toBeVisible();
    const rows = modal.locator('.adoption-row');
    await expect(rows.first()).toBeVisible({ timeout: 5000 });

    // Services Passing with active count
    const servicesPassingCard = modal.locator('.adoption-stat-card').filter({ hasText: 'Services Passing' });
    await expect(servicesPassingCard).toBeVisible();
    const value = await servicesPassingCard.locator('.adoption-stat-value').textContent();
    expect(value).toMatch(/^\d+\/\d+$/);

    await closeCheckAdoptionModal(page);
  });
});

// ============================================================================
// TEAM MODAL - Check Adoption with Exclusions
// ============================================================================

test.describe('Team Modal - Check Adoption with Exclusions', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await switchToTeamsView(page);
    await openTeamModal(page, 'frontend');
  });

  test('should display check adoption tab with exclusions, styling, and percentage calculation', async ({ page }) => {
    const modal = page.locator('#team-modal');
    const checkAdoptionTab = modal.getByRole('button', { name: 'Check Adoption' });
    await checkAdoptionTab.click();

    await expect(modal.locator('.tab-content, [class*="tab-content"]')).toBeVisible();

    // Select a check that has exclusions
    const checkSelect = modal.locator('#team-check-select');
    if (await checkSelect.isVisible()) {
      await checkSelect.selectOption({ label: 'OpenAPI Specification' });
    }

    await expect(modal.locator('.adoption-lists, .adoption-percentage')).toBeVisible();

    // Verify three-column layout when exclusions exist
    const adoptionLists = modal.locator('.adoption-lists');
    if (await adoptionLists.isVisible()) {
      const excludedList = modal.locator('.adoption-list-excluded');
      if (await excludedList.count() > 0) {
        const hasThreeColumns = await adoptionLists.evaluate(el => el.classList.contains('three-columns'));
        expect(hasThreeColumns).toBe(true);

        // Excluded services with styling
        const excludedItems = modal.locator('.adoption-service-item.excluded');
        await expect(excludedItems.first()).toBeVisible();
        await expect(excludedItems.first()).toHaveClass(/excluded/);

        // Exclusion reason
        const exclusionReason = modal.locator('.exclusion-reason');
        await expect(exclusionReason.first()).toBeVisible();
      }
    }

    // Adoption percentage
    const adoptionPercentage = modal.locator('.adoption-percentage');
    if (await adoptionPercentage.isVisible()) {
      const text = await adoptionPercentage.textContent();
      expect(text).toMatch(/\d+%/);
    }
  });
});

// ============================================================================
// CHECK ADOPTION - Dark Mode
// ============================================================================

test.describe('Check Adoption - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should display modal and exclusions correctly in dark mode', async ({ page }) => {
    // Enable dark mode
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });
    await themeToggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await openCheckAdoptionDashboard(page);
    const modal = page.locator('#check-adoption-modal');

    // Modal visible and functional
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toBeVisible();
    await expect(modal.locator('.adoption-stats-row')).toBeVisible();
    await expect(modal.locator('.adoption-table')).toBeVisible();

    // Select a check with exclusions to test exclusion styling
    await modal.locator('.check-card-selected').click();
    await modal.locator('.check-card-search input').fill('OpenAPI Spec');
    await expect(modal.locator('.check-card-option:visible').first()).toBeVisible();
    await modal.locator('.check-card-option:visible').first().click();

    // Exclusion styling visible
    const excludedStatCard = modal.locator('.adoption-stat-card.excluded');
    await expect(excludedStatCard).toBeVisible();

    const excludedCells = modal.locator('.adoption-cell.has-excluded');
    await expect(excludedCells.first()).toBeVisible();

    // Close and verify
    await closeCheckAdoptionModal(page);
    await expect(modal).toBeHidden();
  });
});
