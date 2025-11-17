// Scorecards Catalog App

// Configuration (duplicated in src/api/registry.js - will be removed in Phase B)
const REPO_OWNER = window.location.hostname.split('.')[0] || 'your-org';
const REPO_NAME = 'scorecards';
const BRANCH = 'catalog';
const RAW_BASE_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;

// State (defined on window for access from ES6 modules)
window.allServices = [];
window.filteredServices = [];
window.activeFilters = new Map(); // Multi-select filters: filter -> 'include' | 'exclude'
window.currentSort = 'score-desc';
window.searchQuery = '';
window.currentChecksHash = null;
window.checksHashTimestamp = 0;

// GitHub PAT State (in-memory only)
window.githubPAT = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load services on page load (errors are handled and displayed by loadServices)
    // Event listeners are now initialized in src/main.js
    loadServices().catch(() => {
        // Error already handled and displayed by loadServices()
    });
});

// ============================================================================
// Staleness Detection Functions
// ============================================================================

// fetchCurrentChecksHash() - moved to src/api/registry.js (window.ScorecardModules.registry.fetchCurrentChecksHash)
// isServiceStale() - moved to src/services/staleness.js (window.isServiceStale)

// Format timestamp as relative time (e.g., "2 minutes ago")
// formatRelativeTime() - moved to src/utils/formatting.js

// Event listeners setup - moved to src/main.js

// Load Services from Registry (wrapper that delegates to registry module)
async function loadServices() {
    try {
        // Use registry module to load services
        const { services, usedAPI } = await window.ScorecardModules.registry.loadServices();

        // Update global window state
        window.allServices = services;
        window.filteredServices = [...services];

        // Fetch current checks hash for staleness detection
        window.currentChecksHash = await window.ScorecardModules.registry.fetchCurrentChecksHash();
        window.checksHashTimestamp = Date.now();

        // Update UI
        updateStats();
        filterAndRenderServices();

        // Return whether API was used for data freshness indication
        return { usedAPI };
    } catch (error) {
        console.error('Error loading services:', error);
        document.getElementById('services-grid').innerHTML = `
            <div class="empty-state">
                <h3>No Services Found</h3>
                <p>No services have run scorecards yet, or the registry is not available.</p>
                <p style="margin-top: 10px; font-size: 0.9rem; color: #999;">
                    Error: ${error.message}
                </p>
            </div>
        `;
        // Re-throw to allow callers (like refreshData) to detect failure
        throw error;
    }
}

// Refresh data (re-fetch from catalog; uses GitHub API with PAT, otherwise CDN)
async function refreshData() {
    const refreshBtn = document.getElementById('refresh-btn');

    if (!refreshBtn) return;

    // Disable button and show loading state
    const originalText = refreshBtn.innerHTML;
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<span class="spinner"></span> Refreshing...';

    try {
        // Show toast notification
        showToast('Refreshing service data...', 'info');

        // Clear checks hash cache to force refetch
        window.currentChecksHash = null;
        window.checksHashTimestamp = 0;

        // Reload all services
        const { usedAPI } = await loadServices();

        // Show appropriate success message based on data source
        const timestamp = new Date().toLocaleTimeString();
        if (usedAPI) {
            showToast(`Data refreshed successfully from GitHub API at ${timestamp}. (Fresh data, bypassed cache)`, 'success');
        } else {
            showToast(`Data refreshed from CDN at ${timestamp}. (Note: CDN cache may be up to 5 minutes old. Use GitHub PAT in settings for real-time data)`, 'success');
        }
    } catch (error) {
        console.error('Error refreshing data:', error);
        showToast(`Failed to refresh data: ${error.message}`, 'error');
    } finally {
        // Restore button state
        setTimeout(() => {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = originalText;
        }, 1000);
    }
}

// Filter and Render Services
function filterAndRenderServices() {
    // Filter
    window.filteredServices = window.allServices.filter(service => {
        // Multi-select filters with include/exclude (AND logic)
        if (window.activeFilters.size > 0) {
            for (const [filterName, filterState] of window.activeFilters) {
                // Determine if service matches this filter
                let matches = false;

                if (filterName === 'has-api') {
                    matches = service.has_api;
                } else if (filterName === 'stale') {
                    matches = isServiceStale(service, window.currentChecksHash);
                } else if (filterName === 'installed') {
                    matches = service.installed;
                } else if (filterName === 'platinum' || filterName === 'gold' || filterName === 'silver' || filterName === 'bronze') {
                    matches = service.rank === filterName;
                }

                // Apply include/exclude logic
                if (filterState === 'include') {
                    // Include: service must match
                    if (!matches) {
                        return false;
                    }
                } else if (filterState === 'exclude') {
                    // Exclude: service must NOT match
                    if (matches) {
                        return false;
                    }
                }
            }
        }

        // Search filter
        if (window.searchQuery) {
            const searchText = `${service.name} ${service.org} ${service.repo} ${service.team || ''}`.toLowerCase();
            if (!searchText.includes(window.searchQuery)) {
                return false;
            }
        }

        return true;
    });

    // Sort
    window.filteredServices.sort((a, b) => {
        switch (window.currentSort) {
            case 'score-desc':
                return b.score - a.score;
            case 'score-asc':
                return a.score - b.score;
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'updated-desc':
                return new Date(b.last_updated) - new Date(a.last_updated);
            default:
                return 0;
        }
    });

    renderServices();
}

// Export to window for use by ES6 modules
window.filterAndRenderServices = filterAndRenderServices;


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
