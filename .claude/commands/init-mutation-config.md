---
description: Generate mutation testing configuration by analyzing project structure (multi-language)
allowed-tools: Read, Write, Bash, Glob, Grep
argument-hint: [--force] [--components=component1,component2]
---

# Initialize Mutation Testing Configuration

You are the **Mutation Testing Configuration Analyzer**. Your mission is to detect all project components (backend, frontend, etc.), identify their mutation testing tools, and generate a unified mutation testing configuration.

## Philosophy: Multi-Language, Tool-Agnostic

**Great mutation testing configuration is:**
- **Comprehensive**: Detects mutation testing tools across all languages
- **Accurate**: Extracts real config paths, commands, and exclusion patterns
- **Intelligent**: Suggests exclusions based on code patterns and best practices
- **Flexible**: Works for Poodle (Python), Stryker (JS/TS), Gremlins (Go), cargo-mutants (Rust), and more

## Arguments
$ARGUMENTS

### Argument Options
- `--force`: Overwrite existing configuration if present
- `--components=LIST`: Limit detection to specific components (comma-separated)

## Execution Workflow

### Phase 0: Pre-Check

#### 0.1 Check for Existing Configuration

```bash
# Check if config already exists in testing-workflows-config.md
if grep -q "### Mutation Testing Configuration" .claude/rules/testing-workflows-config.md 2>/dev/null && [ "$FORCE" != "true" ]; then
  echo "Mutation testing configuration already exists in .claude/rules/testing-workflows-config.md"
  echo "Use --force to overwrite or edit manually"
  exit 0
fi

# If testing-workflows-config.md doesn't exist, create it
if [ ! -f .claude/rules/testing-workflows-config.md ]; then
  echo "Note: .claude/rules/testing-workflows-config.md not found"
  echo "Will create new file with mutation testing configuration"
fi
```

### Phase 1: Detect Mutation Testing Tools

#### 1.1 Scan for Tool-Specific Configuration Files

Scan the repository for mutation testing configuration files:

**Detection Table:**

| Config File | Tool | Language | Default Command |
|-------------|------|----------|-----------------|
| `poodle.toml` | Poodle | Python | `python -m poodle` |
| `pyproject.toml` with `[tool.mutmut]` | mutmut | Python | `mutmut run` |
| `stryker.conf.{js,mjs,cjs,json}` | Stryker | JavaScript/TypeScript | `npx stryker run` |
| `package.json` with `@stryker-mutator` | Stryker | JavaScript/TypeScript | `npm run stryker` |
| `.stryker-tmp/` directory | Stryker | JavaScript/TypeScript | (inferred) |
| `go.mod` with gremlins import | gremlins | Go | `go test -tags=gremlins ./...` |
| `Cargo.toml` with `cargo-mutants` | cargo-mutants | Rust | `cargo mutants` |

**Scanning Strategy:**

```bash
# Find all mutation testing configuration files
find . -maxdepth 3 -type f \( \
  -name "poodle.toml" -o \
  -name "pyproject.toml" -o \
  -name "stryker.conf.*" -o \
  -name ".stryker.conf.*" -o \
  -name "package.json" -o \
  -name "go.mod" -o \
  -name "Cargo.toml" \
\) ! -path "*/node_modules/*" ! -path "*/.venv/*" ! -path "*/venv/*"

# Also check for .stryker-tmp/ directories (indicates Stryker usage)
find . -maxdepth 3 -type d -name ".stryker-tmp" 2>/dev/null
```

#### 1.2 Detect Tool from Configuration

For **each config file**, determine the mutation testing tool:

**Python - Poodle (poodle.toml):**
```bash
# Check if poodle.toml exists
if [ -f poodle.toml ]; then
  echo "Detected: Poodle (poodle.toml)"
  TOOL="Poodle"
  CONFIG_FILE="poodle.toml"
  RUN_COMMAND="python -m poodle"
fi
```

**Python - mutmut (pyproject.toml):**
```bash
# Check if pyproject.toml has [tool.mutmut] section
if grep -q "\[tool\.mutmut\]" pyproject.toml 2>/dev/null; then
  echo "Detected: mutmut (pyproject.toml)"
  TOOL="mutmut"
  CONFIG_FILE="pyproject.toml"
  RUN_COMMAND="mutmut run --paths-to-mutate=src/"
fi
```

**JavaScript/TypeScript - Stryker (stryker.conf.*):**
```bash
# Check for Stryker config files
STRYKER_CONFIG=$(find . -maxdepth 2 -name "stryker.conf.*" -o -name ".stryker.conf.*" | head -1)
if [ -n "$STRYKER_CONFIG" ]; then
  echo "Detected: Stryker ($STRYKER_CONFIG)"
  TOOL="Stryker"
  CONFIG_FILE="$STRYKER_CONFIG"
  RUN_COMMAND="npx stryker run"
fi
```

**JavaScript/TypeScript - Stryker (package.json):**
```bash
# Check if package.json has @stryker-mutator dependency
if grep -q "@stryker-mutator" package.json 2>/dev/null; then
  echo "Detected: Stryker (package.json)"
  TOOL="Stryker"
  CONFIG_FILE="package.json"

  # Check if there's a stryker script
  if grep -q '"stryker"' package.json; then
    RUN_COMMAND="npm run stryker"
  else
    RUN_COMMAND="npx stryker run"
  fi
fi
```

**Go - gremlins (go.mod):**
```bash
# Check if go.mod exists and project uses gremlins
if [ -f go.mod ] && grep -q "gremlins" go.mod 2>/dev/null; then
  echo "Detected: gremlins (go.mod)"
  TOOL="gremlins"
  CONFIG_FILE="go.mod"
  RUN_COMMAND="go run github.com/go-gremlins/gremlins/cmd/gremlins unleash"
fi
```

**Rust - cargo-mutants (Cargo.toml):**
```bash
# Assume cargo-mutants if Cargo.toml exists (cargo-mutants doesn't require config changes)
if [ -f Cargo.toml ]; then
  echo "Detected: cargo-mutants (Cargo.toml)"
  TOOL="cargo-mutants"
  CONFIG_FILE="Cargo.toml"
  RUN_COMMAND="cargo mutants"
fi
```

### Phase 2: Parse Tool-Specific Configuration

#### 2.1 Extract Configuration Details

For **each detected tool**, extract configuration:

**Poodle (poodle.toml):**
```python
import tomllib
from pathlib import Path

def parse_poodle_config(config_path="poodle.toml"):
    """Parse Poodle configuration."""
    with open(config_path, "rb") as f:
        config = tomllib.load(f)

    poodle_config = config.get("poodle", {})

    return {
        "source_folders": poodle_config.get("source_folders", ["src"]),
        "skip_mutators": poodle_config.get("skip_mutators", []),
        "only_files": poodle_config.get("only_files", []),
        "max_workers": poodle_config.get("max_workers", 4),
        "runner": poodle_config.get("runner", "command_line"),
        "test_command": poodle_config.get("runner_opts", {}).get("command_line", "pytest tests/"),
        "reporters": poodle_config.get("reporters", ["summary"]),
    }
```

**mutmut (pyproject.toml):**
```python
def parse_mutmut_config(config_path="pyproject.toml"):
    """Parse mutmut configuration."""
    with open(config_path, "rb") as f:
        config = tomllib.load(f)

    mutmut_config = config.get("tool", {}).get("mutmut", {})

    return {
        "paths_to_mutate": mutmut_config.get("paths_to_mutate", ["src/"]),
        "backup": mutmut_config.get("backup", False),
        "runner": mutmut_config.get("runner", "pytest"),
        "tests_dir": mutmut_config.get("tests_dir", "tests/"),
        "dict_synonyms": mutmut_config.get("dict_synonyms", []),
    }
```

**Stryker (stryker.conf.js):**
```bash
# Parse Stryker config using Node.js or grep patterns
# Look for common patterns:
# - mutate: [...] (files to mutate)
# - excludedMutations: [...] (mutations to skip)
# - testRunner: "..." (test framework)

# Extract mutate patterns
grep -E "mutate.*:\s*\[" stryker.conf.js | head -1

# Extract excluded mutations
grep -E "excludedMutations.*:\s*\[" stryker.conf.js | head -1

# Extract test runner
grep -E "testRunner.*:" stryker.conf.js | head -1
```

**gremlins (gremlins.yml or .gremlins.yml if exists):**
```bash
# gremlins typically doesn't require config file
# But if .gremlins.yml exists, parse it

if [ -f .gremlins.yml ]; then
  # Parse YAML for:
  # - excludedDirs
  # - excludedMutators
  # - coverage

  # Use Python to parse YAML
  python3 -c "
import yaml
with open('.gremlins.yml') as f:
    config = yaml.safe_load(f)
print(f\"Excluded dirs: {config.get('excludedDirs', [])}\" )
print(f\"Excluded mutators: {config.get('excludedMutators', [])}\")
"
fi
```

**cargo-mutants (Cargo.toml or mutants.toml):**
```bash
# Check for mutants.toml (optional config)
if [ -f mutants.toml ]; then
  # Parse mutants.toml
  python3 -c "
import tomllib
with open('mutants.toml', 'rb') as f:
    config = tomllib.load(f)
print(f\"Excluded paths: {config.get('exclude_globs', [])}\")
print(f\"Timeout multiplier: {config.get('timeout_multiplier', 5)}\")
"
fi
```

#### 2.2 Identify Exclusion Patterns

For **each tool**, identify current exclusion patterns:

**Universal Exclusion Patterns:**

| Pattern Category | Example | Why Exclude |
|-----------------|---------|-------------|
| Constructor defaults | `timeout: int = 300` | Configuration constants |
| Sentinel values | `.get("tokens", 0)` | Equivalent defaults |
| Unit conversions | `seconds * 1000` | Arithmetic details |
| Magic boundaries | `if len(x) > 500:` | Arbitrary limits |
| Logging messages | `logger.info("Started")` | No functional impact |
| Type artifacts | `return None` → `return ""` | Type system details |

**Tool-Specific Exclusion Syntax:**

**Poodle (inline comments):**
```python
# Exclude specific mutator
timeout: int = 300  # nomut: Number

# Exclude multiple mutators
duration_ms = timeout * 1000  # nomut: Number,BinOp

# Exclude all mutations
result = compute()  # pragma: no mutate

# Block exclusion
# nomut: start
def generated_code():
    pass
# nomut: end
```

**mutmut (inline comments):**
```python
# Skip mutation
result = calculate()  # pragma: no mutate

# mutmut doesn't support granular per-mutator exclusions
# Only supports full line exclusion
```

**Stryker (config file):**
```javascript
// In stryker.conf.js
export default {
  mutate: ['src/**/*.ts'],
  excludedMutations: [
    'StringLiteral',     // Logging messages
    'ObjectLiteral',     // Config objects
    'ArrayDeclaration',  // Constant arrays
  ],
  mutator: {
    excludedMutations: ['StringLiteral']
  }
}
```

**gremlins (inline comments or config):**
```go
// MUTATION: SKIP
func generatedCode() {
    // This function is skipped
}

// Or in .gremlins.yml:
// excludedMutators:
//   - "conditionals"
//   - "arithmetic"
```

**cargo-mutants (config file):**
```toml
# In mutants.toml
[[exclude]]
# Exclude by file path glob
glob = "src/generated/**"

[[exclude]]
# Exclude by regex in source
regex = "DEFAULT_TIMEOUT = "
```

### Phase 3: Analyze Code for Exclusion Recommendations

#### 3.1 Scan Source Code for Exclusion Candidates

Scan source directories for patterns that should be excluded:

**Universal Patterns to Detect:**

```python
import ast
from pathlib import Path
import re

def analyze_code_for_exclusions(source_dir, language):
    """Analyze code and suggest mutation exclusions."""

    exclusion_candidates = {
        "constructor_defaults": [],
        "sentinel_values": [],
        "unit_conversions": [],
        "logging_calls": [],
        "magic_numbers": [],
    }

    if language == "Python":
        exclusion_candidates = analyze_python_code(source_dir)
    elif language in ["JavaScript", "TypeScript"]:
        exclusion_candidates = analyze_js_code(source_dir)
    elif language == "Go":
        exclusion_candidates = analyze_go_code(source_dir)
    elif language == "Rust":
        exclusion_candidates = analyze_rust_code(source_dir)

    return exclusion_candidates

def analyze_python_code(source_dir):
    """Find Python-specific exclusion candidates."""
    candidates = {
        "constructor_defaults": [],
        "sentinel_values": [],
        "unit_conversions": [],
        "logging_calls": [],
    }

    for py_file in Path(source_dir).rglob("*.py"):
        try:
            with open(py_file) as f:
                tree = ast.parse(f.read(), filename=str(py_file))

            for node in ast.walk(tree):
                # Find __init__ methods with numeric defaults
                if isinstance(node, ast.FunctionDef) and node.name == "__init__":
                    for arg in node.args.defaults:
                        if isinstance(arg, ast.Constant) and isinstance(arg.value, (int, float)):
                            candidates["constructor_defaults"].append({
                                "file": str(py_file),
                                "line": arg.lineno,
                                "value": arg.value,
                                "type": "Number",
                            })

                # Find .get(key, 0) patterns (sentinel values)
                if isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Attribute) and node.func.attr == "get":
                        if len(node.args) == 2 and isinstance(node.args[1], ast.Constant):
                            if node.args[1].value in (0, 0.0, -1, 1, "", None):
                                candidates["sentinel_values"].append({
                                    "file": str(py_file),
                                    "line": node.lineno,
                                    "default": node.args[1].value,
                                    "type": "Number" if isinstance(node.args[1].value, (int, float)) else "Keyword",
                                })

                # Find unit conversion arithmetic (* 1000, / 1024, etc.)
                if isinstance(node, ast.BinOp):
                    if isinstance(node.op, (ast.Mult, ast.Div)):
                        if isinstance(node.right, ast.Constant) and node.right.value in (1000, 1024, 60, 24, 3600):
                            candidates["unit_conversions"].append({
                                "file": str(py_file),
                                "line": node.lineno,
                                "operation": type(node.op).__name__,
                                "factor": node.right.value,
                                "type": "Number,BinOp",
                            })

                # Find logger calls (logger.info, logger.error, etc.)
                if isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Attribute):
                        if isinstance(node.func.value, ast.Name) and node.func.value.id in ("logger", "log"):
                            candidates["logging_calls"].append({
                                "file": str(py_file),
                                "line": node.lineno,
                                "method": node.func.attr,
                                "type": "FuncCall",
                            })

        except Exception as e:
            # Skip files that can't be parsed
            pass

    return candidates
```

**JavaScript/TypeScript Pattern Detection:**

```bash
# Find constructor defaults with numbers
grep -rn "constructor.*=.*[0-9]" src/ --include="*.ts" --include="*.js"

# Find .get() with default values
grep -rn "\.get(.*,\s*[0-9]" src/ --include="*.ts" --include="*.js"

# Find console.log calls (logging)
grep -rn "console\.(log|warn|error|info)" src/ --include="*.ts" --include="*.js"

# Find unit conversion patterns
grep -rn "\*\s*1000\|\/\s*1000\|\*\s*1024" src/ --include="*.ts" --include="*.js"
```

**Go Pattern Detection:**

```bash
# Find const declarations with numbers
grep -rn "const.*=.*[0-9]" . --include="*.go"

# Find default timeout values
grep -rn "timeout.*:=.*[0-9]" . --include="*.go"

# Find log.Printf calls
grep -rn "log\.(Print|Fatal|Panic)" . --include="*.go"
```

**Rust Pattern Detection:**

```bash
# Find const declarations
grep -rn "const.*:.*=.*[0-9]" src/ --include="*.rs"

# Find default struct field values
grep -rn "impl.*Default" src/ --include="*.rs" -A 10

# Find println! macros (logging)
grep -rn "println!\|eprintln!\|log::" src/ --include="*.rs"
```

#### 3.2 Generate Exclusion Recommendations

Based on analysis, generate tool-specific exclusion recommendations:

```python
def generate_exclusion_recommendations(candidates, tool):
    """Generate tool-specific exclusion recommendations."""

    recommendations = {
        "inline_comments": [],
        "config_settings": {},
        "estimated_reduction": 0,
    }

    total_mutations = 0

    if tool == "Poodle":
        # Inline comments for specific exclusions
        for item in candidates["constructor_defaults"]:
            recommendations["inline_comments"].append({
                "file": item["file"],
                "line": item["line"],
                "comment": "# nomut: Number",
                "reason": f"Constructor default value: {item['value']}",
            })
            total_mutations += 3  # Typically 3 mutations per number (n-1, n+1, replacement)

        for item in candidates["sentinel_values"]:
            recommendations["inline_comments"].append({
                "file": item["file"],
                "line": item["line"],
                "comment": f"# nomut: {item['type']}",
                "reason": f"Sentinel value: {item['default']}",
            })
            total_mutations += 3

        for item in candidates["unit_conversions"]:
            recommendations["inline_comments"].append({
                "file": item["file"],
                "line": item["line"],
                "comment": f"# nomut: {item['type']}",
                "reason": f"Unit conversion: {item['operation']} by {item['factor']}",
            })
            total_mutations += 5  # Number + BinOp mutations

        # Config-level exclusions
        if len(candidates["logging_calls"]) > 10:
            recommendations["config_settings"]["skip_mutators"] = ["String", "FuncCall"]
            recommendations["config_settings"]["reason"] = "Many logging calls (observability, not behavior)"
            total_mutations += len(candidates["logging_calls"]) * 2

    elif tool == "Stryker":
        # Config-level exclusions for Stryker
        if len(candidates["logging_calls"]) > 10:
            recommendations["config_settings"]["excludedMutations"] = ["StringLiteral", "BlockStatement"]
            recommendations["config_settings"]["reason"] = "Logging statements have no functional impact"
            total_mutations += len(candidates["logging_calls"]) * 2

        # Stryker doesn't support inline comments well, mostly config-based
        if len(candidates["constructor_defaults"]) > 5:
            recommendations["config_settings"]["mutator"] = {
                "ArithmeticOperator": {"excludedOperators": []},
                "note": "Consider excluding specific files with many numeric constants"
            }

    elif tool == "mutmut":
        # mutmut only supports pragma: no mutate (no granular control)
        for item in candidates["constructor_defaults"] + candidates["sentinel_values"]:
            recommendations["inline_comments"].append({
                "file": item["file"],
                "line": item["line"],
                "comment": "# pragma: no mutate",
                "reason": f"Configuration constant or sentinel value",
            })
            total_mutations += 3

    recommendations["estimated_reduction"] = total_mutations

    return recommendations
```

### Phase 4: Detect Target Scores by Tier

#### 4.1 Map Code to Tiers

Use the same tier detection logic from coverage config, but map to mutation scores:

```python
def get_mutation_score_targets(tier):
    """Get mutation score targets by tier."""
    targets = {
        "critical": {
            "target": 90,
            "minimum": 85,
            "description": "Auth, API, data models - bugs have severe impact",
        },
        "high_risk": {
            "target": 85,
            "minimum": 80,
            "description": "Storage, state management - bugs cause data issues",
        },
        "standard": {
            "target": 75,
            "minimum": 70,
            "description": "Utilities, helpers - bugs are annoying but not critical",
        },
    }
    return targets.get(tier, {"target": 75, "minimum": 70})
```

**Tier Mapping:**

| Tier | Code Patterns | Mutation Score Target | Rationale |
|------|---------------|----------------------|-----------|
| **Critical** | `auth/`, `api/`, `models/`, `executor.py` | 90%+ | Security & data integrity |
| **High-Risk** | `storage/`, `session/`, `manager.py` | 85%+ | Data consistency |
| **Standard** | `utils/`, `config/`, `formatters/` | 75%+ | General quality |

### Phase 5: Generate Configuration Output

#### 5.1 Update or Create testing-workflows-config.md

Generate mutation testing sections for each component:

**Output Format:**

```markdown
### Mutation Testing Configuration

**Tool**: {tool_name}
**Config File**: {config_file_path}
**Exclusions Documentation**: `.claude/rules/mutation-testing.md`

**Run Command:**
```bash
{run_command}
```

**Parse Results:**
{result_parsing_strategy}

**Current Configuration:**
- Source folders: {source_folders}
- Skip mutators: {skip_mutators}
- Max workers: {max_workers}
- Test command: {test_command}

**Exclusion Patterns:**

| Pattern | Mutator | Syntax | Example |
|---------|---------|--------|---------|
| Constructor defaults | Number | `# nomut: Number` | `timeout: int = 300` |
| Sentinel values | Number/Keyword | `# nomut: Number` | `.get("count", 0)` |
| Unit conversions | Number,BinOp | `# nomut: Number,BinOp` | `ms = sec * 1000` |
| Logging calls | String,FuncCall | Config: `skip_mutators` | `logger.info(...)` |
| Block exclusions | All | `# nomut: start/end` | Generated code |

**Recommended Exclusions:**

Based on code analysis:
- {num_constructor_defaults} constructor defaults → Add `# nomut: Number`
- {num_sentinel_values} sentinel values → Add `# nomut: Number`
- {num_unit_conversions} unit conversions → Add `# nomut: Number,BinOp`
- {num_logging_calls} logging calls → Consider `skip_mutators = ["String", "FuncCall"]`

**Estimated mutation reduction**: ~{estimated_reduction} mutations

**Target Scores by Tier:**

| Tier | Files/Patterns | Target Score | Minimum Score |
|------|---------------|--------------|---------------|
| Critical | {critical_patterns} | 90% | 85% |
| High-Risk | {high_risk_patterns} | 85% | 80% |
| Standard | {standard_patterns} | 75% | 70% |

**Overall Project Target**: 85% mutation score

**Next Steps:**
1. Review exclusion recommendations
2. Add `# nomut:` comments to source code (see examples above)
3. Run mutation testing: `{run_command}`
4. Review survivors and improve tests
5. Use `/increase-mutation-score` workflow for systematic improvement
```

#### 5.2 Language-Specific Configuration Templates

**Python (Poodle):**

```markdown
### Mutation Testing Configuration

**Tool**: Poodle v1.3.3+
**Config File**: `poodle.toml`
**Exclusions Documentation**: `.claude/rules/mutation-testing.md`

**Run Command:**
```bash
python -m poodle
```

**Parse Results:**
Poodle outputs JSON and text reports. Key metrics:
- Total mutants identified
- Mutants killed (tests caught mutation)
- Mutants survived (tests didn't catch)
- Mutation score = Killed / (Total - Excluded)

**Result Files:**
- `.poodle/poodle-log.json` - Full mutation log
- `.poodle/summary.txt` - Summary report
- Console output with color-coded results

**Exclusion Syntax:**

⚠️ **CRITICAL**: Poodle does NOT support `skip_lines` or `skip_calls` in `poodle.toml`.
Use inline comments in source code:

```python
# Exclude specific mutator
timeout: int = 300  # nomut: Number

# Exclude multiple mutators
duration_ms = timeout * 1000  # nomut: Number,BinOp

# Exclude all mutations on line
result = compute()  # pragma: no mutate

# Exclude block
# nomut: start
def generated_code():
    pass
# nomut: end
```

**Available Mutators:**
- `Number` - Numeric literals (0→1, -1, n→n±1)
- `BinOp` - Binary operators (*→/, +→-, etc.)
- `Compare` - Comparisons (==→!=, <→>, and→or)
- `UnaryOp` - Unary operators (not→remove, -x→x)
- `String` - String literals (add XX prefix/suffix)
- `FuncCall` - Function calls
- `Keyword` - Keywords (True→False, None→"")

**Global Exclusions (in poodle.toml):**
```toml
[poodle]
# Exclude mutation types globally
skip_mutators = ["String", "FuncCall", "Keyword"]
```

Use global exclusions for:
- `String` - If logging messages don't affect behavior
- `FuncCall` - If logger calls are observability only
- `Keyword` - If type artifacts (None→"") don't matter
```

**Python (mutmut):**

```markdown
### Mutation Testing Configuration

**Tool**: mutmut
**Config File**: `pyproject.toml` (section: `[tool.mutmut]`)
**Exclusions Documentation**: mutmut uses pytest-style pragmas

**Run Command:**
```bash
mutmut run --paths-to-mutate=src/
```

**Parse Results:**
mutmut stores results in `.mutmut-cache` database.

View results:
```bash
mutmut show           # Show all mutants
mutmut results        # Show summary
mutmut html           # Generate HTML report
```

**Exclusion Syntax:**

mutmut only supports full-line exclusion (no per-mutator control):

```python
# Exclude entire line
result = calculate()  # pragma: no mutate
```

**Configuration (pyproject.toml):**
```toml
[tool.mutmut]
paths_to_mutate = "src/"
backup = false
runner = "pytest"
tests_dir = "tests/"
dict_synonyms = "Struct, NamedStruct"
```
```

**JavaScript/TypeScript (Stryker):**

```markdown
### Mutation Testing Configuration

**Tool**: Stryker Mutator
**Config File**: `stryker.conf.js` (or `.mjs`, `.cjs`, `.json`)
**Exclusions Documentation**: https://stryker-mutator.io/docs/mutation-testing-elements/supported-mutators/

**Run Command:**
```bash
npx stryker run
```

**Parse Results:**
Stryker generates reports in `reports/` directory:
- `mutation.html` - Interactive HTML report
- `mutation.json` - JSON results

**Exclusion Syntax:**

Stryker uses config-based exclusions (not inline comments):

```javascript
// stryker.conf.js
export default {
  mutate: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/generated/**'
  ],
  excludedMutations: [
    'StringLiteral',      // Exclude string mutations
    'ObjectLiteral',      // Exclude object literal mutations
    'ArrayDeclaration',   // Exclude array mutations
  ],
  testRunner: 'jest',     // or 'vitest', 'mocha'
  coverageAnalysis: 'perTest',
  thresholds: {
    high: 90,    // Critical code
    low: 75,     // Standard code
    break: 70    // Fail if below this
  }
}
```

**Available Mutators:**
- `ArithmeticOperator` - +, -, *, /, %
- `BlockStatement` - { } removal
- `BooleanLiteral` - true↔false
- `ConditionalExpression` - &&, ||, ?:
- `EqualityOperator` - ==, ===, !=, !==
- `StringLiteral` - String mutations
- `ObjectLiteral` - Object mutations
- And many more...

**File-based exclusions:**
```javascript
mutate: [
  'src/**/*.ts',
  '!src/config/**',     // Exclude config directory
  '!src/**/*.constants.ts'  // Exclude constant files
]
```
```

**Go (gremlins):**

```markdown
### Mutation Testing Configuration

**Tool**: gremlins
**Config File**: `.gremlins.yml` (optional)
**Exclusions Documentation**: https://github.com/go-gremlins/gremlins

**Run Command:**
```bash
go run github.com/go-gremlins/gremlins/cmd/gremlins unleash
```

**Parse Results:**
gremlins outputs to console and can generate HTML report:
```bash
gremlins unleash --output=html --output-file=mutation-report.html
```

**Exclusion Syntax:**

Inline comments in Go code:
```go
// MUTATION: SKIP
func generatedCode() {
    // This entire function is skipped
}

// MUTATION: SKIP-FILE
// Skips the entire file
package generated
```

**Configuration (.gremlins.yml):**
```yaml
# Excluded directories
excludedDirs:
  - vendor
  - testdata
  - mocks

# Excluded mutators
excludedMutators:
  - conditionals_boundary    # < → <=, > → >=
  - conditionals_negation    # == → !=
  - arithmetic               # + → -, * → /

# Coverage threshold
coverage: 0.80

# Timeout multiplier
timeout-multiplier: 3
```
```

**Rust (cargo-mutants):**

```markdown
### Mutation Testing Configuration

**Tool**: cargo-mutants
**Config File**: `mutants.toml` (optional) or `Cargo.toml`
**Exclusions Documentation**: https://mutants.rs/

**Run Command:**
```bash
cargo mutants
```

**Parse Results:**
cargo-mutants outputs to console and `mutants.out/` directory:
- `mutants.out/caught.txt` - Caught mutants
- `mutants.out/missed.txt` - Missed mutants
- `mutants.out/unviable.txt` - Build failures

**Exclusion Syntax:**

Inline attributes in Rust code:
```rust
#[cfg_attr(test, mutants::skip)]
fn generated_code() {
    // This function is skipped
}

// Skip specific patterns
impl Default for Config {
    #[mutants::skip]  // Skip entire method
    fn default() -> Self {
        Config {
            timeout: 300,  // Default values
        }
    }
}
```

**Configuration (mutants.toml):**
```toml
# Exclude specific files or directories
[[exclude]]
glob = "src/generated/**"

[[exclude]]
regex = "DEFAULT_TIMEOUT = "

# Timeout multiplier
timeout_multiplier = 5

# Exclude specific functions
[[exclude]]
name = "Debug::fmt"

# Test timeout
test_timeout_seconds = 300
```

**Configuration (Cargo.toml):**
```toml
[package.metadata.mutants]
timeout_multiplier = 5.0
```
```

### Phase 6: Report Generation

#### 6.1 Display Detection Summary

```
Analyzing mutation testing configuration...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Detected {N} mutation testing tool(s):

━━━ Backend (Python) - Poodle ━━━
  Location: ./
  Config: poodle.toml
  Command: python -m poodle
  Source: src/
  Test command: pytest tests/claude/ --assert=plain --tb=no --no-cov -q

  Current exclusions:
    - skip_mutators: ["String", "FuncCall", "Keyword"]
    - only_files: ["**/claude/executor.py"]

  Exclusion recommendations:
    ✓ 15 constructor defaults → Add # nomut: Number
    ✓ 23 sentinel values → Add # nomut: Number
    ✓ 8 unit conversions → Add # nomut: Number,BinOp
    ✓ 47 logging calls → Already excluded (FuncCall)

  Estimated mutation reduction: ~180 mutations

  Target scores:
    Critical (auth/, api/, executor.py): 90%
    High-risk (storage/, manager.py): 85%
    Standard (utils/, config/): 75%
    Overall: 85%

━━━ Frontend (TypeScript) - Stryker ━━━
  Location: frontend/
  Config: stryker.conf.js
  Command: npx stryker run
  Source: src/
  Test command: npm test

  Current exclusions:
    - excludedMutations: ["StringLiteral"]

  Exclusion recommendations:
    ✓ 8 constructor defaults → Consider file-based exclusion
    ✓ 12 console.log calls → Add "BlockStatement" to excludedMutations

  Estimated mutation reduction: ~45 mutations

  Target scores:
    Critical (stores/, api/): 90%
    High-risk (components/session/): 85%
    Standard (components/ui/): 75%
    Overall: 85%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Updated: .claude/rules/testing-workflows-config.md

Next steps:
1. Review mutation testing configuration in testing-workflows-config.md
2. Add recommended exclusion comments to source code
3. Run mutation testing: python -m poodle (backend), npx stryker run (frontend)
4. Review survivors and improve tests
5. Use /increase-mutation-score workflow for systematic improvement

For detailed exclusion syntax and best practices:
  → Read .claude/rules/mutation-testing.md (Poodle-specific)
  → Check tool documentation for Stryker, gremlins, cargo-mutants
```

#### 6.2 Highlight Warnings

```
⚠️ Manual review needed:

- Component "backend": Detected 180 candidate exclusions
  → Review .claude/rules/mutation-testing.md for exclusion best practices
  → Add # nomut: comments carefully (only for low-value mutations)

- Component "frontend": No Stryker config file found
  → Consider creating stryker.conf.js for better configuration
  → Use: npx stryker init

- Tool "mutmut" detected but not configured in pyproject.toml
  → Add [tool.mutmut] section to pyproject.toml
  → See documentation: https://mutmut.readthedocs.io/
```

### Phase 7: Validation

#### 7.1 Validate Generated Configuration

```bash
# Check if testing-workflows-config.md exists or was created
if [ ! -f .claude/rules/testing-workflows-config.md ]; then
  echo "❌ Failed to generate/update testing-workflows-config.md"
  exit 1
fi

# Check if mutation testing section was added
if ! grep -q "### Mutation Testing Configuration" .claude/rules/testing-workflows-config.md; then
  echo "❌ Mutation testing section not found in config"
  exit 1
fi

# Verify at least one tool was detected
TOOL_COUNT=$(grep -c "^\*\*Tool\*\*:" .claude/rules/testing-workflows-config.md || true)
if [ "$TOOL_COUNT" -eq 0 ]; then
  echo "❌ No mutation testing tools detected"
  echo "   Ensure project has mutation testing configuration (poodle.toml, stryker.conf.js, etc.)"
  exit 1
fi

echo "✅ Configuration validated: $TOOL_COUNT mutation testing tool(s) configured"
```

## Tool-Specific Run Commands

### Python (Poodle)

```bash
# Run mutation testing
python -m poodle

# Run with specific config
python -m poodle --config=poodle.toml

# Run with custom workers
python -m poodle --max-workers=8

# Generate HTML report (if configured)
# Results in .poodle/ directory
```

### Python (mutmut)

```bash
# Run mutation testing
mutmut run --paths-to-mutate=src/

# View results
mutmut show
mutmut results

# Generate HTML report
mutmut html

# Run specific mutant
mutmut run 123
```

### JavaScript/TypeScript (Stryker)

```bash
# Run mutation testing
npx stryker run

# Run with custom config
npx stryker run --config=stryker.conf.js

# Run incremental (only changed files)
npx stryker run --incremental

# Clear cache and run
npx stryker run --clean-temp-dir
```

### Go (gremlins)

```bash
# Run mutation testing
go run github.com/go-gremlins/gremlins/cmd/gremlins unleash

# With HTML output
gremlins unleash --output=html --output-file=mutation-report.html

# With coverage threshold
gremlins unleash --coverage=0.85
```

### Rust (cargo-mutants)

```bash
# Run mutation testing
cargo mutants

# Run with timeout
cargo mutants --timeout=300

# Run specific file
cargo mutants --file=src/lib.rs

# List mutants without running
cargo mutants --list
```

## Error Handling

### No Mutation Testing Tools Detected

```
❌ No mutation testing tools detected

Searched for:
  - poodle.toml (Python - Poodle)
  - pyproject.toml with [tool.mutmut] (Python - mutmut)
  - stryker.conf.* (JavaScript/TypeScript - Stryker)
  - .gremlins.yml (Go - gremlins)
  - Cargo.toml (Rust - cargo-mutants)

To set up mutation testing:
  Python: pip install poodle && poodle init
  JavaScript/TypeScript: npm install --save-dev @stryker-mutator/core && npx stryker init
  Go: go install github.com/go-gremlins/gremlins/cmd/gremlins@latest
  Rust: cargo install cargo-mutants
```

### Configuration Parsing Failed

```
⚠️ Failed to parse poodle.toml

Error: TOML syntax error at line 15
Please verify configuration file syntax and try again.

Skipping backend mutation testing configuration.
```

### Multiple Tools in Same Language

```
⚠️ Found 2 Python mutation testing tools:
  1. Poodle (poodle.toml)
  2. mutmut (pyproject.toml)

Both will be documented in the configuration.
Choose one tool per component for consistency.
```

## Success Criteria

A successful run should:
1. ✅ Detect all mutation testing tools (Poodle, Stryker, etc.)
2. ✅ Parse tool configurations accurately
3. ✅ Identify exclusion patterns (current and recommended)
4. ✅ Generate mutation score targets by tier
5. ✅ Provide tool-specific run commands
6. ✅ Update/create `.claude/rules/testing-workflows-config.md`
7. ✅ Estimate mutation reduction from exclusions
8. ✅ Provide clear next steps

## Integration with Mutation Testing Workflow

Once the config is generated, use it with the mutation testing workflow:

```bash
# Run for all components
/increase-mutation-score

# Run for specific component
/increase-mutation-score --component=backend

# Analyze only (no changes)
/increase-mutation-score --analyze-only

# Focus on critical tier
/increase-mutation-score --tier=critical
```

The workflow will automatically load configuration from `.claude/rules/testing-workflows-config.md`.

## Best Practices Documentation

After generating configuration, refer to:

**For Poodle (Python):**
- `.claude/rules/mutation-testing.md` - Comprehensive Poodle guide
- Inline comment syntax, exclusion patterns, best practices

**For other tools:**
- Tool documentation links in generated config
- Community best practices for Stryker, gremlins, cargo-mutants

---

**Note:** This command performs static analysis and configuration detection only. Review the generated configuration and add exclusion comments before running mutation testing.
