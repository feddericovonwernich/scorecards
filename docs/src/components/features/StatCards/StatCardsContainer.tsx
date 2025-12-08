/**
 * StatCardsContainer
 *
 * React container that renders StatCard components for services or teams view.
 * Connects to Zustand store for filter state management.
 */

import { useMemo } from 'react';
import { StatCard, StatCardGroup, type FilterType, type FilterState } from '../../ui/StatCard.js';
import { useAppStore } from '../../../stores/appStore.js';
import { calculateServiceStats, calculateTeamStats, cycleFilterState } from './utils.js';
import type { FilterMode } from '../../../types/index.js';

interface StatCardsContainerProps {
  view: 'services' | 'teams';
}

/**
 * Services view stat cards
 */
function ServicesStatCards() {
  const services = useAppStore((state) => state.services.all);
  const checksHash = useAppStore((state) => state.ui.checksHash);
  const filters = useAppStore((state) => state.filters.active);
  const setFilter = useAppStore((state) => state.setFilter);
  const filterAndSort = useAppStore((state) => state.filterAndSortServices);

  // Calculate stats from current services
  const stats = useMemo(
    () => calculateServiceStats(services, checksHash),
    [services, checksHash]
  );

  const handleFilterClick = (filterType: FilterType) => {
    const currentState = (filters.get(filterType) as FilterState) || null;
    const nextState = cycleFilterState(currentState as FilterMode) as FilterState;

    if (nextState === null) {
      // Remove filter
      const newFilters = new Map(filters);
      newFilters.delete(filterType);
      useAppStore.getState().updateFilters({ active: newFilters });
    } else {
      // Set filter state
      setFilter(filterType, nextState as FilterMode);
    }

    // Trigger re-filtering
    filterAndSort();
  };

  return (
    <StatCardGroup view="services">
      {/* Total Services - Non-filterable */}
      <StatCard
        value={stats.totalServices}
        label="Services"
        filterable={false}
        id="total-services"
      />

      {/* Average Score - Non-filterable */}
      <StatCard
        value={stats.averageScore}
        label="Avg Score"
        filterable={false}
        id="avg-score"
      />

      {/* Has API - Filterable */}
      <StatCard
        value={stats.hasApiCount}
        label="Has API"
        filterable={true}
        filterType="has-api"
        filterState={filters.get('has-api') || null}
        onClick={handleFilterClick}
        id="has-api-count"
      />

      {/* Stale - Filterable */}
      <StatCard
        value={stats.staleCount}
        label="Stale"
        filterable={true}
        filterType="stale"
        filterState={filters.get('stale') || null}
        onClick={handleFilterClick}
        id="stale-count"
      />

      {/* Installed - Filterable */}
      <StatCard
        value={stats.installedCount}
        label="Installed"
        filterable={true}
        filterType="installed"
        filterState={filters.get('installed') || null}
        onClick={handleFilterClick}
        id="installed-count"
      />

      {/* Platinum - Filterable */}
      <StatCard
        value={stats.platinumCount}
        label="Platinum"
        filterable={true}
        filterType="platinum"
        filterState={filters.get('platinum') || null}
        onClick={handleFilterClick}
        className="rank-platinum"
        id="platinum-count"
      />

      {/* Gold - Filterable */}
      <StatCard
        value={stats.goldCount}
        label="Gold"
        filterable={true}
        filterType="gold"
        filterState={filters.get('gold') || null}
        onClick={handleFilterClick}
        className="rank-gold"
        id="gold-count"
      />

      {/* Silver - Filterable */}
      <StatCard
        value={stats.silverCount}
        label="Silver"
        filterable={true}
        filterType="silver"
        filterState={filters.get('silver') || null}
        onClick={handleFilterClick}
        className="rank-silver"
        id="silver-count"
      />

      {/* Bronze - Filterable */}
      <StatCard
        value={stats.bronzeCount}
        label="Bronze"
        filterable={true}
        filterType="bronze"
        filterState={filters.get('bronze') || null}
        onClick={handleFilterClick}
        className="rank-bronze"
        id="bronze-count"
      />
    </StatCardGroup>
  );
}

/**
 * Teams view stat cards
 */
function TeamsStatCards() {
  const teams = useAppStore((state) => state.teams.all);
  const services = useAppStore((state) => state.services.all);
  const filters = useAppStore((state) => state.teams.activeFilters);
  const updateTeamsState = useAppStore((state) => state.updateTeamsState);

  // Calculate stats from current teams and services
  const stats = useMemo(
    () => calculateTeamStats(teams, services),
    [teams, services]
  );

  const handleFilterClick = (filterType: FilterType) => {
    const currentState = (filters.get(filterType) as FilterState) || null;
    const nextState = cycleFilterState(currentState as FilterMode) as FilterState;

    // Update teams filter state
    const newFilters = new Map(filters);
    if (nextState === null) {
      newFilters.delete(filterType);
    } else {
      newFilters.set(filterType, nextState as FilterMode);
    }

    // Update store
    updateTeamsState({ activeFilters: newFilters });

    // Trigger re-filtering (call vanilla JS function if it exists)
    if (typeof window.filterAndRenderTeams === 'function') {
      window.filterAndRenderTeams();
    }
  };

  return (
    <StatCardGroup view="teams">
      {/* Total Teams - Non-filterable */}
      <StatCard
        value={stats.totalTeams}
        label="Teams"
        filterable={false}
        id="teams-total-teams"
      />

      {/* Average Score - Non-filterable */}
      <StatCard
        value={stats.averageScore}
        label="Avg Score"
        filterable={false}
        id="teams-avg-score"
      />

      {/* Total Services - Non-filterable */}
      <StatCard
        value={stats.totalServices}
        label="Services"
        filterable={false}
        id="teams-total-services"
      />

      {/* No Team - Non-filterable */}
      <StatCard
        value={stats.noTeamCount}
        label="No Team"
        filterable={false}
        id="teams-no-team"
      />

      {/* Platinum - Filterable */}
      <StatCard
        value={stats.platinumCount}
        label="Platinum"
        filterable={true}
        filterType="platinum"
        filterState={filters.get('platinum') || null}
        onClick={handleFilterClick}
        className="rank-platinum teams-filter"
        id="teams-platinum-count"
      />

      {/* Gold - Filterable */}
      <StatCard
        value={stats.goldCount}
        label="Gold"
        filterable={true}
        filterType="gold"
        filterState={filters.get('gold') || null}
        onClick={handleFilterClick}
        className="rank-gold teams-filter"
        id="teams-gold-count"
      />

      {/* Silver - Filterable */}
      <StatCard
        value={stats.silverCount}
        label="Silver"
        filterable={true}
        filterType="silver"
        filterState={filters.get('silver') || null}
        onClick={handleFilterClick}
        className="rank-silver teams-filter"
        id="teams-silver-count"
      />

      {/* Bronze - Filterable */}
      <StatCard
        value={stats.bronzeCount}
        label="Bronze"
        filterable={true}
        filterType="bronze"
        filterState={filters.get('bronze') || null}
        onClick={handleFilterClick}
        className="rank-bronze teams-filter"
        id="teams-bronze-count"
      />
    </StatCardGroup>
  );
}

/**
 * Main container component that renders the appropriate stat cards
 */
export function StatCardsContainer({ view }: StatCardsContainerProps) {
  if (view === 'teams') {
    return <TeamsStatCards />;
  }
  return <ServicesStatCards />;
}
