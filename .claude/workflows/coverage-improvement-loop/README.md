# Coverage Improvement Loop Workflow

A self-iterating workflow that continuously improves test coverage until achieving project goals through intelligent gap analysis and targeted test generation.

**Multi-language support**: Python, JavaScript/TypeScript, Go, and Rust.

## Overview

This workflow automatically:
1. Analyzes current coverage gaps by tier (critical/high-risk/standard)
2. Prioritizes files with highest impact potential
3. Generates high-quality tests following project standards
4. Verifies improvements and calculates ROI
5. Decides intelligently whether to continue or stop
6. Repeats until targets met or diminishing returns detected

**Supported languages**:
- **Python**: pytest + pytest-cov
- **JavaScript/TypeScript**: Vitest, Jest, or Mocha + c8/nyc
- **Go**: go test -cover
- **Rust**: cargo-tarpaulin

## Coverage Targets

| Tier | Files | Target |
|------|-------|--------|
| **Critical** | auth/, web/api/, session/models, claude/executor | 90%+ |
| **High-Risk** | storage/, session/manager, bot/handlers | 80%+ |
| **Standard** | bot/utils, config/, utilities | 60%+ |
| **Overall** | Entire backend | 80% (60% minimum) |

## Prerequisites

Before running this workflow, you need to:

1. **Generate configuration file** (for multi-language projects):
   ```bash
   /init-coverage-config
   ```
   This creates `.claude/rules/testing-workflows-config.md` with language detection and tier patterns.

2. **Review configuration** (optional):
   - Edit `.claude/rules/testing-workflows-config.md` to adjust tier patterns
   - Verify language detection is correct

3. **Install coverage tools** (language-specific):
   - **Python**: `pip install pytest pytest-cov`
   - **JavaScript/TypeScript**: `npm install -D vitest @vitest/coverage-v8` (or jest/mocha)
   - **Go**: Built-in with `go test`
   - **Rust**: `cargo install cargo-tarpaulin`

## Usage

### Quick Start (Python Projects)

```bash
# Run with default settings (iterate until 80% coverage)
/workflow:run-workflow coverage-improvement-loop

# Focus on specific tier
/workflow:run-workflow coverage-improvement-loop --tier=critical

# Set custom target
/workflow:run-workflow coverage-improvement-loop --target-coverage=85
```

### Quick Start (Multi-Language Projects)

```bash
# Step 1: Generate configuration (detects all languages)
/init-coverage-config

# Step 2: Review generated config (optional)
# Edit .claude/rules/testing-workflows-config.md

# Step 3: Run workflow for specific components
# Backend only (Python, Go, Rust)
/workflow:run-workflow coverage-improvement-loop --components=backend

# Frontend only (JavaScript/TypeScript)
/workflow:run-workflow coverage-improvement-loop --components=frontend

# Both backend and frontend
/workflow:run-workflow coverage-improvement-loop --components=backend,frontend

# Specific language
/workflow:run-workflow coverage-improvement-loop --language=javascript
```

### Advanced Options

```bash
# Customize iteration limits
/workflow:run-workflow coverage-improvement-loop \
  --max-iterations=15 \
  --files-per-iteration=3

# Adjust diminishing returns detection
/workflow:run-workflow coverage-improvement-loop \
  --min-roi=0.3 \
  --min-iteration-gain=0.5

# Use custom config file
/workflow:run-workflow coverage-improvement-loop \
  --config-file=.claude/rules/custom-coverage-config.md

# Skip prerequisite checks (not recommended)
/workflow:run-workflow coverage-improvement-loop --force
```

## Workflow Phases

### Phase 00: Prerequisites
- Verify pytest and pytest-cov installed
- Establish baseline coverage metrics
- Validate test quality (no weak assertions)

### Phase 01: Analyze Gaps (Loop)
- Run current coverage measurement
- Categorize files by tier
- Calculate priority scores
- Select top N files for improvement

### Phase 02: Generate Tests (Loop)
- Read source code for each priority file
- Identify uncovered lines
- Design test scenarios (happy path, errors, edge cases)
- Generate tests following project standards
- Write tests to appropriate test files

### Phase 03: Verify Improvement (Loop)
- Run all tests to verify they pass
- Measure new coverage
- Calculate ROI (coverage gained / tests added)
- Verify no regression

### Phase 04: Decision (Loop)
- Check stopping conditions (targets met, diminishing returns, etc.)
- Update iteration history
- Decide: continue or exit loop

### Phase 05: Final Report
- Generate comprehensive report
- Provide recommendations based on outcome
- Suggest next steps

## Stopping Conditions

The workflow exits when any of these conditions are met:

1. ✅ **Targets Achieved**: All tier targets and overall target met
2. ⚠️ **Diminishing Returns**: ROI declining and below threshold (< 0.5% per test)
3. ⚠️ **Minimal Gains**: Coverage gain < 1% for 3 consecutive iterations
4. ⚠️ **No Gaps**: No more high-value coverage gaps identified
5. ❌ **Test Failures**: Newly generated tests fail
6. ❌ **Regression**: Existing tests break
7. 🛑 **Max Iterations**: Safety limit reached (default: 20)

## Output Artifacts

### Generated Files
```
.claude/workflows/coverage-improvement-loop/
├── run-<timestamp>/
│   ├── iteration-01-analysis.md
│   ├── iteration-01-verification.md
│   ├── iteration-02-analysis.md
│   ├── iteration-02-verification.md
│   └── ...
└── coverage-improvement-report-<timestamp>.md

.claude/coverage-improvement-history.json  # Persistent history
```

### History File Structure
```json
{
  "workflow_runs": [
    {
      "run_id": "20251215-143000-abc123",
      "start_time": "2025-12-15T14:30:00Z",
      "end_time": "2025-12-15T16:45:00Z",
      "iterations": [
        {
          "iteration": 1,
          "coverage_before": 31.0,
          "coverage_after": 35.2,
          "coverage_gained": 4.2,
          "tests_added": 18,
          "roi": 0.233
        }
      ],
      "status": "completed",
      "stopped_reason": "targets_achieved",
      "final_coverage": 78.5,
      "total_tests_added": 156
    }
  ]
}
```

## Test Quality Standards

All generated tests follow `.claude/rules/testing.md` standards:

- ✅ Every test has Given/When/Then docstring
- ✅ Parameterization for 3+ similar tests
- ✅ Strong, specific assertions (no weak patterns)
- ✅ Behavioral organization (not CRUD-based)
- ✅ Async patterns for async code
- ✅ Fixtures for common setup
- ✅ Error cases AND happy paths

## Priority Scoring Algorithm

Files are prioritized using this formula:

```
Priority Score = Coverage Gap × Tier Weight × Complexity Factor

Where:
- Coverage Gap = (Target - Current) / Target
- Tier Weight = 3 (critical), 2 (high-risk), 1 (standard)
- Complexity Factor = min(num_statements / 100, 3.0)
```

**Example**:
```
File: src/auth/manager.py
- Current: 45%, Target: 90%
- Gap: 0.50
- Weight: 3 (critical)
- Complexity: 2.5 (250 statements)
- Score: 0.50 × 3 × 2.5 = 3.75
```

## Diminishing Returns Detection

The workflow tracks ROI (coverage gained per test) and stops when:

1. Last 3 iterations show declining ROI AND
2. Average ROI < 0.5% per test

This prevents wasting effort on low-value tests.

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `TARGET_COVERAGE` | number | 80 | Overall coverage target (%) |
| `MIN_COVERAGE` | number | 60 | Minimum acceptable coverage (%) |
| `CRITICAL_TIER_TARGET` | number | 90 | Critical tier target (%) |
| `HIGH_RISK_TIER_TARGET` | number | 80 | High-risk tier target (%) |
| `STANDARD_TIER_TARGET` | number | 60 | Standard tier target (%) |
| `MAX_ITERATIONS` | integer | 20 | Maximum iterations (safety limit) |
| `FILES_PER_ITERATION` | integer | 5 | Files to improve per iteration |
| `MIN_ROI` | number | 0.5 | Minimum ROI to continue (%) |
| `MIN_ITERATION_GAIN` | number | 1.0 | Minimum coverage gain per iteration (%) |
| `TIER` | enum | "" | Focus tier (critical/high-risk/standard/all) |
| `LANGUAGE` | enum | "python" | Language (python/javascript/typescript/go/rust) |
| `COMPONENTS` | string | "" | Components to test (backend/frontend/backend,frontend) |
| `CONFIG_FILE` | string | ".claude/rules/testing-workflows-config.md" | Path to config file |
| `BACKEND_ONLY` | boolean | true | **Deprecated**: Use `--components=backend` instead |
| `FORCE` | boolean | false | Skip prerequisite checks |

See `examples/parameters.yaml` for complete examples.

## Multi-Language Examples

### Example 1: Python-Only Project

**Project structure**:
```
my-project/
├── src/my_package/
│   ├── auth/         # Critical
│   ├── api/          # Critical
│   └── utils/        # Standard
└── tests/
```

**Configuration** (`.claude/rules/testing-workflows-config.md`):
```yaml
language: python
test_framework: pytest
coverage_tool: pytest-cov

tier_patterns:
  critical:
    - "src/my_package/auth/**/*.py"
    - "src/my_package/api/**/*.py"
  high_risk:
    - "src/my_package/storage/**/*.py"
  standard:
    - "src/my_package/utils/**/*.py"
```

**Run workflow**:
```bash
/workflow:run-workflow coverage-improvement-loop --target-coverage=85
```

### Example 2: JavaScript/TypeScript Frontend

**Project structure**:
```
my-app/
├── src/
│   ├── components/   # High-risk
│   ├── stores/       # Critical
│   └── utils/        # Standard
└── tests/
```

**Configuration**:
```yaml
language: typescript
test_framework: vitest
coverage_tool: c8

tier_patterns:
  critical:
    - "src/stores/**/*.ts"
    - "src/api/**/*.ts"
  high_risk:
    - "src/components/**/*.tsx"
  standard:
    - "src/utils/**/*.ts"
```

**Run workflow**:
```bash
/workflow:run-workflow coverage-improvement-loop \
  --language=typescript \
  --components=frontend \
  --target-coverage=70
```

### Example 3: Multi-Language Project (Backend + Frontend)

**Project structure**:
```
fullstack-app/
├── backend/          # Python
│   ├── src/
│   └── tests/
├── frontend/         # TypeScript
│   ├── src/
│   └── tests/
└── .claude/rules/testing-workflows-config.md
```

**Configuration** (auto-detected by `/init-coverage-config`):
```yaml
# Backend (Python)
languages:
  - language: python
    components: backend
    tier_patterns:
      critical:
        - "backend/src/auth/**/*.py"
        - "backend/src/api/**/*.py"
      standard:
        - "backend/src/utils/**/*.py"

# Frontend (TypeScript)
  - language: typescript
    components: frontend
    tier_patterns:
      critical:
        - "frontend/src/stores/**/*.ts"
      high_risk:
        - "frontend/src/components/**/*.tsx"
```

**Run workflow**:
```bash
# Improve both backend and frontend
/workflow:run-workflow coverage-improvement-loop --components=backend,frontend

# Or run separately
/workflow:run-workflow coverage-improvement-loop --components=backend
/workflow:run-workflow coverage-improvement-loop --components=frontend
```

### Example 4: Go Project

**Project structure**:
```
go-service/
├── cmd/
├── internal/
│   ├── auth/         # Critical
│   ├── api/          # Critical
│   └── utils/        # Standard
└── pkg/
```

**Configuration**:
```yaml
language: go
test_framework: go test
coverage_tool: go test -cover

tier_patterns:
  critical:
    - "internal/auth/**/*.go"
    - "internal/api/**/*.go"
  standard:
    - "internal/utils/**/*.go"
    - "pkg/**/*.go"
```

**Run workflow**:
```bash
/workflow:run-workflow coverage-improvement-loop \
  --language=go \
  --target-coverage=80
```

### Example 5: Rust Project

**Project structure**:
```
rust-app/
├── src/
│   ├── auth/         # Critical
│   ├── api/          # Critical
│   └── utils/        # Standard
├── tests/
└── Cargo.toml
```

**Configuration**:
```yaml
language: rust
test_framework: cargo test
coverage_tool: cargo-tarpaulin

tier_patterns:
  critical:
    - "src/auth/**/*.rs"
    - "src/api/**/*.rs"
  standard:
    - "src/utils/**/*.rs"
```

**Run workflow**:
```bash
/workflow:run-workflow coverage-improvement-loop \
  --language=rust \
  --target-coverage=85
```

## Migration Guide

### Migrating from Python-Only Version

If you were using the old Python-only workflow, here's how to migrate:

**Old command** (still works, but deprecated):
```bash
/workflow:run-workflow coverage-improvement-loop --backend-only=true
```

**New command** (recommended):
```bash
# Generate config first (one-time)
/init-coverage-config

# Run with explicit component
/workflow:run-workflow coverage-improvement-loop --components=backend
```

**Breaking changes**:
- `--backend-only` is deprecated (use `--components=backend` instead)
- Requires `.claude/rules/testing-workflows-config.md` for multi-language projects
- Tier patterns now defined in config file (not hardcoded)

**Migration steps**:
1. Run `/init-coverage-config` to generate configuration
2. Review generated config and adjust tier patterns
3. Update workflow commands to use `--components=` instead of `--backend-only`
4. Test the workflow with `--analyze-only` first (if available)

## Integration with Other Commands

This workflow complements existing test quality commands:

### Before Running
- `/consolidate-tests` - Clean up test suite first

### After Running (if targets met)
- `/increase-mutation-score` - Verify test quality

### Alternative Approaches
- `/increase-coverage` - Single-shot coverage improvement (no loop)

## Troubleshooting

### Tests Fail After Generation
- Review `test_results.txt` for error details
- Generated tests may have incorrect assumptions
- Fix tests manually and re-run workflow

### Coverage Not Improving
- Check if remaining gaps are in framework code
- Review `iteration-N-analysis.md` for identified files
- May need manual tests for complex scenarios

### Diminishing Returns Too Early
- Lower `MIN_ROI` threshold (e.g., 0.3 instead of 0.5)
- Or increase `FILES_PER_ITERATION` (e.g., 7 instead of 5)

### Max Iterations Reached
- Review final report for recommendations
- Increase `MAX_ITERATIONS` if justified
- Or accept current coverage and move to mutation testing

## Example Workflows

### Scenario 1: Improve Critical Tier Only (Python)
```bash
/workflow:run-workflow coverage-improvement-loop \
  --tier=critical \
  --critical-tier-target=95 \
  --max-iterations=10 \
  --components=backend
```

### Scenario 2: Quick Coverage Boost (Multi-Language)
```bash
# Generate config first
/init-coverage-config

# Run for both backend and frontend
/workflow:run-workflow coverage-improvement-loop \
  --files-per-iteration=10 \
  --min-iteration-gain=2.0 \
  --max-iterations=5 \
  --components=backend,frontend
```

### Scenario 3: Thorough Improvement (TypeScript Frontend)
```bash
/workflow:run-workflow coverage-improvement-loop \
  --language=typescript \
  --components=frontend \
  --target-coverage=75 \
  --min-roi=0.3 \
  --max-iterations=30
```

### Scenario 4: Go Backend Critical Paths
```bash
/workflow:run-workflow coverage-improvement-loop \
  --language=go \
  --tier=critical \
  --critical-tier-target=90 \
  --components=backend
```

## Next Steps After Completion

### If Targets Met ✅
1. Run mutation testing: `/increase-mutation-score`
2. Review generated tests for quality
3. Add coverage gates to CI/CD

### If Diminishing Returns ⚠️
1. Review HTML coverage report: `pytest --cov --cov-report=html`
2. Manually test high-value gaps
3. Consider current coverage sufficient

### If Max Iterations Reached 🛑
1. Analyze why targets weren't met
2. Identify blockers (complex dependencies, integration needs)
3. Adjust parameters or manual intervention

## See Also

### Configuration
- `/init-coverage-config` command - Generate multi-language configuration
- `.claude/rules/testing-workflows-config.md` - Generated configuration file

### Rules and Standards
- `.claude/rules/testing.md` - Test quality standards (Python-specific)
- `.claude/rules/coverage-strategies.md` - Coverage improvement strategies
- `.claude/rules/test-patterns.md` - Test patterns and examples

### Related Commands
- `/increase-coverage` command - Single-iteration coverage improvement
- `/consolidate-tests` command - Test suite cleanup
- `/increase-mutation-score` command - Verify test quality (Python only)

### Language-Specific Documentation
- **Python**: pytest, pytest-cov documentation
- **JavaScript/TypeScript**: Vitest, Jest, c8/nyc documentation
- **Go**: `go test -cover` documentation
- **Rust**: cargo-tarpaulin documentation

---

**Generated**: 2025-12-19
**Version**: 2.0.0 (Multi-Language)
**Workflow Type**: Testing (Iterative)
**Supported Languages**: Python, JavaScript, TypeScript, Go, Rust
