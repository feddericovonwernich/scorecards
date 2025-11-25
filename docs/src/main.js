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

// Workflow trigger functions
window.triggerServiceWorkflow = workflowTriggers.triggerServiceWorkflow;
window.installService = workflowTriggers.installService;
window.triggerBulkWorkflows = workflowTriggers.triggerBulkWorkflows;
window.handleBulkTrigger = workflowTriggers.handleBulkTrigger;

// Application initialization
window.filterAndRenderServices = appInit.filterAndRenderServices;
window.refreshData = appInit.refreshData;

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
        }
    });
}

// Export to window for backward compatibility
window.setupEventListeners = setupEventListeners;

// Initialize modal handlers and event listeners for common modals
document.addEventListener('DOMContentLoaded', () => {
    // Setup modal handlers
    const modalIds = ['service-modal', 'settings-modal'];
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
