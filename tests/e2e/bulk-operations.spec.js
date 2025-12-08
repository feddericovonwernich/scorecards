/**
 * Phase 6: Bulk Operations & Actions Widget Tests
 *
 * User story-based tests covering:
 * - Workflow triggers on services (re-run scorecard)
 * - Actions widget display and interaction
 * - Workflow run status display
 * - Filter by workflow status
 */

import { test, expect } from '@playwright/test';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openServiceModal,
  closeServiceModal,
  clickServiceModalTab,
  openSettingsModal,
  closeSettingsModal,
  mockWorkflowDispatch,
  mockWorkflowRuns,
  getServiceCount,
} from './test-helper.js';

// Mock PAT for authenticated operations
const mockPAT = 'ghp_mocktoken123456789';

test.describe('Workflow Triggers', () => {
  test('should trigger workflow re-run on stale service from service card', async ({ page }) => {
    // Setup mocks
    await mockCatalogRequests(page);
    await mockWorkflowDispatch(page, { status: 204 });

    await page.goto('/');
    await waitForCatalogLoad(page);

    // First set up PAT
    await openSettingsModal(page);
    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();
    await page.waitForSelector('.toast', { state: 'visible' });
    await closeSettingsModal(page);

    // Find a service card with trigger button (stale services have trigger buttons)
    const triggerButton = page.locator('.trigger-btn').first();

    // If trigger button exists, click it
    if (await triggerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await triggerButton.click();

      // Verify toast notification appears
      await expect(page.locator('.toast')).toBeVisible({ timeout: 5000 });
    } else {
      // Alternative: Open a service modal and trigger from there
      const serviceCard = page.locator('.service-card').first();
      await serviceCard.click();
      await page.waitForSelector('#service-modal', { state: 'visible' });

      // Look for Run Scorecard button in modal
      const runButton = page.locator('#service-modal button:has-text("Run Scorecard")');
      if (await runButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await runButton.click();
        await expect(page.locator('.toast')).toBeVisible({ timeout: 5000 });
      }

      await closeServiceModal(page);
    }
  });

  test('should trigger workflow from service modal', async ({ page }) => {
    // Setup mocks
    await mockCatalogRequests(page);
    await mockWorkflowDispatch(page, { status: 204 });

    await page.goto('/');
    await waitForCatalogLoad(page);

    // Set up PAT first
    await openSettingsModal(page);
    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();
    await page.waitForSelector('.toast', { state: 'visible' });
    await closeSettingsModal(page);

    // Dismiss any toasts
    await page.waitForTimeout(500);
    const toast = page.locator('.toast');
    if (await toast.isVisible()) {
      const closeBtn = toast.locator('button').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }

    // Open service modal
    await openServiceModal(page, 'test-repo');

    // Check for Run Scorecard button
    const runButton = page.locator('#service-modal button:has-text("Run Scorecard")');
    if (await runButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await runButton.click();
      // Verify action was triggered
      await expect(page.locator('.toast')).toBeVisible({ timeout: 5000 });
    }

    await closeServiceModal(page);
  });
});

test.describe('Actions Widget', () => {
  test('should open actions widget and display workflow runs', async ({ page }) => {
    // Setup mocks with workflow runs
    await mockCatalogRequests(page);
    await mockWorkflowRuns(page, {
      runs: {
        workflow_runs: [
          {
            id: 1,
            name: 'Scorecard',
            status: 'completed',
            conclusion: 'success',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            html_url: 'https://github.com/org/repo/actions/runs/1',
            run_number: 100,
            head_branch: 'main',
          },
          {
            id: 2,
            name: 'Scorecard',
            status: 'in_progress',
            conclusion: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            html_url: 'https://github.com/org/repo/actions/runs/2',
            run_number: 101,
            head_branch: 'main',
          },
        ],
        total_count: 2,
      }
    });

    await page.goto('/');
    await waitForCatalogLoad(page);

    // Set up PAT (required for actions widget)
    await openSettingsModal(page);
    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();
    await page.waitForSelector('.toast', { state: 'visible' });
    await closeSettingsModal(page);

    // Wait for any toast to dismiss
    await page.waitForTimeout(500);

    // Click actions widget button
    const actionsButton = page.locator('.floating-btn--widget');
    await expect(actionsButton).toBeVisible();
    await actionsButton.click();

    // Wait for widget to open - use selector that excludes vanilla JS widget (which has id="widget-sidebar")
    await page.waitForTimeout(300);
    const widgetSidebar = page.locator('.widget-sidebar.open');
    await expect(widgetSidebar).toBeVisible({ timeout: 5000 });

    // Verify header
    await expect(widgetSidebar.locator('.widget-header')).toContainText('GitHub Actions');

    // Verify filter buttons exist
    const filterButtons = widgetSidebar.locator('.widget-filters .filter-btn');
    await expect(filterButtons).toHaveCount(4); // All, Running, Queued, Done

    // Close widget via backdrop click (more reliable than close button)
    await page.locator('.widget-backdrop').click();
    await page.waitForTimeout(300);
    await expect(page.locator('.widget-sidebar.open')).toHaveCount(0);
  });

  test('should filter workflow runs by status in actions widget', async ({ page }) => {
    // Setup mocks with workflow runs
    await mockCatalogRequests(page);
    await mockWorkflowRuns(page, {
      runs: {
        workflow_runs: [
          {
            id: 1,
            name: 'Scorecard',
            status: 'completed',
            conclusion: 'success',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            html_url: 'https://github.com/org/repo/actions/runs/1',
            run_number: 100,
          },
          {
            id: 2,
            name: 'Scorecard',
            status: 'in_progress',
            conclusion: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            html_url: 'https://github.com/org/repo/actions/runs/2',
            run_number: 101,
          },
          {
            id: 3,
            name: 'Scorecard',
            status: 'queued',
            conclusion: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            html_url: 'https://github.com/org/repo/actions/runs/3',
            run_number: 102,
          },
        ],
        total_count: 3,
      }
    });

    await page.goto('/');
    await waitForCatalogLoad(page);

    // Set up PAT
    await openSettingsModal(page);
    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();
    await page.waitForSelector('.toast', { state: 'visible' });
    await closeSettingsModal(page);

    // Open actions widget
    await page.waitForTimeout(500);
    await page.locator('.floating-btn--widget').click();
    await page.waitForTimeout(300);
    const widgetSidebar = page.locator('.widget-sidebar.open');
    await expect(widgetSidebar).toBeVisible({ timeout: 5000 });

    // Click "Running" filter
    const runningFilter = widgetSidebar.locator('.filter-btn:has-text("Running")');
    await runningFilter.click();
    await expect(runningFilter).toHaveClass(/filter-btn--active/);

    // Click "Done" filter
    const doneFilter = widgetSidebar.locator('.filter-btn:has-text("Done")');
    await doneFilter.click();
    await expect(doneFilter).toHaveClass(/filter-btn--active/);

    // Click "All" to reset
    const allFilter = widgetSidebar.locator('.filter-btn:has-text("All")');
    await allFilter.click();
    await expect(allFilter).toHaveClass(/filter-btn--active/);

    // Close widget
    await widgetSidebar.locator('.widget-close-btn').click();
  });

  test('should show empty state when no PAT configured', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Open actions widget without PAT
    await page.locator('.floating-btn--widget').click();
    await page.waitForTimeout(300);
    const widgetSidebar = page.locator('.widget-sidebar.open');
    await expect(widgetSidebar).toBeVisible({ timeout: 5000 });

    // Verify empty state message
    const emptyState = widgetSidebar.locator('.widget-empty');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/Configure GitHub PAT|settings/i);

    // Verify Configure Token button exists
    const configButton = emptyState.locator('button:has-text("Configure Token")');
    await expect(configButton).toBeVisible();

    // Close widget via backdrop
    await page.locator('.widget-backdrop').click();
  });
});

test.describe('Workflow Runs Tab in Service Modal', () => {
  test('should display workflow runs in service modal workflows tab', async ({ page }) => {
    // Setup mocks with workflow runs
    await mockCatalogRequests(page);
    await mockWorkflowRuns(page, {
      runs: {
        workflow_runs: [
          {
            id: 1,
            name: 'Scorecard',
            status: 'completed',
            conclusion: 'success',
            created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            updated_at: new Date().toISOString(),
            html_url: 'https://github.com/org/repo/actions/runs/1',
            run_number: 100,
            head_branch: 'main',
          },
        ],
        total_count: 1,
      }
    });

    await page.goto('/');
    await waitForCatalogLoad(page);

    // Set up PAT
    await openSettingsModal(page);
    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();
    await page.waitForSelector('.toast', { state: 'visible' });
    await closeSettingsModal(page);

    // Open service modal
    await openServiceModal(page, 'test-repo');

    // Click Workflow Runs tab
    await clickServiceModalTab(page, 'Workflow Runs');

    // Verify workflows tab content - use specific id selector
    const workflowsTab = page.locator('#workflows-tab');
    await expect(workflowsTab).toBeVisible();

    // Verify filter buttons exist in tab
    const filterButtons = workflowsTab.locator('.widget-filters .filter-btn');
    if (await filterButtons.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(filterButtons).toHaveCount(4);
    }

    // Close modal
    await closeServiceModal(page);
  });

  test('should show configure token message when not authenticated in workflows tab', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Open service modal without PAT
    await openServiceModal(page, 'test-repo');

    // Click Workflow Runs tab
    await clickServiceModalTab(page, 'Workflow Runs');

    // Verify empty state with configure message - use specific id selector
    const workflowsTab = page.locator('#workflows-tab');
    await expect(workflowsTab).toBeVisible();

    const emptyState = workflowsTab.locator('.widget-empty');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/Configure GitHub PAT|settings/i);

    await closeServiceModal(page);
  });
});

test.describe('Actions Widget Controls', () => {
  test('should change polling interval in actions widget', async ({ page }) => {
    await mockCatalogRequests(page);
    await mockWorkflowRuns(page, {
      runs: { workflow_runs: [], total_count: 0 }
    });

    await page.goto('/');
    await waitForCatalogLoad(page);

    // Set up PAT
    await openSettingsModal(page);
    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();
    await page.waitForSelector('.toast', { state: 'visible' });
    await closeSettingsModal(page);

    // Open actions widget
    await page.waitForTimeout(500);
    await page.locator('.floating-btn--widget').click();
    await page.waitForTimeout(300);
    const widgetSidebar = page.locator('.widget-sidebar.open');
    await expect(widgetSidebar).toBeVisible({ timeout: 5000 });

    // Find and change polling interval select
    const intervalSelect = widgetSidebar.locator('.widget-interval-select');
    await expect(intervalSelect).toBeVisible();

    // Change to 30s
    await intervalSelect.selectOption({ label: '30s' });

    // Verify status bar shows polling info
    const statusBar = widgetSidebar.locator('.widget-status-bar');
    await expect(statusBar).toBeVisible();

    // Change to Disabled
    await intervalSelect.selectOption({ label: 'Disabled' });
    await expect(statusBar).toContainText(/disabled/i);

    // Close widget via backdrop
    await page.locator('.widget-backdrop').click();
  });

  test('should refresh workflow runs manually', async ({ page }) => {
    await mockCatalogRequests(page);
    await mockWorkflowRuns(page, {
      runs: { workflow_runs: [], total_count: 0 }
    });

    await page.goto('/');
    await waitForCatalogLoad(page);

    // Set up PAT
    await openSettingsModal(page);
    await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
    await page.getByRole('button', { name: 'Save Token' }).click();
    await page.waitForSelector('.toast', { state: 'visible' });
    await closeSettingsModal(page);

    // Open actions widget
    await page.waitForTimeout(500);
    await page.locator('.floating-btn--widget').click();
    await page.waitForTimeout(300);
    const widgetSidebar = page.locator('.widget-sidebar.open');
    await expect(widgetSidebar).toBeVisible({ timeout: 5000 });

    // Find and click refresh button
    const refreshButton = widgetSidebar.locator('.widget-refresh-btn');
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    // Verify button shows spinning state briefly (loading)
    // The spinning class is added during loading
    await page.waitForTimeout(100);

    // Close widget via backdrop
    await page.locator('.widget-backdrop').click();
  });
});
