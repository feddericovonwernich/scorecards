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
│  │  2. Calculate SHA256 hash of entire checks/ directory │ │
│  │     - Sort files deterministically                     │ │
│  │     - Hash all check scripts + metadata                │ │
│  │     - Generate: abc123def456...                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  3. Export check metadata to JSON                      │ │
│  │     {                                                   │ │
│  │       "checks": [                                       │ │
│  │         { "id": "01", "weight": 10, ... },             │ │
│  │         { "id": "02", "weight": 5, ... }               │ │
│  │       ],                                                │ │
│  │       "total_weight": 100,                             │ │
│  │       "hash": "abc123def456..."                        │ │
│  │     }                                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ 4. Commit to catalog branch
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│          Catalog Branch                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  current-checks-hash.txt                               │ │
│  │  abc123def456...                                       │ │
│  │                                                         │ │
│  │  current-checks.json                                   │ │
│  │  { "checks": [...], "hash": "abc123...", ... }         │ │
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
│  │  2. Fetch current-checks-hash.txt                      │ │
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

**Triggers**:
```yaml
on:
  push:
    branches: [main]
    paths:
      - 'checks/**'
```

**When Activated**:
- Any push to main that modifies `checks/` directory
- Adding new checks
- Modifying existing checks
- Changing metadata.json files
- Deleting checks

### 2. Calculate Checks Hash

**Implementation**: `action/utils/update-checks-hash.sh` lines 20-80

**Process**:
```bash
# Find all check files
find checks/ -type f | sort | \
  # Hash contents
  xargs sha256sum | \
  # Hash the hashes
  sha256sum | \
  # Extract hash only
  awk '{print $1}'
```

**Includes**:
- All `check.sh`, `check.py`, `check.js` files
- All `metadata.json` files
- Directory structure (adding/removing checks changes hash)

**Deterministic**:
- Files sorted alphabetically
- Same input always produces same hash
- Independent of execution environment

**Example Hash**:
```
abc123def456789fedcba987654321deadbeef0123456789abcdef0123456789
```

### 3. Export Check Metadata

**Implementation**: `action/utils/update-checks-hash.sh` lines 85-140

**Generated JSON** (`current-checks.json`):
```json
{
  "hash": "abc123def456...",
  "generated_at": "2024-01-15T10:30:00Z",
  "total_weight": 100,
  "checks_count": 15,
  "checks": [
    {
      "id": "01-readme-present",
      "name": "README Present",
      "weight": 10,
      "timeout": 30,
      "category": "documentation",
      "description": "Checks for README.md file"
    },
    {
      "id": "02-ci-present",
      "name": "CI Present",
      "weight": 5,
      "timeout": 30,
      "category": "ci",
      "description": "Checks for CI configuration"
    }
  ]
}
```

**Purpose**:
- UI can display check details
- Shows what changed between hash versions
- Helps users understand scoring breakdown

### 4. Commit to Catalog Branch

**Implementation**: `update-checks-hash.yml` lines 30-45

**Files Written**:
1. `current-checks-hash.txt` - Single line with hash
2. `current-checks.json` - Full check metadata

**Git Operations**:
```bash
git checkout catalog
echo "$HASH" > current-checks-hash.txt
cat > current-checks.json <<EOF
{...}
EOF
git add current-checks-hash.txt current-checks.json
git commit -m "Update checks hash to $HASH"
git push
```

**Atomic Update**:
- Both files updated in single commit
- Ensures hash and metadata always in sync

### 5. UI Fetches Current Hash

**Implementation**: `docs/modules/api.js` or similar

**On Page Load**:
```javascript
// Fetch current hash
const response = await fetch('current-checks-hash.txt');
const currentHash = (await response.text()).trim();

// Fetch service registry
const services = await fetch('registry/all-services.json').then(r => r.json());

// Compare hashes
services.forEach(service => {
  service.is_stale = service.checks_hash !== currentHash;
});
```

**Caching**:
- Current hash cached for page session
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
      services: repo
    }
  });
}
```

**Option B: Bulk Re-run**

**UI Element**: "Re-run All Stale" button (appears when stale services exist)

**Action**:
```javascript
async function triggerBulkStale() {
  const staleServices = services
    .filter(s => s.is_stale)
    .map(s => s.repo)
    .join(',');

  await github.api.dispatch({
    workflow: 'trigger-service-workflow.yml',
    inputs: {
      services: staleServices,
      bulk: true
    }
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
  "checks_hash": "xyz789...",  // ← Updated to current
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

## Performance

**Hash Calculation**: <1 second (hash is fast)

**UI Staleness Check**: Instant (simple string comparison)

**Bulk Trigger**: Rate limited to avoid API quota issues

## Best Practices

**For Scorecards Maintainers**:
- Update checks hash automatically on push
- Document check changes in commit messages
- Communicate major check changes to users

**For Service Teams**:
- Monitor staleness indicator in catalog
- Re-run promptly when flagged stale
- Review score changes after re-running
- Investigate score decreases

**For Organizations**:
- Schedule periodic bulk re-runs
- Set policy for maximum staleness age
- Track re-run compliance metrics

## Troubleshooting

**Service Always Stale**:
- Check if service workflow is running
- Verify workflow uses latest action version
- Confirm catalog updates are succeeding

**Hash Never Updates**:
- Check update-checks-hash.yml workflow
- Verify write access to catalog branch
- Review workflow logs for errors

**UI Not Showing Staleness**:
- Clear browser cache
- Check network tab for current-checks-hash.txt fetch
- Verify file exists in catalog branch

## Related Documentation

- [Scoring Flow](scoring-flow.md) - How scoring works
- [Catalog UI](../catalog-ui.md) - UI staleness indicators
- [Architecture Overview](../overview.md) - System architecture
