import { useEffect, useRef } from 'react';

interface ServiceData {
  service: {
    openapi?: {
      spec_file?: string;
      branch?: string;
    };
  };
}

interface UseSwaggerUIParams {
  serviceData: ServiceData | null;
  org: string | null;
  repo: string | null;
}

export function useSwaggerUI({ serviceData, org, repo }: UseSwaggerUIParams) {
  const containerRef = useRef<HTMLDivElement>(null);
  const swaggerUiRef = useRef<unknown>(null);

  useEffect(() => {
    if (!serviceData?.service.openapi || !containerRef.current || !org || !repo) {
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

      // Fetch and parse the spec
      const specResponse = await fetch(specUrl);
      if (!specResponse.ok) {
        throw new Error(`OpenAPI specification file not found at ${specUrl}`);
      }

      const specContent = await specResponse.text();

      // Parse spec to get the format (JSON or YAML)
      let spec;
      try {
        spec = JSON.parse(specContent);
      } catch {
        // If not JSON, assume YAML - Swagger UI can handle it
        spec = specContent;
      }

      swaggerUiRef.current = SwaggerUIBundle({
        spec: typeof spec === 'string' ? undefined : spec,
        url: typeof spec === 'string' ? specUrl : undefined,
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
  }, [serviceData, org, repo]);

  return containerRef;
}
