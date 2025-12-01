/**
 * Service Card Renderer
 * Handles rendering of service cards in the catalog grid
 */

import { escapeHtml, formatDate, formatRelativeTime, capitalize } from '../utils/formatting.js';
import { isServiceStale } from '../services/staleness.js';
import { getTeamName } from '../utils/team-statistics.js';

/**
 * Render clickable team link
 * @param {Object} service - Service object
 * @returns {string} HTML string for team display
 */
function renderTeamLink(service) {
    const teamName = getTeamName(service);
    if (!teamName) return '';

    return `<div class="service-team">Team: <span class="service-team-link" onclick="event.stopPropagation(); window.showTeamDetail && window.showTeamDetail('${escapeHtml(teamName)}')">${escapeHtml(teamName)}</span></div>`;
}

/**
 * Renders the services grid with filtered services
 * Uses global variables: filteredServices, currentChecksHash
 * @returns {void} - Updates DOM directly
 */
export function renderServices() {
    const grid = document.getElementById('services-grid');

    if (filteredServices.length === 0) {
        grid.innerHTML = '<div class="empty-state"><h3>No services match your criteria</h3></div>';
        return;
    }

    grid.innerHTML = filteredServices.map(service => {
        const isStale = isServiceStale(service, currentChecksHash);
        const canTrigger = isStale && service.installed;
        return `
        <div class="service-card rank-${service.rank}" onclick="showServiceDetail('${service.org}', '${service.repo}')">
            <div class="service-header">
                <div>
                    <div class="service-title-wrapper">
                        <div class="service-name">${escapeHtml(service.name)}</div>
                        <div class="service-badges">
                            ${service.has_api ? '<span class="badge-api">API</span>' : ''}
                            ${isStale ? '<span class="badge-stale">STALE</span>' : ''}
                            ${service.installed ? '<span class="badge-installed">INSTALLED</span>' : ''}
                        </div>
                    </div>
                    <div class="service-org">${escapeHtml(service.org)}/${escapeHtml(service.repo)}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    ${canTrigger ? `
                    <button
                        class="trigger-btn trigger-btn-icon"
                        onclick="event.stopPropagation(); triggerServiceWorkflow('${escapeHtml(service.org)}', '${escapeHtml(service.repo)}', this)"
                        title="Re-run scorecard workflow">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path>
                        </svg>
                    </button>
                    ` : ''}
                    <a href="https://github.com/${escapeHtml(service.org)}/${escapeHtml(service.repo)}"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="github-icon-link"
                       onclick="event.stopPropagation()"
                       title="View on GitHub">
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                        </svg>
                    </a>
                    ${!service.installed && service.installation_pr ? `
                    <a href="${escapeHtml(service.installation_pr.url)}"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="pr-icon-link pr-icon-${service.installation_pr.state.toLowerCase()}"
                       onclick="event.stopPropagation()"
                       title="${service.installation_pr.state === 'OPEN' ? 'Open installation PR' : 'Closed installation PR'} #${service.installation_pr.number}">
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/>
                        </svg>
                    </a>
                    ` : ''}
                    <div class="score-badge">${service.score}</div>
                </div>
            </div>
            <div class="rank-badge ${service.rank}">${capitalize(service.rank)}</div>
            ${renderTeamLink(service)}
            <div class="service-meta">
                <div>Last updated: ${formatDate(service.last_updated)}</div>
                ${service.installation_pr && service.installation_pr.updated_at ? `
                <div class="pr-status-timestamp" title="PR status last fetched at ${new Date(service.installation_pr.updated_at).toLocaleString()}">
                    PR status: ${formatRelativeTime(service.installation_pr.updated_at)}
                </div>
                ` : ''}
            </div>
        </div>
    `;
    }).join('');
}
