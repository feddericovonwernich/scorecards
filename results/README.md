# Service Results

This directory contains scorecard results for each service.

## Structure

```
results/
└── <org>/
    └── <repo>/
        └── results.json
```

Each `results.json` file contains:
- Service metadata (name, organization, repository URL)
- Timestamp of last check
- Individual check results (pass/fail, details)
- Overall score and rank

These files are automatically generated and updated by the scorecard action running in service repositories.
