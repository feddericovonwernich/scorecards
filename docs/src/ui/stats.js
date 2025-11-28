/**
 * Statistics Display
 * Calculates and updates dashboard statistics
 */

import { isServiceStale } from '../services/staleness.js';
import { countByRank, calculateAverageScore } from '../utils/statistics.js';

/**
 * Update dashboard statistics
 * Uses global variables: allServices, currentChecksHash
 * @returns {void}
 */
export function updateStats() {
    const total = allServices.length;
    const avgScore = calculateAverageScore(allServices);
    const rankCounts = countByRank(allServices);

    const apiCount = allServices.filter(s => s.has_api).length;
    const staleCount = allServices.filter(s => isServiceStale(s, currentChecksHash)).length;
    const installedCount = allServices.filter(s => s.installed).length;

    document.getElementById('total-services').textContent = total;
    document.getElementById('avg-score').textContent = avgScore;
    document.getElementById('api-count').textContent = apiCount;
    document.getElementById('stale-count').textContent = staleCount;
    document.getElementById('installed-count').textContent = installedCount;
    document.getElementById('platinum-count').textContent = rankCounts.platinum;
    document.getElementById('gold-count').textContent = rankCounts.gold;
    document.getElementById('silver-count').textContent = rankCounts.silver;
    document.getElementById('bronze-count').textContent = rankCounts.bronze;
}
