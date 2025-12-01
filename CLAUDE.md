# Scorecards - AI Context

## Core Principles

### DRY Configuration
Never hardcode magic values (timeouts, API params, thresholds, workflow names, etc.). Configuration lives in:
- `docs/src/config/` - Frontend JavaScript config
- `action/config/` - Bash script config (scoring thresholds, etc.)

Explore these directories to discover available constants, settings, and helper functions.

### DRY Styling
Never hardcode colors in JavaScript. Use CSS variables from `docs/css/base/variables.css` via the `getCssVar()` utility in `docs/src/utils/css.js`.

### DRY Code
Before creating new utilities, explore `docs/src/utils/` for existing implementations. Reuse over reinvent.

### ESLint Compliance
All code must pass `npm run lint`. Key enforced rules:
- No `console.log()` in frontend code - use `console.error()` or `console.warn()`
- CLI scripts in `checks/` may disable this rule at file top with `/* eslint-disable no-console */`
- `prefer-const`, `no-var`, `eqeqeq`, `curly` are all enforced

### Testing
- Run Playwright tests synchronously, never in background
- Prevent HTML report blocking: Use `PLAYWRIGHT_HTML_OPEN=never npx playwright test`
- Test frontend changes with fresh browser context (ES modules cache aggressively)
- Kill leftover servers before testing: `pkill -f "python3 -m http.server"`

## Module Structure

When adding code, follow this structure:
- `docs/src/config/` - Configuration (explore for available options)
- `docs/src/api/` - API integrations (GitHub, registry)
- `docs/src/ui/` - UI components and rendering
- `docs/src/ui/modals/` - Modal components (shared utilities in `shared/`)
- `docs/src/services/` - Business logic (auth, theme, staleness)
- `docs/src/utils/` - Utilities (explore before creating new ones)
- `checks/` - Quality check scripts (CLI tools)

## Documentation
- Write concise, clear documentation
- Apply DRY - reference existing docs rather than duplicating
- Assume mature technical audience

## Context-Specific Rules
Detailed guidelines auto-load from `.claude/rules/` when working on relevant files:
- `frontend.md` - Loaded for `docs/src/**` (config details, utilities, examples)
- `checks.md` - Loaded for `checks/**` (script structure, exit codes)
- `bash.md` - Loaded for `**/*.sh` (strict mode, quoting, shared utilities)
