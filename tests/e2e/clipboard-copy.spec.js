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

  test('should have copy buttons in Badges tab', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButtons = modal.getByRole('button', { name: 'Copy' });
    const count = await copyButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should copy score badge markdown when clicking Copy', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();
    await copyButton.click();

    // Verify clipboard content
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('![Score]');
    expect(clipboardContent).toContain('img.shields.io');
  });

  test('should copy rank badge markdown when clicking second Copy', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButtons = modal.getByRole('button', { name: 'Copy' });
    const secondCopyButton = copyButtons.nth(1);
    await secondCopyButton.click();

    // Verify clipboard content
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('![Rank]');
    expect(clipboardContent).toContain('img.shields.io');
  });

  test('should show Copied! feedback state', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();
    await copyButton.click();

    // Should show "Copied!" text
    await expect(modal).toContainText(/Copied/i);
  });

  test('should reset to Copy after timeout', async ({ page }) => {
    // This test needs extra time to wait for the reset timer
    test.setTimeout(10000);

    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();
    await copyButton.click();

    // Should show "Copied!"
    await expect(modal).toContainText(/Copied/i);

    // Wait for reset using state-based polling
    await expect(async () => {
      const resetButton = modal.getByRole('button', { name: 'Copy' }).first();
      await expect(resetButton).toBeVisible();
    }).toPass({ timeout: 5000 });
  });

  test('should include correct repo in badge URL', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();
    await copyButton.click();

    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('test-repo-perfect');
  });

  test('should include correct org in badge URL', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();
    await copyButton.click();

    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('feddericovonwernich');
  });

  test('should handle multiple consecutive copies', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButtons = modal.getByRole('button', { name: 'Copy' });

    // Copy first badge
    await copyButtons.first().click();
    await expect(modal).toContainText(/Copied/i);

    // Copy second badge (may need to wait for button to be available again)
    const secondButton = copyButtons.nth(1);
    if (await secondButton.isVisible()) {
      await secondButton.click();
    }

    // Both should work without error
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toBeTruthy();
  });
});

test.describe('Clipboard Fallback Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

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

  test('should have valid markdown image syntax', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();
    await copyButton.click();

    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());

    // Should match markdown image pattern: ![alt](url)
    expect(clipboardContent).toMatch(/!\[.+\]\(.+\)/);
  });

  test('should use shields.io endpoint URL', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();
    await copyButton.click();

    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('https://img.shields.io/endpoint');
  });

  test('should reference catalog badges path', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();
    await copyButton.click();

    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('catalog/badges');
  });

  test('should reference score.json for score badge', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();
    await copyButton.click();

    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('score.json');
  });

  test('should reference rank.json for rank badge', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButtons = modal.getByRole('button', { name: 'Copy' });
    const rankCopyButton = copyButtons.nth(1);
    await rankCopyButton.click();

    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('rank.json');
  });
});
