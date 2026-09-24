# Scorecards - AI Context

## Core Principles

### DRY Configuration

Never hardcode magic values (timeouts, API params, thresholds, workflow names, etc.). Configuration lives in:

- `docs/src/config/` - Frontend TypeScript config
- `action/config/` - Bash script config (scoring thresholds, etc.)

Explore these directories to discover available constants, settings, and helper functions.

### DRY Styling

Never hardcode colors in TypeScript/React. Use CSS variables from `docs/css/base/variables.css` via the `getCssVar()` utility in `docs/src/utils/css.ts`.

### DRY Code

Before creating new utilities, explore `docs/src/utils/` for existing implementations. Reuse over reinvent. The frontend uses React + TypeScript with Zustand for state management.

### ESLint Compliance

All code must pass `npm run lint`. Key enforced rules:

- No `console.log()` in frontend code - use `console.error()` or `console.warn()`
- CLI scripts in `checks/` may disable this rule at file top with `/* eslint-disable no-console */`
- `prefer-const`, `no-var`, `eqeqeq`, `curly` are all enforced

### Testing

- **MANDATORY**: Run Playwright tests synchronously - NEVER use `run_in_background: true` for test commands. Background test processes accumulate and cause confusion about test state.
- Prevent HTML report blocking: Use `PLAYWRIGHT_HTML_OPEN=never npx playwright test`
- Test frontend changes with fresh browser context (ES modules cache aggressively)
- Stop only test servers owned by the current session; do not kill shared servers by process-name pattern.

## Module Structure

Primary directories:

- `docs/src/` - Frontend React + TypeScript (see `frontend.md` rule for details)
- `action/` - GitHub Action implementation (bash scripts)
- `checks/` - Quality check scripts (see `checks.md` rule)
- `tests/e2e/` - End-to-end tests (see `playwright.md` rule)
- `.github/workflows/` - GitHub Actions workflows (see `workflows.md` rule)

## Documentation

- Write concise, clear documentation
- Apply DRY - reference existing docs rather than duplicating
- Assume mature technical audience

## Authoring Skills

- Adding or changing a check, its `metadata.json`, fixtures, or focused tests:
  read `.agents/skills/creating-scorecards-checks/SKILL.md` first.
- Adding or changing a remediation descriptor, recipe, fixtures, or authoring
  tests: read `.agents/skills/creating-scorecards-remediations/SKILL.md` first;
  it requires the checks-authoring skill.

## Context-Specific Rules

Detailed guidelines auto-load from `.claude/rules/` when working on relevant files:

- `frontend.md` - Loaded for `docs/src/**` (config details, utilities, examples)
- `checks.md` - Loaded for `checks/**` (script structure, exit codes)
- `bash.md` - Loaded for `**/*.sh` (strict mode, quoting, shared utilities)
- `playwright.md` - Loaded for `tests/e2e/**` (test patterns, helpers, state assertions)
- `workflows.md` - Loaded for `.github/workflows/**` (workflow patterns, secrets)
- `baseline.md` - Loaded for `tests/baseline/**` (regression testing guidelines)

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
