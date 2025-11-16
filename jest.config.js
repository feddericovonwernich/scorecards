export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'docs/src/**/*.js',
    'checks/**/*.js',
    '!checks/**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
