/**
 * Badge Components
 *
 * Reusable badge components for displaying ranks and status indicators.
 * Uses CSS classes from badges.css for styling.
 */

import { cn } from '../../utils/css.js';

export type RankType = 'platinum' | 'gold' | 'silver' | 'bronze';
export type UtilityBadgeType = 'api' | 'stale' | 'installed';

// Utility to capitalize first letter
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * RankBadge - Full rank badge (e.g., "PLATINUM", "GOLD")
 * Uses CSS classes from badges.css for consistent styling
 */
interface RankBadgeProps {
  rank: RankType;
  className?: string;
  isModalHeader?: boolean;
}

export function RankBadge({ rank, className = '', isModalHeader = false }: RankBadgeProps) {
  return (
    <div
      className={cn(
        'rank-badge',
        rank,
        isModalHeader && 'mb-0',
        className
      )}
    >
      {capitalize(rank)}
    </div>
  );
}

/**
 * MiniRankBadge - Small badge showing count for a rank
 */
interface MiniRankBadgeProps {
  rank: RankType;
  count: number;
  className?: string;
}

export function MiniRankBadge({ rank, count, className = '' }: MiniRankBadgeProps) {
  return (
    <span
      className={cn(
        'mini-rank-badge',
        `mini-rank-badge--${rank}`,
        className
      )}
    >
      {count}
    </span>
  );
}

/**
 * RankBadgeGroup - Renders mini badges for all ranks with counts > 0
 */
interface RankBadgeGroupProps {
  distribution: Record<RankType, number>;
  className?: string;
}

export function RankBadgeGroup({ distribution, className = '' }: RankBadgeGroupProps) {
  const ranks: RankType[] = ['platinum', 'gold', 'silver', 'bronze'];
  const visibleRanks = ranks.filter((r) => distribution[r] > 0);

  if (visibleRanks.length === 0) {
    return <MiniRankBadge rank="bronze" count={0} />;
  }

  return (
    <div className={cn('rank-badge-group', className)}>
      {visibleRanks.map((rank) => (
        <MiniRankBadge key={rank} rank={rank} count={distribution[rank]} />
      ))}
    </div>
  );
}

/**
 * UtilityBadge - API, Stale, Installed badges
 * Uses CSS classes from badges.css (.badge-api, .badge-stale, .badge-installed)
 */
interface UtilityBadgeProps {
  type: UtilityBadgeType;
  className?: string;
}

const UTILITY_BADGE_LABELS: Record<UtilityBadgeType, string> = {
  api: 'API',
  stale: 'STALE',
  installed: 'INSTALLED',
};

export function UtilityBadge({ type, className = '' }: UtilityBadgeProps) {
  return (
    <span className={cn(`badge-${type}`, className)}>
      {UTILITY_BADGE_LABELS[type]}
    </span>
  );
}

/**
 * ServiceBadges - Container for utility badges on service cards
 */
interface ServiceBadgesProps {
  hasApi?: boolean;
  isStale?: boolean;
  isInstalled?: boolean;
  className?: string;
}

export function ServiceBadges({
  hasApi = false,
  isStale = false,
  isInstalled = false,
  className = '',
}: ServiceBadgesProps) {
  const hasBadges = hasApi || isStale || isInstalled;

  if (!hasBadges) {
    return null;
  }

  return (
    <div className={cn('service-badges', className)}>
      {hasApi && <UtilityBadge type="api" />}
      {isStale && <UtilityBadge type="stale" />}
      {isInstalled && <UtilityBadge type="installed" />}
    </div>
  );
}

/**
 * ScoreBadge - Displays numeric score
 */
interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className = '' }: ScoreBadgeProps) {
  return (
    <div className={cn('score-badge-inline', className)}>
      {score}
    </div>
  );
}
