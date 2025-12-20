---
name: run-workflow
description: "Execute multi-phase workflows from a specified directory"
---

<!-- Updated 2025-12-18: Fixed shell operator documentation to prevent permission errors -->

# Multi-Phase Workflow Runner

Execute complex, multi-phase workflows by automatically discovering and orchestrating phase execution from a workflow directory.

## Overview

This command provides a general-purpose workflow orchestration engine that:
- Discovers phase files from a workflow directory
- Orchestrates phase execution via isolated agents using the Task tool
- Resolves and displays parameters for each phase
- Manages context flow between phases
- Provides clear progress tracking and isolation

## Usage

```bash
run-workflow <WORKFLOW_DIR> [parameters...]
```

**Arguments:**
- `WORKFLOW_DIR`: Path to workflow directory containing workflow phases (required)
- `parameters...`: Additional parameters passed to the workflow (optional)

**Examples:**
```bash
# Run a deployment workflow
run-workflow .claude/workflows/deployment

# Run with custom parameters
run-workflow .claude/workflows/migration --database=prod --backup=true

# Run workflow from absolute path
run-workflow /home/user/project/workflows/testing
```

## Workflow Structure

### Required Files
Each workflow directory must contain:
```
workflow-directory/
├── workflow.yaml           # Workflow metadata and parameter definitions
├── phase-01-*.md          # First phase (required)
└── phase-02-*.md          # Subsequent phases (at least one more)
```

> **Minimum Phases**: A workflow requires at least 2 phase files. Valid configurations:
> - `phase-01-*.md` + `phase-02-*.md` (standard)
> - `phase-00-*.md` + `phase-01-*.md` (with setup phase)

### Optional Files
```
workflow-directory/
├── phase-00-setup.md      # Optional setup/discovery phase
└── runs/                  # Generated execution history
    └── wf-YYYYMMDD-*/     # Timestamped run directory
        ├── runtime-parameters.yaml  # Generated runtime parameters
        ├── execution.log            # Generated execution log
        └── loop_state.yaml          # Generated loop state (if loops exist)
```

### File Naming Convention
- Phase files must start with `phase-` followed by a two-digit number
- Numbers must be sequential (01, 02, 03...)
- Descriptive names after the number (e.g., `phase-01-prepare.md`)
- Setup phase (if present) should be `phase-00-setup.md`

## Workflow Configuration

### workflow.yaml Structure
```yaml
name: deployment-workflow
description: "Deploy application to production environment"
version: 1.0.0

parameters:
  - name: ENVIRONMENT
    type: string
    required: true
    description: "Target deployment environment"

  - name: BACKUP
    type: boolean
    required: false
    default: true
    description: "Create backup before deployment"

  - name: PARALLEL_JOBS
    type: integer
    required: false
    default: 4
    description: "Number of parallel deployment jobs"

phases:
  require_confirmation: true  # Ask for confirmation before each phase
  allow_retry: true           # Allow retrying failed phases
  generate_logs: true         # Create execution.log file
```

## Phase File Structure

Each phase file must follow this structure:

### Standard Phase (Sequential Execution)
```markdown
---
phase_metadata:
  inputs:
    files:
      - name: FEATURE_SPEC
        required: true
        description: "Source specification document"
      - name: VALIDATION_RULES
        required: false
        description: "Validation rules document"
    parameters:
      - name: SPECS_DIR
        required: true
        description: "Output directory"
  outputs:
    files:
      - path: "$SPECS_DIR/research.md"
        description: "Research findings"
      - path: "$SPECS_DIR/adrs/*.md"
        description: "Architecture Decision Records"
    parameters:
      - name: TECHNOLOGY_STACK
        description: "Resolved technology choices"
---
```

### Parallel Phase (Concurrent Agent Execution)
```markdown
---
phase_metadata:
  execution_mode: parallel  # Enables parallel execution
  parallel_config:
    agent_type: feature-specifier  # Agent to use for each work item
    discovery_pattern: "$OUTPUT_DIR/features/FEAT-*.md"  # Find work items
    work_item_parameter: FEATURE_FILE  # Pass work item to agent
    output_pattern: "$OUTPUT_DIR/specs/SPEC-{number}-{name}/feature-spec.md"
    max_parallel: 5  # Max concurrent agents (0 = unlimited)
  inputs:
    parameters:
      - name: OUTPUT_DIR
        required: true
        description: "Base output directory"
  outputs:
    files:
      - path: "$OUTPUT_DIR/specs/SPEC-*/feature-spec.md"
        description: "Generated specifications"
    parameters:
      - name: SPECS_COUNT
        description: "Number of specs generated"
---

# Phase [Number]: [Name]

**Purpose**: Brief description of what this phase accomplishes

## Prerequisites
- List of requirements before this phase can run
- Required parameters: ${PARAM_NAME}
- Required files or resources

## Tasks for Todo List
When starting this phase, add these tasks:
1. First task to complete
2. Second task to complete
3. Third task to complete

## Parameters Used
- `ENVIRONMENT`: Target environment for deployment
- `BACKUP`: Whether to create backup

## Process

### Step 1: [Step Name]
Detailed instructions for this step...

### Step 2: [Step Name]  
Detailed instructions for this step...

## Outputs
- Files or artifacts created by this phase
- Updated configurations
- Generated reports

## Success Criteria
- [ ] Criterion 1 met
- [ ] Criterion 2 met
- [ ] All tests pass

## Error Handling
- Common errors and their resolutions
- Rollback procedures if needed
```

## Execution Flow

### 0. Run Directory Setup

**Create timestamped execution directory:**
```
1. Generate workflow_run_id in format: wf-YYYYMMDD-HHMMSS-<random-6-chars>
   - Use UTC timestamp
   - Random suffix for collision prevention
   - Example: "wf-20250114-143022-a3f9c2"

2. Create runs directory if it doesn't exist:
   mkdir -p <workflow-dir>/runs

3. Create timestamped run directory:
   mkdir -p <workflow-dir>/runs/<workflow_run_id>

4. Set RUN_DIR variable for use throughout execution:
   RUN_DIR="<workflow-dir>/runs/<workflow_run_id>"
```

**Note**: This ensures all runtime files are isolated per execution run.

### 1. Discovery Phase
```
1. Validate WORKFLOW_DIR exists and is readable
2. Load workflow.yaml configuration
3. Discover all phase-*.md files
4. Sort phases by numeric prefix
5. Validate sequential numbering (no gaps)
6. Count total phases
7. Display workflow summary
```

### 2. Parameter Resolution
```
1. Parse workflow.yaml for required parameters
2. Check command-line arguments
3. Check environment variables:
   - Parameters can be set via environment variables with `WORKFLOW_` prefix
   - Example: `WORKFLOW_OUTPUT_DIR` sets the `OUTPUT_DIR` parameter
   - Environment variables take precedence over defaults but not CLI args
4. If phase-00-setup.md exists:
   - Execute setup phase for parameter discovery
   - Store discovered values in <workflow-dir>/runs/<workflow_run_id>/runtime-parameters.yaml
5. Validate all required parameters are available
6. Load default values for optional parameters
```

### 3. Todo List Initialization
```
1. Create initial todo list with all phases:
   - Phase 0: Setup (if present)
   - Phase 1: [Name from file]
   - Phase 2: [Name from file]
   - ...
2. Mark first phase as pending
```

### 3a. Loop State Initialization

If workflow.yaml contains `loops` section:
```
1. Parse loop configurations from workflow.yaml
2. Initialize loop tracking structures:
   - loop_iterations: Map of loop_name → current_iteration (starts at 0)
   - phase_to_loop: Map of phase_number → loop configuration containing it
   - loop_start_phase: Map of loop_name → first phase in loop.phases array
   - loop_end_phase: Map of loop_name → last phase in loop.phases array

3. Validate loop configurations:
   - All phase numbers in loop.phases exist in discovered phase files
   - Phases are sequential with no gaps
   - No overlapping loops (same phase in multiple loops)
   - max_iterations between 1-100

4. Create loop_state.yaml in timestamped run directory:

   **Structure**: See SPECIFICATION.md (Runtime File Specifications → loop_state.yaml) for complete schema.

   **Initial State** (example):
   ```yaml
   # File: <workflow-dir>/runs/<workflow_run_id>/loop_state.yaml
   loops:
     refinement-loop:
       name: refinement-loop
       current_iteration: 0
       total_iterations: 0
       max_iterations: 20
       phases: [2, 3, 4]
       iteration_history: []
       # exit_condition included if specified in workflow.yaml
   ```

5. Log loop initialization:
   - LOG: "[LOOP_INIT] Initialized {count} loop(s)"
   - For each loop: LOG: "[LOOP_INIT] Loop '{name}': phases {phases}, max_iterations {max}"
```

If no `loops` section exists:
```
- Skip loop initialization
- Set loop tracking structures to empty
- Continue to phase execution normally
```

### 3b. Exit Condition Validator

For each loop with `exit_condition` field, validate expression during initialization according to **SPECIFICATION.md** section `### Exit Condition Protocol`:

**Validation Steps**:
1. **Mutual Exclusivity**: Check loop doesn't have both `exit_condition` and `iterations` fields
   - ERROR if both present: "Loop '{name}' cannot have both 'exit_condition' and 'iterations'"

2. **Parameter Validation**: All parameter references (`$PARAM` or `${PARAM}`) must be declared in workflow.yaml
   - Extract all `$PARAM_NAME` and `${PARAM_NAME}` from expression
   - Verify each parameter exists in workflow.yaml parameters section
   - Verify each parameter name matches pattern `^[A-Z][A-Z0-9_]*$`
   - ERROR if undeclared: "Exit condition references undeclared parameter: {param}"
   - ERROR if invalid name: "Parameter name '{param}' must be UPPER_SNAKE_CASE"

3. **Shell Security - Forbidden Pattern Detection**:
   Scan expression for dangerous metacharacters (prevents injection attacks):
   - Check for `;` (semicolon) → ERROR: "Forbidden character ';' (command chaining) in exit condition"
   - Check for `|` not in `||` (pipe) → ERROR: "Forbidden character '|' (command piping) in exit condition"
   - Check for `&` not in `&&` (ampersand) → ERROR: "Forbidden character '&' (background execution) in exit condition"
   - Check for backtick character → ERROR: "Forbidden backtick (command substitution) in exit condition"
   - Check for dollar-paren pattern not followed by param name → ERROR: "Forbidden command substitution in exit condition"
   - Check for process substitution patterns → ERROR: "Forbidden process substitution in exit condition"
   - Check for `eval`, `exec`, `source` keywords → ERROR: "Forbidden code execution keyword in exit condition"

4. **Operator Validation**: Only supported operators (less than, greater than, less equal, greater equal, equal, not equal, AND, OR, NOT)
   - Verify expression only uses whitelisted operators
   - ERROR if invalid operator found: "Unsupported operator in exit condition"

5. **Syntax Validation**: Parameters use UPPER_SNAKE_CASE, literals are properly formatted
   - Numeric literals: integers, decimals, negative numbers (e.g., 42, 3.14, -5.2)
   - String literals: must be quoted with single or double quotes
   - Boolean literals: true or false
   - Parentheses for grouping allowed

6. **Store Validated Expression**: Update <workflow-dir>/runs/<workflow_run_id>/loop_state.yaml with validated expression and extracted parameter list

**On Success**:
- LOG: "[EXIT_CONDITION_VALIDATED] Loop '{name}': {expression}"
- Store in <workflow-dir>/runs/<workflow_run_id>/loop_state.yaml with `validated: true` flag and parameter list

**On Failure**:
- ERROR with specific message (see above for error formats)
- ABORT workflow startup

See `.claude/docs/SPECIFICATION.md` section `### Exit Condition Protocol` for complete validation rules, security constraints, and error message formats.

### 4. Phase Execution Loop (Agent-Based)
For each phase:
```
1. ANNOUNCE: "Starting Phase X of Y: [Phase Name]"
2. Mark phase as in_progress in todo list
3. Read phase file and extract:
   - Phase metadata (inputs, outputs, parameters, execution_mode)
   - Phase instructions and process steps
   - Success criteria
4. Resolve parameters from:
   - workflow.yaml definitions
   - Command-line arguments
   - Previous phase outputs (<workflow-dir>/runs/<workflow_run_id>/runtime-parameters.yaml)
   - Discovered files in output directories

5. CHECK EXECUTION MODE:
   If task_iteration.enabled AND phase_num == task_iteration.phase:
      → Execute Task Iteration Mode (see section 4a2 above)
   Else If phase_metadata.execution_mode == "parallel":
      → Execute Parallel Phase (see section 4a below)
   Else:
      → Execute Standard Phase (continue with step 5a)

5a. RESOLVE MODEL FOR PHASE:
    1. Extract phase_metadata.model if present from phase frontmatter YAML
    2. Extract workflow.yaml phases.default_model if present
    3. Apply resolution priority:
       - IF phase_metadata.model exists AND is valid → use it (model_source = "phase override")
       - ELSE IF workflow.phases.default_model exists AND is valid → use it (model_source = "workflow default")
       - ELSE → use "sonnet" (model_source = "system default")
    4. Validate resolved_model is one of: opus, sonnet, haiku
       - If invalid, ERROR and abort workflow execution
    5. Store resolved_model and model_source for display and Task invocation

6. **CRITICAL: Display resolved context in main thread output**
   **This MUST happen in your main response, NOT inside the agent**
   **Display this BEFORE calling the Task tool:**
   
   ═══════════════════════════════════════════════════════
   PHASE X: [Phase Name]
   ═══════════════════════════════════════════════════════
   Model: [resolved_model] ([model_source])

   Input Files:
   - [FILE_NAME]: [resolved path]
   - [FILE_NAME]: [resolved path]
   
   Parameters:
   - [PARAM_NAME]: [resolved value]
   - [PARAM_NAME]: [resolved value]
   
   Expected Outputs:
   - [output file path]
   - [output file path]
   ═══════════════════════════════════════════════════════

7. Build agent prompt including:
   - List of input files to read
   - Resolved parameter values
   - Phase instructions from the phase file
   - Expected output specifications
   - Success criteria to validate
8. Execute phase via Task tool:
   - subagent_type: "phase-executor"
   - description: "Execute Phase X: [Name]"
   - prompt: [constructed prompt with all context]
   - model: [resolved_model]  # Pass resolved model from step 5a
9. Process agent result:
   - Verify expected outputs were created
   - Extract any new parameters for next phases
   - Update <workflow-dir>/runs/<workflow_run_id>/runtime-parameters.yaml if needed
10. Mark phase as completed in todo list
11. ANNOUNCE: "Completed Phase X of Y: [Phase Name]"
12. Log execution details to <workflow-dir>/runs/<workflow_run_id>/execution.log
```

### 4b. Loop Evaluation (after phase completion)

After completing a phase, check if loop continuation is needed:

```
1. CHECK IF PHASE IS IN A LOOP:
   - Look up current_phase_number in phase_to_loop map
   - If not found: continue to next sequential phase (no loop)
   - If found: proceed to step 2

2. CHECK IF THIS IS LOOP END PHASE:
   - Get loop configuration from phase_to_loop[current_phase_number]
   - If current_phase_number != loop_end_phase[loop_name]: continue to next phase (still in loop body)
   - If current_phase_number == loop_end_phase[loop_name]: proceed to step 3 (evaluate loop)

3. INCREMENT ITERATION COUNTER:
   - current_iter = loop_iterations[loop_name]
   - current_iter += 1
   - loop_iterations[loop_name] = current_iter

4. CHECK MAX ITERATIONS (safety limit - highest priority):
   If current_iter >= loop.max_iterations:
      → LOG: "[LOOP_MAX_ITERATIONS] Loop '{loop_name}' reached limit ({max_iterations})"
      → ANNOUNCE: "⚠️  Loop '{loop_name}' reached maximum iterations ({max_iterations})"
      → Update <workflow-dir>/runs/<workflow_run_id>/loop_state.yaml with final state
      → EXIT LOOP (continue to next sequential phase after loop)

5. INJECT LOOP PARAMETERS:
   Add these to parameter resolution (available from first iteration):
   - LOOP_INDEX: {current_iter}
   - LOOP_NAME: "{loop_name}"
   - LOOP_ITERATION: {current_iter}

   Note: These parameters are injected before the FIRST iteration (when current_iter=1)
   and updated before each subsequent iteration.

6. CHECK PHASE OVERRIDE (if allow_phase_control: true):
   If loop.allow_phase_control == true:
      If "LOOP_CONTINUE" in parameters_discovered:
         loop_continue = parameters_discovered["LOOP_CONTINUE"]
         loop_reason = parameters_discovered.get("LOOP_REASON", "No reason provided")

         If loop_continue == false or loop_continue == "false":
            → LOG: "[LOOP_EXIT_OVERRIDE] Loop '{loop_name}' exit requested by phase: {loop_reason}"
            → ANNOUNCE: "✓ Loop '{loop_name}' exited: {loop_reason}"
            → Update <workflow-dir>/runs/<workflow_run_id>/loop_state.yaml with exit details
            → EXIT LOOP (continue to next sequential phase)

         If loop_continue == true or loop_continue == "true":
            → LOG: "[LOOP_CONTINUE_OVERRIDE] Loop '{loop_name}' continue requested: {loop_reason}"
            → ANNOUNCE: "↻ Loop '{loop_name}' continuing: {loop_reason}"
            → CONTINUE LOOP (go to step 8)

6a. CHECK EXIT CONDITION (declarative exit):
   If loop has "exit_condition" field:

      **Implementation**: Follow the Exit Condition Protocol defined in SPECIFICATION.md (Exit Condition Protocol section).

      **Key Steps**:
      1. Resolve parameters from <workflow-dir>/runs/<workflow_run_id>/runtime-parameters.yaml
      2. Substitute parameter values into expression
      3. Evaluate expression using safe bash/bc translation (see SPEC for security rules)
      4. Check result (1=true, 0=false)

      **If expression evaluates to TRUE** (exit condition met):
         → LOG: "[LOOP_EXIT_CONDITION] Loop '{loop_name}' exit condition met"
         → LOG: "[LOOP_EXIT_CONDITION] Expression: {original_expression}"
         → LOG: "[LOOP_EXIT_CONDITION] Resolved: {resolved_expression}"
         → ANNOUNCE: "✓ Loop '{loop_name}' exit condition satisfied: {description}"
         → Update <workflow-dir>/runs/<workflow_run_id>/loop_state.yaml with exit condition details
         → EXIT LOOP (go to step 9)

      **If expression evaluates to FALSE** (continue looping):
         → LOG: "[LOOP_EXIT_CONDITION_FALSE] Exit condition not met, continuing loop"
         → LOG: "[LOOP_EXIT_CONDITION_FALSE] Expression: {resolved_expression}"
         → CONTINUE to step 7 (check fixed iterations)

      **On Evaluation Error**:
         → ERROR: "Exit condition evaluation failed: {error_message}"
         → ABORT workflow

      **Loop State Update**: Add evaluation results to iteration_history in <workflow-dir>/runs/<workflow_run_id>/loop_state.yaml

7. CHECK FIXED ITERATIONS (default behavior):
   If loop has "iterations" field:
      If current_iter < loop.iterations:
         → LOG: "[LOOP_CONTINUE] Loop '{loop_name}' iteration {current_iter}/{iterations}"
         → ANNOUNCE: "↻ Loop '{loop_name}' iteration {current_iter}/{iterations}"
         → CONTINUE LOOP (go to step 8)
      Else:
         → LOG: "[LOOP_COMPLETE] Loop '{loop_name}' completed {iterations} iterations"
         → ANNOUNCE: "✓ Loop '{loop_name}' completed all {iterations} iterations"
         → EXIT LOOP (continue to next sequential phase)

   Else (no iterations field and no phase override):
      → LOG: "[LOOP_EXIT_DEFAULT] Loop '{loop_name}' exiting (no control mechanism active)"
      → ANNOUNCE: "✓ Loop '{loop_name}' completed iteration {current_iter}"
      → EXIT LOOP (continue to next sequential phase)

8. CONTINUE LOOP:
   a. Update <workflow-dir>/runs/<workflow_run_id>/loop_state.yaml:
      ```yaml
      loops:
        {loop_name}:
          current_iteration: {current_iter}
          total_iterations: {current_iter}
          iteration_history:
            - iteration: {current_iter}
              timestamp: "{ISO_TIMESTAMP}"
              duration_seconds: {phase_duration}
              loop_reason: "{loop_reason or 'Fixed iteration'}"
              # Include exit_condition evaluation details if applicable
              exit_condition_checked: {true/false}
              exit_condition_result: {true/false}  # Only if checked
              exit_condition_expression: "{original_expression}"  # Only if checked
              exit_condition_resolved: "{resolved_expression}"  # Only if checked
      ```

   b. Update <workflow-dir>/runs/<workflow_run_id>/runtime-parameters.yaml:
      - Merge discovered parameters from this iteration
      - Preserve all previous parameters (cumulative)

   c. Calculate next phase:
      - next_phase_index = index of loop_start_phase[loop_name]
      - Set current phase index to next_phase_index

   d. Display loop iteration banner:
      ═══════════════════════════════════════════════════════
      ↻ LOOP ITERATION {current_iter}/{max_iterations}
      Loop: {loop_name}
      Phases: {loop.phases}
      ═══════════════════════════════════════════════════════

   e. JUMP to loop start phase (continue execution from loop start)

9. EXIT LOOP:
   a. Update <workflow-dir>/runs/<workflow_run_id>/loop_state.yaml with final state:
      ```yaml
      loops:
        {loop_name}:
          current_iteration: {current_iter}
          total_iterations: {current_iter}
          completed: true
          exit_reason: "{exit reason}"  # Values: "exit_condition_met", "max_iterations", "phase_override", "fixed_iterations_complete"
          # Include exit_condition details if loop exited via exit_condition
          exit_condition_expression: "{original_expression}"  # Only if exit_reason == "exit_condition_met"
          exit_condition_resolved: "{resolved_expression}"  # Only if exit_reason == "exit_condition_met"
          iteration_history: [...]
      ```

   b. Log loop completion to <workflow-dir>/runs/<workflow_run_id>/execution.log

   c. Continue to next sequential phase after loop end phase
```

### 4a. Parallel Phase Execution
When `execution_mode: parallel` is set in phase metadata:
```
1. Extract parallel configuration:
   - agent_type: Which agent to use for parallel tasks
   - discovery_pattern: Pattern to find work items
   - work_item_parameter: Parameter name for passing work item
   - output_pattern: Expected output path pattern
   - max_parallel: Maximum concurrent agents (0 = unlimited)

2. Discover work items:
   - Use discovery_pattern to find all files/items to process
   - Example: Find all FEAT-*.md files in features directory
   - Build list of work items with their target outputs

3. Display parallel execution plan:
   ═══════════════════════════════════════════════════════
   PHASE X: [Phase Name] - PARALLEL EXECUTION
   ═══════════════════════════════════════════════════════
   Model: [resolved_model] ([model_source]) - applies to all parallel agents

   Work Items Found: [count]
   - [work_item_1] → [output_1]
   - [work_item_2] → [output_2]
   - ...
   
   Parallel Configuration:
   - Agent Type: [agent_type]
   - Max Parallel: [max_parallel or "unlimited"]
   
   Common Parameters:
   - [PARAM_NAME]: [resolved value]
   - [PARAM_NAME]: [resolved value]
   ═══════════════════════════════════════════════════════

4. Launch parallel agents:
   - Create Task tool invocations for each work item
   - Use the agent_type specified in parallel_config (can be phase-executor or a specialized agent)
   - Pass work item via work_item_parameter
   - Include common parameters for all agents
   - Pass resolved model to ALL parallel agents (same model for all)
   - Execute multiple agents in single message (for parallelism)

5. Launch parallel agents (multiple Task tool calls in single message for true parallelism)

6. Monitor and aggregate results:
   - Wait for all parallel agents to complete
   - Collect outputs from each agent
   - Verify expected outputs were created
   - Aggregate any discovered parameters
   - Handle and retry any failures

7. Complete parallel phase:
   - Mark phase as completed in todo list
   - Generate summary report if specified
   - Update <workflow-dir>/runs/<workflow_run_id>/runtime-parameters.yaml with aggregated values
```

### 4a2. Task Iteration Mode

**Purpose**: Execute a phase multiple times, once per task, to prevent context exhaustion when processing large task lists.

When `task_iteration` is configured in workflow.yaml and the current phase matches `task_iteration.phase`:

```
1. LOAD TASK INDEX:
   task_index_path = runtime_parameters[task_iteration.task_index_param]
   task_index = load_json(task_index_path)
   total_tasks = task_index["metadata"]["total_tasks"]
   execution_order = task_index["execution_order"]  # Array of batches

2. INITIALIZE TASK TRACKING:
   results_dir = RUN_DIR + "/" + task_iteration.result_dir
   create_directory(results_dir)
   completed_tasks = []
   failed_tasks = []
   blocked_tasks = []

3. DISPLAY TASK ITERATION BANNER:
   ═══════════════════════════════════════════════════════
   PHASE {phase_num}: Task Iteration Mode
   ═══════════════════════════════════════════════════════
   Model: [resolved_model] ([model_source])

   Total Tasks: {total_tasks}
   Execution Order: {len(execution_order)} batches
   Mode: {task_iteration.sequential ? "Sequential" : "Parallel"}
   ═══════════════════════════════════════════════════════

4. FOR EACH BATCH in execution_order:
   batch_num = batch["batch"]
   batch_tasks = batch["tasks"]

   DISPLAY: "=== Batch {batch_num}: {len(batch_tasks)} tasks ==="

   FOR EACH task_id in batch_tasks:
       # Resumption: skip completed tasks
       result_file = results_dir + "/" + task_id + "-result.json"
       IF file_exists(result_file):
           result = load_json(result_file)
           IF result["status"] == "success":
               completed_tasks.append(task_id)
               DISPLAY: "✓ {task_id}: Already completed (skipping)"
               CONTINUE

       # Dependency checking
       task_file = RUN_DIR + "/" + task_iteration.task_dir + "/" + task_id + ".json"
       task_def = load_json(task_file)
       dependencies = task_def.get("dependencies", [])

       all_deps_satisfied = True
       FOR dep in dependencies:
           dep_result = results_dir + "/" + dep + "-result.json"
           IF NOT file_exists(dep_result):
               all_deps_satisfied = False
               BREAK
           dep_status = load_json(dep_result)["status"]
           IF dep_status != "success":
               all_deps_satisfied = False
               BREAK

       IF NOT all_deps_satisfied:
           blocked_tasks.append(task_id)
           DISPLAY: "⊘ {task_id}: Blocked (dependencies not satisfied)"
           CONTINUE

       # Execute single task
       task_num = len(completed_tasks) + len(failed_tasks) + 1
       DISPLAY:
       ───────────────────────────────────────────────────────
       Task {task_num}/{total_tasks}: {task_id}
       ───────────────────────────────────────────────────────

       # Launch phase-executor with TASK_ID parameter
       Launch Task tool:
           subagent_type: "phase-executor"
           description: "Execute Phase {phase_num} Task: {task_id}"
           model: [resolved_model]  # Use resolved model from step 5a
           prompt: [phase instructions with]:
               - All runtime parameters
               - {task_iteration.task_id_param}: {task_id}
               - {task_iteration.task_index_param}: {task_index_path}

       Wait for agent completion

       # Check result
       result_file = results_dir + "/" + task_id + "-result.json"
       IF file_exists(result_file):
           result = load_json(result_file)
           task_status = result["status"]

           IF task_status == "success":
               completed_tasks.append(task_id)
               DISPLAY: "✓ {task_id}: SUCCESS"

           ELSE IF task_status == "failure":
               failed_tasks.append(task_id)
               error = result.get("error", "Unknown error")
               DISPLAY: "✗ {task_id}: FAILED ({error})"

               # Retry logic
               IF task_iteration.max_retries_per_task > 0:
                   FOR retry in range(task_iteration.max_retries_per_task):
                       DISPLAY: "  Retrying {task_id} (attempt {retry+2})..."
                       # Re-launch phase-executor
                       # Check result again
                       IF result["status"] == "success":
                           completed_tasks.append(task_id)
                           failed_tasks.remove(task_id)
                           BREAK

               IF task_iteration.stop_on_failure:
                   DISPLAY: "⚠️  Stopping task iteration due to failure"
                   BREAK outer loop

           ELSE IF task_status == "blocked":
               blocked_tasks.append(task_id)
               blocked_by = result.get("blocked_by", "unknown")
               DISPLAY: "⊘ {task_id}: BLOCKED by {blocked_by}"
       ELSE:
           # No result file - agent crashed
           failed_tasks.append(task_id)
           DISPLAY: "✗ {task_id}: FAILED (no result file generated)"

5. AGGREGATE RESULTS:
   aggregated_results = {
       "metadata": {
           "workflow_run_id": RUN_ID,
           "total_tasks": total_tasks,
           "completed": len(completed_tasks),
           "failed": len(failed_tasks),
           "blocked": len(blocked_tasks),
           "phase": phase_num
       },
       "tasks": []
   }

   FOR task_id in task_index["tasks"]:
       result_file = results_dir + "/" + task_id + "-result.json"
       IF file_exists(result_file):
           aggregated_results["tasks"].append(load_json(result_file))

   save_json(RUN_DIR + "/task-results.json", aggregated_results)

6. UPDATE RUNTIME PARAMETERS:
   runtime_parameters["TASKS_COMPLETED"] = len(completed_tasks)
   runtime_parameters["TASKS_FAILED"] = len(failed_tasks)
   runtime_parameters["TASKS_BLOCKED"] = len(blocked_tasks)
   save_yaml(runtime_parameters_path, runtime_parameters)

7. DISPLAY TASK ITERATION SUMMARY:
   ═══════════════════════════════════════════════════════
   Task Iteration Complete
   ═══════════════════════════════════════════════════════
   Completed: {len(completed_tasks)}/{total_tasks}
   Failed: {len(failed_tasks)}
   Blocked: {len(blocked_tasks)}
   ═══════════════════════════════════════════════════════

8. IF task_iteration.stop_on_failure AND failed_tasks:
       ABORT workflow with error
   ELSE:
       CONTINUE to next phase
```

### 5. Completion
```
1. Verify all phases completed successfully
2. Generate final execution summary
3. Display:
   - Total phases executed
   - Total time taken
   - Key outputs produced
4. Save complete <workflow-dir>/runs/<workflow_run_id>/execution.log
5. Display run directory location:

   ═══════════════════════════════════════════════════════
   WORKFLOW COMPLETE
   ═══════════════════════════════════════════════════════
   Execution metadata saved to:
   <workflow-dir>/runs/<workflow_run_id>/

   Files:
   - runtime-parameters.yaml (parameter state)
   - execution.log (execution events)
   - loop_state.yaml (if loops were used)
   ═══════════════════════════════════════════════════════
```

## Progress Indicators

The command provides clear progress tracking:

```
═══════════════════════════════════════════════════════
WORKFLOW: deployment-workflow
PHASES: 4 phases discovered
═══════════════════════════════════════════════════════

[Discovery] Found phases:
  ✓ phase-00-setup.md (Parameter Discovery)
  ✓ phase-01-prepare.md (Environment Preparation)
  ✓ phase-02-execute.md (Deployment Execution)
  ✓ phase-03-validate.md (Post-Deployment Validation)

[Parameters] Resolving workflow parameters...
  ✓ environment: production
  ✓ backup: true
  ✓ parallel_jobs: 4

───────────────────────────────────────────────────────
▶ PHASE 1 of 4: Environment Preparation
───────────────────────────────────────────────────────

═══════════════════════════════════════════════════════
PHASE 1: Environment Preparation
═══════════════════════════════════════════════════════
Input Files:
  - ENVIRONMENT_CONFIG: /workspace/configs/prod.yaml
  - DEPLOYMENT_SPEC: /workspace/deploy/spec.yaml

Parameters:
  - environment: production
  - backup: true
  - parallel_jobs: 4

Expected Outputs:
  - /workspace/temp/prepared-environment.yaml
  - /workspace/logs/preparation.log
═══════════════════════════════════════════════════════

[in progress] Setting up deployment environment...
[completed] ✓ Environment ready

[Phases 2-4 follow same pattern...]
```

**CRITICAL REQUIREMENT:** The parameter display box with ═══ borders MUST be shown in your main response before each Task tool invocation. This ensures users can see what parameters are being passed to each phase.

## Error Handling

### Phase Failures
When a phase fails:
1. Display error details clearly
2. Mark phase as failed in todo list
3. If `allow_retry: true` in workflow.yaml:
   - Prompt: "Phase failed. Retry? (y/n)"
   - On 'y': Reset phase tasks and retry
   - On 'n': Abort workflow
4. Log failure details to <workflow-dir>/runs/<workflow_run_id>/execution.log

### Missing Requirements
- Missing workflow.yaml: Error with instructions to create
- Missing phase files: List discovered phases and gaps
- Missing parameters: List required parameters and how to provide

### Validation Errors
- Non-sequential phases: Show gap (e.g., "Missing phase-02")
- Invalid phase format: Show expected format
- Invalid workflow.yaml: Display schema violations

## Advanced Features

### Conditional Phases
Phases can include conditions in their prerequisites:
```markdown
## Prerequisites
- Parameter `environment` must equal "production"
- File `backup.sql` must exist if `backup` is true
```

### Phase Dependencies
Phases can reference outputs from previous phases:
```markdown
## Prerequisites  
- Output from Phase 1: deployment-config.yaml
- Artifact from Phase 2: backup-timestamp.txt
```

### Parallel Task Execution
Within a phase, mark tasks that can run in parallel:
```markdown
## Tasks for Todo List
1. [PARALLEL] Deploy to region-1
2. [PARALLEL] Deploy to region-2  
3. [PARALLEL] Deploy to region-3
4. Verify all deployments
```

## Example Workflows

### Deployment Workflow
```
.claude/workflows/deployment/
├── workflow.yaml
├── phase-00-setup.md      # Discover environment settings
├── phase-01-prepare.md    # Prepare deployment environment
├── phase-02-backup.md     # Create backups
├── phase-03-deploy.md     # Execute deployment
└── phase-04-validate.md   # Validate deployment
```

### Testing Workflow
```
.claude/workflows/testing/
├── workflow.yaml
├── phase-01-setup.md      # Setup test environment
├── phase-02-unit.md       # Run unit tests
├── phase-03-integration.md # Run integration tests
└── phase-04-cleanup.md    # Cleanup test artifacts
```

### Migration Workflow
```
.claude/workflows/migration/
├── workflow.yaml
├── phase-00-setup.md      # Analyze current state
├── phase-01-backup.md     # Backup data
├── phase-02-transform.md  # Transform data
├── phase-03-migrate.md    # Execute migration
├── phase-04-verify.md     # Verify migration
└── phase-05-cleanup.md    # Cleanup temporary files
```

## Best Practices

1. **Phase Granularity**: Keep phases focused on a single objective
2. **Clear Prerequisites**: Always specify what a phase needs
3. **Explicit Success Criteria**: Define measurable success conditions
4. **Error Recovery**: Include rollback procedures in each phase
5. **Parameter Documentation**: Document all parameters in workflow.yaml
6. **Task Atomicity**: Make tasks small and independently verifiable
7. **Progress Visibility**: Use clear task names that indicate progress
8. **Logging**: Generate artifacts that can be reviewed later

## Troubleshooting

### Common Issues

**"No phase files found"**
- Check workflow directory path
- Verify files match pattern `phase-*.md`
- Ensure files are readable

**"Phase sequence has gaps"**
- Phases must be numbered sequentially
- Check for missing numbers (e.g., 01, 02, 04 - missing 03)

**"Required parameter missing"**
- Check workflow.yaml for required parameters
- Provide via command line or setup phase
- Verify parameter names match exactly

**"Phase failed to complete"**
- Check <workflow-dir>/runs/<workflow_run_id>/execution.log for details
- Verify prerequisites were met
- Review success criteria
- Consider retry if transient issue

## Agent-Based Execution Architecture

### How It Works
Each phase is executed in an isolated agent context via the Task tool:

1. **Orchestrator Role**: The workflow runner acts as an orchestrator, not an executor
2. **Parameter Display**: Before each phase, the orchestrator MUST display resolved parameters in the main thread
3. **Phase Isolation**: Each phase runs in a clean agent context with only necessary inputs
4. **Explicit Context**: Agents receive explicit file lists and parameters, no implicit context
5. **Clear Contracts**: Each phase has defined inputs and outputs via metadata

### Benefits
- **Isolation**: Phases cannot accidentally depend on undeclared context
- **Debugging**: Can re-run individual phases with exact same inputs
- **Parallelization**: Non-dependent phases could run concurrently (future enhancement)
- **Modularity**: Phases become reusable components with clear interfaces
- **Traceability**: Complete record of what each phase received and produced

### Task Tool Invocation Pattern

The orchestrator invokes the Task tool for each phase with:
- `subagent_type`: "phase-executor" (or specialized agent)
- `description`: "Execute Phase N: [Name]"
- `prompt`: Structured context including input files, parameters, instructions, expected outputs, and success criteria

## Integration with Other Commands

Phases executed via agents have access to Claude's built-in tools:
- File operations (read, write, edit)
- Bash commands and script execution
- Search and analysis tools
- Web requests via appropriate tools

**Important**: Agents CANNOT invoke other agents. The Task tool is not available within phase execution. All work must be completed directly by the phase-executor agent.

## Backward Compatibility Note

Existing phase files without metadata sections will still work:
- Orchestrator will use legacy parameter extraction
- All parameters will be passed to the agent
- Gradual migration to metadata format recommended