# Service Registry

This directory contains the registry of all services that have run scorecards.

## Files

- **services.json**: Automatically maintained list of all registered services with their latest scores and metadata

## Schema

Each entry in `services.json` has the following structure:

```json
{
  "org": "organization-name",
  "repo": "repository-name",
  "name": "Service Display Name",
  "team": "Team Name",
  "score": 85,
  "rank": "gold",
  "last_updated": "2024-01-15T10:30:00Z"
}
```

## How It Works

When a service runs scorecards for the first time, it's automatically added to the registry. On subsequent runs, its entry is updated with the latest score and timestamp.

## Do Not Edit Manually

This file is automatically maintained by the scorecard action. Manual edits may be overwritten.
