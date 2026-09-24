#!/usr/bin/env python3
"""Run the offline harness with a recipe exceeding its former resource limits."""

import importlib.util
import json
from pathlib import Path
import shutil
import tempfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    'authoring', ROOT / 'tests/remediation-authoring-smoke.py',
)
authoring = importlib.util.module_from_spec(spec)
spec.loader.exec_module(authoring)


def main():
    policy = json.loads((ROOT / 'action/config/remediation.json').read_text())
    with tempfile.TemporaryDirectory(prefix='.authoring-resources-', dir=ROOT) as directory:
        base = Path(directory)
        suite = base / 'suite'
        shutil.copytree(ROOT / 'action', suite / 'action')
        check = suite / 'checks/01-resource-regression'
        check.mkdir(parents=True)
        metadata = {
            'name': 'Resource regression', 'description': 'Exercise canonical limits',
            'weight': 1, 'timeout': 10, 'category': 'Scorecards Setup',
            'remediation': {
                'version': 1, 'label': 'Repair fixture', 'timeout': 60,
                'allowed_paths': ['README.md'],
            },
        }
        (check / 'metadata.json').write_text(json.dumps(metadata))
        (check / 'check.sh').write_text(
            '#!/bin/bash\n'
            'if grep -q repaired "$SCORECARD_REPO_PATH/README.md" 2>/dev/null; '
            'then exit 0; else exit 1; fi\n'
        )
        (check / 'remediate.py').write_text(
            'import os, time\nfrom pathlib import Path\n'
            'readme = Path(os.environ["SCORECARD_REPO_PATH"]) / "README.md"\n'
            'if not readme.exists(): raise SystemExit(3)\n'
            'if readme.read_text() == "repaired": raise SystemExit(0)\n'
            'allocation = bytearray(160 * 1024 * 1024)\n'
            'time.sleep(45)\nreadme.write_text("repaired")\n'
        )
        for script in (check / 'check.sh', check / 'remediate.py'):
            script.chmod(0o755)
        authoring.run(['git', 'init', suite])
        authoring.run(['git', '-C', suite, 'add', '.'])
        authoring.run([
            'git', '-C', suite, '-c', 'user.name=resource-test',
            '-c', 'user.email=resource-test@example.invalid', 'commit', '-m', 'fixture',
        ])
        authoring.ROOT = suite
        image, image_id = authoring.immutable_image('scorecards-runtime:local')
        for name, expected in [('failing', 'prepared'), ('not-applicable', 'not_applicable')]:
            fixture = base / f'{name}-fixture'
            fixture.mkdir()
            (fixture / ('README.md' if name == 'failing' else '.keep')).write_text('fixture')
            result = authoring.run_prepare_case(
                base, name, fixture, image, image_id, check.name, expected,
            )
            generated = json.loads((base / name / 'policy.json').read_text())
            for key in policy.keys() - {'enabled', 'runtime_image', 'targets'}:
                assert generated[key] == policy[key], key
            for observation in authoring.docker_observations(base / name / 'docker-observations'):
                host = observation['inspect']['HostConfig']
                assert host['Memory'] == policy['memory_max_bytes']
                assert host['PidsLimit'] == policy['pids_max']
            print(json.dumps(result))


if __name__ == '__main__':
    main()
