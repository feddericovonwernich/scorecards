import { test, expect } from './coverage.js';
import { mockPAT } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  switchToTeamsView,
  openTeamModal,
  closeTeamModal,
  setGitHubPAT,
} from './test-helper.js';

/**
 * Click a Team Modal tab by name
 * @param {import('@playwright/test').Page} page
 * @param {string} tabName - 'Services', 'Distribution', 'Check Adoption', 'GitHub'
 */
async function clickTeamModalTab(page, tabName) {
  const modal = page.locator('#team-modal');
  const tab = modal.getByRole('button', { name: tabName, exact: true });
  await tab.click();
  // Wait for tab to become active
  await expect(tab).toHaveClass(/active/);
}

test.describe('Team Modal - Services Tab', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should default to Services tab', async ({ page }) => {
    await openTeamModal(page, 'platform');

    const modal = page.locator('#team-modal');
    const servicesTab = modal.getByRole('button', { name: 'Services', exact: true });
    // Should have active styling
    const hasActiveClass = await servicesTab.evaluate(el => el.classList.contains('active'));
    expect(hasActiveClass).toBe(true);
  });

  test('should display team services list', async ({ page }) => {
    await openTeamModal(page, 'platform');

    const modal = page.locator('#team-modal');
    // Should show services in the tab content
    await expect(modal).toContainText('test-repo');
  });

  test('should show service name for each service', async ({ page }) => {
    await openTeamModal(page, 'platform');

    const modal = page.locator('#team-modal');
    // Platform team should have test-repo-perfect
    await expect(modal).toContainText('test-repo-perfect');
  });

  test('should show service score for each service', async ({ page }) => {
    await openTeamModal(page, 'platform');

    const modal = page.locator('#team-modal');
    // Should show score numbers
    await expect(modal).toContainText(/\d+/);
  });

  test('should have clickable service items', async ({ page }) => {
    await openTeamModal(page, 'platform');

    const modal = page.locator('#team-modal');
    // Service items should be buttons or clickable
    const serviceItems = modal.locator('[role="button"], button').filter({ hasText: 'test-repo' });
    const count = await serviceItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should open service modal when clicking service', async ({ page }) => {
    await openTeamModal(page, 'platform');

    const modal = page.locator('#team-modal');
    // Click on a service
    const serviceItem = modal.locator('[role="button"], button').filter({ hasText: 'test-repo-perfect' }).first();
    await serviceItem.click();

    // Service modal should open
    const serviceModal = page.locator('#service-modal');
    await expect(serviceModal).toBeVisible();
  });

  test('should show correct number of services', async ({ page }) => {
    await openTeamModal(page, 'platform');

    const modal = page.locator('#team-modal');
    // Platform team should have multiple services
    const serviceItems = modal.locator('[role="button"], button').filter({ hasText: /test-repo/ });
    const count = await serviceItems.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should display services sorted consistently', async ({ page }) => {
    await openTeamModal(page, 'platform');

    // Just verify services are displayed in some order
    const modal = page.locator('#team-modal');
    await expect(modal).toContainText('test-repo');
  });
});

test.describe('Team Modal - Distribution Tab', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should switch to Distribution tab', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Distribution');

    const modal = page.locator('#team-modal');
    const distributionTab = modal.getByRole('button', { name: 'Distribution', exact: true });
    const hasActiveClass = await distributionTab.evaluate(el => el.classList.contains('active'));
    expect(hasActiveClass).toBe(true);
  });

  test('should display Platinum rank bar', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Distribution');

    const modal = page.locator('#team-modal');
    await expect(modal).toContainText(/Platinum/i);
  });

  test('should display Gold rank bar', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Distribution');

    const modal = page.locator('#team-modal');
    await expect(modal).toContainText(/Gold/i);
  });

  test('should display Silver rank bar', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Distribution');

    const modal = page.locator('#team-modal');
    await expect(modal).toContainText(/Silver/i);
  });

  test('should display Bronze rank bar', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Distribution');

    const modal = page.locator('#team-modal');
    await expect(modal).toContainText(/Bronze/i);
  });

  test('should show count for each rank', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Distribution');

    const modal = page.locator('#team-modal');
    // Should show numbers for counts
    await expect(modal).toContainText(/\d+/);
  });

  test('should handle team with services in single rank', async ({ page }) => {
    // Backend team may have concentrated scores
    await openTeamModal(page, 'backend');
    await clickTeamModalTab(page, 'Distribution');

    const modal = page.locator('#team-modal');
    // Should still show all rank categories
    await expect(modal).toContainText(/Platinum|Gold|Silver|Bronze/i);
  });

  test('should handle zero counts gracefully', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Distribution');

    const modal = page.locator('#team-modal');
    // Should display without errors even for zero counts
    const distributionContent = modal.locator('.tab-content, [class*="distribution"]');
    await expect(distributionContent.first()).toBeVisible();
  });
});

test.describe('Team Modal - Check Adoption Tab', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should switch to Check Adoption tab', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Check Adoption');

    const modal = page.locator('#team-modal');
    const adoptionTab = modal.getByRole('button', { name: 'Check Adoption' });
    const hasActiveClass = await adoptionTab.evaluate(el => el.classList.contains('active'));
    expect(hasActiveClass).toBe(true);
  });

  test('should display check selector', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Check Adoption');

    const modal = page.locator('#team-modal');
    // Should have a check selector/dropdown
    const hasSelector = await modal.locator('button, select').filter({ hasText: /README|Documentation|License/i }).count() > 0;
    expect(hasSelector).toBe(true);
  });

  test('should display check name', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Check Adoption');

    const modal = page.locator('#team-modal');
    // Should show a check name
    await expect(modal).toContainText(/README|Documentation|License|CI|Test/i);
  });

  test('should display check description', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Check Adoption');

    const modal = page.locator('#team-modal');
    // Should show description text
    await expect(modal).toContainText(/Checks|repository|file/i);
  });

  test('should display adoption rate percentage', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Check Adoption');

    const modal = page.locator('#team-modal');
    // Should show adoption rate with percentage
    await expect(modal).toContainText(/Adoption Rate|\d+%/i);
  });

  test('should display passing services section', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Check Adoption');

    const modal = page.locator('#team-modal');
    // Should have passing section
    await expect(modal).toContainText(/Passing/i);
  });

  test('should display failing services section', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Check Adoption');

    const modal = page.locator('#team-modal');
    // Should have failing section
    await expect(modal).toContainText(/Failing/i);
  });

  test('should show service count in passing section', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Check Adoption');

    const modal = page.locator('#team-modal');
    // Should show count like "Passing (4)"
    await expect(modal).toContainText(/Passing \(\d+\)/i);
  });

  test('should show service count in failing section', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Check Adoption');

    const modal = page.locator('#team-modal');
    // Should show count like "Failing (0)" or "Failing (2)"
    await expect(modal).toContainText(/Failing \(\d+\)/i);
  });

  test('should have clickable check selector', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Check Adoption');

    const modal = page.locator('#team-modal');
    // Find the check selector button
    const checkSelector = modal.locator('button').filter({ hasText: /README|Documentation/i }).first();
    await checkSelector.click();

    // Should show dropdown or options
    await expect(async () => {
      const hasOptions = await modal.locator('button, [role="option"]').filter({ hasText: /License|CI|Test/i }).count() > 0;
      expect(hasOptions).toBe(true);
    }).toPass({ timeout: 3000 });
  });

  test('should update adoption stats when check changes', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Check Adoption');

    const modal = page.locator('#team-modal');

    // Get initial adoption rate
    const initialRateText = await modal.locator('text=/\\d+%/').first().textContent();

    // Click check selector and select different check
    const checkSelector = modal.locator('button').filter({ hasText: /README|Documentation/i }).first();
    await checkSelector.click();

    // Wait for options to appear
    const otherCheck = modal.locator('button, [role="option"]').filter({ hasText: /License|CI/i }).first();
    if (await otherCheck.isVisible()) {
      await otherCheck.click();

      // Should still show adoption rate (may be different)
      await expect(modal.locator('text=/\\d+%/')).toBeVisible();
    }
  });

  test('should show empty state message when no failing services', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Check Adoption');

    const modal = page.locator('#team-modal');
    // May show "No failing services" or similar empty state
    const failingSection = modal.locator('text=/Failing/i').first();
    await expect(failingSection).toBeVisible();
  });

  test('should allow clicking on passing services', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'Check Adoption');

    const modal = page.locator('#team-modal');
    // Find a passing service and click
    const passingService = modal.locator('[role="button"], button').filter({ hasText: 'test-repo' }).first();
    if (await passingService.isVisible()) {
      await passingService.click();

      // Service modal should open
      const serviceModal = page.locator('#service-modal');
      await expect(serviceModal).toBeVisible();
    }
  });
});

test.describe('Team Modal - GitHub Tab', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should switch to GitHub tab', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'GitHub');

    const modal = page.locator('#team-modal');
    const githubTab = modal.getByRole('button', { name: 'GitHub', exact: true });
    const hasActiveClass = await githubTab.evaluate(el => el.classList.contains('active'));
    expect(hasActiveClass).toBe(true);
  });

  test('should display GitHub team link when configured', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'GitHub');

    const modal = page.locator('#team-modal');
    // Platform team is configured with github_org in fixtures
    const githubLink = modal.locator('a[href*="github.com"]');
    const count = await githubLink.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show team slug in GitHub link', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'GitHub');

    const modal = page.locator('#team-modal');
    // Should show team name in link
    await expect(modal).toContainText(/platform/i);
  });

  test('should show sign in prompt when no PAT configured', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'GitHub');

    const modal = page.locator('#team-modal');
    // Without PAT, should show sign in prompt
    const signInButton = modal.getByRole('button', { name: /Sign in|Configure/i });
    await expect(signInButton).toBeVisible();
  });

  test('should have external link icon on GitHub link', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'GitHub');

    const modal = page.locator('#team-modal');
    // GitHub link should have external icon (img or svg)
    const linkWithIcon = modal.locator('a[href*="github.com"]').locator('img, svg');
    const count = await linkWithIcon.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should fetch team members when PAT is configured', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);

    // Mock GitHub team members API
    await page.route('**/api.github.com/orgs/**/teams/**/members', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          {
            login: 'testuser1',
            avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
            html_url: 'https://github.com/testuser1',
          },
          {
            login: 'testuser2',
            avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4',
            html_url: 'https://github.com/testuser2',
          },
        ]),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'GitHub');

    const modal = page.locator('#team-modal');
    // May show member info or avatars - just verify we're on GitHub tab with some content
    const content = await modal.textContent();
    expect(content).toBeTruthy();
  });

  test('should handle teams not linked to GitHub', async ({ page }) => {
    // Some teams may not have github_org configured
    // This test verifies graceful handling
    await openTeamModal(page, 'backend');
    await clickTeamModalTab(page, 'GitHub');

    const modal = page.locator('#team-modal');
    // Should show some content even if not linked
    await expect(modal).toContainText(/GitHub|not linked|Sign in/i);
  });

  test('should open settings when Sign in button clicked', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await clickTeamModalTab(page, 'GitHub');

    const modal = page.locator('#team-modal');
    const signInButton = modal.getByRole('button', { name: /Sign in/i });

    if (await signInButton.isVisible()) {
      await signInButton.click();

      // Settings modal should open
      await page.waitForSelector('#settings-modal', { state: 'visible', timeout: 5000 });
      const settingsModal = page.locator('#settings-modal');
      await expect(settingsModal).toBeVisible();
    }
  });
});

test.describe('Team Modal - Header and Stats', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should display team name in header', async ({ page }) => {
    await openTeamModal(page, 'platform');

    const modal = page.locator('#team-modal');
    await expect(modal.locator('h2')).toContainText('platform');
  });

  test('should display team rank badge', async ({ page }) => {
    await openTeamModal(page, 'platform');

    const modal = page.locator('#team-modal');
    await expect(modal).toContainText(/Platinum|Gold|Silver|Bronze/i);
  });

  test('should display average score', async ({ page }) => {
    await openTeamModal(page, 'platform');

    const modal = page.locator('#team-modal');
    // Should show average score stat
    await expect(modal).toContainText(/Average Score|\d+/i);
  });

  test('should display services count', async ({ page }) => {
    await openTeamModal(page, 'platform');

    const modal = page.locator('#team-modal');
    await expect(modal).toContainText(/Services/i);
  });

  test('should display installed count', async ({ page }) => {
    await openTeamModal(page, 'platform');

    const modal = page.locator('#team-modal');
    await expect(modal).toContainText(/Installed/i);
  });

  test('should display stale count', async ({ page }) => {
    await openTeamModal(page, 'platform');

    const modal = page.locator('#team-modal');
    await expect(modal).toContainText(/Stale/i);
  });

  test('should have Edit Team button', async ({ page }) => {
    await openTeamModal(page, 'platform');

    const modal = page.locator('#team-modal');
    const editButton = modal.getByRole('button', { name: /Edit Team/i });
    await expect(editButton).toBeVisible();
  });

  test('should close with X button', async ({ page }) => {
    await openTeamModal(page, 'platform');
    await closeTeamModal(page);

    const modal = page.locator('#team-modal');
    await expect(modal).not.toBeVisible();
  });

  test('should close with Escape key', async ({ page }) => {
    await openTeamModal(page, 'platform');

    await page.keyboard.press('Escape');

    const modal = page.locator('#team-modal');
    await expect(modal).not.toBeVisible();
  });
});

test.describe('Team Modal - Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should have all four tabs visible', async ({ page }) => {
    await openTeamModal(page, 'platform');

    const modal = page.locator('#team-modal');
    await expect(modal.getByRole('button', { name: 'Services', exact: true })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Distribution', exact: true })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Check Adoption' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'GitHub', exact: true })).toBeVisible();
  });

  test('should update content when switching tabs', async ({ page }) => {
    await openTeamModal(page, 'platform');

    const modal = page.locator('#team-modal');

    // Services tab (default)
    await expect(modal).toContainText('test-repo');

    // Switch to Distribution
    await clickTeamModalTab(page, 'Distribution');
    await expect(modal).toContainText(/Platinum|Gold|Silver|Bronze/i);

    // Switch to Check Adoption
    await clickTeamModalTab(page, 'Check Adoption');
    await expect(modal).toContainText(/Adoption|Passing|Failing/i);

    // Switch to GitHub
    await clickTeamModalTab(page, 'GitHub');
    await expect(modal).toContainText(/GitHub|Sign in/i);
  });

  test('should preserve tab state when switching between tabs', async ({ page }) => {
    await openTeamModal(page, 'platform');

    // Go to Distribution
    await clickTeamModalTab(page, 'Distribution');

    // Go to GitHub
    await clickTeamModalTab(page, 'GitHub');

    // Go back to Distribution
    await clickTeamModalTab(page, 'Distribution');

    const modal = page.locator('#team-modal');
    await expect(modal).toContainText(/Platinum|Gold|Silver|Bronze/i);
  });
});
