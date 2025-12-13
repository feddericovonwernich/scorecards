/**
 * ServiceGridContainer
 *
 * React container that renders ServiceGrid using app state.
 * Bridges between Zustand store and React rendering.
 */

import { useCallback } from 'react';
import { ServiceGrid } from '../features/ServiceCard.js';
import {
  useAppStore,
  selectServicesFiltered,
  selectChecksHash,
  selectDisplayMode,
} from '../../stores/appStore.js';
import { isServiceStale } from '../../services/staleness.js';
import { triggerServiceWorkflow } from '../../api/workflow-triggers.js';
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
  const services = useAppStore(selectServicesFiltered);
  const checksHash = useAppStore(selectChecksHash);
  const displayMode = useAppStore(selectDisplayMode);

  const handleCardClick = useCallback((org: string, repo: string) => {
    window.showServiceDetail?.(org, repo);
  }, []);

  const handleTeamClick = useCallback((teamName: string) => {
    window.showTeamDetail?.(teamName);
  }, []);

  const handleTriggerWorkflow = useCallback((org: string, repo: string) => {
    return triggerServiceWorkflow(org, repo);
  }, []);

  return (
    <section
      id="services-grid"
      className={`services-grid${displayMode === 'list' ? ' services-grid--list' : ''}`}
    >
      <ServiceGrid
        services={services}
        checksHash={checksHash}
        variant={displayMode}
        isServiceStale={checkServiceStale}
        onCardClick={handleCardClick}
        onTeamClick={handleTeamClick}
        onTriggerWorkflow={handleTriggerWorkflow}
      />
    </section>
  );
}
