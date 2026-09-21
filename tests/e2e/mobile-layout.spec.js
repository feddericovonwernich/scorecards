import { test, expect } from './fixtures/catalog.fixture.js';
import { readFile } from 'node:fs/promises';
import { openServiceModal, openTeamModal, openCheckAdoptionDashboard } from './test-helper.js';

const sizes = [[320, 844], [360, 844], [390, 844], [430, 844], [768, 1024], [1440, 900], [844, 390]];

async function contained(modal) {
  await expect(async () => {
    const geometry = await modal.locator('.modal-content').evaluate(node => ({
      client: node.clientWidth, scroll: node.scrollWidth,
      left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right,
      viewport: innerWidth, document: document.documentElement.scrollWidth,
    }));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.client + 1);
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewport + 1);
    expect(geometry.document).toBeLessThanOrEqual(geometry.viewport + 1);
  }).toPass();
}

async function visitTabs(page, modal, names) {
  for (const name of names) {
    const button = modal.getByRole('button', { name, exact: true });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await contained(modal);
    await expect(async () => {
      const gap = await modal.evaluate(node => {
        const strip = node.querySelector('.tabs-wrapper').getBoundingClientRect();
        const panel = node.querySelector('.tab-content').getBoundingClientRect();
        return panel.top - strip.bottom;
      });
      expect(gap).toBeGreaterThanOrEqual(-1);
    }).toPass();
  }
}

for (const [width, height] of sizes) {
  test(`details and adoption remain contained at ${width}x${height}`, async ({ catalogPage: page }, testInfo) => {
    await page.setViewportSize({ width, height });
    const fixture = JSON.parse(await readFile(new URL('./fixtures/docs/results/feddericovonwernich/test-repo-perfect/results.json', import.meta.url), 'utf8'));
    fixture.service.links = [{ name: 'Service documentation', url: 'https://example.invalid/docs', description: 'Long documentation description '.repeat(12) }];
    await page.route('**/results/feddericovonwernich/test-repo-perfect/results.json*', route => route.fulfill({ json: fixture }));
    await openServiceModal(page, 'test-repo-perfect');
    const service = page.locator('#service-modal');
    await visitTabs(page, service, ['Check Results', 'API Specification', 'Links', 'Contributors', 'Workflow Runs', 'Badges']);
    await page.screenshot({ path: testInfo.outputPath('service-badges.png'), animations: 'disabled' });
    await page.keyboard.press('Escape');
    await openTeamModal(page, 'platform');
    const team = page.locator('#team-modal');
    await visitTabs(page, team, ['Services', 'Distribution', 'Check Adoption', 'GitHub']);
    await page.screenshot({ path: testInfo.outputPath('team-github.png'), animations: 'disabled' });
    await page.keyboard.press('Escape');
    await openCheckAdoptionDashboard(page);
    const adoption = page.locator('#check-adoption-modal');
    await contained(adoption);
    await expect(adoption.locator('.adoption-stat-card')).toHaveCount(4);
    const scroller = adoption.locator('.adoption-table-container');
    await scroller.focus();
    await page.keyboard.press('End');
    await scroller.evaluate(node => { node.scrollLeft = node.scrollWidth; });
    const last = await adoption.locator('thead th').last().boundingBox();
    const region = await scroller.boundingBox();
    expect(last.x + last.width).toBeLessThanOrEqual(region.x + region.width + 1);
    await page.screenshot({ path: testInfo.outputPath('adoption-last-column.png'), animations: 'disabled' });
    await page.keyboard.press('Escape');
    await expect(adoption).toBeHidden();
  });
}

test('Settings reflows at doubled root text and retains usable close target', async ({ catalogPage: page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { document.documentElement.style.fontSize = `${parseFloat(getComputedStyle(document.documentElement).fontSize) * 2}px`; });
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const settings = page.locator('#settings-modal');
  await settings.getByRole('textbox', { name: 'Personal Access Token' }).fill('isolated-not-a-token-'.repeat(20));
  await contained(settings);
  await settings.locator('.settings-rate-limit-footer').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('settings-text200.png'), animations: 'disabled' });
  const close = settings.getByRole('button', { name: 'Close modal' });
  await close.scrollIntoViewIfNeeded();
  const box = await close.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await close.click();
  await expect(settings).toBeHidden();
});

test.describe('Emulated touch targets', () => {
  test.use({ hasTouch: true, viewport: { width: 320, height: 844 } });

  test('affected controls expose unobstructed hitboxes and respond to native taps', async ({ catalogPage: page }) => {
    async function target(locator) {
      await locator.scrollIntoViewIfNeeded();
      await expect(async () => {
        const hit = await locator.evaluate(node => {
          const rect = node.getBoundingClientRect();
          const points = [[rect.x + rect.width / 2, rect.y + rect.height / 2], [rect.x + 2, rect.y + rect.height / 2], [rect.right - 2, rect.y + rect.height / 2], [rect.x + rect.width / 2, rect.y + 2], [rect.x + rect.width / 2, rect.bottom - 2]];
          return { width: rect.width, height: rect.height, clear: points.every(([x, y]) => node.contains(document.elementFromPoint(x, y))) };
        });
        expect(hit.width).toBeGreaterThanOrEqual(44);
        expect(hit.height).toBeGreaterThanOrEqual(44);
        expect(hit.clear).toBe(true);
      }).toPass();
    }
    await target(page.locator('.github-icon-link').first());
    await target(page.locator('.pr-icon-link').first());
    await page.getByRole('button', { name: 'Settings', exact: true }).tap();
    const settings = page.locator('#settings-modal');
    await target(settings.getByRole('button', { name: 'Close modal' }));
    await settings.getByRole('button', { name: 'Close modal' }).tap();
    await openServiceModal(page, 'test-repo-perfect');
    const service = page.locator('#service-modal');
    const badges = service.getByRole('button', { name: 'Badges', exact: true });
    await badges.tap();
    await target(badges);
    await target(service.locator('.copy-button').first());
    await service.getByRole('button', { name: 'Close modal' }).tap();
    await openTeamModal(page, 'platform');
    const team = page.locator('#team-modal');
    await target(team.getByRole('button', { name: 'Edit Team', exact: true }));
    await team.getByRole('button', { name: 'Edit Team', exact: true }).tap();
    await expect(page.getByRole('dialog', { name: 'PAT Required' })).toBeVisible();
    await page.getByRole('dialog', { name: 'PAT Required' }).getByRole('button', { name: 'Configure Token' }).tap();
    await expect(settings).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(settings).toHaveCount(0);
    await expect(team).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('tab', { name: 'Services', exact: true }).tap();
    await page.getByRole('button', { name: 'Check Filter', exact: true }).tap();
    const filters = page.locator('#check-filter-modal');
    const pass = filters.getByRole('button', { name: 'Must pass', exact: true }).first();
    await target(pass);
    await pass.tap();
    await expect(page.locator('.check-filter-toggle')).toContainText('(1)');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Show GitHub Actions' }).tap();
    await target(page.getByRole('button', { name: 'Close widget' }));
    await target(page.getByRole('button', { name: 'Refresh now' }));
    await page.getByRole('button', { name: 'Close widget' }).tap();
  });
});
