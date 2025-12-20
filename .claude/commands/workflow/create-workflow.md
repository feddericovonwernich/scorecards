---
name: create-workflow
description: "Generate a complete multi-phase workflow from input files using AI analysis"
---

# Create Workflow Command

Use the workflow-creator agent to intelligently analyze input files and generate complete multi-phase workflows.

## Overview

This command launches the workflow-creator agent which:
- Analyzes provided files (specs, requirements, code, docs)
- Identifies the type of work needed
- Generates a complete workflow with phases
- Creates all necessary configuration and documentation

## Usage

```bash
/create-workflow <input-files...> --name <workflow-name> [--type <workflow-type>]
```

**Arguments:**
- `input-files`: One or more files to analyze (paths to specs, requirements, code, etc.)
- `--name`: Name for the generated workflow
- `--type`: Optional workflow type hint (deployment|testing|migration|build|data-processing|requirements-processing|technical-planning|setup|automation)

> **Note**: This is a slash command that launches the workflow-creator agent. Arguments are passed naturally - for example: `/create-workflow spec.md requirements.md --name=my-workflow`

## Examples

### Example 1: Generate from Feature Specification
```bash
# Generate a development workflow from a feature spec
/create-workflow outputs/specs/SPEC-001-pr-fetching/feature-spec.md \
  --name=pr-fetching-implementation

# The agent will:
# 1. Analyze the feature specification
# 2. Identify development tasks
# 3. Create phases for research, implementation, testing, deployment
# 4. Generate complete workflow at .claude/workflows/pr-fetching-implementation/
```

### Example 2: Generate from Migration Plan
```bash
# Generate a migration workflow from schema files and plan
/create-workflow current-schema.sql target-schema.sql migration-plan.md \
  --name=database-v2-migration \
  --type=migration

# The agent will:
# 1. Compare schemas to understand changes
# 2. Parse migration plan for requirements
# 3. Create phases for backup, migration, validation
# 4. Include rollback procedures
```

### Example 3: Generate from Test Requirements
```bash
# Generate a testing workflow from test documentation
/create-workflow test-requirements.md test-cases.yaml \
  --name=comprehensive-testing \
  --type=testing

# The agent will:
# 1. Parse test requirements and cases
# 2. Group tests by type and dependencies
# 3. Create phases for different test levels
# 4. Include test data setup and cleanup
```

### Example 4: Generate from Multiple Sources
```bash
# Generate a deployment workflow from various sources
/create-workflow deployment-checklist.md \
  config/production.yaml \
  scripts/deploy.sh \
  monitoring-requirements.md \
  --name=production-deployment

# The agent will:
# 1. Extract deployment steps from checklist
# 2. Parse configuration for parameters
# 3. Analyze deploy script for process
# 4. Include monitoring setup from requirements
```

## Process

### Step 1: Launch Workflow Creator Agent
```bash
# The command will launch the workflow-creator agent with:
# - Input file paths
# - Target workflow name  
# - Optional type hint
```

### Step 2: Agent Analysis
The agent performs:
1. **Content Analysis**
   - Parses all input files
   - Extracts requirements and constraints
   - Identifies tools and technologies

2. **Workflow Planning**
   - Determines workflow type
   - Plans phase breakdown
   - Identifies parameters needed

3. **Generation**
   - Creates workflow.yaml
   - Generates all phase files
   - Produces documentation

### Step 3: Output Structure
```
.claude/workflows/<workflow-name>/
├── workflow.yaml          # Configuration and parameters
├── README.md             # Usage documentation
├── phase-00-setup.md     # Setup phase (if needed)
├── phase-01-*.md         # First execution phase
├── phase-02-*.md         # Additional phases
├── phase-0N-validate.md  # Validation phase
└── examples/
    └── parameters.yaml   # Example parameters
```

## Workflow Type Detection

The agent automatically detects workflow type from content:

| Content Patterns | Detected Type | Typical Phases |
|-----------------|---------------|----------------|
| deploy, release, rollout | deployment | setup → prepare → backup → deploy → validate |
| test, verify, quality | testing | setup → unit → integration → e2e → report |
| migrate, upgrade, transform | migration | analyze → backup → migrate → validate → cleanup |
| build, compile, package | build | setup → compile → test → package → publish |
| process, ETL, analyze | data-processing | ingest → validate → transform → process → output |
| requirements, features, specs | requirements-processing | extract → analyze → structure → validate → output |
| design, architecture, plan | technical-planning | research → design → document → review → finalize |
| install, configure, initialize | setup | discover → validate → configure → verify → document |
| automate, schedule, orchestrate | automation | define → configure → test → deploy → monitor |

## Customization

### Providing Type Hints
Use `--type` to guide the agent:
```bash
/create-workflow spec.md --name=my-workflow --type=deployment
```

### Multiple Input Files
Provide multiple files for richer context:
```bash
/create-workflow requirements.md \
  architecture.md \
  test-plan.md \
  deployment-guide.md \
  --name=complete-implementation
```

### Complex Scenarios
For complex workflows, provide:
- Requirements documents
- Technical specifications  
- Existing scripts or configs
- Test plans
- Deployment guides

## Agent Intelligence

The workflow-creator agent provides:

### Smart Phase Generation
- Analyzes dependencies between tasks
- Groups related work into phases
- Ensures logical progression
- Includes validation at key points

### Parameter Extraction
- Identifies configuration needs from files
- Extracts environment variables
- Finds service dependencies
- Detects required credentials

### Error Handling
- Adds rollback procedures for risky phases
- Includes validation steps
- Provides troubleshooting guidance
- Suggests recovery options

### Best Practices
- Follows workflow patterns for each type
- Includes proper logging and monitoring
- Adds security considerations
- Ensures idempotency where needed

## Validation

After generation, the agent validates:
- All phases have clear objectives
- Parameters are properly defined
- Task lists are complete
- Error handling is comprehensive
- Documentation is clear

## Post-Generation

After workflow generation:

1. **Review the workflow**:
   ```bash
   cat .claude/workflows/<workflow-name>/README.md
   ```

2. **Check parameters**:
   ```bash
   cat .claude/workflows/<workflow-name>/workflow.yaml
   ```

3. **Execute the workflow**:
   ```bash
   /run-workflow .claude/workflows/<workflow-name> --environment=prod
   ```

## Tips

### For Best Results
- Provide detailed input files
- Include examples and edge cases
- Specify constraints and requirements
- Document dependencies clearly

### Input File Types
The agent can analyze:
- Markdown documents (.md)
- YAML configurations (.yaml/.yml)
- JSON files (.json)
- SQL schemas (.sql)
- Shell scripts (.sh)
- Source code files
- Requirements documents
- Test specifications

### Common Patterns
- **Feature → Implementation**: Provide feature spec
- **Plan → Execution**: Provide planning documents
- **Current → Target**: Provide before/after states
- **Requirements → Validation**: Provide test requirements

## Troubleshooting

### Incomplete Workflow
If the generated workflow seems incomplete:
- Provide more detailed input files
- Include specific requirements
- Add examples of desired outcomes

### Wrong Workflow Type
If the detected type is incorrect:
- Use the `--type` parameter
- Ensure input files clearly indicate intent
- Remove ambiguous content

### Missing Parameters
If parameters are missing:
- Check input files mention all config needs
- Provide configuration examples
- Include environment details

## Integration

The generated workflows integrate with:
- The multi-phase runner (`run-workflow` command)
- Todo management system
- Parameter discovery
- Logging and monitoring
- Error handling and rollback

## Examples of Generated Workflows

### Deployment Workflow
Generated from deployment checklist:
- Phase 0: Environment discovery
- Phase 1: Build and preparation
- Phase 2: Backup creation
- Phase 3: Deployment execution
- Phase 4: Validation and monitoring

### Testing Workflow
Generated from test plan:
- Phase 0: Test environment setup
- Phase 1: Unit test execution
- Phase 2: Integration testing
- Phase 3: End-to-end testing
- Phase 4: Performance testing
- Phase 5: Report generation

### Migration Workflow
Generated from migration plan:
- Phase 0: Migration analysis
- Phase 1: Backup and validation
- Phase 2: Schema migration
- Phase 3: Data transformation
- Phase 4: Verification
- Phase 5: Cleanup and optimization