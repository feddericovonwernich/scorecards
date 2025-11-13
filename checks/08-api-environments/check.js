#!/usr/bin/env node
// Check: API Environment Configuration

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const repoPath = process.env.SCORECARD_REPO_PATH || '.';

// Common OpenAPI file locations (same as previous checks)
const commonPaths = [
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
];

// Check if OpenAPI file exists
let hasOpenAPI = false;
let openAPIPath = null;

for (const relativePath of commonPaths) {
    const fullPath = path.join(repoPath, relativePath);
    if (fs.existsSync(fullPath)) {
        hasOpenAPI = true;
        openAPIPath = relativePath;
        break;
    }
}

if (!hasOpenAPI) {
    console.log('No OpenAPI specification found - environment configuration not required');
    console.log('This check only applies to repositories with API specifications');
    process.exit(0); // Pass if no OpenAPI file
}

// OpenAPI file exists, check for environment configuration
const configPath = path.join(repoPath, '.scorecard', 'config.yml');

if (!fs.existsSync(configPath)) {
    console.error(`OpenAPI specification found (${openAPIPath}), but no .scorecard/config.yml exists`);
    console.error('Create .scorecard/config.yml with openapi.environments configuration');
    console.error('');
    console.error('Example:');
    console.error('  openapi:');
    console.error('    spec_file: "openapi.yaml"');
    console.error('    environments:');
    console.error('      production:');
    console.error('        base_url: "https://api.example.com"');
    console.error('        description: "Production environment"');
    console.error('      staging:');
    console.error('        base_url: "https://staging-api.example.com"');
    process.exit(1);
}

// Parse config file
let config;
try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    config = yaml.parse(configContent);
} catch (error) {
    console.error(`Error parsing .scorecard/config.yml: ${error.message}`);
    process.exit(1);
}

// Check for openapi configuration
if (!config.openapi) {
    console.error('OpenAPI specification found, but no openapi section in .scorecard/config.yml');
    console.error('Add an openapi section with environments configuration');
    console.error('');
    console.error('Example:');
    console.error('  openapi:');
    console.error('    spec_file: "' + openAPIPath + '"');
    console.error('    environments:');
    console.error('      production:');
    console.error('        base_url: "https://api.example.com"');
    console.error('        description: "Production environment"');
    process.exit(1);
}

// Check for environments
if (!config.openapi.environments || typeof config.openapi.environments !== 'object') {
    console.error('openapi section exists but no environments configured');
    console.error('Add at least one environment with a base_url');
    console.error('');
    console.error('Example:');
    console.error('  openapi:');
    console.error('    environments:');
    console.error('      production:');
    console.error('        base_url: "https://api.example.com"');
    process.exit(1);
}

const environments = Object.keys(config.openapi.environments);

if (environments.length === 0) {
    console.error('openapi.environments exists but is empty');
    console.error('Add at least one environment configuration');
    process.exit(1);
}

// Validate each environment has a base_url
const invalidEnvs = [];
const validEnvs = [];

for (const [envName, envConfig] of Object.entries(config.openapi.environments)) {
    if (!envConfig || !envConfig.base_url) {
        invalidEnvs.push(envName);
    } else {
        validEnvs.push({
            name: envName,
            url: envConfig.base_url,
            description: envConfig.description || ''
        });
    }
}

if (invalidEnvs.length > 0) {
    console.error(`Some environments are missing base_url: ${invalidEnvs.join(', ')}`);
    console.error('Each environment must have a base_url field');
    process.exit(1);
}

// Success
console.log(`API environment configuration found for OpenAPI spec: ${openAPIPath}`);
console.log(`Configured environments: ${validEnvs.length}`);
validEnvs.forEach(env => {
    const desc = env.description ? ` - ${env.description}` : '';
    console.log(`  • ${env.name}: ${env.url}${desc}`);
});

if (config.openapi.spec_file) {
    console.log(`Spec file reference: ${config.openapi.spec_file}`);
}

process.exit(0);
