/**
 * Statistics Calculation Utilities
 * Reusable functions for calculating service statistics
 */

import { RANKS } from '../config/constants.js';
import type { ServiceData, RankCounts } from '../types/index.js';

export interface ServiceStats {
  total: number;
  avgScore: number;
  ranks: RankCounts;
  apiCount: number;
  staleCount: number;
  installedCount: number;
}

/**
 * Count services by rank
 */
export function countByRank(services: ServiceData[]): RankCounts {
  const counts: RankCounts = {
    platinum: 0,
    gold: 0,
    silver: 0,
    bronze: 0,
  };
  RANKS.forEach((rank) => {
    counts[rank] = services.filter((s) => s.rank === rank).length;
  });
  return counts;
}

/**
 * Calculate average score for services
 */
export function calculateAverageScore(services: ServiceData[]): number {
  if (!services || services.length === 0) {return 0;}
  const total = services.reduce((sum, s) => sum + (s.score || 0), 0);
  return Math.round(total / services.length);
}

export type StalenessCheckFn = (service: ServiceData, hash: string | null) => boolean;

/**
 * Calculate comprehensive statistics for services
 */
export function calculateServiceStats(
  services: ServiceData[],
  isStaleCheck: StalenessCheckFn | null,
  checksHash: string | null
): ServiceStats {
  return {
    total: services.length,
    avgScore: calculateAverageScore(services),
    ranks: countByRank(services),
    apiCount: services.filter((s) => s.has_api).length,
    staleCount: isStaleCheck
      ? services.filter((s) => isStaleCheck(s, checksHash)).length
      : 0,
    installedCount: services.filter((s) => s.installed).length,
  };
}
