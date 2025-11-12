// Scorecards Catalog App

// Configuration
const REPO_OWNER = window.location.hostname.split('.')[0] || 'your-org';
const REPO_NAME = 'scorecards';
const BRANCH = 'main';
const RAW_BASE_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;

// State
let allServices = [];
let filteredServices = [];
let currentFilter = 'all';
let currentSort = 'score-desc';
let searchQuery = '';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadServices();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        filterAndRenderServices();
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.rank;
            filterAndRenderServices();
        });
    });

    // Sort
    document.getElementById('sort-select').addEventListener('change', (e) => {
        currentSort = e.target.value;
        filterAndRenderServices();
    });

    // Modal close
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('service-modal').addEventListener('click', (e) => {
        if (e.target.id === 'service-modal') {
            closeModal();
        }
    });
}

// Load Services from Registry
async function loadServices() {
    try {
        const registryUrl = `${RAW_BASE_URL}/registry/services.json`;
        const response = await fetch(registryUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch registry: ${response.status}`);
        }

        allServices = await response.json();
        filteredServices = [...allServices];

        updateStats();
        filterAndRenderServices();
    } catch (error) {
        console.error('Error loading services:', error);
        document.getElementById('services-grid').innerHTML = `
            <div class="empty-state">
                <h3>No Services Found</h3>
                <p>No services have run scorecards yet, or the registry is not available.</p>
                <p style="margin-top: 10px; font-size: 0.9rem; color: #999;">
                    Error: ${error.message}
                </p>
            </div>
        `;
    }
}

// Update Statistics
function updateStats() {
    const total = allServices.length;
    const avgScore = total > 0
        ? Math.round(allServices.reduce((sum, s) => sum + s.score, 0) / total)
        : 0;

    const rankCounts = {
        platinum: allServices.filter(s => s.rank === 'platinum').length,
        gold: allServices.filter(s => s.rank === 'gold').length,
        silver: allServices.filter(s => s.rank === 'silver').length,
        bronze: allServices.filter(s => s.rank === 'bronze').length
    };

    document.getElementById('total-services').textContent = total;
    document.getElementById('avg-score').textContent = avgScore;
    document.getElementById('platinum-count').textContent = rankCounts.platinum;
    document.getElementById('gold-count').textContent = rankCounts.gold;
    document.getElementById('silver-count').textContent = rankCounts.silver;
    document.getElementById('bronze-count').textContent = rankCounts.bronze;
}

// Filter and Render Services
function filterAndRenderServices() {
    // Filter
    filteredServices = allServices.filter(service => {
        // Rank filter
        if (currentFilter !== 'all' && service.rank !== currentFilter) {
            return false;
        }

        // Search filter
        if (searchQuery) {
            const searchText = `${service.name} ${service.org} ${service.repo} ${service.team || ''}`.toLowerCase();
            if (!searchText.includes(searchQuery)) {
                return false;
            }
        }

        return true;
    });

    // Sort
    filteredServices.sort((a, b) => {
        switch (currentSort) {
            case 'score-desc':
                return b.score - a.score;
            case 'score-asc':
                return a.score - b.score;
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'updated-desc':
                return new Date(b.last_updated) - new Date(a.last_updated);
            default:
                return 0;
        }
    });

    renderServices();
}

// Render Services Grid
function renderServices() {
    const grid = document.getElementById('services-grid');

    if (filteredServices.length === 0) {
        grid.innerHTML = '<div class="empty-state"><h3>No services match your criteria</h3></div>';
        return;
    }

    grid.innerHTML = filteredServices.map(service => `
        <div class="service-card rank-${service.rank}" onclick="showServiceDetail('${service.org}', '${service.repo}')">
            <div class="service-header">
                <div>
                    <div class="service-name">${escapeHtml(service.name)}</div>
                    <div class="service-org">${escapeHtml(service.org)}/${escapeHtml(service.repo)}</div>
                </div>
                <div class="score-badge">${service.score}</div>
            </div>
            <div class="rank-badge ${service.rank}">${capitalize(service.rank)}</div>
            ${service.team ? `<div>Team: ${escapeHtml(service.team)}</div>` : ''}
            <div class="service-meta">
                Last updated: ${formatDate(service.last_updated)}
            </div>
        </div>
    `).join('');
}

// Show Service Detail Modal
async function showServiceDetail(org, repo) {
    const modal = document.getElementById('service-modal');
    const detailDiv = document.getElementById('service-detail');

    modal.classList.remove('hidden');
    detailDiv.innerHTML = '<div class="loading">Loading service details...</div>';

    try {
        const resultsUrl = `${RAW_BASE_URL}/results/${org}/${repo}/results.json`;
        const response = await fetch(resultsUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch results: ${response.status}`);
        }

        const data = await response.json();

        detailDiv.innerHTML = `
            <h2>${escapeHtml(data.service.name)}</h2>
            <p style="color: #7f8c8d; margin-bottom: 20px;">
                ${escapeHtml(data.service.org)}/${escapeHtml(data.service.repo)}
            </p>

            <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                <div>
                    <div style="font-size: 3rem; font-weight: bold;">${data.score}</div>
                    <div style="color: #7f8c8d;">Score</div>
                </div>
                <div>
                    <div class="rank-badge ${data.rank}" style="font-size: 1.2rem; padding: 10px 20px;">
                        ${capitalize(data.rank)}
                    </div>
                    <div style="color: #7f8c8d; margin-top: 8px;">Rank</div>
                </div>
                <div>
                    <div style="font-size: 2rem; font-weight: bold;">${data.passed_checks}/${data.total_checks}</div>
                    <div style="color: #7f8c8d;">Checks Passed</div>
                </div>
            </div>

            ${data.service.team ? `<p><strong>Team:</strong> ${escapeHtml(data.service.team)}</p>` : ''}
            <p><strong>Last Run:</strong> ${formatDate(data.timestamp)}</p>
            <p><strong>Commit:</strong> <code>${data.commit_sha.substring(0, 7)}</code></p>

            <h3 style="margin-top: 30px; margin-bottom: 15px;">Check Results</h3>

            <div>
                ${data.checks.map(check => `
                    <div class="check-result ${check.status}">
                        <div class="check-name">
                            ${check.status === 'pass' ? '✓' : '✗'} ${escapeHtml(check.name)}
                        </div>
                        <div class="check-description">${escapeHtml(check.description)}</div>
                        ${check.stdout.trim() ? `
                            <div class="check-output">
                                <strong>Output:</strong><br>
                                ${escapeHtml(check.stdout.trim())}
                            </div>
                        ` : ''}
                        ${check.stderr.trim() && check.status === 'fail' ? `
                            <div class="check-output" style="color: #c62828;">
                                <strong>Error:</strong><br>
                                ${escapeHtml(check.stderr.trim())}
                            </div>
                        ` : ''}
                        <div style="margin-top: 8px; font-size: 0.85rem; color: #999;">
                            Weight: ${check.weight} | Duration: ${check.duration}s
                        </div>
                    </div>
                `).join('')}
            </div>

            <h3 style="margin-top: 30px; margin-bottom: 15px;">Badges</h3>
            <p style="font-size: 0.9rem; color: #7f8c8d; margin-bottom: 10px;">
                Add these to your README:
            </p>
            <pre style="background: #f5f7fa; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 0.85rem;">![Score](https://img.shields.io/endpoint?url=${RAW_BASE_URL}/badges/${org}/${repo}/score.json)
![Rank](https://img.shields.io/endpoint?url=${RAW_BASE_URL}/badges/${org}/${repo}/rank.json)</pre>
        `;
    } catch (error) {
        console.error('Error loading service details:', error);
        detailDiv.innerHTML = `
            <h3>Error Loading Details</h3>
            <p>Could not load details for ${org}/${repo}</p>
            <p style="color: #999; font-size: 0.9rem;">${error.message}</p>
        `;
    }
}

// Close Modal
function closeModal() {
    document.getElementById('service-modal').classList.add('hidden');
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
