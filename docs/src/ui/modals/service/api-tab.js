/**
 * Service modal API specification tab component
 * @module ui/modals/service/api-tab
 */

import { escapeHtml } from '../../../utils/formatting.js';
import { getIcon } from '../../../config/icons.js';

/**
 * Parses summary information from check 06 stdout
 * @param {string} stdout - The stdout from check 06-openapi-spec
 * @returns {Object|null} Summary object with title, openApiVersion, paths, operations
 */
export function parseOpenAPISummary(stdout) {
    if (!stdout) {return null;}

    const titleMatch = stdout.match(/Title: (.+)/);
    const versionMatch = stdout.match(/OpenAPI version: ([\d.]+)/);
    const endpointsMatch = stdout.match(/Endpoints: (\d+) paths?, (\d+) operations?/);

    // Only return summary if we found at least some data
    if (!titleMatch && !versionMatch && !endpointsMatch) {return null;}

    return {
        title: titleMatch ? titleMatch[1].trim() : null,
        openApiVersion: versionMatch ? versionMatch[1] : null,
        paths: endpointsMatch ? parseInt(endpointsMatch[1]) : null,
        operations: endpointsMatch ? parseInt(endpointsMatch[2]) : null
    };
}

/**
 * Determines if service has OpenAPI specification
 * Checks both config-based openapi and check 06-openapi-spec results
 * @param {Object} data - Service data with checks array
 * @returns {Object} { hasSpec: boolean, specInfo: object|null, fromConfig: boolean, summary: object|null }
 */
export function getOpenAPIInfo(data) {
    // Get check 06 data for summary (used in both paths)
    const openApiCheck = data.checks?.find(c => c.check_id === '06-openapi-spec');
    const summary = openApiCheck?.status === 'pass' ? parseOpenAPISummary(openApiCheck.stdout) : null;

    // Check if config-based openapi exists
    if (data.service.openapi) {
        return {
            hasSpec: true,
            specInfo: data.service.openapi,
            fromConfig: true,
            summary
        };
    }

    // Check if 06-openapi-spec check passed (auto-detected spec without config)
    if (openApiCheck && openApiCheck.status === 'pass') {
        // Parse spec file from stdout: "OpenAPI specification found and validated: openapi.yaml"
        const match = openApiCheck.stdout?.match(/found and validated: (.+)/);
        const specFile = match ? match[1].trim() : 'openapi.yaml';

        return {
            hasSpec: true,
            specInfo: { spec_file: specFile },
            fromConfig: false,
            summary
        };
    }

    return { hasSpec: false, specInfo: null, fromConfig: false, summary: null };
}

/**
 * Renders API specification tab content
 * @param {Object} openapiInfo - OpenAPI info object from getOpenAPIInfo()
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 * @param {string} defaultBranch - Default branch name for GitHub URLs
 * @returns {string} HTML for API tab
 */
export function renderAPITab(openapiInfo, org, repo, defaultBranch) {
    if (!openapiInfo.hasSpec) {return '';}
    const { specInfo, fromConfig, summary } = openapiInfo;
    const specFile = specInfo.spec_file || 'openapi.yaml';
    const branch = defaultBranch || 'main';

    // Build GitHub URLs
    const viewUrl = `https://github.com/${org}/${repo}/blob/${branch}/${specFile}`;

    return `
        <div class="tab-content" id="api-tab">
            <div class="api-tab-content">
                <!-- Structured Summary Card -->
                <div class="api-summary-card">
                    ${summary?.title ? `
                        <div class="api-summary-title">${escapeHtml(summary.title)}</div>
                    ` : ''}

                    <div class="api-summary-meta">
                        <span class="api-meta-item">
                            <strong>File:</strong>
                            <code>${escapeHtml(specFile)}</code>
                        </span>
                        ${summary?.openApiVersion ? `
                            <span class="api-meta-item">
                                <strong>OpenAPI:</strong> ${escapeHtml(summary.openApiVersion)}
                            </span>
                        ` : ''}
                        ${summary?.paths ? `
                            <span class="api-meta-item">
                                <strong>Endpoints:</strong> ${summary.paths} path${summary.paths !== 1 ? 's' : ''}, ${summary.operations} operation${summary.operations !== 1 ? 's' : ''}
                            </span>
                        ` : ''}
                    </div>

                    <div class="api-actions">
                        <a href="${viewUrl}" target="_blank" rel="noopener noreferrer" class="github-link-button">
                            ${getIcon('github')} View on GitHub
                        </a>
                    </div>
                </div>

                <!-- Collapsible Raw Spec -->
                <details class="spec-details" data-repo="${org}/${repo}" data-branch="${branch}" data-spec-file="${specFile}">
                    <summary class="spec-summary">View Raw Specification</summary>
                    <div class="spec-content" id="spec-content-${org}-${repo}">
                        <div class="spec-loading">Loading specification...</div>
                    </div>
                </details>

                <!-- Environments section (if configured) -->
                ${specInfo.environments ? `
                    <h4 class="api-section-header">Environments</h4>
                    <div class="environments-grid">
                        ${Object.entries(specInfo.environments).map(([envName, envConfig]) => `
                            <div class="environment-card">
                                <div class="environment-card-name">${escapeHtml(envName)}</div>
                                <div class="environment-card-url">${escapeHtml(envConfig.base_url)}</div>
                                ${envConfig.description ? `<div class="environment-card-description">${escapeHtml(envConfig.description)}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>

                    <div class="api-explorer-section">
                        <button
                            onclick="openApiExplorer('${escapeHtml(org)}', '${escapeHtml(repo)}')"
                            class="api-explorer-button"
                        >
                            Open API Explorer
                        </button>
                        <p class="environment-card-description">
                            Explore and test the API with an interactive Swagger UI interface
                        </p>
                    </div>
                ` : ''}

                <!-- Hint when no environments configured -->
                ${!fromConfig ? `
                    <p class="environment-card-description api-hint">
                        Configure environments in <code>.scorecard/config.yml</code> to enable the interactive API Explorer.
                    </p>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Loads and displays the raw OpenAPI specification content
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name
 * @param {string} specFile - Path to spec file
 */
export async function loadSpecContent(org, repo, branch, specFile) {
    const containerId = `spec-content-${org}-${repo}`;
    const container = document.getElementById(containerId);
    if (!container) {return;}

    // Check if already loaded
    if (container.dataset.loaded === 'true') {return;}

    const rawUrl = `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${specFile}`;

    try {
        const response = await fetch(rawUrl);
        if (!response.ok) {throw new Error(`HTTP ${response.status}`);}
        const content = await response.text();

        container.innerHTML = `
            <div class="spec-toolbar">
                <button onclick="copySpecContent('${containerId}')" class="copy-spec-button">
                    Copy
                </button>
            </div>
            <pre class="spec-code"><code id="spec-code-${containerId}">${escapeHtml(content)}</code></pre>
        `;
        container.dataset.loaded = 'true';
    } catch (error) {
        container.innerHTML = `
            <div class="spec-error">
                <p>Failed to load spec: ${escapeHtml(error.message)}</p>
                <a href="${rawUrl}" target="_blank" rel="noopener noreferrer" class="spec-error-link">View raw file on GitHub</a>
            </div>
        `;
    }
}

/**
 * Copies the spec content to clipboard
 * @param {string} containerId - The container ID
 */
export async function copySpecContent(containerId) {
    const codeElement = document.getElementById(`spec-code-${containerId}`);
    if (!codeElement) {return;}

    try {
        await navigator.clipboard.writeText(codeElement.textContent);

        // Show feedback on copy button
        const container = document.getElementById(containerId);
        const button = container?.querySelector('.copy-spec-button');
        if (button) {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.classList.add('copied');
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        }
    } catch (error) {
        console.error('Failed to copy:', error);
    }
}

/**
 * Handles the toggle event on spec details element
 * @param {Event} e - Toggle event
 */
function handleSpecToggle(e) {
    const details = e.target;
    if (details.open) {
        const repoData = details.dataset.repo;
        const branch = details.dataset.branch;
        const specFile = details.dataset.specFile;
        if (repoData) {
            const [org, repo] = repoData.split('/');
            loadSpecContent(org, repo, branch, specFile);
        }
    }
}

/**
 * Initializes spec details toggle listeners for lazy loading
 */
export function initSpecDetailsListeners() {
    document.querySelectorAll('.spec-details').forEach(details => {
        // Remove any existing listener to avoid duplicates
        details.removeEventListener('toggle', handleSpecToggle);
        details.addEventListener('toggle', handleSpecToggle);
    });
}

// Register copySpecContent on window for onclick handlers
if (typeof window !== 'undefined') {
    window.copySpecContent = copySpecContent;
}
