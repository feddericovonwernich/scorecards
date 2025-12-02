/**
 * Service modal - main orchestrator
 * @module ui/modals/service
 */

import { fetchWithHybridAuth } from '../../../api/registry.js';
import { isServiceStale } from '../../../services/staleness.js';
import { STORAGE_KEYS } from '../../../config/constants.js';
import { startButtonSpin } from '../../../utils/animation.js';
import type { ServiceResults, RegistryEntry } from '../../../types/index.js';

// Import tab components
import { renderModalHeader, renderStalenessWarning } from './header.js';
import { renderModalStats } from './stats.js';
import {
  renderTabs,
  switchTab,
  scrollTabs,
  initTabScrollArrows,
} from './tabs.js';
import { renderChecksTab } from './checks-tab.js';
import {
  renderAPITab,
  getOpenAPIInfo,
  initSpecDetailsListeners,
} from './api-tab.js';
import { renderLinksTab } from './links-tab.js';
import { renderContributorsTab } from './contributors-tab.js';
import { renderWorkflowsTab } from './workflows-tab.js';
import { renderBadgesTab } from './badges-tab.js';

// Window types are defined in types/globals.d.ts

// Re-export tab functions for external use
export { switchTab, scrollTabs };

/**
 * Composes the full modal content HTML
 */
function composeModalContent(
  data: ServiceResults,
  org: string,
  repo: string,
  isStale: boolean,
  canTrigger: boolean
): string {
  const openapiInfo = getOpenAPIInfo(data);
  const defaultBranch = data.default_branch || 'main';
  return (
    renderModalHeader(data, org, repo, data.installed, isStale) +
    renderStalenessWarning(isStale, canTrigger, org, repo) +
    renderModalStats(data) +
    renderTabs(data) +
    renderChecksTab(data.checks) +
    renderAPITab(openapiInfo, org, repo, defaultBranch) +
    renderLinksTab(data.service.links) +
    renderContributorsTab(data.recent_contributors) +
    renderWorkflowsTab() +
    renderBadgesTab(org, repo)
  );
}

/**
 * Restores the interval dropdown state from localStorage
 */
function restoreIntervalDropdownState(): void {
  const savedInterval = localStorage.getItem(
    STORAGE_KEYS.SERVICE_WORKFLOW_POLL_INTERVAL
  );
  if (savedInterval !== null) {
    window.serviceWorkflowPollIntervalTime = parseInt(savedInterval);
    const select = document.getElementById(
      'service-workflow-interval-select'
    ) as HTMLSelectElement | null;
    if (select) {
      select.value = savedInterval;
    }
  }
}

/**
 * Shows service detail modal
 */
export async function showServiceDetail(
  org: string,
  repo: string
): Promise<void> {
  const modal = document.getElementById('service-modal');
  const detailDiv = document.getElementById('service-detail');

  if (!modal || !detailDiv) {return;}

  // Store current service context for workflow runs
  window.currentServiceOrg = org;
  window.currentServiceRepo = repo;
  window.serviceWorkflowLoaded = false;

  modal.classList.remove('hidden');
  detailDiv.innerHTML = '<div class="loading">Loading service details...</div>';

  try {
    // Fetch both results and registry in parallel using hybrid approach
    const resultsPath = `results/${org}/${repo}/results.json`;
    const registryPath = `registry/${org}/${repo}.json`;

    const [resultsData, registryData] = await Promise.all([
      fetchWithHybridAuth(resultsPath),
      fetchWithHybridAuth(registryPath),
    ]);

    const resultsRes = resultsData.response;
    const registryRes = registryData.response;

    if (!resultsRes.ok) {
      throw new Error(`Failed to fetch results: ${resultsRes.status}`);
    }

    const data: ServiceResults = await resultsRes.json();

    // Merge installation_pr and default_branch from registry if available
    if (registryRes.ok) {
      const registry: RegistryEntry = await registryRes.json();
      if (registry.installation_pr) {
        data.installation_pr = registry.installation_pr;
      }
      if (registry.default_branch) {
        data.default_branch = registry.default_branch;
      }
    }

    // Check staleness
    const stale = isServiceStale(data, window.currentChecksHash);
    const canTrigger = stale && data.installed;

    // Compose modal HTML using helper function
    detailDiv.innerHTML = composeModalContent(data, org, repo, stale, canTrigger);

    // Initialize service workflow polling interval dropdown with saved preference
    restoreIntervalDropdownState();

    // Initialize tab scroll arrows for mobile
    initTabScrollArrows();

    // Initialize spec details toggle listeners for lazy loading
    initSpecDetailsListeners();
  } catch (error) {
    console.error('Error loading service details:', error);
    detailDiv.innerHTML = `
            <h3>Error Loading Details</h3>
            <p>Could not load details for ${org}/${repo}</p>
            <p class="tab-section-description">${error instanceof Error ? error.message : String(error)}</p>
        `;
  }
}

/**
 * Refreshes service data in the modal
 */
export async function refreshServiceData(
  org: string,
  repo: string
): Promise<void> {
  const button = document.getElementById('modal-refresh-btn');
  if (!button) {
    return;
  }

  // Get current active tab to preserve state
  const activeTab = document.querySelector('.tab-btn.active');
  const activeTabName = activeTab
    ? activeTab.textContent?.trim().toLowerCase().replace(/\s+/g, '-') ||
      'check-results'
    : 'check-results';

  // Add spinning animation
  const originalContent = button.innerHTML;
  startButtonSpin(button);
  (button as HTMLButtonElement).disabled = true;

  try {
    // Fetch both results and registry with cache bypass
    const resultsPath = `results/${org}/${repo}/results.json`;
    const registryPath = `registry/${org}/${repo}.json`;

    const [resultsData, registryData] = await Promise.all([
      fetchWithHybridAuth(resultsPath),
      fetchWithHybridAuth(registryPath),
    ]);

    const resultsRes = resultsData.response;
    const registryRes = registryData.response;

    if (!resultsRes.ok) {
      throw new Error(`Failed to fetch results: ${resultsRes.status}`);
    }

    const data: ServiceResults = await resultsRes.json();

    // Merge installation_pr and default_branch from registry if available
    if (registryRes.ok) {
      const registry: RegistryEntry = await registryRes.json();
      if (registry.installation_pr) {
        data.installation_pr = registry.installation_pr;
      }
      if (registry.default_branch) {
        data.default_branch = registry.default_branch;
      }
    }

    // Re-render the modal (reuse showServiceDetail logic)
    const detailDiv = document.getElementById('service-detail');
    if (!detailDiv) {return;}

    // Store current service context
    window.currentServiceOrg = org;
    window.currentServiceRepo = repo;

    // Check staleness
    const stale = isServiceStale(data, window.currentChecksHash);
    const canTrigger = stale && data.installed;

    // Regenerate modal content using helper function
    detailDiv.innerHTML = composeModalContent(data, org, repo, stale, canTrigger);

    // Re-initialize interval dropdown with saved preference
    restoreIntervalDropdownState();

    // Re-initialize spec details toggle listeners
    initSpecDetailsListeners();

    window.showToast('Service data refreshed', 'success');

    // Restore previously active tab if it exists
    setTimeout(() => {
      const tabButtons = document.querySelectorAll('.tab-btn');
      for (const btn of tabButtons) {
        const btnText =
          btn.textContent?.trim().toLowerCase().replace(/\s+/g, '-') || '';
        if (btnText === activeTabName) {
          (btn as HTMLElement).click();
          break;
        }
      }
    }, 100);
  } catch (error) {
    console.error('Error refreshing service data:', error);
    window.showToast(
      `Failed to refresh service data: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
  } finally {
    // Remove spinning animation and re-enable button
    if (button) {
      (button as HTMLButtonElement).disabled = false;
      button.innerHTML = originalContent;
    }
  }
}

/**
 * Closes the service modal
 */
export function closeModal(): void {
  const modal = document.getElementById('service-modal');
  if (modal) {
    modal.classList.add('hidden');
  }

  // Clean up service workflow polling
  if (window.serviceWorkflowPollInterval) {
    clearInterval(window.serviceWorkflowPollInterval);
    window.serviceWorkflowPollInterval = null;
  }

  // Clean up service duration updates
  if (window.serviceDurationUpdateInterval) {
    clearInterval(window.serviceDurationUpdateInterval);
    window.serviceDurationUpdateInterval = null;
  }

  // Reset service workflow state
  window.currentServiceOrg = null;
  window.currentServiceRepo = null;
  window.serviceWorkflowRuns = [];
  window.serviceWorkflowLoaded = false;
  window.serviceWorkflowFilterStatus = 'all';
}
