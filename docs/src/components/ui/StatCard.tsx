/**
 * StatCard Component
 *
 * Displays a statistic with value and label.
 * Supports filterable cards that can be clicked to filter data.
 * Uses CSS classes from cards.css for styling.
 */

import { cn } from '../../utils/css.js';
import type { RankType } from './Badge.js';

export type FilterType = RankType | 'has-api' | 'stale' | 'installed';
export type FilterState = 'include' | 'exclude' | null;

interface StatCardProps {
  /** The statistic value to display */
  value: number | string;
  /** The label describing the statistic */
  label: string;
  /** Whether this card is filterable (clickable) */
  filterable?: boolean;
  /** The filter type for this card */
  filterType?: FilterType;
  /** Current filter state */
  filterState?: FilterState;
  /** Click handler for filterable cards */
  onClick?: (filterType: FilterType) => void;
  /** Additional CSS classes */
  className?: string;
  /** Element ID for DOM reference */
  id?: string;
}

// Map filter types to CSS class modifiers
const FILTER_TYPE_TO_CLASS: Record<FilterType, string> = {
  platinum: 'platinum',
  gold: 'gold',
  silver: 'silver',
  bronze: 'bronze',
  'has-api': 'api',
  stale: 'stale',
  installed: 'installed',
};

export function StatCard({
  value,
  label,
  filterable = false,
  filterType,
  filterState = null,
  onClick,
  className = '',
  id,
}: StatCardProps) {
  const handleClick = () => {
    if (filterable && filterType && onClick) {
      onClick(filterType);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filterable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick();
    }
  };

  const typeClass = filterType ? FILTER_TYPE_TO_CLASS[filterType] : null;
  const isActive = filterState === 'include';
  const isExcluded = filterState === 'exclude';

  return (
    <div
      className={cn(
        'stat-card',
        'stat-card-react',
        filterable && 'stat-card-react--filterable',
        !filterable && 'stat-card-react--static',
        isActive && typeClass && `stat-card-react--active-${typeClass}`,
        isExcluded && 'stat-card-react--excluded',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={filterable ? 'button' : undefined}
      tabIndex={filterable ? 0 : undefined}
      data-filter={filterType}
      id={id}
    >
      <div
        className={cn(
          'stat-value',
          'stat-card-react__value',
          isActive && typeClass && `stat-card-react__value--${typeClass}`
        )}
        id={id ? `${id}-value` : undefined}
      >
        {value}
      </div>
      <div className="stat-label stat-card-react__label">
        {label}
      </div>
    </div>
  );
}

/**
 * StatCardGroup - Container for multiple stat cards
 */
interface StatCardGroupProps {
  children: React.ReactNode;
  className?: string;
  view?: 'services' | 'teams';
}

export function StatCardGroup({ children, className = '', view = 'services' }: StatCardGroupProps) {
  return (
    <section
      className={cn(
        view === 'services' ? 'services-stats' : 'teams-stats',
        'stat-card-group',
        view === 'services' && 'stat-card-group--services',
        view === 'teams' && 'stat-card-group--teams',
        className
      )}
    >
      {children}
    </section>
  );
}
