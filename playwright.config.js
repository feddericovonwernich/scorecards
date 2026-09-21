import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Scorecards Catalog UI Tests
 *
 * Tests run against the production artifact on a static server without SPA fallback.
 * API requests are mocked via page.route() to serve test fixtures.
 *
 * Coverage:
 * Run with COVERAGE=true to collect code coverage:
 *   COVERAGE=true npm run test:e2e:coverage
 */

const TEST_PORT = process.env.TEST_PORT || 4173;
const COVERAGE = process.env.COVERAGE === 'true';

export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run for (reduced from 30s for faster failure detection)
  timeout: 15 * 1000,

  // Global timeout for the entire test run (20 minutes)
  globalTimeout: 20 * 60 * 1000,

  // Test configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [['html', { open: 'never' }], ['list'], ...(process.env.CI ? [['github']] : [])],

  // Shared settings for all projects
  use: {
    baseURL: `http://localhost:${TEST_PORT}/scorecards/`,

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

  // Build and serve the production build before starting the tests
  // A temporary /scorecards alias mirrors the publication prefix. Root URLs remain
  // available for existing fixtures; missing files receive real 404 responses.
  webServer: {
    // When COVERAGE is enabled, pass COVERAGE env to build for instrumentation
    command:
      `${COVERAGE ? 'COVERAGE=true ' : ''}npm run build && ` +
      'stage=$(mktemp -d) && trap \'rm -rf "$stage"\' EXIT && ' +
      'cp -a docs/dist/. "$stage/" && ln -s . "$stage/scorecards" && ' +
      `python3 -m http.server ${TEST_PORT} --directory "$stage"`,
    port: TEST_PORT,
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },

  // Global setup/teardown for coverage collection
  ...(COVERAGE
    ? {
        globalSetup: './tests/e2e/coverage-setup.js',
        globalTeardown: './tests/e2e/coverage-teardown.js',
      }
    : {}),
});
