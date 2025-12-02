/**
 * ServiceGridContainer
 *
 * React container that renders ServiceGrid using app state.
 * Bridges between vanilla JS state management and React rendering.
 */

import { ServiceGrid } from '../features/ServiceCard.js';
import {
  useFilteredServices,
  useChecksHash,
  useServiceCallbacks,
} from '../hooks/index.js';
import { isServiceStale } from '../../services/staleness.js';
import type { ServiceData } from '../../types/index.js';

/**
 * Wrapper for isServiceStale that matches the expected signature
 */
function checkServiceStale(service: ServiceData, checksHash: string | null): boolean {
  return isServiceStale(service, checksHash);
}

/**
 * Container component that manages state and renders ServiceGrid
 */
export function ServiceGridContainer() {
  const services = useFilteredServices();
  const checksHash = useChecksHash();
  const { handleCardClick, handleTeamClick, handleTriggerWorkflow } = useServiceCallbacks();

  return (
    <ServiceGrid
      services={services}
      checksHash={checksHash}
      isServiceStale={checkServiceStale}
      onCardClick={handleCardClick}
      onTeamClick={handleTeamClick}
      onTriggerWorkflow={handleTriggerWorkflow}
    />
  );
}
