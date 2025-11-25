/**
 * Service Workflows Manager
 * Handles workflow runs display and management for the service modal
 */

import { escapeHtml, formatInterval, formatDuration } from '../utils/formatting.js';
import { renderWorkflowRun } from './workflow-run.js';
import { showToast } from './toast.js';
import { getToken } from '../services/auth.js';
import { getCssVar } from '../utils/css.js';
import { API_CONFIG, STORAGE_KEYS } from '../config/constants.js';
import { startButtonSpin, stopButtonSpin } from '../utils/animation.js';

/**
 * Load workflow runs for the current service
 * Uses global variables: currentServiceOrg, currentServiceRepo
 * @returns {Promise<void>}
 */
export async function loadWorkflowRunsForService() {
    if (!currentServiceOrg || !currentServiceRepo) {
        return;
    }

    if (!getToken()) {
        const content = document.getElementById('service-workflows-content');
        const linkBtnColor = getCssVar('--color-link-btn');
        const linkBtnHover = getCssVar('--color-link-btn-hover');
        const textSecondary = getCssVar('--color-text-secondary');
        content.innerHTML = `
            <div class="widget-empty">
                <p style="margin-bottom: 15px;">GitHub Personal Access Token required to view workflow runs.</p>
                <button
                    onclick="openSettings()"
                    style="background: ${linkBtnColor}; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.95rem; font-weight: 500;"
                    onmouseover="this.style.background='${linkBtnHover}'"
                    onmouseout="this.style.background='${linkBtnColor}'">
                    Set GitHub PAT
                </button>
                <p style="margin-top: 10px; font-size: 0.85rem; color: ${textSecondary};">
                    Need a PAT with <code>workflow</code> scope to view workflow runs.
                </p>
            </div>
        `;
        return;
    }

    const content = document.getElementById('service-workflows-content');
    content.innerHTML = '<div class="loading">Loading workflow runs...</div>';

    try {
        const response = await fetch(
            `${API_CONFIG.GITHUB_BASE_URL}/repos/${currentServiceOrg}/${currentServiceRepo}/actions/runs?per_page=${API_CONFIG.PER_PAGE}&_t=${Date.now()}`,
            {
                headers: {
                    'Authorization': `token ${getToken()}`,
                    'Accept': API_CONFIG.ACCEPT_HEADER
                },
                cache: 'no-cache'
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch workflow runs: ${response.status}`);
        }

        const data = await response.json();

        // Add org/repo metadata to each run
        serviceWorkflowRuns = data.workflow_runs.map(run => ({
            ...run,
            org: currentServiceOrg,
            repo: currentServiceRepo
        }));

        serviceWorkflowLoaded = true;

        // Update UI
        renderServiceWorkflowRuns();

        // Start polling for updates with configured interval
        startServiceWorkflowPolling();

    } catch (error) {
        console.error('Error fetching service workflow runs:', error);
        const errorColor = getCssVar('--color-text-error');
        const textSecondary = getCssVar('--color-text-secondary');
        content.innerHTML = `
            <div class="widget-empty">
                <p style="color: ${errorColor}; margin-bottom: 10px;">Error loading workflow runs</p>
                <p style="font-size: 0.9rem; color: ${textSecondary};">${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}

/**
 * Start or restart polling for service workflow runs
 * Uses global variables: serviceWorkflowPollInterval, serviceWorkflowPollIntervalTime
 * @returns {void}
 */
export function startServiceWorkflowPolling() {
    // Clear existing interval
    if (serviceWorkflowPollInterval) {
        clearInterval(serviceWorkflowPollInterval);
        serviceWorkflowPollInterval = null;
    }

    // Only start polling if interval is not 0 (disabled) and PAT is available
    if (serviceWorkflowPollIntervalTime > 0 && getToken()) {
        serviceWorkflowPollInterval = setInterval(() => {
            loadWorkflowRunsForService();
        }, serviceWorkflowPollIntervalTime);
    }
}

/**
 * Change service workflow polling interval
 * Uses global variables: serviceWorkflowPollIntervalTime
 * @returns {void}
 */
export function changeServicePollingInterval() {
    const select = document.getElementById('service-workflow-interval-select');
    const newInterval = parseInt(select.value);

    // Save preference
    localStorage.setItem(STORAGE_KEYS.SERVICE_WORKFLOW_POLL_INTERVAL, newInterval);
    serviceWorkflowPollIntervalTime = newInterval;

    // Restart polling with new interval
    startServiceWorkflowPolling();

    // Provide user feedback
    if (newInterval === 0) {
        showToast('Auto-refresh disabled. Use refresh button for manual updates.', 'info');
    } else {
        const intervalText = formatInterval(newInterval);
        showToast(`Auto-refresh set to ${intervalText}`, 'success');
    }
}

/**
 * Refresh service workflow runs manually
 * Uses global variables: serviceWorkflowLoaded
 * @returns {Promise<void>}
 */
export async function refreshServiceWorkflowRuns() {
    const button = document.getElementById('service-workflow-refresh');
    if (!button) return;

    // Add spinning animation
    startButtonSpin(button);

    // Clear loaded flag to force fresh fetch
    serviceWorkflowLoaded = false;

    try {
        await loadWorkflowRunsForService();
        showToast('Workflow runs refreshed', 'success');
    } catch (error) {
        showToast('Failed to refresh workflow runs', 'error');
    } finally {
        // Remove spinning animation
        stopButtonSpin(button);
    }
}

/**
 * Render service workflow runs with current filter
 * Uses global variables: serviceWorkflowRuns, serviceWorkflowFilterStatus
 * @returns {void}
 */
export function renderServiceWorkflowRuns() {
    const content = document.getElementById('service-workflows-content');

    // Filter runs based on selected status
    let filteredRuns = serviceWorkflowRuns;
    if (serviceWorkflowFilterStatus !== 'all') {
        filteredRuns = serviceWorkflowRuns.filter(run => run.status === serviceWorkflowFilterStatus);
    }

    // Update filter counts
    updateServiceFilterCounts();

    if (filteredRuns.length === 0) {
        const statusText = serviceWorkflowFilterStatus === 'all' ? '' : serviceWorkflowFilterStatus.replace('_', ' ');
        content.innerHTML = `
            <div class="widget-empty">
                <p>No ${statusText} workflow runs found</p>
            </div>
        `;
        return;
    }

    // Render workflow runs using existing renderWorkflowRun function
    content.innerHTML = filteredRuns.map(run => renderWorkflowRun(run)).join('');

    // Start live duration updates for running workflows
    if (serviceWorkflowFilterStatus === 'all' || serviceWorkflowFilterStatus === 'in_progress') {
        startServiceLiveDurationUpdates();
    }
}

/**
 * Update service filter counts
 * Uses global variables: serviceWorkflowRuns
 * @returns {void}
 */
export function updateServiceFilterCounts() {
    const all = serviceWorkflowRuns.length;
    const running = serviceWorkflowRuns.filter(r => r.status === 'in_progress').length;
    const queued = serviceWorkflowRuns.filter(r => r.status === 'queued').length;
    const completed = serviceWorkflowRuns.filter(r => r.status === 'completed').length;

    const allEl = document.getElementById('service-filter-count-all');
    const runningEl = document.getElementById('service-filter-count-in_progress');
    const queuedEl = document.getElementById('service-filter-count-queued');
    const completedEl = document.getElementById('service-filter-count-completed');

    if (allEl) allEl.textContent = all;
    if (runningEl) runningEl.textContent = running;
    if (queuedEl) queuedEl.textContent = queued;
    if (completedEl) completedEl.textContent = completed;
}

/**
 * Filter service workflows by status
 * Uses global variables: serviceWorkflowFilterStatus
 * @param {string} status - Filter status ('all', 'in_progress', 'queued', 'completed')
 * @returns {void}
 */
export function filterServiceWorkflows(status) {
    serviceWorkflowFilterStatus = status;

    // Update active button in the workflows tab
    const workflowsTab = document.getElementById('workflows-tab');
    if (workflowsTab) {
        workflowsTab.querySelectorAll('.widget-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = workflowsTab.querySelector(`[data-status="${status}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    // Re-render content
    renderServiceWorkflowRuns();
}

/**
 * Start live duration updates for service workflows
 * Uses global variables: serviceDurationUpdateInterval
 * @returns {void}
 */
export function startServiceLiveDurationUpdates() {
    // Clear any existing interval
    if (serviceDurationUpdateInterval) {
        clearInterval(serviceDurationUpdateInterval);
    }

    // Update every second
    serviceDurationUpdateInterval = setInterval(() => {
        const serviceContent = document.getElementById('service-workflows-content');
        if (!serviceContent) {
            clearInterval(serviceDurationUpdateInterval);
            return;
        }

        const durationElements = serviceContent.querySelectorAll('.widget-run-duration');
        durationElements.forEach(el => {
            const startedAt = el.dataset.started;
            const status = el.dataset.status;

            if (startedAt) {
                const start = new Date(startedAt);
                const now = new Date();
                const durationMs = now - start;

                const timeStr = formatDuration(durationMs);

                // Add appropriate label based on status
                const label = status === 'in_progress' ? 'Running for' :
                             status === 'queued' ? 'Queued' : 'Completed';

                el.textContent = `${label} ${timeStr}`;
            }
        });
    }, 1000);
}
