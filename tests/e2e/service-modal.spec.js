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

  test('should display check categories', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const categories = modal.locator('.check-category');

    const count = await categories.count();
    expect(count).toBeGreaterThan(0); // Should have at least one category
  });

  test('should have all expected categories', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');

    // Check for expected categories (at minimum these should exist)
    await expect(modal.locator('.category-name').filter({ hasText: 'Scorecards Setup' })).toBeVisible();
    await expect(modal.locator('.category-name').filter({ hasText: 'Documentation' })).toBeVisible();
  });

  test('should show categories expanded by default', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const categories = modal.locator('.check-category');

    // Check that categories have the 'open' attribute
    const firstCategory = categories.first();
    const isOpen = await firstCategory.getAttribute('open');
    expect(isOpen).not.toBeNull(); // 'open' attribute should be present
  });

  test('should display category pass/fail stats', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const categoryStats = modal.locator('.category-stats');

    const count = await categoryStats.count();
    expect(count).toBeGreaterThan(0);

    // Stats should be in format "X/Y passed"
    await expect(categoryStats.first()).toContainText(/\d+\/\d+ passed/);
  });

  test('should be able to collapse and expand categories', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const firstCategory = modal.locator('.check-category').first();
    const firstCategoryHeader = firstCategory.locator('.check-category-header');

    // Category should start expanded
    let isOpen = await firstCategory.getAttribute('open');
    expect(isOpen).not.toBeNull();

    // Click to collapse
    await firstCategoryHeader.click();
    await page.waitForTimeout(100); // Wait for animation

    isOpen = await firstCategory.getAttribute('open');
    expect(isOpen).toBeNull(); // Should be collapsed now

    // Click to expand again
    await firstCategoryHeader.click();
    await page.waitForTimeout(100);

    isOpen = await firstCategory.getAttribute('open');
    expect(isOpen).not.toBeNull(); // Should be expanded again
  });

  test('should show checks within categories', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const firstCategory = modal.locator('.check-category').first();
    const checksInCategory = firstCategory.locator('.check-result');

    const count = await checksInCategory.count();
    expect(count).toBeGreaterThan(0); // Each category should have at least one check
  });
});

test.describe('Stale Scorecard Check Results (Case-Insensitive Categories)', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should group checks by category with case-insensitive matching', async ({ page }) => {
    // Use test-repo-perfect which has checks with title-case categories
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');

    // Verify categories are displayed and grouped correctly
    const categories = modal.locator('.check-category');
    const categoryCount = await categories.count();
    expect(categoryCount).toBeGreaterThan(0);

    // Verify specific categories are present
    // The fix ensures these display even if the data has different case
    await expect(modal.locator('.category-name').filter({ hasText: 'Documentation' })).toBeVisible();
    await expect(modal.locator('.category-name').filter({ hasText: 'Scorecards Setup' })).toBeVisible();
  });
});

test.describe('Mobile Tab Scroll Arrows', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should have scroll arrow buttons in tabs container on mobile', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const tabsContainer = modal.locator('.tabs-container');
    const leftArrow = modal.locator('.tabs-scroll-left');
    const rightArrow = modal.locator('.tabs-scroll-right');

    await expect(tabsContainer).toBeVisible();
    // Arrows exist in DOM (may not be visible depending on scroll state)
    await expect(leftArrow).toHaveCount(1);
    await expect(rightArrow).toHaveCount(1);
  });

  test('should show right arrow when tabs overflow on mobile', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    // Wait for scroll arrows to be initialized
    await page.waitForTimeout(200);

    const rightArrow = page.locator('.tabs-scroll-right');
    // Right arrow should be visible when there are more tabs to scroll
    await expect(rightArrow).toHaveClass(/visible/);
  });

  test('should hide left arrow initially on mobile', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    // Wait for scroll arrows to be initialized
    await page.waitForTimeout(200);

    const leftArrow = page.locator('.tabs-scroll-left');
    // Left arrow should not be visible at start (scrolled to beginning)
    await expect(leftArrow).not.toHaveClass(/visible/);
  });

  test('should scroll tabs and update arrow visibility when clicking arrows', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    // Wait for scroll arrows to be initialized
    await page.waitForTimeout(200);

    const tabs = page.locator('.tabs');
    const leftArrow = page.locator('.tabs-scroll-left');
    const rightArrow = page.locator('.tabs-scroll-right');

    // Get initial scroll position
    const initialScrollLeft = await tabs.evaluate(el => el.scrollLeft);
    expect(initialScrollLeft).toBe(0);

    // Click right arrow to scroll
    await rightArrow.click();
    await page.waitForTimeout(300); // Wait for smooth scroll

    // Verify tabs scrolled
    const scrolledPosition = await tabs.evaluate(el => el.scrollLeft);
    expect(scrolledPosition).toBeGreaterThan(0);

    // Left arrow should now be visible
    await expect(leftArrow).toHaveClass(/visible/);

    // Click left arrow to scroll back
    await leftArrow.click();
    await page.waitForTimeout(300);

    // Verify scrolled back toward start
    const finalScrollLeft = await tabs.evaluate(el => el.scrollLeft);
    expect(finalScrollLeft).toBeLessThan(scrolledPosition);
  });

  test('should not show scroll arrows on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await openServiceModal(page, 'test-repo-perfect');

    await page.waitForTimeout(200);

    const leftArrow = page.locator('.tabs-scroll-left');
    const rightArrow = page.locator('.tabs-scroll-right');

    // Arrows should be hidden (display: none) on desktop
    await expect(leftArrow).toBeHidden();
    await expect(rightArrow).toBeHidden();
  });
});
