import { test, expect } from './coverage.js';
import { expectedStats, expectedServices, sortOptions } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
  getVisibleServiceNames,
  selectSort,
} from './test-helper.js';

test.describe('Catalog Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should load and display correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Scorecards Catalog');
    await expect(page.locator('header')).toContainText('Scorecards');
  });

  test('should display correct dashboard stats', async ({ page }) => {
    // Use .services-stats to target only the Services view stat cards
    const statsSection = page.locator('.services-stats');

    // Total Services
    const totalServices = await statsSection
      .locator('.stat-card')
      .filter({ hasText: 'Total Services' })
      .locator('.stat-value')
      .textContent();
    expect(totalServices.trim()).toBe(expectedStats.totalServices.toString());

    // Average Score (approximately)
    const avgScore = await statsSection
      .locator('.stat-card')
      .filter({ hasText: 'Average Score' })
      .locator('.stat-value')
      .textContent();
    const avgScoreNum = parseInt(avgScore.trim());
    expect(avgScoreNum).toBeGreaterThan(50);
    expect(avgScoreNum).toBeLessThan(60);

    // Gold rank count
    const goldCount = await statsSection
      .locator('.stat-card')
      .filter({ hasText: 'Gold' })
      .locator('.stat-value')
      .textContent();
    expect(goldCount.trim()).toBe(expectedStats.ranks.gold.toString());

    // Silver rank count
    const silverCount = await statsSection
      .locator('.stat-card')
      .filter({ hasText: 'Silver' })
      .locator('.stat-value')
      .textContent();
    expect(silverCount.trim()).toBe(expectedStats.ranks.silver.toString());

    // Bronze rank count
    const bronzeCount = await statsSection
      .locator('.stat-card')
      .filter({ hasText: 'Bronze' })
      .locator('.stat-value')
      .textContent();
    expect(bronzeCount.trim()).toBe(expectedStats.ranks.bronze.toString());
  });

  test('should render correct number of service cards', async ({ page }) => {
    const count = await getServiceCount(page);
    expect(count).toBe(expectedStats.totalServices);
  });

  test('should display service card details correctly', async ({ page }) => {
    // Check test-repo-perfect (Gold, score 76)
    const perfectCard = page.locator('.service-card').filter({ hasText: 'test-repo-perfect' }).first();
    await expect(perfectCard).toBeVisible();
    await expect(perfectCard).toContainText('76');
    await expect(perfectCard).toContainText('Gold');

    // Check test-repo-empty (Bronze, score 23)
    const emptyCard = page.locator('.service-card').filter({ hasText: 'test-repo-empty' }).first();
    await expect(emptyCard).toBeVisible();
    await expect(emptyCard).toContainText('23');
    await expect(emptyCard).toContainText('Bronze');
  });

  test('should have GitHub links on all service cards', async ({ page }) => {
    const githubLinks = page.locator('.service-card a[href*="github.com"]');
    const count = await githubLinks.count();
    expect(count).toBeGreaterThanOrEqual(expectedStats.totalServices);
  });

  test('should display installation PR badges when present', async ({ page }) => {
    // test-repo-edge-cases should have an installation PR badge
    const edgeCasesCard = page.locator('.service-card').filter({ hasText: 'test-repo-edge-cases' }).first();
    const prBadge = edgeCasesCard.locator('a[href*="/pull/"]');
    await expect(prBadge).toBeVisible();
  });

  test('should sort by "Score: High to Low" by default', async ({ page }) => {
    const names = await getVisibleServiceNames(page);
    // First service should be test-repo-stale (highest score: 80)
    expect(names[0]).toBe('test-repo-stale');
    // Last service should be test-repo-empty (lowest score: 23)
    expect(names[names.length - 1]).toBe('test-repo-empty');
  });

  test('should sort by "Score: Low to High"', async ({ page }) => {
    await selectSort(page, 'Score: Low to High');

    // Wait for sort to apply and verify first service
    await expect(async () => {
      const names = await getVisibleServiceNames(page);
      expect(names[0]).toBe('test-repo-empty');
    }).toPass({ timeout: 3000 });

    const names = await getVisibleServiceNames(page);
    // First service should be test-repo-empty (lowest score: 23)
    expect(names[0]).toBe('test-repo-empty');
    // Last service should be test-repo-stale (highest score: 80)
    expect(names[names.length - 1]).toBe('test-repo-stale');
  });

  test('should sort by "Name: A to Z"', async ({ page }) => {
    await selectSort(page, 'Name: A to Z');

    // Wait for sort to apply and verify first service
    await expect(async () => {
      const names = await getVisibleServiceNames(page);
      expect(names[0]).toBe('test-repo-edge-cases');
    }).toPass({ timeout: 3000 });

    const names = await getVisibleServiceNames(page);
    // Should start with 'test-repo-edge-cases' (alphabetically first)
    expect(names[0]).toBe('test-repo-edge-cases');
    // Should end with 'test-repo-stale' (alphabetically last)
    expect(names[names.length - 1]).toBe('test-repo-stale');
  });

  test('should sort by "Name: Z to A"', async ({ page }) => {
    await selectSort(page, 'Name: Z to A');

    // Wait for sort to apply and verify first service
    await expect(async () => {
      const names = await getVisibleServiceNames(page);
      expect(names[0]).toBe('test-repo-stale');
    }).toPass({ timeout: 3000 });

    const names = await getVisibleServiceNames(page);
    // Should start with 'test-repo-stale' (alphabetically last)
    expect(names[0]).toBe('test-repo-stale');
    // Should end with 'test-repo-edge-cases' (alphabetically first)
    expect(names[names.length - 1]).toBe('test-repo-edge-cases');
  });

  test('should have refresh data button', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: 'Refresh Data' });
    await expect(refreshButton).toBeVisible();
  });

  test('should have re-run all stale button', async ({ page }) => {
    const rerunButton = page.getByRole('button', { name: 'Re-run All Stale' });
    await expect(rerunButton).toBeVisible();
  });

  test('should have settings button', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: 'Settings' });
    await expect(settingsButton).toBeVisible();
  });

  test('should display footer with documentation link', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Powered by Scorecards');
    const docLink = footer.locator('a', { hasText: 'Documentation' });
    await expect(docLink).toBeVisible();
  });

  test('should have GitHub Actions widget button', async ({ page }) => {
    const widgetButton = page.getByRole('button', { name: 'Show GitHub Actions' });
    await expect(widgetButton).toBeVisible();
  });
});
