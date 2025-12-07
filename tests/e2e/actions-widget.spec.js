/**
 * Actions Widget E2E Tests
 * Tests for the GitHub Actions workflow monitoring sidebar widget
 */

import { test, expect } from './coverage.js';
import { mockPAT } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  setGitHubPAT,
  openSettingsModal,
  closeSettingsModal,
} from './test-helper.js';

// Mock workflow runs data
const mockWorkflowRunsData = {
  total_count: 5,
  workflow_runs: [
    {
      id: 1,
      name: 'Scorecards Workflow',
      status: 'completed',
      conclusion: 'success',
      html_url: 'https://github.com/test/repo/actions/runs/1',
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      run_started_at: new Date(Date.now() - 3660000).toISOString(),
    },
    {
      id: 2,
      name: 'Scorecards Workflow',
      status: 'completed',
      conclusion: 'failure',
      html_url: 'https://github.com/test/repo/actions/runs/2',
      created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      updated_at: new Date(Date.now() - 7200000).toISOString(),
      run_started_at: new Date(Date.now() - 7260000).toISOString(),
    },
    {
      id: 3,
      name: 'Scorecards Workflow',
      status: 'in_progress',
      conclusion: null,
      html_url: 'https://github.com/test/repo/actions/runs/3',
      created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      updated_at: new Date(Date.now() - 300000).toISOString(),
      run_started_at: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: 4,
      name: 'Scorecards Workflow',
      status: 'queued',
      conclusion: null,
      html_url: 'https://github.com/test/repo/actions/runs/4',
      created_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      updated_at: new Date(Date.now() - 60000).toISOString(),
      run_started_at: null,
    },
    {
      id: 5,
      name: 'Scorecards Workflow',
      status: 'completed',
      conclusion: 'cancelled',
      html_url: 'https://github.com/test/repo/actions/runs/5',
      created_at: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      updated_at: new Date(Date.now() - 10800000).toISOString(),
      run_started_at: new Date(Date.now() - 10860000).toISOString(),
    },
  ],
};

/**
 * Mock GitHub workflow runs API endpoint
 * @param {import('@playwright/test').Page} page
 * @param {Object} options
 */
async function mockWorkflowRuns(page, { runs = mockWorkflowRunsData, status = 200, delay = 0 } = {}) {
  await page.route('**/api.github.com/repos/**/actions/runs*', async (route) => {
    const headers = route.request().headers();
    const hasAuth = headers['authorization'] && headers['authorization'].startsWith('token ');

    if (!hasAuth) {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ message: 'Requires authentication' }),
        headers: { 'Content-Type': 'application/json' },
      });
      return;
    }

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    await route.fulfill({
      status: status,
      body: JSON.stringify(runs),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

// Selector for React widget (excludes the HTML-based widget with id="widget-sidebar")
const REACT_WIDGET_SELECTOR = '.widget-sidebar:not(#widget-sidebar)';
const REACT_WIDGET_OPEN_SELECTOR = '.widget-sidebar.open:not(#widget-sidebar)';

/**
 * Open the Actions Widget
 * @param {import('@playwright/test').Page} page
 */
async function openActionsWidget(page) {
  await page.getByRole('button', { name: 'Show GitHub Actions' }).click();
  await page.waitForSelector(REACT_WIDGET_OPEN_SELECTOR, { state: 'visible', timeout: 5000 });
}

/**
 * Close the Actions Widget
 * @param {import('@playwright/test').Page} page
 */
async function closeActionsWidget(page) {
  // Use the React widget's close button (it's inside the React widget, not the HTML one)
  await page.locator(`${REACT_WIDGET_SELECTOR} button[aria-label="Close widget"]`).click();
  await page.waitForSelector(REACT_WIDGET_OPEN_SELECTOR, { state: 'hidden' });
}

test.describe('Actions Widget', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await mockWorkflowRuns(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test.describe('Opening and Closing', () => {
    test('should have Actions button visible', async ({ page }) => {
      const actionsButton = page.getByRole('button', { name: 'Show GitHub Actions' });
      await expect(actionsButton).toBeVisible();
    });

    test('should open widget when clicking Actions button', async ({ page }) => {
      await openActionsWidget(page);

      const sidebar = page.locator(REACT_WIDGET_OPEN_SELECTOR);
      await expect(sidebar).toBeVisible();
      await expect(sidebar).toContainText('GitHub Actions');
    });

    test('should close widget when clicking close button', async ({ page }) => {
      await openActionsWidget(page);

      // Close by clicking the X button using aria-label (scoped to React widget)
      await page.locator(`${REACT_WIDGET_SELECTOR} button[aria-label="Close widget"]`).click();
      await page.waitForSelector(REACT_WIDGET_OPEN_SELECTOR, { state: 'hidden' });

      const sidebar = page.locator(REACT_WIDGET_OPEN_SELECTOR);
      await expect(sidebar).not.toBeVisible();
    });

    test('should close widget when clicking backdrop', async ({ page }) => {
      await openActionsWidget(page);

      // Click the backdrop
      await page.locator('.widget-backdrop').click();

      const sidebar = page.locator(REACT_WIDGET_OPEN_SELECTOR);
      await expect(sidebar).not.toBeVisible();
    });

    test('should show header with GitHub Actions link', async ({ page }) => {
      await openActionsWidget(page);

      const link = page.locator(`${REACT_WIDGET_SELECTOR} .widget-header-link`);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', /github\.com.*actions/);
      await expect(link).toHaveAttribute('target', '_blank');
    });
  });

  test.describe('Authentication Required', () => {
    test('should show PAT required message when not authenticated', async ({ page }) => {
      await openActionsWidget(page);

      // The React widget-sidebar contains the widget-content div with empty state
      const widgetContent = page.locator(`${REACT_WIDGET_SELECTOR} .widget-content`);
      await expect(widgetContent).toBeVisible();
      await expect(widgetContent).toContainText('Configure GitHub PAT');

      const configureButton = page.locator(`${REACT_WIDGET_SELECTOR} .btn--primary`);
      await expect(configureButton).toBeVisible();
      await expect(configureButton).toContainText('Configure Token');
    });

    test('should close widget when clicking Configure Token button', async ({ page }) => {
      await openActionsWidget(page);

      // Verify button exists and is clickable
      const configureButton = page.locator(`${REACT_WIDGET_SELECTOR} .btn--primary`);
      await expect(configureButton).toBeVisible();

      await configureButton.click();

      // Widget should close after clicking Configure Token
      const sidebar = page.locator(REACT_WIDGET_OPEN_SELECTOR);
      await expect(sidebar).not.toBeVisible();
    });
  });

  test.describe('With Authentication', () => {
    test.beforeEach(async ({ page }) => {
      await setGitHubPAT(page, mockPAT);
    });

    test('should display workflow runs when authenticated', async ({ page }) => {
      await openActionsWidget(page);

      // Wait for workflow items to load in React widget
      await page.waitForSelector(`${REACT_WIDGET_SELECTOR} .widget-run-item`, { state: 'visible', timeout: 5000 });

      const runItems = page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item`);
      await expect(runItems).toHaveCount(5);
    });

    test('should show correct status icons for workflow runs', async ({ page }) => {
      await openActionsWidget(page);
      await page.waitForSelector(`${REACT_WIDGET_SELECTOR} .widget-run-item`, { state: 'visible', timeout: 5000 });

      // Check for success icon
      const successItem = page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item--success`);
      await expect(successItem).toBeVisible();

      // Check for failure icon
      const failureItem = page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item--failure`);
      await expect(failureItem).toBeVisible();

      // Check for in_progress item
      const runningItem = page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item--in_progress`);
      await expect(runningItem).toBeVisible();

      // Check for queued item
      const queuedItem = page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item--queued`);
      await expect(queuedItem).toBeVisible();
    });

    test('should display workflow run details', async ({ page }) => {
      await openActionsWidget(page);
      await page.waitForSelector(`${REACT_WIDGET_SELECTOR} .widget-run-item`, { state: 'visible', timeout: 5000 });

      const firstRun = page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item`).first();

      // Should show workflow name
      await expect(firstRun.locator('.widget-run-name')).toContainText('Scorecards Workflow');

      // Should show View link
      const viewLink = firstRun.locator('.widget-run-link');
      await expect(viewLink).toBeVisible();
      await expect(viewLink).toHaveAttribute('href', /github\.com.*actions\/runs/);
    });

    test('should show duration/timestamp for workflow runs', async ({ page }) => {
      await openActionsWidget(page);
      await page.waitForSelector(`${REACT_WIDGET_SELECTOR} .widget-run-item`, { state: 'visible', timeout: 5000 });

      const durationText = page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-duration`).first();
      await expect(durationText).toBeVisible();
      // Should contain duration-related text
      await expect(durationText).toContainText(/Completed|Running for|Queued/);
    });
  });

  test.describe('Status Filtering', () => {
    test.beforeEach(async ({ page }) => {
      await setGitHubPAT(page, mockPAT);
    });

    test('should show filter buttons', async ({ page }) => {
      await openActionsWidget(page);

      // Use React widget selector to be specific
      const filters = page.locator(`${REACT_WIDGET_SELECTOR} .widget-filters`);
      await expect(filters).toBeVisible();

      // Filter buttons are inside .widget-filters
      await expect(filters.locator('.filter-btn').filter({ hasText: 'All' })).toBeVisible();
      await expect(filters.locator('.filter-btn').filter({ hasText: 'Running' })).toBeVisible();
      await expect(filters.locator('.filter-btn').filter({ hasText: 'Queued' })).toBeVisible();
      await expect(filters.locator('.filter-btn').filter({ hasText: 'Done' })).toBeVisible();
    });

    test('should show All filter as active by default', async ({ page }) => {
      await openActionsWidget(page);

      const allFilter = page.locator(`${REACT_WIDGET_SELECTOR} .widget-filters .filter-btn`).filter({ hasText: 'All' });
      await expect(allFilter).toHaveClass(/filter-btn--active/);
    });

    test('should filter to Running workflows', async ({ page }) => {
      await openActionsWidget(page);
      await page.waitForSelector(`${REACT_WIDGET_SELECTOR} .widget-run-item`, { state: 'visible', timeout: 5000 });

      // Click Running filter
      await page.locator(`${REACT_WIDGET_SELECTOR} .widget-filters .filter-btn`).filter({ hasText: 'Running' }).click();

      // Should only show in_progress items
      const runItems = page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item`);
      await expect(runItems).toHaveCount(1);
      await expect(page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item--in_progress`)).toBeVisible();
    });

    test('should filter to Queued workflows', async ({ page }) => {
      await openActionsWidget(page);
      await page.waitForSelector(`${REACT_WIDGET_SELECTOR} .widget-run-item`, { state: 'visible', timeout: 5000 });

      // Click Queued filter
      await page.locator(`${REACT_WIDGET_SELECTOR} .widget-filters .filter-btn`).filter({ hasText: 'Queued' }).click();

      // Should only show queued items
      const runItems = page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item`);
      await expect(runItems).toHaveCount(1);
      await expect(page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item--queued`)).toBeVisible();
    });

    test('should filter to Done (completed) workflows', async ({ page }) => {
      await openActionsWidget(page);
      await page.waitForSelector(`${REACT_WIDGET_SELECTOR} .widget-run-item`, { state: 'visible', timeout: 5000 });

      // Click Done filter
      await page.locator(`${REACT_WIDGET_SELECTOR} .widget-filters .filter-btn`).filter({ hasText: 'Done' }).click();

      // Should only show completed items (success, failure, cancelled)
      const runItems = page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item`);
      await expect(runItems).toHaveCount(3);
    });

    test('should show filter counts', async ({ page }) => {
      await openActionsWidget(page);
      await page.waitForSelector(`${REACT_WIDGET_SELECTOR} .widget-run-item`, { state: 'visible', timeout: 5000 });

      // Check filter counts - counts appear in parentheses like "(5)"
      const allCount = page.locator(`${REACT_WIDGET_SELECTOR} .widget-filters .filter-btn`).filter({ hasText: 'All' }).locator('.filter-btn__count');
      await expect(allCount).toContainText('(5)');

      const runningCount = page.locator(`${REACT_WIDGET_SELECTOR} .widget-filters .filter-btn`).filter({ hasText: 'Running' }).locator('.filter-btn__count');
      await expect(runningCount).toContainText('(1)');

      const queuedCount = page.locator(`${REACT_WIDGET_SELECTOR} .widget-filters .filter-btn`).filter({ hasText: 'Queued' }).locator('.filter-btn__count');
      await expect(queuedCount).toContainText('(1)');

      const doneCount = page.locator(`${REACT_WIDGET_SELECTOR} .widget-filters .filter-btn`).filter({ hasText: 'Done' }).locator('.filter-btn__count');
      await expect(doneCount).toContainText('(3)');
    });

    test('should update active filter styling when clicking', async ({ page }) => {
      await openActionsWidget(page);

      const runningFilter = page.locator(`${REACT_WIDGET_SELECTOR} .widget-filters .filter-btn`).filter({ hasText: 'Running' });
      await runningFilter.click();

      await expect(runningFilter).toHaveClass(/filter-btn--active/);

      const allFilter = page.locator(`${REACT_WIDGET_SELECTOR} .widget-filters .filter-btn`).filter({ hasText: 'All' });
      await expect(allFilter).not.toHaveClass(/filter-btn--active/);
    });
  });

  test.describe('Polling Interval', () => {
    test.beforeEach(async ({ page }) => {
      await setGitHubPAT(page, mockPAT);
    });

    test('should show polling interval dropdown', async ({ page }) => {
      await openActionsWidget(page);

      // The select has aria-label="Refresh interval" within the React widget
      const intervalSelect = page.locator(`${REACT_WIDGET_SELECTOR} select[aria-label="Refresh interval"]`);
      await expect(intervalSelect).toBeVisible();
    });

    test('should have 30s as default polling option', async ({ page }) => {
      await openActionsWidget(page);

      const intervalSelect = page.locator(`${REACT_WIDGET_SELECTOR} select[aria-label="Refresh interval"]`);
      // Default polling interval is 30 seconds (30000ms)
      await expect(intervalSelect).toHaveValue('30000');
    });

    test('should show polling interval options', async ({ page }) => {
      await openActionsWidget(page);

      const intervalSelect = page.locator(`${REACT_WIDGET_SELECTOR} select[aria-label="Refresh interval"]`);

      // Check for various interval options - 8 total
      await expect(intervalSelect.locator('option')).toHaveCount(8);
      await expect(intervalSelect.locator('option[value="0"]')).toHaveText('Disabled');
      await expect(intervalSelect.locator('option[value="5000"]')).toHaveText('5s');
      await expect(intervalSelect.locator('option[value="30000"]')).toHaveText('30s');
      await expect(intervalSelect.locator('option[value="60000"]')).toHaveText('1m');
    });

    test('should change polling interval', async ({ page }) => {
      await openActionsWidget(page);

      const intervalSelect = page.locator(`${REACT_WIDGET_SELECTOR} select[aria-label="Refresh interval"]`);
      await intervalSelect.selectOption('30000');

      await expect(intervalSelect).toHaveValue('30000');
    });

    test('should show status bar with auto-refresh message by default (30s)', async ({ page }) => {
      await openActionsWidget(page);

      const statusBar = page.locator(`${REACT_WIDGET_SELECTOR} .widget-status-bar`);
      await expect(statusBar).toBeVisible();
      // Default is 30s polling, so status bar shows "Auto-refreshing"
      await expect(statusBar).toContainText('Auto-refreshing');
    });

    test('should update status bar when polling is disabled', async ({ page }) => {
      await openActionsWidget(page);

      // Disable polling - use React widget-scoped select
      const intervalSelect = page.locator(`${REACT_WIDGET_SELECTOR} select[aria-label="Refresh interval"]`);
      await intervalSelect.selectOption('0');

      const statusBar = page.locator(`${REACT_WIDGET_SELECTOR} .widget-status-bar`);
      await expect(statusBar).toContainText('Auto-refresh disabled');
    });
  });

  test.describe('Refresh Button', () => {
    test.beforeEach(async ({ page }) => {
      await setGitHubPAT(page, mockPAT);
    });

    test('should have refresh button', async ({ page }) => {
      await openActionsWidget(page);

      // Refresh button has title="Refresh now" within React widget
      const refreshButton = page.locator(`${REACT_WIDGET_SELECTOR} button[title="Refresh now"]`);
      await expect(refreshButton).toBeVisible();
    });

    test('should refresh data when clicking refresh button', async ({ page }) => {
      await openActionsWidget(page);
      await page.waitForSelector(`${REACT_WIDGET_SELECTOR} .widget-run-item`, { state: 'visible', timeout: 5000 });

      // Click refresh
      const refreshButton = page.locator(`${REACT_WIDGET_SELECTOR} button[title="Refresh now"]`);
      await refreshButton.click();

      // Items should still be visible after refresh
      await expect(page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item`).first()).toBeVisible();
    });
  });

  test.describe('Empty State', () => {
    test('should show empty state when no workflow runs', async ({ page }) => {
      // Override mock to return empty runs
      await page.route('**/api.github.com/repos/**/actions/runs*', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ total_count: 0, workflow_runs: [] }),
          headers: { 'Content-Type': 'application/json' },
        });
      });

      await setGitHubPAT(page, mockPAT);
      await openActionsWidget(page);

      // Scope to React widget's .widget-content for unique match
      const widgetContent = page.locator(`${REACT_WIDGET_SELECTOR} .widget-content`);
      await expect(widgetContent).toBeVisible();
      await expect(widgetContent).toContainText('No');
      await expect(widgetContent).toContainText('workflow runs');
    });
  });

  test.describe('Error Handling', () => {
    test('should show error state on API failure', async ({ page }) => {
      // Override mock to return error
      await page.route('**/api.github.com/repos/**/actions/runs*', async (route) => {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ message: 'Internal Server Error' }),
          headers: { 'Content-Type': 'application/json' },
        });
      });

      await setGitHubPAT(page, mockPAT);
      await openActionsWidget(page);

      // Wait for error state to appear
      const errorState = page.locator(`${REACT_WIDGET_SELECTOR} .widget-empty--error`);
      await expect(errorState).toBeVisible();
      await expect(errorState).toContainText('Error');
    });
  });
});
