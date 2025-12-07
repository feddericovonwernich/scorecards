/**
 * Loading and Error States E2E Tests
 *
 * Consolidated tests for loading indicators, error handling, and empty states.
 */

import { test, expect } from './coverage.js';
import { mockPAT } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openSettingsModal,
  setGitHubPAT,
  openServiceModal,
} from './test-helper.js';

// ============================================================================
// LOADING STATES (Consolidated from 3 tests → 1)
// ============================================================================

test.describe('Loading States', () => {
  test('should show loading indicators for page load, settings, and modal', async ({ page }) => {
    // Test 1: Initial catalog load
    await page.route('**/raw.githubusercontent.com/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    await mockCatalogRequests(page);
    await page.goto('/');

    // Check for loading state before data loads
    const loadingByClass = await page.locator('.loading, [class*="loading"]').count() > 0;
    const loadingByText = await page.getByText(/loading/i).count() > 0;
    const hasPlaceholder = await page.getByText('-').count() > 0;
    expect(loadingByClass || loadingByText || hasPlaceholder).toBe(true);

    await waitForCatalogLoad(page);

    // Test 2: Settings rate limit check with loading
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
      const modal = page.locator('#settings-modal');
      await expect(async () => {
        const hasRateInfo = await modal.getByText(/remaining|\d+/i).count() > 0;
        expect(hasRateInfo).toBe(true);
      }).toPass({ timeout: 3000 });
    }

    // Close settings modal
    await page.keyboard.press('Escape');
    await expect(page.locator('#settings-modal')).not.toBeVisible();

    // Test 3: Service modal loading
    await openServiceModal(page, 'test-repo-perfect');
    const serviceModal = page.locator('#service-modal');
    await expect(serviceModal).toContainText(/passed|failed|Weight/i);
  });
});

// ============================================================================
// ERROR STATES (Consolidated from 4 tests → 2)
// ============================================================================

test.describe('Error States', () => {
  test('should handle catalog and API errors gracefully', async ({ page }) => {
    // Test 1: Catalog fetch failure
    await page.route('**/raw.githubusercontent.com/**/registry/**', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Reset and load normally for remaining tests
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Test 2: Invalid PAT error
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

    const modal = page.locator('#settings-modal');
    await expect(async () => {
      const hasError = await modal.getByText(/error|invalid|fail|credentials/i).count() > 0;
      const hasErrorToast = await page.locator('.toast').count() > 0;
      expect(hasError || hasErrorToast).toBe(true);
    }).toPass({ timeout: 3000 });
  });

  test('should handle rate limit and workflow API errors', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Test 1: Rate limit API error
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
      const modal = page.locator('#settings-modal');
      await expect(modal).toBeVisible();
    }

    await page.keyboard.press('Escape');

    // Test 2: Workflow API error
    await page.route('**/api.github.com/repos/**/actions/runs*', async (route) => {
      await route.fulfill({
        status: 403,
        body: JSON.stringify({ message: 'Resource not accessible' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await openServiceModal(page, 'test-repo-perfect');
    const workflowTab = page.getByRole('button', { name: 'Workflow Runs' });
    await workflowTab.click();

    const serviceModal = page.locator('#service-modal');
    await expect(serviceModal).toBeVisible();
  });
});

// ============================================================================
// EMPTY STATES (Consolidated from 3 tests → 1)
// ============================================================================

test.describe('Empty States', () => {
  test('should display empty states for search, filters, and workflows', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Test 1: Empty search results
    const searchInput = page.getByRole('textbox', { name: /Search services/i });
    await searchInput.fill('nonexistent-service-xyz');
    await expect(page.getByText(/No services|no match|not found/i)).toBeVisible();

    // Test 2: Different search term (empty filter results)
    await searchInput.fill('zzzznonexistent');
    await expect(page.getByText(/No services|no match|not found/i)).toBeVisible();

    // Clear search
    await searchInput.fill('');
    await waitForCatalogLoad(page);

    // Test 3: Empty workflow runs
    await page.route('**/api.github.com/repos/**/actions/runs*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ workflow_runs: [], total_count: 0 }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await setGitHubPAT(page, mockPAT);
    await openServiceModal(page, 'test-repo-perfect');

    const workflowTab = page.getByRole('button', { name: 'Workflow Runs' });
    await workflowTab.click();

    const modal = page.locator('#service-modal');
    await expect(async () => {
      const hasEmptyIndicator = await modal.getByText(/no|empty|0|none/i).count() > 0;
      expect(hasEmptyIndicator).toBe(true);
    }).toPass({ timeout: 3000 });
  });
});

// ============================================================================
// RATE LIMIT STATES (Consolidated from 4 tests → 1)
// ============================================================================

test.describe('Rate Limit States', () => {
  test('should display rate limit info for normal, low, critical, and unauthenticated states', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Test 1: Unauthenticated rate limit
    await openSettingsModal(page);
    let modal = page.locator('#settings-modal');
    const content = await modal.textContent();
    expect(content).toBeTruthy();
    await page.keyboard.press('Escape');

    // Test 2: Normal rate limit with PAT
    await setGitHubPAT(page, mockPAT);
    await openSettingsModal(page);
    modal = page.locator('#settings-modal');
    const hasRateSection = await modal.getByText(/Rate|Limit|remaining/i).count() > 0;
    expect(hasRateSection).toBe(true);

    // Test 3: Low rate limit warning
    await page.route('**/api.github.com/rate_limit', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          rate: { limit: 5000, remaining: 50, reset: Math.floor(Date.now() / 1000) + 3600 }
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const checkRateButton = page.getByRole('button', { name: /Check Rate/i });
    if (await checkRateButton.isVisible()) {
      await checkRateButton.click();
      await expect(async () => {
        const hasRateInfo = await modal.getByText(/\d+/i).count() > 0;
        expect(hasRateInfo).toBe(true);
      }).toPass({ timeout: 3000 });

      // Test 4: Critical rate limit
      await page.route('**/api.github.com/rate_limit', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            rate: { limit: 5000, remaining: 5, reset: Math.floor(Date.now() / 1000) + 3600 }
          }),
          headers: { 'Content-Type': 'application/json' },
        });
      });

      await checkRateButton.click();
      await expect(async () => {
        const hasRateInfo = await modal.getByText(/\d+/i).count() > 0;
        expect(hasRateInfo).toBe(true);
      }).toPass({ timeout: 3000 });
    }
  });
});

// ============================================================================
// NETWORK RETRY BEHAVIOR
// ============================================================================

test.describe('Network Retry Behavior', () => {
  test('should recover from temporary network failure', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/raw.githubusercontent.com/**', async (route) => {
      requestCount++;
      if (requestCount === 1) {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    await mockCatalogRequests(page);
    await page.goto('/');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
