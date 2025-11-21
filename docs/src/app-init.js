/**
 * Application Initialization
 * Handles app bootstrap, data loading, filtering, and refresh logic
 */

import { loadServices, fetchCurrentChecksHash } from './api/registry.js';
import { isServiceStale } from './services/staleness.js';
import { initTheme, getCurrentTheme } from './services/theme.js';
import { renderServices } from './ui/service-card.js';
import { updateStats } from './ui/stats.js';
import { showToast } from './ui/toast.js';

/**
 * Filter and render services based on active filters
 * @returns {void}
 */
export function filterAndRenderServices() {
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

/**
 * Refresh data (re-fetch from catalog)
 * @returns {Promise<void>}
 */
export async function refreshData() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (!refreshBtn) return;

    // Disable button and show loading state
    const originalText = refreshBtn.innerHTML;
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<span class="spinner"></span> Refreshing...';

    try {
        showToast('Refreshing service data...', 'info');

        // Clear checks hash cache to force refetch
        window.currentChecksHash = null;
        window.checksHashTimestamp = 0;

        // Reload services
        const { services, usedAPI } = await loadServices();
        window.allServices = services;
        window.filteredServices = [...services];

        // Fetch checks hash
        window.currentChecksHash = await fetchCurrentChecksHash();
        window.checksHashTimestamp = Date.now();

        // Update UI
        updateStats();
        filterAndRenderServices();

        // Show success message
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

/**
 * Update theme toggle button icon
 * @param {string} theme - 'dark' or 'light'
 */
function updateThemeIcon(theme) {
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    if (sunIcon && moonIcon) {
        if (theme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }
}

/**
 * Initialize application on page load
 * @returns {Promise<void>}
 */
export async function initializeApp() {
    try {
        // Initialize theme early to prevent flash
        initTheme();
        updateThemeIcon(getCurrentTheme());

        // Load services
        const { services } = await loadServices();
        window.allServices = services;
        window.filteredServices = [...services];

        // Fetch checks hash
        window.currentChecksHash = await fetchCurrentChecksHash();
        window.checksHashTimestamp = Date.now();

        // Initialize UI
        updateStats();
        filterAndRenderServices();

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
    }
}
