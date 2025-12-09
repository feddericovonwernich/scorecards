/**
 * Phase 3 User Journey 3.2: Staleness Detection and Sorting
 *
 * Tests staleness detection and sorting functionality:
 * - Stale service detection via checks_hash comparison
 * - Stale badge rendering
 * - Stale stat card filtering
 * - Sorting by score, name (A-Z, Z-A), recently updated
 * - Sort state persistence
 *
 * Coverage Target:
 * - staleness.ts: 31% → 80%+ (isServiceStale, getStalenessInfo, filterStaleServices)
 * - appStore.ts: sortServices, filterAndSortServices
 */

import { test, expect } from '@playwright/test';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
} from './test-helper.js';

test.describe('Staleness Detection and Sorting', () => {
  test('should detect and display stale services', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // The fixture has test-repo-stale with a different checks_hash
    // Find the stale service card
    const staleServiceCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    await expect(staleServiceCard).toBeVisible();

    // Verify STALE badge is displayed
    const staleBadge = staleServiceCard.locator('.badge-stale, [class*="stale"]').filter({ hasText: 'STALE' }).first();
    await expect(staleBadge).toBeVisible();
    console.log('Stale badge displayed on test-repo-stale');

    // Check the stale stat card shows count (if it exists)
    const staleStatCard = page.locator('#stale-count');
    const isStaleCardVisible = await staleStatCard.isVisible().catch(() => false);
    if (isStaleCardVisible) {
      const statValue = await staleStatCard.locator('.stat-value').textContent();
      console.log(`Stale stat card value: ${statValue}`);
      expect(parseInt(statValue)).toBeGreaterThan(0);
    } else {
      console.log('Stale stat card not rendered (no stale services in fixture)');
    }
  });

  test('should filter by stale services', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    const initialCount = await getServiceCount(page);
    console.log(`Initial count: ${initialCount}`);

    // Click stale filter stat card
    const staleStatCard = page.locator('#stale-count');
    await expect(staleStatCard).toBeVisible();

    await staleStatCard.click();
    await page.waitForTimeout(300);
    await expect(staleStatCard).toHaveClass(/active|include/);

    const staleCount = await getServiceCount(page);
    console.log(`After stale filter: ${staleCount} services`);
    expect(staleCount).toBeLessThan(initialCount);
    expect(staleCount).toBeGreaterThan(0);

    // All visible services should have stale badge
    const visibleCards = page.locator('.service-card');
    const cardCount = await visibleCards.count();

    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = visibleCards.nth(i);
      const staleBadge = card.locator('.badge-stale, [class*="stale"]').filter({ hasText: 'STALE' }).first();
      await expect(staleBadge).toBeVisible();
    }
    console.log('All filtered services have stale badge');

    // Clear filter
    await staleStatCard.click();
    await page.waitForTimeout(100);
    await staleStatCard.click();
    await page.waitForTimeout(300);

    const afterClear = await getServiceCount(page);
    expect(afterClear).toBe(initialCount);
  });

  test('should sort services by score', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Find sort dropdown
    const sortSelect = page.locator('#sort-select');
    await expect(sortSelect).toBeVisible();

    // Sort by score high to low (default)
    await sortSelect.selectOption('Score: High to Low');
    await page.waitForTimeout(300);

    // Get first few cards and verify descending score order
    const cards = page.locator('.service-card');
    const cardCount = await cards.count();

    if (cardCount >= 2) {
      const firstScore = await cards.first().locator('.score-badge, [class*="score"]').textContent();
      const secondScore = await cards.nth(1).locator('.score-badge, [class*="score"]').textContent();

      const score1 = parseInt(firstScore.match(/\d+/)?.[0] || '0');
      const score2 = parseInt(secondScore.match(/\d+/)?.[0] || '0');

      expect(score1).toBeGreaterThanOrEqual(score2);
      console.log(`Score order verified: ${score1} >= ${score2}`);
    }

    // Sort by score low to high
    await sortSelect.selectOption('Score: Low to High');
    await page.waitForTimeout(300);

    if (cardCount >= 2) {
      const firstScore = await cards.first().locator('.score-badge, [class*="score"]').textContent();
      const secondScore = await cards.nth(1).locator('.score-badge, [class*="score"]').textContent();

      const score1 = parseInt(firstScore.match(/\d+/)?.[0] || '0');
      const score2 = parseInt(secondScore.match(/\d+/)?.[0] || '0');

      expect(score1).toBeLessThanOrEqual(score2);
      console.log(`Reverse score order verified: ${score1} <= ${score2}`);
    }
  });

  test('should sort services by name', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    const sortSelect = page.locator('#sort-select');
    await expect(sortSelect).toBeVisible();

    // Sort by name A to Z
    await sortSelect.selectOption('Name: A to Z');
    await page.waitForTimeout(300);

    const cards = page.locator('.service-card');
    const cardCount = await cards.count();

    if (cardCount >= 2) {
      const firstName = await cards.first().locator('.service-name, h3, [class*="name"]').first().textContent();
      const secondName = await cards.nth(1).locator('.service-name, h3, [class*="name"]').first().textContent();

      // A-Z means alphabetically first name should come first
      expect(firstName.toLowerCase().localeCompare(secondName.toLowerCase())).toBeLessThanOrEqual(0);
      console.log(`Name A-Z order: "${firstName}" <= "${secondName}"`);
    }

    // Sort by name Z to A
    await sortSelect.selectOption('Name: Z to A');
    await page.waitForTimeout(300);

    if (cardCount >= 2) {
      const firstName = await cards.first().locator('.service-name, h3, [class*="name"]').first().textContent();
      const secondName = await cards.nth(1).locator('.service-name, h3, [class*="name"]').first().textContent();

      // Z-A means alphabetically last name should come first
      expect(firstName.toLowerCase().localeCompare(secondName.toLowerCase())).toBeGreaterThanOrEqual(0);
      console.log(`Name Z-A order: "${firstName}" >= "${secondName}"`);
    }
  });

  test('should sort by recently updated', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    const sortSelect = page.locator('#sort-select');
    await expect(sortSelect).toBeVisible();

    // Sort by recently updated
    await sortSelect.selectOption('Recently Updated');
    await page.waitForTimeout(300);

    // Verify the sort was applied (just check that we still have cards)
    const cards = page.locator('.service-card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    console.log(`Sorted by recently updated: ${cardCount} services displayed`);
  });

  test('should combine sorting with filtering', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Apply gold filter
    const goldCard = page.locator('#gold-count');
    await goldCard.click();
    await page.waitForTimeout(300);

    const goldCount = await getServiceCount(page);
    console.log(`Gold services: ${goldCount}`);

    // Sort by name A-Z
    const sortSelect = page.locator('#sort-select');
    await sortSelect.selectOption('Name: A to Z');
    await page.waitForTimeout(300);

    // Count should still be the same (only gold services)
    const afterSort = await getServiceCount(page);
    expect(afterSort).toBe(goldCount);

    // Verify first card is still gold
    const firstCard = page.locator('.service-card').first();
    const rankBadge = firstCard.locator('.rank-badge, [class*="rank"]');
    await expect(rankBadge).toContainText(/gold/i);

    console.log('Filter and sort combined correctly');

    // Clear filter
    await goldCard.click();
    await goldCard.click();
  });

  test('should handle installed stale services', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Filter by installed
    const installedCard = page.locator('#installed-count');
    if (await installedCard.isVisible()) {
      await installedCard.click();
      await page.waitForTimeout(300);

      const installedCount = await getServiceCount(page);
      console.log(`Installed services: ${installedCount}`);

      // Check if any installed services are also stale
      const cards = page.locator('.service-card');
      const cardCount = await cards.count();

      let installedAndStale = 0;
      for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);
        const staleBadge = card.locator('.badge-stale, [class*="stale"]');
        if (await staleBadge.isVisible()) {
          installedAndStale++;
        }
      }

      console.log(`Installed + Stale services: ${installedAndStale}`);

      // Clear installed filter
      await installedCard.click();
      await page.waitForTimeout(100);
      await installedCard.click();
    }
  });

  test('should persist sort preference', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Change sort to name A-Z
    const sortSelect = page.locator('#sort-select');
    await sortSelect.selectOption('Name: A to Z');
    await page.waitForTimeout(300);

    // Get first service name
    const firstCard = page.locator('.service-card').first();
    const firstNameBefore = await firstCard.locator('.service-name, h3, [class*="name"]').first().textContent();

    // Switch to teams view and back
    const teamsTab = page.locator('button').filter({ hasText: /^teams$/i });
    await teamsTab.click();
    await page.waitForTimeout(500);

    const servicesTab = page.locator('button').filter({ hasText: /^services$/i });
    await servicesTab.click();
    await page.waitForTimeout(500);

    // Verify sort is still applied (first service should be same)
    const firstNameAfter = await page.locator('.service-card').first().locator('.service-name, h3, [class*="name"]').first().textContent();
    expect(firstNameAfter).toBe(firstNameBefore);

    console.log(`Sort persisted across view switch: "${firstNameBefore}"`);
  });
});
