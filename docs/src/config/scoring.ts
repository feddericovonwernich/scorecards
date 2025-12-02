/**
 * Scoring configuration - centralizes rank thresholds and weights
 * @module config/scoring
 */

import type { RankName, RankConfig, ScoringConfig } from '../types/index';

export const SCORING: ScoringConfig = {
  ranks: {
    platinum: { threshold: 90, color: 'brightgreen', label: 'Platinum' },
    gold: { threshold: 75, color: 'green', label: 'Gold' },
    silver: { threshold: 50, color: 'yellow', label: 'Silver' },
    bronze: { threshold: 0, color: 'orange', label: 'Bronze' },
  },
  colors: {
    score: {
      excellent: { threshold: 80, color: 'brightgreen' },
      good: { threshold: 60, color: 'green' },
      fair: { threshold: 40, color: 'yellow' },
      poor: { threshold: 20, color: 'orange' },
      bad: { threshold: 0, color: 'red' },
    },
  },
  defaults: {
    checkWeight: 10,
    qualityThreshold: 60,
  },
};

export interface RankResult extends RankConfig {
  name: RankName;
}

/**
 * Get rank for a given score
 */
export function getRankForScore(score: number): RankResult {
  if (score >= SCORING.ranks.platinum.threshold) {
    return { name: 'platinum', ...SCORING.ranks.platinum };
  }
  if (score >= SCORING.ranks.gold.threshold) {
    return { name: 'gold', ...SCORING.ranks.gold };
  }
  if (score >= SCORING.ranks.silver.threshold) {
    return { name: 'silver', ...SCORING.ranks.silver };
  }
  return { name: 'bronze', ...SCORING.ranks.bronze };
}

/**
 * Get color for a given score
 */
export function getColorForScore(score: number): string {
  const { colors } = SCORING;
  if (score >= colors.score.excellent.threshold) {return colors.score.excellent.color;}
  if (score >= colors.score.good.threshold) {return colors.score.good.color;}
  if (score >= colors.score.fair.threshold) {return colors.score.fair.color;}
  if (score >= colors.score.poor.threshold) {return colors.score.poor.color;}
  return colors.score.bad.color;
}
