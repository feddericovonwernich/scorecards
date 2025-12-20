---
phase_metadata:
  execution_mode: sequential

  inputs:
    parameters:
      - name: MODULE_PATH
        required: false
        default: ""
        description: "Specific module to test (empty = auto-detect)"
        type: string
      - name: TARGET_SCORE
        required: false
        default: 90
        description: "Target mutation score"
        type: number
      - name: TIER
        required: false
        default: "critical"
        description: "Module tier for target selection"
        type: string
      - name: FORCE
        required: false
        default: false
        description: "Skip coverage check"
        type: boolean
      - name: BACKEND_ONLY
        required: false
        default: true
        description: "Backend-only testing"
        type: boolean
      - name: OUTPUT_DIR
        required: true
        description: "Output directory"
        type: directory
      - name: CONFIG_FILE
        required: false
        default: ".claude/rules/testing-workflows-config.md"
        description: "Path to testing workflows config file"
        type: file
      - name: LANGUAGE
        required: false
        default: "auto"
        description: "Programming language (auto-detect from config)"
        type: string
      - name: MUTATION_TOOL
        required: false
        default: "auto"
        description: "Mutation testing tool (auto-detect from config)"
        type: string
      - name: COMPONENTS
        required: false
        default: ""
        description: "Comma-separated component names (e.g., backend,frontend)"
        type: string

  outputs:
    files:
      - path: "$RUN_DIR/baseline-report.md"
        description: "Initial mutation testing baseline report"
      - path: "$RUN_DIR/mutation-baseline-results.json"
        description: "Raw mutation testing baseline results (JSON)"
        required: false

    parameters:
      - name: BASELINE_SCORE
        description: "Initial mutation score percentage"
        type: number
      - name: TOTAL_MUTATIONS
        description: "Total mutations generated"
        type: integer
      - name: MUTATIONS_KILLED
        description: "Mutations killed by tests"
        type: integer
      - name: SURVIVED_COUNT
        description: "Number of surviving mutants"
        type: integer
      - name: EFFECTIVE_MODULE_PATH
        description: "Actual module path being tested"
        type: string
      - name: EFFECTIVE_TARGET_SCORE
        description: "Computed target score based on tier or parameter"
        type: number
      - name: COVERAGE_PERCENTAGE
        description: "Current line coverage percentage"
        type: number
      - name: RUN_DIR
        description: "Timestamped run directory for this workflow execution"
        type: string
      - name: COMPONENT_NAME
        description: "Name of component being tested (e.g., 'backend', 'frontend')"
        type: string
      - name: DETECTED_LANGUAGE
        description: "Auto-detected programming language"
        type: string
      - name: DETECTED_MUTATION_TOOL
        description: "Auto-detected mutation testing tool"
        type: string
---

# Phase 00: Prerequisites Check

**Purpose**: Verify prerequisites, establish baseline mutation score, and validate configuration before improvement iterations

## Prerequisites

**Multi-Language Support**:
- **Python**: Python 3.8+ with pytest/pytest-cov, mutation tool (Poodle or mutmut)
- **JavaScript/TypeScript**: Node.js with test runner (Vitest/Jest), Stryker mutation testing
- **Go**: Go 1.16+ with testing framework, gremlins mutation tool
- **Rust**: Rust with cargo, cargo-mutants mutation tool

**Common Requirements**:
- Valid configuration file (`.claude/rules/testing-workflows-config.md`)
- Test suite that passes completely
- (Recommended) Line coverage >= 60%

## Tasks for Todo List

When starting this phase, add these tasks:

1. Loading testing workflows configuration file
2. Detecting component, language, and mutation tool
3. Verifying mutation tool installation and configuration
4. Validating and creating output directory (OUTPUT_DIR)
5. Creating timestamped run directory for workflow outputs
6. Checking line coverage percentage (using config-defined commands)
7. Validating coverage meets 60% threshold (or FORCE flag set)
8. Determining effective module path to test
9. Running baseline mutation testing (tool-specific command)
10. Parsing mutation testing results (killed, survived, total)
11. Computing baseline mutation score
12. Determining effective target score based on TIER or TARGET_SCORE
13. Generating baseline report with recommendations
14. Exporting baseline parameters for subsequent phases

## Parameters Used

### Input Parameters
- **MODULE_PATH**: Specific module to test (empty = auto-detect from config)
- **TARGET_SCORE**: Desired mutation score (0-100)
- **TIER**: Module tier (critical=90%, high=85%, standard=75%)
- **FORCE**: Skip coverage prerequisite check
- **BACKEND_ONLY**: (Deprecated, use COMPONENTS) Only test backend
- **OUTPUT_DIR**: Directory for outputs
- **CONFIG_FILE**: Path to testing workflows config file
- **LANGUAGE**: Programming language (auto = detect from config)
- **MUTATION_TOOL**: Mutation testing tool (auto = detect from config)
- **COMPONENTS**: Comma-separated component names

### Output Parameters
- **BASELINE_SCORE**: Initial mutation score
- **TOTAL_MUTATIONS**: Total mutations generated
- **MUTATIONS_KILLED**: Mutations killed by tests
- **SURVIVED_COUNT**: Surviving mutants count
- **EFFECTIVE_MODULE_PATH**: Module actually tested
- **EFFECTIVE_TARGET_SCORE**: Computed target score
- **COVERAGE_PERCENTAGE**: Current line coverage
- **RUN_DIR**: Timestamped run directory path (for organizing outputs)
- **COMPONENT_NAME**: Name of component being tested
- **DETECTED_LANGUAGE**: Auto-detected programming language
- **DETECTED_MUTATION_TOOL**: Auto-detected mutation testing tool

## Process

### Step 0: Load Configuration

Load the testing workflows configuration file to determine component settings.

```bash
# Read configuration file
CONFIG_FILE="${CONFIG_FILE:-.claude/rules/testing-workflows-config.md}"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "ERROR: Configuration file not found: $CONFIG_FILE"
  echo "Run /init-coverage-config to generate configuration"
  exit 1
fi

echo "Loaded configuration from: $CONFIG_FILE"
```

**Parse component configurations**:
1. Extract component sections (e.g., "## Component: Backend (Python)")
2. Identify language, test runner, coverage tool, mutation tool
3. Extract tier definitions and test utilities

**Component Detection Logic**:
```
if COMPONENTS is specified:
    Use specified components
else if BACKEND_ONLY is true:
    COMPONENTS = "backend"
else:
    COMPONENTS = all components in config (default: "backend")
```

**Language Detection**:
```
if LANGUAGE != "auto":
    Use specified language
else:
    Read from component config (e.g., "## Component: Backend (Python)")
    Extract language from heading
```

**Mutation Tool Detection**:
```
if MUTATION_TOOL != "auto":
    Use specified tool
else:
    Read from component config under "### Mutation Testing Configuration"
    Extract from "**Tool**: <tool-name>"
```

### Step 1: Verify Mutation Tool Installation

Check that the mutation testing tool is installed and accessible (tool-specific).

#### Python (Poodle)
```bash
# Check Poodle installation
poodle --version

# Check poodle.toml exists
test -f poodle.toml && echo "Config found" || echo "Config missing"
```

**If not installed**:
```bash
pip install poodle
```

#### Python (mutmut)
```bash
# Check mutmut installation
mutmut --version

# Check configuration in setup.cfg or pyproject.toml
```

**If not installed**:
```bash
pip install mutmut
```

#### JavaScript/TypeScript (Stryker)
```bash
# Check Stryker installation
npx stryker --version

# Check stryker.config.* exists
test -f stryker.config.js || test -f stryker.config.mjs || echo "Config missing"
```

**If not installed**:
```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner
# or for Jest:
# npm install --save-dev @stryker-mutator/jest-runner
```

#### Go (gremlins)
```bash
# Check gremlins installation
gremlins --version

# Check .gremlins.yaml exists
test -f .gremlins.yaml && echo "Config found" || echo "Config optional"
```

**If not installed**:
```bash
go install github.com/go-gremlins/gremlins/cmd/gremlins@latest
```

#### Rust (cargo-mutants)
```bash
# Check cargo-mutants installation
cargo mutants --version

# Check mutants.toml exists
test -f mutants.toml && echo "Config found" || echo "Config optional"
```

**If not installed**:
```bash
cargo install cargo-mutants
```

### Step 1.5: Validate and Create Output Directory

Ensure the OUTPUT_DIR exists and is writable before creating the run subdirectory.

**Bash commands:**
```bash
# Check if OUTPUT_DIR exists
if [ ! -d "$OUTPUT_DIR" ]; then
  echo "Output directory does not exist, creating: $OUTPUT_DIR"
  mkdir -p "$OUTPUT_DIR"
fi

# Verify write permissions
if [ ! -w "$OUTPUT_DIR" ]; then
  echo "ERROR: Output directory is not writable: $OUTPUT_DIR"
  exit 1
fi

echo "Output directory validated: $OUTPUT_DIR"
```

**Success Criteria:**
- OUTPUT_DIR exists
- OUTPUT_DIR has write permissions

### Step 1.6: Create Timestamped Run Directory

Generate a unique run directory for this workflow execution to organize outputs.

**Bash commands:**
```bash
# Generate timestamp in YYYYMMDD-HHMMSS format
RUN_TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
RUN_DIR="$OUTPUT_DIR/run-$RUN_TIMESTAMP"

# Create run directory
mkdir -p "$RUN_DIR"

echo "Created run directory: $RUN_DIR"
```

**Export RUN_DIR** for subsequent phases.

This directory will contain all outputs from this workflow run, keeping results organized and preventing conflicts with previous runs.

### Step 2: Check Line Coverage

Measure current line coverage to ensure tests are adequate before mutation testing.

Use coverage commands from config file for the selected component.

#### Python (pytest-cov)
```bash
# From config: "Generate coverage report" command
PYTHONPATH=src pytest tests/ --cov=telegram_claude_bot --cov-report=term --cov-report=json

# Extract coverage percentage from coverage.json
python -c "
import json
with open('coverage.json') as f:
    data = json.load(f)
    coverage = data['totals']['percent_covered']
    print(f'Coverage: {coverage}%')
"
```

#### JavaScript/TypeScript (Vitest/Jest)
```bash
# From config: "Generate coverage report" command
cd frontend && npm run test:coverage

# Extract coverage percentage from coverage-final.json
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('frontend/coverage/coverage-final.json'));
// Parse Vitest/Jest coverage format
console.log('Coverage:', coveragePercent, '%');
"
```

#### Go (go test)
```bash
# Run tests with coverage
go test ./... -coverprofile=coverage.out

# Extract coverage percentage
go tool cover -func=coverage.out | grep total | awk '{print $3}'
```

#### Rust (cargo tarpaulin / llvm-cov)
```bash
# Run tests with coverage (tarpaulin)
cargo tarpaulin --out Json

# Or with llvm-cov
cargo llvm-cov --json --output-path coverage.json

# Extract coverage percentage from JSON
```

**Coverage Thresholds**:
- **60%+**: Excellent - Proceed with mutation testing
- **50-60%**: Acceptable if FORCE=true
- **<50%**: Recommend running `/increase-coverage` first

**If coverage < 60% and FORCE=false**:
- Output error message
- Recommend: `/increase-coverage --tier=<tier> --limit=10`
- Fail phase with status=FAILURE

### Step 3: Determine Effective Module Path

Resolve which module to test based on MODULE_PATH parameter or tool config.

**Logic**:
```
if MODULE_PATH is not empty:
    EFFECTIVE_MODULE_PATH = MODULE_PATH
    # Update tool config temporarily with scope filter
else:
    # Use tool config as-is
    # Extract from config file (tool-specific)
    EFFECTIVE_MODULE_PATH = <from config>
```

**Tool-Specific Module Path Resolution**:

#### Python (Poodle)
- Config: `poodle.toml`
- Extract from: `only_files` or `source_folders`
- Update: `only_files = ["**/{MODULE_PATH}"]`

#### Python (mutmut)
- Config: `setup.cfg` or `pyproject.toml`
- Extract from: `paths_to_mutate`
- Update: `--paths-to-mutate=$MODULE_PATH`

#### JavaScript/TypeScript (Stryker)
- Config: `stryker.config.js`
- Extract from: `mutate` array
- Update: `mutate: ["src/**/{MODULE_PATH}"]`

#### Go (gremlins)
- Config: `.gremlins.yaml` (optional)
- Extract from: package path
- Update: CLI args `gremlins unleash $MODULE_PATH`

#### Rust (cargo-mutants)
- Config: `mutants.toml` (optional)
- Extract from: workspace/package
- Update: `--package $PACKAGE_NAME`

### Step 4: Determine Effective Target Score

Compute the target mutation score based on TIER or TARGET_SCORE parameter.

**Logic**:
```
if TARGET_SCORE > 0:
    EFFECTIVE_TARGET_SCORE = TARGET_SCORE
else if TIER == "critical":
    EFFECTIVE_TARGET_SCORE = 90
else if TIER == "high":
    EFFECTIVE_TARGET_SCORE = 85
else if TIER == "standard":
    EFFECTIVE_TARGET_SCORE = 75
else:
    EFFECTIVE_TARGET_SCORE = 85  # Default
```

### Step 5: Run Baseline Mutation Testing

Execute mutation testing to establish baseline (tool-specific command from config).

#### Python (Poodle)
```bash
# Run Poodle with configured settings
python -m poodle

# Poodle outputs:
# - Summary to stdout
# - JSON report (if configured in poodle.toml)
# - HTML report (if configured)
```

**Expected Output**:
```
Poodle Results:
  Total mutations: 138
  Killed: 124
  Survived: 14
  Mutation score: 89.9%
```

#### Python (mutmut)
```bash
# Run mutmut
mutmut run --paths-to-mutate=$MODULE_PATH

# Get results
mutmut results

# Export JSON
mutmut junitxml > mutmut-results.xml
```

#### JavaScript/TypeScript (Stryker)
```bash
# Run Stryker mutation testing
npx stryker run

# Stryker outputs:
# - reports/mutation/mutation.html
# - reports/mutation/mutation.json
```

**Expected Output**:
```
Stryker Results:
  Mutants: 245
  Killed: 198
  Survived: 47
  Mutation score: 80.8%
```

#### Go (gremlins)
```bash
# Run gremlins
gremlins unleash $MODULE_PATH

# Gremlins outputs:
# - Summary to stdout
# - .gremlins.json (if configured)
```

#### Rust (cargo-mutants)
```bash
# Run cargo-mutants
cargo mutants --package $PACKAGE_NAME

# cargo-mutants outputs:
# - mutants.out/ directory
# - Summary to stdout
```

**If mutation testing fails**:
- Check that tests pass first (run test suite)
- Check tool configuration file
- Verify environment setup (PYTHONPATH, NODE_PATH, etc.)
- Review error messages for clues

### Step 6: Parse Mutation Testing Results

Extract key metrics from tool output (tool-specific parsing).

**Common Metrics**:
- **Total mutations**: Number of mutants generated
- **Killed**: Mutants detected by tests
- **Survived**: Mutants that tests didn't detect
- **Mutation score**: (killed / total) × 100

**Tool-Specific Parsing**:

#### Poodle
Parse from stdout or JSON report:
```python
import json
with open('poodle-results.json') as f:
    data = json.load(f)
    total = data['total_mutations']
    killed = data['mutations_killed']
```

#### Stryker
Parse from `reports/mutation/mutation.json`:
```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('reports/mutation/mutation.json'));
const total = data.files.reduce((sum, f) => sum + f.mutants.length, 0);
const killed = data.files.reduce((sum, f) =>
  sum + f.mutants.filter(m => m.status === 'Killed').length, 0);
```

#### gremlins / cargo-mutants
Parse from stdout or JSON output (format varies by tool version)

**Compute**:
```
BASELINE_SCORE = (MUTATIONS_KILLED / TOTAL_MUTATIONS) × 100
SURVIVED_COUNT = TOTAL_MUTATIONS - MUTATIONS_KILLED
```

### Step 7: Generate Baseline Report

Create comprehensive baseline report documenting current state.

**Report Structure** (`$RUN_DIR/baseline-report.md`):

```markdown
# Mutation Testing Baseline Report

**Date**: <current-date>
**Component**: <COMPONENT_NAME>
**Language**: <DETECTED_LANGUAGE>
**Module**: <EFFECTIVE_MODULE_PATH>
**Tool**: <DETECTED_MUTATION_TOOL>

## Current Status

| Metric | Value |
|--------|-------|
| Line Coverage | <COVERAGE_PERCENTAGE>% |
| Total Mutations | <TOTAL_MUTATIONS> |
| Mutations Killed | <MUTATIONS_KILLED> |
| Survived | <SURVIVED_COUNT> |
| **Mutation Score** | **<BASELINE_SCORE>%** |

## Target

- **Tier**: <TIER>
- **Target Score**: <EFFECTIVE_TARGET_SCORE>%
- **Gap**: <gap> percentage points
- **Status**: <below target / at target / exceeds target>

## Tool Configuration

**Language**: <DETECTED_LANGUAGE>
**Tool**: <DETECTED_MUTATION_TOOL>
**Config File**: <tool-specific config file>
**Exclusions**: <list from tool config>
**Scope**: <from tool config>

## Recommendations

<if BASELINE_SCORE >= EFFECTIVE_TARGET_SCORE>
✅ **Target achieved!** Current score meets or exceeds target.
Consider:
- Documenting surviving mutants (Phase 4)
- Applying to other modules
</if>

<if BASELINE_SCORE >= 90>
✅ **Excellent quality!** Score exceeds 90%.
Surviving mutants are likely low-value or equivalent.
</if>

<if 60 <= BASELINE_SCORE < EFFECTIVE_TARGET_SCORE>
⚠ **Improvement needed**: <gap> percentage points to target
Proceed with test improvements (Phase 2-5)
</if>

<if BASELINE_SCORE < 60>
❌ **Low mutation score**: Indicates weak tests or low coverage
Recommendation:
1. Run /increase-coverage first
2. Review test quality (.claude/rules/testing.md)
3. Re-run mutation testing
</if>

## Next Steps

<if target achieved or score >= 90>
- Proceed to Phase 4: Exclusion Assessment
- Document survivors and exclusions
- Apply learnings to other modules
</if>

<else>
- Proceed to Phase 1: Analyze Survivors
- Categorize and prioritize mutants
- Design kill strategies
</else>
```

### Step 8: Validate Prerequisites for Continuation

Check if workflow should continue or stop early.

**Stop Conditions** (output FAILURE or success early):
- Coverage < 60% AND FORCE=false → Fail with coverage error
- No surviving mutants (100% score) → Success, skip to Phase 5 (report)
- Baseline score >= 90% → Optional: Proceed to Phase 4 (exclusions) only

**Continue Conditions**:
- 60% <= baseline_score < 90%
- At least 1 surviving mutant
- Coverage >= 60% OR FORCE=true

## Outputs

### Files Created
1. **$RUN_DIR/baseline-report.md**: Comprehensive baseline analysis
2. **$RUN_DIR/mutation-baseline-results.json**: Raw mutation testing results (optional, tool-specific)

### Parameters Exported
- `BASELINE_SCORE`: Initial mutation score
- `TOTAL_MUTATIONS`: Total mutants generated
- `MUTATIONS_KILLED`: Mutants killed
- `SURVIVED_COUNT`: Surviving mutants
- `EFFECTIVE_MODULE_PATH`: Module under test
- `EFFECTIVE_TARGET_SCORE`: Target score
- `COVERAGE_PERCENTAGE`: Line coverage
- `RUN_DIR`: Timestamped run directory path
- `COMPONENT_NAME`: Component being tested
- `DETECTED_LANGUAGE`: Auto-detected language
- `DETECTED_MUTATION_TOOL`: Auto-detected mutation tool

## Success Criteria

- [ ] Configuration file loaded successfully
- [ ] Component, language, and mutation tool detected
- [ ] Mutation testing tool is installed and functional
- [ ] Tool configuration file is valid and readable
- [ ] Coverage >= 60% OR FORCE=true
- [ ] Baseline mutation testing completed successfully
- [ ] Baseline score computed and valid (0-100)
- [ ] Effective module path determined
- [ ] Effective target score computed
- [ ] Baseline report generated
- [ ] All output parameters exported

## Error Handling

### Coverage Too Low
```
Error: Coverage is 45%, minimum 60% required
Recommendation: Run /increase-coverage --tier=<tier> --limit=10
Solution: Fix coverage, then re-run this workflow
```

### Mutation Tool Not Installed
```
Error: <tool> command not found
Solution:
- Poodle: pip install poodle
- mutmut: pip install mutmut
- Stryker: npm install --save-dev @stryker-mutator/core
- gremlins: go install github.com/go-gremlins/gremlins/cmd/gremlins@latest
- cargo-mutants: cargo install cargo-mutants
```

### Configuration File Missing
```
Error: Configuration file not found: .claude/rules/testing-workflows-config.md
Solution: Run /init-coverage-config to generate configuration
```

### Tests Failing
```
Error: Mutation testing failed - tests are failing
Solution:
1. Run tests to identify failures (tool-specific command)
2. Fix failing tests
3. Re-run this workflow
```

### Invalid Tool Configuration
```
Error: Tool configuration is invalid or missing required fields
Solution:
1. Check tool-specific config file syntax
2. Verify required fields for the mutation testing tool
3. Fix configuration and re-run
```

### No Mutations Generated
```
Error: Mutation testing generated 0 mutations
Possible causes:
- Module path doesn't match any source files
- All mutations are excluded
- Source files have no mutable code
Solution: Review tool configuration and module path
```

## Notes

**Multi-Language Support**:
- This workflow is **language-agnostic** and uses configuration from `.claude/rules/testing-workflows-config.md`
- Supports Python (Poodle, mutmut), JavaScript/TypeScript (Stryker), Go (gremlins), Rust (cargo-mutants)
- Tool detection and command selection is automatic based on component configuration
- See `.claude/rules/testing-workflows-config.md` for component-specific settings

**Mutation Tool Comparison**:

| Tool | Language | Exclusions | Performance |
|------|----------|------------|-------------|
| Poodle | Python | `skip_mutators` in toml, `# nomut:` comments | Parallel via `max_workers` |
| mutmut | Python | `# pragma: no mutate` comments | Single-threaded |
| Stryker | JS/TS | `excludedMutations` in config | Parallel by default |
| gremlins | Go | Config file exclusions | Parallel |
| cargo-mutants | Rust | `--exclude` flag | Parallel |

**Performance**:
- Mutation testing is slow (5-30 minutes depending on test suite size and language)
- Use scope limiting (module path / file filters) to reduce runtime
- Most tools support parallelization (check tool-specific configuration)

**Configuration**:
- `.claude/rules/testing-workflows-config.md` is the source of truth for workflow configuration
- Tool-specific config files (e.g., `poodle.toml`, `stryker.config.js`) contain tool settings
- Workflow can temporarily override scope if MODULE_PATH is specified
- Original tool config should be restored after workflow completes

**Backward Compatibility**:
- `BACKEND_ONLY` parameter still works (mapped to `COMPONENTS=backend`)
- `POODLE_CONFIG` parameter still works (mapped to tool config file)
- Defaults to Python/backend for existing projects
