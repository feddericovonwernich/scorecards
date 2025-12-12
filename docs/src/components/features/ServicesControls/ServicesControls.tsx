/**
 * Services Controls Component
 * Handles search, sort, refresh, and bulk trigger actions for services view
 */

import { useState, type ChangeEvent } from 'react';
import { useAppStore } from '../../../stores/appStore';
import { useDebounce } from '../../../hooks/useDebounce';
import { useButtonState } from '../../../hooks/useButtonState';
import { triggerBulkWorkflows } from '../../../api/workflow-triggers-react';
import { ActionButton } from '../../ui/ActionButton';
import { refreshData } from '../../../app-init';
import { isServiceStale } from '../../../services/staleness';
import { showToastGlobal } from '../../ui/Toast';
import type { ServiceData } from '../../../types/index';

export function ServicesControls() {
  const updateFilters = useAppStore((state) => state.updateFilters);
  const filters = useAppStore((state) => state.filters);
  const services = useAppStore((state) => state.services.all);
  const checksHash = useAppStore((state) => state.ui.checksHash);

  const [searchValue, setSearchValue] = useState(filters.search);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Button states for bulk operations
  const bulkStaleButton = useButtonState();
  const bulkAllButton = useButtonState();

  // Debounce search to avoid excessive re-renders
  useDebounce(
    () => {
      updateFilters({ search: searchValue });
    },
    300,
    [searchValue]
  );

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ sort: e.target.value });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBulkTriggerStale = async () => {
    const staleServices = services.filter(
      (s: ServiceData) => isServiceStale(s, checksHash) && s.installed
    );

    if (staleServices.length === 0) {
      showToastGlobal('No stale services to trigger', 'info');
      return;
    }

    if (
      !confirm(`Trigger workflows for ${staleServices.length} stale service(s)?`)
    ) {
      return;
    }

    bulkStaleButton.setLoading();
    const success = await triggerBulkWorkflows(staleServices);

    if (success) {
      bulkStaleButton.setSuccess();
    } else {
      bulkStaleButton.setError();
    }
  };

  const handleBulkTriggerAll = async () => {
    const installedServices = services.filter((s: ServiceData) => s.installed);

    if (installedServices.length === 0) {
      showToastGlobal('No installed services to trigger', 'info');
      return;
    }

    if (
      !confirm(
        `Trigger workflows for ALL ${installedServices.length} installed service(s)?`
      )
    ) {
      return;
    }

    bulkAllButton.setLoading();
    const success = await triggerBulkWorkflows(installedServices);

    if (success) {
      bulkAllButton.setSuccess();
    } else {
      bulkAllButton.setError();
    }
  };

  return (
    <section className="controls">
      <input
        type="text"
        id="search-input"
        placeholder="Search services..."
        className="search-box"
        value={searchValue}
        onChange={handleSearchChange}
      />

      <select
        id="sort-select"
        className="sort-select"
        aria-label="Sort by"
        value={filters.sort}
        onChange={handleSortChange}
      >
        <option value="score-desc">Score: High to Low</option>
        <option value="score-asc">Score: Low to High</option>
        <option value="name-asc">Name: A to Z</option>
        <option value="name-desc">Name: Z to A</option>
        <option value="updated-desc">Recently Updated</option>
      </select>

      <button
        id="refresh-btn"
        className="refresh-btn"
        onClick={handleRefresh}
        disabled={isRefreshing}
        title="Re-fetch service data from catalog"
      >
        <RefreshIcon spinning={isRefreshing} />
        {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
      </button>

      <ActionButton
        state={bulkStaleButton.state}
        onClick={handleBulkTriggerStale}
        loadingText="Triggering..."
        successText="Triggered!"
        errorText="Failed"
        variant="bulk"
      >
        <RefreshIcon />
        Re-run All Stale
      </ActionButton>

      <ActionButton
        state={bulkAllButton.state}
        onClick={handleBulkTriggerAll}
        loadingText="Triggering..."
        successText="Triggered!"
        errorText="Failed"
        variant="neutral"
        title="Trigger scorecard workflow for all installed services"
      >
        <RefreshIcon />
        Re-run All Installed
      </ActionButton>
    </section>
  );
}

function RefreshIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      style={{ marginRight: 6 }}
      className={spinning ? 'spinning' : ''}
    >
      <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.75 0 0 1 .25.25v3.646a.25.75 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
    </svg>
  );
}
