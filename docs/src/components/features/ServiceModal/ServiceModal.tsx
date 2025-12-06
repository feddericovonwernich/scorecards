/**
 * Service Modal Component
 * Displays detailed information about a service with multiple tabs
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '../../ui/Modal.js';
import { Tabs, type Tab } from '../../ui/Tabs.js';
import { ChecksTab } from './tabs/ChecksTab.js';
import { APITab } from './tabs/APITab.js';
import { LinksTab } from './tabs/LinksTab.js';
import { ContributorsTab } from './tabs/ContributorsTab.js';
import { WorkflowsTab } from './tabs/WorkflowsTab.js';
import { BadgesTab } from './tabs/BadgesTab.js';
import type {
  ServiceData,
  CheckResult,
  Contributor,
  WorkflowRun,
} from '../../../types/index.js';
import { useAppStore } from '../../../stores/appStore.js';

// Types for service results data
interface OpenAPIConfig {
  spec_file?: string;
  environments?: Record<string, { base_url: string; description?: string }>;
}

interface ServiceResults {
  service: ServiceData & { openapi?: OpenAPIConfig };
  checks: CheckResult[];
  contributors?: Contributor[];
}

interface OpenAPISummary {
  title: string | null;
  openApiVersion: string | null;
  paths: number | null;
  operations: number | null;
}

interface OpenAPIInfo {
  hasSpec: boolean;
  specInfo: OpenAPIConfig | null;
  fromConfig: boolean;
  summary: OpenAPISummary | null;
}

export interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  org: string | null;
  repo: string | null;
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Parse OpenAPI summary from check stdout
 */
function parseOpenAPISummary(stdout: string): OpenAPISummary | null {
  if (!stdout) {return null;}

  const titleMatch = stdout.match(/Title: (.+)/);
  const versionMatch = stdout.match(/OpenAPI version: ([\d.]+)/);
  const endpointsMatch = stdout.match(/Endpoints: (\d+) paths?, (\d+) operations?/);

  if (!titleMatch && !versionMatch && !endpointsMatch) {
    return null;
  }

  return {
    title: titleMatch ? titleMatch[1].trim() : null,
    openApiVersion: versionMatch ? versionMatch[1] : null,
    paths: endpointsMatch ? parseInt(endpointsMatch[1]) : null,
    operations: endpointsMatch ? parseInt(endpointsMatch[2]) : null,
  };
}

/**
 * Get OpenAPI info from service results
 */
function getOpenAPIInfo(data: ServiceResults): OpenAPIInfo {
  const openApiCheck = data.checks?.find((c) => c.check_id === '06-openapi-spec');
  const summary =
    openApiCheck?.status === 'pass'
      ? parseOpenAPISummary(openApiCheck.stdout || '')
      : null;

  if (data.service.openapi) {
    return {
      hasSpec: true,
      specInfo: data.service.openapi,
      fromConfig: true,
      summary,
    };
  }

  if (openApiCheck && openApiCheck.status === 'pass') {
    const match = openApiCheck.stdout?.match(/found and validated: (.+)/);
    const specFile = match ? match[1].trim() : 'openapi.yaml';

    return {
      hasSpec: true,
      specInfo: { spec_file: specFile },
      fromConfig: false,
      summary,
    };
  }

  return { hasSpec: false, specInfo: null, fromConfig: false, summary: null };
}

/**
 * Service Modal Component
 */
export function ServiceModal({ isOpen, onClose, org, repo }: ServiceModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceData, setServiceData] = useState<ServiceResults | null>(null);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [isStale, setIsStale] = useState(false);

  // Fetch service data when modal opens
  useEffect(() => {
    if (!isOpen || !org || !repo) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use fetchWithHybridAuth like the vanilla JS modal
        const { fetchWithHybridAuth } = await import('../../../api/registry.js');

        const resultsPath = `results/${org}/${repo}/results.json`;
        const registryPath = `registry/${org}/${repo}.json`;

        const [resultsData, registryData] = await Promise.all([
          fetchWithHybridAuth(resultsPath),
          fetchWithHybridAuth(registryPath),
        ]);

        const resultsRes = resultsData.response;
        const registryRes = registryData.response;

        if (!resultsRes.ok) {
          throw new Error(`Failed to fetch results: ${resultsRes.status}`);
        }

        const data = await resultsRes.json();

        // Merge installation_pr and default_branch from registry if available
        if (registryRes.ok) {
          const registry = await registryRes.json();
          if (registry.installation_pr) {
            data.installation_pr = registry.installation_pr;
          }
          if (registry.default_branch) {
            data.default_branch = registry.default_branch;
          }
        }

        // Transform to ServiceResults format expected by our component
        // The API returns top-level fields like rank, score, installed, etc.
        // alongside the nested service object
        const results: ServiceResults = {
          service: {
            ...data.service,
            rank: data.rank,
            score: data.score,
            installed: data.installed,
            default_branch: data.default_branch,
            checks_hash: data.checks_hash,
            openapi: data.service?.openapi,
          },
          checks: data.checks || [],
          contributors: data.recent_contributors || [],
        };

        setServiceData(results);

        // Check staleness using Zustand store
        const checksHash = useAppStore.getState().ui.checksHash;
        const isServiceStale =
          checksHash !== null && data.checks_hash !== checksHash;
        setIsStale(isServiceStale);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load service');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, org, repo]);

  // Handle triggering workflow
  const handleTriggerWorkflow = useCallback(async () => {
    if (!org || !repo) {return;}

    try {
      const { triggerScorecardWorkflow } = await import('../../../api/github.js');
      await triggerScorecardWorkflow(org, repo);
      window.showToast?.('Workflow triggered successfully', 'success');
    } catch (err) {
      window.showToast?.(
        err instanceof Error ? err.message : 'Failed to trigger workflow',
        'error'
      );
    }
  }, [org, repo]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!org || !repo) {return;}

    setLoading(true);
    try {
      const { fetchWithHybridAuth } = await import('../../../api/registry.js');

      const resultsPath = `results/${org}/${repo}/results.json`;
      const registryPath = `registry/${org}/${repo}.json`;

      const [resultsData, registryData] = await Promise.all([
        fetchWithHybridAuth(resultsPath),
        fetchWithHybridAuth(registryPath),
      ]);

      const resultsRes = resultsData.response;
      const registryRes = registryData.response;

      if (!resultsRes.ok) {
        throw new Error(`Failed to fetch results: ${resultsRes.status}`);
      }

      const data = await resultsRes.json();

      if (registryRes.ok) {
        const registry = await registryRes.json();
        if (registry.installation_pr) {
          data.installation_pr = registry.installation_pr;
        }
        if (registry.default_branch) {
          data.default_branch = registry.default_branch;
        }
      }

      const results: ServiceResults = {
        service: {
          ...data.service,
          rank: data.rank,
          score: data.score,
          installed: data.installed,
          default_branch: data.default_branch,
          checks_hash: data.checks_hash,
          openapi: data.service?.openapi,
        },
        checks: data.checks || [],
        contributors: data.recent_contributors || [],
      };

      setServiceData(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  }, [org, repo]);

  // Build tabs based on available data
  const tabs = useMemo((): Tab[] => {
    if (!serviceData) {return [];}

    const service = serviceData.service;
    const checks = serviceData.checks || [];
    const contributors = serviceData.contributors || [];
    const links = service.links || [];
    const openapiInfo = getOpenAPIInfo(serviceData);

    const tabList: Tab[] = [
      {
        id: 'checks',
        label: 'Check Results',
        content: <ChecksTab checks={checks} />,
      },
    ];

    // API tab (conditional)
    if (openapiInfo.hasSpec) {
      tabList.push({
        id: 'api',
        label: 'API Specification',
        content: (
          <APITab
            openapiInfo={openapiInfo}
            org={org || ''}
            repo={repo || ''}
            defaultBranch={service.default_branch || 'main'}
          />
        ),
      });
    }

    // Links tab (conditional)
    if (links.length > 0) {
      tabList.push({
        id: 'links',
        label: 'Links',
        content: <LinksTab links={links} />,
      });
    }

    // Contributors tab
    if (contributors.length > 0) {
      tabList.push({
        id: 'contributors',
        label: 'Contributors',
        content: <ContributorsTab contributors={contributors} />,
      });
    }

    // Workflows tab
    tabList.push({
      id: 'workflows',
      label: 'Workflow Runs',
      content: (
        <WorkflowsTab
          org={org || ''}
          repo={repo || ''}
          runs={workflowRuns}
          onRunsUpdate={setWorkflowRuns}
        />
      ),
    });

    // Badges tab
    tabList.push({
      id: 'badges',
      label: 'Badges',
      content: <BadgesTab org={org || ''} repo={repo || ''} />,
    });

    return tabList;
  }, [serviceData, org, repo, workflowRuns]);

  // Render modal content
  const renderContent = () => {
    if (loading) {
      return <div className="loading">Loading service details...</div>;
    }

    if (error) {
      return (
        <div className="error-state">
          <h3>Error loading service</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn-primary">
            Try Again
          </button>
        </div>
      );
    }

    if (!serviceData) {
      return <div className="empty-state">Service not found</div>;
    }

    const service = serviceData.service;
    const checks = serviceData.checks || [];

    // Calculate check stats
    const passedChecks = checks.filter((c) => c.status === 'pass').length;
    const totalChecks = checks.filter((c) => c.status !== 'excluded').length;
    const excludedCount = checks.filter((c) => c.status === 'excluded').length;

    return (
      <div id="service-detail">
        {/* Title row with badge */}
        <div className="service-modal-title-row">
          <h2>{service.name}</h2>
          <div className={`rank-badge modal-header-badge ${service.rank}`}>
            {capitalize(service.rank)}
          </div>
        </div>
        <p className="tab-section-description">
          {org}/{repo}
        </p>

        {/* Action buttons below title */}
        <div className="service-modal-actions">
          <a
            href={`https://github.com/${org}/${repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="github-button"
            title="View on GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            View on GitHub
          </a>
          <button
            onClick={handleRefresh}
            className="github-button"
            title="Refresh data"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
            </svg>
            Refresh Data
          </button>
          {isStale && service.installed && (
            <button
              onClick={handleTriggerWorkflow}
              className="github-button primary"
              title="Re-run scorecard workflow"
            >
              Run Scorecard
            </button>
          )}
        </div>

        {/* Staleness warning */}
        {isStale && (
          <div className="staleness-warning">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575L6.457 1.047ZM8 5a.75.75 0 0 0-.75.75v2.5a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            </svg>
            <span>
              This service was scored with an older version of checks. Re-run the
              scorecard to get updated results.
            </span>
          </div>
        )}

        {/* Stats display */}
        <div className="modal-stats-container">
          <div className="modal-stat-item">
            <div className="modal-stat-value">{service.score}</div>
            <div className="modal-stat-label">Score</div>
          </div>
          <div className="modal-stat-item">
            <div className="modal-stat-value">
              {passedChecks}/{totalChecks}
            </div>
            <div className="modal-stat-label">Checks Passed</div>
          </div>
          {excludedCount > 0 && (
            <div className="modal-stat-item">
              <div className="modal-stat-value modal-stat-excluded">
                {excludedCount}
              </div>
              <div className="modal-stat-label">Excluded</div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} defaultTab="checks" showScrollArrows />
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="service-modal-wrapper"
      contentClassName="service-modal-content"
      testId="service-modal"
    >
      {renderContent()}
    </Modal>
  );
}

export default ServiceModal;
