import { test, expect } from './coverage.js';
import { expectedStats, expectedServices, sortOptions } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
  getVisibleServiceNames,
  selectSort,
  searchServices,
  clearSearch,
  applyStatFilter,
} from './test-helper.js';

// ============================================================================
// CATALOG PAGE - Basic Display
// ============================================================================

test.describe('Catalog Page - Display', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Consolidated test: Task 1 - Initial Page Load and Display Verification
  // Combines: title, dashboard stats, service cards count, service card details,
  // GitHub links, footer, and action buttons tests
  test('should load catalog page with complete UI elements and correct data', async ({ page }) => {
    // Title and header
    await expect(page).toHaveTitle('Scorecards Catalog');
    await expect(page.locator('header')).toContainText('Scorecards');

    // Dashboard stats
    const statsSection = page.locator('.services-stats');
    const totalServices = await statsSection
      .locator('.stat-card')
      .filter({ hasText: 'Total Services' })
      .locator('.stat-value')
      .textContent();
    expect(totalServices.trim()).toBe(expectedStats.totalServices.toString());

    const avgScore = await statsSection
      .locator('.stat-card')
      .filter({ hasText: 'Average Score' })
      .locator('.stat-value')
      .textContent();
    const avgScoreNum = parseInt(avgScore.trim());
    expect(avgScoreNum).toBeGreaterThan(50);
    expect(avgScoreNum).toBeLessThan(60);

    const goldCount = await statsSection
      .locator('.stat-card')
      .filter({ hasText: 'Gold' })
      .locator('.stat-value')
      .textContent();
    expect(goldCount.trim()).toBe(expectedStats.ranks.gold.toString());

    const silverCount = await statsSection
      .locator('.stat-card')
      .filter({ hasText: 'Silver' })
      .locator('.stat-value')
      .textContent();
    expect(silverCount.trim()).toBe(expectedStats.ranks.silver.toString());

    const bronzeCount = await statsSection
      .locator('.stat-card')
      .filter({ hasText: 'Bronze' })
      .locator('.stat-value')
      .textContent();
    expect(bronzeCount.trim()).toBe(expectedStats.ranks.bronze.toString());

    // Service cards count
    const count = await getServiceCount(page);
    expect(count).toBe(expectedStats.totalServices);

    // Service card details
    const perfectCard = page
      .locator('.service-card')
      .filter({ hasText: 'test-repo-perfect' })
      .first();
    await expect(perfectCard).toBeVisible();
    await expect(perfectCard).toContainText('76');
    await expect(perfectCard).toContainText('Gold');

    const emptyCard = page.locator('.service-card').filter({ hasText: 'test-repo-empty' }).first();
    await expect(emptyCard).toBeVisible();
    await expect(emptyCard).toContainText('23');
    await expect(emptyCard).toContainText('Bronze');

    // GitHub links
    const githubLinks = page.locator('.service-card a[href*="github.com"]');
    const linkCount = await githubLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(expectedStats.totalServices);

    // Footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Powered by Scorecards');
    const docLink = footer.locator('a', { hasText: 'Documentation' });
    await expect(docLink).toBeVisible();

    // Action buttons
    const buttons = ['Refresh Data', 'Re-run All Stale', 'Settings', 'Show GitHub Actions'];
    for (const name of buttons) {
      await expect(page.getByRole('button', { name })).toBeVisible();
    }
  });

  // Keep this test unchanged - unique PR badge feature
  test('should display installation PR badges when present', async ({ page }) => {
    const edgeCasesCard = page
      .locator('.service-card')
      .filter({ hasText: 'test-repo-edge-cases' })
      .first();
    const prBadge = edgeCasesCard.locator('a[href*="/pull/"]');
    await expect(prBadge).toBeVisible();
  });
});

// ============================================================================
// CATALOG PAGE - Sorting
// ============================================================================

test.describe('Catalog Page - Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Consolidated test: Task 2 - Sorting Functionality
  // Combines: default sort, low to high, A to Z, Z to A tests
  test('should sort services by all available options correctly', async ({ page }) => {
    // Default: Score High to Low
    let names = await getVisibleServiceNames(page);
    expect(names[0]).toBe('test-repo-stale');
    expect(names[names.length - 1]).toBe('test-repo-empty');

    // Score: Low to High
    await selectSort(page, 'Score: Low to High');
    await expect(async () => {
      const names = await getVisibleServiceNames(page);
      expect(names[0]).toBe('test-repo-empty');
    }).toPass({ timeout: 3000 });
    names = await getVisibleServiceNames(page);
    expect(names[0]).toBe('test-repo-empty');
    expect(names[names.length - 1]).toBe('test-repo-stale');

    // Name: A to Z
    await selectSort(page, 'Name: A to Z');
    await expect(async () => {
      const names = await getVisibleServiceNames(page);
      expect(names[0]).toBe('test-repo-edge-cases');
    }).toPass({ timeout: 3000 });
    names = await getVisibleServiceNames(page);
    expect(names[0]).toBe('test-repo-edge-cases');
    expect(names[names.length - 1]).toBe('test-repo-stale');

    // Name: Z to A
    await selectSort(page, 'Name: Z to A');
    await expect(async () => {
      const names = await getVisibleServiceNames(page);
      expect(names[0]).toBe('test-repo-stale');
    }).toPass({ timeout: 3000 });
    names = await getVisibleServiceNames(page);
    expect(names[0]).toBe('test-repo-stale');
    expect(names[names.length - 1]).toBe('test-repo-edge-cases');
  });
});

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Consolidated test: Task 3 - Search Functionality
  // Combines: case-insensitive search, clear search, no results, placeholder tests
  test('should search services with case-insensitive filtering, clear, and handle no results', async ({
    page,
  }) => {
    // Placeholder
    const searchInput = page.getByRole('textbox', { name: 'Search services...' });
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /search/i);

    // Lowercase search
    await searchServices(page, 'python');
    let count = await getServiceCount(page);
    expect(count).toBe(1);
    await expect(page.locator('.service-card').first()).toContainText('test-repo-python');

    // Uppercase search (case-insensitive)
    await clearSearch(page);
    await searchServices(page, 'PYTHON');
    count = await getServiceCount(page);
    expect(count).toBe(1);
    await expect(page.locator('.service-card').first()).toContainText('test-repo-python');

    // Clear search
    await clearSearch(page);
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.totalServices);
    }).toPass({ timeout: 3000 });

    // No results
    await searchServices(page, 'nonexistent-service-xyz');
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(0);
    }).toPass({ timeout: 3000 });
  });
});

// ============================================================================
// RANK FILTERING
// ============================================================================

test.describe('Rank Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should filter by rank when clicking stat card', async ({ page }) => {
    const ranks = [
      { name: 'Gold', count: expectedStats.ranks.gold },
      { name: 'Silver', count: expectedStats.ranks.silver },
      { name: 'Bronze', count: expectedStats.ranks.bronze },
    ];

    for (const rank of ranks) {
      // Click rank filter
      const rankStat = page.locator('.services-stats .stat-card').filter({ hasText: rank.name });
      await rankStat.click();

      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(rank.count);
      }).toPass({ timeout: 3000 });

      // Verify cards have correct rank
      const firstCard = page.locator('.service-card').first();
      await expect(firstCard).toContainText(rank.name);

      // Clear filter for next iteration (click twice to cycle through exclude, then clear)
      await rankStat.click();
      await rankStat.click();

      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(expectedStats.totalServices);
      }).toPass({ timeout: 3000 });
    }
  });

  test('should combine search with rank filter', async ({ page }) => {
    // Filter by Silver rank
    const silverStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Silver' });
    await silverStat.click();

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.ranks.silver);
    }).toPass({ timeout: 3000 });

    // Then search for "javascript"
    await searchServices(page, 'javascript');

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(1);
    }).toPass({ timeout: 3000 });

    const serviceCard = page.locator('.service-card').first();
    await expect(serviceCard).toContainText('test-repo-javascript');
    await expect(serviceCard).toContainText('Silver');
  });

  test('should show filter stat cards', async ({ page }) => {
    const filters = ['With API', 'Stale', 'Installed'];
    for (const filter of filters) {
      const stat = page.locator('.stat-card').filter({ hasText: filter });
      await expect(stat).toBeVisible();
    }
  });

  test('should update filtered count in dashboard', async ({ page }) => {
    const bronzeStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Bronze' });
    await bronzeStat.click();

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.ranks.bronze);
    }).toPass({ timeout: 3000 });
  });
});

// ============================================================================
// 3-STATE FILTERING
// ============================================================================

test.describe('StatCard 3-State Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Consolidated test: Task 4 - StatCard 3-State Filter Behavior
  // Combines: 3-state cycling, active styling, exclude styling, and cleared styling tests
  test('should cycle through 3-state filter with correct styling and behavior', async ({
    page,
  }) => {
    const goldStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Gold' });
    const initialCount = await getServiceCount(page);

    // First click → include mode (shows only Gold)
    await goldStat.click();
    await expect(goldStat).toHaveClass(/active/);
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.ranks.gold);
    }).toPass({ timeout: 3000 });

    // Second click → exclude mode (shows all except Gold)
    await goldStat.click();
    await expect(goldStat).toHaveClass(/exclude/);
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(initialCount - expectedStats.ranks.gold);
    }).toPass({ timeout: 3000 });

    // Third click → cleared (shows all)
    await goldStat.click();
    await expect(goldStat).not.toHaveClass(/active/);
    await expect(goldStat).not.toHaveClass(/excluded/);
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(initialCount);
    }).toPass({ timeout: 3000 });
  });
});

// ============================================================================
// STATIC ROUTING AND MOBILE CONTROL PLACEMENT
// ============================================================================

test.describe('Static routing compatibility', () => {
  test('preserves canonical and legacy hash routes across reload and history navigation', async ({
    page,
  }) => {
    await mockCatalogRequests(page);
    await page.goto('/scorecards/#/services');
    await waitForCatalogLoad(page);
    await expect(page).toHaveURL(/\/scorecards\/#\/services$/);

    await page.reload();
    await waitForCatalogLoad(page);
    await expect(page).toHaveURL(/\/scorecards\/#\/services$/);

    await page.locator('[data-view="teams"]').click();
    await expect(page).toHaveURL(/\/scorecards\/#\/teams$/);
    await expect(page.locator('.teams-grid')).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/scorecards\/#\/services$/);
    await waitForCatalogLoad(page);

    await page.goForward();
    await expect(page).toHaveURL(/\/scorecards\/#\/teams$/);
    await expect(page.locator('.teams-grid')).toBeVisible();

    await page.goto('/scorecards/#services');
    // A legacy fragment is canonicalized at document startup, not on hash-only navigation.
    await page.reload();
    await waitForCatalogLoad(page);
    await expect(page).toHaveURL(/\/scorecards\/#\/services$/);
    await page.goto('/scorecards/?filter=gold#services');
    await waitForCatalogLoad(page);
    await expect(page).toHaveURL(/\/scorecards\/\?filter=gold#\/services$/);

    await page.goto('/scorecards/#teams');
    await expect(page).toHaveURL(/\/scorecards\/#\/teams$/);
    await expect(page.locator('.teams-grid')).toBeVisible();
  });
});

test.describe('Teams catalog initialization', () => {
  test('derives registered and service-only teams after a delayed direct teams load and reload', async ({
    page,
  }) => {
    const delayedCatalog = {
      services: [
        {
          org: 'fixture',
          repo: 'platform-api',
          name: 'platform-api',
          team: 'Platform',
          score: 76,
          rank: 'gold',
          installed: false,
        },
        {
          org: 'fixture',
          repo: 'platform-worker',
          name: 'platform-worker',
          team: 'Platform',
          score: 80,
          rank: 'gold',
          installed: true,
        },
        {
          org: 'fixture',
          repo: 'reliability-tool',
          name: 'reliability-tool',
          team: 'Reliability',
          score: 91,
          rank: 'gold',
          installed: true,
        },
      ],
      generated_at: '2026-01-01T00:00:00Z',
      count: 3,
    };

    await mockCatalogRequests(page);
    let releaseCatalog;
    let catalogReady;
    await page.route(
      '**/raw.githubusercontent.com/**/registry/all-services.json*',
      async (route) => {
        await catalogReady;
        await route.fulfill({ json: delayedCatalog });
      }
    );

    for (const navigate of [() => page.goto('/scorecards/#/teams'), () => page.reload()]) {
      catalogReady = new Promise((resolve) => {
        releaseCatalog = resolve;
      });
      await navigate();

      const teamsGrid = page.locator('.teams-grid');
      await expect(teamsGrid.locator('.team-card')).toHaveCount(3);

      const platform = teamsGrid.locator('.team-card').filter({ hasText: 'Platform' });
      await expect(
        platform.locator('.team-stat').filter({ hasText: 'Services' }).locator('.team-stat-value')
      ).toHaveText('0');
      releaseCatalog();
      await expect(teamsGrid.locator('.team-card')).toHaveCount(4);
      await expect(
        platform.locator('.team-stat').filter({ hasText: 'Avg Score' }).locator('.team-stat-value')
      ).toHaveText('78');
      await expect(
        platform.locator('.team-stat').filter({ hasText: 'Services' }).locator('.team-stat-value')
      ).toHaveText('2');

      const reliability = teamsGrid.locator('.team-card').filter({ hasText: 'Reliability' });
      await expect(
        reliability
          .locator('.team-stat')
          .filter({ hasText: 'Avg Score' })
          .locator('.team-stat-value')
      ).toHaveText('91');
      await expect(
        reliability
          .locator('.team-stat')
          .filter({ hasText: 'Services' })
          .locator('.team-stat-value')
      ).toHaveText('1');
    }
  });
});

test.describe('Mobile catalog controls', () => {
  test('keeps Services controls in viewport before the first service card at 320px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await mockCatalogRequests(page);
    await page.goto('/scorecards/#/services');
    await waitForCatalogLoad(page);

    const controls = page
      .locator('.controls')
      .filter({
        has: page.locator('#search-input'),
      })
      .first();
    const requiredControls = [
      controls.locator('#search-input'),
      controls.locator('#sort-select'),
      controls.locator('.team-filter-toggle'),
      controls.locator('.check-filter-toggle'),
    ];

    for (const control of requiredControls) {
      await expect(control).toBeVisible();
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      expect(box.x + box.width).toBeLessThanOrEqual(320);
    }

    const [controlsBox, firstCardBox, dimensions] = await Promise.all([
      controls.boundingBox(),
      page.locator('.service-card').first().boundingBox(),
      page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      })),
    ]);
    expect(controlsBox).not.toBeNull();
    expect(firstCardBox).not.toBeNull();
    expect(controlsBox.y).toBeLessThan(firstCardBox.y);
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1);
  });
});
