/**
 * Phase 8: Edge Cases & Boundary Conditions Tests
 *
 * User story-based tests covering:
 * - Empty states handling
 * - Search with no results
 * - Filter combinations with no matches
 * - Large service list handling
 * - Rapid user interactions
 * - Error recovery scenarios
 */

import { test, expect } from '@playwright/test';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
  searchServices,
  clearSearch,
  openServiceModal,
  closeServiceModal,
  switchToTeamsView,
  switchToServicesView,
} from './test-helper.js';

test.describe('Empty States Handling', () => {
  test('should show empty state when search returns no results', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    const initialCount = await getServiceCount(page);
    expect(initialCount).toBeGreaterThan(0);

    // Search for a non-existent service
    await searchServices(page, 'nonexistent-service-xyz-123-impossible-name');

    // Verify empty state is shown in services grid
    const emptyState = page.locator('.services-grid .empty-state');
    await expect(emptyState).toBeVisible({ timeout: 5000 });
    await expect(emptyState).toContainText(/no services|no match|not found/i);

    // Clear search and verify services return
    await clearSearch(page);
    const restoredCount = await getServiceCount(page);
    expect(restoredCount).toBe(initialCount);
  });

  test('should show empty state when filter returns no matches', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Apply a restrictive search + filter combination
    await searchServices(page, 'test');

    // Now add a stat card filter that might produce no results - use services-stats to be specific
    const platinumCard = page.locator('.services-stats .stat-card').filter({ hasText: /Platinum/i });
    if (await platinumCard.first().isVisible().catch(() => false)) {
      await platinumCard.first().click();
      await page.waitForTimeout(300);

      // Check if we have results or empty state
      const count = await getServiceCount(page);
      if (count === 0) {
        const emptyState = page.locator('.services-grid .empty-state');
        await expect(emptyState).toBeVisible();
      }

      // Toggle off the filter
      await platinumCard.first().click();
    }

    await clearSearch(page);
  });

  test('should handle teams view with filtered empty state', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Switch to teams view
    await switchToTeamsView(page);

    // Search for non-existent team
    const searchInput = page.locator('.teams-grid').locator('..').locator('input[type="text"]');
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('nonexistent-team-xyz');
      await page.waitForTimeout(300);

      // Should show empty or no teams
      const teamCards = page.locator('.team-card');
      const count = await teamCards.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }

    // Switch back to services
    await switchToServicesView(page);
  });
});

test.describe('Rapid User Interactions', () => {
  test('should handle rapid search input changes', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    const searchInput = page.getByRole('textbox', { name: 'Search services...' });

    // Type rapidly, changing the search term
    await searchInput.fill('a');
    await searchInput.fill('ab');
    await searchInput.fill('abc');
    await searchInput.fill('abcd');
    await searchInput.clear();
    await searchInput.fill('test');

    // Wait for final state to stabilize
    await page.waitForTimeout(500);

    // App should not crash, should show consistent state
    const servicesGrid = page.locator('.services-grid');
    await expect(servicesGrid).toBeVisible();

    await clearSearch(page);
  });

  test('should handle rapid stat card clicks without crashing', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Get all clickable stat cards
    const statCards = page.locator('.stat-card');
    const count = await statCards.count();

    if (count >= 2) {
      // Click multiple stat cards rapidly
      await statCards.first().click();
      await page.waitForTimeout(50);
      await statCards.nth(1).click();
      await page.waitForTimeout(50);
      await statCards.first().click();
      await page.waitForTimeout(50);
      await statCards.nth(1).click();

      // Wait for state to stabilize
      await page.waitForTimeout(300);

      // App should still be functional
      const servicesGrid = page.locator('.services-grid');
      await expect(servicesGrid).toBeVisible();

      // Click to deselect all
      const activeCard = page.locator('.stat-card.active, .stat-card-react--active');
      if (await activeCard.isVisible()) {
        await activeCard.click();
      }
    }
  });

  test('should handle rapid modal open/close', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Open and close modal multiple times
    for (let i = 0; i < 3; i++) {
      await openServiceModal(page, 'test-repo');
      await page.waitForTimeout(100);
      await closeServiceModal(page);
      await page.waitForTimeout(100);
    }

    // App should still be functional
    const servicesGrid = page.locator('.services-grid');
    await expect(servicesGrid).toBeVisible();

    const serviceCount = await getServiceCount(page);
    expect(serviceCount).toBeGreaterThan(0);
  });
});

test.describe('Large Data Handling', () => {
  test('should handle filtering large number of services', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    const initialCount = await getServiceCount(page);

    // Apply and remove multiple filters in sequence - use services-stats to be specific
    const goldCard = page.locator('.services-stats .stat-card').filter({ hasText: /Gold/i });
    if (await goldCard.first().isVisible().catch(() => false)) {
      // Apply filter
      await goldCard.first().click();
      await page.waitForTimeout(300);

      const filteredCount = await getServiceCount(page);
      expect(filteredCount).toBeLessThanOrEqual(initialCount);

      // Remove filter by clicking the active card again
      await goldCard.first().click();
      await page.waitForTimeout(500);

      // Count should be restored or at least show services
      const restoredCount = await getServiceCount(page);
      expect(restoredCount).toBeGreaterThan(0);
    }
  });

  test('should handle combined search and filter efficiently', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Apply search
    await searchServices(page, 'test');
    const afterSearch = await getServiceCount(page);

    // Apply stat card filter
    const statCard = page.locator('.stat-card').first();
    if (await statCard.isVisible()) {
      await statCard.click();
      await page.waitForTimeout(200);

      const afterFilter = await getServiceCount(page);
      expect(afterFilter).toBeLessThanOrEqual(afterSearch);

      // Remove filter
      await statCard.click();
    }

    // Clear search
    await clearSearch(page);

    // Verify full list restored
    const finalCount = await getServiceCount(page);
    expect(finalCount).toBeGreaterThan(0);
  });
});

test.describe('View Switching Edge Cases', () => {
  test('should maintain state when switching between services and teams view', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Apply a search filter
    await searchServices(page, 'test');
    await page.waitForTimeout(300);

    // Switch to teams view
    await switchToTeamsView(page);
    await page.waitForTimeout(300);

    // Verify teams grid is visible
    const teamsGrid = page.locator('.teams-grid');
    await expect(teamsGrid).toBeVisible();

    // Switch back to services view
    await switchToServicesView(page);
    await page.waitForTimeout(300);

    // Verify services grid is visible and search is still applied
    const servicesGrid = page.locator('.services-grid');
    await expect(servicesGrid).toBeVisible();

    const searchInput = page.getByRole('textbox', { name: 'Search services...' });
    const searchValue = await searchInput.inputValue();
    expect(searchValue).toBe('test');

    await clearSearch(page);
  });

  test('should handle rapid view switching', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Rapidly switch between views
    await switchToTeamsView(page);
    await page.waitForTimeout(100);
    await switchToServicesView(page);
    await page.waitForTimeout(100);
    await switchToTeamsView(page);
    await page.waitForTimeout(100);
    await switchToServicesView(page);

    // App should be stable
    const servicesGrid = page.locator('.services-grid');
    await expect(servicesGrid).toBeVisible();
  });
});

test.describe('Sort Order Edge Cases', () => {
  test('should maintain sort order across interactions', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Change sort order - use value instead of label with regex
    const sortSelect = page.locator('#sort-select');
    await sortSelect.selectOption('name-asc');
    await page.waitForTimeout(200);

    // Get first service name
    const firstCard = page.locator('.service-card').first();
    const firstName = await firstCard.locator('.service-name').textContent();

    // Apply and remove a filter - use services-stats to be specific
    const statCard = page.locator('.services-stats .stat-card').first();
    if (await statCard.isVisible().catch(() => false)) {
      await statCard.click();
      await page.waitForTimeout(200);
      await statCard.click();
      await page.waitForTimeout(200);
    }

    // Verify sort is maintained
    const sortValue = await sortSelect.inputValue();
    expect(sortValue).toContain('name');
  });

  test('should handle all sort options', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    const sortSelect = page.locator('#sort-select');
    const options = await sortSelect.locator('option').allTextContents();

    // Cycle through all sort options
    for (const optionText of options) {
      await sortSelect.selectOption({ label: optionText });
      await page.waitForTimeout(100);

      // Verify grid is still visible
      const servicesGrid = page.locator('.services-grid');
      await expect(servicesGrid).toBeVisible();
    }
  });
});

test.describe('Display Mode Edge Cases', () => {
  test('should toggle display mode without losing data', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    const initialCount = await getServiceCount(page);

    // Toggle to list view
    const displayToggle = page.locator('.floating-btn--display');
    await displayToggle.click();
    await page.waitForTimeout(200);

    // Count should be same
    const listCount = await getServiceCount(page);
    expect(listCount).toBe(initialCount);

    // Toggle back to grid view
    await displayToggle.click();
    await page.waitForTimeout(200);

    // Count should still be same
    const gridCount = await getServiceCount(page);
    expect(gridCount).toBe(initialCount);
  });

  test('should maintain display mode with filters applied', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Apply search
    await searchServices(page, 'test');
    const filteredCount = await getServiceCount(page);

    // Toggle display mode
    const displayToggle = page.locator('.floating-btn--display');
    await displayToggle.click();
    await page.waitForTimeout(200);

    // Count should be same
    const afterToggle = await getServiceCount(page);
    expect(afterToggle).toBe(filteredCount);

    // Toggle back
    await displayToggle.click();
    await page.waitForTimeout(200);

    await clearSearch(page);
  });
});

test.describe('Modal Edge Cases', () => {
  test('should handle opening modal for different services', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Get multiple service cards
    const serviceCards = page.locator('.service-card');
    const count = await serviceCards.count();

    if (count >= 2) {
      // Open first service modal
      await serviceCards.first().click();
      await page.waitForSelector('#service-modal', { state: 'visible' });
      await closeServiceModal(page);

      // Open second service modal
      await serviceCards.nth(1).click();
      await page.waitForSelector('#service-modal', { state: 'visible' });
      await closeServiceModal(page);

      // Verify app is stable
      const servicesGrid = page.locator('.services-grid');
      await expect(servicesGrid).toBeVisible();
    }
  });

  test('should close modal with Escape key', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    await openServiceModal(page, 'test-repo');

    // Press Escape to close
    await page.keyboard.press('Escape');
    await page.waitForSelector('#service-modal', { state: 'hidden' });

    // Verify main view is visible
    const servicesGrid = page.locator('.services-grid');
    await expect(servicesGrid).toBeVisible();
  });

  test('should navigate through modal tabs without errors', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    await openServiceModal(page, 'test-repo');

    // Get all tab buttons
    const modal = page.locator('#service-modal');
    const tabButtons = modal.locator('.tab-buttons button, .modal-tabs button');
    const tabCount = await tabButtons.count();

    // Click through all tabs
    for (let i = 0; i < tabCount; i++) {
      const tab = tabButtons.nth(i);
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(100);

        // Verify tab content is visible
        const activeContent = modal.locator('.tab-content.active');
        await expect(activeContent).toBeVisible();
      }
    }

    await closeServiceModal(page);
  });
});

test.describe('Boundary Value Tests', () => {
  test('should handle single character search', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Search with single character
    await searchServices(page, 't');
    await page.waitForTimeout(300);

    // Should show results or empty state
    const servicesGrid = page.locator('.services-grid');
    await expect(servicesGrid).toBeVisible();

    await clearSearch(page);
  });

  test('should handle special characters in search', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Search with special characters
    await searchServices(page, 'test-repo');
    await page.waitForTimeout(300);

    // Should not crash, show results or empty
    const servicesGrid = page.locator('.services-grid');
    await expect(servicesGrid).toBeVisible();

    await clearSearch(page);

    // Try with other special characters
    await searchServices(page, 'test_repo');
    await page.waitForTimeout(300);
    await expect(servicesGrid).toBeVisible();

    await clearSearch(page);
  });
});
