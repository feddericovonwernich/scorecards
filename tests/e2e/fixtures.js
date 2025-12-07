/**
 * Test Fixtures for Scorecards Catalog UI Tests
 *
 * These fixtures contain expected data based on the current state of the
 * test repositories in the catalog branch.
 */

// Mock GitHub PAT for testing (not a real token)
export const mockPAT = 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// Expected catalog statistics
export const expectedStats = {
  totalServices: 9,
  averageScore: 56,  // This may vary slightly
  withAPI: 1,
  stale: 1,
  installed: 1,
  ranks: {
    platinum: 0,
    gold: 2,
    silver: 4,
    bronze: 3,
  },
  teams: 3, // platform, frontend, backend
};

// Expected team data
export const expectedTeams = {
  platform: {
    name: 'Platform',
    serviceCount: 2,
    services: ['test-repo-perfect', 'test-repo-stale'],
  },
  frontend: {
    name: 'Frontend',
    serviceCount: 2,
    services: ['test-repo-edge-cases', 'test-repo-javascript'],
  },
  backend: {
    name: 'Backend',
    serviceCount: 2,
    services: ['test-repo-install-test', 'test-repo-python'],
  },
};

// Services without team
export const servicesWithoutTeam = [
  'test-repo-empty',
  'test-repo-minimal',
  'test-repo-no-docs',
];

// Expected service data
export const expectedServices = [
  {
    name: 'test-repo-stale',
    org: 'feddericovonwernich',
    repo: 'test-repo-stale',
    score: 80,
    rank: 'gold',
    hasInstallationPR: false,
  },
  {
    name: 'test-repo-perfect',
    org: 'feddericovonwernich',
    repo: 'test-repo-perfect',
    score: 76,
    rank: 'gold',
    hasInstallationPR: false,
  },
  {
    name: 'test-repo-edge-cases',
    org: 'feddericovonwernich',
    repo: 'test-repo-edge-cases',
    score: 63,
    rank: 'silver',
    hasInstallationPR: true,
  },
  {
    name: 'test-repo-install-test',
    org: 'feddericovonwernich',
    repo: 'test-repo-install-test',
    score: 63,
    rank: 'silver',
    hasInstallationPR: true,
  },
  {
    name: 'test-repo-javascript',
    org: 'feddericovonwernich',
    repo: 'test-repo-javascript',
    score: 63,
    rank: 'silver',
    hasInstallationPR: true,
  },
  {
    name: 'test-repo-python',
    org: 'feddericovonwernich',
    repo: 'test-repo-python',
    score: 63,
    rank: 'silver',
    hasInstallationPR: true,
  },
  {
    name: 'test-repo-no-docs',
    org: 'feddericovonwernich',
    repo: 'test-repo-no-docs',
    score: 40,
    rank: 'bronze',
    hasInstallationPR: true,
  },
  {
    name: 'test-repo-minimal',
    org: 'feddericovonwernich',
    repo: 'test-repo-minimal',
    score: 36,
    rank: 'bronze',
    hasInstallationPR: false,
  },
  {
    name: 'test-repo-empty',
    org: 'feddericovonwernich',
    repo: 'test-repo-empty',
    score: 23,
    rank: 'bronze',
    hasInstallationPR: false,
  },
];

// Expected check results for test-repo-perfect
export const expectedChecks = {
  total: 11,
  passed: 6,
  failed: 5,
  checks: [
    { name: 'README Documentation', status: 'pass', weight: 15 },
    { name: 'License File', status: 'pass', weight: 12 },
    { name: 'CI Configuration', status: 'pass', weight: 18 },
    { name: 'Test Coverage', status: 'pass', weight: 20 },
    { name: 'Scorecard Configuration', status: 'fail', weight: 8 },
    { name: 'OpenAPI Specification', status: 'pass', weight: 12 },
    { name: 'OpenAPI Quality', status: 'pass', weight: 10 },
    { name: 'API Environment Configuration', status: 'fail', weight: 8 },
    { name: 'Scorecard Badge', status: 'fail', weight: 5 },
    { name: 'Scorecard Config Quality', status: 'fail', weight: 7 },
  ],
};

// Sort options
export const sortOptions = [
  'Score: High to Low',
  'Score: Low to High',
  'Name: A to Z',
  'Name: Z to A',
  'Recently Updated',
];

// Rank badges
export const rankBadges = {
  platinum: { color: '#E5E4E2', label: 'Platinum' },
  gold: { color: '#FFD700', label: 'Gold' },
  silver: { color: '#C0C0C0', label: 'Silver' },
  bronze: { color: '#CD7F32', label: 'Bronze' },
};

// Error response fixtures for testing error states
export const errorResponses = {
  networkError: { message: 'Network error', code: 'NETWORK_ERROR' },
  rateLimitExceeded: { message: 'API rate limit exceeded', code: 403 },
  unauthorized: { message: 'Bad credentials', code: 401 },
  notFound: { message: 'Not Found', code: 404 },
  serverError: { message: 'Internal Server Error', code: 500 },
};

// Rate limit fixtures for testing rate limit states
export const rateLimitResponses = {
  normal: { remaining: 4500, limit: 5000, reset: Math.floor(Date.now() / 1000) + 3600 },
  low: { remaining: 50, limit: 5000, reset: Math.floor(Date.now() / 1000) + 3600 },
  critical: { remaining: 5, limit: 5000, reset: Math.floor(Date.now() / 1000) + 3600 },
  exhausted: { remaining: 0, limit: 5000, reset: Math.floor(Date.now() / 1000) + 3600 },
  unauthenticated: { remaining: 30, limit: 60, reset: Math.floor(Date.now() / 1000) + 3600 },
};

// Empty state fixtures for testing no-data scenarios
export const emptyStates = {
  noServices: { services: {} },
  noTeams: { teams: [] },
  noWorkflows: { workflow_runs: [], total_count: 0 },
};

// Mock GitHub team members for testing
export const mockTeamMembers = [
  {
    login: 'testuser1',
    avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
    html_url: 'https://github.com/testuser1',
  },
  {
    login: 'testuser2',
    avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4',
    html_url: 'https://github.com/testuser2',
  },
];

// Mock workflow runs for testing
export const mockWorkflowRuns = [
  {
    id: 123456,
    name: 'CI',
    status: 'completed',
    conclusion: 'success',
    run_number: 42,
    created_at: '2025-01-01T12:00:00Z',
    html_url: 'https://github.com/test/repo/actions/runs/123456',
  },
  {
    id: 123457,
    name: 'CI',
    status: 'in_progress',
    conclusion: null,
    run_number: 43,
    created_at: '2025-01-02T12:00:00Z',
    html_url: 'https://github.com/test/repo/actions/runs/123457',
  },
];
