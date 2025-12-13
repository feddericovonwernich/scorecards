/**
 * TeamGridContainer
 *
 * React container that renders TeamGrid using app state.
 * Bridges between Zustand store and React rendering.
 *
 * Note: With React Router, this component is only rendered when on /teams route.
 * Teams data loading is handled by TeamsView's useEffect.
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
    <section
      id="teams-grid"
      className={`teams-grid${displayMode === 'list' ? ' teams-grid--list' : ''}`}
    >
      <TeamGrid
        teams={teams}
        variant={displayMode}
        onCardClick={handleCardClick}
        emptyMessage="No teams found"
      />
    </section>
  );
}
