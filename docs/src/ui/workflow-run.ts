/**
 * Workflow Run Rendering
 * Functions for rendering GitHub Actions workflow runs
 */

import { escapeHtml, formatDuration } from '../utils/formatting.js';
import type { WorkflowRun, WorkflowStatus, WorkflowConclusion } from '../types/index.js';

export interface DurationInfo {
  label: string;
  time: string;
}

/**
 * Render a workflow run card
 */
export function renderWorkflowRun(run: WorkflowRun): string {
  const statusClass =
    run.status === 'completed'
      ? run.conclusion === 'success'
        ? 'success'
        : run.conclusion === 'failure'
          ? 'failure'
          : 'neutral'
      : run.status;

  const statusIcon = getStatusIcon(run.status, run.conclusion || null);
  const durationInfo = calculateDuration(run);

  return `
        <div class="widget-run-item" data-run-id="${run.id}">
            <div class="widget-run-header">
                <span class="widget-run-status status-${statusClass}">${statusIcon}</span>
                <div class="widget-run-info">
                    <div class="widget-run-name">${escapeHtml(run.name)}</div>
                    <div class="widget-run-repo">${escapeHtml(run.org || '')}/${escapeHtml(run.repo || '')}</div>
                </div>
            </div>
            <div class="widget-run-meta">
                <span class="widget-run-duration" data-started="${run.run_started_at || run.created_at}" data-status="${run.status}">
                    ${durationInfo.label} ${durationInfo.time}
                </span>
                <a href="${run.html_url}" target="_blank" rel="noopener noreferrer" class="widget-run-link" onclick="event.stopPropagation()">
                    View
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"></path>
                    </svg>
                </a>
            </div>
        </div>
    `;
}

/**
 * Get status icon based on workflow status and conclusion
 */
export function getStatusIcon(
  status: WorkflowStatus,
  conclusion: WorkflowConclusion | null
): string {
  if (status === 'in_progress') {
    return '<span class="spinner-small"></span>';
  } else if (status === 'queued') {
    return '⏳';
  } else if (status === 'completed') {
    if (conclusion === 'success') {return '✓';}
    if (conclusion === 'failure') {return '✗';}
    if (conclusion === 'cancelled') {return '⊘';}
    return '●';
  }
  return '●';
}

/**
 * Calculate duration information for a workflow run
 */
export function calculateDuration(run: WorkflowRun): DurationInfo {
  const now = new Date();

  if (run.status === 'completed') {
    // Show time since completion
    const completedAt = new Date(run.updated_at);
    const timeSince = now.getTime() - completedAt.getTime();
    return {
      label: 'Completed',
      time: formatDuration(timeSince),
    };
  } else if (run.status === 'in_progress') {
    // Show running time
    const startedAt = new Date(run.run_started_at || run.created_at);
    const elapsed = now.getTime() - startedAt.getTime();
    return {
      label: 'Running for',
      time: formatDuration(elapsed),
    };
  } else {
    // Queued - show time since creation
    const createdAt = new Date(run.created_at);
    const waiting = now.getTime() - createdAt.getTime();
    return {
      label: 'Queued',
      time: formatDuration(waiting),
    };
  }
}
