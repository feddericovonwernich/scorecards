/**
 * GitHub Actions Workflow Triggers
 * Handles triggering scorecards workflows via GitHub API
 */

import { getToken, clearToken } from '../services/auth.js';
import { setButtonLoading, setButtonSuccess, setButtonError, resetButton } from '../ui/button-states.js';
import { showToast } from '../ui/toast.js';
import { DEPLOYMENT } from '../config/deployment.js';
import { WORKFLOWS, getWorkflowDispatchUrl } from '../config/workflows.js';

// Get repo info from registry module
const getRepoInfo = () => {
    const { getRepoOwner, getRepoName } = window.ScorecardModules.registry;
    return {
        owner: getRepoOwner(),
        name: getRepoName()
    };
};

/**
 * Trigger scorecard workflow for a single service
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 * @param {HTMLButtonElement} buttonElement - Button to update
 * @returns {Promise<boolean>} Success status
 */
export async function triggerServiceWorkflow(org, repo, buttonElement) {
    const token = getToken();

    if (!token) {
        showToast('Please configure a GitHub PAT in Settings to trigger workflows', 'warning');
        window.openSettings();
        return false;
    }

    setButtonLoading(buttonElement, 'Triggering...');

    try {
        const { owner, name } = getRepoInfo();
        const response = await fetch(
            getWorkflowDispatchUrl(owner, name, WORKFLOWS.files.triggerService),
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'Authorization': `Bearer ${token}`,
                    'X-GitHub-Api-Version': DEPLOYMENT.api.version,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ref: 'main',
                    inputs: { org, repo }
                })
            }
        );

        if (response.status === 204) {
            showToast(`Scorecard workflow triggered for ${org}/${repo}`, 'success');
            await setButtonSuccess(buttonElement, '✓ Triggered Successfully');
            return true;
        } else if (response.status === 401) {
            clearToken();
            showToast('Invalid GitHub token. Please enter a valid token in Settings.', 'error');
            await setButtonError(buttonElement, '✗ Trigger Failed');
            return false;
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to trigger workflow:', response.status, errorData);
            showToast(`Failed to trigger workflow: ${errorData.message || response.statusText}`, 'error');
            await setButtonError(buttonElement, '✗ Trigger Failed');
            return false;
        }
    } catch (error) {
        console.error('Error triggering workflow:', error);
        showToast(`Error triggering workflow: ${error.message}`, 'error');
        await setButtonError(buttonElement, '✗ Trigger Failed');
        return false;
    }
}

/**
 * Create installation PR for a service
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 * @param {HTMLButtonElement} buttonElement - Button to update
 * @returns {Promise<boolean>} Success status
 */
export async function installService(org, repo, buttonElement) {
    const token = getToken();

    if (!token) {
        showToast('GitHub token is required to create installation PRs', 'error');
        return false;
    }

    setButtonLoading(buttonElement, 'Creating PR...');

    try {
        const { owner, name } = getRepoInfo();
        const response = await fetch(
            getWorkflowDispatchUrl(owner, name, WORKFLOWS.files.createInstallPR),
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'Authorization': `Bearer ${token}`,
                    'X-GitHub-Api-Version': DEPLOYMENT.api.version,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ref: 'main',
                    inputs: { org, repo }
                })
            }
        );

        if (response.status === 204) {
            showToast(`Installation PR creation started for ${org}/${repo}`, 'success');

            setTimeout(() => {
                showToast('Note: PR status will appear in the catalog in 3-5 minutes due to GitHub Pages deployment.', 'info');
            }, 2000);

            if (buttonElement) {
                buttonElement.innerHTML = '⏳ PR Creating...';

                // Poll and refresh
                setTimeout(async () => {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        showToast('Installation PR created! Refreshing...', 'success');

                        const modal = document.getElementById('service-modal');
                        modal.classList.add('hidden');
                        setTimeout(() => window.showServiceDetail(org, repo), 500);
                    } catch (error) {
                        console.error('Error checking PR status:', error);
                        resetButton(buttonElement);
                    }
                }, 1000);
            }

            return true;
        } else if (response.status === 401) {
            clearToken();
            showToast('Invalid GitHub token. Please enter a valid token with workflow permissions.', 'error');
            resetButton(buttonElement);
            return false;
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to create installation PR:', response.status, errorData);
            showToast(`Failed to create installation PR: ${errorData.message || response.statusText}`, 'error');
            resetButton(buttonElement);
            return false;
        }
    } catch (error) {
        console.error('Error creating installation PR:', error);
        showToast(`Error creating installation PR: ${error.message}`, 'error');
        resetButton(buttonElement);
        return false;
    }
}

/**
 * Trigger workflows for multiple services (bulk operation)
 * @param {Array<Object>} services - Array of service objects
 * @param {HTMLButtonElement} buttonElement - Button to update
 * @returns {Promise<boolean>} Success status
 */
export async function triggerBulkWorkflows(services, buttonElement) {
    const token = getToken();

    if (!token) {
        showToast('GitHub token is required to trigger workflows', 'error');
        return false;
    }

    setButtonLoading(buttonElement, 'Triggering...');

    try {
        const servicesArray = services.map(s => ({ org: s.org, repo: s.repo }));
        const { owner, name } = getRepoInfo();

        const response = await fetch(
            getWorkflowDispatchUrl(owner, name, WORKFLOWS.files.triggerService),
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'Authorization': `Bearer ${token}`,
                    'X-GitHub-Api-Version': DEPLOYMENT.api.version,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ref: 'main',
                    inputs: {
                        services: JSON.stringify(servicesArray)
                    }
                })
            }
        );

        if (response.status === 204) {
            const count = services.length;
            showToast(`Triggered workflows for ${count} service${count !== 1 ? 's' : ''}`, 'success');
            await setButtonSuccess(buttonElement, `✓ Triggered ${count} service${count !== 1 ? 's' : ''}`);
            return true;
        } else if (response.status === 401) {
            clearToken();
            showToast('Invalid GitHub token. Please enter a valid token in Settings.', 'error');
            resetButton(buttonElement);
            return false;
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to trigger bulk workflows:', response.status, errorData);
            showToast(`Failed to trigger workflows: ${errorData.message || response.statusText}`, 'error');
            resetButton(buttonElement);
            return false;
        }
    } catch (error) {
        console.error('Error triggering bulk workflows:', error);
        showToast(`Error triggering workflows: ${error.message}`, 'error');
        resetButton(buttonElement);
        return false;
    }
}

/**
 * Handle bulk trigger button click (stale services only)
 * @param {Event} event - Click event
 */
export function handleBulkTrigger(event) {
    event.preventDefault();

    const { isServiceStale } = window.ScorecardModules.staleness;
    const staleServices = window.allServices.filter(s =>
        isServiceStale(s, window.currentChecksHash) && s.installed
    );

    if (staleServices.length === 0) {
        showToast('No stale services to trigger', 'info');
        return;
    }

    if (confirm(`This will trigger scorecard workflows for ${staleServices.length} stale service${staleServices.length !== 1 ? 's' : ''}.\n\nContinue?`)) {
        triggerBulkWorkflows(staleServices, event.currentTarget);
    }
}

/**
 * Handle bulk trigger all button click (all installed services)
 * @param {Event} event - Click event
 */
export function handleBulkTriggerAll(event) {
    event.preventDefault();

    const installedServices = window.allServices.filter(s => s.installed);

    if (installedServices.length === 0) {
        showToast('No installed services to trigger', 'info');
        return;
    }

    if (confirm(`This will trigger scorecard workflows for ALL ${installedServices.length} installed service${installedServices.length !== 1 ? 's' : ''}.\n\nThis may take a while. Continue?`)) {
        triggerBulkWorkflows(installedServices, event.currentTarget);
    }
}
