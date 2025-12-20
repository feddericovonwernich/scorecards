# Workflow System Quick Reference

## Commands
```bash
# Create a workflow from input files
/create-workflow <input-files...> --name=<workflow-name> [--type=<workflow-type>]

# Execute a workflow
/run-workflow <workflow-dir> [parameters...]

# Validate a workflow (modes specified via natural language in prompt)
/validate-workflow <workflow-dir>
```

## Directory Structure
```
workflow-directory/
├── workflow.yaml              # REQUIRED: Configuration
├── phase-XX-*.md             # REQUIRED: At least 2 phases
├── README.md                  # Recommended: Documentation
├── examples/                  # Optional: Examples
└── runs/                      # GENERATED: Execution history
    └── wf-YYYYMMDD-*/        # Per-run metadata
        ├── runtime-parameters.yaml
        ├── execution.log
        └── loop_state.yaml
```

> **Minimum Phases**: 2 required. Any sequential combination of 2+ phases with no gaps is valid (e.g., `phase-00` + `phase-01`, or `phase-01` + `phase-02`, or `phase-01` + `phase-02` + `phase-03`).

## workflow.yaml Structure
```yaml
name: workflow-name        # Required: kebab-case
description: "Purpose"     # Required: description
version: 1.0.0            # Required: semver

parameters:               # Optional: parameters
  PARAM_NAME:
    type: string         # string|boolean|integer|number|enum|file|directory|array
    required: true       # Is required?
    default: value       # Default value
    description: "..."   # Description

phases:                  # Optional: execution config
  require_confirmation: false
  allow_retry: true
  generate_logs: true
  stop_on_failure: true
  parallel_execution_supported: false  # Set true if workflow has parallel phases
  default_model: sonnet                # Optional: opus|sonnet|haiku (default: sonnet)
```

## Phase Metadata (Recommended at top of each phase file)
```yaml
---
phase_metadata:
  execution_mode: sequential  # or parallel
  model: sonnet              # Optional: opus|sonnet|haiku (overrides workflow default)

  # For parallel execution:
  parallel_config:
    agent_type: feature-specifier
    discovery_pattern: "$OUTPUT_DIR/features/FEAT-*.md"
    work_item_parameter: FEATURE_FILE
    output_pattern: "$OUTPUT_DIR/specs/{name}-spec.md"
    max_parallel: 5
  
  inputs:
    files:
      - name: INPUT_FILE
        required: true
        description: "Input file"
    parameters:
      - name: PARAM_NAME
        required: true
        description: "Parameter"
  
  outputs:
    files:
      - path: "$OUTPUT_DIR/file.md"
        description: "Output file"
    parameters:
      - name: OUTPUT_PARAM
        description: "Output value"
---
```

> **Note**: Phase metadata is strongly recommended for explicit input/output contracts. Phases without metadata will still execute but with implicit parameter passing.

## Phase File Structure
```markdown
---
phase_metadata: {...}
---

# Phase N: Name

**Purpose**: What this phase does

## Prerequisites
- Required conditions

## Tasks for Todo List
1. Task one
2. Task two

## Parameters Used
- `PARAM_NAME`: Description of how this parameter is used
- `OTHER_PARAM`: Description

## Process
### Step 1: Name
Instructions...

## Outputs
- Generated files

## Success Criteria
- [ ] Criteria met

## Error Handling
- Recovery procedures
```

## Parameter Types
| Type | Example | Description |
|------|---------|-------------|
| `string` | `"text"` | Text value |
| `boolean` | `true` | True/false |
| `integer` | `42` | Whole number |
| `number` | `3.14` | Decimal number |
| `enum` | `"prod"` | From list |
| `file` | `"./file"` | File path |
| `directory` | `"./dir"` | Dir path |
| `array` | `["a","b"]` | List of values |

## Parameter Resolution Order
1. CLI arguments (highest)
2. Environment variables (`WORKFLOW_` prefix, e.g., `WORKFLOW_OUTPUT_DIR`)
3. Previous phase outputs (runtime-parameters.yaml)
4. workflow.yaml defaults
5. Phase metadata defaults

## Environment Variables

Parameters can be set via environment variables using the `WORKFLOW_` prefix:

| Parameter | Environment Variable |
|-----------|---------------------|
| `OUTPUT_DIR` | `WORKFLOW_OUTPUT_DIR` |
| `MAX_RETRIES` | `WORKFLOW_MAX_RETRIES` |
| `ENVIRONMENT` | `WORKFLOW_ENVIRONMENT` |

## Execution Modes

### Sequential (Default)
- Single agent per phase
- Processes all work
- Standard execution

### Parallel
- Multiple agents concurrent
- One per work item
- Requires parallel_config

## Model Selection

### Per-Phase
```yaml
phase_metadata:
  model: opus  # opus|sonnet|haiku
```

### Workflow Default
```yaml
phases:
  default_model: sonnet
```

### Resolution Priority
1. Phase `model` (highest)
2. Workflow `default_model`
3. System default (sonnet)

### Model Guide
- **opus**: Complex reasoning, best quality
- **sonnet**: Balanced, recommended default
- **haiku**: Fast, simple tasks

## Task Iteration

### Configuration
```yaml
task_iteration:
  enabled: true
  phase: 4
  task_index_param: TASK_INDEX_PATH
  task_id_param: TASK_ID
  task_dir: "tasks"
  result_dir: "results"
  max_retries_per_task: 2
  stop_on_failure: false
```

### Data Files
- `task-index.json` - Task list and execution order
- `tasks/{id}.json` - Task definitions
- `results/{id}-result.json` - Per-task results
- `task-results.json` - Aggregated results

### Output Parameters
After task iteration completes, these parameters are available:
- `TASKS_COMPLETED` - Count of successfully completed tasks
- `TASKS_FAILED` - Count of failed tasks
- `TASKS_BLOCKED` - Count of blocked tasks

## Agent Types
- `phase-executor` - Default isolated executor for running workflow phases
- `workflow-creator` - Analyzes input files and generates complete workflows
- `workflow-validator` - Validates workflow structure, metadata, and coherence

Note: Custom specialized agents can be created and referenced in `parallel_config.agent_type` for domain-specific work.

## Critical Rules
1. **No Nested Agents**: Agents cannot invoke other agents
2. **Minimum Phases**: At least 2 phase files required
3. **Sequential Numbering**: No gaps allowed (01, 02, 03... not 01, 03)
4. **Parameter Names**: UPPER_SNAKE_CASE
5. **File Names**: `phase-XX-name.md` format (XX = two digits)
6. **Explicit Dependencies**: All inputs should be declared in metadata

## Validation Levels
- **ERROR** ✗ - Blocks execution
- **WARNING** ⚠ - May cause issues
- **INFO** ℹ - Suggestions

## Common Patterns

### Discovery Phase (phase-00)
```yaml
outputs:
  parameters:
    - name: DISCOVERED_VALUE
      description: "Runtime discovery"
```

### Parallel Processing
```yaml
execution_mode: parallel
parallel_config:
  agent_type: processor
  discovery_pattern: "$DIR/*.md"
```

### Conditional Execution
```yaml
prerequisites:
  - condition: "$ENVIRONMENT == 'production'"
    action: require_approval
```

## File References

Paths relative to `.claude/docs/`:
- [Full Specification](SPECIFICATION.md)
- [Introduction](INTRODUCTION.md)
- [Workflow Schema](../schemas/workflow-schema.yaml)
- [Phase Schema](../schemas/phase-metadata-schema.yaml)

From project root, use:
- `.claude/docs/SPECIFICATION.md`
- `.claude/docs/INTRODUCTION.md`
- `.claude/schemas/workflow-schema.yaml`
- `.claude/schemas/phase-metadata-schema.yaml`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Phase not found" | Check naming: phase-XX-*.md |
| "Parameter undefined" | Add to workflow.yaml |
| "Missing metadata" | Add phase_metadata section |
| "Agent failed" | Check phase can't invoke agents |
| "Sequence gap" | Ensure sequential numbering |

## Best Practices
1. Always include phase_metadata
2. Use parameter interpolation: `$PARAM`
3. Document success criteria
4. Include error handling
5. One objective per phase
6. Validate before execution