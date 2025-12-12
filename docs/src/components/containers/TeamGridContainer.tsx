/**
 * TeamGridContainer
 *
 * React container that renders TeamGrid using app state.
 * Bridges between Zustand store and React rendering.
 * Handles lazy loading of teams data when view becomes active.
 */

import { useCallback, useEffect } from 'react';
import { TeamGrid } from '../features/TeamCard.js';
import { useAppStore, selectTeamsFiltered, selectDisplayMode, selectCurrentView } from '../../stores/appStore.js';

/**
 * Container component that manages state and renders TeamGrid
 * Triggers teams loading when the teams view becomes active
 */
export function TeamGridContainer() {
  const teams = useAppStore(selectTeamsFiltered);
  const displayMode = useAppStore(selectDisplayMode);
  const currentView = useAppStore(selectCurrentView);

  const handleCardClick = useCallback((teamName: string) => {
    window.showTeamDetail?.(teamName);
  }, []);

  // Lazy load teams when view becomes active
  useEffect(() => {
    if (currentView === 'teams' && teams.length === 0 && window.initTeamsView) {
      // Trigger teams initialization from vanilla JS
      // This will load teams data and populate the store
      window.initTeamsView();
    }
  }, [currentView, teams.length]);

  return (
    <TeamGrid
      teams={teams}
      variant={displayMode}
      onCardClick={handleCardClick}
      emptyMessage="No teams found"
    />
  );
}
