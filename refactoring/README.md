# Scorecards Codebase Refactoring Plan

## Overview

This refactoring addresses **65+ issues** across the scorecards codebase, organized into **6 self-contained phases**. Each phase can be executed independently.

## User Decisions

- **Scope**: All phases (comprehensive refactoring)
- **Type Safety**: JSDoc with `checkJs: true` (no TypeScript migration)
- **Breaking Changes**: Allowed - full restructuring permitted

## Phases

| Phase | File | Scope | Risk | Est. Files |
|-------|------|-------|------|------------|
| 1 | [phase-1-configuration-eslint.md](./phase-1-configuration-eslint.md) | Config system, lint fixes | Low | ~15 |
| 2 | [phase-2-bash-hardening.md](./phase-2-bash-hardening.md) | Strict mode, quotes, utilities | Low-Med | ~15 |
| 3 | [phase-3-jq-extraction.md](./phase-3-jq-extraction.md) | JSON builders for bash | Medium | ~5 |
| 4 | [phase-4-jsdoc-types.md](./phase-4-jsdoc-types.md) | Type definitions, checkJs | Low | ~20 |
| 5 | [phase-5-ui-modularization.md](./phase-5-ui-modularization.md) | Split service-modal | Med-High | ~15 |
| 6 | [phase-6-state-python-tests.md](./phase-6-state-python-tests.md) | State management, Python types | Medium | ~25 |

## Execution Order

**Recommended**: 1 → 2 → 3 → 4 → 5 → 6

Each phase is self-contained and can be committed independently. Run tests after each phase to ensure nothing breaks.

## How to Execute

In a new Claude Code context, say:

```
Execute the refactoring plan in /home/feddericokz/Workspace/scorecards-workspace/scorecards/refactoring/phase-1-configuration-eslint.md
```

## Issues Addressed

### Hardcoded Values (16 issues)
- Repository owner hardcoded
- Rank thresholds (90/75/50)
- Port 8080 hardcoded
- Quality thresholds
- Git bot credentials
- API versions
- Workflow filenames

### Modularization (12 issues)
- Monolithic service-modal.js (1,095 lines)
- jq filter duplication
- File-finding pattern repeated
- Tab switching duplicated
- SVG icons inline
- Global state scattered

### Industry Standards (24 issues)
- console.log in production
- Missing error boundaries
- No type checking
- Inconsistent bash error handling
- Unquoted variables
- Low test coverage
