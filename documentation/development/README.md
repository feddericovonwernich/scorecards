# Development Documentation

Documentation for contributors and developers working on the Scorecards system.

## Documents

- **[Contributing](contributing.md)** - How to contribute to Scorecards
- **[Testing](testing.md)** - Running and writing tests
- **[Local Setup](local-setup.md)** - Development environment setup
- **[Architecture Decisions](decisions/)** - ADRs and design documents

## Quick Start for Contributors

1. Read [Contributing Guidelines](contributing.md)
2. Set up your [Local Environment](local-setup.md)
3. Review [Testing Guide](testing.md)
4. Check existing [Architecture Decisions](decisions/)
5. Make your changes and submit a PR

## Project Structure

```
scorecards/
├── action/          # GitHub Action implementation
│   ├── entrypoint.sh
│   └── utils/
├── checks/          # Individual check implementations
│   ├── 01-readme/
│   ├── 02-license/
│   └── ...
├── catalog/         # Catalog web UI
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── docs/            # Documentation (you are here)
├── tests/           # Test suite
└── scripts/         # Utility scripts
```

## Development Workflow

### Making Changes

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Write code following existing patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Run tests**
   ```bash
   # Run all tests
   npm test

   # Run specific test suite
   npm run test:checks
   ```

4. **Lint code**
   ```bash
   npm run lint
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "Add feature: description"
   git push origin feature/your-feature-name
   ```

6. **Submit PR**
   - Open pull request on GitHub
   - Fill in PR template
   - Wait for CI checks to pass
   - Respond to review feedback

### Adding a New Check

1. Create directory: `checks/NN-check-name/`
2. Add `check.{sh,py,js}` script
3. Add `metadata.json` with name, weight, description
4. Add tests in `tests/checks/`
5. Update check catalog documentation
6. Submit PR

See the [Check Development Guide](../reference/check-catalog.md) for a detailed guide.

## Testing Strategy

- **Unit tests**: Test individual checks in isolation
- **Integration tests**: Test check execution with real repositories
- **End-to-end tests**: Test complete workflow from trigger to catalog update
- **Test repositories**: Dedicated repos with known characteristics

See [Testing](testing.md) for complete guide.

## Code Style

- **Shell scripts**: Follow Google Shell Style Guide
- **Python**: Follow PEP 8
- **JavaScript**: Use ESLint configuration in `.eslintrc.json`
- **Documentation**: Use Markdown, follow existing structure

## Architecture Decisions

Major design decisions are documented as ADRs (Architecture Decision Records):

- [ADR 001: Hybrid Authentication](decisions/001-hybrid-auth.md)

When making significant architectural changes, create a new ADR documenting:
- Context and problem
- Decision and rationale
- Consequences (positive and negative)
- Implementation details

## Getting Help

- Review existing [documentation](../README.md)
- Check [architecture docs](../architecture/overview.md)
- Look at similar existing code
- Ask questions in pull requests
- Open a discussion issue

## Release Process

1. Update version in relevant files
2. Update CHANGELOG.md
3. Tag release: `git tag v1.0.0`
4. Push tags: `git push --tags`
5. Create GitHub release with notes
6. Monitor for issues after release

## Branch Strategy

- **main**: Production code, all changes merge here
- **catalog**: Auto-generated GitHub Pages branch (never push manually)
- **feature/***: Feature development branches
- **fix/***: Bug fix branches
- **docs/***: Documentation-only changes
