/**
 * Navigation Component
 * View tabs for switching between Services and Teams
 * Single source of truth for view navigation with URL hash sync
 */

import { useCallback, useEffect } from 'react';
import { cn } from '../../utils/css.js';
import { useAppStore, selectCurrentView } from '../../stores/appStore.js';

export type ViewType = 'services' | 'teams';

/**
 * Services icon SVG
 */
function ServicesIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

/**
 * Teams icon SVG
 */
function TeamsIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
    </svg>
  );
}

// Tab icon styles - uses legacy CSS class from tabs.css
const TAB_ICON_CLASS = 'tab-icon';

/**
 * Navigation Component
 * Manages view state and URL hash synchronization
 * Uses legacy CSS classes from docs/css/components/tabs.css for premium styling
 */
export function Navigation() {
  const currentView = useAppStore(selectCurrentView);
  const setCurrentView = useAppStore((state) => state.setCurrentView);

  // Handle view change with URL update
  const handleViewChange = useCallback(
    (view: ViewType) => {
      setCurrentView(view);

      // Update URL hash without triggering hashchange
      history.replaceState(null, '', `#${view}`);

      // Dispatch event for any legacy listeners
      window.dispatchEvent(
        new CustomEvent('view-changed', { detail: { view } })
      );
    },
    [setCurrentView]
  );

  // Sync with URL hash on mount and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'teams' || hash === 'services') {
        setCurrentView(hash);
      }
    };

    // Check initial hash
    handleHashChange();

    // Listen for hash changes (back/forward navigation)
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setCurrentView]);

  return (
    <nav className="view-tabs" role="tablist">
      <button
        className={cn('view-tab', currentView === 'services' && 'active')}
        data-view="services"
        onClick={() => handleViewChange('services')}
        role="tab"
        aria-selected={currentView === 'services'}
        aria-controls="services-view"
      >
        <ServicesIcon className={TAB_ICON_CLASS} />
        Services
      </button>
      <button
        className={cn('view-tab', currentView === 'teams' && 'active')}
        data-view="teams"
        onClick={() => handleViewChange('teams')}
        role="tab"
        aria-selected={currentView === 'teams'}
        aria-controls="teams-view"
      >
        <TeamsIcon className={TAB_ICON_CLASS} />
        Teams
      </button>
    </nav>
  );
}

export default Navigation;
