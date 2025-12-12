/**
 * Store Accessor Utilities
 *
 * Provides convenient access to Zustand store from non-React code.
 * Use these sparingly - prefer React hooks in components.
 *
 * @module stores/accessor
 */

import { useAppStore } from './appStore';
import type { ServiceData, TeamData, TeamWithStats } from '../types/index';

/**
 * Get full store state from non-React code
 * Use sparingly - prefer React hooks in components
 */
export function getStore() {
  return useAppStore.getState();
}

// ============= Services Accessors =============

export function getAllServices(): ServiceData[] {
  return useAppStore.getState().services.all;
}

export function getFilteredServices(): ServiceData[] {
  return useAppStore.getState().services.filtered;
}

export function setAllServices(services: ServiceData[]): void {
  useAppStore.getState().setServices(services);
}

export function setFilteredServices(services: ServiceData[]): void {
  useAppStore.getState().setFilteredServices(services);
}

// ============= Teams Accessors =============

export function getAllTeams(): TeamData[] | TeamWithStats[] {
  return useAppStore.getState().teams.all;
}

export function getFilteredTeams(): TeamData[] | TeamWithStats[] {
  return useAppStore.getState().teams.filtered;
}

export function setAllTeams(teams: TeamData[] | TeamWithStats[]): void {
  useAppStore.getState().setTeams(teams);
}

export function setFilteredTeams(teams: TeamData[] | TeamWithStats[]): void {
  useAppStore.getState().setFilteredTeams(teams);
}

export function getTeamsSort(): string {
  return useAppStore.getState().teams.sort;
}

export function getTeamsSearch(): string {
  return useAppStore.getState().teams.search;
}

export function getTeamsActiveFilters(): Map<string, 'include' | 'exclude' | null> {
  return useAppStore.getState().teams.activeFilters;
}

// ============= Filters Accessors =============

export function getActiveFilters(): Map<string, 'include' | 'exclude' | null> {
  return useAppStore.getState().filters.active;
}

export function getSearchQuery(): string {
  return useAppStore.getState().filters.search;
}

export function getCurrentSort(): string {
  return useAppStore.getState().filters.sort;
}

export function setSearchQuery(query: string): void {
  useAppStore.getState().updateFilters({ search: query });
}

export function setCurrentSort(sort: string): void {
  useAppStore.getState().updateFilters({ sort });
}

export function setTeamsSort(sort: string): void {
  useAppStore.getState().updateTeamsState({ sort });
}

export function setTeamsSearch(search: string): void {
  useAppStore.getState().updateTeamsState({ search });
}

export function setFilter(filterName: string, mode: 'include' | 'exclude' | null): void {
  useAppStore.getState().setFilter(filterName, mode);
}

export function setTeamsFilter(filterName: string, mode: 'include' | 'exclude' | null): void {
  const store = useAppStore.getState();
  const newFilters = new Map(store.teams.activeFilters);
  if (mode === null) {
    newFilters.delete(filterName);
  } else {
    newFilters.set(filterName, mode);
  }
  store.updateTeamsState({ activeFilters: newFilters });
}

// ============= UI Accessors =============

export function getChecksHash(): string | null {
  return useAppStore.getState().ui.checksHash;
}

export function getChecksHashTimestamp(): number {
  return useAppStore.getState().ui.checksHashTimestamp;
}

export function setChecksHash(hash: string | null): void {
  useAppStore.getState().setChecksHash(hash);
}

// ============= Auth Accessors =============

export function getGitHubPAT(): string | null {
  return useAppStore.getState().auth.pat;
}

export function setGitHubPAT(pat: string | null): void {
  useAppStore.getState().setAuth(pat);
}

// ============= Actions =============

export function filterAndRenderServices(): void {
  useAppStore.getState().filterAndSortServices();
}
