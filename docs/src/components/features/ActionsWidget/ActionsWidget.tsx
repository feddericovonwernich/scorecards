/**
 * ActionsWidget Component
 * Slide-in sidebar widget for monitoring GitHub Actions workflow runs
 * Replaces vanilla JS ui/actions-widget.ts
 */

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { WorkflowRunItem } from './WorkflowRunItem.js';
import { useActionsWidget } from '../../../hooks/useWorkflowPolling.js';
import {
  useAppStore,
  selectActionsWidgetOpen,
  selectPAT,
} from '../../../stores/appStore.js';
import { getRepoOwner, getRepoName } from '../../../api/registry.js';
import { formatInterval } from '../../../utils/formatting.js';
import { cn } from '../../../utils/css.js';
import type { WorkflowStatus } from '../../../types/index.js';

// Polling interval options (in ms)
const POLLING_INTERVALS = [
  { value: 0, label: 'Disabled' },
  { value: 5000, label: '5s' },
  { value: 10000, label: '10s' },
  { value: 15000, label: '15s' },
  { value: 30000, label: '30s' },
  { value: 60000, label: '1m' },
  { value: 120000, label: '2m' },
  { value: 300000, label: '5m' },
];

export function ActionsWidget() {
  // Store state
  const isOpen = useAppStore(selectActionsWidgetOpen);
  const pat = useAppStore(selectPAT);
  const toggleWidget = useAppStore((state) => state.toggleActionsWidget);

  // Workflow polling hook
  const {
    filteredRuns,
    filterStatus,
    loading,
    error,
    filterCounts,
    pollInterval,
    isPolling,
    refresh,
    startPolling,
    stopPolling,
    setFilterStatus,
    setPollingInterval,
  } = useActionsWidget();

  // Start/stop polling based on widget open state and PAT
  useEffect(() => {
    if (isOpen && pat) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [isOpen, pat, startPolling, stopPolling]);

  const handleFilterClick = useCallback((status: 'all' | WorkflowStatus) => {
    setFilterStatus(status);
  }, [setFilterStatus]);

  const handleIntervalChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newInterval = parseInt(e.target.value, 10);
    setPollingInterval(newInterval);
  }, [setPollingInterval]);

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handleClose = useCallback(() => {
    toggleWidget();
  }, [toggleWidget]);

  const actionsUrl = `https://github.com/${getRepoOwner()}/${getRepoName()}/actions`;

  const widget = (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="widget-backdrop" onClick={handleClose} />
      )}

      {/* Sidebar */}
      <div className={cn('widget-sidebar', isOpen && 'open')}>
        {/* Header */}
        <div className="widget-header">
          <h3>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z" />
            </svg>
            GitHub Actions
          </h3>
          <div className="widget-header-actions">
            <a
              href={actionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="widget-header-link"
              title="Open in GitHub"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z" />
              </svg>
            </a>
            <button
              onClick={handleClose}
              className="widget-close-btn"
              aria-label="Close widget"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="widget-filters">
          {(['all', 'in_progress', 'queued', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => handleFilterClick(status)}
              className={cn('filter-btn', filterStatus === status && 'filter-btn--active')}
            >
              {status === 'all' ? 'All' : status === 'in_progress' ? 'Running' : status === 'queued' ? 'Queued' : 'Done'}
              <span className="filter-btn__count">
                ({filterCounts[status === 'in_progress' ? 'in_progress' : status]})
              </span>
            </button>
          ))}
        </div>

        {/* Controls row */}
        <div className="widget-controls">
          <div className="widget-controls__interval">
            <span>Refresh:</span>
            <select
              value={pollInterval}
              onChange={handleIntervalChange}
              aria-label="Refresh interval"
              className="widget-interval-select"
            >
              {POLLING_INTERVALS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={cn('widget-refresh-btn', loading && 'spinning')}
            title="Refresh now"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="widget-content">
          {!pat ? (
            <div className="widget-empty">
              <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 4a4 4 0 1 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm8.25 3.5h-8.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25ZM10.5 4a2.5 2.5 0 1 0-5 0v2h5Z" />
              </svg>
              <p>Configure GitHub PAT in settings to view workflow runs</p>
              <button
                onClick={() => {
                  handleClose();
                  useAppStore.getState().openModal('settings');
                }}
                className="btn btn--primary"
              >
                Configure Token
              </button>
            </div>
          ) : error ? (
            <div className="widget-empty widget-empty--error">
              <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0a8 8 0 1 0 8 8A8 8 0 0 0 8 0Zm3.72 10.78a.75.75 0 1 1-1.06 1.06L8 9.06l-2.66 2.78a.75.75 0 0 1-1.06-1.06L6.94 8 4.28 5.22a.75.75 0 0 1 1.06-1.06L8 6.94l2.66-2.78a.75.75 0 0 1 1.06 1.06L9.06 8Z" />
              </svg>
              <p className="widget-error-msg">Error loading workflow runs</p>
              <p>{error}</p>
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="widget-empty">
              <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z" />
              </svg>
              <p>
                No {filterStatus === 'all' ? '' : filterStatus.replace('_', ' ')} workflow runs in the last 24 hours
              </p>
            </div>
          ) : (
            <>
              {filteredRuns.map((run) => (
                <WorkflowRunItem key={run.id} run={run} />
              ))}
            </>
          )}
        </div>

        {/* Status bar */}
        <div className={cn('widget-status-bar', !isPolling && 'widget-status-bar--disabled')}>
          {isPolling ? (
            <span>Auto-refreshing every {formatInterval(pollInterval)}</span>
          ) : (
            <span>Auto-refresh disabled</span>
          )}
        </div>
      </div>
    </>
  );

  // Render to body via portal
  return createPortal(widget, document.body);
}

export default ActionsWidget;
