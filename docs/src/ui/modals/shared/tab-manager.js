/**
 * Generic tab management utility
 * @module ui/modals/shared/tab-manager
 */

/**
 * @typedef {Object} TabConfig
 * @property {string} containerId - Modal container ID
 * @property {string} [tabButtonSelector] - Selector for tab buttons
 * @property {string} [tabContentSelector] - Selector for tab content
 * @property {string} [activeClass] - Class for active state
 * @property {Function} [getTabContentId] - Function to get tab content element ID from tab name
 * @property {Object<string, Function>} [onActivate] - Callbacks when tabs activate
 */

/**
 * Create a tab manager for a modal
 * @param {TabConfig} config
 * @returns {{switchTab: Function, getActiveTab: Function}}
 */
export function createTabManager(config) {
    const {
        containerId,
        tabButtonSelector = '.tab-btn',
        tabContentSelector = '.tab-content',
        activeClass = 'active',
        getTabContentId = (tabName) => `${tabName}-tab`,
        onActivate = {}
    } = config;

    const container = document.getElementById(containerId);
    if (!container) {
        throw new Error(`Container not found: ${containerId}`);
    }

    /**
     * Switch to a specific tab
     * @param {string} tabName - Tab identifier
     * @param {Event} [event] - Click event (optional)
     */
    function switchTab(tabName, event) {
        // Remove active from all buttons
        container.querySelectorAll(tabButtonSelector).forEach(btn => {
            btn.classList.remove(activeClass);
        });

        // Remove active from all content
        container.querySelectorAll(tabContentSelector).forEach(content => {
            content.classList.remove(activeClass);
        });

        // Activate clicked button
        if (event?.target) {
            event.target.classList.add(activeClass);
        } else {
            const btn = container.querySelector(`${tabButtonSelector}[data-tab="${tabName}"]`);
            if (btn) {
                btn.classList.add(activeClass);
            }
        }

        // Activate content
        const content = document.getElementById(getTabContentId(tabName));
        if (content) {
            content.classList.add(activeClass);
        }

        // Call activation callback if exists
        if (onActivate[tabName]) {
            onActivate[tabName]();
        }
    }

    /**
     * Get currently active tab name
     * @returns {string|null}
     */
    function getActiveTab() {
        const activeBtn = container.querySelector(`${tabButtonSelector}.${activeClass}`);
        return activeBtn?.dataset.tab || null;
    }

    return { switchTab, getActiveTab };
}
