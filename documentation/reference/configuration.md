# Configuration Reference

This document describes the `.scorecard/config.yml` configuration file format.

## Overview

The configuration file is **optional**. If not present, scorecards will use sensible defaults extracted from your repository metadata.

The config file provides metadata about your service for the scorecard catalog and allows customization of the scorecard behavior.

## File Location

```
.scorecard/
└── config.yml
```

## Full Example

```yaml
service:
  name: "Authentication Service"
  team: "Identity & Access Management"
  description: "Handles user authentication, authorization, and session management"
  links:
    - name: "API Documentation"
      url: "https://docs.example.com/auth-api"
    - name: "Runbook"
      url: "https://wiki.example.com/runbooks/auth-service"
    - name: "Architecture Diagram"
      url: "https://drive.google.com/diagrams/auth-arch"
    - name: "Dashboard"
      url: "https://grafana.example.com/d/auth-service"
```

## Schema Reference

### `service` (optional)

Metadata about your service.

#### `service.name` (string, optional)

**Default:** Repository name

The display name for your service in the catalog.

```yaml
service:
  name: "My Awesome Service"
```

#### `service.team` (string, optional)

**Default:** None

The team or group that owns this service.

```yaml
service:
  team: "Platform Engineering"
```

#### `service.description` (string, optional)

**Default:** None

A brief description of what this service does.

```yaml
service:
  description: "Provides real-time notifications via WebSockets and push notifications"
```

#### `service.links` (array, optional)

**Default:** Empty

Links to important resources related to this service.

Each link has:
- `name` (string): Display text for the link
- `url` (string): URL to the resource
- `description` (string, optional): Brief description of what the link provides

```yaml
service:
  links:
    - name: "Documentation"
      url: "https://docs.example.com/my-service"
      description: "API reference and implementation guides"
    - name: "Runbook"
      url: "https://wiki.example.com/runbook"
      description: "Incident response and troubleshooting procedures"
    - name: "Metrics Dashboard"
      url: "https://grafana.example.com/dashboard"
```

## Common Patterns

### Minimal Configuration

If you just want to set a nice name:

```yaml
service:
  name: "My Service"
```

### Documentation-Focused

Emphasize documentation and runbooks:

```yaml
service:
  name: "Payment Processing Service"
  team: "Payments Team"
  description: "Handles payment processing, refunds, and transaction management"
  links:
    - name: "API Docs"
      url: "https://docs.example.com/payments"
    - name: "Runbook"
      url: "https://wiki.example.com/payments-runbook"
    - name: "Architecture"
      url: "https://wiki.example.com/payments-architecture"
```

## Best Practices

### 1. Keep Descriptions Concise

Aim for 1-2 sentences. Save detailed documentation for links.

✅ Good:
```yaml
description: "Handles user authentication and authorization via OAuth 2.0"
```

❌ Too long:
```yaml
description: "This service is responsible for handling all aspects of user authentication including login, logout, password resets, OAuth 2.0 integration, JWT token generation and validation, and session management across multiple devices..."
```

### 2. Use Meaningful Team Names

Use the team name as it's commonly known in your org.

```yaml
team: "Platform Engineering"  # ✅ Clear
# vs
team: "eng-platform-team-2"  # ❌ Internal code
```

### 3. Link to Living Documentation

Prefer links to dynamic/maintained resources over static docs.

```yaml
links:
  - name: "API Docs"
    url: "https://docs.example.com/api"  # ✅ Living docs

  # vs

  - name: "API Docs"
    url: "https://github.com/org/repo/blob/main/API.md"  # ❌ Might be outdated
```

### 4. Validate Your YAML

Before committing, validate your YAML syntax:

```bash
# Using yamllint
yamllint .scorecard/config.yml

# Using a Python one-liner
python -c "import yaml; yaml.safe_load(open('.scorecard/config.yml'))"
```

## Template

Here's a template you can copy and fill in:

```yaml
service:
  # Display name for your service
  name: ""

  # Team that owns this service
  team: ""

  # Brief description (1-2 sentences)
  description: ""

  # Important links
  links:
    - name: "Documentation"
      url: ""
    - name: "Runbook"
      url: ""
```

## Questions?

If you have questions about configuration or want to suggest new fields:
- Open an [issue](https://github.com/feddericovonwernich-org/scorecards/issues)
- Start a [discussion](https://github.com/feddericovonwernich-org/scorecards/discussions)
