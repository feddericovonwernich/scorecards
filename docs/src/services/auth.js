/**
 * Authentication and Token Management
 * Handles GitHub Personal Access Token (PAT) storage and validation
 */

// In-memory PAT storage (not persisted to localStorage for security)
let githubPAT = null;

/**
 * Get the currently stored GitHub token
 * @returns {string|null} GitHub PAT or null if not set
 */
export function getToken() {
    return githubPAT;
}

/**
 * Check if a GitHub token is currently set
 * @returns {boolean} True if token is set
 */
export function hasToken() {
    return !!githubPAT;
}

/**
 * Set the GitHub token
 * @param {string} token - GitHub Personal Access Token
 */
export function setToken(token) {
    githubPAT = token ? token.trim() : null;
}

/**
 * Clear the stored GitHub token
 */
export function clearToken() {
    githubPAT = null;
}

/**
 * Test if a PAT is valid by making a request to GitHub API
 * @param {string} pat - GitHub Personal Access Token to test
 * @returns {Promise<boolean>} True if token is valid
 */
export async function validateToken(pat) {
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${pat}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Error validating PAT:', error);
        return false;
    }
}

/**
 * Validate and save a GitHub token
 * @param {string} token - GitHub Personal Access Token
 * @returns {Promise<boolean>} True if token was valid and saved
 */
export async function validateAndSaveToken(token) {
    if (!token || !token.trim()) {
        return false;
    }

    const isValid = await validateToken(token.trim());

    if (isValid) {
        setToken(token.trim());
        return true;
    }

    return false;
}

/**
 * Get token for authorization headers
 * @returns {string|null} Token or null if not available
 */
export function getTokenForAuth() {
    return getToken();
}
