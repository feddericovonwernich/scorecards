# Check Development Guide

This guide explains how to create new checks for the scorecard system.

## Check Structure

Each check lives in its own directory under `/checks/` with the following structure:

```
checks/
└── 01-my-check/
    ├── check.sh          # The check script (can be .sh, .py, or .js)
    └── metadata.json     # Check metadata
```

## Metadata Schema

Each check must have a `metadata.json` file with the following structure:

```json
{
  "name": "Human-readable check name",
  "description": "Detailed description of what this check validates",
  "weight": 10,
  "timeout": 30,
  "category": "documentation|security|testing|ci|quality"
}
```

### Fields

- **name** (required, string): Display name for the check
- **description** (required, string): Clear description of what the check does and why it's important
- **weight** (required, number): Relative importance (1-100). Higher weight = more impact on score
- **timeout** (optional, number, default: 30): Max execution time in seconds
- **category** (optional, string): Grouping category for the catalog UI

## Check Script Interface

### Input

Your check script receives the service repository path as an environment variable:

```bash
# Bash example
REPO_PATH="${SCORECARD_REPO_PATH}"
cd "$REPO_PATH" || exit 1

# Python example
import os
repo_path = os.environ.get('SCORECARD_REPO_PATH')

# JavaScript example
const repoPath = process.env.SCORECARD_REPO_PATH;
```

### Output

#### Exit Codes

- **0**: Check passed
- **Non-zero**: Check failed

#### stdout/stderr

- **stdout**: Success message or additional details (shown in catalog)
- **stderr**: Failure reason or error details (shown in catalog on failure)

### Example Check Scripts

#### Bash (.sh)

```bash
#!/bin/bash
set -e

REPO_PATH="${SCORECARD_REPO_PATH}"

if [ -f "$REPO_PATH/README.md" ]; then
    # Check if README has content (more than 10 lines)
    line_count=$(wc -l < "$REPO_PATH/README.md")
    if [ "$line_count" -gt 10 ]; then
        echo "README.md exists with $line_count lines"
        exit 0
    else
        echo "README.md exists but has only $line_count lines (needs > 10)" >&2
        exit 1
    fi
else
    echo "README.md not found" >&2
    exit 1
fi
```

#### Python (.py)

```python
#!/usr/bin/env python3
import os
import sys
from pathlib import Path

repo_path = Path(os.environ.get('SCORECARD_REPO_PATH', '.'))
license_file = repo_path / 'LICENSE'

if license_file.exists():
    content = license_file.read_text()
    if len(content.strip()) > 100:
        print(f"LICENSE file found ({len(content)} bytes)")
        sys.exit(0)
    else:
        print("LICENSE file too short (< 100 bytes)", file=sys.stderr)
        sys.exit(1)
else:
    print("LICENSE file not found", file=sys.stderr)
    sys.exit(1)
```

#### JavaScript (.js)

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoPath = process.env.SCORECARD_REPO_PATH || '.';
const ciPath = path.join(repoPath, '.github', 'workflows');

try {
    if (fs.existsSync(ciPath)) {
        const files = fs.readdirSync(ciPath);
        const yamlFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

        if (yamlFiles.length > 0) {
            console.log(`Found ${yamlFiles.length} CI workflow(s): ${yamlFiles.join(', ')}`);
            process.exit(0);
        } else {
            console.error('No workflow files found in .github/workflows/');
            process.exit(1);
        }
    } else {
        console.error('.github/workflows/ directory not found');
        process.exit(1);
    }
} catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
}
```

## Best Practices

### 1. Be Specific in Output

Good:
```bash
echo "Found 15 test files covering 12 source files (80% coverage)"
```

Bad:
```bash
echo "Tests found"
```

### 2. Handle Errors Gracefully

```bash
if ! command -v python3 &> /dev/null; then
    echo "python3 not found - cannot check" >&2
    exit 1
fi
```

### 3. Make Checks Fast

- Set appropriate timeouts
- Avoid network calls when possible
- Cache results if repeated operations needed

### 4. Make Checks Idempotent

Checks should not modify the repository - they are read-only.

### 5. Use Meaningful Weights

- Critical checks (security, licensing): 15-20
- Important checks (documentation, tests): 10-15
- Nice-to-have checks (code style, badges): 5-10
- Informational checks: 1-5

## Check Naming Convention

Use numeric prefixes to control execution order:

```
01-foundational-check/
02-another-check/
10-less-critical/
```

Checks run in lexicographical order, so lower numbers run first.

## Testing Your Check Locally

1. Set the environment variable:
```bash
export SCORECARD_REPO_PATH=/path/to/test/repo
```

2. Run your check script:
```bash
bash checks/01-my-check/check.sh
echo "Exit code: $?"
```

3. Verify output and exit code are correct

## Common Patterns

### Checking File Existence

```bash
if [ -f "$REPO_PATH/somefile.txt" ]; then
    echo "File exists"
    exit 0
fi
```

### Checking Directory Structure

```bash
if [ -d "$REPO_PATH/src" ] && [ -d "$REPO_PATH/tests" ]; then
    echo "Standard structure found"
    exit 0
fi
```

### Parsing Configuration Files

```bash
if grep -q "python.*3\\.9" "$REPO_PATH/.python-version"; then
    echo "Using Python 3.9+"
    exit 0
fi
```

### Using jq for JSON

```bash
if jq -e '.scripts.test' "$REPO_PATH/package.json" > /dev/null 2>&1; then
    echo "npm test script defined"
    exit 0
fi
```

## Contributing New Checks

1. Create your check directory and files
2. Test thoroughly on various repositories
3. Document any assumptions or requirements
4. Submit a PR with:
   - Check implementation
   - Metadata with appropriate weight
   - Update to README listing the new check

## Questions?

Open an issue or discussion in this repository.
