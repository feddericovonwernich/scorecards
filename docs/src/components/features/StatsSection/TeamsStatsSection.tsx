/**
 * Teams Stats Section Component
 * Displays statistics for teams view with filterable stat cards
 */

import { useMemo } from 'react';
import { useAppStore } from '../../../stores/appStore.js';
import { getRank, getTeamName } from '../../../utils/team-statistics.js';
import { StatCard, type FilterType, type FilterState } from '../../ui/StatCard.js';

interface TeamsStatsSectionProps {
  onFilterChange?: (filterType: FilterType, mode: FilterState) => void;
  activeFilters?: Map<string, FilterState>;
}

export function TeamsStatsSection({ onFilterChange, activeFilters }: TeamsStatsSectionProps) {
  const teams = useAppStore((state) => state.teams.all);
  const services = useAppStore((state) => state.services.all);

  const stats = useMemo(() => {
    const totalTeams = teams.length;
    const avgScore = totalTeams > 0
      ? Math.round(teams.reduce((sum, t) => sum + (t.averageScore || 0), 0) / totalTeams)
      : 0;
    const totalServices = services.length;
    const noTeam = services.filter(s => !getTeamName(s)).length;

    let platinum = 0, gold = 0, silver = 0, bronze = 0;
    teams.forEach(team => {
      const rank = getRank(team);
      if (rank === 'platinum') {platinum++;}
      else if (rank === 'gold') {gold++;}
      else if (rank === 'silver') {silver++;}
      else if (rank === 'bronze') {bronze++;}
    });

    return { totalTeams, avgScore, totalServices, noTeam, platinum, gold, silver, bronze };
  }, [teams, services]);

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
        value={stats.totalTeams}
        label="Total Teams"
        filterable={false}
        id="total-teams"
      />
      <StatCard
        value={stats.avgScore}
        label="Average Score"
        filterable={false}
        id="teams-avg-score"
      />
      <StatCard
        value={stats.totalServices}
        label="Total Services"
        filterable={false}
        id="teams-total-services"
      />
      <StatCard
        value={stats.noTeam}
        label="No Team"
        filterable={false}
        id="no-team-count"
      />
      <StatCard
        value={stats.platinum}
        label="Platinum"
        filterable
        filterType="platinum"
        filterState={getFilterState('platinum')}
        onClick={handleFilterClick}
        id="teams-platinum-count"
      />
      <StatCard
        value={stats.gold}
        label="Gold"
        filterable
        filterType="gold"
        filterState={getFilterState('gold')}
        onClick={handleFilterClick}
        id="teams-gold-count"
      />
      <StatCard
        value={stats.silver}
        label="Silver"
        filterable
        filterType="silver"
        filterState={getFilterState('silver')}
        onClick={handleFilterClick}
        id="teams-silver-count"
      />
      <StatCard
        value={stats.bronze}
        label="Bronze"
        filterable
        filterType="bronze"
        filterState={getFilterState('bronze')}
        onClick={handleFilterClick}
        id="teams-bronze-count"
      />
    </>
  );
}
