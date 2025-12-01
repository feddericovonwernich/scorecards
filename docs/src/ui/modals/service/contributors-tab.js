/**
 * Service modal contributors tab component
 * @module ui/modals/service/contributors-tab
 */

import { escapeHtml, formatDate } from '../../../utils/formatting.js';
import { md5 } from '../../../utils/crypto.js';

/**
 * Renders contributors tab content
 * @param {Array} contributors - Array of contributor objects
 * @returns {string} HTML for contributors tab
 */
export function renderContributorsTab(contributors) {
    if (!contributors || contributors.length === 0) {return '';}

    return `
        <div class="tab-content" id="contributors-tab">
            <h4 class="tab-section-header">
                Recent Contributors (Last 20 Commits)
            </h4>
            <p class="tab-section-description" style="margin-bottom: 20px;">
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
