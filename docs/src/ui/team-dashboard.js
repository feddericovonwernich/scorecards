/**
 * Team Dashboard Modal
 * Displays team statistics and allows filtering by team
 */

import { showModal, hideModal, setupModalHandlers } from './modals.js';
import {
    calculateTeamStats,
    sortTeamStats,
    buildRankSummary,
    mergeTeamDataWithStats,
} from '../utils/team-statistics.js';
import { loadTeams } from '../api/registry.js';
import { selectTeam } from './team-filter.js';

// State
let currentServices = [];
let currentTeamsData = null;
let currentSort = { by: 'serviceCount', direction: 'desc' };
let searchQuery = '';
let currentChecksHash = null;
let isStaleCheck = null;

const MODAL_ID = 'team-dashboard-modal';

/**
 * Initialize team dashboard
 * @param {Function} staleCheckFn - Function to check if service is stale
 */
export function initTeamDashboard(staleCheckFn) {
    isStaleCheck = staleCheckFn;
    setupModalHandlers(MODAL_ID);
}

/**
 * Open the team dashboard modal
 * @param {Array<Object>} services - All services
 * @param {string} checksHash - Current checks hash
 */
export async function openTeamDashboard(services, checksHash) {
    currentServices = services;
    currentChecksHash = checksHash;

    // Load teams data
    try {
        const { teams } = await loadTeams();
        currentTeamsData = teams;
    } catch (error) {
        console.error('Failed to load teams:', error);
        currentTeamsData = null;
    }

    showModal(MODAL_ID);
    renderDashboard();
}

/**
 * Close the team dashboard
 */
export function closeTeamDashboard() {
    hideModal(MODAL_ID);
}

/**
 * Render the dashboard content
 */
function renderDashboard() {
    const content = document.getElementById('team-dashboard-content');
    if (!content) return;

    // Calculate statistics from current services
    const calculatedStats = calculateTeamStats(currentServices, isStaleCheck, currentChecksHash);

    // Merge with team registry data if available
    const teamData = currentTeamsData
        ? mergeTeamDataWithStats(currentTeamsData, calculatedStats)
        : Object.fromEntries(
              Object.entries(calculatedStats).map(([name, stats]) => [
                  name.toLowerCase().replace(/\s+/g, '-'),
                  { id: name.toLowerCase().replace(/\s+/g, '-'), name, statistics: stats },
              ])
          );

    // Convert to array and sort
    let teamsArray = Object.values(teamData);

    // Filter by search
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        teamsArray = teamsArray.filter(
            team =>
                team.name.toLowerCase().includes(query) ||
                team.description?.toLowerCase().includes(query) ||
                team.aliases?.some(a => a.toLowerCase().includes(query))
        );
    }

    // Sort
    teamsArray = sortTeamStats(
        teamsArray.map(t => ({ ...t, ...t.statistics })),
        currentSort.by,
        currentSort.direction
    );

    // Calculate totals
    const totalServices = Object.values(calculatedStats).reduce((sum, t) => sum + t.serviceCount, 0);
    const totalTeams = Object.keys(calculatedStats).length;
    const servicesWithoutTeam = currentServices.filter(s => !s.team).length;

    content.innerHTML = `
        <div class="team-dashboard-header">
            <div class="team-dashboard-summary">
                <div class="summary-stat">
                    <span class="summary-value">${totalTeams}</span>
                    <span class="summary-label">Teams</span>
                </div>
                <div class="summary-stat">
                    <span class="summary-value">${totalServices}</span>
                    <span class="summary-label">Services with Team</span>
                </div>
                ${servicesWithoutTeam > 0 ? `
                <div class="summary-stat warning">
                    <span class="summary-value">${servicesWithoutTeam}</span>
                    <span class="summary-label">Without Team</span>
                </div>
                ` : ''}
            </div>
            <div class="team-dashboard-controls">
                <input
                    type="text"
                    class="team-search"
                    placeholder="Search teams..."
                    value="${searchQuery}"
                    oninput="window.searchTeamsDashboard(this.value)"
                >
                <select class="team-sort-select" onchange="window.sortTeamsDashboard(this.value)">
                    <option value="serviceCount-desc" ${currentSort.by === 'serviceCount' && currentSort.direction === 'desc' ? 'selected' : ''}>Services: High to Low</option>
                    <option value="serviceCount-asc" ${currentSort.by === 'serviceCount' && currentSort.direction === 'asc' ? 'selected' : ''}>Services: Low to High</option>
                    <option value="averageScore-desc" ${currentSort.by === 'averageScore' && currentSort.direction === 'desc' ? 'selected' : ''}>Score: High to Low</option>
                    <option value="averageScore-asc" ${currentSort.by === 'averageScore' && currentSort.direction === 'asc' ? 'selected' : ''}>Score: Low to High</option>
                    <option value="name-asc" ${currentSort.by === 'name' && currentSort.direction === 'asc' ? 'selected' : ''}>Name: A to Z</option>
                    <option value="name-desc" ${currentSort.by === 'name' && currentSort.direction === 'desc' ? 'selected' : ''}>Name: Z to A</option>
                </select>
                <button class="team-create-btn" onclick="window.openCreateTeamModal()" title="Create new team">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"></path>
                    </svg>
                    Create Team
                </button>
            </div>
        </div>

        <div class="team-cards-grid">
            ${teamsArray.length === 0 ? `
                <div class="team-empty-state">
                    ${searchQuery ? 'No teams match your search.' : 'No teams found.'}
                </div>
            ` : teamsArray.map(team => renderTeamCard(team)).join('')}
        </div>
    `;
}

/**
 * Render a single team card
 */
function renderTeamCard(team) {
    const stats = team.statistics || team;
    const rankSummary = buildRankSummary(stats.rankDistribution);
    const progressPercent = stats.serviceCount > 0
        ? Math.round((stats.installedCount / stats.serviceCount) * 100)
        : 0;

    return `
        <div class="team-card" data-team-id="${team.id}">
            <div class="team-card-header">
                <h3 class="team-card-name">${team.name}</h3>
                ${team.metadata?.slack_channel ? `
                    <span class="team-slack" title="Slack channel">${team.metadata.slack_channel}</span>
                ` : ''}
            </div>

            ${team.description ? `
                <p class="team-card-description">${team.description}</p>
            ` : ''}

            <div class="team-card-stats">
                <div class="team-stat">
                    <span class="team-stat-value">${stats.serviceCount}</span>
                    <span class="team-stat-label">Services</span>
                </div>
                <div class="team-stat">
                    <span class="team-stat-value">${stats.averageScore}</span>
                    <span class="team-stat-label">Avg Score</span>
                </div>
                ${stats.staleCount > 0 ? `
                <div class="team-stat warning">
                    <span class="team-stat-value">${stats.staleCount}</span>
                    <span class="team-stat-label">Stale</span>
                </div>
                ` : ''}
            </div>

            ${rankSummary ? `
                <div class="team-card-ranks">
                    ${renderMiniRankBadges(stats.rankDistribution)}
                </div>
            ` : ''}

            <div class="team-card-progress">
                <div class="progress-label">
                    <span>Installed</span>
                    <span>${stats.installedCount}/${stats.serviceCount} (${progressPercent}%)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
            </div>

            <div class="team-card-actions">
                <button class="team-filter-btn" onclick="window.filterCatalogByTeam('${team.id}')">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M.75 3h14.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5ZM3 7.75A.75.75 0 0 1 3.75 7h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 7.75Zm3 4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path>
                    </svg>
                    Filter
                </button>
                <button class="team-edit-btn" onclick="window.openTeamEditModal('${team.id}')" title="Edit team">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"></path>
                    </svg>
                    Edit
                </button>
            </div>
        </div>
    `;
}

/**
 * Render mini rank badges
 */
function renderMiniRankBadges(rankDistribution) {
    const ranks = ['platinum', 'gold', 'silver', 'bronze'];
    return ranks
        .filter(rank => rankDistribution[rank] > 0)
        .map(rank => `
            <span class="mini-rank-badge rank-${rank}">${rankDistribution[rank]}</span>
        `)
        .join('');
}

/**
 * Search teams in dashboard
 */
export function searchTeamsDashboard(query) {
    searchQuery = query;
    renderDashboard();
}

/**
 * Sort teams in dashboard
 */
export function sortTeamsDashboard(value) {
    const [by, direction] = value.split('-');
    currentSort = { by, direction };
    renderDashboard();
}

/**
 * Filter catalog by team (close modal and apply filter)
 */
export function filterCatalogByTeam(teamName) {
    closeTeamDashboard();
    selectTeam(teamName);
}

/**
 * Update services in dashboard
 */
export function updateDashboardServices(services, checksHash) {
    currentServices = services;
    currentChecksHash = checksHash;

    const modal = document.getElementById(MODAL_ID);
    if (modal && !modal.classList.contains('hidden')) {
        renderDashboard();
    }
}

// Expose functions to window for onclick handlers
window.searchTeamsDashboard = searchTeamsDashboard;
window.sortTeamsDashboard = sortTeamsDashboard;
window.filterCatalogByTeam = filterCatalogByTeam;
window.openTeamDashboard = openTeamDashboard;
window.closeTeamDashboard = closeTeamDashboard;
