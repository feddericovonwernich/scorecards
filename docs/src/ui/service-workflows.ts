/**
 * Service Workflows Manager
 * Handles workflow runs display and management for the service modal
 */

import {
  escapeHtml,
  formatInterval,
  formatDuration,
} from '../utils/formatting.js';
import { renderWorkflowRun } from './workflow-run.js';
import { showToast } from './toast.js';
import { getToken } from '../services/auth.js';
import { getCssVar } from '../utils/css.js';
import { API_CONFIG, STORAGE_KEYS } from '../config/constants.js';
import { startButtonSpin, stopButtonSpin } from '../utils/animation.js';
import type { WorkflowRun, WorkflowStatus } from '../types/index.js';

// Window types are defined in types/globals.d.ts

// Access window state variables
const getServiceOrg = (): string | null => window.currentServiceOrg;
const getServiceRepo = (): string | null => window.currentServiceRepo;

interface GitHubWorkflowRunsResponse {
  workflow_runs: WorkflowRun[];
}

/**
 * Load workflow runs for the current service
 * Uses global variables: currentServiceOrg, currentServiceRepo
 */
export async function loadWorkflowRunsForService(): Promise<void> {
  const currentServiceOrg = getServiceOrg();
  const currentServiceRepo = getServiceRepo();
  if (!currentServiceOrg || !currentServiceRepo) {
    return;
  }

  if (!getToken()) {
    const content = document.getElementById('service-workflows-content');
    if (!content) {return;}

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
  if (!content) {return;}

  // Only show loading message on initial load, not on refresh (prevents blink)
  if (!window.serviceWorkflowLoaded) {
    content.innerHTML = '<div class="loading">Loading workflow runs...</div>';
  }

  try {
    const response = await fetch(
      `${API_CONFIG.GITHUB_BASE_URL}/repos/${currentServiceOrg}/${currentServiceRepo}/actions/runs?per_page=${API_CONFIG.PER_PAGE}&_t=${Date.now()}`,
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

    const data: GitHubWorkflowRunsResponse = await response.json();

    // Add org/repo metadata to each run
    window.serviceWorkflowRuns = data.workflow_runs.map((run) => ({
      ...run,
      org: currentServiceOrg,
      repo: currentServiceRepo,
    }));

    window.serviceWorkflowLoaded = true;

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
                <p style="font-size: 0.9rem; color: ${textSecondary};">${escapeHtml(error instanceof Error ? error.message : String(error))}</p>
            </div>
        `;
  }
}

/**
 * Start or restart polling for service workflow runs
 */
export function startServiceWorkflowPolling(): void {
  // Clear existing interval
  if (window.serviceWorkflowPollInterval) {
    clearInterval(window.serviceWorkflowPollInterval);
    window.serviceWorkflowPollInterval = null;
  }

  // Only start polling if interval is not 0 (disabled) and PAT is available
  if (window.serviceWorkflowPollIntervalTime > 0 && getToken()) {
    window.serviceWorkflowPollInterval = setInterval(() => {
      loadWorkflowRunsForService();
    }, window.serviceWorkflowPollIntervalTime);
  }
}

/**
 * Change service workflow polling interval
 */
export function changeServicePollingInterval(): void {
  const select = document.getElementById(
    'service-workflow-interval-select'
  ) as HTMLSelectElement | null;
  if (!select) {return;}

  const newInterval = parseInt(select.value);

  // Save preference
  localStorage.setItem(
    STORAGE_KEYS.SERVICE_WORKFLOW_POLL_INTERVAL,
    String(newInterval)
  );
  window.serviceWorkflowPollIntervalTime = newInterval;

  // Restart polling with new interval
  startServiceWorkflowPolling();

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
 * Refresh service workflow runs manually
 */
export async function refreshServiceWorkflowRuns(): Promise<void> {
  const button = document.getElementById('service-workflow-refresh');
  if (!button) {return;}

  // Add spinning animation
  startButtonSpin(button);

  // Clear loaded flag to force fresh fetch
  window.serviceWorkflowLoaded = false;

  try {
    await loadWorkflowRunsForService();
    showToast('Workflow runs refreshed', 'success');
  } catch (_error) {
    showToast('Failed to refresh workflow runs', 'error');
  } finally {
    // Remove spinning animation
    stopButtonSpin(button);
  }
}

/**
 * Render service workflow runs with current filter
 */
export function renderServiceWorkflowRuns(): void {
  const content = document.getElementById('service-workflows-content');
  if (!content) {return;}

  // Filter runs based on selected status
  let filteredRuns = window.serviceWorkflowRuns;
  if (window.serviceWorkflowFilterStatus !== 'all') {
    filteredRuns = window.serviceWorkflowRuns.filter(
      (run) => run.status === window.serviceWorkflowFilterStatus
    );
  }

  // Update filter counts
  updateServiceFilterCounts();

  if (filteredRuns.length === 0) {
    const statusText =
      window.serviceWorkflowFilterStatus === 'all'
        ? ''
        : window.serviceWorkflowFilterStatus.replace('_', ' ');
    content.innerHTML = `
            <div class="widget-empty">
                <p>No ${statusText} workflow runs found</p>
            </div>
        `;
    return;
  }

  // Render workflow runs using existing renderWorkflowRun function
  content.innerHTML = filteredRuns.map((run) => renderWorkflowRun(run)).join('');

  // Start live duration updates for running workflows
  if (
    window.serviceWorkflowFilterStatus === 'all' ||
    window.serviceWorkflowFilterStatus === 'in_progress'
  ) {
    startServiceLiveDurationUpdates();
  }
}

/**
 * Update service filter counts
 */
export function updateServiceFilterCounts(): void {
  const all = window.serviceWorkflowRuns.length;
  const running = window.serviceWorkflowRuns.filter(
    (r) => r.status === 'in_progress'
  ).length;
  const queued = window.serviceWorkflowRuns.filter((r) => r.status === 'queued').length;
  const completed = window.serviceWorkflowRuns.filter(
    (r) => r.status === 'completed'
  ).length;

  const setCount = (id: string, count: number): void => {
    const el = document.getElementById(id);
    if (el) {el.textContent = String(count);}
  };

  setCount('service-filter-count-all', all);
  setCount('service-filter-count-in_progress', running);
  setCount('service-filter-count-queued', queued);
  setCount('service-filter-count-completed', completed);
}

/**
 * Filter service workflows by status
 */
export function filterServiceWorkflows(status: 'all' | WorkflowStatus): void {
  window.serviceWorkflowFilterStatus = status;

  // Update active button in the workflows tab
  const workflowsTab = document.getElementById('workflows-tab');
  if (workflowsTab) {
    workflowsTab.querySelectorAll('.widget-filter-btn').forEach((btn) => {
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
 */
export function startServiceLiveDurationUpdates(): void {
  // Clear any existing interval
  if (window.serviceDurationUpdateInterval) {
    clearInterval(window.serviceDurationUpdateInterval);
  }

  // Update every second
  window.serviceDurationUpdateInterval = setInterval(() => {
    const serviceContent = document.getElementById('service-workflows-content');
    if (!serviceContent) {
      if (window.serviceDurationUpdateInterval) {
        clearInterval(window.serviceDurationUpdateInterval);
      }
      return;
    }

    const durationElements =
      serviceContent.querySelectorAll<HTMLElement>('.widget-run-duration');
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
