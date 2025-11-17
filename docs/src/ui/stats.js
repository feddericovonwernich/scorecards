/**
 * Statistics Display
 * Calculates and updates dashboard statistics
 */

import { isServiceStale } from '../services/staleness.js';

/**
 * Update dashboard statistics
 * Uses global variables: allServices, currentChecksHash
 * @returns {void}
 */
export function updateStats() {
    const total = allServices.length;
    const avgScore = total > 0
        ? Math.round(allServices.reduce((sum, s) => sum + s.score, 0) / total)
        : 0;

    const rankCounts = {
        platinum: allServices.filter(s => s.rank === 'platinum').length,
        gold: allServices.filter(s => s.rank === 'gold').length,
        silver: allServices.filter(s => s.rank === 'silver').length,
        bronze: allServices.filter(s => s.rank === 'bronze').length
    };

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
