/**
 * Statistics Calculation Utilities
 * Reusable functions for calculating service statistics
 */

import { RANKS } from '../config/constants.js';

/**
 * Count services by rank
 * @param {Array<Object>} services - Array of service objects with rank property
 * @returns {Object} Rank counts { platinum: n, gold: n, silver: n, bronze: n }
 */
export function countByRank(services) {
    const counts = {};
    RANKS.forEach(rank => {
        counts[rank] = services.filter(s => s.rank === rank).length;
    });
    return counts;
}

/**
 * Calculate average score for services
 * @param {Array<Object>} services - Array of service objects with score property
 * @returns {number} Average score rounded to nearest integer
 */
export function calculateAverageScore(services) {
    if (!services || services.length === 0) return 0;
    const total = services.reduce((sum, s) => sum + (s.score || 0), 0);
    return Math.round(total / services.length);
}

/**
 * Calculate comprehensive statistics for services
 * @param {Array<Object>} services - All services
 * @param {Function} isStaleCheck - Function to check staleness (service, hash) => boolean
 * @param {string} checksHash - Current checks hash
 * @returns {Object} Statistics object
 */
export function calculateServiceStats(services, isStaleCheck, checksHash) {
    return {
        total: services.length,
        avgScore: calculateAverageScore(services),
        ranks: countByRank(services),
        apiCount: services.filter(s => s.has_api).length,
        staleCount: isStaleCheck ? services.filter(s => isStaleCheck(s, checksHash)).length : 0,
        installedCount: services.filter(s => s.installed).length,
    };
}
