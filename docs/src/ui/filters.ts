/**
 * Filtering and Sorting
 * Functions for filtering and sorting services
 */

import { isServiceStale } from '../services/staleness.js';
import { countByRank } from '../utils/statistics.js';
import type { ServiceData, RankCounts } from '../types/index.js';

export type FilterState = 'include' | 'exclude';
export type FilterMap = Map<string, FilterState>;

export type SortBy =
  | 'score-desc'
  | 'score-asc'
  | 'name-asc'
  | 'name-desc'
  | 'updated-desc'
  | 'updated-asc';

export interface FilterStats {
  total: number;
  filtered: number;
  stale: number;
  installed: number;
  hasApi: number;
  ranks: RankCounts;
}

/**
 * Filter services based on active filters and search query
 */
export function filterServices(
  services: ServiceData[],
  activeFilters: FilterMap | null,
  searchQuery: string,
  currentHash: string | null
): ServiceData[] {
  return services.filter((service) => {
    // Multi-select filters with include/exclude (AND logic)
    if (activeFilters && activeFilters.size > 0) {
      for (const [filterName, filterState] of activeFilters) {
        // Determine if service matches this filter
        let matches = false;

        if (filterName === 'has-api') {
          matches = service.has_api;
        } else if (filterName === 'stale') {
          matches = isServiceStale(service, currentHash);
        } else if (filterName === 'installed') {
          matches = service.installed;
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

    // Search filter
    if (searchQuery) {
      const teamStr =
        typeof service.team === 'string'
          ? service.team
          : service.team?.primary || '';
      const searchText =
        `${service.name} ${service.org} ${service.repo} ${teamStr}`.toLowerCase();
      if (!searchText.includes(searchQuery)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort services by specified criteria
 */
export function sortServices(
  services: ServiceData[],
  sortBy: SortBy
): ServiceData[] {
  services.sort((a, b) => {
    switch (sortBy) {
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
    case 'updated-asc':
      return (
        new Date(a.last_updated).getTime() -
          new Date(b.last_updated).getTime()
      );
    default:
      return 0;
    }
  });

  return services;
}

/**
 * Apply both filtering and sorting
 */
export function filterAndSort(
  services: ServiceData[],
  activeFilters: FilterMap | null,
  searchQuery: string,
  sortBy: SortBy,
  currentHash: string | null
): ServiceData[] {
  const filtered = filterServices(services, activeFilters, searchQuery, currentHash);
  return sortServices(filtered, sortBy);
}

/**
 * Get statistics about filtered services
 */
export function getFilterStats(
  allServices: ServiceData[],
  filteredServices: ServiceData[],
  currentHash: string | null
): FilterStats {
  const staleCount = allServices.filter((s) =>
    isServiceStale(s, currentHash)
  ).length;
  const installedCount = allServices.filter((s) => s.installed).length;
  const hasApiCount = allServices.filter((s) => s.has_api).length;

  return {
    total: allServices.length,
    filtered: filteredServices.length,
    stale: staleCount,
    installed: installedCount,
    hasApi: hasApiCount,
    ranks: countByRank(allServices),
  };
}
