/**
 * Check Filter Component
 * Multi-select dropdown for filtering services by check status
 * Each check can be set to: any (null), must pass ('pass'), or must fail ('fail')
 */

import { loadChecks, getChecksByCategory } from '../api/checks.js';
import { getActiveCheckFilterCount, filterByCheckCriteria } from '../utils/check-statistics.js';

// State
let checkFilters = new Map(); // checkId -> 'pass'|'fail'|null
let checksData = null;
let onFilterChange = null;
let searchQuery = '';

/**
 * Initialize the check filter
 * @param {Function} onChange - Callback when filter changes
 */
export async function initCheckFilter(onChange) {
    onFilterChange = onChange;
    checkFilters.clear();
    searchQuery = '';

    // Load checks metadata
    try {
        checksData = await loadChecks();
    } catch (error) {
        console.error('Failed to load checks for filter:', error);
        checksData = { checks: [], categories: [] };
    }

    renderCheckFilter();
}

/**
 * Update check filter with refreshed checks data
 */
export async function updateCheckFilter() {
    try {
        checksData = await loadChecks();
        renderCheckFilter();
    } catch (error) {
        console.error('Failed to update checks filter:', error);
    }
}

/**
 * Render the check filter dropdown
 */
function renderCheckFilter() {
    const container = document.getElementById('check-filter-container');
    if (!container) return;

    const activeCount = getActiveCheckFilterCount(checkFilters);
    const hasSelection = activeCount > 0;
    const checksByCategory = getChecksByCategory();

    container.innerHTML = `
        <div class="check-filter-dropdown">
            <button class="check-filter-toggle ${hasSelection ? 'active' : ''}" onclick="window.toggleCheckDropdown()">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
                    <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm9.78-2.22-4.78 4.78-2.28-2.28a.75.75 0 0 0-1.06 1.06l2.75 2.75a.752.752 0 0 0 1.079-.02l5.25-5.25a.75.75 0 1 0-1.06-1.06Z"></path>
                </svg>
                Checks${hasSelection ? ` (${activeCount})` : ''}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="margin-left: 6px;">
                    <path d="M4.427 7.427a.75.75 0 0 1 1.06 0L8 9.94l2.513-2.513a.75.75 0 0 1 1.06 1.06l-3.043 3.043a.75.75 0 0 1-1.06 0L4.427 8.487a.75.75 0 0 1 0-1.06Z"></path>
                </svg>
            </button>
            <div class="check-dropdown-menu" id="check-dropdown-menu">
                <div class="check-dropdown-header">
                    <span>Filter by Check</span>
                    ${hasSelection ? `<button class="check-clear-btn" onclick="window.clearCheckFilter(event)">Clear</button>` : ''}
                </div>
                <div class="check-dropdown-search">
                    <input type="text" placeholder="Search checks..." id="check-search-input" value="${searchQuery}" oninput="window.filterCheckOptions(this.value)">
                </div>
                <div class="check-dropdown-options" id="check-dropdown-options">
                    ${renderCheckCategories(checksByCategory)}
                </div>
            </div>
        </div>
    `;
}

/**
 * Render check categories with collapsible sections
 */
function renderCheckCategories(checksByCategory) {
    const categories = Object.keys(checksByCategory);

    if (categories.length === 0) {
        return '<div class="check-empty-state">No checks available</div>';
    }

    return categories.map(category => {
        const checks = checksByCategory[category];
        const categoryId = category.toLowerCase().replace(/\s+/g, '-');

        return `
            <div class="check-category" data-category="${categoryId}">
                <button class="check-category-toggle" onclick="window.toggleCheckCategory('${categoryId}')">
                    <svg class="category-chevron" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"></path>
                    </svg>
                    ${category}
                    <span class="category-count">(${checks.length})</span>
                </button>
                <div class="check-category-content" id="check-category-${categoryId}">
                    ${checks.map(check => renderCheckOption(check)).join('')}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render a single check option with 3-state toggle
 */
function renderCheckOption(check) {
    const currentState = checkFilters.get(check.id) || null;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
        check.name.toLowerCase().includes(searchLower) ||
        check.id.toLowerCase().includes(searchLower);

    const display = matchesSearch ? '' : 'display: none;';

    return `
        <div class="check-option" data-check-id="${check.id}" style="${display}">
            <span class="check-name" title="${check.description || check.name}">${check.name}</span>
            <div class="check-state-toggle">
                <button
                    class="state-btn state-any ${currentState === null ? 'active' : ''}"
                    onclick="window.setCheckState('${check.id}', null)"
                    title="Any status">
                    Any
                </button>
                <button
                    class="state-btn state-pass ${currentState === 'pass' ? 'active' : ''}"
                    onclick="window.setCheckState('${check.id}', 'pass')"
                    title="Must pass">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
                    </svg>
                </button>
                <button
                    class="state-btn state-fail ${currentState === 'fail' ? 'active' : ''}"
                    onclick="window.setCheckState('${check.id}', 'fail')"
                    title="Must fail">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

/**
 * Toggle dropdown visibility
 */
export function toggleCheckDropdown() {
    const menu = document.getElementById('check-dropdown-menu');
    if (menu) {
        menu.classList.toggle('open');

        if (menu.classList.contains('open')) {
            // Focus search input when opened
            const searchInput = document.getElementById('check-search-input');
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
    const dropdown = document.querySelector('.check-filter-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        const menu = document.getElementById('check-dropdown-menu');
        if (menu) {
            menu.classList.remove('open');
        }
        document.removeEventListener('click', handleClickOutside);
    }
}

/**
 * Toggle category expanded/collapsed
 */
export function toggleCheckCategory(categoryId) {
    const content = document.getElementById(`check-category-${categoryId}`);
    const category = content?.closest('.check-category');

    if (content && category) {
        category.classList.toggle('collapsed');
    }
}

/**
 * Set check filter state
 * @param {string} checkId - Check ID
 * @param {string|null} state - 'pass', 'fail', or null for any
 */
export function setCheckState(checkId, state) {
    if (state === null) {
        checkFilters.delete(checkId);
    } else {
        checkFilters.set(checkId, state);
    }

    // Update just the button states without full re-render
    updateCheckOptionUI(checkId, state);
    updateToggleButton();
    notifyFilterChange();
}

/**
 * Update check option UI without full re-render
 */
function updateCheckOptionUI(checkId, state) {
    const option = document.querySelector(`.check-option[data-check-id="${checkId}"]`);
    if (option) {
        option.querySelectorAll('.state-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = option.querySelector(`.state-${state || 'any'}`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
}

/**
 * Update toggle button state
 */
function updateToggleButton() {
    const toggle = document.querySelector('.check-filter-toggle');
    const activeCount = getActiveCheckFilterCount(checkFilters);

    if (toggle) {
        toggle.classList.toggle('active', activeCount > 0);

        // Update button text
        toggle.innerHTML = toggle.innerHTML.replace(
            /Checks(\s*\(\d+\))?/,
            `Checks${activeCount > 0 ? ` (${activeCount})` : ''}`
        );
    }

    // Update header clear button
    const header = document.querySelector('.check-dropdown-header');
    if (header) {
        const existingBtn = header.querySelector('.check-clear-btn');
        if (activeCount > 0 && !existingBtn) {
            const btn = document.createElement('button');
            btn.className = 'check-clear-btn';
            btn.textContent = 'Clear';
            btn.onclick = (e) => window.clearCheckFilter(e);
            header.appendChild(btn);
        } else if (activeCount === 0 && existingBtn) {
            existingBtn.remove();
        }
    }
}

/**
 * Filter check options by search
 */
export function filterCheckOptions(query) {
    searchQuery = query.toLowerCase();
    const options = document.querySelectorAll('.check-option');

    options.forEach(option => {
        const checkName = option.querySelector('.check-name').textContent.toLowerCase();
        const checkId = option.dataset.checkId.toLowerCase();
        const matches = checkName.includes(searchQuery) || checkId.includes(searchQuery);
        option.style.display = matches ? '' : 'none';
    });

    // Show categories that have visible options
    document.querySelectorAll('.check-category').forEach(category => {
        const visibleOptions = category.querySelectorAll('.check-option:not([style*="display: none"])');
        category.style.display = visibleOptions.length > 0 ? '' : 'none';
    });
}

/**
 * Clear all check filters
 */
export function clearCheckFilter(e) {
    if (e) {
        e.stopPropagation();
    }

    checkFilters.clear();

    // Update all buttons
    document.querySelectorAll('.check-option').forEach(option => {
        option.querySelectorAll('.state-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        option.querySelector('.state-any')?.classList.add('active');
    });

    updateToggleButton();
    notifyFilterChange();
}

/**
 * Notify about filter changes
 */
function notifyFilterChange() {
    if (onFilterChange) {
        onFilterChange(new Map(checkFilters));
    }
}

/**
 * Filter services by current check filter state
 * @param {Array<Object>} services - Services to filter
 * @returns {Array<Object>} Filtered services
 */
export function filterByChecks(services) {
    return filterByCheckCriteria(services, checkFilters);
}

/**
 * Get current filter state
 * @returns {Map} Current check filters
 */
export function getCheckFilterState() {
    return new Map(checkFilters);
}

/**
 * Set filter state programmatically
 * @param {Map} filters - Map of checkId -> 'pass'|'fail'|null
 */
export function setCheckFilterState(filters) {
    checkFilters = new Map(filters);
    renderCheckFilter();
    notifyFilterChange();
}

/**
 * Get count of active filters
 * @returns {number} Number of active check filters
 */
export function getActiveFilterCount() {
    return getActiveCheckFilterCount(checkFilters);
}

// Expose functions to window for onclick handlers
window.toggleCheckDropdown = toggleCheckDropdown;
window.toggleCheckCategory = toggleCheckCategory;
window.setCheckState = setCheckState;
window.filterCheckOptions = filterCheckOptions;
window.clearCheckFilter = clearCheckFilter;
