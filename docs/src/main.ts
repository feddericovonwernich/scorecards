/**
 * Main Application Entry Point
 * Imports all ES6 modules and initializes the application
 */

import type { ServiceData, ViewType, TeamRegistryEntry } from './types/index.js';

// Base statistics interface that covers both TeamStatistics and TeamStatsEntry
interface TeamStatsBase {
  serviceCount: number;
  averageScore: number;
  installedCount: number;
  staleCount: number;
  rankDistribution: Record<string, number>;
  name?: string;
  github_org?: string | null;
  github_slug?: string | null;
}

// Local type definition matching the one in globals.d.ts for window.allTeams
// This is needed because the globals.d.ts definition is inside declare global {}
interface TeamWithStats {
  id?: string;
  name: string;
  description?: string;
  slug?: string;
  github_org?: string;
  github_slug?: string;
  serviceCount?: number;
  averageScore?: number;
  installedCount?: number;
  staleCount?: number;
  rankDistribution?: Record<string, number>;
  slack_channel?: string | null;
  metadata?: {
    slack_channel?: string;
  };
  statistics?: TeamStatsBase;
}

// React components entry point
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

// UI modules
import * as toast from './ui/toast.js';
import * as modals from './ui/modals.js';
import * as filters from './ui/filters.js';
import * as workflowRun from './ui/workflow-run.js';
import * as serviceCard from './ui/service-card.js';
import * as serviceModal from './ui/service-modal.js';
import * as serviceWorkflows from './ui/service-workflows.js';
import * as actionsWidget from './ui/actions-widget.js';
import * as settings from './ui/settings.js';
import * as stats from './ui/stats.js';
import * as buttonStates from './ui/button-states.js';
import * as teamFilter from './ui/team-filter.js';
import * as teamDashboard from './ui/team-dashboard.js';
import * as teamEditModal from './ui/team-edit-modal.js';
import * as teamModal from './ui/team-modal.js';
import * as checkFilter from './ui/check-filter.js';
import * as checkAdoptionDashboard from './ui/check-adoption-dashboard.js';

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

// Window types are defined in types/globals.d.ts

// ============================================================================
// Initialize Global State (previously in app.js)
// These window properties must be initialized before any other code runs
// ============================================================================
window.allServices = [];
window.filteredServices = [];
window.activeFilters = new Map();
window.currentSort = 'score-desc';
window.searchQuery = '';
window.currentChecksHash = null;
window.checksHashTimestamp = 0;
window.currentView = 'services';
window.allTeams = [];
window.filteredTeams = [];
window.teamsSort = 'score-desc';
window.teamsSearchQuery = '';
window.teamsActiveFilters = new Map();
window.githubPAT = null;
window.currentServiceOrg = null;
window.currentServiceRepo = null;
window.serviceWorkflowRuns = [];
window.serviceWorkflowFilterStatus = 'all';
window.serviceWorkflowPollInterval = null;
window.serviceWorkflowPollIntervalTime = 30000;
window.serviceWorkflowLoaded = false;
window.serviceDurationUpdateInterval = null;

// Export modules to window for backward compatibility with app.js
// This allows the existing app.js to use the modular functions
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
  // UI
  toast,
  modals,
  filters,
  workflowRun,
  serviceCard,
  serviceModal,
  serviceWorkflows,
  actionsWidget,
  settings,
  stats,
  buttonStates,
  teamFilter,
  teamDashboard,
  teamEditModal,
  teamModal,
  checkFilter,
  checkAdoptionDashboard,
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
// (This bridges the gap between ES6 modules and the existing app.js)

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

// Toast notifications - handled by React components (see components/index.tsx)
// window.showToast is set by the React Toast component

// Modal management
window.showModal = modals.showModal;
window.hideModal = modals.hideModal;
window.closeAllModals = modals.closeAllModals;
window.showConfirmation = modals.showConfirmation;

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

// Filter functions
window.filterServices = filters.filterServices;
window.sortServices = filters.sortServices;
window.filterAndSort = filters.filterAndSort;
window.getFilterStats = filters.getFilterStats;

// Workflow run rendering functions
window.renderWorkflowRun = workflowRun.renderWorkflowRun;
window.getStatusIcon = workflowRun.getStatusIcon;
window.calculateDuration = workflowRun.calculateDuration;

// Service card rendering functions
window.renderServices = serviceCard.renderServices;

// Service modal functions
window.showServiceDetail = serviceModal.showServiceDetail;
window.refreshServiceData = serviceModal.refreshServiceData;
window.closeModal = serviceModal.closeModal;
window.switchTab = serviceModal.switchTab;
window.scrollTabs = serviceModal.scrollTabs;

// Service workflows functions
window.loadWorkflowRunsForService = serviceWorkflows.loadWorkflowRunsForService;
window.startServiceWorkflowPolling = serviceWorkflows.startServiceWorkflowPolling;
window.changeServicePollingInterval = serviceWorkflows.changeServicePollingInterval;
window.refreshServiceWorkflowRuns = serviceWorkflows.refreshServiceWorkflowRuns;
window.renderServiceWorkflowRuns = serviceWorkflows.renderServiceWorkflowRuns;
window.updateServiceFilterCounts = serviceWorkflows.updateServiceFilterCounts;
window.filterServiceWorkflows = serviceWorkflows.filterServiceWorkflows;
window.startServiceLiveDurationUpdates =
  serviceWorkflows.startServiceLiveDurationUpdates;

// Actions widget functions
window.initializeActionsWidget = actionsWidget.initializeActionsWidget;
window.toggleActionsWidget = actionsWidget.toggleActionsWidget;
window.startWidgetPolling = actionsWidget.startWidgetPolling;
window.stopWidgetPolling = actionsWidget.stopWidgetPolling;
window.fetchWorkflowRuns = actionsWidget.fetchWorkflowRuns;
window.updateWidgetBadge = actionsWidget.updateWidgetBadge;
window.renderWidgetContent = actionsWidget.renderWidgetContent;
window.filterActions = actionsWidget.filterActions;
window.refreshActionsWidget = actionsWidget.refreshActionsWidget;
window.changePollingInterval = actionsWidget.changePollingInterval;
window.handlePATSaved = actionsWidget.handlePATSaved;
window.handlePATCleared = actionsWidget.handlePATCleared;

// Settings functions
window.openSettings = settings.openSettings;
window.closeSettings = settings.closeSettings;
window.testPAT = settings.testPAT;
window.savePAT = settings.savePAT;
window.clearPAT = settings.clearPAT;
window.updateWidgetState = settings.updateWidgetState;
window.updateModeIndicator = settings.updateModeIndicator;
window.checkRateLimit = settings.checkRateLimit;

// Stats functions
window.updateStats = stats.updateStats;

// Team statistics functions
window.getTeamName = teamStatistics.getTeamName;
window.getTeamCount = teamStatistics.getTeamCount;
window.getUniqueTeams = teamStatistics.getUniqueTeams;
window.calculateTeamStats = teamStatistics.calculateTeamStats;

// Team filter functions
window.initTeamFilter = teamFilter.initTeamFilter;
window.updateTeamFilter = teamFilter.updateTeamFilter;
window.filterByTeam = teamFilter.filterByTeam;
window.selectTeam = teamFilter.selectTeam;
window.clearTeamFilter = teamFilter.clearTeamFilter;

// Team dashboard functions
window.initTeamDashboard = teamDashboard.initTeamDashboard;
window.openTeamDashboard = teamDashboard.openTeamDashboard;
window.closeTeamDashboard = teamDashboard.closeTeamDashboard;
window.updateDashboardServices = teamDashboard.updateDashboardServices;

// Team edit modal functions
window.initTeamEditModal = teamEditModal.initTeamEditModal;
window.openTeamEditModal = teamEditModal.openTeamEditModal;
window.openCreateTeamModal = teamEditModal.openCreateTeamModal;
window.closeTeamEditModal = teamEditModal.closeTeamEditModal;

// Check filter functions
window.initCheckFilter = checkFilter.initCheckFilter;
window.updateCheckFilter = checkFilter.updateCheckFilter;
window.filterByChecks = checkFilter.filterByChecks;
window.getCheckFilterState = checkFilter.getCheckFilterState;
window.setCheckFilterState = checkFilter.setCheckFilterState;
window.getActiveFilterCount = checkFilter.getActiveFilterCount;
window.setServicesForStats = checkFilter.setServicesForStats;
window.openCheckFilterModal = checkFilter.openCheckFilterModal;
window.closeCheckFilterModal = checkFilter.closeCheckFilterModal;

// Check adoption dashboard functions
window.initCheckAdoptionDashboard = checkAdoptionDashboard.initCheckAdoptionDashboard;
window.openCheckAdoptionDashboard = checkAdoptionDashboard.openCheckAdoptionDashboard;
window.closeCheckAdoptionDashboard = checkAdoptionDashboard.closeCheckAdoptionDashboard;

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
  if (view === window.currentView) {
    return;
  }

  window.currentView = view;

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
    const services = window.allServices || [];

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
      teamData = teamStatistics.mergeTeamDataWithStats(teamsData, calculatedStats);
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
    window.allTeams = Object.values(teamData).map((t) => ({
      ...t,
      ...(t.statistics || {}),
      // Flatten metadata for slack_channel access
      slack_channel: t.metadata?.slack_channel || null,
    })) as TeamWithStats[];

    // Update teams stats
    updateTeamsStats(window.allTeams, services);

    // Render teams
    renderTeamsGrid(window.allTeams, services);
  } catch (error) {
    console.error('Failed to initialize teams view:', error);
    grid.innerHTML = `<div class="error">Failed to load teams: ${error instanceof Error ? error.message : String(error)}</div>`;
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
  const sortedTeams = sortTeams([...teams], window.teamsSort);

  // Filter teams by search
  let filteredTeams = sortedTeams;
  if (window.teamsSearchQuery) {
    const query = window.teamsSearchQuery.toLowerCase();
    filteredTeams = sortedTeams.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
    );
  }

  grid.innerHTML = filteredTeams.map((team) => renderTeamCard(team, services)).join('');
  window.filteredTeams = filteredTeams;
}

/**
 * Sort teams by selected criteria
 */
function sortTeams(teams: TeamWithStats[], sortBy: string): TeamWithStats[] {
  switch (sortBy) {
  case 'services-desc':
    return teams.sort((a, b) => {
      const diff = b.serviceCount - a.serviceCount;
      return diff !== 0 ? diff : (b.averageScore || 0) - (a.averageScore || 0);
    });
  case 'services-asc':
    return teams.sort((a, b) => {
      const diff = a.serviceCount - b.serviceCount;
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
    team.serviceCount > 0
      ? Math.round((team.installedCount / team.serviceCount) * 100)
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
                    <span class="team-stat-value">${team.serviceCount}</span>
                    <span class="team-stat-label">Services</span>
                </div>
                <div class="team-stat">
                    <span class="team-stat-value">${team.installedCount}</span>
                    <span class="team-stat-label">Installed</span>
                </div>
                ${
  team.staleCount > 0
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
  let teams = [...window.allTeams];

  // Apply rank filters
  window.teamsActiveFilters.forEach((state, filter) => {
    if (['platinum', 'gold', 'silver', 'bronze'].includes(filter)) {
      if (state === 'include') {
        teams = teams.filter((t) => teamStatistics.getRank(t) === filter);
      } else if (state === 'exclude') {
        teams = teams.filter((t) => teamStatistics.getRank(t) !== filter);
      }
    }
  });

  renderTeamsGrid(teams, window.allServices);
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
 * Update theme toggle button icon
 */
function updateThemeIcon(themeValue: string): void {
  const sunIcon = document.getElementById('theme-icon-sun');
  const moonIcon = document.getElementById('theme-icon-moon');
  if (sunIcon && moonIcon) {
    if (themeValue === 'dark') {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  }
}

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
      window.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
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
      const currentState = window.activeFilters.get(filter);

      // Remove existing classes
      cardEl.classList.remove('active', 'exclude');

      if (!currentState) {
        // Null -> Include
        window.activeFilters.set(filter, 'include');
        cardEl.classList.add('active');
      } else if (currentState === 'include') {
        // Include -> Exclude
        window.activeFilters.set(filter, 'exclude');
        cardEl.classList.add('exclude');
      } else {
        // Exclude -> Null
        window.activeFilters.delete(filter);
      }

      window.filterAndRenderServices();
    });
  });

  // Sort
  const sortSelect = document.getElementById('sort-select') as HTMLSelectElement | null;
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      window.currentSort = (e.target as HTMLSelectElement).value;
      window.filterAndRenderServices();
    });
  }

  // Theme toggle
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const newTheme = window.toggleTheme();
      updateThemeIcon(newTheme);
    });
  }

  // Modal close
  const modalClose = document.querySelector('.modal-close');
  if (modalClose) {
    modalClose.addEventListener('click', window.closeModal);
  }

  const serviceModal = document.getElementById('service-modal');
  if (serviceModal) {
    serviceModal.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id === 'service-modal') {
        window.closeModal();
      }
    });
  }

  // Modal close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('service-modal');
      if (modal && !modal.classList.contains('hidden')) {
        window.closeModal();
      }
      const teamModalEl = document.getElementById('team-modal');
      if (teamModalEl && !teamModalEl.classList.contains('hidden')) {
        window.closeTeamModal();
      }
    }
  });

  // Teams view search
  const teamsSearchInput = document.getElementById(
    'teams-search-input'
  ) as HTMLInputElement | null;
  if (teamsSearchInput) {
    teamsSearchInput.addEventListener('input', (e) => {
      window.teamsSearchQuery = (e.target as HTMLInputElement).value.toLowerCase();
      renderTeamsGrid(window.allTeams, window.allServices);
    });
  }

  // Teams view sort
  const teamsSortSelect = document.getElementById(
    'teams-sort-select'
  ) as HTMLSelectElement | null;
  if (teamsSortSelect) {
    teamsSortSelect.addEventListener('change', (e) => {
      window.teamsSort = (e.target as HTMLSelectElement).value;
      renderTeamsGrid(window.allTeams, window.allServices);
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

      const currentState = window.teamsActiveFilters.get(filter);

      cardEl.classList.remove('active', 'exclude');

      if (!currentState) {
        window.teamsActiveFilters.set(filter, 'include');
        cardEl.classList.add('active');
      } else if (currentState === 'include') {
        window.teamsActiveFilters.set(filter, 'exclude');
        cardEl.classList.add('exclude');
      } else {
        window.teamsActiveFilters.delete(filter);
      }

      filterAndRenderTeams();
    });
  });

  // View tab navigation
  document.querySelectorAll('.view-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabEl = tab as HTMLElement;
      const view = tabEl.dataset.view as ViewType | undefined;
      if (view) {
        switchView(view);
      }
    });
  });

  // Handle URL hash on load
  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);
}

// Export to window for backward compatibility
window.setupEventListeners = setupEventListeners;

// Initialize modal handlers and event listeners for common modals
document.addEventListener('DOMContentLoaded', () => {
  // Setup modal handlers
  const modalIds = ['service-modal', 'settings-modal', 'team-dashboard-modal'];
  modalIds.forEach((id) => {
    if (document.getElementById(id)) {
      modals.setupModalHandlers(id);
    }
  });

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
  // UI
  toast,
  modals,
  filters,
  workflowRun,
  serviceCard,
  serviceModal,
  serviceWorkflows,
  actionsWidget,
  settings,
  stats,
  buttonStates,
  teamFilter,
  teamDashboard,
  teamEditModal,
  teamModal,
  checkFilter,
  checkAdoptionDashboard,
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
