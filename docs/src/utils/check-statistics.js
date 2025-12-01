/**
 * Check Statistics Utilities
 * Functions for calculating check adoption and statistics
 */

import { getTeamName } from './team-statistics.js';

/**
 * Check if a service has a specific check excluded
 * @param {Object} service - Service object
 * @param {string} checkId - Check ID (e.g., '01-readme')
 * @returns {boolean} True if the check is excluded
 */
export function isCheckExcluded(service, checkId) {
    return service.excluded_checks?.some(e => e.check === checkId) ?? false;
}

/**
 * Get exclusion reason for a check
 * @param {Object} service - Service object
 * @param {string} checkId - Check ID
 * @returns {string|null} Exclusion reason or null
 */
export function getExclusionReason(service, checkId) {
    return service.excluded_checks?.find(e => e.check === checkId)?.reason ?? null;
}

/**
 * Get services that have excluded a specific check
 * @param {Array<Object>} services - Array of services
 * @param {string} checkId - Check ID
 * @returns {Array<Object>} Services with exclusion info
 */
export function getExcludedServicesForCheck(services, checkId) {
    return services
        .filter(s => isCheckExcluded(s, checkId))
        .map(s => ({
            org: s.org,
            repo: s.repo,
            name: s.name,
            score: s.score,
            rank: s.rank,
            exclusionReason: getExclusionReason(s, checkId)
        }));
}

/**
 * Calculate overall check adoption for a specific check
 * Excluded services are not counted in the denominator for percentage
 * @param {Array<Object>} services - Array of services
 * @param {string} checkId - Check ID (e.g., '01-readme')
 * @returns {Object} { total, passing, failing, excluded, unknown, percentage, activeTotal }
 */
export function calculateOverallCheckAdoption(services, checkId) {
    let passing = 0;
    let failing = 0;
    let excluded = 0;
    let unknown = 0;

    for (const service of services) {
        // Check if this check is excluded for this service
        if (isCheckExcluded(service, checkId)) {
            excluded++;
            continue;
        }

        const status = service.check_results?.[checkId];
        if (status === 'pass') {
            passing++;
        } else if (status === 'fail') {
            failing++;
        } else {
            unknown++;
        }
    }

    const total = services.length;
    const activeTotal = total - excluded;
    const percentage = activeTotal > 0 ? Math.round((passing / activeTotal) * 100) : 0;

    return {
        total,
        activeTotal,
        passing,
        failing,
        excluded,
        unknown,
        percentage
    };
}

/**
 * Calculate check adoption by team
 * Excluded services are tracked separately and not counted in percentage
 * @param {Array<Object>} services - Array of services
 * @param {string} checkId - Check ID (e.g., '01-readme')
 * @returns {Object} { teamName: { total, passing, failing, excluded, unknown, percentage, activeTotal, services[] } }
 */
export function calculateCheckAdoptionByTeam(services, checkId) {
    const teamStats = {};

    for (const service of services) {
        const teamName = getTeamName(service) || 'No Team';

        if (!teamStats[teamName]) {
            teamStats[teamName] = {
                total: 0,
                passing: 0,
                failing: 0,
                excluded: 0,
                unknown: 0,
                services: []
            };
        }

        const stats = teamStats[teamName];
        stats.total++;

        // Check if this check is excluded for this service
        const isExcluded = isCheckExcluded(service, checkId);

        if (isExcluded) {
            stats.excluded++;
            stats.services.push({
                org: service.org,
                repo: service.repo,
                name: service.name,
                score: service.score,
                rank: service.rank,
                checkStatus: 'excluded',
                exclusionReason: getExclusionReason(service, checkId)
            });
            continue;
        }

        const status = service.check_results?.[checkId];
        if (status === 'pass') {
            stats.passing++;
        } else if (status === 'fail') {
            stats.failing++;
        } else {
            stats.unknown++;
        }

        stats.services.push({
            org: service.org,
            repo: service.repo,
            name: service.name,
            score: service.score,
            rank: service.rank,
            checkStatus: status || 'unknown'
        });
    }

    // Calculate percentages and sort services
    for (const teamName of Object.keys(teamStats)) {
        const stats = teamStats[teamName];
        // Active total excludes excluded services
        stats.activeTotal = stats.total - stats.excluded;
        stats.percentage = stats.activeTotal > 0
            ? Math.round((stats.passing / stats.activeTotal) * 100)
            : 0;

        // Sort services: passing first, then failing, then excluded, then by score
        stats.services.sort((a, b) => {
            const order = { pass: 0, fail: 1, excluded: 2, unknown: 3 };
            const orderA = order[a.checkStatus] ?? 3;
            const orderB = order[b.checkStatus] ?? 3;
            if (orderA !== orderB) return orderA - orderB;
            return b.score - a.score;
        });
    }

    return teamStats;
}

/**
 * Filter services by check criteria
 * @param {Array<Object>} services - Array of services
 * @param {Map} checkFilters - Map of checkId -> 'pass'|'fail'|null
 * @returns {Array<Object>} Filtered services
 */
export function filterByCheckCriteria(services, checkFilters) {
    if (!checkFilters || checkFilters.size === 0) {
        return services;
    }

    return services.filter(service => {
        for (const [checkId, requiredStatus] of checkFilters) {
            // Skip if no filter set for this check
            if (requiredStatus === null || requiredStatus === undefined) {
                continue;
            }

            const actualStatus = service.check_results?.[checkId];

            // Apply filter based on required status
            if (requiredStatus === 'pass' && actualStatus !== 'pass') {
                return false;
            }
            if (requiredStatus === 'fail' && actualStatus !== 'fail') {
                return false;
            }
        }
        return true;
    });
}

/**
 * Get services that pass a specific check
 * @param {Array<Object>} services - Array of services
 * @param {string} checkId - Check ID
 * @returns {Array<Object>} Services that pass the check
 */
export function getServicesPassingCheck(services, checkId) {
    return services.filter(s => s.check_results?.[checkId] === 'pass');
}

/**
 * Get services that fail a specific check
 * @param {Array<Object>} services - Array of services
 * @param {string} checkId - Check ID
 * @returns {Array<Object>} Services that fail the check
 */
export function getServicesFailingCheck(services, checkId) {
    return services.filter(s => s.check_results?.[checkId] === 'fail');
}

/**
 * Get check adoption statistics for all checks
 * @param {Array<Object>} services - Array of services
 * @param {Array<Object>} checks - Array of check metadata
 * @returns {Array<Object>} Array of { checkId, name, category, passing, failing, percentage }
 */
export function getAllChecksAdoptionStats(services, checks) {
    return checks.map(check => {
        const adoption = calculateOverallCheckAdoption(services, check.id);
        return {
            checkId: check.id,
            name: check.name,
            category: check.category,
            weight: check.weight,
            ...adoption
        };
    });
}

/**
 * Sort teams by adoption percentage
 * @param {Object} teamStats - Team statistics object from calculateCheckAdoptionByTeam
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array<Object>} Sorted array of { teamName, ...stats }
 */
export function sortTeamsByAdoption(teamStats, direction = 'desc') {
    const entries = Object.entries(teamStats).map(([teamName, stats]) => ({
        teamName,
        ...stats
    }));

    entries.sort((a, b) => {
        const diff = a.percentage - b.percentage;
        return direction === 'desc' ? -diff : diff;
    });

    return entries;
}

/**
 * Get active check filter count
 * @param {Map} checkFilters - Map of checkId -> 'pass'|'fail'|null
 * @returns {number} Number of active filters
 */
export function getActiveCheckFilterCount(checkFilters) {
    if (!checkFilters) return 0;

    let count = 0;
    for (const [, status] of checkFilters) {
        if (status !== null && status !== undefined) {
            count++;
        }
    }
    return count;
}
