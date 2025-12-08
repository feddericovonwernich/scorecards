/**
 * Utility functions for StatCards
 */

import type { ServiceData, TeamWithStats, FilterMode } from '../../../types/index.js';
import { countByRank } from '../../../utils/statistics.js';
import { isServiceStale } from '../../../services/staleness.js';

export interface ServiceStats {
  totalServices: number;
  averageScore: number;
  hasApiCount: number;
  staleCount: number;
  installedCount: number;
  platinumCount: number;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
}

export interface TeamStats {
  totalTeams: number;
  averageScore: number;
  totalServices: number;
  noTeamCount: number;
  platinumCount: number;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
}

/**
 * Calculate statistics for services view
 */
export function calculateServiceStats(
  services: ServiceData[],
  checksHash: string | null = null
): ServiceStats {
  const totalServices = services.length;
  const averageScore =
    totalServices > 0
      ? Math.round(services.reduce((sum, s) => sum + s.score, 0) / totalServices)
      : 0;

  const hasApiCount = services.filter((s) => s.has_api).length;
  const staleCount = services.filter((s) => isServiceStale(s, checksHash)).length;
  const installedCount = services.filter((s) => s.installed).length;

  const rankCounts = countByRank(services);

  return {
    totalServices,
    averageScore,
    hasApiCount,
    staleCount,
    installedCount,
    platinumCount: rankCounts.platinum,
    goldCount: rankCounts.gold,
    silverCount: rankCounts.silver,
    bronzeCount: rankCounts.bronze,
  };
}

/**
 * Calculate statistics for teams view
 */
export function calculateTeamStats(
  teams: TeamWithStats[],
  services: ServiceData[]
): TeamStats {
  const totalTeams = teams.length;
  const averageScore =
    totalTeams > 0
      ? Math.round(teams.reduce((sum, t) => sum + (t.averageScore || 0), 0) / totalTeams)
      : 0;

  const totalServices = services.length;
  const noTeamCount = services.filter((s) => !s.team?.primary).length;

  // Count teams by their dominant rank
  let platinumCount = 0;
  let goldCount = 0;
  let silverCount = 0;
  let bronzeCount = 0;

  teams.forEach((team) => {
    // Determine dominant rank based on average score
    const avgScore = team.averageScore || 0;
    if (avgScore >= 90) {
      platinumCount++;
    } else if (avgScore >= 75) {
      goldCount++;
    } else if (avgScore >= 50) {
      silverCount++;
    } else {
      bronzeCount++;
    }
  });

  return {
    totalTeams,
    averageScore,
    totalServices,
    noTeamCount,
    platinumCount,
    goldCount,
    silverCount,
    bronzeCount,
  };
}

/**
 * Cycle through filter states: null → include → exclude → null
 */
export function cycleFilterState(currentState: FilterMode): FilterMode {
  if (!currentState) {
    return 'include';
  }
  if (currentState === 'include') {
    return 'exclude';
  }
  return null;
}
