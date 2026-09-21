# Action Reference

Technical specification for the Scorecards GitHub Action.

> **Getting started?** See the [Service Installation Guide](../guides/service-installation.md).

## Runtime build

`action/Dockerfile` is shared by scoring and remediation. Build from the `action/`
context, targeting the pilot's Linux amd64 runner:

```sh
docker build --pull --platform linux/amd64 -t scorecards-runtime:local -f action/Dockerfile action
python3 tests/runtime-smoke.py scorecards-runtime:local
```

The smoke check uses real Docker with the policy's resource limits and the executor's
non-root, read-only, no-network mounts. It checks installed tools and Node imports,
then runs the badge check fail → recipe → pass and repeats the recipe byte-for-byte.
It also runs scoring's default entrypoint with the real OpenAPI and badge checks.
Fixtures are disposable and local; it does not publish or contact a service.

Build inputs are pinned by the Ubuntu and official Node image digests in the
Dockerfile, a signed Ubuntu archive snapshot, and `action/package-lock.json`
(integrity-checked `npm ci`, lifecycle scripts disabled). Node remains 20.20.2;
there is no downloaded installer script. The action lock is seeded from the
repository lock to preserve existing dependency versions, not upgrade packages.
For an intentional dependency change, update the action manifest and lock together.

This guarantees **pinned dependency selection**, not **bit-for-bit rebuilds**.
Docker/BuildKit, layer timestamps, apt maintainer scripts and provenance can change
output bytes. A published registry digest identifies one immutable artifact, not
proof that two independent builds match. Snapshot/registry availability is still
required; [Ubuntu](https://snapshot.ubuntu.com/) documents at least two years of snapshot retention. Refresh pins
through reviewed changes for security updates; never fall back to moving inputs.

Publication and runner access are separate gates; see
[runtime publication and activation](../architecture/flows/remediation-flow.md#publicación-del-runtime).

### Pilot build evidence (2026-09-21)

Source: parent `911a80a5e3a550ffbbf894a80302ea601e66c134` plus the runtime
changes accompanying this record. Docker Engine 29.6.0, Linux amd64. Two
`--pull --no-cache` builds using the command above succeeded; both executed apt
against `20260921T000000Z` and installed the same 261 OS packages and the same
17 production npm packages. All 351 action-lock entries (including development
dependencies not installed in the image) preserve root-lock versions and integrity.

| Input | SHA-256 |
| --- | --- |
| `action/Dockerfile` | `666e4362fbb013b852be762758a08448ee667bbb58b3d6dc91581e7a7c640cec` |
| `action/package.json` | `6b764f5be39351801426f87e39b9d3e0121403db890d184b9a63e4d518191d4e` |
| `action/package-lock.json` | `ac102b46828bf06cfe2aa2a9bd5f6e5747a9398701b48ad5d88089a592eae418` |

Local image IDs **differed**:

- First: `sha256:4683a18fb939b6239383ff3ab980bbc7c97f371ade0dd5566eca08f41542992d`
- Rebuild: `sha256:c7334ef9d9e8c72796d5ea791fce489e4f909113da97467c2d577c547048ea8b`

These are not published registry digests. Bit-for-bit reproducibility was not
achieved; dependency inventories and functional checks matched. Both images passed
`tests/runtime-smoke.py`: UID 1000, loopback only, zero effective capabilities,
NoNewPrivs, read-only code/root, no credentials/socket/service Git data, writable
recipe workspace, badge fail-to-pass and byte-identical second application.
Scoring's real OpenAPI and badge checks passed; Node 20.20.2, npm 10.8.2,
Python 3.10.12, Bash 5.1.16, Git 2.34.1, jq 1.6 and compiler/venv tools remained
available. The 34 existing remediation/provenance Bats checks and `npm run lint`
passed (lint reported only the existing browser-mapping data-age warning).

Workflow YAML and shell syntax were checked locally; no dispatch, push, registry
publication, permission/visibility change or activation was performed. Remote
registry digest/access verification remains a post-integration operation.

## Inputs

| Parameter           | Required | Default            | Description                                                                                                                                                                                                        |
| ------------------- | -------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `github-token`      | Yes      | -                  | Token used for GitHub API calls and, when `scorecards-repo` is set, catalog writes. Use `SCORECARDS_CATALOG_TOKEN` for cross-repository catalog access; a service's `GITHUB_TOKEN` does not automatically have it. |
| `scorecards-repo`   | No       | Empty              | Central scorecards repository where results are stored (format: `owner/repo`). Set it to publish results; when empty, scoring completes without catalog publication.                                               |
| `scorecards-branch` | No       | `catalog`          | Branch to commit results to in the central repository.                                                                                                                                                             |
| `service-workspace` | No       | `GITHUB_WORKSPACE` | Service checkout directory when Scorecards is checked out separately; prevents platform files from being scored as service files.                                                                                  |

### Example

Use the maintained [workflow template](../examples/scorecard-workflow-template.yml) for separate service/platform checkouts and actual revision provenance. The older remote Action invocation remains usable for scoring but may omit remediation eligibility when source identity cannot be established.

## Outputs

| Output          | Type   | Description                             |
| --------------- | ------ | --------------------------------------- |
| `score`         | Number | Calculated score (0-100)                |
| `rank`          | String | Rank: bronze, silver, gold, or platinum |
| `passed-checks` | Number | Number of checks that passed            |
| `total-checks`  | Number | Total number of checks run              |
| `results-file`  | String | Path to the results JSON file           |

### Example

```yaml
- name: Run Scorecards
  id: scorecard
  uses: feddericovonwernich-org/scorecards/action@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}

- name: Use Scorecard Results
  run: |
    echo "Score: ${{ steps.scorecard.outputs.score }}"
    echo "Rank: ${{ steps.scorecard.outputs.rank }}"
    echo "Passed: ${{ steps.scorecard.outputs.passed-checks }}/${{ steps.scorecard.outputs.total-checks }}"
```

## Badge URLs

Scorecards generates badge JSON files compatible with shields.io:

**Score badge:**

```
https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR-ORG/scorecards/catalog/badges/your-org/your-repo/score.json
```

**Rank badge:**

```
https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR-ORG/scorecards/catalog/badges/your-org/your-repo/rank.json
```

Replace:

- `YOUR-ORG/scorecards` - Your organization's central scorecards repository
- `your-org/your-repo` - Your service's organization and repository name

## Score Calculation

Each check has a weight (1-20) indicating its importance. The score is calculated as:

```
score = (sum of passed check weights / sum of all check weights) × 100
```

**Example:**

- Check A (weight: 10): Pass ✓
- Check B (weight: 15): Fail ✗
- Check C (weight: 5): Pass ✓

Score = (10 + 5) / (10 + 15 + 5) × 100 = 50

## Ranks

| Rank        | Score Range | Meaning                                   |
| ----------- | ----------- | ----------------------------------------- |
| 🏆 Platinum | 90-100      | Exemplary - exceeds all standards         |
| 🥇 Gold     | 75-89       | Excellent - meets all important standards |
| 🥈 Silver   | 50-74       | Good - meets most standards               |
| 🥉 Bronze   | 0-49        | Needs improvement                         |

## See Also

- [Service Installation Guide](../guides/service-installation.md) - Add Scorecards to your service
- [Configuration Reference](configuration.md) - Configure .scorecard/config.yml
- [Workflows Reference](workflows.md) - GitHub Actions workflow specifications
