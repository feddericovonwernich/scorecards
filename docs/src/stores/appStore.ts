/**
 * Zustand App Store
 * Centralized state management for React components
 * Complete state management for full React migration
 * @module stores/appStore
 */

import { create } from 'zustand';
import { isServiceStale } from '../services/staleness.js';
import { filterByCheckCriteria } from '../utils/check-statistics.js';
import type {
  ServiceData,
  TeamData,
  WorkflowRun,
  WorkflowStatus,
  FilterMode,
  CheckFilter,
  RateLimitInfo,
  DisplayMode,
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
  teamFilter: string | null;
  checkFilters: Map<string, CheckFilter>;
}

export type SortBy =
  | 'score-desc'
  | 'score-asc'
  | 'name-asc'
  | 'name-desc'
  | 'updated-desc'
  | 'updated-asc';

export interface AuthState {
  pat: string | null;
  validated: boolean;
  rateLimit: RateLimitInfo | null;
  user: { login: string; avatar_url: string } | null;
}

export type ModalType =
  | 'service'
  | 'team'
  | 'settings'
  | 'teamEdit'
  | 'checkFilter'
  | 'checkAdoption'
  | 'teamDashboard'
  | null;

export interface ActiveModal {
  type: ModalType;
  data?: unknown;
}

export interface UIState {
  currentModal: string | null; // Legacy - keeping for backwards compat
  activeModal: ActiveModal;
  checksHash: string | null;
  checksHashTimestamp: number;
  displayMode: DisplayMode;
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

export interface ActionsWidgetState {
  open: boolean;
  runs: WorkflowRun[];
  filterStatus: 'all' | WorkflowStatus;
  loading: boolean;
  lastFetch: number;
  pollInterval: number;
  pollIntervalRef: ReturnType<typeof setInterval> | null;
}

export interface AppState {
  // State slices
  services: ServicesState;
  teams: TeamsState;
  filters: FiltersState;
  auth: AuthState;
  ui: UIState;
  serviceModal: ServiceModalState;
  actionsWidget: ActionsWidgetState;

  // Services actions
  setServices: (services: ServiceData[]) => void;
  setFilteredServices: (services: ServiceData[]) => void;
  setServicesLoading: (loading: boolean) => void;
  filterAndSortServices: () => void;

  // Teams actions
  setTeams: (teams: TeamData[]) => void;
  setFilteredTeams: (teams: TeamData[]) => void;
  updateTeamsState: (updates: Partial<TeamsState>) => void;
  filterAndSortTeams: () => void;

  // Auth actions
  setAuth: (pat: string | null, validated?: boolean) => void;
  setRateLimit: (rateLimit: RateLimitInfo | null) => void;
  setAuthUser: (user: { login: string; avatar_url: string } | null) => void;

  // UI actions
  setDisplayMode: (mode: DisplayMode) => void;
  setChecksHash: (hash: string | null) => void;
  openModal: (type: ModalType, data?: unknown) => void;
  closeModal: () => void;

  // Service modal actions
  updateServiceModal: (updates: Partial<ServiceModalState>) => void;

  // Filters actions
  updateFilters: (updates: Partial<FiltersState>) => void;
  setFilter: (filterName: string, mode: FilterMode) => void;
  clearFilters: () => void;
  setCheckFilter: (checkId: string, filter: CheckFilter) => void;
  clearCheckFilters: () => void;

  // Actions widget actions
  updateActionsWidget: (updates: Partial<ActionsWidgetState>) => void;
  toggleActionsWidget: () => void;
  setActionsWidgetRuns: (runs: WorkflowRun[]) => void;

  // Reset
  resetState: () => void;
}

// ============= Initial State =============

const initialFiltersState: FiltersState = {
  active: new Map<string, FilterMode>(),
  search: '',
  sort: 'score-desc',
  teamFilter: null,
  checkFilters: new Map<string, CheckFilter>(),
};

const initialAuthState: AuthState = {
  pat: null,
  validated: false,
  rateLimit: null,
  user: null,
};

const initialUIState: UIState = {
  currentModal: null,
  activeModal: { type: null },
  checksHash: null,
  checksHashTimestamp: 0,
  displayMode: (localStorage.getItem('scorecards-display-mode') as DisplayMode) || 'grid',
};

const initialActionsWidgetState: ActionsWidgetState = {
  open: false,
  runs: [],
  filterStatus: 'all',
  loading: false,
  lastFetch: 0,
  pollInterval: 30000,
  pollIntervalRef: null,
};

const initialState = {
  services: {
    all: [],
    filtered: [],
    loading: false,
  } as ServicesState,
  teams: {
    all: [],
    filtered: [],
    sort: 'score-desc',
    search: '',
    activeFilters: new Map<string, FilterMode>(),
  } as TeamsState,
  filters: initialFiltersState,
  auth: initialAuthState,
  ui: initialUIState,
  serviceModal: {
    org: null,
    repo: null,
    workflowRuns: [],
    filterStatus: 'all',
    pollInterval: null,
    pollIntervalTime: 30000,
    loaded: false,
    durationUpdateInterval: null,
  } as ServiceModalState,
  actionsWidget: initialActionsWidgetState,
};

// ============= Filter and Sort Logic =============

function filterServices(
  services: ServiceData[],
  activeFilters: Map<string, FilterMode>,
  searchQuery: string,
  teamFilter: string | null,
  checkFilters: Map<string, CheckFilter>,
  currentHash: string | null
): ServiceData[] {
  let filtered = services;

  // Team filter (supports comma-separated values for multi-select)
  if (teamFilter) {
    // Parse comma-separated teams into array
    const selectedTeams = teamFilter.split(',').map((t) => t.trim().toLowerCase());
    const hasNoTeamFilter = selectedTeams.includes('__no_team__');

    filtered = filtered.filter((service) => {
      const teamStr =
        typeof service.team === 'string'
          ? service.team
          : service.team?.primary || '';
      const hasTeam = !!teamStr;

      // Check if "no team" filter matches
      if (hasNoTeamFilter && !hasTeam) {
        return true;
      }

      // Check if service team matches any selected team
      if (teamStr) {
        return selectedTeams.includes(teamStr.toLowerCase());
      }

      return false;
    });
  }

  // Multi-select filters with include/exclude (AND logic)
  if (activeFilters.size > 0) {
    filtered = filtered.filter((service) => {
      for (const [filterName, filterState] of activeFilters) {
        if (filterState === null) {continue;}

        let matches = false;

        if (filterName === 'has-api') {
          matches = !!service.has_api;
        } else if (filterName === 'stale') {
          matches = isServiceStale(service, currentHash);
        } else if (filterName === 'installed') {
          matches = !!service.installed;
        } else if (
          filterName === 'platinum' ||
          filterName === 'gold' ||
          filterName === 'silver' ||
          filterName === 'bronze'
        ) {
          matches = service.rank === filterName;
        }

        if (filterState === 'include' && !matches) {return false;}
        if (filterState === 'exclude' && matches) {return false;}
      }
      return true;
    });
  }

  // Check filters
  if (checkFilters.size > 0) {
    filtered = filterByCheckCriteria(filtered, checkFilters);
  }

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((service) => {
      const teamStr =
        typeof service.team === 'string'
          ? service.team
          : service.team?.primary || '';
      const searchText =
        `${service.name} ${service.org} ${service.repo} ${teamStr}`.toLowerCase();
      return searchText.includes(query);
    });
  }

  return filtered;
}

function sortServices(services: ServiceData[], sortBy: string): ServiceData[] {
  const sorted = [...services];
  sorted.sort((a, b) => {
    switch (sortBy) {
    case 'score-desc':
      return b.score - a.score;
    case 'score-asc':
      return a.score - b.score;
    case 'name-asc':
      return a.name.localeCompare(b.name);
    case 'name-desc':
      return b.name.localeCompare(a.name);
    case 'updated-desc':
      return (
        new Date(b.last_updated).getTime() -
          new Date(a.last_updated).getTime()
      );
    case 'updated-asc':
      return (
        new Date(a.last_updated).getTime() -
          new Date(b.last_updated).getTime()
      );
    default:
      return 0;
    }
  });
  return sorted;
}

// ============= Store =============

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  ...initialState,

  // Services actions
  setServices: (services) =>
    set((state) => ({
      services: { ...state.services, all: services },
    })),

  setFilteredServices: (services) =>
    set((state) => ({
      services: { ...state.services, filtered: services },
    })),

  setServicesLoading: (loading) =>
    set((state) => ({
      services: { ...state.services, loading },
    })),

  filterAndSortServices: () => {
    const state = get();
    const { all } = state.services;
    const { active, search, sort, teamFilter, checkFilters } = state.filters;
    const { checksHash } = state.ui;

    const filtered = filterServices(
      all,
      active,
      search,
      teamFilter,
      checkFilters,
      checksHash
    );
    const sorted = sortServices(filtered, sort);

    set((s) => ({
      services: { ...s.services, filtered: sorted },
    }));
  },

  // Teams actions
  setTeams: (teams) =>
    set((state) => ({
      teams: { ...state.teams, all: teams },
    })),

  setFilteredTeams: (teams) =>
    set((state) => ({
      teams: { ...state.teams, filtered: teams },
    })),

  updateTeamsState: (updates) =>
    set((state) => ({
      teams: { ...state.teams, ...updates },
    })),

  filterAndSortTeams: () => {
    const state = get();
    const { all, search, sort } = state.teams;

    // Filter by search
    let filtered = all;
    if (search) {
      const query = search.toLowerCase();
      filtered = all.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query))
      );
    }

    // Sort teams
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
      case 'services-desc':
        return (b.serviceCount || 0) - (a.serviceCount || 0);
      case 'services-asc':
        return (a.serviceCount || 0) - (b.serviceCount || 0);
      case 'score-desc':
        return (b.averageScore || 0) - (a.averageScore || 0);
      case 'score-asc':
        return (a.averageScore || 0) - (b.averageScore || 0);
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return (b.averageScore || 0) - (a.averageScore || 0);
      }
    });

    set((s) => ({
      teams: { ...s.teams, filtered: sorted },
    }));
  },

  // Auth actions
  setAuth: (pat, validated = false) =>
    set((state) => ({
      auth: { ...state.auth, pat, validated },
    })),

  setRateLimit: (rateLimit) =>
    set((state) => ({
      auth: { ...state.auth, rateLimit },
    })),

  setAuthUser: (user) =>
    set((state) => ({
      auth: { ...state.auth, user },
    })),

  // UI actions
  setDisplayMode: (mode) => {
    localStorage.setItem('scorecards-display-mode', mode);
    set((state) => ({
      ui: { ...state.ui, displayMode: mode },
    }));
  },

  setChecksHash: (hash) =>
    set((state) => ({
      ui: {
        ...state.ui,
        checksHash: hash,
        checksHashTimestamp: Date.now(),
      },
    })),

  openModal: (type, data) =>
    set((state) => ({
      ui: {
        ...state.ui,
        activeModal: { type, data },
        currentModal: type, // Legacy compatibility
      },
    })),

  closeModal: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        activeModal: { type: null },
        currentModal: null,
      },
    })),

  // Service modal actions
  updateServiceModal: (updates) =>
    set((state) => ({
      serviceModal: { ...state.serviceModal, ...updates },
    })),

  // Filters actions
  updateFilters: (updates) => {
    set((state) => ({
      filters: { ...state.filters, ...updates },
    }));
    // Auto-filter after updating filters
    get().filterAndSortServices();
  },

  setFilter: (filterName, mode) => {
    set((state) => {
      const newActive = new Map(state.filters.active);
      if (mode === null) {
        newActive.delete(filterName);
      } else {
        newActive.set(filterName, mode);
      }
      return {
        filters: { ...state.filters, active: newActive },
      };
    });
    get().filterAndSortServices();
  },

  clearFilters: () => {
    set((state) => ({
      filters: {
        ...state.filters,
        active: new Map(),
        search: '',
        teamFilter: null,
      },
    }));
    get().filterAndSortServices();
  },

  setCheckFilter: (checkId, filter) => {
    set((state) => {
      const newCheckFilters = new Map(state.filters.checkFilters);
      if (filter === null) {
        newCheckFilters.delete(checkId);
      } else {
        newCheckFilters.set(checkId, filter);
      }
      return {
        filters: { ...state.filters, checkFilters: newCheckFilters },
      };
    });
    get().filterAndSortServices();
  },

  clearCheckFilters: () => {
    set((state) => ({
      filters: { ...state.filters, checkFilters: new Map() },
    }));
    get().filterAndSortServices();
  },

  // Actions widget actions
  updateActionsWidget: (updates) =>
    set((state) => ({
      actionsWidget: { ...state.actionsWidget, ...updates },
    })),

  toggleActionsWidget: () =>
    set((state) => ({
      actionsWidget: { ...state.actionsWidget, open: !state.actionsWidget.open },
    })),

  setActionsWidgetRuns: (runs) => {
    const activeCount = runs.filter(
      (r) => r.status === 'in_progress' || r.status === 'queued'
    ).length;
    set((state) => ({
      actionsWidget: {
        ...state.actionsWidget,
        runs,
        loading: false,
        lastFetch: Date.now(),
      },
    }));
    // Return the badge count for external use
    return activeCount;
  },

  // Reset
  resetState: () => set(() => ({ ...initialState })),
}));

// ============= Selectors =============
// Use these to avoid unnecessary re-renders

export const selectServices = (state: AppState) => state.services;
export const selectServicesAll = (state: AppState) => state.services.all;
export const selectServicesFiltered = (state: AppState) =>
  state.services.filtered;
export const selectServicesLoading = (state: AppState) =>
  state.services.loading;

export const selectTeams = (state: AppState) => state.teams;
export const selectTeamsAll = (state: AppState) => state.teams.all;
export const selectTeamsFiltered = (state: AppState) => state.teams.filtered;

export const selectFilters = (state: AppState) => state.filters;
export const selectActiveFilters = (state: AppState) => state.filters.active;
export const selectCheckFilters = (state: AppState) => state.filters.checkFilters;
export const selectSearchQuery = (state: AppState) => state.filters.search;
export const selectSortBy = (state: AppState) => state.filters.sort;
export const selectTeamFilter = (state: AppState) => state.filters.teamFilter;

export const selectAuth = (state: AppState) => state.auth;
export const selectPAT = (state: AppState) => state.auth.pat;
export const selectRateLimit = (state: AppState) => state.auth.rateLimit;
export const selectAuthUser = (state: AppState) => state.auth.user;

export const selectUI = (state: AppState) => state.ui;
export const selectDisplayMode = (state: AppState) => state.ui.displayMode;
export const selectActiveModal = (state: AppState) => state.ui.activeModal;
export const selectChecksHash = (state: AppState) => state.ui.checksHash;

export const selectServiceModal = (state: AppState) => state.serviceModal;

export const selectActionsWidget = (state: AppState) => state.actionsWidget;
export const selectActionsWidgetOpen = (state: AppState) =>
  state.actionsWidget.open;
export const selectActionsWidgetRuns = (state: AppState) =>
  state.actionsWidget.runs;
export const selectActionsWidgetBadgeCount = (state: AppState) =>
  state.actionsWidget.runs.filter(
    (r) => r.status === 'in_progress' || r.status === 'queued'
  ).length;

// ============= Computed Selectors =============

export const selectFilterStats = (state: AppState) => {
  const { all, filtered } = state.services;
  const { checksHash } = state.ui;

  const staleCount = all.filter((s) => isServiceStale(s, checksHash)).length;
  const installedCount = all.filter((s) => s.installed).length;
  const hasApiCount = all.filter((s) => s.has_api).length;

  const ranks = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  all.forEach((s) => {
    if (s.rank in ranks) {
      ranks[s.rank as keyof typeof ranks]++;
    }
  });

  return {
    total: all.length,
    filtered: filtered.length,
    stale: staleCount,
    installed: installedCount,
    hasApi: hasApiCount,
    ranks,
  };
};

export const selectActiveFilterCount = (state: AppState) => {
  let count = 0;
  state.filters.active.forEach((mode) => {
    if (mode !== null) {count++;}
  });
  state.filters.checkFilters.forEach((filter) => {
    if (filter !== null) {count++;}
  });
  if (state.filters.teamFilter) {count++;}
  return count;
};

// ============= Vanilla JS Bridge =============
// These functions allow vanilla JS code to interact with the store

/**
 * Get full state (for vanilla JS compatibility)
 */
export function getStoreState() {
  return useAppStore.getState();
}

/**
 * Subscribe to store changes (for vanilla JS compatibility)
 * @returns Unsubscribe function
 */
export function subscribeToStore(callback: (state: AppState) => void) {
  return useAppStore.subscribe(callback);
}

/**
 * Bridge function for window.showServiceDetail
 */
export function showServiceDetailBridge(org: string, repo: string) {
  useAppStore.getState().openModal('service', { org, repo });
}

/**
 * Bridge function for window.openSettings
 */
export function openSettingsBridge() {
  useAppStore.getState().openModal('settings');
}

/**
 * Bridge function for window.toggleActionsWidget
 */
export function toggleActionsWidgetBridge() {
  useAppStore.getState().toggleActionsWidget();
}
