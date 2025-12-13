/**
 * Application Initialization
 * Handles app bootstrap, data loading, filtering, and refresh logic
 *
 * Note: Most UI rendering is now handled by React components (see components/index.tsx)
 * This file focuses on data loading and coordination with the Zustand store.
 */

import { loadServices, fetchCurrentChecksHash } from './api/registry.js';
import { isServiceStale } from './services/staleness.js';
import { getTeamName } from './utils/team-statistics.js';
import { useAppStore } from './stores/appStore.js';
import * as storeAccessor from './stores/accessor.js';
import { showToastGlobal } from './components/ui/Toast.js';

// Window types are defined in types/globals.d.ts

/**
 * @deprecated Stats are now managed by React components (ServicesStatsSection/TeamsStatsSection)
 * This function has been removed. Stats are automatically computed and rendered by React.
 */
// function updateServicesStats() removed - see ServicesStatsSection component

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
 * Pure function - no DOM manipulation, button state managed by caller
 */
export async function refreshData(): Promise<{ success: boolean; usedAPI: boolean }> {
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

    return { success: true, usedAPI };
  } catch (error) {
    console.error('Error refreshing data:', error);
    showToastGlobal(
      `Failed to refresh data: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    return { success: false, usedAPI: false };
  }
}

/**
 * Initialize application on page load
 */
export async function initializeApp(): Promise<void> {
  try {
    // Theme is now managed by React (useTheme hook)
    // The flash prevention script in index.html handles initial theme

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

    // Stats are now automatically updated by React (ServicesStatsSection component)

    // Re-initialize teams view if hash is #teams (handles direct navigation)
    // This fixes the race condition where handleHashChange() runs before services load
    if (window.location.hash === '#teams' && window.initTeamsView) {
      window.initTeamsView();
    }
  } catch (error) {
    console.error('Error loading services:', error);
    // Error state is now handled by React components
  }
}
