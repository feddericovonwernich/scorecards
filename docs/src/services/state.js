/**
 * Centralized state management
 * Replaces scattered window.* globals
 * @module services/state
 */

/**
 * @typedef {Object} ServiceData
 * @property {string} org
 * @property {string} repo
 * @property {number} [score]
 * @property {string} [tier]
 */

/**
 * @typedef {Object} TeamData
 * @property {string} name
 * @property {ServiceData[]} services
 */

/**
 * @typedef {Object} ServicesState
 * @property {ServiceData[]} all
 * @property {ServiceData[]} filtered
 * @property {boolean} loading
 */

/**
 * @typedef {Object} TeamsState
 * @property {TeamData[]} all
 * @property {TeamData[]} filtered
 * @property {string} sort
 * @property {string} search
 * @property {Map<string, string>} activeFilters
 */

/**
 * @typedef {Object} FiltersState
 * @property {Map<string, string>} active
 * @property {string} search
 * @property {string} sort
 */

/**
 * @typedef {Object} AuthState
 * @property {string|null} pat
 * @property {boolean} validated
 */

/**
 * @typedef {Object} UIState
 * @property {string|null} currentModal
 * @property {string|null} checksHash
 * @property {number} checksHashTimestamp
 * @property {string} currentView
 */

/**
 * @typedef {Object} ServiceModalState
 * @property {string|null} org
 * @property {string|null} repo
 * @property {Array} workflowRuns
 * @property {string} filterStatus
 * @property {number|null} pollInterval
 * @property {number} pollIntervalTime
 * @property {boolean} loaded
 * @property {number|null} durationUpdateInterval
 */

/**
 * @typedef {Object} AppState
 * @property {ServicesState} services
 * @property {TeamsState} teams
 * @property {FiltersState} filters
 * @property {AuthState} auth
 * @property {UIState} ui
 * @property {ServiceModalState} serviceModal
 */

/** @type {Map<string, Set<Function>>} */
const listeners = new Map();

/** @type {AppState} */
const state = {
    services: {
        all: [],
        filtered: [],
        loading: false
    },
    teams: {
        all: [],
        filtered: [],
        sort: 'score-desc',
        search: '',
        activeFilters: new Map()
    },
    filters: {
        active: new Map(),
        search: '',
        sort: 'score-desc'
    },
    auth: {
        pat: null,
        validated: false
    },
    ui: {
        currentModal: null,
        checksHash: null,
        checksHashTimestamp: 0,
        currentView: 'services'
    },
    serviceModal: {
        org: null,
        repo: null,
        workflowRuns: [],
        filterStatus: 'all',
        pollInterval: null,
        pollIntervalTime: 30000,
        loaded: false,
        durationUpdateInterval: null
    }
};

/**
 * Get current state (shallow copy)
 * @returns {AppState}
 */
export function getState() {
    return { ...state };
}

/**
 * Get specific state slice
 * @template {keyof AppState} K
 * @param {K} key
 * @returns {AppState[K]}
 */
export function getStateSlice(key) {
    return state[key];
}

/**
 * Update state and notify listeners
 * @param {Partial<AppState>} updates
 */
export function setState(updates) {
    const changedKeys = [];

    for (const [key, value] of Object.entries(updates)) {
        if (state[key] !== value) {
            state[key] = value;
            changedKeys.push(key);
        }
    }

    changedKeys.forEach(key => notifyListeners(key));
}

/**
 * Subscribe to state changes
 * @param {string} key - State key to watch
 * @param {Function} callback - Called on change
 * @returns {Function} Unsubscribe function
 */
export function subscribe(key, callback) {
    if (!listeners.has(key)) {
        listeners.set(key, new Set());
    }
    listeners.get(key).add(callback);

    return () => {
        listeners.get(key)?.delete(callback);
    };
}

/**
 * Notify listeners for a key
 * @param {string} key
 */
function notifyListeners(key) {
    listeners.get(key)?.forEach(callback => {
        try {
            callback(state[key]);
        } catch (error) {
            console.error(`State listener error for ${key}:`, error);
        }
    });
}

// ============= Convenience Methods =============

/**
 * Set all services
 * @param {ServiceData[]} services
 */
export function setServices(services) {
    setState({
        services: { ...state.services, all: services }
    });
}

/**
 * Set filtered services
 * @param {ServiceData[]} services
 */
export function setFilteredServices(services) {
    setState({
        services: { ...state.services, filtered: services }
    });
}

/**
 * Set services loading state
 * @param {boolean} loading
 */
export function setServicesLoading(loading) {
    setState({
        services: { ...state.services, loading }
    });
}

/**
 * Set all teams
 * @param {TeamData[]} teams
 */
export function setTeams(teams) {
    setState({
        teams: { ...state.teams, all: teams }
    });
}

/**
 * Set filtered teams
 * @param {TeamData[]} teams
 */
export function setFilteredTeams(teams) {
    setState({
        teams: { ...state.teams, filtered: teams }
    });
}

/**
 * Set GitHub PAT
 * @param {string|null} pat
 * @param {boolean} [validated=false]
 */
export function setAuth(pat, validated = false) {
    setState({
        auth: { pat, validated }
    });
}

/**
 * Set current view (services or teams)
 * @param {string} view
 */
export function setCurrentView(view) {
    setState({
        ui: { ...state.ui, currentView: view }
    });
}

/**
 * Set checks hash for staleness detection
 * @param {string|null} hash
 */
export function setChecksHash(hash) {
    setState({
        ui: { ...state.ui, checksHash: hash, checksHashTimestamp: Date.now() }
    });
}

/**
 * Update service modal state
 * @param {Partial<ServiceModalState>} updates
 */
export function updateServiceModal(updates) {
    setState({
        serviceModal: { ...state.serviceModal, ...updates }
    });
}

/**
 * Reset state to initial values (useful for testing)
 */
export function resetState() {
    state.services = { all: [], filtered: [], loading: false };
    state.teams = { all: [], filtered: [], sort: 'score-desc', search: '', activeFilters: new Map() };
    state.filters = { active: new Map(), search: '', sort: 'score-desc' };
    state.auth = { pat: null, validated: false };
    state.ui = { currentModal: null, checksHash: null, checksHashTimestamp: 0, currentView: 'services' };
    state.serviceModal = {
        org: null,
        repo: null,
        workflowRuns: [],
        filterStatus: 'all',
        pollInterval: null,
        pollIntervalTime: 30000,
        loaded: false,
        durationUpdateInterval: null
    };
    listeners.clear();
}
