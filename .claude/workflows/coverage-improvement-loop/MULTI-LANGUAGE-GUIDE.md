# Multi-Language Support Guide

This workflow now supports multi-component, multi-language projects.

## Quick Start

### 1. Initialize Configuration (First Time Only)

```bash
/init-coverage-config
```

This creates `.claude/rules/testing-workflows-config.md` with component-specific settings.

### 2. Verify Configuration

Edit `.claude/rules/testing-workflows-config.md` to ensure:
- Component names are correct
- Coverage commands work in your environment
- Tier patterns match your project structure
- Test utilities are accurate

### 3. Run Workflow

**Backend only:**
```bash
/workflow:run-workflow coverage-improvement-loop --components=backend
```

**Frontend only:**
```bash
/workflow:run-workflow coverage-improvement-loop --components=frontend
```

**Both components:**
```bash
/workflow:run-workflow coverage-improvement-loop --components=backend,frontend
```

**Auto-detect all components:**
```bash
/workflow:run-workflow coverage-improvement-loop --components=all
```

## How It Works

### Phase 0: Prerequisites Check

**Step 0: Load Configuration**
- Reads `.claude/rules/testing-workflows-config.md`
- Parses component definitions
- Auto-detects components if `--components=all`

**Step 1: Verify Dependencies (Per Component)**
- Loops through each component
- Checks test runner installation (pytest, npm, vitest, etc.)
- Reports all failures at once

**Step 2: Run Coverage Measurement (Per Component)**
- Executes component-specific coverage commands
- Parses coverage JSON (supports pytest-cov, vitest formats)
- Calculates overall coverage (arithmetic mean)

**Step 3: Calculate Tier Coverage (Per Component)**
- Extracts tier patterns from config
- Matches files to tiers (Critical, High-Risk, Standard)
- Aggregates tier coverage across components

**Steps 4-6: Quality Checks and Export**
- Validates test quality (if not FORCE mode)
- Checks coverage prerequisites
- Exports baseline metrics for subsequent phases

### Output Parameters

```yaml
BASELINE_COVERAGE: 63.0  # Average across all components
BASELINE_CRITICAL: 78.5  # Critical tier (aggregated)
BASELINE_HIGH_RISK: 65.2  # High-risk tier (aggregated)
BASELINE_STANDARD: 58.7  # Standard tier (aggregated)
COMPONENTS_CHECKED: [backend, frontend]
PREREQUISITES_MET: true
```

## Configuration File Structure

Each component has a section in `.claude/rules/testing-workflows-config.md`:

```markdown
## Component: Backend (Python)

### Package Information
- **Package name**: `telegram_claude_bot`
- **Source directory**: `src/telegram_claude_bot/`
- **Test directory**: `tests/`

### Test Runner
- **Runner**: `pytest`
- **Coverage tool**: `pytest-cov`

### Coverage Commands

**Generate coverage report:**
```bash
PYTHONPATH=src pytest tests/ --cov=telegram_claude_bot --cov-report=json
```

**Coverage data location:**
- Report JSON: `coverage.json`

### Tier Definitions

**Critical Tier (Target: 90%+)**
- `auth/` - Authentication
- `web/api/` - API endpoints
...
```

## Supported Languages

### Python (pytest)
- **Runner**: `pytest`
- **Coverage format**: pytest-cov JSON (`{"totals": {"percent_covered": X}}`)
- **Example command**: `PYTHONPATH=src pytest tests/ --cov=module_name --cov-report=json`

### JavaScript/TypeScript (vitest)
- **Runner**: `vitest`
- **Coverage format**: vitest JSON (`{"total": {"lines": {"pct": X}}}`)
- **Example command**: `npm run test:coverage`

### Other Languages
Add custom component section with:
- Test runner command
- Coverage report command
- JSON output format
- Tier patterns

## Tier Definitions

Each component can have different tier patterns:

**Critical Tier (Target: 90%+)**
- Security-critical code (auth, permissions)
- Core business logic
- Data models

**High-Risk Tier (Target: 80%+)**
- Data persistence
- State management
- API routers

**Standard Tier (Target: 60%+)**
- Utilities
- Formatters
- Configuration

## Adding a New Component

1. Edit `.claude/rules/testing-workflows-config.md`
2. Add new `## Component:` section
3. Fill in all required fields:
   - Package information
   - Test runner
   - Coverage commands
   - Coverage data location
   - Tier definitions
   - Test utilities

Example:
```markdown
## Component: Mobile (Swift)

### Package Information
- **Package name**: `MyApp`
- **Source directory**: `ios/MyApp/`
- **Test directory**: `ios/MyAppTests/`

### Test Runner
- **Runner**: `xcodebuild`
- **Coverage tool**: `xcov`

### Coverage Commands

**Generate coverage report:**
```bash
xcodebuild test -scheme MyApp -enableCodeCoverage YES && xcov
```

**Coverage data location:**
- Report JSON: `xcov_report/report.json`

### Tier Definitions

**Critical Tier (Target: 90%+)**
- `Auth/` - Authentication
- `Models/` - Data models
...
```

## Troubleshooting

### "Config file not found"
Run `/init-coverage-config` to create it.

### "Component not found in config"
Check component name matches section header in config file (case-insensitive).
Valid components are listed in error message.

### "Test runner not installed"
Install component-specific test runner:
- Python: `pip install pytest pytest-cov`
- JavaScript: `npm install` (in component directory)

### "Coverage measurement failed"
Check coverage command in config file:
- Run manually to verify it works
- Check paths are correct
- Verify test files exist

### "Unknown coverage JSON format"
Update Python script in Step 2 to parse your coverage tool's JSON format.
Submit PR to add support for new format.

## Migration from Old Workflow

### Breaking Changes

**BACKEND_ONLY parameter removed**
- OLD: `--backend-only=true`
- NEW: `--components=backend`

**Config file required**
- OLD: Hardcoded Python settings
- NEW: Must run `/init-coverage-config` first

### Migration Steps

1. Run `/init-coverage-config`
2. Review and adjust configuration
3. Update workflow invocations:
   - `--backend-only` → `--components=backend`
4. Test with single component first
5. Add additional components as needed

## Advanced Usage

### Custom Coverage Commands

Edit config file to customize coverage commands:
```bash
# With custom flags
PYTHONPATH=src pytest tests/ --cov=module --cov-branch --cov-report=json

# With environment variables
NODE_ENV=test npm run test:coverage

# Multi-step commands
cd frontend && npm install && npm run test:coverage
```

### Custom Tier Patterns

Tier patterns support glob-like matching:
```markdown
**Critical Tier:**
- `auth/` - Matches any file in auth/ directory
- `web/api.py` - Matches specific file
- `models/user.py` - Matches specific model
```

### Component-Specific Targets

Each component can have different coverage targets:
```markdown
## Component: Backend (Python)
**Critical Tier (Target: 95%+)**  # Higher bar for backend

## Component: Frontend (TypeScript)
**Critical Tier (Target: 85%+)**  # Lower bar for frontend
```

## Next Steps

After Phase 0, other phases will:
1. Analyze coverage gaps per component
2. Design component-specific tests
3. Implement tests using component's language
4. Measure progress per component

All phases read the same config file for consistency.

---

**Generated by:** Phase 00 update (2025-12-19)
**See also:** `.claude/rules/testing-workflows-config.md`
