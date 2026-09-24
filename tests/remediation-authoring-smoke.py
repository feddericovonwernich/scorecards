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
    image_id = details.get('Id', '')
    assert image_id.startswith('sha256:') and len(image_id) == 71
    return f'offline.local/remediation@{image_id}', image_id


def write_docker_observer(path):
    path.write_text('''#!/bin/bash
set -euo pipefail
args=()
for arg; do
    [ "$arg" = --rm ] && continue
    if [ "$arg" = "$OFFLINE_POLICY_IMAGE" ]; then
        args+=("$OFFLINE_EXECUTION_IMAGE")
    else
        args+=("$arg")
    fi
done
if [ "${args[0]:-}" != run ]; then
    if [ "${args[0]:-}" = rm ] && [ "${DOCKER_OBSERVER_CLEANUP:-}" != 1 ]; then
        for arg in "${args[@]:1}"; do
            [ -e "$DOCKER_OBSERVATIONS/owned/$arg" ] && exit 0
        done
    fi
    exec "$REAL_DOCKER" "${args[@]}"
fi
cidfile=
for ((index = 0; index < ${#args[@]}; index++)); do
    [ "${args[index]}" = --cidfile ] && cidfile="${args[index + 1]}"
done
count="$(cat "$DOCKER_OBSERVATIONS/count" 2>/dev/null || printf 0)"
printf '%s\n' "$((count + 1))" > "$DOCKER_OBSERVATIONS/count"
observation="$DOCKER_OBSERVATIONS/$count"
mkdir "$observation"
set +e
"$REAL_DOCKER" "${args[@]}"
rc=$?
set -e
cid="$(cat "$cidfile")"
printf '%s\n' "$cid" > "$observation/cid"
touch "$DOCKER_OBSERVATIONS/owned/$cid"
"$REAL_DOCKER" inspect "$cid" > "$observation/inspect.json"
printf '%s\n' "$rc" > "$observation/exit"
exit "$rc"
''')
    path.chmod(0o755)


def docker_observations(path):
    observations = []
    for directory in sorted(
        (entry for entry in path.iterdir() if entry.is_dir() and entry.name != 'owned'),
        key=lambda entry: int(entry.name),
    ):
        observations.append({
            'cid': (directory / 'cid').read_text().strip(),
            'inspect': json.loads((directory / 'inspect.json').read_text())[0],
            'exit': int((directory / 'exit').read_text()),
        })
    return observations


def assert_prepare_sandbox(observations, work, expected_exits, execution_image):
    assert [observation['exit'] for observation in observations] == expected_exits
    assert not (work / 'tree/.git').exists()
    workspace_readonly = 0
    workspace_writable = 0
    for observation in observations:
        details = observation['inspect']
        host = details['HostConfig']
        config = details['Config']
        assert config['Image'] == execution_image
        assert int(config['User'].split(':', 1)[0]) > 0
        assert details['State']['ExitCode'] == observation['exit']
        assert host['NetworkMode'] == 'none'
        assert host['ReadonlyRootfs'] is True
        assert host['CapDrop'] == ['ALL']
        assert host['CapAdd'] in (None, [])
        assert host['Privileged'] is False
        assert host['Devices'] in (None, [])
        assert host['Binds'] in (None, [])
        assert host['SecurityOpt'] in (
            ['no-new-privileges'],
            ['no-new-privileges:true'],
        )
        assert set(host['Tmpfs']) == {'/tmp'}
        assert {'rw', 'nosuid', 'nodev', 'noexec'} <= set(host['Tmpfs']['/tmp'].split(','))
        assert not any(
            'TOKEN' in item or 'SECRET' in item for item in config['Env']
        )
        mounts = details['Mounts']
        assert len(mounts) == 3
        expected_sources = {
            '/checks': (ROOT / 'checks').resolve(),
            '/action/lib': (ROOT / 'action/lib').resolve(),
            '/workspace': (work / 'tree').resolve(),
        }
        for destination, source in expected_sources.items():
            mount = next(mount for mount in mounts if mount['Destination'] == destination)
            assert Path(mount['Source']).resolve() == source
            assert mount['RW'] is (destination == '/workspace' and observations[1] is observation)
        workspace_readonly += int(not next(
            mount['RW'] for mount in mounts if mount['Destination'] == '/workspace'
        ))
        workspace_writable += int(next(
            mount['RW'] for mount in mounts if mount['Destination'] == '/workspace'
        ))
    assert workspace_readonly == len(observations) - 1
    assert workspace_writable == 1


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


def environment(case_dir, remote, service_sha, suite_sha, policy_image, execution_image):
    bin_dir = case_dir / 'bin'
    bin_dir.mkdir()
    write_gh_stub(bin_dir / 'gh')
    write_docker_observer(bin_dir / 'docker')
    gh_calls = case_dir / 'gh.calls'
    docker_observation_dir = case_dir / 'docker-observations'
    gh_calls.touch()
    docker_observation_dir.mkdir()
    (docker_observation_dir / 'owned').mkdir()
    real_docker = shutil.which('docker')
    assert real_docker
    env = os.environ.copy()
    env.update({
        'PATH': f'{bin_dir}:{env["PATH"]}',
        'BASE_SHA': service_sha,
        'GH_CALLS': str(gh_calls),
        'DOCKER_OBSERVATIONS': str(docker_observation_dir),
        'REAL_DOCKER': real_docker,
        'OFFLINE_POLICY_IMAGE': policy_image,
        'OFFLINE_EXECUTION_IMAGE': execution_image,
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
    return env, gh_calls, docker_observation_dir


def validate_descriptor(check_id, policy_file):
    check_dir = ROOT / 'checks' / check_id
    projection = json.loads(run([VALIDATOR, check_dir]).stdout)
    descriptor = json.loads(run([
        'bash', '-c', 'source "$1"; load_remediation_descriptor "$2" "$3"',
        '_', REMEDIATION_LIB, check_dir, policy_file,
    ]).stdout)
    assert projection['remediation'] == descriptor
    return descriptor


def assert_only_default_ref(remote, service_sha):
    refs = run([
        'git', '--git-dir', remote, 'for-each-ref',
        'refs/heads', '--format=%(refname)',
    ]).stdout.splitlines()
    assert refs == ['refs/heads/trunk'], refs
    assert run([
        'git', '--git-dir', remote, 'rev-parse', 'refs/heads/trunk',
    ]).stdout.strip() == service_sha


def cleanup_observed(docker_observation_dir, env):
    cleanup_env = env | {'DOCKER_OBSERVER_CLEANUP': '1'}
    for cid_file in (docker_observation_dir / 'owned').iterdir():
        run(['docker', 'rm', '-f', cid_file.name], env=cleanup_env)


def prepare(
    request_file, policy_file, work, env, docker_observation_dir, expected_exits,
    execution_image,
):
    before = len(docker_observations(docker_observation_dir))
    try:
        run([RUNNER, 'prepare', request_file, policy_file, ROOT, work], env=env)
        observations = docker_observations(docker_observation_dir)[before:]
        assert_prepare_sandbox(observations, work, expected_exits, execution_image)
        return observations
    except BaseException:
        cleanup_observed(docker_observation_dir, env)
        raise


def run_prepare_case(
    base, name, fixture, policy_image, execution_image, check_id, expected_status,
):
    case_dir = base / name
    case_dir.mkdir()
    remote, service_sha = create_remote(case_dir, fixture)
    policy, policy_file, request_file, suite_sha = write_inputs(
        case_dir, policy_image, check_id, service_sha,
    )
    env, gh_calls, docker_observation_dir = environment(
        case_dir, remote, service_sha, suite_sha, policy_image, execution_image,
    )
    validate_descriptor(check_id, policy_file)
    run([RUNNER, 'validate', request_file, policy_file, ROOT], env=env)
    work = case_dir / 'work'
    observations = prepare(
        request_file, policy_file, work, env, docker_observation_dir,
        [1, 0, 0] if expected_status == 'prepared' else [1, 3],
        execution_image,
    )
    try:
        assert_only_default_ref(remote, service_sha)
        assert '--method POST' not in gh_calls.read_text()

        if expected_status == 'prepared':
            prepared = json.loads((work / 'prepared.json').read_text())
            changed = set(prepared['changed_paths'])
            allowed = set(prepared['allowed_paths'])
            assert changed and changed <= allowed
            recipe = observations[1]
            snapshot = case_dir / 'second-baseline'
            shutil.copytree(prepared['tree'], snapshot)
            run(['docker', 'start', '--attach', recipe['cid']], env=env)
            replay = json.loads(run(['docker', 'inspect', recipe['cid']], env=env).stdout)[0]
            assert replay['Id'] == recipe['inspect']['Id']
            assert replay['State']['ExitCode'] == 0
            unchanged = run([
                'bash', '-c', 'source "$1"; validate_sandbox_tree "$2" "$3" "$4" "$5"',
                '_', REMEDIATION_LIB, snapshot, prepared['tree'],
                json.dumps(prepared['allowed_paths']), str(policy['diff_max_bytes']),
            ]).stdout.strip()
            assert json.loads(unchanged) == []
            assert_only_default_ref(remote, service_sha)
            return {
                'status': 'prepared',
                'precheck': 1,
                'recipe_exit': 0,
                'postcheck': 0,
                'second_application': 'byte-and-mode-identical',
                'default_ref_unchanged': True,
            }

        result_status = json.loads((work / 'remediation-result.json').read_text())['status']
        assert result_status == expected_status
        assert not (work / 'prepared.json').exists()
        return {
            'status': result_status,
            'recipe_exit': 3,
            'default_ref_unchanged': True,
        }
    finally:
        cleanup_observed(docker_observation_dir, env)


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
    policy_image, execution_image = immutable_image(args.image)

    with tempfile.TemporaryDirectory(prefix='.remediation-authoring-', dir=ROOT) as directory:
        base = Path(directory)
        prepared = run_prepare_case(
            base, 'failing', args.failing.resolve(), policy_image, execution_image,
            args.check, 'prepared',
        )
        not_applicable = run_prepare_case(
            base,
            'not-applicable',
            args.not_applicable.resolve(),
            policy_image,
            execution_image,
            args.check,
            'not_applicable',
        )

    print(json.dumps({
        'check': args.check,
        'image': execution_image,
        'validate': 'passed',
        'prepare': prepared,
        'idempotent': True,
        'not_applicable': not_applicable,
        'sandbox': 'production containers: non-root, network-none, zero capabilities, read-only trusted inputs',
        'published': False,
    }, indent=2))


if __name__ == '__main__':
    main()
