/**
 * WorkflowRunItem Component
 * Renders a single workflow run in the actions widget
 */

import { useState, useEffect } from 'react';
import { formatDuration } from '../../../utils/formatting.js';
import { cn } from '../../../utils/css.js';
import type { WorkflowRun, WorkflowConclusion } from '../../../types/index.js';

interface WorkflowRunItemProps {
  run: WorkflowRun;
}

function getStatusIcon(status: string, conclusion: WorkflowConclusion | null): React.ReactNode {
  if (status === 'in_progress') {
    return (
      <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
    );
  }
  if (status === 'queued') {
    return <span>&#8987;</span>; // hourglass
  }
  if (status === 'completed') {
    if (conclusion === 'success') {return <span className="text-success">&#10003;</span>;}
    if (conclusion === 'failure') {return <span className="text-error">&#10007;</span>;}
    if (conclusion === 'cancelled') {return <span className="text-text-muted">&#8709;</span>;}
    return <span>&#9679;</span>;
  }
  return <span>&#9679;</span>;
}

interface DurationInfo {
  label: string;
  time: string;
}

function calculateDuration(run: WorkflowRun): DurationInfo {
  const now = new Date();

  if (run.status === 'completed') {
    const completedAt = new Date(run.updated_at);
    const timeSince = now.getTime() - completedAt.getTime();
    return { label: 'Completed', time: formatDuration(timeSince) };
  }
  if (run.status === 'in_progress') {
    const startedAt = new Date(run.run_started_at || run.created_at);
    const elapsed = now.getTime() - startedAt.getTime();
    return { label: 'Running for', time: formatDuration(elapsed) };
  }
  // Queued
  const createdAt = new Date(run.created_at);
  const waiting = now.getTime() - createdAt.getTime();
  return { label: 'Queued', time: formatDuration(waiting) };
}

export function WorkflowRunItem({ run }: WorkflowRunItemProps) {
  const [duration, setDuration] = useState(() => calculateDuration(run));

  // Update duration every second for running workflows
  useEffect(() => {
    if (run.status === 'in_progress' || run.status === 'queued') {
      const interval = setInterval(() => {
        setDuration(calculateDuration(run));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [run]);

  // Determine the CSS modifier class based on status/conclusion
  const statusModifier = run.status === 'completed'
    ? `widget-run-item--${run.conclusion || 'neutral'}`
    : `widget-run-item--${run.status}`;

  // Determine the status icon class (use conclusion for completed)
  const statusIconClass = run.status === 'completed'
    ? `status-${run.conclusion || 'neutral'}`
    : `status-${run.status}`;

  return (
    <div className={cn('widget-run-item', statusModifier)}>
      {/* Header row */}
      <div className="widget-run-header">
        <span className={cn('widget-run-status', statusIconClass)}>
          {getStatusIcon(run.status, run.conclusion)}
        </span>
        <div className="widget-run-info">
          <div className="widget-run-name">{run.name}</div>
          <div className="widget-run-repo">{run.org}/{run.repo}</div>
        </div>
      </div>

      {/* Footer row */}
      <div className="widget-run-meta">
        <span className="widget-run-duration">
          {duration.label} {duration.time}
        </span>
        <a
          href={run.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="widget-run-link"
          onClick={(e) => e.stopPropagation()}
        >
          View
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z" />
          </svg>
        </a>
      </div>
    </div>
  );
}

export default WorkflowRunItem;
