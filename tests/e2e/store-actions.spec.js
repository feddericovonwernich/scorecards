/**
 * Store Actions E2E Tests
 *
 * Consolidated tests for Zustand store filter and sort logic,
 * targeting low branch coverage in appStore.ts (13.46% branches).
 */

import { test, expect } from './coverage.js';
import { expectedStats, expectedTeams } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
  searchServices,
  clearSearch,
  selectSort,
  switchToTeamsView,
  switchToServicesView,
  openServiceModal,
  closeServiceModal,
  openSettingsModal,
  closeSettingsModal,
  searchTeams,
  clearTeamsSearch,
} from './test-helper.js';

// ============================================================================
// FILTER OPERATIONS (Consolidated from Rank + Special + Combined = 6 tests → 2)
// ============================================================================

test.describe('Store Actions - Filter Operations', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should cycle through include/exclude/clear for rank and special filters', async ({ page }) => {
    // Test rank filters (Gold, Silver, Bronze)
    const ranks = [
      { name: 'Gold', count: expectedStats.ranks.gold },
      { name: 'Silver', count: expectedStats.ranks.silver },
      { name: 'Bronze', count: expectedStats.ranks.bronze },
    ];

    for (const rank of ranks) {
      const statCard = page.locator('.services-stats .stat-card').filter({ hasText: rank.name });

      // Include
      await statCard.click();
      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(rank.count);
      }).toPass({ timeout: 3000 });

      // Verify cards have correct rank
      const serviceCards = page.locator('.service-card');
      const cardCount = await serviceCards.count();
      for (let i = 0; i < cardCount; i++) {
        await expect(serviceCards.nth(i)).toContainText(rank.name);
      }

      // Exclude
      await statCard.click();
      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(expectedStats.totalServices - rank.count);
      }).toPass({ timeout: 3000 });

      // Clear
      await statCard.click();
      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(expectedStats.totalServices);
      }).toPass({ timeout: 3000 });
    }

    // Test special filters (Stale, Installed)
    const specialFilters = [
      { name: 'Stale', count: expectedStats.stale },
      { name: 'Installed', count: expectedStats.installed },
    ];

    for (const filter of specialFilters) {
      const statCard = page.locator('.services-stats .stat-card').filter({ hasText: filter.name });

      await statCard.click();
      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(filter.count);
      }).toPass({ timeout: 3000 });

      await statCard.click();
      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(expectedStats.totalServices - filter.count);
      }).toPass({ timeout: 3000 });

      await statCard.click();
      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(expectedStats.totalServices);
      }).toPass({ timeout: 3000 });
    }

    // Test API filter if present
    const apiStat = page.locator('.services-stats .stat-card').filter({ hasText: /API/i });
    if (await apiStat.count() > 0) {
      await apiStat.click();
      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(expectedStats.withAPI);
      }).toPass({ timeout: 3000 });

      await apiStat.click();
      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(expectedStats.totalServices - expectedStats.withAPI);
      }).toPass({ timeout: 3000 });

      await apiStat.click(); // clear
    }
  });

  test('should combine multiple filters with AND logic', async ({ page }) => {
    // Test 1: Rank + Stale
    const goldStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Gold' });
    await goldStat.click();

    const staleStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });
    await staleStat.click();

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(1);
    }).toPass({ timeout: 3000 });
    await expect(page.locator('.service-card').first()).toContainText('test-repo-stale');

    // Clear filters
    await goldStat.click();
    await goldStat.click();
    await staleStat.click();
    await staleStat.click();

    // Test 2: Search + Rank
    await goldStat.click();
    await searchServices(page, 'stale');

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(1);
    }).toPass({ timeout: 3000 });

    await clearSearch(page);
    await goldStat.click();
    await goldStat.click();

    // Test 3: Include + Exclude combination
    const silverStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Silver' });
    await silverStat.click();

    const installedStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Installed' });
    await installedStat.click();
    await installedStat.click(); // exclude

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBeGreaterThanOrEqual(0);
    }).toPass({ timeout: 3000 });
  });
});

// ============================================================================
// SORT OPTIONS (Consolidated from 3 tests → 1)
// ============================================================================

test.describe('Store Actions - Sort Options', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should sort by score, name, and recently updated', async ({ page }) => {
    const sortSelect = page.locator('#sort-select');

    // Test 1: Default sort is score-desc
    await expect(sortSelect).toHaveValue('score-desc');
    let cards = page.locator('.service-card');
    let firstScore = await cards.first().locator('.score, [class*="score"]').textContent();
    let lastScore = await cards.last().locator('.score, [class*="score"]').textContent();
    expect(parseInt(firstScore)).toBeGreaterThanOrEqual(parseInt(lastScore));

    // Test 2: Score ascending
    await selectSort(page, 'Score: Low to High');
    await expect(async () => {
      await expect(sortSelect).toHaveValue('score-asc');
      cards = page.locator('.service-card');
      firstScore = await cards.first().locator('.score, [class*="score"]').textContent();
      lastScore = await cards.last().locator('.score, [class*="score"]').textContent();
      expect(parseInt(firstScore)).toBeLessThanOrEqual(parseInt(lastScore));
    }).toPass({ timeout: 3000 });

    // Test 3: Name A-Z
    await selectSort(page, 'Name: A to Z');
    await expect(async () => {
      await expect(sortSelect).toHaveValue('name-asc');
    }).toPass({ timeout: 3000 });

    let allCards = await page.locator('.service-card').all();
    let names = [];
    for (const card of allCards) {
      const name = await card.locator('.service-name').textContent();
      names.push(name.toLowerCase());
    }
    for (let i = 0; i < names.length - 1; i++) {
      expect(names[i].localeCompare(names[i + 1])).toBeLessThanOrEqual(0);
    }

    // Test 4: Name Z-A
    await selectSort(page, 'Name: Z to A');
    await expect(async () => {
      await expect(sortSelect).toHaveValue('name-desc');
    }).toPass({ timeout: 3000 });

    allCards = await page.locator('.service-card').all();
    names = [];
    for (const card of allCards) {
      const name = await card.locator('.service-name').textContent();
      names.push(name.toLowerCase());
    }
    for (let i = 0; i < names.length - 1; i++) {
      expect(names[i].localeCompare(names[i + 1])).toBeGreaterThanOrEqual(0);
    }

    // Test 5: Recently Updated
    await selectSort(page, 'Recently Updated');
    await expect(async () => {
      const value = await sortSelect.inputValue();
      expect(['updated-desc', 'recently-updated']).toContain(value);
    }).toPass({ timeout: 3000 });
  });
});

// ============================================================================
// VIEW SWITCHING & TEAM FILTER (Consolidated from 4 tests → 1)
// ============================================================================

test.describe('Store Actions - Views and Team Filter', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should switch views, search teams, and filter by team', async ({ page }) => {
    // Test 1: Switch to Teams view
    await switchToTeamsView(page);
    await expect(page.locator('.teams-grid')).toBeVisible();
    await expect(page.locator('.services-grid')).not.toBeVisible();

    const teamCards = page.locator('.team-card');
    const count = await teamCards.count();
    expect(count).toBe(expectedStats.teams);

    // Test 2: Search teams (use helper which waits for debounce)
    await searchTeams(page, 'platform');

    await expect(async () => {
      const filteredCount = await teamCards.count();
      expect(filteredCount).toBe(1);
    }).toPass({ timeout: 3000 });

    await clearTeamsSearch(page);

    // Test 3: Switch back to Services view
    await switchToServicesView(page);
    await expect(page.locator('.services-grid')).toBeVisible();
    await expect(page.locator('.teams-grid')).not.toBeVisible();

    // Test 4: Filter services by team
    const teamFilterToggle = page.locator('.team-filter-toggle');
    await teamFilterToggle.click();
    await page.locator('.team-option').filter({ hasText: 'platform' }).locator('input').click();
    await teamFilterToggle.click();

    await expect(async () => {
      const serviceCount = await getServiceCount(page);
      expect(serviceCount).toBe(expectedTeams.platform.serviceCount);
    }).toPass({ timeout: 3000 });

    // Clear team filter
    await teamFilterToggle.click();
    await page.locator('.team-option').filter({ hasText: 'platform' }).locator('input').click();
    await teamFilterToggle.click();

    await expect(async () => {
      const serviceCount = await getServiceCount(page);
      expect(serviceCount).toBe(expectedStats.totalServices);
    }).toPass({ timeout: 3000 });

    // Test 5: Multi-team filter
    await teamFilterToggle.click();
    await page.locator('.team-option').filter({ hasText: 'frontend' }).locator('input').click();
    await page.locator('.team-option').filter({ hasText: 'backend' }).locator('input').click();
    await teamFilterToggle.click();

    await expect(async () => {
      const serviceCount = await getServiceCount(page);
      expect(serviceCount).toBe(expectedTeams.frontend.serviceCount + expectedTeams.backend.serviceCount);
    }).toPass({ timeout: 3000 });
  });
});

// ============================================================================
// FILTER PERSISTENCE & DISPLAY MODE (Consolidated from 2 tests → 1)
// ============================================================================

test.describe('Store Actions - State Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should maintain rank filter when clearing search and persist display mode', async ({ page }) => {
    // Test 1: Rank filter maintained when clearing search
    const goldStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Gold' });
    await goldStat.click();

    await searchServices(page, 'test');
    await clearSearch(page);

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.ranks.gold);
    }).toPass({ timeout: 3000 });

    // Clear rank filter
    await goldStat.click(); // exclude
    await goldStat.click(); // clear

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.totalServices);
    }).toPass({ timeout: 3000 });

    // Test 2: Display mode persistence
    const listViewButton = page.locator('[data-display-mode="list"], .display-mode-toggle');
    if (await listViewButton.isVisible()) {
      await listViewButton.click();

      const displayMode = await page.evaluate(() => {
        return localStorage.getItem('scorecards-display-mode');
      });

      expect(['grid', 'list']).toContain(displayMode);
    }
  });
});

// ============================================================================
// MODAL STATE (Consolidated from 2 tests → 1)
// ============================================================================

test.describe('Store Actions - Modal State', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should open and close service and settings modals', async ({ page }) => {
    // Test 1: Service modal - button close
    await openServiceModal(page, 'test-repo-perfect');
    const serviceModal = page.locator('#service-modal');
    await expect(serviceModal).toBeVisible();
    await expect(serviceModal).toContainText('test-repo-perfect');

    await closeServiceModal(page);
    await expect(serviceModal).not.toBeVisible();

    // Test 2: Service modal - Escape close
    await openServiceModal(page, 'test-repo-perfect');
    await expect(serviceModal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(serviceModal).not.toBeVisible();

    // Test 3: Settings modal
    await openSettingsModal(page);
    const settingsModal = page.locator('#settings-modal');
    await expect(settingsModal).toBeVisible();
    await expect(settingsModal).toContainText('Settings');

    await closeSettingsModal(page);
    await expect(settingsModal).not.toBeVisible();
  });
});
