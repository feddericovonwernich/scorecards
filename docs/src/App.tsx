/**
 * Main Application Component
 * Uses React Router for view navigation
 */

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Header, Footer, Navigation, FloatingControls } from './components/layout/index.js';
import { ServicesView, TeamsView } from './components/views/index.js';
import { ModalOrchestrator } from './components/features/ModalOrchestrator.js';
import {
  ToastContainer,
  useToast,
  setGlobalToastHandler,
  type ToastType,
} from './components/ui/index.js';
import { useActionsWidget } from './hooks/useWorkflowPolling.js';
import { initializeApp } from './app-init.js';

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

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);


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

    </>
  );
}

export function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
