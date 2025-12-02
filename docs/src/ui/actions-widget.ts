/**
 * GitHub Actions Widget
 * Sidebar widget for monitoring workflow runs in the scorecards repository
 */

import {
  escapeHtml,
  formatDuration,
  formatInterval,
} from '../utils/formatting.js';
import { showToast } from './toast.js';
import { getToken } from '../services/auth.js';
import { API_CONFIG, TIMING, STORAGE_KEYS } from '../config/constants.js';
import { getRepoOwner, getRepoName } from '../api/registry.js';
import type { WorkflowRun, WorkflowStatus, WorkflowConclusion } from '../types/index.js';

// Window types are defined in types/globals.d.ts

// Widget State
let widgetOpen = false;
let widgetWorkflowRuns: WorkflowRun[] = [];
let widgetFilterStatus: 'all' | WorkflowStatus = 'all';
let widgetPollInterval: ReturnType<typeof setInterval> | null = null;
let widgetLastFetch = 0;
let currentPollingInterval: number = TIMING.POLLING_ACTIVE; // Default, configurable
const WIDGET_CACHE_TTL: number = TIMING.CACHE_MEDIUM; // 15 seconds cache

interface GitHubWorkflowRunResponse {
  workflow_runs: Array<{
    id: number;
    name: string;
    status: 'queued' | 'in_progress' | 'completed' | 'waiting';
    conclusion: WorkflowConclusion | null;
    html_url: string;
    created_at: string;
    updated_at: string;
    run_started_at?: string;
  }>;
}

/**
 * Initialize the widget
 */
export function initializeActionsWidget(): void {
  // Load saved interval preference
  const savedInterval = localStorage.getItem(STORAGE_KEYS.WIDGET_POLL_INTERVAL);
  if (savedInterval !== null) {
    currentPollingInterval = parseInt(savedInterval);
    // Update dropdown to reflect saved value
    const select = document.getElementById(
      'widget-interval-select'
    ) as HTMLSelectElement | null;
    if (select) {
      select.value = savedInterval;
    }
  }

  // Set GitHub Actions link URL
  const actionsLink = document.getElementById(
    'widget-actions-link'
  ) as HTMLAnchorElement | null;
  if (actionsLink) {
    actionsLink.href = `https://github.com/${getRepoOwner()}/${getRepoName()}/actions`;
  }

  // Start polling if PAT is available
  if (getToken()) {
    startWidgetPolling();
  }
}

/**
 * Toggle widget visibility
 */
export function toggleActionsWidget(): void {
  widgetOpen = !widgetOpen;
  const sidebar = document.getElementById('widget-sidebar');
  const toggle = document.getElementById('widget-toggle');

  if (widgetOpen) {
    sidebar?.classList.add('open');
    toggle?.classList.add('active');

    // Fetch data when opening if PAT is available
    if (getToken()) {
      fetchWorkflowRuns();
    }
  } else {
    sidebar?.classList.remove('open');
    toggle?.classList.remove('active');
  }
}

/**
 * Start polling for workflow runs
 */
export function startWidgetPolling(): void {
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
 */
export function stopWidgetPolling(): void {
  if (widgetPollInterval) {
    clearInterval(widgetPollInterval);
    widgetPollInterval = null;
  }
}

/**
 * Fetch workflow runs from GitHub Actions API
 */
export async function fetchWorkflowRuns(): Promise<void> {
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
      `${API_CONFIG.GITHUB_BASE_URL}/repos/${getRepoOwner()}/${getRepoName()}/actions/runs?per_page=${API_CONFIG.PER_PAGE}&_t=${Date.now()}`,
      {
        headers: {
          Authorization: `token ${getToken()}`,
          Accept: API_CONFIG.ACCEPT_HEADER,
        },
        cache: 'no-cache',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch workflow runs: ${response.status}`);
    }

    const data: GitHubWorkflowRunResponse = await response.json();

    // Add org/repo metadata to each run
    const allRuns: WorkflowRun[] = data.workflow_runs.map((run) => ({
      ...run,
      org: getRepoOwner(),
      repo: getRepoName(),
      service_name: 'Scorecards',
    }));

    // Filter to recent runs (last 24 hours) and sort by created_at
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    widgetWorkflowRuns = allRuns
      .filter((run) => new Date(run.created_at) > oneDayAgo)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    widgetLastFetch = now;

    // Update UI
    updateWidgetBadge();
    renderWidgetContent();
  } catch (error) {
    console.error('Error fetching workflow runs:', error);
    renderWidgetEmpty(
      'error',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Update widget badge count
 */
export function updateWidgetBadge(): void {
  const badge = document.getElementById('widget-badge');
  if (!badge) {return;}

  const activeRuns = widgetWorkflowRuns.filter(
    (run) => run.status === 'in_progress' || run.status === 'queued'
  );

  badge.textContent = String(activeRuns.length);
  badge.style.display = activeRuns.length > 0 ? 'flex' : 'none';
}

/**
 * Render widget content based on current filter
 */
export function renderWidgetContent(): void {
  const content = document.getElementById('widget-content');
  if (!content) {return;}

  // Filter runs based on selected status
  let filteredRuns = widgetWorkflowRuns;
  if (widgetFilterStatus !== 'all') {
    filteredRuns = widgetWorkflowRuns.filter(
      (run) => run.status === widgetFilterStatus
    );
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
  content.innerHTML = filteredRuns.map((run) => renderWorkflowRun(run)).join('');

  // Start live duration updates for running workflows
  if (widgetFilterStatus === 'all' || widgetFilterStatus === 'in_progress') {
    startLiveDurationUpdates();
  }
}

/**
 * Render a single workflow run
 */
function renderWorkflowRun(run: WorkflowRun): string {
  const statusClass =
    run.status === 'completed'
      ? run.conclusion === 'success'
        ? 'success'
        : run.conclusion === 'failure'
          ? 'failure'
          : 'neutral'
      : run.status;

  const statusIcon = getStatusIcon(run.status, run.conclusion || null);
  const durationInfo = calculateDuration(run);

  return `
        <div class="widget-run-item" data-run-id="${run.id}">
            <div class="widget-run-header">
                <span class="widget-run-status status-${statusClass}">${statusIcon}</span>
                <div class="widget-run-info">
                    <div class="widget-run-name">${escapeHtml(run.name)}</div>
                    <div class="widget-run-repo">${escapeHtml(run.org || '')}/${escapeHtml(run.repo || '')}</div>
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
 */
function getStatusIcon(
  status: WorkflowStatus,
  conclusion: WorkflowConclusion | null
): string {
  if (status === 'in_progress') {
    return '<span class="spinner-small"></span>';
  } else if (status === 'queued') {
    return '⏳';
  } else if (status === 'completed') {
    if (conclusion === 'success') {return '✓';}
    if (conclusion === 'failure') {return '✗';}
    if (conclusion === 'cancelled') {return '⊘';}
    return '●';
  }
  return '●';
}

interface DurationInfo {
  label: string;
  time: string;
}

/**
 * Calculate duration for a workflow run
 */
function calculateDuration(run: WorkflowRun): DurationInfo {
  const now = new Date();

  if (run.status === 'completed') {
    // Show time since completion
    const completedAt = new Date(run.updated_at);
    const timeSince = now.getTime() - completedAt.getTime();
    return {
      label: 'Completed',
      time: formatDuration(timeSince),
    };
  } else if (run.status === 'in_progress') {
    // Show running time
    const startedAt = new Date(run.run_started_at || run.created_at);
    const elapsed = now.getTime() - startedAt.getTime();
    return {
      label: 'Running for',
      time: formatDuration(elapsed),
    };
  } else {
    // Queued - show time since creation
    const createdAt = new Date(run.created_at);
    const waiting = now.getTime() - createdAt.getTime();
    return {
      label: 'Queued',
      time: formatDuration(waiting),
    };
  }
}

/**
 * Start live duration updates for running workflows
 */
function startLiveDurationUpdates(): void {
  // Update every second
  setInterval(() => {
    const durationElements =
      document.querySelectorAll<HTMLElement>('.widget-run-duration');
    durationElements.forEach((el) => {
      const startedAt = el.dataset.started;
      const status = el.dataset.status;

      if (startedAt) {
        const start = new Date(startedAt);
        const now = new Date();
        const durationMs = now.getTime() - start.getTime();

        const timeStr = formatDuration(durationMs);

        // Add appropriate label based on status
        const label =
          status === 'in_progress'
            ? 'Running for'
            : status === 'queued'
              ? 'Queued'
              : 'Completed';

        el.textContent = `${label} ${timeStr}`;
      }
    });
  }, 1000);
}

/**
 * Update filter counts
 */
function updateFilterCounts(): void {
  const all = widgetWorkflowRuns.length;
  const running = widgetWorkflowRuns.filter(
    (r) => r.status === 'in_progress'
  ).length;
  const queued = widgetWorkflowRuns.filter((r) => r.status === 'queued').length;
  const completed = widgetWorkflowRuns.filter(
    (r) => r.status === 'completed'
  ).length;

  const setCount = (id: string, count: number): void => {
    const el = document.getElementById(id);
    if (el) {el.textContent = String(count);}
  };

  setCount('count-all', all);
  setCount('count-running', running);
  setCount('count-queued', queued);
  setCount('count-completed', completed);
}

/**
 * Filter actions by status
 */
export function filterActions(status: 'all' | WorkflowStatus): void {
  widgetFilterStatus = status;

  // Update active button
  document.querySelectorAll('.widget-filter-btn').forEach((btn) => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-status="${status}"]`)?.classList.add('active');

  // Re-render content
  renderWidgetContent();
}

/**
 * Refresh widget manually
 */
export async function refreshActionsWidget(): Promise<void> {
  const btn = document.getElementById('widget-refresh');
  btn?.classList.add('spinning');

  // Clear cache
  widgetLastFetch = 0;

  // Fetch new data
  await fetchWorkflowRuns();

  // Remove spinning class
  setTimeout(() => {
    btn?.classList.remove('spinning');
  }, 500);

  showToast('GitHub Actions refreshed', 'success');
}

/**
 * Change polling interval
 */
export function changePollingInterval(): void {
  const select = document.getElementById(
    'widget-interval-select'
  ) as HTMLSelectElement | null;
  if (!select) {return;}

  const newInterval = parseInt(select.value);

  // Save preference
  localStorage.setItem(STORAGE_KEYS.WIDGET_POLL_INTERVAL, String(newInterval));
  currentPollingInterval = newInterval;

  // Restart polling with new interval (if PAT is available)
  if (getToken()) {
    startWidgetPolling();
  }

  // Provide user feedback
  if (newInterval === 0) {
    showToast(
      'Auto-refresh disabled. Use refresh button for manual updates.',
      'info'
    );
  } else {
    const intervalText = formatInterval(newInterval);
    showToast(`Auto-refresh set to ${intervalText}`, 'success');
  }
}

/**
 * Render empty state
 */
function renderWidgetEmpty(
  reason: 'no-pat' | 'error',
  errorMessage = ''
): void {
  const content = document.getElementById('widget-content');
  if (!content) {return;}

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
  const setZero = (id: string): void => {
    const el = document.getElementById(id);
    if (el) {el.textContent = '0';}
  };
  setZero('count-all');
  setZero('count-running');
  setZero('count-queued');
  setZero('count-completed');
}

/**
 * Handle PAT save - restart widget polling
 * This should be called after PAT is saved
 */
export function handlePATSaved(): void {
  // Start widget polling if PAT was saved successfully
  if (getToken()) {
    startWidgetPolling();
  }
}

/**
 * Handle PAT clear - stop widget polling
 * This should be called after PAT is cleared
 */
export function handlePATCleared(): void {
  // Stop widget polling when PAT is cleared
  stopWidgetPolling();
  renderWidgetEmpty('no-pat');
}
