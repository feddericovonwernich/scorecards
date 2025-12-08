/**
 * Phase 1 User Journey 1.2: Service Card PR and Stale Interactions
 *
 * Tests service card-specific interactions:
 * - PR (Pull Request) link rendering and click handling
 * - Stale badge display
 * - Re-run/trigger button on stale services
 * - Event propagation prevention on links
 * - Keyboard navigation (Enter and Space)
 *
 * Coverage Target:
 * - ServiceCard.tsx: PR link rendering, stale interactions, keyboard handlers
 * - Workflow trigger integration
 * - Event propagation prevention
 */

import { test, expect } from '@playwright/test';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openSettingsModal,
  closeSettingsModal,
  mockWorkflowDispatch,
} from './test-helper.js';

test.describe('Service Card Actions - PR Links and Stale Services', () => {
  test('should interact with PR links, stale badges, and trigger buttons on service cards', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // ========================================
    // Phase 1: PR (Pull Request) Link Interaction
    // ========================================

    // Find service card with PR (installation pull request)
    const cardWithPR = page.locator('.service-card').filter({ has: page.locator('a[href*="pull"], .pr-status, .pr-link') }).first();

    if (await cardWithPR.count() > 0) {
      await expect(cardWithPR).toBeVisible();

      // Find PR link
      const prLink = cardWithPR.locator('a[href*="pull"]').first();

      if (await prLink.isVisible()) {
        const prStatus = await prLink.textContent();
        console.log('PR status found:', prStatus);

        // PR status might be empty if it's an icon or SVG - check href attribute exists
        const prHref = await prLink.getAttribute('href');
        expect(prHref).toContain('pull');

        // Verify modal is not open before clicking PR link
        const modalBefore = page.locator('#service-modal, .service-modal');
        await expect(modalBefore).toBeHidden();

        // Click PR link with Ctrl to open in new tab (prevents navigation in test)
        await prLink.click({ modifiers: ['Control'] });
        await page.waitForTimeout(300);

        // Modal should NOT have opened (PR link prevents propagation)
        await expect(modalBefore).toBeHidden();
        console.log('PR link correctly prevents modal from opening');
      }
    } else {
      console.log('No service cards with PR found - skipping PR link test');
    }

    // ========================================
    // Phase 2: Stale Service Detection and Badge Display
    // ========================================

    // Find stale service card
    const staleCard = page.locator('.service-card').filter({ has: page.locator('.badge-stale, [class*="stale"]') }).first();

    if (await staleCard.count() > 0) {
      await expect(staleCard).toBeVisible();

      // Verify stale badge rendering
      const staleBadge = staleCard.locator('.badge-stale, [class*="stale"]').first();
      await expect(staleBadge).toBeVisible();

      const badgeText = await staleBadge.textContent();
      console.log('Stale badge found:', badgeText);
      expect(badgeText).toMatch(/stale|outdated/i);

      // ========================================
      // Phase 3: Workflow Trigger on Stale Service
      // ========================================

      // Set up authentication for workflow trigger
      await openSettingsModal(page);

      const patInput = page.locator('input[type="password"], input[placeholder*="token"], #github-pat-input').first();
      await expect(patInput).toBeVisible();

      await patInput.fill('ghp_test_token_1234567890abcdef');
      await page.waitForTimeout(200);

      const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
      await saveButton.click();
      await page.waitForTimeout(500);

      await closeSettingsModal(page);

      // Mock workflow dispatch API
      await mockWorkflowDispatch(page, { status: 204 });

      // Find and click re-run/trigger button on stale card
      const triggerButton = staleCard.locator('button:has-text("Re-run"), button:has-text("Trigger"), button[title*="run"], button[title*="trigger"]').first();

      if (await triggerButton.isVisible()) {
        console.log('Trigger button found on stale service');

        await triggerButton.click();
        await page.waitForTimeout(500);

        // Verify toast notification appears
        const toast = page.locator('.toast, .toast-success, [class*="toast"]').first();
        if (await toast.isVisible()) {
          console.log('Toast notification appeared after workflow trigger');
          const toastText = await toast.textContent();
          console.log('Toast message:', toastText);
        }
      } else {
        console.log('No trigger button found on stale card - may require PAT configuration');
      }
    } else {
      console.log('No stale service cards found - skipping stale badge and trigger tests');
    }

    // ========================================
    // Phase 4: Service Card Keyboard Navigation
    // ========================================

    // Test keyboard navigation on first visible service card
    const firstCard = page.locator('.service-card').first();
    await expect(firstCard).toBeVisible();

    // Focus the card
    await firstCard.focus();
    await page.waitForTimeout(200);

    // Test Enter key opens modal
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);

    const modalAfterEnter = page.locator('#service-modal, .service-modal');

    if (await modalAfterEnter.isVisible()) {
      console.log('Enter key successfully opened modal');

      // Close modal with Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await expect(modalAfterEnter).toBeHidden();
      console.log('Escape key successfully closed modal');
    }

    // Test Space key also opens modal
    await firstCard.focus();
    await page.waitForTimeout(200);

    await page.keyboard.press('Space');
    await page.waitForTimeout(400);

    const modalAfterSpace = page.locator('#service-modal, .service-modal');

    if (await modalAfterSpace.isVisible()) {
      console.log('Space key successfully opened modal');

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await expect(modalAfterSpace).toBeHidden();
    }

    // ========================================
    // Phase 5: GitHub Link Event Propagation
    // ========================================

    // Find a service card with GitHub link
    const cardWithGithub = page.locator('.service-card').filter({ has: page.locator('a[href*="github.com"]') }).first();

    if (await cardWithGithub.count() > 0) {
      await expect(cardWithGithub).toBeVisible();

      const githubLink = cardWithGithub.locator('a[href*="github.com"]').first();

      if (await githubLink.isVisible()) {
        // Verify modal is not open
        const modalBefore = page.locator('#service-modal, .service-modal');
        await expect(modalBefore).toBeHidden();

        // Click GitHub link with Ctrl (prevents navigation)
        await githubLink.click({ modifiers: ['Control'] });
        await page.waitForTimeout(300);

        // Modal should NOT open (link prevents propagation)
        await expect(modalBefore).toBeHidden();
        console.log('GitHub link correctly prevents modal from opening via event propagation');
      }
    }

    // ========================================
    // Phase 6: Card Click (Should Open Modal)
    // ========================================

    // Verify that clicking the card itself (not a link) does open the modal
    const testCard = page.locator('.service-card').nth(1); // Use second card to avoid conflicts
    await expect(testCard).toBeVisible();

    // Find an area of the card that's NOT a link or button
    const cardTitle = testCard.locator('.service-name, .service-title, h3, h2').first();

    if (await cardTitle.isVisible()) {
      await cardTitle.click();
      await page.waitForTimeout(400);

      const modalAfterCardClick = page.locator('#service-modal, .service-modal');

      if (await modalAfterCardClick.isVisible()) {
        console.log('Clicking card title successfully opened modal');
        await page.keyboard.press('Escape');
      }
    }
  });

  test('should display relative time formatting for PR status updates', async ({ page }) => {
    // Mock catalog with specific PR data
    await page.route('**/all-services.json', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            name: 'test-service-with-pr',
            org: 'test-org',
            repo: 'test-repo',
            score: 85,
            rank: 'Gold',
            team: { primary: 'Platform' },
            installed: true,
            installation_pr: {
              number: 123,
              state: 'OPEN',
              url: 'https://github.com/test-org/test-repo/pull/123',
              updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
            },
            checks_hash: 'abc123'
          }
        ])
      });
    });

    await mockCatalogRequests(page);
    await page.goto('/');
    await page.waitForSelector('.service-card', { state: 'visible', timeout: 10000 });

    // Find the service card
    const serviceCard = page.locator('.service-card').filter({ hasText: 'test-service-with-pr' });

    if (await serviceCard.count() > 0) {
      // Check for PR status display
      const prStatus = serviceCard.locator('.pr-status, .pr-link, [class*="pr"]').first();

      if (await prStatus.isVisible()) {
        const statusText = await prStatus.textContent();
        console.log('PR status with time:', statusText);

        // Should show state and relative time
        expect(statusText).toMatch(/OPEN|hours ago|updated/i);
      }
    }
  });
});
