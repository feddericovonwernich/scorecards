/**
 * TeamGridContainer
 *
 * React container that renders TeamGrid using app state.
 * Bridges between Zustand store and React rendering.
 */

import { useCallback } from 'react';
import { TeamGrid } from '../features/TeamCard.js';
import { useAppStore, selectTeamsFiltered, selectDisplayMode } from '../../stores/appStore.js';

/**
 * Container component that manages state and renders TeamGrid
 */
export function TeamGridContainer() {
  const teams = useAppStore(selectTeamsFiltered);
  const displayMode = useAppStore(selectDisplayMode);

  const handleCardClick = useCallback((teamName: string) => {
    window.showTeamDetail?.(teamName);
  }, []);

  return (
    <TeamGrid
      teams={teams}
      variant={displayMode}
      onCardClick={handleCardClick}
      emptyMessage="No teams found"
    />
  );
}
