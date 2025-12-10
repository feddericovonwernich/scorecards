---
description: Check script guidelines for checks/**
globs: checks/**/*.js, checks/**/*.sh, checks/**/*.py
---

# Check Script Guidelines

## Console Logging

Check scripts are CLI tools that output to stdout. Add at file top:

```javascript
#!/usr/bin/env node
/* eslint-disable no-console */
```

Then use:
- `console.log()` for intended CLI output
- `console.error()` for error messages
- `process.exit(0)` for success, `process.exit(1)` for failure

## Script Structure

```javascript
#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';

const repoPath = process.env.SCORECARD_REPO_PATH || '.';

// Check logic here...

// Success
console.log('Check passed: description');
process.exit(0);

// Or failure
console.error('Check failed: reason');
process.exit(1);
```

## Shared Libraries

Check `checks/lib/` for shared utilities:
- `common-paths.js` - Standard file paths for OpenAPI, CI configs, etc.

## Exit Codes

- `0` - Check passed
- `1` - Check failed

## Environment

- `SCORECARD_REPO_PATH` - Path to repository being checked (defaults to `.`)

## Bash Check Scripts

Check scripts in bash follow the same exit code pattern:

```bash
#!/bin/bash
set -euo pipefail

REPO_PATH="${SCORECARD_REPO_PATH:-.}"

# Check logic here...

# Success
echo "Check passed: description"
exit 0

# Or failure
echo "Check failed: reason" >&2
exit 1
```

See `bash.md` rule for additional bash guidelines (strict mode, quoting, shared libraries).
