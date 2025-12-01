import { describe, test, expect, beforeEach } from '@jest/globals';
import {
    getState,
    getStateSlice,
    setState,
    subscribe,
    setServices,
    setFilteredServices,
    setServicesLoading,
    setTeams,
    setFilteredTeams,
    setAuth,
    setCurrentView,
    setChecksHash,
    updateServiceModal,
    resetState
} from '../../../docs/src/services/state.js';

describe('State Management', () => {
    beforeEach(() => {
        // Reset state between tests
        resetState();
    });

    describe('getState', () => {
        test('returns current state', () => {
            const state = getState();
            expect(state.services.all).toEqual([]);
            expect(state.filters.sort).toBe('score-desc');
            expect(state.auth.pat).toBeNull();
            expect(state.ui.currentView).toBe('services');
        });

        test('returns shallow copy of state', () => {
            const state1 = getState();
            const state2 = getState();
            expect(state1).not.toBe(state2);
            expect(state1).toEqual(state2);
        });
    });

    describe('getStateSlice', () => {
        test('returns specific state slice', () => {
            const services = getStateSlice('services');
            expect(services.all).toEqual([]);
            expect(services.filtered).toEqual([]);
            expect(services.loading).toBe(false);
        });

        test('returns auth slice', () => {
            const auth = getStateSlice('auth');
            expect(auth.pat).toBeNull();
            expect(auth.validated).toBe(false);
        });
    });

    describe('setState', () => {
        test('updates state', () => {
            setState({
                auth: { pat: 'test-token', validated: true }
            });

            const state = getState();
            expect(state.auth.pat).toBe('test-token');
            expect(state.auth.validated).toBe(true);
        });

        test('only updates specified keys', () => {
            const originalFilters = getState().filters;

            setState({
                auth: { pat: 'test-token', validated: true }
            });

            const state = getState();
            expect(state.filters).toBe(originalFilters);
        });
    });

    describe('subscribe', () => {
        test('receives updates when state changes', () => {
            const calls = [];
            subscribe('services', (value) => {
                calls.push(value);
            });

            setServices([{ org: 'test', repo: 'repo' }]);

            expect(calls.length).toBe(1);
            expect(calls[0].all[0].org).toBe('test');
        });

        test('returns unsubscribe function', () => {
            const calls = [];
            const unsubscribe = subscribe('services', (value) => {
                calls.push(value);
            });

            unsubscribe();
            setServices([{ org: 'test', repo: 'repo' }]);

            expect(calls.length).toBe(0);
        });

        test('multiple listeners receive updates', () => {
            const calls1 = [];
            const calls2 = [];

            subscribe('auth', (value) => calls1.push(value));
            subscribe('auth', (value) => calls2.push(value));

            setAuth('token', true);

            expect(calls1.length).toBe(1);
            expect(calls2.length).toBe(1);
        });

        test('listener errors are caught and logged', () => {
            // Subscribe a listener that throws
            subscribe('services', () => {
                throw new Error('Test error');
            });

            // This should not throw
            expect(() => setServices([{ org: 'test', repo: 'repo' }])).not.toThrow();
        });
    });

    describe('setServices', () => {
        test('sets all services', () => {
            const services = [
                { org: 'org1', repo: 'repo1' },
                { org: 'org2', repo: 'repo2' }
            ];

            setServices(services);

            const state = getState();
            expect(state.services.all).toEqual(services);
        });

        test('preserves other services state', () => {
            setFilteredServices([{ org: 'filtered', repo: 'repo' }]);
            setServices([{ org: 'all', repo: 'repo' }]);

            const state = getState();
            expect(state.services.all).toHaveLength(1);
            expect(state.services.filtered).toHaveLength(1);
        });
    });

    describe('setFilteredServices', () => {
        test('sets filtered services', () => {
            const services = [{ org: 'org1', repo: 'repo1' }];

            setFilteredServices(services);

            const state = getState();
            expect(state.services.filtered).toEqual(services);
        });
    });

    describe('setServicesLoading', () => {
        test('sets loading state', () => {
            setServicesLoading(true);
            expect(getState().services.loading).toBe(true);

            setServicesLoading(false);
            expect(getState().services.loading).toBe(false);
        });
    });

    describe('setTeams', () => {
        test('sets all teams', () => {
            const teams = [
                { name: 'team1', services: [] },
                { name: 'team2', services: [] }
            ];

            setTeams(teams);

            const state = getState();
            expect(state.teams.all).toEqual(teams);
        });
    });

    describe('setFilteredTeams', () => {
        test('sets filtered teams', () => {
            const teams = [{ name: 'team1', services: [] }];

            setFilteredTeams(teams);

            const state = getState();
            expect(state.teams.filtered).toEqual(teams);
        });
    });

    describe('setAuth', () => {
        test('sets PAT and validated status', () => {
            setAuth('test-token', true);

            const state = getState();
            expect(state.auth.pat).toBe('test-token');
            expect(state.auth.validated).toBe(true);
        });

        test('defaults validated to false', () => {
            setAuth('test-token');

            const state = getState();
            expect(state.auth.pat).toBe('test-token');
            expect(state.auth.validated).toBe(false);
        });

        test('clears auth when null', () => {
            setAuth('test-token', true);
            setAuth(null);

            const state = getState();
            expect(state.auth.pat).toBeNull();
            expect(state.auth.validated).toBe(false);
        });
    });

    describe('setCurrentView', () => {
        test('sets current view', () => {
            setCurrentView('teams');

            const state = getState();
            expect(state.ui.currentView).toBe('teams');
        });
    });

    describe('setChecksHash', () => {
        test('sets checks hash and timestamp', () => {
            const before = Date.now();
            setChecksHash('abc123');
            const after = Date.now();

            const state = getState();
            expect(state.ui.checksHash).toBe('abc123');
            expect(state.ui.checksHashTimestamp).toBeGreaterThanOrEqual(before);
            expect(state.ui.checksHashTimestamp).toBeLessThanOrEqual(after);
        });
    });

    describe('updateServiceModal', () => {
        test('updates service modal state', () => {
            updateServiceModal({
                org: 'test-org',
                repo: 'test-repo',
                loaded: true
            });

            const state = getState();
            expect(state.serviceModal.org).toBe('test-org');
            expect(state.serviceModal.repo).toBe('test-repo');
            expect(state.serviceModal.loaded).toBe(true);
            // Other properties should be preserved
            expect(state.serviceModal.filterStatus).toBe('all');
        });

        test('updates workflow runs', () => {
            const runs = [{ id: 1, status: 'completed' }];
            updateServiceModal({ workflowRuns: runs });

            const state = getState();
            expect(state.serviceModal.workflowRuns).toEqual(runs);
        });
    });

    describe('resetState', () => {
        test('resets all state to initial values', () => {
            // Modify state
            setServices([{ org: 'test', repo: 'repo' }]);
            setAuth('token', true);
            setCurrentView('teams');

            // Reset
            resetState();

            // Verify reset
            const state = getState();
            expect(state.services.all).toEqual([]);
            expect(state.auth.pat).toBeNull();
            expect(state.ui.currentView).toBe('services');
        });

        test('clears all listeners', () => {
            const calls = [];
            subscribe('services', (value) => calls.push(value));

            resetState();
            setServices([{ org: 'test', repo: 'repo' }]);

            expect(calls.length).toBe(0);
        });
    });
});
