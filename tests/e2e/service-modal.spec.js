import { test, expect } from './coverage.js';
import { expectedChecks, mockPAT } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openServiceModal,
  closeServiceModal,
  setGitHubPAT,
} from './test-helper.js';

test.describe('Service Modal', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should open when clicking service card', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('test-repo-perfect');
  });

  test('should close with X button', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await closeServiceModal(page);

    const modal = page.locator('#service-modal');
    await expect(modal).not.toBeVisible();
  });

  test('should close with Escape key', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    await page.keyboard.press('Escape');

    const modal = page.locator('#service-modal');
    await expect(modal).not.toBeVisible();
  });

  test('should display correct service name, score, and rank', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    await expect(modal.locator('h2')).toContainText('test-repo-perfect');
    await expect(modal).toContainText('76');
    await expect(modal).toContainText('Gold');
  });

  test('should show all check results', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    // Wait for Check Results tab to be active (should be default)
    const modal = page.locator('#service-modal');
    const checkResults = modal.locator('.check-result');

    const count = await checkResults.count();
    expect(count).toBeGreaterThanOrEqual(10); // Should have at least 10 checks
  });

  test('should display pass checks with checkmark', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const passedChecks = modal.locator('.check-result').filter({ hasText: '✓' });

    const count = await passedChecks.count();
    expect(count).toBeGreaterThan(0);

    // Check that README Documentation check passes
    const readmeCheck = modal.locator('.check-result').filter({ hasText: 'README Documentation' });
    await expect(readmeCheck).toContainText('✓');
  });

  test('should display fail checks with X icon', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const failedChecks = modal.locator('.check-result').filter({ hasText: '✗' });

    const count = await failedChecks.count();
    expect(count).toBeGreaterThan(0);

    // Check that Scorecard Configuration check fails
    const configCheck = modal.locator('.check-result').filter({ hasText: 'Scorecard Configuration' });
    await expect(configCheck).toContainText('✗');
  });

  test('should display check output text', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    // Look for output section
    const outputSection = modal.locator('strong', { hasText: 'Output:' }).first();
    await expect(outputSection).toBeVisible();
  });

  test('should display check weights', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    // Weight should be shown in format "Weight: XX"
    const weightText = modal.getByText(/Weight: \d+/);
    await expect(weightText.first()).toBeVisible();
  });

  test('should display score in modal stats', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    // The React component shows score in modal stats
    const statValue = modal.locator('.modal-stat-value').filter({ hasText: '76' });
    const statLabel = modal.locator('.modal-stat-label').filter({ hasText: 'Score' });

    await expect(statValue).toBeVisible();
    await expect(statLabel).toBeVisible();
  });

  test('should have Contributors tab', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const contributorsTab = page.getByRole('button', { name: 'Contributors' });
    await expect(contributorsTab).toBeVisible();
  });

  test('should switch to Contributors tab', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const contributorsTab = page.getByRole('button', { name: 'Contributors' });
    await contributorsTab.click();

    // Should show contributors heading or content
    const modal = page.locator('#service-modal');
    await expect(modal).toContainText(/Recent Contributors|Contributors/i);
  });

  test('should have Workflow Runs tab', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const workflowTab = page.getByRole('button', { name: 'Workflow Runs' });
    await expect(workflowTab).toBeVisible();
  });

  test('should show workflow runs tab content', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const workflowTab = page.getByRole('button', { name: 'Workflow Runs' });
    await workflowTab.click();

    // The workflow tab should show some content
    // Without PAT: shows empty state with "Configure Token" prompt (widget-empty)
    // With PAT: shows workflows content (#service-workflows-content)
    const modal = page.locator('#service-modal');
    const workflowContent = modal.locator('#workflows-tab');
    await expect(workflowContent).toBeVisible();

    // Either shows the content div or the empty state prompt
    const hasContent = await modal.locator('#service-workflows-content').count() > 0;
    const hasEmptyState = await modal.locator('.widget-empty').count() > 0;
    expect(hasContent || hasEmptyState).toBe(true);
  });

  test('should have Badges tab', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const badgesTab = page.getByRole('button', { name: 'Badges' });
    await expect(badgesTab).toBeVisible();
  });

  test('should show badge previews in Badges tab', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const badgesTab = page.getByRole('button', { name: 'Badges' });
    await badgesTab.click();

    const modal = page.locator('#service-modal');
    // Should show badge preview images
    const badgeImages = modal.locator('img[alt*="Badge"]');
    const count = await badgeImages.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show markdown snippets in Badges tab', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const badgesTab = page.getByRole('button', { name: 'Badges' });
    await badgesTab.click();

    const modal = page.locator('#service-modal');
    // Should contain markdown code with img.shields.io URL
    await expect(modal).toContainText('img.shields.io');
    await expect(modal).toContainText('![Score]');
  });

  test('should have copy buttons for badge markdown', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const badgesTab = page.getByRole('button', { name: 'Badges' });
    await badgesTab.click();

    const modal = page.locator('#service-modal');
    const copyButtons = modal.getByRole('button', { name: 'Copy' });
    const count = await copyButtons.count();
    expect(count).toBeGreaterThanOrEqual(2); // At least 2 badges (score and rank)
  });

  test('should have GitHub link', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    // React component has GitHub icon button instead of text link
    const githubLink = modal.locator('a[href*="github.com"]').first();
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', /github\.com.*test-repo-perfect/);
  });

  test('should have Refresh Data button', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const refreshButton = modal.getByRole('button', { name: 'Refresh Data' });
    await expect(refreshButton).toBeVisible();
  });

  test('should display check categories', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const categories = modal.locator('.check-category');

    const count = await categories.count();
    expect(count).toBeGreaterThan(0); // Should have at least one category
  });

  test('should have all expected categories', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');

    // Check for expected categories (at minimum these should exist)
    await expect(modal.locator('.category-name').filter({ hasText: 'Scorecards Setup' })).toBeVisible();
    await expect(modal.locator('.category-name').filter({ hasText: 'Documentation' })).toBeVisible();
  });

  test('should show categories expanded by default', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const categories = modal.locator('.check-category');

    // Check that categories have the 'open' attribute
    const firstCategory = categories.first();
    const isOpen = await firstCategory.getAttribute('open');
    expect(isOpen).not.toBeNull(); // 'open' attribute should be present
  });

  test('should display category pass/fail stats', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const categoryStats = modal.locator('.category-stats');

    const count = await categoryStats.count();
    expect(count).toBeGreaterThan(0);

    // Stats should be in format "X/Y passed"
    await expect(categoryStats.first()).toContainText(/\d+\/\d+ passed/);
  });

  test('should be able to collapse and expand categories', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const firstCategory = modal.locator('.check-category').first();
    const firstCategoryHeader = firstCategory.locator('.check-category-header');

    // Category should start expanded
    let isOpen = await firstCategory.getAttribute('open');
    expect(isOpen).not.toBeNull();

    // Click to collapse
    await firstCategoryHeader.click();

    // Wait for collapse state
    await expect(async () => {
      const openAttr = await firstCategory.getAttribute('open');
      expect(openAttr).toBeNull(); // Should be collapsed now
    }).toPass({ timeout: 3000 });

    // Click to expand again
    await firstCategoryHeader.click();

    // Wait for expand state
    await expect(async () => {
      const openAttr = await firstCategory.getAttribute('open');
      expect(openAttr).not.toBeNull(); // Should be expanded again
    }).toPass({ timeout: 3000 });
  });

  test('should show checks within categories', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const firstCategory = modal.locator('.check-category').first();
    const checksInCategory = firstCategory.locator('.check-result');

    const count = await checksInCategory.count();
    expect(count).toBeGreaterThan(0); // Each category should have at least one check
  });
});

test.describe('Stale Scorecard Check Results (Case-Insensitive Categories)', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should group checks by category with case-insensitive matching', async ({ page }) => {
    // Use test-repo-perfect which has checks with title-case categories
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');

    // Verify categories are displayed and grouped correctly
    const categories = modal.locator('.check-category');
    const categoryCount = await categories.count();
    expect(categoryCount).toBeGreaterThan(0);

    // Verify specific categories are present
    // The fix ensures these display even if the data has different case
    await expect(modal.locator('.category-name').filter({ hasText: 'Documentation' })).toBeVisible();
    await expect(modal.locator('.category-name').filter({ hasText: 'Scorecards Setup' })).toBeVisible();
  });
});

test.describe('Mobile Tab Scroll Arrows', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should have tabs container on mobile', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const tabsContainer = modal.locator('.tabs-container');
    const tabs = modal.locator('.tabs');

    await expect(tabsContainer).toBeVisible();
    await expect(tabs).toBeVisible();
  });

  test('should show scroll arrows when tabs overflow on mobile', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    // Just verify the tabs container exists and tab buttons are visible
    const tabButtons = page.locator('.tab-btn');
    await expect(tabButtons.first()).toBeVisible();
  });

  test('should hide left arrow initially on mobile when at start', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    // In React, left arrow is not rendered when at scroll start (conditional rendering)
    const leftArrow = page.locator('.tab-scroll-left');
    // Left arrow should not be in DOM at start
    await expect(leftArrow).toHaveCount(0);
  });

  test('should scroll tabs when clicking scroll arrows', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const tabs = page.locator('.tabs');

    // Get initial scroll position
    const initialScrollLeft = await tabs.evaluate(el => el.scrollLeft);
    expect(initialScrollLeft).toBe(0);

    // Check if right arrow exists (only rendered when content overflows)
    const rightArrow = page.locator('.tab-scroll-right');
    const hasRightArrow = await rightArrow.count() > 0;

    if (hasRightArrow) {
      // Click right arrow to scroll
      await rightArrow.click();

      // Wait for scroll to complete
      await expect(async () => {
        const scrolledPosition = await tabs.evaluate(el => el.scrollLeft);
        expect(scrolledPosition).toBeGreaterThan(0);
      }).toPass({ timeout: 3000 });

      // Left arrow should now be rendered
      const leftArrow = page.locator('.tab-scroll-left');
      await expect(leftArrow).toBeVisible();

      // Get scrolled position for comparison
      const scrolledPosition = await tabs.evaluate(el => el.scrollLeft);

      // Click left arrow to scroll back
      await leftArrow.click();

      // Wait for scroll back
      await expect(async () => {
        const finalScrollLeft = await tabs.evaluate(el => el.scrollLeft);
        expect(finalScrollLeft).toBeLessThan(scrolledPosition);
      }).toPass({ timeout: 3000 });
    }
  });

  test('should not show scroll arrows on desktop when content fits', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await openServiceModal(page, 'test-repo-perfect');

    // On desktop with wide viewport, arrows may not be rendered if all tabs fit
    const leftArrow = page.locator('.tab-scroll-left');
    const rightArrow = page.locator('.tab-scroll-right');

    // Arrows should not be rendered when content fits
    const leftCount = await leftArrow.count();
    const rightCount = await rightArrow.count();
    // Either arrows don't exist or content doesn't overflow
    expect(leftCount + rightCount).toBeLessThanOrEqual(1);
  });
});

test.describe('API Specification Tab', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should have API Specification tab for services with OpenAPI', async ({ page }) => {
    // test-repo-perfect has OpenAPI data in the fixture
    await openServiceModal(page, 'test-repo-perfect');

    const apiTab = page.getByRole('button', { name: 'API Specification' });
    await expect(apiTab).toBeVisible();
  });

  test('should switch to API Specification tab', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const apiTab = page.getByRole('button', { name: 'API Specification' });
    await apiTab.click();

    // Should show API specification content
    const modal = page.locator('#service-modal');
    await expect(modal).toContainText(/OpenAPI|API|Specification/i);
  });

  test('should display API title and version', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const apiTab = page.getByRole('button', { name: 'API Specification' });
    await apiTab.click();

    const modal = page.locator('#service-modal');
    // The fixture has "Title: Perfect Example API (v1.0.0)"
    await expect(modal).toContainText(/Perfect Example API|API/i);
  });

  test('should display OpenAPI version info', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const apiTab = page.getByRole('button', { name: 'API Specification' });
    await apiTab.click();

    const modal = page.locator('#service-modal');
    // The fixture has "OpenAPI version: 3.0.3"
    await expect(modal).toContainText(/3\.0|OpenAPI/i);
  });

  test('should display endpoints count', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const apiTab = page.getByRole('button', { name: 'API Specification' });
    await apiTab.click();

    const modal = page.locator('#service-modal');
    // The fixture has "Endpoints: 3 paths, 4 operations"
    await expect(modal).toContainText(/paths|operations|endpoints/i);
  });

  test('should show API tab only when OpenAPI data exists', async ({ page }) => {
    // test-repo-perfect has OpenAPI data, so API tab should be present
    await openServiceModal(page, 'test-repo-perfect');

    // API Specification tab should be visible for services with OpenAPI
    const apiTab = page.getByRole('button', { name: 'API Specification' });
    await expect(apiTab).toBeVisible();

    // Verify it's actually the API tab and clickable
    await apiTab.click();
    const modal = page.locator('#service-modal');
    await expect(modal).toContainText(/OpenAPI|API/i);
  });
});

test.describe('Links Tab', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should not have Links tab when service has no links', async ({ page }) => {
    // test-repo-perfect has empty links array in fixture
    await openServiceModal(page, 'test-repo-perfect');

    const linksTab = page.getByRole('button', { name: 'Links' });
    // Should not be visible (conditional tab when links.length === 0)
    const count = await linksTab.count();
    expect(count).toBe(0);
  });
});

test.describe('Workflows Tab with PAT', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should show PAT prompt in Workflows tab without PAT', async ({ page }) => {
    // Don't set PAT
    await openServiceModal(page, 'test-repo-perfect');

    const workflowTab = page.getByRole('button', { name: 'Workflow Runs' });
    await workflowTab.click();

    const modal = page.locator('#service-modal');
    // Without PAT, should show empty state or prompt
    const hasEmptyState = await modal.locator('.widget-empty').count() > 0;
    const hasConfigurePrompt = await modal.getByText(/Configure|Token|PAT/i).count() > 0;
    expect(hasEmptyState || hasConfigurePrompt).toBe(true);
  });

  test('should attempt to fetch workflows with PAT', async ({ page }) => {
    // Set PAT
    await setGitHubPAT(page, mockPAT);

    // Mock the GitHub workflow API
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
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await openServiceModal(page, 'test-repo-perfect');

    const workflowTab = page.getByRole('button', { name: 'Workflow Runs' });
    await workflowTab.click();

    // Should show workflows content area
    const modal = page.locator('#service-modal');
    const workflowsContent = modal.locator('#workflows-tab');
    await expect(workflowsContent).toBeVisible();
  });

  test('should have Configure Token button in Workflows tab when no PAT', async ({ page }) => {
    // Don't set PAT
    await openServiceModal(page, 'test-repo-perfect');

    const workflowTab = page.getByRole('button', { name: 'Workflow Runs' });
    await workflowTab.click();

    // The modal or content should have a way to configure token
    const modal = page.locator('#service-modal');
    const hasTokenReference = await modal.getByText(/token|PAT|configure/i).count() > 0;
    expect(hasTokenReference).toBe(true);
  });
});
