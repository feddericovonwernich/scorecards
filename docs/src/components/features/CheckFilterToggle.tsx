/**
 * Check Filter Toggle
 *
 * Opens the check filter modal and reflects the persisted filter count.
 */

import { useAppStore, selectCheckFilters } from '../../stores/appStore.js';
import { cn } from '../../utils/css.js';

// Dispatch the existing event consumed by ModalOrchestrator.
function dispatchOpenCheckFilterModal() {
  window.dispatchEvent(new CustomEvent('open-check-filter-modal'));
}
export function CheckFilterToggle() {
  const activeFilterCount = useAppStore(selectCheckFilters).size;
  const hasActiveFilters = activeFilterCount > 0;

  const handleClick = dispatchOpenCheckFilterModal;

  return (
    <button
      onClick={handleClick}
      className={cn('check-filter-toggle', hasActiveFilters && 'active')}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M.75 3a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5H.75ZM3 7.75A.75.75 0 0 1 3.75 7h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 7.75Zm3 4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" />
      </svg>
      <span>Check Filter{hasActiveFilters && ` (${activeFilterCount})`}</span>
    </button>
  );
}

export default CheckFilterToggle;
