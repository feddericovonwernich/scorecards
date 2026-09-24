import { test, expect } from './coverage.js';
import { mockCatalogRequests, waitForCatalogLoad, switchToTeamsView } from './test-helper.js';

const explorerService = {
  service: {
    name: 'Fixture API',
    openapi: {
      spec_file: 'openapi.yaml',
      branch: 'main',
    },
  },
};

async function mockExplorerRequests(page, service = explorerService) {
  await mockCatalogRequests(page);

  await page.route('https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/css',
      path: 'node_modules/swagger-ui-dist/swagger-ui.css',
    })
  );

  await page.route('https://raw.githubusercontent.com/**', (route) => {
    const url = new URL(route.request().url());

    if (url.pathname.endsWith('/catalog/results/fixture/api/results.json')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(service),
      });
    }

    if (url.pathname.endsWith('/fixture/api/main/openapi.yaml')) {
      if (route.request().method() === 'HEAD') {
        return route.fulfill({ status: 200 });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/yaml',
        path: 'tests/fixtures/openapi/valid-spec.yaml',
      });
    }

    return route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'No isolated Explorer fixture for this request' }),
    });
  });
}

test.describe('Static catalog delivery', () => {
  for (const prefix of ['/', '/scorecards/']) {
    test(`renders the compiled catalog at Pages prefix ${prefix}`, async ({ page }, testInfo) => {
      await mockCatalogRequests(page);
      await page.route('**/assets/**', (route) =>
        new URL(route.request().url()).pathname.startsWith(`${prefix}assets/`)
          ? route.continue()
          : route.abort()
      );
      await page.goto(prefix);
      await waitForCatalogLoad(page);
      await switchToTeamsView(page);
      await page.screenshot({ path: testInfo.outputPath('pages-prefix.png'), fullPage: true });
    });
  }

  test('redirects legacy directory URLs while retaining query parameters', async ({ page }) => {
    const [servicesEntry, teamsEntry] = await Promise.all([
      page.request.get('/scorecards/services/'),
      page.request.get('/scorecards/teams/'),
    ]);
    expect(servicesEntry.status()).toBe(200);
    expect(teamsEntry.status()).toBe(200);
    const [servicesHtml, teamsHtml] = await Promise.all([servicesEntry.text(), teamsEntry.text()]);
    expect(servicesHtml).toContain('href="../#/services"');
    expect(teamsHtml).toContain('href="../#/teams"');

    for (const [legacyPath, canonicalHash] of [
      ['/scorecards/services', '/services'],
      ['/scorecards/services/', '/services'],
      ['/scorecards/teams', '/teams'],
      ['/scorecards/teams/', '/teams'],
    ]) {
      await page.goto(legacyPath);
      await expect(page).toHaveURL(new RegExp(`/scorecards/#${canonicalHash}$`));
    }

    await page.goto('/scorecards/services/?filter=gold');
    await expect(page).toHaveURL(/\/scorecards\/\?filter=gold#\/services$/);

    await page.goto('/scorecards/teams/?filter=platform');
    await expect(page).toHaveURL(/\/scorecards\/\?filter=platform#\/teams$/);
  });

  test('keeps missing static resources as 404 responses', async ({ page }) => {
    const response = await page.request.get('/scorecards/not-a-static-resource.js');
    expect(response.status()).toBe(404);
  });

  test('loads the compiled Explorer and exposes a mocked operation schema', async ({
    page,
  }, testInfo) => {
    await mockExplorerRequests(page);

    const compiledAssets = [];
    const sourceRequests = [];
    page.on('request', (request) => {
      const pathname = new URL(request.url()).pathname;
      if (pathname.includes('/src/') || pathname.endsWith('/css/base/variables.css')) {
        sourceRequests.push(pathname);
      }
    });
    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.pathname.startsWith('/scorecards/assets/')) {
        compiledAssets.push({
          contentType: response.headers()['content-type'] || '',
          status: response.status(),
        });
      }
    });

    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/scorecards/api-explorer.html?org=fixture&repo=api&catalog_owner=fixture');
    await expect(page.getByRole('heading', { name: 'Fixture API' })).toBeVisible();

    expect(compiledAssets.some((asset) => asset.contentType.includes('javascript'))).toBe(true);
    expect(compiledAssets.some((asset) => asset.contentType.includes('text/css'))).toBe(true);
    expect(compiledAssets.every((asset) => asset.status === 200)).toBe(true);

    const operation = page.locator('.swagger-ui .opblock').filter({ hasText: 'Test endpoint' });
    expect(sourceRequests).toEqual([]);
    await expect(operation).toBeVisible();
    await operation.getByRole('button', { name: 'GET /test Test endpoint', exact: true }).click();
    await expect(operation).toContainText('200');

    const model = page
      .locator('.swagger-ui .models')
      .getByRole('button', { name: 'TestResponse', exact: true });
    await expect(model).toBeVisible();
    await model.click();
    await expect(page.locator('.swagger-ui .models')).toContainText('message');
    expect(pageErrors).toEqual([]);
    const measurements = [];
    for (const [width, height] of [
      [320, 844],
      [360, 844],
      [390, 844],
      [430, 844],
      [768, 1024],
      [1440, 900],
      [844, 390],
    ]) {
      await page.setViewportSize({ width, height });
      measurements.push(
        await page.evaluate(() => ({
          viewport: [innerWidth, innerHeight],
          documentWidth: document.documentElement.scrollWidth,
          url: location.href,
        }))
      );
      await page.screenshot({
        path: testInfo.outputPath(`explorer-${width}x${height}.png`),
        fullPage: true,
      });
    }
    await testInfo.attach('Explorer viewport measurements', {
      body: JSON.stringify(measurements, null, 2),
      contentType: 'application/json',
    });
  });

  test('shows Explorer error states from isolated responses', async ({ page }) => {
    await mockExplorerRequests(page);
    await page.goto('/scorecards/api-explorer.html');
    await expect(page.getByRole('heading', { name: 'Failed to Load API' })).toBeVisible();
    await expect(
      page.getByText('Missing parameters. Please specify org and repo in the URL.')
    ).toBeVisible();

    await page.goto('/scorecards/api-explorer.html?org=missing&repo=service&catalog_owner=fixture');
    await expect(page.getByText('Service not found or results not available (404)')).toBeVisible();

    await mockExplorerRequests(page, { service: { name: 'No OpenAPI' } });
    await page.goto('/scorecards/api-explorer.html?org=fixture&repo=api&catalog_owner=fixture');
    await expect(page.getByText('This service does not have OpenAPI configuration')).toBeVisible();
  });
});
