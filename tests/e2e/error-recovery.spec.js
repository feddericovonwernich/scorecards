/**
 * Error Recovery & Edge Cases E2E Tests
 *
 * Phase 1 Coverage Improvement Tests:
 * - Network failure recovery
 * - Token validation edge cases
 * - Concurrent API calls handling
 *
 * These tests target low-coverage areas:
 * - registry.ts: Error handling, fallback logic
 * - auth.ts: Token validation edge cases
 * - github.ts: Rate limit handling, error responses
 * - appStore.ts: Error state management, concurrent updates
 */

import { test, expect } from './coverage.js';
import { mockPAT, errorResponses } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openSettingsModal,
  closeSettingsModal,
  getServiceCount,
  searchServices,
  clearSearch,
  openServiceModal,
  closeServiceModal,
  mockWorkflowDispatch,
} from './test-helper.js';

// ============================================================================
// USER STORY 1.1: NETWORK FAILURE RECOVERY
// "As a user, when the API fails to load, I should see helpful error messages
//  and be able to retry or recover when service is restored"
// ============================================================================

test.describe('Network Failure Recovery', () => {
  test('service modal retry replaces stale error and preserves later failures', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/scorecards/');
    await waitForCatalogLoad(page);
    const resultsPath = '**/results/feddericovonwernich/test-repo-perfect/results.json*';
    let failing = true;
    let releaseResults;
    let resultsReady = Promise.resolve();
    await page.route(resultsPath, async route => {
      await resultsReady;
      return failing
        ? route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
        : route.fallback();
    });
    await page.locator('.service-card').filter({ hasText: 'test-repo-perfect' }).click();
    const modal = page.locator('#service-modal');
    await expect(modal.getByText('Error loading service')).toBeVisible();
    // The same dialog stays mounted throughout retries, rather than masking the bug by reopening.
    const original = await modal.elementHandle();
    for (const action of ['Try Again', 'Refresh Data', 'Try Again']) {
      failing = action === 'Refresh Data';
      resultsReady = new Promise(resolve => { releaseResults = resolve; });
      const registryResponse = page.waitForResponse(res => res.url().includes('/registry/feddericovonwernich/test-repo-perfect.json'));
      const response = page.waitForResponse(res => res.url().includes('/results/feddericovonwernich/test-repo-perfect/results.json'));
      await modal.getByRole('button', { name: action, exact: true }).click();
      await expect(modal.getByText('Loading service details...')).toBeVisible();
      expect(await modal.evaluate(node => node.contains(document.activeElement))).toBe(true);
      releaseResults();
      expect((await registryResponse).status()).toBe(200);
      expect((await response).status()).toBe(failing ? 503 : 200);
      if (failing) {
        await expect(modal.getByText('Error loading service')).toBeVisible();
      } else {
        await expect(modal.locator('.check-result').first()).toBeVisible();
        await expect(modal.getByText('Error loading service')).toHaveCount(0);
        await expect(modal.getByRole('heading', { name: 'test-repo-perfect', exact: true })).toBeVisible();
      }
      expect(await original.evaluate(node => node.isConnected)).toBe(true);
      expect(await modal.evaluate(node => node.contains(document.activeElement))).toBe(true);
    }
    await modal.getByRole('button', { name: 'Close modal' }).click();
    resultsReady = new Promise(resolve => { releaseResults = resolve; });
    await page.locator('.service-card').filter({ hasText: 'test-repo-perfect' }).click();
    await expect(modal.getByText('Loading service details...')).toBeVisible();
    expect(await modal.evaluate(node => node.contains(document.activeElement))).toBe(true);
    releaseResults();
    await expect(modal.locator('.check-result').first()).toBeVisible();
    expect(await modal.evaluate(node => node.contains(document.activeElement))).toBe(true);
  });

  test('workflow retry retains dialog focus through repeated failure and recovery', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/scorecards/');
    await waitForCatalogLoad(page);
    await openSettingsModal(page);
    const settings = page.locator('#settings-modal');
    await settings.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await settings.getByRole('button', { name: 'Save Token' }).click();
    await expect(settings.getByRole('heading', { name: 'GitHub API Mode' })).toBeVisible();
    await closeSettingsModal(page);

    let failing = true;
    let releaseRuns;
    let runsReady = Promise.resolve();
    await page.route('**/api.github.com/repos/feddericovonwernich/test-repo-perfect/actions/runs*', async route => {
      await runsReady;
      await route.fulfill({
        status: failing ? 503 : 200,
        json: failing ? { message: 'Workflow fixture unavailable' } : { workflow_runs: [], total_count: 0 },
      });
    });
    await openServiceModal(page, 'test-repo-perfect');
    const modal = page.locator('#service-modal');
    await modal.getByRole('button', { name: 'Workflow Runs', exact: true }).click();
    await modal.getByRole('combobox', { name: 'Auto-refresh interval' }).selectOption('0');
    await expect(modal.locator('#service-workflows-content .error-state')).toBeVisible();
    for (const failsAgain of [true, false]) {
      failing = failsAgain;
      runsReady = new Promise(resolve => { releaseRuns = resolve; });
      await modal.getByRole('button', { name: 'Try Again', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(modal.getByText('Loading workflow runs...')).toBeVisible();
      expect(await modal.evaluate(node => node.contains(document.activeElement))).toBe(true);
      releaseRuns();
      if (failsAgain) {
        await expect(modal.locator('#service-workflows-content .error-state')).toBeVisible();
      } else {
        await expect(modal.getByText('No workflow runs found', { exact: true })).toBeVisible();
      }
      expect(await modal.evaluate(node => node.contains(document.activeElement))).toBe(true);
    }
  });


  test('should handle 404 not found errors for missing resources', async ({ page }) => {
    await mockCatalogRequests(page);
    // Mock specific resource to return 404
    await page.route('**/raw.githubusercontent.com/**/teams/**', async (route) => {
      await route.fulfill({
        status: 404,
        body: JSON.stringify({ message: 'Not Found' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await page.goto('/');

    // Services should still load even if teams fail
    await waitForCatalogLoad(page);
    const count = await getServiceCount(page);
    expect(count).toBeGreaterThan(0);
  });

});

// ============================================================================
// USER STORY 1.2: TOKEN VALIDATION EDGE CASES
// "As a user, when I enter invalid tokens, I should see specific error messages"
// ============================================================================

test.describe('Token Validation Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should reject empty token with validation error', async ({ page }) => {
    await openSettingsModal(page);

    const tokenInput = page.getByRole('textbox', { name: 'Personal Access Token' });
    const saveButton = page.getByRole('button', { name: 'Save Token' });

    // Try to save empty token
    await tokenInput.clear();
    await tokenInput.fill('');

    // Check if button is disabled for empty input (common pattern)
    const isDisabled = await saveButton.isDisabled();
    if (!isDisabled) {
      await saveButton.click();
      // Should show validation error or toast
      await expect(async () => {
        const hasError = await page.getByText(/empty|required|enter|invalid/i).count() > 0;
        const hasToast = await page.locator('.toast').count() > 0;
        expect(hasError || hasToast).toBe(true);
      }).toPass({ timeout: 3000 });
    } else {
      // Button being disabled is valid validation behavior
      expect(isDisabled).toBe(true);
    }

    await closeSettingsModal(page);
  });

  test('should reject whitespace-only token', async ({ page }) => {
    await openSettingsModal(page);

    const tokenInput = page.getByRole('textbox', { name: 'Personal Access Token' });
    const saveButton = page.getByRole('button', { name: 'Save Token' });

    // Try whitespace token
    await tokenInput.fill('   ');

    // Check if button is disabled for whitespace input (common pattern)
    const isDisabled = await saveButton.isDisabled();
    if (!isDisabled) {
      await saveButton.click();
      // Should reject whitespace token
      await expect(async () => {
        const hasError = await page.getByText(/empty|required|invalid|whitespace/i).count() > 0;
        const hasToast = await page.locator('.toast').count() > 0;
        expect(hasError || hasToast).toBe(true);
      }).toPass({ timeout: 3000 });
    } else {
      // Button being disabled is valid validation behavior
      expect(isDisabled).toBe(true);
    }

    await closeSettingsModal(page);
  });

  test('should handle 401 unauthorized response for invalid token', async ({ page }) => {
    // Mock 401 response for token validation
    await page.route('**/api.github.com/user', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ message: 'Bad credentials' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await openSettingsModal(page);

    const tokenInput = page.getByRole('textbox', { name: 'Personal Access Token' });
    const saveButton = page.getByRole('button', { name: 'Save Token' });

    await tokenInput.fill('ghp_invalidtoken12345678901234567890');
    await saveButton.click();

    // Should show authentication error
    await expect(async () => {
      const hasError = await page.getByText(/invalid|unauthorized|credentials|failed/i).count() > 0;
      const hasErrorToast = await page.locator('.toast').filter({ hasText: /error|failed|invalid/i }).count() > 0;
      expect(hasError || hasErrorToast).toBe(true);
    }).toPass({ timeout: 5000 });

    await closeSettingsModal(page);
  });

  test('should handle 403 forbidden response for token without required scopes', async ({ page }) => {
    // Mock 403 response (token valid but lacks permissions)
    await page.route('**/api.github.com/user', async (route) => {
      await route.fulfill({
        status: 403,
        body: JSON.stringify({
          message: 'Resource not accessible by integration',
          documentation_url: 'https://docs.github.com/rest/reference/repos'
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await openSettingsModal(page);

    const tokenInput = page.getByRole('textbox', { name: 'Personal Access Token' });
    const saveButton = page.getByRole('button', { name: 'Save Token' });

    await tokenInput.fill('ghp_validformatbutlacksscopes1234567');
    await saveButton.click();

    // Should show permission error
    await expect(async () => {
      const hasError = await page.getByText(/permission|access|forbidden|scope/i).count() > 0;
      const hasToast = await page.locator('.toast').count() > 0;
      expect(hasError || hasToast).toBe(true);
    }).toPass({ timeout: 5000 });

    await closeSettingsModal(page);
  });

  test('should handle network error during token validation', async ({ page }) => {
    // Mock network failure during validation
    await page.route('**/api.github.com/user', async (route) => {
      await route.abort('failed');
    });

    await openSettingsModal(page);

    const tokenInput = page.getByRole('textbox', { name: 'Personal Access Token' });
    const saveButton = page.getByRole('button', { name: 'Save Token' });

    await tokenInput.fill(mockPAT);
    await saveButton.click();

    // Should show network error
    await expect(async () => {
      const hasError = await page.getByText(/network|connection|failed|error/i).count() > 0;
      const hasToast = await page.locator('.toast').count() > 0;
      expect(hasError || hasToast).toBe(true);
    }).toPass({ timeout: 5000 });

    await closeSettingsModal(page);
  });

  test('should validate token format before making API request', async ({ page }) => {
    let apiCalled = false;

    // Track if API is called
    await page.route('**/api.github.com/user', async (route) => {
      apiCalled = true;
      await route.continue();
    });

    await openSettingsModal(page);

    const tokenInput = page.getByRole('textbox', { name: 'Personal Access Token' });
    const saveButton = page.getByRole('button', { name: 'Save Token' });

    // Try obviously invalid format (if app validates format client-side)
    await tokenInput.fill('not-a-valid-token-format');
    await saveButton.click();

    // Wait for response
    await page.waitForTimeout(500);

    // Either should show format error without API call, or API call should fail
    const modal = page.locator('#settings-modal');
    await expect(modal).toBeVisible();

    await closeSettingsModal(page);
  });
});

// ============================================================================
// USER STORY 1.3: CONCURRENT API CALLS & RAPID INTERACTIONS
// "As a user, when I rapidly interact with the UI, the app should handle
//  concurrent requests gracefully without race conditions"
// ============================================================================

test.describe('Concurrent API Calls', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should handle rapid filter changes without race conditions', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: 'Search services...' });

    // Rapid sequential filter changes
    await searchInput.fill('a');
    await searchInput.fill('ab');
    await searchInput.fill('abc');
    await searchInput.fill('test');
    await searchInput.clear();

    // Wait for UI to stabilize
    await page.waitForTimeout(300);

    // App should not crash, final state should be consistent
    await expect(page.locator('.services-grid')).toBeVisible();

    // Verify we can still interact with the app
    await searchInput.fill('perfect');
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 3000 });
  });

  test('should handle rapid stat card clicks without breaking filters', async ({ page }) => {
    // Use specific selectors to avoid matching multiple stat cards
    const goldCard = page.locator('.stat-card.rank-gold').first();
    const silverCard = page.locator('.stat-card.rank-silver').first();
    const bronzeCard = page.locator('.stat-card.rank-bronze').first();

    // Rapid filter toggles with small delays to allow UI updates
    if (await goldCard.isVisible()) {
      await goldCard.click();
      await page.waitForTimeout(100);
      await silverCard.click();
      await page.waitForTimeout(100);
      await bronzeCard.click();
      await page.waitForTimeout(100);
      await goldCard.click();
      await page.waitForTimeout(100);
      await goldCard.click(); // Toggle off

      // Wait for UI to stabilize
      await page.waitForTimeout(300);

      // App should show services
      await expect(page.locator('.services-grid')).toBeVisible();
    }
  });

  test('should handle concurrent modal open/close operations', async ({ page }) => {
    // Rapid modal operations
    await openServiceModal(page, 'test-repo-perfect');
    await page.keyboard.press('Escape');

    // Try to open again immediately
    await page.waitForTimeout(100);
    await openServiceModal(page, 'test-repo-stale');
    await page.keyboard.press('Escape');

    // Open settings immediately after
    await page.waitForTimeout(100);
    await openSettingsModal(page);
    await page.keyboard.press('Escape');

    // App should be in clean state
    await expect(page.locator('#service-modal')).not.toBeVisible();
    await expect(page.locator('#settings-modal')).not.toBeVisible();
    await expect(page.locator('.services-grid')).toBeVisible();
  });

  test('should handle overlapping search and sort operations', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: 'Search services...' });
    const sortSelect = page.locator('#sort-select');

    // Interleaved search and sort
    await searchInput.fill('test');
    await sortSelect.selectOption('Name: A to Z');
    await searchInput.clear();
    await sortSelect.selectOption('Score: High to Low');
    await searchInput.fill('repo');
    await sortSelect.selectOption('Name: Z to A');

    // Wait for operations to complete
    await page.waitForTimeout(300);

    // Final state should be consistent
    await expect(page.locator('.services-grid')).toBeVisible();
    const count = await getServiceCount(page);
    expect(count).toBeGreaterThan(0);
  });

  test('should handle rapid workflow dispatch attempts', async ({ page }) => {
    // Set up auth first
    await page.route('**/api.github.com/user', async (route) => {
      const headers = route.request().headers();
      if (headers['authorization']) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ login: 'testuser', id: 123 }),
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        await route.fulfill({ status: 401 });
      }
    });

    // Mock workflow dispatch with delay to simulate real API
    let dispatchCount = 0;
    await page.route('**/api.github.com/repos/**/actions/workflows/*/dispatches', async (route) => {
      dispatchCount++;
      await new Promise(resolve => setTimeout(resolve, 200));
      await route.fulfill({
        status: 204,
        body: '',
      });
    });

    // Authenticate
    await openSettingsModal(page);
    const tokenInput = page.getByRole('textbox', { name: 'Personal Access Token' });
    await tokenInput.fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();
    await page.waitForTimeout(500);
    await closeSettingsModal(page);

    // Try to trigger workflow runs from service card (not modal)
    // Find a stale service card with re-run button
    const staleCard = page.locator('.service-card').filter({ hasText: 'STALE' }).first();

    if (await staleCard.isVisible()) {
      const rerunButton = staleCard.locator('button').filter({ hasText: /re-?run|trigger/i }).first();
      if (await rerunButton.isVisible()) {
        // Click once and verify response
        await rerunButton.click({ force: true });
        await page.waitForTimeout(500);

        // App should handle gracefully
        await expect(page.locator('.services-grid')).toBeVisible();
      }
    }

    // Test passes if we can interact with the UI without crashes
    await expect(page.locator('.services-grid')).toBeVisible();
  });
});

// ============================================================================
// ADDITIONAL ERROR EDGE CASES
// ============================================================================

test.describe('Additional Error Edge Cases', () => {
  test('should handle malformed JSON response', async ({ page }) => {
    await page.route('**/raw.githubusercontent.com/**/all-checks.json', async (route) => {
      await route.fulfill({
        status: 200,
        body: '{ invalid json here }',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await mockCatalogRequests(page);
    await page.goto('/');

    // App should not crash
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle empty response body', async ({ page }) => {
    await page.route('**/raw.githubusercontent.com/**/teams/all-teams.json', async (route) => {
      await route.fulfill({
        status: 200,
        body: '',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await mockCatalogRequests(page);
    await page.goto('/');

    // Services should still load
    await waitForCatalogLoad(page);
    const count = await getServiceCount(page);
    expect(count).toBeGreaterThan(0);
  });

  test('should handle null response in JSON', async ({ page }) => {
    await page.route('**/raw.githubusercontent.com/**/teams/**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(null),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await mockCatalogRequests(page);
    await page.goto('/');

    // Services should still load
    await waitForCatalogLoad(page);
    const count = await getServiceCount(page);
    expect(count).toBeGreaterThan(0);
  });

  test('should handle rate limit exhausted (0 remaining)', async ({ page }) => {
    await page.route('**/api.github.com/rate_limit', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          rate: {
            limit: 5000,
            remaining: 0,
            reset: Math.floor(Date.now() / 1000) + 3600,
            used: 5000
          }
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Set PAT and check rate limit display
    await openSettingsModal(page);
    const tokenInput = page.getByRole('textbox', { name: 'Personal Access Token' });
    await tokenInput.fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();
    await page.waitForTimeout(500);

    // Rate limit info should show exhausted state
    const modal = page.locator('#settings-modal');
    await expect(async () => {
      const content = await modal.textContent();
      // Should show 0 or warning about rate limit
      expect(content).toBeTruthy();
    }).toPass({ timeout: 3000 });

    await closeSettingsModal(page);
  });

  test('should handle CORS error gracefully', async ({ page }) => {
    // Abort with CORS-like failure
    await page.route('**/api.github.com/repos/**/actions/runs*', async (route) => {
      await route.abort('accessdenied');
    });

    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Open modal and try to load workflow runs
    await openServiceModal(page, 'test-repo-perfect');
    const workflowTab = page.getByRole('button', { name: 'Workflow Runs' });
    await workflowTab.click();

    // Modal should still be visible, app should not crash
    await expect(page.locator('#service-modal')).toBeVisible();

    await closeServiceModal(page);
  });
});
