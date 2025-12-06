/**
 * Workflows Tab Component
 * Displays workflow runs for a service
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { WorkflowRunItem } from '../../../features/ActionsWidget/WorkflowRunItem.js';
import { useAppStore, selectPAT } from '../../../../stores/appStore.js';
import type { WorkflowRun } from '../../../../types/index.js';

interface WorkflowsTabProps {
  org: string;
  repo: string;
  runs: WorkflowRun[];
  onRunsUpdate: (runs: WorkflowRun[]) => void;
}

type FilterStatus = 'all' | 'in_progress' | 'queued' | 'completed';

const POLLING_INTERVALS = [
  { value: 5000, label: '5s' },
  { value: 10000, label: '10s' },
  { value: 15000, label: '15s' },
  { value: 30000, label: '30s' },
  { value: 60000, label: '1m' },
  { value: 120000, label: '2m' },
  { value: 300000, label: '5m' },
  { value: 0, label: 'Off' },
];

/**
 * Workflows Tab Component
 */
export function WorkflowsTab({
  org,
  repo,
  runs,
  onRunsUpdate,
}: WorkflowsTabProps) {
  const pat = useAppStore(selectPAT);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [pollingInterval, setPollingInterval] = useState(30000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch workflow runs
  const fetchRuns = useCallback(async () => {
    if (!org || !repo || !pat) {return;}

    setLoading(true);
    setError(null);

    try {
      const { fetchWorkflowRuns } = await import('../../../../api/github.js');
      const workflowRuns = await fetchWorkflowRuns(org, repo);
      onRunsUpdate(workflowRuns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, [org, repo, pat, onRunsUpdate]);

  // Initial fetch
  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Polling
  useEffect(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (pollingInterval > 0) {
      pollIntervalRef.current = setInterval(fetchRuns, pollingInterval);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [pollingInterval, fetchRuns]);

  // Filter runs
  const filteredRuns = runs.filter((run) => {
    if (filter === 'all') {return true;}
    return run.status === filter;
  });

  // Count by status
  const counts = {
    all: runs.length,
    in_progress: runs.filter((r) => r.status === 'in_progress').length,
    queued: runs.filter((r) => r.status === 'queued').length,
    completed: runs.filter((r) => r.status === 'completed').length,
  };

  // Show empty state when not authenticated
  if (!pat) {
    return (
      <div className="tab-panel" id="workflows-tab">
        <div className="widget-empty">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 4a4 4 0 1 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm8.25 3.5h-8.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25ZM10.5 4a2.5 2.5 0 1 0-5 0v2h5Z" />
          </svg>
          <p>Configure GitHub PAT in settings to view workflow runs</p>
          <button
            onClick={() => useAppStore.getState().openModal('settings')}
            className="btn btn--primary"
          >
            Configure Token
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-panel" id="workflows-tab">
      {/* Filter buttons and controls */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
          }}
        >
          <div className="widget-filters" style={{ margin: 0, flex: 1 }}>
            {(['all', 'in_progress', 'queued', 'completed'] as FilterStatus[]).map(
              (status) => (
                <button
                  key={status}
                  className={`filter-btn ${filter === status ? 'filter-btn--active' : ''}`}
                  onClick={() => setFilter(status)}
                >
                  {status === 'all'
                    ? 'All'
                    : status === 'in_progress'
                      ? 'Running'
                      : status === 'queued'
                        ? 'Queued'
                        : 'Done'}
                  <span className="filter-btn__count">({counts[status]})</span>
                </button>
              )
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              className="widget-interval-select"
              value={pollingInterval}
              onChange={(e) => setPollingInterval(Number(e.target.value))}
              title="Auto-refresh interval"
              aria-label="Auto-refresh interval"
            >
              {POLLING_INTERVALS.map((interval) => (
                <option key={interval.value} value={interval.value}>
                  {interval.label}
                </option>
              ))}
            </select>
            <button
              className="widget-refresh-btn"
              onClick={fetchRuns}
              title="Refresh"
              style={{ padding: '6px 10px' }}
              disabled={loading}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div id="service-workflows-content">
        {loading && runs.length === 0 && (
          <div className="loading">Loading workflow runs...</div>
        )}
        {error && (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchRuns} className="btn-primary">
              Try Again
            </button>
          </div>
        )}
        {!loading && !error && filteredRuns.length === 0 && (
          <div className="empty-state">No workflow runs found</div>
        )}
        {filteredRuns.length > 0 && (
          <div className="workflow-runs-list">
            {filteredRuns.map((run) => (
              <WorkflowRunItem key={run.id} run={run} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkflowsTab;
