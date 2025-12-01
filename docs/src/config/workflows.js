/**
 * Workflow configuration - centralizes workflow names and API settings
 * @module config/workflows
 */

/** @type {import('../types').WorkflowConfig} */
export const WORKFLOWS = {
    files: {
        triggerService: 'trigger-service-workflow.yml',
        createInstallPR: 'create-installation-pr.yml',
        scorecard: 'scorecard.yml'
    },
    polling: {
        default: 30000,
        min: 10000,
        max: 120000
    }
};

/**
 * Build workflow dispatch URL
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} workflowFile - Workflow filename
 * @returns {string}
 */
export function getWorkflowDispatchUrl(owner, repo, workflowFile) {
    return `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;
}
