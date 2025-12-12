/**
 * Services View
 * Main view for displaying services grid with stats and controls
 */

import { useCallback } from 'react';
import { useAppStore } from '../../stores/appStore.js';
import { ServicesStatsSection } from '../features/StatsSection/index.js';
import { ServicesControls } from '../features/ServicesControls/index.js';
import { ServiceGridContainer } from '../containers/ServiceGridContainer.js';
import type { FilterType, FilterState } from '../ui/StatCard.js';

export function ServicesView() {
  // Get filter state and setters from store
  const activeFilters = useAppStore((state) => state.filters.active);
  const setFilter = useAppStore((state) => state.setFilter);

  // Handle filter changes from stat cards
  // setFilter automatically calls filterAndSortServices() which updates
  // services.filtered in the store - React will re-render automatically
  const handleFilterChange = useCallback((filterType: FilterType, mode: FilterState) => {
    setFilter(filterType, mode);
  }, [setFilter]);

  return (
    <div className="view-content active" id="services-view">
      <section className="stats services-stats">
        <ServicesStatsSection
          onFilterChange={handleFilterChange}
          activeFilters={activeFilters}
        />
      </section>

      <section className="controls">
        <ServicesControls />
      </section>

      <ServiceGridContainer />
    </div>
  );
}
