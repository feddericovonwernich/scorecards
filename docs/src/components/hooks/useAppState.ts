/**
 * React hooks for connecting to application state
 *
 * Bridges between vanilla JS state management and React components
 */

import { useState, useEffect, useCallback } from 'react';
import { subscribe, getStateSlice } from '../../services/state.js';
import type { ServiceData } from '../../types/index.js';

// TeamWithStats type matching globals.d.ts
interface TeamWithStats {
  id?: string;
  name: string;
  description?: string;
  slug?: string;
  github_org?: string;
  github_slug?: string;
  serviceCount?: number;
  averageScore?: number;
  installedCount?: number;
  staleCount?: number;
  rankDistribution?: Record<string, number>;
  slack_channel?: string | null;
  metadata?: {
    slack_channel?: string;
  };
  statistics?: {
    serviceCount: number;
    averageScore: number;
    installedCount: number;
    staleCount: number;
    rankDistribution: Record<string, number>;
  };
}

/**
 * Hook to get filtered services from app state
 * Listens to both state module and window globals for compatibility
 */
export function useFilteredServices(): ServiceData[] {
  const [services, setServices] = useState<ServiceData[]>(() => {
    // Initialize from window or state
    return window.filteredServices ?? getStateSlice('services').filtered ?? [];
  });

  useEffect(() => {
    // Subscribe to state module changes
    const unsubscribe = subscribe('services', (servicesState) => {
      setServices(servicesState.filtered);
    });

    // Also listen for custom events from vanilla JS
    const handleServicesUpdate = () => {
      if (window.filteredServices) {
        setServices([...window.filteredServices]);
      }
    };

    // Poll for window.filteredServices changes (vanilla JS updates this directly)
    // This is a bridge during migration - will be removed when fully React
    const pollInterval = setInterval(() => {
      const currentFiltered = window.filteredServices ?? [];
      setServices((prev) => {
        // Only update if actually different (compare by length and first/last items)
        if (prev.length !== currentFiltered.length) {
          return [...currentFiltered];
        }
        if (prev.length > 0 && currentFiltered.length > 0) {
          const firstMatch = prev[0]?.repo === currentFiltered[0]?.repo;
          const lastMatch = prev[prev.length - 1]?.repo === currentFiltered[currentFiltered.length - 1]?.repo;
          if (!firstMatch || !lastMatch) {
            return [...currentFiltered];
          }
        }
        return prev;
      });
    }, 100);

    window.addEventListener('services-updated', handleServicesUpdate);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
      window.removeEventListener('services-updated', handleServicesUpdate);
    };
  }, []);

  return services;
}

/**
 * Hook to get current checks hash for staleness detection
 */
export function useChecksHash(): string | null {
  const [checksHash, setChecksHash] = useState<string | null>(() => {
    return window.currentChecksHash ?? getStateSlice('ui').checksHash ?? null;
  });

  useEffect(() => {
    const unsubscribe = subscribe('ui', (uiState) => {
      setChecksHash(uiState.checksHash);
    });

    // Poll for window changes
    const pollInterval = setInterval(() => {
      const currentHash = window.currentChecksHash ?? null;
      setChecksHash((prev) => prev !== currentHash ? currentHash : prev);
    }, 100);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  return checksHash;
}

/**
 * Hook to get teams data with sorting and filtering applied
 */
export function useTeams(): TeamWithStats[] {
  const [teams, setTeams] = useState<TeamWithStats[]>(() => {
    // Use filteredTeams if it has items, otherwise fall back to allTeams
    const filtered = window.filteredTeams;
    const all = window.allTeams;
    return (filtered && filtered.length > 0) ? filtered : (all ?? []);
  });

  useEffect(() => {
    const unsubscribe = subscribe('teams', (teamsState) => {
      setTeams(teamsState.filtered as TeamWithStats[]);
    });

    // Poll for window changes
    const pollInterval = setInterval(() => {
      // Use filteredTeams if it has items, otherwise fall back to allTeams
      const filtered = window.filteredTeams;
      const all = window.allTeams;
      const currentTeams = (filtered && filtered.length > 0) ? filtered : (all ?? []);
      setTeams((prev) => {
        if (prev.length !== currentTeams.length) {
          return [...currentTeams];
        }
        if (prev.length > 0 && currentTeams.length > 0) {
          const firstMatch = prev[0]?.name === currentTeams[0]?.name;
          const lastMatch = prev[prev.length - 1]?.name === currentTeams[currentTeams.length - 1]?.name;
          if (!firstMatch || !lastMatch) {
            return [...currentTeams];
          }
        }
        return prev;
      });
    }, 100);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  return teams;
}

/**
 * Hook to get current view (services or teams)
 */
export function useCurrentView(): 'services' | 'teams' {
  const [view, setView] = useState<'services' | 'teams'>(() => {
    return window.currentView ?? 'services';
  });

  useEffect(() => {
    const unsubscribe = subscribe('ui', (uiState) => {
      setView(uiState.currentView);
    });

    // Poll for window changes
    const pollInterval = setInterval(() => {
      const currentView = window.currentView ?? 'services';
      setView((prev) => prev !== currentView ? currentView : prev);
    }, 100);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  return view;
}

/**
 * Hook providing callbacks for service card interactions
 */
export function useServiceCallbacks() {
  const handleCardClick = useCallback((org: string, repo: string) => {
    window.showServiceDetail?.(org, repo);
  }, []);

  const handleTeamClick = useCallback((teamName: string) => {
    window.showTeamDetail?.(teamName);
  }, []);

  const handleTriggerWorkflow = useCallback((org: string, repo: string, button: HTMLButtonElement) => {
    window.triggerServiceWorkflow?.(org, repo, button);
  }, []);

  return {
    handleCardClick,
    handleTeamClick,
    handleTriggerWorkflow,
  };
}

/**
 * Hook providing callbacks for team card interactions
 */
export function useTeamCallbacks() {
  const handleCardClick = useCallback((teamName: string) => {
    window.showTeamDetail?.(teamName);
  }, []);

  return {
    handleCardClick,
  };
}
