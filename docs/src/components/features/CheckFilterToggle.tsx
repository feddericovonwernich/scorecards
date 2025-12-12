/**
 * CheckFilterToggle Component
 *
 * Button to open the Check Filter modal.
 * Renders into #check-filter-container via React Portal.
 */

import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { cn } from '../../utils/css.js';
import type { CheckFilter } from '../../types/index.js';

// Dispatch event to open check filter modal (caught by App component)
function dispatchOpenCheckFilterModal() {
  window.dispatchEvent(new CustomEvent('open-check-filter-modal'));
}

/**
 * CheckFilterToggle - The toggle button for opening the check filter modal
 */
export function CheckFilterToggle() {
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Listen for filter changes from App component
  useEffect(() => {
    const handleFiltersChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ filters: Map<string, CheckFilter> }>;
      if (customEvent.detail?.filters) {
        setActiveFilterCount(customEvent.detail.filters.size);
      }
    };

    window.addEventListener('check-filters-changed', handleFiltersChanged);

    return () => {
      window.removeEventListener('check-filters-changed', handleFiltersChanged);
    };
  }, []);

  const hasActiveFilters = activeFilterCount > 0;

  const handleClick = () => {
    // Dispatch custom event to open modal (listened to by App component)
    dispatchOpenCheckFilterModal();
  };

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

/**
 * CheckFilterTogglePortal - Renders into #check-filter-container
 */
export function CheckFilterTogglePortal() {
  // Find container after component mounts (DOM is guaranteed to be ready)
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById('check-filter-container');
    if (el) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Portal container lookup is intentionally once on mount
      setContainer(el);
    }
  }, []);

  if (!container) {
    return null;
  }

  return createPortal(<CheckFilterToggle />, container);
}

export default CheckFilterToggle;
