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
    // Most functions now use ES6 imports. Only essential window globals remain.

    // Toast (used by React components via bridge)
    showToast: (message: string, type?: ToastType | string) => void;

    // Service Modal
    showServiceDetail: (org: string, repo: string) => Promise<void>;
    closeModal: () => void;

    // Team Modal
    showTeamModal: (teamName: string) => Promise<void>;
    showTeamDetail: (teamName: string) => Promise<void>;
    closeTeamModal: () => void;

    // App Init (used by legacy main.ts only - to be removed)
    filterAndRenderServices?: () => void;
    refreshData?: () => Promise<void>;

    // View Navigation (used by legacy main.ts only - to be removed)
    initTeamsView?: () => Promise<void>;
    refreshTeamsView?: () => void;
    setupEventListeners?: () => void;

    // Workflow triggers - removed from React entry, use direct imports instead
    triggerServiceWorkflow?: (org: string, repo: string) => Promise<boolean>;

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

    // ============= Additional Window Functions =============
    // Using index signature for flexibility with other window functions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }
}

export {};
