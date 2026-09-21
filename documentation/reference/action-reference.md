# Action Reference

Technical specification for the Scorecards GitHub Action.

> **Getting started?** See the [Service Installation Guide](../guides/service-installation.md).

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
