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

See `documentation/development/local-setup.md` for detailed setup instructions.

## Adding a New Check

See `documentation/development/adding-a-check.md` for a guide on creating new checks.

## Using Shared Libraries

Checks should use shared utilities from `/checks/lib/` and `/action/lib/` to avoid code duplication.

See `/checks/lib/README.md` for documentation on available shared utilities.

## Code Style

- **Shell scripts:** Follow Google Shell Style Guide, use shellcheck
- **JavaScript:** Follow Airbnb style guide, use ESLint
- **Python:** Follow PEP 8, use flake8

## Testing

```bash
# Run all tests
npm test           # JavaScript tests (Jest)
bats tests/        # Bash tests
pytest             # Python tests
```

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
