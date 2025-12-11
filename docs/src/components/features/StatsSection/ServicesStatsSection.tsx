/**
 * Services Stats Section Component
 * Displays statistics for services view with filterable stat cards
 */

import { useMemo } from 'react';
import { useAppStore } from '../../../stores/appStore.js';
import { isServiceStale } from '../../../services/staleness.js';
import { StatCard, type FilterType, type FilterState } from '../../ui/StatCard.js';

interface ServicesStatsSectionProps {
  onFilterChange?: (filterType: FilterType, mode: FilterState) => void;
  activeFilters?: Map<string, FilterState>;
}

export function ServicesStatsSection({ onFilterChange, activeFilters }: ServicesStatsSectionProps) {
  const services = useAppStore((state) => state.services.all);
  const checksHash = useAppStore((state) => state.ui.checksHash);

  const stats = useMemo(() => {
    const total = services.length;
    const avgScore = total > 0
      ? Math.round(services.reduce((sum, s) => sum + s.score, 0) / total)
      : 0;
    const withApi = services.filter(s => s.has_api).length;
    const stale = services.filter(s => isServiceStale(s, checksHash)).length;
    const installed = services.filter(s => s.installed).length;
    const platinum = services.filter(s => s.rank === 'platinum').length;
    const gold = services.filter(s => s.rank === 'gold').length;
    const silver = services.filter(s => s.rank === 'silver').length;
    const bronze = services.filter(s => s.rank === 'bronze').length;

    return { total, avgScore, withApi, stale, installed, platinum, gold, silver, bronze };
  }, [services, checksHash]);

  const handleFilterClick = (filterType: FilterType) => {
    if (!onFilterChange) {return;}

    const currentState = activeFilters?.get(filterType) ?? null;
    let newState: FilterState;

    if (currentState === null) {
      newState = 'include';
    } else if (currentState === 'include') {
      newState = 'exclude';
    } else {
      newState = null;
    }

    onFilterChange(filterType, newState);
  };

  const getFilterState = (filterType: string): FilterState => {
    return activeFilters?.get(filterType) ?? null;
  };

  return (
    <>
      <StatCard
        value={stats.total}
        label="Total Services"
        filterable={false}
        id="total-services"
      />
      <StatCard
        value={stats.avgScore}
        label="Average Score"
        filterable={false}
        id="avg-score"
      />
      <StatCard
        value={stats.withApi}
        label="With API"
        filterable
        filterType="has-api"
        filterState={getFilterState('has-api')}
        onClick={handleFilterClick}
        id="api-count"
      />
      <StatCard
        value={stats.stale}
        label="Stale"
        filterable
        filterType="stale"
        filterState={getFilterState('stale')}
        onClick={handleFilterClick}
        id="stale-count"
      />
      <StatCard
        value={stats.installed}
        label="Installed"
        filterable
        filterType="installed"
        filterState={getFilterState('installed')}
        onClick={handleFilterClick}
        id="installed-count"
      />
      <StatCard
        value={stats.platinum}
        label="Platinum"
        filterable
        filterType="platinum"
        filterState={getFilterState('platinum')}
        onClick={handleFilterClick}
        id="platinum-count"
      />
      <StatCard
        value={stats.gold}
        label="Gold"
        filterable
        filterType="gold"
        filterState={getFilterState('gold')}
        onClick={handleFilterClick}
        id="gold-count"
      />
      <StatCard
        value={stats.silver}
        label="Silver"
        filterable
        filterType="silver"
        filterState={getFilterState('silver')}
        onClick={handleFilterClick}
        id="silver-count"
      />
      <StatCard
        value={stats.bronze}
        label="Bronze"
        filterable
        filterType="bronze"
        filterState={getFilterState('bronze')}
        onClick={handleFilterClick}
        id="bronze-count"
      />
    </>
  );
}
