/**
 * Application Initialization
 * Handles app bootstrap, data loading, filtering, and refresh logic
 *
 * Note: Most UI rendering is now handled by React components (see components/index.tsx)
 * This file focuses on data loading and coordination with the Zustand store.
 */

import type { ServiceData } from './types/index.js';
import { loadServices, fetchCurrentChecksHash } from './api/registry.js';
import { isServiceStale } from './services/staleness.js';
import { initTheme, getCurrentTheme } from './services/theme.js';
import { getCssVar } from './utils/css.js';
import { getTeamName } from './utils/team-statistics.js';
import { useAppStore } from './stores/appStore.js';
import * as storeAccessor from './stores/accessor.js';
import { showToastGlobal } from './components/ui/Toast.js';

// Window types are defined in types/globals.d.ts

/**
 * Update services view statistics (stat cards)
 * Populates API count, Stale count, Installed count, and rank distribution
 */
function updateServicesStats(services: ServiceData[], checksHash: string | null): void {
  // Total services
  const totalEl = document.getElementById('total-services');
  if (totalEl) {
    totalEl.textContent = String(services.length);
  }

  // Average score
  const avgEl = document.getElementById('avg-score');
  if (avgEl && services.length > 0) {
    const avg = services.reduce((sum, s) => sum + s.score, 0) / services.length;
    avgEl.textContent = String(Math.round(avg));
  } else if (avgEl) {
    avgEl.textContent = '0';
  }

  // With API count
  const apiEl = document.getElementById('api-count');
  if (apiEl) {
    apiEl.textContent = String(services.filter((s) => s.has_api).length);
  }

  // Stale count
  const staleEl = document.getElementById('stale-count');
  if (staleEl) {
    staleEl.textContent = String(
      services.filter((s) => isServiceStale(s, checksHash)).length
    );
  }

  // Installed count
  const installedEl = document.getElementById('installed-count');
  if (installedEl) {
    installedEl.textContent = String(services.filter((s) => s.installed).length);
  }

  // Rank counts
  const platinumEl = document.getElementById('platinum-count');
  const goldEl = document.getElementById('gold-count');
  const silverEl = document.getElementById('silver-count');
  const bronzeEl = document.getElementById('bronze-count');

  if (platinumEl) {
    platinumEl.textContent = String(services.filter((s) => s.rank === 'platinum').length);
  }
  if (goldEl) {
    goldEl.textContent = String(services.filter((s) => s.rank === 'gold').length);
  }
  if (silverEl) {
    silverEl.textContent = String(services.filter((s) => s.rank === 'silver').length);
  }
  if (bronzeEl) {
    bronzeEl.textContent = String(services.filter((s) => s.rank === 'bronze').length);
  }
}

/**
 * Filter and render services based on active filters
 * This function updates the Zustand store, which triggers React re-renders
 */
export function filterAndRenderServices(): void {
  // Start with all services
  let services = [...storeAccessor.getAllServices()];
  const store = useAppStore.getState();

  // Apply team filter first (supports multi-select with comma-separated values)
  const teamFilter = store.filters.teamFilter;
  if (teamFilter) {
    // Parse comma-separated teams into array
    const selectedTeams = teamFilter.split(',').map((t) => t.trim().toLowerCase());
    const hasNoTeamFilter = selectedTeams.includes('__no_team__');

    services = services.filter((s) => {
      const serviceTeam = getTeamName(s);
      const hasTeam = !!serviceTeam;

      // Check if "no team" filter matches
      if (hasNoTeamFilter && !hasTeam) {
        return true;
      }

      // Check if service team matches any selected team
      if (serviceTeam) {
        return selectedTeams.includes(serviceTeam.toLowerCase());
      }

      return false;
    });
  }

  // Apply check filters from store
  // Note: Check filters use service.check_results which has CheckStatus values ('pass'/'fail')
  const checkFilters = store.filters.checkFilters;
  if (checkFilters && checkFilters.size > 0) {
    services = services.filter((service) => {
      for (const [checkId, filterState] of checkFilters) {
        // Get the check result status from check_results map
        const checkStatus = service.check_results?.[checkId];

        if (filterState === 'pass' && checkStatus !== 'pass') {
          return false;
        }
        if (filterState === 'fail' && checkStatus !== 'fail') {
          return false;
        }
      }
      return true;
    });
  }

  // Then apply other filters
  const filteredServices = services.filter((service) => {
    // Multi-select filters with include/exclude (AND logic)
    if (storeAccessor.getActiveFilters().size > 0) {
      for (const [filterName, filterState] of storeAccessor.getActiveFilters()) {
        // Determine if service matches this filter
        let matches = false;

        if (filterName === 'has-api') {
          matches = service.has_api ?? false;
        } else if (filterName === 'stale') {
          matches = isServiceStale(service, storeAccessor.getChecksHash());
        } else if (filterName === 'installed') {
          matches = service.installed ?? false;
        } else if (
          filterName === 'platinum' ||
          filterName === 'gold' ||
          filterName === 'silver' ||
          filterName === 'bronze'
        ) {
          matches = service.rank === filterName;
        }

        // Apply include/exclude logic
        if (filterState === 'include') {
          // Include: service must match
          if (!matches) {
            return false;
          }
        } else if (filterState === 'exclude') {
          // Exclude: service must NOT match
          if (matches) {
            return false;
          }
        }
      }
    }

    // Search filter - also search team name
    if (storeAccessor.getSearchQuery()) {
      const teamName = getTeamName(service) || '';
      const searchText =
        `${service.name} ${service.org} ${service.repo} ${teamName}`.toLowerCase();
      if (!searchText.includes(storeAccessor.getSearchQuery())) {
        return false;
      }
    }

    return true;
  });

  // Sort
  filteredServices.sort((a, b) => {
    switch (storeAccessor.getCurrentSort()) {
    case 'score-desc':
      return b.score - a.score;
    case 'score-asc':
      return a.score - b.score;
    case 'name-asc':
      return a.name.localeCompare(b.name);
    case 'name-desc':
      return b.name.localeCompare(a.name);
    case 'updated-desc':
      return (
        new Date(b.last_updated).getTime() -
          new Date(a.last_updated).getTime()
      );
    default:
      return 0;
    }
  });

  // Update the Zustand store - React components will re-render automatically
  storeAccessor.setFilteredServices(filteredServices);
}

/**
 * Refresh data (re-fetch from catalog)
 */
export async function refreshData(): Promise<void> {
  const refreshBtn = document.getElementById(
    'refresh-btn'
  ) as HTMLButtonElement | null;
  if (!refreshBtn) {
    return;
  }

  // Disable button and show loading state
  const originalText = refreshBtn.innerHTML;
  refreshBtn.disabled = true;
  refreshBtn.innerHTML = '<span class="spinner"></span> Refreshing...';

  try {
    showToastGlobal('Refreshing service data...', 'info');

    // Clear checks hash cache to force refetch
    storeAccessor.setChecksHash(null);

    // Reload services
    const { services, usedAPI } = await loadServices();
    storeAccessor.setAllServices(services);
    storeAccessor.setFilteredServices([...services]);

    // Fetch checks hash
    storeAccessor.setChecksHash(await fetchCurrentChecksHash());

    // Update Zustand store
    const store = useAppStore.getState();
    store.setServices(services);
    store.setFilteredServices([...services]);
    store.setChecksHash(storeAccessor.getChecksHash());

    // Update UI
    filterAndRenderServices();

    // Show success message
    const timestamp = new Date().toLocaleTimeString();
    if (usedAPI) {
      showToastGlobal(
        `Data refreshed successfully from GitHub API at ${timestamp}. (Fresh data, bypassed cache)`,
        'success'
      );
    } else {
      showToastGlobal(
        `Data refreshed from CDN at ${timestamp}. (Note: CDN cache may be up to 5 minutes old. Use GitHub PAT in settings for real-time data)`,
        'success'
      );
    }
  } catch (error) {
    console.error('Error refreshing data:', error);
    showToastGlobal(
      `Failed to refresh data: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
  } finally {
    // Restore button state
    setTimeout(() => {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = originalText;
    }, 1000);
  }
}

/**
 * Update theme toggle button icon
 */
function updateThemeIcon(theme: string): void {
  const sunIcon = document.getElementById('theme-icon-sun');
  const moonIcon = document.getElementById('theme-icon-moon');
  if (sunIcon && moonIcon) {
    if (theme === 'dark') {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  }
}

/**
 * Initialize application on page load
 */
export async function initializeApp(): Promise<void> {
  try {
    // Initialize theme early to prevent flash
    initTheme();
    updateThemeIcon(getCurrentTheme());

    // Load services
    const { services } = await loadServices();
    storeAccessor.setAllServices(services);
    storeAccessor.setFilteredServices([...services]);

    // Fetch checks hash
    storeAccessor.setChecksHash(await fetchCurrentChecksHash());

    // Update Zustand store - React components will render from this
    const store = useAppStore.getState();
    store.setServices(services);
    store.setFilteredServices([...services]);
    store.setChecksHash(storeAccessor.getChecksHash());

    // Initialize UI (filtering applies to store, React components auto-update)
    filterAndRenderServices();

    // Update stat cards with service counts
    updateServicesStats(services, storeAccessor.getChecksHash());

    // Re-initialize teams view if hash is #teams (handles direct navigation)
    // This fixes the race condition where handleHashChange() runs before services load
    if (window.location.hash === '#teams' && window.initTeamsView) {
      window.initTeamsView();
    }
  } catch (error) {
    console.error('Error loading services:', error);
    const textMuted = getCssVar('--color-text-muted');
    const servicesGrid = document.getElementById('services-grid');
    if (servicesGrid && !window.__REACT_MANAGES_SERVICES_GRID) {
      servicesGrid.innerHTML = `
            <div class="empty-state">
                <h3>No Services Found</h3>
                <p>No services have run scorecards yet, or the registry is not available.</p>
                <p style="margin-top: 10px; font-size: 0.9rem; color: ${textMuted};">
                    Error: ${error instanceof Error ? error.message : String(error)}
                </p>
            </div>
        `;
    }
  }
}
