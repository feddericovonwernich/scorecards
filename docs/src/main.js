/**
 * Main Application Entry Point
 * Imports all ES6 modules and initializes the application
 */

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

// Export modules to window for backward compatibility with app.js
// This allows the existing app.js to use the modular functions
window.ScorecardModules = {
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
    appInit
};

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

// Toast notifications
window.showToast = toast.showToast;

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
window.startServiceLiveDurationUpdates = serviceWorkflows.startServiceLiveDurationUpdates;

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
 * @param {string} view - 'services' | 'teams'
 */
function switchView(view) {
    if (view !== 'services' && view !== 'teams') {return;}
    if (view === window.currentView) {return;}

    window.currentView = view;

    // Update tab active states
    document.querySelectorAll('.view-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === view);
    });

    // Show/hide view containers
    document.querySelectorAll('.view-content').forEach(content => {
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
async function initTeamsView() {
    const grid = document.getElementById('teams-grid');
    if (!grid) {return;}

    // Show loading state
    grid.innerHTML = '<div class="loading">Loading teams...</div>';

    try {
        // Load teams data (services should already be loaded)
        const services = window.allServices || [];

        // Calculate team data from services
        const teamData = teamStatistics.calculateTeamStats(services);
        window.allTeams = Object.values(teamData);

        // Update teams stats
        updateTeamsStats(window.allTeams, services);

        // Render teams
        renderTeamsGrid(window.allTeams, services);
    } catch (error) {
        console.error('Failed to initialize teams view:', error);
        grid.innerHTML = `<div class="error">Failed to load teams: ${error.message}</div>`;
    }
}

/**
 * Update teams view statistics
 */
function updateTeamsStats(teams, services) {
    // Total teams
    const totalTeamsEl = document.getElementById('teams-total-teams');
    if (totalTeamsEl) {totalTeamsEl.textContent = teams.length;}

    // Average score across all teams
    const avgScoreEl = document.getElementById('teams-avg-score');
    if (avgScoreEl && teams.length > 0) {
        const avgScore = teams.reduce((sum, t) => sum + (t.averageScore || 0), 0) / teams.length;
        avgScoreEl.textContent = Math.round(avgScore);
    }

    // Total services
    const totalServicesEl = document.getElementById('teams-total-services');
    if (totalServicesEl) {totalServicesEl.textContent = services.length;}

    // Services without team
    const noTeamCount = services.filter(s => !teamStatistics.getTeamName(s)).length;
    const noTeamEl = document.getElementById('teams-no-team');
    if (noTeamEl) {noTeamEl.textContent = noTeamCount;}

    // Rank distribution across teams (based on dominant rank)
    let platinumCount = 0, goldCount = 0, silverCount = 0, bronzeCount = 0;
    teams.forEach(team => {
        const rank = teamStatistics.getRank(team);
        if (rank === 'platinum') {platinumCount++;}
        else if (rank === 'gold') {goldCount++;}
        else if (rank === 'silver') {silverCount++;}
        else if (rank === 'bronze') {bronzeCount++;}
    });

    const platinumEl = document.getElementById('teams-platinum-count');
    const goldEl = document.getElementById('teams-gold-count');
    const silverEl = document.getElementById('teams-silver-count');
    const bronzeEl = document.getElementById('teams-bronze-count');

    if (platinumEl) {platinumEl.textContent = platinumCount;}
    if (goldEl) {goldEl.textContent = goldCount;}
    if (silverEl) {silverEl.textContent = silverCount;}
    if (bronzeEl) {bronzeEl.textContent = bronzeCount;}
}

/**
 * Render teams grid
 */
function renderTeamsGrid(teams, services) {
    const grid = document.getElementById('teams-grid');
    if (!grid) {return;}

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
        filteredTeams = sortedTeams.filter(t =>
            t.name.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query))
        );
    }

    grid.innerHTML = filteredTeams.map(team => renderTeamCard(team, services)).join('');
    window.filteredTeams = filteredTeams;
}

/**
 * Sort teams by selected criteria
 */
function sortTeams(teams, sortBy) {
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
function renderTeamCard(team, _services) {
    const dominantRank = teamStatistics.getRank(team);
    const rankDist = team.rankDistribution || {};

    // Build mini rank badges
    const rankBadges = ['platinum', 'gold', 'silver', 'bronze']
        .filter(r => rankDist[r] > 0)
        .map(r => `<span class="mini-rank-badge rank-${r}">${rankDist[r]}</span>`)
        .join('');

    // Calculate installed percentage
    const installedPct = team.serviceCount > 0
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
                ${team.staleCount > 0 ? `
                <div class="team-stat warning">
                    <span class="team-stat-value">${team.staleCount}</span>
                    <span class="team-stat-label">Stale</span>
                </div>
                ` : ''}
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
async function refreshTeamsView() {
    // First refresh the services data
    await appInit.refreshData();
    // Then re-initialize teams view
    await initTeamsView();
}

/**
 * Filter and render teams based on active filters
 */
function filterAndRenderTeams() {
    let teams = [...window.allTeams];

    // Apply rank filters
    window.teamsActiveFilters.forEach((state, filter) => {
        if (['platinum', 'gold', 'silver', 'bronze'].includes(filter)) {
            if (state === 'include') {
                teams = teams.filter(t => teamStatistics.getRank(t) === filter);
            } else if (state === 'exclude') {
                teams = teams.filter(t => teamStatistics.getRank(t) !== filter);
            }
        }
    });

    renderTeamsGrid(teams, window.allServices);
}

/**
 * Handle URL hash changes for view navigation
 */
function handleHashChange() {
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
 * @param {string} theme - 'dark' or 'light'
 */
function updateThemeIcon(theme) {
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    if (sunIcon && moonIcon) {
        if (theme === 'dark') {
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
 * @returns {void}
 */
function setupEventListeners() {
    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
        window.searchQuery = e.target.value.toLowerCase();
        window.filterAndRenderServices();
    });

    // Filterable stat cards (multi-select with include/exclude)
    document.querySelectorAll('.stat-card.filterable').forEach(card => {
        card.addEventListener('click', () => {
            const filter = card.dataset.filter;

            // Cycle through states: null -> include -> exclude -> null
            const currentState = window.activeFilters.get(filter);

            // Remove existing classes
            card.classList.remove('active', 'exclude');

            if (!currentState) {
                // Null -> Include
                window.activeFilters.set(filter, 'include');
                card.classList.add('active');
            } else if (currentState === 'include') {
                // Include -> Exclude
                window.activeFilters.set(filter, 'exclude');
                card.classList.add('exclude');
            } else {
                // Exclude -> Null
                window.activeFilters.delete(filter);
            }

            window.filterAndRenderServices();
        });
    });

    // Sort
    document.getElementById('sort-select').addEventListener('change', (e) => {
        window.currentSort = e.target.value;
        window.filterAndRenderServices();
    });

    // Theme toggle
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const newTheme = window.toggleTheme();
            updateThemeIcon(newTheme);
        });
    }

    // Modal close
    document.querySelector('.modal-close').addEventListener('click', window.closeModal);
    document.getElementById('service-modal').addEventListener('click', (e) => {
        if (e.target.id === 'service-modal') {
            window.closeModal();
        }
    });

    // Modal close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('service-modal');
            if (modal && !modal.classList.contains('hidden')) {
                window.closeModal();
            }
            const teamModal = document.getElementById('team-modal');
            if (teamModal && !teamModal.classList.contains('hidden')) {
                window.closeTeamModal();
            }
        }
    });

    // Teams view search
    const teamsSearchInput = document.getElementById('teams-search-input');
    if (teamsSearchInput) {
        teamsSearchInput.addEventListener('input', (e) => {
            window.teamsSearchQuery = e.target.value.toLowerCase();
            renderTeamsGrid(window.allTeams, window.allServices);
        });
    }

    // Teams view sort
    const teamsSortSelect = document.getElementById('teams-sort-select');
    if (teamsSortSelect) {
        teamsSortSelect.addEventListener('change', (e) => {
            window.teamsSort = e.target.value;
            renderTeamsGrid(window.allTeams, window.allServices);
        });
    }

    // Teams filter stat cards
    document.querySelectorAll('.stat-card.teams-filter').forEach(card => {
        card.addEventListener('click', () => {
            const filter = card.dataset.filter;
            const currentState = window.teamsActiveFilters.get(filter);

            card.classList.remove('active', 'exclude');

            if (!currentState) {
                window.teamsActiveFilters.set(filter, 'include');
                card.classList.add('active');
            } else if (currentState === 'include') {
                window.teamsActiveFilters.set(filter, 'exclude');
                card.classList.add('exclude');
            } else {
                window.teamsActiveFilters.delete(filter);
            }

            filterAndRenderTeams();
        });
    });

    // View tab navigation
    document.querySelectorAll('.view-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.dataset.view;
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
    modalIds.forEach(id => {
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
    appInit
};
