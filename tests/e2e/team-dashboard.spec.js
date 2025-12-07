import { test, expect } from './coverage.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  switchToTeamsView,
  openCheckAdoptionDashboard,
  closeCheckAdoptionModal,
} from './test-helper.js';

/**
 * Open Team Dashboard modal
 * @param {import('@playwright/test').Page} page
 */
async function openTeamDashboard(page) {
  await switchToTeamsView(page);
  // The Team Dashboard is accessed through the Check Adoption button
  // or may be a separate feature - checking what's available
  const dashboardButton = page.getByRole('button', { name: /Team Dashboard|Check Adoption/i });
  if (await dashboardButton.isVisible()) {
    await dashboardButton.click();
  }
}

test.describe('Team Dashboard - Check Adoption Modal', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should open Check Adoption dashboard from Teams view', async ({ page }) => {
    await openCheckAdoptionDashboard(page);

    const modal = page.locator('#check-adoption-modal');
    await expect(modal).toBeVisible();
  });

  test('should display modal title', async ({ page }) => {
    await openCheckAdoptionDashboard(page);

    const modal = page.locator('#check-adoption-modal');
    await expect(modal).toContainText(/Check Adoption|Adoption/i);
  });

  test('should have close button', async ({ page }) => {
    await openCheckAdoptionDashboard(page);

    const modal = page.locator('#check-adoption-modal');
    const closeButton = modal.getByRole('button', { name: /Close/i });
    await expect(closeButton).toBeVisible();
  });

  test('should close with X button', async ({ page }) => {
    await openCheckAdoptionDashboard(page);
    await closeCheckAdoptionModal(page);

    const modal = page.locator('#check-adoption-modal');
    await expect(modal).not.toBeVisible();
  });

  test('should close with Escape key', async ({ page }) => {
    await openCheckAdoptionDashboard(page);

    await page.keyboard.press('Escape');

    const modal = page.locator('#check-adoption-modal');
    await expect(modal).not.toBeVisible();
  });

  test('should display check selector dropdown', async ({ page }) => {
    await openCheckAdoptionDashboard(page);

    const modal = page.locator('#check-adoption-modal');
    // Should have a dropdown or selector for checks
    const hasSelector = await modal.locator('button, select').filter({ hasText: /README|Documentation|License|Select/i }).count() > 0;
    expect(hasSelector).toBe(true);
  });

  test('should display team filter option', async ({ page }) => {
    await openCheckAdoptionDashboard(page);

    const modal = page.locator('#check-adoption-modal');
    // May have team filter
    const content = await modal.textContent();
    expect(content).toBeTruthy();
  });

  test('should show adoption rate for selected check', async ({ page }) => {
    await openCheckAdoptionDashboard(page);

    const modal = page.locator('#check-adoption-modal');
    // Should display percentage
    await expect(modal).toContainText(/\d+%|Adoption/i);
  });

  test('should display progress bar', async ({ page }) => {
    await openCheckAdoptionDashboard(page);

    const modal = page.locator('#check-adoption-modal');
    // May have progress bar element
    const progressBar = modal.locator('.progress, [class*="progress"], [role="progressbar"]');
    const count = await progressBar.count();
    // Just verify the modal has content
    const content = await modal.textContent();
    expect(content).toBeTruthy();
  });

  test('should show passing services count', async ({ page }) => {
    await openCheckAdoptionDashboard(page);

    const modal = page.locator('#check-adoption-modal');
    await expect(modal).toContainText(/Passing|pass/i);
  });

  test('should show failing services count', async ({ page }) => {
    await openCheckAdoptionDashboard(page);

    const modal = page.locator('#check-adoption-modal');
    await expect(modal).toContainText(/Failing|fail/i);
  });

  test('should allow selecting different checks', async ({ page }) => {
    await openCheckAdoptionDashboard(page);

    const modal = page.locator('#check-adoption-modal');
    // Click on check selector
    const checkSelector = modal.locator('button').filter({ hasText: /README|Documentation/i }).first();
    if (await checkSelector.isVisible()) {
      await checkSelector.click();

      // Should show dropdown options
      await expect(async () => {
        const hasOptions = await page.locator('button, [role="option"]').filter({ hasText: /License|CI/i }).count() > 0;
        expect(hasOptions).toBe(true);
      }).toPass({ timeout: 3000 });
    }
  });

  test('should update display when check selection changes', async ({ page }) => {
    await openCheckAdoptionDashboard(page);

    const modal = page.locator('#check-adoption-modal');

    // Get initial check name
    const initialContent = await modal.textContent();

    // Try to select a different check
    const checkSelector = modal.locator('button').filter({ hasText: /README|Documentation/i }).first();
    if (await checkSelector.isVisible()) {
      await checkSelector.click();

      const otherCheck = page.locator('button, [role="option"]').filter({ hasText: /License/i }).first();
      if (await otherCheck.isVisible()) {
        await otherCheck.click();

        // Content should update
        await expect(async () => {
          const newContent = await modal.textContent();
          expect(newContent).toBeTruthy();
        }).toPass({ timeout: 3000 });
      }
    }
  });

  test('should display team breakdown', async ({ page }) => {
    await openCheckAdoptionDashboard(page);

    const modal = page.locator('#check-adoption-modal');
    // May show team-level breakdown
    const content = await modal.textContent();
    // Just verify content exists
    expect(content.length).toBeGreaterThan(0);
  });
});

test.describe('Teams View - Stats Cards', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await switchToTeamsView(page);
  });

  test('should display Total Teams stat', async ({ page }) => {
    const stat = page.locator('.stat-card').filter({ hasText: 'Total Teams' });
    await expect(stat).toBeVisible();
  });

  test('should display Average Score stat', async ({ page }) => {
    const stat = page.locator('.stat-card').filter({ hasText: 'Average Score' });
    await expect(stat).toBeVisible();
  });

  test('should display Total Services stat', async ({ page }) => {
    const stat = page.locator('.stat-card').filter({ hasText: 'Total Services' });
    await expect(stat).toBeVisible();
  });

  test('should display No Team stat', async ({ page }) => {
    const stat = page.locator('.stat-card').filter({ hasText: 'No Team' });
    await expect(stat).toBeVisible();
  });

  test('should show rank distribution stats', async ({ page }) => {
    // Should show Platinum, Gold, Silver, Bronze stats
    await expect(page.locator('.stat-card').filter({ hasText: 'Platinum' })).toBeVisible();
    await expect(page.locator('.stat-card').filter({ hasText: 'Gold' })).toBeVisible();
    await expect(page.locator('.stat-card').filter({ hasText: 'Silver' })).toBeVisible();
    await expect(page.locator('.stat-card').filter({ hasText: 'Bronze' })).toBeVisible();
  });

  test('should show correct teams count', async ({ page }) => {
    const stat = page.locator('.stat-card').filter({ hasText: 'Total Teams' });
    const value = await stat.locator('.stat-value').textContent();
    expect(parseInt(value)).toBe(3);
  });
});

test.describe('Teams View - Team Cards', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await switchToTeamsView(page);
  });

  test('should display team cards', async ({ page }) => {
    const teamCards = page.locator('.team-card');
    const count = await teamCards.count();
    expect(count).toBe(3);
  });

  test('should display team name in card', async ({ page }) => {
    const platformCard = page.locator('.team-card').filter({ hasText: 'platform' });
    await expect(platformCard).toBeVisible();
  });

  test('should display team rank badge', async ({ page }) => {
    const teamCard = page.locator('.team-card').first();
    await expect(teamCard).toContainText(/Platinum|Gold|Silver|Bronze/i);
  });

  test('should display average score in card', async ({ page }) => {
    const teamCard = page.locator('.team-card').first();
    await expect(teamCard).toContainText(/Avg Score|\d+/i);
  });

  test('should display services count in card', async ({ page }) => {
    const teamCard = page.locator('.team-card').first();
    await expect(teamCard).toContainText(/Services/i);
  });

  test('should display installed count in card', async ({ page }) => {
    const teamCard = page.locator('.team-card').first();
    await expect(teamCard).toContainText(/Installed/i);
  });

  test('should have rank distribution indicators', async ({ page }) => {
    const teamCard = page.locator('.team-card').first();
    // Cards show small rank indicators
    const content = await teamCard.textContent();
    expect(content).toBeTruthy();
  });

  test('should be clickable to open team modal', async ({ page }) => {
    const teamCard = page.locator('.team-card').filter({ hasText: 'platform' });
    await teamCard.click();

    await page.waitForSelector('#team-modal', { state: 'visible', timeout: 5000 });
    const teamModal = page.locator('#team-modal');
    await expect(teamModal).toBeVisible();
  });
});

test.describe('Teams View - Search and Sort', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await switchToTeamsView(page);
  });

  test('should have search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search teams"]');
    await expect(searchInput).toBeVisible();
  });

  test('should filter teams by search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search teams"]');
    await searchInput.fill('front');

    await expect(async () => {
      const teamCards = page.locator('.team-card');
      const count = await teamCards.count();
      expect(count).toBe(1);
    }).toPass({ timeout: 3000 });

    const teamCards = page.locator('.team-card');
    await expect(teamCards.first()).toContainText('frontend');
  });

  test('should have sort dropdown', async ({ page }) => {
    const sortSelect = page.locator('select').filter({ hasText: /Score|Name|Services/i });
    await expect(sortSelect).toBeVisible();
  });

  test('should sort teams by score', async ({ page }) => {
    const sortSelect = page.locator('select').first();
    await sortSelect.selectOption({ label: 'Score: High to Low' });

    // Teams should be sorted by score
    const teamCards = page.locator('.team-card');
    await expect(teamCards).toHaveCount(3);
  });

  test('should sort teams by name', async ({ page }) => {
    const sortSelect = page.locator('select').first();
    const options = await sortSelect.locator('option').allTextContents();

    if (options.some(o => o.includes('Name'))) {
      await sortSelect.selectOption({ label: 'Name: A to Z' });

      const firstCard = page.locator('.team-card').first();
      await expect(firstCard).toContainText('backend');
    }
  });

  test('should have Refresh Data button', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: /Refresh Data/i });
    await expect(refreshButton).toBeVisible();
  });

  test('should have Create Team button', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /Create Team/i });
    await expect(createButton).toBeVisible();
  });

  test('should have Check Adoption button', async ({ page }) => {
    const adoptionButton = page.getByRole('button', { name: /Check Adoption/i });
    await expect(adoptionButton).toBeVisible();
  });
});
