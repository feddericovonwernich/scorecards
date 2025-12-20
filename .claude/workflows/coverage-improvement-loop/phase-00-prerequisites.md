---
phase_metadata:
  execution_mode: sequential

  inputs:
    parameters:
      - name: COMPONENTS
        required: false
        default: "backend"
        description: "Comma-separated list of components to check (e.g., 'backend', 'frontend', 'backend,frontend')"
        type: string
      - name: CONFIG_FILE
        required: false
        default: ".claude/rules/testing-workflows-config.md"
        description: "Path to coverage workflow configuration file"
        type: string
      - name: FORCE
        required: false
        default: false
        description: "Skip prerequisite checks"
        type: boolean
      - name: MIN_COVERAGE
        required: false
        default: 60
        description: "Minimum acceptable coverage percentage"
        type: number

  outputs:
    parameters:
      - name: BASELINE_COVERAGE
        description: "Current overall coverage percentage (all components)"
        type: number
      - name: BASELINE_CRITICAL
        description: "Current critical tier coverage percentage (all components)"
        type: number
      - name: BASELINE_HIGH_RISK
        description: "Current high-risk tier coverage percentage (all components)"
        type: number
      - name: BASELINE_STANDARD
        description: "Current standard tier coverage percentage (all components)"
        type: number
      - name: COMPONENTS_CHECKED
        description: "List of components that were checked"
        type: array
      - name: PREREQUISITES_MET
        description: "Whether all prerequisites are satisfied"
        type: boolean
---

# Phase 00: Prerequisites Check

**Purpose**: Verify that the environment is ready for iterative coverage improvement, establish baseline metrics per component, and validate existing test quality.

## Prerequisites
- Coverage workflow configuration file exists (default: `.claude/rules/testing-workflows-config.md`)
- Required test runners and coverage tools installed (per component)
- Existing test suite for each component
- Project follows structure documented in config file

## Tasks for Todo List
When starting this phase, add these tasks:
1. Loading coverage configuration from CONFIG_FILE
2. Detecting and validating components to check
3. Verifying test runner and coverage tool installation (per component)
4. Running baseline coverage measurement (per component)
5. Parsing coverage reports by tier (critical/high-risk/standard)
6. Validating existing test quality (no weak assertions)
7. Calculating baseline metrics for all tiers (aggregated across components)
8. Writing baseline metrics to output parameters

## Parameters Used
- **COMPONENTS**: Comma-separated list of components to check
- **CONFIG_FILE**: Path to configuration file
- **FORCE**: Skip prerequisite checks if true
- **MIN_COVERAGE**: Minimum acceptable coverage threshold

## Process

### Step 0: Load Configuration

Read the coverage workflow configuration file to determine component-specific settings.

```bash
# Verify config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "ERROR: Coverage config file not found: $CONFIG_FILE"
    echo "Run /init-coverage-config to create it"
    exit 1
fi

echo "✓ Found configuration file: $CONFIG_FILE"

# Parse COMPONENTS parameter (comma-separated list)
# If empty or "all", auto-detect from config file
if [ "$COMPONENTS" = "all" ] || [ -z "$COMPONENTS" ]; then
    # Extract component names from config file
    # Look for "## Component: <name> (<language>)" headers
    # Example: "## Component: Backend (Python)" → "backend"
    COMPONENTS=$(grep -E "^## Component:" "$CONFIG_FILE" | \
                sed -E 's/^## Component: ([^ ]+).*/\1/' | \
                tr '[:upper:]' '[:lower:]' | \
                tr '\n' ',' | \
                sed 's/,$//')
fi

echo "Components to check: $COMPONENTS"

# For each component, extract:
# 1. Test runner (e.g., pytest, vitest)
# 2. Coverage command
# 3. Coverage report location
# 4. Tier patterns (critical, high-risk, standard)
# 5. Package/module name

# This will be done in subsequent steps by parsing the config file
```

**Implementation Note**: The config file structure is:
- `## Component: <Name> (<Language>)` - Component header
- `**Package name**: <name>` - Module/package name for coverage
- `**Runner**: <runner>` - Test runner command
- Coverage commands under `### Coverage Commands` section
- Tier patterns under `### Tier Definitions` section

### Step 1: Verify Dependencies (Per Component)

For each component in COMPONENTS list, verify that the test runner and coverage tools are installed.

```bash
# Parse COMPONENTS into array
IFS=',' read -ra COMPONENT_ARRAY <<< "$COMPONENTS"

# Track failed components
FAILED_COMPONENTS=()

for component in "${COMPONENT_ARRAY[@]}"; do
    component=$(echo "$component" | xargs)  # Trim whitespace
    echo "Checking dependencies for: $component"

    # Extract test runner from config file
    # Look for "## Component: <component>" section, then find "**Runner**: <runner>"
    RUNNER=$(awk -v comp="$component" '
        BEGIN { IGNORECASE=1; in_section=0 }
        /^## Component:/ {
            if (tolower($3) ~ tolower(comp)) in_section=1
            else in_section=0
        }
        in_section && /^\*\*Runner\*\*:/ { print $2; exit }
    ' "$CONFIG_FILE")

    if [ -z "$RUNNER" ]; then
        echo "ERROR: Could not find test runner for component: $component"
        FAILED_COMPONENTS+=("$component")
        continue
    fi

    # Verify runner is installed (component-specific checks)
    case "$RUNNER" in
        pytest)
            if ! python -m pytest --version &> /dev/null; then
                echo "ERROR: pytest not installed for $component"
                echo "Install with: pip install pytest pytest-cov"
                FAILED_COMPONENTS+=("$component")
            else
                echo "✓ pytest installed for $component"
            fi
            ;;
        vitest|npm)
            # Check if in component's directory (may be frontend/)
            TEST_DIR=$(awk -v comp="$component" '
                BEGIN { IGNORECASE=1; in_section=0 }
                /^## Component:/ {
                    if (tolower($3) ~ tolower(comp)) in_section=1
                    else in_section=0
                }
                in_section && /^\*\*Test directory/ {
                    match($0, /`([^`]+)`/, arr);
                    print arr[1];
                    exit
                }
            ' "$CONFIG_FILE")

            # Check for package.json
            if [ -n "$TEST_DIR" ]; then
                PACKAGE_DIR=$(dirname "$TEST_DIR")
                if [ ! -f "$PACKAGE_DIR/package.json" ]; then
                    echo "ERROR: package.json not found for $component in $PACKAGE_DIR"
                    FAILED_COMPONENTS+=("$component")
                else
                    echo "✓ npm project found for $component"
                fi
            else
                echo "ERROR: Could not determine test directory for $component"
                FAILED_COMPONENTS+=("$component")
            fi
            ;;
        *)
            echo "WARNING: Unknown test runner '$RUNNER' for $component"
            ;;
    esac
done

# Check if any components failed
if [ ${#FAILED_COMPONENTS[@]} -gt 0 ]; then
    echo "ERROR: Failed dependency check for components: ${FAILED_COMPONENTS[*]}"
    exit 1
fi

echo "✓ All component dependencies verified"
```

### Step 2: Run Baseline Coverage Measurement (Per Component)

Execute coverage measurement for each component using component-specific commands from the config file.

```bash
# Initialize component coverage tracking
declare -A COMPONENT_COVERAGE  # component_name -> overall coverage %
declare -A COMPONENT_REPORT_PATH  # component_name -> path to coverage JSON

# For each component, run coverage measurement
for component in "${COMPONENT_ARRAY[@]}"; do
    component=$(echo "$component" | xargs)  # Trim whitespace
    echo "Running coverage measurement for: $component"

    # Extract coverage command from config file
    # Look for "## Component: <component>" section, then find coverage command
    # under "**Generate coverage report:**" in the "### Coverage Commands" section

    # Extract the entire coverage command block
    COVERAGE_CMD=$(awk -v comp="$component" '
        BEGIN { IGNORECASE=1; in_section=0; in_coverage=0 }
        /^## Component:/ {
            if (tolower($3) ~ tolower(comp)) in_section=1
            else in_section=0
        }
        in_section && /^\*\*Generate coverage report:/ { in_coverage=1; next }
        in_coverage && /^```bash/ { getline; cmd=$0; while (getline && !/^```/) cmd=cmd"\n"$0; print cmd; exit }
    ' "$CONFIG_FILE")

    if [ -z "$COVERAGE_CMD" ]; then
        echo "ERROR: Could not find coverage command for component: $component"
        exit 1
    fi

    # Extract coverage report location
    REPORT_JSON=$(awk -v comp="$component" '
        BEGIN { IGNORECASE=1; in_section=0 }
        /^## Component:/ {
            if (tolower($3) ~ tolower(comp)) in_section=1
            else in_section=0
        }
        in_section && /- Report JSON:/ {
            match($0, /`([^`]+)`/, arr);
            print arr[1];
            exit
        }
    ' "$CONFIG_FILE")

    if [ -z "$REPORT_JSON" ]; then
        echo "ERROR: Could not find report JSON path for component: $component"
        exit 1
    fi

    # Execute coverage command
    echo "Executing: $COVERAGE_CMD"
    eval "$COVERAGE_CMD"

    if [ $? -ne 0 ]; then
        echo "ERROR: Coverage measurement failed for component: $component"
        exit 1
    fi

    # Extract overall coverage percentage from JSON report
    # Format varies by tool (pytest-cov vs vitest)
    if [ -f "$REPORT_JSON" ]; then
        # Detect format and extract coverage
        # pytest-cov: {"totals": {"percent_covered": 76.0}}
        # vitest: coverage-final.json has different structure
        COVERAGE_PCT=$(python3 -c "
import json
import sys
try:
    with open('$REPORT_JSON') as f:
        data = json.load(f)
    # Try pytest-cov format first
    if 'totals' in data and 'percent_covered' in data['totals']:
        print(f\"{data['totals']['percent_covered']:.1f}\")
    # Try vitest format (coverage-summary.json)
    elif 'total' in data and 'lines' in data['total']:
        pct = data['total']['lines']['pct']
        print(f\"{pct:.1f}\")
    else:
        print('0.0')
        sys.stderr.write('WARNING: Unknown coverage JSON format\n')
except Exception as e:
    print('0.0')
    sys.stderr.write(f'ERROR parsing coverage JSON: {e}\n')
" 2>&1)

        COMPONENT_COVERAGE[$component]=$COVERAGE_PCT
        COMPONENT_REPORT_PATH[$component]=$REPORT_JSON

        echo "✓ $component coverage: $COVERAGE_PCT%"
    else
        echo "ERROR: Coverage report not found: $REPORT_JSON"
        exit 1
    fi
done

# Calculate overall coverage (weighted average across components)
# For simplicity, use arithmetic mean (can be improved with weighted average)
TOTAL_COVERAGE=0
COUNT=0
for component in "${!COMPONENT_COVERAGE[@]}"; do
    TOTAL_COVERAGE=$(echo "$TOTAL_COVERAGE + ${COMPONENT_COVERAGE[$component]}" | bc)
    COUNT=$((COUNT + 1))
done

if [ $COUNT -gt 0 ]; then
    BASELINE_COVERAGE=$(echo "scale=1; $TOTAL_COVERAGE / $COUNT" | bc)
else
    BASELINE_COVERAGE=0.0
fi

echo "Overall coverage across all components: $BASELINE_COVERAGE%"
```

**Note**: Each component's coverage command is read from the config file. This supports:
- Python projects: `pytest --cov=<module_name>` (uses module name, NOT filesystem path)
- JavaScript/TypeScript: `npm run test:coverage` or `vitest --coverage`
- Other languages: Custom commands defined in config

### Step 3: Calculate Tier-Based Coverage (Per Component)

Analyze coverage by tier to understand where gaps exist. Tier patterns are loaded from the config file.

```bash
# Initialize tier coverage tracking (aggregated across all components)
declare -A TIER_FILES_COVERED    # tier_name -> sum of covered lines
declare -A TIER_FILES_TOTAL      # tier_name -> sum of total lines

# For each component, calculate tier-based coverage
for component in "${COMPONENT_ARRAY[@]}"; do
    component=$(echo "$component" | xargs)
    echo "Calculating tier coverage for: $component"

    REPORT_JSON="${COMPONENT_REPORT_PATH[$component]}"

    # Extract tier patterns from config file for this component
    # Tiers: Critical, High-Risk, Standard
    # Each tier has a list of path patterns (e.g., "auth/", "web/api/")

    # Extract Critical tier patterns
    CRITICAL_PATTERNS=$(awk -v comp="$component" '
        BEGIN { IGNORECASE=1; in_section=0; in_critical=0 }
        /^## Component:/ {
            if (tolower($3) ~ tolower(comp)) in_section=1
            else in_section=0
        }
        in_section && /^\*\*Critical Tier/ { in_critical=1; next }
        in_section && /^\*\*High-Risk Tier/ { in_critical=0 }
        in_critical && /^- `[^`]+`/ {
            match($0, /`([^`]+)`/, arr);
            print arr[1]
        }
    ' "$CONFIG_FILE")

    # Extract High-Risk tier patterns
    HIGHRISK_PATTERNS=$(awk -v comp="$component" '
        BEGIN { IGNORECASE=1; in_section=0; in_tier=0 }
        /^## Component:/ {
            if (tolower($3) ~ tolower(comp)) in_section=1
            else in_section=0
        }
        in_section && /^\*\*High-Risk Tier/ { in_tier=1; next }
        in_section && /^\*\*Standard Tier/ { in_tier=0 }
        in_tier && /^- `[^`]+`/ {
            match($0, /`([^`]+)`/, arr);
            print arr[1]
        }
    ' "$CONFIG_FILE")

    # Extract Standard tier patterns
    STANDARD_PATTERNS=$(awk -v comp="$component" '
        BEGIN { IGNORECASE=1; in_section=0; in_tier=0 }
        /^## Component:/ {
            if (tolower($3) ~ tolower(comp)) in_section=1
            else in_section=0
        }
        in_section && /^\*\*Standard Tier/ { in_tier=1; next }
        in_section && /^### Test Utilities/ { in_tier=0 }
        in_tier && /^- `[^`]+`/ {
            match($0, /`([^`]+)`/, arr);
            print arr[1]
        }
    ' "$CONFIG_FILE")

    # Parse coverage JSON and group files by tier
    # This Python script reads coverage.json and calculates per-tier coverage
    python3 << EOF
import json
import sys

# Load coverage report
with open("$REPORT_JSON") as f:
    data = json.load(f)

# Tier patterns (from config)
critical_patterns = """$CRITICAL_PATTERNS""".strip().split('\n')
highrisk_patterns = """$HIGHRISK_PATTERNS""".strip().split('\n')
standard_patterns = """$STANDARD_PATTERNS""".strip().split('\n')

# Initialize tier stats
tiers = {
    'critical': {'covered': 0, 'total': 0},
    'high_risk': {'covered': 0, 'total': 0},
    'standard': {'covered': 0, 'total': 0}
}

# Determine file coverage format (pytest-cov vs vitest)
# pytest-cov: data['files'][filename] = {'summary': {'covered_lines': X, 'num_statements': Y}}
# vitest: different structure

if 'files' in data:
    # pytest-cov format
    for filepath, file_data in data['files'].items():
        summary = file_data.get('summary', {})
        covered = summary.get('covered_lines', 0)
        total = summary.get('num_statements', 0)

        # Match against tier patterns
        matched = False
        for pattern in critical_patterns:
            if pattern and pattern in filepath:
                tiers['critical']['covered'] += covered
                tiers['critical']['total'] += total
                matched = True
                break

        if not matched:
            for pattern in highrisk_patterns:
                if pattern and pattern in filepath:
                    tiers['high_risk']['covered'] += covered
                    tiers['high_risk']['total'] += total
                    matched = True
                    break

        if not matched:
            for pattern in standard_patterns:
                if pattern and pattern in filepath:
                    tiers['standard']['covered'] += covered
                    tiers['standard']['total'] += total
                    matched = True
                    break
else:
    # vitest or other format - try to adapt
    sys.stderr.write("WARNING: Unknown coverage JSON format, tier calculation may be inaccurate\n")

# Calculate percentages and output
for tier_name, stats in tiers.items():
    if stats['total'] > 0:
        pct = (stats['covered'] / stats['total']) * 100
        print(f"{tier_name}={pct:.1f}")
    else:
        print(f"{tier_name}=0.0")
EOF

    # Read tier coverage outputs and accumulate
    while IFS='=' read -r tier_name tier_pct; do
        TIER_FILES_COVERED[$tier_name]=$(echo "${TIER_FILES_COVERED[$tier_name]:-0} + $tier_pct" | bc)
        TIER_FILES_TOTAL[$tier_name]=$(echo "${TIER_FILES_TOTAL[$tier_name]:-0} + 1" | bc)
    done < <(python3 tier_calc.py)

done

# Calculate aggregated tier coverage (average across components)
BASELINE_CRITICAL=0.0
BASELINE_HIGH_RISK=0.0
BASELINE_STANDARD=0.0

if [ "${TIER_FILES_TOTAL[critical]:-0}" != "0" ]; then
    BASELINE_CRITICAL=$(echo "scale=1; ${TIER_FILES_COVERED[critical]} / ${TIER_FILES_TOTAL[critical]}" | bc)
fi

if [ "${TIER_FILES_TOTAL[high_risk]:-0}" != "0" ]; then
    BASELINE_HIGH_RISK=$(echo "scale=1; ${TIER_FILES_COVERED[high_risk]} / ${TIER_FILES_TOTAL[high_risk]}" | bc)
fi

if [ "${TIER_FILES_TOTAL[standard]:-0}" != "0" ]; then
    BASELINE_STANDARD=$(echo "scale=1; ${TIER_FILES_COVERED[standard]} / ${TIER_FILES_TOTAL[standard]}" | bc)
fi

echo "Tier coverage (aggregated):"
echo "  Critical: $BASELINE_CRITICAL%"
echo "  High-Risk: $BASELINE_HIGH_RISK%"
echo "  Standard: $BASELINE_STANDARD%"
```

**Implementation Note**: Tier patterns are read from the config file under `### Tier Definitions` for each component. The coverage JSON is parsed and files are matched against patterns to calculate per-tier coverage.

### Step 4: Validate Test Quality

Check existing tests for quality standards (if not FORCE mode):

1. **No undocumented tests**: All test functions must have docstrings
2. **No weak assertions**: Check for patterns like `assert x is not None` without follow-up
3. **Proper organization**: Tests should be in behavioral groups
4. **Parameterization**: Similar tests should use `@pytest.mark.parametrize`

Run a quick scan of test files to verify compliance:

```bash
# Count tests without docstrings
undocumented=$(grep -r "def test_" tests/ | grep -v '"""' | wc -l)

if [ $undocumented -gt 0 ]; then
    echo "WARNING: Found $undocumented tests without docstrings"
    echo "Consider running /consolidate-tests to improve test quality first"
fi
```

### Step 5: Check Coverage Prerequisites

Verify that starting coverage isn't already at target (unless FORCE mode):

```bash
if [ "$FORCE" = "false" ]; then
    if (( $(echo "$BASELINE_COVERAGE >= $MIN_COVERAGE" | bc -l) )); then
        echo "INFO: Coverage ($BASELINE_COVERAGE%) already meets minimum target ($MIN_COVERAGE%)"
        echo "This workflow will continue to improve coverage further"
    fi
fi
```

### Step 6: Export Baseline Metrics

Write all baseline metrics as discovered parameters for subsequent phases:

```yaml
BASELINE_COVERAGE: <overall_coverage_percentage_all_components>
BASELINE_CRITICAL: <critical_tier_coverage_aggregated>
BASELINE_HIGH_RISK: <high_risk_tier_coverage_aggregated>
BASELINE_STANDARD: <standard_tier_coverage_aggregated>
COMPONENTS_CHECKED: [<component1>, <component2>, ...]
PREREQUISITES_MET: true
```

Example for multi-component project:
```yaml
BASELINE_COVERAGE: 63.0  # Average of backend=76.0, frontend=50.0
BASELINE_CRITICAL: 78.5
BASELINE_HIGH_RISK: 65.2
BASELINE_STANDARD: 58.7
COMPONENTS_CHECKED: [backend, frontend]
PREREQUISITES_MET: true
```

## Outputs

**Parameters Discovered**:
- `BASELINE_COVERAGE`: Overall coverage percentage across all components (e.g., 63.0)
- `BASELINE_CRITICAL`: Critical tier coverage aggregated (e.g., 78.5)
- `BASELINE_HIGH_RISK`: High-risk tier coverage aggregated (e.g., 65.2)
- `BASELINE_STANDARD`: Standard tier coverage aggregated (e.g., 58.7)
- `COMPONENTS_CHECKED`: Array of component names that were checked (e.g., ["backend", "frontend"])
- `PREREQUISITES_MET`: Boolean indicating if all checks passed

**Files Created**: None (this is a validation phase)

**Per-Component Data** (available but not exported as parameters):
- Each component's individual coverage percentage stored in `COMPONENT_COVERAGE` associative array
- Each component's coverage JSON path stored in `COMPONENT_REPORT_PATH` associative array
- Tier patterns extracted from config file per component

## Success Criteria
- [ ] Coverage configuration file found and parsed successfully
- [ ] All requested components detected and validated
- [ ] Test runners and coverage tools installed for all components
- [ ] Baseline coverage measurement completed for all components
- [ ] Tier-based coverage calculated for all three tiers (aggregated)
- [ ] Baseline metrics exported as parameters
- [ ] If not FORCE mode: existing test quality is acceptable

## Error Handling

**Missing Configuration**:
- If `CONFIG_FILE` not found, suggest running `/init-coverage-config`
- Exit with status FAILURE and clear error message

**Missing Dependencies** (per component):
- If test runner not installed (pytest, npm, etc.), provide installation instructions specific to that component
- List all failed components before exiting
- Exit with status FAILURE and clear error message

**Coverage Measurement Fails** (per component):
- If coverage command fails, check for syntax errors in tests
- Provide test file path and error details
- Continue with other components or exit based on severity
- Exit with FAILURE status if all components fail

**Component Not Found in Config**:
- If requested component doesn't have a section in CONFIG_FILE
- Suggest valid component names found in config
- Exit with FAILURE status

**Quality Issues** (if not FORCE):
- If many undocumented tests found, suggest running `/consolidate-tests` first
- If weak assertions detected, warn but allow continuation
- Log quality issues for follow-up

**No Tests Exist**:
- If tests directory is empty or has no test files for a component
- Warn for that component but continue with others
- Exit with FAILURE if ALL components have no tests
