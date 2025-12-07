import { test, expect } from './coverage.js';
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

  test('should have theme toggle button and default to light theme', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });
    await expect(themeToggle).toBeVisible();

    const htmlElement = page.locator('html');
    const theme = await htmlElement.getAttribute('data-theme');
    expect(theme === null || theme === 'light').toBeTruthy();

    // Sun icon visible in light mode
    const svg = themeToggle.locator('svg');
    await expect(svg).toBeVisible();
    const pathD = await svg.locator('path').getAttribute('d');
    expect(pathD).toContain('8 12');
  });

  test('should handle complete toggle flow with icon updates and persistence', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });
    const htmlElement = page.locator('html');
    const svg = themeToggle.locator('svg');

    // Toggle to dark mode
    await themeToggle.click();
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
    let pathD = await svg.locator('path').getAttribute('d');
    expect(pathD).toContain('9.598'); // Moon icon

    // Verify localStorage persistence
    let storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(storedTheme).toBe('dark');

    // Toggle back to light mode
    await themeToggle.click();
    await expect(htmlElement).toHaveAttribute('data-theme', 'light');
    pathD = await svg.locator('path').getAttribute('d');
    expect(pathD).toContain('8 12'); // Sun icon

    storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(storedTheme).toBe('light');
  });

  test('should restore theme after page reload', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });

    await themeToggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await waitForCatalogLoad(page);

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const svg = page.getByRole('button', { name: /Toggle night mode/i }).locator('svg');
    const pathD = await svg.locator('path').getAttribute('d');
    expect(pathD).toContain('9.598');
  });

  test('should apply dark theme CSS styles correctly', async ({ page }) => {
    await expect(page.locator('.service-card').first()).toBeVisible();
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });

    // Get initial colors
    const initialBgColor = await page.locator('body').evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const initialCardBg = await page.locator('.service-card').first().evaluate((el) => window.getComputedStyle(el).backgroundColor);

    await themeToggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Verify body color changed
    await expect(async () => {
      const darkBgColor = await page.locator('body').evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(darkBgColor).not.toBe(initialBgColor);
    }).toPass({ timeout: 1000 });

    // Verify service card color changed
    await expect(async () => {
      const darkCardBg = await page.locator('.service-card').first().evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(darkCardBg).not.toBe(initialCardBg);
    }).toPass({ timeout: 1000 });

    // Verify smooth transitions
    const bodyTransition = await page.locator('body').evaluate((el) => window.getComputedStyle(el).transition);
    expect(bodyTransition).toContain('0.3s');
  });

  test('should persist theme across page navigations', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });
    await themeToggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Navigate to API explorer
    await page.goto('api-explorer.html?org=test&repo=test');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: /Toggle night mode/i })).toBeVisible();

    // Navigate back to catalog
    await page.goto('/');
    await waitForCatalogLoad(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
