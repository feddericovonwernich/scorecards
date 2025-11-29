/**
 * Checks API
 * Functions for loading and working with check metadata
 */

import { fetchWithHybridAuth } from './registry.js';

// Cache for checks metadata
let checksCache = null;
let checksTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load all checks metadata
 * @returns {Promise<Object>} Checks metadata { version, checks, categories, count }
 */
export async function loadChecks() {
    // Return cached if valid
    const now = Date.now();
    if (checksCache && (now - checksTimestamp) < CACHE_TTL) {
        return checksCache;
    }

    try {
        const response = await fetchWithHybridAuth('all-checks.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch all-checks.json: ${response.status}`);
        }
        checksCache = await response.json();
        checksTimestamp = now;
        return checksCache;
    } catch (error) {
        console.warn('Failed to load checks metadata:', error);
        // Return default empty structure
        return {
            version: '1.0.0',
            checks: [],
            categories: [],
            count: 0
        };
    }
}

/**
 * Get a check by its ID
 * @param {string} checkId - Check ID (e.g., '01-readme')
 * @returns {Object|null} Check object or null if not found
 */
export function getCheckById(checkId) {
    if (!checksCache) return null;
    return checksCache.checks.find(c => c.id === checkId) || null;
}

/**
 * Get all checks
 * @returns {Array<Object>} Array of all checks
 */
export function getAllChecks() {
    return checksCache?.checks || [];
}

/**
 * Get checks grouped by category
 * @returns {Object} Object with category names as keys and arrays of checks as values
 */
export function getChecksByCategory() {
    if (!checksCache) return {};

    const grouped = {};
    for (const check of checksCache.checks) {
        const category = check.category || 'Other';
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(check);
    }

    // Sort by category order
    const orderedCategories = checksCache.categories || [];
    const result = {};

    // Add categories in order
    for (const category of orderedCategories) {
        if (grouped[category]) {
            result[category] = grouped[category];
        }
    }

    // Add any remaining categories
    for (const category of Object.keys(grouped)) {
        if (!result[category]) {
            result[category] = grouped[category];
        }
    }

    return result;
}

/**
 * Get the list of categories
 * @returns {Array<string>} Array of category names
 */
export function getCategories() {
    return checksCache?.categories || [];
}

/**
 * Clear the checks cache
 */
export function clearChecksCache() {
    checksCache = null;
    checksTimestamp = 0;
}
