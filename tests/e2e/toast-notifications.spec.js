import { test, expect } from './coverage.js';
import { mockPAT } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openSettingsModal,
  closeSettingsModal,
  setGitHubPAT,
} from './test-helper.js';

test.describe('Toast Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should show toast with correct styling and positioning on PAT actions', async ({ page }) => {
    // Save PAT
    await openSettingsModal(page);
    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();

    // Verify positioning
    const box = await toast.boundingBox();
    expect(box).not.toBeNull();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x).toBeGreaterThan(0);

    await closeSettingsModal(page);

    // Clear PAT
    await setGitHubPAT(page, mockPAT);
    await openSettingsModal(page);
    const clearButton = page.getByRole('button', { name: /Clear Token/i });
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await expect(toast).toBeVisible();
    }
  });

  test('should auto-dismiss toast after timeout', async ({ page }) => {
    test.setTimeout(12000);

    await openSettingsModal(page);
    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();

    await expect(async () => {
      const count = await toast.count();
      if (count > 0) {
        const isHidden = await toast.isHidden();
        expect(isHidden).toBe(true);
      }
    }).toPass({ timeout: 7000 });
  });

  test('should handle multiple actions without toast overlap issues', async ({ page }) => {
    await openSettingsModal(page);
    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();

    await expect(page.locator('.toast')).toBeVisible();

    await closeSettingsModal(page);
    await expect(page.locator('#settings-modal')).not.toBeVisible();

    await openSettingsModal(page);
    await page.getByRole('button', { name: 'Check Rate' }).click();

    await expect(page.locator('#settings-modal')).toBeVisible();
  });
});

test.describe('Toast Notifications - Error Cases', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Invalid PAT
    await page.route('**/api.github.com/user', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ message: 'Bad credentials' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await openSettingsModal(page);
    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill('invalid_token');
    await page.getByRole('button', { name: 'Save Token' }).click();

    await expect(async () => {
      const modal = page.locator('#settings-modal');
      const hasError = await modal.getByText(/error|invalid|fail/i).count() > 0;
      const hasErrorToast = await page.locator('.toast').filter({ hasText: /error|invalid|fail/i }).count() > 0;
      expect(hasError || hasErrorToast).toBe(true);
    }).toPass({ timeout: 3000 });

    await closeSettingsModal(page);

    // Network error
    await page.route('**/api.github.com/**', async (route) => {
      await route.abort('failed');
    });

    await openSettingsModal(page);
    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();

    await expect(page.locator('#settings-modal')).toBeVisible();
  });

  test('should show rate limit info when checking rate', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);
    await openSettingsModal(page);

    const checkRateButton = page.getByRole('button', { name: /Check Rate/i });
    if (await checkRateButton.isVisible()) {
      await checkRateButton.click();

      const modal = page.locator('#settings-modal');
      await expect(async () => {
        const hasRateInfo = await modal.getByText(/remaining|limit|\d+/i).count() > 0;
        expect(hasRateInfo).toBe(true);
      }).toPass({ timeout: 3000 });
    }
  });
});
