/**
 * Global type declarations for window properties used in the scorecards application
 * This is the single source of truth for Window interface extensions
 *
 * Note: Some function types use `any` for flexibility during the TypeScript migration.
 * These can be tightened once all modules are fully migrated.
 */

import type {
  ServiceData,
  WorkflowRun,
  ToastType,
  ViewType,
} from './index.js';

// Filter state type
type FilterState = 'include' | 'exclude';

// Base statistics interface covering both TeamStatistics and TeamStatsEntry
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

// TeamWithStats - extended team data for UI
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

    // ============= Service Modal State =============
    currentServiceOrg: string | null;
    currentServiceRepo: string | null;
    serviceWorkflowRuns: WorkflowRun[];
    serviceWorkflowFilterStatus: string;
    serviceWorkflowPollInterval: ReturnType<typeof setInterval> | null;
    serviceWorkflowPollIntervalTime: number;
    serviceWorkflowLoaded: boolean;
    serviceDurationUpdateInterval: ReturnType<typeof setInterval> | null;

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

    // ============= Additional Window Functions =============
    // Using index signature for flexibility with other window functions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }
}

export {};
