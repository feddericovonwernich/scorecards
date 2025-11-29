/**
 * Application Constants
 * Centralized configuration values for the Scorecards application
 */

// API Configuration
export const API_CONFIG = {
    PER_PAGE: 25,
    GITHUB_BASE_URL: 'https://api.github.com',
    ACCEPT_HEADER: 'application/vnd.github.v3+json',
};

// Timing Constants (milliseconds)
export const TIMING = {
    // User feedback durations
    BUTTON_FEEDBACK: 2000,
    TOAST_DURATION: 3000,
    BUTTON_STATE_DURATION: 3000,

    // Animation delays
    ANIMATION_SHORT: 100,
    ANIMATION_MEDIUM: 300,
    ANIMATION_LONG: 500,
    TAB_INIT_DELAY: 100,

    // Polling intervals
    POLLING_ACTIVE: 30000,
    POLLING_IDLE: 60000,
    WORKFLOW_POLL_DEFAULT: 30000,

    // Cache TTL
    CACHE_SHORT: 10000,
    CACHE_MEDIUM: 15000,

    // Workflow specific
    WORKFLOW_RECHECK_DELAY: 5000,
    LIVE_DURATION_UPDATE: 1000,
};

// LocalStorage Keys
export const STORAGE_KEYS = {
    WIDGET_POLL_INTERVAL: 'widget_poll_interval',
    SERVICE_WORKFLOW_POLL_INTERVAL: 'service_workflow_poll_interval',
    THEME: 'scorecards_theme',
};

// Rank Definitions
export const RANKS = ['platinum', 'gold', 'silver', 'bronze'];

// Workflow Status Constants
export const WORKFLOW_STATUS = {
    IN_PROGRESS: 'in_progress',
    QUEUED: 'queued',
    COMPLETED: 'completed',
};

export const WORKFLOW_CONCLUSION = {
    SUCCESS: 'success',
    FAILURE: 'failure',
    CANCELLED: 'cancelled',
};
