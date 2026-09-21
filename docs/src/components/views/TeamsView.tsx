/**
 * Teams View
 * Main view for displaying teams grid with stats and controls
 */

import { useEffect, useCallback, useState } from 'react';
import { useAppStore } from '../../stores/appStore.js';
import { TeamsStatsSection } from '../features/StatsSection/index.js';
import { TeamsControls } from '../features/TeamsControls/index.js';
import { TeamGridContainer } from '../containers/TeamGridContainer.js';
import { loadTeams } from '../../api/registry.js';
import { calculateTeamStats, mergeTeamDataWithStats } from '../../utils/team-statistics.js';
import * as storeAccessor from '../../stores/accessor.js';
import type { FilterType, FilterState } from '../ui/StatCard.js';
import type { ServiceData, TeamsData, TeamWithStats } from '../../types/index.js';

/**
 * Initialize teams data and populate Zustand store
 * Extracted from main.ts for direct usage in React components
 */
function initializeTeamsData(
  services: ServiceData[],
  teamsData: TeamsData | null
): void {
  try {
    // Calculate stats from services
    const calculatedStats = calculateTeamStats(services);

    // Merge registry data with calculated stats
    let teamData: TeamsData;
    if (teamsData) {
      // mergeTeamDataWithStats returns MergedTeamData with null for description, convert to undefined
      const merged = mergeTeamDataWithStats(teamsData, calculatedStats);
      teamData = Object.fromEntries(
        Object.entries(merged).map(([key, data]) => [
          key,
          { ...data, description: data.description ?? undefined },
        ])
      ) as TeamsData;
    } else {
      // Fallback: use service-derived teams only
      teamData = Object.fromEntries(
        Object.entries(calculatedStats).map(([name, stats]) => [
          name.toLowerCase().replace(/\s+/g, '-'),
          {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            statistics: stats,
          },
        ])
      ) as TeamsData;
    }

    // Flatten statistics for rendering compatibility
    const allTeams = Object.values(teamData).map((t) => ({
      ...t,
      ...(t.statistics || {}),
      // Flatten metadata for slack_channel access
      slack_channel: t.metadata?.slack_channel || null,
    })) as TeamWithStats[];

    // Update Zustand store (React components will handle rendering)
    storeAccessor.setAllTeams(allTeams);
    useAppStore.getState().filterAndSortTeams();
  } catch (error) {
    console.error('Failed to initialize teams view:', error);
  }
}

export function TeamsView() {
  // Get filter state and setters from store
  const teamsActiveFilters = useAppStore((state) => state.teams.activeFilters);
  const updateTeamsState = useAppStore((state) => state.updateTeamsState);
  const services = useAppStore((state) => state.services.all);
  const [teamsData, setTeamsData] = useState<TeamsData | null>();

  useEffect(() => {
    let cancelled = false;

    loadTeams()
      .then(({ teams }) => {
        if (!cancelled) {
          setTeamsData(teams);
        }
      })
      .catch((error) => {
        console.warn('Failed to load teams registry:', error);
        if (!cancelled) {
          setTeamsData(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (teamsData !== undefined) {
      initializeTeamsData(services, teamsData);
    }
  }, [services, teamsData]);


  // Handle filter changes from stat cards
  // updateTeamsState triggers re-renders via Zustand subscriptions
  const handleFilterChange = useCallback((filterType: FilterType, mode: FilterState) => {
    const newFilters = new Map(teamsActiveFilters);
    if (mode === null) {
      newFilters.delete(filterType);
    } else {
      newFilters.set(filterType, mode);
    }
    updateTeamsState({ activeFilters: newFilters });
  }, [teamsActiveFilters, updateTeamsState]);

  return (
    <div className="view-content active" id="teams-view">
      <section className="stats teams-stats">
        <TeamsStatsSection
          onFilterChange={handleFilterChange}
          activeFilters={teamsActiveFilters}
        />
      </section>

      <TeamsControls />

      <TeamGridContainer />
    </div>
  );
}
