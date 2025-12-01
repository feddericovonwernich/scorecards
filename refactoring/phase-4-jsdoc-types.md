# Phase 4: JSDoc Types & Type Checking

**Scope**: Add JSDoc type definitions, enable checkJs
**Risk**: Low
**Files**: ~20

## Context

No type checking is enabled. Functions lack documentation and type safety. This makes the codebase harder to maintain and prone to runtime errors.

---

## Tasks

### 4.1 Create Type Definitions

**File**: `docs/src/types/index.js` (NEW)

```javascript
/**
 * @file JSDoc type definitions for the scorecards application
 * These types enable IDE support and type checking via jsconfig.json
 */

// ============= Configuration Types =============

/**
 * @typedef {Object} DeploymentConfig
 * @property {string} repoOwner - GitHub repository owner
 * @property {string} repoName - GitHub repository name
 * @property {string} catalogBranch - Branch containing catalog data
 * @property {{devServer: number, testServer: number}} ports - Server ports
 * @property {{githubBase: string, version: string, acceptHeader: string}} api - API settings
 * @property {{botName: string, botEmail: string}} git - Git bot settings
 */

/**
 * @typedef {Object} RankConfig
 * @property {number} threshold - Minimum score for this rank
 * @property {string} color - Badge color
 * @property {string} label - Display label
 */

/**
 * @typedef {Object} ScoringConfig
 * @property {{platinum: RankConfig, gold: RankConfig, silver: RankConfig, bronze: RankConfig}} ranks
 * @property {{score: Object<string, {threshold: number, color: string}>}} colors
 * @property {{checkWeight: number, qualityThreshold: number}} defaults
 */

/**
 * @typedef {Object} WorkflowConfig
 * @property {{triggerService: string, createInstallPR: string, scorecard: string}} files
 * @property {{default: number, min: number, max: number}} polling
 */

// ============= Data Types =============

/**
 * @typedef {Object} TeamInfo
 * @property {string} primary - Primary team name
 * @property {string[]} all - All team names
 * @property {string} source - Source of team info (CODEOWNERS, config, etc.)
 */

/**
 * @typedef {Object} CheckResult
 * @property {string} id - Check identifier (e.g., "01-readme")
 * @property {string} name - Human-readable check name
 * @property {boolean} passed - Whether the check passed
 * @property {string} status - Status string (passed, failed, skipped, error)
 * @property {string} message - Result message
 * @property {number} weight - Check weight for scoring
 * @property {string} [details] - Additional details (JSON string or text)
 * @property {string} [category] - Check category
 */

/**
 * @typedef {Object} InstallationPR
 * @property {number} number - PR number
 * @property {string} url - PR URL
 * @property {string} status - PR status (open, merged, closed)
 */

/**
 * @typedef {Object} ServiceData
 * @property {string} org - Organization name
 * @property {string} repo - Repository name
 * @property {string} name - Service display name
 * @property {number} score - Overall score (0-100)
 * @property {string} rank - Rank (platinum, gold, silver, bronze)
 * @property {string} rank_color - Badge color for rank
 * @property {string} score_color - Badge color for score
 * @property {TeamInfo|null} team - Team information
 * @property {CheckResult[]} checks - Check results
 * @property {string} last_updated - ISO timestamp
 * @property {string} default_branch - Default git branch
 * @property {InstallationPR} [installation_pr] - Installation PR info
 */

/**
 * @typedef {Object} RegistryEntry
 * @property {string} org
 * @property {string} repo
 * @property {string} name
 * @property {number} score
 * @property {string} rank
 * @property {TeamInfo|null} team
 * @property {string} last_updated
 */

// ============= UI State Types =============

/**
 * @typedef {Object} FilterState
 * @property {Map<string, Set<string>>} active - Active filters by category
 * @property {string} search - Search query
 * @property {string} sort - Sort order
 */

/**
 * @typedef {Object} AuthState
 * @property {string|null} pat - GitHub Personal Access Token
 * @property {boolean} validated - Whether token is validated
 */

/**
 * @typedef {Object} UIState
 * @property {string|null} currentModal - Currently open modal ID
 * @property {string|null} checksHash - Hash of current checks data
 */

/**
 * @typedef {Object} ServicesState
 * @property {ServiceData[]} all - All services
 * @property {ServiceData[]} filtered - Filtered services
 * @property {boolean} loading - Loading state
 */

/**
 * @typedef {Object} AppState
 * @property {ServicesState} services
 * @property {FilterState} filters
 * @property {AuthState} auth
 * @property {UIState} ui
 */

// ============= API Types =============

/**
 * @typedef {Object} FetchResult
 * @property {Response} response - Fetch response
 * @property {boolean} usedAPI - Whether API was used (vs raw URL)
 */

/**
 * @typedef {Object} WorkflowRun
 * @property {number} id - Run ID
 * @property {string} name - Workflow name
 * @property {string} status - Run status
 * @property {string} conclusion - Run conclusion
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Update timestamp
 * @property {string} html_url - URL to view run
 */

export {};
```

---

### 4.2 Create jsconfig.json

**File**: `jsconfig.json` (NEW, at repo root)

```json
{
  "compilerOptions": {
    "checkJs": true,
    "strictNullChecks": true,
    "noImplicitAny": false,
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@config/*": ["docs/src/config/*"],
      "@utils/*": ["docs/src/utils/*"],
      "@ui/*": ["docs/src/ui/*"],
      "@api/*": ["docs/src/api/*"],
      "@services/*": ["docs/src/services/*"],
      "@types": ["docs/src/types/index.js"]
    }
  },
  "include": [
    "docs/src/**/*.js",
    "tests/**/*.js"
  ],
  "exclude": [
    "node_modules",
    "docs/lib/**"
  ]
}
```

---

### 4.3 Create types directory

```bash
mkdir -p docs/src/types
```

---

### 4.4 Add JSDoc to Key Files

Add type annotations to exported functions. Priority files:

#### `docs/src/api/registry.js`

```javascript
/**
 * Fetch with hybrid authentication (API with PAT or raw URL fallback)
 * @param {string} path - Path to resource (relative to repository root)
 * @param {Object} [options] - Fetch options
 * @returns {Promise<import('../types').FetchResult>}
 */
export async function fetchWithHybridAuth(path, options = {}) {
    // ...
}
```

#### `docs/src/utils/formatting.js`

```javascript
/**
 * Format relative time from timestamp
 * @param {string} timestamp - ISO 8601 timestamp
 * @returns {string} Relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp) {
    // ...
}

/**
 * Escape HTML special characters
 * @param {string} text - Raw text
 * @returns {string} HTML-safe text
 */
export function escapeHtml(text) {
    // ...
}
```

#### `docs/src/ui/service-modal.js`

```javascript
/**
 * Show service detail modal
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 * @returns {Promise<void>}
 */
export async function showServiceDetail(org, repo) {
    // ...
}

/**
 * Close the service modal
 * @returns {void}
 */
export function closeModal() {
    // ...
}
```

#### `docs/src/services/auth.js`

```javascript
/**
 * Set GitHub PAT for authenticated requests
 * @param {string|null} token - GitHub Personal Access Token
 * @returns {void}
 */
export function setGithubPAT(token) {
    // ...
}

/**
 * Get current GitHub PAT
 * @returns {string|null}
 */
export function getGithubPAT() {
    // ...
}

/**
 * Validate GitHub token
 * @param {string} token - Token to validate
 * @returns {Promise<boolean>}
 */
export async function validateToken(token) {
    // ...
}
```

---

### 4.5 Fix Type Errors

After enabling checkJs, run:
```bash
npx tsc --noEmit
```

Fix any reported errors. Common issues:
- Null checks needed
- Missing function parameters
- Incorrect return types

Example fixes:

```javascript
// Before (type error: might be null)
const element = document.getElementById('my-id');
element.innerHTML = 'test';

// After (null check)
const element = document.getElementById('my-id');
if (element) {
    element.innerHTML = 'test';
}
```

---

## Verification

```bash
# Run TypeScript compiler in check mode
npx tsc --noEmit

# Verify no JSDoc errors
npm run lint

# IDE should now show type hints (test in VS Code)
```

---

## Files Changed Summary

### New Files
- `docs/src/types/index.js`
- `jsconfig.json`

### Modified Files
- `docs/src/api/registry.js` - Add JSDoc types
- `docs/src/utils/formatting.js` - Add JSDoc types
- `docs/src/ui/service-modal.js` - Add JSDoc types
- `docs/src/services/auth.js` - Add JSDoc types
- (Other files as needed to fix type errors)
