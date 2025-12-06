/**
 * React Testing Setup
 * Configures jest-dom matchers and global test utilities
 */

import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock Zustand store
// This creates a mock that returns null for PAT by default
// Individual tests can override this using jest.mock or jest.spyOn
jest.mock('../../docs/src/stores/appStore', () => ({
  useAppStore: Object.assign(
    // Default selector behavior
    (selector: (state: unknown) => unknown) => {
      const mockState = {
        auth: { pat: null, validated: false },
        ui: { checksHash: null, checksHashTimestamp: 0 },
        services: { all: [], filtered: [], loading: false },
      };
      return selector(mockState);
    },
    // getState method for non-hook access
    { getState: () => ({ auth: { pat: null }, ui: { checksHash: null } }) }
  ),
  selectPAT: (state: { auth: { pat: string | null } }) => state.auth.pat,
  selectChecksHash: (state: { ui: { checksHash: string | null } }) => state.ui.checksHash,
}));

// Mock window properties used by components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.githubPAT
Object.defineProperty(window, 'githubPAT', {
  writable: true,
  value: null,
});

// Note: Not mocking document.documentElement.getAttribute
// Tests should use setAttribute('data-theme', 'light') in beforeEach to set initial theme

// Mock window global functions that components may call
Object.defineProperty(window, 'openSettings', {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, 'toggleActionsWidget', {
  writable: true,
  value: () => {},
});
