import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Scorecards Catalog UI Tests
 *
 * Tests run against either:
 * - Local server (default): http://localhost:8080/docs/
 * - GitHub Pages (CI): https://feddericovonwernich.github.io/scorecards/
 */

export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Test configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github']] : []),
  ],

  // Shared settings for all projects
  use: {
    baseURL: process.env.CI
      ? 'https://feddericovonwernich.github.io/scorecards/'
      : 'http://localhost:8080/',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run local dev server before starting the tests (only when not in CI)
  // Note: Tests use request mocking via page.route() to serve test fixtures
  // from tests/e2e/fixtures/ instead of fetching from GitHub
  webServer: process.env.CI ? undefined : {
    command: 'python3 -m http.server 8080 --directory docs',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
