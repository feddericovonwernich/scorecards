import { test, expect } from '@playwright/test';
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

    const checkButton = page.getByRole('button', { name: 'Check Rate Limit' });
    await expect(checkButton).toBeVisible();
  });

  test('should display instructions for creating PAT', async ({ page }) => {
    await openSettingsModal(page);

    const modal = page.locator('#settings-modal');
    await expect(modal).toContainText(/How to create/i);
    await expect(modal).toContainText(/workflow/i); // scope needed
  });

  test('should display benefits of using PAT', async ({ page }) => {
    await openSettingsModal(page);

    const modal = page.locator('#settings-modal');
    await expect(modal).toContainText(/Benefits/i);
    await expect(modal).toContainText(/faster/i);
  });

  test('should display security information', async ({ page }) => {
    await openSettingsModal(page);

    const modal = page.locator('#settings-modal');
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

    // Wait for notification
    await page.waitForTimeout(1000);

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

    // Wait for rate limit to update
    await page.waitForTimeout(1500);

    const modal = page.locator('#settings-modal');
    // Should now show higher limit (5000 instead of 60)
    await expect(modal).toContainText(/5000|4[0-9]{3}/);
  });

  test('should indicate PAT is loaded in settings button', async ({ page }) => {
    await openSettingsModal(page);

    // Save PAT
    const patInput = page.getByRole('textbox', { name: /Personal Access Token|PAT/i });
    await patInput.fill(mockPAT);
    const saveButton = page.getByRole('button', { name: 'Save Token' });
    await saveButton.click();
    await page.waitForTimeout(1000);

    await closeSettingsModal(page);

    // Settings button should indicate PAT is loaded
    const settingsButton = page.getByRole('button', { name: /Settings.*PAT/i });
    await expect(settingsButton).toBeVisible();
  });
});
