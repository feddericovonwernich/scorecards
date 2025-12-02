#!/usr/bin/env node
/* eslint-disable no-console */
// Check: CODEOWNERS Quality (Syntax Validation)

import fs from 'fs';
import path from 'path';

const repoPath = process.env.SCORECARD_REPO_PATH || '.';

// Valid CODEOWNERS locations (GitHub standard)
const codeownersLocations = [
    'CODEOWNERS',
    '.github/CODEOWNERS',
    'docs/CODEOWNERS'
];

// Find CODEOWNERS file
let codeownersPath = null;
let relativePath = null;
for (const location of codeownersLocations) {
    const fullPath = path.join(repoPath, location);
    if (fs.existsSync(fullPath)) {
        codeownersPath = fullPath;
        relativePath = location;
        break;
    }
}

if (!codeownersPath) {
    console.error('No CODEOWNERS file found');
    console.error('This check validates CODEOWNERS syntax - create the file first');
    console.error('(Check 11 validates existence, this check validates syntax quality)');
    process.exit(1);
}

// Read and parse content
const content = fs.readFileSync(codeownersPath, 'utf8');
const lines = content.split('\n');

// Valid owner patterns
// @username, @org/team-name, or email@domain.com
const githubUserPattern = /^@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const githubTeamPattern = /^@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\/[a-zA-Z0-9_.-]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidOwner(owner) {
    return githubUserPattern.test(owner) ||
           githubTeamPattern.test(owner) ||
           emailPattern.test(owner);
}

const errors = [];
const validRules = [];
const allOwners = new Set();

lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
        return;
    }

    // Split line into parts (pattern + owners)
    const parts = trimmed.split(/\s+/);

    if (parts.length < 2) {
        errors.push(`Line ${lineNum}: Missing owner(s) for pattern '${parts[0]}'`);
        return;
    }

    const pattern = parts[0];
    const owners = parts.slice(1);

    // Validate each owner
    const invalidOwners = [];
    for (const owner of owners) {
        if (isValidOwner(owner)) {
            allOwners.add(owner);
        } else {
            invalidOwners.push(owner);
        }
    }

    if (invalidOwners.length > 0) {
        errors.push(`Line ${lineNum}: Invalid owner format: ${invalidOwners.join(', ')}`);
        errors.push('  Expected: @username, @org/team-name, or email@domain.com');
    } else {
        validRules.push({ pattern, owners, lineNum });
    }
});

// Report results
if (errors.length > 0) {
    console.error('CODEOWNERS file has syntax errors:');
    console.error('');
    errors.forEach(error => console.error(`  ${error}`));
    console.error('');
    console.error('Example valid CODEOWNERS syntax:');
    console.error('  * @default-owner');
    console.error('  *.js @frontend-team');
    console.error('  /docs/ @docs-team @tech-writers');
    console.error('  src/api/ user@example.com @backend-team');
    process.exit(1);
}

if (validRules.length === 0) {
    console.error('CODEOWNERS file found but contains no valid ownership rules');
    console.error('Add at least one rule in the format: <pattern> <owner1> [<owner2>...]');
    process.exit(1);
}

// Success
console.log(`CODEOWNERS syntax validated: ${relativePath}`);
console.log(`  ${validRules.length} ownership rule${validRules.length !== 1 ? 's' : ''}`);
console.log(`  ${allOwners.size} unique owner${allOwners.size !== 1 ? 's' : ''}`);

// Show first few rules as examples
const preview = validRules.slice(0, 3);
preview.forEach(rule => {
    console.log(`  - ${rule.pattern} -> ${rule.owners.join(', ')}`);
});
if (validRules.length > 3) {
    console.log(`  ... and ${validRules.length - 3} more`);
}

process.exit(0);
