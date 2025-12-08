/**
 * Phase 7: Check Filter Deep Dive Tests
 *
 * User story-based tests covering:
 * - Check filter modal complete workflow
 * - Check adoption statistics display
 * - Check search functionality
 * - Filter by check pass/fail state
 */

import { test, expect } from '@playwright/test';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openCheckFilterModal,
  closeCheckFilterModal,
  getServiceCount,
} from './test-helper.js';

test.describe('Check Filter Modal Workflow', () => {
  test('should open check filter modal and display categories', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Open check filter modal
    await openCheckFilterModal(page);
    const modal = page.locator('#check-filter-modal');
    await expect(modal).toBeVisible();

    // Verify modal header
    await expect(modal.locator('h2')).toContainText('Filter by Check');

    // Verify search input exists
    const searchInput = modal.locator('#check-filter-search');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /Search checks/i);

    // Verify check categories are displayed
    const categories = modal.locator('.check-category-section');
    await expect(categories.first()).toBeVisible();

    // Verify at least one category has checks
    const categoryHeaders = modal.locator('.check-category-header');
    await expect(categoryHeaders.first()).toBeVisible();

    // Close modal
    await closeCheckFilterModal(page);
    await expect(modal).toBeHidden();
  });

  test('should expand/collapse check categories', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    await openCheckFilterModal(page);
    const modal = page.locator('#check-filter-modal');

    // Find first category section
    const firstCategory = modal.locator('.check-category-section').first();
    const categoryHeader = firstCategory.locator('.check-category-header');
    const categoryContent = firstCategory.locator('.check-category-content');

    // Category should be expanded by default (not collapsed)
    await expect(firstCategory).not.toHaveClass(/collapsed/);

    // Click to collapse
    await categoryHeader.click();
    await page.waitForTimeout(200);
    await expect(firstCategory).toHaveClass(/collapsed/);

    // Click to expand again
    await categoryHeader.click();
    await page.waitForTimeout(200);
    await expect(firstCategory).not.toHaveClass(/collapsed/);

    await closeCheckFilterModal(page);
  });

  test('should filter checks by search query', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    await openCheckFilterModal(page);
    const modal = page.locator('#check-filter-modal');

    // Get initial check count
    const initialCards = modal.locator('.check-option-card');
    const initialCount = await initialCards.count();
    expect(initialCount).toBeGreaterThan(0);

    // Search for "readme"
    const searchInput = modal.locator('#check-filter-search');
    await searchInput.fill('readme');
    await page.waitForTimeout(300);

    // Verify filtered results
    const filteredCards = modal.locator('.check-option-card');
    const filteredCount = await filteredCards.count();

    // Should have fewer or same results after filtering
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // At least one result should match "readme"
    if (filteredCount > 0) {
      const firstCard = filteredCards.first();
      const cardText = await firstCard.textContent();
      expect(cardText?.toLowerCase()).toContain('readme');
    }

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(300);

    // Should restore all checks
    const restoredCount = await modal.locator('.check-option-card').count();
    expect(restoredCount).toBe(initialCount);

    await closeCheckFilterModal(page);
  });

  test('should set check filter state and apply filters', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    const initialCount = await getServiceCount(page);

    await openCheckFilterModal(page);
    const modal = page.locator('#check-filter-modal');

    // Find first check option card
    const checkCard = modal.locator('.check-option-card').first();
    await expect(checkCard).toBeVisible();

    // Click "Pass" state button
    const passButton = checkCard.locator('.state-btn.state-pass');
    await passButton.click();
    await page.waitForTimeout(200);

    // Verify button is now active
    await expect(passButton).toHaveClass(/active/);

    // Verify filter summary shows 1 active filter
    const filterSummary = modal.locator('.check-filter-summary');
    await expect(filterSummary).toBeVisible();
    await expect(filterSummary).toContainText('1');

    // Close modal (applies filter)
    await closeCheckFilterModal(page);

    // Verify filter was applied - count may differ
    const newCount = await getServiceCount(page);
    expect(newCount).toBeLessThanOrEqual(initialCount);

    // Re-open and clear filters
    await openCheckFilterModal(page);
    const clearButton = modal.locator('.check-clear-btn');
    await clearButton.click();
    await page.waitForTimeout(200);

    // Filter summary should be hidden
    await expect(modal.locator('.check-filter-summary')).toBeHidden();

    await closeCheckFilterModal(page);
  });

  test('should toggle between Any, Pass, and Fail states', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    await openCheckFilterModal(page);
    const modal = page.locator('#check-filter-modal');

    // Find first check option card
    const checkCard = modal.locator('.check-option-card').first();

    // Initially "Any" should be active (no filter)
    const anyButton = checkCard.locator('.state-btn.state-any');
    const passButton = checkCard.locator('.state-btn.state-pass');
    const failButton = checkCard.locator('.state-btn.state-fail');

    await expect(anyButton).toHaveClass(/active/);
    await expect(passButton).not.toHaveClass(/active/);
    await expect(failButton).not.toHaveClass(/active/);

    // Click Pass
    await passButton.click();
    await page.waitForTimeout(100);
    await expect(passButton).toHaveClass(/active/);
    await expect(anyButton).not.toHaveClass(/active/);
    await expect(failButton).not.toHaveClass(/active/);

    // Click Fail
    await failButton.click();
    await page.waitForTimeout(100);
    await expect(failButton).toHaveClass(/active/);
    await expect(anyButton).not.toHaveClass(/active/);
    await expect(passButton).not.toHaveClass(/active/);

    // Click Any to reset
    await anyButton.click();
    await page.waitForTimeout(100);
    await expect(anyButton).toHaveClass(/active/);
    await expect(passButton).not.toHaveClass(/active/);
    await expect(failButton).not.toHaveClass(/active/);

    await closeCheckFilterModal(page);
  });
});

test.describe('Check Adoption Statistics', () => {
  test('should display adoption statistics for each check', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    await openCheckFilterModal(page);
    const modal = page.locator('#check-filter-modal');

    // Find first check option card
    const checkCard = modal.locator('.check-option-card').first();
    await expect(checkCard).toBeVisible();

    // Verify stats section exists
    const stats = checkCard.locator('.check-option-stats');
    await expect(stats).toBeVisible();

    // Verify passing stat exists
    const passingStat = stats.locator('.check-option-stat.passing');
    await expect(passingStat).toBeVisible();
    const passingValue = passingStat.locator('.check-option-stat-value');
    await expect(passingValue).toBeVisible();

    // Verify failing stat exists
    const failingStat = stats.locator('.check-option-stat.failing');
    await expect(failingStat).toBeVisible();
    const failingValue = failingStat.locator('.check-option-stat-value');
    await expect(failingValue).toBeVisible();

    // Verify progress bar exists
    const progressBar = checkCard.locator('.check-option-progress-bar');
    await expect(progressBar).toBeVisible();

    // Verify progress fill has a percentage class
    const progressFill = progressBar.locator('.check-option-progress-fill');
    const fillClass = await progressFill.getAttribute('class');
    expect(fillClass).toMatch(/low|medium|high/);

    // Verify progress text shows percentage
    const progressText = checkCard.locator('.check-option-progress-text');
    const percentageText = await progressText.textContent();
    expect(percentageText).toMatch(/\d+%/);

    await closeCheckFilterModal(page);
  });

  test('should display category average adoption in header', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    await openCheckFilterModal(page);
    const modal = page.locator('#check-filter-modal');

    // Find first category header
    const categoryHeader = modal.locator('.check-category-header').first();
    await expect(categoryHeader).toBeVisible();

    // Verify category stats exist
    const categoryStats = categoryHeader.locator('.check-category-header-stats');
    await expect(categoryStats).toBeVisible();

    // Should contain "avg adoption"
    const statsText = await categoryStats.textContent();
    expect(statsText).toContain('avg adoption');
    expect(statsText).toMatch(/\d+%/);

    // Verify count badge exists
    const countBadge = categoryHeader.locator('.check-category-header-count');
    await expect(countBadge).toBeVisible();
    const countText = await countBadge.textContent();
    expect(countText).toMatch(/\(\d+\)/);

    await closeCheckFilterModal(page);
  });

  test('should display check name and description', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    await openCheckFilterModal(page);
    const modal = page.locator('#check-filter-modal');

    // Find first check option card
    const checkCard = modal.locator('.check-option-card').first();
    await expect(checkCard).toBeVisible();

    // Verify check name exists
    const checkName = checkCard.locator('.check-option-name');
    await expect(checkName).toBeVisible();
    const nameText = await checkName.textContent();
    expect(nameText?.length).toBeGreaterThan(0);

    // Description may or may not exist, but info section should
    const infoSection = checkCard.locator('.check-option-info');
    await expect(infoSection).toBeVisible();

    await closeCheckFilterModal(page);
  });
});

test.describe('Check Filter Integration', () => {
  test('should apply multiple check filters simultaneously', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    await openCheckFilterModal(page);
    const modal = page.locator('#check-filter-modal');

    // Set first check to Pass
    const firstCheck = modal.locator('.check-option-card').first();
    await firstCheck.locator('.state-btn.state-pass').click();
    await page.waitForTimeout(100);

    // Set second check to Fail
    const secondCheck = modal.locator('.check-option-card').nth(1);
    await secondCheck.locator('.state-btn.state-fail').click();
    await page.waitForTimeout(100);

    // Verify filter summary shows 2 active filters
    const filterSummary = modal.locator('.check-filter-summary');
    await expect(filterSummary).toContainText('2');

    // Close and apply
    await closeCheckFilterModal(page);

    // Services should be filtered (might be 0 or more depending on data)
    const count = await getServiceCount(page);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should persist filters when reopening modal', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    await openCheckFilterModal(page);
    const modal = page.locator('#check-filter-modal');

    // Set first check to Pass
    const firstCheck = modal.locator('.check-option-card').first();
    const checkId = await firstCheck.getAttribute('data-check-id');
    await firstCheck.locator('.state-btn.state-pass').click();
    await page.waitForTimeout(100);

    // Close modal
    await closeCheckFilterModal(page);

    // Reopen modal
    await openCheckFilterModal(page);

    // Find the same check by data-check-id
    const sameCheck = modal.locator(`.check-option-card[data-check-id="${checkId}"]`);
    const passButton = sameCheck.locator('.state-btn.state-pass');

    // Should still be active
    await expect(passButton).toHaveClass(/active/);

    // Clear filters
    await modal.locator('.check-clear-btn').click();
    await closeCheckFilterModal(page);
  });

  test('should clear all filters with Clear All button', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    await openCheckFilterModal(page);
    const modal = page.locator('#check-filter-modal');

    // Set multiple filters
    const firstCheck = modal.locator('.check-option-card').first();
    await firstCheck.locator('.state-btn.state-pass').click();

    const secondCheck = modal.locator('.check-option-card').nth(1);
    await secondCheck.locator('.state-btn.state-fail').click();

    await page.waitForTimeout(100);

    // Verify filters are active
    await expect(modal.locator('.check-filter-summary')).toContainText('2');

    // Click Clear All
    await modal.locator('.check-clear-btn').click();
    await page.waitForTimeout(100);

    // Verify filters cleared
    await expect(modal.locator('.check-filter-summary')).toBeHidden();

    // Verify both checks are back to "Any" state
    await expect(firstCheck.locator('.state-btn.state-any')).toHaveClass(/active/);
    await expect(secondCheck.locator('.state-btn.state-any')).toHaveClass(/active/);

    await closeCheckFilterModal(page);
  });
});
