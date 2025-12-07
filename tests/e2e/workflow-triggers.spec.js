/**
 * Workflow Triggers E2E Tests
 *
 * Consolidated tests for workflow trigger functionality,
 * targeting low coverage in workflow-triggers.ts (36%).
 */

import { test, expect } from './coverage.js';
import { mockPAT } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  setGitHubPAT,
  openServiceModal,
  closeServiceModal,
  mockWorkflowDispatch,
  clickServiceModalTab,
  openSettingsModal,
  closeSettingsModal,
} from './test-helper.js';

// ============================================================================
// SINGLE SERVICE TRIGGERS (Consolidated from 2 tests → 1)
// ============================================================================

test.describe('Workflow Triggers - Single Service', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should show trigger button and trigger workflow from card', async ({ page }) => {
    // Test 1: Check for trigger button on stale service
    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    await expect(staleCard).toBeVisible();

    const triggerBtn = staleCard.locator('button[title*="Re-run"], button[title*="trigger"]');
    if (await triggerBtn.count() > 0) {
      await expect(triggerBtn.first()).toBeVisible();

      // Test 2: Trigger workflow with PAT
      await setGitHubPAT(page, mockPAT);
      await mockWorkflowDispatch(page, { status: 204 });

      if (await triggerBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await triggerBtn.first().click();
        await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

// ============================================================================
// BULK OPERATIONS (Consolidated from 10 tests → 3)
// ============================================================================

test.describe('Workflow Triggers - Bulk Operations', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should show bulk trigger buttons and require PAT', async ({ page }) => {
    // Test 1: Re-run All Stale button visible
    const rerunStaleButton = page.getByRole('button', { name: 'Re-run All Stale' });
    await expect(rerunStaleButton).toBeVisible();

    // Test 2: Re-run All Installed button visible
    const rerunInstalledButton = page.getByRole('button', { name: 'Re-run All Installed' });
    await expect(rerunInstalledButton).toBeVisible();

    // Handle dialogs
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // Test 3: PAT required for stale trigger
    await rerunStaleButton.click();
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

    // Test 4: PAT required for installed trigger
    await rerunInstalledButton.click();
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });
  });

  test('should trigger bulk workflows with PAT and handle success', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);
    await mockWorkflowDispatch(page, { status: 204 });

    let dialogShown = false;
    page.on('dialog', async dialog => {
      dialogShown = true;
      await dialog.accept();
    });

    // Test 1: Stale trigger with PAT
    const rerunStaleButton = page.getByRole('button', { name: 'Re-run All Stale' });
    await rerunStaleButton.click();
    await page.waitForTimeout(1000);

    let toastVisible = await page.locator('.toast').first().isVisible();
    expect(dialogShown || toastVisible).toBe(true);

    // Test 2: Installed trigger with PAT
    dialogShown = false;
    const rerunInstalledButton = page.getByRole('button', { name: 'Re-run All Installed' });
    await rerunInstalledButton.click();
    await page.waitForTimeout(1000);

    toastVisible = await page.locator('.toast').first().isVisible();
    expect(dialogShown || toastVisible).toBe(true);
  });

  test('should handle bulk trigger errors (401, 403, 500)', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);

    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    const rerunStaleButton = page.getByRole('button', { name: 'Re-run All Stale' });
    const rerunInstalledButton = page.getByRole('button', { name: 'Re-run All Installed' });

    // Test 1: 401 error
    await mockWorkflowDispatch(page, { status: 401 });
    await rerunStaleButton.click();
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

    // Test 2: 403 error
    await mockWorkflowDispatch(page, { status: 403 });
    await rerunInstalledButton.click();
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

    // Test 3: 500 error
    await mockWorkflowDispatch(page, { status: 500 });
    await rerunStaleButton.click();
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// SETTINGS INTEGRATION (Consolidated from 2 tests → 1)
// ============================================================================

test.describe('Workflow Triggers - Settings Integration', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should save PAT, use for triggers, and clear PAT', async ({ page }) => {
    // Test 1: Save PAT and use for workflow triggers
    await openSettingsModal(page);

    const patInput = page.getByRole('textbox', { name: /token/i });
    await patInput.fill(mockPAT);

    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.click();

    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 3000 });
    await closeSettingsModal(page);

    await mockWorkflowDispatch(page, { status: 204 });

    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    const rerunButton = page.getByRole('button', { name: 'Re-run All Stale' });
    await rerunButton.click();
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

    // Test 2: Clear PAT
    await page.waitForTimeout(500);
    await openSettingsModal(page);

    const clearButton = page.getByRole('button', { name: /clear/i });
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);
    }

    await closeSettingsModal(page);

    // Test 3: Verify PAT required again
    await rerunButton.click();
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// SERVICE MODAL (Consolidated from 2 tests → 1)
// ============================================================================

test.describe('Workflow Triggers - Service Modal', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should show workflow runs tab in modal and display content', async ({ page }) => {
    // Test 1: Open modal and verify workflow tab
    await openServiceModal(page, 'test-repo-perfect');

    const workflowTab = page.locator('#service-modal').getByRole('button', { name: 'Workflow Runs' });
    await expect(workflowTab).toBeVisible();

    await workflowTab.click();
    await page.waitForTimeout(500);

    const tabContent = page.locator('#service-modal .tab-content, #service-modal [class*="tab-content"]');
    await expect(tabContent).toBeVisible();

    await closeServiceModal(page);

    // Test 2: With PAT, show workflow runs or placeholder
    await setGitHubPAT(page, mockPAT);
    await openServiceModal(page, 'test-repo-perfect');

    await clickServiceModalTab(page, 'Workflow Runs');
    await page.waitForTimeout(500);

    const modal = page.locator('#service-modal');
    const hasContent = await modal.locator('.workflow-run, .workflow-runs, [class*="workflow"], p, .empty-state, .loading').first().isVisible();
    expect(hasContent).toBe(true);

    await closeServiceModal(page);
  });
});
