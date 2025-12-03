/**
 * React Component Entry Point
 *
 * This file initializes React and mounts React component islands
 * alongside the existing vanilla JavaScript application.
 *
 * Components are mounted to #react-root as "islands" that coexist
 * with the vanilla JS DOM manipulation.
 */

import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { StrictMode, useEffect, useState, useCallback } from 'react';
import {
  ToastContainer,
  useToast,
  setGlobalToastHandler,
  type ToastType,
} from './ui/index.js';
import { ServiceGridContainer } from './containers/ServiceGridContainer.js';
import { TeamGridContainer } from './containers/TeamGridContainer.js';
import { ServiceModal } from './features/ServiceModal/index.js';
import { TeamModal } from './features/TeamModal/index.js';
import { CheckFilterModal } from './features/CheckFilterModal/index.js';
import {
  Header,
  Footer,
  Navigation,
  FloatingControls,
  type ViewType,
} from './layout/index.js';
import type { CheckFilter } from '../types/index.js';
import { useAppStore, selectCurrentView } from '../stores/index.js';

// ============================================================================
// Toast Queue - handles toasts that arrive before React mounts
// ============================================================================

let pendingToasts: Array<{ message: string; type: ToastType }> = [];
let isReactMounted = false;

function getPendingToasts() {
  const toasts = [...pendingToasts];
  pendingToasts = [];
  return toasts;
}

function setReactMounted() {
  isReactMounted = true;
}

// ============================================================================
// App Component
// ============================================================================

// Portal target elements - set during initialization when DOM is ready
let servicesGridEl: HTMLElement | null = null;
let teamsGridEl: HTMLElement | null = null;
let headerEl: HTMLElement | null = null;
let footerEl: HTMLElement | null = null;
let navigationEl: HTMLElement | null = null;
let floatingControlsEl: HTMLElement | null = null;

/**
 * Initialize portal targets (called when DOM is ready)
 */
function initPortalTargets(): void {
  servicesGridEl = document.getElementById('services-grid');
  teamsGridEl = document.getElementById('teams-grid');

  // Layout element targets - these are optional (React takes over if present)
  headerEl = document.getElementById('react-header');
  footerEl = document.getElementById('react-footer');
  navigationEl = document.getElementById('react-navigation');
  floatingControlsEl = document.getElementById('react-floating-controls');

  // Set flags to tell vanilla JS that React is managing these grids
  // This prevents vanilla JS from overwriting React's rendered content
  if (servicesGridEl) {
    window.__REACT_MANAGES_SERVICES_GRID = true;
    servicesGridEl.innerHTML = '';
  }
  if (teamsGridEl) {
    window.__REACT_MANAGES_TEAMS_GRID = true;
    teamsGridEl.innerHTML = '';
  }

  // Set flags for layout elements
  if (headerEl) {
    window.__REACT_MANAGES_HEADER = true;
  }
  if (footerEl) {
    window.__REACT_MANAGES_FOOTER = true;
  }
  if (navigationEl) {
    window.__REACT_MANAGES_NAVIGATION = true;
  }
  if (floatingControlsEl) {
    window.__REACT_MANAGES_FLOATING_CONTROLS = true;
  }
}

interface AppProps {
  servicesGrid: HTMLElement | null;
  teamsGrid: HTMLElement | null;
  header: HTMLElement | null;
  footer: HTMLElement | null;
  navigation: HTMLElement | null;
  floatingControls: HTMLElement | null;
}

/**
 * Main App component that orchestrates React islands
 */
function App({
  servicesGrid,
  teamsGrid,
  header,
  footer,
  navigation,
  floatingControls,
}: AppProps) {
  const { toasts, showToast, dismissToast } = useToast();

  // View state from Zustand store
  const activeView = useAppStore(selectCurrentView);
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const [actionsBadgeCount, setActionsBadgeCount] = useState(0);

  // Initialize view state from DOM on mount
  useEffect(() => {
    const servicesView = document.getElementById('services-view');
    const initialView = servicesView?.classList.contains('active')
      ? 'services'
      : 'teams';
    if (initialView !== activeView) {
      setCurrentView(initialView);
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modal state
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceModalOrg, setServiceModalOrg] = useState<string | null>(null);
  const [serviceModalRepo, setServiceModalRepo] = useState<string | null>(null);

  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamModalName, setTeamModalName] = useState<string | null>(null);

  const [checkFilterModalOpen, setCheckFilterModalOpen] = useState(false);
  const [checkFilters, setCheckFilters] = useState<Map<string, CheckFilter>>(
    new Map()
  );

  // Modal handlers
  const openServiceModal = useCallback((org: string, repo: string) => {
    setServiceModalOrg(org);
    setServiceModalRepo(repo);
    setServiceModalOpen(true);
  }, []);

  const closeServiceModal = useCallback(() => {
    setServiceModalOpen(false);
  }, []);

  const openTeamModal = useCallback((teamName: string) => {
    setTeamModalName(teamName);
    setTeamModalOpen(true);
  }, []);

  const closeTeamModal = useCallback(() => {
    setTeamModalOpen(false);
  }, []);

  const openCheckFilterModal = useCallback(() => {
    setCheckFilterModalOpen(true);
  }, []);

  const closeCheckFilterModal = useCallback(() => {
    setCheckFilterModalOpen(false);
  }, []);

  // Handle check filter changes
  const handleCheckFiltersChange = useCallback(
    (filters: Map<string, CheckFilter>) => {
      setCheckFilters(filters);
      // Notify vanilla JS about filter changes if needed
      window.dispatchEvent(
        new CustomEvent('check-filters-changed', { detail: { filters } })
      );
    },
    []
  );

  // Handle view changes
  const handleViewChange = useCallback((view: ViewType) => {
    setCurrentView(view);

    // Sync with vanilla JS view switching
    const servicesView = document.getElementById('services-view');
    const teamsView = document.getElementById('teams-view');
    const servicesTabs = document.querySelectorAll('.view-tab');

    if (servicesView && teamsView) {
      if (view === 'services') {
        servicesView.classList.add('active');
        teamsView.classList.remove('active');
      } else {
        servicesView.classList.remove('active');
        teamsView.classList.add('active');
      }
    }

    // Update tab buttons
    servicesTabs.forEach((tab) => {
      const tabView = tab.getAttribute('data-view');
      if (tabView === view) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Trigger teams initialization when switching to teams view
    if (view === 'teams' && window.initTeamsView) {
      window.initTeamsView();
    }

    // Dispatch event for vanilla JS
    window.dispatchEvent(
      new CustomEvent('view-changed', { detail: { view } })
    );
  }, [setCurrentView]);

  // Sync active view with vanilla JS
  useEffect(() => {
    // Listen for vanilla JS view changes
    const handleVanillaViewChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ view: ViewType }>;
      if (customEvent.detail?.view) {
        setCurrentView(customEvent.detail.view);
      }
    };
    window.addEventListener('vanilla-view-changed', handleVanillaViewChange);

    // Listen for actions badge count updates
    const handleBadgeUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ count: number }>;
      if (typeof customEvent.detail?.count === 'number') {
        setActionsBadgeCount(customEvent.detail.count);
      }
    };
    window.addEventListener('actions-badge-update', handleBadgeUpdate);

    return () => {
      window.removeEventListener('vanilla-view-changed', handleVanillaViewChange);
      window.removeEventListener('actions-badge-update', handleBadgeUpdate);
    };
  }, [setCurrentView]);

  // Register global toast handler for vanilla JS bridge
  useEffect(() => {
    setGlobalToastHandler(showToast);
    setReactMounted();

    // Expose showToast to window for vanilla JS
    window.showToast = (message: string, type?: ToastType | string) => {
      showToast(message, (type as ToastType) || 'info');
    };

    // Process any pending toasts that arrived before React mounted
    const pending = getPendingToasts();
    pending.forEach(({ message, type }) => {
      showToast(message, type);
    });

    return () => {
      setGlobalToastHandler(() => {});
    };
  }, [showToast]);

  // Expose modal functions to window for vanilla JS bridge
  useEffect(() => {
    // Store original functions to restore on cleanup
    const originalShowServiceDetail = window.showServiceDetail;
    const originalShowTeamDetail = window.showTeamDetail;
    const originalShowTeamModal = window.showTeamModal;
    const originalOpenCheckFilterModal = window.openCheckFilterModal;
    const originalCloseModal = window.closeModal;
    const originalCloseTeamModal = window.closeTeamModal;

    // Set React-managed modal openers
    window.showServiceDetail = async (org: string, repo: string) => {
      openServiceModal(org, repo);
    };

    window.showTeamDetail = async (teamName: string) => {
      openTeamModal(teamName);
    };

    window.showTeamModal = async (teamName: string) => {
      openTeamModal(teamName);
    };

    window.openCheckFilterModal = () => {
      openCheckFilterModal();
    };

    window.closeModal = () => {
      closeServiceModal();
    };

    window.closeTeamModal = () => {
      closeTeamModal();
    };

    // Set flag to indicate React is managing modals
    window.__REACT_MANAGES_SERVICE_MODAL = true;
    window.__REACT_MANAGES_TEAM_MODAL = true;

    return () => {
      // Restore original functions
      window.showServiceDetail = originalShowServiceDetail;
      window.showTeamDetail = originalShowTeamDetail;
      window.showTeamModal = originalShowTeamModal;
      window.openCheckFilterModal = originalOpenCheckFilterModal;
      window.closeModal = originalCloseModal;
      window.closeTeamModal = originalCloseTeamModal;
      window.__REACT_MANAGES_SERVICE_MODAL = false;
      window.__REACT_MANAGES_TEAM_MODAL = false;
    };
  }, [
    openServiceModal,
    closeServiceModal,
    openTeamModal,
    closeTeamModal,
    openCheckFilterModal,
  ]);

  // Get current services for check filter
  const services = window.allServices || [];

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Layout Portals - rendered if mount points exist */}
      {header && createPortal(<Header />, header)}
      {footer && createPortal(<Footer />, footer)}
      {navigation &&
        createPortal(
          <Navigation activeView={activeView} onViewChange={handleViewChange} />,
          navigation
        )}
      {floatingControls &&
        createPortal(
          <FloatingControls actionsBadgeCount={actionsBadgeCount} />,
          floatingControls
        )}

      {/* Service Grid Portal */}
      {servicesGrid && createPortal(<ServiceGridContainer />, servicesGrid)}

      {/* Team Grid Portal */}
      {teamsGrid && createPortal(<TeamGridContainer />, teamsGrid)}

      {/* Service Modal */}
      <ServiceModal
        isOpen={serviceModalOpen}
        onClose={closeServiceModal}
        org={serviceModalOrg}
        repo={serviceModalRepo}
      />

      {/* Team Modal */}
      <TeamModal
        isOpen={teamModalOpen}
        onClose={closeTeamModal}
        teamName={teamModalName}
      />

      {/* Check Filter Modal */}
      <CheckFilterModal
        isOpen={checkFilterModalOpen}
        onClose={closeCheckFilterModal}
        filters={checkFilters}
        onFiltersChange={handleCheckFiltersChange}
        services={services}
      />
    </>
  );
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize React root and mount components
 */
export function initReact(): void {
  const container = document.getElementById('react-root');

  if (!container) {
    console.warn('React root element not found');
    return;
  }

  // Initialize portal targets now that DOM is ready
  initPortalTargets();

  // Set up initial window.showToast that queues toasts until React mounts
  if (!window.showToast) {
    window.showToast = (message: string, type?: ToastType | string) => {
      if (isReactMounted) {
        // This will be overwritten by the React component's useEffect
      } else {
        pendingToasts.push({ message, type: (type as ToastType) || 'info' });
      }
    };
  }

  const root = createRoot(container);

  root.render(
    <StrictMode>
      <App
        servicesGrid={servicesGridEl}
        teamsGrid={teamsGridEl}
        header={headerEl}
        footer={footerEl}
        navigation={navigationEl}
        floatingControls={floatingControlsEl}
      />
    </StrictMode>
  );
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReact);
  } else {
    initReact();
  }
}

// Re-export UI components for use in other React components
export * from './ui/index.js';

// Re-export feature components
export * from './features/index.js';

// Re-export container components
export * from './containers/index.js';

// Re-export layout components
export * from './layout/index.js';

// Re-export hooks
export * from './hooks/index.js';
