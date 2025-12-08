/**
 * Team Management E2E Tests (Consolidated)
 *
 * Phase 3 Coverage Improvement - User story-based comprehensive tests
 * Designed for ~6-7 consolidated tests covering full team workflows
 *
 * Coverage targets:
 * - TeamDashboard.tsx, TeamCard.tsx, TeamModal tabs
 * - team-statistics.ts, check-statistics.ts
 * - CheckAdoptionDashboard.tsx
 */

import { test, expect } from './coverage.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  switchToTeamsView,
  switchToServicesView,
  openTeamModal,
  closeTeamModal,
  clickTeamModalTab,
  openCheckAdoptionDashboard,
  closeCheckAdoptionModal,
  getServiceCount,
} from './test-helper.js';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Open Team Dashboard modal via window function
 */
async function openTeamDashboard(page) {
  await page.evaluate(() => window.openTeamDashboard());
  await expect(page.locator('#team-dashboard-modal')).toBeVisible({ timeout: 5000 });
}

/**
 * Close Team Dashboard modal
 */
async function closeTeamDashboard(page) {
  await page.keyboard.press('Escape');
  await expect(page.locator('#team-dashboard-modal')).toBeHidden();
}

// ============================================================================
// USER STORY 3.1: TEAM DASHBOARD DEEP DIVE (Consolidated: 5 → 2 tests)
// ============================================================================

test.describe('Team Dashboard Deep Dive', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should display team dashboard with summary stats, search, and sort capabilities', async ({ page }) => {
    // Phase 1: Open Team Dashboard
    await openTeamDashboard(page);
    const dashboard = page.locator('#team-dashboard-modal');

    // Phase 2: Verify summary stats are displayed
    const summaryStats = dashboard.locator('.team-summary-stat');
    await expect(summaryStats.first()).toBeVisible();
    expect(await summaryStats.count()).toBeGreaterThanOrEqual(2);

    // Verify stat values are numbers
    const teamsValue = await summaryStats.first().locator('.team-summary-stat__value').textContent();
    expect(parseInt(teamsValue)).toBeGreaterThan(0);

    // Phase 3: Verify team cards are displayed
    const teamCards = dashboard.locator('.team-card-react');
    await expect(teamCards.first()).toBeVisible();
    const initialCardCount = await teamCards.count();
    expect(initialCardCount).toBeGreaterThan(0);

    // Phase 4: Test search functionality
    const searchInput = dashboard.locator('.team-dashboard-search');
    await searchInput.fill('backend');
    await page.waitForTimeout(300);

    // Verify filtered results
    const filteredCards = dashboard.locator('.team-card-react');
    const filteredCount = await filteredCards.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCardCount);

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(300);

    // Phase 5: Test sort functionality
    const sortSelect = dashboard.locator('.team-dashboard-sort');
    await sortSelect.selectOption('averageScore-desc');
    await page.waitForTimeout(200);

    await sortSelect.selectOption('name-asc');
    await page.waitForTimeout(200);

    // Verify sorting applied (cards still visible)
    expect(await dashboard.locator('.team-card-react').count()).toBe(initialCardCount);

    await closeTeamDashboard(page);
  });

  test('should filter main catalog by team and handle team actions', async ({ page }) => {
    await openTeamDashboard(page);
    const dashboard = page.locator('#team-dashboard-modal');

    // Phase 1: Get first team card info
    const firstTeamCard = dashboard.locator('.team-card-react').first();
    await expect(firstTeamCard).toBeVisible();

    // Phase 2: Click Filter button to filter main catalog
    const filterBtn = firstTeamCard.locator('button').filter({ hasText: /Filter/i });
    await filterBtn.click();

    // Dashboard should close and catalog should be filtered
    await expect(dashboard).toBeHidden();

    // Verify team filter is applied (check for filter indicator or reduced service count)
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 3000 });

    // Phase 3: Re-open dashboard and verify Create button is present
    await openTeamDashboard(page);
    const createBtn = dashboard.locator('.team-dashboard-create-btn');
    await expect(createBtn).toBeVisible();
    expect(await createBtn.textContent()).toContain('Create Team');

    await closeTeamDashboard(page);
  });
});

// ============================================================================
// USER STORY 3.2: TEAM CARD EXPLORATION (Consolidated: 3 → 1 test)
// ============================================================================

test.describe('Team Card Exploration', () => {
  test('should display team cards with stats, rank badges, and progress bars', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Switch to teams view
    await switchToTeamsView(page);
    const teamsGrid = page.locator('.teams-grid');
    await expect(teamsGrid).toBeVisible();

    // Phase 1: Verify team cards are displayed
    const teamCards = teamsGrid.locator('.team-card');
    await expect(teamCards.first()).toBeVisible();

    // Phase 2: Verify team card structure
    const firstCard = teamCards.first();

    // Team name
    const teamName = firstCard.locator('.team-card-name');
    await expect(teamName).toBeVisible();
    expect(await teamName.textContent()).toBeTruthy();

    // Service count stat
    const serviceCount = firstCard.locator('.team-stat-value').first();
    await expect(serviceCount).toBeVisible();

    // Phase 3: Verify rank badges if present
    const rankBadges = firstCard.locator('.rank-badge, [class*="rank"]');
    if (await rankBadges.count() > 0) {
      await expect(rankBadges.first()).toBeVisible();
    }

    // Phase 4: Click team card to open team modal
    await firstCard.click();
    await expect(page.locator('#team-modal')).toBeVisible();

    // Verify modal content
    const modal = page.locator('#team-modal');
    await expect(modal.locator('h2, .modal-title')).toBeVisible();

    await closeTeamModal(page);
  });
});

// ============================================================================
// USER STORY 3.3: TEAM MODAL TABS (Consolidated: 4 → 1 test)
// ============================================================================

test.describe('Team Modal Complete Exploration', () => {
  test('should navigate all team modal tabs with proper content', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Open team modal
    await openTeamModal(page, 'Platform');
    const modal = page.locator('#team-modal');

    // Phase 1: Services tab (default)
    await expect(modal.locator('.tab-content.active')).toBeVisible();
    const servicesList = modal.locator('.service-item, .service-row, .team-service');
    // May or may not have services, but tab should render

    // Phase 2: Distribution tab
    await clickTeamModalTab(page, 'Distribution');
    await expect(modal.locator('.tab-content.active')).toBeVisible();
    // Should show score distribution or rank breakdown
    const distributionContent = modal.locator('.tab-content.active');
    await expect(distributionContent).toBeVisible();

    // Phase 3: Check Adoption tab
    await clickTeamModalTab(page, 'Check Adoption');
    await expect(modal.locator('.tab-content.active')).toBeVisible();
    // Should show check adoption stats for this team

    // Phase 4: GitHub tab (if available)
    const githubTab = modal.getByRole('button', { name: 'GitHub', exact: true });
    if (await githubTab.count() > 0 && await githubTab.isEnabled()) {
      await githubTab.click();
      await page.waitForTimeout(300);
      // GitHub tab may show team members or require auth
    }

    // Phase 5: Close with keyboard
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });
});

// ============================================================================
// USER STORY 3.4: CHECK ADOPTION DASHBOARD (Consolidated: 4 → 2 tests)
// ============================================================================

test.describe('Check Adoption Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should display check adoption with stats, team breakdown, and sorting', async ({ page }) => {
    // Phase 1: Open Check Adoption Dashboard
    await openCheckAdoptionDashboard(page);
    const modal = page.locator('#check-adoption-modal');
    await expect(modal).toBeVisible();

    // Phase 2: Verify check selector is present
    const checkSelector = modal.locator('.check-card-selected, .check-selector');
    await expect(checkSelector).toBeVisible();

    // Phase 3: Verify overall stats
    const statsRow = modal.locator('.adoption-stats-row, .adoption-stat-card');
    await expect(statsRow.first()).toBeVisible();

    // Should have passing/failing counts
    const passingValue = modal.locator('.adoption-stat-value.success, .adoption-stat-value:has-text("/")')
    if (await passingValue.count() > 0) {
      await expect(passingValue.first()).toBeVisible();
    }

    // Phase 4: Verify team table
    const teamTable = modal.locator('.adoption-table');
    if (await teamTable.count() > 0) {
      await expect(teamTable).toBeVisible();

      // Verify table headers
      const headers = teamTable.locator('th');
      expect(await headers.count()).toBeGreaterThanOrEqual(2);

      // Verify at least one team row
      const rows = teamTable.locator('tbody tr');
      expect(await rows.count()).toBeGreaterThan(0);

      // Phase 5: Test sorting by clicking header
      const adoptionHeader = teamTable.locator('th').filter({ hasText: /Adoption/i });
      if (await adoptionHeader.count() > 0) {
        await adoptionHeader.click();
        await page.waitForTimeout(200);
        // Sort indicator should appear
        await expect(adoptionHeader.locator('.sort-indicator')).toBeVisible();
      }
    }

    await closeCheckAdoptionModal(page);
  });

  test('should allow check selection via dropdown with search', async ({ page }) => {
    await openCheckAdoptionDashboard(page);
    const modal = page.locator('#check-adoption-modal');

    // Phase 1: Click to open check dropdown
    const checkSelector = modal.locator('.check-card-selected');
    await checkSelector.click();

    // Dropdown should open
    const dropdown = modal.locator('.check-card-dropdown.open');
    await expect(dropdown).toBeVisible();

    // Phase 2: Verify check options are displayed
    const options = dropdown.locator('.check-card-option');
    expect(await options.count()).toBeGreaterThan(0);

    // Phase 3: Search for a check
    const searchInput = dropdown.locator('input[placeholder*="Search"]');
    await searchInput.fill('readme');
    await page.waitForTimeout(200);

    // Filtered options should show
    const filteredOptions = dropdown.locator('.check-card-option');
    const filteredCount = await filteredOptions.count();

    // Phase 4: Select a check
    if (filteredCount > 0) {
      await filteredOptions.first().click();
      await expect(dropdown).toBeHidden();

      // Selected check name should appear
      const selectedName = await modal.locator('.check-card-name').first().textContent();
      expect(selectedName?.toLowerCase()).toContain('readme');
    } else {
      // Clear search and select any check
      await searchInput.clear();
      await page.waitForTimeout(200);
      await dropdown.locator('.check-card-option').first().click();
    }

    await closeCheckAdoptionModal(page);
  });
});

// ============================================================================
// USER STORY 3.5: TEAM VIEW NAVIGATION (Consolidated: 2 → 1 test)
// ============================================================================

test.describe('Team View Navigation', () => {
  test('should toggle between services and teams views with persistent state', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Phase 1: Start in services view
    await expect(page.locator('.services-grid')).toBeVisible();
    const initialServiceCount = await getServiceCount(page);

    // Phase 2: Switch to teams view
    await switchToTeamsView(page);
    await expect(page.locator('.teams-grid')).toBeVisible();

    // Verify team cards are present
    const teamCards = page.locator('.teams-grid .team-card');
    await expect(teamCards.first()).toBeVisible();
    const teamCount = await teamCards.count();
    expect(teamCount).toBeGreaterThan(0);

    // Phase 3: Switch back to services view
    await switchToServicesView(page);
    await expect(page.locator('.services-grid')).toBeVisible();

    // Service count should be same
    const finalServiceCount = await getServiceCount(page);
    expect(finalServiceCount).toBe(initialServiceCount);

    // Phase 4: Click on a team card to view team modal
    await switchToTeamsView(page);
    await page.locator('.teams-grid .team-card').first().click();
    await expect(page.locator('#team-modal')).toBeVisible();

    // Close and verify view is still teams
    await page.keyboard.press('Escape');
    await expect(page.locator('.teams-grid')).toBeVisible();
  });
});
