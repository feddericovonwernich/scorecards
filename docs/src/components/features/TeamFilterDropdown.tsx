/**
 * TeamFilterDropdown Component
 * Multi-select dropdown for filtering services by team
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ServiceData } from '../../types/index.js';
import { useAppStore, selectServicesAll } from '../../stores/index.js';

// Special value for "No Team Assigned"
const NO_TEAM_VALUE = '__no_team__';

interface TeamFilterDropdownProps {
  services: ServiceData[];
  selectedTeams: string[];
  onTeamsChange: (teams: string[]) => void;
}

/**
 * Extract unique teams from services
 */
function extractTeams(services: ServiceData[]): string[] {
  const teams = new Set<string>();
  services.forEach((service) => {
    if (service.team?.primary) {
      teams.add(service.team.primary);
    }
  });
  return Array.from(teams).sort();
}

/**
 * Check if any service has no team
 */
function hasServicesWithoutTeam(services: ServiceData[]): boolean {
  return services.some((service) => !service.team);
}

/**
 * TeamFilterDropdown component
 */
export function TeamFilterDropdown({
  services,
  selectedTeams,
  onTeamsChange,
}: TeamFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract available teams from services
  const availableTeams = useMemo(() => extractTeams(services), [services]);
  const hasNoTeamServices = useMemo(
    () => hasServicesWithoutTeam(services),
    [services]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Toggle dropdown
  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Toggle team selection
  const handleTeamToggle = useCallback(
    (team: string) => {
      const newTeams = selectedTeams.includes(team)
        ? selectedTeams.filter((t) => t !== team)
        : [...selectedTeams, team];
      onTeamsChange(newTeams);
    },
    [selectedTeams, onTeamsChange]
  );

  // Clear all selections
  const handleClear = useCallback(() => {
    onTeamsChange([]);
  }, [onTeamsChange]);

  // Button text
  const buttonText = useMemo(() => {
    if (selectedTeams.length === 0) {
      return 'All Teams';
    }
    if (selectedTeams.length === 1) {
      const team = selectedTeams[0];
      return team === NO_TEAM_VALUE ? 'No Team' : team;
    }
    return `${selectedTeams.length} teams`;
  }, [selectedTeams]);

  const hasSelection = selectedTeams.length > 0;

  return (
    <div className="team-filter-dropdown" ref={dropdownRef}>
      <button
        className={`team-filter-toggle ${hasSelection ? 'active' : ''}`}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          style={{ marginRight: '8px' }}
        >
          <path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.75.75 0 0 1-1.449.39A3.51 3.51 0 0 0 11 9.5a.75.75 0 0 1 0-1.5 1.5 1.5 0 1 0-.672-2.842.75.75 0 1 1-.67-1.343c.435-.217.917-.335 1.342-.315ZM5.5 4a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 4Z" />
        </svg>
        <span>{buttonText}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="currentColor"
          style={{ marginLeft: '8px' }}
        >
          <path d="m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z" />
        </svg>
      </button>

      <div className={`team-dropdown-menu ${isOpen ? 'open' : ''}`}>
        <div className="team-dropdown-header">
          <span>Filter by Team</span>
          {hasSelection && (
            <button className="team-clear-btn" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>

        <div className="team-dropdown-options">
          {/* No Team Assigned option */}
          {hasNoTeamServices && (
            <label className="team-option">
              <input
                type="checkbox"
                checked={selectedTeams.includes(NO_TEAM_VALUE)}
                onChange={() => handleTeamToggle(NO_TEAM_VALUE)}
              />
              <span className="team-name no-team">No Team Assigned</span>
            </label>
          )}

          {/* Team options */}
          {availableTeams.map((team) => (
            <label key={team} className="team-option">
              <input
                type="checkbox"
                checked={selectedTeams.includes(team)}
                onChange={() => handleTeamToggle(team)}
              />
              <span className="team-name">{team}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * TeamFilterDropdownPortal - Renders into #team-filter-container
 */
export function TeamFilterDropdownPortal() {
  // Find container after component mounts (DOM is guaranteed to be ready)
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  // Get services from Zustand store (reactive)
  const services = useAppStore(selectServicesAll);

  // Find container element after mount
  useEffect(() => {
    const el = document.getElementById('team-filter-container');
    if (el) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Portal container lookup is intentionally once on mount
      setContainer(el);
    }
  }, []);

  // Handle team filter changes
  const handleTeamsChange = useCallback((teams: string[]) => {
    setSelectedTeams(teams);

    // Update filter state in Zustand store and trigger re-filter
    const store = useAppStore.getState();

    // Convert teams array to filter format
    let teamFilter: string | null = null;
    if (teams.length === 1) {
      teamFilter = teams[0];
    } else if (teams.length > 1) {
      teamFilter = teams.join(',');
    }

    // Update store
    store.updateFilters({ teamFilter });

    // Trigger filtering through the store method
    store.filterAndSortServices();

    // Also dispatch event for any legacy listeners
    window.dispatchEvent(
      new CustomEvent('team-filter-changed', { detail: { teams } })
    );
  }, []);

  if (!container) {
    return null;
  }

  return createPortal(
    <TeamFilterDropdown
      services={services}
      selectedTeams={selectedTeams}
      onTeamsChange={handleTeamsChange}
    />,
    container
  );
}

export default TeamFilterDropdown;
