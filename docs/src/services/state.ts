/**
 * Centralized state management
 * Replaces scattered window.* globals
 * @module services/state
 */

import type {
  ServiceData,
  TeamData,
  WorkflowRun,
  FilterMode,
} from '../types/index';

// ============= State Types =============

export interface ServicesState {
  all: ServiceData[];
  filtered: ServiceData[];
  loading: boolean;
}

export interface TeamsState {
  all: TeamData[];
  filtered: TeamData[];
  sort: string;
  search: string;
  activeFilters: Map<string, FilterMode>;
}

export interface FiltersState {
  active: Map<string, FilterMode>;
  search: string;
  sort: string;
}

export interface AuthState {
  pat: string | null;
  validated: boolean;
}

export interface UIState {
  currentModal: string | null;
  checksHash: string | null;
  checksHashTimestamp: number;
  currentView: 'services' | 'teams';
}

export interface ServiceModalState {
  org: string | null;
  repo: string | null;
  workflowRuns: WorkflowRun[];
  filterStatus: string;
  pollInterval: ReturnType<typeof setInterval> | null;
  pollIntervalTime: number;
  loaded: boolean;
  durationUpdateInterval: ReturnType<typeof setInterval> | null;
}

export interface AppState {
  services: ServicesState;
  teams: TeamsState;
  filters: FiltersState;
  auth: AuthState;
  ui: UIState;
  serviceModal: ServiceModalState;
}

export type StateKey = keyof AppState;
export type StateChangeCallback<K extends StateKey = StateKey> = (
  value: AppState[K]
) => void;

// ============= State Implementation =============

const listeners = new Map<StateKey, Set<StateChangeCallback>>();

const state: AppState = {
  services: {
    all: [],
    filtered: [],
    loading: false,
  },
  teams: {
    all: [],
    filtered: [],
    sort: 'score-desc',
    search: '',
    activeFilters: new Map(),
  },
  filters: {
    active: new Map(),
    search: '',
    sort: 'score-desc',
  },
  auth: {
    pat: null,
    validated: false,
  },
  ui: {
    currentModal: null,
    checksHash: null,
    checksHashTimestamp: 0,
    currentView: 'services',
  },
  serviceModal: {
    org: null,
    repo: null,
    workflowRuns: [],
    filterStatus: 'all',
    pollInterval: null,
    pollIntervalTime: 30000,
    loaded: false,
    durationUpdateInterval: null,
  },
};

/**
 * Get current state (shallow copy)
 */
export function getState(): AppState {
  return { ...state };
}

/**
 * Get specific state slice
 */
export function getStateSlice<K extends StateKey>(key: K): AppState[K] {
  return state[key];
}

/**
 * Update state and notify listeners
 */
export function setState(updates: Partial<AppState>): void {
  const changedKeys: StateKey[] = [];

  for (const [key, value] of Object.entries(updates) as [StateKey, AppState[StateKey]][]) {
    if (state[key] !== value) {
      // @ts-expect-error - TypeScript can't narrow the key type here
      state[key] = value;
      changedKeys.push(key);
    }
  }

  changedKeys.forEach((key) => notifyListeners(key));
}

/**
 * Subscribe to state changes
 * @returns Unsubscribe function
 */
export function subscribe<K extends StateKey>(
  key: K,
  callback: StateChangeCallback<K>
): () => void {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key)!.add(callback as StateChangeCallback);

  return () => {
    listeners.get(key)?.delete(callback as StateChangeCallback);
  };
}

/**
 * Notify listeners for a key
 */
function notifyListeners(key: StateKey): void {
  listeners.get(key)?.forEach((callback) => {
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
 */
export function setServices(services: ServiceData[]): void {
  setState({
    services: { ...state.services, all: services },
  });
}

/**
 * Set filtered services
 */
export function setFilteredServices(services: ServiceData[]): void {
  setState({
    services: { ...state.services, filtered: services },
  });
}

/**
 * Set services loading state
 */
export function setServicesLoading(loading: boolean): void {
  setState({
    services: { ...state.services, loading },
  });
}

/**
 * Set all teams
 */
export function setTeams(teams: TeamData[]): void {
  setState({
    teams: { ...state.teams, all: teams },
  });
}

/**
 * Set filtered teams
 */
export function setFilteredTeams(teams: TeamData[]): void {
  setState({
    teams: { ...state.teams, filtered: teams },
  });
}

/**
 * Set GitHub PAT
 */
export function setAuth(pat: string | null, validated = false): void {
  setState({
    auth: { pat, validated },
  });
}

/**
 * Set current view (services or teams)
 */
export function setCurrentView(view: 'services' | 'teams'): void {
  setState({
    ui: { ...state.ui, currentView: view },
  });
}

/**
 * Set checks hash for staleness detection
 */
export function setChecksHash(hash: string | null): void {
  setState({
    ui: { ...state.ui, checksHash: hash, checksHashTimestamp: Date.now() },
  });
}

/**
 * Update service modal state
 */
export function updateServiceModal(updates: Partial<ServiceModalState>): void {
  setState({
    serviceModal: { ...state.serviceModal, ...updates },
  });
}

/**
 * Reset state to initial values (useful for testing)
 */
export function resetState(): void {
  state.services = { all: [], filtered: [], loading: false };
  state.teams = {
    all: [],
    filtered: [],
    sort: 'score-desc',
    search: '',
    activeFilters: new Map(),
  };
  state.filters = { active: new Map(), search: '', sort: 'score-desc' };
  state.auth = { pat: null, validated: false };
  state.ui = {
    currentModal: null,
    checksHash: null,
    checksHashTimestamp: 0,
    currentView: 'services',
  };
  state.serviceModal = {
    org: null,
    repo: null,
    workflowRuns: [],
    filterStatus: 'all',
    pollInterval: null,
    pollIntervalTime: 30000,
    loaded: false,
    durationUpdateInterval: null,
  };
  listeners.clear();
}
