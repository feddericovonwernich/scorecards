import { test, expect } from './coverage.js';
import AxeBuilder from '@axe-core/playwright';
import { mockCatalogRequests, waitForCatalogLoad, mockWorkflowRuns, mockWorkflowDispatch } from './test-helper.js';
import { openServiceModal, openTeamModal } from './test-helper.js';
import { mockPAT } from './fixtures.js';

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

    test('Settings entries share one dialog and preserve nested context', async ({ page }) => {
        await openServiceModal(page, 'test-repo-perfect');
        const service = page.locator('#service-modal');
        await service.getByRole('button', { name: 'Workflow Runs', exact: true }).click();
        const configure = service.getByRole('button', { name: 'Configure Token' });
        await configure.click();
        const settings = page.getByRole('dialog', { name: 'Settings', exact: true });
        await expect(settings).toHaveCount(1);
        await expect(settings).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(settings).toHaveCount(0);
        await expect(configure).toBeFocused();
        await expect(service).toBeVisible();
        await page.keyboard.press('Escape');

        await openTeamModal(page, 'platform');
        const team = page.locator('#team-modal');
        await team.getByRole('button', { name: 'GitHub', exact: true }).click();
        const signIn = team.getByRole('button', { name: 'Sign in to view team members' });
        await signIn.click();
        await expect(settings).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(signIn).toBeFocused();
        await page.keyboard.press('Escape');

        await page.getByRole('button', { name: 'Show GitHub Actions' }).click();
        await page.locator('.widget-sidebar').getByRole('button', { name: 'Configure Token' }).click();
        await expect(settings).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(settings).toHaveCount(0);
        await expect(page.getByRole('tab', { name: 'Teams', exact: true })).toBeFocused();
    });

    test('Settings restores focus when authentication removes the nested opener', async ({ page }) => {
        await mockWorkflowRuns(page);
        await openServiceModal(page, 'test-repo-perfect');
        const service = page.locator('#service-modal');
        await service.getByRole('button', { name: 'Workflow Runs', exact: true }).click();
        const configure = service.getByRole('button', { name: 'Configure Token' });
        await configure.click();
        const settings = page.getByRole('dialog', { name: 'Settings', exact: true });
        await settings.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
        await settings.getByRole('button', { name: 'Save Token' }).click();
        await expect(settings.getByRole('heading', { name: 'GitHub API Mode' })).toBeVisible();
        await expect(configure).toHaveCount(0);
        expect(await settings.evaluate(node => node.contains(document.activeElement))).toBe(true);
        await page.keyboard.press('Escape');
        await expect(settings).toHaveCount(0);
        expect(await service.evaluate(node => node.contains(document.activeElement))).toBe(true);
        await page.keyboard.press('Tab');
        expect(await service.evaluate(node => node.contains(document.activeElement))).toBe(true);
        await page.keyboard.press('Escape');
        await expect(service).toHaveCount(0);
        await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
    });

    test('service workflow feedback remains visible inside the active dialog', async ({ page }) => {
        await openServiceModal(page, 'test-repo-stale');
        const service = page.locator('#service-modal');
        await service.getByRole('button', { name: 'Run Scorecard', exact: true }).click();
        await expect(service.getByRole('alert')).toContainText(/token required/i);
        await service.getByRole('button', { name: 'Workflow Runs', exact: true }).click();
        await service.getByRole('button', { name: 'Configure Token' }).click();
        const settings = page.getByRole('dialog', { name: 'Settings', exact: true });
        await mockWorkflowRuns(page);
        await settings.getByRole('textbox', { name: 'Personal Access Token' }).fill(mockPAT);
        await settings.getByRole('button', { name: 'Save Token' }).click();
        await expect(settings.getByRole('heading', { name: 'GitHub API Mode' })).toBeVisible();
        await page.keyboard.press('Escape');
        await mockWorkflowDispatch(page, { status: 403 });
        await service.getByRole('button', { name: 'Run Scorecard', exact: true }).click();
        await expect(service.getByRole('alert')).toContainText(/failed/i);
        await mockWorkflowDispatch(page);
        await service.getByRole('button', { name: 'Run Scorecard', exact: true }).click();
        await expect(service.getByRole('status')).toContainText(/triggered successfully/i);
        await expect(service.getByRole('alert')).toHaveCount(0);
    });

    test('workflow entry without a token opens Settings without dispatching', async ({ page }) => {
        const writes = [];
        page.on('request', request => {
            if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
                writes.push(request.url());
            }
        });
        await page.locator('.service-card').getByRole('button', { name: 'Re-run scorecard workflow' }).first().click();
        await expect(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
        expect(writes).toEqual([]);
    });

    test('backdrop closes only gestures that start and end outside dialog content', async ({ page }) => {
        const opener = page.getByRole('button', { name: 'Settings', exact: true });
        const originalOverflow = await page.evaluate(() => document.body.style.overflow);
        await opener.click();
        const dialog = page.getByRole('dialog', { name: 'Settings', exact: true });
        const heading = dialog.getByRole('heading', { name: 'Settings', exact: true });
        await heading.click();
        await expect(dialog).toBeVisible();
        await page.mouse.down();
        await page.mouse.move(1, 1);
        await page.mouse.up();
        await expect(dialog).toBeVisible();
        const headingBox = await heading.boundingBox();
        await page.mouse.move(1, 1);
        await page.mouse.down();
        await page.mouse.move(headingBox.x + headingBox.width / 2, headingBox.y + headingBox.height / 2);
        await page.mouse.up();
        await expect(dialog).toBeVisible();
        const token = dialog.getByRole('textbox', { name: 'Personal Access Token' });
        await token.click();
        await expect(token).toBeFocused();
        await expect(dialog).toBeVisible();
        await page.mouse.click(1, 1);
        await expect(dialog).toBeHidden();
        await expect(opener).toBeFocused();
        await opener.click();
        await dialog.getByRole('button', { name: 'Close modal' }).click();
        await expect(dialog).toBeHidden();
        expect(await page.evaluate(() => document.body.style.overflow)).toBe(originalOverflow);
    });

    test('native modal contains keyboard focus and restores its opener', async ({ page }) => {
        const opener = page.getByRole('button', { name: 'Settings', exact: true });
        await opener.focus();
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('dialog', { name: 'Settings', exact: true });
        await expect(dialog).toBeVisible();
        await expect.poll(() => dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
        const close = dialog.getByRole('button', { name: 'Close modal' });
        await close.focus();
        await page.keyboard.press('Shift+Tab');
        // Chromium may visit browser chrome at the native dialog boundary;
        // it must never visit an interactive element in the inert document.
        if (await page.evaluate(() => document.activeElement === document.body)) {
            await page.keyboard.press('Shift+Tab');
        }
        await expect.poll(() => dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
        await page.keyboard.press('Tab');
        if (await page.evaluate(() => document.activeElement === document.body)) {
            await page.keyboard.press('Tab');
        }
        await expect(close).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(opener).toBeFocused();
        await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
    });
});
