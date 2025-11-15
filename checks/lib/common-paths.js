// Common file paths for checks
// Used by: 06-openapi-spec, 07-openapi-quality, 08-api-environments

const commonPaths = {
  openapi: [
    'openapi.yaml',
    'openapi.yml',
    'openapi.json',
    'swagger.yaml',
    'swagger.yml',
    'swagger.json',
    'api/openapi.yaml',
    'api/openapi.yml',
    'api/openapi.json',
    'api/swagger.yaml',
    'api/swagger.yml',
    'api/swagger.json',
    'docs/openapi.yaml',
    'docs/openapi.yml',
    'docs/openapi.json',
    'docs/swagger.yaml',
    'docs/swagger.yml',
    'docs/swagger.json',
    'spec/openapi.yaml',
    'spec/openapi.yml',
    'spec/openapi.json',
    '.openapi/openapi.yaml',
    '.openapi/openapi.yml',
    '.openapi/openapi.json'
  ],

  ci: [
    '.travis.yml',
    '.gitlab-ci.yml',
    'circle.yml',
    '.circleci/config.yml',
    'Jenkinsfile',
    '.drone.yml',
    'azure-pipelines.yml',
    'bitbucket-pipelines.yml'
  ],

  readme: [
    'README.md',
    'readme.md',
    'README',
    'README.txt',
    'readme.txt'
  ],

  license: [
    'LICENSE',
    'LICENSE.txt',
    'LICENSE.md',
    'COPYING',
    'COPYING.txt'
  ],

  testDirs: [
    'tests',
    'test',
    '__tests__',
    'spec',
    'specs'
  ],

  testPatterns: [
    '*test*.py',
    '*test*.js',
    '*test*.ts',
    '*spec*.js',
    '*spec*.ts',
    'test_*.py',
    '*Test.java',
    '*_test.go'
  ]
};

module.exports = commonPaths;
