---
description: Test baseline capture and comparison guidelines
globs: tests/baseline/**/*
---

# Test Baseline Guidelines

## Purpose

Baselines capture expected output for regression testing. They ensure scoring consistency across changes.

## Structure

- `tests/baseline/capture-baseline.sh` - Script to capture current state
- `tests/baseline/pre-refactor/` - Baseline snapshots with:
  - `*-metrics.json` - Expected scoring output per test repo
  - `unit-tests-output.txt` - Expected unit test output
  - `BASELINE.md` - Documentation of baseline state

## Capture Script

```bash
# Capture current state as baseline
./tests/baseline/capture-baseline.sh
```

## Updating Baselines

When intentionally changing scoring behavior:
1. Make the code change
2. Run tests to see failures
3. Verify failures are expected (not regressions)
4. Re-capture baseline
5. Commit baseline with code change

**NEVER** update baselines to make failing tests pass without understanding why they failed.
