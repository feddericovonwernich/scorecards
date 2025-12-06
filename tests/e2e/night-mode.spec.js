import { test, expect } from '@playwright/test';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
} from './test-helper.js';

test.describe('Night Mode Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');

    // Clear localStorage after page load, not as an init script
    // This ensures it only clears once per test, not on every reload
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload to apply the clean state
    await page.reload();
    await waitForCatalogLoad(page);
  });

  test('should have theme toggle button in header', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });
    await expect(themeToggle).toBeVisible();
  });

  test('should default to light theme on first visit', async ({ page }) => {
    const htmlElement = page.locator('html');
    const theme = await htmlElement.getAttribute('data-theme');

    // Should either be null (default) or 'light'
    expect(theme === null || theme === 'light').toBeTruthy();
  });

  test('should show sun icon in light mode', async ({ page }) => {
    // React component doesn't use IDs for icons - check SVG path content instead
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });
    const svg = themeToggle.locator('svg');

    // In light mode, the sun icon is shown (has specific path pattern)
    await expect(svg).toBeVisible();
    const pathD = await svg.locator('path').getAttribute('d');
    // Sun icon path contains specific pattern
    expect(pathD).toContain('8 12'); // Sun icon starts with circle pattern
  });

  test('should toggle to dark theme when button clicked', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });

    // Click to enable dark mode
    await themeToggle.click();

    // Wait for theme to apply
    await page.waitForTimeout(100);

    const htmlElement = page.locator('html');
    const theme = await htmlElement.getAttribute('data-theme');

    expect(theme).toBe('dark');
  });

  test('should show moon icon in dark mode', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });
    await themeToggle.click();
    await page.waitForTimeout(100);

    // React component shows moon icon when dark mode is active
    const svg = themeToggle.locator('svg');
    await expect(svg).toBeVisible();
    const pathD = await svg.locator('path').getAttribute('d');
    // Moon icon path contains specific pattern
    expect(pathD).toContain('9.598'); // Moon icon starts with this pattern
  });

  test('should toggle back to light theme on second click', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });

    // Toggle to dark
    await themeToggle.click();
    await page.waitForTimeout(100);

    // Toggle back to light
    await themeToggle.click();
    await page.waitForTimeout(100);

    const htmlElement = page.locator('html');
    const theme = await htmlElement.getAttribute('data-theme');

    expect(theme).toBe('light');
  });

  test('should persist theme preference in localStorage', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });

    // Toggle to dark mode
    await themeToggle.click();
    await page.waitForTimeout(100);

    // Check localStorage
    const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(storedTheme).toBe('dark');
  });

  test('should restore theme preference after page reload', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });

    // Set dark mode
    await themeToggle.click();
    await page.waitForTimeout(100);

    // Reload page
    await page.reload();
    await waitForCatalogLoad(page);

    // Theme should still be dark
    const htmlElement = page.locator('html');
    const theme = await htmlElement.getAttribute('data-theme');
    expect(theme).toBe('dark');

    // Moon icon should be visible (check via SVG path)
    const reloadedToggle = page.getByRole('button', { name: /Toggle night mode/i });
    const svg = reloadedToggle.locator('svg');
    await expect(svg).toBeVisible();
    const pathD = await svg.locator('path').getAttribute('d');
    expect(pathD).toContain('9.598'); // Moon icon pattern
  });

  test('should apply dark theme styles to body', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });

    // Get initial background color (light mode)
    const initialBgColor = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Toggle to dark mode
    await themeToggle.click();
    await page.waitForTimeout(500); // Wait for CSS transition

    // Get dark mode background color
    const darkBgColor = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Colors should be different
    expect(initialBgColor).not.toBe(darkBgColor);
  });

  test('should apply dark theme to service cards', async ({ page }) => {
    // Wait for service cards to load
    await page.waitForSelector('.service-card', { timeout: 5000 });

    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });

    // Get initial service card background (light mode)
    const initialCardBg = await page.locator('.service-card').first().evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Toggle to dark mode
    await themeToggle.click();
    await page.waitForTimeout(500); // Wait for CSS transition

    // Get dark mode service card background
    const darkCardBg = await page.locator('.service-card').first().evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Backgrounds should be different
    expect(initialCardBg).not.toBe(darkCardBg);
  });

  test('should work on both catalog and API explorer pages', async ({ page }) => {
    // Set dark mode on catalog page
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });
    await themeToggle.click();
    await page.waitForTimeout(100);

    // Navigate to API explorer (with mock params)
    // Use relative path so it respects the baseURL (/scorecards/)
    await page.goto('api-explorer.html?org=test&repo=test');
    await page.waitForTimeout(500);

    // Theme should be dark on API explorer
    const htmlElement = page.locator('html');
    const theme = await htmlElement.getAttribute('data-theme');
    expect(theme).toBe('dark');

    // Theme toggle button should exist
    const apiExplorerToggle = page.getByRole('button', { name: /Toggle night mode/i });
    await expect(apiExplorerToggle).toBeVisible();
  });

  test('should have smooth CSS transitions', async ({ page }) => {
    // Check that body has transition CSS property
    const bodyTransition = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).transition;
    });

    // Should have transition property defined (not 'all 0s' which is the default)
    expect(bodyTransition).toContain('0.3s');
  });

  test('should not lose theme when navigating between pages', async ({ page }) => {
    // Set dark mode
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });
    await themeToggle.click();
    await page.waitForTimeout(100);

    // Go to API explorer (relative path respects baseURL)
    await page.goto('api-explorer.html?org=test&repo=test');
    await page.waitForTimeout(300);

    // Verify dark theme
    let htmlElement = page.locator('html');
    let theme = await htmlElement.getAttribute('data-theme');
    expect(theme).toBe('dark');

    // Go back to catalog
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Verify theme is still dark
    htmlElement = page.locator('html');
    theme = await htmlElement.getAttribute('data-theme');
    expect(theme).toBe('dark');
  });

  test('should apply theme without flash on page load', async ({ page }) => {
    // Set dark mode
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });
    await themeToggle.click();
    await page.waitForTimeout(100);

    // Reload and check theme is applied immediately
    await page.reload();

    // Check theme attribute is set (should happen before DOMContentLoaded)
    const htmlElement = page.locator('html');
    const theme = await htmlElement.getAttribute('data-theme');
    expect(theme).toBe('dark');
  });

  test('should update icon immediately after theme change', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });
    const svg = themeToggle.locator('svg');

    // Initially sun visible (check SVG path pattern)
    let pathD = await svg.locator('path').getAttribute('d');
    expect(pathD).toContain('8 12'); // Sun icon pattern

    // Click toggle
    await themeToggle.click();

    // Icon should update immediately to moon
    pathD = await svg.locator('path').getAttribute('d');
    expect(pathD).toContain('9.598'); // Moon icon pattern

    // Click again
    await themeToggle.click();

    // Icon should switch back to sun
    pathD = await svg.locator('path').getAttribute('d');
    expect(pathD).toContain('8 12'); // Sun icon pattern
  });
});
