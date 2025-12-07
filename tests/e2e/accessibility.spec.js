import { test, expect } from './coverage.js';
import AxeBuilder from '@axe-core/playwright';
import { mockCatalogRequests, waitForCatalogLoad } from './test-helper.js';

test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await mockCatalogRequests(page);
        await page.goto('/');
        await waitForCatalogLoad(page);
    });

    test('dashboard and page sections have no critical violations', async ({ page }) => {
        // Dashboard
        const dashboardResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        const critical = dashboardResults.violations.filter(v => v.impact === 'critical');
        expect(critical).toHaveLength(0);

        // Header
        await page.waitForSelector('header');
        const headerResults = await new AxeBuilder({ page }).include('header').withTags(['wcag2a', 'wcag2aa']).analyze();
        expect(headerResults.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0);

        // Controls
        await page.waitForSelector('.controls');
        const controlsResults = await new AxeBuilder({ page }).include('.controls').analyze();
        expect(controlsResults.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0);

        // Stat cards
        await page.waitForSelector('.services-stats');
        const statsResults = await new AxeBuilder({ page }).include('.services-stats').analyze();
        expect(statsResults.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0);
    });

    test('modals are accessible', async ({ page }) => {
        // Service modal
        await page.click('.service-card');
        await page.waitForSelector('#service-modal', { state: 'visible' });

        const serviceResults = await new AxeBuilder({ page })
            .include('#service-modal')
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        expect(serviceResults.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0);

        await page.keyboard.press('Escape');
        await expect(page.locator('#service-modal')).toBeHidden();

        // Settings modal
        await page.getByRole('button', { name: 'Settings' }).click();
        await page.waitForSelector('#settings-modal', { state: 'visible' });

        const settingsResults = await new AxeBuilder({ page })
            .include('#settings-modal')
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        expect(settingsResults.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0);
    });

    test('keyboard navigation works for interactive elements', async ({ page }) => {
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedElement).not.toBe('BODY');

        for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Tab');
        }

        const focusedAfterTabs = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedAfterTabs).toBeDefined();
    });
});
