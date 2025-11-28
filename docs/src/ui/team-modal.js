/**
 * Team Modal Management
 * Handles showing team details and tab switching
 */

import { capitalize, escapeHtml } from '../utils/formatting.js';
import { getTeamName, getDominantRank, calculateTeamStats } from '../utils/team-statistics.js';
import { fetchTeamMembers, getTeamUrl } from '../api/github-teams.js';
import { hasToken } from '../services/auth.js';
import { openSettings } from './settings.js';
import { getIcon } from '../config/icons.js';

/**
 * Render GitHub team section HTML
 * @param {Object} team - Team object
 * @param {Array|null} members - Array of members or null if not authenticated
 * @returns {string} HTML string
 */
function renderGitHubSection(team, members) {
    const teamUrl = getTeamUrl(team.github_org, team.github_slug);

    // Not authenticated
    if (members === null) {
        return `
            <div class="team-github-section">
                <a href="${escapeHtml(teamUrl)}" target="_blank" class="team-github-link">
                    ${getIcon('github')} ${escapeHtml(team.github_slug)}
                    ${getIcon('externalLink')}
                </a>
                <div class="team-github-signin">
                    <button class="btn-link" onclick="window.openSettingsForTeam()">
                        Sign in to view team members
                    </button>
                </div>
            </div>
        `;
    }

    // Authenticated but no members or error
    if (!members || members.length === 0) {
        return `
            <div class="team-github-section">
                <a href="${escapeHtml(teamUrl)}" target="_blank" class="team-github-link">
                    ${getIcon('github')} ${escapeHtml(team.github_slug)}
                    ${getIcon('externalLink')}
                </a>
                <div class="team-members-empty">No members found or unable to access team</div>
            </div>
        `;
    }

    // Has members
    const membersHtml = members.map(m => `
        <a href="${escapeHtml(m.url)}" target="_blank" class="team-member" title="${escapeHtml(m.login)}">
            <img src="${escapeHtml(m.avatar_url)}&s=48" alt="${escapeHtml(m.login)}" class="team-member-avatar">
            <span class="team-member-name">@${escapeHtml(m.login)}</span>
        </a>
    `).join('');

    return `
        <div class="team-github-section">
            <a href="${escapeHtml(teamUrl)}" target="_blank" class="team-github-link">
                ${getIcon('github')} ${escapeHtml(team.github_slug)}
                ${getIcon('externalLink')}
            </a>
            <div class="team-members">
                <span class="members-label">Members (${members.length}):</span>
                <div class="members-grid">
                    ${membersHtml}
                </div>
            </div>
        </div>
    `;
}

/**
 * Show team detail modal
 * @param {string} teamName - Name of the team to show
 */
export async function showTeamModal(teamName) {
    // Lazily compute team data if not already available
    if (!window.allTeams || window.allTeams.length === 0) {
        const services = window.allServices || [];
        if (services.length > 0) {
            const teamData = calculateTeamStats(services);
            window.allTeams = Object.values(teamData);
        }
    }

    const team = window.allTeams?.find(t => t.name === teamName);
    if (!team) {
        console.error('Team not found:', teamName);
        return;
    }

    // Get services for this team
    const teamServices = (window.allServices || []).filter(s =>
        getTeamName(s) === team.name
    );

    const modal = document.getElementById('team-modal');
    const content = document.getElementById('team-detail');

    if (!modal || !content) return;

    const dominantRank = getDominantRank(team);
    const rankDist = team.rankDistribution || {};

    // Build rank distribution bars
    const rankBars = ['platinum', 'gold', 'silver', 'bronze'].map(rank => {
        const count = rankDist[rank] || 0;
        const pct = team.serviceCount > 0 ? Math.round((count / team.serviceCount) * 100) : 0;
        return `
            <div class="rank-dist-row">
                <span class="rank-dist-label">${capitalize(rank)}</span>
                <div class="rank-dist-bar-container">
                    <div class="rank-dist-bar rank-${rank}" style="width: ${pct}%"></div>
                </div>
                <span class="rank-dist-count">${count}</span>
            </div>
        `;
    }).join('');

    // Build services list
    const servicesList = teamServices.map(s => {
        const score = s.score;
        const rank = s.rank;
        const scoreDisplay = score != null ? Math.round(score) : '-';
        const rankClass = rank ? `rank-${rank}` : '';
        return `
            <div class="team-service-item" onclick="window.showServiceDetail('${s.org}', '${s.repo}')">
                <span class="service-name">${escapeHtml(s.repo)}</span>
                <span class="service-score ${rankClass}">${scoreDisplay}</span>
            </div>
        `;
    }).join('');

    content.innerHTML = `
        <div class="rank-badge modal-header-badge ${dominantRank}">${capitalize(dominantRank)}</div>
        <h2>${escapeHtml(team.name)} <button class="edit-icon-btn" onclick="openTeamEditModal('${escapeHtml(team.name)}')" title="Edit Team"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 00-.064.108l-.558 1.953 1.953-.558a.253.253 0 00.108-.064l6.286-6.286zm1.238-3.763a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086z"></path></svg></button></h2>
        <div class="team-metadata">
            <span class="team-id">ID: ${escapeHtml(team.id || team.name.toLowerCase().replace(/\\s+/g, '-'))}</span>
            ${team.description ? `<p class="team-description">${escapeHtml(team.description)}</p>` : ''}
            ${team.aliases && team.aliases.length > 0 ? `
            <div class="team-aliases">
                <span class="aliases-label">Also known as:</span>
                ${team.aliases.map(a => `<span class="alias-tag">${escapeHtml(a)}</span>`).join('')}
            </div>
            ` : ''}
        </div>

        <div class="team-modal-stats">
            <div class="team-modal-stat">
                <span class="stat-value">${Math.round(team.averageScore || 0)}</span>
                <span class="stat-label">Average Score</span>
            </div>
            <div class="team-modal-stat">
                <span class="stat-value">${team.serviceCount}</span>
                <span class="stat-label">Services</span>
            </div>
            <div class="team-modal-stat">
                <span class="stat-value">${team.installedCount}</span>
                <span class="stat-label">Installed</span>
            </div>
            <div class="team-modal-stat ${team.staleCount > 0 ? 'warning' : ''}">
                <span class="stat-value">${team.staleCount || 0}</span>
                <span class="stat-label">Stale</span>
            </div>
        </div>

        ${team.slack_channel || team.oncall_rotation ? `
        <div class="team-modal-contact">
            ${team.slack_channel ? `<span class="contact-item"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5.2 8.4a1.2 1.2 0 102.4 0 1.2 1.2 0 00-2.4 0zm6 0a1.2 1.2 0 102.4 0 1.2 1.2 0 00-2.4 0z"/></svg> ${escapeHtml(team.slack_channel)}</span>` : ''}
            ${team.oncall_rotation ? `<span class="contact-item"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.75.75 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"/></svg> ${escapeHtml(team.oncall_rotation)}</span>` : ''}
        </div>
        ` : ''}

        <div class="tabs">
            <button class="tab-btn active" data-tab="services" onclick="switchTeamModalTab('services')">Services</button>
            <button class="tab-btn" data-tab="distribution" onclick="switchTeamModalTab('distribution')">Distribution</button>
            <button class="tab-btn" data-tab="github" onclick="switchTeamModalTab('github')">GitHub</button>
        </div>

        <div class="team-tab-content tab-content active" id="team-tab-services">
            <div class="team-services-list">
                ${servicesList || '<div class="empty-state">No services in this team</div>'}
            </div>
        </div>

        <div class="team-tab-content tab-content" id="team-tab-distribution">
            <div class="rank-distribution-detail">
                ${rankBars}
            </div>
        </div>

        <div class="team-tab-content tab-content" id="team-tab-github">
            ${team.github_org && team.github_slug ? `
                <div class="team-github-section team-github-loading">
                    <span class="loading-spinner"></span> Loading GitHub team...
                </div>
            ` : `
                <div class="team-not-linked">
                    Not linked to a GitHub team
                </div>
            `}
        </div>
    `;

    modal.classList.remove('hidden');

    // Fetch GitHub team members asynchronously if team is linked
    if (team.github_org && team.github_slug) {
        const members = await fetchTeamMembers(team.github_org, team.github_slug);
        const section = document.getElementById('team-tab-github');
        if (section) {
            section.innerHTML = renderGitHubSection(team, members);
        }
    }
}

/**
 * Switch tabs within the team modal
 * @param {string} tabName - Tab to switch to ('services', 'distribution', or 'github')
 */
export function switchTeamModalTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('#team-modal .tab-btn').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('#team-modal .team-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `team-tab-${tabName}`);
    });
}

/**
 * Close team detail modal
 */
export function closeTeamModal() {
    const modal = document.getElementById('team-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Expose to window for onclick handlers
window.showTeamDetail = showTeamModal;
window.closeTeamModal = closeTeamModal;
window.switchTeamModalTab = switchTeamModalTab;
window.openSettingsForTeam = openSettings;
