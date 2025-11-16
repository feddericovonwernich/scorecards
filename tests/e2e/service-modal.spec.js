import { test, expect } from '@playwright/test';
import { expectedChecks } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openServiceModal,
  closeServiceModal,
} from './test-helper.js';

test.describe('Service Modal', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should open when clicking service card', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('test-repo-perfect');
  });

  test('should close with X button', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await closeServiceModal(page);

    const modal = page.locator('#service-modal');
    await expect(modal).not.toBeVisible();
  });

  test('should close with Escape key', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const modal = page.locator('#service-modal');
    await expect(modal).not.toBeVisible();
  });

  test('should display correct service name, score, and rank', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    await expect(modal.locator('h2')).toContainText('test-repo-perfect');
    await expect(modal).toContainText('76');
    await expect(modal).toContainText('Gold');
  });

  test('should show all check results', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    // Wait for Check Results tab to be active (should be default)
    const modal = page.locator('#service-modal');
    const checkResults = modal.locator('.check-result');

    const count = await checkResults.count();
    expect(count).toBeGreaterThanOrEqual(10); // Should have at least 10 checks
  });

  test('should display pass checks with checkmark', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const passedChecks = modal.locator('.check-result').filter({ hasText: '✓' });

    const count = await passedChecks.count();
    expect(count).toBeGreaterThan(0);

    // Check that README Documentation check passes
    const readmeCheck = modal.locator('.check-result').filter({ hasText: 'README Documentation' });
    await expect(readmeCheck).toContainText('✓');
  });

  test('should display fail checks with X icon', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const failedChecks = modal.locator('.check-result').filter({ hasText: '✗' });

    const count = await failedChecks.count();
    expect(count).toBeGreaterThan(0);

    // Check that Scorecard Configuration check fails
    const configCheck = modal.locator('.check-result').filter({ hasText: 'Scorecard Configuration' });
    await expect(configCheck).toContainText('✗');
  });

  test('should display check output text', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    // Look for output section
    const outputSection = modal.locator('strong', { hasText: 'Output:' }).first();
    await expect(outputSection).toBeVisible();
  });

  test('should display check weights', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    // Weight should be shown in format "Weight: XX"
    const weightText = modal.getByText(/Weight: \d+/);
    await expect(weightText.first()).toBeVisible();
  });

  test('should display checks passed summary', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    // The summary is split across two elements:
    // <div class="modal-stat-value">6/10</div>
    // <div class="modal-stat-label">Checks Passed</div>
    const statValue = modal.locator('.modal-stat-value').filter({ hasText: /^\d+\/\d+$/ });
    const statLabel = modal.locator('.modal-stat-label').filter({ hasText: 'Checks Passed' });

    await expect(statValue).toBeVisible();
    await expect(statLabel).toBeVisible();
  });

  test('should have Contributors tab', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const contributorsTab = page.getByRole('button', { name: 'Contributors' });
    await expect(contributorsTab).toBeVisible();
  });

  test('should switch to Contributors tab', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const contributorsTab = page.getByRole('button', { name: 'Contributors' });
    await contributorsTab.click();

    // Should show contributors heading or content
    const modal = page.locator('#service-modal');
    await expect(modal).toContainText(/Recent Contributors|Contributors/i);
  });

  test('should have Workflow Runs tab', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const workflowTab = page.getByRole('button', { name: 'Workflow Runs' });
    await expect(workflowTab).toBeVisible();
  });

  test('should show PAT prompt in Workflow Runs tab when no token', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const workflowTab = page.getByRole('button', { name: 'Workflow Runs' });
    await workflowTab.click();

    // Should show message about needing PAT
    const modal = page.locator('#service-modal');
    await expect(modal).toContainText(/GitHub Personal Access Token required|PAT required/i);
  });

  test('should have Badges tab', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const badgesTab = page.getByRole('button', { name: 'Badges' });
    await expect(badgesTab).toBeVisible();
  });

  test('should show badge previews in Badges tab', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const badgesTab = page.getByRole('button', { name: 'Badges' });
    await badgesTab.click();

    const modal = page.locator('#service-modal');
    // Should show badge preview images
    const badgeImages = modal.locator('img[alt*="Badge"]');
    const count = await badgeImages.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show markdown snippets in Badges tab', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const badgesTab = page.getByRole('button', { name: 'Badges' });
    await badgesTab.click();

    const modal = page.locator('#service-modal');
    // Should contain markdown code with img.shields.io URL
    await expect(modal).toContainText('img.shields.io');
    await expect(modal).toContainText('![Score]');
  });

  test('should have copy buttons for badge markdown', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const badgesTab = page.getByRole('button', { name: 'Badges' });
    await badgesTab.click();

    const modal = page.locator('#service-modal');
    const copyButtons = modal.getByRole('button', { name: 'Copy' });
    const count = await copyButtons.count();
    expect(count).toBeGreaterThanOrEqual(2); // At least 2 badges (score and rank)
  });

  test('should have View on GitHub link', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const githubLink = modal.locator('a', { hasText: 'View on GitHub' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', /github\.com.*test-repo-perfect/);
  });

  test('should have Refresh Data button', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const refreshButton = modal.getByRole('button', { name: 'Refresh Data' });
    await expect(refreshButton).toBeVisible();
  });
});
