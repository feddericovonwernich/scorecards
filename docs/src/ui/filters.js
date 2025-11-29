/**
 * Filtering and Sorting
 * Functions for filtering and sorting services
 */

import { isServiceStale } from '../services/staleness.js';
import { countByRank } from '../utils/statistics.js';

/**
 * Filter services based on active filters and search query
 * @param {Array<Object>} services - Array of services
 * @param {Map} activeFilters - Map of active filters (filterName -> 'include'|'exclude')
 * @param {string} searchQuery - Search query string (lowercase)
 * @param {string} currentHash - Current checks hash for staleness detection
 * @returns {Array<Object>} Filtered services
 */
export function filterServices(services, activeFilters, searchQuery, currentHash) {
    return services.filter(service => {
        // Multi-select filters with include/exclude (AND logic)
        if (activeFilters && activeFilters.size > 0) {
            for (const [filterName, filterState] of activeFilters) {
                // Determine if service matches this filter
                let matches = false;

                if (filterName === 'has-api') {
                    matches = service.has_api;
                } else if (filterName === 'stale') {
                    matches = isServiceStale(service, currentHash);
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
        if (searchQuery) {
            const searchText = `${service.name} ${service.org} ${service.repo} ${service.team || ''}`.toLowerCase();
            if (!searchText.includes(searchQuery)) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Sort services by specified criteria
 * @param {Array<Object>} services - Array of services
 * @param {string} sortBy - Sort criteria (score-desc, score-asc, name-asc, name-desc, updated-desc)
 * @returns {Array<Object>} Sorted services (in-place sort)
 */
export function sortServices(services, sortBy) {
    services.sort((a, b) => {
        switch (sortBy) {
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
            case 'updated-asc':
                return new Date(a.last_updated) - new Date(b.last_updated);
            default:
                return 0;
        }
    });

    return services;
}

/**
 * Apply both filtering and sorting
 * @param {Array<Object>} services - Array of services
 * @param {Map} activeFilters - Map of active filters
 * @param {string} searchQuery - Search query
 * @param {string} sortBy - Sort criteria
 * @param {string} currentHash - Current checks hash
 * @returns {Array<Object>} Filtered and sorted services
 */
export function filterAndSort(services, activeFilters, searchQuery, sortBy, currentHash) {
    const filtered = filterServices(services, activeFilters, searchQuery, currentHash);
    return sortServices(filtered, sortBy);
}

/**
 * Get statistics about filtered services
 * @param {Array<Object>} allServices - All services
 * @param {Array<Object>} filteredServices - Filtered services
 * @param {string} currentHash - Current checks hash
 * @returns {Object} Statistics
 */
export function getFilterStats(allServices, filteredServices, currentHash) {
    const staleCount = allServices.filter(s => isServiceStale(s, currentHash)).length;
    const installedCount = allServices.filter(s => s.installed).length;
    const hasApiCount = allServices.filter(s => s.has_api).length;

    return {
        total: allServices.length,
        filtered: filteredServices.length,
        stale: staleCount,
        installed: installedCount,
        hasApi: hasApiCount,
        ranks: countByRank(allServices)
    };
}
