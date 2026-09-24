#!/usr/bin/env python3
"""Exercise remediation validation and prepare locally without publication."""

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
RUNNER = ROOT / 'action/utils/run-remediation.sh'
VALIDATOR = ROOT / 'action/utils/validate-check.sh'
REMEDIATION_LIB = ROOT / 'action/lib/remediation.sh'


def run(command, *, env=None, expected=0, timeout=180):
    result = subprocess.run(
        [str(part) for part in command],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    assert result.returncode == expected, (
        command,
        result.returncode,
        result.stdout,
        result.stderr,
    )
    return result


def immutable_image(image):
    details = json.loads(run(['docker', 'image', 'inspect', image]).stdout)[0]
    digests = details.get('RepoDigests') or []
    assert digests, f'{image} has no immutable RepoDigest; rebuild it with Docker'
    return digests[0]


def sandbox_command(image, policy, workspace, *, writable, entrypoint, script):
    mount = f'type=bind,src={workspace.resolve()},dst=/workspace'
    if not writable:
        mount += ',readonly'
    return [
        'docker', 'run', '--rm', '--network=none', '--read-only',
        '--cap-drop=ALL', '--security-opt=no-new-privileges',
        f'--user={os.getuid()}:{os.getgid()}',
        '--pids-limit', str(policy['pids_max']),
        '--memory', str(policy['memory_max_bytes']),
        '--cpus', policy['cpu_max'],
        '--tmpfs', f"/tmp:rw,nosuid,nodev,noexec,size={policy['memory_max_bytes']}",
        '--mount', f'type=bind,src={(ROOT / "checks").resolve()},dst=/checks,readonly',
        '--mount', f'type=bind,src={(ROOT / "action/lib").resolve()},dst=/action/lib,readonly',
        '--mount', mount,
        '--env', 'SCORECARD_REPO_PATH=/workspace',
        '--env', 'SCORECARDS_REPO=acme/scorecards',
        '--env', 'SERVICE_REPOSITORY=acme/service',
        '--env', 'SCORECARDS_BRANCH=catalog',
        '--entrypoint', entrypoint,
        image,
        script,
    ]


def check_command(image, policy, workspace, check_id):
    check_dir = ROOT / 'checks' / check_id
    scripts = [path for path in (
        check_dir / 'check.sh', check_dir / 'check.py', check_dir / 'check.js'
    ) if path.is_file()]
    assert len(scripts) == 1
    entrypoint = {'sh': '/bin/bash', 'py': 'python3', 'js': 'node'}[scripts[0].suffix[1:]]
    return sandbox_command(
        image,
        policy,
        workspace,
        writable=False,
        entrypoint=entrypoint,
        script=f'/checks/{check_id}/{scripts[0].name}',
    )


def recipe_command(image, policy, workspace, check_id):
    check_dir = ROOT / 'checks' / check_id
    recipes = [path for path in (
        check_dir / 'remediate.sh',
        check_dir / 'remediate.py',
        check_dir / 'remediate.js',
    ) if path.is_file()]
    assert len(recipes) == 1
    entrypoint = {'sh': '/bin/bash', 'py': 'python3', 'js': 'node'}[recipes[0].suffix[1:]]
    return sandbox_command(
        image,
        policy,
        workspace,
        writable=True,
        entrypoint=entrypoint,
        script=f'/checks/{check_id}/{recipes[0].name}',
    )


def write_gh_stub(path):
    path.write_text('''#!/bin/bash
set -euo pipefail
printf '%s\\n' "$*" >> "$GH_CALLS"
case " $* " in
  *" --method POST "*) exit 99 ;;
  *" /user "*"--jq .login "*) printf '%s\\n' publisher ;;
  *" /repos/acme/service/git/ref/heads/trunk "*"--jq .object.sha "*) printf '%s\\n' "$BASE_SHA" ;;
  *" /repos/acme/service "*"--jq .default_branch "*) printf '%s\\n' trunk ;;
  *" /repos/acme/scorecards/git/ref/heads/main "*"--jq .object.sha "*) printf '%s\\n' "$GITHUB_SHA" ;;
  *" /repos/acme/scorecards "*"--jq .default_branch "*) printf '%s\\n' main ;;
  *" /repos/acme/service/pulls?state=open"*) printf '%s\\n' '[]' ;;
  *) exit 98 ;;
esac
''')
    path.chmod(0o755)


def create_remote(case_dir, fixture):
    remote = case_dir / 'service.git'
    seed = case_dir / 'seed'
    run(['git', 'init', '--bare', remote])
    shutil.copytree(fixture, seed)
    run(['git', 'init', seed])
    run(['git', '-C', seed, 'config', 'user.name', 'authoring-smoke'])
    run(['git', '-C', seed, 'config', 'user.email', 'authoring-smoke@example.invalid'])
    run(['git', '-C', seed, 'add', '-A'])
    run(['git', '-C', seed, 'commit', '-m', 'fixture'])
    run(['git', '-C', seed, 'branch', '-M', 'trunk'])
    run(['git', '-C', seed, 'remote', 'add', 'origin', remote])
    run(['git', '-C', seed, 'push', 'origin', 'trunk'])
    run(['git', '--git-dir', remote, 'symbolic-ref', 'HEAD', 'refs/heads/trunk'])
    sha = run(['git', '--git-dir', remote, 'rev-parse', 'refs/heads/trunk']).stdout.strip()
    return remote, sha


def write_inputs(case_dir, image, check_id, service_sha):
    suite_sha = run(['git', 'rev-parse', 'HEAD']).stdout.strip()
    policy = {
        'version': 1,
        'enabled': True,
        'timeout_max_seconds': 30,
        'diff_max_bytes': 1048576,
        'output_max_bytes': 65536,
        'memory_max_bytes': 134217728,
        'pids_max': 64,
        'cpu_max': '1',
        'runtime_image': image,
        'targets': {
            'acme/service': {
                'check_ids': [check_id],
                'actors': ['allowed'],
                'publisher_login': 'publisher',
                'protection_evidence': 'offline authoring smoke',
            },
        },
    }
    request = {
        'org': 'acme',
        'repo': 'service',
        'check_id': check_id,
        'service_sha': service_sha,
        'suite_sha': suite_sha,
        'request_id': 'd2719c3d-50b4-4e03-a2b1-0b9258760e2d',
    }
    policy_file = case_dir / 'policy.json'
    request_file = case_dir / 'request.json'
    policy_file.write_text(json.dumps(policy))
    request_file.write_text(json.dumps(request))
    return policy, policy_file, request_file, suite_sha


def environment(case_dir, remote, service_sha, suite_sha):
    bin_dir = case_dir / 'bin'
    bin_dir.mkdir()
    write_gh_stub(bin_dir / 'gh')
    gh_calls = case_dir / 'gh.calls'
    gh_calls.touch()
    env = os.environ.copy()
    env.update({
        'PATH': f'{bin_dir}:{env["PATH"]}',
        'BASE_SHA': service_sha,
        'GH_CALLS': str(gh_calls),
        'GITHUB_REPOSITORY': 'acme/scorecards',
        'GITHUB_REF': 'refs/heads/main',
        'GITHUB_SHA': suite_sha,
        'GITHUB_ACTOR': 'allowed',
        'GITHUB_TRIGGERING_ACTOR': 'allowed',
        'GITHUB_RUN_ID': '42',
        'GITHUB_RUN_ATTEMPT': '1',
        'SCORECARDS_WORKFLOW_TOKEN': 'offline-token',
        'GH_TOKEN': 'offline-token',
        'GIT_CONFIG_COUNT': '1',
        'GIT_CONFIG_KEY_0': f'url.{remote}.insteadOf',
        'GIT_CONFIG_VALUE_0': 'https://github.com/acme/service.git',
        'GIT_ALLOW_PROTOCOL': 'file',
    })
    return env, gh_calls


def validate_descriptor(check_id, policy_file):
    check_dir = ROOT / 'checks' / check_id
    projection = json.loads(run([VALIDATOR, check_dir]).stdout)
    descriptor = json.loads(run([
        'bash', '-c', 'source "$1"; load_remediation_descriptor "$2" "$3"',
        '_', REMEDIATION_LIB, check_dir, policy_file,
    ]).stdout)
    assert projection['remediation'] == descriptor
    return descriptor


def assert_only_default_ref(remote):
    refs = run([
        'git', '--git-dir', remote, 'for-each-ref',
        'refs/heads', '--format=%(refname)',
    ]).stdout.splitlines()
    assert refs == ['refs/heads/trunk'], refs


def run_prepare_case(base, name, fixture, image, check_id, expected_status):
    case_dir = base / name
    case_dir.mkdir()
    remote, service_sha = create_remote(case_dir, fixture)
    policy, policy_file, request_file, suite_sha = write_inputs(
        case_dir, image, check_id, service_sha,
    )
    env, gh_calls = environment(case_dir, remote, service_sha, suite_sha)
    validate_descriptor(check_id, policy_file)
    run(check_command(image, policy, fixture, check_id), expected=1)
    run([RUNNER, 'validate', request_file, policy_file, ROOT], env=env)
    work = case_dir / 'work'
    run([RUNNER, 'prepare', request_file, policy_file, ROOT, work], env=env)
    assert_only_default_ref(remote)
    assert '--method POST' not in gh_calls.read_text()

    if expected_status == 'prepared':
        prepared = json.loads((work / 'prepared.json').read_text())
        result_status = 'prepared'
        changed = set(prepared['changed_paths'])
        allowed = set(prepared['allowed_paths'])
        assert changed and changed <= allowed
        run(check_command(image, policy, Path(prepared['tree']), check_id), expected=0)

        second_baseline = case_dir / 'second-baseline'
        shutil.copytree(prepared['tree'], second_baseline)
        run(recipe_command(image, policy, Path(prepared['tree']), check_id))
        unchanged = run([
            'bash', '-c', 'source "$1"; validate_sandbox_tree "$2" "$3" "$4" "$5"',
            '_', REMEDIATION_LIB, second_baseline, prepared['tree'],
            json.dumps(prepared['allowed_paths']), str(policy['diff_max_bytes']),
        ]).stdout.strip()
        assert json.loads(unchanged) == []
    else:
        result_status = json.loads((work / 'remediation-result.json').read_text())['status']
        assert result_status == expected_status
        assert not (work / 'prepared.json').exists()
        if expected_status == 'not_applicable':
            recipe_tree = case_dir / 'not-applicable-recipe'
            shutil.copytree(fixture, recipe_tree)
            run(recipe_command(image, policy, recipe_tree, check_id), expected=3)

    return {'status': result_status, 'default_ref_unchanged': True}


def assert_sandbox(image, policy):
    with tempfile.TemporaryDirectory(prefix='.authoring-sandbox-', dir=ROOT) as directory:
        workspace = Path(directory)
        workspace.chmod(0o777)
        probe = '''
import os, pathlib, socket
assert os.getuid() != 0
status = pathlib.Path('/proc/self/status').read_text().splitlines()
assert int(next(x.split()[1] for x in status if x.startswith('CapEff:')), 16) == 0
assert next(x.split()[1] for x in status if x.startswith('NoNewPrivs:')) == '1'
assert [name for _, name in socket.if_nameindex()] == ['lo']
assert not any('TOKEN' in key or 'SECRET' in key for key in os.environ)
assert not pathlib.Path('/workspace/.git').exists()
pathlib.Path('/workspace/probe').write_text('writable workspace')
for parent in ('/', '/checks', '/action/lib'):
    try:
        pathlib.Path(parent, '.write-probe').write_text('unexpected')
    except OSError:
        pass
    else:
        raise AssertionError('writable: ' + parent)
'''
        command = sandbox_command(
            image,
            policy,
            workspace,
            writable=True,
            entrypoint='python3',
            script='-c',
        )
        command.append(probe)
        run(command)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=True)
    parser.add_argument('--check', required=True)
    parser.add_argument('--failing', required=True, type=Path)
    parser.add_argument('--not-applicable', required=True, type=Path)
    args = parser.parse_args()

    check_dir = ROOT / 'checks' / args.check
    assert check_dir.is_dir()
    assert args.failing.is_dir() and args.not_applicable.is_dir()
    image = immutable_image(args.image)

    with tempfile.TemporaryDirectory(prefix='.remediation-authoring-', dir=ROOT) as directory:
        base = Path(directory)
        prepared = run_prepare_case(
            base, 'failing', args.failing.resolve(), image, args.check, 'prepared',
        )
        not_applicable = run_prepare_case(
            base,
            'not-applicable',
            args.not_applicable.resolve(),
            image,
            args.check,
            'not_applicable',
        )
        policy = json.loads((base / 'failing/policy.json').read_text())
        assert_sandbox(image, policy)

    print(json.dumps({
        'check': args.check,
        'image': image,
        'validate': 'passed',
        'prepare': prepared,
        'idempotent': True,
        'not_applicable': not_applicable,
        'sandbox': 'non-root, network-none, read-only trusted inputs',
        'published': False,
    }, indent=2))


if __name__ == '__main__':
    main()
