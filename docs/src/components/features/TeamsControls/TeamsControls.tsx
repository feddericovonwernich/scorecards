/**
 * Teams Controls Component
 * Handles search, sort, refresh, and team management actions for teams view
 */

import { useState, type ChangeEvent } from 'react';
import { useAppStore } from '../../../stores/appStore';
import { useDebounce } from '../../../hooks/useDebounce';

export function TeamsControls() {
  const teams = useAppStore((state) => state.teams);
  const updateTeamsState = useAppStore((state) => state.updateTeamsState);
  const filterAndSortTeams = useAppStore((state) => state.filterAndSortTeams);

  const [searchValue, setSearchValue] = useState(teams.search);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useDebounce(
    () => {
      updateTeamsState({ search: searchValue });
      filterAndSortTeams();
    },
    300,
    [searchValue]
  );

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateTeamsState({ sort: e.target.value });
    filterAndSortTeams();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Call refresh teams function
      if (window.refreshTeamsView) {
        await window.refreshTeamsView();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateTeam = () => {
    if (window.openTeamEditModal) {
      window.openTeamEditModal('create');
    }
  };

  const handleCheckAdoption = () => {
    if (window.openCheckAdoptionDashboard) {
      window.openCheckAdoptionDashboard();
    }
  };

  return (
    <section className="controls teams-controls">
      <input
        type="text"
        id="teams-search-input"
        placeholder="Search teams..."
        className="search-box"
        value={searchValue}
        onChange={handleSearchChange}
      />

      <select
        id="teams-sort-select"
        className="sort-select"
        value={teams.sort}
        onChange={handleSortChange}
      >
        <option value="score-desc">Score: High to Low</option>
        <option value="score-asc">Score: Low to High</option>
        <option value="services-desc">Services: High to Low</option>
        <option value="services-asc">Services: Low to High</option>
        <option value="name-asc">Name: A to Z</option>
        <option value="name-desc">Name: Z to A</option>
      </select>

      <button
        className="refresh-btn"
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        <RefreshIcon spinning={isRefreshing} />
        Refresh Data
      </button>

      <button className="create-btn" onClick={handleCreateTeam}>
        + Create Team
      </button>

      <button
        className="trigger-btn trigger-btn-accent"
        onClick={handleCheckAdoption}
        title="View check adoption rates across all teams"
      >
        <CheckIcon />
        Check Adoption
      </button>
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
      <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      style={{ marginRight: 6 }}
    >
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
    </svg>
  );
}
