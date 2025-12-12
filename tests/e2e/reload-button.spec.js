/**
 * Reload Button Tests
 * Tests for individual service card reload button functionality
 */

import { test, expect } from './coverage.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  setGitHubPAT,
  mockWorkflowDispatch
} from './test-helper.js';

test.describe('Reload Button', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await mockWorkflowDispatch(page); // Mock workflow dispatch API (success by default)
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  // Keep unchanged - conditional rendering logic
  test('should show reload button only on stale+installed services', async ({ page }) => {
    // Find the stale+installed service card
    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    await expect(staleCard).toBeVisible();

    // Verify it has both STALE and INSTALLED badges
    await expect(staleCard.locator('.badge-stale')).toBeVisible();
    await expect(staleCard.locator('.badge-installed')).toBeVisible();

    // Verify reload button exists
    const reloadBtn = staleCard.locator('.trigger-btn-icon');
    await expect(reloadBtn).toBeVisible();

    // Verify non-stale services don't have reload button
    const perfectCard = page.locator('.service-card').filter({ hasText: 'test-repo-perfect' });
    await expect(perfectCard.locator('.trigger-btn-icon')).not.toBeVisible();
  });

  // Consolidated test: Task 9 - Reload Button Icon-Only Display
  // Note: Button state management removed - button remains static, API success shown via toast
  test('should display only SVG icons (no text) and trigger workflow successfully', async ({ page }) => {
    await mockWorkflowDispatch(page);
    await setGitHubPAT(page, 'test-token-12345');

    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const reloadBtn = staleCard.locator('.trigger-btn-icon');

    // Button displays icon only, no text
    let content = await reloadBtn.innerHTML();
    expect(content).toContain('<svg');
    expect(content).not.toMatch(/Trigger/i);
    expect(content).not.toMatch(/Loading/i);

    // Click the button - triggers API call
    await reloadBtn.click();

    // Verify success toast appears (API was called successfully)
    const toast = page.locator('.toast').filter({ hasText: /workflow triggered/i });
    await expect(toast).toBeVisible();

    // Button remains unchanged (no React state management yet)
    content = await reloadBtn.innerHTML();
    expect(content).toContain('<svg');
    expect(content).not.toMatch(/Success/i);
  });

  test('should show tooltip and trigger workflow successfully', async ({ page }) => {
    await mockWorkflowDispatch(page);
    await setGitHubPAT(page, 'test-token-12345');

    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const reloadBtn = staleCard.locator('.trigger-btn-icon');

    // Should have tooltip "Re-run scorecard workflow"
    await expect(reloadBtn).toHaveAttribute('title', 'Re-run scorecard workflow');

    // Click to trigger workflow
    await reloadBtn.click();

    // Verify success via toast (button state management removed)
    const toast = page.locator('.toast').filter({ hasText: /workflow triggered/i });
    await expect(toast).toBeVisible();

    // Tooltip remains unchanged (no React state management yet)
    await expect(reloadBtn).toHaveAttribute('title', 'Re-run scorecard workflow');
  });

  // Simplified test: Verify button maintains static appearance and triggers API
  test('should maintain static appearance and trigger workflow successfully', async ({ page }) => {
    await setGitHubPAT(page, 'test-token-12345');

    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const reloadBtn = staleCard.locator('.trigger-btn-icon');

    // Initial state: reload icon, orange background
    await expect(reloadBtn).toBeVisible();
    const initialSvgPath = await reloadBtn.locator('svg path').getAttribute('d');
    expect(initialSvgPath).toContain('1.705'); // Reload icon path

    // Click to trigger workflow
    await reloadBtn.click();

    // Verify success via toast
    const toast = page.locator('.toast').filter({ hasText: /workflow triggered/i });
    await expect(toast).toBeVisible();

    // Button remains unchanged (no React state management yet)
    await expect(reloadBtn).not.toBeDisabled();
    const svgPathAfter = await reloadBtn.locator('svg path').getAttribute('d');
    expect(svgPathAfter).toContain('1.705'); // Still reload icon
  });

  // Error path - verify error toast appears
  test('should show error toast on API failure', async ({ page }) => {
    // Re-mock API to return error, then re-navigate
    await mockWorkflowDispatch(page, { status: 500 });
    await page.goto('/');
    await waitForCatalogLoad(page);

    await setGitHubPAT(page, 'test-token-12345');

    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const reloadBtn = staleCard.locator('.trigger-btn-icon');

    // Click the button
    await reloadBtn.click();

    // Verify error toast appears
    const toast = page.locator('.toast').filter({ hasText: /failed.*trigger/i });
    await expect(toast).toBeVisible();

    // Button remains unchanged (no React state management yet)
    await expect(reloadBtn).toHaveAttribute('title', 'Re-run scorecard workflow');
  });

  // Keep unchanged - auth validation test
  test('should show warning when clicking without GitHub PAT', async ({ page }) => {
    // No PAT configured, so auth will fail
    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const reloadBtn = staleCard.locator('.trigger-btn-icon');

    // Click the button without PAT
    await reloadBtn.click();

    // Should show toast notification
    await expect(page.locator('.toast')).toBeVisible();
    await expect(page.locator('.toast')).toContainText(/configure.*GitHub.*PAT/i);

    // Should NOT change button state (still orange, reload icon)
    await expect(reloadBtn).toHaveCSS('background', /rgb\(245, 158, 11\)/);
  });

  // Accessibility test - verify keyboard navigation works
  test('should be keyboard accessible', async ({ page }) => {
    await setGitHubPAT(page, 'test-token-12345');

    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const reloadBtn = staleCard.locator('.trigger-btn-icon');

    // Focus the button using keyboard
    await reloadBtn.focus();
    await expect(reloadBtn).toBeFocused();

    // Press Enter to trigger
    await page.keyboard.press('Enter');

    // Verify success via toast (button state management removed)
    const toast = page.locator('.toast').filter({ hasText: /workflow triggered/i });
    await expect(toast).toBeVisible();

    // Button remains enabled and unchanged
    await expect(reloadBtn).not.toBeDisabled();
  });
});
