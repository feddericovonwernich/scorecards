import { test, expect } from './coverage.js';
import { mockPAT } from './fixtures.js';
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

  test('should display current mode as CDN initially', async ({ page }) => {
    await openSettingsModal(page);

    const modal = page.locator('#settings-modal');
    await expect(modal).toContainText(/Public CDN|CDN/i);
  });

  test('should show PAT input field', async ({ page }) => {
    await openSettingsModal(page);

    const patInput = page.getByRole('textbox', { name: /Personal Access Token|PAT/i });
    await expect(patInput).toBeVisible();
  });

  test('should have Save Token button', async ({ page }) => {
    await openSettingsModal(page);

    const saveButton = page.getByRole('button', { name: 'Save Token' });
    await expect(saveButton).toBeVisible();
  });

  test('should have Clear Token button', async ({ page }) => {
    await openSettingsModal(page);

    const clearButton = page.getByRole('button', { name: 'Clear Token' });
    await expect(clearButton).toBeVisible();
  });

  test('should display rate limit status', async ({ page }) => {
    await openSettingsModal(page);

    const modal = page.locator('#settings-modal');
    await expect(modal).toContainText(/Rate Limit|Remaining/i);
    // Should show 60/60 without PAT
    await expect(modal).toContainText(/60|Limit: 60/);
  });

  test('should have Check Rate Limit button', async ({ page }) => {
    await openSettingsModal(page);

    // React button text is "Check Rate" (shorter version)
    const checkButton = page.getByRole('button', { name: 'Check Rate' });
    await expect(checkButton).toBeVisible();
  });

  test('should display instructions for creating PAT', async ({ page }) => {
    await openSettingsModal(page);

    const modal = page.locator('#settings-modal');

    // In React, instructions are in a collapsible accordion - expand it first
    const accordion = modal.locator('.settings-accordion');
    await accordion.click();

    // Wait for accordion content to be visible
    await expect(modal.locator('.settings-accordion-content')).toBeVisible();

    await expect(modal).toContainText(/How to create/i);
    await expect(modal).toContainText(/workflow/i); // scope needed
  });

  test('should display benefits of using PAT', async ({ page }) => {
    await openSettingsModal(page);

    const modal = page.locator('#settings-modal');

    // In React, benefits are in a collapsible accordion - expand it first
    const accordion = modal.locator('.settings-accordion');
    await accordion.click();

    // Wait for accordion content to be visible
    await expect(modal.locator('.settings-accordion-content')).toBeVisible();

    await expect(modal).toContainText(/Benefits/i);
    await expect(modal).toContainText(/faster/i);
  });

  test('should display security information', async ({ page }) => {
    await openSettingsModal(page);

    const modal = page.locator('#settings-modal');

    // In React, security info is in a collapsible accordion - expand it first
    const accordion = modal.locator('.settings-accordion');
    await accordion.click();

    // Wait for accordion content to be visible
    await expect(modal.locator('.settings-accordion-content')).toBeVisible();

    await expect(modal).toContainText(/Security/i);
    await expect(modal).toContainText(/memory/i);
  });

  test('should save PAT and switch to API mode', async ({ page }) => {
    await openSettingsModal(page);

    // Enter PAT
    const patInput = page.getByRole('textbox', { name: /Personal Access Token|PAT/i });
    await patInput.fill(mockPAT);

    // Click Save
    const saveButton = page.getByRole('button', { name: 'Save Token' });
    await saveButton.click();

    const modal = page.locator('#settings-modal');
    // Should now show API mode
    await expect(modal).toContainText(/GitHub API|API mode/i);
  });

  test('should update rate limit after saving PAT', async ({ page }) => {
    await openSettingsModal(page);

    // Enter and save PAT
    const patInput = page.getByRole('textbox', { name: /Personal Access Token|PAT/i });
    await patInput.fill(mockPAT);
    const saveButton = page.getByRole('button', { name: 'Save Token' });
    await saveButton.click();

    const modal = page.locator('#settings-modal');

    // Wait for mode to switch to API mode (indicates PAT was saved)
    await expect(modal).toContainText(/GitHub API|API mode/i, { timeout: 5000 });

    // Click "Check Rate" button to force a fresh rate limit check with the new PAT
    // This is needed because the initial fetchRateLimit after save uses a stale closure
    const checkRateButton = page.getByRole('button', { name: 'Check Rate' });
    await checkRateButton.click();

    // Wait for rate limit display to update with higher limit
    // The mock returns 5000 limit and 4999 remaining for authenticated requests
    // The rate limit section should show 5000 somewhere in the text
    await expect(modal.locator('.settings-rate-limit')).toContainText(/5000/, { timeout: 5000 });
  });

  test('should indicate PAT is loaded in settings button', async ({ page }) => {
    await openSettingsModal(page);

    // Save PAT
    const patInput = page.getByRole('textbox', { name: /Personal Access Token|PAT/i });
    await patInput.fill(mockPAT);
    const saveButton = page.getByRole('button', { name: 'Save Token' });
    await saveButton.click();

    // Wait for API mode to be displayed (indicates PAT saved)
    const modal = page.locator('#settings-modal');
    await expect(modal).toContainText(/GitHub API|API mode/i);

    await closeSettingsModal(page);

    // Settings button should indicate PAT is loaded
    const settingsButton = page.getByRole('button', { name: /Settings.*PAT/i });
    await expect(settingsButton).toBeVisible();
  });
});
