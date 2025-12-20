# Increase Mutation Score Workflow

**Multi-language, tool-agnostic** mutation testing workflow to improve test quality through intelligent mutant analysis and exclusion assessment with **orchestrator-controlled automatic iteration**.

Supports: Python (Poodle, mutmut), JavaScript/TypeScript (Stryker), Go (gremlins), Rust (cargo-mutants)

## Overview

This workflow implements a systematic, data-driven approach to mutation testing improvement based on the successful achievement of 89.9% mutation score on `session/manager.py`. It features an **orchestrator-controlled iteration loop** that automatically cycles through analysis, testing, and assessment until target is reached or diminishing returns detected.

### Key Innovation: Orchestrator-Controlled Looping (v3.0)

Unlike single-phase iteration workflows, this workflow uses **orchestrator-controlled looping**:

- **Granular phases**: Each step runs in its own context window (Phases 01-05)
- **Automatic iteration**: Orchestrator loops back to Phase 01 based on SHOULD_CONTINUE
- **Fresh context per phase**: Better memory management for long-running workflows
- **Intelligent stopping**: Detects when target is reached or diminishing returns occur
- **Continuous assessment**: Categorizes survivors after each iteration
- **Complete history**: Full iteration tracking across phases

### Architecture

```
Phase 00: Prerequisites & Baseline (run once)
─────────────────────────────────────────────────────
ITERATION LOOP (orchestrator-controlled):
  Phase 01: Analyze Survivors       ←─────────┐
  Phase 02: Improve Tests                     │
  Phase 03: Verify Improvement                │
  Phase 04: Exclusion Assessment              │
  Phase 05: Decision ─────────────────────────┘
           ↓ (if SHOULD_CONTINUE=false)
─────────────────────────────────────────────────────
Phase 06: Final Report (run once)
```

### Based on Proven Success

- **Validated approach**: Session/manager.py achieved 89.9% mutation score
- **Data-driven exclusions**: 242 low-value mutations excluded (String, FuncCall, Keyword)
- **Focused testing**: 14 survivors accepted with clear documentation
- **Production-ready**: Industry-standard mutation testing practices

## Phases

### Phase 00: Prerequisites Check
**Duration**: 5-10 minutes
**Runs**: Once at workflow start

- Load testing workflows configuration
- Auto-detect component, language, and mutation tool
- Verify mutation tool installation (Poodle, Stryker, mutmut, gremlins, cargo-mutants)
- Check line coverage >= 60% (or FORCE flag)
- Run baseline mutation testing
- Establish baseline mutation score
- Determine effective target score

### Phase 01: Analyze Survivors (Loop Start)
**Duration**: 5-10 minutes per iteration
**Runs**: Each iteration

- Generate coverage report (tool-specific commands)
- Extract survivor details from mutation tool results
- Categorize by value: EXCLUDE, LOW, MEDIUM, HIGH
- Identify HIGH VALUE targets for testing
- Document target strategies for Phase 02

### Phase 02: Improve Tests
**Duration**: 10-20 minutes per iteration
**Runs**: Each iteration

- Design mutation-killing tests for HIGH VALUE survivors
- Write tests following project standards (Given/When/Then, parameterization)
- Verify all tests pass
- Document tests added

### Phase 03: Verify Improvement
**Duration**: 5-10 minutes per iteration
**Runs**: Each iteration

- Re-run mutation testing with new tests (tool-specific)
- Measure improvement delta
- Calculate mutants killed
- Generate iteration results report

### Phase 04: Exclusion Assessment
**Duration**: 5 minutes per iteration
**Runs**: Each iteration

- Re-categorize remaining survivors
- Update exclusion recommendations (tool-specific syntax)
- Calculate projected score with exclusions
- Generate mutation tool config recommendations

### Phase 05: Decision (Loop End)
**Duration**: 1 minute per iteration
**Runs**: Each iteration - **Controls Loop**

**Outputs SHOULD_CONTINUE to control orchestrator loop:**

- ✅ Score >= target? → STOP (SUCCESS)
- ✅ Score >= 90%? → STOP (SUCCESS)
- ⚠️ Delta < 2% AND no high-value? → STOP (REVIEW)
- 🔄 Iteration >= MAX? → STOP (CONTINUE)
- Otherwise → **SHOULD_CONTINUE=true** → Loop back to Phase 01

### Phase 06: Final Report
**Duration**: 2-5 minutes
**Runs**: Once at workflow end

- Consolidate all iteration results
- Generate comprehensive final report
- Provide status-specific recommendations
- Update mutation testing history

## Quick Start

### Basic Usage

```bash
# Critical tier (target: 90%)
/run-workflow increase-mutation-score --tier=critical

# Specific module
/run-workflow increase-mutation-score \
  --module-path=src/telegram_claude_bot/auth/manager.py \
  --target-score=90
```

### Orchestrator-Controlled Iteration

**NEW in v3.0**: The orchestrator automatically controls iteration!

```bash
# Single workflow run performs multiple iterations automatically
/run-workflow increase-mutation-score --tier=critical --max-iterations=3

# Example execution:
# Phase 00: Baseline = 71%
#
# === Iteration 1 ===
# Phase 01: Analyzing 15 survivors...
# Phase 02: Writing 8 tests...
# Phase 03: Score: 71% → 82% (+11 pp)
# Phase 04: 3 HIGH VALUE remain
# Phase 05: SHOULD_CONTINUE=true → Loop
#
# === Iteration 2 ===
# Phase 01: Analyzing 8 survivors...
# Phase 02: Writing 5 tests...
# Phase 03: Score: 82% → 91% (+9 pp)
# Phase 04: 0 HIGH VALUE remain
# Phase 05: SHOULD_CONTINUE=false → SUCCESS!
#
# Phase 06: Final Report
# Total: 71% → 91% in one workflow run
```

**How it works**:
1. Phase 00 establishes baseline
2. Phases 01-05 loop automatically (fresh context per phase)
3. Phase 05 outputs `SHOULD_CONTINUE` parameter
4. Orchestrator reads parameter and decides: loop or continue
5. Phase 06 generates final report

**Benefits over single-phase iteration**:
- **Fresh context window** per phase (better for long workflows)
- **Granular progress tracking** (each phase documented)
- **Easier debugging** (isolate issues to specific phase)
- **Better memory management** (context resets each phase)

## Multi-Language Support

This workflow is **language and tool agnostic**. It automatically detects and uses the appropriate mutation testing tool based on your project configuration.

### Supported Languages & Tools

| Language | Mutation Tools | Config Detection |
|----------|---------------|------------------|
| **Python** | Poodle, mutmut | `poodle.toml`, `pyproject.toml` |
| **JavaScript/TypeScript** | Stryker | `stryker.conf.js`, `package.json` |
| **Go** | gremlins | `go.mod`, `.gremlins.yml` |
| **Rust** | cargo-mutants | `Cargo.toml`, `mutants.toml` |

### Configuration

All mutation testing settings are loaded from `.claude/rules/testing-workflows-config.md`, which contains:
- Tool-specific run commands
- Exclusion syntax and patterns
- Result parsing strategies
- Tier definitions per language

**Setup**: Run `/init-mutation-config` to generate the configuration file if it doesn't exist.

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `MODULE_PATH` | string | "" | Specific module to improve |
| `TARGET_SCORE` | number | 90 | Desired mutation score (60-100) |
| `TIER` | enum | "critical" | Module tier (critical/high/standard) |
| `MAX_ITERATIONS` | integer | 3 | Maximum iterations |
| `MUTANT_LIMIT` | integer | 0 | Max mutants to analyze (0=unlimited) |
| `OUTPUT_DIR` | directory | .claude/workflows/increase-mutation-score-loop | Output directory |
| `FORCE` | boolean | false | Skip coverage check |
| `LANGUAGE` | enum | "auto" | Language (auto/python/javascript/typescript/go/rust) |
| `MUTATION_TOOL` | enum | "auto" | Tool (auto/poodle/mutmut/stryker/gremlins/cargo-mutants) |
| `COMPONENTS` | string | "" | Component list (e.g., "backend,frontend") |
| `CONFIG_FILE` | file | .claude/rules/testing-workflows-config.md | Testing workflows config |
| ~~`BACKEND_ONLY`~~ | boolean | true | **Deprecated**: Use `COMPONENTS=backend` |
| ~~`POODLE_CONFIG`~~ | file | poodle.toml | **Deprecated**: Use `CONFIG_FILE` |

## Prerequisites

### Common Requirements (All Languages)
- Valid `.claude/rules/testing-workflows-config.md` configuration
- Passing test suite
- Line coverage >= 60% (recommended)
- Familiarity with `.claude/rules/testing.md` standards

### Language-Specific Requirements

**Python**:
```bash
# Install mutation testing tool
pip install poodle  # or: pip install mutmut

# Verify installation
poodle --version    # or: mutmut --version
```

**JavaScript/TypeScript**:
```bash
# Install Stryker
npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner

# Verify installation
npx stryker --version
```

**Go**:
```bash
# Install gremlins
go install github.com/go-gremlins/gremlins/cmd/gremlins@latest

# Verify installation
gremlins version
```

**Rust**:
```bash
# Install cargo-mutants
cargo install cargo-mutants

# Verify installation
cargo mutants --version
```

## Mutation Score Targets by Tier

### Critical Tier (90%+)
**Modules**: `auth/`, `web/api/`, `session/models`, `claude/executor`
**Why**: Authentication, API endpoints, data models - bugs have severe consequences

### High Tier (85%+)
**Modules**: `storage/`, `session/manager`, `bot/handlers`
**Why**: Data persistence, state management - bugs cause data loss

### Standard Tier (75%+)
**Modules**: `bot/utils`, `config/`, utilities
**Why**: Utility code - bugs are annoying but not catastrophic

## Expected Timeline

### Per Workflow Run

- **Phase 00** (Prerequisites): 5-10 minutes
- **Phases 01-05** (Iteration Loop): 20-40 min per iteration
  - Phase 01 (Analyze): 5-10 min
  - Phase 02 (Improve): 10-20 min
  - Phase 03 (Verify): 5-10 min
  - Phase 04 (Assessment): 5 min
  - Phase 05 (Decision): 1 min
- **Phase 06** (Final Report): 2-5 minutes

**Total**: 30-120 minutes depending on iterations needed

### Typical Patterns

- **Good start** (coverage 60%+, baseline 70%+): 1-2 iterations → 30-60 minutes
- **Moderate start** (baseline 60-70%): 2-3 iterations → 60-90 minutes
- **Low coverage** (<50%): Run `/increase-coverage` first

## Outputs

### Per Workflow Run

Each workflow run creates a timestamped directory:

```
.claude/workflows/increase-mutation-score/
├── run-20251214-103045/              # First run
│   ├── baseline-report.md            # Phase 00
│   ├── iteration-1-analysis.md       # Phase 01 (iteration 1)
│   ├── iteration-1-tests.md          # Phase 02 (iteration 1)
│   ├── iteration-1-results.md        # Phase 03 (iteration 1)
│   ├── iteration-1-exclusions.md     # Phase 04 (iteration 1)
│   ├── iteration-1-decision.md       # Phase 05 (iteration 1)
│   ├── iteration-2-*.md              # Iteration 2 files...
│   ├── iteration-history.md          # Accumulated history
│   ├── poodle-config-recommendations.md
│   └── final-report.md               # Phase 06
├── run-20251214-154230/              # Second run
│   └── ... (same structure)
└── run-20251215-091530/              # Third run
    └── ... (same structure)
```

**Run Directory**: All outputs for a single workflow run are organized in `run-YYYYMMDD-HHMMSS/` subdirectories.

### Key Output Files

| File | Phase | Description |
|------|-------|-------------|
| `baseline-report.md` | 00 | Initial mutation score and setup |
| `iteration-N-*.md` | 01-05 | Per-iteration documentation |
| `iteration-history.md` | 05 | Cumulative iteration history |
| `poodle-config-recommendations.md` | 04 | skip_mutators recommendations |
| `final-report.md` | 06 | Executive summary and next steps |

## Exclusion Assessment

### Categorization Rules

#### EXCLUDE (Add to skip_mutators)
- **String mutations**: Logging output only, no functional impact
- **FuncCall mutations**: Function calls in logging contexts
- **Keyword mutations**: Type system artifacts (`None` → `' '`)

**Impact**: Excludes ~242 mutations (based on session/manager.py)

#### LOW VALUE (Accept as survivors)
- **Defensive code**: `result.scalar() or 0` → `or 1`
- **Error handling**: Constraint violation detection
- **Return mutations**: Unrealistic or deep in error recovery

#### MEDIUM VALUE (Test if time permits)
- **Edge case arithmetic**: `.limit(1)` → `.limit(2)`
- **Array indexing**: `row[0]` → `row[-1]`

#### HIGH VALUE (Must fix)
- **Comparison boundaries**: `<=` → `<` (off-by-one errors)
- **Increment operators**: `+= 1` → `= 1`
- **Business logic**: Core calculations and validations

## Workflow Status Interpretation

### SUCCESS ✅
**When**: Score >= target OR score >= 90%

**Next Steps**:
1. Apply exclusion recommendations
2. Document accepted survivors
3. Apply learnings to other modules
4. Consider CI/CD integration

### CONTINUE 🔄
**When**: MAX_ITERATIONS reached but HIGH VALUE survivors remain

**Next Steps**:
1. Review HIGH VALUE survivors
2. Re-run workflow with increased `--max-iterations=5`
3. Target identified high-value survivors

### REVIEW ⚠️
**When**: Delta < 2% AND no HIGH VALUE targets remain

**Next Steps**:
1. Apply recommended exclusions (Option C: `skip_mutators = ["String", "FuncCall", "Keyword"]`)
2. Re-run Poodle to verify projected score
3. Accept remaining LOW VALUE survivors if gap is small

## Best Practices

### Test Quality Standards
All tests **must** follow `.claude/rules/testing.md`:

✅ **Docstrings** (Given/When/Then format)
✅ **Parameterization** (3+ similar tests)
✅ **Exact Assertions** (kills mutants effectively)

### Mutation-Killing Strategies

1. **Exact value assertions** → Kill arithmetic mutants
2. **Boundary testing** → Kill comparison mutants
3. **Both branch testing** → Kill boolean mutants
4. **Error path testing** → Kill exception mutants
5. **Increment testing** → Kill augmented assignment mutants

## Configuration

### poodle.toml (Recommended)

```toml
[poodle]
source_folders = ["src"]
only_files = ["**/session/manager.py"]  # Adjust as needed

# Exclude low-value mutation types (recommended)
skip_mutators = ["String", "FuncCall", "Keyword"]

max_workers = 4
min_timeout = 30
timeout_multiplier = 3

runner = "command_line"
reporters = ["summary", "not_found"]

[poodle.runner_opts]
command_line = "pytest tests/session/test_manager.py -x --assert=plain --tb=no --no-cov -q"
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.0.0 | 2025-12-13 | **Orchestrator-controlled looping** - granular phases with automatic iteration |
| 2.0.0 | 2025-12-13 | Single-phase iteration (deprecated) |
| 1.0.0 | 2025-12-13 | Initial workflow with Phase 04 exclusion assessment |

## Resources

### Project Documentation
- [Testing Standards](.claude/rules/testing.md)
- [Coverage Strategies](.claude/rules/coverage-strategies.md)
- [Test Patterns](.claude/rules/test-patterns.md)

### Mutation Testing
- [Poodle Documentation](https://github.com/WiredNerd/poodle)
- [Mutation Testing Info](https://mutation-testing.info)

### Case Studies
- [Session Manager Success](.claude/workflows/mutation-score-improvement/final-summary.md)
- [Exclusion Analysis](.claude/workflows/mutation-score-improvement/exclusion-analysis.md)

---

**Ready to improve your mutation score?**

```bash
/run-workflow increase-mutation-score --tier=critical
```
