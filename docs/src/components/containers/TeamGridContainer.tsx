/**
 * TeamGridContainer
 *
 * React container that renders TeamGrid using app state.
 * Bridges between vanilla JS state management and React rendering.
 */

import { TeamGrid } from '../features/TeamCard.js';
import { useTeams, useTeamCallbacks } from '../hooks/index.js';

/**
 * Container component that manages state and renders TeamGrid
 */
export function TeamGridContainer() {
  const teams = useTeams();
  const { handleCardClick } = useTeamCallbacks();

  return (
    <TeamGrid
      teams={teams}
      onCardClick={handleCardClick}
      emptyMessage="No teams found"
    />
  );
}
