/**
 * Check Adoption Dashboard
 * Shows check adoption rates across all teams
 */

import { showModal, hideModal, setupModalHandlers } from './modals.js';
import { loadChecks } from '../api/checks.js';
import {
  calculateCheckAdoptionByTeam,
  sortTeamsByAdoption,
  calculateOverallCheckAdoption,
} from '../utils/check-statistics.js';
import { escapeHtml } from '../utils/formatting.js';
import { getIcon } from '../config/icons.js';
import type { ServiceData, ChecksData } from '../types/index.js';

// Window types are defined in types/globals.d.ts

type AdoptionSortBy = 'name' | 'percentage';
type SortDirection = 'asc' | 'desc';

interface SortState {
  by: AdoptionSortBy;
  direction: SortDirection;
}

const MODAL_ID = 'check-adoption-modal';

// State
let currentServices: ServiceData[] = [];
let selectedCheckId: string | null = null;
const currentSort: SortState = { by: 'percentage', direction: 'desc' };
let checksData: ChecksData | null = null;
let dropdownOpen = false;

/**
 * Initialize check adoption dashboard
 */
export function initCheckAdoptionDashboard(): void {
  // Create modal HTML if not exists
  createModalIfNeeded();
  setupModalHandlers(MODAL_ID);
}

/**
 * Create modal HTML element
 */
function createModalIfNeeded(): void {
  if (document.getElementById(MODAL_ID)) {return;}

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
 */
export async function openCheckAdoptionDashboard(
  services: ServiceData[]
): Promise<void> {
  currentServices = services;

  // Load checks metadata
  try {
    checksData = await loadChecks();
    if (!selectedCheckId && checksData.checks.length > 0) {
      selectedCheckId = checksData.checks[0].id;
    }
  } catch (error) {
    console.error('Failed to load checks:', error);
    checksData = { checks: [], categories: [], version: '', count: 0 };
  }

  showModal(MODAL_ID);
  renderDashboard();
}

/**
 * Close the dashboard
 */
export function closeCheckAdoptionDashboard(): void {
  hideModal(MODAL_ID);
}

/**
 * Render the dashboard content
 */
function renderDashboard(): void {
  const content = document.getElementById('check-adoption-dashboard-content');
  if (!content) {return;}

  const checks = checksData?.checks || [];

  if (checks.length === 0) {
    content.innerHTML =
      '<div class="empty-state">No check metadata available</div>';
    return;
  }

  const selectedCheck =
    checks.find((c) => c.id === selectedCheckId) || checks[0];

  // Calculate adoption by team for selected check
  const teamStats = calculateCheckAdoptionByTeam(
    currentServices,
    selectedCheckId!
  );
  const sortedTeams = sortTeamsByAdoption(teamStats, currentSort.direction);

  // Apply name sorting if selected
  if (currentSort.by === 'name') {
    sortedTeams.sort((a, b) => {
      const comparison = a.teamName.localeCompare(b.teamName);
      return currentSort.direction === 'desc' ? -comparison : comparison;
    });
  }

  // Build check selector options
  const checkOptions = checks
    .map(
      (check) => `
        <div class="check-selector-option ${check.id === selectedCheckId ? 'selected' : ''}"
             data-check-id="${check.id}"
             onclick="window.selectCheckFromDropdown('${check.id}')">
            ${escapeHtml(check.name)}
        </div>
    `
    )
    .join('');

  // Build team rows with excluded column
  const teamRows = sortedTeams
    .map((team) => {
      const progressClass =
        team.percentage >= 80
          ? 'high'
          : team.percentage >= 50
            ? 'medium'
            : 'low';
      const isNoTeam = team.teamName === 'No Team';
      const rowClass = isNoTeam ? 'adoption-row no-team' : 'adoption-row';
      // For 0%, show an empty state indicator
      const progressWidth = team.percentage === 0 ? '0' : team.percentage;
      const progressFillClass =
        team.percentage === 0
          ? 'progress-fill none'
          : `progress-fill ${progressClass}`;
      const excludedCount = team.excluded || 0;
      const activeTotal = team.activeTotal || team.total - excludedCount;
      return `
            <tr class="${rowClass}" onclick="window.showTeamDetail && window.showTeamDetail('${escapeHtml(team.teamName)}')">
                <td class="team-name-cell">${escapeHtml(team.teamName)}</td>
                <td class="adoption-cell">${team.percentage}%</td>
                <td class="progress-cell">
                    <div class="progress-bar-inline">
                        <div class="${progressFillClass}" style="width: ${progressWidth}%"></div>
                    </div>
                </td>
                <td class="count-cell">${team.passing}/${activeTotal}</td>
                <td class="excluded-cell ${excludedCount > 0 ? 'has-excluded' : ''}">${excludedCount > 0 ? excludedCount : '-'}</td>
            </tr>
        `;
    })
    .join('');

  // Calculate overall stats using the new function that handles exclusions
  const overallStats = calculateOverallCheckAdoption(
    currentServices,
    selectedCheckId!
  );
  const {
    total: _totalServices,
    activeTotal,
    passing: passingTotal,
    excluded: excludedTotal,
    percentage: overallPercentage,
  } = overallStats;

  content.innerHTML = `
        <div class="adoption-dashboard-header">
            <div class="check-selector-large">
                <label>Select Check:</label>
                <div class="check-selector-dropdown">
                    <button class="check-selector-toggle" onclick="window.toggleCheckSelectorDropdown()">
                        <span class="check-selector-text">${escapeHtml(selectedCheck.name)}</span>
                        ${getIcon('chevronDown', { size: 16 })}
                    </button>
                    <div class="check-selector-menu" id="check-selector-menu">
                        <div class="check-selector-search">
                            <input type="text" placeholder="Search checks..."
                                   oninput="window.filterCheckSelectorOptions(this.value)">
                        </div>
                        <div class="check-selector-options">
                            ${checkOptions}
                        </div>
                    </div>
                </div>
            </div>
            <div class="adoption-stats-row">
                <div class="adoption-stat-card">
                    <span class="adoption-stat-value">${overallPercentage}%</span>
                    <span class="adoption-stat-label">Overall Adoption</span>
                </div>
                <div class="adoption-stat-card">
                    <span class="adoption-stat-value">${passingTotal}/${activeTotal}</span>
                    <span class="adoption-stat-label">Services Passing</span>
                </div>
                ${
  excludedTotal > 0
    ? `
                <div class="adoption-stat-card excluded">
                    <span class="adoption-stat-value">${excludedTotal}</span>
                    <span class="adoption-stat-label">Excluded</span>
                </div>
                `
    : ''
}
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
                            <span class="sort-indicator">${currentSort.by === 'name' ? (currentSort.direction === 'asc' ? '\u2191' : '\u2193') : ''}</span>
                        </th>
                        <th class="sortable" onclick="window.sortAdoptionTable('percentage')">
                            Adoption
                            <span class="sort-indicator">${currentSort.by === 'percentage' ? (currentSort.direction === 'asc' ? '\u2191' : '\u2193') : ''}</span>
                        </th>
                        <th>Progress</th>
                        <th>Passing</th>
                        <th>Excl.</th>
                    </tr>
                </thead>
                <tbody>
                    ${teamRows || '<tr><td colspan="5" class="empty-row">No teams found</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Toggle check selector dropdown
 */
export function toggleCheckSelectorDropdown(): void {
  const menu = document.getElementById('check-selector-menu');
  if (!menu) {return;}

  dropdownOpen = !dropdownOpen;
  menu.classList.toggle('open', dropdownOpen);

  if (dropdownOpen) {
    // Focus search input
    const searchInput = menu.querySelector('input') as HTMLInputElement | null;
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    // Reset filter
    filterCheckSelectorOptions('');

    // Add click-outside listener
    setTimeout(() => {
      document.addEventListener('click', handleClickOutsideCheckSelector);
    }, 0);
  } else {
    document.removeEventListener('click', handleClickOutsideCheckSelector);
  }
}

/**
 * Handle click outside dropdown
 */
function handleClickOutsideCheckSelector(e: Event): void {
  const dropdown = document.querySelector('.check-selector-dropdown');
  if (dropdown && !dropdown.contains(e.target as Node)) {
    closeCheckSelectorDropdown();
  }
}

/**
 * Close dropdown
 */
function closeCheckSelectorDropdown(): void {
  const menu = document.getElementById('check-selector-menu');
  if (menu) {
    menu.classList.remove('open');
    dropdownOpen = false;
  }
  document.removeEventListener('click', handleClickOutsideCheckSelector);
}

/**
 * Select check from dropdown
 */
export function selectCheckFromDropdown(checkId: string): void {
  selectedCheckId = checkId;
  closeCheckSelectorDropdown();
  renderDashboard();
}

/**
 * Filter check selector options
 */
export function filterCheckSelectorOptions(query: string): void {
  const options = document.querySelectorAll<HTMLElement>(
    '.check-selector-option'
  );
  const lowerQuery = query.toLowerCase();

  options.forEach((option) => {
    const text = option.textContent?.toLowerCase() || '';
    option.style.display = text.includes(lowerQuery) ? '' : 'none';
  });
}

/**
 * Change selected check (legacy - kept for compatibility)
 */
export function changeAdoptionCheck(checkId: string): void {
  selectedCheckId = checkId;
  renderDashboard();
}

/**
 * Sort adoption table
 */
export function sortAdoptionTable(sortBy: AdoptionSortBy): void {
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
window.toggleCheckSelectorDropdown = toggleCheckSelectorDropdown;
window.selectCheckFromDropdown = selectCheckFromDropdown;
window.filterCheckSelectorOptions = filterCheckSelectorOptions;
