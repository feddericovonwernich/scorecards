/**
 * Global type declarations
 *
 * After React migration, window globals are minimal.
 * Application state is managed by Zustand store.
 * Component interactions use React state and props.
 *
 * Only legitimate window exports remain (primarily for modal orchestration
 * and backwards compatibility during transition).
 */

import type { ToastType } from './index.js';

declare global {
  interface Window {
    // ============= Modal Functions (exposed by ModalOrchestrator) =============
    // These are set by ModalOrchestrator component to allow external triggers
    showToast?: (message: string, type?: ToastType | string) => void;
    showServiceDetail?: (org: string, repo: string) => Promise<void>;
    showTeamModal?: (teamName: string) => Promise<void>;
    showTeamDetail?: (teamName: string) => Promise<void>;
    closeModal?: () => void;
    closeTeamModal?: () => void;
    openCheckFilterModal?: () => void;
    openSettings?: () => void;
    toggleActionsWidget?: () => void;
    openTeamDashboard?: () => void;
    openTeamEditModal?: (mode?: 'create' | 'edit', teamId?: string) => void;
    openCheckAdoptionDashboard?: () => void;

    // ============= Legacy (to be removed) =============
    // These are only used during transition and should be removed
    initTeamsView?: () => Promise<void>;
  }
}

export {};
