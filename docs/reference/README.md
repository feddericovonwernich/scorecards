# Reference Documentation

Complete reference documentation for Scorecards.

## Documents

- **[Check Catalog](check-catalog.md)** - All available checks with descriptions and requirements
- **[Config Schema](config-schema.md)** - .scorecard/config.yml schema and options
- **[Metadata Schema](metadata-schema.md)** - Check metadata.json schema
- **[API](api.md)** - GitHub API usage and interactions

## Quick References

### Score Tiers

| Tier | Score Range | Badge Color | Description |
|------|-------------|-------------|-------------|
| Platinum | 90-100% | Purple | Exceptional quality |
| Gold | 80-89% | Gold | High quality |
| Silver | 60-79% | Silver | Good quality |
| Bronze | 40-59% | Bronze | Basic quality |
| Needs Improvement | 0-39% | Red | Requires attention |

### Check Categories

- **documentation** - Documentation quality (README, API docs, etc.)
- **testing** - Test coverage and quality
- **ci** - Continuous integration configuration
- **api** - API documentation and quality
- **metadata** - Repository metadata (config, license, etc.)

### Configuration File Location

`.scorecard/config.yml` in the root of your repository

### Common Check Weights

- Critical checks (README, License): 10 points
- Important checks (CI, Tests): 7-8 points
- Nice-to-have checks: 3-5 points

See [Check Catalog](check-catalog.md) for complete list with weights.

## File Formats

### Registry Format

The catalog registry stores service data in JSON format:

```json
{
  "repo": "org/service-name",
  "score": 85,
  "rank": "gold",
  "checks_passed": 8,
  "checks_failed": 2,
  "last_updated": "2025-01-15T12:00:00Z",
  "team": "Platform Team",
  "description": "Core API service"
}
```

### Results Format

Individual check results stored in `results.json`:

```json
{
  "score": 85,
  "rank": "gold",
  "total_points": 85,
  "max_points": 100,
  "checks": [
    {
      "id": "01-readme",
      "name": "README Documentation",
      "passed": true,
      "points": 10
    }
  ]
}
```

See [API](api.md) for complete schema documentation.
