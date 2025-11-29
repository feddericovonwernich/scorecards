/**
 * Check Filter Component
 * Modal dialog for filtering services by check status
 * Each check can be set to: any (null), must pass ('pass'), or must fail ('fail')
 */

import { loadChecks, getChecksByCategory, getAllChecks } from '../api/checks.js';
import { getActiveCheckFilterCount, filterByCheckCriteria, calculateOverallCheckAdoption } from '../utils/check-statistics.js';
import { showModal, hideModal, setupModalHandlers } from './modals.js';
import { escapeHtml } from '../utils/formatting.js';

// Constants
const CHECK_FILTER_MODAL_ID = 'check-filter-modal';

// State
let checkFilters = new Map(); // checkId -> 'pass'|'fail'|null
let checksData = null;
let onFilterChange = null;
let searchQuery = '';
let allServices = []; // For calculating adoption stats
let adoptionStatsCache = new Map(); // checkId -> { passing, failing, total, percentage }

/**
 * Initialize the check filter
 * @param {Function} onChange - Callback when filter changes
 */
export async function initCheckFilter(onChange) {
    onFilterChange = onChange;
    checkFilters.clear();
    searchQuery = '';
    adoptionStatsCache.clear();

    // Load checks metadata
    try {
        checksData = await loadChecks();
    } catch (error) {
        console.error('Failed to load checks for filter:', error);
        checksData = { checks: [], categories: [] };
    }

    // Create modal if needed
    createModalIfNeeded();

    // Render the toggle button
    renderToggleButton();
}

/**
 * Update check filter with refreshed checks data
 */
export async function updateCheckFilter() {
    try {
        checksData = await loadChecks();
        adoptionStatsCache.clear(); // Clear cache when checks update
        renderToggleButton();
    } catch (error) {
        console.error('Failed to update checks filter:', error);
    }
}

/**
 * Set services data for adoption stats calculation
 * @param {Array<Object>} services - All services
 */
export function setServicesForStats(services) {
    allServices = services || [];
    adoptionStatsCache.clear(); // Clear cache when services update
}

/**
 * Create the modal element if it doesn't exist
 */
function createModalIfNeeded() {
    if (document.getElementById(CHECK_FILTER_MODAL_ID)) {
        return;
    }

    const modal = document.createElement('div');
    modal.id = CHECK_FILTER_MODAL_ID;
    modal.className = 'modal hidden';
    modal.innerHTML = `
        <div class="modal-content check-filter-modal-content">
            <div class="check-filter-modal-header">
                <h2>Filter by Check</h2>
                <button class="modal-close" onclick="window.closeCheckFilterModal()">&times;</button>
            </div>
            <div class="check-filter-modal-body">
                <div id="check-filter-modal-content"></div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setupModalHandlers(CHECK_FILTER_MODAL_ID, () => {
        // Optional: callback when modal closes
    });
}

/**
 * Render the toggle button in the container
 */
function renderToggleButton() {
    const container = document.getElementById('check-filter-container');
    if (!container) return;

    const activeCount = getActiveCheckFilterCount(checkFilters);
    const hasSelection = activeCount > 0;

    container.innerHTML = `
        <div class="check-filter-dropdown">
            <button class="check-filter-toggle ${hasSelection ? 'active' : ''}" onclick="window.openCheckFilterModal()">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
                    <path d="M.75 3h14.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5ZM3 7.75A.75.75 0 0 1 3.75 7h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 7.75Zm3 4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path>
                </svg>
                Check Filter${hasSelection ? ` (${activeCount})` : ''}
            </button>
        </div>
    `;
}

/**
 * Open the check filter modal
 */
export function openCheckFilterModal() {
    createModalIfNeeded();

    // Calculate adoption stats for all checks when modal opens
    calculateAllAdoptionStats();

    // Render modal content
    renderModalContent();

    // Show modal
    showModal(CHECK_FILTER_MODAL_ID);

    // Focus search input
    setTimeout(() => {
        const searchInput = document.getElementById('check-filter-search');
        if (searchInput) {
            searchInput.focus();
        }
    }, 100);
}

/**
 * Close the check filter modal
 */
export function closeCheckFilterModal() {
    hideModal(CHECK_FILTER_MODAL_ID);
}

/**
 * Calculate adoption stats for all checks
 */
function calculateAllAdoptionStats() {
    if (!allServices.length || !checksData?.checks) {
        return;
    }

    adoptionStatsCache.clear();

    for (const check of checksData.checks) {
        const stats = calculateOverallCheckAdoption(allServices, check.id);
        adoptionStatsCache.set(check.id, stats);
    }
}

/**
 * Get adoption stats for a check
 * @param {string} checkId - Check ID
 * @returns {Object} { passing, failing, total, percentage }
 */
function getAdoptionStats(checkId) {
    return adoptionStatsCache.get(checkId) || { passing: 0, failing: 0, total: 0, percentage: 0 };
}

/**
 * Render the modal content
 */
function renderModalContent() {
    const contentContainer = document.getElementById('check-filter-modal-content');
    if (!contentContainer) return;

    const activeCount = getActiveCheckFilterCount(checkFilters);
    const checksByCategory = getChecksByCategory();

    contentContainer.innerHTML = `
        <div class="check-filter-search-section">
            <input
                type="text"
                id="check-filter-search"
                placeholder="Search checks by name or description..."
                value="${escapeHtml(searchQuery)}"
                oninput="window.filterCheckOptions(this.value)"
            >
            ${activeCount > 0 ? `
                <div class="check-filter-summary">
                    <span class="check-filter-summary-count">
                        <strong>${activeCount}</strong> filter${activeCount !== 1 ? 's' : ''} active
                    </span>
                    <button class="check-clear-btn" onclick="window.clearCheckFilter(event)">Clear all</button>
                </div>
            ` : ''}
        </div>
        <div id="check-filter-categories">
            ${renderCheckCategories(checksByCategory)}
        </div>
    `;
}

/**
 * Render check categories with collapsible sections
 */
function renderCheckCategories(checksByCategory) {
    const categories = Object.keys(checksByCategory);

    if (categories.length === 0) {
        return '<div class="check-filter-empty">No checks available</div>';
    }

    return categories.map(category => {
        const checks = checksByCategory[category];
        const categoryId = category.toLowerCase().replace(/\s+/g, '-');

        // Calculate category-level stats
        let categoryPassing = 0;
        let categoryTotal = 0;
        checks.forEach(check => {
            const stats = getAdoptionStats(check.id);
            categoryPassing += stats.passing;
            categoryTotal += stats.total;
        });
        const categoryAvgPassing = categoryTotal > 0
            ? Math.round((categoryPassing / categoryTotal) * 100)
            : 0;

        return `
            <div class="check-category-section" data-category="${categoryId}">
                <div class="check-category-header" onclick="window.toggleCheckCategory('${categoryId}')">
                    <div class="check-category-header-left">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"></path>
                        </svg>
                        <span class="check-category-header-title">${escapeHtml(category)}</span>
                        <span class="check-category-header-count">(${checks.length})</span>
                    </div>
                    ${allServices.length > 0 ? `
                        <span class="check-category-header-stats">${categoryAvgPassing}% avg adoption</span>
                    ` : ''}
                </div>
                <div class="check-category-content" id="check-category-${categoryId}">
                    ${checks.map(check => renderCheckOptionCard(check)).join('')}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render a single check option card with description and stats
 */
function renderCheckOptionCard(check) {
    const currentState = checkFilters.get(check.id) || null;
    const stats = getAdoptionStats(check.id);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
        check.name.toLowerCase().includes(searchLower) ||
        check.id.toLowerCase().includes(searchLower) ||
        (check.description || '').toLowerCase().includes(searchLower);

    const display = matchesSearch ? '' : 'display: none;';

    // Determine progress bar class
    let progressClass = 'low';
    if (stats.percentage >= 75) progressClass = 'high';
    else if (stats.percentage >= 40) progressClass = 'medium';

    return `
        <div class="check-option-card" data-check-id="${check.id}" style="${display}">
            <div class="check-option-info">
                <div class="check-option-name">${escapeHtml(check.name)}</div>
                ${check.description ? `
                    <div class="check-option-description">${escapeHtml(check.description)}</div>
                ` : ''}
                ${allServices.length > 0 ? `
                    <div class="check-option-stats">
                        <span class="check-option-stat passing">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
                            </svg>
                            <span class="check-option-stat-value">${stats.passing}</span> passing
                        </span>
                        <span class="check-option-stat failing">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
                            </svg>
                            <span class="check-option-stat-value">${stats.failing}</span> failing
                        </span>
                        ${stats.excluded > 0 ? `
                        <span class="check-option-stat excluded">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/>
                                <line x1="3" y1="13" x2="13" y2="3" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                            <span class="check-option-stat-value">${stats.excluded}</span> excluded
                        </span>
                        ` : ''}
                        <span class="check-option-progress">
                            <span class="check-option-progress-bar">
                                <span class="check-option-progress-fill ${progressClass}" style="width: ${stats.percentage}%"></span>
                            </span>
                            <span class="check-option-progress-text">${stats.percentage}%</span>
                        </span>
                    </div>
                ` : ''}
            </div>
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
 * Toggle category expanded/collapsed
 */
export function toggleCheckCategory(categoryId) {
    const section = document.querySelector(`.check-category-section[data-category="${categoryId}"]`);
    if (section) {
        section.classList.toggle('collapsed');
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
    updateFilterSummary();
    renderToggleButton(); // Update the toggle button to show count
    notifyFilterChange();
}

/**
 * Update check option UI without full re-render
 */
function updateCheckOptionUI(checkId, state) {
    const option = document.querySelector(`.check-option-card[data-check-id="${checkId}"]`);
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
 * Update filter summary in modal
 */
function updateFilterSummary() {
    const searchSection = document.querySelector('.check-filter-search-section');
    if (!searchSection) return;

    const activeCount = getActiveCheckFilterCount(checkFilters);
    const existingSummary = searchSection.querySelector('.check-filter-summary');

    if (activeCount > 0) {
        const summaryHtml = `
            <div class="check-filter-summary">
                <span class="check-filter-summary-count">
                    <strong>${activeCount}</strong> filter${activeCount !== 1 ? 's' : ''} active
                </span>
                <button class="check-clear-btn" onclick="window.clearCheckFilter(event)">Clear all</button>
            </div>
        `;

        if (existingSummary) {
            existingSummary.outerHTML = summaryHtml;
        } else {
            searchSection.insertAdjacentHTML('beforeend', summaryHtml);
        }
    } else if (existingSummary) {
        existingSummary.remove();
    }
}

/**
 * Filter check options by search
 */
export function filterCheckOptions(query) {
    searchQuery = query.toLowerCase();
    const options = document.querySelectorAll('.check-option-card');

    options.forEach(option => {
        const checkId = option.dataset.checkId;
        const check = checksData?.checks?.find(c => c.id === checkId);
        if (!check) return;

        const matchesSearch = !searchQuery ||
            check.name.toLowerCase().includes(searchQuery) ||
            check.id.toLowerCase().includes(searchQuery) ||
            (check.description || '').toLowerCase().includes(searchQuery);

        option.style.display = matchesSearch ? '' : 'none';
    });

    // Show categories that have visible options
    document.querySelectorAll('.check-category-section').forEach(category => {
        const visibleOptions = category.querySelectorAll('.check-option-card:not([style*="display: none"])');
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
    document.querySelectorAll('.check-option-card').forEach(option => {
        option.querySelectorAll('.state-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        option.querySelector('.state-any')?.classList.add('active');
    });

    updateFilterSummary();
    renderToggleButton();
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
    renderToggleButton();
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
window.openCheckFilterModal = openCheckFilterModal;
window.closeCheckFilterModal = closeCheckFilterModal;
window.toggleCheckCategory = toggleCheckCategory;
window.setCheckState = setCheckState;
window.filterCheckOptions = filterCheckOptions;
window.clearCheckFilter = clearCheckFilter;
