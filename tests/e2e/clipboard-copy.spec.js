import { test, expect } from './coverage.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openServiceModal,
} from './test-helper.js';

/**
 * Click a Service Modal tab by name
 * @param {import('@playwright/test').Page} page
 * @param {string} tabName
 */
async function clickServiceModalTab(page, tabName) {
  const modal = page.locator('#service-modal');
  const tab = modal.getByRole('button', { name: tabName });
  await tab.click();
  // Wait for tab content to be visible
  await expect(modal.locator('.tab-content, [class*="tab-content"]')).toBeVisible();
}


test.describe('Clipboard Copy Functionality', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Consolidated test: Task 13 - Badge Copy Button Variations
  // Combines: have copy buttons, copy rank badge, handle consecutive copies
  test('should have multiple copy buttons and handle consecutive copies of score and rank badges', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButtons = modal.getByRole('button', { name: 'Copy' });

    // Multiple copy buttons exist
    const count = await copyButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Second button (rank)
    await copyButtons.nth(1).click();
    let clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('![Rank]');
    expect(clipboardContent).toContain('img.shields.io');

    // Feedback shown
    await expect(modal).toContainText(/Copied/i);

    // Multiple consecutive copies
    await page.waitForTimeout(100);
    await copyButtons.first().click();
    clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toBeTruthy();
  });

  // Consolidated test: Task 2 - Clipboard Copy Complete Journey
  // Combines: copy score badge, show feedback, reset after timeout
  test('should copy badge markdown, show feedback, and reset after timeout', async ({ page }) => {
    // This test needs extra time to wait for the reset timer
    test.setTimeout(10000);

    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();

    // Copy badge
    await copyButton.click();
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('![Score]');
    expect(clipboardContent).toContain('img.shields.io');

    // Feedback shown
    await expect(modal).toContainText(/Copied/i);

    // Wait for reset using state-based polling
    await expect(async () => {
      const resetButton = modal.getByRole('button', { name: 'Copy' }).first();
      await expect(resetButton).toBeVisible();
    }).toPass({ timeout: 5000 });
  });

  // Consolidated test: Task 3 - Badge URL Content Validation
  // Combines: correct repo and org in badge URL
  test('should include correct org and repo in badge URL', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();
    await copyButton.click();

    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('test-repo-perfect');
    expect(clipboardContent).toContain('feddericovonwernich');
  });
});

test.describe('Clipboard Fallback Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Keep unchanged - error handling with unique mock setup
  test('should handle clipboard API unavailable', async ({ page }) => {
    // Override clipboard API to simulate failure
    await page.evaluate(() => {
      navigator.clipboard.writeText = () => Promise.reject(new Error('Clipboard not available'));
    });

    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();

    // Click should not crash the app
    await copyButton.click();

    // Modal should still be visible
    await expect(modal).toBeVisible();
  });

  // Keep unchanged - fallback behavior test
  test('should display markdown snippets even without clipboard', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');

    // Markdown should be visible for manual copying
    await expect(modal).toContainText('![Score]');
    await expect(modal).toContainText('![Rank]');
    await expect(modal).toContainText('img.shields.io');
  });
});

test.describe('Badge Markdown Content', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Consolidated test: Task 4 - Badge Markdown Format Validation
  // Combines: valid markdown syntax, shields.io endpoint, catalog badges path
  test('should generate valid markdown with shields.io URL and catalog badges path', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();
    await copyButton.click();

    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());

    // Valid markdown syntax
    expect(clipboardContent).toMatch(/!\[.+\]\(.+\)/);

    // Shields.io endpoint
    expect(clipboardContent).toContain('https://img.shields.io/endpoint');

    // Catalog badges path
    expect(clipboardContent).toContain('catalog/badges');
  });

  // Consolidated test: Task 5 - Badge Type Specific Markdown
  // Combines: score.json for score badge, rank.json for rank badge
  test('should reference correct JSON files for score and rank badges', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButtons = modal.getByRole('button', { name: 'Copy' });

    // First copy button (score)
    await copyButtons.first().click();
    let clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('score.json');

    // Second copy button (rank)
    await copyButtons.nth(1).click();
    clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('rank.json');
  });
});
