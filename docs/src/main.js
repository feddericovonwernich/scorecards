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

// API modules
import * as registry from './api/registry.js';
import * as github from './api/github.js';
import * as workflowTriggers from './api/workflow-triggers.js';

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
    // API
    registry,
    github,
    workflowTriggers,
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

// Registry team functions
window.loadTeams = registry.loadTeams;

// Workflow trigger functions
window.triggerServiceWorkflow = workflowTriggers.triggerServiceWorkflow;
window.installService = workflowTriggers.installService;
window.triggerBulkWorkflows = workflowTriggers.triggerBulkWorkflows;
window.handleBulkTrigger = workflowTriggers.handleBulkTrigger;

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
    if (view !== 'services' && view !== 'teams') return;
    if (view === window.currentView) return;

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

    console.log(`Switched to ${view} view`);
}

/**
 * Initialize teams view - load and render teams
 */
async function initTeamsView() {
    const grid = document.getElementById('teams-grid');
    if (!grid) return;

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

        console.log(`Teams view initialized with ${window.allTeams.length} teams`);
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
    if (totalTeamsEl) totalTeamsEl.textContent = teams.length;

    // Average score across all teams
    const avgScoreEl = document.getElementById('teams-avg-score');
    if (avgScoreEl && teams.length > 0) {
        const avgScore = teams.reduce((sum, t) => sum + (t.averageScore || 0), 0) / teams.length;
        avgScoreEl.textContent = Math.round(avgScore);
    }

    // Total services
    const totalServicesEl = document.getElementById('teams-total-services');
    if (totalServicesEl) totalServicesEl.textContent = services.length;

    // Services without team
    const noTeamCount = services.filter(s => !teamStatistics.getTeamName(s)).length;
    const noTeamEl = document.getElementById('teams-no-team');
    if (noTeamEl) noTeamEl.textContent = noTeamCount;

    // Rank distribution across teams (based on dominant rank)
    let platinumCount = 0, goldCount = 0, silverCount = 0, bronzeCount = 0;
    teams.forEach(team => {
        const rank = getDominantRank(team);
        if (rank === 'platinum') platinumCount++;
        else if (rank === 'gold') goldCount++;
        else if (rank === 'silver') silverCount++;
        else if (rank === 'bronze') bronzeCount++;
    });

    const platinumEl = document.getElementById('teams-platinum-count');
    const goldEl = document.getElementById('teams-gold-count');
    const silverEl = document.getElementById('teams-silver-count');
    const bronzeEl = document.getElementById('teams-bronze-count');

    if (platinumEl) platinumEl.textContent = platinumCount;
    if (goldEl) goldEl.textContent = goldCount;
    if (silverEl) silverEl.textContent = silverCount;
    if (bronzeEl) bronzeEl.textContent = bronzeCount;
}

/**
 * Get dominant rank for a team based on majority of services
 */
function getDominantRank(team) {
    if (!team.rankDistribution) return 'bronze';
    const dist = team.rankDistribution;
    const max = Math.max(dist.platinum || 0, dist.gold || 0, dist.silver || 0, dist.bronze || 0);
    if (max === 0) return 'bronze';
    if ((dist.platinum || 0) === max) return 'platinum';
    if ((dist.gold || 0) === max) return 'gold';
    if ((dist.silver || 0) === max) return 'silver';
    return 'bronze';
}

/**
 * Render teams grid
 */
function renderTeamsGrid(teams, services) {
    const grid = document.getElementById('teams-grid');
    if (!grid) return;

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
            return teams.sort((a, b) => b.serviceCount - a.serviceCount);
        case 'services-asc':
            return teams.sort((a, b) => a.serviceCount - b.serviceCount);
        case 'score-desc':
            return teams.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
        case 'score-asc':
            return teams.sort((a, b) => (a.averageScore || 0) - (b.averageScore || 0));
        case 'name-asc':
            return teams.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
            return teams.sort((a, b) => b.name.localeCompare(a.name));
        default:
            return teams;
    }
}

/**
 * Render a single team card
 */
function renderTeamCard(team, services) {
    const dominantRank = getDominantRank(team);
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
                teams = teams.filter(t => getDominantRank(t) === filter);
            } else if (state === 'exclude') {
                teams = teams.filter(t => getDominantRank(t) !== filter);
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

/**
 * Show team detail modal
 */
function showTeamDetail(teamName) {
    const team = window.allTeams.find(t => t.name === teamName);
    if (!team) {
        console.error('Team not found:', teamName);
        return;
    }

    // Get services for this team
    const teamServices = (window.allServices || []).filter(s =>
        teamStatistics.getTeamName(s) === team.name
    );

    const modal = document.getElementById('team-modal');
    const content = document.getElementById('team-detail');

    if (!modal || !content) return;

    const dominantRank = getDominantRank(team);
    const rankDist = team.rankDistribution || {};

    // Build rank distribution bars
    const rankBars = ['platinum', 'gold', 'silver', 'bronze'].map(rank => {
        const count = rankDist[rank] || 0;
        const pct = team.serviceCount > 0 ? Math.round((count / team.serviceCount) * 100) : 0;
        return `
            <div class="rank-dist-row">
                <span class="rank-dist-label">${formatting.capitalize(rank)}</span>
                <div class="rank-dist-bar-container">
                    <div class="rank-dist-bar rank-${rank}" style="width: ${pct}%"></div>
                </div>
                <span class="rank-dist-count">${count}</span>
            </div>
        `;
    }).join('');

    // Build services list
    const servicesList = teamServices.map(s => {
        const score = s.score;
        const rank = s.rank;
        const scoreDisplay = score != null ? Math.round(score) : '-';
        const rankClass = rank ? `rank-${rank}` : '';
        return `
            <div class="team-service-item" onclick="window.showServiceDetail('${s.org}', '${s.repo}')">
                <span class="service-name">${formatting.escapeHtml(s.repo)}</span>
                <span class="service-score ${rankClass}">${scoreDisplay}</span>
            </div>
        `;
    }).join('');

    content.innerHTML = `
        <div class="rank-badge modal-header-badge ${dominantRank}">${formatting.capitalize(dominantRank)}</div>
        <h2>${formatting.escapeHtml(team.name)} <button class="edit-icon-btn" onclick="openTeamEditModal('${formatting.escapeHtml(team.name)}')" title="Edit Team"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 00-.064.108l-.558 1.953 1.953-.558a.253.253 0 00.108-.064l6.286-6.286zm1.238-3.763a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086z"></path></svg></button></h2>
        ${team.description ? `<p class="tab-section-description">${formatting.escapeHtml(team.description)}</p>` : ''}

        <div class="team-modal-stats">
            <div class="team-modal-stat">
                <span class="stat-value">${Math.round(team.averageScore || 0)}</span>
                <span class="stat-label">Average Score</span>
            </div>
            <div class="team-modal-stat">
                <span class="stat-value">${team.serviceCount}</span>
                <span class="stat-label">Services</span>
            </div>
            <div class="team-modal-stat">
                <span class="stat-value">${team.installedCount}</span>
                <span class="stat-label">Installed</span>
            </div>
            <div class="team-modal-stat ${team.staleCount > 0 ? 'warning' : ''}">
                <span class="stat-value">${team.staleCount || 0}</span>
                <span class="stat-label">Stale</span>
            </div>
        </div>

        ${team.slack_channel || team.oncall_rotation ? `
        <div class="team-modal-contact">
            ${team.slack_channel ? `<span class="contact-item"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5.2 8.4a1.2 1.2 0 102.4 0 1.2 1.2 0 00-2.4 0zm6 0a1.2 1.2 0 102.4 0 1.2 1.2 0 00-2.4 0z"/></svg> ${formatting.escapeHtml(team.slack_channel)}</span>` : ''}
            ${team.oncall_rotation ? `<span class="contact-item"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.75.75 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"/></svg> ${formatting.escapeHtml(team.oncall_rotation)}</span>` : ''}
        </div>
        ` : ''}

        <div class="tabs">
            <button class="tab-btn active" data-tab="services" onclick="switchTeamModalTab('services')">Services</button>
            <button class="tab-btn" data-tab="distribution" onclick="switchTeamModalTab('distribution')">Distribution</button>
        </div>

        <div class="team-tab-content tab-content active" id="team-tab-services">
            <div class="team-services-list">
                ${servicesList || '<div class="empty-state">No services in this team</div>'}
            </div>
        </div>

        <div class="team-tab-content tab-content" id="team-tab-distribution">
            <div class="rank-distribution-detail">
                ${rankBars}
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

/**
 * Switch tabs within the team modal
 */
function switchTeamModalTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('#team-modal .tab-btn').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('#team-modal .team-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `team-tab-${tabName}`);
    });
}

/**
 * Close team detail modal
 */
function closeTeamModal() {
    const modal = document.getElementById('team-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Export view navigation functions
window.switchView = switchView;
window.initTeamsView = initTeamsView;
window.refreshTeamsView = refreshTeamsView;
window.renderTeamsGrid = renderTeamsGrid;
window.showTeamDetail = showTeamDetail;
window.closeTeamModal = closeTeamModal;
window.switchTeamModalTab = switchTeamModalTab;
window.filterAndRenderTeams = filterAndRenderTeams;
window.handleHashChange = handleHashChange;

// Log initialization
console.log('✓ ES6 Modules loaded successfully');
console.log('Available modules:', Object.keys(window.ScorecardModules));

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

    console.log('✓ Modal handlers and event listeners initialized');
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
    // API
    registry,
    github,
    workflowTriggers,
    // Services
    auth,
    staleness,
    theme,
    appInit
};
