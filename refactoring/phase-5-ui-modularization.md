# Phase 5: UI Modularization

**Scope**: Split service-modal.js, create shared utilities
**Risk**: Medium-High
**Files**: ~15

## Context

`docs/src/ui/service-modal.js` is **1,095 lines** - a monolithic file handling:
- Modal header/stats rendering
- Tab navigation and switching
- Each tab's content (checks, API, contributors, workflows, badges, links)
- Data fetching and state management

This violates the single responsibility principle and makes the code hard to maintain.

---

## Tasks

### 5.1 Create Directory Structure

```bash
mkdir -p docs/src/ui/modals/service
mkdir -p docs/src/ui/modals/shared
```

---

### 5.2 Create Tab Manager

**File**: `docs/src/ui/modals/shared/tab-manager.js` (NEW)

```javascript
/**
 * Generic tab management utility
 * @module ui/modals/shared/tab-manager
 */

/**
 * @typedef {Object} TabConfig
 * @property {string} containerId - Modal container ID
 * @property {string} tabButtonSelector - Selector for tab buttons
 * @property {string} tabContentSelector - Selector for tab content
 * @property {string} activeClass - Class for active state
 * @property {Object<string, Function>} [onActivate] - Callbacks when tabs activate
 */

/**
 * Create a tab manager for a modal
 * @param {TabConfig} config
 * @returns {{switchTab: Function, getActiveTab: Function}}
 */
export function createTabManager(config) {
    const {
        containerId,
        tabButtonSelector = '.tab-btn',
        tabContentSelector = '.tab-content',
        activeClass = 'active',
        onActivate = {}
    } = config;

    const container = document.getElementById(containerId);
    if (!container) {
        throw new Error(`Container not found: ${containerId}`);
    }

    /**
     * Switch to a specific tab
     * @param {string} tabName - Tab identifier
     * @param {Event} [event] - Click event (optional)
     */
    function switchTab(tabName, event) {
        // Remove active from all buttons
        container.querySelectorAll(tabButtonSelector).forEach(btn => {
            btn.classList.remove(activeClass);
        });

        // Remove active from all content
        container.querySelectorAll(tabContentSelector).forEach(content => {
            content.classList.remove(activeClass);
        });

        // Activate clicked button
        if (event?.target) {
            event.target.classList.add(activeClass);
        } else {
            const btn = container.querySelector(`${tabButtonSelector}[data-tab="${tabName}"]`);
            if (btn) {
                btn.classList.add(activeClass);
            }
        }

        // Activate content
        const content = document.getElementById(`${tabName}-tab`);
        if (content) {
            content.classList.add(activeClass);
        }

        // Call activation callback if exists
        if (onActivate[tabName]) {
            onActivate[tabName]();
        }
    }

    /**
     * Get currently active tab name
     * @returns {string|null}
     */
    function getActiveTab() {
        const activeBtn = container.querySelector(`${tabButtonSelector}.${activeClass}`);
        return activeBtn?.dataset.tab || null;
    }

    return { switchTab, getActiveTab };
}
```

---

### 5.3 Create Service Data Loader

**File**: `docs/src/utils/service-data-loader.js` (NEW)

```javascript
/**
 * Service data loading and merging utilities
 * @module utils/service-data-loader
 */

import { fetchWithHybridAuth } from '../api/registry.js';

/**
 * Load complete service data from results and registry
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 * @returns {Promise<import('../types').ServiceData>}
 */
export async function loadServiceData(org, repo) {
    const resultsPath = `results/${org}/${repo}.json`;
    const registryPath = 'all-services.json';

    const [resultsResult, registryResult] = await Promise.all([
        fetchWithHybridAuth(resultsPath),
        fetchWithHybridAuth(registryPath)
    ]);

    if (!resultsResult.response.ok) {
        throw new Error(`Failed to load service results: ${resultsResult.response.status}`);
    }

    const data = await resultsResult.response.json();

    // Merge registry data if available
    if (registryResult.response.ok) {
        const registry = await registryResult.response.json();
        const entry = registry.find(s => s.org === org && s.repo === repo);
        if (entry) {
            if (entry.installation_pr) {
                data.installation_pr = entry.installation_pr;
            }
            if (entry.default_branch) {
                data.default_branch = entry.default_branch;
            }
        }
    }

    return data;
}

/**
 * Check if service data is stale
 * @param {string} lastUpdated - ISO timestamp
 * @param {number} [maxAgeHours=24] - Maximum age in hours
 * @returns {boolean}
 */
export function isServiceStale(lastUpdated, maxAgeHours = 24) {
    const updateTime = new Date(lastUpdated).getTime();
    const now = Date.now();
    const ageHours = (now - updateTime) / (1000 * 60 * 60);
    return ageHours > maxAgeHours;
}
```

---

### 5.4 Split service-modal.js

Extract into separate files. The original file becomes the orchestrator.

#### File Extraction Map

| New File | Functions to Extract | Original Lines |
|----------|---------------------|----------------|
| `header.js` | `renderStalenessWarning`, `renderOnDemandTrigger`, `renderModalHeader` | ~1-214 |
| `stats.js` | `renderModalStats` | ~216-248 |
| `tabs.js` | `renderTabs`, `switchTab`, `scrollTabs`, `updateTabScrollArrows` | ~255-277, 1015-1094 |
| `checks-tab.js` | `renderChecksTab`, `groupChecksByCategory` | ~280-406 |
| `api-tab.js` | `renderAPITab`, `parseOpenAPISummary`, `getOpenAPIInfo` | ~408-502 |
| `links-tab.js` | `renderLinksTab` | ~605-628 |
| `contributors-tab.js` | `renderContributorsTab` | ~630-697 |
| `workflows-tab.js` | `renderWorkflowsTab` | ~699-746 |
| `badges-tab.js` | `renderBadgesTab` | ~790-818 |
| `index.js` | `showServiceDetail`, `closeModal`, orchestration | Remaining |

---

#### Example: `docs/src/ui/modals/service/header.js`

```javascript
/**
 * Service modal header components
 * @module ui/modals/service/header
 */

import { formatRelativeTime, escapeHtml } from '../../../utils/formatting.js';
import { isServiceStale } from '../../../utils/service-data-loader.js';

/**
 * Render staleness warning if data is old
 * @param {import('../../../types').ServiceData} data
 * @returns {string} HTML string
 */
export function renderStalenessWarning(data) {
    if (!isServiceStale(data.last_updated)) {
        return '';
    }
    return `
        <div class="staleness-warning">
            Data is stale (last updated ${formatRelativeTime(data.last_updated)})
        </div>
    `;
}

/**
 * Render on-demand trigger button
 * @param {import('../../../types').ServiceData} data
 * @returns {string} HTML string
 */
export function renderOnDemandTrigger(data) {
    // ... implementation
}

/**
 * Render modal header
 * @param {import('../../../types').ServiceData} data
 * @returns {string} HTML string
 */
export function renderModalHeader(data) {
    // ... implementation
}
```

---

#### Example: `docs/src/ui/modals/service/index.js` (Orchestrator)

```javascript
/**
 * Service modal - main orchestrator
 * @module ui/modals/service
 */

import { renderModalHeader } from './header.js';
import { renderModalStats } from './stats.js';
import { renderTabs, initTabScroll } from './tabs.js';
import { renderChecksTab } from './checks-tab.js';
import { renderAPITab } from './api-tab.js';
import { renderContributorsTab } from './contributors-tab.js';
import { renderWorkflowsTab } from './workflows-tab.js';
import { renderBadgesTab } from './badges-tab.js';
import { renderLinksTab } from './links-tab.js';
import { loadServiceData } from '../../../utils/service-data-loader.js';
import { createTabManager } from '../shared/tab-manager.js';

// Re-export for backwards compatibility
export { renderModalHeader, renderModalStats, renderTabs };

/** @type {string|null} */
let currentServiceOrg = null;
/** @type {string|null} */
let currentServiceRepo = null;

/**
 * Show service detail modal
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 */
export async function showServiceDetail(org, repo) {
    currentServiceOrg = org;
    currentServiceRepo = repo;

    const modal = document.getElementById('service-modal');
    const content = document.getElementById('service-modal-content');

    if (!modal || !content) {
        console.error('Modal elements not found');
        return;
    }

    content.innerHTML = '<div class="loading">Loading service details...</div>';
    modal.classList.remove('hidden');

    try {
        const data = await loadServiceData(org, repo);
        renderServiceModal(data);
    } catch (error) {
        console.error('Failed to load service:', error);
        content.innerHTML = `<div class="error">Failed to load service: ${error.message}</div>`;
    }
}

/**
 * Render the full service modal
 * @param {import('../../../types').ServiceData} data
 */
function renderServiceModal(data) {
    const content = document.getElementById('service-modal-content');
    if (!content) {
        return;
    }

    content.innerHTML = `
        ${renderModalHeader(data)}
        ${renderModalStats(data)}
        ${renderTabs()}
        <div id="check-results-tab" class="tab-content active">
            ${renderChecksTab(data)}
        </div>
        <div id="api-tab" class="tab-content">
            ${renderAPITab(data)}
        </div>
        <div id="contributors-tab" class="tab-content">
            ${renderContributorsTab(data)}
        </div>
        <div id="workflows-tab" class="tab-content">
            ${renderWorkflowsTab(data)}
        </div>
        <div id="badges-tab" class="tab-content">
            ${renderBadgesTab(data)}
        </div>
        <div id="links-tab" class="tab-content">
            ${renderLinksTab(data)}
        </div>
    `;

    initTabScroll();

    // Setup tab manager with lazy loading
    createTabManager({
        containerId: 'service-modal',
        onActivate: {
            'workflows': () => loadWorkflowsIfNeeded()
        }
    });
}

/**
 * Close the service modal
 */
export function closeModal() {
    const modal = document.getElementById('service-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentServiceOrg = null;
    currentServiceRepo = null;
}
```

---

### 5.5 Update Imports

Update `docs/app.js` and any other files that import from `service-modal.js`:

```javascript
// Change from:
import { showServiceDetail, closeModal } from './src/ui/service-modal.js';

// To:
import { showServiceDetail, closeModal } from './src/ui/modals/service/index.js';
```

---

### 5.6 Create Backwards Compatibility Shim

**File**: `docs/src/ui/service-modal.js` (keep as compatibility shim)

```javascript
/**
 * Backwards compatibility shim
 * @deprecated Import from './modals/service/index.js' instead
 */
export * from './modals/service/index.js';
```

---

## Verification

```bash
# Run all tests
npm test

# Run E2E tests specifically for modal
npx playwright test tests/e2e/service-modal.spec.js

# Manual testing checklist:
# - Open service modal
# - Switch between all tabs
# - Verify data loads correctly
# - Test refresh functionality
# - Test close button
```

---

## Files Changed Summary

### New Files
- `docs/src/ui/modals/shared/tab-manager.js`
- `docs/src/ui/modals/service/index.js`
- `docs/src/ui/modals/service/header.js`
- `docs/src/ui/modals/service/stats.js`
- `docs/src/ui/modals/service/tabs.js`
- `docs/src/ui/modals/service/checks-tab.js`
- `docs/src/ui/modals/service/api-tab.js`
- `docs/src/ui/modals/service/contributors-tab.js`
- `docs/src/ui/modals/service/workflows-tab.js`
- `docs/src/ui/modals/service/badges-tab.js`
- `docs/src/ui/modals/service/links-tab.js`
- `docs/src/utils/service-data-loader.js`

### Modified Files
- `docs/src/ui/service-modal.js` - Convert to shim
- `docs/app.js` - Update imports
- `docs/src/main.js` - Update imports if needed
