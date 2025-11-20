/**
 * GitHub Actions Widget
 * Sidebar widget for monitoring workflow runs in the scorecards repository
 */

import { escapeHtml, formatDuration, formatInterval } from '../utils/formatting.js';
import { showToast } from './toast.js';
import { getToken } from '../services/auth.js';

// Widget State
let widgetOpen = false;
let widgetWorkflowRuns = [];
let widgetFilterStatus = 'all';
let widgetPollInterval = null;
let widgetLastFetch = 0;
let currentPollingInterval = 30000; // Default 30s, configurable
const WIDGET_POLL_INTERVAL_ACTIVE = 30000; // 30 seconds when activity detected
const WIDGET_POLL_INTERVAL_IDLE = 60000; // 60 seconds when idle
const WIDGET_CACHE_TTL = 15000; // 15 seconds cache

/**
 * Initialize the widget
 * Uses global variables: REPO_OWNER, REPO_NAME
 * @returns {void}
 */
export function initializeActionsWidget() {
    // Load saved interval preference
    const savedInterval = localStorage.getItem('widget_poll_interval');
    if (savedInterval !== null) {
        currentPollingInterval = parseInt(savedInterval);
        // Update dropdown to reflect saved value
        const select = document.getElementById('widget-interval-select');
        if (select) {
            select.value = savedInterval;
        }
    }

    // Set GitHub Actions link URL
    const actionsLink = document.getElementById('widget-actions-link');
    if (actionsLink) {
        actionsLink.href = `https://github.com/${REPO_OWNER}/${REPO_NAME}/actions`;
    }

    // Start polling if PAT is available
    if (getToken()) {
        startWidgetPolling();
    }
}

/**
 * Toggle widget visibility
 * @returns {void}
 */
export function toggleActionsWidget() {
    widgetOpen = !widgetOpen;
    const sidebar = document.getElementById('widget-sidebar');
    const toggle = document.getElementById('widget-toggle');

    if (widgetOpen) {
        sidebar.classList.add('open');
        toggle.classList.add('active');

        // Fetch data when opening if PAT is available
        if (getToken()) {
            fetchWorkflowRuns();
        }
    } else {
        sidebar.classList.remove('open');
        toggle.classList.remove('active');
    }
}

/**
 * Start polling for workflow runs
 * @returns {void}
 */
export function startWidgetPolling() {
    // Clear existing interval
    if (widgetPollInterval) {
        clearInterval(widgetPollInterval);
        widgetPollInterval = null;
    }

    // Initial fetch
    fetchWorkflowRuns();

    // If interval is 0 (disabled), don't start polling
    if (currentPollingInterval === 0) {
        console.log('Widget auto-refresh disabled by user preference');
        return;
    }

    // Set up polling with current interval
    widgetPollInterval = setInterval(() => {
        fetchWorkflowRuns();
    }, currentPollingInterval);

    console.log(`Widget polling started with ${currentPollingInterval}ms interval`);
}

/**
 * Stop polling
 * @returns {void}
 */
export function stopWidgetPolling() {
    if (widgetPollInterval) {
        clearInterval(widgetPollInterval);
        widgetPollInterval = null;
    }
}

/**
 * Fetch workflow runs from GitHub Actions API
 * Uses global variables: REPO_OWNER, REPO_NAME
 * @returns {Promise<void>}
 */
export async function fetchWorkflowRuns() {
    if (!getToken()) {
        renderWidgetEmpty('no-pat');
        return;
    }

    // Check cache
    const now = Date.now();
    if (now - widgetLastFetch < WIDGET_CACHE_TTL && widgetWorkflowRuns.length > 0) {
        console.log('Using cached workflow runs');
        return;
    }

    try {
        // Fetch workflow runs from the scorecards repository
        const response = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=25&_t=${Date.now()}`,
            {
                headers: {
                    'Authorization': `token ${getToken()}`,
                    'Accept': 'application/vnd.github.v3+json'
                },
                cache: 'no-cache'
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch workflow runs: ${response.status}`);
        }

        const data = await response.json();

        // Add org/repo metadata to each run
        const allRuns = data.workflow_runs.map(run => ({
            ...run,
            org: REPO_OWNER,
            repo: REPO_NAME,
            service_name: 'Scorecards'
        }));

        // Filter to recent runs (last 24 hours) and sort by created_at
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        widgetWorkflowRuns = allRuns
            .filter(run => new Date(run.created_at) > oneDayAgo)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        widgetLastFetch = now;

        // Update UI
        updateWidgetBadge();
        renderWidgetContent();

    } catch (error) {
        console.error('Error fetching workflow runs:', error);
        renderWidgetEmpty('error', error.message);
    }
}

/**
 * Update widget badge count
 * @returns {void}
 */
export function updateWidgetBadge() {
    const badge = document.getElementById('widget-badge');
    const activeRuns = widgetWorkflowRuns.filter(run =>
        run.status === 'in_progress' || run.status === 'queued'
    );

    badge.textContent = activeRuns.length;
    badge.style.display = activeRuns.length > 0 ? 'flex' : 'none';
}

/**
 * Render widget content based on current filter
 * @returns {void}
 */
export function renderWidgetContent() {
    const content = document.getElementById('widget-content');

    // Filter runs based on selected status
    let filteredRuns = widgetWorkflowRuns;
    if (widgetFilterStatus !== 'all') {
        filteredRuns = widgetWorkflowRuns.filter(run => run.status === widgetFilterStatus);
    }

    // Update filter counts
    updateFilterCounts();

    if (filteredRuns.length === 0) {
        content.innerHTML = `
            <div class="widget-empty">
                <p>No ${widgetFilterStatus === 'all' ? '' : widgetFilterStatus} workflow runs in the last 24 hours</p>
            </div>
        `;
        return;
    }

    // Render workflow runs
    content.innerHTML = filteredRuns.map(run => renderWorkflowRun(run)).join('');

    // Start live duration updates for running workflows
    if (widgetFilterStatus === 'all' || widgetFilterStatus === 'in_progress') {
        startLiveDurationUpdates();
    }
}

/**
 * Render a single workflow run
 * @param {Object} run - Workflow run object
 * @returns {string} HTML string
 */
function renderWorkflowRun(run) {
    const statusClass = run.status === 'completed'
        ? (run.conclusion === 'success' ? 'success' : run.conclusion === 'failure' ? 'failure' : 'neutral')
        : run.status;

    const statusIcon = getStatusIcon(run.status, run.conclusion);
    const durationInfo = calculateDuration(run);

    return `
        <div class="widget-run-item" data-run-id="${run.id}">
            <div class="widget-run-header">
                <span class="widget-run-status status-${statusClass}">${statusIcon}</span>
                <div class="widget-run-info">
                    <div class="widget-run-name">${escapeHtml(run.name)}</div>
                    <div class="widget-run-repo">${escapeHtml(run.org)}/${escapeHtml(run.repo)}</div>
                </div>
            </div>
            <div class="widget-run-meta">
                <span class="widget-run-duration" data-started="${run.run_started_at || run.created_at}" data-status="${run.status}">
                    ${durationInfo.label} ${durationInfo.time}
                </span>
                <a href="${run.html_url}" target="_blank" rel="noopener noreferrer" class="widget-run-link" onclick="event.stopPropagation()">
                    View
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"></path>
                    </svg>
                </a>
            </div>
        </div>
    `;
}

/**
 * Get status icon based on status and conclusion
 * @param {string} status - Run status
 * @param {string} conclusion - Run conclusion
 * @returns {string} Icon HTML
 */
function getStatusIcon(status, conclusion) {
    if (status === 'in_progress') {
        return '<span class="spinner-small"></span>';
    } else if (status === 'queued') {
        return '⏳';
    } else if (status === 'completed') {
        if (conclusion === 'success') return '✓';
        if (conclusion === 'failure') return '✗';
        if (conclusion === 'cancelled') return '⊘';
        return '●';
    }
    return '●';
}

/**
 * Calculate duration for a workflow run
 * @param {Object} run - Workflow run object
 * @returns {Object} Duration info with label and time
 */
function calculateDuration(run) {
    const now = new Date();

    if (run.status === 'completed') {
        // Show time since completion
        const completedAt = new Date(run.updated_at);
        const timeSince = now - completedAt;
        return {
            label: 'Completed',
            time: formatDuration(timeSince)
        };
    } else if (run.status === 'in_progress') {
        // Show running time
        const startedAt = new Date(run.run_started_at);
        const elapsed = now - startedAt;
        return {
            label: 'Running for',
            time: formatDuration(elapsed)
        };
    } else {
        // Queued - show time since creation
        const createdAt = new Date(run.created_at);
        const waiting = now - createdAt;
        return {
            label: 'Queued',
            time: formatDuration(waiting)
        };
    }
}

/**
 * Start live duration updates for running workflows
 * @returns {void}
 */
function startLiveDurationUpdates() {
    // Update every second
    setInterval(() => {
        const durationElements = document.querySelectorAll('.widget-run-duration');
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

/**
 * Update filter counts
 * @returns {void}
 */
function updateFilterCounts() {
    const all = widgetWorkflowRuns.length;
    const running = widgetWorkflowRuns.filter(r => r.status === 'in_progress').length;
    const queued = widgetWorkflowRuns.filter(r => r.status === 'queued').length;
    const completed = widgetWorkflowRuns.filter(r => r.status === 'completed').length;

    document.getElementById('count-all').textContent = all;
    document.getElementById('count-running').textContent = running;
    document.getElementById('count-queued').textContent = queued;
    document.getElementById('count-completed').textContent = completed;
}

/**
 * Filter actions by status
 * @param {string} status - Filter status
 * @returns {void}
 */
export function filterActions(status) {
    widgetFilterStatus = status;

    // Update active button
    document.querySelectorAll('.widget-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-status="${status}"]`).classList.add('active');

    // Re-render content
    renderWidgetContent();
}

/**
 * Refresh widget manually
 * @returns {Promise<void>}
 */
export async function refreshActionsWidget() {
    const btn = document.getElementById('widget-refresh');
    btn.classList.add('spinning');

    // Clear cache
    widgetLastFetch = 0;

    // Fetch new data
    await fetchWorkflowRuns();

    // Remove spinning class
    setTimeout(() => {
        btn.classList.remove('spinning');
    }, 500);

    showToast('GitHub Actions refreshed', 'success');
}

/**
 * Change polling interval
 * @returns {void}
 */
export function changePollingInterval() {
    const select = document.getElementById('widget-interval-select');
    const newInterval = parseInt(select.value);

    // Save preference
    localStorage.setItem('widget_poll_interval', newInterval);
    currentPollingInterval = newInterval;

    // Restart polling with new interval (if PAT is available)
    if (getToken()) {
        startWidgetPolling();
    }

    // Provide user feedback
    if (newInterval === 0) {
        showToast('Auto-refresh disabled. Use refresh button for manual updates.', 'info');
    } else {
        const intervalText = formatInterval(newInterval);
        showToast(`Auto-refresh set to ${intervalText}`, 'success');
    }
}

/**
 * Render empty state
 * @param {string} reason - Reason for empty state ('no-pat' or 'error')
 * @param {string} errorMessage - Optional error message
 * @returns {void}
 */
function renderWidgetEmpty(reason, errorMessage = '') {
    const content = document.getElementById('widget-content');

    if (reason === 'no-pat') {
        content.innerHTML = `
            <div class="widget-empty">
                <p>Configure GitHub PAT in settings to view workflow runs</p>
                <button onclick="openSettings()" class="widget-empty-btn">Open Settings</button>
            </div>
        `;
    } else if (reason === 'error') {
        content.innerHTML = `
            <div class="widget-empty">
                <p>Error loading workflow runs</p>
                <p class="widget-error-msg">${escapeHtml(errorMessage)}</p>
            </div>
        `;
    }

    // Update badge and counts
    updateWidgetBadge();
    document.getElementById('count-all').textContent = '0';
    document.getElementById('count-running').textContent = '0';
    document.getElementById('count-queued').textContent = '0';
    document.getElementById('count-completed').textContent = '0';
}

/**
 * Handle PAT save - restart widget polling
 * This should be called after PAT is saved
 * @returns {void}
 */
export function handlePATSaved() {
    // Start widget polling if PAT was saved successfully
    if (getToken()) {
        startWidgetPolling();
    }
}

/**
 * Handle PAT clear - stop widget polling
 * This should be called after PAT is cleared
 * @returns {void}
 */
export function handlePATCleared() {
    // Stop widget polling when PAT is cleared
    stopWidgetPolling();
    renderWidgetEmpty('no-pat');
}
