/**
 * Service modal header components
 * @module ui/modals/service/header
 */

import { escapeHtml, capitalize } from '../../../utils/formatting.js';

/**
 * Renders staleness warning banner
 * @param {boolean} isStale - Whether service is stale
 * @param {boolean} canTrigger - Whether re-run button should be shown
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 * @returns {string} HTML for staleness warning
 */
export function renderStalenessWarning(isStale, canTrigger, org, repo) {
    if (!isStale) {return '';}

    return `
        <div class="stale-warning">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5rem;">⚠️</span>
                <div style="flex: 1;">
                    <strong class="stale-warning-text">Scorecard is Stale</strong>
                    <p class="stale-warning-text" style="margin: 5px 0 0 0;">
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
 * Renders on-demand trigger button for non-stale installed services
 * @param {boolean} isInstalled - Whether service is installed
 * @param {boolean} isStale - Whether service is stale
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 * @returns {string} HTML for on-demand trigger button
 */
export function renderOnDemandTrigger(isInstalled, isStale, org, repo) {
    // Only show for installed services that are NOT stale
    // (Stale services get the trigger button in the staleness warning instead)
    if (!isInstalled || isStale) {return '';}

    return `
        <button
            id="modal-trigger-btn"
            class="trigger-btn trigger-btn-neutral"
            onclick="triggerServiceWorkflow('${escapeHtml(org)}', '${escapeHtml(repo)}', this)"
            title="Run scorecard workflow on-demand">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
                <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path>
            </svg>
            Run Scorecard
        </button>
    `;
}

/**
 * Renders modal header with title, org/repo, and action buttons
 * @param {Object} data - Service data
 * @param {string} org - Organization name
 * @param {string} repo - Repository name
 * @param {boolean} isInstalled - Whether service is installed
 * @param {boolean} isStale - Whether service is stale
 * @returns {string} HTML for modal header
 */
export function renderModalHeader(data, org, repo, isInstalled, isStale) {
    return `
        <div class="rank-badge modal-header-badge ${data.rank}">
            ${capitalize(data.rank)}
        </div>

        <h2>${escapeHtml(data.service.name)}</h2>
        <p class="tab-section-description">
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
            ${renderOnDemandTrigger(isInstalled, isStale, org, repo)}
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
