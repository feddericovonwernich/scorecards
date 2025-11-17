/**
 * Settings Modal and PAT Management
 * Handles GitHub Personal Access Token configuration and display
 */

import { showToast } from './toast.js';
import { handlePATSaved, handlePATCleared } from './actions-widget.js';

/**
 * Open settings modal
 * @returns {void}
 */
export function openSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.remove('hidden');

    // Update UI to reflect current PAT state
    updateModeIndicator();

    // Auto-check rate limit when opening settings
    checkRateLimit();
}

/**
 * Close settings modal
 * @returns {void}
 */
export function closeSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('hidden');
}

/**
 * Test if a PAT is valid
 * @param {string} pat - Personal Access Token
 * @returns {Promise<boolean>} True if PAT is valid
 */
export async function testPAT(pat) {
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${pat}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Error testing PAT:', error);
        return false;
    }
}

/**
 * Save PAT to in-memory storage
 * Uses global variables: githubPAT
 * @returns {Promise<void>}
 */
export async function savePAT() {
    const input = document.getElementById('github-pat-input');
    const pat = input.value.trim();

    if (!pat) {
        showToast('Please enter a valid PAT', 'error');
        return;
    }

    // Test the PAT first
    showToast('Validating token...', 'info');
    const isValid = await testPAT(pat);

    if (isValid) {
        githubPAT = pat;
        updateWidgetState();
        updateModeIndicator();

        // Notify actions widget
        handlePATSaved();

        showToast('PAT saved successfully! Using GitHub API mode.', 'success');
        checkRateLimit(); // Update rate limit display
    } else {
        showToast('Invalid PAT. Please check and try again.', 'error');
    }
}

/**
 * Clear PAT from in-memory storage
 * Uses global variables: githubPAT
 * @returns {void}
 */
export function clearPAT() {
    githubPAT = null;
    const input = document.getElementById('github-pat-input');
    input.value = '';
    updateWidgetState();
    updateModeIndicator();

    // Notify actions widget
    handlePATCleared();

    showToast('PAT cleared. Using public CDN mode.', 'info');
    checkRateLimit(); // Update rate limit display
}

/**
 * Update the widget visual state based on PAT presence
 * Uses global variables: githubPAT
 * @returns {void}
 */
export function updateWidgetState() {
    const settingsBtn = document.getElementById('settings-btn');
    const unlockedIcon = document.querySelector('.unlocked-icon');
    const lockedIcon = document.querySelector('.locked-icon');

    if (githubPAT) {
        // PAT loaded - show locked icon
        settingsBtn.classList.add('has-token');
        unlockedIcon.style.display = 'none';
        lockedIcon.style.display = 'block';
        settingsBtn.title = 'Settings (PAT loaded)';
        settingsBtn.setAttribute('aria-label', 'Settings (PAT loaded)');
    } else {
        // No PAT - show unlocked icon
        settingsBtn.classList.remove('has-token');
        unlockedIcon.style.display = 'block';
        lockedIcon.style.display = 'none';
        settingsBtn.title = 'Settings';
        settingsBtn.setAttribute('aria-label', 'Settings');
    }
}

/**
 * Update mode indicator in settings modal
 * Uses global variables: githubPAT
 * @returns {void}
 */
export function updateModeIndicator() {
    const indicator = document.getElementById('mode-indicator');
    const currentMode = document.querySelector('.current-mode');

    if (githubPAT) {
        indicator.textContent = 'GitHub API (fast, authenticated)';
        currentMode.classList.add('api-mode');
    } else {
        indicator.textContent = 'Public CDN (slower, no rate limits)';
        currentMode.classList.remove('api-mode');
    }
}

/**
 * Check and display GitHub API rate limit status
 * Uses global variables: githubPAT
 * @returns {Promise<void>}
 */
export async function checkRateLimit() {
    try {
        const headers = githubPAT
            ? { 'Authorization': `token ${githubPAT}` }
            : {};

        const response = await fetch('https://api.github.com/rate_limit', { headers });
        const data = await response.json();

        document.getElementById('rate-limit-remaining').textContent = data.rate.remaining;
        document.getElementById('rate-limit-limit').textContent = data.rate.limit;
        document.getElementById('rate-limit-reset').textContent =
            new Date(data.rate.reset * 1000).toLocaleTimeString();

        if (data.rate.remaining < 10) {
            showToast('Warning: Low rate limit remaining!', 'warning');
        }
    } catch (error) {
        console.error('Error checking rate limit:', error);
        document.getElementById('rate-limit-remaining').textContent = 'Error';
        document.getElementById('rate-limit-limit').textContent = '-';
        document.getElementById('rate-limit-reset').textContent = '-';
    }
}
