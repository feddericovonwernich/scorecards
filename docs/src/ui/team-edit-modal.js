/**
 * Team Edit Modal
 * Modal for creating and editing team metadata
 */

import { showModal, hideModal, setupModalHandlers } from './modals.js';
import { showToast } from './toast.js';
import { getToken, hasToken } from '../services/auth.js';
import { loadTeamById } from '../api/registry.js';
import { API_CONFIG } from '../config/constants.js';
import { escapeHtml } from '../utils/formatting.js';

const MODAL_ID = 'team-edit-modal';

// State
let currentTeam = null;
let isCreateMode = false;
let onSaveCallback = null;

/**
 * Initialize team edit modal
 * @param {Function} onSave - Callback when team is saved
 */
export function initTeamEditModal(onSave) {
    onSaveCallback = onSave;
    ensureModalExists();
    setupModalHandlers(MODAL_ID);
}

/**
 * Ensure the modal HTML exists in the DOM
 */
function ensureModalExists() {
    if (document.getElementById(MODAL_ID)) return;

    const modalHtml = `
        <div id="${MODAL_ID}" class="modal hidden">
            <div class="modal-content team-edit-modal-content">
                <div class="modal-header">
                    <h2 id="team-edit-title">Edit Team</h2>
                    <button class="modal-close" onclick="window.closeTeamEditModal()">&times;</button>
                </div>
                <div class="modal-body" id="team-edit-body">
                    <!-- Form rendered dynamically -->
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * Open modal to edit an existing team
 * @param {string} teamId - Team ID to edit
 */
export async function openTeamEditModal(teamId) {
    if (!hasToken()) {
        showToast('GitHub PAT required to edit teams. Please configure in Settings.', 'error');
        return;
    }

    ensureModalExists();
    isCreateMode = false;

    // Load existing team data
    try {
        currentTeam = await loadTeamById(teamId);
        if (!currentTeam) {
            throw new Error('Team not found');
        }
    } catch (error) {
        console.error('Failed to load team:', error);
        showToast(`Failed to load team: ${error.message}`, 'error');
        return;
    }

    document.getElementById('team-edit-title').textContent = 'Edit Team';
    showModal(MODAL_ID);
    renderForm();
}

/**
 * Open modal to create a new team
 */
export function openCreateTeamModal() {
    if (!hasToken()) {
        showToast('GitHub PAT required to create teams. Please configure in Settings.', 'error');
        return;
    }

    ensureModalExists();
    isCreateMode = true;
    currentTeam = {
        id: '',
        name: '',
        description: '',
        aliases: [],
        metadata: {}
    };

    document.getElementById('team-edit-title').textContent = 'Create Team';
    showModal(MODAL_ID);
    renderForm();
}

/**
 * Close the team edit modal
 */
export function closeTeamEditModal() {
    hideModal(MODAL_ID);
    currentTeam = null;
}

/**
 * Render the edit form
 */
function renderForm() {
    const body = document.getElementById('team-edit-body');
    if (!body || !currentTeam) return;

    const aliasesString = currentTeam.aliases ? currentTeam.aliases.join(', ') : '';

    body.innerHTML = `
        <form id="team-edit-form" class="team-edit-form" onsubmit="window.submitTeamEdit(event)">
            <div class="form-group">
                <label for="team-id">Team ID</label>
                <input
                    type="text"
                    id="team-id"
                    name="team_id"
                    value="${escapeHtml(currentTeam.id || '')}"
                    ${!isCreateMode ? 'readonly' : ''}
                    placeholder="e.g., platform-engineering"
                    pattern="^[a-z0-9-]+$"
                    title="Lowercase letters, numbers, and hyphens only"
                    required
                >
                ${isCreateMode ? '<small class="form-hint">Lowercase letters, numbers, and hyphens only</small>' : ''}
            </div>

            <div class="form-group">
                <label for="team-name">Display Name</label>
                <input
                    type="text"
                    id="team-name"
                    name="name"
                    value="${escapeHtml(currentTeam.name || '')}"
                    placeholder="e.g., Platform Engineering"
                    required
                >
            </div>

            <div class="form-group">
                <label for="team-description">Description</label>
                <textarea
                    id="team-description"
                    name="description"
                    rows="3"
                    placeholder="Brief description of the team's responsibilities"
                >${escapeHtml(currentTeam.description || '')}</textarea>
            </div>

            <div class="form-group">
                <label for="team-aliases">Aliases</label>
                <input
                    type="text"
                    id="team-aliases"
                    name="aliases"
                    value="${escapeHtml(aliasesString)}"
                    placeholder="e.g., platform, plat-eng (comma-separated)"
                >
                <small class="form-hint">Alternative names that map to this team (comma-separated)</small>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="team-slack">Slack Channel</label>
                    <input
                        type="text"
                        id="team-slack"
                        name="slack_channel"
                        value="${escapeHtml(currentTeam.metadata?.slack_channel || '')}"
                        placeholder="#platform-eng"
                    >
                </div>

                <div class="form-group">
                    <label for="team-oncall">On-Call Rotation</label>
                    <input
                        type="text"
                        id="team-oncall"
                        name="oncall_rotation"
                        value="${escapeHtml(currentTeam.metadata?.oncall_rotation || '')}"
                        placeholder="platform-oncall"
                    >
                </div>
            </div>

            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="window.closeTeamEditModal()">
                    Cancel
                </button>
                <button type="submit" class="btn-primary" id="team-save-btn">
                    ${isCreateMode ? 'Create Team' : 'Save Changes'}
                </button>
            </div>
        </form>

        <div class="team-edit-info">
            <p>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>
                </svg>
                Changes are submitted via GitHub workflow and may take a few moments to appear.
            </p>
        </div>
    `;
}

/**
 * Auto-generate team ID from name
 */
export function autoGenerateTeamId() {
    if (!isCreateMode) return;

    const nameInput = document.getElementById('team-name');
    const idInput = document.getElementById('team-id');

    if (nameInput && idInput && !idInput.value) {
        idInput.value = nameInput.value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
}

/**
 * Submit the team edit form
 * @param {Event} event - Form submit event
 */
export async function submitTeamEdit(event) {
    event.preventDefault();

    const form = event.target;
    const saveBtn = document.getElementById('team-save-btn');

    // Collect form data
    const formData = new FormData(form);
    const teamId = formData.get('team_id');
    const name = formData.get('name');
    const description = formData.get('description');
    const aliases = formData.get('aliases');
    const slackChannel = formData.get('slack_channel');
    const oncallRotation = formData.get('oncall_rotation');

    // Validate
    if (!teamId || !teamId.match(/^[a-z0-9-]+$/)) {
        showToast('Team ID must be lowercase letters, numbers, and hyphens only', 'error');
        return;
    }

    if (!name) {
        showToast('Display name is required', 'error');
        return;
    }

    // Disable button and show loading
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner"></span> Saving...';

    try {
        await triggerTeamUpdateWorkflow({
            team_id: teamId,
            action: isCreateMode ? 'create' : 'update',
            name,
            description,
            aliases,
            slack_channel: slackChannel,
            oncall_rotation: oncallRotation
        });

        showToast(
            isCreateMode
                ? `Team "${name}" creation workflow triggered. Changes will appear shortly.`
                : `Team "${name}" update workflow triggered. Changes will appear shortly.`,
            'success'
        );

        closeTeamEditModal();

        // Notify callback
        if (onSaveCallback) {
            onSaveCallback(teamId, isCreateMode);
        }
    } catch (error) {
        console.error('Failed to update team:', error);
        showToast(`Failed to ${isCreateMode ? 'create' : 'update'} team: ${error.message}`, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = isCreateMode ? 'Create Team' : 'Save Changes';
    }
}

/**
 * Trigger the update-team-registry workflow
 * @param {Object} inputs - Workflow inputs
 */
async function triggerTeamUpdateWorkflow(inputs) {
    const token = getToken();
    if (!token) {
        throw new Error('GitHub PAT required');
    }

    // Get repository info from current URL or config
    const repoOwner = getRepoOwnerFromUrl();
    const repoName = getRepoNameFromUrl();

    const workflowFile = 'update-team-registry.yml';
    const endpoint = `${API_CONFIG.GITHUB_BASE_URL}/repos/${repoOwner}/${repoName}/actions/workflows/${workflowFile}/dispatches`;

    // Build inputs object, only including non-empty values
    const workflowInputs = {
        team_id: inputs.team_id,
        action: inputs.action
    };

    if (inputs.name) workflowInputs.name = inputs.name;
    if (inputs.description) workflowInputs.description = inputs.description;
    if (inputs.aliases) workflowInputs.aliases = inputs.aliases;
    if (inputs.slack_channel) workflowInputs.slack_channel = inputs.slack_channel;
    if (inputs.oncall_rotation) workflowInputs.oncall_rotation = inputs.oncall_rotation;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ref: 'main',
            inputs: workflowInputs
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        let message = `HTTP ${response.status}`;

        if (response.status === 404) {
            message = 'Workflow not found or insufficient permissions';
        } else if (response.status === 403) {
            message = 'PAT does not have workflow dispatch permissions';
        } else if (errorText) {
            try {
                const errorJson = JSON.parse(errorText);
                message = errorJson.message || message;
            } catch (e) {
                message = errorText;
            }
        }

        throw new Error(message);
    }
}

/**
 * Get repository owner from current URL
 * @returns {string} Repository owner
 */
function getRepoOwnerFromUrl() {
    // Try to extract from GitHub Pages URL pattern: owner.github.io/repo
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // GitHub Pages: username.github.io/reponame
    const ghPagesMatch = hostname.match(/^([^.]+)\.github\.io$/);
    if (ghPagesMatch) {
        return ghPagesMatch[1];
    }

    // Custom domain - check meta tag or fallback
    const metaOwner = document.querySelector('meta[name="github-repo-owner"]')?.content;
    if (metaOwner) {
        return metaOwner;
    }

    // Fallback - try localStorage or default
    return localStorage.getItem('scorecards-repo-owner') || 'openscorecard';
}

/**
 * Get repository name from current URL
 * @returns {string} Repository name
 */
function getRepoNameFromUrl() {
    const pathname = window.location.pathname;

    // GitHub Pages: /reponame/path
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length > 0 && pathParts[0] !== 'index.html') {
        return pathParts[0];
    }

    // Check meta tag
    const metaRepo = document.querySelector('meta[name="github-repo-name"]')?.content;
    if (metaRepo) {
        return metaRepo;
    }

    // Fallback
    return localStorage.getItem('scorecards-repo-name') || 'scorecards';
}

// Expose functions to window for onclick handlers
window.openTeamEditModal = openTeamEditModal;
window.openCreateTeamModal = openCreateTeamModal;
window.closeTeamEditModal = closeTeamEditModal;
window.submitTeamEdit = submitTeamEdit;
window.autoGenerateTeamId = autoGenerateTeamId;
