# Phase 1: API Explorer Page Migration

## Objective

Migrate the standalone `api-explorer.html` page from 100% vanilla JavaScript to React. This is a self-contained page with no dependencies on the main application, making it an ideal first migration target.

## Current State Analysis

### File: `docs/api-explorer.html`

The page currently contains:
1. **Inline theme flash prevention script** (lines 8-17) - Keep as-is
2. **~400 lines of inline CSS** (lines 20-431) - Move to CSS module or styled components
3. **~200 lines of inline JavaScript** (lines 467-673) containing:
   - URL parameter parsing
   - SwaggerUI initialization
   - Theme toggle functionality
   - Error handling
   - DOM manipulation with `document.getElementById()`

### Vanilla JS Patterns to Replace

```javascript
// Current patterns in api-explorer.html:
document.getElementById('api-title')
document.getElementById('api-subtitle')
document.getElementById('loading')
document.getElementById('error')
document.getElementById('error-message')
document.getElementById('swagger-ui')
document.getElementById('theme-toggle-btn')
document.getElementById('theme-icon-sun')
document.getElementById('theme-icon-moon')
document.documentElement.setAttribute('data-theme', theme)
document.documentElement.getAttribute('data-theme')
localStorage.getItem() / localStorage.setItem()
document.addEventListener('DOMContentLoaded', init)
toggleBtn.addEventListener('click', toggleTheme)
```

## Migration Steps

### Step 1: Create React Component Structure

Create new files:

```
docs/src/pages/
└── ApiExplorer/
    ├── index.tsx           # Main component
    ├── ApiExplorer.tsx     # Page component
    ├── ApiExplorer.module.css  # Styles
    └── hooks/
        └── useSwaggerUI.ts # SwaggerUI initialization hook
```

### Step 2: Create the ApiExplorer Component

```typescript
// docs/src/pages/ApiExplorer/ApiExplorer.tsx

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

export function ApiExplorer() {
  const { org, repo, catalogOwner } = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);

  const swaggerContainerRef = useSwaggerUI(serviceData);

  useEffect(() => {
    if (!org || !repo) {
      setError('Missing parameters. Please specify org and repo in the URL.');
      setLoading(false);
      return;
    }

    loadServiceData();
  }, [org, repo]);

  const loadServiceData = async () => {
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
  };

  const title = serviceData?.service.name || `${org}/${repo}`;
  const subtitle = `${org}/${repo} - OpenAPI Specification`;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <h1>{loading ? 'API Explorer' : title}</h1>
            <p>{loading ? 'Loading API specification...' : subtitle}</p>
          </div>
          <div className={styles.headerControls}>
            <button
              className={styles.themeToggle}
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
      </header>

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
    </div>
  );
}
```

### Step 3: Create SwaggerUI Hook

```typescript
// docs/src/pages/ApiExplorer/hooks/useSwaggerUI.ts

import { useEffect, useRef } from 'react';

interface ServiceData {
  service: {
    openapi?: {
      spec_file?: string;
      branch?: string;
    };
  };
}

export function useSwaggerUI(serviceData: ServiceData | null) {
  const containerRef = useRef<HTMLDivElement>(null);
  const swaggerUiRef = useRef<unknown>(null);

  useEffect(() => {
    if (!serviceData?.service.openapi || !containerRef.current) {
      return;
    }

    const initSwagger = async () => {
      const specPath = serviceData.service.openapi!.spec_file || 'openapi.yaml';
      const configuredBranch = serviceData.service.openapi!.branch;

      // Dynamic import of SwaggerUI
      const SwaggerUIBundle = (await import('swagger-ui-dist/swagger-ui-bundle')).default;
      const SwaggerUIStandalonePreset = (await import('swagger-ui-dist/swagger-ui-standalone-preset')).default;

      // Find spec URL by trying branches
      const branches = configuredBranch ? [configuredBranch] : ['main', 'master'];
      let specUrl: string | null = null;

      for (const branch of branches) {
        const url = `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${specPath}`;
        try {
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok) {
            specUrl = url;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!specUrl) {
        throw new Error(`OpenAPI spec not found at ${specPath}`);
      }

      swaggerUiRef.current = SwaggerUIBundle({
        url: specUrl,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        plugins: [SwaggerUIBundle.plugins.DownloadUrl],
        layout: 'StandaloneLayout',
      });
    };

    initSwagger().catch(console.error);

    return () => {
      // Cleanup if needed
    };
  }, [serviceData]);

  return containerRef;
}
```

### Step 4: Create Search Params Hook

```typescript
// docs/src/pages/ApiExplorer/hooks/useSearchParams.ts

import { useMemo } from 'react';

export function useSearchParams() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      org: params.get('org'),
      repo: params.get('repo'),
      catalogOwner: params.get('catalog_owner'),
    };
  }, []);
}
```

### Step 5: Update HTML Entry Point

Replace `api-explorer.html` with minimal HTML that loads React:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Explorer - Scorecards</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <script>
        // Keep theme flash prevention - this MUST stay as inline script
        (function() {
            const THEME_KEY = 'theme';
            const savedTheme = localStorage.getItem(THEME_KEY);
            const osPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = savedTheme || (osPrefersDark ? 'dark' : 'light');
            document.documentElement.setAttribute('data-theme', theme);
        })();
    </script>
    <link rel="stylesheet" type="text/css" href="css/base/variables.css">
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
</head>
<body>
    <div id="api-explorer-root"></div>
    <script type="module" src="src/pages/ApiExplorer/index.tsx"></script>
</body>
</html>
```

### Step 6: Create Entry Point

```typescript
// docs/src/pages/ApiExplorer/index.tsx

import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { ApiExplorer } from './ApiExplorer';
import './ApiExplorer.module.css';

const container = document.getElementById('api-explorer-root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <ApiExplorer />
    </StrictMode>
  );
}
```

### Step 7: Move Styles to CSS Module

Move all the inline CSS from `api-explorer.html` to `ApiExplorer.module.css`, converting class names to camelCase as needed.

## Verification Checklist

- [ ] Page loads without errors
- [ ] Theme toggle works (light/dark)
- [ ] Theme persists across page refresh
- [ ] SwaggerUI initializes correctly
- [ ] Error states display properly (missing org/repo, service not found, no OpenAPI config)
- [ ] Back to Catalog link works
- [ ] Dark mode styling applies to SwaggerUI
- [ ] No `document.getElementById()` calls in React code
- [ ] No inline JavaScript in HTML (except theme flash prevention)

## Files Modified

| File | Action |
|------|--------|
| `docs/api-explorer.html` | Replace with minimal HTML |
| `docs/src/pages/ApiExplorer/index.tsx` | Create (new) |
| `docs/src/pages/ApiExplorer/ApiExplorer.tsx` | Create (new) |
| `docs/src/pages/ApiExplorer/ApiExplorer.module.css` | Create (new) |
| `docs/src/pages/ApiExplorer/hooks/useSwaggerUI.ts` | Create (new) |
| `docs/src/pages/ApiExplorer/hooks/useSearchParams.ts` | Create (new) |

## Rollback Instructions

If issues arise:
1. Restore original `api-explorer.html` from git: `git checkout HEAD -- docs/api-explorer.html`
2. Delete the new React files: `rm -rf docs/src/pages/ApiExplorer`

## Notes for Executing Model

- This phase has NO dependencies on other phases
- The theme flash prevention script in HTML head MUST remain as inline JS - this is intentional to prevent FOUC (Flash of Unstyled Content)
- SwaggerUI is a third-party library loaded via CDN; consider whether to bundle it or keep CDN
- Test on both light and dark themes
- Test with valid and invalid URL parameters
