# Service Registry

This directory contains the master registry of all services using the scorecard system.

## services.json

The `services.json` file maintains a list of all registered services with their metadata:

```json
[
  {
    "name": "service-name",
    "org": "organization",
    "repo": "repository-name",
    "url": "https://github.com/org/repo",
    "score": 85,
    "rank": "gold",
    "lastUpdated": "2025-11-13T10:30:00Z"
  }
]
```

This file is automatically updated by the scorecard action when services run their checks.
