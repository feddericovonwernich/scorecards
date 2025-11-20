#!/usr/bin/env node
/**
 * Check 03: CI Configuration Existence
 *
 * Validates that continuous integration (CI) is configured for the repository.
 * Checks for GitHub Actions workflows and other popular CI systems.
 *
 * Pass criteria:
 *   - At least one CI configuration file exists in the repository
 *   - Supported CI systems:
 *     - GitHub Actions (.github/workflows/*.yml or *.yaml)
 *     - Travis CI (.travis.yml)
 *     - GitLab CI (.gitlab-ci.yml)
 *     - CircleCI (circle.yml or .circleci/config.yml)
 *     - Jenkins (Jenkinsfile)
 *     - Drone CI (.drone.yml)
 *     - Azure Pipelines (azure-pipelines.yml)
 *     - Bitbucket Pipelines (bitbucket-pipelines.yml)
 *
 * Environment variables:
 *   SCORECARD_REPO_PATH - Path to repository being checked (default: current dir)
 *
 * Exit codes:
 *   0 - Check passed (CI configuration found)
 *   1 - Check failed (No CI configuration found)
 *
 * Outputs:
 *   Success message to stdout with detected CI systems
 *   Error message to stderr
 *
 * Example:
 *   $ SCORECARD_REPO_PATH=/path/to/repo node check.js
 *   GitHub Actions: 3 workflow(s) (ci.yml, deploy.yml, test.yml)
 *
 * @module checks/03-ci-config
 */

import fs from 'fs';
import path from 'path';

const repoPath = process.env.SCORECARD_REPO_PATH || '.';

// Check for GitHub Actions workflows
const githubWorkflowsPath = path.join(repoPath, '.github', 'workflows');
let workflowFiles = [];

if (fs.existsSync(githubWorkflowsPath)) {
    try {
        const files = fs.readdirSync(githubWorkflowsPath);
        workflowFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    } catch (error) {
        // Ignore errors, might be a file not a directory
    }
}

// Check for other CI systems
const otherCIFiles = [
    '.travis.yml',           // Travis CI
    '.gitlab-ci.yml',        // GitLab CI
    'circle.yml',            // CircleCI (old)
    '.circleci/config.yml',  // CircleCI (new)
    'Jenkinsfile',           // Jenkins
    '.drone.yml',            // Drone CI
    'azure-pipelines.yml',   // Azure Pipelines
    'bitbucket-pipelines.yml' // Bitbucket Pipelines
];

let foundOtherCI = [];
for (const ciFile of otherCIFiles) {
    if (fs.existsSync(path.join(repoPath, ciFile))) {
        foundOtherCI.push(ciFile);
    }
}

// Determine if we found any CI configuration
const totalCI = workflowFiles.length + foundOtherCI.length;

if (totalCI === 0) {
    console.error('No CI configuration found');
    process.exit(1);
}

// Build success message
let message = '';
if (workflowFiles.length > 0) {
    message += `GitHub Actions: ${workflowFiles.length} workflow(s) (${workflowFiles.slice(0, 3).join(', ')}${workflowFiles.length > 3 ? '...' : ''})`;
}
if (foundOtherCI.length > 0) {
    if (message) message += '; ';
    message += `Other CI: ${foundOtherCI.join(', ')}`;
}

console.log(message);
process.exit(0);
