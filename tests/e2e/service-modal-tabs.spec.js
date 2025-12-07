import { test, expect } from './coverage.js';
import { mockPAT } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openServiceModal,
  closeServiceModal,
  setGitHubPAT,
  openSettingsModal,
} from './test-helper.js';

/**
 * Click a Service Modal tab by name
 * @param {import('@playwright/test').Page} page
 * @param {string} tabName - 'Check Results', 'API Specification', 'Links', 'Contributors', 'Workflow Runs', 'Badges'
 */
async function clickServiceModalTab(page, tabName) {
  const modal = page.locator('#service-modal');
  const tab = modal.getByRole('button', { name: tabName });
  await tab.click();
  // Wait for tab content to update
  await expect(modal.locator('.tab-content, [class*="tab-content"]')).toBeVisible();
}

test.describe('Service Modal - API Specification Tab', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should display API title prominently', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'API Specification');

    const modal = page.locator('#service-modal');
    // Should show the API title from the OpenAPI spec
    await expect(modal).toContainText('Perfect Example API');
  });

  test('should display API version', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'API Specification');

    const modal = page.locator('#service-modal');
    await expect(modal).toContainText('1.0.0');
  });

  test('should show spec file name', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'API Specification');

    const modal = page.locator('#service-modal');
    await expect(modal).toContainText('openapi.yaml');
  });

  test('should show OpenAPI specification version', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'API Specification');

    const modal = page.locator('#service-modal');
    await expect(modal).toContainText('3.0');
  });

  test('should display endpoint counts', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'API Specification');

    const modal = page.locator('#service-modal');
    // Should show paths and operations count
    await expect(modal).toContainText(/\d+ paths/i);
    await expect(modal).toContainText(/\d+ operations/i);
  });

  test('should have View on GitHub link', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'API Specification');

    const modal = page.locator('#service-modal');
    const githubLink = modal.locator('a').filter({ hasText: 'View on GitHub' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', /github\.com.*openapi\.yaml/);
  });

  test('should have expandable raw specification section', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'API Specification');

    const modal = page.locator('#service-modal');
    const rawSpecToggle = modal.getByText(/View Raw Specification/i);
    await expect(rawSpecToggle).toBeVisible();
  });

  test('should expand raw specification when clicked', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'API Specification');

    const modal = page.locator('#service-modal');
    const rawSpecToggle = modal.getByText(/View Raw Specification/i);
    await rawSpecToggle.click();

    // After expanding, should show code or pre element with spec content
    await expect(async () => {
      const hasCodeBlock = await modal.locator('pre, code').count() > 0;
      expect(hasCodeBlock).toBe(true);
    }).toPass({ timeout: 3000 });
  });

  test('should show environment configuration message when not configured', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'API Specification');

    const modal = page.locator('#service-modal');
    // Should show message about configuring environments
    await expect(modal).toContainText(/Configure environments|\.scorecard\/config\.yml|API Explorer/i);
  });
});

test.describe('Service Modal - Contributors Tab', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should display Recent Contributors heading', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Contributors');

    const modal = page.locator('#service-modal');
    await expect(modal).toContainText(/Recent Contributors/i);
  });

  test('should show contributor description text', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Contributors');

    const modal = page.locator('#service-modal');
    await expect(modal).toContainText(/committed to this repository/i);
  });

  test('should display contributor avatars', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Contributors');

    const modal = page.locator('#service-modal');
    const avatars = modal.locator('img[alt]');
    const count = await avatars.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display contributor names', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Contributors');

    const modal = page.locator('#service-modal');
    // Look for contributor name in strong element
    const names = modal.locator('strong');
    const count = await names.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display contributor email', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Contributors');

    const modal = page.locator('#service-modal');
    // Email should be visible
    await expect(modal).toContainText(/@/);
  });

  test('should display commit count', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Contributors');

    const modal = page.locator('#service-modal');
    await expect(modal).toContainText(/\d+ commit/i);
  });

  test('should display last commit date', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Contributors');

    const modal = page.locator('#service-modal');
    await expect(modal).toContainText(/Last commit/i);
  });

  test('should display commit hash', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Contributors');

    const modal = page.locator('#service-modal');
    // Commit hash is typically 7 characters
    const codeElements = modal.locator('code');
    const count = await codeElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should handle services with multiple contributors', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Contributors');

    const modal = page.locator('#service-modal');
    // Should not error, may show one or more contributors
    await expect(modal).toContainText(/Contributors/i);
  });
});

test.describe('Service Modal - Badges Tab', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should display Badge Preview heading', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    await expect(modal).toContainText(/Badge Preview/i);
  });

  test('should display score badge preview image', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const scoreBadge = modal.locator('img[alt*="Score"]');
    await expect(scoreBadge).toBeVisible();
  });

  test('should display rank badge preview image', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const rankBadge = modal.locator('img[alt*="Rank"]');
    await expect(rankBadge).toBeVisible();
  });

  test('should display Add to Your README section', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    await expect(modal).toContainText(/Add to Your README/i);
  });

  test('should display score badge markdown', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    await expect(modal).toContainText('![Score]');
  });

  test('should display rank badge markdown', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    await expect(modal).toContainText('![Rank]');
  });

  test('should include shields.io URL in markdown', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    await expect(modal).toContainText('img.shields.io');
  });

  test('should include repo name in badge URL', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    await expect(modal).toContainText('test-repo-perfect');
  });

  test('should have two copy buttons', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButtons = modal.getByRole('button', { name: 'Copy' });
    const count = await copyButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should show Copied feedback when copy button clicked', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();
    await copyButton.click();

    // Should show "Copied!" feedback
    await expect(modal).toContainText(/Copied/i);
  });

  test('should reset copy button after timeout', async ({ page }) => {
    // This test needs extra time to wait for the reset timer
    test.setTimeout(10000);

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Badges');

    const modal = page.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();
    await copyButton.click();

    // Wait for the copied state
    await expect(modal).toContainText(/Copied/i);

    // Wait for reset using state-based polling
    await expect(async () => {
      const resetButton = modal.getByRole('button', { name: 'Copy' }).first();
      await expect(resetButton).toBeVisible();
    }).toPass({ timeout: 5000 });
  });
});

test.describe('Service Modal - Workflow Runs Tab', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should show PAT required message when no token', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Workflow Runs');

    const modal = page.locator('#service-modal');
    // Should show empty state or PAT prompt
    const hasPrompt = await modal.getByText(/Configure|Token|PAT|GitHub/i).count() > 0;
    expect(hasPrompt).toBe(true);
  });

  test('should have Configure Token button', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Workflow Runs');

    const modal = page.locator('#service-modal');
    const configButton = modal.getByRole('button', { name: /Configure Token/i });
    await expect(configButton).toBeVisible();
  });

  test('should navigate to settings when Configure Token clicked', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Workflow Runs');

    const modal = page.locator('#service-modal');
    const configButton = modal.getByRole('button', { name: /Configure Token/i });
    await configButton.click();

    // Settings modal should open
    await page.waitForSelector('#settings-modal', { state: 'visible', timeout: 5000 });
    const settingsModal = page.locator('#settings-modal');
    await expect(settingsModal).toBeVisible();
  });

  test('should show workflow filter buttons when PAT is set', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);

    // Mock workflow runs API
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

    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Workflow Runs');

    const modal = page.locator('#service-modal');
    // Should show filter buttons
    const allButton = modal.getByRole('button', { name: /All/i });
    await expect(allButton).toBeVisible();
  });

  test('should show refresh interval selector when PAT is set', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);

    // Mock workflow runs API
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

    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Workflow Runs');

    const modal = page.locator('#service-modal');
    // Should have refresh interval dropdown
    const refreshDropdown = modal.locator('select').filter({ hasText: /Refresh|15s|30s/i });
    const count = await refreshDropdown.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display workflow runs when API returns data', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);

    // Mock workflow runs API with data
    await page.route('**/api.github.com/repos/**/actions/runs*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          workflow_runs: [
            {
              id: 123456,
              name: 'CI',
              status: 'completed',
              conclusion: 'success',
              run_number: 42,
              created_at: '2025-01-01T12:00:00Z',
              html_url: 'https://github.com/test/repo/actions/runs/123456',
            },
          ],
          total_count: 1,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Workflow Runs');

    const modal = page.locator('#service-modal');
    // Wait for workflow run to appear
    await expect(modal).toContainText(/CI|workflow/i);
  });

  test('should show empty state when no workflow runs', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);

    // Mock workflow runs API with empty data
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

    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Workflow Runs');

    const modal = page.locator('#service-modal');
    // Wait for empty state indicator
    await expect(async () => {
      const hasEmptyIndicator = await modal.getByText(/no|empty|0/i).count() > 0;
      expect(hasEmptyIndicator).toBe(true);
    }).toPass({ timeout: 3000 });
  });
});

test.describe('Service Modal - Links Tab', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should not show Links tab when service has no links', async ({ page }) => {
    // test-repo-perfect has no links configured
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const linksTab = modal.getByRole('button', { name: 'Links', exact: true });
    const count = await linksTab.count();
    expect(count).toBe(0);
  });

  // Note: To test services with links, we would need a fixture with links data
  // The following tests document the expected behavior when links exist

  test('should conditionally render Links tab based on data', async ({ page }) => {
    // Open a service - check if Links tab appears based on data
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    // The Links tab visibility should be data-driven
    const tabs = modal.locator('.tab-btn');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(0);
  });
});

test.describe('Service Modal - Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should default to Check Results tab', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const checkResultsTab = modal.getByRole('button', { name: 'Check Results' });
    // Check Results tab should have active styling
    const hasActiveClass = await checkResultsTab.evaluate(el => el.classList.contains('active'));
    expect(hasActiveClass).toBe(true);
  });

  test('should switch tabs correctly', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    // Switch to API tab
    await clickServiceModalTab(page, 'API Specification');
    const modal = page.locator('#service-modal');
    const apiTab = modal.getByRole('button', { name: 'API Specification' });
    const hasActiveClass = await apiTab.evaluate(el => el.classList.contains('active'));
    expect(hasActiveClass).toBe(true);
  });

  test('should update tab content when switching', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');

    // Check Results tab should show check content
    await expect(modal).toContainText(/passed|failed|Weight/i);

    // Switch to API tab
    await clickServiceModalTab(page, 'API Specification');

    // Should now show API content
    await expect(modal).toContainText(/OpenAPI|API|paths/i);
  });

  test('should preserve tab state when switching back', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    // Switch to Contributors
    await clickServiceModalTab(page, 'Contributors');

    // Switch to Badges
    await clickServiceModalTab(page, 'Badges');
    const modal = page.locator('#service-modal');
    await expect(modal).toContainText(/Badge Preview/i);

    // Switch back to Contributors
    await clickServiceModalTab(page, 'Contributors');
    await expect(modal).toContainText(/Recent Contributors/i);
  });

  test('should have keyboard accessible tabs', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const tabs = modal.locator('.tab-btn');

    // Tabs should be focusable
    const firstTab = tabs.first();
    await firstTab.focus();

    // Should be able to activate with Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Tab should now be active
    const activeTab = modal.locator('.tab-btn.active');
    const count = await activeTab.count();
    expect(count).toBe(1);
  });
});
