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
  // Combines: never display text (only icons), apply spinning animation during loading
  test('should display only SVG icons (no text) and apply spinning animation during loading', async ({ page }) => {
    // This test needs extra time for the 3 second reset timer
    test.setTimeout(12000);

    // Re-mock with delay to test loading state
    await mockWorkflowDispatch(page, { delay: 300 });
    await setGitHubPAT(page, 'test-token-12345');

    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const reloadBtn = staleCard.locator('.trigger-btn-icon');
    const svg = reloadBtn.locator('svg');

    // Before click: icon only, no text, no spinning
    let content = await reloadBtn.innerHTML();
    expect(content).toContain('<svg');
    expect(content).not.toMatch(/Trigger/i);
    expect(content).not.toMatch(/Loading/i);
    await expect(svg).not.toHaveClass(/spinning/);

    // Click the button
    await reloadBtn.click();

    // During loading: still no text, spinning
    content = await reloadBtn.innerHTML();
    expect(content).toContain('<svg');
    expect(content).not.toMatch(/Trigger/i);
    await expect(svg).toHaveClass(/spinning/);

    // Wait for success state
    await expect(reloadBtn).toHaveCSS('background-color', 'rgb(16, 185, 129)');

    // Success state: icon only, no spinning
    content = await reloadBtn.innerHTML();
    expect(content).toContain('<svg');
    expect(content).not.toMatch(/Success/i);
    await expect(svg).not.toHaveClass(/spinning/);

    // Move mouse away to remove hover state
    await page.mouse.move(0, 0);

    // After reset: no spinning
    await expect(async () => {
      await expect(svg).not.toHaveClass(/spinning/);
      await expect(reloadBtn).toHaveCSS('background-color', 'rgb(245, 158, 11)');
    }).toPass({ timeout: 6000 });
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

  // Consolidated test: Task 8 - Reload Button State Transitions Complete Flow
  // Combines: transition through correct icon states, background colors, reset after 3 seconds
  test('should transition icons and colors through idle→loading→success→reset states', async ({ page }) => {
    // This test needs extra time for the 3 second reset timer
    test.setTimeout(12000);

    await setGitHubPAT(page, 'test-token-12345');

    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const reloadBtn = staleCard.locator('.trigger-btn-icon');

    // Initial state: reload icon, orange background
    await expect(reloadBtn).toBeVisible();
    let svgPath = await reloadBtn.locator('svg path').getAttribute('d');
    expect(svgPath).toContain('1.705'); // Part of reload icon path
    await expect(reloadBtn).toHaveCSS('background', /rgb\(245, 158, 11\)/); // #F59E0B orange

    // Click - should disable and start loading
    await reloadBtn.click();
    await expect(reloadBtn).toBeDisabled();

    // Success state - checkmark icon, green background
    await expect(reloadBtn).toHaveCSS('background-color', 'rgb(16, 185, 129)'); // #10b981 green
    svgPath = await reloadBtn.locator('svg path').getAttribute('d');
    expect(svgPath).toContain('13.78'); // Part of checkmark icon path
    expect(svgPath).not.toContain('1.705'); // No longer reload icon

    // Move mouse away to remove hover state
    await page.mouse.move(0, 0);

    // After 3s reset - back to reload icon, orange background, not disabled
    await expect(async () => {
      const path = await reloadBtn.locator('svg path').getAttribute('d');
      expect(path).toContain('1.705'); // Back to reload icon
      await expect(reloadBtn).toHaveCSS('background', /rgb\(245, 158, 11\)/); // Back to orange
      await expect(reloadBtn).not.toBeDisabled();
      await expect(reloadBtn).toHaveAttribute('title', 'Re-run scorecard workflow');
    }).toPass({ timeout: 5000 });
  });

  // Keep unchanged - error path with unique mock
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

  // Keep unchanged - accessibility-specific test
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
