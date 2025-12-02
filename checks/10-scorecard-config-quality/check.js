#!/usr/bin/env node
/* eslint-disable no-console */
// Check: Scorecard Config Quality

import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

const repoPath = process.env.SCORECARD_REPO_PATH || '.';
const configPath = path.join(repoPath, '.scorecard', 'config.yml');

// Check if config file exists
if (!fs.existsSync(configPath)) {
    console.error('.scorecard/config.yml not found');
    console.error('This check validates config quality - create the config file first');
    console.error('(Check 05 validates existence, this check validates meaningful content)');
    process.exit(1);
}

// Parse config file
let config;
try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    config = yaml.parse(configContent);
} catch (error) {
    console.error(`Error parsing .scorecard/config.yml: ${error.message}`);
    console.error('Ensure the file contains valid YAML syntax');
    process.exit(1);
}

// Check for service section
if (!config || !config.service) {
    console.error('.scorecard/config.yml exists but missing "service" section');
    console.error('');
    console.error('Expected structure:');
    console.error('  service:');
    console.error('    name: "Your Service Name"');
    console.error('    team: "Your Team Name"');
    console.error('    description: "A meaningful description of your service"');
    process.exit(1);
}

const { service } = config;
const errors = [];

// Validate team field
if (!service.team || typeof service.team !== 'string' || service.team.trim() === '') {
    errors.push('  • team field is empty or missing');
}

// Validate description field
if (!service.description || typeof service.description !== 'string' || service.description.trim() === '') {
    errors.push('  • description field is empty or missing');
}

// Report results
if (errors.length > 0) {
    console.error('Scorecard config exists but lacks meaningful content:');
    console.error('');
    errors.forEach(error => console.error(error));
    console.error('');
    console.error('Both team and description fields must be filled to help catalog users');
    console.error('understand what your service does and who maintains it.');
    console.error('');
    console.error('Example config.yml:');
    console.error('  service:');
    console.error('    name: "User Authentication API"');
    console.error('    team: "Platform Security Team"');
    console.error('    description: "Handles user authentication, authorization, and session management"');
    console.error('    links:');
    console.error('      - name: "Documentation"');
    console.error('        url: "https://wiki.example.com/auth-api"');
    process.exit(1);
}

// Success - both team and description are filled
console.log('Scorecard config has meaningful content:');
console.log(`  • Team: ${service.team}`);
console.log(`  • Description: ${service.description.substring(0, 80)}${service.description.length > 80 ? '...' : ''}`);

if (service.links && Array.isArray(service.links) && service.links.length > 0) {
    console.log(`  • Links: ${service.links.length} configured`);
}

process.exit(0);
