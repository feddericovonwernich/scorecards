#!/usr/bin/env python3
"""Exercise a built image without publishing or accessing a service repository."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parents[1]
policy = json.loads((root / 'action/config/remediation.json').read_text())
image = sys.argv[1]

with tempfile.TemporaryDirectory(prefix='.runtime-smoke-', dir=root) as directory:
    workspace = Path(directory)
    workspace.chmod(0o777)
    readme = workspace / 'README.md'
    original = '# Local runtime probe\n'
    readme.write_text(original)
    readme.chmod(0o666)
    common = [
        'docker', 'run', '--rm', '--network=none', '--read-only', '--cap-drop=ALL',
        '--security-opt=no-new-privileges', '--user=1000:1000',
        '--pids-limit', str(policy['pids_max']),
        '--memory', str(policy['memory_max_bytes']), '--cpus', policy['cpu_max'],
        '--tmpfs', f"/tmp:rw,nosuid,nodev,noexec,size={policy['memory_max_bytes']}",
        '--mount', f'type=bind,src={root}/checks,dst=/checks,readonly',
        '--mount', f'type=bind,src={root}/action/lib,dst=/action/lib,readonly',
        '--env', 'SCORECARD_REPO_PATH=/workspace',
        '--env', 'SCORECARDS_REPO=feddericovonwernich/scorecards',
        '--env', 'SERVICE_REPOSITORY=local/runtime-probe',
    ]

    def run(entry, *args, writable=False, expected=0):
        mount = f'type=bind,src={workspace},dst=/workspace'
        if not writable:
            mount += ',readonly'
        result = subprocess.run(
            common + ['--mount', mount, '--entrypoint', entry, image, *args],
            capture_output=True, text=True, timeout=policy['timeout_max_seconds'],
        )
        assert result.returncode == expected, (entry, result.returncode, result.stdout, result.stderr)
        assert len(result.stdout.encode()) + len(result.stderr.encode()) <= policy['output_max_bytes']
        return result.stdout.strip()

    isolation = run('python3', '-c', '''
import json, os, pathlib, socket
assert os.getuid() == 1000
status = pathlib.Path('/proc/self/status').read_text().splitlines()
assert int(next(x.split()[1] for x in status if x.startswith('CapEff:')), 16) == 0
assert next(x.split()[1] for x in status if x.startswith('NoNewPrivs:')) == '1'
assert [name for _, name in socket.if_nameindex()] == ['lo']
assert not any('TOKEN' in key or 'SECRET' in key for key in os.environ)
assert not pathlib.Path('/var/run/docker.sock').exists()
assert not pathlib.Path('/workspace/.git').exists()
for parent in ('/', '/checks', '/action/lib', '/action/config', '/workspace'):
    try:
        pathlib.Path(parent, '.runtime-write-probe').write_text('unexpected')
    except OSError:
        pass
    else:
        raise AssertionError('writable: ' + parent)
print(json.dumps({'uid': os.getuid(), 'network': 'loopback only', 'capabilities': 0, 'no_new_privileges': True, 'mounts': 'read-only'}))
''')
    tools = run('/bin/bash', '-euc', '''
for tool in curl wget git jq gpg bash grep sed gawk find sort python python3 pip3 gcc g++ make; do
    command -v "$tool"
done
bash --version | sed -n '1p'
python3 --version
node --version
npm --version
git --version
jq --version
python3 -m venv /tmp/runtime-venv
cd /action
node --input-type=module -e 'for (const name of ["@apidevtools/swagger-parser", "js-yaml", "marked", "yaml"]) await import(name);'
''')
    check = '/checks/09-scorecard-badge/check.sh'
    recipe = '/checks/09-scorecard-badge/remediate.sh'
    run('/bin/bash', check, expected=1)
    run('/bin/bash', recipe, writable=True)
    run('/bin/bash', check)
    corrected = readme.read_bytes()
    assert corrected.startswith(original.encode())
    run('/bin/bash', recipe, writable=True)
    assert readme.read_bytes() == corrected
    assert sorted(p.name for p in workspace.iterdir()) == ['README.md']

    # Exercise scoring's default entrypoint and real ES-module resolution as well.
    (workspace / 'openapi.json').write_text(json.dumps({
        'openapi': '3.0.0', 'info': {'title': 'Runtime probe', 'version': '1.0.0'}, 'paths': {},
    }))
    selected = workspace / 'checks'
    for name in ('06-openapi-spec', '09-scorecard-badge', 'lib'):
        shutil.copytree(root / 'checks' / name, selected / name)
    output = workspace / 'output'
    output.mkdir()
    scoring = subprocess.run([
        'docker', 'run', '--rm', '--network=none',
        '--mount', f'type=bind,src={selected},dst=/host-checks,readonly',
        '--mount', f'type=bind,src={workspace},dst=/workspace,readonly',
        '--mount', f'type=bind,src={output},dst=/output',
        image,
    ], capture_output=True, text=True, timeout=policy['timeout_max_seconds'])
    assert scoring.returncode == 0, (scoring.stdout, scoring.stderr)
    results = json.loads((output / 'results.json').read_text())
    assert {r['check_id']: r['status'] for r in results} == {
        '06-openapi-spec': 'pass', '09-scorecard-badge': 'pass',
    }, results
    print(json.dumps({'image': image, 'isolation': json.loads(isolation), 'tools': tools.splitlines(),
                      'badge': 'fail -> recipe -> pass', 'idempotent': True,
                      'scoring': {r['check_id']: r['status'] for r in results}}, indent=2))
