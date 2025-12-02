#!/usr/bin/env node
/* eslint-disable no-console */
// Check: OpenAPI Specification Detection & Validation

import fs from 'fs';
import path from 'path';
import commonPaths from '../lib/common-paths.js';

const repoPath = process.env.SCORECARD_REPO_PATH || '.';

// Find OpenAPI files
const foundFiles = [];
for (const relativePath of commonPaths.openapi) {
    const fullPath = path.join(repoPath, relativePath);
    if (fs.existsSync(fullPath)) {
        foundFiles.push({
            path: relativePath,
            fullPath: fullPath
        });
    }
}

if (foundFiles.length === 0) {
    console.error('No OpenAPI specification file found in common locations');
    console.error('Looked for: openapi.{yaml,yml,json}, swagger.{yaml,yml,json}');
    console.error('In directories: root, /api, /docs, /spec, /.openapi');
    process.exit(1);
}

// Validate the first found file
const specFile = foundFiles[0];

async function validateSpec() {
    try {
        // Try to load swagger-parser
        const SwaggerParser = (await import('@apidevtools/swagger-parser')).default;

        // Parse and validate the OpenAPI spec
        const api = await SwaggerParser.validate(specFile.fullPath);

        // Extract useful information
        const version = api.openapi || api.swagger || 'unknown';
        const pathCount = api.paths ? Object.keys(api.paths).length : 0;
        const title = api.info?.title || 'Untitled API';
        const apiVersion = api.info?.version || 'unknown';

        // Count total operations (GET, POST, PUT, DELETE, etc.)
        let operationCount = 0;
        if (api.paths) {
            for (const pathItem of Object.values(api.paths)) {
                const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];
                for (const method of methods) {
                    if (pathItem[method]) {
                        operationCount++;
                    }
                }
            }
        }

        console.log(`OpenAPI specification found and validated: ${specFile.path}`);
        console.log(`Title: ${title} (v${apiVersion})`);
        console.log(`OpenAPI version: ${version}`);
        console.log(`Endpoints: ${pathCount} paths, ${operationCount} operations`);

        if (foundFiles.length > 1) {
            console.log(`Note: ${foundFiles.length} OpenAPI files found, validated the first one`);
        }

        process.exit(0);
    } catch (error) {
        console.error(`OpenAPI specification found but validation failed: ${specFile.path}`);
        console.error(`Error: ${error.message}`);

        // If it's a schema validation error, show more details
        if (error.details) {
            console.error('Validation details:');
            error.details.forEach((detail, index) => {
                console.error(`  ${index + 1}. ${detail.message || detail}`);
            });
        }

        process.exit(1);
    }
}

// Run validation
validateSpec().catch(error => {
    console.error(`Unexpected error during validation: ${error.message}`);
    process.exit(1);
});
