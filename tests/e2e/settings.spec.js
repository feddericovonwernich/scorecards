import { test, expect } from './coverage.js';
import AxeBuilder from '@axe-core/playwright';

import { mockPAT, rateLimitResponses } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openSettingsModal,
  closeSettingsModal,
} from './test-helper.js';

test.describe('Settings Modal', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should open settings modal from header button', async ({ page }) => {
    await openSettingsModal(page);

    const modal = page.locator('#settings-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('Settings');
  });

  test('should close with X button', async ({ page }) => {
    await openSettingsModal(page);
    await closeSettingsModal(page);

    const modal = page.locator('#settings-modal');
    await expect(modal).not.toBeVisible();
  });

  test('should have no serious or critical accessibility violations', async ({ page }) => {
    let rate = rateLimitResponses.low;
    await page.route('**/api.github.com/rate_limit', route => route.fulfill({ json: { rate } }));
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => localStorage.setItem('theme', value), theme);
      for (const state of ['low', 'critical']) {
        rate = rateLimitResponses[state];
        await page.reload();
        await waitForCatalogLoad(page);
        await openSettingsModal(page);
        await expect(page.locator('.settings-rate-limit-current')).toHaveText(String(rate.remaining));
        const results = await new AxeBuilder({ page })
          .include('#settings-modal')
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();
        expect(results.violations.filter((violation) => (
          violation.impact === 'critical' || violation.impact === 'serious'
        )), `${theme} theme, ${state} rate limit`).toHaveLength(0);
        await closeSettingsModal(page);
      }
    }
  });

  test('should display all settings modal UI elements correctly', async ({ page }) => {
    await openSettingsModal(page);
    const modal = page.locator('#settings-modal');

    // Mode display
    await expect(modal).toContainText(/Public CDN|CDN/i);

    // PAT input
    const patInput = page.getByRole('textbox', { name: /Personal Access Token|PAT/i });
    await expect(patInput).toBeVisible();

    // Save Token button
    const saveButton = page.getByRole('button', { name: 'Save Token' });
    await expect(saveButton).toBeVisible();

    // Clear Token button
    const clearButton = page.getByRole('button', { name: 'Clear Token' });
    await expect(clearButton).toBeVisible();

    // Rate limit status
    await expect(modal).toContainText(/Rate Limit|Remaining/i);
    await expect(modal).toContainText(/60|Limit: 60/);

    // Check Rate button
    const checkButton = page.getByRole('button', { name: 'Check Rate' });
    await expect(checkButton).toBeVisible();

    await closeSettingsModal(page);
  });

  test('should display all accordion information sections', async ({ page }) => {
    await openSettingsModal(page);
    const modal = page.locator('#settings-modal');

    const accordion = modal.locator('.settings-accordion');
    await accordion.click();
    await expect(modal.locator('.settings-accordion-content')).toBeVisible();

    // Instructions
    await expect(modal).toContainText(/How to create/i);
    await expect(modal).toContainText(/workflow/i);

    // Benefits
    await expect(modal).toContainText(/Benefits/i);
    await expect(modal).toContainText(/faster/i);

    // Security
    await expect(modal).toContainText(/Security/i);
    await expect(modal).toContainText(/memory/i);

    await closeSettingsModal(page);
  });

  test('should complete PAT save workflow with all UI updates', async ({ page }) => {
    await openSettingsModal(page);
    const modal = page.locator('#settings-modal');

    await page.getByRole('textbox', { name: /Personal Access Token|PAT/i }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();

    // Switch to API mode
    await expect(modal).toContainText(/GitHub API|API mode/i, { timeout: 5000 });

    // Click Check Rate to update rate limit
    await page.getByRole('button', { name: 'Check Rate' }).click();

    // Update rate limit
    await expect(modal.locator('.settings-rate-limit')).toContainText(/5000/, { timeout: 5000 });

    await closeSettingsModal(page);

    // Settings button indicator
    const settingsButton = page.getByRole('button', { name: /Settings.*PAT/i });
    await expect(settingsButton).toBeVisible();
  });
});
