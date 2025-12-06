/**
 * CheckAdoptionDashboard Component
 * Modal showing check adoption rates across all teams
 * Replaces vanilla JS ui/check-adoption-dashboard.ts
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../../ui/Modal.js';
import { useAppStore, selectServicesAll } from '../../../stores/appStore.js';
import { loadChecks } from '../../../api/checks.js';
import {
  calculateCheckAdoptionByTeam,
  sortTeamsByAdoption,
  calculateOverallCheckAdoption,
} from '../../../utils/check-statistics.js';
import { cn } from '../../../utils/css.js';
import type { ChecksData } from '../../../types/index.js';

interface CheckAdoptionDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type SortDirection = 'asc' | 'desc';
type SortBy = 'name' | 'percentage';

export function CheckAdoptionDashboard({ isOpen, onClose }: CheckAdoptionDashboardProps) {
  const services = useAppStore(selectServicesAll);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [checksData, setChecksData] = useState<ChecksData | null>(null);
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('percentage');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) {return;}

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Load checks data when modal opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await loadChecks();
        if (!cancelled) {
          setChecksData(data);
          if (data.checks.length > 0) {
            setSelectedCheckId((prev) => prev ?? data.checks[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load checks:', err);
        if (!cancelled) {
          setChecksData({ checks: [], categories: [], version: '', count: 0 });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Filter checks based on search
  const filteredChecks = useMemo(() => {
    if (!checksData?.checks) {return [];}
    if (!searchQuery) {return checksData.checks;}

    const query = searchQuery.toLowerCase();
    return checksData.checks.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query) ||
        c.category?.toLowerCase().includes(query)
    );
  }, [checksData, searchQuery]);

  // Calculate overall stats for selected check
  const overallStats = useMemo(() => {
    if (!selectedCheckId) {return null;}
    return calculateOverallCheckAdoption(services, selectedCheckId);
  }, [services, selectedCheckId]);

  // Calculate team adoption stats
  const teamStats = useMemo(() => {
    if (!selectedCheckId) {return [];}

    const stats = calculateCheckAdoptionByTeam(services, selectedCheckId);
    const sorted = sortTeamsByAdoption(stats, sortDirection);

    // Apply name sorting if selected
    if (sortBy === 'name') {
      sorted.sort((a, b) => {
        const comparison = a.teamName.localeCompare(b.teamName);
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return sorted;
  }, [services, selectedCheckId, sortBy, sortDirection]);

  const selectedCheck = checksData?.checks.find((c) => c.id === selectedCheckId);

  const handleSelectCheck = (checkId: string) => {
    setSelectedCheckId(checkId);
    setDropdownOpen(false);
  };

  const handleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };

  const getProgressClass = (percentage: number): string => {
    if (percentage >= 80) {return 'bg-success';}
    if (percentage >= 50) {return 'bg-warning';}
    return 'bg-error';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="check-adoption-modal max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      testId="check-adoption-modal"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="check-adoption-header">
          <h2>Check Adoption Dashboard</h2>

          {/* Check Card Selector */}
          <div className="check-card-selector" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={cn('check-card-selected', dropdownOpen && 'open')}
            >
              {selectedCheck ? (
                <>
                  <div className="check-card-header">
                    <span className="check-card-name">{selectedCheck.name}</span>
                    <span className="check-card-category">{selectedCheck.category}</span>
                    <svg
                      className="check-card-chevron"
                      width="20"
                      height="20"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 0 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z" />
                    </svg>
                  </div>
                  <p className="check-card-description">{selectedCheck.description}</p>
                </>
              ) : (
                <span className="check-card-placeholder">Select a check to view adoption...</span>
              )}
            </button>

            {/* Dropdown with card options */}
            <div className={cn('check-card-dropdown', dropdownOpen && 'open')}>
              <div className="check-card-search">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search checks..."
                  autoFocus={dropdownOpen}
                />
              </div>
              <div className="check-card-options">
                {filteredChecks.map((check) => (
                  <button
                    key={check.id}
                    onClick={() => handleSelectCheck(check.id)}
                    className={cn('check-card-option', check.id === selectedCheckId && 'selected')}
                  >
                    <div className="check-card-option-header">
                      <span className="check-card-name">{check.name}</span>
                      <span className="check-card-category">{check.category}</span>
                    </div>
                    <p className="check-card-option-desc">
                      {check.description?.slice(0, 100)}{check.description && check.description.length > 100 ? '...' : ''}
                    </p>
                  </button>
                ))}
                {filteredChecks.length === 0 && (
                  <div className="check-card-empty">No checks found</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        {overallStats && (
          <div className="adoption-stats-row">
            <div className="adoption-stat-card">
              <div className="adoption-stat-value success">{overallStats.passing}/{overallStats.passing + overallStats.failing}</div>
              <div className="adoption-stat-label">Services Passing</div>
            </div>
            <div className="adoption-stat-card">
              <div className="adoption-stat-value error">{overallStats.failing}</div>
              <div className="adoption-stat-label">Services Failing</div>
            </div>
            <div className={cn('adoption-stat-card', overallStats.excluded > 0 && 'excluded')}>
              <div className="adoption-stat-value muted">{overallStats.excluded}</div>
              <div className="adoption-stat-label">Excluded</div>
            </div>
            <div className="adoption-stat-card">
              <div className="adoption-stat-value accent">{overallStats.percentage}%</div>
              <div className="adoption-stat-label">Adoption</div>
            </div>
          </div>
        )}

        {/* Team Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-text-muted">Loading checks...</div>
            </div>
          ) : teamStats.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-text-muted">No team data available</div>
            </div>
          ) : (
            <table className="adoption-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')}>
                    Team
                    {sortBy === 'name' && (
                      <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th onClick={() => handleSort('percentage')} style={{ textAlign: 'center', width: '100px' }}>
                    Adoption
                    {sortBy === 'percentage' && (
                      <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th style={{ textAlign: 'center', width: '160px' }}>
                    Progress
                  </th>
                  <th style={{ textAlign: 'center', width: '80px' }}>
                    Passing
                  </th>
                  <th style={{ textAlign: 'center', width: '64px' }}>
                    Excl.
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamStats.map((team) => {
                  const isNoTeam = team.teamName === 'No Team' || team.teamName === 'Unassigned';
                  return (
                    <tr
                      key={team.teamName}
                      className={cn('adoption-row', isNoTeam && 'no-team')}
                      onClick={() => {
                        if (!isNoTeam && window.showTeamModal) {
                          window.showTeamModal(team.teamName);
                        }
                      }}
                    >
                      <td className="adoption-cell">
                        <div className="team-name">{team.teamName}</div>
                        <div className="team-services">{team.total} service{team.total !== 1 ? 's' : ''}</div>
                      </td>
                      <td className="adoption-cell" style={{ textAlign: 'center' }}>
                        <span className="adoption-percentage">{team.percentage}%</span>
                      </td>
                      <td className="adoption-cell">
                        <div className="progress-bar-inline">
                          <div
                            className={cn('progress-fill', getProgressClass(team.percentage))}
                            style={{ width: `${team.percentage}%` }}
                          />
                        </div>
                      </td>
                      <td className="adoption-cell" style={{ textAlign: 'center' }}>
                        <span className="passing-count">{team.passing}</span>
                      </td>
                      <td className={cn('adoption-cell', team.excluded > 0 && 'has-excluded')} style={{ textAlign: 'center' }}>
                        <span className="excluded-count">{team.excluded > 0 ? team.excluded : '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default CheckAdoptionDashboard;
