import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig({
  // Root is the docs directory
  root: '.',

  // Base path for GitHub Pages (repo is served at /scorecards/)
  base: '/scorecards/',

  // Build output goes to dist/
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Generate source maps for debugging
    sourcemap: true,
    // Multi-page app configuration
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'api-explorer': resolve(__dirname, 'api-explorer.html'),
      },
      // Preserve side effects from main.ts (window global assignments)
      treeshake: {
        moduleSideEffects: (id) => {
          // Mark main.ts as having side effects (window global assignments)
          if (id.endsWith('main.ts') || id.endsWith('main.tsx')) {
            return true;
          }
          // Default behavior for other modules
          return 'no-external';
        },
      },
    },
  },

  // Resolve path aliases matching tsconfig.json
  resolve: {
    alias: {
      '@config': resolve(__dirname, 'src/config'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@api': resolve(__dirname, 'src/api'),
      '@services': resolve(__dirname, 'src/services'),
      '@types': resolve(__dirname, 'src/types/index'),
    },
    // Allow importing .ts/.tsx files without extension and resolve .js to .ts/.tsx
    extensions: ['.tsx', '.ts', '.js', '.mjs', '.json'],
  },

  // Plugins
  plugins: [
    // React plugin for JSX transformation and Fast Refresh
    react(),
    // Istanbul plugin for code coverage during E2E tests
    // Only instrument when COVERAGE env var is set (to avoid overhead in normal builds)
    ...(process.env.COVERAGE === 'true' ? [istanbul({
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['node_modules/**', 'dist/**', 'tests/**', '**/*.d.ts'],
      extension: ['.ts', '.tsx'],
      requireEnv: false,
      forceBuildInstrument: true,
      cwd: __dirname, // Ensure paths are relative to docs directory
    })] : []),
    // Plugin to rewrite .js imports to .ts/.tsx during development
    {
      name: 'resolve-js-to-ts',
      enforce: 'pre',
      async resolveId(source, importer) {
        // Only process relative imports ending in .js
        if (source.endsWith('.js') && (source.startsWith('./') || source.startsWith('../'))) {
          // Skip Vite's internal dependency chunks and node_modules
          if (importer && (importer.includes('node_modules/.vite') || importer.includes('node_modules'))) {
            return null;
          }

          // Try .tsx first, then .ts
          const tsxPath = source.replace(/\.js$/, '.tsx');
          const tsxResolved = await this.resolve(tsxPath, importer, { skipSelf: true });
          if (tsxResolved) {
            return tsxResolved;
          }

          const tsPath = source.replace(/\.js$/, '.ts');
          return this.resolve(tsPath, importer, { skipSelf: true });
        }
        return null;
      },
    },
  ],

  // Development server configuration
  server: {
    port: 3000,
    open: true,
  },

  // Preview server (for testing production build)
  preview: {
    port: 4173,
  },
});
