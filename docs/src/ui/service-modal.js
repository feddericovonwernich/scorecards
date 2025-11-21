/**
 * Service Modal Management
 * Handles showing service details, refreshing data, and tab switching
 */

import { escapeHtml, formatDate, formatRelativeTime, capitalize } from '../utils/formatting.js';
import { isServiceStale } from '../services/staleness.js';
import { md5 } from '../utils/crypto.js';

/**
 * Renders staleness warning banner
 * @param {boolean} isStale - Whether service is stale
 * @param {boolean} canTrigger - Whether re-run button should be shown
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 * @returns {string} HTML for staleness warning
 */
function renderStalenessWarning(isStale, canTrigger, org, repo) {
    if (!isStale) return '';

    return `
        <div style="background: #fff3cd; border: 1px solid #f39c12; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5rem;">⚠️</span>
                <div style="flex: 1;">
                    <strong style="color: #856404;">Scorecard is Stale</strong>
                    <p style="margin: 5px 0 0 0; color: #856404;">
                        This scorecard was generated with an older version of the check suite.
                        New checks may have been added or existing checks may have been modified.
                        ${canTrigger ? 'Click the "Re-run Scorecard" button to get up-to-date results.' : 'Re-run the scorecard workflow to get up-to-date results.'}
                    </p>
                </div>
                ${canTrigger ? `
                <button
                    id="modal-trigger-btn"
                    class="trigger-btn"
                    onclick="triggerServiceWorkflow('${escapeHtml(org)}', '${escapeHtml(repo)}', this)"
                    style="margin-left: auto;">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
                        <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path>
                    </svg>
                    Re-run Scorecard
                </button>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Renders modal header with title, org/repo, and action buttons
 * @param {Object} data - Service data
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 * @returns {string} HTML for modal header
 */
function renderModalHeader(data, org, repo) {
    return `
        <div class="rank-badge modal-header-badge ${data.rank}">
            ${capitalize(data.rank)}
        </div>

        <h2>${escapeHtml(data.service.name)}</h2>
        <p style="color: #7f8c8d; margin-bottom: 10px;">
            ${escapeHtml(data.service.org)}/${escapeHtml(data.service.repo)}
        </p>
        <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
            <a href="https://github.com/${escapeHtml(data.service.org)}/${escapeHtml(data.service.repo)}"
               target="_blank"
               rel="noopener noreferrer"
               class="github-button">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                </svg>
                View on GitHub
            </a>
            <button
                id="modal-refresh-btn"
                class="github-button"
                onclick="refreshServiceData('${escapeHtml(org)}', '${escapeHtml(repo)}')"
                title="Refresh service data">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path>
                </svg>
                Refresh Data
            </button>
            ${!data.installed && data.installation_pr && data.installation_pr.state === 'OPEN' ? `
            <a href="${escapeHtml(data.installation_pr.url)}"
               target="_blank"
               rel="noopener noreferrer"
               class="pr-button pr-button-open">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/>
                </svg>
                Open Installation PR #${data.installation_pr.number}
            </a>
            ` : ''}
            ${!data.installed && (!data.installation_pr || data.installation_pr.state === 'MERGED' || data.installation_pr.state === 'CLOSED') ? `
            <button
                id="install-btn"
                class="install-button"
                onclick="installService('${escapeHtml(org)}', '${escapeHtml(repo)}', this)"
                title="${data.installation_pr ? `Previous PR #${data.installation_pr.number} was ${data.installation_pr.state.toLowerCase()}` : 'Create installation PR'}">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
                    <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"></path>
                    <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"></path>
                </svg>
                ${data.installation_pr ? 'Re-create' : 'Install'} Scorecards
            </button>
            ` : ''}
        </div>
    `;
}

/**
 * Renders modal stats section
 * @param {Object} data - Service data
 * @returns {string} HTML for modal stats
 */
function renderModalStats(data) {
    return `
        <div class="modal-stats-container">
            <div class="modal-stat-item">
                <div class="modal-stat-value">${data.score}</div>
                <div class="modal-stat-label">Score</div>
            </div>
            <div class="modal-stat-item">
                <div class="modal-stat-value">${data.passed_checks}/${data.total_checks}</div>
                <div class="modal-stat-label">Checks Passed</div>
            </div>
        </div>

        ${data.service.team ? `<p><strong>Team:</strong> ${escapeHtml(data.service.team)}</p>` : ''}
        <p><strong>Last Run:</strong> ${formatDate(data.timestamp)}</p>
        ${data.commit_sha ? `<p><strong>Commit:</strong> <code>${data.commit_sha.substring(0, 7)}</code></p>` : ''}
        ${data.recent_contributors && data.recent_contributors.length > 0 && data.recent_contributors[0].last_commit_hash ? `<p><strong>Last Commit:</strong> <code>${data.recent_contributors[0].last_commit_hash}</code></p>` : ''}
        ${data.installation_pr && data.installation_pr.updated_at ? `
        <p><strong>PR Status Updated:</strong> ${formatRelativeTime(data.installation_pr.updated_at)}
            <span style="color: #999; font-size: 0.9em;" title="${new Date(data.installation_pr.updated_at).toLocaleString()}">(${new Date(data.installation_pr.updated_at).toLocaleString()})</span>
        </p>
        ` : ''}
    `;
}

/**
 * Renders tab navigation
 * @param {Object} data - Service data
 * @returns {string} HTML for tabs
 */
function renderTabs(data) {
    return `
        <div class="tabs" style="margin-top: 30px;">
            <button class="tab-btn active" onclick="switchTab(event, 'checks')">Check Results</button>
            ${data.service.openapi ? '<button class="tab-btn" onclick="switchTab(event, \'api\')">API Specification</button>' : ''}
            ${data.service.links && data.service.links.length > 0 ? `<button class="tab-btn" onclick="switchTab(event, 'links')">Links (${data.service.links.length})</button>` : ''}
            ${data.recent_contributors && data.recent_contributors.length > 0 ? '<button class="tab-btn" onclick="switchTab(event, \'contributors\')">Contributors</button>' : ''}
            <button class="tab-btn" onclick="switchTab(event, 'workflows')">Workflow Runs</button>
            <button class="tab-btn" onclick="switchTab(event, 'badges')">Badges</button>
        </div>
    `;
}

/**
 * Groups checks by category (read from check metadata)
 * @param {Array} checks - Array of check results
 * @returns {Object} Object with category names as keys and arrays of checks as values
 */
function groupChecksByCategory(checks) {
    const categories = {};

    checks.forEach(check => {
        // Read category from check metadata, default to 'Other' if missing
        const category = check.category || 'Other';
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(check);
    });

    // Define category order for consistent display
    const categoryOrder = [
        'Scorecards Setup',
        'Documentation',
        'Testing & CI',
        'Configuration & Compliance',
        'Other'
    ];

    // Return categories in defined order (case-insensitive matching)
    const orderedCategories = {};
    categoryOrder.forEach(category => {
        // Find matching category key (case-insensitive)
        const matchingKey = Object.keys(categories).find(
            key => key.toLowerCase() === category.toLowerCase()
        );
        if (matchingKey) {
            orderedCategories[category] = categories[matchingKey];
        }
    });

    return orderedCategories;
}

/**
 * Renders a single check result
 * @param {Object} check - Check result object
 * @returns {string} HTML for check result
 */
function renderCheck(check) {
    return `
        <div class="check-result ${check.status}">
            <div class="check-name">
                ${check.status === 'pass' ? '✓' : '✗'} ${escapeHtml(check.name)}
            </div>
            <div class="check-description">${escapeHtml(check.description)}</div>
            ${check.stdout.trim() ? `
                <div class="check-output">
                    <strong>Output:</strong><br>
                    ${escapeHtml(check.stdout.trim())}
                </div>
            ` : ''}
            ${check.stderr.trim() && check.status === 'fail' ? `
                <div class="check-output" style="color: #c62828;">
                    <strong>Error:</strong><br>
                    ${escapeHtml(check.stderr.trim())}
                </div>
            ` : ''}
            <div style="margin-top: 8px; font-size: 0.85rem; color: #999;">
                Weight: ${check.weight} | Duration: ${check.duration}s
            </div>
        </div>
    `;
}

/**
 * Renders checks tab content with collapsible category grouping
 * @param {Array} checks - Array of check results
 * @returns {string} HTML for checks tab
 */
function renderChecksTab(checks) {
    const categorizedChecks = groupChecksByCategory(checks);

    return `
        <div class="tab-content active" id="checks-tab">
            <div class="check-categories">
                ${Object.entries(categorizedChecks).map(([category, categoryChecks]) => {
                    const passCount = categoryChecks.filter(c => c.status === 'pass').length;
                    const totalCount = categoryChecks.length;
                    const allPassed = passCount === totalCount;

                    return `
                        <details class="check-category" open>
                            <summary class="check-category-header">
                                <span class="category-arrow">▼</span>
                                <span class="category-name">${category}</span>
                                <span class="category-stats ${allPassed ? 'all-passed' : 'has-failures'}">
                                    ${passCount}/${totalCount} passed
                                </span>
                            </summary>
                            <div class="check-category-content">
                                ${categoryChecks.map(check => renderCheck(check)).join('')}
                            </div>
                        </details>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

/**
 * Renders API specification tab content
 * @param {Object} openapi - OpenAPI specification data
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 * @returns {string} HTML for API tab
 */
function renderAPITab(openapi, org, repo) {
    if (!openapi) return '';

    return `
        <div class="tab-content" id="api-tab">
            <div style="margin-bottom: 20px;">
                <h3 style="margin-bottom: 10px;">OpenAPI Specification</h3>
                ${openapi.spec_file ? `<p><strong>Spec File:</strong> <code>${escapeHtml(openapi.spec_file)}</code></p>` : ''}

                ${openapi.environments ? `
                    <h4 style="margin-top: 20px; margin-bottom: 10px;">Environments</h4>
                    <div style="display: grid; gap: 12px;">
                        ${Object.entries(openapi.environments).map(([envName, envConfig]) => `
                            <div style="border: 1px solid #e1e4e8; border-radius: 8px; padding: 15px; background: #f6f8fa;">
                                <div style="font-weight: bold; margin-bottom: 5px; text-transform: capitalize;">${escapeHtml(envName)}</div>
                                <div style="font-family: monospace; font-size: 0.9rem; color: #0366d6; margin-bottom: 5px;">
                                    ${escapeHtml(envConfig.base_url)}
                                </div>
                                ${envConfig.description ? `<div style="font-size: 0.85rem; color: #586069;">${escapeHtml(envConfig.description)}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <div style="margin-top: 20px;">
                    <button
                        onclick="openApiExplorer('${escapeHtml(org)}', '${escapeHtml(repo)}')"
                        style="background: #0366d6; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: 500;"
                        onmouseover="this.style.background='#0256c2'"
                        onmouseout="this.style.background='#0366d6'"
                    >
                        🔍 Open API Explorer
                    </button>
                    <p style="margin-top: 10px; font-size: 0.85rem; color: #586069;">
                        Explore and test the API with an interactive Swagger UI interface
                    </p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders links tab content
 * @param {Array} links - Array of link objects
 * @returns {string} HTML for links tab
 */
function renderLinksTab(links) {
    if (!links || links.length === 0) return '';

    return `
        <div class="tab-content" id="links-tab">
            <ul class="link-list">
                ${links.map(link => `
                    <li class="link-item">
                        <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="flex-shrink: 0; margin-right: 8px;">
                                <path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path>
                            </svg>
                            <div class="link-content">
                                <strong class="link-name">${escapeHtml(link.name)}</strong>
                                ${link.description ? `<p class="link-description">${escapeHtml(link.description)}</p>` : ''}
                            </div>
                        </a>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
}

/**
 * Renders contributors tab content
 * @param {Array} contributors - Array of contributor objects
 * @returns {string} HTML for contributors tab
 */
function renderContributorsTab(contributors) {
    if (!contributors || contributors.length === 0) return '';

    return `
        <div class="tab-content" id="contributors-tab">
            <h4 style="margin-top: 0; margin-bottom: 15px; font-size: 1rem; color: #2c3e50;">
                Recent Contributors (Last 20 Commits)
            </h4>
            <p style="margin-bottom: 20px; color: #7f8c8d; font-size: 0.9rem;">
                Contributors who have committed to this repository recently, ordered by commit count.
            </p>
            <div class="contributors-list">
                ${contributors.map(contributor => {
                    const emailHash = md5(contributor.email.toLowerCase().trim());
                    const avatarUrl = `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=48`;
                    const githubUsername = contributor.email.split('@')[0].replace(/[^a-zA-Z0-9-]/g, '');
                    const isGithubEmail = contributor.email.includes('github') || contributor.email.includes('users.noreply.github.com');

                    return `
                        <div class="contributor-item">
                            <img src="${avatarUrl}"
                                 alt="${escapeHtml(contributor.name)}"
                                 class="contributor-avatar"
                                 onerror="this.src='https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=48'"
                            >
                            <div class="contributor-info">
                                <div class="contributor-name">
                                    <strong>${escapeHtml(contributor.name)}</strong>
                                    ${isGithubEmail ?
                                        `<a href="https://github.com/${githubUsername}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="contributor-github-link"
                                            title="View GitHub profile">
                                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                                            </svg>
                                        </a>`
                                        : ''}
                                </div>
                                <div class="contributor-email">${escapeHtml(contributor.email)}</div>
                                <div class="contributor-meta">
                                    <span class="contributor-commits" title="${contributor.commit_count} commit${contributor.commit_count !== 1 ? 's' : ''}">
                                        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: middle; margin-right: 4px;">
                                            <path d="M1.643 3.143.427 1.927A.25.25 0 0 1 .604 1.5h6.792a.25.25 0 0 1 .177.427L6.357 3.143a.25.25 0 0 1-.177.073H1.82a.25.25 0 0 1-.177-.073ZM2.976 7.5A2.5 2.5 0 0 1 0 7.5v-2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v2a2.5 2.5 0 0 1-2.024 0Zm1.524-.5h-3v.25a1.5 1.5 0 0 0 3 0V7ZM8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
                                        </svg>
                                        ${contributor.commit_count} commit${contributor.commit_count !== 1 ? 's' : ''}
                                    </span>
                                    <span class="contributor-date" title="${new Date(contributor.last_commit_date).toLocaleString()}">
                                        Last commit: ${formatDate(contributor.last_commit_date)}
                                    </span>
                                    <span class="contributor-hash">
                                        <code>${contributor.last_commit_hash}</code>
                                    </span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

/**
 * Renders workflows tab content
 * @returns {string} HTML for workflows tab
 */
function renderWorkflowsTab() {
    return `
        <div class="tab-content" id="workflows-tab">
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div class="widget-filters" style="margin: 0;">
                        <button class="widget-filter-btn active" data-status="all" onclick="filterServiceWorkflows('all')">
                            All <span class="filter-count" id="service-filter-count-all">0</span>
                        </button>
                        <button class="widget-filter-btn" data-status="in_progress" onclick="filterServiceWorkflows('in_progress')">
                            In Progress <span class="filter-count" id="service-filter-count-in_progress">0</span>
                        </button>
                        <button class="widget-filter-btn" data-status="queued" onclick="filterServiceWorkflows('queued')">
                            Queued <span class="filter-count" id="service-filter-count-queued">0</span>
                        </button>
                        <button class="widget-filter-btn" data-status="completed" onclick="filterServiceWorkflows('completed')">
                            Completed <span class="filter-count" id="service-filter-count-completed">0</span>
                        </button>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <select id="service-workflow-interval-select" class="widget-interval-select" onchange="changeServicePollingInterval()" title="Auto-refresh interval">
                            <option value="5000">5s</option>
                            <option value="10000">10s</option>
                            <option value="15000">15s</option>
                            <option value="30000" selected>30s</option>
                            <option value="60000">1m</option>
                            <option value="120000">2m</option>
                            <option value="300000">5m</option>
                            <option value="0">Off</option>
                        </select>
                        <button id="service-workflow-refresh" class="widget-refresh-btn" onclick="refreshServiceWorkflowRuns()" title="Refresh" style="padding: 6px 10px;">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div id="service-workflows-content">
                <div class="loading">Click to load workflow runs...</div>
            </div>
        </div>
    `;
}

/**
 * Renders badges tab content
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 * @returns {string} HTML for badges tab
 */
function renderBadgesTab(org, repo) {
    return `
        <div class="tab-content" id="badges-tab">
            <h4 style="margin-top: 0; margin-bottom: 15px; font-size: 1rem; color: #2c3e50;">Badge Preview</h4>
            <div style="background: #f5f7fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <img src="https://img.shields.io/endpoint?url=${RAW_BASE_URL}/badges/${org}/${repo}/score.json" alt="Score Badge" style="height: 20px;">
                <img src="https://img.shields.io/endpoint?url=${RAW_BASE_URL}/badges/${org}/${repo}/rank.json" alt="Rank Badge" style="height: 20px;">
            </div>

            <h4 style="margin-bottom: 10px; font-size: 1rem; color: #2c3e50;">Add to Your README</h4>
            <p style="font-size: 0.9rem; color: #7f8c8d; margin-bottom: 10px;">
                Copy the markdown below:
            </p>

            <div style="position: relative; margin-bottom: 15px;">
                <button onclick="copyBadgeCode('score-badge-${org}-${repo}', event)" style="position: absolute; right: 10px; top: 10px; background: #3498db; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; z-index: 1;" onmouseover="this.style.background='#2980b9'" onmouseout="this.style.background='#3498db'">Copy</button>
                <pre id="score-badge-${org}-${repo}" style="background: #f5f7fa; padding: 15px; padding-right: 80px; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; margin: 0;">![Score](https://img.shields.io/endpoint?url=${RAW_BASE_URL}/badges/${org}/${repo}/score.json)</pre>
            </div>

            <div style="position: relative;">
                <button onclick="copyBadgeCode('rank-badge-${org}-${repo}', event)" style="position: absolute; right: 10px; top: 10px; background: #3498db; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; z-index: 1;" onmouseover="this.style.background='#2980b9'" onmouseout="this.style.background='#3498db'">Copy</button>
                <pre id="rank-badge-${org}-${repo}" style="background: #f5f7fa; padding: 15px; padding-right: 80px; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; margin: 0;">![Rank](https://img.shields.io/endpoint?url=${RAW_BASE_URL}/badges/${org}/${repo}/rank.json)</pre>
            </div>
        </div>
    `;
}

/**
 * Shows service detail modal
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 * @returns {Promise<void>}
 */
export async function showServiceDetail(org, repo) {
    const modal = document.getElementById('service-modal');
    const detailDiv = document.getElementById('service-detail');

    // Store current service context for workflow runs
    currentServiceOrg = org;
    currentServiceRepo = repo;
    serviceWorkflowLoaded = false;

    modal.classList.remove('hidden');
    detailDiv.innerHTML = '<div class="loading">Loading service details...</div>';

    try {
        // Fetch both results and registry in parallel using hybrid approach
        const resultsPath = `results/${org}/${repo}/results.json`;
        const registryPath = `registry/${org}/${repo}.json`;

        const [resultsData, registryData] = await Promise.all([
            fetchWithHybridAuth(resultsPath),
            fetchWithHybridAuth(registryPath)
        ]);

        const resultsRes = resultsData.response;
        const registryRes = registryData.response;

        if (!resultsRes.ok) {
            throw new Error(`Failed to fetch results: ${resultsRes.status}`);
        }

        const data = await resultsRes.json();

        // Merge installation_pr from registry if available
        if (registryRes.ok) {
            const registry = await registryRes.json();
            if (registry.installation_pr) {
                data.installation_pr = registry.installation_pr;
            }
        }

        // Check staleness
        const isStale = isServiceStale(data, currentChecksHash);
        const canTrigger = isStale && data.installed;

        // Compose modal HTML using helper functions
        detailDiv.innerHTML =
            renderModalHeader(data, org, repo) +
            renderStalenessWarning(isStale, canTrigger, org, repo) +
            renderModalStats(data) +
            renderTabs(data) +
            renderChecksTab(data.checks) +
            renderAPITab(data.service.openapi, org, repo) +
            renderLinksTab(data.service.links) +
            renderContributorsTab(data.recent_contributors) +
            renderWorkflowsTab() +
            renderBadgesTab(org, repo);

        // Initialize service workflow polling interval dropdown with saved preference
        const savedInterval = localStorage.getItem('service_workflow_poll_interval');
        if (savedInterval !== null) {
            serviceWorkflowPollIntervalTime = parseInt(savedInterval);
            const select = document.getElementById('service-workflow-interval-select');
            if (select) {
                select.value = savedInterval;
            }
        }

    } catch (error) {
        console.error('Error loading service details:', error);
        detailDiv.innerHTML = `
            <h3>Error Loading Details</h3>
            <p>Could not load details for ${org}/${repo}</p>
            <p style="color: #999; font-size: 0.9rem;">${error.message}</p>
        `;
    }
}

/**
 * Refreshes service data in the modal
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 * @returns {Promise<void>}
 */
export async function refreshServiceData(org, repo) {
    const button = document.getElementById('modal-refresh-btn');
    if (!button) return;

    // Get current active tab to preserve state
    const activeTab = document.querySelector('.tab-btn.active');
    const activeTabName = activeTab ? activeTab.textContent.trim().toLowerCase().replace(/\s+/g, '-') : 'check-results';

    // Add spinning animation
    const svg = button.querySelector('svg');
    const originalContent = button.innerHTML;
    if (svg) {
        svg.style.animation = 'spin 1s linear infinite';
    }
    button.disabled = true;

    try {
        // Fetch both results and registry with cache bypass
        const resultsPath = `results/${org}/${repo}/results.json`;
        const registryPath = `registry/${org}/${repo}.json`;

        const [resultsData, registryData] = await Promise.all([
            fetchWithHybridAuth(resultsPath),
            fetchWithHybridAuth(registryPath)
        ]);

        const resultsRes = resultsData.response;
        const registryRes = registryData.response;

        if (!resultsRes.ok) {
            throw new Error(`Failed to fetch results: ${resultsRes.status}`);
        }

        const data = await resultsRes.json();

        // Merge installation_pr from registry if available
        if (registryRes.ok) {
            const registry = await registryRes.json();
            if (registry.installation_pr) {
                data.installation_pr = registry.installation_pr;
            }
        }

        // Re-render the modal (reuse showServiceDetail logic)
        const detailDiv = document.getElementById('service-detail');

        // Store current service context
        currentServiceOrg = org;
        currentServiceRepo = repo;

        // Check staleness
        const isStale = isServiceStale(data, currentChecksHash);
        const canTrigger = isStale && data.installed;

        // Regenerate modal content using helper functions
        detailDiv.innerHTML =
            renderModalHeader(data, org, repo) +
            renderStalenessWarning(isStale, canTrigger, org, repo) +
            renderModalStats(data) +
            renderTabs(data) +
            renderChecksTab(data.checks) +
            renderAPITab(data.service.openapi, org, repo) +
            renderLinksTab(data.service.links) +
            renderContributorsTab(data.recent_contributors) +
            renderWorkflowsTab() +
            renderBadgesTab(org, repo);

        // Re-initialize interval dropdown with saved preference
        const savedInterval = localStorage.getItem('service_workflow_poll_interval');
        if (savedInterval !== null) {
            serviceWorkflowPollIntervalTime = parseInt(savedInterval);
            const select = document.getElementById('service-workflow-interval-select');
            if (select) {
                select.value = savedInterval;
            }
        }

        showToast('Service data refreshed', 'success');

        // Restore previously active tab if it exists
        setTimeout(() => {
            const tabButtons = document.querySelectorAll('.tab-btn');
            for (const btn of tabButtons) {
                const btnText = btn.textContent.trim().toLowerCase().replace(/\s+/g, '-');
                if (btnText === activeTabName) {
                    btn.click();
                    break;
                }
            }
        }, 100);

    } catch (error) {
        console.error('Error refreshing service data:', error);
        showToast(`Failed to refresh service data: ${error.message}`, 'error');
    } finally {
        // Remove spinning animation and re-enable button
        if (button) {
            button.disabled = false;
            button.innerHTML = originalContent;
        }
    }
}

/**
 * Closes the service modal
 */
export function closeModal() {
    document.getElementById('service-modal').classList.add('hidden');

    // Clean up service workflow polling
    if (serviceWorkflowPollInterval) {
        clearInterval(serviceWorkflowPollInterval);
        serviceWorkflowPollInterval = null;
    }

    // Clean up service duration updates
    if (serviceDurationUpdateInterval) {
        clearInterval(serviceDurationUpdateInterval);
        serviceDurationUpdateInterval = null;
    }

    // Reset service workflow state
    currentServiceOrg = null;
    currentServiceRepo = null;
    serviceWorkflowRuns = [];
    serviceWorkflowLoaded = false;
    serviceWorkflowFilterStatus = 'all';
}

/**
 * Switches between tabs in the service modal
 * @param {Event} event - Click event
 * @param {string} tabName - Tab name to switch to
 */
export function switchTab(event, tabName) {
    // Remove active class from all tab buttons and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to clicked button and corresponding content
    event.target.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Lazy load workflow runs when workflows tab is opened
    if (tabName === 'workflows' && !serviceWorkflowLoaded) {
        loadWorkflowRunsForService();
    }
}
