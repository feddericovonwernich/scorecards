import { readFile } from 'fs/promises';

import { Buffer } from 'buffer';

import { test, expect } from './coverage.js';
import { mockPAT } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  setGitHubPAT,
  openServiceModal,
  closeServiceModal,
} from './test-helper.js';

const service = 'feddericovonwernich/test-repo-stale';
const requestId = '00000000-0000-4000-8000-000000000001';

const evaluation = {
  service_repository: service,
  service_sha: '1'.repeat(40),
  suite_repository: 'feddericovonwernich/scorecards',
  suite_sha: '2'.repeat(40),
  run_id: '123',
  run_attempt: 1,
};
const fixturePath = new URL(
  './fixtures/docs/results/feddericovonwernich/test-repo-stale/results.json',
  import.meta.url
);
const policyContent = Buffer.from(
  JSON.stringify({
    targets: {
      [service]: { publisher_login: 'scorecard-bot' },
    },
  })
).toString('base64');

async function mockRemediationResult(page, { evaluation: source = evaluation } = {}) {
  await page.route(
    `**/raw.githubusercontent.com/**/results/${service}/results.json*`,
    async (route) => {
      const result = JSON.parse(await readFile(fixturePath, 'utf8'));
      const check = result.checks.find(({ check_id }) => check_id === '04-tests');
      check.remediation = { version: 1, label: 'Propose test coverage' };
      if (source) {
        result.evaluation = source;
      } else {
        delete result.evaluation;
      }
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(result) });
    }
  );
}

async function mockRemediationApi(
  page,
  {
    dispatch = {
      status: 200,
      body: {
        workflow_run_id: 42,
        run_url: 'https://api.github.com/repos/FeddericoVonWernich/Scorecards/actions/runs/42',
        html_url: 'https://github.com/FeddericoVonWernich/Scorecards/actions/runs/42',
      },
    },
    runs = [],
  } = {}
) {
  await page.route('**/api.github.com/repos/feddericovonwernich/scorecards', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ default_branch: 'trunk' }),
    })
  );
  await page.route('**/api.github.com/repos/feddericovonwernich/test-repo-stale', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ default_branch: 'trunk' }),
    })
  );
  await page.route(
    '**/api.github.com/repos/feddericovonwernich/scorecards/actions/workflows/remediate-check.yml',
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 123, path: '.github/workflows/remediate-check.yml' }),
      })
  );
  await page.route(
    '**/api.github.com/repos/feddericovonwernich/scorecards/actions/workflows/remediate-check.yml/dispatches',
    (route) =>
      route.fulfill({
        status: dispatch.status,
        contentType: 'application/json',
        body: dispatch.status === 204 ? '' : JSON.stringify(dispatch.body),
      })
  );
  await page.route(
    '**/api.github.com/repos/feddericovonwernich/scorecards/contents/action/config/remediation.json*',
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ encoding: 'base64', content: policyContent }),
      })
  );
  await page.route(
    /\/api\.github\.com\/repos\/feddericovonwernich\/scorecards\/actions\/(?:workflows\/remediate-check\.yml\/)?runs(?:\/\d+)?(?:\?.*)?$/,
    (route) => {
      const url = new URL(route.request().url());
      if (/\/actions\/runs\/\d+$/.test(url.pathname)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 42,
            workflow_id: 123,
            event: 'workflow_dispatch',
            display_title: `remediation:${requestId}`,
            head_sha: '3'.repeat(40),
            html_url: 'https://github.com/FeddericoVonWernich/Scorecards/actions/runs/42',
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ workflow_runs: runs, total_count: runs.length }),
      });
    }
  );
  await page.route('**/api.github.com/repos/feddericovonwernich/test-repo-stale/pulls*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );
}

test.describe('Optional check remediation', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await mockRemediationResult(page);
    await page.addInitScript(() =>
      Object.defineProperty(crypto, 'randomUUID', {
        configurable: true,
        value: () => '00000000-0000-4000-8000-000000000001',
      })
    );
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('keeps legacy and stale-provenance failures read-only', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    const modal = page.locator('#service-modal');
    await expect(modal.getByRole('button', { name: 'Propose test coverage' })).toHaveCount(0);
    await closeServiceModal(page);

    await mockRemediationResult(page, {
      evaluation: { ...evaluation, service_repository: 'other/repository' },
    });
    await openServiceModal(page, 'test-repo-stale');
    await expect(modal.getByText('No tests found')).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Propose test coverage' })).toHaveCount(0);

    await closeServiceModal(page);
    await mockRemediationResult(page, {
      evaluation: { ...evaluation, suite_repository: 'other/suite' },
    });
    await openServiceModal(page, 'test-repo-stale');
    await expect(modal.getByText('No tests found')).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Propose test coverage' })).toHaveCount(0);
  });

  test('uses the central default branch and exactly six remediation inputs for a 200 receipt', async ({
    page,
  }) => {
    await setGitHubPAT(page, mockPAT);
    await mockRemediationApi(page);
    let request;
    await page.route(
      '**/api.github.com/repos/feddericovonwernich/scorecards/actions/workflows/remediate-check.yml/dispatches',
      async (route) => {
        request = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            workflow_run_id: 42,
            run_url: 'https://api.github.com/repos/FeddericoVonWernich/Scorecards/actions/runs/42',
            html_url: 'https://github.com/FeddericoVonWernich/Scorecards/actions/runs/42',
          }),
        });
      }
    );

    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(
      page.locator('#service-modal').getByRole('link', { name: 'View remediation run' })
    ).toHaveAttribute('href', /actions\/runs\/42$/);
    expect(request).toEqual({
      ref: 'trunk',
      inputs: {
        org: 'feddericovonwernich',
        repo: 'test-repo-stale',
        check_id: '04-tests',
        service_sha: '1'.repeat(40),
        suite_sha: '2'.repeat(40),
        request_id: requestId,
      },
    });
  });

  test('links a canonical-case attributable reused pull request from an earlier run', async ({
    page,
  }) => {
    await setGitHubPAT(page, mockPAT);
    await mockRemediationApi(page);
    await page.route(
      '**/api.github.com/repos/feddericovonwernich/test-repo-stale/pulls*',
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              number: 7,
              html_url: 'https://github.com/FeddericoVonWernich/Test-Repo-Stale/pull/7',
              body: '<!-- scorecards-remediation:v1 check_id=04-tests -->',
              base: { ref: 'trunk' },
              head: {
                ref: 'scorecards-remediation/04-tests/17-1',
                repo: { full_name: 'Feddericovonwernich/Test-Repo-Stale' },
              },
              user: { login: 'scorecard-bot' },
            },
          ]),
        })
    );

    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(
      page.locator('#service-modal').getByRole('link', { name: 'View pull request #7' })
    ).toHaveAttribute('href', /pull\/7$/);
  });

  for (const exhausted of [false, true]) {
    test(`only links a PR when bounded pagination is exhausted: ${exhausted}`, async ({ page }) => {
      await setGitHubPAT(page, mockPAT);
      await mockRemediationApi(page);
      const pages = [];
      await page.route(
        '**/api.github.com/repos/feddericovonwernich/test-repo-stale/pulls*',
        (route) => {
          const pageNumber = Number(new URL(route.request().url()).searchParams.get('page'));
          pages.push(pageNumber);
          const pulls = Array.from({ length: exhausted && pageNumber === 5 ? 99 : 100 }, () => ({
            body: '',
            base: { ref: 'trunk' },
          }));
          if (pageNumber === 1 || pageNumber === 6) {
            pulls[0] = {
              number: pageNumber === 1 ? 7 : 8,
              html_url: `https://github.com/FeddericoVonWernich/Test-Repo-Stale/pull/${pageNumber === 1 ? 7 : 8}`,
              body: '<!-- scorecards-remediation:v1 check_id=04-tests -->',
              base: { ref: 'trunk' },
              head: {
                ref: `scorecards-remediation/04-tests/${pageNumber}-1`,
                repo: { full_name: service },
              },
              user: { login: 'scorecard-bot' },
            };
          }
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(pulls),
          });
        }
      );

      await openServiceModal(page, 'test-repo-stale');
      await page.getByRole('button', { name: 'Propose test coverage' }).click();
      const modal = page.locator('#service-modal');
      await expect(modal.getByRole('button', { name: 'Requested', exact: true })).toBeVisible();
      await expect(modal.getByRole('link', { name: 'View remediation run' })).toHaveAttribute(
        'href',
        'https://github.com/FeddericoVonWernich/Scorecards/actions/runs/42'
      );
      if (exhausted) {
        await expect(modal.getByRole('link', { name: 'View pull request #7' })).toBeVisible();
      } else {
        await expect(modal.getByRole('link', { name: /View pull request/ })).toHaveCount(0);
        await expect(modal.getByRole('status')).toContainText('run summary');
      }
      expect(pages).toEqual([1, 2, 3, 4, 5]);
    });
  }

  for (const [field, url] of [
    ['run_url', 'https://api.github.com/Repos/FeddericoVonWernich/Scorecards/actions/runs/42'],
    ['run_url', 'https://api.github.com/repos/FeddericoVonWernich/Scorecards/actions/runs/43'],
    ['run_url', 'https://api.github.com/repos/other/Scorecards/actions/runs/42'],
    ['html_url', 'https://github.com/FeddericoVonWernich/Scorecards/Actions/runs/42'],
    ['html_url', 'https://github.com.evil.invalid/FeddericoVonWernich/Scorecards/actions/runs/42'],
    ['html_url', 'https://github.com/FeddericoVonWernich/Scorecards/actions/runs/42?other=1'],
  ]) {
    test(`rejects a mismatched receipt URL: ${url}`, async ({ page }) => {
      await setGitHubPAT(page, mockPAT);
      await mockRemediationApi(page, {
        dispatch: {
          status: 200,
          body: {
            workflow_run_id: 42,
            run_url: 'https://api.github.com/repos/FeddericoVonWernich/Scorecards/actions/runs/42',
            html_url: 'https://github.com/FeddericoVonWernich/Scorecards/actions/runs/42',
            [field]: url,
          },
        },
      });
      await openServiceModal(page, 'test-repo-stale');
      await page.getByRole('button', { name: 'Propose test coverage' }).click();
      const modal = page.locator('#service-modal');
      await expect(
        modal.getByRole('button', { name: 'Request failed', exact: true })
      ).toBeVisible();
      await expect(modal.getByRole('link', { name: 'View remediation run' })).toHaveCount(0);
    });
  }

  test('accepts 204 only after correlating the matching workflow run, never the newest unrelated run', async ({
    page,
  }) => {
    await setGitHubPAT(page, mockPAT);
    await mockRemediationApi(page, {
      dispatch: { status: 204 },
      runs: [
        {
          id: 99,
          workflow_id: 123,
          event: 'workflow_dispatch',
          display_title: 'remediation:someone-else',
          created_at: new Date().toISOString(),
          html_url: 'https://github.com/feddericovonwernich/scorecards/actions/runs/99',
        },
        {
          id: 42,
          workflow_id: 123,
          event: 'workflow_dispatch',
          display_title: `remediation:${requestId}`,
          created_at: new Date().toISOString(),
          html_url: 'https://github.com/FeddericoVonWernich/Scorecards/actions/runs/42',
        },
      ],
    });

    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(
      page.locator('#service-modal').getByRole('link', { name: 'View remediation run' })
    ).toHaveAttribute('href', /actions\/runs\/42$/);
  });

  test('polls for a late correlated run without dispatching again', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);
    await mockRemediationApi(page, { dispatch: { status: 204 } });
    let polls = 0;
    await page.route(
      '**/api.github.com/repos/feddericovonwernich/scorecards/actions/workflows/remediate-check.yml/runs*',
      (route) => {
        polls += 1;
        const workflow_runs =
          polls === 1
            ? []
            : [
                {
                  id: 42,
                  workflow_id: 123,
                  event: 'workflow_dispatch',
                  display_title: `remediation:${requestId}`,
                  created_at: new Date().toISOString(),
                  html_url: 'https://github.com/feddericovonwernich/scorecards/actions/runs/42',
                },
              ];
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ workflow_runs, total_count: workflow_runs.length }),
        });
      }
    );

    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(
      page.locator('#service-modal').getByRole('link', { name: 'View remediation run' })
    ).toHaveAttribute('href', /actions\/runs\/42$/, { timeout: 7000 });
    expect(polls).toBe(2);
  });

  for (const status of [200, 204]) {
    for (const failure of ['transport', 'json']) {
      test(`keeps ${status} dispatch accepted after ${failure} run discovery failure`, async ({
        page,
      }) => {
        await setGitHubPAT(page, mockPAT);
        await mockRemediationApi(page, status === 204 ? { dispatch: { status } } : {});
        let dispatches = 0;
        page.on('request', (request) => {
          if (request.method() === 'POST' && request.url().endsWith('/dispatches')) {
            dispatches += 1;
          }
        });
        const endpoint =
          status === 200
            ? '**/api.github.com/repos/feddericovonwernich/scorecards/actions/runs/42'
            : '**/api.github.com/repos/feddericovonwernich/scorecards/actions/workflows/remediate-check.yml/runs*';
        await page.route(endpoint, (route) =>
          failure === 'transport'
            ? route.abort('failed')
            : route.fulfill({ status: 200, contentType: 'application/json', body: '{' })
        );

        await openServiceModal(page, 'test-repo-stale');
        await page.getByRole('button', { name: 'Propose test coverage' }).click();
        const modal = page.locator('#service-modal');
        await expect(modal.getByRole('button', { name: 'Requested', exact: true })).toBeVisible();
        await expect(modal.getByRole('status')).toContainText('Dispatch accepted');
        await expect(modal.getByRole('alert')).toHaveCount(0);
        await expect(modal.getByRole('link', { name: 'View remediation run' })).toHaveCount(0);
        expect(dispatches).toBe(1);
      });
    }
  }

  for (const failure of ['policy transport', 'pull request json']) {
    test(`preserves the accepted run link after optional ${failure} failure`, async ({ page }) => {
      await setGitHubPAT(page, mockPAT);
      await mockRemediationApi(page);
      let dispatches = 0;
      page.on('request', (request) => {
        if (request.method() === 'POST' && request.url().endsWith('/dispatches')) {
          dispatches += 1;
        }
      });
      if (failure === 'policy transport') {
        await page.route(
          '**/api.github.com/repos/feddericovonwernich/scorecards/contents/action/config/remediation.json*',
          (route) => route.abort('failed')
        );
      } else {
        await page.route(
          '**/api.github.com/repos/feddericovonwernich/test-repo-stale/pulls*',
          (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{' })
        );
      }

      await openServiceModal(page, 'test-repo-stale');
      await page.getByRole('button', { name: 'Propose test coverage' }).click();
      const modal = page.locator('#service-modal');
      await expect(modal.getByRole('button', { name: 'Requested', exact: true })).toBeVisible();
      await expect(modal.getByRole('link', { name: 'View remediation run' })).toHaveAttribute(
        'href',
        'https://github.com/FeddericoVonWernich/Scorecards/actions/runs/42'
      );
      await expect(modal.getByRole('link', { name: /View pull request/ })).toHaveCount(0);
      await expect(modal.getByRole('alert')).toHaveCount(0);
      await expect(
        modal.locator('.check-result.fail').filter({ hasText: 'Test Coverage' })
      ).toBeVisible();
      expect(dispatches).toBe(1);
    });
  }

  test('rejects the unsupported run_id dispatch alias', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);
    await mockRemediationApi(page, {
      dispatch: {
        status: 200,
        body: {
          run_id: 42,
          run_url: 'https://api.github.com/repos/feddericovonwernich/scorecards/actions/runs/42',
          html_url: 'https://github.com/feddericovonwernich/scorecards/actions/runs/42',
        },
      },
    });
    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    const modal = page.locator('#service-modal');
    await expect(modal.getByRole('button', { name: 'Request failed', exact: true })).toBeVisible();
    await expect(modal.getByRole('alert')).toBeVisible();
    await expect(modal.getByRole('link', { name: 'View remediation run' })).toHaveCount(0);
  });

  test('rejects malformed receipts and wrong-workflow runs without links', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);
    await mockRemediationApi(page, {
      dispatch: {
        status: 200,
        body: {
          workflow_run_id: 42,
          html_url: 'https://github.com/feddericovonwernich/scorecards/actions/runs/42',
        },
      },
    });
    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(page.locator('#service-modal').getByRole('alert')).toContainText(
      'invalid workflow dispatch receipt'
    );
    await expect(
      page.locator('#service-modal').getByRole('link', { name: 'View remediation run' })
    ).toHaveCount(0);

    await closeServiceModal(page);
    await mockRemediationApi(page);
    await page.route(
      '**/api.github.com/repos/feddericovonwernich/scorecards/actions/runs/42',
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 42,
            workflow_id: 999,
            event: 'workflow_dispatch',
            display_title: `remediation:${requestId}`,
            head_sha: '3'.repeat(40),
            html_url: 'https://github.com/feddericovonwernich/scorecards/actions/runs/42',
          }),
        })
    );
    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(page.locator('#service-modal').getByRole('status')).toContainText(
      'could not be safely attributed'
    );
    await expect(
      page.locator('#service-modal').getByRole('link', { name: 'View remediation run' })
    ).toHaveCount(0);
  });

  test('prevents a double dispatch and keeps the failed check failed when accepted', async ({
    page,
  }) => {
    await setGitHubPAT(page, mockPAT);
    let dispatches = 0;
    await mockRemediationApi(page, {
      dispatch: { status: 204 },
      runs: [
        {
          id: 42,
          workflow_id: 123,
          event: 'workflow_dispatch',
          display_title: `remediation:${requestId}`,
          created_at: new Date().toISOString(),
          html_url: 'https://github.com/feddericovonwernich/scorecards/actions/runs/42',
        },
      ],
    });
    await page.route(
      '**/api.github.com/repos/feddericovonwernich/scorecards/actions/workflows/remediate-check.yml/dispatches',
      async (route) => {
        dispatches += 1;
        await new Promise((resolve) => setTimeout(resolve, 100));
        await route.fulfill({ status: 204 });
      }
    );

    await openServiceModal(page, 'test-repo-stale');
    const button = page.getByRole('button', { name: 'Propose test coverage' });
    await button.evaluate((element) => {
      element.click();
      element.click();
    });
    await expect(
      page.locator('#service-modal').getByRole('link', { name: 'View remediation run' })
    ).toHaveAttribute('href', /actions\/runs\/42$/);
    expect(dispatches).toBe(1);
    await expect(
      page
        .locator('#service-modal')
        .locator('.check-result.fail')
        .filter({ hasText: 'Test Coverage' })
    ).toBeVisible();
  });

  test('opens Settings without a token and reports dispatch authorization errors', async ({
    page,
  }) => {
    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(page.locator('#settings-modal')).toBeVisible();
    await page.locator('#settings-modal').getByRole('button', { name: 'Close modal' }).click();
    await closeServiceModal(page);

    await setGitHubPAT(page, mockPAT);
    await mockRemediationApi(page, {
      dispatch: { status: 401, body: { message: 'Bad credentials' } },
    });
    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(page.locator('#service-modal').getByRole('alert')).toContainText(
      'Bad credentials'
    );
    await page.locator('#service-modal').getByRole('button', { name: 'Workflow Runs' }).click();
    await expect(
      page.locator('#service-modal').getByRole('button', { name: /Configure Token/i })
    ).toBeVisible();

    await closeServiceModal(page);
    await setGitHubPAT(page, mockPAT);
    await mockRemediationApi(page, {
      dispatch: { status: 403, body: { message: 'Resource not accessible' } },
    });
    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(page.locator('#service-modal').getByRole('alert')).toContainText(
      'Resource not accessible'
    );
  });

  test('shows dispatch errors and ignores a late response after switching services', async ({
    page,
  }) => {
    await setGitHubPAT(page, mockPAT);
    let release;
    const responseReady = new Promise((resolve) => {
      release = resolve;
    });
    await mockRemediationApi(page);
    await page.route(
      '**/api.github.com/repos/feddericovonwernich/scorecards/actions/workflows/remediate-check.yml/dispatches',
      async (route) => {
        await responseReady;
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Bad credentials' }),
        });
      }
    );

    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await closeServiceModal(page);
    await openServiceModal(page, 'test-repo-perfect');

    release();
    await expect(
      page.locator('#service-modal').getByRole('heading', { name: 'test-repo-perfect' })
    ).toBeVisible();
    await expect(page.locator('#service-modal').getByRole('alert')).toHaveCount(0);
  });
  test('does not redispatch after an uncertain transport outcome', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);
    await mockRemediationApi(page);
    let dispatches = 0;
    await page.route(
      '**/api.github.com/repos/feddericovonwernich/scorecards/actions/workflows/remediate-check.yml/dispatches',
      (route) => {
        dispatches += 1;
        return route.abort('failed');
      }
    );

    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(page.locator('#service-modal').getByRole('status')).toContainText(
      'Dispatch outcome is uncertain'
    );
    await expect(
      page.locator('#service-modal').getByRole('link', { name: 'View remediation run' })
    ).toHaveCount(0);
    expect(dispatches).toBe(1);
  });
});
