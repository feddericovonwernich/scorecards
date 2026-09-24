import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { loadServices } from './registry';
import { getToken, setToken } from '../services/auth';
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

    await expect(loadServices()).resolves.toEqual({ services: [], usedAPI: false });
  });

  it('does not mark CDN data fresh after discarding an authenticated empty registry', async () => {
    const individual = service('individual');
    setToken('private-token');
    const fetchMock = jest.fn<typeof fetch>();
    globalThis.fetch = fetchMock;
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      const authorization = new Headers(init?.headers).get('Authorization');

      if (url.includes('/contents/registry/all-services.json')) {
        return response({ services: [], generated_at: 'now' });
      }
      if (url.includes('/git/trees/')) {
        return authorization === 'token private-token'
          ? response({}, 403)
          : response({
              tree: [{ path: 'registry/acme/individual.json', type: 'blob', sha: '1' }],
            });
      }
      if (url.includes('/contents/registry/acme/individual.json')) {
        return response({}, 403);
      }
      return response(individual);
    });

    await expect(loadServices()).resolves.toEqual({ services: [individual], usedAPI: false });
  });

  it('does not mark mixed authenticated and CDN entries fresh', async () => {
    const authenticated = service('authenticated');
    const cached = service('cached');
    setToken('private-token');
    const fetchMock = jest.fn<typeof fetch>();
    globalThis.fetch = fetchMock;
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/contents/registry/all-services.json')) {
        return response({}, 404);
      }
      if (url.includes('raw.githubusercontent.com') && url.includes('all-services.json')) {
        return response({ services: [], generated_at: 'now' });
      }
      if (url.includes('/git/trees/')) {
        return response({
          tree: [
            { path: 'registry/acme/authenticated.json', type: 'blob', sha: '1' },
            { path: 'registry/acme/cached.json', type: 'blob', sha: '2' },
          ],
        });
      }
      if (url.includes('/contents/registry/acme/authenticated.json')) {
        return response(authenticated);
      }
      if (url.includes('/contents/registry/acme/cached.json')) {
        return response({}, 403);
      }
      return response(cached);
    });

    await expect(loadServices()).resolves.toEqual({
      services: [authenticated, cached],
      usedAPI: false,
    });
  });

  it.each([403, 429])('uses public registry files after PAT failure %s', async (status) => {
    const individual = service('individual');
    setToken('exhausted-token');
    const fetchMock = jest.fn<typeof fetch>();
    globalThis.fetch = fetchMock;
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      const authorization = new Headers(init?.headers).get('Authorization');

      if (url.includes('/contents/registry/all-services.json')) {
        return response({}, status);
      }
      if (url.includes('raw.githubusercontent.com') && url.includes('all-services.json')) {
        return response({ services: [], generated_at: 'now' });
      }
      if (url.includes('/git/trees/')) {
        return authorization ? response({}, status) : response({
          tree: [{ path: 'registry/acme/individual.json', type: 'blob', sha: '1' }],
        });
      }
      if (url.includes('/contents/registry/acme/individual.json')) {
        return response({}, status);
      }
      return response(individual);
    });

    await expect(loadServices()).resolves.toEqual({ services: [individual], usedAPI: false });
  });

  it('clears an unauthorized PAT before anonymously discovering a public tree', async () => {
    setToken('expired-token');
    const fetchMock = jest.fn<typeof fetch>();
    globalThis.fetch = fetchMock;
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      const authorization = new Headers(init?.headers).get('Authorization');

      if (url.includes('/contents/registry/all-services.json')) {
        return response({}, 404);
      }
      if (url.includes('raw.githubusercontent.com') && url.includes('all-services.json')) {
        return response({ services: [], generated_at: 'now' });
      }
      if (url.includes('/git/trees/')) {
        return authorization ? response({}, 401) : response({ tree: [] });
      }
      return response({}, 404);
    });

    await expect(loadServices()).resolves.toEqual({ services: [], usedAPI: false });
    expect(getToken()).toBeNull();
  });

  it('preserves non-authentication tree failures', async () => {
    setToken('private-token');
    const fetchMock = jest.fn<typeof fetch>();
    globalThis.fetch = fetchMock;
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('all-services.json')) {
        return response({ services: [], generated_at: 'now' });
      }
      if (url.includes('/git/trees/')) {
        return new Headers(init?.headers).has('Authorization')
          ? response({}, 500)
          : response({ tree: [] });
      }
      return response({}, 404);
    });

    await expect(loadServices()).rejects.toThrow('Failed to fetch repository tree: 500');
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
