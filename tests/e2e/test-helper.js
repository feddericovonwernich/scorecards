/**
 * Test Helper Functions for Scorecards Catalog UI Tests
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import { expect } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Mock GitHub raw.githubusercontent.com requests to serve local test fixtures
 * @param {import('@playwright/test').Page} page
 */
export async function mockCatalogRequests(page) {
  // Override window.location.hostname to simulate GitHub Pages environment
  // This prevents the app from using 'localhost' as REPO_OWNER
  await page.addInitScript(() => {
    Object.defineProperty(window.location, 'hostname', {
      writable: true,
      value: 'feddericovonwernich.github.io'
    });
  });

  await page.route('**/raw.githubusercontent.com/**', async (route) => {
    const url = new URL(route.request().url());
    console.log('Mock intercepted:', url.toString());
    console.log('URL pathname:', url.pathname);

    // Extract path after /owner/repo/catalog/
    // URL format: https://raw.githubusercontent.com/owner/repo/branch/path
    // pathname: /owner/repo/branch/path
    const pathMatch = url.pathname.match(/\/[^/]+\/[^/]+\/catalog\/(.+)/);

    if (pathMatch) {
      let relativePath = pathMatch[1];

      // The catalog branch stores files in docs/ directory, but the app
      // requests them without the docs/ prefix. Add it here for fixture lookup.
      if (!relativePath.startsWith('docs/')) {
        relativePath = 'docs/' + relativePath;
      }

      const fixturePath = path.join(__dirname, 'fixtures', relativePath);
      console.log('Serving fixture:', fixturePath);

      try {
        await route.fulfill({
          status: 200,
          path: fixturePath,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Fixture served successfully');
      } catch (error) {
        // If fixture file doesn't exist, return 404
        console.log('Fixture not found:', error.message);
        await route.fulfill({
          status: 404,
          body: JSON.stringify({ error: 'Test fixture not found' }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    } else {
      // Let other requests pass through
      console.log('No match for pattern, continuing request');
      await route.continue();
    }
  });

  // Mock GitHub API rate_limit endpoint
  await page.route('**/api.github.com/rate_limit', async (route) => {
    const headers = route.request().headers();
    const hasAuth = headers['authorization'] && headers['authorization'].startsWith('token ');

    console.log('Mock intercepted: api.github.com/rate_limit', hasAuth ? '(authenticated)' : '(unauthenticated)');

    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        rate: {
          limit: hasAuth ? 5000 : 60,
          remaining: hasAuth ? 4999 : 59,
          reset: Math.floor(Date.now() / 1000) + 3600,
          used: hasAuth ? 1 : 1
        }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  // Mock GitHub API user endpoint (for PAT validation)
  await page.route('**/api.github.com/user', async (route) => {
    const headers = route.request().headers();
    const hasAuth = headers['authorization'] && headers['authorization'].startsWith('token ');

    console.log('Mock intercepted: api.github.com/user', hasAuth ? '(authenticated)' : '(unauthenticated)');

    if (hasAuth) {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          login: 'testuser',
          id: 12345,
          name: 'Test User'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({
          message: 'Requires authentication'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  });

  // CRITICAL FIX: Wait to ensure route handler is fully registered
  // This prevents race condition where page.goto() happens before route is active
  // Small delay (100ms) is sufficient for Playwright to complete route setup
  await page.waitForTimeout(100);
}

/**
 * Wait for the catalog data to load
 * @param {import('@playwright/test').Page} page
 */
export async function waitForCatalogLoad(page) {
  // Wait for services to be displayed (no longer showing "Loading services...")
  await page.waitForSelector('.services-grid', { state: 'visible', timeout: 10000 });
  // Wait for at least one service card to appear
  await page.waitForSelector('.service-card', { state: 'visible', timeout: 10000 });
}

/**
 * Get all service cards on the page
 * @param {import('@playwright/test').Page} page
 */
export async function getServiceCards(page) {
  return await page.locator('.service-card').all();
}

/**
 * Get the count of visible service cards
 * @param {import('@playwright/test').Page} page
 */
export async function getServiceCount(page) {
  return await page.locator('.service-card').count();
}

/**
 * Open a service modal by name
 * @param {import('@playwright/test').Page} page
 * @param {string} serviceName
 */
export async function openServiceModal(page, serviceName) {
  await page.getByText(serviceName, { exact: false }).first().click();
  // Wait for modal to open
  await page.waitForSelector('#service-modal', { state: 'visible' });
  // Wait for check results to load (they load asynchronously after modal opens)
  await page.waitForSelector('#service-modal .check-result', { state: 'visible', timeout: 5000 });
}

/**
 * Close the service modal
 * @param {import('@playwright/test').Page} page
 */
export async function closeServiceModal(page) {
  await page.locator('#service-modal').getByRole('button', { name: 'Close modal' }).click();
  // Wait for modal to close - React removes modal from DOM when closed
  await page.waitForSelector('#service-modal', { state: 'hidden' });
}

/**
 * Open the settings modal
 * @param {import('@playwright/test').Page} page
 */
export async function openSettingsModal(page) {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.waitForSelector('#settings-modal', { state: 'visible' });
}

/**
 * Close the settings modal
 * @param {import('@playwright/test').Page} page
 */
export async function closeSettingsModal(page) {
  await page.locator('#settings-modal').getByRole('button', { name: 'Close modal' }).click();
  await page.waitForSelector('#settings-modal', { state: 'hidden' });
}

/**
 * Set GitHub PAT in settings
 * @param {import('@playwright/test').Page} page
 * @param {string} pat
 */
export async function setGitHubPAT(page, pat) {
  await openSettingsModal(page);
  await page.getByRole('textbox', { name: 'Personal Access Token' }).fill(pat);
  await page.getByRole('button', { name: 'Save Token' }).click();
  // Wait for success toast
  await page.waitForSelector('.toast', { state: 'visible' });
  await closeSettingsModal(page);
}

/**
 * Clear GitHub PAT from settings
 * @param {import('@playwright/test').Page} page
 */
export async function clearGitHubPAT(page) {
  await openSettingsModal(page);
  await page.getByRole('button', { name: 'Clear Token' }).click();
  await closeSettingsModal(page);
}

/**
 * Get dashboard stat value by label
 * @param {import('@playwright/test').Page} page
 * @param {string} label - e.g., "Total Services", "Average Score", etc.
 */
export async function getStatValue(page, label) {
  // StatCard component now uses .stat-card class with .stat-value for the value
  const statCard = page.locator('.stat-card').filter({ hasText: label });
  const value = await statCard.locator('.stat-value').textContent();
  return value.trim();
}

/**
 * Apply a filter by clicking a stat card
 * @param {import('@playwright/test').Page} page
 * @param {string} label - e.g., "Gold", "Silver", "Bronze", etc.
 */
export async function applyStatFilter(page, label) {
  await page.getByText(label).click();
}

/**
 * Search for services
 * @param {import('@playwright/test').Page} page
 * @param {string} query
 */
export async function searchServices(page, query) {
  const searchInput = page.getByRole('textbox', { name: 'Search services...' });
  await searchInput.fill(query);
  // Wait for filter to be applied by checking that the input value is set
  // and the services grid is still visible (filter complete)
  await expect(searchInput).toHaveValue(query);
  await expect(page.locator('.services-grid')).toBeVisible();
  // Wait for debounce (React controls have 300ms debounce on search)
  await page.waitForTimeout(350);
}

/**
 * Clear search
 * @param {import('@playwright/test').Page} page
 */
export async function clearSearch(page) {
  const searchInput = page.getByRole('textbox', { name: 'Search services...' });
  await searchInput.clear();
  // Wait for filter to be cleared and services grid to be visible
  await expect(searchInput).toHaveValue('');
  await expect(page.locator('.services-grid')).toBeVisible();
  // Wait for debounce (React controls have 300ms debounce on search)
  await page.waitForTimeout(350);
}

/**
 * Select a sort option
 * @param {import('@playwright/test').Page} page
 * @param {string} option - e.g., "Score: High to Low"
 */
export async function selectSort(page, option) {
  await page.locator('#sort-select').selectOption(option);
}

/**
 * Switch to Teams view
 * @param {import('@playwright/test').Page} page
 */
export async function switchToTeamsView(page) {
  // React Navigation component uses button[data-view="teams"] without .view-tab class
  await page.locator('[data-view="teams"]').click();
  // Wait for teams grid to be visible
  await expect(page.locator('.teams-grid')).toBeVisible();
  // Wait for team cards to load (teams data loads asynchronously)
  await page.waitForSelector('.team-card', { state: 'visible', timeout: 10000 });
}

/**
 * Search for teams
 * @param {import('@playwright/test').Page} page
 * @param {string} query
 */
export async function searchTeams(page, query) {
  const searchInput = page.getByRole('textbox', { name: /search teams/i });
  await searchInput.fill(query);
  // Wait for filter to be applied by checking that the input value is set
  await expect(searchInput).toHaveValue(query);
  // Wait for debounce (React controls have 300ms debounce on search)
  await page.waitForTimeout(350);
}

/**
 * Clear teams search
 * @param {import('@playwright/test').Page} page
 */
export async function clearTeamsSearch(page) {
  const searchInput = page.getByRole('textbox', { name: /search teams/i });
  await searchInput.clear();
  // Wait for filter to be cleared
  await expect(searchInput).toHaveValue('');
  // Wait for debounce (React controls have 300ms debounce on search)
  await page.waitForTimeout(350);
}

/**
 * Switch to Services view
 * @param {import('@playwright/test').Page} page
 */
export async function switchToServicesView(page) {
  await page.locator('[data-view="services"]').click();
  // Wait for services grid to be visible
  await expect(page.locator('.services-grid')).toBeVisible();
}

/**
 * Open the Check Adoption Dashboard modal
 * @param {import('@playwright/test').Page} page
 */
export async function openCheckAdoptionDashboard(page) {
  // First switch to teams view
  await switchToTeamsView(page);

  // Click the Check Adoption button
  const adoptionButton = page.getByRole('button', { name: 'Check Adoption' });
  await adoptionButton.click();

  // Wait for modal to open - React uses testId="check-adoption-modal"
  await page.waitForSelector('#check-adoption-modal', { state: 'visible', timeout: 5000 });
}

/**
 * Close the Check Adoption Dashboard modal
 * @param {import('@playwright/test').Page} page
 */
export async function closeCheckAdoptionModal(page) {
  await page.locator('#check-adoption-modal').getByRole('button', { name: 'Close modal' }).click();
  await page.waitForSelector('#check-adoption-modal', { state: 'hidden' });
}

/**
 * Open Team Modal by team name
 * @param {import('@playwright/test').Page} page
 * @param {string} teamName
 */
export async function openTeamModal(page, teamName) {
  // Switch to teams view first
  await switchToTeamsView(page);

  // Click on the team card
  await page.locator('.team-card').filter({ hasText: teamName }).click();

  // Wait for modal
  await page.waitForSelector('#team-modal', { state: 'visible', timeout: 5000 });
}

/**
 * Close Team Modal
 * @param {import('@playwright/test').Page} page
 */
export async function closeTeamModal(page) {
  await page.locator('#team-modal').getByRole('button', { name: 'Close modal' }).click();
  await page.waitForSelector('#team-modal', { state: 'hidden' });
}

/**
 * Open Check Filter Modal
 * @param {import('@playwright/test').Page} page
 */
export async function openCheckFilterModal(page) {
  // Click on Check Filter button
  const filterButton = page.getByRole('button', { name: /Check Filter/i });
  await filterButton.click();
  await page.waitForSelector('#check-filter-modal', { state: 'visible', timeout: 5000 });
}

/**
 * Close Check Filter Modal
 * @param {import('@playwright/test').Page} page
 */
export async function closeCheckFilterModal(page) {
  await page.locator('#check-filter-modal').getByRole('button', { name: 'Close modal' }).click();
  await page.waitForSelector('#check-filter-modal', { state: 'hidden' });
}

/**
 * Get the text content of all visible service names
 * @param {import('@playwright/test').Page} page
 */
export async function getVisibleServiceNames(page) {
  const cards = await getServiceCards(page);
  const names = [];
  for (const card of cards) {
    const name = await card.locator('.service-name').textContent();
    names.push(name.trim());
  }
  return names;
}

/**
 * Mock GitHub workflow dispatch API endpoint
 * @param {import('@playwright/test').Page} page
 * @param {Object} options - Mock options
 * @param {number} options.status - HTTP status code (default: 204 for success)
 * @param {boolean} options.requireAuth - Whether to require authorization header (default: true)
 * @param {number} options.delay - Delay in ms before responding (default: 0, useful for testing loading states)
 */
export async function mockWorkflowDispatch(page, { status = 204, requireAuth = true, delay = 0 } = {}) {
  const pattern = '**/api.github.com/repos/**/actions/workflows/*/dispatches';
  console.log('Setting up workflow dispatch mock with pattern:', pattern, delay > 0 ? `(${delay}ms delay)` : '');

  await page.route(pattern, async (route) => {
    const headers = route.request().headers();
    const hasAuth = headers['authorization'] && (headers['authorization'].startsWith('Bearer ') || headers['authorization'].startsWith('token '));
    const url = route.request().url();

    console.log('Mock intercepted: workflow dispatch', url, hasAuth ? '(authenticated)' : '(unauthenticated)');

    // If auth is required but not provided, return 401
    if (requireAuth && !hasAuth) {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({
          message: 'Requires authentication'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return;
    }

    // Apply delay if specified (useful for testing loading states)
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Return the configured status
    await route.fulfill({
      status: status,
      body: status === 204 ? '' : JSON.stringify({ message: 'Workflow dispatch failed' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  // CRITICAL: Wait to ensure route handler is fully registered
  await page.waitForTimeout(100);
}

/**
 * Click a Service Modal tab by name
 * @param {import('@playwright/test').Page} page
 * @param {string} tabName - 'Check Results', 'API Specification', 'Links', 'Contributors', 'Workflow Runs', 'Badges'
 */
export async function clickServiceModalTab(page, tabName) {
  const modal = page.locator('#service-modal');
  const tab = modal.getByRole('button', { name: tabName });
  await tab.click();
  // Wait for tab content to be visible (use .active to avoid matching nested tab-content)
  await expect(modal.locator('.tab-content.active')).toBeVisible();
}

/**
 * Click a Team Modal tab by name
 * @param {import('@playwright/test').Page} page
 * @param {string} tabName - 'Services', 'Distribution', 'Check Adoption', 'GitHub'
 */
export async function clickTeamModalTab(page, tabName) {
  const modal = page.locator('#team-modal');
  const tab = modal.getByRole('button', { name: tabName, exact: true });
  await tab.click();
  // Wait for tab content to be visible (use .active to avoid matching nested tab-content)
  await expect(modal.locator('.tab-content.active')).toBeVisible();
}

/**
 * Mock GitHub team members API
 * @param {import('@playwright/test').Page} page
 * @param {Array} members - Array of member objects with login, avatar_url, html_url
 */
export async function mockTeamMembersAPI(page, members = []) {
  await page.route('**/api.github.com/orgs/**/teams/**/members', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(members),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/**
 * Mock GitHub API with error response
 * @param {import('@playwright/test').Page} page
 * @param {string} endpoint - Endpoint pattern to match
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
export async function mockAPIError(page, endpoint, statusCode, message) {
  await page.route(`**/${endpoint}`, async (route) => {
    await route.fulfill({
      status: statusCode,
      body: JSON.stringify({ message }),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/**
 * Mock empty catalog response
 * @param {import('@playwright/test').Page} page
 */
export async function mockEmptyCatalog(page) {
  await page.route('**/raw.githubusercontent.com/**/registry/**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ services: {} }),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/**
 * Wait for toast notification to appear
 * @param {import('@playwright/test').Page} page
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info', or 'any'
 */
export async function waitForToast(page, type = 'any') {
  if (type === 'any') {
    await page.waitForSelector('.toast', { state: 'visible', timeout: 5000 });
  } else {
    await page.waitForSelector(`.toast-react--${type}, .toast.${type}`, { state: 'visible', timeout: 5000 });
  }
}

/**
 * Dismiss visible toast notification
 * @param {import('@playwright/test').Page} page
 */
export async function dismissToast(page) {
  const toast = page.locator('.toast');
  const closeButton = toast.locator('button, [class*="close"]');
  if (await closeButton.isVisible()) {
    await closeButton.click();
    // Wait for toast to be hidden
    await expect(toast).toBeHidden();
  }
}

/**
 * Mock workflow runs API
 * @param {import('@playwright/test').Page} page
 * @param {Object} options - Mock options
 * @param {Array} options.runs - Array of workflow run objects
 */
export async function mockWorkflowRuns(page, { runs = { workflow_runs: [], total_count: 0 } } = {}) {
  await page.route('**/api.github.com/repos/**/actions/runs*', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(runs),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}
