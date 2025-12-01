# Phase 1: Configuration System & ESLint

**Scope**: Create centralized configuration, fix ESLint
**Risk**: Low
**Files**: ~15

## Context

The codebase has hardcoded values scattered throughout:
- Repository owner (`feddericovonwernich`) hardcoded in `docs/src/api/registry.js:13-16`
- Rank thresholds (90/75/50) hardcoded in `action/utils/score-calculator.sh:40-52`
- Port 8080 hardcoded in `playwright.config.js:34,58-59`
- ESLint is too permissive (`no-console: "off"`, `no-unused-vars: "warn"`)

---

## Tasks

### 1.1 Create Configuration Files

Create the following new files:

**`docs/src/config/deployment.js`**:
```javascript
/**
 * Deployment configuration - centralizes environment-specific values
 * @module config/deployment
 */

/**
 * Detect repository owner from hostname or environment
 * @returns {string}
 */
function detectRepoOwner() {
    // Check environment variable first
    if (typeof process !== 'undefined' && process.env?.SCORECARD_REPO_OWNER) {
        return process.env.SCORECARD_REPO_OWNER;
    }

    // Browser context
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // Local development
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
            return window.SCORECARD_REPO_OWNER || 'feddericovonwernich';
        }
        // GitHub Pages: owner.github.io
        return hostname.split('.')[0] || 'feddericovonwernich';
    }

    return 'feddericovonwernich';
}

/** @type {import('../types').DeploymentConfig} */
export const DEPLOYMENT = {
    repoOwner: detectRepoOwner(),
    repoName: 'scorecards',
    catalogBranch: 'catalog',
    ports: {
        devServer: 8080,
        testServer: 8080
    },
    api: {
        githubBase: 'https://api.github.com',
        version: '2022-11-28',
        acceptHeader: 'application/vnd.github.v3+json'
    },
    git: {
        botName: 'scorecard-bot',
        botEmail: 'scorecard-bot@users.noreply.github.com'
    }
};

export { detectRepoOwner };
```

**`docs/src/config/scoring.js`**:
```javascript
/**
 * Scoring configuration - centralizes rank thresholds and weights
 * @module config/scoring
 */

/** @type {import('../types').ScoringConfig} */
export const SCORING = {
    ranks: {
        platinum: { threshold: 90, color: 'brightgreen', label: 'Platinum' },
        gold: { threshold: 75, color: 'green', label: 'Gold' },
        silver: { threshold: 50, color: 'yellow', label: 'Silver' },
        bronze: { threshold: 0, color: 'orange', label: 'Bronze' }
    },
    colors: {
        score: {
            excellent: { threshold: 80, color: 'brightgreen' },
            good: { threshold: 60, color: 'green' },
            fair: { threshold: 40, color: 'yellow' },
            poor: { threshold: 20, color: 'orange' },
            bad: { threshold: 0, color: 'red' }
        }
    },
    defaults: {
        checkWeight: 10,
        qualityThreshold: 60
    }
};

/**
 * Get rank for a given score
 * @param {number} score - Score value (0-100)
 * @returns {{name: string, color: string, label: string}}
 */
export function getRankForScore(score) {
    if (score >= SCORING.ranks.platinum.threshold) {
        return { name: 'platinum', ...SCORING.ranks.platinum };
    }
    if (score >= SCORING.ranks.gold.threshold) {
        return { name: 'gold', ...SCORING.ranks.gold };
    }
    if (score >= SCORING.ranks.silver.threshold) {
        return { name: 'silver', ...SCORING.ranks.silver };
    }
    return { name: 'bronze', ...SCORING.ranks.bronze };
}

/**
 * Get color for a given score
 * @param {number} score - Score value (0-100)
 * @returns {string}
 */
export function getColorForScore(score) {
    const { colors } = SCORING;
    if (score >= colors.score.excellent.threshold) return colors.score.excellent.color;
    if (score >= colors.score.good.threshold) return colors.score.good.color;
    if (score >= colors.score.fair.threshold) return colors.score.fair.color;
    if (score >= colors.score.poor.threshold) return colors.score.poor.color;
    return colors.score.bad.color;
}
```

**`docs/src/config/workflows.js`**:
```javascript
/**
 * Workflow configuration - centralizes workflow names and API settings
 * @module config/workflows
 */

/** @type {import('../types').WorkflowConfig} */
export const WORKFLOWS = {
    files: {
        triggerService: 'trigger-service-workflow.yml',
        createInstallPR: 'create-installation-pr.yml',
        scorecard: 'scorecard.yml'
    },
    polling: {
        default: 30000,
        min: 10000,
        max: 120000
    }
};

/**
 * Build workflow dispatch URL
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} workflowFile - Workflow filename
 * @returns {string}
 */
export function getWorkflowDispatchUrl(owner, repo, workflowFile) {
    return `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;
}
```

---

### 1.2 Update registry.js

**File**: `docs/src/api/registry.js`

Replace hardcoded values with imports from deployment config:

```javascript
// At top of file, add import:
import { DEPLOYMENT } from '../config/deployment.js';

// Replace detectRepoOwner function (lines 9-22) with:
const REPO_OWNER = DEPLOYMENT.repoOwner;
const REPO_NAME = DEPLOYMENT.repoName;
const BRANCH = DEPLOYMENT.catalogBranch;
```

---

### 1.3 Update workflow-triggers.js

**File**: `docs/src/api/workflow-triggers.js`

Replace hardcoded workflow names and API version:

```javascript
// At top of file, add imports:
import { DEPLOYMENT } from '../config/deployment.js';
import { WORKFLOWS, getWorkflowDispatchUrl } from '../config/workflows.js';

// Replace hardcoded API version (line 46):
// FROM: 'X-GitHub-Api-Version': '2022-11-28',
// TO:   'X-GitHub-Api-Version': DEPLOYMENT.api.version,

// Replace hardcoded workflow URLs with getWorkflowDispatchUrl calls
```

---

### 1.4 Update playwright.config.js

**File**: `playwright.config.js`

Make port configurable:

```javascript
// At top:
const TEST_PORT = process.env.TEST_PORT || 8080;

// Update baseURL (line 34):
baseURL: `http://localhost:${TEST_PORT}/`,

// Update webServer (lines 58-59):
command: `python3 -m http.server ${TEST_PORT} --directory docs`,
port: TEST_PORT,
```

---

### 1.5 Fix ESLint Configuration

**File**: `.eslintrc.json`

Replace entire file with:
```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "indent": ["error", 4],
    "linebreak-style": ["error", "unix"],
    "quotes": ["error", "single", { "avoidEscape": true }],
    "semi": ["error", "always"],
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"]
  }
}
```

---

### 1.6 Fix console.log Violations

After updating ESLint, run `npm run lint` and fix all console.log violations:

**Files with console.log to fix**:
- `docs/src/main.js` (lines 320, 347, 571-572, 744)
- `docs/src/api/registry.js` (lines 94, 98, 117-119, 139, 148, 192, 216, 223, 242)
- `docs/src/ui/actions-widget.js` (multiple lines)

Replace with:
- Debugging logs: Remove entirely
- Error logs: Change to `console.error()`
- Important status: Keep if necessary, but prefer silent operation

---

## Verification

```bash
# Run ESLint - should pass with no errors
npm run lint

# Run tests to ensure nothing broke
npm test

# Verify config imports work
node -e "import('./docs/src/config/deployment.js').then(m => console.log(m.DEPLOYMENT))"
```

---

## Files Changed Summary

### New Files
- `docs/src/config/deployment.js`
- `docs/src/config/scoring.js`
- `docs/src/config/workflows.js`

### Modified Files
- `docs/src/api/registry.js`
- `docs/src/api/workflow-triggers.js`
- `playwright.config.js`
- `.eslintrc.json`
- `docs/src/main.js`
- `docs/src/ui/actions-widget.js`
