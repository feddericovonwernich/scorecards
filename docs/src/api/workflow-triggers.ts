/**
 * GitHub Actions Workflow Triggers
 * Handles triggering scorecards workflows via GitHub API
 */

import { getToken, clearToken } from '../services/auth.js';
import { showToastGlobal } from '../components/ui/Toast.js';
import { DEPLOYMENT } from '../config/deployment.js';
import { WORKFLOWS, getWorkflowDispatchUrl } from '../config/workflows.js';
import * as storeAccessor from '../stores/accessor.js';
import type { ServiceData } from '../types/index.js';

// Window types are defined in types/globals.d.ts

// ============================================================================
// Button State Utilities (inline versions of the deleted ui/button-states.ts)
// ============================================================================

// SVG icon strings for button states
const CHECKMARK_ICON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" /></svg>';
const X_ICON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" /></svg>';
const SPINNING_REFRESH_ICON = '<svg class="spinning" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" /></svg>';

/**
 * Set button to loading state
 */
function setButtonLoading(button: HTMLButtonElement, title = 'Triggering...'): void {
  button.disabled = true;
  button.dataset.originalHtml = button.innerHTML;
  button.dataset.originalTitle = button.title;
  button.dataset.originalBg = button.style.backgroundColor;
  button.innerHTML = SPINNING_REFRESH_ICON;
  button.title = title;
}

/**
 * Set button to success state
 */
async function setButtonSuccess(button: HTMLButtonElement, title = '✓ Triggered Successfully'): Promise<void> {
  button.innerHTML = CHECKMARK_ICON;
  button.title = title;
  button.style.backgroundColor = '#10b981'; // success green
  button.classList.add('success');
  await new Promise((resolve) => setTimeout(resolve, 3000));
  resetButton(button);
}

/**
 * Set button to error state
 */
async function setButtonError(button: HTMLButtonElement, title = '✗ Trigger Failed'): Promise<void> {
  button.innerHTML = X_ICON;
  button.title = title;
  button.style.backgroundColor = '#ef4444'; // error red
  button.classList.add('error');
  await new Promise((resolve) => setTimeout(resolve, 3000));
  resetButton(button);
}

/**
 * Reset button to original state
 */
function resetButton(button: HTMLButtonElement): void {
  button.disabled = false;
  button.classList.remove('success', 'error');
  button.style.backgroundColor = '';
  if (button.dataset.originalHtml) {
    button.innerHTML = button.dataset.originalHtml;
    delete button.dataset.originalHtml;
  }
  if (button.dataset.originalTitle) {
    button.title = button.dataset.originalTitle;
    delete button.dataset.originalTitle;
  }
  if (button.dataset.originalBg) {
    button.style.backgroundColor = button.dataset.originalBg;
    delete button.dataset.originalBg;
  }
}

// ============================================================================
// Workflow Trigger Functions
// ============================================================================

// Get repo info from registry module
const getRepoInfo = (): { owner: string; name: string } => {
  const { getRepoOwner, getRepoName } = window.ScorecardModules.registry;
  return {
    owner: getRepoOwner(),
    name: getRepoName(),
  };
};

/**
 * Trigger scorecard workflow for a single service
 */
export async function triggerServiceWorkflow(
  org: string,
  repo: string,
  buttonElement: HTMLButtonElement
): Promise<boolean> {
  const token = getToken();

  if (!token) {
    showToastGlobal(
      'Please configure a GitHub PAT in Settings to trigger workflows',
      'warning'
    );
    window.openSettings?.();
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
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': DEPLOYMENT.api.version,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: { org, repo },
        }),
      }
    );

    if (response.status === 204) {
      showToastGlobal(`Scorecard workflow triggered for ${org}/${repo}`, 'success');
      await setButtonSuccess(buttonElement, '✓ Triggered Successfully');
      return true;
    } else if (response.status === 401) {
      clearToken();
      showToastGlobal(
        'Invalid GitHub token. Please enter a valid token in Settings.',
        'error'
      );
      await setButtonError(buttonElement, '✗ Trigger Failed');
      return false;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to trigger workflow:', response.status, errorData);
      showToastGlobal(
        `Failed to trigger workflow: ${(errorData as { message?: string }).message || response.statusText}`,
        'error'
      );
      await setButtonError(buttonElement, '✗ Trigger Failed');
      return false;
    }
  } catch (error) {
    console.error('Error triggering workflow:', error);
    showToastGlobal(
      `Error triggering workflow: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    await setButtonError(buttonElement, '✗ Trigger Failed');
    return false;
  }
}

/**
 * Create installation PR for a service
 */
export async function installService(
  org: string,
  repo: string,
  buttonElement: HTMLButtonElement
): Promise<boolean> {
  const token = getToken();

  if (!token) {
    showToastGlobal(
      'GitHub token is required to create installation PRs',
      'error'
    );
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
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': DEPLOYMENT.api.version,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: { org, repo },
        }),
      }
    );

    if (response.status === 204) {
      showToastGlobal(
        `Installation PR creation started for ${org}/${repo}`,
        'success'
      );

      setTimeout(() => {
        showToastGlobal(
          'Note: PR status will appear in the catalog in 3-5 minutes due to GitHub Pages deployment.',
          'info'
        );
      }, 2000);

      if (buttonElement) {
        buttonElement.innerHTML = '⏳ PR Creating...';

        // Poll and refresh
        setTimeout(async () => {
          try {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            showToastGlobal('Installation PR created! Refreshing...', 'success');

            const modal = document.getElementById('service-modal');
            modal?.classList.add('hidden');
            setTimeout(() => window.showServiceDetail?.(org, repo), 500);
          } catch (error) {
            console.error('Error checking PR status:', error);
            resetButton(buttonElement);
          }
        }, 1000);
      }

      return true;
    } else if (response.status === 401) {
      clearToken();
      showToastGlobal(
        'Invalid GitHub token. Please enter a valid token with workflow permissions.',
        'error'
      );
      resetButton(buttonElement);
      return false;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        'Failed to create installation PR:',
        response.status,
        errorData
      );
      showToastGlobal(
        `Failed to create installation PR: ${(errorData as { message?: string }).message || response.statusText}`,
        'error'
      );
      resetButton(buttonElement);
      return false;
    }
  } catch (error) {
    console.error('Error creating installation PR:', error);
    showToastGlobal(
      `Error creating installation PR: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    resetButton(buttonElement);
    return false;
  }
}

/**
 * Trigger workflows for multiple services (bulk operation)
 */
export async function triggerBulkWorkflows(
  services: ServiceData[],
  buttonElement: HTMLButtonElement
): Promise<boolean> {
  const token = getToken();

  if (!token) {
    showToastGlobal('GitHub token is required to trigger workflows', 'error');
    return false;
  }

  setButtonLoading(buttonElement, 'Triggering...');

  try {
    const servicesArray = services.map((s) => ({ org: s.org, repo: s.repo }));
    const { owner, name } = getRepoInfo();

    const response = await fetch(
      getWorkflowDispatchUrl(owner, name, WORKFLOWS.files.triggerService),
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': DEPLOYMENT.api.version,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            services: JSON.stringify(servicesArray),
          },
        }),
      }
    );

    if (response.status === 204) {
      const count = services.length;
      showToastGlobal(
        `Triggered workflows for ${count} service${count !== 1 ? 's' : ''}`,
        'success'
      );
      await setButtonSuccess(
        buttonElement,
        `✓ Triggered ${count} service${count !== 1 ? 's' : ''}`
      );
      return true;
    } else if (response.status === 401) {
      clearToken();
      showToastGlobal(
        'Invalid GitHub token. Please enter a valid token in Settings.',
        'error'
      );
      resetButton(buttonElement);
      return false;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        'Failed to trigger bulk workflows:',
        response.status,
        errorData
      );
      showToastGlobal(
        `Failed to trigger workflows: ${(errorData as { message?: string }).message || response.statusText}`,
        'error'
      );
      resetButton(buttonElement);
      return false;
    }
  } catch (error) {
    console.error('Error triggering bulk workflows:', error);
    showToastGlobal(
      `Error triggering workflows: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    resetButton(buttonElement);
    return false;
  }
}

/**
 * Handle bulk trigger button click (stale services only)
 */
export function handleBulkTrigger(event: Event): void {
  event.preventDefault();

  const { isServiceStale } = window.ScorecardModules.staleness;
  const staleServices = storeAccessor.getAllServices().filter(
    (s) => isServiceStale(s, storeAccessor.getChecksHash()) && s.installed
  );

  if (staleServices.length === 0) {
    showToastGlobal('No stale services to trigger', 'info');
    return;
  }

  if (
    confirm(
      `This will trigger scorecard workflows for ${staleServices.length} stale service${staleServices.length !== 1 ? 's' : ''}.\n\nContinue?`
    )
  ) {
    triggerBulkWorkflows(staleServices, event.currentTarget as HTMLButtonElement);
  }
}

/**
 * Handle bulk trigger all button click (all installed services)
 */
export function handleBulkTriggerAll(event: Event): void {
  event.preventDefault();

  const installedServices = storeAccessor.getAllServices().filter((s) => s.installed);

  if (installedServices.length === 0) {
    showToastGlobal('No installed services to trigger', 'info');
    return;
  }

  if (
    confirm(
      `This will trigger scorecard workflows for ALL ${installedServices.length} installed service${installedServices.length !== 1 ? 's' : ''}.\n\nThis may take a while. Continue?`
    )
  ) {
    triggerBulkWorkflows(installedServices, event.currentTarget as HTMLButtonElement);
  }
}
