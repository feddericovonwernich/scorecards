/**
 * Check Statistics Utilities
 * Functions for calculating check adoption and statistics
 */

import { getTeamName } from './team-statistics.js';

/**
 * Calculate overall check adoption for a specific check
 * @param {Array<Object>} services - Array of services
 * @param {string} checkId - Check ID (e.g., '01-readme')
 * @returns {Object} { total, passing, failing, unknown, percentage }
 */
export function calculateOverallCheckAdoption(services, checkId) {
    let passing = 0;
    let failing = 0;
    let unknown = 0;

    for (const service of services) {
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
    const percentage = total > 0 ? Math.round((passing / total) * 100) : 0;

    return {
        total,
        passing,
        failing,
        unknown,
        percentage
    };
}

/**
 * Calculate check adoption by team
 * @param {Array<Object>} services - Array of services
 * @param {string} checkId - Check ID (e.g., '01-readme')
 * @returns {Object} { teamName: { total, passing, failing, unknown, percentage, services[] } }
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
                unknown: 0,
                services: []
            };
        }

        const stats = teamStats[teamName];
        stats.total++;

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
        stats.percentage = stats.total > 0
            ? Math.round((stats.passing / stats.total) * 100)
            : 0;

        // Sort services: passing first, then by score
        stats.services.sort((a, b) => {
            if (a.checkStatus === 'pass' && b.checkStatus !== 'pass') return -1;
            if (a.checkStatus !== 'pass' && b.checkStatus === 'pass') return 1;
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
