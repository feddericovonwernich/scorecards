import { it, expect } from '@jest/globals';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import yaml from 'js-yaml';

const workflow = yaml.load(readFileSync('.github/workflows/sync-docs.yml', 'utf8'));
const step = (name) => workflow.jobs['sync-catalog'].steps.find((entry) => entry.name === name).run;

it('publishes compiled UI without deleting domain configuration or concurrent catalog data', () => {
  const root = mkdtempSync(join(tmpdir(), 'catalog-publication-'));
  const git = (cwd, ...args) => execFileSync('git', args, { cwd, stdio: 'pipe' });
  const put = (path, content) => writeFileSync(join(root, path), content);
  try {
    git(root, 'init', '--bare', 'remote.git');
    git(root, 'clone', 'remote.git', 'catalog-repo');
    const catalog = join(root, 'catalog-repo');
    git(catalog, 'checkout', '-b', 'catalog');
    git(catalog, 'config', 'user.name', 'test');
    git(catalog, 'config', 'user.email', 'test@example.invalid');
    mkdirSync(join(catalog, 'docs'));
    put('catalog-repo/docs/index.html', 'old UI');
    put('catalog-repo/docs/obsolete.js', 'old asset');
    put('catalog-repo/docs/CNAME', 'catalog.example.invalid\n');
    put('catalog-repo/docs/.nojekyll', '');
    put('catalog-repo/results.json', 'initial results');
    git(catalog, 'add', '.');
    git(catalog, 'commit', '-m', 'seed');
    git(catalog, 'push', '-u', 'origin', 'catalog');
    git(root, 'clone', '--branch', 'catalog', 'remote.git', 'writer');
    const writer = join(root, 'writer');
    git(writer, 'config', 'user.name', 'test');
    git(writer, 'config', 'user.email', 'test@example.invalid');
    put('writer/results.json', 'concurrent results');
    git(writer, 'add', 'results.json');
    git(writer, 'commit', '-m', 'concurrent scoring');
    git(writer, 'push');
    mkdirSync(join(root, 'main-repo/docs/dist'), { recursive: true });
    put('main-repo/docs/dist/index.html', 'compiled UI');
    put('main-repo/docs/dist/api-explorer.html', 'compiled explorer');
    execFileSync('bash', ['-euo', 'pipefail', '-c', step('Sync catalog UI files')], { cwd: root });
    execFileSync('bash', ['-euo', 'pipefail', '-c', step('Commit and push to catalog')], {
      cwd: root,
      stdio: 'pipe',
    });
    expect(git(root, '--git-dir=remote.git', 'show', 'catalog:docs/index.html').toString()).toBe(
      'compiled UI'
    );
    expect(git(root, '--git-dir=remote.git', 'show', 'catalog:results.json').toString()).toBe(
      'concurrent results'
    );
    expect(readFileSync(join(catalog, 'docs/CNAME'), 'utf8')).toBe('catalog.example.invalid\n');
    expect(existsSync(join(catalog, 'docs/.nojekyll'))).toBe(true);
    expect(existsSync(join(catalog, 'docs/obsolete.js'))).toBe(false);
    expect(readFileSync(join(catalog, 'docs/api-explorer.html'), 'utf8')).toBe('compiled explorer');
    // An unchanged UI must still reach artifact upload without requiring a new commit.
    const before = git(catalog, 'rev-parse', 'HEAD').toString();
    execFileSync('bash', ['-euo', 'pipefail', '-c', step('Commit and push to catalog')], {
      cwd: root,
    });
    expect(git(catalog, 'rev-parse', 'HEAD').toString()).toBe(before);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}, 30000);

it('publishes installation PRs without losing concurrent catalog changes', () => {
  const root = mkdtempSync(join(tmpdir(), 'installation-publication-'));
  const git = (cwd, ...args) => execFileSync('git', args, { cwd, stdio: 'pipe' });
  const workflow = yaml.load(readFileSync('.github/workflows/create-installation-pr.yml', 'utf8'));
  const publicationStep = workflow.jobs['update-registry'].steps.find(
    (entry) => entry.name === 'Update and push registry with PR information'
  ).run;
  const render = (step, repo, number, url) =>
    step
      .replaceAll('${{ inputs.org }}', 'acme')
      .replaceAll('${{ inputs.repo }}', repo)
      .replaceAll('${{ inputs.scorecards-branch }}', 'catalog')
      .replaceAll('${{ needs.create-pr.outputs.pr-number }}', String(number))
      .replaceAll('${{ needs.create-pr.outputs.pr-state }}', 'OPEN')
      .replaceAll('${{ needs.create-pr.outputs.pr-url }}', url)
      .replaceAll('${{ steps.fetch-branch.outputs.default_branch }}', 'main');
  const run = (cwd, script) =>
    execFileSync('bash', ['-euo', 'pipefail', '-c', `sleep() { :; }\n${script}`], {
      cwd,
      stdio: 'pipe',
    });
  const configure = (cwd) => {
    git(cwd, 'config', 'user.name', 'test');
    git(cwd, 'config', 'user.email', 'test@example.invalid');
  };
  try {
    git(root, 'init', '--bare', 'remote.git');
    git(root, 'clone', 'remote.git', 'seed');
    const seed = join(root, 'seed');
    git(seed, 'checkout', '-b', 'catalog');
    configure(seed);
    mkdirSync(join(seed, 'registry/acme'), { recursive: true });
    writeFileSync(
      join(seed, 'registry/acme/alpha.json'),
      JSON.stringify({ org: 'acme', repo: 'alpha', score: 10, evaluation: { version: 1 } })
    );
    writeFileSync(join(seed, 'registry/acme/consolidation.json'), JSON.stringify({ generated: 1 }));
    git(seed, 'add', '.');
    git(seed, 'commit', '-m', 'seed');
    git(seed, 'push', '-u', 'origin', 'catalog');

    git(root, 'clone', '--branch', 'catalog', 'remote.git', 'alpha');
    git(root, 'clone', '--branch', 'catalog', 'remote.git', 'beta');
    const alpha = join(root, 'alpha');
    const beta = join(root, 'beta');
    configure(alpha);
    configure(beta);
    git(alpha, 'checkout', '--detach');
    git(beta, 'checkout', '--detach');

    git(root, 'clone', '--branch', 'catalog', 'remote.git', 'consolidator');
    const consolidator = join(root, 'consolidator');
    configure(consolidator);
    writeFileSync(
      join(consolidator, 'registry/acme/alpha.json'),
      JSON.stringify({ org: 'acme', repo: 'alpha', score: 95, evaluation: { version: 2 } })
    );
    writeFileSync(
      join(consolidator, 'registry/acme/consolidation.json'),
      JSON.stringify({ generated: 2 })
    );
    git(consolidator, 'add', '.');
    git(consolidator, 'commit', '-m', 'consolidate');
    git(consolidator, 'push');

    run(alpha, render(publicationStep, 'alpha', 11, 'https://example.invalid/alpha/11'));
    run(beta, render(publicationStep, 'beta', 12, 'https://example.invalid/beta/12'));

    const readRegistry = (repo) =>
      JSON.parse(
        git(root, '--git-dir=remote.git', 'show', `catalog:registry/acme/${repo}.json`).toString()
      );
    expect(readRegistry('alpha')).toMatchObject({
      score: 95,
      evaluation: { version: 2 },
      installation_pr: { number: 11, state: 'OPEN', url: 'https://example.invalid/alpha/11' },
    });
    expect(readRegistry('beta')).toMatchObject({
      installation_pr: { number: 12, state: 'OPEN', url: 'https://example.invalid/beta/12' },
    });
    expect(
      JSON.parse(
        git(
          root,
          '--git-dir=remote.git',
          'show',
          'catalog:registry/acme/consolidation.json'
        ).toString()
      )
    ).toEqual({ generated: 2 });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}, 30000);

it('fails publication retries while reporting the installation PR URL', () => {
  const root = mkdtempSync(join(tmpdir(), 'installation-publication-failure-'));
  const git = (cwd, ...args) => execFileSync('git', args, { cwd, stdio: 'pipe' });
  const workflow = yaml.load(readFileSync('.github/workflows/create-installation-pr.yml', 'utf8'));
  const publicationStep = workflow.jobs['update-registry'].steps.find(
    (entry) => entry.name === 'Update and push registry with PR information'
  ).run;
  const url = 'https://example.invalid/service/42';
  const render = (step) =>
    step
      .replaceAll('${{ inputs.org }}', 'acme')
      .replaceAll('${{ inputs.repo }}', 'service')
      .replaceAll('${{ inputs.scorecards-branch }}', 'catalog')
      .replaceAll('${{ needs.create-pr.outputs.pr-number }}', '42')
      .replaceAll('${{ needs.create-pr.outputs.pr-state }}', 'OPEN')
      .replaceAll('${{ needs.create-pr.outputs.pr-url }}', url)
      .replaceAll('${{ steps.fetch-branch.outputs.default_branch }}', 'main');
  try {
    git(root, 'init', '--bare', 'remote.git');
    git(root, 'clone', 'remote.git', 'catalog');
    const catalog = join(root, 'catalog');
    git(catalog, 'checkout', '-b', 'catalog');
    git(catalog, 'config', 'user.name', 'test');
    git(catalog, 'config', 'user.email', 'test@example.invalid');
    writeFileSync(join(catalog, '.keep'), '');
    git(catalog, 'add', '.');
    git(catalog, 'commit', '-m', 'seed');
    git(catalog, 'push', '-u', 'origin', 'catalog');
    git(catalog, 'checkout', '--detach');
    execFileSync(
      'bash',
      ['-c', 'printf "#!/bin/sh\\nexit 1\\n" > hooks/pre-receive && chmod +x hooks/pre-receive'],
      {
        cwd: join(root, 'remote.git'),
      }
    );
    const result = (() => {
      try {
        execFileSync(
          'bash',
          ['-euo', 'pipefail', '-c', `sleep() { :; }\n${render(publicationStep)}`],
          {
            cwd: catalog,
            encoding: 'utf8',
            stdio: 'pipe',
          }
        );
      } catch (error) {
        return error;
      }
      throw new Error('publication unexpectedly succeeded');
    })();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(url);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}, 30000);
