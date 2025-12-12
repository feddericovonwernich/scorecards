/**
 * Application Entry Point
 * Bootstraps React application with React Router
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';

// Import functions directly to set up window globals
// (importing ./main.js was getting tree-shaken out by bundler)
import { initializeApp, filterAndRenderServices, refreshData } from './app-init.js';
import { triggerServiceWorkflow } from './api/workflow-triggers.js';

// Set up window globals for vanilla JS bridge
// These are used by React components that call window.* functions
window.filterAndRenderServices = filterAndRenderServices;
window.refreshData = refreshData;
window.triggerServiceWorkflow = triggerServiceWorkflow;

// Setup event listeners function (now inline to avoid tree-shaking)
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

    // Import dynamically to avoid circular dependency
    import('./stores/appStore.js').then(({ useAppStore }) => {
      const store = useAppStore.getState();
      store.updateFilters({ teamFilter });
      window.filterAndRenderServices();
    });
  }) as EventListener);
}

window.setupEventListeners = setupEventListeners;

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
