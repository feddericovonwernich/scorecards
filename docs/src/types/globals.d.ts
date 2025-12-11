/**
 * Global type declarations for window properties used in the scorecards application
 * This is the single source of truth for Window interface extensions
 *
 * Note: Some function types use `any` for flexibility during the TypeScript migration.
 * These can be tightened once all modules are fully migrated.
 */

import type {
  ServiceData,
  ToastType,
  ViewType,
  TeamWithStats,
} from './index.js';

// Filter state type
type FilterState = 'include' | 'exclude';

declare global {
  interface Window {
    // ============= Module Registry =============
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ScorecardModules: any;

    // ============= Services State =============
    allServices: ServiceData[];
    filteredServices: ServiceData[];
    currentChecksHash: string | null;
    checksHashTimestamp: number;

    // ============= Filter State =============
    activeFilters: Map<string, FilterState>;
    searchQuery: string;
    currentSort: string;

    // ============= View State =============
    currentView: ViewType;

    // ============= Teams State =============
    allTeams: TeamWithStats[];
    filteredTeams: TeamWithStats[];
    teamsSearchQuery: string;
    teamsSort: string;
    teamsActiveFilters: Map<string, FilterState>;

    // Note: Service modal state is managed by Zustand store (serviceModal slice)

    // ============= Auth State =============
    githubPAT: string | null;

    // ============= Core Functions =============
    // These are the most commonly used window functions with proper types

    // Formatting
    formatRelativeTime: (timestamp: string | Date) => string;
    formatDate: (dateString: string) => string;
    formatDuration: (ms: number) => string;
    escapeHtml: (str: string) => string;
    capitalize: (str: string) => string;

    // Toast
    showToast: (message: string, type?: ToastType | string) => void;

    // Auth
    getGitHubToken: () => string | null;
    hasGitHubToken: () => boolean;
    setGitHubToken: (token: string) => void;
    clearGitHubToken: () => void;

    // Theme
    initTheme: () => void;
    toggleTheme: () => string;
    getCurrentTheme: () => string;

    // Service Modal
    showServiceDetail: (org: string, repo: string) => Promise<void>;
    closeModal: () => void;

    // Team Modal
    showTeamModal: (teamName: string) => Promise<void>;
    showTeamDetail: (teamName: string) => Promise<void>;
    closeTeamModal: () => void;

    // App Init
    filterAndRenderServices: () => void;
    refreshData: () => Promise<void>;

    // View Navigation
    switchView: (view: ViewType) => void;
    initTeamsView: () => Promise<void>;
    handleHashChange: () => void;
    setupEventListeners: () => void;

    // Check Filter Modal
    openCheckFilterModal: () => void;
    closeCheckFilterModal: () => void;

    // Settings Modal
    openSettings: () => void;

    // Actions Widget
    toggleActionsWidget: () => void;

    // Team Dashboard
    openTeamDashboard: () => void;

    // Team Edit Modal
    openTeamEditModal: (mode?: 'create' | 'edit', teamId?: string) => void;

    // Check Adoption Dashboard
    openCheckAdoptionDashboard: () => void;

    // ============= React Integration Flags =============
    // These flags indicate when React is managing specific UI elements
    // Vanilla JS code checks these before rendering to avoid conflicts
    __REACT_MANAGES_SERVICES_GRID?: boolean;
    __REACT_MANAGES_TEAMS_GRID?: boolean;
    __REACT_MANAGES_NAVIGATION?: boolean;
    __REACT_MANAGES_SERVICES_STATS?: boolean;
    __REACT_MANAGES_TEAMS_STATS?: boolean;
    __REACT_MANAGES_SERVICES_CONTROLS?: boolean;
    __REACT_MANAGES_TEAMS_CONTROLS?: boolean;

    // ============= Additional Window Functions =============
    // Using index signature for flexibility with other window functions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }
}

export {};
