/**
 * Staleness Detection Service
 * Checks if service results are out-of-date based on checks hash
 */

import type { ServiceData } from '../types/index';

export interface StalenessInfo {
  isStale: boolean;
  message: string;
  serviceHash: string;
  currentHash: string;
}

export interface StalenessStats {
  total: number;
  stale: number;
  upToDate: number;
  percentage: number;
}

/**
 * Check if a service is stale (needs re-running due to updated checks)
 */
export function isServiceStale(
  service: ServiceData,
  currentHash: string | null
): boolean {
  // If no current hash available, can't determine staleness
  if (!currentHash) {
    return false;
  }

  // Backwards compatibility: if service has no checks_hash, assume it's stale
  if (!service.checks_hash) {
    return true;
  }

  // Compare hashes
  return service.checks_hash !== currentHash;
}

/**
 * Get staleness information for a service
 */
export function getStalenessInfo(
  service: ServiceData,
  currentHash: string | null
): StalenessInfo {
  const stale = isServiceStale(service, currentHash);

  return {
    isStale: stale,
    message: stale
      ? 'Score may be outdated (checks have been updated)'
      : 'Score is current',
    serviceHash: service.checks_hash || 'unknown',
    currentHash: currentHash || 'unknown',
  };
}

/**
 * Filter services to get only stale ones
 */
export function filterStaleServices(
  services: ServiceData[],
  currentHash: string | null
): ServiceData[] {
  return services.filter((service) => isServiceStale(service, currentHash));
}

/**
 * Get staleness statistics for a set of services
 */
export function getStalenessStats(
  services: ServiceData[],
  currentHash: string | null
): StalenessStats {
  const staleServices = filterStaleServices(services, currentHash);

  return {
    total: services.length,
    stale: staleServices.length,
    upToDate: services.length - staleServices.length,
    percentage:
      services.length > 0
        ? Math.round((staleServices.length / services.length) * 100)
        : 0,
  };
}

/**
 * Count stale services among installed services
 */
export function countStaleInstalled(
  services: ServiceData[],
  currentHash: string | null
): number {
  return services.filter(
    (s) => isServiceStale(s, currentHash) && s.installed
  ).length;
}
