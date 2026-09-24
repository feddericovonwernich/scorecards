# Contributing to Scorecards

Thank you for your interest in contributing to Scorecards!

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your changes
4. Make your changes
5. Run tests (see Testing section)
6. Submit a pull request

## Development Setup

See the [project documentation](documentation/README.md) for development and operational guides.

## Adding Checks and Remediations

Follow the [Check Development Guide](documentation/guides/check-development-guide.md)
for the complete check and optional remediation workflow. Agent contributors
must also load the matching versioned skill:

- [creating-scorecards-checks](.agents/skills/creating-scorecards-checks/SKILL.md)
- [creating-scorecards-remediations](.agents/skills/creating-scorecards-remediations/SKILL.md)

Use shared utilities from `checks/lib/` and `action/lib/`; see
[`checks/lib/README.md`](checks/lib/README.md).

## Code Style

- **Shell scripts:** Follow Google Shell Style Guide, use shellcheck
- **JavaScript:** Use ESLint with the repository's [configured rules](.eslintrc.json)
- **Python:** Follow PEP 8, use flake8

## Testing

Run the focused command for the changed surface before the broader suite:

```bash
npm run test:js -- tests/unit/javascript/<file>.test.js
bats tests/unit/bash/<file>.bats
pytest tests/unit/python/<file>.py
```

The [authoring walkthrough](documentation/guides/check-development-guide.md#testing-your-check-locally)
owns prerequisites, direct positive/negative fixtures, the production Docker
runner, and the offline remediation harness. Run `npm test` only when broad
regression coverage is needed.

## Pull Request Process

1. Update documentation for any new features
2. Add tests for new functionality
3. Ensure all tests pass
4. Update CHANGELOG.md with your changes
5. Request review from maintainers

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Questions?

Open an issue for questions or discussion.
