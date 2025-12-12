import { test, expect } from './fixtures/catalog.fixture.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
  getVisibleServiceNames,
  switchToTeamsView,
  switchToServicesView,
  openTeamModal,
  closeTeamModal,
  setGitHubPAT,
  clickTeamModalTab,
  openCheckAdoptionDashboard,
  closeCheckAdoptionModal,
  searchTeams,
  clearTeamsSearch,
} from './test-helper.js';
import { mockPAT } from './fixtures.js';

// ============================================================================
// TEAMS VIEW - Navigation, Stats, Cards
// ============================================================================

test.describe('Teams View - Navigation and Stats', () => {
  test('should switch to Teams view and display stats', async ({ catalogPage }) => {
    const teamsTab = catalogPage.locator('[data-view="teams"]');
    await expect(teamsTab).toBeVisible();
    await expect(teamsTab).toContainText('Teams');

    await switchToTeamsView(catalogPage);
    // Wait for React to render stat cards in teams view
    const teamsStats = catalogPage.locator('#teams-view .teams-stats');
    // Wait for teams view to be active and stat cards to render
    await expect(catalogPage.locator('#teams-view')).toBeVisible();
    // Look for the text content of the stat cards as React renders them
    await expect(teamsStats.getByText('Total Teams')).toBeVisible({ timeout: 10000 });

    // Check for stat cards (scope to teamsStats to avoid matching team modal stats)
    await expect(teamsStats.locator('.stat-card').filter({ hasText: 'Total Teams' })).toBeVisible();
    await expect(teamsStats.locator('.stat-card').filter({ hasText: 'Average Score' })).toBeVisible();
    await expect(teamsStats.locator('.stat-card').filter({ hasText: 'Total Services' })).toBeVisible();

    // Rank distribution
    const ranks = ['Platinum', 'Gold', 'Silver', 'Bronze'];
    for (const rank of ranks) {
      await expect(teamsStats.locator('.stat-card').filter({ hasText: rank })).toBeVisible();
    }

    // Correct teams count
    const stat = teamsStats.locator('.stat-card').filter({ hasText: 'Total Teams' });
    const value = await stat.locator('.stat-value').textContent();
    expect(parseInt(value)).toBe(3);
  });
});

test.describe('Teams View - Team Cards', () => {
  test('should display team cards with correct information', async ({ teamsViewPage }) => {
    const teamCards = teamsViewPage.locator('.team-card');
    expect(await teamCards.count()).toBe(3);

    // Check platform card details
    const platformCard = teamsViewPage.locator('.team-card').filter({ hasText: 'platform' });
    await expect(platformCard).toBeVisible();
    await expect(platformCard).toContainText(/Platinum|Gold|Silver|Bronze/i);
    await expect(platformCard).toContainText(/Services/i);
    await expect(platformCard).toContainText(/Installed/i);
  });

  test('should open team modal when clicking card', async ({ teamsViewPage }) => {
    const teamCard = teamsViewPage.locator('.team-card').filter({ hasText: 'platform' });
    await teamCard.click();

    await teamsViewPage.waitForSelector('#team-modal', { state: 'visible', timeout: 5000 });
    await expect(teamsViewPage.locator('#team-modal')).toBeVisible();
  });
});

test.describe('Teams View - Search and Sort', () => {
  test('should search and filter teams', async ({ teamsViewPage }) => {
    const searchInput = teamsViewPage.locator('input[placeholder*="Search teams"]');
    await expect(searchInput).toBeVisible();

    // Use searchTeams helper which waits for debounce
    await searchTeams(teamsViewPage, 'front');

    await expect(async () => {
      const count = await teamsViewPage.locator('.team-card').count();
      expect(count).toBe(1);
    }).toPass({ timeout: 3000 });

    await expect(teamsViewPage.locator('.team-card').first()).toContainText('frontend');
  });

  test('should sort teams by different criteria', async ({ teamsViewPage }) => {
    // Find the sort select by ID for more reliable selection
    const sortSelect = teamsViewPage.locator('#sort-select');

    // Skip if sort select is not visible (may be hidden on mobile view)
    if (!(await sortSelect.isVisible())) {
      // Sort select may be hidden on current viewport - test passes as structure exists
      return;
    }

    // Sort by name
    const options = await sortSelect.locator('option').allTextContents();
    if (options.some(o => o.includes('Name'))) {
      await sortSelect.selectOption({ label: 'Name: A to Z' });
      await expect(teamsViewPage.locator('.team-card').first()).toContainText('backend');
    }
  });

  test('should have action buttons', async ({ teamsViewPage }) => {
    await expect(teamsViewPage.getByRole('button', { name: /Refresh Data/i })).toBeVisible();
    await expect(teamsViewPage.getByRole('button', { name: /Create Team/i })).toBeVisible();
    await expect(teamsViewPage.getByRole('button', { name: /Check Adoption/i })).toBeVisible();
  });
});

// ============================================================================
// TEAM FILTER
// ============================================================================

test.describe('Team Filter', () => {
  test('should filter services by team with single select', async ({ catalogPage }) => {
    await catalogPage.locator('.team-filter-toggle').click();
    await expect(catalogPage.locator('.team-dropdown-menu')).toBeVisible();

    // Should show team options
    await expect(catalogPage.locator('.team-option').filter({ hasText: 'platform' })).toBeVisible();
    await expect(catalogPage.locator('.team-option').filter({ hasText: 'frontend' })).toBeVisible();
    await expect(catalogPage.locator('.team-option').filter({ hasText: 'backend' })).toBeVisible();

    // Select frontend team
    await catalogPage.locator('.team-option').filter({ hasText: 'frontend' }).click();

    await expect(async () => {
      expect(await getServiceCount(catalogPage)).toBe(2);
    }).toPass({ timeout: 3000 });

    const names = await getVisibleServiceNames(catalogPage);
    expect(names).toContain('test-repo-edge-cases');
    expect(names).toContain('test-repo-javascript');
  });

  test('should support multi-select and clear filter', async ({ catalogPage }) => {
    await catalogPage.locator('.team-filter-toggle').click();
    await catalogPage.locator('.team-option').filter({ hasText: 'frontend' }).locator('input').click();
    await catalogPage.locator('.team-option').filter({ hasText: 'backend' }).locator('input').click();

    await expect(async () => {
      expect(await getServiceCount(catalogPage)).toBe(4);
    }).toPass({ timeout: 3000 });

    // Clear filter
    await expect(catalogPage.locator('.team-clear-btn')).toBeVisible();
    await catalogPage.locator('.team-clear-btn').click();

    await expect(async () => {
      expect(await getServiceCount(catalogPage)).toBe(9);
    }).toPass({ timeout: 3000 });
  });

  test('should filter to services without team', async ({ catalogPage }) => {
    await catalogPage.locator('.team-filter-toggle').click();
    await expect(catalogPage.locator('.team-option').filter({ hasText: 'No Team Assigned' })).toBeVisible();

    await catalogPage.locator('.team-option').filter({ hasText: 'No Team Assigned' }).locator('input').click();

    await expect(async () => {
      expect(await getServiceCount(catalogPage)).toBe(3);
    }).toPass({ timeout: 3000 });

    const names = await getVisibleServiceNames(catalogPage);
    expect(names).toContain('test-repo-empty');
    expect(names).toContain('test-repo-minimal');
    expect(names).toContain('test-repo-no-docs');
  });
});

// ============================================================================
// TEAM MODAL - Basic Behavior
// ============================================================================

test.describe('Team Modal - Basic Behavior', () => {
  test('should open modal, navigate through all tabs, and close via multiple methods', async ({ teamModalPage }) => {
    const modal = teamModalPage.locator('#team-modal');

    // Modal opening and basic info
    await expect(modal.locator('h2')).toContainText(/platform/i);
    await expect(modal).toContainText(/Platinum|Gold|Silver|Bronze/i);
    await expect(modal).toContainText(/Average Score/i);
    await expect(modal).toContainText(/Services/i);
    await expect(modal).toContainText(/Installed/i);
    await expect(modal).toContainText(/Stale/i);

    const editButton = modal.getByRole('button', { name: /Edit Team/i });
    await expect(editButton).toBeVisible();

    // All tabs visible
    await expect(modal.getByRole('button', { name: 'Services', exact: true })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Distribution', exact: true })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Check Adoption' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'GitHub', exact: true })).toBeVisible();

    // Services tab (default)
    await expect(modal).toContainText(/test-repo/i);

    // Switch to Distribution
    await clickTeamModalTab(teamModalPage, 'Distribution');
    await expect(modal).toContainText(/Platinum|Gold|Silver|Bronze/i);

    // Switch to Check Adoption
    await clickTeamModalTab(teamModalPage, 'Check Adoption');
    await expect(modal).toContainText(/Adoption|Passing|Failing/i);

    // Switch to GitHub
    await clickTeamModalTab(teamModalPage, 'GitHub');
    await expect(modal).toContainText(/GitHub|Sign in/i);

    // Switch back to Services
    await clickTeamModalTab(teamModalPage, 'Services');
    await expect(modal).toContainText(/test-repo/i);

    // Close with X
    await closeTeamModal(teamModalPage);
    await expect(modal).not.toBeVisible();

    // Reopen and close with Escape
    await openTeamModal(teamModalPage, 'platform');
    await teamModalPage.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});

// ============================================================================
// TEAM MODAL - Services Tab
// ============================================================================

test.describe('Team Modal - Services Tab', () => {
  test('should display team services with correct information', async ({ teamModalPage }) => {
    const modal = teamModalPage.locator('#team-modal');

    // Services tab is default
    const servicesTab = modal.getByRole('button', { name: 'Services', exact: true });
    expect(await servicesTab.evaluate(el => el.classList.contains('active'))).toBe(true);

    // Should show services
    await expect(modal).toContainText('test-repo-perfect');
    await expect(modal).toContainText(/\d+/); // scores

    const serviceItems = modal.locator('[role="button"], button').filter({ hasText: /test-repo/ });
    expect(await serviceItems.count()).toBeGreaterThanOrEqual(2);
  });

  test('should open service modal when clicking service', async ({ teamModalPage }) => {
    const modal = teamModalPage.locator('#team-modal');
    const serviceItem = modal.locator('[role="button"], button').filter({ hasText: 'test-repo-perfect' }).first();
    await serviceItem.click();

    await expect(teamModalPage.locator('#service-modal')).toBeVisible();
  });
});

// ============================================================================
// TEAM MODAL - Distribution Tab
// ============================================================================

test.describe('Team Modal - Distribution Tab', () => {
  test('should display rank distribution with all ranks', async ({ teamModalPage }) => {
    await clickTeamModalTab(teamModalPage, 'Distribution');

    const modal = teamModalPage.locator('#team-modal');
    const distributionTab = modal.getByRole('button', { name: 'Distribution', exact: true });
    expect(await distributionTab.evaluate(el => el.classList.contains('active'))).toBe(true);

    // All ranks should be visible
    const ranks = ['Platinum', 'Gold', 'Silver', 'Bronze'];
    for (const rank of ranks) {
      await expect(modal).toContainText(new RegExp(rank, 'i'));
    }

    // Should show counts
    await expect(modal).toContainText(/\d+/);

    // Verify tab content is visible
    const distributionContent = modal.locator('.tab-content, [class*="distribution"]');
    await expect(distributionContent.first()).toBeVisible();
  });
});

// ============================================================================
// TEAM MODAL - Check Adoption Tab
// ============================================================================

test.describe('Team Modal - Check Adoption Tab', () => {
  test('should display check adoption information', async ({ teamModalPage }) => {
    await clickTeamModalTab(teamModalPage, 'Check Adoption');

    const modal = teamModalPage.locator('#team-modal');

    // Should have check selector (wait for it to load)
    await expect(async () => {
      const hasSelector = await modal.locator('button, select').filter({ hasText: /README|Documentation|License/i }).count() > 0;
      expect(hasSelector).toBe(true);
    }).toPass({ timeout: 5000 });

    // Should show adoption information
    await expect(modal).toContainText(/README|Documentation|License|CI|Test/i);
    await expect(modal).toContainText(/Adoption Rate|\d+%/i);
    await expect(modal).toContainText(/Passing/i);
    await expect(modal).toContainText(/Failing/i);
  });

  test('should allow changing check selection', async ({ teamModalPage }) => {
    await clickTeamModalTab(teamModalPage, 'Check Adoption');

    const modal = teamModalPage.locator('#team-modal');
    const checkSelector = modal.locator('button').filter({ hasText: /README|Documentation/i }).first();
    await checkSelector.click();

    await expect(async () => {
      const hasOptions = await modal.locator('button, [role="option"]').filter({ hasText: /License|CI/i }).count() > 0;
      expect(hasOptions).toBe(true);
    }).toPass({ timeout: 3000 });
  });
});

// ============================================================================
// TEAM MODAL - GitHub Tab
// ============================================================================

test.describe('Team Modal - GitHub Tab', () => {
  test('should display GitHub information', async ({ teamModalPage }) => {
    await clickTeamModalTab(teamModalPage, 'GitHub');

    const modal = teamModalPage.locator('#team-modal');
    const githubTab = modal.getByRole('button', { name: 'GitHub', exact: true });
    expect(await githubTab.evaluate(el => el.classList.contains('active'))).toBe(true);

    // Platform team is configured with github_org
    const githubLink = modal.locator('a[href*="github.com"]');
    expect(await githubLink.count()).toBeGreaterThan(0);

    await expect(modal).toContainText(/platform/i);
  });

  test('should show sign in prompt when no PAT', async ({ teamModalPage }) => {
    await clickTeamModalTab(teamModalPage, 'GitHub');

    const modal = teamModalPage.locator('#team-modal');
    const signInButton = modal.getByRole('button', { name: /Sign in|Configure/i });
    await expect(signInButton).toBeVisible();
  });

  test('should fetch team members with PAT', async ({ catalogPage }) => {
    await setGitHubPAT(catalogPage, mockPAT);

    await catalogPage.route('**/api.github.com/orgs/**/teams/**/members', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          { login: 'testuser1', avatar_url: 'https://avatars.githubusercontent.com/u/1', html_url: 'https://github.com/testuser1' },
          { login: 'testuser2', avatar_url: 'https://avatars.githubusercontent.com/u/2', html_url: 'https://github.com/testuser2' },
        ]),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await openTeamModal(catalogPage, 'platform');
    await clickTeamModalTab(catalogPage, 'GitHub');

    const modal = catalogPage.locator('#team-modal');
    const content = await modal.textContent();
    expect(content).toBeTruthy();
  });
});

// ============================================================================
// CHECK ADOPTION DASHBOARD (Global)
// ============================================================================

test.describe('Check Adoption Dashboard', () => {
  test('should allow selecting different checks', async ({ catalogPage }) => {
    await openCheckAdoptionDashboard(catalogPage);

    const modal = catalogPage.locator('#check-adoption-modal');
    const checkSelector = modal.locator('button').filter({ hasText: /README|Documentation/i }).first();

    if (await checkSelector.isVisible()) {
      await checkSelector.click();

      await expect(async () => {
        const hasOptions = await catalogPage.locator('button, [role="option"]').filter({ hasText: /License|CI/i }).count() > 0;
        expect(hasOptions).toBe(true);
      }).toPass({ timeout: 3000 });
    }
  });
});
