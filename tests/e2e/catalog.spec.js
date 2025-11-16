import { test, expect } from '@playwright/test';
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
    await expect(page.locator('h1')).toContainText('Scorecards Catalog');
  });

  test('should display correct dashboard stats', async ({ page }) => {
    // Total Services
    const totalServices = await page
      .locator('.stat-card')
      .filter({ hasText: 'Total Services' })
      .locator('.stat-value')
      .textContent();
    expect(totalServices.trim()).toBe(expectedStats.totalServices.toString());

    // Average Score (approximately)
    const avgScore = await page
      .locator('.stat-card')
      .filter({ hasText: 'Average Score' })
      .locator('.stat-value')
      .textContent();
    const avgScoreNum = parseInt(avgScore.trim());
    expect(avgScoreNum).toBeGreaterThan(50);
    expect(avgScoreNum).toBeLessThan(60);

    // Gold rank count
    const goldCount = await page
      .locator('.stat-card')
      .filter({ hasText: 'Gold' })
      .locator('.stat-value')
      .textContent();
    expect(goldCount.trim()).toBe(expectedStats.ranks.gold.toString());

    // Silver rank count
    const silverCount = await page
      .locator('.stat-card')
      .filter({ hasText: 'Silver' })
      .locator('.stat-value')
      .textContent();
    expect(silverCount.trim()).toBe(expectedStats.ranks.silver.toString());

    // Bronze rank count
    const bronzeCount = await page
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
    // First service should be test-repo-perfect (highest score: 76)
    expect(names[0]).toBe('test-repo-perfect');
    // Last service should be test-repo-empty (lowest score: 23)
    expect(names[names.length - 1]).toBe('test-repo-empty');
  });

  test('should sort by "Score: Low to High"', async ({ page }) => {
    await selectSort(page, 'Score: Low to High');
    await page.waitForTimeout(300); // Wait for re-render

    const names = await getVisibleServiceNames(page);
    // First service should be test-repo-empty (lowest score: 23)
    expect(names[0]).toBe('test-repo-empty');
    // Last service should be test-repo-perfect (highest score: 76)
    expect(names[names.length - 1]).toBe('test-repo-perfect');
  });

  test('should sort by "Name: A to Z"', async ({ page }) => {
    await selectSort(page, 'Name: A to Z');
    await page.waitForTimeout(300);

    const names = await getVisibleServiceNames(page);
    // Should start with 'test-repo-edge-cases' (alphabetically first)
    expect(names[0]).toBe('test-repo-edge-cases');
    // Should end with 'test-repo-python' (alphabetically last)
    expect(names[names.length - 1]).toBe('test-repo-python');
  });

  test('should sort by "Name: Z to A"', async ({ page }) => {
    await selectSort(page, 'Name: Z to A');
    await page.waitForTimeout(300);

    const names = await getVisibleServiceNames(page);
    // Should start with 'test-repo-python' (alphabetically last)
    expect(names[0]).toBe('test-repo-python');
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
