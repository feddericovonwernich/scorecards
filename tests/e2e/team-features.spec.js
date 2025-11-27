import { test, expect } from '@playwright/test';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
  getVisibleServiceNames,
} from './test-helper.js';

test.describe('Team Features', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test.describe('Teams Tab Navigation', () => {
    test('should display Teams tab button', async ({ page }) => {
      const teamsTab = page.locator('.view-tab[data-view="teams"]');
      await expect(teamsTab).toBeVisible();
      await expect(teamsTab).toContainText('Teams');
    });

    test('should switch to Teams view when clicking tab', async ({ page }) => {
      await page.locator('.view-tab[data-view="teams"]').click();
      await expect(page.locator('#teams-view')).toBeVisible();
      await expect(page.locator('#services-view')).not.toBeVisible();
    });

    test('should show teams stats in Teams view', async ({ page }) => {
      await page.locator('.view-tab[data-view="teams"]').click();
      await page.waitForTimeout(500);

      // Verify Teams view stats section exists
      const teamsStats = page.locator('.teams-stats');
      await expect(teamsStats).toBeVisible();

      // Check for Total Teams stat
      await expect(teamsStats.locator('.stat-card').filter({ hasText: 'Total Teams' })).toBeVisible();
    });
  });

  test.describe('Team Filter', () => {
    test('should display team filter dropdown', async ({ page }) => {
      const teamFilter = page.locator('#team-filter-container');
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
      // Open team dashboard via JavaScript (modal is legacy and not directly accessible from UI)
      await page.evaluate(() => {
        window.openTeamDashboard(window.allServices || [], window.currentChecksHash || '');
      });
      await expect(page.locator('#team-dashboard-modal')).toBeVisible();
    });

    test('should show team summary stats', async ({ page }) => {
      // Should show total teams count
      await expect(page.locator('.summary-stat').filter({ hasText: 'Teams' })).toBeVisible();
      await expect(page.locator('.summary-stat').filter({ hasText: 'Services with Team' })).toBeVisible();
    });

    test('should display team cards', async ({ page }) => {
      const teamCards = page.locator('.team-card');
      const count = await teamCards.count();
      expect(count).toBe(3);
    });

    test('should show team details in card', async ({ page }) => {
      const platformCard = page.locator('.team-card').filter({ hasText: 'Platform' });
      await expect(platformCard).toBeVisible();

      // Should show service count
      await expect(platformCard.locator('.team-stat').filter({ hasText: 'Services' })).toBeVisible();

      // Should show average score
      await expect(platformCard.locator('.team-stat').filter({ hasText: 'Avg Score' })).toBeVisible();
    });

    test('should search teams', async ({ page }) => {
      await page.locator('.team-search').fill('front');
      await page.waitForTimeout(300);

      const teamCards = page.locator('.team-card');
      const count = await teamCards.count();
      expect(count).toBe(1);

      await expect(teamCards.first()).toContainText('Frontend');
    });

    test('should sort teams', async ({ page }) => {
      // Sort by name A-Z
      await page.locator('.team-sort-select').selectOption('name-asc');
      await page.waitForTimeout(300);

      const firstCard = page.locator('.team-card').first();
      await expect(firstCard.locator('.team-card-name')).toContainText('Backend');
    });

    test('should filter catalog when clicking Filter button', async ({ page }) => {
      // Click filter button on platform team card
      await page.locator('.team-card').filter({ hasText: 'Platform' }).locator('.team-filter-btn').click();

      // Modal should close
      await expect(page.locator('#team-dashboard-modal')).toBeHidden();

      // Services should be filtered to platform team
      await page.waitForTimeout(300);
      const count = await getServiceCount(page);
      expect(count).toBe(2);
    });

    test('should close on X button click', async ({ page }) => {
      await page.locator('#team-dashboard-modal .modal-close').click();
      await expect(page.locator('#team-dashboard-modal')).toBeHidden();
    });

    test('should close on Escape key', async ({ page }) => {
      await page.keyboard.press('Escape');
      await expect(page.locator('#team-dashboard-modal')).toBeHidden();
    });
  });

  test.describe('Team Links in Service Cards', () => {
    test('should display team name in service card', async ({ page }) => {
      const platformCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
      await expect(platformCard).toContainText('Team: platform');
    });

    test('should have clickable team name', async ({ page }) => {
      const teamLink = page.locator('.service-card')
        .filter({ hasText: 'test-repo-stale' })
        .locator('.service-team-link');

      await expect(teamLink).toBeVisible();
    });

    test('should open team detail modal when clicking team link', async ({ page }) => {
      // Click on platform team link
      await page.locator('.service-card')
        .filter({ hasText: 'test-repo-stale' })
        .locator('.service-team-link')
        .click();

      // Wait for modal to open
      await page.waitForTimeout(300);

      // Should open team detail modal
      await expect(page.locator('#team-modal')).toBeVisible();
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
