import { test, expect } from './coverage.js';

const responseValue = 'https://example.invalid/this-is-a-long-response-value-that-must-remain-readable-without-widening-the-document/end-of-response';
const identifier = 'a'.repeat(128);

// YAML exercises Swagger's source URL as well as its response and model renderers.
const spec = `openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /test:
    get:
      summary: Test endpoint
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TestResponse'
components:
  schemas:
    TestResponse:
      type: object
      properties:
        message:
          type: string
          example: ${responseValue}
        identifier:
          type: string
          example: ${identifier}
`;

test('expanded Explorer keeps source, response and schema reachable without document overflow', async ({ page }, testInfo) => {
  await page.route(/^https:\/\//, route => {
    const url = route.request().url();
    if (url === 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css') {
      return route.fulfill({ contentType: 'text/css', path: 'tests/e2e/fixtures/swagger-ui-5.11.0.css' });
    }
    if (new URL(url).pathname.endsWith('/catalog/results/fixture/api/results.json')) {
      return route.fulfill({ json: { service: { name: 'Fixture API', openapi: { spec_file: 'openapi.yaml', branch: 'main' } } } });
    }
    if (url === 'https://raw.githubusercontent.com/fixture/api/main/openapi.yaml') {
      return route.fulfill({ contentType: 'application/yaml', body: spec });
    }
    return route.abort();
  });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('api-explorer.html?org=fixture&repo=api&catalog_owner=fixture');
  const operation = page.getByRole('button', { name: 'GET /test Test endpoint', exact: true });
  await operation.click();
  const model = page.locator('.models').getByRole('button', { name: 'TestResponse', exact: true });
  await model.click();
  for (const property of ['message', 'identifier']) {
    await page.locator('.models').getByRole('row', { name: `${property} [...]`, exact: true })
      .getByRole('button', { name: '[...]', exact: true }).click();
  }

  for (const [width, height] of [[320, 844], [360, 844], [390, 844], [430, 844], [768, 1024], [1440, 900], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await expect(page.getByRole('link', { name: 'https://raw.githubusercontent.com/fixture/api/main/openapi.yaml', exact: true })).toBeVisible();
    await expect(page.getByRole('tabpanel', { name: 'Example Value' })).toContainText(responseValue);
    await expect(page.getByRole('tabpanel', { name: 'Example Value' })).toContainText(identifier);
    await expect(page.locator('.models')).toContainText(responseValue);
    await expect(page.locator('.models')).toContainText(identifier);
    for (const tab of ['Schema', 'Example Value']) {
      await page.getByRole('tab', { name: tab, exact: true }).click();
      await expect(page.getByRole('tabpanel', { name: tab, exact: true })).toContainText('message');
      const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
      await testInfo.attach(`dimensions-${tab}-${width}x${height}`, { body: JSON.stringify(dimensions), contentType: 'application/json' });
      expect(dimensions.document).toBe(dimensions.viewport);
      const regions = await page.locator('.responses-inner:visible, .model-box:visible').evaluateAll(elements =>
        elements.map(region => {
          region.scrollLeft = region.scrollWidth;
          const measurements = {
            width: region.clientWidth,
            content: region.scrollWidth,
            endReached: region.scrollWidth - region.clientWidth - region.scrollLeft <= 1,
          };
          region.scrollLeft = 0;
          return measurements;
        })
      );
      await testInfo.attach(`scroll-regions-${tab}-${width}x${height}`, { body: JSON.stringify(regions), contentType: 'application/json' });
      expect(regions.every(region => region.endReached)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`explorer-${tab}-${width}x${height}.png`), fullPage: true });
    }
  }
  await model.click();
  await expect(model).toHaveAttribute('aria-expanded', 'false');
  await operation.click();
  await expect(operation).toHaveAttribute('aria-expanded', 'false');
});
