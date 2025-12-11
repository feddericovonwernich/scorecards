import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from './hooks/useSearchParams';
import { useSwaggerUI } from './hooks/useSwaggerUI';
import { useTheme } from '../../hooks/useTheme';
import styles from './ApiExplorer.module.css';

interface ServiceData {
  service: {
    name?: string;
    openapi?: {
      spec_file?: string;
      branch?: string;
    };
  };
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5.657-8.157a.75.75 0 0 1 0 1.061l-1.061 1.06a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.06-1.06a.75.75 0 0 1 1.06 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0ZM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8Zm13 0a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8Zm-8 5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13Zm3.536-1.464a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061ZM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-1.06-1.06a.75.75 0 0 1 0-1.06Z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z" />
    </svg>
  );
}

export function ApiExplorer() {
  const { org, repo, catalogOwner } = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);

  const swaggerContainerRef = useSwaggerUI({ serviceData, org, repo });

  const loadServiceData = useCallback(async () => {
    const repoOwner = catalogOwner || window.location.hostname.split('.')[0] || 'your-org';
    const rawBaseUrl = `https://raw.githubusercontent.com/${repoOwner}/scorecards/catalog`;

    try {
      const resultsUrl = `${rawBaseUrl}/results/${org}/${repo}/results.json?t=${Date.now()}`;
      const response = await fetch(resultsUrl, { cache: 'no-cache' });

      if (!response.ok) {
        throw new Error(`Service not found or results not available (${response.status})`);
      }

      const data = await response.json();
      setServiceData(data);

      if (!data.service.openapi) {
        throw new Error('This service does not have OpenAPI configuration');
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }, [catalogOwner, org, repo]);

  useEffect(() => {
    if (!org || !repo) {
      setError('Missing parameters. Please specify org and repo in the URL.');
      setLoading(false);
      return;
    }

    loadServiceData();
  }, [org, repo, loadServiceData]);

  const title = serviceData?.service.name || `${org}/${repo}`;
  const subtitle = `${org}/${repo} - OpenAPI Specification`;

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <h1>{loading ? 'API Explorer' : title}</h1>
            <p>{loading ? 'Loading API specification...' : subtitle}</p>
          </div>
          <div className={styles.headerControls}>
            <button
              className={styles.themeToggleBtn}
              onClick={toggleTheme}
              title="Toggle night mode"
              aria-label="Toggle night mode"
            >
              {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
            </button>
            <a href="./" className={styles.backBtn}>
              ← Back to Catalog
            </a>
          </div>
        </div>
      </div>

      {loading && (
        <div className={styles.loading}>
          <div>Loading API specification...</div>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <h2>Failed to Load API</h2>
          <p>{error}</p>
        </div>
      )}

      <div id="swagger-ui" ref={swaggerContainerRef} />
    </>
  );
}
