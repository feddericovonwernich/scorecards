/**
 * Statistics Display
 * Calculates and updates dashboard statistics
 */

import { isServiceStale } from '../services/staleness.js';
import { countByRank, calculateAverageScore } from '../utils/statistics.js';
import type { ServiceData } from '../types/index.js';

// Window types are defined in types/globals.d.ts

declare const allServices: ServiceData[];
declare const currentChecksHash: string | null;

/**
 * Update dashboard statistics
 * Uses global variables: allServices, currentChecksHash
 */
export function updateStats(): void {
  const services = window.allServices || allServices;
  const checksHash = window.currentChecksHash ?? currentChecksHash;

  const total = services.length;
  const avgScore = calculateAverageScore(services);
  const rankCounts = countByRank(services);

  const apiCount = services.filter((s) => s.has_api).length;
  const staleCount = services.filter((s) =>
    isServiceStale(s, checksHash)
  ).length;
  const installedCount = services.filter((s) => s.installed).length;

  const setElementText = (id: string, value: number | string): void => {
    const el = document.getElementById(id);
    if (el) {el.textContent = String(value);}
  };

  setElementText('total-services', total);
  setElementText('avg-score', avgScore);
  setElementText('api-count', apiCount);
  setElementText('stale-count', staleCount);
  setElementText('installed-count', installedCount);
  setElementText('platinum-count', rankCounts.platinum);
  setElementText('gold-count', rankCounts.gold);
  setElementText('silver-count', rankCounts.silver);
  setElementText('bronze-count', rankCounts.bronze);
}
