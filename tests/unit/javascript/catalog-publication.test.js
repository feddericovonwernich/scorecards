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
    execFileSync('bash', ['-euo', 'pipefail', '-c', step('Commit and push to catalog')], { cwd: root, stdio: 'pipe' });
    expect(git(root, '--git-dir=remote.git', 'show', 'catalog:docs/index.html').toString()).toBe('compiled UI');
    expect(git(root, '--git-dir=remote.git', 'show', 'catalog:results.json').toString()).toBe('concurrent results');
    expect(readFileSync(join(catalog, 'docs/CNAME'), 'utf8')).toBe('catalog.example.invalid\n');
    expect(existsSync(join(catalog, 'docs/.nojekyll'))).toBe(true);
    expect(existsSync(join(catalog, 'docs/obsolete.js'))).toBe(false);
    expect(readFileSync(join(catalog, 'docs/api-explorer.html'), 'utf8')).toBe('compiled explorer');
    // An unchanged UI must still reach artifact upload without requiring a new commit.
    const before = git(catalog, 'rev-parse', 'HEAD').toString();
    execFileSync('bash', ['-euo', 'pipefail', '-c', step('Commit and push to catalog')], { cwd: root });
    expect(git(catalog, 'rev-parse', 'HEAD').toString()).toBe(before);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}, 30000);
