/**
 * FilterButton Component
 *
 * A toggle button used for filtering lists and grids.
 * Supports active/inactive states and optional count badges.
 */

interface FilterButtonProps {
  /** Button label text */
  label: string;
  /** Current active state */
  isActive?: boolean;
  /** Optional count to display */
  count?: number;
  /** Filter status identifier */
  status?: string;
  /** Click handler */
  onClick?: (status: string) => void;
  /** Additional CSS classes */
  className?: string;
}

export function FilterButton({
  label,
  isActive = false,
  count,
  status = '',
  onClick,
  className = '',
}: FilterButtonProps) {
  const handleClick = () => {
    onClick?.(status);
  };

  const classes = [
    'widget-filter-btn',
    isActive ? 'active' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      data-status={status}
      onClick={handleClick}
    >
      {label}
      {count !== undefined && (
        <span className="filter-count">{count}</span>
      )}
    </button>
  );
}

/**
 * FilterButtonGroup - Container for filter buttons
 */
interface FilterOption {
  label: string;
  status: string;
  count?: number;
}

interface FilterButtonGroupProps {
  options: FilterOption[];
  activeStatus: string;
  onFilterChange: (status: string) => void;
  className?: string;
}

export function FilterButtonGroup({
  options,
  activeStatus,
  onFilterChange,
  className = '',
}: FilterButtonGroupProps) {
  return (
    <div className={`widget-filters ${className}`}>
      {options.map((option) => (
        <FilterButton
          key={option.status}
          label={option.label}
          status={option.status}
          count={option.count}
          isActive={activeStatus === option.status}
          onClick={onFilterChange}
        />
      ))}
    </div>
  );
}

/**
 * Common filter presets for workflow filters
 */
export const WORKFLOW_FILTER_OPTIONS: FilterOption[] = [
  { label: 'All', status: 'all', count: 0 },
  { label: 'Running', status: 'in_progress', count: 0 },
  { label: 'Queued', status: 'queued', count: 0 },
  { label: 'Completed', status: 'completed', count: 0 },
];

/**
 * Creates filter options with updated counts
 */
export function createWorkflowFilterOptions(counts: {
  all: number;
  in_progress: number;
  queued: number;
  completed: number;
}): FilterOption[] {
  return [
    { label: 'All', status: 'all', count: counts.all },
    { label: 'Running', status: 'in_progress', count: counts.in_progress },
    { label: 'Queued', status: 'queued', count: counts.queued },
    { label: 'Completed', status: 'completed', count: counts.completed },
  ];
}
