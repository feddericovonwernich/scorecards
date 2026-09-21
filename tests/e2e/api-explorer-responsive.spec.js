import { test, expect } from './coverage.js';

const responseValue = 'https://example.invalid/this-is-a-long-response-value-that-must-remain-readable-without-widening-the-document/end-of-response';

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
`;

test('expanded Explorer keeps source, response and schema reachable without document overflow', async ({ page }, testInfo) => {
  await page.route(/^https:\/\//, route => {
    const url = route.request().url();
    if (url === 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css') {
      return route.fulfill({ contentType: 'text/css', path: 'node_modules/swagger-ui-dist/swagger-ui.css' });
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
  await page.locator('.models').getByRole('button', { name: '[...]', exact: true }).click();

  for (const [width, height] of [[320, 844], [360, 844], [390, 844], [430, 844], [768, 1024], [1440, 900], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await expect(page.getByRole('link', { name: 'https://raw.githubusercontent.com/fixture/api/main/openapi.yaml', exact: true })).toBeVisible();
    await expect(page.getByRole('tabpanel', { name: 'Example Value' })).toContainText(responseValue);
    await expect(page.locator('.models')).toContainText(responseValue);
    await page.getByRole('tab', { name: 'Schema', exact: true }).click();
    await expect(page.getByRole('tabpanel', { name: 'Schema', exact: true })).toContainText('message');
    await page.getByRole('tab', { name: 'Example Value', exact: true }).click();
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
    await testInfo.attach(`dimensions-${width}x${height}`, { body: JSON.stringify(dimensions), contentType: 'application/json' });
    expect(dimensions.document).toBe(dimensions.viewport);
    const contentReachable = await page.locator('.responses-inner, .models .model-box').evaluateAll(regions =>
      regions.every(region => {
        region.scrollLeft = region.scrollWidth;
        const endReached = region.scrollWidth - region.clientWidth - region.scrollLeft <= 1;
        region.scrollLeft = 0;
        return endReached;
      })
    );
    expect(contentReachable).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`explorer-${width}x${height}.png`), fullPage: true });
  }
  await model.click();
  await expect(model).toHaveAttribute('aria-expanded', 'false');
  await operation.click();
  await expect(operation).toHaveAttribute('aria-expanded', 'false');
});
