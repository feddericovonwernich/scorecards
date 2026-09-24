#!/usr/bin/env python3
"""Exercise checkout runner discovery through the runtime image entrypoint."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parents[1]
policy = json.loads((root / 'action/config/remediation.json').read_text())
image = sys.argv[1]

with tempfile.TemporaryDirectory(prefix='.runner-discovery-', dir=root) as directory:
    workspace = Path(directory)
    checks = workspace / 'checks'
    valid = checks / '00-valid'
    valid.mkdir(parents=True)
    shutil.copyfile(
        root / 'checks/06-openapi-spec/metadata.json', valid / 'metadata.json',
    )
    (valid / 'check.sh').write_text('touch /output/valid-executed\n')
    output = workspace / 'output'
    output.mkdir()
    command = [
        'docker', 'run', '--rm', '--network=none',
        '--user', f'{os.getuid()}:{os.getgid()}',
        '--tmpfs', '/checks:rw,mode=1777',
        '--mount', f'type=bind,src={checks},dst=/host-checks,readonly',
        '--mount', f'type=bind,src={workspace},dst=/workspace,readonly',
        '--mount', f'type=bind,src={output},dst=/output',
        '--mount', f'type=bind,src={root}/action/utils,dst=/scorecard/utils,readonly',
        '--mount', f'type=bind,src={root}/action/utils,dst=/action/utils,readonly',
        '--mount', f'type=bind,src={root}/action/config,dst=/action/config,readonly',
        '--mount', f'type=bind,src={root}/action/lib,dst=/action/lib,readonly',
        image,
    ]
    positive = subprocess.run(
        command, capture_output=True, text=True,
        timeout=policy['timeout_max_seconds'],
    )
    assert positive.returncode == 0, (positive.stdout, positive.stderr)
    results = json.loads((output / 'results.json').read_text())
    assert [(r['check_id'], r['status'], r['exit_code']) for r in results] == [
        ('00-valid', 'pass', 0),
    ], results
    assert (output / 'valid-executed').exists()
    for path in output.iterdir():
        path.unlink()

    for name in ('13-new\ncheck', '13-new check', '13-new-check\n'):
        invalid = checks / name
        shutil.copytree(valid, invalid)
        (invalid / 'check.sh').write_text('touch /output/invalid-executed\n')
        result = subprocess.run(
            command, capture_output=True, text=True,
            timeout=policy['timeout_max_seconds'],
        )
        assert result.returncode == 65, (name, result.stdout, result.stderr)
        assert 'invalid check ID' in result.stderr, result.stderr
        assert not (output / 'valid-executed').exists(), name
        assert not (output / 'invalid-executed').exists(), name
        assert not (output / 'results.json').exists(), name
        shutil.rmtree(invalid)
    print('PASS: valid entrypoint execution; invalid IDs exit 65 before execution or results')
