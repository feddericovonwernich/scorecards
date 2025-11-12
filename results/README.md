# Service Results

This directory contains scorecard results for all services.

## Structure

```
results/
└── {organization}/
    └── {repository}/
        ├── results.json          # Latest scorecard results
        └── history/               # Historical results (future)
            └── YYYY-MM-DD.json
```

## Example Path

For a repository at `github.com/acme-corp/api-service`:

```
results/acme-corp/api-service/results.json
```

## Results Schema

Each `results.json` file contains:

```json
{
  "service": {
    "org": "acme-corp",
    "repo": "api-service",
    "name": "API Service",
    "team": "Platform Team"
  },
  "score": 85,
  "rank": "gold",
  "passed_checks": 15,
  "total_checks": 18,
  "commit_sha": "abc123...",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": [
    {
      "check_id": "01-readme",
      "name": "README Documentation",
      "status": "pass",
      "weight": 15,
      "stdout": "README found: README.md (1234 characters)",
      ...
    }
  ]
}
```

## Do Not Edit Manually

These files are automatically generated and maintained by the scorecard action.
