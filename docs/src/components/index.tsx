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
import { SettingsModal } from './features/SettingsModal/index.js';
import { ActionsWidget } from './features/ActionsWidget/index.js';
import { TeamDashboard } from './features/TeamDashboard/index.js';
import { TeamEditModal } from './features/TeamEditModal/index.js';
import { CheckAdoptionDashboard } from './features/CheckAdoptionDashboard/index.js';
import { TeamFilterDropdownPortal } from './features/TeamFilterDropdown.js';
import { CheckFilterTogglePortal } from './features/CheckFilterToggle.js';
import {
  Header,
  Footer,
  Navigation,
  FloatingControls,
  type ViewType,
} from './layout/index.js';
import type { CheckFilter } from '../types/index.js';
import { useAppStore, selectCurrentView } from '../stores/index.js';
import { useActionsWidget } from '../hooks/useWorkflowPolling.js';

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

  // Set flag for navigation (checked by vanilla JS in main.ts)
  if (navigationEl) {
    window.__REACT_MANAGES_NAVIGATION = true;
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

  // Actions widget state and badge count from hook
  const { runs: _runs, filterCounts } = useActionsWidget();
  const actionsBadgeCount = filterCounts.in_progress + filterCounts.queued;

  // Get toggle function from store (ActionsWidget manages its own open state internally)
  const toggleActionsWidget = useAppStore((state) => state.toggleActionsWidget);

  // New modal states
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [teamDashboardOpen, setTeamDashboardOpen] = useState(false);
  const [checkAdoptionOpen, setCheckAdoptionOpen] = useState(false);
  const [teamEditModalOpen, setTeamEditModalOpen] = useState(false);
  const [teamEditMode, setTeamEditMode] = useState<'create' | 'edit'>('create');
  const [teamEditId, setTeamEditId] = useState<string | undefined>(undefined);

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

    return () => {
      window.removeEventListener('vanilla-view-changed', handleVanillaViewChange);
    };
  }, [setCurrentView]);

  // Listen for check filter modal open events (from CheckFilterToggle portal)
  useEffect(() => {
    const handleOpenCheckFilterModal = () => {
      setCheckFilterModalOpen(true);
    };
    window.addEventListener('open-check-filter-modal', handleOpenCheckFilterModal);

    return () => {
      window.removeEventListener('open-check-filter-modal', handleOpenCheckFilterModal);
    };
  }, []);

  // New modal handlers
  const openSettingsModal = useCallback(() => {
    setSettingsModalOpen(true);
  }, []);

  const closeSettingsModal = useCallback(() => {
    setSettingsModalOpen(false);
  }, []);

  const openTeamDashboard = useCallback(() => {
    setTeamDashboardOpen(true);
  }, []);

  const closeTeamDashboard = useCallback(() => {
    setTeamDashboardOpen(false);
  }, []);

  const openCheckAdoptionDashboard = useCallback(() => {
    setCheckAdoptionOpen(true);
  }, []);

  const closeCheckAdoptionDashboard = useCallback(() => {
    setCheckAdoptionOpen(false);
  }, []);

  const openTeamEditModal = useCallback((mode: 'create' | 'edit', teamId?: string) => {
    setTeamEditMode(mode);
    setTeamEditId(teamId);
    setTeamEditModalOpen(true);
  }, []);

  const closeTeamEditModal = useCallback(() => {
    setTeamEditModalOpen(false);
  }, []);

  const handleTeamEditSave = useCallback((_teamId: string, _isCreate: boolean) => {
    // Refresh team data after save
    // The TeamEditModal already closes itself after successful save
  }, []);

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
    const originalOpenSettings = window.openSettings;
    const originalToggleActionsWidget = window.toggleActionsWidget;
    const originalOpenTeamDashboard = window.openTeamDashboard;
    const originalOpenTeamEditModal = window.openTeamEditModal;
    const originalOpenCheckAdoptionDashboard = window.openCheckAdoptionDashboard;

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

    // New modal openers
    window.openSettings = () => {
      openSettingsModal();
    };

    window.toggleActionsWidget = () => {
      toggleActionsWidget();
    };

    window.openTeamDashboard = () => {
      openTeamDashboard();
    };

    window.openTeamEditModal = (mode?: 'create' | 'edit', teamId?: string) => {
      openTeamEditModal(mode || 'create', teamId);
    };

    window.openCheckAdoptionDashboard = () => {
      openCheckAdoptionDashboard();
    };

    return () => {
      // Restore original functions
      window.showServiceDetail = originalShowServiceDetail;
      window.showTeamDetail = originalShowTeamDetail;
      window.showTeamModal = originalShowTeamModal;
      window.openCheckFilterModal = originalOpenCheckFilterModal;
      window.closeModal = originalCloseModal;
      window.closeTeamModal = originalCloseTeamModal;
      window.openSettings = originalOpenSettings;
      window.toggleActionsWidget = originalToggleActionsWidget;
      window.openTeamDashboard = originalOpenTeamDashboard;
      window.openTeamEditModal = originalOpenTeamEditModal;
      window.openCheckAdoptionDashboard = originalOpenCheckAdoptionDashboard;
    };
  }, [
    openServiceModal,
    closeServiceModal,
    openTeamModal,
    closeTeamModal,
    openCheckFilterModal,
    openSettingsModal,
    toggleActionsWidget,
    openTeamDashboard,
    openTeamEditModal,
    openCheckAdoptionDashboard,
  ]);

  // Get current services for check filter
  const services = useAppStore.getState().services.all || [];

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
          <FloatingControls
            actionsBadgeCount={actionsBadgeCount}
            onSettingsClick={openSettingsModal}
            onActionsWidgetClick={toggleActionsWidget}
          />,
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={closeSettingsModal}
      />

      {/* Actions Widget (sidebar) - manages its own state via Zustand */}
      <ActionsWidget />

      {/* Team Dashboard Modal */}
      <TeamDashboard
        isOpen={teamDashboardOpen}
        onClose={closeTeamDashboard}
        onCreateTeam={() => openTeamEditModal('create')}
        onEditTeam={(teamId) => openTeamEditModal('edit', teamId)}
      />

      {/* Team Edit Modal */}
      <TeamEditModal
        isOpen={teamEditModalOpen}
        onClose={closeTeamEditModal}
        mode={teamEditMode}
        teamId={teamEditId}
        onSave={handleTeamEditSave}
      />

      {/* Check Adoption Dashboard Modal */}
      <CheckAdoptionDashboard
        isOpen={checkAdoptionOpen}
        onClose={closeCheckAdoptionDashboard}
      />

      {/* Team Filter Dropdown Portal - renders into #team-filter-container */}
      <TeamFilterDropdownPortal />

      {/* Check Filter Toggle Portal - renders into #check-filter-container */}
      <CheckFilterTogglePortal />
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
