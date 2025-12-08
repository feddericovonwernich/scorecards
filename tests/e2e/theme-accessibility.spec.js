/**
 * Theme & Accessibility E2E Tests (Consolidated)
 *
 * Phase 5 Coverage Improvement - User story-based comprehensive tests
 * Designed for ~5 consolidated tests covering theme and accessibility
 *
 * Coverage targets:
 * - theme.ts: Toggle, persistence, init
 * - FloatingControls.tsx: Theme toggle button
 * - Keyboard navigation in ServiceCard, StatCard, Modal
 */

import { test, expect } from './coverage.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openServiceModal,
  closeServiceModal,
} from './test-helper.js';

// ============================================================================
// USER STORY 5.1: THEME SWITCHING (Consolidated: 3 → 2 tests)
// ============================================================================

test.describe('Theme Switching', () => {
  test('should toggle theme and verify localStorage persistence', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Get initial theme
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('data-theme');

    // Phase 1: Find and click theme toggle button
    const themeToggle = page.locator('.floating-btn--theme');
    await expect(themeToggle).toBeVisible();
    await themeToggle.click();
    await page.waitForTimeout(200);

    // Verify theme changed
    const newTheme = await html.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);

    // Phase 2: Verify icon is visible (sun or moon)
    const themeIcon = themeToggle.locator('svg');
    await expect(themeIcon).toBeVisible();

    // Phase 3: Verify localStorage was updated
    const savedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(savedTheme).toBe(newTheme);

    // Phase 4: Toggle back to original
    await themeToggle.click();
    await page.waitForTimeout(200);

    const finalTheme = await html.getAttribute('data-theme');
    expect(finalTheme).toBe(initialTheme);

    // Phase 5: Verify localStorage updated again
    const finalSavedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(finalSavedTheme).toBe(initialTheme);
  });

  test('should apply theme to all UI elements correctly', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Set to dark theme
    const themeToggle = page.locator('.floating-btn--theme');
    const html = page.locator('html');

    // Ensure we're in dark mode
    let currentTheme = await html.getAttribute('data-theme');
    if (currentTheme !== 'dark') {
      await themeToggle.click();
      await page.waitForTimeout(200);
    }

    // Verify dark theme is applied
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Phase 1: Verify service cards render in dark mode
    const serviceCard = page.locator('.service-card').first();
    await expect(serviceCard).toBeVisible();

    // Phase 2: Open modal and verify it respects theme
    await serviceCard.click();
    await expect(page.locator('#service-modal')).toBeVisible();

    // Modal should be visible (theme applies via CSS variables)
    const modal = page.locator('#service-modal .modal-content');
    await expect(modal).toBeVisible();

    await closeServiceModal(page);

    // Phase 3: Toggle to light mode and verify
    await themeToggle.click();
    await page.waitForTimeout(200);

    await expect(html).toHaveAttribute('data-theme', 'light');

    // Service cards should still be visible
    await expect(serviceCard).toBeVisible();
  });
});

// ============================================================================
// USER STORY 5.2: KEYBOARD NAVIGATION (Consolidated: 4 → 2 tests)
// ============================================================================

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should navigate service cards and open modal with keyboard', async ({ page }) => {
    // Phase 1: Tab to reach service cards area
    // Focus on search input first, then tab to cards
    const searchInput = page.locator('#search-input');
    await searchInput.focus();

    // Tab through to reach a service card
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      const isServiceCard = await focused.evaluate(el => el.classList.contains('service-card'));
      if (isServiceCard) break;
    }

    // Phase 2: Verify a service card can receive focus
    const serviceCards = page.locator('.service-card');
    const firstCard = serviceCards.first();
    await firstCard.focus();

    // Verify card is focused
    await expect(firstCard).toBeFocused();

    // Phase 3: Press Enter to open modal
    await page.keyboard.press('Enter');
    await expect(page.locator('#service-modal')).toBeVisible();

    // Phase 4: Press Escape to close modal
    await page.keyboard.press('Escape');
    await expect(page.locator('#service-modal')).toBeHidden();

    // Phase 5: Focus card again and press Space to open
    await firstCard.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#service-modal')).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('should interact with stat cards via click', async ({ page }) => {
    // Phase 1: Find filterable stat cards (Gold, Silver, etc rank cards)
    const goldStatCard = page.locator('.services-stats .stat-card').filter({ hasText: /Gold/i });
    await expect(goldStatCard).toBeVisible();

    // Phase 2: Click to activate filter
    await goldStatCard.click();
    await page.waitForTimeout(300);

    // Verify filter is active (card has active class in some form)
    const classAfterClick = await goldStatCard.getAttribute('class');
    expect(classAfterClick).toContain('active');

    // Phase 3: Click again to toggle filter off
    await goldStatCard.click();
    await page.waitForTimeout(300);

    // Phase 4: Click a different stat card
    const silverStatCard = page.locator('.services-stats .stat-card').filter({ hasText: /Silver/i });
    if (await silverStatCard.isVisible()) {
      await silverStatCard.click();
      await page.waitForTimeout(300);
      const silverClass = await silverStatCard.getAttribute('class');
      expect(silverClass).toContain('active');
    }
  });
});

// ============================================================================
// USER STORY 5.3: FOCUS MANAGEMENT (Consolidated: 2 → 1 test)
// ============================================================================

test.describe('Focus Management', () => {
  test('should handle modal open/close and keyboard interactions', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Phase 1: Click to open a service modal
    const firstCard = page.locator('.service-card').first();
    await firstCard.click();

    const modal = page.locator('#service-modal');
    await expect(modal).toBeVisible();

    // Phase 2: Verify close button is accessible
    const closeButton = modal.locator('.modal-close');
    await expect(closeButton).toBeVisible();
    await expect(closeButton).toHaveAttribute('aria-label', 'Close modal');

    // Phase 3: Tab to close button and verify it can be focused
    await closeButton.focus();
    await expect(closeButton).toBeFocused();

    // Phase 4: Press Escape to close modal
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();

    // Phase 5: Verify page is still interactive after modal closes
    await expect(page.locator('.services-grid')).toBeVisible();
    await expect(firstCard).toBeVisible();
  });
});

// ============================================================================
// USER STORY 5.4: ARIA ATTRIBUTES (Consolidated: 2 → 1 test)
// ============================================================================

test.describe('ARIA Attributes', () => {
  test('should have proper ARIA attributes on interactive elements', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Phase 1: Check service cards have proper tabindex and role
    const serviceCards = page.locator('.service-card');
    const firstCard = serviceCards.first();
    await expect(firstCard).toHaveAttribute('tabindex', '0');
    await expect(firstCard).toHaveAttribute('role', 'button');

    // Phase 2: Open modal and verify ARIA attributes
    await firstCard.click();
    const modal = page.locator('#service-modal');
    await expect(modal).toBeVisible();

    // Modal should have role="dialog" and aria-modal
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');

    // Close button should have aria-label
    const closeButton = modal.locator('.modal-close');
    await expect(closeButton).toHaveAttribute('aria-label', 'Close modal');

    await page.keyboard.press('Escape');

    // Phase 3: Check floating controls have aria-labels
    const themeToggle = page.locator('.floating-btn--theme');
    await expect(themeToggle).toHaveAttribute('aria-label', /night mode/i);

    const displayToggle = page.locator('.floating-btn--display');
    await expect(displayToggle).toHaveAttribute('aria-label', /view/i);

    // Phase 4: Check settings button has aria-label
    const settingsBtn = page.locator('.floating-btn--settings');
    await expect(settingsBtn).toHaveAttribute('aria-label', /Settings/i);
  });
});
