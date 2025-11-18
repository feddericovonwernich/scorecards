# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Scorecards, please report it responsibly.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please email security concerns to the repository maintainer or report privately via GitHub's Security tab. We will respond within 48 hours and work with you to understand and resolve the issue.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |

## Security Considerations

### GitHub Token Permissions

When using Scorecards, ensure your GitHub token has the minimum required permissions:
- `contents: write` (for updating catalog)
- `actions: read` (for workflow information)

### Running Checks Safely

- Checks run in Docker containers for isolation
- Checks never modify the repository being scanned
- Checks have 30-second timeouts to prevent runaway processes

## Best Practices

1. Use a SCORECARD_PAT with minimal required permissions
2. Store tokens as GitHub Secrets, never in code
3. Regularly rotate access tokens
4. Review check implementations before adding new checks
