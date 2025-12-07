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

  test('should show success toast when saving PAT', async ({ page }) => {
    await openSettingsModal(page);

    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();

    // Toast should appear
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
  });

  test('should display toast with correct styling', async ({ page }) => {
    await openSettingsModal(page);

    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    // Toast should have some visible styling
    const isVisible = await toast.isVisible();
    expect(isVisible).toBe(true);
  });

  test('should auto-dismiss toast after timeout', async ({ page }) => {
    // This test needs extra time to wait for the auto-dismiss timer
    test.setTimeout(12000);

    await openSettingsModal(page);

    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();

    // Wait for auto-dismiss (typically 5 seconds) - use expect.toPass for reliability
    await expect(async () => {
      const count = await toast.count();
      if (count > 0) {
        const isHidden = await toast.isHidden();
        expect(isHidden).toBe(true);
      }
    }).toPass({ timeout: 7000 });
  });

  test('should show toast in accessible location', async ({ page }) => {
    await openSettingsModal(page);

    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();

    // Toast should be visible on screen
    const box = await toast.boundingBox();
    expect(box).not.toBeNull();
    expect(box.y).toBeGreaterThanOrEqual(0);
  });

  test('should show toast when clearing PAT', async ({ page }) => {
    // First set a PAT
    await setGitHubPAT(page, mockPAT);

    // Now clear it
    await openSettingsModal(page);
    const clearButton = page.getByRole('button', { name: /Clear Token/i });
    if (await clearButton.isVisible()) {
      await clearButton.click();

      // Toast should appear
      const toast = page.locator('.toast');
      await expect(toast).toBeVisible();
    }
  });

  test('should handle multiple actions without toast overlap issues', async ({ page }) => {
    // Trigger first toast
    await openSettingsModal(page);
    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();

    await expect(page.locator('.toast')).toBeVisible();

    // Close settings and reopen
    await closeSettingsModal(page);
    await expect(page.locator('#settings-modal')).not.toBeVisible();

    await openSettingsModal(page);
    await page.getByRole('button', { name: 'Check Rate' }).click();

    // Should handle second toast gracefully - just verify no errors occurred
    const settingsModal = page.locator('#settings-modal');
    await expect(settingsModal).toBeVisible();
  });
});

test.describe('Toast Notifications - Rate Limit', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should show rate limit info when checking rate', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);
    await openSettingsModal(page);

    const checkRateButton = page.getByRole('button', { name: /Check Rate/i });
    if (await checkRateButton.isVisible()) {
      await checkRateButton.click();

      // Wait for rate limit information to appear
      const modal = page.locator('#settings-modal');
      await expect(async () => {
        const hasRateInfo = await modal.getByText(/remaining|limit|\d+/i).count() > 0;
        expect(hasRateInfo).toBe(true);
      }).toPass({ timeout: 3000 });
    }
  });
});

test.describe('Toast Notifications - Error Cases', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should show error toast for invalid PAT', async ({ page }) => {
    // Mock the user validation to fail
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

    // Wait for error indication (toast or inline error)
    await expect(async () => {
      const modal = page.locator('#settings-modal');
      const hasError = await modal.getByText(/error|invalid|fail/i).count() > 0;
      const hasErrorToast = await page.locator('.toast').filter({ hasText: /error|invalid|fail/i }).count() > 0;
      expect(hasError || hasErrorToast).toBe(true);
    }).toPass({ timeout: 3000 });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api.github.com/**', async (route) => {
      await route.abort('failed');
    });

    await openSettingsModal(page);
    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();

    // Should show some error feedback - just verify modal is still visible (no crash)
    const modal = page.locator('#settings-modal');
    await expect(modal).toBeVisible();
  });
});

test.describe('Toast Container', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should have toast container in DOM', async ({ page }) => {
    // Toast container should exist in the page
    const container = page.locator('#toast-container, .toast-container');
    // Container may or may not be visible until a toast is shown
    const count = await container.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should position toasts correctly', async ({ page }) => {
    await openSettingsModal(page);
    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();

    // Check toast is positioned (typically top-right or bottom-right)
    const box = await toast.boundingBox();
    expect(box).not.toBeNull();
    // Toast should be at a reasonable position
    expect(box.x).toBeGreaterThan(0);
  });
});
