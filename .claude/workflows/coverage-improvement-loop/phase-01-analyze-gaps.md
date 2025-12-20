---
phase_metadata:
  execution_mode: sequential

  inputs:
    parameters:
      - name: TARGET_COVERAGE
        required: false
        default: 80
        description: "Target overall coverage percentage"
        type: number
      - name: CRITICAL_TIER_TARGET
        required: false
        default: 90
        description: "Target coverage for critical tier"
        type: number
      - name: HIGH_RISK_TIER_TARGET
        required: false
        default: 80
        description: "Target coverage for high-risk tier"
        type: number
      - name: STANDARD_TIER_TARGET
        required: false
        default: 60
        description: "Target coverage for standard tier"
        type: number
      - name: FILES_PER_ITERATION
        required: false
        default: 5
        description: "Number of files to prioritize per iteration"
        type: integer
      - name: TIER
        required: false
        default: ""
        description: "Focus on specific tier (empty = all)"
        type: string
      - name: LOOP_INDEX
        required: true
        description: "Current loop iteration number (injected by orchestrator)"
        type: integer

  outputs:
    files:
      - path: "$OUTPUT_DIR/run-$RUN_ID/iteration-$LOOP_INDEX-analysis.md"
        description: "Coverage gap analysis for this iteration"
    parameters:
      - name: CURRENT_COVERAGE
        description: "Current overall coverage percentage"
        type: number
      - name: CURRENT_CRITICAL
        description: "Current critical tier coverage"
        type: number
      - name: CURRENT_HIGH_RISK
        description: "Current high-risk tier coverage"
        type: number
      - name: CURRENT_STANDARD
        description: "Current standard tier coverage"
        type: number
      - name: PRIORITY_FILES
        description: "Comma-separated list of priority file paths to improve"
        type: string
      - name: PRIORITY_COUNT
        description: "Number of priority files identified"
        type: integer
      - name: TARGETS_MET
        description: "Whether all coverage targets have been met"
        type: boolean
---

# Phase 01: Analyze Coverage Gaps

**Purpose**: Run coverage analysis, identify uncovered lines by tier, calculate priority scores, and select top files for test generation in this iteration.

## Prerequisites
- Prerequisites phase completed (PREREQUISITES_MET = true)
- Test runner and coverage tools installed (pytest/vitest/etc)
- CONFIG_FILE exists with component configuration
- LOOP_INDEX parameter available (provided by orchestrator)

## Tasks for Todo List
When starting this phase, add these tasks:
1. Loading component configuration from CONFIG_FILE
2. Running current coverage measurement using component-specific command
3. Parsing coverage data to extract per-file coverage
4. Categorizing files by tier using component-specific patterns
5. Calculating priority scores (coverage_gap × tier_weight × complexity)
6. Selecting top N priority files for this iteration
7. Checking if coverage targets have been met
8. Writing analysis report to markdown file
9. Exporting discovered parameters for next phase

## Parameters Used
- **TARGET_COVERAGE**: Overall coverage target (e.g., 80%)
- **CRITICAL_TIER_TARGET**: Critical tier target (e.g., 90%)
- **HIGH_RISK_TIER_TARGET**: High-risk tier target (e.g., 80%)
- **STANDARD_TIER_TARGET**: Standard tier target (e.g., 60%)
- **FILES_PER_ITERATION**: How many files to prioritize (e.g., 5)
- **TIER**: Optional tier filter (critical/high-risk/standard or empty for all)
- **LOOP_INDEX**: Current iteration number (e.g., 1, 2, 3...)
- **CONFIG_FILE**: Path to project-specific coverage configuration (default: `.claude/rules/testing-workflows-config.md`)
- **COMPONENTS**: Comma-separated list of components to analyze (e.g., "backend,frontend")

## Process

### Step 0: Load Component Configuration

Before running coverage, load component-specific configuration from CONFIG_FILE:

```python
import re

def load_component_config(config_file, component_name):
    """
    Load component configuration from CONFIG_FILE.

    Returns dict with:
    - language: str (python/typescript/javascript/go/rust)
    - package_name: str
    - source_dir: str
    - test_dir: str
    - coverage_command: str
    - coverage_data_path: str (JSON output location)
    - tier_patterns: dict with keys 'critical', 'high_risk', 'standard'
    """
    with open(config_file) as f:
        content = f.read()

    # Find component section
    component_pattern = rf"## Component: {component_name}.*?(?=## Component:|## Customization Guide|$)"
    match = re.search(component_pattern, content, re.DOTALL | re.IGNORECASE)

    if not match:
        raise ValueError(f"Component '{component_name}' not found in {config_file}")

    section = match.group(0)

    # Extract package name
    package_match = re.search(r"Package name.*?`([^`]+)`", section)
    package_name = package_match.group(1) if package_match else None

    # Extract source directory
    source_match = re.search(r"Source directory.*?`([^`]+)`", section)
    source_dir = source_match.group(1) if source_match else None

    # Extract coverage command (look for "Generate coverage report:" section)
    coverage_cmd_match = re.search(
        r"Generate coverage report:\s*```bash\s*([^`]+)```",
        section,
        re.DOTALL
    )
    coverage_command = coverage_cmd_match.group(1).strip() if coverage_cmd_match else None

    # Extract coverage data location
    coverage_data_match = re.search(r"Report JSON:\s*`([^`]+)`", section)
    coverage_data_path = coverage_data_match.group(1) if coverage_data_match else "coverage.json"

    # Extract tier patterns
    tier_patterns = {
        'critical': [],
        'high_risk': [],
        'standard': []
    }

    # Find tier definitions section
    for tier_name, tier_key in [
        ("Critical Tier", "critical"),
        ("High-Risk Tier", "high_risk"),
        ("Standard Tier", "standard")
    ]:
        tier_match = re.search(
            rf"\*\*{tier_name}.*?\*\*\s*\n.*?(?=\*\*(?:Critical|High-Risk|Standard) Tier|### Test Utilities|$)",
            section,
            re.DOTALL
        )
        if tier_match:
            tier_content = tier_match.group(0)
            # Extract patterns (lines starting with "- `pattern`")
            patterns = re.findall(r"- `([^`]+)`", tier_content)
            tier_patterns[tier_key] = patterns

    # Detect language from package name or source dir
    if "typescript" in section.lower() or "vue" in section.lower():
        language = "typescript"
    elif ".go" in source_dir or "golang" in section.lower():
        language = "go"
    elif ".rs" in source_dir or "rust" in section.lower():
        language = "rust"
    elif ".js" in source_dir or "javascript" in section.lower():
        language = "javascript"
    else:
        language = "python"

    return {
        'language': language,
        'package_name': package_name,
        'source_dir': source_dir,
        'coverage_command': coverage_command,
        'coverage_data_path': coverage_data_path,
        'tier_patterns': tier_patterns
    }

# Load configuration for current component
config = load_component_config(CONFIG_FILE, component_name="Backend")
```

### Step 1: Run Current Coverage Measurement

Execute coverage using component-specific command:

```bash
# Example for Python (pytest)
PYTHONPATH=src pytest tests/ \
    --cov=telegram_claude_bot \
    --cov-report=term-missing \
    --cov-report=json:coverage.json \
    -q

# Example for TypeScript (vitest)
cd frontend && npm run test:coverage

# Example for Go
go test -coverprofile=coverage.out ./... && \
    go tool cover -func=coverage.out -o coverage.json

# Use config['coverage_command'] dynamically
eval ${config['coverage_command']}

# Extract current overall coverage (format varies by language)
# Python (pytest-cov): coverage.json['totals']['percent_covered']
# TypeScript (vitest): coverage-final.json (istanbul format)
# Go: Parse coverage.out
```

### Step 2: Parse Coverage by File

Extract per-file coverage data from coverage file (format varies by language):

```python
import json

def parse_coverage_data(config):
    """
    Parse coverage data based on language/tool.

    Returns: dict of {filepath: {percent_covered, missing_lines, num_statements}}
    """
    coverage_path = config['coverage_data_path']
    source_dir = config['source_dir']
    package_name = config['package_name']

    files_coverage = {}

    if config['language'] == 'python':
        # pytest-cov format: coverage.json
        with open(coverage_path) as f:
            coverage_data = json.load(f)

        for filepath, file_data in coverage_data['files'].items():
            # Filter by source directory or package name
            if source_dir and source_dir in filepath:
                files_coverage[filepath] = {
                    'percent_covered': file_data['summary']['percent_covered'],
                    'missing_lines': file_data['summary']['missing_lines'],
                    'num_statements': file_data['summary']['num_statements']
                }

    elif config['language'] in ['typescript', 'javascript']:
        # Istanbul/Vitest format: coverage-final.json
        with open(coverage_path) as f:
            coverage_data = json.load(f)

        for filepath, file_data in coverage_data.items():
            if source_dir and source_dir in filepath:
                total = sum(file_data['s'].values())  # Statement counts
                covered = sum(1 for count in file_data['s'].values() if count > 0)
                percent = (covered / total * 100) if total > 0 else 0

                files_coverage[filepath] = {
                    'percent_covered': percent,
                    'missing_lines': len([k for k, v in file_data['s'].items() if v == 0]),
                    'num_statements': total
                }

    elif config['language'] == 'go':
        # Go coverage format: coverage.out
        # Parse using: go tool cover -func=coverage.out
        # (Implementation would parse text output)
        pass

    return files_coverage

files_coverage = parse_coverage_data(config)
```

### Step 3: Categorize Files by Tier

Group files into tiers based on component-specific patterns loaded from config:

```python
def categorize_file_by_tier(filepath, tier_patterns):
    """
    Categorize a file based on tier patterns from config.

    Args:
        filepath: str - Full path to source file
        tier_patterns: dict - {tier_name: [patterns]} from config

    Returns: tuple (tier_name, tier_weight)
        - tier_name: 'critical' | 'high_risk' | 'standard'
        - tier_weight: 3 | 2 | 1
    """
    # Check critical tier first (highest priority)
    for pattern in tier_patterns['critical']:
        if pattern in filepath:
            return ('critical', 3)

    # Check high-risk tier
    for pattern in tier_patterns['high_risk']:
        if pattern in filepath:
            return ('high_risk', 2)

    # Check standard tier
    for pattern in tier_patterns['standard']:
        if pattern in filepath:
            return ('standard', 1)

    # Default to standard if no match
    return ('standard', 1)

# Categorize all files
files_by_tier = {
    'critical': {},
    'high_risk': {},
    'standard': {}
}

for filepath, coverage_info in files_coverage.items():
    tier_name, tier_weight = categorize_file_by_tier(filepath, config['tier_patterns'])
    files_by_tier[tier_name][filepath] = {
        **coverage_info,
        'tier_weight': tier_weight
    }

# Apply tier filter if TIER parameter is set
if TIER:
    filtered_files = files_by_tier.get(TIER, {})
else:
    filtered_files = {
        filepath: info
        for tier_files in files_by_tier.values()
        for filepath, info in tier_files.items()
    }
```

**Tier Weights**:
- **Critical (weight=3)**: Patterns from config (e.g., auth/, web/api/, stores/auth.ts)
- **High-Risk (weight=2)**: Patterns from config (e.g., storage/, session/manager.py, components/workspace/)
- **Standard (weight=1)**: Patterns from config (e.g., utils/, config/, components/common/)

Apply tier filter if TIER parameter is set (e.g., if TIER="critical", only analyze critical files).

### Step 4: Calculate Priority Scores

For each file, calculate priority score:

```
Priority Score = Coverage Gap × Tier Weight × Complexity Factor

Where:
- Coverage Gap = (Target - Current) / Target
  - Example: (90 - 45) / 90 = 0.50
- Tier Weight = 3 (critical), 2 (high-risk), 1 (standard)
- Complexity Factor = min(num_statements / 100, 3.0)
  - Small files (< 100 lines): factor ≈ 1.0
  - Medium files (100-300 lines): factor = 1.0-3.0
  - Large files (> 300 lines): factor capped at 3.0
```

**Example Calculation (Python)**:
```
File: src/telegram_claude_bot/auth/manager.py
- Current coverage: 45%
- Target (critical tier): 90%
- Num statements: 250
- Coverage gap: (90 - 45) / 90 = 0.50
- Tier weight: 3
- Complexity: 250 / 100 = 2.5
- Priority score: 0.50 × 3 × 2.5 = 3.75
```

**Example Calculation (TypeScript)**:
```
File: frontend/src/stores/auth.ts
- Current coverage: 35%
- Target (critical tier): 90%
- Num statements: 180
- Coverage gap: (90 - 35) / 90 = 0.61
- Tier weight: 3
- Complexity: 180 / 100 = 1.8
- Priority score: 0.61 × 3 × 1.8 = 3.29
```

### Step 5: Select Top Priority Files

Sort files by priority score (descending) and select top FILES_PER_ITERATION files:

```python
# Sort by priority score
sorted_files = sorted(
    priority_scores.items(),
    key=lambda x: x[1]['priority_score'],
    reverse=True
)

# Take top N files
priority_files = sorted_files[:FILES_PER_ITERATION]
```

Export as comma-separated parameter:
```
PRIORITY_FILES=src/auth/manager.py,src/web/api/auth.py,src/session/models.py
PRIORITY_COUNT=3
```

### Step 6: Calculate Tier-Level Coverage

Aggregate coverage for each tier:

```python
# Calculate average coverage per tier
critical_files = [f for f in files_coverage if is_critical_tier(f)]
high_risk_files = [f for f in files_coverage if is_high_risk_tier(f)]
standard_files = [f for f in files_coverage if is_standard_tier(f)]

CURRENT_CRITICAL = avg_coverage(critical_files)
CURRENT_HIGH_RISK = avg_coverage(high_risk_files)
CURRENT_STANDARD = avg_coverage(standard_files)
```

### Step 7: Check if Targets Met

Determine if all coverage targets have been achieved:

```python
targets_met = (
    CURRENT_COVERAGE >= TARGET_COVERAGE and
    CURRENT_CRITICAL >= CRITICAL_TIER_TARGET and
    CURRENT_HIGH_RISK >= HIGH_RISK_TIER_TARGET and
    CURRENT_STANDARD >= STANDARD_TIER_TARGET
)

TARGETS_MET = targets_met
```

### Step 8: Generate Analysis Report

Write detailed analysis to markdown file at `$OUTPUT_DIR/run-$RUN_ID/iteration-$LOOP_INDEX-analysis.md`:

```markdown
# Coverage Gap Analysis - Iteration $LOOP_INDEX

## Current Coverage Status

| Tier | Current | Target | Gap | Status |
|------|---------|--------|-----|--------|
| Critical | 45.0% | 90.0% | -45.0% | ❌ Below |
| High-Risk | 35.0% | 80.0% | -45.0% | ❌ Below |
| Standard | 25.0% | 60.0% | -35.0% | ❌ Below |
| **Overall** | **31.0%** | **80.0%** | **-49.0%** | ❌ Below |

## Priority Files for This Iteration

### Python Backend Example

1. **src/telegram_claude_bot/auth/manager.py** (score: 3.75)
   - Current: 45%, Target: 90%, Gap: 45%
   - Tier: Critical, Statements: 250
   - Missing lines: [45-52, 78-85, 120-135]

2. **src/telegram_claude_bot/web/api/auth.py** (score: 3.20)
   - Current: 50%, Target: 90%, Gap: 40%
   - Tier: Critical, Statements: 180
   - Missing lines: [22-28, 55-62, 95-110]

### TypeScript Frontend Example

1. **frontend/src/stores/auth.ts** (score: 3.29)
   - Current: 35%, Target: 90%, Gap: 55%
   - Tier: Critical, Statements: 180
   - Missing lines: Functions without tests: `loginWithGithub`, `handleTokenRefresh`

2. **frontend/src/api/client.ts** (score: 2.85)
   - Current: 40%, Target: 90%, Gap: 50%
   - Tier: Critical, Statements: 150
   - Missing lines: Error handling paths, retry logic

... (continue for all priority files)

## Targets Status
- Targets met: false
- Continue improving: true
```

## Outputs

**Files Created**:
- `$OUTPUT_DIR/run-$RUN_ID/iteration-$LOOP_INDEX-analysis.md`: Detailed gap analysis

**Parameters Discovered**:
- `CURRENT_COVERAGE`: Current overall coverage percentage (e.g., 31.0)
- `CURRENT_CRITICAL`: Current critical tier coverage (e.g., 45.0)
- `CURRENT_HIGH_RISK`: Current high-risk tier coverage (e.g., 35.0)
- `CURRENT_STANDARD`: Current standard tier coverage (e.g., 25.0)
- `PRIORITY_FILES`: Comma-separated list of file paths (e.g., "src/auth/manager.py,src/web/api/auth.py")
- `PRIORITY_COUNT`: Number of priority files (e.g., 5)
- `TARGETS_MET`: Boolean indicating if all targets are met (e.g., false)

## Success Criteria
- [ ] Coverage measurement completed successfully
- [ ] All files categorized by tier correctly
- [ ] Priority scores calculated for all eligible files
- [ ] Top N priority files selected and exported
- [ ] Tier-level coverage aggregated correctly
- [ ] Analysis report written to output file
- [ ] All output parameters exported

## Error Handling

**Coverage Measurement Fails**:
- Check for test failures or syntax errors
- Log the error details
- Exit with FAILURE status

**No Files Need Improvement**:
- If all files already meet targets but TARGETS_MET is false
- Log warning and set PRIORITY_COUNT=0
- Continue to next phase (will trigger loop exit in decision phase)

**Tier Filter Produces No Results**:
- If TIER parameter set but no files in that tier need improvement
- Log informational message
- Set PRIORITY_COUNT=0 and continue

**JSON Parsing Error**:
- If coverage.json is malformed or missing
- Re-run coverage measurement once
- If still fails, exit with FAILURE and clear error message
