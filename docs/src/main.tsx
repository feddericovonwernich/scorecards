/**
 * Application Entry Point
 * Bootstraps React application with React Router
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';

// Import initialization function
import { initializeApp } from './app-init.js';

// Setup event listeners for legacy custom events
// TODO: Remove when TeamFilterDropdown migrates to direct Zustand updates
function setupEventListeners(): void {
  // Listen for team filter changes from TeamFilterDropdown component
  window.addEventListener('team-filter-changed', ((e: CustomEvent<{ teams: string[] }>) => {
    const { teams } = e.detail;

    // For multi-select, join teams with comma
    // Empty selection means no filter (null)
    let teamFilter: string | null = null;
    if (teams.length === 1) {
      teamFilter = teams[0];
    } else if (teams.length > 1) {
      teamFilter = teams.join(',');
    }

    // Update filter in store - this automatically triggers re-render of filtered services
    import('./stores/appStore.js').then(({ useAppStore }) => {
      const store = useAppStore.getState();
      store.updateFilters({ teamFilter });
      // No need to call filterAndRenderServices - React handles re-rendering
    });
  }) as EventListener);
}

// Call initialization
setupEventListeners();
initializeApp();

// Mount React app
const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  console.error('Root element #root not found');
}
