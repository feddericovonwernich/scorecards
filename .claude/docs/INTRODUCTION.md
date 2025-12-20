# Workflow Orchestration System: Introduction

## Executive Summary

The Workflow Orchestration System is a sophisticated framework for transforming high-level requirements into executable, multi-phase workflows. It combines AI-powered workflow generation with agent-based isolated execution to ensure reliable, traceable, and maintainable automation of complex technical processes.

**Key Capabilities:**
- **Intelligent Workflow Generation**: Automatically creates structured workflows from specifications, requirements, or documentation
- **Agent-Based Execution**: Each phase runs in an isolated agent context with explicit inputs/outputs
- **Full Traceability**: Complete audit trail of decisions, parameters, and outputs
- **Specification Compliance**: Built-in validation against architectural principles
- **Progressive Enhancement**: Workflows evolve from simple to complex through iterative refinement

## System Overview

### The Three-Command Architecture

The system operates through three primary commands:

1. **`create-workflow`**: Generates complete workflow structures from input files
   - Analyzes requirements, specifications, code, and documentation
   - Identifies work type and appropriate phases
   - Creates all necessary configuration and phase files
   - Outputs to `.claude/workflows/<workflow-name>/`

2. **`run-workflow`**: Executes multi-phase workflows with orchestrated agent isolation
   - Discovers and validates phase files
   - Resolves parameters and dependencies
   - Executes each phase via isolated agents
   - Manages context flow between phases
   - Provides progress tracking and error handling

3. **`validate-workflow`**: Validates workflow structure and metadata
   - Checks directory structure and file naming conventions
   - Validates metadata completeness in workflow.yaml and phase files
   - Verifies parameter flow between phases
   - Ensures documentation alignment with implementation

### Core Philosophy

The system embodies several key principles:

- **Separation of Concerns**: Workflow generation is separate from execution
- **Explicit Contracts**: Each phase declares inputs, outputs, and parameters
- **Isolation by Default**: Phases cannot access undeclared context
- **Progressive Disclosure**: Complex workflows built from simple, composable phases
- **Fail-Safe Design**: Clear error handling and recovery procedures

## Core Concepts

### Workflows

A **workflow** is a collection of ordered phases that accomplish a complex objective. Each workflow contains:

```
workflow-directory/
├── workflow.yaml           # Metadata and parameter definitions
├── README.md              # Human-readable documentation
├── phase-00-*.md          # Optional setup/discovery phase
├── phase-01-*.md          # First execution phase
├── phase-02-*.md          # Subsequent phases
└── examples/
    └── parameters.yaml    # Example parameter sets
```

#### Examples Directory

The `examples/` directory contains sample parameter files for running the workflow:

**examples/parameters.yaml**:
```yaml
# Example parameters for development environment
ENVIRONMENT: "development"
OUTPUT_DIR: "./outputs/dev"
BACKUP_ENABLED: false
MAX_RETRIES: 3

# Example parameters for production environment (commented)
# ENVIRONMENT: "production"
# OUTPUT_DIR: "./outputs/prod"
# BACKUP_ENABLED: true
# MAX_RETRIES: 5
```

**Purpose**:
- Provides ready-to-use parameter configurations
- Documents expected parameter values and formats
- Enables quick testing without manual parameter entry
- Serves as documentation for workflow users

**Usage**:
```bash
# Run workflow with explicit parameters
run-workflow .claude/workflows/my-workflow --ENVIRONMENT=production --OUTPUT_DIR=./outputs

# Note: Direct parameter file loading (--params) is planned for a future release
```

### Phases

A **phase** is an atomic unit of work with:
- **Clear Objective**: Single, well-defined goal
- **Explicit Dependencies**: Declared inputs and prerequisites
- **Isolated Execution**: Runs in clean agent context
- **Measurable Outputs**: Files, parameters, or state changes
- **Success Criteria**: Verifiable completion conditions

### Phase Metadata

Each phase file contains a metadata section defining its contract:

```yaml
---
phase_metadata:
  inputs:
    files:
      - name: FEATURE_SPEC
        required: true
        description: "Source specification"
    parameters:
      - name: OUTPUT_DIR
        required: true
        description: "Where to store results"
  outputs:
    files:
      - path: "$OUTPUT_DIR/report.md"
        description: "Analysis report"
    parameters:
      - name: DECISION_MADE
        description: "Key decision from this phase"
        type: string
---
```

### Agents

**Agents** are isolated execution contexts that:
- Receive explicit instructions and context
- Have no access to conversation history
- Cannot see undeclared files or parameters
- Return structured results to the orchestrator
- Enable parallel execution (when dependencies allow)

#### Critical Agent Execution Constraints

Agents CANNOT invoke other agents. This is a fundamental architectural constraint ensuring system stability, predictable execution, and debuggability.

**Key Points:**
- Agents executed via Task tool do NOT have Task tool access themselves
- No nested agent execution is possible
- Complex work requiring multiple approaches must be designed as sequential phases

See [SPECIFICATION.md](SPECIFICATION.md#agent-constraints) for complete details and rationale.

#### Parallel Agent Execution

Parallel agent execution can happen in two contexts:

**1. From Main Claude Session:**
The main Claude session can invoke multiple agents in parallel by using multiple Task tool calls in a single response:

```python
# Main Claude can launch multiple agents simultaneously
Task(subagent_type="workflow-creator", prompt="Generate workflow from spec A...")
Task(subagent_type="workflow-creator", prompt="Generate workflow from spec B...")
Task(subagent_type="workflow-validator", prompt="Validate workflow C...")
# All three agents run in parallel
```

This is useful when you have independent tasks that can be processed simultaneously.

**2. From Workflow Orchestrator:**
The workflow orchestrator can launch multiple agents in parallel for a single phase. This enables efficient processing of multiple similar items:

**How Parallel Execution Works:**
1. Phase declares `execution_mode: parallel` in metadata
2. Orchestrator discovers work items using the specified pattern
3. Orchestrator launches multiple agents simultaneously (one per work item)
4. Each agent processes its assigned item independently
5. Orchestrator aggregates results when all agents complete

**Example Use Cases:**
- Transform multiple feature files into specifications
- Deploy to multiple regions simultaneously
- Run tests across multiple modules in parallel
- Process multiple data files concurrently

This maintains the constraint that agents cannot invoke other agents, while enabling parallelism at the orchestrator level.

### Parameters

**Parameters** flow through workflows via:
- **workflow.yaml**: Defines required and optional parameters
- **Command-line**: Runtime values provided by user
- **Phase outputs**: Parameters generated during execution
- **Discovery phases**: Special phase-00 for parameter resolution
- **Defaults**: Fallback values for optional parameters

## System Architecture

### Component Interaction Flow

```
User Request
    ↓
[create-workflow command]
    ↓
workflow-creator agent
    ├── Analyzes input files
    ├── Identifies workflow type
    ├── Plans phase breakdown
    └── Generates workflow structure
        ↓
Workflow Directory Created
    ↓
[run-workflow command]
    ↓
Workflow Orchestrator
    ├── Discovers phases
    ├── Resolves parameters
    └── For each phase:
        ├── Builds context
        ├── Launches phase-executor agent
        ├── Collects outputs
        └── Updates parameters
            ↓
Workflow Complete
```

### Execution Model

1. **Discovery**: Orchestrator finds and validates all phase files
2. **Parameter Resolution**: Combines defaults, CLI args, and discovered values
3. **Phase Loop**: For each phase in sequence:
   - Mark as in_progress
   - Build agent prompt with resolved context
   - Execute via Task tool with phase-executor agent
   - Validate outputs against success criteria
   - Extract new parameters for next phases
   - Mark as completed
4. **Completion**: Generate summary and logs

### Isolation Boundaries

Each phase agent receives only:
- Listed input files (with explicit read instructions)
- Resolved parameter values
- Phase instructions from the phase file
- Expected output specifications

The agent cannot:
- Access conversation history
- See other phase outputs (unless explicitly passed)
- Modify files outside declared outputs
- Access undefined parameters

## Workflow Types

The system supports various workflow patterns:

### Development Workflows
- **Technical Planning**: Specification → Research → Design → Validation
- **Implementation**: Design → Code → Test → Deploy
- **Feature Development**: Requirements → Implementation → Testing → Documentation

### Operations Workflows
- **Deployment**: Prepare → Backup → Deploy → Validate → Monitor
- **Migration**: Analyze → Backup → Transform → Migrate → Verify
- **Maintenance**: Audit → Update → Test → Deploy → Cleanup

### Quality Workflows
- **Testing**: Setup → Unit → Integration → E2E → Performance → Report
- **Validation**: Prepare → Execute → Analyze → Report → Remediate
- **Compliance**: Scan → Analyze → Report → Fix → Verify

### Data Workflows
- **ETL Processing**: Extract → Validate → Transform → Load → Verify
- **Analysis**: Collect → Clean → Analyze → Visualize → Report
- **Backup**: Prepare → Execute → Verify → Archive → Cleanup

## Key Components

### workflow.yaml

Defines workflow metadata and configuration:

```yaml
name: workflow-name
description: "What this workflow accomplishes"
version: 1.0.0

parameters:
  - name: ENVIRONMENT
    type: string
    required: true
    description: "Target environment"
    enum: ["dev", "staging", "prod"]
  
  - name: BACKUP
    type: boolean
    required: false
    default: true
    description: "Create backup before changes"

phases:
  require_confirmation: true  # User confirms each phase
  allow_retry: true          # Retry failed phases
  generate_logs: true        # Create execution.log
  stop_on_failure: true      # Halt on phase failure
```

### Phase Files

Standard structure for phase documentation:

```markdown
---
phase_metadata:
  inputs: {...}
  outputs: {...}
---

# Phase [Number]: [Name]

**Purpose**: What this phase accomplishes

## Prerequisites
- Required conditions before execution

## Tasks for Todo List
1. First task to complete
2. Second task to complete

## Parameters Used
- `PARAM_NAME`: How this parameter is used in this phase
- `OTHER_PARAM`: Description of usage

## Process
### Step 1: [Action]
Detailed instructions...

## Outputs
- Generated artifacts

## Success Criteria
- [ ] Measurable completion conditions

## Error Handling
- Recovery procedures
```

### Templates

Pre-built patterns for common scenarios:
- Workflow templates (deployment, testing, migration)
- Phase templates with standard structures
- Output templates (OpenAPI, GraphQL, test plans)
- Documentation templates

### Architectural Principles

Best practices encouraged in workflows:
- Clear separation of concerns
- Explicit dependencies between phases
- Comprehensive error handling
- Measurable success criteria
- Documentation-driven design
- Compliance with SPECIFICATION.md

## Usage Patterns

### Creating a Workflow from Specification

```bash
# Generate workflow from feature specification
create-workflow outputs/specs/feature-spec.md \
  --name feature-implementation

# Generated structure:
.claude/workflows/feature-implementation/
├── workflow.yaml
├── README.md
├── phase-00-research.md
├── phase-01-design.md
├── phase-02-implement.md
├── phase-03-test.md
└── phase-04-validate.md
```

### Executing a Workflow

```bash
# Run with default parameters
run-workflow .claude/workflows/feature-implementation

# Run with custom parameters
run-workflow .claude/workflows/deployment \
  --environment=production \
  --backup=true
```

### Parameter Discovery Pattern

When parameters need runtime discovery, use phase-00:

```markdown
# phase-00-setup.md
## Purpose
Discover runtime parameters through environment analysis

## Process
1. Check available resources
2. Detect configuration
3. Generate parameters.yaml
```

### Progressive Enhancement Pattern

Start simple, add complexity:

1. **Initial**: Basic 2-3 phase workflow
2. **Enhanced**: Add validation phases
3. **Production**: Include monitoring, rollback, logging
4. **Enterprise**: Add compliance, audit, reporting

## Best Practices

### For Workflow Creation

1. **Analyze Thoroughly**: Understand all requirements before generating
2. **Phase Appropriately**: One objective per phase
3. **Document Clearly**: Each phase self-contained
4. **Validate Early**: Include validation in each phase
5. **Plan Recovery**: Every phase needs error handling
6. **No Nested Agents**: Never design phases that attempt to invoke sub-agents
7. **Sequential Design**: Break complex work into multiple phases instead of nesting

### For Workflow Execution

1. **Verify Prerequisites**: Check all requirements before starting
2. **Monitor Progress**: Watch todo list and logs
3. **Handle Failures**: Use retry or recovery procedures
4. **Validate Outputs**: Check success criteria
5. **Document Results**: Save logs and reports

### For Phase Design

1. **Single Responsibility**: One clear objective
2. **Explicit Dependencies**: Declare all inputs
3. **Measurable Success**: Concrete criteria
4. **Atomic Operations**: Can retry without side effects
5. **Clear Documentation**: Self-explanatory instructions

### Design Validation

Before deploying a workflow, verify compliance with the specification.
See [SPECIFICATION.md](SPECIFICATION.md#agent-constraints) for the complete checklist of constraints.

### Common Workflow Patterns

**Research and Decision Making:**
```yaml
phase-01-identify-decisions.md    # List what needs research
phase-02-research-database.md     # Research database options
phase-03-research-auth.md         # Research authentication
phase-04-research-api.md          # Research API patterns
phase-05-compile-adrs.md          # Create decision records
```

**Validation and Testing:**
```yaml
phase-01-prepare-tests.md         # Set up test environment
phase-02-unit-tests.md            # Run unit tests
phase-03-integration-tests.md     # Run integration tests
phase-04-compile-results.md       # Generate test report
```

**Implementation:**
```yaml
phase-01-scaffold.md              # Create project structure
phase-02-implement-core.md        # Core functionality
phase-03-implement-api.md         # API layer
phase-04-implement-ui.md          # User interface
phase-05-integrate.md             # Integration and verification
```

### Parameter Flow Patterns

**Simple Flow:**
```yaml
# Phase 1 declares it will output a parameter
# (actual value discovered at runtime, reported in completion report)
outputs:
  parameters:
    - name: DATABASE_TYPE
      description: "Type of database detected or configured"
      type: string

# Phase 2 declares it needs this parameter
inputs:
  parameters:
    - name: DATABASE_TYPE
      required: true
      description: "Database type from previous phase"
```

**How values flow:**
1. Phase 1 executes and discovers `DATABASE_TYPE = "postgresql"`
2. Phase 1 reports this in its completion report:
   ```yaml
   phase_completion:
     parameters_discovered:
       DATABASE_TYPE: "postgresql"
   ```
3. Orchestrator updates `runtime-parameters.yaml`
4. Phase 2 receives `DATABASE_TYPE` with value "postgresql"

**Discovery Pattern:**
```yaml
# phase-00-discovery.md discovers environment
# Outputs: PROJECT_TYPE, LANGUAGE, FRAMEWORK

# Subsequent phases use discovered values
inputs:
  parameters:
    - name: PROJECT_TYPE
    - name: LANGUAGE
    - name: FRAMEWORK
```

## Integration Points

### With Development Tools

- **Version Control**: Workflows tracked in git
- **CI/CD**: Workflows trigger pipelines
- **Testing**: Phases include test execution
- **Monitoring**: Outputs feed observability

### With AI Agents

- **Orchestrator Control**: The orchestrator invokes agents for each phase
- **No Nested Agents**: Phases cannot invoke other agents (see SPECIFICATION.md#agent-constraints)
- **Tool Access**: Phase executors have access to standard tools (file operations, bash, etc.)
- **Context Management**: Orchestrator manages parameter flow between phases
- **Error Recovery**: Agents report failures via structured completion reports

### With Documentation

- **Auto-generation**: Workflows create documentation
- **Templates**: Consistent output formats
- **Traceability**: Links between requirements and implementation
- **Knowledge Base**: Decisions captured in ADRs

## Troubleshooting

### Common Issues

**"Phase not found"**
- Check file naming: `phase-XX-*.md`
- Verify sequential numbering
- Ensure files are readable

**"Parameter undefined"**
- Check workflow.yaml definitions
- Verify CLI arguments
- Review phase output parameters

**"Phase failed"**
- Check execution.log
- Verify prerequisites met
- Review success criteria
- Try retry option

**"Workflow incomplete"**
- Ensure all phases present
- Check for gaps in numbering
- Verify workflow.yaml exists

**"Agent invocation failed" or "Task tool not available"**
- This indicates a phase is trying to invoke a sub-agent (not supported)
- Review phase content for `claude -p` commands or Task tool references
- Redesign the workflow to use sequential phases instead
- Each phase must complete its work directly without delegating to other agents

### Debugging Techniques

1. **Enable Verbose Logging**: Set `generate_logs: true`
2. **Run Single Phase**: Test phases individually
3. **Check Parameters**: Use `--dry-run` to see resolution
4. **Validate Structure**: Use workflow validator
5. **Review Outputs**: Check each phase's outputs

## Advanced Features

### Conditional Execution

Phases can include conditions:
```yaml
prerequisites:
  - condition: "$ENVIRONMENT == 'production'"
    action: require_approval
```

### Parallel Agent Execution Within Phases

Phases can process multiple items in parallel using specialized agents:
```yaml
phase_metadata:
  execution_mode: parallel
  parallel_config:
    agent_type: feature-specifier  # Specialized agent for the task
    discovery_pattern: "features/FEAT-*.md"  # Find work items
    work_item_parameter: FEATURE_FILE  # Pass to agent
    max_parallel: 5  # Limit concurrent agents
```

Benefits:
- Dramatically reduces execution time for repetitive tasks
- Leverages specialized agents for specific work types
- Maintains isolation between parallel executions
- Aggregates results for next phases

### Loop Execution

Workflows support iterative phase execution through a **hybrid loop system** that combines declarative configuration with dynamic phase control.

**Basic Configuration**:
```yaml
# In workflow.yaml
loops:
  - name: refinement-loop
    description: "Iterative refinement until quality threshold met"
    phases: [2, 3, 4]           # Phases that form the loop body
    max_iterations: 20           # Safety limit (required)
    iterations: 5                # Optional: fixed iteration count
    allow_phase_control: true    # Allow phases to control loop (default)
```

**Loop Control Priority**:
1. **max_iterations** (HIGHEST): Safety limit, cannot be exceeded
2. **Phase override** (LOOP_CONTINUE parameter): Dynamic control
3. **exit_condition** (declarative): Expression-based exit in workflow.yaml
4. **Fixed iterations**: Default behavior
5. **Default exit**: No control mechanism active

**Phase Control Example**:
```yaml
# Phases can discover loop control parameters
phase_completion:
  parameters_discovered:
    CONVERGENCE_DELTA: 0.008
    LOOP_CONTINUE: false          # Exit loop
    LOOP_REASON: "Converged (delta < threshold)"
```

**Use Cases**:

1. **Convergence Testing**: Loop until metric meets threshold
   ```bash
   if [ $(echo "$DELTA < $THRESHOLD" | bc) -eq 1 ]; then
     echo "LOOP_CONTINUE: false"
   else
     echo "LOOP_CONTINUE: true"
   fi
   ```

2. **Quality Gates**: Loop until all tests pass and coverage met
   ```bash
   if [ $TESTS_PASSED -eq $TOTAL_TESTS ] && [ $COVERAGE -ge 90 ]; then
     echo "LOOP_CONTINUE: false"  # Quality achieved
   else
     echo "LOOP_CONTINUE: true"   # Keep refining
   fi
   ```

3. **Fixed Iterations**: Process data in batches
   ```yaml
   iterations: 10  # Run exactly 10 times
   ```

**Automatic Parameters**:
The orchestrator injects loop context parameters:
- `LOOP_INDEX`: Current iteration number (1-based)
- `LOOP_NAME`: Loop identifier
- `LOOP_ITERATION`: Alias for LOOP_INDEX

**Benefits**:
- **Static validation**: Loop structure validated before execution
- **Dynamic control**: Phases decide when convergence is met
- **Safety guaranteed**: max_iterations prevents infinite loops
- **Full traceability**: `loop_state.yaml` tracks iteration history
- **Hybrid flexibility**: Declarative structure + phase override

**State Tracking**:
```yaml
# Generated: loop_state.yaml
loops:
  refinement-loop:
    current_iteration: 3
    total_iterations: 3
    max_iterations: 20
    iteration_history:
      - iteration: 1
        timestamp: "2025-01-15T10:30:00Z"
      - iteration: 2
        timestamp: "2025-01-15T10:35:00Z"
```

**Current Limitations**:
- No nested loops (loops within loops)
- No result aggregation across iterations

**Additional Loop Features**:
- ✅ Declarative exit conditions (expression-based in workflow.yaml)
- ✅ Phase override control (LOOP_CONTINUE parameter)
- ✅ Hybrid approach (combine both mechanisms)

Further enhancements are planned for future releases.

### Concurrent Phase Groups

> **NOT IMPLEMENTED**: This feature is planned for a future release and is not currently available. The syntax below is for illustration only.

Non-dependent phases could theoretically run concurrently:
```yaml
# FUTURE FEATURE - NOT YET SUPPORTED
phase_groups:
  - [phase-02a-api.md, phase-02b-ui.md, phase-02c-db.md]
```

**Current Status**: All phases execute sequentially in numeric order. There is no support for grouping phases to run in parallel.

**What IS supported**: Individual phases can use `execution_mode: parallel` to process multiple work items concurrently within a single phase. See [Parallel Agent Execution](#parallel-agent-execution-within-phases) for details.

### Dynamic Phase Generation

> **NOT IMPLEMENTED**: This feature is planned for a future release and is not currently available. The syntax below is for illustration only.

Workflows could theoretically generate additional phases at runtime:
```yaml
# FUTURE FEATURE - NOT YET SUPPORTED
dynamic_phases:
  enabled: true
  generator: phase-00-analyze.md
```

**Current Status**: All phases must be defined statically in phase files. Dynamic generation is not supported.

### Cross-Workflow Dependencies

> **NOT IMPLEMENTED**: This feature is planned for a future release and is not currently available. The syntax below is for illustration only.

Workflows could theoretically reference outputs from other workflows:
```yaml
# FUTURE FEATURE - NOT YET SUPPORTED
dependencies:
  - workflow: prerequisites
    outputs: [config.yaml, setup.log]
```

**Current Status**: Each workflow operates independently. Cross-workflow dependencies must be managed manually by running workflows in sequence.

## Summary

The Workflow Orchestration System provides:

1. **Intelligent Generation**: AI analyzes requirements and creates structured workflows
2. **Isolated Execution**: Each phase runs in a clean, controlled environment
3. **Clear Contracts**: Explicit inputs, outputs, and success criteria
4. **Full Traceability**: Complete audit trail of all operations
5. **Flexible Architecture**: Adapts to various workflow types and complexities

By combining these capabilities, the system enables:
- **Reliability**: Predictable, repeatable execution
- **Maintainability**: Clear structure and documentation
- **Scalability**: From simple to complex workflows
- **Debuggability**: Isolated phases with clear boundaries
- **Compliance**: Built-in validation and standards enforcement

This architecture ensures that complex technical processes can be automated safely, efficiently, and transparently, while maintaining the flexibility to adapt to changing requirements.

## Quick Reference

### Commands

```bash
# Create a workflow
/create-workflow <input-files...> --name <workflow-name> [--type <workflow-type>]

# Execute a workflow
/run-workflow <workflow-dir> [parameters...]

# Validate a workflow
/validate-workflow <workflow-dir>
```

### File Structure

```
.claude/
├── commands/
│   ├── create-workflow.md
│   ├── run-workflow.md
│   └── validate-workflow.md
├── agents/workflow/
│   ├── workflow-creator.md
│   ├── phase-executor.md
│   └── workflow-validator.md
├── docs/
│   ├── INTRODUCTION.md
│   ├── SPECIFICATION.md
│   └── REFERENCE.md
├── schemas/
│   ├── workflow-schema.yaml
│   └── phase-metadata-schema.yaml
├── templates/
│   └── phase-template.md
└── workflows/
    └── <workflow-name>/
        ├── workflow.yaml
        ├── README.md
        ├── phase-*.md
        ├── examples/
        └── runs/                           # GENERATED: Execution history
            └── wf-YYYYMMDD-HHMMSS-*/       # Per-run metadata (timestamped)
                ├── runtime-parameters.yaml
                ├── execution.log
                └── loop_state.yaml         # If workflow uses loops
```

### Agent Types

- **workflow-creator**: Analyzes input files and generates complete multi-phase workflows
- **phase-executor**: Executes individual workflow phases in isolated context
- **workflow-validator**: Validates workflow structure, metadata, and documentation coherence

### Workflow Types

- `deployment` - Application deployment workflows
- `testing` - Quality assurance workflows
- `migration` - Data/schema migration workflows
- `build` - Build and packaging workflows
- `data-processing` - ETL and analysis workflows
- `requirements-processing` - Requirements analysis and transformation workflows
- `technical-planning` - Technical design and planning workflows
- `setup` - Environment setup and initialization workflows
- `automation` - General automation and orchestration workflows

### Parameter Types

- `string` - Text values
- `boolean` - True/false flags
- `integer` - Whole numbers
- `number` - Decimal/floating-point numbers
- `enum` - Restricted choices
- `file` - File paths
- `directory` - Directory paths
- `array` - Lists of values

This introduction provides the conceptual foundation for understanding and using the Workflow Orchestration System effectively.