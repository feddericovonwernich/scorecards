/**
 * Workflow configuration - centralizes workflow names and API settings
 * @module config/workflows
 */

import type { WorkflowConfig } from '../types/index';

export const WORKFLOWS: WorkflowConfig = {
  files: {
    triggerService: 'trigger-service-workflow.yml',
    createInstallPR: 'create-installation-pr.yml',
    scorecard: 'scorecard.yml',
  },
  polling: {
    default: 30000,
    min: 10000,
    max: 120000,
  },
};

/**
 * Build workflow dispatch URL
 */
export function getWorkflowDispatchUrl(
  owner: string,
  repo: string,
  workflowFile: string
): string {
  return `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;
}
