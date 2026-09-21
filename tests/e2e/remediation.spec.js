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
const fixturePath = new URL('./fixtures/docs/results/feddericovonwernich/test-repo-stale/results.json', import.meta.url);
const policyContent = Buffer.from(JSON.stringify({
  targets: {
    [service]: { publisher_login: 'scorecard-bot' },
  },
})).toString('base64');


async function mockRemediationResult(page, { evaluation: source = evaluation } = {}) {
  await page.route(`**/raw.githubusercontent.com/**/results/${service}/results.json*`, async (route) => {
    const result = JSON.parse(await readFile(fixturePath, 'utf8'));
    const check = result.checks.find(({ check_id }) => check_id === '04-tests');
    check.remediation = { version: 1, label: 'Propose test coverage' };
    if (source) {
      result.evaluation = source;
    } else {
      delete result.evaluation;
    }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(result) });
  });
}

async function mockRemediationApi(page, { dispatch = {
  status: 200,
  body: {
    workflow_run_id: 42,
    run_url: 'https://api.github.com/repos/feddericovonwernich/scorecards/actions/runs/42',
    html_url: 'https://github.com/feddericovonwernich/scorecards/actions/runs/42',
  },
}, runs = [] } = {}) {
  await page.route('**/api.github.com/repos/feddericovonwernich/scorecards', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ default_branch: 'trunk' }) })
  );
  await page.route('**/api.github.com/repos/feddericovonwernich/test-repo-stale', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ default_branch: 'trunk' }) })
  );
  await page.route('**/api.github.com/repos/feddericovonwernich/scorecards/actions/workflows/remediate-check.yml', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 123, path: '.github/workflows/remediate-check.yml' }),
    })
  );
  await page.route('**/api.github.com/repos/feddericovonwernich/scorecards/actions/workflows/remediate-check.yml/dispatches', (route) =>
    route.fulfill({ status: dispatch.status, contentType: 'application/json', body: dispatch.status === 204 ? '' : JSON.stringify(dispatch.body) })
  );
  await page.route('**/api.github.com/repos/feddericovonwernich/scorecards/contents/action/config/remediation.json*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ encoding: 'base64', content: policyContent }),
    })
  );
  await page.route(/\/api\.github\.com\/repos\/feddericovonwernich\/scorecards\/actions\/(?:workflows\/remediate-check\.yml\/)?runs(?:\/\d+)?(?:\?.*)?$/, (route) => {
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
          html_url: 'https://github.com/feddericovonwernich/scorecards/actions/runs/42',
        }),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ workflow_runs: runs, total_count: runs.length }) });
  });
  await page.route('**/api.github.com/repos/feddericovonwernich/test-repo-stale/pulls*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );
}

test.describe('Optional check remediation', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await mockRemediationResult(page);
    await page.addInitScript(() => Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: () => '00000000-0000-4000-8000-000000000001',
    }));
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

  test('uses the central default branch and exactly six remediation inputs for a 200 receipt', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);
    await mockRemediationApi(page);
    let request;
    await page.route('**/api.github.com/repos/feddericovonwernich/scorecards/actions/workflows/remediate-check.yml/dispatches', async (route) => {
      request = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          workflow_run_id: 42,
          run_url: 'https://api.github.com/repos/feddericovonwernich/scorecards/actions/runs/42',
          html_url: 'https://github.com/feddericovonwernich/scorecards/actions/runs/42',
        }),
      });
    });

    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(page.locator('#service-modal').getByRole('link', { name: 'View remediation run' })).toHaveAttribute('href', /actions\/runs\/42$/);
    expect(request).toEqual({
      ref: 'trunk',
      inputs: {
        org: 'feddericovonwernich', repo: 'test-repo-stale', check_id: '04-tests',
        service_sha: '1'.repeat(40), suite_sha: '2'.repeat(40), request_id: requestId,
      },
    });
  });


  test('links a pull request only when its marker, branch, base, repository, and publisher match', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);
    await mockRemediationApi(page);
    await page.route('**/api.github.com/repos/feddericovonwernich/test-repo-stale/pulls*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          number: 7,
          html_url: 'https://github.com/feddericovonwernich/test-repo-stale/pull/7',
          body: '<!-- scorecards-remediation:v1 check_id=04-tests -->',
          base: { ref: 'trunk' },
          head: {
            ref: 'scorecards-remediation/04-tests/42-1',
            repo: { full_name: 'feddericovonwernich/test-repo-stale' },
          },
          user: { login: 'scorecard-bot' },
        }]),
      })
    );

    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(page.locator('#service-modal').getByRole('link', { name: 'View pull request #7' })).toHaveAttribute('href', /pull\/7$/);
  });

  test('accepts 204 only after correlating the matching workflow run, never the newest unrelated run', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);
    await mockRemediationApi(page, {
      dispatch: { status: 204 },
      runs: [
        {
          id: 99, workflow_id: 123, event: 'workflow_dispatch',
          display_title: 'remediation:someone-else', created_at: new Date().toISOString(),
          html_url: 'https://github.com/feddericovonwernich/scorecards/actions/runs/99',
        },
        {
          id: 42, workflow_id: 123, event: 'workflow_dispatch',
          display_title: `remediation:${requestId}`, created_at: new Date().toISOString(),
          html_url: 'https://github.com/feddericovonwernich/scorecards/actions/runs/42',
        },
      ],
    });

    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(page.locator('#service-modal').getByRole('link', { name: 'View remediation run' })).toHaveAttribute('href', /actions\/runs\/42$/);
  });


  test('polls for a late correlated run without dispatching again', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);
    await mockRemediationApi(page, { dispatch: { status: 204 } });
    let polls = 0;
    await page.route('**/api.github.com/repos/feddericovonwernich/scorecards/actions/workflows/remediate-check.yml/runs*', (route) => {
      polls += 1;
      const workflow_runs = polls === 1 ? [] : [{
        id: 42,
        workflow_id: 123,
        event: 'workflow_dispatch',
        display_title: `remediation:${requestId}`,
        created_at: new Date().toISOString(),
        html_url: 'https://github.com/feddericovonwernich/scorecards/actions/runs/42',
      }];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ workflow_runs, total_count: workflow_runs.length }),
      });
    });

    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(page.locator('#service-modal').getByRole('link', { name: 'View remediation run' }))
      .toHaveAttribute('href', /actions\/runs\/42$/, { timeout: 7000 });
    expect(polls).toBe(2);
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
    await expect(page.locator('#service-modal').getByRole('alert')).toContainText('invalid workflow dispatch receipt');
    await expect(page.locator('#service-modal').getByRole('link', { name: 'View remediation run' })).toHaveCount(0);

    await closeServiceModal(page);
    await mockRemediationApi(page);
    await page.route('**/api.github.com/repos/feddericovonwernich/scorecards/actions/runs/42', (route) =>
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
    await expect(page.locator('#service-modal').getByRole('status')).toContainText('could not be safely attributed');
    await expect(page.locator('#service-modal').getByRole('link', { name: 'View remediation run' })).toHaveCount(0);
  });

  test('prevents a double dispatch and keeps the failed check failed when accepted', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);
    let dispatches = 0;
    await mockRemediationApi(page, {
      dispatch: { status: 204 },
      runs: [{
        id: 42,
        workflow_id: 123,
        event: 'workflow_dispatch',
        display_title: `remediation:${requestId}`,
        created_at: new Date().toISOString(),
        html_url: 'https://github.com/feddericovonwernich/scorecards/actions/runs/42',
      }],
    });
    await page.route('**/api.github.com/repos/feddericovonwernich/scorecards/actions/workflows/remediate-check.yml/dispatches', async (route) => {
      dispatches += 1;
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.fulfill({ status: 204 });
    });

    await openServiceModal(page, 'test-repo-stale');
    const button = page.getByRole('button', { name: 'Propose test coverage' });
    await button.evaluate((element) => {
      element.click();
      element.click();
    });
    await expect(page.locator('#service-modal').getByRole('link', { name: 'View remediation run' })).toHaveAttribute('href', /actions\/runs\/42$/);
    expect(dispatches).toBe(1);
    await expect(page.locator('#service-modal').locator('.check-result.fail').filter({ hasText: 'Test Coverage' })).toBeVisible();
  });


  test('opens Settings without a token and reports dispatch authorization errors', async ({ page }) => {
    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(page.locator('#settings-modal')).toBeVisible();
    await page.locator('#settings-modal').getByRole('button', { name: 'Close modal' }).click();
    await closeServiceModal(page);

    await setGitHubPAT(page, mockPAT);
    await mockRemediationApi(page, { dispatch: { status: 401, body: { message: 'Bad credentials' } } });
    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(page.locator('#service-modal').getByRole('alert')).toContainText('Bad credentials');
    await page.locator('#service-modal').getByRole('button', { name: 'Workflow Runs' }).click();
    await expect(page.locator('#service-modal').getByRole('button', { name: /Configure Token/i })).toBeVisible();

    await closeServiceModal(page);
    await setGitHubPAT(page, mockPAT);
    await mockRemediationApi(page, { dispatch: { status: 403, body: { message: 'Resource not accessible' } } });
    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(page.locator('#service-modal').getByRole('alert')).toContainText('Resource not accessible');
  });

  test('shows dispatch errors and ignores a late response after switching services', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);
    let release;
    const responseReady = new Promise((resolve) => { release = resolve; });
    await mockRemediationApi(page);
    await page.route('**/api.github.com/repos/feddericovonwernich/scorecards/actions/workflows/remediate-check.yml/dispatches', async (route) => {
      await responseReady;
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Bad credentials' }) });
    });

    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await closeServiceModal(page);
    await openServiceModal(page, 'test-repo-perfect');


    release();
    await expect(page.locator('#service-modal').getByRole('heading', { name: 'test-repo-perfect' })).toBeVisible();
    await expect(page.locator('#service-modal').getByRole('alert')).toHaveCount(0);
  });
  test('does not redispatch after an uncertain transport outcome', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);
    await mockRemediationApi(page);
    let dispatches = 0;
    await page.route('**/api.github.com/repos/feddericovonwernich/scorecards/actions/workflows/remediate-check.yml/dispatches', (route) => {
      dispatches += 1;
      return route.abort('failed');
    });

    await openServiceModal(page, 'test-repo-stale');
    await page.getByRole('button', { name: 'Propose test coverage' }).click();
    await expect(page.locator('#service-modal').getByRole('status')).toContainText('Dispatch outcome is uncertain');
    await expect(page.locator('#service-modal').getByRole('link', { name: 'View remediation run' })).toHaveCount(0);
    expect(dispatches).toBe(1);
  });
});
