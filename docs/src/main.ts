/**
 * Main Application Entry Point
 * Imports all ES6 modules and initializes the application
 *
 * Note: UI components have been migrated to React (see components/index.tsx)
 * This file now serves as a thin shell that initializes React and provides
 * window globals for any remaining vanilla JS code.
 */

import type { TeamRegistryEntry, TeamWithStats } from './types/index.js';

// React components entry point - this is where all UI rendering happens
import './components/index.js';

// Config modules
import * as constants from './config/constants.js';
import * as icons from './config/icons.js';

// Utility modules
import * as formatting from './utils/formatting.js';
import * as crypto from './utils/crypto.js';
import * as clipboard from './utils/clipboard.js';
import * as cssUtils from './utils/css.js';
import * as animation from './utils/animation.js';
import * as statistics from './utils/statistics.js';
import * as teamStatistics from './utils/team-statistics.js';
import * as checkStatistics from './utils/check-statistics.js';
import * as durationTracker from './utils/duration-tracker.js';

// API modules
import * as registry from './api/registry.js';
import * as github from './api/github.js';
import * as workflowTriggers from './api/workflow-triggers.js';
import * as checks from './api/checks.js';

// Service modules
import * as auth from './services/auth.js';
import * as staleness from './services/staleness.js';

// Application initialization
import * as appInit from './app-init.js';

// Zustand store
import { useAppStore } from './stores/appStore.js';
import * as storeAccessor from './stores/accessor.js';

// Window types are defined in types/globals.d.ts

// ============================================================================
// Global State Migration
// All state is now managed by Zustand store
// Window properties are deprecated and will be removed in Phase 8
// ============================================================================
// Note: Window globals removed - use useAppStore or storeAccessor instead

// Export modules to window for backward compatibility
const ScorecardModules = {
  // Config
  constants,
  icons,
  // Utilities
  formatting,
  crypto,
  clipboard,
  cssUtils,
  animation,
  statistics,
  teamStatistics,
  checkStatistics,
  durationTracker,
  // API
  registry,
  github,
  workflowTriggers,
  checks,
  // Services
  auth,
  staleness,
  appInit,
};

window.ScorecardModules = ScorecardModules;

// Export only the minimal functions still needed as window globals
// Most code now uses ES6 imports. These exports remain for:
// - filterAndRenderServices: Called by setupEventListeners (team filter)
// - refreshData: Called by refresh buttons
// - triggerServiceWorkflow: Called by ServiceGridContainer for reload buttons

// Application initialization (used by setupEventListeners and refresh)
window.filterAndRenderServices = appInit.filterAndRenderServices;
window.refreshData = appInit.refreshData;

// Workflow triggers (used by ServiceGridContainer for service card reload buttons)
window.triggerServiceWorkflow = workflowTriggers.triggerServiceWorkflow;

// ============================================================================
// View Tab Navigation
// ============================================================================

/**
 * Initialize teams view - load teams data into Zustand store
 * React components handle all rendering
 */
async function initTeamsView(): Promise<void> {
  try {
    // Load teams data (services should already be loaded)
    const services = storeAccessor.getAllServices() || [];

    // Load teams from registry (includes teams with 0 services)
    let teamsData: Record<string, TeamRegistryEntry> | null = null;
    try {
      const { teams } = await registry.loadTeams();
      teamsData = teams;
    } catch (error) {
      console.warn('Failed to load teams registry:', error);
    }

    // Calculate stats from services
    const calculatedStats = teamStatistics.calculateTeamStats(services);

    // Merge registry data with calculated stats
    let teamData: Record<string, TeamRegistryEntry>;
    if (teamsData) {
      // mergeTeamDataWithStats returns MergedTeamData with null for description, convert to undefined
      const merged = teamStatistics.mergeTeamDataWithStats(teamsData, calculatedStats);
      teamData = Object.fromEntries(
        Object.entries(merged).map(([key, data]) => [
          key,
          { ...data, description: data.description ?? undefined },
        ])
      ) as Record<string, TeamRegistryEntry>;
    } else {
      // Fallback: use service-derived teams only
      teamData = Object.fromEntries(
        Object.entries(calculatedStats).map(([name, stats]) => [
          name.toLowerCase().replace(/\s+/g, '-'),
          {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            statistics: stats,
          },
        ])
      ) as Record<string, TeamRegistryEntry>;
    }

    // Flatten statistics for rendering compatibility
    const allTeams = Object.values(teamData).map((t) => ({
      ...t,
      ...(t.statistics || {}),
      // Flatten metadata for slack_channel access
      slack_channel: t.metadata?.slack_channel || null,
    })) as TeamWithStats[];

    // Update Zustand store (React components will handle rendering)
    storeAccessor.setAllTeams(allTeams);
    storeAccessor.setFilteredTeams(allTeams);
  } catch (error) {
    console.error('Failed to initialize teams view:', error);
  }
}

/**
 * Refresh teams view data
 */
async function refreshTeamsView(): Promise<void> {
  // First refresh the services data
  await appInit.refreshData();
  // Then re-initialize teams view
  await initTeamsView();
}

// Export view navigation functions
window.initTeamsView = initTeamsView;
window.refreshTeamsView = refreshTeamsView;

/**
 * Setup Event Listeners
 * Initializes all DOM event listeners for the application
 *
 * Note: Most controls are now managed by React components (Phase 5):
 * - Services search/sort: ServicesControls component
 * - Teams search/sort: TeamsControls component
 * - Stat card filters: React stats components (Phase 4)
 */
function setupEventListeners(): void {
  // View tab navigation and hash handling are now fully managed by React Navigation component
  // No vanilla JS view switching code needed here

  // Listen for team filter changes from TeamFilterDropdown component
  window.addEventListener('team-filter-changed', ((e: CustomEvent<{ teams: string[] }>) => {
    const { teams } = e.detail;
    const store = useAppStore.getState();

    // For multi-select, join teams with comma
    // Empty selection means no filter (null)
    // Single selection keeps the value as-is (including __no_team__)
    let teamFilter: string | null = null;
    if (teams.length === 1) {
      // Single team selected - use it directly (including __no_team__)
      teamFilter = teams[0];
    } else if (teams.length > 1) {
      // Multi-select: store the array as comma-joined string
      teamFilter = teams.join(',');
    }

    // Update store using updateFilters
    store.updateFilters({ teamFilter });

    // Re-filter and render
    window.filterAndRenderServices();
  }) as EventListener);
}

// Export to window for backward compatibility
window.setupEventListeners = setupEventListeners;

// Initialize event listeners on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Setup event listeners
  setupEventListeners();

  // Initialize application (load services and render)
  appInit.initializeApp();
});

// Export for ES6 module imports
export {
  // Config
  constants,
  icons,
  // Utilities
  formatting,
  crypto,
  clipboard,
  cssUtils,
  animation,
  statistics,
  teamStatistics,
  checkStatistics,
  durationTracker,
  // API
  registry,
  github,
  workflowTriggers,
  checks,
  // Services
  auth,
  staleness,
  appInit,
};
