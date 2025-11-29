# Badges

This directory contains badge JSON files for shields.io integration.

## Structure

```
badges/
└── <org>/
    └── <repo>/
        ├── score.json
        └── rank.json
```

Each badge JSON file follows the shields.io endpoint schema:
- `score.json`: Displays the numerical score (0-100)
- `rank.json`: Displays the rank (bronze, silver, gold, platinum)

Services can embed these badges in their README files using:
```markdown
![Scorecard](https://img.shields.io/endpoint?url=https://YOUR_ORG.github.io/scorecards/badges/ORG/REPO/score.json)
![Rank](https://img.shields.io/endpoint?url=https://YOUR_ORG.github.io/scorecards/badges/ORG/REPO/rank.json)
```
