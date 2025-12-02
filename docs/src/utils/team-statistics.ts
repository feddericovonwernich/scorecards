/**
 * Team Statistics Utilities
 * Functions for calculating and managing team statistics from services
 */

import { RANKS } from '../config/constants.js';
import { countByRank, calculateAverageScore } from './statistics.js';
import type { ServiceData, RankName, RankCounts } from '../types/index.js';

export interface SingleTeamStats {
  serviceCount: number;
  averageScore: number;
  rankDistribution: RankCounts;
  staleCount: number;
  installedCount: number;
}

export interface TeamStatsEntry extends SingleTeamStats {
  name: string;
  github_org: string | null;
  github_slug: string | null;
}

export interface MergedTeamData {
  id: string;
  name: string;
  description: string | null;
  aliases: string[];
  metadata: Record<string, unknown>;
  statistics: SingleTeamStats;
}

export interface TeamsJsonData {
  teams?: Record<string, {
    name?: string;
    description?: string;
    aliases?: string[];
    metadata?: Record<string, unknown>;
  }>;
}

export type StalenessCheckFn = (service: ServiceData, hash: string | null) => boolean;

/**
 * Get team name from service (handles both string and object formats)
 */
export function getTeamName(service: ServiceData): string | null {
  if (!service.team) {return null;}
  if (typeof service.team === 'string') {return service.team;}
  return service.team.primary || service.team.all?.[0] || null;
}

/**
 * Get all team names from service
 */
export function getAllTeams(service: ServiceData): string[] {
  if (!service.team) {return [];}
  if (typeof service.team === 'string') {return [service.team];}
  return service.team.all || (service.team.primary ? [service.team.primary] : []);
}

/**
 * Get unique teams from services array
 */
export function getUniqueTeams(services: ServiceData[]): string[] {
  const teams = new Set<string>();
  services.forEach((service) => {
    const team = getTeamName(service);
    if (team) {teams.add(team);}
  });
  return Array.from(teams).sort((a, b) => a.localeCompare(b));
}

/**
 * Get team count from services
 */
export function getTeamCount(services: ServiceData[]): number {
  return getUniqueTeams(services).length;
}

/**
 * Calculate statistics for a single team
 */
export function calculateSingleTeamStats(
  services: ServiceData[],
  isStaleCheck: StalenessCheckFn | null,
  checksHash: string | null
): SingleTeamStats {
  return {
    serviceCount: services.length,
    averageScore: calculateAverageScore(services),
    rankDistribution: countByRank(services),
    staleCount: isStaleCheck
      ? services.filter((s) => isStaleCheck(s, checksHash)).length
      : 0,
    installedCount: services.filter((s) => s.installed).length,
  };
}

/**
 * Calculate statistics for all teams
 */
export function calculateTeamStats(
  services: ServiceData[],
  isStaleCheck: StalenessCheckFn | null = null,
  checksHash: string | null = null
): Record<string, TeamStatsEntry> {
  const teamServices: Record<string, ServiceData[]> = {};
  const teamGitHubInfo: Record<string, { github_org: string | null; github_slug: string | null }> = {};

  // Group services by primary team
  services.forEach((service) => {
    const team = getTeamName(service);
    if (!team) {return;}

    if (!teamServices[team]) {
      teamServices[team] = [];
      // Extract GitHub info from first service with this team
      if (service.team && typeof service.team === 'object') {
        teamGitHubInfo[team] = {
          github_org: service.team.github_org || null,
          github_slug: service.team.github_slug || null,
        };
      }
    }
    teamServices[team].push(service);
  });

  // Calculate stats for each team
  const teamStats: Record<string, TeamStatsEntry> = {};
  Object.entries(teamServices).forEach(([team, teamServiceList]) => {
    teamStats[team] = {
      name: team,
      ...calculateSingleTeamStats(teamServiceList, isStaleCheck, checksHash),
      // Include GitHub linking info
      github_org: teamGitHubInfo[team]?.github_org || null,
      github_slug: teamGitHubInfo[team]?.github_slug || null,
    };
  });

  return teamStats;
}

export type TeamSortBy = 'name' | 'serviceCount' | 'averageScore' | 'staleCount';
export type SortDirection = 'asc' | 'desc';

/**
 * Sort team statistics by various criteria
 */
export function sortTeamStats(
  teamStats: Record<string, TeamStatsEntry>,
  sortBy: TeamSortBy = 'serviceCount',
  direction: SortDirection = 'desc'
): TeamStatsEntry[] {
  const teams = Object.values(teamStats);

  const sortFunctions: Record<TeamSortBy, (a: TeamStatsEntry, b: TeamStatsEntry) => number> = {
    name: (a, b) => a.name.localeCompare(b.name),
    serviceCount: (a, b) => a.serviceCount - b.serviceCount,
    averageScore: (a, b) => a.averageScore - b.averageScore,
    staleCount: (a, b) => a.staleCount - b.staleCount,
  };

  const sortFn = sortFunctions[sortBy] || sortFunctions.serviceCount;
  const multiplier = direction === 'asc' ? 1 : -1;

  return teams.sort((a, b) => sortFn(a, b) * multiplier);
}

/**
 * Get services for a specific team
 */
export function getServicesForTeam(
  services: ServiceData[],
  teamName: string
): ServiceData[] {
  return services.filter((service) => {
    const teams = getAllTeams(service);
    return teams.includes(teamName);
  });
}

/**
 * Get services without a team assigned
 */
export function getServicesWithoutTeam(services: ServiceData[]): ServiceData[] {
  return services.filter((service) => !getTeamName(service));
}

/**
 * Merge team data from all-teams.json with calculated statistics
 */
export function mergeTeamDataWithStats(
  teamsData: TeamsJsonData | null,
  calculatedStats: Record<string, TeamStatsEntry>
): Record<string, MergedTeamData> {
  const merged: Record<string, MergedTeamData> = {};

  // Start with teams from the teams.json file
  if (teamsData && teamsData.teams) {
    Object.entries(teamsData.teams).forEach(([teamId, teamData]) => {
      const teamName = teamData.name || teamId;
      const stats = calculatedStats[teamName] || {
        serviceCount: 0,
        averageScore: 0,
        rankDistribution: { platinum: 0, gold: 0, silver: 0, bronze: 0 },
        staleCount: 0,
        installedCount: 0,
      };

      merged[teamId] = {
        id: teamId,
        name: teamName,
        description: teamData.description || null,
        aliases: teamData.aliases || [],
        metadata: teamData.metadata || {},
        statistics: stats,
      };
    });
  }

  // Add any teams found in services but not in teams.json
  Object.entries(calculatedStats).forEach(([teamName, stats]) => {
    const teamId = teamName.toLowerCase().replace(/\s+/g, '-');
    if (!merged[teamId]) {
      merged[teamId] = {
        id: teamId,
        name: teamName,
        description: null,
        aliases: [],
        metadata: {},
        statistics: stats,
      };
    }
  });

  return merged;
}

/**
 * Build rank distribution summary string
 */
export function buildRankSummary(rankDistribution: RankCounts | null): string {
  if (!rankDistribution) {return '';}

  const parts: string[] = [];
  RANKS.forEach((rank) => {
    const count = rankDistribution[rank] || 0;
    if (count > 0) {
      parts.push(`${count} ${rank.charAt(0).toUpperCase() + rank.slice(1)}`);
    }
  });

  return parts.join(', ');
}

/**
 * Get rank for a team based on average score
 */
export function getRank(team: { averageScore?: number }): RankName {
  const score = team.averageScore || 0;
  if (score >= 90) {return 'platinum';}
  if (score >= 75) {return 'gold';}
  if (score >= 50) {return 'silver';}
  return 'bronze';
}
