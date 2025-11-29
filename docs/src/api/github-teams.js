/**
 * GitHub Teams API
 * Functions for fetching GitHub team information
 */

import { githubApiRequest } from './github.js';
import { getToken } from '../services/auth.js';

// In-memory cache for team members (cleared on page refresh)
const membersCache = new Map();

/**
 * Fetch GitHub team members
 * @param {string} org - GitHub organization
 * @param {string} teamSlug - Team slug
 * @returns {Promise<Array|null>} Array of member objects, empty array if no access, null if not authenticated
 */
export async function fetchTeamMembers(org, teamSlug) {
    const token = getToken();

    if (!token) {
        return null; // Not authenticated
    }

    // Check cache first
    const cacheKey = `${org}/${teamSlug}`;
    if (membersCache.has(cacheKey)) {
        return membersCache.get(cacheKey);
    }

    try {
        const response = await githubApiRequest(`/orgs/${org}/teams/${teamSlug}/members`);

        if (!response.ok) {
            // Team not found or no access
            console.warn(`Failed to fetch team members for ${org}/${teamSlug}: ${response.status}`);
            return [];
        }

        const members = await response.json();
        const result = members.map(m => ({
            login: m.login,
            avatar_url: m.avatar_url,
            url: m.html_url
        }));

        // Cache the result
        membersCache.set(cacheKey, result);

        return result;
    } catch (error) {
        console.error(`Error fetching team members for ${org}/${teamSlug}:`, error);
        return [];
    }
}

/**
 * Get GitHub team URL
 * @param {string} org - GitHub organization
 * @param {string} teamSlug - Team slug
 * @returns {string} URL to the GitHub team page
 */
export function getTeamUrl(org, teamSlug) {
    return `https://github.com/orgs/${org}/teams/${teamSlug}`;
}

/**
 * Clear the members cache (useful for testing or force refresh)
 */
export function clearMembersCache() {
    membersCache.clear();
}
