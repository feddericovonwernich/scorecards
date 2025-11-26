// Scorecards Catalog App
// Note: Repository configuration moved to src/api/registry.js

// State (defined on window for access from ES6 modules)
window.allServices = [];
window.filteredServices = [];
window.activeFilters = new Map(); // Multi-select filters: filter -> 'include' | 'exclude'
window.currentSort = 'score-desc';
window.searchQuery = '';
window.currentChecksHash = null;
window.checksHashTimestamp = 0;

// Tab navigation state
window.currentView = 'services'; // 'services' | 'teams'
window.allTeams = [];
window.filteredTeams = [];
window.teamsSort = 'services-desc';
window.teamsSearchQuery = '';
window.teamsActiveFilters = new Map();

// GitHub PAT State (in-memory only)
window.githubPAT = null;

// ============================================================================
// Staleness Detection Functions
// ============================================================================

// fetchCurrentChecksHash() - moved to src/api/registry.js (window.ScorecardModules.registry.fetchCurrentChecksHash)
// isServiceStale() - moved to src/services/staleness.js (window.isServiceStale)

// Format timestamp as relative time (e.g., "2 minutes ago")
// formatRelativeTime() - moved to src/utils/formatting.js

// Event listeners setup - moved to src/main.js

// ============================================================================
// App Initialization (moved to src/app-init.js)
// ============================================================================

// loadServices() - part of src/app-init.js (initializeApp)
// refreshData() - window.refreshData (via main.js)
// filterAndRenderServices() - window.filterAndRenderServices (via main.js)

// ============================================================================
// Utility Functions
// escapeHtml(), capitalize(), formatDate() - moved to src/utils/formatting.js

// Open API Explorer
function openApiExplorer(org, repo) {
    // Open API explorer in a new window with the service org and repo as query params
    const explorerUrl = `api-explorer.html?org=${encodeURIComponent(org)}&repo=${encodeURIComponent(repo)}`;
    window.open(explorerUrl, '_blank');
}

// Fallback clipboard copy for non-HTTPS contexts or older browsers
// Clipboard functions (fallbackCopyToClipboard, copyBadgeCode) - moved to src/utils/clipboard.js
// MD5 hash function - moved to src/utils/crypto.js

// ============================================================================
// Workflow Trigger Functions (moved to src/api/workflow-triggers.js)
// ============================================================================

// triggerServiceWorkflow() - window.triggerServiceWorkflow (via main.js)
// installService() - window.installService (via main.js)
// triggerBulkWorkflows() - window.triggerBulkWorkflows (via main.js)
// handleBulkTrigger() - window.handleBulkTrigger (via main.js)

// Legacy wrapper functions for backward compatibility
function getGitHubToken() {
    return window.getGitHubToken();
}

function clearGitHubToken() {
    window.clearGitHubToken();
}

// ============================================================================
// Toast Notification System
// ============================================================================

// Show toast notification
// Toast notification function - moved to src/ui/toast.js

// Service Modal Workflow State (exposed to ES6 modules via window)
window.currentServiceOrg = null;
window.currentServiceRepo = null;
window.serviceWorkflowRuns = [];
window.serviceWorkflowFilterStatus = 'all';
window.serviceWorkflowPollInterval = null;
window.serviceWorkflowPollIntervalTime = 30000; // Default 30 seconds
window.serviceWorkflowLoaded = false;
window.serviceDurationUpdateInterval = null;
