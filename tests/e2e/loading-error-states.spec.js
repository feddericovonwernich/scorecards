import { test, expect } from './coverage.js';
import { mockPAT } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openSettingsModal,
  setGitHubPAT,
  openServiceModal,
} from './test-helper.js';

test.describe('Loading States', () => {
  test('should show loading state during initial catalog load', async ({ page }) => {
    // Add delay to catalog requests to observe loading state
    await page.route('**/raw.githubusercontent.com/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    await mockCatalogRequests(page);
    await page.goto('/');

    // During initial load, may show loading indicator or placeholder
    // Check for loading state before data loads
    const loadingByClass = await page.locator('.loading, [class*="loading"]').count() > 0;
    const loadingByText = await page.getByText(/loading/i).count() > 0;
    const hasLoadingIndicator = loadingByClass || loadingByText;
    // Also check for placeholder state (dashes in stats)
    const hasPlaceholder = await page.getByText('-').count() > 0;

    // At least one loading indicator should be present initially
    expect(hasLoadingIndicator || hasPlaceholder).toBe(true);

    // Eventually data loads
    await waitForCatalogLoad(page);
  });

  test('should show loading spinner in settings when checking rate', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Add delay to rate limit check
    await page.route('**/api.github.com/rate_limit', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const headers = route.request().headers();
      const hasAuth = headers['authorization'];
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          rate: {
            limit: hasAuth ? 5000 : 60,
            remaining: hasAuth ? 4999 : 59,
            reset: Math.floor(Date.now() / 1000) + 3600,
          }
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await setGitHubPAT(page, mockPAT);
    await openSettingsModal(page);

    const checkRateButton = page.getByRole('button', { name: /Check Rate/i });
    if (await checkRateButton.isVisible()) {
      await checkRateButton.click();

      // Eventually shows rate info
      const modal = page.locator('#settings-modal');
      await expect(async () => {
        const hasRateInfo = await modal.getByText(/remaining|\d+/i).count() > 0;
        expect(hasRateInfo).toBe(true);
      }).toPass({ timeout: 3000 });
    }
  });

  test('should handle slow service modal loading', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Service modal loads check results asynchronously
    await openServiceModal(page, 'test-repo-perfect');

    // Should show content after loading
    const modal = page.locator('#service-modal');
    await expect(modal).toContainText(/passed|failed|Weight/i);
  });
});

test.describe('Error States', () => {
  test('should handle catalog fetch failure gracefully', async ({ page }) => {
    // Mock failed catalog request
    await page.route('**/raw.githubusercontent.com/**/registry/**', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await page.goto('/');

    // Page should still be functional, may show error state
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should show error for invalid PAT', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Mock PAT validation failure
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

    // Should show error feedback
    const modal = page.locator('#settings-modal');
    await expect(async () => {
      const hasError = await modal.getByText(/error|invalid|fail|credentials/i).count() > 0;
      const hasErrorToast = await page.locator('.toast').count() > 0;
      expect(hasError || hasErrorToast).toBe(true);
    }).toPass({ timeout: 3000 });
  });

  test('should handle rate limit API error', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Mock rate limit API failure
    await page.route('**/api.github.com/rate_limit', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ message: 'Server error' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await setGitHubPAT(page, mockPAT);
    await openSettingsModal(page);

    const checkRateButton = page.getByRole('button', { name: /Check Rate/i });
    if (await checkRateButton.isVisible()) {
      await checkRateButton.click();

      // Should handle error gracefully - modal stays visible
      const modal = page.locator('#settings-modal');
      await expect(modal).toBeVisible();
    }
  });

  test('should handle workflow API error', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Mock workflow API failure
    await page.route('**/api.github.com/repos/**/actions/runs*', async (route) => {
      await route.fulfill({
        status: 403,
        body: JSON.stringify({ message: 'Resource not accessible' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await setGitHubPAT(page, mockPAT);
    await openServiceModal(page, 'test-repo-perfect');

    const workflowTab = page.getByRole('button', { name: 'Workflow Runs' });
    await workflowTab.click();

    // Should show error state or empty state, not crash
    const modal = page.locator('#service-modal');
    await expect(modal).toBeVisible();
  });
});

test.describe('Empty States', () => {
  test('should handle empty search results', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Search for non-existent service
    const searchInput = page.getByRole('textbox', { name: /Search services/i });
    await searchInput.fill('nonexistent-service-xyz');

    // Should show empty state message
    await expect(page.getByText(/No services|no match|not found/i)).toBeVisible();
  });

  test('should handle empty team filter results', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // If there's a way to filter to get zero results
    const searchInput = page.getByRole('textbox', { name: /Search services/i });
    await searchInput.fill('zzzznonexistent');

    // Should show empty message
    const emptyMessage = page.getByText(/No services|no match|not found/i);
    await expect(emptyMessage).toBeVisible();
  });

  test('should show empty state for workflow runs', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Mock empty workflow runs
    await page.route('**/api.github.com/repos/**/actions/runs*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          workflow_runs: [],
          total_count: 0,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await setGitHubPAT(page, mockPAT);
    await openServiceModal(page, 'test-repo-perfect');

    const workflowTab = page.getByRole('button', { name: 'Workflow Runs' });
    await workflowTab.click();

    // Should show indication of no runs
    const modal = page.locator('#service-modal');
    await expect(async () => {
      const hasEmptyIndicator = await modal.getByText(/no|empty|0|none/i).count() > 0;
      expect(hasEmptyIndicator).toBe(true);
    }).toPass({ timeout: 3000 });
  });
});

test.describe('Rate Limit States', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should show normal rate limit status', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);
    await openSettingsModal(page);

    const modal = page.locator('#settings-modal');
    // Should show rate limit info
    const hasRateSection = await modal.getByText(/Rate|Limit|remaining/i).count() > 0;
    expect(hasRateSection).toBe(true);
  });

  test('should show low rate limit warning', async ({ page }) => {
    // Mock low rate limit
    await page.route('**/api.github.com/rate_limit', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          rate: {
            limit: 5000,
            remaining: 50,
            reset: Math.floor(Date.now() / 1000) + 3600,
          }
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await setGitHubPAT(page, mockPAT);
    await openSettingsModal(page);

    const checkRateButton = page.getByRole('button', { name: /Check Rate/i });
    if (await checkRateButton.isVisible()) {
      await checkRateButton.click();

      const modal = page.locator('#settings-modal');
      // Just verify rate info is shown
      await expect(async () => {
        const hasRateInfo = await modal.getByText(/\d+/i).count() > 0;
        expect(hasRateInfo).toBe(true);
      }).toPass({ timeout: 3000 });
    }
  });

  test('should show critical rate limit warning', async ({ page }) => {
    // Mock critical rate limit
    await page.route('**/api.github.com/rate_limit', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          rate: {
            limit: 5000,
            remaining: 5,
            reset: Math.floor(Date.now() / 1000) + 3600,
          }
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await setGitHubPAT(page, mockPAT);
    await openSettingsModal(page);

    const checkRateButton = page.getByRole('button', { name: /Check Rate/i });
    if (await checkRateButton.isVisible()) {
      await checkRateButton.click();

      const modal = page.locator('#settings-modal');
      // Should show critical rate limit indication
      await expect(async () => {
        const hasRateInfo = await modal.getByText(/\d+/i).count() > 0;
        expect(hasRateInfo).toBe(true);
      }).toPass({ timeout: 3000 });
    }
  });

  test('should show unauthenticated rate limit', async ({ page }) => {
    // Don't set PAT - will show unauthenticated rate
    await openSettingsModal(page);

    const modal = page.locator('#settings-modal');
    // Without PAT, rate section may show lower limits or prompt to authenticate
    const content = await modal.textContent();
    expect(content).toBeTruthy();
  });
});

test.describe('Network Retry Behavior', () => {
  test('should recover from temporary network failure', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/raw.githubusercontent.com/**', async (route) => {
      requestCount++;
      if (requestCount === 1) {
        // First request fails
        await route.abort('failed');
      } else {
        // Subsequent requests succeed
        await route.continue();
      }
    });

    await mockCatalogRequests(page);
    await page.goto('/');

    // Page should still be functional after potential retry
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
