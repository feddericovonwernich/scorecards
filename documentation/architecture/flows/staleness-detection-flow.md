# Staleness Detection Flow

This document describes how the system detects when service scorecards are outdated and need re-scoring.

## Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│          Checks Modified in Main Branch                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Someone modifies:                                     │ │
│  │  - checks/*/check.{sh|py|js}                           │ │
│  │  - checks/*/metadata.json                              │ │
│  │  - New check added                                     │ │
│  │  - Check removed                                       │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ 1. Push triggers update-checks-hash.yml
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│          Update Checks Hash Workflow                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  2. Validate every check candidate before publication │ │
│  │  3. Hash each immediate directory from its ID,         │ │
│  │     metadata bytes and selected implementation bytes  │ │
│  │  4. Combine directory hashes deterministically         │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ 4. Commit both summary files
                 ▼
┌──────────────────────────────────────────────────────────────┐
│          Catalog Branch                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  current-checks.json                                  │ │
│  │  { "checks_hash": "abc123...",                        │ │
│  │    "checks_count": 13, "generated_at": "..." }        │ │
│  │                                                        │ │
│  │  current-checks-hash.txt                              │ │
│  │  abc123def456...                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ 5. UI fetches current hash
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│          Catalog UI Loads                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  On page load:                                         │ │
│  │  1. Fetch registry/all-services.json                   │ │
│  │  2. Fetch current-checks.json (extract checks_hash)    │ │
│  │  3. For each service, compare:                         │ │
│  │     service.checks_hash vs current-checks-hash         │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ├─ 6a. Hashes MATCH
                 │    │
                 │    ▼
                 │  ┌──────────────────────────────────────────┐
                 │  │  Service is UP TO DATE                  │
                 │  │  - Green checkmark                      │
                 │  │  - No warning indicator                 │
                 │  └──────────────────────────────────────────┘
                 │
                 └─ 6b. Hashes DON'T MATCH
                      │
                      ▼
                    ┌──────────────────────────────────────────┐
                    │  Service is STALE                       │
                    │  - Warning icon (⚠️)                     │
                    │  - Highlighted row                      │
                    │  - "Re-run needed" tooltip              │
                    │  - Added to bulk re-run list            │
                    └──────┬───────────────────────────────────┘
                           │
                           │ 7. User triggers re-scoring
                           │
                           ▼
                    ┌──────────────────────────────────────────┐
                    │  Trigger Options                        │
                    │  ┌────────────────────────────────────┐ │
                    │  │  A. Single service:                │ │
                    │  │     Click "Update" button          │ │
                    │  │     → Dispatch workflow for 1      │ │
                    │  └────────────────────────────────────┘ │
                    │  ┌────────────────────────────────────┐ │
                    │  │  B. Bulk re-run stale:             │ │
                    │  │     Click "Re-run All Stale"       │ │
                    │  │     → Dispatch for all stale       │ │
                    │  └────────────────────────────────────┘ │
                    └──────┬───────────────────────────────────┘
                           │
                           │ 8. Workflow runs with new checks
                           │
                           ▼
                    ┌──────────────────────────────────────────┐
                    │  Service Scorecard Runs                 │
                    │  - Uses NEW check suite (current hash)  │
                    │  - Calculates NEW score                 │
                    │  - Updates registry with current hash   │
                    │  - Service no longer stale              │
                    └──────────────────────────────────────────┘
```

## Step Details

### 1. Trigger Hash Update

**Workflow**: `.github/workflows/update-checks-hash.yml`

See the [workflow reference](../../reference/workflows.md#update-checks-hashyml) for triggers and dispatch restrictions.

### 2–3. Validate and calculate the checks hash

**Implementation**: `action/utils/update-checks-hash.sh`

The script validates every candidate through the
[canonical check contract](../../guides/check-development-guide.md#canonical-check-contract)
before producing a hash or publishing suite state. It then applies its
established algorithm to every immediate directory, including support
directories: combine directory ID, metadata hash when present, and the selected
implementation hash when present; then hash the ordered combined values.

The script owns the exact discovery, byte, and directory-count semantics.
Validation deliberately does not change the valid suite's digest or count.

The generated `current-checks.json` contains `checks_hash`, `checks_count`, and
`generated_at`; `current-checks-hash.txt` contains the same digest. These files
are the staleness contract. Individual check metadata remains owned by the
validator and catalog projection.

### 4. Commit to Catalog Branch

The [hash update workflow](../../reference/workflows.md#update-checks-hashyml)
invokes that script to commit `current-checks.json` and `current-checks-hash.txt`
together on `catalog`. See [Deployment](../../../docs/README.md#deployment) for
concurrent-write recovery.

**Note**: The UI primarily fetches `current-checks.json` and extracts the `checks_hash` field from it, rather than reading `current-checks-hash.txt` separately.

**Atomic Update**:

- Both files updated in single commit
- Ensures hash and metadata always in sync

### 5. UI Fetches Current Hash

**Implementation**: [`docs/src/api/registry.ts`](../../../docs/src/api/registry.ts)

The registry API owns loading the current hash and service registry. See
[Validate and calculate the checks hash](#23-validate-and-calculate-the-checks-hash)
for the published summary contract; it is not a source of individual check definitions.

**Caching**:

- Current hash fetched on page load with cache-busting timestamp
- Registry re-fetched on user action
- Staleness recalculated on each render

### 6a. Service Up to Date

**Condition**: `service.checks_hash === current_checks_hash`

**UI Display**:

- ✅ Green checkmark or no indicator
- Normal row styling
- Last run timestamp shown
- Score considered current

**Meaning**:

- Service scored with latest check suite
- Results reflect current quality standards
- No action needed

### 6b. Service Stale

**Condition**: `service.checks_hash !== current_checks_hash`

**UI Display**:

- ⚠️ Warning icon
- Highlighted/distinct row background
- Tooltip: "Scored with older check suite - re-run recommended"
- "Update" button enabled
- Added to bulk re-run list

**Causes**:

- Checks modified after service's last run
- New checks added (service scored without them)
- Check weights changed (affects score calculation)
- Checks removed (service has obsolete data)

**Example**:

```
Service: myorg/myservice
Last run: 2024-01-10 (hash: abc123...)
Current hash: xyz789...
Status: STALE (5 days old, 3 checks modified)
```

### 7. Trigger Re-scoring

**Option A: Single Service**

**UI Element**: "Update" button on service row

**Action**:

```javascript
async function triggerSingleService(repo) {
  await github.api.dispatch({
    workflow: 'trigger-service-workflow.yml',
    inputs: {
      services: repo,
    },
  });
}
```

**Option B: Bulk Re-run**

**UI Element**: "Re-run All Stale" button (appears when stale services exist)

**Action**:

```javascript
async function triggerBulkStale() {
  const staleServices = services
    .filter((s) => s.is_stale)
    .map((s) => s.repo)
    .join(',');

  await github.api.dispatch({
    workflow: 'trigger-service-workflow.yml',
    inputs: {
      services: staleServices,
      bulk: true,
    },
  });
}
```

**Requirements**:

- GitHub PAT configured in settings
- `workflow` scope permission
- Write access to scorecards repository

### 8. Service Re-scored

**Execution**:

- Service scorecard workflow runs
- Uses current (latest) check suite
- Calculates new score with new checks/weights

**Registry Update**:

```json
{
  "repo": "myorg/myservice",
  "score": 88,
  "last_run": "2024-01-15T11:00:00Z",
  "checks_hash": "xyz789...", // ← Updated to current
  "previous_score": 85,
  "score_change": +3
}
```

**Result**:

- `checks_hash` now matches `current_checks_hash`
- Service no longer flagged as stale
- New score reflects latest quality standards
- UI updates automatically on next load/refresh

## Staleness Scenarios

### Scenario 1: New Check Added

**Timeline**:

1. Day 1: Service scores 85% with 10 checks (hash: abc123)
2. Day 5: New check 11 added (hash changes to: xyz789)
3. Day 5: Service flagged stale (scored without check 11)
4. Day 7: Service re-runs, scores 82% with 11 checks
5. Day 7: No longer stale

**Impact**: Score may go up or down depending on if service passes new check

### Scenario 2: Check Weight Changed

**Timeline**:

1. Day 1: Service scores 80% (hash: abc123)
2. Day 3: Check weights rebalanced (hash: def456)
3. Day 3: Service flagged stale (calculated with old weights)
4. Day 4: Service re-runs, scores 78% (different weighting)
5. Day 4: No longer stale

**Impact**: Same pass/fail results, different score due to weighting

### Scenario 3: Check Logic Fixed

**Timeline**:

1. Day 1: Service scores 90%, passing all checks (hash: abc123)
2. Day 2: Bug found in check 05 (was passing when should fail)
3. Day 2: Check 05 logic fixed (hash: def456)
4. Day 2: Service flagged stale
5. Day 3: Service re-runs, scores 85% (now correctly fails check 05)
6. Day 3: No longer stale

**Impact**: Reveals previously undetected issues

## Related Documentation

- [Scoring Flow](scoring-flow.md) - How scoring works
- [Catalog UI](../catalog-ui.md) - UI staleness indicators
- [Architecture Overview](../overview.md) - System architecture
