import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import yaml from 'js-yaml';

const root = process.cwd();
const temp = process.env.TEST_TEMP_DIR;
const mode = process.argv[2];
const owner = yaml.load(await fs.readFile('.github/workflows/create-installation-pr.yml', 'utf8'));
const service = yaml.load(await fs.readFile('.github/workflows/install.yml', 'utf8'));
const caller = yaml.load(await fs.readFile('documentation/examples/service-workflow-example.yml', 'utf8')).jobs.scorecards;
const contract = service.on.workflow_call;
const credentials = {
  'scorecards-catalog-token': 'fixture-catalog-token',
  'scorecards-workflow-token': 'fixture-token',
};
for (const [name, secret] of Object.entries(contract.secrets)) {
  if (secret.required) assert.ok(Object.hasOwn(credentials, name), `missing required secret ${name}`);
}
for (const name of Object.keys(caller.secrets)) assert.ok(Object.hasOwn(contract.secrets, name), `undeclared secret ${name}`);
for (const [name, value] of Object.entries(caller.with)) {
  assert.ok(Object.hasOwn(contract.inputs, name), `undeclared input ${name}`);
  assert.equal(typeof value, contract.inputs[name].type);
}
assert.equal(caller.uses.split('/.github/')[0], contract.inputs['scorecards-repo'].default);
assert.equal(caller.with['scorecards-repo'], contract.inputs['scorecards-repo'].default);
const inputs = { org: 'acme', repo: 'service', 'scorecards-repo': 'acme/scorecards', 'scorecards-branch': 'catalog', 'retry-closed': 'false' };
const render = (text, values) => String(text).replace(/\$\{\{\s*(.*?)\s*\}\}/g, (_, key) => {
  assert.ok(Object.hasOwn(values, key), `unresolved expression ${key}`);
  return values[key];
});
const inputValues = Object.fromEntries(Object.entries(inputs).map(([key, value]) => [`inputs.${key}`, value]));
const values = { ...inputValues, 'secrets.scorecards-workflow-token': 'fixture-token', 'secrets.SCORECARDS_WORKFLOW_TOKEN': 'fixture-token' };
const run = (command, args, cwd = temp, env = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd, env: { ...process.env, ...env } });
  let output = '';
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  child.on('error', reject);
  child.on('close', code => resolve({ code, output }));
});
const git = async (...args) => {
  const result = await run('git', args);
  assert.equal(result.code, 0, result.output);
  return result.output.trim();
};
const outputs = async file => Object.fromEntries((await fs.readFile(file, 'utf8')).trim().split('\n').filter(Boolean).map(line => {
  const split = line.indexOf('=');
  return [line.slice(0, split), line.slice(split + 1)];
}));
const remote = path.join(temp, 'service.git');
const seed = path.join(temp, 'seed');
await git('init', '--bare', remote);
await git('init', '-b', 'main', seed);
await git('-C', seed, 'config', 'user.name', 'fixture');
await git('-C', seed, 'config', 'user.email', 'fixture@example.invalid');
await fs.writeFile(path.join(seed, 'seed.txt'), 'initial\n');
await git('-C', seed, 'add', '.');
await git('-C', seed, 'commit', '-m', 'seed');
await git('-C', seed, 'push', remote, 'main');
await git('--git-dir', remote, 'symbolic-ref', 'HEAD', 'refs/heads/main');
const originalMain = await git('--git-dir', remote, 'rev-parse', 'main');
const bin = path.join(temp, 'bin');
await fs.mkdir(bin);
await fs.writeFile(path.join(bin, 'gh'), `#!/usr/bin/env node
const response = await fetch(process.env.FIXTURE_URL, { method: 'POST', body: JSON.stringify({ args: process.argv.slice(2), cwd: process.cwd(), run: process.env.FIXTURE_RUN }) });
const result = await response.json();
if (result.output) process.stdout.write(result.output);
process.exit(result.code ?? 0);
`, { mode: 0o755 });
let nextId = 100;
let creates = 0;
let pr;
const runs = [];
const queues = new Map();
const tasks = [];
let polls = 0;
let releaseFirst;
const bothRequested = new Promise(resolve => { releaseFirst = resolve; });
const step = async (definition, cwd, env, expressions = values) => {
  const filename = path.join(cwd, `step-${Math.random().toString(16).slice(2)}.sh`);
  const outputFile = `${filename}.output`;
  await fs.writeFile(filename, render(definition.run, expressions));
  await fs.writeFile(outputFile, '');
  const stepEnv = Object.fromEntries(Object.entries(definition.env ?? {}).map(([key, value]) => [key, render(value, expressions)]));
  const result = await run('bash', ['-eo', 'pipefail', filename], cwd, { ...stepEnv, ...env, GITHUB_OUTPUT: outputFile });
  return { ...result, outputs: await outputs(outputFile) };
};
const executeOwner = async record => {
  record.status = 'in_progress';
  if (mode === 'concurrent' && record.id === 100) await bothRequested;
  const workspace = path.join(temp, String(record.id));
  await fs.mkdir(workspace);
  const env = { ...fixtureEnv, FIXTURE_RUN: String(record.id), GITHUB_REPOSITORY: 'acme/scorecards', GITHUB_REF: 'refs/heads/main', GITHUB_RUN_ID: String(record.id), GITHUB_RUN_ATTEMPT: '1', GITHUB_STEP_SUMMARY: path.join(workspace, 'summary') };
  const guard = await step(owner.jobs['validate-owner'].steps[0], workspace, env);
  assert.equal(guard.code, 0, guard.output);
  const checkout = path.join(workspace, 'service-repo');
  await git('clone', remote, checkout);
  const templates = path.join(workspace, 'scorecards-repo/documentation/examples');
  await fs.mkdir(templates, { recursive: true });
  await fs.copyFile(path.join(root, 'documentation/examples/scorecard-workflow-template.yml'), path.join(templates, 'scorecard-workflow-template.yml'));
  const steps = owner.jobs['create-pr'].steps;
  const check = await step(steps.find(s => s.id === 'check'), checkout, env);
  assert.equal(check.code, 0, check.output);
  let created = {};
  if (check.outputs['create-pr'] === 'true') {
    const prepared = await step(steps.find(s => s.id === 'prepare'), checkout, env);
    assert.equal(prepared.code, 0, prepared.output);
    const result = await step(steps.find(s => s.id === 'create-pr'), checkout, env, { ...values, 'steps.prepare.outputs.install-branch': prepared.outputs['install-branch'] });
    assert.equal(result.code, 0, result.output);
    created = result.outputs;
  }
  const resultValues = { ...values };
  for (const [prefix, data] of [['check', check.outputs], ['create-pr', created]]) {
    for (const key of ['status', 'message', 'pr-number', 'pr-state', 'pr-url']) resultValues[`steps.${prefix}.outputs.${key}`] = data[key] ?? '';
  }
  const result = await step(steps.find(s => s.id === 'result'), checkout, env, resultValues);
  assert.equal(result.code, 0, result.output);
  const publishValues = { ...values };
  for (const [key, value] of Object.entries(result.outputs)) publishValues[`needs.create-pr.outputs.${key}`] = value;
  const published = await step(owner.jobs['publish-result'].steps[0], workspace, env, publishValues);
  assert.equal(published.code, 0, published.output);
  record.artifact = await fs.readFile(path.join(workspace, 'installation-pr-result.json'), 'utf8');
  record.artifactName = render(owner.jobs['publish-result'].steps[1].with.name, { 'inputs.request-id || github.run_id': record.request });
  record.status = 'completed';
  record.conclusion = 'success';
};
const enqueue = request => {
  const record = { id: nextId++, request, status: 'queued', conclusion: '' };
  runs.push(record);
  const group = render(owner.concurrency.group, inputValues).toLowerCase();
  assert.equal(owner.concurrency['cancel-in-progress'], false);
  const key = `acme/scorecards:${group}`;
  const task = (queues.get(key) ?? Promise.resolve()).then(() => executeOwner(record));
  queues.set(key, task);
  tasks.push(task);
  task.catch(error => { record.status = 'completed'; record.conclusion = 'failure'; record.error = error; });
  if (runs.length === 2) releaseFirst();
  return record;
};
const arg = (args, name) => args[args.indexOf(name) + 1];
const server = http.createServer(async (req, res) => {
  try {
    let body = '';
    for await (const chunk of req) body += chunk;
    const { args, cwd, run: runId } = JSON.parse(body);
    let output = '';
    let code = 0;
    const command = args.slice(0, 2).join(' ');
    if (args[0] === 'api') {
      assert.equal(args[1], 'repos/acme/scorecards');
      output = 'main\n';
    } else if (command === 'workflow run') {
      assert.equal(args[2], 'create-installation-pr.yml');
      assert.equal(arg(args, '--repo'), 'acme/scorecards');
      assert.equal(arg(args, '--ref'), 'main');
      for (const [key, value] of Object.entries(inputs)) assert.ok(args.includes(`${key}=${value}`));
      const request = args.find(value => value.startsWith('request-id=')).slice(11);
      if (mode === 'concurrent' || mode === 'delayed') enqueue(request);
      else runs.push({ id: nextId++, request, status: mode === 'timeout' ? 'queued' : 'completed', conclusion: mode === 'missing-artifact' ? 'success' : mode });
    } else if (command === 'pr list') {
      output = JSON.stringify(pr ? [pr] : []);
    } else if (command === 'label create') {
      output = '';
    } else if (command === 'pr create') {
      creates++;
      pr = { number: 18 + creates - 1, state: 'OPEN', title: 'Install', headRefName: arg(args, '--head'), url: `https://github.com/acme/service/pull/${18 + creates - 1}` };
      assert.equal(pr.headRefName, `scorecards-install-${runId}-1`);
      output = `${pr.url}\n`;
    } else if (command === 'run list') {
      assert.equal(arg(args, '--repo'), 'acme/scorecards');
      polls++;
      assert.equal(arg(args, '--workflow'), 'create-installation-pr.yml');
      output = JSON.stringify(runs.map(record => ({ databaseId: record.id, status: record.status, conclusion: record.conclusion, displayTitle: render(owner['run-name'], { 'inputs.request-id || github.run_id': record.request }) })));
    } else if (command === 'run view') {
      const record = runs.find(candidate => candidate.id === Number(args[2]));
      assert.ok(record);
      const waiting = mode === 'delayed' && polls * Number(service.jobs['request-installation-pr'].steps[0].env.POLL_INTERVAL_SECONDS) <= 420;
      output = JSON.stringify({ status: waiting ? 'in_progress' : record.status, conclusion: waiting ? '' : record.conclusion });
    } else if (command === 'run download') {
      const record = runs.find(candidate => candidate.id === Number(args[2]));
      if (record.artifact) assert.equal(arg(args, '--name'), record.artifactName);
      if (!record.artifact) code = 1;
      else {
        const directory = path.join(cwd, arg(args, '--dir'));
        await fs.mkdir(directory, { recursive: true });
        await fs.writeFile(path.join(directory, 'installation-pr-result.json'), record.artifact);
      }
    } else throw new Error(`unexpected gh ${args.join(' ')}`);
    res.end(JSON.stringify({ code, output }));
  } catch (error) {
    res.end(JSON.stringify({ code: 1, output: String(error) }));
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const fixtureEnv = { PATH: `${bin}:${process.env.PATH}`, FIXTURE_URL: `http://127.0.0.1:${server.address().port}` };
try {
  if (mode === 'concurrent') enqueue('direct');
  const polling = mode === 'delayed' || mode === 'timeout'
    ? { POLL_INTERVAL_SECONDS: '0' }
    : { POLL_ATTEMPTS: '100', POLL_INTERVAL_SECONDS: '0.05' };
  const result = await step(service.jobs['request-installation-pr'].steps[0], temp, { ...fixtureEnv, GITHUB_REPOSITORY: 'acme/service', GITHUB_REPOSITORY_OWNER: 'acme', GITHUB_RUN_ID: '44', GITHUB_RUN_ATTEMPT: '1', ...polling });
  releaseFirst();
  await Promise.all(tasks);
  if (mode === 'concurrent') {
    assert.equal(result.code, 0, result.output);
    assert.equal(creates, 1);
    assert.equal(result.outputs['pr-url'], JSON.parse(runs[0].artifact).pr_url);
    assert.equal(result.outputs.status, 'pr-exists');
    assert.equal(runs.length, 2);
    assert.equal(await git('--git-dir', remote, 'rev-parse', 'main'), originalMain);
    assert.equal(await git('--git-dir', remote, 'for-each-ref', '--format=%(refname)', 'refs/heads/scorecards-install-*'), 'refs/heads/scorecards-install-100-1');
    const guard = owner.jobs['validate-owner'].steps[0];
    for (const env of [{ GITHUB_REPOSITORY: 'other/scorecards', GITHUB_REF: 'refs/heads/main' }, { GITHUB_REPOSITORY: 'acme/scorecards', GITHUB_REF: 'refs/tags/main' }]) {
      assert.notEqual((await step(guard, temp, { ...fixtureEnv, ...env })).code, 0);
    }
  } else if (mode === 'delayed') {
    assert.equal(result.code, 0, result.output);
    assert.equal(creates, 1);
    assert.equal(result.outputs['pr-url'], pr.url);
    assert.ok(polls > 84);
  } else {
    assert.notEqual(result.code, 0, `accepted ${mode}: ${result.output}`);
    assert.deepEqual(result.outputs, {});
    assert.equal(creates, 0);
    if (mode === 'timeout') assert.equal(polls, Number(service.jobs['request-installation-pr'].steps[0].env.POLL_ATTEMPTS));
  }
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
