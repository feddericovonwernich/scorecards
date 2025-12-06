import { test, expect } from '@playwright/test';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
  getVisibleServiceNames,
  switchToTeamsView,
  switchToServicesView,
  openTeamModal,
  closeTeamModal,
} from './test-helper.js';

test.describe('Team Features', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test.describe('Teams Tab Navigation', () => {
    test('should display Teams tab button', async ({ page }) => {
      // React Navigation uses [data-view="teams"] without .view-tab class
      const teamsTab = page.locator('[data-view="teams"]');
      await expect(teamsTab).toBeVisible();
      await expect(teamsTab).toContainText('Teams');
    });

    test('should switch to Teams view when clicking tab', async ({ page }) => {
      await switchToTeamsView(page);

      // React uses different view containers
      const teamsView = page.locator('.teams-grid, .team-card').first();
      await expect(teamsView).toBeVisible();
    });

    test('should show teams stats in Teams view', async ({ page }) => {
      await switchToTeamsView(page);

      // Verify Teams view stats section exists
      const teamsStats = page.locator('.teams-stats');
      await expect(teamsStats).toBeVisible();

      // Check for Total Teams stat
      await expect(teamsStats.locator('.stat-card').filter({ hasText: 'Total Teams' })).toBeVisible();
    });
  });

  test.describe('Team Filter', () => {
    test('should display team filter dropdown', async ({ page }) => {
      const teamFilter = page.locator('#team-filter-container, .team-filter-toggle').first();
      await expect(teamFilter).toBeVisible();
    });

    test('should show teams in dropdown', async ({ page }) => {
      // Click to open dropdown
      await page.locator('.team-filter-toggle').click();
      await expect(page.locator('.team-dropdown-menu')).toBeVisible();

      // Should show team options
      await expect(page.locator('.team-option').filter({ hasText: 'platform' })).toBeVisible();
      await expect(page.locator('.team-option').filter({ hasText: 'frontend' })).toBeVisible();
      await expect(page.locator('.team-option').filter({ hasText: 'backend' })).toBeVisible();
    });

    test('should filter services by team', async ({ page }) => {
      // Open dropdown and select frontend team
      await page.locator('.team-filter-toggle').click();
      await page.locator('.team-option').filter({ hasText: 'frontend' }).click();

      // Wait for filter to apply
      await page.waitForTimeout(300);

      // Should show only frontend services (test-repo-edge-cases, test-repo-javascript)
      const count = await getServiceCount(page);
      expect(count).toBe(2);

      const names = await getVisibleServiceNames(page);
      expect(names).toContain('test-repo-edge-cases');
      expect(names).toContain('test-repo-javascript');
    });

    test('should support multi-select team filter', async ({ page }) => {
      // Open dropdown and select multiple teams
      await page.locator('.team-filter-toggle').click();

      // Select frontend (dropdown stays open when clicking inside)
      await page.locator('.team-option').filter({ hasText: 'frontend' }).locator('input').click();

      // Select backend (dropdown still open, no need to click toggle again)
      await page.locator('.team-option').filter({ hasText: 'backend' }).locator('input').click();

      // Wait for filter to apply
      await page.waitForTimeout(300);

      // Should show frontend + backend services = 4
      const count = await getServiceCount(page);
      expect(count).toBe(4);
    });

    test('should clear team filter', async ({ page }) => {
      // First apply a filter
      await page.locator('.team-filter-toggle').click();
      await page.locator('.team-option').filter({ hasText: 'platform' }).locator('input').click();
      await page.waitForTimeout(300);

      // Verify filter applied (platform has 2 services)
      let count = await getServiceCount(page);
      expect(count).toBe(2);

      // Clear button should appear after selection (dropdown is still open)
      await expect(page.locator('.team-clear-btn')).toBeVisible();
      await page.locator('.team-clear-btn').click();
      await page.waitForTimeout(300);

      // Should show all services again
      count = await getServiceCount(page);
      expect(count).toBe(9);
    });
  });

  test.describe('Team Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Switch to teams view to see the team dashboard
      await switchToTeamsView(page);
    });

    test('should show team summary stats', async ({ page }) => {
      // Should show total teams count
      await expect(page.locator('.stat-card').filter({ hasText: 'Total Teams' })).toBeVisible();
    });

    test('should display team cards', async ({ page }) => {
      const teamCards = page.locator('.team-card');
      const count = await teamCards.count();
      expect(count).toBe(3);
    });

    test('should show team details in card', async ({ page }) => {
      const platformCard = page.locator('.team-card').filter({ hasText: 'platform' });
      await expect(platformCard).toBeVisible();

      // Should show service count
      await expect(platformCard.locator('.team-stat, .team-card-stat').filter({ hasText: /Services/i })).toBeVisible();
    });

    test('should search teams', async ({ page }) => {
      const searchInput = page.locator('.team-search, input[placeholder*="Search teams"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('front');
        await page.waitForTimeout(300);

        const teamCards = page.locator('.team-card');
        const count = await teamCards.count();
        expect(count).toBe(1);

        await expect(teamCards.first()).toContainText('frontend');
      }
    });

    test('should sort teams', async ({ page }) => {
      const sortSelect = page.locator('.team-sort-select, #teams-sort-select').first();
      if (await sortSelect.isVisible()) {
        // Sort by name A-Z
        await sortSelect.selectOption('name-asc');
        await page.waitForTimeout(300);

        const firstCard = page.locator('.team-card').first();
        await expect(firstCard).toContainText(/backend/i);
      }
    });

    test('should filter catalog when clicking Filter button', async ({ page }) => {
      // Click on a team card to open team modal
      await page.locator('.team-card').filter({ hasText: 'platform' }).click();
      await page.waitForTimeout(300);

      // If team modal opens, check for filter button
      const teamModal = page.locator('#team-modal');
      if (await teamModal.isVisible()) {
        const filterButton = teamModal.getByRole('button', { name: /Filter/i });
        if (await filterButton.isVisible()) {
          await filterButton.click();
          await page.waitForTimeout(300);

          // Services should be filtered to platform team
          await switchToServicesView(page);
          const count = await getServiceCount(page);
          expect(count).toBe(2);
        }
      }
    });
  });

  test.describe('Services Without Team', () => {
    test('should show "No Team Assigned" option in filter', async ({ page }) => {
      await page.locator('.team-filter-toggle').click();
      await expect(page.locator('.team-option').filter({ hasText: 'No Team Assigned' })).toBeVisible();
    });

    test('should filter to services without team', async ({ page }) => {
      await page.locator('.team-filter-toggle').click();
      await page.locator('.team-option').filter({ hasText: 'No Team Assigned' }).locator('input').click();
      await page.waitForTimeout(300);

      // Should show only services without team (test-repo-empty, test-repo-minimal, test-repo-no-docs)
      const count = await getServiceCount(page);
      expect(count).toBe(3);

      const names = await getVisibleServiceNames(page);
      expect(names).toContain('test-repo-empty');
      expect(names).toContain('test-repo-minimal');
      expect(names).toContain('test-repo-no-docs');
    });
  });
});
