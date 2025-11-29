/**
 * Check Adoption Dashboard
 * Shows check adoption rates across all teams
 */

import { showModal, hideModal, setupModalHandlers } from './modals.js';
import { loadChecks } from '../api/checks.js';
import { calculateCheckAdoptionByTeam, sortTeamsByAdoption } from '../utils/check-statistics.js';
import { escapeHtml } from '../utils/formatting.js';
import { getIcon } from '../config/icons.js';

const MODAL_ID = 'check-adoption-modal';

// State
let currentServices = [];
let selectedCheckId = null;
let currentSort = { by: 'percentage', direction: 'desc' };
let checksData = null;

/**
 * Initialize check adoption dashboard
 */
export function initCheckAdoptionDashboard() {
    // Create modal HTML if not exists
    createModalIfNeeded();
    setupModalHandlers(MODAL_ID);
}

/**
 * Create modal HTML element
 */
function createModalIfNeeded() {
    if (document.getElementById(MODAL_ID)) return;

    const modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'modal hidden';
    modal.innerHTML = `
        <div class="modal-content check-adoption-modal-content">
            <div class="modal-header">
                <h2>Check Adoption Dashboard</h2>
                <button class="modal-close" aria-label="Close" onclick="window.closeCheckAdoptionDashboard()">
                    ${getIcon('xMark', { size: 20 })}
                </button>
            </div>
            <div class="modal-body">
                <div id="check-adoption-dashboard-content"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * Open the check adoption dashboard
 * @param {Array<Object>} services - All services
 */
export async function openCheckAdoptionDashboard(services) {
    currentServices = services;

    // Load checks metadata
    try {
        checksData = await loadChecks();
        if (!selectedCheckId && checksData.checks.length > 0) {
            selectedCheckId = checksData.checks[0].id;
        }
    } catch (error) {
        console.error('Failed to load checks:', error);
        checksData = { checks: [], categories: [] };
    }

    showModal(MODAL_ID);
    renderDashboard();
}

/**
 * Close the dashboard
 */
export function closeCheckAdoptionDashboard() {
    hideModal(MODAL_ID);
}

/**
 * Render the dashboard content
 */
function renderDashboard() {
    const content = document.getElementById('check-adoption-dashboard-content');
    if (!content) return;

    const checks = checksData?.checks || [];

    if (checks.length === 0) {
        content.innerHTML = '<div class="empty-state">No check metadata available</div>';
        return;
    }

    const selectedCheck = checks.find(c => c.id === selectedCheckId) || checks[0];

    // Calculate adoption by team for selected check
    const teamStats = calculateCheckAdoptionByTeam(currentServices, selectedCheckId);
    const sortedTeams = sortTeamsByAdoption(teamStats, currentSort.direction);

    // Build check selector
    const checkOptions = checks.map(check => `
        <option value="${check.id}" ${check.id === selectedCheckId ? 'selected' : ''}>
            ${escapeHtml(check.name)}
        </option>
    `).join('');

    // Build team rows
    const teamRows = sortedTeams.map(team => {
        const progressClass = team.percentage >= 80 ? 'high' : team.percentage >= 50 ? 'medium' : 'low';
        const isNoTeam = team.teamName === 'No Team';
        const rowClass = isNoTeam ? 'adoption-row no-team' : 'adoption-row';
        // For 0%, show an empty state indicator
        const progressWidth = team.percentage === 0 ? '0' : team.percentage;
        const progressFillClass = team.percentage === 0 ? 'progress-fill none' : `progress-fill ${progressClass}`;
        return `
            <tr class="${rowClass}" onclick="window.showTeamDetail('${escapeHtml(team.teamName)}')">
                <td class="team-name-cell">${escapeHtml(team.teamName)}</td>
                <td class="adoption-cell">${team.percentage}%</td>
                <td class="progress-cell">
                    <div class="progress-bar-inline">
                        <div class="${progressFillClass}" style="width: ${progressWidth}%"></div>
                    </div>
                </td>
                <td class="count-cell">${team.passing}/${team.total}</td>
            </tr>
        `;
    }).join('');

    // Calculate overall stats
    const totalServices = currentServices.length;
    const passingTotal = currentServices.filter(s => s.check_results?.[selectedCheckId] === 'pass').length;
    const overallPercentage = totalServices > 0 ? Math.round((passingTotal / totalServices) * 100) : 0;

    content.innerHTML = `
        <div class="adoption-dashboard-header">
            <div class="check-selector-large">
                <label for="adoption-check-select">Select Check:</label>
                <select id="adoption-check-select" onchange="window.changeAdoptionCheck(this.value)">
                    ${checkOptions}
                </select>
            </div>
            <div class="adoption-stats-row">
                <div class="adoption-stat-card">
                    <span class="adoption-stat-value">${overallPercentage}%</span>
                    <span class="adoption-stat-label">Overall Adoption</span>
                </div>
                <div class="adoption-stat-card">
                    <span class="adoption-stat-value">${passingTotal}/${totalServices}</span>
                    <span class="adoption-stat-label">Services Passing</span>
                </div>
            </div>
        </div>

        <div class="check-description-box">
            <strong>${escapeHtml(selectedCheck.name)}</strong>
            <p>${escapeHtml(selectedCheck.description || 'No description available')}</p>
        </div>

        <div class="adoption-table-container">
            <table class="adoption-table">
                <thead>
                    <tr>
                        <th class="sortable" onclick="window.sortAdoptionTable('name')">
                            Team
                            <span class="sort-indicator">${currentSort.by === 'name' ? (currentSort.direction === 'asc' ? '↑' : '↓') : ''}</span>
                        </th>
                        <th class="sortable" onclick="window.sortAdoptionTable('percentage')">
                            Adoption
                            <span class="sort-indicator">${currentSort.by === 'percentage' ? (currentSort.direction === 'asc' ? '↑' : '↓') : ''}</span>
                        </th>
                        <th>Progress</th>
                        <th>Passing</th>
                    </tr>
                </thead>
                <tbody>
                    ${teamRows || '<tr><td colspan="4" class="empty-row">No teams found</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Change selected check
 */
export function changeAdoptionCheck(checkId) {
    selectedCheckId = checkId;
    renderDashboard();
}

/**
 * Sort adoption table
 */
export function sortAdoptionTable(sortBy) {
    if (currentSort.by === sortBy) {
        currentSort.direction = currentSort.direction === 'desc' ? 'asc' : 'desc';
    } else {
        currentSort.by = sortBy;
        currentSort.direction = sortBy === 'name' ? 'asc' : 'desc';
    }
    renderDashboard();
}

// Expose to window
window.openCheckAdoptionDashboard = openCheckAdoptionDashboard;
window.closeCheckAdoptionDashboard = closeCheckAdoptionDashboard;
window.changeAdoptionCheck = changeAdoptionCheck;
window.sortAdoptionTable = sortAdoptionTable;
