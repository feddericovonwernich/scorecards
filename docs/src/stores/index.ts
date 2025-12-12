/**
 * Stores Index
 * Re-exports all stores for convenient imports
 */

export {
  useAppStore,
  selectServices,
  selectServicesAll,
  selectServicesFiltered,
  selectServicesLoading,
  selectTeams,
  selectTeamsAll,
  selectTeamsFiltered,
  selectFilters,
  selectAuth,
  selectUI,
  selectServiceModal,
  getStoreState,
  subscribeToStore,
} from './appStore';

export type {
  ServicesState,
  TeamsState,
  FiltersState,
  AuthState,
  UIState,
  ServiceModalState,
  AppState,
} from './appStore';
