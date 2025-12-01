/**
 * Service modal stats component
 * @module ui/modals/service/stats
 */

import { escapeHtml, formatDate, formatRelativeTime } from '../../../utils/formatting.js';
import { getTeamName } from '../../../utils/team-statistics.js';

/**
 * Renders modal stats section
 * @param {Object} data - Service data
 * @returns {string} HTML for modal stats
 */
export function renderModalStats(data) {
    // Count excluded checks from checks array
    const excludedCount = data.checks ? data.checks.filter(c => c.status === 'excluded').length : 0;

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
            ${excludedCount > 0 ? `
            <div class="modal-stat-item">
                <div class="modal-stat-value modal-stat-excluded">${excludedCount}</div>
                <div class="modal-stat-label">Excluded</div>
            </div>
            ` : ''}
        </div>

        ${getTeamName(data.service) ? `<p><strong>Team:</strong> ${escapeHtml(getTeamName(data.service))}</p>` : ''}
        <p><strong>Last Run:</strong> ${formatDate(data.timestamp)}</p>
        ${data.commit_sha ? `<p><strong>Commit:</strong> <code>${data.commit_sha.substring(0, 7)}</code></p>` : ''}
        ${data.recent_contributors && data.recent_contributors.length > 0 && data.recent_contributors[0].last_commit_hash ? `<p><strong>Last Commit:</strong> <code>${data.recent_contributors[0].last_commit_hash}</code></p>` : ''}
        ${data.installation_pr && data.installation_pr.updated_at ? `
        <p><strong>PR Status Updated:</strong> ${formatRelativeTime(data.installation_pr.updated_at)}
            <span class="tab-section-description" style="font-size: 0.9em;" title="${new Date(data.installation_pr.updated_at).toLocaleString()}">(${new Date(data.installation_pr.updated_at).toLocaleString()})</span>
        </p>
        ` : ''}
    `;
}
