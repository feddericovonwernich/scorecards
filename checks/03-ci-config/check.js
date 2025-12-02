#!/usr/bin/env node
/* eslint-disable no-console */
// Check: CI configuration existence

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

const foundOtherCI = [];
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
    if (message) {message += '; ';}
    message += `Other CI: ${foundOtherCI.join(', ')}`;
}

console.log(message);
process.exit(0);
