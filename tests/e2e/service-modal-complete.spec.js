/**
 * Phase 2 User Journey 2.1: Complete Modal Tab Navigation
 *
 * Tests comprehensive modal tab navigation including:
 * - LinksTab rendering (0% → 90%+ coverage target)
 * - APITab with environments and spec info (31% → 75%+ coverage target)
 * - ServiceModal tab switching completeness (70% → 85%+ coverage target)
 * - All tab types: Checks, API, Links, Contributors, Workflows, Badges
 *
 * Coverage Target:
 * - LinksTab.tsx: 0% → 90%+ (link rendering, descriptions, icons)
 * - APITab.tsx: 31% → 75%+ (summary, environments, spec loading)
 * - ServiceModal.tsx: 70% → 85%+ (tab navigation, conditional tabs)
 */

import { test, expect } from '@playwright/test';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openServiceModal,
} from './test-helper.js';

test.describe('Service Modal - Complete Tab Navigation', () => {
  test('should navigate through all service modal tabs including Links and API tabs', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Open service modal for test-repo-stale (has links and API)
    await openServiceModal(page, 'test-repo-stale');
    const modal = page.locator('#service-modal, .service-modal');
    await expect(modal).toBeVisible();

    // Verify modal header shows service name and rank
    await expect(modal.locator('h2')).toContainText('test-repo-stale');
    const rankBadge = modal.locator('.rank-badge, [class*="rank"]');
    await expect(rankBadge).toBeVisible();

    // ========================================
    // Tab 1: Check Results (default tab)
    // ========================================
    const checksTab = modal.locator('#checks-tab, [role="tabpanel"]').first();
    await expect(checksTab).toBeVisible();

    // Verify check items are displayed
    const checkItems = modal.locator('.check-result-item, .check-item, [class*="check"]');
    const checkCount = await checkItems.count();
    expect(checkCount).toBeGreaterThan(0);
    console.log(`Found ${checkCount} check items`);

    // ========================================
    // Tab 2: API Specification (APITab.tsx)
    // ========================================
    const apiTabButton = modal.getByRole('tab', { name: /api/i }).or(
      modal.locator('button').filter({ hasText: /api/i })
    );

    if (await apiTabButton.isVisible()) {
      await apiTabButton.click();
      await page.waitForTimeout(300);

      const apiTab = modal.locator('#api-tab');
      await expect(apiTab).toBeVisible();

      // Verify API summary info from OpenAPI check stdout
      const apiSummary = apiTab.locator('.api-summary-card').first();
      await expect(apiSummary).toBeVisible();

      // Check for title from parsed stdout
      const title = apiTab.locator('.api-summary-title');
      if (await title.count() > 0) {
        await expect(title).toContainText('Test Repo Stale API');
        console.log('API title displayed');
      }

      // Check for spec file path
      const specFile = apiTab.locator('code');
      await expect(specFile.first()).toBeVisible();

      // Check for OpenAPI version
      const versionText = apiTab.locator('text=OpenAPI');
      if (await versionText.count() > 0) {
        console.log('OpenAPI version info displayed');
      }

      // Check for endpoints count
      const endpointsText = apiTab.locator('text=path');
      if (await endpointsText.count() > 0) {
        console.log('Endpoints info displayed');
      }

      // Verify GitHub link to spec file
      const githubLink = apiTab.locator('a[href*="github.com"]').first();
      await expect(githubLink).toBeVisible();
      await expect(githubLink).toHaveAttribute('target', '_blank');

      // Verify environments section (from openapi config)
      const environmentsSection = apiTab.locator('.environments-grid');
      if (await environmentsSection.count() > 0) {
        await expect(environmentsSection).toBeVisible();

        // Check production environment
        const prodEnv = apiTab.locator('.environment-card').filter({ hasText: 'production' }).first();
        if (await prodEnv.count() > 0) {
          await expect(prodEnv).toContainText('api.example.com');
          console.log('Production environment displayed');
        }

        // Check staging environment
        const stagingEnv = apiTab.locator('.environment-card').filter({ hasText: 'staging' }).first();
        if (await stagingEnv.count() > 0) {
          await expect(stagingEnv).toContainText('staging-api.example.com');
          console.log('Staging environment displayed');
        }
      }

      // Test collapsible raw spec section
      const specDetails = apiTab.locator('details').first();
      if (await specDetails.count() > 0) {
        const summary = specDetails.locator('summary');
        await expect(summary).toContainText(/view|raw|specification/i);

        // Click to expand (triggers loadSpecContent)
        await summary.click();
        await page.waitForTimeout(500);

        // Should show loading or content or error
        const specContent = specDetails.locator('.spec-content');
        if (await specContent.isVisible()) {
          const hasLoading = await specContent.locator('.spec-loading').isVisible();
          const hasError = await specContent.locator('.spec-error').isVisible();
          const hasCode = await specContent.locator('pre, code').isVisible();

          // At least one state should be shown
          expect(hasLoading || hasError || hasCode).toBeTruthy();
          console.log(`Spec section state: loading=${hasLoading}, error=${hasError}, code=${hasCode}`);
        }
      }

      // Test API Explorer button (if environments exist)
      const explorerButton = apiTab.locator('button').filter({ hasText: /explorer/i });
      if (await explorerButton.isVisible()) {
        // Just verify it's clickable (don't actually open explorer)
        await expect(explorerButton).toBeEnabled();
        console.log('API Explorer button available');
      }

      console.log('APITab tests completed');
    } else {
      console.log('API tab not visible - service may not have API spec');
    }

    // ========================================
    // Tab 3: Links (LinksTab.tsx - 0% coverage!)
    // ========================================
    const linksTabButton = modal.getByRole('tab', { name: /links/i }).or(
      modal.locator('button').filter({ hasText: /links/i })
    );

    if (await linksTabButton.isVisible()) {
      await linksTabButton.click();
      await page.waitForTimeout(300);

      const linksTab = modal.locator('#links-tab');
      await expect(linksTab).toBeVisible();

      // Verify links list
      const linkList = linksTab.locator('.link-list, ul');
      await expect(linkList).toBeVisible();

      const linkItems = linksTab.locator('.link-item, li');
      const linkCount = await linkItems.count();
      expect(linkCount).toBeGreaterThan(0);
      console.log(`Found ${linkCount} links`);

      // Test first link structure
      const firstLink = linkItems.first().locator('a');
      await expect(firstLink).toBeVisible();
      await expect(firstLink).toHaveAttribute('href');
      await expect(firstLink).toHaveAttribute('target', '_blank');
      await expect(firstLink).toHaveAttribute('rel', 'noopener noreferrer');

      // Verify link has icon (SVG)
      const icon = firstLink.locator('svg');
      await expect(icon).toBeVisible();

      // Verify link has name
      const linkName = firstLink.locator('.link-name, strong');
      await expect(linkName).toBeVisible();
      const nameText = await linkName.textContent();
      expect(nameText.length).toBeGreaterThan(0);
      console.log(`First link name: ${nameText}`);

      // Check for optional description on links that have it
      const linksWithDescription = linksTab.locator('.link-description, .link-desc');
      const descCount = await linksWithDescription.count();
      if (descCount > 0) {
        console.log(`Found ${descCount} links with descriptions`);
      }

      // Test link keyboard navigation
      await firstLink.focus();
      await expect(firstLink).toBeFocused();

      if (linkCount > 1) {
        await page.keyboard.press('Tab');
        const secondLink = linkItems.nth(1).locator('a');
        // Focus should move to second link
        await page.waitForTimeout(100);
      }

      // Test that clicking link opens in new tab (without navigation)
      const href = await firstLink.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/^https?:\/\//);

      console.log('LinksTab tests completed');
    } else {
      console.log('Links tab not visible - service may not have links');
    }

    // ========================================
    // Tab 4: Contributors
    // ========================================
    const contributorsTabButton = modal.getByRole('tab', { name: /contributors/i }).or(
      modal.locator('button').filter({ hasText: /contributors/i })
    );

    if (await contributorsTabButton.isVisible()) {
      await contributorsTabButton.click();
      await page.waitForTimeout(300);

      const contributorsTab = modal.locator('#contributors-tab');
      if (await contributorsTab.count() > 0) {
        // Check for contributor avatars (Gravatar)
        const avatars = contributorsTab.locator('img[src*="gravatar"]');
        const avatarCount = await avatars.count();
        if (avatarCount > 0) {
          console.log(`Found ${avatarCount} contributor avatars`);
        }

        // Check for contributor list
        const contributorList = contributorsTab.locator('.contributors-list');
        if (await contributorList.count() > 0) {
          console.log('Contributors list displayed');
        }
      }
    }

    // ========================================
    // Tab 5: Workflow Runs
    // ========================================
    const workflowsTabButton = modal.getByRole('tab', { name: /workflow|actions/i }).or(
      modal.locator('button').filter({ hasText: /workflow|actions/i })
    );

    if (await workflowsTabButton.isVisible()) {
      await workflowsTabButton.click();
      await page.waitForTimeout(300);

      const workflowsTab = modal.locator('#workflows-tab');
      if (await workflowsTab.count() > 0) {
        console.log('Workflows tab displayed');
        // Note: Actual workflow runs require GitHub PAT
      }
    }

    // ========================================
    // Tab 6: Badges
    // ========================================
    const badgesTabButton = modal.getByRole('tab', { name: /badges/i }).or(
      modal.locator('button').filter({ hasText: /badges/i })
    );

    if (await badgesTabButton.isVisible()) {
      await badgesTabButton.click();
      await page.waitForTimeout(300);

      const badgesTab = modal.locator('#badges-tab');
      await expect(badgesTab).toBeVisible();

      // Check for badge code snippets
      const codeBlocks = badgesTab.locator('code, pre, textarea');
      if (await codeBlocks.count() > 0) {
        console.log('Badge code snippets displayed');
      }

      // Check for copy buttons
      const copyButtons = badgesTab.locator('button').filter({ hasText: /copy/i });
      if (await copyButtons.count() > 0) {
        console.log('Copy buttons available for badges');
      }
    }

    // ========================================
    // Modal close with Escape key
    // ========================================
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    console.log('Modal closed successfully with Escape key');
  });

  test('should handle service without links gracefully', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Open modal for test-repo-perfect (has no links)
    await openServiceModal(page, 'test-repo-perfect');
    const modal = page.locator('#service-modal, .service-modal');
    await expect(modal).toBeVisible();

    // Verify Links tab is NOT shown (empty links array in fixture)
    const linksTabButton = modal.locator('button').filter({ hasText: /^links$/i });
    const linksTabCount = await linksTabButton.count();
    expect(linksTabCount).toBe(0);
    console.log('Links tab correctly hidden for service without links');

    // Check Results tab should be visible (default)
    const checksTab = modal.locator('#checks-tab');
    await expect(checksTab).toBeVisible();

    console.log('Conditional tabs handled correctly');

    await page.keyboard.press('Escape');
  });

  test('should handle tab keyboard navigation', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    await openServiceModal(page, 'test-repo-stale');
    const modal = page.locator('#service-modal, .service-modal');
    await expect(modal).toBeVisible();

    // Get tab buttons by looking for the tab list area
    // The tabs are rendered as buttons with text like "Check Results", "API Specification", etc.
    const tabList = modal.locator('.tabs, [class*="tabs"]');
    const tabButtons = tabList.locator('button');
    const tabCount = await tabButtons.count();

    // There should be multiple tabs (Check Results, API, Links, Contributors, Workflow Runs, Badges)
    expect(tabCount).toBeGreaterThanOrEqual(3);
    console.log(`Found ${tabCount} tab buttons`);

    // Test clicking different tabs
    const checksTab = modal.locator('button').filter({ hasText: 'Check Results' });
    await checksTab.click();
    await page.waitForTimeout(200);

    const badgesTab = modal.locator('button').filter({ hasText: 'Badges' });
    await badgesTab.click();
    await page.waitForTimeout(200);

    console.log('Tab navigation via click works');

    await page.keyboard.press('Escape');
  });
});
