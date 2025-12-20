---
description: Generate coverage workflow configuration by analyzing project structure (multi-language)
allowed-tools: Read, Write, Bash, Glob, Grep
argument-hint: [--force] [--components=component1,component2]
---

# Initialize Coverage Workflow Configuration

You are the **Project Structure Analyzer**. Your mission is to detect all project components (backend, frontend, etc.), analyze their structure, and generate a unified coverage workflow configuration file.

## Philosophy: Multi-Language, Auto-Detection

**Great configuration is:**
- **Comprehensive**: Detects all components in any language
- **Accurate**: Extracts real package names, directories, and tools
- **Intelligent**: Suggests tier patterns based on code analysis
- **Flexible**: Works for Python, JavaScript/TypeScript, Go, Rust, and more

## Arguments
$ARGUMENTS

### Argument Options
- `--force`: Overwrite existing configuration if present
- `--components=LIST`: Limit detection to specific components (comma-separated)

## Execution Workflow

### Phase 0: Pre-Check

#### 0.1 Check for Existing Configuration

```bash
# Check if config already exists
if [ -f .claude/rules/testing-workflows-config.md ] && [ "$FORCE" != "true" ]; then
  echo "Configuration already exists at .claude/rules/testing-workflows-config.md"
  echo "Use --force to overwrite or edit manually"
  exit 0
fi
```

### Phase 1: Component Detection

#### 1.1 Scan for Language Markers

Scan the repository for language-specific marker files that indicate project components:

**Detection Table:**

| Marker File | Language | Default Component Name | Notes |
|-------------|----------|----------------------|-------|
| `pyproject.toml` | Python | backend | Check [project].name or [tool.setuptools] |
| `setup.py` | Python | backend | Parse name from setup() call |
| `package.json` | JavaScript/TypeScript | frontend | Parse "name" field |
| `tsconfig.json` | TypeScript | frontend | Confirms TypeScript usage |
| `go.mod` | Go | (module name) | Parse module directive |
| `Cargo.toml` | Rust | (package name) | Parse [package].name |

**Scanning Strategy:**

```bash
# Find all marker files (root and subdirectories)
find . -maxdepth 3 -type f \( \
  -name "pyproject.toml" -o \
  -name "setup.py" -o \
  -name "package.json" -o \
  -name "go.mod" -o \
  -name "Cargo.toml" \
\) ! -path "*/node_modules/*" ! -path "*/.venv/*" ! -path "*/venv/*"
```

For each marker file found, determine:
- Language
- Component directory (dirname of marker file)
- Component name (derive from file location or default)

#### 1.2 Extract Package Names

For **each component**, extract the package/module name:

**Python (pyproject.toml):**
```bash
# Extract package name from pyproject.toml
python3 -c "
import tomllib
with open('pyproject.toml', 'rb') as f:
    data = tomllib.load(f)

# Try [project].name first (modern)
name = data.get('project', {}).get('name')

# Fallback to [tool.setuptools.packages.find]
if not name:
    packages = data.get('tool', {}).get('setuptools', {}).get('packages', {}).get('find', {}).get('where', ['src'])
    # Infer from directory structure if 'where' is ['src']
    # Scan src/ for first package directory

print(name or 'UNKNOWN')
"
```

**Python (setup.py):**
```bash
# Parse setup.py (fallback method)
grep -E "name\s*=\s*['\"]([^'\"]+)" setup.py | head -1 | sed -E "s/.*name\s*=\s*['\"]([^'\"]+).*/\1/"
```

**JavaScript/TypeScript (package.json):**
```bash
# Extract package name from package.json
python3 -c "
import json
with open('package.json') as f:
    data = json.load(f)
print(data.get('name', 'UNKNOWN'))
"
```

**Go (go.mod):**
```bash
# Extract module name from go.mod
grep '^module ' go.mod | awk '{print $2}'
```

**Rust (Cargo.toml):**
```bash
# Extract package name from Cargo.toml
python3 -c "
import tomllib
with open('Cargo.toml', 'rb') as f:
    data = tomllib.load(f)
print(data.get('package', {}).get('name', 'UNKNOWN'))
"
```

### Phase 2: Directory Structure Detection

#### 2.1 Detect Source and Test Directories

For **each component**, detect source and test directories:

**Python:**
```python
# Detection logic for Python
import os
from pathlib import Path

def detect_python_dirs(component_dir):
    """Detect source and test directories for Python component."""
    base = Path(component_dir)

    # Source directory candidates (in priority order)
    source_candidates = [
        base / "src",
        base,  # Package at root
    ]

    # Check for actual Python packages
    source_dir = None
    for candidate in source_candidates:
        if (candidate / "__init__.py").exists() or \
           any((candidate / d / "__init__.py").exists() for d in os.listdir(candidate) if (candidate / d).is_dir()):
            source_dir = candidate
            break

    # Test directory candidates
    test_candidates = [
        base / "tests",
        base / "test",
    ]

    test_dir = None
    for candidate in test_candidates:
        if candidate.exists() and candidate.is_dir():
            test_dir = candidate
            break

    # If no dedicated test dir, check for *_test.py pattern
    if not test_dir and any(base.glob("*_test.py")):
        test_dir = base

    return {
        "source_dir": str(source_dir.relative_to(base)) if source_dir else "src/",
        "test_dir": str(test_dir.relative_to(base)) if test_dir else "tests/",
    }
```

**JavaScript/TypeScript:**
```python
def detect_js_dirs(component_dir):
    """Detect source and test directories for JS/TS component."""
    base = Path(component_dir)

    # Check tsconfig.json for paths
    tsconfig_path = base / "tsconfig.json"
    if tsconfig_path.exists():
        import json
        with open(tsconfig_path) as f:
            config = json.load(f)
            include = config.get("include", ["src"])
            # Parse first include path as source
            source_dir = include[0] if include else "src"
    else:
        source_dir = "src"

    # Test files are usually co-located or in __tests__
    test_pattern = "**/*.{test,spec}.{js,ts,jsx,tsx}"

    return {
        "source_dir": source_dir,
        "test_pattern": test_pattern,
    }
```

**Go:**
```python
def detect_go_dirs(component_dir):
    """Go typically uses same directory for source and tests."""
    return {
        "source_dir": "./",
        "test_pattern": "*_test.go",
    }
```

**Rust:**
```python
def detect_rust_dirs(component_dir):
    """Rust has conventional src/ and tests/ structure."""
    return {
        "source_dir": "src/",
        "test_dir": "tests/",
        "test_modules": "src/ with #[cfg(test)]",
    }
```

#### 2.2 Detect Test Runner and Coverage Tool

For **each component**, detect the test runner and coverage tool:

**Python:**
```bash
# Check for pytest configuration
if grep -q "\[tool\.pytest\]" pyproject.toml 2>/dev/null || [ -f pytest.ini ]; then
  TEST_RUNNER="pytest"
  COVERAGE_TOOL="pytest-cov"
elif grep -q "unittest" setup.py 2>/dev/null; then
  TEST_RUNNER="unittest"
  COVERAGE_TOOL="coverage.py"
else
  TEST_RUNNER="pytest"  # Default assumption
  COVERAGE_TOOL="pytest-cov"
fi
```

**JavaScript/TypeScript:**
```bash
# Check package.json scripts
if grep -q '"test".*jest' package.json; then
  TEST_RUNNER="jest"
  COVERAGE_TOOL="jest --coverage"
elif grep -q '"test".*vitest' package.json; then
  TEST_RUNNER="vitest"
  COVERAGE_TOOL="vitest --coverage"
elif grep -q '"test".*mocha' package.json; then
  TEST_RUNNER="mocha"
  COVERAGE_TOOL="nyc mocha"
else
  TEST_RUNNER="npm test"  # Default
  COVERAGE_TOOL="UNKNOWN"
fi
```

**Go:**
```bash
TEST_RUNNER="go test"
COVERAGE_TOOL="go test -cover"
```

**Rust:**
```bash
TEST_RUNNER="cargo test"
COVERAGE_TOOL="cargo tarpaulin"  # Or cargo-llvm-cov
```

### Phase 3: Tier Analysis

#### 3.1 Analyze Code Structure for Tier Suggestions

Scan source directories for patterns that indicate criticality:

**Universal Critical Indicators:**
- `auth/`, `authentication/`, `security/`, `login/`
- `payment/`, `billing/`, `checkout/`, `subscription/`
- `api/`, `endpoints/`, `routes/`, `handlers/`
- `core/`, `models/` (data models)
- Files: `executor.py`, `manager.py`, `engine.*`, `core.*`

**Universal High-Risk Indicators:**
- `storage/`, `database/`, `db/`, `repository/`
- `session/`, `state/`, `cache/`, `store/`
- `queue/`, `worker/`, `job/`, `task/`
- `middleware/`, `interceptor/`

**Universal Standard Indicators:**
- `utils/`, `helpers/`, `tools/`
- `config/`, `settings/`
- `ui/`, `components/` (UI components, not state management)
- `formatters/`, `validators/` (simple utilities)

**Language-Specific Critical Patterns:**

**Python:**
- `executor.py`, `manager.py` in core paths
- `models.py` (SQLAlchemy/Pydantic models)
- `schemas.py` (API schemas)

**JavaScript/TypeScript:**
- `stores/` (Pinia, Vuex, Redux)
- `composables/useAuth*`, `composables/usePayment*`
- `hooks/useAuth*`, `hooks/usePayment*`
- `context/*Provider.{ts,tsx}`

**Go:**
- `pkg/auth/`, `pkg/api/`
- `internal/api/`, `internal/core/`
- `cmd/server/`

**Rust:**
- `src/auth/`, `src/api/`
- `src/core/`, `src/domain/`
- `src/service/`

**Tier Detection Algorithm:**

```python
import os
from pathlib import Path

def categorize_files_by_tier(source_dir, language):
    """Analyze source directory and suggest tier categorization."""
    base = Path(source_dir)

    critical_patterns = [
        "auth/", "authentication/", "security/", "login/",
        "payment/", "billing/", "checkout/",
        "api/", "endpoints/", "routes/", "handlers/",
        "core/", "models/",
    ]

    high_risk_patterns = [
        "storage/", "database/", "db/", "repository/",
        "session/", "state/", "cache/", "store/",
        "queue/", "worker/", "job/",
    ]

    standard_patterns = [
        "utils/", "helpers/", "config/",
        "ui/", "components/",
    ]

    # Language-specific additions
    if language == "Python":
        critical_patterns.extend(["executor.py", "manager.py", "models.py"])
    elif language in ["JavaScript", "TypeScript"]:
        critical_patterns.extend(["stores/", "composables/useAuth*", "hooks/useAuth*"])
    elif language == "Go":
        critical_patterns.extend(["pkg/auth/", "internal/api/"])
    elif language == "Rust":
        critical_patterns.extend(["src/auth/", "src/api/", "src/core/"])

    # Scan directory
    all_paths = [str(p.relative_to(base)) for p in base.rglob("*") if p.is_file()]

    critical = [p for p in all_paths if any(pat in p for pat in critical_patterns)]
    high_risk = [p for p in all_paths if any(pat in p for pat in high_risk_patterns) and p not in critical]
    standard = [p for p in all_paths if p not in critical and p not in high_risk]

    return {
        "critical": list(set([extract_pattern(p) for p in critical])),
        "high_risk": list(set([extract_pattern(p) for p in high_risk])),
        "standard": list(set([extract_pattern(p) for p in standard])),
    }

def extract_pattern(file_path):
    """Convert file path to tier pattern."""
    # Convert specific file to directory pattern
    parts = Path(file_path).parts
    if len(parts) > 1:
        return parts[0] + "/"
    return file_path
```

### Phase 4: Fixture and Utility Discovery

#### 4.1 Discover Available Fixtures/Test Utilities

**Python:**
```bash
# Parse tests/conftest.py for fixtures
python3 -c "
import ast
import sys

try:
    with open('tests/conftest.py') as f:
        tree = ast.parse(f.read())

    fixtures = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            for decorator in node.decorator_list:
                # Check for @pytest.fixture
                if isinstance(decorator, ast.Name) and decorator.id == 'fixture':
                    fixtures.append(node.name)
                elif isinstance(decorator, ast.Attribute) and decorator.attr == 'fixture':
                    fixtures.append(node.name)

    if fixtures:
        print('Available fixtures:')
        for f in fixtures:
            print(f'  - {f}')
    else:
        print('No fixtures found in conftest.py')
except FileNotFoundError:
    print('No conftest.py found')
"
```

**JavaScript/TypeScript:**
```bash
# Look for test setup files
SETUP_FILES=$(find . -name "setupTests.*" -o -name "setup.*" -o -name "test-utils.*" | grep -E "\.(js|ts)$" | head -5)

if [ -n "$SETUP_FILES" ]; then
  echo "Test utility files found:"
  echo "$SETUP_FILES"
  # Parse exports from these files
  for file in $SETUP_FILES; do
    echo "Utilities from $file:"
    grep -E "export (function|const|class)" "$file" | sed 's/export /  - /'
  done
fi
```

**Go:**
```bash
# Look for testutil or testhelpers packages
find . -type d -name "testutil" -o -name "testhelpers" -o -name "testing"
```

**Rust:**
```bash
# Look for tests/common/mod.rs
if [ -f tests/common/mod.rs ]; then
  echo "Common test utilities found in tests/common/mod.rs"
  grep -E "^pub (fn|struct|trait)" tests/common/mod.rs
fi
```

### Phase 5: Generate Configuration File

#### 5.1 Create Unified Config File

Generate `.claude/rules/testing-workflows-config.md` with all detected components:

**File Structure:**

```markdown
# Coverage Workflow Configuration

**Auto-generated** by `/init-coverage-config` on YYYY-MM-DD

This file configures the coverage improvement workflow for multi-component projects.

---

## Component: {COMPONENT_NAME} ({LANGUAGE})

### Package Information
- **Package name**: `{package_name}`
- **Source directory**: `{source_dir}`
- **Test directory/pattern**: `{test_dir_or_pattern}`

### Test Runner
- **Runner**: `{test_runner}`
- **Coverage tool**: `{coverage_tool}`

### Coverage Commands

**Run tests:**
```bash
{test_command}
```

**Generate coverage report:**
```bash
{coverage_command}
```

**Coverage data location:**
- Report: `{coverage_report_path}`
- Data file: `{coverage_data_file}`

### Tier Definitions

**Critical Tier (Target: 90%+)**
- Files/patterns: {critical_patterns}

**High-Risk Tier (Target: 80%+)**
- Files/patterns: {high_risk_patterns}

**Standard Tier (Target: 60%+)**
- Files/patterns: {standard_patterns}

### Test Utilities

**Available fixtures/utilities:**
{fixtures_list}

**Common test patterns:**
- See `.claude/rules/test-patterns.md` for examples

---

## Customization Guide

### Adjust Tier Patterns
Modify the tier definitions above to match your project's critical paths.

### Update Coverage Commands
If your project uses custom test runners or coverage tools, update the commands.

### Add More Components
To add another component (e.g., mobile app, CLI tool):
1. Create a new "## Component:" section
2. Fill in all fields following the same structure
3. Run workflow with `--components=component1,component2`

---

**Generated by:** `/init-coverage-config`
**Review and adjust** tier patterns and commands as needed before running the workflow.
```

#### 5.2 Generate Component Sections

For **each detected component**, generate its section:

```python
def generate_component_section(component_data):
    """Generate markdown section for a component."""
    return f"""
## Component: {component_data['name']} ({component_data['language']})

### Package Information
- **Package name**: `{component_data['package_name']}`
- **Source directory**: `{component_data['source_dir']}`
- **Test directory/pattern**: `{component_data['test_dir']}`

### Test Runner
- **Runner**: `{component_data['test_runner']}`
- **Coverage tool**: `{component_data['coverage_tool']}`

### Coverage Commands

**Run tests:**
```bash
{component_data['test_command']}
```

**Generate coverage report:**
```bash
{component_data['coverage_command']}
```

**Coverage data location:**
- Report: `{component_data['coverage_report']}`
- Data file: `{component_data['coverage_data']}`

### Tier Definitions

**Critical Tier (Target: 90%+)**
{format_patterns(component_data['tiers']['critical'])}

**High-Risk Tier (Target: 80%+)**
{format_patterns(component_data['tiers']['high_risk'])}

**Standard Tier (Target: 60%+)**
{format_patterns(component_data['tiers']['standard'])}

### Test Utilities

**Available fixtures/utilities:**
{format_fixtures(component_data['fixtures'])}

**Documentation:** See `.claude/rules/test-patterns.md` for language-specific patterns.

---
"""

def format_patterns(patterns):
    """Format tier patterns as markdown list."""
    if not patterns:
        return "- *(No patterns detected - customize manually)*"
    return "\n".join(f"- `{p}`" for p in patterns)

def format_fixtures(fixtures):
    """Format fixtures as markdown list."""
    if not fixtures:
        return "- *(No fixtures detected - check test utilities manually)*"
    return "\n".join(f"- `{f}`" for f in fixtures)
```

### Phase 6: Report Results

#### 6.1 Display Summary

Show a summary of all detected components:

```
Analyzing project structure...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Detected {N} component(s):

━━━ Backend (Python) ━━━
  Location: ./
  Package: telegram_claude_bot (from pyproject.toml)
  Source: src/
  Tests: tests/
  Runner: pytest + pytest-cov

  Suggested tiers:
    Critical: auth/, web/api/, session/models.py, claude/executor.py
    High-risk: storage/, session/manager.py, bot/handlers/
    Standard: bot/utils/, config/

  Fixtures (from tests/conftest.py):
    - db_session
    - test_app
    - authenticated_user
    - auth_headers

━━━ Frontend (TypeScript) ━━━
  Location: frontend/
  Package: telegram-claude-dashboard (from package.json)
  Source: frontend/src/
  Tests: **/*.test.ts
  Runner: vitest

  Suggested tiers:
    Critical: stores/, api/, composables/useAuth*
    High-risk: components/session/, components/workspace/
    Standard: components/ui/, utils/

  Test utilities (from frontend/src/test/setup.ts):
    - createTestPinia
    - mockApiResponse
    - mountWithPlugins

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Generated: .claude/rules/testing-workflows-config.md

Next steps:
1. Review the configuration file
2. Adjust tier patterns to match your critical paths
3. Verify test commands work correctly
4. Run workflow: /workflow:run-workflow coverage-improvement-loop

For specific component:
  /workflow:run-workflow coverage-improvement-loop --components=backend
For all components:
  /workflow:run-workflow coverage-improvement-loop --components=backend,frontend
```

#### 6.2 Highlight Uncertainties

If any detection failed or returned UNKNOWN values:

```
⚠️ Manual review needed:

- Component "backend": Could not detect package name from pyproject.toml
  → Please verify and update "package_name" in the config file

- Component "frontend": No test utilities detected
  → Check if test setup files exist and update config manually

- Component "backend": No fixtures found in tests/conftest.py
  → Verify conftest.py exists or check for test helpers in other locations
```

### Phase 7: Validation

#### 7.1 Validate Generated Config

Before finalizing, validate the configuration:

```bash
# Check config file was created
if [ ! -f .claude/rules/testing-workflows-config.md ]; then
  echo "❌ Failed to generate configuration file"
  exit 1
fi

# Check for UNKNOWN values
UNKNOWN_COUNT=$(grep -c "UNKNOWN" .claude/rules/testing-workflows-config.md || true)
if [ "$UNKNOWN_COUNT" -gt 0 ]; then
  echo "⚠️  Configuration contains $UNKNOWN_COUNT UNKNOWN values"
  echo "   Review and update manually before running workflow"
fi

# Verify at least one component was detected
COMPONENT_COUNT=$(grep -c "^## Component:" .claude/rules/testing-workflows-config.md || true)
if [ "$COMPONENT_COUNT" -eq 0 ]; then
  echo "❌ No components detected"
  echo "   Ensure project has language marker files (pyproject.toml, package.json, etc.)"
  exit 1
fi

echo "✅ Configuration validated: $COMPONENT_COUNT component(s) detected"
```

## Language-Specific Coverage Commands

### Python (pytest + pytest-cov)

```bash
# Test command
PYTHONPATH=src pytest tests/ -v

# Coverage command
PYTHONPATH=src pytest tests/ --cov={package_name} --cov-report=json --cov-report=term-missing

# Coverage report location
# - JSON: coverage.json
# - HTML: htmlcov/index.html
# - Data: .coverage
```

### JavaScript/TypeScript (Jest)

```bash
# Test command
npm test

# Coverage command
npm test -- --coverage --coverageReporters=json --coverageReporters=text

# Coverage report location
# - JSON: coverage/coverage-final.json
# - HTML: coverage/lcov-report/index.html
```

### JavaScript/TypeScript (Vitest)

```bash
# Test command
vitest run

# Coverage command
vitest run --coverage --coverage.reporter=json --coverage.reporter=text

# Coverage report location
# - JSON: coverage/coverage-final.json
# - HTML: coverage/index.html
```

### Go

```bash
# Test command
go test ./...

# Coverage command
go test ./... -coverprofile=coverage.out -covermode=atomic

# Coverage report location
# - Data: coverage.out
# - HTML: go tool cover -html=coverage.out -o coverage.html
```

### Rust (cargo-tarpaulin)

```bash
# Test command
cargo test

# Coverage command
cargo tarpaulin --out Json --out Html --output-dir coverage

# Coverage report location
# - JSON: coverage/tarpaulin-report.json
# - HTML: coverage/tarpaulin-report.html
```

## Error Handling

### No Components Detected

```
❌ No project components detected

Searched for:
  - pyproject.toml, setup.py (Python)
  - package.json (JavaScript/TypeScript)
  - go.mod (Go)
  - Cargo.toml (Rust)

Make sure you're running this command from the project root directory.
```

### Multiple Components in Same Language

```
⚠️  Found 2 Python components:
  1. ./backend (telegram_claude_bot)
  2. ./services/worker (worker_service)

Both will be added to the configuration.
Use --components=backend,worker to target specific components in the workflow.
```

### Package Name Extraction Failed

```
⚠️  Could not extract package name for component "backend"

Please update the config file manually:
  - Open .claude/rules/testing-workflows-config.md
  - Find "## Component: backend"
  - Set "Package name" to your actual package/module name
```

## Success Criteria

A successful run should:
1. ✅ Detect all project components (backend, frontend, etc.)
2. ✅ Extract accurate package names
3. ✅ Identify correct source/test directories
4. ✅ Suggest meaningful tier patterns
5. ✅ Generate valid coverage commands
6. ✅ Discover available fixtures/utilities
7. ✅ Create `.claude/rules/testing-workflows-config.md`
8. ✅ Provide clear next steps

## Integration with Coverage Workflow

Once the config is generated, use it with the coverage improvement workflow:

```bash
# Run for all components
/workflow:run-workflow coverage-improvement-loop

# Run for specific component
/workflow:run-workflow coverage-improvement-loop --components=backend

# Analyze only (no changes)
/workflow:run-workflow coverage-improvement-loop --analyze-only
```

The workflow will automatically load component configuration from `.claude/rules/testing-workflows-config.md`.

---

**Note:** This command performs static analysis only. Review and adjust the generated configuration before running the coverage workflow.
