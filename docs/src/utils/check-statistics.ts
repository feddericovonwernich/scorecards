/**
 * Check Statistics Utilities
 * Functions for calculating check adoption and statistics
 */

import { getTeamName } from './team-statistics.js';
import type { ServiceData, RankName, CheckStatus } from '../types/index.js';

export interface ServiceCheckInfo {
  org: string;
  repo: string;
  name: string;
  score: number;
  rank: RankName;
  exclusionReason?: string | null;
  checkStatus?: CheckStatus | 'excluded' | 'unknown';
}

export interface CheckAdoptionStats {
  total: number;
  activeTotal: number;
  passing: number;
  failing: number;
  excluded: number;
  unknown: number;
  percentage: number;
}

export interface TeamCheckStats extends CheckAdoptionStats {
  services: ServiceCheckInfo[];
}

export interface CheckAdoptionEntry extends CheckAdoptionStats {
  checkId: string;
  name: string;
  category: string;
  weight: number;
}

export interface TeamAdoptionEntry extends TeamCheckStats {
  teamName: string;
}

/**
 * Check if a service has a specific check excluded
 */
export function isCheckExcluded(service: ServiceData, checkId: string): boolean {
  return service.excluded_checks?.some((e) => e.check === checkId) ?? false;
}

/**
 * Get exclusion reason for a check
 */
export function getExclusionReason(
  service: ServiceData,
  checkId: string
): string | null {
  return service.excluded_checks?.find((e) => e.check === checkId)?.reason ?? null;
}

/**
 * Get services that have excluded a specific check
 */
export function getExcludedServicesForCheck(
  services: ServiceData[],
  checkId: string
): ServiceCheckInfo[] {
  return services
    .filter((s) => isCheckExcluded(s, checkId))
    .map((s) => ({
      org: s.org,
      repo: s.repo,
      name: s.name,
      score: s.score,
      rank: s.rank,
      exclusionReason: getExclusionReason(s, checkId),
    }));
}

/**
 * Calculate overall check adoption for a specific check
 * Excluded services are not counted in the denominator for percentage
 */
export function calculateOverallCheckAdoption(
  services: ServiceData[],
  checkId: string
): CheckAdoptionStats {
  let passing = 0;
  let failing = 0;
  let excluded = 0;
  let unknown = 0;

  for (const service of services) {
    // Check if this check is excluded for this service
    if (isCheckExcluded(service, checkId)) {
      excluded++;
      continue;
    }

    const status = service.check_results?.[checkId];
    if (status === 'pass') {
      passing++;
    } else if (status === 'fail') {
      failing++;
    } else {
      unknown++;
    }
  }

  const total = services.length;
  const activeTotal = total - excluded;
  const percentage = activeTotal > 0 ? Math.round((passing / activeTotal) * 100) : 0;

  return {
    total,
    activeTotal,
    passing,
    failing,
    excluded,
    unknown,
    percentage,
  };
}

/**
 * Calculate check adoption by team
 * Excluded services are tracked separately and not counted in percentage
 */
export function calculateCheckAdoptionByTeam(
  services: ServiceData[],
  checkId: string
): Record<string, TeamCheckStats> {
  const teamStats: Record<string, TeamCheckStats> = {};

  for (const service of services) {
    const teamName = getTeamName(service) || 'No Team';

    if (!teamStats[teamName]) {
      teamStats[teamName] = {
        total: 0,
        activeTotal: 0,
        passing: 0,
        failing: 0,
        excluded: 0,
        unknown: 0,
        percentage: 0,
        services: [],
      };
    }

    const stats = teamStats[teamName];
    stats.total++;

    // Check if this check is excluded for this service
    const isExcluded = isCheckExcluded(service, checkId);

    if (isExcluded) {
      stats.excluded++;
      stats.services.push({
        org: service.org,
        repo: service.repo,
        name: service.name,
        score: service.score,
        rank: service.rank,
        checkStatus: 'excluded',
        exclusionReason: getExclusionReason(service, checkId),
      });
      continue;
    }

    const status = service.check_results?.[checkId];
    if (status === 'pass') {
      stats.passing++;
    } else if (status === 'fail') {
      stats.failing++;
    } else {
      stats.unknown++;
    }

    stats.services.push({
      org: service.org,
      repo: service.repo,
      name: service.name,
      score: service.score,
      rank: service.rank,
      checkStatus: status || 'unknown',
    });
  }

  // Calculate percentages and sort services
  for (const teamName of Object.keys(teamStats)) {
    const stats = teamStats[teamName];
    // Active total excludes excluded services
    stats.activeTotal = stats.total - stats.excluded;
    stats.percentage =
      stats.activeTotal > 0
        ? Math.round((stats.passing / stats.activeTotal) * 100)
        : 0;

    // Sort services: passing first, then failing, then excluded, then by score
    stats.services.sort((a, b) => {
      const order: Record<string, number> = { pass: 0, fail: 1, excluded: 2, unknown: 3 };
      const orderA = order[a.checkStatus || 'unknown'] ?? 3;
      const orderB = order[b.checkStatus || 'unknown'] ?? 3;
      if (orderA !== orderB) {return orderA - orderB;}
      return b.score - a.score;
    });
  }

  return teamStats;
}

export type CheckFilterMap = Map<string, CheckStatus | null>;

/**
 * Filter services by check criteria
 */
export function filterByCheckCriteria(
  services: ServiceData[],
  checkFilters: CheckFilterMap | null
): ServiceData[] {
  if (!checkFilters || checkFilters.size === 0) {
    return services;
  }

  return services.filter((service) => {
    for (const [checkId, requiredStatus] of checkFilters) {
      // Skip if no filter set for this check
      if (requiredStatus === null || requiredStatus === undefined) {
        continue;
      }

      const actualStatus = service.check_results?.[checkId];

      // Apply filter based on required status
      if (requiredStatus === 'pass' && actualStatus !== 'pass') {
        return false;
      }
      if (requiredStatus === 'fail' && actualStatus !== 'fail') {
        return false;
      }
    }
    return true;
  });
}

/**
 * Get services that pass a specific check
 */
export function getServicesPassingCheck(
  services: ServiceData[],
  checkId: string
): ServiceData[] {
  return services.filter((s) => s.check_results?.[checkId] === 'pass');
}

/**
 * Get services that fail a specific check
 */
export function getServicesFailingCheck(
  services: ServiceData[],
  checkId: string
): ServiceData[] {
  return services.filter((s) => s.check_results?.[checkId] === 'fail');
}

export interface CheckMetadata {
  id: string;
  name: string;
  category: string;
  weight: number;
}

/**
 * Get check adoption statistics for all checks
 */
export function getAllChecksAdoptionStats(
  services: ServiceData[],
  checks: CheckMetadata[]
): CheckAdoptionEntry[] {
  return checks.map((check) => {
    const adoption = calculateOverallCheckAdoption(services, check.id);
    return {
      checkId: check.id,
      name: check.name,
      category: check.category,
      weight: check.weight,
      ...adoption,
    };
  });
}

/**
 * Sort teams by adoption percentage
 */
export function sortTeamsByAdoption(
  teamStats: Record<string, TeamCheckStats>,
  direction: 'asc' | 'desc' = 'desc'
): TeamAdoptionEntry[] {
  const entries = Object.entries(teamStats).map(([teamName, stats]) => ({
    teamName,
    ...stats,
  }));

  entries.sort((a, b) => {
    const diff = a.percentage - b.percentage;
    return direction === 'desc' ? -diff : diff;
  });

  return entries;
}

/**
 * Get active check filter count
 */
export function getActiveCheckFilterCount(checkFilters: CheckFilterMap | null): number {
  if (!checkFilters) {return 0;}

  let count = 0;
  for (const [, status] of checkFilters) {
    if (status !== null && status !== undefined) {
      count++;
    }
  }
  return count;
}
