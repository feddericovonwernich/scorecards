---
name: validate-workflow
description: "Validate workflow structure, metadata, and documentation coherence"
---

# Validate Workflow Command

Perform comprehensive validation of workflow directories to ensure correctness and coherence.

## Overview

This command launches the workflow-validator agent to check:
- Workflow structure and file naming
- Metadata completeness in all files
- Parameter flow between phases
- Documentation alignment with implementation
- Specification compliance

## Usage

```bash
/validate-workflow <WORKFLOW_DIR>
```

**Arguments:**
- `WORKFLOW_DIR`: Path to workflow directory to validate

**Validation Modes** (specified in the prompt):
- Request strict validation: Include "strict mode" or "treat warnings as errors" in your request
- Request summary only: Ask for "summary" or "quick check"
- Request JSON output: Ask for "JSON format" for CI/CD integration

> **Note**: This is a slash command that launches the workflow-validator agent. Options are communicated through natural language in your request, not as CLI flags.

## Examples

### Basic Validation
```bash
# Validate a workflow with detailed report
/validate-workflow .claude/workflows/technical-planning

# Example output:
# ✓ VALID: Workflow structure correct
# ⚠ WARNING: 2 minor issues found
# → See detailed report for recommendations
```

### Strict Validation
```bash
# Enforce all best practices (natural language request)
/validate-workflow .claude/workflows/deployment

# In your prompt, include: "Please use strict mode and treat warnings as errors"
```

### Quick Check
```bash
# Get summary only
/validate-workflow .claude/workflows/testing

# In your prompt, add: "Please provide just a summary"
```

### CI/CD Integration
```bash
# Request JSON output for tooling
/validate-workflow .claude/workflows/migration

# In your prompt, add: "Please output in JSON format for CI/CD integration"
```

## Validation Checks

### Structure Validation
- workflow.yaml exists and is valid
- Phase files follow naming convention
- Sequential numbering without gaps
- README.md present (recommended)

### Metadata Validation
- All required fields present
- Parameter definitions complete
- Phase metadata sections valid
- Input/output specifications clear

### Coherence Validation
- README documents all phases
- Parameter flow traceable
- No orphaned dependencies
- File references valid

### Quality Checks
- Specification compliance
- Best practices followed
- Documentation complete
- Error handling present

## Report Interpretation

### Status Levels
- **✓ VALID**: Workflow will execute correctly
- **⚠ WARNINGS**: May have issues, but will run
- **✗ INVALID**: Critical errors prevent execution

### Issue Severity
- **ERROR**: Must fix before execution
- **WARNING**: Should fix for reliability
- **INFO**: Consider for improvement

## Process

1. **Launch Validator Agent**
   ```bash
   # Agent reads workflow introduction
   # Loads validation rules
   # Prepares comprehensive checks
   ```

2. **Structural Analysis**
   - Verify directory structure
   - Check file naming patterns
   - Validate phase sequence

3. **Content Validation**
   - Parse workflow.yaml
   - Check phase metadata
   - Verify documentation

4. **Coherence Check**
   - Trace parameter flow
   - Validate dependencies
   - Check references

5. **Generate Report**
   - Summarize findings
   - Categorize issues
   - Provide recommendations

## Common Issues

### Missing Metadata
```
ERROR: phase-01-design.md missing phase_metadata section
FIX: Add metadata section with inputs/outputs
```

### Parameter Not Defined
```
WARNING: Parameter 'DATABASE_URL' used but not defined
FIX: Add to workflow.yaml parameters section
```

### Documentation Mismatch
```
WARNING: README mentions 4 phases, but 5 found
FIX: Update README to document all phases
```

### Sequence Gap
```
ERROR: Gap in phase sequence (01, 02, 04)
FIX: Rename phase-04 to phase-03 or add missing phase
```

## Best Practices

### Before Creating Workflows
1. Plan phase breakdown carefully
2. Define all parameters upfront
3. Consider parameter flow
4. Document requirements clearly

### After Workflow Generation
1. **Always validate**: Run immediately after creation
2. **Fix errors first**: Address critical issues
3. **Clean warnings**: Improve reliability
4. **Document changes**: Update README

### During Development
1. Validate after major changes
2. Use strict mode for final check
3. Include in CI/CD pipeline
4. Track validation history

## Integration

### With Workflow Creation
```bash
# Create then validate
/create-workflow spec.md --name=feature-workflow
/validate-workflow .claude/workflows/feature-workflow
```

### With Workflow Execution
```bash
# Validate before running
/validate-workflow .claude/workflows/deployment
# If validation passes, then run:
/run-workflow .claude/workflows/deployment
```

### With Version Control
Note: For automated validation in scripts, consider using the validator agent directly via claude -p.

## Advanced Usage

### Custom Validation Rules
Future enhancement: Support custom validation rules via configuration:
```yaml
# .claude/validation-rules.yaml
custom_rules:
  - require_examples_dir: true
  - max_phases: 10
  - require_rollback_procedures: true
```

### Batch Validation
To validate multiple workflows, run the command multiple times:
```bash
/validate-workflow .claude/workflows/workflow-1
/validate-workflow .claude/workflows/workflow-2
/validate-workflow .claude/workflows/workflow-3
```

### Validation Reports
Generate validation report for documentation:
```bash
/validate-workflow .claude/workflows/technical-planning

# In your prompt, add: "Please provide a detailed report and format it for documentation"
```

## Troubleshooting

### Agent Not Found
Ensure workflow-validator agent exists:
```bash
ls .claude/agents/workflow/workflow-validator.md
```

### Permission Issues
Check read permissions:
```bash
chmod +r .claude/workflows/*/
```

### YAML Parse Errors
Validate YAML syntax:
```bash
yamllint .claude/workflows/*/workflow.yaml
```

## Success Metrics

A well-validated workflow has:
- Zero errors
- Minimal warnings
- Complete documentation
- Clear parameter flow
- Proper error handling
- Specification compliance

## See Also

- `create-workflow`: Generate workflows from input files
- `run-workflow`: Execute multi-phase workflows
- `.claude/docs/INTRODUCTION.md`: System overview
- `.claude/docs/SPECIFICATION.md`: Formal specification
- `.claude/agents/workflow/workflow-validator.md`: Validator agent details