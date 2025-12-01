/**
 * Staleness Detection Service
 * Checks if service results are out-of-date based on checks hash
 */

/**
 * Check if a service is stale (needs re-running due to updated checks)
 * @param {Object} service - Service object with checks_hash
 * @param {string} currentHash - Current checks hash from catalog
 * @returns {boolean} True if service is stale
 */
export function isServiceStale(service, currentHash) {
    // If no current hash available, can't determine staleness
    if (!currentHash) {
        return false;
    }

    // Backwards compatibility: if service has no checks_hash, assume it's stale
    if (!service.checks_hash) {
        return true;
    }

    // Compare hashes
    return service.checks_hash !== currentHash;
}

/**
 * Get staleness information for a service
 * @param {Object} service - Service object
 * @param {string} currentHash - Current checks hash
 * @returns {Object} Staleness details
 */
export function getStalenessInfo(service, currentHash) {
    const stale = isServiceStale(service, currentHash);

    return {
        isStale: stale,
        message: stale
            ? 'Score may be outdated (checks have been updated)'
            : 'Score is current',
        serviceHash: service.checks_hash || 'unknown',
        currentHash: currentHash || 'unknown'
    };
}

/**
 * Filter services to get only stale ones
 * @param {Array<Object>} services - Array of service objects
 * @param {string} currentHash - Current checks hash
 * @returns {Array<Object>} Array of stale services
 */
export function filterStaleServices(services, currentHash) {
    return services.filter(service => isServiceStale(service, currentHash));
}

/**
 * Get staleness statistics for a set of services
 * @param {Array<Object>} services - Array of service objects
 * @param {string} currentHash - Current checks hash
 * @returns {Object} Statistics about staleness
 */
export function getStalenessStats(services, currentHash) {
    const staleServices = filterStaleServices(services, currentHash);

    return {
        total: services.length,
        stale: staleServices.length,
        upToDate: services.length - staleServices.length,
        percentage: services.length > 0
            ? Math.round((staleServices.length / services.length) * 100)
            : 0
    };
}

/**
 * Count stale services among installed services
 * @param {Array<Object>} services - Array of service objects
 * @param {string} currentHash - Current checks hash
 * @returns {number} Count of stale installed services
 */
export function countStaleInstalled(services, currentHash) {
    return services.filter(s =>
        isServiceStale(s, currentHash) && s.installed
    ).length;
}
