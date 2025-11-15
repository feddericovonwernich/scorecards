# Shared Check Libraries

This directory contains shared utilities and constants used by multiple checks.

## Files

### `common-paths.js`

Common file path patterns for finding various files in repositories.

**Usage:**

```javascript
const commonPaths = require('../lib/common-paths.js');

// Find OpenAPI spec
for (const path of commonPaths.openapi) {
  if (fs.existsSync(`${repoPath}/${path}`)) {
    console.log(`Found OpenAPI spec at: ${path}`);
    break;
  }
}
```

**Available patterns:**
- `commonPaths.openapi` - OpenAPI/Swagger spec locations
- `commonPaths.ci` - CI configuration files
- `commonPaths.readme` - README file variations
- `commonPaths.license` - LICENSE file variations
- `commonPaths.testDirs` - Common test directory names
- `commonPaths.testPatterns` - Test file patterns

## Adding New Shared Utilities

When you find yourself duplicating logic across multiple checks:

1. Extract the common code to a new file in this directory
2. Document it in this README
3. Update existing checks to use the shared code
4. Add tests for the shared utility
