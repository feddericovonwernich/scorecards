/**
 * Main Application Component
 * Uses React Router for view navigation
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Header, Footer, Navigation, FloatingControls } from './components/layout/index.js';
import { ServicesView, TeamsView } from './components/views/index.js';
import { ModalOrchestrator } from './components/features/ModalOrchestrator.js';
import { TeamFilterDropdownPortal } from './components/features/TeamFilterDropdown.js';
import { CheckFilterTogglePortal } from './components/features/CheckFilterToggle.js';
import {
  ToastContainer,
  useToast,
  setGlobalToastHandler,
  type ToastType,
} from './components/ui/index.js';
import { useActionsWidget } from './hooks/useWorkflowPolling.js';
import { initializeApp } from './app-init.js';
import { useAppStore } from './stores/index.js';

// Toast queue for messages before React mounts
let pendingToasts: Array<{ message: string; type: ToastType }> = [];

function getPendingToasts() {
  const toasts = [...pendingToasts];
  pendingToasts = [];
  return toasts;
}

function AppContent() {
  const { toasts, showToast, dismissToast } = useToast();
  const { filterCounts } = useActionsWidget();
  const actionsBadgeCount = filterCounts.in_progress + filterCounts.queued;
  const updateFilters = useAppStore(state => state.updateFilters);

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Setup team filter event listener
  // TODO: Remove when TeamFilterDropdown migrates to direct Zustand updates
  useEffect(() => {
    const handleTeamFilterChange = ((e: CustomEvent<{ teams: string[] }>) => {
      const { teams } = e.detail;

      // For multi-select, join teams with comma
      let teamFilter: string | null = null;
      if (teams.length === 1) {
        teamFilter = teams[0];
      } else if (teams.length > 1) {
        teamFilter = teams.join(',');
      }

      updateFilters({ teamFilter });
    }) as EventListener;

    window.addEventListener('team-filter-changed', handleTeamFilterChange);
    return () => window.removeEventListener('team-filter-changed', handleTeamFilterChange);
  }, [updateFilters]);

  // Register global toast handler
  useEffect(() => {
    setGlobalToastHandler(showToast);

    window.showToast = (message: string, type?: ToastType | string) => {
      showToast(message, (type as ToastType) || 'info');
    };

    const pending = getPendingToasts();
    pending.forEach(({ message, type }) => {
      showToast(message, type);
    });

    return () => {
      setGlobalToastHandler(() => {});
    };
  }, [showToast]);

  const openSettingsModal = () => {
    window.openSettings?.();
  };

  const toggleActionsWidget = () => {
    window.toggleActionsWidget?.();
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Header />

      <main className="container">
        <Navigation />

        <Routes>
          <Route path="/" element={<Navigate to="/services" replace />} />
          <Route path="/services" element={<ServicesView />} />
          <Route path="/teams" element={<TeamsView />} />
        </Routes>
      </main>

      <Footer />

      <FloatingControls
        actionsBadgeCount={actionsBadgeCount}
        onSettingsClick={openSettingsModal}
        onActionsWidgetClick={toggleActionsWidget}
      />

      <ModalOrchestrator />

      <TeamFilterDropdownPortal />
      <CheckFilterTogglePortal />
    </>
  );
}

export function App() {
  // Support hash-based navigation during migration
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && (hash === 'teams' || hash === 'services')) {
      // Clear hash and use path-based routing instead
      window.history.replaceState(null, '', `/${hash}`);
    }
  }, []);

  // Get base path from import.meta.env (set by Vite)
  const basename = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <BrowserRouter basename={basename}>
      <AppContent />
    </BrowserRouter>
  );
}
