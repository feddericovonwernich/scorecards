import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Root is the docs directory
  root: '.',

  // Build output goes to dist/
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Generate source maps for debugging
    sourcemap: true,
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
    // Allow importing .ts files without extension and resolve .js to .ts
    extensions: ['.ts', '.js', '.mjs', '.json'],
  },

  // Esbuild options for TypeScript
  esbuild: {
    // Allow .js files to contain TypeScript/JSX
    loader: 'ts',
  },

  // Plugin to rewrite .js imports to .ts during development
  plugins: [
    {
      name: 'resolve-js-to-ts',
      enforce: 'pre',
      resolveId(source, importer) {
        // Only process relative imports ending in .js
        if (source.endsWith('.js') && (source.startsWith('./') || source.startsWith('../'))) {
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
