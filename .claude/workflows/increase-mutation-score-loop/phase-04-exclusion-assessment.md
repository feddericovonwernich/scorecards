---
phase_metadata:
  execution_mode: sequential

  inputs:
    files:
      - name: ITERATION_RESULTS
        required: true
        path: "$RUN_DIR/iteration-$CURRENT_ITERATION-results.md"
        description: "Results from Phase 03"
      - name: ITERATION_ANALYSIS
        required: true
        path: "$RUN_DIR/iteration-$CURRENT_ITERATION-analysis.md"
        description: "Analysis from Phase 01"

    parameters:
      - name: CURRENT_ITERATION
        required: true
        description: "Current iteration number"
        type: integer
      - name: NEW_SCORE
        required: true
        description: "Current mutation score"
        type: number
      - name: NEW_SURVIVORS
        required: true
        description: "Current survivor count"
        type: integer
      - name: IMPROVEMENT_DELTA
        required: true
        description: "Improvement this iteration"
        type: number
      - name: EFFECTIVE_TARGET_SCORE
        required: true
        description: "Target mutation score"
        type: number
      - name: OUTPUT_DIR
        required: true
        description: "Output directory"
        type: directory
      - name: RUN_DIR
        required: true
        description: "Timestamped run directory from Phase 00"
        type: string
      - name: MUTATION_TOOL
        required: false
        default: "poodle"
        description: "Mutation testing tool being used"
        type: string
      - name: CONFIG_FILE
        required: false
        default: ".claude/rules/testing-workflows-config.md"
        description: "Project testing workflows config file"
        type: file

  outputs:
    files:
      - path: "$RUN_DIR/iteration-$CURRENT_ITERATION-exclusions.md"
        description: "Exclusion assessment for this iteration"
      - path: "$RUN_DIR/tool-config-recommendations.md"
        description: "Recommended mutation tool config updates"

    parameters:
      - name: HIGH_VALUE_REMAINING
        description: "High-value survivors still to address"
        type: integer
      - name: LOW_VALUE_REMAINING
        description: "Low-value survivors (acceptable)"
        type: integer
      - name: EXCLUDE_RECOMMENDED
        description: "Mutations recommended for skip_mutators"
        type: integer
      - name: PROJECTED_SCORE
        description: "Projected score after exclusions"
        type: number
      - name: RECOMMENDED_EXCLUSIONS
        description: "JSON array of skip_mutators to add"
        type: string
---

# Phase 04: Exclusion Assessment

**Purpose**: Re-categorize remaining survivors and update exclusion recommendations based on current state

**Loop Phase**: This phase is part of the iteration loop (phases 01-05). After assessment, Phase 05 will decide whether to continue looping.

## Prerequisites

- Phase 03 completed (improvement verified)
- Current mutation score available
- Remaining survivors known

## Tasks for Todo List

When starting this phase, add these tasks:

1. Reading current iteration results
2. Extracting remaining survivor details
3. Re-categorizing survivors by value
4. Calculating projected score with exclusions
5. Generating exclusion recommendations (tool-specific)
6. Updating mutation tool config recommendations

## Parameters Used

### Input Parameters
- **CURRENT_ITERATION**: Iteration number
- **NEW_SCORE**: Current mutation score
- **NEW_SURVIVORS**: Current survivor count
- **IMPROVEMENT_DELTA**: This iteration's improvement
- **EFFECTIVE_TARGET_SCORE**: Target score
- **OUTPUT_DIR**: Output directory
- **RUN_DIR**: Timestamped run directory from Phase 00
- **MUTATION_TOOL**: Mutation testing tool being used
- **CONFIG_FILE**: Project testing workflows config file

### Output Parameters
- **HIGH_VALUE_REMAINING**: High-value survivors left
- **LOW_VALUE_REMAINING**: Low-value survivors
- **EXCLUDE_RECOMMENDED**: Exclusion count
- **PROJECTED_SCORE**: Score after exclusions
- **RECOMMENDED_EXCLUSIONS**: JSON skip_mutators list

## Process

### Step 1: Extract Current Survivors

Get details of all remaining survivors from mutation testing tool.

**Tool-specific survivor extraction** (same approach as Phase 01):

```bash
# Poodle
python -m poodle --report-survivors

# mutmut
mutmut show

# Stryker
# Check reports/mutation/mutation.json for "survived" mutations

# gremlins
gremlins unleash --report

# cargo-mutants
cargo mutants --list
```

**For each survivor, capture**:
- Line number
- Mutation type
- Original → Mutated code
- Function/block context

### Step 2: Re-categorize Survivors

Apply categorization rules to remaining survivors:

**Changes from previous iterations**:
- Some MEDIUM VALUE may become HIGH VALUE as easier targets are killed
- Previously HIGH VALUE that couldn't be killed may need reassessment
- New exclusion opportunities may emerge

#### Category: EXCLUDE (config-based exclusions)

**Standard exclusion rules** (tool-agnostic patterns):

| Mutation Type | Rationale | Validated By | Tool Names |
|--------------|-----------|--------------|------------|
| String literals | Logging, no functional impact | 89.9% success | String (Poodle), StringLiteral (Stryker) |
| Logging calls | Logger calls, no business impact | Project pattern | FuncCall (Poodle), LogStatement (Stryker) |
| Type artifacts | `None`→`""`, type system noise | Minimal ROI | Keyword (Poodle), ConditionalExpression (mutmut) |

**Exclusion mapping by tool**:

| Generic Category | Poodle | mutmut | Stryker | gremlins | cargo-mutants |
|-----------------|--------|--------|---------|----------|---------------|
| String literals | String | - | StringLiteral | string | - |
| Logging calls | FuncCall | - | LogStatement | logging | - |
| Type artifacts | Keyword | ConditionalExpression | ConditionalExpression | - | - |

**Count by type**:
```
String/StringLiteral: N mutations
FuncCall/LogStatement: M mutations
Keyword/ConditionalExpression: K mutations
─────────────────────────────────
Total EXCLUDE: X mutations
```

#### Category: LOW VALUE (accept)

**Acceptable survivors**:

1. **Defensive fallbacks**: `result or 0` patterns
2. **Error recovery**: Exception handling paths
3. **Constraint handling**: Integrity violation detection
4. **Unrealistic mutations**: Dead code paths

**Document each with rationale**:
```markdown
- Line 45: `count = result.scalar() or 0` → `or 1`
  Rationale: Database COUNT never returns None, defensive code

- Line 89: `raise IntegrityError(...)` → different message
  Rationale: Error message text, not functional behavior
```

#### Category: HIGH VALUE (must fix)

**Remaining critical mutants**:

1. **Comparison operators** that affect business logic
2. **Arithmetic operators** in calculations
3. **Boolean logic** in decision paths
4. **State mutations** (`+=`, `-=`)

**These indicate test quality gaps that should be addressed**

### Step 3: Calculate Projected Score

Estimate score after applying exclusions:

```python
# Current state
total_mutations = <from Poodle>
current_killed = total_mutations - NEW_SURVIVORS
current_score = (current_killed / total_mutations) * 100

# Projected state (after exclusions)
excluded_mutations = EXCLUDE_RECOMMENDED  # String + FuncCall + Keyword
adjusted_total = total_mutations - excluded_mutations
adjusted_killed = current_killed  # Killed count stays same
projected_score = (adjusted_killed / adjusted_total) * 100 if adjusted_total > 0 else 100

# Score improvement from exclusions
exclusion_improvement = projected_score - current_score
```

**Example**:
```
Current: 124 killed / 138 total = 89.9%
After exclusions (42 excluded):
  124 killed / 96 total = 129.2% → capped at 100%

Actually: (124 - low_value_in_excluded) / (138 - 42) = projected
```

### Step 4: Generate Exclusion Recommendations

Create tiered recommendations using tool-specific syntax.

## Exclusion Syntax by Tool

| Tool | Exclusion Method | Example | Config File |
|------|------------------|---------|-------------|
| **Poodle** | `skip_mutators` in config + inline `# nomut:` | `skip_mutators = ["String"]` | `poodle.toml` |
| **mutmut** | Inline `# pragma: no mutate` comments | `result = compute()  # pragma: no mutate` | `setup.cfg` |
| **Stryker** | `excludedMutations` in config | `excludedMutations: ['StringLiteral']` | `stryker.config.js` |
| **gremlins** | Config file exclusions | `exclude: ['logging']` | `.gremlins.yml` |
| **cargo-mutants** | `--exclude` flag or config | `--exclude "tests/*"` | `mutants.toml` |

## Tiered Recommendation Options

**Option A: Conservative (No Change)**

**Poodle** (`poodle.toml`):
```toml
skip_mutators = []
```

**Stryker** (`stryker.config.js`):
```javascript
module.exports = {
  excludedMutations: [],
}
```

**gremlins** (`.gremlins.yml`):
```yaml
exclude: []
```

- Impact: No change
- Score: $NEW_SCORE%
- Pros: Maximum rigor
- Cons: May include low-value noise

---

**Option B: Moderate (Type System Only)**

**Poodle** (`poodle.toml`):
```toml
skip_mutators = ["Keyword"]
```

**Stryker** (`stryker.config.js`):
```javascript
module.exports = {
  excludedMutations: ['ConditionalExpression'],
}
```

**mutmut**: Use inline comments for type artifacts
```python
result = value or default  # pragma: no mutate
```

- Impact: Exclude N type artifact mutations
- Projected Score: ~X%
- Pros: Removes type system noise
- Cons: Some valid patterns excluded

---

**Option C: Aggressive (Recommended)**

**Poodle** (`poodle.toml`):
```toml
skip_mutators = ["String", "FuncCall", "Keyword"]
```

**Stryker** (`stryker.config.js`):
```javascript
module.exports = {
  excludedMutations: ['StringLiteral', 'LogStatement', 'ConditionalExpression'],
}
```

**gremlins** (`.gremlins.yml`):
```yaml
exclude:
  - 'logging'
  - 'string'
```

**cargo-mutants**:
```bash
cargo mutants --exclude "logging.rs" --exclude "debug.rs"
```

- Impact: Exclude M mutations total
- Projected Score: ~Y%
- Pros: Focus on business logic, proven approach (89.9% validated)
- Cons: May miss some logging-adjacent bugs

---

**Option D: Custom (If Needed)**

**Poodle**:
```toml
skip_mutators = ["String", "Keyword"]  # Keep FuncCall
```

**Stryker**:
```javascript
module.exports = {
  excludedMutations: ['StringLiteral'],  // Keep LogStatement
}
```

- For specific project needs
- Customize based on survivor analysis

### Step 5: Generate Exclusion Assessment Report

Create detailed exclusion report.

**Report Structure** (`$RUN_DIR/iteration-$CURRENT_ITERATION-exclusions.md`):

```markdown
# Iteration $CURRENT_ITERATION - Exclusion Assessment

**Date**: <timestamp>
**Current Score**: $NEW_SCORE%
**Survivors**: $NEW_SURVIVORS

## Summary

| Category | Count | Recommendation |
|----------|-------|----------------|
| **HIGH VALUE** | $HIGH_VALUE_REMAINING | Continue testing |
| MEDIUM VALUE | <count> | Optional |
| **LOW VALUE** | $LOW_VALUE_REMAINING | Accept |
| **EXCLUDE** | $EXCLUDE_RECOMMENDED | Add to skip_mutators |

## Score Projection

| Configuration | Excluded | Projected Score |
|--------------|----------|-----------------|
| Current | 0 | $NEW_SCORE% |
| Option B (Keyword) | N | ~X% |
| **Option C (Aggressive)** | M | **~$PROJECTED_SCORE%** |

## HIGH VALUE Survivors (Must Address)

<if HIGH_VALUE_REMAINING > 0>
⚠ **$HIGH_VALUE_REMAINING high-value survivors remain**

<for each high-value survivor>
### Survivor: Line $LINE

**Type**: $TYPE
**Code**: `$ORIGINAL` → `$MUTATED`
**Why High Value**: <explanation>
**Test Strategy**: <approach>
</for each>
</if>

<if HIGH_VALUE_REMAINING == 0>
✅ **No high-value survivors remain!**

All remaining mutants are:
- Low-value (acceptable with documentation)
- Excludable (no business logic impact)
</if>

## LOW VALUE Survivors (Accept)

| Line | Type | Code | Rationale |
|------|------|------|-----------|
| 45 | BinOp | `or 0` → `or 1` | Defensive fallback |
| ... | ... | ... | ... |

## EXCLUDE Recommendations

### String Mutations (N)
Lines: <list>
Rationale: Logging messages only

### Keyword Mutations (K)
Lines: <list>
Rationale: Type system artifacts

### FuncCall Mutations (M)
Lines: <list>
Rationale: Logger function calls

## Recommended Configuration

See `tool-config-recommendations.md` for implementation details.

**Quick Action** (tool-specific):

**Poodle** (`poodle.toml`):
```toml
skip_mutators = ["String", "FuncCall", "Keyword"]
```

**Stryker** (`stryker.config.js`):
```javascript
module.exports = {
  excludedMutations: ['StringLiteral', 'LogStatement', 'ConditionalExpression'],
}
```

**mutmut**: Use inline comments
```python
# pragma: no mutate (on relevant lines)
```

**gremlins** (`.gremlins.yml`):
```yaml
exclude:
  - 'logging'
  - 'string'
```

**cargo-mutants**: Use CLI flags
```bash
cargo mutants --exclude "logging.rs"
```
```

### Step 6: Update Mutation Tool Config Recommendations

Update the tool-specific configuration recommendations file.

**Report Structure** (`$RUN_DIR/tool-config-recommendations.md`):

```markdown
# Mutation Tool Configuration Recommendations

**Generated**: <timestamp>
**Iteration**: $CURRENT_ITERATION
**Tool**: $MUTATION_TOOL

## Current Configuration

<Show current config from tool's config file>

## Recommendations

### Option A: Conservative
<No exclusions - tool-specific syntax>
**Score**: $NEW_SCORE%

### Option B: Moderate
<Type artifacts only - tool-specific syntax>
**Projected Score**: ~X%
**Mutations Excluded**: N

### Option C: Aggressive (Recommended) ⭐
<String + Logging + Type artifacts - tool-specific syntax>
**Projected Score**: ~$PROJECTED_SCORE%
**Mutations Excluded**: $EXCLUDE_RECOMMENDED

**Rationale**:
- String literals: Logging messages only (no functional impact)
- Logging calls: Logger calls (observability, not behavior)
- Type artifacts: `None`→`""`, minimal ROI

**Validated**: 89.9% mutation score achieved with similar config on Python/Poodle

## Tool-Specific Implementation

### Poodle (`poodle.toml`)

```bash
# Backup current config
cp poodle.toml poodle.toml.backup

# Update skip_mutators
cat >> poodle.toml <<EOF
skip_mutators = ["String", "FuncCall", "Keyword"]
EOF

# Re-run
python -m poodle
```

### Stryker (`stryker.config.js`)

```bash
# Backup
cp stryker.config.js stryker.config.js.backup

# Edit excludedMutations array
# Add: 'StringLiteral', 'LogStatement', 'ConditionalExpression'

# Re-run
npx stryker run
```

### mutmut (inline comments)

```bash
# Add inline comments to source files
# Example: result = compute()  # pragma: no mutate

# Re-run
mutmut run
```

### gremlins (`.gremlins.yml`)

```bash
# Backup
cp .gremlins.yml .gremlins.yml.backup

# Edit exclude list
cat >> .gremlins.yml <<EOF
exclude:
  - 'logging'
  - 'string'
EOF

# Re-run
gremlins unleash
```

### cargo-mutants (CLI flags or `mutants.toml`)

```bash
# Option 1: CLI flags
cargo mutants --exclude "logging.rs" --exclude "debug.rs"

# Option 2: Config file
cat >> mutants.toml <<EOF
[[exclude]]
path = "src/logging.rs"
[[exclude]]
path = "src/debug.rs"
EOF

cargo mutants
```

## Post-Exclusion Actions

After applying exclusions:
1. Re-run mutation testing tool to verify projected score
2. If score < target: Focus on HIGH VALUE survivors
3. If score >= target: Document LOW VALUE survivors as accepted
```

## Outputs

### Files Created
1. **$RUN_DIR/iteration-$CURRENT_ITERATION-exclusions.md**: Exclusion assessment
2. **$RUN_DIR/tool-config-recommendations.md**: Mutation tool config recommendations (tool-specific)

### Parameters Exported
- `HIGH_VALUE_REMAINING`: High-value survivors to address
- `LOW_VALUE_REMAINING`: Acceptable low-value survivors
- `EXCLUDE_RECOMMENDED`: Mutations to exclude
- `PROJECTED_SCORE`: Projected score after exclusions
- `RECOMMENDED_EXCLUSIONS`: JSON array of skip_mutators

## Success Criteria

- [ ] Current survivors extracted (tool-specific)
- [ ] Survivors re-categorized by value
- [ ] Projected score calculated
- [ ] Exclusion recommendations generated (tool-specific syntax)
- [ ] Mutation tool config recommendations updated
- [ ] Output parameters exported

## Error Handling

### No Survivors
```
If NEW_SURVIVORS == 0:
  Set HIGH_VALUE_REMAINING = 0
  Set LOW_VALUE_REMAINING = 0
  Set EXCLUDE_RECOMMENDED = 0
  Set PROJECTED_SCORE = 100
  Log: "Perfect score achieved!"
```

### All High Value
```
If HIGH_VALUE_REMAINING == NEW_SURVIVORS:
  Warning: All remaining mutants are high-value
  Recommendation: Review categorization criteria
  May indicate tests need significant improvement
```

### Projected Score Exceeds 100%
```
Cap PROJECTED_SCORE at 100%
Note: This happens when exclusions exceed remaining survivors
```

## Notes

**Exclusion Philosophy**:
- Exclude noise (logging, type artifacts)
- Keep business logic mutations
- Document acceptable survivors
- Balance rigor vs. practicality

**When to Apply Exclusions**:
- After reaching diminishing returns (<2 pp improvement)
- When remaining high-value is 0
- When target is achievable with exclusions

**Validation Source**:
- Exclusion rules validated by session/manager.py success (Python/Poodle)
- 89.9% score achieved with String+FuncCall+Keyword exclusions (Poodle)
- 242 mutations excluded, 138 remained
- Similar patterns apply to other tools (StringLiteral, LogStatement, etc.)
