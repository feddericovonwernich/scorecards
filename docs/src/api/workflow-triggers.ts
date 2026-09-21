/**
 * GitHub Actions Workflow Triggers
 * Handles triggering scorecards workflows via GitHub API
 */

import { getToken } from '../services/auth.js';
import { showToastGlobal } from '../components/ui/Toast.js';
import { WORKFLOWS } from '../config/workflows.js';
import * as storeAccessor from '../stores/accessor.js';
import type { ServiceData } from '../types/index.js';
import { getRepoOwner, getRepoName } from './registry.js';
import { triggerWorkflowDispatch } from './github.js';
import { isServiceStale } from '../services/staleness.js';

// Window types are defined in types/globals.d.ts

// ============================================================================
// Button State Management
// ============================================================================
// Note: Button state is now managed by React components using useButtonState hook
// No DOM manipulation here - components handle their own state

// ============================================================================
// Workflow Trigger Functions
// ============================================================================

// Get repo info from registry module
const getRepoInfo = (): { owner: string; name: string } => {
  return {
    owner: getRepoOwner(),
    name: getRepoName(),
  };
};

/**
 * Trigger scorecard workflow for a single service
 * Note: Button state is managed by React components using useButtonState hook
 */
export async function triggerServiceWorkflow(
  org: string,
  repo: string
): Promise<boolean> {
  if (!getToken()) {
    showToastGlobal(
      'Please configure a GitHub PAT in Settings to trigger workflows',
      'warning'
    );
    window.openSettings?.();
    return false;
  }

  try {
    const { owner, name } = getRepoInfo();
    const receipt = await triggerWorkflowDispatch(
      owner, name, WORKFLOWS.files.triggerService, { org, repo }
    );
    if (receipt.accepted) {
      showToastGlobal(`Scorecard workflow triggered for ${org}/${repo}`, 'success');
      return true;
    }
    if (receipt.status === 401) {
      showToastGlobal(
        'Invalid GitHub token. Please enter a valid token in Settings.',
        'error'
      );
      return false;
    }
    showToastGlobal(`Failed to trigger workflow: ${receipt.reason}`, 'error');
    return false;
  } catch (error) {
    console.error('Error triggering workflow:', error);
    showToastGlobal(
      `Error triggering workflow: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    return false;
  }
}

/**
 * Create installation PR for a service
 * Note: Button state and modal management handled by React components
 */
export async function installService(
  org: string,
  repo: string
): Promise<boolean> {
  if (!getToken()) {
    showToastGlobal(
      'GitHub token is required to create installation PRs',
      'error'
    );
    return false;
  }

  try {
    const { owner, name } = getRepoInfo();
    const receipt = await triggerWorkflowDispatch(
      owner, name, WORKFLOWS.files.createInstallPR, { org, repo }
    );
    if (receipt.accepted) {
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
      return true;
    }
    if (receipt.status === 401) {
      showToastGlobal(
        'Invalid GitHub token. Please enter a valid token with workflow permissions.',
        'error'
      );
      return false;
    }
    showToastGlobal(`Failed to create installation PR: ${receipt.reason}`, 'error');
    return false;
  } catch (error) {
    console.error('Error creating installation PR:', error);
    showToastGlobal(
      `Error creating installation PR: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    return false;
  }
}

/**
 * Trigger workflows for multiple services (bulk operation)
 * Note: Button state managed by React components using useButtonState hook
 */
export async function triggerBulkWorkflows(
  services: ServiceData[]
): Promise<boolean> {
  if (!getToken()) {
    showToastGlobal('GitHub token is required to trigger workflows', 'error');
    return false;
  }

  try {
    const { owner, name } = getRepoInfo();
    const receipt = await triggerWorkflowDispatch(
      owner,
      name,
      WORKFLOWS.files.triggerService,
      { services: JSON.stringify(services.map((service) => ({ org: service.org, repo: service.repo }))) }
    );
    if (receipt.accepted) {
      const count = services.length;
      showToastGlobal(
        `Triggered workflows for ${count} service${count !== 1 ? 's' : ''}`,
        'success'
      );
      return true;
    }
    if (receipt.status === 401) {
      showToastGlobal(
        'Invalid GitHub token. Please enter a valid token in Settings.',
        'error'
      );
      return false;
    }
    showToastGlobal(`Failed to trigger workflows: ${receipt.reason}`, 'error');
    return false;
  } catch (error) {
    console.error('Error triggering bulk workflows:', error);
    showToastGlobal(
      `Error triggering workflows: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    return false;
  }
}

/**
 * Handle bulk trigger button click (stale services only)
 * Note: Button state should be managed by calling React component
 */
export async function handleBulkTrigger(event: Event): Promise<boolean> {
  event.preventDefault();

  const staleServices = storeAccessor.getAllServices().filter(
    (s) => isServiceStale(s, storeAccessor.getChecksHash()) && s.installed
  );

  if (staleServices.length === 0) {
    showToastGlobal('No stale services to trigger', 'info');
    return false;
  }

  if (
    confirm(
      `This will trigger scorecard workflows for ${staleServices.length} stale service${staleServices.length !== 1 ? 's' : ''}.\n\nContinue?`
    )
  ) {
    return await triggerBulkWorkflows(staleServices);
  }
  return false;
}

/**
 * Handle bulk trigger all button click (all installed services)
 * Note: Button state should be managed by calling React component
 */
export async function handleBulkTriggerAll(event: Event): Promise<boolean> {
  event.preventDefault();

  const installedServices = storeAccessor.getAllServices().filter((s) => s.installed);

  if (installedServices.length === 0) {
    showToastGlobal('No installed services to trigger', 'info');
    return false;
  }

  if (
    confirm(
      `This will trigger scorecard workflows for ALL ${installedServices.length} installed service${installedServices.length !== 1 ? 's' : ''}.\n\nThis may take a while. Continue?`
    )
  ) {
    return await triggerBulkWorkflows(installedServices);
  }
  return false;
}
