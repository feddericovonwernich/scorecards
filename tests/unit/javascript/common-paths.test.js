import { describe, it, expect, beforeAll } from '@jest/globals';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('common-paths', () => {
  let commonPaths;

  beforeAll(async () => {
    // Read and evaluate the CommonJS module
    const commonPathsPath = join(__dirname, '../../../checks/lib/common-paths.js');
    const content = await readFile(commonPathsPath, 'utf-8');

    // Extract the object literal by removing module.exports and evaluating
    const objectMatch = content.match(/const commonPaths = ({[\s\S]*?});/);
    if (objectMatch) {
      commonPaths = eval(`(${objectMatch[1]})`);
    }
  });

  describe('openapi paths', () => {
    it('should have OpenAPI paths defined', () => {
      expect(commonPaths.openapi).toBeDefined();
      expect(Array.isArray(commonPaths.openapi)).toBe(true);
    });

    it('should include standard OpenAPI locations', () => {
      expect(commonPaths.openapi).toContain('openapi.yaml');
      expect(commonPaths.openapi).toContain('openapi.yml');
      expect(commonPaths.openapi).toContain('swagger.yaml');
    });

    it('should include subdirectory locations', () => {
      expect(commonPaths.openapi).toContain('api/openapi.yaml');
      expect(commonPaths.openapi).toContain('docs/swagger.yml');
      expect(commonPaths.openapi).toContain('.openapi/openapi.json');
    });

    it('should have at least 20 paths', () => {
      expect(commonPaths.openapi.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('CI paths', () => {
    it('should have CI paths defined', () => {
      expect(commonPaths.ci).toBeDefined();
      expect(Array.isArray(commonPaths.ci)).toBe(true);
    });

    it('should include common CI systems', () => {
      expect(commonPaths.ci).toContain('.travis.yml');
      expect(commonPaths.ci).toContain('.gitlab-ci.yml');
      expect(commonPaths.ci).toContain('.circleci/config.yml');
    });
  });

  describe('README paths', () => {
    it('should have README paths defined', () => {
      expect(commonPaths.readme).toBeDefined();
      expect(Array.isArray(commonPaths.readme)).toBe(true);
    });

    it('should include common README variations', () => {
      expect(commonPaths.readme).toContain('README.md');
      expect(commonPaths.readme).toContain('readme.md');
      expect(commonPaths.readme).toContain('README');
    });
  });
});
