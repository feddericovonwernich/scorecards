/**
 * Main Application Entry Point
 * Imports all ES6 modules and initializes the application
 *
 * Note: UI components have been migrated to React (see components/index.tsx)
 * This file now serves as a thin shell that initializes React and provides
 * window globals for any remaining vanilla JS code.
 */

import type { ServiceData, ViewType, TeamRegistryEntry, TeamWithStats } from './types/index.js';

// React components entry point - this is where all UI rendering happens
import './components/index.js';

// Config modules
import * as constants from './config/constants.js';
import * as icons from './config/icons.js';

// Utility modules
import * as formatting from './utils/formatting.js';
import * as crypto from './utils/crypto.js';
import * as clipboard from './utils/clipboard.js';
import * as dom from './utils/dom.js';
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
import * as theme from './services/theme.js';

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
  dom,
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
  theme,
  appInit,
};

window.ScorecardModules = ScorecardModules;

// Export individual functions to global scope for easier access
// (This bridges the gap between ES6 modules and remaining vanilla JS)

// Formatting utilities
window.formatRelativeTime = formatting.formatRelativeTime;
window.formatDate = formatting.formatDate;
window.formatDuration = formatting.formatDuration;
window.formatInterval = formatting.formatInterval;
window.escapeHtml = formatting.escapeHtml;
window.capitalize = formatting.capitalize;

// Crypto utilities
window.md5 = crypto.md5;

// CSS utilities
window.getCssVar = cssUtils.getCssVar;

// Animation utilities
window.startButtonSpin = animation.startButtonSpin;
window.stopButtonSpin = animation.stopButtonSpin;

// Statistics utilities
window.countByRank = statistics.countByRank;
window.calculateAverageScore = statistics.calculateAverageScore;

// Duration tracker utilities
window.startLiveDurationUpdates = durationTracker.startLiveDurationUpdates;
window.stopLiveDurationUpdates = durationTracker.stopLiveDurationUpdates;

// Icon utilities
window.getIcon = icons.getIcon;

// Clipboard utilities
window.copyBadgeCode = clipboard.copyBadgeCode;

// API Explorer
window.openApiExplorer = function (org: string, repo: string): void {
  const explorerUrl = `api-explorer.html?org=${encodeURIComponent(org)}&repo=${encodeURIComponent(repo)}`;
  window.open(explorerUrl, '_blank');
};

// Auth functions
window.getGitHubToken = auth.getToken;
window.hasGitHubToken = auth.hasToken;
window.setGitHubToken = auth.setToken;
window.clearGitHubToken = auth.clearToken;
window.validateGitHubToken = auth.validateToken;

// Staleness functions
window.isServiceStale = staleness.isServiceStale;

// Theme functions
window.initTheme = theme.initTheme;
window.toggleTheme = theme.toggleTheme;
window.getCurrentTheme = theme.getCurrentTheme;
window.setTheme = theme.setTheme;

// Registry functions
window.loadServicesData = registry.loadServices;
window.fetchCurrentChecksHash = registry.fetchCurrentChecksHash;
window.fetchWithHybridAuth = registry.fetchWithHybridAuth;
window.getRawBaseUrl = registry.getRawBaseUrl;

// GitHub API functions
window.fetchWorkflowRuns = github.fetchWorkflowRuns;
window.triggerScorecardWorkflow = github.triggerScorecardWorkflow;
window.triggerBulkScorecardWorkflows = github.triggerBulkScorecardWorkflows;
window.createInstallationPR = github.createInstallationPR;
window.checkGitHubRateLimit = github.checkRateLimit;

// Team statistics functions
window.getTeamName = teamStatistics.getTeamName;
window.getTeamCount = teamStatistics.getTeamCount;
window.getUniqueTeams = teamStatistics.getUniqueTeams;
window.calculateTeamStats = teamStatistics.calculateTeamStats;

// Registry team functions
window.loadTeams = registry.loadTeams;

// Workflow trigger functions
window.triggerServiceWorkflow = workflowTriggers.triggerServiceWorkflow;
window.installService = workflowTriggers.installService;
window.triggerBulkWorkflows = workflowTriggers.triggerBulkWorkflows;
window.handleBulkTrigger = workflowTriggers.handleBulkTrigger;
window.handleBulkTriggerAll = workflowTriggers.handleBulkTriggerAll;

// Application initialization
window.filterAndRenderServices = appInit.filterAndRenderServices;
window.refreshData = appInit.refreshData;

// ============================================================================
// View Tab Navigation
// ============================================================================

/**
 * Switch between Services and Teams views
 */
function switchView(view: ViewType): void {
  if (view !== 'services' && view !== 'teams') {
    return;
  }
  if (view === storeAccessor.getCurrentView()) {
    return;
  }

  storeAccessor.setCurrentView(view);

  // Update tab active states
  document.querySelectorAll('.view-tab').forEach((tab) => {
    const tabEl = tab as HTMLElement;
    tabEl.classList.toggle('active', tabEl.dataset.view === view);
  });

  // Show/hide view containers
  document.querySelectorAll('.view-content').forEach((content) => {
    content.classList.toggle('active', content.id === `${view}-view`);
  });

  // Update URL hash (without triggering hashchange)
  history.replaceState(null, '', `#${view}`);

  // Trigger view-specific initialization
  if (view === 'teams') {
    initTeamsView();
  }
}

/**
 * Initialize teams view - load and render teams
 */
async function initTeamsView(): Promise<void> {
  const grid = document.getElementById('teams-grid');
  if (!grid) {
    return;
  }

  // Show loading state (skip if React is managing the grid)
  if (!window.__REACT_MANAGES_TEAMS_GRID) {
    grid.innerHTML = '<div class="loading">Loading teams...</div>';
  }

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

    // Update teams stats
    updateTeamsStats(allTeams, services);

    // Update Zustand store (for React components)
    storeAccessor.setAllTeams(allTeams);
    storeAccessor.setFilteredTeams(allTeams);

    // Render teams (only if React is not managing)
    if (!window.__REACT_MANAGES_TEAMS_GRID) {
      renderTeamsGrid(allTeams, services);
    }
  } catch (error) {
    console.error('Failed to initialize teams view:', error);
    if (!window.__REACT_MANAGES_TEAMS_GRID) {
      grid.innerHTML = `<div class="error">Failed to load teams: ${error instanceof Error ? error.message : String(error)}</div>`;
    }
  }
}

/**
 * Update teams view statistics
 */
function updateTeamsStats(teams: TeamWithStats[], services: ServiceData[]): void {
  // Total teams
  const totalTeamsEl = document.getElementById('teams-total-teams');
  if (totalTeamsEl) {
    totalTeamsEl.textContent = String(teams.length);
  }

  // Average score across all teams
  const avgScoreEl = document.getElementById('teams-avg-score');
  if (avgScoreEl && teams.length > 0) {
    const avgScore =
      teams.reduce((sum, t) => sum + (t.averageScore || 0), 0) / teams.length;
    avgScoreEl.textContent = String(Math.round(avgScore));
  }

  // Total services
  const totalServicesEl = document.getElementById('teams-total-services');
  if (totalServicesEl) {
    totalServicesEl.textContent = String(services.length);
  }

  // Services without team
  const noTeamCount = services.filter((s) => !teamStatistics.getTeamName(s)).length;
  const noTeamEl = document.getElementById('teams-no-team');
  if (noTeamEl) {
    noTeamEl.textContent = String(noTeamCount);
  }

  // Rank distribution across teams (based on dominant rank)
  let platinumCount = 0,
    goldCount = 0,
    silverCount = 0,
    bronzeCount = 0;
  teams.forEach((team) => {
    const rank = teamStatistics.getRank(team);
    if (rank === 'platinum') {
      platinumCount++;
    } else if (rank === 'gold') {
      goldCount++;
    } else if (rank === 'silver') {
      silverCount++;
    } else if (rank === 'bronze') {
      bronzeCount++;
    }
  });

  const platinumEl = document.getElementById('teams-platinum-count');
  const goldEl = document.getElementById('teams-gold-count');
  const silverEl = document.getElementById('teams-silver-count');
  const bronzeEl = document.getElementById('teams-bronze-count');

  if (platinumEl) {
    platinumEl.textContent = String(platinumCount);
  }
  if (goldEl) {
    goldEl.textContent = String(goldCount);
  }
  if (silverEl) {
    silverEl.textContent = String(silverCount);
  }
  if (bronzeEl) {
    bronzeEl.textContent = String(bronzeCount);
  }
}

/**
 * Render teams grid
 *
 * Note: When React is managing the grid, this function is a no-op.
 * React components use portals to render into the grid element.
 */
function renderTeamsGrid(teams: TeamWithStats[], services: ServiceData[]): void {
  // Skip if React is managing the teams grid
  if (window.__REACT_MANAGES_TEAMS_GRID) {
    return;
  }

  const grid = document.getElementById('teams-grid');
  if (!grid) {
    return;
  }

  if (teams.length === 0) {
    grid.innerHTML = '<div class="team-empty-state">No teams found</div>';
    return;
  }

  // Sort teams
  const sortedTeams = sortTeams([...teams], storeAccessor.getTeamsSort());

  // Filter teams by search
  let filteredTeams = sortedTeams;
  if (storeAccessor.getTeamsSearch()) {
    const query = storeAccessor.getTeamsSearch().toLowerCase();
    filteredTeams = sortedTeams.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
    );
  }

  grid.innerHTML = filteredTeams.map((team) => renderTeamCard(team, services)).join('');
  storeAccessor.setFilteredTeams(filteredTeams);
}

/**
 * Filter and sort teams, then update Zustand store
 * Called by search/sort event handlers
 */
function filterAndSortTeams(): void {
  const teams = storeAccessor.getAllTeams() || [];

  // Sort teams
  const sortedTeams = sortTeams([...teams], storeAccessor.getTeamsSort());

  // Filter teams by search
  let filteredTeams = sortedTeams;
  if (storeAccessor.getTeamsSearch()) {
    const query = storeAccessor.getTeamsSearch().toLowerCase();
    filteredTeams = sortedTeams.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
    );
  }

  // Update window global
  storeAccessor.setFilteredTeams(filteredTeams);

  // Update Zustand store (for React components)
  const store = useAppStore.getState();
  store.setFilteredTeams(filteredTeams);

  // Render vanilla JS grid (no-op if React manages it)
  renderTeamsGrid(storeAccessor.getAllTeams(), storeAccessor.getAllServices());
}

/**
 * Sort teams by selected criteria
 */
function sortTeams(teams: TeamWithStats[], sortBy: string): TeamWithStats[] {
  switch (sortBy) {
  case 'services-desc':
    return teams.sort((a, b) => {
      const diff = (b.serviceCount || 0) - (a.serviceCount || 0);
      return diff !== 0 ? diff : (b.averageScore || 0) - (a.averageScore || 0);
    });
  case 'services-asc':
    return teams.sort((a, b) => {
      const diff = (a.serviceCount || 0) - (b.serviceCount || 0);
      return diff !== 0 ? diff : (b.averageScore || 0) - (a.averageScore || 0);
    });
  case 'score-desc':
    return teams.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
  case 'score-asc':
    return teams.sort((a, b) => (a.averageScore || 0) - (b.averageScore || 0));
  case 'name-asc':
    return teams.sort((a, b) => {
      const diff = a.name.localeCompare(b.name);
      return diff !== 0 ? diff : (b.averageScore || 0) - (a.averageScore || 0);
    });
  case 'name-desc':
    return teams.sort((a, b) => {
      const diff = b.name.localeCompare(a.name);
      return diff !== 0 ? diff : (b.averageScore || 0) - (a.averageScore || 0);
    });
  default:
    return teams;
  }
}

/**
 * Render a single team card
 */
function renderTeamCard(team: TeamWithStats, _services: ServiceData[]): string {
  const dominantRank = teamStatistics.getRank(team);
  const rankDist = team.rankDistribution || {};

  // Build mini rank badges
  const rankBadges = (['platinum', 'gold', 'silver', 'bronze'] as const)
    .filter((r) => rankDist[r] > 0)
    .map((r) => `<span class="mini-rank-badge rank-${r}">${rankDist[r]}</span>`)
    .join('');

  // Calculate installed percentage
  const installedPct =
    (team.serviceCount || 0) > 0
      ? Math.round(((team.installedCount || 0) / (team.serviceCount || 1)) * 100)
      : 0;

  return `
        <div class="team-card rank-${dominantRank}" onclick="showTeamDetail('${formatting.escapeHtml(team.name)}')">
            <div class="team-card-header">
                <h3 class="team-card-name">${formatting.escapeHtml(team.name)}</h3>
                ${team.slack_channel ? `<span class="team-slack">${formatting.escapeHtml(team.slack_channel)}</span>` : ''}
            </div>
            <div class="rank-badge ${dominantRank}">${formatting.capitalize(dominantRank)}</div>
            ${team.description ? `<p class="team-card-description">${formatting.escapeHtml(team.description)}</p>` : ''}
            <div class="team-card-stats">
                <div class="team-stat">
                    <span class="team-stat-value">${Math.round(team.averageScore || 0)}</span>
                    <span class="team-stat-label">Avg Score</span>
                </div>
                <div class="team-stat">
                    <span class="team-stat-value">${team.serviceCount || 0}</span>
                    <span class="team-stat-label">Services</span>
                </div>
                <div class="team-stat">
                    <span class="team-stat-value">${team.installedCount || 0}</span>
                    <span class="team-stat-label">Installed</span>
                </div>
                ${
  (team.staleCount || 0) > 0
    ? `
                <div class="team-stat warning">
                    <span class="team-stat-value">${team.staleCount}</span>
                    <span class="team-stat-label">Stale</span>
                </div>
                `
    : ''
}
            </div>
            <div class="team-card-ranks">${rankBadges || '<span class="mini-rank-badge rank-bronze">0</span>'}</div>
            <div class="team-card-progress">
                <div class="progress-label">
                    <span>Installed</span>
                    <span>${installedPct}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${installedPct}%"></div>
                </div>
            </div>
        </div>
    `;
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

/**
 * Filter and render teams based on active filters
 */
function filterAndRenderTeams(): void {
  let teams = [...storeAccessor.getAllTeams()];

  // Apply rank filters
  storeAccessor.getTeamsActiveFilters().forEach((state, filter) => {
    if (['platinum', 'gold', 'silver', 'bronze'].includes(filter)) {
      if (state === 'include') {
        teams = teams.filter((t) => teamStatistics.getRank(t) === filter);
      } else if (state === 'exclude') {
        teams = teams.filter((t) => teamStatistics.getRank(t) !== filter);
      }
    }
  });

  renderTeamsGrid(teams, storeAccessor.getAllServices());
}

/**
 * Handle URL hash changes for view navigation
 */
function handleHashChange(): void {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'teams' || hash === 'services') {
    switchView(hash);
  }
}

// Export view navigation functions
window.switchView = switchView;
window.initTeamsView = initTeamsView;
window.refreshTeamsView = refreshTeamsView;
window.renderTeamsGrid = renderTeamsGrid;
window.filterAndRenderTeams = filterAndRenderTeams;
window.handleHashChange = handleHashChange;

/**
 * Setup Event Listeners
 * Initializes all DOM event listeners for the application
 * Uses global variables from app.js: searchQuery, activeFilters, currentSort
 */
function setupEventListeners(): void {
  // Search
  const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      storeAccessor.setSearchQuery((e.target as HTMLInputElement).value.toLowerCase());
      window.filterAndRenderServices();
    });
  }

  // Filterable stat cards (multi-select with include/exclude)
  document.querySelectorAll('.stat-card.filterable').forEach((card) => {
    card.addEventListener('click', () => {
      const cardEl = card as HTMLElement;
      const filter = cardEl.dataset.filter;
      if (!filter) {
        return;
      }

      // Cycle through states: null -> include -> exclude -> null
      const currentState = storeAccessor.getActiveFilters().get(filter);

      // Remove existing classes
      cardEl.classList.remove('active', 'exclude');

      if (!currentState) {
        // Null -> Include
        storeAccessor.setFilter(filter, 'include');
        cardEl.classList.add('active');
      } else if (currentState === 'include') {
        // Include -> Exclude
        storeAccessor.setFilter(filter, 'exclude');
        cardEl.classList.add('exclude');
      } else {
        // Exclude -> Null
        storeAccessor.setFilter(filter, null);
      }

      window.filterAndRenderServices();
    });
  });

  // Sort
  const sortSelect = document.getElementById('sort-select') as HTMLSelectElement | null;
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      storeAccessor.setCurrentSort((e.target as HTMLSelectElement).value);
      window.filterAndRenderServices();
    });
  }

  // Modal close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // React modals handle their own escape key events
      // This is kept for any remaining vanilla modals
    }
  });

  // Teams view search
  const teamsSearchInput = document.getElementById(
    'teams-search-input'
  ) as HTMLInputElement | null;
  if (teamsSearchInput) {
    teamsSearchInput.addEventListener('input', (e) => {
      storeAccessor.setTeamsSearch((e.target as HTMLInputElement).value.toLowerCase());
      filterAndSortTeams();
    });
  }

  // Teams view sort
  const teamsSortSelect = document.getElementById(
    'teams-sort-select'
  ) as HTMLSelectElement | null;
  if (teamsSortSelect) {
    teamsSortSelect.addEventListener('change', (e) => {
      storeAccessor.setTeamsSort((e.target as HTMLSelectElement).value);
      filterAndSortTeams();
    });
  }

  // Teams filter stat cards
  document.querySelectorAll('.stat-card.teams-filter').forEach((card) => {
    card.addEventListener('click', () => {
      const cardEl = card as HTMLElement;
      const filter = cardEl.dataset.filter;
      if (!filter) {
        return;
      }

      const currentState = storeAccessor.getTeamsActiveFilters().get(filter);

      cardEl.classList.remove('active', 'exclude');

      if (!currentState) {
        storeAccessor.setTeamsFilter(filter, 'include');
        cardEl.classList.add('active');
      } else if (currentState === 'include') {
        storeAccessor.setTeamsFilter(filter, 'exclude');
        cardEl.classList.add('exclude');
      } else {
        storeAccessor.setTeamsFilter(filter, null);
      }

      filterAndRenderTeams();
    });
  });

  // View tab navigation - handled by React Navigation component if available
  // Keep as fallback for non-React rendered tabs
  if (!window.__REACT_MANAGES_NAVIGATION) {
    document.querySelectorAll('.view-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabEl = tab as HTMLElement;
        const view = tabEl.dataset.view as ViewType | undefined;
        if (view) {
          switchView(view);
        }
      });
    });
  }

  // Handle URL hash on load
  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);

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
  dom,
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
  theme,
  appInit,
};
