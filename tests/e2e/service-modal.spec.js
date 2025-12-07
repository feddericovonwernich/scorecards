import { test, expect } from './fixtures/catalog.fixture.js';
import { mockPAT } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openServiceModal,
  closeServiceModal,
  setGitHubPAT,
  clickServiceModalTab,
} from './test-helper.js';

test.describe('Service Modal - Basic Behavior', () => {
  // Consolidated test: Task 1 - Modal Open/Close Journey
  // Combines: open/display/close and close with Escape key tests
  test('should open modal, display service info, and close via X button or Escape key', async ({ catalogPage }) => {
    await openServiceModal(catalogPage, 'test-repo-perfect');
    const modal = catalogPage.locator('#service-modal');

    // Verify modal content
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('test-repo-perfect');
    await expect(modal).toContainText('76');
    await expect(modal).toContainText('Gold');

    // Close with X button
    await closeServiceModal(catalogPage);
    await expect(modal).not.toBeVisible();

    // Reopen and close with Escape
    await openServiceModal(catalogPage, 'test-repo-perfect');
    await expect(modal).toBeVisible();
    await catalogPage.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  // Keep unchanged - unique assertion for specific UI elements
  test('should have GitHub link and Refresh Data button', async ({ serviceModalPage }) => {
    const modal = serviceModalPage.locator('#service-modal');
    const githubLink = modal.locator('a[href*="github.com"]').first();
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', /github\.com.*test-repo-perfect/);

    const refreshButton = modal.getByRole('button', { name: 'Refresh Data' });
    await expect(refreshButton).toBeVisible();
  });
});

test.describe('Service Modal - Check Results Tab', () => {
  // Consolidated test: Task 12 - Check Results Display and Categories
  // Combines: display all check information, check categories, specific pass/fail status
  test('should display check results with categories, pass/fail indicators, and collapse/expand', async ({ serviceModalPage }) => {
    const modal = serviceModalPage.locator('#service-modal');

    // Check count and indicators
    const checkResults = modal.locator('.check-result');
    const count = await checkResults.count();
    expect(count).toBeGreaterThanOrEqual(10);

    const passedChecks = modal.locator('.check-result').filter({ hasText: '✓' });
    expect(await passedChecks.count()).toBeGreaterThan(0);

    const failedChecks = modal.locator('.check-result').filter({ hasText: '✗' });
    expect(await failedChecks.count()).toBeGreaterThan(0);

    const outputSection = modal.locator('strong', { hasText: 'Output:' }).first();
    await expect(outputSection).toBeVisible();

    const weightText = modal.getByText(/Weight: \d+/);
    await expect(weightText.first()).toBeVisible();

    const statValue = modal.locator('.modal-stat-value').filter({ hasText: '76' });
    await expect(statValue).toBeVisible();

    // Categories
    await expect(modal.locator('.category-name').filter({ hasText: 'Scorecards Setup' })).toBeVisible();
    await expect(modal.locator('.category-name').filter({ hasText: 'Documentation' })).toBeVisible();

    const categories = modal.locator('.check-category');
    expect(await categories.count()).toBeGreaterThan(0);

    const firstCategory = categories.first();
    expect(await firstCategory.getAttribute('open')).not.toBeNull();

    const categoryStats = modal.locator('.category-stats');
    await expect(categoryStats.first()).toContainText(/\d+\/\d+ passed/);

    // Collapse/expand
    const firstCategoryHeader = firstCategory.locator('.check-category-header');
    await firstCategoryHeader.click();
    await expect(async () => {
      expect(await firstCategory.getAttribute('open')).toBeNull();
    }).toPass({ timeout: 3000 });

    await firstCategoryHeader.click();
    await expect(async () => {
      expect(await firstCategory.getAttribute('open')).not.toBeNull();
    }).toPass({ timeout: 3000 });

    // Specific checks
    const readmeCheck = modal.locator('.check-result').filter({ hasText: 'README Documentation' });
    await expect(readmeCheck).toContainText('✓');

    const configCheck = modal.locator('.check-result').filter({ hasText: 'Scorecard Configuration' });
    await expect(configCheck).toContainText('✗');
  });
});

test.describe('Service Modal - API Specification Tab', () => {
  // Consolidated test: Task 7 - API Specification Tab Complete View
  // Combines: display API spec info, expandable raw spec, environment config
  test('should display API specification info, expandable raw spec, and environment config', async ({ serviceModalPage }) => {
    await clickServiceModalTab(serviceModalPage, 'API Specification');

    const modal = serviceModalPage.locator('#service-modal');

    // API metadata
    await expect(modal).toContainText('Perfect Example API');
    await expect(modal).toContainText('1.0.0');
    await expect(modal).toContainText('openapi.yaml');
    await expect(modal).toContainText('3.0');
    await expect(modal).toContainText(/\d+ paths/i);
    await expect(modal).toContainText(/\d+ operations/i);

    const apiTab = modal.locator('#api-tab');
    const githubLink = apiTab.locator('a').filter({ hasText: 'View on GitHub' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', /github\.com.*openapi\.yaml/);

    // Raw spec expansion
    const rawSpecToggle = modal.getByText(/View Raw Specification/i);
    await expect(rawSpecToggle).toBeVisible();
    await rawSpecToggle.click();
    await expect(async () => {
      const hasCodeBlock = await modal.locator('pre, code').count() > 0;
      expect(hasCodeBlock).toBe(true);
    }).toPass({ timeout: 3000 });

    // Environment config
    await expect(modal).toContainText(/Configure environments|\.scorecard\/config\.yml|API Explorer/i);
  });
});

test.describe('Service Modal - Contributors Tab', () => {
  // Keep unchanged - complete Contributors tab test
  test('should display complete contributor information', async ({ serviceModalPage }) => {
    await clickServiceModalTab(serviceModalPage, 'Contributors');

    const modal = serviceModalPage.locator('#service-modal');

    // Heading and description
    await expect(modal).toContainText(/Recent Contributors/i);
    await expect(modal).toContainText(/committed to this repository/i);

    // Contributor details
    const avatars = modal.locator('img[alt]');
    expect(await avatars.count()).toBeGreaterThan(0);

    const names = modal.locator('strong');
    expect(await names.count()).toBeGreaterThan(0);

    // Email, commit count, and date
    await expect(modal).toContainText(/@/);
    await expect(modal).toContainText(/\d+ commit/i);
    await expect(modal).toContainText(/Last commit/i);

    // Commit hash
    const codeElements = modal.locator('code');
    expect(await codeElements.count()).toBeGreaterThan(0);
  });
});

test.describe('Service Modal - Badges Tab', () => {
  // Keep unchanged - UI preview test
  test('should display badge previews and markdown correctly', async ({ serviceModalPage }) => {
    await clickServiceModalTab(serviceModalPage, 'Badges');

    const modal = serviceModalPage.locator('#service-modal');

    // Badge previews
    await expect(modal).toContainText(/Badge Preview/i);
    await expect(modal.locator('img[alt*="Score"]')).toBeVisible();
    await expect(modal.locator('img[alt*="Rank"]')).toBeVisible();

    // Markdown section
    await expect(modal).toContainText(/Add to Your README/i);
    await expect(modal).toContainText('![Score]');
    await expect(modal).toContainText('![Rank]');
    await expect(modal).toContainText('img.shields.io');
    await expect(modal).toContainText('test-repo-perfect');

    // Copy buttons
    const copyButtons = modal.getByRole('button', { name: 'Copy' });
    expect(await copyButtons.count()).toBeGreaterThanOrEqual(2);
  });

  test('should copy badge markdown to clipboard', async ({ serviceModalPage }) => {
    await serviceModalPage.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await clickServiceModalTab(serviceModalPage, 'Badges');

    const modal = serviceModalPage.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();
    await copyButton.click();

    await expect(modal).toContainText(/Copied/i);

    // Wait for reset
    await expect(async () => {
      const resetButton = modal.getByRole('button', { name: 'Copy' }).first();
      await expect(resetButton).toBeVisible();
    }).toPass({ timeout: 5000 });
  });
});

test.describe('Service Modal - Workflow Runs Tab', () => {
  // Consolidated test: Task 11 - Workflow Runs Tab PAT States
  // Combines: PAT required message, workflow controls with PAT, display workflow runs
  test('should show PAT prompt without token, then controls and data with valid token', async ({ catalogPage }) => {
    await openServiceModal(catalogPage, 'test-repo-perfect');
    await clickServiceModalTab(catalogPage, 'Workflow Runs');

    const modal = catalogPage.locator('#service-modal');

    // No token state
    const hasPrompt = await modal.getByText(/Configure|Token|PAT|GitHub/i).count() > 0;
    expect(hasPrompt).toBe(true);
    const configButton = modal.getByRole('button', { name: /Configure Token/i });
    await expect(configButton).toBeVisible();

    await closeServiceModal(catalogPage);

    // Set PAT and mock workflow runs
    await setGitHubPAT(catalogPage, mockPAT);

    await catalogPage.route('**/api.github.com/repos/**/actions/runs*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          workflow_runs: [{
            id: 123456, name: 'CI', status: 'completed', conclusion: 'success',
            run_number: 42, created_at: '2025-01-01T12:00:00Z',
            html_url: 'https://github.com/test/repo/actions/runs/123456',
          }],
          total_count: 1,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await openServiceModal(catalogPage, 'test-repo-perfect');
    await clickServiceModalTab(catalogPage, 'Workflow Runs');

    // With token - controls visible
    await expect(modal.getByRole('button', { name: /All/i })).toBeVisible();
    const refreshDropdown = modal.locator('select').filter({ hasText: /Refresh|15s|30s/i });
    expect(await refreshDropdown.count()).toBeGreaterThan(0);

    // With data - workflow visible
    await expect(modal).toContainText(/CI|workflow/i);

    await closeServiceModal(catalogPage);
  });
});

test.describe('Service Modal - Links Tab', () => {
  // Keep unchanged - edge case testing conditional rendering
  test('should not show Links tab when service has no links', async ({ serviceModalPage }) => {
    const linksTab = serviceModalPage.locator('#service-modal').getByRole('button', { name: 'Links', exact: true });
    expect(await linksTab.count()).toBe(0);
  });
});

test.describe('Service Modal - Tab Navigation', () => {
  // Consolidated test: Task 6 - Tab Navigation Complete Journey
  // Combines: default tab and switch correctly, keyboard accessible tabs
  test('should navigate tabs via click and keyboard, preserving active state', async ({ serviceModalPage }) => {
    const modal = serviceModalPage.locator('#service-modal');

    // Check Results should be active by default
    const checkResultsTab = modal.getByRole('button', { name: 'Check Results' });
    expect(await checkResultsTab.evaluate(el => el.classList.contains('active'))).toBe(true);
    await expect(modal).toContainText(/passed|failed|Weight/i);

    // Switch to API tab
    await clickServiceModalTab(serviceModalPage, 'API Specification');
    const apiTab = modal.getByRole('button', { name: 'API Specification' });
    expect(await apiTab.evaluate(el => el.classList.contains('active'))).toBe(true);
    await expect(modal).toContainText(/OpenAPI|API|paths/i);

    // Switch to Contributors tab
    await clickServiceModalTab(serviceModalPage, 'Contributors');
    await expect(modal).toContainText(/Recent Contributors/i);

    // Switch to Badges tab
    await clickServiceModalTab(serviceModalPage, 'Badges');
    await expect(modal).toContainText(/Badge Preview/i);

    // Back to Contributors (state preservation)
    await clickServiceModalTab(serviceModalPage, 'Contributors');
    await expect(modal).toContainText(/Recent Contributors/i);

    // Keyboard navigation - verify only one tab active at a time
    const tabs = modal.locator('.tab-btn');
    await tabs.first().focus();
    await serviceModalPage.keyboard.press('Tab');
    await serviceModalPage.keyboard.press('Enter');

    expect(await modal.locator('.tab-btn.active').count()).toBe(1);
  });
});

test.describe('Service Modal - Mobile Tab Scroll', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Consolidated test: Task 10 - Mobile Tab Scroll Complete Behavior
  // Combines: tabs container and scroll on mobile, hide scroll arrows on desktop
  test('should show scroll arrows on mobile and hide on desktop when content fits', async ({ page }) => {
    // Mobile viewport
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const tabsContainer = modal.locator('.tabs-container');
    const tabs = modal.locator('.tabs');

    await expect(tabsContainer).toBeVisible();
    await expect(tabs).toBeVisible();
    await expect(page.locator('.tab-btn').first()).toBeVisible();

    // Left arrow should not be visible at start
    await expect(page.locator('.tab-scroll-left')).toHaveCount(0);

    // Test scroll if right arrow exists
    const rightArrow = page.locator('.tab-scroll-right');
    if (await rightArrow.count() > 0) {
      const initialScrollLeft = await tabs.evaluate(el => el.scrollLeft);
      expect(initialScrollLeft).toBe(0);

      await rightArrow.click();

      await expect(async () => {
        expect(await tabs.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
      }).toPass({ timeout: 3000 });

      await expect(page.locator('.tab-scroll-left')).toBeVisible();
    }

    await closeServiceModal(page);

    // Desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await openServiceModal(page, 'test-repo-perfect');

    const leftCount = await page.locator('.tab-scroll-left').count();
    const rightCount = await page.locator('.tab-scroll-right').count();
    expect(leftCount + rightCount).toBeLessThanOrEqual(1);

    await closeServiceModal(page);
  });
});

test.describe('Service Modal - Case-Insensitive Categories', () => {
  // Keep unchanged - specific edge case behavior
  test('should group checks by category with case-insensitive matching', async ({ serviceModalPage }) => {
    const modal = serviceModalPage.locator('#service-modal');

    const categories = modal.locator('.check-category');
    expect(await categories.count()).toBeGreaterThan(0);

    await expect(modal.locator('.category-name').filter({ hasText: 'Documentation' })).toBeVisible();
    await expect(modal.locator('.category-name').filter({ hasText: 'Scorecards Setup' })).toBeVisible();
  });
});
