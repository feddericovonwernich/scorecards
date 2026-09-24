import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { loadServices } from './registry';
import { setToken } from '../services/auth';
import type { ServiceData } from '../types/index';

const service = (repo: string): ServiceData => ({
  org: 'acme',
  repo,
  name: repo,
  score: 90,
  rank: 'gold',
  team: null,
  check_results: {},
  excluded_checks: [],
  checks_count: 0,
  checks_hash: 'hash',
  last_updated: '2026-09-24T00:00:00Z',
  default_branch: 'main',
});

const response = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

describe('loadServices', () => {
  beforeEach(() => {
    localStorage.clear();
    setToken(null);
    jest.clearAllMocks();
  });

  it('uses a populated consolidated registry without querying the tree', async () => {
    const consolidated = service('consolidated');
    const fetchMock = jest.fn<typeof fetch>();
    globalThis.fetch = fetchMock;
    fetchMock.mockResolvedValue(response({ services: [consolidated], generated_at: 'now' }));

    await expect(loadServices()).resolves.toEqual({ services: [consolidated], usedAPI: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns [] for the installer catalog placeholders', async () => {
    const fetchMock = jest.fn<typeof fetch>();
    globalThis.fetch = fetchMock;
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('all-services.json')) {
        return response({ services: [], generated_at: 'now' });
      }
      if (url.includes('/git/trees/')) {
        return response({
          tree: [
            { path: 'registry/all-services.json', type: 'blob', sha: '1' },
            { path: 'registry/services.json', type: 'blob', sha: '2' },
          ],
        });
      }
      if (url.includes('registry/services.json')) {
        return response([]);
      }
      return response({}, 404);
    });

    await expect(loadServices()).resolves.toEqual({ services: [], usedAPI: false });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('loads an entry beside the installer catalog placeholder', async () => {
    const individual = service('individual');
    const fetchMock = jest.fn<typeof fetch>();
    globalThis.fetch = fetchMock;
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('all-services.json')) {
        return response({ services: [], generated_at: 'now' });
      }
      if (url.includes('/git/trees/')) {
        return response({
          tree: [
            { path: 'registry/all-services.json', type: 'blob', sha: '1' },
            { path: 'registry/services.json', type: 'blob', sha: '2' },
            { path: 'registry/acme/individual.json', type: 'blob', sha: '3' },
          ],
        });
      }
      if (url.includes('registry/services.json')) {
        return response([]);
      }
      return response(individual);
    });

    await expect(loadServices()).resolves.toEqual({ services: [individual], usedAPI: false });
  });

  it('authorizes empty tree discovery with a configured PAT', async () => {
    setToken('private-token');
    const fetchMock = jest.fn<typeof fetch>();
    globalThis.fetch = fetchMock;
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('all-services.json')) {
        return response({ services: [], generated_at: 'now' });
      }
      if (url.includes('/git/trees/')) {
        const authorization = new Headers(init?.headers).get('Authorization');
        return authorization === 'token private-token'
          ? response({ tree: [] })
          : response({}, 404);
      }
      return response({}, 404);
    });

    await expect(loadServices()).resolves.toEqual({ services: [], usedAPI: true });
  });

  it('keeps valid individual entries when another individual entry returns 404', async () => {
    const valid = service('valid');
    const fetchMock = jest.fn<typeof fetch>();
    globalThis.fetch = fetchMock;
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('all-services.json')) {
        return response({ services: [], generated_at: 'now' });
      }
      if (url.includes('/git/trees/')) {
        return response({
          tree: [
            { path: 'registry/all-services.json', type: 'blob', sha: '1' },
            { path: 'registry/services.json', type: 'blob', sha: '2' },
            { path: 'registry/acme/valid.json', type: 'blob', sha: '3' },
            { path: 'registry/acme/missing.json', type: 'blob', sha: '4' },
          ],
        });
      }
      if (url.includes('registry/services.json')) {
        return response([]);
      }
      return url.includes('valid.json') ? response(valid) : response({}, 404);
    });

    await expect(loadServices()).resolves.toEqual({ services: [valid], usedAPI: false });
  });
});
