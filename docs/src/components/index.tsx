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
import { StrictMode, useEffect } from 'react';
import {
  ToastContainer,
  useToast,
  setGlobalToastHandler,
  type ToastType,
} from './ui/index.js';
import { ServiceGridContainer } from './containers/ServiceGridContainer.js';
import { TeamGridContainer } from './containers/TeamGridContainer.js';

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

/**
 * Initialize portal targets (called when DOM is ready)
 */
function initPortalTargets(): void {
  servicesGridEl = document.getElementById('services-grid');
  teamsGridEl = document.getElementById('teams-grid');

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
}

interface AppProps {
  servicesGrid: HTMLElement | null;
  teamsGrid: HTMLElement | null;
}

/**
 * Main App component that orchestrates React islands
 */
function App({ servicesGrid, teamsGrid }: AppProps) {
  const { toasts, showToast, dismissToast } = useToast();

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

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Service Grid Portal */}
      {servicesGrid && createPortal(
        <ServiceGridContainer />,
        servicesGrid
      )}

      {/* Team Grid Portal */}
      {teamsGrid && createPortal(
        <TeamGridContainer />,
        teamsGrid
      )}
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
      <App servicesGrid={servicesGridEl} teamsGrid={teamsGridEl} />
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

// Re-export hooks
export * from './hooks/index.js';
