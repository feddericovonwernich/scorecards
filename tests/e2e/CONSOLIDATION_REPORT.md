# Test Consolidation Report

Generated: 2025-12-07

## Summary

| Metric | Value |
|--------|-------|
| Current test files | 21 |
| Current total tests | 318 |
| Proposed total tests | 193 |
| Total reduction | 39.3% |

## By Feature Area

| Feature Area | Current | Proposed | Reduction | Priority |
|--------------|---------|----------|-----------|----------|
| UI/UX | 49 | 28 | 42.9% | HIGH |
| State & Errors | 49 | 29 | 40.8% | HIGH |
| Service Modal | 40 | 24 | 40.0% | HIGH |
| Infrastructure | 82 | 51 | 37.8% | HIGH |
| Core Catalog | 40 | 25 | 37.5% | HIGH |
| Teams | 56 | 36 | 35.7% | HIGH |

## Implementation Order

Based on reduction percentage and complexity:

1. **UI/UX** (42.9% reduction) - Many EASY consolidations in night-mode and toast tests
2. **State & Errors** (40.8% reduction) - High overlap in filter state and error handling tests
3. **Service Modal** (40.0% reduction) - Natural user journeys through modal tabs
4. **Infrastructure** (37.8% reduction) - Setup deduplication in API and auth tests
5. **Core Catalog** (37.5% reduction) - Sorting and filtering tests share identical setup
6. **Teams** (35.7% reduction) - Modal workflows and filter interactions

## Consolidation Strategy Distribution

| Strategy | Count | Typical Complexity |
|----------|-------|-------------------|
| Setup Deduplication | 47 | EASY |
| User Journey | 24 | EASY-MEDIUM |
| Combined | 6 | MEDIUM |

## Task Files

- `consolidation-tasks/01-core-catalog.md`
- `consolidation-tasks/02-service-modal.md`
- `consolidation-tasks/03-teams.md`
- `consolidation-tasks/04-infrastructure.md`
- `consolidation-tasks/05-ui-ux.md`
- `consolidation-tasks/06-state-errors.md`

## Quick Wins (EASY Complexity)

These consolidations can be done quickly with minimal restructuring:

### Core Catalog
- Sorting tests (4 → 1)
- Search tests (4 → 1)
- Check filter modal open/close (5 → 1)

### Service Modal
- Modal open/close journey (2 → 1)
- Badge URL/format validation (5 → 2)
- Clipboard copy flow (3 → 1)

### UI/UX
- Night mode initial state (3 → 1)
- Night mode toggle flow (4 → 1)
- Toast success flow (3 → 1)
- Actions widget filtering (2 → 1)

### State & Errors
- Empty states (3 → 1)
- Rate limit displays (4 → 1)
- Bulk trigger errors (3 → 1)

## Notes

- All consolidations preserve 100% of original assertions
- No test coverage should be lost
- Prioritize EASY complexity for quick wins
- Run tests after each consolidation to verify coverage
