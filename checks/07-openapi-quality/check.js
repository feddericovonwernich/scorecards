#!/usr/bin/env node
/* eslint-disable no-console */
// Check: OpenAPI Quality Metrics

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
    console.error('No OpenAPI specification file found - cannot assess quality');
    console.error('This check requires a valid OpenAPI file (checked by 06-openapi-spec)');
    process.exit(1);
}

const specFile = foundFiles[0];

async function assessQuality() {
    try {
        const SwaggerParser = (await import('@apidevtools/swagger-parser')).default;

        // Parse the OpenAPI spec (validation happens in check 06)
        const api = await SwaggerParser.parse(specFile.fullPath);

        // Quality metrics
        const metrics = {
            operations: { total: 0, withDescription: 0, withExamples: 0, withTags: 0 },
            parameters: { total: 0, withDescription: 0, withExamples: 0 },
            responses: { total: 0, withDescription: 0, withExamples: 0 },
            schemas: { total: 0, withDescription: 0, withExamples: 0 },
            security: { defined: false, applied: false },
            info: {
                hasDescription: false,
                hasContact: false,
                hasLicense: false
            }
        };

        // Check info section
        if (api.info) {
            metrics.info.hasDescription = !!api.info.description && api.info.description.length > 20;
            metrics.info.hasContact = !!api.info.contact;
            metrics.info.hasLicense = !!api.info.license;
        }

        // Check security definitions
        if (api.components?.securitySchemes || api.securityDefinitions) {
            metrics.security.defined = true;
        }
        if (api.security && api.security.length > 0) {
            metrics.security.applied = true;
        }

        // Analyze paths and operations
        if (api.paths) {
            for (const [, pathItem] of Object.entries(api.paths)) {
                const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];

                for (const method of methods) {
                    const operation = pathItem[method];
                    if (operation) {
                        metrics.operations.total++;

                        // Check operation description
                        if (operation.description || operation.summary) {
                            metrics.operations.withDescription++;
                        }

                        // Check operation tags
                        if (operation.tags && operation.tags.length > 0) {
                            metrics.operations.withTags++;
                        }

                        // Check for examples in request body
                        if (operation.requestBody?.content) {
                            for (const mediaType of Object.values(operation.requestBody.content)) {
                                if (mediaType.example || mediaType.examples) {
                                    metrics.operations.withExamples++;
                                    break;
                                }
                            }
                        }

                        // Analyze parameters
                        if (operation.parameters) {
                            for (const param of operation.parameters) {
                                metrics.parameters.total++;
                                if (param.description) {
                                    metrics.parameters.withDescription++;
                                }
                                if (param.example || param.examples) {
                                    metrics.parameters.withExamples++;
                                }
                            }
                        }

                        // Analyze responses
                        if (operation.responses) {
                            for (const [, response] of Object.entries(operation.responses)) {
                                metrics.responses.total++;
                                if (response.description) {
                                    metrics.responses.withDescription++;
                                }
                                if (response.content) {
                                    for (const mediaType of Object.values(response.content)) {
                                        if (mediaType.example || mediaType.examples) {
                                            metrics.responses.withExamples++;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Analyze schemas
        const schemas = api.components?.schemas || api.definitions || {};
        for (const [, schema] of Object.entries(schemas)) {
            metrics.schemas.total++;
            if (schema.description) {
                metrics.schemas.withDescription++;
            }
            if (schema.example || schema.examples) {
                metrics.schemas.withExamples++;
            }
        }

        // Calculate quality score (0-100)
        let qualityScore = 0;

        // Info section quality (15 points)
        if (metrics.info.hasDescription) {qualityScore += 5;}
        if (metrics.info.hasContact) {qualityScore += 5;}
        if (metrics.info.hasLicense) {qualityScore += 5;}

        // Operation documentation (35 points)
        if (metrics.operations.total > 0) {
            const opDescPct = metrics.operations.withDescription / metrics.operations.total;
            const opTagsPct = metrics.operations.withTags / metrics.operations.total;
            const opExamplesPct = metrics.operations.withExamples / metrics.operations.total;
            qualityScore += Math.round(opDescPct * 20); // 20 points for descriptions
            qualityScore += Math.round(opTagsPct * 10); // 10 points for tags
            qualityScore += Math.round(opExamplesPct * 5); // 5 points for examples
        }

        // Parameter documentation (15 points)
        if (metrics.parameters.total > 0) {
            const paramDescPct = metrics.parameters.withDescription / metrics.parameters.total;
            qualityScore += Math.round(paramDescPct * 15);
        }

        // Response documentation (15 points)
        if (metrics.responses.total > 0) {
            const respDescPct = metrics.responses.withDescription / metrics.responses.total;
            qualityScore += Math.round(respDescPct * 15);
        }

        // Schema documentation (10 points)
        if (metrics.schemas.total > 0) {
            const schemaDescPct = metrics.schemas.withDescription / metrics.schemas.total;
            qualityScore += Math.round(schemaDescPct * 10);
        }

        // Security (10 points)
        if (metrics.security.defined) {qualityScore += 5;}
        if (metrics.security.applied) {qualityScore += 5;}

        // Quality threshold: 60% (good documentation practices)
        const threshold = 60;
        const passed = qualityScore >= threshold;

        // Output results
        console.log(`OpenAPI Quality Score: ${qualityScore}/100`);
        console.log('');
        console.log('Quality Metrics:');
        console.log(`  Info: ${[
            metrics.info.hasDescription ? '✓ description' : '✗ description',
            metrics.info.hasContact ? '✓ contact' : '✗ contact',
            metrics.info.hasLicense ? '✓ license' : '✗ license'
        ].join(', ')}`);

        if (metrics.operations.total > 0) {
            console.log(`  Operations: ${metrics.operations.total} total`);
            console.log(`    - ${metrics.operations.withDescription}/${metrics.operations.total} (${Math.round(metrics.operations.withDescription / metrics.operations.total * 100)}%) with descriptions`);
            console.log(`    - ${metrics.operations.withTags}/${metrics.operations.total} (${Math.round(metrics.operations.withTags / metrics.operations.total * 100)}%) with tags`);
            console.log(`    - ${metrics.operations.withExamples}/${metrics.operations.total} (${Math.round(metrics.operations.withExamples / metrics.operations.total * 100)}%) with examples`);
        }

        if (metrics.parameters.total > 0) {
            console.log(`  Parameters: ${metrics.parameters.withDescription}/${metrics.parameters.total} (${Math.round(metrics.parameters.withDescription / metrics.parameters.total * 100)}%) with descriptions`);
        }

        if (metrics.responses.total > 0) {
            console.log(`  Responses: ${metrics.responses.withDescription}/${metrics.responses.total} (${Math.round(metrics.responses.withDescription / metrics.responses.total * 100)}%) with descriptions`);
        }

        if (metrics.schemas.total > 0) {
            console.log(`  Schemas: ${metrics.schemas.withDescription}/${metrics.schemas.total} (${Math.round(metrics.schemas.withDescription / metrics.schemas.total * 100)}%) with descriptions`);
        }

        console.log(`  Security: ${metrics.security.defined ? '✓' : '✗'} defined, ${metrics.security.applied ? '✓' : '✗'} applied`);

        if (!passed) {
            console.log('');
            console.error(`Quality score ${qualityScore} is below threshold of ${threshold}`);
            console.error('Improve documentation by adding descriptions, examples, and proper security definitions');
            process.exit(1);
        }

        console.log('');
        console.log(`Quality score meets threshold (${threshold}+)`);
        process.exit(0);
    } catch (error) {
        console.error(`Error assessing OpenAPI quality: ${error.message}`);
        process.exit(1);
    }
}

// Run quality assessment
assessQuality().catch(error => {
    console.error(`Unexpected error: ${error.message}`);
    process.exit(1);
});
