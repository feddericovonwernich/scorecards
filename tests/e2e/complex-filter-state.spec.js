/**
 * Phase 3 User Journey 3.1: Complex Filter Combinations
 *
 * Tests comprehensive state management for filtering including:
 * - Multiple filter types combined (team, rank, search, stale, has-api)
 * - Include vs exclude filter logic
 * - Team string vs object formats
 * - Filter state persistence and clearing
 * - Search query debouncing
 *
 * Coverage Target:
 * - appStore.ts: 46% → 75%+ (filterServices, setFilter, selectActiveFilterCount)
 */

import { test, expect } from '@playwright/test';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
} from './test-helper.js';

test.describe('Complex Filter State Management', () => {
  test('should handle complex multi-filter combinations', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    const initialCount = await getServiceCount(page);
    expect(initialCount).toBeGreaterThan(0);
    console.log(`Initial service count: ${initialCount}`);

    // ========================================
    // Phase 1: Team filter dropdown
    // ========================================
    const teamDropdown = page.locator('button').filter({ hasText: /all teams/i });
    if (await teamDropdown.isVisible()) {
      await teamDropdown.click();
      await page.waitForTimeout(200);

      // Select a specific team from dropdown
      const teamOption = page.locator('[role="option"], .dropdown-item, button').filter({ hasText: /platform|backend|frontend/i }).first();
      if (await teamOption.isVisible()) {
        const teamName = await teamOption.textContent();
        await teamOption.click();
        await page.waitForTimeout(300);

        const teamFilteredCount = await getServiceCount(page);
        expect(teamFilteredCount).toBeLessThanOrEqual(initialCount);
        console.log(`After team filter (${teamName}): ${teamFilteredCount} services`);

        // Reset team filter
        await teamDropdown.click();
        await page.waitForTimeout(200);
        const allTeamsOption = page.locator('[role="option"], .dropdown-item, button').filter({ hasText: /all teams/i }).first();
        if (await allTeamsOption.isVisible()) {
          await allTeamsOption.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // ========================================
    // Phase 2: Rank filter (StatCard include mode)
    // ========================================
    const goldCard = page.locator('#gold-count');
    await expect(goldCard).toBeVisible();

    await goldCard.click();
    await page.waitForTimeout(300);
    await expect(goldCard).toHaveClass(/active|include/);

    const goldIncludeCount = await getServiceCount(page);
    expect(goldIncludeCount).toBeLessThanOrEqual(initialCount);
    console.log(`After gold include filter: ${goldIncludeCount} services`);

    // ========================================
    // Phase 3: Search query filter
    // ========================================
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('test');
    await page.waitForTimeout(500); // Wait for debounce

    const searchCount = await getServiceCount(page);
    expect(searchCount).toBeLessThanOrEqual(goldIncludeCount);
    console.log(`After search "test": ${searchCount} services`);

    // ========================================
    // Phase 4: Stale filter (stat card)
    // ========================================
    const staleCard = page.locator('#stale-count');
    if (await staleCard.count() > 0) {
      await staleCard.click();
      await page.waitForTimeout(300);

      const staleCount = await getServiceCount(page);
      console.log(`After stale filter: ${staleCount} services`);

      // Clear stale filter
      await staleCard.click();
      await page.waitForTimeout(100);
      await staleCard.click(); // Third click to clear
      await page.waitForTimeout(300);
    }

    // ========================================
    // Phase 5: Has API filter (stat card)
    // ========================================
    const apiCard = page.locator('#has-api-count');
    if (await apiCard.count() > 0) {
      await apiCard.click();
      await page.waitForTimeout(300);

      const apiCount = await getServiceCount(page);
      console.log(`After has-api filter: ${apiCount} services`);

      // Clear API filter
      await apiCard.click();
      await page.waitForTimeout(100);
      await apiCard.click();
      await page.waitForTimeout(300);
    }

    // ========================================
    // Phase 6: Switch gold to exclude mode
    // ========================================
    // Gold card is currently in include mode (from Phase 2)
    await goldCard.click(); // Second click = exclude
    await page.waitForTimeout(300);
    await expect(goldCard).toHaveClass(/exclude/);

    const goldExcludeCount = await getServiceCount(page);
    console.log(`After gold exclude filter: ${goldExcludeCount} services`);

    // ========================================
    // Phase 7: Clear all filters
    // ========================================
    // Clear gold filter
    await goldCard.click(); // Third click = clear
    await page.waitForTimeout(300);

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // Verify back to initial state
    const finalCount = await getServiceCount(page);
    expect(finalCount).toBe(initialCount);
    console.log(`Final count after clearing: ${finalCount} (expected ${initialCount})`);
  });

  test('should handle multiple rank filters simultaneously', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    const initialCount = await getServiceCount(page);

    // Include gold services
    const goldCard = page.locator('#gold-count');
    await goldCard.click();
    await page.waitForTimeout(300);

    const goldOnlyCount = await getServiceCount(page);
    console.log(`Gold only: ${goldOnlyCount} services`);

    // Also include silver services
    const silverCard = page.locator('#silver-count');
    await silverCard.click();
    await page.waitForTimeout(300);

    const goldAndSilverCount = await getServiceCount(page);
    expect(goldAndSilverCount).toBeGreaterThanOrEqual(goldOnlyCount);
    console.log(`Gold + Silver: ${goldAndSilverCount} services`);

    // Exclude bronze services (should have no effect if we're already including gold+silver)
    const bronzeCard = page.locator('#bronze-count');
    await bronzeCard.click();
    await page.waitForTimeout(100);
    await bronzeCard.click(); // Exclude mode
    await page.waitForTimeout(300);

    const afterBronzeExclude = await getServiceCount(page);
    console.log(`Gold + Silver, exclude Bronze: ${afterBronzeExclude} services`);

    // Clear all
    await goldCard.click(); // include -> exclude
    await goldCard.click(); // exclude -> clear
    await silverCard.click();
    await silverCard.click();
    await bronzeCard.click(); // already in exclude, one more click to clear
    await page.waitForTimeout(300);

    const finalCount = await getServiceCount(page);
    expect(finalCount).toBe(initialCount);
  });

  test('should handle search with special characters', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    const searchInput = page.locator('#search-input');

    // Test search with hyphen (common in repo names)
    await searchInput.fill('test-repo');
    await page.waitForTimeout(500);
    let count = await getServiceCount(page);
    console.log(`Search "test-repo": ${count} services`);
    expect(count).toBeGreaterThan(0);

    // Test search with partial match
    await searchInput.clear();
    await searchInput.fill('stale');
    await page.waitForTimeout(500);
    count = await getServiceCount(page);
    console.log(`Search "stale": ${count} services`);

    // Test empty search (should show all)
    await searchInput.clear();
    await page.waitForTimeout(500);
    const allCount = await getServiceCount(page);
    console.log(`Empty search: ${allCount} services`);
  });

  test('should persist filter state across view switches', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Apply gold filter in services view
    const goldCard = page.locator('#gold-count');
    await goldCard.click();
    await page.waitForTimeout(300);

    const servicesGoldCount = await getServiceCount(page);
    console.log(`Services view gold filter: ${servicesGoldCount} services`);

    // Switch to teams view
    const teamsTab = page.locator('button').filter({ hasText: /^teams$/i });
    await teamsTab.click();
    await page.waitForTimeout(500);

    // Switch back to services view
    const servicesTab = page.locator('button').filter({ hasText: /^services$/i });
    await servicesTab.click();
    await page.waitForTimeout(500);

    // Verify gold filter is still active
    await expect(goldCard).toHaveClass(/active|include/);
    const afterSwitchCount = await getServiceCount(page);
    expect(afterSwitchCount).toBe(servicesGoldCount);
    console.log(`After view switch: ${afterSwitchCount} services (filter preserved)`);

    // Clear filter
    await goldCard.click();
    await goldCard.click();
  });
});
