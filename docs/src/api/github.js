/**
 * GitHub API Client
 * Functions for interacting with GitHub's REST API
 */

import { getToken } from '../services/auth.js';
import { getRepoOwner, getRepoName } from './registry.js';
import { API_CONFIG } from '../config/constants.js';

/**
 * Make a GitHub API request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function githubApiRequest(endpoint, options = {}) {
    const token = getToken();

    const headers = {
        'Accept': API_CONFIG.ACCEPT_HEADER,
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(`${API_CONFIG.GITHUB_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    return response;
}

/**
 * Check GitHub API rate limit
 * @returns {Promise<Object>} Rate limit information
 */
export async function checkRateLimit() {
    try {
        const response = await githubApiRequest('/rate_limit');
        const data = await response.json();

        return {
            remaining: data.rate.remaining,
            limit: data.rate.limit,
            reset: new Date(data.rate.reset * 1000)
        };
    } catch (error) {
        console.error('Error checking rate limit:', error);
        return {
            remaining: null,
            limit: null,
            reset: null,
            error: error.message
        };
    }
}

/**
 * Fetch workflow runs for a repository
 * @param {string} org - Repository owner/org
 * @param {string} repo - Repository name
 * @param {Object} options - Query options (per_page, etc.)
 * @returns {Promise<Array<Object>>} Array of workflow runs
 */
export async function fetchWorkflowRuns(org, repo, options = {}) {
    const perPage = options.per_page || API_CONFIG.PER_PAGE;
    const endpoint = `/repos/${org}/${repo}/actions/runs?per_page=${perPage}&_t=${Date.now()}`;

    try {
        const response = await githubApiRequest(endpoint, {
            cache: 'no-cache'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch workflow runs: ${response.status}`);
        }

        const data = await response.json();

        // Add org/repo metadata to each run
        return data.workflow_runs.map(run => ({
            ...run,
            org,
            repo
        }));
    } catch (error) {
        console.error(`Error fetching workflow runs for ${org}/${repo}:`, error);
        throw error;
    }
}

/**
 * Trigger a workflow dispatch event
 * @param {string} org - Repository owner/org
 * @param {string} repo - Repository name
 * @param {string} workflow - Workflow file name
 * @param {Object} inputs - Workflow inputs
 * @param {string} ref - Git ref (branch/tag)
 * @returns {Promise<boolean>} True if successful
 */
export async function triggerWorkflowDispatch(org, repo, workflow, inputs = {}, ref = 'main') {
    const token = getToken();

    if (!token) {
        throw new Error('GitHub token required to trigger workflows');
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${org}/${repo}/actions/workflows/${workflow}/dispatches`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'Authorization': `Bearer ${token}`,
                    'X-GitHub-Api-Version': '2022-11-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ref,
                    inputs
                })
            }
        );

        // GitHub returns 204 No Content on success
        return response.status === 204;
    } catch (error) {
        console.error('Error triggering workflow:', error);
        throw error;
    }
}

/**
 * Trigger scorecard workflow for a service
 * @param {string} org - Service repository owner
 * @param {string} repo - Service repository name
 * @returns {Promise<boolean>} True if successful
 */
export async function triggerScorecardWorkflow(org, repo) {
    const scorecardOrg = getRepoOwner();
    const scorecardRepo = getRepoName();

    return triggerWorkflowDispatch(
        scorecardOrg,
        scorecardRepo,
        'trigger-service-workflow.yml',
        { org, repo }
    );
}

/**
 * Trigger scorecards for multiple services (bulk operation)
 * @param {Array<{org: string, repo: string}>} services - Array of services
 * @returns {Promise<boolean>} True if successful
 */
export async function triggerBulkScorecardWorkflows(services) {
    const scorecardOrg = getRepoOwner();
    const scorecardRepo = getRepoName();

    const servicesArray = services.map(s => ({ org: s.org, repo: s.repo }));

    return triggerWorkflowDispatch(
        scorecardOrg,
        scorecardRepo,
        'trigger-service-workflow.yml',
        { services: JSON.stringify(servicesArray) }
    );
}

/**
 * Create installation PR for a service
 * @param {string} org - Service repository owner
 * @param {string} repo - Service repository name
 * @returns {Promise<boolean>} True if successful
 */
export async function createInstallationPR(org, repo) {
    const scorecardOrg = getRepoOwner();
    const scorecardRepo = getRepoName();

    return triggerWorkflowDispatch(
        scorecardOrg,
        scorecardRepo,
        'create-installation-pr.yml',
        { org, repo }
    );
}

/**
 * Get user information from GitHub
 * @returns {Promise<Object>} User information
 */
export async function getUserInfo() {
    const response = await githubApiRequest('/user');

    if (!response.ok) {
        throw new Error('Failed to fetch user info');
    }

    return response.json();
}
