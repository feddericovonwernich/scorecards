---
description: Generate quality assessment configuration with tool detection and optional installer (multi-language)
allowed-tools: Read, Write, Bash, Glob, Grep
argument-hint: [--force] [--components=component1,component2] [--install] [--skip-install]
---

# Initialize Code Quality Assessment Configuration

You are the **Code Quality Configuration Analyzer**. Your mission is to detect all project components (backend, frontend, etc.), identify their quality assessment tools, optionally install missing tools, and generate a unified quality configuration.

## Philosophy: Multi-Language, Tool-Agnostic, Installer-Enabled

**Great quality configuration is:**
- **Comprehensive**: Detects quality tools across all languages
- **Accurate**: Extracts real tool commands, configs, and thresholds
- **Intelligent**: Maps the 8 Quality Hats to language-specific tools
- **Actionable**: Optionally installs missing tools with user confirmation
- **Flexible**: Works for Python, JavaScript/TypeScript, Go, Rust, and more

## Arguments
$ARGUMENTS

### Argument Options
- `--force`: Overwrite existing quality configuration if present
- `--components=LIST`: Limit detection to specific components (comma-separated)
- `--install`: Automatically install missing tools (skip confirmation)
- `--skip-install`: Skip installer (detection and config only)

## The 8 Quality Hats Framework

This command configures the **8 Quality Hats** assessment methodology:

| Hat | Focus Area | Common Tools |
|-----|------------|--------------|
| 🎓 **Readability** | Complexity, naming, style, documentation | radon, eslint, golangci-lint, clippy |
| 🧪 **Testability** | DI patterns, mockability, pure functions | Manual analysis + coverage tools |
| 🔧 **Maintainability** | MI score, DRY, coupling/cohesion | radon, escomplex, golangci-lint |
| 🚀 **Extensibility** | Open/Closed, abstractions, configurability | Manual analysis |
| 💪 **Robustness** | Error handling, validation, edge cases | pylint, eslint, clippy |
| 🔒 **Security** | Vulnerabilities, secrets, OWASP | bandit, npm audit, gosec, cargo-audit |
| ⚡ **Performance** | Complexity, resources, caching | profilers, manual analysis |
| 👁️ **Observability** | Logging, metrics, tracing | Manual analysis |

## Execution Workflow

### Phase 0: Pre-Check

#### 0.1 Check for Existing Configuration

```bash
# Check if quality config already exists in testing-workflows-config.md
if grep -q "### Code Quality Configuration" .claude/rules/testing-workflows-config.md 2>/dev/null && [ "$FORCE" != "true" ]; then
  echo "Quality configuration already exists in .claude/rules/testing-workflows-config.md"
  echo "Use --force to overwrite or edit manually"
  exit 0
fi

# If testing-workflows-config.md doesn't exist, note that we'll create it
if [ ! -f .claude/rules/testing-workflows-config.md ]; then
  echo "Note: .claude/rules/testing-workflows-config.md not found"
  echo "Will create new file with quality configuration"
fi
```

### Phase 1: Detect Project Structure

#### 1.1 Scan for Language Markers

Scan the repository for language-specific marker files:

**Detection Table:**

| Marker File | Language | Default Component Name |
|-------------|----------|----------------------|
| `pyproject.toml` | Python | backend |
| `setup.py` | Python | backend |
| `package.json` | JavaScript/TypeScript | frontend |
| `tsconfig.json` | TypeScript | frontend |
| `go.mod` | Go | service |
| `Cargo.toml` | Rust | core |

**Scanning Strategy:**

```bash
# Find all language marker files
find . -maxdepth 3 -type f \( \
  -name "pyproject.toml" -o \
  -name "setup.py" -o \
  -name "package.json" -o \
  -name "go.mod" -o \
  -name "Cargo.toml" \
\) ! -path "*/node_modules/*" ! -path "*/.venv/*" ! -path "*/venv/*" ! -path "*/target/*"
```

### Phase 2: Detect Quality Tools

#### 2.1 Python Quality Tools Detection

For each Python component, detect installed tools:

```bash
# Detection script for Python
echo "=== Python Quality Tools Detection ==="

# Core linters
ruff --version 2>/dev/null && echo "✓ ruff: installed" || echo "✗ ruff: not installed"
pylint --version 2>/dev/null && echo "✓ pylint: installed" || echo "✗ pylint: not installed"
flake8 --version 2>/dev/null && echo "✓ flake8: installed" || echo "✗ flake8: not installed"

# Complexity analysis
python -c "import radon" 2>/dev/null && echo "✓ radon: installed" || echo "✗ radon: not installed"

# Type checking
mypy --version 2>/dev/null && echo "✓ mypy: installed" || echo "✗ mypy: not installed"
pyright --version 2>/dev/null && echo "✓ pyright: installed" || echo "✗ pyright: not installed"

# Security
bandit --version 2>/dev/null && echo "✓ bandit: installed" || echo "✗ bandit: not installed"
pip-audit --version 2>/dev/null && echo "✓ pip-audit: installed" || echo "✗ pip-audit: not installed"

# Documentation
pydocstyle --version 2>/dev/null && echo "✓ pydocstyle: installed" || echo "✗ pydocstyle: not installed"

# Dead code
vulture --version 2>/dev/null && echo "✓ vulture: installed" || echo "✗ vulture: not installed"
```

**Recommended Python Tools by Hat:**

| Hat | Recommended Tool | Alternative | Install Command |
|-----|-----------------|-------------|-----------------|
| 🎓 Readability | ruff | pylint, flake8 | `pip install ruff` |
| 🎓 Complexity | radon | - | `pip install radon` |
| 🔧 Maintainability | radon mi | - | (included with radon) |
| 🔒 Security | bandit | safety | `pip install bandit` |
| 💪 Robustness | mypy | pyright | `pip install mypy` |
| 📚 Documentation | pydocstyle | - | `pip install pydocstyle` |

#### 2.2 JavaScript/TypeScript Quality Tools Detection

For each JS/TS component, detect installed tools:

```bash
# Detection script for JavaScript/TypeScript
echo "=== JavaScript/TypeScript Quality Tools Detection ==="

# Linters
npx eslint --version 2>/dev/null && echo "✓ eslint: installed" || echo "✗ eslint: not installed"
npx biome --version 2>/dev/null && echo "✓ biome: installed" || echo "✗ biome: not installed"

# Complexity
npx complexity-report --version 2>/dev/null && echo "✓ complexity-report: installed" || echo "✗ complexity-report: not installed"
npx escomplex --version 2>/dev/null && echo "✓ escomplex: installed" || echo "✗ escomplex: not installed"

# Type checking
npx tsc --version 2>/dev/null && echo "✓ typescript: installed" || echo "✗ typescript: not installed"

# Security
npm audit --version 2>/dev/null && echo "✓ npm audit: available" || echo "✗ npm audit: not available"
npx snyk --version 2>/dev/null && echo "✓ snyk: installed" || echo "✗ snyk: not installed"

# Formatting
npx prettier --version 2>/dev/null && echo "✓ prettier: installed" || echo "✗ prettier: not installed"

# Dead code detection
npx knip --version 2>/dev/null && echo "✓ knip: installed" || echo "✗ knip: not installed"
```

**Recommended JS/TS Tools by Hat:**

| Hat | Recommended Tool | Alternative | Install Command |
|-----|-----------------|-------------|-----------------|
| 🎓 Readability | eslint | biome | `npm i -D eslint` |
| 🎓 Complexity | complexity-report | escomplex | `npm i -D complexity-report` |
| 🔧 Maintainability | eslint rules | - | (included with eslint) |
| 🔒 Security | npm audit | snyk | (built-in) |
| 💪 Robustness | typescript | - | `npm i -D typescript` |
| 📚 Documentation | typedoc | jsdoc | `npm i -D typedoc` |

#### 2.3 Go Quality Tools Detection

For each Go component, detect installed tools:

```bash
# Detection script for Go
echo "=== Go Quality Tools Detection ==="

# All-in-one linter
golangci-lint --version 2>/dev/null && echo "✓ golangci-lint: installed" || echo "✗ golangci-lint: not installed"

# Individual linters
staticcheck --version 2>/dev/null && echo "✓ staticcheck: installed" || echo "✗ staticcheck: not installed"

# Security
gosec --version 2>/dev/null && echo "✓ gosec: installed" || echo "✗ gosec: not installed"
govulncheck --version 2>/dev/null && echo "✓ govulncheck: installed" || echo "✗ govulncheck: not installed"

# Complexity
gocyclo --version 2>/dev/null && echo "✓ gocyclo: installed" || echo "✗ gocyclo: not installed"

# Formatting
gofmt -help 2>/dev/null && echo "✓ gofmt: installed (built-in)" || echo "✗ gofmt: not installed"
```

**Recommended Go Tools by Hat:**

| Hat | Recommended Tool | Alternative | Install Command |
|-----|-----------------|-------------|-----------------|
| 🎓 Readability | golangci-lint | gofmt + goimports | `go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest` |
| 🎓 Complexity | gocyclo | golangci-lint | (included in golangci-lint) |
| 🔒 Security | gosec | govulncheck | `go install github.com/securego/gosec/v2/cmd/gosec@latest` |
| 💪 Robustness | errcheck | golangci-lint | (included in golangci-lint) |

#### 2.4 Rust Quality Tools Detection

For each Rust component, detect installed tools:

```bash
# Detection script for Rust
echo "=== Rust Quality Tools Detection ==="

# Linting (built-in)
cargo clippy --version 2>/dev/null && echo "✓ clippy: installed" || echo "✗ clippy: not installed"

# Formatting (built-in)
rustfmt --version 2>/dev/null && echo "✓ rustfmt: installed" || echo "✗ rustfmt: not installed"

# Security
cargo audit --version 2>/dev/null && echo "✓ cargo-audit: installed" || echo "✗ cargo-audit: not installed"
cargo deny --version 2>/dev/null && echo "✓ cargo-deny: installed" || echo "✗ cargo-deny: not installed"

# Documentation
rustdoc --version 2>/dev/null && echo "✓ rustdoc: installed (built-in)" || echo "✗ rustdoc: not installed"
```

**Recommended Rust Tools by Hat:**

| Hat | Recommended Tool | Alternative | Install Command |
|-----|-----------------|-------------|-----------------|
| 🎓 Readability | clippy | - | `rustup component add clippy` |
| 🔧 Maintainability | clippy | - | (included with clippy) |
| 🔒 Security | cargo-audit | cargo-deny | `cargo install cargo-audit` |
| 💪 Robustness | clippy | - | (included with clippy) |

### Phase 3: Tool Configuration Detection

#### 3.1 Check for Existing Tool Configurations

For each detected component, check if tools are configured:

**Python:**
```bash
# Check for ruff configuration
[ -f "pyproject.toml" ] && grep -q "\[tool.ruff\]" pyproject.toml && echo "ruff: configured in pyproject.toml"
[ -f ".ruff.toml" ] && echo "ruff: configured in .ruff.toml"

# Check for pylint configuration
[ -f ".pylintrc" ] && echo "pylint: configured in .pylintrc"
[ -f "pyproject.toml" ] && grep -q "\[tool.pylint\]" pyproject.toml && echo "pylint: configured in pyproject.toml"

# Check for mypy configuration
[ -f "mypy.ini" ] && echo "mypy: configured in mypy.ini"
[ -f "pyproject.toml" ] && grep -q "\[tool.mypy\]" pyproject.toml && echo "mypy: configured in pyproject.toml"

# Check for bandit configuration
[ -f ".bandit" ] && echo "bandit: configured in .bandit"
[ -f "pyproject.toml" ] && grep -q "\[tool.bandit\]" pyproject.toml && echo "bandit: configured in pyproject.toml"
```

**JavaScript/TypeScript:**
```bash
# Check for ESLint configuration
[ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ] && echo "eslint: configured"

# Check for TypeScript configuration
[ -f "tsconfig.json" ] && echo "typescript: configured in tsconfig.json"

# Check for Prettier configuration
[ -f ".prettierrc" ] || [ -f ".prettierrc.json" ] && echo "prettier: configured"
```

**Go:**
```bash
# Check for golangci-lint configuration
[ -f ".golangci.yml" ] || [ -f ".golangci.yaml" ] && echo "golangci-lint: configured"
```

**Rust:**
```bash
# Check for clippy configuration (in Cargo.toml)
grep -q "\[lints.clippy\]" Cargo.toml 2>/dev/null && echo "clippy: configured in Cargo.toml"
[ -f "clippy.toml" ] && echo "clippy: configured in clippy.toml"
```

### Phase 4: Missing Tools Installer (Optional)

#### 4.1 Present Missing Tools Summary

If missing tools are detected and `--skip-install` is NOT set:

```
╔═══════════════════════════════════════════════════════════════════╗
║  Missing Quality Tools Detected                                    ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Python (backend):                                                 ║
║    ✗ radon (complexity analysis)                                   ║
║    ✗ bandit (security scanning)                                    ║
║    ✓ ruff (linting + formatting) - installed                       ║
║    ✓ mypy (type checking) - installed                             ║
║    ✗ pydocstyle (documentation) - optional                        ║
║                                                                    ║
║  TypeScript (frontend):                                            ║
║    ✗ complexity-report (complexity analysis) - optional            ║
║    ✓ eslint - installed                                           ║
║    ✓ prettier - installed                                         ║
║    ✓ typescript - installed                                       ║
║                                                                    ║
╠═══════════════════════════════════════════════════════════════════╣
║  Install missing tools?                                            ║
║                                                                    ║
║  [Y] Yes, install all missing tools (recommended)                  ║
║  [S] Select which to install                                       ║
║  [N] No, just generate config (I'll install manually)             ║
╚═══════════════════════════════════════════════════════════════════╝
```

#### 4.2 Execute Installation

If user confirms or `--install` flag is set:

**Python Installation:**
```bash
# Install missing Python tools
pip install radon bandit pydocstyle

# Or with uv (faster, if available)
uv pip install radon bandit pydocstyle

# Verify installation
echo "Verifying installation..."
python -c "import radon" && echo "✓ radon installed"
bandit --version && echo "✓ bandit installed"
pydocstyle --version && echo "✓ pydocstyle installed"
```

**JavaScript/TypeScript Installation:**
```bash
# Install missing JS/TS tools
npm install --save-dev complexity-report @typescript-eslint/eslint-plugin

# Verify installation
npx complexity-report --version && echo "✓ complexity-report installed"
```

**Go Installation:**
```bash
# Install missing Go tools
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
go install github.com/securego/gosec/v2/cmd/gosec@latest
go install golang.org/x/vuln/cmd/govulncheck@latest

# Verify installation
golangci-lint --version && echo "✓ golangci-lint installed"
gosec --version && echo "✓ gosec installed"
```

**Rust Installation:**
```bash
# Install missing Rust tools
rustup component add clippy rustfmt
cargo install cargo-audit

# Verify installation
cargo clippy --version && echo "✓ clippy installed"
cargo audit --version && echo "✓ cargo-audit installed"
```

### Phase 5: Generate Configuration

#### 5.1 Create Quality Configuration Section

Add quality configuration to `testing-workflows-config.md`:

```markdown
## Component: {COMPONENT_NAME} ({LANGUAGE})

### Code Quality Configuration

**Linter**: {detected_linter} (preferred) or {alternative_linter}
**Complexity**: {complexity_tool}
**Security**: {security_tool}
**Type Checking**: {type_checker} (if applicable)
**Formatting**: {formatter}

#### 8 Quality Hats Tool Mapping

| Hat | Tool | Command | Status |
|-----|------|---------|--------|
| 🎓 Readability | {linter} | `{lint_command}` | ✓ Installed |
| 🎓 Complexity | {complexity_tool} | `{complexity_command}` | ✓ Installed |
| 🔧 Maintainability | {mi_tool} | `{mi_command}` | ✓ Installed |
| 🔒 Security | {security_tool} | `{security_command}` | ✓ Installed |
| 💪 Robustness | {type_checker} | `{type_command}` | ✓ Installed |
| 👁️ Observability | Manual analysis | - | N/A |
| 🚀 Extensibility | Manual analysis | - | N/A |
| ⚡ Performance | Manual analysis | - | N/A |

#### Quality Commands

**Run linter:**
```bash
{lint_command}
```

**Run complexity analysis:**
```bash
{complexity_command}
```

**Run security scan:**
```bash
{security_command}
```

**Run type check (if applicable):**
```bash
{type_command}
```

#### Quality Thresholds

| Metric | Threshold | Grade | Tool |
|--------|-----------|-------|------|
| Cyclomatic Complexity | ≤10 | A-B | {complexity_tool} |
| Maintainability Index | ≥65 | A | {mi_tool} |
| Type Coverage | ≥80% | Good | {type_checker} |
| Security Issues (High) | 0 | Pass | {security_tool} |
| Lint Errors | 0 | Pass | {linter} |

#### Tier Definitions

**Critical Tier** (highest quality bar):
- {critical_patterns}

**High-Risk Tier**:
- {high_risk_patterns}

**Standard Tier**:
- {standard_patterns}
```

#### 5.2 Language-Specific Configuration Templates

**Python Configuration:**

```markdown
### Code Quality Configuration

**Linter**: ruff (preferred) or pylint
**Complexity**: radon
**Security**: bandit
**Type Checking**: mypy
**Formatting**: ruff format (or black)

#### 8 Quality Hats Tool Mapping

| Hat | Tool | Command | Status |
|-----|------|---------|--------|
| 🎓 Readability | ruff | `ruff check src/` | ✓ Installed |
| 🎓 Complexity | radon | `radon cc src/ -a -nb` | ✓ Installed |
| 🔧 Maintainability | radon | `radon mi src/ -s` | ✓ Installed |
| 🔒 Security | bandit | `bandit -r src/ -ll` | ✓ Installed |
| 💪 Robustness | mypy | `mypy src/` | ✓ Installed |
| 📚 Documentation | pydocstyle | `pydocstyle src/` | ✗ Optional |
| 👁️ Observability | Manual | - | N/A |
| 🚀 Extensibility | Manual | - | N/A |
| ⚡ Performance | Manual | - | N/A |

#### Quality Commands

**Run linter:**
```bash
ruff check src/
# or: pylint src/ --rcfile=.pylintrc
```

**Run complexity analysis:**
```bash
radon cc src/ -a -nb --min B
```

**Run maintainability index:**
```bash
radon mi src/ -s
```

**Run security scan:**
```bash
bandit -r src/ -ll
```

**Run type check:**
```bash
mypy src/ --config-file=pyproject.toml
```

#### Quality Thresholds

| Metric | Threshold | Grade | Tool |
|--------|-----------|-------|------|
| Cyclomatic Complexity | ≤10 | A-B | radon |
| Maintainability Index | ≥65 | A | radon mi |
| Type Coverage | ≥80% | Good | mypy |
| Security Issues (High) | 0 | Pass | bandit |
| Lint Errors | 0 | Pass | ruff |
```

**TypeScript Configuration:**

```markdown
### Code Quality Configuration

**Linter**: eslint (preferred) or biome
**Complexity**: complexity-report or escomplex
**Security**: npm audit
**Type Checking**: typescript (built-in)
**Formatting**: prettier

#### 8 Quality Hats Tool Mapping

| Hat | Tool | Command | Status |
|-----|------|---------|--------|
| 🎓 Readability | eslint | `npx eslint src/` | ✓ Installed |
| 🎓 Complexity | complexity-report | `npx complexity-report src/` | ✓ Installed |
| 🔧 Maintainability | eslint | `npx eslint src/` | ✓ Installed |
| 🔒 Security | npm audit | `npm audit` | ✓ Built-in |
| 💪 Robustness | typescript | `npx tsc --noEmit` | ✓ Installed |
| 📚 Documentation | typedoc | `npx typedoc src/` | ✗ Optional |
| 👁️ Observability | Manual | - | N/A |
| 🚀 Extensibility | Manual | - | N/A |
| ⚡ Performance | Manual | - | N/A |

#### Quality Commands

**Run linter:**
```bash
npx eslint src/
# or: npx biome check src/
```

**Run complexity analysis:**
```bash
npx complexity-report --format json src/
```

**Run security scan:**
```bash
npm audit
# or: npx snyk test
```

**Run type check:**
```bash
npx tsc --noEmit
```

#### Quality Thresholds

| Metric | Threshold | Grade | Tool |
|--------|-----------|-------|------|
| Cyclomatic Complexity | ≤10 | Good | complexity-report |
| Type Coverage | 100% | Pass | typescript |
| Security Issues (High) | 0 | Pass | npm audit |
| Lint Errors | 0 | Pass | eslint |
```

**Go Configuration:**

```markdown
### Code Quality Configuration

**Linter**: golangci-lint (all-in-one)
**Complexity**: gocyclo (included in golangci-lint)
**Security**: gosec, govulncheck
**Type Checking**: (built-in)
**Formatting**: gofmt, goimports

#### 8 Quality Hats Tool Mapping

| Hat | Tool | Command | Status |
|-----|------|---------|--------|
| 🎓 Readability | golangci-lint | `golangci-lint run` | ✓ Installed |
| 🎓 Complexity | golangci-lint | `golangci-lint run --enable=gocyclo` | ✓ Installed |
| 🔧 Maintainability | golangci-lint | `golangci-lint run` | ✓ Installed |
| 🔒 Security | gosec | `gosec ./...` | ✓ Installed |
| 💪 Robustness | errcheck | `golangci-lint run --enable=errcheck` | ✓ Installed |
| 👁️ Observability | Manual | - | N/A |
| 🚀 Extensibility | Manual | - | N/A |
| ⚡ Performance | Manual | - | N/A |

#### Quality Commands

**Run all linters:**
```bash
golangci-lint run ./...
```

**Run security scan:**
```bash
gosec ./...
govulncheck ./...
```

#### Quality Thresholds

| Metric | Threshold | Grade | Tool |
|--------|-----------|-------|------|
| Cyclomatic Complexity | ≤10 | Pass | gocyclo |
| Security Issues (High) | 0 | Pass | gosec |
| Lint Errors | 0 | Pass | golangci-lint |
```

**Rust Configuration:**

```markdown
### Code Quality Configuration

**Linter**: clippy (built-in)
**Complexity**: (via clippy)
**Security**: cargo-audit
**Type Checking**: (built-in)
**Formatting**: rustfmt

#### 8 Quality Hats Tool Mapping

| Hat | Tool | Command | Status |
|-----|------|---------|--------|
| 🎓 Readability | clippy | `cargo clippy` | ✓ Installed |
| 🎓 Complexity | clippy | `cargo clippy -- -W clippy::cognitive_complexity` | ✓ Installed |
| 🔧 Maintainability | clippy | `cargo clippy` | ✓ Installed |
| 🔒 Security | cargo-audit | `cargo audit` | ✓ Installed |
| 💪 Robustness | clippy | `cargo clippy -- -W clippy::unwrap_used` | ✓ Installed |
| 👁️ Observability | Manual | - | N/A |
| 🚀 Extensibility | Manual | - | N/A |
| ⚡ Performance | Manual | - | N/A |

#### Quality Commands

**Run linter:**
```bash
cargo clippy -- -D warnings
```

**Run security scan:**
```bash
cargo audit
```

**Run formatting check:**
```bash
cargo fmt --check
```

#### Quality Thresholds

| Metric | Threshold | Grade | Tool |
|--------|-----------|-------|------|
| Clippy Warnings | 0 | Pass | clippy |
| Security Issues (High) | 0 | Pass | cargo-audit |
```

### Phase 6: Report Results

#### 6.1 Display Summary

```
Analyzing project structure for quality assessment configuration...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Detected {N} component(s):

━━━ Backend (Python) ━━━
  Location: ./
  Package: telegram_claude_bot (from pyproject.toml)
  Source: src/

  Quality Tools:
    ✓ ruff (linting) - installed & configured
    ✓ radon (complexity) - installed
    ✓ bandit (security) - installed
    ✓ mypy (type checking) - installed & configured
    ✗ pydocstyle (documentation) - not installed (optional)

  8 Quality Hats Coverage:
    ✓ Readability: ruff + radon
    ✓ Maintainability: radon mi
    ✓ Security: bandit
    ✓ Robustness: mypy
    ○ Testability: Manual analysis
    ○ Extensibility: Manual analysis
    ○ Performance: Manual analysis
    ○ Observability: Manual analysis

━━━ Frontend (TypeScript) ━━━
  Location: frontend/
  Package: telegram-claude-dashboard (from package.json)
  Source: frontend/src/

  Quality Tools:
    ✓ eslint (linting) - installed & configured
    ✗ complexity-report (complexity) - not installed
    ✓ npm audit (security) - built-in
    ✓ typescript (type checking) - installed & configured
    ✓ prettier (formatting) - installed & configured

  8 Quality Hats Coverage:
    ✓ Readability: eslint
    ⚠ Maintainability: No complexity tool (install complexity-report)
    ✓ Security: npm audit
    ✓ Robustness: typescript
    ○ Testability: Manual analysis
    ○ Extensibility: Manual analysis
    ○ Performance: Manual analysis
    ○ Observability: Manual analysis

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Updated: .claude/rules/testing-workflows-config.md

Next steps:
1. Review the quality configuration in testing-workflows-config.md
2. Install missing optional tools if desired
3. Run quality assessment: /run-workflow code-quality-assessment
4. Focus on specific tier: /run-workflow code-quality-assessment --tier=critical
5. Analyze only (no changes): /run-workflow code-quality-assessment --analyze-only

For specific component:
  /run-workflow code-quality-assessment --components=backend
For all components:
  /run-workflow code-quality-assessment --components=backend,frontend
```

#### 6.2 Highlight Warnings

```
⚠️ Manual review needed:

- Component "frontend": No complexity analysis tool installed
  → Install with: npm install --save-dev complexity-report
  → Or run /init-quality-config --install

- Component "backend": pydocstyle not installed (optional)
  → Documentation coverage analysis will be limited
  → Install with: pip install pydocstyle

- Tool "mypy" has strict mode disabled
  → Consider enabling: mypy --strict for better robustness analysis
```

### Phase 7: Validation

#### 7.1 Validate Generated Configuration

```bash
# Check if testing-workflows-config.md exists or was created
if [ ! -f .claude/rules/testing-workflows-config.md ]; then
  echo "❌ Failed to generate/update testing-workflows-config.md"
  exit 1
fi

# Check if quality config section was added
if ! grep -q "### Code Quality Configuration" .claude/rules/testing-workflows-config.md; then
  echo "❌ Quality configuration section not found in config"
  exit 1
fi

# Verify at least one component was configured
COMPONENT_COUNT=$(grep -c "## Component:" .claude/rules/testing-workflows-config.md || true)
if [ "$COMPONENT_COUNT" -eq 0 ]; then
  echo "❌ No components detected"
  echo "   Ensure project has language marker files (pyproject.toml, package.json, etc.)"
  exit 1
fi

echo "✅ Configuration validated: $COMPONENT_COUNT component(s) configured"
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

### Tool Installation Failed

```
⚠️ Failed to install radon

Error: pip install radon failed with exit code 1
Output: ERROR: Could not find a version that satisfies the requirement radon

Suggestions:
1. Check your Python version (requires Python 3.8+)
2. Update pip: pip install --upgrade pip
3. Install manually: pip install radon

Continuing with available tools...
```

### Configuration Already Exists

```
ℹ️ Quality configuration already exists in .claude/rules/testing-workflows-config.md

To update the configuration:
  /init-quality-config --force

To view current configuration:
  cat .claude/rules/testing-workflows-config.md
```

## Success Criteria

A successful run should:
1. ✅ Detect all project components (backend, frontend, etc.)
2. ✅ Identify installed quality tools per component
3. ✅ Map tools to the 8 Quality Hats framework
4. ✅ Optionally install missing tools with user confirmation
5. ✅ Generate quality commands per component
6. ✅ Define quality thresholds by tier
7. ✅ Update/create `.claude/rules/testing-workflows-config.md`
8. ✅ Provide clear next steps for quality assessment workflow

## Integration with Code Quality Assessment Workflow

Once the config is generated, use it with the code quality assessment workflow:

```bash
# Run for all components
/run-workflow code-quality-assessment

# Run for specific component
/run-workflow code-quality-assessment --components=backend

# Focus on specific hat
/run-workflow code-quality-assessment --hat=security

# Analyze only (no changes)
/run-workflow code-quality-assessment --analyze-only

# Focus on critical tier
/run-workflow code-quality-assessment --tier=critical
```

The workflow will automatically load quality configuration from `.claude/rules/testing-workflows-config.md`.

---

**Note:** This command performs detection and optional installation. Review the generated configuration and adjust thresholds as needed before running the quality assessment workflow.
