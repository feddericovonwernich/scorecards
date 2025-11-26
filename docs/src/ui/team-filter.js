/**
 * Team Filter Component
 * Multi-select dropdown for filtering services by team
 */

import { getUniqueTeams, getTeamName } from '../utils/team-statistics.js';

// State
let selectedTeams = new Set();
let allTeams = [];
let includeNoTeam = false;
let onFilterChange = null;

/**
 * Initialize the team filter
 * @param {Array<Object>} services - All services
 * @param {Function} onChange - Callback when filter changes
 */
export function initTeamFilter(services, onChange) {
    onFilterChange = onChange;
    allTeams = getUniqueTeams(services);
    selectedTeams.clear();
    includeNoTeam = false;

    renderTeamFilter();
}

/**
 * Update team filter with new service data
 * @param {Array<Object>} services - All services
 */
export function updateTeamFilter(services) {
    allTeams = getUniqueTeams(services);
    renderTeamFilter();
}

/**
 * Render the team filter dropdown
 */
function renderTeamFilter() {
    const container = document.getElementById('team-filter-container');
    if (!container) return;

    const selectedCount = selectedTeams.size + (includeNoTeam ? 1 : 0);
    const hasSelection = selectedCount > 0;

    container.innerHTML = `
        <div class="team-filter-dropdown">
            <button class="team-filter-toggle ${hasSelection ? 'active' : ''}" onclick="window.toggleTeamDropdown()">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
                    <path d="M1.5 14.25c0 .138.112.25.25.25H4v-1.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.25h2.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.055.703c.487.325.779.871.779 1.456v5.965A1.75 1.75 0 0 1 14.25 16h-3.5a.766.766 0 0 1-.197-.026c-.099.017-.2.026-.303.026h-3a.75.75 0 0 1-.75-.75V14h-1v1.25a.75.75 0 0 1-.75.75h-3A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0ZM3 3.75A.75.75 0 0 1 3.75 3h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 3.75ZM3.75 6h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 9.75A.75.75 0 0 1 3.75 9h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 9.75ZM7.75 9h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM7 6.75A.75.75 0 0 1 7.75 6h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 7 6.75ZM7.75 3h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5Z"></path>
                </svg>
                Teams${hasSelection ? ` (${selectedCount})` : ''}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="margin-left: 6px;">
                    <path d="M4.427 7.427a.75.75 0 0 1 1.06 0L8 9.94l2.513-2.513a.75.75 0 0 1 1.06 1.06l-3.043 3.043a.75.75 0 0 1-1.06 0L4.427 8.487a.75.75 0 0 1 0-1.06Z"></path>
                </svg>
            </button>
            <div class="team-dropdown-menu" id="team-dropdown-menu">
                <div class="team-dropdown-header">
                    <span>Filter by Team</span>
                    ${hasSelection ? `<button class="team-clear-btn" onclick="window.clearTeamFilter(event)">Clear</button>` : ''}
                </div>
                <div class="team-dropdown-search">
                    <input type="text" placeholder="Search teams..." id="team-search-input" oninput="window.filterTeamOptions(this.value)">
                </div>
                <div class="team-dropdown-options" id="team-dropdown-options">
                    <label class="team-option ${includeNoTeam ? 'selected' : ''}">
                        <input type="checkbox" ${includeNoTeam ? 'checked' : ''} onchange="window.toggleNoTeamFilter(this.checked)">
                        <span class="team-name no-team">No Team Assigned</span>
                    </label>
                    ${allTeams.map(team => `
                        <label class="team-option ${selectedTeams.has(team) ? 'selected' : ''}" data-team="${team}">
                            <input type="checkbox" ${selectedTeams.has(team) ? 'checked' : ''} onchange="window.toggleTeamSelection('${team}', this.checked)">
                            <span class="team-name">${team}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Toggle dropdown visibility
 */
export function toggleTeamDropdown() {
    const menu = document.getElementById('team-dropdown-menu');
    if (menu) {
        menu.classList.toggle('open');

        if (menu.classList.contains('open')) {
            // Focus search input when opened
            const searchInput = document.getElementById('team-search-input');
            if (searchInput) {
                searchInput.focus();
            }

            // Add click outside listener
            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 0);
        } else {
            document.removeEventListener('click', handleClickOutside);
        }
    }
}

/**
 * Handle click outside dropdown
 */
function handleClickOutside(e) {
    const dropdown = document.querySelector('.team-filter-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        const menu = document.getElementById('team-dropdown-menu');
        if (menu) {
            menu.classList.remove('open');
        }
        document.removeEventListener('click', handleClickOutside);
    }
}

/**
 * Toggle team selection
 */
export function toggleTeamSelection(team, checked) {
    if (checked) {
        selectedTeams.add(team);
    } else {
        selectedTeams.delete(team);
    }

    updateOptionUI(team, checked);
    updateToggleButton();
    notifyFilterChange();
}

/**
 * Toggle no-team filter
 */
export function toggleNoTeamFilter(checked) {
    includeNoTeam = checked;
    updateToggleButton();
    notifyFilterChange();
}

/**
 * Update option UI without re-rendering
 */
function updateOptionUI(team, selected) {
    const option = document.querySelector(`.team-option[data-team="${team}"]`);
    if (option) {
        option.classList.toggle('selected', selected);
    }
}

/**
 * Update toggle button state
 */
function updateToggleButton() {
    const toggle = document.querySelector('.team-filter-toggle');
    const selectedCount = selectedTeams.size + (includeNoTeam ? 1 : 0);

    if (toggle) {
        toggle.classList.toggle('active', selectedCount > 0);

        // Update button text
        const textNode = toggle.childNodes[1];
        if (textNode) {
            toggle.innerHTML = toggle.innerHTML.replace(
                /Teams(\s*\(\d+\))?/,
                `Teams${selectedCount > 0 ? ` (${selectedCount})` : ''}`
            );
        }
    }

    // Update header clear button
    const header = document.querySelector('.team-dropdown-header');
    if (header) {
        const existingBtn = header.querySelector('.team-clear-btn');
        if (selectedCount > 0 && !existingBtn) {
            const btn = document.createElement('button');
            btn.className = 'team-clear-btn';
            btn.textContent = 'Clear';
            btn.onclick = (e) => window.clearTeamFilter(e);
            header.appendChild(btn);
        } else if (selectedCount === 0 && existingBtn) {
            existingBtn.remove();
        }
    }
}

/**
 * Filter team options by search
 */
export function filterTeamOptions(query) {
    const options = document.querySelectorAll('.team-option');
    const normalizedQuery = query.toLowerCase();

    options.forEach(option => {
        const teamName = option.querySelector('.team-name').textContent.toLowerCase();
        option.style.display = teamName.includes(normalizedQuery) ? '' : 'none';
    });
}

/**
 * Clear all team filters
 */
export function clearTeamFilter(e) {
    if (e) {
        e.stopPropagation();
    }

    selectedTeams.clear();
    includeNoTeam = false;

    // Uncheck all checkboxes
    const checkboxes = document.querySelectorAll('#team-dropdown-options input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = false;
        cb.closest('.team-option')?.classList.remove('selected');
    });

    updateToggleButton();
    notifyFilterChange();
}

/**
 * Notify about filter changes
 */
function notifyFilterChange() {
    if (onFilterChange) {
        onFilterChange({
            teams: Array.from(selectedTeams),
            includeNoTeam,
        });
    }
}

/**
 * Get current filter state
 */
export function getTeamFilterState() {
    return {
        teams: Array.from(selectedTeams),
        includeNoTeam,
    };
}

/**
 * Set filter state programmatically
 */
export function setTeamFilterState(teams, noTeam = false) {
    selectedTeams = new Set(teams);
    includeNoTeam = noTeam;
    renderTeamFilter();
    notifyFilterChange();
}

/**
 * Filter services by team selection
 * @param {Array<Object>} services - Services to filter
 * @returns {Array<Object>} Filtered services
 */
export function filterByTeam(services) {
    const hasTeamFilter = selectedTeams.size > 0 || includeNoTeam;

    if (!hasTeamFilter) {
        return services;
    }

    return services.filter(service => {
        const team = getTeamName(service);

        // Check if no team assigned
        if (!team) {
            return includeNoTeam;
        }

        // Check if team is in selected list
        return selectedTeams.has(team);
    });
}

/**
 * Select a single team (used for quick filtering)
 */
export function selectTeam(teamName) {
    selectedTeams.clear();
    includeNoTeam = false;

    if (teamName) {
        selectedTeams.add(teamName);
    }

    renderTeamFilter();
    notifyFilterChange();
}

// Expose functions to window for onclick handlers
window.toggleTeamDropdown = toggleTeamDropdown;
window.toggleTeamSelection = toggleTeamSelection;
window.toggleNoTeamFilter = toggleNoTeamFilter;
window.filterTeamOptions = filterTeamOptions;
window.clearTeamFilter = clearTeamFilter;
window.selectTeam = selectTeam;
