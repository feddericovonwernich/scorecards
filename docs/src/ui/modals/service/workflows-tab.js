/**
 * Service modal workflows tab component
 * @module ui/modals/service/workflows-tab
 */

/**
 * Renders workflows tab content
 * @returns {string} HTML for workflows tab
 */
export function renderWorkflowsTab() {
    return `
        <div class="tab-content" id="workflows-tab">
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div class="widget-filters" style="margin: 0;">
                        <button class="widget-filter-btn active" data-status="all" onclick="filterServiceWorkflows('all')">
                            All <span class="filter-count" id="service-filter-count-all">0</span>
                        </button>
                        <button class="widget-filter-btn" data-status="in_progress" onclick="filterServiceWorkflows('in_progress')">
                            In Progress <span class="filter-count" id="service-filter-count-in_progress">0</span>
                        </button>
                        <button class="widget-filter-btn" data-status="queued" onclick="filterServiceWorkflows('queued')">
                            Queued <span class="filter-count" id="service-filter-count-queued">0</span>
                        </button>
                        <button class="widget-filter-btn" data-status="completed" onclick="filterServiceWorkflows('completed')">
                            Completed <span class="filter-count" id="service-filter-count-completed">0</span>
                        </button>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <select id="service-workflow-interval-select" class="widget-interval-select" onchange="changeServicePollingInterval()" title="Auto-refresh interval">
                            <option value="5000">5s</option>
                            <option value="10000">10s</option>
                            <option value="15000">15s</option>
                            <option value="30000" selected>30s</option>
                            <option value="60000">1m</option>
                            <option value="120000">2m</option>
                            <option value="300000">5m</option>
                            <option value="0">Off</option>
                        </select>
                        <button id="service-workflow-refresh" class="widget-refresh-btn" onclick="refreshServiceWorkflowRuns()" title="Refresh" style="padding: 6px 10px;">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div id="service-workflows-content">
                <div class="loading">Click to load workflow runs...</div>
            </div>
        </div>
    `;
}
