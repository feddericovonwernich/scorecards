/**
 * React-friendly workflow trigger functions
 * Wrappers around the main workflow-triggers.ts functions
 * that don't require button elements
 */

import { triggerBulkWorkflows as triggerBulkWorkflowsVanilla } from './workflow-triggers.js';
import type { ServiceData } from '../types/index.js';

/**
 * Trigger workflows for multiple services (React version)
 * @param services Services to trigger workflows for
 * @returns Promise<boolean> true on success
 */
export async function triggerBulkWorkflows(
  services: ServiceData[]
): Promise<boolean> {
  // Create a dummy button for the vanilla function
  const dummyButton = document.createElement('button');
  return await triggerBulkWorkflowsVanilla(services, dummyButton);
}
