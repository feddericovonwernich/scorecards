# Test Consolidation Loop Workflow

## Overview

This workflow iteratively consolidates tests until diminishing returns are detected, automatically determining when to stop based on data-driven analysis.

## Purpose

Reduce test count while maintaining coverage by:
1. Identifying consolidation opportunities (duplicates, parameterization candidates, fragmented classes)
2. Running `/consolidate-tests` command iteratively
3. Verifying no regressions after each iteration
4. Stopping when opportunities fall below threshold or reduction becomes marginal

## When to Use

Run this workflow when:
- Test suite has grown organically without consolidation
- You have 50+ new tests since last consolidation
- Test count increased by 10%+ since last consolidation
- You want to optimize test suite maintenance cost

Do NOT run when:
- Test suite was recently consolidated (<30 days)
- Test count is already low (<100 tests)
- You lack time to review changes (workflow may take 30-60 minutes)

## Quick Start

### Basic Usage

```bash
# Run with default settings (auto-detects diminishing returns)
/run-workflow .claude/workflows/consolidate-tests-loop/

# Dry run (analyze only, no changes)
/run-workflow .claude/workflows/consolidate-tests-loop/ --DRY_RUN=true

# Force execution (skip diminishing returns check)
/run-workflow .claude/workflows/consolidate-tests-loop/ --FORCE=true

# Backend only
/run-workflow .claude/workflows/consolidate-tests-loop/ --BACKEND_ONLY=true

# Custom thresholds
/run-workflow .claude/workflows/consolidate-tests-loop/ \
  --MIN_OPPORTUNITIES=3 \
  --MIN_REDUCTION_PCT=2.0 \
  --MAX_ITERATIONS=20
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `MAX_ITERATIONS` | integer | 10 | Maximum loop iterations (safety limit) |
| `MIN_OPPORTUNITIES` | integer | 5 | Minimum consolidation opportunities to continue |
| `MIN_REDUCTION_PCT` | number | 3.0 | Minimum reduction percentage to continue |
| `BACKEND_ONLY` | boolean | false | Only consolidate Python tests |
| `FRONTEND_ONLY` | boolean | false | Only consolidate TypeScript/Vue tests |
| `DRY_RUN` | boolean | false | Analyze only, make no changes |
| `FORCE` | boolean | false | Skip diminishing returns check |
| `OUTPUT_DIR` | directory | ./.claude/workflows/consolidate-tests-loop/runs | Output directory |

## Workflow Phases

### Phase 0: Prerequisites (phase-00-prerequisites.md)
**Purpose**: Verify prerequisites and establish baseline

**Tasks**:
- Verify test suite structure
- Check git repository status
- Measure baseline test count and coverage
- Load or initialize consolidation history

**Outputs**:
- consolidation-baseline.json
- history.json
- TESTS_BASELINE, COVERAGE_BASELINE parameters

### Phase 1: Initial Analysis (phase-01-initial-analysis.md)
**Purpose**: Analyze opportunities and decide whether to proceed

**Tasks**:
- Run comprehensive quality analysis
- Count exact duplicates, parameterization candidates, fragmented classes
- Apply diminishing returns decision matrix
- Generate initial analysis report

**Outputs**:
- initial-analysis.json
- opportunities-report.md
- SHOULD_PROCEED, TOTAL_OPPORTUNITIES parameters

**Decision Matrix** (determines whether to proceed):
- **PROCEED**: 20+ opportunities OR 10%+ estimated reduction
- **WARN & ASK**: 5-10 opportunities OR 3-5% reduction
- **STOP**: <5 opportunities OR <3% reduction

### Phase 2: Consolidation Loop (phase-02-consolidation-loop.md) ⟲
**Purpose**: Execute one iteration of consolidation (LOOPS until diminishing returns)

**Tasks**:
- Run `/consolidate-tests` command
- Verify tests pass
- Measure new test count and coverage
- Analyze remaining opportunities
- Decide whether to continue looping (sets LOOP_CONTINUE parameter)

**Outputs**:
- iteration-N-report.json
- iteration-N-summary.md
- LOOP_CONTINUE, CURRENT_TEST_COUNT parameters

**Loop Control**: Phase 2 sets `LOOP_CONTINUE=true` to continue or `LOOP_CONTINUE=false` to stop based on:
- Remaining opportunities < MIN_OPPORTUNITIES
- Iteration reduction < MIN_REDUCTION_PCT
- No progress made (0 tests reduced)

### Phase 3: Final Verification (phase-03-final-verification.md)
**Purpose**: Verify consolidation did not introduce regressions

**Tasks**:
- Run full test suite with verbose output
- Verify coverage maintained or improved
- Check mutation score (if available)
- Generate verification report

**Outputs**:
- final-verification.json
- test-verification.log
- VERIFICATION_SUCCESS parameter

### Phase 4: Final Report (phase-04-final-report.md)
**Purpose**: Generate comprehensive report and update history

**Tasks**:
- Aggregate metrics across all iterations
- Generate iteration comparison table
- Provide recommendations for next steps
- Update consolidation history

**Outputs**:
- FINAL-REPORT.md
- iteration-summary.json
- recommendations.md
- Updated .claude/test-consolidation-history.json

## How the Loop Works

This workflow uses a **hybrid loop control** mechanism:

1. **Declarative Structure**: The `loops` section in workflow.yaml declares that Phase 2 is a loop body
2. **Phase Control**: Phase 2 analyzes results and sets the `LOOP_CONTINUE` parameter
3. **Orchestrator**: The workflow orchestrator respects the `LOOP_CONTINUE` parameter to continue or exit

**Flow Diagram**:
```
Phase 0 (Prerequisites)
  ↓
Phase 1 (Initial Analysis)
  ↓
  ├─[SHOULD_PROCEED=false]→ Skip to Phase 4
  ↓
Phase 2 (Consolidation Loop) ⟲
  ├── Run /consolidate-tests
  ├── Verify tests pass
  ├── Measure current state
  ├── Analyze remaining opportunities
  ├── Set LOOP_CONTINUE based on:
  │    • Remaining opportunities >= MIN_OPPORTUNITIES?
  │    • Iteration reduction >= MIN_REDUCTION_PCT?
  │    • Progress made (tests reduced > 0)?
  └── [LOOP_CONTINUE=true] → Repeat Phase 2
      [LOOP_CONTINUE=false] → Continue to Phase 3
  ↓
Phase 3 (Final Verification)
  ↓
Phase 4 (Final Report)
```

## Output Structure

After workflow execution, outputs are organized in a timestamped run directory:

```
.claude/workflows/consolidate-tests-loop/runs/run-YYYYMMDD-HHMMSS/
├── consolidation-baseline.json      # Phase 0: Initial state
├── history.json                     # Phase 0: Loaded history
├── initial-analysis.json            # Phase 1: Opportunity analysis
├── opportunities-report.md          # Phase 1: Human-readable
├── iteration-1-report.json          # Phase 2: Iteration 1 results
├── iteration-1-summary.md           # Phase 2: Iteration 1 summary
├── iteration-2-report.json          # Phase 2: Iteration 2 results
├── iteration-2-summary.md           # Phase 2: Iteration 2 summary
├── ...                              # Additional iterations
├── final-verification.json          # Phase 3: Verification results
├── test-verification.log            # Phase 3: Full test output
├── iteration-summary.json           # Phase 4: Aggregated data
├── recommendations.md               # Phase 4: Next steps
└── FINAL-REPORT.md                  # Phase 4: Comprehensive report
```

## Interpreting Results

### Success Indicators

✅ **Excellent Result**:
- 3+ iterations completed
- 10%+ total test reduction
- Coverage maintained or improved
- All tests passing
- ROI score > 20

✅ **Good Result**:
- 2+ iterations completed
- 5-10% test reduction
- Coverage maintained
- All tests passing
- ROI score > 10

⚠️ **Marginal Result**:
- 1 iteration completed
- 3-5% test reduction
- Minor coverage changes
- Consider reverting if maintenance cost high

❌ **No Improvement**:
- 0 iterations (Phase 1 blocked)
- Test suite already well-optimized
- Focus on other improvements (coverage, mutation testing)

### Understanding ROI Score

**ROI Score** = (Tests Reduced × 10) / (Files Modified + Consolidations × 0.5)

- **>20**: Excellent consolidation with high value/effort ratio
- **10-20**: Good consolidation worth the effort
- **5-10**: Marginal consolidation, consider case-by-case
- **<5**: Low value, may not be worth the effort

## Troubleshooting

### Workflow stops at Phase 1 (SHOULD_PROCEED=false)

**Symptom**: Phase 1 reports "Diminishing returns detected"

**Cause**: Test suite is already well-optimized

**Solution**:
- Review `opportunities-report.md` for details
- Use `--FORCE=true` to override (not recommended)
- Focus on increasing coverage instead: `/increase-coverage`

### Loop completes after 1 iteration

**Symptom**: Phase 2 sets LOOP_CONTINUE=false after first iteration

**Cause**: Remaining opportunities fell below threshold

**Solution**:
- Lower thresholds: `--MIN_OPPORTUNITIES=3 --MIN_REDUCTION_PCT=2.0`
- Review if consolidation was still valuable

### Tests fail after consolidation

**Symptom**: Phase 3 reports TESTS_PASS=false

**Cause**: Consolidation introduced regressions

**Solution**:
1. Review test-verification.log: `cat .claude/workflows/consolidate-tests-loop/runs/run-*/test-verification.log`
2. Check git diff: `git diff HEAD tests/`
3. Revert if needed: `git checkout HEAD tests/`
4. Report issue to workflow maintainer

### Coverage dropped significantly

**Symptom**: Phase 3 reports COVERAGE_MAINTAINED=false

**Cause**: Consolidation removed tests covering unique code paths

**Solution**:
1. Review which tests were removed
2. Identify missing coverage with: `pytest --cov --cov-report=html`
3. Consider reverting or adding back missing tests
4. Adjust MIN_OPPORTUNITIES threshold higher

## Best Practices

### Before Running

1. **Commit or stash changes** - Workflow modifies test files
2. **Run tests first** - Ensure baseline is healthy: `pytest tests/ -v`
3. **Check history** - Review `.claude/test-consolidation-history.json` for recent runs
4. **Allocate time** - Workflow may take 30-60 minutes depending on test suite size

### After Running

1. **Review FINAL-REPORT.md** - Understand what changed
2. **Review git diff** - Inspect actual changes: `git diff HEAD tests/`
3. **Run tests manually** - Verify locally: `pytest tests/ -v`
4. **Commit atomically** - One commit for consolidation work
5. **Update documentation** - Note consolidation in CHANGELOG if significant

### Periodic Maintenance

- **Monthly**: Review test suite health metrics
- **Quarterly**: Run consolidation workflow
- **After major features**: Run if test count increased 10%+
- **Before releases**: Ensure test suite is optimized

## Integration with Other Workflows

This workflow complements:

- **`/increase-coverage`**: Run AFTER consolidation to improve coverage
- **`/increase-mutation-score`**: Run AFTER consolidation to verify test quality
- **`/consolidate-tests`**: This workflow uses that command iteratively

Recommended sequence:
1. Run `/consolidate-tests-loop` (reduce test count)
2. Run `/increase-coverage` (improve coverage to target)
3. Run `/increase-mutation-score` (verify test effectiveness)

## Customization

### Adjusting Thresholds

If you want more/less aggressive consolidation:

**More Aggressive** (more iterations):
```bash
/run-workflow .claude/workflows/consolidate-tests-loop/ \
  --MIN_OPPORTUNITIES=3 \
  --MIN_REDUCTION_PCT=1.5
```

**Less Aggressive** (fewer iterations, higher quality bar):
```bash
/run-workflow .claude/workflows/consolidate-tests-loop/ \
  --MIN_OPPORTUNITIES=10 \
  --MIN_REDUCTION_PCT=5.0
```

### Extending the Workflow

To customize behavior, modify these files:

- **Phase 1**: Adjust diminishing returns decision matrix
- **Phase 2**: Modify loop continuation logic
- **Phase 4**: Customize report format or recommendations

## FAQ

**Q: How long does this workflow take?**
A: Depends on test suite size. Typical: 30-60 minutes for 300-500 tests with 2-5 iterations.

**Q: Will this break my tests?**
A: No. Phase 3 verifies all tests pass. If regressions detected, you can revert changes with git.

**Q: Can I run this in CI/CD?**
A: Not recommended. This is an interactive workflow for manual test suite optimization. Results should be reviewed before committing.

**Q: What if Phase 1 blocks proceeding?**
A: Your test suite is already well-optimized. Focus on improving coverage or adding new tests.

**Q: How often should I run this?**
A: Quarterly, or when test count increases by 10%+ (typically after adding 50+ tests).

**Q: What's the difference between this and `/consolidate-tests`?**
A: This workflow runs `/consolidate-tests` iteratively until diminishing returns. Single command runs once.

**Q: Can I consolidate frontend and backend tests together?**
A: No. Use `--BACKEND_ONLY=true` or `--FRONTEND_ONLY=true` to focus on one at a time.

## Support

For issues or questions:
1. Review the FINAL-REPORT.md generated by the workflow
2. Check `.claude/test-consolidation-history.json` for historical context
3. Review the workflow specification: `.claude/docs/SPECIFICATION.md`
4. File an issue with the workflow maintainer

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-15 | Initial workflow implementation |

## Related Documentation

- `/consolidate-tests` command: `.claude/commands/consolidate-tests.md`
- Workflow specification: `.claude/docs/SPECIFICATION.md`
- Test quality rules: `.claude/rules/testing.md`
- Coverage strategies: `.claude/rules/coverage-strategies.md`
