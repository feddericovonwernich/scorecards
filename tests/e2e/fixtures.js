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
  totalServices: 8,
  averageScore: 53,  // This may vary slightly
  withAPI: 0,
  stale: 0,
  installed: 0,
  ranks: {
    platinum: 0,
    gold: 1,
    silver: 4,
    bronze: 3,
  },
};

// Expected service data
export const expectedServices = [
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
