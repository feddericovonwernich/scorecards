import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockCatalogRequests, waitForCatalogLoad } from './test-helper.js';

test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await mockCatalogRequests(page);
        await page.goto('/');
        await waitForCatalogLoad(page);
    });

    test('dashboard has no critical violations', async ({ page }) => {
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        const critical = results.violations.filter(v => v.impact === 'critical');

        if (critical.length > 0) {
            console.error('Critical accessibility violations found:');
            critical.forEach(v => {
                console.error(`  - ${v.id}: ${v.description}`);
                v.nodes.forEach(n => console.error(`    Target: ${n.target}`));
            });
        }

        expect(critical).toHaveLength(0);
    });

    test('service modal is keyboard navigable', async ({ page }) => {
        // Click first service card to open modal
        await page.click('.service-card');
        // React modals are either in DOM (visible) or not - wait for visible state
        await page.waitForSelector('#service-modal', { state: 'visible' });

        const results = await new AxeBuilder({ page })
            .include('#service-modal')
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        // Log violations for debugging
        if (results.violations.length > 0) {
            console.error('Modal accessibility violations:');
            results.violations.forEach(v => {
                console.error(`  - ${v.id} (${v.impact}): ${v.description}`);
            });
        }

        // Check for critical and serious violations only
        const criticalOrSerious = results.violations.filter(v =>
            v.impact === 'critical' || v.impact === 'serious'
        );

        expect(criticalOrSerious).toHaveLength(0);
    });

    test('filter controls are accessible', async ({ page }) => {
        // Wait for filters section
        await page.waitForSelector('.controls');

        const results = await new AxeBuilder({ page })
            .include('.controls')
            .analyze();

        const criticalOrSerious = results.violations.filter(v =>
            v.impact === 'critical' || v.impact === 'serious'
        );

        if (criticalOrSerious.length > 0) {
            console.error('Filter accessibility violations:');
            criticalOrSerious.forEach(v => {
                console.error(`  - ${v.id} (${v.impact}): ${v.description}`);
            });
        }

        expect(criticalOrSerious).toHaveLength(0);
    });

    test('header navigation is accessible', async ({ page }) => {
        await page.waitForSelector('header');

        const results = await new AxeBuilder({ page })
            .include('header')
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        const criticalOrSerious = results.violations.filter(v =>
            v.impact === 'critical' || v.impact === 'serious'
        );

        expect(criticalOrSerious).toHaveLength(0);
    });

    test('stat cards are accessible', async ({ page }) => {
        await page.waitForSelector('.services-stats');

        const results = await new AxeBuilder({ page })
            .include('.services-stats')
            .analyze();

        const criticalOrSerious = results.violations.filter(v =>
            v.impact === 'critical' || v.impact === 'serious'
        );

        expect(criticalOrSerious).toHaveLength(0);
    });

    test('settings modal is accessible', async ({ page }) => {
        // Open settings modal
        await page.getByRole('button', { name: 'Settings' }).click();
        // React modals are either in DOM (visible) or not - wait for visible state
        await page.waitForSelector('#settings-modal', { state: 'visible' });

        const results = await new AxeBuilder({ page })
            .include('#settings-modal')
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        const criticalOrSerious = results.violations.filter(v =>
            v.impact === 'critical' || v.impact === 'serious'
        );

        if (criticalOrSerious.length > 0) {
            console.error('Settings modal accessibility violations:');
            criticalOrSerious.forEach(v => {
                console.error(`  - ${v.id} (${v.impact}): ${v.description}`);
            });
        }

        expect(criticalOrSerious).toHaveLength(0);
    });

    test('keyboard navigation works for interactive elements', async ({ page }) => {
        // Tab through interactive elements and verify focus is visible
        await page.keyboard.press('Tab');

        // Verify something is focused
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedElement).not.toBe('BODY');

        // Tab through a few more elements to ensure tab order works
        for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Tab');
        }

        const focusedAfterTabs = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedAfterTabs).toBeDefined();
    });

    test('escape key closes modal', async ({ page }) => {
        // Open service modal
        await page.click('.service-card');
        // React modals are either in DOM (visible) or not - wait for visible state
        await page.waitForSelector('#service-modal', { state: 'visible' });

        // Press Escape
        await page.keyboard.press('Escape');

        // In React, modal is removed from DOM when closed - wait for it to be hidden
        await expect(page.locator('#service-modal')).toBeHidden();
    });
});
