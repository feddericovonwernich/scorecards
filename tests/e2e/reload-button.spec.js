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

  test('should never display text in button, only icons', async ({ page }) => {
    await setGitHubPAT(page, 'test-token-12345');

    // Find reload button
    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const reloadBtn = staleCard.locator('.trigger-btn-icon');

    // Before click: should only contain SVG, no text nodes
    const initialContent = await reloadBtn.innerHTML();
    expect(initialContent).toContain('<svg');
    expect(initialContent).not.toMatch(/Trigger/i);
    expect(initialContent).not.toMatch(/Loading/i);

    // Click the button
    await reloadBtn.click();

    // During loading: still no text visible
    const loadingContent = await reloadBtn.innerHTML();
    expect(loadingContent).toContain('<svg');
    expect(loadingContent).not.toMatch(/Trigger/i);

    // Wait for success state
    await expect(reloadBtn).toHaveCSS('background-color', 'rgb(16, 185, 129)');

    // Success state: should show checkmark icon, no text
    const successContent = await reloadBtn.innerHTML();
    expect(successContent).toContain('<svg');
    expect(successContent).not.toMatch(/Success/i);
    expect(successContent).not.toMatch(/Trigger/i);
  });

  test('should show tooltips on hover in different states', async ({ page }) => {
    // This test needs extra time for the 3 second reset timer
    test.setTimeout(12000);

    // Re-mock with delay to test loading state
    await mockWorkflowDispatch(page, { delay: 300 });
    await setGitHubPAT(page, 'test-token-12345');

    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const reloadBtn = staleCard.locator('.trigger-btn-icon');

    // Initial state: should have tooltip "Re-run scorecard workflow"
    await expect(reloadBtn).toHaveAttribute('title', 'Re-run scorecard workflow');

    // Click to trigger workflow
    await reloadBtn.click();

    // Loading state: should have tooltip "Triggering..."
    await expect(reloadBtn).toHaveAttribute('title', 'Triggering...');

    // Success state: should have tooltip "✓ Triggered Successfully"
    await expect(reloadBtn).toHaveAttribute('title', '✓ Triggered Successfully');

    // After reset: should restore original tooltip
    await expect(async () => {
      await expect(reloadBtn).toHaveAttribute('title', 'Re-run scorecard workflow');
    }).toPass({ timeout: 5000 });
  });

  test('should transition through correct icon states', async ({ page }) => {
    // This test needs extra time for the 3 second reset timer
    test.setTimeout(12000);

    await setGitHubPAT(page, 'test-token-12345');

    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const reloadBtn = staleCard.locator('.trigger-btn-icon');

    // Initial state: should have reload icon (path contains specific d attribute)
    let svgPath = await reloadBtn.locator('svg path').getAttribute('d');
    expect(svgPath).toContain('1.705'); // Part of reload icon path

    // Click the button
    await reloadBtn.click();

    // Wait for success state
    await expect(reloadBtn).toHaveCSS('background-color', 'rgb(16, 185, 129)');

    // Success state: should have checkmark icon
    svgPath = await reloadBtn.locator('svg path').getAttribute('d');
    expect(svgPath).toContain('13.78'); // Part of checkmark icon path
    expect(svgPath).not.toContain('1.705'); // No longer reload icon

    // After reset: should restore reload icon
    await expect(async () => {
      const path = await reloadBtn.locator('svg path').getAttribute('d');
      expect(path).toContain('1.705'); // Back to reload icon
    }).toPass({ timeout: 5000 });
  });

  test('should apply spinning animation during loading', async ({ page }) => {
    // This test needs extra time for the 3 second reset timer
    test.setTimeout(12000);

    // Re-mock with delay to test loading state
    await mockWorkflowDispatch(page, { delay: 300 });
    await setGitHubPAT(page, 'test-token-12345');

    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const reloadBtn = staleCard.locator('.trigger-btn-icon');
    const svg = reloadBtn.locator('svg');

    // Before click: no spinning class
    await expect(svg).not.toHaveClass(/spinning/);

    // Click the button
    await reloadBtn.click();

    // During loading: should have spinning class
    await expect(svg).toHaveClass(/spinning/);

    // Success state: no spinning class (different icon now)
    await expect(reloadBtn).toHaveCSS('background-color', 'rgb(16, 185, 129)');
    await expect(svg).not.toHaveClass(/spinning/);

    // Move mouse away to remove hover state
    await page.mouse.move(0, 0);

    // After reset: no spinning class (3s reset timer + CSS transitions)
    await expect(async () => {
      await expect(svg).not.toHaveClass(/spinning/);
      await expect(reloadBtn).toHaveCSS('background-color', 'rgb(245, 158, 11)');
    }).toPass({ timeout: 6000 });
  });

  test('should transition background colors correctly', async ({ page }) => {
    // This test needs extra time for the 3 second reset timer
    test.setTimeout(12000);

    await setGitHubPAT(page, 'test-token-12345');

    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const reloadBtn = staleCard.locator('.trigger-btn-icon');

    // Initial state: orange background
    await expect(reloadBtn).toHaveCSS('background', /rgb\(245, 158, 11\)/); // #F59E0B

    // Click the button
    await reloadBtn.click();

    // Loading state: disabled
    await expect(reloadBtn).toBeDisabled();

    // Success state: green background
    await expect(reloadBtn).toHaveCSS('background-color', 'rgb(16, 185, 129)'); // #10b981

    // Move mouse away to remove hover state
    await page.mouse.move(0, 0);

    // After reset: back to orange
    await expect(async () => {
      await expect(reloadBtn).toHaveCSS('background', /rgb\(245, 158, 11\)/);
      await expect(reloadBtn).not.toBeDisabled();
    }).toPass({ timeout: 5000 });
  });

  test('should show error state on API failure', async ({ page }) => {
    // This test needs extra time for the 3 second reset timer
    test.setTimeout(12000);

    // Re-mock API to return error, then re-navigate
    await mockWorkflowDispatch(page, { status: 500 });
    await page.goto('/');
    await waitForCatalogLoad(page);

    await setGitHubPAT(page, 'test-token-12345');

    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const reloadBtn = staleCard.locator('.trigger-btn-icon');

    // Click the button
    await reloadBtn.click();

    // Error state: red background
    await expect(reloadBtn).toHaveCSS('background-color', 'rgb(239, 68, 68)'); // #ef4444

    // Error state: should have X icon
    const svgPath = await reloadBtn.locator('svg path').getAttribute('d');
    expect(svgPath).toContain('3.72'); // Part of X icon path

    // Error state: should have error tooltip
    await expect(reloadBtn).toHaveAttribute('title', '✗ Trigger Failed');

    // Move mouse away to remove hover state
    await page.mouse.move(0, 0);

    // After reset: back to orange with reload icon
    await expect(async () => {
      await expect(reloadBtn).toHaveCSS('background-color', 'rgb(245, 158, 11)'); // #F59E0B
      await expect(reloadBtn).toHaveAttribute('title', 'Re-run scorecard workflow');
    }).toPass({ timeout: 5000 });
  });

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

  test('should reset button after 3 seconds in success state', async ({ page }) => {
    // This test needs extra time for the 3 second reset timer
    test.setTimeout(12000);

    await setGitHubPAT(page, 'test-token-12345');

    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const reloadBtn = staleCard.locator('.trigger-btn-icon');

    // Click the button
    await reloadBtn.click();

    // Verify success state
    await expect(reloadBtn).toHaveCSS('background-color', 'rgb(16, 185, 129)');

    // Move mouse away to remove hover state
    await page.mouse.move(0, 0);

    // Should be reset to original state
    await expect(async () => {
      await expect(reloadBtn).toHaveCSS('background', /rgb\(245, 158, 11\)/);
      await expect(reloadBtn).not.toBeDisabled();
      await expect(reloadBtn).toHaveAttribute('title', 'Re-run scorecard workflow');
      // Icon should be back to reload icon
      const svgPath = await reloadBtn.locator('svg path').getAttribute('d');
      expect(svgPath).toContain('1.705');
    }).toPass({ timeout: 5000 });
  });

  test('should be keyboard accessible', async ({ page }) => {
    await setGitHubPAT(page, 'test-token-12345');

    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const reloadBtn = staleCard.locator('.trigger-btn-icon');

    // Focus the button using keyboard
    await reloadBtn.focus();
    await expect(reloadBtn).toBeFocused();

    // Press Enter to trigger
    await page.keyboard.press('Enter');

    // Should transition to loading state
    await expect(reloadBtn).toBeDisabled();

    // Should show success state
    await expect(reloadBtn).toHaveCSS('background-color', 'rgb(16, 185, 129)');
  });
});
