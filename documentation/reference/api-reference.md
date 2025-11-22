# API Reference

Comprehensive reference for the Scorecards Catalog UI JavaScript modules.

## Table of Contents

- [Overview](#overview)
- [Module System](#module-system)
- [API Modules](#api-modules)
- [UI Modules](#ui-modules)
- [Utility Modules](#utility-modules)
- [Service Modules](#service-modules)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

The Scorecards Catalog is a single-page application that displays service quality scores and rankings. The UI is built with vanilla JavaScript ES6 modules, providing a lightweight and performant experience.

**Architecture:**
- **API Modules** (`docs/src/api/`) - GitHub API client and registry fetchers
- **UI Modules** (`docs/src/ui/`) - Components for rendering services, filters, stats, and modals
- **Utility Modules** (`docs/src/utils/`) - Pure utility functions for formatting, DOM manipulation, etc.
- **Service Modules** (`docs/src/services/`) - Authentication and staleness detection

**Data Flow:**
1. Application initializes and loads consolidated registry from GitHub
2. Services are filtered and sorted based on user selections
3. UI components render service cards, statistics, and filters
4. User interactions trigger state updates and re-renders

---

## Module System

### Module Loading

All modules are ES6 modules loaded dynamically by the main application. Modules export functions and constants that can be imported by other modules.

```javascript
// Example module structure
import { formatRelativeTime } from './utils/formatting.js';
import { fetchConsolidatedRegistry } from './api/registry.js';

// Use imported functions
const services = await fetchConsolidatedRegistry();
const timeAgo = formatRelativeTime(service.timestamp);
```

### Global State

The catalog UI maintains global state for:
- `allServices` - Complete service registry
- `filteredServices` - Services after applying filters
- `currentChecksHash` - Hash for staleness detection
- Filter state (rank, team, search query, etc.)

---

## API Modules

### `api/github.js`

GitHub API client for interacting with GitHub's REST API.

#### `githubApiRequest(endpoint, options)`

Makes an authenticated GitHub API request.

**Parameters:**
- `endpoint` (string) - API endpoint without base URL (e.g., `/repos/org/repo`)
- `options` (Object) - Fetch options (optional)

**Returns:**
- `Promise<Response>` - Fetch Response object

**Example:**
```javascript
const response = await githubApiRequest('/repos/my-org/my-repo');
const repo = await response.json();
```

#### `checkRateLimit()`

Checks GitHub API rate limit status.

**Returns:**
- `Promise<Object>` - Rate limit info with `remaining`, `limit`, `reset` properties

**Example:**
```javascript
const rateLimit = await checkRateLimit();
console.log(`${rateLimit.remaining}/${rateLimit.limit} requests remaining`);
```

#### `fetchWorkflowRuns(org, repo, options)`

Fetches workflow runs for a repository.

**Parameters:**
- `org` (string) - Repository owner/organization
- `repo` (string) - Repository name
- `options` (Object) - Query options (optional)
  - `per_page` (number) - Results per page (default: 25)

**Returns:**
- `Promise<Array<Object>>` - Array of workflow run objects

**Example:**
```javascript
const runs = await fetchWorkflowRuns('my-org', 'my-repo', { per_page: 10 });
console.log(`Found ${runs.length} workflow runs`);
```

---

### `api/registry.js`

Functions for fetching and parsing service registry data.

#### `fetchConsolidatedRegistry()`

Fetches the consolidated registry containing all services.

**Returns:**
- `Promise<Array<Service>>` - Array of service objects

**Throws:**
- `Error` - If registry cannot be fetched or parsed

**Example:**
```javascript
try {
    const services = await fetchConsolidatedRegistry();
    console.log(`Loaded ${services.length} services`);
} catch (error) {
    console.error('Failed to load registry:', error);
}
```

#### `fetchServiceRegistry(org, repo)`

Fetches registry data for a specific service.

**Parameters:**
- `org` (string) - GitHub organization
- `repo` (string) - Repository name

**Returns:**
- `Promise<Service>` - Service object with full details

**Example:**
```javascript
const service = await fetchServiceRegistry('my-org', 'my-service');
console.log(`Score: ${service.score}%, Rank: ${service.rank}`);
```

#### `getRepoOwner()` / `getRepoName()`

Gets the repository owner/name from the current page URL.

**Returns:**
- `string` - Organization or repository name

---

### `api/workflow-triggers.js`

Functions for triggering GitHub Actions workflows.

#### `triggerWorkflow(org, repo, workflowId)`

Triggers a workflow in a service repository.

**Parameters:**
- `org` (string) - Repository owner
- `repo` (string) - Repository name
- `workflowId` (string) - Workflow filename or ID

**Returns:**
- `Promise<Response>` - GitHub API response (204 on success)

**Throws:**
- `Error` - If trigger fails or authentication required

**Example:**
```javascript
try {
    await triggerWorkflow('my-org', 'my-service', 'scorecards.yml');
    showToast('Workflow triggered successfully', 'success');
} catch (error) {
    showToast(`Failed: ${error.message}`, 'error');
}
```

---

## UI Modules

### `ui/service-card.js`

Renders service cards in the catalog grid.

#### `renderServices()`

Renders the services grid with filtered services.

**Global Dependencies:**
- `filteredServices` - Array of services to render
- `currentChecksHash` - Current checks hash for staleness detection

**Side Effects:**
- Updates `#services-grid` DOM element

**Example:**
```javascript
// After filtering services
filteredServices = applyFilters(allServices, currentFilters);
renderServices();
```

---

### `ui/filters.js`

Handles service filtering and search functionality.

#### `initializeFilters()`

Initializes filter controls and event listeners.

**Side Effects:**
- Attaches event listeners to filter elements
- Populates filter dropdowns with available options

#### `applyFilters(services, filters)`

Applies active filters to services array.

**Parameters:**
- `services` (Array<Service>) - Services to filter
- `filters` (Object) - Filter criteria
  - `rank` (string) - Filter by rank (optional)
  - `team` (string) - Filter by team (optional)
  - `search` (string) - Search query (optional)
  - `staleOnly` (boolean) - Show only stale services (optional)

**Returns:**
- `Array<Service>` - Filtered services

**Example:**
```javascript
const filters = {
    rank: 'gold',
    search: 'api',
    staleOnly: false
};
const filtered = applyFilters(allServices, filters);
```

---

### `ui/stats.js`

Calculates and displays aggregate statistics.

#### `renderStatistics(services)`

Calculates and renders statistics for all services.

**Parameters:**
- `services` (Array<Service>) - Services to analyze

**Side Effects:**
- Updates statistics DOM elements

**Calculates:**
- Total services count
- Average score
- Rank distribution (Bronze, Silver, Gold, Platinum)
- Stale services count

**Example:**
```javascript
renderStatistics(allServices);
```

---

### `ui/modals.js`

Modal dialog management.

#### `showServiceDetail(org, repo)`

Shows detailed modal for a specific service.

**Parameters:**
- `org` (string) - Repository owner
- `repo` (string) - Repository name

**Side Effects:**
- Fetches service details
- Displays modal with service information, check results, and links

**Example:**
```javascript
// Typically called from card click event
showServiceDetail('my-org', 'my-service');
```

#### `closeModal()`

Closes the currently open modal.

---

### `ui/toast.js`

Toast notification system.

#### `showToast(message, type)`

Displays a toast notification.

**Parameters:**
- `message` (string) - Message to display
- `type` (string) - Toast type: `'success'`, `'error'`, `'info'`, `'warning'`

**Example:**
```javascript
showToast('Workflow triggered successfully', 'success');
showToast('Failed to trigger workflow', 'error');
```

---

## Utility Modules

### `utils/formatting.js`

Pure utility functions for formatting data.

#### `formatRelativeTime(timestamp)`

Formats timestamp as relative time.

**Parameters:**
- `timestamp` (string|Date) - ISO timestamp or Date object

**Returns:**
- `string` - Relative time (e.g., "5 minutes ago", "2 days ago")

**Example:**
```javascript
const timeAgo = formatRelativeTime('2024-01-15T12:00:00Z');
// "2 hours ago"
```

#### `formatDate(dateString)`

Formats date in human-readable format.

**Parameters:**
- `dateString` (string) - ISO date string

**Returns:**
- `string` - Formatted date (e.g., "Jan 15, 2024")

#### `escapeHtml(text)`

Escapes HTML special characters to prevent XSS.

**Parameters:**
- `text` (string) - Text to escape

**Returns:**
- `string` - HTML-safe text

**Example:**
```javascript
const safe = escapeHtml(userInput);
element.innerHTML = `<div>${safe}</div>`;
```

#### `capitalize(text)`

Capitalizes first letter of a string.

**Parameters:**
- `text` (string) - Text to capitalize

**Returns:**
- `string` - Capitalized text

---

### `utils/clipboard.js`

Clipboard operations.

#### `copyToClipboard(text)`

Copies text to clipboard.

**Parameters:**
- `text` (string) - Text to copy

**Returns:**
- `Promise<boolean>` - True if successful

**Example:**
```javascript
const success = await copyToClipboard('https://github.com/org/repo');
if (success) {
    showToast('Copied to clipboard', 'success');
}
```

---

### `utils/crypto.js`

Cryptographic utilities.

#### `hashString(text)`

Generates SHA-256 hash of a string (browser API).

**Parameters:**
- `text` (string) - Text to hash

**Returns:**
- `Promise<string>` - Hex-encoded hash

**Example:**
```javascript
const hash = await hashString('my-data');
```

---

### `utils/dom.js`

DOM manipulation utilities.

#### `createElement(tag, attributes, children)`

Creates a DOM element with attributes and children.

**Parameters:**
- `tag` (string) - HTML tag name
- `attributes` (Object) - Element attributes (optional)
- `children` (Array|string) - Child elements or text (optional)

**Returns:**
- `HTMLElement` - Created element

**Example:**
```javascript
const button = createElement('button',
    { class: 'btn', 'data-id': '123' },
    'Click me'
);
```

---

## Service Modules

### `services/auth.js`

Authentication and token management.

#### `getToken()`

Gets the stored GitHub personal access token.

**Returns:**
- `string|null` - Token if set, null otherwise

#### `setToken(token)`

Stores a GitHub personal access token.

**Parameters:**
- `token` (string) - GitHub PAT

**Security Note:** Tokens are stored in localStorage. Never commit tokens to version control.

---

### `services/staleness.js`

Staleness detection for service results.

#### `isServiceStale(service, currentHash)`

Determines if service results are stale.

**Parameters:**
- `service` (Service) - Service object
- `currentHash` (string) - Current checks hash

**Returns:**
- `boolean` - True if service results are stale

**Logic:**
- Compares service's `checks_hash` with current `checks_hash`
- Stale results indicate checks have changed since last run

**Example:**
```javascript
const stale = isServiceStale(service, currentChecksHash);
if (stale) {
    console.log('Service needs to re-run checks');
}
```

---

## Type Definitions

### Service

Represents a service in the catalog.

```typescript
interface Service {
    org: string;                      // GitHub organization
    repo: string;                     // Repository name
    name: string;                     // Service display name
    score: number;                    // Quality score (0-100)
    rank: string;                     // 'bronze' | 'silver' | 'gold' | 'platinum'
    team?: string;                    // Team name (optional)
    description?: string;             // Service description (optional)
    has_api: boolean;                 // Whether service has API
    installed: boolean;               // Whether scorecard workflow is installed
    is_stale?: boolean;               // Whether results are stale
    checks: Array<Check>;             // Check results
    checks_hash: string;              // Hash of check implementations
    checks_count: number;             // Total number of checks
    default_branch: string;           // Default branch name
    timestamp: string;                // ISO 8601 timestamp of last run
    links?: Array<Link>;              // Custom links
    openapi?: Object;                 // OpenAPI configuration
    contributors?: Array<Contributor>; // Recent contributors
}
```

### Check

Represents a single check result.

```typescript
interface Check {
    name: string;           // Check name
    status: 'pass' | 'fail'; // Check result
    weight: number;         // Points value
    category: string;       // Category (documentation, testing, etc.)
    description?: string;   // Check description
    remediation?: string;   // How to fix if failed
}
```

### Link

Custom link for a service.

```typescript
interface Link {
    name: string;  // Link display name
    url: string;   // Link URL
}
```

---

## Error Handling

All async functions may throw errors. Always use try-catch or .catch():

```javascript
// Async/await with try-catch
try {
    const services = await fetchConsolidatedRegistry();
    renderServices(services);
} catch (error) {
    console.error('Failed to load services:', error);
    showToast('Unable to load catalog', 'error');
}

// Promise with .catch()
fetchServiceRegistry('my-org', 'my-service')
    .then(service => showServiceDetail(service))
    .catch(error => showToast(error.message, 'error'));
```

### Common Error Types

- **Network Errors** - Failed API requests, timeout, no connection
- **Authentication Errors** - Missing or invalid GitHub token
- **Rate Limit Errors** - GitHub API rate limit exceeded
- **Data Errors** - Invalid JSON, missing required fields

### Error Recovery

```javascript
// Retry with fallback
async function loadRegistry() {
    try {
        return await fetchConsolidatedRegistry();
    } catch (error) {
        console.error('Primary fetch failed, trying fallback:', error);
        // Try alternative source or show error UI
        showToast('Failed to load catalog. Please refresh.', 'error');
        return [];
    }
}
```

---

## Examples

### Example 1: Load and Display Services

```javascript
async function initializeCatalog() {
    try {
        // Fetch all services
        const services = await fetchConsolidatedRegistry();
        console.log(`Loaded ${services.length} services`);

        // Store globally
        window.allServices = services;
        window.filteredServices = services;

        // Render
        renderServices();
        renderStatistics(services);

        // Initialize filters
        initializeFilters();

    } catch (error) {
        console.error('Failed to initialize catalog:', error);
        showToast('Failed to load catalog', 'error');
    }
}
```

### Example 2: Filter Services

```javascript
function filterServices() {
    const rankFilter = document.getElementById('rank-filter').value;
    const searchQuery = document.getElementById('search-input').value;
    const staleOnly = document.getElementById('stale-only').checked;

    const filters = {
        rank: rankFilter,
        search: searchQuery,
        staleOnly: staleOnly
    };

    filteredServices = applyFilters(allServices, filters);
    renderServices();

    // Update count
    document.getElementById('service-count').textContent =
        `${filteredServices.length} service${filteredServices.length !== 1 ? 's' : ''}`;
}

// Attach to filter controls
document.getElementById('rank-filter').addEventListener('change', filterServices);
document.getElementById('search-input').addEventListener('input', filterServices);
```

### Example 3: Trigger Workflow

```javascript
async function retriggerService(org, repo, button) {
    // Disable button
    button.disabled = true;
    button.textContent = 'Triggering...';

    try {
        await triggerWorkflow(org, repo, 'scorecards.yml');
        showToast(`Workflow triggered for ${org}/${repo}`, 'success');
        button.textContent = 'Triggered ✓';

        // Refresh after delay
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        showToast(`Failed: ${error.message}`, 'error');
        button.disabled = false;
        button.textContent = 'Retry';
    }
}
```

### Example 4: Calculate Statistics

```javascript
function calculateStats(services) {
    const stats = {
        total: services.length,
        averageScore: 0,
        ranks: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
        stale: 0
    };

    let totalScore = 0;

    services.forEach(service => {
        totalScore += service.score;
        stats.ranks[service.rank]++;
        if (isServiceStale(service, currentChecksHash)) {
            stats.stale++;
        }
    });

    stats.averageScore = Math.round(totalScore / services.length);

    return stats;
}

// Use stats
const stats = calculateStats(allServices);
console.log(`Average score: ${stats.averageScore}%`);
console.log(`Platinum services: ${stats.ranks.platinum}`);
```

---

## Browser Compatibility

The catalog UI uses modern JavaScript features:

- **ES6 Modules** (import/export)
- **Async/Await**
- **Fetch API**
- **Template Literals**
- **Arrow Functions**
- **Destructuring**
- **Optional Chaining** (?.)
- **Nullish Coalescing** (??)

**Minimum browser versions:**
- Chrome/Edge: 91+
- Firefox: 89+
- Safari: 15+

For older browsers, transpile with Babel and polyfill missing features.

---

## See Also

- [Configuration Reference](configuration.md) - Scorecard configuration options
- [Workflows Reference](workflows.md) - GitHub Actions workflows
- [Glossary](glossary.md) - Terminology and concepts
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution guidelines
