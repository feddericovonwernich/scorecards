/**
 * Deployment configuration - centralizes environment-specific values
 * @module config/deployment
 */

/**
 * Detect repository owner from hostname or environment
 * @returns {string}
 */
function detectRepoOwner() {
    // Check environment variable first
    if (typeof process !== 'undefined' && process.env?.SCORECARD_REPO_OWNER) {
        return process.env.SCORECARD_REPO_OWNER;
    }

    // Browser context
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // Local development
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
            return window.SCORECARD_REPO_OWNER || 'feddericovonwernich';
        }
        // GitHub Pages: owner.github.io
        return hostname.split('.')[0] || 'feddericovonwernich';
    }

    return 'feddericovonwernich';
}

/** @type {import('../types').DeploymentConfig} */
export const DEPLOYMENT = {
    repoOwner: detectRepoOwner(),
    repoName: 'scorecards',
    catalogBranch: 'catalog',
    ports: {
        devServer: 8080,
        testServer: 8080
    },
    api: {
        githubBase: 'https://api.github.com',
        version: '2022-11-28',
        acceptHeader: 'application/vnd.github.v3+json'
    },
    git: {
        botName: 'scorecard-bot',
        botEmail: 'scorecard-bot@users.noreply.github.com'
    }
};

export { detectRepoOwner };
