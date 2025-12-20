<!--
PHASE TEMPLATE
==============
This template is used by workflow-creator to generate new phase files.

PLACEHOLDER TYPES:
1. Template Placeholders: ${VARIABLE_NAME} - Replaced by workflow-creator during generation
   Examples: ${PHASE_NUMBER}, ${PHASE_NAME}, ${INPUT_FILE_PARAM}

2. Runtime Parameters: $PARAM_NAME or ${PARAM_NAME} - Resolved during workflow execution
   Examples: $OUTPUT_DIR, $SPECS_DIR, ${FEATURE_FILE}

The workflow-creator replaces template placeholders with actual values.
Runtime parameters remain as $PARAM references in the generated phase file.
-->

---
phase_metadata:
  # Execution mode: sequential (default) or parallel
  execution_mode: sequential

  # Optional: Claude model for this phase (uncomment to override workflow default)
  # model: sonnet  # opus|sonnet|haiku (workflow-creator may override based on phase complexity)

  # For parallel execution, uncomment and configure:
  # parallel_config:
  #   agent_type: ${AGENT_TYPE}  # Template placeholder: workflow-creator fills this (e.g., "feature-specifier")
  #   discovery_pattern: "${DISCOVERY_PATTERN}"  # Template placeholder: becomes runtime param pattern (e.g., "$OUTPUT_DIR/items/*.md")
  #   work_item_parameter: ${WORK_ITEM_PARAM}  # Template placeholder: workflow-creator fills this (e.g., "WORK_ITEM_FILE")
  #   output_pattern: "${OUTPUT_PATTERN}"  # Template placeholder: becomes runtime param pattern (e.g., "$OUTPUT_DIR/results/{name}.md")
  #   max_parallel: ${MAX_PARALLEL}  # Template placeholder: workflow-creator fills this (e.g., 5 or 0 for unlimited)

  inputs:
    files:
      # List input files this phase needs
      - name: ${INPUT_FILE_PARAM}  # Template placeholder: workflow-creator fills this (e.g., becomes "FEATURE_SPEC")
        required: true  # Is this file required?
        path: "${INPUT_FILE_PATH}"  # Template placeholder: becomes runtime param reference (e.g., "$OUTPUT_DIR/input.md")
        description: "${INPUT_FILE_DESC}"  # Template placeholder: workflow-creator fills this with description

    parameters:
      # List input parameters this phase needs
      - name: ${INPUT_PARAM}  # Template placeholder: workflow-creator fills this (e.g., becomes "OUTPUT_DIR")
        type: string  # Optional: string|boolean|integer|number|enum|file|directory|array
        required: true  # Is this parameter required?
        default: ${DEFAULT_VALUE}  # Template placeholder: workflow-creator fills this (e.g., becomes "./outputs")
        description: "${INPUT_PARAM_DESC}"  # Template placeholder: workflow-creator fills this with description

  outputs:
    files:
      # List files this phase will create
      - path: "${OUTPUT_FILE_PATH}"  # Template placeholder: becomes runtime param reference (e.g., "$OUTPUT_DIR/report.md")
        description: "${OUTPUT_FILE_DESC}"  # Template placeholder: workflow-creator fills this with description

    parameters:
      # List parameters this phase provides to next phases
      - name: ${OUTPUT_PARAM}  # Template placeholder: workflow-creator fills this (e.g., becomes "VALIDATION_PASSED")
        type: boolean  # Optional: string|boolean|integer|number|enum|file|directory|array
        required: true  # Is this output parameter required to be produced?
        description: "${OUTPUT_PARAM_DESC}"  # Template placeholder: workflow-creator fills this with description

  # Optional: Conditional execution (uncomment and configure if needed)
  # prerequisites:
  #   - condition: "$ENVIRONMENT == 'production'"  # Expression using parameters
  #     action: require_approval  # require_approval|skip_phase|fail_phase|warning
  #   - condition: "$SKIP_VALIDATION == true"
  #     action: skip_phase

  # Optional: Suggest a specific agent for this phase
  # preferred_agent: phase-executor
---

# Phase ${PHASE_NUMBER}: ${PHASE_NAME}

**Purpose**: ${PHASE_PURPOSE}

## Prerequisites
${PREREQUISITES_LIST}

## Tasks for Todo List
When starting this phase, add these tasks:
${TASKS_LIST}

## Parameters Used
${PARAMETERS_LIST}

## Process

${PROCESS_STEPS}

## Outputs
${OUTPUTS_LIST}

## Success Criteria
${SUCCESS_CRITERIA}

## Error Handling

${ERROR_HANDLING}

## Rollback Plan
<!-- Optional: Include for phases with destructive or hard-to-reverse operations -->
${ROLLBACK_PLAN}

## Notes
<!-- Optional: Additional context, warnings, or implementation guidance -->
${ADDITIONAL_NOTES}

<!--
EXAMPLE: After workflow-creator processes this template

Template placeholders get replaced:
- ${PHASE_NUMBER} → "01"
- ${PHASE_NAME} → "Data Extraction"
- ${INPUT_FILE_PARAM} → "SOURCE_FILE"

Runtime parameters remain as references:
- $OUTPUT_DIR → stays as "$OUTPUT_DIR" (resolved at runtime)
- $SPECS_DIR → stays as "$SPECS_DIR" (resolved at runtime)

The generated phase file might look like:
phase_metadata:
  inputs:
    files:
      - name: SOURCE_FILE
        path: "$OUTPUT_DIR/source.md"

When the workflow runs, $OUTPUT_DIR gets resolved to the actual path.
-->