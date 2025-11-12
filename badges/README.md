# Scorecard Badges

This directory contains badge JSON files for all services, compatible with shields.io.

## Structure

```
badges/
└── {organization}/
    └── {repository}/
        ├── score.json    # Score badge (0-100)
        └── rank.json     # Rank badge (bronze/silver/gold/platinum)
```

## Example Path

For a repository at `github.com/acme-corp/api-service`:

```
badges/acme-corp/api-service/score.json
badges/acme-corp/api-service/rank.json
```

## Badge JSON Schema

### Score Badge

```json
{
  "schemaVersion": 1,
  "label": "scorecard",
  "message": "85/100",
  "color": "green"
}
```

### Rank Badge

```json
{
  "schemaVersion": 1,
  "label": "rank",
  "message": "Gold",
  "color": "yellow"
}
```

## Using Badges

Add badges to your README using shields.io endpoint:

```markdown
![Score](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/your-org/scorecards/main/badges/acme-corp/api-service/score.json)
![Rank](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/your-org/scorecards/main/badges/acme-corp/api-service/rank.json)
```

Replace `your-org`, `acme-corp`, and `api-service` with your values.

## Color Scheme

**Score Badge Colors:**
- 80-100: `brightgreen`
- 60-79: `green`
- 40-59: `yellow`
- 20-39: `orange`
- 0-19: `red`

**Rank Badge Colors:**
- Platinum: `blue`
- Gold: `yellow`
- Silver: `lightgrey`
- Bronze: `orange`

## Do Not Edit Manually

These files are automatically generated and maintained by the scorecard action.
