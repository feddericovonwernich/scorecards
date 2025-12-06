/**
 * useWorkflowPolling Hook
 * Reusable hook for polling GitHub Actions workflow runs
 * Replaces logic from ui/actions-widget.ts and ui/service-workflows.ts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore, selectPAT } from '../stores/appStore.js';
import { API_CONFIG, TIMING, STORAGE_KEYS } from '../config/constants.js';
import { getRepoOwner, getRepoName } from '../api/registry.js';
import type { WorkflowRun, WorkflowStatus } from '../types/index.js';

export interface WorkflowFilterCounts {
  all: number;
  in_progress: number;
  queued: number;
  completed: number;
}

export interface UseWorkflowPollingOptions {
  /** Organization/owner to fetch workflows for */
  org?: string;
  /** Repository name to fetch workflows for */
  repo?: string;
  /** Initial polling interval in milliseconds (default: 30000) */
  initialInterval?: number;
  /** Whether to automatically start polling (default: false) */
  autoStart?: boolean;
  /** Storage key for persisting interval preference */
  storageKey?: string;
  /** Cache TTL in milliseconds (default: 15000) */
  cacheTTL?: number;
  /** Filter to only recent runs within last N hours (default: 24) */
  recentHours?: number;
}

export interface UseWorkflowPollingReturn {
  /** List of workflow runs */
  runs: WorkflowRun[];
  /** Filtered runs based on current filter status */
  filteredRuns: WorkflowRun[];
  /** Current filter status */
  filterStatus: 'all' | WorkflowStatus;
  /** Whether data is currently loading */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Filter counts for each status */
  filterCounts: WorkflowFilterCounts;
  /** Badge count (in_progress + queued) */
  badgeCount: number;
  /** Current polling interval */
  pollInterval: number;
  /** Whether polling is currently active */
  isPolling: boolean;
  /** Manually refresh data */
  refresh: () => Promise<void>;
  /** Start polling */
  startPolling: () => void;
  /** Stop polling */
  stopPolling: () => void;
  /** Set filter status */
  setFilterStatus: (status: 'all' | WorkflowStatus) => void;
  /** Change polling interval */
  setPollingInterval: (interval: number) => void;
}

interface GitHubWorkflowRunResponse {
  workflow_runs: Array<{
    id: number;
    name: string;
    status: 'queued' | 'in_progress' | 'completed' | 'waiting';
    conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | 'neutral' | null;
    html_url: string;
    created_at: string;
    updated_at: string;
    run_started_at?: string;
    head_sha?: string;
    head_branch?: string;
    jobs_url?: string;
  }>;
}

export function useWorkflowPolling(options: UseWorkflowPollingOptions = {}): UseWorkflowPollingReturn {
  const {
    org: propOrg,
    repo: propRepo,
    initialInterval = TIMING.WORKFLOW_POLL_DEFAULT,
    autoStart = false,
    storageKey,
    cacheTTL = TIMING.CACHE_MEDIUM,
    recentHours = 24,
  } = options;

  // Use scorecards repo as default if no org/repo specified
  const org = propOrg || getRepoOwner();
  const repo = propRepo || getRepoName();

  // Get PAT from store
  const pat = useAppStore(selectPAT);

  // State
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | WorkflowStatus>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState(() => {
    // Load saved interval from localStorage if storageKey provided
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        return parseInt(saved, 10);
      }
    }
    return initialInterval;
  });
  const [isPolling, setIsPolling] = useState(false);

  // Refs for mutable values
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchRef = useRef<number>(0);

  // Calculate filter counts
  const filterCounts: WorkflowFilterCounts = {
    all: runs.length,
    in_progress: runs.filter((r) => r.status === 'in_progress').length,
    queued: runs.filter((r) => r.status === 'queued').length,
    completed: runs.filter((r) => r.status === 'completed').length,
  };

  // Badge count is active runs (in progress + queued)
  const badgeCount = filterCounts.in_progress + filterCounts.queued;

  // Filtered runs based on current filter status
  const filteredRuns = filterStatus === 'all'
    ? runs
    : runs.filter((r) => r.status === filterStatus);

  // Fetch workflow runs
  const fetchRuns = useCallback(async (force = false): Promise<void> => {
    if (!pat) {
      setError('No GitHub PAT configured');
      setRuns([]);
      return;
    }

    // Check cache
    const now = Date.now();
    if (!force && now - lastFetchRef.current < cacheTTL && runs.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_CONFIG.GITHUB_BASE_URL}/repos/${org}/${repo}/actions/runs?per_page=${API_CONFIG.PER_PAGE}&_t=${now}`,
        {
          headers: {
            Authorization: `token ${pat}`,
            Accept: API_CONFIG.ACCEPT_HEADER,
          },
          cache: 'no-cache',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch workflow runs: ${response.status}`);
      }

      const data: GitHubWorkflowRunResponse = await response.json();

      // Map and filter to recent runs
      const cutoffTime = new Date(now - recentHours * 60 * 60 * 1000);
      const mappedRuns: WorkflowRun[] = data.workflow_runs
        .map((run) => ({
          ...run,
          org,
          repo,
          service_name: repo,
        }))
        .filter((run) => new Date(run.created_at) > cutoffTime)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      setRuns(mappedRuns);
      lastFetchRef.current = now;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error('Error fetching workflow runs:', err);
    } finally {
      setLoading(false);
    }
  }, [pat, org, repo, cacheTTL, recentHours, runs.length]);

  // Manual refresh (clears cache)
  const refresh = useCallback(async (): Promise<void> => {
    lastFetchRef.current = 0;
    await fetchRuns(true);
  }, [fetchRuns]);

  // Start polling
  const startPolling = useCallback(() => {
    // Clear existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Initial fetch
    fetchRuns();

    // If interval is 0, don't start polling
    if (pollInterval === 0) {
      setIsPolling(false);
      return;
    }

    // Set up polling
    pollIntervalRef.current = setInterval(() => {
      fetchRuns();
    }, pollInterval);

    setIsPolling(true);
  }, [fetchRuns, pollInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Change polling interval
  const setPollingInterval = useCallback((interval: number) => {
    setPollInterval(interval);

    // Save to localStorage if storageKey provided
    if (storageKey) {
      localStorage.setItem(storageKey, String(interval));
    }

    // Restart polling with new interval if currently polling
    if (isPolling) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      if (interval === 0) {
        setIsPolling(false);
      } else {
        pollIntervalRef.current = setInterval(() => {
          fetchRuns();
        }, interval);
      }
    }
  }, [storageKey, isPolling, fetchRuns]);

  // Auto-start polling if requested and PAT available
  useEffect(() => {
    if (autoStart && pat) {
      startPolling();
    }

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [autoStart, pat, startPolling]);

  // Refetch when PAT changes
  useEffect(() => {
    if (pat && isPolling) {
      fetchRuns(true);
    } else if (!pat) {
      setRuns([]);
      setError('No GitHub PAT configured');
    }
  }, [pat, isPolling, fetchRuns]);

  return {
    runs,
    filteredRuns,
    filterStatus,
    loading,
    error,
    filterCounts,
    badgeCount,
    pollInterval,
    isPolling,
    refresh,
    startPolling,
    stopPolling,
    setFilterStatus,
    setPollingInterval,
  };
}

/**
 * useServiceWorkflows Hook
 * Specialized hook for fetching workflows for a specific service
 * Used in ServiceModal's WorkflowsTab
 */
export interface UseServiceWorkflowsOptions {
  org: string;
  repo: string;
  enabled?: boolean;
}

export function useServiceWorkflows(options: UseServiceWorkflowsOptions) {
  return useWorkflowPolling({
    org: options.org,
    repo: options.repo,
    storageKey: STORAGE_KEYS.SERVICE_WORKFLOW_POLL_INTERVAL,
    autoStart: options.enabled ?? true,
    recentHours: 168, // 7 days for service-specific workflows
  });
}

/**
 * useActionsWidget Hook
 * Specialized hook for the Actions Widget sidebar
 * Uses the scorecards repository
 */
export function useActionsWidget() {
  return useWorkflowPolling({
    storageKey: STORAGE_KEYS.WIDGET_POLL_INTERVAL,
    autoStart: false, // Widget controls its own start/stop
    recentHours: 24,
  });
}
