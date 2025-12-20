# Coverage Improvement Loop - Quick Start

## For Python Projects (Legacy)

```bash
# Just run it - defaults work for most Python projects
/workflow:run-workflow coverage-improvement-loop
```

## For Multi-Language Projects

### Step 1: Generate Configuration (One-Time)
```bash
/init-coverage-config
```

This creates `.claude/rules/testing-workflows-config.md` with auto-detected languages and tier patterns.

### Step 2: Review Configuration (Optional)
Edit `.claude/rules/testing-workflows-config.md` to:
- Adjust tier patterns (critical/high-risk/standard)
- Verify language detection
- Customize coverage targets

### Step 3: Run Workflow

**Backend only** (Python, Go, Rust):
```bash
/workflow:run-workflow coverage-improvement-loop --components=backend
```

**Frontend only** (JavaScript, TypeScript):
```bash
/workflow:run-workflow coverage-improvement-loop --components=frontend
```

**Both backend and frontend**:
```bash
/workflow:run-workflow coverage-improvement-loop --components=backend,frontend
```

**Specific language**:
```bash
/workflow:run-workflow coverage-improvement-loop --language=typescript
```

## Common Parameters

```bash
# Set coverage target
--target-coverage=85

# Focus on critical tier only
--tier=critical

# More aggressive iterations
--files-per-iteration=10
--max-iterations=30

# Lower ROI threshold (continue longer)
--min-roi=0.3
```

## Complete Example (TypeScript Frontend)

```bash
# One-time setup
/init-coverage-config

# Run workflow
/workflow:run-workflow coverage-improvement-loop \
  --language=typescript \
  --components=frontend \
  --target-coverage=75 \
  --tier=critical \
  --max-iterations=15
```

## Troubleshooting

**"Config file not found"**:
- Run `/init-coverage-config` first

**"No coverage tool detected"**:
- Python: `pip install pytest pytest-cov`
- JavaScript: `npm install -D vitest @vitest/coverage-v8`
- Go: Built-in (no install needed)
- Rust: `cargo install cargo-tarpaulin`

**"Coverage not improving"**:
- Check HTML coverage report: `pytest --cov --cov-report=html`
- Review `iteration-N-analysis.md` files in workflow output
- May need manual tests for complex scenarios

## Next Steps

After reaching coverage targets:
1. Run mutation testing (Python): `/increase-mutation-score`
2. Add coverage gates to CI/CD
3. Review generated tests for quality

## Migration from Old Version

**Old** (deprecated):
```bash
/workflow:run-workflow coverage-improvement-loop --backend-only=true
```

**New** (recommended):
```bash
/init-coverage-config  # One-time
/workflow:run-workflow coverage-improvement-loop --components=backend
```

## See Full Documentation

For complete details, see [README.md](./README.md).
