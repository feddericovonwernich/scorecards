/**
 * TypeScript type definitions for the scorecards application
 * Converted from JSDoc types for better type safety
 */

// ============= Configuration Types =============

export interface DeploymentConfig {
  repoOwner: string;
  repoName: string;
  catalogBranch: string;
  ports: {
    devServer: number;
    testServer: number;
  };
  api: {
    githubBase: string;
    version: string;
    acceptHeader: string;
  };
  git: {
    botName: string;
    botEmail: string;
  };
}

export interface RankConfig {
  threshold: number;
  color: string;
  label: string;
}

export interface ScoringConfig {
  ranks: {
    platinum: RankConfig;
    gold: RankConfig;
    silver: RankConfig;
    bronze: RankConfig;
  };
  colors: {
    score: Record<string, { threshold: number; color: string }>;
  };
  defaults: {
    checkWeight: number;
    qualityThreshold: number;
  };
}

export interface WorkflowConfig {
  files: {
    triggerService: string;
    createInstallPR: string;
    scorecard: string;
  };
  polling: {
    default: number;
    min: number;
    max: number;
  };
}

// ============= Data Types =============

export interface TeamInfo {
  primary: string;
  all: string[];
  source: string;
  last_discovered?: string;
  github_org?: string;
  github_slug?: string;
}

export interface ExcludedCheck {
  check: string;
  reason: string;
}

export type CheckStatus = 'pass' | 'fail' | 'excluded' | 'error' | 'skipped';
export type RankName = 'platinum' | 'gold' | 'silver' | 'bronze';

export interface CheckResult {
  check_id: string;
  name: string;
  description?: string;
  category?: string;
  weight: number;
  status: CheckStatus;
  exit_code: number | null;
  duration: number;
  stdout?: string;
  stderr?: string;
}

export interface InstallationPR {
  number: number;
  url: string;
  state: 'OPEN' | 'MERGED' | 'CLOSED';
  updated_at?: string;
}

export interface ServiceData {
  org: string;
  repo: string;
  name: string;
  score: number;
  rank: RankName;
  rank_color?: string;
  score_color?: string;
  team: TeamInfo | null;
  check_results: Record<string, CheckStatus>;
  excluded_checks: ExcludedCheck[];
  checks_count: number;
  checks_hash: string;
  last_updated: string;
  default_branch: string;
  has_api?: boolean;
  installed?: boolean;
  installation_pr?: InstallationPR;
  // Extended properties for detailed service data
  openapi?: OpenAPIConfig;
  links?: ServiceLink[];
}

export interface RegistryEntry {
  org: string;
  repo: string;
  name: string;
  score: number;
  rank: RankName;
  team: TeamInfo | null;
  last_updated: string;
  default_branch?: string;
  installation_pr?: InstallationPR;
}

export interface DetailedCheckResult extends CheckResult {
  passed: boolean;
  message?: string;
  details?: string;
}

// ============= UI State Types =============

export type FilterMode = 'include' | 'exclude' | null;

export interface FilterState {
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

export interface ServicesState {
  all: ServiceData[];
  filtered: ServiceData[];
  loading: boolean;
}

export interface TeamsState {
  all: TeamData[];
  filtered: TeamData[];
  sort: string;
  searchQuery: string;
  activeFilters: Map<string, FilterMode>;
}

export interface AppState {
  services: ServicesState;
  teams: TeamsState;
  filters: FilterState;
  auth: AuthState;
  ui: UIState;
  serviceModal: ServiceModalState;
}

// ============= API Types =============

export interface FetchResult {
  response: Response;
  usedAPI: boolean;
}

export interface WorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed' | 'waiting';
  conclusion: WorkflowConclusion;
  created_at: string;
  updated_at: string;
  html_url: string;
  head_sha?: string;
  head_branch?: string;
  run_started_at?: string;
  jobs_url?: string;
  // Extended properties for widget/UI use
  org?: string;
  repo?: string;
  service_name?: string;
}

export interface WorkflowJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  steps?: WorkflowStep[];
}

export interface WorkflowStep {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
  started_at?: string;
  completed_at?: string;
}

// ============= Team Types =============

export interface TeamData {
  name: string;
  slug?: string;
  github_org?: string;
  github_slug?: string;
  services: ServiceData[];
  serviceCount: number;
  averageScore: number;
  rank: RankName;
  checkStats?: TeamCheckStats;
}

export interface TeamCheckStats {
  total: number;
  passing: number;
  failing: number;
  excluded: number;
  byCategory: Record<string, CategoryStats>;
}

export interface CategoryStats {
  total: number;
  passing: number;
  failing: number;
  excluded: number;
}

// ============= Check Adoption Types =============

export interface CheckAdoptionData {
  check_id: string;
  name: string;
  category: string;
  weight: number;
  description?: string;
  passing: number;
  failing: number;
  excluded: number;
  total: number;
  adoptionRate: number;
}

export interface TeamCheckAdoption {
  team: string;
  passing: number;
  failing: number;
  excluded: number;
  total: number;
  adoptionRate: number;
}

// ============= Registry Types =============

export interface RegistryData {
  services: ServiceData[];
  generated_at: string;
  checks_hash?: string;
  checks_count?: number;
}

export interface CheckDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  weight: number;
}

// ============= Event Types =============

export type StateChangeListener = () => void;

export interface StateSubscription {
  unsubscribe: () => void;
}

// ============= Check Metadata Types =============

export interface CheckMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  weight: number;
  run_order?: number;
}

export interface AllChecksResponse {
  version: string;
  checks: CheckMetadata[];
  categories: string[];
  count: number;
}

export type ChecksData = AllChecksResponse;

export interface CurrentChecksResponse {
  checks_hash: string;
  checks_count: number;
  generated_at: string;
}

// ============= Check Filter Types =============

export type CheckFilter = 'pass' | 'fail' | null;

// ============= GitHub API Types =============

export interface RateLimitInfo {
  remaining: number | null;
  limit: number | null;
  reset: Date | number | null;
  used?: number;
  error?: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name?: string;
  email?: string;
}

export interface TeamMember {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  role?: string;
}

// ============= Teams Registry Types =============

export type TeamsData = Record<string, TeamRegistryEntry>;

export interface TeamRegistryEntry {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  github_org?: string;
  github_slug?: string;
  metadata?: TeamMetadata;
  statistics?: TeamStatistics;
}

export interface TeamMetadata {
  slack_channel?: string;
  oncall_url?: string;
  documentation_url?: string;
  custom?: Record<string, unknown>;
}

export interface TeamStatistics {
  serviceCount: number;
  averageScore: number;
  installedCount: number;
  staleCount: number;
  rankDistribution: RankCounts;
}

/**
 * TeamWithStats - Extended team data for UI display
 * Combines team registry data with computed statistics
 */
export interface TeamWithStats {
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
  statistics?: TeamStatistics;
}

// ============= Service Results Types =============

export interface ServiceResults {
  org: string;
  repo: string;
  name: string;
  score: number;
  rank: RankName;
  team: TeamInfo | null;
  check_results: Record<string, CheckStatus>;
  checks: DetailedCheckResult[];
  excluded_checks: ExcludedCheck[];
  checks_count: number;
  checks_hash: string;
  last_updated: string;
  default_branch: string;
  has_api?: boolean;
  openapi_summary?: OpenAPISummary;
  contributors?: Contributor[];
  links?: ServiceLink[];
  installed?: boolean;
  installation_pr?: InstallationPR;
  // Additional properties from detailed API response
  service?: ServiceData;
  recent_contributors?: Contributor[];
  passed_checks?: number;
  total_checks?: number;
  timestamp?: string;
  commit_sha?: string;
}

export interface OpenAPISummary {
  title?: string;
  version?: string;
  description?: string;
  endpoints_count?: number;
  operations_count?: number;
  schemas_count?: number;
  has_security?: boolean;
  environments?: OpenAPIEnvironment[];
  score?: number;
}

export interface OpenAPIEnvironment {
  name: string;
  url: string;
  description?: string;
  base_url?: string;
}

export interface Contributor {
  name: string;
  email: string;
  commit_count: number;
  last_commit_date: string;
  last_commit_hash: string;
}

export interface ServiceLink {
  name: string;
  url: string;
  description?: string;
  icon?: string;
}

// ============= UI Types =============

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface RankCounts {
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
  // Allow index signature for compatibility with Record<string, number>
  [key: string]: number;
}

// ============= Workflow Status Types =============

// Workflow run status (actual GitHub API values)
export type WorkflowRunStatus = 'queued' | 'in_progress' | 'completed' | 'waiting';
// Filter status (includes 'all' for UI filtering)
export type WorkflowStatus = 'queued' | 'in_progress' | 'completed' | 'waiting' | 'all';
export type WorkflowConclusion = 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | 'neutral' | null;

// ============= OpenAPI Types =============

export interface OpenAPIConfig {
  enabled?: boolean;
  explorer_enabled?: boolean;
  base_url?: string;
  spec_file?: string;
  environments?: OpenAPIEnvironment[];
}

// ============= View Types =============

export type ViewType = 'services' | 'teams';

export type DisplayMode = 'grid' | 'list';
