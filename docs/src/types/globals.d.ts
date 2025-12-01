/**
 * Global type declarations for window properties used in the scorecards application
 */

interface ScorecardModules {
    showServiceDetail?: (org: string, repo: string) => Promise<void>;
    closeModal?: () => void;
    renderServices?: (services: any[]) => void;
    applyFilters?: () => void;
    sortServices?: (services: any[], sortBy: string) => any[];
    showToast?: (message: string, type?: string) => void;
    isServiceStale?: (data: any, currentHash: string | null) => boolean;
    formatRelativeTime?: (timestamp: string | Date) => string;
    formatDate?: (dateString: string) => string;
    loadTeams?: (forceRefresh?: boolean) => Promise<any>;
    clearTeamsCache?: () => void;
    openTeamDashboard?: (services: any[], checksHash: string | null) => void;
    showTeamDetail?: (teamName: string) => void;
    initTeamsView?: () => void;
    openCheckAdoptionDashboard?: (services: any[]) => void;
}

interface Window {
    // Application state
    allServices: any[];
    filteredServices: any[];
    currentChecksHash: string | null;
    checksHashTimestamp: number;

    // Filter state
    activeFilters: Map<string, Set<string>>;
    searchQuery: string;
    currentSort: string;

    // Module registry
    ScorecardModules: ScorecardModules;

    // Exposed functions
    showServiceDetail: (org: string, repo: string) => Promise<void>;
    closeModal: () => void;
    switchTab: (event: Event, tabName: string) => void;
    scrollTabs: (direction: 'left' | 'right') => void;
    refreshServiceData: (org: string, repo: string) => Promise<void>;
    copyBadgeCode: (elementId: string, event: Event) => void;
    openSettings: () => void;
    closeSettings: () => void;
    saveSettings: () => void;
    filterServiceWorkflows: (status: string) => void;
    changeServicePollingInterval: () => void;
    refreshServiceWorkflowRuns: () => Promise<void>;
    triggerServiceWorkflow: (org: string, repo: string, button: HTMLButtonElement) => Promise<void>;
    installService: (org: string, repo: string, button: HTMLButtonElement) => Promise<void>;
    showTeamDetail: (teamName: string) => void;
    initTeamsView: () => void;
    openTeamDashboard: (services: any[], checksHash: string | null) => void;
    openCheckAdoptionDashboard: (services: any[]) => void;
    openApiExplorer: (org: string, repo: string) => void;
    copySpecContent: (containerId: string) => Promise<void>;

    // Configuration overrides
    SCORECARD_REPO_OWNER?: string;
    SCORECARD_REPO_NAME?: string;
    SCORECARD_CATALOG_BRANCH?: string;
}
