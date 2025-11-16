/**
 * Test Helper Functions for Scorecards Catalog UI Tests
 */

import * as path from 'path';
import { fileURLToPath } from 'url';

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
}

/**
 * Close the service modal
 * @param {import('@playwright/test').Page} page
 */
export async function closeServiceModal(page) {
  await page.locator('#service-modal').getByRole('button', { name: '×' }).click();
  // Wait for modal to close
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
  await page.locator('#settings-modal').getByRole('button', { name: '×' }).click();
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
  // Wait for success notification
  await page.waitForSelector('.notification', { state: 'visible' });
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
  await page.getByRole('textbox', { name: 'Search services...' }).fill(query);
  // Wait a bit for debounce/filtering to happen
  await page.waitForTimeout(300);
}

/**
 * Clear search
 * @param {import('@playwright/test').Page} page
 */
export async function clearSearch(page) {
  await page.getByRole('textbox', { name: 'Search services...' }).clear();
  await page.waitForTimeout(300);
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
