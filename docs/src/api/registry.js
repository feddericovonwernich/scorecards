/**
 * Registry API
 * Fetches and parses service registry data from GitHub
 */

import { getToken } from '../services/auth.js';

// Repository configuration
function detectRepoOwner() {
    const hostname = window.location.hostname;
    // Local development detection
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
        return 'feddericovonwernich';
    }
    // GitHub Pages: extract from hostname (e.g., owner.github.io)
    return hostname.split('.')[0] || 'feddericovonwernich';
}

const REPO_OWNER = detectRepoOwner();
const REPO_NAME = 'scorecards';
const BRANCH = 'catalog';
const RAW_BASE_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;

// Cache for current checks hash
let currentChecksHashCache = null;
let checksHashTimestamp = 0;
const CACHE_TTL = 10 * 1000; // 10 seconds

/**
 * Fetch with hybrid authentication (API with PAT or raw URL fallback)
 * @param {string} path - Path to resource (relative to repository root)
 * @param {Object} options - Fetch options
 * @returns {Promise<{response: Response, usedAPI: boolean}>}
 */
export async function fetchWithHybridAuth(path, options = {}) {
    const token = getToken();
    let response;
    let usedAPI = false;

    if (token) {
        // Try GitHub API first with PAT
        try {
            const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;
            response = await fetch(apiUrl, {
                ...options,
                cache: 'no-cache',
                headers: {
                    ...options.headers,
                    'Accept': 'application/vnd.github.raw',
                    'Authorization': `token ${token}`
                }
            });

            usedAPI = true;

            // Handle rate limit or auth errors gracefully
            if (response.status === 403 || response.status === 429 || response.status === 401) {
                console.warn(`API fetch failed with status ${response.status}, falling back to CDN`);
                usedAPI = false;
            } else if (!response.ok) {
                console.warn(`API fetch failed with status ${response.status}, falling back to CDN`);
                usedAPI = false;
            }
        } catch (error) {
            console.error('Error with API fetch, falling back to CDN:', error);
            usedAPI = false;
        }
    }

    // If no PAT or API failed, use raw.githubusercontent.com
    if (!usedAPI) {
        const rawUrl = `${RAW_BASE_URL}/${path}?t=${Date.now()}`;
        response = await fetch(rawUrl, {
            ...options,
            cache: 'no-cache'
        });
    }

    return {
        response,
        usedAPI
    };
}

/**
 * Fetch current checks hash from catalog
 * @returns {Promise<string|null>} Current checks hash
 */
export async function fetchCurrentChecksHash() {
    const now = Date.now();

    // Return cached value if still valid
    if (currentChecksHashCache && (now - checksHashTimestamp) < CACHE_TTL) {
        console.log('Using cached checks hash:', currentChecksHashCache);
        return currentChecksHashCache;
    }

    console.log('Fetching current checks hash from catalog...');

    try {
        // Fetch the pre-computed hash from the catalog branch
        const hashUrl = `${RAW_BASE_URL}/current-checks.json?t=${Date.now()}`;
        const response = await fetch(hashUrl, { cache: 'no-cache' });

        if (!response.ok) {
            console.error('Failed to fetch current checks hash:', response.status);
            return null;
        }

        const data = await response.json();
        const hash = data.checks_hash;

        // Update cache
        currentChecksHashCache = hash;
        checksHashTimestamp = now;

        console.log('Current checks hash:', hash);
        console.log('Checks count:', data.checks_count);
        console.log('Generated at:', data.generated_at);
        return hash;

    } catch (error) {
        console.error('Error fetching current checks hash:', error);
        return null;
    }
}

/**
 * Load all services from registry (consolidated or tree API)
 * @returns {Promise<{services: Array<Object>, usedAPI: boolean}>}
 */
export async function loadServices() {
    let loadedFromConsolidated = false;
    let usedAPI = false;
    let services = [];

    // Try to load consolidated registry first
    try {
        console.log('Attempting to load consolidated registry...');
        const { response, usedAPI: fetchUsedAPI } = await fetchWithHybridAuth('registry/all-services.json');
        usedAPI = fetchUsedAPI;

        if (response.ok) {
            const registryData = await response.json();
            if (registryData.services && Array.isArray(registryData.services)) {
                services = registryData.services;
                loadedFromConsolidated = true;
                console.log(`Loaded ${services.length} services from consolidated registry (generated at ${registryData.generated_at})`);
            }
        }
    } catch (error) {
        console.warn('Failed to load consolidated registry, falling back to tree API:', error);
    }

    // Fallback: Use tree API to discover individual files
    if (!loadedFromConsolidated) {
        console.log('Loading services via tree API...');
        const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${BRANCH}?recursive=1`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch repository tree: ${response.status}`);
        }

        const treeData = await response.json();

        // Find all registry JSON files, excluding all-services.json
        const registryFiles = treeData.tree
            .filter(item =>
                item.path.startsWith('registry/') &&
                item.path.endsWith('.json') &&
                item.path !== 'registry/all-services.json'
            )
            .map(item => item.path);

        if (registryFiles.length === 0) {
            throw new Error('No services registered yet');
        }

        // Fetch all registry files in parallel
        const fetchPromises = registryFiles.map(async (path) => {
            const { response, usedAPI: fetchUsedAPI } = await fetchWithHybridAuth(path);
            if (fetchUsedAPI) usedAPI = true;
            if (response.ok) {
                return response.json();
            }
            return null;
        });

        const results = await Promise.all(fetchPromises);
        services = results.filter(service => service !== null);
        console.log(`Loaded ${services.length} services via tree API`);
    }

    return {
        services,
        usedAPI
    };
}

// Cache for teams data
let teamsDataCache = null;
let teamsDataTimestamp = 0;
const TEAMS_CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Load all teams from the teams registry
 * @param {boolean} forceRefresh - Force refresh even if cached
 * @returns {Promise<{teams: Object, usedAPI: boolean}>}
 */
export async function loadTeams(forceRefresh = false) {
    const now = Date.now();

    // Return cached value if still valid
    if (!forceRefresh && teamsDataCache && (now - teamsDataTimestamp) < TEAMS_CACHE_TTL) {
        console.log('Using cached teams data');
        return {
            teams: teamsDataCache,
            usedAPI: false,
        };
    }

    console.log('Loading teams from registry...');

    try {
        const { response, usedAPI } = await fetchWithHybridAuth('teams/all-teams.json');

        if (!response.ok) {
            console.warn('Failed to load teams registry:', response.status);
            return {
                teams: null,
                usedAPI,
            };
        }

        const teamsData = await response.json();

        // Update cache
        teamsDataCache = teamsData;
        teamsDataTimestamp = now;

        console.log(`Loaded ${teamsData.count || 0} teams from registry (generated at ${teamsData.generated_at})`);

        return {
            teams: teamsData,
            usedAPI,
        };
    } catch (error) {
        console.error('Error loading teams:', error);
        return {
            teams: null,
            usedAPI: false,
        };
    }
}

/**
 * Load a single team file
 * @param {string} teamId - Team ID
 * @returns {Promise<Object|null>} Team data or null
 */
export async function loadTeamById(teamId) {
    try {
        const { response } = await fetchWithHybridAuth(`teams/${teamId}.json`);

        if (!response.ok) {
            console.warn(`Failed to load team ${teamId}:`, response.status);
            return null;
        }

        return response.json();
    } catch (error) {
        console.error(`Error loading team ${teamId}:`, error);
        return null;
    }
}

/**
 * Clear teams cache
 */
export function clearTeamsCache() {
    teamsDataCache = null;
    teamsDataTimestamp = 0;
}

/**
 * Get repository owner
 * @returns {string} Repository owner
 */
export function getRepoOwner() {
    return REPO_OWNER;
}

/**
 * Get repository name
 * @returns {string} Repository name
 */
export function getRepoName() {
    return REPO_NAME;
}

/**
 * Get branch name
 * @returns {string} Branch name
 */
export function getBranch() {
    return BRANCH;
}
