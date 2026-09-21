/**
 * API Tab Component
 * Displays OpenAPI specification information
 */

import { useState, useCallback } from 'react';
import { copyText } from '../../../../utils/clipboard.js';


interface OpenAPIConfig {
  spec_file?: string;
  environments?: Record<string, { base_url: string; description?: string }>;
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

interface APITabProps {
  openapiInfo: OpenAPIInfo;
  org: string;
  repo: string;
  defaultBranch: string;
}

/**
 * API Tab Component
 */
export function APITab({ openapiInfo, org, repo, defaultBranch }: APITabProps) {
  const [specContent, setSpecContent] = useState<string | null>(null);
  const [specLoading, setSpecLoading] = useState(false);
  const [specError, setSpecError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);


  const { specInfo, fromConfig, summary } = openapiInfo;
  const specFile = specInfo?.spec_file || 'openapi.yaml';
  const branch = defaultBranch || 'main';

  const viewUrl = `https://github.com/${org}/${repo}/blob/${branch}/${specFile}`;
  const rawUrl = `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${specFile}`;

  // Load raw spec content on demand
  const loadSpecContent = useCallback(async () => {
    if (specContent || specLoading) {return;}

    setSpecLoading(true);
    setSpecError(null);

    try {
      const response = await fetch(rawUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const content = await response.text();
      setSpecContent(content);
    } catch (error) {
      setSpecError(error instanceof Error ? error.message : 'Failed to load');
    } finally {
      setSpecLoading(false);
    }
  }, [rawUrl, specContent, specLoading]);

  const handleCopy = useCallback(async (invoker: HTMLButtonElement) => {
    if (!specContent) {return;}

    setCopyError(null);
    setCopied(false);
    if (await copyText(specContent, invoker)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyError('Unable to copy. Please copy manually.');
    }
  }, [specContent]);


  // Open API Explorer
  const handleOpenExplorer = useCallback(() => {
    window.openApiExplorer?.(org, repo);
  }, [org, repo]);

  if (!openapiInfo.hasSpec) {
    return null;
  }

  return (
    <div className="tab-panel" id="api-tab">
      <div className="api-tab-content">
        {/* Summary Card */}
        <div className="api-summary-card">
          {summary?.title && (
            <div className="api-summary-title">{summary.title}</div>
          )}

          <div className="api-summary-meta">
            <span className="api-meta-item">
              <strong>File:</strong> <code>{specFile}</code>
            </span>
            {summary?.openApiVersion && (
              <span className="api-meta-item">
                <strong>OpenAPI:</strong> {summary.openApiVersion}
              </span>
            )}
            {summary?.paths && (
              <span className="api-meta-item">
                <strong>Endpoints:</strong> {summary.paths} path
                {summary.paths !== 1 ? 's' : ''}, {summary.operations} operation
                {summary.operations !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="api-actions">
            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="github-link-button"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>

        {/* Collapsible Raw Spec */}
        <details className="spec-details" onToggle={loadSpecContent}>
          <summary className="spec-summary">View Raw Specification</summary>
          <div className="spec-content">
            {specLoading && (
              <div className="spec-loading">Loading specification...</div>
            )}
            {specError && (
              <div className="spec-error">
                <p>Failed to load spec: {specError}</p>
                <a
                  href={rawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="spec-error-link"
                >
                  View raw file on GitHub
                </a>
              </div>
            )}
            {specContent && (
              <>
                <div className="spec-toolbar">
                  <button
                    onClick={(event) => handleCopy(event.currentTarget)}

                    className={`copy-spec-button ${copied ? 'copied' : ''}`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  {copyError && <p role="alert">{copyError}</p>}
                </div>
                <pre className="spec-code">
                  <code>{specContent}</code>
                </pre>
              </>
            )}
          </div>
        </details>

        {/* Environments */}
        {specInfo?.environments && (
          <>
            <h4 className="api-section-header">Environments</h4>
            <div className="environments-grid">
              {Object.entries(specInfo.environments).map(([envName, envConfig]) => (
                <div key={envName} className="environment-card">
                  <div className="environment-card-name">{envName}</div>
                  <div className="environment-card-url">{envConfig.base_url}</div>
                  {envConfig.description && (
                    <div className="environment-card-description">
                      {envConfig.description}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="api-explorer-section">
              <button onClick={handleOpenExplorer} className="api-explorer-button">
                Open API Explorer
              </button>
              <p className="environment-card-description">
                Explore and test the API with an interactive Swagger UI interface
              </p>
            </div>
          </>
        )}

        {/* Hint when no environments */}
        {!fromConfig && (
          <p className="environment-card-description api-hint">
            Configure environments in <code>.scorecard/config.yml</code> to enable
            the interactive API Explorer.
          </p>
        )}
      </div>
    </div>
  );
}

export default APITab;
